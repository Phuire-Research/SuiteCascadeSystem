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

export type NpmVersionCheck = {
  // The latest version published on npm · null = no successful check yet this run.
  npmLatestVersion: string | null;
  // true iff npmLatestVersion is numerically newer than the running bridge's version.
  updateAvailable: boolean;
  // Epoch-ms of the last SUCCESSFUL check · 0 = none yet.
  versionCheckedAt: number;
};

const REGISTRY_LATEST_URL = 'https://registry.npmjs.org/scs-bridge/latest';
const CHECK_TIMEOUT_MS = 6000;
const BOOT_DEFER_MS = 15_000;
const CHECK_INTERVAL_MS = 6 * 60 * 60 * 1000;

const cache: NpmVersionCheck = {
  npmLatestVersion: null,
  updateAvailable: false,
  versionCheckedAt: 0,
};

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
    const body = (await res.json()) as { version?: unknown };
    const latest = typeof body.version === 'string' ? body.version.trim() : '';
    if (latest === '') {
      log('npm-version.check.skip', { reason: 'no-version-field' });
      return getNpmVersionCheck();
    }
    cache.npmLatestVersion = latest;
    cache.updateAvailable = isVersionNewer(latest, currentVersion);
    cache.versionCheckedAt = Date.now();
    log('npm-version.check.ok', {
      latest,
      current: currentVersion,
      updateAvailable: cache.updateAvailable,
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
export function startNpmVersionWatch(currentVersion: string, bridgeJsonPath: string): void {
  const runOnce = async (): Promise<void> => {
    const before = cache.versionCheckedAt;
    await checkNpmLatestVersion(currentVersion);
    if (cache.versionCheckedAt !== before) {
      await applyVersionCheckToBridgeJson(bridgeJsonPath);
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
