/**
 * gitmWatcherArmForScp Quality · MULTI-SCP GITM MUXIFICATION (Fork B · MC-W2 · THE WATCHER PLURALITY)
 *
 * Arms a PER-SCP watcher pair (registry.armWatchersForScp · gitmWatcherRegistry.model) for the scpDir
 * in the payload — the .git watcher + the tree watcher, MIRRORING the single-watcher chokidar options.
 * The event callbacks dispatch STATUS + RECOUNT for THAT scpDir, threading originScpName=scpDir so the
 * MC-W1 resolution (resolveGitmTargetCwd) routes them to the CALLING SCP's OWN repo (not the active one).
 *
 * Dispatched on spawn SUCCESS beside gitmSetActiveScpDir (MC-W2 step 8). Reducer returns {} — the pair
 * lives module-scope in the registry (the FSWatcher precedent · gitmScpWatcherArm), the flat GitmState
 * gitWatcher/scpWatcher fields are UNTOUCHED (the ACTIVE SCP still uses those · the materialized-view law).
 *
 * Template: gitmScpWatcherArm.quality.ts (Method+Reducer+Bucket · chokidar arm · live-handle dispatch).
 * Citation: MC-W2 (THE WATCHER PLURALITY · brief step 7).
 */

import {
  createQualityCardWithPayload,
  createMethodWithConcepts,
  selectPayload,
  muxiumConclude,
  strategySuccess,
  type Concept,
} from 'stratimux';
import { isAbsolute, resolve } from 'node:path';
import { log } from '../../../debugLog';
import { getActiveScsBridgeMuxiumHandle } from '../../../scsBridgeMuxium';
import { armWatchersForScp } from '../model/gitmWatcherRegistry.model';
import type { GitmState } from '../gitm.types';
import type { GitmWatcherForScpPayload, GitmWatcherArmForScp } from './types';

export type { GitmWatcherArmForScp };

type GitmSelfDeck = {
  gitm: Concept<GitmState, Record<string, unknown>>;
};

export const gitmWatcherArmForScp = createQualityCardWithPayload<
  GitmState,
  GitmWatcherForScpPayload,
  GitmSelfDeck
>({
  type: 'Gitm Watcher Arm For Scp',
  // No flat-state mutation — the per-SCP watcher pair lives module-scope in the registry (the FSWatcher
  // precedent · the flat state's own watchers are untouched). Partial-return law: return {}.
  reducer: () => ({}),
  methodCreator: () =>
    createMethodWithConcepts(({ action, deck }) => {
      const { scpDir: rawScpDir } = selectPayload<GitmWatcherForScpPayload>(action);
      const userCwd = deck.gitm.k.userCwd.select();

      if (rawScpDir === '') {
        log('gitm.registry.arm.skip-empty');
        return action.strategy ? strategySuccess(action.strategy) : muxiumConclude();
      }
      // SLICE/WATCHER KEY LAW — canonicalize to ABSOLUTE against userCwd (the FSM passes entry.path,
      // which is RELATIVE · the same absolute form gitmSetActiveScpDir binds + resolveGitmTargetCwd
      // returns) so the registry/slice key matches the GITEP fan-out key (no silent split).
      const scpDir = isAbsolute(rawScpDir) ? rawScpDir : resolve(userCwd, rawScpDir);

      // A .git event (branch/commit/index/stash) → refresh THAT SCP's status via gitmSetStatus with
      // originScpName=scpDir so the STARC read targets its own repo (MC-W1). A debounce guards the burst.
      let gitDebounce: ReturnType<typeof setTimeout> | null = null;
      const onGitEvent = (): void => {
        if (gitDebounce !== null) clearTimeout(gitDebounce);
        gitDebounce = setTimeout(() => {
          gitDebounce = null;
          log('gitm.registry.git.event', { scpDir });
          const h = getActiveScsBridgeMuxiumHandle();
          if (h !== null) {
            h.muxium.dispatch(
              h.muxium.deck.d.gitm.e.gitmSetStatus({ originScpName: scpDir } as never) as never,
            );
          }
        }, 200);
      };

      // A working-tree event → recount THAT SCP's changes via gitmRecountLocation('scp') with
      // originScpName=scpDir (MC-W1), then refresh status. Same seam the single tree watcher fires.
      let treeDebounce: ReturnType<typeof setTimeout> | null = null;
      const onTreeEvent = (): void => {
        if (treeDebounce !== null) clearTimeout(treeDebounce);
        treeDebounce = setTimeout(() => {
          treeDebounce = null;
          log('gitm.registry.tree.event', { scpDir });
          const h = getActiveScsBridgeMuxiumHandle();
          if (h !== null) {
            h.muxium.dispatch(
              h.muxium.deck.d.gitm.e.gitmRecountLocation({
                location: 'scp',
                clearError: false,
                originScpName: scpDir,
              } as never) as never,
            );
            h.muxium.dispatch(
              h.muxium.deck.d.gitm.e.gitmSetStatus({ originScpName: scpDir } as never) as never,
            );
          }
        }, 400);
      };

      armWatchersForScp(scpDir, userCwd, onGitEvent, onTreeEvent);
      log('gitm.registry.arm.dispatched', { scpDir });
      return action.strategy ? strategySuccess(action.strategy) : muxiumConclude();
    }),
});
