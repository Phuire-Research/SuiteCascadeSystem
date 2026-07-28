/**
 * scpSpawnManager Type Definitions · Phase A · Cycle 127 Copy-Paste-Plus
 *                                  · Phase B.4 · Cycle 132 (lastHeartbeatAt addition)
 *
 * Template: ADMIN_ICP/src/concepts/icp/qualities/icpStoreHttpResponse.quality.huirth.ts
 *           (non-serializable Map in state pattern · filterKeys exclusion at Phase B)
 *           + ADMIN_ICP/src/concepts/claudeBridge/principles/claudeBridgeWebSocket.principle.huirth.ts
 *           (module-level Map pattern · MMUI doctrine)
 *
 * SCP-specific: ChildProcess Map held module-level (NOT in state · MMUI) ·
 * state holds serializable metadata only.
 *
 * CRITICAL CONSUMER CONTRACTS:
 *   - src/lib/tui/animatedTui.ts:60 imports ScpSpawnEntry
 *   - src/lib/tui/animatedTui.ts:225 uses `Map<string, { port: number; browserUrl: string }>` for refreshSpawns derivation
 *   - src/lib/tui/animatedTui.ts:358 uses `spawnsByScp: Map<string, ScpSpawnEntry>` via DECK K
 *   - src/lib/tui/animatedTui.ts:361-363 uses `interactiveSessionsByScp: Map<string, Map<string, number>>` via DECK K
 *   - src/lib/bridge/menu.ts:14-16 imports filterRecentHeartbeats + INTERACTIVE_STALENESS_THRESHOLD_MS from helpers
 *
 * Phase A scope: state shape + factory · helpers in scpSpawnManager.helpers.ts.
 * Phase B.4 atomic delta (R5 L.9):
 *   - ADD `lastHeartbeatAt: number` to ScpSpawnEntry (Q2 Reducer sets to 0; Q5 Reducer updates)
 *   - REMOVE stale `ScpSpawnManagerQualities = Record<string, never>` alias (now lives in concept.ts)
 *   - REMOVE stale `ScpSpawnManagerConcept` export (now lives in concept.ts)
 *   atomic per R4 F3 + F7 (avoid dual-export window during Quality file writes)
 *
 * Citation: M60 State-or-Payload Anor · MMUI Pearl term · M63 Copy-Paste-Plus
 * Citation: SUITE-3-YELLOW-B4-SPAWNMGR-BLUEPRINT.md §2.1 · LOCK 6 (lastHeartbeatAt)
 * Citation: SUITE-4-GREEN-B4-SPAWNMGR-BIDIRECTIONAL.md §4 F2 + F3 + F7 (atomic edit)
 * Citation: SUITE-5-BLUE-B4-SPAWNMGR-ACTUALIZATION.md L.9
 */

export const scpSpawnManagerName = 'scpSpawnManager';

/**
 * ScpSpawnEntry · per-SCP spawn metadata · serializable.
 * Consumer signature at animatedTui.ts:498 reads `.port` and `.browserUrl`.
 * Phase B.4 Q2 Reducer populates this Map keyed by scpName on spawn success;
 * Q3/Q4 delete on exit/error; Q5 updates lastHeartbeatAt on heartbeat.
 */
export type ScpSpawnEntry = {
  scpName: string;
  port: number;
  browserUrl: string;
  pid: number;
  startedAt: number;
  sessionId: string;
  lastHeartbeatAt: number;  // B.4 · 0 on initial spawn; updated by Q5 Reducer
};

export type ProcessMetadata = {
  scpName: string;
  pid: number;
  port?: number;
  startedAt: number;
  lastHeartbeatAt: number;
};

export type PendingByScpEntry = {
  scpName: string;
  bootRequestUlid: string;
  startedAt: number;
};

export type ScpSpawnManagerState = {
  userCwd: string;
  // animatedTui.ts:358 consumer · Map<scpName, ScpSpawnEntry>
  spawnsByScp: Map<string, ScpSpawnEntry>;
  // animatedTui.ts:361-363 consumer · Map<scpName, Map<sessionId, lastReceivedAt>>
  interactiveSessionsByScp: Map<string, Map<string, number>>;
  // Aux metadata · Phase B.4 Q2-Q5 populate
  processMetadataByScp: Record<string, ProcessMetadata>;
  pendingByScp: Record<string, PendingByScpEntry>;
  allocatedPorts: number[];
};

export const createScpSpawnManagerState = (userCwd: string): ScpSpawnManagerState => ({
  userCwd,
  spawnsByScp: new Map<string, ScpSpawnEntry>(),
  interactiveSessionsByScp: new Map<string, Map<string, number>>(),
  processMetadataByScp: {},
  pendingByScp: {},
  allocatedPorts: [],
});

// NOTE: ScpSpawnManagerQualities + ScpSpawnManagerConcept moved to scpSpawnManager.concept.ts
// per B.4 L.9 atomic cleanup (R4 F3 + F7). The barrel index.ts re-exports both from concept.ts.
