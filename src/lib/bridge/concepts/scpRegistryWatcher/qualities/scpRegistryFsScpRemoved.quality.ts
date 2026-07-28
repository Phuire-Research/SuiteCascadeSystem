/**
 * scpRegistryFsScpRemoved · Phase B.1 · Cycle 129
 *
 * Notification dispatched on chokidar 'unlinkDir' handler. Filters matching
 * entry from installedScps. Partial-zero no-op if not present (Shortest Path
 * Principle).
 *
 * Citation: M62 · M63
 * Citation: SUITE-3-YELLOW-B1-SCPREGWATCHER-BLUEPRINT.md §3.4
 */

import { createQualityCardWithPayload, selectPayload } from 'stratimux';
import type { ScpRegistryWatcherState } from '../scpRegistryWatcher.type';
import type {
  ScpRegistryFsScpRemovedPayload,
  ScpRegistryFsScpRemoved,
} from './types';

export type { ScpRegistryFsScpRemoved };

export const scpRegistryFsScpRemoved = createQualityCardWithPayload<
  ScpRegistryWatcherState,
  ScpRegistryFsScpRemovedPayload
>({
  type: 'Scp Registry Fs Scp Removed',
  reducer: (state, action) => {
    const { scpPath } = selectPayload<ScpRegistryFsScpRemovedPayload>(action);

    const filtered = state.installedScps.filter(entry => entry.scpPath !== scpPath);
    if (filtered.length === state.installedScps.length) {
      return {};
    }

    console.log('[Scp Registry] SCP removed:', scpPath);

    return { installedScps: filtered };
  },
});
