/**
 * npmVersionCheck.ts · D-UP7 · THE UPDATE INDICATOR (npm registry leg)
 *
 * The bridge owns the check; bridge.json carries it; every SCP surface renders from the
 * relay. Fetches the LATEST published version of scs-bridge from the npm registry
 * (registry.npmjs.org/scs-bridge/latest — the tiny per-version document, not the full
 * packument) and compares it numerically against the running bridge's own version.
 *
 * TWO DELIVERY LEGS (both required):
 *   1. THE COMPOSER LEG — writeBridgeMetadata consults getNpmVersionCheck() on EVERY
 *      bridge.json write, so the fields survive every rewrite (pong · TUI refresh · boot).
 *   2. THE RMW LEG — when a check completes, applyVersionCheckToBridgeJson() read-modify-
 *      writes bridge.json immediately (the pongReceipt Option β idiom · atomic tmp+rename),
 *      so the SCP's chokidar relay surfaces the result without waiting for the next full
 *      write.
 *
 * DISCIPLINE: fully non-blocking + failure-silent — an offline machine, a registry
 * timeout, anor a malformed response logs a skip and leaves the cache untouched (no
 * indicator is the honest degraded state; the check NEVER blocks anor breaks the bridge).
 * Cadence: one deferred check shortly after boot + a 6-hour interval (unref'd).
 */

import { readFile, writeFile, rename } from 'node:fs/promises';
import { log } from './debugLog';
import { getBridgeMuxameter, type ScsMuxameter } from './bridgeVersion';

// THE MUXAMETER VERDICT — the counter comparison classed. 'unknown' = the remote publish
// predates the counters (the 0.933.0 migration note: treat as both-paths, safe once).
export type ScsUpdateClass = 'none' | 'cli' | 'scp' | 'both' | 'unknown';

export type NpmVersionCheck = {
  // The latest version published on npm · null = no successful check yet this run.
  npmLatestVersion: string | null;
  // true iff npmLatestVersion is numerically newer than the running bridge's version.
  updateAvailable: boolean;
  // Epoch-ms of the last SUCCESSFUL check · 0 = none yet.
  versionCheckedAt: number;
  // THE VERSIONING MUXAMETER · the installed counters (the grandparent package.json — the
  // running bridge's own) · the remote counters (the registry /latest custom field — custom
  // package.json fields survive publish · live-proven) · the classed verdict. All three ride
  // the composer spread + the RMW leg → bridge.json → the field-agnostic SCP relay, FREE.
  installedMuxameter: ScsMuxameter | null;
  remoteMuxameter: ScsMuxameter | null;
  updateClass: ScsUpdateClass;
};

const REGISTRY_LATEST_URL = 'https://registry.npmjs.org/scs-bridge/latest';
const CHECK_TIMEOUT_MS = 6000;
const BOOT_DEFER_MS = 15_000;
const CHECK_INTERVAL_MS = 6 * 60 * 60 * 1000;

const cache: NpmVersionCheck = {
  npmLatestVersion: null,
  updateAvailable: false,
  versionCheckedAt: 0,
  installedMuxameter: null,
  remoteMuxameter: null,
  updateClass: 'none',
};

// The verdict derivation — pure counter comparison (the Conference's counter resolution).
export function deriveUpdateClass(
  updateAvailable: boolean,
  installed: ScsMuxameter | null,
  remote: ScsMuxameter | null,
): ScsUpdateClass {
  if (!updateAvailable) return 'none';
  if (!installed || !remote) return 'unknown'; // pre-counter publishes → both-paths, safe once
  const cli = remote.cli > installed.cli;
  const scp = remote.scp > installed.scp;
  if (cli && scp) return 'both';
  if (cli) return 'cli';
  if (scp) return 'scp';
  // A version bump with neither counter advanced — packaging-only; nothing user-facing.
  return 'none';
}

export function getNpmVersionCheck(): NpmVersionCheck {
  return { ...cache };
}

// Numeric dotted compare — true iff `latest` is strictly newer than `current`.
// Non-numeric segments compare as 0 (pre-release suffixes never claim newer falsely
// against a clean triple; the published lineage is clean x.y.z throughout).
export function isVersionNewer(latest: string, current: string): boolean {
  const a = latest.split('.').map((s) => parseInt(s, 10) || 0);
  const b = current.split('.').map((s) => parseInt(s, 10) || 0);
  for (let i = 0; i < Math.max(a.length, b.length); i += 1) {
    const av = a[i] ?? 0;
    const bv = b[i] ?? 0;
    if (av > bv) return true;
    if (av < bv) return false;
  }
  return false;
}

export async function checkNpmLatestVersion(currentVersion: string): Promise<NpmVersionCheck> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), CHECK_TIMEOUT_MS);
  try {
    const res = await fetch(REGISTRY_LATEST_URL, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) {
      log('npm-version.check.skip', { reason: `http-${res.status}` });
      return getNpmVersionCheck();
    }
    const body = (await res.json()) as {
      version?: unknown;
      scsMuxameter?: { cli?: unknown; scp?: unknown };
    };
    const latest = typeof body.version === 'string' ? body.version.trim() : '';
    if (latest === '') {
      log('npm-version.check.skip', { reason: 'no-version-field' });
      return getNpmVersionCheck();
    }
    cache.npmLatestVersion = latest;
    cache.updateAvailable = isVersionNewer(latest, currentVersion);
    cache.versionCheckedAt = Date.now();
    // THE MUXAMETER LEG — the remote counters ride the same /latest document (custom
    // package.json fields survive publish); the installed counters ride the grandparent
    // parse; the verdict is pure comparison.
    const rm = body.scsMuxameter;
    cache.remoteMuxameter =
      rm && typeof rm.cli === 'number' && typeof rm.scp === 'number'
        ? { cli: rm.cli, scp: rm.scp }
        : null;
    cache.installedMuxameter = getBridgeMuxameter();
    cache.updateClass = deriveUpdateClass(
      cache.updateAvailable,
      cache.installedMuxameter,
      cache.remoteMuxameter,
    );
    log('npm-version.check.ok', {
      latest,
      current: currentVersion,
      updateAvailable: cache.updateAvailable,
      updateClass: cache.updateClass,
      installedMuxameter: cache.installedMuxameter,
      remoteMuxameter: cache.remoteMuxameter,
    });
    return getNpmVersionCheck();
  } catch (err) {
    log('npm-version.check.skip', {
      reason: 'fetch-failed',
      error: err instanceof Error ? err.message.slice(0, 200) : String(err),
    });
    return getNpmVersionCheck();
  } finally {
    clearTimeout(timer);
  }
}

// THE RMW LEG — merge the cached check into an EXISTING bridge.json (atomic tmp+rename ·
// the pongReceipt Option β idiom). Absent file anor parse failure → skip silently (the
// composer leg carries the fields on the next full write regardless).
export async function applyVersionCheckToBridgeJson(bridgeJsonPath: string): Promise<void> {
  try {
    const raw = await readFile(bridgeJsonPath, 'utf-8');
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    parsed.npmLatestVersion = cache.npmLatestVersion;
    parsed.updateAvailable = cache.updateAvailable;
    parsed.versionCheckedAt = cache.versionCheckedAt;
    parsed.installedMuxameter = cache.installedMuxameter;
    parsed.remoteMuxameter = cache.remoteMuxameter;
    parsed.updateClass = cache.updateClass;
    const tmpPath = `${bridgeJsonPath}.tmp`;
    await writeFile(tmpPath, JSON.stringify(parsed, null, 2), 'utf-8');
    await rename(tmpPath, bridgeJsonPath);
    log('npm-version.rmw.applied', {
      path: bridgeJsonPath,
      updateAvailable: cache.updateAvailable,
    });
  } catch (err) {
    log('npm-version.rmw.skip', {
      error: err instanceof Error ? err.message.slice(0, 200) : String(err),
    });
  }
}

// Boot entry — one deferred check + the 6h interval, both unref'd (never hold the
// process open). The caller supplies the bridge.json path (no import cycle with
// bridgeMetadata — it imports THIS module for the composer leg).
export function startNpmVersionWatch(
  currentVersion: string,
  bridgeJsonPath: string,
  perScpPaths?: () => string[],
): void {
  // THE ROSE SEED (the two-wound synthesis · the pruned pattern: a local truth gated behind
  // a remote success): the installed counters are a grandparent-package.json read — seeded
  // HERE unconditionally, so EVERY composer write carries them from boot (curing the
  // pong-re-snapshot overwrite class, not just the boot instance); the remote check merely
  // refreshes the same field on success.
  cache.installedMuxameter = getBridgeMuxameter();
  const runOnce = async (): Promise<void> => {
    // D-RD1 · the fresh re-read each tick: a no-restart install (the scp-classed path)
    // replaces the on-disk package while this process runs — the cached counters would
    // report the OLD install until restart. The fresh read keeps the sovereign copies
    // honest within one watch tick.
    cache.installedMuxameter = getBridgeMuxameter(undefined, true) ?? cache.installedMuxameter;
    const before = cache.versionCheckedAt;
    await checkNpmLatestVersion(currentVersion);
    if (cache.versionCheckedAt !== before) {
      await applyVersionCheckToBridgeJson(bridgeJsonPath);
      // THE SOVEREIGN FAN-OUT (S6's structural finding: the per-SCP copies were composer-
      // leg-only — written pre-check, never RMW'd): the lazy getter enumerates the LIVE
      // sovereign paths at RMW time (SCPs registered after boot are covered); each RMW is
      // already failure-silent per-path.
      for (const p of perScpPaths?.() ?? []) {
        await applyVersionCheckToBridgeJson(p);
      }
    }
  };
  const bootTimer = setTimeout(() => {
    void runOnce();
  }, BOOT_DEFER_MS);
  bootTimer.unref?.();
  const interval = setInterval(() => {
    void runOnce();
  }, CHECK_INTERVAL_MS);
  interval.unref?.();
  log('npm-version.watch.started', { currentVersion, bridgeJsonPath });
}
