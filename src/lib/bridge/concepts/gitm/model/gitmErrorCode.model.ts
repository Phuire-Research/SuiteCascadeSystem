/**
 * GITM Error-Code Mapper · GITM Branch-Flow (#644) · the Action-Outcome Code Projection
 *
 * Maps a raw gitmExec error/stderr string (+ the optional userCwd) into the S2-Rust
 * GITM_* error-code taxonomy. PURE + framework-free (no Stratimux imports · mirror the
 * gitmStatus.model.ts STARC-seam discipline · fixture-testable without a process).
 *
 * The same `gitmBranchCreate` / `gitmBranchSwitch` exec can fail for several root causes;
 * this projection names the CAUSE (not the operation) so the UI can give meaningful
 * guidance. Precedence (most-specific first):
 *   userCwd === ''                          → GITM_INVALID_CWD   (no project root)
 *   stderr/error ~ 'index.lock'             → GITM_INDEX_LOCKED  (concurrent-git collision · TEP)
 *   error ~ 'ENOENT'/'not found' (on git)   → GITM_GIT_NOT_FOUND (git binary missing · NOT TEP)
 *   error ~ 'ENOENT'/'ENOTDIR'  (cwd)       → GITM_INVALID_CWD   (bad working directory · NOT TEP)
 *   else                                     → fallback (the operation's generic code)
 *
 * Citation: GITM-BRANCH-FLOW-S2-RUST.md §1 (the five failure modes + the taxonomy) ·
 *           GITM-BRANCH-FLOW-S3-OCHRE.md Edit 1.4 (reducer error-set).
 */

export type GitmErrorCode =
  | 'GITM_BRANCH_CREATE_FAILED'
  | 'GITM_BRANCH_SWITCH_FAILED'
  | 'GITM_INDEX_LOCKED'
  | 'GITM_DIRTY_SWITCH_BLOCKED'
  | 'GITM_GIT_NOT_FOUND'
  | 'GITM_INVALID_CWD';

/**
 * Project a raw exec error string into the GITM_* taxonomy.
 *
 * @param error    the raw `exec.error || exec.stderr` from gitmExec (already in result.error)
 * @param fallback the operation-generic code when no specific cause matches
 *                 (default GITM_BRANCH_CREATE_FAILED · branchSwitch passes GITM_BRANCH_SWITCH_FAILED)
 * @param userCwd  the working directory at exec time ('' → GITM_INVALID_CWD pre-empts all)
 */
export function mapGitmExecError(
  error: string,
  fallback: GitmErrorCode = 'GITM_BRANCH_CREATE_FAILED',
  userCwd?: string,
): GitmErrorCode {
  // No project root — the cleanest discrimination (no ambiguous message parsing).
  if (userCwd === '') {
    return 'GITM_INVALID_CWD';
  }
  const haystack = (error || '').toLowerCase();
  // Index-lock collision — the leading root cause (TEP · self-resolves on the next tick).
  if (haystack.includes('index.lock')) {
    return 'GITM_INDEX_LOCKED';
  }
  // Git binary missing — ENOENT against the `git` executable (NOT a tree/cwd failure).
  if (haystack.includes('enoent') && haystack.includes('git')) {
    return 'GITM_GIT_NOT_FOUND';
  }
  if (haystack.includes('not found')) {
    return 'GITM_GIT_NOT_FOUND';
  }
  // Bad working directory — ENOENT/ENOTDIR on the cwd resolution (no git mention).
  if (haystack.includes('enoent') || haystack.includes('enotdir')) {
    return 'GITM_INVALID_CWD';
  }
  return fallback;
}
