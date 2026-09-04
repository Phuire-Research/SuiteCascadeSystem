/**
 * updateManifest.model.ts · MD-UM · LEG 3 — THE REFLEXIVE FETCH (bridge-side)
 *
 * The versioned Update Manifest (updates.json · the TEMPLATE-class file) is retrieved
 * bridge-side and relayed to the SCP alongside the existing version verdict. This module
 * owns the ONE fetcher, the ONE cache, and the advisory invariant.
 *
 * TWO-LAYER SOURCE (the SCS_INSTALL_REPO_URL designation the install/update-clone already
 * honors · installConstants.ts):
 *   - LOCAL GIT (`file://…`): a plain fs read of
 *     <localrepo>/Cascades/scps/template/SCP/src/concepts/vue/vue/updates.json — the dev
 *     loop tests the whole differential surface without the network.
 *   - REMOTE GIT (absent / https): the RD raw fetch —
 *     raw.githubusercontent.com/<owner>/<repo>/main/<MANIFEST_REPO_RELPATH>. Owner/repo are
 *     derived from the installConstants HARDCODED_REPO_URL default (Phuire-Research/
 *     SuiteCascadeSystem), so the two constants can never drift.
 *
 * THE ADVISORY INVARIANT (RD §5): every failure resolves to last-known-good anor null and
 * NEVER throws into a caller. An unreachable manifest is not an error — it is the honest
 * degraded state. The check never gates function.
 *
 * Reference implementation: DevCascades/RD-github-raw-manifest.md §6 (fetchJson · the ETag
 * conditional · the full failure taxonomy · the 2MB cap · the schema guard) + §7 (the disk
 * cache under ~/.scs-bridge/cache/). Adapted: the schema guard targets the updates.json shape
 * (schemaVersion · current · muxameter · releases[]) rather than the generic manifest shape.
 */

import { readFile, writeFile, rename, mkdir } from 'node:fs/promises';
import { homedir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { log } from './debugLog';
import { SCS_INSTALL_REPO_URL } from './installConstants';

// ─────────────────────────────────────────────────────────────────────────────
// RD §6 constants
// ─────────────────────────────────────────────────────────────────────────────
const RAW_BASE = 'https://raw.githubusercontent.com';
const UA = 'scs-bridge (+https://github.com/Phuire-Research/SuiteCascadeSystem)';
const TIMEOUT_MS = 5_000;
const MAX_BYTES = 2 * 1024 * 1024;

// The one mutable ref the manifest rides (RD §2 — `main` moves under the client, ETag-gated).
const MANIFEST_REF = 'main';
// The manifest's repo-relative path (the TEMPLATE-class file · LEG 1). The SAME relpath the
// local fs branch reads and the remote raw fetch appends to <owner>/<repo>/main/.
const MANIFEST_REPO_RELPATH =
  'Cascades/scps/template/SCP/src/concepts/vue/vue/updates.json';

// The install-source default the owner/repo are derived from (installConstants.ts:27 —
// HARDCODED_REPO_URL 'https://github.com/Phuire-Research/SuiteCascadeSystem.git'). Kept as a
// safety floor when the env designation is a bare file:// with no derivable slug.
const FALLBACK_OWNER = 'Phuire-Research';
const FALLBACK_REPO = 'SuiteCascadeSystem';

// ─────────────────────────────────────────────────────────────────────────────
// The updates.json shape (LEG 1 · schemaVersion 1) — the differential releases relay.
// ─────────────────────────────────────────────────────────────────────────────
export interface ManifestReleaseFeature {
  title: string;
  color: string;
  summary: string;
  detail: string[];
}

export interface ManifestRelease {
  id: string;
  version?: string;
  label: string;
  // MD-S8PM · PM-1 · TQNI: `s8` joins the schema (OPTIONAL-TOLERANT — a pre-s8 manifest omits it).
  muxameter?: { cli: number; scp: number; s8?: number };
  magnitude?: number;
  features: ManifestReleaseFeature[];
}

export interface UpdateManifest {
  schemaVersion: number;
  current: string;
  // MD-S8PM · PM-1 · TQNI: `s8` joins the schema (OPTIONAL-TOLERANT — a pre-s8 manifest omits it).
  muxameter: { cli: number; scp: number; s8?: number };
  releases: ManifestRelease[];
}

export interface CacheEntry<T> {
  etag: string | null;
  value: T;
  fetchedAt: number;
}

export type FetchOutcome<T> =
  | { status: 'fresh'; value: T; etag: string | null }
  | { status: 'unchanged'; value: T }
  | { status: 'offline'; value: T | null; reason: string }
  | { status: 'gone'; reason: string };

// ─────────────────────────────────────────────────────────────────────────────
// RD §6 schema guard — adapted to the updates.json shape. Validate before trust: the document
// arrives from a network the bridge does not control, and a permissive parse is how a
// malformed release becomes a broken relay.
// ─────────────────────────────────────────────────────────────────────────────
export const isUpdateManifest = (u: unknown): u is UpdateManifest => {
  if (typeof u !== 'object' || u === null) return false;
  const m = u as Record<string, unknown>;
  if (typeof m.schemaVersion !== 'number') return false;
  if (typeof m.current !== 'string') return false;
  const mux = m.muxameter as Record<string, unknown> | null | undefined;
  if (!mux || typeof mux.cli !== 'number' || typeof mux.scp !== 'number') return false;
  if (!Array.isArray(m.releases)) return false;
  return (m.releases as unknown[]).every((r) => {
    if (typeof r !== 'object' || r === null) return false;
    const rel = r as Record<string, unknown>;
    if (typeof rel.id !== 'string') return false;
    if (typeof rel.label !== 'string') return false;
    if (!Array.isArray(rel.features)) return false;
    // muxameter is optional (evergreen wings carry none) — validate when present.
    if (rel.muxameter !== undefined) {
      const rm = rel.muxameter as Record<string, unknown>;
      if (typeof rm.cli !== 'number' || typeof rm.scp !== 'number') return false;
    }
    return true;
  });
};

const isSha = (ref: string): boolean => /^[0-9a-f]{40}$/i.test(ref);

// ─────────────────────────────────────────────────────────────────────────────
// RD §6 fetchJson — the remote leg. ETag conditional · the full failure taxonomy · the 2MB
// cap · the schema guard. NEVER throws.
// ─────────────────────────────────────────────────────────────────────────────
export async function fetchJson<T>(
  owner: string,
  repo: string,
  ref: string,
  path: string,
  cached: CacheEntry<T> | null,
  validate: (u: unknown) => u is T,
): Promise<FetchOutcome<T>> {
  const url = `${RAW_BASE}/${owner}/${repo}/${ref}/${path}`;
  const headers: Record<string, string> = { 'User-Agent': UA };

  // Only send If-None-Match against mutable refs. A SHA-pinned object never changes, so a
  // conditional request there is wasted (RD §6).
  if (cached?.etag && !isSha(ref)) headers['If-None-Match'] = cached.etag;

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(url, { headers, signal: ctrl.signal });

    if (res.status === 304 && cached) {
      return { status: 'unchanged', value: cached.value };
    }
    if (res.status === 404) {
      return { status: 'gone', reason: `not found: ${ref}/${path}` };
    }
    if (res.status === 429 || res.status >= 500) {
      return { status: 'offline', value: cached?.value ?? null, reason: `http ${res.status}` };
    }
    if (!res.ok) {
      return { status: 'offline', value: cached?.value ?? null, reason: `http ${res.status}` };
    }

    const len = Number(res.headers.get('content-length') ?? 0);
    if (len > MAX_BYTES) {
      return { status: 'offline', value: cached?.value ?? null, reason: 'oversize' };
    }

    const text = await res.text();
    if (text.length > MAX_BYTES) {
      return { status: 'offline', value: cached?.value ?? null, reason: 'oversize' };
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      // Malformed. Prior state survives untouched (RD §5).
      return { status: 'offline', value: cached?.value ?? null, reason: 'malformed json' };
    }

    if (!validate(parsed)) {
      return { status: 'offline', value: cached?.value ?? null, reason: 'schema mismatch' };
    }

    return { status: 'fresh', value: parsed, etag: res.headers.get('etag') };
  } catch (err) {
    return {
      status: 'offline',
      value: cached?.value ?? null,
      reason: err instanceof Error ? err.message : 'network',
    };
  } finally {
    clearTimeout(timer);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// RD §7 — the disk cache under ~/.scs-bridge/cache/. Two fields carry the load: `etag` makes
// the next poll a 304; `value` makes offline operation possible.
// ─────────────────────────────────────────────────────────────────────────────
// C1053 · fetchText — the TEXT-MODE sibling of fetchJson, for the instruction-set diff.
//
// Same URL construction, same UA, same timeout, same size guard, same status ladder — ONLY the
// JSON.parse and the schema validation are absent, because the payload is a Markdown document, not a
// manifest. Extracted rather than parameterised: fetchJson's caller contract (CacheEntry<T> +
// validate) has no meaning for raw text, and a boolean "skipParse" flag would make one function lie
// about its return type in half its calls.
//
// NO CACHE. The diff compares against whatever is published NOW; a cached remote text would show the
// user changes that were already superseded. The size guard is the only defence needed — the
// instruction set is ~40 KB and MAX_BYTES is 2 MB.
export type FetchTextOutcome =
  | { status: 'ok'; text: string }
  | { status: 'gone'; reason: string }
  | { status: 'offline'; reason: string };

export async function fetchText(owner: string, repo: string, ref: string, path: string): Promise<FetchTextOutcome> {
  const url = `${RAW_BASE}/${owner}/${repo}/${ref}/${path}`;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, { headers: { 'User-Agent': UA }, signal: ctrl.signal });
    if (res.status === 404) return { status: 'gone', reason: `not found: ${ref}/${path}` };
    if (!res.ok) return { status: 'offline', reason: `http ${res.status}` };
    const len = Number(res.headers.get('content-length') ?? 0);
    if (len > MAX_BYTES) return { status: 'offline', reason: 'oversize' };
    const text = await res.text();
    if (text.length > MAX_BYTES) return { status: 'offline', reason: 'oversize' };
    return { status: 'ok', text };
  } catch (err) {
    return { status: 'offline', reason: err instanceof Error ? err.message : String(err) };
  } finally {
    clearTimeout(timer);
  }
}

export function manifestCachePath(homeDirOverride?: string): string {
  const home = homeDirOverride ?? homedir();
  return join(home, '.scs-bridge', 'cache', 'updateManifest.json');
}

async function readCache(homeDirOverride?: string): Promise<CacheEntry<UpdateManifest> | null> {
  try {
    const raw = await readFile(manifestCachePath(homeDirOverride), 'utf-8');
    const parsed = JSON.parse(raw) as CacheEntry<UpdateManifest>;
    if (isUpdateManifest(parsed?.value)) return parsed;
    return null;
  } catch {
    return null;
  }
}

async function writeCache(
  entry: CacheEntry<UpdateManifest>,
  homeDirOverride?: string,
): Promise<void> {
  try {
    const finalPath = manifestCachePath(homeDirOverride);
    await mkdir(dirname(finalPath), { recursive: true });
    const tmpPath = `${finalPath}.tmp`;
    await writeFile(tmpPath, JSON.stringify(entry, null, 2), 'utf-8');
    await rename(tmpPath, finalPath);
  } catch (err) {
    // Advisory invariant — a failed cache write never propagates.
    log('update-manifest.cache.write-skip', {
      error: err instanceof Error ? err.message.slice(0, 200) : String(err),
    });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// THE REFLEXIVE SOURCE — resolve the SCS_INSTALL_REPO_URL designation (installConstants.ts).
// ─────────────────────────────────────────────────────────────────────────────
type ManifestSource =
  | { kind: 'local'; root: string }
  | { kind: 'remote'; owner: string; repo: string };

// Derive the two-layer source from the env designation. `file://…` ⇒ local fs read of the
// repo's own updates.json; anything else (https / git@ / absent) ⇒ the remote raw fetch with
// owner/repo derived from the URL (falling back to the installConstants default slug).
export function resolveManifestSource(repoUrl: string): ManifestSource {
  if (repoUrl.startsWith('file://')) {
    let root: string;
    try {
      root = fileURLToPath(repoUrl);
    } catch {
      // A bare `file://<path>` that fileURLToPath rejects — strip the scheme by hand.
      root = repoUrl.replace(/^file:\/\//, '');
    }
    return { kind: 'local', root };
  }
  // Remote — derive owner/repo from the github URL shape, else the installConstants default.
  const slug = deriveOwnerRepo(repoUrl);
  return { kind: 'remote', owner: slug.owner, repo: slug.repo };
}

// Parse `https://github.com/<owner>/<repo>(.git)?` (also git@github.com:<owner>/<repo>.git).
// Falls back to the installConstants HARDCODED_REPO_URL slug when the shape is unfamiliar.
export function deriveOwnerRepo(repoUrl: string): { owner: string; repo: string } {
  const m =
    repoUrl.match(/github\.com[/:]([^/]+)\/([^/#?]+?)(?:\.git)?(?:[/#?].*)?$/i) ?? null;
  if (m && m[1] && m[2]) {
    return { owner: m[1], repo: m[2] };
  }
  return { owner: FALLBACK_OWNER, repo: FALLBACK_REPO };
}

// The local fs read — plain read of <root>/<MANIFEST_REPO_RELPATH>. Advisory: absent /
// malformed / schema-mismatch → null (never throws).
async function readLocalManifest(root: string): Promise<UpdateManifest | null> {
  try {
    const p = resolve(root, MANIFEST_REPO_RELPATH);
    const raw = await readFile(p, 'utf-8');
    const parsed = JSON.parse(raw) as unknown;
    if (isUpdateManifest(parsed)) return parsed;
    log('update-manifest.local.schema-mismatch', { path: p });
    return null;
  } catch (err) {
    log('update-manifest.local.skip', {
      error: err instanceof Error ? err.message.slice(0, 200) : String(err),
    });
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// THE IN-PROCESS CACHE (the composer-leg source). The bridgeMetadata composer reads
// getCachedReleaseManifest() at write time — NEVER awaiting a network fetch inline. The fetch
// runs on a timer (startUpdateManifestWatch); the composer writes from this cache.
// ─────────────────────────────────────────────────────────────────────────────
let inProcessManifest: UpdateManifest | null = null;

// The composer leg — synchronous, returns the last-known-good manifest anor null. Rides
// bridge.json via the same idiom as getNpmVersionCheck() (bridgeMetadata.ts composer spread).
export function getCachedReleaseManifest(): UpdateManifest | null {
  return inProcessManifest;
}

// One refresh — resolve the source, fetch/read, validate, update the in-process cache + the
// disk cache. Advisory throughout: any failure leaves the in-process cache untouched (the
// composer keeps serving last-known-good). Returns the resolved manifest anor null.
export async function refreshReleaseManifest(
  repoUrl: string = SCS_INSTALL_REPO_URL,
  homeDirOverride?: string,
): Promise<UpdateManifest | null> {
  const source = resolveManifestSource(repoUrl);

  if (source.kind === 'local') {
    const local = await readLocalManifest(source.root);
    if (local) {
      inProcessManifest = local;
      // Seed the disk cache too so a later remote run has last-known-good even offline.
      await writeCache({ etag: null, value: local, fetchedAt: Date.now() }, homeDirOverride);
      log('update-manifest.local.ok', { root: source.root, releases: local.releases.length });
    }
    // If the local read failed, fall back to any disk-cached last-known-good.
    if (!inProcessManifest) {
      const cached = await readCache(homeDirOverride);
      if (cached) inProcessManifest = cached.value;
    }
    return inProcessManifest;
  }

  // Remote — the RD raw fetch with the disk cache as the ETag/offline source.
  const cached = await readCache(homeDirOverride);
  const outcome = await fetchJson<UpdateManifest>(
    source.owner,
    source.repo,
    MANIFEST_REF,
    MANIFEST_REPO_RELPATH,
    cached,
    isUpdateManifest,
  );

  switch (outcome.status) {
    case 'fresh':
      inProcessManifest = outcome.value;
      await writeCache(
        { etag: outcome.etag, value: outcome.value, fetchedAt: Date.now() },
        homeDirOverride,
      );
      log('update-manifest.remote.fresh', {
        owner: source.owner,
        repo: source.repo,
        releases: outcome.value.releases.length,
      });
      break;
    case 'unchanged':
      inProcessManifest = outcome.value;
      log('update-manifest.remote.unchanged', {});
      break;
    case 'gone':
      // Permanent (404) — surface once, keep last-known-good (advisory).
      log('update-manifest.remote.gone', { reason: outcome.reason });
      if (!inProcessManifest && cached) inProcessManifest = cached.value;
      break;
    case 'offline':
      // Cached fallthrough — the advisory invariant.
      log('update-manifest.remote.offline', { reason: outcome.reason });
      inProcessManifest = outcome.value ?? inProcessManifest ?? cached?.value ?? null;
      break;
  }
  return inProcessManifest;
}

// Jitter prevents the install base converging on wall-clock boundaries (RD §6 poll schedule).
export function nextPollDelay(baseMs = 300_000): number {
  return baseMs + Math.floor(Math.random() * baseMs * 0.4);
}

// ─────────────────────────────────────────────────────────────────────────────
// BOOT ENTRY — one deferred refresh + a periodic re-poll, both unref'd (never hold the process
// open). Non-blocking: the metadata write reads the cache; this timer populates it. Mirrors
// npmVersionCheck.startNpmVersionWatch's cadence discipline.
// ─────────────────────────────────────────────────────────────────────────────
const BOOT_DEFER_MS = 12_000;

export function startUpdateManifestWatch(repoUrl: string = SCS_INSTALL_REPO_URL): void {
  const runOnce = (): void => {
    // Advisory — refreshReleaseManifest never throws; the void promise is fire-and-forget.
    void refreshReleaseManifest(repoUrl);
  };
  const bootTimer = setTimeout(runOnce, BOOT_DEFER_MS);
  bootTimer.unref?.();
  const interval = setInterval(runOnce, nextPollDelay());
  interval.unref?.();
  log('update-manifest.watch.started', { repoUrl });
}
