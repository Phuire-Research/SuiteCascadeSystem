// Diamond B-25-UX-fix3 (CD-110 DVSP · Dynamic-Version-Single-Point-of-Truth):
// Single source of bridge version — reads package.json at runtime so the
// banner display and scsBridgeVersion-passed-to-install-agent never drift
// from the actual binary version.
//
// Pre-fix: banner hardcoded `v0.24.0` at menu.ts:963 + menu.ts:1093 (8+ versions
// stale). scsBridgeVersion hardcoded `'0.34.1'` at two animatedTui.ts call sites.
// Both surfaced from user's test-006 forensic inspection (debug.log showed
// scsBridgeVersion:"0.34.1" while actual binary was v0.35.2).
//
// Pattern 4 Modulation: filesystem read at user cwd's parent of cli.cjs ·
// no Claude state probe.

import { readFileSync, realpathSync } from 'node:fs';
import * as path from 'node:path';

let cachedVersion: string | null = null;

// THE VERSIONING MUXAMETER · the two Demometers under the one Cascade Position. The
// GENERAL count = the npm version; each release increments cli anor scp per what changed
// (the Routine's mechanical classification). Monotonic integers — comparison is the whole
// verdict: remote.cli > installed.cli → the CLI update · remote.scp > installed.scp → the
// SCP Update circuit · both → both. null = the package.json predates the counters.
export type ScsMuxameter = { cli: number; scp: number };

let cachedMuxameter: ScsMuxameter | null | undefined;

// The Grandparent-Muxameter-Read — the SAME parse getBridgeVersion performs; zero new disk
// reads when both are consulted (each caches independently for the process lifetime).
// `fresh: true` bypasses the cache AND re-reads the file — the post-install probe: after
// `npm install -g scs-bridge` the ON-DISK grandparent package.json is the NEW release while
// this RUNNING process still is the old one; the fresh read names what a restart loads.
export function getBridgeMuxameter(cliPathOverride?: string, fresh = false): ScsMuxameter | null {
  if (!fresh && cachedMuxameter !== undefined) return cachedMuxameter;
  try {
    const rawPath = cliPathOverride ?? process.argv[1] ?? '';
    if (!rawPath) {
      cachedMuxameter = null;
      return cachedMuxameter;
    }
    let cliPath: string;
    try {
      cliPath = realpathSync(rawPath);
    } catch {
      cliPath = rawPath;
    }
    const pkgPath = path.resolve(path.dirname(cliPath), '..', 'package.json');
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf8')) as {
      version?: string;
      scsMuxameter?: { cli?: unknown; scp?: unknown };
    };
    const m = pkg.scsMuxameter;
    const parsed =
      m && typeof m.cli === 'number' && typeof m.scp === 'number'
        ? { cli: m.cli, scp: m.scp }
        : null;
    if (!fresh) cachedMuxameter = parsed;
    return parsed;
  } catch {
    if (!fresh) cachedMuxameter = null;
    return null;
  }
}

// The post-install fresh-disk version read (uncached sibling of getBridgeVersion) — the
// RESTART-REQUIRED derivation: freshVersion !== getBridgeVersion() ⇒ a newer CLI sits on
// disk awaiting the relaunch the user conducts.
export function getBridgeVersionFresh(cliPathOverride?: string): string {
  try {
    const rawPath = cliPathOverride ?? process.argv[1] ?? '';
    if (!rawPath) return 'unknown';
    let cliPath: string;
    try {
      cliPath = realpathSync(rawPath);
    } catch {
      cliPath = rawPath;
    }
    const pkgPath = path.resolve(path.dirname(cliPath), '..', 'package.json');
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf8')) as { version?: string };
    return pkg.version ?? 'unknown';
  } catch {
    return 'unknown';
  }
}

// Diamond B-25-UX-fix3 (CD-110 DVSP): read package.json once · cache for process lifetime.
// `process.argv[1]` is the cli.cjs path (e.g.,
// `/opt/homebrew/lib/node_modules/scs-bridge/dist/cli.cjs`); package.json is at
// its grandparent. Caches result · subsequent calls return cached value.
//
// Returns 'unknown' as last-resort fallback if package.json cannot be read.
// Optional `cliPathOverride` exists for tests.
export function getBridgeVersion(cliPathOverride?: string): string {
  if (cachedVersion !== null) return cachedVersion;
  try {
    const rawPath = cliPathOverride ?? process.argv[1] ?? '';
    if (!rawPath) {
      cachedVersion = 'unknown';
      return cachedVersion;
    }
    // Diamond B-25-UX-fix4 (CD-112 SRRP · Symlink-Realpath-Resolution-for-Package):
    // `process.argv[1]` is the SYMLINK path (e.g., /opt/homebrew/bin/scs OR
    // npm-link target), not the resolved real path. `path.dirname(symlink)` gives
    // the symlink's directory (e.g., /opt/homebrew/bin) where package.json does
    // NOT live. realpathSync resolves to the actual cli.cjs file (e.g.,
    // SuiteCascadeSystem/dist/cli.cjs OR <prefix>/lib/node_modules/scs-bridge/dist/cli.cjs)
    // whose grandparent IS the package.json's directory. Works for BOTH
    // `npm install -g` AND `npm link` development cases. (Suite 4 Green Issue A
    // audit · Lambda-verified: /opt/homebrew/bin/scs symlink → real path
    // SuiteCascadeSystem/dist/cli.cjs.)
    let cliPath: string;
    try {
      cliPath = realpathSync(rawPath);
    } catch {
      // realpathSync fails if file doesn't exist (test env) · fall back to raw
      cliPath = rawPath;
    }
    // dist/cli.cjs → package.json is one level up
    const pkgPath = path.resolve(path.dirname(cliPath), '..', 'package.json');
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf8')) as { version?: string };
    cachedVersion = pkg.version ?? 'unknown';
    return cachedVersion;
  } catch {
    cachedVersion = 'unknown';
    return cachedVersion;
  }
}

// Diamond B-25-UX-fix3: test-only · clears the cache so each test can probe
// fresh (production callers cache once for the process lifetime).
export function _resetBridgeVersionCacheForTesting(): void {
  cachedVersion = null;
}
