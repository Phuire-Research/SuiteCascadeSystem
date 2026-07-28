/**
 * gitmMergeWorking Quality · GITM A↔B (#641) · switch A → git merge --no-ff <B>
 *
 * The happy-path B→A merge. The --no-ff flag is LAW (conferred decisions · explicit merge
 * commit preserving history). Single synchronous method:
 *   1. GUARDSHUNT: bMergeable===false → guardFired { reason: 'b-not-mergeable' } (the user
 *      must confirm B success via gitmConfirmSuccess first).
 *   2. GUARDSHUNT: stableBranch OR workingBranch empty → guardFired { reason: 'missing-ab-branches' }.
 *   3. gitmExec(['switch', stableBranch]) — ensure on A before the merge.
 *   4. gitmExec(['merge', '--no-ff', workingBranch]) — explicit merge commit.
 *   5. INLINE STARC re-read (gitmMerge.quality.ts:99 precedent · BOTH outcomes) so conflicts[]
 *      surfaces coherently in the same method if the merge conflicts.
 *
 * Reducer: mirrors gitmMerge (spreads the STARC refresh) + abMode='merged' · bMergeable=false.
 * workingBranch stays set (the user decides whether to delete B via gitm_branch_delete — not
 * this quality's concern).
 *
 * Template: gitmMerge.quality.ts (--no-ff inline STARC re-read · refresh bucket shape).
 * Citation: GITM-AB-S3-YELLOW-BLUEPRINT.md §W1c Quality 5 · gitmMerge.quality.ts:99 (STARC re-read).
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
import type { GitmMergeWorking, GitmMergeWorkingPayload, GitmActionResult } from './types';
import { gitmExec } from '../model/gitmExec.model';
import { log } from '../../../debugLog';
import { resolveGitmTargetCwd, selectGitmDecisionFields } from '../model/gitmOpCwd.model';
import { readGitStatus, type GitmStatusResult } from '../model/gitmStatus.model';
// MD-C M4 · THE POSITIVE SLICE-MIRROR (reset half) — the origin's merged→idle reset lands on
// ITS OWN slice unconditionally (the symmetric close to gitmConfirmSuccess's success mirror).
// M5 — getSlice: GUARDSHUNT 1 reads the ORIGIN's bMergeable (its slice for a non-pointer).
import { getSlice, upsertSliceFields } from '../model/gitmSliceStore.model';

export type { GitmMergeWorking };

interface MergeWorkingBucketItem {
  result: GitmActionResult;
  refresh: GitmStatusResult | null; // present after the merge ran (conflict needs it too)
  merged: boolean; // true only when bMergeable + branches present + merge ran (advance abMode)
  // F-c · THE SIGNIFIER (Cycle 299 · the A/B Law): does the just-merged b/* branch STILL exist on
  // disk? The signifier (workingBranch state) persists while the branch does — blank it only when
  // the branch is truly gone (the user deleted B via gitm_branch_delete). Computed in the method
  // (git is the authority) so the reducer stays a pure partial-return.
  workingBranchStillOnDisk: boolean;
  // MULTI-SCP GITM MUXIFICATION (MC-W3 · THE MATERIALIZED-VIEW GATE) — the RESOLVED merge cwd + the
  // ACTIVE pointer dir, threaded so the reducer can gate the OUTCOME write (the merged→idle abMode/
  // branchRoles reset). A NON-pointer origin's merge outcome must NOT clobber the pointer's flat view
  // with the origin's roles. The STARC refresh (item.refresh) is the ORIGIN's status, so it too is
  // gated off the flat view for a non-pointer origin (it would relay alien branch/dirty state).
  resolvedCwd: string;
  activeScpDir: string;
}

const bucket: MergeWorkingBucketItem[] = [];

type GitmSelfDeck = {
  gitm: Concept<GitmState, Record<string, unknown>>;
};

export const gitmMergeWorking = createQualityCardWithPayload<
  GitmState,
  Record<string, never>,
  GitmSelfDeck
>({
  type: 'Gitm Merge Working',
  reducer: (state) => {
    const item = bucket.pop();
    if (!item) {
      return {};
    }
    // MULTI-SCP GITM MUXIFICATION (MC-W3 · THE MATERIALIZED-VIEW GATE) — the flat view belongs to the
    // POINTER only. A NON-pointer origin's merge outcome (STARC refresh + merged→idle abMode/branchRoles
    // reset) must NOT stomp the flat view with the origin's branches/roles. Surface only the caller's
    // action result; the origin's own rail (its slice + GITEP) carries its truth. DEFERRED: writing the
    // merged outcome INTO the origin's slice (a positive slice-mirror like turnOver's MC-W2 step 9) —
    // out of M3 scope (needs new merge-slice threading); the gate is the load-bearing safety.
    const isActiveView =
      item.activeScpDir === '' || item.resolvedCwd === item.activeScpDir || item.resolvedCwd === '';
    if (!isActiveView) {
      return { lastActionResult: item.result };
    }
    if (item.refresh) {
      const base = {
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
      };
      // GITM A↔B Auto-Induction (merged→idle reset · "Move with C") — on a clean merge, the cycle
      // is COMPLETE: B has landed in A. Instead of parking at 'merged' (which would block the next
      // bind's auto-induction guard, abMode==='idle' && stableBranch===''), reset straight to 'idle'
      // and CLEAR the A/B branch names so the NEXT SCP bind re-inducts — re-register A from the
      // just-merged stable, re-fork a fresh B, re-land the user on B. This re-arms the machine each
      // cycle without orphaning branches (the merged B branch stays on disk for the user to delete
      // via gitm_branch_delete; only the A↔B STATE pointers are cleared). The just-merged commit is
      // the new A baseline the next induction registers. turnedOverTo is cleared too (no live direction).
      if (item.merged) {
        // A STAYS THE GROUND (Cycle 267 · the Canonical model): the old reset cleared
        // stableBranch to re-arm the bind auto-induction (re-register + re-fork + land on B) —
        // that induction is now REGISTER-ONLY and once-per-SCP-dir, so clearing A left the
        // machine stable-less after a merge (Turn-Over A dead till restart · the 070 finding).
        // Post-merge = the fresh-clean state: A preserved (the just-merged master IS A), idle.
        // F-c · THE SIGNIFIER PERSISTS WHILE THE BRANCH DOES (Cycle 299 · the A/B Law · the 085
        // silent no-op): the old reset blanked workingBranch UNCONDITIONALLY on merged→idle — but
        // the b/* branch survives on disk (kept for the user to delete via gitm_branch_delete), so
        // combined with the F-a cold-start race the lost signifier gave the empty-target no-op.
        // Keep the seat law: the working B stays the working seat (workingBranch preserved) WHILE
        // its branch exists; blank ONLY when the branch is truly gone. bMergeable resets either way.
        // D-BN · branchRoles LOCKSTEP — mirror the workingBranch preserve/clear onto roles.b (the
        // signifier persists while the branch does; blanks only when B is truly gone). roles.a = the
        // just-merged stable ground (A stays the ground · Cycle 267).
        return {
          ...base,
          abMode: 'idle' as GitmABMode,
          workingBranch: item.workingBranchStillOnDisk ? state.workingBranch : '',
          branchRoles: {
            a: state.stableBranch,
            b: item.workingBranchStillOnDisk ? state.branchRoles.b : '',
          },
          turnedOverTo: '' as const,
          bMergeable: false,
        };
      }
      return base;
    }
    return { lastActionResult: item.result };
  },
  methodCreator: () =>
    createMethodWithConcepts(({ action, deck }) => {
      // MULTI-SCP GITM MUXIFICATION (MC-W1) — CALLING SCP's repo (origin-aware) · SCP-Sovereign fallback.
      const userCwd = resolveGitmTargetCwd(deck, selectPayload<GitmMergeWorkingPayload>(action).originScpName);
      // MULTI-SCP GITM MUXIFICATION (MC-W3 · THE SLICE-FIRST DECISION READ) — the A/B DECISION FIELDS for
      // the ORIGIN's repo (its slice for a non-pointer origin, else the flat pointer view). The merge
      // switches onto stableBranch + merges workingBranch — read those from the ORIGIN, not the pointer,
      // or a non-pointer merge switches onto the pointer's stable and merges the pointer's B (the CHIMERA).
      const decision = selectGitmDecisionFields(deck, userCwd);
      // MC-W3 — the active pointer dir, threaded to the reducer to gate the OUTCOME write (view law).
      const mergeActiveScpDir = deck.gitm.k.activeScpDir.select();

      // GUARDSHUNT 1 — B not mergeable (no confirmed success).
      // MD-C M5 · THE ORIGIN-GATED MERGE — bMergeable now lands on a non-pointer origin's SLICE
      // (the M4/M5 confirm circuit), so the gate reads the ORIGIN's flag: its slice for a
      // non-pointer target, the flat view for the pointer/cold-rail (a non-pointer origin gating
      // on the pointer's flag was the residual CHIMERA read).
      const gateActiveScpDir = deck.gitm.k.activeScpDir.select();
      const gateSlice =
        userCwd !== '' && userCwd !== gateActiveScpDir ? getSlice(userCwd) : undefined;
      const bMergeable = gateSlice?.bMergeable ?? deck.gitm.k.bMergeable.select();
      if (bMergeable === false) {
        const guard: GitmActionResult = {
          action: 'gitmMergeWorking',
          ok: false,
          error: '',
          guardFired: true,
          reason: 'b-not-mergeable',
          at: Date.now(),
        };
        bucket.push({ result: guard, refresh: null, merged: false, workingBranchStillOnDisk: false, resolvedCwd: userCwd, activeScpDir: mergeActiveScpDir });
        return action.strategy
          ? strategySuccess(action.strategy, strategyData_muxifyData(action.strategy, { ...guard }))
          : muxiumConclude();
      }

      // GUARDSHUNT 2 — missing A/B branches. MC-W3 — from `decision` (the ORIGIN's slice for a
      // non-pointer origin), so the merge targets the ORIGIN's A/B pair.
      const stableBranch = decision.stableBranch;
      const workingBranch = decision.workingBranch;
      if (stableBranch.length === 0 || workingBranch.length === 0) {
        const guard: GitmActionResult = {
          action: 'gitmMergeWorking',
          ok: false,
          error: '',
          guardFired: true,
          reason: 'missing-ab-branches',
          at: Date.now(),
        };
        bucket.push({ result: guard, refresh: null, merged: false, workingBranchStillOnDisk: false, resolvedCwd: userCwd, activeScpDir: mergeActiveScpDir });
        return action.strategy
          ? strategySuccess(action.strategy, strategyData_muxifyData(action.strategy, { ...guard }))
          : muxiumConclude();
      }

      // BO-3 · THE PRESSED-BRANCH CAPTURE (C444): the law is 'stay on the branch active when
      // the button was PRESSED' — captured from git ground truth BEFORE the merge switch
      // (deck.currentBranch as fallback). By majority this is B; the capture makes it exact.
      const pressedProbe = gitmExec(['branch', '--show-current'], userCwd);
      const pressedBranch =
        pressedProbe.ok && (pressedProbe.stdout ?? '').trim() !== ''
          ? (pressedProbe.stdout ?? '').trim()
          // MC-W3 — the live probe (against userCwd = the origin repo) is authoritative; the fallback
          // reads the ORIGIN's currentBranch via `decision`, not the flat pointer view.
          : decision.currentBranch;

      // 3. Ensure on A before the merge.
      const switchExec = gitmExec(['switch', stableBranch], userCwd);
      if (!switchExec.ok) {
        const result: GitmActionResult = {
          action: 'gitmMergeWorking',
          ok: false,
          error: switchExec.error || switchExec.stderr,
          guardFired: false,
          reason: 'switch-failed',
          at: Date.now(),
        };
        bucket.push({ result, refresh: null, merged: false, workingBranchStillOnDisk: false, resolvedCwd: userCwd, activeScpDir: mergeActiveScpDir });
        return action.strategy
          ? strategySuccess(action.strategy, strategyData_muxifyData(action.strategy, { ...result }))
          : muxiumConclude();
      }

      // 4. Explicit merge commit (--no-ff is LAW).
      const exec = gitmExec(['merge', '--no-ff', workingBranch], userCwd);
      const result: GitmActionResult = {
        action: 'gitmMergeWorking',
        ok: exec.ok,
        error: exec.ok ? '' : 'merge-conflict',
        guardFired: false,
        reason: exec.ok ? '' : 'merge-conflict-resolution-required',
        at: Date.now(),
      };

      // BO-3 · THE POST-MERGE RESTORE (C444): on merge SUCCESS return to the pressed branch
      // (the test-install casualty: the walk previously landed on A/master and the Lab had to
      // reassign b/ by hand). Failure path unchanged — a conflict leaves the repo mid-merge
      // on A and the failsafe owns it. A failed restore never fails the merge result; the
      // refresh below reports the true landing honestly.
      if (exec.ok && pressedBranch.length > 0 && pressedBranch !== stableBranch) {
        const restoreExec = gitmExec(['switch', pressedBranch], userCwd);
        log('gitm.merge.pressed-branch-restore', {
          pressedBranch,
          restored: restoreExec.ok,
          error: restoreExec.ok ? '' : restoreExec.error || restoreExec.stderr,
        });
      }

      // 5. INLINE STARC re-read in BOTH outcomes — a conflict leaves the repo mid-merge.
      const refresh = readGitStatus(userCwd);
      // F-c · THE SIGNIFIER (Cycle 299 · the A/B Law) — does the just-merged workingBranch STILL
      // exist on disk? `git branch --list <workingBranch>` is the authority (the merge preserves B;
      // the user deletes it separately via gitm_branch_delete). The signifier persists while the
      // branch does: the reducer keeps workingBranch when this is true, blanks it only when gone.
      const bBranchProbe = gitmExec(['branch', '--list', workingBranch], userCwd);
      const workingBranchStillOnDisk =
        bBranchProbe.ok && (bBranchProbe.stdout ?? '').trim() !== '';
      // MD-C M4 · THE POSITIVE SLICE-MIRROR (reset half — the C569 close): a clean merge resets
      // the ORIGIN's OWN rail unconditionally, so a non-pointer origin never strands a stale
      // bMergeable=true / abMode 'success' in its slice after B lands in A. Mirrors the reducer's
      // merged→idle reset but from the ORIGIN's decision fields (the reducer's state.* reads are
      // pointer-flat). D-BN lockstep: roles.b mirrors the workingBranch preserve/clear; roles.a =
      // the just-merged stable ground. The flat write below stays isActiveView-gated (view law).
      // The mirror sits in the METHOD (not the reducer) because `decision` is in scope only here.
      if (exec.ok) {
        upsertSliceFields(userCwd, {
          abMode: 'idle' as GitmABMode,
          workingBranch: workingBranchStillOnDisk ? workingBranch : '',
          branchRoles: {
            a: stableBranch,
            b: workingBranchStillOnDisk ? workingBranch : '',
          },
          turnedOverTo: '',
          bMergeable: false,
        });
      }
      bucket.push({ result, refresh, merged: exec.ok, workingBranchStillOnDisk, resolvedCwd: userCwd, activeScpDir: mergeActiveScpDir });
      return action.strategy
        ? strategySuccess(
            action.strategy,
            strategyData_muxifyData(action.strategy, { ...result, stableBranch, workingBranch }),
          )
        : muxiumConclude();
    }),
});
