/**
 * gitm Concept · GITM D2 (#633) · Gitm Epoch
 *
 * GITM (Git Intelligence Muxametric) — the reactive T1 status substrate. A Base
 * Concept the Gitm Suite 8 muxifies at Tier 2 (d.gitm.k.*) WITHOUT altering its
 * role as reactive state-source (Higher-Order Composition, not hierarchy).
 *
 * Two Qualities + two Principles:
 *   - gitmWatcherArm   (WATCHDIAL arm: one chokidar watcher on .git targets)
 *   - gitmSetStatus    (STARC result lands whole)
 *   - gitmWatchdialPrinciple  (WGHA bind + debounce + boot-time initial read)
 *   - gitmEndpointPrinciple   (GITEP GET /gitm-status + gitm.json writer)
 *
 * Principle ordering: Watchdial BEFORE Endpoint — Watchdial drives lastReadAt;
 * the Endpoint's writer plan reads it. (The Endpoint registers its route
 * synchronously and does not block on watcher state.)
 *
 * Template: scpRegistryWatcher.concept.ts (explicit Quality map · NEVER typeof)
 * Citation: GITM-D2-S3-YELLOW-BLUEPRINT.md §6
 */

import { createConcept, type Concept } from 'stratimux';
import { gitmName, createGitmState, type GitmState } from './gitm.types';

import { gitmWatcherArm, type GitmWatcherArm } from './qualities/gitmWatcherArm.quality';
import { gitmSetStatus, type GitmSetStatus } from './qualities/gitmSetStatus.quality';

// D3 (#634) — the 13 T2 action qualities
import { gitmStageFile, type GitmStageFile } from './qualities/gitmStageFile.quality';
import { gitmUnstageFile, type GitmUnstageFile } from './qualities/gitmUnstageFile.quality';
import { gitmCommit, type GitmCommit } from './qualities/gitmCommit.quality';
import { gitmBranchCreate, type GitmBranchCreate } from './qualities/gitmBranchCreate.quality';
import { gitmBranchSwitch, type GitmBranchSwitch } from './qualities/gitmBranchSwitch.quality';
import { gitmStashPush, type GitmStashPush } from './qualities/gitmStashPush.quality';
import { gitmStashPop, type GitmStashPop } from './qualities/gitmStashPop.quality';
// GITM Dev Epoch (MD-B) — the labeled stash browser roster + the branch-set Law + hunk staging.
import { gitmStashList, type GitmStashList } from './qualities/gitmStashList.quality';
import { gitmSelectBranch, type GitmSelectBranch } from './qualities/gitmSelectBranch.quality';
import { gitmAssignRole, type GitmAssignRole } from './qualities/gitmAssignRole.quality';
import { gitmResetAb, type GitmResetAb } from './qualities/gitmResetAb.quality';
import { gitmRenameBranch, type GitmRenameBranch } from './qualities/gitmRenameBranch.quality';
import { gitmStageHunk, type GitmStageHunk } from './qualities/gitmStageHunk.quality';
import { gitmLoadLog, type GitmLoadLog } from './qualities/gitmLoadLog.quality';
import { gitmLoadLogGraph, type GitmLoadLogGraph } from './qualities/gitmLoadLogGraph.quality';
import { gitmLoadDiff, type GitmLoadDiff } from './qualities/gitmLoadDiff.quality';
import { gitmDiscard, type GitmDiscard } from './qualities/gitmDiscard.quality';
import { gitmPull, type GitmPull } from './qualities/gitmPull.quality';
import { gitmPush, type GitmPush } from './qualities/gitmPush.quality';
import { gitmSetRemote, type GitmSetRemote } from './qualities/gitmSetRemote.quality';
import { gitmMergeFfOnly, type GitmMergeFfOnly } from './qualities/gitmMergeFfOnly.quality';

// GITM Dev Menu (#644) — the 5 DEVBAR action qualities (3 T2 + 2 T3)
import { gitmStageAll, type GitmStageAll } from './qualities/gitmStageAll.quality';
import { gitmUnstageAll, type GitmUnstageAll } from './qualities/gitmUnstageAll.quality';
import { gitmFetch, type GitmFetch } from './qualities/gitmFetch.quality';
import { gitmCommitAmend, type GitmCommitAmend } from './qualities/gitmCommitAmend.quality';
import { gitmDiscardAll, type GitmDiscardAll } from './qualities/gitmDiscardAll.quality';

// D4 (#635) — the 5 T3 guarded-op qualities (WATCHKEY round + guard-as-outcome)
import { gitmReset, type GitmReset } from './qualities/gitmReset.quality';
import { gitmBranchDelete, type GitmBranchDelete } from './qualities/gitmBranchDelete.quality';
import { gitmForcePush, type GitmForcePush } from './qualities/gitmForcePush.quality';
import { gitmMerge, type GitmMerge } from './qualities/gitmMerge.quality';
import { gitmMergeAbort, type GitmMergeAbort } from './qualities/gitmMergeAbort.quality';

// THE SCP COMMAND MENU (W3/W4 · THE WORKTREE RAIL) — the 3 worktree-rail qualities (add = create +
// register as a first-class SCPs.json citizen · list = pure read · remove = WATCHKEY destructive + retire).
import { gitmWorktreeAdd, type GitmWorktreeAdd } from './qualities/gitmWorktreeAdd.quality';
import { gitmWorktreeList, type GitmWorktreeList } from './qualities/gitmWorktreeList.quality';
import { gitmWorktreeRemove, type GitmWorktreeRemove } from './qualities/gitmWorktreeRemove.quality';

// GITM Dev Epoch (MD-D · TRUST COMPLETIONS) — universal undo (reflog) + the three-way conflict surface
import { gitmLoadReflog, type GitmLoadReflog } from './qualities/gitmLoadReflog.quality';
import { gitmUndo, type GitmUndo } from './qualities/gitmUndo.quality';
import { gitmLoadConflict, type GitmLoadConflict } from './qualities/gitmLoadConflict.quality';
import { gitmResolveConflict, type GitmResolveConflict } from './qualities/gitmResolveConflict.quality';

// GITM A↔B (#641) — the 7 A/B reserve-mechanism qualities
import { gitmStageAllAndCommit, type GitmStageAllAndCommit } from './qualities/gitmStageAllAndCommit.quality';
import { gitmRegisterStable, type GitmRegisterStable } from './qualities/gitmRegisterStable.quality';
import { gitmCreateWorking, type GitmCreateWorking } from './qualities/gitmCreateWorking.quality';
import { gitmTurnOverWithSource, type GitmTurnOverWithSource } from './qualities/gitmTurnOverWithSource.quality';
import { gitmRevertToStable, type GitmRevertToStable } from './qualities/gitmRevertToStable.quality';
import { gitmMergeWorking, type GitmMergeWorking } from './qualities/gitmMergeWorking.quality';
import { gitmConfirmSuccess, type GitmConfirmSuccess } from './qualities/gitmConfirmSuccess.quality';
import { gitmRehydrateAbState, type GitmRehydrateAbState } from './qualities/gitmRehydrateAbState.quality';

// GITM A↔B-R (#641-R) — CHANGEDIAL: the live recount quality (back-compat).
import { gitmRecountChanges, type GitmRecountChanges } from './qualities/gitmRecountChanges.quality';

// GITM SCP-SOVEREIGN — the SCP (RED) watcher arm is the SOLE location watcher + the unified
// recount. The Base (projectWatcher) + Cascade watcher arms are PRUNED (three-location collapse).
import { gitmScpWatcherArm, type GitmScpWatcherArm } from './qualities/gitmScpWatcherArm.quality';
import { gitmRecountLocation, type GitmRecountLocation } from './qualities/gitmRecountLocation.quality';
// MULTI-SCP GITM MUXIFICATION (Fork B · MC-W2 · THE WATCHER PLURALITY) — the per-SCP watcher arm/disarm
// qualities (the plurality: EACH running SCP arms its OWN .git + tree watcher pair in the registry).
import { gitmWatcherArmForScp, type GitmWatcherArmForScp } from './qualities/gitmWatcherArmForScp.quality';
import { gitmWatcherDisarmForScp, type GitmWatcherDisarmForScp } from './qualities/gitmWatcherDisarmForScp.quality';
// GITM SCP-SOVEREIGN — the first setter for activeScpDir (the linchpin · dispatched at the SCP
// bind seam). activeScpDir was '' with zero setters until this quality.
import { gitmSetActiveScpDir, type GitmSetActiveScpDir } from './qualities/gitmSetActiveScpDir.quality';
// GITM A↔B Auto-Induction ("Move with C") — the bind-seam quality that primes A + forks B +
// lands the user on B once per cycle (guarded · composes the #641 register/fork primitives).
import { gitmAutoInductAB, type GitmAutoInductAB } from './qualities/gitmAutoInductAB.quality';

// SCP-UPD D-U4.3 (Fork C) — the 4 SCP-update strategy qualities (entry + 3-node chain).
// gitmScpUpdateBegin is the gitm_run_update entry; the other 3 are the strategy nodes
// (ensureClone → runDiff → stageRelay). Read-only on the SCP (the diff script self-polices).
import { gitmScpUpdateBegin, type GitmScpUpdateBegin } from './qualities/gitmScpUpdateBegin.quality';
import { gitmScpUpdateEnsureClone, type GitmScpUpdateEnsureClone } from './qualities/gitmScpUpdateEnsureClone.quality';
import { gitmScpUpdateRunDiff, type GitmScpUpdateRunDiff } from './qualities/gitmScpUpdateRunDiff.quality';
import { gitmScpUpdateStageRelay, type GitmScpUpdateStageRelay } from './qualities/gitmScpUpdateStageRelay.quality';
// SCP-UPD D-U5 — the APPLY quality (the held gate · gitm_run_apply · reads the resolved manifest,
// HALTs on pending, lands write/patch/preserve into the SCP tree, stages+commits via the gitmExec seam).
import { gitmScpUpdateApply, type GitmScpUpdateApply } from './qualities/gitmScpUpdateApply.quality';
// SCP-UPD · gitm_update_progress — the UI-tool the resolver session fires to STAMP its live
// position onto updateStatus (the Update view renders it · pure state stamp · no git).
import { gitmScpUpdateProgress, type GitmScpUpdateProgress } from './qualities/gitmScpUpdateProgress.quality';

import { gitmWatchdialPrinciple } from './principles/gitmWatchdial.principle';
import { gitmEndpointPrinciple } from './principles/gitmEndpoint.principle';
// GITM SCP-SOVEREIGN — only the SCP (RED) dial principle is registered (the Base + Cascade
// dials are PRUNED with their watcher arms). The gitmLocationDials.principle.ts file retains the
// gitmBaseDial/gitmCascadeDial exports on disk for reference; they are no longer wired.
import { gitmScpDialPrinciple } from './principles/gitmLocationDials.principle';
// SCP-UPD C289 · AUTO-APPLY-ON-MANIFEST — the bridge-owned Concluding Sequence trigger.
import { gitmResolvedManifestWatchPrinciple } from './principles/gitmResolvedManifestWatch.principle';
// C300 · THE ONE-SHOT SEAT RETURN — the bridge-owned Observed Seat Return watcher (CLAUSE 6).
import { gitmBootReportWatchPrinciple } from './principles/gitmBootReportWatch.principle';

// EXPLICIT Quality type mapping — NEVER typeof (CLAUDE.md non-negotiable)
export type GitmQualities = {
  gitmWatcherArm: GitmWatcherArm;
  gitmSetStatus: GitmSetStatus;
  // D3 (#634) — the 13 T2 action qualities
  gitmStageFile: GitmStageFile;
  gitmUnstageFile: GitmUnstageFile;
  gitmCommit: GitmCommit;
  gitmBranchCreate: GitmBranchCreate;
  gitmBranchSwitch: GitmBranchSwitch;
  gitmStashPush: GitmStashPush;
  gitmStashPop: GitmStashPop;
  // GITM Dev Epoch (MD-B) — stash roster + branch-set Law + hunk staging
  gitmStashList: GitmStashList;
  gitmSelectBranch: GitmSelectBranch;
  // D2 M9 W1 · the Tactical Bridge explicit role controls.
  gitmAssignRole: GitmAssignRole;
  // D4 (C611) · the A/B machine recovery quality (zero to idle · re-arms the auto-induction).
  gitmResetAb: GitmResetAb;
  gitmRenameBranch: GitmRenameBranch;
  gitmStageHunk: GitmStageHunk;
  gitmLoadLog: GitmLoadLog;
  // GITM Dev Epoch (MD-C · THE DAG) — the graph-log surface (commitGraph)
  gitmLoadLogGraph: GitmLoadLogGraph;
  gitmLoadDiff: GitmLoadDiff;
  gitmDiscard: GitmDiscard;
  gitmPull: GitmPull;
  gitmPush: GitmPush;
  gitmSetRemote: GitmSetRemote;
  gitmMergeFfOnly: GitmMergeFfOnly;
  // GITM Dev Menu (#644) — the 5 DEVBAR action qualities
  gitmStageAll: GitmStageAll;
  gitmUnstageAll: GitmUnstageAll;
  gitmFetch: GitmFetch;
  gitmCommitAmend: GitmCommitAmend;
  gitmDiscardAll: GitmDiscardAll;
  // D4 (#635) — the 5 T3 guarded-op qualities
  gitmReset: GitmReset;
  gitmBranchDelete: GitmBranchDelete;
  gitmForcePush: GitmForcePush;
  gitmMerge: GitmMerge;
  gitmMergeAbort: GitmMergeAbort;
  // THE SCP COMMAND MENU (W3/W4) — the 3 worktree-rail qualities (add · list · remove)
  gitmWorktreeAdd: GitmWorktreeAdd;
  gitmWorktreeList: GitmWorktreeList;
  gitmWorktreeRemove: GitmWorktreeRemove;
  // GITM Dev Epoch (MD-D) — universal undo (reflog) + the three-way conflict surface
  gitmLoadReflog: GitmLoadReflog;
  gitmUndo: GitmUndo;
  gitmLoadConflict: GitmLoadConflict;
  gitmResolveConflict: GitmResolveConflict;
  // GITM A↔B (#641) — the 7 A/B reserve-mechanism qualities
  gitmStageAllAndCommit: GitmStageAllAndCommit;
  gitmRegisterStable: GitmRegisterStable;
  gitmCreateWorking: GitmCreateWorking;
  gitmTurnOverWithSource: GitmTurnOverWithSource;
  gitmRevertToStable: GitmRevertToStable;
  gitmMergeWorking: GitmMergeWorking;
  gitmConfirmSuccess: GitmConfirmSuccess;
  gitmRehydrateAbState: GitmRehydrateAbState;
  // GITM A↔B-R (#641-R) — CHANGEDIAL recount quality (back-compat)
  gitmRecountChanges: GitmRecountChanges;
  // GITM SCP-SOVEREIGN — the SOLE location watcher arm (SCP/RED) + the unified recount
  // + the activeScpDir setter. (Base projectWatcher + Cascade arms PRUNED.)
  gitmScpWatcherArm: GitmScpWatcherArm;
  gitmRecountLocation: GitmRecountLocation;
  gitmSetActiveScpDir: GitmSetActiveScpDir;
  // MULTI-SCP GITM MUXIFICATION (MC-W2) — the per-SCP watcher plurality arm/disarm qualities.
  gitmWatcherArmForScp: GitmWatcherArmForScp;
  gitmWatcherDisarmForScp: GitmWatcherDisarmForScp;
  // GITM A↔B Auto-Induction — the bind-seam induction quality (prime A + fork B + land on B)
  gitmAutoInductAB: GitmAutoInductAB;
  // SCP-UPD D-U4.3 (Fork C) — the 4 SCP-update strategy qualities (entry + 3-node chain).
  gitmScpUpdateBegin: GitmScpUpdateBegin;
  gitmScpUpdateEnsureClone: GitmScpUpdateEnsureClone;
  gitmScpUpdateRunDiff: GitmScpUpdateRunDiff;
  gitmScpUpdateStageRelay: GitmScpUpdateStageRelay;
  // SCP-UPD D-U5 — the APPLY quality (gitm_run_apply · the held gate).
  gitmScpUpdateApply: GitmScpUpdateApply;
  // SCP-UPD — the progress UI-tool (gitm_update_progress · stamps updateStatus).
  gitmScpUpdateProgress: GitmScpUpdateProgress;
};

export type GitmConcept = Concept<GitmState, GitmQualities>;

export type GitmDeck = {
  gitm: GitmConcept;
};

export type CreateGitmConceptOptions = {
  userCwd: string;
};

export const createGitmConcept = (options: CreateGitmConceptOptions) =>
  createConcept(
    gitmName,
    createGitmState(options.userCwd),
    {
      gitmWatcherArm,
      gitmSetStatus,
      // D3 (#634) — the 13 T2 action qualities
      gitmStageFile,
      gitmUnstageFile,
      gitmCommit,
      gitmBranchCreate,
      gitmBranchSwitch,
      gitmStashPush,
      gitmStashPop,
      // GITM Dev Epoch (MD-B) — stash roster + branch-set Law + hunk staging
      gitmStashList,
      gitmSelectBranch,
      gitmAssignRole,
      gitmResetAb,
      gitmRenameBranch,
      gitmStageHunk,
      gitmLoadLog,
      gitmLoadLogGraph,
      gitmLoadDiff,
      gitmDiscard,
      gitmPull,
      gitmPush,
      gitmSetRemote,
      gitmMergeFfOnly,
      // GITM Dev Menu (#644) — the 5 DEVBAR action qualities
      gitmStageAll,
      gitmUnstageAll,
      gitmFetch,
      gitmCommitAmend,
      gitmDiscardAll,
      // D4 (#635) — the 5 T3 guarded-op qualities
      gitmReset,
      gitmBranchDelete,
      gitmForcePush,
      gitmMerge,
      gitmMergeAbort,
      // THE SCP COMMAND MENU (W3/W4) — the 3 worktree-rail qualities (add · list · remove)
      gitmWorktreeAdd,
      gitmWorktreeList,
      gitmWorktreeRemove,
      // GITM Dev Epoch (MD-D) — universal undo (reflog) + the three-way conflict surface
      gitmLoadReflog,
      gitmUndo,
      gitmLoadConflict,
      gitmResolveConflict,
      // GITM A↔B (#641) — the 7 A/B reserve-mechanism qualities
      gitmStageAllAndCommit,
      gitmRegisterStable,
      gitmCreateWorking,
      gitmTurnOverWithSource,
      gitmRevertToStable,
      gitmMergeWorking,
      gitmConfirmSuccess,
      gitmRehydrateAbState,
      // GITM A↔B-R (#641-R) — CHANGEDIAL recount quality (back-compat)
      gitmRecountChanges,
      // GITM SCP-SOVEREIGN — the SOLE location watcher arm + recount + activeScpDir setter
      gitmScpWatcherArm,
      gitmRecountLocation,
      gitmSetActiveScpDir,
      // MULTI-SCP GITM MUXIFICATION (MC-W2) — the per-SCP watcher plurality arm/disarm qualities.
      gitmWatcherArmForScp,
      gitmWatcherDisarmForScp,
      // GITM A↔B Auto-Induction — the bind-seam induction quality (prime A + fork B + land on B)
      gitmAutoInductAB,
      // SCP-UPD D-U4.3 (Fork C) — the 4 SCP-update strategy qualities (entry + 3-node chain)
      gitmScpUpdateBegin,
      gitmScpUpdateEnsureClone,
      gitmScpUpdateRunDiff,
      gitmScpUpdateStageRelay,
      // SCP-UPD D-U5 — the APPLY quality (the held gate · gitm_run_apply)
      gitmScpUpdateApply,
      // SCP-UPD — the progress UI-tool (gitm_update_progress · stamps updateStatus)
      gitmScpUpdateProgress,
    },
    // GITM SCP-SOVEREIGN — only the SCP (RED) dial is wired. The Base + Cascade dials are PRUNED
    // (their watcher arms no longer fire). The SCP dial binds scpWatcher (active SCP self) and
    // dispatches gitmRecountLocation('scp') — which now also writes changesPrimedOnB (W4 re-point).
    [
      gitmWatchdialPrinciple,
      gitmEndpointPrinciple,
      gitmScpDialPrinciple,
      gitmResolvedManifestWatchPrinciple,
      // C300 · THE ONE-SHOT SEAT RETURN — standing boot-report watcher (arm-gated · CLAUSE 6).
      gitmBootReportWatchPrinciple,
    ],
  );
