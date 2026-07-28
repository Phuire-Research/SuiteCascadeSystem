/**
 * scpRegistryDirectoryWatcherArm · Phase B.1 · Cycle 129
 *
 * Method-and-Reducer Quality. Method instantiates chokidar.watch on observedPath
 * (mkdir -p first), pushes FSWatcher into module-scoped armBucket, returns
 * strategySuccess. Reducer pops bucket and commits FSWatcher to
 * state.directoryWatcher (M60 State-or-Payload Anor compliance).
 *
 * Handler binding (addDir/change/unlinkDir → dispatch FsScpAdded/Changed/Removed)
 * is performed by scpRegistryWatcher.principle.ts AFTER this Reducer commits;
 * the principle's `nextA` is the canonical cross-Action dispatch path (Method
 * context does NOT expose nextA per stratimux MethodWithConceptsParams shape).
 *
 * Deck shape: self-referential (deck.scpRegistryWatcher.k.X.select()) per
 * ADMIN_ICP claudeBridge precedent — at runtime, muxified concepts are accessed
 * via their own name through the deck regardless of muxified position.
 *
 * Idempotency: if state.directoryWatcher non-null, Method short-circuits with
 * null bucket-push → Reducer returns {} partial-zero.
 *
 * Template:
 *   ADMIN_ICP/.../claudeBridgeBeaconSpawn.quality.huirth.ts (Method+Reducer+bucket)
 *   ADMIN_ICP/.../claudeBridgeSessionWatcher.principle.huirth.ts:88-98 (chokidar options)
 *
 * Citation: M60 (FSWatcher in state) · M62 (Method-before-Reducer) · M63
 */

import {
  createQualityCardWithPayload,
  createMethodWithConcepts,
  muxiumConclude,
  strategySuccess,
  type Concept,
} from 'stratimux';
import { watch, type FSWatcher } from 'chokidar';
import { mkdirSync } from 'node:fs';
import type { ScpRegistryWatcherState } from '../scpRegistryWatcher.type';
import { log } from '../../../debugLog';
import { fenceWatchTargets } from '../../../watcherFence.model';
import type {
  ScpRegistryDirectoryWatcherArmPayload,
  ScpRegistryDirectoryWatcherArm,
} from './types';

export type { ScpRegistryDirectoryWatcherArm };

interface ArmBucketItem {
  watcher: FSWatcher | null;
}

const armBucket: ArmBucketItem[] = [];

// Self-deck shape — at runtime the deck contains scpRegistryWatcher concept
// regardless of muxified position (ADMIN_ICP claudeBridge precedent).
type ScpRegistryWatcherSelfDeck = {
  scpRegistryWatcher: Concept<ScpRegistryWatcherState, Record<string, unknown>>;
};

export const scpRegistryDirectoryWatcherArm = createQualityCardWithPayload<
  ScpRegistryWatcherState,
  ScpRegistryDirectoryWatcherArmPayload,
  ScpRegistryWatcherSelfDeck
>({
  type: 'Scp Registry Directory Watcher Arm',
  reducer: (state) => {
    const bucketItem = armBucket.pop();
    if (!bucketItem || bucketItem.watcher === null) {
      return {};
    }
    return { directoryWatcher: bucketItem.watcher };
  },
  methodCreator: () =>
    createMethodWithConcepts(({ action, deck }) => {
      const existing = deck.scpRegistryWatcher.k.directoryWatcher.select();
      const observedPath = deck.scpRegistryWatcher.k.observedPath.select();
      const registryUserCwd = deck.scpRegistryWatcher.k.userCwd.select();

      if (existing !== null) {
        console.log('[Scp Registry] DirectoryWatcher already armed, skipping');
        armBucket.push({ watcher: null });
        return action.strategy ? strategySuccess(action.strategy) : muxiumConclude();
      }

      if (!observedPath) {
        console.warn('[Scp Registry] observedPath empty, cannot arm watcher');
        armBucket.push({ watcher: null });
        return action.strategy ? strategySuccess(action.strategy) : muxiumConclude();
      }

      try {
        mkdirSync(observedPath, { recursive: true });
      } catch (err) {
        const errno = (err as NodeJS.ErrnoException).code;
        if (errno !== 'EEXIST') {
          console.error('[Scp Registry] mkdirSync failed (errno=' + errno + '):', err);
          armBucket.push({ watcher: null });
          return action.strategy ? strategySuccess(action.strategy) : muxiumConclude();
        }
      }

      console.log('[Scp Registry] Arming chokidar watcher on:', observedPath);
      log('scpregistry.watcher.armed', { observedPath });
      let watcher: FSWatcher;
      try {
        watcher = watch(fenceWatchTargets('scpRegistryDirectoryWatcherArm', observedPath, registryUserCwd), {
          ignoreInitial: true,
          persistent: true,
          depth: 0,
          awaitWriteFinish: {
            stabilityThreshold: 300,
            pollInterval: 100,
          },
        });
      } catch (err) {
        console.error('[Scp Registry] chokidar.watch failed:', err);
        log('scpregistry.watcher.armed.error', { error: String(err) });
        armBucket.push({ watcher: null });
        return action.strategy ? strategySuccess(action.strategy) : muxiumConclude();
      }

      watcher.on('error', (err: Error) => {
        console.error('[Scp Registry Watcher] FS error:', err);
        log('scpregistry.chokidar.error', { error: String(err) });
      });

      watcher.on('addDir', (dirPath: string) => {
        log('scpregistry.chokidar.addDir', { path: dirPath });
      });

      watcher.on('unlinkDir', (dirPath: string) => {
        log('scpregistry.chokidar.unlinkDir', { path: dirPath });
      });

      armBucket.push({ watcher });
      return action.strategy ? strategySuccess(action.strategy) : muxiumConclude();
    }),
});
