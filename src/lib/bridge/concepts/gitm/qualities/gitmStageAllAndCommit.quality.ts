/**
 * gitmStageAllAndCommit Quality · GITM A↔B (#641) · composite · git add -A + git commit -m
 *
 * The register-stable-A flow needs a single composite that stages the WHOLE working
 * tree then commits — git switch (create-B) GUARDSHUNTs on a dirty tree, so A must be
 * clean before B is created. Single synchronous method (no strategy interleaving):
 *   1. gitmExec(['add', '-A']) — stage all.
 *   2. Guard: step-1 failure → guardFired { reason: 'stage-all-failed' } → conclude.
 *   3. gitmExec(['commit', '-m', message]) — commit (a clean tree exits 'nothing to
 *      commit'; that surfaces as ok:false with the error text — the Stable-A button
 *      pre-checks dirty===false client-side and shows a message rather than dispatching).
 *
 * GUARDSHUNT note: this composite BYPASSES the gitmCommit 'nothing-staged' guard because
 * git add -A always stages something when the tree is dirty. The guard here is the
 * add-failure case (permissions, not a repo, etc.).
 *
 * Template: gitmCommit.quality.ts (bucket + createMethodWithConcepts discipline)
 * Citation: GITM-AB-S3-YELLOW-BLUEPRINT.md §W1b · GITM-AB-S4-GREEN-EXAM.md Seam 3a.
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
import type { GitmState } from '../gitm.types';
import type { GitmStageAllAndCommitPayload, GitmStageAllAndCommit, GitmActionResult } from './types';
import { gitmExec } from '../model/gitmExec.model';
import { log } from '../../../debugLog';
import { resolveGitmTargetCwd } from '../model/gitmOpCwd.model';
import { readGitStatus, type GitmStatusResult } from '../model/gitmStatus.model';

export type { GitmStageAllAndCommit };

// FOLD C316 (the commit blind-spot) — the bucket carries an inline STARC refresh on success (the
// gitmCommitAmend:137 template): the composite mutates HEAD + the whole tree, so the commit set +
// lastReadAt change; the inline readGitStatus keeps the result coherent without a deferred fire.
interface StageAllAndCommitBucketItem {
  result: GitmActionResult;
  refresh: GitmStatusResult | null;
}

const bucket: StageAllAndCommitBucketItem[] = [];

type GitmSelfDeck = {
  gitm: Concept<GitmState, Record<string, unknown>>;
};

export const gitmStageAllAndCommit = createQualityCardWithPayload<
  GitmState,
  GitmStageAllAndCommitPayload,
  GitmSelfDeck
>({
  type: 'Gitm Stage All And Commit',
  reducer: (state) => {
    const item = bucket.pop();
    if (!item) {
      return {};
    }
    if (item.refresh) {
      return {
        isRepo: item.refresh.isRepo,
        currentBranch: item.refresh.currentBranch,
        dirty: item.refresh.dirty,
        ahead: item.refresh.ahead,
        behind: item.refresh.behind,
        branches: item.refresh.branches,
        stagedFiles: item.refresh.stagedFiles,
        unstagedFiles: item.refresh.unstagedFiles,
        detachedHead: item.refresh.detachedHead,
        conflicts: item.refresh.conflicts,
        lastReadAt: item.refresh.lastReadAt,
        stashCount: item.refresh.stashCount,
        lastActionResult: item.result,
      };
    }
    return { lastActionResult: item.result };
  },
  methodCreator: () =>
    createMethodWithConcepts(({ action, deck }) => {
      const { message, originScpName } = selectPayload<GitmStageAllAndCommitPayload>(action);
      // MULTI-SCP GITM MUXIFICATION (MC-W1) — CALLING SCP's repo (origin-aware) · SCP-Sovereign fallback.
      const userCwd = resolveGitmTargetCwd(deck, originScpName);

      // 1. Stage all.
      const stage = gitmExec(['add', '-A'], userCwd);
      if (!stage.ok) {
        const guard: GitmActionResult = {
          action: 'gitmStageAllAndCommit',
          ok: false,
          error: stage.error || stage.stderr,
          guardFired: true,
          reason: 'stage-all-failed',
          at: Date.now(),
        };
        bucket.push({ result: guard, refresh: null });
        return action.strategy
          ? strategySuccess(action.strategy, strategyData_muxifyData(action.strategy, { ...guard }))
          : muxiumConclude();
      }

      // 2. Commit (a clean tree → 'nothing to commit' surfaces as ok:false here).
      const commit = gitmExec(['commit', '-m', message], userCwd);
      const result: GitmActionResult = {
        action: 'gitmStageAllAndCommit',
        ok: commit.ok,
        error: commit.ok ? '' : commit.error || commit.stderr,
        guardFired: false,
        reason: '',
        at: Date.now(),
      };
      // C284 (the silent-commit finding): surface the commit outcome to debug.json.
      log('gitm.stage-all-commit.result', { ok: result.ok, error: (result.error ?? '').slice(0, 160), cwd: userCwd });
      // FOLD C316 — inline STARC refresh on success (the gitmCommitAmend:137 template).
      const refresh = commit.ok ? readGitStatus(userCwd) : null;
      bucket.push({ result, refresh });
      return action.strategy
        ? strategySuccess(action.strategy, strategyData_muxifyData(action.strategy, { ...result }))
        : muxiumConclude();
    }),
});
