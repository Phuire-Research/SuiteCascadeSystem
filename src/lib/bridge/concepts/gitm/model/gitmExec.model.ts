/**
 * GITMEXEC Model · GITM D3 (#634) · the ONE subprocess seam for the 13 T2 actions
 *
 * One execFileSync('git', ...) wrapper shared by all 13 T2 action qualities.
 * PURE + testable: NO Stratimux imports. `gitmExec` is the single subprocess
 * seam (mirror gitmStatus.model.ts readGitStatus discipline — bounded sync exec
 * on the action-queue beat). `parseGitmLog` is the pure log-parse seam (fixture-
 * testable without a process).
 *
 * GITMUX boundary: this model RUNS the T2 operations the user explicitly invoked
 * via the MCP intake — never touches the bridge's own root git beyond the args
 * the caller supplied at the caller's userCwd.
 *
 * Citation: GITM-D3-S3-YELLOW-BLUEPRINT.md §3 (gitmExec) + §4 (parseGitmLog)
 * Citation: GITM-D3-S1-RED-CURATION.md §3 (T2 git command map)
 */

import { execFileSync } from 'node:child_process';
import type { GitmCommitEntry, GitmCommitGraphEntry } from '../qualities/types';
import type { GitmWorktreeRow } from '../gitm.types';

export type GitmExecResult = {
  ok: boolean;
  stdout: string;
  stderr: string;
  error: string; // empty string if ok
};

// GITM Dev Epoch (MD-E · part 1 · HOOKS SURFACING) — git relays a failing hook's OWN output to
// the caller; that output lands on BOTH the subprocess stderr AND (for many hooks that echo their
// verdict) the subprocess stdout. execFileSync's thrown error carries e.stderr + e.stdout; the
// prior catch discarded e.stdout, so a hook that printed its abort reason to stdout vanished.
// composeExecError joins the message + stderr + stdout VERBATIM (deduped · non-empty only) so the
// hook's own text rides result.error → every downstream `exec.error || exec.stderr` path (commit /
// push / stageAllAndCommit) shows exactly what the CLI would ('shows the hook's own output and
// aborts exactly as CLI would' — the RD). PURE · no truncation here (the callers cap for display).
export function composeExecError(message: string, stderr: string, stdout: string): string {
  const parts: string[] = [];
  for (const p of [message, stderr, stdout]) {
    const t = (p || '').trim();
    if (t !== '' && !parts.includes(t)) parts.push(t);
  }
  return parts.join('\n');
}

// GITM Dev Epoch (MD-A) — THE COMMAND LOG RING. gitmExec is a PURE model with no state access,
// so the ring lives at MODULE scope here (the single subprocess seam is the single log seam).
// Cap 200 · newest-LAST (push/shift). readCommandLog() exposes a defensive copy the GITEP
// snapshot reads at gitm.json write time. appendCommandLog runs on EVERY gitmExec invocation
// (and the migrated `git apply -` stdin sites) so NO subprocess op escapes the log.
const COMMAND_LOG_CAP = 200;
const commandLogRing: string[] = [];

// GITM Dev Epoch (MD-A) — the shared push seam. Formats one entry
// `[iso-ts] git <args> → exit:<0|code>` (+ ` stderr:<first-line>` when stderr non-empty) and
// maintains the bounded ring (newest-last · shift the oldest past cap 200).
export function appendCommandLog(args: string[], result: GitmExecResult): void {
  const ts = new Date().toISOString();
  const exit = result.ok ? '0' : result.error || 'error';
  let entry = `[${ts}] git ${args.join(' ')} → exit:${exit}`;
  // MD-E (part 1 · HOOKS SURFACING) — carry the FIRST line of the subprocess output on the log
  // entry. Prefer stderr (git's own diagnostics); FALL BACK to stdout when stderr is empty (a hook
  // that printed its abort reason to stdout — MD-A only checked stderr, so those vanished). The
  // command log is 'what did git actually do' — a hook failure must be visible there, not only in
  // lastActionResult.
  const firstLine =
    result.stderr !== '' ? result.stderr.split('\n')[0]
      : result.stdout !== '' && !result.ok ? result.stdout.split('\n')[0]
      : '';
  if (firstLine !== '') {
    entry += ` stderr:${firstLine}`;
  }
  commandLogRing.push(entry);
  while (commandLogRing.length > COMMAND_LOG_CAP) {
    commandLogRing.shift();
  }
}

// ────────────────────────────────────────────────
// GITM Dev Epoch (MD-E · part 2 · PROGRESS) — THE CURRENT-OP LATCH (module-scope · single slot)
// ────────────────────────────────────────────────
//
// gitmExec is SYNC — a true in-flight progress can't be reducer-stamped mid-call (the reducer runs
// AFTER the method's exec returns). THE HONEST SEAM: a MODULE-scope currentOp the long-running
// qualities (pull/push/fetch/merge/turn-over) SET at method entry (before their exec) and CLEAR at
// exit. The GITEP snapshot COPIES readCurrentOp() onto gitm.json (mirror the commandLog pattern —
// not a GitmState selector). For a SINGLE blocking execFileSync the value is set-and-cleared within
// one blocked tick (the event loop cannot fire the writer beat mid-exec); for COMPOSITE qualities
// (sequential execs · strategy nodes spanning beats) the latch is observable BETWEEN execs, and the
// /gitm-status HTTP GET reads readCurrentOp() at call time so an external poll during a long op sees
// it. CANCEL is out of scope — execFileSync cannot abort mid-flight (the never-silent rule is met by
// VISIBILITY, not abortability · see the model note at the qualities). Single slot · re-set overwrites.
export type GitmProgress = {
  message: string; // human label, e.g. 'Pulling from remote…'
  command: string; // the live git command, e.g. 'git pull --ff-only'
};

let currentOp: GitmProgress | null = null;

/** Stamp the current long-running op (call BEFORE the exec · the long-running qualities' methods). */
export function setCurrentOp(op: GitmProgress): void {
  currentOp = { message: op.message, command: op.command };
}

/** Clear the current op (call AFTER the exec · in a finally-equivalent path so a throw still clears). */
export function clearCurrentOp(): void {
  currentOp = null;
}

/** Read the current op (null = idle). The GITEP snapshot copies this onto gitm.json.progress. */
export function readCurrentOp(): GitmProgress | null {
  return currentOp;
}

// GITM Dev Epoch (MD-A) — the read seam the GITEP snapshot copies onto gitm.json (defensive
// copy so no external mutation of the ring). Newest-last; the Vue panel reverses for display.
export function readCommandLog(): string[] {
  return commandLogRing.slice();
}

// 0.944.1 HOTFIX · THE PROMPT-HANG FREEZE (field · IE turn-over): gitmExec is a BLOCKING
// execFileSync on the bridge's single event loop — a remote op (push/pull/fetch) whose
// https transport stalls awaiting a credential answer it can never receive (stdio is fully
// piped; the TUI holds the terminal) hung `git remote-https` for 8+ minutes and FROZE THE
// WHOLE BRIDGE: 7111 accepted but never answered, every tool press timed out. Two guards:
//   - GIT_TERMINAL_PROMPT=0 — git FAILS FAST ('could not read Username…') instead of
//     prompting a pipe that never answers; the error surfaces through the taxonomy.
//   - timeout — the backstop for a stalled transport that never prompts: execFileSync
//     throws (SIGKILL) and the never-silent catch names it plainly.
const GITM_EXEC_TIMEOUT_MS = 120_000;

export function gitmExec(args: string[], cwd: string, input?: string): GitmExecResult {
  try {
    const stdout = execFileSync('git', args, {
      cwd,
      input,
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
      timeout: GITM_EXEC_TIMEOUT_MS,
      killSignal: 'SIGKILL',
      env: { ...process.env, GIT_TERMINAL_PROMPT: '0' },
    });
    const result: GitmExecResult = { ok: true, stdout: stdout.trim(), stderr: '', error: '' };
    appendCommandLog(args, result);
    return result;
  } catch (err: unknown) {
    // MD-E (part 1 · HOOKS SURFACING) — capture e.stdout too: git relays a failing hook's own
    // output, which for many hooks lands on STDOUT (not stderr). The prior catch discarded it, so a
    // hook that echoed its abort reason to stdout was invisible. composeExecError joins the message,
    // stderr, AND stdout verbatim so result.error carries the hook's own text — the CLI-parity the RD
    // requires ('shows the hook's own output and aborts exactly as CLI would').
    const e = err as { stderr?: string; stdout?: string; message?: string; signal?: string; code?: string };
    const stderr = typeof e.stderr === 'string' ? e.stderr.trim() : '';
    const stdout = typeof e.stdout === 'string' ? e.stdout.trim() : '';
    const timedOut = e.signal === 'SIGKILL' || e.code === 'ETIMEDOUT';
    const message = timedOut
      ? `git ${args[0] ?? ''} timed out after ${GITM_EXEC_TIMEOUT_MS / 1000}s — the remote did not answer (credentials anor network); the bridge stays live`
      : typeof e.message === 'string' ? e.message : String(err);
    const result: GitmExecResult = {
      ok: false,
      stdout,
      stderr,
      error: composeExecError(message, stderr, stdout),
    };
    appendCommandLog(args, result);
    return result;
  }
}

// ────────────────────────────────────────────────
// GITM Dev Epoch (093 · E4) — CONFLICT PATH RESOLUTION (the show-prefix offset)
// ────────────────────────────────────────────────
//
// THE BUG: opCwd = `<repo>/SCP` but the git ROOT is `<repo>`. `git show :1:<path>` resolves the
// path against the git ROOT (index stages are root-relative), while `readFileSync(join(cwd, path))`
// resolves against the CWD. When the caller hands a repo-relative path WITH the `SCP/` prefix,
// the filesystem read doubles it (`<repo>/SCP/SCP/<file>`); when it hands a cwd-relative path
// WITHOUT the prefix, `git show :1:` misses (the index key is `SCP/<file>`). The offset is
// `git rev-parse --show-prefix` (empty when cwd IS the root · `SCP/` when cwd is a subdir).
//
// resolveConflictPaths returns BOTH forms for one given path, prefix-aware in either direction:
//   - indexPath (ROOT-relative · for `git show :N:`): prefix + cwd-relative-given.
//   - workPath  (CWD-relative  · for readFileSync/writeFileSync + `git add`): prefix stripped.
// Idempotent: a path already carrying the prefix is normalized once (never doubled).

export type ConflictPathResolution = {
  given: string;
  showPrefix: string; // '' at root · 'SCP/' in a subdir (trailing slash preserved as git emits)
  indexPath: string; // ROOT-relative (for `git show :N:<indexPath>`)
  workPath: string; // CWD-relative (for FS read/write + `git add <workPath>`)
};

export function resolveConflictPaths(given: string, cwd: string): ConflictPathResolution {
  // `git rev-parse --show-prefix` emits the cwd's offset from the git ROOT (trailing slash),
  // or '' when cwd IS the root. Best-effort: a failure (non-repo) falls back to no offset.
  const probe = gitmExec(['rev-parse', '--show-prefix'], cwd);
  const showPrefix = probe.ok ? probe.stdout.trim() : '';
  if (showPrefix === '') {
    // At the git root — the given path is already both index-relative and cwd-relative.
    return { given, showPrefix, indexPath: given, workPath: given };
  }
  // Normalize: strip a leading prefix if the caller already supplied a ROOT-relative path,
  // yielding the canonical CWD-relative form; then compose the ROOT-relative form once.
  const workPath = given.startsWith(showPrefix) ? given.slice(showPrefix.length) : given;
  const indexPath = `${showPrefix}${workPath}`;
  return { given, showPrefix, indexPath, workPath };
}

/**
 * Parse the `git log --format="%H\x1f%an\x1f%ae\x1f%ai\x1f%s"` stdout into
 * GitmCommitEntry[]. Split per line, then per ASCII unit separator (\x1f).
 * Lines lacking the full 5 fields are dropped defensively. Pure · fixture-testable.
 */
export function parseGitmLog(stdout: string): GitmCommitEntry[] {
  if (stdout.length === 0) {
    return [];
  }
  const entries: GitmCommitEntry[] = [];
  const lines = stdout.split('\n');
  for (const line of lines) {
    if (line.length === 0) continue;
    const parts = line.split('\x1f');
    if (parts.length < 5) continue;
    entries.push({
      hash: parts[0],
      author: parts[1],
      email: parts[2],
      date: parts[3],
      subject: parts[4],
    });
  }
  return entries;
}

/**
 * THE SCP COMMAND MENU (W3 · THE WORKTREE RAIL) — parse `git worktree list --porcelain` into
 * GitmWorktreeRow[]. The porcelain format is blank-line-separated attribute groups; each group opens
 * with a `worktree <abs-path>` line then carries `HEAD <sha>` and either `branch refs/heads/<name>`
 * (a normal checkout) or `detached` (a detached HEAD · branch left ''). A `bare` line marks the bare
 * main repo (no path checkout · skipped). One row per `worktree` group. The `refs/heads/` prefix is
 * stripped to the plain branch name (byte-parity with the branches[] roster the UI already reads).
 * Pure · fixture-testable (no process). Empty stdout → [].
 */
export function parseGitmWorktreeList(stdout: string): GitmWorktreeRow[] {
  if (stdout.length === 0) {
    return [];
  }
  const rows: GitmWorktreeRow[] = [];
  let current: GitmWorktreeRow | null = null;
  const push = (): void => {
    if (current !== null && current.path !== '') {
      rows.push(current);
    }
    current = null;
  };
  for (const raw of stdout.split('\n')) {
    const line = raw.trim();
    if (line === '') {
      push();
      continue;
    }
    if (line.startsWith('worktree ')) {
      push();
      current = { path: line.slice('worktree '.length), branch: '', head: '' };
    } else if (current !== null && line.startsWith('HEAD ')) {
      current.head = line.slice('HEAD '.length);
    } else if (current !== null && line.startsWith('branch ')) {
      const ref = line.slice('branch '.length);
      current.branch = ref.startsWith('refs/heads/') ? ref.slice('refs/heads/'.length) : ref;
    }
    // `detached` / `bare` / `locked` / `prunable` lines: branch stays '' (the detached/bare marker).
  }
  push();
  return rows;
}

/**
 * GITM Dev Epoch (MD-C · THE DAG) — parse the graph log into GitmCommitGraphEntry[].
 * Format: `git log --format=%H%x1f%P%x1f%D%x1f%an%x1f%s` (5 fields per line, `\x1f`-split).
 *   %H = full hash · %P = space-joined parent hashes ('' for the root) · %D = the ref
 *   decoration roster (`, `-joined · '' when undecorated) · %an = author · %s = subject.
 * The output is TOPO-ORDERED by git (the caller passes --topo-order); this parse preserves
 * that order. parents = %P split on ' ' (empty-filtered → [] for the root, ≥2 for a merge);
 * refs = %D split on ', ' (empty-filtered). Lines lacking the full 5 fields are dropped
 * defensively (the empty-%P / empty-%D positions are still PRESENT — git emits the separators).
 * Pure · fixture-testable (no process).
 */
export function parseGitmLogGraph(stdout: string): GitmCommitGraphEntry[] {
  if (stdout.length === 0) {
    return [];
  }
  const entries: GitmCommitGraphEntry[] = [];
  const lines = stdout.split('\n');
  for (const line of lines) {
    if (line.length === 0) continue;
    const parts = line.split('\x1f');
    if (parts.length < 5) continue;
    entries.push({
      hash: parts[0],
      parents: parts[1].split(' ').filter((p) => p !== ''),
      refs: parts[2].split(', ').map((r) => r.trim()).filter((r) => r !== ''),
      author: parts[3],
      subject: parts[4],
    });
  }
  return entries;
}
