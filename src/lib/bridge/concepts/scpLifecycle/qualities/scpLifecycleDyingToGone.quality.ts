/**
 * scpLifecycleDyingToGone · Phase B.3 · Cycle 131
 *
 * Reducer-only Quality. FSM transition: any non-undefined fsm → ENTRY REMOVED (gone).
 * Note: 4-state surface entry IS removed from lifecycleByScp Map.
 *
 * Dispatched from scpSpawnManager.ChildExit.Method (B.4 forward) OR
 * grace-period timeout in spawnManager (also B.4).
 *
 * Guard (R4 §5.2 AMENDMENT — Path A · permissive):
 *   - if fsm === undefined → no entry, no-op (return {})
 *   - else → DELETE entry from all 3 Maps
 *
 * Permissive rationale: ChildProcess can die from any state (boot OOM,
 * admin force-kill mid-spawn, grace-expiry, normal teardown). Death is
 * terminal; entry-removal is correct from any non-undefined state.
 *
 * State transform (DELETE pattern):
 *   lifecycleByScp.delete(scpName)
 *   fsmByScp.delete(scpName)
 *   lastTransitionAt.delete(scpName)
 *
 * Per type.ts:21 doctrine: "torn-down → entry REMOVED from lifecycleByScp Map"
 *
 * Template: scpLifecycleIdleToSpawning.quality.ts
 *
 * Citation: M62 · M63 · R2 §3.5 · R3 §3.6 · R4 §5.2 (permissive guard amendment)
 */

import { createQualityCardWithPayload, selectPayload } from 'stratimux';
import type { ScpLifecycleState } from '../scpLifecycle.type';
import type {
  ScpLifecycleDyingToGonePayload,
  ScpLifecycleDyingToGone,
} from './types';

export type { ScpLifecycleDyingToGone };

export const scpLifecycleDyingToGone = createQualityCardWithPayload<
  ScpLifecycleState,
  ScpLifecycleDyingToGonePayload
>({
  type: 'Scp Lifecycle Dying To Gone',
  reducer: (state, action) => {
    const { scpName, exitCode, exitSignal, exitedAt } =
      selectPayload<ScpLifecycleDyingToGonePayload>(action);

    const currentFsm = state.fsmByScp.get(scpName);
    if (currentFsm === undefined) {
      console.log('[Scp Lifecycle] DyingToGone no entry, skipping:', scpName);
      return {};
    }
    // R4 §5.2 Path A: any non-undefined fsm state is a legal predecessor to gone.

    const newLifecycle = new Map(state.lifecycleByScp);
    newLifecycle.delete(scpName);

    const newFsm = new Map(state.fsmByScp);
    newFsm.delete(scpName);

    const newLastTransition = new Map(state.lastTransitionAt);
    newLastTransition.delete(scpName);

    console.log(
      '[Scp Lifecycle] DyingToGone:',
      scpName,
      'fromFsm=', currentFsm,
      'exitCode=', exitCode,
      'exitSignal=', exitSignal,
      'exitedAt=', exitedAt,
    );

    return {
      lifecycleByScp: newLifecycle,
      fsmByScp: newFsm,
      lastTransitionAt: newLastTransition,
    };
  },
});
