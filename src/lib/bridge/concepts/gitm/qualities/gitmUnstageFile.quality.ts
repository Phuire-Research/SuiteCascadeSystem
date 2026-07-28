/**
 * gitmUnstageFile Quality · GITM D3 (#634) · T2 simple · git restore --staged <path>
 *
 * Method runs gitmExec(['restore', '--staged', path]); lands a GitmActionResult
 * in lastActionResult. No guard. WATCHDIAL fires on .git/index → STARC refresh
 * follows. Reducer partial-return { lastActionResult } only.
 *
 * Template: gitmStageFile.quality.ts (D3 simple-set discipline)
 * Citation: GITM-D3-S3-YELLOW-BLUEPRINT.md §4 (simple set · unstageFile)
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
import type { GitmUnstageFilePayload, GitmUnstageFile, GitmActionResult } from './types';
import { gitmExec } from '../model/gitmExec.model';
import { resolveGitmTargetCwd } from '../model/gitmOpCwd.model';

export type { GitmUnstageFile };

const bucket: GitmActionResult[] = [];

type GitmSelfDeck = {
  gitm: Concept<GitmState, Record<string, unknown>>;
};

export const gitmUnstageFile = createQualityCardWithPayload<
  GitmState,
  GitmUnstageFilePayload,
  GitmSelfDeck
>({
  type: 'Gitm Unstage File',
  reducer: (state) => {
    const item = bucket.pop();
    if (!item) {
      return {};
    }
    return { lastActionResult: item };
  },
  methodCreator: () =>
    createMethodWithConcepts(({ action, deck }) => {
      const { path, originScpName } = selectPayload<GitmUnstageFilePayload>(action);
      // MULTI-SCP GITM MUXIFICATION (MC-W1) — CALLING SCP's repo (origin-aware) · SCP-Sovereign fallback.
      const userCwd = resolveGitmTargetCwd(deck, originScpName);
      const exec = gitmExec(['restore', '--staged', path], userCwd);
      const result: GitmActionResult = {
        action: 'gitmUnstageFile',
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
