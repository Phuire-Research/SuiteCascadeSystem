/**
 * scpLifecycleActiveToDying · Phase B.3 · Cycle 131
 *
 * Reducer-only Quality. FSM transition: ready → degraded.
 * Note: 4-state surface stays 'live' until DyingToGone removes entry.
 *
 * Dispatched from:
 *   - scpDockHost POST /teardown Method (B.5 forward)
 *   - admin teardown via menu (B.5 forward)
 *   - envelope kind='teardown' from scpMessageRouter (interim B.3 candidate; not wired here)
 *
 * Guard: current fsm MUST be 'ready'. Otherwise return {}.
 *
 * State transform:
 *   - lifecycleByScp: NO CHANGE (stays 'live' for badge surface)
 *   - fsmByScp.set(scpName, 'degraded')
 *   - lastTransitionAt.set(scpName, initiatedAt)
 *
 * Template: scpLifecycleIdleToSpawning.quality.ts
 *
 * Citation: M62 · M63 · R2 §3.4 · R3 §3.5 · R4 §5 (FSM invariant verified)
 */

import { createQualityCardWithPayload, selectPayload } from 'stratimux';
import type { ScpLifecycleState } from '../scpLifecycle.type';
import type {
  ScpLifecycleActiveToDyingPayload,
  ScpLifecycleActiveToDying,
} from './types';

export type { ScpLifecycleActiveToDying };

export const scpLifecycleActiveToDying = createQualityCardWithPayload<
  ScpLifecycleState,
  ScpLifecycleActiveToDyingPayload
>({
  type: 'Scp Lifecycle Active To Dying',
  reducer: (state, action) => {
    const { scpName, reason, initiatedAt } =
      selectPayload<ScpLifecycleActiveToDyingPayload>(action);

    const currentFsm = state.fsmByScp.get(scpName);
    if (currentFsm !== 'ready') {
      console.log(
        '[Scp Lifecycle] ActiveToDying guard rejected:',
        scpName,
        'currentFsm=',
        currentFsm,
        'reason=',
        reason,
      );
      return {};
    }

    const newFsm = new Map(state.fsmByScp);
    newFsm.set(scpName, 'degraded');

    const newLastTransition = new Map(state.lastTransitionAt);
    newLastTransition.set(scpName, initiatedAt);

    console.log('[Scp Lifecycle] ActiveToDying:', scpName, 'reason=', reason);

    return {
      fsmByScp: newFsm,
      lastTransitionAt: newLastTransition,
    };
  },
});
