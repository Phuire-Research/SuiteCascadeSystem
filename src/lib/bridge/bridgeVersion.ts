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
