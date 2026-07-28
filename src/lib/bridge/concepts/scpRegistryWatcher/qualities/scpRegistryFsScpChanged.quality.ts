/**
 * scpRegistryFsScpChanged · Phase B.1 · Cycle 129
 *
 * Notification dispatched on chokidar 'change' event (file-level mutation at
 * observedPath top-level). Refreshes discoveredAt on matching entry; partial-
 * zero no-op if entry not yet in installedScps.
 *
 * Citation: M62 · M63
 * Citation: SUITE-3-YELLOW-B1-SCPREGWATCHER-BLUEPRINT.md §3.3
 */

import { createQualityCardWithPayload, selectPayload } from 'stratimux';
import type { ScpRegistryWatcherState } from '../scpRegistryWatcher.type';
import type {
  ScpRegistryFsScpChangedPayload,
  ScpRegistryFsScpChanged,
} from './types';

export type { ScpRegistryFsScpChanged };

export const scpRegistryFsScpChanged = createQualityCardWithPayload<
  ScpRegistryWatcherState,
  ScpRegistryFsScpChangedPayload
>({
  type: 'Scp Registry Fs Scp Changed',
  reducer: (state, action) => {
    const { scpPath } = selectPayload<ScpRegistryFsScpChangedPayload>(action);

    const idx = state.installedScps.findIndex(entry => entry.scpPath === scpPath);
    if (idx === -1) {
      return {};
    }

    const updated = [...state.installedScps];
    updated[idx] = { ...updated[idx], discoveredAt: Date.now() };

    return { installedScps: updated };
  },
});
