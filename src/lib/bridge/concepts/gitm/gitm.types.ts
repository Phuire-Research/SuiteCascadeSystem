/**
 * gitm Type Definitions · GITM D2 (#633) · Gitm Epoch
 *
 * GITM (Git Intelligence Muxametric) — the Stratimux Concept holding T1
 * (Always-Visible) status state for the user's project git repository. A `gitm`
 * Base Concept whose State is kept live by the WATCHDIAL watcher + STARC parse.
 *
 * KeyedSelector law (CLAUDE.md State Design §4): ZERO optional fields — every
 * field non-optional with an empty default. DECK K Pattern `k.field.select()`
 * cannot handle `undefined` optionals in the base state.
 *
 * Template: scpRegistryWatcher.type.ts (FSWatcher-in-state · M60 pattern)
 * Citation: GITM-D2-S3-YELLOW-BLUEPRINT.md §2 · GITM-D2-S2-ORANGE-NAMING.md §1 (GITM)
 */

import type { FSWatcher } from 'chokidar';
import { join } from 'node:path';
import {
  createGitmActionResultDefault,
  type GitmCommitEntry,
  type GitmCommitGraphEntry,
  type GitmActionResult,
  type PendingConfirm,
  type GitmWarning,
  type ActiveConflict,
} from './qualities/types';
// GITM Dev Epoch (MD-E · part 2 · PROGRESS) — the progress-strip shape lives with the currentOp
// latch in gitmExec.model (the single source · set/cleared around the long-running execs).
import type { GitmProgress } from './model/gitmExec.model';

export const gitmName = 'gitm';

// GITM A↔B (#641) — the abMode state machine position. Drives the 4-button A↔B
// taskbar group + the merge gate (bMergeable). idle → candidate-created → turned-over
// → success → merged → (post-merge cleanup) → idle.
export type GitmABMode = 'idle' | 'candidate-created' | 'turned-over' | 'success' | 'merged';

// GITM 3LOC — the three color-coded git locations (the nested-git architecture).
// 'base' = the user's root repo (YELLOW) · 'cascade' = Cascades/ own repo (BLUE) ·
// 'scp' = the ACTIVE SCP repo (RED · self-scoped). '' = no rotation yet (boot).
// TQNI: mirror in GitmStatusSnapshot (gitmEndpoint.principle.ts) + SCP gitm.type.ts.
export type GitmLocationKey = 'base' | 'cascade' | 'scp';

// GITM Staging-Update (D-U4.1) — the thin live STAGE RAIL + summary counts the update
// tool rides on gitm.json. INERT until D-U4.3 stamps it. NO optionals (KeyedSelector law) ·
// summary nests concrete numbers (not optionals) for the same reason. TQNI: mirror in
// GitmStatusSnapshot (gitmEndpoint.principle.ts) + SCP GitmJsonShape (gitm.type.ts) byte-for-byte.
export type UpdateStatusShape = {
  stage: 'idle' | 'cloning' | 'diffing' | 'reviewing' | 'resolving' | 'applying' | 'error';
  stageError: string;
  scpName: string;
  cloneMode: string;
  summary: { apply: number; preserve: number; conference: number; collisionZones: string[] };
  resolvedPending: number;
  diffPresent: boolean;
  generatedAt: string;
  // GITM SCP-UPD · gitm_update_progress — the resolver session's live progress note (the Update
  // view renders "<what the session is doing now>"). '' = no note. TQNI: mirror in SCP UpdateStatusShape.
  note: string;
};
export const UPDATE_STATUS_EMPTY: UpdateStatusShape = {
  stage: 'idle', stageError: '', scpName: '', cloneMode: '',
  summary: { apply: 0, preserve: 0, conference: 0, collisionZones: [] },
  resolvedPending: 0, diffPresent: false, generatedAt: '', note: '',
};

// C293 · THE APPLIED TERMINAL NOTE (the bridge-owned terminal voice). Stamped by the apply
// quality's auto-sequence ({ stage:'idle', note: UPDATE_APPLIED_NOTE }) to fire the SCP's Apply
// Success panel (isApplied = stage idle + this note). The progress quality's REGRESSION GUARD
// matches this exact string to refuse a late 'resolving' stamp that would overwrite it (the STAMP
// RACE). TQNI: byte-match with the SCP template's UPDATE_APPLIED_NOTE (gitm.type.ts).
export const UPDATE_APPLIED_NOTE = 'update applied · Turn Over B to finalize';

// GITM 3LOC — per-location status sub-state. A focused subset of the single-location
// fields — the rotating badge + per-location panels read these. NO optionals
// (KeyedSelector law) · fully-populated empty defaults via createGitmLocationSubState.
// changeCount = staged+unstaged+conflicts (the "number goes up" for THIS location).
// lastChangedAt = the rotation stamp (Date.now() when THIS location's watcher fires).
// TQNI: mirror in GitmStatusSnapshot (gitmEndpoint.principle.ts) + SCP gitm.type.ts.
export type GitmLocationSubState = {
  cwd: string; // absolute path to this location's git root ('' = not present)
  isRepo: boolean; // this location is a git repo (its own .git)
  currentBranch: string;
  dirty: boolean;
  changeCount: number; // staged+unstaged+conflicts — the per-location "number goes up"
  branches: string[];
  stagedFiles: string[];
  unstagedFiles: string[];
  untrackedFiles: string[]; // GITM SCP-Sovereign — per-location untracked (NEW) PATHS (TQNI: SCP twin)
  conflicts: string[];
  lastChangedAt: number; // the rotation stamp — set when THIS location's watcher fires
};

export const createGitmLocationSubState = (cwd: string): GitmLocationSubState => ({
  cwd,
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
});

// THE SCP COMMAND MENU (W3 · THE WORKTREE RAIL) — one parsed `git worktree list --porcelain`
// row. path = the worktree's absolute checkout dir · branch = its checked-out ref (bare '' for a
// detached head) · head = the commit SHA it points at. The A tree itself appears in this roster
// (git lists the main working tree first); the UI keys instance rows off the `--wt-` name scheme.
// Non-optional (KeyedSelector law · every field a concrete string). TQNI-light: this is a bridge-
// read result surface (gitmWorktreeList lands it); it rides gitm.json for the helm's read.
export type GitmWorktreeRow = {
  path: string;
  branch: string;
  head: string;
};

export type GitmState = {
  userCwd: string;
  isRepo: boolean;
  currentBranch: string;
  // C837 · THE REMOTE ORIGIN ('' = none) — recorded by the STARC read. TQNI: mirror in
  // GitmStatusSnapshot (gitmEndpoint) + GitmRepoSlice + SCP GitmJsonShape.
  remoteOrigin: string;
  // C844 · THE HEAD COMMIT MESSAGE ('' = none) — the amend seed. TQNI: same mirrors.
  headCommitMessage: string;
  dirty: boolean;
  ahead: number;
  behind: number;
  branches: string[];
  stagedFiles: string[];
  unstagedFiles: string[];
  // GITM SCP-Sovereign — top-level mirror of the Base location's untracked (NEW) file PATHS.
  // The GITEP snapshot carries it to gitm.json; the SCP relay propagates it; the Untracked
  // panel section lists them. TQNI: mirror in GitmStatusSnapshot + SCP GitmJsonShape.
  untrackedFiles: string[];
  // GITM Staging-Update (D-U4.1) — the thin live STAGE RAIL + summary counts (INERT until
  // D-U4.3). The GITEP snapshot carries it to gitm.json; the SCP relay propagates it. TQNI:
  // mirror in GitmStatusSnapshot + SCP GitmJsonShape byte-for-byte.
  updateStatus: UpdateStatusShape;
  detachedHead: boolean;
  conflicts: string[];
  lastReadAt: number;
  // GITM Dev Menu (#644) — STASHCOUNT: stash-entry count (Pop-chip enablement · DEVBAR).
  // Non-optional (KeyedSelector law) · populated by the STARC read (git stash list).
  stashCount: number;
  // GITM Dev Epoch (MD-B · THE LABELED STASH BROWSER) — the full stash roster the Stash
  // Browser panel renders (`%gd|%s` lines · e.g. `stash@{0}|WIP on master: …`). Populated by
  // the dedicated gitmStashList quality (git stash list --format=%gd|%s), NOT the STARC read
  // (STARC coherence law — the roster is a separate on-demand read from stashCount). Non-optional
  // (KeyedSelector law · empty []). TQNI ×4: this field → GitmStatusSnapshot (gitmEndpoint) →
  // SCP GitmJsonShape (gitm.type.ts) → the gitmSetStatus/whole-file relay seam (rides free per MD-A).
  stashList: string[];
  // THE SCP COMMAND MENU (W3 · THE WORKTREE RAIL) — the parsed `git worktree list --porcelain`
  // roster (one GitmWorktreeRow per tree · the A tree first, then each `--wt-` instance). Populated
  // by the dedicated gitmWorktreeList quality (a pure read · NOT the STARC read) — mirrors stashList's
  // on-demand-roster discipline. Non-optional (KeyedSelector law · empty []). The helm reads it to
  // list per-instance rows for the DELETE (W4) affordance.
  worktrees: GitmWorktreeRow[];
  gitWatcher: FSWatcher | null;
  projectWatcher: FSWatcher | null; // CHANGEDIAL projectRoot watcher — excluded from serialization
  // D3 (#634) — T2 result surfaces (non-optional · KeyedSelector law)
  commitLog: GitmCommitEntry[]; // gitmLoadLog result — parsed log entries
  // GITM Dev Epoch (MD-C · THE DAG) — gitmLoadLogGraph result: TRUE-parent graph entries the
  // GitmCommitGraph.vue SVG DAG renders (lanes off parents · chips off refs · luminous HEAD).
  // Non-optional (KeyedSelector law · empty []). TQNI ×4: this field → GitmStatusSnapshot
  // .commitGraph (gitmEndpoint) → SCP GitmJsonShape.commitGraph (gitm.type.ts) → the whole-file
  // relay seam (rides free · the STCP parse is unfiltered).
  commitGraph: GitmCommitGraphEntry[];
  activeDiff: string; // gitmLoadDiff result — raw unified diff string
  lastActionResult: GitmActionResult; // action outcome surface — UI/MCP reads it
  // D4 (#635) — T3 guarded-op surfaces (non-optional · KeyedSelector law)
  pendingConfirm: PendingConfirm | null; // WATCHKEY token (null = no pending confirm)
  activeWarnings: GitmWarning[]; // REACTIVE-WARDEN latent warnings — REBUILT by gitmSetStatus
  // GITM A↔B (#641) — the A/B reserve-mechanism surfaces (non-optional · KeyedSelector law).
  // The bridge writes these to gitm.json (GITEP snapshot); the SCP relay propagates them.
  stableBranch: string; // A branch name; empty string = none registered
  workingBranch: string; // B branch name; empty string = none created
  // D-BN · THE branchRoles SWEEP — the CANONICAL A/B role truth. `a` = the stable Shield, `b` = the
  // working Sword; the `b/` name-prefix is PURE LINEAGE NAMING and NEVER decides role semantics
  // (isWorkingBranchFor consults roles.b first · mintWorkingBranchName uses the A name verbatim).
  // stableBranch/workingBranch REMAIN as the live UI-relay pointers and are maintained in LOCKSTEP
  // (a=stableBranch, b=workingBranch) so every existing relay key keeps working. Non-optional
  // (KeyedSelector law) · empty defaults { a:'', b:'' }. TQNI: mirror in GitmStatusSnapshot
  // (gitmEndpoint.principle.ts) + SCP GitmJsonShape (gitm.type.ts).
  branchRoles: { a: string; b: string };
  abMode: GitmABMode; // state machine position
  lastTurnOverResult: string; // 'success' | 'failed' | '' (empty = no result yet)
  bMergeable: boolean; // true when abMode === 'success' (the Merge B→A gate)
  // GITM A↔B-R (#641-R) — Dual-Bridge refinement surfaces (non-optional · KeyedSelector law).
  changesPrimedOnB: number; // CHANGEDIAL — live STARC dirty-file count on B (LOCKED Q2)
  turnedOverTo: 'A' | 'B' | ''; // direction the last turn-over took (S1 prune — abMode is direction-agnostic)
  // C412 · THE ATTEMPT LEDGER — the durable record of the LAST turn-over attempt, written by
  // the advance reducer and projected into gitm.json (the filesystem as the source of truth).
  // On bridge boot the rehydration CHECKS the attempt against the SCP server's own boot-report
  // activeBranch: a source:'B' attempt whose target matches the running branch restores
  // abMode 'turned-over' (the state the C326 observed-proof circuit gates on) — the machine
  // survives the restart. THE A-GUARD: a source:'A' attempt NEVER restores merge-enabling
  // state (an A-prove's own success must not register as B-proven). null = no attempt yet.
  // D-BN-2 · THE CARRY MEND — 'carry-A' marks the LEGACY confirmed-carry A-advance: the A switch that
  // FIRST carried the drift into B. The reboot rehydration recognizes it (attempt.targetBranch ===
  // persisted.branchRoles.b → restore 'turned-over') so the carried B survives a bridge restart —
  // UNLIKE a plain 'A' attempt (which the A-GUARD grounds).
  // C791 · SERVE THE CARRY — 'carry-B' marks the NEW confirmed-carry advance that reboots ONTO the
  // carried B (A stays the guarded stable). It restores 'turned-over' the SAME way 'B'/'carry-A' do
  // (roles.b === attempt.targetBranch → the boot-report proof gate). 'carry-A' is retained for legacy files.
  turnOverAttempt: { source: 'A' | 'B' | 'carry-A' | 'carry-B'; targetBranch: string; ts: number } | null;
  // GITM color-cascade (W2 · Counter B) — COMMITS-BETWEEN divergence: `git rev-list --count
  // <stableBranch>..<workingBranch>` (commits on B not yet on A). The "total changes between the
  // two branches" the Turn-Over A badge shows (UNLIKE changesPrimedOnB = the working-TREE count).
  // Populated in gitmRecountLocation (guarded on both branch names non-empty · else 0). Non-optional
  // (KeyedSelector law). TQNI: mirror in GitmStatusSnapshot (gitmEndpoint) + SCP GitmJsonShape.
  commitsDivergenceCount: number;
  // GITM Branch-Flow (#644) — the transient action-error surface carried in gitm.json. Set on
  // !exec.ok by the mutating qualities; cleared on a REAL user-tree change (CHANGEDIAL outside
  // Cascades/Bridge/) + on a fresh STARC read (gitmSetStatus). Non-optional (KeyedSelector law).
  // TQNI: mirror in GitmStatusSnapshot (gitmEndpoint.principle.ts) + SCP GitmJsonShape (gitm.type.ts).
  errorCode: string;
  errorMessage: string;
  // GITM Dev Epoch (MD-A) — THE COMMAND LOG: a bounded ring (cap 200 · newest-last) of every
  // gitmExec invocation, `[iso-ts] git <args> → exit:<0|code> stderr:<first-line>`. The ring
  // itself lives MODULE-scope in gitmExec.model.ts (readCommandLog()); the GITEP snapshot COPIES
  // it here at write time so it rides gitm.json. Non-optional (KeyedSelector law · empty []).
  // TQNI ×4: this field → GitmStatusSnapshot (gitmEndpoint) → SCP GitmJsonShape (gitm.type.ts) →
  // the gitmSetStatus relay seam (rides free via the whole-file STCP parse).
  commandLog: string[];
  // GITM Dev Epoch (MD-D) — THE REFLOG: the parsed `git reflog --format=%h|%gd|%gs -20` roster
  // (`<hash>|<selector>|<subject>` lines) the Universal-Undo picker renders. Populated by the
  // dedicated gitmLoadReflog quality (NOT the STARC read); changes WITHOUT lastReadAt so it needs
  // its own writer-plan witness (rides free · the relay carries it whole per TQNI ×4). Non-optional
  // (KeyedSelector law · empty []). TQNI ×4: this field → GitmStatusSnapshot (gitmEndpoint) → SCP
  // GitmJsonShape (gitm.type.ts) → the whole-file relay seam.
  reflogEntries: string[];
  // GITM Dev Epoch (MD-D · THE THREE-WAY SURFACE) — the four sides of the file the conflict editor
  // is currently editing (LOCAL/BASE/REMOTE/OUTPUT), loaded by gitmLoadConflict, cleared by
  // gitmResolveConflict on success. null = no conflict being edited. The LEANER TQNI choice over the
  // un-relayed mean result: rides gitm.json (bounded — one file at a time). TQNI ×4: this field →
  // GitmStatusSnapshot (gitmEndpoint) → SCP GitmJsonShape (gitm.type.ts) → the whole-file relay seam.
  activeConflict: ActiveConflict | null;
  // GITM Dev Epoch (MD-E · part 2 · PROGRESS) — the live long-running-op strip surface ({ message,
  // command } | null · null = idle). The bridge does NOT reduce this onto GitmState — the SOURCE is
  // the MODULE-scope currentOp latch in gitmExec.model (set/cleared by the long-running qualities'
  // methods around their exec). The GITEP snapshot COPIES readCurrentOp() here at write time (mirror
  // the commandLog pattern — not a GitmState-held selector). Declared on GitmState only for TQNI shape
  // parity + the KeyedSelector default; the writer plan never reads a k.progress selector. Non-optional
  // union (`GitmProgress | null` · KeyedSelector law). TQNI ×4: this field → GitmStatusSnapshot →
  // SCP GitmJsonShape → the whole-file relay seam (rides free · the STCP parse is unfiltered).
  progress: GitmProgress | null;
  // GITM 3LOC — the three-location sub-states (KeyedSelector: three FIXED-KEY flat
  // fields, NOT a dynamic-key map — k.locationBase.select() each a single witness).
  // The existing top-level fields (above) REMAIN as the Base location's authoritative
  // mirror — locationBase MIRRORS changesPrimedOnB/currentBranch/etc. for the rotation;
  // every A/B button / DEVBAR / SAFEGUARD still reads the flat fields (Decision A.4).
  // The gitm.json SERIALIZED shape nests these under locations{} (badge-friendly);
  // the STATE keeps them flat (selector-friendly) — the FLAT-state ⊗ NESTED-json split.
  locationBase: GitmLocationSubState;
  locationCascade: GitmLocationSubState;
  locationScp: GitmLocationSubState;
  // GITM 3LOC — the rotation pointer: the location whose watcher fired most recently
  // (argmax over lastChangedAt). '' at boot (the badge falls back to the Yellow baseline).
  mostRecentLocation: GitmLocationKey | '';
  // GITM 3LOC — the two new FSWatchers (NON-SERIALIZABLE · filterKeys excluded · Wave C).
  // Parameterized arms: cascade watches Cascades/ excl scps/; scp watches the active SCP.
  cascadeWatcher: FSWatcher | null;
  scpWatcher: FSWatcher | null;
  // GITM 3LOC — the active SCP directory the scpWatcher scopes to ('' = no SCP active ·
  // SCP self-awareness · the watcher re-arms on switch · Wave C).
  activeScpDir: string;
  // GITM 3LOC — the gitm.json schema version (the SCP parse gate rejects/upgrades old
  // flat v1 files explicitly · TQNI: mirror in GitmStatusSnapshot + SCP GitmJsonShape).
  schemaVersion: number;
  // D-BN-2 · THE turnOver RELOCATION — the turn-over restart SIGNAL, moved from the per-SCP
  // bridge.json onto gitm.json (branch business belongs on the git manifold file · user design).
  // The turn-over legs stamp { at: Date.now(), source, hard } through the reducer so it rides the
  // GITEP snapshot; the SCP field-watcher observes turnOver.at ADVANCE and writes the local blunt
  // trigger. Non-optional (KeyedSelector law · empty seed { at:0, source:'', hard:false }). TQNI:
  // mirror in GitmStatusSnapshot + SCP GitmJsonShape (optional there — legacy files).
  turnOver: { at: number; source: string; hard: boolean };
};

// GITM 3LOC — the current gitm.json schema version (2 = three-location nested shape).
export const GITM_SCHEMA_VERSION = 2;

export const createGitmState = (userCwd: string): GitmState => ({
  userCwd,
  isRepo: false,
  currentBranch: '',
  remoteOrigin: '',
  headCommitMessage: '',
  dirty: false,
  ahead: 0,
  behind: 0,
  branches: [],
  stagedFiles: [],
  unstagedFiles: [],
  untrackedFiles: [],
  updateStatus: UPDATE_STATUS_EMPTY,
  detachedHead: false,
  conflicts: [],
  lastReadAt: 0,
  stashCount: 0,
  // GITM Dev Epoch (MD-B · THE LABELED STASH BROWSER) — empty roster seed (populated by gitmStashList).
  stashList: [],
  // THE SCP COMMAND MENU (W3 · THE WORKTREE RAIL) — empty worktree roster seed (populated by gitmWorktreeList).
  worktrees: [],
  gitWatcher: null,
  projectWatcher: null,
  commitLog: [],
  // GITM Dev Epoch (MD-C · THE DAG) — empty graph seed (populated by gitmLoadLogGraph).
  commitGraph: [],
  activeDiff: '',
  lastActionResult: createGitmActionResultDefault(),
  pendingConfirm: null,
  activeWarnings: [],
  // GITM A↔B (#641) — A/B reserve-mechanism defaults (none registered · idle).
  stableBranch: '',
  workingBranch: '',
  // D-BN · THE branchRoles SWEEP — the canonical A/B role truth (none assigned).
  branchRoles: { a: '', b: '' },
  abMode: 'idle',
  lastTurnOverResult: '',
  bMergeable: false,
  // GITM A↔B-R (#641-R) — Dual-Bridge refinement defaults.
  changesPrimedOnB: 0,
  turnedOverTo: '',
  // C412 · the attempt ledger default (no attempt).
  turnOverAttempt: null,
  // GITM color-cascade (W2 · Counter B) — commits-between divergence default (0 = no divergence /
  // unregistered A↔B). Populated by gitmRecountLocation when both branch names are present.
  commitsDivergenceCount: 0,
  // GITM Branch-Flow (#644) — transient action-error surface defaults ('' = no error).
  errorCode: '',
  errorMessage: '',
  // GITM Dev Epoch (MD-A) — THE COMMAND LOG default (empty ring · the module-scope ring in
  // gitmExec.model.ts is the live source; the GITEP snapshot copies readCommandLog() over this).
  commandLog: [],
  // GITM Dev Epoch (MD-D) — empty reflog roster (populated by gitmLoadReflog on demand) + no
  // conflict being edited (populated by gitmLoadConflict · cleared by gitmResolveConflict).
  reflogEntries: [],
  activeConflict: null,
  // GITM Dev Epoch (MD-E · part 2 · PROGRESS) — the progress-strip default (null = idle · the GITEP
  // snapshot copies readCurrentOp() over this at write time · the state slot is only for KeyedSelector
  // parity, never selector-read).
  progress: null,
  // GITM 3LOC — the three-location sub-state defaults. Base cwd = userCwd; Cascade cwd =
  // <userCwd>/Cascades; SCP cwd = '' until an SCP is active (Wave C re-arms on switch).
  locationBase: createGitmLocationSubState(userCwd),
  locationCascade: createGitmLocationSubState(join(userCwd, 'Cascades')),
  locationScp: createGitmLocationSubState(''),
  mostRecentLocation: '',
  cascadeWatcher: null,
  scpWatcher: null,
  activeScpDir: '',
  schemaVersion: GITM_SCHEMA_VERSION,
  // D-BN-2 · THE turnOver RELOCATION — the turn-over signal seed (no turn-over yet · the SCP
  // field-watcher's baseline is turnOver.at, so 0 is the never-fired ground).
  turnOver: { at: 0, source: '', hard: false },
});
