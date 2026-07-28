/**
 * scpRegistryDirectoryWatcherDisarm · Phase B.1 · Cycle 129
 *
 * Method calls watcher.close() (fire-and-forget Promise · teardown best-effort);
 * Reducer nulls state.directoryWatcher with zero-churn idempotency (returns {}
 * if already null per SUITE-4-GREEN Angle 3 refinement).
 *
 * Citation: M60 · M62 · M63
 */

import {
  createQualityCardWithPayload,
  createMethodWithConcepts,
  muxiumConclude,
  strategySuccess,
  type Concept,
} from 'stratimux';
import type { ScpRegistryWatcherState } from '../scpRegistryWatcher.type';
import type {
  ScpRegistryDirectoryWatcherDisarmPayload,
  ScpRegistryDirectoryWatcherDisarm,
} from './types';

export type { ScpRegistryDirectoryWatcherDisarm };

type ScpRegistryWatcherSelfDeck = {
  scpRegistryWatcher: Concept<ScpRegistryWatcherState, Record<string, unknown>>;
};

export const scpRegistryDirectoryWatcherDisarm = createQualityCardWithPayload<
  ScpRegistryWatcherState,
  ScpRegistryDirectoryWatcherDisarmPayload,
  ScpRegistryWatcherSelfDeck
>({
  type: 'Scp Registry Directory Watcher Disarm',
  reducer: (state) => {
    if (state.directoryWatcher === null) {
      return {};
    }
    return { directoryWatcher: null };
  },
  methodCreator: () =>
    createMethodWithConcepts(({ action, deck }) => {
      const watcher = deck.scpRegistryWatcher.k.directoryWatcher.select();
      if (watcher !== null) {
        console.log('[Scp Registry] Disarming directoryWatcher');
        try {
          watcher.close();
        } catch (err) {
          console.error('[Scp Registry] disarm close error:', err);
        }
      }
      return action.strategy ? strategySuccess(action.strategy) : muxiumConclude();
    }),
});
