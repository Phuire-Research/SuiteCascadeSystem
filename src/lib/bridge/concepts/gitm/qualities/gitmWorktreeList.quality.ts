/**
 * gitmWorktreeList Quality · THE SCP COMMAND MENU (W3 · THE WORKTREE RAIL) · git worktree list --porcelain
 *
 * A PURE READ — no guard, no WATCHKEY, no state mutation beyond the roster it lands (mirror
 * gitmStashList / gitmLoadConflict read discipline · D-SCM-W3 §3h "List is a pure read"). Runs
 * `git worktree list --porcelain` against the CALLING SCP's repo (origin-aware · resolveGitmTargetCwd)
 * and parses the porcelain groups into worktrees[] (the A tree first, then each `--wt-` instance) via
 * parseGitmWorktreeList. The helm reads worktrees[] to list per-instance rows for the DELETE (W4)
 * affordance. Reducer partial-return { worktrees } only (the Shortest-Path law).
 *
 * Template: gitmStashList.quality.ts (on-demand roster read · pure) · gitmLoadConflict.quality.ts
 *   (the read discipline · no guard).
 * Citation: D-SCM-W3-WORKTREE-GROUNDING.md §3h (List is a pure read · no WATCHDIAL) · parseGitmWorktreeList
 *   (gitmExec.model.ts · the porcelain parse seam).
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
import type { GitmState, GitmWorktreeRow } from '../gitm.types';
import type { GitmWorktreeListPayload, GitmWorktreeList, GitmActionResult } from './types';
import { gitmExec, parseGitmWorktreeList } from '../model/gitmExec.model';
import { resolveGitmTargetCwd } from '../model/gitmOpCwd.model';
import { log } from '../../../debugLog';

export type { GitmWorktreeList };

interface WorktreeListBucketItem {
  result: GitmActionResult;
  worktrees: GitmWorktreeRow[];
}

const bucket: WorktreeListBucketItem[] = [];

type GitmSelfDeck = {
  gitm: Concept<GitmState, Record<string, unknown>>;
};

export const gitmWorktreeList = createQualityCardWithPayload<
  GitmState,
  GitmWorktreeListPayload,
  GitmSelfDeck
>({
  type: 'Gitm Worktree List',
  reducer: (state) => {
    const item = bucket.pop();
    if (!item) {
      return {};
    }
    // THE SHORTEST-PATH PARTIAL RETURN — only the roster + the outcome surface change.
    return { worktrees: item.worktrees, lastActionResult: item.result };
  },
  methodCreator: () =>
    createMethodWithConcepts(({ action, deck }) => {
      const { originScpName } = selectPayload<GitmWorktreeListPayload>(action);
      // MULTI-SCP GITM MUXIFICATION (MC-W1) — CALLING SCP's repo (origin-aware) · SCP-Sovereign fallback.
      const opCwd = resolveGitmTargetCwd(deck, originScpName);
      const exec = gitmExec(['worktree', 'list', '--porcelain'], opCwd);
      const worktrees = exec.ok ? parseGitmWorktreeList(exec.stdout) : [];
      const result: GitmActionResult = {
        action: 'gitmWorktreeList',
        ok: exec.ok,
        error: exec.ok ? '' : exec.error || exec.stderr,
        guardFired: false,
        reason: '',
        at: Date.now(),
      };
      log('gitm.worktree.list', { opCwd, count: worktrees.length, ok: exec.ok });
      bucket.push({ result, worktrees });
      return action.strategy
        ? strategySuccess(action.strategy, strategyData_muxifyData(action.strategy, { ...result }))
        : muxiumConclude();
    }),
});
