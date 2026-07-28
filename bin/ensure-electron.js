#!/usr/bin/env node
'use strict';

// DF5 · ENSURE-ELECTRON · the scs-bridge postinstall.
//
// electron@42.7+ ships WITHOUT a postinstall script — npm installs the JS wrapper but
// never downloads the platform binary (dist/ absent), so a fresh `npm i -g scs-bridge`
// would yield a CLI that cannot spawn a single bridge window. Our own postinstall
// provably runs (the installed package's lifecycle), so THIS script is the guaranteed
// path: it runs electron's bundled install.js (cache-aware · @electron/get) when the
// binary is absent, then attempts the @electron/rebuild pass when that tool is present
// (the dev tree) and skips it silently when absent (end users — node-pty 1.1 ships
// N-API prebuilds, so the rebuild is belt-and-suspenders, not a requirement).
//
// TOLERANT BY LAW: this script NEVER fails the install (always exits 0). If the binary
// download fails (offline · proxy), `scs` reports the precise recovery command at spawn.

const path = require('node:path');
const fs = require('node:fs');
const { spawnSync } = require('node:child_process');

function electronDir() {
  try {
    return path.dirname(require.resolve('electron/package.json'));
  } catch (_err) {
    return null;
  }
}


// C850 · PSHX · the node-pty spawn-helper exec-bit mend. npm's tarball extraction drops
// the execute bit on node-pty's darwin prebuild `spawn-helper`; node-pty posix_spawnp's
// that helper to birth EVERY shell — without +x every PTY session dies with
// "posix_spawnp failed." (the Run-Through-004 field wound: allocated · no spawn). The
// mend chmods every prebuilt spawn-helper it can find. TOLERANT BY LAW — never fails.
function ensureSpawnHelperExecutable() {
  try {
    const ptyDir = path.dirname(require.resolve('node-pty/package.json'));
    const prebuilds = path.join(ptyDir, 'prebuilds');
    if (!fs.existsSync(prebuilds)) return;
    for (const plat of fs.readdirSync(prebuilds)) {
      const helper = path.join(prebuilds, plat, 'spawn-helper');
      try {
        if (fs.existsSync(helper)) {
          fs.chmodSync(helper, 0o755);
          console.log('[scs postinstall] PSHX · spawn-helper made executable: ' + helper);
        }
      } catch (_err) { /* per-platform best-effort */ }
    }
  } catch (_err) {
    // node-pty absent anor unresolvable — nothing to mend.
  }
}
ensureSpawnHelperExecutable();

function binaryPresent(dir) {
  try {
    const rel = fs.readFileSync(path.join(dir, 'path.txt'), 'utf8').trim();
    return rel.length > 0 && fs.existsSync(path.join(dir, 'dist', rel));
  } catch (_err) {
    return false;
  }
}

function main() {
  const dir = electronDir();
  if (!dir) {
    console.log('[scs postinstall] electron package not found — skipping binary ensure');
    return;
  }
  if (!binaryPresent(dir)) {
    console.log('[scs postinstall] electron binary absent — running electron install.js');
    const res = spawnSync(process.execPath, [path.join(dir, 'install.js')], {
      cwd: dir,
      stdio: 'inherit',
    });
    if (res.status !== 0 || !binaryPresent(dir)) {
      console.log(
        '[scs postinstall] electron binary download did not complete — ' +
          'run later: node ' + path.join(dir, 'install.js'),
      );
      return;
    }
    console.log('[scs postinstall] electron binary ready');
  }
  // The rebuild pass — dev-tree only (@electron/rebuild in devDependencies). End-user
  // installs skip silently; node-pty's N-API prebuilds carry the terminal sessions.
  try {
    require.resolve('@electron/rebuild/package.json');
  } catch (_err) {
    return;
  }
  const rebuild = spawnSync('npx', ['--no-install', 'electron-rebuild', '-f', '-w', 'node-pty'], {
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });
  if (rebuild.status !== 0) {
    console.log('[scs postinstall] node-pty rebuild skipped (prebuilds remain in effect)');
  }
}

try {
  main();
} catch (err) {
  console.log('[scs postinstall] ensure-electron error (non-fatal):', err && err.message);
}
process.exit(0);
