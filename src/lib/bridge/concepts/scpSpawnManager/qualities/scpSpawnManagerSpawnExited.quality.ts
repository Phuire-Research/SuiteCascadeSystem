/**
 * scpSpawnManagerSpawnExited · Phase B.4 · Cycle 132
 *
 * Reducer-only Quality. Dispatched from the ChildProcess 'exit' handler bound
 * inside Q1's Method via dispatchFromHandler (Pattern A · Card 23). Cleans up
 * state.spawnsByScp + allocatedPorts + processMetadataByScp + pendingByScp
 * for the exiting SCP.
 *
 * Permissive guard (R3 §1.6 LOCK 6 + B.3 DyingToGone Path A precedent):
 *   if !state.spawnsByScp.has(scpName) → no-op return {}
 *   permissive because the race window (Q3 enqueued before Q2 commits) is
 *   bounded by M62 + Node event-loop guarantee (synchronous Method → Q2
 *   enqueued → 'exit' tick → Q3 enqueued; Q2 always commits first).
 *
 * Defense-in-depth (LOCK 6): also clears pendingByScp entry if present.
 *
 * Partial-return discipline · new-Map allocation for spawnsByScp.
 *
 * Template: scpLifecycle/qualities/scpLifecycleDyingToGone.quality.ts (B.3)
 *
 * Citation: M62 · M63 · M60 · R3 §2.7 · LOCK 6
 * Citation: SUITE-4-GREEN-B4-SPAWNMGR-BIDIRECTIONAL.md §3 LOCK 6 CONFIRMED
 */

import { createQualityCardWithPayload, selectPayload } from 'stratimux';
import type { ScpSpawnManagerState } from '../scpSpawnManager.type';
import type {
  ScpSpawnManagerSpawnExitedPayload,
  ScpSpawnManagerSpawnExited,
} from './types';

export type { ScpSpawnManagerSpawnExited };

export const scpSpawnManagerSpawnExited = createQualityCardWithPayload<
  ScpSpawnManagerState,
  ScpSpawnManagerSpawnExitedPayload
>({
  type: 'Scp Spawn Manager Spawn Exited',
  reducer: (state, action) => {
    const { scpName, exitCode, exitSignal, exitedAt } =
      selectPayload<ScpSpawnManagerSpawnExitedPayload>(action);

    if (!state.spawnsByScp.has(scpName)) {
      console.log('[Scp Spawn Manager] SpawnExited no entry, skipping:', scpName);
      return {};
    }

    const exitedEntry = state.spawnsByScp.get(scpName)!;

    const newSpawns = new Map(state.spawnsByScp);
    newSpawns.delete(scpName);

    const newAllocated = state.allocatedPorts.filter((p) => p !== exitedEntry.port);

    const newMetadata = { ...state.processMetadataByScp };
    delete newMetadata[scpName];

    const newPending = { ...state.pendingByScp };
    delete newPending[scpName];  // defense-in-depth (LOCK 6)

    console.log(
      '[Scp Spawn Manager] SpawnExited:',
      scpName,
      'code=', exitCode,
      'signal=', exitSignal,
      'at=', exitedAt,
    );

    return {
      spawnsByScp: newSpawns,
      allocatedPorts: newAllocated,
      processMetadataByScp: newMetadata,
      pendingByScp: newPending,
    };
  },
});
