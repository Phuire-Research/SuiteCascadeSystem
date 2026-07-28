/**
 * gitmStashPop Quality · GITM D3 (#634) · T2 simple · git stash pop
 *
 * Empty payload (Record<string, never>) — the Method ignores it. Runs
 * gitmExec(['stash', 'pop']); lands a GitmActionResult. No guard. WATCHDIAL fires
 * on .git/index → STARC refresh follows. Reducer partial-return { lastActionResult }.
 *
 * Template: gitmStageFile.quality.ts (D3 simple-set discipline) · gitmSetStatus (empty payload)
 * Citation: GITM-D3-S3-YELLOW-BLUEPRINT.md §4 (simple set · stashPop)
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
import type { GitmStashPopPayload, GitmStashPop, GitmActionResult } from './types';
import { gitmExec } from '../model/gitmExec.model';
import { resolveGitmTargetCwd } from '../model/gitmOpCwd.model';

export type { GitmStashPop };

const bucket: GitmActionResult[] = [];

type GitmSelfDeck = {
  gitm: Concept<GitmState, Record<string, unknown>>;
};

export const gitmStashPop = createQualityCardWithPayload<
  GitmState,
  GitmStashPopPayload,
  GitmSelfDeck
>({
  type: 'Gitm Stash Pop',
  reducer: (state) => {
    const item = bucket.pop();
    if (!item) {
      return {};
    }
    return { lastActionResult: item };
  },
  methodCreator: () =>
    createMethodWithConcepts(({ action, deck }) => {
      const userCwd = resolveGitmTargetCwd(deck, selectPayload<GitmStashPopPayload>(action).originScpName); // MULTI-SCP GITM MUXIFICATION (MC-W1): CALLING SCP repo (origin-aware) · SCP-Sovereign fallback
      const exec = gitmExec(['stash', 'pop'], userCwd);
      const result: GitmActionResult = {
        action: 'gitmStashPop',
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
