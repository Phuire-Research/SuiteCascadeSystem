/**
 * gitmCarryToWorkingThenServeStable Quality · C1001 · THE THIRD PATH (the user's design)
 *
 * THE SEQUENCE, VERBATIM FROM THE USER — this quality does exactly this and nothing else:
 *   *"this will Only Do the Merge to B, Checkout and Turn Over on A, Checkout Back to B.
 *     To Maintain the Stability of our A Branch Specifically."*
 *
 *   1. MERGE TO B      — commit the working drift onto the Sword (nothing discarded)
 *   2. CHECKOUT A      — the stable seat
 *   3. TURN OVER ON A  — write the restart trigger; the app reboots onto A (the STABLE RUN)
 *   4. CHECKOUT BACK TO B — armed here, fired by observation (see leg 4 below)
 *
 * WHY LEG 4 IS THE POINT, NOT A COURTESY: leaving the worktree parked on A invites drift onto the
 * guarded stable. Returning to B means A is only ever SERVED, never WORKED ON. **The stability of A
 * is maintained by never standing on it.**
 *
 * ── WHY THIS IS A SEPARATE QUALITY AND NOT A FLAG ON gitmTurnOverWithSource ──────────────────────
 * That quality's line 569 is a single hinge:
 *     const effectiveSource: 'A' | 'B' = carriedThisTurn ? 'B' : source;
 * **C791 · SERVE THE CARRY** makes a confirmed carry converge onto B ON PURPOSE — replacing *"the
 * old carry-then-switch-to-A special case that stranded the work."* Threading a flag through that
 * ternary would seat two opposing intents in one quality and put C791's default at risk on every
 * future edit. **This quality leaves C791 exactly as it is and never touches it.**
 *
 * ── C791's OBJECTION, AND WHY IT DOES NOT APPLY HERE ────────────────────────────────────────────
 * C791 retired carry-then-A because the carried work sat OUT OF VIEW on B while A was served. Two
 * things answer that here, and neither existed as a reachable path before:
 *   1. **IT IS AN EXPLICIT CHOICE.** The user picks "carry into B & serve A" from the modal knowing
 *      the work is on B. The stranding C791 feared was a SILENT consequence of a different intent.
 *   2. **THE PAIR PERSISTS.** `D-BN-2 · THE CARRY MEND` in gitmTurnOverWithSource's reducer already
 *      handles `source==='A' && carriedB.length>0` — it threads workingBranch/branchRoles/abMode so
 *      the carried B rides state → gitm.json. **The answer to C791 was already written; it simply
 *      had no path that reached it.** This reducer mirrors that branch.
 *
 * ── LEG 4 IS AN OBSERVATION, NOT A TIMER ────────────────────────────────────────────────────────
 * `armSeatReturn` + `gitmBootReportWatch` do the return-to-B: the watcher fires ONLY when the SCP
 * server's own boot-report shows `activeBranch === stableBranch` — A actually booted.
 * `seatReturnArm.model.ts` says it is *"armed on a source:'A' turn-over that carried a working B"* —
 * **this exact case.** It explicitly retired a `setTimeout` guess at when the A boot settled, which
 * is what makes the ordering safe: **B is never checked out before the build has read A's files.**
 *
 * THE FLOOR UNDER THE OBSERVATION: if A never boots, the boot-report never arrives and the seat
 * return never fires — the worktree would STAY on A, the opposite of this path's purpose. So the
 * bridge-owned deadline is armed ALONGSIDE, exactly as the A leg of gitmTurnOverWithSource does.
 *
 * Template: gitmTurnOverWithSource.quality.ts (the carry seam · the switch-first discipline · the
 * restart write · both arms) · gitmRevertToStable.quality.ts (the commit-if-dirty idiom).
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
import { recordScpRestartSignal } from '../../../scpBootTiming.model';
import { askScpGracefulExit } from '../../../scpGracefulExitAsk.model';
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { GitmState, GitmABMode } from '../gitm.types';
import type {
  GitmCarryToWorkingThenServeStablePayload,
  GitmCarryToWorkingThenServeStable,
  GitmActionResult,
} from './types';
import { gitmExec, setCurrentOp, clearCurrentOp } from '../model/gitmExec.model';
import { resolveGitmTargetCwd, selectGitmDecisionFields } from '../model/gitmOpCwd.model';
import { upsertSliceFields } from '../model/gitmSliceStore.model';
import { mintWorkingBranchName } from '../model/gitmBranchRoot.model';
import { armSeatReturn } from '../model/seatReturnArm.model';
import { armDeadline } from '../model/bridgeOwnedDeadline.model';
import { readScpConfigName } from '../../../scpConfig.model';
import { log } from '../../../debugLog';

type CarryServeBucketItem = {
  result: GitmActionResult;
  advance: boolean;
  /** The B seat the drift was carried onto. '' on every guard path (never repair to a failed seat). */
  carriedB: string;
  /** A — the branch now checked out and being served. */
  stableBranch: string;
  turnOver: { at: number; source: 'A'; hard: boolean; targetScpName: string } | null;
  resolvedCwd: string;
};

const bucket: CarryServeBucketItem[] = [];

// Mirrors gitmTurnOverWithSource:113 — a LOCAL deck shape, not an export of gitm.types.
type GitmSelfDeck = {
  gitm: Concept<GitmState, Record<string, unknown>>;
};

export const gitmCarryToWorkingThenServeStable = createQualityCardWithPayload<
  GitmState,
  GitmCarryToWorkingThenServeStablePayload,
  GitmSelfDeck
>({
  type: 'Gitm Carry To Working Then Serve Stable',
  reducer: (state) => {
    const item = bucket.pop();
    if (!item) {
      return {};
    }
    if (!item.advance) {
      // NEVER SILENT — a guard still lands its result so the rail can render the refusal.
      // The refusal rides the returned partial (bridge-global); nothing repo-specific changed.
      return { lastActionResult: item.result };
    }
    // D-BN-2 · THE CARRY MEND, MIRRORED. A real working B now exists and holds the carried work, so
    // the PAIR must persist in state (→ the GITEP snapshot → gitm.json). Without this the carried B
    // never threads through and the relay reports a stranded pair — precisely C791's objection.
    // `turnOverAttempt: 'carry-A'` is the marker the reboot rehydration already recognizes.
    const partial: Partial<GitmState> = {
      abMode: 'turned-over' as GitmABMode,
      turnedOverTo: 'A' as const,
      workingBranch: item.carriedB,
      branchRoles: { a: item.stableBranch, b: item.carriedB },
      lastActionResult: item.result,
      turnOverAttempt: { source: 'carry-A' as const, targetBranch: item.carriedB, ts: Date.now() },
      ...(item.turnOver ? { turnOver: item.turnOver } : {}),
    };
    if (item.resolvedCwd !== '') {
      // SLICE FIELDS ONLY — `lastActionResult` is bridge-global, not per-repo (GitmRepoSlice omits
      // it on purpose), so it rides the returned partial and never the slice.
      upsertSliceFields(item.resolvedCwd, {
        abMode: partial.abMode,
        turnedOverTo: partial.turnedOverTo,
        workingBranch: partial.workingBranch,
        branchRoles: partial.branchRoles,
        turnOverAttempt: partial.turnOverAttempt,
        ...(item.turnOver ? { turnOver: item.turnOver } : {}),
      });
    }
    return partial;
  },
  methodCreator: () =>
    createMethodWithConcepts(({ action, deck }) => {
      const payload = selectPayload<GitmCarryToWorkingThenServeStablePayload>(action);
      const originScpName = payload?.originScpName;
      const opCwd = resolveGitmTargetCwd(deck, originScpName);
      // MC-W3 · THE SLICE-FIRST DECISION READ — resolved FOR opCwd, never off the flat pointer
      // selectors: a non-pointer origin must decide against ITS OWN branches, not the active view's.
      const decision = selectGitmDecisionFields(deck, opCwd);
      const stableBranch = decision.stableBranch;
      // D-TOH H1+H3 · THE NAME-FIRST LAW — identity from the resolved dir's own scp.config.json.
      const targetScpName = readScpConfigName(opCwd) ?? originScpName ?? '';

      log('gitm.carryserve.invoked', { opCwd, stableBranch, targetScpName });

      const fail = (reason: string, error = ''): GitmActionResult => {
        const guard: GitmActionResult = {
          action: 'gitmCarryToWorkingThenServeStable',
          ok: false,
          error,
          guardFired: true,
          reason,
          at: Date.now(),
        };
        log('gitm.carryserve.guard', { reason, error: error.slice(0, 200) });
        bucket.push({ result: guard, advance: false, carriedB: '', stableBranch, turnOver: null, resolvedCwd: opCwd });
        return guard;
      };

      const conclude = (r: GitmActionResult) =>
        action.strategy
          ? strategySuccess(action.strategy, strategyData_muxifyData(action.strategy, { ...r }))
          : muxiumConclude();

      // GUARD 0 · a stable branch must be known — without A there is nothing to serve.
      if (stableBranch.length === 0) {
        return conclude(fail('stable-branch-unknown'));
      }

      setCurrentOp({
        message: `Carrying into B, then serving ${stableBranch}…`,
        command: `git switch ${stableBranch}`,
      });
      try {
        // ── LEG 1 · MERGE TO B ──────────────────────────────────────────────────────────────────
        // Resolve the B seat: the known working branch, else mint one (the FIRST-CARRY case — drift
        // on the stable with no B yet still deserves a home rather than a refusal).
        const knownB = decision.workingBranch;
        const carriedB = knownB.length > 0 ? knownB : mintWorkingBranchName(stableBranch);
        const bExists =
          gitmExec(['rev-parse', '--verify', '--quiet', carriedB], opCwd).ok === true;

        // Switch ONTO B carrying the dirty tree (git switch carries drift when files do not
        // collide). NO STASH on this leg — a stash would strip the very drift the carry preserves.
        let onto = bExists
          ? gitmExec(['switch', carriedB], opCwd)
          : gitmExec(['switch', '-c', carriedB], opCwd);
        if (!onto.ok) {
          // The telemetry net: Cascades/Bridge churn is regenerated on the next write, so discarding
          // it is LOSSLESS — and SCOPED, never beyond it (the real cargo must survive).
          log('gitm.carryserve.carry-switch-retry', { carriedB, error: (onto.error || onto.stderr).slice(0, 200) });
          gitmExec(['checkout', '--', 'Cascades/Bridge'], opCwd);
          onto = bExists
            ? gitmExec(['switch', carriedB], opCwd)
            : gitmExec(['switch', '-c', carriedB], opCwd);
        }
        if (!onto.ok) {
          // THE ONTO-FAILURE GUARD — never fall through silently, and NEVER switch to A on a failed
          // carry: that would serve the stable while the user's work sat uncommitted on a tree we
          // just walked away from. This is the one refusal that protects the work itself.
          return conclude(fail('carry-switch-failed', onto.error || onto.stderr));
        }
        gitmExec(['add', '-A'], opCwd);
        const carryCommit = gitmExec(
          ['commit', '-m', 'gitm: carry changes into B — serving A'],
          opCwd,
        );
        // Best-effort by design: an already-clean carried tree returns non-ok and the seat still
        // holds. The seat landing is what matters, not whether there was anything new to commit.
        log('gitm.carryserve.carry-landed', { carriedB, committed: carryCommit.ok });

        // ── LEG 2 · CHECKOUT A ──────────────────────────────────────────────────────────────────
        // SWITCH FIRST, ALWAYS. The restart trigger is NEVER written before the checkout succeeds —
        // writing it on a failed switch reboots the app onto the wrong branch.
        const toStable = gitmExec(['switch', stableBranch], opCwd);
        if (!toStable.ok) {
          // The carry ALREADY LANDED, so the work is safe on B — say so in the refusal rather than
          // leaving the operator to wonder whether their changes survived.
          log('gitm.carryserve.stable-switch-failed', { stableBranch, carriedB });
          return conclude(fail('stable-switch-failed', toStable.error || toStable.stderr));
        }

        // ── LEG 3 · TURN OVER ON A ──────────────────────────────────────────────────────────────
        const turnOverStamp = { at: Date.now(), source: 'A' as const, hard: true, targetScpName };
        // THE OPENING BRACKET — stamped BEFORE the write so the clock starts at the decision.
        recordScpRestartSignal(targetScpName, 'gitm-carry-serve-A');
        // C992 · the graceful ask, issued before the write and never awaited (the route answers
        // before it releases, so awaiting proves receipt and nothing about the release).
        askScpGracefulExit(opCwd, 'gitm-carry-serve-A');
        let writeOk = true;
        let writeErr = '';
        try {
          writeFileSync(
            resolve(opCwd, '.bridge-restart.json'),
            JSON.stringify(
              {
                hardTurnOver: true,
                timestamp: Date.now(),
                source: 'A',
                writerLeg: 'gitmCarryToWorkingThenServeStable',
                writerPid: process.pid,
                carriedB,
              },
              null,
              2,
            ),
            'utf-8',
          );
        } catch (err: unknown) {
          writeOk = false;
          writeErr = err instanceof Error ? err.message : String(err);
        }

        // ── LEG 4 · ARM THE RETURN TO B (fired by OBSERVATION, not by a clock) ──────────────────
        // gitmBootReportWatch checks out `workingBranch` once the SCP's own boot-report shows
        // activeBranch === stableBranch. That is what makes leg 4 safe: B is never checked out
        // before the build has read A's files.
        if (writeOk) {
          log('gitm.carryserve.seat-armed', { opCwd, workingBranch: carriedB, stableBranch });
          armSeatReturn({ workingBranch: carriedB, stableBranch });
          // THE FLOOR under the observation: if A never boots the report never arrives and the seat
          // return never fires — the worktree would stay parked on A, the opposite of this path's
          // purpose. The deadline is the only thing that reverts in that case.
          armDeadline(stableBranch, targetScpName);
        }

        const result: GitmActionResult = {
          action: 'gitmCarryToWorkingThenServeStable',
          ok: writeOk,
          error: writeErr,
          guardFired: false,
          reason: '',
          at: Date.now(),
        };
        bucket.push({
          result,
          advance: writeOk,
          carriedB,
          stableBranch,
          turnOver: writeOk ? turnOverStamp : null,
          resolvedCwd: opCwd,
        });
        log('gitm.carryserve.complete', { carriedB, stableBranch, writeOk });
        return conclude(result);
      } finally {
        clearCurrentOp();
      }
    }),
});

export type { GitmCarryToWorkingThenServeStable };
