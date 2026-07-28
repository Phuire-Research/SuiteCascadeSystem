/**
 * messageRelayQueBridge.model.ts · SBMRQ Deck-Dispatch Helper · MVP-RC3 D1
 *
 * The relayUnblock helper: the canonical Deck-from-Quality dispatch for the
 * Synchronous Blocking Message Relay Queue (SBMRQ). A relay Quality's async
 * Method holds the block (relayBlocked=true) across its whole stepped sequence;
 * when the sequence resolves (success | caught error | watchdog deadline), the
 * Method's `finally` calls relayUnblock to release the block so the RQPOAD drain
 * Principle advances to the next queued head.
 *
 * Why muxiumTimeOut (NOT controller.fire, NOT the singleton handle):
 *   - deck.scsBridge.e.scsBridgeRelayUnblock() only CONSTRUCTS an Action; it does
 *     NOT dispatch. Handing it to muxiumTimeOut registers it on Stratimux's single
 *     Tail-Whip timer (time.ts:43) — OUTSIDE the single-use ActionController scope,
 *     so the Method's ONE controller.fire stays reserved for strategySuccess
 *     (actionController.ts single-use · a 2nd fire is silently dropped).
 *   - The Method receives concepts_ + deck via createAsyncMethodWithConcepts, so no
 *     module-singleton muxium handle is needed for this intra-muxium dispatch.
 *
 * Tier-1 base concept (GAP-6 · C-5): messageRelayQue lives on the scsBridge base
 * concept, so the deck path is deck.scsBridge.e.* (Tier 1). Kept Tier 1 to avoid
 * the ECK recursive-type cast a muxified (Tier 2) reach would force.
 *
 * Mirror: ADMIN_ICP notificationBridge.model.ts relayUnblock/notifyLocal pattern.
 * Citation: MRQ-S8-SCHOLAR-DECK-FROM-QUALITY.md §1.2 + §6 · MRQ-DIAMOND-WGB.md §2.0
 */

import { muxiumTimeOut } from 'stratimux';
import type { Concepts } from 'stratimux';

/**
 * Dispatch scsBridgeRelayUnblock from inside a relay Method via the Tail-Whip timer.
 *
 * @param concepts_ the Concepts bundle (from createAsyncMethodWithConcepts callback)
 * @param deck      the scsBridge Tier-1 deck (loosely typed to the Unblock emitter)
 * @param timeout   Tail-Whip delay in ms (default 0 — release as soon as the timer fires)
 */
export function relayUnblock(
  concepts_: Concepts,
  deck: { scsBridge: { e: { scsBridgeRelayUnblock: () => unknown } } },
  timeout = 0,
): void {
  muxiumTimeOut(
    concepts_,
    () => deck.scsBridge.e.scsBridgeRelayUnblock() as never,
    timeout,
  );
}
