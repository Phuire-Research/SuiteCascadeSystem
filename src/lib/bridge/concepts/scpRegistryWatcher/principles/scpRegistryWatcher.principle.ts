/**
 * scpRegistryWatcher Principle · Phase B.1 · Cycle 129
 *
 * Subscribes to k.directoryWatcher selector. When the FSWatcher transitions
 * from null → non-null (Arm Reducer commits), binds addDir/change/unlinkDir
 * handlers using closure-captured nextA + d_. Handlers dispatch the FsScp*
 * notification Qualities, which Reducers transform installedScps.
 *
 * WGHA (WeakSet-Guarded Handler Attachment) prevents duplicate binding across
 * plan re-fires (Cinnabar C16 precedent · cited in WGB).
 *
 * Template: ADMIN_ICP/.../claudeBridgeSessionWatcher.principle.huirth.ts (chokidar bind)
 *           ADMIN_ICP/.../claudeBridgeIcpPermissionObserver.principle.huirth.ts (selector reactivity)
 *
 * Citation: M59 (no actionQue cross-Concept) · M60 (FSWatcher state-held) ·
 *           M62 (handlers fire AFTER Reducer commit) · M63 (Copy-Paste-Plus)
 * Citation: SUITE-4-GREEN-B1-SCPREGWATCHER-BIDIRECTIONAL.md §Angle 6 (WGHA)
 */

import type { PrincipleFunction } from 'stratimux';
import type { FSWatcher } from 'chokidar';
import type { ScpRegistryWatcherState } from '../scpRegistryWatcher.type';
import type { ScpRegistryWatcherQualities } from '../scpRegistryWatcher.concept';

// WGHA · WeakSet tracks FSWatchers we've already bound handlers to;
// GC-safe via WeakSet semantics when watcher object is released.
const boundWatchers = new WeakSet<FSWatcher>();

export const scpRegistryWatcherPrinciple: PrincipleFunction<
  ScpRegistryWatcherQualities,
  void,
  ScpRegistryWatcherState
> = ({ k_, d_, nextA, plan }) => {
  // d_ is the principle's deck. Cast to access self-concept's action creators.
  // At runtime, muxified concepts are accessed through the deck under their
  // own name (ADMIN_ICP claudeBridge precedent). The void Deck generic above
  // erases the structural-type check on d_; we access it via cast below.
  const selfDeck = d_ as unknown as {
    scpRegistryWatcher: {
      e: {
        scpRegistryFsScpAdded: (payload: { scpPath: string }) => unknown;
        scpRegistryFsScpChanged: (payload: { scpPath: string }) => unknown;
        scpRegistryFsScpRemoved: (payload: { scpPath: string }) => unknown;
      };
    };
  };

  const watcherPlan = plan('Scp Registry Watcher Bind', ({ stage, conclude }) => [
    stage(({ k }) => {
      const watcher = k.directoryWatcher.select();
      const observedPath = k.observedPath.select();

      if (watcher === null) return;
      if (boundWatchers.has(watcher)) return;

      console.log('[Scp Registry Watcher Principle] Binding handlers to chokidar watcher');
      boundWatchers.add(watcher);

      watcher.on('addDir', (dirPath: string) => {
        if (dirPath !== observedPath) {
          console.log('[Scp Registry Watcher] addDir:', dirPath);
          nextA(selfDeck.scpRegistryWatcher.e.scpRegistryFsScpAdded({ scpPath: dirPath }) as never);
        }
      });

      watcher.on('change', (filePath: string) => {
        console.log('[Scp Registry Watcher] change:', filePath);
        nextA(selfDeck.scpRegistryWatcher.e.scpRegistryFsScpChanged({ scpPath: filePath }) as never);
      });

      watcher.on('unlinkDir', (dirPath: string) => {
        if (dirPath !== observedPath) {
          console.log('[Scp Registry Watcher] unlinkDir:', dirPath);
          nextA(selfDeck.scpRegistryWatcher.e.scpRegistryFsScpRemoved({ scpPath: dirPath }) as never);
        }
      });
    }, {
      selectors: [k_.directoryWatcher],
      beat: 5,
    }),
    conclude(),
  ]);

  return () => {
    watcherPlan.conclude();
  };
};
