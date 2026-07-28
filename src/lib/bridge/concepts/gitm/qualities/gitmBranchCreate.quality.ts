/**
 * gitmBranchCreate Quality · GITM D3 (#634) · T2 simple · git branch <name>
 *
 * CHECKOUT-TOGGLE (#644): the payload carries an optional `checkout` flag.
 *   checkout absent/false → git branch <name>   (create-only · the original call · no switch)
 *   checkout === true     → git switch -c <name> (create AND switch · carries dirty state)
 * `git switch -c` is a git-native single op (not a compound) and SUCCEEDS on a
 * dirty tree (changes carry over) — unlike switching to an EXISTING branch, so
 * no dirty-tree GUARDSHUNT applies here. Lands a GitmActionResult. No guard.
 * WATCHDIAL fires on .git/refs/heads (+ .git/HEAD on switch) → STARC refresh
 * follows. Reducer partial-return { lastActionResult } only.
 *
 * Template: gitmStageFile.quality.ts (D3 simple-set discipline)
 * Citation: GITM-D3-S3-YELLOW-BLUEPRINT.md §4 (simple set · branchCreate) ·
 *           GITM-DEVMENU-S2-ORANGE-DESIGN.md §3-5 (CHECKOUT-TOGGLE · git switch -c)
 */

import {
  createQualityCardWithPayload,
  createMethodWithConcepts,
  selectPayload,
  muxiumConclude,
  strategySuccess,
  strategyData_muxifyData,
  type Concept,
} from 'stratimux';
import type { GitmState } from '../gitm.types';
import type { GitmBranchCreatePayload, GitmBranchCreate, GitmActionResult } from './types';
import { gitmExec } from '../model/gitmExec.model';
import { resolveGitmTargetCwd } from '../model/gitmOpCwd.model';
import { readGitStatus, type GitmStatusResult } from '../model/gitmStatus.model';
import { mapGitmExecError } from '../model/gitmErrorCode.model';
import { isWorkingBranch, isWorkingBranchFor } from '../model/gitmBranchRoot.model';
import type { GitmABMode } from '../gitm.types';

export type { GitmBranchCreate };

// GITM Branch-Flow (#644) — Front 2 inline-refresh: the bucket carries the STARC refresh
// (exec.ok) so a created/switched branch lands in branches[]/currentBranch immediately,
// not via the indirect WATCHDIAL tick. refresh:null on failure (git produced no new tree).
// On failure the error code is computed in the method (userCwd in hand) and rides the item
// so the reducer stays a pure partial-return.
interface BranchCreateBucketItem {
  result: GitmActionResult;
  refresh: GitmStatusResult | null;
  errorCode: string;
}

const bucket: BranchCreateBucketItem[] = [];

type GitmSelfDeck = {
  gitm: Concept<GitmState, Record<string, unknown>>;
};

export const gitmBranchCreate = createQualityCardWithPayload<
  GitmState,
  GitmBranchCreatePayload,
  GitmSelfDeck
>({
  type: 'Gitm Branch Create',
  reducer: (state) => {
    const item = bucket.pop();
    if (!item) {
      return {};
    }
    // SUCCESS — spread the inline STARC refresh (mirror gitmBranchDelete) so the new branch
    // appears at once; do NOT write errorCode:'' here — the next STARC read / real user-tree
    // change clears any stale error (avoids double-write churn · S3 Edit 1.4 note).
    if (item.refresh) {
      // THE POINTER FIX (Cycle 273 · the 074 two-B collision): a b/-namespaced branch created
      // AND checked out IS the working B — set the pointer here, at the source. Without this,
      // the panel's Move-into-B forked b2 while workingBranch still held an earlier BSEED b1 —
      // the turn-over then followed the STALE pointer and the user's work vanished from the tree.
      // D-BN · THE branchRoles SWEEP — this is a LEGACY-inference adoption: adopt the created branch
      // as B ONLY when roles.b is UNASSIGNED (no canonical B yet) AND the legacy `b/`-prefix matches
      // (isWorkingBranchFor with empty knownB · roles-unassigned path). When roles.b IS already
      // assigned, the canonical truth stands — this inference never overrides it. On adoption, set
      // roles.b in LOCKSTEP with the pointer.
      const pointer =
        state.branchRoles.b.length === 0 &&
        isWorkingBranchFor(item.refresh.currentBranch, '')
          ? {
              workingBranch: item.refresh.currentBranch,
              branchRoles: { a: state.branchRoles.a, b: item.refresh.currentBranch },
              abMode: 'candidate-created' as GitmABMode,
            }
          : {};
      return {
        ...pointer,
        isRepo: item.refresh.isRepo,
        currentBranch: item.refresh.currentBranch,
        dirty: item.refresh.dirty,
        ahead: item.refresh.ahead,
        behind: item.refresh.behind,
        branches: item.refresh.branches,
        stagedFiles: item.refresh.stagedFiles,
        unstagedFiles: item.refresh.unstagedFiles,
        detachedHead: item.refresh.detachedHead,
        conflicts: item.refresh.conflicts,
        lastReadAt: item.refresh.lastReadAt,
        stashCount: item.refresh.stashCount,
        lastActionResult: item.result,
      };
    }
    // FAILURE (no refresh) — GITM Branch-Flow (#644) Front 1 error surface. The raw stderr in
    // item.result.error IS the create-failure reveal (index.lock / git-not-found / etc.).
    return {
      lastActionResult: item.result,
      errorCode: item.errorCode,
      errorMessage: item.result.error,
    };
  },
  methodCreator: () =>
    createMethodWithConcepts(({ action, deck }) => {
      const { name, checkout, originScpName } = selectPayload<GitmBranchCreatePayload>(action);
      // MULTI-SCP GITM MUXIFICATION (MC-W1) — CALLING SCP's repo (origin-aware) · SCP-Sovereign fallback.
      const userCwd = resolveGitmTargetCwd(deck, originScpName);

      // F-d · THE MINT GUARD (Cycle 299 · the A/B Law · FailureNode Doctrine). The working-B
      // namespace is `b/<base>-<ts>` — the fork logic anchors to the true stable ROOT and prepends
      // `b/`. A caller passing an ALREADY-`b/`-prefixed name (a re-forked B, a stale checked-out B
      // re-registered) would double-mint `b/b/…` (BASEANCHOR guards the fork side; this guards the
      // CREATE side). Hand the outcome (guardFired · 'b-namespace-already-prefixed') — NEVER
      // silently mint: the FailureNode Doctrine returns the outcome, never a bare conclude nor a
      // wild write. The reducer surfaces lastActionResult (guard path · no refresh).
      if (isWorkingBranch(name)) {
        const guard: GitmActionResult = {
          action: 'gitmBranchCreate',
          ok: false,
          error: '',
          guardFired: true,
          reason: 'b-namespace-already-prefixed',
          at: Date.now(),
        };
        bucket.push({ result: guard, refresh: null, errorCode: '' });
        return action.strategy
          ? strategySuccess(action.strategy, strategyData_muxifyData(action.strategy, { ...guard }))
          : muxiumConclude();
      }

      const exec = checkout === true
        ? gitmExec(['switch', '-c', name], userCwd)
        : gitmExec(['branch', name], userCwd);
      const result: GitmActionResult = {
        action: 'gitmBranchCreate',
        ok: exec.ok,
        error: exec.ok ? '' : exec.error || exec.stderr,
        guardFired: false,
        reason: '',
        at: Date.now(),
      };
      const errorCode = exec.ok
        ? ''
        : mapGitmExecError(result.error, 'GITM_BRANCH_CREATE_FAILED', userCwd);
      bucket.push({ result, refresh: exec.ok ? readGitStatus(userCwd) : null, errorCode });
      return action.strategy
        ? strategySuccess(action.strategy, strategyData_muxifyData(action.strategy, { ...result }))
        : muxiumConclude();
    }),
});
