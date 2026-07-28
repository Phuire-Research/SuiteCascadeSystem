/**
 * scsBridgeRelayUnblock · SBMRQ Unblock Quality · MVP-RC3 D1
 *
 * Payload-less Quality that CLEARS the relay block. Reducer returns the single
 * changed key { relayBlocked: false } (Shortest Path · partial return). The
 * defaultMethodCreator no-op Method runs after the Reducer commits — the Reducer
 * IS the whole Lambda.
 *
 * Dispatched EXCLUSIVELY from inside a relay Quality's async Method `finally` via
 * relayUnblock (messageRelayQueBridge.model.ts · muxiumTimeOut deck-deferral) — on
 * EVERY exit path (success | caught error | watchdog deadline). Never fired by
 * external callers. When relayBlocked flips true→false, the RQPOAD drain Principle's
 * selector re-enters the stage and dispatches the next queued head (selector-driven
 * re-entry · no Principle-level watchdog needed).
 *
 * Type-string 'Scs Bridge Relay Unblock' = Space-Separated-Capitalized of the
 * camelCase name (Verbose Split Naming · NON-NEGOTIABLE). TQNI 4-site byte-match:
 * (a) Quality alias ScsBridgeRelayUnblock (scsBridge.types.ts), (c) this `type:`
 * literal, (d) the registration key scsBridgeRelayUnblock (scsBridge.concept.ts).
 * (Payload-less — no payload-type site.)
 *
 * Citation: MRQ-S8-SCHOLAR-DECK-FROM-QUALITY.md §2 + §8 (createQualityCard import) ·
 * MRQ-DIAMOND-WGB.md §2.6 · scsBridgeFocusSession.quality.huirth.ts (re-export pattern)
 */

import { createQualityCard, defaultMethodCreator } from 'stratimux';
import type { ScsBridgeState, ScsBridgeRelayUnblock } from '../scsBridge.types';

export type { ScsBridgeRelayUnblock };

export const scsBridgeRelayUnblock = createQualityCard<ScsBridgeState>({
  type: 'Scs Bridge Relay Unblock',
  reducer: () => ({ relayBlocked: false }),
  methodCreator: defaultMethodCreator,
});
