/**
 * scpBootOverlayRestPeriodElapsed · Boot Overlay Diamond
 *
 * Reducer-only Quality. Dispatched from the module-scope setTimeout in
 * scpBootOverlayAppendLine.quality.ts when REST_MS of silence elapses.
 *
 * Reconciled HIGH-2 + HIGH-4 (R4 Synthesis):
 *   - Reducer is FSM-aware via failureLatched flag on the entry:
 *     if entry.failureLatched → no-op (HIGH-4 hold open)
 *   - FSM 'booting' suppression handled UPSTREAM in the setTimeout dispatcher
 *     in scpBootOverlayAppendLine.quality.ts (it reads scpLifecycle FSM state
 *     before firing this quality). This Reducer is the final-stage commit.
 *
 * State transform (identical to Dismiss with reason='rest-period'):
 *   - if entry exists and !failureLatched → clear activeOverlayScpName,
 *     set dismissedReason='rest-period'
 *   - else → no-op
 *
 * Citation: M62 · M63 · RPDA (R2 Pattern 5) · PBSM (R2 Pattern 2)
 * Citation: SUITE-4-GREEN-BOOT-OVERLAY-AUDIT.md HIGH-2 (FSM coordination) · HIGH-4 (failure persistence)
 */

import { createQualityCardWithPayload, selectPayload } from 'stratimux';
import type { ScpBootOverlayState } from '../scpBootOverlay.type';
import type {
  ScpBootOverlayRestPeriodElapsedPayload,
  ScpBootOverlayRestPeriodElapsed,
} from './types';

export type { ScpBootOverlayRestPeriodElapsed };

export const scpBootOverlayRestPeriodElapsed = createQualityCardWithPayload<
  ScpBootOverlayState,
  ScpBootOverlayRestPeriodElapsedPayload
>({
  type: 'Scp Boot Overlay Rest Period Elapsed',
  reducer: (state, action) => {
    const { scpName } = selectPayload<ScpBootOverlayRestPeriodElapsedPayload>(action);

    const existing = state.overlays.get(scpName);
    if (existing === undefined) {
      return {};
    }
    if (existing.failureLatched) {
      return {};
    }

    const newOverlays = new Map(state.overlays);
    newOverlays.set(scpName, {
      ...existing,
      dismissedReason: 'rest-period',
    });

    const nextActive = state.activeOverlayScpName === scpName ? null : state.activeOverlayScpName;

    return {
      overlays: newOverlays,
      activeOverlayScpName: nextActive,
    };
  },
});
