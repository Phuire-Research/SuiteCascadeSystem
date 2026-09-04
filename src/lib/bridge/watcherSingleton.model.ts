/**
 * watcherSingleton.model · THE CLEAN EXIT · card 8 · the CLI half (C977)
 *
 * The daemon's counterpart to the SCP template's singleton of the same name. Same contract, same
 * two variants, same validity law — with ONE composition the SCP half does not have:
 *
 * IT COMPOSES WITH THE FENCE, IT DOES NOT REPLACE IT. Every CLI chokidar arm already passes its
 * targets through `fenceWatchTargets(site, targets, userCwd)` (watcherFence.model.ts:39 · the C448
 * BO-2-H workspace locale law). That fence is about WHICH PATHS may be watched; this singleton is
 * about WHEN THEY ARE RELEASED. Both must hold, so `createWatcher` fences first and watches second
 * — one call site, both laws, and No Parallel Paths (a second fence-bypassing creator is exactly
 * the drift the fence's own header warns about).
 *
 * NOT TO BE CONFUSED WITH `concepts/gitm/model/gitmWatcherRegistry.model.ts` — that registers
 * gitm's OWN two watchers per SCP (armWatchersForScp / disarmWatchersForScp) and is a domain
 * structure, not a process-lifecycle registry. Named apart deliberately (C976 §5).
 *
 * WHAT THIS CANNOT DO: SIGKILL is uncatchable. This covers graceful, terminated and crashed
 * paths only.
 */

import { watch as chokidarWatch, type FSWatcher, type WatchOptions } from 'chokidar';
import { watchFile, unwatchFile, type StatWatcher, type Stats } from 'node:fs';
import { fenceWatchTargets } from './watcherFence.model';
import { log } from './debugLog';

type WatchFileListener = (curr: Stats, prev: Stats) => void;

type RegisteredWatcher =
  | { kind: 'chokidar'; name: string; watcher: FSWatcher; released: boolean }
  | { kind: 'watchFile'; name: string; path: string; listener: WatchFileListener; released: boolean };

const registry: RegisteredWatcher[] = [];
let hooksInstalled = false;

/**
 * CHOKIDAR VARIANT — fenced, then armed, then registered. The returned FSWatcher is the real one,
 * so a call site swaps `watch(fenceWatchTargets(N, T, C), O)` for `createWatcher(N, T, C, O)` and
 * changes nothing else.
 *
 * A fully-fenced-out target list is NOT an error: the fence dropped every path as foreign, so the
 * honest outcome is a watcher over nothing, reported once. Silence here would look identical to a
 * working watch — the exact failure class the fence exists to surface.
 */
export function createWatcher(
  name: string,
  targets: string | string[],
  userCwd: string,
  options?: WatchOptions,
): FSWatcher {
  const fenced = fenceWatchTargets(name, targets, userCwd);
  if (fenced.length === 0) {
    log('watcher.singleton.empty-after-fence', { site: name, userCwd });
  }
  const watcher = chokidarWatch(fenced, options);
  const entry: RegisteredWatcher = { kind: 'chokidar', name, watcher, released: false };
  registry.push(entry);
  const originalClose = watcher.close.bind(watcher);
  watcher.close = (): Promise<void> => {
    entry.released = true;
    return originalClose();
  };
  installProcessHooks();
  return watcher;
}

/** WATCHFILE VARIANT — Node's polling watcher, released by `unwatchFile`, never by `.close()`. */
export function createFileWatcher(
  name: string,
  path: string,
  options: { interval?: number } | undefined,
  listener: WatchFileListener,
): StatWatcher {
  const stat = options ? watchFile(path, options, listener) : watchFile(path, listener);
  registry.push({ kind: 'watchFile', name, path, listener, released: false });
  installProcessHooks();
  return stat;
}

function releaseEntry(entry: RegisteredWatcher): Promise<void> | void {
  if (entry.released) return;
  entry.released = true;
  try {
    if (entry.kind === 'watchFile') {
      unwatchFile(entry.path, entry.listener);
      return;
    }
    const p = entry.watcher.close();
    return p instanceof Promise ? p : undefined;
  } catch {
    // THE VALIDITY LAW — one dead handle must never strand the rest of the sweep.
    return;
  }
}

export async function releaseAllWatchers(): Promise<number> {
  const pending: Promise<void>[] = [];
  let count = 0;
  for (const entry of registry) {
    if (entry.released) continue;
    count += 1;
    const p = releaseEntry(entry);
    if (p instanceof Promise) pending.push(p.catch(() => undefined));
  }
  await Promise.all(pending);
  if (count > 0) log('watcher.singleton.released', { count, mode: 'async' });
  return count;
}

export function releaseAllWatchersSync(): number {
  let count = 0;
  for (const entry of registry) {
    if (entry.released) continue;
    count += 1;
    void releaseEntry(entry);
  }
  return count;
}

export function watcherRegistryReport(): { total: number; live: number; byKind: Record<string, number> } {
  const byKind: Record<string, number> = {};
  let live = 0;
  for (const e of registry) {
    if (!e.released) {
      live += 1;
      byKind[e.kind] = (byKind[e.kind] ?? 0) + 1;
    }
  }
  return { total: registry.length, live, byKind };
}

/** Installed ONCE, lazily, on the first watcher created. Idempotent — this module is imported by
 *  many concepts and must never stack listeners. */
export function installProcessHooks(): void {
  if (hooksInstalled) return;
  hooksInstalled = true;

  for (const sig of ['SIGINT', 'SIGTERM', 'SIGHUP'] as const) {
    process.on(sig, () => {
      void releaseAllWatchers().finally(() => {
        process.removeAllListeners(sig);
        process.kill(process.pid, sig);
      });
    });
  }
  process.on('beforeExit', () => {
    void releaseAllWatchers();
  });
  process.on('exit', () => {
    releaseAllWatchersSync();
  });
  process.on('uncaughtException', (err) => {
    releaseAllWatchersSync();
    throw err;
  });
}
