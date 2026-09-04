/**
 * scpMessageRouterWatcherArm · Phase B.2 · Cycle 130
 *
 * Method+Reducer+Bucket Quality with kind-discriminated payload. Method
 * instantiates the appropriate chokidar watcher based on watcherKind:
 *
 *   - 'bridgeJson':  watch ${userCwd}/Cascades/scps/bridge.json (single-file,
 *                    depth: 0). Optionally sync-reads existing file content into
 *                    bucket if file exists at Arm time (R1 §6 pruning fold —
 *                    saves a separate StartupRead Quality).
 *   - 'sessionsDir': watch ${userCwd}/Cascades/scps/ (deep, depth: 4). Handler
 *                    regex filtering happens in principle, not in Arm.
 *
 * Both watchers use awaitWriteFinish to avoid reading half-written files.
 * Both watchers bind their own 'error' handler (best-effort console.error).
 *
 * Idempotency: if the state field already holds an FSWatcher, Method pushes
 * { watcher: null } and Reducer returns {} (zero-churn).
 *
 * Handler binding (chokidar 'change' / 'add' → dispatch BridgeJsonReceived /
 * BmrEnvelopeReceived) is performed by scpMessageRouter.principle.ts AFTER
 * this Reducer commits the watcher to state.
 *
 * Template: B.1 scpRegistryDirectoryWatcherArm.quality.ts (Method+Reducer+Bucket)
 *           ADMIN_ICP claudeBridgeSessionWatcher.principle.huirth.ts:90-98 (chokidar options)
 *
 * Citation: M60 (FSWatcher in state) · M62 (Method-before-Reducer) · M63
 * Citation: SUITE-1-RED-B2-MSGROUTER-CURATION.md §2 Cards 2, 6, 7
 * Citation: SUITE-2-ORANGE-B2-MSGROUTER-NAMING.md §3 Quality 3
 * Citation: SUITE-3-YELLOW-B2-MSGROUTER-BLUEPRINT.md §3.4
 * Citation: SUITE-4-GREEN-B2-MSGROUTER-BIDIRECTIONAL.md §10 Amendment 2 (exhaustive comment)
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
import { mkdirSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
// F2 · SCP-WINDOW-CLOSURE-CONSUME · registryPath() = bridgeRoot()/sessions.json (the
// single top-level registry file the F1 electron-side recordScpWindowClosure writer
// appends scpWindowClosures onto). M73 Path-Diameter-Pairing-Doctrine: this watcher
// root pairs with registryPath() — any move of the registry file MUST update both.
import { registryPath, workspaceBridgeDir } from '../../../paths';
import type { ScpMessageRouterState } from '../scpMessageRouter.type';
import type {
  WatcherKind,
  ScpMessageRouterWatcherArmPayload,
  ScpMessageRouterWatcherArm,
} from './types';

export type { ScpMessageRouterWatcherArm };

interface ArmBucketItem {
  watcherKind: WatcherKind;
  watcher: FSWatcher | null;
  // populated only when watcherKind === 'bridgeJson' AND sync-read succeeded
  bridgeJsonContent?: unknown;
}

const armBucket: ArmBucketItem[] = [];

type ScpMessageRouterSelfDeck = {
  scpMessageRouter: Concept<ScpMessageRouterState, Record<string, unknown>>;
};

export const scpMessageRouterWatcherArm = createQualityCardWithPayload<
  ScpMessageRouterState,
  ScpMessageRouterWatcherArmPayload,
  ScpMessageRouterSelfDeck
>({
  type: 'Scp Message Router Watcher Arm',
  reducer: (state) => {
    const item = armBucket.pop();
    if (!item || item.watcher === null) {
      return {};
    }
    if (item.watcherKind === 'bridgeJson') {
      const partial: Partial<ScpMessageRouterState> = { bridgeJsonWatcher: item.watcher };
      if (item.bridgeJsonContent !== undefined) {
        partial.bridgeJsonContent = item.bridgeJsonContent;
      }
      return partial;
    }
    if (item.watcherKind === 'sessionsDir') {
      return { sessionsDirWatcher: item.watcher };
    }
    // F2 · SCP-WINDOW-CLOSURE-CONSUME · the 4th watcher kind commits its FSWatcher
    // to sessionsJsonWatcher (the registry-file watch feeding the closure consumer).
    if (item.watcherKind === 'sessionsJson') {
      return { sessionsJsonWatcher: item.watcher };
    }
    // PSSM · W0/W5 · the SCPs.json status watch (parent-dir hardened) commits to
    // scpsJsonWatcher, feeding the standalone status-consume plan (row derivation).
    if (item.watcherKind === 'scpsJson') {
      return { scpsJsonWatcher: item.watcher };
    }
    // watcherKind === 'bridgeSessionsDir' (exhaustive — union tail)
    // B.7 Regression #4 Hotfix · M73 Path-Diameter-Pairing-Doctrine
    return { bridgeSessionsDirWatcher: item.watcher };
  },
  methodCreator: () =>
    createMethodWithConcepts(({ action, deck }) => {
      const { watcherKind } = selectPayload<ScpMessageRouterWatcherArmPayload>(action);
      const userCwd = deck.scpMessageRouter.k.userCwd.select();

      if (watcherKind === 'bridgeJson') {
        const existing = deck.scpMessageRouter.k.bridgeJsonWatcher.select();
        if (existing !== null) {
          console.log('[Scp Message Router] bridgeJson watcher already armed, skipping');
          armBucket.push({ watcherKind, watcher: null });
          return action.strategy ? strategySuccess(action.strategy) : muxiumConclude();
        }

        const bridgeJsonPath = join(userCwd, 'Cascades', 'scps', 'bridge.json');

        // Optional sync read pre-watch (R1 §6 pruning fold).
        // If file exists at Arm time, capture content alongside watcher commit.
        let initialContent: unknown | undefined = undefined;
        try {
          const raw = readFileSync(bridgeJsonPath, 'utf-8');
          initialContent = JSON.parse(raw);
        } catch {
          // File may not exist yet — bridge core (B.6) creates it later.
          // Or JSON.parse failed — log via subsequent chokidar event when stabilized.
        }

        console.log('[Scp Message Router] Arming chokidar watcher on:', bridgeJsonPath);
        let watcher: FSWatcher;
        try {
          watcher = createWatcher('scpMessageRouterWatcherArm.bridgeJson', bridgeJsonPath, userCwd, {
            ignoreInitial: true,
            persistent: true,
            depth: 0,
            awaitWriteFinish: {
              stabilityThreshold: 300,
              pollInterval: 100,
            },
          });
        } catch (err) {
          console.error('[Scp Message Router] chokidar.watch (bridgeJson) failed:', err);
          armBucket.push({ watcherKind, watcher: null });
          return action.strategy ? strategySuccess(action.strategy) : muxiumConclude();
        }

        watcher.on('error', (err: Error) => {
          console.error('[Scp Message Router] bridgeJson FS error:', err);
        });

        armBucket.push({ watcherKind, watcher, bridgeJsonContent: initialContent });
        return action.strategy ? strategySuccess(action.strategy) : muxiumConclude();
      }

      if (watcherKind === 'sessionsDir') {
        const existing = deck.scpMessageRouter.k.sessionsDirWatcher.select();
        if (existing !== null) {
          console.log('[Scp Message Router] sessionsDir watcher already armed, skipping');
          armBucket.push({ watcherKind, watcher: null });
          return action.strategy ? strategySuccess(action.strategy) : muxiumConclude();
        }

        const scpsRoot = join(userCwd, 'Cascades', 'scps');
        try {
          mkdirSync(scpsRoot, { recursive: true });
        } catch (err) {
          const errno = (err as NodeJS.ErrnoException).code;
          if (errno !== 'EEXIST') {
            console.error('[Scp Message Router] mkdirSync (sessionsDir) failed:', err);
            armBucket.push({ watcherKind, watcher: null });
            return action.strategy ? strategySuccess(action.strategy) : muxiumConclude();
          }
        }

        console.log('[Scp Message Router] Arming chokidar watcher on:', scpsRoot, '(depth: 4)');
        let watcher: FSWatcher;
        try {
          watcher = createWatcher('scpMessageRouterWatcherArm.sessionsDir', scpsRoot, userCwd, {
            ignoreInitial: true,
            persistent: true,
            depth: 4,
            awaitWriteFinish: {
              stabilityThreshold: 300,
              pollInterval: 100,
            },
          });
        } catch (err) {
          console.error('[Scp Message Router] chokidar.watch (sessionsDir) failed:', err);
          armBucket.push({ watcherKind, watcher: null });
          return action.strategy ? strategySuccess(action.strategy) : muxiumConclude();
        }

        watcher.on('error', (err: Error) => {
          console.error('[Scp Message Router] sessionsDir FS error:', err);
        });

        armBucket.push({ watcherKind, watcher });
        return action.strategy ? strategySuccess(action.strategy) : muxiumConclude();
      }

      if (watcherKind === 'sessionsJson') {
        // F2 · SCP-WINDOW-CLOSURE-CONSUME · the F1 electron-side recordScpWindowClosure appends
        // {scpName, closedAt} to registry.scpWindowClosures via the SAME chainWrite atomic
        // tmp+rename writer. The principle's closure-consume plan re-reads + consumes newer-than-
        // watermark closures → dispatches scpLifecycleWindowClosed.
        //
        // W0 CRITICAL HARDENING (WebSearch-grounded · LIVE-PROVEN): a chokidar SINGLE-FILE watch
        // silently DIES on the atomic rename inode-swap under macOS fsevents — the prior depth:0
        // watch on registryPath() is EXACTLY the handler the user proved never fired for a
        // post-boot closure. Convert to a PARENT-DIR watch (bridgeRoot(), depth: 0) with the
        // filename filter (basename === 'sessions.json') applied in the principle handler (the
        // robust idiom). awaitWriteFinish kept; the FSWatcher on the dir survives the rename.
        const existing = deck.scpMessageRouter.k.sessionsJsonWatcher.select();
        if (existing !== null) {
          console.log('[Scp Message Router] sessionsJson watcher already armed, skipping');
          armBucket.push({ watcherKind, watcher: null });
          return action.strategy ? strategySuccess(action.strategy) : muxiumConclude();
        }

        // Parent dir of registryPath() (= bridgeRoot()). depth: 0 → this dir's direct entries only.
        const sessionsJsonDir = dirname(registryPath());
        try {
          mkdirSync(sessionsJsonDir, { recursive: true });
        } catch (err) {
          const errno = (err as NodeJS.ErrnoException).code;
          if (errno !== 'EEXIST') {
            console.error('[Scp Message Router] mkdirSync (sessionsJson dir) failed:', err);
            armBucket.push({ watcherKind, watcher: null });
            return action.strategy ? strategySuccess(action.strategy) : muxiumConclude();
          }
        }

        console.log('[Scp Message Router] Arming chokidar watcher on (dir · hardened):', sessionsJsonDir, '(depth: 0)');
        let watcher: FSWatcher;
        try {
          watcher = createWatcher('scpMessageRouterWatcherArm.sessionsJson', sessionsJsonDir, userCwd, {
            ignoreInitial: true,
            persistent: true,
            depth: 0,
            awaitWriteFinish: {
              stabilityThreshold: 300,
              pollInterval: 100,
            },
          });
        } catch (err) {
          console.error('[Scp Message Router] chokidar.watch (sessionsJson) failed:', err);
          armBucket.push({ watcherKind, watcher: null });
          return action.strategy ? strategySuccess(action.strategy) : muxiumConclude();
        }

        watcher.on('error', (err: Error) => {
          console.error('[Scp Message Router] sessionsJson FS error:', err);
        });

        armBucket.push({ watcherKind, watcher });
        return action.strategy ? strategySuccess(action.strategy) : muxiumConclude();
      }

      if (watcherKind === 'scpsJson') {
        // PSSM · W0/W5 · watch the WORKSPACE registry file <userCwd>/Cascades/SCPs.json for the
        // per-SCP persisted `status` field. Same W0 HARDENING: PARENT-DIR watch (userCwd/Cascades,
        // depth: 0) + filename filter (basename === 'SCPs.json') in the principle handler — the
        // single-file watch would silently die on the setScpStatus tmp+rename swap. awaitWriteFinish
        // guards against reading a half-written file. The standalone status-consume plan re-reads
        // SCPs.json on change → dispatches scpLifecycleWindowClosed on 'pending' (row derivation).
        const existing = deck.scpMessageRouter.k.scpsJsonWatcher.select();
        if (existing !== null) {
          console.log('[Scp Message Router] scpsJson watcher already armed, skipping');
          armBucket.push({ watcherKind, watcher: null });
          return action.strategy ? strategySuccess(action.strategy) : muxiumConclude();
        }

        const scpsJsonDir = join(userCwd, 'Cascades');
        try {
          mkdirSync(scpsJsonDir, { recursive: true });
        } catch (err) {
          const errno = (err as NodeJS.ErrnoException).code;
          if (errno !== 'EEXIST') {
            console.error('[Scp Message Router] mkdirSync (scpsJson dir) failed:', err);
            armBucket.push({ watcherKind, watcher: null });
            return action.strategy ? strategySuccess(action.strategy) : muxiumConclude();
          }
        }

        console.log('[Scp Message Router] Arming chokidar watcher on (dir · hardened):', scpsJsonDir, '(depth: 0)');
        let watcher: FSWatcher;
        try {
          watcher = createWatcher('scpMessageRouterWatcherArm.scpsJson', scpsJsonDir, userCwd, {
            ignoreInitial: true,
            persistent: true,
            depth: 0,
            awaitWriteFinish: {
              stabilityThreshold: 300,
              pollInterval: 100,
            },
          });
        } catch (err) {
          console.error('[Scp Message Router] chokidar.watch (scpsJson) failed:', err);
          armBucket.push({ watcherKind, watcher: null });
          return action.strategy ? strategySuccess(action.strategy) : muxiumConclude();
        }

        watcher.on('error', (err: Error) => {
          console.error('[Scp Message Router] scpsJson FS error:', err);
        });

        armBucket.push({ watcherKind, watcher });
        return action.strategy ? strategySuccess(action.strategy) : muxiumConclude();
      }

      // watcherKind === 'bridgeSessionsDir' (exhaustive — union tail)
      /**
       * M73 Path-Diameter-Pairing-Doctrine: this watcher root pairs with the write
       * path in `src/lib/bridge/paths.ts` (`priorityDir` produces
       * `Cascades/Bridge/sessions/{TUI_SESSION_ID}/heads/`). Any change to one MUST
       * be paired with a change to the other.
       *
       * B.7 Regression #4 Hotfix · R4 Option B LOCKED.
       *
       * Citation: SUITE-4-GREEN-B7-REGRESSION-4-PATH-MISMATCH.md
       * Citation: ADMIN_ICP claudeBridgeSessionWatcher (Bridge-side sessions precedent)
       */
      const existingBridgeSessions = deck.scpMessageRouter.k.bridgeSessionsDirWatcher.select();
      if (existingBridgeSessions !== null) {
        console.log('[Scp Message Router] bridgeSessionsDir watcher already armed, skipping');
        armBucket.push({ watcherKind, watcher: null });
        return action.strategy ? strategySuccess(action.strategy) : muxiumConclude();
      }

      const bridgeSessionsRoot = join(workspaceBridgeDir(userCwd), 'sessions');
      try {
        mkdirSync(bridgeSessionsRoot, { recursive: true });
      } catch (err) {
        const errno = (err as NodeJS.ErrnoException).code;
        if (errno !== 'EEXIST') {
          console.error('[Scp Message Router] mkdirSync (bridgeSessionsDir) failed:', err);
          armBucket.push({ watcherKind, watcher: null });
          return action.strategy ? strategySuccess(action.strategy) : muxiumConclude();
        }
      }

      console.log('[Scp Message Router] Arming chokidar watcher on:', bridgeSessionsRoot, '(depth: Infinity)');
      let bridgeSessionsWatcher: FSWatcher;
      try {
        // M77 Chokidar-Depth-Discipline: depth omitted → defaults to Infinity.
        // Rationale: macOS FSEvents misses `add` events for files in dynamically-
        // created subdirectories at exact depth boundary. The TUI creates
        // {TUI_SESSION_ID}/heads/ AFTER watcher arm; files land at exactly the
        // boundary. BRIDGE_ENVELOPE_PATH_REGEX in scpMessageRouter.principle.ts
        // line 228 gates which adds dispatch — depth limit is unnecessary and
        // harmful at the boundary.
        // Citation: SUITE-4-GREEN-BROWSER-LAUNCH-FAILURE.md Issue #1 (R4 diagnosis)
        bridgeSessionsWatcher = createWatcher('scpMessageRouterWatcherArm.bridgeSessionsDir', bridgeSessionsRoot, userCwd, {
          ignoreInitial: true,
          persistent: true,
          awaitWriteFinish: {
            stabilityThreshold: 300,
            pollInterval: 100,
          },
        });
      } catch (err) {
        console.error('[Scp Message Router] chokidar.watch (bridgeSessionsDir) failed:', err);
        armBucket.push({ watcherKind, watcher: null });
        return action.strategy ? strategySuccess(action.strategy) : muxiumConclude();
      }

      bridgeSessionsWatcher.on('error', (err: Error) => {
        console.error('[Scp Message Router] bridgeSessionsDir FS error:', err);
      });

      armBucket.push({ watcherKind, watcher: bridgeSessionsWatcher });
      return action.strategy ? strategySuccess(action.strategy) : muxiumConclude();
    }),
});
