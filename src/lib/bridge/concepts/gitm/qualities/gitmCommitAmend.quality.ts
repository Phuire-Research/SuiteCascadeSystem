/**
 * gitmCommitAmend Quality · GITM Dev Menu (#644) · T3 GUARDED · git commit --amend
 *
 * Rewrites the LAST commit (DEVBAR Amend). SINGLE-confirm via the WATCHKEY token
 * round (S2 §4 — amend is recoverable via reflog, so single not double):
 *   call 1 (no confirmToken)    → guardFired + token issued (PARAMSEAL on message).
 *   call 2 (valid token)        → execute + pendingConfirm cleared.
 * PARAMSEAL seals (message); BURNTIME (120s) expires it. The amend variant:
 *   message non-empty → git commit --amend -m <message> (new message)
 *   message empty     → git commit --amend --no-edit     (reuse the last message)
 *
 * EXPLICIT STARC RE-READ (inline · the D3/D4 canon): amend mutates HEAD so the
 * commit set + lastReadAt change; the inline readGitStatus keeps the result
 * coherent without depending on a deferred WATCHDIAL fire.
 *
 * Template: gitmBranchDelete.quality.ts (WATCHKEY round + inline re-read) ·
 *           gitmReset.quality.ts (single/double confirm precedent)
 * Citation: GITM-DEVMENU-S2-ORANGE-DESIGN.md §4 (gitm_commit_amend · T3 single-confirm)
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
  GitmCommitAmendPayload,
  GitmCommitAmend,
  GitmActionResult,
  PendingConfirm,
} from './types';
import { gitmExec } from '../model/gitmExec.model';
import { resolveGitmTargetCwd } from '../model/gitmOpCwd.model';
import { readGitStatus, type GitmStatusResult } from '../model/gitmStatus.model';
import { issueToken, validateToken } from '../model/gitmConfirmToken.model';

export type { GitmCommitAmend };

interface CommitAmendBucketItem {
  result: GitmActionResult;
  refresh: GitmStatusResult | null;
  pendingConfirm: PendingConfirm | null;
  clearPending: boolean;
}

const bucket: CommitAmendBucketItem[] = [];

type GitmSelfDeck = {
  gitm: Concept<GitmState, Record<string, unknown>>;
};

export const gitmCommitAmend = createQualityCardWithPayload<
  GitmState,
  GitmCommitAmendPayload,
  GitmSelfDeck
>({
  type: 'Gitm Commit Amend',
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
      const { message, confirmToken, originScpName } = selectPayload<GitmCommitAmendPayload>(action);
      // MULTI-SCP GITM MUXIFICATION (MC-W1) — CALLING SCP's repo (origin-aware) · SCP-Sovereign fallback.
      const userCwd = resolveGitmTargetCwd(deck, originScpName);
      const msg = message ?? '';
      const sealParams = { action: 'gitmCommitAmend', message: msg };

      // ── WATCHKEY single-confirm round (call 1 mints, call 2 executes)
      const pending = deck.gitm.k.pendingConfirm.select();
      const validation =
        confirmToken !== undefined && confirmToken !== ''
          ? validateToken(pending, 'gitmCommitAmend', sealParams, confirmToken)
          : 'mismatch';
      if (validation !== 'ok') {
        const token = issueToken('gitmCommitAmend', sealParams);
        const guard: GitmActionResult = {
          action: 'gitmCommitAmend',
          ok: false,
          error: '',
          guardFired: true,
          reason: validation === 'expired' ? 'amend-confirm-expired' : 'amend-confirm-required',
          at: Date.now(),
        };
        bucket.push({ result: guard, refresh: null, pendingConfirm: token, clearPending: false });
        return action.strategy
          ? strategySuccess(
              action.strategy,
              strategyData_muxifyData(action.strategy, { ...guard, confirmToken: token.token }),
            )
          : muxiumConclude();
      }

      // ── EXECUTE — valid token
      const args = msg !== '' ? ['commit', '--amend', '-m', msg] : ['commit', '--amend', '--no-edit'];
      const exec = gitmExec(args, userCwd);
      const result: GitmActionResult = {
        action: 'gitmCommitAmend',
        ok: exec.ok,
        error: exec.ok ? '' : exec.error || exec.stderr,
        guardFired: false,
        reason: '',
        at: Date.now(),
      };
      const refresh = exec.ok ? readGitStatus(userCwd) : null;
      bucket.push({ result, refresh, pendingConfirm: null, clearPending: true });
      return action.strategy
        ? strategySuccess(action.strategy, strategyData_muxifyData(action.strategy, { ...result }))
        : muxiumConclude();
    }),
});
