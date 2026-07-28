/**
 * gitmMergeAbort Quality · GITM D4 (#635) · T3 RECOVERY · git merge --abort
 *
 * The conflict-recovery op (EXAM Q3): NO WATCHKEY confirm gate (it is the SAFE
 * recovery, not a destructive op). It DOES carry a state guard — abort is only
 * meaningful mid-merge, so the Method reads k.conflicts BEFORE exec:
 *   - conflicts.length === 0 → guardFired { reason: 'no-merge-in-progress' };
 *                              git is NEVER invoked (nothing to abort).
 *   - conflicts.length  >  0 → run `git merge --abort`; the inline STARC re-read
 *                              clears conflicts[] (the REACTIVE-WARDEN merge-
 *                              conflict warning also clears via the WATCHDIAL →
 *                              gitmSetStatus rebuild cycle).
 *
 * EXPLICIT STARC RE-READ (inline · the D3 canon · abort resets HEAD/index/worktree).
 *
 * Template: gitmPush.quality.ts (pre-exec state guard + inline re-read) · gitmDiscard
 * Citation: GITM-D4-S4-GREEN-EXAM.md Q3 (gitmMergeAbort · conflicts guard)
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
import type { GitmMergeAbortPayload, GitmMergeAbort, GitmActionResult } from './types';
import { gitmExec } from '../model/gitmExec.model';
import { resolveGitmTargetCwd } from '../model/gitmOpCwd.model';
import { readGitStatus, type GitmStatusResult } from '../model/gitmStatus.model';

export type { GitmMergeAbort };

interface MergeAbortBucketItem {
  result: GitmActionResult;
  refresh: GitmStatusResult | null; // present only after a successful abort
}

const bucket: MergeAbortBucketItem[] = [];

type GitmSelfDeck = {
  gitm: Concept<GitmState, Record<string, unknown>>;
};

export const gitmMergeAbort = createQualityCardWithPayload<
  GitmState,
  GitmMergeAbortPayload,
  GitmSelfDeck
>({
  type: 'Gitm Merge Abort',
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
      // ── CONFLICTS GUARD (pre-exec · git never invoked when nothing to abort)
      const conflicts = deck.gitm.k.conflicts.select();
      if (conflicts.length === 0) {
        const guard: GitmActionResult = {
          action: 'gitmMergeAbort',
          ok: false,
          error: '',
          guardFired: true,
          reason: 'no-merge-in-progress',
          at: Date.now(),
        };
        bucket.push({ result: guard, refresh: null });
        return action.strategy
          ? strategySuccess(action.strategy, strategyData_muxifyData(action.strategy, { ...guard }))
          : muxiumConclude();
      }

      const userCwd = resolveGitmTargetCwd(deck, selectPayload<GitmMergeAbortPayload>(action).originScpName); // MULTI-SCP GITM MUXIFICATION (MC-W1): CALLING SCP repo (origin-aware) · SCP-Sovereign fallback
      const exec = gitmExec(['merge', '--abort'], userCwd);
      const result: GitmActionResult = {
        action: 'gitmMergeAbort',
        ok: exec.ok,
        error: exec.ok ? '' : exec.error || exec.stderr,
        guardFired: false,
        reason: '',
        at: Date.now(),
      };
      // EXPLICIT STARC RE-READ (inline · abort clears conflicts[])
      const refresh = exec.ok ? readGitStatus(userCwd) : null;
      bucket.push({ result, refresh });
      return action.strategy
        ? strategySuccess(action.strategy, strategyData_muxifyData(action.strategy, { ...result }))
        : muxiumConclude();
    }),
});
