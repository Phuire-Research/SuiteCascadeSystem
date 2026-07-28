/**
 * gitmRenameBranch Quality · D2 M9 W1b · THE ROLE-FOLLOWING RENAME (the Tactical Bridge)
 *
 * THE USER LAW (C596): the user can RENAME a branch via GitM while the system MAINTAINS its
 * positioning — if the renamed branch is currently A anor B (anor the seat), every pointer
 * (stableBranch · workingBranch · branchRoles · currentBranch) follows the new name atomically.
 * `git branch -m` renames the checked-out branch in place (git keeps the checkout).
 *
 * GUARDS: source exists (the ORIGIN's roster · slice-first) · target name free · target
 * non-empty/no-whitespace (git validates the rest on exec — 'rename-failed' surfaces honestly).
 *
 * WRITES: only the pointers the rename actually touches (Shortest Path), mirrored onto the
 * ORIGIN's slice, flat behind the materialized-view gate. roles.a === stableBranch holds by
 * construction (both follow together anor neither).
 *
 * Template: gitmAssignRole.quality.ts (the W1a sibling · guards + mirror + gate) ·
 *   gitmBranchCreate.quality.ts (exec + STARC-adjacent refresh via the .git watcher).
 * Citation: DIAMOND-TWO-SCP-OPERATIONS.md §D2 BLUEPRINT (C596 recursion) · ONYX C595.
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
import type { GitmRenameBranchPayload, GitmRenameBranch, GitmActionResult } from './types';
import { resolveGitmTargetCwd, selectGitmDecisionFields } from '../model/gitmOpCwd.model';
import { getSlice, upsertSliceFields } from '../model/gitmSliceStore.model';
import { gitmExec } from '../model/gitmExec.model';
import { log } from '../../../debugLog';

export type { GitmRenameBranch };

interface RenameBranchBucketItem {
  result: GitmActionResult;
  // The role-follow partial — ONLY the pointers the rename touches (empty object = none did).
  follow: Partial<
    Pick<GitmState, 'stableBranch' | 'workingBranch' | 'branchRoles' | 'currentBranch'>
  >;
  resolvedCwd: string;
  activeScpDir: string;
}

const bucket: RenameBranchBucketItem[] = [];

type GitmSelfDeck = {
  gitm: Concept<GitmState, Record<string, unknown>>;
};

export const gitmRenameBranch = createQualityCardWithPayload<
  GitmState,
  GitmRenameBranchPayload,
  GitmSelfDeck
>({
  type: 'Gitm Rename Branch',
  reducer: (state) => {
    const item = bucket.pop();
    if (!item) {
      return {};
    }
    const hasFollow = Object.keys(item.follow).length > 0;
    // THE SLICE MIRROR (MC-W2) — the ORIGIN's rail carries the follow (roles included).
    if (hasFollow && item.resolvedCwd !== '') {
      upsertSliceFields(item.resolvedCwd, {
        ...(item.follow.stableBranch !== undefined ? { stableBranch: item.follow.stableBranch } : {}),
        ...(item.follow.workingBranch !== undefined ? { workingBranch: item.follow.workingBranch } : {}),
        ...(item.follow.branchRoles !== undefined ? { branchRoles: item.follow.branchRoles } : {}),
        ...(item.follow.currentBranch !== undefined ? { currentBranch: item.follow.currentBranch } : {}),
      });
    }
    // THE MATERIALIZED-VIEW GATE.
    const isActiveView =
      item.activeScpDir === '' || item.resolvedCwd === item.activeScpDir || item.resolvedCwd === '';
    if (!isActiveView || !hasFollow) {
      return { lastActionResult: item.result };
    }
    return { ...item.follow, lastActionResult: item.result };
  },
  methodCreator: () =>
    createMethodWithConcepts(({ action, deck }) => {
      const { branch, newName, originScpName } = selectPayload<GitmRenameBranchPayload>(action);
      const opCwd = resolveGitmTargetCwd(deck, originScpName);
      const decision = selectGitmDecisionFields(deck, opCwd);
      const activeScpDir = deck.gitm.k.activeScpDir.select();
      const originSlice =
        opCwd !== '' && opCwd !== activeScpDir ? getSlice(opCwd) : undefined;
      const branches = originSlice?.branches ?? deck.gitm.k.branches.select();

      const finish = (result: GitmActionResult, follow: RenameBranchBucketItem['follow']) => {
        bucket.push({ result, follow, resolvedCwd: opCwd, activeScpDir });
        return action.strategy
          ? strategySuccess(action.strategy, strategyData_muxifyData(action.strategy, { ...result, branch, newName }))
          : muxiumConclude();
      };
      const guardOut = (reason: string) => {
        log('gitm.renamebranch.guard', { branch, newName, reason });
        return finish(
          { action: 'gitmRenameBranch', ok: false, error: '', guardFired: true, reason, at: Date.now() },
          {},
        );
      };

      const src = branch.trim();
      const dst = newName.trim();
      if (src.length === 0 || dst.length === 0) return guardOut('rename-name-empty');
      if (/\s/.test(dst)) return guardOut('rename-name-whitespace');
      if (!branches.includes(src)) return guardOut('rename-source-not-found');
      if (branches.includes(dst)) return guardOut('rename-target-exists');

      const exec = gitmExec(['branch', '-m', src, dst], opCwd);
      if (!exec.ok) {
        return finish(
          {
            action: 'gitmRenameBranch',
            ok: false,
            error: exec.error || exec.stderr,
            guardFired: false,
            reason: 'rename-failed',
            at: Date.now(),
          },
          {},
        );
      }

      // THE ROLE FOLLOW — every pointer naming the old branch moves to the new name in lockstep.
      const follow: RenameBranchBucketItem['follow'] = {};
      const roles = decision.branchRoles;
      const rolesTouch = roles.a === src || roles.b === src;
      if (decision.stableBranch === src) follow.stableBranch = dst;
      if (decision.workingBranch === src) follow.workingBranch = dst;
      if (rolesTouch) {
        follow.branchRoles = {
          a: roles.a === src ? dst : roles.a,
          b: roles.b === src ? dst : roles.b,
        };
      }
      if (decision.currentBranch === src) follow.currentBranch = dst;

      const result: GitmActionResult = {
        action: 'gitmRenameBranch',
        ok: true,
        error: '',
        guardFired: false,
        reason: '',
        at: Date.now(),
      };
      log('gitm.renamebranch.renamed', {
        branch: src,
        newName: dst,
        followed: Object.keys(follow),
      });
      return finish(result, follow);
    }),
});
