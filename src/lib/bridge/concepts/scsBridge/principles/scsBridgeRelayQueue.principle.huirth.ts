/**
 * scsBridgeRelayQueue · RQPOAD · Relay-Queue Pure-Observer-And-Drainer · MVP-RC3 D1
 *
 * The drain Principle for the Synchronous Blocking Message Relay Queue (SBMRQ).
 * A PURE selector-driven drainer — NO Principle-level watchdog, NO closure
 * timestamp (the deadlock backstop lives INSIDE each relay Method via Promise.race;
 * Conductor Resolution). Faithful mirror of the real one-dispatch-per-beat drainer
 * stateBroadcast.principle.ts:21-144 (NOT the webSocketClient emptyQue recursion · C-1).
 *
 * Mechanism:
 *   stageO()  — ownership-open gate (mirror stateBroadcast:22).
 *   stage     — guard !relayBlocked && messageRelayQue.length > 0 → dispatch(head).
 *               head = messageRelayQue[0] is an ACTUAL relay Action (D1). Its OWN
 *               Reducer sets relayBlocked=true AND shifts the head (block+dequeue);
 *               the relay Method holds the block across its async sequence and, on
 *               EVERY exit (success | error | deadline), fires scsBridgeRelayUnblock
 *               from its finally. relayBlocked true→false re-enters THIS stage via
 *               the [relayBlocked] selector → drains the next head. Selector-driven
 *               re-entry is all that is needed (the in-Method watchdog no longer
 *               depends on beat-while-blocked).
 *
 * Selectors (DUAL · GAP-5): [k__.messageRelayQue, k__.relayBlocked]. Queue-only would
 *   miss the unblock transition; flag-only would miss a new enqueue while unblocked.
 *
 * Dispatch option { throttle: 0 } (GAP-4): the drainer re-dispatches the SAME relay
 *   head type for a homogeneous batch (e.g. two Focus relays); {} would be same-type
 *   dropped on item 2 (stagePlannerHelpers.ts:201-213). { throttle: 0 } escapes the
 *   drop AND halts cleanly on empty queue (no spin · Halting-Complete). Single dispatch
 *   per stage — the selector re-fire (not a loop) drives the next iteration.
 *
 * Empty-queue halt: length===0 → stage no-ops → selector re-arms only on next enqueue.
 *
 * Tier-1 base concept (C-5): deck path is d.scsBridge.e.* — no muxified reach, no cast.
 *
 * Citation: stateBroadcast.principle.ts:21-144 (structural parent · C-1) ·
 * MRQ-DIAMOND-WGB.md §3 (under Conductor Resolution: pure drainer, no Principle watchdog) ·
 * MRQ-S8-SCHOLAR-DECK-FROM-QUALITY.md §3.3-§4 (depletion principle · throttle discipline) ·
 * scsBridgeScpToolRegistration.principle.huirth.ts (PrincipleFunction + plan house-style)
 */

import { refreshAction } from 'stratimux';
import type { ScsBridgeState } from '../scsBridge.types';
import type { ScsBridgeRelayQueuePrinciple } from '../scsBridge.types';

export const scsBridgeRelayQueuePrinciple: ScsBridgeRelayQueuePrinciple = ({ plan }) => {
  plan('Scs Bridge Relay Queue Depletion', ({ stage, stageO, k__ }) => [
    stageO(),
    stage(
      ({ concepts, k, dispatch }) => {
        const state = k.getState(concepts) as ScsBridgeState | undefined;
        if (!state) {
          return;
        }
        if (!state.relayBlocked && state.messageRelayQue.length > 0) {
          // D1: the head IS a dispatchable relay Action. Firing it runs its OWN
          // Reducer (relayBlocked=true + slice(1)) synchronously, then its async
          // Method holds the block until relayUnblock fires from the Method finally.
          // C407 · THE DRAIN-REFRESH (Action-Validity Doctrine — refreshAction at
          // RESOLVE time, not only at enqueue). The enqueue-time refresh (+5000ms)
          // covered heads that dispatched within one 4s relay; the spawn kind (SQRK ·
          // PKDM 60s) holds the queue far past any tail action's expiry — a stale head
          // silently never runs its Reducer (relayBlocked never sets · the queue wedges).
          // Refreshing AT DISPATCH makes every head fresh regardless of wait, which is
          // what LEGALIZES per-kind deadlines beyond the 5s expiry ceiling.
          const head = refreshAction(state.messageRelayQue[0]);
          dispatch(head, { throttle: 0 });
        }
      },
      {
        priority: 2000,
        beat: 50,
        selectors: [k__.messageRelayQue, k__.relayBlocked],
      },
    ),
  ]);
};
