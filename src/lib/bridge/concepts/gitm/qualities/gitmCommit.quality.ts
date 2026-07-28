/**
 * gitmCommit Quality · GITM D3 (#634) · T2 guarded · git commit -m <message>
 *
 * GUARD (nothing-staged): the Method reads deck.gitm.k.stagedFiles BEFORE exec.
 * If stagedFiles.length === 0 → guardFired { reason: 'nothing-staged' }; git is
 * NEVER invoked. Otherwise runs gitmExec(['commit', '-m', message]). WATCHDIAL
 * fires on .git/index + HEAD + refs → STARC refresh follows. Reducer partial-
 * return { lastActionResult } only.
 *
 * Guard law: guards live in the Method (deck-selector access · pre-exec). On
 * guardFired, git is never run — the result surfaces via strategy.data + state.
 *
 * Template: gitmStageFile.quality.ts + gitmSetStatus.quality.ts (deck.k.select guard precedent)
 * Citation: GITM-D3-S3-YELLOW-BLUEPRINT.md §4 (commit · nothing-staged guard) + §4 Guard law
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
import type { GitmCommitPayload, GitmCommit, GitmActionResult } from './types';
import { gitmExec } from '../model/gitmExec.model';
import { resolveGitmTargetCwd } from '../model/gitmOpCwd.model';
import { readGitStatus, type GitmStatusResult } from '../model/gitmStatus.model';

export type { GitmCommit };

// FOLD C316 (the commit blind-spot) — the bucket carries an inline STARC refresh on success (the
// gitmCommitAmend:137 template). A commit mutates HEAD so the commit set + lastReadAt change; the
// inline readGitStatus keeps the result coherent without depending on a deferred WATCHDIAL fire.
interface CommitBucketItem {
  result: GitmActionResult;
  refresh: GitmStatusResult | null;
}

const bucket: CommitBucketItem[] = [];

type GitmSelfDeck = {
  gitm: Concept<GitmState, Record<string, unknown>>;
};

export const gitmCommit = createQualityCardWithPayload<
  GitmState,
  GitmCommitPayload,
  GitmSelfDeck
>({
  type: 'Gitm Commit',
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
      const { message } = selectPayload<GitmCommitPayload>(action);

      // GUARD (pre-exec · git never invoked when fired)
      const stagedFiles = deck.gitm.k.stagedFiles.select();
      if (stagedFiles.length === 0) {
        const guard: GitmActionResult = {
          action: 'gitmCommit',
          ok: false,
          error: '',
          guardFired: true,
          reason: 'nothing-staged',
          at: Date.now(),
        };
        bucket.push({ result: guard, refresh: null });
        return action.strategy
          ? strategySuccess(action.strategy, strategyData_muxifyData(action.strategy, { ...guard }))
          : muxiumConclude();
      }

      // MULTI-SCP GITM MUXIFICATION (MC-W1) — CALLING SCP's repo (origin-aware) · SCP-Sovereign fallback.
      const userCwd = resolveGitmTargetCwd(deck, selectPayload<GitmCommitPayload>(action).originScpName);
      const exec = gitmExec(['commit', '-m', message], userCwd);
      const result: GitmActionResult = {
        action: 'gitmCommit',
        ok: exec.ok,
        error: exec.ok ? '' : exec.error || exec.stderr,
        guardFired: false,
        reason: '',
        at: Date.now(),
      };
      // FOLD C316 — inline STARC refresh on success (the gitmCommitAmend:137 template).
      const refresh = exec.ok ? readGitStatus(userCwd) : null;
      bucket.push({ result, refresh });
      return action.strategy
        ? strategySuccess(action.strategy, strategyData_muxifyData(action.strategy, { ...result }))
        : muxiumConclude();
    }),
});
