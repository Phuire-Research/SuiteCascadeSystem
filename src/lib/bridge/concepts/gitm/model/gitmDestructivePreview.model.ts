/**
 * GITM Dev Epoch (MD-D · DESTRUCTIVE PREVIEWS) — the call-1 loss-preview seam.
 *
 * The WATCHKEY two-call idiom's call-1 (no token) computes the EXACT loss the destructive op
 * will inflict BEFORE call-2 executes it — surfaced on GitmActionResult.preview so the agent /
 * devbar / SCP editor shows "what will be lost". PURE-ish: each helper runs one bounded gitmExec
 * (which rides the command log — no subprocess escapes it) and returns a display string. A
 * best-effort failure (absent remote, unknown ref) returns a plain note rather than throwing —
 * the preview is advisory, never a gate.
 *
 * Four previews, one per destructive op:
 *   - computeResetPreview   : `git diff HEAD <ref> --stat` + first ~40 lines (reset --hard · undo)
 *   - computeDiscardPreview : the file's diff (git diff [-- <path>], untracked → the file body)
 *   - computeForcePushPreview: `git log <remote>/<branch> ^HEAD --oneline` (the commits overwritten)
 *
 * Citation: DIAMOND-GITM-DEVELOPER-EPOCH.md §MD-D (Destructive previews · the WATCHKEY two-call).
 */

import { gitmExec } from './gitmExec.model';

// The line budget for the reset/undo diff-body preview (the --stat summary rides on top).
const PREVIEW_DIFF_LINE_CAP = 40;

function capLines(raw: string, cap: number): string {
  if (raw === '') return '';
  const lines = raw.split('\n');
  if (lines.length <= cap) return raw;
  const kept = lines.slice(0, cap).join('\n');
  return `${kept}\n… ${lines.length - cap} more line(s)`;
}

/**
 * reset --hard <ref> / undo <ref> — the loss = the diff of HEAD vs the target. Show the --stat
 * summary (files + churn) then the first ~40 lines of the unified diff. Best-effort: an unknown
 * ref returns the git stderr note.
 */
export function computeResetPreview(cwd: string, ref: string): string {
  const stat = gitmExec(['diff', 'HEAD', ref, '--stat'], cwd);
  if (!stat.ok) {
    return `preview unavailable — ${stat.stderr || stat.error || 'unknown ref'}`;
  }
  const body = gitmExec(['diff', 'HEAD', ref], cwd);
  const statText = stat.stdout === '' ? '(no differences)' : stat.stdout;
  if (!body.ok || body.stdout === '') {
    return statText;
  }
  return `${statText}\n\n${capLines(body.stdout, PREVIEW_DIFF_LINE_CAP)}`;
}

/**
 * discard <path> — the loss = the file's current changes. Tracked → `git diff -- <path>` (working
 * vs index/HEAD); if that is empty (staged-only) fall to `git diff --cached -- <path>`; untracked →
 * the whole file is new (note it). Capped at ~40 lines.
 */
export function computeDiscardPreview(cwd: string, path: string, tracked: boolean): string {
  if (!tracked) {
    return `untracked file — ${path} will be removed entirely (git clean -f)`;
  }
  const unstaged = gitmExec(['diff', '--', path], cwd);
  if (unstaged.ok && unstaged.stdout !== '') {
    return capLines(unstaged.stdout, PREVIEW_DIFF_LINE_CAP);
  }
  const staged = gitmExec(['diff', '--cached', '--', path], cwd);
  if (staged.ok && staged.stdout !== '') {
    return capLines(staged.stdout, PREVIEW_DIFF_LINE_CAP);
  }
  return `${path} — no working-tree diff to preview (restore reverts to HEAD)`;
}

/**
 * discard-all — the loss = ALL uncommitted work: the `git diff HEAD --stat` churn summary PLUS
 * the untracked files `git clean -fd` will remove (`git clean -nd` dry-run). Capped.
 */
export function computeDiscardAllPreview(cwd: string): string {
  const stat = gitmExec(['diff', 'HEAD', '--stat'], cwd);
  const statText = stat.ok && stat.stdout !== '' ? stat.stdout : '(no tracked changes)';
  const clean = gitmExec(['clean', '-nd'], cwd);
  const cleanText = clean.ok && clean.stdout !== '' ? clean.stdout : '(no untracked files)';
  return capLines(`tracked changes to revert:\n${statText}\n\nuntracked to remove:\n${cleanText}`, PREVIEW_DIFF_LINE_CAP);
}

/**
 * force-push — the loss = the remote commits HEAD would overwrite:
 * `git log <remote>/<branch> ^HEAD --oneline`. Best-effort: an absent remote / unknown
 * upstream returns a plain note (force-with-lease still runs behind the token · this is advisory).
 * remote/branch default to the current-branch upstream shorthand when omitted.
 */
export function computeForcePushPreview(cwd: string, remote: string, branch: string, currentBranch: string): string {
  const r = remote !== '' ? remote : 'origin';
  const b = branch !== '' ? branch : currentBranch;
  if (b === '') {
    return 'preview unavailable — no current branch resolved';
  }
  const ref = `${r}/${b}`;
  const log = gitmExec(['log', ref, '^HEAD', '--oneline'], cwd);
  if (!log.ok) {
    return `no remote-side commits to preview — ${ref} not found (force-with-lease still guards the push)`;
  }
  if (log.stdout === '') {
    return `${ref} — no remote commits ahead of HEAD would be overwritten`;
  }
  return `commits ${ref} has that HEAD will overwrite:\n${capLines(log.stdout, PREVIEW_DIFF_LINE_CAP)}`;
}
