import { emitKeypressEvents } from 'node:readline';
import { createFileWatcher } from '../bridge/watcherSingleton.model';
import {
  applyKeypress,
  renderMenu,
  preserveCursorAcrossUpdate,
  SYNTHETIC_NEW,
  SYNTHETIC_CLOSE,
  SYNTHETIC_INSTALL,
  SYNTHETIC_INSTALL_SCP,
  SYNTHETIC_ENGAGE_SCP,
  type MenuState,
  type KeypressInput,
} from '../bridge/menu';
// Epoch Extension · Macro AV · bridge-direct archive primitives (same-process,
// no HTTP relay — mirrors the dissipateSession/archiveSession direct-call pattern).
import {
  buildArchiveManifest,
  readArchiveContents,
  MANIFEST_CAP,
} from '../bridge/archiveManifest.model';
import {
  createInitialWizardState,
  applyWizardInput,
  validateDesignationForWizard,
  deriveNamesFromDesignation,
} from '../scp/installScpPrompts';
import { runInstallScpPipelineAsync } from '../scp/scpInstall';
import { readScpRegistry, upsertTemplateCitizen } from '../scp/scpPersistence';
import { detectMuxState } from '../bridge/muxDetect';
import { sendElectronQuitViaSocket } from '../bridge/electronWindowSpawn';
import {
  addSession,
  listSessions,
  removeSession,
  // TBHK · Dissolution + Archival Diamond · TUI hotkeys call these directly (the SAME
  // anchor-guarded + resilient fns the MCP tool path uses · Shared-Function-Discipline).
  dissipateSession,
  archiveSession,
  markSessionOffline,
  markAllSessionsOffline,
  pruneGhostSessions,
  setSessionScsLabel,
  // C1104 · ruling A · the TUI model-pick leg calls the SAME in-process registry
  // writer the scs_set_session_model MCP quality calls (D3D shared-function law —
  // the TUI runs inside the bridge process, so it never round-trips its own MCP).
  setSessionModel,
  // C1104 · ruling m-A · the one-time birth-stamp sweep, fired once at daemon boot.
  reconcileSessionModels,
  setSessionPreferredScp,
} from '../bridge/registry';
import { registryPath, bridgeRoot, scpsJsonPath } from '../bridge/paths';
// C1104 · ruling A · the model roster the picker walks (the SAME catalog the MCP tool,
// the page and the resume doors read — one roster, every surface).
import { AVAILABLE_MODELS } from '../../shared/modelCatalog.model';
import { environmentName } from '../bridge/workspaceSocket.model';
// PSSM · W4 · the SCPs.json boot consistency sweep (markAllSessionsOffline mirror).
// MD-ARC+C · Wave 5a (MD-ARC-R3-BLUEPRINT §5) — Archive / Reinstate direct calls.
// The TUI hosts the bridge in-process, so these are AWAITed directly (NOT quality
// dispatches) — the guard reasons (stop-first · worktrees-present · retire) surface
// inline on the confirm pane. listArchivedScps populates the Archived fold.
import {
  markAllScpsPending,
  archiveScpEntry,
  reinstateScpEntry,
  listArchivedScps,
} from '../bridge/scpSessionRegistry';
import {
  createSession,
  hasResumableIdentity,
  scaffoldDiscoveredSession,
} from '../bridge/manager';
import { focusElectronSessionForUlid, spawnElectronSessionForUlid } from '../bridge/electronSessionSpawn';
import {
  runInstallSpawnPipeline,
  runInstallScaffoldOnly,
  runInstallMuxifiedPath,
  pollScaffoldComplete,
  cleanupInstallTemp,
} from '../bridge/installSpawn';
import { getBridgeVersion } from '../bridge/bridgeVersion';
import { preSeedTrust } from '../bridge/trustPreSeed';
import {
  SCS_INSTALL_REPO_URL,
  SCS_INSTALL_PRIMING_PROMPT,
  SCS_PATH_A_PRIMING_PROMPT,
  SCS_INSTALL_MUXIFY_AGENT_PROMPT,
  resolveInstallationStatus,
  isInstallationComplete,
  isInstallationInProgress,
  isInstallationLegacy,
  markScpInstallNoteShown,
  type InstallationStatus,
} from '../bridge/installConstants';
import {
  discoverPersistedSessions,
  synthesizeDiscoveredUlid,
} from '../bridge/sessionPersistence';
import { watchFile, unwatchFile, existsSync, readFileSync, statSync, realpathSync } from 'node:fs';
import path from 'node:path';
import {
  bootBridgeDaemon,
  closeBridgeDaemon,
  getActiveScsBridgeMuxiumHandle,
} from '../bridge/scsBridgeMuxium';
import { findFreeBridgePort, setActiveBridgePort } from '../bridge/activeBridgePort.model';
import { acquireGlobalBridgeMutex, listSiblingHolders, releaseGlobalBridgeMutex } from '../bridge/globalBridgeMutex.model';
import { createEnvelope, enqueueMessage } from '../bridge/message';
import {
  writeBridgeMetadata,
  bridgeMetadataPathPerProject,
  type BridgeMetadataState,
} from '../bridge/bridgeMetadata';
import { ulid } from 'ulid';
import type { ScpLifecycleStateValue } from '../bridge/concepts/scpLifecycle/scpLifecycle.type';
import type { ScpSpawnEntry } from '../bridge/concepts/scpSpawnManager/scpSpawnManager.type';
import { createGrid, serializeGrid, type Grid } from './grid';
import { createOverlay, setOverlayText, composeOverlayOnGrid, type OverlayMap } from './overlay';
import { STRATIDIAN_MODES, STRATIDIAN_MODE_NAMES } from './modes';
import { detectTerminalCaps, type TerminalCaps } from './terminalCaps';
import { renderInstallAnimation } from './installAnimation';
import {
  createBridgeStateFeed,
  type BridgeStateFeed,
  type BridgeStateSnapshot,
  type BridgeStateEvent,
} from './bridgeStateFeed';
import { rgbToAnsi, SUITE_COLORS, suiteColorForScp } from './colors';
import { log } from '../bridge/debugLog';
import { askSpawnedLanesToExit, signalSpawnedLaneGroups } from '../bridge/spawnedLaneTeardown.model';
import { appendTerminalOutput } from '../bridge/logCap';
import { buildScpBootOverlay, computeScpBootOverlayBox } from './bootOverlay';
import type { ScpOverlayEntry } from '../bridge/concepts/scpBootOverlay/scpBootOverlay.type';
import { ExpressTransportDeck } from '../bridge/concepts/scp/principles/scpExpressTransport.principle.huirth';
import { Deck } from 'stratimux';
import { SCPDeck } from '../bridge/concepts/scp/scp.concept';

const ANSI = {
  ENTER_ALT: '\x1b[?1049h',
  EXIT_ALT: '\x1b[?1049l',
  HIDE_CURSOR: '\x1b[?25l',
  SHOW_CURSOR: '\x1b[?25h',
  HOME: '\x1b[H',
  CLEAR_SCREEN: '\x1b[2J',
  RESET: '\x1b[0m',
  DIM: '\x1b[2m',
  BOLD: '\x1b[1m',
} as const;

const FRAME_INTERVAL_MS = 33;
// Diamond 3H Bug A Recurse: liveness tick removed entirely (orphan-detection,
// PID-probe sweep, and blank-session sweep all eliminated per architectural
// invariant — sessions transition to OFFLINE only via session-end-hook or via
// boot-reset on SCS-Bridge startup. Long-Running Assumption: no timer/probe
// signal drives OFFLINE writes.).

function computeBottomRows(termRows: number): number {
  const availableRows = Math.max(2, termRows - 1);
  const topRows = Math.max(4, Math.floor(availableRows / 2));
  return Math.max(4, availableRows - topRows);
}

// C720 B2 · THE STALE BADGE (the turnover-reach structural cure). The bridge is an
// Electron singleton: a clean SCP reinstall + `scs` relaunch RELAYS to the stale
// running process, so rebuilt dist/cli.cjs never reaches it (the bridge-stale-singleton
// hazard). This detector compares the running package's OWN dist/cli.cjs mtime against
// the bridge.json writtenAt stamp; a NEWER dist means the on-disk build outran the
// running process → the operator must restart the bridge. Returns a short marker for
// the header row, or '' when fresh / undetectable. NEVER throws (stat failure = no badge).
//
// Path resolution mirrors getBridgeVersion: realpathSync(process.argv[1]) resolves the
// symlinked `scs` bin to the actual dist/cli.cjs of the RUNNING package — module-relative,
// NOT process.cwd() (cwd is the user's project, not the installed bridge package).
function computeStaleBadge(): string {
  try {
    const rawCliPath = process.argv[1];
    if (!rawCliPath) return '';
    let cliPath: string;
    try {
      cliPath = realpathSync(rawCliPath);
    } catch {
      return '';
    }
    const distMtimeMs = statSync(cliPath).mtimeMs;
    const bridgeJsonPath = bridgeMetadataPathPerProject(process.cwd());
    if (!existsSync(bridgeJsonPath)) return '';
    const parsed = JSON.parse(readFileSync(bridgeJsonPath, 'utf8')) as { writtenAt?: number };
    const writtenAt = typeof parsed.writtenAt === 'number' ? parsed.writtenAt : 0;
    if (writtenAt <= 0) return '';
    return distMtimeMs > writtenAt ? '[STALE — restart bridge]' : '';
  } catch {
    return '';
  }
}

// Diamond B-8 Fix 3 (HWMTUC-SURFACE): static paths bridge will write during install.
// Rendered to user in trust-confer TUI before pipeline fires.
// This list is the user-visible contract — must match actual scaffold writes.
function buildProposedInstallPaths(cwd: string): string[] {
  return [
    `${cwd}/Cascades/  (directory + scaffold content)`,
    `${cwd}/.claude/CLAUDE.md`,
    `${cwd}/.claude/agents/  (agent registration files)`,
    `${cwd}/.claude/commands/  (command files)`,
  ];
}

const OPTIONAL_INSTALL_PATHS: string[] = [];

const MODE_DURATION_MS = 7000;
const MODE_DURATIONS_MS = [
  MODE_DURATION_MS,
  MODE_DURATION_MS,
  MODE_DURATION_MS,
  MODE_DURATION_MS,
  MODE_DURATION_MS,
  MODE_DURATION_MS,
];
const TOTAL_CYCLE_MS = MODE_DURATIONS_MS.reduce((a, b) => a + b, 0);

function getModeIndex(elapsed: number): number {
  const e = ((elapsed % TOTAL_CYCLE_MS) + TOTAL_CYCLE_MS) % TOTAL_CYCLE_MS;
  let acc = 0;
  for (let i = 0; i < MODE_DURATIONS_MS.length; i++) {
    acc += MODE_DURATIONS_MS[i];
    if (e < acc) return i;
  }
  return MODE_DURATIONS_MS.length - 1;
}

function formatEvent(evt: BridgeStateEvent): string {
  switch (evt.type) {
    case 'cycle-updated':
      return `cycle ${evt.cycle ?? '?'} · ${evt.activeDiamond ?? '—'}`;
    case 'registry-refresh':
      return `registry · ${evt.sessionCount} session(s)`;
    case 'session-launched':
      return `launched · ${evt.ulid.slice(0, 8)}`;
    case 'session-allocated':
      return `allocated · ${evt.ulid.slice(0, 8)}`;
    default:
      return '';
  }
}

function buildBootUpOverlay(
  map: OverlayMap,
  snap: BridgeStateSnapshot,
  modeName: string,
  cols: number,
  caps: TerminalCaps,
): void {
  const cobalt = rgbToAnsi(SUITE_COLORS.Cobalt, caps);
  const ochre = rgbToAnsi(SUITE_COLORS.Ochre, caps);
  const dim = ANSI.DIM;

  const title = 'SCS BRIDGE';
  const titleX = Math.max(0, Math.floor((cols - title.length) / 2));
  setOverlayText(map, titleX, 1, title, cobalt);

  const modeStr = `mode: ${modeName}`;
  const modeX = Math.max(0, Math.floor((cols - modeStr.length) / 2));
  setOverlayText(map, modeX, 2, modeStr, ochre);

  let row = 3;
  if (snap.currentCycle !== null || snap.activeDiamond !== null) {
    const cycleStr = `cycle ${snap.currentCycle ?? '?'} · ${snap.activeDiamond ?? '—'}`;
    const cx = Math.max(0, Math.floor((cols - cycleStr.length) / 2));
    setOverlayText(map, cx, row++, cycleStr, dim);
  }
  if (snap.sessionCount > 0) {
    const sessStr = `${snap.sessionCount} session(s) registered`;
    const sx = Math.max(0, Math.floor((cols - sessStr.length) / 2));
    setOverlayText(map, sx, row++, sessStr, dim);
  }
  if (snap.recentEvents.length > 0) {
    const evt = snap.recentEvents[snap.recentEvents.length - 1];
    const evtStr = formatEvent(evt);
    if (evtStr) {
      const ex = Math.max(0, Math.floor((cols - evtStr.length) / 2));
      setOverlayText(map, ex, row++, evtStr, dim);
    }
  }
}

// M75 PTBP · Pewter-Toolbar-Border-Pattern · single-row state-bearing divider
// between the animation panel and the menu panel. Replaces the prior plain
// '─'.repeat(cols) divider with a semantically enriched bar that surfaces
// menuState.activeScpFilter as a shared Diameter between the two panels.
// Suite color: Ochre (Suite 3 · Architect) — consistent with the install row
// sentinel and the boot-up overlay mode label. Truncation rule preserves the
// fixed-width contract: labels beyond 24 chars use `slice(0, 22) + '…'`.
function renderToolBar(
  activeScpFilter: string | undefined,
  cols: number,
  caps: TerminalCaps,
): string {
  const ochre = rgbToAnsi(SUITE_COLORS.Ochre, caps);
  const dim = ANSI.DIM;
  const reset = ANSI.RESET;
  const bold = ANSI.BOLD;

  const scpLabel = activeScpFilter
    ? `SCP: ${activeScpFilter.length > 24 ? activeScpFilter.slice(0, 22) + '…' : activeScpFilter}`
    : 'SCP: (none)';

  const labelRegion = ` ${scpLabel} `;
  const labelLen = labelRegion.length;

  const fillTotal = Math.max(0, cols - 2 - labelLen);
  const leftFill = Math.floor(fillTotal / 2);
  const rightFill = fillTotal - leftFill;

  const left = `${ochre}╠${reset}${dim}${'═'.repeat(leftFill)}${reset}`;
  const center = activeScpFilter
    ? `${bold}${ochre}${labelRegion}${reset}`
    : `${dim}${labelRegion}${reset}`;
  const right = `${dim}${'═'.repeat(rightFill)}${reset}${ochre}╣${reset}`;

  return left + center + right;
}

export type StartAnimatedTuiOptions = {
  exitOverride?: (code: number) => void;
};

export async function startAnimatedTui(opts: StartAnimatedTuiOptions = {}): Promise<void> {
  const exit = opts.exitOverride ?? ((code: number): void => process.exit(code));

  if (!process.stdout.isTTY) {
    process.stderr.write('scs: TTY required for animated TUI\n');
    exit(1);
    return;
  }

  // C797 · THE ONE-BRIDGE STOP-GAP (first release): a single SCS-Bridge per machine at a
  // time. The C796 shotgun proved the machine-global port rendezvous crosses concurrent
  // bridges' SCPs (the URL is the identity); until the deep fix ships (the deferred
  // Multi-Bridge Isolation blueprint), a second bridge in a DIFFERENT workspace
  // SELF-REPORTS and stands down. Same-workspace re-runs pass through (the C410 relay).
  const bridgeMutex = acquireGlobalBridgeMutex(process.cwd());
  if (!bridgeMutex.acquired) {
    // C1075 · SALVO M · THE SAME-KEY WARN. The lock is now per (directory, environment): a live holder in OUR key
    // means this exact bridge is already running here. A second UNNAMED daemon in one directory would clobber the
    // shared bridge.json top-level record (Lane R4 · bridgeMetadata.ts:511-525) and run a second watcher over the
    // same registry — so the honest answer is the WARNING the user asked for, then exit. A DIFFERENT directory
    // never reaches this branch any more: it has its own key, and its ports walk (the C797 refusal is retired).
    const holder = bridgeMutex.holder;
    const holderEnv = holder.env ?? '';
    process.stderr.write(
      '\n  scs: an SCS-Bridge is already active for this directory.\n\n' +
      '      running    ' + (holderEnv.length > 0 ? holderEnv : 'production (unnamed)') +
        '  ·  pid ' + holder.pid + '\n' +
      '      its dir    ' + holder.userCwd + '\n\n' +
      '  append --name <x> to run a second instance here (a name spaces its logs, socket and bridge record).\n' +
      '  A different directory needs no name — its ports walk.\n\n',
    );
    log('bridge.mutex.warn-same-dir', { holderPid: holder.pid, holderCwd: holder.userCwd, holderEnv, ownCwd: process.cwd() });
    exit(1);
    return;
  }
  log('bridge.mutex.acquired', { claimedStale: bridgeMutex.claimedStale });
  if (bridgeMutex.claimedStale) log('bridge.mutex.claim-stale', { ownCwd: process.cwd(), env: environmentName() });
  {
    // C1075 · COEXISTENCE IS THE DEFAULT. Other live bridges (other workspaces anor environments) are named, never
    // refused; their ports and ours walk (findFreeBridgePort · resolveActualScpPortPair).
    const siblings = listSiblingHolders(process.cwd());
    if (siblings.length > 0) {
      log('bridge.mutex.coexist', { ownCwd: process.cwd(), env: environmentName(), siblings: siblings.map((s) => ({ pid: s.pid, userCwd: s.userCwd, env: s.env ?? '' })) });
      process.stderr.write(`  scs: coexisting with ${siblings.length} other SCS-Bridge${siblings.length === 1 ? '' : 's'} on this machine · ports walk.\n`);
    }
  }

  const caps = detectTerminalCaps();

  // SB-P1 · PFMOW slot · open the SCS-Bridge Muxium synchronously AFTER
  // detectTerminalCaps and BEFORE the first await. Future SB-P2/P3 principles
  // require the Muxium to be live before any state-observing async callback
  // fires. SCMLW invariant preserved: this is a purely additive hook.
  // DSPM · Cycle 160 R5 Wave 2 · bootBridgeDaemon is the shared Demometer;
  // both production and dev:self paths Diameter to it (Suite 7 §Q3 topology).
  // C422 · THE SCOPE-PARITY PORT (the C421 fossil): scan for a free port from 7111 —
  // a single-workspace machine keeps 7111 (back-compat); a second workspace binds the
  // next free one. The ACTUAL port flows into the muxium options → the server concept →
  // the state → bridge.json (the discovery rail every consumer already reads).
  const bridgePort = await findFreeBridgePort(7111);
  setActiveBridgePort(bridgePort);
  log('bridge.port.scanned', { bridgePort, base: 7111 });
  // C947 · THE BOOT ASSERTION (the MS-1 C-6 precondition · never silent): name the
  // environment, the port, the sink root, and the WATCH MODE this daemon will run under.
  // The C946 root: a production install missing `fsevents.node` makes chokidar 3.6 fall
  // back to `usePolling` on macOS (100ms stat-poll per watched file) — the hot daemon. A
  // boot that says `polling` on darwin is the wound announcing itself, not a mystery.
  const bridgeEnvironment = environmentName();
  let watchMode: 'fsevents' | 'polling' | 'fs.watch' = 'fs.watch';
  if (process.platform === 'darwin') {
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      require('fsevents');
      watchMode = 'fsevents';
    } catch {
      watchMode = 'polling';
    }
  }
  log('bridge.boot', { env: bridgeEnvironment || 'production', bridgePort, bridgeRoot: bridgeRoot(), watchMode });
  process.stderr.write(
    `[scs] bridge.boot · env=${bridgeEnvironment || 'production'} · port=${bridgePort} · root=${bridgeRoot()} · watch=${watchMode}\n`,
  );
  bootBridgeDaemon({ userCwd: process.cwd(), port: bridgePort });

  // Diamond 3H Bug A Recurse · Boot-Reset-As-Clean-Slate: write ALL sessions
  // to OFFLINE before any TUI render or hook subprocess can read session state.
  // Sessions transition to LAUNCHED only via Manager-spawn + SessionStart hook
  // within this process lifecycle. Failure is non-fatal — the TUI must still
  // start; worst case is stale LAUNCHED entries (pre-fix behavior).
  // Citation: D3H-BUG-A-RECURSE-R7-FUCHSIA-CLINICAL.md §3
  // C950 · the same owner law as the SCP sweep below — a NAMED CLI never marks the shared
  // sessions.json offline (production's live sessions are not its to reset).
  if (!environmentName()) {
    try {
      await markAllSessionsOffline();
    } catch (err) {
      process.stderr.write(`[scs] boot-reset sessions offline failed: ${(err as Error).message}\n`);
    }
  }

  // C1104 · RULING m-A · THE ONE-TIME RECONCILE SWEEP. Runs once at boot, right after the
  // registry is grounded, guarded by its own bridge.json `modelReconcile` sentinel — a
  // second boot skips it in full. Clears the birth stamps that ruling A would otherwise
  // turn into permanent forced overrides of the user's own /model default, and writes the
  // one entry whose transcript proves a real mid-session change. Owner law: a NAMED CLI
  // never sweeps the shared registry (the markAllSessionsOffline discipline above).
  // Non-fatal: the TUI must still start.
  if (!environmentName()) {
    try {
      const rec = await reconcileSessionModels();
      if (!rec.alreadyRun) {
        process.stderr.write(
          `[scs] model reconcile · total=${rec.total} cleared=${rec.cleared} written=${rec.written} left=${rec.left}\n`,
        );
      }
    } catch (err) {
      process.stderr.write(`[scs] model reconcile failed: ${(err as Error).message}\n`);
    }
  }

  // D-SJP · GHOST-SESSION PRUNE · runs right after the boot-reset so it judges the
  // grounded (all-offline) registry. Entries whose CC transcript is missing (CC's own
  // cleanupPeriodDays retention deletes them) or empty are ROUTED THROUGH archiveSession
  // (recoverable · .entry.json ledger in Cascades/Archive) — never the Anchor, never a
  // launched entry. Non-fatal: the TUI must still start; worst case is ghosts surviving
  // one more boot (pre-fix behavior).
  try {
    const ghostPrune = await pruneGhostSessions();
    if (ghostPrune.pruned.length > 0) {
      process.stderr.write(`[scs] ghost-session prune · archived ${ghostPrune.pruned.length} · kept ${ghostPrune.kept}\n`);
    }
  } catch (err) {
    process.stderr.write(`[scs] ghost-session prune failed: ${(err as Error).message}\n`);
  }

  // PSSM · W4 · THE BOOT CONSISTENCY SWEEP (SCPs.json · markAllSessionsOffline mirror).
  // On COMPLETE daemon restart, force ALL persisted SCP statuses → 'pending' BEFORE the
  // scpMessageRouter status watcher arms (armed in bootBridgeDaemon's setTimeout(50) above;
  // this awaited chainWrite completes well inside that window). No SCP is 'live' until the
  // launch path (W3) re-writes it — the consistency point. Non-fatal (TUI must still start).
  // C950 · THE BOOT SWEEPS BELONG TO THE OWNER. Under the shared environment (one sessions.json ·
  // one SCPs.json · two perspectives) a NAMED CLI is a perspective, not the owner of shared state —
  // it must NOT flip production's live sessions/SCPs to offline/pending on its own boot. Production
  // (no name) sweeps exactly as before.
  if (environmentName()) {
    process.stderr.write(`[scs] boot sweeps SKIPPED · env=${environmentName()} · shared state belongs to the production perspective\n`);
    log('bridge.boot.sweeps-skipped', { env: environmentName() });
  } else {
    try {
      await markAllScpsPending();
    } catch (err) {
      process.stderr.write(`[scs] boot-reset SCPs pending failed: ${(err as Error).message}\n`);
    }
  }

  // REF-D2 · BJLM bridge.json write helper · fire-and-forget · debounced via
  // module-scoped latest state cache to avoid thrashing on rapid M17 ticks.
  // The `port` field reads LIVE from server.k.port via the active SCS-Bridge
  // Muxium handle (Cycle 139 CPPP · was scpDockHost.k.dockServerPort).
  // If the HTTP server has not yet bound (port === 0), the write is skipped —
  // the authoritative publisher in scsBridgeMuxium.ts will fire its own
  // writeBridgeMetadata once server.principle.ts commits the port.
  // Failure to write must never halt TUI.
  // D3C · TDZ-safe tracker · Cycle 162 R5 · Module-scope let initialized at module
  // load · ALL refreshBridgeMetadata callers read from this · no menuState access
  // anywhere in the function body. AFSW (renderFrame post-init) updates this when
  // menuState.activeScpFilter changes. Stratimux M17 closures fire pre-init and
  // pass through this tracker safely (null default).
  // Citation: D3C-TDZ-CRASH-DIAGNOSIS-R7-FUCHSIA-CLINICAL.md (revised · L586 also unsafe)
  let _activeScpTracker: string | null = null;
  // MD-4 P2 · the last-written bridge.json input hash (the content-hash skip gate).
  let _lastBridgeMetadataHash: string | null = null;

  // SWFB · W6 REFINEMENT · THE WINDOW-BOUND MTIME-MEMOIZED READ (bounded refresh trigger).
  // The true window-open signal (cli-handler setScpWindowId) lands `windowId` per SCP in
  // SCPs.json AFTER FSM 'live' — the "moments" gap between the loading bar's Launched and the
  // actual OS window. The M17 hash inputs (stateHash below) do NOT see SCPs.json, so a
  // windowId-only mutation would never break the skip-gate → never reach bridge.json → the helm
  // never sees the window presence. This reader closes that Diameter WITHOUT unbounded per-beat
  // fs reads: statSync(mtimeMs) per call is cheap; the full readFileSync + JSON.parse fires ONLY
  // when SCPs.json's mtime advances. Callers gate the invocation on the spawn-active window
  // (spawnsByScp.size > 0 || any scpLifecycle entry) so a long-settled bridge reads nothing.
  // AFPR mirror (bridgeMetadata.resolveScpInstallDirs): absent/malformed → last cache (or {}),
  // never a throw. Returns scpName → visible Electron windowId.
  // M2 · WINDOW-RENDERED (D-WR C628) · ONE READ, TWO MAPS. The mtime-memoized SCPs.json read now
  // pulls BOTH windowId (scpName → bound Electron windowId · the pre-existing window-PRESENCE signal)
  // AND windowRenderedAt (scpName → epoch-ms of first successful did-finish-load · the window-RENDERED
  // signal the M1 show-on-rendered moment stamps). Both derive from the SAME statSync-gated parse — no
  // extra fs work. The helm gates its ONE focus round on the RENDERED map (window painted) instead of
  // the ID map (window bound at construction, moments before paint).
  let _scpWindowIdCacheMtimeMs = -1;
  let _scpWindowIdCache: Record<string, number> = {};
  let _scpWindowRenderedCache: Record<string, number> = {};
  // C653 · THE STATUS PROJECTION (MEND B) · the SAME single mtime-memoized read also yields the
  // per-SCP PSSM status string (scpName → 'live' | 'pending' | 'installing'). The install-transient
  // ('installing') a fresh MULTIPLY worktree instance carries between its registration and its
  // node_modules landing lives ONLY in SCPs.json `status`; folding it into this one read (no extra
  // fs work) lets the bridge.json write carry it to the helm (scpStatuses) so the MULTIPLY staged
  // bar's INSTALL tick holds + the instance-row Spawn stays disabled until dependencies land.
  let _scpStatusCache: Record<string, string> = {};
  const readScpWindowIdsMemoized = (): {
    windows: Record<string, number>;
    rendered: Record<string, number>;
    statuses: Record<string, string>;
  } => {
    const scpsPath = scpsJsonPath();
    try {
      const mtimeMs = statSync(scpsPath).mtimeMs;
      if (mtimeMs === _scpWindowIdCacheMtimeMs) {
        return { windows: _scpWindowIdCache, rendered: _scpWindowRenderedCache, statuses: _scpStatusCache };
      }
      const raw = readFileSync(scpsPath, 'utf8');
      const parsed = JSON.parse(raw) as {
        scps?: Array<{ name?: unknown; windowId?: unknown; windowRenderedAt?: unknown; status?: unknown }>;
      };
      const nextWindows: Record<string, number> = {};
      const nextRendered: Record<string, number> = {};
      const nextStatuses: Record<string, string> = {};
      if (parsed && Array.isArray(parsed.scps)) {
        for (const entry of parsed.scps) {
          if (typeof entry?.name !== 'string' || entry.name.length === 0) continue;
          if (typeof entry?.windowId === 'number') {
            nextWindows[entry.name] = entry.windowId;
          }
          if (typeof entry?.windowRenderedAt === 'number') {
            nextRendered[entry.name] = entry.windowRenderedAt;
          }
          // C653 · the PSSM status string (opaque · degrades honestly for any future string).
          if (typeof entry?.status === 'string' && entry.status.length > 0) {
            nextStatuses[entry.name] = entry.status;
          }
        }
      }
      _scpWindowIdCacheMtimeMs = mtimeMs;
      _scpWindowIdCache = nextWindows;
      _scpWindowRenderedCache = nextRendered;
      _scpStatusCache = nextStatuses;
      return { windows: nextWindows, rendered: nextRendered, statuses: nextStatuses };
    } catch {
      // AFPR: absent/unreadable/malformed → the last good caches (empty on cold start).
      return { windows: _scpWindowIdCache, rendered: _scpWindowRenderedCache, statuses: _scpStatusCache };
    }
  };

  const refreshBridgeMetadata = (
    spawnsByScp: Map<string, { port: number; browserUrl: string }>,
    installedScps: string[],
    // W6a · THE LIFECYCLE PROJECTION (SCM W6 · Spawn Window Focus + Simulated Loading Bar). The
    // scpName → FSM-state-string map projected from nextLifecycle (lifecycleByScp) at the M17 call
    // site. Optional (cold-start passes none ⇒ {}) — the boot-time honest default. Assembled into
    // the BridgeMetadataState + folded into the content-hash so a booting→live transition reaches
    // disk (the helm reads booting-class states DIRECTLY off bridge.json.scpLifecycle).
    scpLifecycle?: Record<string, string>,
  ): void => {
    const handle = getActiveScsBridgeMuxiumHandle();
    const dockServerPort = handle?.muxium?.deck?.d?.server?.k?.port?.select() ?? 0;
    if (dockServerPort === 0) {
      // Port not yet bound · scsBridgeMuxium.publishBridgeMetadata owns the
      // first authoritative write once listen callback commits. Skipping
      // here prevents stale-port clobber (the SUITE-5-BLUE root cause).
      return;
    }
    // C621 · THE REGISTRY-AUTHORITATIVE INVENTORY (the PortableExpanse drop): lifecycle
    // FSM keys only name SCPs that ENTERED the FSM this boot — an installed-but-never-
    // spawned SCP fell off every refresh write (the BJLM caller passed lifecycle keys as
    // "full FSM inventory"). installedScps = union(the scpRegistryWatcher's live registry
    // inventory, the caller's list) — registry authoritative, union covers a just-spawned
    // SCP racing its registration. Muxified tier-2 DECK read (d.scp.d.scpRegistryWatcher).
    const registryEntries =
      handle?.muxium?.deck?.d?.scp?.d?.scpRegistryWatcher?.k?.installedScps?.select() as
        | Array<{ scpName?: string }>
        | undefined;
    const registryNames = (registryEntries ?? [])
      .map((entry) => (typeof entry?.scpName === 'string' ? entry.scpName : ''))
      .filter((name): name is string => name.length > 0);
    const unionInstalledScps = Array.from(new Set([...registryNames, ...installedScps]));
    // SWFB · W6 REFINEMENT · THE BOUNDED WINDOW-PRESENCE READ. The window-bound signal
    // (SCPs.json windowId per SCP) lands AFTER FSM 'live'. Read it ONLY while the spawn window
    // is active — any live spawn (spawnsByScp) OR any projected lifecycle entry (pending/idle/
    // booting/live). A long-settled bridge (no spawns, no lifecycle projection) reads nothing and
    // passes {} — no unbounded per-beat fs work. The read itself is mtime-memoized (statSync per
    // call · full parse only on SCPs.json mtime change).
    const lifecycleActive = Object.keys(scpLifecycle ?? {}).length > 0;
    // M2 · WINDOW-RENDERED (D-WR C628) · ONE bounded read yields BOTH the window-PRESENCE map
    // (scpWindows · bound windowId) and the window-RENDERED map (scpWindowsRendered · did-finish-load
    // epoch). A long-settled bridge (no spawns, no lifecycle projection) reads nothing (both {}).
    const windowMaps =
      spawnsByScp.size > 0 || lifecycleActive
        ? readScpWindowIdsMemoized()
        : {
            windows: {} as Record<string, number>,
            rendered: {} as Record<string, number>,
            statuses: {} as Record<string, string>,
          };
    const scpWindows = windowMaps.windows;
    const scpWindowsRendered = windowMaps.rendered;
    // C653 · THE STATUS PROJECTION (MEND B) · the per-SCP PSSM status map read (bounded · same
    // single mtime-memoized read as the window maps). Carries the 'installing' transient a fresh
    // MULTIPLY worktree instance holds until its npm install lands → the helm's INSTALL tick.
    const scpStatuses = windowMaps.statuses;
    // C656 · THE REGISTRY IS THE LIST (the retired-ghost residual): a typed-delete retires the
    // SCPs.json entry, but the C621 union's OTHER sources (the watcher inventory · the FSM keys)
    // can carry the ghost until relaunch. The memoized read is REGISTRY-TRUE (the same source
    // the TUI menu trusts) — when it is live (spawn-active), its names SUPERSEDE the union;
    // a settled bridge (read gated off) keeps the C621 union.
    const registryTruthNames = Object.keys(scpStatuses);
    const finalInstalledScps = registryTruthNames.length > 0 ? registryTruthNames : unionInstalledScps;
    const state: BridgeMetadataState = {
      bridgeVersion: getBridgeVersion(),
      port: dockServerPort,
      userCwd: process.cwd(),
      spawnsByScp,
      installedScps: finalInstalledScps,
      // D3C · TFTS · activeScp sourced from module-scoped tracker (TDZ-safe).
      activeScp: _activeScpTracker,
      // W6a · THE LIFECYCLE PROJECTION (SCM W6) · pass the caller's nextLifecycle projection through
      // to the bridge.json write (default {} — the cold-start + boot-time honest default). Folded
      // into the content-hash below so a state transition (booting→live) is not skip-gated.
      scpLifecycle: scpLifecycle ?? {},
      // SWFB · W6 REFINEMENT · THE WINDOW-PRESENCE PROJECTION · scpName → visible Electron windowId,
      // read (bounded) from SCPs.json. Sibling of scpLifecycle (NOT folded into boundScps — its many
      // positional readers stay untouched). The helm gates the ONE focus round on THIS field, not on
      // FSM 'live', so the /bridge-focus lands only once the window truly exists (closing the moments
      // gap the user observed). Folded into the content-hash below so the window-bound moment writes.
      scpWindows,
      // M2 · WINDOW-RENDERED (D-WR C628) · scpName → first did-finish-load epoch-ms (window PAINTED,
      // not merely BOUND). The refined focus gate: the helm holds the bar sweeping 'booting' through
      // the post-BOUND pre-RENDERED gap (windowId present but window still blank) and advances to
      // 'focusing' only once RENDERED lands — so /bridge-focus never targets a bound-but-blank window.
      // Sibling of scpWindows; folded into the content-hash so the rendered moment reaches disk.
      scpWindowsRendered,
      // C653 · THE STATUS PROJECTION (MEND B) · scpName → PSSM status string. Sibling of scpWindows;
      // folded into the content-hash below so an 'installing'→'pending' flip (the fresh MULTIPLY
      // instance's npm install completing) reaches disk → the helm's INSTALL tick clears + the
      // instance-row Spawn enables.
      scpStatuses,
    };
    // MD-4 P2 · content-hash skip: the M17 plan drives this at the native beat — unconditional
    // writes stormed bridge.json (the SCP chokidar→SMRP loop ran at write rate; halting
    // protection culled the SMRP plan · DELETED PLAN evidence). Hash the INPUTS (writtenAt is
    // stamped at write time and must not defeat the skip) — only real transitions reach disk.
    const stateHash = JSON.stringify([
      state.port,
      state.activeScp,
      state.installedScps,
      [...state.spawnsByScp.entries()],
      // W6a · THE LIFECYCLE PROJECTION (SCM W6) · a stable-ordered projection of the FSM map into the
      // skip-gate hash. A booting→live transition changes the entries → a NEW hash → the write is NOT
      // skip-culled → the transition reaches disk (the signal the helm's loading bar + focus-on-open
      // ride). Sorted so key-iteration order never spuriously invalidates the hash.
      Object.entries(state.scpLifecycle ?? {}).sort(([a], [b]) => a.localeCompare(b)),
      // SWFB · W6 REFINEMENT · THE WINDOW-PRESENCE HASH INPUT. The window-bound moment mutates ONLY
      // SCPs.json windowId (post-live) — invisible to every other hash input above. Folding the sorted
      // scpWindows entries here is what makes that moment produce a NEW hash → the write reaches disk →
      // the helm advances from the post-live loading gap to focus. Sorted for order-stability.
      Object.entries(state.scpWindows ?? {}).sort(([a], [b]) => a.localeCompare(b)),
      // M2 · WINDOW-RENDERED HASH INPUT (D-WR C628). The RENDERED moment mutates ONLY SCPs.json
      // windowRenderedAt (post-BOUND) — invisible to every hash input above (windowId already landed).
      // Folding the sorted scpWindowsRendered entries here makes the did-finish-load moment produce a
      // NEW hash → the write reaches disk → the helm advances from post-bound-blank to focus-on-render.
      Object.entries(state.scpWindowsRendered ?? {}).sort(([a], [b]) => a.localeCompare(b)),
      // C653 · THE STATUS PROJECTION HASH INPUT (MEND B). The 'installing'→'pending' flip mutates
      // ONLY SCPs.json `status` (the async npm install completing) — invisible to every hash input
      // above. Folding the sorted scpStatuses entries here makes that flip produce a NEW hash → the
      // write reaches disk → the helm advances from the INSTALL tick to a spawnable instance row.
      // Sorted for order-stability.
      Object.entries(state.scpStatuses ?? {}).sort(([a], [b]) => a.localeCompare(b)),
    ]);
    if (stateHash === _lastBridgeMetadataHash) return;
    _lastBridgeMetadataHash = stateHash;
    void writeBridgeMetadata(state, bridgeMetadataPathPerProject(process.cwd())).catch((err) => {
      const message = err instanceof Error ? err.message : String(err);
      process.stderr.write(`[scs-bridge] bridge.json write failed: 
`);
    });
  };

  // REF-D2 · cold-start parallel discovery path · authoritative SCPs.json read
  // populates initial installedScps so bridge.json reflects installed inventory
  // even before chokidar M17 closure has dispatched its first sentinel-driven
  // refresh (R3 M9 source-read finding).
  const initialScpRegistry = readScpRegistry();
  const initialInstalledScps = initialScpRegistry.scps.map((s) => s.name);
  refreshBridgeMetadata(new Map(), initialInstalledScps);

  // SB-Final · TUI_SESSION_ID · generated once per TUI invocation. Used as the
  // sender sessionId for BSBRE boot-request envelopes written via [L] launch
  // action. Per R4 SB-Final Bidirectional (C) Option (b): ulid() avoids the
  // sentinel-collision risk of a fixed 'tui' string when concurrent TUI
  // restarts share the same session queue directory.
  const TUI_SESSION_ID = ulid();
  log('tui.session.id', { tuiSessionId: TUI_SESSION_ID });

  // M-FSM-IDEMPOTENT-ENVELOPE (R4 Fix B · TUI-layer in-flight guard).
  // Defense-in-depth alongside the canonical FSM guard at
  // scpLifecycleIdleToSpawning.quality.ts:38 (which provides correctness
  // regardless of TUI behavior). This Set prevents redundant filesystem
  // envelope writes when a user double-presses [L] before M17 has propagated
  // the lifecycle transition out of 'pending'. Cleared by the M17 lifecycle
  // subscription closure when the FSM moves a scpName out of 'pending'.
  const pendingLaunchScps = new Set<string>();

  // SB-Final · Muxium plan() subscription for lifecycle badge state. The
  // subscription writes the latest snapshots into module-scoped refs which
  // renderFrame injects into MenuState.scpSubMenu on every paint tick. Per
  // R6 Sequence Step 11 + R4 Angle 4 (DECK K Constant Pattern · no principle
  // modification · external action-stream observation only).
  let latestLifecycleSnapshot: Map<string, ScpLifecycleStateValue> | null = null;
  let latestSessionCountSnapshot: Map<string, number> | null = null;
  let latestPortSnapshot: Map<string, number> | null = null;
  // SS-A1-D2 · PPHB Interactive 6th-state snapshot ref. Populated by the same
  // M17 plan() subscription closure (SECOND select() · same SBOTD-safe
  // iterateStage:false discipline · no new subscription opened). The render
  // layer applies filterRecentHeartbeats(now, 90_000) to derive the live
  // interactive count per SCP at paint time (R4 Strategy II · render-time filter).
  let latestInteractiveSnapshot: Map<string, Map<string, number>> | null = null;
  // SCP-3 · Defect A CSPMSR · module-scoped live ref refreshed inside the M17
  // closure. Derived from nextLifecycle.size > 0 (the lifecycleByScp inventory
  // of all registered SCPs, independent of spawn state). The render path reads
  // this value to flip the Install SCP row label between INSTALL_SCP_LABEL_FIRST
  // and INSTALL_SCP_LABEL_NEXT without requiring TUI restart. Belt-and-suspenders
  // for the install-completion menuState mutation at install-scp-wizard-submit.
  let latestAnyScpsInstalled: boolean | null = null;
  // MASF · MCP-Active-Scp-Filter ref · SAWSR-D2.A Rung 1 Cycle 152
  // Populated by M17 closure from d.scsBridge.k.activeScpFromMcp.select().
  // renderFrame mirrors to menuState.activeScpFilter via MTAM pattern · closes
  // the gap where MCP-driven Activate launched SCP but TUI did not surface PSM
  // Active Display (per Cycle 152 S7 Fuchsia Tier 0 · Installation Agent diagnosis).
  let latestActiveScpFromMcp: string | undefined = undefined;
  // C948 · the activation nonce + the last nonce MTAM consumed (edge trigger).
  let latestActiveScpFromMcpAt = 0;
  let _mtamConsumedActivationAt = 0;
  // Cycle 142 LAAD Fix A · SSAR restoration. Tracks the prior synced value so the
  // M17 closure dispatches the 'scp-installed-state-sync' action ONLY when the
  // value changes (prevents action storm on every lifecycle tick). null sentinel
  // means "never synced" — first M17 fire post-initialization always dispatches.
  const priorSyncedAnyScpsInstalled: boolean | null = null;
  // ICSM1-D1 · Iced Skill Trilogy Macro 1 · 5th derivation refs. Populated by the
  // same M17 plan() subscription closure (FOURTH+FIFTH select() · same SBOTD-safe
  // iterateStage:false discipline · no new subscription opened). The bridge.json
  // live-update path (Macro 2 ICSM1-D2 scope) and external clients consume these
  // refs. Macro 1 establishes the DECK K observables; Macro 2 wires bridge.json.
  // Stratimuxian Scholar S8 Muxified Concept Access + S9 DECK K State Access.
  let latestDockServerPort = 0;
  let latestConnectedScpsSnapshot: Record<
    string,
    {
      scpName: string;
      dockedAt: number;
      scpPort: number;
      logEndpoint: string;
      status: string;
    }
  > = {};
  let priorDockServerPort = 0;
  let priorConnectedScpsCount = 0;
  const bootingStartedAtByScp = new Map<string, number>();
  // SS-A1-D2 · ADSC (Affinity-Declare-SLAC-Chain) substrate. When the M17
  // closure observes an SCP transitioning into 'live' AND the spawn entry's
  // sessionId matches TUI_SESSION_ID (i.e. THIS TUI originated the boot), we
  // emit the first 'presence-ping' envelope immediately and arm a 30s interval
  // for ongoing heartbeats. Cleared in cleanExit (SBOTD-safe · zombie-interval
  // anti-pattern guarded · M5 discipline).
  const PRESENCE_PING_INTERVAL_MS = 30_000;
  const presencePingIntervalsByScp = new Map<string, NodeJS.Timeout>();
  const firstPresencePingSentByScp = new Set<string>();

  /**
   * SS-A1-D2 · ADSC fire-and-forget heartbeat write. Constructs a
   * 'presence-ping' envelope and enqueues to THIS TUI's heads/ queue. The
   * bridge's scpMessageRouter chokidar consumes from the same dir within one
   * polling interval; bridge dispatches scpSpawnManagerSetInteractiveSession
   * with receivedAt = Date.now() at QPCRC processing time (clock-skew safe).
   */
  const sendPresencePing = (scpName: string): void => {
    void (async () => {
      try {
        const env = createEnvelope({
          sessionId: TUI_SESSION_ID,
          priority: 'head',
          content: JSON.stringify({
            sessionId: TUI_SESSION_ID,
            scpName,
            sentAt: Date.now(),
          }),
          sender: 'router',
        });
        env.kind = 'presence-ping';
        env.kindPayload = {
          sessionId: TUI_SESSION_ID,
          scpName,
          sentAt: Date.now(),
        };
        await enqueueMessage(env);
        log('tui.pphb.sent', { scpName, envId: env.id });
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        log('tui.pphb.error', { scpName, message });
      }
    })();
  };
  let lifecycleSubscriptionInstalled = false;
  try {
    const bridgeHandle = getActiveScsBridgeMuxiumHandle();
    if (bridgeHandle !== null) {
      const muxium = bridgeHandle.muxium;
      const deckForPlan = muxium.deck as unknown as ExpressTransportDeck; // Plan signature varies across stratimux versions; cast bridges the
      // inference gap. The stage closure is read-only — it never dispatches —
      // so action-overflow is structurally impossible (R6 risk surface).
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const planAny = (muxium as any).plan as (
        name: string,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        builder: (helpers: { stage: any; conclude: any }) => unknown[],
      ) => unknown;
      planAny(
        'SB-Final · TUI lifecycle badge subscription',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ({ stage, conclude }: { stage: any; conclude: any }) => [
          stage(
            (args: { d: typeof deckForPlan }) => {
              const { d } = args;
              console.log('Check Contents', d);
              const nextLifecycle = new Map(d.scp.d.scpLifecycle.k.lifecycleByScp.select());
              const spawns = d.scp.d.scpSpawnManager.k.spawnsByScp.select();
              const nextSessionCount = new Map<string, number>();
              const nextPort = new Map<string, number>();
              for (const [scpName, entry] of spawns) {
                nextSessionCount.set(
                  scpName,
                  nextSessionCount.has(scpName) ? (nextSessionCount.get(scpName) ?? 0) + 1 : 1,
                );
                nextPort.set(scpName, entry.port);
              }
              for (const [scpName, fsmState] of nextLifecycle) {
                if (fsmState === 'booting' && !bootingStartedAtByScp.has(scpName)) {
                  bootingStartedAtByScp.set(scpName, Date.now());
                } else if (fsmState !== 'booting' && bootingStartedAtByScp.has(scpName)) {
                  bootingStartedAtByScp.delete(scpName);
                }
              }
              // SS-A1-D2 · SECOND select() in the same closure for the PPHB
              // interactiveSessionsByScp Map. Captures the latest receivedAt
              // timestamps so the render layer can apply filterRecentHeartbeats.
              const interactive = d.scp.d.scpSpawnManager.k.interactiveSessionsByScp.select();
              // Cycle 139 CPPP · server.k.port replaces scpDockHost.k.dockServerPort.
              // scsBridge.k.connectedScps replaces scpDockHost.k.connectedScps.
              // Tier-1 sibling access path (no `d.scp.d.<sibling>` indirection).
              const dockPort = d.server.k.port.select();
              const dockedScps = d.scsBridge.k.connectedScps.select();
              // MASF select · MCP-Active-Scp-Filter from scsBridge state · MTAM source
              const nextActiveScpFromMcp = d.scsBridge.k.activeScpFromMcp.select();
              const nextActiveScpFromMcpAt = d.scsBridge.k.activeScpFromMcpAt.select();
              latestLifecycleSnapshot = nextLifecycle;
              latestSessionCountSnapshot = nextSessionCount;
              latestPortSnapshot = nextPort;
              latestInteractiveSnapshot = interactive;
              latestDockServerPort = dockPort;
              latestConnectedScpsSnapshot = dockedScps;
              latestActiveScpFromMcp = nextActiveScpFromMcp;
              latestActiveScpFromMcpAt = nextActiveScpFromMcpAt;
              // R4 Fix B · pendingLaunchScps clear-site. When the FSM has
              // transitioned a scpName out of 'pending' (i.e. now 'booting',
              // 'idle', or 'live'), the in-flight guard releases so future
              // [L] presses can re-launch (e.g., after a tear-down or for a
              // distinct re-spawn). The set membership is small (≤ active
              // launches in-flight); iteration cost is negligible relative
              // to the M17 closure's existing work.
              if (pendingLaunchScps.size > 0) {
                for (const scpName of Array.from(pendingLaunchScps)) {
                  const fsmState = nextLifecycle.get(scpName);
                  if (fsmState !== 'pending') {
                    pendingLaunchScps.delete(scpName);
                  }
                }
              }
              // ICSM1-D1 · Log dock state transitions for HALT-GATE observability.
              // Fires only on actual change (port assignment or dock count delta)
              // so the log stream is not flooded with no-op closures.
              const currentDockedCount = Object.keys(latestConnectedScpsSnapshot).length;
              if (
                latestDockServerPort !== priorDockServerPort ||
                currentDockedCount !== priorConnectedScpsCount
              ) {
                log('tui.dockhost.snapshot', {
                  dockServerPort: latestDockServerPort,
                  connectedScpsCount: currentDockedCount,
                });
                priorDockServerPort = latestDockServerPort;
                priorConnectedScpsCount = currentDockedCount;
              }

              // SCP-3 · Defect A CSPMSR M17 reinforcement · derived from the
              // already-computed nextLifecycle Map (zero new selectors · I/O-free
              // · same SBOTD-safe iterateStage:false closure). When any SCP is
              // registered in the lifecycle FSM, anyScpsInstalled flips true and
              // the render layer surfaces INSTALL_SCP_LABEL_NEXT (⊕ Open SCP Menu).
              latestAnyScpsInstalled = nextLifecycle.size > 0;
              // REF-M1-D1.1 · M52 Visibility Event 8 · tui.menu.derive
              // Stratimuxian Scholar: S9 DECK K (DECK K reactive derivation observable · latestAnyScpsInstalled is render-critical).
              // Shows when + why the menu's anyScpsInstalled flips · source:'m17' distinguishes from startup-read.
              log('tui.menu.derive', {
                latestAnyScpsInstalled,
                lifecycleSize: nextLifecycle.size,
                source: 'm17',
              });
              // Cycle 142 LAAD Fix A · Option 3 (TDZ-safe action dispatch).
              // SSAR (Single-Source-of-Authority): the M17 closure cannot mutate
              // menuState directly because menuState is `let`-declared AFTER the
              // planAny() registration; the first synchronous fire arrives before
              // initialization → TDZ ReferenceError. Action-dispatch routes the
              // sync THROUGH the existing handler chain (switch in animatedTui)
              // which executes ONLY after menuState init. setImmediate defers to
              // the next event-loop tick — guaranteed past TDZ window AND past
              // the synchronous first-fire-on-subscribe boundary.
              //
              // Action-storm guard: dispatch ONLY on transition. priorSyncedAnyScpsInstalled
              // tracks the last successfully-synced value (independent from the
              // module-scoped latestAnyScpsInstalled ref). Identity comparison
              // (false→false, true→true) suppresses redundant dispatches on
              // every lifecycle tick.
              // Cycle 142 LAAD Hotfix · setImmediate dispatch REMOVED.
              // The prior approach (Option 1 wrapped in setImmediate with typeof
              // TDZ guard) failed at runtime because: (a) `typeof menuState`
              // does NOT bypass `let`/`const` TDZ — it throws ReferenceError;
              // (b) the surrounding startAnimatedTui has multiple awaits between
              // planAny registration and the let menuState declaration, so the
              // setImmediate callback fires before the binding initializes.
              // Replaced by renderFrame-based sync (see renderFrame body above).
              // M17 closure now just updates latestAnyScpsInstalled (already
              // done at the SECOND select() above); renderFrame propagates to
              // menuState.anyScpsInstalled on every tick when values diverge.
              // Action-storm guard not needed at the M17 site — the
              // renderFrame conditional `!==` already gates the mutation.
              // SCP-3 · TDZ fix: do NOT reference menuState inside this stage
              // closure. menuState is declared via `let` at line ~580, after
              // the planAny() call that registers this closure. Stratimux fires
              // the stage synchronously on subscribe → TDZ ReferenceError.
              // renderFrame injects latestAnyScpsInstalled at paint time via
              // the menuView spread (same snapshot-injection pattern as
              // scpSubMenu / latestLifecycleSnapshot). No functional regression:
              // renderFrame always runs after menuState is initialized.

              // REF-D2 · BJLM closure-side refresh · derives boundScps from
              // current spawnsByScp (port+browserUrl per ScpSpawnEntry) and
              // installedScps from lifecycleByScp keys (full FSM inventory).
              // Read-only projection · no new state slot · same closure as
              // PPHB/SPMEM (M17 SECOND select() extended with derivation).
              const refreshSpawns = new Map<string, { port: number; browserUrl: string }>();
              for (const [scpName, entry] of spawns) {
                refreshSpawns.set(scpName, {
                  port: entry.port,
                  browserUrl: entry.browserUrl,
                });
              }
              // W6a · THE LIFECYCLE PROJECTION (SCM W6) · project nextLifecycle (the same FSM Map the
              // TUI badges ride · state strings pending/idle/booting/live) into a plain Record for the
              // bridge.json write. THE SIGNAL SOURCE — the helm reads booting-class states (pre-live)
              // off this to drive the simulated loading bar + fire focus-on-open when a spawn lands live.
              const lifecycleProjection: Record<string, string> = {};
              for (const [scpName, fsmState] of nextLifecycle) {
                lifecycleProjection[scpName] = fsmState;
              }
              refreshBridgeMetadata(
                refreshSpawns,
                Array.from(nextLifecycle.keys()),
                lifecycleProjection,
              );

              // SS-A1-D2 · ADSC (Affinity-Declare-SLAC-Chain) detection. For
              // any spawn entry owned by THIS TUI whose FSM state is 'live',
              // emit the first 'presence-ping' once + arm a 30s interval.
              // Idempotent via firstPresencePingSentByScp Set guard.
              //
              // SS-Final · SPMEM write: co-incident with PPHB timer setup, the
              // same first-Live detection moment writes preferredScpName to the
              // TUI session's meta.json. The firstPresencePingSentByScp guard
              // doubles as SPMEM write gate — one branch, two writes, each
              // fires exactly once per scpName per TUI session.
              for (const [scpName, entry] of spawns) {
                if (entry.sessionId !== TUI_SESSION_ID) continue;
                if (nextLifecycle.get(scpName) !== 'live') continue;
                if (firstPresencePingSentByScp.has(scpName)) continue;
                firstPresencePingSentByScp.add(scpName);
                // SS-Final · SPMEM write fire-and-forget. Same async discipline
                // as sendPresencePing (errors logged to stderr, non-fatal).
                // setSessionPreferredScp is graceful on missing meta.json
                // (TUI sessions are ephemeral and may lack a scaffold).
                void setSessionPreferredScp(TUI_SESSION_ID, scpName).catch((err) => {
                  const message = err instanceof Error ? err.message : String(err);
                  log('tui.spmem.write.failed', { scpName, message });
                });
                sendPresencePing(scpName);
                const handle = setInterval(() => {
                  sendPresencePing(scpName);
                }, PRESENCE_PING_INTERVAL_MS);
                handle.unref();
                presencePingIntervalsByScp.set(scpName, handle);
              }
            },
            { iterateStage: false },
          ),
          conclude(),
        ],
      );
      lifecycleSubscriptionInstalled = true;
      log('tui.lifecycle.subscription', { installed: true });
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    log('tui.lifecycle.subscription.error', { message });
  }

  // D-LHT Fix A · CAPTURE the real terminal writers BEFORE taking the alt-screen, then REDIRECT
  // every stray console/stdout/stderr write (from in-process bridge code that runs alongside the
  // TUI · 454 such writers) into the terminal-output log — so a stray write can never corrupt the
  // TUI alt-screen. The TUI's OWN frame paints use `screenWrite` (the captured original) and bypass
  // the redirect. Restored on exit (restoreTerminalIO) so post-TUI errors surface normally.
  const rawStdoutWrite = process.stdout.write.bind(process.stdout);
  const rawStderrWrite = process.stderr.write.bind(process.stderr);
  // The TUI's own frame paints go through screenWrite (the captured original stdout) so they reach
  // the screen even while process.stdout.write is redirected to the log below.
  const screenWrite = (s: string): void => {
    (rawStdoutWrite as (chunk: string) => boolean)(s);
  };
  const origConsoleLog = console.log;
  const origConsoleError = console.error;
  const origConsoleWarn = console.warn;
  const restoreTerminalIO = (): void => {
    process.stdout.write = rawStdoutWrite as typeof process.stdout.write;
    process.stderr.write = rawStderrWrite as typeof process.stderr.write;
    console.log = origConsoleLog;
    console.error = origConsoleError;
    console.warn = origConsoleWarn;
  };
  const pipeStream = (stream: string) =>
    (chunk: unknown, ...rest: unknown[]): boolean => {
      try {
        appendTerminalOutput(stream, typeof chunk === 'string' ? chunk : String(chunk));
      } catch {
        /* the redirect must never throw into a writer */
      }
      // honor an optional callback arg (write(chunk, cb)) so callers don't hang
      const cb = rest.find((a) => typeof a === 'function') as (() => void) | undefined;
      if (cb) cb();
      return true;
    };
  process.stdout.write = pipeStream('stdout') as typeof process.stdout.write;
  process.stderr.write = pipeStream('stderr') as typeof process.stderr.write;
  console.log = (...a: unknown[]): void => {
    try { appendTerminalOutput('console.log', a.map((x) => String(x)).join(' ')); } catch { /* ignore */ }
  };
  console.error = (...a: unknown[]): void => {
    try { appendTerminalOutput('console.error', a.map((x) => String(x)).join(' ')); } catch { /* ignore */ }
  };
  console.warn = (...a: unknown[]): void => {
    try { appendTerminalOutput('console.warn', a.map((x) => String(x)).join(' ')); } catch { /* ignore */ }
  };

  screenWrite(ANSI.ENTER_ALT + ANSI.HIDE_CURSOR);

  let sessions = await listSessions();

  // Diamond 3H Bug A Recurse: prior Startup Validation Pass removed. Blank
  // sessions (claudeSessionId set but JSONL absent) remain in the registry as
  // OFFLINE entries after boot-reset above — no orphan cleanup per architectural
  // invariant. Manual deletion or natural overwrite on next spawn handles them.

  // Diamond M Fix M-3: Auto-Discovery Pass.
  // Surface real persisted sessions present on disk but absent from registry.json
  // (e.g. registry wiped by upgrade/restart). Pattern 4 Modulation preserved —
  // metadata-only readdir + stat; no JSONL content read.
  {
    const cwd = process.cwd();
    const discovered = discoverPersistedSessions(cwd);
    const knownIds = new Set(sessions.map((s) => s.claudeSessionId).filter(Boolean) as string[]);
    let discoveredCount = 0;
    for (const d of discovered) {
      if (knownIds.has(d.claudeSessionId)) continue;
      log('discovery.scan', {
        cwd,
        claudeSessionId: d.claudeSessionId,
        sizeBytes: d.sizeBytes,
      });
      // Diamond P Fix P-2b: scaffold BEFORE addSession.
      // Race-prevention ordering — by the time the entry appears in the
      // registry (and thus the menu), its full session-dir capsule
      // (meta.json + spawn-settings.json + 4 subdirs) already exists on
      // disk. Pressing Enter on a discovered row no longer hits ENOENT in
      // launchInformative.loadSessionMeta (Green HIGH Issue 3).
      const synthesizedUlid = synthesizeDiscoveredUlid(d.mtimeMs, d.claudeSessionId);
      await scaffoldDiscoveredSession(synthesizedUlid, cwd, d.claudeSessionId, d.mtimeMs);
      await addSession({
        id: synthesizedUlid,
        spawnedAt: d.mtimeMs,
        status: 'offline',
        cwd,
        claudeSessionId: d.claudeSessionId,
        synthesizedAt: d.mtimeMs,
      });
      discoveredCount++;
    }
    if (discoveredCount > 0) {
      sessions = await listSessions();
    }
  }

  // Diamond B-9 Fix 1 (CD-23 refinement · SCS-Scaffold-Marker-Probe-Target):
  // probe SCS scaffold marker (8_SUITES/), not bridge-state location (Cascades/).
  // Why: ensureBridgeRoot() in loadRegistry() (called above at L187) mkdirs
  // <cwd>/Cascades/Bridge/ as a side effect of session enumeration. The probe
  // target Cascades/ would always return true on bridge invocation regardless of
  // whether SCS is actually installed. 8_SUITES/ is created ONLY by Strategy/S4
  // scaffold copy (from cloned repo's Cascades/8_SUITES/) — bridge never writes
  // this path. Pattern 4 metadata-only (existsSync; no content read).
  const cascadesPresent = existsSync(process.cwd() + '/Cascades/8_SUITES');
  log('cascades.probe', { cwd: process.cwd(), present: cascadesPresent });

  // Diamond C-era auto-spawn — gated on cascadesPresent (B-8 Fix 1 gate).
  // Install-mode (cascadesPresent === false): NO auto-spawn; menu shows Install + New Session.
  if (cascadesPresent && sessions.length === 0) {
    try {
      const { sessionId } = await createSession();
      // D2 Electron transition: launchInformative replaced by
      // spawnElectronSessionForUlid (CSSP `open-session` verb to Electron main).
      spawnElectronSessionForUlid(sessionId);
      sessions = await listSessions();
    } catch {
      // continue with empty registry
    }
  }
  const mostRecent =
    sessions.length > 0 ? [...sessions].sort((a, b) => b.spawnedAt - a.spawnedAt)[0] : null;

  // Template Citizenship (BO-2-C): seed the template as a standard registry
  // citizen before any startup reads. Idempotent — no-op if already seeded
  // or if Cascades/scps/template/SCP is absent (npm-global user project).
  upsertTemplateCitizen(process.cwd());

  // Diamond α RM-Fix-2: read SCPs.json at startup · drives Install SCP row label
  // discrimination ("Install SCP" first time · "Install Another SCP" thereafter)
  // and (β) sub-menu surfacing. Defensive empty on missing file (PFP-DEFENSIVE-EMPTY).
  const scpRegistry = readScpRegistry();
  const anyScpsInstalled = scpRegistry.scps.length > 0;
  // Template Citizenship (BO-2-C): AFFINITY-DECLARED-BOOT-PRIORITY-SELECTION.
  // The autoLaunch field on a registry entry is the EXPLICIT replacement for the
  // former implicit "first-member-is-template" cursor default. When an entry
  // carries autoLaunch:true AND the session list is empty, the TUI immediately
  // calls launchScpRuntime for that SCP — no user keypress required on first boot.
  const autoLaunchEntry = scpRegistry.scps.find((s) => s.autoLaunch === true);
  // REF-M1-D1.1 · M52 Visibility Event 7 · tui.scpRegistry.startup
  // Stratimuxian Scholar: S9 DECK K (state initialization must be observable at boot).
  // Confirms what SCPs.json contained at bridge start · closes runtime-diagnosis gap
  // where startup-read result went silently into menuState.anyScpsInstalled.
  log('tui.scpRegistry.startup', {
    path: scpsJsonPath(),
    count: scpRegistry.scps.length,
    anyScpsInstalled,
    scpNames: scpRegistry.scps.map((s) => s.name),
    autoLaunchName: autoLaunchEntry?.name ?? null,
  });

  // SCPGATE WSRM + FBSN: derive the SCS-install-resolved gate + first-run note flag
  // from Cascade.json. Legacy/absent/unparseable → treat as complete + note-eligible
  // (fail-open · never penalize existing installs · never skip first-run consent).
  let installationComplete = true;
  let scpInstallAgentNoteShown = false;
  if (cascadesPresent) {
    const cascadeJsonPath = path.join(process.cwd(), 'Cascades', 'Cascade.json');
    if (existsSync(cascadeJsonPath)) {
      try {
        const parsed = JSON.parse(readFileSync(cascadeJsonPath, 'utf8')) as Record<string, unknown>;
        const status: InstallationStatus = resolveInstallationStatus(parsed.installationStatus);
        installationComplete = isInstallationComplete(status) || isInstallationLegacy(status);
        scpInstallAgentNoteShown = parsed.scpInstallAgentNoteShown === true;
      } catch {
        // fail-open: installationComplete stays true · note stays eligible
      }
    }
  }
  log('tui.scpgate.seed', { cascadesPresent, installationComplete, scpInstallAgentNoteShown });

  // Diamond γ: cursor default flip · when .claude/CLAUDE.md exists (Claude Code
  // project marker) AND no Cascades/ yet, default cursor to SYNTHETIC_INSTALL_SCP
  // instead of SYNTHETIC_INSTALL. Prevents Enter from spawning the SCS-Bridge
  // installer agent on fresh-slate Claude Code projects · directs user to the
  // TUI Install SCP wizard which is the canonical path going forward.
  const claudeMdPath = path.join(process.cwd(), '.claude', 'CLAUDE.md');
  const claudeProjectDetected = existsSync(claudeMdPath);
  const defaultSelected = (() => {
    if (cascadesPresent) {
      return mostRecent?.id ?? SYNTHETIC_NEW;
    }
    // SCPGATE WSRM: pre-SCS, the Install-SCP row is withheld (PSRS) — default the
    // cursor to the SCS-Bridge install row (substrate-first), not the hidden SCP row.
    // claudeProjectDetected branch kept for documentary clarity; both return INSTALL.
    void claudeProjectDetected;
    return SYNTHETIC_INSTALL;
  })();

  let menuState: MenuState = {
    sessions,
    selectedUlid: defaultSelected,
    termWidth: process.stdout.columns ?? 100,
    termHeight: computeBottomRows(process.stdout.rows ?? 30),
    lastRenderedAt: Date.now(),
    spawnInFlight: false,
    cascadesPresent,
    anyScpsInstalled,
    installationComplete,
    scpInstallAgentNoteShown,
  };

  // Template Citizenship (BO-2-C): boot-affinity trigger.
  // When an autoLaunch entry exists AND no sessions are active,
  // launch it immediately — the TUI renders once first so the user
  // sees the boot state before the spawn fires. Deferred one tick via
  // setTimeout(0) so renderFrame paints before spawn dispatches AND so
  // launchScpRuntime (declared later in this closure) is initialized by
  // the time the callback runs.
  if (autoLaunchEntry && sessions.length === 0 && cascadesPresent) {
    setTimeout(() => {
      launchScpRuntime(autoLaunchEntry.name);
    }, 0);
  }

  const feed: BridgeStateFeed = createBridgeStateFeed();
  const startTime = Date.now();
  let frameRunning = false;
  let frameInterval: NodeJS.Timeout | null = null;
  let exited = false;

  // Diamond B-22 (CD-74 TCPFR + CD-75 MRFD · Modal-Render-Frame-Decoupling):
  // memoize the trust-confer pane output by state-hash. The pane is fully static
  // (no animation), so re-rendering 30 times per second was wasteful AND the root
  // cause of cursor mobility loss (per-frame ANSI.HOME stomp). Skipping the write
  // when state is unchanged eliminates the flicker AND lets the user's cursor
  // selection state remain stable across frames.
  // Diamond B-26-PEWTER (CD-124 PUCM · uninstall confirmation modal hash-memo).
  // Mirrors trustConfer hash-memo flicker prevention pattern (CD-74 TCPFR).
  let lastUninstallConfirmHash = '';
  const uninstallConfirmStateHash = (state: MenuState): string => {
    const uc = state.uninstallConfirm;
    if (uc === undefined) return '';
    return `uc:${uc.selected}:${state.termWidth}x${state.termHeight}`;
  };

  // D-GTC S6 · exit-confirm modal hash-memo (mirrors the uninstall-confirm hash-memo · repaint
  // on state-change only so the ▶ tracks the arrow-toggle without 30fps flicker).
  let lastExitConfirmHash = '';
  const exitConfirmStateHash = (state: MenuState): string => {
    const ec = state.exitConfirm;
    if (ec === undefined) return '';
    return `ec:${ec.selected}:${state.termWidth}x${state.termHeight}`;
  };

  let lastTrustConferHash = '';
  const trustConferStateHash = (state: MenuState): string => {
    const tc = state.trustConfer;
    if (tc === undefined) return '';
    return [
      tc.selected,
      tc.paths.length,
      tc.optionalPaths.length,
      state.cascadesPresent ?? 'undef',
      state.termWidth,
      state.termHeight,
    ].join('|');
  };

  const renderFrame = (): void => {
    if (frameRunning || exited) return;
    frameRunning = true;
    try {
      // Cycle 142 LAAD Fix · TDZ-safe state-slot sync via renderFrame.
      // SSAR (Single-Source-of-Authority): latestAnyScpsInstalled is the live ref
      // updated by the M17 closure. renderFrame runs ONLY after menuState init
      // (frameInterval is set far below the let menuState declaration). Sync
      // here propagates the live ref into the state slot so action handlers
      // (applyKeypress) read the same value the label render path sees.
      // Replaces the prior Cycle 142 setImmediate-based dispatch (TDZ-unsafe:
      // multiple awaits between planAny registration and let menuState init
      // caused the deferred callback to race the binding). Renderframe is the
      // canonical post-init synchronization point — no TDZ window can exist.
      if (
        latestAnyScpsInstalled !== null &&
        menuState.anyScpsInstalled !== latestAnyScpsInstalled
      ) {
        menuState = { ...menuState, anyScpsInstalled: latestAnyScpsInstalled };
        log('tui.menu.scp-installed-state-sync', {
          anyScpsInstalled: latestAnyScpsInstalled,
          source: 'renderFrame.tdz-safe',
        });
      }
      // MTAM · MCP-Tui-Activate-Mirror · Cycle 152 SAWSR-D2.A Rung 1
      // When BMTI Activate Quality (scsBridgeActivateScpSession) writes
      // scsBridge.activeScpFromMcp, mirror to menuState.activeScpFilter so
      // PSM surfaces Active Display for the MCP-activated SCP · matching
      // keypress-driven activate path semantic (Cycle 148 ALHOC M130).
      // Renderframe is the canonical post-init sync site (LAAD Cycle 142 pattern).
      // C948 · EDGE, NOT LEVEL. The level form (`filter !== activeScpFromMcp`) fought D-WC-3
      // below: an activated SCP whose surface is 'pending' (its window closed — or, in a
      // named environment, an SCP merely MIRRORED from production and never launched here)
      // was re-pinned by MTAM every frame and cleared by D-WC-3 every frame — ~28 flips/s,
      // each flip a bridge.json rewrite (the Dev bench caught it: 5,041 sync/cleared pairs
      // in three minutes). MTAM now fires ONCE per activation nonce.
      if (
        latestActiveScpFromMcp !== undefined &&
        latestActiveScpFromMcpAt !== _mtamConsumedActivationAt
      ) {
        _mtamConsumedActivationAt = latestActiveScpFromMcpAt;
        menuState = { ...menuState, activeScpFilter: latestActiveScpFromMcp };
        // D3C · AFSW · Update module-scoped tracker so next refreshBridgeMetadata
        // call picks up the new activeScp (TDZ-safe · tracker is module-scope let).
        _activeScpTracker = latestActiveScpFromMcp;
        log('tui.menu.active-scp-filter-sync', {
          activeScpFilter: latestActiveScpFromMcp,
          source: 'renderFrame.mtam',
        });
        // D3C · AFSW · trigger bridge.json refresh so SessionStart hook's CIBJ
        // leg can read the freshly-focused SCP immediately (not wait for next
        // periodic refresh). renderFrame is post-init · menuState safe to access
        // here · but we use the tracker pattern for consistency.
        try {
          const handle = getActiveScsBridgeMuxiumHandle();
          const spawns = handle?.muxium?.deck?.d?.scp?.d?.scpSpawnManager?.k?.spawnsByScp?.select() ?? new Map();
          const refreshSpawns = new Map<string, { port: number; browserUrl: string }>();
          for (const [scpName, entry] of spawns) {
            refreshSpawns.set(scpName, { port: entry.port, browserUrl: entry.browserUrl });
          }
          const lifecycle = handle?.muxium?.deck?.d?.scp?.d?.scpLifecycle?.k?.lifecycleByScp?.select() ?? new Map();
          refreshBridgeMetadata(refreshSpawns, Array.from(lifecycle.keys()));
        } catch (err) {
          // Best-effort · bridge.json activeScp will be picked up at next periodic refresh
          log('tui.afsw.refresh-failed', { err: String(err) });
        }
      }

      // D-WC-3 · Window-Close Active-Scope Fallback (the inverse of MTAM). electron-main
      // only DISPATCHES scpLifecycleWindowClosed (SCP window closed → surface 'pending');
      // the TUI REACTS here through its own M17 subscription (latestLifecycleSnapshot).
      // When the SCP currently pinning the active filter has transitioned OUT of live/idle
      // INTO 'pending', clear the filter (fall back to General) so the panel does not stay
      // scoped to a window that no longer exists. renderFrame is the post-init MTAM sync
      // site · menuState safe here. The next full frame (this same paint) repaints General.
      if (
        menuState.activeScpFilter !== undefined &&
        latestLifecycleSnapshot !== null &&
        latestLifecycleSnapshot.get(menuState.activeScpFilter) === 'pending'
      ) {
        const clearedScp = menuState.activeScpFilter;
        // F3 · THE NEXT-LIVE BRANCH (the user's law). The active SCP's window closed
        // (surface → 'pending'), but ANOTHER SCP may still be live. Rather than always
        // falling back to General, scan the snapshot for the first SCP (iteration order —
        // deterministic per the Map's insertion order) whose surface is 'live' and is NOT
        // the one that just went pending → pin the filter to THAT SCP. ONLY when no other
        // SCP is live do we clear to General (activeScpFilter: undefined · _activeScpTracker
        // null). This keeps the panel scoped to a live window across a close instead of
        // collapsing the user out of their remaining live SCP.
        let nextLive: string | undefined = undefined;
        for (const [scpName, surface] of latestLifecycleSnapshot) {
          if (scpName !== clearedScp && surface === 'live') {
            nextLive = scpName;
            break;
          }
        }
        if (nextLive !== undefined) {
          menuState = { ...menuState, activeScpFilter: nextLive };
          _activeScpTracker = nextLive;
          log('tui.menu.active-scp-filter-nextlive', {
            clearedScp,
            nextLive,
            source: 'renderFrame.window-closed',
          });
        } else {
          menuState = { ...menuState, activeScpFilter: undefined };
          _activeScpTracker = null;
          log('tui.menu.active-scp-filter-cleared', {
            clearedScp,
            source: 'renderFrame.window-closed',
          });
        }
      }

      const cols = process.stdout.columns ?? 80;
      const rows = process.stdout.rows ?? 24;

      // Diamond B-17 (CD-48 FSIAO): full-screen install animation overlay.
      // When menuState.installAnimating is set, replace the entire frame
      // (top-pane animation + divider + menu) with renderInstallAnimation.
      // Cessation managed by watchFile handler (ACOFSAT) + 30s timeout (ATSC).
      if (menuState.installAnimating !== undefined) {
        const installFrame = renderInstallAnimation(
          menuState.installAnimating,
          cols,
          rows,
          caps,
          Date.now(),
        );
        screenWrite(ANSI.HOME + installFrame);
        return;
      }

      // Epoch Extension · Macro AV: archive screen full-frame render.
      // When archiveView is defined, renderMenu routes to renderArchiveViewPane.
      // No hash-memo (S3 OQ-3): archiveView.detail changes on async load, which a
      // full re-render at the 33ms frame interval picks up cleanly. ANSI.HOME +
      // CLEAR_SCREEN keeps the static list flicker-free.
      if (menuState.archiveView !== undefined) {
        const menuView: MenuState = {
          ...menuState,
          termWidth: cols,
          termHeight: rows,
          lastRenderedAt: Date.now(),
        };
        screenWrite(ANSI.HOME + ANSI.CLEAR_SCREEN + renderMenu(menuView));
        return;
      }

      // Diamond B-26-PEWTER (CD-124 PUCM · uninstall-confirm modal hash-memo).
      // Mirrors trustConfer hash-memo · render-on-state-change-only.
      if (menuState.uninstallConfirm !== undefined) {
        const menuView: MenuState = {
          ...menuState,
          termWidth: cols,
          termHeight: rows,
          lastRenderedAt: Date.now(),
        };
        const currentHash = uninstallConfirmStateHash(menuView);
        if (currentHash !== lastUninstallConfirmHash) {
          lastUninstallConfirmHash = currentHash;
          screenWrite(ANSI.HOME + ANSI.CLEAR_SCREEN + renderMenu(menuView));
        }
        return;
      } else {
        lastUninstallConfirmHash = '';
      }

      // D-GTC S6 · exit-confirm modal hash-memo (parallel to the uninstall-confirm branch above).
      if (menuState.exitConfirm !== undefined) {
        const menuView: MenuState = {
          ...menuState,
          termWidth: cols,
          termHeight: rows,
          lastRenderedAt: Date.now(),
        };
        const currentHash = exitConfirmStateHash(menuView);
        if (currentHash !== lastExitConfirmHash) {
          lastExitConfirmHash = currentHash;
          screenWrite(ANSI.HOME + ANSI.CLEAR_SCREEN + renderMenu(menuView));
        }
        return;
      } else {
        lastExitConfirmHash = '';
      }

      // Diamond B-22 (CD-74 TCPFR · Trust-Confer-Pane-Flicker-Root-Cause-Resolution):
      // when trustConfer is active, render the pane on state-change only.
      // Pane content is fully static (paths + selected button + footer hint);
      // re-rendering 30/sec caused the flicker and cursor-mobility issues user
      // observed. Hash-memo skips the write when nothing changed.
      if (menuState.trustConfer !== undefined) {
        const menuView: MenuState = {
          ...menuState,
          termWidth: cols,
          termHeight: rows,
          lastRenderedAt: Date.now(),
        };
        const currentHash = trustConferStateHash(menuView);
        if (currentHash !== lastTrustConferHash) {
          lastTrustConferHash = currentHash;
          // Single CLEAR_SCREEN + HOME on state-change (not every frame)
          screenWrite(ANSI.HOME + ANSI.CLEAR_SCREEN + renderMenu(menuView));
        }
        // No write if hash unchanged → flicker eliminated · cursor state stable
        return;
      } else {
        // Reset hash so next trust-confer render-on-open paints fresh
        lastTrustConferHash = '';
      }

      const elapsed = Date.now() - startTime;
      const modeIdx = getModeIndex(elapsed);
      const modeName = STRATIDIAN_MODE_NAMES[modeIdx];

      // FIX-2: subtract 1 row for divider BEFORE splitting top/bottom.
      const availableRows = Math.max(2, rows - 1);
      const topRows = Math.max(4, Math.floor(availableRows / 2));
      const bottomRows = Math.max(4, availableRows - topRows);

      const t = elapsed / 1000;
      const topGrid: Grid = createGrid(cols, topRows);
      STRATIDIAN_MODES[modeIdx](t, topGrid, caps);

      const overlay: OverlayMap = createOverlay();
      const snap = feed.latest();
      buildBootUpOverlay(overlay, snap, modeName, cols, caps);
      composeOverlayOnGrid(topGrid, overlay);

      // Boot Overlay Diamond · PTSE per-SCP overlay overlays on top.
      // Read activeOverlayScpName + overlays from scpBootOverlay state via DECK K.
      // Cycle 146 · Tier-2 path correction: scpBootOverlay is muxified inside
      // the `scp` Concept (see scp.concept.ts:113-120), so the read access path
      // is `d.scp.d.scpBootOverlay.k.*` — NOT the prior stale Tier-1 form.
      // Citation: SUITE-7-FUCHSIA-DIAMOND-146-BOOT-OVERLAY-CLINICAL.md §Fix A
      try {
        const overlayHandle = getActiveScsBridgeMuxiumHandle();
        if (overlayHandle !== null) {
          const overlayDeck = overlayHandle.muxium.deck as unknown as {
            d: {
              scp: {
                d: {
                  scpBootOverlay: {
                    k: {
                      activeOverlayScpName: { select: () => string | null };
                      overlays: { select: () => Map<string, ScpOverlayEntry> };
                    };
                  };
                };
              };
            };
          };
          const activeName = overlayDeck.d.scp.d.scpBootOverlay.k.activeOverlayScpName.select();
          if (activeName !== null) {
            const overlayMap = overlayDeck.d.scp.d.scpBootOverlay.k.overlays.select();
            const entry = overlayMap.get(activeName);
            if (entry !== undefined) {
              const box = computeScpBootOverlayBox(cols, topRows);
              const suiteColor = suiteColorForScp(activeName);
              const bootOverlayMap = buildScpBootOverlay({
                scpName: activeName,
                suiteColor,
                ringBufferLines: entry.ringBuffer,
                width: box.width,
                height: box.height,
                caps,
                offsetX: box.offsetX,
                offsetY: Math.min(box.offsetY, Math.max(0, topRows - box.height - 1)),
              });
              composeOverlayOnGrid(topGrid, bootOverlayMap);
            }
          }
        }
      } catch (err) {
        // overlay render must never crash the bridge — but surface to debug.log
        // so future regressions don't hide silently as in pre-Cycle-146.
        log('tui.overlay.render.error', {
          message: err instanceof Error ? err.message : String(err),
        });
      }

      const topFrame = serializeGrid(topGrid, caps);
      // M75 PTBP · Pewter-Toolbar-Border-Pattern · the divider IS the Tool Bar:
      // a state-bearing one-row Diameter between the animation panel (top) and
      // the persistent session menu (bottom). State source: menuState.activeScpFilter.
      const divider = renderToolBar(menuState.activeScpFilter, cols, caps) + '\n';

      // SB-Final · inject the latest lifecycle/spawn snapshots into the
      // scpSubMenu state slot so renderScpSubMenuPane can derive per-SCP
      // badges. Snapshots are populated by the Muxium plan() subscription
      // (above) on each FSM state change; bootingStartedAtByScp is the
      // module-level Map tracking transition timestamps.
      const scpSubMenuWithSnapshots =
        menuState.scpSubMenu !== undefined && lifecycleSubscriptionInstalled
          ? {
              ...menuState.scpSubMenu,
              lifecycleByScp: latestLifecycleSnapshot ?? new Map(),
              sessionCountByScp: latestSessionCountSnapshot ?? new Map(),
              portByScp: latestPortSnapshot ?? new Map(),
              bootingStartedAtByScp: new Map(bootingStartedAtByScp),
              // SS-A1-D2 · inject PPHB Map for render-time staleness filter.
              interactiveSessionsByScp: latestInteractiveSnapshot ?? new Map(),
            }
          : menuState.scpSubMenu;
      const menuView: MenuState = {
        ...menuState,
        scpSubMenu: scpSubMenuWithSnapshots,
        // SCP-3 · TDZ fix: inject live anyScpsInstalled at paint time.
        // latestAnyScpsInstalled is set by the M17 stage closure (which cannot
        // safely touch menuState). Falls back to menuState.anyScpsInstalled
        // before the first M17 fire (null → menuState value preserved).
        anyScpsInstalled:
          latestAnyScpsInstalled !== null ? latestAnyScpsInstalled : menuState.anyScpsInstalled,
        termWidth: cols,
        termHeight: bottomRows,
        lastRenderedAt: Date.now(),
        // C720 B2 · paint-time stale detection · never-throw · '' when fresh/undetectable.
        staleMarker: computeStaleBadge(),
      };
      const menuStr = renderMenu(menuView);

      screenWrite(topFrame + divider + menuStr);
    } finally {
      frameRunning = false;
    }
  };

  const cleanExit = (): void => {
    if (exited) return;
    exited = true;
    log('tui.cleanExit', {});
    releaseGlobalBridgeMutex();
    // D-GTC S5 · paint a "Shutting Down…" banner FIRST (before the alt-screen teardown below),
    // so the user sees the graceful close during the ~200ms exit-defer window while the Electron
    // terminals flush their Claude Code sessions. Best-effort cosmetic — wrapped so a write
    // failure never blocks the exit.
    try {
      screenWrite(
        ANSI.HOME + ANSI.CLEAR_SCREEN + ANSI.BOLD + '\n\n   Shutting Down… flushing sessions\n' + ANSI.RESET,
      );
    } catch {
      /* stdout gone — ignore */
    }
    // ULT · Unified-Lifecycle-Termination · best-effort fire-and-forget quit
    // to Electron tray via CSSP socket. S6 SALVO (the surviving-window wound): the
    // prior 150ms budget could lose the race — the TUI exited at 200ms while the quit
    // was still in flight, orphaning Electron (whose SCP windows then held their
    // WebSockets open, so the SCP servers' zero-connection self-shutdown never armed).
    // 1200ms budget · settles before the 1500ms exit-defer below.
    void sendElectronQuitViaSocket(1200);
    if (frameInterval) {
      clearInterval(frameInterval);
      frameInterval = null;
    }
    // SS-A1-D2 · ADSC interval cleanup · clears any presence-ping timers so
    // the Node event loop drains cleanly (M5 zombie-interval guard).
    for (const [scpName, handle] of presencePingIntervalsByScp) {
      clearInterval(handle);
      log('tui.pphb.interval.cleared', { scpName });
    }
    presencePingIntervalsByScp.clear();
    // SB-P1 · CSBMOTE slot · SBOTD discipline · close the bridge Muxium
    // BEFORE feed.dispose() so principles can emit terminal state writes to
    // paths the feed watches (R2 §9B BSFMCP watchout · best-effort · sync).
    try {
      closeBridgeDaemon();
    } catch {
      // ignore
    }
    try {
      feed.dispose();
    } catch {
      // ignore
    }
    try {
      unwatchFile(registryPath());
    } catch {
      // ignore
    }
    process.stdin.removeListener('keypress', keypressHandler);
    process.stdout.removeListener('resize', resizeHandler);
    process.removeListener('SIGINT', cleanExit);
    process.removeListener('SIGTERM', cleanExit);
    process.removeListener('SIGHUP', cleanExit);
    if (process.stdin.isTTY) {
      try {
        process.stdin.setRawMode(false);
      } catch {
        // ignore
      }
    }
    try {
      process.stdin.pause();
    } catch {
      // ignore
    }
    screenWrite(ANSI.SHOW_CURSOR + ANSI.EXIT_ALT);
    // D-LHT Fix A · restore the real console/stdout/stderr now that the alt-screen is released,
    // so any error during/after teardown surfaces to the terminal normally (not swallowed to log).
    restoreTerminalIO();

    // ── C1020 · SEAT 3 · THE SPAWNED-LANE TEARDOWN ────────────────────────────────────────────
    // *"We Need the Graceful Close Route with the Back Up SIGTERM like our Nodemon Means."*
    //
    // THE LEAK THIS CLOSES: this daemon spawns each SCP lane `detached: true`, so when it exits the
    // lane root (`npm run bridge`) reparents to `ppid 1` and keeps nodemon and ts-node alive. Live
    // at the time of writing: pid 7658 at ppid 1 with its own running subtree. Repeated exits
    // accumulate them until only a reboot frees the resources — which is exactly what the HiFi Red
    // disclaimer on the exit-confirm pane now warns the user about.
    //
    // WHY HERE AND NOT INSIDE THE LANE: two prior seats lived inside the process being torn down and
    // both died of THE PRE-EMPTION HAZARD — the faster self-shutdown silently voiding the slower.
    // The daemon is the one seat that is ALIVE AT THE EVENT and OUTLIVES what it tears down.
    //
    // THE SHAPE IS `nodemon.json`'s, deliberately: the graceful route first, a signal as the backup.
    // The difference is that nodemon supplies its own backup and we have none, so we supply it.
    //
    // FIRE-AND-FORGET, NEVER AWAITED — the precedent is `sendElectronQuitViaSocket(1200)` above.
    // `cleanExit` must never become async: the daemon registers no `unhandledRejection` handler, so
    // a single rejected lane would kill it here, before `SHOW_CURSOR + EXIT_ALT` — stranding the
    // user's terminal in the alt-screen AND skipping every lane after the first.
    try {
      const lanesAsked = askSpawnedLanesToExit();
      if (lanesAsked > 0) {
        // NOT `.unref()`'d — DELIBERATELY. An unref'd timer is discarded the instant the loop
        // empties, and that is precisely how the C1018 seat died without ever firing. The 1500ms
        // exit-defer below holds the loop open well past this, so it is guaranteed its turn.
        //
        // 600ms is a real window for the RELEASE, not a wind-up for the signal: the graceful route
        // answers immediately and lets its watchers and listeners go afterwards. It runs INSIDE the
        // existing 1500ms budget rather than adding to it, so the exit does not get slower.
        setTimeout(() => {
          signalSpawnedLaneGroups();
        }, 600);
      }
      // lanesAsked === 0 falls straight through: a bridge that never spawned an SCP must not wait
      // one millisecond longer to close than it always has.
    } catch (err) {
      // NOTHING here may fail the exit. The teardown is a courtesy to the machine; the user's quit
      // is the contract.
      log('tui.laneTeardown.failed', { message: err instanceof Error ? err.message : String(err) });
    }

    // ULT exit-defer · 200ms grace for sendElectronQuitViaSocket (above)
    // to propagate the quit command before the Node process terminates.
    setTimeout(() => exit(0), 1500);
  };

  const handleResume = async (): Promise<void> => {
    if (
      menuState.selectedUlid &&
      menuState.selectedUlid !== SYNTHETIC_NEW &&
      menuState.selectedUlid !== SYNTHETIC_CLOSE
    ) {
      try {
        // D3H Bug C parity · R7 Path D: HRI pre-check selects mode. Orphan-class
        // sessions (no prior claudeSessionId) route to 'new' on existing ULID
        // rather than throwing at manager.ts:187. Matches MCP engage quality
        // Branch B behavior — preserves SFDS.
        const claudeSessionId = await hasResumableIdentity(menuState.selectedUlid);
        const mode: 'new' | 'resume' = claudeSessionId ? 'resume' : 'new';
        // D2 Electron transition: launchInformative (Terminal.app via osTerminal)
        // replaced by spawnElectronSessionForUlid (CSSP `open-session` verb to
        // Electron main). Q2=Option A: `open-session` is idempotent — focuses
        // existing window if ULID already in SRMP, else creates new Session via
        // cli-handler makeSession factory. mode discriminator preserved as a log
        // signal — claude --resume vs fresh spawn is currently user-typed inside
        // the login-shell PTY (D2 BSRC Phase 1 per R4 Angle 7).
        void mode;
        spawnElectronSessionForUlid(menuState.selectedUlid);
      } catch (err) {
        process.stderr.write(`[scs-bridge] resume error: ${(err as Error).message}\n`);
      }
    }
  };

  const handleSpawn = async (): Promise<void> => {
    if (menuState.spawnInFlight) return;
    menuState = { ...menuState, spawnInFlight: true };
    try {
      // SS-P1 · MSSPCP: when spawning from within the scp sub-menu context,
      // thread the selected SCP name through createSession. Bounds-guard
      // against the trailing "Install Another" row (selectedIdx === items.length).
      //
      // SAWSR-D1 NSESF (M132 RPCD application · Cycle 149): scpSubMenu is
      // CLEARED by the menu.ts reducer at scp-menu-activate emission. After
      // ALHOC double-bind activates an SCP, user lands in the FILTERED main
      // menu (scpSubMenu=undefined · activeScpFilter='TestSCP') showing
      // "Sessions for SCP: TestSCP (N active)". [N] from THAT context must
      // bind the new session to the active SCP filter — not undefined.
      //
      // Source-of-truth precedence: scpSubMenu (in sub-menu) > activeScpFilter
      // (in filtered main) > undefined (top-level main · unscoped session).
      const sub = menuState.scpSubMenu;
      const scpName =
        sub && sub.selectedIdx < sub.items.length
          ? sub.items[sub.selectedIdx]?.name
          : menuState.activeScpFilter;
      const { sessionId } = await createSession({ scpName });
      // D2 Electron transition: launchInformative (Terminal.app via osTerminal)
      // replaced by spawnElectronSessionForUlid (CSSP `open-session` verb to
      // Electron main). createSession path PRESERVED — still writes sessions.json
      // entry + spawn-settings.json before Electron spawns the PTY.
      spawnElectronSessionForUlid(sessionId);
    } catch {
      // ignore
    } finally {
      menuState = { ...menuState, spawnInFlight: false };
    }
  };

  // Diamond B-7 (FINAL · CD-29 BPTC · CD-30 IRSCOC): generous install timeout
  // accommodates real workflows (clone + scaffold + optional Suite 8 conversion +
  // Shatterite confer pauses). Cleanup fires unconditionally on done OR timeout
  // to prevent orphan tempdirs.
  const INSTALL_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

  // Diamond B-7 (FINAL · BPTC + IRSCOC): background poll for scaffold-done.flag
  // written by the special install instance (Strategy/S6 Band 2). Cleans up bridge
  // tempdir and clears menuState.installRunning when install finishes (or times out).
  // Dual try/catch: poll error MUST NOT prevent cleanup; cleanup error MUST NOT
  // prevent menuState clear. Status bar pid indicator vanishes naturally on next
  // render once installRunning is undefined.
  const pollScaffoldCompleteAndCleanup = async (tempDir: string): Promise<void> => {
    try {
      const outcome = await pollScaffoldComplete(tempDir, INSTALL_TIMEOUT_MS);
      if (outcome.done) {
        log('install.complete', { tempDir, payload: outcome.payload });
      } else {
        log('install.timeout', { tempDir });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      log('install.cleanup.error', { phase: 'poll', message, tempDir });
    }
    try {
      cleanupInstallTemp(tempDir);
      log('install.cleaned', { tempDir });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      log('install.cleanup.error', { phase: 'rm', message, tempDir });
    }
    menuState = { ...menuState, installRunning: undefined };
  };

  // Diamond B-13 (CD-38 + CD-39 · Trust-Pre-Seed + Two-Path Install):
  // Step 1: preSeedTrust(cwd) — write ~/.claude.json projects[cwd].hasTrustDialogAccepted=true
  //         under the user-trust-confer-confirm sanctioning chain (CD-32 / Pattern 4.1).
  //         Distinct-Demometer-By-Diameter Lambda evidence (test-005 trusted vs test-006
  //         untrusted in Diamond B-12) confirmed the mechanism without requiring a separate
  //         live-test gate per user discernment.
  //
  // Step 2: branch on existsSync(<cwd>/Cascades/8_SUITES) — the canonical SCS scaffold marker:
  //   Path A (blank-slate · 8_SUITES absent): runInstallScaffoldOnly — clone+scaffold+cleanup,
  //     no spawn. After scaffold, reassign cursor to SYNTHETIC_NEW (Green B4 Fix-4) so the
  //     user's next gesture launches a fresh session in the freshly-installed cwd.
  //   Path B (already-scaffolded · 8_SUITES present): preserve existing flow —
  //     runInstallSpawnPipeline + register-poll typeahead + scaffold-complete cleanup
  //     (used for re-install / strategy-driven flows).
  // Diamond B-17 (CD-52 ATSC · Animation-Timeout-Safety-Cessation): clears
  // installAnimating after 30s if first-spawn-alive signal never surfaces.
  // ULID guard prevents double-clear if cessation already fired.
  const ATSC_TIMEOUT_MS = 30_000;
  const armAtscTimeout = (ulid: string): void => {
    setTimeout(() => {
      if (
        menuState.installAnimating !== undefined &&
        menuState.installAnimating.ulid === ulid &&
        menuState.installAnimating.phase !== 'ready'
      ) {
        log('install.animation.timeout', { ulid });
        menuState = { ...menuState, installAnimating: undefined };
        process.stderr.write(
          '[scs] Install animation timeout — first-spawn-alive signal not received within 30s.\n' +
            '      Returning to menu. Check Cascades/Bridge/debug.json for hook events.\n',
        );
      }
    }, ATSC_TIMEOUT_MS);
  };

  // Diamond B-26-PEWTER (CD-126 BUCS · Bridge-Uninstall-CLI-Sharing):
  // Bridge TUI 'u' hotkey activates the same uninstallSCS() function as the
  // CLI `scs uninstall` subcommand. Single source of truth for reverse-muxify
  // (single function · diverging UI surfaces). Refresh menu state post-uninstall
  // so cascadesPresent flips back to false (Install row appears · Reinstall +
  // Uninstall hotkey hide · CD-123 UMHV visibility gate).
  const handleUninstall = async (): Promise<void> => {
    const cwd = process.cwd();
    log('uninstall.tui.start', { cwd });
    try {
      const { uninstallSCS } = await import('../bridge/uninstall');
      const result = await uninstallSCS({
        userCwd: cwd,
        scsBridgeVersion: '0.36.1', // dynamic via getBridgeVersion if needed
      });
      log('uninstall.tui.complete', {
        ulid: result.ulid,
        reversedFiles: result.reversedFiles,
        preservedIced: result.preservedIced,
        removedDirs: result.removedDirs,
        errorsCount: result.errors.length,
      });
      // Refresh cascadesPresent — uninstall removed Cascades/8_SUITES, so probe re-fires false
      // SCPGATE WSRM: reset installationComplete — the substrate is gone; nothing is
      // "resolved" (cascadesPresent=false already withholds the row · this is coherence).
      const cascadesScaffoldPresent = existsSync(cwd + '/Cascades/8_SUITES');
      menuState = { ...menuState, cascadesPresent: cascadesScaffoldPresent, installationComplete: false };
      log('uninstall.tui.cascades-present.refreshed', { cascadesPresent: cascadesScaffoldPresent });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      log('uninstall.tui.error', { message, cwd });
      process.stderr.write(`[scs] Uninstall failed: ${message}\n`);
    }
  };

  const handleInstall = async (): Promise<void> => {
    const cwd = process.cwd();
    log('install.start', { cwd, repo: SCS_INSTALL_REPO_URL });

    // Diamond B-17 (CD-47 IAILT + CD-48 FSIAO + CD-50 IPDAA): activate full-
    // screen install animation BEFORE first await. Install-path discriminator
    // (IPDAA) — only handleInstall sets this; handleSpawn does NOT.
    // Placeholder ulid until createSession / runInstallSpawnPipeline returns
    // a real one; ATSC timeout armed once real ulid is known.
    const animationStartedAt = Date.now();
    menuState = {
      ...menuState,
      installAnimating: {
        startedAt: animationStartedAt,
        ulid: 'pending',
        phase: 'pre-spawn',
      },
    };

    // Blank-Test-001 recurse (S6 W-a) · GUARANTEE the install overlay paints at least one
    // frame BEFORE any blocking work (the macOS disk-write permission prompt + the clone
    // copy freeze the event loop — installAnimating was set but never painted, so the
    // install read as hung). The frame interval is already running; flushing this tick
    // lets renderFrame fire once before the blocking sequence begins.
    await new Promise<void>((flush) => setImmediate(flush));

    // CD-38: trust-skip pre-seed (atomic; non-fatal on failure)
    try {
      const seedResult = preSeedTrust(cwd);
      log('install.trust-preseed', { cwd, ...seedResult });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      log('install.trust-preseed.error', { message, cwd });
      // non-fatal — fall through; user may see dialog if pre-seed failed
    }

    // CD-39: two-path detect on canonical SCS scaffold marker
    const cascadesScaffoldPresent = existsSync(cwd + '/Cascades/8_SUITES');
    log('install.path-detect', { cwd, cascadesScaffoldPresent });

    // Suite 5 Blue · Installation-Status Boot-Time Check (Wave 3).
    // SECOND-AXIS discriminator on top of cascadesScaffoldPresent · answers
    // "is the install COMPLETE or IN-PROGRESS?" (DISTINCT from cascadesScaffoldPresent
    // which only answers "did scaffolding START?"). Reads Cascade.json directly
    // — does NOT depend on bridge.json echo.
    //
    // Routing matrix:
    //   - Cascades/ absent (cascadesScaffoldPresent=false)  → existing fresh path
    //   - Cascades/ present + status complete (installed/muxified) → existing reinstall path
    //   - Cascades/ present + status legacy (unknown · pre-Diamond) → SAFE FALLBACK to
    //                                                                  existing reinstall path
    //   - Cascades/ present + status IN-PROGRESS (installing/muxifying) → DIVERT to
    //                                                                       fresh-install path
    //                                                                       (re-issue install agent
    //                                                                       to resume crashed install)
    let installationStatus: InstallationStatus = 'unknown';
    if (cascadesScaffoldPresent) {
      const cascadeJsonPath = path.join(cwd, 'Cascades', 'Cascade.json');
      if (existsSync(cascadeJsonPath)) {
        try {
          const cascadeRaw = readFileSync(cascadeJsonPath, 'utf8');
          const cascadeParsed = JSON.parse(cascadeRaw) as Record<string, unknown>;
          installationStatus = resolveInstallationStatus(cascadeParsed.installationStatus);
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          log('install.installation-status.parse-error', { message, cwd });
          // installationStatus stays 'unknown' · safe fallback to complete
        }
      }
    }
    const installationIncomplete =
      cascadesScaffoldPresent && isInstallationInProgress(installationStatus);
    log('install.installation-status.check', {
      cwd,
      cascadesScaffoldPresent,
      installationStatus,
      installationComplete: isInstallationComplete(installationStatus),
      installationInProgress: isInstallationInProgress(installationStatus),
      installationLegacy: isInstallationLegacy(installationStatus),
      installationIncomplete,
    });

    if (!cascadesScaffoldPresent || installationIncomplete) {
      // Diamond ε (Polarity Flip Repair · Cycle 96): B-24-FIX unified BOTH paths
      // to use SCS_INSTALL_MUXIFY_AGENT_PROMPT regardless of mux state — that was
      // a Polarity Flip (broken Diameter that did the opposite of instruction).
      // Fresh slate has no user CLAUDE.md to muxify · running S7+S8 there has the
      // agent auto-fabricate Suite 8 context (now CSDSS-prompted by δ-2 but still
      // wrong-by-default).
      //
      // Restored: priming prompt selection branches on muxState BEFORE spawn:
      //   - fresh    → SCS_PATH_A_PRIMING_PROMPT ('/cascade' · ζ Option X) — agent
      //                boots, triggers cascade.md slash command, renders Shatterite
      //                Main Menu · user picks Install SCP. No auto-Suite-8 scaffold.
      //   - muxified → SCS_INSTALL_MUXIFY_AGENT_PROMPT — S7+S8 strategy muxifies
      //                pre-existing CLAUDE.md into Suite 8 (with δ-2 CSDSS guard).
      //   - remuxify → falls through to Path B (already-scaffolded · re-scaffold)
      const probeMuxState = detectMuxState(cwd);
      const fresh = probeMuxState.state === 'fresh';
      const seedPrompt = fresh ? SCS_PATH_A_PRIMING_PROMPT : SCS_INSTALL_MUXIFY_AGENT_PROMPT;
      log('install.priming.selected', {
        muxState: probeMuxState.state,
        userStateDetected: probeMuxState.userState.detected,
        seedPrompt: fresh
          ? '/cascade (fresh · Cascade Menu · ζ Option X)'
          : 'S7+S8 muxify (muxified · CSDSS-guarded)',
      });
      try {
        const result = await runInstallMuxifiedPath({
          userCwd: cwd,
          repoUrl: SCS_INSTALL_REPO_URL,
          scsBridgeVersion: getBridgeVersion(),
          seedPrompt,
        });
        log('install.muxified.handled', {
          ulid: result.ulid,
          cascadesScaffolded: result.cascadesScaffolded,
          manifestWritten: result.manifestWritten,
          muxState: result.muxState.state,
          pid: result.pid,
        });
        // Diamond B-21 (CD-68 PSCRP): post-scaffold cascadesPresent reflexive flip.
        // SCPGATE WSRM: re-derive installationComplete after scaffold. cascadesPresent
        // flips true now, but the install AGENT has only just spawned — installationStatus
        // is still in-progress until the agent calls markInstallationComplete. The SCP row
        // stays withheld until that completes (PSRS · the substrate-resolved gate).
        let postScaffoldComplete = menuState.installationComplete;
        try {
          const cjPath = path.join(cwd, 'Cascades', 'Cascade.json');
          if (existsSync(cjPath)) {
            const p = JSON.parse(readFileSync(cjPath, 'utf8')) as Record<string, unknown>;
            const st: InstallationStatus = resolveInstallationStatus(p.installationStatus);
            postScaffoldComplete = isInstallationComplete(st) || isInstallationLegacy(st);
          }
        } catch { /* fail-open · keep prior value */ }
        menuState = {
          ...menuState,
          selectedUlid: SYNTHETIC_NEW,
          cascadesPresent: result.cascadesScaffolded ? true : menuState.cascadesPresent,
          installationComplete: postScaffoldComplete,
        };
        // Diamond B-17: phase advance pre-spawn → awaiting-alive; bind ulid.
        if (menuState.installAnimating !== undefined) {
          menuState = {
            ...menuState,
            installAnimating: {
              ...menuState.installAnimating,
              ulid: result.ulid,
              phase: 'awaiting-alive',
            },
          };
          armAtscTimeout(result.ulid);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        log('install.muxified.error', { message, cwd });
        process.stderr.write(`[scs] Muxified install failed: ${message}\n`);
        menuState = { ...menuState, installAnimating: undefined };
      }
      return;
    }

    // Path B: already-scaffolded — Reinstall flow.
    // Diamond B-21 (CD-69 RRSF · Reinstall-Re-Scaffold-Fire): user-named "Run the
    // Install Routine Again" semantic. Re-clone source + re-scaffold non-user
    // artifacts (8_SUITES + Documentation + CHANGELOG + REGISTRY) BEFORE spawning
    // the install instance. User-state preservation:
    //   - Cascade.json — preserved (BECIS skip-if-exists guard B-19)
    //   - Working/* + Lab/* + Bridge sessions — preserved (filter exclusion B-13)
    //   - <userCwd>/CLAUDE.md — backed up timestamped (B-3 backup)
    //   - 8_SUITES/* + Documentation/* + CHANGELOG.md + REGISTRY — REFRESHED
    //     (deliberate Reinstall semantic — get fresh bridge content)
    try {
      const rescaffold = await runInstallScaffoldOnly(
        cwd,
        SCS_INSTALL_REPO_URL,
        getBridgeVersion(),
      );
      log('install.reinstall.rescaffolded', {
        ulid: rescaffold.ulid,
        cascadesScaffolded: rescaffold.cascadesScaffolded,
        templateRenamed: rescaffold.templateRenamed,
        cascadeJsonSeeded: rescaffold.cascadeJsonSeeded,
      });
    } catch (err) {
      // Re-scaffold failure is non-fatal — proceed to install-instance spawn anyway
      const message = err instanceof Error ? err.message : String(err);
      log('install.reinstall.rescaffold-error', { message });
    }
    // Diamond B-16 (CD-46 PCSP): install instance receives verbose Strategy S1
    // directive as positional CLI argument at spawn time — replaces post-spawn
    // pollRegisterReadyAndTypeahead (retired this Diamond).
    try {
      const result = await runInstallSpawnPipeline(
        cwd,
        SCS_INSTALL_REPO_URL,
        SCS_INSTALL_PRIMING_PROMPT,
      );
      menuState = {
        ...menuState,
        installRunning: {
          ulid: result.ulid,
          pid: result.pid,
          tempDir: result.tempDir,
        },
      };
      log('install.spawned', { ulid: result.ulid, pid: result.pid });
      // Diamond B-17: phase advance pre-spawn → awaiting-alive; bind real ulid.
      if (menuState.installAnimating !== undefined) {
        menuState = {
          ...menuState,
          installAnimating: {
            ...menuState.installAnimating,
            ulid: result.ulid,
            phase: 'awaiting-alive',
          },
        };
        armAtscTimeout(result.ulid);
      }
      void pollScaffoldCompleteAndCleanup(result.tempDir);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      log('install.error', { message, cwd });
      // Clear animation on Path B spawn failure
      menuState = { ...menuState, installAnimating: undefined };
      process.stderr.write(`[scs] Install failed: ${message}\n`);
    }
  };

  // ─── Diamond 148 ALHOC M130 · Activate-Launch-Higher-Order-Composition ───────
  // Single source of truth for SCP runtime launch. Extracted from inline
  // `case 'launch-scp-runtime'` body so `case 'scp-menu-activate'` can compose
  // it via `if (scpNeedsLaunch(scpName)) launchScpRuntime(scpName)` rather than
  // duplicating ~90 lines of launch logic. Honors:
  //   · SSAR (M104) — ONE launch definition, two callers (L hotkey + Enter activate)
  //   · WLOG (M82)  — L's working Lambda is what Activate reuses verbatim
  //   · FSTW (M125) — spawnManager Quality Method dispatches FSM transitions on
  //                    spawn-requested + probe-success; both callers benefit
  //                    automatically without re-implementing the bridge.
  //   · IRDOCS (M124) — pendingLaunchScps guard inside launchScpRuntime serves
  //                      both callers; no duplicate guard logic.
  //   · CPPP — no menu.ts changes; no Quality changes; pure animatedTui refactor.
  const launchScpRuntime = (scpName: string): void => {
    // ALHOC M130 internal-conditionals doctrine · all skip-gates live HERE so
    // every caller dispatches unconditionally. Two gates:
    //   Gate 1 · already-loaded (FSM ∈ {booting,idle,live}) → skip + log loaded
    //   Gate 2 · in-flight (pendingLaunchScps.has) → skip + log inflight
    // FSM read uses M17-cached latestLifecycleSnapshot (SSAR-compliant).
    const fsmState = latestLifecycleSnapshot?.get(scpName);
    if (fsmState !== undefined && fsmState !== 'pending') {
      log('tui.launch.scp.skipped.loaded', { scpName, fsmState, tuiSessionId: TUI_SESSION_ID });
      return;
    }
    // R4 Fix B · M-FSM-IDEMPOTENT-ENVELOPE in-flight guard. Cleared in the
    // M17 closure when FSM transitions out of 'pending'. Quality-level
    // getChildProcess guard (LOCK 2) remains authoritative downstream.
    if (pendingLaunchScps.has(scpName)) {
      log('tui.launch.scp.skipped.inflight', { scpName, tuiSessionId: TUI_SESSION_ID });
      return;
    }
    pendingLaunchScps.add(scpName);
    log('tui.launch.scp.start', { scpName, tuiSessionId: TUI_SESSION_ID });
    try {
      const registry = readScpRegistry();
      const entry = registry.scps.find((s) => s.name === scpName);
      if (!entry) {
        pendingLaunchScps.delete(scpName);
        log('tui.launch.scp.error', { scpName, message: 'scpName not found in SCPs.json registry' });
        return;
      }
      // TOH-12 · BREAK 4: `== null` catches an ABSENT key (undefined) as well as null —
      // a hand-authored entry without the key previously fell through to port=undefined.
      if (entry.boundBridgePort == null) {
        pendingLaunchScps.delete(scpName);
        log('tui.launch.scp.error', { scpName, message: 'boundBridgePort is null in registry' });
        return;
      }
      // TOH-12 · BREAK 5 (SOV-1 at the launch gate): refuse to spawn onto a port pair
      // another REGISTERED entry holds — the EADDRINUSE embrace caught at the registry
      // level instead of the socket. scps[]-scope ONLY: archived entries are deliberately
      // excluded here (an archived twin of a live port is the recorded historical reclaim,
      // not a reason to ground the live SCP).
      {
        const pair = [entry.boundBridgePort, entry.boundBridgePort + 1];
        const collided = registry.scps.find(
          (o) =>
            o.name !== scpName &&
            o.boundBridgePort != null &&
            [o.boundBridgePort, o.boundBridgePort + 1].some((p) => pair.includes(p)),
        );
        if (collided) {
          pendingLaunchScps.delete(scpName);
          log('tui.launch.scp.error', {
            scpName,
            message: `port pair collision with registered SCP '${collided.name}' (${collided.boundBridgePort})`,
          });
          return;
        }
      }
      const scpPath = path.join(process.cwd(), entry.path);
      const port = entry.boundBridgePort;
      const bootRequestUlid = ulid();
      const bridgeHandle = getActiveScsBridgeMuxiumHandle();
      if (bridgeHandle === null) {
        pendingLaunchScps.delete(scpName);
        log('tui.launch.scp.error', { scpName, message: 'scsBridge muxium handle unavailable' });
        return;
      }
      const dispatchDeck = bridgeHandle.muxium.deck.d as unknown as Deck<SCPDeck>;
      const requestAction = dispatchDeck.scp.d.scpSpawnManager.e.scpSpawnManagerSpawnRequested({
        scpName,
        scpPath,
        command: 'npm',
        args: ['run', 'bridge'],
        port,
        sessionId: TUI_SESSION_ID,
        bootRequestUlid,
        requestedAt: Date.now(),
        // C905 · any boot of a not-live SCP is a COMPLETE RESTART (the clear path after
        // any window close — deliberate anor crash).
        forceRestart: (latestLifecycleSnapshot?.get(scpName) ?? 'pending') !== 'live',
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (bridgeHandle.muxium as any).dispatch(requestAction);
      log('tui.launch.scp.dispatched', {
        scpName,
        scpPath,
        port,
        bootRequestUlid,
        tuiSessionId: TUI_SESSION_ID,
      });
      // INSTALL-FIX-007 · FIX 1 · SET-ACTIVE-ON-TUI-LAUNCH (shared site · covers
      // 'scp-menu-activate' + 'launch-scp-runtime'). The TUI launch path never set
      // _activeScpTracker — the sole feed to bridge.json.activeScp via
      // refreshBridgeMetadata. Mirror the MTAM block (renderFrame ~:886) semantics
      // locally so bridge.json.activeScp is written without waiting for the MCP
      // scp_launch_session_management callback. boundScps still populates downstream
      // once the spawn FSM port-binds (spawnsByScp). 'engage-via-bridge' is a
      // SEPARATE inlined dispatch path (does NOT route through here) — it carries
      // its own copy of this block.
      _activeScpTracker = scpName;
      menuState = { ...menuState, activeScpFilter: scpName };
      try {
        const spawns =
          bridgeHandle.muxium?.deck?.d?.scp?.d?.scpSpawnManager?.k?.spawnsByScp?.select() ?? new Map();
        const refreshSpawns = new Map<string, { port: number; browserUrl: string }>();
        for (const [name, sEntry] of spawns) {
          refreshSpawns.set(name, { port: sEntry.port, browserUrl: sEntry.browserUrl });
        }
        refreshSpawns.set(scpName, { port, browserUrl: `http://localhost:${port}` });
        refreshBridgeMetadata(refreshSpawns, Array.from((latestLifecycleSnapshot ?? new Map()).keys()));
      } catch (refreshErr) {
        log('tui.launch.scp.active-refresh-failed', { scpName, err: String(refreshErr) });
      }
    } catch (err) {
      pendingLaunchScps.delete(scpName);
      const message = err instanceof Error ? err.message : String(err);
      log('tui.launch.scp.error', { scpName, message });
    }
  };

  // ALHOC M130 · scpNeedsLaunch predicate deleted (Cycle 148 R4 diagnosis ·
  // user direction: "the launch function should have the conditionals within
  // itself to avoid repetition"). All skip-gates live INSIDE launchScpRuntime ·
  // callers dispatch unconditionally. Single source of truth.

  const keypressHandler = (_str: string | undefined, key: KeypressInput | undefined): void => {
    if (!key) return;
    // Diamond B-17 (CD-47 IAILT · Install-Animation-Input-Lock-Trance):
    // when full-screen install animation is active, drop ALL keypresses
    // EXCEPT Ctrl-C (which exits the bridge entirely via cleanExit).
    // Animation auto-clears on first-spawn-alive (ACOFSAT) or 30s (ATSC).
    if (menuState.installAnimating !== undefined) {
      if (key.ctrl && key.name === 'c') {
        cleanExit();
        return;
      }
      // All other keys are absorbed — input-locked
      return;
    }
    // FB-3 · THE TEXT-MODAL GUARD (the AmberlightStudio Escape-first wound): while a
    // text-input modal owns the keyboard (the SCP wizard's designation field anor a
    // rename buffer), the global hotkey intercepts MUST stand down — Esc belongs to the
    // modal, and 'v', 'z', and digits are legitimate TYPED CHARACTERS for a name. The
    // field mechanism: a live boot overlay drew OVER the wizard pane while typed keys
    // fell invisibly into the buffer beneath; the first Esc dismissed the OVERLAY (not
    // the wizard) — revealing the field — and the second cancelled the wizard.
    const textModalActive = menuState.scpWizard !== undefined || menuState.renameMode !== undefined;
    // Boot Overlay Diamond · HIGH-3 Esc modal precedence + V hotkey.
    // Same precedence pattern as installAnimating above — boot overlay Esc
    // takes priority over menu Esc branches when an overlay is visible.
    try {
      const bootHandle = getActiveScsBridgeMuxiumHandle();
      if (bootHandle !== null) {
        // Cycle 146 · Tier-2 path correction: scpBootOverlay sits inside `scp`.
        // Access shape: `d.scp.d.scpBootOverlay.{k,e}.*`. The prior stale Tier-1
        // cast silently failed in the try/catch, masking Esc/V/1-9 keypress
        // dispatches. The spawn-side BOLS dispatch path already used the
        // correct Tier-2 form — this brings the read/keypress path into alignment.
        // Citation: SUITE-7-FUCHSIA-DIAMOND-146-BOOT-OVERLAY-CLINICAL.md §Fix A
        const bootDeck = bootHandle.muxium.deck as unknown as {
          d: {
            scp: {
              d: {
                scpBootOverlay: {
                  k: {
                    activeOverlayScpName: { select: () => string | null };
                    overlays: { select: () => Map<string, ScpOverlayEntry> };
                  };
                  e: {
                    scpBootOverlayShow: (p: { scpName: string }) => unknown;
                    scpBootOverlayDismiss: (p: {
                      scpName: string;
                      reason: 'user-esc' | 'rest-period' | 'force-hold';
                    }) => unknown;
                  };
                };
              };
            };
          };
        };
        const activeOverlayScp = bootDeck.d.scp.d.scpBootOverlay.k.activeOverlayScpName.select();
        // FB-3 · the layering self-heal: an overlay still standing above a text modal is
        // dismissed on the FIRST keypress — the pane beneath reveals, and the key itself
        // still routes to the modal below (no return).
        if (textModalActive && activeOverlayScp !== null) {
          const dismissAction = bootDeck.d.scp.d.scpBootOverlay.e.scpBootOverlayDismiss({
            scpName: activeOverlayScp,
            reason: 'user-esc',
          });
          bootHandle.muxium.dispatch(dismissAction as never);
          log('tui.overlay.text-modal-self-heal', { scpName: activeOverlayScp });
        }
        if (!textModalActive && activeOverlayScp !== null && key.name === 'escape') {
          const dismissAction = bootDeck.d.scp.d.scpBootOverlay.e.scpBootOverlayDismiss({
            scpName: activeOverlayScp,
            reason: 'user-esc',
          });
          bootHandle.muxium.dispatch(dismissAction as never);
          return;
        }
        if (!textModalActive && (key.sequence === 'v' || key.sequence === 'V')) {
          const candidate = menuState.activeScpFilter;
          if (candidate !== undefined && candidate.length > 0) {
            const showAction = bootDeck.d.scp.d.scpBootOverlay.e.scpBootOverlayShow({
              scpName: candidate,
            });
            bootHandle.muxium.dispatch(showAction as never);
            return;
          }
        }
        // NKOR Number-Key-Overlay-Recall · PIIK Per-Index-Idempotent-Key
        // Digits 1-9 open the boot overlay for the SCP at registry index (digit-1).
        // PIIK invariant: index derived from current registry snapshot per keypress,
        // NOT cached. Acceptable shift on registry add/remove between presses.
        // Fires globally (any menu mode that has SCPs visible) BEFORE applyKeypress.
        // Citation: SUITE-3-YELLOW-UX-REFINEMENT-BLUEPRINT.md §2 (NKOR)
        if (!textModalActive && key.sequence !== undefined && /^[1-9]$/.test(key.sequence)) {
          const digit = parseInt(key.sequence, 10);
          const scpIndex = digit - 1;
          const registrySnapshot = readScpRegistry();
          if (scpIndex < registrySnapshot.scps.length) {
            const targetScp = registrySnapshot.scps[scpIndex];
            if (targetScp !== undefined) {
              const showAction = bootDeck.d.scp.d.scpBootOverlay.e.scpBootOverlayShow({
                scpName: targetScp.name,
              });
              bootHandle.muxium.dispatch(showAction as never);
              log('tui.nkor.dispatch', { digit, scpName: targetScp.name });
              return;
            }
          }
          log('tui.nkor.out-of-range', {
            digit,
            registrySize: registrySnapshot.scps.length,
          });
          return;
        }
      }
    } catch (err) {
      // overlay keypress must never crash the bridge — but surface to debug.log
      // so future regressions don't hide silently as in pre-Cycle-146.
      log('tui.overlay.keypress.error', {
        message: err instanceof Error ? err.message : String(err),
      });
    }
    // Diamond F · THKF · TUI Hotkey 'z' for Focus. Pre-filter intercept (Option A).
    // D2 Electron transition: terminalWindowId-based osascript focus replaced
    // by ULID-based CSSP relay. focusElectronSessionForUlid invokes
    // `open-session <ulid>` which under Q2=Option A focuses-existing in Electron
    // main. HFGE gate: synthetic-row sentinels + non-launched all return silent no-op.
    if (!textModalActive && (key.sequence === 'z' || key.sequence === 'Z')) {
      const sel = menuState.selectedUlid;
      if (
        sel !== null &&
        sel !== SYNTHETIC_NEW &&
        sel !== SYNTHETIC_CLOSE &&
        sel !== SYNTHETIC_INSTALL &&
        sel !== SYNTHETIC_INSTALL_SCP &&
        sel !== SYNTHETIC_ENGAGE_SCP
      ) {
        const entry = menuState.sessions.find((s) => s.id === sel);
        if (entry !== undefined && entry.status === 'launched') {
          focusElectronSessionForUlid(entry.id);
        }
      }
      return;
    }
    const { newState, action } = applyKeypress(menuState, key);
    menuState = newState;
    switch (action.type) {
      case 'close':
        cleanExit();
        return;
      case 'resume-selected':
        void handleResume();
        return;
      case 'spawn-new':
        void handleSpawn();
        return;
      // Diamond Q Issue 3: pre-existing remove-selected gap fix. 'x' key was
      // dispatched but never acted on in the animatedTui path — sessions
      // persisted silently. Same idempotent fire-and-forget pattern as startMenu.
      case 'remove-selected': {
        const ulid = menuState.selectedUlid;
        if (ulid && ulid !== SYNTHETIC_NEW && ulid !== SYNTHETIC_CLOSE) {
          void removeSession(ulid);
        }
        return;
      }
      // TBHK · Dissolution + Archival Diamond · 'd' dissipate the selected session:
      // registry removal + DELETE the real ClaudeCode session (anchor-guarded +
      // resilient inside registry.ts · SAME fn as the scs_dissipate_session MCP tool).
      case 'dissipate-selected': {
        const ulid = menuState.selectedUlid;
        if (ulid && ulid !== SYNTHETIC_NEW && ulid !== SYNTHETIC_CLOSE) {
          void dissipateSession(ulid);
        }
        return;
      }
      // TBHK · 'a' archive the selected session: MOVE the real ClaudeCode session into
      // Cascades/Archive/YYYY/MM/DD/ then registry removal (anchor-guarded + resilient ·
      // SAME fn as the scs_archive_session MCP tool).
      case 'archive-selected': {
        const ulid = menuState.selectedUlid;
        if (ulid && ulid !== SYNTHETIC_NEW && ulid !== SYNTHETIC_CLOSE) {
          void archiveSession(ulid);
        }
        return;
      }
      // Epoch Extension · Macro AV: open archive view screen.
      // Fires from 'w'/'W' (main switch) AND from 'r'/'R' within the archiveView
      // early-return (refresh). Both paths reuse this handler: set the skeleton
      // synchronously (so the screen swaps THIS frame), then async-populate entries
      // via the bridge-direct buildArchiveManifest() (no HTTP — same process).
      case 'open-archive-view': {
        menuState = {
          ...menuState,
          archiveView: { entries: [], selectedIdx: 0, currentPage: 0, detail: null },
        };
        void (async () => {
          try {
            const entries = await buildArchiveManifest();
            menuState = {
              ...menuState,
              archiveView: menuState.archiveView
                ? { ...menuState.archiveView, entries, selectedIdx: 0, currentPage: 0, detail: null }
                : undefined,
            };
          } catch (err) {
            log('tui.archive.manifest.error', { err: String(err) });
            // Leave entries: [] — empty state renders "No archived sessions".
          }
        })();
        return;
      }
      // Epoch Extension · Macro AV: load detail for the selected archive entry.
      // applyKeypress already set detail='loading' in newState (this frame shows the
      // loading line); here we async-read the heavy body and patch the slot. The
      // archiveView-still-defined guard prevents a late resolve clobbering a closed screen.
      case 'archive-view-detail-load': {
        const id = action.id;
        void (async () => {
          try {
            const contents = await readArchiveContents(id);
            menuState = {
              ...menuState,
              archiveView: menuState.archiveView
                ? { ...menuState.archiveView, detail: contents }
                : undefined,
            };
          } catch (err) {
            log('tui.archive.detail.error', { id, err: String(err) });
            menuState = {
              ...menuState,
              archiveView: menuState.archiveView
                ? { ...menuState.archiveView, detail: null }
                : undefined,
            };
          }
        })();
        return;
      }
      // Epoch Extension · Macro AV: cursor + detail-clear mutations already applied
      // by applyKeypress newState (menuState = newState above); renderFrame picks
      // them up on the next 33ms tick. No side effect to fire here.
      case 'archive-view-cursor-up':
      case 'archive-view-cursor-down':
      case 'archive-view-detail-clear':
        return;
      // Epoch Extension · Macro AV: clear the archiveView slot entirely (Esc from list).
      case 'close-archive-view':
        menuState = { ...menuState, archiveView: undefined };
        return;
      // Diamond Q: User-Sourced Identification Diameter — rename modal lifecycle.
      case 'rename-selected': {
        const ulid = menuState.selectedUlid;
        if (ulid && ulid !== SYNTHETIC_NEW && ulid !== SYNTHETIC_CLOSE) {
          const entry = menuState.sessions.find((s) => s.id === ulid);
          // RM-D4 · DPCO seed · pre-fill from scsLabel (the SCS-Bridge rename
          // target) first, falling back to displayName then empty.
          menuState = {
            ...menuState,
            renameMode: { ulid, buffer: entry?.scsLabel ?? entry?.displayName ?? '' },
          };
        }
        return;
      }
      case 'rename-confirm': {
        if (menuState.renameMode) {
          const { ulid, buffer } = menuState.renameMode;
          const trimmed = buffer.trim();
          // RM-D4 · DUAL · TUI rename leg writes scsLabel (matches the Vue Quality).
          void setSessionScsLabel(ulid, trimmed === '' ? undefined : trimmed);
          menuState = { ...menuState, renameMode: undefined };
        }
        return;
      }
      case 'rename-cancel': {
        menuState = { ...menuState, renameMode: undefined };
        return;
      }
      case 'rename-buffer-update':
        // applyKeypress already updated menuState.renameMode.buffer via newState; renderFrame picks up next tick.
        return;
      // C1104 · ruling A · the RESUME-model picker lifecycle (the Anchor Menu leg).
      case 'set-model-selected': {
        const ulid = menuState.selectedUlid;
        if (ulid && ulid !== SYNTHETIC_NEW && ulid !== SYNTHETIC_CLOSE) {
          const entry = menuState.sessions.find((s) => s.id === ulid);
          // Seed the cursor on the session's CURRENT model when it has one, so the
          // picker opens where the session actually stands; else the first row.
          const seeded = entry?.model
            ? AVAILABLE_MODELS.findIndex((m) => m.id === entry.model)
            : -1;
          menuState = { ...menuState, modelPickMode: { ulid, index: seeded >= 0 ? seeded : 0 } };
        }
        return;
      }
      case 'set-model-pick': {
        if (menuState.modelPickMode) {
          // D3D · the SAME function the MCP handler's quality calls. source 'set'
          // stamps modelSetAt, so the next transcript OBSERVE cannot clobber it.
          void setSessionModel(menuState.modelPickMode.ulid, action.model, 'set');
          menuState = { ...menuState, modelPickMode: undefined };
        }
        return;
      }
      case 'set-model-cancel': {
        menuState = { ...menuState, modelPickMode: undefined };
        return;
      }
      case 'set-model-move':
        // applyKeypress already moved menuState.modelPickMode.index via newState.
        return;
      // Diamond B-6 (APEX): Install sentinel wired to full pipeline.
      // Diamond B-8 Fix 3 (HWMTUC-SURFACE): present trust-confer TUI before pipeline.
      // Pipeline cannot fire until trust-confer-confirm KeyAction received.
      case 'install-selected': {
        // Diamond B-22 (CD-72 TCANC): default selected = 'approve' preserves
        // B-8 Y/Enter direct-confirm behavior; arrow keys toggle to 'cancel'.
        menuState = {
          ...menuState,
          trustConfer: {
            paths: buildProposedInstallPaths(process.cwd()),
            optionalPaths: OPTIONAL_INSTALL_PATHS,
            ulid: 'pending',
            selected: 'approve',
          },
        };
        return;
      }
      // Diamond B-8 Fix 3 (HWMTUC-SURFACE): user approved trust-confer → fire pipeline.
      case 'trust-confer-confirm':
        menuState = { ...menuState, trustConfer: undefined };
        void handleInstall();
        return;
      // Diamond B-8 Fix 3 (HWMTUC-SURFACE): user declined → clear modal, no pipeline.
      case 'trust-confer-decline':
        menuState = { ...menuState, trustConfer: undefined };
        log('install.declined', { cwd: process.cwd() });
        return;
      // Diamond B-22 (CD-72 TCANC): arrow/Tab updated trustConfer.selected via
      // applyKeypress newState; renderFrame picks up on next paint. No additional
      // action needed here — the state mutation already happened.
      case 'trust-confer-toggle':
        return;
      // Diamond B-22 (CD-72 TCANC): Enter/Space activates the currently-selected
      // button. Translate to confirm OR decline based on selected state.
      case 'trust-confer-activate': {
        const sel = menuState.trustConfer?.selected;
        menuState = { ...menuState, trustConfer: undefined };
        if (sel === 'cancel') {
          log('install.declined', { cwd: process.cwd(), via: 'arrow-nav-activate' });
          return;
        }
        // 'approve' (or undefined fallback) → fire pipeline
        void handleInstall();
        return;
      }
      // Diamond B-26-PEWTER (CD-124 PUCM · uninstall confirmation modal):
      // 'u' hotkey opened modal — no side effect needed here, modal state
      // already in menuState (renderFrame picks up next paint).
      case 'uninstall-selected':
        return;
      // Arrow/Tab toggle within modal — applyKeypress already mutated selected.
      case 'uninstall-confirm-toggle':
        return;
      // Y direct shortcut → fire uninstall
      case 'uninstall-confirm':
        menuState = { ...menuState, uninstallConfirm: undefined };
        void handleUninstall();
        return;
      // N/Esc direct shortcut → cancel
      case 'uninstall-cancel':
        menuState = { ...menuState, uninstallConfirm: undefined };
        log('uninstall.declined', { cwd: process.cwd() });
        return;
      // Enter/Space activate selected button
      case 'uninstall-confirm-activate': {
        const sel = menuState.uninstallConfirm?.selected;
        menuState = { ...menuState, uninstallConfirm: undefined };
        if (sel === 'approve') {
          void handleUninstall();
          return;
        }
        // 'cancel' (default) OR undefined → no-op decline
        log('uninstall.declined', { cwd: process.cwd(), via: 'arrow-nav-activate' });
        return;
      }
      // D-GTC S6 · exit-confirm modal opened (q/Escape/CLOSE-row) or arrow-toggled → state is
      // already in menuState; just repaint on the next frame.
      case 'exit-confirm-open':
      case 'exit-confirm-toggle':
        return;
      // Y direct shortcut → confirm exit (graceful terminal close flushes on cleanExit)
      case 'exit-confirm':
        menuState = { ...menuState, exitConfirm: undefined };
        cleanExit();
        return;
      // N/Esc direct shortcut → cancel (dismiss the popup)
      case 'exit-cancel':
        menuState = { ...menuState, exitConfirm: undefined };
        log('exit.declined', {});
        return;
      // Enter/Space activate selected: approve (default) → exit · cancel → dismiss
      case 'exit-confirm-activate': {
        const sel = menuState.exitConfirm?.selected;
        menuState = { ...menuState, exitConfirm: undefined };
        if (sel === 'approve') {
          cleanExit();
          return;
        }
        log('exit.declined', { via: 'arrow-nav-activate' });
        return;
      }
      // RM-D5: 'i' hotkey opened Install SCP wizard — initialize scpWizard slot.
      case 'install-scp-selected': {
        // SCPGATE FBSN: first-run consent note gate. State A (note not yet shown) →
        // open at the consent note. State B (consumed) → straight to the wizard.
        const noteShown = menuState.scpInstallAgentNoteShown === true;
        const startStep = noteShown ? 'designation' : 'agent-install-note';
        menuState = {
          ...menuState,
          scpWizard: {
            state: { ...createInitialWizardState(), step: startStep },
            inputBuffer: '',
          },
        };
        return;
      }
      // GITM-PROGINSTALL: 'p' hotkey — non-interactive SCP install. Derive the
      // designation from path.basename(process.cwd()), reusing the wizard's OWN
      // validator (validateDesignationForWizard) + deriver (deriveNamesFromDesignation)
      // verbatim. Valid → call runInstallScpPipeline directly (no wizard prompts) and
      // drive the SAME post-install surface as the wizard (boot-recommend on ok ·
      // error on failure · anyScpsInstalled flip on ok). Invalid (empty/numeric/reserved/
      // <2 chars per the wizard's check) → fall back to the interactive wizard so the
      // user can name it (the existing install-scp-selected behavior).
      case 'install-scp-programmatic': {
        // Normalize the cwd basename to PascalCase: split on -, _, whitespace and
        // capitalize each segment. (validateDesignationForWizard enforces the rest.)
        const cwdBase = path.basename(process.cwd());
        const pascal = cwdBase
          .split(/[-_\s]+/)
          .filter(Boolean)
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join('');

        const vResult = validateDesignationForWizard(pascal);
        if (!vResult.valid) {
          // Derived designation not valid → fall back to the interactive wizard
          // (mirror install-scp-selected: respect the FBSN first-run consent gate).
          log('install.scp.programmatic.fallback', {
            cwdBase,
            pascal,
            reason: vResult.reason,
          });
          const noteShown = menuState.scpInstallAgentNoteShown === true;
          const startStep = noteShown ? 'designation' : 'agent-install-note';
          menuState = {
            ...menuState,
            scpWizard: {
              state: { ...createInitialWizardState(), step: startStep },
              inputBuffer: '',
            },
          };
          return;
        }

        const designation = pascal;
        const derivation = deriveNamesFromDesignation(designation);
        // Pre-populate a wizard state at the 'running' step so the success/error
        // surfaces match the interactive path's state shape exactly.
        const baseState = {
          ...createInitialWizardState(),
          designation,
          derivation,
          step: 'running' as const,
        };
        log('install.scp.programmatic.start', { designation, cwd: process.cwd() });
        // Issue #643 Half A · Wave 2: ASYNC install (parity with the wizard
        // path). Set installRunning + the wizard 'running' step, THEN fire
        // runInstallScpPipelineAsync fire-and-forget so the render loop keeps
        // ticking and the pseudo-progress bar animates. On resolve re-read the
        // CURRENT menuState (closure var) and clear installRunning.
        {
          const installUlid = ulid();
          menuState = {
            ...menuState,
            scpWizard: { state: { ...baseState, step: 'running' }, inputBuffer: '' },
            installRunning: {
              ulid: installUlid,
              kind: 'scp',
              designation,
              startedAt: Date.now(),
              // Issue #643 Refinement · seed the first phase so the step-aware
              // asymptotic bar starts in the `staging` range immediately.
              phase: 'staging',
              phaseStartedAt: Date.now(),
            },
          };
          void runInstallScpPipelineAsync(
            {
              projectRoot: process.cwd(),
              designation,
              runNpmInstall: true,
              buildDescriptor: true,
            },
            // Issue #643 Refinement · onPhase updates the LIVE menuState closure
            // var so the bar checkpoints + re-crawls per phase (live-closure).
            (phase) => {
              menuState = {
                ...menuState,
                installRunning: menuState.installRunning
                  ? { ...menuState.installRunning, phase, phaseStartedAt: Date.now() }
                  : menuState.installRunning,
              };
            },
          )
            .then((result) => {
              if (result.ok) {
                log('install.scp.programmatic.completed', {
                  designation,
                  conceptName: result.conceptName,
                  port: result.port,
                });
                menuState = {
                  ...menuState,
                  // Reuse the wizard's boot-recommend card — same post-install UX.
                  // Issue #643 Half B · Refinement 3+4: seed affirm → [ Launch ] default.
                  scpWizard: {
                    state: { ...baseState, step: 'boot-recommend', buttonSelection: 'affirm' },
                    inputBuffer: '',
                  },
                  anyScpsInstalled: true,
                  installRunning: undefined,
                };
              } else {
                log('install.scp.programmatic.failed', { designation, reason: result.reason });
                menuState = {
                  ...menuState,
                  scpWizard: {
                    state: { ...baseState, step: 'error', validationError: result.reason ?? '' },
                    inputBuffer: '',
                  },
                  installRunning: undefined,
                };
              }
            })
            .catch((err) => {
              log('install.scp.programmatic.exception', { designation, error: String(err) });
              menuState = {
                ...menuState,
                scpWizard: {
                  state: { ...baseState, step: 'error', validationError: String(err) },
                  inputBuffer: '',
                },
                installRunning: undefined,
              };
            });
        }
        return;
      }
      // Diamond β RM-Asp-2: open SCP sub-menu — refresh SCPs.json then init slot
      case 'open-scp-menu': {
        const reg = readScpRegistry();
        menuState = {
          ...menuState,
          scpSubMenu: { items: reg.scps, selectedIdx: 0 },
        };
        // MD-ARC+C · Wave 5a (§5.3) — same Archived-fold populate as the manage
        // route (both routes render renderScpSubMenuPane · the fold must be present
        // on either entry point). renderFrame's spread preserves the async patch.
        void (async () => {
          try {
            const archivedItems = await listArchivedScps();
            menuState = {
              ...menuState,
              scpSubMenu: menuState.scpSubMenu
                ? { ...menuState.scpSubMenu, archivedItems }
                : menuState.scpSubMenu,
            };
          } catch (err) {
            log('tui.menu.scp-menu.archived.error', { err: String(err) });
          }
        })();
        return;
      }
      // Cycle 141 SIPMT (MRSM) · CSPMSR-true row-Enter routes here.
      // SM-SCP-MANAGE surface — Pewter HiFi 9-row management menu (Launch · Dock ·
      // Status · Logs · Browser · Unregister · Install · View · Maintain).
      // Yellow §5 Site C: Cobalt determines rendering mechanism. Minimal-edit
      // call (per CPPP doctrine): populate the same scpSubMenu slot as
      // 'open-scp-menu' so the route is functionally wired AND visible — the
      // label flips, the route dispatches, the existing inline pane renders the
      // SCP list. Full Pewter HiFi 9-row management surface rendering is
      // deferred to a follow-up sub-Diamond (downstream of SIPMT). The MRSM
      // route swap itself is the Cycle 141 deliverable.
      // Spec source: Cascades/8_SUITES/Teal Claude/Skills/S-SHATTERITE-MENU/SM-SCP-MANAGE.md
      case 'open-scp-manage-menu': {
        // Navigation-only. Launch composition lives in 'scp-menu-activate'
        // (the case that receives target.name from sub-menu Enter). User
        // direction: "Function Only when Activating via the Enter Hotkey on
        // the Specified SCP that would be Passed to the Composed Launch
        // Function." Cycle 148 R4 calibration · ALHOC M130 placement-correct.
        const reg = readScpRegistry();
        log('tui.menu.scp-manage.opened', {
          cwd: process.cwd(),
          scpCount: reg.scps.length,
          via: 'enter-key-cspmsr-true',
        });
        menuState = {
          ...menuState,
          scpSubMenu: { items: reg.scps, selectedIdx: 0 },
        };
        // MD-ARC+C · Wave 5a (MD-ARC-R3-BLUEPRINT §5.3) — async-populate the
        // Archived fold from the vault ledger. Mirrors the open-archive-view
        // idiom: fire the async read, patch the still-open scpSubMenu slot;
        // renderFrame picks it up next paint tick (the spread preserves it).
        void (async () => {
          try {
            const archivedItems = await listArchivedScps();
            menuState = {
              ...menuState,
              scpSubMenu: menuState.scpSubMenu
                ? { ...menuState.scpSubMenu, archivedItems }
                : menuState.scpSubMenu,
            };
          } catch (err) {
            log('tui.menu.scp-manage.archived.error', { err: String(err) });
          }
        })();
        return;
      }
      case 'close-scp-menu':
        // SS-P2 · SCFC clear: Esc back-to-main clears filter alongside sub-menu slot.
        menuState = { ...menuState, scpSubMenu: undefined, activeScpFilter: undefined };
        return;
      // Up/Down already mutated selectedIdx via applyKeypress newState
      case 'scp-menu-cursor-up':
      case 'scp-menu-cursor-down':
        return;
      // Enter on sub-menu item — last index (items.length) is "Install Another"
      case 'scp-menu-activate': {
        // Cycle 148 R7 fix · the reducer in menu.ts pre-emptively clears
        // scpSubMenu in newState BEFORE this handler runs (line 1577:
        // `menuState = newState`). The prior `if (!menuState.scpSubMenu) return`
        // guard was dead-code-via-always-true · launchScpRuntime never reached.
        // ALHOC M130 double-bind · action.scpName is the authoritative source.
        //   action.scpName present → real SCP row · activate-launch composition
        //   action.scpName absent  → "Install Another" row · open wizard
        if (action.scpName) {
          const scpName = action.scpName;
          // D1a · THE ACTIVE-SCP LAW (C587 · the user's law: active = THE LAST USER-SPAWNED):
          // the local overlay+launch pair MISSED the active-setter — the banner rested at
          // SCP: (none) and session spawns lost their scope. Dispatch the ONE built flow
          // (scsBridgeActivateScpSession): sets activeScpFromMcp (→ MTAM → the banner + the
          // D3C bridge.json refresh the session scope reads) + overlay show (freshBoot) +
          // spawn-request (LOCK-2 downstream guards the already-live case).
          const activateHandle = getActiveScsBridgeMuxiumHandle();
          if (activateHandle !== null) {
            const activateDeck = activateHandle.muxium.deck as unknown as {
              d: { scsBridge: { e: { scsBridgeActivateScpSession: (p: { scpName: string }) => unknown } } };
            };
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (activateHandle.muxium as any).dispatch(
              activateDeck.d.scsBridge.e.scsBridgeActivateScpSession({ scpName }),
            );
          } else {
            // No live handle — degrade to the direct launch (no active pinning possible).
            launchScpRuntime(scpName);
          }
          return;
        }
        // "Install Another" row · open wizard (no scpName carried)
        menuState = {
          ...menuState,
          scpWizard: { state: createInitialWizardState(), inputBuffer: '' },
          activeScpFilter: undefined,
        };
        return;
      }
      // SB-Direct-Spawn · [L] launch SCP runtime · dispatches the Stratimux
      // scpSpawnManagerSpawnRequested action (launchScpRuntime helper) which boots
      // `npm run bridge` at the SCP's installPath + port-bind probe. The SCP then
      // surfaces in its own SCS window via the OBRS path (the SCP URL is routed
      // through CSSP → the Electron presenter, NOT an OS browser tab · Issue #643
      // Half B · Refinement 5). The legacy envelope-routed boot-request path is
      // preserved below under PRESERVED-FOR-MESSAGING-DIAMETER per Suite 1 Red
      // curation discipline.
      // Citation: SUITE-3-YELLOW-DIRECT-SPAWN-BLUEPRINT.md §2.1
      // Citation: SUITE-4-GREEN-DIRECT-SPAWN-AUDIT.md §1 (all 11 angles)
      case 'launch-scp-runtime': {
        // ALHOC M130 · single composition call · launch implementation lives in
        // launchScpRuntime helper (defined before keypressHandler · ~line 1388).
        // Same function consumed by 'scp-menu-activate' Wave 1 below.
        // D1a · THE ACTIVE-SCP LAW — [L] rides the same ONE activate flow as Enter (below).
        {
          const lHandle = getActiveScsBridgeMuxiumHandle();
          if (lHandle !== null) {
            const lDeck = lHandle.muxium.deck as unknown as {
              d: { scsBridge: { e: { scsBridgeActivateScpSession: (p: { scpName: string }) => unknown } } };
            };
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (lHandle.muxium as any).dispatch(
              lDeck.d.scsBridge.e.scsBridgeActivateScpSession({ scpName: action.scpName }),
            );
          } else {
            launchScpRuntime(action.scpName);
          }
        }
        return;
        // ─── PRESERVED-FOR-MESSAGING-DIAMETER ─────────────────────────
        // The boot-request envelope path belongs to the post-launch
        // Bridge↔SCP messaging Diameter. When the messaging layer is
        // implemented, this block will be the basis for that path
        // (chokidar consumer + MessageRouter). Do not delete — Suite 1
        // Red curation. Citation: SUITE-1-RED-SESSION-SPAWNING-CURATION.md
        //
        // void (async (): Promise<void> => {
        //   try {
        //     const { mkdir } = await import('node:fs/promises');
        //     const { priorityDir } = await import('../bridge/paths');
        //     await mkdir(priorityDir(TUI_SESSION_ID, 'heads'), { recursive: true });
        //     const env = createEnvelope({
        //       sessionId: TUI_SESSION_ID,
        //       priority: 'head',
        //       content: JSON.stringify({ scpName, requestedAt: Date.now() }),
        //       sender: 'router',
        //     });
        //     env.kind = 'boot-request';
        //     env.kindPayload = { scpName, requestedAt: Date.now() };
        //     await enqueueMessage(env);
        //     log('tui.launch.scp.enqueued', { scpName, envId: env.id });
        //   } catch (err) {
        //     pendingLaunchScps.delete(scpName);
        //     const message = err instanceof Error ? err.message : String(err);
        //     log('tui.launch.scp.error', { scpName, message });
        //   }
        // })();
      }
      // ═══════════════════════════════════════════════════════════════════════
      // MD-ARC+C · Wave 5a (MD-ARC-R3-BLUEPRINT §5) — Close / Archive / Reinstate
      // ═══════════════════════════════════════════════════════════════════════
      // §5.1 · [X] Close — stop a running SCP. Dispatches scsBridgeStopScp via the
      // active bridge Muxium handle (the same handle+deck pattern as scp-menu-activate).
      case 'scp-menu-stop': {
        const scpName = action.scpName;
        log('tui.menu.scp-stop.request', { scpName });
        const stopHandle = getActiveScsBridgeMuxiumHandle();
        if (stopHandle !== null) {
          const stopDeck = stopHandle.muxium.deck as unknown as {
            d: { scsBridge: { e: { scsBridgeStopScp: (p: { scpName: string }) => unknown } } };
          };
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (stopHandle.muxium as any).dispatch(
            stopDeck.d.scsBridge.e.scsBridgeStopScp({ scpName }),
          );
        } else {
          log('tui.menu.scp-stop.no-handle', { scpName });
        }
        return;
      }
      // §5.2 · [A] Archive-confirm — the modal slot was already set in newState by
      // applyKeypress (menuState = newState above); renderFrame paints the confirm
      // pane next tick. No side effect here.
      case 'scp-menu-archive-confirm':
        return;
      // §5.2 · [N]/Esc — clear the confirm slot.
      case 'scp-menu-archive-cancel':
        menuState = { ...menuState, scpArchiveConfirm: undefined };
        return;
      // §5.2 · [Y]/[F] — AWAIT archiveScpEntry DIRECTLY (the TUI hosts the bridge
      // in-process). The guard reasons surface inline on the confirm pane; success
      // re-reads the roster + the Archived fold (the open-scp-manage re-populate path).
      case 'scp-menu-archive-execute': {
        const scpName = action.scpName;
        const force = action.force === true;
        log('tui.menu.scp-archive.execute', { scpName, force });
        void (async () => {
          try {
            const result = await archiveScpEntry(scpName, force ? { force: true } : undefined);
            if (result.ok) {
              // Clear the confirm slot + re-read the roster and the fold.
              const reg = readScpRegistry();
              const archivedItems = await listArchivedScps();
              menuState = {
                ...menuState,
                scpArchiveConfirm: undefined,
                scpSubMenu: menuState.scpSubMenu
                  ? { ...menuState.scpSubMenu, items: reg.scps, archivedItems, selectedIdx: 0 }
                  : menuState.scpSubMenu,
              };
              log('tui.menu.scp-archive.ok', { scpName, archivedAt: result.archivedAt });
              return;
            }
            // Refusal — map the reason to an inline notice / the force re-render.
            let notice: string;
            let worktreeInstances: string[] | undefined;
            switch (result.reason) {
              case 'scp-must-be-stopped-before-archive':
                notice = 'Stop the SCP first ([X] close).';
                break;
              case 'worktrees-present':
                // WAPF H1 — re-render the confirm in its force form (list instances).
                notice = 'This SCP owns worktree instances.';
                worktreeInstances = result.instances ?? [];
                break;
              case 'worktree-instance-use-retire':
                notice =
                  'This SCP IS a worktree instance — retire it via Delete (the branch survives in its parent).';
                break;
              default:
                notice = result.reason;
                break;
            }
            menuState = {
              ...menuState,
              scpArchiveConfirm: menuState.scpArchiveConfirm
                ? { ...menuState.scpArchiveConfirm, notice, worktreeInstances }
                : { name: scpName, notice, worktreeInstances },
            };
            log('tui.menu.scp-archive.refused', { scpName, reason: result.reason });
          } catch (err) {
            log('tui.menu.scp-archive.error', { scpName, err: String(err) });
            menuState = {
              ...menuState,
              scpArchiveConfirm: menuState.scpArchiveConfirm
                ? { ...menuState.scpArchiveConfirm, notice: String(err) }
                : { name: scpName, notice: String(err) },
            };
          }
        })();
        return;
      }
      // §5.3 · [T] toggle-archived — the fold expand/collapse was already applied to
      // menuState.scpSubMenu in newState by applyKeypress; renderFrame repaints.
      case 'scp-menu-toggle-archived':
        return;
      // §5.3 · [R] Reinstate — AWAIT reinstateScpEntry DIRECTLY; ok → re-populate
      // roster + fold; refusal → inline notice (reuse the archive-confirm slot).
      case 'scp-menu-reinstate': {
        const scpName = action.scpName;
        log('tui.menu.scp-reinstate.execute', { scpName });
        void (async () => {
          try {
            const result = await reinstateScpEntry(scpName);
            if (result.ok) {
              const reg = readScpRegistry();
              const archivedItems = await listArchivedScps();
              menuState = {
                ...menuState,
                scpSubMenu: menuState.scpSubMenu
                  ? { ...menuState.scpSubMenu, items: reg.scps, archivedItems, selectedIdx: 0 }
                  : menuState.scpSubMenu,
              };
              log('tui.menu.scp-reinstate.ok', { scpName });
              return;
            }
            // Refusal — surface via the confirm-modal slot as an inline notice.
            menuState = {
              ...menuState,
              scpArchiveConfirm: { name: scpName, notice: `Reinstate refused: ${result.reason}` },
            };
            log('tui.menu.scp-reinstate.refused', { scpName, reason: result.reason });
          } catch (err) {
            log('tui.menu.scp-reinstate.error', { scpName, err: String(err) });
          }
        })();
        return;
      }
      // SB-Direct-Spawn · BSSPS · Engage via SCS-Bridge post-install.
      // Structural reuse of launch-scp-runtime direct-spawn path. Wizard
      // done-step [B] shortcut. Status feedback flows through the existing
      // M17 lifecycle subscription + scpLifecycleBadge ADSC chain.
      // Citation: SUITE-3-YELLOW-DIRECT-SPAWN-BLUEPRINT.md §2.2
      case 'engage-via-bridge': {
        const scpName = action.scpName;
        log('tui.bssps.start', { scpName, tuiSessionId: TUI_SESSION_ID });
        try {
          const registry = readScpRegistry();
          const entry = registry.scps.find((s) => s.name === scpName);
          if (!entry) {
            log('tui.bssps.error', {
              scpName,
              message: 'scpName not found in SCPs.json registry',
            });
            return;
          }
          // TOH-12 · BREAK 4: `== null` catches an ABSENT key as well as null.
          if (entry.boundBridgePort == null) {
            log('tui.bssps.error', {
              scpName,
              message: 'boundBridgePort is null in registry',
            });
            return;
          }
          // TOH-12 · BREAK 5 (SOV-1 at the boot gate · scps[]-scope only, twin of the
          // launch-path check — archived entries deliberately excluded).
          {
            const pair = [entry.boundBridgePort, entry.boundBridgePort + 1];
            const collided = registry.scps.find(
              (o) =>
                o.name !== scpName &&
                o.boundBridgePort != null &&
                [o.boundBridgePort, o.boundBridgePort + 1].some((p) => pair.includes(p)),
            );
            if (collided) {
              log('tui.bssps.error', {
                scpName,
                message: `port pair collision with registered SCP '${collided.name}' (${collided.boundBridgePort})`,
              });
              return;
            }
          }
          const scpPath = path.join(process.cwd(), entry.path);
          const port = entry.boundBridgePort;
          const bootRequestUlid = ulid();

          const bridgeHandle = getActiveScsBridgeMuxiumHandle();
          if (bridgeHandle === null) {
            log('tui.bssps.error', {
              scpName,
              message: 'scsBridge muxium handle unavailable',
            });
            return;
          }

          const dispatchDeck = bridgeHandle.muxium.deck.d as unknown as Deck<SCPDeck>;
          const requestAction = dispatchDeck.scp.d.scpSpawnManager.e.scpSpawnManagerSpawnRequested({
            scpName,
            scpPath,
            command: 'npm',
            args: ['run', 'bridge'],
            port,
            sessionId: TUI_SESSION_ID,
            bootRequestUlid,
            requestedAt: Date.now(),
          });
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (bridgeHandle.muxium as any).dispatch(requestAction);
          log('tui.bssps.dispatched', {
            scpName,
            scpPath,
            port,
            bootRequestUlid,
            tuiSessionId: TUI_SESSION_ID,
          });
          // INSTALL-FIX-007 · FIX 1 · SET-ACTIVE-ON-TUI-LAUNCH (engage-via-bridge
          // own copy). VERIFIED: engage-via-bridge dispatches the spawn DIRECTLY
          // (structural inline of launchScpRuntime's body · :2279-2290) and does NOT
          // call launchScpRuntime — so the shared FIX-1 block above does NOT cover
          // it. This is the boot-recommend [Launch] path · the Blank-Test-007 path.
          // Set the tracker + filter + trigger refresh so bridge.json.activeScp is
          // written immediately (mirrors MTAM block ~:886).
          _activeScpTracker = scpName;
          menuState = { ...menuState, activeScpFilter: scpName };
          try {
            const spawns =
              bridgeHandle.muxium?.deck?.d?.scp?.d?.scpSpawnManager?.k?.spawnsByScp?.select() ?? new Map();
            const refreshSpawns = new Map<string, { port: number; browserUrl: string }>();
            for (const [name, sEntry] of spawns) {
              refreshSpawns.set(name, { port: sEntry.port, browserUrl: sEntry.browserUrl });
            }
            refreshSpawns.set(scpName, { port, browserUrl: `http://localhost:${port}` });
            refreshBridgeMetadata(refreshSpawns, Array.from((latestLifecycleSnapshot ?? new Map()).keys()));
          } catch (refreshErr) {
            log('tui.bssps.active-refresh-failed', { scpName, err: String(refreshErr) });
          }
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          log('tui.bssps.error', { scpName, message });
        }
        return;
        // ─── PRESERVED-FOR-MESSAGING-DIAMETER ─────────────────────────
        // The legacy envelope-routed BSSPS path. See launch-scp-runtime
        // PRESERVED block above for full preservation rationale.
        // Citation: SUITE-1-RED-SESSION-SPAWNING-CURATION.md
        //
        // void (async (): Promise<void> => {
        //   try {
        //     const { mkdir } = await import('node:fs/promises');
        //     const { priorityDir } = await import('../bridge/paths');
        //     await mkdir(priorityDir(TUI_SESSION_ID, 'heads'), { recursive: true });
        //     const env = createEnvelope({
        //       sessionId: TUI_SESSION_ID,
        //       priority: 'head',
        //       content: JSON.stringify({ scpName, requestedAt: Date.now() }),
        //       sender: 'router',
        //     });
        //     env.kind = 'boot-request';
        //     env.kindPayload = { scpName, requestedAt: Date.now() };
        //     await enqueueMessage(env);
        //     log('tui.bssps.enqueued', { scpName, envId: env.id });
        //   } catch (err) {
        //     const message = err instanceof Error ? err.message : String(err);
        //     log('tui.bssps.error', { scpName, message });
        //   }
        // })();
      }
      // RM-D5: Esc/cancel cleared wizard — already mutated by applyKeypress newState.
      case 'install-scp-cancel':
        menuState = { ...menuState, scpWizard: undefined };
        log('install.scp.cancelled', { cwd: process.cwd() });
        return;
      // SCPGATE FBSN: Enter on the consent note — applyKeypress already advanced the
      // wizard to designation + flipped scpInstallAgentNoteShown. Persist the flag.
      case 'scp-note-consume-proceed':
        void markScpInstallNoteShown(process.cwd());
        log('install.scp.note.consumed', { cwd: process.cwd(), via: 'enter-proceed' });
        return;
      // SCPGATE FBSN: Esc on the consent note — applyKeypress already cleared the
      // wizard + flipped the flag. Persist (backup path remains via the menu row).
      case 'scp-note-dismiss':
        void markScpInstallNoteShown(process.cwd());
        log('install.scp.note.dismissed', { cwd: process.cwd(), via: 'esc-dismiss' });
        return;
      // RM-D5: keypress buffer update — applyKeypress already mutated inputBuffer.
      case 'install-scp-wizard-buffer-update':
        return;
      // Issue #643 Half B · Refinement 3+4 (SCBN): ←/→/Tab toggled the wizard
      // button pair — applyKeypress already mutated scpWizard.state.buttonSelection
      // in newState (menuState = newState above). renderFrame picks it up next
      // paint. Mirrors trust-confer-toggle / uninstall-confirm-toggle no-ops.
      case 'install-scp-wizard-button-toggle':
        return;
      // RM-D5: Enter submitted current step — advance wizard state via applyWizardInput.
      // When wizard reaches 'running' step, fire the install pipeline.
      case 'install-scp-wizard-submit': {
        if (!menuState.scpWizard) return;
        const nextState = applyWizardInput(
          menuState.scpWizard.state,
          menuState.scpWizard.inputBuffer,
        );
        menuState = {
          ...menuState,
          scpWizard: { state: nextState, inputBuffer: '' },
        };
        // Pipeline fires when wizard transitions to 'running'.
        // Issue #643 Half A · Wave 2: ASYNC install — set installRunning (drives
        // the Installing screen + pseudo-progress bar) + the wizard 'running'
        // step, THEN fire runInstallScpPipelineAsync fire-and-forget. The TUI
        // render loop keeps ticking (event loop free) so the bar animates. On
        // resolve we re-read the CURRENT menuState (closure var · NOT a captured
        // copy) to avoid clobbering concurrent mutations, set boot-recommend /
        // error, and clear installRunning.
        if (nextState.step === 'running' && nextState.derivation) {
          const designation = nextState.derivation.designation;
          const installUlid = ulid();
          menuState = {
            ...menuState,
            scpWizard: { state: { ...nextState, step: 'running' }, inputBuffer: '' },
            installRunning: {
              ulid: installUlid,
              kind: 'scp',
              designation,
              startedAt: Date.now(),
              // Issue #643 Refinement · seed the first phase so the step-aware
              // asymptotic bar starts in the `staging` range immediately.
              phase: 'staging',
              phaseStartedAt: Date.now(),
            },
          };
          log('install.scp.async.start', { designation, cwd: process.cwd() });
          void runInstallScpPipelineAsync(
            {
              projectRoot: process.cwd(),
              designation,
              runNpmInstall: true,
              buildDescriptor: true,
            },
            // Issue #643 Refinement · onPhase reports each install-phase boundary.
            // Update the LIVE menuState closure var (NOT a captured copy) so the
            // bar JUMPS to the new phase's range floor + resets its asymptotic
            // crawl. Preserves the #643 live-closure pattern.
            (phase) => {
              menuState = {
                ...menuState,
                installRunning: menuState.installRunning
                  ? { ...menuState.installRunning, phase, phaseStartedAt: Date.now() }
                  : menuState.installRunning,
              };
            },
          )
            .then((result) => {
              if (result.ok) {
                log('install.scp.completed', {
                  designation,
                  conceptName: result.conceptName,
                  port: result.port,
                });
                menuState = {
                  ...menuState,
                  // PIBR: boot-recommend card (renderScpWizardPane early-return).
                  // Issue #643 Half B · Refinement 3+4: seed affirm so [ Launch ]
                  // is the default-selected button.
                  scpWizard: {
                    state: { ...nextState, step: 'boot-recommend', buttonSelection: 'affirm' },
                    inputBuffer: '',
                  },
                  // SCP-3 · CSPMSR install-completion flip · row label refresh.
                  anyScpsInstalled: true,
                  installRunning: undefined,
                };
              } else {
                log('install.scp.failed', { designation, reason: result.reason });
                menuState = {
                  ...menuState,
                  scpWizard: {
                    state: { ...nextState, step: 'error', validationError: result.reason ?? '' },
                    inputBuffer: '',
                  },
                  installRunning: undefined,
                };
              }
            })
            .catch((err) => {
              log('install.scp.exception', { designation, error: String(err) });
              menuState = {
                ...menuState,
                scpWizard: {
                  state: { ...nextState, step: 'error', validationError: String(err) },
                  inputBuffer: '',
                },
                installRunning: undefined,
              };
            });
        }
        return;
      }
      default:
        return;
    }
  };

  const resizeHandler = (): void => {
    menuState = {
      ...menuState,
      termWidth: process.stdout.columns ?? 100,
      termHeight: computeBottomRows(process.stdout.rows ?? 30),
    };
  };

  // Registry watcher refreshes session list (fire-and-forget on each tick)
  createFileWatcher('animatedTui.registry', registryPath(), { interval: 500 }, async () => {
    if (exited) return;
    try {
      const newSessions = await listSessions();
      // Diamond I mid-cycle fix: session swap + selectedUlid reconciliation
      // via preserveCursorAcrossUpdate (Watchfile-Handler Parity Invariant);
      // clampCurrentPage applies on next render.
      const prevUlid = menuState.selectedUlid;
      menuState = {
        ...menuState,
        sessions: newSessions,
        selectedUlid: preserveCursorAcrossUpdate(menuState.selectedUlid, newSessions),
      };
      if (prevUlid !== menuState.selectedUlid) {
        log('cursor.reconcile', {
          before: prevUlid,
          after: menuState.selectedUlid,
          reason: prevUlid === menuState.selectedUlid ? 'sync' : 'session-removed',
        });
      }
      // Diamond B-17 (CD-49 ACOFSAT · Animation-Cessation-On-First-Spawn-Alive-Trigger):
      // when an install animation is active and the corresponding session's
      // claudeSessionId surfaces in the registry (SessionStart hook fired),
      // advance phase to 'ready' for ~250ms settle beat then clear animation.
      if (
        menuState.installAnimating !== undefined &&
        menuState.installAnimating.phase === 'awaiting-alive'
      ) {
        const animUlid = menuState.installAnimating.ulid;
        const aliveEntry = newSessions.find(
          (s) => s.id === animUlid && s.claudeSessionId !== undefined,
        );
        if (aliveEntry !== undefined) {
          log('install.animation.alive-detected', {
            ulid: animUlid,
            claudeSessionId: aliveEntry.claudeSessionId,
            elapsedMs: Date.now() - menuState.installAnimating.startedAt,
          });
          // INSTALL-FIX-007 · FIX 2 · cascadesPresent LIVE-REFRESH. cascadesPresent
          // is probed ONCE at boot (false for a blank dir); after Path A
          // (runInstallMuxifiedPath) scaffolds Cascades/, the flag was never
          // updated → the SCPGATE gate (menu.ts ~:1620 · requires
          // cascadesPresent===true && installationComplete!==false) kept the
          // ⊕ Install SCP row withheld for the rest of the session. The
          // alive-detected handler is the canonical Path-A-complete site (the
          // install agent's claudeSessionId has surfaced · scaffold is on disk).
          // Flip both gate fields here so the Install-SCP affordance appears
          // WITHOUT a bridge restart.
          menuState = {
            ...menuState,
            cascadesPresent: true,
            installationComplete: true,
            installAnimating: {
              ...menuState.installAnimating,
              phase: 'ready',
            },
          };
          // 250ms ✓ Ready settle beat (Pewter D9 effect_dust analog) before menu return
          setTimeout(() => {
            if (
              menuState.installAnimating !== undefined &&
              menuState.installAnimating.ulid === animUlid &&
              menuState.installAnimating.phase === 'ready'
            ) {
              log('install.animation.cleared', { ulid: animUlid });
              menuState = { ...menuState, installAnimating: undefined };
            }
          }, 250);
        }
      }
    } catch {
      // ignore
    }
  });

  emitKeypressEvents(process.stdin);
  if (process.stdin.isTTY) {
    try {
      process.stdin.setRawMode(true);
    } catch {
      // ignore
    }
  }
  process.stdin.resume();
  process.stdin.on('keypress', keypressHandler);
  process.stdout.on('resize', resizeHandler);
  process.on('SIGINT', cleanExit);
  process.on('SIGTERM', cleanExit);
  process.on('SIGHUP', cleanExit);

  feed.subscribe(() => {
    // snapshot updates picked up by next frame; nothing to do here
  });

  frameInterval = setInterval(renderFrame, FRAME_INTERVAL_MS);

  // Diamond 3H Bug A Recurse: liveness tick entirely removed (orphan detection,
  // PID-probe sweep, blank-session sweep). State transitions are now hook-exclusive:
  // boot-reset (above) writes ALL sessions to OFFLINE on startup; session-end-hook
  // writes individual sessions to OFFLINE on user-driven termination; Manager-spawn
  // + SessionStart hook writes LAUNCHED. No timer or probe drives OFFLINE.

  return new Promise<void>(() => {
    /* never resolves; cleanExit calls exit(0) */
  });
}
