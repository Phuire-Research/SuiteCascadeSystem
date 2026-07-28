/**
 * gitmStageFile Quality · GITM D3 (#634) · T2 simple · git add <path>
 *
 * Method reads userCwd via the self-deck selector, runs gitmExec(['add', path]),
 * builds a GitmActionResult, pushes it to the bucket, and carries it into
 * strategy.data via strategyData_muxifyData (the MCP TAIL relays strategy.data).
 * Reducer pops the bucket → partial return { lastActionResult } only (shortest
 * path · partial-return law). No guard. WATCHDIAL fires on .git/index → STARC
 * refresh follows automatically (no explicit re-read).
 *
 * Template: gitmSetStatus.quality.ts (Method+Reducer+Bucket discipline)
 * Citation: GITM-D3-S3-YELLOW-BLUEPRINT.md §4 (simple set · stageFile)
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
import type { GitmStageFilePayload, GitmStageFile, GitmActionResult } from './types';
import { gitmExec } from '../model/gitmExec.model';
import { resolveGitmTargetCwd } from '../model/gitmOpCwd.model';

export type { GitmStageFile };

const bucket: GitmActionResult[] = [];

type GitmSelfDeck = {
  gitm: Concept<GitmState, Record<string, unknown>>;
};

export const gitmStageFile = createQualityCardWithPayload<
  GitmState,
  GitmStageFilePayload,
  GitmSelfDeck
>({
  type: 'Gitm Stage File',
  reducer: (state) => {
    const item = bucket.pop();
    if (!item) {
      return {};
    }
    return { lastActionResult: item };
  },
  methodCreator: () =>
    createMethodWithConcepts(({ action, deck }) => {
      const payload = selectPayload<GitmStageFilePayload>(action);
      const { path } = payload;
      // MULTI-SCP GITM MUXIFICATION (MC-W1) — route to the CALLING SCP's repo (origin-aware);
      // SCP-Sovereign fallback (activeScpDir || userCwd) when no origin identity is threaded.
      const userCwd = resolveGitmTargetCwd(deck, payload.originScpName);
      const exec = gitmExec(['add', path], userCwd);
      const result: GitmActionResult = {
        action: 'gitmStageFile',
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
