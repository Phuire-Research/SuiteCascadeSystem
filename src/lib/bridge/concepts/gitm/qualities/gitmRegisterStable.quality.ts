/**
 * gitmRegisterStable Quality · GITM A↔B (#641) · pure state annotation (no git exec)
 *
 * Marks the CURRENT branch as the stable A. Runs AFTER the user has committed via
 * gitmStageAllAndCommit — this quality only reads deck.gitm.k.currentBranch and stores
 * it as stableBranch, returning abMode to 'idle' (the A is the registered baseline). No
 * git command is invoked; no guard needed (read-only state annotation).
 *
 * The reducer also reads from the bucket for lastActionResult consistency so the UI tail
 * surfaces the registration as a normal action outcome.
 *
 * Template: gitmBranchCreate.quality.ts (bucket discipline) · the no-exec annotation is novel.
 * Citation: GITM-AB-S3-YELLOW-BLUEPRINT.md §W1c Quality 1.
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
import type { GitmRegisterStable, GitmRegisterStablePayload, GitmActionResult } from './types';
import { gitmExec } from '../model/gitmExec.model';
import { resolveGitmTargetCwd, selectGitmDecisionFields } from '../model/gitmOpCwd.model';
import { resolveStableRoot, mintWorkingBranchName } from '../model/gitmBranchRoot.model';

export type { GitmRegisterStable };

interface RegisterStableBucketItem {
  result: GitmActionResult;
  branch: string;
  workingBranch: string; // BSEED (#641-R) — the auto-forked B branch name (empty on fork-fail)
  advance: boolean; // BSEED auto-advance to candidate-created when the fork succeeded
}

const bucket: RegisterStableBucketItem[] = [];

type GitmSelfDeck = {
  gitm: Concept<GitmState, Record<string, unknown>>;
};

export const gitmRegisterStable = createQualityCardWithPayload<
  GitmState,
  GitmRegisterStablePayload,
  GitmSelfDeck
>({
  type: 'Gitm Register Stable',
  reducer: (state) => {
    const item = bucket.pop();
    if (!item) {
      return {};
    }
    // C648 · guard rounds write ONLY the result — never a phantom anor blank registration.
    if (item.result.guardFired) {
      return { lastActionResult: item.result };
    }
    // BSEED (#641-R) — on fork-fail stay 'idle' with stableBranch still set (S1 DELTA 1:
    // A registration succeeds even if the B fork fails; the user can retry).
    if (!item.advance) {
      // D-BN · branchRoles LOCKSTEP — A registered (roles.a), the B fork failed so roles.b unassigned.
      return {
        stableBranch: item.branch,
        branchRoles: { a: item.branch, b: '' },
        abMode: 'idle' as GitmABMode,
        lastActionResult: item.result,
      };
    }
    // D-BN · branchRoles LOCKSTEP — A registered + B minted (a=stable, b=working).
    return {
      stableBranch: item.branch,
      workingBranch: item.workingBranch,
      branchRoles: { a: item.branch, b: item.workingBranch },
      abMode: 'candidate-created' as GitmABMode, // BSEED auto-advance — skips manual create
      lastActionResult: item.result,
    };
  },
  methodCreator: () =>
    createMethodWithConcepts(({ action, deck }) => {
      // C648 · THE SELECTION-VERBATIM LAW (user): the A branch is SELECTED, never transformed —
      // an explicit payload branch registers VERBATIM; ONLY the legacy no-payload path derives
      // from the seat via resolveStableRoot (BASEANCHOR — the b/b/ compounding guard). BOTH
      // paths pass the existence gate (the C634 law at the register door — the field round
      // registered the phantom "Working-ReFreshed" strip of the seat and minted a sword from it).
      const payload = selectPayload<GitmRegisterStablePayload>(action);
      const userCwd = resolveGitmTargetCwd(deck, payload.originScpName); // MULTI-SCP GITM MUXIFICATION (MC-W1)
      const picked = (payload.branch ?? '').trim();
      const seat = deck.gitm.k.currentBranch.select();
      const target = picked.length > 0 ? picked : resolveStableRoot(seat);
      const targetExists =
        target.length > 0 &&
        gitmExec(['rev-parse', '--verify', '--quiet', `refs/heads/${target}`], userCwd).ok;
      if (!targetExists) {
        const guard: GitmActionResult = {
          action: 'gitmRegisterStable',
          ok: false,
          error: '',
          guardFired: true,
          reason: picked.length > 0 ? 'register-branch-not-found' : 'register-root-phantom',
          at: Date.now(),
        };
        bucket.push({ result: guard, branch: '', workingBranch: '', advance: false });
        return action.strategy
          ? strategySuccess(action.strategy, strategyData_muxifyData(action.strategy, { ...guard }))
          : muxiumConclude();
      }

      // BSEED (#641-R) — mint the B ONLY when none exists (C648: re-registering A with a live B
      // KEEPS that B — the mint-per-register sword pollution ends here).
      const existingB = selectGitmDecisionFields(deck, userCwd).workingBranch;
      let workingBranch = existingB;
      let forkOk = true;
      if (existingB.length === 0) {
        workingBranch = mintWorkingBranchName(target);
        const fork = gitmExec(['branch', workingBranch], userCwd); // create, no switch
        forkOk = fork.ok;
        if (!forkOk) {
          workingBranch = '';
        }
      }

      const result: GitmActionResult = {
        action: 'gitmRegisterStable',
        ok: forkOk,
        error: forkOk ? '' : 'bseed-fork-failed',
        guardFired: false,
        reason: '',
        at: Date.now(),
      };
      bucket.push({ result, branch: target, workingBranch, advance: forkOk && workingBranch.length > 0 });
      return action.strategy
        ? strategySuccess(
            action.strategy,
            strategyData_muxifyData(action.strategy, {
              ...result,
              stableBranch: target,
              workingBranch,
            }),
          )
        : muxiumConclude();
    }),
});
