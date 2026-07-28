/**
 * gitmScpUpdateProgress Quality · SCP-UPD · gitm_update_progress (the UI-tool)
 *
 * A stand-alone tool Lambda the spawned Gitm Resolver session fires to STAMP its live
 * position onto updateStatus so the Update view renders "<what the session is doing now>".
 * NO git, NO I/O — a pure state stamp (the simplest of the SCP-update qualities).
 *
 * PARTIAL STAMP (the shortest-path reducer): the payload's fields are ALL optional; the
 * reducer copies ONLY the provided fields onto updateStatus (stage / note / resolvedPending),
 * leaving every other field untouched (partial-return · KeyedSelector-safe · the existing
 * updateStatus witness re-fires on the change).
 *
 * Registered as the `gitm_update_progress` MCP tool (all-optional schema). The resolver
 * session calls it between steps to advance the visible rail; the CONCLUDING SEQUENCE
 * (note: 'resolution complete · pending 0') is the last stamp before the boot-test fires.
 *
 * Template: gitmScpUpdateApply.quality.ts (bucket + partial reducer + createMethodWithConcepts
 *   + muxiumConclude · simpler — no git leg).
 * Citation: gitmScpUpdateStageRelay.quality.ts (the updateStatus partial-stamp reducer pattern).
 */

import {
  createQualityCardWithPayload,
  createMethodWithConcepts,
  muxiumConclude,
  strategySuccess,
  selectPayload,
  type Concept,
} from 'stratimux';
import type { GitmState, UpdateStatusShape } from '../gitm.types';
import { UPDATE_APPLIED_NOTE } from '../gitm.types';
import { log } from '../../../debugLog';
import type { GitmScpUpdateProgressPayload, GitmScpUpdateProgress } from './types';

export type { GitmScpUpdateProgress };

type GitmSelfDeck = {
  gitm: Concept<GitmState, Record<string, unknown>>;
};

// The provided-fields bucket — only the keys the caller supplied land on updateStatus.
type ProgressBucketItem = {
  stage?: UpdateStatusShape['stage'];
  note?: string;
  resolvedPending?: number;
  diffPresent?: boolean;
};
const bucket: ProgressBucketItem[] = [];

export const gitmScpUpdateProgress = createQualityCardWithPayload<
  GitmState,
  GitmScpUpdateProgressPayload,
  GitmSelfDeck
>({
  type: 'Gitm Scp Update Progress',
  reducer: (state) => {
    const item = bucket.pop();
    if (!item) {
      return {};
    }
    // C293 · THE REGRESSION GUARD (the STAMP RACE fix): once the bridge's auto-apply has stamped
    // the terminal applied note, a LATE resolver stamp that would drag the rail back to 'resolving'
    // would strand the SCP (Apply Success never fires · buttons disabled). If the CURRENT note is
    // the applied terminal AND the incoming stamp would set stage 'resolving' — REFUSE it (never
    // silent-swallowed: log the refusal marker). FailureNode: the refusal is recorded, not dropped.
    if (state.updateStatus.note === UPDATE_APPLIED_NOTE && item.stage === 'resolving') {
      log('gitm.update.progress.regression-refused', {
        currentNote: state.updateStatus.note,
        refusedStage: item.stage,
        refusedNote: item.note ?? null,
      });
      return {};
    }
    // Partial stamp: copy ONLY the provided fields onto updateStatus (shortest path).
    const updateStatus: UpdateStatusShape = { ...state.updateStatus };
    if (item.stage !== undefined) updateStatus.stage = item.stage;
    if (item.note !== undefined) updateStatus.note = item.note;
    if (item.resolvedPending !== undefined) updateStatus.resolvedPending = item.resolvedPending;
    if (item.diffPresent !== undefined) updateStatus.diffPresent = item.diffPresent;
    return { updateStatus };
  },
  methodCreator: () =>
    createMethodWithConcepts(({ action }) => {
      const payload = selectPayload<GitmScpUpdateProgressPayload>(action);
      const item: ProgressBucketItem = {};
      // 'stage' is a constrained union — coerce only a valid stage string; else ignore.
      const stageRaw = payload?.stage;
      if (
        stageRaw === 'idle' || stageRaw === 'cloning' || stageRaw === 'diffing' ||
        stageRaw === 'reviewing' || stageRaw === 'resolving' || stageRaw === 'applying' ||
        stageRaw === 'error'
      ) {
        item.stage = stageRaw;
      }
      if (typeof payload?.note === 'string') item.note = payload.note;
      if (typeof payload?.resolvedPending === 'number') item.resolvedPending = payload.resolvedPending;
      if (typeof payload?.diffPresent === 'boolean') item.diffPresent = payload.diffPresent;
      bucket.push(item);
      // C291: honor action.strategy — as the C287 manifold BODY this quality carries the
      // scpExtractAndSendResponse successNode; an unconditional muxiumConclude() kills the
      // strategy and starves the stored HTTP response (the 085 root cause).
      return action.strategy ? strategySuccess(action.strategy) : muxiumConclude();
    }),
});
