/**
 * gitmWatchdial Principle · GITM D2 (#633) · WATCHDIAL — WGHA bind + debounce
 *
 * Subscribes to k.gitWatcher. When the FSWatcher transitions null → non-null
 * (Arm Reducer commits), binds chokidar handlers via the closure-captured nextA.
 * Each `.git` event debounces 200ms then dispatches gitmSetStatus (one STARC
 * read collapsing the burst — `.git/index` fires multiple sub-events per
 * `git add`; awaitWriteFinish:300 + debounce:200 ⇒ no redundant reads).
 *
 * WGHA (WeakSet-Guarded Handler Attachment) prevents duplicate binding across
 * plan re-fires. FT-006: the plan ends with conclude() (the terminal stage).
 *
 * Boot-time initial read: a plan SETUP STAGE (Stage 1 · the Setup Stage Law) dispatches
 * the initial STARC read through the LIVE action queue + iterateStage into the monitoring
 * stage. (The prior body-nextA fired before the muxium queue was live — the lost dispatch.)
 *
 * Template: scpRegistryWatcher.principle.ts (selector-driven WGHA · FT-006 conclude)
 *           scpMessageRouter.principle.ts (nextA closure from principle body)
 * Citation: GITM-D2-S3-YELLOW-BLUEPRINT.md §5a
 * Citation: M59 (no actionQue cross-Concept) · M60 · M62 (handlers fire AFTER Reducer)
 */

import type { PrincipleFunction } from 'stratimux';
import type { FSWatcher } from 'chokidar';
import type { GitmState } from '../gitm.types';
import type { GitmQualities } from '../gitm.concept';
import type { GitmSetStatusPayload } from '../qualities/types';

// WGHA · one WeakSet for the gitDir watcher; GC-safe via WeakSet semantics.
const boundGitWatchers = new WeakSet<FSWatcher>();

let debounceTimer: ReturnType<typeof setTimeout> | null = null;

export const gitmWatchdialPrinciple: PrincipleFunction<
  GitmQualities,
  void,
  GitmState
> = ({ k_, d_, nextA, plan }) => {
  // Self-deck cast for action-creator access (void Deck generic erases the
  // structural check on d_; property name MUST match the Quality type verbatim).
  const selfDeck = d_ as unknown as {
    gitm: { e: { gitmSetStatus: (payload: GitmSetStatusPayload) => unknown } };
  };

  // THE SETUP STAGE LAW (the user diagnosis · the suite8MenuWatch canon): the boot-time
  // initial read was previously a nextA in the principle BODY — fired during concept
  // initialization, BEFORE the muxium action queue is live, and silently LOST. The state
  // never populated, lastReadAt stayed 0, the GITEP writer gate never passed, and
  // gitm.json was never written until a .git event woke the debounce. The dispatch belongs
  // in a PLAN STAGE (the muxium is provably live when stages run): Stage 1 = the one-shot
  // SETUP dispatching the initial STARC read + iterateStage -> Stage 2 = the persistent
  // monitoring bind -> the FT-006 concluding terminal.
  const watcherPlan = plan('Gitm Watchdial Bind', ({ stage, conclude }) => [
    // Stage 1 - THE SETUP: the initial read through the LIVE action queue.
    stage(({ dispatch }) => {
      console.log('[Gitm Watchdial] Setup stage - the boot-time initial STARC read');
      dispatch(selfDeck.gitm.e.gitmSetStatus({} as GitmSetStatusPayload) as never, {
        iterateStage: true,
      });
    }, { beat: 33 }),
    // Stage 2 - THE ACTIVE MONITORING: the persistent selector-driven watcher bind.
    stage(({ k }) => {
      const watcher = k.gitWatcher.select();
      if (watcher === null) return;
      if (boundGitWatchers.has(watcher)) return;

      console.log('[Gitm Watchdial] Binding handlers to chokidar watcher');
      boundGitWatchers.add(watcher);

      const handleGitEvent = (_eventPath: string) => {
        if (debounceTimer !== null) clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
          debounceTimer = null;
          nextA(selfDeck.gitm.e.gitmSetStatus({} as GitmSetStatusPayload) as never);
        }, 200);
      };

      watcher.on('add', handleGitEvent);
      watcher.on('change', handleGitEvent);
      watcher.on('unlink', handleGitEvent);
      watcher.on('addDir', handleGitEvent);
      watcher.on('unlinkDir', handleGitEvent);
    }, {
      selectors: [k_.gitWatcher],
      beat: 5,
    }),
    conclude(),
  ]);

  return () => {
    watcherPlan.conclude();
    if (debounceTimer !== null) clearTimeout(debounceTimer);
  };
};
