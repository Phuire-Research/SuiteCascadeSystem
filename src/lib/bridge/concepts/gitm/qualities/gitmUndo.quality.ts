/**
 * gitmUndo Quality · GITM Dev Epoch (MD-D · TRUST COMPLETIONS) · GUARDED · git reset --mixed <ref>
 *
 * THE UNIVERSAL UNDO — reflog-backed. Every mutating op leaves a reflog entry; gitmUndo resets
 * HEAD to any reflog ref with --mixed (moves HEAD + index · KEEPS the working tree · the safe
 * undo). WATCHKEY DOUBLE-confirm (the gitmReset --hard idiom):
 *   call 1 (no token)    → compute the loss preview (`git diff HEAD <ref> --stat`) + mint the
 *                          token (pendingConfirm set · token + preview in strategyData).
 *   call 2 (valid token) → execute `git reset --mixed <ref>` + the inline readGitStatus refresh +
 *                          clear pendingConfirm.
 * PARAMSEAL seals (reflogRef); BURNTIME (120s) expires it. The preview is LABELED with what it
 * will undo (the diff HEAD → the target).
 *
 * EXPLICIT STARC RE-READ (the D3 canon · gitmReset): reset moves HEAD/index so WATCHDIAL fires,
 * but the inline re-read keeps the result coherent in the same Method (single-action-legal).
 *
 * Template: gitmReset.quality.ts (WATCHKEY round · --hard branch · inline STARC re-read).
 * Citation: DIAMOND-GITM-DEVELOPER-EPOCH.md §MD-D (Universal undo · reflog-backed · reset --mixed).
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
  GitmUndoPayload,
  GitmUndo,
  GitmActionResult,
  PendingConfirm,
} from './types';
import { gitmExec } from '../model/gitmExec.model';
import { resolveGitmTargetCwd } from '../model/gitmOpCwd.model';
import { readGitStatus, type GitmStatusResult } from '../model/gitmStatus.model';
import { issueToken, validateToken } from '../model/gitmConfirmToken.model';
import { computeResetPreview } from '../model/gitmDestructivePreview.model';

export type { GitmUndo };

interface UndoBucketItem {
  result: GitmActionResult;
  refresh: GitmStatusResult | null; // present only after a successful undo
  pendingConfirm: PendingConfirm | null; // set token on call 1 · null clears on exec
  clearPending: boolean; // true when this item must clear pendingConfirm
}

const bucket: UndoBucketItem[] = [];

type GitmSelfDeck = {
  gitm: Concept<GitmState, Record<string, unknown>>;
};

export const gitmUndo = createQualityCardWithPayload<
  GitmState,
  GitmUndoPayload,
  GitmSelfDeck
>({
  type: 'Gitm Undo',
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
        pendingConfirm: null, // exec succeeded → clear the WATCHKEY token
      };
    }
    if (item.pendingConfirm) {
      // Call 1 — store the freshly minted token; surface the result (+ preview).
      return { lastActionResult: item.result, pendingConfirm: item.pendingConfirm };
    }
    if (item.clearPending) {
      // Failed exec that should not retain a token.
      return { lastActionResult: item.result, pendingConfirm: null };
    }
    return { lastActionResult: item.result };
  },
  methodCreator: () =>
    createMethodWithConcepts(({ action, deck }) => {
      const { reflogRef, confirmToken, originScpName } = selectPayload<GitmUndoPayload>(action);
      // MULTI-SCP GITM MUXIFICATION (MC-W1) — CALLING SCP's repo (origin-aware) · SCP-Sovereign fallback.
      const userCwd = resolveGitmTargetCwd(deck, originScpName);
      const sealParams = { action: 'gitmUndo', reflogRef };

      // ── WATCHKEY DOUBLE-confirm token round
      const pending = deck.gitm.k.pendingConfirm.select();
      const validation =
        confirmToken !== undefined && confirmToken !== ''
          ? validateToken(pending, 'gitmUndo', sealParams, confirmToken)
          : 'mismatch';
      if (validation !== 'ok') {
        const token = issueToken('gitmUndo', sealParams);
        // MD-D PREVIEW — what the undo will change: the diff HEAD → the reflog target.
        const preview = computeResetPreview(userCwd, reflogRef);
        const guard: GitmActionResult = {
          action: 'gitmUndo',
          ok: false,
          error: '',
          guardFired: true,
          reason: validation === 'expired' ? 'undo-confirm-expired' : 'undo-confirm-required',
          at: Date.now(),
          preview,
        };
        bucket.push({ result: guard, refresh: null, pendingConfirm: token, clearPending: false });
        return action.strategy
          ? strategySuccess(
              action.strategy,
              strategyData_muxifyData(action.strategy, {
                ...guard,
                confirmToken: token.token,
                preview,
                reflogRef,
              }),
            )
          : muxiumConclude();
      }

      // ── EXECUTE — valid token · git reset --mixed <ref>
      const exec = gitmExec(['reset', '--mixed', reflogRef], userCwd);
      const result: GitmActionResult = {
        action: 'gitmUndo',
        ok: exec.ok,
        error: exec.ok ? '' : exec.error || exec.stderr,
        guardFired: false,
        reason: '',
        at: Date.now(),
      };
      // EXPLICIT STARC RE-READ (inline · single-action-legal)
      const refresh = exec.ok ? readGitStatus(userCwd) : null;
      bucket.push({ result, refresh, pendingConfirm: null, clearPending: true });
      return action.strategy
        ? strategySuccess(action.strategy, strategyData_muxifyData(action.strategy, { ...result }))
        : muxiumConclude();
    }),
});
