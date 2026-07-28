/**
 * restTimerRegistry · MMUI Module-Level Rest-Period Timer Registry · Boot Overlay Diamond
 *
 * Module-private Map of NodeJS Timeout handles keyed by scpName. NEVER enters
 * Stratimux state · MMUI escape hatch (M60 State-or-Payload Anor). Same pattern
 * as childProcessRegistry.ts (B.4 LOCK 2).
 *
 * Purpose: RPDA (Rest-Period-Dismissal-Algorithm, R2 Pattern 5) lives here as
 * a module-scope Map<scpName, Timeout>. Each AppendLine Method invocation:
 *   1. Clears any pending timer for that scpName (debouncing input).
 *   2. Schedules a new timer that fires REST_MS later.
 *   3. When timer fires: FSM check via deck → dispatch RestPeriodElapsed.
 *
 * FSM-aware dispatch (R4 HIGH-2 reconciliation):
 *   - When the timer fires, read scpLifecycle.lifecycleByScp via deck handle.
 *   - If FSM === 'booting' → SKIP dispatch, reschedule for another REST_MS.
 *   - Else → dispatch scpBootOverlayRestPeriodElapsed.
 *
 * Citation: M60 State-or-Payload Anor (MMUI escape hatch) · M62 Sequential ActionStream Core
 * Citation: SUITE-2-ORANGE-BOOT-OVERLAY-FRONTIER-NAMING.md §Pattern 5 (RPDA)
 * Citation: SUITE-4-GREEN-BOOT-OVERLAY-AUDIT.md HIGH-2 (FSM coordination)
 */

import {
  getActiveScsBridgeMuxiumHandle,
  type ScsBridgeMuxiumHandle,
} from '../../../scsBridgeMuxium';

export const REST_MS = 8_000;

const restTimersByScp: Map<string, ReturnType<typeof setTimeout>> = new Map();

export function clearRestTimer(scpName: string): void {
  const existing = restTimersByScp.get(scpName);
  if (existing !== undefined) {
    clearTimeout(existing);
    restTimersByScp.delete(scpName);
  }
}

function dispatchRestPeriodElapsed(scpName: string): void {
  const handle: ScsBridgeMuxiumHandle | null = getActiveScsBridgeMuxiumHandle();
  if (handle === null) {
    return;
  }
  try {
    const deck = handle.muxium.deck as unknown as {
      d: {
        scp: {
          d: {
            scpLifecycle: {
              k: {
                lifecycleByScp: { select: () => Map<string, string> };
              };
            };
            scpBootOverlay: {
              e: {
                scpBootOverlayRestPeriodElapsed: (p: { scpName: string }) => unknown;
              };
            };
          };
        };
      };
    };
    const fsmMap = deck.d.scp.d.scpLifecycle.k.lifecycleByScp.select();
    const fsmState = fsmMap.get(scpName);
    if (fsmState === 'booting') {
      scheduleRestTimer(scpName);
      return;
    }
    const action = deck.d.scp.d.scpBootOverlay.e.scpBootOverlayRestPeriodElapsed({ scpName });
    handle.muxium.dispatch(action as never);
  } catch {
    // swallow — overlay timer must never crash the bridge
  }
}

export function scheduleRestTimer(scpName: string): void {
  clearRestTimer(scpName);
  const id = setTimeout(() => {
    restTimersByScp.delete(scpName);
    dispatchRestPeriodElapsed(scpName);
  }, REST_MS);
  restTimersByScp.set(scpName, id);
}

export function clearAllRestTimers(): void {
  for (const id of restTimersByScp.values()) {
    clearTimeout(id);
  }
  restTimersByScp.clear();
}
