/**
 * suite8InstallRequirementsStcpRelay Principle (EF-5 · THE INSTALL CIRCUIT · keyed · STCP · SMRP + BOCR · Huirth)
 *
 * The install-requirements sibling of suite8MenuStcpRelay — the keyed-Record live-relay stack applied to
 * the suite8 keyed `installRequirementsMap` Record. The two halves of the proven live-relay pattern:
 *
 *   SMRP (State-Mirror-Reactive-Principle) — selector-reactive on d.suite8.k.installRequirementsMap (the
 *     WHOLE Record · any-key change fires). On every Base change (the install-watcher dir-watch dispatches
 *     suite8SetInstallRequirementsHuirthBase FIRST), diff the Record against the last-known content-identity
 *     snapshot to find WHICH designation(s) changed, then broadcast the keyed relay (suite8SetInstallRequirements)
 *     for each changed designation to ALL connected clients. { throttle: 0 } (DTBP) — selector-persistent
 *     low-beat plan opts out of halting recursion-overflow.
 *
 *   BOCR (Backfill-On-Connect-Replay) — selector-reactive on webSocketClients pool count. On a count
 *     INCREASE (new client joined), read the authoritative Huirth installRequirementsMap Record and backfill
 *     EACH newly-joined connectionId with the keyed relay for EVERY designation snapshot (no broadcast to
 *     existing clients).
 *
 * DIVERGENCE from suite8MenuStcpRelay (documented): the menu relay boot-SKIPS empty stages (stageVal.stages
 * .length === 0) to avoid an Idle re-broadcast storm. The install lane does NOT skip the not-present verdict
 * ({ present:false }) — it is a MEANINGFUL state the Suite8 Control consumes ("clear the station honestly").
 * The content-identity diff (lastBroadcastIdentity) already suppresses repeats, so no storm arises; a
 * genuinely absent designation simply has no key in the Record (nothing to iterate) until the watcher's
 * first-load dispatches its verdict once.
 *
 * Deck: MuxiumDeck & { suite8: Suite8HuirthConcept; webSocketServer }. Reads d.suite8.k.installRequirementsMap
 * + d.webSocketServer.k.webSocketClients (both flat Tier-1 in the Huirth muxium).
 *
 * Citation: suite8MenuStcpRelay.principle.huirth.ts (the keyed-Record SMRP + BOCR precedent · verbatim structure).
 * Citation: feedback_stratimux_dispatch_throttle_discipline.md ({ throttle: 0 }).
 * Citation: scpS8InstallCircuit.model.ts EF-5 (the install circuit · the gate-file feed).
 */
import type { PrincipleFunction, MuxiumDeck, Concept, AnyAction } from 'stratimux';
import type {
  Suite8HuirthState,
  Suite8HuirthQualities,
  InstallRequirementsPayload,
} from '../suite8.type';
import type {
  WebSocketServerState,
  WebSocketServerQualities,
} from '../../webSocketServer/webSocketServer.concept';
import {
  createStcpComponentRelay,
  type StcpBroadcastFn,
} from '../../../model/stcpComponentRelay.model';
import {
  createSuite8InstallRequirementsRelayConfig,
  installRequirementsContentIdentity,
} from './suite8InstallRequirementsWatch.principle.huirth';

export type Suite8InstallRequirementsStcpRelayDeck = MuxiumDeck & {
  suite8: Concept<Suite8HuirthState, Suite8HuirthQualities>;
  webSocketServer: Concept<WebSocketServerState, WebSocketServerQualities>;
};

export type Suite8InstallRequirementsStcpRelayPrincipleType = PrincipleFunction<
  Suite8HuirthQualities,
  Suite8InstallRequirementsStcpRelayDeck,
  Suite8HuirthState
>;

export const suite8InstallRequirementsStcpRelayPrinciple: Suite8InstallRequirementsStcpRelayPrincipleType = ({ d_, plan }) => {
  console.log('[Suite8 Install Relay] Principle started · keyed SMRP + BOCR (Huirth)');

  // Per-designation helper instances are built on demand (the keyed relay config carries the
  // designation-bound action creators). Cache them so the broadcast/backfill arms reuse one instance
  // per designation (independent lastIdentity is irrelevant here — SMRP/BOCR never watch the disk).
  const relayCache = new Map<string, ReturnType<typeof createStcpComponentRelay<InstallRequirementsPayload>>>();
  const relayFor = (designation: string) => {
    let r = relayCache.get(designation);
    if (!r) {
      r = createStcpComponentRelay<InstallRequirementsPayload>(createSuite8InstallRequirementsRelayConfig(designation));
      relayCache.set(designation, r);
    }
    return r;
  };

  // SMRP diff snapshot — last broadcast CONTENT identity per designation (the in-place-edit suppression:
  // an honest present:false → present:true (or a requirements change) yields a new identity and re-broadcasts).
  const lastBroadcastIdentity = new Map<string, string>();
  // BOCR closure var — last observed WebSocket pool count (mirrors the menu precedent).
  let lastKnownCount = 0;

  const relayPlan = plan('Suite8 Install Requirements STCP Relay (keyed SMRP + BOCR · Huirth)', ({ stage }) => [
    // SMRP — selector-reactive on suite8.k.installRequirementsMap (whole Record) → diff → broadcast changed.
    stage(
      ({ d, dispatch }) => {
        const record = d.suite8.k.installRequirementsMap.select() as Record<string, InstallRequirementsPayload>;
        const broadcast: StcpBroadcastFn = (payload) =>
          dispatch(
            d.webSocketServer.e.webSocketServerAppendToActionQue(
              payload as { actionQue: AnyAction[]; targetConnectionId?: string },
            ),
            // DTBP · { throttle: 0 } — selector-persistent low-beat plan must re-fire on every
            // installRequirementsMap change. Citation: feedback_stratimux_dispatch_throttle_discipline.md.
            { throttle: 0 },
          );
        for (const [designation, payload] of Object.entries(record)) {
          if (!payload) continue; // defensive — a keyed slot must never be nullish (KeyedSelector).
          const contentIdentity = installRequirementsContentIdentity(designation, payload);
          if (lastBroadcastIdentity.get(designation) === contentIdentity) {
            continue; // unchanged CONTENT for this designation — suppress (hash, not bare present bit).
          }
          lastBroadcastIdentity.set(designation, contentIdentity);
          relayFor(designation).broadcastToAll(broadcast, payload);
          console.log(
            '[Suite8 Install Relay] SMRP · broadcast', designation, '· present=', payload.present,
          );
        }
      },
      {
        selectors: [d_.suite8.k.installRequirementsMap],
        beat: 1,
      },
    ),

    // BOCR — selector-reactive on webSocketClients pool count INCREASE → targeted backfill of EVERY
    // designation snapshot to each newly-joined connectionId.
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

        const record = d.suite8.k.installRequirementsMap.select() as Record<string, InstallRequirementsPayload>;
        const broadcast: StcpBroadcastFn = (payload) =>
          dispatch(
            d.webSocketServer.e.webSocketServerAppendToActionQue(
              payload as { actionQue: AnyAction[]; targetConnectionId?: string },
            ),
            {},
          );
        for (const [designation, payload] of Object.entries(record)) {
          if (!payload) continue; // defensive.
          relayFor(designation).backfillToClients(broadcast, payload, newIds);
        }
        console.log(
          '[Suite8 Install Relay] BOCR · backfilled', newIds.length, 'client(s) ·',
          Object.keys(record).length, 'designation(s)',
        );
      },
      {
        selectors: [d_.webSocketServer.k.webSocketClients],
        beat: 1,
      },
    ),
  ]);

  return () => {
    console.log('[Suite8 Install Relay] Principle cleanup');
    relayPlan.conclude();
  };
};
