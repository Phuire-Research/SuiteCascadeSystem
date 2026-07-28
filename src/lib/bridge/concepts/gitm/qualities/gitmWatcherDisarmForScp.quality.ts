/**
 * gitmWatcherDisarmForScp Quality · MULTI-SCP GITM MUXIFICATION (Fork B · MC-W2 · THE WATCHER PLURALITY)
 *
 * Tears down the PER-SCP watcher pair (registry.disarmWatchersForScp) AND deletes that SCP's slice
 * (gitmSliceStore.deleteSlice) — a dead SCP's rail retires (its gitm.json stops being fanned out in
 * MC-W3). Dispatched on spawn EXIT/ERROR cleanup (MC-W2 step 8).
 *
 * Reducer returns {} — the pair + slice live module-scope (the FSWatcher precedent); the flat GitmState
 * is untouched (the ACTIVE SCP's own watchers/state are the flat view · the materialized-view law).
 *
 * Template: gitmScpWatcherArm.quality.ts (Method+Reducer · teardown path · partial return).
 * Citation: MC-W2 (THE WATCHER PLURALITY · brief step 7 + step 8 slice-delete-on-disarm).
 */

import {
  createQualityCardWithPayload,
  createMethodWithConcepts,
  selectPayload,
  muxiumConclude,
  strategySuccess,
  type Concept,
} from 'stratimux';
import { isAbsolute, resolve } from 'node:path';
import { log } from '../../../debugLog';
import { disarmWatchersForScp } from '../model/gitmWatcherRegistry.model';
import { deleteSlice } from '../model/gitmSliceStore.model';
import type { GitmState } from '../gitm.types';
import type { GitmWatcherForScpPayload, GitmWatcherDisarmForScp } from './types';

export type { GitmWatcherDisarmForScp };

type GitmSelfDeck = {
  gitm: Concept<GitmState, Record<string, unknown>>;
};

export const gitmWatcherDisarmForScp = createQualityCardWithPayload<
  GitmState,
  GitmWatcherForScpPayload,
  GitmSelfDeck
>({
  type: 'Gitm Watcher Disarm For Scp',
  // No flat-state mutation — the pair + slice are module-scope. Partial-return law: return {}.
  reducer: () => ({}),
  methodCreator: () =>
    createMethodWithConcepts(({ action, deck }) => {
      const { scpDir: rawScpDir } = selectPayload<GitmWatcherForScpPayload>(action);
      if (rawScpDir === '') {
        return action.strategy ? strategySuccess(action.strategy) : muxiumConclude();
      }
      // SLICE/WATCHER KEY LAW — canonicalize to ABSOLUTE (matches the arm/GITEP key · MC-W2 step 8).
      const userCwd = deck.gitm.k.userCwd.select();
      const scpDir = isAbsolute(rawScpDir) ? rawScpDir : resolve(userCwd, rawScpDir);
      const disarmed = disarmWatchersForScp(scpDir);
      const sliceDeleted = deleteSlice(scpDir);
      log('gitm.registry.disarm.dispatched', { scpDir, disarmed, sliceDeleted });
      return action.strategy ? strategySuccess(action.strategy) : muxiumConclude();
    }),
});
