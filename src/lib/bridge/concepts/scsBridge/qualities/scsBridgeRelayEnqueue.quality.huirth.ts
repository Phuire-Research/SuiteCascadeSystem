/**
 * scsBridgeRelayEnqueue · SBMRQ Enqueue Quality · MVP-RC3 D1
 *
 * Appends PRE-BUILT relay Actions to messageRelayQue. D1 canonical: the queue
 * stores ACTUAL Stratimux Actions (NOT descriptors) — the drain Principle FIRES
 * the head Action directly. Mirror of webSocketClientAppendToActionQue
 * (appendActionQue.quality.ts:14-37): refreshAction per item resets the action's
 * expiration so a queued head does not expire while waiting behind a slow relay
 * (refreshAction default expiration = Date.now()+5000; RELAY_BLOCK_MAX_MS < 5000
 * in the Focus relay guarantees a head never out-waits its expiry in-queue).
 *
 * Reducer returns the single changed key { messageRelayQue: [...actionQue] } — a
 * NEW array ref so the RQPOAD selector [k__.messageRelayQue] re-fires (Shortest
 * Path · partial return · no spread of state). defaultMethodCreator: the Reducer
 * does all the work (pure append).
 *
 * TQNI 4-site byte-match for 'Scs Bridge Relay Enqueue':
 *   (a) ScsBridgeRelayEnqueuePayload (scsBridge.types.ts)
 *   (b) Quality alias ScsBridgeRelayEnqueue (scsBridge.types.ts)
 *   (c) this `type:` literal
 *   (d) registration key scsBridgeRelayEnqueue (scsBridge.concept.ts)
 *
 * Citation: appendActionQue.quality.ts (D1 parity · refreshAction append) ·
 * MRQ-DIAMOND-WGB.md §2.1 · MRQ-S8-SCHOLAR-DECK-FROM-QUALITY.md §8 (import block)
 */

import {
  createQualityCardWithPayload,
  defaultMethodCreator,
  refreshAction,
  selectPayload,
} from 'stratimux';
import type {
  ScsBridgeState,
  ScsBridgeRelayEnqueuePayload,
  ScsBridgeRelayEnqueue,
} from '../scsBridge.types';

export type { ScsBridgeRelayEnqueue };

export const scsBridgeRelayEnqueue = createQualityCardWithPayload<
  ScsBridgeState,
  ScsBridgeRelayEnqueuePayload
>({
  type: 'Scs Bridge Relay Enqueue',
  reducer: (state, action) => {
    const payload = selectPayload<ScsBridgeRelayEnqueuePayload>(action);
    const actionQue = state.messageRelayQue;
    payload.actions.forEach((act) => actionQue.push(refreshAction(act)));
    return { messageRelayQue: [...actionQue] };
  },
  methodCreator: defaultMethodCreator,
});
