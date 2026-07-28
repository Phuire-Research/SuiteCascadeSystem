/**
 * gitmSetStatus Quality · GITM D2 (#633) · STARC result lands whole
 *
 * ONE set quality — the entire STARC parse arrives in one reducer, one state
 * transition, zero interleaved reads (STARC coherence law). The Method ignores
 * its payload and calls readGitStatus(userCwd) (read userCwd from state via the
 * self-deck selector); the result lands as the bucket item; the Reducer returns
 * ONLY the STARC fields as partial state (shortest-path · M-perf).
 *
 * gitWatcher + userCwd are NOT returned by the Reducer (unchanged · partial-
 * return law). Direct dispatch from the WATCHDIAL principle (no strategy) →
 * muxiumConclude() when no strategy is present.
 *
 * D4 (#635) REACTIVE-WARDEN: the reducer ALSO REBUILDS activeWarnings whole from
 * the STARC fields (detachedHead → a row; conflicts → a row; behind → a row).
 * REBUILT, never appended — the array is the current reactive truth of the repo,
 * so each STARC cycle replaces it (a cleared trap-state drops its warning). The
 * detached-HEAD latent warning emits HERE (reactively), NOT via an action result.
 *
 * Template: scpMessageRouterWatcherArm.quality.ts (Method+Reducer+Bucket)
 * Citation: GITM-D2-S3-YELLOW-BLUEPRINT.md §4b · GITM-D4-S4-GREEN-EXAM.md Q3 (REACTIVE-WARDEN)
 * Citation: STRATIMUX-REFERENCE.md "🧩 Quality Creation Patterns" + "🚀 Reducer Performance"
 */

import {
  createQualityCardWithPayload,
  createMethodWithConcepts,
  selectPayload,
  muxiumConclude,
  strategySuccess,
  type Concept,
} from 'stratimux';
import type { GitmState } from '../gitm.types';
import type { GitmSetStatusPayload, GitmSetStatus, GitmWarning } from './types';
import { readGitStatus, type GitmStatusResult } from '../model/gitmStatus.model';
import { resolveGitmTargetCwd } from '../model/gitmOpCwd.model';
import { deriveAbPointers } from '../model/gitmBranchRoot.model';
// MULTI-SCP GITM MUXIFICATION (MC-W2 step 9) — the per-SCP slice store: gitmSetStatus populates the
// CALLING SCP's slice with every STARC read (the per-repo truth GITEP fans out · MC-W3).
import { upsertSliceFields, type GitmRepoSlice } from '../model/gitmSliceStore.model';

export type { GitmSetStatus };

// REACTIVE-WARDEN · rebuild the latent-warning array whole from a STARC result.
// Pure (no state read) — the reducer calls it on every set so the array always
// reflects the CURRENT repo trap-state (cleared traps drop their warning row).
const buildActiveWarnings = (item: GitmStatusResult): GitmWarning[] => {
  const now = Date.now();
  const warnings: GitmWarning[] = [];
  if (item.detachedHead) {
    warnings.push({
      code: 'detached-head',
      message:
        'You are in detached HEAD state. Create a branch to preserve any new commits before switching away.',
      issuedAt: now,
    });
  }
  if (item.conflicts.length > 0) {
    warnings.push({
      code: 'merge-conflict',
      message: `Merge conflict in ${item.conflicts.length} file(s). Resolve the conflicts and commit, or run gitm_merge_abort to back out.`,
      issuedAt: now,
    });
  }
  if (item.behind > 0) {
    warnings.push({
      code: 'behind-remote',
      message: `Your branch is behind the remote by ${item.behind} commit(s). Pull before you push to avoid divergence.`,
      issuedAt: now,
    });
  }
  return warnings;
};

// MULTI-SCP GITM MUXIFICATION (MC-W2 step 9) — the bucket carries the RESOLVED target cwd + the ACTIVE
// dir alongside the STARC result so the reducer can populate the CALLING SCP's slice AND decide whether
// to also write the flat state (materialized-view law): resolvedCwd === active → BOTH; a non-active SCP
// → ONLY the slice (never write another SCP's truth into the flat state · the CHIMERA repair).
interface GitmSetStatusBucketItem {
  result: GitmStatusResult;
  resolvedCwd: string;
  activeScpDir: string;
}

const gitmBucket: GitmSetStatusBucketItem[] = [];

type GitmSelfDeck = {
  gitm: Concept<GitmState, Record<string, unknown>>;
};

// The STARC fields that populate BOTH the flat state and the per-SCP slice (byte-parity field names).
const buildSliceStarcFields = (
  item: GitmStatusResult,
): Partial<GitmRepoSlice> => ({
  isRepo: item.isRepo,
  currentBranch: item.currentBranch,
  dirty: item.dirty,
  ahead: item.ahead,
  behind: item.behind,
  branches: item.branches,
  stagedFiles: item.stagedFiles,
  unstagedFiles: item.unstagedFiles,
  untrackedFiles: item.untrackedFiles,
  detachedHead: item.detachedHead,
  conflicts: item.conflicts,
  lastReadAt: item.lastReadAt,
  stashCount: item.stashCount,
  remoteOrigin: item.remoteOrigin,
  headCommitMessage: item.headCommitMessage,
  activeWarnings: buildActiveWarnings(item),
  errorCode: '',
  errorMessage: '',
  // MD-C M10 · THE TOKEN SURVIVES THE STARC TICK (the C577 endless-overlay find): this builder
  // used to clear pendingConfirm on every STARC slice upsert — on a multi-SCP bridge the watcher
  // churn ticks sub-second, so a freshly-minted WATCHKEY token died before the client's ~3s
  // handshake poll ever saw it (call-2 aborted → the fallback re-raised the modal, endlessly).
  // The token lifecycle owns the field now: minted by the guard, consumed by call-2, bounded by
  // BURNTIME expiry. STARC never touches it.
});

export const gitmSetStatus = createQualityCardWithPayload<
  GitmState,
  GitmSetStatusPayload,
  GitmSelfDeck
>({
  type: 'Gitm Set Status',
  reducer: (state) => {
    const bucketItem = gitmBucket.pop();
    if (!bucketItem) {
      return {};
    }
    const { result: item, resolvedCwd, activeScpDir } = bucketItem;

    // MULTI-SCP GITM MUXIFICATION (MC-W2 step 9) — populate the CALLING SCP's slice with the STARC
    // fields (ALWAYS · the slice is the per-SCP truth GITEP fans out in MC-W3). A NON-active SCP updates
    // ONLY here; the active SCP updates the slice AND the flat state below (the materialized-view law).
    if (resolvedCwd !== '') {
      upsertSliceFields(resolvedCwd, buildSliceStarcFields(item));
    }

    // The flat state is the ACTIVE SLICE materialized view: write it ONLY when this read is for the
    // active SCP (resolvedCwd === activeScpDir) OR when there is no active SCP (activeScpDir === '' →
    // the dev/no-SCP path, the flat state IS the view). A non-active SCP's read must NOT clobber the
    // flat state with its own branchRoles/stableBranch (THE CHIMERA the whole Fork repairs).
    const isActiveView = activeScpDir === '' || resolvedCwd === activeScpDir || resolvedCwd === '';
    if (!isActiveView) {
      return {};
    }
    // C366 · THE STARC RE-PAIR — gitmSetStatus is the SINGLE point every status refresh
    // (WATCHDIAL/CHANGEDIAL tick + boot read) flows through, so the A↔B pointer re-pair lands
    // HERE. The Cycle-273 POINTER FIX only sets workingBranch inside gitmBranchCreate; a Sword
    // born via the HARD TURN-OVER path (triggerHardTurnOver, freehop-class — cannot reach bridge
    // gitm state) OR any bridge RESTART on a b/ branch loses the pointer → dead Turn-Over-B button
    // + empty A↔B diff despite a real file difference (the C366 live incident: on b/master-… with
    // 45 files vs master, workingBranch:''). Value-guarded (yields {} when correct) → no write-storm;
    // includes the stale-pointer prune on a Shield. See deriveAbPointers (gitmBranchRoot.model).
    // D-BN · THE branchRoles SWEEP — feed the canonical roles into the re-pair so it decides from
    // ROLES EQUALITY first (prefix inference only when both roles are unassigned); the returned
    // branchRoles spreads back in LOCKSTEP with stable/working (deriveAbPointers · gitmBranchRoot.model).
    const abPointers = deriveAbPointers(item, {
      workingBranch: state.workingBranch,
      stableBranch: state.stableBranch,
      branchRoles: state.branchRoles,
    });
    return {
      ...abPointers,
      isRepo: item.isRepo,
      currentBranch: item.currentBranch,
      dirty: item.dirty,
      ahead: item.ahead,
      behind: item.behind,
      branches: item.branches,
      stagedFiles: item.stagedFiles,
      unstagedFiles: item.unstagedFiles,
      // GITM SCP-Sovereign — the top-level untracked mirror lands with the STARC set (item
      // carries untrackedFiles from the porcelain `? ` parse · TQNI top-level relay decl).
      untrackedFiles: item.untrackedFiles,
      detachedHead: item.detachedHead,
      conflicts: item.conflicts,
      lastReadAt: item.lastReadAt,
      // GITM Dev Menu (#644) — STASHCOUNT lands with the STARC set.
      stashCount: item.stashCount,
      // MD-C M10 · THE TOKEN SURVIVES THE STARC TICK — the #644 disarm-on-re-read cleared the
      // token on every STARC refresh; with the multi-SCP watcher churn that killed it inside the
      // client's handshake window (the endless confirm-overlay). BURNTIME expiry bounds an
      // unconsumed token; the call-2 execute clears a consumed one. STARC no longer touches it.
      // GITM Branch-Flow (#644) — clear the transient action-error on a fresh STARC read. This
      // is the .git-event clear path (WATCHDIAL → gitmSetStatus): a real .git change (e.g. a
      // SUCCESSFUL switch/create) re-reads the repo and retires the error. Mirrors the
      // pendingConfirm disarm-on-re-read above. The user-tree clear path (Decision A · non-
      // Cascades/Bridge/ edits) lives in gitmRecountChanges.
      errorCode: '',
      errorMessage: '',
      // REACTIVE-WARDEN · REBUILT whole every STARC cycle (replace · never append)
      activeWarnings: buildActiveWarnings(item),
    };
  },
  methodCreator: () =>
    createMethodWithConcepts(({ action, deck }) => {
      // GITM SCP-Sovereign — read the ACTIVE SCP's status (currentBranch / branches / staged /
      // unstaged), NOT the install root. The pivot re-pointed the gitmExec ops + the badge count
      // (gitmRecountLocation) to selectGitmOpCwd, but gitmSetStatus still read userCwd — so the
      // top-level branch/panel display showed the install root (the 024 branches-mismatch: gitm.json
      // ["master"] while the SCP had b/master-…). selectGitmOpCwd = activeScpDir || userCwd.
      // MULTI-SCP GITM MUXIFICATION (MC-W1) — the per-SCP watcher (MC-W2) dispatches gitmSetStatus with
      // originScpName=scpDir so the STARC read targets THAT SCP's repo (origin-aware); SCP-Sovereign
      // fallback (activeScpDir || userCwd) for the boot / active-SCP dispatch path (no origin threaded).
      const resolvedCwd = resolveGitmTargetCwd(deck, selectPayload<GitmSetStatusPayload>(action).originScpName);
      const activeScpDir = deck.gitm.k.activeScpDir.select();
      const result = readGitStatus(resolvedCwd);
      gitmBucket.push({ result, resolvedCwd, activeScpDir });
      return action.strategy ? strategySuccess(action.strategy) : muxiumConclude();
    }),
});
