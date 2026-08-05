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
import type { Suite8HuirthState, Suite8HuirthQualities } from '../suite8.type';
import { KNOWN_SUITE8_ENTRIES } from '../model/suite8Registration.model';
import { suite8SetSyncModeHuirthBase } from '../qualities/suite8SetSyncModeHuirthBase.quality.huirth';
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
  revertSpecifiedIfTargetNotLive,
  isSpecifiedTargetLive,
  readVaultHoldMarker,
  writeVaultHoldMarker,
  clearVaultHoldMarker,
} from '../../../model/suite8SyncLibrary.model';

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

export const suite8SyncUsherPrinciple: Suite8SyncUsherPrincipleType = ({ d_, plan, nextA }) => {
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
  // B2b · THE GRACE COUNTDOWN — a not-live reading STARTS a countdown; a live reading
  // CANCELS it; only a SUSTAINED closure reverts (the turn-over persistence: a bridge
  // turn over restarts every SCP together — a standing selection must survive it).
  const pendingRevertTimers = new Map<string, NodeJS.Timeout>();
  const REVERT_GRACE_MS = 30_000;
  const scheduleRevertCheck = (designation: string): void => {
    const { specified, live } = isSpecifiedTargetLive(designation);
    if (specified === null || live) {
      const held = pendingRevertTimers.get(designation);
      if (held) {
        clearTimeout(held);
        pendingRevertTimers.delete(designation);
        sinkSyncLibraryTelemetry('usher.closure-grace.cancelled', { designation });
      }
      return;
    }
    if (pendingRevertTimers.has(designation)) return; // the countdown already runs.
    sinkSyncLibraryTelemetry('usher.closure-grace.start', {
      designation,
      specified,
      graceMs: REVERT_GRACE_MS,
    });
    pendingRevertTimers.set(
      designation,
      setTimeout(() => {
        pendingRevertTimers.delete(designation);
        // The write re-checks at fire — a target returned within the grace SURVIVES.
        revertSpecifiedIfTargetNotLive(designation);
      }, REVERT_GRACE_MS),
    );
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
  // the machine's selector fires ONLY on a real flip).
  const dispatchModeFromDisk = (designation: string): void => {
    const locality = resolveSyncLocality(designation);
    if (locality) targetRootByDesignation.set(designation, locality.root);
    nextA(
      suite8SetSyncModeHuirthBase.actionCreator({
        designation,
        mode: locality ? 'target' : 'local',
      }),
    );
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
    // B2b · THE CLOSURE REVERT (boot leg · GRACE-WINDOWED) — a bridge turn over restarts
    // every SCP together; the lifecycle truth is mid-transition at boot. A not-live
    // reading starts the countdown; the target coming back within the grace HOLDS the
    // standing selection (the prior operational means persists across the turn over).
    scheduleRevertCheck(trimmed);
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
          const handleLifecycle = (): void => {
            if (livenessDebounceTimer) clearTimeout(livenessDebounceTimer);
            livenessDebounceTimer = setTimeout(() => {
              for (const designation of [...armed]) {
                scheduleRevertCheck(designation);
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
    // B2b · the grace countdowns teardown.
    for (const t of pendingRevertTimers.values()) clearTimeout(t);
    pendingRevertTimers.clear();
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
