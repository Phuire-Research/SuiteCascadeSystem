/**
 * suite8SyncLibrary.model.ts — SL-1 · THE SYNC LIBRARY GROUND (pure model · no Stratimux imports)
 *
 * THE SYNC LIBRARY: a given Suite 8 Concept, in its Muxified Whole, manages a Sync Library
 * for a given Suite 8 — the on-disk record of the RELATIVE FILE PATHS of each JSON as it
 * sits on disk (the Shatterite Menu JSON + the Suite Cascade Memory), keyed for composition
 * across the SCPs available through the SCS-Bridge.
 *
 * THE FILE: Cascades/Extended/<designation>/SyncLibrary.json
 *   - localScp    — the OWNING SCP's designation (scp.config.json scpName), registered ON BOOT.
 *   - specified   — the CHOSEN locality (an scpKey from `paths`) · null = Local (the default;
 *                   out-of-the-box behavior is byte-identical to today).
 *   - local       — THE SOURCE OF TRUTH · the total local state's paths (menu · cascadeManifest ·
 *                   working). THE TRUTH LAW: no override ever writes into `local`.
 *   - paths       — the composable remotes, keyed by SCP (seeded empty at SL-1 · filled by the
 *                   SL-2 bridge key ring).
 *
 * THE ADDITIVE LAW (the S8.json precedent · suite8Binding.model.ts): an existing file is
 * NORMALIZED, never clobbered — absent fields fill with defaults, present fields (specified,
 * paths) are PRESERVED; malformed = rewrite-fresh with telemetry, never a crash. The seed
 * writes ONLY when the normalized shape differs from what is on disk.
 *
 * Citation: DIAMOND-SYNC-LIBRARY.md SL-1 (the ground · schema + boot registration).
 * Citation: ONYX-TIER-29.md numbering note (the stranded-chain substrate: the scpName stamp
 *           + the founding ladder + central registration).
 */
import { mkdirSync, readFileSync, statSync, writeFileSync, appendFileSync } from 'node:fs';
import path from 'node:path';

export const SYNC_LIBRARY_SCHEMA_VERSION = 1;
export const SYNC_LIBRARY_FILE_NAME = 'SyncLibrary.json';

// The Local path group — the three surfaces the library records for a designation, RELATIVE
// to the owning SCP's package root (the same root every Extended path resolves against).
export type SyncLibraryLocalPaths = {
  menu: string;
  cascadeManifest: string;
  working: string;
};

// A composable remote — one SCP key's group: its absolute package root + the same three
// surfaces relative to THAT root. Seeded by the SL-2 bridge key ring; empty at SL-1.
export type SyncLibraryRemotePaths = SyncLibraryLocalPaths & {
  root: string;
};

export type SyncLibraryShape = {
  schemaVersion: number;
  localScp: string;
  specified: string | null;
  local: SyncLibraryLocalPaths;
  paths: Record<string, SyncLibraryRemotePaths>;
};

// File-sunk telemetry (the C740 idiom · 2MB skip-guard · never-throw) — the seed's Lambda
// trail survives the nodemon pipe.
const SYNC_LIBRARY_SINK_MAX_BYTES = 2 * 1024 * 1024;
const syncLibrarySinkPath = (): string =>
  path.resolve(process.cwd(), 'Cascades', 'Bridge', 'suite8-sync-library.json');
export const sinkSyncLibraryTelemetry = (
  seat: string,
  detail: Record<string, unknown> = {},
): void => {
  try {
    const sink = syncLibrarySinkPath();
    mkdirSync(path.dirname(sink), { recursive: true });
    try {
      if (statSync(sink).size > SYNC_LIBRARY_SINK_MAX_BYTES) {
        return;
      }
    } catch {
      /* sink absent · the first append creates it */
    }
    appendFileSync(
      sink,
      JSON.stringify({ ts: new Date().toISOString(), seat, ...detail }) + '\n',
      'utf8',
    );
  } catch {
    /* telemetry must never harm the seed · skip */
  }
};

// The OWNING SCP's designation — scp.config.json scpName at the package root (the C727
// reader's discipline: null on ANY failure · the caller decides the fallback voice).
export const readLocalScpName = (): string | null => {
  try {
    const raw = readFileSync(path.resolve(process.cwd(), 'scp.config.json'), 'utf8');
    const parsed = JSON.parse(raw) as { scpName?: unknown };
    return typeof parsed.scpName === 'string' && parsed.scpName.trim().length > 0
      ? parsed.scpName.trim()
      : null;
  } catch {
    return null;
  }
};

export const resolveSyncLibraryPath = (designation: string): string =>
  path.resolve(process.cwd(), 'Cascades', 'Extended', designation, SYNC_LIBRARY_FILE_NAME);

// The default Local group for a designation — the paths AS THEY EXIST on disk today:
// the Shatterite menu.json + the Cascade memory (the root manifest + the Working/ stratum),
// all relative to the SCP package root (POSIX separators — the JSON is a portable record).
export const defaultLocalPathsFor = (designation: string): SyncLibraryLocalPaths => ({
  menu: ['Cascades', 'Extended', designation, 'menu.json'].join('/'),
  cascadeManifest: ['Cascades', 'Extended', designation, 'Cascade.json'].join('/'),
  working: ['Cascades', 'Extended', designation, 'Working'].join('/'),
});

const isPlainObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

const normalizeLocalPaths = (
  raw: unknown,
  designation: string,
): SyncLibraryLocalPaths => {
  const defaults = defaultLocalPathsFor(designation);
  if (!isPlainObject(raw)) return defaults;
  return {
    menu: typeof raw.menu === 'string' && raw.menu.length > 0 ? raw.menu : defaults.menu,
    cascadeManifest:
      typeof raw.cascadeManifest === 'string' && raw.cascadeManifest.length > 0
        ? raw.cascadeManifest
        : defaults.cascadeManifest,
    working:
      typeof raw.working === 'string' && raw.working.length > 0 ? raw.working : defaults.working,
  };
};

const normalizeRemotePaths = (raw: unknown): Record<string, SyncLibraryRemotePaths> => {
  if (!isPlainObject(raw)) return {};
  const out: Record<string, SyncLibraryRemotePaths> = {};
  for (const [key, value] of Object.entries(raw)) {
    if (!isPlainObject(value)) continue;
    if (typeof value.root !== 'string' || value.root.length === 0) continue;
    out[key] = {
      root: value.root,
      menu: typeof value.menu === 'string' ? value.menu : '',
      cascadeManifest: typeof value.cascadeManifest === 'string' ? value.cascadeManifest : '',
      working: typeof value.working === 'string' ? value.working : '',
    };
  }
  return out;
};

// Normalize a raw on-disk document into the canonical shape — PRESERVING the user-borne
// fields (specified · paths · a present localScp) and filling the rest. A non-object raw
// (malformed · absent) yields the fresh default shape.
export const normalizeSyncLibrary = (
  raw: unknown,
  designation: string,
  localScpFallback: string,
): SyncLibraryShape => {
  const doc = isPlainObject(raw) ? raw : {};
  const localScp =
    typeof doc.localScp === 'string' && doc.localScp.trim().length > 0
      ? doc.localScp.trim()
      : localScpFallback;
  const specified =
    typeof doc.specified === 'string' && doc.specified.trim().length > 0
      ? doc.specified.trim()
      : null;
  return {
    schemaVersion: SYNC_LIBRARY_SCHEMA_VERSION,
    localScp,
    specified,
    local: normalizeLocalPaths(doc.local, designation),
    paths: normalizeRemotePaths(doc.paths),
  };
};

// SL-2 · THE BRIDGE KEY RING (the SCP-side read) — the per-SCP bridge.json the bridge
// fans out carries `syncRing: [{ scpName, root, status }]` (the SCPs available through
// the SCS-Bridge · archived excluded). Absent (a pre-SL-2 bridge) ⇒ [] — the library
// stands Local-only, the honest degraded state.
export type SyncRingEntry = {
  scpName: string;
  root: string;
  status: string;
};

export const readSyncRingFromBridgeJson = (): SyncRingEntry[] => {
  try {
    const raw = readFileSync(
      path.resolve(process.cwd(), 'Cascades', 'Bridge', 'bridge.json'),
      'utf8',
    );
    const parsed = JSON.parse(raw) as { syncRing?: unknown };
    if (!Array.isArray(parsed.syncRing)) return [];
    return parsed.syncRing.filter(
      (e): e is SyncRingEntry =>
        isPlainObject(e) &&
        typeof e.scpName === 'string' &&
        e.scpName.length > 0 &&
        typeof e.root === 'string' &&
        e.root.length > 0,
    );
  } catch {
    return [];
  }
};

// Compose the ring into a shape's `paths` — the bridge is AUTHORITATIVE for ring-derived
// keys (roots move on reinstall); keys NOT in the ring (user-borne exotics) are PRESERVED
// (the Additive Law); the library's OWN localScp is EXCLUDED (its vantage IS Local).
export const composeRingIntoPaths = (
  shape: SyncLibraryShape,
  designation: string,
  ring: SyncRingEntry[],
): SyncLibraryShape => {
  const paths: Record<string, SyncLibraryRemotePaths> = { ...shape.paths };
  for (const entry of ring) {
    if (entry.scpName === shape.localScp) continue;
    paths[entry.scpName] = {
      root: entry.root,
      ...defaultLocalPathsFor(designation),
    };
  }
  return { ...shape, paths };
};

export type SyncLibrarySeedResult = {
  shape: SyncLibraryShape;
  wrote: boolean;
};

// THE BOOT SEED (additive · idempotent): read the designation's SyncLibrary.json, normalize
// (malformed → fresh + telemetry), register the local SCP, and write ONLY when the canonical
// serialization differs from what stands on disk. Never throws — a failed write is telemetry,
// and the normalized in-memory shape still returns for the caller's use.
export const seedSyncLibraryAdditive = (designation: string): SyncLibrarySeedResult => {
  const filePath = resolveSyncLibraryPath(designation);
  const localScp = readLocalScpName() ?? 'template';
  let raw: unknown = undefined;
  let malformed = false;
  try {
    raw = JSON.parse(readFileSync(filePath, 'utf8'));
  } catch (err) {
    const isEnoent = (err as NodeJS.ErrnoException)?.code === 'ENOENT';
    if (!isEnoent) {
      malformed = true;
      sinkSyncLibraryTelemetry('seed.malformed', { designation, error: String(err) });
    }
  }
  const normalized = normalizeSyncLibrary(raw, designation, localScp);
  // SL-2 · the ring fills the composable paths (bridge-authoritative for ring keys ·
  // user-borne exotics preserved · the local key excluded).
  const shape = composeRingIntoPaths(normalized, designation, readSyncRingFromBridgeJson());
  const canonical = JSON.stringify(shape, null, 2) + '\n';
  let existing: string | null = null;
  try {
    existing = readFileSync(filePath, 'utf8');
  } catch {
    existing = null;
  }
  if (existing === canonical) {
    return { shape, wrote: false };
  }
  try {
    mkdirSync(path.dirname(filePath), { recursive: true });
    writeFileSync(filePath, canonical, 'utf8');
    sinkSyncLibraryTelemetry('seed.wrote', {
      designation,
      localScp: shape.localScp,
      specified: shape.specified,
      malformedRecovered: malformed,
    });
    return { shape, wrote: true };
  } catch (err) {
    sinkSyncLibraryTelemetry('seed.write-failed', { designation, error: String(err) });
    return { shape, wrote: false };
  }
};
