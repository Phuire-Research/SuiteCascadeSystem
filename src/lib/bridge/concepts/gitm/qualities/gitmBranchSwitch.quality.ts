/**
 * gitmBranchSwitch Quality · GITM D3 (#634) · T2 GUARDSHUNT · git switch <name>
 *
 * GUARDSHUNT (dirty-tree): the Method reads deck.gitm.k.dirty BEFORE exec. If
 * dirty === true → guardFired { reason: 'dirty-tree' } + a 'stash' recommendation
 * carried in strategy.data; git is NEVER invoked (never a silent force-checkout).
 * Otherwise runs gitmExec(['switch', name]). WATCHDIAL fires on .git/HEAD → STARC
 * refresh follows. Reducer partial-return { lastActionResult } only.
 *
 * The `recommendation` key rides in strategy.data (relayed to the MCP caller) but
 * NOT in lastActionResult state — the GitmActionResult schema stays stable
 * (KeyedSelector law); reason 'dirty-tree' carries the core signal in state.
 *
 * Template: gitmCommit.quality.ts (guard discipline) · GUARDSHUNT precedent (Curation §3)
 * Citation: GITM-D3-S3-YELLOW-BLUEPRINT.md §4 (branchSwitch · GUARDSHUNT dirty-tree)
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
import type { GitmBranchSwitchPayload, GitmBranchSwitch, GitmActionResult } from './types';
import { gitmExec } from '../model/gitmExec.model';
import { resolveGitmTargetCwd } from '../model/gitmOpCwd.model';
import { readGitStatus, type GitmStatusResult } from '../model/gitmStatus.model';
import { mapGitmExecError } from '../model/gitmErrorCode.model';

export type { GitmBranchSwitch };

// GITM Branch-Flow (#644) — Front 2 inline-refresh: on a successful switch the bucket carries
// the STARC refresh so currentBranch + the new branch's working set land at once (not via the
// indirect WATCHDIAL tick). The GUARDSHUNT dirty-tree path stays refresh:null (git never ran)
// but DOES surface GITM_DIRTY_SWITCH_BLOCKED. The error code rides the item (Front 1).
interface BranchSwitchBucketItem {
  result: GitmActionResult;
  refresh: GitmStatusResult | null;
  errorCode: string;
  errorMessage: string;
}

const bucket: BranchSwitchBucketItem[] = [];

type GitmSelfDeck = {
  gitm: Concept<GitmState, Record<string, unknown>>;
};

export const gitmBranchSwitch = createQualityCardWithPayload<
  GitmState,
  GitmBranchSwitchPayload,
  GitmSelfDeck
>({
  type: 'Gitm Branch Switch',
  reducer: (state) => {
    const item = bucket.pop();
    if (!item) {
      return {};
    }
    // SUCCESS — spread the inline STARC refresh (mirror gitmBranchDelete); the next STARC read /
    // real user-tree change clears any stale error (no double-write here).
    if (item.refresh) {
      return {
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
    // FAILURE (no refresh) — GITM Branch-Flow (#644) Front 1 dual error surface: the GUARDSHUNT
    // dirty-tree block (GITM_DIRTY_SWITCH_BLOCKED · git never ran) OR the exec failure.
    return {
      lastActionResult: item.result,
      errorCode: item.errorCode,
      errorMessage: item.errorMessage,
    };
  },
  methodCreator: () =>
    createMethodWithConcepts(({ action, deck }) => {
      const { name } = selectPayload<GitmBranchSwitchPayload>(action);

      // GUARDSHUNT (pre-exec · git never invoked when fired)
      const dirty = deck.gitm.k.dirty.select();
      if (dirty === true) {
        const guard: GitmActionResult = {
          action: 'gitmBranchSwitch',
          ok: false,
          error: '',
          guardFired: true,
          reason: 'dirty-tree',
          at: Date.now(),
        };
        // GITM Branch-Flow (#644) — surface the user-facing block (NOT a silent failure · git
        // never ran → refresh:null). The dirty-tree guard is a UX block, not a git error.
        bucket.push({
          result: guard,
          refresh: null,
          errorCode: 'GITM_DIRTY_SWITCH_BLOCKED',
          errorMessage: 'Working tree is dirty — stash or commit before switching.',
        });
        return action.strategy
          ? strategySuccess(
              action.strategy,
              strategyData_muxifyData(action.strategy, { ...guard, recommendation: 'stash' }),
            )
          : muxiumConclude();
      }

      // MULTI-SCP GITM MUXIFICATION (MC-W1) — CALLING SCP's repo (origin-aware) · SCP-Sovereign fallback.
      const userCwd = resolveGitmTargetCwd(deck, selectPayload<GitmBranchSwitchPayload>(action).originScpName);
      const exec = gitmExec(['switch', name], userCwd);
      const result: GitmActionResult = {
        action: 'gitmBranchSwitch',
        ok: exec.ok,
        error: exec.ok ? '' : exec.error || exec.stderr,
        guardFired: false,
        reason: '',
        at: Date.now(),
      };
      const errorCode = exec.ok
        ? ''
        : mapGitmExecError(result.error, 'GITM_BRANCH_SWITCH_FAILED', userCwd);
      bucket.push({
        result,
        refresh: exec.ok ? readGitStatus(userCwd) : null,
        errorCode,
        errorMessage: result.error,
      });
      return action.strategy
        ? strategySuccess(action.strategy, strategyData_muxifyData(action.strategy, { ...result }))
        : muxiumConclude();
    }),
});
