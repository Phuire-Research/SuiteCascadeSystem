/**
 * scsBridgePublishLogs · Cycle 139 · CPPP Wiring
 *
 * Migration source: scpDockHostPublishLogs.quality.ts (Phase B.5 · Cycle 133)
 *
 * Reducer-only Quality. LBPP (Log-Buffer Per-Pile) — appends a log entry to
 * the per-scpName buffer in state.logBuffers. Orphan logs discarded.
 *
 * Citation: SUITE-3-YELLOW-CYCLE-139-CPPP-WIRING-BLUEPRINT.md §5 Step 2
 */

import { createQualityCardWithPayload, selectPayload } from 'stratimux';
import type {
  ScsBridgeState,
  ScpDockHostLogEntry,
  ScsBridgePublishLogsPayload,
  ScsBridgePublishLogs,
} from '../scsBridge.types';

export type { ScsBridgePublishLogs };

export const scsBridgePublishLogs = createQualityCardWithPayload<
  ScsBridgeState,
  ScsBridgePublishLogsPayload
>({
  type: 'Scs Bridge Publish Logs',
  reducer: (state, action) => {
    const payload = selectPayload<ScsBridgePublishLogsPayload>(action);
    const { scpName, logEntry, timestamp } = payload;

    if (!scpName) {
      return {};
    }

    if (!state.connectedScps[scpName]) {
      return {};
    }

    const existingBuffer = state.logBuffers[scpName] ?? [];
    const newEntry: ScpDockHostLogEntry = { logEntry, timestamp };

    return {
      logBuffers: {
        ...state.logBuffers,
        [scpName]: [...existingBuffer, newEntry],
      },
    };
  },
});
