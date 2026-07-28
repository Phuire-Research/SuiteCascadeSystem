/**
 * gitmMerge Quality · GITM D4 (#635) · T3 GUARD-AS-OUTCOME · git merge <branch>
 *
 * The T3 nature of a non-ff merge is the OUTCOME, not the dispatch (EXAM Q3 +
 * Forward Context #5): the merge ALWAYS executes (NO pre-confirm gate · no
 * WATCHKEY token). `git merge <branch>` runs with NO --ff-only flag (that is
 * gitmMergeFfOnly at T2). The structural warning is the conflict STATUS that
 * lands in k.conflicts[]:
 *   - clean / ff merge   → ok:true · normal result.
 *   - conflict           → ok:false, reason:'merge-conflict-resolution-required';
 *                          the inline STARC re-read populates conflicts[] (and the
 *                          REACTIVE-WARDEN merge-conflict warning rebuilds via the
 *                          WATCHDIAL → gitmSetStatus cycle). The gitmMergeAbort
 *                          affordance becomes available once conflicts.length > 0.
 *
 * EXPLICIT STARC RE-READ (inline · WATCHDIAL also fires on .git/MERGE_HEAD): the
 * inline readGitStatus runs in BOTH branches (success AND conflict) so conflicts[]
 * is coherent in the same Method — a conflicting merge leaves the repo mid-merge
 * and the caller must see the conflict state immediately.
 *
 * Template: gitmMergeFfOnly.quality.ts (T2 merge) · gitmPush.quality.ts (inline re-read)
 * Citation: GITM-D4-S4-GREEN-EXAM.md Q3 (gitmMerge · guard-as-OUTCOME · no pre-confirm)
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
import type { GitmMergePayload, GitmMerge, GitmActionResult } from './types';
import { gitmExec, setCurrentOp, clearCurrentOp } from '../model/gitmExec.model';
import { resolveGitmTargetCwd } from '../model/gitmOpCwd.model';
import { readGitStatus, type GitmStatusResult } from '../model/gitmStatus.model';

export type { GitmMerge };

interface MergeBucketItem {
  result: GitmActionResult;
  refresh: GitmStatusResult | null; // present after EITHER outcome (conflict needs it too)
}

const bucket: MergeBucketItem[] = [];

type GitmSelfDeck = {
  gitm: Concept<GitmState, Record<string, unknown>>;
};

export const gitmMerge = createQualityCardWithPayload<
  GitmState,
  GitmMergePayload,
  GitmSelfDeck
>({
  type: 'Gitm Merge',
  reducer: (state) => {
    const item = bucket.pop();
    if (!item) {
      return {};
    }
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
        lastActionResult: item.result,
      };
    }
    return { lastActionResult: item.result };
  },
  methodCreator: () =>
    createMethodWithConcepts(({ action, deck }) => {
      const payload = selectPayload<GitmMergePayload>(action);
      // FIELD-DRIFT REPAIR (093 · E3) — CANONICAL `source`, back-compat `branch`. The field
      // arrived UNDEFINED at the exec layer (`git merge undefined`-class) because the schema
      // advertised `branch` while callers reach for `source`; both are now honored.
      const branch = (payload.source ?? payload.branch ?? '').trim();
      // MULTI-SCP GITM MUXIFICATION (MC-W1) — CALLING SCP's repo (origin-aware) · SCP-Sovereign fallback.
      const userCwd = resolveGitmTargetCwd(deck, payload.originScpName);

      // MERGE-SOURCE GUARD — a missing/empty source NEVER reaches `git merge undefined`.
      if (branch === '') {
        const guard: GitmActionResult = {
          action: 'gitmMerge',
          ok: false,
          error: 'merge-source-required',
          guardFired: true,
          reason: 'merge-source-required',
          at: Date.now(),
        };
        bucket.push({ result: guard, refresh: null });
        return action.strategy
          ? strategySuccess(
              action.strategy,
              strategyData_muxifyData(action.strategy, { ...guard, branch: '' }),
            )
          : muxiumConclude();
      }

      // NO pre-confirm gate — the merge ALWAYS executes; the OUTCOME is the guard.
      // MD-E (part 2 · PROGRESS) — stamp the current-op latch (a merge over a large tree can exceed
      // 1s · the inline STARC re-read below is a between-op STARC that surfaces the still-set latch).
      setCurrentOp({ message: `Merging ${branch}…`, command: `git merge ${branch}` });
      const exec = gitmExec(['merge', branch], userCwd);
      clearCurrentOp();
      const result: GitmActionResult = {
        action: 'gitmMerge',
        ok: exec.ok,
        error: exec.ok ? '' : 'merge-conflict',
        guardFired: false,
        reason: exec.ok ? '' : 'merge-conflict-resolution-required',
        at: Date.now(),
      };

      // INLINE STARC RE-READ in BOTH branches — a conflict leaves the repo mid-
      // merge; conflicts[] MUST surface coherently in the same Method.
      const refresh = readGitStatus(userCwd);
      bucket.push({ result, refresh });
      return action.strategy
        ? strategySuccess(
            action.strategy,
            strategyData_muxifyData(action.strategy, { ...result, branch }),
          )
        : muxiumConclude();
    }),
});
