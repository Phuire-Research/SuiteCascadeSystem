/**
 * gitmStageAll Quality · GITM Dev Menu (#644) · T2 simple · git add -A
 *
 * Whole-tree stage (DEVBAR Stage All). Distinct from gitmStageAllAndCommit (the
 * A↔B composite that ALSO commits): this stages ONLY — no commit. Empty payload
 * (Record<string, never>) — the Method ignores it. Runs gitmExec(['add', '-A']);
 * lands a GitmActionResult. No guard. WATCHDIAL fires on .git/index → STARC
 * refresh follows. Reducer partial-return { lastActionResult }.
 *
 * Template: gitmStashPop.quality.ts (T2 no-payload simple-set discipline)
 * Citation: GITM-DEVMENU-S4-GREEN-INVENTORY.md §5 GAP 1 (gitmStageAll · git add -A)
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
import type { GitmStageAllPayload, GitmStageAll, GitmActionResult } from './types';
import { gitmExec } from '../model/gitmExec.model';
import { resolveGitmTargetCwd } from '../model/gitmOpCwd.model';

export type { GitmStageAll };

const bucket: GitmActionResult[] = [];

type GitmSelfDeck = {
  gitm: Concept<GitmState, Record<string, unknown>>;
};

export const gitmStageAll = createQualityCardWithPayload<
  GitmState,
  GitmStageAllPayload,
  GitmSelfDeck
>({
  type: 'Gitm Stage All',
  reducer: (state) => {
    const item = bucket.pop();
    if (!item) {
      return {};
    }
    return { lastActionResult: item };
  },
  methodCreator: () =>
    createMethodWithConcepts(({ action, deck }) => {
      const userCwd = resolveGitmTargetCwd(deck, selectPayload<GitmStageAllPayload>(action).originScpName); // MULTI-SCP GITM MUXIFICATION (MC-W1): CALLING SCP repo (origin-aware) · SCP-Sovereign fallback
      const exec = gitmExec(['add', '-A'], userCwd);
      const result: GitmActionResult = {
        action: 'gitmStageAll',
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
