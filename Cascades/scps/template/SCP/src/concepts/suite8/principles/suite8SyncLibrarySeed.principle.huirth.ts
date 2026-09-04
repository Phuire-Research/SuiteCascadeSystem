/**
 * suite8SyncLibrarySeed.principle.huirth.ts — SL-1 · THE SYNC LIBRARY BOOT REGISTRATION
 *
 * The Demometeric registration means extended by one further plurality: on boot, EVERY known
 * Suite 8 designation gains its Cascades/Extended/<name>/SyncLibrary.json — localScp registered
 * from scp.config.json, the Local path group as the SOURCE OF TRUTH, `specified` null (the
 * chosen-feature default: byte-identical behavior). ADDITIVE + IDEMPOTENT: an existing library
 * is normalized, never clobbered; an unchanged file is not rewritten.
 *
 * Designation source (the suite8MenuWatch WPS discipline, mirrored): KNOWN_SUITE8_ENTRIES (the
 * MPRF seed) UNION the Cascades/Extended/ subdirectories actually present, PLUS a depth-0
 * chokidar addDir watch so a designation forged AFTER boot seeds its library immediately.
 *
 * FT-006 CONCLUDING STAGE PATTERN (MANDATORY): the one-shot bootstrap iterates onto a
 * concluding stage; the chokidar handle persists in the closure; cleanup closes it.
 *
 * Citation: DIAMOND-SYNC-LIBRARY.md SL-1. Citation: suite8MenuWatch.principle.huirth.ts (the
 * WPS boot-sweep + live addDir + FT-006 shape, mirrored). Citation: suite8SyncLibrary.model.ts
 * (the additive seed + the Truth Law).
 */
import type { PrincipleFunction, MuxiumDeck, Concept } from 'stratimux';
import { createWatcher } from '../../../model/watcherSingleton.model';
import { type FSWatcher } from 'chokidar';
import { readdirSync } from 'node:fs';
import path from 'node:path';
import type { Suite8HuirthState, Suite8HuirthQualities } from '../suite8.type';
import { KNOWN_SUITE8_ENTRIES } from '../model/suite8Registration.model';
import {
  seedSyncLibraryAdditive,
  sinkSyncLibraryTelemetry,
  // D-MINT-SURFACE · the Twin Stand-Down sentinel (held model · never token-renamed).
  SYNC_USHER_CONCEPT_HOLDER,
} from '../../../model/scpSyncLibrary.model';

export type Suite8SyncLibrarySeedDeck = MuxiumDeck & {
  suite8: Concept<Suite8HuirthState, Suite8HuirthQualities>;
};

export type Suite8SyncLibrarySeedPrincipleType = PrincipleFunction<
  Suite8HuirthQualities,
  Suite8SyncLibrarySeedDeck,
  Suite8HuirthState
>;

const EXTENDED_ROOT_ABS = path.resolve(process.cwd(), 'Cascades', 'Extended');
const SEED_ADDDIR_DEBOUNCE_MS = 250;

export const suite8SyncLibrarySeedPrinciple: Suite8SyncLibrarySeedPrincipleType = ({ plan }) => {
  // D-MINT-SURFACE · THE TWIN STAND-DOWN GUARD — the seed arms the workspace-wide Extended
  // watcher (shared infrastructure). The literal below is INTENTIONAL: the mint engine renames
  // it in a copied twin while the sentinel (held model · outside the copy surface) always reads
  // the canonical holder. Mismatch = minted twin → stand down (a running twin would double-arm
  // the Extended watchers).
  const ownConceptName: string = 'suite8';
  if (ownConceptName !== SYNC_USHER_CONCEPT_HOLDER) {
    console.log(`[${ownConceptName} SyncLibrary] TWIN STAND-DOWN · the seed is held by '${SYNC_USHER_CONCEPT_HOLDER}' — no-op`);
    sinkSyncLibraryTelemetry('seed.twin-stand-down.skip', { ownConceptName, holder: SYNC_USHER_CONCEPT_HOLDER });
    return () => {};
  }
  console.log('[Suite8 SyncLibrary] Principle started · the boot registration (SL-1)');
  sinkSyncLibraryTelemetry('principle-start', { extendedRoot: EXTENDED_ROOT_ABS });

  const seeded = new Set<string>();
  let extendedDirWatcher: FSWatcher | null = null;
  let addDirDebounceTimer: NodeJS.Timeout | null = null;

  const seedDesignation = (designation: string): void => {
    const trimmed = designation.trim();
    if (trimmed.length === 0 || seeded.has(trimmed)) return;
    try {
      const result = seedSyncLibraryAdditive(trimmed);
      seeded.add(trimmed);
      console.log(
        '[Suite8 SyncLibrary] seeded ·',
        trimmed,
        '· localScp=',
        result.shape.localScp,
        result.wrote ? '· wrote' : '· unchanged',
      );
    } catch (err) {
      console.log('[Suite8 SyncLibrary] seed.skip · designation=', trimmed, '·', err);
      sinkSyncLibraryTelemetry('seed.skip', { designation: trimmed, error: String(err) });
    }
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

  const seedPlan = plan('Suite8 SyncLibrary Boot Seed (Huirth · SL-1)', ({ stage }) => [
    stage(
      ({ d, dispatch }) => {
        for (const entry of KNOWN_SUITE8_ENTRIES) {
          seedDesignation(entry.name);
        }
        for (const name of readExtendedSubdirectoryNames()) {
          seedDesignation(name);
        }
        sinkSyncLibraryTelemetry('boot-sweep', {
          seededCount: seeded.size,
          designations: [...seeded],
        });

        try {
          extendedDirWatcher = createWatcher('suite8SyncLibrarySeed#1', EXTENDED_ROOT_ABS, {
            persistent: true,
            ignoreInitial: true,
            depth: 0,
          });
          const handleAddDir = (): void => {
            if (addDirDebounceTimer) clearTimeout(addDirDebounceTimer);
            addDirDebounceTimer = setTimeout(() => {
              for (const name of readExtendedSubdirectoryNames()) {
                seedDesignation(name);
              }
              sinkSyncLibraryTelemetry('adddir-resweep', { seededCount: seeded.size });
            }, SEED_ADDDIR_DEBOUNCE_MS);
          };
          extendedDirWatcher.on('addDir', handleAddDir);
          extendedDirWatcher.on('error', (err) => {
            console.log('[Suite8 SyncLibrary] watch.skip · reason=chokidar-error ·', err);
          });
        } catch (err) {
          console.log('[Suite8 SyncLibrary] watch.skip · reason=arm-failed ·', err);
          sinkSyncLibraryTelemetry('live-adddir.skip', { reason: 'arm-failed', error: String(err) });
        }

        dispatch(d.muxium.e.muxiumKick(), { iterateStage: true });
      },
      { beat: 33 },
    ),
    stage(({ stagePlanner }) => {
      stagePlanner.conclude();
    }, {}),
  ]);

  return () => {
    console.log('[Suite8 SyncLibrary] Principle cleanup');
    sinkSyncLibraryTelemetry('cleanup', { seededCount: seeded.size });
    if (addDirDebounceTimer) {
      clearTimeout(addDirDebounceTimer);
      addDirDebounceTimer = null;
    }
    if (extendedDirWatcher) {
      try {
        extendedDirWatcher.close();
      } catch {
        /* already closed */
      }
      extendedDirWatcher = null;
    }
    seedPlan.conclude();
  };
};
