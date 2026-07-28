/**
 * scpBootOverlayDismiss · Boot Overlay Diamond
 *
 * Reducer-only Quality. Clears activeOverlayScpName; preserves the entry's
 * ring buffer for OREE re-display via V hotkey.
 *
 * Dispatched from:
 *   - animatedTui.ts applyKeypress Esc branch (user-esc) — when overlay visible
 *   - scpBootOverlayRestPeriodElapsed (rest-period) — internal cascade
 *   - scpSpawnManagerSpawnExited/Errored handlers (force-hold) — typically NOT used
 *     for dismissal; failure path uses Show with forceHold=true instead (HIGH-4)
 *
 * Guard: idempotent. If activeOverlayScpName !== scpName, still update the
 * entry's dismissedReason for that scpName — the entry continues to exist.
 *
 * Map-mutation pattern (B.2 Card 10): NEW Map returned for KeyedSelector.
 *
 * Citation: M62 · M63 · OREE (R2 Pattern 6) · RPDA (R2 Pattern 5)
 * Citation: SUITE-4-GREEN-BOOT-OVERLAY-AUDIT.md HIGH-3 (Esc modal precedence)
 */

import { createQualityCardWithPayload, selectPayload } from 'stratimux';
import type { ScpBootOverlayState } from '../scpBootOverlay.type';
import type {
  ScpBootOverlayDismissPayload,
  ScpBootOverlayDismiss,
} from './types';

export type { ScpBootOverlayDismiss };

export const scpBootOverlayDismiss = createQualityCardWithPayload<
  ScpBootOverlayState,
  ScpBootOverlayDismissPayload
>({
  type: 'Scp Boot Overlay Dismiss',
  reducer: (state, action) => {
    const { scpName, reason } = selectPayload<ScpBootOverlayDismissPayload>(action);

    const existing = state.overlays.get(scpName);
    if (existing === undefined) {
      const nextActive = state.activeOverlayScpName === scpName ? null : state.activeOverlayScpName;
      if (nextActive === state.activeOverlayScpName) {
        return {};
      }
      return { activeOverlayScpName: nextActive };
    }

    const newOverlays = new Map(state.overlays);
    newOverlays.set(scpName, {
      ...existing,
      dismissedReason: reason,
    });

    const nextActive = state.activeOverlayScpName === scpName ? null : state.activeOverlayScpName;

    return {
      overlays: newOverlays,
      activeOverlayScpName: nextActive,
    };
  },
});
