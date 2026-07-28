/**
 * gitmCreateWorking Quality · GITM A↔B (#641) · git branch <B> + git switch <B>
 *
 * Creates the candidate B branch from A and switches onto it. Auto-names the CANONICAL Sword
 * `b/<resolveStableRoot(stableBranch)>-<Date.now()>` inside the method (BASEANCHOR · single-level
 * `b/` · RE-PAIR-visible · unique · sortable — the same shape autoInductAB mints). Single
 * synchronous method:
 *   1. GUARDSHUNT: dirty===true → guardFired { reason: 'dirty-tree' }. The user must
 *      commit first (gitmStageAllAndCommit + gitmRegisterStable) before creating B.
 *   2. GUARDSHUNT: stableBranch empty → guardFired { reason: 'no-stable-registered' }.
 *   3. gitmExec(['branch', branchName]) — create B from A (no switch yet).
 *   4. gitmExec(['switch', branchName]) — switch to B (create THEN switch · the order is
 *      LAW · the switch GUARDSHUNT in gitmBranchSwitch does not fire here because the tree
 *      is clean after the A commit).
 *
 * Template: gitmBranchSwitch.quality.ts (GUARDSHUNT) · gitmBranchCreate.quality.ts (create).
 * Citation: GITM-AB-S3-YELLOW-BLUEPRINT.md §W1c Quality 2 · GITM-AB-S4-GREEN-EXAM.md Seam 3b.
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
import type { GitmCreateWorking, GitmCreateWorkingPayload, GitmActionResult } from './types';
import { gitmExec } from '../model/gitmExec.model';
import { resolveGitmTargetCwd } from '../model/gitmOpCwd.model';
import { mintWorkingBranchName } from '../model/gitmBranchRoot.model';

export type { GitmCreateWorking };

interface CreateWorkingBucketItem {
  result: GitmActionResult;
  branchName: string;
  advance: boolean; // true only when the create+switch fully succeeded
}

const bucket: CreateWorkingBucketItem[] = [];

type GitmSelfDeck = {
  gitm: Concept<GitmState, Record<string, unknown>>;
};

export const gitmCreateWorking = createQualityCardWithPayload<
  GitmState,
  Record<string, never>,
  GitmSelfDeck
>({
  type: 'Gitm Create Working',
  reducer: (state) => {
    const item = bucket.pop();
    if (!item) {
      return {};
    }
    if (!item.advance) {
      return { lastActionResult: item.result };
    }
    // D-BN · branchRoles LOCKSTEP — the freshly-minted B becomes roles.b (a=stable preserved).
    return {
      workingBranch: item.branchName,
      branchRoles: { a: state.stableBranch, b: item.branchName },
      abMode: 'candidate-created' as GitmABMode,
      lastActionResult: item.result,
    };
  },
  methodCreator: () =>
    createMethodWithConcepts(({ action, deck }) => {
      // MULTI-SCP GITM MUXIFICATION (MC-W1) — CALLING SCP's repo (origin-aware) · SCP-Sovereign fallback.
      const userCwd = resolveGitmTargetCwd(deck, selectPayload<GitmCreateWorkingPayload>(action).originScpName);

      // GUARDSHUNT 1 — dirty tree (must commit A first).
      const dirty = deck.gitm.k.dirty.select();
      if (dirty === true) {
        const guard: GitmActionResult = {
          action: 'gitmCreateWorking',
          ok: false,
          error: '',
          guardFired: true,
          reason: 'dirty-tree',
          at: Date.now(),
        };
        bucket.push({ result: guard, branchName: '', advance: false });
        return action.strategy
          ? strategySuccess(
              action.strategy,
              strategyData_muxifyData(action.strategy, { ...guard, recommendation: 'commit-stable-a' }),
            )
          : muxiumConclude();
      }

      // GUARDSHUNT 2 — no stable A registered.
      const stableBranch = deck.gitm.k.stableBranch.select();
      if (stableBranch.length === 0) {
        const guard: GitmActionResult = {
          action: 'gitmCreateWorking',
          ok: false,
          error: '',
          guardFired: true,
          reason: 'no-stable-registered',
          at: Date.now(),
        };
        bucket.push({ result: guard, branchName: '', advance: false });
        return action.strategy
          ? strategySuccess(action.strategy, strategyData_muxifyData(action.strategy, { ...guard }))
          : muxiumConclude();
      }

      // D-BN · THE branchRoles SWEEP · THE CANONICAL MINT — the working namespace is `b/<A>-<uuid>`
      // anchored to the A name (stableBranch) VERBATIM. NO resolveStableRoot: the `b/` prefix is pure
      // LINEAGE NAMING (an A that is itself a `b/` branch legally mints a `b/b/…-uuid` child — a
      // compounding lineage that merges back into A as origin), and roles.b (set in the reducer) is the
      // role truth, never the prefix. UUID replaces Date.now() (unique · collision-free · not ts-ordered).
      const branchName = mintWorkingBranchName(stableBranch);

      // 3. Create B from A (no switch yet).
      const create = gitmExec(['branch', branchName], userCwd);
      if (!create.ok) {
        const result: GitmActionResult = {
          action: 'gitmCreateWorking',
          ok: false,
          error: create.error || create.stderr,
          guardFired: false,
          reason: 'branch-create-failed',
          at: Date.now(),
        };
        bucket.push({ result, branchName: '', advance: false });
        return action.strategy
          ? strategySuccess(action.strategy, strategyData_muxifyData(action.strategy, { ...result }))
          : muxiumConclude();
      }

      // 4. Switch to B (create THEN switch — the order is LAW).
      const switchExec = gitmExec(['switch', branchName], userCwd);
      const result: GitmActionResult = {
        action: 'gitmCreateWorking',
        ok: switchExec.ok,
        error: switchExec.ok ? '' : switchExec.error || switchExec.stderr,
        guardFired: false,
        reason: switchExec.ok ? '' : 'branch-switch-failed',
        at: Date.now(),
      };
      bucket.push({ result, branchName, advance: switchExec.ok });
      return action.strategy
        ? strategySuccess(
            action.strategy,
            strategyData_muxifyData(action.strategy, { ...result, branchName }),
          )
        : muxiumConclude();
    }),
});
