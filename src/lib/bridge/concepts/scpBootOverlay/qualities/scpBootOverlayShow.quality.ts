/**
 * scpBootOverlayShow · Boot Overlay Diamond
 *
 * Reducer-only Quality. Sets activeOverlayScpName to payload.scpName;
 * initializes a new ScpOverlayEntry if not yet present (OREE re-entry path
 * or first spawn dispatch from scpSpawnManagerSpawnRequested.Method).
 *
 * State transform:
 *   - if !overlays.has(scpName) → create entry with empty ring buffer
 *   - clear dismissedReason on the entry
 *   - set activeOverlayScpName = scpName
 *   - if payload.forceHold → set failureLatched=true (HIGH-4 hold path)
 *
 * Map-mutation pattern (B.2 Card 10): NEW Map returned to ensure KeyedSelector change detection.
 *
 * Template: scpLifecycleRegister.quality.ts (Reducer-only · partial-zero idempotency)
 *
 * Citation: M62 · M63 · OREE (R2 Pattern 6) · MOSM (R2 Pattern 8)
 * Citation: SUITE-4-GREEN-BOOT-OVERLAY-AUDIT.md HIGH-4 (forceHold latches failure overlay)
 */

import { createQualityCardWithPayload, selectPayload } from 'stratimux';
import type { ScpBootOverlayState, ScpOverlayEntry } from '../scpBootOverlay.type';
import type {
  ScpBootOverlayShowPayload,
  ScpBootOverlayShow,
} from './types';

export type { ScpBootOverlayShow };

export const scpBootOverlayShow = createQualityCardWithPayload<
  ScpBootOverlayState,
  ScpBootOverlayShowPayload
>({
  type: 'Scp Boot Overlay Show',
  reducer: (state, action) => {
    const { scpName, forceHold, freshBoot } = selectPayload<ScpBootOverlayShowPayload>(action);

    const newOverlays = new Map(state.overlays);
    const existing = newOverlays.get(scpName);
    // RA-3b · THE FRESH-BOOT RESET — a spawn-intent Show (freshBoot) falls through to the
    // empty-buffer branch, discarding the PREVIOUS session's console; a recall keeps it.
    const next: ScpOverlayEntry = existing && !freshBoot
      ? {
          ...existing,
          dismissedReason: null,
          failureLatched: existing.failureLatched || Boolean(forceHold),
        }
      : {
          scpName,
          ringBuffer: [],
          lastLineAt: Date.now(),
          dismissedReason: null,
          totalLinesAppended: 0,
          failureLatched: Boolean(forceHold),
        };
    newOverlays.set(scpName, next);

    return {
      overlays: newOverlays,
      activeOverlayScpName: scpName,
    };
  },
});
