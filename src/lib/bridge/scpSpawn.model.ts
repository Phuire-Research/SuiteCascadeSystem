/**
 * SCP Spawn Helpers — Bridge Side (SB-A1-D2 · CSCPIBIP partial port)
 *
 * Inline-ported from Cascades/scps/template/SCP/src/model/scpSpawn.model.ts
 * per CSCPIBIP (Cross-SCP-Pure-Function-Inline-Boundary-Inline-Port) pattern.
 *
 * What is ported verbatim (pure constants + range check):
 *   - SCP_PORT_RANGE_START (7700)
 *   - SCP_PORT_RANGE_END (7799)
 *   - isPortInScpRange(port)
 *
 * What is adapted (template-specific deps removed):
 *   - buildSpawnDescriptor → buildBridgeSpawnDescriptor (NameDerivation removed;
 *     bridge passes scpName: string directly · no SCP_CONCEPT_NAME env var)
 *   - SerializableSpawnDescriptor → BridgeSpawnDescriptor (Cadmium fields removed)
 *
 * What is newly authored (not in template):
 *   - findFreePortInScpRange — async net.createServer bind-and-release scan
 *     in 7700-7799 range. No get-port dep needed.
 *
 * SABO invariants preserved verbatim:
 *   detached: true · stdio: ['ignore','pipe','pipe'] · shouldUnref: true
 *
 * Citation: Cascades/scps/template/SCP/src/model/scpSpawn.model.ts (CSCPIBIP source)
 * Citation: SUITE-2-ORANGE-SB-A1-D2-PROSPECTING.md A2 (CSCPIBIP partial port decision)
 * Citation: SUITE-3-YELLOW-SB-A1-D2-ARCHITECTURE.md C (adapted port specification)
 * Citation: SUITE-6-PURPLE-SB-A1-D2-SEQUENCE.md Step 2 (R6 fallback spec)
 */
import net from 'node:net';
import path from 'node:path';

// ============================================
// PORT RANGE CONSTANTS (CSCPIBIP verbatim port)
// ============================================

export const SCP_PORT_RANGE_START = 7700;
export const SCP_PORT_RANGE_END = 7799;

// ============================================
// PORT RANGE PREDICATE (CSCPIBIP verbatim port)
// ============================================

/**
 * Returns true if `port` is within the recommended SCP bridge port range
 * [SCP_PORT_RANGE_START, SCP_PORT_RANGE_END]. Inclusive on both ends.
 */
export function isPortInScpRange(port: number): boolean {
  return port >= SCP_PORT_RANGE_START && port <= SCP_PORT_RANGE_END;
}

// ============================================
// FREE PORT SCAN (newly authored · async)
// ============================================

/**
 * Probes a single port via net.createServer bind-and-release. Returns true if
 * the port is free (server bound successfully then immediately closed) or
 * false on any error (EADDRINUSE most commonly).
 */
export function isPortFree(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const server = net.createServer();
    let settled = false;
    const settle = (value: boolean): void => {
      if (settled) return;
      settled = true;
      resolve(value);
    };
    server.once('error', () => settle(false));
    server.once('listening', () => {
      server.close(() => settle(true));
    });
    try {
      // C424 · BPAL (Bind-Parity Address Law · the C423 cure applied to the SCP family):
      // probe EXACTLY what the server will bind. Post C667-S0b the SCP template server binds
      // 127.0.0.1 (server.principle HOST · the loopback flip — the SCP surface must not reach
      // the LAN), so the probe binds 127.0.0.1 too. Two SCPs on one machine both binding
      // 127.0.0.1:port still collide (EADDRINUSE), so the free-port scan finds distinct ports.
      server.listen(port, '127.0.0.1');
    } catch {
      settle(false);
    }
  });
}

/**
 * C1075 · SALVO M · REGISTRY PROPOSES, OS DISPOSES. `preferred` is the registry's PREFERRED pair (SOV-3's identity
 * anchor — this function never writes the registry). The pair is PROBED (both p and p+1 — the PORT-PAIR LAW) before
 * the SCP binds; when another process holds it (another workspace's SCP, a stray server), the walk moves to the next
 * free pair not reserved by `excludePorts` (the registry's other pairs). Exhaustion THROWS — a named failure, never
 * a silent reuse. The caller logs `scp.port.walked{from,to}` when `walked` is true.
 */
export async function resolveActualScpPortPair(
  preferred: number,
  excludePorts: Set<number> = new Set(),
  start: number = SCP_PORT_RANGE_START,
  end: number = SCP_PORT_RANGE_END,
): Promise<{ port: number; walked: boolean; from: number }> {
  if ((await isPortFree(preferred)) && (await isPortFree(preferred + 1))) {
    return { port: preferred, walked: false, from: preferred };
  }
  for (let p = start; p <= end - 1; p += 2) {
    if (excludePorts.has(p) || excludePorts.has(p + 1)) continue;
    // eslint-disable-next-line no-await-in-loop
    if ((await isPortFree(p)) && (await isPortFree(p + 1))) return { port: p, walked: true, from: preferred };
  }
  throw new Error(`scp-port-pair-walk-exhausted: preferred ${preferred} held and no free pair in [${start},${end}]`);
}


/**
 * Scans the SCP port range [start, end] inclusive for the first free port.
 * Uses net.createServer().listen() + immediate close per candidate. Returns
 * the resolved port number. Throws Error if range is exhausted.
 *
 * Defaults to [SCP_PORT_RANGE_START, SCP_PORT_RANGE_END] when called without
 * arguments. Optional `excludePorts` Set skips already-allocated ports during
 * concurrent boot sequences (Port-Allocation-Race mitigation).
 */
export async function findFreePortInScpRange(
  start: number = SCP_PORT_RANGE_START,
  end: number = SCP_PORT_RANGE_END,
  excludePorts?: Set<number>,
): Promise<number> {
  for (let port = start; port <= end; port++) {
    if (excludePorts !== undefined && excludePorts.has(port)) continue;
    // eslint-disable-next-line no-await-in-loop
    if (await isPortFree(port)) return port;
  }
  throw new Error(`no-free-port-in-range:${start}-${end}`);
}

// ============================================
// BRIDGE SPAWN DESCRIPTOR (adapted from template SerializableSpawnDescriptor)
// ============================================

export interface BridgeSpawnDescriptor {
  command: string;
  args: string[];
  cwd: string;
  detached: true;
  stdio: ['ignore', 'pipe', 'pipe'];
  env: Record<string, string>;
  shouldUnref: true;
  browserUrl: string;
  scpName: string;
}

export interface BuildBridgeSpawnDescriptorOptions {
  scpName: string;
  installPath: string;
  port: number;
  parentEnv?: Record<string, string>;
  // SCSER env propagation · SAWSR-D2.B Cycle 153 (CSEP · Caller-Session-Env-Propagation)
  // When BMTI Activate Quality invokes from MCP with callerSessionUlid, these
  // env vars propagate into the spawned SCP child process. SCP-side
  // scpStartupBinding principle reads them and dispatches SCSER Strategy
  // (scserCallerSessionBinding.strategy.ts) which HTTP-POSTs back to Bridge MCP
  // tool scs_bridge_bind_caller_session → scsBridgeBindCallerSessionToScp Quality.
  callerSessionUlid?: string;
  mcpEndpoint?: string;
  /** TOH-8 · the spawning CLI's OWN endpoint (`http://127.0.0.1:<its port>`) — the origin it presents. */
  bridgeEndpoint?: string;
}

/**
 * Builds a BridgeSpawnDescriptor for SABO launch of the SCP runtime. The
 * descriptor is materialized at the principle's spawn call site via
 * `child_process.spawn(desc.command, desc.args, { cwd, detached, stdio, env })`
 * followed immediately by `child.unref()` (SABO).
 *
 * The `cwd` resolution uses `path.resolve(opts.installPath)` so the descriptor
 * carries an absolute path even when callers pass a relative one. The `env`
 * block merges `parentEnv` (typically `process.env`) with SCP_NAME, SCP_BRIDGE_PORT,
 * and PORT — the SCP-side env contract expected by `npm run bridge`.
 *
 * SCP_NAME wins env-collision (set AFTER spread of parentEnv) so a parent
 * environment carrying a stale SCP_NAME cannot leak into the spawned child.
 */
export function buildBridgeSpawnDescriptor(
  opts: BuildBridgeSpawnDescriptorOptions,
): BridgeSpawnDescriptor {
  const env: Record<string, string> = {
    ...(opts.parentEnv ?? {}),
    SCP_NAME: opts.scpName,
    // Per-SCP-Identity-Config · FKIS Origin (folded-out prior fix · was db6ff9b).
    // The earlier SCS_BRIDGE_SCP_NAME: opts.scpName set the var on the WRONG process — the
    // spawned SCP SERVER, not the SHARED workspace bridge muxium (port 7111) where the
    // scsBridgeSendMessage guard actually runs (it boots before any SCP is chosen and serves
    // multiple boundScps, so no single per-SCP env is correct there). The origin is now carried
    // PER-SEND from the SCP's OWN scp.config.json (GET /scp-config → controller → payload.originScpName),
    // making this env injection redundant. Removed. SCP_NAME, ports, ROOT_OVERRIDE stay intact.
    SCP_BRIDGE_PORT: String(opts.port),
    PORT: String(opts.port),
    // SCS_BRIDGE_ROOT_OVERRIDE: RETIRED INJECTION (Template Citizenship BO-2-C).
    // Walk-up probe in bridgeRoot.model.ts resolveBridgeRoot() resolves the
    // workspace root from any spawned SCP's cwd without an injected env var.
    // The override is HONORED-WHEN-PRESENT: if a parent env carries it (older
    // bridge spawn, dev:self that sets it explicitly), it still flows into the
    // spawned SCP via the `...(opts.parentEnv ?? {})` spread above, and
    // resolveBridgeRoot() reads it first. New spawns do NOT inject it — walk-up
    // is sufficient.
    // Back-compat: installed SCPs spawned by pre-citizenship bridge carry the env;
    // new bridge boots them; walk-up resolves regardless. No flag-day.
    // THE SELF-OWNED SHUTDOWN MARKER · spawn-ONLY guard. The template webSocketServer
    // self-shutdown (unregisterClient grace timer) gates on this so a spawned SCP server
    // self-kills when its window closes, while a dev `npm run bridge` (nodemon, no marker)
    // NEVER self-kills. Set here (the ONLY spawn call site) and unconditionally '1' —
    // deliberately NOT sourced from parentEnv so a stale parent value cannot spoof it into
    // a dev process (a dev bridge inherits process.env, never THIS descriptor's env block).
    SCS_SPAWNED_SCP: '1',
  };
  // SCSER env propagation (CSEP) · only inject when caller provides values
  // SCP-side scpStartupBinding principle reads these to dispatch SCSER Strategy
  if (typeof opts.callerSessionUlid === 'string' && opts.callerSessionUlid.length > 0) {
    env.SCS_BRIDGE_CALLER_SESSION = opts.callerSessionUlid;
  }
  if (typeof opts.mcpEndpoint === 'string' && opts.mcpEndpoint.length > 0) {
    env.SCS_BRIDGE_MCP_ENDPOINT = opts.mcpEndpoint;
  }
  // TOH-8 · BAND B · THE ORIGIN PRESENTATION. The SPAWNING CLI names ITSELF to the child, so the
  // SCP can publish its true origin on its own /scp-config and its client can dial the CLI that
  // actually owns it. This is the ONLY origin channel an older peer cannot erase — it never rides
  // the shared bridge.json a pre-namedBridges build rewrites on every heartbeat (C952's root:
  // a Dev-owned SCP sent its Turn Over B to production, and nothing happened at all).
  // NOTE the naming Diameter: `SCP_BRIDGE_PORT`/`PORT` are the SCP's OWN listen port — a different
  // Demometer entirely. `SCS_BRIDGE_ENDPOINT` is the BRIDGE's address (SCS_ prefix · full URL).
  if (typeof opts.bridgeEndpoint === 'string' && opts.bridgeEndpoint.length > 0) {
    env.SCS_BRIDGE_ENDPOINT = opts.bridgeEndpoint;
  }
  return {
    command: 'npm',
    args: ['run', 'bridge'],
    cwd: path.resolve(opts.installPath),
    detached: true,
    stdio: ['ignore', 'pipe', 'pipe'],
    env,
    shouldUnref: true,
    browserUrl: `http://localhost:${opts.port}`,
    scpName: opts.scpName,
  };
}
