/**
 * scpSpawnManagerKillRequested · Server-Close Cure
 *
 * Method+Reducer Quality (form-α · Method drives, Reducer returns {}). Requests
 * the DELIBERATE death of an SCP's dedicated child process when the user closes
 * the SCP window. Closing the window closes the ENTIRE dedicated SCP server; the
 * lifecycle row then RESTS at 'pending' (installed-not-running) via the re-seat
 * ridden in the 'exit' handler (scpLifecycleRegister).
 *
 * ── C1023 · THE SHAPE · GRACEFUL ASK → RELEASE WINDOW → GROUP SIGTERM ───────────────────────────
 * *"Are we Not Using the Graceful Exit with a Delayed Force Quit?"* — until C1023, we were not.
 * Every branch below now asks the SCP to release itself first, waits WINDOW_CLOSE_GRACE_MS, and only
 * then signals. This is the same shape `nodemon.json` uses (graceful hook, then its own backstop)
 * and the same shape the daemon-exit seat uses (`spawnedLaneTeardown.model.ts`), deliberately: one
 * teardown discipline, three scales.
 *
 * The Method (BRANCH ORDER · handle → state-pid → port → skip):
 *   1. handle present → markVoluntaryClose(scpName) BEFORE anything, so the mark is present when the
 *      'exit' handler ticks → graceful ask by DIR → grace → group SIGTERM. The child's own 'exit'
 *      handler settles (SpawnExited + DyingToGone + re-seat) whichever leg actually ends it.
 *   2. no handle, state pid from spawnsByScp[scpName].pid → graceful ask by DIR if one was recorded
 *      (a cross-restart orphan usually has none — logged, never assumed) → grace → group SIGTERM →
 *      orphan settlement poll (no exit handler exists for a process THIS daemon did not spawn).
 *   3. no handle, no state pid, PORT resolvable from spawnsByScp[scpName].port (the SAME honest
 *      source the live TUI row reads via menu.ts:816 portByScp ← animatedTui.ts:508 entry.port) →
 *      graceful ask BY PORT → `lsof -ti tcp:<port>` (validated-integer guard, never a string) →
 *      resolve each listener's GROUP → grace → group SIGTERM → settle.
 *   4. no handle, no pid, no port → FailureNode-honest skip (log + conclude). Nothing to address and
 *      no confirmed death to settle.
 *
 * ── RETIRED DOCTRINE · WHAT THIS HEADER USED TO SAY, AND WHY IT WAS WRONG ───────────────────────
 * It read: *"DIRECT child.kill('SIGTERM') — NOT the -pid negative-group kill (that is the
 * bridge-wide B.6 teardown path which would take down the whole bridge) … a direct SIGTERM to its
 * pid ends only that dedicated server, whose own subtree exits with it."* **Both claims were
 * measured false** (`ps -Ao pid,ppid,pgid` on the live tree):
 *   · the lane is spawned `detached: true`, making its root its OWN process-group leader — the
 *     daemon sits in a different group entirely, so `-pid` is scoped to the lane and can never be
 *     "bridge-wide";
 *   · and a bare-pid SIGTERM stops AT the npm wrapper, leaving nodemon and ts-node running — **THE
 *     WRAPPER-TERMINUS HAZARD**, the most likely source of the orphan trees cleared by hand all
 *     epoch (every one an SCP lane whose root was gone while nodemon lived on).
 * Branch 3 carried a second, independent defect: `lsof` returns the LISTENER, which is nodemon's own
 * child, so signalling it alone is the one action guaranteed not to end the lane — **nodemon simply
 * restarts it**, and the kill reports success while the lane lives. It now signals the group.
 * The doctrine is recorded here rather than deleted, because a stale comment that outlives the code
 * it justified is exactly how the wrong form gets restored.
 *
 * Reducer returns {} — no own-state mutation. state.spawnsByScp cleanup is owned
 * by scpSpawnManagerSpawnExited, fired from the 'exit' handler (the same handler
 * that reads voluntaryCloseByScp to re-seat the row).
 *
 * Template: scpSpawnManagerSpawnRequested.quality.ts (form-α Method + conclude idiom)
 *
 * Citation: M60 State-or-Payload Anor (MMUI escape hatch) · M62 · M63 Copy-Paste-Plus
 * Citation: STRATIMUX-REFERENCE.md Quality Creation Patterns (Method Creator)
 */

import {
  createQualityCardWithPayload,
  createMethodWithConcepts,
  selectPayload,
  muxiumConclude,
  strategySuccess,
} from 'stratimux';
import type { ScpSpawnManagerState } from '../scpSpawnManager.type';
import type {
  ScpSpawnManagerKillRequestedPayload,
  ScpSpawnManagerKillRequested,
} from './types';
import { execSync } from 'node:child_process';
import { getChildProcess, getScpPath, markVoluntaryClose, dispatchFromHandler } from './childProcessRegistry';
import { askScpGracefulExit, askScpGracefulExitByPort } from '../../../scpGracefulExitAsk.model';
import { signalLaneGroup } from '../../../spawnedLaneTeardown.model';
import { log } from '../../../debugLog';

export type { ScpSpawnManagerKillRequested };

// F2 · THE ORPHAN SETTLEMENT · poll cadence for confirming an orphan pid is gone.
// No exit handler exists for a process THIS daemon did not spawn (the handle-less
// cross-restart orphan), so the kill leg itself must settle. Poll process.kill(pid, 0)
// until ESRCH (process gone), then ride the SAME post-death dispatch pair the 'exit'
// handler rides (SpawnExited + DyingToGone). SIGKILL escalation is OUT of scope.
// C1023 · THE WINDOW-CLOSE GRACE — the release window between the graceful ask and the signal.
// Same 600ms the daemon-exit seat uses, and for the same reason: the route answers in ~2ms
// (measured) and spends the remainder RELEASING watchers and listeners. Matching the two means one
// number to tune, and one number to explain when it changes.
const WINDOW_CLOSE_GRACE_MS = 600;

const ORPHAN_SETTLE_POLL_INTERVAL_MS = 300;
const ORPHAN_SETTLE_POLL_MAX_ATTEMPTS = 5;

export const scpSpawnManagerKillRequested = createQualityCardWithPayload<
  ScpSpawnManagerState,
  ScpSpawnManagerKillRequestedPayload
>({
  type: 'Scp Spawn Manager Kill Requested',
  reducer: () => ({}),
  methodCreator: () =>
    createMethodWithConcepts(({ action, deck }) => {
      const { scpName } = selectPayload<ScpSpawnManagerKillRequestedPayload>(action);

      const child = getChildProcess(scpName);

      // ── BRANCH 1 · handle present · the SAME-PROCESS path (unchanged) ──
      if (child !== undefined) {
        // Mark BEFORE the kill so the 'exit' handler (next event-loop tick) reads
        // the mark and re-seats the row at 'pending' instead of deleting it.
        markVoluntaryClose(scpName);

        // ── C1023 · GRACEFUL FIRST, SIGNAL AS THE BACKUP ────────────────────────────────────
        // *"Are we Not Using the Graceful Exit with a Delayed Force Quit?"* — we were not, here.
        //
        // THIS IS THE MOST-TRAVELLED TEARDOWN IN THE SYSTEM: closing one SCP window. It went
        // straight to a signal with no release and no confirmation, which inverted the founding law
        // of this Diamond — the graceful exit is the PRIMARY MEANS and the signal is the BACKSTOP.
        // An abandoned watcher set clogs the host's filesystem reactive stream, and C966 measured
        // that clogging breaking the turn-over for two full cycles (0/6 detections at 203 days
        // uptime; 14/14 after a restart). We were a contributor to it, once per window close.
        //
        // AND THE OLD TARGET WAS WRONG. The retired comment here claimed a direct SIGTERM to the
        // child "ends only that dedicated server, whose own subtree exits with it", and that the
        // `-pid` form was "bridge-wide". BOTH were measured false: `detached: true` makes the lane
        // root its OWN group leader, so `-pid` reaches exactly this lane's wrapper, nodemon and
        // ts-node — and nothing else, because the daemon lives in a different group. A bare-pid
        // SIGTERM stops AT the wrapper and leaves nodemon and ts-node running: THE
        // WRAPPER-TERMINUS HAZARD, and the most likely source of the orphan trees we have been
        // clearing by hand all epoch.
        const scpDir = getScpPath(scpName);
        if (scpDir !== undefined) {
          askScpGracefulExit(scpDir, 'window-close');
        } else {
          // NEVER SILENCE THE FAILURE SIGNAL — a close that cannot release says so, and still ends
          // the lane below rather than leaving it running.
          log('scpspawnmgr.kill.graceful-skip', { scpName, reason: 'no-dir-recorded' });
        }

        // The signal follows after the release window. Fire-and-forget: the Method must not become
        // async, and the settlement here is owned by the child's own 'exit' handler, which fires
        // whenever the lane actually dies — by the graceful route or by the signal.
        // If the graceful route already carried it, `signalLaneGroup` finds the pid gone and
        // declines, which is success by another name.
        const laneRootPid = child.pid;
        setTimeout(() => {
          signalLaneGroup(scpName, laneRootPid, 'window-close');
        }, WINDOW_CLOSE_GRACE_MS);

        console.log('[Scp Spawn Manager] KillRequested graceful ask + delayed group SIGTERM:', scpName);
        log('scpspawnmgr.kill.handle', {
          scpName,
          pid: laneRootPid ?? null,
          graceful: scpDir !== undefined,
          graceMs: WINDOW_CLOSE_GRACE_MS,
        });
        return action.strategy ? strategySuccess(action.strategy) : muxiumConclude();
      }

      // ── BRANCH 2 · NO handle · THE ORPHAN-AWARE KILL ──
      // This bridge holds no ChildProcess handle for scpName. The SCP is either
      // already dead OR is a cross-restart ORPHAN (spawned by an EARLIER daemon;
      // module-scope childProcessByScp is empty after restart). Recover the pid
      // from serializable state (spawnsByScp[scpName].pid) — the ONLY pid source
      // that survives without the handle. Self-Concept deck access (Tier-1) mirrors
      // Q1's self-Concept surface.
      const spawnsByScp = (
        deck as unknown as {
          scpSpawnManager: {
            k: {
              spawnsByScp: {
                select: () => Map<string, { pid?: number; port?: number }> | undefined;
              };
            };
          };
        }
      ).scpSpawnManager.k.spawnsByScp.select();
      const entry = spawnsByScp?.get(scpName);
      const pid = typeof entry?.pid === 'number' && entry.pid > 0 ? entry.pid : undefined;

      // ── THE ORPHAN SETTLEMENT · no exit handler exists for a process this daemon
      // did not spawn, so the kill leg settles itself. Poll process.kill(pid, 0) until
      // ALL target pids report ESRCH (confirmed gone), then ride the SAME post-death
      // pair the 'exit' handler rides: scpSpawnManagerSpawnExited + scpLifecycleDyingToGone
      // (both via dispatchFromHandler, the same idiom scpSpawnManagerSpawnRequested.quality.ts's
      // exit handler uses at :414-430). The voluntary re-seat leg (scpLifecycleRegister)
      // is NOT ridden here: it REQUIRES scpPath, which is not carried by ScpSpawnEntry
      // nor recoverable synchronously from the ULID-keyed registry — so a cross-restart
      // orphan cannot honestly re-seat at 'pending' from state alone. DyingToGone drives
      // the surface to gone honestly; the next registry-scan boot re-admits at 'pending'.
      const settleOrphanPids = (pids: number[]): void => {
        let attempts = 0;
        const tick = (): void => {
          attempts++;
          const stillAlive = pids.filter((p) => {
            try {
              process.kill(p, 0); // signal 0 = existence probe; throws ESRCH if gone
              return true;
            } catch (err) {
              if ((err as NodeJS.ErrnoException).code === 'ESRCH') {
                return false; // confirmed gone
              }
              return true; // EPERM etc. → cannot confirm gone; keep polling
            }
          });

          if (stillAlive.length === 0) {
            const settledAt = Date.now();
            // Q3 · SpawnExited — the SAME self-Concept dispatch the exit handler makes.
            dispatchFromHandler((h) =>
              h.muxium.deck.d.scp.d.scpSpawnManager.e.scpSpawnManagerSpawnExited({
                scpName,
                exitCode: null,
                exitSignal: 'SIGTERM',
                exitedAt: settledAt,
              }),
            );
            // scpLifecycle DyingToGone — the SAME cross-Concept dispatch the exit handler makes.
            dispatchFromHandler((h) =>
              h.muxium.deck.d.scp.d.scpLifecycle.e.scpLifecycleDyingToGone({
                scpName,
                exitCode: null,
                exitSignal: 'SIGTERM',
                exitedAt: settledAt,
              }),
            );
            console.log('[Scp Spawn Manager] orphan settled (SpawnExited + DyingToGone):', scpName, 'pids=', pids);
            log('scpspawnmgr.kill.settled', { scpName, pids, attempts, reseat: 'skipped-no-scppath' });
            return;
          }

          if (attempts >= ORPHAN_SETTLE_POLL_MAX_ATTEMPTS) {
            // Poll budget exhausted, pid(s) still alive. SIGKILL escalation is OUT of scope
            // (log only). The row is left as-is; a subsequent close or health-check can retry.
            console.warn('[Scp Spawn Manager] orphan kill TIMEOUT, pid(s) still alive:', scpName, 'pids=', stillAlive);
            log('scpspawnmgr.kill.orphan-TIMEOUT', { scpName, pids: stillAlive, attempts });
            return;
          }

          setTimeout(tick, ORPHAN_SETTLE_POLL_INTERVAL_MS);
        };
        tick();
      };

      // ── BRANCH 2 · NO handle · STATE-PID recovery. pid recovered from the
      // serializable spawnsByScp entry seeded in THIS daemon. SIGTERM by pid directly.
      // ESRCH = already dead → proceed straight to settlement (the death is already true).
      if (pid !== undefined) {
        // C1023 · the same graceful-then-signal shape as branch 1. A cross-restart orphan usually
        // has NO recorded directory (the module-scope map is empty in a daemon that did not spawn
        // it), so the ask is attempted and its absence is logged rather than assumed away.
        const orphanDir = getScpPath(scpName);
        if (orphanDir !== undefined) {
          askScpGracefulExit(orphanDir, 'window-close-orphan');
        } else {
          log('scpspawnmgr.kill.graceful-skip', { scpName, pid, reason: 'no-dir-recorded' });
        }
        log('scpspawnmgr.kill.orphan-pid', { scpName, pid, graceMs: WINDOW_CLOSE_GRACE_MS });
        // THE GROUP, not the bare pid — this pid is the lane root recorded at spawn, so signalling
        // it alone would strand nodemon and ts-node beneath it (WRAPPER-TERMINUS).
        setTimeout(() => {
          signalLaneGroup(scpName, pid, 'window-close-orphan');
          // Settlement starts AFTER the signal, not before it — polling a process we have not yet
          // asked to die would simply burn the budget confirming it is alive.
          settleOrphanPids([pid]);
        }, WINDOW_CLOSE_GRACE_MS);
        return action.strategy ? strategySuccess(action.strategy) : muxiumConclude();
      }

      // ── BRANCH 3 · NO handle AND NO state pid · THE PORT FALLBACK ──
      // The cross-restart orphan (spawned by an EARLIER daemon) has no handle and its
      // spawnsByScp entry never seeded a pid in THIS daemon — yet the live row still
      // renders `:<port>` because the badge sources its port from the SAME spawnsByScp
      // entry (menu.ts:816 portByScp ← animatedTui.ts:508 entry.port). Resolve that port
      // from the honest source and identify the listener via `lsof -ti tcp:<port>`.
      // GUARD: port MUST be a validated positive integer — never interpolate a string
      // into the shell. `lsof` exit 1 = nobody listening → the orphan is already gone →
      // settle immediately (empty pid set settles on first tick).
      const port =
        typeof entry?.port === 'number' && Number.isInteger(entry.port) && entry.port > 0
          ? entry.port
          : undefined;

      if (port !== undefined) {
        let portPids: number[] = [];
        try {
          const out = execSync(`lsof -ti tcp:${port}`, { stdio: ['ignore', 'pipe', 'ignore'] })
            .toString()
            .trim();
          portPids = out
            .split(/\s+/)
            .map((s) => Number.parseInt(s, 10))
            .filter((p) => Number.isInteger(p) && p > 0);
        } catch {
          // lsof exit 1 = nobody listening on the port → the orphan is already dead.
          // portPids stays [] → settleOrphanPids([]) settles on the first tick.
          portPids = [];
        }

        // C1023 · GRACEFUL FIRST — and this branch needs it most. A cross-restart orphan has been
        // holding its watchers since an earlier daemon, so it is the LONGEST-clogging case we have.
        // The port is the one address we hold here, which is exactly what the by-port ask is for.
        askScpGracefulExitByPort(port, 'spawns-entry', 'window-close-port');

        // ── AND A DEFECT THIS BRANCH CARRIED ON ITS OWN ────────────────────────────────────────
        // `lsof -ti tcp:<port>` returns the LISTENER — the ts-node server. That is nodemon's own
        // child, so signalling it alone is the one thing guaranteed NOT to end the lane: **nodemon
        // simply restarts it.** The kill would appear to succeed while the lane lived on. Resolving
        // each listener's process GROUP reaches the wrapper and nodemon too, which is what actually
        // ends it. `ps -o pgid=` is the only portable way to read another process's group.
        const groupOf = (target: number): number | undefined => {
          try {
            const g = Number.parseInt(
              execSync(`ps -o pgid= -p ${target}`, { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim(),
              10,
            );
            return Number.isInteger(g) && g > 0 ? g : undefined;
          } catch {
            return undefined; // the process died between lsof and here — settlement will confirm
          }
        };

        log('scpspawnmgr.kill.orphan-port-kill', { scpName, port, pids: portPids, graceMs: WINDOW_CLOSE_GRACE_MS });
        console.log('[Scp Spawn Manager] KillRequested orphan port graceful+group:', scpName, 'port=', port, 'pids=', portPids);
        setTimeout(() => {
          const seen = new Set<number>();
          for (const p of portPids) {
            const g = groupOf(p);
            if (g === undefined) {
              log('scpspawnmgr.kill.orphan-no-group', { scpName, port, pid: p });
              continue;
            }
            if (seen.has(g)) continue; // several listeners can share one lane group
            seen.add(g);
            signalLaneGroup(scpName, g, 'window-close-port');
          }
          settleOrphanPids(portPids);
        }, WINDOW_CLOSE_GRACE_MS);
        return action.strategy ? strategySuccess(action.strategy) : muxiumConclude();
      }

      // ── BRANCH 4 · HONEST SKIP · no handle, no state pid, AND no resolvable port.
      // Only when the port itself is unresolvable does the skip remain: there is no
      // honest target to SIGTERM and no confirmed death to settle.
      console.log('[Scp Spawn Manager] KillRequested no handle + no pid + no port, honest skip:', scpName);
      log('scpspawnmgr.kill.skip-no-target', { scpName });
      return action.strategy ? strategySuccess(action.strategy) : muxiumConclude();
    }),
});
