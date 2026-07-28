/**
 * STARC Model · Status-Tree Read Coherence · GITM D2 (#633)
 *
 * The single-source parse of `git status --porcelain=v2 --branch` + the branch
 * list into the gitm Concept State. PURE + testable: `parseGitStatus` /
 * `parseBranchList` take raw strings (the unit-test seam · ZERO I/O). Only
 * `readGitStatus` touches the filesystem (two bounded sync `execFileSync` calls
 * on the action-queue beat — mirror installSpawn.ts execFileSync pattern).
 *
 * NO Stratimux imports in this file (the STARC seam stays framework-free).
 *
 * Porcelain v2 reference (git-scm `git status --porcelain=v2`):
 *   Header lines:
 *     # branch.head <name>     → current branch; `(detached)` ⇒ detached HEAD
 *     # branch.ab +<A> -<B>    → ahead A, behind B
 *   Entry lines:
 *     1 <XY> ... <path>        → ordinary changed entry
 *     2 <XY> ... <path>\t<orig>→ renamed/copied (tab-separated paths)
 *     u <xy> ... <path>        → unmerged (conflict)
 *     ? <path>                 → untracked
 *     ! <path>                 → ignored (dirty-irrelevant)
 *
 * Citation: GITM-D2-S3-YELLOW-BLUEPRINT.md §3 · GITM-D2-S2-ORANGE-NAMING.md §2 (STARC)
 */

import { execFileSync } from 'node:child_process';

export type GitmStatusResult = {
  isRepo: boolean;
  currentBranch: string;
  dirty: boolean;
  ahead: number;
  behind: number;
  stagedFiles: string[];
  unstagedFiles: string[];
  detachedHead: boolean;
  conflicts: string[];
  // GITM SCP-Sovereign — untracked (NEW) file PATHS. Kept SEPARATE from unstagedFiles (which
  // gitmDiscard treats as TRACKED → git checkout; untracked are `rm`-discarded). The badge's
  // changeCount INCLUDES untrackedFiles.length, and the UI lists them (the "informance").
  untrackedFiles: string[];
  branches: string[];
  lastReadAt: number;
  // GITM Dev Menu (#644) — STASHCOUNT: `git stash list` entry count (Pop-chip enablement).
  stashCount: number;
  // C837 · THE REMOTE ORIGIN — recorded DURING the status check (`git remote get-url origin`).
  // '' = no remote. Rides gitm.json so the remote host is AVAILABLE wherever the status is —
  // the manifest origin doctrine's either/or (remote priority) reads the same truth.
  remoteOrigin: string;
  // C844 · THE HEAD COMMIT MESSAGE (subject) — the Commit widget's amend seed ('' = no commits).
  headCommitMessage: string;
};

// stashCount comes from a separate `git stash list` read (NOT parseGitStatus),
// so it is omitted from the porcelain-parse shape alongside branches/lastReadAt/isRepo.
// C837 · remoteOrigin likewise rides its own `git remote get-url origin` read.
// C844 · headCommitMessage rides its own `git log -1 --format=%s` read.
type ParsedStatus = Omit<GitmStatusResult, 'branches' | 'lastReadAt' | 'isRepo' | 'stashCount' | 'remoteOrigin' | 'headCommitMessage'>;

/**
 * Extract the path token from a porcelain v2 entry line.
 *
 * Field layout (space-separated):
 *   ordinary (1): 1 <XY> <sub> <mH> <mI> <mW> <hH> <hI> <path>
 *   renamed  (2): 2 <XY> <sub> <mH> <mI> <mW> <hH> <hI> <Xscore> <path>\t<origPath>
 *   unmerged (u): u <xy> <sub> <m1> <m2> <m3> <mW> <h1> <h2> <h3> <path>
 *
 * The path is the remainder after the fixed field count; for `2` lines the
 * current path precedes a literal TAB before the original path.
 */
function extractEntryPath(line: string, fixedFields: number): string {
  const parts = line.split(' ');
  const rest = parts.slice(fixedFields).join(' ');
  // Renamed entries carry `<path>\t<origPath>` — the current path is before the TAB.
  const tabIdx = rest.indexOf('\t');
  return tabIdx === -1 ? rest : rest.slice(0, tabIdx);
}

export function parseGitStatus(raw: string): ParsedStatus {
  let currentBranch = '';
  let dirty = false;
  let ahead = 0;
  let behind = 0;
  const stagedFiles: string[] = [];
  const unstagedFiles: string[] = [];
  const conflicts: string[] = [];
  let detachedHead = false;
  const untrackedFiles: string[] = [];

  const lines = raw.split('\n');
  for (const line of lines) {
    if (line.length === 0) continue;

    // ── Header lines ──────────────────────────────
    if (line.startsWith('# branch.head ')) {
      const name = line.slice('# branch.head '.length).trim();
      if (name === '(detached)') {
        detachedHead = true;
        currentBranch = '';
      } else {
        currentBranch = name;
      }
      continue;
    }
    if (line.startsWith('# branch.ab ')) {
      // # branch.ab +A -B
      const ab = line.slice('# branch.ab '.length).trim().split(' ');
      for (const token of ab) {
        if (token.startsWith('+')) ahead = Number.parseInt(token.slice(1), 10) || 0;
        else if (token.startsWith('-')) behind = Number.parseInt(token.slice(1), 10) || 0;
      }
      continue;
    }
    if (line.startsWith('#')) continue; // other headers (branch.oid, branch.upstream)

    // ── Entry lines ───────────────────────────────
    if (line.startsWith('1 ') || line.startsWith('2 ')) {
      // <kind> <XY> <...fixed...> <path>
      // ordinary: 8 fixed tokens before path (1 X Y sub mH mI mW hH hI → index 8)
      // renamed:  9 fixed tokens before path (extra Xscore field)
      const isRenamed = line.startsWith('2 ');
      const xy = line.slice(2, 4); // the 2-char XY status field
      const x = xy[0];
      const y = xy[1];
      const path = extractEntryPath(line, isRenamed ? 9 : 8);
      if (x !== '.' && x !== undefined) {
        stagedFiles.push(path);
        dirty = true;
      }
      if (y !== '.' && y !== undefined) {
        unstagedFiles.push(path);
        dirty = true;
      }
      continue;
    }
    if (line.startsWith('u ')) {
      // unmerged: u <xy> <sub> <m1> <m2> <m3> <mW> <h1> <h2> <h3> <path>
      const path = extractEntryPath(line, 10);
      conflicts.push(path);
      dirty = true;
      continue;
    }
    if (line.startsWith('? ')) {
      untrackedFiles.push(extractEntryPath(line, 1));
      dirty = true;
      continue;
    }
    // `! ` ignored entries contribute nothing.
  }

  // Re-derive dirty defensively (matches professional-tool semantics).
  dirty =
    stagedFiles.length > 0 ||
    unstagedFiles.length > 0 ||
    conflicts.length > 0 ||
    untrackedFiles.length > 0;

  return {
    currentBranch,
    dirty,
    ahead,
    behind,
    stagedFiles,
    unstagedFiles,
    detachedHead,
    conflicts,
    untrackedFiles,
  };
}

export function parseBranchList(raw: string): string[] {
  return raw
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

// GITM Dev Menu (#644) — STASHCOUNT seam. `git stash list` emits one line per
// stash entry (empty stdout = no stashes). Count the non-empty lines. Pure ·
// fixture-testable without a process (mirrors parseBranchList discipline).
export function parseStashCount(raw: string): number {
  return raw
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0).length;
}

export function readGitStatus(userCwd: string): GitmStatusResult {
  try {
    // GITM Branch-Flow (#644 · lock-guard) — `--no-optional-locks` is the top-level git flag
    // (MUST precede the `status` subcommand) that tells git to skip the optional .git/index.lock
    // write during this watcher-driven status read. The bridge runs this read constantly (WATCHDIAL
    // + CHANGEDIAL); without the flag it contends with a foreground `git switch -c` for the index
    // lock → `fatal: Unable to create '.git/index.lock': File exists.` (the create-failure cause).
    const statusRaw = execFileSync('git', ['--no-optional-locks', 'status', '--porcelain=v2', '--branch'], {
      cwd: userCwd,
      encoding: 'utf8',
    });
    const branchRaw = execFileSync(
      'git',
      ['branch', '--list', '--format=%(refname:short)'],
      { cwd: userCwd, encoding: 'utf8' },
    );
    // STASHCOUNT (#644) — third bounded sync read; one line per stash entry.
    const stashRaw = execFileSync('git', ['stash', 'list'], {
      cwd: userCwd,
      encoding: 'utf8',
    });

    const parsed = parseGitStatus(statusRaw);
    const branches = parseBranchList(branchRaw);
    const stashCount = parseStashCount(stashRaw);

    // C837 · the remote origin — a repo with NO remote throws on get-url; that is the
    // honest '' (never fails the whole status read).
    let remoteOrigin = '';
    try {
      remoteOrigin = execFileSync('git', ['remote', 'get-url', 'origin'], {
        cwd: userCwd,
        encoding: 'utf8',
      }).trim();
    } catch {
      /* no remote configured — '' */
    }

    // C844 · the HEAD subject — the amend seed (an empty repo throws → '').
    let headCommitMessage = '';
    try {
      headCommitMessage = execFileSync('git', ['log', '-1', '--format=%s'], {
        cwd: userCwd,
        encoding: 'utf8',
      }).trim();
    } catch {
      /* no commits yet — '' */
    }

    return {
      isRepo: true,
      ...parsed,
      branches,
      lastReadAt: Date.now(),
      stashCount,
      remoteOrigin,
      headCommitMessage,
    };
  } catch {
    // Non-git-repo, git not installed, or read failure: return the non-repo
    // result WITHOUT re-throwing. The principle's dispatch still fires — state
    // transitions to isRepo: false. lastReadAt advances so GITEP/json-write fire.
    return {
      isRepo: false,
      currentBranch: '',
      dirty: false,
      ahead: 0,
      behind: 0,
      stagedFiles: [],
      unstagedFiles: [],
      detachedHead: false,
      conflicts: [],
      untrackedFiles: [],
      branches: [],
      lastReadAt: Date.now(),
      stashCount: 0,
      remoteOrigin: '',
      headCommitMessage: '',
    };
  }
}
