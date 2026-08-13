/**
 * suite8SetSyncModeHuirthBase Quality — U2 · THE USHER MODE (Huirth-side keyed Base Reducer)
 *
 * Writes one designation's Sync Library MODE ('local' anor 'target') into the suite8
 * Demometer's Huirth `syncModes` Record — the state the Usher Stage Planner's setStage mode
 * machine selector-gates on (the Synchronizing Principle Pattern · STRATIMUX-REFERENCE.md:778).
 * Dispatched by the Usher principle's SyncLibrary.json watcher (disk → Base action → state →
 * selector-gated stages — the Stratimuxian circuit; the file is the truth, the state is the
 * machine's gate).
 *
 * TQNI: 'Suite8 Set Sync Mode Huirth Base' — Huirth-only · local reducer · MUST be ABSENT
 * from suite8.muxonomy.ts actionExchange (the TQNI invariant).
 *
 * Citation: suite8SetDesignationMenuStageHuirthBase.quality.huirth.ts (the keyed Base sibling).
 * Citation: DIAMOND-SYNC-LIBRARY.md · THE USHER REFRAME (C729) · U2.
 */
import { createQualityCardWithPayload, defaultMethodCreator } from 'stratimux';
import type { Suite8HuirthState, Suite8SetSyncModeHuirthBasePayload } from '../suite8.type';

export type { Suite8SetSyncModeHuirthBasePayload };

export const suite8SetSyncModeHuirthBase = createQualityCardWithPayload<
  Suite8HuirthState,
  Suite8SetSyncModeHuirthBasePayload
>({
  type: 'Suite8 Set Sync Mode Huirth Base',
  reducer: (state, action) => {
    const { designation, mode } = action.payload;
    if (state.syncModes[designation] === mode) return {};
    // SHORTEST PATH — keyed merge: return only the changed Record.
    return { syncModes: { ...state.syncModes, [designation]: mode } };
  },
  methodCreator: defaultMethodCreator,
});
