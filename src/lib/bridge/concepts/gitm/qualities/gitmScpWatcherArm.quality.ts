/**
 * gitmScpWatcherArm Quality · GITM 3LOC · the SCP (RED) location watcher arm
 *
 * The FOURTH chokidar FSWatcher committed to state (scpWatcher) — watches the ACTIVE SCP
 * directory (activeScpDir) EXCLUDING `.git/` only (an SCP is aware ONLY of itself · brief
 * §5 · the Cascade watcher already excludes scps/). So the live SCP change count tracks the
 * active SCP's own working tree.
 *
 * Active-SCP scoping (S4 R5): the SCP watcher RE-ARMS when activeScpDir changes (the active
 * SCP switches). Unlike the Base/Cascade arms (unconditional idempotent skip), this guard is
 * PATH-AWARE — it closes the old watcher and arms the new one on a path mismatch. When
 * activeScpDir is '' (no SCP active) the watcher is torn down (the RED location goes dormant).
 *
 * Idempotency: same activeScpDir + an existing watcher → no-op (push { watcher: null } →
 * Reducer returns {}). Partial-return law: Reducer returns ONLY { scpWatcher: watcher | null }.
 *
 * Template: gitmProjectWatcherArm.quality.ts (Method+Reducer+Bucket · chokidar opts).
 * Citation: GITM-3LOC-S3-OCHRE.md Wave C.1 · GITM-3LOC-S4-GREEN.md §2c (active-SCP re-arm).
 */

import {
  createQualityCardWithPayload,
  createMethodWithConcepts,
  selectPayload,
  muxiumConclude,
  strategySuccess,
  type Concept,
} from 'stratimux';
import type { FSWatcher } from 'chokidar';
import { createWatcher } from '../../../watcherSingleton.model';
import { existsSync } from 'node:fs';
import { log } from '../../../debugLog';
import { getActiveScsBridgeMuxiumHandle } from '../../../scsBridgeMuxium';
import type { GitmState } from '../gitm.types';
import type { GitmLocationWatcherArmPayload, GitmScpWatcherArm } from './types';

export type { GitmScpWatcherArm };

// The bucket carries the next watcher (or null to clear / no-op). The module-scope
// scpWatchedPath remembers WHICH dir the live watcher watches — the path-aware re-arm guard.
interface ScpArmBucketItem {
  watcher: FSWatcher | null;
  clear: boolean; // true → reducer should set scpWatcher to null (torn down / dormant)
}

const scpArmBucket: ScpArmBucketItem[] = [];
let scpWatchedPath = '';

type GitmSelfDeck = {
  gitm: Concept<GitmState, Record<string, unknown>>;
};

export const gitmScpWatcherArm = createQualityCardWithPayload<
  GitmState,
  GitmLocationWatcherArmPayload,
  GitmSelfDeck
>({
  type: 'Gitm Scp Watcher Arm',
  reducer: (state) => {
    const item = scpArmBucket.pop();
    if (!item) {
      return {};
    }
    if (item.clear) {
      return { scpWatcher: null };
    }
    if (item.watcher === null) {
      return {};
    }
    return { scpWatcher: item.watcher };
  },
  methodCreator: () =>
    createMethodWithConcepts(({ action, deck }) => {
      selectPayload<GitmLocationWatcherArmPayload>(action);

      const activeScpDir = deck.gitm.k.activeScpDir.select();
      const existing = deck.gitm.k.scpWatcher.select();

      // No active SCP → tear down any live watcher (the RED location goes dormant).
      if (activeScpDir === '') {
        if (existing !== null) {
          void existing.close();
          scpWatchedPath = '';
          scpArmBucket.push({ watcher: null, clear: true });
        } else {
          scpArmBucket.push({ watcher: null, clear: false });
        }
        return action.strategy ? strategySuccess(action.strategy) : muxiumConclude();
      }

      // Path-aware idempotency: same SCP + a live watcher → no-op.
      if (existing !== null && scpWatchedPath === activeScpDir) {
        log('gitm.scp.arm.skip-idempotent', { activeScpDir });
        scpArmBucket.push({ watcher: null, clear: false });
        return action.strategy ? strategySuccess(action.strategy) : muxiumConclude();
      }

      // Active SCP changed (or first arm) → close the old watcher, arm the new path.
      if (existing !== null) {
        console.log('[Gitm] SCP switched, re-arming scp watcher:', scpWatchedPath, '→', activeScpDir);
        void existing.close();
      }

      if (!existsSync(activeScpDir)) {
        log('gitm.scp.arm.exists-fail', { activeScpDir });
        scpArmBucket.push({ watcher: null, clear: false });
        return action.strategy ? strategySuccess(action.strategy) : muxiumConclude();
      }

      console.log('[Gitm] Arming SCP chokidar watcher (self · excl .git):', activeScpDir);
      const scpUserCwd = deck.gitm.k.userCwd.select();
      let watcher: FSWatcher;
      try {
        watcher = createWatcher('gitmScpWatcherArm', [activeScpDir], scpUserCwd, {
          ignored: [/(^|[/\\])\.git([/\\]|$)/],
          ignoreInitial: true,
          persistent: true,
          awaitWriteFinish: {
            stabilityThreshold: 300,
            pollInterval: 100,
          },
        });
      } catch (err) {
        console.error('[Gitm] chokidar.watch (scp) failed:', err);
        scpArmBucket.push({ watcher: null, clear: false });
        return action.strategy ? strategySuccess(action.strategy) : muxiumConclude();
      }

      watcher.on('error', (err: Error) => {
        console.error('[Gitm] chokidar scp error:', err);
      });

      // RELIABLE BIND (027 Concluder · arm.armed=1 but dial.bound=0): the gitmScpDialPrinciple's
      // selector-bound Stage-2 rebind is timing-flaky — it caught the arm in 025 but NOT in 027, so
      // no file event fired a recount → badge stuck at 0. Bind the recount handlers HERE, where the
      // watcher is created (deterministic). The chokidar callback fires async outside this action's
      // context → dispatch via the live muxium handle (null-guarded; set by the time a file changes).
      let armDebounce: ReturnType<typeof setTimeout> | null = null;
      const onScpFsEvent = (): void => {
        if (armDebounce !== null) clearTimeout(armDebounce);
        armDebounce = setTimeout(() => {
          armDebounce = null;
          log('gitm.scp.arm.event');
          const h = getActiveScsBridgeMuxiumHandle();
          if (h !== null) {
            h.muxium.dispatch(
              h.muxium.deck.d.gitm.e.gitmRecountLocation({
                location: 'scp',
                clearError: false,
              }) as never,
            );
            h.muxium.dispatch(h.muxium.deck.d.gitm.e.gitmSetStatus({} as never) as never);
          }
        }, 400);
      };
      watcher.on('add', onScpFsEvent);
      watcher.on('change', onScpFsEvent);
      watcher.on('unlink', onScpFsEvent);
      watcher.on('addDir', onScpFsEvent);
      watcher.on('unlinkDir', onScpFsEvent);

      scpWatchedPath = activeScpDir;
      log('gitm.scp.arm.armed', { activeScpDir });
      scpArmBucket.push({ watcher, clear: false });
      return action.strategy ? strategySuccess(action.strategy) : muxiumConclude();
    }),
});
