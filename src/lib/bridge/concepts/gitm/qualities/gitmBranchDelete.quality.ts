/**
 * gitmBranchDelete Quality · GITM D4 (#635) · T3 GUARDED · git branch [-d|-D] <name>
 *
 * Two paths (GITM-D4-S4-GREEN-EXAM Q3):
 *   force === false : try `git branch -d <name>` (merged-only). git itself refuses
 *                     an unmerged branch — surfaced as a SOFT guard
 *                     { reason: 'branch-not-merged-use-force' }; the caller may
 *                     re-call with force:true. A merged branch deletes cleanly.
 *   force === true  : `git branch -D <name>` (force) behind the WATCHKEY double-
 *                     confirm token round (same mechanics as --hard reset):
 *                       call 1 (no token)    → guardFired + token issued.
 *                       call 2 (valid token) → execute + pendingConfirm cleared.
 *                     PARAMSEAL seals (name); BURNTIME (120s) expires it.
 *
 * EXPLICIT STARC RE-READ (inline · the D3 canon): branch -d/-D mutates refs so the
 * branches[] list changes; the inline readGitStatus keeps the result coherent.
 *
 * Template: gitmReset.quality.ts (WATCHKEY round) · gitmDiscard.quality.ts (inline re-read)
 * Citation: GITM-D4-S4-GREEN-EXAM.md Q3 (gitmBranchDelete · -d first, -D token round)
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
import type {
  GitmBranchDeletePayload,
  GitmBranchDelete,
  GitmActionResult,
  PendingConfirm,
} from './types';
import { gitmExec } from '../model/gitmExec.model';
import { resolveGitmTargetCwd } from '../model/gitmOpCwd.model';
import { readGitStatus, type GitmStatusResult } from '../model/gitmStatus.model';
import { issueToken, validateToken } from '../model/gitmConfirmToken.model';
import { disarmSeatReturn } from '../model/seatReturnArm.model';
import { log } from '../../../debugLog';

export type { GitmBranchDelete };

interface BranchDeleteBucketItem {
  result: GitmActionResult;
  refresh: GitmStatusResult | null;
  pendingConfirm: PendingConfirm | null;
  clearPending: boolean;
  // C306 (I-4): the deleted branch WAS the working branch — the signifier dies with it.
  blankWorking: boolean;
}

const bucket: BranchDeleteBucketItem[] = [];

type GitmSelfDeck = {
  gitm: Concept<GitmState, Record<string, unknown>>;
};

export const gitmBranchDelete = createQualityCardWithPayload<
  GitmState,
  GitmBranchDeletePayload,
  GitmSelfDeck
>({
  type: 'Gitm Branch Delete',
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
        pendingConfirm: null,
        // C596 · THE DELETE LOCKSTEP (the C595 r4 orphan gap): blanking workingBranch while
        // roles.b still names the deleted branch strands a dead role — clear roles.b WITH it
        // (D-BN lockstep: the pointer and the role truth move together).
        ...(item.blankWorking
          ? {
              workingBranch: '',
              abMode: 'idle' as const,
              branchRoles: { a: state.branchRoles.a, b: '' },
            }
          : {}),
      };
    }
    if (item.pendingConfirm) {
      return { lastActionResult: item.result, pendingConfirm: item.pendingConfirm };
    }
    if (item.clearPending) {
      return { lastActionResult: item.result, pendingConfirm: null };
    }
    return { lastActionResult: item.result };
  },
  methodCreator: () =>
    createMethodWithConcepts(({ action, deck }) => {
      const { name, force, confirmToken, originScpName } = selectPayload<GitmBranchDeletePayload>(action);
      // MULTI-SCP GITM MUXIFICATION (MC-W1) — CALLING SCP's repo (origin-aware) · SCP-Sovereign fallback.
      const userCwd = resolveGitmTargetCwd(deck, originScpName);
      const sealParams = { action: 'gitmBranchDelete', name };

      // ── force === false : -d merged-only (git refuses unmerged → soft guard)
      if (!force) {
        const exec = gitmExec(['branch', '-d', name], userCwd);
        if (!exec.ok && exec.stderr.toLowerCase().includes('not fully merged')) {
          const guard: GitmActionResult = {
            action: 'gitmBranchDelete',
            ok: false,
            error: '',
            guardFired: true,
            reason: 'branch-not-merged-use-force',
            at: Date.now(),
          };
          bucket.push({ result: guard, refresh: null, pendingConfirm: null, clearPending: false, blankWorking: false });
          return action.strategy
            ? strategySuccess(
                action.strategy,
                strategyData_muxifyData(action.strategy, { ...guard, name }),
              )
            : muxiumConclude();
        }
        const result: GitmActionResult = {
          action: 'gitmBranchDelete',
          ok: exec.ok,
          error: exec.ok ? '' : exec.error || exec.stderr,
          guardFired: false,
          reason: '',
          at: Date.now(),
        };
        const refresh = exec.ok ? readGitStatus(userCwd) : null;
        bucket.push({ result, refresh, pendingConfirm: null, clearPending: false, blankWorking: false });
        return action.strategy
          ? strategySuccess(action.strategy, strategyData_muxifyData(action.strategy, { ...result }))
          : muxiumConclude();
      }

      // ── force === true : -D behind WATCHKEY double-confirm
      const pending = deck.gitm.k.pendingConfirm.select();
      const validation =
        confirmToken !== undefined && confirmToken !== ''
          ? validateToken(pending, 'gitmBranchDelete', sealParams, confirmToken)
          : 'mismatch';
      if (validation !== 'ok') {
        const token = issueToken('gitmBranchDelete', sealParams);
        const guard: GitmActionResult = {
          action: 'gitmBranchDelete',
          ok: false,
          error: '',
          guardFired: true,
          reason: validation === 'expired' ? 'branch-delete-confirm-expired' : 'branch-delete-confirm-required',
          at: Date.now(),
        };
        bucket.push({ result: guard, refresh: null, pendingConfirm: token, clearPending: false, blankWorking: false });
        return action.strategy
          ? strategySuccess(
              action.strategy,
              strategyData_muxifyData(action.strategy, { ...guard, confirmToken: token.token, name }),
            )
          : muxiumConclude();
      }

      // ── EXECUTE -D — valid token
      const exec = gitmExec(['branch', '-D', name], userCwd);
      const result: GitmActionResult = {
        action: 'gitmBranchDelete',
        ok: exec.ok,
        error: exec.ok ? '' : exec.error || exec.stderr,
        guardFired: false,
        reason: '',
        at: Date.now(),
      };
      const refresh = exec.ok ? readGitStatus(userCwd) : null;
      const wasWorking = exec.ok && name === deck.gitm.k.workingBranch.select();
      if (wasWorking) {
        disarmSeatReturn();
        log('gitm.branch-delete.signifier-blanked', { name });
      }
      bucket.push({ result, refresh, pendingConfirm: null, clearPending: true, blankWorking: wasWorking });
      return action.strategy
        ? strategySuccess(action.strategy, strategyData_muxifyData(action.strategy, { ...result }))
        : muxiumConclude();
    }),
});
