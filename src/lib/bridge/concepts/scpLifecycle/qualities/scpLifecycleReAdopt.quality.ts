/**
 * scpLifecycleReAdopt · RA-1 · THE RE-ADOPTION LEG (the C581 close of the RE-ADOPTION GAP)
 *
 * Reducer-only Quality. FSM transition: registered → ready (live surface) WITHOUT a spawn.
 *
 * The gap (C580 r4 trace, field-confirmed): the FSM goes 'live' ONLY via
 * scpLifecycleSpawningToActive (own-spawn probe-success). A bridge restart sweeps SCPs.json to
 * 'pending' (W4) and re-registers every SCP at 'registered' — an SCP whose server OUTLIVES the
 * restart never re-earns 'live' (badge stuck 'pending' · [L] on it would DOUBLE-SPAWN).
 *
 * THIS quality is the re-adoption write leg: the router's re-adoption sweep proves the SCP is
 * live NOW (a /scp-config probe answering with the MATCHING scpName — now-liveness + identity in
 * one round-trip) and dispatches this transition. Guard: fsm MUST be 'registered' (a booting/
 * ready/degraded SCP is already surfaced by the spawn path — self-reject, never clobber).
 *
 * Template: scpLifecycleSpawningToActive.quality.ts (atomic live/ready/lastTransition write).
 * Citation: ONYX-TIER-26 C580 (the r4 trace) · scpMessageRouter.principle.ts (the sweep).
 */

import { createQualityCardWithPayload, selectPayload } from 'stratimux';
import type { ScpLifecycleState } from '../scpLifecycle.type';
import type { ScpLifecycleReAdoptPayload, ScpLifecycleReAdopt } from './types';
import { log } from '../../../debugLog';

export type { ScpLifecycleReAdopt };

export const scpLifecycleReAdopt = createQualityCardWithPayload<
  ScpLifecycleState,
  ScpLifecycleReAdoptPayload
>({
  type: 'Scp Lifecycle Re Adopt',
  reducer: (state, action) => {
    const { scpName, port, reAdoptedAt } = selectPayload<ScpLifecycleReAdoptPayload>(action);

    const currentFsm = state.fsmByScp.get(scpName);
    if (currentFsm !== 'registered') {
      // A spawn-path surface (booting/ready/degraded) anor an unknown SCP — never clobber.
      log('scplifecycle.fsm.readopt-rejected', { scpName, currentFsm: currentFsm ?? null });
      return {};
    }

    const newLifecycle = new Map(state.lifecycleByScp);
    newLifecycle.set(scpName, 'live');

    const newFsm = new Map(state.fsmByScp);
    newFsm.set(scpName, 'ready');

    const newLastTransition = new Map(state.lastTransitionAt);
    newLastTransition.set(scpName, reAdoptedAt);

    console.log('[Scp Lifecycle] ReAdopt:', scpName, 'port=', port, '· live server re-adopted');
    log('scplifecycle.fsm.readopt', { scpName, port, reAdoptedAt });

    return {
      lifecycleByScp: newLifecycle,
      fsmByScp: newFsm,
      lastTransitionAt: newLastTransition,
    };
  },
});
