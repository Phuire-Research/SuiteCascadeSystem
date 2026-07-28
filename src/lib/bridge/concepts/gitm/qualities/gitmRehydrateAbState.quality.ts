/**
 * gitmRehydrateAbState Quality · C412 · THE ATTEMPT-CHECK RESTORE.
 *
 * The write leg of the reboot rehydration: gitmBootReportWatch's arm-time one-shot reads
 * the persisted gitm.json (THE ATTEMPT LEDGER · turnOverAttempt) + the SCP server's own
 * boot-report activeBranch (the running proof — the server wrote what it actually booted
 * on), CHECKS the attempt against the ground, and dispatches THIS quality with the state
 * the check verified. The A↔B machine survives the bridge restart — abMode 'turned-over'
 * returns, the Turn-Over-B button shows CONFIRM B SUCCESS again, and the C326
 * observed-proof circuit's gate reads true on the next boot report.
 *
 * THE A-GUARD lives in the CHECK (the principle), not here: a source:'A' attempt never
 * reaches this dispatch with merge-enabling fields. This reducer is a pure value-guarded
 * partial return — Shortest Path, no spread.
 *
 * TQNI 4-site byte-match for 'Gitm Rehydrate Ab State':
 *   (a) GitmRehydrateAbStatePayload (gitm.types.ts)
 *   (b) Quality alias GitmRehydrateAbState (gitm.types.ts)
 *   (c) this `type:` literal
 *   (d) registration key gitmRehydrateAbState (gitm.concept.ts)
 */

import { createQualityCardWithPayload, selectPayload } from 'stratimux';
import type { GitmState, GitmABMode } from '../gitm.types';
import type { GitmRehydrateAbStatePayload, GitmRehydrateAbState } from './types';
import { log } from '../../../debugLog';

export type { GitmRehydrateAbState };

export const gitmRehydrateAbState = createQualityCardWithPayload<
  GitmState,
  GitmRehydrateAbStatePayload
>({
  type: 'Gitm Rehydrate Ab State',
  reducer: (state, action) => {
    const p = selectPayload<GitmRehydrateAbStatePayload>(action);
    // M6 · THE MATERIALIZED-VIEW GATE (the C572 chimera close) — the flat view belongs to the
    // POINTER only. A rehydration read from a NON-pointer dir must not stamp that repo's A/B
    // state onto the pointer's flat view (the principle already mirrored it onto its slice).
    // No originScpDir (legacy dispatch) anor no pointer ('' dev path) → flat write as before.
    if (
      typeof p.originScpDir === 'string' &&
      p.originScpDir !== '' &&
      state.activeScpDir !== '' &&
      p.originScpDir !== state.activeScpDir
    ) {
      log('gitm.rehydrate.applied', { verdict: 'non-pointer-slice-only', originScpDir: p.originScpDir });
      return {};
    }
    const out: Partial<GitmState> = {};
    if (typeof p.abMode === 'string' && p.abMode !== state.abMode) {
      out.abMode = p.abMode as GitmABMode;
    }
    if (typeof p.turnedOverTo === 'string' && p.turnedOverTo !== state.turnedOverTo) {
      out.turnedOverTo = p.turnedOverTo;
    }
    if (
      typeof p.lastTurnOverResult === 'string' &&
      p.lastTurnOverResult !== state.lastTurnOverResult
    ) {
      out.lastTurnOverResult = p.lastTurnOverResult;
    }
    if (typeof p.workingBranch === 'string' && p.workingBranch.length > 0 && p.workingBranch !== state.workingBranch) {
      out.workingBranch = p.workingBranch;
    }
    if (typeof p.stableBranch === 'string' && p.stableBranch.length > 0 && p.stableBranch !== state.stableBranch) {
      out.stableBranch = p.stableBranch;
    }
    // D-BN · THE branchRoles SWEEP — carry the persisted canonical roles into state (defensive: a
    // legacy gitm.json omits branchRoles → the check falls through, the derive stays authoritative).
    // Value-guarded (only when both sub-fields are present + differ) so it stays a Shortest-Path return.
    if (
      p.branchRoles &&
      typeof p.branchRoles.a === 'string' &&
      typeof p.branchRoles.b === 'string' &&
      (p.branchRoles.a !== state.branchRoles.a || p.branchRoles.b !== state.branchRoles.b)
    ) {
      out.branchRoles = { a: p.branchRoles.a, b: p.branchRoles.b };
    }
    log('gitm.rehydrate.applied', {
      abMode: out.abMode ?? null,
      turnedOverTo: out.turnedOverTo ?? null,
      workingBranch: out.workingBranch ?? null,
    });
    return out;
  },
});
