/**
 * gitmLoadDiff Quality · GITM D3 (#634) · T2 read · git diff [--staged] [<path>]
 *
 * Read-only. Runs gitmExec(['diff', ...(staged?['--staged']:[]), ...(path?[path]:[])]);
 * lands { activeDiff, lastActionResult } in one partial return. activeDiff is the
 * raw unified-diff string (client renders it). No guard. No WATCHDIAL refresh
 * needed (read-only · touches no .git target).
 *
 * Template: gitmStageFile.quality.ts (D3 set discipline)
 * Citation: GITM-D3-S3-YELLOW-BLUEPRINT.md §4 (loadDiff · → activeDiff)
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
import type { GitmLoadDiffPayload, GitmLoadDiff, GitmActionResult } from './types';
import { gitmExec } from '../model/gitmExec.model';
import { resolveGitmTargetCwd } from '../model/gitmOpCwd.model';

export type { GitmLoadDiff };

interface LoadDiffBucketItem {
  result: GitmActionResult;
  activeDiff: string;
}

const bucket: LoadDiffBucketItem[] = [];

type GitmSelfDeck = {
  gitm: Concept<GitmState, Record<string, unknown>>;
};

export const gitmLoadDiff = createQualityCardWithPayload<
  GitmState,
  GitmLoadDiffPayload,
  GitmSelfDeck
>({
  type: 'Gitm Load Diff',
  reducer: (state) => {
    const item = bucket.pop();
    if (!item) {
      return {};
    }
    return { activeDiff: item.activeDiff, lastActionResult: item.result };
  },
  methodCreator: () =>
    createMethodWithConcepts(({ action, deck }) => {
      const { path, staged, originScpName } = selectPayload<GitmLoadDiffPayload>(action);
      // MULTI-SCP GITM MUXIFICATION (MC-W1) — CALLING SCP's repo (origin-aware) · SCP-Sovereign fallback.
      const userCwd = resolveGitmTargetCwd(deck, originScpName);
      const args = ['diff', ...(staged === true ? ['--staged'] : []), ...(path ? [path] : [])];
      const exec = gitmExec(args, userCwd);
      const activeDiff = exec.ok ? exec.stdout : '';
      const result: GitmActionResult = {
        action: 'gitmLoadDiff',
        ok: exec.ok,
        error: exec.ok ? '' : exec.error || exec.stderr,
        guardFired: false,
        reason: '',
        at: Date.now(),
      };
      bucket.push({ result, activeDiff });
      return action.strategy
        ? strategySuccess(
            action.strategy,
            strategyData_muxifyData(action.strategy, { ...result, activeDiff }),
          )
        : muxiumConclude();
    }),
});
