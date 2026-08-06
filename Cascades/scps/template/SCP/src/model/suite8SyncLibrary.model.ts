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
import {
  mkdirSync,
  readFileSync,
  statSync,
  writeFileSync,
  appendFileSync,
  readdirSync,
  copyFileSync,
  rmSync,
} from 'node:fs';
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
  // U1 · THE USHER REFRAME (C729) — the paths REGISTERED to the library: the watched
  // locations the Zero-Knowledge Watchers consume, keyed by surface name, SCP-root-relative
  // (a FILE anor a DIRECTORY — the usher stats at run time). Seeded from the local group;
  // aspects register further surfaces (the Demometeric means · e.g. the Cadmium frontier).
  registered: Record<string, string>;
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
  const local = normalizeLocalPaths(doc.local, designation);
  // U1 · the registered map — user-borne keys PRESERVED; the three base surfaces always
  // present (filled from the local group when absent).
  const registered: Record<string, string> = {};
  if (isPlainObject(doc.registered)) {
    for (const [k, v] of Object.entries(doc.registered)) {
      if (typeof v === 'string' && v.length > 0) registered[k] = v;
    }
  }
  if (!registered.menu) registered.menu = local.menu;
  if (!registered.cascadeManifest) registered.cascadeManifest = local.cascadeManifest;
  if (!registered.working) registered.working = local.working;
  return {
    schemaVersion: SYNC_LIBRARY_SCHEMA_VERSION,
    localScp,
    specified,
    local,
    paths: normalizeRemotePaths(doc.paths),
    registered,
  };
};

// SL-2 · THE BRIDGE KEY RING (the SCP-side read) — the per-SCP bridge.json the bridge
// fans out carries `syncRing: [{ scpName, root, status }]` (the SCPs available through
// the SCS-Bridge · archived excluded). U3 · THE PUBLISHED-BRIDGE FALLBACK (the field
// Concluder: syncRing ABSENT under the published 0.944.1 bridge, which predates the
// composer): when syncRing is absent, the ring DERIVES from `boundScps` — whose entries
// carry `dir` (the MD-1 Sovereignty field) + `status` in every published bridge.json.
// Installed-but-unbound SCPs carry no dir there — the honest reduced ring; the full ring
// returns the moment a syncRing-aware bridge runs. Both absent ⇒ [] (Local-only).
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
    const parsed = JSON.parse(raw) as { syncRing?: unknown; boundScps?: unknown };
    if (Array.isArray(parsed.syncRing)) {
      return parsed.syncRing.filter(
        (e): e is SyncRingEntry =>
          isPlainObject(e) &&
          typeof e.scpName === 'string' &&
          e.scpName.length > 0 &&
          typeof e.root === 'string' &&
          e.root.length > 0,
      );
    }
    if (isPlainObject(parsed.boundScps)) {
      const out: SyncRingEntry[] = [];
      for (const [scpName, entry] of Object.entries(parsed.boundScps)) {
        if (
          isPlainObject(entry) &&
          typeof entry.dir === 'string' &&
          entry.dir.length > 0
        ) {
          out.push({
            scpName,
            root: entry.dir,
            status: typeof entry.status === 'string' ? entry.status : 'offline',
          });
        }
      }
      return out;
    }
    return [];
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

// ════════════════════════════════════════════════════════════════════════════
// SL-3 · LEG 1 · THE RESOLUTION SEAM (the single truth every consumer calls)
// ════════════════════════════════════════════════════════════════════════════
// resolveSyncLocality(designation): reads the designation's SyncLibrary.json FRESH per call
// (the JSON is the truth — no state duplication · central registration). Returns:
//   - null                      → the LOCAL flow stands, byte-identical to today
//                                 (specified null · library absent · target key absent anor
//                                 unreadable — the guarded fall-through, never dark).
//   - SyncLocalityResolution    → the SPECIFIED representation: the target SCP's key + root
//                                 + ABSOLUTE surface paths (menu · cascadeManifest · working)
//                                 resolved against the TARGET's root.
// THE TRUTH LAW holds structurally here: resolution switches READ PATHS only — no content
// ever copies into the Local files.
export type SyncLocalityResolution = {
  targetScp: string;
  root: string;
  menuAbs: string;
  cascadeManifestAbs: string;
  workingAbs: string;
};

export const resolveSyncLocality = (designation: string): SyncLocalityResolution | null => {
  let raw: unknown;
  try {
    raw = JSON.parse(readFileSync(resolveSyncLibraryPath(designation), 'utf8'));
  } catch {
    return null; // library absent anor unreadable — Local stands (no library, no override).
  }
  if (!isPlainObject(raw)) return null;
  const specified =
    typeof raw.specified === 'string' && raw.specified.trim().length > 0
      ? raw.specified.trim()
      : null;
  if (specified === null) return null; // the default — Local IS the locality.
  const paths = isPlainObject(raw.paths) ? raw.paths : {};
  const target = paths[specified];
  if (
    !isPlainObject(target) ||
    typeof target.root !== 'string' ||
    target.root.length === 0
  ) {
    sinkSyncLibraryTelemetry('resolve.skip', {
      designation,
      specified,
      reason: 'specified-key-absent-anor-rootless',
    });
    return null; // guarded fall-through — Local stands, and the skip names itself.
  }
  // U5B · THE STALE-ROOT GUARD (the archived-SCP induction): a specified key whose root
  // no longer stands on disk (the SCP archived anor moved) falls through to Local with its
  // reason named — the ushers never target a ghost, the anchor never filters for a gone
  // citizen, the page never wedges. Reinstate restores the root → the resolution returns.
  try {
    if (!statSync(target.root).isDirectory()) throw new Error('not-a-directory');
  } catch {
    sinkSyncLibraryTelemetry('resolve.skip', {
      designation,
      specified,
      reason: 'target-root-absent-anor-archived',
    });
    return null;
  }
  const rel = (field: 'menu' | 'cascadeManifest' | 'working'): string => {
    const v = target[field];
    return typeof v === 'string' && v.length > 0
      ? v
      : defaultLocalPathsFor(designation)[field];
  };
  return {
    targetScp: specified,
    root: target.root,
    menuAbs: path.resolve(target.root, rel('menu')),
    cascadeManifestAbs: path.resolve(target.root, rel('cascadeManifest')),
    workingAbs: path.resolve(target.root, rel('working')),
  };
};

// The specified-key read alone (the re-arm comparator — cheap, no path resolution).
export const readSpecifiedKey = (designation: string): string | null => {
  try {
    const raw = JSON.parse(readFileSync(resolveSyncLibraryPath(designation), 'utf8'));
    if (!isPlainObject(raw)) return null;
    return typeof raw.specified === 'string' && raw.specified.trim().length > 0
      ? raw.specified.trim()
      : null;
  } catch {
    return null;
  }
};

// SL-5 · THE CHOSEN LOCALITY WRITE (the registration motion · DIAMOND-SYNC-LIBRARY.md).
// Read → normalize (everything preserved · the Additive Law) → set `specified` → canonical
// write. `specified` must be null (Local) anor a key PRESENT in `paths` — an unknown key
// REFUSES with its reason (never a dark write). THE TRUTH LAW: `local` is never touched.
export type WriteSpecifiedResult = {
  ok: boolean;
  error: string;
  shape: SyncLibraryShape | null;
};

export const writeSpecifiedAdditive = (
  designation: string,
  specified: string | null,
): WriteSpecifiedResult => {
  const filePath = resolveSyncLibraryPath(designation);
  const localScp = readLocalScpName() ?? 'template';
  let raw: unknown = undefined;
  try {
    raw = JSON.parse(readFileSync(filePath, 'utf8'));
  } catch {
    /* absent anor malformed — normalize builds the fresh default shape */
  }
  const normalized = normalizeSyncLibrary(raw, designation, localScp);
  const ringed = composeRingIntoPaths(normalized, designation, readSyncRingFromBridgeJson());
  const requested =
    typeof specified === 'string' && specified.trim().length > 0 ? specified.trim() : null;
  if (requested !== null && !(requested in ringed.paths)) {
    sinkSyncLibraryTelemetry('write-specified.refused', {
      designation,
      requested,
      reason: 'key-not-in-paths',
    });
    return { ok: false, error: `unknown locality key: ${requested}`, shape: null };
  }
  const shape: SyncLibraryShape = { ...ringed, specified: requested };
  try {
    mkdirSync(path.dirname(filePath), { recursive: true });
    writeFileSync(filePath, JSON.stringify(shape, null, 2) + '\n', 'utf8');
    sinkSyncLibraryTelemetry('write-specified.wrote', {
      designation,
      specified: requested ?? 'Local',
    });
    return { ok: true, error: '', shape };
  } catch (err) {
    sinkSyncLibraryTelemetry('write-specified.write-failed', {
      designation,
      error: String(err),
    });
    return { ok: false, error: 'write failed', shape: null };
  }
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

// ════════════════════════════════════════════════════════════════════════════
// U1 · THE USHER PRIMITIVES (the Usher Reframe · C729 · DIAMOND-SYNC-LIBRARY.md)
// ════════════════════════════════════════════════════════════════════════════
// Content moves under FIXED paths — the Zero-Knowledge Watchers stay zero-knowledge; only
// the SyncLibrary carries intelligence. THE LOCAL DIRECTORY (the protected vault) holds the
// preserved local state: Cascades/Extended/<designation>/.syncLocal/ — OUTSIDE every watched
// glob; target content NEVER enters it (the Truth Law's home). Vault layout is KEY-BASED:
// a registered FILE lands at .syncLocal/<key>/<basename>; a registered DIRECTORY mirrors at
// .syncLocal/<key>/ — deterministic + restorable from the registered map alone.

export const SYNC_LOCAL_DIRECTORY_NAME = '.syncLocal';

export const resolveSyncLocalDirectory = (designation: string): string =>
  path.resolve(process.cwd(), 'Cascades', 'Extended', designation, SYNC_LOCAL_DIRECTORY_NAME);

// Register further surfaces onto a designation's library (the Demometeric means — an aspect
// declares its watched locations, e.g. the Cadmium frontier/). ADDITIVE: existing keys are
// preserved (first registration wins — re-registration with a DIFFERENT path is refused with
// telemetry, never a silent re-point); the write lands only on change.
export const registerSyncSurfacesAdditive = (
  designation: string,
  surfaces: Record<string, string>,
): SyncLibrarySeedResult => {
  const seeded = seedSyncLibraryAdditive(designation);
  const registered = { ...seeded.shape.registered };
  let changed = false;
  for (const [key, rel] of Object.entries(surfaces)) {
    if (typeof rel !== 'string' || rel.length === 0) continue;
    if (registered[key] === undefined) {
      registered[key] = rel;
      changed = true;
    } else if (registered[key] !== rel) {
      sinkSyncLibraryTelemetry('register-surface.refused', {
        designation,
        key,
        held: registered[key],
        requested: rel,
        reason: 'key-already-registered-elsewhere',
      });
    }
  }
  if (!changed) return seeded;
  const shape: SyncLibraryShape = { ...seeded.shape, registered };
  try {
    const filePath = resolveSyncLibraryPath(designation);
    mkdirSync(path.dirname(filePath), { recursive: true });
    writeFileSync(filePath, JSON.stringify(shape, null, 2) + '\n', 'utf8');
    sinkSyncLibraryTelemetry('register-surface.wrote', {
      designation,
      keys: Object.keys(surfaces),
    });
    return { shape, wrote: true };
  } catch (err) {
    sinkSyncLibraryTelemetry('register-surface.write-failed', {
      designation,
      error: String(err),
    });
    return { shape, wrote: false };
  }
};

// THE IDENTITY GUARD — byte-compare before every usher write; an usher's own write firing
// its own watcher lands on identical content and SKIPS (no feedback loop). Missing either
// side ⇒ not identical.
export const filesIdentical = (aAbs: string, bAbs: string): boolean => {
  try {
    const a = readFileSync(aAbs);
    const b = readFileSync(bAbs);
    return a.equals(b);
  } catch {
    return false;
  }
};

export type UsherCopyResult = { copied: number; removed: number; skipped: number };

const emptyUsherResult = (): UsherCopyResult => ({ copied: 0, removed: 0, skipped: 0 });

const addResults = (a: UsherCopyResult, b: UsherCopyResult): UsherCopyResult => ({
  copied: a.copied + b.copied,
  removed: a.removed + b.removed,
  skipped: a.skipped + b.skipped,
});

// Usher ONE FILE (identity-guarded). Never throws — a failed copy is telemetry.
export const usherCopyFile = (srcAbs: string, destAbs: string): UsherCopyResult => {
  const out = emptyUsherResult();
  try {
    if (filesIdentical(srcAbs, destAbs)) {
      out.skipped += 1;
      return out;
    }
    mkdirSync(path.dirname(destAbs), { recursive: true });
    copyFileSync(srcAbs, destAbs);
    out.copied += 1;
  } catch (err) {
    sinkSyncLibraryTelemetry('usher.copy-failed', {
      srcAbs,
      destAbs,
      error: String(err).slice(0, 160),
    });
  }
  return out;
};

// MIRROR a DIRECTORY tree src → dest: differing files copied · dest-only files removed
// (a true replace) · identical files skipped. The removal guard: only ever removes INSIDE
// destAbs. The vault's own name is excluded wherever encountered (the protection).
export const usherMirrorTree = (srcAbs: string, destAbs: string): UsherCopyResult => {
  let out = emptyUsherResult();
  let srcEntries: string[] = [];
  try {
    srcEntries = readdirSync(srcAbs);
  } catch {
    return out; // src absent — nothing to mirror (the caller decides emptiness semantics).
  }
  mkdirSync(destAbs, { recursive: true });
  const srcSet = new Set(srcEntries.filter((n) => n !== SYNC_LOCAL_DIRECTORY_NAME));
  for (const name of srcSet) {
    const s = path.join(srcAbs, name);
    const d = path.join(destAbs, name);
    try {
      if (statSync(s).isDirectory()) {
        out = addResults(out, usherMirrorTree(s, d));
      } else {
        out = addResults(out, usherCopyFile(s, d));
      }
    } catch {
      /* raced away — skip */
    }
  }
  try {
    for (const name of readdirSync(destAbs)) {
      if (name === SYNC_LOCAL_DIRECTORY_NAME) continue;
      if (!srcSet.has(name)) {
        const gone = path.join(destAbs, name);
        if (gone.startsWith(destAbs + path.sep)) {
          rmSync(gone, { recursive: true, force: true });
          out.removed += 1;
        }
      }
    }
  } catch {
    /* dest enumeration failed — the copies above still stand */
  }
  return out;
};

// Usher ONE REGISTERED SURFACE (file anor directory · statted at run time) from a source
// root to a dest root. `rel` is the registered SCP-root-relative path; the vault variants
// below key the vault side by the surface KEY instead of the rel path.
const usherSurface = (srcAbs: string, destAbs: string): UsherCopyResult => {
  try {
    if (statSync(srcAbs).isDirectory()) return usherMirrorTree(srcAbs, destAbs);
  } catch {
    return emptyUsherResult(); // src absent — nothing to usher.
  }
  return usherCopyFile(srcAbs, destAbs);
};

const vaultPathFor = (designation: string, key: string, rel: string): string => {
  const vaultBase = path.join(resolveSyncLocalDirectory(designation), key);
  try {
    if (statSync(path.resolve(process.cwd(), rel)).isDirectory()) return vaultBase;
  } catch {
    /* absent local — fall through to the file form */
  }
  return path.join(vaultBase, path.basename(rel));
};

// LOCAL MODE · the preservation motion — every registered surface ushers INTO the vault.
export const snapshotRegisteredToVault = (designation: string): UsherCopyResult => {
  const { shape } = seedSyncLibraryAdditive(designation);
  let out = emptyUsherResult();
  for (const [key, rel] of Object.entries(shape.registered)) {
    out = addResults(
      out,
      usherSurface(path.resolve(process.cwd(), rel), vaultPathFor(designation, key, rel)),
    );
  }
  sinkSyncLibraryTelemetry('usher.snapshot', { designation, ...out });
  return out;
};

// RELEASE · the restoration motion — the vault's frozen truth returns to the watched
// locations byte-intact.
export const restoreRegisteredFromVault = (designation: string): UsherCopyResult => {
  const { shape } = seedSyncLibraryAdditive(designation);
  let out = emptyUsherResult();
  for (const [key, rel] of Object.entries(shape.registered)) {
    const vaultAbs = vaultPathFor(designation, key, rel);
    const destAbs = path.resolve(process.cwd(), rel);
    let vaultExists = false;
    try {
      statSync(vaultAbs);
      vaultExists = true;
    } catch {
      /* no vault entry — the LOCAL truth at snapshot-time was ABSENCE */
    }
    if (vaultExists) {
      out = addResults(out, usherSurface(vaultAbs, destAbs));
      continue;
    }
    // D-SLE-b · THE ABSENT-VAULT ARM (the exact mirror of the replace's absent-target arm) —
    // a local surface that did not exist at snapshot-time vaulted NOTHING; without this arm
    // the restore skips silently and DELIVERED target content survives the closure as local
    // (the field find: IE's topics overrode AL's deliberate blank). Restoring absence =
    // presenting the empty form (file-class) anor clearing the delivered children (dir-class).
    const emptyForm = KNOWN_SURFACE_EMPTY_FORMS[key];
    if (typeof emptyForm === 'string') {
      let already = false;
      try {
        already = readFileSync(destAbs, 'utf8') === emptyForm;
      } catch {
        already = true; // dest also absent — absence restored by absence.
      }
      if (!already) {
        try {
          mkdirSync(path.dirname(destAbs), { recursive: true });
          writeFileSync(destAbs, emptyForm, 'utf8');
          out.copied += 1;
        } catch (err) {
          sinkSyncLibraryTelemetry('usher.restore.empty-form-write-failed', {
            designation,
            key,
            error: String(err).slice(0, 160),
          });
        }
      } else {
        out.skipped += 1;
      }
      sinkSyncLibraryTelemetry('usher.restore.vault-surface-absent', {
        designation,
        key,
        presented: 'empty-form',
      });
    } else {
      let destIsDir = false;
      try {
        destIsDir = statSync(destAbs).isDirectory();
      } catch {
        /* dest absent too — nothing survived; nothing to clear */
      }
      if (destIsDir) {
        out = addResults(out, usherClearDirectory(destAbs));
        sinkSyncLibraryTelemetry('usher.restore.vault-surface-absent', {
          designation,
          key,
          presented: 'empty-dir',
        });
      } else {
        sinkSyncLibraryTelemetry('usher.restore.vault-surface-absent', {
          designation,
          key,
          presented: 'left-in-place',
        });
      }
    }
  }
  sinkSyncLibraryTelemetry('usher.restore', { designation, ...out });
  return out;
};

// THE VAULT HOLD MARKER (DSP-B3a · the boot-poison guard) — the field loss: a bridge
// turn-over rebooted the principle while the tree held DELIVERED target content; the boot
// leg re-ran the local→target transition and its snapshot froze that delivered content
// into the vault as if it were local truth (usher.snapshot copied:18 at boot) — the
// restore then compared poison to poison (copied:0) and the local files never switched
// back. The marker persists ON DISK inside the vault: written at the GENUINE select (the
// one moment the tree is known-local), cleared by the Closure Stage after the restore.
// While the marker stands, snapshot NEVER runs — re-freezing is structurally impossible.
const VAULT_HOLD_MARKER_NAME = '.vaultHold.json';
const vaultHoldMarkerPath = (designation: string): string =>
  path.join(resolveSyncLocalDirectory(designation), VAULT_HOLD_MARKER_NAME);
export const readVaultHoldMarker = (designation: string): { heldFor: string } | null => {
  try {
    const j = JSON.parse(readFileSync(vaultHoldMarkerPath(designation), 'utf8')) as {
      heldFor?: unknown;
    };
    return typeof j?.heldFor === 'string' ? { heldFor: j.heldFor } : null;
  } catch {
    return null;
  }
};
export const writeVaultHoldMarker = (designation: string, heldFor: string): void => {
  try {
    mkdirSync(resolveSyncLocalDirectory(designation), { recursive: true });
    writeFileSync(vaultHoldMarkerPath(designation), JSON.stringify({ heldFor }), 'utf8');
    sinkSyncLibraryTelemetry('vault-hold.written', { designation, heldFor });
  } catch {
    sinkSyncLibraryTelemetry('vault-hold.write-failed', { designation, heldFor });
  }
};
export const clearVaultHoldMarker = (designation: string): void => {
  try {
    rmSync(vaultHoldMarkerPath(designation), { force: true });
    sinkSyncLibraryTelemetry('vault-hold.cleared', { designation });
  } catch {
    /* absent — already clear */
  }
};

// D-SLE · B · CLEAR A DIRECTORY-CLASS DEST (the absent-target mirror-with-empty motion) —
// remove every non-vault child under destAbs, counting the removals. This is the removal arm
// of usherMirrorTree run against an EMPTY src set: the dest's own children fall away, the
// vault (.syncLocal) is untouched wherever encountered (the protection). Vault-safe by
// design — TARGET MODE never touches the vault, and the vault's frozen local truth returns
// through the Closure Stage restore when the locality closes, so clearing the watched
// location here is safe: the local truth is already preserved in .syncLocal.
const usherClearDirectory = (destAbs: string): UsherCopyResult => {
  const out = emptyUsherResult();
  let names: string[] = [];
  try {
    names = readdirSync(destAbs);
  } catch {
    return out; // dest absent — nothing to clear (the empty form already stands).
  }
  for (const name of names) {
    if (name === SYNC_LOCAL_DIRECTORY_NAME) continue;
    const gone = path.join(destAbs, name);
    if (!gone.startsWith(destAbs + path.sep)) continue;
    try {
      rmSync(gone, { recursive: true, force: true });
      out.removed += 1;
    } catch {
      /* raced away — skip */
    }
  }
  return out;
};

// TARGET MODE · the delivery motion — every registered surface at the TARGET's root
// replaces the local watched location (mirror semantics · NEVER touches the vault).
// D-SLE · B · THE ABSENT-TARGET CASE: when a registered surface's TARGET src is genuinely
// absent, the local watched location must present the TARGET's truth (nothing yet), not
// masquerade with the local content. Per surface class: a file-class surface with a known
// empty form writes that form (identity-guarded — skip if already the empty form); a
// dir-class absent surface clears its non-vault children (mirror-with-empty); a file-class
// surface with NO known empty form is left in place (telemetry only). The vault restore
// (the Closure Stage) already protects the local truth — clearing is safe BY DESIGN.
export const replaceRegisteredFromTarget = (
  designation: string,
  targetRoot: string,
): UsherCopyResult => {
  const { shape } = seedSyncLibraryAdditive(designation);
  let out = emptyUsherResult();
  for (const [key, rel] of Object.entries(shape.registered)) {
    const srcAbs = path.resolve(targetRoot, rel);
    const destAbs = path.resolve(process.cwd(), rel);
    let srcExists = false;
    try {
      statSync(srcAbs);
      srcExists = true;
    } catch {
      /* the target surface is genuinely absent */
    }
    if (srcExists) {
      out = addResults(out, usherSurface(srcAbs, destAbs));
      continue;
    }
    // Absent target surface — present the empty form (the target's truth: nothing yet).
    const emptyForm = KNOWN_SURFACE_EMPTY_FORMS[key];
    if (typeof emptyForm === 'string') {
      // File-class registered surface with a known empty form — write it (identity-guarded).
      let already = false;
      try {
        already = readFileSync(destAbs, 'utf8') === emptyForm;
      } catch {
        already = false;
      }
      if (!already) {
        try {
          mkdirSync(path.dirname(destAbs), { recursive: true });
          writeFileSync(destAbs, emptyForm, 'utf8');
          out.copied += 1;
        } catch (err) {
          sinkSyncLibraryTelemetry('usher.replace.empty-form-write-failed', {
            designation,
            key,
            error: String(err).slice(0, 160),
          });
        }
      } else {
        out.skipped += 1;
      }
      sinkSyncLibraryTelemetry('usher.replace.target-surface-absent', {
        designation,
        key,
        presented: 'empty-form',
      });
    } else {
      // No known empty form. Dir-class → mirror-with-empty (clear non-vault children);
      // file-class → leave in place, telemetry only.
      let destIsDir = false;
      try {
        destIsDir = statSync(destAbs).isDirectory();
      } catch {
        destIsDir = false;
      }
      if (destIsDir) {
        out = addResults(out, usherClearDirectory(destAbs));
        sinkSyncLibraryTelemetry('usher.replace.target-surface-absent', {
          designation,
          key,
          presented: 'empty-dir',
        });
      } else {
        sinkSyncLibraryTelemetry('usher.replace.target-surface-absent', {
          designation,
          key,
          presented: 'left-in-place',
        });
      }
    }
  }
  sinkSyncLibraryTelemetry('usher.replace-from-target', { designation, targetRoot, ...out });
  return out;
};

// U2 · THE KNOWN SURFACE REGISTRATIONS — per-designation watch targets beyond the three
// base surfaces, applied additively at Usher boot (the Demometeric means: an aspect's
// surfaces registered by designation). The Cadmium Researcher's frontier/ (the Topic
// Bulletin's directory-class tree) is the first citizen — the C728 salvo's contention.
export const KNOWN_SURFACE_REGISTRATIONS: Record<string, Record<string, string>> = {
  'Cadmium Researcher': {
    frontier: ['Cascades', 'Extended', 'Cadmium Researcher', 'frontier'].join('/'),
    topics: ['Cascades', 'Extended', 'Cadmium Researcher', 'topics.json'].join('/'),
  },
};

// D-SLE · B · THE KNOWN SURFACE EMPTY FORMS — the honest empty representation of a
// file-class surface, keyed by surface key. When TARGET MODE replaces from a target whose
// surface is genuinely ABSENT, the local watched location should present the TARGET's truth
// (nothing yet) — not masquerade as the target with the local content left in place. A
// file-class surface writes its empty form (topics.json → '[]', which parseCadmiumTopics
// returns as [] → the STCP relay broadcasts EMPTY_TOPICS → the Research Frontier clears).
// A surface with NO known empty form + file-class is left untouched (telemetry only); a
// dir-class absent surface clears its non-vault children (mirror-with-empty semantics).
// topicBulletin.json lives INSIDE the frontier/ directory-class, so the dir-class clear
// already covers it — only topics.json needs a file-class empty form here.
export const KNOWN_SURFACE_EMPTY_FORMS: Record<string, string> = {
  topics: '[]',
};

// ════════════════════════════════════════════════════════════════════════════
// B2 · THE CLOSURE REVERT (the Live Locality Law · maintenance requires live)
// ════════════════════════════════════════════════════════════════════════════
// A locality is only ever LIVE. When the specified target's SCP closes (its ring status
// leaves live — the per-SCP bridge.json is the lifecycle truth the bridge rewrites), the
// library REVERTS to the holding SCP of the immediate page: specified → null, WRITTEN —
// and everything downstream follows through the already-proven circuit (the library
// watchers re-arm the menu · the usher machine winds down and restores the vault · the
// anchor induction returns to the own citizen · the Register goes green). Called by the
// Usher principle at boot AND on every bridge.json change. Pure + scratch-testable.
export type ClosureRevertResult = {
  reverted: boolean;
  reason: string;
};

export const revertSpecifiedIfTargetNotLive = (designation: string): ClosureRevertResult => {
  const specified = readSpecifiedKey(designation);
  if (specified === null) return { reverted: false, reason: 'local' };
  const entry = readSyncRingFromBridgeJson().find((e) => e.scpName === specified);
  if (entry && entry.status !== 'offline') {
    return { reverted: false, reason: 'target-live' };
  }
  const w = writeSpecifiedAdditive(designation, null);
  sinkSyncLibraryTelemetry('usher.closure-revert', {
    designation,
    was: specified,
    reason: entry ? 'target-offline' : 'target-left-ring',
    wrote: w.ok,
  });
  return { reverted: w.ok, reason: entry ? 'target-offline' : 'target-left-ring' };
};

// B2b · THE GRACE SPLIT (the turn-over persistence): the pure LIVENESS READ, separated
// from the revert WRITE — the Usher schedules a GRACE COUNTDOWN on a not-live reading
// (a bridge turn over restarts every SCP together; the lifecycle truth is mid-transition
// at boot) and only a SUSTAINED closure reverts. A standing selection SURVIVES the
// turn over — the prior operational means holds.
export const isSpecifiedTargetLive = (
  designation: string,
): { specified: string | null; live: boolean } => {
  const specified = readSpecifiedKey(designation);
  if (specified === null) return { specified: null, live: true };
  const entry = readSyncRingFromBridgeJson().find((e) => e.scpName === specified);
  return { specified, live: !!entry && entry.status !== 'offline' };
};
