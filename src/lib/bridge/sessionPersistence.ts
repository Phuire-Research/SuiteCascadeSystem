import { existsSync, readdirSync, statSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

/**
 * Diamond L (calibrated by Diamond P): Blank Session Filter (Pattern 4 Modulation).
 *
 * Pattern 4 SPIRIT preserved — Bridge does NOT parse or read .claude/projects content.
 * Pattern 4 LETTER evolved — metadata-only stat (existsSync + statSync.size) is permitted.
 *
 * Boundary: content-read forbidden against the projects directory; metadata stat is OK.
 * Wave 14 v2 grep gate enforces this (no readFileSync/JSON.parse against the path).
 *
 * Threshold: 5KB. Empirical distribution (Diamond P, Cycle 19) — Layer-4 stat of real
 * project JSONLs at ~/.claude/projects/-Users-...:
 *   2-3KB cluster:  claude-died-early sessions (no real exchange) — correctly blank
 *   9-10KB cluster: single user→assistant exchanges (e.g. "Stand By"→"Standing by")
 *                    = real minimum-viable conversations
 *   51KB+:          multi-turn or extended conversations
 *
 * 5KB cleanly bisects dead-startup-only (≤3KB) from single-real-exchange (≥9KB) with
 * no overlap. Diamond L Fix C originally picked 15KB based on Claude Code documentation
 * inference; Diamond P empirical evidence corrects to 5KB. The 9KB single-exchange
 * cluster was being silently filtered out under 15KB — that is the false-negative
 * Diamond P repairs.
 *
 * CD-17 Empirical-Layer-4 Threshold Validation Diameter names the meta-pattern:
 * threshold heuristics in Bridge MUST be grounded in stat of real files, not in
 * upstream documentation guess. Re-runnable: the cluster boundaries are checkable
 * any time via `stat ~/.claude/projects/<encoded-cwd>/*.jsonl`.
 */
export const BLANK_SIZE_THRESHOLD_BYTES = 5 * 1024;

/**
 * Mirror Claude Code's projects-dir encoding: replace '/' with '-'.
 * Absolute paths therefore start with a leading '-'.
 *
 * Example: '/Users/foo/proj' → '-Users-foo-proj'.
 */
export function encodeCwdForClaudeProjects(cwd: string): string {
  return cwd.replace(/\//g, '-');
}

/**
 * Returns the on-disk path Claude would use for a given (cwd, claudeSessionId).
 * Path is informational; we never read its content here — only existsSync + statSync.
 */
export function claudeSessionJsonlPath(cwd: string, claudeSessionId: string): string {
  return join(
    homedir(),
    '.claude',
    'projects',
    encodeCwdForClaudeProjects(cwd),
    `${claudeSessionId}.jsonl`,
  );
}

/**
 * Metadata-only persistence check: does Claude have a non-empty JSONL for this session?
 *
 * - existsSync(path): file present?
 * - statSync(path).size > BLANK_SIZE_THRESHOLD_BYTES: any content recorded?
 *
 * Returns false on any error (missing file, stat failure). Never throws.
 *
 * IMPORTANT: This function MUST NOT read file content. The Pattern 4 Modulation
 * (SB-S20) draws the line at metadata; reading or parsing the JSONL contents
 * remains prohibited.
 */
export function hasPersistedSession(cwd: string, claudeSessionId: string): boolean {
  const path = claudeSessionJsonlPath(cwd, claudeSessionId);
  if (!existsSync(path)) return false;
  try {
    return statSync(path).size > BLANK_SIZE_THRESHOLD_BYTES;
  } catch {
    return false;
  }
}

/**
 * Diamond N Fix N-D2: metadata-only mtime read for orphan-detection (Pattern 4 Modulation).
 *
 * Returns the JSONL file's mtimeMs (epoch ms) if the file exists, null otherwise.
 * statSync.mtimeMs is the FOURTH metadata channel (existsSync, statSync.size,
 * readdirSync, mtimeMs) — Pattern 4 SPIRIT preserved (no readFileSync, no JSON.parse).
 *
 * Used by animatedTui's liveness tick to detect Terminal-close orphans:
 * if claudePid is alive AND mtimeMs has not advanced for ORPHAN_DETECTION_MS,
 * the session is treated as a zombie and routed to offline.
 */
export function getJsonlMtime(cwd: string, claudeSessionId: string): number | null {
  const path = claudeSessionJsonlPath(cwd, claudeSessionId);
  try {
    return statSync(path).mtimeMs;
  } catch {
    return null;
  }
}

/**
 * Diamond M Fix M-3: Auto-Discovery via filesystem-metadata scan.
 *
 * Discovered persisted Claude sessions on disk that exceed BLANK_SIZE_THRESHOLD_BYTES.
 * Pattern 4 Modulation preserved: readdirSync (filenames only) + statSync (size + mtime).
 * NO readFileSync. NO JSON.parse on JSONL content. Wave 14 v2 grep gate stays ZERO.
 *
 * Used at TUI startup to surface real persisted sessions absent from registry.json
 * (e.g. machine restart wiped the registry but ~/.claude/projects/ still has the JSONLs).
 */
export type DiscoveredSession = {
  claudeSessionId: string;
  sizeBytes: number;
  mtimeMs: number;
};

export function discoverPersistedSessions(cwd: string): DiscoveredSession[] {
  const dir = join(homedir(), '.claude', 'projects', encodeCwdForClaudeProjects(cwd));
  let entries: string[] = [];
  try {
    entries = readdirSync(dir);
  } catch {
    return [];
  }
  const result: DiscoveredSession[] = [];
  for (const name of entries) {
    if (!name.endsWith('.jsonl')) continue;
    const claudeSessionId = name.replace(/\.jsonl$/, '');
    const path = join(dir, name);
    try {
      const stat = statSync(path);
      if (stat.size > BLANK_SIZE_THRESHOLD_BYTES) {
        result.push({ claudeSessionId, sizeBytes: stat.size, mtimeMs: stat.mtimeMs });
      }
    } catch {
      // skip unreadable entries
    }
  }
  return result;
}

/**
 * Diamond M Fix M-3 + Green Issue 2 fix: synthesize a deterministic ULID-shaped key for a
 * discovered session. Format: `01DISCOVERED-<base36-mtime>-<claudeSessionId-prefix>`.
 *
 * The claudeSessionId prefix breaks mtime ties on coarse-resolution filesystems (HFS+ 1s):
 * two JSONLs born in the same second get distinct synthesized IDs and `addSession`'s
 * dedup-by-id no longer silently drops the second.
 */
export function synthesizeDiscoveredUlid(mtimeMs: number, claudeSessionId: string): string {
  const mtimeB36 = Math.floor(mtimeMs).toString(36).toUpperCase().padStart(10, '0');
  const tieBreaker = claudeSessionId.slice(0, 6).toUpperCase();
  return `01DISCOVERED-${mtimeB36}-${tieBreaker}`;
}
