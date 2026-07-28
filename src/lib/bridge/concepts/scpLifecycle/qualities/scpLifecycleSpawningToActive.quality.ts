/**
 * scpLifecycleSpawningToActive · Phase B.3 · Cycle 131
 *
 * Reducer-only Quality. FSM transition: booting → ready (live surface).
 * Dispatched from scpMessageRouter.BmrEnvelopeReceived.Method when
 * envelope.kind === 'heartbeat' (until B.4 scpSpawnManager takes over)
 * OR from scpSpawnManager spawn-confirm Method (B.4 forward).
 *
 * Guard: current fsm MUST be 'booting'. Otherwise return {}.
 *
 * State transform:
 *   lifecycleByScp.set(scpName, 'live')
 *   fsmByScp.set(scpName, 'ready')
 *   lastTransitionAt.set(scpName, becameActiveAt)
 *
 * Template: scpLifecycleIdleToSpawning.quality.ts
 *
 * Citation: M62 · M63 · R2 §3.3 · R3 §3.4 · R4 §5 (FSM invariant verified)
 */

import { createQualityCardWithPayload, selectPayload } from 'stratimux';
import type { ScpLifecycleState } from '../scpLifecycle.type';
import type {
  ScpLifecycleSpawningToActivePayload,
  ScpLifecycleSpawningToActive,
} from './types';
import { log } from '../../../debugLog';

export type { ScpLifecycleSpawningToActive };

export const scpLifecycleSpawningToActive = createQualityCardWithPayload<
  ScpLifecycleState,
  ScpLifecycleSpawningToActivePayload
>({
  type: 'Scp Lifecycle Spawning To Active',
  reducer: (state, action) => {
    const { scpName, heartbeatUlid, port, becameActiveAt } =
      selectPayload<ScpLifecycleSpawningToActivePayload>(action);

    const currentFsm = state.fsmByScp.get(scpName);
    // RA-2a · THE SIMULTANEOUS-SPAWN TOLERANCE (the C582 field find): a spawn issued DURING the
    // bridge's own boot window races the Rescan→Register chain — IdleToSpawning fires before the
    // SCP is 'registered' (rejected), Register then lands 'registered', and probe-success arrived
    // here to find fsm 'registered' (never 'booting') → the live transition was refused and the
    // row stuck 'pending' despite a proven boot. probe-success IS the proof either way — accept
    // 'registered' as a valid source alongside 'booting'.
    if (currentFsm !== 'booting' && currentFsm !== 'registered') {
      console.log(
        '[Scp Lifecycle] SpawningToActive guard rejected:',
        scpName,
        'currentFsm=',
        currentFsm,
      );
      // F3(a) FSM ALIGNMENT (window-close signal cure): telemeter the rejection so a live run
      // diagnoses itself (was silent · console-only).
      log('scplifecycle.fsm.spawning-to-active-rejected', { scpName, currentFsm });
      return {};
    }

    const newLifecycle = new Map(state.lifecycleByScp);
    newLifecycle.set(scpName, 'live');

    const newFsm = new Map(state.fsmByScp);
    newFsm.set(scpName, 'ready');

    const newLastTransition = new Map(state.lastTransitionAt);
    newLastTransition.set(scpName, becameActiveAt);

    console.log(
      '[Scp Lifecycle] SpawningToActive:',
      scpName,
      'port=',
      port ?? 'none',
      'heartbeatUlid=',
      heartbeatUlid ?? 'none',
    );
    // F3(a) FSM ALIGNMENT (window-close signal cure): the READY transition was untelemetered —
    // IdleToSpawning log()s `fsm.booting` but this ready transition only console.log()ed, so the
    // daemon log showed `fsm.booting` and NEVER `fsm.ready` EVEN WHEN the TUI row read 'live'
    // (lifecycleByScp='live' is set atomically here with fsmByScp='ready'). That was the FSM
    // contradiction: a telemetry gap, not a wiring gap (probe-success → this dispatch is wired at
    // scpSpawnManagerSpawnRequested.quality.ts:366). Log it so the daemon self-diagnoses live.
    log('scplifecycle.fsm.ready', {
      scpName,
      port: port ?? null,
      heartbeatUlid: heartbeatUlid ?? null,
    });

    return {
      lifecycleByScp: newLifecycle,
      fsmByScp: newFsm,
      lastTransitionAt: newLastTransition,
    };
  },
});
