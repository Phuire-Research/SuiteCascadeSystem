/**
 * suiteCascadeSetCascadeSubscriptionTargetRelay Quality — Dual-Deployment (Huirth + Client) Reducer
 *
 * CMLS · SBIS Relay (Informative) companion to suiteCascadeSetCascadeSubscriptionTargetHuirthBase.
 *
 * Huirth: dispatched by the SyncLibrary edge handler alongside the Base action. On the Huirth
 *   side this reducer ALSO runs locally (harmless idempotent re-write) — but its PRIMARY purpose
 *   is to be intercepted by Path B actionExchange.serverToClient and routed to every Client.
 *
 * Client: receives the broadcast via actionExchange.serverToClient (Path B explicit broadcast ·
 *   mirrors suiteCascadeSetCascadeRelay). Lands the subscription target into the Client
 *   cascadeSubscriptionTargets Record for the C836 label + the flip-watch.
 *
 * The reducer state shape is `{ cascadeSubscriptionTargets: Record<string, CascadeSubscriptionTarget> }`
 * — shared by both deployments (Huirth + Client states are structurally identical). Shortest-path
 * return: spread the Record, never the whole state. `target: null` releases → Local (entry deleted).
 *
 * Type-string source of truth: the actionExchange declaration in suiteCascade.muxonomy.ts.
 * Must match EXACTLY ('Suite Cascade Set Cascade Subscription Target Relay').
 *
 * Citation: suiteCascadeSetCascadeRelay.quality.ts (dual-deployment relay bearing).
 * Citation: STRATIMUX-REFERENCE.md "🚀 Critical Reducer Performance Optimization".
 */
import { createQualityCardWithPayload, defaultMethodCreator } from 'stratimux';
import type {
  CascadeSubscriptionTarget,
  SuiteCascadeSetCascadeSubscriptionTargetPayload,
} from '../suiteCascade.type';
import { GENERAL_CASCADE_NAME } from '../suiteCascade.type';

export type { SuiteCascadeSetCascadeSubscriptionTargetPayload };

export const suiteCascadeSetCascadeSubscriptionTargetRelay = createQualityCardWithPayload<
  { cascadeSubscriptionTargets: Record<string, CascadeSubscriptionTarget> },
  SuiteCascadeSetCascadeSubscriptionTargetPayload
>({
  type: 'Suite Cascade Set Cascade Subscription Target Relay',
  reducer: (state, action) => {
    const { name, target } = action.payload;
    if (name === GENERAL_CASCADE_NAME) return {}; // General invariant — refuse, no notify.
    const held = state.cascadeSubscriptionTargets[name] ?? null;
    const same =
      (held === null && target === null) ||
      (held !== null && target !== null && held.absoluteDir === target.absoluteDir);
    if (same) return {}; // no change — no listeners notified.
    const cascadeSubscriptionTargets = { ...state.cascadeSubscriptionTargets };
    if (target === null) delete cascadeSubscriptionTargets[name];
    else cascadeSubscriptionTargets[name] = target;
    // SHORTEST PATH — spread the Record, never the whole state.
    return { cascadeSubscriptionTargets };
  },
  methodCreator: defaultMethodCreator,
});
