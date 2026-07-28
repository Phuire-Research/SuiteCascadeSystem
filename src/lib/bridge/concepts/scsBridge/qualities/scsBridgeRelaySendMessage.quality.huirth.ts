/**
 * scsBridgeRelaySendMessage · SBMRQ Send-Message Relay Quality · MVP-RC3 D3
 *
 * The queued FKIS send relay. NEW parallel Quality — the existing scsBridgeSendMessage
 * (direct, manual `send_message` MCP path) stays UNTOUCHED (NR4 · additive copy-not-move).
 * This relay is the structural one-at-a-time serializer for live keystroke streaming
 * through the message relay queue. Byte-structurally identical to scsBridgeRelayFocus —
 * only the INNER relay logic (FKIS send) + the type-strings differ.
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
 * - relaySequence() = the proven FKIS logic moved in byte-faithful from
 *   scsBridgeSendMessage (EVRC origin resolution → dispatchFkisMessage with
 *   { targetUlid: sessionId, text }), plus SEND_SETTLE_FLOOR_MS.
 * - SEND_SETTLE_FLOOR_MS absorbs the proven (undocumented) SWEEP_STAGGER margin
 *   (S4 §B.1 crack repair) so the block is NOT released before the keystroke lands —
 *   a floor, NOT the watchdog, NOT a completion claim. executeFkis is already per-ULID
 *   FIFO-locked (messageDispatch.ts) so the block + lock compose; no double-relay.
 * - deadline() = a bounded backstop that resolves after RELAY_BLOCK_MAX_MS so a hung
 *   await can NEVER permanently stall the queue (Halting-Complete).
 * - relayUnblock fires from `finally` on ALL THREE exits (success | throw | deadline).
 *
 * createAsyncMethodWithConcepts supplies controller + concepts_ + deck together
 * (GAP-2). The UnBlock side-effect goes through relayUnblock (muxiumTimeOut · OUTSIDE
 * the controller scope · GAP-3), leaving the ONE controller.fire for strategySuccess.
 *
 * Origin discovery (EVRC · Env-Var-Read-at-Call): reads SCS_BRIDGE_ORIGIN_SCP anor
 * SCS_BRIDGE_SCP_NAME server-side at relay time — caller does NOT supply origin
 * identity (parity with scsBridgeSendMessage). Payload field is `sessionId` (the
 * target ULID) → mapped to dispatchFkisMessage's `targetUlid` arg.
 *
 * TQNI 4-site byte-match for 'Scs Bridge Relay Send Message':
 *   (a) ScsBridgeRelaySendMessagePayload (scsBridge.types.ts)
 *   (b) Quality alias ScsBridgeRelaySendMessage (scsBridge.types.ts)
 *   (c) this `type:` literal
 *   (d) registration key scsBridgeRelaySendMessage (scsBridge.concept.ts)
 *
 * MF-4 consts: SEND_SETTLE_FLOOR_MS (~300 · ≥ proven stagger floor · env-overridable
 * for sub-second headless drain) + RELAY_BLOCK_MAX_MS (4000 · MF-5).
 *
 * Citation: scsBridgeRelayFocus.quality.huirth.ts (the relay template) ·
 * scsBridgeSendMessage.quality.huirth.ts (proven FKIS relaySequence source) ·
 * MRQ-DIAMOND-WGB.md §2.3 · MRQ-S8-SCHOLAR-DECK-FROM-QUALITY.md §1.3-§1.4
 */

import {
  createQualityCardWithPayload,
  createAsyncMethodWithConcepts,
  selectPayload,
  strategySuccess,
} from 'stratimux';
import type {
  ScsBridgeState,
  ScsBridgeRelaySendMessagePayload,
  ScsBridgeRelaySendMessage,
} from '../scsBridge.types';
import { dispatchFkisMessage } from '../../../electronMessageDispatch';
import { log } from '../../../debugLog';
import { relayUnblock } from '../model/messageRelayQueBridge.model';

export type { ScsBridgeRelaySendMessage };

// MF-4 · send-settle FLOOR (absorbs the proven SWEEP_STAGGER margin · S4 §B.1 — covers
// the keystroke→land micro-gap before the NEXT relay can fire · NORMAL intra-relay
// pacing, NOT the watchdog). Env-overridable so a headless drain Concluder runs
// sub-second (SCS_RELAY_SETTLE_FLOOR_MS=1).
const SEND_SETTLE_FLOOR_MS = Number(
  process.env.SCS_RELAY_SETTLE_FLOOR_MS ?? 300,
);

// MF-4/MF-5 · bounded deadlock backstop. Set < 5000 so a refreshAction'd queued head
// (5000ms expiration) never out-waits its expiry behind this relay. The deadline()
// race resolves after this so a hung await can never permanently stall the queue.
const RELAY_BLOCK_MAX_MS = 4000;

/** Bounded backstop: resolves after ms so Promise.race can never hang forever. */
const deadline = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

export const scsBridgeRelaySendMessage = createQualityCardWithPayload<
  ScsBridgeState,
  ScsBridgeRelaySendMessagePayload
>({
  type: 'Scs Bridge Relay Send Message',
  // D1: block + dequeue head synchronously, in ONE atomic partial return.
  reducer: (state) => ({
    relayBlocked: true,
    messageRelayQue: state.messageRelayQue.slice(1),
  }),
  methodCreator: () =>
    createAsyncMethodWithConcepts(({ controller, action, concepts_, deck }) => {
      const { sessionId, text, originScpName: payloadOrigin } =
        selectPayload<ScsBridgeRelaySendMessagePayload>(action);

      // relaySequence() = the proven FKIS logic + the settle floor. This is the
      // NORMAL intra-relay pacing; the deadline() race is the bounded backstop.
      const relaySequence = async (): Promise<void> => {
        // C382 L3 ENTRY LOG: the dark relay becomes observable. A future silent skip names
        // itself by this log's ABSENCE against a received toolcall (the C381 fingerprint).
        log('fkis.method.entered', { sessionId, kind: 'relaySendMessage' });
        // C403 · EVRC + PAYLOAD LANE (full scsBridgeSendMessage parity — env FIRST so
        // agents/dev:self stay server-authoritative, payload as the per-SCP lane the
        // shared daemon's static env can never supply). THE SEVERITY DOWNGRADE: a missing
        // origin previously SKIPPED the send outright — the Cadmium research route lost
        // its entire 6.6KB priming Vermillion to a focus-return nicety
        // (relaySend.skipped {hasOrigin:false}, twice across days). The origin only
        // drives Focus-Return-Out; executeFkis handles an unresolvable origin gracefully
        // (origin-MISSING → deliver without restore). DELIVER ALWAYS; name the mode.
        const originScpName =
          process.env.SCS_BRIDGE_ORIGIN_SCP ??
          process.env.SCS_BRIDGE_SCP_NAME ??
          payloadOrigin;
        if (typeof text === 'string' && text.length > 0) {
          dispatchFkisMessage(
            { targetUlid: sessionId, text, originScpName: originScpName ?? '' },
            {
              onError: (err) =>
                log('scsbridge.relaySend.spawn-error', {
                  sessionId,
                  error: err.message,
                }),
            },
          );
          if (originScpName) {
            log('scsbridge.relaySend.completed', { sessionId, textLength: text.length });
          } else {
            log('scsbridge.relaySend.no-origin-delivered', {
              sessionId,
              textLength: text.length,
            });
          }
        } else {
          log('scsbridge.relaySend.skipped', {
            sessionId,
            hasOrigin: !!originScpName,
            textLength: typeof text === 'string' ? text.length : 0,
            reason: 'empty-text',
          });
        }
        await new Promise((resolve) => setTimeout(resolve, SEND_SETTLE_FLOOR_MS));
      };

      void (async (): Promise<void> => {
        try {
          // ALL post-block logic inside the try (no uncovered pre-IIFE window).
          // Promise.race: whichever of relaySequence / RELAY_BLOCK_MAX_MS deadline
          // resolves first ends the await — a hung await can never permanently stall.
          await Promise.race([relaySequence(), deadline(RELAY_BLOCK_MAX_MS)]);
        } catch (err) {
          log('scsbridge.relaySend.error', { sessionId, message: String(err) });
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
