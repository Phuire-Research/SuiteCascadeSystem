/**
 * gitmResetAb Quality · GITM Tactical Bridge · RECOVERY — ZERO THE A/B MACHINE TO THE TRUE IDLE GROUND
 *
 * THE TWICE-PROVEN HAND-RUN (C591 + D3-stage): when the A/B reserve-mechanism strands mid-cycle
 * (a role fused, a working B orphaned, abMode stuck) the register-only auto-induction (gitmAutoInductAB
 * :121 — guards on `abMode === 'idle' && stableBranch === ''`) can NEVER re-arm, because SOME residual
 * field always fails that predicate. This quality zeroes the machine back to the exact idle ground so
 * the next bind re-inducts cleanly. NO git exec — the branches themselves are untouched (pure STATE
 * recovery; the refs stay, only the A/B bookkeeping is cleared).
 *
 * THE RESET (atomic · the true idle ground): { stableBranch:'', workingBranch:'', branchRoles:{a:'',b:''},
 * abMode:'idle', bMergeable:false, turnedOverTo:'', turnOverAttempt:null, lastTurnOverResult:'' } — the
 * subset the induction predicate + the merge gate read. Mirrored onto the ORIGIN's slice (upsertSliceFields
 * · the MC-W2 rail carries the recovery) so a non-pointer origin's rail zeroes WITH the flat view; the flat
 * write itself lands behind the materialized-view gate (non-pointer target → lastActionResult only).
 *
 * THE WATCHKEY ROUND (destructive-adjacent · same idiom as gitmBranchDelete -D): clearing the machine is
 * recoverable-but-consequential (it forgets the live A/B cycle), so it is gated by the two-call token round:
 *   call 1 (no valid confirmToken) → { guardFired:true, reason:'reset-ab-needs-confirmation', confirmToken }.
 *   call 2 (valid confirmToken)    → the reset lands + pendingConfirm cleared.
 * PARAMSEAL seals { action:'gitmResetAb' } (no per-op args — the reset is machine-global); BURNTIME (120s)
 * expires an unused token.
 *
 * Origin resolve: resolveGitmTargetCwd(deck, originScpName) — the CALLING SCP's own repo (MC-W1).
 *
 * Template: gitmBranchDelete.quality.ts (the WATCHKEY two-call token round) · gitmAssignRole.quality.ts
 *   (the C595 safe insertion shape · slice mirror · materialized-view gate · origin thread).
 * Citation: gitmAutoInductAB.quality.ts:121 (the induction re-arm predicate this reset restores) ·
 *   gitmConfirmToken.model.ts (WATCHKEY · PARAMSEAL · BURNTIME).
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
import type { GitmResetAbPayload, GitmResetAb, GitmActionResult, PendingConfirm } from './types';
import { resolveGitmTargetCwd } from '../model/gitmOpCwd.model';
import { upsertSliceFields } from '../model/gitmSliceStore.model';
import { issueToken, validateToken } from '../model/gitmConfirmToken.model';
import { log } from '../../../debugLog';

export type { GitmResetAb };

interface ResetAbBucketItem {
  result: GitmActionResult;
  reset: boolean; // true → the idle-ground fields land (guard/pending routes carry false)
  pendingConfirm: PendingConfirm | null; // call-1 mint (guard route)
  clearPending: boolean; // call-2 execute → clear the state token
  resolvedCwd: string;
  activeScpDir: string;
}

const bucket: ResetAbBucketItem[] = [];

type GitmSelfDeck = {
  gitm: Concept<GitmState, Record<string, unknown>>;
};

export const gitmResetAb = createQualityCardWithPayload<
  GitmState,
  GitmResetAbPayload,
  GitmSelfDeck
>({
  type: 'Gitm Reset Ab',
  reducer: (state) => {
    const item = bucket.pop();
    if (!item) {
      return {};
    }
    // call-1 guard — surface the pending token, no reset.
    if (item.pendingConfirm) {
      return { lastActionResult: item.result, pendingConfirm: item.pendingConfirm };
    }
    if (!item.reset) {
      return { lastActionResult: item.result };
    }
    // THE SLICE MIRROR (MC-W2 · unconditional) — the ORIGIN's rail zeroes WITH the recovery.
    if (item.resolvedCwd !== '') {
      upsertSliceFields(item.resolvedCwd, {
        stableBranch: '',
        workingBranch: '',
        branchRoles: { a: '', b: '' },
        abMode: 'idle',
        bMergeable: false,
        turnedOverTo: '',
        turnOverAttempt: null,
        lastTurnOverResult: '',
      });
    }
    // THE MATERIALIZED-VIEW GATE — the flat view belongs to the pointer only.
    const isActiveView =
      item.activeScpDir === '' || item.resolvedCwd === item.activeScpDir || item.resolvedCwd === '';
    if (!isActiveView) {
      return { lastActionResult: item.result, pendingConfirm: null };
    }
    // THE ZERO-RESET — the true idle ground (the auto-induction re-arm predicate + the merge gate).
    return {
      stableBranch: '',
      workingBranch: '',
      branchRoles: { a: '', b: '' },
      abMode: 'idle' as const,
      bMergeable: false,
      turnedOverTo: '' as const,
      turnOverAttempt: null,
      lastTurnOverResult: '',
      lastActionResult: item.result,
      pendingConfirm: null,
    };
  },
  methodCreator: () =>
    createMethodWithConcepts(({ action, deck }) => {
      const { confirmToken, originScpName } = selectPayload<GitmResetAbPayload>(action);
      // MULTI-SCP GITM MUXIFICATION (MC-W1) — CALLING SCP's repo (origin-aware) · SCP-Sovereign fallback.
      const opCwd = resolveGitmTargetCwd(deck, originScpName);
      const activeScpDir = deck.gitm.k.activeScpDir.select();
      // PARAMSEAL — the reset is machine-global (no per-op args); seal to the action name alone.
      const sealParams = { action: 'gitmResetAb' };

      // ── WATCHKEY double-confirm (destructive-adjacent — same round as gitmBranchDelete -D)
      const pending = deck.gitm.k.pendingConfirm.select();
      const validation =
        confirmToken !== undefined && confirmToken !== ''
          ? validateToken(pending, 'gitmResetAb', sealParams, confirmToken)
          : 'mismatch';
      if (validation !== 'ok') {
        const token = issueToken('gitmResetAb', sealParams);
        const guard: GitmActionResult = {
          action: 'gitmResetAb',
          ok: false,
          error: '',
          guardFired: true,
          reason: validation === 'expired' ? 'reset-ab-confirm-expired' : 'reset-ab-needs-confirmation',
          at: Date.now(),
        };
        log('gitm.resetab.confirm', { reason: guard.reason, opCwd });
        bucket.push({
          result: guard,
          reset: false,
          pendingConfirm: token,
          clearPending: false,
          resolvedCwd: opCwd,
          activeScpDir,
        });
        return action.strategy
          ? strategySuccess(
              action.strategy,
              strategyData_muxifyData(action.strategy, { ...guard, confirmToken: token.token }),
            )
          : muxiumConclude();
      }

      // ── EXECUTE — valid token · zero the A/B machine to the true idle ground (NO git exec).
      const result: GitmActionResult = {
        action: 'gitmResetAb',
        ok: true,
        error: '',
        guardFired: false,
        reason: '',
        at: Date.now(),
      };
      log('gitm.resetab.zeroed', { opCwd });
      bucket.push({
        result,
        reset: true,
        pendingConfirm: null,
        clearPending: true,
        resolvedCwd: opCwd,
        activeScpDir,
      });
      return action.strategy
        ? strategySuccess(action.strategy, strategyData_muxifyData(action.strategy, { ...result }))
        : muxiumConclude();
    }),
});
