/**
 * gitmStageHunk Quality · GITM Dev Epoch (MD-B · STAGE-FROM-DIFF) · git apply --cached -
 *
 * Stage a single hunk (or any unified-diff patch fragment) INTO the index without touching the
 * working tree. Method runs
 *   gitmExec(['apply', '--cached', '-'], opCwd, patch)
 * — the MD-A unified stdin seam (the patch rides gitmExec's `input?` param, so the op LOGS free on
 * the command ring · it never escapes the log the way the pre-MD-A `git apply -` bypass sites did).
 * Reducer partial-returns { lastActionResult } only. WATCHDIAL fires on .git/index → STARC refresh
 * follows (the staged/unstaged panels re-read).
 *
 * FailureNode Doctrine: a failed apply (a stale/whitespace-broken hunk) surfaces
 *   { ok:false, guardFired:true, reason:'apply-failed', error:<git stderr> }
 * on lastActionResult (never silent) — the UI reads the git stderr so the developer sees WHY the
 * hunk did not apply. An empty patch payload is guarded before any subprocess (nothing-to-apply).
 *
 * Template: gitmScpUpdateApply.quality.ts:445 (the `git apply … -` stdin seam via gitmExec input) ·
 *           gitmStageFile.quality.ts (D3 simple-set discipline · selectGitmOpCwd).
 * Citation: DIAMOND-GITM-DEVELOPER-EPOCH.md §MD-B (hunk/line staging) · §MD-A (the stdin unification).
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
import type { GitmStageHunkPayload, GitmStageHunk, GitmActionResult } from './types';
import { gitmExec } from '../model/gitmExec.model';
import { resolveGitmTargetCwd } from '../model/gitmOpCwd.model';
import { log } from '../../../debugLog';

export type { GitmStageHunk };

const bucket: GitmActionResult[] = [];

type GitmSelfDeck = {
  gitm: Concept<GitmState, Record<string, unknown>>;
};

export const gitmStageHunk = createQualityCardWithPayload<
  GitmState,
  GitmStageHunkPayload,
  GitmSelfDeck
>({
  type: 'Gitm Stage Hunk',
  reducer: (state) => {
    const item = bucket.pop();
    if (!item) {
      return {};
    }
    return { lastActionResult: item };
  },
  methodCreator: () =>
    createMethodWithConcepts(({ action, deck }) => {
      const { patch, originScpName } = selectPayload<GitmStageHunkPayload>(action);
      // MULTI-SCP GITM MUXIFICATION (MC-W1) — CALLING SCP's repo (origin-aware) · SCP-Sovereign fallback.
      const opCwd = resolveGitmTargetCwd(deck, originScpName);

      // GUARDSHUNT — an empty patch has nothing to apply (never invoke git on an empty stdin).
      if (typeof patch !== 'string' || patch.trim() === '') {
        const guard: GitmActionResult = {
          action: 'gitmStageHunk',
          ok: false,
          error: '',
          guardFired: true,
          reason: 'empty-patch',
          at: Date.now(),
        };
        bucket.push(guard);
        return action.strategy
          ? strategySuccess(action.strategy, strategyData_muxifyData(action.strategy, { ...guard }))
          : muxiumConclude();
      }

      // THE MD-A UNIFIED STDIN SEAM — the patch rides gitmExec's `input?` param so the op LOGS free.
      const exec = gitmExec(['apply', '--cached', '-'], opCwd, patch);
      const result: GitmActionResult = {
        action: 'gitmStageHunk',
        ok: exec.ok,
        // FailureNode: hand the git stderr so the developer sees WHY the hunk did not apply.
        error: exec.ok ? '' : exec.error || exec.stderr,
        guardFired: !exec.ok,
        reason: exec.ok ? '' : 'apply-failed',
        at: Date.now(),
      };
      log('gitm.stagehunk.apply', { ok: exec.ok, bytes: patch.length });
      bucket.push(result);
      return action.strategy
        ? strategySuccess(action.strategy, strategyData_muxifyData(action.strategy, { ...result }))
        : muxiumConclude();
    }),
});
