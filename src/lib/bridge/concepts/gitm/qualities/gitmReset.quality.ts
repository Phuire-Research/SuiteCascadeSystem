/**
 * gitmReset Quality · GITM D4 (#635) · T3 GUARDED · git reset [--soft|--mixed|--hard] <ref>
 *
 * Two confirm tiers (GITM-D4-S4-GREEN-EXAM Q3):
 *   --soft / --mixed : SINGLE confirm — payload.confirmed === true gate (gitmDiscard
 *                      parity). These modes do not destroy working-tree content.
 *   --hard           : DOUBLE confirm — the WATCHKEY token round (Q2):
 *                        call 1 (no token)        → guardFired + token issued
 *                                                   (pendingConfirm set · token in
 *                                                   strategyData.confirmToken).
 *                        call 2 (valid token)     → execute + pendingConfirm cleared.
 *                      PARAMSEAL seals the token to (mode, ref); BURNTIME (120s)
 *                      expires it. A bait-and-switch (token for ref A, submit ref B)
 *                      → 'mismatch' → re-issue.
 *
 * EXPLICIT STARC RE-READ (the D3 canon · gitmDiscard/gitmPush): reset MOVES local
 * HEAD/index so WATCHDIAL DOES fire — but the inline re-read keeps the result
 * coherent in the same Method (single-action-legal · readGitStatus alongside
 * lastActionResult in ONE partial reducer return).
 *
 * Template: gitmDiscard.quality.ts (confirm gate + inline STARC re-read) · gitmPush (refresh)
 * Citation: GITM-D4-S4-GREEN-EXAM.md Q2-Q3 · GITM-D4-S2-ORANGE-NAMING.md §1-3 (WATCHKEY/PARAMSEAL/BURNTIME)
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
  GitmResetPayload,
  GitmReset,
  GitmActionResult,
  PendingConfirm,
} from './types';
import { gitmExec } from '../model/gitmExec.model';
import { resolveGitmTargetCwd } from '../model/gitmOpCwd.model';
import { readGitStatus, type GitmStatusResult } from '../model/gitmStatus.model';
import { issueToken, validateToken } from '../model/gitmConfirmToken.model';
import { computeResetPreview } from '../model/gitmDestructivePreview.model';

export type { GitmReset };

interface ResetBucketItem {
  result: GitmActionResult;
  refresh: GitmStatusResult | null; // present only after a successful reset
  pendingConfirm: PendingConfirm | null; // set token on call 1 · null clears on exec
  clearPending: boolean; // true when this item must clear pendingConfirm
}

const bucket: ResetBucketItem[] = [];

type GitmSelfDeck = {
  gitm: Concept<GitmState, Record<string, unknown>>;
};

export const gitmReset = createQualityCardWithPayload<
  GitmState,
  GitmResetPayload,
  GitmSelfDeck
>({
  type: 'Gitm Reset',
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
      // Call 1 (--hard) — store the freshly minted token; surface the result.
      return { lastActionResult: item.result, pendingConfirm: item.pendingConfirm };
    }
    if (item.clearPending) {
      // Failed exec / single-confirm guard that should not retain a token.
      return { lastActionResult: item.result, pendingConfirm: null };
    }
    return { lastActionResult: item.result };
  },
  methodCreator: () =>
    createMethodWithConcepts(({ action, deck }) => {
      const { ref, mode, confirmed, confirmToken, originScpName } = selectPayload<GitmResetPayload>(action);
      // MULTI-SCP GITM MUXIFICATION (MC-W1) — CALLING SCP's repo (origin-aware) · SCP-Sovereign fallback.
      const userCwd = resolveGitmTargetCwd(deck, originScpName);
      const sealParams = { action: 'gitmReset', mode, ref };

      // ── --soft / --mixed : SINGLE confirm (boolean gate · git never invoked unconfirmed)
      if (mode !== 'hard') {
        if (confirmed !== true) {
          const guard: GitmActionResult = {
            action: 'gitmReset',
            ok: false,
            error: '',
            guardFired: true,
            reason: 'reset-confirm-required',
            at: Date.now(),
          };
          bucket.push({ result: guard, refresh: null, pendingConfirm: null, clearPending: false });
          return action.strategy
            ? strategySuccess(
                action.strategy,
                strategyData_muxifyData(action.strategy, { ...guard, mode, ref }),
              )
            : muxiumConclude();
        }
      } else {
        // ── --hard : DOUBLE confirm (WATCHKEY token round)
        const pending = deck.gitm.k.pendingConfirm.select();
        const validation =
          confirmToken !== undefined && confirmToken !== ''
            ? validateToken(pending, 'gitmReset', sealParams, confirmToken)
            : 'mismatch';
        if (validation !== 'ok') {
          // Call 1 (or stale/mismatched call 2) → issue a FRESH token, do NOT exec.
          const token = issueToken('gitmReset', sealParams);
          // MD-D DESTRUCTIVE PREVIEW — the exact loss `git reset --hard <ref>` will inflict:
          // the --stat summary of HEAD vs the target + the first ~40 diff lines (best-effort).
          const preview = computeResetPreview(userCwd, ref);
          const guard: GitmActionResult = {
            action: 'gitmReset',
            ok: false,
            error: '',
            guardFired: true,
            reason: validation === 'expired' ? 'reset-confirm-expired' : 'reset-confirm-required',
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
                  mode,
                  ref,
                }),
              )
            : muxiumConclude();
        }
      }

      // ── EXECUTE — confirmed (soft/mixed) OR valid token (hard)
      const flag = mode === 'soft' ? '--soft' : mode === 'hard' ? '--hard' : '--mixed';
      const exec = gitmExec(['reset', flag, ref], userCwd);
      const result: GitmActionResult = {
        action: 'gitmReset',
        ok: exec.ok,
        error: exec.ok ? '' : exec.error || exec.stderr,
        guardFired: false,
        reason: '',
        at: Date.now(),
      };
      // EXPLICIT STARC RE-READ (inline · single-action-legal)
      const refresh = exec.ok ? readGitStatus(userCwd) : null;
      // Successful exec clears pendingConfirm (via refresh branch); a failed hard
      // exec also clears the spent token so the caller must re-initiate.
      bucket.push({
        result,
        refresh,
        pendingConfirm: null,
        clearPending: mode === 'hard',
      });
      return action.strategy
        ? strategySuccess(action.strategy, strategyData_muxifyData(action.strategy, { ...result }))
        : muxiumConclude();
    }),
});
