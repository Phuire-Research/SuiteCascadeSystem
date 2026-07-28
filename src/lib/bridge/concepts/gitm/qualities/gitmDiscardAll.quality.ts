/**
 * gitmDiscardAll Quality · GITM Dev Menu (#644) · T3 GUARDED · git restore . + git clean -fd
 *
 * DESTROYS ALL uncommitted work (DEVBAR Discard All) — strictly more destructive
 * than per-path gitmDiscard, so it rides the WATCHKEY DOUBLE-confirm token round
 * (S2 §1 Group A · SAFEKEEPS row 3):
 *   call 1 (no confirmToken)    → guardFired + token issued.
 *   call 2 (valid token)        → execute + pendingConfirm cleared.
 * Two-phase exec: `git restore .` (revert tracked working-tree changes) THEN
 * `git clean -fd` (remove untracked files + dirs). The restore must precede the
 * clean. PARAMSEAL seals the action (no params vary); BURNTIME (120s) expires it.
 *
 * EXPLICIT STARC RE-READ (inline · the D3 canon): `git clean -fd` does NOT touch
 * .git/index so WATCHDIAL would not fire for the untracked removal; the inline
 * readGitStatus keeps the result coherent in one partial reducer return.
 *
 * Template: gitmBranchDelete.quality.ts (WATCHKEY round + inline re-read) ·
 *           gitmDiscard.quality.ts (restore/clean mechanism + inline re-read)
 * Citation: GITM-DEVMENU-S2-ORANGE-DESIGN.md §4 (gitm_discard_all · T3 WATCHKEY DOUBLE)
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
  GitmDiscardAllPayload,
  GitmDiscardAll,
  GitmActionResult,
  PendingConfirm,
} from './types';
import { gitmExec } from '../model/gitmExec.model';
import { resolveGitmTargetCwd } from '../model/gitmOpCwd.model';
import { readGitStatus, type GitmStatusResult } from '../model/gitmStatus.model';
import { issueToken, validateToken } from '../model/gitmConfirmToken.model';
import { computeDiscardAllPreview } from '../model/gitmDestructivePreview.model';

export type { GitmDiscardAll };

interface DiscardAllBucketItem {
  result: GitmActionResult;
  refresh: GitmStatusResult | null;
  pendingConfirm: PendingConfirm | null;
  clearPending: boolean;
}

const bucket: DiscardAllBucketItem[] = [];

type GitmSelfDeck = {
  gitm: Concept<GitmState, Record<string, unknown>>;
};

export const gitmDiscardAll = createQualityCardWithPayload<
  GitmState,
  GitmDiscardAllPayload,
  GitmSelfDeck
>({
  type: 'Gitm Discard All',
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
      const { confirmToken, originScpName } = selectPayload<GitmDiscardAllPayload>(action);
      // MULTI-SCP GITM MUXIFICATION (MC-W1) — CALLING SCP's repo (origin-aware) · SCP-Sovereign fallback.
      const userCwd = resolveGitmTargetCwd(deck, originScpName);
      const sealParams = { action: 'gitmDiscardAll' };

      // ── WATCHKEY DOUBLE-confirm round (call 1 mints, call 2 executes)
      const pending = deck.gitm.k.pendingConfirm.select();
      const validation =
        confirmToken !== undefined && confirmToken !== ''
          ? validateToken(pending, 'gitmDiscardAll', sealParams, confirmToken)
          : 'mismatch';
      if (validation !== 'ok') {
        const token = issueToken('gitmDiscardAll', sealParams);
        // MD-D DESTRUCTIVE PREVIEW — ALL uncommitted work: tracked churn --stat + untracked to remove.
        const preview = computeDiscardAllPreview(userCwd);
        const guard: GitmActionResult = {
          action: 'gitmDiscardAll',
          ok: false,
          error: '',
          guardFired: true,
          reason: validation === 'expired' ? 'discard-all-confirm-expired' : 'discard-all-confirm-required',
          at: Date.now(),
          preview,
        };
        bucket.push({ result: guard, refresh: null, pendingConfirm: token, clearPending: false });
        return action.strategy
          ? strategySuccess(
              action.strategy,
              strategyData_muxifyData(action.strategy, { ...guard, confirmToken: token.token, preview }),
            )
          : muxiumConclude();
      }

      // ── EXECUTE — valid token · restore tracked THEN clean untracked
      const restore = gitmExec(['restore', '.'], userCwd);
      const clean = gitmExec(['clean', '-fd'], userCwd);
      const ok = restore.ok && clean.ok;
      const result: GitmActionResult = {
        action: 'gitmDiscardAll',
        ok,
        error: ok ? '' : restore.error || restore.stderr || clean.error || clean.stderr,
        guardFired: false,
        reason: '',
        at: Date.now(),
      };
      const refresh = ok ? readGitStatus(userCwd) : null;
      bucket.push({ result, refresh, pendingConfirm: null, clearPending: true });
      return action.strategy
        ? strategySuccess(action.strategy, strategyData_muxifyData(action.strategy, { ...result }))
        : muxiumConclude();
    }),
});
