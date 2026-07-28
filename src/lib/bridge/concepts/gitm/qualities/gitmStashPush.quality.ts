/**
 * gitmStashPush Quality · GITM D3 (#634) · T2 simple · git stash push -m <message>
 *
 * Method runs gitmExec(['stash', 'push', '-m', message]); lands a GitmActionResult.
 * No guard. WATCHDIAL fires on .git/index → STARC refresh follows. Reducer
 * partial-return { lastActionResult } only.
 *
 * Template: gitmStageFile.quality.ts (D3 simple-set discipline)
 * Citation: GITM-D3-S3-YELLOW-BLUEPRINT.md §4 (simple set · stashPush)
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
import type { GitmStashPushPayload, GitmStashPush, GitmActionResult } from './types';
import { gitmExec } from '../model/gitmExec.model';
import { resolveGitmTargetCwd } from '../model/gitmOpCwd.model';

export type { GitmStashPush };

const bucket: GitmActionResult[] = [];

type GitmSelfDeck = {
  gitm: Concept<GitmState, Record<string, unknown>>;
};

export const gitmStashPush = createQualityCardWithPayload<
  GitmState,
  GitmStashPushPayload,
  GitmSelfDeck
>({
  type: 'Gitm Stash Push',
  reducer: (state) => {
    const item = bucket.pop();
    if (!item) {
      return {};
    }
    return { lastActionResult: item };
  },
  methodCreator: () =>
    createMethodWithConcepts(({ action, deck }) => {
      const { message, originScpName } = selectPayload<GitmStashPushPayload>(action);
      // MULTI-SCP GITM MUXIFICATION (MC-W1) — CALLING SCP's repo (origin-aware) · SCP-Sovereign fallback.
      const userCwd = resolveGitmTargetCwd(deck, originScpName);
      // GITM Dev Epoch (MD-B · THE LABELED STASH) — a non-empty label → `-m <label>`; an empty/absent
      // label → a plain `git stash push` (the SubPage fires {} when the label input is blank).
      const label = typeof message === 'string' ? message.trim() : '';
      const args = label === '' ? ['stash', 'push'] : ['stash', 'push', '-m', label];
      const exec = gitmExec(args, userCwd);
      const result: GitmActionResult = {
        action: 'gitmStashPush',
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
