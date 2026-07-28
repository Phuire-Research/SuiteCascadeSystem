/**
 * gitmLocationDials Principles · GITM 3LOC · the three sibling location bind principles
 *
 * THREE sibling principles, each cloning the gitmChangedial WGHA + debounce pattern, each
 * with its OWN WeakSet + its OWN per-location debounce timer (the per-location keying — a
 * single shared module-scope timer would let one location's debounce cancel another's · S4
 * R3). Each binds its location's FSWatcher and dispatches the unified gitmRecountLocation.
 *
 *   - gitmBaseDial    — binds projectWatcher (userCwd excl .git · the Base location · YELLOW).
 *                       FOLDS gitmChangedial: writes changesPrimedOnB (back-compat) AND
 *                       locationBase + mostRecentLocation via gitmRecountLocation('base').
 *                       Carries the Branch-Flow clearError gate (path outside Cascades/Bridge/).
 *   - gitmCascadeDial — binds cascadeWatcher (Cascades/ excl .git+scps/ · BLUE).
 *   - gitmScpDial     — binds scpWatcher (the active SCP self · RED) + selector-binds
 *                       activeScpDir so a re-arm rebinds the new path.
 *
 * Each: Stage 1 boot recount (Setup Stage Law · iterateStage) → Stage 2 selector-bound WGHA
 * handler bind + 500ms debounce → gitmRecountLocation({ location }). FT-006 conclude().
 *
 * Template: gitmChangedial.principle.ts (selector-driven WGHA · Setup Stage Law · debounce).
 * Citation: GITM-3LOC-S3-OCHRE.md Wave C.2.
 */

import type { PrincipleFunction } from 'stratimux';
import type { FSWatcher } from 'chokidar';
import { log } from '../../../debugLog';
import type { GitmState } from '../gitm.types';
import type { GitmQualities } from '../gitm.concept';
import type { GitmRecountLocationPayload } from '../qualities/types';

// ────────────────────────────────────────────────
// BRANCH-FLOW BOOKKEEPING GATE (Base only · clone of gitmChangedial:40-43)
// ────────────────────────────────────────────────
// The bridge's own Cascades/Bridge/*.json writes fire the Base watcher but are NOT user
// changes — only a path OUTSIDE Cascades/Bridge/ retires the transient action-error.
const isBridgeBookkeepingPath = (eventPath: string): boolean => {
  const normalized = eventPath.replace(/\\/g, '/');
  return normalized.includes('/Cascades/Bridge/') || normalized.startsWith('Cascades/Bridge/');
};

type RecountDispatch = {
  gitm: {
    e: {
      gitmRecountLocation: (payload: GitmRecountLocationPayload) => unknown;
      // GITM A↔B Auto-Induction — coupled to the DIAL bind below (not only the launch seams).
      gitmAutoInductAB: (payload: Record<string, never>) => unknown;
      // SELF-ARM (Cycle 271) — the dial arms the SCP watcher when a dir binds with none.
      gitmScpWatcherArm: (payload: Record<string, never>) => unknown;
    };
  };
};

// ════════════════════════════════════════════════
// gitmBaseDial — the Base (YELLOW) location · FOLDS gitmChangedial
// ════════════════════════════════════════════════

const boundBaseWatchers = new WeakSet<FSWatcher>();
let baseDebounceTimer: ReturnType<typeof setTimeout> | null = null;

export const gitmBaseDialPrinciple: PrincipleFunction<GitmQualities, void, GitmState> = ({
  k_,
  d_,
  nextA,
  plan,
}) => {
  const selfDeck = d_ as unknown as RecountDispatch;

  const watcherPlan = plan('Gitm Base Dial Bind', ({ stage, conclude }) => [
    stage(({ dispatch }) => {
      console.log('[Gitm Base Dial] Setup stage - boot-time initial Base recount');
      dispatch(
        selfDeck.gitm.e.gitmRecountLocation({ location: 'base', clearError: false }) as never,
        { iterateStage: true },
      );
    }, { beat: 33 }),
    stage(({ k }) => {
      const watcher = k.projectWatcher.select();
      if (watcher === null) return;
      if (boundBaseWatchers.has(watcher)) return;
      console.log('[Gitm Base Dial] Binding handlers to Base (projectRoot) watcher');
      boundBaseWatchers.add(watcher);

      let sawUserTreeChange = false;
      const handle = (eventPath: string) => {
        if (!isBridgeBookkeepingPath(eventPath)) sawUserTreeChange = true;
        if (baseDebounceTimer !== null) clearTimeout(baseDebounceTimer);
        baseDebounceTimer = setTimeout(() => {
          baseDebounceTimer = null;
          const clearError = sawUserTreeChange;
          sawUserTreeChange = false;
          nextA(
            selfDeck.gitm.e.gitmRecountLocation({ location: 'base', clearError }) as never,
          );
        }, 500);
      };
      watcher.on('add', handle);
      watcher.on('change', handle);
      watcher.on('unlink', handle);
      watcher.on('addDir', handle);
      watcher.on('unlinkDir', handle);
    }, { selectors: [k_.projectWatcher], beat: 5 }),
    conclude(),
  ]);

  return () => {
    watcherPlan.conclude();
    if (baseDebounceTimer !== null) clearTimeout(baseDebounceTimer);
  };
};

// ════════════════════════════════════════════════
// gitmCascadeDial — the Cascade (BLUE) location
// ════════════════════════════════════════════════

const boundCascadeWatchers = new WeakSet<FSWatcher>();
let cascadeDebounceTimer: ReturnType<typeof setTimeout> | null = null;

export const gitmCascadeDialPrinciple: PrincipleFunction<GitmQualities, void, GitmState> = ({
  k_,
  d_,
  nextA,
  plan,
}) => {
  const selfDeck = d_ as unknown as RecountDispatch;

  const watcherPlan = plan('Gitm Cascade Dial Bind', ({ stage, conclude }) => [
    stage(({ dispatch }) => {
      console.log('[Gitm Cascade Dial] Setup stage - boot-time initial Cascade recount');
      dispatch(
        selfDeck.gitm.e.gitmRecountLocation({ location: 'cascade', clearError: false }) as never,
        { iterateStage: true },
      );
    }, { beat: 33 }),
    stage(({ k }) => {
      const watcher = k.cascadeWatcher.select();
      if (watcher === null) return;
      if (boundCascadeWatchers.has(watcher)) return;
      console.log('[Gitm Cascade Dial] Binding handlers to Cascade watcher');
      boundCascadeWatchers.add(watcher);

      const handle = () => {
        if (cascadeDebounceTimer !== null) clearTimeout(cascadeDebounceTimer);
        cascadeDebounceTimer = setTimeout(() => {
          cascadeDebounceTimer = null;
          nextA(
            selfDeck.gitm.e.gitmRecountLocation({ location: 'cascade', clearError: false }) as never,
          );
        }, 500);
      };
      watcher.on('add', handle);
      watcher.on('change', handle);
      watcher.on('unlink', handle);
      watcher.on('addDir', handle);
      watcher.on('unlinkDir', handle);
    }, { selectors: [k_.cascadeWatcher], beat: 5 }),
    conclude(),
  ]);

  return () => {
    watcherPlan.conclude();
    if (cascadeDebounceTimer !== null) clearTimeout(cascadeDebounceTimer);
  };
};

// ════════════════════════════════════════════════
// gitmScpDial — the SCP (RED) location · active-SCP scoped
// ════════════════════════════════════════════════

const boundScpWatchers = new WeakSet<FSWatcher>();
let scpDebounceTimer: ReturnType<typeof setTimeout> | null = null;
// SELF-ARM (Cycle 271 · the 073 root): gitmScpWatcherArm's only live dispatch is the bridge BOOT
// (scsBridgeMuxium:201) — when activeScpDir is still ''. An SCP that binds LATER by dir-detection
// never gets a watcher → the dial logs no-watcher and returns → no bind → NO INDUCT → stableBranch
// stays '' → the whole A/B surface dead (073). The dial now ARMS the watcher itself when it sees a
// dir with no watcher — once per distinct dir (loop guard).
let lastArmAttemptDir = '';
// Q2 Bug-1 (page-view induction guard · 062) — the Stage-2 selector [scpWatcher, activeScpDir]
// re-fires on EVERY new FSWatcher instance (5+ gitmScpWatcherArm callers re-arm the watcher,
// including a GitM page-view reconnect). The WeakSet above blocks re-BINDING handlers but NOT the
// auto-induct nextA below → merely VIEWING GitM created + switched to a b/ branch with no user
// turn-over (the user-reported poppy). Gate the induct to fire at most once per DISTINCT
// activeScpDir: a fresh bind of a new SCP still inducts; a same-SCP re-arm skips.
let lastInductedScpDir = '';

export const gitmScpDialPrinciple: PrincipleFunction<GitmQualities, void, GitmState> = ({
  k_,
  d_,
  nextA,
  plan,
}) => {
  const selfDeck = d_ as unknown as RecountDispatch;

  const watcherPlan = plan('Gitm Scp Dial Bind', ({ stage, conclude }) => [
    stage(({ dispatch }) => {
      console.log('[Gitm Scp Dial] Setup stage - boot-time initial SCP recount');
      dispatch(
        selfDeck.gitm.e.gitmRecountLocation({ location: 'scp', clearError: false }) as never,
        { iterateStage: true },
      );
    }, { beat: 33 }),
    // Stage 2 also selector-binds activeScpDir so a re-arm (active SCP switch) rebinds the
    // handlers to the freshly-armed scpWatcher.
    stage(({ k }) => {
      const watcher = k.scpWatcher.select();
      const activeScpDir = k.activeScpDir.select();
      if (watcher === null) {
        log('gitm.scp.dial.no-watcher', { activeScpDir });
        // SELF-ARM: a dir with no watcher = the boot arm ran before the SCP bound (dir-detection).
        // Arm now — the new watcher lands in state, this selector re-fires, the bind + induct run.
        if (activeScpDir.length > 0 && activeScpDir !== lastArmAttemptDir) {
          lastArmAttemptDir = activeScpDir;
          log('gitm.scp.dial.self-arm', { activeScpDir });
          nextA(selfDeck.gitm.e.gitmScpWatcherArm({}) as never);
        }
        return;
      }
      if (boundScpWatchers.has(watcher)) return;
      console.log('[Gitm Scp Dial] Binding handlers to SCP watcher');
      log('gitm.scp.dial.bound', { activeScpDir });
      boundScpWatchers.add(watcher);
      // GITM A↔B Auto-Induction (BIND-PATH-AGNOSTIC fix · 041) — the SCP is now bound
      // (activeScpDir set) via the dial-DETECTED path, which is how a FRESH install binds: the SCP
      // server comes up under nodemon and the bridge binds it by dir-detection, so NO launch seam
      // fires. The launch-seam dispatch (scsBridgeLaunchScp/Runtime/Activate) only covers
      // bridge-LAUNCHED SCPs — so without this, a freshly-installed SCP never inducts A/B and every
      // turn-over hits the target-branch-empty guard. nextA (the non-stage dispatch the watcher
      // handler below uses) fires it once at bind; gitmAutoInductAB self-guards on
      // abMode==='idle' && stableBranch==='' so it acts once per cycle no matter how many bind
      // paths reach it. The freshness signal is `gitm.autoinduct.fire` in debug.json.
      // Q2 Bug-1: only auto-induct on the FIRST bind of a distinct SCP dir. A page-view re-arm
      // rebinds the handlers (above) but must NOT re-fire the induct — else b/ is created + checked
      // out with no user turn-over. New SCP dir → induct; same SCP re-arm (page-view) → skip.
      if (activeScpDir.length > 0 && activeScpDir !== lastInductedScpDir) {
        lastInductedScpDir = activeScpDir;
        log('gitm.scp.dial.autoinduct-fire', { activeScpDir });
        nextA(selfDeck.gitm.e.gitmAutoInductAB({}) as never);
      } else {
        log('gitm.scp.dial.autoinduct-skip', {
          activeScpDir,
          reason: activeScpDir.length === 0 ? 'empty-dir' : 'already-inducted-this-dir',
        });
      }

      const handle = () => {
        log('gitm.scp.dial.event');
        if (scpDebounceTimer !== null) clearTimeout(scpDebounceTimer);
        scpDebounceTimer = setTimeout(() => {
          scpDebounceTimer = null;
          nextA(
            selfDeck.gitm.e.gitmRecountLocation({ location: 'scp', clearError: false }) as never,
          );
        }, 500);
      };
      watcher.on('add', handle);
      watcher.on('change', handle);
      watcher.on('unlink', handle);
      watcher.on('addDir', handle);
      watcher.on('unlinkDir', handle);
    }, { selectors: [k_.scpWatcher, k_.activeScpDir], beat: 5 }),
    conclude(),
  ]);

  return () => {
    watcherPlan.conclude();
    if (scpDebounceTimer !== null) clearTimeout(scpDebounceTimer);
  };
};
