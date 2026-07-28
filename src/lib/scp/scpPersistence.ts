/**
 * SCPs.json Registry Helpers (RM-D4)
 *
 * CLI-side read/write surface for `Cascades/SCPs.json`. Mirrors the M2
 * watcher principle's defensive-empty parse contract (PFP-DEFENSIVE-EMPTY):
 * registry shape is INVARIANT; content varies. Any failure collapses to
 * `{ scps: [] }` rather than throwing.
 *
 * Cross-Project Boundary Resolution (CPPFIB / Option α):
 * `ScpStatus`, `ScpRegistryEntry`, `ScpSessionEntry`, `ScpRegistry`,
 * `MainMenuMirrorEntry`, `ScpUserFacingStatus`, and the 2 derivation
 * helpers (deriveMainMenuMirrorEntry · deriveUserFacingStatus) are
 * INLINE-PORTED from:
 *   Cascades/scps/template/SCP/src/concepts/scpRegistry/scpRegistry.type.ts
 *
 * Citation: DIAMOND-TIER-REFINE-MACRO-SCP-INSTALL.md RM-D4
 * Citation: SUITE-4-GREEN-INSTALL-PIPELINE-BIDIRECTIONAL.md (angle F · SCPs.json vs Bridge registry orthogonal)
 */
import {
  existsSync,
  readFileSync,
  writeFileSync,
  renameSync,
  mkdirSync,
} from 'node:fs';
import path from 'node:path';

// ============================================
// TYPES (inline-ported from template scpRegistry.type.ts)
// ============================================

export type ScpStatus = 'template' | 'installed' | 'primed' | 'launching' | 'launched';

export interface ScpSessionEntry {
  sessionId: string;
  spawnedAt: string;
  managingInstancePid: number;
  boundBridgePort: number;
  terminatedAt: string | null;
}

export interface ScpRegistryEntry {
  name: string;
  conceptName: string;
  path: string;
  templateVersion: string;
  installedAt: string;
  status: ScpStatus;
  managingInstancePid: number | null;
  boundBridgePort: number | null;
  sessions: ScpSessionEntry[];
  cadmiumComponents?: string[];
  hyperPersonalizationConfig?: Record<string, unknown>;
  autoLaunch?: boolean;
  // C822 D2 · the commit-locked install's anchor hash (RD-SCP-MANIFEST v1) — present when
  // the SCP was installed AT a manifest anchor; the roster's ANCHORED chip reads it.
  anchoredAt?: string;
  system?: boolean;
}

export interface ScpRegistry {
  scps: ScpRegistryEntry[];
}

// AJMI types (inline-ported)
export type ScpUserFacingStatus = 'Not Installed' | 'Installing' | 'Installed';

export type MainMenuMirrorEntry =
  | { kind: 'install'; label: 'Install Personalized SCP' }
  | { kind: 'show'; label: string; scpName: string };

// ============================================
// AJMI DERIVATIONS (inline-ported)
// ============================================

export function deriveUserFacingStatus(status: ScpStatus | undefined): ScpUserFacingStatus {
  if (status === undefined || status === 'template') return 'Not Installed';
  if (status === 'launched') return 'Installed';
  return 'Installing';
}

export function deriveMainMenuMirrorEntry(registry: ScpRegistry): MainMenuMirrorEntry {
  const installed = registry.scps.find((s) => s.status === 'launched');
  if (installed) {
    return { kind: 'show', label: `Show SCP-${installed.name}`, scpName: installed.name };
  }
  const anyRegistered = registry.scps[0];
  if (anyRegistered) {
    return { kind: 'show', label: `Show SCP-${anyRegistered.name}`, scpName: anyRegistered.name };
  }
  return { kind: 'install', label: 'Install Personalized SCP' };
}

// ============================================
// PATHS
// ============================================

export const SCPS_JSON_RELATIVE = 'Cascades/SCPs.json';

export function resolveScpsJsonPath(projectRoot: string = process.cwd()): string {
  return path.resolve(projectRoot, SCPS_JSON_RELATIVE);
}

// ============================================
// PARSE (defensive empty · mirrors PFP-DEFENSIVE-EMPTY pattern)
// ============================================

export function parseScpRegistry(content: string): ScpRegistry {
  try {
    const parsed = JSON.parse(content);
    if (parsed && Array.isArray(parsed.scps)) {
      return { scps: parsed.scps as ScpRegistryEntry[] };
    }
    return { scps: [] };
  } catch {
    return { scps: [] };
  }
}

// ============================================
// READ
// ============================================

/**
 * Reads SCPs.json from disk. Returns empty registry on missing file or any
 * parse/IO error. NEVER throws.
 */
export function readScpRegistry(projectRoot: string = process.cwd()): ScpRegistry {
  const scpsPath = resolveScpsJsonPath(projectRoot);
  if (!existsSync(scpsPath)) {
    return { scps: [] };
  }
  try {
    const content = readFileSync(scpsPath, 'utf8');
    return parseScpRegistry(content);
  } catch {
    return { scps: [] };
  }
}

// ============================================
// WRITE (atomic tmp+rename · mirrors M2 watcher write discipline)
// ============================================

/**
 * Atomically writes registry to SCPs.json. Creates parent dir if missing.
 * Tmp file + rename ensures partial writes never corrupt the existing file.
 */
export function writeScpRegistry(
  registry: ScpRegistry,
  projectRoot: string = process.cwd(),
): void {
  const scpsPath = resolveScpsJsonPath(projectRoot);
  const parentDir = path.dirname(scpsPath);
  if (!existsSync(parentDir)) {
    mkdirSync(parentDir, { recursive: true });
  }
  const tmpPath = `${scpsPath}.tmp-${process.pid}-${Date.now()}`;
  const content = JSON.stringify(registry, null, 2) + '\n';
  writeFileSync(tmpPath, content, 'utf8');
  renameSync(tmpPath, scpsPath);
}

// ============================================
// IMMUTABLE MUTATIONS
// ============================================

/**
 * Returns a new registry with `entry` appended. Upserts by name if entry with
 * same name already exists (preserves original index).
 */
export function appendScpEntry(registry: ScpRegistry, entry: ScpRegistryEntry): ScpRegistry {
  const existingIdx = registry.scps.findIndex((s) => s.name === entry.name);
  if (existingIdx >= 0) {
    const scps = registry.scps.slice();
    scps[existingIdx] = entry;
    return { scps };
  }
  return { scps: [...registry.scps, entry] };
}

/**
 * Returns a new registry with the named entry's status (and optional pid/port)
 * updated. No-op if no match.
 */
export function updateScpStatus(
  registry: ScpRegistry,
  name: string,
  status: ScpStatus,
  pid?: number,
  port?: number,
): ScpRegistry {
  const idx = registry.scps.findIndex((s) => s.name === name);
  if (idx < 0) return registry;
  const scps = registry.scps.slice();
  scps[idx] = {
    ...scps[idx],
    status,
    managingInstancePid: pid !== undefined ? pid : scps[idx].managingInstancePid,
    boundBridgePort: port !== undefined ? port : scps[idx].boundBridgePort,
  };
  return { scps };
}

/**
 * Returns a new registry with the named entry removed. No-op if no match.
 */
export function removeScpEntry(registry: ScpRegistry, name: string): ScpRegistry {
  const idx = registry.scps.findIndex((s) => s.name === name);
  if (idx < 0) return registry;
  return { scps: [...registry.scps.slice(0, idx), ...registry.scps.slice(idx + 1)] };
}

// ============================================
// FACTORY: build initial entry from install pipeline outputs
// ============================================

export interface BuildScpEntryOptions {
  name: string;
  conceptName: string;
  installPath: string; // relative from project root e.g. "Cascades/scps/MyTest/SCP"
  templateVersion: string;
  status?: ScpStatus; // defaults to 'installed'
  installedAt?: string; // defaults to new Date().toISOString()
  anchoredAt?: string;
}

export function buildScpRegistryEntry(opts: BuildScpEntryOptions): ScpRegistryEntry {
  return {
    name: opts.name,
    conceptName: opts.conceptName,
    path: opts.installPath,
    templateVersion: opts.templateVersion,
    installedAt: opts.installedAt ?? new Date().toISOString(),
    status: opts.status ?? 'installed',
    managingInstancePid: null,
    boundBridgePort: null,
    ...(opts.anchoredAt ? { anchoredAt: opts.anchoredAt } : {}),
    sessions: [],
  };
}

// ============================================
// PORT RESOLUTION (migrated from scpInstall.ts · Template Citizenship BO-2-C)
// ============================================
// Co-located with the registry read/write surface so upsertTemplateCitizen can
// allocate a port at seed time without a circular import on scpInstall.
// scpInstall re-exports pickPortFromRegistry to preserve its public API.

export const SCP_PORT_RANGE_START = 7700;
export const SCP_PORT_RANGE_END = 7799;

/**
 * Returns the first port in [start, end] whose PORT PAIR is NOT currently bound
 * to a SCPs.json entry. Falls back to start if all are taken. NOTE: this does
 * not perform actual socket-bind probing — that's the spawn's responsibility.
 *
 * MD-B · THE PORT-PAIR LAW (the PortableExpanse EADDRINUSE crash): every SCP
 * binds TWO sockets — its assigned port AND the REFLECTED server at port + 1
 * (server.principle.ts). A stride-1 allocator hands the next SCP the previous
 * SCP's reflected port and whichever boots second crashes (the deadly embrace:
 * a nodemon restart on either side re-enters the race). The allocator therefore
 * (a) treats every registered port as consuming {p, p+1}, and (b) strides by 2
 * so pairs never interleave.
 */
export function pickPortFromRegistry(
  registry: ScpRegistry,
  start: number = SCP_PORT_RANGE_START,
  end: number = SCP_PORT_RANGE_END,
): number {
  const used = new Set<number>();
  for (const s of registry.scps) {
    const p = s.boundBridgePort;
    if (p !== null && p !== undefined) {
      used.add(p);
      used.add(p + 1); // the reflected server's socket
    }
  }
  for (let p = start; p <= end - 1; p += 2) {
    if (!used.has(p) && !used.has(p + 1)) return p;
  }
  return start;
}

// ============================================
// TEMPLATE CITIZENSHIP SEED (BO-2-C)
// ============================================

/**
 * Idempotent template citizenship seed. Called at bridge TUI boot.
 * Writes the template SCP as a standard SCPs.json entry (autoLaunch:true,
 * system:true) when:
 *   (a) no 'template' entry already exists in the raw registry
 *   (b) Cascades/scps/template/SCP directory exists at projectRoot
 *
 * Guard (b) prevents seeding on npm-global user projects that have no
 * template on disk. Guard (a) is idempotent — re-runs on every bridge boot.
 */
export function upsertTemplateCitizen(
  projectRoot: string = process.cwd(),
): void {
  const templateSCPDir = path.resolve(projectRoot, 'Cascades', 'scps', 'template', 'SCP');
  if (!existsSync(templateSCPDir)) return;

  const scpsPath = resolveScpsJsonPath(projectRoot);
  const rawContent = existsSync(scpsPath)
    ? readFileSync(scpsPath, 'utf8')
    : '{"scps":[]}';
  const rawRegistry = parseScpRegistry(rawContent);
  // BO-2-G · THE FIELD-FILL (the C445 verification gap): create-only skipped a PRE-EXISTING
  // template entry (the C430 hand-repair predated the seed) — autoLaunch/system never stamped
  // and the explicit-flag launch walk found nothing. An existing entry now gets its MISSING
  // citizenship fields filled (never overwriting a user-set false — only absent fields).
  const existing = rawRegistry.scps.find((s) => s.name === 'template');
  if (existing) {
    const needsFill =
      existing.autoLaunch === undefined ||
      existing.system === undefined ||
      !existing.path ||
      !existing.conceptName;
    if (needsFill) {
      const filled = rawRegistry.scps.map((s) =>
        s.name === 'template'
          ? {
              ...s,
              conceptName: s.conceptName || 'template',
              path: s.path || 'Cascades/scps/template/SCP',
              autoLaunch: s.autoLaunch === undefined ? true : s.autoLaunch,
              system: s.system === undefined ? true : s.system,
            }
          : s,
      );
      writeScpRegistry({ ...rawRegistry, scps: filled }, projectRoot);
    }
    return;
  }

  const port = pickPortFromRegistry(rawRegistry);
  const entry: ScpRegistryEntry = {
    name: 'template',
    conceptName: 'template',
    path: 'Cascades/scps/template/SCP',
    templateVersion: '0.1.0',
    installedAt: new Date().toISOString(),
    status: 'installed',
    managingInstancePid: null,
    boundBridgePort: port,
    sessions: [],
    autoLaunch: true,
    system: true,
  };
  writeScpRegistry(appendScpEntry(rawRegistry, entry), projectRoot);
}
