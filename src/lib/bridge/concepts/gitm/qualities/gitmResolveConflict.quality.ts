/**
 * gitmResolveConflict Quality · GITM Dev Epoch (MD-D · THE THREE-WAY SURFACE) · Save & Mark Resolved
 *
 * The editor's OUTPUT pane, resolved, lands here: write the resolved content to the working file
 * THEN `git add <path>` (mark-resolved = stage · the git convention for resolving a conflict).
 * FailureNode on the write (a failed write → guardFired-style error result · git NOT invoked · the
 * activeConflict stays so the user can retry). On success: git add + clear activeConflict + the
 * inline readGitStatus refresh (the add removes the file from conflicts · WATCHDIAL fires on index
 * but the inline re-read keeps the result coherent in one Method · single-action-legal).
 *
 * Template: gitmDiscard (worktree write + git op + inline STARC re-read) · gitmScpUpdateApply (FS write FailureNode).
 * Citation: DIAMOND-GITM-DEVELOPER-EPOCH.md §MD-D (gitm_resolve_conflict · write + git add · FailureNode).
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
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { GitmState } from '../gitm.types';
import type {
  GitmResolveConflictPayload,
  GitmResolveConflict,
  GitmActionResult,
} from './types';
import { gitmExec, resolveConflictPaths } from '../model/gitmExec.model';
import { resolveGitmTargetCwd } from '../model/gitmOpCwd.model';
import { readGitStatus, type GitmStatusResult } from '../model/gitmStatus.model';
import { log } from '../../../debugLog';

export type { GitmResolveConflict };

interface ResolveConflictBucketItem {
  result: GitmActionResult;
  refresh: GitmStatusResult | null; // present only after a successful resolve
  clearConflict: boolean; // true → null activeConflict (success)
}

const bucket: ResolveConflictBucketItem[] = [];

type GitmSelfDeck = {
  gitm: Concept<GitmState, Record<string, unknown>>;
};

export const gitmResolveConflict = createQualityCardWithPayload<
  GitmState,
  GitmResolveConflictPayload,
  GitmSelfDeck
>({
  type: 'Gitm Resolve Conflict',
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
        lastActionResult: item.result,
        activeConflict: null, // resolved → clear the editor surface
      };
    }
    // Failed write → surface the error; KEEP activeConflict so the user can retry.
    return { lastActionResult: item.result };
  },
  methodCreator: () =>
    createMethodWithConcepts(({ action, deck }) => {
      const { path, content, originScpName } = selectPayload<GitmResolveConflictPayload>(action);
      // MULTI-SCP GITM MUXIFICATION (MC-W1) — CALLING SCP's repo (origin-aware) · SCP-Sovereign fallback.
      const userCwd = resolveGitmTargetCwd(deck, originScpName);

      // PATH-PREFIX REPAIR (093 · E4) — mirror gitmLoadConflict: the write + the `git add` MUST
      // land the SAME file. workPath is CWD-relative (both the FS write AND `git add` run within
      // the tree · git add is prefix-tolerant from cwd). Idempotent (no doubled prefix).
      const rp = resolveConflictPaths(path, userCwd);
      log('gitm.conflict.path-resolved', { given: rp.given, used: rp.workPath, index: rp.indexPath });

      // FailureNode on the write — git is NOT invoked if the working file cannot be written.
      try {
        writeFileSync(join(userCwd, rp.workPath), content, 'utf8');
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        const failure: GitmActionResult = {
          action: 'gitmResolveConflict',
          ok: false,
          error: message,
          guardFired: false,
          reason: 'resolve-write-failed',
          at: Date.now(),
        };
        bucket.push({ result: failure, refresh: null, clearConflict: false });
        return action.strategy
          ? strategySuccess(action.strategy, strategyData_muxifyData(action.strategy, { ...failure }))
          : muxiumConclude();
      }

      // Mark-resolved = stage (git add <workPath> · the SAME file the write touched).
      const exec = gitmExec(['add', rp.workPath], userCwd);
      const result: GitmActionResult = {
        action: 'gitmResolveConflict',
        ok: exec.ok,
        error: exec.ok ? '' : exec.error || exec.stderr,
        guardFired: false,
        reason: '',
        at: Date.now(),
      };
      // EXPLICIT STARC RE-READ (inline · the add clears the conflict entry)
      const refresh = exec.ok ? readGitStatus(userCwd) : null;
      bucket.push({ result, refresh, clearConflict: exec.ok });
      return action.strategy
        ? strategySuccess(action.strategy, strategyData_muxifyData(action.strategy, { ...result }))
        : muxiumConclude();
    }),
});
