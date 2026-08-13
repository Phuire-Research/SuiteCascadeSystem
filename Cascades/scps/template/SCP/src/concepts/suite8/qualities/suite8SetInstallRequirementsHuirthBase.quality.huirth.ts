/**
 * suite8SetInstallRequirementsHuirthBase Quality — Huirth-side keyed Base Reducer (EF-5 · Install Circuit)
 *
 * The install-requirements sibling of suite8SetDesignationMenuStageHuirthBase. Writes one designation's
 * install-requirements payload into the suite8 Demometer's OWN Huirth (Base) `installRequirementsMap`
 * Record — the server source of truth the STCP SMRP/BOCR stack reads. Dispatched by the install-watcher's
 * SBIS path (Base FIRST, then the keyed relay 'Suite8 Set Install Requirements'). Keyed merge; partial
 * reducer return (only installRequirementsMap · Shortest Path Principle).
 *
 * ONE shared payload type (Suite8SetInstallRequirementsPayload · { designation, payload }) drives BOTH
 * this Base quality AND the client relay quality — the payload carries the wrapper { present, requirements }.
 *
 * TQNI byte-match anchor — the type string 'Suite8 Set Install Requirements Huirth Base' is DISTINCT
 * from the relay's 'Suite8 Set Install Requirements' and MUST be ABSENT from suite8.muxonomy.ts
 * actionExchange.serverToClient (Huirth-only · local reducer · the TQNI invariant).
 *
 * Citation: suite8SetDesignationMenuStageHuirthBase.quality.huirth.ts (the keyed Base sibling · cloned).
 * Citation: PRE-EPOCH-S4-GREEN-EXAM.md SEAM 2 (the keyed Record Base-maintenance law).
 * Citation: scpS8InstallCircuit.model.ts EF-5 (the install circuit · the gate-file feed).
 */
import { createQualityCardWithPayload, defaultMethodCreator } from 'stratimux';
import type { Suite8HuirthState, Suite8SetInstallRequirementsPayload } from '../suite8.type';

export type { Suite8SetInstallRequirementsPayload };

export const suite8SetInstallRequirementsHuirthBase = createQualityCardWithPayload<
  Suite8HuirthState,
  Suite8SetInstallRequirementsPayload
>({
  // TQNI · = VERBOSE('SetInstallRequirementsHuirthBase') · DISTINCT from the relay's
  // 'Suite8 Set Install Requirements'. MUST NOT appear in suite8.muxonomy.ts actionExchange
  // (Huirth-only · local reducer · the TQNI invariant).
  type: 'Suite8 Set Install Requirements Huirth Base',
  reducer: (state, action) => {
    const { designation, payload } = action.payload;
    // SHORTEST PATH — keyed merge: return only the changed Record (spread the Record, not the state).
    return { installRequirementsMap: { ...state.installRequirementsMap, [designation]: payload } };
  },
  methodCreator: defaultMethodCreator,
});
