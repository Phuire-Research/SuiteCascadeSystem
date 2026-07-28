/**
 * scsBridgeUnregisterScp · Cycle 139 · CPPP Wiring
 *
 * Migration source: scpDockHostUnregisterScp.quality.ts (Phase B.5 · Cycle 133)
 *
 * Reducer-only Quality. DUAL-PRUNE — removes the scpName entry from BOTH
 * connectedScps AND logBuffers AND openedBrowserTabs.
 *
 * Citation: SUITE-3-YELLOW-CYCLE-139-CPPP-WIRING-BLUEPRINT.md §5 Step 2
 */

import { createQualityCardWithPayload, selectPayload } from 'stratimux';
import type {
  ScsBridgeState,
  ScsBridgeUnregisterScpPayload,
  ScsBridgeUnregisterScp,
} from '../scsBridge.types';

export type { ScsBridgeUnregisterScp };

export const scsBridgeUnregisterScp = createQualityCardWithPayload<
  ScsBridgeState,
  ScsBridgeUnregisterScpPayload
>({
  type: 'Scs Bridge Unregister Scp',
  reducer: (state, action) => {
    const payload = selectPayload<ScsBridgeUnregisterScpPayload>(action);
    const { scpName, reason } = payload;

    if (!scpName) {
      return {};
    }

    if (!state.connectedScps[scpName]) {
      return {};
    }

    const { [scpName]: _removedScp, ...remainingScps } = state.connectedScps;
    const { [scpName]: _removedBuf, ...remainingBuffers } = state.logBuffers;
    const { [scpName]: _removedTab, ...remainingTabs } = state.openedBrowserTabs;

    console.log(
      '[Scs Bridge] UnregisterScp:',
      scpName,
      'reason=', reason,
    );

    return {
      connectedScps: remainingScps,
      logBuffers: remainingBuffers,
      openedBrowserTabs: remainingTabs,
    };
  },
});
