/**
 * electronWindow · Diamond 1 · SCP-Window-via-Electron
 *
 * URL-keyed BrowserWindow lifecycle for the SCS Bridge. Replaces the OS-default
 * browser tab opener (browserTab.ts) for SCP URLs routed through CSSP. This
 * module is pure Electron-main-process — no Stratimux, no PTY, no preload, no
 * MessageChannelMain. The CSSP cli-handler 'open-url' / 'close-url' / 'focus-url'
 * cases call into here.
 *
 * EWHM — Electron-Window-Handle-Map keyed by URL string (CSCB §3.1 exact equality
 * matching; no normalization). URL string is the EWHM key — caller is responsible
 * for consistent formatting.
 *
 * Citation: DIAMOND-1-R3-OCHRE-BLUEPRINT.md §2 · DIAMOND-1-R4-VIRIDIAN-AUDIT.md
 * Citation: FOUNDATION-CSCB-DOCTRINE.md §3.1
 */

import { clearLatestWindowFrame } from './windowOrchestrate';
import { BrowserWindow } from 'electron';
import { existsSync } from 'node:fs';
import type { ShaderRenderMode } from '../shared/shaderRenderMode';
import { wireDevToolsOnWindow } from './devToolsBinding';
import { attachHiFiCursor, attachRealCursorStyle, wireCursorStateRelay, setCursorOverlayEnabled, setRealCursorCombined } from './cursorOverlay.model';
import { createScpPresenter } from './scpPresenter';
import { getActiveScpRenderMode } from './session';
import { sdia } from './diagnostics';
import { attachScpClientLogCapture } from './scpClientLogs';
import { isTearingDown } from './teardownFlag';
import { getActiveScsBridgeMuxiumHandle } from '../lib/bridge/scsBridgeMuxium';
// F1 · the cross-process closure record. When the SCP window lives in a SEPARATE
// electron process (no same-process Muxium handle), the direct dispatch is dead;
// record the closure into sessions.json instead → the daemon watcher consumes it.
import { recordScpWindowClosureSync } from '../lib/bridge/registry';
// M2 · WINDOW-RENDERED (D-WR C628) · the RENDERED-moment SCPs.json write. Fired at the SAME
// fire-once did-finish-load show moment as M1 (window truly painted, not merely bound). The helm's
// focus round gates on this instead of on windowId presence — closing the moments gap.
import { setScpWindowRendered } from '../lib/bridge/scpSessionRegistry';

const urlWindowMap = new Map<string, BrowserWindow>();
// SWRM · D5-extended · the visible presenter per shaded SCP window (url → presenter). When
// shader-wrap is on, urlWindowMap holds the OFFSCREEN SCP window (the render source) and this
// holds the VISIBLE presenter; show/focus/close operate on the presenter.
const scpPresenterMap = new Map<string, BrowserWindow>();
// C307 (the offscreen-surface leak): win.id → its presenter. The REGISTRY must bind the
// VISIBLE surface — registering the offscreen source id made every focus/orchestrate/show
// surface Electron's 'No content under offscreen mode' shell instead of the presenter.
const scpPresenterByWinId = new Map<number, BrowserWindow>();

// The id every external binder (SWFB registry · PlayTester targets) should store: the
// presenter when shader-wrapped, else the window itself.
export function getVisibleScpWindowId(winId: number): number {
  const p = scpPresenterByWinId.get(winId);
  return p && !p.isDestroyed() ? p.id : winId;
}

// C795 · THE PRESENTER-BLIND loadURL CURE · the reverse of getVisibleScpWindowId. The
// scpPresenterByWinId map keys the OSR SOURCE id → its VISIBLE presenter (the value). A
// caller that resolved the VISIBLE window (e.g. focus-suite8-page's url-window fallback,
// which returns the presenter) must NEVER loadURL against it — that REPLACES presenter.html
// and kills the shader while the offscreen source keeps painting unacked. Given a window id,
// if it IS a presenter (scan the map VALUES for .id === id) return the matching KEY (the OSR
// SOURCE id whose webContents actually renders the SCP); else null (not a presenter · nav it
// directly). The presenter is FOCUSED/SHOWN, the source is NAVIGATED — the two-window split law.
export function getOsrSourceIdForPresenter(presenterId: number): number | null {
  for (const [sourceId, presenter] of scpPresenterByWinId) {
    if (presenter.id === presenterId && !presenter.isDestroyed()) {
      return sourceId;
    }
  }
  return null;
}

// SWRM · D5-extended · Fuchsia Trifurcation diagnosis (3 instrument reads · pids 59341/65167/74404):
// SCS_SHADER_WRAP read "1" on EVERY pass (it is shell-profile-exported · always present) while
// SCS_SCP_SHADER_WRAP read "(unset)" on every pass — the two-flag dance is the LOSSY branch (a
// structural env-coupling gap, not user error). GAINY promotion: couple the SCP gate to the
// terminal flag, which provably reaches every process via dev.ts childEnv's `...process.env` spread.
// Install Epoch recurse (Blank-Test-003, user-directed): the SCP window joins the terminal at
// DEFAULT ON — the Branded Means is the point of entry for EVERY window. This intentionally
// brings the SCP INPUT WAVE (70bc300 · scs:input-dom-key + forwardScpMouse + warpPoint +
// webContents.focus) into live duty — its deferred user smoke runs the moment a shaded SCP is
// clicked/typed. Opt-out: SCS_SCP_SHADER_WRAP=0 (the raw interactive SCP, no presenter split).
const SCS_SCP_SHADER_WRAP = process.env.SCS_SCP_SHADER_WRAP !== '0';

// the presenter HTML + preload paths, injected at boot by index.ts (avoids a project-root import).
let scpShaderPaths: { presenterHtmlPath: string; preloadPath: string } | null = null;
export function setScpShaderPaths(presenterHtmlPath: string, preloadPath: string): void {
  scpShaderPaths = { presenterHtmlPath, preloadPath };
}

export interface OpenUrlWindowOptions {
  url: string;
  focus?: boolean;
  width?: number;
  height?: number;
  title?: string;
  // N-1b · names the renderer client-logs file per-SCP (`<scpName>-client-logs.json`).
  scpName?: string;
}

export function openUrlWindow(opts: OpenUrlWindowOptions): BrowserWindow {
  const { url, focus = true, width = 1200, height = 700, scpName } = opts;
  const title = opts.title ?? ('SCS · ' + url);

  const existing = urlWindowMap.get(url);
  if (existing) {
    if (!existing.isDestroyed()) {
      if (focus) {
        existing.show();
        existing.focus();
        existing.moveTop();
      } else {
        existing.showInactive();
      }
      return existing;
    }
    urlWindowMap.delete(url);
  }

  // Presenter-asset existence guard (mirrors session.ts SWRM · commit 6b5ea32). A partial build
  // (`npm run build` rimrafs dist + rebuilds main only — presenter.html is emitted by
  // `build:renderer`/`build:all`) leaves scpShaderPaths SET but the file GONE → forcing OSR with
  // nothing to present ERRORS the offscreen render on the SCP/SCS-Bridge window. Fall back to the
  // raw interactive (direct-render) window + a loud one-shot sdia so a stripped renderer is
  // diagnosable in seconds instead of an opaque OSR error.
  const presenterExists =
    scpShaderPaths !== null && existsSync(scpShaderPaths.presenterHtmlPath);
  if (SCS_SCP_SHADER_WRAP && scpShaderPaths !== null && !presenterExists) {
    sdia('scpwindow.presenter-MISSING', {
      url,
      path: scpShaderPaths.presenterHtmlPath,
      fallback: 'direct-render',
      hint: 'run `npm run build:all` — `npm run build` alone strips dist/renderer',
    });
  }
  const shaderWrap = SCS_SCP_SHADER_WRAP && presenterExists;
  // S4+S7 instrument · the next run's electron-debug.json will show definitively whether the
  // shader path fired and with what flag state (the SCP window can open in a detached child whose
  // env may lack SCS_SCP_SHADER_WRAP — this proves which process/flag actually reached here).
  sdia('scp.window.open', {
    url,
    flag: process.env.SCS_SCP_SHADER_WRAP ?? '(unset)',
    // compare against the terminal flag (which provably reaches the working terminal). If THIS is
    // also unset here, this process (likely the detached `scs open-url` child) inherits no env →
    // the fix is to propagate/config-drive, not the env. If it's set, the launch just lacked the SCP flag.
    terminalFlag: process.env.SCS_SHADER_WRAP ?? '(unset)',
    hasPaths: scpShaderPaths !== null,
    shaderWrap,
    pid: process.pid,
    argv: process.argv.slice(1, 4),
  });

  const win = new BrowserWindow({
    width,
    height,
    backgroundColor: '#1a1a1a',
    show: false,
    title,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      // C668 · DMF2 S1 · EXPLICIT HARDENING (intent-explicit — each is an Electron default TODAY,
      // asserted on the ONE window that loads a localhost SCP page so a future default shift or a
      // copy-paste cannot silently loosen it): same-origin + CSP honored (webSecurity), no
      // insecure-content upgrade path, no experimental web platform features, no <webview> embedding.
      webSecurity: true,
      allowRunningInsecureContent: false,
      experimentalFeatures: false,
      webviewTag: false,
      // C674 · DMF2 S5: explicit sandbox on the ONE window that loads a localhost SCP page (it has
      // NO preload, so this is the E20+ default made auditable — the meaningful sandbox coverage).
      sandbox: true,
      // SWRM · D5-extended · ON → the SCP page renders OFFSCREEN (the shader source); the
      // presenter is the visible window. OFF → unchanged (a normal visible SCP window).
      // paintWhenInitiallyHidden: a show:false offscreen window must paint while hidden (the
      // terminal's loadFile auto-starts; a loadURL/SSR page needs this + startPainting · S6 WebSearch).
      ...(shaderWrap ? { offscreen: true, paintWhenInitiallyHidden: true } : {}),
      // SWRM: offscreen source must keep painting/dispatching when unfocused
      backgroundThrottling: false,
    },
  });

  if (!shaderWrap) wireDevToolsOnWindow(win);
  // N-1 · Neon PlayTester · capture the SCP renderer console → Bridge/client-logs.json (both shader-offscreen
  // + flat modes). Makes the SCP client console — invisible all session — file-capturable for the turn-over.
  attachScpClientLogCapture(win, 'scp', scpName);
  // THE AUTHORITY SPLIT: a shader-wrapped SCP renders OFFSCREEN — the virtual pointer attaches
  // REDACTED + relaying (the band ring + state move to the presenter's real pointer). A flat
  // (non-shaded) SCP is the visible window itself — it gets the styled real pointer directly.
  if (shaderWrap) {
    attachHiFiCursor(win, { redacted: true, stateRelay: true });
    // The boot-time initial state for the no-shader disable (per the live SCP mode at load).
    win.webContents.on('did-finish-load', () => {
      setCursorOverlayEnabled(win, getActiveScpRenderMode() !== 'off');
    });
  } else {
    attachRealCursorStyle(win);
  }
  win.loadURL(url);

  // C670 · DMF2 S3-REV: the navigation + window-open + <webview> guard is now APP-LEVEL
  // (installAppNavigationGuard · app.on('web-contents-created') in index.ts) so it covers EVERY
  // webContents — this content window, its SUBFRAMES (the C670 embed-PDF field gap), the presenter,
  // and the terminal windows — which the former per-window S2/S3 here could not reach. Removed.

  // GITM D1 · THE TURN-OVER RECOVERY (the Electron wound · GITM-D1-S4-GREEN-AUDIT.md): the
  // Bridge Turn Over restarts the SCP server; the page's reconnect mechanism is a HARD
  // window.location.reload() (the client state rides localStorage). In Electron that reload
  // can RACE the restart — a failed load lands the webContents on the internal error page
  // SILENTLY, the paint stalls, the presenter freezes. The guard: on did-fail-load (skipping
  // ERR_ABORTED -3 — user navigation, not server failure), probe the SCP until it answers
  // (the HPRD readiness doctrine · SB-A1-D2 lineage), then loadURL(url) fresh — NOT reload()
  // (after a failed load the current URL is the error page). One probe in flight at a time.
  let turnOverProbeActive = false;
  win.webContents.on('did-fail-load', (_event, errorCode) => {
    if (errorCode === -3) return; // ERR_ABORTED
    // M5 · WINDOW-HOST TELEMETRY (D-WR C628 · the family unobservable in R7 · electron-debug.json
    // 24h stale). did-fail-load carries the errorCode so a failed first load (server-not-yet-serving)
    // is directly visible in the sink instead of inferred from the booting→ssr silence gap. Emitted
    // BEFORE the in-flight guard so EVERY fail is recorded (the guard only culls the probe re-entry).
    sdia('scp.window.did-fail-load', { url, winId: win.id, errorCode });
    if (turnOverProbeActive || win.isDestroyed()) return;
    turnOverProbeActive = true;
    sdia('scp.osr.did-fail-load', { url, errorCode });
    const startedAt = Date.now();
    const BUDGET_MS = 60_000;
    const probe = (): void => {
      if (win.isDestroyed()) { turnOverProbeActive = false; return; }
      if (Date.now() - startedAt > BUDGET_MS) {
        turnOverProbeActive = false;
        sdia('scp.osr.turnover-recovery-TIMEOUT', { url });
        return;
      }
      fetch(url, { method: 'GET' })
        .then((res) => {
          if (res.ok) {
            turnOverProbeActive = false;
            sdia('scp.osr.turnover-recovery-reload', { url, afterMs: Date.now() - startedAt });
            if (!win.isDestroyed()) void win.webContents.loadURL(url);
          } else {
            setTimeout(probe, 500);
          }
        })
        .catch(() => { setTimeout(probe, 500); });
    };
    setTimeout(probe, 500);
  });

  if (shaderWrap) {
    // S6 WebSearch fix · offscreen loadURL pages do not auto-start the paint loop while hidden —
    // explicitly start it once the page commits so the presenter receives frames.
    win.webContents.on('did-finish-load', () => {
      try {
        win.webContents.startPainting();
        // SWRM · SCP Input Wave · LOAD-BEARING: an offscreen window holds no OS focus, so Chromium
        // silently drops keyDown/keyUp sendInputEvent unless the webContents holds INTERNAL focus.
        // Assert it here so the DOM-key path (scpInput.forwardScpDomKey) actually reaches the page.
        win.webContents.focus();
        // OSR-FOCUS (R2 · S4∥S7→S6 WebSearch · SCS-OSR-FOCUS-R2-*.md): webContents.focus() routes
        // keystrokes but does NOT make the offscreen document "active" — so Chromium suppresses
        // :focus/:focus-visible rendering, the native caret, AND the JS focus/focusin event on the
        // forwarded-mouseDown path (the SCS-input border + the `|` both died on this single root).
        // CDP Emulation.setFocusEmulationEnabled simulates a focused AND active page → restores all
        // three. attach() throws if already attached, and did-finish-load re-fires on the turn-over
        // reload (:156), so guard on isAttached(); the override resets on navigation, so RE-SEND the
        // command every load. Non-fatal if it throws — keystrokes still route via focus() above.
        const dbg = win.webContents.debugger;
        if (!dbg.isAttached()) { dbg.attach('1.3'); }
        void dbg.sendCommand('Emulation.setFocusEmulationEnabled', { enabled: true });
        sdia('scp.osr.startPainting', { url, id: win.id, focused: true, focusEmulation: true });
      } catch (err) {
        sdia('scp.osr.startPainting-FAIL', { error: String(err) });
      }
    });
  }

  // SWRM · D5-extended · the visible surface = the presenter (shaded) when wrapped, else the SCP
  // window itself. Both close together; show/focus operate on the visible one.
  const presenter = shaderWrap
    ? createScpPresenter(win, scpShaderPaths!.presenterHtmlPath, scpShaderPaths!.preloadPath)
    : null;
  const visible = presenter ?? win;
  if (presenter) {
    scpPresenterMap.set(url, presenter);
    scpPresenterByWinId.set(win.id, presenter);
    // THE STATE RELAY: the offscreen SCP overlay's transitions drive the presenter's real pointer.
    wireCursorStateRelay(win, presenter);
  }

  // D-WC-2 · Window-Close Signal · fire-once guard. When shader-wrapped the user
  // closes the PRESENTER, whose 'closed' handler (:249) cross-closes THIS window →
  // win.on('closed') fires. When flat, the user closes THIS window directly. Either
  // way the signal lands here exactly once; the flag drops any second entry (dispose
  // ordering, double 'closed', etc.). Mirrors the D-WC-1 session.ts fire-once approach.
  let windowClosedSignalled = false;
  const signalScpWindowClosed = (): void => {
    if (windowClosedSignalled) return;
    windowClosedSignalled = true;
    // F2 THE GUARD TELEMETRY (window-close signal cure): EVERY early-return emits sdia. Silent
    // self-rejection is precisely what made this failure invisible (zero scp.window.closed.*
    // events) — the FailureNode Doctrine applies to guards too. Each skip carries its reason so
    // a live run diagnoses itself.
    // Skip during teardown: app-quit / turn-over closes EVERY window (the D-WC-1
    // guard) — a mass 'pending' storm is redundant (boot-reset re-derives lifecycle)
    // and racy against disposeAll. Only a genuine USER window close signals here.
    if (isTearingDown()) {
      sdia('scp.window.closed.skip', { reason: 'teardown', url, scpName: scpName ?? null });
      return;
    }
    if (scpName === undefined) {
      // no FSM key without a scpName (flat URL windows / masqueraded-name mis-bind)
      sdia('scp.window.closed.skip', { reason: 'no-scpName', url });
      return;
    }
    const handle = getActiveScsBridgeMuxiumHandle();
    if (handle === null) {
      // F1 · NO SAME-PROCESS MUXIUM — the SCP window lives in a SEPARATE electron
      // process (the proven no-handle mode). The direct dispatch is dead here; record
      // the closure into sessions.json instead. registry.ts chainWrite writes it via
      // the SAME writer that carries the D-WC-1 offline leg (proven live), and the
      // daemon-side scsBridgeJsonWatcher consumes it → dispatches scpLifecycleWindowClosed
      // → the surface cascades to 'pending'. F1 · QUIT-RACE CURE: SYNCHRONOUS write. The
      // SCP window is usually the LAST window → window-all-closed → performQuit → the
      // process dies BEFORE any async chainWrite tick completes (proven: zero
      // scpWindowClosures ever landed on disk). recordScpWindowClosureSync completes the
      // append+cap+atomic-write on THIS user-gesture call, so the record lands before quit.
      recordScpWindowClosureSync(scpName);
      sdia('scp.window.closed.file-signal', { url, scpName });
      return;
    }
    try {
      // Direct dispatch through the same-process handle — no socket, no watched file.
      // The guarded reducer (WindowClosed) no-ops unless fsm is ready|degraded, so a
      // benign close from booting/registered/gone is honest and self-rejecting.
      handle.muxium.dispatch(
        handle.muxium.deck.d.scp.d.scpLifecycle.e.scpLifecycleWindowClosed({
          scpName,
          closedAt: Date.now(),
        }),
      );
      // Server-Close Cure · SAME-PROCESS PARITY. Mirror the file-signal consume
      // (scpMessageRouter Stage 4): after WindowClosed flips the surface, kill the
      // SCP's dedicated child process. The 'exit' handler re-seats the row at
      // 'pending'. Both modes (same-process handle · separate-process file-signal)
      // now behave identically.
      handle.muxium.dispatch(
        handle.muxium.deck.d.scp.d.scpSpawnManager.e.scpSpawnManagerKillRequested({
          scpName,
        }),
      );
      sdia('scp.window.closed.lifecycle-pending', { url, scpName });
    } catch (err) {
      sdia('scp.window.closed.lifecycle-FAIL', { url, scpName, error: String(err) });
    }
  };

  win.on('closed', () => {
    signalScpWindowClosed();
    // C1015 · THE PREVENTATIVE (the user's ruling). The SCP path never released what the terminal
    // path always has — an ASYMMETRY, not an unknown mechanism: `session.ts:592` and `:1189` both
    // call clearLatestWindowFrame under the WRA-DARK marker, and this path simply never got it.
    //
    // WHAT LEAKS WITHOUT IT: `latestFrames` (windowOrchestrate.ts:45) is a module-level
    // Map<number, NativeImage>. Every painted frame is stored by window id, and the SCP path never
    // deletes its key — so EVERY SCP window that ever painted leaves a full bitmap resident for the
    // life of the main process. Removing the 'paint' listener first stops any in-flight frame from
    // re-populating the entry we are about to delete.
    //
    // WHY IT SHIPS EVEN THOUGH THE PROCESS-LEAK THESIS WAS REFUTED: the Salvo disproved that OSR
    // leaks RENDERER PROCESSES over minutes. It did NOT — and could not — disprove heap growth over
    // the EXTENDED sessions where the user measured ~10 GB. A snapshot cannot falsify a slow
    // accumulator. This costs two lines, changes nothing while a window lives, and mirrors a pattern
    // already proven in this codebase. **A cheap preventative beats a leak that only reveals itself
    // by breaking the user's trust in the application.**
    // C1016 · THE BLANKET REMOVAL IS GONE (the user's ruling). `removeAllListeners('paint')` took
    // EVERY paint listener on this webContents, not just ours. The removal now lives at the
    // REGISTRATION SITE (scpPresenter.ts) where the handler reference exists, removed BY REFERENCE.
    // This clear stays as the net: it is idempotent, and it also covers the NON-shader path, where
    // no presenter and no paint listener ever existed.
    clearLatestWindowFrame(win.id);
    urlWindowMap.delete(url);
    scpPresenterByWinId.delete(win.id);
    const p = scpPresenterMap.get(url);
    if (p && !p.isDestroyed()) p.close();
    scpPresenterMap.delete(url);
  });
  if (presenter) {
    presenter.on('closed', () => {
      // C1015 · the presenter holds no paint listener of its own (the offscreen source owns it),
      // but it CAN hold a cached frame keyed by its own id. Release it symmetrically.
      clearLatestWindowFrame(presenter.id);
      scpPresenterMap.delete(url);
      const w = urlWindowMap.get(url);
      if (w && !w.isDestroyed()) w.close();
    });
  }

  // M1 · SHOW-ON-RENDERED (D-WR C628 · R4 recommendation (c) · the blank-flash cure).
  // PRIOR: visible.show() fired UNCONDITIONALLY here at construction — before the page committed
  // or painted — so the show:false hid the window for microseconds then revealed the still-blank
  // #1a1a1a/#000000 surface (the "UnRendered window with no controls" the user reported). The
  // canonical Electron cure is win.once('ready-to-show', show), but ready-to-show is (a) absent
  // from this codebase and (b) ONE-SHOT — it does NOT re-fire on the D1 HPRD recovery loadURL, so
  // a failed first load (server-not-yet-serving) would never surface the window. The HPRD-correct
  // signal is `did-finish-load`, which RE-FIRES on the recovery reload (:221-223) and does NOT
  // fire on a FAILED load (that path emits did-fail-load :177). Defer the show to the FIRST
  // successful did-finish-load, fire-once (mirroring the windowClosedSignalled guard :257).
  //
  // SIGNAL CHOSEN — `win.webContents` did-finish-load in BOTH modes (flat + shader). `win` is the
  // SCP CONTENT window in every mode (flat: win IS visible; shader: win is the offscreen render
  // source whose did-finish-load fires startPainting :209-231, beginning the osr:frame stream the
  // presenter shows). The presenter's own loadFile HTML loads near-instantly; its brief #000000
  // fill is bounded by the source's did-finish-load, which is when real SCP pixels are about to
  // stream. So the honest "user sees the SCP" moment is the source's did-finish-load in both.
  let windowShown = false;
  let didFinishLoadCount = 0;
  const showRendered = (via: string): void => {
    if (windowShown || visible.isDestroyed()) return;
    windowShown = true;
    // Focus semantics preserved: a focus:true open focuses AFTER show (mirror the prior branch).
    if (focus) {
      visible.show();
      visible.focus();
      visible.moveTop();
    } else {
      visible.showInactive();
    }
    sdia('scp.window.shown', { url, winId: win.id, visibleId: visible.id, focus, via });
    // M2 · THE RENDERED PROJECTION WRITE. At the SAME fire-once rendered moment (this show),
    // stamp windowRenderedAt into SCPs.json so the helm's focus round gates on RENDERED (window
    // painted) not merely BOUND (windowId at construction). Name-guarded EXACTLY like setScpWindowId's
    // effectiveScpName guard (cli-handler :798) — an unknown-name flat window writes no rendered mark.
    // Fire-and-forget: the async chainWrite must not block the show.
    if (scpName !== undefined) {
      void setScpWindowRendered(scpName, Date.now()).catch((err) => {
        sdia('scp.window.rendered-write-FAIL', { url, scpName, error: String(err) });
      });
    }
  };
  win.webContents.on('did-finish-load', () => {
    // M5 · WINDOW-HOST TELEMETRY · every finish carries url + winId + fire count so the HPRD
    // recovery re-fire (which SHOWS on the first success, ignores later re-fires via windowShown)
    // is observable — the family that was unrecorded in R7.
    didFinishLoadCount += 1;
    sdia('scp.window.did-finish-load', {
      url,
      winId: win.id,
      count: didFinishLoadCount,
      firstShow: !windowShown,
    });
    showRendered('did-finish-load');
  });
  // R2 · FALLBACK SHOW (never-serving failsafe). If the server never serves within the HPRD
  // 60s budget (:186-189 turnover-recovery-TIMEOUT), a did-finish-load-gated show would leave the
  // window invisible forever — worse than the prior always-visible-blank. Show anyway after the
  // same budget so a permanently-broken SCP still surfaces a closable window. Guarded by
  // windowShown so a real render before the timeout wins and this becomes a no-op.
  const SHOW_FALLBACK_MS = 60_000;
  const fallbackShowTimer = setTimeout(() => {
    if (!windowShown && !visible.isDestroyed()) {
      sdia('scp.window.show-fallback-TIMEOUT', { url, winId: win.id });
      showRendered('fallback-timeout');
    }
  }, SHOW_FALLBACK_MS);
  // Clear the fallback timer if the window closes first (no dangling timer on a disposed window).
  win.once('closed', () => clearTimeout(fallbackShowTimer));

  urlWindowMap.set(url, win);
  return win;
}

export function closeUrlWindow(url: string): boolean {
  const win = urlWindowMap.get(url);
  if (!win || win.isDestroyed()) return false;
  win.close();
  return true;
}

export function focusUrlWindow(url: string): boolean {
  // SWRM · D5-extended · focus the VISIBLE surface — the presenter when shaded, else the window.
  const win = scpPresenterMap.get(url) ?? urlWindowMap.get(url);
  if (!win || win.isDestroyed()) return false;
  win.show();
  win.focus();
  win.moveTop();
  return true;
}

// SWFB · focus a BrowserWindow by its Electron windowId — deterministic
// "specific not last" refocus. Bypasses urlWindowMap (URL-key matching) by
// resolving the live window directly via BrowserWindow.fromId.
export function focusWindowById(id: number): boolean {
  const win = BrowserWindow.fromId(id);
  if (!win || win.isDestroyed()) return false;
  win.show();
  win.focus();
  win.moveTop();
  return true;
}

// SES · THE STOP RAIL WINDOW-CLOSE PRIMITIVE (C632 · Exit ability) — close a
// BrowserWindow by its Electron windowId. The sibling of focusWindowById; the
// same deterministic "specific not last" resolution (BrowserWindow.fromId), but
// win.close() instead of focus. This IS the honest full-stop entry: closing the
// SCP window fires the `win.on('closed')` handler (this file :323 →
// signalScpWindowClosed), which dispatches scpLifecycleWindowClosed (surface →
// pending) AND scpSpawnManagerKillRequested (SIGTERM the dedicated server +
// FSM dying→gone + re-seat). So the entire Stop Rail cascades from this one call.
// Returns true if a live window was found and .close()d, false otherwise.
export function closeWindowById(id: number): boolean {
  const win = BrowserWindow.fromId(id);
  if (!win || win.isDestroyed()) return false;
  win.close();
  return true;
}

export function listUrlWindows(): string[] {
  const alive: string[] = [];
  for (const [url, win] of urlWindowMap.entries()) {
    if (!win.isDestroyed()) alive.push(url);
  }
  return alive;
}

export function getUrlWindow(url: string): BrowserWindow | null {
  return urlWindowMap.get(url) ?? null;
}

// SWRM · the VISIBLE window for a URL — the presenter when shader-wrapped, else the offscreen source
// (mirror focusUrlWindow's resolution). Use for OS-window ops (show/focus/moveTop · e.g. the origin
// focus-restore); getUrlWindow gives the OFFSCREEN source, which renders "No content under offscreen
// mode" if .show()n directly under shader mode.
export function getVisibleUrlWindow(url: string): BrowserWindow | null {
  return scpPresenterMap.get(url) ?? urlWindowMap.get(url) ?? null;
}

// SWRM · SCP render-mode control · swap EVERY live SCP presenter to a new mode (the watcher calls
// this when bridge.json.scpRenderMode changes · the Terminal renderMode pattern fanned to ALL
// SCPs). A new SCP presenter seeds itself from getActiveScpRenderMode() at create (scpPresenter).
// Returns the number of presenters swapped (the watcher's Concluder).
export function setAllScpRenderMode(mode: ShaderRenderMode): number {
  let swapped = 0;
  for (const [url, presenter] of scpPresenterMap.entries()) {
    if (!presenter.isDestroyed()) {
      presenter.webContents.send('scs:renderMode', mode);
      swapped += 1;
    }
    // THE NO-SHADER DISABLE (the final cursor Diamond): 'off' stands the in-surface virtual
    // down on the paired SOURCE; any shaded mode re-enables it.
    const source = urlWindowMap.get(url);
    if (source) setCursorOverlayEnabled(source, mode !== 'off');
    // The COMBINED brand cursor on 'off' for the presenter (the real carries the full mark).
    if (!presenter.isDestroyed()) setRealCursorCombined(presenter, mode === 'off');
  }
  return swapped;
}

// C919 · THE FRAME GOVERNOR fan-out · re-gate EVERY live SCP presenter (the watcher calls this
// when bridge.json.shaderFps changes · the setAllScpRenderMode idiom). A new SCP presenter seeds
// itself from getActiveShaderFps() at create (scpPresenter). Returns the swapped count.
export function setAllScpShaderFps(fps: number): number {
  let swapped = 0;
  for (const presenter of scpPresenterMap.values()) {
    if (!presenter.isDestroyed()) {
      presenter.webContents.send('scs:shaderFps', fps);
      swapped += 1;
    }
  }
  return swapped;
}
