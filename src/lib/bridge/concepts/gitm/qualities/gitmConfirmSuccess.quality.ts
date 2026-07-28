/**
 * gitmConfirmSuccess Quality · GITM A↔B (#641) · pure state annotation (no git exec)
 *
 * The user confirms B works after the turn-over booted it. Sets abMode='success' and
 * bMergeable=true (the Merge B→A button's enable gate). No git command is invoked — this
 * is a derived-signal annotation the user triggers explicitly from the client after
 * verifying B. lastTurnOverResult is also set to 'success' for UI consistency.
 *
 * Template: gitmRegisterStable.quality.ts (no-exec annotation discipline).
 * Citation: GITM-AB-S3-YELLOW-BLUEPRINT.md §W1d.
 */

import {
  createQualityCardWithPayload,
  createMethodWithConcepts,
  selectPayload,
  muxiumConclude,
  strategySuccess,
  strategyData_muxifyData,
  type Concept,
} from 'stratimux';
import type { GitmState, GitmABMode } from '../gitm.types';
import type { GitmConfirmSuccess, GitmConfirmSuccessPayload, GitmActionResult } from './types';
import { resolveGitmTargetCwd, selectGitmDecisionFields } from '../model/gitmOpCwd.model';
// MD-C M4 · THE POSITIVE SLICE-MIRROR — the origin's confirm-success lands on ITS OWN slice
// unconditionally (the C569 IE-merge defect: a non-pointer's bMergeable=true landed NOWHERE).
import { upsertSliceFields } from '../model/gitmSliceStore.model';

export type { GitmConfirmSuccess };

// MULTI-SCP GITM MUXIFICATION (MC-W3) — the bucket carries the RESOLVED cwd + the ACTIVE pointer dir so
// the reducer can gate the OUTCOME write (abMode 'success' · bMergeable). A NON-pointer origin's confirm
// must NOT flip the pointer's merge-enable gate. MD-C M5 · THE ORIGIN-THREADED CONFIRM: the payload now
// carries originScpName (the M3 deferral resolved) — the boot-report proof stamps the booted SCP's name,
// so a non-pointer origin's confirm resolves to ITS repo and the M4 slice-mirror lands on ITS rail.
interface ConfirmSuccessBucketItem {
  result: GitmActionResult;
  resolvedCwd: string;
  activeScpDir: string;
}

const bucket: ConfirmSuccessBucketItem[] = [];

type GitmSelfDeck = {
  gitm: Concept<GitmState, Record<string, unknown>>;
};

export const gitmConfirmSuccess = createQualityCardWithPayload<
  GitmState,
  GitmConfirmSuccessPayload,
  GitmSelfDeck
>({
  type: 'Gitm Confirm Success',
  reducer: (state) => {
    const item = bucket.pop();
    if (!item) {
      return {};
    }
    const result = item.result;
    // MERGEGATE (#641-R · LOCKED Q3): if B has uncommitted changes, the guard fired in the
    // method — bMergeable stays false (B must be clean before the merge is enabled).
    if (result.guardFired) {
      return { lastActionResult: result };
    }
    // MD-C M4 · THE POSITIVE SLICE-MIRROR (the C569 close — the M3 deferral resolved): the
    // origin's success lands on ITS OWN slice UNCONDITIONALLY, so a non-pointer confirm flips
    // bMergeable=true on its own rail (GITEP's buildSnapshotFromSlice relays it on the next
    // fire) and the Merge button arms for THAT SCP. The flat write below stays gated — the
    // materialized-view law holds: the flat view belongs to the pointer only.
    if (item.resolvedCwd !== '') {
      upsertSliceFields(item.resolvedCwd, {
        abMode: 'success' as GitmABMode,
        bMergeable: true,
        lastTurnOverResult: 'success',
      });
    }
    // MULTI-SCP GITM MUXIFICATION (MC-W3 · THE MATERIALIZED-VIEW GATE) — the flat view belongs to the
    // POINTER only. A NON-pointer (env-)origin's confirm must NOT flip the pointer's merge-enable gate
    // (abMode 'success' · bMergeable) with the origin's outcome; surface only the action result.
    const isActiveView =
      item.activeScpDir === '' || item.resolvedCwd === item.activeScpDir || item.resolvedCwd === '';
    if (!isActiveView) {
      return { lastActionResult: result };
    }
    return {
      abMode: 'success' as GitmABMode,
      bMergeable: true,
      lastTurnOverResult: 'success',
      lastActionResult: result,
    };
  },
  methodCreator: () =>
    createMethodWithConcepts(({ action, deck }) => {
      // MULTI-SCP GITM MUXIFICATION (MC-W3 · THE SLICE-FIRST DECISION READ) — the changesPrimedOnB gate
      // is a genuine per-repo decision read. Resolve the ORIGIN cwd (M5: payload-first — the boot-report
      // proof stamps the booted SCP's name) + read changesPrimedOnB from that repo's slice rather than
      // the flat pointer view, so the confirm gates on the ORIGIN's B dirty-count.
      const { originScpName } = selectPayload<GitmConfirmSuccessPayload>(action);
      const opCwd = resolveGitmTargetCwd(deck, originScpName);
      const decision = selectGitmDecisionFields(deck, opCwd);
      const activeScpDir = deck.gitm.k.activeScpDir.select();
      // MERGEGATE (#641-R · LOCKED Q3): only confirm-success (bMergeable) when B's live
      // CHANGEDIAL count is 0 — the user cannot merge a dirty B.
      const changesPrimedOnB = decision.changesPrimedOnB;
      const ok = changesPrimedOnB === 0;
      const result: GitmActionResult = {
        action: 'gitmConfirmSuccess',
        ok,
        error: '',
        guardFired: !ok,
        reason: ok ? '' : 'b-has-uncommitted-changes',
        at: Date.now(),
      };
      bucket.push({ result, resolvedCwd: opCwd, activeScpDir });
      return action.strategy
        ? strategySuccess(action.strategy, strategyData_muxifyData(action.strategy, { ...result }))
        : muxiumConclude();
    }),
});
