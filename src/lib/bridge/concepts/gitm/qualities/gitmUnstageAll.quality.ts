/**
 * gitmUnstageAll Quality · GITM Dev Menu (#644) · T2 simple · git restore --staged .
 *
 * Whole-index unstage (DEVBAR Unstage All). Distinct from gitmUnstageFile (one
 * path): this restores the ENTIRE staged set. Empty payload (Record<string,
 * never>) — the Method ignores it. Runs gitmExec(['restore', '--staged', '.']);
 * lands a GitmActionResult. No guard. WATCHDIAL fires on .git/index → STARC
 * refresh follows. Reducer partial-return { lastActionResult }.
 *
 * Template: gitmStashPop.quality.ts (T2 no-payload simple-set discipline)
 * Citation: GITM-DEVMENU-S4-GREEN-INVENTORY.md §5 GAP 2 (gitmUnstageAll · git restore --staged .)
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
import type { GitmUnstageAllPayload, GitmUnstageAll, GitmActionResult } from './types';
import { gitmExec } from '../model/gitmExec.model';
import { resolveGitmTargetCwd } from '../model/gitmOpCwd.model';

export type { GitmUnstageAll };

const bucket: GitmActionResult[] = [];

type GitmSelfDeck = {
  gitm: Concept<GitmState, Record<string, unknown>>;
};

export const gitmUnstageAll = createQualityCardWithPayload<
  GitmState,
  GitmUnstageAllPayload,
  GitmSelfDeck
>({
  type: 'Gitm Unstage All',
  reducer: (state) => {
    const item = bucket.pop();
    if (!item) {
      return {};
    }
    return { lastActionResult: item };
  },
  methodCreator: () =>
    createMethodWithConcepts(({ action, deck }) => {
      const userCwd = resolveGitmTargetCwd(deck, selectPayload<GitmUnstageAllPayload>(action).originScpName); // MULTI-SCP GITM MUXIFICATION (MC-W1): CALLING SCP repo (origin-aware) · SCP-Sovereign fallback
      const exec = gitmExec(['restore', '--staged', '.'], userCwd);
      const result: GitmActionResult = {
        action: 'gitmUnstageAll',
        ok: exec.ok,
        error: exec.ok ? '' : exec.error || exec.stderr,
        guardFired: false,
        reason: '',
        at: Date.now(),
      };
      bucket.push(result);
      return action.strategy
        ? strategySuccess(action.strategy, strategyData_muxifyData(action.strategy, { ...result }))
        : muxiumConclude();
    }),
});
