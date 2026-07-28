/**
 * gitmDiscard Quality · GITM D3 (#634) · T2 DESTRUCTIVE · confirm gate + STARC re-read
 *
 * CONFIRM GATE (hard): the Method requires payload.confirmed === true. A dispatch
 * with confirmed !== true → guardFired { reason: 'destructive-confirm-required' };
 * git is NEVER invoked. The caller passes confirmed:true only after explicit user
 * acknowledgment.
 *
 * Discard mechanism: tracked path (in stagedFiles/unstagedFiles per STARC) →
 * git restore <path>; otherwise (untracked) → git clean -f <path>. `git clean -f`
 * does NOT touch .git/index → WATCHDIAL would NOT fire for the untracked case.
 *
 * EXPLICIT STARC RE-READ (the blueprint's intent): a quality Method returns ONE
 * action and CANNOT capture nextA (MethodWithConceptsParams exposes no nextA —
 * see scpRegistryDirectoryWatcherArm.quality.ts:11-12). The STARC refresh is
 * therefore performed INLINE: readGitStatus(userCwd) runs in the same Method and
 * its fields land alongside lastActionResult in ONE partial reducer return. Same
 * state outcome as a deferred nextA(gitmSetStatus), single-action-legal.
 *
 * Template: gitmCommit.quality.ts (guard) · gitmSetStatus.quality.ts (readGitStatus + STARC fields)
 * Citation: GITM-D3-S3-YELLOW-BLUEPRINT.md §4 (discard · confirm gate + explicit re-read)
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
import type { GitmDiscardPayload, GitmDiscard, GitmActionResult } from './types';
import { gitmExec } from '../model/gitmExec.model';
import { resolveGitmTargetCwd } from '../model/gitmOpCwd.model';
import { readGitStatus, type GitmStatusResult } from '../model/gitmStatus.model';
import { computeDiscardPreview } from '../model/gitmDestructivePreview.model';

export type { GitmDiscard };

interface DiscardBucketItem {
  result: GitmActionResult;
  refresh: GitmStatusResult | null; // present only after a successful discard
}

const bucket: DiscardBucketItem[] = [];

type GitmSelfDeck = {
  gitm: Concept<GitmState, Record<string, unknown>>;
};

export const gitmDiscard = createQualityCardWithPayload<
  GitmState,
  GitmDiscardPayload,
  GitmSelfDeck
>({
  type: 'Gitm Discard',
  reducer: (state) => {
    const item = bucket.pop();
    if (!item) {
      return {};
    }
    if (item.refresh) {
      // STARC fields refreshed inline (the explicit re-read intent) + lastActionResult.
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
      const { path, confirmed, originScpName } = selectPayload<GitmDiscardPayload>(action);
      // MULTI-SCP GITM MUXIFICATION (MC-W1) — CALLING SCP's repo (origin-aware) · SCP-Sovereign fallback.
      const userCwd = resolveGitmTargetCwd(deck, originScpName);
      const stagedFiles = deck.gitm.k.stagedFiles.select();
      const unstagedFiles = deck.gitm.k.unstagedFiles.select();
      const tracked = stagedFiles.includes(path) || unstagedFiles.includes(path);

      // CONFIRM GATE (pre-exec · git never invoked when not confirmed). MD-D DESTRUCTIVE PREVIEW
      // rides the call-1 (no-confirm) guard: the file's diff (tracked) anor the removal note.
      if (confirmed !== true) {
        const preview = computeDiscardPreview(userCwd, path, tracked);
        const guard: GitmActionResult = {
          action: 'gitmDiscard',
          ok: false,
          error: '',
          guardFired: true,
          reason: 'destructive-confirm-required',
          at: Date.now(),
          preview,
        };
        bucket.push({ result: guard, refresh: null });
        return action.strategy
          ? strategySuccess(action.strategy, strategyData_muxifyData(action.strategy, { ...guard, preview }))
          : muxiumConclude();
      }

      const exec = tracked
        ? gitmExec(['restore', path], userCwd)
        : gitmExec(['clean', '-f', path], userCwd);

      const result: GitmActionResult = {
        action: 'gitmDiscard',
        ok: exec.ok,
        error: exec.ok ? '' : exec.error || exec.stderr,
        guardFired: false,
        reason: '',
        at: Date.now(),
      };

      // EXPLICIT STARC RE-READ (inline · clean -f does not trip WATCHDIAL)
      const refresh = exec.ok ? readGitStatus(userCwd) : null;
      bucket.push({ result, refresh });
      return action.strategy
        ? strategySuccess(action.strategy, strategyData_muxifyData(action.strategy, { ...result }))
        : muxiumConclude();
    }),
});
