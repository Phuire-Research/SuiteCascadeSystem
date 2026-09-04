// scpConfig.model.ts — the SCP-resident declarative identity (Per-SCP-Identity-Config · FKIS Origin).
//
// The client twin of the bridge-side reader. Where hifiConfig.json carries the SCP's SHIPPED HiFi
// design, scp.config.json carries the SCP's OWN name. The install wizard stamps it
// ({ "scpName": <designation> }); the template ships { "scpName": "template" }. The SCP server serves
// it at GET /scp-config (vue.principle.ts · same-origin · path-traversal-safe). The scsBridgeController
// boot-reads it (loadScpConfig) and caches scpName, then carries it as originScpName on every
// send_message POST — closing the installed-SCP 'no-origin' bail (the shared workspace bridge muxium
// has no per-SCP env to read; the SCP's OWN name IS its origin).
//
// Mirrors loadHifiConfig: same-origin relative fetch · null on absent/unreadable/malformed.
import { confirmScpIdentity } from './scpIdentityStorage.model';

export interface ScpConfig {
  scpName: string;
  /** TOH-8 · BAND B · the endpoint of the CLI that SPAWNED this SCP (null when unpublished — an
   *  older bridge build, or a spawn that predates the origin env). The client's gitm actions dial
   *  THIS, never the shared bridge.json's endpoint, which an older peer rewrites with its own. */
  originEndpoint?: string | null;
  /** TOH-8 · that CLI's environment name (null = the production perspective). */
  originEnv?: string | null;
  /** TOH-8 · BAND A · this server process's own boot time — the restart witness the standby
   *  overlay compares against the moment the user clicked. */
  bootedAt?: number | null;
}

// Fetch THIS SCP's controlling scp.config.json via the server endpoint. Null on
// absent/unreadable/malformed/absent-field. Same-origin (the SCP's own express server · NOT the bridge).
//
// C375 · THE ENGAGE AWAIT HARDENING (SOURCE) · ABORT-CONTROLLER TIMEOUT. Prior code did a bare
// `await fetch('/scp-config')` with NO timeout — a hung SCP server (socket open, unanswered mid-restart:
// the SAME PRIME-STALL socket-open-but-silent mode triggerSendMessage already guards) would NEVER settle,
// the `catch` NEVER fires (no throw on a hung-open connection), and the whole resolveScpName promise stays
// pending forever → the Forge Engage's `await ctrl.getScpName()` hangs → the dispatch is never reached →
// silence. A 3s AbortController now guarantees the fetch settles: on abort the catch returns null and the
// caller proceeds with the bridge default. NEVER let this fetch outlive the Engage's own race window.
export async function loadScpConfig(): Promise<ScpConfig | null> {
  if (typeof window === 'undefined') return null;
  const abort = new AbortController();
  const SCP_CONFIG_TIMEOUT_MS = 3000;
  const timeoutId = setTimeout(() => abort.abort(), SCP_CONFIG_TIMEOUT_MS);
  try {
    const r = await fetch('/scp-config', { signal: abort.signal });
    if (!r.ok) return null;
    const j = (await r.json()) as {
      scpName?: unknown;
      originEndpoint?: unknown;
      originEnv?: unknown;
      bootedAt?: unknown;
    };
    // TOH-8 · the origin + boot witness ride the SAME same-origin read the FKIS origin already uses.
    // TOH-12 · the Sovereign-Identity confirm: every successful /scp-config resolution
    // synchronously persists the confirmed scpName (scpIdentityStorage.model), so the
    // identity survives a server death and the scoped-storage keying can run while
    // /scp-config is dark (the turn-over WS-close seam).
    if (j && typeof j === 'object' && typeof j.scpName === 'string' && j.scpName.length > 0) {
      confirmScpIdentity(j.scpName);
    }
    return j && typeof j === 'object' && typeof j.scpName === 'string' && j.scpName.length > 0
      ? {
          scpName: j.scpName,
          originEndpoint: typeof j.originEndpoint === 'string' && j.originEndpoint.length > 0 ? j.originEndpoint : null,
          originEnv: typeof j.originEnv === 'string' && j.originEnv.length > 0 ? j.originEnv : null,
          bootedAt: typeof j.bootedAt === 'number' ? j.bootedAt : null,
        }
      : null;
  } catch {
    return null; // includes AbortError (the 3s timeout · hung-open SCP server) → the safe default
  } finally {
    clearTimeout(timeoutId);
  }
}

// C1084 · THE NAMED ANCHOR, CLIENT SIDE. A page-fired bridge call (a spawn, a tool) must ride THIS
// SCP's PUBLISHED origin — `/scp-config`'s originEndpoint, the same resolver the server's relay proxy
// obeys (bridgeRoot.model · resolveOriginEndpoint) — never the shared top-level rendezvous in
// bridge.json: with two bridges in one directory (the unnamed anchor beside `--name Dev`) the
// top-level endpoint IS THE OTHER BRIDGE, which then spawns a session the origin bridge has never
// heard of (the C1083 field: spawn to 7111, relay to 7113, dead on arrival). The top-level endpoint
// is the LAST rung, taken only when no origin is published — and said aloud, never silently.
export async function resolveOriginMcpUrl(fallbackEndpoint: string, tag: string): Promise<string> {
  const cfg = await loadScpConfig();
  const origin = typeof cfg?.originEndpoint === 'string' ? cfg.originEndpoint.trim().replace(/\/+$/, '') : '';
  if (origin.length > 0) return `${origin}/mcp`;
  console.warn(
    `[SCS-Bridge ${tag}] origin.fallback-top-level · /scp-config published no originEndpoint — firing through the shared top-level endpoint`,
    fallbackEndpoint,
  );
  return `${fallbackEndpoint}/mcp`;
}
