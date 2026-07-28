/**
 * scsBridgeRelayFocus · SBMRQ Focus Relay Quality · MVP-RC3 D1 (Focused-Blocking Core)
 *
 * The queued Focus relay. NEW parallel Quality — the existing scsBridgeFocusSession
 * (direct, user-clicked path) stays UNTOUCHED (NR3 · additive copy-not-move). This
 * relay is the structural one-at-a-time serializer for the message relay queue.
 *
 * ── Reducer (D1 · block + dequeue in ONE synchronous atomic return) ──
 *   { relayBlocked: true, messageRelayQue: state.messageRelayQue.slice(1) }
 * Both keys commit atomically (one partial return) — no interleaving window. The
 * head is shifted ON FIRE (not on unblock); the next drain beat sees the head gone
 * AND relayBlocked=true, so the guard !relayBlocked && length>0 is false → no
 * double-fire (H3). Shortest Path · partial return · no spread.
 *
 * ── Method (Conductor Resolution · watchdog RELOCATED into the Method) ──
 * The deadlock watchdog lives INSIDE this Method, NOT at the Principle level. The
 * body is a void async IIFE:
 *   try { ALL post-block logic — incl. payload extraction —
 *         await Promise.race([ relaySequence(), deadline(RELAY_BLOCK_MAX_MS) ]); }
 *   catch {}
 *   finally { relayUnblock(concepts_, deck, 0); }
 * - relaySequence() = the proven Focus logic moved in byte-faithful from
 *   scsBridgeFocusSession (listSessions pre-flight → focusElectronSessionForUlid),
 *   plus the FOCUS_SETTLE_FLOOR_MS settle floor (NORMAL intra-relay pacing covering
 *   the focus→keystroke micro-gap — a floor, NOT the watchdog, NOT a completion claim).
 * - deadline() = a bounded backstop that resolves after RELAY_BLOCK_MAX_MS so a hung
 *   await can NEVER permanently stall the queue (Halting-Complete).
 * - relayUnblock fires from `finally` on ALL THREE exits (success | throw | deadline).
 * ALL logic after the block is INSIDE the try — there is NO uncovered pre-IIFE window
 * (only the synchronous selectPayload precedes it, which cannot throw in practice).
 *
 * createAsyncMethodWithConcepts supplies controller + concepts_ + deck together
 * (GAP-2). The UnBlock side-effect goes through relayUnblock (muxiumTimeOut · OUTSIDE
 * the controller scope · GAP-3), leaving the ONE controller.fire for strategySuccess.
 * In D1 the head is dispatched bare from the drain Principle (no action.strategy), so
 * the controller.fire is skipped entirely — the `if (action.strategy)` guard is dormant.
 *
 * TQNI 4-site byte-match for 'Scs Bridge Relay Focus':
 *   (a) ScsBridgeRelayFocusPayload (scsBridge.types.ts)
 *   (b) Quality alias ScsBridgeRelayFocus (scsBridge.types.ts)
 *   (c) this `type:` literal
 *   (d) registration key scsBridgeRelayFocus (scsBridge.concept.ts)
 *
 * MF-4 consts: FOCUS_SETTLE_FLOOR_MS (~200 · env-overridable for sub-second headless
 * drain) + RELAY_BLOCK_MAX_MS (4000 · < 5000 so a refreshAction'd head never expires
 * in-queue · MF-5).
 *
 * Citation: scsBridgeFocusSession.quality.huirth.ts (proven relaySequence source) ·
 * MRQ-DIAMOND-WGB.md §2.2 · MRQ-D1-GREEN-VERIFY.md (Conductor Resolution · MF-1..5) ·
 * MRQ-S8-SCHOLAR-DECK-FROM-QUALITY.md §1.3-§1.4 (async path · single-use controller)
 */

import {
  createQualityCardWithPayload,
  createAsyncMethodWithConcepts,
  selectPayload,
  strategySuccess,
} from 'stratimux';
import type {
  ScsBridgeState,
  ScsBridgeRelayFocusPayload,
  ScsBridgeRelayFocus,
} from '../scsBridge.types';
import { focusElectronSessionForUlid } from '../../../electronSessionSpawn';
import { listSessions } from '../../../registry';
import { log } from '../../../debugLog';
import { relayUnblock } from '../model/messageRelayQueBridge.model';

export type { ScsBridgeRelayFocus };

// MF-4 · focus-settle FLOOR (covers the focus→keystroke micro-gap before the NEXT
// relay can fire — NORMAL intra-relay pacing, NOT the watchdog). Env-overridable so
// a headless drain Concluder runs sub-second (SCS_RELAY_SETTLE_FLOOR_MS=1).
const FOCUS_SETTLE_FLOOR_MS = Number(
  process.env.SCS_RELAY_SETTLE_FLOOR_MS ?? 200,
);

// MF-4/MF-5 · bounded deadlock backstop. Set < 5000 so a refreshAction'd queued head
// (5000ms expiration) never out-waits its expiry behind this relay. The deadline()
// race resolves after this so a hung await can never permanently stall the queue.
const RELAY_BLOCK_MAX_MS = 4000;

/** Bounded backstop: resolves after ms so Promise.race can never hang forever. */
const deadline = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

export const scsBridgeRelayFocus = createQualityCardWithPayload<
  ScsBridgeState,
  ScsBridgeRelayFocusPayload
>({
  type: 'Scs Bridge Relay Focus',
  // D1: block + dequeue head synchronously, in ONE atomic partial return.
  reducer: (state) => ({
    relayBlocked: true,
    messageRelayQue: state.messageRelayQue.slice(1),
  }),
  methodCreator: () =>
    createAsyncMethodWithConcepts(({ controller, action, concepts_, deck }) => {
      const { sessionId } = selectPayload<ScsBridgeRelayFocusPayload>(action);

      // relaySequence() = the proven Focus logic + the settle floor. This is the
      // NORMAL intra-relay pacing; the deadline() race is the bounded backstop.
      const relaySequence = async (): Promise<void> => {
        // C382 L3 ENTRY LOG: the dark relay becomes observable. A future silent skip names
        // itself by this log's ABSENCE against a received toolcall (the C381 fingerprint).
        log('fkis.method.entered', { sessionId, kind: 'relayFocus' });
        const sessions = await listSessions();
        const entry = sessions.find((s) => s.id === sessionId);
        if (entry !== undefined) {
          focusElectronSessionForUlid(sessionId);
          log('scsbridge.relayFocus.completed', { sessionId, transport: 'electron' });
        } else {
          log('scsbridge.relayFocus.not-found', { sessionId });
        }
        await new Promise((resolve) => setTimeout(resolve, FOCUS_SETTLE_FLOOR_MS));
      };

      void (async (): Promise<void> => {
        try {
          // ALL post-block logic inside the try (no uncovered pre-IIFE window).
          // Promise.race: whichever of relaySequence / RELAY_BLOCK_MAX_MS deadline
          // resolves first ends the await — a hung await can never permanently stall.
          await Promise.race([relaySequence(), deadline(RELAY_BLOCK_MAX_MS)]);
        } catch (err) {
          log('scsbridge.relayFocus.error', { sessionId, message: String(err) });
        } finally {
          // H1: UnBlock on EVERY exit path (success | caught error | deadline).
          relayUnblock(concepts_, deck as never, 0);
        }
      })();

      // Strategy continuation LAST (GAP-3). In D1 heads dispatch bare → guard dormant.
      if (action.strategy) {
        controller.fire(strategySuccess(action.strategy));
      }
    }),
});
