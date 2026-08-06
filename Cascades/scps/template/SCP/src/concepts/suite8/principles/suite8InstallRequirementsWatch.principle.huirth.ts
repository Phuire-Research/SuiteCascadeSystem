/**
 * suite8InstallRequirementsWatch.principle.huirth.ts — the N-designation Install.Requirements.json
 * dir-watch (EF-5 · THE INSTALL CIRCUIT · RD-C class · WPS)
 *
 * The install-requirements sibling of suite8MenuWatch — the COPY class (no Twin Stand-Down guard;
 * each designation self-scopes to its OWN gate file). The Template needs ONE Install.Requirements.json
 * dir-watch arm PER registered Suite 8 designation (WPS · Watcher-Per-Suite-8). Each designation's
 * Requirements Mapper (EF-5a) writes its gate file at Cascades/8_SUITES/<designation>/Install.Requirements.json;
 * this principle arms ONE FSWatcher per designation, held in a Map<designation, FSWatcher> for teardown
 * (the no-leak invariant).
 *
 * ROOT DIVERGENCE from suite8MenuWatch (documented): the menu lane watches Cascades/Extended/<name>/menu.json
 * and threads the SL-3 Sync Library re-arm sub-lane (a menu.json can be PINNED to a target SCP). The install
 * gate file is ALWAYS SCP-LOCAL (scpS8InstallCircuit.model.ts installRequirementsRelPath is unconditional
 * Cascades/8_SUITES/<designation>/), so this principle:
 *   (1) roots the boot-sweep + live addDir at Cascades/8_SUITES/ (not Cascades/Extended/), and
 *   (2) OMITS the SL-3 libraryWatcherMap / lastSpecifiedByDesignation re-arm sub-lane entirely (there is
 *       no locality pin to react to). Every OTHER structural element mirrors suite8MenuWatch verbatim.
 *
 * Designation source: KNOWN_SUITE8_ENTRIES (the MPRF seed) UNION the FILE SYSTEM (the dirs actually present
 * under Cascades/8_SUITES/). A dir with no gate file arms a watcher that hydrates the moment one lands; a
 * dir forged AFTER boot arms via the depth-0 addDir live watch (the extendedCascadeAutoRegistration idiom).
 *
 * Each watcher's helper (createStcpComponentRelay<InstallRequirementsPayload>(createSuite8InstallRequirementsRelayConfig(name)))
 * owns add/change→SBIS Base→Relay + unlink→JDIS Idle internally; the SBIS dispatch carries the designation
 * key (the keyed Base suite8SetInstallRequirementsHuirthBase FIRST, then the keyed relay suite8SetInstallRequirements).
 * Dispatch is via `nextA` (async-safe action-queue append). EMPTY IS A STATE — unlink dispatches the Idle
 * sentinel { present:false, requirements:null } (the JDIS path), the SAME payload the Suite8 Control reads as
 * "clear the station" (the honest not-present verdict).
 *
 * FT-006 CONCLUDING STAGE PATTERN (MANDATORY · stratimux 0.3.295): the bootstrap plan's iterateStage MUST
 * land on a concluding stage. The arm loop runs in Stage 1; the iterate lands on the concluding Stage 2;
 * the chokidar watchers + nextA pipes persist in the closure.
 *
 * Citation: suite8MenuWatch.principle.huirth.ts (the copy-class dir-watch precedent · verbatim structure).
 * Citation: scpS8InstallCircuit.model.ts EF-5 (the install circuit · the gate file convention).
 * Citation: PRE-EPOCH-S4-GREEN-EXAM.md SEAM 4 (Map<string,FSWatcher> teardown · FT-006).
 * Citation: suite8Registration.model.ts KNOWN_SUITE8_ENTRIES (the boot designation seed).
 */
import type { PrincipleFunction, MuxiumDeck, Concept, AnyAction } from 'stratimux';
import { watch as chokidarWatch, type FSWatcher } from 'chokidar';
import path from 'node:path';
import { appendFileSync, mkdirSync, readdirSync, statSync } from 'node:fs';
import type {
  Suite8HuirthState,
  Suite8HuirthQualities,
  InstallRequirementsPayload,
} from '../suite8.type';
import type {
  WebSocketServerState,
  WebSocketServerQualities,
} from '../../webSocketServer/webSocketServer.concept';
import type { StcpComponentRelayConfig } from '../../../model/stcpComponentRelay.model';
import { createStcpComponentRelay } from '../../../model/stcpComponentRelay.model';
import {
  INSTALL_REQUIREMENTS_FILE_NAME,
  installRequirementsRelPath,
  type InstallRequirementsShape,
} from '../../../model/scpS8InstallCircuit.model';
import { suite8SetInstallRequirements } from '../qualities/suite8SetInstallRequirements.quality.client';
import { suite8SetInstallRequirementsHuirthBase } from '../qualities/suite8SetInstallRequirementsHuirthBase.quality.huirth';
import { KNOWN_SUITE8_ENTRIES } from '../model/suite8Registration.model';

export type Suite8InstallRequirementsWatchDeck = MuxiumDeck & {
  suite8: Concept<Suite8HuirthState, Suite8HuirthQualities>;
  webSocketServer: Concept<WebSocketServerState, WebSocketServerQualities>;
};

export type Suite8InstallRequirementsWatchPrincipleType = PrincipleFunction<
  Suite8HuirthQualities,
  Suite8InstallRequirementsWatchDeck,
  Suite8HuirthState
>;

// The 8_SUITES root — the install gate file's home is unconditionally SCP-LOCAL (the model's
// installRequirementsRelPath). Resolve against process.cwd() = the SCP package dir (the SCS_ROOT
// discipline mirrored from suite8MenuRelay.config.ts SCS_ROOT).
const SUITE8_ROOT_ABS = path.resolve(process.cwd(), 'Cascades', '8_SUITES');
// Light debounce (ms) so a burst of Forge writes into 8_SUITES/ (mkdir then seed) settles into one
// arm sweep rather than re-firing per intermediate event (mirrors MENU_ADDDIR_DEBOUNCE_MS).
const INSTALL_ADDDIR_DEBOUNCE_MS = 250;

// FILE-SUNK TELEMETRY — the console.logs pipe into nodemon and are LOST to any drive; every seat ALSO
// appends a JSONL line to the SCP-local Bridge rail so a drive can Conclude (grep) whether the principle
// booted, armed, swept, and hydrated. Never-throw + the 2MB skip-guard (the suite8MenuWatch idiom).
const INSTALL_WATCH_SINK_MAX_BYTES = 2 * 1024 * 1024;
const INSTALL_WATCH_SINK_PATH = path.resolve(
  process.cwd(),
  'Cascades',
  'Bridge',
  'suite8-install-requirements-watch.json',
);
const sinkInstallWatchTelemetry = (seat: string, detail: Record<string, unknown> = {}): void => {
  try {
    mkdirSync(path.dirname(INSTALL_WATCH_SINK_PATH), { recursive: true });
    try {
      if (statSync(INSTALL_WATCH_SINK_PATH).size > INSTALL_WATCH_SINK_MAX_BYTES) {
        return; // sink over the 2MB cap · skip{sink-cap} · never rotate here, never throw.
      }
    } catch {
      /* sink absent · the first append creates it */
    }
    appendFileSync(
      INSTALL_WATCH_SINK_PATH,
      JSON.stringify({ ts: new Date().toISOString(), seat, ...detail }) + '\n',
      'utf8',
    );
  } catch {
    /* telemetry must never harm the watcher · skip */
  }
};

// ============================================================
// EF-5 · THE INSTALL REQUIREMENTS RELAY CONFIG FACTORY (per-designation · WPS)
// ============================================================
// The install-requirements sibling of createSuite8DesignationRelayConfig. Exported HERE (not a separate
// .config.ts) so BOTH this watch principle AND suite8InstallRequirementsStcpRelay import ONE factory —
// the documented divergence from the menu lane's shared suite8MenuRelay.config.ts (the mint copy surface
// touches only the two named principle files). For a designation Name, resolves THAT designation's gate
// file under the SCP-LOCAL convention (Cascades/8_SUITES/<name>/Install.Requirements.json) + binds the
// KEYED action creators so the SBIS dispatch carries the designation key (Base FIRST → keyed Base · then
// keyed relay). The wrapper { present, requirements } IS the TPayload: parse → present:true, unlink → the
// emptyPayload Idle { present:false, requirements:null }.

// SCP-LOCAL gate-file absolute path for a designation (installRequirementsRelPath · resolved against cwd).
const resolveInstallRequirementsJsonPath = (designation: string): string =>
  path.resolve(process.cwd(), installRequirementsRelPath(designation));

// STCP SLOT 1 · schema-aware parse of the gate file into the WRAPPER payload. Returns null on empty /
// parse-fail (resilient · the watcher stays alive until a valid gate file lands). A parsed object is
// wrapped { present:true, requirements: <parsed> } — malformed JSON never crashes (telemetry + null).
const parseInstallRequirementsPayload = (raw: string): InstallRequirementsPayload | null => {
  if (!raw.trim()) return null; // skip empty / partial writes.
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    console.warn('[Suite8 InstallWatch] Install.Requirements.json parse failed · ignoring (partial write?)');
    sinkInstallWatchTelemetry('parse.skip', { reason: 'malformed-json' });
    return null;
  }
  if (!parsed || typeof parsed !== 'object') {
    sinkInstallWatchTelemetry('parse.skip', { reason: 'not-object' });
    return null;
  }
  // The gate file IS the InstallRequirementsShape (the Mapper wrote it per the model). Present:true.
  return { present: true, requirements: parsed as InstallRequirementsShape };
};

// The Idle sentinel — unlink / absence dispatches this (EMPTY IS A STATE · the honest not-present verdict).
const EMPTY_INSTALL_REQUIREMENTS: InstallRequirementsPayload = { present: false, requirements: null };

// CONTENT-AWARE IDENTITY (the in-place-edit suppression cure · mirrors menuStageContentIdentity): djb2
// over the serialized payload — any content change = a new identity; truly identical rewrites dedupe.
// DESIGNATION-KEYED so two designations do NOT cross-suppress in independent helper instances.
const installRequirementsContentIdentity = (designation: string, payload: InstallRequirementsPayload): string => {
  const s = JSON.stringify(payload);
  let h = 5381;
  for (let i = 0; i < s.length; i += 1) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  return `${designation}:${payload.present ? 1 : 0}:${h}`;
};

export const createSuite8InstallRequirementsRelayConfig = (
  designation: string,
): StcpComponentRelayConfig<InstallRequirementsPayload> => ({
  jsonPath: resolveInstallRequirementsJsonPath(designation),
  basename: INSTALL_REQUIREMENTS_FILE_NAME,
  parsePayload: parseInstallRequirementsPayload,
  emptyPayload: EMPTY_INSTALL_REQUIREMENTS,
  baseActionCreator: (payload) =>
    suite8SetInstallRequirementsHuirthBase.actionCreator({ designation, payload }) as AnyAction,
  relayActionCreator: (payload) =>
    suite8SetInstallRequirements.actionCreator({ designation, payload }) as AnyAction,
  payloadIdentity: (payload) => installRequirementsContentIdentity(designation, payload),
  logTag: `[Suite8 InstallWatch · STCP install · ${designation}]`,
  telemetrySink: (seat, detail) => sinkInstallWatchTelemetry(seat, { designation, ...detail }),
});

export { installRequirementsContentIdentity };

export const suite8InstallRequirementsWatchPrinciple: Suite8InstallRequirementsWatchPrincipleType = ({ plan, nextA }) => {
  console.log('[Suite8 InstallWatch] Principle started · N-designation Install.Requirements.json dir-watch (WPS)');
  sinkInstallWatchTelemetry('principle-start', { suite8Root: SUITE8_ROOT_ABS });

  // WPS · one FSWatcher per registered designation, keyed by Name (NDEP). The Map is the teardown
  // ledger — the cleanup function closes EVERY handle (the no-leak invariant).
  const watcherMap = new Map<string, FSWatcher>();
  // the live 8_SUITES dir-watch handle + its debounce timer (Principle-scope · closed in cleanup).
  let suite8DirWatcher: FSWatcher | null = null;
  let addDirDebounceTimer: NodeJS.Timeout | null = null;

  // Arm ONE designation's gate-file watch (idempotent · skips a designation already in the Map).
  // Reusable by the boot seed, the FS sweep, and the live addDir handler. NEVER throws (arm failure
  // = skip + telemetry). The keyed relay config carries the SBIS Base→Relay dispatch internally.
  const armDesignation = (designation: string): void => {
    const trimmed = designation.trim();
    if (trimmed.length === 0) return;
    if (watcherMap.has(trimmed)) return; // idempotent — already armed.
    try {
      const installRelay = createStcpComponentRelay<InstallRequirementsPayload>(
        createSuite8InstallRequirementsRelayConfig(trimmed),
      );
      const watcher = installRelay.armDirectoryWatch(nextA);
      if (watcher) {
        watcherMap.set(trimmed, watcher);
        void installRelay.readAndDispatchSbis(nextA); // FIRST-LOAD hydration for this designation.
        console.log('[Suite8 InstallWatch] armed designation ·', trimmed);
        sinkInstallWatchTelemetry('arm-designation', { designation: trimmed });
      }
    } catch (err) {
      console.log('[Suite8 InstallWatch] arm.skip · reason=arm-failed · designation=', trimmed, '·', err);
      sinkInstallWatchTelemetry('arm-designation.skip', { designation: trimmed, reason: 'arm-failed', error: String(err) });
    }
  };

  // enumerate the immediate Cascades/8_SUITES/<name> subdirectory names (ENOENT-safe · never throws —
  // absence = [] + skip telemetry). Used by both the boot sweep and the live addDir re-sweep.
  const readSuite8SubdirectoryNames = (): string[] => {
    try {
      return readdirSync(SUITE8_ROOT_ABS, { withFileTypes: true })
        .filter((dirent) => dirent.isDirectory())
        .map((dirent) => dirent.name);
    } catch (err) {
      const isEnoent = (err as NodeJS.ErrnoException)?.code === 'ENOENT';
      console.log(
        '[Suite8 InstallWatch] 8_SUITES.enumerate.skip · reason=',
        isEnoent ? 'absent' : 'unreadable',
        '· path=',
        SUITE8_ROOT_ABS,
      );
      return [];
    }
  };

  const installWatchPlan = plan('Suite8 InstallWatch (Huirth · N-designation dir-watch · WPS)', ({ stage }) => [
    // Stage 1 · one-shot bootstrap — arm ONE Install.Requirements.json DIRECTORY watch per registered
    // designation via that designation's keyed relay config. Each helper hardcodes ignoreInitial:true,
    // so readAndDispatchSbis covers the FIRST-LOAD hydration path (no-op if absent · ENOENT → null).
    stage(
      ({ d, dispatch }) => {
        console.log('[Suite8 InstallWatch] Stage 1 · arm N Install.Requirements.json dir-watches');
        // Boot seed — the MPRF authoritative list.
        for (const entry of KNOWN_SUITE8_ENTRIES) {
          armDesignation(entry.name);
        }
        // FS sweep — arm any 8_SUITES designation dir ALREADY present that the boot seed did not cover
        // (a runtime-forged Suite 8 present before this boot).
        for (const name of readSuite8SubdirectoryNames()) {
          armDesignation(name);
        }
        console.log('[Suite8 InstallWatch] armed', watcherMap.size, 'designation watcher(s)');
        sinkInstallWatchTelemetry('boot-sweep', { armedCount: watcherMap.size, designations: [...watcherMap.keys()] });

        // LIVE — chokidar-watch Cascades/8_SUITES/ at depth 0 for `addDir`. A NEWLY forged designation
        // (the Forge/mint built the dir mid-session) arms its install watcher IMMEDIATELY. Debounced
        // lightly; NEVER throws (arm failure = skip + telemetry). Mirrors the menuWatch addDir pattern.
        try {
          suite8DirWatcher = chokidarWatch(SUITE8_ROOT_ABS, {
            persistent: true,
            // ignoreInitial:true — the boot sweep already armed the existing dirs; the live watch only
            // reacts to NEW dirs forged after boot (no double-arm of the initial set).
            ignoreInitial: true,
            // depth 0 — only the immediate Cascades/8_SUITES/<name> designations, not their contents.
            depth: 0,
          });
          const handleAddDir = (): void => {
            if (addDirDebounceTimer) clearTimeout(addDirDebounceTimer);
            addDirDebounceTimer = setTimeout(() => {
              console.log('[Suite8 InstallWatch] addDir · re-sweeping 8_SUITES for new designations');
              sinkInstallWatchTelemetry('adddir-resweep', { armedBefore: watcherMap.size });
              for (const name of readSuite8SubdirectoryNames()) {
                armDesignation(name); // idempotent — only NEW designations actually arm.
              }
              sinkInstallWatchTelemetry('adddir-resweep.done', { armedAfter: watcherMap.size, designations: [...watcherMap.keys()] });
            }, INSTALL_ADDDIR_DEBOUNCE_MS);
          };
          suite8DirWatcher.on('addDir', handleAddDir);
          suite8DirWatcher.on('error', (err) => {
            console.log('[Suite8 InstallWatch] watch.skip · reason=chokidar-error ·', err);
          });
          console.log('[Suite8 InstallWatch] chokidar armed on', SUITE8_ROOT_ABS, '· depth=0 · addDir');
          sinkInstallWatchTelemetry('live-adddir-armed', { suite8Root: SUITE8_ROOT_ABS });
        } catch (err) {
          console.log('[Suite8 InstallWatch] watch.skip · reason=arm-failed ·', err);
          sinkInstallWatchTelemetry('live-adddir.skip', { reason: 'arm-failed', error: String(err) });
        }

        dispatch(d.muxium.e.muxiumKick(), { iterateStage: true });
      },
      { beat: 33 },
    ),
    // FT-006 Concluding Stage Pattern — the iterateStage above LANDS HERE; the plan concludes cleanly
    // while the N chokidar watchers + nextA pipes + the live addDir watch persist independently in the
    // closure (the plan's only job was the one-shot bootstrap).
    stage(({ stagePlanner }) => {
      stagePlanner.conclude();
    }, {}),
  ]);

  return () => {
    console.log('[Suite8 InstallWatch] Principle cleanup · closing', watcherMap.size, 'watcher(s)');
    sinkInstallWatchTelemetry('cleanup', { closingCount: watcherMap.size });
    // HAZARD-A order: timer → live watcher → per-designation watchers → plan.conclude().
    if (addDirDebounceTimer) {
      clearTimeout(addDirDebounceTimer);
      addDirDebounceTimer = null;
    }
    if (suite8DirWatcher) {
      try {
        suite8DirWatcher.close();
      } catch {
        /* already closed */
      }
      suite8DirWatcher = null;
    }
    for (const watcher of watcherMap.values()) {
      try {
        watcher.close();
      } catch {
        /* already closed */
      }
    }
    watcherMap.clear();
    installWatchPlan.conclude();
  };
};
