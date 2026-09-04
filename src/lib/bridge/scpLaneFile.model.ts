/**
 * scpLaneFile.model · THE CLEAN EXIT · step 2 · THE LANE FILE (C986 · the user's design)
 *
 * THE SURGICAL MEANS IN ONE STROKE. At spawn the CLI knows everything the teardown needs — the
 * SCP's sovereign PORT (from the registry, before spawn), the child's PID, its START TIME, and the
 * SCP dir. This stamps all four beside `.bridge-restart.json`, where the nodemon `events.restart`
 * script — running in ITS OWN process, and therefore able to sequence what nodemon cannot — reads
 * them with a relative path.
 *
 * WHAT IT REPLACES: `pkill -9 -f "scp-tag=$PWD"`. `-f` matches the FULL COMMAND LINE of EVERY
 * process on the machine — a dry run matched 2 legitimate processes, but the mechanism is unbounded:
 * a user's grep, tail, editor or script merely MENTIONING that path would be killed with -9, by our
 * restart hook, on their machine. **A pattern cannot be made safe; it can only be deleted.**
 *
 * WHY pid ALONE IS NOT AN IDENTITY: pids are recycled, and nodemon's own respawn can fire before
 * descendants drain (C980 L6) — so a late signal can land on a pid the OS has already handed to
 * something else. **pid + startedAt IS durable**: `ps -p <pid> -o lstart=` in one call, no tree
 * walk, no pattern. A mismatch means DECLINE, never guess.
 *
 * WRITTEN AT SPAWN, NOT REFRESHED (the user's ruling): "our server isn't changing ports" — and that
 * is true BECAUSE of C965 port sovereignty. Before it, a port could be reassigned and a spawn-time
 * fact could go stale; now it is registry-bound for the process's whole life. **The port-sovereignty
 * work is what licenses the simpler design here.**
 *
 * FAILING SAFE BY CONSTRUCTION: a stale lane file causes a MISSED signal, never a WRONG one — and a
 * missed one is already covered by the graceful exit and by nodemon's own kill.
 */

import { writeFileSync, existsSync, mkdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { log } from './debugLog';

/**
 * C996 · THE BRIDGE LOG PASSAGE. The lane record is NOT a log — it is runtime STATE, kin to
 * `bridge.json` and `gitm.json`, which already live in the SCP's own `Cascades/Bridge/`. It moves
 * there, which also removes it from the citizen's git tree (`Bridge/` is gitignored BY RULE —
 * `GITM_CASCADE_BRIDGE_GITIGNORE_LINE` maintained at `gitmNestedMaintain.ts:279`), curing the
 * dirty-tree merge blocker by construction rather than by another ignore exception.
 *
 * WHY IT STAYS SCP-LOCAL RATHER THAN JOINING THE LEDGER IN THE WORKSPACE BRIDGE: its binding reader
 * is `lane-teardown.sh`, a dependency-free `sh` hook whose only anchor is `$PWD` (the SCP dir). It
 * has no resolver and must not grow one. **The destination is decided by the tightest-reach READER,
 * not by the writer.**
 */
export const LANE_FILE_RELATIVE = ['Cascades', 'Bridge', 'lane.json'] as const;

/**
 * THE RETIRED SEAT, kept for READS ONLY. A lane written by an older CLI still sits here, and a
 * reader that knew only the new path would find nothing and silently skip the graceful ask — the
 * exact silent-degradation this fallback exists to prevent. Never written to again.
 */
export const LANE_FILE_BASENAME = '.bridge-lane.json';

export type ScpLaneRecord = {
  scpName: string;
  /** The SCP's sovereign port — the graceful-exit address (C965). */
  port: number;
  /** The spawned child's pid — the surgical signal target. */
  pid: number;
  /** Epoch ms at spawn. With `pid`, the durable identity that survives pid recycling. */
  startedAt: number;
  writtenAt: number;
  /**
   * C1017 · THE OWNER · the CLI daemon's pid — the fact the lane watchdog needs.
   *
   * THE MEASURED LEAK THIS SERVES: when the CLI dies, its direct child (`npm run bridge` → the
   * lane root, which is `pid` above) REPARENTS TO ppid 1 and keeps running, carrying nodemon and
   * the SCP server with it. Every open/close cycle stranded one such tree; four survived a single
   * SCS close. `selfOwnedShutdown` covers the SERVER when its window closes — **nothing covered
   * the LANE when its owner died.**
   *
   * WHY THE PID GOES IN THE LANE FILE: the lane must be able to answer "is my owner still alive?"
   * from a fact on disk, because it cannot ask a process that no longer exists. `ownerStartedAt`
   * rides alongside so the check is `pid + start-time` — the durable identity (C981), never a bare
   * pid, which recycles.
   */
  ownerPid: number;
  /** Epoch ms of the CLI daemon's own start — with `ownerPid`, the identity that survives reuse. */
  ownerStartedAt: number;
  /**
   * C995 · CARD 13 · THE LAUNCH-STAMPED CONFIG (the user's diagnosis).
   *
   * THE GAP THIS CLOSES: `nodemon.json` is DELIVERED by the mirror but CONSUMED by nodemon ONCE,
   * AT LAUNCH. A config change therefore reaches disk and never reaches a running lane — and a
   * citizen that was never mirrored gets nothing at all. C986 already solved that for IDENTITY by
   * stamping this file at spawn; the CONFIG was left on the old delivery path, and that asymmetry
   * WAS the gap. (Measured C994: the running lane still held the pre-C987 `pkill` hook in memory
   * while the corrected hook sat on disk.)
   *
   * THE LAW, AND WHY IT IS NOT "ALSO WRITE nodemon.json AT SPAWN": that would give one file TWO
   * WRITERS — the mirror and this method — which the Single-Writer Law forbids and which would
   * silently fight the mirror's own divergence guards. Instead: **`nodemon.json` stays a STABLE
   * STUB, and everything that can CHANGE lives HERE**, stamped fresh on every launch.
   *
   * THE TEST OF THE CURE: a change to teardown BEHAVIOUR still needs a mirror plus a lane restart;
   * a change to teardown VALUES needs neither, because the next spawn stamps it. This session's
   * whole stale-config problem was a VALUES problem wearing a BEHAVIOUR problem's clothes.
   */
  config: ScpLaneConfig;
};

/** The teardown's tunables — read by `lane-teardown.sh`, never hardcoded in it. */
export type ScpLaneConfig = {
  /** The route the graceful ask POSTs to. Versioned here so an older script cannot guess wrong. */
  gracefulExitPath: string;
  /** Seconds the ask may take before the script gives up on it. Bounded, never a gate. */
  askTimeoutSeconds: number;
  /**
   * Seconds to let the release actually run before the hook returns. A grace for the RELEASE, not
   * a wind-up for a signal — the route answers immediately and releases afterwards, so this is the
   * window in which watchers get let go. CHARGED TO EVERY TURN-OVER'S 7-SECOND BUDGET, so it is
   * deliberately small and deliberately visible here rather than buried in the script.
   */
  graceSeconds: number;
};

/** The defaults a spawn stamps unless something overrides them. */
export const DEFAULT_LANE_CONFIG: ScpLaneConfig = {
  gracefulExitPath: '/graceful-exit',
  askTimeoutSeconds: 2,
  graceSeconds: 0.4,
};

/** The CURRENT seat — the only path ever written. */
export function scpLaneFilePath(scpPath: string): string {
  return join(scpPath, ...LANE_FILE_RELATIVE);
}

/** The RETIRED seat — consulted on read only, never written. */
export function scpLaneFileLegacyPath(scpPath: string): string {
  return join(scpPath, LANE_FILE_BASENAME);
}

/**
 * READ THE LANE, new seat first then the retired one. Returns null when neither exists — which is
 * ORDINARY, not an error: `Bridge/` is gitignored, so a fresh clone or a never-booted citizen has
 * no lane at all, and every caller already declines safely on null.
 */
export function readScpLaneRecord(scpPath: string): ScpLaneRecord | null {
  for (const p of [scpLaneFilePath(scpPath), scpLaneFileLegacyPath(scpPath)]) {
    try {
      if (!existsSync(p)) continue;
      return JSON.parse(readFileSync(p, 'utf-8')) as ScpLaneRecord;
    } catch {
      // A corrupt lane at one seat must not hide a good one at the other.
      continue;
    }
  }
  return null;
}

/**
 * Stamp the lane. Called from the spawn method the moment the child exists — the one place all four
 * facts are in scope, and where file writes are already precedented (the boot log and the C961
 * timing instrument are written from the same method).
 *
 * NEVER THROWS. A lane file we failed to write costs us the surgical path for this lane; it must
 * not cost the user their spawn.
 */
export function writeScpLaneFile(
  scpPath: string,
  record: Omit<ScpLaneRecord, 'writtenAt' | 'config' | 'ownerPid' | 'ownerStartedAt'> & {
    config?: ScpLaneConfig;
  },
): boolean {
  try {
    if (record.pid <= 0) {
      // The spawn sentinel is -1 when child.pid is undefined. A record without a real pid would
      // hand the script a target it must decline anyway — say so once rather than writing a lie.
      log('scp.lane.skip', { reason: 'no-pid', scpName: record.scpName });
      return false;
    }
    const path = scpLaneFilePath(scpPath);
    const dir = dirname(path);
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    // The config is stamped EVERY launch — that is the whole point of card 13. A caller may
    // override it; absent an override the current defaults are written, so a lane never carries a
    // config older than its own process.
    const full: ScpLaneRecord = {
      ...record,
      config: record.config ?? DEFAULT_LANE_CONFIG,
      // C1017 · THE OWNER, stamped from THIS process — the CLI daemon writing the lane IS the owner,
      // so no caller can pass a wrong one. `ownerStartedAt` is derived from our own uptime rather
      // than trusted from outside, for the same reason.
      ownerPid: process.pid,
      ownerStartedAt: Math.round(Date.now() - process.uptime() * 1000),
      writtenAt: Date.now(),
    };
    writeFileSync(path, JSON.stringify(full, null, 2) + '\n', 'utf8');
    log('scp.lane.written', { scpName: record.scpName, port: record.port, pid: record.pid });
    return true;
  } catch (err) {
    log('scp.lane.error', {
      scpName: record.scpName,
      error: err instanceof Error ? err.message : String(err),
    });
    return false;
  }
}
