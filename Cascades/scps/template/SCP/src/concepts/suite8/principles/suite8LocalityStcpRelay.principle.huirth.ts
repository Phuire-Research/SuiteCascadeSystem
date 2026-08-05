/**
 * suite8LocalityStcpRelay Principle (B-RLM-2 · THE LOCALITY RELAY · SMRP + BOCR · Huirth)
 *
 * The Reactive Locality Manifold's relay — the SAME proven live-relay stack as the
 * cadmiumTopicBulletin / suite8Menu relays, applied to the suite8 `localities` + `closureGraces`
 * Huirth slices. It retires the two 10s locality polls (Suite8Control + ShatteriteMenu): the Usher's
 * boundary watchers already fire on every locality-relevant change and dispatch
 * suite8SetLocalityHuirthBase into `localities`; this relay broadcasts that (with the graces slice)
 * to every connected client, which reads it into its syncLocality ref.
 *
 *   SMRP (State-Mirror-Reactive-Principle) — selector-reactive on d.suite8.k.localities AND
 *     d.suite8.k.closureGraces. On every change (the Usher dispatches the Base action FIRST), broadcast
 *     ONE client action (suite8SetSyncLocalityClient) carrying BOTH the full localities Record AND the
 *     full closureGraces Record (Scholar AMENDMENT 2 · the grace relay). { throttle: 0 } (DTBP) —
 *     selector-persistent low-beat plan opts out of halting recursion-overflow.
 *
 *   BOCR (Backfill-On-Connect-Replay) — selector-reactive on webSocketClients pool count. On a count
 *     INCREASE (new client joined), read the authoritative Huirth localities + closureGraces and
 *     backfill EACH newly-joined connectionId via targetConnectionId (no broadcast to existing clients).
 *
 * B3b · NO GUARDS — the EMPTY broadcast is a first-class citizen (mirrors the cadmiumTopicBulletin
 * B3b law · no length===0 boot-skip): an empty localities Record ({}) at boot is not a storm (the
 * selector gate already fires on CHANGE only), and a designation reverting to Local (its snapshot
 * cleared to the Local sentinel) MUST reach the client to clear the stale specified row. Empty is a
 * state, not an absence.
 *
 * Deck: MuxiumDeck & { suite8: Suite8HuirthConcept-shape; webSocketServer } — reads d.suite8.k.localities
 * + d.suite8.k.closureGraces + d.webSocketServer.k.webSocketClients (all flat Tier-1 in the Huirth
 * muxium · the same cross-concept co-muxified access the menu/topicBulletin relays prove).
 *
 * PrincipleFunction generics bind the HUIRTH variants (Suite8HuirthQualities / Suite8HuirthState) —
 * NOT the client variants (mirrors cadmiumTopicBulletinStcpRelay · the relay reads Huirth Base state).
 *
 * Telemetry: 'locality.relay.broadcast' { designationCount } on SMRP fire + 'locality.relay.backfill'
 * { newClientCount, designationCount } on BOCR fire (the SCP-local Bridge sink · the sinkSyncLibraryTelemetry
 * rail the Usher already uses · never-throw + 2MB skip-guard).
 *
 * Citation: cadmiumTopicBulletinStcpRelay.principle.huirth.ts (the SMRP+BOCR-no-FSWatcher byte-mirror ·
 *   the B3b empty-first-class law · the BOCR {} posture).
 * Citation: feedback_stratimux_dispatch_throttle_discipline.md ({ throttle: 0 }).
 * Citation: D-RLM-R3-REACTIVE-LOCALITY-BLUEPRINT.md §3 · D-RLM-SCHOLAR-STATE-SIGNALS-MEANS.md §4.
 */
import type { PrincipleFunction, MuxiumDeck, Concept, AnyAction } from 'stratimux';
import type {
  Suite8HuirthState,
  Suite8HuirthQualities,
  Suite8SyncLocalitySnapshot,
  Suite8ClosureGrace,
} from '../suite8.type';
import type {
  WebSocketServerState,
  WebSocketServerQualities,
} from '../../webSocketServer/webSocketServer.concept';
import { suite8SetSyncLocalityClient } from '../qualities/suite8SetSyncLocalityClient.quality.client';
import { sinkSyncLibraryTelemetry } from '../../../model/suite8SyncLibrary.model';

export type Suite8LocalityStcpRelayDeck = MuxiumDeck & {
  suite8: Concept<Suite8HuirthState, Suite8HuirthQualities>;
  webSocketServer: Concept<WebSocketServerState, WebSocketServerQualities>;
};

export type Suite8LocalityStcpRelayPrincipleType = PrincipleFunction<
  Suite8HuirthQualities,
  Suite8LocalityStcpRelayDeck,
  Suite8HuirthState
>;

export const suite8LocalityStcpRelayPrinciple: Suite8LocalityStcpRelayPrincipleType = ({ d_, plan }) => {
  console.log('[Suite8 Locality STCP Relay] Principle started · SMRP + BOCR (Huirth)');

  // BOCR closure var — last observed WebSocket pool count (mirrors the cadmiumTopicBulletin relay).
  let lastKnownCount = 0;

  const relayPlan = plan('Suite8 Locality STCP Relay (SMRP + BOCR · Huirth)', ({ stage }) => [
    // SMRP — selector-reactive on suite8.k.localities + suite8.k.closureGraces → broadcast BOTH slices.
    stage(
      ({ d, dispatch }) => {
        const localities = d.suite8.k.localities.select() as Record<string, Suite8SyncLocalitySnapshot>;
        const closureGraces = d.suite8.k.closureGraces.select() as Record<string, Suite8ClosureGrace>;
        // B3b · the EMPTY broadcast is first-class — no length===0 boot-skip. The selector gate
        // already prevents any storm (the stage fires on CHANGE only); one {} relay at boot is not
        // a storm, and a revert-to-Local ({} snapshot) MUST reach the client to clear the stale row.
        // DTBP · { throttle: 0 } — selector-persistent low-beat plan must re-fire on every change.
        dispatch(
          d.webSocketServer.e.webSocketServerAppendToActionQue({
            actionQue: [
              suite8SetSyncLocalityClient.actionCreator({ localities, closureGraces }) as AnyAction,
            ],
          } as { actionQue: AnyAction[]; targetConnectionId?: string }),
          { throttle: 0 },
        );
        // Telemetry — the SMRP fire, counted by designation.
        sinkSyncLibraryTelemetry('locality.relay.broadcast', {
          designationCount: Object.keys(localities).length,
          graceCount: Object.keys(closureGraces).length,
        });
        console.log(
          '[Suite8 Locality STCP Relay] SMRP · localities broadcast · designations=',
          Object.keys(localities).length,
          '· graces=',
          Object.keys(closureGraces).length,
        );
      },
      {
        selectors: [d_.suite8.k.localities, d_.suite8.k.closureGraces],
        beat: 1,
      },
    ),

    // BOCR — selector-reactive on webSocketClients pool count INCREASE → targeted backfill.
    stage(
      ({ d, dispatch }) => {
        const clients = d.webSocketServer.k.webSocketClients.select();
        const currentCount = clients?.length ?? 0;

        if (currentCount <= lastKnownCount) {
          lastKnownCount = currentCount;
          return;
        }

        const newIds: string[] = [];
        for (let i = lastKnownCount; i < currentCount; i++) {
          const c = clients[i];
          if (c?.connectionId) newIds.push(c.connectionId);
        }
        lastKnownCount = currentCount;
        if (newIds.length === 0) return;

        // Huirth state (authoritative after the Base dispatch keeps it current).
        const localities = d.suite8.k.localities.select() as Record<string, Suite8SyncLocalitySnapshot>;
        const closureGraces = d.suite8.k.closureGraces.select() as Record<string, Suite8ClosureGrace>;
        for (const id of newIds) {
          dispatch(
            d.webSocketServer.e.webSocketServerAppendToActionQue({
              actionQue: [
                suite8SetSyncLocalityClient.actionCreator({ localities, closureGraces }) as AnyAction,
              ],
              targetConnectionId: id,
            } as { actionQue: AnyAction[]; targetConnectionId?: string }),
            {},
          );
        }
        sinkSyncLibraryTelemetry('locality.relay.backfill', {
          newClientCount: newIds.length,
          designationCount: Object.keys(localities).length,
        });
        console.log(
          '[Suite8 Locality STCP Relay] BOCR · backfilled', newIds.length, 'client(s) · designations=',
          Object.keys(localities).length,
        );
      },
      {
        selectors: [d_.webSocketServer.k.webSocketClients],
        beat: 1,
      },
    ),
  ]);

  return () => {
    console.log('[Suite8 Locality STCP Relay] Principle cleanup');
    relayPlan.conclude();
  };
};
