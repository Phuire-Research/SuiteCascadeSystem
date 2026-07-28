/**
 * gitmTurnOverWithSource Quality · GITM A↔B (#641) · switch THEN write .bridge-restart.json
 *
 * The turn-over: checkout the source branch, THEN trigger the nodemon restart. The order
 * is CRITICAL — if the restart fires before the checkout, nodemon rebuilds the WRONG
 * branch's code (S4 Green Seam 3c · C3 control-flow order). Single synchronous method
 * (no Stratimux interleaving between the two steps):
 *   1. targetBranch = source === 'B' ? workingBranch : stableBranch.
 *   2. GUARDSHUNT: targetBranch empty → guardFired { reason: 'target-branch-empty' }.
 *   3. gitmExec(['switch', targetBranch]) — idempotent (already on B after create-working;
 *      switches back to A during the manual A-source path). Failure → guardFired
 *      { reason: 'switch-failed' } (the .bridge-restart.json is NEVER written on a failed
 *      switch — that would restart the wrong branch).
 *   4. fsSync.writeFileSync(<userCwd>/.bridge-restart.json, { hardTurnOver, timestamp,
 *      source }) — synchronous (the BRTF precedent · triggerHardTurnOver writes the whole
 *      file; the synchronous write completes before nodemon processes the change).
 *
 * C791 · SERVE THE CARRY — the confirmed WATCHKEY carry no longer serves A while the carried work
 * sits out of view on B. After the carry commits the drift onto the carried B seat, the turn-over
 * TARGETS THAT B: the app reboots ONTO B (the user sees their changes) and A stays the guarded stable
 * (revert available). The confirmed-carry path CONVERGES onto the plain B turn-over semantics
 * (abMode 'turned-over' · seat already home on B · the 45s bridge-owned deadline arms) instead of the
 * old carry-then-switch-to-A special case that stranded the work.
 *
 * Template: gitmBranchSwitch.quality.ts (switch + GUARDSHUNT) · gitmCommit.quality.ts (bucket).
 * Citation: GITM-AB-S3-YELLOW-BLUEPRINT.md §W1c Quality 3 · triggerHardTurnOver.quality.huirth.diameter.ts:46 (BRTF).
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
import { writeFileSync, existsSync, lstatSync, realpathSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { execSync } from 'node:child_process';
import type { GitmState, GitmABMode } from '../gitm.types';
import type {
  GitmTurnOverWithSourcePayload,
  GitmTurnOverWithSource,
  GitmActionResult,
  PendingConfirm,
} from './types';
import { gitmExec, setCurrentOp, clearCurrentOp } from '../model/gitmExec.model';
import { resolveGitmTargetCwd, selectGitmDecisionFields } from '../model/gitmOpCwd.model';
// MULTI-SCP GITM MUXIFICATION (MC-W2 step 9) — mirror the A/B role writes onto the CALLING SCP's slice.
// MD-C M7 · getSlice — the WATCHKEY confirm-token lifecycle moves to the ORIGIN's home (issue AND
// validate), so a non-pointer origin's confirm dialog renders on ITS OWN surface, never the pointer's.
import { getSlice, upsertSliceFields } from '../model/gitmSliceStore.model';
import { isWorkingBranchFor, mintWorkingBranchName } from '../model/gitmBranchRoot.model';
import { issueToken, validateToken } from '../model/gitmConfirmToken.model';
import { armSeatReturn, disarmSeatReturn } from '../model/seatReturnArm.model';
// GITM Dev Epoch (MD-E · THE C318 FOLD) — the bridge-owned deadline is armed/disarmed ALONGSIDE the
// seat-return arm (the FLOOR under the observation · composed with the seat-law · never breaks it).
import { armDeadline, disarmDeadline } from '../model/bridgeOwnedDeadline.model';
import { log } from '../../../debugLog';

export type { GitmTurnOverWithSource };

interface TurnOverBucketItem {
  result: GitmActionResult;
  source: 'A' | 'B';
  targetBranch: string; // the RESOLVED target — the reducer repairs workingBranch on a B advance
  advance: boolean; // true only when the switch + write fully succeeded
  // THE-TURN-OVER-A-GUARD (WATCHKEY) — the call-1 pending token to surface (null on every other
  // path) + the call-2 clear flag (clear pendingConfirm once the confirmed carry+switch ran).
  // Mirrors gitmBranchDelete's BranchDeleteBucketItem { pendingConfirm, clearPending }.
  pendingConfirm: PendingConfirm | null;
  clearPending: boolean;
  // D-BN-2 · THE CARRY MEND — the B seat the confirmed carry landed the drift onto (the
  // A-CLEAN carry seam commits into carriedB before the A switch). '' on every path EXCEPT the
  // confirmed-carry A-advance: the reducer threads it into workingBranch/branchRoles/abMode so
  // the carried B rides state → the GITEP snapshot → gitm.json (the carry no longer strands).
  carriedB: string;
  // D-BN-2 · THE turnOver RELOCATION — the turn-over restart signal, stamped ONLY on the ADVANCE
  // path (a successful switch + restart write). The reducer writes it into the returned partial so
  // it rides the GITEP snapshot → gitm.json; the SCP field-watcher sees turnOver.at advance. null
  // on every non-advance path (the signal fires only when the turn-over actually landed).
  turnOver: { at: number; source: string; hard: boolean } | null;
  // MULTI-SCP GITM MUXIFICATION (MC-W2 step 9) — the RESOLVED turn-over cwd (origin-aware) + the ACTIVE
  // dir. The A/B ROLE writes (branchRoles/abMode/turnedOverTo/workingBranch/turnOver) are the CHIMERA's
  // core — the reducer mirrors them onto the CALLING SCP's slice so GITEP fans out its OWN roles (not
  // the active SCP's). Only the active SCP also writes the flat state (the materialized-view law).
  resolvedCwd: string;
  activeScpDir: string;
  // MD-C M8 · THE ORIGIN PAIR (the C575 roles.a='master' recurrence): the ADVANCE partials built
  // branchRoles/abMode from state.stableBranch/state.workingBranch — POINTER-FLAT reads. A
  // non-pointer origin's advance stamped the POINTER's stable into ITS OWN slice roles via the
  // MC-W2 mirror (partial carries the contamination). Thread the ORIGIN's pair (M3 decision
  // fields) so the partial is built from the ORIGIN's truth. Optional: only the advance push
  // sets them; the reducer falls back to state.* (the pointer path — identical values there).
  originStableBranch?: string;
  originWorkingBranch?: string;
}

const bucket: TurnOverBucketItem[] = [];

type GitmSelfDeck = {
  gitm: Concept<GitmState, Record<string, unknown>>;
};

export const gitmTurnOverWithSource = createQualityCardWithPayload<
  GitmState,
  GitmTurnOverWithSourcePayload,
  GitmSelfDeck
>({
  type: 'Gitm Turn Over With Source',
  reducer: (state) => {
    const item = bucket.pop();
    if (!item) {
      return {};
    }
    if (!item.advance) {
      // THE-TURN-OVER-A-GUARD (WATCHKEY call 1) — surface the freshly-minted pending token so
      // call 2 can carry it back (the durable PROHIBITION home is GitmState.pendingConfirm ·
      // gitmBranchDelete.quality.ts:87 precedent). null on every non-guard failure path.
      // MD-C M7 · THE ORIGIN-ROUTED CONFIRM TOKEN (the C574 field find): the token landed on the
      // FLAT view ungated (an MC-W3-era decision from before sovereign rails — "the dialog is
      // presented to whichever client is interacting"). With per-SCP rails, each SCP's dialog
      // reads ITS OWN gitm.json — a non-pointer origin's token relayed to the POINTER's rail and
      // the confirm screen rendered on the WRONG SCP. Mirror the token onto the ORIGIN's slice;
      // gate the flat write to the pointer (the materialized-view law).
      if (item.pendingConfirm) {
        if (item.resolvedCwd !== '') {
          upsertSliceFields(item.resolvedCwd, { pendingConfirm: item.pendingConfirm });
        }
        const tokenIsActiveView =
          item.activeScpDir === '' || item.resolvedCwd === item.activeScpDir || item.resolvedCwd === '';
        if (!tokenIsActiveView) {
          return { lastActionResult: item.result };
        }
        return { lastActionResult: item.result, pendingConfirm: item.pendingConfirm };
      }
      return { lastActionResult: item.result };
    }
    // THE-TURN-OVER-A-GUARD (WATCHKEY call 2) — the confirmed carry+switch ran; clear the token
    // (a one-shot PROHIBITION · gitmBranchDelete.quality.ts:91 precedent).
    const clearPending = item.clearPending ? { pendingConfirm: null } : {};
    // D-BN-2 · THE turnOver RELOCATION — stamp the turn-over signal onto gitm.json state (the SCP
    // field-watcher's home moved here from the per-SCP bridge.json). Spread into every ADVANCE
    // return; item.turnOver is non-null only on a successful switch + restart write.
    const turnOverPartial = item.turnOver ? { turnOver: item.turnOver } : {};

    // Build the ADVANCE partial (the A/B role write) into a variable so the MC-W2 slice mirror + the
    // materialized-view gate can be applied ONCE below (instead of at each return path).
    // MD-C M8 · THE ORIGIN PAIR — the partial reads the ORIGIN's stable/working (bucket-threaded
    // from the M3 decision fields), never the pointer-flat state.* (the roles.a='master'
    // recurrence: a non-pointer advance stamped the POINTER's stable into its own slice).
    const originStable = item.originStableBranch ?? state.stableBranch;
    const originWorking = item.originWorkingBranch ?? state.workingBranch;
    let partial: Partial<GitmState>;
    if (item.source === 'A') {
      // D-BN-2 · THE CARRY MEND — the confirmed carry landed the drift on a B seat (item.carriedB
      // non-empty). This A-advance is NOT a bare RETURN-TO-GROUND: a real working B now exists and
      // holds the carried work, so the pair must PERSIST in state (workingBranch/branchRoles/abMode
      // → gitm.json). Without this the carried B never threaded into state and the GITEP snapshot
      // relayed a stranded pair. turnOverAttempt marks it 'carry-A' so the reboot rehydration can
      // recognize + restore it (UNLIKE a plain 'A' the A-GUARD grounds).
      if (item.carriedB.length > 0) {
        partial = {
          abMode: 'turned-over' as GitmABMode,
          turnedOverTo: 'A' as const,
          workingBranch: item.carriedB,
          branchRoles: { a: originStable, b: item.carriedB },
          lastActionResult: item.result,
          turnOverAttempt: { source: 'carry-A' as const, targetBranch: item.carriedB, ts: Date.now() },
          ...clearPending,
          ...turnOverPartial,
        };
      } else {
        // THE PHANTOM FIX (Cycle 263 · user 068 finding): an A turn-over is a RETURN TO GROUND,
        // not a B-proving event — advancing to 'turned-over' lit the Confirm-B-Success button with
        // NO B ever turned over (the direction-agnostic abMode skew). With no working B the machine
        // is simply idle again; with a B present the pair persists (B stays the unproven candidate).
        // F-b · THE SEAT LAW (Cycle 299): when a working B is present the A-prove is TRANSIENT — the
        // method scheduled a source:'B' auto-return; this state ('candidate-created' · the pair
        // persists) is the momentary A-proving-ground before the working seat returns to B.
        // D-BN · branchRoles LOCKSTEP — an A-prove doesn't move the pair (workingBranch preserved); keep
        // roles aligned to the live pointers (a=stable, b=working) so the truth stays coherent.
        partial = {
          abMode: (originWorking ? 'candidate-created' : 'idle') as GitmABMode,
          turnedOverTo: 'A' as const,
          branchRoles: { a: originStable, b: originWorking },
          lastActionResult: item.result,
          // C412 · THE ATTEMPT LEDGER — the A attempt recorded durably (gitm.json projection).
          // The rehydration's A-GUARD ensures this can never restore merge-enabling state.
          turnOverAttempt: { source: 'A' as const, targetBranch: item.targetBranch, ts: Date.now() },
          ...clearPending,
          ...turnOverPartial,
        };
      }
    } else {
      // C791 · SERVE THE CARRY — the confirmed carry lands here (effectiveSource 'B') with item.carriedB
      // non-empty: the app reboots ONTO B. Stamp the attempt 'carry-B' (UNLIKE a plain 'B' turn-over) so
      // the reboot rehydration reads the carried B seat truthfully — the boot-report proof gate restores
      // 'turned-over' the same way a 'B'/'carry-A' attempt does. A plain B turn-over (no carry) keeps 'B'.
      const bAttemptSource: 'B' | 'carry-B' = item.carriedB.length > 0 ? 'carry-B' : 'B';
      partial = {
        abMode: 'turned-over' as GitmABMode,
        turnedOverTo: item.source, // #641-R — 'A' | 'B' direction the UI reads (S1 §6 fix)
        // C412 · THE ATTEMPT LEDGER — the B attempt recorded durably BEFORE the SCP reboots;
        // on a bridge restart the rehydration checks it against the boot-report activeBranch
        // and restores 'turned-over' (the gate the C326 observed-proof circuit reads).
        turnOverAttempt: { source: bAttemptSource, targetBranch: item.targetBranch, ts: Date.now() },
        // THE B-PATH REPAIR (Cycle 265): the Move-into-B chain reaches here with workingBranch=''
        // (gitm_branch_create never wrote it) — the resolved target IS the working B; persist it so
        // Confirm-B/Merge/the A-revert all see the pair.
        workingBranch: item.targetBranch || originWorking,
        // D-BN · branchRoles LOCKSTEP — the B seat resolved here becomes roles.b (a=stable preserved).
        branchRoles: { a: originStable, b: item.targetBranch || originWorking },
        lastActionResult: item.result,
        ...clearPending,
        ...turnOverPartial,
      };
    }

    // MULTI-SCP GITM MUXIFICATION (MC-W2 step 9) — mirror the A/B ROLE writes onto the CALLING SCP's
    // slice (the CHIMERA's core: branchRoles/abMode/turnedOverTo/workingBranch/turnOver). GITEP fans
    // out ITS OWN roles from the slice (MC-W3). Then the materialized-view gate: only the ACTIVE SCP
    // (or the no-SCP dev path) writes the flat state — a NON-active SCP's turn-over must NOT clobber the
    // flat branchRoles/abMode (the dock badge + the B turn-over gate read them) with alien roles.
    if (item.resolvedCwd !== '') {
      upsertSliceFields(item.resolvedCwd, {
        ...(partial.abMode !== undefined ? { abMode: partial.abMode } : {}),
        ...(partial.turnedOverTo !== undefined ? { turnedOverTo: partial.turnedOverTo } : {}),
        ...(partial.workingBranch !== undefined ? { workingBranch: partial.workingBranch } : {}),
        ...(partial.branchRoles !== undefined ? { branchRoles: partial.branchRoles } : {}),
        ...(partial.turnOverAttempt !== undefined ? { turnOverAttempt: partial.turnOverAttempt } : {}),
        ...(partial.turnOver !== undefined ? { turnOver: partial.turnOver } : {}),
        // M7 — the confirmed carry consumed the token: clear it from the ORIGIN's home too.
        ...(item.clearPending ? { pendingConfirm: null } : {}),
      });
    }
    const isActiveView =
      item.activeScpDir === '' || item.resolvedCwd === item.activeScpDir || item.resolvedCwd === '';
    if (!isActiveView) {
      // A non-active SCP turned over — its roles live in its slice only; the flat state stays the
      // active SCP's view. Still surface the action result so the caller's tail reads the outcome.
      return { lastActionResult: item.result };
    }
    return partial;
  },
  methodCreator: () =>
    createMethodWithConcepts(({ action, deck }) => {
      try {
      const { source, confirmToken, originScpName } = selectPayload<GitmTurnOverWithSourcePayload>(action);
      // GITM SCP-SOVEREIGN — the turn-over operates on the ACTIVE SCP's own RED repo. The branch
      // ops AND the .bridge-restart.json write BOTH target this cwd (S4 Seam B · the LOAD-BEARING
      // safety): the restart trigger MUST land in the SCP's own nodemon-watched dir (activeScpDir =
      // the SCP PACKAGE dir, where nodemon.json watches .bridge-restart.json) or the branch switches
      // but the SCP never restarts (silent stale code). selectGitmOpCwd = activeScpDir || userCwd
      // (the userCwd fallback keeps a no-SCP turn-over from crashing). The branch ops run from the
      // package dir and resolve UP to the parent RED .git.
      // MULTI-SCP GITM MUXIFICATION (MC-W1) — the turn-over (branch ops + .bridge-restart.json write)
      // targets the CALLING SCP's own RED repo (origin-aware) so a non-active SCP's turn-over restarts
      // ITS OWN nodemon-watched dir · SCP-Sovereign fallback (activeScpDir || userCwd) when no origin.
      // RESOLVED ONCE, above the invocation log, so the DECISION reads AND the log both show the ORIGIN.
      const opCwd = resolveGitmTargetCwd(deck, originScpName);
      // MULTI-SCP GITM MUXIFICATION (MC-W2 step 9) — the active dir, threaded to the reducer so it can
      // mirror the A/B role writes onto the CALLING SCP's slice + gate the flat-state write (view law).
      const turnOverActiveScpDir = deck.gitm.k.activeScpDir.select();
      // MULTI-SCP GITM MUXIFICATION (MC-W3 · THE SLICE-FIRST DECISION READ · the field-log defect cure):
      // the A/B DECISION FIELDS resolved FOR opCwd — the ORIGIN's slice when opCwd is a non-pointer target
      // with a live rail, else the flat pointer view. This is THE FIX: previously every decision read
      // (currentBranch/workingBranch/stableBranch/dirty/branchRoles) came off the flat deck selectors (the
      // ACTIVE pointer's view), so a non-pointer origin's turn-over decided against the pointer's branches
      // and switched onto a nonexistent branch. Resolved ONCE here; the sdia log below + every guard/carry/
      // resolve seam consume THESE fields, never the flat selectors.
      const decision = selectGitmDecisionFields(deck, opCwd);
      // DIAGNOSTIC (043 · prune after the turn-over Lambda) — INVOCATION SIGNAL. The presence of
      // this line in <install>/Cascades/Bridge/debug.json proves the turn-over request reached the
      // BRIDGE quality (the client gate at scsBridgeGitmAction.principle.client.ts:65 + the MCP
      // fetch both fired). Its ABSENCE on a Turn-Over click means the client-side chain swallowed
      // it (read the SCP browser console '[SCS-Bridge GITM]' lines for which client seam). The
      // fields capture WHICH bridge guard will fire: targetBranch.length===0 → 'target-branch-empty';
      // source==='A' && currentBranch===stableBranch && dirty → 'a-dirty-spin-to-b'.
      // MC-W3 — the branch fields now come from `decision` (the ORIGIN's slice for a non-pointer origin)
      // so the log shows the ORIGIN's branches, not the pointer's (the field-log defect made visible).
      log('gitm.turnover.invoked', {
        source,
        writerPid: process.pid,
        writerDaemonCwd: process.cwd(),
        opCwd,
        currentBranch: decision.currentBranch,
        workingBranch: decision.workingBranch,
        stableBranch: decision.stableBranch,
        dirty: decision.dirty,
        abMode: decision.abMode,
        targetBranch: source === 'B' ? decision.workingBranch : decision.stableBranch,
      });

      const deckCurrentBranch = decision.currentBranch;
      const workingBranch = decision.workingBranch;
      const stableBranch = decision.stableBranch;
      const dirty = decision.dirty;
      // D-BN-5 · MEANINGFUL DRIFT (the user's law: no changes → turn over to A safely, NO overlay).
      // The state `dirty` flag counts the Cascades/Bridge telemetry the bridge itself rewrites
      // continuously — a tree dirty ONLY in that class has nothing worth carrying (the switch nets
      // discard it losslessly). Probe porcelain live and exclude the telemetry class; the A-guard
      // + the carry seams below trigger on THIS, never on bare `dirty` anor on being-on-B alone.
      const drdriftProbe = gitmExec(['status', '--porcelain'], opCwd);
      const meaningfulDrift = drdriftProbe.ok
        ? drdriftProbe.stdout.split('\n').some((line) => {
            const entry = line.trim();
            if (entry.length === 0) return false;
            const entryPath = entry.replace(/^[A-Z?! ]{1,2}\s+/i, '');
            return !entryPath.includes('Cascades/Bridge');
          })
        : dirty; // probe failed — fall back to the state flag (conservative)
      // D-BN · THE branchRoles SWEEP — roles.b is the canonical working-B truth every role decision
      // below (isWorkingBranchFor) consults; prefix inference is the fallback only when it's unassigned.
      // MC-W3 — from `decision` (the ORIGIN's slice for a non-pointer origin), not the flat pointer view.
      const knownB = decision.branchRoles.b;

      // F-a/c · THE SIGNIFIER FALLBACK (Cycle 299 · the A/B Law · the 085 silent no-op). The
      // B-PATH RESUME ROOT below recovers a lost workingBranch from currentBranch — but a COLD
      // START before STARC writes the deck currentBranch leaves it '' → the empty-target no-op
      // (the signifier is on disk but not yet in state). Read `git branch --show-current` via the
      // gitmExec seam (the gitmAutoInductAB:145 pattern · git is the timing-independent authority)
      // as the fallback ONLY when the deck currentBranch is empty. The signifier persists while
      // the branch does.
      let currentBranch = deckCurrentBranch;
      if (currentBranch.length === 0) {
        const branchProbe = gitmExec(['branch', '--show-current'], opCwd);
        currentBranch = branchProbe.ok ? branchProbe.stdout.trim() : '';
      }

      // 1. Resolve the target branch from the source flag.
      // THE B-PATH RESUME ROOT (Cycle 265 · 067/069): the Move-into-B chain creates+checks-out the
      // new b/ via gitm_branch_create, which never wrote workingBranch state — so source='B'
      // resolved targetBranch='' → the empty-target guard → advance:false → NO .bridge-restart.json
      // — while nodemon restarted anyway off the checkout's tree change. The SCP cycled OUTSIDE the
      // turn-over protocol and the reload/dismiss leg never engaged: the stalled overlay. FALLBACK:
      // when git is ALREADY ON a b/ branch, that branch IS the B target (recognition, mirror of the
      // BASEANCHOR re-induct arm). The bucket carries the resolved target so the reducer REPAIRS
      // workingBranch state on a B advance.
      // D-BN · THE branchRoles SWEEP — the B-resume fallback recognizes the on-disk B via roles.b
      // (isWorkingBranchFor · roles equality when set, `b/`-prefix fallback for legacy) — the prefix
      // never decides the role, roles.b does.
      const resolvedTargetBranch =
        source === 'B'
          ? workingBranch || (isWorkingBranchFor(currentBranch, knownB) ? currentBranch : '')
          : stableBranch;

      // THE-TURN-OVER-A-GUARD (WATCHKEY · the working-seat-is-B Law). THE LAW: the working seat is
      // B; changes made while working belong to B. When Turn Over A fires with working changes — a
      // working B exists AND the tree is dirty (drift on the stable A · the move-into-B case) ANOR
      // the checkout is on a b/* branch (the return-from-B case) — the switch must NOT proceed
      // silently. Hold it behind the double-confirm token (same WATCHKEY round as gitmBranchDelete
      // -D · issueToken/validateToken · PARAMSEAL sealed to { source } · BURNTIME 120s):
      //   call 1 (no valid token) → guardFired 'a-turnover-needs-confirmation' + token issued (the
      //     result reaches gitm.json so the client presents the intrusive center-vision dialog · the
      //     FailureNode Doctrine · advance:false so NO switch, NO .bridge-restart.json).
      //   call 2 (valid token)    → the carry seams below run (PRECOMMIT-B commits an on-b/* tree in
      //     place; the A-CLEAN move-into-B carries an on-master dirty tree into a fresh b/) THEN the
      //     switch + restart proceed (the C299/C300 Seat-Law auto-return then brings the seat home to
      //     B). CLEAN A on master with NO drift → this guard is SKIPPED (plain A turn-over · unchanged);
      //     the C302 CONSOLIDATION (Cycle 312) widened the trigger to working-changes-alone so the
      //     first-carry (dirty·no-B) case ALSO takes the confirm round + the canonical b/ mint.
      let aTurnOverConfirmed = false;
      // D-BN-2 · THE CARRY MEND — the B seat the confirmed carry lands the drift onto, hoisted to
      // METHOD scope so the ADVANCE bucket.push at the bottom can thread it into the reducer (the
      // carry seam below sets it; '' means no carry ran → the reducer keeps existing behavior).
      let carriedBForBucket = '';
      // THE C302 CONSOLIDATION (Cycle 312 · the namespace-schism cure). GATE WIDENED: an A turn-over
      // with working changes — dirty (drift on the stable A · INCLUDING the C311 FIRST-CARRY case where
      // NO B exists yet) ANOR on a b/* branch — ALWAYS warrants the confirm round. The retired button
      // panel handled the first-carry (dirty·no-B) case by minting the legacy gitm/b-<ts> namespace
      // (blind to isWorkingBranch → the stranded-carry defect); now the confirmed carry seam below
      // (:A-CLEAN gate) mints the ONE canonical b/<stable>-<ts> for the no-B case too. So the token
      // round no longer gates on workingBExists — the presence of working changes IS the trigger.
      // D-BN-5 — the trigger is MEANINGFUL drift alone: a clean tree on B turns over to A safely
      // (no overlay); telemetry-only dirt rides the switch nets. The C302 on-b/* condition is
      // retired — the seat's location never warrants the confirm round, only carriable changes do.
      if (source === 'A' && meaningfulDrift) {
        {
          const sealParams = { action: 'gitmTurnOverWithSource', source };
          // MC-W3 law preserved: the token READ MUST match its WRITE home. MD-C M7 moved the write
          // home to the ORIGIN (a non-pointer origin's token lives on ITS slice; the pointer's on
          // the flat view) — so the read follows: slice-first for a non-pointer origin, flat for
          // the pointer/cold-rail. The issue↔validate lifecycle stays in ONE home per origin.
          const pendingSlice =
            opCwd !== '' && opCwd !== turnOverActiveScpDir ? getSlice(opCwd) : undefined;
          const pending = pendingSlice !== undefined
            ? pendingSlice.pendingConfirm
            : deck.gitm.k.pendingConfirm.select();
          const validation =
            confirmToken !== undefined && confirmToken !== ''
              ? validateToken(pending, 'gitmTurnOverWithSource', sealParams, confirmToken)
              : 'mismatch';
          if (validation !== 'ok') {
            const token = issueToken('gitmTurnOverWithSource', sealParams);
            const guard: GitmActionResult = {
              action: 'gitmTurnOverWithSource',
              ok: false,
              error: '',
              guardFired: true,
              reason:
                validation === 'expired'
                  ? 'a-turnover-confirm-expired'
                  : 'a-turnover-needs-confirmation',
              at: Date.now(),
            };
            log('gitm.turnover.a-guard.held', { currentBranch, workingBranch, dirty });
            bucket.push({
              result: guard,
              source,
              targetBranch: resolvedTargetBranch,
              advance: false,
              pendingConfirm: token,
              clearPending: false,
              carriedB: '',
              turnOver: null,
              resolvedCwd: opCwd,
              activeScpDir: turnOverActiveScpDir,
            });
            return action.strategy
              ? strategySuccess(
                  action.strategy,
                  strategyData_muxifyData(action.strategy, { ...guard, confirmToken: token.token, source }),
                )
              : muxiumConclude();
          }
          aTurnOverConfirmed = true;
        }
      }

      // PRECOMMIT-B (the carry seam · on-b/* case) — commit the working tree INTO B in place before
      // returning to A. Fires on the return-from-B path (currentBranch === workingBranch, dirty).
      if (source === 'A' && currentBranch === workingBranch && meaningfulDrift) {
        gitmExec(['add', '-A'], opCwd);
        gitmExec(['commit', '-m', 'gitm: auto-commit B before returning to A'], opCwd);
      }

      // A-CLEAN TURN-OVER GATE (Sword epoch · the authoritative GUARDSHUNT). When ON the stable A
      // itself with a dirty tree, an A-source turn-over would re-baseline A from uncommitted drift
      // — the doctrine holds A pristine, so the drift must be routed to the Sword (spin-to-B), NOT
      // committed onto A by a turn-over. Scoped to currentBranch === stableBranch so it fires on a
      // DIFFERENT branch than PRECOMMIT-B above (which fires on currentBranch === workingBranch),
      // never double-committing nor colliding. Fires after the target-resolve, before the switch.
      // THE-TURN-OVER-A-GUARD carry: when the confirm token cleared the guard (aTurnOverConfirmed)
      // the LAW says CARRY the drift INTO B, not spin-and-halt — create+switch a fresh b/ carrying
      // the drift (git switch -c · dirty-safe) THEN commit it there, so the subsequent switch to A
      // leaves a committed B behind (the C300 Seat-Law auto-return then lands the seat back on it).
      if (source === 'A' && currentBranch === stableBranch && meaningfulDrift) {
        if (aTurnOverConfirmed) {
          // D-BN · THE branchRoles SWEEP · THE NESTING ORIGIN — mint `b/<A>-<uuid>` from stableBranch
          // VERBATIM (no prefix stripping). When stableBranch is itself a `b/` branch legally assigned
          // as A, this mints a `b/b/…-uuid` child that carries the drift and merges back into A as
          // origin — compounding is LEGAL by doctrine (the lineage records the pairing), roles.b is the
          // role truth. UUID replaces Date.now().
          // D-BN-2 · THE CARRY MEND — RESOLUTION ORDER: prefer the canonical roles.b (knownB · the
          // branchRoles SWEEP truth), then the live workingBranch pointer, then mint a fresh b/.
          // The prior code read workingBranch first and NEVER consulted roles.b, so a paired B whose
          // pointer had drifted empty minted a NEW b/ and stranded the real carried B.
          const carriedB =
            knownB.length > 0
              ? knownB
              : workingBranch.length > 0
                ? workingBranch
                : mintWorkingBranchName(stableBranch);
          // If the working B already exists, switch onto it carrying the drift; else create it (-c).
          const bExists = gitmExec(['branch', '--list', carriedB], opCwd);
          const bAlreadyExists = bExists.ok && (bExists.stdout ?? '').trim() !== '';
          let onto = bAlreadyExists
            ? gitmExec(['switch', carriedB], opCwd)
            : gitmExec(['switch', '-c', carriedB], opCwd);
          // D-BN-2 · THE CARRY'S OWN TELEMETRY NET (mirror of the C500 net at the main switch). The
          // per-SCP Cascades/Bridge/ telemetry drift is the ONLY colliding class git refuses the
          // switch on; discarding its worktree is LOSSLESS (the turnOver field write regenerates it).
          // SCOPED to Cascades/Bridge — the real carried drift is the CARGO here (git switch carries
          // a dirty tree when files don't collide), so NEVER discard beyond it and NO stash on this
          // leg (a stash would strip the very drift the carry exists to preserve).
          if (!onto.ok) {
            log('gitm.turnover.carry-switch-failed', {
              carriedB,
              retry: 'telemetry-discard',
              error: (onto.error || onto.stderr).slice(0, 200),
            });
            gitmExec(['checkout', '--', 'Cascades/Bridge'], opCwd);
            onto = bAlreadyExists
              ? gitmExec(['switch', carriedB], opCwd)
              : gitmExec(['switch', '-c', carriedB], opCwd);
          }
          // D-BN-2 · THE onto-FAILURE GUARD (defect 2) — the carry switch still refused after the
          // telemetry net: NEVER fall through silently (the C284 never-silent law). Log, push a guard
          // bucket (advance:false · carriedB:'' so the reducer does not repair to a seat that failed),
          // and EARLY RETURN — the A switch below never runs on a failed carry.
          if (!onto.ok) {
            const guard: GitmActionResult = {
              action: 'gitmTurnOverWithSource',
              ok: false,
              error: onto.error || onto.stderr,
              guardFired: true,
              reason: 'carry-switch-failed',
              at: Date.now(),
            };
            log('gitm.turnover.carry-failed', {
              carriedB,
              error: (onto.error || onto.stderr).slice(0, 200),
            });
            bucket.push({ result: guard, source, targetBranch: resolvedTargetBranch, advance: false, pendingConfirm: null, clearPending: false, carriedB: '', turnOver: null, resolvedCwd: opCwd, activeScpDir: turnOverActiveScpDir });
            return action.strategy
              ? strategySuccess(action.strategy, strategyData_muxifyData(action.strategy, { ...guard }))
              : muxiumConclude();
          }
          gitmExec(['add', '-A'], opCwd);
          const carryCommit = gitmExec(
            ['commit', '-m', 'gitm: carry changes into B — serving B'],
            opCwd,
          );
          // D-BN-2 · THE CARRY MEND — the carry LANDED. Record the B seat so the ADVANCE bucket.push
          // threads it into the reducer (→ workingBranch/branchRoles/abMode → gitm.json). The commit
          // is best-effort (an already-clean carried tree returns non-ok · the seat still holds).
          carriedBForBucket = carriedB;
          log('gitm.turnover.carry-landed', { carriedB, committed: carryCommit.ok });
        } else {
          const guard: GitmActionResult = {
            action: 'gitmTurnOverWithSource',
            ok: false,
            error: '',
            guardFired: true,
            reason: 'a-dirty-spin-to-b',
            at: Date.now(),
          };
          bucket.push({ result: guard, source, targetBranch: resolvedTargetBranch, advance: false, pendingConfirm: null, clearPending: false, carriedB: '', turnOver: null, resolvedCwd: opCwd, activeScpDir: turnOverActiveScpDir });
          return action.strategy
            ? strategySuccess(action.strategy, strategyData_muxifyData(action.strategy, { ...guard }))
            : muxiumConclude();
        }
      }

      // C791 · SERVE THE CARRY — the confirmed carry landed the drift onto the carried B (the seam
      // above `git switch`ed onto it). THE NEW LAW: the turn-over now TARGETS THAT B — the app reboots
      // ONTO B (the user sees their changes); A stays the guarded stable (revert available). So the
      // switch + restart + seat-law + bucket below CONVERGE onto plain B turn-over semantics: the
      // effective target is the carried B and the effective source is 'B'. When no carry ran
      // (carriedBForBucket === '') these fall through to the resolved source/target unchanged — every
      // non-carry path (plain B, plain-A-return-to-ground) keeps its exact prior behavior.
      const carriedThisTurn = carriedBForBucket.length > 0;
      const effectiveSource: 'A' | 'B' = carriedThisTurn ? 'B' : source;
      const targetBranch = carriedThisTurn ? carriedBForBucket : resolvedTargetBranch;

      // 2. GUARDSHUNT — empty target.
      if (targetBranch.length === 0) {
        const guard: GitmActionResult = {
          action: 'gitmTurnOverWithSource',
          ok: false,
          error: '',
          guardFired: true,
          reason: 'target-branch-empty',
          at: Date.now(),
        };
        bucket.push({ result: guard, source, targetBranch, advance: false, pendingConfirm: null, clearPending: false, carriedB: '', turnOver: null, resolvedCwd: opCwd, activeScpDir: turnOverActiveScpDir });
        return action.strategy
          ? strategySuccess(action.strategy, strategyData_muxifyData(action.strategy, { ...guard }))
          : muxiumConclude();
      }

      // 3. Switch FIRST (never write the restart file before the checkout succeeds).
      // MD-E (part 2 · PROGRESS) — stamp the current-op latch for the switch + the restart cascade
      // (turn-over is the composite that most often exceeds 1s · the seat-return + boot cycle rides
      // after it). Clear on BOTH the failure guard below and the success path (the restart write).
      setCurrentOp({ message: `Turning over to ${targetBranch}…`, command: `git switch ${targetBranch}` });
      let switchExec = gitmExec(['switch', targetBranch], opCwd);
      if (!switchExec.ok) {
        // D-BN · THE TELEMETRY-COLLISION NET (C500): the per-SCP Cascades/Bridge/ files are
        // runtime telemetry the bridge rewrites continuously — a tracked bridge.json is dirty on
        // nearly every turn-over, and when its content differs between the seats git refuses the
        // switch outright (the silent B-turn-over block). Discarding its worktree drift is
        // LOSSLESS — the turnOver field write below regenerates it whole-file right after the
        // switch. Real work drift is NEVER discarded here; it rides the stash carry (retry 2).
        log('gitm.turnover.switch-failed', {
          targetBranch,
          retry: 'telemetry-discard',
          error: (switchExec.error || switchExec.stderr).slice(0, 200),
        });
        gitmExec(['checkout', '--', 'Cascades/Bridge'], opCwd);
        switchExec = gitmExec(['switch', targetBranch], opCwd);
      }
      if (!switchExec.ok) {
        // Retry 2 · THE STASH CARRY: genuine drift collides with the target seat — stash it
        // across the switch. A pop conflict resolves toward the stash (the drift is the newer
        // truth); source 'B' then seals it onto the Sword via the B-seal below; source 'A'
        // leaves it standing uncommitted (the A-guard family owns A's drift).
        log('gitm.turnover.switch-failed', {
          targetBranch,
          retry: 'stash-carry',
          error: (switchExec.error || switchExec.stderr).slice(0, 200),
        });
        const stashPush = gitmExec(['stash', 'push', '-u', '-m', 'gitm: turn-over stash carry'], opCwd);
        if (stashPush.ok) {
          switchExec = gitmExec(['switch', targetBranch], opCwd);
          if (switchExec.ok) {
            const pop = gitmExec(['stash', 'pop'], opCwd);
            if (!pop.ok) {
              gitmExec(['checkout', '--theirs', '--', '.'], opCwd);
              gitmExec(['add', '-A'], opCwd);
              gitmExec(['stash', 'drop'], opCwd);
              log('gitm.turnover.stash-carry', { targetBranch, popConflict: true });
            } else {
              log('gitm.turnover.stash-carry', { targetBranch, popConflict: false });
            }
          }
        }
      }
      if (!switchExec.ok) {
        clearCurrentOp();
        log('gitm.turnover.switch-refused', {
          targetBranch,
          error: (switchExec.error || switchExec.stderr).slice(0, 200),
        });
        const guard: GitmActionResult = {
          action: 'gitmTurnOverWithSource',
          ok: false,
          error: switchExec.error || switchExec.stderr,
          guardFired: true,
          reason: 'switch-failed',
          at: Date.now(),
        };
        bucket.push({ result: guard, source, targetBranch, advance: false, pendingConfirm: null, clearPending: false, carriedB: '', turnOver: null, resolvedCwd: opCwd, activeScpDir: turnOverActiveScpDir });
        return action.strategy
          ? strategySuccess(action.strategy, strategyData_muxifyData(action.strategy, { ...guard }))
          : muxiumConclude();
      }

      // 3.5 · C414 · THE B-SEAL (the user's law: turning over ON B commits the drift TO B).
      // The Sword is the drift vessel — landing the turn-over on B seals the carried working
      // changes as B's commit, so the clean-B gate (gitmConfirmSuccess · changesPrimedOnB===0)
      // passes naturally and the C326 observed-proof auto-confirm completes WITHOUT a manual
      // commit step. Sequence law: AFTER the switch (the drift now sits on B — a pre-switch
      // dirty tree was either already on B anor carried in by the switch), BEFORE the restart
      // write (the boot report's proof lands on a clean, sealed B). Mirrors the failsafe's
      // commit-if-dirty idiom (gitmRevertToStable:116-121). effectiveSource:'B' ONLY — a plain A
      // turn-over never auto-commits onto A (the A-guard family stands). C791 · SERVE THE CARRY — the
      // confirmed carry made effectiveSource 'B' (it already committed the drift onto B above, so this
      // seal typically finds a clean tree · idempotent commit-if-dirty).
      if (effectiveSource === 'B') {
        const postSwitchStatus = gitmExec(['status', '--porcelain'], opCwd);
        const stillDirty = postSwitchStatus.ok && postSwitchStatus.stdout.trim().length > 0;
        if (stillDirty) {
          gitmExec(['add', '-A'], opCwd);
          const sealExec = gitmExec(
            ['commit', '-m', 'gitm: B turn-over — drift sealed onto the Sword'],
            opCwd,
          );
          log('gitm.turnover.b-seal', {
            targetBranch,
            sealed: sealExec.ok,
            error: sealExec.ok ? '' : sealExec.error || sealExec.stderr,
          });
        } else {
          log('gitm.turnover.b-seal', { targetBranch, sealed: false, reason: 'already-clean' });
        }
      }

      // 4. Write .bridge-restart.json (BRTF · synchronous · whole-file overwrite). GITM SCP-
      // SOVEREIGN · S4 Seam B — the target is opCwd (= activeScpDir, the SCP's own nodemon-watched
      // PACKAGE dir), NOT userCwd. The SCP's nodemon.json watches .bridge-restart.json relative to
      // the SCP process cwd; writing to the install root would switch the branch but NEVER restart
      // the SCP (a silent stale-code state the 45s failsafe cannot catch). MOVES with the branch ops.
      // BO-2 · THE LINKED-TREE GUARD (C438 · the named cross-workspace channel): when the
      // global `scs-bridge` is npm-LINKED to a tree containing this op target, OTHER
      // workspaces' bridges execute that tree's dist/Cascades LIVE — a turn-over here
      // branch-switches + rebuilds THEIR running ground (the test-install casualty; census:
      // both Electrons ran app path = the dev repo · the global symlink was the carrier).
      // The guard cannot know the coupling is safe, so it TELLS: telemetry + a warning
      // field on the restart payload. The cure is topology (the other workspace runs a
      // PACKED install, not the link) — user-decided; the guard makes the coupling
      // visible instead of silent.
      let linkedTreeWarning = '';
      try {
        const globalRoot = execSync('npm root -g', { encoding: 'utf-8' }).trim();
        const globalPkg = join(globalRoot, 'scs-bridge');
        if (existsSync(globalPkg) && lstatSync(globalPkg).isSymbolicLink()) {
          const linkedReal = realpathSync(globalPkg);
          const opReal = realpathSync(opCwd);
          if (opReal === linkedReal || opReal.startsWith(linkedReal + '/')) {
            linkedTreeWarning =
              'global scs-bridge is npm-linked to this tree — other workspaces run this code live; this turn-over shifts their ground';
            log('gitm.turnover.linked-tree-warning', { linkedReal, opCwd });
          }
        }
      } catch {
        /* best-effort — absence of npm/global root never blocks a turn-over */
      }
      // D-BN-2 · THE turnOver RELOCATION (C446 successor): the turn-over signal no longer lands in
      // the SCP's per-SCP bridge.json (branch business belongs on gitm.json — the git manifold file ·
      // user design). The signal is stamped through the ADVANCE bucket → the reducer's returned
      // partial → the GITEP snapshot → gitm.json. The SCP field-watcher now observes turnOver.at
      // ADVANCE on gitm.json. The direct .bridge-restart.json write below remains as the blunt
      // transition fallback. The sdia 'field-written' log keeps its semantics with the new target.
      const turnOverStamp = { at: Date.now(), source, hard: true };
      log('gitm.turnover.field-written', { target: 'gitm.json-state', source });
      let writeOk = true;
      let writeErr = '';
      try {
        writeFileSync(
          resolve(opCwd, '.bridge-restart.json'),
          JSON.stringify(
            { hardTurnOver: true, timestamp: Date.now(), source, linkedTreeWarning, writerLeg: 'gitmTurnOverWithSource', writerPid: process.pid, writerDaemonCwd: process.cwd(), writerOpCwd: opCwd },
            null,
            2,
          ),
          'utf-8',
        );
      } catch (err: unknown) {
        writeOk = false;
        writeErr = err instanceof Error ? err.message : String(err);
      }
      // MD-E (part 2 · PROGRESS) — the synchronous switch + restart-write cascade is done. Clear the
      // latch (the seat-return + boot observation below/after are ASYNC · the deadline surface owns
      // that window via abMode === 'turned-over', not this in-method latch).
      clearCurrentOp();

      const result: GitmActionResult = {
        action: 'gitmTurnOverWithSource',
        ok: writeOk,
        error: writeOk ? '' : writeErr,
        guardFired: false,
        reason: writeOk ? '' : 'restart-write-failed',
        at: Date.now(),
      };

      // F-b · THE SEAT LAW (Cycle 299 → C300 · the Observed Seat Return · CLAUSE 6). B = the working
      // seat whenever it exists; A = proving ground only. A successful source:'A' turn-over PROVES A
      // — but if a working B exists (workingBranch state non-empty ANOR a b/* branch on disk) the
      // working seat must RETURN to B once A has ACTUALLY BOOTED. The retired setTimeout GUESSED at
      // when the restart settled (~1500ms · a timing race); the ARM replaces the guess with an
      // OBSERVATION latch — gitmBootReportWatch checkout-returns the seat when the SCP server's own
      // scp-boot-report shows activeBranch === stableBranch (A booted · the Muxistration). ONE-SHOT:
      // the ARM is the one-shot, not the watcher. Skips if no B (A-with-no-B → stay A). Non-fatal.
      // C791 · SERVE THE CARRY — keyed on effectiveSource: a confirmed carry made effectiveSource 'B'
      // (the app reboots ONTO B · the seat is ALREADY home), so this A-switch seat-return arm must NOT
      // fire — the disarm block below owns the carried case (converging on plain B semantics).
      if (effectiveSource === 'A' && writeOk) {
        // Resolve the B seat to return to. D-BN · THE branchRoles SWEEP — prefer roles.b (the canonical
        // working-B truth), then state workingBranch, else the on-disk `b/*` head. The fallback listing
        // sorts by `--sort=-committerdate` (newest-committed first) — UUID mint names are NOT
        // timestamp-orderable by name, so lexical/name ordering no longer picks the most-recent Sword.
        let seatB = knownB.length > 0 ? knownB : workingBranch;
        if (seatB.length === 0) {
          const first = gitmExec(
            ['branch', '--list', 'b/*', '--sort=-committerdate', '--format=%(refname:short)'],
            opCwd,
          );
          seatB = first.ok ? (first.stdout ?? '').split('\n')[0].trim() : '';
        }
        if (seatB.length > 0) {
          // targetBranch === stableBranch on a source:'A' turn-over (the resolve above) — the
          // boot-report must show THIS branch for the watcher to fire the return.
          log('gitm.seatlaw.armed', { opCwd, workingBranch: seatB, stableBranch: targetBranch });
          armSeatReturn({ workingBranch: seatB, stableBranch: targetBranch });
          // MD-E (THE C318 FOLD) — arm the bridge-owned deadline ALONGSIDE the seat-return arm (the
          // FLOOR: if A never boots, the boot-report watcher never observes it, so this deadline is
          // the only thing that reverts). Re-arm overwrites (a later A-prove supersedes). Composes
          // with the seat-law — the boot-report disarms BOTH before 45s on a healthy boot.
          armDeadline(targetBranch);
        }
      }
      // C300 · the seat is HOME. An effectiveSource:'B' turn-over IS the seat landing on B — disarm any
      // pending one-shot (a stale arm from a prior A-prove must not fire a redundant return once B is
      // seated). C791 · SERVE THE CARRY — the confirmed carry reboots ONTO B (effectiveSource 'B'), so
      // it lands here exactly as a plain B turn-over: the seat is home, no A-prove in flight.
      if (effectiveSource === 'B' && writeOk) {
        disarmSeatReturn();
        // MD-E (THE C318 FOLD) — a B turn-over is the seat home; disarm the deadline too (no A-prove
        // in flight · the seat-law and its floor move together).
        disarmDeadline();
      }

      // THE-TURN-OVER-A-GUARD: clear the pending token once the confirmed carry+switch landed (call 2
      // one-shot). aTurnOverConfirmed is true only on the token-validated A path.
      // D-BN-2 · THE CARRY MEND — thread the real carriedB (set by the carry seam · '' when no carry
      // ran) so the reducer's A-advance path repairs workingBranch/branchRoles/abMode to the carried B.
      // D-BN-2 · THE turnOver RELOCATION — thread the turn-over signal ONLY when the switch + restart
      // write succeeded (writeOk); the reducer writes it into gitm.json state so the SCP field-watcher
      // fires. null when the write failed (no restart signal for a failed turn-over).
      // C791 · SERVE THE CARRY — stamp effectiveSource (the confirmed carry made it 'B') so the reducer
      // takes the plain-B advance branch (abMode 'turned-over' · workingBranch = the carried B), and
      // carriedB rides along so the reducer stamps the 'carry-B' attempt for truthful reboot rehydration.
      bucket.push({ result, source: effectiveSource, targetBranch, advance: writeOk, pendingConfirm: null, clearPending: aTurnOverConfirmed, carriedB: carriedBForBucket, turnOver: writeOk ? turnOverStamp : null, resolvedCwd: opCwd, activeScpDir: turnOverActiveScpDir, originStableBranch: decision.stableBranch, originWorkingBranch: decision.workingBranch });
      return action.strategy
        ? strategySuccess(
            action.strategy,
            strategyData_muxifyData(action.strategy, { ...result, source, targetBranch }),
          )
        : muxiumConclude();
      } catch (err: unknown) {
        // C284 (the silent turn-over finding): an uncaught throw exited the method before
        // any bucket.push — lastTurnOverResult stayed '' and NOTHING surfaced. Never silent.
        // MD-E (part 2) — defensively clear the progress latch so a throw between the switch stamp
        // and the in-method clear can't leave the strip stuck showing a dead op.
        clearCurrentOp();
        const msg = err instanceof Error ? err.message : String(err);
        log('gitm.turnover.exception', { error: msg.slice(0, 200) });
        // The exception push is a minimal defensive shape (advance:false · the reducer's non-advance
        // branch never reads resolvedCwd/activeScpDir · MC-W2 slice/view logic is advance-gated). The
        // `as never` cast covers the partial shape; opCwd/turnOverActiveScpDir are out of catch-scope.
        bucket.push({ advance: false, guardFired: true, error: `turn-over exception: ${msg}` } as never);
        return muxiumConclude();
      }
    }),
});
