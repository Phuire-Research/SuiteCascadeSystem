/**
 * gitmAutoInductAB Quality · GITM A↔B Auto-Induction · "Move with C" (the user's refined design)
 *
 * The A↔B machine is never initialized by hand. On SCP bind (the same imperative seam that
 * dispatches gitmSetActiveScpDir → gitmScpWatcherArm → gitmRecountLocation), this quality
 * AUTO-runs the register/fork/land sequence so the user is ALWAYS on B (the working branch)
 * with A (the guarded stable) primed by a real committed baseline. The Diameter the design
 * draws: A (guarded-stable) and B (working) are two Demometers; the turn-over is their
 * Diameter; this quality COMPOSES the existing #641 register/fork primitives (gitmExec +
 * selectGitmOpCwd, the same seam gitmRegisterStable uses), it does NOT rebuild them.
 *
 * GUARD (idempotent · re-arms each cycle): fires ONLY when abMode === 'idle' && stableBranch
 * === '' (the un-inducted state). After gitmMergeWorking resets to idle + clears the branch
 * names (the merged→idle reset, below), the NEXT bind re-inducts — re-register A from the
 * just-merged state, re-fork B, re-land on B. Any other abMode (a live cycle) → no-op.
 *
 * THE RESTART CONTINUITY LAW (the user's design verdict — "restore-inside-induct is backwards"):
 * A restart RESUMES the last selected registration; it is CONTINUITY, not an ACT. The A↔B machine
 * is in-memory, so a bridge restart is BORN with empty state — the guard above opens on EVERY
 * restart even though the rail is ALREADY INDUCTED on disk. So BEFORE any git motion, this quality
 * reads the persisted per-SCP gitm.json FIRST: a non-empty persisted stableBranch ANOR branchRoles
 * = ALREADY INDUCTED → the quality becomes a PURE RESTORE (rehydrate the FULL decision set —
 * stable · working · roles · abMode, existence-gated per field — with ZERO git mutations: no
 * init-commit, no mint, no fork, no switch). Auto-INDUCTION (register/fork/land) fires ONLY for the
 * genuinely un-inducted: an EMPTY persisted rail (fresh install anor true zero). THE DELAY VARIANT
 * (the user's "or at the very least … a delay before the attempt"): when the persisted rail is
 * unreadable/absent WHILE the seat shows a prior life (a `b/` sword), DEFER — decline this bind's
 * induct; the next bind retries (the honest mechanic — no timer; the bind seam re-fires per launch).
 * This SUPERSEDES the C649 phantom-branch stableBranch-only restore (that read persisted only as a
 * fallback INSIDE the phantom induction leg, recovering one field; the restart is now the PRIMARY
 * boot path recovering the full set unconditionally). C634's existence gate is RETAINED for the
 * genuinely-empty induction path (coherence ≠ existence).
 *
 * The three composed motions (one synchronous Method — no Stratimux interleaving):
 *   1. INIT-COMMIT (Wave 1): if the RED git at opCwd has zero commits (`git rev-parse HEAD`
 *      fails), prime A with `add -A && commit -m "SCS: initialize"`. Guarded so an already-
 *      committed RED git (the install scaffold's "SCS: initialize nested location repository")
 *      is left untouched — A is already a real committed stable.
 *   2. REGISTER A + FORK B (Wave 2): read currentBranch → stableBranch; fork b/<branch>-<ts>
 *      as workingBranch (the LOCKED Q1 namespace from gitmRegisterStable). No switch yet.
 *   3. LAND ON B (Wave 2): `git switch <workingBranch>`. B === A at fork (same code), so NO
 *      restart is needed — uncommitted working-tree changes (e.g. the Pewter hifiConfig) carry
 *      over to B's working tree. The user's edits go to B; A stays guarded.
 *
 * Reducer advances abMode → 'candidate-created' (the same state gitmRegisterStable's BSEED
 * fork reaches) and sets turnedOverTo: 'B' + currentBranch = workingBranch so the UI reads
 * "on B" immediately (the gitmRecountLocation dispatched right after at the seam, plus the
 * STARC watcher, refresh currentBranch authoritatively). On a fork or switch failure the
 * sequence rolls forward conservatively: A registration still lands (stableBranch set), the
 * user can press the Shield to retry the fork (the honest-feedback net).
 *
 * Template: gitmRegisterStable.quality.ts (BSEED fork · bucket · advance flag · partial return).
 * Citation: gitmTurnOverWithSource.quality.ts (the switch seam) · gitmMergeWorking.quality.ts
 *   (the abMode → 'merged' surface the reset re-arms from). Composes #641, rebuilds nothing.
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
import type { GitmState, GitmABMode } from '../gitm.types';
import type { GitmAutoInductAB, GitmAutoInductABPayload, GitmActionResult } from './types';
import { gitmExec } from '../model/gitmExec.model';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { resolveGitmTargetCwd } from '../model/gitmOpCwd.model';
import { resolveStableRoot, isWorkingBranchFor } from '../model/gitmBranchRoot.model';
import { log } from '../../../debugLog';

export type { GitmAutoInductAB };

interface AutoInductBucketItem {
  result: GitmActionResult;
  stableBranch: string;
  workingBranch: string;
  // THE RESTART CONTINUITY LAW · the restored decision set (only read by the 'restored' branch).
  branchRoles: { a: string; b: string };
  abMode: GitmABMode;
  turnedOverTo: 'A' | 'B' | '';
  // 'register' = A registered + B forked + landed on B (advance to candidate-created on B).
  // 'register-only' = A registered but the fork/switch failed (stay idle, Shield can retry).
  // 'restored' = THE RESTART CONTINUITY LAW · a persisted rail (already inducted) read back
  //   VERBATIM — full decision set restored, ZERO git mutations (no mint/fork/switch/commit).
  // 'deferred' = THE DELAY VARIANT · the persisted rail was unreadable while the seat shows a
  //   prior life (a `b/` sword) — decline the induct this bind; the next bind retries (no-op).
  // 'none' = the guard rejected (already inducted or mid-cycle) — reducer no-op.
  outcome: 'register' | 'register-only' | 'restored' | 'deferred' | 'none';
}

const bucket: AutoInductBucketItem[] = [];

// The decision-set defaults for a NON-restore bucket item (induct/register/none/deferred paths do
// NOT carry a restored decision set — the reducer never reads these fields for those outcomes, but
// the interface requires them). THE RESTART CONTINUITY LAW's 'restored' path overrides them.
const NO_RESTORE = {
  branchRoles: { a: '', b: '' },
  abMode: 'idle' as GitmABMode,
  turnedOverTo: '' as 'A' | 'B' | '',
};

// THE RESTART CONTINUITY LAW · read the persisted per-SCP gitm.json decision set. Returns null when
// absent/malformed (the honest fall-through — the caller decides induct-vs-defer). Existence-gating
// per field happens at the call site (against live git · coherence ≠ existence, the C634 law).
function readPersistedRail(opCwd: string): {
  stableBranch: string;
  workingBranch: string;
  branchRoles: { a: string; b: string };
  abMode: string;
  turnedOverTo: 'A' | 'B' | '';
} | null {
  try {
    const raw = readFileSync(join(opCwd, 'Cascades', 'Bridge', 'gitm.json'), 'utf8');
    const p = JSON.parse(raw) as {
      stableBranch?: unknown;
      workingBranch?: unknown;
      branchRoles?: { a?: unknown; b?: unknown };
      abMode?: unknown;
      turnedOverTo?: unknown;
    };
    return {
      stableBranch: typeof p.stableBranch === 'string' ? p.stableBranch.trim() : '',
      workingBranch: typeof p.workingBranch === 'string' ? p.workingBranch.trim() : '',
      branchRoles: {
        a: typeof p.branchRoles?.a === 'string' ? p.branchRoles.a.trim() : '',
        b: typeof p.branchRoles?.b === 'string' ? p.branchRoles.b.trim() : '',
      },
      abMode: typeof p.abMode === 'string' ? p.abMode : '',
      turnedOverTo:
        p.turnedOverTo === 'A' || p.turnedOverTo === 'B' ? p.turnedOverTo : '',
    };
  } catch {
    return null; // absent anor malformed → the caller induct-vs-defers honestly
  }
}

type GitmSelfDeck = {
  gitm: Concept<GitmState, Record<string, unknown>>;
};

export const gitmAutoInductAB = createQualityCardWithPayload<
  GitmState,
  Record<string, never>,
  GitmSelfDeck
>({
  type: 'Gitm Auto Induct AB',
  reducer: (state) => {
    const item = bucket.pop();
    if (!item || item.outcome === 'none' || item.outcome === 'deferred') {
      // THE DELAY VARIANT — a deferred (unreadable-rail) pass is a pure no-op; the next bind retries.
      return {};
    }
    if (item.outcome === 'restored') {
      // THE RESTART CONTINUITY LAW — the persisted rail was ALREADY INDUCTED. Write the full decision
      // set back VERBATIM (existence-gated in the method), ZERO git mutations already guaranteed there.
      // Value-guarded Shortest-Path partial — only fields that DIFFER from the fresh-empty state land
      // (an empty persisted field was dropped in the method, so a '' here means "leave state's default").
      const out: Partial<GitmState> = { lastActionResult: item.result };
      if (item.stableBranch.length > 0 && item.stableBranch !== state.stableBranch) {
        out.stableBranch = item.stableBranch;
      }
      if (item.workingBranch.length > 0 && item.workingBranch !== state.workingBranch) {
        out.workingBranch = item.workingBranch;
      }
      if (
        (item.branchRoles.a.length > 0 || item.branchRoles.b.length > 0) &&
        (item.branchRoles.a !== state.branchRoles.a || item.branchRoles.b !== state.branchRoles.b)
      ) {
        out.branchRoles = { a: item.branchRoles.a, b: item.branchRoles.b };
      }
      if (item.abMode !== state.abMode) {
        out.abMode = item.abMode;
      }
      if (item.turnedOverTo !== '' && item.turnedOverTo !== state.turnedOverTo) {
        out.turnedOverTo = item.turnedOverTo;
      }
      // Reflect the working seat as currentBranch when B was restored (the STARC recount at the bind
      // seam re-confirms authoritatively right after — this keeps the UI on B without a flicker).
      if (item.workingBranch.length > 0 && item.workingBranch !== state.currentBranch) {
        out.currentBranch = item.workingBranch;
      }
      return out;
    }
    if (item.outcome === 'register-only') {
      // A registered, B fork/switch failed — stay idle with stableBranch set (the Shield
      // can retry the fork). Mirrors gitmRegisterStable's S1 DELTA 1 fork-fail path.
      // D-BN · branchRoles LOCKSTEP — roles.a = the registered stable, roles.b unassigned (no B yet).
      return {
        stableBranch: item.stableBranch,
        branchRoles: { a: item.stableBranch, b: '' },
        abMode: 'idle' as GitmABMode,
        lastActionResult: item.result,
      };
    }
    // Full induction: A registered, B forked, landed on B. Advance to candidate-created
    // (the same state the manual Shield's BSEED fork reaches) + reflect "on B" in the UI
    // surfaces (turnedOverTo + currentBranch). The STARC watcher re-confirms currentBranch.
    // D-BN · branchRoles LOCKSTEP — roles.a = stable, roles.b = the working seat (a=stable, b=working).
    return {
      stableBranch: item.stableBranch,
      workingBranch: item.workingBranch,
      branchRoles: { a: item.stableBranch, b: item.workingBranch },
      abMode: 'candidate-created' as GitmABMode,
      turnedOverTo: 'B' as const,
      currentBranch: item.workingBranch,
      lastActionResult: item.result,
    };
  },
  methodCreator: () =>
    createMethodWithConcepts(({ action, deck }) => {
      // GUARD — only induct the un-inducted, idle machine. Any live cycle (candidate-created /
      // turned-over / success / merged) or an already-registered A (stableBranch !== '') → no-op.
      // This makes the bind-seam dispatch idempotent (fires every launch, acts once per cycle).
      const abMode = deck.gitm.k.abMode.select();
      const stableBranch = deck.gitm.k.stableBranch.select();
      // D-BN · THE branchRoles SWEEP — roles.b is the canonical working-B truth the re-induct
      // recognition (isWorkingBranchFor below) decides against; prefix inference is the fallback
      // only when roles.b is unassigned (a legacy/pre-branchRoles checkout).
      const knownB = deck.gitm.k.branchRoles.select().b;
      if (abMode !== 'idle' || stableBranch.length > 0) {
        bucket.push({
          result: {
            action: 'gitmAutoInductAB',
            ok: true,
            error: '',
            guardFired: false,
            reason: 'already-inducted',
            at: Date.now(),
          },
          stableBranch: '',
          workingBranch: '',
          ...NO_RESTORE,
          outcome: 'none',
        });
        return action.strategy ? strategySuccess(action.strategy) : muxiumConclude();
      }

      // MULTI-SCP GITM MUXIFICATION (MC-W1) — CALLING SCP's repo (origin-aware) · SCP-Sovereign fallback.
      const opCwd = resolveGitmTargetCwd(deck, selectPayload<GitmAutoInductABPayload>(action).originScpName);

      // ── THE RESTART CONTINUITY LAW · PERSISTED-FIRST (before ANY git motion) ──────────────────────
      // The guard opened because the in-memory state is fresh-empty — but a restart is CONTINUITY, not
      // an ACT. Consult the persisted rail BEFORE inducting: a non-empty persisted stableBranch ANOR
      // branchRoles = ALREADY INDUCTED → PURE RESTORE (full decision set, existence-gated, ZERO git
      // mutations). Only a truly EMPTY (anor absent) rail falls through to the original induction.
      const persisted = readPersistedRail(opCwd);
      const railInducted =
        persisted !== null &&
        (persisted.stableBranch.length > 0 ||
          persisted.branchRoles.a.length > 0 ||
          persisted.branchRoles.b.length > 0);
      if (railInducted && persisted) {
        // Existence-gate EACH field against live git (C634 · coherence ≠ existence). A persisted
        // branch that no longer exists (deleted/renamed outside the bridge) is dropped — never
        // restore a phantom. abMode is carried only when a working seat verifiably survives.
        const stableOk =
          persisted.stableBranch.length > 0 &&
          gitmExec(['rev-parse', '--verify', '--quiet', `refs/heads/${persisted.stableBranch}`], opCwd).ok;
        const workingOk =
          persisted.workingBranch.length > 0 &&
          gitmExec(['rev-parse', '--verify', '--quiet', `refs/heads/${persisted.workingBranch}`], opCwd).ok;
        const rolesA =
          persisted.branchRoles.a.length > 0 &&
          gitmExec(['rev-parse', '--verify', '--quiet', `refs/heads/${persisted.branchRoles.a}`], opCwd).ok
            ? persisted.branchRoles.a
            : stableOk
              ? persisted.stableBranch
              : '';
        const rolesB =
          persisted.branchRoles.b.length > 0 &&
          gitmExec(['rev-parse', '--verify', '--quiet', `refs/heads/${persisted.branchRoles.b}`], opCwd).ok
            ? persisted.branchRoles.b
            : workingOk
              ? persisted.workingBranch
              : '';
        const restoredStable = stableOk ? persisted.stableBranch : rolesA;
        const restoredWorking = workingOk ? persisted.workingBranch : rolesB;
        // abMode: restore the persisted mode when a working seat survives; otherwise land on 'idle'
        // (a stable-only rail with no live B is a valid idle registration, not a live cycle).
        const restoredAbMode: GitmABMode =
          restoredWorking.length > 0 &&
          (persisted.abMode === 'candidate-created' ||
            persisted.abMode === 'turned-over' ||
            persisted.abMode === 'success')
            ? (persisted.abMode as GitmABMode)
            : restoredWorking.length > 0
              ? 'candidate-created'
              : 'idle';
        const result: GitmActionResult = {
          action: 'gitmAutoInductAB',
          ok: true,
          error: '',
          guardFired: false,
          reason: 'restart-continuity-restored',
          at: Date.now(),
        };
        log('gitm.autoinduct.restored-continuity', {
          opCwd,
          restoredStable,
          restoredWorking,
          restoredAbMode,
          persistedAbMode: persisted.abMode,
        });
        bucket.push({
          result,
          stableBranch: restoredStable,
          workingBranch: restoredWorking,
          branchRoles: { a: rolesA || restoredStable, b: rolesB || restoredWorking },
          abMode: restoredAbMode,
          turnedOverTo: restoredWorking.length > 0 ? 'B' : '',
          outcome: 'restored',
        });
        return action.strategy ? strategySuccess(action.strategy) : muxiumConclude();
      }

      // Wave 1 — INIT-COMMIT induction. Prime A with a real committed baseline ONLY if the RED
      // git has no commits yet (`git rev-parse HEAD` fails on an empty repo). An already-committed
      // RED git (the install scaffold's "SCS: initialize nested location repository") is left as-is.
      const headProbe = gitmExec(['rev-parse', 'HEAD'], opCwd);
      if (!headProbe.ok) {
        gitmExec(['add', '-A'], opCwd);
        gitmExec(['commit', '-m', 'SCS: initialize'], opCwd);
      }

      // Wave 2 — REGISTER A + FORK B. Read the current branch DIRECTLY via git — NOT the deck
      // `currentBranch` selector, which at the bind seam can still be '' before the STARC recount
      // reducer commits (the race that silently no-op'd the induction on Blank-Test-038 → abMode
      // stayed idle, turn-over blocked). git is the authoritative, timing-independent source. The
      // resolved branch becomes A (the guarded stable). Fork b/<branch>-<ts> (the LOCKED Q1 namespace).
      const branchProbe = gitmExec(['branch', '--show-current'], opCwd);
      const branch = branchProbe.ok ? branchProbe.stdout.trim() : '';
      log('gitm.autoinduct.fire', { opCwd, branch, abModeBefore: abMode, stableBefore: stableBranch });
      if (branch.length === 0) {
        // No current branch resolvable (a detached/empty state) — register-only is impossible,
        // so emit a no-op-with-error and let the user induct manually via the Shield.
        bucket.push({
          result: {
            action: 'gitmAutoInductAB',
            ok: false,
            error: 'no-current-branch',
            guardFired: false,
            reason: 'no-current-branch',
            at: Date.now(),
          },
          stableBranch: '',
          workingBranch: '',
          ...NO_RESTORE,
          outcome: 'none',
        });
        return action.strategy
          ? strategySuccess(action.strategy)
          : muxiumConclude();
      }

      // ── THE DELAY VARIANT (the user's "or at the very least … a delay before the attempt") ────────
      // The persisted rail was unreadable/absent (persisted === null OR empty · railInducted false
      // above), YET the seat sits on a `b/` working sword — the repo shows a PRIOR LIFE the empty
      // rail cannot describe. "The state is not empty" — so DECLINE to strip it into a phantom this
      // bind. The honest mechanic is NOT a timer: the bind seam re-fires on every activation, so a
      // deferred pass simply no-ops the git motions and lets the NEXT bind retry (by which time the
      // STARC recount + GITEP may have re-materialized a readable rail). A clean base seat (a fresh
      // install) is NOT a prior life → it falls through to the genuine induction below.
      if (persisted === null && isWorkingBranchFor(branch, knownB)) {
        const result: GitmActionResult = {
          action: 'gitmAutoInductAB',
          ok: true,
          error: '',
          guardFired: false,
          reason: 'deferred-unreadable-rail',
          at: Date.now(),
        };
        log('gitm.autoinduct.deferred-unreadable-rail', { opCwd, branch });
        bucket.push({
          result,
          stableBranch: '',
          workingBranch: '',
          ...NO_RESTORE,
          outcome: 'deferred',
        });
        return action.strategy ? strategySuccess(action.strategy) : muxiumConclude();
      }

      // BASEANCHOR (Macro D-T0.5 · the Blank-Test-049 fix) — anchor A to the TRUE stable ROOT, never a
      // `b/` branch. Two cases keyed on whether git is CURRENTLY on a working-B branch:
      //   (b) RE-INDUCT — already ON a `b/…` branch (a prior B left checked out after a state reset:
      //       bridge restart / merge → idle). RECOGNIZE it: A = the resolved root (master), B = the
      //       EXISTING branch. Do NOT fork (forking `b/<currentB>` is what COMPOUNDED `b/b/…`), do NOT
      //       switch (already on B). This recovers the prior pair instead of nesting a new level.
      //   (a) FRESH — on a clean base (root === branch, e.g. `master`): A = the base; fork a single-`b/`
      //       B = `b/<root>-<ts>` from it; switch to B (the original induction).
      const root = resolveStableRoot(branch);
      // D-BN · THE branchRoles SWEEP — the re-induct RECOGNITION decides via roles.b (isWorkingBranchFor):
      // when roles.b is set, `branch === roles.b` recovers the exact prior working seat; when unassigned
      // (legacy checkout), the `b/`-prefix fallback recognizes a stale-checked-out B (the roles-unassigned
      // legacy path). resolveStableRoot stays the LINEAGE root recovery for A — not a role decision.
      if (isWorkingBranchFor(branch, knownB)) {
        // C634 · THE EXISTENCE GATE (the C592 law at the autoinduct door — coherence ≠ existence):
        // resolveStableRoot is a NAME derivation; a RENAMED sword (the C604 rename law) no longer
        // maps to its lineage root by prefix-strip — the derived root may name NO real branch.
        // NEVER register a phantom A: probe git (authoritative, timing-independent — the Wave-2
        // law above); when the derived root is absent, register B alone with A LEFT EMPTY for an
        // explicit Set A through the Tactical Bridge (gitmAssignRole — ANY branch can be A; the
        // user picks). The field case: b/Working-ReFreshed stripped to "Working-ReFreshed" while
        // the roster held Working · master — the phantom A rendered as an unselected register.
        const rootProbe = gitmExec(['rev-parse', '--verify', '--quiet', `refs/heads/${root}`], opCwd);
        let stableForRegister = rootProbe.ok ? root : '';
        if (!rootProbe.ok) {
          // C649 · THE PERSISTED RESTORE — SUPERSEDED FOR THE RESTART PATH by THE RESTART CONTINUITY
          // LAW (the persisted-first gate above returns 'restored' before this block is ever reached
          // when the rail carries a decision set). This inner read now covers ONLY the narrow legacy
          // case the continuity gate leaves through: a READABLE-BUT-EMPTY persisted rail (decision
          // fields blank → railInducted false) whose seat still sits on a leftover `b/` sword. It
          // recovers a stable the empty rail could not describe (existence-gated · honest).
          try {
            const raw = readFileSync(join(opCwd, 'Cascades', 'Bridge', 'gitm.json'), 'utf8');
            const prior = JSON.parse(raw) as { stableBranch?: string };
            const persisted = (prior.stableBranch ?? '').trim();
            if (
              persisted.length > 0 &&
              gitmExec(['rev-parse', '--verify', '--quiet', `refs/heads/${persisted}`], opCwd).ok
            ) {
              stableForRegister = persisted;
            }
          } catch {
            /* absent anor malformed → stays empty (honest) */
          }
          if (stableForRegister.length > 0) {
            log('gitm.autoinduct.persisted-a-restored', { rawBranch: branch, restored: stableForRegister });
          } else {
            log('gitm.autoinduct.phantom-root-skip', { rawBranch: branch, derivedRoot: root });
          }
        }
        const result: GitmActionResult = {
          action: 'gitmAutoInductAB',
          ok: true,
          error: '',
          guardFired: false,
          reason: rootProbe.ok
            ? 'baseanchor-recognized-existing-b'
            : stableForRegister.length > 0
              ? 'baseanchor-b-recognized-persisted-a-restored'
              : 'baseanchor-b-recognized-root-phantom-a-left-empty',
          at: Date.now(),
        };
        log('gitm.autoinduct.baseanchor', { rawBranch: branch, root: stableForRegister, recognizedB: branch });
        bucket.push({ result, stableBranch: stableForRegister, workingBranch: branch, ...NO_RESTORE, outcome: 'register' });
        return action.strategy
          ? strategySuccess(
              action.strategy,
              strategyData_muxifyData(action.strategy, { ...result, stableBranch: root, workingBranch: branch }),
            )
          : muxiumConclude();
      }

      // THE CANONICAL SCOPE (Cycle 259 · the user's Current Full Scope — the false-flag root):
      // FRESH = REGISTER-ONLY. A = the root (master), STAY on it, abMode stays idle. NO b/ is
      // created and NOTHING is checked out by observation — `b/` comes into existence ONLY through
      // the Turn-Over confirmation panel when the tree is DIRTY at turn-over time (create b/ →
      // commit ALL changes to it → turn over). The prior fresh path forked b/<root>-<ts> AND
      // switched onto it at BIND — so merely viewing GitM on a fresh install showed a b/ branch
      // already created and set, with zero toolbar interaction (the recorded false flag).
      const result: GitmActionResult = {
        action: 'gitmAutoInductAB',
        ok: true,
        error: '',
        guardFired: false,
        reason: 'register-only-fresh',
        at: Date.now(),
      };
      log('gitm.autoinduct.register-only', { rawBranch: branch, root });
      bucket.push({ result, stableBranch: root, workingBranch: '', ...NO_RESTORE, outcome: 'register-only' });
      return action.strategy
        ? strategySuccess(
            action.strategy,
            strategyData_muxifyData(action.strategy, {
              ...result,
              stableBranch: root,
            }),
          )
        : muxiumConclude();
    }),
});
