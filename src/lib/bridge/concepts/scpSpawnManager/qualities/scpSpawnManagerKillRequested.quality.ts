/**
 * scpSpawnManagerKillRequested · Server-Close Cure
 *
 * Method+Reducer Quality (form-α · Method drives, Reducer returns {}). Requests
 * the DELIBERATE death of an SCP's dedicated child process when the user closes
 * the SCP window. Closing the window closes the ENTIRE dedicated SCP server; the
 * lifecycle row then RESTS at 'pending' (installed-not-running) via the re-seat
 * ridden in the 'exit' handler (scpLifecycleRegister).
 *
 * The Method (BRANCH ORDER · handle → state-pid → port → skip):
 *   1. handle present → markVoluntaryClose(scpName) BEFORE the kill so the mark is
 *      present when the 'exit' handler ticks, THEN child.kill('SIGTERM').
 *   2. no handle, state pid recovered from spawnsByScp[scpName].pid → SIGTERM by pid,
 *      then the orphan settlement poll (no exit handler exists for a process THIS
 *      daemon did not spawn).
 *   3. no handle, no state pid, PORT resolvable from spawnsByScp[scpName].port (the
 *      SAME honest source the live TUI row reads via menu.ts:816 portByScp ←
 *      animatedTui.ts:508 entry.port) → `lsof -ti tcp:<port>` (validated-integer guard,
 *      never a string) → SIGTERM each listener pid → settle. Closes the cross-restart
 *      orphan hole (no handle AND no state pid, yet the port is known and lingering).
 *   4. no handle, no pid, no port → FailureNode-honest skip (log + conclude). Nothing
 *      to SIGTERM and no confirmed death to settle.
 *
 * DIRECT child.kill('SIGTERM') — NOT the -pid negative-group kill (that is the
 * bridge-wide B.6 teardown path which would take down the whole bridge). The
 * child is spawned detached + unref'd; a direct SIGTERM to its pid ends only
 * that dedicated server, whose own subtree exits with it.
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
import { getChildProcess, markVoluntaryClose, dispatchFromHandler } from './childProcessRegistry';
import { log } from '../../../debugLog';

export type { ScpSpawnManagerKillRequested };

// F2 · THE ORPHAN SETTLEMENT · poll cadence for confirming an orphan pid is gone.
// No exit handler exists for a process THIS daemon did not spawn (the handle-less
// cross-restart orphan), so the kill leg itself must settle. Poll process.kill(pid, 0)
// until ESRCH (process gone), then ride the SAME post-death dispatch pair the 'exit'
// handler rides (SpawnExited + DyingToGone). SIGKILL escalation is OUT of scope.
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

        // DIRECT SIGTERM to the detached+unref'd child — ends ONLY this dedicated
        // SCP server. NOT the -pid group kill (that is bridge-wide teardown). The
        // child's own 'exit' handler settles (SpawnExited + DyingToGone + re-seat).
        try {
          child.kill('SIGTERM');
          console.log('[Scp Spawn Manager] KillRequested SIGTERM sent:', scpName);
          log('scpspawnmgr.kill.handle', { scpName, pid: child.pid ?? null });
        } catch (err) {
          console.error(
            '[Scp Spawn Manager] KillRequested SIGTERM failed:',
            scpName,
            err instanceof Error ? err.message : String(err),
          );
          log('scpspawnmgr.kill.handle-error', {
            scpName,
            error: err instanceof Error ? err.message : String(err),
          });
        }
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
        log('scpspawnmgr.kill.orphan-pid', { scpName, pid });
        try {
          process.kill(pid, 'SIGTERM');
          console.log('[Scp Spawn Manager] KillRequested orphan SIGTERM sent:', scpName, 'pid=', pid);
        } catch (err) {
          const code = (err as NodeJS.ErrnoException).code;
          if (code === 'ESRCH') {
            // Already dead — the orphan is gone. Fall through to settle immediately.
            log('scpspawnmgr.kill.orphan-esrch', { scpName, pid, phase: 'sigterm' });
          } else {
            console.error(
              '[Scp Spawn Manager] KillRequested orphan SIGTERM failed:',
              scpName,
              'pid=', pid,
              err instanceof Error ? err.message : String(err),
            );
            log('scpspawnmgr.kill.orphan-error', {
              scpName,
              pid,
              error: err instanceof Error ? err.message : String(err),
            });
            return action.strategy ? strategySuccess(action.strategy) : muxiumConclude();
          }
        }
        settleOrphanPids([pid]);
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

        log('scpspawnmgr.kill.orphan-port-kill', { scpName, port, pids: portPids });
        console.log('[Scp Spawn Manager] KillRequested orphan port-kill:', scpName, 'port=', port, 'pids=', portPids);
        for (const p of portPids) {
          try {
            process.kill(p, 'SIGTERM');
          } catch (err) {
            const code = (err as NodeJS.ErrnoException).code;
            if (code === 'ESRCH') {
              // Already gone between the lsof read and the SIGTERM — fine; settlement confirms.
              log('scpspawnmgr.kill.orphan-esrch', { scpName, port, pid: p, phase: 'port-sigterm' });
            } else {
              console.error(
                '[Scp Spawn Manager] KillRequested orphan port SIGTERM failed:',
                scpName,
                'port=', port,
                'pid=', p,
                err instanceof Error ? err.message : String(err),
              );
              log('scpspawnmgr.kill.orphan-error', {
                scpName,
                port,
                pid: p,
                error: err instanceof Error ? err.message : String(err),
              });
            }
          }
        }
        settleOrphanPids(portPids);
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
