/**
 * gitmRevertToStable Quality · GITM A↔B (#641) · THE FAILSAFE · commit B → switch A → restart
 *
 * Called from the SCP client via MCP during the SCP-down window (B failed to boot). The
 * outer SCS-Bridge process is alive and serving its /mcp endpoint independently of the SCP
 * server (S4 Green Seam 2a · reachability CONFIRMED). Single synchronous method:
 *   1. stableBranch empty → guardFired { reason: 'no-stable-branch' } (nothing to revert to).
 *   2. Read workingBranch (for the auto-commit log message context).
 *   3. If dirty===true → gitmExec(['add','-A']) + gitmExec(['commit','-m', '...']) — preserve
 *      B's state before abandoning it (the user does not lose B's work).
 *   4. gitmExec(['switch', stableBranch]) — return to A.
 *   5. writeFileSync(.bridge-restart.json, { hardTurnOver, timestamp, source: 'A' }) — restart
 *      onto A's code.
 *
 * Reducer: abMode → 'candidate-created' (B still exists · the user can retry or merge later
 * once B is fixed) · lastTurnOverResult = 'failed'.
 *
 * Template: gitmStageAllAndCommit.quality.ts (add-A + commit) · gitmTurnOverWithSource (switch + write).
 * Citation: GITM-AB-S3-YELLOW-BLUEPRINT.md §W1c Quality 4 · GITM-AB-S4-GREEN-EXAM.md Seam 2.
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
import { resolve } from 'node:path';
import type { GitmState, GitmABMode } from '../gitm.types';
import type { GitmRevertToStable, GitmRevertToStablePayload, GitmActionResult } from './types';
import { gitmExec } from '../model/gitmExec.model';
import { resolveGitmTargetCwd, selectGitmDecisionFields } from '../model/gitmOpCwd.model';

export type { GitmRevertToStable };

interface RevertBucketItem {
  result: GitmActionResult;
  advance: boolean; // true only when the switch + restart write succeeded
  // MULTI-SCP GITM MUXIFICATION (MC-W3 · THE MATERIALIZED-VIEW GATE) — the RESOLVED revert cwd + the
  // ACTIVE pointer dir. The advance outcome (abMode 'candidate-created' · lastTurnOverResult 'failed')
  // must NOT stomp the pointer's flat view when a NON-pointer origin's failsafe reverts. Gated below.
  resolvedCwd: string;
  activeScpDir: string;
}

const bucket: RevertBucketItem[] = [];

type GitmSelfDeck = {
  gitm: Concept<GitmState, Record<string, unknown>>;
};

export const gitmRevertToStable = createQualityCardWithPayload<
  GitmState,
  Record<string, never>,
  GitmSelfDeck
>({
  type: 'Gitm Revert To Stable',
  reducer: (state) => {
    const item = bucket.pop();
    if (!item) {
      return {};
    }
    if (!item.advance) {
      return { lastActionResult: item.result };
    }
    // MULTI-SCP GITM MUXIFICATION (MC-W3 · THE MATERIALIZED-VIEW GATE) — the flat view belongs to the
    // POINTER only. A NON-pointer origin's failsafe revert outcome must NOT stomp the flat abMode/
    // lastTurnOverResult with the origin's result; surface only the caller's action result. DEFERRED:
    // the positive slice-mirror (writing the revert outcome into the origin's slice) — out of M3 scope.
    const isActiveView =
      item.activeScpDir === '' || item.resolvedCwd === item.activeScpDir || item.resolvedCwd === '';
    if (!isActiveView) {
      return { lastActionResult: item.result };
    }
    return {
      abMode: 'candidate-created' as GitmABMode,
      lastTurnOverResult: 'failed',
      lastActionResult: item.result,
    };
  },
  methodCreator: () =>
    createMethodWithConcepts(({ action, deck }) => {
      // GITM SCP-SOVEREIGN — the FAILSAFE reverts the ACTIVE SCP's own RED repo. The auto-commit +
      // switch ops AND the .bridge-restart.json write BOTH target this cwd (S4 Seam B): the restart
      // MUST land in the SCP's nodemon-watched dir (activeScpDir) so the revert actually restarts
      // the SCP onto A's code. selectGitmOpCwd = activeScpDir || userCwd (no-SCP fallback). The #641-R
      // 45s failsafe (client-side localStorage + outer-bridge /mcp) is UNTOUCHED — it does not depend
      // on this cwd; only the branch ops + restart write move with the SCP.
      // MULTI-SCP GITM MUXIFICATION (MC-W1) — CALLING SCP's repo (origin-aware) · SCP-Sovereign fallback.
      const opCwd = resolveGitmTargetCwd(deck, selectPayload<GitmRevertToStablePayload>(action).originScpName);
      // MULTI-SCP GITM MUXIFICATION (MC-W3 · THE SLICE-FIRST DECISION READ) — the A/B DECISION FIELDS for
      // the ORIGIN's repo (its slice for a non-pointer origin, else the flat pointer view). The failsafe
      // switches onto stableBranch + guards on currentBranch/dirty — all must be the ORIGIN's, not the
      // pointer's, or a non-pointer revert switches onto the pointer's stable (the CHIMERA).
      const decision = selectGitmDecisionFields(deck, opCwd);
      // MC-W3 — the active pointer dir, threaded to the reducer to gate the OUTCOME write (view law).
      const revertActiveScpDir = deck.gitm.k.activeScpDir.select();

      // 1. No stable A → cannot revert. MC-W3 — from `decision` (the ORIGIN's slice for a non-pointer origin).
      const stableBranch = decision.stableBranch;
      if (stableBranch.length === 0) {
        const guard: GitmActionResult = {
          action: 'gitmRevertToStable',
          ok: false,
          error: '',
          guardFired: true,
          reason: 'no-stable-branch',
          at: Date.now(),
        };
        bucket.push({ result: guard, advance: false, resolvedCwd: opCwd, activeScpDir: revertActiveScpDir });
        return action.strategy
          ? strategySuccess(action.strategy, strategyData_muxifyData(action.strategy, { ...guard }))
          : muxiumConclude();
      }

      // ALREADY-ON-A GUARD (#641-R · S1 DELTA 5 HAZARD · pruned card): if a prior revert
      // succeeded + restarted, the bridge is already on A. Re-calling revert here would
      // auto-commit A's tree (wrong). No-op when currentBranch === stableBranch.
      // MC-W3 — from `decision` (the ORIGIN's slice for a non-pointer origin).
      const currentBranch = decision.currentBranch;
      if (currentBranch === stableBranch) {
        const noop: GitmActionResult = {
          action: 'gitmRevertToStable',
          ok: true,
          error: '',
          guardFired: true,
          reason: 'already-on-stable',
          at: Date.now(),
        };
        bucket.push({ result: noop, advance: false, resolvedCwd: opCwd, activeScpDir: revertActiveScpDir });
        return action.strategy
          ? strategySuccess(action.strategy, strategyData_muxifyData(action.strategy, { ...noop }))
          : muxiumConclude();
      }

      // 2-3. Preserve B's state before abandoning (if dirty). MC-W3 — the ORIGIN's dirty via `decision`.
      const dirty = decision.dirty;
      if (dirty === true) {
        gitmExec(['add', '-A'], opCwd);
        gitmExec(['commit', '-m', 'gitm: auto-commit B state before revert'], opCwd);
      }

      // 4. Return to A.
      const switchExec = gitmExec(['switch', stableBranch], opCwd);
      if (!switchExec.ok) {
        const result: GitmActionResult = {
          action: 'gitmRevertToStable',
          ok: false,
          error: switchExec.error || switchExec.stderr,
          guardFired: false,
          reason: 'switch-failed',
          at: Date.now(),
        };
        bucket.push({ result, advance: false, resolvedCwd: opCwd, activeScpDir: revertActiveScpDir });
        return action.strategy
          ? strategySuccess(action.strategy, strategyData_muxifyData(action.strategy, { ...result }))
          : muxiumConclude();
      }

      // 5. Trigger the restart onto A's code. GITM SCP-SOVEREIGN · S4 Seam B — target opCwd (the
      // SCP's nodemon-watched PACKAGE dir = activeScpDir), NOT userCwd, so the failsafe restart
      // actually reloads the SCP onto A. MOVES with the branch ops.
      let writeOk = true;
      let writeErr = '';
      try {
        writeFileSync(
          resolve(opCwd, '.bridge-restart.json'),
          JSON.stringify({ hardTurnOver: true, timestamp: Date.now(), source: 'A' }, null, 2),
          'utf-8',
        );
      } catch (err: unknown) {
        writeOk = false;
        writeErr = err instanceof Error ? err.message : String(err);
      }

      const result: GitmActionResult = {
        action: 'gitmRevertToStable',
        ok: writeOk,
        error: writeOk ? '' : writeErr,
        guardFired: false,
        reason: writeOk ? '' : 'restart-write-failed',
        at: Date.now(),
      };
      bucket.push({ result, advance: writeOk, resolvedCwd: opCwd, activeScpDir: revertActiveScpDir });
      return action.strategy
        ? strategySuccess(
            action.strategy,
            strategyData_muxifyData(action.strategy, { ...result, stableBranch }),
          )
        : muxiumConclude();
    }),
});
