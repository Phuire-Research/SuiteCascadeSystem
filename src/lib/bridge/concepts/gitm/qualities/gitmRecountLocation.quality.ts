/**
 * gitmRecountLocation Quality · GITM 3LOC · the unified per-location recount
 *
 * ONE recount quality serving all three locations. The payload's `location`
 * ('base'|'cascade'|'scp') selects the cwd: base = userCwd · cascade = userCwd/Cascades ·
 * scp = the active SCP dir (activeScpDir · '' = dormant, no recount). It runs
 * readGitStatus(cwd) → builds a GitmLocationSubState (changeCount = staged+unstaged+
 * conflicts) → stamps the matching sub-state field + mostRecentLocation + lastChangedAt
 * (the rotation: the location whose watcher fired IS the most-recent · single-dispatch
 * discipline — the stamp is intrinsic to the recount, not a second action).
 *
 * Back-compat (Decision A.4): for 'base' the reducer ALSO writes changesPrimedOnB (every
 * A/B button / DEVBAR / SAFEGUARD reads the flat field) — locationBase MIRRORS it. The
 * Branch-Flow clearError gate is honored for 'base' only (the user-tree error surface).
 *
 * A FOCUSED partial-return — 2-4 fields, never a full STARC refresh; never collides with
 * gitmSetStatus's STARC-coherence reducer. It deliberately does NOT touch lastReadAt (the
 * GITEP writer gets dedicated sub-state witnesses in Wave D).
 *
 * Template: gitmRecountChanges.quality.ts (readGitStatus seam · bucket · partial return).
 * Citation: GITM-3LOC-S3-OCHRE.md Wave C.3.
 */

import {
  createQualityCardWithPayload,
  createMethodWithConcepts,
  selectPayload,
  muxiumConclude,
  strategySuccess,
  type Concept,
} from 'stratimux';
import { join } from 'node:path';
import { log } from '../../../debugLog';
import type { GitmState, GitmLocationKey, GitmLocationSubState } from '../gitm.types';
import { createGitmLocationSubState } from '../gitm.types';
import type { GitmRecountLocation, GitmRecountLocationPayload } from './types';
import { readGitStatus } from '../model/gitmStatus.model';
import { gitmExec } from '../model/gitmExec.model';
// MULTI-SCP GITM MUXIFICATION (MC-W1/W2) — the origin-aware cwd resolution for the 'scp' branch +
// the per-SCP slice population (the CALLING SCP's locationScp/changesPrimedOnB/commitsDivergence).
import { resolveGitmTargetCwd, selectGitmDecisionFields } from '../model/gitmOpCwd.model';
import { upsertSliceFields } from '../model/gitmSliceStore.model';

export type { GitmRecountLocation };

interface RecountLocationBucketItem {
  location: GitmLocationKey;
  sub: GitmLocationSubState;
  clearError: boolean;
  // GITM color-cascade (W2 · Counter B) — the commits-between divergence count carried alongside
  // the location recount (rides the SAME bucket pop · single-dispatch discipline). Computed in the
  // methodCreator (guarded on both branch names) · stamped by the reducer's 'scp' branch.
  commitsDivergenceCount: number;
  // MULTI-SCP GITM MUXIFICATION (MC-W2 step 9) — the RESOLVED scp cwd (origin-aware) + the ACTIVE dir,
  // so the reducer populates the CALLING SCP's slice (locationScp/changesPrimedOnB/commitsDivergence)
  // and only writes the flat state when this recount is for the active SCP (the materialized-view law).
  resolvedScpCwd: string;
  activeScpDir: string;
}

const bucket: RecountLocationBucketItem[] = [];

type GitmSelfDeck = {
  gitm: Concept<GitmState, Record<string, unknown>>;
};

export const gitmRecountLocation = createQualityCardWithPayload<
  GitmState,
  GitmRecountLocationPayload,
  GitmSelfDeck
>({
  type: 'Gitm Recount Location',
  reducer: (state) => {
    const item = bucket.pop();
    if (item === undefined) {
      return {};
    }
    const { location, sub, clearError, commitsDivergenceCount, resolvedScpCwd, activeScpDir } = item;
    // Partial-return law: the matching sub-state field + the rotation pointer.
    // GITM SCP-SOVEREIGN — the 'scp' branch is now the AUTHORITATIVE changesPrimedOnB writer
    // (the badge / A↔B buttons / SAFEGUARD read changesPrimedOnB = the active SCP's RED count).
    // It also honors the Branch-Flow clearError gate (the SCP's own user-tree error surface).
    // GITM color-cascade (W2 · Counter B) — the 'scp' branch is ALSO the commitsDivergenceCount
    // writer (the commits-between count lives where the A/B branches do — the active SCP repo).
    if (location === 'cascade') {
      return { locationCascade: sub, mostRecentLocation: 'cascade' as const };
    }
    if (location === 'scp') {
      // MULTI-SCP GITM MUXIFICATION (MC-W2 step 9) — populate the CALLING SCP's slice with the per-repo
      // recount (locationScp/changesPrimedOnB/commitsDivergence · ALWAYS · the truth GITEP fans out).
      if (resolvedScpCwd !== '') {
        upsertSliceFields(resolvedScpCwd, {
          locationScp: sub,
          changesPrimedOnB: sub.changeCount,
          commitsDivergenceCount,
          ...(clearError ? { errorCode: '', errorMessage: '' } : {}),
        });
      }
      // The flat state is the ACTIVE SLICE materialized view: write it ONLY for the active SCP (or the
      // no-SCP dev path). A NON-active SCP's recount must NOT clobber the flat changesPrimedOnB (the
      // Turn-Over badge / SAFEGUARD read it) with its own count (THE CHIMERA the Fork repairs).
      const isActiveView = activeScpDir === '' || resolvedScpCwd === activeScpDir || resolvedScpCwd === '';
      if (!isActiveView) {
        return {};
      }
      if (clearError) {
        return {
          locationScp: sub,
          mostRecentLocation: 'scp' as const,
          changesPrimedOnB: sub.changeCount,
          commitsDivergenceCount,
          errorCode: '',
          errorMessage: '',
        };
      }
      return {
        locationScp: sub,
        mostRecentLocation: 'scp' as const,
        changesPrimedOnB: sub.changeCount,
        commitsDivergenceCount,
      };
    }
    // location === 'base' — DORMANT under SCP-sovereign (the Base dial is pruned; this branch
    // no longer fires from a watcher). Kept for the boot-recount path + back-compat; it still
    // stamps locationBase but NO LONGER owns changesPrimedOnB (the 'scp' branch does).
    if (clearError) {
      return {
        locationBase: sub,
        mostRecentLocation: 'base' as const,
        errorCode: '',
        errorMessage: '',
      };
    }
    return {
      locationBase: sub,
      mostRecentLocation: 'base' as const,
    };
  },
  methodCreator: () =>
    createMethodWithConcepts(({ action, deck }) => {
      const { location, clearError, originScpName } = selectPayload<GitmRecountLocationPayload>(action);
      const userCwd = deck.gitm.k.userCwd.select();
      const activeScpDir = deck.gitm.k.activeScpDir.select();

      // Resolve the location's cwd. The 'base'/'cascade' branches keep their FIXED cwd (userCwd ·
      // userCwd/Cascades) — the origin thread never touches them. MULTI-SCP GITM MUXIFICATION (MC-W1):
      // the 'scp' branch resolves ORIGIN-AWARE (resolveGitmTargetCwd) so a NON-active SCP's watcher
      // recount targets ITS OWN repo (not the single active one · the CHIMERA repair). '' = dormant.
      let cwd: string;
      if (location === 'cascade') {
        cwd = join(userCwd, 'Cascades');
      } else if (location === 'scp') {
        cwd = resolveGitmTargetCwd(deck, originScpName);
      } else {
        cwd = userCwd;
      }

      // GITM color-cascade (W2 · Counter B) — COMMITS-BETWEEN divergence. `git rev-list --count
      // <stableBranch>..<workingBranch>` = commits on B not yet on A. GUARDED on both branch names
      // present (an unregistered A↔B / detached HEAD → 0); a non-zero/parse-fail exit → 0.
      // MD-C M11 · THE ORIGIN DIVERGENCE (the C578 dead-Merge find — the LAST flat pair read):
      // the rev-list ran with the POINTER's stable/working names against the ORIGIN's repo — a
      // non-pointer citizen's divergence always read 0 (alien branch names) and the merge gate's
      // commitsDivergenceCount>0 leg never passed. Slice-first via the M3 decision read, paired
      // with the SAME resolved cwd the rev-list runs against.
      const divergenceDecision = selectGitmDecisionFields(deck, cwd);
      const stableBranch = divergenceDecision.stableBranch;
      const workingBranch = divergenceDecision.workingBranch;
      let commitsDivergenceCount = 0;
      if (location === 'scp' && cwd !== '' && stableBranch.length > 0 && workingBranch.length > 0) {
        const revList = gitmExec(['rev-list', '--count', `${stableBranch}..${workingBranch}`], cwd);
        if (revList.ok) {
          const parsed = parseInt(revList.stdout.trim(), 10);
          commitsDivergenceCount = Number.isNaN(parsed) ? 0 : parsed;
        }
      }

      // SCP dormant (no active SCP) — stamp an empty sub-state without a git read.
      if (location === 'scp' && cwd === '') {
        bucket.push({
          location,
          sub: createGitmLocationSubState(''),
          clearError,
          commitsDivergenceCount,
          resolvedScpCwd: '',
          activeScpDir,
        });
        return action.strategy ? strategySuccess(action.strategy) : muxiumConclude();
      }

      const status = readGitStatus(cwd);
      // GITM SCP-Sovereign — INCLUDE untracked (NEW files) in the count. A new file IS a change
      // between commits; without this the badge ignores every new file (the user's test files are
      // untracked → the badge read 0 despite git status showing them · Blank-Test-025 Concluder).
      const changeCount =
        status.stagedFiles.length +
        status.unstagedFiles.length +
        status.conflicts.length +
        status.untrackedFiles.length;
      if (location === 'scp') {
        log('gitm.recount.scp', { cwd, changeCount, untracked: status.untrackedFiles.length });
      }
      const sub: GitmLocationSubState = {
        cwd,
        isRepo: status.isRepo,
        currentBranch: status.currentBranch,
        dirty: status.dirty,
        changeCount,
        branches: status.branches,
        stagedFiles: status.stagedFiles,
        unstagedFiles: status.unstagedFiles,
        conflicts: status.conflicts,
        untrackedFiles: status.untrackedFiles,
        lastChangedAt: Date.now(),
      };
      bucket.push({
        location,
        sub,
        clearError,
        commitsDivergenceCount,
        resolvedScpCwd: location === 'scp' ? cwd : '',
        activeScpDir,
      });
      return action.strategy ? strategySuccess(action.strategy) : muxiumConclude();
    }),
});
