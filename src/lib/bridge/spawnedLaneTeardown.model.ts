/**
 * spawnedLaneTeardown.model · C1020 · SEAT 3 — THE DAEMON'S LANE TEARDOWN
 *
 * *"Build seat 3 … Note we Need the Graceful Close Route with the Back Up SIGTERM like our Nodemon
 *   Means."*
 *
 * ── THE MEANS BEING MIRRORED ────────────────────────────────────────────────────────────────────
 * `nodemon.json` is the shape: `events.restart` runs `lane-teardown.sh` (the GRACEFUL route) and
 * `"signal": "SIGKILL"` is nodemon's own BACKUP. Two layers, graceful first. This module is that
 * same shape at the daemon's exit — with one difference that matters: the script deliberately
 * **signals nothing**, because nodemon supplies the backup for it. **At the daemon seat there is no
 * nodemon to supply it, so we supply it ourselves.** That is the entire delta.
 *
 * ── WHY THE DAEMON, AND NOT THE TWO SEATS THAT FAILED ───────────────────────────────────────────
 * Seat 1 (`laneOwnerWatch`, C1017) polled every 15s against an 8s grace and was killed mid-count.
 * Seat 2 (`signalLaneRoot` in `selfOwnedShutdown`, C1018) used a timer that was `unref()`'d, so it
 * was discarded the moment the event loop emptied. Both were seated INSIDE the thing being torn
 * down — **THE PRE-EMPTION HAZARD**: two self-shutdown mechanisms in one process, the faster
 * silently voiding the slower. **The rule they cost us: a teardown must sit in a process that is
 * ALIVE AT THE EVENT and OUTLIVES what it tears down.** The daemon is both — it is the parent, and
 * it is the one exiting.
 *
 * ── THE TARGET IS THE GROUP, NOT THE PID · MEASURED, NOT ASSUMED ────────────────────────────────
 * Lanes are spawned `detached: true` (`scpSpawn.model.ts`), which makes the lane root its OWN
 * process-group leader. Measured live with `ps -Ao pid,ppid,pgid`:
 *
 *     daemon  pid 2472  pgid 2472     <- a DIFFERENT group
 *     lane    pid 2814  pgid 2814     <- group leader
 *       sh -c 3033 · nodemon 4418/4450 · sh -c 4484 · ts-node 5507/5551   ALL pgid 2814
 *
 * So `process.kill(-laneRootPid)` reaches the WHOLE lane and **cannot touch the daemon**. A bare-pid
 * SIGTERM would stop at the `npm` wrapper and leave nodemon + ts-node alive — **THE WRAPPER-TERMINUS
 * HAZARD**, the third way this teardown could have failed after the first two.
 *
 * **This corrects a stale comment.** `scpSpawnManagerKillRequested.quality.ts` states the negative-pid
 * form "would take down the whole bridge". The measurement above disproves it: the lane is its own
 * group. `scpSpawnManagerSpawnRequested.quality.ts` already names this path — *"Process-group
 * teardown (B.6) uses process.kill(-pid)"* — **B.6 is this module; it was documented and never
 * built.**
 *
 * ── TWO PHASES, DELIBERATELY SEPARATE ───────────────────────────────────────────────────────────
 * The caller owns the delay between them, because only the caller knows its own exit budget. Fusing
 * them behind one `await` would put this module in charge of how long the user waits to quit, which
 * is not its business — and an internal timer is exactly what killed seat 2.
 *
 * ── NO MEANS OF FAILURE ─────────────────────────────────────────────────────────────────────────
 * The user's standing law for this passage. Nothing here throws, ever: an empty registry, a missing
 * lane dir, a dead pid, a vanished handle and a closed stdout are all ORDINARY. A teardown that
 * fails an exit is worse than the leak it prevents.
 */

import { snapshotChildProcesses, getScpPath, deleteChildProcess } from './concepts/scpSpawnManager/qualities/childProcessRegistry';
import { askScpGracefulExit } from './scpGracefulExitAsk.model';
import { log } from './debugLog';

/**
 * Logging that CANNOT break the exit. **File-based `log()` ONLY — never `console.*`.** By the time
 * this runs, `restoreTerminalIO()` has re-pointed `console.log` at the raw pre-alt-screen writer, and
 * a write onto a pipe closed mid-shutdown throws EPIPE with no guard anywhere in the daemon — which
 * would abort the sweep midway and leak every lane after the first. (Card 6 is this hazard by name.)
 * `log()` is `appendFileSync` to the debug log, which is safe at any point in the teardown AND puts
 * the evidence where the next diagnosis will look for it. Still wrapped: the exit outranks its
 * narration.
 */
function say(event: string, detail: Record<string, unknown>): void {
  try {
    log(`laneTeardown.${event}`, detail);
  } catch {
    /* even the file writer must never abort an exit */
  }
}

/** `kill(pid, 0)` throws when the pid is gone — the cheapest liveness probe there is. */
function pidAlive(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

/**
 * PHASE 1 · THE GRACEFUL ROUTE. Asks every spawned lane to release its own resources — watchers,
 * listeners, ports — the way `lane-teardown.sh` does, by POSTing the lane's `/graceful-exit`.
 *
 * Fire-and-forget by construction (`askScpGracefulExit` is bounded and never gates). This returns
 * IMMEDIATELY; the release happens during whatever grace the caller then allows.
 *
 * @returns how many lanes were asked — 0 when nothing was ever spawned, which is the common case and
 *          must cost the user nothing.
 */
export function askSpawnedLanesToExit(): number {
  let asked = 0;
  try {
    for (const [scpName] of snapshotChildProcesses()) {
      const scpDir = getScpPath(scpName);
      if (scpDir === undefined) {
        // NEVER SILENCE THE FAILURE SIGNAL — a lane we cannot address is a diagnosis, not a non-event.
        say('graceful.skip', { scpName, reason: 'no-dir-recorded' });
        continue;
      }
      askScpGracefulExit(scpDir, 'cli-exit');
      asked += 1;
    }
  } catch (err) {
    say('graceful.sweep-error', { message: err instanceof Error ? err.message : String(err) });
  }
  if (asked > 0) say('graceful.asked', { lanes: asked });
  return asked;
}

/**
 * SIGNAL ONE LANE'S PROCESS GROUP — the single implementation of "end a lane correctly".
 *
 * C1023 · extracted so the daemon-exit sweep and the single-window close cannot drift apart. They
 * are the same act at different scales, and the previous arrangement had them as two code paths with
 * two different targets — one of which (a bare-pid SIGTERM to a detached wrapper) is the
 * WRAPPER-TERMINUS HAZARD described in this file's header. One function, one target, one hazard to
 * reason about.
 *
 * THE GROUP, NOT THE PID. `detached: true` makes each lane root its own process-group leader, so
 * `-pid` reaches the wrapper, nodemon, and ts-node together, and reaches nothing outside the lane —
 * the daemon sits in a different group entirely (measured; see the header).
 *
 * **SIGTERM, never `-9`.** Every orphan tree cleared with SIGTERM alone in the field.
 *
 * @returns true only if a signal was actually delivered. `false` covers "already gone", which is
 *          success by another name — the caller distinguishes them by the telemetry, not the bool.
 */
export function signalLaneGroup(scpName: string, pid: number | undefined, leg: string): boolean {
  if (pid === undefined || pid <= 0) {
    say('signal.skip', { scpName, reason: 'no-pid', leg });
    return false;
  }
  if (!pidAlive(pid)) {
    // The graceful route already carried it — the outcome we wanted.
    say('signal.skip', { scpName, pid, reason: 'already-gone', leg });
    return false;
  }
  try {
    process.kill(-pid, 'SIGTERM');
    say('signal.group', { scpName, pgid: pid, signal: 'SIGTERM', leg });
    return true;
  } catch (err) {
    // ESRCH = it died during the grace, which is also success. Anything else is reported and
    // skipped: one refusing lane must never strand the ones after it.
    say('signal.failed', { scpName, pid, leg, message: err instanceof Error ? err.message : String(err) });
    return false;
  }
}

/**
 * PHASE 2 · THE BACKUP SIGTERM — what nodemon supplies for itself, supplied here by us.
 *
 * Signals each lane's PROCESS GROUP, which is the whole point (see the header measurement). **SIGTERM,
 * never `-9`**: every orphan tree cleared with SIGTERM alone in the field this session, and a graceful
 * signal lets the wrapper and nodemon run their own teardown — which is what a TRUE clean-up means.
 *
 * IDENTITY (C981) — we may only signal what we spawned AND can still identify. The strongest form
 * available is used: a live `ChildProcess` handle from this daemon's own `spawn()`, whose `exitCode`
 * and `signalCode` are still null (Node has not reaped it), confirmed alive at the instant of
 * signalling. **On any doubt: DECLINE.** Leaving a process alive is strictly safer than killing a
 * stranger — the founding law of this Diamond.
 *
 * @returns how many groups were signalled.
 */
export function signalSpawnedLaneGroups(): number {
  let signalled = 0;
  try {
    for (const [scpName, child] of snapshotChildProcesses()) {
      // Node already reaped it — the graceful ask above did the work, which is what we wanted.
      if (child.exitCode !== null || child.signalCode !== null) {
        say('signal.skip', { scpName, pid: child.pid ?? null, reason: 'already-exited', leg: 'cli-exit' });
        deleteChildProcess(scpName);
        continue;
      }
      if (signalLaneGroup(scpName, child.pid, 'cli-exit')) signalled += 1;
      deleteChildProcess(scpName);
    }
  } catch (err) {
    say('signal.sweep-error', { message: err instanceof Error ? err.message : String(err) });
  }
  if (signalled > 0) say('signal.complete', { groups: signalled });
  return signalled;
}

/** Diagnostics — the Concluder surface. How many lanes this daemon believes it is responsible for. */
export function spawnedLaneCount(): number {
  try {
    return snapshotChildProcesses().size;
  } catch {
    return 0;
  }
}
