/**
 * suite8SetSyncLocalityClient Quality — B-RLM-2 · THE LOCALITY RELAY (Local client Reducer · reception)
 *
 * The client-side reception of the suite8LocalityStcpRelay SMRP broadcast. MERGES the incoming
 * localities + closureGraces Records into the client `suite8` slice, PER-KEY. The relay is the
 * authoritative single writer and carries the FULL Records on every Huirth change, so a full-Record
 * merge == the authoritative set; the per-key merge additionally lets the ODCF one-shot mount
 * hydration (Suite8Control / ShatteriteMenu) seed ONLY its own designation without clobbering other
 * designations a prior relay delivered (the multi-designation-page safety). Suite8Control +
 * ShatteriteMenu read localities[suite8Name] into their syncLocality ref (the 10s poll retirement);
 * B-RLM-3 will read closureGraces[suite8Name] for the revert countdown (this band just lands the slice).
 *
 * B3b — an EMPTY snapshot VALUE (the Local sentinel · ring [] · specified null) is first-class: the
 * relay carries it per key and the merge writes it (a revert to Local clears the specified row). A
 * per-key merge of an EMPTY incoming Record ({}) leaves the held Records intact (nothing to merge) —
 * which is correct: the relay only sends {} when Huirth genuinely holds no designations, and the next
 * populated relay supersedes. Partial reducer return (only the two changed slices · Shortest Path).
 *
 * Relay reception side: this quality's type ('Suite8 Set Sync Locality Client') is the SAME type the
 * suite8LocalityStcpRelay SMRP relay broadcasts via webSocketServerAppendToActionQue. When a page
 * muxium carrying this suite8 concept is mounted, the broadcast lands here and the subscription flows
 * localities[suite8Name] into the component's syncLocality ref.
 *
 * TQNI byte-match anchor — 'Suite8 Set Sync Locality Client' MUST match exactly:
 *   (1) this quality `type` · (2) suite8.muxonomy.ts demometer `type` ·
 *   (3) suite8.muxonomy.ts actionExchange.serverToClient `actionType` (S8_SYNC_LOCALITY_RELAY_TYPE) ·
 *   (4) the suite8SetSyncLocalityClient.actionCreator the locality relay principle imports.
 *
 * Citation: suite8SetDesignationMenuStage.quality.client.ts (the keyed relay-reception sibling).
 * Citation: STRATIMUX-REFERENCE.md "🚀 Critical Reducer Performance Optimization" (partial return).
 * Citation: D-RLM-R3-REACTIVE-LOCALITY-BLUEPRINT.md §2b · D-RLM-SCHOLAR-STATE-SIGNALS-MEANS.md §4 (AMENDMENT 2).
 */
import { createQualityCardWithPayload, defaultMethodCreator } from 'stratimux';
import type { Suite8ClientState, Suite8SetSyncLocalityClientPayload } from '../suite8.type';

export type { Suite8SetSyncLocalityClientPayload };

export const suite8SetSyncLocalityClient = createQualityCardWithPayload<
  Suite8ClientState,
  Suite8SetSyncLocalityClientPayload
>({
  // TQNI · = VERBOSE('SetSyncLocalityClient') · rename target. The locality relay-reception type.
  // MUST byte-match: (1) this type · (2) suite8.muxonomy.ts demometer type · (3) actionExchange
  // actionType (S8_SYNC_LOCALITY_RELAY_TYPE) · (4) the actionCreator the locality relay imports.
  type: 'Suite8 Set Sync Locality Client',
  reducer: (state, action) => {
    const { localities, closureGraces } = action.payload;
    // SHORTEST PATH · PER-KEY MERGE — the relay carries the full authoritative Records (merge == the
    // authoritative set); the merge additionally protects other designations against the single-key
    // ODCF hydration on multi-designation pages. B3b · an empty snapshot VALUE per key still writes.
    return {
      localities: { ...state.localities, ...localities },
      closureGraces: { ...state.closureGraces, ...closureGraces },
    };
  },
  methodCreator: defaultMethodCreator,
});
