/**
 * suiteCascadeSetCascadeSubscriptionTargetHuirthBase Quality — Huirth-Only Base State Maintenance
 *
 * CMLS · SBIS Base (Stratidian-Base-Informative-State) · the subscription-target setter.
 *
 * Base = Huirth state (server source of truth). The SyncLibrary edge handler (the
 * armLocalitySignalWatch leg of the watcher principle) dispatches THIS action FIRST (before
 * the Relay) so the server-side cascadeSubscriptionTargets Record is real — the CSS sweep's
 * [k_.cascadeSubscriptionTargets] selector then fires and re-points the subscription.
 *
 * The reducer refuses the General invariant (no subscription on GRID), no-ops when the target
 * is unchanged (no listeners notified), and returns ONLY the changed Record (shortest path).
 * `target: null` releases → Local (the entry is deleted).
 *
 * INVARIANT: this action type MUST NOT appear in actionExchange.serverToClient and MUST NOT be
 *   registered in the client concept face. It IS registered in suiteCascade.concept.huirth.ts only.
 *
 * Citation: suiteCascadeSetCascadeHuirthBase.quality.huirth.ts (SBIS Base bearing).
 * Citation: STRATIMUX-REFERENCE.md "🚀 Critical Reducer Performance Optimization" (partial returns).
 * Citation: STRATIMUX-REFERENCE.md "🧠 Strategic State Management" (no optional state — KeyedSelector).
 */
import { createQualityCardWithPayload, defaultMethodCreator } from 'stratimux';
import type {
  SuiteCascadeHuirthState,
  SuiteCascadeSetCascadeSubscriptionTargetPayload,
} from '../suiteCascade.type';
import { GENERAL_CASCADE_NAME } from '../suiteCascade.type';

export type { SuiteCascadeSetCascadeSubscriptionTargetPayload };

export const suiteCascadeSetCascadeSubscriptionTargetHuirthBase = createQualityCardWithPayload<
  SuiteCascadeHuirthState,
  SuiteCascadeSetCascadeSubscriptionTargetPayload
>({
  type: 'Suite Cascade Set Cascade Subscription Target Huirth Base',
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
    // SHORTEST PATH — return ONLY the changed Record.
    return { cascadeSubscriptionTargets };
  },
  methodCreator: defaultMethodCreator,
});
