/**
 * gitmWatcherArm Quality · GITM D2 (#633) · WATCHDIAL arm
 *
 * Method+Reducer+Bucket. ONE chokidar FSWatcher committed to state (M60), watching
 * THREE `.git` targets — HEAD (branch switch / detach), index (stage/commit),
 * refs/heads (branch create/delete). chokidar accepts an array of paths in
 * watch([...]); one watcher = one WGHA WeakSet, simpler teardown.
 *
 * Idempotency (M60): if gitWatcher already non-null, push { watcher: null } →
 * Reducer returns {} (zero-churn). Partial-return law: Reducer returns ONLY
 * { gitWatcher: watcher }.
 *
 * GITMUX boundary: this watcher READS `.git/` only — never writes refs/plumbing.
 *
 * Template: scpMessageRouterWatcherArm.quality.ts (Method+Reducer+Bucket · chokidar opts)
 * Citation: GITM-D2-S3-YELLOW-BLUEPRINT.md §4a · GITM-D2-S2-ORANGE-NAMING.md §3 (WATCHDIAL)
 * Citation: M60 (FSWatcher in state) · M62 (Method-before-Reducer)
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
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { log } from '../../../debugLog';
import { getActiveScsBridgeMuxiumHandle } from '../../../scsBridgeMuxium';
import { selectGitmOpCwd } from '../model/gitmOpCwd.model';
import type { GitmState } from '../gitm.types';
import type { GitmWatcherArmPayload, GitmWatcherArm, GitmSetStatusPayload } from './types';

export type { GitmWatcherArm };

interface ArmBucketItem {
  watcher: FSWatcher | null;
}

const armBucket: ArmBucketItem[] = [];
// GITM SCP-Sovereign — the .git dir the gitWatcher is currently armed on (path-aware idempotency
// + re-arm when the active SCP switches). Resolved via `git rev-parse --absolute-git-dir`.
let gitWatchedGitDir = '';

// Resolve the actual .git dir for a working cwd. The SCP RED repo's .git lives at the PARENT of
// the package dir (scps/<name>/.git vs activeScpDir=scps/<name>/SCP) — rev-parse handles any
// layout. Fallback to <cwd>/.git (a non-repo boot dir → chokidar waits for it · harmless).
function resolveGitDir(cwd: string): string {
  try {
    return execFileSync('git', ['-C', cwd, 'rev-parse', '--absolute-git-dir'], {
      encoding: 'utf8',
    }).trim();
  } catch {
    return join(cwd, '.git');
  }
}

type GitmSelfDeck = {
  gitm: Concept<GitmState, Record<string, unknown>>;
};

export const gitmWatcherArm = createQualityCardWithPayload<
  GitmState,
  GitmWatcherArmPayload,
  GitmSelfDeck
>({
  type: 'Gitm Watcher Arm',
  reducer: (state) => {
    const item = armBucket.pop();
    if (!item || item.watcher === null) {
      return {};
    }
    return { gitWatcher: item.watcher };
  },
  methodCreator: () =>
    createMethodWithConcepts(({ action, deck }) => {
      // payload selected for symmetry with the kind-discriminated precedent; the
      // single 'gitDir' kind is the only member (exhaustive by construction).
      selectPayload<GitmWatcherArmPayload>(action);

      // GITM SCP-Sovereign — watch the ACTIVE SCP's .git (branch/index/refs events), NOT the
      // install root. selectGitmOpCwd = activeScpDir || userCwd; rev-parse resolves the RED repo's
      // actual .git (the parent of the package dir). At boot (no SCP yet) this is the install root;
      // the bind seam re-dispatches gitmWatcherArm so the gitWatcher re-arms onto the SCP's .git.
      const opCwd = selectGitmOpCwd(deck);
      const gitDir = resolveGitDir(opCwd);

      const existing = deck.gitm.k.gitWatcher.select();
      // Path-aware idempotency: same .git → no-op.
      if (existing !== null && gitWatchedGitDir === gitDir) {
        armBucket.push({ watcher: null });
        return action.strategy ? strategySuccess(action.strategy) : muxiumConclude();
      }
      // SCP switched (or first arm onto a new .git) → close the old watcher, arm the new path.
      if (existing !== null) {
        log('gitm.gitdir.rearm', { from: gitWatchedGitDir, to: gitDir });
        void existing.close();
      }

      const targets = [
        join(gitDir, 'HEAD'),
        join(gitDir, 'index'),
        join(gitDir, 'refs', 'heads'),
        // GITM Dev Epoch (MD-A) — the STASH-REF watch: `git stash push/pop` mutates refs/stash
        // (not HEAD/index/refs/heads), so without this a stash motion moved stashCount only on
        // the next unrelated STARC read. Watching it fires WATCHDIAL on stash push/pop directly.
        join(gitDir, 'refs', 'stash'),
      ];

      console.log('[Gitm] Arming chokidar watcher on .git targets:', targets);
      const gitUserCwd = deck.gitm.k.userCwd.select();
      let watcher: FSWatcher;
      try {
        watcher = createWatcher('gitmWatcherArm', targets, gitUserCwd, {
          ignoreInitial: true,
          persistent: true,
          depth: 1,
          awaitWriteFinish: {
            stabilityThreshold: 300,
            pollInterval: 100,
          },
        });
      } catch (err) {
        console.error('[Gitm] chokidar.watch (.git) failed:', err);
        armBucket.push({ watcher: null });
        return action.strategy ? strategySuccess(action.strategy) : muxiumConclude();
      }

      watcher.on('error', (err: Error) => {
        console.error('[Gitm] chokidar error:', err);
      });

      // RELIABLE BIND (same fix as gitmScpWatcherArm) — bind the status-refresh handler HERE rather
      // than via the gitmWatchdial selector (which is timing-flaky on a re-arm). A .git event
      // (branch switch / commit / index) → refresh the top-level status from the SCP (gitmSetStatus
      // reads selectGitmOpCwd) so the branch list + panels follow the SCP. Dispatched via the live
      // handle (the chokidar callback is async, outside this action's context), 200ms-debounced.
      let gitDebounce: ReturnType<typeof setTimeout> | null = null;
      const onGitDirEvent = (): void => {
        if (gitDebounce !== null) clearTimeout(gitDebounce);
        gitDebounce = setTimeout(() => {
          gitDebounce = null;
          log('gitm.gitdir.event');
          const h = getActiveScsBridgeMuxiumHandle();
          if (h !== null) {
            h.muxium.dispatch(
              h.muxium.deck.d.gitm.e.gitmSetStatus({} as GitmSetStatusPayload) as never,
            );
          }
        }, 200);
      };
      watcher.on('add', onGitDirEvent);
      watcher.on('change', onGitDirEvent);
      watcher.on('unlink', onGitDirEvent);

      gitWatchedGitDir = gitDir;
      log('gitm.gitdir.armed', { gitDir });
      armBucket.push({ watcher });
      return action.strategy ? strategySuccess(action.strategy) : muxiumConclude();
    }),
});
