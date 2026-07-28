/**
 * scsBridgeRegisterScp · Cycle 139 · CPPP Wiring
 *
 * Migration source: scpDockHostRegisterScp.quality.ts (Phase B.5 · Cycle 133)
 *
 * Reducer-only Quality. NDIP (Non-Destructive Idempotency Pattern) — re-registration
 * preserves original `dockedAt` and updates `lastDockedAt`.
 *
 * Citation: SUITE-3-YELLOW-CYCLE-139-CPPP-WIRING-BLUEPRINT.md §5 Step 2
 */

import { createQualityCardWithPayload, selectPayload } from 'stratimux';
import type {
  ScsBridgeState,
  ConnectedScpEntry,
  ScsBridgeRegisterScpPayload,
  ScsBridgeRegisterScp,
} from '../scsBridge.types';
import { log } from '../../../debugLog';

export type { ScsBridgeRegisterScp };

export const scsBridgeRegisterScp = createQualityCardWithPayload<
  ScsBridgeState,
  ScsBridgeRegisterScpPayload
>({
  type: 'Scs Bridge Register Scp',
  reducer: (state, action) => {
    const payload = selectPayload<ScsBridgeRegisterScpPayload>(action) as
      Partial<ScsBridgeRegisterScpPayload>;
    const { scpName, scpPort, logEndpoint } = payload;

    if (!scpName) {
      return {};
    }

    // MCP tool `dock_scp` inputSchema supplies {scpName, scpPort, logEndpoint}.
    // dockedAt + status are synthesized here with well-known defaults so the
    // ScsBridgeRegisterScpPayload contract is satisfied without manifold-layer
    // adaptation. Citation: SUITE-3-YELLOW-CYCLE-140-MSCM-TQDR-BLUEPRINT.md §2.2
    const dockedAt = typeof payload.dockedAt === 'number' ? payload.dockedAt : Date.now();
    const status: 'active' = payload.status ?? 'active';

    const existing = state.connectedScps[scpName];

    const entry: ConnectedScpEntry = {
      scpName,
      scpPort: scpPort ?? 0,
      logEndpoint: logEndpoint ?? '',
      dockedAt: existing ? existing.dockedAt : dockedAt,
      lastDockedAt: dockedAt,
      status,
    };

    console.log(
      '[Scs Bridge] RegisterScp:',
      scpName,
      existing ? '(re-dock)' : '(initial)',
      'port=', scpPort,
    );
    log('scsbridge.scp.registered', { scpName, scpPort, isReDock: !!existing });

    return {
      connectedScps: { ...state.connectedScps, [scpName]: entry },
    };
  },
});
