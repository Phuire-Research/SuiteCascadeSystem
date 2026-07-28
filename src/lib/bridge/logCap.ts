import { statSync, readFileSync, writeFileSync, renameSync, appendFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { bridgeRoot } from './paths';

// D-LHT · Log auto-truncation. Doc-grounded (WebSearch): electron-log (the desktop peer) caps at
// ~1MB/file; server tools (winston '20m' · pino '10m') run 10-20×. Our sinks hit 342MB — grossly
// unbounded. Keep the last N LINES (drop OLDEST · the user's "truncating of oldest") with a byte
// backstop, via ATOMIC tmp+rename — NOT an in-place truncate: logrotate's copytruncate has a
// documented race that loses data under a concurrent reader (our watchers read these files). JSONL
// (one object/line) is the only format safe to tail-truncate. Default 10k lines / 5MB matches the
// existing scpClientLogs 5MB cap for parity.
export const LOG_MAX_LINES = 10_000;
export const LOG_MAX_BYTES = 5_000_000;

const appendCounters = new Map<string, number>();

/**
 * Cap a JSONL log file to its last `maxLines` lines (drop oldest) — atomic + watcher-safe.
 * Amortized: the stat + trim runs on the FIRST call per path (catches a file left huge by a prior
 * session) and every `checkEvery` calls thereafter, so it is not a full re-read per log line.
 * Best-effort — never throws into the write path.
 */
export function capLogFile(
  path: string,
  maxLines = LOG_MAX_LINES,
  maxBytes = LOG_MAX_BYTES,
  checkEvery = 500,
): void {
  const n = (appendCounters.get(path) ?? 0) + 1;
  appendCounters.set(path, n);
  if (n !== 1 && n % checkEvery !== 0) return;
  try {
    let size = 0;
    try {
      size = statSync(path).size;
    } catch {
      return; // no file yet — nothing to cap
    }
    if (size <= maxBytes) return; // under the byte backstop → cheap exit (no read)
    const lines = readFileSync(path, 'utf8').split('\n');
    // Keep the last maxLines records (drop oldest); slice preserves a trailing '' if present.
    const kept = lines.slice(Math.max(0, lines.length - maxLines));
    const tmp = `${path}.tmp`;
    writeFileSync(tmp, kept.join('\n'));
    renameSync(tmp, path); // ATOMIC: a concurrent reader sees old-or-new inode, never a half-file
  } catch {
    /* best-effort — log capping must never crash a write path */
  }
}

/**
 * D-LHT Fix A · the general terminal-output sink. UNGATED (unlike debugLog.log which is
 * debugEnabled-gated) — captures stray console/stdout/stderr that would otherwise corrupt the TUI
 * alt-screen, piped here as JSONL instead. Self-capping via capLogFile.
 */
export function terminalOutputPath(): string {
  return join(bridgeRoot(), 'terminal-output.json');
}

export function appendTerminalOutput(stream: string, text: string): void {
  try {
    const trimmed = text.replace(/\r?\n$/, '');
    if (trimmed.length === 0) return;
    const path = terminalOutputPath();
    mkdirSync(dirname(path), { recursive: true });
    const entry = { ts: new Date().toISOString(), stream, text: trimmed };
    appendFileSync(path, JSON.stringify(entry) + '\n');
    capLogFile(path);
  } catch {
    /* swallow — the redirect must never crash the TUI */
  }
}
