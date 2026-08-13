/**
 * suite8SetInstallRequirements Quality — Local keyed Reducer (EF-5 · Install Circuit · relay reception)
 *
 * The install-requirements sibling of suite8SetDesignationMenuStage. Sets one designation's install-
 * requirements gate-file snapshot into the client `installRequirementsMap` Record. Keyed merge: the
 * install-watcher SMRP relay broadcasts this keyed action on every gate-file add/change/unlink; the
 * Suite8 Control's dual-write (fetchInstallRequirements) ALSO dispatches it directly. Partial reducer
 * return (only installRequirementsMap · Shortest Path Principle).
 *
 * Relay reception side: this quality's type ('Suite8 Set Install Requirements') is the SAME type the
 * install-watcher SMRP relay broadcasts via webSocketServerAppendToActionQue. When the Suite8 Control's
 * page muxium is mounted, the broadcast lands here and the installRequirementsMap[suite8Name] subscription
 * re-renders the install station (present ? requirements : null).
 *
 * TQNI byte-match anchor — 'Suite8 Set Install Requirements' MUST match exactly:
 *   (1) this quality `type` · (2) suite8.muxonomy.ts demometer `type` ·
 *   (3) suite8.muxonomy.ts actionExchange.serverToClient `actionType` (via S8_INSTALL_REQUIREMENTS_RELAY_TYPE) ·
 *   (4) the suite8SetInstallRequirements.actionCreator the install-watcher SMRP relay imports.
 *
 * Citation: suite8SetDesignationMenuStage.quality.client.ts (the keyed relay sibling · cloned).
 * Citation: PRE-EPOCH-S4-GREEN-EXAM.md SEAM 2 (the keyed Record relay law).
 * Citation: scpS8InstallCircuit.model.ts EF-5 (the install circuit · the gate-file feed).
 */
import { createQualityCardWithPayload, defaultMethodCreator } from 'stratimux';
import type { Suite8ClientState, Suite8SetInstallRequirementsPayload } from '../suite8.type';

export type { Suite8SetInstallRequirementsPayload };

export const suite8SetInstallRequirements = createQualityCardWithPayload<
  Suite8ClientState,
  Suite8SetInstallRequirementsPayload
>({
  // TQNI · = VERBOSE('SetInstallRequirements') · the keyed relay-reception type. MUST byte-match:
  // (1) this type · (2) suite8.muxonomy.ts demometer type · (3) actionExchange actionType
  // (S8_INSTALL_REQUIREMENTS_RELAY_TYPE) · (4) the suite8SetInstallRequirements.actionCreator the relay imports.
  type: 'Suite8 Set Install Requirements',
  reducer: (state, action) => {
    const { designation, payload } = action.payload;
    // SHORTEST PATH — keyed merge: return only the changed Record (spread the Record, not the state).
    return { installRequirementsMap: { ...state.installRequirementsMap, [designation]: payload } };
  },
  methodCreator: defaultMethodCreator,
});
