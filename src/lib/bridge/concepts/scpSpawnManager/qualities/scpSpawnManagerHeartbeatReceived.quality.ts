/**
 * scpSpawnManagerHeartbeatReceived · Phase B.4 · Cycle 132
 *
 * Reducer-only Quality. Dispatched by scpMessageRouter.principle.ts Stage 2
 * 'add' handler (LOCK 4 option β · COEXIST) as a SECOND nextA after the
 * existing BmrEnvelopeReceived dispatch when envelope.kind === 'heartbeat'.
 *
 * Refreshes lastHeartbeatAt on the ScpSpawnEntry; mirrors to processMetadataByScp
 * if a metadata entry exists. The FSM transition (SpawningToActive) is NOT
 * dispatched from here — that remains owned by scpLifecycle via the router
 * path (LOCK 4 rationale).
 *
 * Permissive guard (R3 §2.9): if no spawn entry, return {} no-op. Heartbeats
 * arriving before Q2 commits (during the brief Method→Q2-Reducer queue window)
 * are silently dropped. Subsequent heartbeats after Q2 commits update normally.
 *
 * New-Map allocation (B.2 Card 9): KeyedSelector for spawnsByScp detects the
 * reference change. Without new-Map, .set() on the existing Map would not
 * trigger selector fire.
 *
 * Template: scpSpawnManagerSpawnSucceeded.quality.ts (B.4 L.5 sibling)
 *
 * Citation: M62 · M63 · M60 · R3 §2.9 · LOCK 4 option β
 * Citation: SUITE-4-GREEN-B4-SPAWNMGR-BIDIRECTIONAL.md §3 LOCK 4 CONFIRMED
 */

import { createQualityCardWithPayload, selectPayload } from 'stratimux';
import type { ScpSpawnManagerState } from '../scpSpawnManager.type';
import type {
  ScpSpawnManagerHeartbeatReceivedPayload,
  ScpSpawnManagerHeartbeatReceived,
} from './types';

export type { ScpSpawnManagerHeartbeatReceived };

export const scpSpawnManagerHeartbeatReceived = createQualityCardWithPayload<
  ScpSpawnManagerState,
  ScpSpawnManagerHeartbeatReceivedPayload
>({
  type: 'Scp Spawn Manager Heartbeat Received',
  reducer: (state, action) => {
    const { scpName, heartbeatUlid, receivedAt } =
      selectPayload<ScpSpawnManagerHeartbeatReceivedPayload>(action);

    const entry = state.spawnsByScp.get(scpName);
    if (!entry) {
      // Permissive: heartbeat may arrive before Q2 commits the spawn entry
      console.log('[Scp Spawn Manager] HeartbeatReceived no entry, skipping:', scpName, heartbeatUlid);
      return {};
    }

    // New-Map for KeyedSelector reference change (B.2 Card 9)
    const newSpawns = new Map(state.spawnsByScp);
    newSpawns.set(scpName, { ...entry, lastHeartbeatAt: receivedAt });

    // Mirror to processMetadataByScp if entry exists
    const existingMeta = state.processMetadataByScp[scpName];
    if (existingMeta) {
      const newMetadata: typeof state.processMetadataByScp = {
        ...state.processMetadataByScp,
        [scpName]: { ...existingMeta, lastHeartbeatAt: receivedAt },
      };
      return {
        spawnsByScp: newSpawns,
        processMetadataByScp: newMetadata,
      };
    }

    return {
      spawnsByScp: newSpawns,
    };
  },
});
