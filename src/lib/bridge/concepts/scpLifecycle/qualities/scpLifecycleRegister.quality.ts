/**
 * scpLifecycleRegister · Phase B.3 · Cycle 131
 *
 * Reducer-only Quality. Admission of an SCP to the FSM. Dispatched from
 * scpRegistryWatcher.FsScpAdded.Method (form-α LOCK · R3 §1.1 · ADMC pattern).
 *
 * State transform (idempotent):
 *   - if fsmByScp.has(scpName) → no-op (already admitted)
 *   - else → lifecycleByScp.set(scpName, 'pending')
 *           fsmByScp.set(scpName, 'registered')
 *           lastTransitionAt.set(scpName, discoveredAt)
 *
 * Map-mutation pattern (Card 10 from B.2): NEW Map returned for each touched
 * field to ensure KeyedSelector change detection.
 *
 * Template: B.1 scpRegistryFsScpAdded.quality.ts (Reducer-only · partial-zero idempotency)
 *
 * Citation: M62 Sequential ActionStream Core · M63 Copy-Paste-Plus
 * Citation: SUITE-1-RED-B3-LIFECYCLE-CURATION.md §4 Card 13
 * Citation: SUITE-2-ORANGE-B3-LIFECYCLE-NAMING.md §3.1
 * Citation: SUITE-3-YELLOW-B3-LIFECYCLE-BLUEPRINT.md §3.2
 */

import { createQualityCardWithPayload, selectPayload } from 'stratimux';
import type { ScpLifecycleState } from '../scpLifecycle.type';
import type {
  ScpLifecycleRegisterPayload,
  ScpLifecycleRegister,
} from './types';

export type { ScpLifecycleRegister };

export const scpLifecycleRegister = createQualityCardWithPayload<
  ScpLifecycleState,
  ScpLifecycleRegisterPayload
>({
  type: 'Scp Lifecycle Register',
  reducer: (state, action) => {
    const { scpName, discoveredAt } = selectPayload<ScpLifecycleRegisterPayload>(action);

    if (state.fsmByScp.has(scpName)) {
      console.log('[Scp Lifecycle] Register: already admitted, skipping:', scpName);
      return {};
    }

    const newLifecycle = new Map(state.lifecycleByScp);
    newLifecycle.set(scpName, 'pending');

    const newFsm = new Map(state.fsmByScp);
    newFsm.set(scpName, 'registered');

    const newLastTransition = new Map(state.lastTransitionAt);
    newLastTransition.set(scpName, discoveredAt);

    console.log('[Scp Lifecycle] Register:', scpName);

    return {
      lifecycleByScp: newLifecycle,
      fsmByScp: newFsm,
      lastTransitionAt: newLastTransition,
    };
  },
});
