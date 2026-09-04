/**
 * watcherSingleton.model · THE CLEAN EXIT · card 8 (C977)
 *
 * THE SINGLETON WATCHER FACTORY. Every watcher this process creates is born through one of the
 * two exported creators, which AUTO-REGISTER it, CURRY the caller's props straight through, and
 * RETURN the underlying object — so every existing call site is a SPOT REPLACEMENT, not a rewrite.
 * The singleton owns the process-exit handlers and releases the whole array on the way out.
 *
 * WHY THIS EXISTS (measured, not assumed — C976's watcher map):
 *   · chokidar provides NO exit cleanup of any kind. `FSEventsWatchers` (fsevents-handler.js:77)
 *     IS a central registry but is module-private, and chokidar/lib touches process lifecycle
 *     ZERO times (process.on 0 · 'exit' 0 · SIGINT 0 · SIGTERM 0 · beforeExit 0). It is entirely
 *     the consumer's responsibility.
 *   · This SCP template held 29 chokidar sites, 74 `.close()` calls — ALL on re-arm paths — and
 *     **zero** process.on handlers. It closed watchers when re-pointing and never when exiting.
 *   · C966 measured that the HOST's FSEvents state degrades over long uptime (0/6 detections at
 *     203 days · 14/14 after a restart). Abandoned watchers are how we contribute to that. This
 *     is the durable half of that cure — and the user's law: we must not impose a system-wide
 *     condition on our users.
 *
 * WHY NOT THE MUXIUM: its canonical surface carries `close`, but Muxium teardown is ASYNCHRONOUS
 * and a Principle would only be registering these same process handlers anyway. The hook belongs
 * at the PROCESS level, installed once, independent of Muxium lifecycle.
 *
 * WHAT THIS CANNOT DO: SIGKILL is uncatchable. `nodemon.json` sets `signal: SIGKILL` plus a
 * `pkill -9`, so a turn-over still bypasses everything here. This covers the graceful, the
 * terminated and the crashed paths; the SIGKILL path needs a catchable signal with a bounded
 * grace, or a supervisor that outlives this process. That is deliberately NOT solved here.
 */

import { watch as chokidarWatch, type FSWatcher, type WatchOptions } from 'chokidar';
import { watchFile, unwatchFile, type StatWatcher, type Stats } from 'node:fs';

/**
 * THE TWO VARIANTS, in ONE array. They are different primitives with different release calls —
 * chokidar's async `FSWatcher.close()` anor Node's synchronous `unwatchFile(path)` — so the entry
 * carries its KIND and the release dispatches on it. A registry that assumed one primitive would
 * silently skip the other (C976 §4: 10 watchFile sites would have been missed).
 */
type RegisteredWatcher =
  | { kind: 'chokidar'; name: string; watcher: FSWatcher; released: boolean }
  | { kind: 'watchFile'; name: string; path: string; listener: WatchFileListener; released: boolean };

type WatchFileListener = (curr: Stats, prev: Stats) => void;

/** The array the user specified. Insertion-ordered; released entries are marked, never spliced
 *  mid-iteration (splicing during a release sweep is how a sweep silently skips its neighbour). */
const registry: RegisteredWatcher[] = [];

let hooksInstalled = false;

/**
 * CHOKIDAR VARIANT. Props curried straight through to chokidar; the FSWatcher is returned
 * unchanged, so a call site swaps its constructor and nothing else.
 */
export function createWatcher(name: string, paths: string | string[], options?: WatchOptions): FSWatcher {
  const watcher = chokidarWatch(paths, options);
  const entry: RegisteredWatcher = { kind: 'chokidar', name, watcher, released: false };
  registry.push(entry);
  // SELF-REMOVAL, and it must be real. The 74 existing `.close()` calls in this template are
  // RE-ARM paths — a watcher closed there is dead but would still sit in the array, so the exit
  // sweep would re-close a dead handle and the report would over-count live watchers. Wrapping
  // close() marks the entry at the moment the caller releases it, whoever the caller is. Chokidar
  // exposes no reliable 'close' event, so the wrap is the honest seam.
  const originalClose = watcher.close.bind(watcher);
  watcher.close = (): Promise<void> => {
    entry.released = true;
    return originalClose();
  };
  installProcessHooks();
  return watcher;
}

/**
 * WATCHFILE VARIANT. Node's polling watcher — released by `unwatchFile(path, listener)`, never by
 * `.close()`. Returns the StatWatcher for parity with the chokidar creator.
 */
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

/** Release ONE entry. Returns a promise only for the async variant. NEVER throws — see below. */
function releaseEntry(entry: RegisteredWatcher): Promise<void> | void {
  if (entry.released) return;
  entry.released = true;
  try {
    if (entry.kind === 'watchFile') {
      unwatchFile(entry.path, entry.listener);
      return;
    }
    // chokidar's close() INVOKES every closer synchronously and only collects the returned
    // promises to await (index.js:502-512) — so even unawaited, the native stop fires. That is
    // what makes the synchronous `exit` path below worth having at all.
    const p = entry.watcher.close();
    return p instanceof Promise ? p : undefined;
  } catch {
    // THE VALIDITY LAW (the user's word: "conditional if the object is still valid"). A handle
    // already closed, or whose subject died with its process, must NEVER throw out of a release
    // sweep — one bad entry stranding the remaining array is the exact failure this singleton
    // exists to prevent. Swallow per-entry; the sweep continues.
    return;
  }
}

/**
 * ASYNC release — for the signal paths, which can await.
 *
 * C995 · CARD 12 · WHERE THE BOUND BELONGS, AND WHERE IT DOES NOT (the user's correction).
 *
 * THE SWEEP IS ALREADY BOUNDED BY CONSTRUCTION and needs no guard: every creation function pushes
 * into THIS ONE ARRAY, the loop delimits on that array's length, and `releaseEntry` cannot throw
 * (the validity law), so no single bad handle can strand the entries behind it. An earlier note in
 * this Diamond called this function "unbounded" — that was WRONG, and it conflated the loop with
 * the wait.
 *
 * WHAT IS ACTUALLY AT RISK IS ONLY THE ACKNOWLEDGEMENT. chokidar's `close()` invokes every closer
 * SYNCHRONOUSLY and merely returns a promise for the collected results, so **by the time we reach
 * the await, the native stops have already fired**. `Promise.all` is therefore waiting for
 * confirmation of work that is done — and if one such promise never settles, we would hang holding
 * nothing back. That is the one thing worth bounding, and it is bounded HERE rather than by
 * touching the sweep.
 *
 * WHY A RACE AND NOT A REJECTION: a timeout here is not a failure. It means "the stops fired and
 * the acknowledgement is late" — the correct response is to carry on exiting, because continuing
 * to wait can only degrade the graceful path back into the SIGKILL path, which is the inversion
 * the user's law forbids.
 */
export async function releaseAllWatchers(confirmTimeoutMs = 2_000): Promise<number> {
  const pending: Promise<void>[] = [];
  let count = 0;
  for (const entry of registry) {
    if (entry.released) continue;
    count += 1;
    const p = releaseEntry(entry);
    if (p instanceof Promise) pending.push(p.catch(() => undefined));
  }
  if (pending.length > 0) {
    await Promise.race([
      Promise.all(pending).then(() => undefined),
      new Promise<void>((resolve) => {
        const t = setTimeout(resolve, confirmTimeoutMs);
        // The bound must never itself become the thing holding the process open.
        if (typeof (t as { unref?: () => void }).unref === 'function') (t as { unref: () => void }).unref();
      }),
    ]);
  }
  return count;
}

/** SYNCHRONOUS release — for `exit`, where awaiting is impossible but the closers still fire. */
export function releaseAllWatchersSync(): number {
  let count = 0;
  for (const entry of registry) {
    if (entry.released) continue;
    count += 1;
    void releaseEntry(entry);
  }
  return count;
}

/** Diagnostics — the Concluder surface for this module. */
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

/**
 * THE PROCESS HOOKS — installed ONCE, lazily, on the first watcher created. Idempotent by flag:
 * a module may be imported by many concepts and must never stack listeners.
 */
export function installProcessHooks(): void {
  if (hooksInstalled) return;
  hooksInstalled = true;

  // The signal paths CAN await. Release, then re-raise the default disposition so exit codes and
  // process semantics stay honest — we clean up, we do not change what the signal means.
  for (const sig of ['SIGINT', 'SIGTERM', 'SIGHUP'] as const) {
    process.on(sig, () => {
      void releaseAllWatchers().finally(() => {
        process.removeAllListeners(sig);
        process.kill(process.pid, sig);
      });
    });
  }

  // beforeExit CAN await (the loop may still be scheduled).
  process.on('beforeExit', () => {
    void releaseAllWatchers();
  });

  // exit CANNOT await — but close() fires its closers synchronously, so this still releases.
  process.on('exit', () => {
    releaseAllWatchersSync();
  });

  // A crash still leaks the host's watcher state if we say nothing. Release, then let the default
  // behaviour proceed — we never swallow the error.
  process.on('uncaughtException', (err) => {
    releaseAllWatchersSync();
    throw err;
  });
}
