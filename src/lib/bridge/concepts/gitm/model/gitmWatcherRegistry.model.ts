/**
 * gitmWatcherRegistry Model · MULTI-SCP GITM MUXIFICATION (Fork B · MC-W2 · THE WATCHER PLURALITY)
 *
 * THE DEFECT this registry repairs: the SINGLE .git watcher + SINGLE tree watcher (gitmWatcherArm +
 * gitmScpWatcherArm, both committed to the flat GitmState) re-armed ONLY on the active-SCP switch — so
 * every NON-active running SCP went DARK (its file changes fired no recount · silent stale badges).
 *
 * THE ARCHITECTURE: a MODULE-scope Map<scpDir, GitmScpWatcherPair> holds a PER-SCP watcher pair — a
 * .git watcher (branch/index/refs events → onGitEvent) + a tree watcher (working-tree events →
 * onTreeEvent). armWatchersForScp is called on spawn SUCCESS (MC-W2 step 8); disarmWatchersForScp on
 * spawn EXIT. The chokidar options MIRROR the proven single-watcher legs byte-for-byte (gitmWatcherArm
 * §.git targets + gitmScpWatcherArm §tree opts) — same ignored patterns, awaitWriteFinish, depth, fence.
 *
 * NEVER enters Stratimux state (MMUI escape hatch · M60 · the childProcessRegistry precedent). The
 * FSWatcher handles are non-serializable; the flat GitmState's gitWatcher/scpWatcher/cascadeWatcher
 * fields are UNTOUCHED (the ACTIVE SCP's watchers still live there — this registry is ADDITIVE for the
 * NON-active SCPs · the materialized-view law). Idempotent per dir (a second arm on the same dir
 * closes+re-arms, mirroring the single-watcher path-aware guard).
 *
 * Precedent: gitmScpWatcherArm.quality.ts (tree watcher · ignored .git · awaitWriteFinish 300/100 ·
 *   fenceWatchTargets) · gitmWatcherArm.quality.ts (.git targets HEAD/index/refs · depth 1 ·
 *   resolveGitDir rev-parse) · childProcessRegistry.ts (module-Map keyed by scp · MMUI).
 * Citation: MC-W2 (THE WATCHER PLURALITY · brief step 6).
 */

import type { FSWatcher } from 'chokidar';
import { createWatcher } from '../../../watcherSingleton.model';
import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { log } from '../../../debugLog';

export type GitmScpWatcherPair = {
  gitWatcher: FSWatcher | null;
  scpWatcher: FSWatcher | null;
};

const watchersByScpDir = new Map<string, GitmScpWatcherPair>();

// Resolve the actual .git dir for a working cwd (the RED repo's .git lives at the PARENT of the SCP
// package dir · rev-parse handles any layout). Byte-for-byte with gitmWatcherArm.quality.ts:52.
function resolveGitDir(cwd: string): string {
  try {
    return execFileSync('git', ['-C', cwd, 'rev-parse', '--absolute-git-dir'], {
      encoding: 'utf8',
    }).trim();
  } catch {
    return join(cwd, '.git');
  }
}

// Arm BOTH watchers for one SCP dir. onGitEvent fires on a .git mutation (branch/commit/index/stash);
// onTreeEvent fires on a working-tree change. Both callbacks are the caller's (the quality wraps them
// so the dispatched STATUS/RECOUNT carry originScpName=scpDir · MC-W2 step 7). userCwd feeds the fence.
// Idempotent: a live pair on the same dir is torn down + re-armed (the single-watcher path-aware guard).
export function armWatchersForScp(
  scpDir: string,
  userCwd: string,
  onGitEvent: () => void,
  onTreeEvent: () => void,
): void {
  if (scpDir === '' || !existsSync(scpDir)) {
    log('gitm.registry.arm.skip', { scpDir, reason: scpDir === '' ? 'empty' : 'missing' });
    return;
  }

  // Idempotent re-arm: close any existing pair for this dir before arming a fresh one.
  const existing = watchersByScpDir.get(scpDir);
  if (existing) {
    if (existing.gitWatcher) void existing.gitWatcher.close();
    if (existing.scpWatcher) void existing.scpWatcher.close();
    log('gitm.registry.rearm', { scpDir });
  }

  const pair: GitmScpWatcherPair = { gitWatcher: null, scpWatcher: null };

  // ── .git watcher (branch/index/refs/stash events) — MIRROR gitmWatcherArm ──
  const gitDir = resolveGitDir(scpDir);
  const gitTargets = [
    join(gitDir, 'HEAD'),
    join(gitDir, 'index'),
    join(gitDir, 'refs', 'heads'),
    join(gitDir, 'refs', 'stash'),
  ];
  try {
    const gitWatcher = createWatcher('gitmWatcherRegistry.git', gitTargets, userCwd, {
      ignoreInitial: true,
      persistent: true,
      depth: 1,
      awaitWriteFinish: {
        stabilityThreshold: 300,
        pollInterval: 100,
      },
    });
    gitWatcher.on('error', (err: Error) => {
      console.error('[Gitm Registry] chokidar .git error:', scpDir, err);
    });
    gitWatcher.on('add', onGitEvent);
    gitWatcher.on('change', onGitEvent);
    gitWatcher.on('unlink', onGitEvent);
    pair.gitWatcher = gitWatcher;
  } catch (err) {
    console.error('[Gitm Registry] chokidar.watch (.git) failed:', scpDir, err);
  }

  // ── tree watcher (working-tree change count) — MIRROR gitmScpWatcherArm ──
  try {
    const scpWatcher = createWatcher('gitmWatcherRegistry.tree', [scpDir], userCwd, {
      ignored: [/(^|[/\\])\.git([/\\]|$)/],
      ignoreInitial: true,
      persistent: true,
      awaitWriteFinish: {
        stabilityThreshold: 300,
        pollInterval: 100,
      },
    });
    scpWatcher.on('error', (err: Error) => {
      console.error('[Gitm Registry] chokidar tree error:', scpDir, err);
    });
    scpWatcher.on('add', onTreeEvent);
    scpWatcher.on('change', onTreeEvent);
    scpWatcher.on('unlink', onTreeEvent);
    scpWatcher.on('addDir', onTreeEvent);
    scpWatcher.on('unlinkDir', onTreeEvent);
    pair.scpWatcher = scpWatcher;
  } catch (err) {
    console.error('[Gitm Registry] chokidar.watch (tree) failed:', scpDir, err);
  }

  watchersByScpDir.set(scpDir, pair);
  log('gitm.registry.armed', { scpDir, gitDir });
}

// Tear down BOTH watchers for one SCP dir (rides the spawn-exit cleanup · MC-W2 step 8). Returns true
// if a pair existed. The slice DELETE rides alongside (the caller decides · brief step 8).
export function disarmWatchersForScp(scpDir: string): boolean {
  const pair = watchersByScpDir.get(scpDir);
  if (!pair) {
    return false;
  }
  if (pair.gitWatcher) void pair.gitWatcher.close();
  if (pair.scpWatcher) void pair.scpWatcher.close();
  watchersByScpDir.delete(scpDir);
  log('gitm.registry.disarmed', { scpDir });
  return true;
}

// The count of live per-SCP watcher pairs (the plurality Concluder — diagnostics + tests).
export function getWatcherCount(): number {
  return watchersByScpDir.size;
}

// Test-teardown only (childProcessRegistry precedent). Closes + clears every pair.
export function clearWatcherRegistry(): void {
  for (const pair of watchersByScpDir.values()) {
    if (pair.gitWatcher) void pair.gitWatcher.close();
    if (pair.scpWatcher) void pair.scpWatcher.close();
  }
  watchersByScpDir.clear();
}
