/**
 * Self-Owned Shutdown · THE SERVER CONTROLS ITS OWN ACTIVE STATE THROUGH THE CONNECTION
 *
 * The structural directive: a SPAWNED SCP server exits itself when its window closes,
 * rather than lingering as an orphaned process. The signal is the WebSocket connection —
 * the server that once served ≥1 client and now serves 0 arms a grace timer; on expiry
 * (no reconnect within the grace window) it exits gracefully. A window REFRESH reconnects
 * within the window, canceling the timer, so the server survives an intentional refresh.
 *
 * Three guards keep this from misfiring:
 *   (1) THE SPAWN-ENV MARKER — only a SPAWNED SCP server carries SCS_SPAWNED_SCP=1 (set
 *       spawn-side in scpSpawn.model.ts, the sole spawn call site, deliberately not sourced
 *       from parentEnv). A dev `npm run bridge` (nodemon, no marker) NEVER self-kills.
 *   (2) THE HAD-CONNECTIONS PREDICATE — a server that never received a window does not exit
 *       (armSelfShutdownTimer is a no-op until noteClientRegistered has fired at least once).
 *   (3) THE GRACE CANCELS ON RECONNECT — registerClient calls cancelSelfShutdownTimer, so a
 *       window refresh (disconnect → reconnect within the grace window) survives.
 *
 * Timer + hadConnections are MODULE-SCOPE (matches the concept's convention — the reducers
 * are the arm/cancel sites; the durable flags live at module scope alongside them).
 *
 * Citation: scpSpawn.model.ts (SCS_SPAWNED_SCP=1 spawn-env marker · the spawn-only guard).
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { resolveBridgeRoot } from '../../scsBridge/bridgeRoot.model';

// ~8s grace window. Long enough to survive a window refresh (disconnect → reconnect),
// short enough that a genuinely-closed window frees the process promptly.
const SELF_SHUTDOWN_GRACE_MS = 8000;

// PSSM · W2 · THE SERVER PRE-EXIT STATUS WRITE (template side · SYNC MIRROR of the
// bridge setScpStatus writer). Just before process.exit(0) this spawned SCP server
// marks its OWN persisted status → 'pending' in the WORKSPACE SCPs.json, so the daemon's
// parent-dir status watch fires the live → pending lifecycle transition and the TUI row
// follows. The process is EXITING, so the write is SYNCHRONOUS (atomic tmp + renameSync)
// and fully try/catch-wrapped — a failure here must NEVER block or delay the exit.
//
// scpName source: process.env.SCP_NAME (scpSpawn.model.ts injects it AFTER the parentEnv
// spread — authoritative). workspace SCPs.json: resolveBridgeRoot() returns
// <junction>/Cascades/Bridge, so its parent dir + 'SCPs.json' is the registry file the
// bridge writer and the daemon watcher both agree on. The SHAPE ({name, status,
// statusUpdatedAt}) is byte-identical to scpSessionRegistry.setScpStatus (W1).
function writeOwnStatusPendingSync(): void {
  try {
    const scpName = process.env.SCP_NAME;
    if (typeof scpName !== 'string' || scpName.length === 0) return; // dev / no designation → skip
    // resolveBridgeRoot() = <junction>/Cascades/Bridge → SCPs.json is a sibling of Bridge.
    const scpsJsonPath = path.join(path.dirname(resolveBridgeRoot()), 'SCPs.json');
    let data: { scps?: Array<Record<string, unknown>> } = {};
    try {
      data = JSON.parse(fs.readFileSync(scpsJsonPath, 'utf8')) as typeof data;
    } catch {
      data = {}; // absent / unparsable → UPSERT into a fresh shape (mirror of the bridge writer)
    }
    const scps = Array.isArray(data.scps) ? data.scps : [];
    const statusUpdatedAt = Date.now();
    const idx = scps.findIndex((entry) => entry?.name === scpName);
    if (idx < 0) {
      scps.push({ name: scpName, status: 'pending', statusUpdatedAt });
    } else {
      scps[idx] = { ...scps[idx], status: 'pending', statusUpdatedAt };
    }
    const payload = JSON.stringify({ ...data, scps }, null, 2);
    const tmp = scpsJsonPath + '.tmp';
    fs.writeFileSync(tmp, payload, 'utf8');
    fs.renameSync(tmp, scpsJsonPath); // atomic REPLACE — the daemon's dir-watch surfaces this
    console.log('[SCP Server] pre-exit status → pending written:', scpName);
  } catch (err) {
    // Never block the exit — best-effort only.
    console.error('[SCP Server] pre-exit status write failed (non-blocking):', err);
  }
}

// THE HAD-CONNECTIONS PREDICATE · guard (2). Latches true the first time a client registers.
// A server that never received a window will never arm the timer.
let hadConnections = false;

// Module-scope grace timer handle. Non-null ⇒ a shutdown is pending (cancelable by reconnect).
let selfShutdownTimer: ReturnType<typeof setTimeout> | null = null;

/**
 * THE SPAWN-ENV MARKER · guard (1). True ONLY when this process was spawned by the bridge
 * (SCS_SPAWNED_SCP=1 in the spawn descriptor env). A dev `npm run bridge` never carries it.
 * Read live (not cached) so tests can toggle process.env deterministically.
 */
export function isSpawnedScpServer(): boolean {
  return process.env.SCS_SPAWNED_SCP === '1';
}

/**
 * Records that a client has registered. Latches the had-connections predicate and cancels
 * any pending self-shutdown (a reconnect within the grace window survives). Called from the
 * registerClient reducer.
 */
export function noteClientRegistered(): void {
  hadConnections = true;
  cancelSelfShutdownTimer();
}

/**
 * Cancels a pending self-shutdown grace timer, if armed. Idempotent. Called from
 * registerClient (reconnect survives) and available for explicit teardown.
 */
export function cancelSelfShutdownTimer(): void {
  if (selfShutdownTimer !== null) {
    clearTimeout(selfShutdownTimer);
    selfShutdownTimer = null;
    console.log('[SCP Server] self-shutdown grace canceled — client reconnected');
  }
}

/**
 * Arms the self-shutdown grace timer when the last client connection has closed.
 * No-op unless ALL THREE guards pass:
 *   (1) isSpawnedScpServer() — spawn-env marker present
 *   (2) hadConnections — a window was once served
 *   (3) remainingConnections === 0 — the last one just closed
 * An already-armed timer is left in place (a second 0-remaining event does not restart it).
 * Called from the unregisterClient reducer with the post-removal connection count.
 */
/**
 * C1018 · THE LANE-ROOT REACH — take the WHOLE LANE down, not just this process.
 *
 * ── WHY THIS LIVES HERE AND NOT IN A WATCHDOG (the C1017 failure, in one paragraph) ─────────────
 * C1017 put a poller in this server: read the lane's owner pid, confirm it dead 3× at 5s, then
 * signal the lane root. **It never logged a single line.** The grace below is 8000ms and the
 * confirmation window was 15000ms — so THIS mechanism killed that one at t+8s, mid-count, every
 * time. Two self-shutdown mechanisms in one process where the faster silently voids the slower:
 * **the PRE-EMPTION HAZARD.** Nothing declared their relationship, so `8 < 15` was discovered in
 * the field instead of at the desk.
 *
 * The cure is not a faster poll — that only re-times the same race. **The mechanism that WINS the
 * race is the one that must carry the teardown.** This one is alive at the moment of the event
 * because it IS the event; it cannot be pre-empted because it is the pre-emptor.
 *
 * ── WHAT IT COMPLETES ───────────────────────────────────────────────────────────────────────────
 * This file's own opening line already promises that a spawned server *"exits itself when its window
 * closes, rather than lingering as an orphaned process."* It kept that promise for ONE process and
 * left four behind: `npm run bridge` → `sh -c …` → `npm exec nodemon` → nodemon, which reparent to
 * `ppid 1` and keep running. **This finishes the sentence the file already started.**
 *
 * ── WHY NO CONFIRMATION COUNTING IS NEEDED ──────────────────────────────────────────────────────
 * The 8s grace IS the confirmation: it fires only after the window stayed gone, and a reconnect
 * cancels it. A turn-over therefore never reaches here — the window persists and reconnects — so
 * the discrimination C1017 tried to build with a counter is **inherited free** from the guard that
 * already exists.
 *
 * SIGTERM, NEVER `-9` — field-proven sufficient this session, and it lets nodemon and the npm
 * wrapper run their own teardown. DECLINE ON DOUBT: an unreadable lane, an absent root pid, or a
 * root that is already gone all mean DO NOTHING. Never guess a pid; a wrong signal reaches a
 * stranger, and leaving a process alive is strictly safer than that.
 */
function signalLaneRoot(): void {
  try {
    const fs = require('node:fs') as typeof import('node:fs');
    const path = require('node:path') as typeof import('node:path');
    // The C996 seat, then the retired one — a lane written by an older CLI must still be readable.
    const seats = [
      path.join(process.cwd(), 'Cascades', 'Bridge', 'lane.json'),
      path.join(process.cwd(), '.bridge-lane.json'),
    ];
    let root = 0;
    for (const seat of seats) {
      if (!fs.existsSync(seat)) continue;
      try {
        const rec = JSON.parse(fs.readFileSync(seat, 'utf-8')) as { pid?: unknown };
        if (typeof rec.pid === 'number' && rec.pid > 0) {
          root = rec.pid;
          break;
        }
      } catch {
        continue; // a corrupt lane at one seat must not hide a good one at the other
      }
    }
    if (root <= 0) {
      console.log('[SCP Server] lane-root teardown SKIPPED · reason=no-root-pid-in-lane');
      return;
    }
    if (root === process.pid) {
      // Cannot happen with the current spawn shape, but signalling ourselves here would pre-empt
      // the writeOwnStatusPendingSync below and lose the status transition.
      console.log('[SCP Server] lane-root teardown SKIPPED · reason=root-is-self', root);
      return;
    }
    process.kill(root, 'SIGTERM');
    console.log('[SCP Server] lane-root SIGTERM sent · pid=' + String(root));
  } catch (err) {
    // A teardown that throws must never block the exit it precedes.
    console.log('[SCP Server] lane-root teardown failed ·', String(err));
  }
}

export function armSelfShutdownTimer(remainingConnections: number): void {
  if (remainingConnections !== 0) return; // still-connected clients — nothing to do
  if (!isSpawnedScpServer()) return; // guard (1) — dev bridge never self-kills
  if (!hadConnections) return; // guard (2) — never received a window
  if (selfShutdownTimer !== null) return; // already pending — do not restart the clock

  console.log(
    `[SCP Server] zero client connections — arming self-shutdown grace (${SELF_SHUTDOWN_GRACE_MS}ms)`,
  );
  selfShutdownTimer = setTimeout(() => {
    selfShutdownTimer = null;
    console.log('[SCP Server] zero client connections — self-shutdown');
    // PSSM · W2 · SYNC-mark own persisted status → 'pending' JUST PRIOR to exit, so the
    // daemon's SCPs.json dir-watch fires the live → pending transition. try/catch inside
    // the helper — never blocks the graceful exit.
    writeOwnStatusPendingSync();
    // C1018 · take the LANE down, not just this process. Ordered AFTER the status write so the
    // daemon's live → pending transition is already on disk: the SIGTERM below may reap this
    // process along with the rest of the tree, and a status write that never landed would leave
    // the rail claiming a lane that is gone.
    signalLaneRoot();
    // Graceful exit — detached spawned process releases its port + resources.
    process.exit(0);
  }, SELF_SHUTDOWN_GRACE_MS);
  // Do not keep the event loop alive solely for this timer — if the process is otherwise
  // idle it may exit on its own; if not, the timer still fires at the deadline.
  if (typeof selfShutdownTimer.unref === 'function') {
    selfShutdownTimer.unref();
  }
}
