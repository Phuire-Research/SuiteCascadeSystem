/**
 * scpBootOverlay Quality Type Definitions · Boot Overlay Diamond
 *
 * Template: scpLifecycle/qualities/types.ts (B.3 inherited)
 * Pattern: Explicit Quality<State, Payload> type mapping (NEVER typeof per CLAUDE.md non-negotiable)
 *
 * 4-Quality split (BOLS feeds AppendLine · OREE feeds Show/Dismiss · RPDA feeds RestPeriodElapsed):
 *   1. AppendLine          (Method+Reducer · ring buffer push + lastLineAt update + rest-timer reset)
 *   2. Show                (Reducer-only  · activeOverlayScpName set · initializes overlay entry if absent)
 *   3. Dismiss             (Reducer-only  · activeOverlayScpName cleared · entry preserved for re-display)
 *   4. RestPeriodElapsed   (Reducer-only  · dispatched by setTimeout in AppendLine when REST_MS elapsed)
 *
 * Reconciled HIGH-2 + HIGH-4 (R4 Synthesis):
 *   - RestPeriodElapsed Reducer is FSM-aware: caller dispatches only when scpLifecycle FSM is not 'booting'.
 *   - failureLatched flag (set externally by SpawnExited/SpawnErrored bind in
 *     scpSpawnManagerSpawnRequested.quality.ts) holds overlay open — RestPeriodElapsed Reducer is no-op when latched.
 *
 * Citation: M62 Sequential ActionStream Core · M63 Copy-Paste-Plus
 * Citation: SUITE-2-ORANGE-BOOT-OVERLAY-FRONTIER-NAMING.md §Pattern 1 (BOLS) · §Pattern 5 (RPDA) · §Pattern 6 (OREE)
 * Citation: SUITE-4-GREEN-BOOT-OVERLAY-AUDIT.md HIGH-2 (FSM coordination) · HIGH-4 (Failure-state persistence)
 */

import type { Quality } from 'stratimux';
import type { ScpBootOverlayState } from '../scpBootOverlay.type';

export type ScpBootOverlayAppendLinePayload = {
  scpName: string;
  line: string;
};

export type ScpBootOverlayShowPayload = {
  scpName: string;
  forceHold?: boolean;
  // RA-3b · THE FRESH-BOOT RESET (the C583 stale-console find): a spawn-intent Show resets the
  // ring buffer (the PREVIOUS session's console output otherwise re-renders on the new boot);
  // a recall-intent Show (V re-show · NKOR digits) omits it and keeps the buffer.
  freshBoot?: boolean;
};

export type ScpBootOverlayDismissPayload = {
  scpName: string;
  reason: 'user-esc' | 'rest-period' | 'force-hold';
};

export type ScpBootOverlayRestPeriodElapsedPayload = {
  scpName: string;
};

export type ScpBootOverlayAppendLine =
  Quality<ScpBootOverlayState, ScpBootOverlayAppendLinePayload>;

export type ScpBootOverlayShow =
  Quality<ScpBootOverlayState, ScpBootOverlayShowPayload>;

export type ScpBootOverlayDismiss =
  Quality<ScpBootOverlayState, ScpBootOverlayDismissPayload>;

export type ScpBootOverlayRestPeriodElapsed =
  Quality<ScpBootOverlayState, ScpBootOverlayRestPeriodElapsedPayload>;
