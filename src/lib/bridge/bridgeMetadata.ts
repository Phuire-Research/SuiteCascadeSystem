/**
 * REF-D2 · BJLM (Bridge-JSON-Localhost-Metadata) · Cycle 113
 *
 * Pure helper module — writes/reads `~/.scs-bridge/bridge.json`. ZERO stratimux
 * imports. ZERO Tier-2 concept coupling. ZERO new state slot. Derived projection
 * at write time from existing Muxium state (read-only).
 *
 * R3 Yellow Hybrid Decision: file-discovery PRIMARY · HTTP DEFERRED (endpoint
 * field carries forward-compat address). Bridge has no HTTP server; this file
 * is sufficient for ClaudeCode discovery (SCP-Researcher Communication Skill
 * reads it via filesystem · no network call required).
 *
 * Precedent: `~/.scs-bridge/sessions.json` (SB-P1 established via
 * sessionPersistence.ts homedir() + join pattern).
 *
 * Atomic write: tmp file + rename (same directory). homeDirOverride param
 * mirrors memoryProbe.ts/sessionPersistence.test.ts isolation pattern.
 */

import { mkdir, writeFile, readFile, rename } from 'node:fs/promises';
import { readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import type { ShaderRenderMode } from '../../shared/shaderRenderMode';
import type { RenderModeCatalogEntry } from '../../shared/renderModeCatalog.model';
import { RENDER_MODE_CATALOG } from '../../shared/renderModeCatalog.model';
import { getNpmVersionCheck } from './npmVersionCheck';
import type { ModelCatalogEntry } from '../../shared/modelCatalog.model';
import { AVAILABLE_MODELS, DEFAULT_MODEL } from '../../shared/modelCatalog.model';

export type BoundScpEntry = {
  port: number;
  status: string;
  browserUrl: string;
  // MD-1 · D-SB-1 · THE DIR FIELD (the first stone). The absolute install root of
  // the SCP (resolved from SCPs.json `path` against userCwd at write time). This is
  // the Sovereignty Boundary anchor — SEAP roster resolution + spawn compose re-root
  // read the SCP-LOCAL Cascades/8_SUITES/ from HERE. Optional for backward-compat
  // with bridge.json files written pre-this-Diamond; absent ⇒ resolvers fall back to
  // the bridge root (unchanged behavior).
  dir?: string;
};

// PP-D2 · Ping Pong Liveness Diameter · pongReceipt field (Option β)
// WRITTEN by SCS-Bridge bridgePingPong.quality.huirth.ts on Pong handler fire
// READ by SCP huirth scsBridgeJsonWatcher.principle.huirth.ts on fs.watch event
// RELAYED to Client via setBridgeJsonRelay (actionExchange.serverToClient)
// Citation: PPLD-DIAMOND-2-WAVE2-OCHRE-A-SCS-BRIDGE-BLUEPRINT.md §3 + §4
export type BridgePongReceipt = {
  clientId: string;       // PPSO echo — which SCP Client initiated the Ping
  respondedAt: number;    // Bridge-side Date.now() at Pong write
  bridgeVersion: string;  // PPBV — Bridge self-reports version for parity check
};

export type BridgeMetadata = {
  schemaVersion: 1;
  bridgeVersion: string;
  writtenAt: number;
  port: number;
  endpoint: string;
  userCwd: string;
  boundScps: Record<string, BoundScpEntry>;
  installedScps: string[];
  // D3C · Route A · TUI-active SCP focus · written by TUI on focus change · read by SessionStart hook (CIBJ leg of CFCR chain)
  activeScp?: string | null;
  // Install-State Branching Diamond (BJVR Option B Echo):
  // Echoed at bridge boot from Cascade.json installState field. Optional for
  // backward-compat with bridge.json files written pre-this-Diamond. Read-only
  // projection; Cascade.json remains authoritative (CASS · M69 single source
  // of truth). Suite 4 Green H4: undefined here means Cascade.json read failed
  // anor field absent; downstream consumers MUST handle via resolveInstallState.
  installState?: string;
  // PP-D2 · Ping Pong Liveness Diameter · pongReceipt (Option β · NEW field)
  // null = no Pong yet (bridge up but no Client has Pinged this session)
  pongReceipt?: BridgePongReceipt | null;
  // SWRM · D3 · the active Terminal render mode (the shader-wrap mode for spawned terminals).
  // Optional for backward-compat; absent ⇒ the bridge default (Muxon). The main-process watcher
  // live-swaps running terminals on change; a new terminal hydrates to this value at spawn.
  renderMode?: ShaderRenderMode;
  // SWRM · the active SCP render mode — applies to ALL shaded SCPs (the watcher swaps every SCP
  // offscreen presenter · mirrors renderMode). Optional; absent ⇒ the bridge default (Muxon).
  scpRenderMode?: ShaderRenderMode;
  // C919 · THE FRAME GOVERNOR · the shader output fps for EVERY presenter (terminal + SCP).
  // Optional; absent ⇒ 24 (Like Animation). The SCP huirth RMW is the live writer (Settings
  // slider); the main watcher re-gates running presenters on change.
  shaderFps?: number;
  // SWRM · D3 · the PUBLISHED render-mode catalog (the shared model · src/shared/
  // renderModeCatalog.model.ts). Written on every bridge.json write so the SCP — which watches
  // bridge.json — is aware of the SAME modes the Terminal render offers (no drift between surfaces).
  availableRenderModes?: RenderModeCatalogEntry[];
  // Model Control · the default model EVERY instance spawn/resume uses (`claude --model <id>`),
  // general agent or Suite 8 alike. Absent ⇒ DEFAULT_MODEL (Opus 4.8). The Settings UI edits both
  // this and the catalog post-Epoch.
  defaultModel?: string;
  // D-UP7 · THE UPDATE INDICATOR · the npm registry check (npmVersionCheck.ts — the bridge
  // owns the check; SCPs render from this relay). npmLatestVersion null = no successful
  // check yet this run; updateAvailable compares it numerically vs bridgeVersion.
  npmLatestVersion?: string | null;
  updateAvailable?: boolean;
  versionCheckedAt?: number;
  // THE VERSIONING MUXAMETER · two Demometers under the one Cascade Position — the installed
  // counters (the running bridge's package.json), the remote counters (the /latest custom
  // field), and the classed verdict ('cli' → the npm CLI update · 'scp' → the Update circuit ·
  // 'both' → both · 'unknown' → a pre-counter publish, treat as both). All ride the
  // ...getNpmVersionCheck() composer spread — nothing else to thread.
  installedMuxameter?: { cli: number; scp: number } | null;
  remoteMuxameter?: { cli: number; scp: number } | null;
  updateClass?: 'none' | 'cli' | 'scp' | 'both' | 'unknown';
  // Model Control · the PUBLISHED model catalog (the shared model · modelCatalog.model.ts) —
  // written on every bridge.json write (mirrors availableRenderModes · no drift between surfaces).
  availableModels?: ModelCatalogEntry[];
  // W6a · THE LIFECYCLE PROJECTION (SCM W6 · Spawn Window Focus + Simulated Loading Bar). A
  // scpName → FSM-state-string map projected from the SAME lifecycleByScp FSM the TUI badges ride
  // (state strings: 'pending' | 'idle' | 'booting' | 'live' · scpLifecycle.type.ts). The helm reads
  // the booting-class states (pending/idle/booting) DIRECTLY — the booting phase was previously
  // invisible (boundScps is live-only). Optional for backward-compat; absent ⇒ the helm treats every
  // row as its boundScps-derived live/offline state only (unchanged behaviour). The boot-time writer
  // emits {} (honest default — no FSM projection exists at port-bind time).
  scpLifecycle?: Record<string, string>;
  // SWFB · W6 REFINEMENT · THE WINDOW-PRESENCE PROJECTION · scpName → visible Electron windowId,
  // sourced (bounded · mtime-memoized · TUI-side) from SCPs.json `windowId` — bound by cli-handler
  // setScpWindowId at open-url time, which fires AFTER the SCP server's FSM 'live'. The helm gates
  // its ONE /bridge-focus round on THIS field (window truly exists) instead of on FSM 'live' (the
  // window spawns moments later). A SIBLING of scpLifecycle — deliberately NOT folded into boundScps
  // (its many positional readers stay untouched · smaller diff). Optional for backward-compat; absent
  // ⇒ the helm falls back to its FSM-live behaviour (unchanged). The boot-time writer emits {}.
  scpWindows?: Record<string, number>;
  // M2 · WINDOW-RENDERED (D-WR C628) · scpName → first did-finish-load epoch-ms, sourced (bounded ·
  // mtime-memoized · TUI-side) from SCPs.json `windowRenderedAt` — stamped by electronWindow's M1
  // show-on-rendered moment (window truly PAINTED, not merely BOUND at construction). A SIBLING of
  // scpWindows. The helm gates its focus round on this (RENDERED) so /bridge-focus never targets a
  // bound-but-blank window (the exact blank the user saw focused). Optional for backward-compat; absent
  // ⇒ the helm falls back to scpWindows presence (window BOUND). The boot-time writer emits {}.
  scpWindowsRendered?: Record<string, number>;
  // C653 · THE STATUS PROJECTION (MEND B) · scpName → PSSM status string ('live' | 'pending' |
  // 'installing'), sourced (bounded · mtime-memoized · TUI-side) from SCPs.json `status`. A fresh
  // MULTIPLY worktree instance is registered 'installing' by gitmWorktreeAdd.quality.ts (its tree
  // carries package.json but NO node_modules) and flips to 'pending' when its async `npm install`
  // exits. The helm reads THIS to hold the MULTIPLY staged bar's INSTALL tick + disable the
  // instance-row Spawn button while dependencies land. A SIBLING of scpWindowsRendered (opaque
  // string · degrades honestly). Optional for backward-compat; absent ⇒ the helm treats every
  // instance as install-complete (the pre-C653 behaviour). The boot-time writer emits {}.
  scpStatuses?: Record<string, string>;
};

export type BridgeMetadataState = {
  bridgeVersion: string;
  port: number;
  userCwd: string;
  spawnsByScp: Map<string, { port: number; browserUrl: string }>;
  installedScps: string[];
  // BJVR · sourced from Cascade.json at bridge boot (PRSCD ordering · Cascade
  // always pre-exists bridge). undefined when Cascade.json absent/malformed.
  installState?: string;
  // D3C · Route A · TUI-active SCP focus mirror (BJAS field projection)
  activeScp?: string | null;
  // SWRM · D3 · the active Terminal render mode projected from Muxium state (absent ⇒ default).
  renderMode?: ShaderRenderMode;
  // SWRM · the active SCP render mode (absent ⇒ default · the SCP huirth RMW is the live writer).
  scpRenderMode?: ShaderRenderMode;
  // C919 · the frame governor (absent ⇒ 24 · the SCP huirth RMW is the live writer).
  shaderFps?: number;
  // Model Control · the default spawn/resume model (absent ⇒ DEFAULT_MODEL written explicitly).
  defaultModel?: string;
  // W6a · THE LIFECYCLE PROJECTION (SCM W6) · scpName → FSM-state-string. Projected by the TUI M17
  // caller from lifecycleByScp; the boot-time writer passes {} (no projection at port-bind). Included
  // in the content-hash inputs (animatedTui.ts) so a booting→live transition reaches disk.
  scpLifecycle?: Record<string, string>;
  // SWFB · W6 REFINEMENT · THE WINDOW-PRESENCE PROJECTION · scpName → visible Electron windowId,
  // read (bounded · mtime-memoized) from SCPs.json by the TUI M17 caller ONLY while a spawn window is
  // active; the boot-time writer passes {} (no window bound at port-bind). Included in the content-hash
  // inputs (animatedTui.ts) so the post-live window-bound moment reaches disk.
  scpWindows?: Record<string, number>;
  // M2 · WINDOW-RENDERED (D-WR C628) · scpName → first did-finish-load epoch-ms, read (bounded ·
  // mtime-memoized) from SCPs.json `windowRenderedAt` by the TUI M17 caller (same read as scpWindows).
  // Boot-time writer passes {}. Included in the content-hash inputs so the rendered moment reaches disk.
  scpWindowsRendered?: Record<string, number>;
  // C653 · THE STATUS PROJECTION (MEND B) · scpName → PSSM status string, read (bounded · mtime-
  // memoized) from SCPs.json `status` by the TUI M17 caller (same single read as scpWindows). Boot-
  // time writer passes {}. Included in the content-hash inputs so the 'installing'→'pending' flip
  // (the fresh MULTIPLY instance's npm install completing) reaches disk.
  scpStatuses?: Record<string, string>;
};

export function bridgeMetadataPath(homeDirOverride?: string): string {
  const home = homeDirOverride ?? homedir();
  return join(home, '.scs-bridge', 'bridge.json');
}

// MD-1 · D-SB-1 · THE DIR RESOLVER (write-time projection). Builds a name→absoluteDir
// map from the SCPs.json registry (`path` field · relative from project root) resolved
// against userCwd. Read synchronously at the bridge.json write site — SCPs.json is a
// small local registry and the write chain is already serialized. AFPR: absent /
// malformed SCPs.json → empty map (every dir stays undefined → resolvers fall back to
// the bridge root · never a thrown write). NEVER throws.
// EXPORTED for the npm-version watch's sovereign fan-out (the Rose prescription — the lazy
// perScpPaths getter enumerates the LIVE per-SCP bridge.json paths at RMW time).
export function resolveScpInstallDirs(userCwd: string): Record<string, string> {
  const dirs: Record<string, string> = {};
  try {
    const scpsPath = resolve(userCwd, 'Cascades', 'SCPs.json');
    const raw = readFileSync(scpsPath, 'utf8');
    const parsed = JSON.parse(raw) as { scps?: Array<{ name?: string; path?: string }> };
    if (!parsed || !Array.isArray(parsed.scps)) return dirs;
    for (const entry of parsed.scps) {
      if (
        typeof entry?.name === 'string' &&
        entry.name.length > 0 &&
        typeof entry?.path === 'string' &&
        entry.path.length > 0
      ) {
        dirs[entry.name] = resolve(userCwd, entry.path);
      }
    }
  } catch {
    // AFPR: absent/unreadable/malformed → empty map (dir stays undefined downstream).
  }
  return dirs;
}

// PPRR · Per-project bridge.json relocation (Multi-Bridge Port-Scan Diamond).
// Returns <userCwd>/Cascades/Bridge/bridge.json — the canonical per-project
// registry location that replaces the global ~/.scs-bridge/bridge.json path
// for new-style bridge launches. The global path remains supported via the
// legacy bridgeMetadataPath() for test-isolation paths only.
export function bridgeMetadataPathPerProject(userCwd: string): string {
  return join(userCwd, 'Cascades', 'Bridge', 'bridge.json');
}

// MD-4 P1 · the single-writer funnel (FT-005/FT-006 ENOENT): Writer A (scsBridgeMuxium
// port-bind) and Writer B (the TUI M17 closure) both derive the LITERAL `bridge.json.tmp` —
// concurrent calls let one writer's rename consume the other's tmp → ENOENT on the loser's
// rename. ALL writes now serialize through one module-scope chain (the sessions.json
// single-writer precedent); the chain never rejects (per-link catch) so a failed write
// cannot poison subsequent writes.
let bridgeWriteChain: Promise<void> = Promise.resolve();

export function writeBridgeMetadata(
  state: BridgeMetadataState,
  pathOverride?: string,
): Promise<void> {
  const link = bridgeWriteChain.then(() => writeBridgeMetadataUnsafe(state, pathOverride));
  bridgeWriteChain = link.catch(() => undefined);
  return link;
}

async function writeBridgeMetadataUnsafe(
  state: BridgeMetadataState,
  pathOverride?: string,
): Promise<void> {
  const finalPath = pathOverride ?? bridgeMetadataPath();
  const tmpPath = `${finalPath}.tmp`;

  // MD-1 · D-SB-1 · resolve each spawned SCP's absolute install dir from SCPs.json.
  const scpInstallDirs = resolveScpInstallDirs(state.userCwd);
  const boundScps: Record<string, BoundScpEntry> = {};
  for (const [name, entry] of state.spawnsByScp) {
    boundScps[name] = {
      port: entry.port,
      status: 'live',
      browserUrl: entry.browserUrl,
      // dir = the SCP's absolute install root (SCPs.json `path` resolved against
      // userCwd). Absent from the map (unregistered / SCPs.json missing) ⇒ omit
      // the field ⇒ downstream resolvers fall back to the bridge root.
      ...(scpInstallDirs[name] ? { dir: scpInstallDirs[name] } : {}),
    };
  }

  // S4·S6·S7 SALVO · THE SHADER-FIELD PRESERVATION (the IE dark-shader wound): the
  // Settings RMW is the ONLY writer that SETS renderMode/scpRenderMode/shaderFps — the
  // boot write and the TUI beat write compose their state WITHOUT them, so every full
  // write ERASED the user's choice (undefined = key omitted by JSON.stringify) and the
  // page shader fell to 'off' on the next hash-changing beat. Read-before-write: when
  // the incoming state omits a shader field, the existing file's value stands. ONE seam
  // — the per-SCP fan-out spreads this same object, so every copy carries it too.
  let preservedRenderMode = state.renderMode;
  let preservedScpRenderMode = state.scpRenderMode;
  let preservedShaderFps = state.shaderFps;
  if (
    preservedRenderMode === undefined ||
    preservedScpRenderMode === undefined ||
    preservedShaderFps === undefined
  ) {
    try {
      const existingRaw = await readFile(finalPath, 'utf8');
      const existing = JSON.parse(existingRaw) as Partial<BridgeMetadata>;
      preservedRenderMode = preservedRenderMode ?? existing.renderMode;
      preservedScpRenderMode = preservedScpRenderMode ?? existing.scpRenderMode;
      preservedShaderFps = preservedShaderFps ?? existing.shaderFps;
    } catch {
      /* no existing file — a fresh boot writes the fields absent (the honest default) */
    }
  }

  const metadata: BridgeMetadata = {
    schemaVersion: 1,
    bridgeVersion: state.bridgeVersion,
    writtenAt: Date.now(),
    port: state.port,
    endpoint: `http://127.0.0.1:${state.port}`,
    userCwd: state.userCwd,
    boundScps,
    installedScps: state.installedScps,
    // D3C · Route A · activeScp BJAS field projection (null sentinel when no TUI focus)
    activeScp: state.activeScp ?? null,
    installState: state.installState,
    // PP-D2 · default null sentinel on startup writes; bridgePingPong handler
    // performs read-modify-write to set non-null on Pong (Option β).
    pongReceipt: null,
    // SWRM · D3 · current Terminal render mode (absent ⇒ bridge default Muxon · downstream
    // hydrates) + the published catalog (the shared model · always written so the SCP is aware).
    renderMode: preservedRenderMode,
    scpRenderMode: preservedScpRenderMode,
    shaderFps: preservedShaderFps,
    availableRenderModes: RENDER_MODE_CATALOG,
    // Model Control · the default is written EXPLICITLY (not omitted) so the field is
    // discoverable/editable in bridge.json; the catalog publishes alongside (the shared model).
    defaultModel: state.defaultModel ?? DEFAULT_MODEL,
    availableModels: AVAILABLE_MODELS,
    // D-UP7 · THE COMPOSER LEG — the npm version-check cache rides EVERY bridge.json
    // write so the indicator survives all rewrite sites (boot · pong · TUI refresh).
    ...getNpmVersionCheck(),
    // W6a · THE LIFECYCLE PROJECTION (SCM W6) · the scpName → FSM-state-string map (the TUI M17
    // caller projects lifecycleByScp; the boot-time writer passes {}). Default {} when absent so the
    // field is always present + discoverable. The per-SCP fan-out below carries it FREE (it spreads
    // this metadata object) — the field flows to BOTH the workspace write AND each per-SCP copy.
    scpLifecycle: state.scpLifecycle ?? {},
    // SWFB · W6 REFINEMENT · THE WINDOW-PRESENCE PROJECTION · scpName → visible Electron windowId
    // (the TUI M17 caller reads it bounded from SCPs.json; the boot-time writer passes {}). Default {}
    // when absent so the field is always present + discoverable. Carried FREE to each per-SCP copy by
    // the spread below (mirrors scpLifecycle). The helm gates its ONE focus round on this field.
    scpWindows: state.scpWindows ?? {},
    // M2 · WINDOW-RENDERED (D-WR C628) · scpName → first did-finish-load epoch-ms (the TUI M17 caller
    // reads it bounded from SCPs.json windowRenderedAt; the boot-time writer passes {}). Default {} so
    // the field is always present + discoverable. Carried FREE to each per-SCP copy by the spread below
    // (mirrors scpWindows). The helm's focus round gates on this (RENDERED) not scpWindows (BOUND).
    scpWindowsRendered: state.scpWindowsRendered ?? {},
    // C653 · THE STATUS PROJECTION (MEND B) · scpName → PSSM status string (the TUI M17 caller reads it
    // bounded from SCPs.json `status`; the boot-time writer passes {}). Default {} so the field is always
    // present + discoverable. Carried FREE to each per-SCP copy by the spread below (mirrors scpWindows).
    // The helm reads this to hold the MULTIPLY INSTALL tick + disable Spawn while an instance installs.
    scpStatuses: state.scpStatuses ?? {},
  };

  // Cobalt-FSGT · Cycle 160 R14 · log every bridge.json write site.
  console.log(
    '[SCS-Bridge bridgeMetadata] write · bridge.json access · path=',
    finalPath,
  );
  await mkdir(dirname(finalPath), { recursive: true });
  await writeFile(tmpPath, JSON.stringify(metadata, null, 2), 'utf8');
  await rename(tmpPath, finalPath);

  // BO-2-G · THE PER-SCP BRIDGE RAIL (C446): alongside every workspace write, each installed
  // SCP receives its OWN {installDir}/Cascades/Bridge/bridge.json — the bridge functionality
  // pertains to THAT SCP (the walk-up probe finds the LOCAL copy first). The copy carries the
  // shared discovery fields + scpName. D-BN-2 · THE turnOver RELOCATION — the turn-over signal
  // NO LONGER rides this per-SCP file (it moved onto gitm.json — the git manifold file · user
  // design), so the prior read-and-preserve of `turnOver` is RETIRED. Best-effort per SCP — a
  // failed per-SCP write never poisons the workspace write chain.
  for (const [scpName, scpDir] of Object.entries(scpInstallDirs)) {
    try {
      const perScpPath = join(scpDir, 'Cascades', 'Bridge', 'bridge.json');
      const perScp = { ...metadata, scpName };
      await mkdir(dirname(perScpPath), { recursive: true });
      const perScpTmp = `${perScpPath}.tmp`;
      await writeFile(perScpTmp, JSON.stringify(perScp, null, 2), 'utf8');
      await rename(perScpTmp, perScpPath);
    } catch (err) {
      console.log('[SCS-Bridge bridgeMetadata] per-scp write skip ·', scpName, '·', String(err));
    }
  }
}

export async function readBridgeMetadata(
  pathOverride?: string,
): Promise<BridgeMetadata | null> {
  const path = pathOverride ?? bridgeMetadataPath();
  // Cobalt-FSGT · Cycle 160 R14 · log every bridge.json read site.
  console.log(
    '[SCS-Bridge bridgeMetadata] read · bridge.json access · path=',
    path,
  );
  try {
    const raw = await readFile(path, 'utf8');
    const parsed = JSON.parse(raw) as BridgeMetadata;
    return parsed;
  } catch {
    return null;
  }
}
