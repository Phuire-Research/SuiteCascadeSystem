/**
 * scpBootOverlayAppendLine · Boot Overlay Diamond
 *
 * Method+Reducer Quality. Method-side: schedules/resets the per-SCP rest-period
 * timer (RPDA · R2 Pattern 5). Reducer-side: appends line to ring buffer +
 * updates lastLineAt + increments totalLinesAppended.
 *
 * BOLS (Boot-Output-Line-Streaming, R2 Pattern 1) feeds this Quality —
 * scpSpawnManagerSpawnRequested.quality.ts dispatches one AppendLine per stdout/stderr
 * decoded line. The ring buffer is the in-memory tail consumed by animatedTui.ts
 * render path.
 *
 * Reducer state transform:
 *   - if !overlays.has(scpName) → create entry (defensive: should already exist
 *     from prior Show dispatch on spawn)
 *   - push line; if ringBuffer.length > RING_BUFFER_K, shift oldest
 *   - update lastLineAt = Date.now()
 *   - increment totalLinesAppended
 *
 * Map-mutation pattern (B.2 Card 10): NEW Map returned for KeyedSelector.
 *
 * Method work:
 *   - Reset module-scope rest timer for this scpName (RPDA debouncing)
 *   - Returns muxiumConclude() — Reducer is independent (no strategyDetermine cascade)
 *
 * Template: scpSpawnManagerSpawnRequested.quality.ts (Method+Reducer · form-α)
 *
 * Citation: M62 · M63 · BOLS (R2 Pattern 1) · RPDA (R2 Pattern 5)
 * Citation: SUITE-4-GREEN-BOOT-OVERLAY-AUDIT.md HIGH-2 (FSM-aware rest timer)
 */

import {
  createQualityCardWithPayload,
  createMethodWithConcepts,
  selectPayload,
  muxiumConclude,
} from 'stratimux';
import type { ScpBootOverlayState, ScpOverlayEntry } from '../scpBootOverlay.type';
import { RING_BUFFER_K } from '../scpBootOverlay.type';
import type {
  ScpBootOverlayAppendLinePayload,
  ScpBootOverlayAppendLine,
} from './types';
import { scheduleRestTimer } from './restTimerRegistry';

export type { ScpBootOverlayAppendLine };

export const scpBootOverlayAppendLine = createQualityCardWithPayload<
  ScpBootOverlayState,
  ScpBootOverlayAppendLinePayload
>({
  type: 'Scp Boot Overlay Append Line',
  reducer: (state, action) => {
    const { scpName, line } = selectPayload<ScpBootOverlayAppendLinePayload>(action);

    const newOverlays = new Map(state.overlays);
    const existing = newOverlays.get(scpName);

    let nextEntry: ScpOverlayEntry;
    if (existing === undefined) {
      nextEntry = {
        scpName,
        ringBuffer: [line],
        lastLineAt: Date.now(),
        dismissedReason: null,
        totalLinesAppended: 1,
        failureLatched: false,
      };
    } else {
      const nextRing = existing.ringBuffer.length >= RING_BUFFER_K
        ? [...existing.ringBuffer.slice(existing.ringBuffer.length - RING_BUFFER_K + 1), line]
        : [...existing.ringBuffer, line];
      nextEntry = {
        ...existing,
        ringBuffer: nextRing,
        lastLineAt: Date.now(),
        totalLinesAppended: existing.totalLinesAppended + 1,
      };
    }
    newOverlays.set(scpName, nextEntry);

    return {
      overlays: newOverlays,
    };
  },
  methodCreator: () =>
    createMethodWithConcepts(({ action }) => {
      const { scpName } = selectPayload<ScpBootOverlayAppendLinePayload>(action);
      scheduleRestTimer(scpName);
      return muxiumConclude();
    }),
});
