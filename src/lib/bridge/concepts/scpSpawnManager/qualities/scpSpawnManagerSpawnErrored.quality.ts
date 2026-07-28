/**
 * scpSpawnManagerSpawnErrored · Phase B.4 · Cycle 132
 *
 * Reducer-only Quality. Dispatched from the ChildProcess 'error' handler bound
 * inside Q1's Method via dispatchFromHandler (Pattern A · Card 23). 'error'
 * may fire before 'spawn' on ENOENT — guard checks BOTH spawnsByScp AND
 * pendingByScp to clean up either state-side artifact.
 *
 * Permissive double-guard (R3 §2.8 + LOCK 6):
 *   if !hasSpawnEntry && !hasPendingEntry → no-op
 *   else → delete from spawnsByScp AND pendingByScp; filter allocatedPorts
 *   only if exitedEntry existed (port unknown for spawn-failed processes).
 *
 * errorCode optional: ENOENT surfaces it but generic Error objects may not.
 * Used for logging only; no Reducer logic depends on it.
 *
 * Partial-return discipline · new-Map allocation.
 *
 * Template: scpSpawnManagerSpawnExited.quality.ts (B.4 L.6 sibling)
 *
 * Citation: M62 · M63 · M60 · R3 §2.8 · LOCK 6
 * Citation: SUITE-4-GREEN-B4-SPAWNMGR-BIDIRECTIONAL.md §3 LOCK 6
 */

import { createQualityCardWithPayload, selectPayload } from 'stratimux';
import type { ScpSpawnManagerState } from '../scpSpawnManager.type';
import type {
  ScpSpawnManagerSpawnErroredPayload,
  ScpSpawnManagerSpawnErrored,
} from './types';

export type { ScpSpawnManagerSpawnErrored };

export const scpSpawnManagerSpawnErrored = createQualityCardWithPayload<
  ScpSpawnManagerState,
  ScpSpawnManagerSpawnErroredPayload
>({
  type: 'Scp Spawn Manager Spawn Errored',
  reducer: (state, action) => {
    const { scpName, errorMessage, errorCode, erroredAt } =
      selectPayload<ScpSpawnManagerSpawnErroredPayload>(action);

    const hasSpawnEntry = state.spawnsByScp.has(scpName);
    const hasPendingEntry = scpName in state.pendingByScp;

    if (!hasSpawnEntry && !hasPendingEntry) {
      console.log('[Scp Spawn Manager] SpawnErrored no entry at all, skipping:', scpName);
      return {};
    }

    const newSpawns = new Map(state.spawnsByScp);
    const exitedEntry = newSpawns.get(scpName);
    newSpawns.delete(scpName);

    const newAllocated = exitedEntry
      ? state.allocatedPorts.filter((p) => p !== exitedEntry.port)
      : [...state.allocatedPorts];

    const newMetadata = { ...state.processMetadataByScp };
    delete newMetadata[scpName];

    const newPending = { ...state.pendingByScp };
    delete newPending[scpName];

    console.error(
      '[Scp Spawn Manager] SpawnErrored:',
      scpName,
      'errorCode=', errorCode,
      'msg=', errorMessage,
      'at=', erroredAt,
    );

    return {
      spawnsByScp: newSpawns,
      allocatedPorts: newAllocated,
      processMetadataByScp: newMetadata,
      pendingByScp: newPending,
    };
  },
});
