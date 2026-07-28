/**
 * scpLifecycleWindowClosed · D-WC-2 · Window-Close Signal
 *
 * Reducer-only Quality. FSM transition: ready|degraded → registered.
 * 4-state surface: live → pending.
 *
 * Dispatched from src/main/electronWindow.ts win.on('closed') (fire-once via the
 * carrying-window guard) when the user closes an SCP presenter/source window while
 * the bridge Muxium handle is live and NOT tearing down.
 *
 * Semantic (the honest inverse of the boot arc): closing the SCP window returns the
 * lifecycle SURFACE to 'pending' so a fresh [L] can re-open it — the same resting
 * state Register admits into. This is a SURFACE signal, NOT a process-death signal:
 * spawnManager owns process death via DyingToGone (entry removal). The SCP child may
 * still be alive; boundScps (projected from spawnsByScp, not this FSM) is unaffected.
 *
 * Guard (FailureNode-honest · F3b window-close signal cure): current fsm MUST be one of
 * the WINDOW-VISIBLE states a window can occupy: 'booting' (window opened while the readiness
 * probe is still in flight — SpawningToActive not yet fired), 'ready', or 'degraded'. From any
 * other state — 'registered' (never had a window), 'torn-down' (already gone), or an unknown
 * scpName (undefined) — return {} (no-op). The prior guard rejected 'booting' too, which dropped
 * the close signal for any SCP whose window closed before probe-success; the honest set is
 * booting|ready|degraded because ALL THREE are live surfaces returning to pending.
 *
 * State transform:
 *   lifecycleByScp.set(scpName, 'pending')
 *   fsmByScp.set(scpName, 'registered')
 *   lastTransitionAt.set(scpName, closedAt)
 *
 * Template: scpLifecycleIdleToSpawning.quality.ts (Reducer-only · guarded transition)
 *
 * Citation: M63 Copy-Paste-Plus · STRATIMUX-REFERENCE.md Quality Creation Patterns
 * Citation: D-WC-2 The SCP Close · type.ts:21 FSM doctrine (registered → pending surface)
 */

import { createQualityCardWithPayload, selectPayload } from 'stratimux';
import type { ScpLifecycleState } from '../scpLifecycle.type';
import type {
  ScpLifecycleWindowClosedPayload,
  ScpLifecycleWindowClosed,
} from './types';
import { log } from '../../../debugLog';

export type { ScpLifecycleWindowClosed };

export const scpLifecycleWindowClosed = createQualityCardWithPayload<
  ScpLifecycleState,
  ScpLifecycleWindowClosedPayload
>({
  type: 'Scp Lifecycle Window Closed',
  reducer: (state, action) => {
    const { scpName, closedAt } =
      selectPayload<ScpLifecycleWindowClosedPayload>(action);

    // F3b · window-visible fsm set: booting|ready|degraded (ALL are live surfaces a window
    // can occupy). Reject registered (no window) / torn-down (gone) / undefined (unknown name).
    const currentFsm = state.fsmByScp.get(scpName);
    if (
      currentFsm !== 'booting' &&
      currentFsm !== 'ready' &&
      currentFsm !== 'degraded'
    ) {
      console.log(
        '[Scp Lifecycle] WindowClosed guard rejected:',
        scpName,
        'currentFsm=',
        currentFsm,
      );
      // F2 quality-side: rejection carries scpName + the ACTUAL fsm value through the daemon's
      // log() so a live run self-diagnoses (was already present · retained under the wider set).
      log('scplifecycle.fsm.window-closed-rejected', { scpName, currentFsm });
      return {};
    }

    const newLifecycle = new Map(state.lifecycleByScp);
    newLifecycle.set(scpName, 'pending');

    const newFsm = new Map(state.fsmByScp);
    newFsm.set(scpName, 'registered');

    const newLastTransition = new Map(state.lastTransitionAt);
    newLastTransition.set(scpName, closedAt);

    console.log('[Scp Lifecycle] WindowClosed:', scpName, 'fromFsm=', currentFsm);
    log('scplifecycle.fsm.window-closed', { scpName, fromFsm: currentFsm });

    return {
      lifecycleByScp: newLifecycle,
      fsmByScp: newFsm,
      lastTransitionAt: newLastTransition,
    };
  },
});
