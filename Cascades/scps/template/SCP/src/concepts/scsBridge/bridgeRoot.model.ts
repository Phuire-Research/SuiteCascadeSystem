// Install Epoch recurse (Blank-Test-003 · RBJP hardening) · the SHARED bridge-junction resolver.
//
// The old per-site pattern (`SCS_BRIDGE_ROOT_OVERRIDE ?? process.cwd()`) assumed the SCP server's
// cwd was the project root — but a spawned SCP runs with cwd = the SCP PACKAGE dir
// (<project>/Cascades/scps/<name>/SCP), so the fallback probed INSIDE the SCP and the bridge
// connection never resolved for installed SCPs. Self-verifying chain (mirrors the bridge's
// resolveScsRoot philosophy) — resolves cleanly in BOTH locations:
//   1. SCS_BRIDGE_ROOT_OVERRIDE (dev:self sets it; the bridge spawn now injects it · RBJP)
//   2. WALK-UP probe: ascend from cwd until a dir contains Cascades/Bridge/bridge.json —
//      an installed SCP ascends SCP → <name> → scps → Cascades → <project> (HIT);
//      the template-in-repo ascends to the repo root (HIT).
//   3. cwd (the legacy fallback · a standalone boot at the project root).

import * as path from 'node:path';
import { existsSync } from 'node:fs';

const WALK_UP_LIMIT = 8;

/** the resolved `<junction>/Cascades/Bridge` directory (bridge.json + sessions.json live here). */
export function resolveBridgeRoot(): string {
  const override = process.env.SCS_BRIDGE_ROOT_OVERRIDE;
  if (override && override.length > 0) {
    return path.resolve(override, 'Cascades', 'Bridge');
  }
  // BO-2-I (C450) · THE OWN-PACKAGE SKIP: the per-SCP bridge.json (BO-2-G) lives INSIDE the
  // SCP package at cwd/Cascades/Bridge — WITHOUT this skip the walk-up is captured by the
  // SCP's OWN rail and every WORKSPACE rendezvous starves (gitm.json reads blank · the
  // boot-report never reaches the daemon's watch → the 45s failsafe fires phantom reverts —
  // the C449 regression). The walk-up now PREFERS an ANCESTOR hit (the workspace) and accepts
  // the cwd-level hit only when nothing above matches (a true standalone install). The SCP's
  // OWN rail is addressed EXPLICITLY via resolveScpLocalBridgeDir().
  const cwd = process.cwd();
  const cwdHit = existsSync(path.join(cwd, 'Cascades', 'Bridge', 'bridge.json'));
  let probe = path.dirname(cwd);
  for (let i = 0; i < WALK_UP_LIMIT; i += 1) {
    if (existsSync(path.join(probe, 'Cascades', 'Bridge', 'bridge.json'))) {
      return path.join(probe, 'Cascades', 'Bridge');
    }
    const parent = path.dirname(probe);
    if (parent === probe) break; // filesystem root
    probe = parent;
  }
  if (cwdHit) {
    return path.join(cwd, 'Cascades', 'Bridge');
  }
  return path.resolve(cwd, 'Cascades', 'Bridge');
}

/**
 * BO-2-I · the SCP's OWN per-SCP bridge rail (cwd/Cascades/Bridge) — the file the bridge's
 * per-SCP writer maintains (bridge.json + the turnOver field). NEVER walked-up: this is the
 * one resolver that must land INSIDE the package. The turn-over field watcher rides THIS.
 */
export function resolveScpLocalBridgeDir(): string {
  return path.resolve(process.cwd(), 'Cascades', 'Bridge');
}

/**
 * C465 · THE EXTENDED RELOCATION — the SCP's OWN Cascades/Extended/ (Cadmium Researcher ·
 * Pewter Tessera · every Suite 8 RI substrate). Extended moved from the WORKSPACE Cascades/
 * into the SCP package (the per-SCP Cascades/ is primary — Template Citizenship). Like the
 * bridge rail above, NEVER walked-up and NEVER env-diverted: the workspace override
 * (SCS_BRIDGE_ROOT_OVERRIDE) is the BRIDGE rendezvous root, not the Extended base.
 */
export function resolveScpLocalExtendedDir(): string {
  return path.resolve(process.cwd(), 'Cascades', 'Extended');
}

/**
 * D-PCL · THE ROUND-TRIP COLOR CIRCUIT — the SCP's OWN shipped-HiFi JSON (cwd/Cascades/hifiConfig.json).
 * The BYTE-IDENTICAL path the /hifi-config GET serves (vue.principle.ts:2431 · C465/C872: cwd IS the
 * package, NEVER the workspace ancestor — the Pewter write landed SCP-local and the workspace file
 * would answer otherwise). Centralized here so the round-trip WRITE (applyHifiConfig Huirth Real) and
 * the boot READ (/hifi-config GET) resolve the SAME file. NEVER walked-up, NEVER env-diverted.
 */
export function resolveScpCascadesHifiConfigPath(): string {
  return path.resolve(process.cwd(), 'Cascades', 'hifiConfig.json');
}

/**
 * C950 · THE ORIGIN NAME anor THE NAMED RENDEZVOUS (the two-perspective law).
 *
 * The bridge state is SHARED — one `Cascades/Bridge/bridge.json` for every CLI perspective.
 * What differs is the CLI's PORT: a CLI launched as `scs --name <Name>` registers its own
 * port under `namedBridges[<Name>]` inside that same file, leaving the top-level port (the
 * production rendezvous) untouched. An SCP spawned by that CLI INHERITS `SCS_ENV=<Name>` in
 * its environment — so it knows, at birth, the NAME of the origin that spawned it and reads
 * that origin's port. An SCP spawned by production has no name and reads the top level,
 * byte-identically to before.
 *
 * The junction resolution above is UNCHANGED — only which port/endpoint inside the shared
 * file this SCP answers to.
 */
export function originEnvironmentName(): string {
  const v = process.env.SCS_ENV;
  return typeof v === 'string' ? v.trim() : '';
}

type NamedBridgeEntry = { port?: number; endpoint?: string; writtenAt?: number };
type BridgeJsonShapeMinimal = {
  port?: number;
  endpoint?: string;
  namedBridges?: Record<string, NamedBridgeEntry>;
};

/** The endpoint of the CLI that spawned THIS SCP (named origin first · top level otherwise). */
/** The endpoint this SCP was HANDED at spawn (`SCS_BRIDGE_ENDPOINT` · the Named Anchor's second rung). */
function handedOriginEndpoint(): string | null {
  const v = process.env.SCS_BRIDGE_ENDPOINT;
  return typeof v === 'string' && v.length > 0 ? v : null;
}

/**
 * C1080 · THE ONE RESOLVER, ONE ORDER — "named → handed → conventional" (the user's rulings C1080 a/e).
 *
 * The C1079 field wound: this resolver fell from `namedBridges[name]` straight to the TOP LEVEL, and the top level of the
 * shared bridge.json is the OTHER bridge's when the named entry has been wiped (an older co-writer). A named SCP's spawn
 * went to production; its relay went origin-first to Dev; one session, two bridges, no placement. THE ORDER NOW:
 *   NAMED   → `namedBridges[name]` (the discovery rail) → the HANDED `SCS_BRIDGE_ENDPOINT` (the anchor the CLI passed at
 *             spawn — never another bridge's top level) → a loud warning → the top level → `fallback`.
 *   UNNAMED → the top level (the conventional rendezvous) → the handed endpoint → `fallback`.
 * Every path — the server's MCP proxy, `/gitm-action`, and `/scp-config`'s `originEndpoint` (so the client's actions
 * inherit the same order) — passes through THIS function. `resolveOriginPort` is a pure derivation of it.
 */
export function resolveOriginEndpoint(bridgeJson: unknown, fallback = 'http://127.0.0.1:7111'): string {
  const bj = (bridgeJson ?? {}) as BridgeJsonShapeMinimal;
  const name = originEnvironmentName();
  const handed = handedOriginEndpoint();
  const top =
    typeof bj.endpoint === 'string' && bj.endpoint.length > 0
      ? bj.endpoint
      : typeof bj.port === 'number' && bj.port > 0
        ? `http://127.0.0.1:${bj.port}`
        : null;
  if (name) {
    const named = bj.namedBridges?.[name];
    if (named && typeof named.endpoint === 'string' && named.endpoint.length > 0) return named.endpoint;
    if (named && typeof named.port === 'number' && named.port > 0) return `http://127.0.0.1:${named.port}`;
    if (handed) {
      console.warn(
        '[SCP bridgeRoot] origin.named-unregistered.fallback-handed · name=' + name +
        ' · the shared bridge.json carries no namedBridges entry — using the HANDED endpoint ' + handed,
      );
      return handed;
    }
    console.warn(
      '[SCP bridgeRoot] origin.named-unanchored · name=' + name +
      ' · no namedBridges entry AND no SCS_BRIDGE_ENDPOINT — falling to the top-level rendezvous (another bridge?)',
    );
    return top ?? fallback;
  }
  return top ?? handed ?? fallback;
}

/** The port of the CLI that spawned THIS SCP — derived from the ONE resolver above (one order, one place). */
export function resolveOriginPort(bridgeJson: unknown): number | undefined {
  const endpoint = resolveOriginEndpoint(bridgeJson, '');
  const m = /:(\d+)\/?$/.exec(endpoint);
  const port = m ? Number(m[1]) : NaN;
  return Number.isFinite(port) && port > 0 ? port : undefined;
}

/**
 * THE DOCK · THE SCP-SIDE MIRROR OF THE COMPOSED-PROMPT FILENAME LAW.
 *
 * NAMING NOTE (two referents, never conflated): **THE DOCK** = the WHOLE fully appended
 * system prompt file the bridge CLI composes at every resume (base + dock layer + Instance.md
 * joined) — the file this resolver names. **the dock layer** = the composer's MIDDLE layer
 * alone (`ComposedLayerName = 'base' | 'dock' | 'instance'`). This function resolves THE DOCK.
 *
 * BYTE-IDENTICAL COPY of `safeDesignationName` at
 *   <bridge repo>/src/lib/bridge/baseSystemPrompt/composeAppendedSystemPrompt.ts:97-100
 *     `return designation.replace(/[^a-zA-Z0-9_-]/g, '_');`
 * COPIED, not imported: the bridge CLI and this SCP are SEPARATE npm packages with no import
 * path between them — the package boundary forbids the import. Any change to either regex must
 * be mirrored by hand or the SCP reports a false `exists:false` for a real file on disk.
 *
 * DO NOT REUSE the SCP's OTHER sanitizer (`cfg.scpName.replace(/[^A-Za-z0-9]/g, '')`,
 * vue.principle.ts ~:1829) — that is a DIFFERENT law (it strips `_` and `-` as well) serving a
 * different purpose. Substituting it here silently mis-resolves every hyphenated designation.
 */
export function safeDesignationName(designation: string): string {
  return designation.replace(/[^a-zA-Z0-9_-]/g, '_');
}

/**
 * THE DOCK PATH LAW (SCP half) — mirrors the composer's `resolveComposedPromptPath`
 * (composeAppendedSystemPrompt.ts:103-108) folded over `bridgeLogDir()` (paths.ts:43-46):
 *   `segment ? join(bridgeRoot(), segment) : bridgeRoot()`
 *
 * THE NAMING AXIS: a bridge is UNNAMED — its seat IS `Cascades/Bridge/`, the root itself,
 * NEVER a directory literally named `unnamed` — or it carries a NAME, seated at
 * `Cascades/Bridge/<Name>/`. The segment is the RAW trimmed `SCS_ENV` value
 * (`originEnvironmentName()` above · byte-identical to the CLI's `environmentSegment()`):
 * it must NEVER be run through `safeDesignationName` or any sanitizer, or a hyphenated or
 * spaced `--name` would compute a directory the composer never wrote.
 *
 * Reading the segment-blind root from a NAMED bridge returns another bridge's file — the two
 * seats' composed bytes differ in their embedded `ENDPOINT:` port lines. The segment is the
 * whole correctness of this read, not a nicety. Never fall back across seats.
 */
export function resolveComposedDockPath(designation: string): string {
  const segment = originEnvironmentName();
  const seatDir = segment
    ? path.join(resolveBridgeRoot(), segment)
    : resolveBridgeRoot();
  return path.join(seatDir, `scs-bridge-suite8-${safeDesignationName(designation)}.generated.md`);
}
