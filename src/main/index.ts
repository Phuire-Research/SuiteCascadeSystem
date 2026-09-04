import * as path from 'node:path';
import * as net from 'node:net';
import { app, ipcMain, shell, clipboard, BrowserWindow } from 'electron';
import fixPath from 'fix-path';
import { sessionRegistry } from './session-registry';
import type { MouseForward, DomKeyForward } from '../shared/inputForward';
import { isScpSessionId, forwardScpMouse, forwardScpDomKey, getScpWebContents } from './scpInput';
import { createControlServer, SOCKET_PATH, workspaceSingletonKey } from './control-server';
import type { ControlServerHandle } from './control-server';
import { createCliHandler } from './cli-handler';
import { startRenderModeWatch, stopRenderModeWatch } from './renderModeWatch';
// F2 · quit-race cure · flush any pending async registry write before the process dies.
// F3 · root pin · pin the electron-side registry root to the daemon's junction regardless
// of cwd drift (setBridgeRootOverride imported from paths via registry's barrel is not
// available; import directly from paths).
import { flushRegistryWrites } from '../lib/bridge/registry';
import { setBridgeRootOverride } from '../lib/bridge/paths';
import { setScpShaderPaths } from './electronWindow';
import { installAppNavigationGuard, installScpContentSecurityPolicy } from './navigationGuard';
import { createTray, refreshTrayMenu, disposeTray } from './tray';
import { sdia } from './diagnostics';
import { markTearingDown } from './teardownFlag';
import type { Tray } from 'electron';

// Renderer-Log-Forwarding (RLF) · IPC bridge for window.scs.log() calls from
// the xterm renderer. Forwarded events land in the same unified log as
// main-process SDIA events (Cascades/Bridge/electron-debug.json · source='renderer').
// Allows full trace of terminal.ts lifecycle without requiring DevTools.
ipcMain.on(
  'scs:renderer-log',
  (
    _event,
    payload: { event?: string; data?: Record<string, unknown> } | undefined,
  ) => {
    if (!payload) return;
    sdia(payload.event ?? 'renderer.unknown', payload.data ?? {}, 'renderer');
  },
);

// PELB · Photonic-External-Link-Bridge · open a URL in the user's DEFAULT external browser
// (NOT inside the Electron BrowserWindow). The CadmiumBulletin renders instance-written Markdown
// whose links must escape the desktop shell. Invoked via window.scs.openUrl(url) (preload) →
// ipcRenderer.invoke('scs:open-url', url) → shell.openExternal. Mirrors the ipcMain.on RLF bearing
// above (async handle for the invoke round-trip).
ipcMain.handle('scs:open-url', async (_event, url: string) => {
  // PELB security: only ever hand http(s) URLs to the OS browser. Instance-written
  // Markdown could carry file:/javascript:/data: schemes — refuse anything that is
  // not a plain http(s) URL before it reaches shell.openExternal.
  if (typeof url !== 'string' || !/^https?:\/\//i.test(url)) {
    sdia('pelb.open-url.rejected', {
      scheme: typeof url === 'string' ? url.slice(0, 24) : typeof url,
    });
    return;
  }
  await shell.openExternal(url);
});

// SWRM · D1 Wave 5b · presenter keyboard forwarding. The shader-wrap presenter (the visible,
// OS-focused window) resolves a keydown to its terminal byte sequence and sends it here; route
// to the owning session's PTY (sendInput → pty.write). The offscreen xterm is display-only —
// CC re-renders the input and paints back through the shader. Deterministic PTY bytes, not
// sendInputEvent (the keyCode-0 / Shift+Tab dead-end). sessionId is validated against the registry.
ipcMain.on(
  'scs:input-key',
  (_event, payload: { sessionId?: string; data?: string } | undefined) => {
    if (!payload || typeof payload.sessionId !== 'string' || typeof payload.data !== 'string') return;
    // SWRM · SCP Input Wave · defensive: an SCP page is a DOM target, never a PTY — its keys ride
    // the 'scs:input-dom-key' channel below. Never let a 'scp-' id reach session.sendInput→pty.write.
    if (isScpSessionId(payload.sessionId)) return;
    const session = sessionRegistry.get(payload.sessionId);
    if (session) session.sendInput(payload.data);
  },
);

// SWRM · SCP Input Wave · DOM keyboard forwarding for the shaded SCP window. The SCP presenter
// (sessionId 'scp-<id>') ships the raw KeyboardEvent essentials; route to the offscreen SCP
// webContents as a keyDown + char(printable) + keyUp sendInputEvent triple (a DOM page, not a PTY).
ipcMain.on(
  'scs:input-dom-key',
  (_event, payload: { sessionId?: string; payload?: DomKeyForward } | undefined) => {
    if (!payload || typeof payload.sessionId !== 'string' || !payload.payload) return;
    forwardScpDomKey(payload.sessionId, payload.payload);
  },
);

// SWRM · D1 Wave 5c · presenter pointer forwarding (mouse + scroll). The presenter ships a
// normalized MouseForward payload; route to the owning session, which replays it onto the
// offscreen xterm via sendInputEvent — xterm runs its own mouse-mode / scrollback translation
// (full parity with a focused terminal). CRT-Flat = 1:1 coords; the geometric tier (D2)
// inverseWarp-s them first.
ipcMain.on(
  'scs:input-mouse',
  (_event, payload: { sessionId?: string; payload?: MouseForward } | undefined) => {
    if (!payload || typeof payload.sessionId !== 'string' || !payload.payload) return;
    // SWRM · SCP Input Wave · branch: a 'scp-' id targets the offscreen SCP webContents (DOM
    // hit-testing); everything else is a terminal session (UNCHANGED · xterm mouse-mode parity).
    if (isScpSessionId(payload.sessionId)) {
      forwardScpMouse(payload.sessionId, payload.payload);
      return;
    }
    const session = sessionRegistry.get(payload.sessionId);
    if (session) session.forwardMouse(payload.payload);
  },
);

// SWRM · MD-5 Wound A (COPY) · the presenter's Cmd+C ships only the sessionId — the selection lives
// in the OFFSCREEN window, so main reads it here and writes the system clipboard. Async: the read is
// an executeJavaScript round-trip, awaited before clipboard.writeText so it lands before the next
// keystroke. Branch on isScpSessionId: SCP reads the DOM selection; the terminal reads xterm's
// getSelection via the __scsGetSelection helper registered in terminal.ts. Empty selection = no-op.
ipcMain.on(
  'scs:copy-request',
  (_event, payload: { sessionId?: string } | undefined) => {
    if (!payload || typeof payload.sessionId !== 'string') return;
    const sessionId = payload.sessionId;
    void (async () => {
      try {
        let text = '';
        if (isScpSessionId(sessionId)) {
          const wc = getScpWebContents(sessionId);
          if (!wc) return;
          text = await wc.executeJavaScript('(window.getSelection && window.getSelection().toString()) || ""');
        } else {
          const session = sessionRegistry.get(sessionId);
          const win = session?.getWindow();
          if (!win || win.isDestroyed()) return;
          text = await win.webContents.executeJavaScript('window.__scsGetSelection ? window.__scsGetSelection() : ""');
        }
        if (typeof text === 'string' && text.length > 0) {
          clipboard.writeText(text);
          sdia('copy.request', { sessionId, textLength: text.length });
        } else {
          sdia('copy.request.empty', { sessionId });
        }
      } catch (err) {
        sdia('copy.request-FAIL', { sessionId, error: String(err) });
      }
    })();
  },
);

// PASTE LEG · the inverse twin of 'scs:copy-request'. The presenter ships only the sessionId;
// main reads the SYSTEM CLIPBOARD and delivers to the offscreen window. Terminal branch:
// executeJavaScript → __scsPaste (terminal.paste → bracketed-paste-safe → the same onData → PTY
// stream as typing — a multiline paste arrives as ONE paste, never Enter-firing char events).
// SCP branch: the offscreen SCP is a DOM page — webContents.paste() runs the native paste on its
// focused element. Local to each terminal window's load.
ipcMain.on(
  'scs:paste-request',
  (_event, payload: { sessionId?: string } | undefined) => {
    if (!payload || typeof payload.sessionId !== 'string') return;
    const sessionId = payload.sessionId;
    void (async () => {
      try {
        const text = clipboard.readText();
        if (typeof text !== 'string' || text.length === 0) {
          sdia('paste.request.empty-clipboard', { sessionId });
          return;
        }
        if (isScpSessionId(sessionId)) {
          const wc = getScpWebContents(sessionId);
          if (!wc) return;
          wc.paste();
          sdia('paste.request.scp', { sessionId, textLength: text.length });
        } else {
          const session = sessionRegistry.get(sessionId);
          const win = session?.getWindow();
          if (!win || win.isDestroyed()) {
            sdia('paste.request.skip', { sessionId, reason: 'no-offscreen-window' });
            return;
          }
          const delivered = await win.webContents.executeJavaScript(
            `window.__scsPaste ? window.__scsPaste(${JSON.stringify(text)}) : -1`,
          );
          sdia('paste.request', { sessionId, textLength: text.length, delivered });
        }
      } catch (err) {
        sdia('paste.request-FAIL', { sessionId, error: String(err) });
      }
    })();
  },
);

// DROP LEG · the presenter's Drop Area Overlay resolved absolute paths (preload
// webUtils.getPathForFile); quote each for the shell (single-quote wrap · embedded quotes
// escaped) and deliver through the SAME __scsPaste channel the clipboard leg rides — the path
// lands at the terminal cursor as typed-safe text. Terminal windows only (an SCP page has no
// cursor line to receive a path).
ipcMain.on(
  'scs:drop-paths',
  (_event, payload: { sessionId?: string; paths?: unknown } | undefined) => {
    if (!payload || typeof payload.sessionId !== 'string' || !Array.isArray(payload.paths)) return;
    const sessionId = payload.sessionId;
    const paths = payload.paths.filter((p): p is string => typeof p === 'string' && p.length > 0);
    void (async () => {
      try {
        if (paths.length === 0) {
          sdia('drop.paths.empty', { sessionId });
          return;
        }
        if (isScpSessionId(sessionId)) {
          sdia('drop.paths.skip', { sessionId, reason: 'scp-window' });
          return;
        }
        const session = sessionRegistry.get(sessionId);
        const win = session?.getWindow();
        if (!win || win.isDestroyed()) {
          sdia('drop.paths.skip', { sessionId, reason: 'no-offscreen-window' });
          return;
        }
        const quoted = paths
          .map((p) => (/[^A-Za-z0-9_\-./~]/.test(p) ? `'${p.replace(/'/g, `'\\''`)}'` : p))
          .join(' ');
        const delivered = await win.webContents.executeJavaScript(
          `window.__scsPaste ? window.__scsPaste(${JSON.stringify(quoted + ' ')}) : -1`,
        );
        sdia('drop.paths', { sessionId, count: paths.length, delivered });
      } catch (err) {
        sdia('drop.paths-FAIL', { sessionId, error: String(err) });
      }
    })();
  },
);

// SWRM · MD-5 Wound B (RESIZE) · the presenter forwards its new bounds; setSize the paired OFFSCREEN
// window so its source reflows (the GL surface above merely stretches the old-sized texture). The
// offscreen setSize fires a window.resize in its renderer: for the terminal that drives safeFit →
// pty.resize → SIGWINCH (the WRA chain, session.ts scheduleAutoFormatResumeRender precedent); for
// the SCP the DOM reflows natively. Branch on isScpSessionId to resolve the right offscreen window.
ipcMain.on(
  'scs:presenter-resize',
  (_event, payload: { sessionId?: string; width?: number; height?: number } | undefined) => {
    if (!payload || typeof payload.sessionId !== 'string') return;
    if (typeof payload.width !== 'number' || typeof payload.height !== 'number') return;
    const width = Math.max(1, Math.round(payload.width));
    const height = Math.max(1, Math.round(payload.height));
    if (isScpSessionId(payload.sessionId)) {
      const wc = getScpWebContents(payload.sessionId);
      if (!wc) return;
      const win = BrowserWindow.fromWebContents(wc);
      if (win && !win.isDestroyed()) win.setSize(width, height);
    } else {
      const session = sessionRegistry.get(payload.sessionId);
      const win = session?.getWindow();
      if (win && !win.isDestroyed()) win.setSize(width, height);
    }
  },
);

let controlServer: ControlServerHandle | null = null;
let tray: Tray | null = null;
let isQuitting = false;

// C410 · THE PPRR PROCESS HALF — scope the singleton PER WORKSPACE. Electron keys
// requestSingleInstanceLock on the userData path; the default (one shared dir) made every
// workspace CLI relay into the first CLI's Electron — closing that CLI closed EVERY
// workspace's SCP windows (the surviving CLI's detection was healthy; the ownership scope
// was the defect). A per-workspace userData gives each CLI its OWN lock + OWN Electron:
// closing one closes only its own windows. The stale-singleton relaunch law becomes
// per-workspace (a rebuild needs only the affected workspace's Cmd+Q). MUST run BEFORE
// requestSingleInstanceLock — the lock reads the path at call time.
const workspaceKey = workspaceSingletonKey();
app.setPath('userData', path.join(app.getPath('userData'), 'workspaces', workspaceKey));

// C918 · LEG A · THE PRE-LOCK STALE SWEEP — the definitive singleton hygiene, run in the
// ONE place that knows the real lock path (post-setPath · pre-requestSingleInstanceLock).
// THE C917 RECOVERY WOUND: a SIGTRAP death leaves workspaces/<key>/SingletonLock pointing
// at a dead pid; the next fresh Electron reads !gotLock → relays argv to a dead socket →
// quits SILENTLY — every TUI resurrection attempt evaporates. Chromium's own stale
// detection is defeated by PID REUSE (an unrelated process now owns the number) anor
// hostname drift. This sweep rules on BOTH: a dead holder is stale; an alive holder whose
// process command is NOT an scs-bridge Electron is a reuse impostor — also stale. A true
// alive holder is LEFT STANDING (the !gotLock relay below is then correct).
function sweepStaleSingletonLock(userDataPath: string): void {
  if (process.platform === 'win32') return; // win32 singleton is not symlink-based
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const fs = require('node:fs') as typeof import('node:fs');
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const cp = require('node:child_process') as typeof import('node:child_process');
    const lockPath = path.join(userDataPath, 'SingletonLock');
    if (!fs.existsSync(lockPath)) return;
    const target = fs.readlinkSync(lockPath);
    const m = target.match(/^(.+)-(\d+)$/);
    if (!m) return;
    const pid = parseInt(m[2], 10);
    if (!Number.isFinite(pid)) return;
    let stale = false;
    let reason = '';
    try {
      process.kill(pid, 0);
      // Alive — impostor check: pid reuse hands the number to an unrelated process.
      let command = '';
      try {
        command = cp.execFileSync('ps', ['-p', String(pid), '-o', 'command='], {
          encoding: 'utf8',
          timeout: 2000,
        });
      } catch {
        command = ''; // ps failed → cannot confirm ours → conservative: leave standing
      }
      if (command.length > 0 && !/scs-bridge|[Ee]lectron/.test(command)) {
        stale = true;
        reason = 'pid-reuse-impostor';
      }
    } catch {
      stale = true;
      reason = 'holder-dead';
    }
    if (!stale) return;
    for (const name of ['SingletonLock', 'SingletonCookie', 'SingletonSocket']) {
      try {
        fs.unlinkSync(path.join(userDataPath, name));
      } catch {
        /* absent anor already cleaned — proceed */
      }
    }
    sdia('main.singleton.stale-swept', { pid, reason, lockTarget: target });
  } catch (err) {
    sdia('main.singleton.sweep-FAIL', { error: String(err) });
  }
}
sweepStaleSingletonLock(app.getPath('userData'));

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  sdia('main.singleton.lock-denied-relay', { argv: process.argv.slice(2) });
  relayArgvToRunningInstance(process.argv.slice(2));
  app.quit();
  process.exit(0);
}
sdia('main.singleton.scope', {
  workspaceKey,
  workspaceCwd: process.cwd(),
  userData: app.getPath('userData'),
  socket: SOCKET_PATH,
});

function relayArgvToRunningInstance(argv: string[]): void {
  try {
    const client = net.createConnection(SOCKET_PATH);
    client.on('connect', () => {
      client.write(JSON.stringify({ cmd: argv }) + '\n');
    });
    client.on('data', () => {
      client.end();
    });
    client.on('error', () => {
      // socket unavailable; nothing further we can do from non-lock holder
    });
  } catch {
    // best-effort relay
  }
}

function getProjectRoot(): string {
  return app.getAppPath();
}

function getPreloadPath(): string {
  return path.join(getProjectRoot(), 'dist', 'preload', 'index.js');
}

function getRendererHtmlPath(): string {
  return path.join(getProjectRoot(), 'dist', 'renderer', 'index.html');
}

// SWRM · the presenter window's bundled HTML (the shader-wrap GL surface). Built by the
// vite renderer config's `presenter` rollup entry alongside index.html.
function getPresenterHtmlPath(): string {
  return path.join(getProjectRoot(), 'dist', 'renderer', 'presenter.html');
}

function defaultSessionFactory(_id: string) {
  // BRDH M135: inherit PATH via login shell wrapper; no hardcoded claude path.
  // Layer 1: login shell `-l` flag sources full profile chain for nvm/fnm/asdf paths.
  const shell = process.env.SHELL || (process.platform === 'win32' ? 'powershell.exe' : '/bin/zsh');
  if (process.platform === 'win32') {
    return {
      command: shell,
      args: [],
      cwd: process.cwd(),
      env: process.env,
    };
  }
  return {
    command: shell,
    args: ['-l'],
    cwd: process.cwd(),
    env: process.env,
  };
}

async function performQuit(): Promise<void> {
  if (isQuitting) return;
  isQuitting = true;
  // D-WC · raise the teardown flag BEFORE disposeAll() (which win.close()s every
  // window → fires each 'closed'). The per-window offline / return-to-pending
  // records skip while this is set — no registry storm, and no marking sessions
  // the relaunch will resume (boot-reset markAllSessionsOffline handles that path).
  markTearingDown();
  stopRenderModeWatch();
  // D-GTC · THE GRACEFUL TERMINAL CLOSE · flush every terminal's `claude` CLI transcript
  // BEFORE the hard reap. Each session's gracefulClose writes Ctrl-C (CC flushes on SIGINT,
  // ignores SIGTERM) then awaits the real pty onExit with a SIGKILL fallback. Bound the
  // whole fan-out with a hard cap (> the 5000ms per-pty grace window) so quit never hangs
  // even if a pty wedges. Runs BEFORE disposeAll() so transcripts land on disk first.
  try {
    await Promise.race([
      sessionRegistry.gracefulCloseAll(5000),
      new Promise<void>((resolve) => setTimeout(resolve, 6000)),
    ]);
  } catch (err) {
    console.error('[main] gracefulCloseAll failed (non-fatal · continuing quit):', err);
  }
  sessionRegistry.disposeAll();
  // C1015 · THE SCP-WINDOW SWEEP (the user's preventative ruling · the Salvo's L3 finding).
  //
  // THE GAP, MEASURED: `sessionRegistry.disposeAll()` iterates `this.sessions` — TERMINAL PTY
  // SESSIONS ONLY (`session-registry.ts:34-43`). It never touches the SCP window pair, which is
  // tracked in a structurally separate system (`urlWindowMap` / `scpPresenterMap` /
  // `scpPresenterByWinId` in electronWindow.ts) that NOTHING in src/main/ ever sweeps.
  //
  // AND THE CODE CLAIMED OTHERWISE: `session.ts:1047` says *"app-quit / turn-over closes EVERY
  // window via disposeAll"* — factually wrong for SCP windows. That comment is why the gap went
  // unseen; a wrong comment is worse than no comment, because it answers the question you were
  // about to ask.
  //
  // Until now SCP windows were closed only by Electron's IMPLICIT native window pass during
  // app.quit() — unowned, untimed, and untelemetered (no `will-quit` handler exists anywhere). We
  // close them OURSELVES, so their 'closed' handlers run on OUR schedule and release their cached
  // frames (C1015, electronWindow.ts) before the process dies.
  //
  // `close()`, NEVER `destroy()`: the SCP pair's teardown is BIDIRECTIONAL and rides the 'closed'
  // event — destroy() skips it and would strand the partner window (the Salvo's L2 ruling).
  try {
    for (const w of BrowserWindow.getAllWindows()) {
      if (!w.isDestroyed()) w.close();
    }
  } catch (err) {
    // A window that refuses to close must never wedge the quit — the implicit native pass still
    // runs behind us, so this sweep is an improvement on the floor, never a new gate.
    console.error('[main] SCP window sweep failed (non-fatal · continuing quit):', err);
  }
  // F2 · THE QUIT FLUSH · the class cure for the quit-race. disposeAll() above
  // win.close()s every window, which can enqueue async registry writes (the D-WC-1
  // session-offline leg on a last-window close). Await the registry writeChain tail
  // (bounded by a timeout so quit never hangs) so any pending readFile→writeFile→rename
  // completes on disk BEFORE the process dies. Since before-quit routes Cmd+Q through
  // performQuit too, this flush covers every quit path. Race the flush against an ~800ms
  // ceiling — a normal drain resolves in <1ms; the ceiling only guards a wedged write.
  try {
    await Promise.race([
      flushRegistryWrites(),
      new Promise<void>((resolve) => setTimeout(resolve, 800)),
    ]);
  } catch (err) {
    console.error('[main] flushRegistryWrites failed (non-fatal · continuing quit):', err);
  }
  if (controlServer) {
    try {
      await controlServer.close();
    } catch (err) {
      console.error('[main] controlServer.close failed:', err);
    }
    controlServer = null;
  }
  disposeTray();
  app.quit();
}

app.on('second-instance', (_event, argv) => {
  relayArgvToRunningInstance(argv.slice(2));
});

app.on('window-all-closed', () => {
  // ULT · Unified-Lifecycle-Termination · Window close kills the tray too.
  // (Supersedes prior EMPC "tray governs lifetime" pattern · user-locked
  // for release: closing the BrowserWindow exits Electron entirely.)
  void performQuit();
});

app.on('before-quit', (event) => {
  // ULT · capture Cmd+Q / app.quit() externals and route through performQuit
  // for clean controlServer + tray + session disposal. Re-fires `before-quit`
  // on inner app.quit() call · second pass has isQuitting=true and falls through.
  if (isQuitting) return;
  event.preventDefault();
  void performQuit();
});

// C670 · DMF2 S3-REV · the APP-LEVEL navigation guard (registered before any window is created,
// so it catches EVERY webContents — content window, subframes, presenter, terminals, future).
installAppNavigationGuard();

app.whenReady().then(async () => {
  if (process.platform === 'darwin') {
    app.dock?.hide();
  }

  // C672 · DMF2 S4 · the per-session CSP on the SCP document (session.defaultSession is only
  // available after whenReady). object-src 'none' + frame-src 'self' structurally block the
  // embedded external PDF; the whitelist keeps fonts/FA/WebSocket alive.
  installScpContentSecurityPolicy();

  // F3 · THE ROOT PIN · quit-race cure. Pin the electron-side registry root to the
  // daemon's junction BEFORE any registry read/write (the FLAP argv handler + tray +
  // window opens all touch it). The daemon threads its junction via SCS_BRIDGE_ROOT_OVERRIDE
  // (dev.ts:297 · installSpawn.ts) — prefer that authoritative env; else the electron
  // process's own cwd is the SAME userCwd that seeds startRenderModeWatch(process.cwd())
  // below (index.ts:314), so it is the correct fallback. bridgeRoot() appends Cascades/Bridge.
  // This closes the cwd-drift hazard (a stray dev-repo Cascades/Bridge/sessions.json is
  // live evidence the electron cwd can diverge from the daemon's).
  const userCwd =
    typeof process.env.SCS_BRIDGE_ROOT_OVERRIDE === 'string' &&
    process.env.SCS_BRIDGE_ROOT_OVERRIDE.length > 0
      ? process.env.SCS_BRIDGE_ROOT_OVERRIDE
      : process.cwd();
  setBridgeRootOverride(userCwd);

  // LCFPS · Launch-Context-Fix-Path-at-Startup (S6-named · canonical via fix-path npm)
  // Mutates process.env.PATH to include login-shell PATH so subsequent
  // pty.spawn(SHELL, ['-ilc', '...'], { env: process.env }) inherits
  // nvm/asdf/brew-augmented paths. Required for production user-population
  // whose claude lives in ~/.nvm/versions/node/v*/bin or ~/.asdf/shims.
  // No-op on Windows (fix-path returns early on win32).
  // Citation: node-pty issue #416 (WPAS root cause) · S6 §4.4 fix-path source
  // verbatim · S4 Angle 1 empirical verdict ABSENT.
  if (process.platform !== 'win32') {
    try {
      fixPath();
    } catch (err) {
      console.error('[main] fixPath() failed (non-fatal · continuing with inherited PATH):', err);
    }
  }

  // α-2 RESERVATION: Stratimux Muxium hosted in Electron main
  // EMSB · Electron-Main-Stratimux-Bootstrap
  // app.whenReady() → openHuirthMuxium() BEFORE CSSP socket bind
  // Sequence (α-2): 1. SessionRegistry.init (done) → 2. await createAndStartScsBridgeMuxium()
  //                  → 3. createControlServer (next) → 4. createTray
  // α-2 fills this in · α-1 leaves the call site reserved

  const handler = createCliHandler({
    preloadPath: getPreloadPath(),
    rendererHtmlPath: getRendererHtmlPath(),
    presenterHtmlPath: getPresenterHtmlPath(),
    defaultSessionFactory,
    onQuit: performQuit,
  });

  try {
    controlServer = await createControlServer(handler);
    console.log('[main] CSSP control server listening on', SOCKET_PATH);
  } catch (err) {
    console.error('[main] failed to start control server:', err);
  }

  // SWRM · D3 · arm the bridge.json render-mode watcher (the Watcher-Cascade-Pipe). Seeds the
  // shared mode from bridge.json.renderMode and live-swaps running terminals on change.
  try {
    startRenderModeWatch(process.cwd());
  } catch (err) {
    console.error('[main] failed to start render-mode watch:', err);
  }

  // SWRM · D5-extended · inject the presenter/preload paths for the SCP Shaded Window (opt-in
  // via SCS_SCP_SHADER_WRAP). No-op unless the flag is set when an SCP window opens.
  setScpShaderPaths(getPresenterHtmlPath(), getPreloadPath());

  try {
    tray = createTray({
      onQuit: () => {
        void performQuit();
      },
      onNewSession: () => {
        void handler({ cmd: ['run'] });
        if (tray) {
          refreshTrayMenu(tray, {
            onQuit: () => void performQuit(),
            onNewSession: () => void handler({ cmd: ['run'] }),
          });
        }
      },
    });
  } catch (err) {
    console.error('[main] failed to create tray:', err);
  }

  // FLAP · First-Launch-Argv-Processing · DSSP race fix.
  // When bin/scs.js spawns us with NO pre-existing CSSP socket, the command
  // (e.g., `open-url <url> --focus`) is passed as argv to the fresh Electron
  // process. Without this block the command is lost — only the SECOND
  // invocation (after the socket exists) actually opens a window, while the
  // first only produces a tray-icon-only state. Same handler used by
  // second-instance relays via CSSP — single dispatch surface.
  //
  // argv layout: [0]=electron binary · [1]=PROJECT_ROOT (Electron app path)
  //              · [2..]=command + args from bin/scs.js
  const initialArgv = process.argv.slice(2);
  if (initialArgv.length > 0) {
    console.log('[main] FLAP processing initial argv:', initialArgv);
    try {
      await handler({ cmd: initialArgv });
    } catch (err) {
      console.error('[main] FLAP failed to process initial argv:', err);
    }
  }

  console.log('[main] SCS Bridge α-1 substrate ready');
});

process.on('uncaughtException', (err) => {
  console.error('[main] uncaughtException:', err);
});
process.on('unhandledRejection', (reason) => {
  console.error('[main] unhandledRejection:', reason);
});

// D-GTC · route the CATCHABLE termination signals through the SAME graceful funnel as
// Cmd+Q / window-all-closed. `kill <bridge-pid>` (SIGTERM), Ctrl-C in a launching shell
// (SIGINT), and parent-hangup (SIGHUP) each performQuit → gracefulCloseAll flushes every
// terminal's CC transcript before the reap. performQuit's isQuitting guard makes repeated /
// overlapping signals safe. SIGKILL / power-loss is UNCATCHABLE and OUT OF SCOPE (RI backstop).
process.on('SIGTERM', () => void performQuit());
process.on('SIGINT', () => void performQuit());
process.on('SIGHUP', () => void performQuit());
