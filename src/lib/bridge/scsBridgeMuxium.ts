/**
 * SCS-Bridge Muxium Factory · Cycle 139 · CPPP Wiring
 *               · Cycle 146 doc-drift correction (Green C1)
 *
 * Process-level Stratimux Muxium instance owned by the SCS-Bridge CLI process.
 * Lifetime is bound to startAnimatedTui: opens via openScsBridgeMuxiumOnTuiStart
 * (between detectTerminalCaps and first await listSessions) · closes via
 * closeScsBridgeMuxiumOnTuiExit (inside cleanExit BEFORE feed.dispose).
 *
 * Cycle 139 R2 Huirth muxification topology (CURRENT REALITY):
 *
 *   The Tier-1 muxification roster contains THREE peers:
 *     - server              (HTTP server · port flows from options.port ?? 7111)
 *     - scp                 (container for SCP sub-concepts · MCP protocol)
 *     - scsBridge           (cross-SCP state · connectedScps · logBuffers · tools)
 *
 *   Under `scp` (Tier-2 muxification per scp.concept.ts:113-120):
 *     - scpLifecycle        (FSM transitions for spawned SCPs)
 *     - scpRegistryWatcher  (chokidar watch on Cascades/scps/)
 *     - scpMessageRouter    (bridge.json + sessions/heads/ watchers)
 *     - scpSpawnManager     (ChildProcess Map · spawn/exit/error)
 *     - scpBootOverlay      (TUI boot overlay state)
 *
 *   Access paths:
 *     - Tier-1: `deck.d.scsBridge.*` · `deck.d.scp.*` · `deck.d.server.*`
 *     - Tier-2 (under scp): `deck.d.scp.d.scpBootOverlay.{k,e}.*`
 *                           `deck.d.scp.d.scpSpawnManager.{k,e}.*`
 *                           etc.
 *
 *   The prior doc comment described a flat Tier-1 promotion ("All siblings
 *   are promoted to Tier-1 peers") which was aspirational and never realized
 *   in the factory. Cycle 146 Green Audit §Angle 3 + §CONCERN C1 surfaced
 *   this drift; the comment is corrected to reflect actual topology.
 *
 * Citation: SUITE-3-YELLOW-CYCLE-139-CPPP-WIRING-BLUEPRINT.md §3 + §5 Step 5
 * Citation: SUITE-4-GREEN-DIAMOND-146-BOOT-OVERLAY-AUDIT.md §C1 (doc drift)
 * Citation: SUITE-7-FUCHSIA-DIAMOND-146-BOOT-OVERLAY-CLINICAL.md §Fix A
 */
import { muxification } from 'stratimux';
import { readFile } from 'node:fs/promises';
import { startNpmVersionWatch } from './npmVersionCheck';
// MD-UM · LEG 3 · the reflexive Update Manifest watch — non-blocking · failure-silent · rides
// bridge.json via the composer leg (the startNpmVersionWatch cadence precedent).
import { startUpdateManifestWatch } from './updateManifest.model';
import { resolveScpInstallDirs } from './bridgeMetadata';
import { resolve } from 'node:path';
import { createServerConcept, serverName, type ServerDeck } from './concepts/server/server.concept';
import { createSCPConcept, type SCPDeck } from './concepts/scp/scp.concept';
import { scpName } from './concepts/scp/scp.types';
import { createScsBridgeConcept, type ScsBridgeDeck } from './concepts/scsBridge/scsBridge.concept';
import { scsBridgeName } from './concepts/scsBridge/scsBridge.types';
import {
  createScpLifecycleConcept,
  type ScpLifecycleDeck,
} from './concepts/scpLifecycle/scpLifecycle.concept';
import { scpLifecycleName } from './concepts/scpLifecycle/scpLifecycle.type';
import {
  createScpRegistryWatcherConcept,
  type ScpRegistryWatcherDeck,
} from './concepts/scpRegistryWatcher/scpRegistryWatcher.concept';
import { scpRegistryWatcherName } from './concepts/scpRegistryWatcher/scpRegistryWatcher.type';
import {
  createScpMessageRouterConcept,
  type ScpMessageRouterDeck,
} from './concepts/scpMessageRouter/scpMessageRouter.concept';
import { scpMessageRouterName } from './concepts/scpMessageRouter/scpMessageRouter.type';
import {
  createScpSpawnManagerConcept,
  type ScpSpawnManagerDeck,
} from './concepts/scpSpawnManager/scpSpawnManager.concept';
import { scpSpawnManagerName } from './concepts/scpSpawnManager/scpSpawnManager.type';
import {
  createScpBootOverlayConcept,
  type ScpBootOverlayDeck,
} from './concepts/scpBootOverlay/scpBootOverlay.concept';
import { scpBootOverlayName } from './concepts/scpBootOverlay/scpBootOverlay.type';
import { createGitmConcept, type GitmDeck } from './concepts/gitm/gitm.concept';
import { gitmName } from './concepts/gitm/gitm.types';
import { ensureNestedGitStructure } from './gitmNestedMaintain';
import {
  writeBridgeMetadata,
  bridgeMetadataPathPerProject,
  type BridgeMetadataState,
} from './bridgeMetadata';
import { getBridgeVersion } from './bridgeVersion';
import { resolveInstallState } from './installConstants';
import { generateBaseSystemPrompt } from './baseSystemPrompt/baseSystemPrompt';
import { log } from './debugLog';

// ============================================
// FACTORY OPTIONS
// ============================================

export type CreateScsBridgeMuxiumOptions = {
  userCwd: string;
  port?: number;
};

// ============================================
// MUXIUM DECK TYPE
// ============================================

export type ScsBridgeMuxiumDeck = ServerDeck &
  SCPDeck &
  ScsBridgeDeck &
  ScpLifecycleDeck &
  ScpRegistryWatcherDeck &
  ScpMessageRouterDeck &
  ScpSpawnManagerDeck &
  ScpBootOverlayDeck &
  GitmDeck;

// ============================================
// HANDLE TYPE
// ============================================

export type ScsBridgeMuxiumHandle = {
  muxium: ReturnType<typeof muxification<ScsBridgeMuxiumDeck>>;
  startedAt: number;
  stop: () => void;
};

// ============================================
// FACTORY
// ============================================

export function createScsBridgeMuxium(
  options: CreateScsBridgeMuxiumOptions,
): ScsBridgeMuxiumHandle {
  const startedAt = Date.now();
  log('bridge.muxium.start', { userCwd: options.userCwd, pid: process.pid });
  log('bridge.muxium.creating', { userCwd: options.userCwd, pid: process.pid });

  // GITM SCP-SOVEREIGN · boot maintain — ensure the SCP RED repos + the gitignore boundary
  // BEFORE createGitmConcept. Idempotent + FRESH-INSTALL-ONLY (Decision A): a Base-tracked
  // Cascades/ (dev repo) returns skipped and is left untouched. Non-fatal. The Cascade BLUE
  // repo init is DROPPED (no-embed safety · W2); the SCP (RED) watcher arms UNCONDITIONALLY
  // now (no nestedStructurePresent gate — it stays dormant until activeScpDir is set).
  try {
    const nested = ensureNestedGitStructure(options.userCwd);
    log('bridge.muxium.gitm-nested-maintain', {
      skipped: nested.skipped,
      reason: nested.reason,
      scpReposInit: nested.scpReposInit.length,
    });
  } catch (err) {
    console.error('[SCS Bridge Muxium] GITM SCP-SOVEREIGN nested-git maintain failed (non-fatal):', err);
  }

  const muxium = muxification<ScsBridgeMuxiumDeck>(
    'SCS Bridge Muxium',
    {
      [serverName]: createServerConcept(false, options.port ?? 7111),
      [scpName]: createSCPConcept({ userCwd: options.userCwd }),
      [scsBridgeName]: createScsBridgeConcept({ userCwd: options.userCwd }),
      [gitmName]: createGitmConcept({ userCwd: options.userCwd }),
    },
    {
      logging: false,
      storeDialog: false,
    },
  );
  log('bridge.muxium.created', { userCwd: options.userCwd });

  // Phase B.1: Arm chokidar watcher (scpRegistryWatcher) + Startup-Rescan.
  setTimeout(() => {
    try {
      muxium.dispatch(muxium.deck.d.scp.d.scpRegistryWatcher.e.scpRegistryDirectoryWatcherArm({}));
      muxium.dispatch(muxium.deck.d.scp.d.scpRegistryWatcher.e.scpRegistryStartupRescan({}));
      log('bridge.muxium.phase-b1-dispatched', {});
    } catch (err) {
      console.error('[SCS Bridge Muxium] Phase B.1 startup dispatch failed:', err);
      log('bridge.muxium.phase-b1-error', { error: String(err) });
    }

    // Phase B.2: Arm scpMessageRouter watchers (bridge.json + sessions/heads/).
    try {
      muxium.dispatch(
        muxium.deck.d.scp.d.scpMessageRouter.e.scpMessageRouterWatcherArm({ watcherKind: 'bridgeJson' }),
      );
      muxium.dispatch(
        muxium.deck.d.scp.d.scpMessageRouter.e.scpMessageRouterWatcherArm({ watcherKind: 'sessionsDir' }),
      );
      muxium.dispatch(
        muxium.deck.d.scp.d.scpMessageRouter.e.scpMessageRouterWatcherArm({
          watcherKind: 'bridgeSessionsDir',
        }),
      );
      // F2 · SCP-WINDOW-CLOSURE-CONSUME · arm the registry-file (sessions.json) watcher.
      // Feeds Stage 4 of scpMessageRouter.principle.ts, which consumes the scpWindowClosures
      // array the electron-side F1 recordScpWindowClosure writer appends in the no-handle
      // close mode → dispatches scpLifecycleWindowClosed (surface live → pending).
      muxium.dispatch(
        muxium.deck.d.scp.d.scpMessageRouter.e.scpMessageRouterWatcherArm({
          watcherKind: 'sessionsJson',
        }),
      );
      // PSSM · W0/W5 · arm the SCPs.json status watcher (parent-dir hardened). Its standalone
      // status-consume plan derives the TUI row from the persisted status: 'pending' →
      // scpLifecycleWindowClosed (surface → pending). W4's boot sweep ran BEFORE this arm.
      muxium.dispatch(
        muxium.deck.d.scp.d.scpMessageRouter.e.scpMessageRouterWatcherArm({
          watcherKind: 'scpsJson',
        }),
      );
      log('bridge.muxium.phase-b2-dispatched', {});
    } catch (err) {
      console.error('[SCS Bridge Muxium] Phase B.2 startup dispatch failed:', err);
      log('bridge.muxium.phase-b2-error', { error: String(err) });
    }

    // Phase B.3: Arm gitm chokidar watcher (WATCHDIAL). gitm is a Tier-1 peer
    // (muxium.deck.d.gitm.*). The gitmWatchdialPrinciple fires the boot-time
    // initial STARC read via nextA in its body; the watcher must be armed first
    // so the plan can bind handlers for ongoing file-system events.
    try {
      muxium.dispatch(muxium.deck.d.gitm.e.gitmWatcherArm({ watcherKind: 'gitDir' }));
      // GITM SCP-SOVEREIGN — the Base (projectRoot) + Cascade (BLUE) watcher arms are PRUNED
      // (the three-location model collapsed to the SCP turning over ONLY itself). The SCP (RED)
      // watcher is now the SOLE location watcher — armed UNCONDITIONALLY (no nestedStructurePresent
      // gate). It stays dormant until gitmSetActiveScpDir lands a non-empty activeScpDir at the SCP
      // bind seam (path-aware re-arm on switch · gitmScpWatcherArm).
      muxium.dispatch(muxium.deck.d.gitm.e.gitmScpWatcherArm({}));
      log('bridge.muxium.phase-b3-dispatched', {});
    } catch (err) {
      console.error('[SCS Bridge Muxium] Phase B.3 startup dispatch failed:', err);
      log('bridge.muxium.phase-b3-error', { error: String(err) });
    }

    // RSWR · Reactive-State-Write-Reciprocal
    // ─────────────────────────────────────────────────────────────────────
    // Server binds via server.principle.ts setTimeout listen. Once server.port
    // becomes available, write per-project bridge.json. Selector flips from
    // scpDockHost.dockServerPort → server.port (Cycle 139 CPPP).
    //
    // Citation: SUITE-3-YELLOW-CYCLE-139-CPPP-WIRING-BLUEPRINT.md §4
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const planAny = (muxium as any).plan as (
      name: string,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      builder: (helpers: { stage: any; conclude: any; d__: any; k__: any }) => unknown[],
    ) => unknown;

    const publishedForPort = new Set<number>();

    try {
      planAny(
        'Bridge Metadata Reactive Write',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ({ stage, conclude, d__ }: { stage: any; conclude: any; d__: any }) => [
          stage(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (args: { d: any }) => {
              log('bridge.metadata.plan-stage-fired', {});
              const { d } = args;
              const serverPort: number = d.server.k.port.select() ?? 0;
              if (serverPort === 0) {
                log('bridge.metadata.plan-stage-skip-zero', {});
                return;
              }
              if (publishedForPort.has(serverPort)) {
                log('bridge.metadata.plan-stage-skip-already-published', { port: serverPort });
                return;
              }
              publishedForPort.add(serverPort);

              log('bridge.metadata.plan-stage-write-begin', { port: serverPort });

              const bridgeVersion = getBridgeVersion();
              const userCwd = options.userCwd;
              const perProjectPath = bridgeMetadataPathPerProject(userCwd);

              log('bridge.metadata.mkdir-attempt', { path: perProjectPath });
              log('bridge.metadata.write-attempt', { path: perProjectPath, port: serverPort });

              readInstalledScps(userCwd)
                .then(async (installedScps) => {
                  let installState: string | undefined;
                  try {
                    const cascadeJsonPath = resolve(userCwd, 'Cascades', 'Cascade.json');
                    const raw = await readFile(cascadeJsonPath, 'utf-8');
                    const cascade = JSON.parse(raw) as { installState?: unknown };
                    installState = resolveInstallState(cascade?.installState);
                    log('bridge.metadata.cascade-read', { installState });
                  } catch (err) {
                    log('bridge.metadata.cascade-read-failed', { error: String(err) });
                  }
                  const state: BridgeMetadataState = {
                    bridgeVersion,
                    port: serverPort,
                    userCwd,
                    spawnsByScp: new Map(),
                    installedScps,
                    installState,
                    // W6a · THE LIFECYCLE PROJECTION (SCM W6) · HONEST DEFAULT. At port-bind time no
                    // SCP has entered the lifecycle FSM yet, so this boot-time writer projects the
                    // empty map. The TUI M17 caller supplies the live projection on every subsequent
                    // refresh once lifecycleByScp populates (booting → live).
                    scpLifecycle: {},
                    // C653 · THE STATUS PROJECTION (MEND B) · HONEST DEFAULT. At port-bind no MULTIPLY
                    // instance is mid-install, so this boot-time writer projects the empty map. The TUI
                    // M17 caller supplies the live per-SCP PSSM status projection on every subsequent
                    // refresh (an 'installing' instance surfaces there, flipping to 'pending' on install).
                    scpStatuses: {},
                  };
                  await writeBridgeMetadata(state, perProjectPath);
                  // D-UP7 · THE UPDATE INDICATOR — start the npm registry version watch
                  // (deferred boot check + 6h cadence · non-blocking · failure-silent).
                  // Results ride bridge.json via the composer leg on every rewrite AND an
                  // immediate RMW on check completion → the SCP chokidar relay → the UI.
                  startNpmVersionWatch(bridgeVersion, perProjectPath, () =>
                    Object.values(resolveScpInstallDirs(options.userCwd)).map((dir) =>
                      resolve(dir, 'Cascades', 'Bridge', 'bridge.json'),
                    ),
                  );
                  // MD-UM · LEG 3 · THE REFLEXIVE FETCH — start the Update Manifest watch (deferred
                  // boot refresh + periodic re-poll · non-blocking · failure-silent). The cached
                  // manifest rides bridge.json via the composer leg on every subsequent rewrite → the
                  // SCP /scs-bridge-version relay → the differential mount. The env designation
                  // (SCS_INSTALL_REPO_URL) selects the local fs read (file://) anor the raw fetch.
                  startUpdateManifestWatch();
                  // RM-D2 · BDAP SSGH generation. Immediately after bridge.json is
                  // written (port known), generate the live Base SCS-Bridge system
                  // prompt sibling to bridge.json. This precedes any open-session
                  // (TOCTOU closed — Phase B completes before any IPC handler fires).
                  // The pong-receipt path does NOT change the port, so generation
                  // here (the sole writeBridgeMetadata site) is sufficient (R6 NOTE-3).
                  try {
                    // Endpoint derived identically to writeBridgeMetadata
                    // (bridgeMetadata.ts:112 — `http://127.0.0.1:${state.port}`),
                    // so the generated prompt's endpoint is byte-identical to bridge.json.
                    const endpoint = `http://127.0.0.1:${state.port}`;
                    const generatedPath = generateBaseSystemPrompt(
                      endpoint,
                      state.port,
                    );
                    log('bridge.basePrompt.generated', { path: generatedPath, port: serverPort });
                  } catch (err) {
                    // Graceful: generation failure leaves no generated file → cli-handler
                    // omits the append clause → sessions spawn without BDAP (never breaks spawn).
                    log('bridge.basePrompt.generate-error', { error: String(err) });
                  }
                })
                .then(() => {
                  log('bridge.metadata.write-success', {
                    port: serverPort,
                    path: perProjectPath,
                  });
                  log('bridge.metadata.published', {
                    port: serverPort,
                    userCwd,
                    path: perProjectPath,
                  });
                  log('bridge.metadata.plan-stage-write-complete', {
                    port: serverPort,
                    path: perProjectPath,
                  });
                })
                .catch((err: unknown) => {
                  log('bridge.metadata.write-error', { error: String(err) });
                  log('bridge.metadata.failed', { error: String(err) });
                });
            },
            {
              selectors: [d__.server.k.port],
              beat: 1,
            },
          ),
          conclude(),
        ],
      );
      log('bridge.metadata.plan-registered', {});
    } catch (err) {
      log('bridge.metadata.plan.error', { error: String(err) });
    }

    log('bridge.muxium.startup-complete', { userCwd: options.userCwd });
  }, 50);
  const stop = (): void => {
    // Phase B.2 teardown: Disarm scpMessageRouter watchers (reverse-startup-order).
    try {
      // PSSM · W0/W5 · disarm the SCPs.json status watcher first (reverse of the scpsJson arm).
      muxium.dispatch(
        muxium.deck.d.scp.d.scpMessageRouter.e.scpMessageRouterWatcherDisarm({
          watcherKind: 'scpsJson',
        }),
      );
      // F2 · disarm the registry-file watcher (reverse of the sessionsJson arm).
      muxium.dispatch(
        muxium.deck.d.scp.d.scpMessageRouter.e.scpMessageRouterWatcherDisarm({
          watcherKind: 'sessionsJson',
        }),
      );
      muxium.dispatch(
        muxium.deck.d.scp.d.scpMessageRouter.e.scpMessageRouterWatcherDisarm({
          watcherKind: 'bridgeSessionsDir',
        }),
      );
      muxium.dispatch(
        muxium.deck.d.scp.d.scpMessageRouter.e.scpMessageRouterWatcherDisarm({
          watcherKind: 'sessionsDir',
        }),
      );
      muxium.dispatch(
        muxium.deck.d.scp.d.scpMessageRouter.e.scpMessageRouterWatcherDisarm({
          watcherKind: 'bridgeJson',
        }),
      );
    } catch {
      // teardown best-effort
    }
    // Phase B.1 teardown: Disarm scpRegistryWatcher BEFORE muxium.close.
    try {
      muxium.dispatch(muxium.deck.d.scp.d.scpRegistryWatcher.e.scpRegistryDirectoryWatcherDisarm({}));
    } catch {
      // teardown best-effort
    }
    try {
      muxium.close(false);
    } catch {
      // teardown is best-effort · ignore close failures
    }
    log('bridge.muxium.teardown', { userCwd: options.userCwd });
  };

  return { muxium, startedAt, stop };
}

// ============================================
// MODULE-LEVEL SINGLETON ACCESSOR (CLI-process scope)
// ============================================

let activeBridgeHandle: ScsBridgeMuxiumHandle | null = null;

export function bootBridgeDaemon(
  options: CreateScsBridgeMuxiumOptions,
): ScsBridgeMuxiumHandle {
  if (activeBridgeHandle !== null) {
    return activeBridgeHandle;
  }
  activeBridgeHandle = createScsBridgeMuxium(options);
  return activeBridgeHandle;
}

export function closeBridgeDaemon(): void {
  if (activeBridgeHandle === null) {
    return;
  }
  try {
    activeBridgeHandle.stop();
  } finally {
    activeBridgeHandle = null;
  }
}

export const openScsBridgeMuxiumOnTuiStart = bootBridgeDaemon;
export const closeScsBridgeMuxiumOnTuiExit = closeBridgeDaemon;

export function _getActiveScsBridgeMuxiumHandleForTesting(): ScsBridgeMuxiumHandle | null {
  return activeBridgeHandle;
}

export function getActiveScsBridgeMuxiumHandle(): ScsBridgeMuxiumHandle | null {
  return activeBridgeHandle;
}

async function readInstalledScps(userCwd: string): Promise<string[]> {
  try {
    const scpsPath = resolve(userCwd, 'Cascades', 'SCPs.json');
    const raw = await readFile(scpsPath, 'utf8');
    const parsed = JSON.parse(raw) as { scps?: Array<{ name?: string }> };
    if (!parsed || !Array.isArray(parsed.scps)) return [];
    return parsed.scps
      .map((entry) => (typeof entry?.name === 'string' ? entry.name : ''))
      .filter((name): name is string => name.length > 0);
  } catch {
    return [];
  }
}
