#!/usr/bin/env node
'use strict';

const path = require('node:path');
const fs = require('node:fs');
const net = require('node:net');
const os = require('node:os');
const { spawn, execFileSync } = require('node:child_process');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const DIST_MAIN = path.join(PROJECT_ROOT, 'dist', 'main', 'index.js');
const DIST_CLI = path.join(PROJECT_ROOT, 'dist', 'cli.cjs');

// C947 · THE ONE SHARED DERIVATION — bin/scsEnvironment.js is required by BOTH this
// launcher and the TS tree (workspaceSocket.model.ts re-exports it); the C416 by-hand
// inline mirror is retired. THE ENVIRONMENT CARRIER (`SCS_ENV`) is established in main()
// BEFORE these are read — they are functions, not constants, so the fold lands.
const scsEnvironment = require('./scsEnvironment.js');
function WORKSPACE_KEY() { return scsEnvironment.workspaceSingletonKey(); }
function SOCKET_PATH() { return scsEnvironment.csspSocketPath(); }

const ELECTRON_SUBCOMMANDS = new Set([
  'run',
  'show',
  'hide',
  'focus',
  'type',
  'press',
  'key',
  'kill',
  'status',
  'quit',
  'list',
  'open-url',
  'close-url',
  'focus-url',
  // SWFB · relay focus-by-id into the live electron-main via CSSP socket.
  'focus-by-id',
  // SES · THE STOP RAIL (C632) · relay close-by-id into the live electron-main
  // via CSSP socket → cli-handler case 'close-by-id' → closeWindowById. Closing
  // the SCP window cascades the full stop (surface→pending + SIGTERM + FSM).
  'close-by-id',
  'open-session',
  // SCS Install Epoch D1 · the install instance · explicit-command envelope
  // (JSON-via-argv) relayed to the running Electron main over the CSSP socket,
  // else fresh-spawns Electron detached. Mirrors open-session's relay/fallback.
  'open-install',
  'list-sessions',
  'sendMessage',
  // MVP-RC3 D2 · RRRRQ resize verb · relays `resize <ulid> <scalePct>` into the live
  // electron-main via the CSSP socket → cli-handler case 'resize' → BrowserWindow.setBounds.
  'resize',
  // C793 · SRH · the severed middle hop repaired — the C781 focus verb was wired at the
  // quality + spawn + Electron case ('focus-suite8-page') but never routed HERE, so the
  // subprocess died on an unknown command silently. Relays `focus-suite8-page <windowId>
  // <navUrl>` over CSSP (two-extra-args ride like 'resize <ulid> <scalePct>').
  'focus-suite8-page',
]);

function relayToRunningInstance(argv, onSuccess, onFailure) {
  if (process.platform !== 'win32' && !fs.existsSync(SOCKET_PATH())) {
    onFailure();
    return;
  }
  const client = net.createConnection(SOCKET_PATH());
  let buffer = '';
  client.on('connect', () => {
    const payload = JSON.stringify({ cmd: argv }) + '\n';
    client.write(payload);
  });
  client.on('data', (data) => {
    buffer += data.toString('utf8');
    if (buffer.includes('\n')) {
      process.stdout.write(buffer);
      client.end();
      onSuccess();
    }
  });
  client.on('error', () => {
    onFailure();
  });
  client.on('end', () => {
    onSuccess();
  });
}

// CSSPL · Clean-Stale-SingletonLock-on-PreSpawn · Chromium leaves a SingletonLock
// symlink at <userData>/SingletonLock with target `<hostname>-<pid>`. If the holder
// PID is dead but the symlink remains, the next Electron spawn fails
// requestSingleInstanceLock() in main/index.ts:15 and silently quits — no window
// appears. This sweep readlinks the symlink, checks PID liveness via `kill(pid, 0)`,
// and unlinks the stale symlink so the next spawn can acquire the lock cleanly.
function userDataDir() {
  const appName = 'scs-bridge';
  if (process.platform === 'darwin') {
    return path.join(os.homedir(), 'Library', 'Application Support', appName);
  }
  if (process.platform === 'win32') {
    const appData = process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming');
    return path.join(appData, appName);
  }
  const xdg = process.env.XDG_CONFIG_HOME || path.join(os.homedir(), '.config');
  return path.join(xdg, appName);
}

// C918 · LEG A · the C410 seam CURED: requestSingleInstanceLock keys on the PER-WORKSPACE
// userData (workspaces/<WORKSPACE_KEY>/ — main/index.ts setPath), but CSSPL + ALFH swept
// only the BASE dir — after a crash the REAL stale lock survived every sweep and the fresh
// Electron silently self-quit (the C917 "no recovery via the TUI"). Both sweeps now run
// against the workspace lock dir (the base dir kept as the pre-C410 legacy sweep).
// WORKSPACE_KEY() = the C947 shared derivation (sha1(cwd [+ \0 + SCS_ENV])[:12]).
function workspaceLockDir() {
  return path.join(userDataDir(), 'workspaces', WORKSPACE_KEY());
}

// C918 · pid-reuse impostor check — an ALIVE holder pid whose process command is NOT an
// scs-bridge Electron is a reused number, not a running bridge. Mirrors main/index.ts
// sweepStaleSingletonLock (the definitive pre-lock sweep); this launcher-side copy keeps
// stale-crash recovery working even when a fresh Electron is never reached.
function holderIsImpostor(pid) {
  if (process.platform === 'win32') return false;
  try {
    const command = execFileSync('ps', ['-p', String(pid), '-o', 'command='], {
      encoding: 'utf8',
      timeout: 2000,
    });
    return command.length > 0 && !/scs-bridge|[Ee]lectron/.test(command);
  } catch (_err) {
    return false; // cannot confirm → conservative: not an impostor
  }
}

function cleanStaleSingletonLockIn(lockDir) {
  try {
    const lockPath = path.join(lockDir, 'SingletonLock');
    if (!fs.existsSync(lockPath)) return;
    const target = fs.readlinkSync(lockPath);
    const m = target.match(/^(.+)-(\d+)$/);
    if (!m) return;
    const pid = parseInt(m[2], 10);
    if (!Number.isFinite(pid)) return;
    let alive = false;
    try {
      process.kill(pid, 0);
      alive = true;
    } catch (e) {
      alive = e && e.code === 'EPERM';
    }
    if (alive && holderIsImpostor(pid)) alive = false; // C918 · reused pid = stale
    if (!alive) {
      try {
        fs.unlinkSync(lockPath);
        try {
          fs.unlinkSync(path.join(lockDir, 'SingletonCookie'));
        } catch (_e) { /* ignore */ }
        try {
          fs.unlinkSync(path.join(lockDir, 'SingletonSocket'));
        } catch (_e) { /* ignore */ }
        console.error('[scs] CSSPL · cleaned stale SingletonLock (PID ' + pid + ') in ' + lockDir);
      } catch (err) {
        console.error('[scs] CSSPL · unlink failed:', err && err.message ? err.message : err);
      }
    }
  } catch (_err) {
    // best-effort · do not crash bin/scs.js
  }
}

function cleanStaleSingletonLock() {
  cleanStaleSingletonLockIn(userDataDir()); // pre-C410 legacy home (base dir)
  cleanStaleSingletonLockIn(workspaceLockDir()); // C410+ real lock home
}

// C847 · ALFH · Alive-Foreign-Holder guard. The Chromium SingletonLock lives in the
// MACHINE-GLOBAL userData — shared by EVERY workspace. CSSPL (below) cleans a DEAD
// holder; an ALIVE holder from ANOTHER workspace makes the fresh Electron fail
// requestSingleInstanceLock() and SILENTLY QUIT — no window, while the TUI has already
// minted the session 'allocated' (the C847 field wound: Run-Through-003's spawns died
// against Run-Through-002's living Electron; IE's sessions the same). This guard makes
// the refusal HONEST: name the holder, land the event in the workspace debug sink, and
// exit 1 — never the silent evaporation (the one-bridge-per-machine stop-gap made loud).
function aliveForeignSingletonHolder() {
  try {
    // C918 · the lock this workspace's Electron actually contends for lives in the
    // PER-WORKSPACE dir (C410). An alive TRUE holder there = OUR bridge is running but
    // its CSSP socket did not answer (hung anor mid-boot) — refuse honestly. An alive
    // IMPOSTOR (pid reuse) was already swept by cleanStaleSingletonLock before this runs.
    const lockPath = path.join(workspaceLockDir(), 'SingletonLock');
    if (!fs.existsSync(lockPath)) return null;
    const target = fs.readlinkSync(lockPath);
    const m = target.match(/^(.+)-(\d+)$/);
    if (!m) return null;
    const pid = parseInt(m[2], 10);
    if (!Number.isFinite(pid)) return null;
    try {
      process.kill(pid, 0);
      return pid; // alive holder
    } catch (e) {
      return e && e.code === 'EPERM' ? pid : null;
    }
  } catch (_err) {
    return null;
  }
}

function appendDebugEvent(event, fields) {
  try {
    const sinkDir = path.join(process.cwd(), 'Cascades', 'Bridge', scsEnvironment.environmentSegment());
    fs.mkdirSync(sinkDir, { recursive: true });
    const line = JSON.stringify(Object.assign({ ts: new Date().toISOString(), event: event }, fields)) + '\n';
    fs.appendFileSync(path.join(sinkDir, 'debug.json'), line, 'utf8');
  } catch (_err) { /* best-effort — the sink must never break the launcher */ }
}

function spawnElectronDetached(argv) {
  if (!fs.existsSync(DIST_MAIN)) {
    console.error('[scs] dist/main/index.js missing — run `npm run build` first');
    process.exit(1);
  }
  let electronBin;
  try {
    electronBin = require('electron');
  } catch (err) {
    console.error('[scs] electron not installed — run `npm install`');
    process.exit(1);
  }
  cleanStaleSingletonLock();
  const foreignHolder = aliveForeignSingletonHolder();
  if (foreignHolder !== null) {
    const msg = '[scs] ALFH · an SCS-Bridge Electron (pid ' + foreignHolder + ') holds THIS workspace\'s singleton ' +
      'but its control socket did not answer (hung anor mid-boot) — a fresh Electron would silently self-quit. ' +
      'Quit that bridge (Cmd+Q anor kill ' + foreignHolder + ') and retry.';
    console.error(msg);
    appendDebugEvent('scs.launcher.alfh-refusal', { holderPid: foreignHolder, cwd: process.cwd(), argv: argv.slice(0, 2) });
    process.exit(1);
  }
  const child = spawn(electronBin, [PROJECT_ROOT, ...argv], {
    detached: true,
    stdio: 'ignore',
    env: process.env,
  });
  child.unref();
  process.exit(0);
}

function fallbackToLegacyCli(argv) {
  if (!fs.existsSync(DIST_CLI)) {
    console.error('[scs] dist/cli.cjs missing — run `npm run build`');
    process.exit(1);
  }
  require(DIST_CLI);
}

function main() {
  // C947 · THE ENVIRONMENT CARRIER — resolved ONCE here from `--name <Env>` ONLY (C1083: the
  // calling name is never a name — `scs-dev` is an npm link), stripped from argv, exported as SCS_ENV to the whole process
  // tree, and the N4 link applied (`<ENV>_SCS_*` → `SCS_*` for THIS tree only — a production
  // launch never sees a namespaced pin). Everything below (socket · lock · sinks) reads it.
  const resolved = scsEnvironment.resolveEnvironmentName(process.argv.slice(2));
  if (resolved.name) {
    process.env[scsEnvironment.ENV_VAR] = resolved.name;
    const linked = scsEnvironment.linkNamespacedVariables(resolved.name);
    console.error('[scs] environment · ' + resolved.name + ' · linked ' + (linked.length ? linked.join(', ') : 'no namespaced variables'));
  }
  const argv = resolved.argv;
  // The legacy CLI (dist/cli.cjs · commander) parses process.argv ITSELF — the strip must
  // land there too, or `--name` reaches commander as an unknown option.
  process.argv = [process.argv[0], process.argv[1], ...argv];
  const sub = argv[0];

  if (!sub || !ELECTRON_SUBCOMMANDS.has(sub)) {
    fallbackToLegacyCli(argv);
    return;
  }

  relayToRunningInstance(
    argv,
    () => process.exit(0),
    () => spawnElectronDetached(argv)
  );
}

main();
