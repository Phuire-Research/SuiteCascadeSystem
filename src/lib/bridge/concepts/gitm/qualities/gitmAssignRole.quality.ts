/**
 * gitmAssignRole Quality · D2 M9 W1a · THE EXPLICIT ROLE ASSIGNMENT (the Tactical Bridge)
 *
 * THE USER LAW (C596): ANY branch can be A anor B — the `b/` prefix is the AUTO-MINT lineage
 * convention, NEVER role semantics (compounding is legal doctrine · mintWorkingBranchName).
 * This quality assigns "THIS branch IS A" anor "THIS branch IS B" EXPLICITLY, decoupled from
 * the checkout — no turn-over machinery, no switch, no mint. The C366 re-pair respects the
 * assignment (rolesAssigned → equality decisions, prefix inference suppressed).
 *
 * GUARDS (the C595 danger map):
 *   1. EXISTENCE (the C592 law: coherence ≠ existence) — the branch must exist in the ORIGIN's
 *      live branches (slice-first: a non-pointer origin's list, never the pointer's). NO
 *      resolveStableRoot rewrite — an explicit pick is assigned VERBATIM (the user law).
 *   2. ROLE COLLISION — assigning A to the current roles.b (anor B to roles.a) is contradictory;
 *      re-assign the other seat first (guardFired names it).
 *   3. THE FOREIGN-SWORD SEAT (role B only) — assigning B while SEATED on a different b/-lineage
 *      branch would be re-adopted by the D-BN-4 sword adoption on the next STARC tick (the seat
 *      wins the auto-heal). Guard with the reason so the user switches seats first.
 *
 * WRITES (the C595 safe insertion shape): the atomic triple {stableBranch, workingBranch,
 * branchRoles} + abMode, mirrored onto the ORIGIN's slice, flat write behind the
 * materialized-view gate. roles.a === stableBranch always (the M6 coherence contract).
 *
 * Template: gitmSelectBranch.quality.ts (bucket + routes) · gitmTurnOverWithSource (the M8
 *   origin-pair threading · the MC-W2 slice mirror · the view gate).
 * Citation: DIAMOND-TWO-SCP-OPERATIONS.md §D2 BLUEPRINT · ONYX C595 (the writer/danger tables).
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
import type { GitmAssignRolePayload, GitmAssignRole, GitmActionResult } from './types';
import { resolveGitmTargetCwd, selectGitmDecisionFields } from '../model/gitmOpCwd.model';
import { getSlice, upsertSliceFields } from '../model/gitmSliceStore.model';
import { isWorkingBranch } from '../model/gitmBranchRoot.model';
import { log } from '../../../debugLog';

export type { GitmAssignRole };

interface AssignRoleBucketItem {
  result: GitmActionResult;
  assign: boolean; // true → the triple below lands (guard routes carry false)
  stableBranch: string;
  workingBranch: string;
  branchRoles: { a: string; b: string };
  abMode: GitmABMode;
  resolvedCwd: string;
  activeScpDir: string;
}

const bucket: AssignRoleBucketItem[] = [];

type GitmSelfDeck = {
  gitm: Concept<GitmState, Record<string, unknown>>;
};

export const gitmAssignRole = createQualityCardWithPayload<
  GitmState,
  GitmAssignRolePayload,
  GitmSelfDeck
>({
  type: 'Gitm Assign Role',
  reducer: (state) => {
    const item = bucket.pop();
    if (!item) {
      return {};
    }
    if (!item.assign) {
      return { lastActionResult: item.result };
    }
    // THE SLICE MIRROR (MC-W2 · unconditional) — the ORIGIN's rail carries the assignment.
    if (item.resolvedCwd !== '') {
      upsertSliceFields(item.resolvedCwd, {
        stableBranch: item.stableBranch,
        workingBranch: item.workingBranch,
        branchRoles: item.branchRoles,
        abMode: item.abMode,
      });
    }
    // THE MATERIALIZED-VIEW GATE — the flat view belongs to the pointer only.
    const isActiveView =
      item.activeScpDir === '' || item.resolvedCwd === item.activeScpDir || item.resolvedCwd === '';
    if (!isActiveView) {
      return { lastActionResult: item.result };
    }
    return {
      stableBranch: item.stableBranch,
      workingBranch: item.workingBranch,
      branchRoles: item.branchRoles,
      abMode: item.abMode,
      lastActionResult: item.result,
    };
  },
  methodCreator: () =>
    createMethodWithConcepts(({ action, deck }) => {
      const { role, branch, originScpName } = selectPayload<GitmAssignRolePayload>(action);
      const opCwd = resolveGitmTargetCwd(deck, originScpName);
      const decision = selectGitmDecisionFields(deck, opCwd);
      const activeScpDir = deck.gitm.k.activeScpDir.select();
      // Slice-first branches (the ORIGIN's roster — the pointer's list would lie for a
      // non-pointer origin; the C592 existence law demands the origin's own truth).
      const originSlice =
        opCwd !== '' && opCwd !== activeScpDir ? getSlice(opCwd) : undefined;
      const branches = originSlice?.branches ?? deck.gitm.k.branches.select();

      const guardOut = (reason: string): ReturnType<typeof muxiumConclude> => {
        const guard: GitmActionResult = {
          action: 'gitmAssignRole',
          ok: false,
          error: '',
          guardFired: true,
          reason,
          at: Date.now(),
        };
        log('gitm.assignrole.guard', { role, branch, reason });
        bucket.push({
          result: guard,
          assign: false,
          stableBranch: '',
          workingBranch: '',
          branchRoles: { a: '', b: '' },
          abMode: 'idle',
          resolvedCwd: opCwd,
          activeScpDir,
        });
        return action.strategy
          ? strategySuccess(action.strategy, strategyData_muxifyData(action.strategy, { ...guard }))
          : muxiumConclude();
      };

      const name = branch.trim();
      if (name.length === 0) return guardOut('assign-branch-empty');
      // GUARD 1 · EXISTENCE — verbatim (no resolveStableRoot rewrite of an explicit pick).
      if (!branches.includes(name)) return guardOut('assign-branch-not-found');

      if (role === 'A') {
        // GUARD 2 · ROLE COLLISION — the working B cannot simultaneously be A.
        if (name === decision.branchRoles.b && name.length > 0 && decision.branchRoles.b.length > 0) {
          return guardOut('branch-is-working-b');
        }
        const workingBranch = decision.workingBranch;
        const triple = {
          stableBranch: name,
          workingBranch,
          branchRoles: { a: name, b: workingBranch },
          abMode: (workingBranch !== '' ? 'candidate-created' : 'idle') as GitmABMode,
        };
        const result: GitmActionResult = {
          action: 'gitmAssignRole',
          ok: true,
          error: '',
          guardFired: false,
          reason: '',
          at: Date.now(),
        };
        log('gitm.assignrole.assigned', { role, branch: name, ...triple.branchRoles });
        bucket.push({ result, assign: true, ...triple, resolvedCwd: opCwd, activeScpDir });
        return action.strategy
          ? strategySuccess(action.strategy, strategyData_muxifyData(action.strategy, { ...result, role, branch: name }))
          : muxiumConclude();
      }

      // role === 'B'
      // GUARD 2 · ROLE COLLISION — the stable A cannot simultaneously be B.
      if (name === decision.stableBranch && decision.stableBranch.length > 0) {
        return guardOut('branch-is-stable-a');
      }
      // GUARD 3 · THE FOREIGN-SWORD SEAT — the D-BN-4 adoption would re-take roles.b for the
      // seat on the next STARC tick; the user switches seats first (never a silent fight).
      const seat = decision.currentBranch;
      if (isWorkingBranch(seat) && seat !== name && seat !== decision.stableBranch) {
        return guardOut('assign-b-while-seated-on-foreign-sword');
      }
      const stableBranch = decision.stableBranch;
      const triple = {
        stableBranch,
        workingBranch: name,
        branchRoles: { a: stableBranch, b: name },
        abMode: 'candidate-created' as GitmABMode,
      };
      const result: GitmActionResult = {
        action: 'gitmAssignRole',
        ok: true,
        error: '',
        guardFired: false,
        reason: '',
        at: Date.now(),
      };
      log('gitm.assignrole.assigned', { role, branch: name, ...triple.branchRoles });
      bucket.push({ result, assign: true, ...triple, resolvedCwd: opCwd, activeScpDir });
      return action.strategy
        ? strategySuccess(action.strategy, strategyData_muxifyData(action.strategy, { ...result, role, branch: name }))
        : muxiumConclude();
    }),
});
