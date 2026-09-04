/**
 * scpGracefulExitAsk.model · THE CLEAN EXIT · step 5 · THE CLI-SIDE ASK (C992)
 *
 * THE USER'S LAW THIS SERVES: *"the Clogging the FileSystem Reactive Stream is a No Go. We need our
 * Graceful Exit to be the Primary Means."* SIGKILL releases nothing. This gives the SCP its EARLIEST
 * possible chance to release — before nodemon has even noticed the restart trigger.
 *
 * WHY FIRE-AND-FORGET, NEVER AWAITED (C992 Salvo · decision 1 · SUPERSEDES the C980 "BOUNDED-ASK"
 * naming): the route ANSWERS BEFORE IT RELEASES (`vue.principle.ts:2792` — `res.json()` precedes the
 * release). So awaiting the response proves the request was RECEIVED and NOTHING about the release.
 * Awaiting buys a fact we do not need and prices it in the 7-second turn-over budget. Issuing without
 * awaiting also makes THE UNCONDITIONAL-WRITE INVARIANT (C980) structural rather than guarded: there
 * is no await to reject, no catch to fall through, no branch that can skip the caller's write.
 *
 * WHERE IT IS CALLED FROM: immediately AFTER `recordScpRestartSignal()` — the opening bracket of the
 * 7-second clock — and immediately BEFORE the restart-trigger write. Placing it BEFORE the stamp
 * would hide its latency from our own instrument; after the stamp, any regression stays measurable.
 * The latency is ~0 either way, so honesty is free here (the C988 sibling law: a gate reading lower
 * is not automatically better).
 *
 * WHAT DOES **NOT** CALL THIS: the crash path (`requestFactLicensedRestart`). A crashed lane is
 * childless BY DEFINITION (`scpCrashState.model.ts:255`) — there is no live server to release, so the
 * ask is a guaranteed ECONNREFUSED charged to a recovery path. That leg is DROPPED, not deferred.
 */

import { existsSync, readFileSync } from 'node:fs';
import { request } from 'node:http';
import { join } from 'node:path';
import { log } from './debugLog';
import { readScpLaneRecord } from './scpLaneFile.model';

/** The bounded ceiling on the ask. Mirrors `lane-teardown.sh:45`'s accepted `curl -m 2`. */
const ASK_TIMEOUT_MS = 2_000;

export type GracefulExitAddress = { port: number; via: 'lane-file' | 'bound-self' | 'bound-dir' };

function readJson(path: string): Record<string, unknown> | null {
  try {
    if (!existsSync(path)) return null;
    return JSON.parse(readFileSync(path, 'utf-8')) as Record<string, unknown>;
  } catch {
    return null;
  }
}

/**
 * THE ADDRESS, FROM A DIRECTORY ALONE (C992 Salvo · decision 5 · L3).
 *
 * THE PORT IS `p`, NOT `p+1` — settled from source. `/graceful-exit` is registered on the MAIN
 * express app bound at `initialServerState.port` (`server.principle.ts:103`). The reflected listener
 * at `p+1` is a SEPARATE `express()` instance carrying only `/files` (`server.principle.ts:122-134`)
 * — a POST there would 404 silently, which is the worst available failure.
 *
 * NEVER uses `activeBridgePort` — that is the BRIDGE DAEMON's own port (7111), not the SCP's (7702).
 * Measured, not assumed: the two sit side by side in the same bridge.json.
 *
 * Name-free by construction, which is what cures the carded empty-`scpName` hazard: every rung
 * derives from the directory.
 */
export function resolveScpGracefulExitPort(scpDir: string): GracefulExitAddress | null {
  // RUNG 1 · the lane file the CLI itself stamped at spawn. The model names `.port` as "the
  // graceful-exit address (C965)", and the shipped shell reader already dials exactly this
  // (`lane-teardown.sh:45`). A TS reader did not exist until now.
  // C996 · the shared two-rung reader — new seat (`Cascades/Bridge/lane.json`) then the retired
  // one. Absence at BOTH is ordinary, never an error: `Bridge/` is gitignored, so a fresh citizen
  // has no lane and rung 3 below declines rather than guessing an address.
  const lane = readScpLaneRecord(scpDir) as { port?: unknown } | null;
  const lanePort = typeof lane?.port === 'number' ? lane.port : 0;
  if (lanePort > 0) return { port: lanePort, via: 'lane-file' };

  // RUNG 2 · the SCP-EMBEDDED bridge.json. Measured distinction: the embedded copy self-tags with a
  // top-level `scpName` (the workspace copy does NOT), so the SCP's own directory yields its own
  // identity with no name passed in.
  const embedded = readJson(join(scpDir, 'Cascades', 'Bridge', 'bridge.json'));
  const bound = (embedded?.boundScps ?? null) as Record<string, { port?: unknown; dir?: unknown }> | null;
  if (bound !== null) {
    const selfName = typeof embedded?.scpName === 'string' ? embedded.scpName : '';
    const byName = selfName !== '' ? bound[selfName] : undefined;
    if (byName !== undefined && typeof byName.port === 'number' && byName.port > 0) {
      return { port: byName.port, via: 'bound-self' };
    }
    // RUNG 2b · match on `dir`. Independent of BOTH names — the entry that claims this directory.
    for (const entry of Object.values(bound)) {
      if (typeof entry.dir === 'string' && entry.dir === scpDir && typeof entry.port === 'number' && entry.port > 0) {
        return { port: entry.port, via: 'bound-dir' };
      }
    }
  }

  // RUNG 3 · DECLINE. Never fabricate an address — a guessed port reaches SOMEONE ELSE'S process.
  // Mirrors the skip discipline already at gitmRevertToStable:169-173.
  return null;
}

/**
 * ISSUE THE ASK. Returns immediately; the caller's next statement is its restart-trigger write.
 *
 * NEVER THROWS, NEVER AWAITS, NEVER GATES. A 404 (older SCP build), ECONNREFUSED (already gone) and
 * a clean 200 are all ORDINARY — they are logged and nothing else. The SCP being already down is the
 * outcome we wanted anyway.
 */
export function askScpGracefulExit(scpDir: string, leg: string): void {
  const address = resolveScpGracefulExitPort(scpDir);
  if (address === null) {
    // NEVER SILENCE THE FAILURE SIGNAL — a decline is the diagnosis, not a non-event.
    log('scp.graceful-ask.skip', { reason: 'no-address', scpDir, leg });
    return;
  }
  askScpGracefulExitByPort(address.port, address.via, leg);
}

/**
 * THE SAME ASK, ADDRESSED BY PORT — for the caller that already HOLDS the port and has no directory
 * to resolve one from.
 *
 * C1023 · this exists for the single-lane close's cross-restart orphan branch, which knows a port
 * (from `spawnsByScp`) but not a path: a daemon that did not spawn the lane never recorded its
 * directory. Without this, that branch could only signal — the one case where a release matters most,
 * because a cross-restart orphan has been holding its watchers the longest.
 *
 * Extracted rather than duplicated: `askScpGracefulExit` above now calls straight through, so there
 * is exactly ONE request implementation and one set of telemetry names to reason about.
 */
export function askScpGracefulExitByPort(port: number, via: string, leg: string): void {
  const address = { port, via };
  try {
    const req = request(
      { host: '127.0.0.1', port: address.port, path: '/graceful-exit', method: 'POST', timeout: ASK_TIMEOUT_MS },
      (res) => {
        log('scp.graceful-ask.answered', { port: address.port, via: address.via, status: res.statusCode ?? 0, leg });
        res.resume(); // drain — an undrained response holds the socket open
      },
    );
    req.on('timeout', () => {
      log('scp.graceful-ask.timeout', { port: address.port, leg });
      req.destroy();
    });
    req.on('error', (err: Error) => {
      log('scp.graceful-ask.unreachable', { port: address.port, via: address.via, message: err.message, leg });
    });
    req.end();
    log('scp.graceful-ask.issued', { port: address.port, via: address.via, leg });
  } catch (err: unknown) {
    log('scp.graceful-ask.error', { message: err instanceof Error ? err.message : String(err), leg });
  }
}
