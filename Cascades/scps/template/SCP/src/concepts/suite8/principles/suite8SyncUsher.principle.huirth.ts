/**
 * suite8SyncUsher.principle.huirth.ts — U2 · THE USHER STAGE PLANNER (the Usher Reframe · C729)
 *
 * THE MODE MACHINE (per designation · the Synchronizing Principle Pattern with setStage ·
 * STRATIMUX-REFERENCE.md:778): TWO EXCLUSIVE stages — LOCAL anor TARGETED — selector-gated
 * on the suite8 Huirth `syncModes` Record. The stage pointer always sits AT the active
 * mode's stage; a mode flip fires the active stage's selector, which WINDS DOWN its own
 * watchers, performs the transition motions (the U1-proven primitives), and dispatches
 * `{ setStage }` to advance. THE HALTING MUXAMETER: no state where both ushers run — the
 * wind-down ordering IS the Local Directory's protection. This is NOT the #640 parked-
 * pointer class: transitions are explicit dispatches from the FIRING stage, never a wait
 * behind a non-iterating stage.
 *
 * THE CIRCUIT: SyncLibrary.json (the truth · watched per designation) → the mode dispatch
 * (suite8SetSyncModeHuirthBase · disk → Base action → state) → the machine's selectors fire.
 *
 * LOCAL MODE: the preservation usher — chokidar over the registered paths; changes usher
 * into the vault (.syncLocal · debounced snapshot · identity-guarded).
 * TARGET MODE: replaceRegisteredFromTarget once, then the delivery usher — chokidar over
 * the TARGET's registered paths AND the local watched paths (a local edit is re-stamped:
 * the target is authoritative); every event debounces into replaceRegisteredFromTarget;
 * the identity guard makes the echo terminate (copied 0 ⇒ no further events). NEVER
 * touches the vault.
 *
 * The Zero-Knowledge Watchers (menu · cascade · frontier · every registered surface's
 * consumers) fire on the arriving content exactly as on local writes — THAT is the
 * delivery. Zero consumer changes.
 *
 * Citation: DIAMOND-SYNC-LIBRARY.md · THE USHER REFRAME (C729) + U1 (the primitives).
 * Citation: suite8MenuWatch.principle.huirth.ts (WPS arm/teardown + FT-006 + the library
 * subscription idiom). Citation: suite8MenuStcpRelay.principle.huirth.ts (selector-stage +
 * d_ + DTBP throttle discipline).
 */
import type { PrincipleFunction, MuxiumDeck, Concept } from 'stratimux';
import { watch as chokidarWatch, type FSWatcher } from 'chokidar';
import { readdirSync } from 'node:fs';
import path from 'node:path';
import type { Suite8HuirthState, Suite8HuirthQualities, Suite8SyncLocalitySnapshot } from '../suite8.type';
import { KNOWN_SUITE8_ENTRIES } from '../model/suite8Registration.model';
import { suite8SetSyncModeHuirthBase } from '../qualities/suite8SetSyncModeHuirthBase.quality.huirth';
// B-RLM-2 · THE LOCALITY SNAPSHOT DISPATCH — the same two boundary legs that dispatch the mode +
// the grace ALSO compose + dispatch the per-designation locality snapshot (the relay ground).
import { suite8SetLocalityHuirthBase } from '../qualities/suite8SetLocalityHuirthBase.quality.huirth';
// B-RLM-1′ · THE GRACE-AS-STATE TRIAD — the bridge-json + boot dispatchers open/cancel graces
// (the fuse rides muxiumTimeOut inside the begin quality; scheduleRevertCheck is RETIRED).
import { suite8BeginClosureGraceHuirthBase } from '../qualities/suite8BeginClosureGraceHuirthBase.quality.huirth';
import { suite8CancelClosureGraceHuirthBase } from '../qualities/suite8CancelClosureGraceHuirthBase.quality.huirth';
import {
  seedSyncLibraryAdditive,
  registerSyncSurfacesAdditive,
  resolveSyncLibraryPath,
  resolveSyncLocality,
  snapshotRegisteredToVault,
  replaceRegisteredFromTarget,
  restoreRegisteredFromVault,
  sinkSyncLibraryTelemetry,
  KNOWN_SURFACE_REGISTRATIONS,
  isSpecifiedTargetLive,
  readSyncRingFromBridgeJson,
  readVaultHoldMarker,
  writeVaultHoldMarker,
  clearVaultHoldMarker,
  // B-RLM-2 · the pure reads that compose a locality snapshot (all boundary reads at the boundary).
  readLocalScpName,
  readSpecifiedKey,
  // D-LSG · the Content-Origin Stamp (the user's Critical Notion — the vault refuses foreign).
  writeContentOriginStamp,
  readContentOriginStamp,
  // D-MINT-SURFACE · the Twin Stand-Down sentinel (held model · never token-renamed).
  SYNC_USHER_CONCEPT_HOLDER,
} from '../../../model/scpSyncLibrary.model';

export type Suite8SyncUsherDeck = MuxiumDeck & {
  suite8: Concept<Suite8HuirthState, Suite8HuirthQualities>;
};

export type Suite8SyncUsherPrincipleType = PrincipleFunction<
  Suite8HuirthQualities,
  Suite8SyncUsherDeck,
  Suite8HuirthState
>;

const EXTENDED_ROOT_ABS = path.resolve(process.cwd(), 'Cascades', 'Extended');
const USHER_DEBOUNCE_MS = 250;
const USHER_ADDDIR_DEBOUNCE_MS = 250;

type StagePlannerHandle = { conclude: () => void };

export const suite8SyncUsherPrinciple: Suite8SyncUsherPrincipleType = ({
  d_,
  k_,
  plan,
  nextA,
  concepts_,
}) => {
  // D-MINT-SURFACE · THE TWIN STAND-DOWN GUARD — this principle operates SHARED suite8-owned
  // sync infrastructure (the usher machine · the vault · the workspace ring). The mint engine
  // token-renames every 'suite8' in a copied twin, so the literal below is INTENTIONAL: in a
  // minted twin it becomes the twin's domain name, while the sentinel — imported from the HELD
  // model outside the copy surface — always reads the canonical holder. Mismatch = this is a
  // minted twin: stand down before any watcher or plan arms (the twin's renamed selector
  // `d_.<domain>.k.syncModes` is an undefined key = RUNAWAY stage firing).
  const ownConceptName: string = 'suite8';
  if (ownConceptName !== SYNC_USHER_CONCEPT_HOLDER) {
    console.log(`[${ownConceptName} SyncUsher] TWIN STAND-DOWN · the sync usher is held by '${SYNC_USHER_CONCEPT_HOLDER}' — no-op`);
    sinkSyncLibraryTelemetry('usher.twin-stand-down.skip', { ownConceptName, holder: SYNC_USHER_CONCEPT_HOLDER });
    return () => {};
  }
  console.log('[Suite8 SyncUsher] Principle started · the Usher Stage Planner (U2)');
  sinkSyncLibraryTelemetry('usher.principle-start', { extendedRoot: EXTENDED_ROOT_ABS });

  const armed = new Set<string>();
  const machinePlans = new Map<string, StagePlannerHandle>();
  const libraryWatchers = new Map<string, FSWatcher>();
  const preservationWatchers = new Map<string, FSWatcher[]>();
  const deliveryWatchers = new Map<string, FSWatcher[]>();
  const targetRootByDesignation = new Map<string, string>();
  const debounceTimers = new Map<string, NodeJS.Timeout>();
  let extendedDirWatcher: FSWatcher | null = null;
  let addDirDebounceTimer: NodeJS.Timeout | null = null;
  // B2 · THE CLOSURE REVERT — the liveness watch on the per-SCP bridge.json (the
  // lifecycle truth the bridge rewrites on every SCP transition).
  let bridgeJsonWatcher: FSWatcher | null = null;
  let livenessDebounceTimer: NodeJS.Timeout | null = null;

  // B-RLM-1′ · THE GRACE-AS-STATE FOLD — scheduleRevertCheck + pendingRevertTimers + REVERT_GRACE_MS
  // are RETIRED (no setTimeout between the boundary and the muxium). The bridge-json + boot legs
  // are now PURE DISPATCHERS: they read the ring fresh at the boundary, classify (the Ring
  // Discriminator: targeted 8s anor systemic 30s), and dispatch a state-setting grace action. The
  // grace's EXISTENCE is state (closureGraces); the fuse rides muxiumTimeOut inside the begin
  // quality; cancellation is a state clear + the fired strategy's fire-time re-check.
  const REVERT_GRACE_TARGETED_MS = 8_000; // kept-me-lost-target — the local SCP stands, the target closed.
  const REVERT_GRACE_SYSTEMIC_MS = 30_000; // turn-over/boot — the bridge restarted every SCP together.

  // Read the standing grace for a designation from state (the getState Concluder · this principle
  // is registered ON suite8, so k_ = suite8's BundledSelectors).
  const graceStanding = (designation: string): boolean => {
    const state = k_.getState(concepts_);
    return !!state && state.closureGraces[designation] !== undefined;
  };

  // THE DISPATCHER (bridge-json + boot) — read the ring FRESH at the boundary (the Zero-Knowledge
  // read), then:
  //   - target LIVE anor specified null → a standing grace is now stale → dispatch cancel (target-live).
  //   - target NOT live + NO grace standing → THE RING DISCRIMINATOR → dispatch begin (targeted anor
  //     systemic). The `!graceStanding` gate IS the Case-4 has-guard, now as state.
  //   - target NOT live + a grace already stands → no-op (never restart anor escalate).
  // `boot` forces SYSTEMIC (never targeted at boot — the lifecycle truth is mid-transition).
  const dispatchGraceDecision = (designation: string, leg: 'watcher' | 'boot'): void => {
    const { specified, live } = isSpecifiedTargetLive(designation);
    if (specified === null || live) {
      if (graceStanding(designation)) {
        nextA(
          suite8CancelClosureGraceHuirthBase.actionCreator({
            designation,
            reason: 'target-live',
          }),
        );
      }
      return;
    }
    // specified stands + target not live.
    if (graceStanding(designation)) return; // the state gate — a grace already rides.
    // THE RING DISCRIMINATOR — from the fresh ring at the boundary. Boot is always systemic.
    let graceMs = REVERT_GRACE_SYSTEMIC_MS;
    if (leg === 'watcher') {
      const ring = readSyncRingFromBridgeJson();
      const localScp = seedSyncLibraryAdditive(designation).shape.localScp;
      const localEntry = ring.find((e) => e.scpName === localScp);
      const localPresentAndLive = !!localEntry && localEntry.status !== 'offline';
      // Kept-me-lost-target: the local SCP is present + live in the ring AND the specified target
      // is NOT → the short targeted grace (the page swaps in ~8-9s). Otherwise the systemic grace.
      graceMs = localPresentAndLive ? REVERT_GRACE_TARGETED_MS : REVERT_GRACE_SYSTEMIC_MS;
    }
    nextA(
      suite8BeginClosureGraceHuirthBase.actionCreator({
        designation,
        specified,
        leg,
        graceMs,
      }),
    );
  };

  // B-RLM-2 · COMPOSE THE LOCALITY SNAPSHOT — pure reads at the Zero-Knowledge boundary (the ring +
  // the resolution + the specified key), assembled into the state shape the relay broadcasts. The
  // ring EXCLUDES the local SCP (its row is the Local row · the GET endpoint's convention · shape
  // parity). Scholar AMENDMENT: targetRoot/targetLive/localLive ride the snapshot (the machine's
  // TARGET transition + the Grace Sentinel read them FROM STATE · retiring the closure Map + the
  // per-leg re-reads). A resolution failure (Local · absent · archived) → the Local sentinel snapshot.
  const composeLocalitySnapshot = (designation: string): Suite8SyncLocalitySnapshot => {
    const localScp = readLocalScpName();
    const ring = readSyncRingFromBridgeJson();
    const resolution = resolveSyncLocality(designation);
    const { specified, live } = isSpecifiedTargetLive(designation);
    const localEntry = localScp ? ring.find((e) => e.scpName === localScp) : undefined;
    const localLive = !!localEntry && localEntry.status !== 'offline';
    return {
      localScp,
      specified: readSpecifiedKey(designation),
      targetScp: resolution ? resolution.targetScp : null,
      targetRoot: resolution ? resolution.root : null,
      targetLive: specified !== null ? live : false,
      localLive,
      // The ring the client renders — the local SCP EXCLUDED (Local is its own row · GET
      // parity) AND the template PRUNED (the r7 invariant: the install substrate is never
      // a locality target).
      ring: ring
        .filter((e) => e.scpName !== localScp && e.scpName !== 'template')
        .map((e) => ({ scpName: e.scpName, status: e.status, origin: e.origin ?? null })),
    };
  };

  // B-RLM-2 · THE LOCALITY DISPATCHER — compose + dispatch the snapshot (the reducer no-ops an
  // identical recompose · the change-gate lives in the reducer, so this stays a pure dispatcher).
  // Shared by the library-watcher leg, the bridge-json leg, and the boot leg.
  const dispatchLocalityFromDisk = (designation: string): void => {
    const snapshot = composeLocalitySnapshot(designation);
    nextA(suite8SetLocalityHuirthBase.actionCreator({ designation, snapshot }));
    sinkSyncLibraryTelemetry('usher.locality-dispatch', {
      designation,
      specified: snapshot.specified,
      targetScp: snapshot.targetScp,
      targetLive: snapshot.targetLive,
      localLive: snapshot.localLive,
      ringCount: snapshot.ring.length,
    });
  };

  const debounced = (key: string, fn: () => void): void => {
    const held = debounceTimers.get(key);
    if (held) clearTimeout(held);
    debounceTimers.set(
      key,
      setTimeout(() => {
        debounceTimers.delete(key);
        fn();
      }, USHER_DEBOUNCE_MS),
    );
  };

  const closeWatchers = (map: Map<string, FSWatcher[]>, designation: string): void => {
    const list = map.get(designation);
    if (!list) return;
    for (const w of list) {
      try {
        w.close();
      } catch {
        /* already closed */
      }
    }
    map.delete(designation);
  };

  // LOCAL MODE · arm the preservation usher — one watcher per registered path; every event
  // debounces into a whole-designation snapshot (identity-guarded — unchanged files skip).
  const armPreservation = (designation: string): void => {
    if (preservationWatchers.has(designation)) return;
    const { shape } = seedSyncLibraryAdditive(designation);
    const list: FSWatcher[] = [];
    for (const rel of Object.values(shape.registered)) {
      try {
        const w = chokidarWatch(path.resolve(process.cwd(), rel), {
          persistent: true,
          ignoreInitial: true,
          awaitWriteFinish: { stabilityThreshold: 100, pollInterval: 20 },
        });
        w.on('all', () => {
          debounced(`preserve:${designation}`, () => {
            snapshotRegisteredToVault(designation);
          });
        });
        w.on('error', () => {
          /* an usher watcher must never harm the SCP */
        });
        list.push(w);
      } catch {
        sinkSyncLibraryTelemetry('usher.preserve.arm-skip', { designation, rel });
      }
    }
    preservationWatchers.set(designation, list);
    sinkSyncLibraryTelemetry('usher.preserve.armed', { designation, watchers: list.length });
  };

  // TARGET MODE · arm the delivery usher — the TARGET's registered paths (the source) AND
  // the local watched paths (the re-stamp: a local edit is replaced — the target is
  // authoritative). Every event debounces into replaceRegisteredFromTarget; the identity
  // guard terminates the echo. NEVER touches the vault.
  const armDelivery = (designation: string, targetRoot: string): void => {
    if (deliveryWatchers.has(designation)) return;
    const { shape } = seedSyncLibraryAdditive(designation);
    const list: FSWatcher[] = [];
    const deliver = (): void => {
      debounced(`deliver:${designation}`, () => {
        replaceRegisteredFromTarget(designation, targetRoot);
      });
    };
    for (const rel of Object.values(shape.registered)) {
      for (const base of [targetRoot, process.cwd()]) {
        try {
          const w = chokidarWatch(path.resolve(base, rel), {
            persistent: true,
            ignoreInitial: true,
            awaitWriteFinish: { stabilityThreshold: 100, pollInterval: 20 },
          });
          w.on('all', deliver);
          w.on('error', () => {
            /* never harm the SCP */
          });
          list.push(w);
        } catch {
          sinkSyncLibraryTelemetry('usher.deliver.arm-skip', { designation, rel, base });
        }
      }
    }
    deliveryWatchers.set(designation, list);
    sinkSyncLibraryTelemetry('usher.deliver.armed', {
      designation,
      targetRoot,
      watchers: list.length,
    });
  };

  // The per-designation MODE MACHINE — three exclusive setStage stages (REFERENCE:778 ·
  // DSP-B3a: the user's Closure Stage ruling). LOCAL-WATCH ⇄ TARGETED with the CLOSURE
  // stage as the ONE structural exit from target: switch the vault back in → close the
  // delivery watcher → kick into the Local Watching stage. Deselect anor closure-revert
  // take the SAME stage — one path, two triggers.
  const armMachine = (designation: string): void => {
    if (machinePlans.has(designation)) return;
    const machine = plan(`Suite8 Sync Usher Machine · ${designation}`, ({ stage }) => [
      // Stage 0 · LOCAL-WATCH — the preservation posture. The selector fires on any
      // syncModes change (and the firstRun free pass engages the boot posture).
      stage(
        ({ d, dispatch }) => {
          const mode = (d.suite8.k.syncModes.select() as Record<string, string>)[designation] ?? 'local';
          if (mode === 'local') {
            closeWatchers(deliveryWatchers, designation); // entry guard — stale target watchers die here.
            // D-EF-ORPHANED-HOLD · THE BOOT-CLOSURE ARM (the r4 forensics — the field
            // breach): a kill between Stage 1's setStage:2 and Stage 2 executing strands
            // the machine mid-closure — the hold marker + a FOREIGN stamp persist while
            // specified reads Local; without this arm the foreign tree is adopted as
            // local FOREVER (the guard refuses the vault but nothing RESTORES). The
            // partial-closure fingerprint: hold-present AND stamp-foreign at a local
            // boot → run the closure motion inline, synchronously, before preservation.
            if (
              readVaultHoldMarker(designation) &&
              readContentOriginStamp(designation) !== 'Local'
            ) {
              sinkSyncLibraryTelemetry('usher.boot-closure.detected', { designation });
              const heldDeliver = debounceTimers.get(`deliver:${designation}`);
              if (heldDeliver) {
                clearTimeout(heldDeliver);
                debounceTimers.delete(`deliver:${designation}`);
              }
              const restored = restoreRegisteredFromVault(designation);
              clearVaultHoldMarker(designation);
              writeContentOriginStamp(designation, 'Local');
              sinkSyncLibraryTelemetry('usher.boot-closure.restored', { designation, ...restored });
            }
            armPreservation(designation); // idempotent — the boot posture + re-entry.
            return;
          }
          // The flip → TARGET: wind down preservation FIRST → freeze the vault ONLY when
          // it is not already holding → replace the watched locations → arm delivery.
          const targetRoot = targetRootByDesignation.get(designation) ?? '';
          if (!targetRoot) {
            sinkSyncLibraryTelemetry('usher.machine.skip', { designation, reason: 'no-target-root' });
            return; // stay LOCAL — never advance blind (the Halting discipline).
          }
          closeWatchers(preservationWatchers, designation);
          // THE VAULT HOLD MARKER (the boot-poison guard): a boot-with-target-active
          // re-runs this transition while the tree holds DELIVERED content — the field
          // loss froze that content into the vault (snapshot copied:18 at boot) and the
          // restore became a no-op. The marker makes the freeze once-per-hold: snapshot
          // fires ONLY at the genuine select (marker absent → the tree is local truth).
          if (readVaultHoldMarker(designation)) {
            sinkSyncLibraryTelemetry('usher.snapshot.skip', { designation, reason: 'vault-already-held' });
          } else {
            snapshotRegisteredToVault(designation); // the final freeze before target content lands.
            writeVaultHoldMarker(designation, targetRoot);
          }
          // D-LSG · STAMP-THEN-REPLACE (the fail-safe direction): the tree is about to hold
          // FOREIGN content — the stamp declares it BEFORE the first byte lands; any crash
          // anor race inside the window leaves the vault REFUSING every snapshot.
          writeContentOriginStamp(designation, readSpecifiedKey(designation) ?? targetRoot);
          replaceRegisteredFromTarget(designation, targetRoot);
          armDelivery(designation, targetRoot);
          sinkSyncLibraryTelemetry('usher.machine.advance', { designation, to: 'target', targetRoot });
          dispatch(d.muxium.e.muxiumKick(), { setStage: 1, throttle: 0 });
        },
        { selectors: [d_.suite8.k.syncModes], beat: 1 },
      ),
      // Stage 1 · TARGETED — the delivery posture. The release routes to the CLOSURE
      // stage; no teardown work happens here.
      stage(
        ({ d, dispatch }) => {
          const mode = (d.suite8.k.syncModes.select() as Record<string, string>)[designation] ?? 'local';
          if (mode === 'target') return; // holding the posture — the watchers carry the work.
          sinkSyncLibraryTelemetry('usher.machine.advance', { designation, to: 'closure' });
          dispatch(d.muxium.e.muxiumKick(), { setStage: 2, throttle: 0 });
        },
        { selectors: [d_.suite8.k.syncModes], beat: 1 },
      ),
      // Stage 2 · CLOSURE (the user's Single Stage) — the one structural exit from
      // target: close the delivery watchers + drain any in-flight delivery debounce →
      // switch the files from .syncLocal/ back into the SCP's directory → release the
      // hold marker → re-arm the local watch → kick into LOCAL-WATCH. Selector-less:
      // the routing kick fires it once; every operation is idempotent.
      stage(
        ({ d, dispatch }) => {
          closeWatchers(deliveryWatchers, designation);
          const heldDeliver = debounceTimers.get(`deliver:${designation}`);
          if (heldDeliver) {
            clearTimeout(heldDeliver);
            debounceTimers.delete(`deliver:${designation}`);
          }
          sinkSyncLibraryTelemetry('usher.closure-stage.deliver-closed', { designation });
          const restored = restoreRegisteredFromVault(designation);
          clearVaultHoldMarker(designation);
          // D-LSG · RESTORE-THEN-STAMP: 'Local' declares ONLY after the switch-back landed —
          // preservation re-arms against a tree the stamp vouches for.
          writeContentOriginStamp(designation, 'Local');
          sinkSyncLibraryTelemetry('usher.closure-stage.restored', { designation, ...restored });
          armPreservation(designation);
          sinkSyncLibraryTelemetry('usher.closure-stage.preserve-rearmed', { designation });
          sinkSyncLibraryTelemetry('usher.machine.advance', { designation, to: 'local' });
          dispatch(d.muxium.e.muxiumKick(), { setStage: 0, throttle: 0 });
        },
        { beat: 1 },
      ),
    ]);
    machinePlans.set(designation, machine);
  };

  // Read the library's truth → dispatch the mode (the reducer no-ops identical modes, so
  // the machine's selector fires ONLY on a real flip). B-RLM-2 · ALSO compose + dispatch the
  // locality snapshot (the relay ground) — the same disk read that drives the mode drives the
  // locality (specified changes, path changes). The reducer's change-gate honors the no-storm
  // discipline (an identical snapshot no-ops).
  const dispatchModeFromDisk = (designation: string): void => {
    const locality = resolveSyncLocality(designation);
    if (locality) targetRootByDesignation.set(designation, locality.root);
    nextA(
      suite8SetSyncModeHuirthBase.actionCreator({
        designation,
        mode: locality ? 'target' : 'local',
      }),
    );
    // B-RLM-2 · the locality snapshot rides the same leg (dispatchModeAndLocalityFromDisk).
    dispatchLocalityFromDisk(designation);
  };

  const armDesignation = (designation: string): void => {
    const trimmed = designation.trim();
    if (trimmed.length === 0 || armed.has(trimmed)) return;
    armed.add(trimmed);
    // The Demometeric surface registrations (the Cadmium frontier et al.) land BEFORE the
    // machine reads the registered map.
    const known = KNOWN_SURFACE_REGISTRATIONS[trimmed];
    if (known) registerSyncSurfacesAdditive(trimmed, known);
    else seedSyncLibraryAdditive(trimmed);
    armMachine(trimmed);
    // B-RLM-1′ · THE CLOSURE REVERT (boot leg · GRACE-AS-STATE) — a bridge turn over restarts
    // every SCP together; the lifecycle truth is mid-transition at boot. The dispatcher opens a
    // SYSTEMIC 30s grace on a not-live specified target (never targeted at boot); the target
    // coming back within the grace HOLDS the standing selection (the fired strategy's re-check
    // no-ops). The state gate absorbs any mid-relaunch re-dispatch.
    dispatchGraceDecision(trimmed, 'boot');
    dispatchModeFromDisk(trimmed);
    // The library subscription — a `specified` change on disk re-dispatches the mode.
    try {
      const w = chokidarWatch(resolveSyncLibraryPath(trimmed), {
        persistent: true,
        ignoreInitial: true,
        awaitWriteFinish: { stabilityThreshold: 100, pollInterval: 20 },
      });
      const onChange = (): void => dispatchModeFromDisk(trimmed);
      w.on('change', onChange);
      w.on('add', onChange);
      w.on('error', () => {
        /* never harm the SCP */
      });
      libraryWatchers.set(trimmed, w);
    } catch {
      sinkSyncLibraryTelemetry('usher.library-watch.arm-skip', { designation: trimmed });
    }
    console.log('[Suite8 SyncUsher] armed designation ·', trimmed);
  };

  const readExtendedSubdirectoryNames = (): string[] => {
    try {
      return readdirSync(EXTENDED_ROOT_ABS, { withFileTypes: true })
        .filter((d) => d.isDirectory())
        .map((d) => d.name);
    } catch {
      return [];
    }
  };

  const bootstrapPlan = plan('Suite8 Sync Usher Bootstrap (Huirth · U2)', ({ stage }) => [
    stage(
      ({ d, dispatch }) => {
        for (const entry of KNOWN_SUITE8_ENTRIES) armDesignation(entry.name);
        for (const name of readExtendedSubdirectoryNames()) armDesignation(name);
        sinkSyncLibraryTelemetry('usher.boot-sweep', { armedCount: armed.size, designations: [...armed] });
        try {
          extendedDirWatcher = chokidarWatch(EXTENDED_ROOT_ABS, {
            persistent: true,
            ignoreInitial: true,
            depth: 0,
          });
          extendedDirWatcher.on('addDir', () => {
            if (addDirDebounceTimer) clearTimeout(addDirDebounceTimer);
            addDirDebounceTimer = setTimeout(() => {
              for (const name of readExtendedSubdirectoryNames()) armDesignation(name);
            }, USHER_ADDDIR_DEBOUNCE_MS);
          });
          extendedDirWatcher.on('error', () => {
            /* never harm the SCP */
          });
        } catch {
          sinkSyncLibraryTelemetry('usher.live-adddir.skip', { reason: 'arm-failed' });
        }
        // B2 · THE CLOSURE REVERT (the live leg) — watch the per-SCP bridge.json; on any
        // lifecycle rewrite, every armed designation's specified target is re-checked:
        // not live → specified→null WRITTEN (the model check) → the library watcher fires
        // → the mode re-dispatches → the machine winds down and restores through the
        // proven circuit. Debounced (the bridge rewrites in bursts).
        try {
          bridgeJsonWatcher = chokidarWatch(
            path.resolve(process.cwd(), 'Cascades', 'Bridge', 'bridge.json'),
            {
              persistent: true,
              ignoreInitial: true,
              awaitWriteFinish: { stabilityThreshold: 150, pollInterval: 30 },
            },
          );
          // B-RLM-1′ · THE PURE DISPATCHER — a lifecycle rewrite re-reads the ring FRESH per armed
          // designation (the Ring Discriminator: targeted 8s if the local SCP stands + the target
          // closed, systemic 30s otherwise) and dispatches a state-setting grace action (begin anor
          // cancel). NO scheduleRevertCheck, NO setTimeout fuse here — the fuse rides muxiumTimeOut
          // inside the begin quality. The 400ms debounce is KEPT-AS-BOUNDARY (the coalescer for the
          // bridge's burst rewrites · the r1 verdict).
          const handleLifecycle = (): void => {
            if (livenessDebounceTimer) clearTimeout(livenessDebounceTimer);
            livenessDebounceTimer = setTimeout(() => {
              for (const designation of [...armed]) {
                dispatchGraceDecision(designation, 'watcher');
                // B-RLM-2 · a bridge.json change moves ring status (SCPs come/go online) — refresh
                // EVERY armed designation's locality snapshot so the relay pushes the new ring to
                // clients (no poll). The reducer no-ops any unchanged snapshot (the change-gate).
                dispatchLocalityFromDisk(designation);
              }
            }, 400);
          };
          bridgeJsonWatcher.on('change', handleLifecycle);
          bridgeJsonWatcher.on('add', handleLifecycle);
          bridgeJsonWatcher.on('error', () => {
            /* never harm the SCP */
          });
          sinkSyncLibraryTelemetry('usher.liveness-watch.armed', {});
        } catch {
          sinkSyncLibraryTelemetry('usher.liveness-watch.arm-skip', { reason: 'arm-failed' });
        }
        dispatch(d.muxium.e.muxiumKick(), { iterateStage: true });
      },
      { beat: 33 },
    ),
    // FT-006 concluding stage — the bootstrap concludes; the machines + watchers persist.
    stage(({ stagePlanner }) => {
      stagePlanner.conclude();
    }, {}),
  ]);

  return () => {
    console.log('[Suite8 SyncUsher] Principle cleanup');
    sinkSyncLibraryTelemetry('usher.cleanup', { armedCount: armed.size });
    if (addDirDebounceTimer) clearTimeout(addDirDebounceTimer);
    if (extendedDirWatcher) {
      try {
        extendedDirWatcher.close();
      } catch {
        /* already closed */
      }
      extendedDirWatcher = null;
    }
    // B-RLM-1′ · the grace countdowns are RETIRED — the fuse rides muxiumTimeOut (the Tail Whip),
    // which the muxium owns; nothing to clear here (no principle-held setTimeout for the grace).
    // B2 · the liveness watch teardown (the no-leak invariant extends).
    if (livenessDebounceTimer) {
      clearTimeout(livenessDebounceTimer);
      livenessDebounceTimer = null;
    }
    if (bridgeJsonWatcher) {
      try {
        bridgeJsonWatcher.close();
      } catch {
        /* already closed */
      }
      bridgeJsonWatcher = null;
    }
    for (const t of debounceTimers.values()) clearTimeout(t);
    debounceTimers.clear();
    for (const designation of [...armed]) {
      closeWatchers(preservationWatchers, designation);
      closeWatchers(deliveryWatchers, designation);
    }
    for (const w of libraryWatchers.values()) {
      try {
        w.close();
      } catch {
        /* already closed */
      }
    }
    libraryWatchers.clear();
    for (const machine of machinePlans.values()) machine.conclude();
    machinePlans.clear();
    bootstrapPlan.conclude();
  };
};
