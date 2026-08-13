/**
 * gitmSliceStore Model · MULTI-SCP GITM MUXIFICATION (Fork B · MC-W2 · THE SOVEREIGN SLICE)
 *
 * THE DEFECT this store repairs (THE CHIMERA SNAPSHOT): ONE flat GitmState served N running SCPs,
 * so an SCP's own Cascades/Bridge/gitm.json carried ITS git truth FUSED with ANOTHER SCP's
 * branchRoles/stableBranch — the dock badges + the B turn-over gate evaluated ALIEN roles.
 *
 * THE ARCHITECTURE (the commandLog-ring precedent already in gitmExec.model.ts): the flat GitmState
 * stays THE ACTIVE SLICE materialized view (reducers + DECK-K selectors UNTOUCHED). This MODULE-scope
 * Map<scpDir, GitmRepoSlice> holds PER-SCP truth — one rail per running SCP. GITEP (MC-W3) fans out
 * EVERY live SCP's gitm.json rail FROM its slice; the active SCP's slice is refreshed from the flat
 * view so the store never lags. A non-active SCP's watcher (MC-W2 registry) writes ONLY its slice
 * (never the flat state — that would re-introduce the CHIMERA).
 *
 * GitmRepoSlice = the PER-REPO identity subset of GitmState (the fields whose value is specific to a
 * single repo). Bridge-GLOBAL fields (userCwd, schemaVersion, the module-scope commandLog/progress)
 * are NOT here — GITEP composes them onto every rail (they are the same for all SCPs · MC-W3).
 * TQNI invariant: buildSnapshotFromSlice (gitmEndpoint) assembles the UNCHANGED GitmStatusSnapshot
 * shape from a slice + the bridge-global fields.
 *
 * Precedent: gitmExec.model.ts §THE COMMAND LOG RING (module-scope · defensive-copy read seam) ·
 *            childProcessRegistry.ts (module-Map keyed by scp · NEVER enters Stratimux state · MMUI).
 * Citation: MC-W2 (THE WATCHER PLURALITY · brief step 5).
 */

import { log } from '../../../debugLog';
import type {
  GitmState,
  GitmABMode,
  GitmLocationSubState,
} from '../gitm.types';
import type {
  GitmCommitEntry,
  GitmCommitGraphEntry,
  PendingConfirm,
  GitmWarning,
  ActiveConflict,
} from '../qualities/types';

// The PER-REPO identity subset of GitmState — every field whose truth is specific to ONE SCP's repo.
// Byte-parity with the GitmState field names (cross-checked against gitm.types.ts) so
// buildSnapshotFromSlice (MC-W3) can assemble the GitmStatusSnapshot without re-mapping. NON-optional
// (KeyedSelector parity with the state defaults) — createEmptyGitmRepoSlice seeds every field.
export type GitmRepoSlice = {
  // ── STARC status (per-repo working-tree + branch truth) ──
  isRepo: boolean;
  currentBranch: string;
  dirty: boolean;
  ahead: number;
  behind: number;
  branches: string[];
  stagedFiles: string[];
  unstagedFiles: string[];
  untrackedFiles: string[];
  detachedHead: boolean;
  conflicts: string[];
  stashCount: number;
  stashList: string[];
  lastReadAt: number;
  // C837 · the per-repo remote origin ('' = none) — the STARC read records it.
  remoteOrigin: string;
  // C844 · the per-repo HEAD subject ('' = none) — the amend seed.
  headCommitMessage: string;
  // ── A↔B reserve-mechanism (the CHIMERA's core: branchRoles/stableBranch fused across SCPs) ──
  stableBranch: string;
  workingBranch: string;
  branchRoles: { a: string; b: string };
  abMode: GitmABMode;
  lastTurnOverResult: string;
  bMergeable: boolean;
  changesPrimedOnB: number;
  turnedOverTo: 'A' | 'B' | '';
  turnOverAttempt: { source: 'A' | 'B' | 'carry-A' | 'carry-B'; targetBranch: string; ts: number } | null;
  commitsDivergenceCount: number;
  // D-TOH H3 — targetScpName rides the per-rail stamp (mirror gitm.types.ts).
  turnOver: { at: number; source: string; hard: boolean; targetScpName: string };
  // ── transient action-error surface (per-repo) ──
  errorCode: string;
  errorMessage: string;
  activeWarnings: GitmWarning[];
  pendingConfirm: PendingConfirm | null;
  // ── on-demand result surfaces (per-repo reads) ──
  commitLog: GitmCommitEntry[];
  commitGraph: GitmCommitGraphEntry[];
  activeDiff: string;
  reflogEntries: string[];
  activeConflict: ActiveConflict | null;
  // ── the SCP location sub-state + the schema-carried update rail (per-repo) ──
  locationScp: GitmLocationSubState;
  updateStatus: GitmState['updateStatus'];
  // ── the rail's own dir (self-reference · the slice key echoed for the snapshot's locations.scp.cwd) ──
  scpDir: string;
};

// The empty-shape seed (KeyedSelector-parity defaults · the ACTIVE-slice materialized-view law).
export const createEmptyGitmRepoSlice = (scpDir: string): GitmRepoSlice => ({
  isRepo: false,
  currentBranch: '',
  dirty: false,
  ahead: 0,
  behind: 0,
  branches: [],
  stagedFiles: [],
  unstagedFiles: [],
  untrackedFiles: [],
  detachedHead: false,
  conflicts: [],
  stashCount: 0,
  stashList: [],
  lastReadAt: 0,
  remoteOrigin: '',
  headCommitMessage: '',
  stableBranch: '',
  workingBranch: '',
  branchRoles: { a: '', b: '' },
  abMode: 'idle',
  lastTurnOverResult: '',
  bMergeable: false,
  changesPrimedOnB: 0,
  turnedOverTo: '',
  turnOverAttempt: null,
  commitsDivergenceCount: 0,
  turnOver: { at: 0, source: '', hard: false, targetScpName: '' },
  errorCode: '',
  errorMessage: '',
  activeWarnings: [],
  pendingConfirm: null,
  commitLog: [],
  commitGraph: [],
  activeDiff: '',
  reflogEntries: [],
  activeConflict: null,
  locationScp: {
    cwd: scpDir,
    isRepo: false,
    currentBranch: '',
    dirty: false,
    changeCount: 0,
    branches: [],
    stagedFiles: [],
    unstagedFiles: [],
    untrackedFiles: [],
    conflicts: [],
    lastChangedAt: 0,
  },
  updateStatus: {
    stage: 'idle', stageError: '', scpName: '', cloneMode: '',
    summary: { apply: 0, preserve: 0, conference: 0, collisionZones: [] },
    resolvedPending: 0, diffPresent: false, generatedAt: '', note: '',
  },
  scpDir,
});

// ─── MODULE-LEVEL SLICE STORE ───────────────────────────────────
// Keyed by scpDir (the SCP PACKAGE dir · the SAME key gitmSetActiveScpDir binds + the watcher
// registry arms on). NEVER enters Stratimux state (MMUI escape hatch · M60 State-or-Payload Anor ·
// the childProcessRegistry precedent) — the slice holds serializable per-repo data the GITEP writer
// reads at write time (mirror readCommandLog).

const sliceByScpDir = new Map<string, GitmRepoSlice>();

// Overwrite the whole slice for a dir. Seeds the empty shape first if absent is the caller's concern
// (upsertSliceFields handles the merge path).
export function setSlice(scpDir: string, slice: GitmRepoSlice): void {
  sliceByScpDir.set(scpDir, slice);
  log('gitm.slice.set', { scpDir, currentBranch: slice.currentBranch, changeCount: slice.locationScp.changeCount });
}

// Read one slice (undefined = no rail for this dir yet).
export function getSlice(scpDir: string): GitmRepoSlice | undefined {
  return sliceByScpDir.get(scpDir);
}

// Snapshot all live slices (defensive copy — mutating the returned Map does not affect the store).
// The GITEP fan-out (MC-W3) iterates this to write every SCP's rail.
export function getAllSlices(): Map<string, GitmRepoSlice> {
  return new Map(sliceByScpDir);
}

// Remove a rail (rides the watcher DISARM on spawn-exit · MC-W2 step 8 — a dead SCP's rail retires).
export function deleteSlice(scpDir: string): boolean {
  const existed = sliceByScpDir.delete(scpDir);
  if (existed) {
    log('gitm.slice.delete', { scpDir });
  }
  return existed;
}

// Merge a partial into the slice for a dir (seeds the empty shape first if absent). The QUALITY-layer
// slice writer (MC-W2 step 9): gitmSetStatus / gitmRecountLocation / turn-over reducers call this AFTER
// computing the new values for the resolved target cwd. When resolvedCwd === the active dir, state AND
// slice both update (the materialized-view invariant); a non-active SCP updates ONLY its slice.
export function upsertSliceFields(scpDir: string, partial: Partial<GitmRepoSlice>): void {
  const current = sliceByScpDir.get(scpDir) ?? createEmptyGitmRepoSlice(scpDir);
  const next: GitmRepoSlice = { ...current, ...partial, scpDir };
  sliceByScpDir.set(scpDir, next);
  log('gitm.slice.set', { scpDir, fields: Object.keys(partial).length });
}

// RS.4 · THE PER-SCP RAIL — merge a partial onto the TARGET's slice updateStatus (authoritative
// per SCP; the flat field is the ACTIVE projection). The update-family reducers call this for
// their resolved target, then write flat ONLY when the target IS the active dir (else they tick
// updateRailTick so the GITEP fan-out relays the slice-only change). Seeds the empty slice if
// the dir has no rail yet (the C645 fan-out gate still holds a never-enumerated rail).
export function stampSliceUpdateStatus(
  scpDir: string,
  partial: Partial<GitmRepoSlice['updateStatus']>,
): void {
  if (scpDir === '') return;
  const current = sliceByScpDir.get(scpDir) ?? createEmptyGitmRepoSlice(scpDir);
  const next: GitmRepoSlice = {
    ...current,
    updateStatus: { ...current.updateStatus, ...partial },
  };
  sliceByScpDir.set(scpDir, next);
  log('gitm.slice.update-status.stamp', { scpDir, stage: next.updateStatus.stage });
}

// Test-teardown only (childProcessRegistry precedent). Production never calls this.
export function clearSliceStore(): void {
  sliceByScpDir.clear();
}
