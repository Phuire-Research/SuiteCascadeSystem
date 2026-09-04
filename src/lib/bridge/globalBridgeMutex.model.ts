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
 *
 * C1075 · SALVO M · THE PER-KEY LOCK DIRECTORY. The single machine-global file could record ONE holder, so a
 * second workspace was REFUSED (C797's stop-gap). Now one file per workspaceSingletonKey(cwd, env) under
 * tmpdir/scs-bridge-locks-<uid>/: a live record in OUR key = the same (directory, environment) is already
 * running → the caller WARNS (append --name) and exits; any other key coexists — ports walk (activeBridgePort ·
 * scpSpawn.model). The old scs-bridge-global-<uid>.lock is left alone (older builds still write it; we never read it).
 */

import { existsSync, mkdirSync, readdirSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { environmentName, workspaceSingletonKey } from './workspaceSocket.model';

export type GlobalBridgeHolder = {
  pid: number;
  userCwd: string;
  startedAt: number;
  env?: string;
};

export type GlobalBridgeMutexResult =
  | { acquired: true; claimedStale: boolean }
  | { acquired: false; holder: GlobalBridgeHolder };

const lockDir = (): string => join(tmpdir(), `scs-bridge-locks-${process.getuid?.() ?? 'user'}`);
const lockPath = (userCwd: string, env: string): string =>
  join(lockDir(), `${workspaceSingletonKey(userCwd, env)}.lock`);

const pidAlive = (pid: number): boolean => {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
};

const readHolder = (p: string): GlobalBridgeHolder | null => {
  try {
    if (!existsSync(p)) return null;
    const h = JSON.parse(readFileSync(p, 'utf8')) as GlobalBridgeHolder;
    return h && typeof h.pid === 'number' ? h : null;
  } catch {
    return null; // unreadable → stale
  }
};

/**
 * Acquire the (cwd, env) key. A LIVE holder in the same key → refused (the caller warns: append --name).
 * Absent or dead → claimed; `claimedStale` says a dead record was overwritten.
 */
export function acquireGlobalBridgeMutex(userCwd: string): GlobalBridgeMutexResult {
  const env = environmentName();
  const p = lockPath(userCwd, env);
  const holder = readHolder(p);
  if (holder && pidAlive(holder.pid)) return { acquired: false, holder };
  const claimedStale = holder !== null;
  try {
    mkdirSync(lockDir(), { recursive: true });
    writeFileSync(
      p,
      JSON.stringify({ pid: process.pid, userCwd, startedAt: Date.now(), env }, null, 2),
      'utf8',
    );
  } catch {
    /* best-effort — a failed stamp never blocks a bridge */
  }
  return { acquired: true, claimedStale };
}

/** Every OTHER live holder on this machine (other workspaces anor other environments) — telemetry only, never a gate. */
export function listSiblingHolders(userCwd: string): GlobalBridgeHolder[] {
  const own = lockPath(userCwd, environmentName());
  const out: GlobalBridgeHolder[] = [];
  try {
    for (const name of readdirSync(lockDir())) {
      if (!name.endsWith('.lock')) continue;
      const p = join(lockDir(), name);
      if (p === own) continue;
      const h = readHolder(p);
      if (h && pidAlive(h.pid)) out.push(h);
    }
  } catch {
    /* no dir yet → no siblings */
  }
  return out;
}

export function releaseGlobalBridgeMutex(): void {
  const p = lockPath(process.cwd(), environmentName());
  try {
    const holder = readHolder(p);
    if (holder && holder.pid === process.pid) unlinkSync(p);
  } catch {
    /* best-effort — staleness detection covers the rest */
  }
}