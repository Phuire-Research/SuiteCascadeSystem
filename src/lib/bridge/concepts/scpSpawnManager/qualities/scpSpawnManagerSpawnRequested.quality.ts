/**
 * scpSpawnManagerSpawnRequested · Phase B.4 · Cycle 132
 *
 * Method+Reducer Quality (the most complex in B.4). The Method:
 *   1. validateScpName (LOCK 5 · Card-PSS · 7-check guard at TOP)
 *   2. getChildProcess(scpName) idempotency guard (LOCK 2 · prevents double-spawn)
 *   3. spawn() the child process synchronously
 *   4. setChildProcess(scpName, child) into module-Map (MMUI)
 *   5. Bind 'exit' handler → deleteChildProcess + dispatchFromHandler(Q3 + DyingToGone)
 *   6. Bind 'error' handler → deleteChildProcess + dispatchFromHandler(Q4 + DyingToGone)
 *   7. strategyDetermine Q2 (SpawnSucceeded) via deck.scpSpawnManager.e.*
 *
 * Reducer: returns {} — no own-state mutation. Form-α: Method drives; Q2 commits.
 *
 * LOCK 3 rationale: Method-inline handler binding gives closure access to
 *   payload fields (scpName, port, pid) at spawn time. ChildProcess is
 *   per-spawn ephemeral; no rebinding risk (LOCK 2 guard makes Method idempotent).
 *
 * LOCK 6 sequencing: spawn() is synchronous; 'exit'/'error' events fire on
 *   next event-loop tick AFTER the Method's strategyDetermine(Q2) returns.
 *   M62 enqueues Q2 before any handler dispatch.
 *
 * PID sentinel -1: child.pid may be undefined for spawn-failed processes
 *   (rare race). Q2 commits pid=-1; Q4 deletes the entry shortly after.
 *   animatedTui consumers read .port and .browserUrl, not .pid.
 *
 * Template: scpMessageRouter/qualities/scpMessageRouterBmrEnvelopeReceived.quality.ts
 *           (form-α Method + strategyDetermine)
 *
 * Citation: M62 (sequential ActionStream) · M63 · M60 (MMUI escape hatch)
 * Citation: R1 Card 21 (form-α) · R1 Card 23 (Pattern A+Hybrid) · R1 Card 24 (Card-PSS)
 * Citation: SUITE-3-YELLOW-B4-SPAWNMGR-BLUEPRINT.md §2.5 · LOCK 2/3/5/6
 * Citation: SUITE-4-GREEN-B4-SPAWNMGR-BIDIRECTIONAL.md §3 LOCKs CONFIRMED
 */

import {
  createQualityCardWithPayload,
  createAsyncMethodWithConcepts,
  selectPayload,
  muxiumConclude,
  strategySuccess,
  strategyDetermine,
} from 'stratimux';
import { spawn } from 'node:child_process';
import { get as httpGet } from 'node:http';
import type { ScpSpawnManagerState } from '../scpSpawnManager.type';
import type {
  ScpSpawnManagerSpawnRequestedPayload,
  ScpSpawnManagerSpawnRequested,
  ScpSpawnManagerSpawnSucceededPayload,
} from './types';
import { validateScpName } from './scpNameValidation';
import {
  getChildProcess,
  setChildProcess,
  setScpPath,
  deleteChildProcess,
  dispatchFromHandler,
  consumeVoluntaryClose,
} from './childProcessRegistry';
import { buildBridgeSpawnDescriptor, resolveActualScpPortPair } from '../../../scpSpawn.model';
import { readScpRegistry } from '../../../../scp/scpPersistence';
import { log } from '../../../debugLog';
import { appendScpBootLogLine } from '../../../scpBootLog';
import { writeScpLaneFile, DEFAULT_LANE_CONFIG } from '../../../scpLaneFile.model';

// C1075 · SALVO M · the double-dispatch window the port probe opens (idempotency is checked synchronously, the
// probe awaits) is closed by this set: a second request for the same SCP during resolution is skipped, loudly.
const pendingSpawns = new Set<string>();
// The registry's OTHER pairs (live + archived) — never walk onto a sibling's reserved pair.
function reservedPairsExcluding(scpName: string): Set<number> {
  const out = new Set<number>();
  try {
    const reg = readScpRegistry();
    const all = [...reg.scps, ...(reg.archivedScps ?? [])] as Array<{ name?: string; boundBridgePort?: number | null }>;
    for (const e of all) {
      if (e.name === scpName) continue;
      const p = e.boundBridgePort;
      if (typeof p === 'number') { out.add(p); out.add(p + 1); }
    }
  } catch { /* no registry → no excludes */ }
  return out;
}
// TOH-10 · step 5 · THE TIMING INSTRUMENT. The drain already SEES every build-stage line;
// the 500-line ring buffer simply ate them before anyone could read them (L3: 449 lines
// recovered after a 7-minute turn-over, ZERO of them build stages). Stamping at ARRIVAL
// into an append-only jsonl is the whole cure — same line, a seat that does not forget.
import { observeScpBootTimingLine } from '../../../scpBootTiming.model';
// TOH-7 · THE CRASH-STATE RELAY — the live drain is the ONLY witness when nodemon survives its
// own server (`child.on('exit')` cannot fire: the child held here is the LANE, not the server).
import {
  observeScpOutputLine,
  observeScpLaneExit,
  clearScpCrashState,
  requestFactLicensedRestart,
} from '../../../scpCrashState.model';
import { setScpStatus } from '../../../scpSessionRegistry';
import { getActiveScsBridgeMuxiumHandle } from '../../../scsBridgeMuxium';
import type { GitmSetStatusPayload } from '../../gitm/qualities/types';

// ─── HPRD · HTTP Poll Readiness Detection ─────────────────────────────
// Polls GET http://localhost:{port}/ at 500ms intervals, up to 60s budget.
// Cycle 146 enhancement (SSR-Ready Marker · SRMK): TCP-bind alone is not
// proof that Vue SSR has compiled its bundle. Vite binds the dev port in
// ~200ms and returns a stub HTML shell while it compiles the SSR bundle
// over the next 2-5 seconds. SRMK inspects the response body for an SSR-
// ready marker — presence of a compiled module script tag (e.g.
// `<script src="/@id/` or `<script type="module" src="/src/`) — and
// rejects the probe attempt if the response body is the un-compiled stub.
// On marker-not-found the probe retries at the next interval. If the
// marker can never be confidently identified, a wait-delay fallback of
// 2000ms after first TCP-bind elapses and the probe declares ready anyway
// (BRRG fallback — gate must not block forever).
// Citation: SUITE-7-FUCHSIA-DIAMOND-146-BOOT-OVERLAY-CLINICAL.md §Fix B
// Citation: SUITE-4-GREEN-DIRECT-SPAWN-AUDIT.md §2 (HTTP Poll Readiness Detection)
const SSR_READY_WAIT_DELAY_MS = 2_000;
function looksSsrReady(body: string): boolean {
  // SRMK markers — Vue SSR bundle compiled signals. Any one of these is
  // sufficient evidence the bundle is wired into the served HTML.
  if (body.length < 200) return false; // sub-stub heuristic
  if (/<script[^>]+src=["']\/@(?:id|vite|fs)\//i.test(body)) return true;
  // M4 · MARKER-DRIFT CURE (D-WR C628 · R7 markerHit:false on 3/3, bodyLen ~14.7KB).
  // The template Vite client build (vite.client.config.ts rollupOptions.output) emits the
  // entry chunk to `islands/[name]-[hash].js` and assets to `islands/assets/[name]-[hash].[ext]`,
  // so the served SSR shell (vue.principle.ts wrapInDocument) carries
  //   <script type="module" crossorigin src="/islands/main-<hash>.js"></script>
  // and <link ... href="/islands/assets/main-<hash>.css">. The prior marker only matched
  // /src, /assets, or /@ — NONE match /islands, so the compiled bundle read markerHit:false
  // forever and readiness rode the 2s waitFallback (BRRG) every spawn. `islands` is now the
  // primary compiled-bundle dir alongside src/assets/@ (the crossorigin attr sits BETWEEN
  // type="module" and src — the [^>]+ span tolerates it).
  if (/<script[^>]+type=["']module["'][^>]+src=["']\/(?:src|assets|@|islands)/i.test(body)) return true;
  if (/<script[^>]+src=["']\/(?:assets|islands)\//i.test(body)) return true;
  if (/data-server-rendered=["']true["']/i.test(body)) return true;
  return false;
}
function probeReadiness(
  port: number,
  scpName: string,
  totalBudgetMs = 60_000,
  intervalMs = 500,
): Promise<{ ready: true; elapsedMs: number } | { ready: false; elapsedMs: number; reason: string }> {
  const startedAt = Date.now();
  let firstTcpBindAt: number | null = null;
  return new Promise((resolve) => {
    let settled = false;
    const settle = (
      value:
        | { ready: true; elapsedMs: number }
        | { ready: false; elapsedMs: number; reason: string },
    ): void => {
      if (settled) return;
      settled = true;
      resolve(value);
    };

    const attempt = (): void => {
      const elapsedMs = Date.now() - startedAt;
      if (elapsedMs >= totalBudgetMs) {
        settle({ ready: false, elapsedMs, reason: 'timeout' });
        return;
      }
      const req = httpGet(
        { hostname: '127.0.0.1', port, path: '/', timeout: 2_000 },
        (res) => {
          // SRMK · accumulate response body; inspect for SSR-ready marker.
          if (firstTcpBindAt === null) {
            firstTcpBindAt = Date.now();
            log('scpspawnmgr.readiness.tcp-bind', {
              scpName,
              port,
              elapsedMs: firstTcpBindAt - startedAt,
            });
          }
          const chunks: Buffer[] = [];
          res.on('data', (chunk: Buffer | string) => {
            chunks.push(typeof chunk === 'string' ? Buffer.from(chunk, 'utf-8') : chunk);
          });
          res.on('end', () => {
            const body = Buffer.concat(chunks).toString('utf-8');
            const bodyLen = body.length;
            const markerHit = looksSsrReady(body);
            const sinceBind = firstTcpBindAt !== null ? Date.now() - firstTcpBindAt : 0;
            // BRRG fallback · if SRMK marker not found but we've already
            // waited SSR_READY_WAIT_DELAY_MS past first TCP-bind, accept
            // the response as ready — don't block forever on a marker we
            // may have failed to identify.
            const waitFallbackElapsed = sinceBind >= SSR_READY_WAIT_DELAY_MS;
            if (markerHit || waitFallbackElapsed) {
              log('scpspawnmgr.readiness.ssr', {
                scpName,
                port,
                bodyLen,
                markerHit,
                waitFallback: waitFallbackElapsed && !markerHit,
                sinceTcpBindMs: sinceBind,
              });
              settle({ ready: true, elapsedMs: Date.now() - startedAt });
              return;
            }
            // Body present but not yet SSR-ready · retry after intervalMs.
            log('scpspawnmgr.readiness.ssr.pending', {
              scpName,
              port,
              bodyLen,
              sinceTcpBindMs: sinceBind,
            });
            setTimeout(attempt, intervalMs);
          });
          res.on('error', () => {
            setTimeout(attempt, intervalMs);
          });
        },
      );
      req.on('error', () => {
        // ECONNREFUSED / network-level: server not yet listening · schedule retry
        setTimeout(attempt, intervalMs);
      });
      req.on('timeout', () => {
        req.destroy();
        setTimeout(attempt, intervalMs);
      });
    };

    log('scpspawnmgr.readiness.probe.start', { scpName, port, totalBudgetMs, intervalMs });
    attempt();
  });
}

export type { ScpSpawnManagerSpawnRequested };

export const scpSpawnManagerSpawnRequested = createQualityCardWithPayload<
  ScpSpawnManagerState,
  ScpSpawnManagerSpawnRequestedPayload
>({
  type: 'Scp Spawn Manager Spawn Requested',
  reducer: () => ({}),
  methodCreator: () =>
    createAsyncMethodWithConcepts(async ({ controller, action, deck }) => {
      const payload = selectPayload<ScpSpawnManagerSpawnRequestedPayload>(action);
      const { scpName, scpPath, command, args, port: requestedPort, sessionId, bootRequestUlid } = payload;

      // ─── LOCK 5 · scpName validation (TOP of Method body) ───
      const validation = validateScpName(scpName);
      if (!validation.ok) {
        console.error('[Scp Spawn Manager] invalid scpName:', scpName, 'reason:', validation.reason);
        controller.fire(action.strategy ? strategySuccess(action.strategy) : muxiumConclude());
        return;
      }

      // ─── LOCK 2 · idempotency guard (prevent double-spawn) ───
      // C905 · THE CLEAR RESTART PATH: a DEAD child heals unconditionally (exit landed but the
      // slot lingered); forceRestart (the TUI's not-live boot) SIGTERMs a survivor and proceeds —
      // a crash-to-desktop must never wedge the SCP behind its own orphaned server.
      {
        const existing = getChildProcess(scpName);
        if (existing !== undefined) {
          const childDead = existing.exitCode !== null || existing.killed;
          const force = (selectPayload<ScpSpawnManagerSpawnRequestedPayload>(action)).forceRestart === true;
          if (!childDead && !force) {
            console.warn('[Scp Spawn Manager] scpName already has live ChildProcess, skipping:', scpName);
            controller.fire(action.strategy ? strategySuccess(action.strategy) : muxiumConclude());
        return;
          }
          if (!childDead && force) {
            console.warn('[Scp Spawn Manager] C905 forceRestart · SIGTERM the surviving child:', scpName);
            try { existing.kill('SIGTERM'); } catch { /* already gone */ }
          } else {
            console.warn('[Scp Spawn Manager] C905 · dead child slot healed:', scpName);
          }
          deleteChildProcess(scpName);
        }
      }

      // ─── BOLS · Boot Overlay Show on spawn entry ───
      // Surfaces the per-SCP boot overlay immediately so stdout/stderr lines
      // populate the visible ring buffer. Reconciled HIGH-1: single-slot
      // arbitration via activeOverlayScpName (R4 Synthesis).
      dispatchFromHandler((h) =>
        (h.muxium.deck as unknown as {
          d: {
            scp: {
              d: {
                scpBootOverlay: {
                  e: { scpBootOverlayShow: (p: { scpName: string }) => unknown };
                };
              };
            };
          };
        }).d.scp.d.scpBootOverlay.e.scpBootOverlayShow({ scpName }),
      );

      // C1075 · REGISTRY PROPOSES, OS DISPOSES (Salvo M · D2). `requestedPort` is the registry's PREFERRED pair —
      // SOV-3's identity anchor, never mutated here. The pair is probed before the child binds and WALKED to the
      // next free pair when another process holds it (another workspace's SCP, a stray server). Every dispatch
      // path converges on this method, so this is the ONE seat. The walk is loud; the preferred stays the
      // registry's truth; the ACTUAL rides the spawn record, the env PORT, and the boot report.
      if (pendingSpawns.has(scpName)) {
        console.warn('[Scp Spawn Manager] spawn already pending during port resolution, skipping:', scpName);
        controller.fire(action.strategy ? strategySuccess(action.strategy) : muxiumConclude());
        return;
      }
      pendingSpawns.add(scpName);
      let port = requestedPort;
      try {
        const resolved = await resolveActualScpPortPair(requestedPort, reservedPairsExcluding(scpName));
        port = resolved.port;
        if (resolved.walked) log('scp.port.walked', { scpName, from: resolved.from, to: resolved.port });
      } catch (err) {
        pendingSpawns.delete(scpName);
        const message = err instanceof Error ? err.message : String(err);
        log('scp.port.walk-FAILED', { scpName, requestedPort, message });
        console.error('[Scp Spawn Manager] no free SCP port pair for', scpName, '—', message);
        controller.fire(action.strategy ? strategySuccess(action.strategy) : muxiumConclude());
        return;
      }

      const startedAt = Date.now();

      // ─── spawn() synchronously · canonical descriptor (scpSpawn.model.ts) ───
      // buildBridgeSpawnDescriptor encodes SABO invariants:
      //   detached: true · stdio: ['ignore','pipe','pipe'] · shouldUnref: true
      //   env: { PORT, SCP_BRIDGE_PORT, SCP_NAME, ...parentEnv }
      // The `command`/`args` payload fields remain in the type contract for
      // backwards compatibility but the descriptor is authoritative for the
      // direct-spawn path (R4 audit §3 + §6 PDPC).
      // CSEP env propagation · SAWSR-D2.B Cycle 153 R2 · pass through optional
      // callerSessionUlid + mcpEndpoint from payload to descriptor so spawn()
      // child env contains SCS_BRIDGE_CALLER_SESSION + SCS_BRIDGE_MCP_ENDPOINT.
      // Without this passthrough, BMTI Activate Quality's CSEP prep is discarded
      // and SCP-side scsRegisterSession.ts cannot find the env vars to dispatch.
      // TOH-8 · BAND B · THE ORIGIN PRESENTATION. THIS CLI names ITSELF to the child it spawns, so
      // the SCP publishes a true origin on its own /scp-config and its client dials the CLI that
      // OWNS it — never the shared bridge.json endpoint an older peer rewrites (the C952 root).
      // Unconditional: every spawn path (Activate · LaunchScp · the TUI's [L] · engage-via-bridge)
      // carries it, closing the gap where a TUI-launched SCP received no bridge identity at all.
      let ownBridgeEndpoint: string | undefined;
      try {
        const ownHandle = getActiveScsBridgeMuxiumHandle();
        const ownPort = ownHandle?.muxium?.deck?.d?.server?.k?.port?.select();
        if (typeof ownPort === 'number' && ownPort > 0) {
          ownBridgeEndpoint = `http://127.0.0.1:${ownPort}`;
        }
      } catch {
        /* best-effort — an unpublished origin degrades to the legacy bridge.json path, never a throw */
      }
      const descriptor = buildBridgeSpawnDescriptor({
        scpName,
        installPath: scpPath,
        port,
        parentEnv: process.env as Record<string, string>,
        callerSessionUlid: payload.callerSessionUlid,
        mcpEndpoint: payload.mcpEndpoint,
        bridgeEndpoint: ownBridgeEndpoint,
      });
      log('scpspawnmgr.origin.presented', { scpName, bridgeEndpoint: ownBridgeEndpoint ?? null });
      if (payload.callerSessionUlid !== undefined || payload.mcpEndpoint !== undefined) {
        log('scpspawnmgr.csep.env-applied', {
          scpName,
          callerSessionUlid: payload.callerSessionUlid ?? null,
          mcpEndpoint: payload.mcpEndpoint ?? null,
        });
      }
      // Acknowledge the legacy payload command/args (preserved for messaging
      // Diameter; descriptor takes precedence under direct-spawn).
      void command;
      void args;
      const child = spawn(descriptor.command, descriptor.args, {
        cwd: descriptor.cwd,
        detached: descriptor.detached,
        stdio: descriptor.stdio,
        env: descriptor.env,
      });
      pendingSpawns.delete(scpName);
      // SABO · shouldUnref: prevent the bridge event-loop from being held open
      // by the child. Process-group teardown (B.6) uses process.kill(-pid).
      if (descriptor.shouldUnref) {
        try {
          child.unref();
        } catch {
          // unref may throw if child failed to spawn (pid undefined); benign
        }
      }
      // STDIO-DLF · drain stdout/stderr to prevent kernel pipe buffer fill.
      // BOLS · Boot-Output-Line-Streaming (R2 Pattern 1) — each line from
      // stdout/stderr is appended to the per-SCP capped log file (CRLB) and
      // dispatched as scpBootOverlayAppendLine for the TUI ring buffer.
      // ANSI handling: appendScpBootLogLine strips ANSI on the file-write
      // branch (HIGH-5); ring buffer preserves raw for overlay coloring.
      const handleBootChunk = (chunk: Buffer | string): void => {
        const raw = typeof chunk === 'string' ? chunk : chunk.toString('utf-8');
        const parts = raw.split('\n');
        for (const part of parts) {
          const trimmed = part.replace(/\r$/, '');
          if (trimmed.length === 0) continue;
          appendScpBootLogLine(scpName, trimmed);
          // TOH-10 · the stage stamp rides the SAME line, one match ahead of the crash matcher.
          // Returns null for the overwhelming majority (runtime chatter) at the cost of a few
          // string tests, and NEVER throws — a lost timing line must not cost a boot line.
          observeScpBootTimingLine(scpName, trimmed);
          // TOH-7 · CLASS B · match on ARRIVAL — the instant `[nodemon] app crashed` lands, the
          // silence ends and the fact file carries it to the status endpoint anor the overlay.
          // BAND 4 · a NEW crash fact (true only on the transition, never on repeats) LICENSES the
          // restart: the bounded `.bridge-restart.json` write — the one key a waiting nodemon
          // answers to. The fact stands either way; the overlay tells the truth regardless.
          if (observeScpOutputLine(scpName, trimmed)) {
            requestFactLicensedRestart(scpName, scpPath, 'nodemon app crashed');
          }
          dispatchFromHandler((h) =>
            (h.muxium.deck as unknown as {
              d: {
                scp: {
                  d: {
                    scpBootOverlay: {
                      e: {
                        scpBootOverlayAppendLine: (p: {
                          scpName: string;
                          line: string;
                        }) => unknown;
                      };
                    };
                  };
                };
              };
            }).d.scp.d.scpBootOverlay.e.scpBootOverlayAppendLine({
              scpName,
              line: trimmed,
            }),
          );
        }
      };
      if (child.stdout) {
        child.stdout.on('data', handleBootChunk);
      }
      if (child.stderr) {
        child.stderr.on('data', (chunk: Buffer | string) => {
          const text = typeof chunk === 'string' ? chunk : chunk.toString('utf-8');
          log('scpspawnmgr.child.stderr', { scpName, text: text.slice(0, 500) });
          handleBootChunk(chunk);
        });
      }

      // ─── MMUI registration ───
      setChildProcess(scpName, child);
      // C1020 · the dir rides alongside the child — the daemon's teardown needs it to resolve this
      // lane's graceful-exit address, and at teardown the registry is the only thing that still
      // knows which SCPs this daemon spawned.
      setScpPath(scpName, scpPath);

      // TOH-7 · THE CLEAR-BACK (restart-begun): a spawn is fresh evidence that the prior crash is
      // no longer the present truth — a fact that only ever SETS becomes a lie.
      clearScpCrashState(scpName, 'restart-begun');

      // ─── FSTW M125 · Wave 1 · pending → booting on spawn entry ───
      // LSTM (M129) · Spawn-Event → FSM-Transition mapping:
      //   spawn-requested              → registered → booting (FSTW Wave 1 · here)
      //   probe-readiness-success      → booting → ready (FSTW Wave 2 · below)
      //   spawn-exited (existing)      → any → removed (already wired at child.on('exit'))
      //   spawn-error (existing)       → any → removed (already wired at child.on('error'))
      //   activeToDying (orphan)       → DEFERRED · no dispatch site · future health-check phase
      //   heartbeat (envelope-routed)  → DEFERRED · KDDDB latent · not primary trigger post-FSTW
      // Guard in scpLifecycleIdleToSpawning checks currentFsm === 'registered'
      // and no-ops otherwise — idempotent under any re-fire scenario.
      dispatchFromHandler((h) =>
        h.muxium.deck.d.scp.d.scpLifecycle.e.scpLifecycleIdleToSpawning({
          scpName,
          bootRequestUlid,
          receivedAt: startedAt,
        }),
      );

      // ─── HPRD · fire-and-forget readiness probe → browser tab dispatch ───
      // Does not block the Method's strategyDetermine(Q2). On probe success,
      // dispatches scpDockHostOpenBrowserTab via dispatchFromHandler (cross-
      // Concept · Card 18). Q2 (SpawnSucceeded) represents spawn success, not
      // server-ready · browser open is a UX convenience, not a correctness gate.
      void probeReadiness(port, scpName).then((result) => {
        if (result.ready) {
          log('scpspawnmgr.readiness.probe.success', {
            scpName,
            port,
            elapsedMs: result.elapsedMs,
          });
          // TOH-7 · THE CLEAR-BACK (healthy-boot): the server answered — the honest present truth.
          clearScpCrashState(scpName, 'healthy-boot');
          // ─── FSTW M125 · Wave 2 · booting → ready (live surface) on probe success ───
          // D147 ALC Wave 2 dependency · this FSTW transition UNLOCKS the LOADED branch.
          // Pre-D148: fsmState stuck at 'pending' · Wave 2 never fires · every Enter routes
          // through Wave 1 launch path · indistinguishable from broken activate.
          // Post-D148: FSM correctly advances · Wave 2 LOADED predicate accurate · Dual
          // Launch Control Aspirant achieved.
          // Synchronous within the probeReadiness Promise's .then callback (the immediate
          // success-branch closure) — fires inside the Method's existing async chain, not
          // a deferred async callback. Guard in scpLifecycleSpawningToActive requires
          // currentFsm === 'booting' (set by Wave 1) — idempotent on re-fire.
          dispatchFromHandler((h) =>
            h.muxium.deck.d.scp.d.scpLifecycle.e.scpLifecycleSpawningToActive({
              scpName,
              heartbeatUlid: bootRequestUlid,
              port,
              becameActiveAt: Date.now(),
            }),
          );
          const browserUrl = 'http://localhost:' + port + '/';
          dispatchFromHandler((h) =>
            // Cycle 139 CPPP · scsBridgeOpenBrowserTab replaces scpDockHostOpenBrowserTab.
            // Tier-1 sibling access path (no `d.scp.d.<sibling>` indirection).
            (h.muxium.deck as unknown as {
              d: {
                scsBridge: {
                  e: {
                    scsBridgeOpenBrowserTab: (p: {
                      scpName: string;
                      logEndpoint: string;
                    }) => unknown;
                  };
                };
              };
            }).d.scsBridge.e.scsBridgeOpenBrowserTab({
              scpName,
              logEndpoint: browserUrl,
            }),
          );
        } else {
          log('scpspawnmgr.readiness.timeout', {
            scpName,
            port,
            elapsedMs: result.elapsedMs,
            reason: result.reason,
          });
        }
      });

      // ─── LOCK 3 · 'exit' handler (closure over scpName · scpPath) ───
      child.on('exit', (code, signal) => {
        deleteChildProcess(scpName);
        const exitedAt = Date.now();
        // MULTI-SCP GITM MUXIFICATION (MC-W2) — a dead SCP's rail retires: disarm ITS per-SCP watcher
        // pair + delete ITS slice (so GITEP stops fanning out its gitm.json). scpPath = the SCP PACKAGE
        // dir (the registry/slice key · the SAME value gitmSetActiveScpDir bound). Cross-concept via the
        // gitm deck path (the launch-quality precedent · same dispatchFromHandler live-handle seam).
        dispatchFromHandler((h) =>
          h.muxium.deck.d.gitm.e.gitmWatcherDisarmForScp({ scpDir: scpPath }),
        );
        // Server-Close Cure · read-and-clear the voluntary-close mark ONCE. A
        // marked exit is a deliberate user window-close (KillRequested); an
        // unmarked exit is a crash / teardown death (today's behavior EXACTLY).
        const wasVoluntaryClose = consumeVoluntaryClose(scpName);
        // TOH-7 · CLASS A · the OS fact. A NON-voluntary lane exit is a crash without any text;
        // a voluntary close is the user's own gesture and clears the fact.
        observeScpLaneExit(scpName, code, signal ?? null, wasVoluntaryClose);
        // Q3 self-Concept dispatch via Tier-2 deck path
        dispatchFromHandler((h) =>
          h.muxium.deck.d.scp.d.scpSpawnManager.e.scpSpawnManagerSpawnExited({
            scpName,
            exitCode: code,
            exitSignal: signal,
            exitedAt,
          }),
        );
        // scpLifecycle DyingToGone via Tier-2 deck path (cross-Concept · Card 18)
        dispatchFromHandler((h) =>
          h.muxium.deck.d.scp.d.scpLifecycle.e.scpLifecycleDyingToGone({
            scpName,
            exitCode: code,
            exitSignal: signal ?? null,
            exitedAt,
          }),
        );

        if (wasVoluntaryClose) {
          // THE RE-SEAT · a deliberate close is NOT a failure. DyingToGone above
          // just removed all three lifecycle Maps (the row would VANISH). Ride
          // scpLifecycleRegister — the SAME quality the boot registry-scan uses —
          // to re-seat this installed SCP at lifecycleByScp 'pending' /
          // fsmByScp 'registered' (the resting, installed-not-running row). Its
          // guard (fsmByScp.has → no-op) is now clear because DyingToGone deleted
          // the fsm entry. NO force-hold failure overlay on the voluntary path.
          dispatchFromHandler((h) =>
            h.muxium.deck.d.scp.d.scpLifecycle.e.scpLifecycleRegister({
              scpName,
              scpPath,
              discoveredAt: exitedAt,
            }),
          );
          console.log('[Scp Spawn Manager] voluntary close re-seated at pending:', scpName);
          return;
        }

        // HIGH-4 · Force-hold overlay on exit (failure persistence).
        // Reconciled with HIGH-2 via failureLatched flag — RestPeriodElapsed
        // becomes no-op on this entry until user-Esc explicitly dismisses.
        // CRASH PATH ONLY — the voluntary path returned above (minimal diff).
        dispatchFromHandler((h) =>
          (h.muxium.deck as unknown as {
            d: {
              scp: {
                d: {
                  scpBootOverlay: {
                    e: {
                      scpBootOverlayShow: (p: {
                        scpName: string;
                        forceHold?: boolean;
                      }) => unknown;
                    };
                  };
                };
              };
            };
          }).d.scp.d.scpBootOverlay.e.scpBootOverlayShow({
            scpName,
            forceHold: true,
          }),
        );
      });

      // ─── LOCK 3 · 'error' handler (closure over scpName) ───
      child.on('error', (err) => {
        deleteChildProcess(scpName);
        const erroredAt = Date.now();
        const errorCode = (err as NodeJS.ErrnoException).code;
        // MULTI-SCP GITM MUXIFICATION (MC-W2) — same rail-retire as the exit path: disarm the per-SCP
        // watcher pair + delete the slice (scpPath = the registry/slice key · in the Method closure).
        dispatchFromHandler((h) =>
          h.muxium.deck.d.gitm.e.gitmWatcherDisarmForScp({ scpDir: scpPath }),
        );
        // Q4 self-Concept dispatch via Tier-2 deck path
        dispatchFromHandler((h) =>
          h.muxium.deck.d.scp.d.scpSpawnManager.e.scpSpawnManagerSpawnErrored({
            scpName,
            errorMessage: err.message,
            errorCode,
            erroredAt,
          }),
        );
        // scpLifecycle DyingToGone (Card 18)
        dispatchFromHandler((h) =>
          h.muxium.deck.d.scp.d.scpLifecycle.e.scpLifecycleDyingToGone({
            scpName,
            exitCode: null,
            exitSignal: null,
            exitedAt: erroredAt,
          }),
        );
        // HIGH-4 · Force-hold overlay on error (failure persistence).
        dispatchFromHandler((h) =>
          (h.muxium.deck as unknown as {
            d: {
              scp: {
                d: {
                  scpBootOverlay: {
                    e: {
                      scpBootOverlayShow: (p: {
                        scpName: string;
                        forceHold?: boolean;
                      }) => unknown;
                    };
                  };
                };
              };
            };
          }).d.scp.d.scpBootOverlay.e.scpBootOverlayShow({
            scpName,
            forceHold: true,
          }),
        );
      });

      // ─── form-α · strategyDetermine Q2 (SpawnSucceeded) ───
      const succeededPayload: ScpSpawnManagerSpawnSucceededPayload = {
        scpName,
        scpPath,
        port,
        pid: child.pid ?? -1,
        sessionId,
        bootRequestUlid,
        startedAt,
        browserUrl: 'http://localhost:' + port + '/',
      };

      // C986 · step 2 · STAMP THE LANE. The ONE moment all four facts the surgical teardown needs
      // are in scope together: the sovereign PORT (registry-read before spawn), the child's PID,
      // its START TIME, and the SCP dir. The nodemon events.restart script reads this beside
      // .bridge-restart.json and can then do what nodemon itself cannot — graceful-exit by port,
      // wait, then signal by VERIFIED pid — which is what lets `pkill -9 -f` be DELETED, not
      // narrowed.
      //
      // Written HERE, not in the SpawnSucceeded reducer: that quality carries the same four fields
      // in one payload and looks like the obvious seat, but it is a `reducer:` only, and a file
      // write in a pure state transition is wrong. THIS method is the side-effect-legal seat — it
      // already writes the boot log and the C961 timing instrument.
      //
      // C995 · CARD 13 · THE CONFIG RIDES THE SAME STAMP. `nodemon.json` is consumed by nodemon
      // ONCE, at launch, so nothing that can change may live there — a corrected hook on disk
      // cannot reach a running lane (measured C994). Everything variable is written HERE instead,
      // fresh on every spawn, and `lane-teardown.sh` SOURCES it. One writer per file: the mirror
      // owns nodemon.json and the script; this method owns the lane.
      writeScpLaneFile(scpPath, {
        scpName,
        port,
        pid: succeededPayload.pid,
        startedAt,
        config: DEFAULT_LANE_CONFIG,
      });

      console.log(
        '[Scp Spawn Manager] SpawnRequested → spawn():',
        scpName,
        'pid=', succeededPayload.pid,
        'port=', port,
      );
      log('scpspawnmgr.spawn.requested', {
        scpName,
        pid: succeededPayload.pid,
        port,
        bootRequestUlid,
      });

      // GITM SCP-SOVEREIGN — the UNIVERSAL BIND SEAM. This is the spawn point ALL launch paths
      // funnel through: the fresh-install BOOT auto-spawn AND the manual scsBridgeLaunchScp/
      // Activate qualities. The per-launch-quality binds (a227f07) MISS the boot path — debug.json
      // shows `scpspawnmgr.spawn.requested` fires with NO `scsbridge.launch.*`. So set activeScpDir
      // here (scpPath · absolute-resolved inside gitmSetActiveScpDir) THEN arm + initial recount.
      // log() to the captured debug.json sink (bridge console.log is NOT captured) so it's sweepable.
      try {
        const gitmHandle = getActiveScsBridgeMuxiumHandle();
        if (gitmHandle !== null) {
          gitmHandle.muxium.dispatch(
            gitmHandle.muxium.deck.d.gitm.e.gitmSetActiveScpDir({ activeScpDir: scpPath }) as never,
          );
          gitmHandle.muxium.dispatch(gitmHandle.muxium.deck.d.gitm.e.gitmScpWatcherArm({}) as never);
          // MULTI-SCP GITM MUXIFICATION (MC-W2) — the UNIVERSAL arm point (this seam catches EVERY
          // launch path · boot auto-spawn AND manual). Arm THIS SCP's OWN per-SCP watcher pair in the
          // registry so it keeps a live .git + tree watcher even when it is NOT the active SCP (the
          // plurality). Idempotent (a re-arm on the same scpDir closes+re-arms · no leak).
          gitmHandle.muxium.dispatch(
            gitmHandle.muxium.deck.d.gitm.e.gitmWatcherArmForScp({ scpDir: scpPath }) as never,
          );
          gitmHandle.muxium.dispatch(
            gitmHandle.muxium.deck.d.gitm.e.gitmRecountLocation({
              location: 'scp',
              clearError: false,
            }) as never,
          );
          // Refresh the top-level status (currentBranch / branches / staged / unstaged panels)
          // from the SCP now that activeScpDir is set — else they show the boot-time install root.
          gitmHandle.muxium.dispatch(
            gitmHandle.muxium.deck.d.gitm.e.gitmSetStatus({} as GitmSetStatusPayload) as never,
          );
          // Re-arm the .git WATCHDIAL onto the SCP's own RED .git (it boots on the install root) —
          // so external branch/commit changes on the SCP refresh the branch UI too.
          gitmHandle.muxium.dispatch(
            gitmHandle.muxium.deck.d.gitm.e.gitmWatcherArm({ watcherKind: 'gitDir' }) as never,
          );
          log('gitm.bind.activeScpDir', { scpName, scpPath });
        } else {
          log('gitm.bind.skipped', { scpName, reason: 'muxium-handle-null' });
        }
      } catch (err) {
        console.error(
          '[Scp Spawn Manager] gitm activeScpDir bind error:',
          scpName,
          err instanceof Error ? err.message : String(err),
        );
        log('gitm.bind.error', { scpName, error: err instanceof Error ? err.message : String(err) });
      }

      // PSSM · W3 · THE LAUNCH STATUS WRITE. This Method is the UNIVERSAL BIND SEAM (the
      // spawn point ALL launch paths funnel through — boot auto-spawn AND manual launch),
      // so mark this SCP's persisted status → 'live' here. Fire-and-forget: the async
      // SCPs.json write rides the chainWrite mutex; it must not block the spawn's
      // strategyDetermine(Q2). The server's own W2 pre-exit write flips it back to 'pending'.
      void setScpStatus(scpName, 'live').catch((err) => {
        log('scpspawnmgr.status.live-write-error', {
          scpName,
          error: err instanceof Error ? err.message : String(err),
        });
      });

      const succeededAction =
        (deck as unknown as {
          scpSpawnManager: {
            e: {
              scpSpawnManagerSpawnSucceeded: (p: ScpSpawnManagerSpawnSucceededPayload) => unknown;
            };
          };
        }).scpSpawnManager.e.scpSpawnManagerSpawnSucceeded(succeededPayload);

      controller.fire(strategyDetermine(succeededAction as never));
      return;
    }),
});
