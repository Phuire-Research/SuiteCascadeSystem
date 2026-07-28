/**
 * scpLifecycleIdleToSpawning · Phase B.3 · Cycle 131
 *
 * Reducer-only Quality. FSM transition: registered → booting.
 * Dispatched from scpMessageRouter.BmrEnvelopeReceived.Method when
 * envelope.kind === 'boot-request' (form-α LOCK · R3 §1.1 · KDDDB pattern).
 *
 * Guard: current fsm MUST be 'registered'. Otherwise return {}.
 *
 * State transform:
 *   lifecycleByScp.set(scpName, 'booting')
 *   fsmByScp.set(scpName, 'booting')
 *   lastTransitionAt.set(scpName, receivedAt)
 *
 * Template: scpLifecycleRegister.quality.ts (Reducer-only pattern)
 *
 * Citation: M62 · M63 · R2 §3.2 · R3 §3.3 · R4 §5 (FSM invariant verified)
 */

import { createQualityCardWithPayload, selectPayload } from 'stratimux';
import type { ScpLifecycleState } from '../scpLifecycle.type';
import type {
  ScpLifecycleIdleToSpawningPayload,
  ScpLifecycleIdleToSpawning,
} from './types';
import { log } from '../../../debugLog';

export type { ScpLifecycleIdleToSpawning };

export const scpLifecycleIdleToSpawning = createQualityCardWithPayload<
  ScpLifecycleState,
  ScpLifecycleIdleToSpawningPayload
>({
  type: 'Scp Lifecycle Idle To Spawning',
  reducer: (state, action) => {
    const { scpName, bootRequestUlid, receivedAt } =
      selectPayload<ScpLifecycleIdleToSpawningPayload>(action);

    const currentFsm = state.fsmByScp.get(scpName);
    // RA-3a · THE PRE-REGISTER SPAWN (the C583 in-between stage): a spawn issued during the
    // bridge's boot window arrives BEFORE the Rescan→Register chain admits the SCP (fsm
    // undefined) — the old guard rejected it and the 'booting' stage NEVER surfaced (the row
    // sat 'pending' straight through a live boot). Accept undefined: set booting directly;
    // the late Register self-skips ('already admitted') so nothing stomps the surface.
    if (currentFsm !== 'registered' && currentFsm !== undefined) {
      console.log(
        '[Scp Lifecycle] IdleToSpawning guard rejected:',
        scpName,
        'currentFsm=',
        currentFsm,
        'ulid=',
        bootRequestUlid,
      );
      log('scplifecycle.fsm.guard-rejected', { scpName, currentFsm, ulid: bootRequestUlid });
      return {};
    }

    const newLifecycle = new Map(state.lifecycleByScp);
    newLifecycle.set(scpName, 'booting');

    const newFsm = new Map(state.fsmByScp);
    newFsm.set(scpName, 'booting');

    const newLastTransition = new Map(state.lastTransitionAt);
    newLastTransition.set(scpName, receivedAt);

    console.log('[Scp Lifecycle] IdleToSpawning:', scpName, 'ulid=', bootRequestUlid);
    log('scplifecycle.fsm.booting', { scpName, ulid: bootRequestUlid });

    return {
      lifecycleByScp: newLifecycle,
      fsmByScp: newFsm,
      lastTransitionAt: newLastTransition,
    };
  },
});
