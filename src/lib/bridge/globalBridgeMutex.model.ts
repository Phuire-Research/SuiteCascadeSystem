/**
 * globalBridgeMutex.model · C797 · THE ONE-BRIDGE STOP-GAP (first release)
 *
 * The C796 shotgun proved the machine-global port rendezvous: SCP windows load
 * identity-free localhost URLs, every workspace's stamp claims the same range base, and
 * whoever owns the port is what every window shows — concurrent bridges cross their SCPs
 * (the FT001 anor SCP-Lab phantom). THE FIRST-RELEASE LAW: ONE SCS-Bridge per machine at a
 * time. A second bridge in a DIFFERENT workspace SELF-REPORTS to the user and stands down.
 * The deep fix (per-workspace unique ports + identity-gated readiness + the CSEP endpoint
 * assert) is DEFERRED — the full blueprint stands in DIAMOND-MULTI-BRIDGE-ISOLATION.md
 * §THE SHOTGUN SYNTHESIS for the future-release patch.
 *
 * Mechanics: a machine-global lockfile (tmpdir · per-uid) carrying { pid, userCwd,
 * startedAt }. Liveness = process.kill(pid, 0) — a dead holder is STALE and the lock is
 * claimed over it (crash-safe · no manual cleanup). The SAME workspace re-running `scs` is
 * NOT blocked — the per-workspace singleton relay (C410) owns that case; the mutex guards
 * CROSS-workspace concurrency only. Release is best-effort at cleanExit; staleness covers
 * every other death.
 */

import { existsSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

export type GlobalBridgeHolder = { pid: number; userCwd: string; startedAt: number };

export type GlobalBridgeMutexResult =
  | { acquired: true; sameWorkspace: boolean }
  | { acquired: false; holder: GlobalBridgeHolder };

const lockPath = (): string =>
  join(tmpdir(), `scs-bridge-global-${process.getuid?.() ?? 'user'}.lock`);

const pidAlive = (pid: number): boolean => {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
};

export function acquireGlobalBridgeMutex(userCwd: string): GlobalBridgeMutexResult {
  const p = lockPath();
  try {
    if (existsSync(p)) {
      const holder = JSON.parse(readFileSync(p, 'utf8')) as GlobalBridgeHolder;
      if (holder && typeof holder.pid === 'number' && pidAlive(holder.pid)) {
        if (holder.userCwd === userCwd) {
          // Our own workspace's daemon — the per-workspace relay owns this case; do not
          // overwrite the holder's stamp.
          return { acquired: true, sameWorkspace: true };
        }
        return { acquired: false, holder };
      }
      // Dead holder — STALE; fall through and claim over it.
    }
  } catch {
    /* unreadable lock — treat as stale and claim */
  }
  try {
    writeFileSync(
      p,
      JSON.stringify({ pid: process.pid, userCwd, startedAt: Date.now() }, null, 2),
      'utf8',
    );
  } catch {
    /* best-effort — a failed stamp never blocks the sole bridge */
  }
  return { acquired: true, sameWorkspace: false };
}

export function releaseGlobalBridgeMutex(): void {
  const p = lockPath();
  try {
    if (!existsSync(p)) return;
    const holder = JSON.parse(readFileSync(p, 'utf8')) as GlobalBridgeHolder;
    if (holder && holder.pid === process.pid) unlinkSync(p);
  } catch {
    /* best-effort — staleness detection covers the rest */
  }
}
