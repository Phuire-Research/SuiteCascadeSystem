/**
 * scpSpawnManagerSpawnSucceeded · Phase B.4 · Cycle 132
 *
 * Reducer-only Quality. Dispatched by Q1 (SpawnRequested) Method via
 * strategyDetermine after a synchronous spawn() success. Commits the
 * ScpSpawnEntry to state.spawnsByScp, registers the port, updates
 * processMetadataByScp, and clears the pendingByScp boot-request entry.
 *
 * Partial-return discipline (R3 §2.6 + STRATIMUX-REFERENCE.md "Critical Reducer
 * Performance"): returns only the 4 changed fields. Does NOT spread ...state.
 *
 * New-Map discipline (B.2 Card 9): always allocates a fresh Map for
 * spawnsByScp so KeyedSelector consumers detect the reference change.
 *
 * Template: scpLifecycle/qualities/scpLifecycleDyingToGone.quality.ts (B.3)
 *
 * Citation: M62 · M63 · M60
 * Citation: SUITE-3-YELLOW-B4-SPAWNMGR-BLUEPRINT.md §2.6 · LOCK 1 (Q#2)
 * Citation: SUITE-4-GREEN-B4-SPAWNMGR-BIDIRECTIONAL.md §3 LOCK 1 + §6 V1 V2
 */

import { createQualityCardWithPayload, selectPayload } from 'stratimux';
import type { ScpSpawnManagerState } from '../scpSpawnManager.type';
import type {
  ScpSpawnManagerSpawnSucceededPayload,
  ScpSpawnManagerSpawnSucceeded,
} from './types';

export type { ScpSpawnManagerSpawnSucceeded };

export const scpSpawnManagerSpawnSucceeded = createQualityCardWithPayload<
  ScpSpawnManagerState,
  ScpSpawnManagerSpawnSucceededPayload
>({
  type: 'Scp Spawn Manager Spawn Succeeded',
  reducer: (state, action) => {
    const {
      scpName,
      port,
      pid,
      sessionId,
      startedAt,
      browserUrl,
    } = selectPayload<ScpSpawnManagerSpawnSucceededPayload>(action);

    // Commit live spawn entry (new-Map for KeyedSelector reference change · B.2 Card 9)
    const newSpawns = new Map(state.spawnsByScp);
    newSpawns.set(scpName, {
      scpName,
      port,
      browserUrl,
      pid,
      startedAt,
      sessionId,
      lastHeartbeatAt: 0,  // B.4 L.9 · 0 on initial spawn; Q5 updates on heartbeat
    });

    // Register port allocation
    const newAllocated = [...state.allocatedPorts, port];

    // Aux metadata
    const newMetadata: typeof state.processMetadataByScp = {
      ...state.processMetadataByScp,
      [scpName]: {
        scpName,
        pid,
        port,
        startedAt,
        lastHeartbeatAt: 0,
      },
    };

    // Boot-request lifecycle: pending entry consumed by spawn success
    const newPending = { ...state.pendingByScp };
    delete newPending[scpName];

    console.log(
      '[Scp Spawn Manager] SpawnSucceeded:',
      scpName,
      'pid=', pid,
      'port=', port,
      'browserUrl=', browserUrl,
      'startedAt=', startedAt,
    );

    return {
      spawnsByScp: newSpawns,
      allocatedPorts: newAllocated,
      processMetadataByScp: newMetadata,
      pendingByScp: newPending,
    };
  },
});
