/**
 * graphiteScribeLocalityWatch.principle.huirth.ts — GLW-3 · THE EDITOR-LOCALITY SYNCLIBRARY WATCH (Lane B)
 *
 * The CMLS re-point extended to the Code Editor: the Selected Locality (the designation's
 * SyncLibrary.json `specified` key · WORKING in Lambda as of C894) re-points the folder the editor
 * OBSERVES. A Specified locality means the /editor-fs lanes serve from the TARGET SCP's tree; a null
 * (LOCAL) locality means they serve from process.cwd() — byte-identical to the frozen constant they
 * replaced. This principle is the trigger + the resolver + the publisher.
 *
 * LANE B (the ground's verdict · S4-GRAPHITE-EDITOR-LOCALITY-GROUND.md §2b/§5-GLW-3): a SERVER-SIDE
 * single-file chokidar watch on THIS designation's SyncLibrary (resolveSyncLibraryPath('Graphite
 * Scribe')), mirroring the suite8SyncUsher's per-designation library watch (suite8SyncUsher.principle
 * .huirth.ts:472-487 · change/add handlers + awaitWriteFinish) — disk IS the truth, restart-proof, no
 * relay dependency. On change AND ONCE at arm (the boot pass): resolveSyncLocality(designation) →
 *   - non-null (Specified) → dispatch { observedScpName: res.targetScp, observedRoot: res.root }
 *   - null (LOCAL · absent library · guarded fall-through · U5B stale-root) → dispatch
 *                               { observedScpName: '', observedRoot: process.cwd() } (THE HONEST-ABSENCE
 *                               LAW · the fall to LOCAL is EXPLICIT + a named skip-sink line).
 *
 * TWO EFFECTS per resolution (both in ONE stage-visible seat, dispatched serially · never a masquerade):
 *   1. dispatch graphiteScribeSetObservedRootHuirthBase (GLW-2 · the state truth the client header reads
 *      via its relay-fed locality face · GLW-5) — Base-maintenance (Seam 2 · single-dispatch-per-stage).
 *   2. setEditorObservedRoot(observedRoot) (GLW-4 · the module-published getter the editorFs lanes read
 *      per-request) — the effective re-point of the pull-only /editor-fs surface. Published DIRECTLY (not
 *      via a state selector) because the express/tool registrations carry NO graphite Deck (the vue.principle
 *      Deck is plain MuxiumDeck · the ground-vs-reality correction · GLW-4). State + getter move together.
 *
 * HAZARD-A (S4 Seam 4 · the no-leak invariant): the ONE library watcher is armed once at principle
 * start (it watches the SyncLibrary, not the target tree · it does NOT re-arm per re-point), torn down
 * in cleanup order timer → watcher → plan.conclude() — verbatim the menu-watch template
 * (graphiteScribeMenuWatch.principle.huirth.ts:227-253).
 *
 * FT-006 CONCLUDING STAGE PATTERN (MANDATORY · stratimux 0.3.295): the bootstrap plan's iterateStage
 * lands on a concluding Stage 2; the chokidar watcher + nextA pipe persist in the closure.
 *
 * Citation: graphiteScribeMenuWatch.principle.huirth.ts (HAZARD-A order · FT-006 · file-sunk telemetry).
 * Citation: suite8SyncUsher.principle.huirth.ts:472-487 (the per-designation library-watch idiom).
 * Citation: scpSyncLibrary.model.ts:337-391 (resolveSyncLocality · the U5B stale-root guard).
 * Citation: STRATIMUX-REFERENCE.md "🔄 Synchronizing Principle Pattern with setStage".
 */
import type { PrincipleFunction, MuxiumDeck, Concept } from 'stratimux';
import { watch as chokidarWatch, type FSWatcher } from 'chokidar';
import { appendFileSync, mkdirSync, statSync } from 'node:fs';
import path from 'node:path';
import type {
  GraphiteScribeHuirthState,
  GraphiteScribeHuirthQualities,
} from '../graphiteScribe.type';
import { DEFAULT_GRAPHITESCRIBE_DESIGNATION_NAME } from '../graphiteScribe.type';
import { graphiteScribeSetObservedRootHuirthBase } from '../qualities/graphiteScribeSetObservedRootHuirthBase.quality.huirth';
import { resolveSyncLibraryPath, resolveSyncLocality } from '../../../model/scpSyncLibrary.model';
import { setEditorObservedRoot } from '../../../model/editorFs.model';

export type GraphiteScribeLocalityWatchDeck = MuxiumDeck & {
  graphiteScribe: Concept<GraphiteScribeHuirthState, GraphiteScribeHuirthQualities>;
};

export type GraphiteScribeLocalityWatchPrincipleType = PrincipleFunction<
  GraphiteScribeHuirthQualities,
  GraphiteScribeLocalityWatchDeck,
  GraphiteScribeHuirthState
>;

// THIS designation — the RI dir basename under Cascades/Extended/ AND the SyncLibrary key resolved.
// C897 · THE DESIGNATION-FORM WOUND (field-convicted by the skip sink): the spaceless
// DEFAULT_GRAPHITESCRIBE_DESIGNATION_NAME ('GraphiteScribe') is a DIFFERENT axis — the
// LOCALITY designation is the Extended-dir form the page ref + the drawer + the registry
// all use. Watching the spaceless path resolved null and fell honestly to LOCAL forever.
const LOCALITY_DESIGNATION = 'Graphite Scribe';

// File-sunk telemetry — the console.logs below are LOST to nodemon (the C738 unobservable class). Every
// seat ALSO appends a JSONL line to the SCP-local Bridge rail so a drive can Conclude (grep) whether the
// principle booted, resolved, and re-pointed. Never-throw + the 2MB skip-guard (the menu-watch idiom).
const LOCALITY_WATCH_SINK_MAX_BYTES = 2 * 1024 * 1024;
const LOCALITY_WATCH_SINK_PATH = path.resolve(
  process.cwd(),
  'Cascades',
  'Bridge',
  'graphiteScribe-locality-watch.json',
);
const sinkLocalityWatchTelemetry = (seat: string, detail: Record<string, unknown> = {}): void => {
  try {
    mkdirSync(path.dirname(LOCALITY_WATCH_SINK_PATH), { recursive: true });
    try {
      if (statSync(LOCALITY_WATCH_SINK_PATH).size > LOCALITY_WATCH_SINK_MAX_BYTES) {
        return; // sink over the 2MB cap · skip{sink-cap} · never rotate here, never throw.
      }
    } catch {
      /* sink absent · the first append creates it */
    }
    appendFileSync(
      LOCALITY_WATCH_SINK_PATH,
      JSON.stringify({ ts: new Date().toISOString(), seat, ...detail }) + '\n',
      'utf8',
    );
  } catch {
    /* telemetry must never harm the watcher · skip */
  }
};

export const graphiteScribeLocalityWatchPrinciple: GraphiteScribeLocalityWatchPrincipleType = ({
  plan,
  nextA,
}) => {
  console.log('[GraphiteScribe LocalityWatch] Principle started · editor-locality SyncLibrary watch (GLW-3 · Lane B)');
  sinkLocalityWatchTelemetry('principle-start', { designation: LOCALITY_DESIGNATION });

  // HAZARD-A · the single library watcher handle (Principle-scope · closed in cleanup).
  let libraryWatcher: FSWatcher | null = null;
  // A light debounce so a burst of SyncLibrary writes (seed then writeSpecified) settles into one resolve.
  let resolveDebounceTimer: NodeJS.Timeout | null = null;
  const RESOLVE_DEBOUNCE_MS = 100;

  // THE ONE RESOLVE + RE-POINT — fired ONCE at arm (boot pass) and on every SyncLibrary change.
  // resolveSyncLocality reads the SyncLibrary FRESH per call (the Truth-Law source · restart-proof).
  // Non-null = Specified (the target's name + root); null = LOCAL (absent library · guarded fall ·
  // U5B stale-root) → THE HONEST-ABSENCE LAW: the fall is EXPLICIT + a named skip-sink line.
  const resolveAndRepoint = (occasion: 'arm' | 'change'): void => {
    const resolution = resolveSyncLocality(LOCALITY_DESIGNATION);
    const observedScpName = resolution ? resolution.targetScp : '';
    const observedRoot = resolution ? resolution.root : process.cwd();
    if (resolution === null) {
      // THE HONEST-ABSENCE LAW — the fall to LOCAL is never dark; the skip names itself (the guard
      // reason itself is sunk inside resolveSyncLocality · this is the graphite-local echo).
      sinkLocalityWatchTelemetry('locality-watch.skip', {
        occasion,
        designation: LOCALITY_DESIGNATION,
        reason: 'resolution-null-fall-to-local',
        observedRoot,
      });
      console.log('[GraphiteScribe LocalityWatch]', occasion, '· LOCAL · observing process.cwd()');
    } else {
      sinkLocalityWatchTelemetry('locality-watch.repoint', {
        occasion,
        designation: LOCALITY_DESIGNATION,
        observedScpName,
        observedRoot,
      });
      console.log('[GraphiteScribe LocalityWatch]', occasion, '· SPECIFIED · observing', observedScpName, '·', observedRoot);
    }
    // GLW-4 · publish into the module getter FIRST — the pull-only /editor-fs lanes read this
    // per-request, so the effective re-point is live the instant this returns (no relay latency).
    setEditorObservedRoot(observedRoot);
    // GLW-2 · dispatch the state pair (Base-maintenance · single-dispatch-per-stage · nextA async-safe
    // action-queue append · the SAME dispatch idiom the menu-watch uses for its SBIS Base).
    nextA(graphiteScribeSetObservedRootHuirthBase.actionCreator({ observedScpName, observedRoot }));
    // C898 · THE SERVER-SPEAKS-AFTER-REPOINT NOTIFY — the editor root is now re-pointed (the getter
    // published + the Base dispatched). This line is the race-honest signal the user's ruling names:
    // the server notifies AFTER the repoint, so a client refetch keyed to it can never out-race the
    // server serving the OLD tree. The client's live carrier is the already-live locality face
    // (currentS8Locality.specified · driven by the drawer→hydrate coupling + the suite8LocalityStcpRelay
    // SMRP broadcast · GROUND 2); with B1 this re-point now fires LIVE on the same disk write the face
    // rides, so the client's face-watch (deselect + settle-refetch) lands on a re-pointed server root.
    sinkLocalityWatchTelemetry('locality-watch.notify', {
      occasion,
      designation: LOCALITY_DESIGNATION,
      observedScpName,
      observedRoot,
      speaks: 'after-repoint',
    });
  };

  const localityWatchPlan = plan(
    'GraphiteScribe LocalityWatch (Huirth · editor-locality SyncLibrary watch · GLW-3)',
    ({ stage }) => [
      // Stage 1 · one-shot bootstrap — the BOOT PASS resolve (arm) publishes the standing locality
      // (LOCAL until a specified target is written), then arms the single library watcher so a
      // `specified` change on disk re-points the observed root live.
      stage(
        ({ d, dispatch }) => {
          console.log('[GraphiteScribe LocalityWatch] Stage 1 · boot resolve + arm library watch');
          // The boot pass — publishes the standing observed root ONCE (LOCAL anor a pre-set target).
          resolveAndRepoint('arm');
          // Arm the SyncLibrary watch. NEVER throws (arm failure = skip + telemetry · the SCP is never harmed).
          // C898 · THE F4 CURE (the pre-emptive C899/C900 idiom · alignment with suiteCascadeJsonWatcher's
          // armLocalitySignalWatch:534): a naive FILE-path watch DIES on writeSpecifiedAdditive
          // (scpSyncLibrary.model.ts:443) — the canonical rewrite some fs layers execute as
          // write-temp-then-rename swaps the inode and a single-file watch never fires 'change'. THE
          // FIELD SIGNATURE this cures: the editor re-points on bridge turn-over (the boot 'arm' pass
          // re-reads fresh) but NOT on a LIVE locality change (the single-file watch missed the write).
          // The chip already fires live because its owner (s8LocalityPageOwner) is refresh-coupled to
          // the drawer POST; the editor's ONLY carrier was this watch. Watch the PARENT DIR (depth 0) +
          // basename-gate on SyncLibrary.json — rename-immune, byte-parity with the proven cascade cure.
          try {
            const libPath = resolveSyncLibraryPath(LOCALITY_DESIGNATION);
            const libBasename = path.basename(libPath);
            libraryWatcher = chokidarWatch(path.dirname(libPath), {
              persistent: true,
              ignoreInitial: true,
              depth: 0,
              awaitWriteFinish: { stabilityThreshold: 100, pollInterval: 20 },
            });
            const onChange = (changed: string): void => {
              // basename-gate — only THIS designation's SyncLibrary.json re-points (sibling writes ignored).
              if (path.basename(changed) !== libBasename) return;
              if (resolveDebounceTimer) clearTimeout(resolveDebounceTimer);
              resolveDebounceTimer = setTimeout(() => resolveAndRepoint('change'), RESOLVE_DEBOUNCE_MS);
            };
            libraryWatcher.on('change', onChange);
            libraryWatcher.on('add', onChange);
            libraryWatcher.on('error', () => {
              /* never harm the SCP */
            });
            console.log('[GraphiteScribe LocalityWatch] chokidar armed on parent dir', path.dirname(libPath), '· gate', libBasename);
            sinkLocalityWatchTelemetry('library-watch-armed', {
              designation: LOCALITY_DESIGNATION,
              watchedDir: path.dirname(libPath),
              gateBasename: libBasename,
            });
          } catch (err) {
            console.log('[GraphiteScribe LocalityWatch] watch.skip · reason=arm-failed ·', err);
            sinkLocalityWatchTelemetry('library-watch.skip', {
              designation: LOCALITY_DESIGNATION,
              reason: 'arm-failed',
              error: String(err),
            });
          }
          dispatch(d.muxium.e.muxiumKick(), { iterateStage: true });
        },
        { beat: 33 },
      ),
      // FT-006 Concluding Stage Pattern — the iterateStage above LANDS HERE; the plan concludes cleanly
      // while the library watcher + nextA pipe persist independently in the closure.
      stage(({ stagePlanner }) => {
        stagePlanner.conclude();
      }, {}),
    ],
  );

  return () => {
    console.log('[GraphiteScribe LocalityWatch] Principle cleanup · closing library watcher');
    sinkLocalityWatchTelemetry('cleanup', { designation: LOCALITY_DESIGNATION });
    // HAZARD-A order: timer → watcher → plan.conclude() (verbatim the menu-watch template).
    if (resolveDebounceTimer) {
      clearTimeout(resolveDebounceTimer);
      resolveDebounceTimer = null;
    }
    if (libraryWatcher) {
      try {
        libraryWatcher.close();
      } catch {
        /* already closed */
      }
      libraryWatcher = null;
    }
    localityWatchPlan.conclude();
  };
};
