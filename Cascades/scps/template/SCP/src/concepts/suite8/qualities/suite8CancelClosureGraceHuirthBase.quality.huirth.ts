/**
 * suite8CancelClosureGraceHuirthBase Quality — B-RLM-1′ · THE GRACE STATE CLEAR
 *
 * Deletes one designation's standing closure grace from the suite8 Demometer's Huirth
 * `closureGraces` Record. Dispatched by:
 *   - the bridge-json dispatcher (the Usher principle) when a target returns LIVE anor specified
 *     goes null while a grace stands (reason 'target-live');
 *   - the revert ActionStrategy's SUCCESS node after the revert write (reason 'reverted');
 *   - the revert ActionStrategy's FAILURE node when the fired strategy no-ops
 *     (reason 'target-returned-anor-cleared').
 *
 * Cancellation is STATE (the Scholar's §2 ruling) — the muxiumTimeOut fuse cannot be cleared and
 * need not be; the fired strategy's check node (suite8GraceRevertCheck) re-reads this Record and
 * no-ops when the entry is gone. Absent entry → {} (idempotent — a double-cancel harms nothing).
 *
 * TQNI: 'Suite8 Cancel Closure Grace Huirth Base' — Huirth-only · MUST be ABSENT from
 * suite8.muxonomy.ts actionExchange (the TQNI invariant).
 *
 * Citation: suite8SetSyncModeHuirthBase.quality.huirth.ts (keyed Base reducer · SHORTEST PATH
 *           partial return · defaultMethodCreator).
 * Citation: suite8SyncLibrary.model.ts sinkSyncLibraryTelemetry (the file-sunk Lambda trail).
 * Citation: D-RLM-SCHOLAR-STATE-SIGNALS-MEANS.md §2.
 */
import {
  createQualityCardWithPayload,
  defaultMethodCreator,
} from 'stratimux';
import type {
  Suite8HuirthState,
  Suite8CancelClosureGraceHuirthBasePayload,
} from '../suite8.type';
import { sinkSyncLibraryTelemetry } from '../../../model/scpSyncLibrary.model';

export type { Suite8CancelClosureGraceHuirthBasePayload };

export const suite8CancelClosureGraceHuirthBase = createQualityCardWithPayload<
  Suite8HuirthState,
  Suite8CancelClosureGraceHuirthBasePayload
>({
  type: 'Suite8 Cancel Closure Grace Huirth Base',
  reducer: (state, action) => {
    const { designation, reason } = action.payload;
    if (state.closureGraces[designation] === undefined) return {}; // idempotent — already clear.
    // The sink rides the reducer-adjacent seat (the sibling qualities sink from methods; this
    // clear has no method work, so the telemetry lands here where the Lambda actually happens).
    sinkSyncLibraryTelemetry('usher.grace.cancelled', { designation, reason });
    // SHORTEST PATH — keyed delete: rebuild the Record without the cleared key, return only it.
    const { [designation]: _removed, ...rest } = state.closureGraces;
    return { closureGraces: rest };
  },
  methodCreator: defaultMethodCreator,
});
