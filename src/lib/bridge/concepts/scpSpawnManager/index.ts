/**
 * scpSpawnManager Barrel · Phase B.4 · Cycle 132
 *
 * Re-exports: concept (factory + ScpSpawnManagerQualities + ScpSpawnManagerConcept +
 * ScpSpawnManagerDeck), type (state + ScpSpawnEntry + ProcessMetadata + PendingByScpEntry +
 * name const), helpers (filterRecentHeartbeats + INTERACTIVE_STALENESS_THRESHOLD_MS),
 * payload types from qualities/types.ts, and per-Quality type aliases.
 *
 * Excluded (internal MMUI / validation):
 *   - qualities/childProcessRegistry (module-level Map · internal)
 *   - qualities/scpNameValidation (internal validation only)
 *
 * Citation: SUITE-3-YELLOW-B4-SPAWNMGR-BLUEPRINT.md §2.12 · L.12
 * Citation: SUITE-4-GREEN-B4-SPAWNMGR-BIDIRECTIONAL.md §4 F7 (atomic dual-export resolution)
 */
export * from './scpSpawnManager.concept';
export * from './scpSpawnManager.type';
export * from './scpSpawnManager.helpers';
export * from './qualities/types';
export type { ScpSpawnManagerSpawnRequested } from './qualities/scpSpawnManagerSpawnRequested.quality';
export type { ScpSpawnManagerSpawnSucceeded } from './qualities/scpSpawnManagerSpawnSucceeded.quality';
export type { ScpSpawnManagerSpawnExited } from './qualities/scpSpawnManagerSpawnExited.quality';
export type { ScpSpawnManagerSpawnErrored } from './qualities/scpSpawnManagerSpawnErrored.quality';
export type { ScpSpawnManagerHeartbeatReceived } from './qualities/scpSpawnManagerHeartbeatReceived.quality';
export type { ScpSpawnManagerKillRequested } from './qualities/scpSpawnManagerKillRequested.quality';
