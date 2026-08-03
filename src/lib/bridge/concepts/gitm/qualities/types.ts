/**
 * gitm Quality Type Definitions · GITM D2 (#633) · Gitm Epoch
 *
 * Two Qualities (explicit Quality<State, Payload> — NEVER typeof):
 *   1. gitmWatcherArm   (Method+Reducer+Bucket · kind-discriminated · 'gitDir')
 *   2. gitmSetStatus    (Method+Reducer+Bucket · STARC lands whole)
 *
 * STARC coherence law (S2 naming): the entire STARC parse result arrives as ONE
 * payload, lands via ONE partial-return reducer — never per-field set qualities.
 *
 * Template: scpMessageRouter/qualities/types.ts (explicit Quality type mapping)
 * Citation: GITM-D2-S3-YELLOW-BLUEPRINT.md §4 · GITM-D2-S2-ORANGE-NAMING.md §2 (STARC)
 */

import type { Quality } from 'stratimux';
import type { GitmState, GitmLocationKey } from '../gitm.types';

// ────────────────────────────────────────────────
// WATCHER KIND DISCRIMINATOR (single member — one watcher on three paths)
// ────────────────────────────────────────────────

// GITM A↔B-R (#641-R · CHANGEDIAL) — 'projectRoot' arms the second watcher on userCwd
// (excluding .git/) for the live dirty-file count.
export type GitmWatcherKind = 'gitDir' | 'projectRoot';

// ────────────────────────────────────────────────
// MULTI-SCP GITM MUXIFICATION (Fork B · MC-W1 · THE ORIGIN THREAD)
// ────────────────────────────────────────────────
//
// WithOrigin threads the CALLING SCP's identity onto a gitm operation payload. `originScpName` is
// OPTIONAL (KeyedSelector law does NOT apply — these are ACTION payloads, not the base State; the
// base GitmState has no origin field) so every existing call site (no origin) stays valid, and the
// dev:self / agent path (env-first origin) never needs to supply it. When present, resolveGitmTargetCwd
// (gitmOpCwd.model.ts) maps it (a NAME via the SCPs.json registry, or an absolute dir path verbatim)
// to the caller's own repo cwd — routing the op to ITS OWN SCP instead of the single active one (the
// CHIMERA repair). Applied to the OPERATION payloads (the gitmExec-calling qualities); the pure
// annotation payloads (register/confirm) and the strategy-node payloads carry it too for uniformity
// where they resolve a cwd. See gitmOpCwd.model.ts §THE ORIGIN THREAD.
export type WithOrigin<T> = T & { originScpName?: string };

// ────────────────────────────────────────────────
// PAYLOAD TYPES
// ────────────────────────────────────────────────

export type GitmWatcherArmPayload = {
  watcherKind: GitmWatcherKind;
};

// GITM 3LOC — the cascade + scp watcher arms share ONE payload (no kind needed — the arm
// IS the location). Empty payload (kind is intrinsic to the arm quality · symmetry with
// GitmRegisterStablePayload). The scp arm reads activeScpDir from state at arm time.
export type GitmLocationWatcherArmPayload = Record<string, never>;

// GITM 3LOC — the unified per-location recount payload. `location` selects which cwd to
// readGitStatus against ('base'|'cascade'|'scp') · the reducer stamps the matching sub-state
// + mostRecentLocation + lastChangedAt. clearError mirrors the Branch-Flow gate (base only:
// retire the transient action-error on a REAL user-tree change · false on boot + bookkeeping).
// MULTI-SCP GITM MUXIFICATION (MC-W1) — the 'scp' branch resolves its cwd via resolveGitmTargetCwd
// (originScpName-aware) so a non-active SCP's watcher recount targets ITS OWN repo. The 'base'/'cascade'
// branches keep their fixed cwd (userCwd · userCwd/Cascades) — the origin thread does not touch them.
export type GitmRecountLocationPayload = WithOrigin<{
  location: GitmLocationKey;
  clearError: boolean;
}>;

// MULTI-SCP GITM MUXIFICATION (MC-W1) — gitmSetStatus is dispatched EMPTY (the Method ignores the
// payload and calls readGitStatus). The per-SCP watcher (MC-W2) dispatches it with originScpName=scpDir
// so its STARC read targets THAT SCP's repo (resolveGitmTargetCwd) instead of the single active one.
export type GitmSetStatusPayload = WithOrigin<{
  isRepo: boolean;
  currentBranch: string;
  dirty: boolean;
  ahead: number;
  behind: number;
  branches: string[];
  stagedFiles: string[];
  unstagedFiles: string[];
  detachedHead: boolean;
  conflicts: string[];
  lastReadAt: number;
  // GITM Dev Menu (#644) — STASHCOUNT rides the STARC set.
  stashCount: number;
}>;

// ────────────────────────────────────────────────
// D3 (#634) — T2 ONE-ACTION RESULT SURFACES
// ────────────────────────────────────────────────

// One parsed commit-log entry (gitmLoadLog result · parseGitmLog shape).
export type GitmCommitEntry = {
  hash: string;
  author: string;
  email: string;
  date: string;
  subject: string;
};

// GITM Dev Epoch (MD-C · THE DAG) — one parsed graph commit (parseGitmLogGraph shape).
// The graph carries TRUE parents (%P — space-joined parent hashes) + the decoration refs
// (%D — the `HEAD -> branch, tag: v1, origin/branch` roster split on `, `) so the SVG DAG
// can draw lanes (parents), branch/tag chips (refs), and mark HEAD. A merge commit carries
// ≥2 parents; a root carries []. TQNI ×4: this field → GitmStatusSnapshot.commitGraph
// (gitmEndpoint) → SCP GitmJsonShape.commitGraph (gitm.type.ts) → the whole-file relay seam.
export type GitmCommitGraphEntry = {
  hash: string;
  parents: string[]; // TRUE parents (%P) — [] for the root, ≥2 for a merge
  refs: string[]; // decoration roster (%D) split on `, ` — 'HEAD', 'branch', 'tag: v1', etc.
  author: string;
  subject: string;
};

// The single action-outcome surface — UI/MCP tail reads it after any action.
// Non-optional with an empty default (KeyedSelector law).
//
// D4 (#635) — the WATCHKEY token does NOT ride this surface. The token's durable
// home is GitmState.pendingConfirm (state-held PROHIBITION · k.pendingConfirm
// .select().token); the call-1 guard ALSO surfaces it through the action's
// strategyData payload (strategyData_muxifyData { confirmToken }) — the same
// channel gitmPush uses for { recommendation }. Keeping GitmActionResult at its
// D3 6-field shape means the 13 D3 qualities are untouched (smallest diff).
export type GitmActionResult = {
  action: string; // qualityName that produced this result, e.g. 'gitmStageFile'
  ok: boolean;
  error: string; // empty string if ok
  guardFired: boolean;
  reason: string; // empty string if no guard or error
  at: number; // Date.now() timestamp
  // GITM Dev Epoch (MD-D · DESTRUCTIVE PREVIEWS) — the exact loss the pending destructive op
  // will inflict, computed on call-1 (no token) alongside the guard. Optional (the ONLY field
  // that varies by op · absent on non-destructive results) — surfaced on the call-1 guard result
  // + in strategyData so the MCP caller / devbar sees "what will be lost" before call-2 executes.
  // reset: `git diff HEAD <target> --stat` + first ~40 lines · discard: the file's diff ·
  // force-push: `git log <remote>/<branch> ^HEAD --oneline` (best-effort · absent-remote note) ·
  // undo: `git diff HEAD <ref> --stat`. Optional-on-a-nested-object (KeyedSelector law scopes to
  // top-level state fields · lastActionResult itself stays non-optional with the empty default).
  preview?: string;
};

export const createGitmActionResultDefault = (): GitmActionResult => ({
  action: '',
  ok: false,
  error: '',
  guardFired: false,
  reason: '',
  at: 0,
});

// ────────────────────────────────────────────────
// D4 (#635) — WATCHKEY · PENDING-CONFIRM TOKEN (T3 double-confirm)
// ────────────────────────────────────────────────

// The pending double-confirm token — a state-held PROHIBITION. The destructive
// op REFUSES execution unless call 2 carries this exact token AND the params it
// was sealed for (PARAMSEAL) AND it has not burned (BURNTIME · EXPIRY_MS).
// Non-optional union (`PendingConfirm | null`, NOT `?:`) — KeyedSelector law.
export type PendingConfirm = {
  action: string; // qualityName that issued the token, e.g. 'gitmReset'
  token: string; // crypto nonce (randomUUID)
  paramsHash: string; // canonical concat of the sealed params (PARAMSEAL)
  issuedAt: number; // Date.now() — BURNTIME expiry gate origin
};

// ────────────────────────────────────────────────
// D4 (#635) — REACTIVE-WARDEN · STATE-DRIVEN LATENT WARNINGS
// ────────────────────────────────────────────────

// A reactively-true repo warning (detached HEAD, merge conflict, behind remote).
// REBUILT whole by the gitmSetStatus reducer per STARC parse — NOT appended to.
export type GitmWarning = {
  code: 'detached-head' | 'merge-conflict' | 'behind-remote';
  message: string;
  issuedAt: number;
};

// ────────────────────────────────────────────────
// D3 (#634) — T2 PAYLOAD TYPES
// ────────────────────────────────────────────────

// MULTI-SCP GITM MUXIFICATION (MC-W1) — the OPERATION payloads carry originScpName (WithOrigin) so
// resolveGitmTargetCwd routes each op to the CALLING SCP's own repo. Optional (every no-origin call
// site stays valid · the env-first path never needs it).
export type GitmStageFilePayload = WithOrigin<{ path: string }>;
export type GitmUnstageFilePayload = WithOrigin<{ path: string }>;
export type GitmCommitPayload = WithOrigin<{ message: string }>;
// GITM Dev Menu (#644) — CHECKOUT-TOGGLE: checkout?:true → `git switch -c <name>`
// (create AND switch · carries dirty state); false/absent → `git branch <name>`
// (create-only · the existing create-only call stays valid · smallest extension).
export type GitmBranchCreatePayload = WithOrigin<{ name: string; checkout?: boolean }>;
export type GitmBranchSwitchPayload = WithOrigin<{ name: string }>;
// GITM Dev Epoch (MD-B · THE LABELED STASH) — message OPTIONAL (empty/absent → plain `git stash push`).
export type GitmStashPushPayload = WithOrigin<{ message?: string }>;
export type GitmStashPopPayload = WithOrigin<Record<string, never>>;
// GITM Dev Epoch (MD-B · THE LABELED STASH BROWSER) — gitmStashList · git stash list --format=%gd|%s.
export type GitmStashListPayload = WithOrigin<Record<string, never>>;
// GITM Dev Epoch (MD-B · THE BRANCH-SET LAW) — gitmSelectBranch · the Shield-Gated Turn Over
// Routing Law (three routes: b/-shield-guard · plain-ground turnover · newest-Sword equip + re-pair).
export type GitmSelectBranchPayload = WithOrigin<{ branchName: string }>;

// D2 M9 W1a · gitmAssignRole — ANY branch as A anor B, explicit, decoupled from the checkout
// (the b/ prefix is the auto-mint lineage convention, never role semantics — the C596 user law).
export type GitmAssignRolePayload = WithOrigin<{ role: 'A' | 'B'; branch: string }>;

// D4 (C611) · gitmResetAb — RECOVERY: zero the A/B machine to the true idle ground so the
// register-only auto-induction (gitmAutoInductAB:121 · `abMode==='idle' && stableBranch===''`)
// re-arms on the next bind. NO git exec (pure state recovery · branches untouched). Base is
// `object` (NOT Record<string, never> — that intersection collapses originScpName to `never`,
// mirroring the GitmConfirmSuccessPayload find). confirmToken gates the WATCHKEY two-call round.
export type GitmResetAbPayload = WithOrigin<object> & { confirmToken?: string };

// D2 M9 W1b · gitmRenameBranch — rename with the role-following pointers (stable/working/roles/
// seat all move to the new name in lockstep when they named the old one).
export type GitmRenameBranchPayload = WithOrigin<{ branch: string; newName: string }>;
// GITM Dev Epoch (MD-B · STAGE-FROM-DIFF) — gitmStageHunk · git apply --cached - (the MD-A stdin seam).
export type GitmStageHunkPayload = WithOrigin<{ patch: string }>;
export type GitmLoadLogPayload = WithOrigin<{ limit?: number }>;
// GITM Dev Epoch (MD-C · THE DAG) — gitmLoadLogGraph · git log --format=%H%x1f%P%x1f%D%x1f%an%x1f%s
// --topo-order -n <limit>. A SEPARATE quality from gitmLoadLog (not a flag) — it lands its own
// commitGraph surface via parseGitmLogGraph (the graph carries TRUE parents + refs; the flat log
// carries author/email/date), so the two reducers never contend for one field. The simpler choice.
export type GitmLoadLogGraphPayload = WithOrigin<{ limit?: number }>;
export type GitmLoadDiffPayload = WithOrigin<{ path?: string; staged?: boolean }>;
export type GitmDiscardPayload = WithOrigin<{ path: string; confirmed: boolean }>;
export type GitmPullPayload = WithOrigin<Record<string, never>>;
export type GitmPushPayload = WithOrigin<Record<string, never>>;
// THE VERSIONING MUXAMETER · the CLI self-update (no origin — the bridge updates ITSELF,
// not a target SCP: `npm install -g scs-bridge` at the global prefix).
export type GitmRunCliUpdatePayload = Record<string, never>;
// C928 · THE RELEASE DOOR — set/modify the remote origin URL (PARAMSEAL'd in the quality).
export type GitmSetRemotePayload = WithOrigin<{ url: string }>;
export type GitmMergeFfOnlyPayload = WithOrigin<{ branch: string }>;

// ────────────────────────────────────────────────
// GITM Dev Menu (#644) — DEVBAR ACTION PAYLOAD TYPES
// ────────────────────────────────────────────────

// gitmStageAll · git add -A (stage-only · no commit · distinct from the A↔B composite).
export type GitmStageAllPayload = WithOrigin<Record<string, never>>;
// gitmUnstageAll · git restore --staged . (whole-index unstage).
export type GitmUnstageAllPayload = WithOrigin<Record<string, never>>;
// gitmFetch · git fetch --prune (fetch without merge · catch-based error surface).
export type GitmFetchPayload = WithOrigin<Record<string, never>>;
// gitmCommitAmend · git commit --amend [-m <message> | --no-edit] · T3 single-confirm (token).
export type GitmCommitAmendPayload = WithOrigin<{
  message?: string; // non-empty → --amend -m; empty/absent → --amend --no-edit
  confirmToken?: string; // single-confirm (WATCHKEY · call 2)
}>;
// gitmDiscardAll · git restore . + git clean -fd · T3 DOUBLE-confirm (token · destroys all).
export type GitmDiscardAllPayload = WithOrigin<{
  confirmToken?: string; // double-confirm (WATCHKEY · call 2)
}>;

// ────────────────────────────────────────────────
// D4 (#635) — T3 GUARDED-OP PAYLOAD TYPES (WATCHKEY round-trip)
// ────────────────────────────────────────────────

// gitmReset · --soft/--mixed = single confirm (boolean); --hard = double-confirm (token).
export type GitmResetPayload = WithOrigin<{
  ref: string;
  mode: 'soft' | 'mixed' | 'hard';
  confirmed?: boolean; // soft/mixed single-confirm gate (gitmDiscard parity)
  confirmToken?: string; // hard double-confirm (WATCHKEY · call 2)
}>;

// gitmBranchDelete · -d first (merged check); -D = double-confirm (token).
export type GitmBranchDeletePayload = WithOrigin<{
  name: string;
  force: boolean; // false → -d (merged-only); true → -D (force, token-gated)
  confirmToken?: string; // -D double-confirm (WATCHKEY · call 2)
}>;

// gitmForcePush · --force-with-lease ALWAYS; double-confirm (token).
export type GitmForcePushPayload = WithOrigin<{
  remote?: string;
  branch?: string;
  confirmToken?: string; // double-confirm (WATCHKEY · call 2)
}>;

// gitmMerge · non-ff allowed · NO pre-confirm · conflict is the OUTCOME guard.
// FIELD-DRIFT REPAIR (093 · E3) — `source` is the CANONICAL field (the caller's natural
// git-merge argument name · the schema advertises it); `branch` stays accepted for back-compat
// (the D4 original name). The quality reads `source ?? branch`; a missing/empty value fires the
// guard 'merge-source-required' (never `git merge undefined`).
export type GitmMergePayload = WithOrigin<{ source?: string; branch?: string }>;

// gitmMergeAbort · conflict recovery · guards on conflicts.length > 0.
export type GitmMergeAbortPayload = WithOrigin<Record<string, never>>;

// ────────────────────────────────────────────────
// THE SCP COMMAND MENU (W3 · THE WORKTREE RAIL · W4 · TYPED-NAME DELETE)
// ────────────────────────────────────────────────
//
// The three worktree-rail payloads (WithOrigin — each op resolves to the CALLING SCP's own repo via
// resolveGitmTargetCwd). The identity scheme (D-SCM-W3 §3e): a worktree instance is a FIRST-CLASS
// SCPs.json citizen named `${scpName}--wt-${branchSlug}`, placed as a sibling citizen dir under the
// install root's scps/, its scp.config.json re-stamped to the instance name, its own port allocated.

// gitmWorktreeAdd · create a worktree instance of the CALLING SCP (git worktree add) + register it
// (SCPs.json entry + port + scp.config.json re-stamp). branch = the ref the worktree checks out (must
// exist · the C592 existence law · verbatim, no root-rewrite). instanceSlug = an OPTIONAL explicit
// slug override (absent → derived from the branch via `/`→`-`); the instance name is then
// `${originScpName}--wt-${slug}`. Guards: origin has its OWN .git (dev:self excluded) · branch exists ·
// target dir free · instance name collision-free in SCPs.json.
export type GitmWorktreeAddPayload = WithOrigin<{ branch: string; instanceSlug?: string }>;

// gitmWorktreeList · pure read (git worktree list --porcelain) → worktrees[] roster. No guard, no
// WATCHKEY (mirror gitmLoadConflict / gitmStashList read discipline).
export type GitmWorktreeListPayload = WithOrigin<Record<string, never>>;

// gitmWorktreeRemove · DESTRUCTIVE · WATCHKEY two-call (git worktree remove) + registry retirement
// (removeScpEntry + deleteSlice + gitmWatcherDisarmForScp). instanceName = the exact SCPs.json citizen
// name to remove (PARAMSEAL-sealed — the token minted for instance X cannot fire a remove of Y). force
// → `git worktree remove --force` (a dirty/locked tree refuses a clean remove · soft-guard reason).
// confirmToken gates call 2. Base is `object` (NOT Record — that intersection collapses originScpName
// to `never` · the GitmResetAbPayload precedent).
export type GitmWorktreeRemovePayload = WithOrigin<{
  instanceName: string;
  force?: boolean;
  confirmToken?: string; // double-confirm (WATCHKEY · call 2)
}>;

// ────────────────────────────────────────────────
// GITM Dev Epoch (MD-D · TRUST COMPLETIONS) — reflog / undo / conflict payload types
// ────────────────────────────────────────────────

// gitmLoadReflog · git reflog --format=%h|%gd|%gs -20 → reflogEntries[] (read-only · TQNI ×4).
export type GitmLoadReflogPayload = WithOrigin<{ limit?: number }>;

// gitmUndo · reflog-backed universal undo (git reset --mixed <ref>). WATCHKEY DOUBLE-confirm:
// call 1 (no token) computes the loss preview (`git diff HEAD <ref> --stat`) + mints the token;
// call 2 (valid token) executes reset --mixed + the inline STARC re-read. PARAMSEAL seals
// (reflogRef); BURNTIME (120s) expires it.
export type GitmUndoPayload = WithOrigin<{
  reflogRef: string; // the reflog target (e.g. HEAD@{2}, a commit hash)
  confirmToken?: string; // double-confirm (WATCHKEY · call 2)
}>;

// gitmLoadConflict · read the four sides of a conflicted file (git show :2:/:1:/:3: + working
// content) into activeConflict. Read-only · no guard. { ours, base, theirs, merged }.
export type GitmLoadConflictPayload = WithOrigin<{ path: string }>;

// gitmResolveConflict · write the resolved content to the working file THEN git add it
// (mark-resolved = stage). FailureNode on the write. Clears activeConflict on success.
export type GitmResolveConflictPayload = WithOrigin<{ path: string; content: string }>;

// The four sides of one conflicted file + the parsed working content. Non-optional union
// (`ActiveConflict | null`) — KeyedSelector law. ours = :2: (LOCAL/HEAD) · base = :1: (merge
// base) · theirs = :3: (REMOTE/incoming) · merged = the working file's current (marker-laden)
// content the editor parses into per-block take-ours/theirs/both. TQNI ×4 (state → snapshot →
// SCP GitmJsonShape → relay seam) — the leaner state-field choice over the un-relayed mean result.
export type ActiveConflict = {
  path: string;
  ours: string;
  base: string;
  theirs: string;
  merged: string;
};

// ────────────────────────────────────────────────
// GITM A↔B (#641) — THE 7 A/B RESERVE-MECHANISM PAYLOAD TYPES
// ────────────────────────────────────────────────

// gitmStageAllAndCommit · git add -A then git commit -m <message> (composite).
export type GitmStageAllAndCommitPayload = WithOrigin<{ message: string }>;

// gitmRegisterStable · pure state annotation (reads currentBranch · stores as stableBranch).
// C648 · THE SELECTION-VERBATIM LAW: an explicit `branch` registers VERBATIM (existence-gated ·
// no resolveStableRoot transformation — only B has the appending method). Absent → the legacy
// seat-derived path. (Record<string,never> would collapse the added field — the C579 hazard.)
export type GitmRegisterStablePayload = WithOrigin<{ branch?: string }>;

// gitmCreateWorking · auto-names b/<resolveStableRoot(stable)>-<Date.now()> · create THEN switch.
export type GitmCreateWorkingPayload = WithOrigin<Record<string, never>>;

// gitmTurnOverWithSource · switch to source branch THEN write .bridge-restart.json.
// A-TURN-OVER CONFIRM GUARD (THE-TURN-OVER-A-GUARD) — when source:'A' AND a working B
// exists AND the tree is dirty (anor currentBranch is a b/*), the switch is HELD behind
// the WATCHKEY double-confirm token (same round as gitmBranchDelete -D · PARAMSEAL sealed
// to { source } · BURNTIME 120s): call 1 (no token) → { guardFired:true,
// reason:'a-turnover-needs-confirmation', confirmToken }; call 2 (valid token) → CARRY the
// working changes INTO B (the existing carry seam) THEN proceed with the A switch + restart
// (the C300/Seat-Law auto-return then brings the seat home to B). No working B → the guard
// is irrelevant (plain A turn-over · unchanged).
export type GitmTurnOverWithSourcePayload = WithOrigin<{
  source: 'A' | 'B';
  confirmToken?: string; // A-turn-over carry-into-B double-confirm (WATCHKEY · call 2)
}>;

// gitmRevertToStable · the failsafe · auto-commit B (if dirty) THEN switch A THEN restart.
export type GitmRevertToStablePayload = WithOrigin<Record<string, never>>;

// gitmMergeWorking · switch to A THEN git merge --no-ff <workingBranch>.
export type GitmMergeWorkingPayload = WithOrigin<Record<string, never>>;

// gitmConfirmSuccess · pure state annotation (abMode='success' · bMergeable=true).
// MD-C M5 · THE ORIGIN-THREADED CONFIRM (the C570 field find): the boot-report proof knows WHICH
// SCP booted (report.scpName) — the confirm carries it so a non-pointer origin's success resolves
// to ITS OWN repo/slice (the M3 deferral: env-origin-or-active starved every non-pointer confirm).
// Base is `object` (NOT Record<string, never> — that intersection collapses originScpName to
// `never` and rejects the boot-report watch's TYPED origin dispatch; the merge/revert twins only
// ever receive origin through the MCP generic cast so their degenerate base never surfaced).
export type GitmConfirmSuccessPayload = WithOrigin<object>;

// C412 · THE ATTEMPT-CHECK RESTORE — the reboot rehydration's write leg (value-guarded
// partial fields; the A-GUARD lives in the check, not here).
export type GitmRehydrateAbStatePayload = {
  abMode?: string;
  turnedOverTo?: 'A' | 'B' | '';
  lastTurnOverResult?: string;
  workingBranch?: string;
  stableBranch?: string;
  // M6 · THE ORIGIN DIR — the SCP dir the rehydration read from. The reducer gates the FLAT
  // write to the pointer (the materialized-view law); a non-pointer rehydration lands on its
  // slice only (the principle mirrors it there before dispatching).
  originScpDir?: string;
  // D-BN · THE branchRoles SWEEP — the canonical A/B roles carried back from persisted gitm.json on
  // reboot rehydration (defensive: `persisted.branchRoles?.a ?? ''`). Optional on the payload (a
  // legacy gitm.json predating branchRoles omits it); the reducer value-guards before writing.
  branchRoles?: { a: string; b: string };
};

// GITM A↔B-R (#641-R · CHANGEDIAL) — gitmRecountChanges · pure recount.
// GITM Branch-Flow (#644 · Decision A) — clearError gates the transient action-error clear:
// true ONLY when the CHANGEDIAL event path is OUTSIDE Cascades/Bridge/ (a REAL user-tree
// change). The bridge's own Cascades/Bridge/*.json bookkeeping writes fire CHANGEDIAL too but
// are NOT user changes → clearError:false → the error persists so the user can read it. The
// boot-time setup recount passes clearError:false (no real change at boot).
export type GitmRecountChangesPayload = WithOrigin<{ clearError: boolean }>;

// ────────────────────────────────────────────────
// QUALITY TYPES
// ────────────────────────────────────────────────

export type GitmWatcherArm = Quality<GitmState, GitmWatcherArmPayload>;

export type GitmSetStatus = Quality<GitmState, GitmSetStatusPayload>;

// D3 (#634) — T2 action quality types (explicit Quality<State, Payload> · NEVER typeof)
export type GitmStageFile = Quality<GitmState, GitmStageFilePayload>;
export type GitmUnstageFile = Quality<GitmState, GitmUnstageFilePayload>;
export type GitmCommit = Quality<GitmState, GitmCommitPayload>;
export type GitmBranchCreate = Quality<GitmState, GitmBranchCreatePayload>;
export type GitmBranchSwitch = Quality<GitmState, GitmBranchSwitchPayload>;
export type GitmStashPush = Quality<GitmState, GitmStashPushPayload>;
export type GitmStashPop = Quality<GitmState, GitmStashPopPayload>;
// GITM Dev Epoch (MD-B) — the three new quality types (explicit Quality<State, Payload> · NEVER typeof)
export type GitmStashList = Quality<GitmState, GitmStashListPayload>;
export type GitmSelectBranch = Quality<GitmState, GitmSelectBranchPayload>;

export type GitmAssignRole = Quality<GitmState, GitmAssignRolePayload>;

// D4 (C611) · gitmResetAb — the A/B machine recovery quality type (explicit · NEVER typeof).
export type GitmResetAb = Quality<GitmState, GitmResetAbPayload>;

export type GitmRenameBranch = Quality<GitmState, GitmRenameBranchPayload>;
export type GitmStageHunk = Quality<GitmState, GitmStageHunkPayload>;
export type GitmLoadLog = Quality<GitmState, GitmLoadLogPayload>;
// GITM Dev Epoch (MD-C · THE DAG) — the graph-log quality type (explicit · NEVER typeof).
export type GitmLoadLogGraph = Quality<GitmState, GitmLoadLogGraphPayload>;
export type GitmLoadDiff = Quality<GitmState, GitmLoadDiffPayload>;
export type GitmDiscard = Quality<GitmState, GitmDiscardPayload>;
export type GitmPull = Quality<GitmState, GitmPullPayload>;
export type GitmRunCliUpdate = Quality<GitmState, GitmRunCliUpdatePayload>;
export type GitmPush = Quality<GitmState, GitmPushPayload>;
export type GitmSetRemote = Quality<GitmState, GitmSetRemotePayload>;
export type GitmMergeFfOnly = Quality<GitmState, GitmMergeFfOnlyPayload>;

// GITM Dev Menu (#644) — DEVBAR action quality types (explicit Quality<State, Payload> · NEVER typeof)
export type GitmStageAll = Quality<GitmState, GitmStageAllPayload>;
export type GitmUnstageAll = Quality<GitmState, GitmUnstageAllPayload>;
export type GitmFetch = Quality<GitmState, GitmFetchPayload>;
export type GitmCommitAmend = Quality<GitmState, GitmCommitAmendPayload>;
export type GitmDiscardAll = Quality<GitmState, GitmDiscardAllPayload>;

// D4 (#635) — T3 guarded-op quality types (explicit Quality<State, Payload> · NEVER typeof)
export type GitmReset = Quality<GitmState, GitmResetPayload>;
export type GitmBranchDelete = Quality<GitmState, GitmBranchDeletePayload>;
export type GitmForcePush = Quality<GitmState, GitmForcePushPayload>;
export type GitmMerge = Quality<GitmState, GitmMergePayload>;
export type GitmMergeAbort = Quality<GitmState, GitmMergeAbortPayload>;

// THE SCP COMMAND MENU (W3/W4 · THE WORKTREE RAIL) — the three worktree-rail quality types
// (explicit Quality<State, Payload> · NEVER typeof). add = create+register · list = pure read ·
// remove = WATCHKEY destructive + registry retirement.
export type GitmWorktreeAdd = Quality<GitmState, GitmWorktreeAddPayload>;
export type GitmWorktreeList = Quality<GitmState, GitmWorktreeListPayload>;
export type GitmWorktreeRemove = Quality<GitmState, GitmWorktreeRemovePayload>;

// GITM Dev Epoch (MD-D · TRUST COMPLETIONS) — reflog/undo/conflict quality types (NEVER typeof)
export type GitmLoadReflog = Quality<GitmState, GitmLoadReflogPayload>;
export type GitmUndo = Quality<GitmState, GitmUndoPayload>;
export type GitmLoadConflict = Quality<GitmState, GitmLoadConflictPayload>;
export type GitmResolveConflict = Quality<GitmState, GitmResolveConflictPayload>;

// GITM A↔B (#641) — the 7 A/B reserve-mechanism quality types (NEVER typeof)
export type GitmStageAllAndCommit = Quality<GitmState, GitmStageAllAndCommitPayload>;
export type GitmRegisterStable = Quality<GitmState, GitmRegisterStablePayload>;
export type GitmCreateWorking = Quality<GitmState, GitmCreateWorkingPayload>;
export type GitmTurnOverWithSource = Quality<GitmState, GitmTurnOverWithSourcePayload>;
export type GitmRevertToStable = Quality<GitmState, GitmRevertToStablePayload>;
export type GitmMergeWorking = Quality<GitmState, GitmMergeWorkingPayload>;
export type GitmConfirmSuccess = Quality<GitmState, GitmConfirmSuccessPayload>;
export type GitmRehydrateAbState = Quality<GitmState, GitmRehydrateAbStatePayload>;

// GITM A↔B-R (#641-R · CHANGEDIAL) — the recount quality type (NEVER typeof).
// (The projectRoot watcher arm is PRUNED — GITM SCP-SOVEREIGN; GitmWatcherArmPayload's
// 'projectRoot' kind is now unused but kept on the gitDir-arm discriminator for compatibility.)
export type GitmRecountChanges = Quality<GitmState, GitmRecountChangesPayload>;

// GITM SCP-SOVEREIGN — the SCP (RED) watcher arm is the SOLE location watcher + the unified
// recount + the activeScpDir setter. (NEVER typeof.) The Base (projectRoot) + Cascade watcher
// arms are PRUNED. GitmLocationWatcherArmPayload still serves the SCP arm.
export type GitmScpWatcherArm = Quality<GitmState, GitmLocationWatcherArmPayload>;
export type GitmRecountLocation = Quality<GitmState, GitmRecountLocationPayload>;
// GITM SCP-SOVEREIGN — the first setter for activeScpDir (dispatched at the SCP bind seam).
export type GitmSetActiveScpDirPayload = { activeScpDir: string };
export type GitmSetActiveScpDir = Quality<GitmState, GitmSetActiveScpDirPayload>;

// MULTI-SCP GITM MUXIFICATION (Fork B · MC-W2 · THE WATCHER PLURALITY) — the per-SCP watcher arm/disarm
// qualities. arm registers a per-SCP watcher pair (registry.armWatchersForScp) whose events dispatch
// STATUS/RECOUNT for THAT scpDir (originScpName=scpDir → resolveGitmTargetCwd routes them); disarm tears
// the pair down + deletes its slice. { scpDir } payload (the SCP PACKAGE dir · the slice/watcher key).
// The reducers return {} (no flat-state mutation — the pair lives module-scope in the registry, the
// FSWatcher precedent · the flat gitWatcher/scpWatcher fields stay untouched · the materialized-view law).
export type GitmWatcherForScpPayload = { scpDir: string };
export type GitmWatcherArmForScp = Quality<GitmState, GitmWatcherForScpPayload>;
export type GitmWatcherDisarmForScp = Quality<GitmState, GitmWatcherForScpPayload>;

// GITM A↔B Auto-Induction ("Move with C") — the empty-payload quality the SCP bind seam fires
// once per cycle. Guards on abMode === 'idle' && stableBranch === ''; composes the #641
// register/fork primitives to prime A (init-commit) + register A + fork B + land on B. (NEVER typeof.)
export type GitmAutoInductABPayload = Record<string, never>;
export type GitmAutoInductAB = Quality<GitmState, GitmAutoInductABPayload>;

// SCP-UPD D-U4.3 (Fork C) — the 4 SCP-update strategy quality types (NEVER typeof).
// The 3-node strategy (ensureClone → runDiff → stageRelay) + the entry initiator.
// All node payloads are empty (the nodes read activeScpDir/scpName from state + templatePath
// from carried strategyData), except the entry which accepts an optional scpName override.
export type GitmScpUpdateBeginPayload = WithOrigin<{ scpName?: string }>;
export type GitmScpUpdateBegin = Quality<GitmState, GitmScpUpdateBeginPayload>;
// RS.4 · THE PER-SCP RAIL — the chain nodes carry their TARGET baked into the node payloads
// (Begin resolves identity ONCE and the factory bakes it in; no node re-reads shared state
// for identity — the cross-target hazard dies). targetScpDir = the resolved SCP package dir
// (the slice-store key); scpName = the diff filename key. '' anor absent = the active fallback.
export type GitmScpUpdateChainCarriage = { scpName?: string; targetScpDir?: string };
export type GitmScpUpdateEnsureClonePayload = GitmScpUpdateChainCarriage;
export type GitmScpUpdateEnsureClone = Quality<GitmState, GitmScpUpdateEnsureClonePayload>;
export type GitmScpUpdateRunDiffPayload = GitmScpUpdateChainCarriage;
export type GitmScpUpdateRunDiff = Quality<GitmState, GitmScpUpdateRunDiffPayload>;
export type GitmScpUpdateStageRelayPayload = GitmScpUpdateChainCarriage;
export type GitmScpUpdateStageRelay = Quality<GitmState, GitmScpUpdateStageRelayPayload>;

// SCP-UPD D-U5 — the APPLY quality type (the held gate · gitm_run_apply · NEVER typeof).
// A standalone tool Lambda (NOT a strategy node) — it reads the resolved manifest (or the
// empty-conference diff fallback), HALTs on pending !== 0, lands the write/patch/preserve
// totality into the SCP tree, and stages+commits via the gitmExec seam. Optional scpName
// overrides the active-SCP default (mirrors GitmScpUpdateBeginPayload).
export type GitmScpUpdateApplyPayload = WithOrigin<{
  scpName?: string;
  // C289 auto-apply-on-manifest: true → on apply SUCCESS the bridge itself chains the
  // Concluding Sequence (turn-over B) — the resolver session never invokes the landing.
  autoSequence?: boolean;
}>;
export type GitmScpUpdateApply = Quality<GitmState, GitmScpUpdateApplyPayload>;

// SCP-UPD · gitm_update_progress — the UI-tool the resolver session fires to STAMP its live
// position onto updateStatus (the Update view renders it). All-optional payload; the reducer
// stamps ONLY the provided fields (partial return · NEVER typeof).
// RS.3 · SOVEREIGN TOOL CALLS — WithOrigin: the resolver session stamps ITS OWN SCP's rail
// (originScpName → resolveGitmTargetCwd → the per-SCP slice); absent = the active fallback.
export type GitmScpUpdateProgressPayload = WithOrigin<{
  stage?: 'idle' | 'cloning' | 'diffing' | 'reviewing' | 'resolving' | 'applying' | 'error';
  note?: string;
  resolvedPending?: number;
  // C326 · THE UPDATE-CYCLE RESET — the boot-report B-proof branch stamps diffPresent:false
  // (the panel yields). Same only-when-provided semantics as note/stage: the reducer copies it
  // ONLY when supplied (undefined = untouched · false actively clears the residual diff flag).
  diffPresent?: boolean;
}>;
export type GitmScpUpdateProgress = Quality<GitmState, GitmScpUpdateProgressPayload>;

// SCP-UPD D-U4.3 — the strategy-data shapes carried node→node (strategyData_muxifyData /
// strategyData_select). NODE 1 emits the clone shape; NODE 2 consumes it + emits the diff
// shape; NODE 3 consumes the diff shape to locate the written JSON.
export type GitmScpUpdateCloneStrategyData = {
  templatePath: string;
  cloneMode: string;
};
export type GitmScpUpdateDiffStrategyData = {
  scpName: string;
  templatePath: string;
};
