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
import { scpsJsonPath, scsWorkspaceRoot } from '../bridge/paths';

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
  // MD-ARC+C · the archived ledger — OPAQUE on the CLI side (the bridge's
  // scpSessionRegistry owns the shape). Carried through parse/write + every
  // immutable mutation so a CLI-side write NEVER erases archived SCPs.
  archivedScps?: unknown[];
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

// C950 · the registry is SHARED — scpsJsonBasename() is a hard constant ('SCPs.json',
// no environment branch); the C947 per-environment partition described in earlier
// revisions of this comment is RETIRED (see the C950 header in paths.ts).
// TOH-12 · BREAK 2: the default root is the ANCHORED workspace root (scsWorkspaceRoot ·
// bridgeRoot()'s override chain), never raw process.cwd().
export function resolveScpsJsonPath(projectRoot: string = scsWorkspaceRoot()): string {
  return scpsJsonPath(projectRoot);
}

// ============================================
// PARSE (defensive empty · mirrors PFP-DEFENSIVE-EMPTY pattern)
// ============================================

export function parseScpRegistry(content: string): ScpRegistry {
  try {
    const parsed = JSON.parse(content);
    if (parsed && Array.isArray(parsed.scps)) {
      // TOH-12 · BREAK 4 (ABSENT ≠ NULL): a hand-authored or pre-seed entry may lack the
      // boundBridgePort/managingInstancePid KEYS entirely — `undefined`, which the launch
      // guards' `=== null` checks never caught. Normalize ONCE at the parse boundary so
      // every downstream read sees an explicit null for an absent port.
      const scps = (parsed.scps as ScpRegistryEntry[]).map((s) =>
        s && typeof s === 'object'
          ? {
              ...s,
              boundBridgePort: s.boundBridgePort === undefined ? null : s.boundBridgePort,
              managingInstancePid: s.managingInstancePid === undefined ? null : s.managingInstancePid,
            }
          : s,
      );
      const registry: ScpRegistry = { scps };
      // MD-ARC+C · carry the archived ledger opaquely (never reconstructed away).
      if (Array.isArray(parsed.archivedScps)) registry.archivedScps = parsed.archivedScps;
      return registry;
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
export function readScpRegistry(projectRoot: string = scsWorkspaceRoot()): ScpRegistry {
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
  projectRoot: string = scsWorkspaceRoot(),
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
    return { ...registry, scps };
  }
  return { ...registry, scps: [...registry.scps, entry] };
}

/**
 * Returns a new registry with the named entry's status (and optional pid/port)
 * updated. No-op if no match.
 *
 * TOH-12 · BREAK 3 (THE UNGUARDED OVERWRITE · the Sovereignty gate): the port
 * parameter is a FIRST-ASSIGNMENT channel only. A port lands iff the entry's
 * boundBridgePort is currently null/absent (discovery-at-induction — the worktree
 * add's fresh-entry stamp). Once an SCP holds a port, that port is its sovereign
 * identity (localStorage is scoped by scheme+host+PORT); a status update passing a
 * DIFFERENT port is refused — the existing port is kept. Explicit reassignment,
 * when it ever exists, must be its own recorded act (SOV-3), never a side effect
 * of a status write.
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
  const existingPort = scps[idx].boundBridgePort;
  scps[idx] = {
    ...scps[idx],
    status,
    managingInstancePid: pid !== undefined ? pid : scps[idx].managingInstancePid,
    boundBridgePort:
      port !== undefined && (existingPort === null || existingPort === undefined)
        ? port
        : existingPort ?? null,
  };
  return { ...registry, scps };
}

/**
 * Returns a new registry with the named entry removed. No-op if no match.
 */
export function removeScpEntry(registry: ScpRegistry, name: string): ScpRegistry {
  const idx = registry.scps.findIndex((s) => s.name === name);
  if (idx < 0) return registry;
  return {
    ...registry,
    scps: [...registry.scps.slice(0, idx), ...registry.scps.slice(idx + 1)],
  };
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
 * to a SCPs.json entry — LIVE OR ARCHIVED. NOTE: this does not perform actual
 * socket-bind probing — that's the spawn's responsibility.
 *
 * MD-B · THE PORT-PAIR LAW (the PortableExpanse EADDRINUSE crash): every SCP
 * binds TWO sockets — its assigned port AND the REFLECTED server at port + 1
 * (server.principle.ts). A stride-1 allocator hands the next SCP the previous
 * SCP's reflected port and whichever boots second crashes (the deadly embrace:
 * a nodemon restart on either side re-enters the race). The allocator therefore
 * (a) treats every registered port as consuming {p, p+1}, and (b) strides by 2
 * so pairs never interleave.
 *
 * TOH-12 · BREAK 1 (THE SILENT RECLAIM · SOV-3): sovereignty is PERMANENT, not
 * merely current. localStorage is scoped by scheme+host+PORT, so an archived
 * SCP's port still names that SCP's entire browser store — recycling it hands
 * the next SCP the prior SCP's store (this FIRED once: archived PortableExpanse
 * held 7702 before live Stratithon received it). The used-set therefore spans
 * scps[] ∪ archivedScps[]: an archived port stays RESERVED, released only by an
 * explicit recorded act (which does not exist yet — deliberately), never by the
 * accident of archival. archivedScps is opaque on the CLI side (MD-ARC+C), so
 * ports are extracted defensively.
 *
 * Exhaustion now THROWS (`scp-port-range-exhausted`) instead of silently
 * returning `start` — the old fallback handed back an OCCUPIED port, which is
 * exactly the collision class this mend removes.
 */
export function pickPortFromRegistry(
  registry: ScpRegistry,
  start: number = SCP_PORT_RANGE_START,
  end: number = SCP_PORT_RANGE_END,
): number {
  const used = new Set<number>();
  const reserve = (p: unknown): void => {
    if (typeof p === 'number' && Number.isFinite(p)) {
      used.add(p);
      used.add(p + 1); // the reflected server's socket
    }
  };
  for (const s of registry.scps) {
    reserve(s.boundBridgePort);
  }
  for (const a of registry.archivedScps ?? []) {
    reserve((a as { boundBridgePort?: unknown } | null)?.boundBridgePort);
  }
  for (let p = start; p <= end - 1; p += 2) {
    if (!used.has(p) && !used.has(p + 1)) return p;
  }
  throw new Error(
    `scp-port-range-exhausted: no free port pair in [${start},${end}] across live+archived entries`,
  );
}

// ============================================
// TOH-12 · THE PORT SOVEREIGNTY ARBITER (BREAK 5 · SOV-1/2/3)
// ============================================

export interface ScpPortSovereigntyViolation {
  invariant: 'SOV-1' | 'SOV-2';
  detail: string;
  names: string[];
}

/**
 * Returns { p, p+1 } for a numeric port, honoring the PORT-PAIR LAW; empty for
 * null/absent. Shared by every sovereignty predicate so the pair math never forks.
 */
export function scpPortPair(port: unknown): number[] {
  return typeof port === 'number' && Number.isFinite(port) ? [port, port + 1] : [];
}

/**
 * THE SOVEREIGNTY INVARIANT, as a checkable statement (never throws · REPORTS):
 *   SOV-1 · no two entries across scps[] ∪ archivedScps[] hold overlapping
 *           {p, p+1} pairs. (The live ledger already carries ONE historical
 *           violation — archived PortableExpanse and live Stratithon both at
 *           7702, the recorded silent-reclaim event — so this is a reporter
 *           everywhere and a BLOCKER only at the mutation gates: allocation
 *           (pickPortFromRegistry's union), reinstate, launch.)
 *   SOV-2 · no registered scps[] entry has a null/absent port (post-parse
 *           normalization, absent reads as null).
 *   SOV-3 · reclamation is an explicit recorded act, never a default — enforced
 *           structurally by the allocator's live ∪ archived used-set; no code
 *           path releases an archived port today, by design.
 */
export function findScpPortSovereigntyViolations(
  registry: ScpRegistry,
): ScpPortSovereigntyViolation[] {
  const violations: ScpPortSovereigntyViolation[] = [];
  type Row = { name: string; port: unknown; archived: boolean };
  const rows: Row[] = [
    ...registry.scps.map((s) => ({ name: s.name, port: s.boundBridgePort, archived: false })),
    ...(registry.archivedScps ?? []).map((a) => {
      const rec = a as { name?: unknown; boundBridgePort?: unknown } | null;
      return {
        name: typeof rec?.name === 'string' ? rec.name : '(unnamed-archived)',
        port: rec?.boundBridgePort,
        archived: true,
      };
    }),
  ];
  for (let i = 0; i < rows.length; i += 1) {
    const a = scpPortPair(rows[i].port);
    if (a.length === 0) continue;
    for (let j = i + 1; j < rows.length; j += 1) {
      const b = scpPortPair(rows[j].port);
      if (b.some((p) => a.includes(p))) {
        violations.push({
          invariant: 'SOV-1',
          detail: `port pair collision: ${rows[i].name}${rows[i].archived ? ' (archived)' : ''} {${a.join(',')}} ∩ ${rows[j].name}${rows[j].archived ? ' (archived)' : ''} {${b.join(',')}}`,
          names: [rows[i].name, rows[j].name],
        });
      }
    }
  }
  for (const s of registry.scps) {
    if (s.boundBridgePort === null || s.boundBridgePort === undefined) {
      violations.push({
        invariant: 'SOV-2',
        detail: `registered entry '${s.name}' has no boundBridgePort`,
        names: [s.name],
      });
    }
  }
  return violations;
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
  projectRoot: string = scsWorkspaceRoot(),
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
    // TOH-12 · BREAK 4: the C430 hand-repaired entry pre-existed the seed, so the
    // create-branch's port allocation never ran and the field-fill silently skipped
    // it — the live registry carried template with the port KEY ENTIRELY ABSENT.
    // An absent/null port now fills exactly like the other citizenship fields.
    const portMissing =
      existing.boundBridgePort === null || existing.boundBridgePort === undefined;
    const needsFill =
      existing.autoLaunch === undefined ||
      existing.system === undefined ||
      !existing.path ||
      !existing.conceptName ||
      portMissing;
    if (needsFill) {
      // Boot-safety: allocation can throw on range exhaustion — the bridge boot
      // must never die on the template seed. On failure the port stays null and
      // the fill still lands the other fields.
      let filledPort: number | null = null;
      if (portMissing) {
        try {
          filledPort = pickPortFromRegistry(rawRegistry);
        } catch {
          filledPort = null;
        }
      }
      const filled = rawRegistry.scps.map((s) =>
        s.name === 'template'
          ? {
              ...s,
              conceptName: s.conceptName || 'template',
              path: s.path || 'Cascades/scps/template/SCP',
              autoLaunch: s.autoLaunch === undefined ? true : s.autoLaunch,
              system: s.system === undefined ? true : s.system,
              boundBridgePort:
                s.boundBridgePort === null || s.boundBridgePort === undefined
                  ? filledPort
                  : s.boundBridgePort,
            }
          : s,
      );
      writeScpRegistry({ ...rawRegistry, scps: filled }, projectRoot);
    }
    return;
  }

  // Boot-safety twin of the field-fill branch: exhaustion must not kill the boot.
  let port: number | null = null;
  try {
    port = pickPortFromRegistry(rawRegistry);
  } catch {
    port = null;
  }
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
