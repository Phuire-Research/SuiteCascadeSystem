/**
 * gitmChangedial Principle · GITM A↔B-R (#641-R) · CHANGEDIAL — WGHA bind + 500ms debounce
 *
 * Subscribes to k.projectWatcher. When the FSWatcher transitions null → non-null
 * (gitmProjectWatcherArm Reducer commits), binds chokidar handlers via the closure-captured
 * nextA. Each project-root event debounces 500ms then dispatches gitmRecountChanges (one
 * focused recount of the live dirty-file count → changesPrimedOnB).
 *
 * The 500ms debounce is INDEPENDENT of gitmWatchdial's 200ms (.git/-only) — the project
 * root fires on EVERY working-tree save, so a longer debounce avoids STARC thrash during
 * active development (S1 DELTA 2 HAZARD).
 *
 * WGHA (WeakSet-Guarded Handler Attachment) prevents duplicate binding across plan
 * re-fires. FT-006: the plan ends with conclude() (the terminal stage).
 *
 * Boot-time initial recount: a plan SETUP STAGE (Stage 1 · the Setup Stage Law) dispatches
 * the initial recount through the LIVE action queue + iterateStage so changesPrimedOnB is
 * correct at boot, not only after the first file event.
 *
 * Template: gitmWatchdial.principle.ts (selector-driven WGHA · Setup Stage Law · FT-006).
 * Citation: GITM-AB-R-S3-YELLOW-BLUEPRINT.md §W2d (Nb2).
 */

import type { PrincipleFunction } from 'stratimux';
import type { FSWatcher } from 'chokidar';
import type { GitmState } from '../gitm.types';
import type { GitmQualities } from '../gitm.concept';
import type { GitmRecountChangesPayload } from '../qualities/types';

// WGHA · one WeakSet for the projectRoot watcher; GC-safe via WeakSet semantics.
const boundProjectWatchers = new WeakSet<FSWatcher>();

let changeDebounceTimer: ReturnType<typeof setTimeout> | null = null;

// GITM Branch-Flow (#644 · Decision A) — the bridge's own bookkeeping files live under
// Cascades/Bridge/ (gitm.json / debug.json / sessions.json). Those writes fire CHANGEDIAL but
// are NOT user changes, so they must NOT clear the transient action-error (or the bridge's own
// sub-second write would clear it before the user can read it). A REAL user-tree change is any
// CHANGEDIAL path OUTSIDE Cascades/Bridge/ — only THAT retires the error. Separator-agnostic.
const isBridgeBookkeepingPath = (eventPath: string): boolean => {
  const normalized = eventPath.replace(/\\/g, '/');
  return normalized.includes('/Cascades/Bridge/') || normalized.startsWith('Cascades/Bridge/');
};

export const gitmChangedialPrinciple: PrincipleFunction<
  GitmQualities,
  void,
  GitmState
> = ({ k_, d_, nextA, plan }) => {
  // Self-deck cast for action-creator access (void Deck generic erases the structural
  // check on d_; property name MUST match the Quality type verbatim).
  const selfDeck = d_ as unknown as {
    gitm: { e: { gitmRecountChanges: (payload: GitmRecountChangesPayload) => unknown } };
  };

  const watcherPlan = plan('Gitm Changedial Bind', ({ stage, conclude }) => [
    // Stage 1 - THE SETUP: the boot-time initial recount through the LIVE action queue.
    stage(({ dispatch }) => {
      console.log('[Gitm Changedial] Setup stage - the boot-time initial change recount');
      // GITM Branch-Flow (#644 · Decision A) — boot recount is NOT a user change → clearError:false.
      dispatch(selfDeck.gitm.e.gitmRecountChanges({ clearError: false }) as never, {
        iterateStage: true,
      });
    }, { beat: 33 }),
    // Stage 2 - THE ACTIVE MONITORING: the persistent selector-driven watcher bind.
    stage(({ k }) => {
      const watcher = k.projectWatcher.select();
      if (watcher === null) return;
      if (boundProjectWatchers.has(watcher)) return;

      console.log('[Gitm Changedial] Binding handlers to CHANGEDIAL chokidar watcher');
      boundProjectWatchers.add(watcher);

      // GITM Branch-Flow (#644 · Decision A) — track whether ANY real user-tree event (a path
      // outside Cascades/Bridge/) occurred during the debounce window, so a trailing bookkeeping
      // write can't mask a real change. Reset on each fire.
      let sawUserTreeChange = false;
      const handleProjectEvent = (eventPath: string) => {
        if (!isBridgeBookkeepingPath(eventPath)) sawUserTreeChange = true;
        if (changeDebounceTimer !== null) clearTimeout(changeDebounceTimer);
        changeDebounceTimer = setTimeout(() => {
          changeDebounceTimer = null;
          const clearError = sawUserTreeChange;
          sawUserTreeChange = false;
          nextA(selfDeck.gitm.e.gitmRecountChanges({ clearError }) as never);
        }, 500);
      };

      watcher.on('add', handleProjectEvent);
      watcher.on('change', handleProjectEvent);
      watcher.on('unlink', handleProjectEvent);
      watcher.on('addDir', handleProjectEvent);
      watcher.on('unlinkDir', handleProjectEvent);
    }, {
      selectors: [k_.projectWatcher],
      beat: 5,
    }),
    conclude(),
  ]);

  return () => {
    watcherPlan.conclude();
    if (changeDebounceTimer !== null) clearTimeout(changeDebounceTimer);
  };
};
