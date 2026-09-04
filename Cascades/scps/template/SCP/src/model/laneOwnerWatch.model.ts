/**
 * ⚠ RETIRED FROM THE BOOT PATH (C1018) — KEPT, NOT DELETED, AND HERE IS WHY.
 *
 * THIS NEVER RAN. Its logic was sound and its 5-case dry run passed, but it was seated in the
 * SHORTEST-LIVED process of a five-deep lane: `selfOwnedShutdown`'s 8000ms grace killed this server
 * at t+8s, mid-count, against a 15000ms confirmation window. **The faster self-shutdown silently
 * voided the slower — the PRE-EMPTION HAZARD.** The teardown now lives in `selfOwnedShutdown`
 * itself (`signalLaneRoot()`), which cannot be pre-empted because it IS the pre-emptor.
 *
 * WHY IT IS RETAINED: it remains the only candidate cover for an **ABRUPT CLI DEATH** — a SIGKILLed
 * daemon whose SCP window never closes, so `selfOwnedShutdown` never fires and nothing notices the
 * owner is gone. Re-arming it for that case would require a host that outlives this server.
 * **Do not re-arm it here as-is; it would fail the same way.**
 *
 * ── the original design note follows ────────────────────────────────────────────────────────────
 *
 * laneOwnerWatch.model · C1017 · THE LANE OWNER WATCH (the user's pending means)
 *
 * *"Cleaning Up the Nodemon Leak and the Associated Nodes would Prune the Parental Chain in that
 *   Scope … Ensure via a True Clean Up Process on any Type of Exit."*
 *
 * ── THE MEASURED LEAK ───────────────────────────────────────────────────────────────────────────
 * When the CLI daemon dies, its DIRECT CHILD — `npm run bridge`, the lane root — reparents to
 * `ppid 1` and keeps running, carrying nodemon and this server with it. Measured repeatedly this
 * session: closing the SCS left FOUR orphan trees and freed exactly one lane; a later open/close
 * cycle stranded another pair. **This is the leak, and it is the only one still reproducing.**
 *
 * ── WHY NOTHING EXISTING COVERS IT ──────────────────────────────────────────────────────────────
 * `selfOwnedShutdown.model.ts` exits THIS SERVER when its WINDOW closes — a different event with a
 * different owner. It cannot help here, because when the CLI dies the window may never close at
 * all. The completion audit (C1011) named this gap as the most load-bearing one on the board, and
 * the C973 research names the remedy in one line: **the CHILD monitors the PARENT and
 * self-terminates.**
 *
 * ── WHY THE LANE ROOT, NOT THIS PROCESS ─────────────────────────────────────────────────────────
 * Exiting only ourselves would accomplish nothing: nodemon would simply restart us, and the orphan
 * tree would remain. **The thing that must die is the LANE ROOT** — the pid the CLI recorded in the
 * lane file at spawn (C986), which C994 established IS the `npm run bridge` wrapper, i.e. exactly
 * the process that reparents to 1. Signal that and the whole tree — wrapper, nodemon, this
 * server — goes with it.
 *
 * ── THE IDENTITY LAW (C981) AND WHERE THIS FALLS SHORT, STATED PLAINLY ──────────────────────────
 * A bare pid is NOT an identity — pids recycle. This watch checks LIVENESS ONLY
 * (`process.kill(pid, 0)`), not start-time, and that is a deliberate, ASYMMETRIC compromise:
 *   · If the owner's pid is RECYCLED to an unrelated process, this reads it as ALIVE and NEVER
 *     tears down. **The failure mode is a MISSED cleanup — the orphan we already have — never a
 *     wrong kill.** That direction is safe, so liveness alone is acceptable for the owner.
 *   · The LANE ROOT is only ever signalled AFTER the owner is confirmed gone, and the root is a
 *     process THIS lane was spawned as part of — not an arbitrary pid we resolved by pattern.
 * **On any doubt: DECLINE.** Leaving a process alive is strictly safer than killing a stranger —
 * the founding law of this Diamond. If a stricter identity is ever wanted here, `ownerStartedAt`
 * is already carried in the lane record and needs only to be compared.
 *
 * ── THREE GUARDS BEFORE IT CAN EVER FIRE ────────────────────────────────────────────────────────
 *  1. **SPAWNED ONLY** — `SCS_SPAWNED_SCP=1` is set by the CLI's spawn seat alone. A developer
 *     running `npm run bridge` by hand has NO owner to lose and must never self-kill. (Same marker
 *     `selfOwnedShutdown` gates on — reused deliberately rather than reinvented.)
 *  2. **THE LANE FILE MUST CARRY AN OWNER** — a lane written by an older CLI has no `ownerPid`.
 *     Absent means UNKNOWN, and unknown means DO NOTHING.
 *  3. **CONSECUTIVE CONFIRMATIONS** — one failed probe is not a death. A brief scheduler hiccup or
 *     a pid table blip must not tear down a healthy lane, so the owner must read dead
 *     `REQUIRED_CONFIRMATIONS` times in a row before anything is signalled.
 *
 * Template: `selfOwnedShutdown.model.ts` (the spawn-marker + grace discipline) ·
 *           `scpLaneFile.model.ts` (the record this reads).
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

/** Beside `.bridge-restart.json`, in the SCP package dir — the C996 seat. */
const LANE_RELATIVE = ['Cascades', 'Bridge', 'lane.json'] as const;
/** The retired seat, still read so an older lane is not invisible (C996's two-rung discipline). */
const LANE_LEGACY = '.bridge-lane.json';

/** Deliberately unhurried: this watches for an event that is permanent once it happens. */
const POLL_MS = 5_000;
/** One missed probe is a hiccup; three in a row across 15s is a death. */
const REQUIRED_CONFIRMATIONS = 3;

type LaneRecord = {
  scpName?: string;
  pid?: number;
  startedAt?: number;
  ownerPid?: number;
  ownerStartedAt?: number;
};

let timer: NodeJS.Timeout | null = null;
let deadReadings = 0;

function say(event: string, detail: Record<string, unknown>): void {
  // NEVER SILENCE THE SIGNAL — every decline names its reason, so a lane that does NOT tear down
  // explains itself rather than looking like a mechanism that never ran.
  console.log('[LaneOwnerWatch]', event, JSON.stringify(detail));
}

function readLane(cwd: string): LaneRecord | null {
  for (const p of [join(cwd, ...LANE_RELATIVE), join(cwd, LANE_LEGACY)]) {
    try {
      if (!existsSync(p)) continue;
      return JSON.parse(readFileSync(p, 'utf-8')) as LaneRecord;
    } catch {
      continue; // a corrupt lane at one seat must not hide a good one at the other
    }
  }
  return null;
}

/** `kill(pid, 0)` throws when the pid does not exist — the cheapest liveness probe there is. */
function pidAlive(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

/**
 * ARM THE WATCH. Idempotent — a second call is a no-op, so a re-entrant boot cannot stack timers.
 * Returns whether the watch actually armed, so the caller can log the reason it did not.
 */
export function armLaneOwnerWatch(cwd: string = process.cwd()): boolean {
  if (timer !== null) return true;

  // GUARD 1 · spawned lanes only.
  if (process.env.SCS_SPAWNED_SCP !== '1') {
    say('skip', { reason: 'not-a-spawned-lane' });
    return false;
  }

  const lane = readLane(cwd);
  // GUARD 2 · an owner must be declared. Absent = unknown = do nothing.
  if (!lane || typeof lane.ownerPid !== 'number' || lane.ownerPid <= 0) {
    say('skip', { reason: 'lane-declares-no-owner' });
    return false;
  }
  const ownerPid = lane.ownerPid;
  const ownerStartedAt = typeof lane.ownerStartedAt === 'number' ? lane.ownerStartedAt : 0;
  const laneRootPid = typeof lane.pid === 'number' ? lane.pid : 0;

  if (laneRootPid <= 0) {
    // Without the lane root we could only kill ourselves — and nodemon would restart us, leaving
    // the orphan tree exactly as it was. Refuse rather than perform a teardown that cannot work.
    say('skip', { reason: 'lane-declares-no-root-pid', ownerPid });
    return false;
  }

  say('armed', { ownerPid, laneRootPid, pollMs: POLL_MS, confirmations: REQUIRED_CONFIRMATIONS });

  timer = setInterval(() => {
    // THE OWNER IS ALIVE — including the case where its pid was recycled to a stranger: either way
    // OUR owner is gone, so a recycled pid counts as dead, never as alive.
    const alive = pidAlive(ownerPid);
    if (alive) {
      if (deadReadings !== 0) say('recovered', { ownerPid, after: deadReadings });
      deadReadings = 0;
      return;
    }

    deadReadings += 1;
    if (deadReadings < REQUIRED_CONFIRMATIONS) {
      say('owner-missing', { ownerPid, reading: deadReadings, of: REQUIRED_CONFIRMATIONS });
      return;
    }

    // CONFIRMED. Verify the lane root is still OURS before signalling it — the C981 law.
    if (!pidAlive(laneRootPid)) {
      say('lane-root-already-gone', { laneRootPid });
      stopLaneOwnerWatch();
      return;
    }
    say('owner-dead-tearing-down', { ownerPid, ownerStartedAt, laneRootPid });
    stopLaneOwnerWatch();
    try {
      // SIGTERM, NEVER -9. Proven sufficient in the field this session: every orphan tree cleared
      // with SIGTERM alone and no SIGKILL was needed. A graceful signal also lets nodemon and the
      // wrapper run their own teardown, which is the whole point of a TRUE clean-up.
      process.kill(laneRootPid, 'SIGTERM');
      say('lane-root-signalled', { laneRootPid, signal: 'SIGTERM' });
    } catch (err) {
      say('signal-failed', { laneRootPid, message: err instanceof Error ? err.message : String(err) });
    }
    // Leave ourselves last: killing the root takes this process with it, but if that signal is
    // somehow refused we must not linger as the very orphan we exist to prevent.
    setTimeout(() => {
      say('self-exit', { reason: 'owner-gone' });
      process.exit(0);
    }, 2_000).unref();
  }, POLL_MS);

  // The watch must never be the reason the process stays alive — if everything else has finished,
  // this timer should not hold the loop open.
  timer.unref();
  return true;
}

/** Disarm — idempotent. */
export function stopLaneOwnerWatch(): void {
  if (timer === null) return;
  clearInterval(timer);
  timer = null;
  deadReadings = 0;
}

/** Diagnostics — the Concluder surface. */
export function laneOwnerWatchState(): { armed: boolean; deadReadings: number } {
  return { armed: timer !== null, deadReadings };
}
