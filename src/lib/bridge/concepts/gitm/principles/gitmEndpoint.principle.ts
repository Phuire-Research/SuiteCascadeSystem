/**
 * gitmEndpoint Principle · GITM D2 (#633) · GITEP — SEAP GET + gitm.json write
 *
 * Two read-only projections of gitm state (Base→Informative law), both reactive
 * on the same Concept — placed in one principle (justified: one selector
 * subscription on lastReadAt, no second plan overhead; split later if it grows).
 *
 *   1. GET /gitm-status — SEAP pattern (acquired via d_.muxium.d.server.k.server
 *      in the principle BODY, copied from scsBridgeSessionArchiveEndpoint:42).
 *      The handler closure captures k_ (live DECK K selectors) → reads CURRENT
 *      state at call time, not bind time.
 *
 *   2. gitm.json writer — a plan watching k_.lastReadAt (the staleness witness;
 *      changes on EVERY STARC read regardless of repo delta — guarantees a new
 *      file event for the SCP-side watcher). Atomic tmp+rename via the module-
 *      scope serializing gitmWriteChain (the bridgeMetadata.ts single-writer
 *      precedent — chain never rejects so one failed write can't poison the next).
 *      Path: <userCwd>/Cascades/Bridge/gitm.json (bridge-owned territory).
 *
 * GITMUX boundary: gitm.json lives in Cascades/Bridge/ — NEVER `.git/`.
 * SCP relay extension (scpMessageRouter watcherKind 'gitmJson') is DEFERRED to
 * D3+ — the file lands now so the SCP can watch it later. Do NOT touch
 * scpMessageRouter in this Diamond.
 *
 * Template: scsBridgeSessionArchiveEndpoint.principle.huirth.ts (SEAP) ·
 *           bridgeMetadata.ts:126-187 (serializing atomic write chain) ·
 *           scpRegistryWatcher.principle.ts (FT-006 conclude · selector stage)
 * Citation: GITM-D2-S3-YELLOW-BLUEPRINT.md §5b · GITM-D2-S2-ORANGE-NAMING.md §4 (GITEP)
 */

import type { Deck, MuxiumDeck, PrincipleFunction } from 'stratimux';
import type { Request, Response } from 'express';
import { mkdir, writeFile, rename, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { ServerDeck } from '../../server/server.concept';
import type {
  GitmState,
  GitmABMode,
  GitmLocationSubState,
  GitmLocationKey,
  UpdateStatusShape,
} from '../gitm.types';
import type { PendingConfirm, GitmCommitGraphEntry, ActiveConflict } from '../qualities/types';
import type { GitmQualities } from '../gitm.concept';
// GITM Dev Epoch (MD-A) — the module-scope command-log ring lives in gitmExec.model.ts (gitmExec
// is a pure model with no state access). The GITEP snapshot COPIES readCommandLog() onto gitm.json
// at write time so the ring rides the file to the SCP without a selector (it is not GitmState-held).
// MD-E (part 2 · PROGRESS) — readCurrentOp() is copied the SAME way (the currentOp latch is module-
// scope in gitmExec.model, not GitmState-held): the GET handler reads it at call time (an HTTP poll
// during a long op sees the in-flight op); the writer plan copies it whenever any witness fires.
import { readCommandLog, readCurrentOp, type GitmProgress } from '../model/gitmExec.model';
// MULTI-SCP GITM MUXIFICATION (Fork B · MC-W3 · THE FAN-OUT) — the per-SCP slice store: GITEP fans out
// EVERY live SCP's gitm.json rail FROM its slice (buildSnapshotFromSlice), so each SCP reads ITS OWN
// git truth (branchRoles/stableBranch) instead of the fused CHIMERA the single write target produced.
import {
  getAllSlices,
  upsertSliceFields,
  type GitmRepoSlice,
} from '../model/gitmSliceStore.model';
import { GITM_SCHEMA_VERSION, createGitmLocationSubState } from '../gitm.types';

type GitmEndpointDeck = Deck<MuxiumDeck & ServerDeck>;

// The JSON-serializable projection of gitm state (excludes gitWatcher FSWatcher
// + the internal userCwd).
//
// GITM A↔B (#641) — the 5 A/B fields ride this snapshot. TQNI invariant: this shape
// MUST byte-match the SCP-side GitmJsonShape (gitm.type.ts) field-for-field — the relay
// carries a null parse if these diverge.
type GitmStatusSnapshot = {
  // THE VERSIONING MUXAMETER · the CLI self-update surface (TQNI: SCP GitmJsonShape mirror).
  cliUpdate: { status: string; installedOnDisk: string; runningVersion: string; error: string; at: number };
  isRepo: boolean;
  currentBranch: string;
  dirty: boolean;
  ahead: number;
  behind: number;
  branches: string[];
  stagedFiles: string[];
  unstagedFiles: string[];
  // GITM SCP-Sovereign — untracked (NEW) file PATHS on the relayed snapshot (the Untracked
  // panel section reads it). TQNI: mirror in SCP GitmJsonShape (Wave B) field-for-field.
  untrackedFiles: string[];
  // GITM Staging-Update (D-U4.1) — the thin live STAGE RAIL + summary counts (INERT until
  // D-U4.3). TQNI: mirror in SCP GitmJsonShape field-for-field.
  updateStatus: UpdateStatusShape;
  detachedHead: boolean;
  conflicts: string[];
  lastReadAt: number;
  // GITM Dev Menu (#644) — STASHCOUNT. TQNI: mirror in SCP GitmJsonShape (Wave B).
  stashCount: number;
  // C837 · THE REMOTE ORIGIN ('' = none) — the STARC read records it; the manifest origin
  // doctrine (remote priority) reads the same truth. TQNI: mirror in SCP GitmJsonShape.
  remoteOrigin: string;
  // C844 · THE HEAD COMMIT MESSAGE ('' = none) — the amend seed. TQNI: mirror in SCP GitmJsonShape.
  headCommitMessage: string;
  // GITM Dev Epoch (MD-B) — the labeled stash roster (`%gd|%s` lines). TQNI: mirror in SCP GitmJsonShape.
  stashList: string[];
  // GITM Dev Menu (#644) — pendingConfirm surfaces the WATCHKEY token to the UI so the
  // SAFEGUARD chips run the call-1 → call-2 handshake (T3 SAFEGUARD). null = no pending
  // confirm. TQNI: mirror in SCP GitmJsonShape (Wave B) field-for-field.
  pendingConfirm: PendingConfirm | null;
  // GITM A↔B (#641) — A/B reserve-mechanism fields.
  stableBranch: string;
  workingBranch: string;
  // D-BN · THE branchRoles SWEEP — the canonical A/B role truth relayed to the SCP (a=stable Shield,
  // b=working Sword). Maintained LOCKSTEP with stableBranch/workingBranch. TQNI: mirror in SCP GitmJsonShape.
  branchRoles: { a: string; b: string };
  abMode: GitmABMode;
  lastTurnOverResult: string;
  bMergeable: boolean;
  // GITM A↔B-R (#641-R) — Dual-Bridge refinement fields. TQNI: mirror in SCP GitmJsonShape.
  changesPrimedOnB: number;
  turnedOverTo: 'A' | 'B' | '';
  // C412 · THE ATTEMPT LEDGER projection — the reboot rehydration reads this back.
  // D-BN-2 · THE CARRY MEND — the union carries 'carry-A' (legacy confirmed-carry A-advance).
  // C791 · SERVE THE CARRY — plus 'carry-B' (the confirmed carry that reboots ONTO B) so the widened
  // GitmState.turnOverAttempt assigns cleanly onto the snapshot.
  turnOverAttempt: { source: 'A' | 'B' | 'carry-A' | 'carry-B'; targetBranch: string; ts: number } | null;
  // GITM color-cascade (W2 · Counter B) — commits-between divergence (rev-list A..B). TQNI:
  // mirror in SCP GitmJsonShape. Changes WITHOUT lastReadAt (gitmRecountLocation writes it).
  commitsDivergenceCount: number;
  // GITM Branch-Flow (#644) — the transient action-error surface. TQNI: mirror in SCP GitmJsonShape.
  errorCode: string;
  errorMessage: string;
  // GITM Dev Epoch (MD-A) — THE COMMAND LOG: the bounded gitmExec ring (cap 200 · newest-last),
  // COPIED from the module-scope readCommandLog() at snapshot-build time (it changes WITHOUT
  // lastReadAt — the writer plan carries it whenever a STARC read fires, which every mutating
  // gitmExec triggers via WATCHDIAL). TQNI: mirror in SCP GitmJsonShape (rides free · whole-file parse).
  commandLog: string[];
  // GITM Dev Epoch (MD-D) — THE REFLOG: the parsed reflog roster (gitmLoadReflog result). Changes
  // WITHOUT lastReadAt (the on-demand reflog read writes it directly), so it needs its own writer-plan
  // witness. TQNI: mirror in SCP GitmJsonShape.reflogEntries (rides free · whole-file parse).
  reflogEntries: string[];
  // GITM Dev Epoch (MD-D · THE THREE-WAY SURFACE) — the four sides of the file the conflict editor is
  // editing (gitmLoadConflict result · null = none). Changes WITHOUT lastReadAt, so it needs its own
  // writer-plan witness. TQNI: mirror in SCP GitmJsonShape.activeConflict (the leaner state-field relay).
  activeConflict: ActiveConflict | null;
  // GITM Dev Epoch (MD-E · part 2 · PROGRESS) — the live long-running-op strip ({ message, command } |
  // null · null = idle). COPIED from the module-scope readCurrentOp() (not a k selector — mirror
  // commandLog). TQNI: mirror in SCP GitmJsonShape.progress.
  progress: GitmProgress | null;
  // GITM Dev Epoch (MD-C · THE DAG) — the graph-log surface (gitmLoadLogGraph result). Changes
  // WITHOUT lastReadAt (the on-demand graph read writes commitGraph directly), so it needs its own
  // writer-plan witness. TQNI: mirror in SCP GitmJsonShape.commitGraph (rides free · whole-file parse).
  commitGraph: GitmCommitGraphEntry[];
  // GITM Dev Epoch (MD-C · fold #4 · THE DIFF RELAY) — the raw unified diff (gitmLoadDiff result).
  // Absent from the relay through MD-B (bridge-only state); MD-C relays it so the SCP Diff panel +
  // the per-hunk stage-from-diff surface can parse hunks client-side. Changes WITHOUT lastReadAt
  // (the on-demand diff read writes activeDiff directly), so it needs its own writer-plan witness.
  // CAP: ~400 lines with a truncation marker (mind gitm.json size). TQNI: mirror in SCP GitmJsonShape.
  activeDiff: string;
  // GITM 3LOC — the three-location nested block + rotation pointer + schema version. The
  // bridge writer ASSEMBLES this nested shape from the FLAT GitmState sub-states (the
  // FLAT-state ⊗ NESTED-json split). TQNI: mirror in SCP GitmJsonShape field-for-field.
  schemaVersion: number;
  mostRecentLocation: GitmLocationKey | '';
  locations: {
    base: GitmLocationSubState;
    cascade: GitmLocationSubState;
    scp: GitmLocationSubState;
  };
  // D-BN-2 · THE turnOver RELOCATION — the turn-over restart signal, moved off the per-SCP
  // bridge.json onto gitm.json. Changes WITHOUT lastReadAt (the turn-over reducer writes it
  // directly), so the writer plan needs its own k_.turnOver witness. TQNI: mirror in SCP
  // GitmJsonShape (optional there — legacy files predate it).
  turnOver: { at: number; source: string; hard: boolean };
  // C785 · scp_alert_turn_over — the user-directed Turn Over A alert. NOT composed by the
  // fan-out builders: the FILE is its home (scsBridgeAlertTurnOver writes it directly); THE
  // ALERT HOLD in writeGitmJsonUnsafe carries it write-to-write UNTIL a turnOver stamp NEWER
  // than requestedAt retires it. TQNI: mirror in SCP GitmJsonShape (optional there).
  turnOverAlert?: { requestedAt: number; source: string; purpose: string } | null;
};

// GITM Dev Epoch (MD-C · fold #4) — CAP the raw diff before it rides gitm.json (mind file size:
// the whole snapshot re-serializes on every STARC read). ~400 lines then a truncation marker; the
// SCP hunk-parser tolerates the marker (it splits on `@@` headers · the marker is not a hunk head).
const GITM_DIFF_LINE_CAP = 400;
function capDiffForRelay(raw: string): string {
  if (raw === '') return '';
  const lines = raw.split('\n');
  if (lines.length <= GITM_DIFF_LINE_CAP) return raw;
  const kept = lines.slice(0, GITM_DIFF_LINE_CAP).join('\n');
  const omitted = lines.length - GITM_DIFF_LINE_CAP;
  return `${kept}\n… diff truncated for relay — ${omitted} more line(s) · run gitm_load_diff with a path to scope`;
}

// MULTI-SCP GITM MUXIFICATION (Fork B · MC-W3 · THE FAN-OUT) — the write chain is now PER-RAIL. THE
// DEFECT the old single chain hid: it serialized ALL writes globally, but with N SCPs each writing its
// OWN gitm.json rail, one atomic tmp+rename PER RAIL (keyed by the rail's base dir) is the invariant —
// two rails never contend, and a rail's own writes stay ordered (tmp+rename atomicity per rail · brief
// INVARIANT 2). Keyed by the rail base (scpDir !== '' ? scpDir : userCwd). Never rejects (the chain
// swallows so one failed write can't poison the next · the bridgeMetadata.ts single-writer precedent).
const gitmWriteChainByRail = new Map<string, Promise<void>>();

// MD-A D3 · SCP BRIDGE SOVEREIGNTY — the snapshot lands on the CALLING SCP's own
// Cascades/Bridge/gitm.json (scpDir = the rail's base · the C238 sovereign pointer).
// The per-SCP gitm.json is the ONLY contact seam the bridge reaches through (the
// blindness contract). Degrade: no active SCP (dev:self · blank workspace) →
// scpDir === '' → the workspace path (today's behavior · the dev.ts scaffold target).
function writeGitmJson(scpDir: string, userCwd: string, snapshot: GitmStatusSnapshot): Promise<void> {
  const railBase = scpDir !== '' ? scpDir : userCwd;
  const prior = gitmWriteChainByRail.get(railBase) ?? Promise.resolve();
  const link = prior.then(() => writeGitmJsonUnsafe(scpDir, userCwd, snapshot));
  gitmWriteChainByRail.set(railBase, link.catch(() => undefined));
  return link;
}

// W2b (the Turn-Over Disconnect Guard) — the DECISION-FIELD HOLD. The persisted A/B decision fields
// {workingBranch, stableBranch, branchRoles} MUST survive the dark hour: the writer NEVER regresses
// the on-disk gitm.json to blank decision fields as a side effect of a crash/turn-over/restart. The
// ONE legitimate blank is the gitmResetAb zero-reset, which sets abMode:'idle' in LOCKSTEP with
// clearing the fields (gitmResetAb.quality.ts) — that MUST still pass through. So: a snapshot whose
// decision fields are all-blank while abMode is still ACTIVE (candidate-created/turned-over/success),
// over a prior file that HELD non-empty ones, is a spurious regression → hold the prior values.
function decisionFieldsAllBlank(s: {
  workingBranch: string;
  stableBranch: string;
  branchRoles?: { a: string; b: string };
}): boolean {
  const roles = s.branchRoles;
  const rolesBlank = !roles || (roles.a === '' && roles.b === '');
  return s.workingBranch === '' && s.stableBranch === '' && rolesBlank;
}

async function readPriorGitmJson(finalPath: string): Promise<GitmStatusSnapshot | null> {
  try {
    const raw = await readFile(finalPath, 'utf8');
    const parsed = JSON.parse(raw) as GitmStatusSnapshot;
    return typeof parsed.isRepo === 'boolean' ? parsed : null;
  } catch {
    return null; // ENOENT / parse-fail — no prior to hold against · the write proceeds.
  }
}

async function writeGitmJsonUnsafe(
  scpDir: string,
  userCwd: string,
  snapshot: GitmStatusSnapshot,
): Promise<void> {
  const base = scpDir !== '' ? scpDir : userCwd;
  const finalPath = join(base, 'Cascades', 'Bridge', 'gitm.json');
  const tmpPath = `${finalPath}.tmp`;

  // W2b · THE HOLD — never regress a previously non-empty decision field to blank OUTSIDE a
  // legitimate zero-reset. The reset blanks the fields WITH abMode:'idle'; a crash/turn-over blank
  // leaves abMode active. If the outgoing snapshot would blank the fields while abMode !== 'idle'
  // AND the prior file held non-empty ones, carry the prior decision fields into the outgoing write.
  let outgoing = snapshot;
  if (decisionFieldsAllBlank(snapshot) && snapshot.abMode !== 'idle') {
    const prior = await readPriorGitmJson(finalPath);
    if (prior && !decisionFieldsAllBlank(prior)) {
      outgoing = {
        ...snapshot,
        workingBranch: prior.workingBranch,
        stableBranch: prior.stableBranch,
        branchRoles: prior.branchRoles,
      };
    }
  }

  // C785 · THE ALERT HOLD — turnOverAlert lives on the FILE (scp_alert_turn_over writes it
  // directly; no fan-out builder composes it, so every snapshot write would silently drop it —
  // the W2b decision-field precedent). Carry the prior file's alert into the outgoing write
  // UNTIL a turnOver stamp NEWER than the alert's requestedAt lands — the user performed the
  // Turn Over; the alert SELF-RETIRES (no clear-write · no race against this chain).
  if (outgoing.turnOverAlert === undefined) {
    const priorForAlert = await readPriorGitmJson(finalPath);
    const alert = priorForAlert?.turnOverAlert;
    if (alert) {
      const stampAt = outgoing.turnOver?.at ?? priorForAlert?.turnOver?.at ?? 0;
      if (stampAt <= alert.requestedAt) {
        outgoing = { ...outgoing, turnOverAlert: alert };
      }
    }
  }

  await mkdir(join(base, 'Cascades', 'Bridge'), { recursive: true });
  await writeFile(tmpPath, JSON.stringify(outgoing, null, 2), 'utf8');
  await rename(tmpPath, finalPath);
}

// MULTI-SCP GITM MUXIFICATION (Fork B · MC-W3 · THE FAN-OUT) — assemble the UNCHANGED GitmStatusSnapshot
// shape (TQNI INVARIANT 1 · byte-parity with the active-rail builder) from a per-SCP SLICE + the
// bridge-GLOBAL fields. The slice carries the per-repo truth (branchRoles/stableBranch/status/locationScp);
// the globals (userCwd-scoped commandLog/progress · schemaVersion) are the same for every rail. locations
// .base/.cascade are NOT the SCP's own repos (they are the install root + Cascades/ · bridge-global), so
// a NON-active SCP's rail carries EMPTY base/cascade sub-states (its badge reads locations.scp · the RED
// self-scope · the only location an SCP is aware of · GITM SCP-Sovereign). commitLog is per-repo but is
// an on-demand read that only ever populates the ACTIVE view's slice — a non-active rail carries []
// (the SCP re-reads its own log on demand when it becomes active). commandLog/progress ride the globals.
function buildSnapshotFromSlice(userCwd: string, slice: GitmRepoSlice): GitmStatusSnapshot {
  const emptyBase = createGitmLocationSubState(userCwd);
  const emptyCascade = createGitmLocationSubState(join(userCwd, 'Cascades'));
  return {
    isRepo: slice.isRepo,
    currentBranch: slice.currentBranch,
    dirty: slice.dirty,
    ahead: slice.ahead,
    behind: slice.behind,
    branches: slice.branches,
    stagedFiles: slice.stagedFiles,
    unstagedFiles: slice.unstagedFiles,
    untrackedFiles: slice.untrackedFiles,
    updateStatus: slice.updateStatus,
    // THE VERSIONING MUXAMETER — the CLI self-update is bridge-global (not per-repo); a
    // non-active slice carries the idle seed (the ACTIVE rail carries the live state).
    cliUpdate: { status: 'idle', installedOnDisk: '', runningVersion: '', error: '', at: 0 },
    detachedHead: slice.detachedHead,
    conflicts: slice.conflicts,
    lastReadAt: slice.lastReadAt,
    stashCount: slice.stashCount,
    remoteOrigin: slice.remoteOrigin,
    headCommitMessage: slice.headCommitMessage,
    stashList: slice.stashList,
    pendingConfirm: slice.pendingConfirm,
    stableBranch: slice.stableBranch,
    workingBranch: slice.workingBranch,
    branchRoles: slice.branchRoles,
    abMode: slice.abMode,
    lastTurnOverResult: slice.lastTurnOverResult,
    bMergeable: slice.bMergeable,
    changesPrimedOnB: slice.changesPrimedOnB,
    turnedOverTo: slice.turnedOverTo,
    turnOverAttempt: slice.turnOverAttempt,
    commitsDivergenceCount: slice.commitsDivergenceCount,
    errorCode: slice.errorCode,
    errorMessage: slice.errorMessage,
    // Bridge-GLOBAL module-scope reads (same for every rail · the commandLog-ring precedent).
    commandLog: readCommandLog(),
    progress: readCurrentOp(),
    reflogEntries: slice.reflogEntries,
    activeConflict: slice.activeConflict,
    commitGraph: slice.commitGraph,
    activeDiff: capDiffForRelay(slice.activeDiff),
    schemaVersion: GITM_SCHEMA_VERSION,
    mostRecentLocation: 'scp',
    locations: {
      base: emptyBase,
      cascade: emptyCascade,
      scp: slice.locationScp,
    },
    turnOver: slice.turnOver,
  };
}

export const gitmEndpointPrinciple: PrincipleFunction<
  GitmQualities,
  GitmEndpointDeck,
  GitmState
> = ({ d_, k_, plan }) => {
  // SEAP: acquire the shared bridge Express app in the principle body (verbatim
  // from scsBridgeSessionArchiveEndpoint:42). Routes register synchronously.
  const expressApp = d_.muxium.d.server.k.server.select();
  if (!expressApp) {
    console.error('[Gitm GITEP] No Express server in state · /gitm-status NOT registered');
    return;
  }

  // GET /gitm-status — read-only snapshot built from live k_ selectors at call time.
  expressApp.get('/gitm-status', (_req: Request, res: Response) => {
    const snapshot: GitmStatusSnapshot = {
      isRepo: k_.isRepo.select(),
      currentBranch: k_.currentBranch.select(),
      dirty: k_.dirty.select(),
      ahead: k_.ahead.select(),
      behind: k_.behind.select(),
      branches: k_.branches.select(),
      stagedFiles: k_.stagedFiles.select(),
      unstagedFiles: k_.unstagedFiles.select(),
      untrackedFiles: k_.untrackedFiles.select(),
      // GITM Staging-Update (D-U4.1) — the thin live STAGE RAIL + summary counts (INERT).
      updateStatus: k_.updateStatus.select(),
      // THE VERSIONING MUXAMETER — the CLI self-update surface rides the snapshot.
      cliUpdate: k_.cliUpdate.select(),
      detachedHead: k_.detachedHead.select(),
      conflicts: k_.conflicts.select(),
      lastReadAt: k_.lastReadAt.select(),
      remoteOrigin: k_.remoteOrigin.select(),
      headCommitMessage: k_.headCommitMessage.select(),
      // GITM Dev Menu (#644) — STASHCOUNT.
      stashCount: k_.stashCount.select(),
      // GITM Dev Epoch (MD-B) — the labeled stash roster.
      stashList: k_.stashList.select(),
      // GITM Dev Menu (#644) — WATCHKEY token surface for the SAFEGUARD chips.
      pendingConfirm: k_.pendingConfirm.select(),
      // GITM A↔B (#641) — A/B reserve-mechanism fields.
      stableBranch: k_.stableBranch.select(),
      workingBranch: k_.workingBranch.select(),
      // D-BN · THE branchRoles SWEEP — the canonical A/B roles (lockstep with the pointers above).
      branchRoles: k_.branchRoles.select(),
      abMode: k_.abMode.select(),
      lastTurnOverResult: k_.lastTurnOverResult.select(),
      bMergeable: k_.bMergeable.select(),
      // GITM A↔B-R (#641-R) — Dual-Bridge refinement fields.
      changesPrimedOnB: k_.changesPrimedOnB.select(),
      turnedOverTo: k_.turnedOverTo.select(),
      turnOverAttempt: k_.turnOverAttempt.select(),
      // GITM color-cascade (W2 · Counter B) — commits-between divergence (rev-list A..B).
      commitsDivergenceCount: k_.commitsDivergenceCount.select(),
      // GITM Branch-Flow (#644) — the transient action-error surface.
      errorCode: k_.errorCode.select(),
      errorMessage: k_.errorMessage.select(),
      // GITM Dev Epoch (MD-A) — the command-log ring, COPIED from the module-scope readCommandLog()
      // (not a k_ selector — the ring is gitmExec.model-held, not GitmState-held).
      commandLog: readCommandLog(),
      // GITM Dev Epoch (MD-E · part 2) — the live progress latch, COPIED from readCurrentOp() (same
      // module-scope pattern). An HTTP poll during a long op sees the in-flight op here.
      progress: readCurrentOp(),
      // GITM Dev Epoch (MD-D) — the reflog roster + the active conflict surface.
      reflogEntries: k_.reflogEntries.select(),
      activeConflict: k_.activeConflict.select(),
      // GITM Dev Epoch (MD-C · THE DAG) — the graph-log surface.
      commitGraph: k_.commitGraph.select(),
      // GITM Dev Epoch (MD-C · fold #4) — the raw diff, capped for relay.
      activeDiff: capDiffForRelay(k_.activeDiff.select()),
      // GITM 3LOC — the three-location nested block assembled from the flat sub-states.
      schemaVersion: k_.schemaVersion.select(),
      mostRecentLocation: k_.mostRecentLocation.select(),
      locations: {
        base: k_.locationBase.select(),
        cascade: k_.locationCascade.select(),
        scp: k_.locationScp.select(),
      },
      // D-BN-2 · THE turnOver RELOCATION — the turn-over restart signal (moved off per-SCP bridge.json).
      turnOver: k_.turnOver.select(),
    };
    res.json(snapshot);
  });

  console.log('[Gitm GITEP] /gitm-status registered');

  // gitm.json writer — reactive on lastReadAt (the staleness witness) PLUS the A↔B
  // annotation fields (#641): gitmRegisterStable / gitmConfirmSuccess are pure state
  // annotations that do NOT advance lastReadAt, so abMode/bMergeable/stableBranch must
  // be observed directly for their change to relay through the gitm.json file.
  const writerPlan = plan('Gitm Json Writer', ({ stage, conclude }) => [
    stage(({ k }) => {
      const lastReadAt = k.lastReadAt.select();
      if (lastReadAt === 0) return; // no STARC read yet

      const userCwd = k.userCwd.select();
      // MD-A D3 · the calling SCP's package dir (C238 · set at SCP bind; '' when none active).
      const activeScpDir = k.activeScpDir.select();
      const snapshot: GitmStatusSnapshot = {
        isRepo: k.isRepo.select(),
        currentBranch: k.currentBranch.select(),
        dirty: k.dirty.select(),
        ahead: k.ahead.select(),
        behind: k.behind.select(),
        branches: k.branches.select(),
        stagedFiles: k.stagedFiles.select(),
        unstagedFiles: k.unstagedFiles.select(),
        untrackedFiles: k.untrackedFiles.select(),
        // GITM Staging-Update (D-U4.1) — the thin live STAGE RAIL + summary counts (INERT).
        updateStatus: k.updateStatus.select(),
        cliUpdate: k.cliUpdate.select(),
        detachedHead: k.detachedHead.select(),
        conflicts: k.conflicts.select(),
        lastReadAt,
        remoteOrigin: k.remoteOrigin.select(),
        headCommitMessage: k.headCommitMessage.select(),
        // GITM Dev Menu (#644) — STASHCOUNT.
        stashCount: k.stashCount.select(),
        // GITM Dev Epoch (MD-B) — the labeled stash roster.
        stashList: k.stashList.select(),
        // GITM Dev Menu (#644) — WATCHKEY token surface for the SAFEGUARD chips.
        pendingConfirm: k.pendingConfirm.select(),
        // GITM A↔B (#641) — A/B reserve-mechanism fields.
        stableBranch: k.stableBranch.select(),
        workingBranch: k.workingBranch.select(),
        // D-BN · THE branchRoles SWEEP — the canonical A/B roles (lockstep with the pointers above).
        branchRoles: k.branchRoles.select(),
        abMode: k.abMode.select(),
        lastTurnOverResult: k.lastTurnOverResult.select(),
        bMergeable: k.bMergeable.select(),
        // GITM A↔B-R (#641-R) — Dual-Bridge refinement fields.
        changesPrimedOnB: k.changesPrimedOnB.select(),
        turnedOverTo: k.turnedOverTo.select(),
        turnOverAttempt: k.turnOverAttempt.select(),
        // GITM color-cascade (W2 · Counter B) — commits-between divergence (rev-list A..B).
        commitsDivergenceCount: k.commitsDivergenceCount.select(),
        // GITM Branch-Flow (#644) — the transient action-error surface.
        errorCode: k.errorCode.select(),
        errorMessage: k.errorMessage.select(),
        // GITM Dev Epoch (MD-A) — the command-log ring, COPIED from readCommandLog() (module-scope ·
        // not a k selector). Every mutating gitmExec fires WATCHDIAL → a STARC read → lastReadAt
        // advances → this plan re-fires → the newest ring entries ride gitm.json.
        commandLog: readCommandLog(),
        // GITM Dev Epoch (MD-E · part 2) — the live progress latch, COPIED from readCurrentOp(). NO
        // dedicated k selector witness (the progress state slot is never reduced — the SOURCE is the
        // module latch): it rides FREE on every existing witness fire (like commandLog). A COMPOSITE
        // op's between-exec STARC reads (turn-over · merge) surface the still-set latch to gitm.json;
        // the HTTP GET path surfaces a single blocking op live (the honest >1s visibility seam).
        progress: readCurrentOp(),
        // GITM Dev Epoch (MD-D) — the reflog roster + the active conflict surface.
        reflogEntries: k.reflogEntries.select(),
        activeConflict: k.activeConflict.select(),
        // GITM Dev Epoch (MD-C · THE DAG) — the graph-log surface.
        commitGraph: k.commitGraph.select(),
        // GITM Dev Epoch (MD-C · fold #4) — the raw diff, capped for relay.
        activeDiff: capDiffForRelay(k.activeDiff.select()),
        // GITM 3LOC — the three-location nested block assembled from the flat sub-states.
        schemaVersion: k.schemaVersion.select(),
        mostRecentLocation: k.mostRecentLocation.select(),
        locations: {
          base: k.locationBase.select(),
          cascade: k.locationCascade.select(),
          scp: k.locationScp.select(),
        },
        // D-BN-2 · THE turnOver RELOCATION — the turn-over restart signal (moved off per-SCP bridge.json).
        turnOver: k.turnOver.select(),
      };
      void writeGitmJson(activeScpDir, userCwd, snapshot).catch((err: unknown) => {
        console.error('[Gitm GITEP] gitm.json write failed:', err);
      });

      // MULTI-SCP GITM MUXIFICATION (Fork B · MC-W3 · THE FAN-OUT) — the active rail was written above
      // EXACTLY as before (unchanged · INVARIANT 3). Now:
      //   (a) refresh the ACTIVE SCP's slice from the just-built active snapshot so the store never lags
      //       the flat view (the materialized-view law · the active rail's slice IS the flat state);
      //   (b) fan out EVERY OTHER live SCP's rail FROM its slice (buildSnapshotFromSlice → writeGitmJson
      //       to THAT rail · TQNI INVARIANT 1 · per-rail atomicity INVARIANT 2). A non-active SCP reads
      //       ITS OWN branchRoles/stableBranch/status — the CHIMERA is repaired.
      if (activeScpDir !== '') {
        upsertSliceFields(activeScpDir, {
          isRepo: snapshot.isRepo,
          currentBranch: snapshot.currentBranch,
          dirty: snapshot.dirty,
          ahead: snapshot.ahead,
          behind: snapshot.behind,
          branches: snapshot.branches,
          stagedFiles: snapshot.stagedFiles,
          unstagedFiles: snapshot.unstagedFiles,
          untrackedFiles: snapshot.untrackedFiles,
          updateStatus: snapshot.updateStatus,
          detachedHead: snapshot.detachedHead,
          conflicts: snapshot.conflicts,
          lastReadAt: snapshot.lastReadAt,
          remoteOrigin: snapshot.remoteOrigin,
          headCommitMessage: snapshot.headCommitMessage,
          stashCount: snapshot.stashCount,
          stashList: snapshot.stashList,
          pendingConfirm: snapshot.pendingConfirm,
          stableBranch: snapshot.stableBranch,
          workingBranch: snapshot.workingBranch,
          branchRoles: snapshot.branchRoles,
          abMode: snapshot.abMode,
          lastTurnOverResult: snapshot.lastTurnOverResult,
          bMergeable: snapshot.bMergeable,
          changesPrimedOnB: snapshot.changesPrimedOnB,
          turnedOverTo: snapshot.turnedOverTo,
          turnOverAttempt: snapshot.turnOverAttempt,
          commitsDivergenceCount: snapshot.commitsDivergenceCount,
          errorCode: snapshot.errorCode,
          errorMessage: snapshot.errorMessage,
          reflogEntries: snapshot.reflogEntries,
          activeConflict: snapshot.activeConflict,
          commitGraph: snapshot.commitGraph,
          activeDiff: snapshot.activeDiff,
          locationScp: snapshot.locations.scp,
          turnOver: snapshot.turnOver,
        });
      }

      const allSlices = getAllSlices();
      for (const [sliceScpDir, sliceEntry] of allSlices) {
        if (sliceScpDir === activeScpDir || sliceScpDir === '') {
          continue; // the active rail was already written above (unchanged)
        }
        // C645 · THE FAN-OUT GATE (contract enforcement · defense-in-depth under the MEND-B bind-seam
        // STARC) — SKIP any slice never live-enumerated (lastReadAt === 0). A never-read slice is born
        // branches:[] (createEmptyGitmRepoSlice); fanning it out writes a PHANTOM empty roster to that
        // rail verbatim. The composition contract: no per-SCP rail write before that dir's first live
        // enumeration (the bind seam lands its own first STARC · MEND B). Once the bind-seam STARC (or a
        // later .git event) lands the true roster, lastReadAt advances and the fan-out resumes for it.
        if (sliceEntry.lastReadAt === 0) {
          console.log('[Gitm GITEP] gitm.gitep.fanout-skip-unread', { scpDir: sliceScpDir });
          continue;
        }
        const railSnapshot = buildSnapshotFromSlice(userCwd, sliceEntry);
        void writeGitmJson(sliceScpDir, userCwd, railSnapshot).catch((err: unknown) => {
          console.error('[Gitm GITEP] gitm.json fan-out write failed for', sliceScpDir, ':', err);
        });
      }
    }, {
      selectors: [
        k_.lastReadAt,
        // GITM A↔B (#641) — the annotation-field witnesses (lastReadAt-independent change).
        k_.abMode,
        k_.bMergeable,
        k_.stableBranch,
        k_.workingBranch,
        // D-BN · THE branchRoles SWEEP — branchRoles changes lockstep with the pointers but a re-pair
        // (gitmSelectBranch) can advance roles WITHOUT lastReadAt, so it needs its own writer witness
        // or the canonical role change never relays to gitm.json.
        k_.branchRoles,
        k_.lastTurnOverResult,
        // GITM A↔B-R (#641-R) — changesPrimedOnB changes WITHOUT lastReadAt (CHANGEDIAL
        // recount writes it directly), so it needs its own witness; turnedOverTo likewise.
        k_.changesPrimedOnB,
        k_.turnedOverTo,
        // GITM color-cascade (W2 · Counter B) — commitsDivergenceCount changes WITHOUT lastReadAt
        // (gitmRecountLocation writes it directly on a SCP watcher fire), so it needs its own witness
        // or the Turn-Over A badge never relays the commits-between count.
        k_.commitsDivergenceCount,
        // GITM Dev Menu (#644) — pendingConfirm changes WITHOUT lastReadAt (the WATCHKEY
        // call-1 reducer writes it directly), so it needs its own witness to relay the
        // ARMED-state token to the UI; cleared on the call-2 execute + on gitmSetStatus.
        k_.pendingConfirm,
        // MD-C M7 — a NON-pointer origin's guard outcome (the confirm token, an error result)
        // lands ONLY on its slice; the one flat field every action still writes is
        // lastActionResult. Witnessing it guarantees the fan-out fires so the origin's rail
        // carries the slice-only change (else the token sat in the store, never relayed).
        k_.lastActionResult,
        // GITM Dev Epoch (MD-B) — stashList changes WITHOUT lastReadAt (the dedicated gitmStashList
        // quality writes it directly · NOT the STARC read), so it needs its own witness or the
        // labeled stash roster never relays to the Stash Browser panel.
        k_.stashList,
        // GITM Branch-Flow (#644) — errorCode/errorMessage change WITHOUT lastReadAt (the
        // mutating-action failure reducer writes them directly on !exec.ok), so each needs
        // its own witness or the error never relays; cleared on a real user-tree change
        // (CHANGEDIAL outside Cascades/Bridge/) + on the next gitmSetStatus STARC read.
        k_.errorCode,
        k_.errorMessage,
        // GITM 3LOC — the per-location sub-states + the rotation pointer change WITHOUT
        // lastReadAt (gitmRecountLocation writes them directly on a Cascade/SCP watcher fire),
        // so each needs its own witness or the rotation + the BLUE/RED counts never relay.
        k_.locationBase,
        k_.locationCascade,
        k_.locationScp,
        k_.mostRecentLocation,
        // GITM SCP-UPD (Cycle 282 · the 077 silent-stall root #2) — the update strategy nodes
        // write updateStatus (cloning → diffing → reviewing · error) WITHOUT lastReadAt, so it
        // needs its own witness or NO stage transition (including failures) ever reaches
        // gitm.json — the stage rail reads idle forever while the strategy runs and dies unseen.
        k_.updateStatus,
        // RS.4 · THE PER-SCP RAIL — a NON-active target's update stamp lands ONLY on its slice
        // and ticks this counter (the flat updateStatus is the ACTIVE projection), so it needs
        // its own witness or a concurrent second SCP's stage rail never relays to its gitm.json.
        k_.updateRailTick,
        // GITM Dev Epoch (MD-C · THE DAG · fold #4) — commitGraph + activeDiff change WITHOUT
        // lastReadAt (the on-demand graph/diff reads write them directly), so each needs its own
        // witness or the graph view + the Diff panel never relay to the SCP.
        k_.commitGraph,
        k_.activeDiff,
        // GITM Dev Epoch (MD-D) — reflogEntries + activeConflict change WITHOUT lastReadAt (the
        // on-demand reflog/conflict reads write them directly), so each needs its own witness or
        // the undo picker + the three-way editor never relay to the SCP.
        k_.reflogEntries,
        k_.activeConflict,
        // D-BN-2 · THE turnOver RELOCATION — turnOver changes WITHOUT lastReadAt (the turn-over
        // reducer writes it directly on the advance path), so it needs its own writer witness or the
        // relocated restart signal never reaches gitm.json for the SCP field-watcher to observe.
        k_.turnOver,
        // MD-A D3 · SCP BRIDGE SOVEREIGNTY — activeScpDir changes WITHOUT lastReadAt (the bind
        // qualities write it directly), and it is the WRITE-TARGET key: an SCP bind/switch must
        // re-land the snapshot on the NEW calling SCP's rail immediately, not on the next STARC.
        k_.activeScpDir,
      ],
      beat: 5,
    }),
    conclude(),
  ]);

  return () => {
    writerPlan.conclude();
  };
};
