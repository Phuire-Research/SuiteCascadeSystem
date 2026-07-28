import { contextBridge, ipcRenderer, webUtils } from 'electron';
import type { IpcRendererEvent } from 'electron';

// PMPH · Preload-Mediated-Port-Handshake (canonical Electron pattern per
// docs/tutorial/message-ports.md and S6 WebSearch verification).
// contextBridge cannot proxy MessagePort objects passed through callback
// arguments — the port arrives as a phantom proxy with API surface intact
// but no actual message delivery. The canonical fix: forward the port from
// preload to the renderer's main world via `window.postMessage`, which CAN
// transfer MessagePort instances across the context-isolation boundary.
// Renderer listens via `window.addEventListener('message', ...)` and pulls
// the port from `event.ports[0]`.
ipcRenderer.on(
  'scs:port',
  (event: IpcRendererEvent, payload: { sessionId: string } | undefined) => {
    const port = event.ports[0];
    if (!port) return;
    const sessionId = payload?.sessionId ?? 'unknown';
    try {
      window.postMessage({ type: 'scs:port', sessionId }, '*', [port]);
    } catch (err) {
      console.error('[preload] PMPH window.postMessage forward failed:', err);
    }
  },
);

contextBridge.exposeInMainWorld('scs', {
  platform: process.platform,
  // RLF · Renderer-Log-Forwarding · sends diagnostic events to main, which
  // writes to Cascades/Bridge/electron-debug.json alongside SDIA events.
  log(event: string, data?: Record<string, unknown>): void {
    try {
      ipcRenderer.send('scs:renderer-log', { event, data: data ?? {} });
    } catch {
      /* swallow · log must not crash renderer */
    }
  },
  // PELB · Photonic-External-Link-Bridge · open a URL in the user's default external browser.
  // The CadmiumBulletin (Vue) calls window.scs.openUrl(href) on intercepted article links so they
  // escape the Electron window. Routes to ipcMain.handle('scs:open-url') → shell.openExternal.
  openUrl(url: string): Promise<void> {
    return ipcRenderer.invoke('scs:open-url', url);
  },
  // SWRM · the Presenter frame channel. main forwards each offscreen `paint` bitmap (the
  // composited terminal) on 'osr:frame'; the presenter binds it as the shader uSource. A
  // NativeImage bitmap is a serializable Buffer (arrives renderer-side as a Uint8Array) — unlike
  // MessagePort it proxies fine through a contextBridge callback, so no PMPH window.postMessage
  // hack is needed. Registration is lazy: only the presenter window calls this, so the terminal
  // window never attaches the listener.
  onOsrFrame(cb: (bitmap: Uint8Array, width: number, height: number) => void): void {
    ipcRenderer.on(
      'osr:frame',
      (_event: IpcRendererEvent, bitmap: Uint8Array, width: number, height: number) => {
        try {
          cb(bitmap, width, height);
        } catch {
          /* swallow · a frame callback must not crash the presenter */
        }
      },
    );
  },
  // C492 · THE RASTER BLEEP — main announces a focus sweep; the presenter runs the classic
  // CRT power-cycle overlay (raster collapse → bright scanline → bloom) for the duration.
  onRasterBleep(cb: (ms: number) => void): void {
    ipcRenderer.on('scs:raster-bleep', (_event: IpcRendererEvent, ms: number) => {
      cb(typeof ms === 'number' && ms > 0 ? ms : 600);
    });
  },
  // D-GTC S5 · main announces the graceful terminal close (gracefulClose · \x03 flush window) →
  // the renderer paints a "Shutting Down…" overlay so the user sees the close, not a frozen term.
  onShuttingDown(cb: () => void): void {
    ipcRenderer.on('scs:shutting-down', () => cb());
  },
  // D-UP · THE STAND BY OVERLAY — main announces a primed manualMode spawn (registry standBy
  // marker): the renderer paints a "Stand By" notice while Claude Code boots + the directive
  // delivery is pending. Cleared by 'scs:stand-by-clear' (the FKIS delivery landing), by the
  // user's first input, anor a safety timeout — the overlay never blocks input.
  onStandBy(cb: () => void): void {
    ipcRenderer.on('scs:stand-by', () => cb());
  },
  onStandByClear(cb: () => void): void {
    ipcRenderer.on('scs:stand-by-clear', () => cb());
  },
  // SWRM · the live render-mode swap (D3 · the Watcher-Cascade-Pipe terminus). main posts
  // 'scs:renderMode' when bridge.json.renderMode changes; the presenter swaps the uMode uniform.
  onRenderMode(cb: (mode: string) => void): void {
    ipcRenderer.on('scs:renderMode', (_event: IpcRendererEvent, mode: string) => {
      try {
        cb(mode);
      } catch {
        /* swallow */
      }
    });
  },
  // C919 · THE FRAME GOVERNOR live swap — main posts 'scs:shaderFps' when bridge.json.shaderFps
  // changes (the renderMode Watcher-Cascade-Pipe idiom); the presenter re-gates its raf loop.
  onShaderFps(cb: (fps: number) => void): void {
    ipcRenderer.on('scs:shaderFps', (_event: IpcRendererEvent, fps: number) => {
      try {
        cb(fps);
      } catch {
        /* swallow */
      }
    });
  },
  // SWRM · D1 Wave 5b · the presenter learns which session it shades (main sends it on the
  // presenter's did-finish-load) so sendKey can route the keystroke to the right PTY.
  onPresenterInit(cb: (sessionId: string) => void): void {
    ipcRenderer.on('scs:presenter-init', (_event: IpcRendererEvent, payload: { sessionId?: string } | undefined) => {
      try {
        if (payload?.sessionId) cb(payload.sessionId);
      } catch {
        /* swallow */
      }
    });
  },
  // SWRM · D1 Wave 5b · interactive keyboard forwarding. The presenter (the visible,
  // OS-focused window) resolves a keydown to its terminal byte sequence and ships it here;
  // main routes to the owning session's PTY (sendInput → pty.write). The offscreen xterm is
  // display-only — CC, a raw-mode TUI, re-renders the input and paints back through the shader.
  // Deterministic bytes · sidesteps the sendInputEvent keyCode-0 / Shift+Tab dead-end.
  sendKey(sessionId: string, data: string): void {
    try {
      ipcRenderer.send('scs:input-key', { sessionId, data });
    } catch {
      /* swallow */
    }
  },
  // SWRM · D1 Wave 5c · pointer pass-through. The presenter forwards a normalized mouse/wheel
  // payload; main replays it onto the offscreen xterm via sendInputEvent (full mouse-mode parity).
  sendMouse(sessionId: string, payload: unknown): void {
    try {
      ipcRenderer.send('scs:input-mouse', { sessionId, payload });
    } catch {
      /* swallow */
    }
  },
  // SWRM · SCP Input Wave · DOM key forwarding for the shaded SCP window. The SCP presenter ships
  // the raw KeyboardEvent essentials; main maps them to a keyDown + char + keyUp sendInputEvent
  // triple on the offscreen SCP webContents (a DOM page consumes key events, not PTY bytes).
  sendDomKey(sessionId: string, payload: unknown): void {
    try {
      ipcRenderer.send('scs:input-dom-key', { sessionId, payload });
    } catch {
      /* swallow */
    }
  },
  // SWRM · MD-5 Wound A (COPY) · the presenter intercepts Cmd+C and asks main to read the OFFSCREEN
  // window's selection (xterm getSelection or SCP DOM getSelection) and write it to the system
  // clipboard. No text travels with the request — main owns the read. One channel parameterized by
  // sessionId serves both window classes (main branches on isScpSessionId).
  requestCopy(sessionId: string): void {
    try {
      ipcRenderer.send('scs:copy-request', { sessionId });
    } catch {
      /* swallow */
    }
  },
  // PASTE LEG · the presenter intercepts Cmd+V and asks main to read the SYSTEM CLIPBOARD and
  // deliver it to the offscreen window (__scsPaste → terminal.paste → bracketed-safe → PTY).
  // The inverse twin of requestCopy — no text travels with the request; main owns the read.
  requestPaste(sessionId: string): void {
    try {
      ipcRenderer.send('scs:paste-request', { sessionId });
    } catch {
      /* swallow */
    }
  },
  // DROP LEG · Electron ≥32 removed File.path — webUtils.getPathForFile is the sanctioned
  // resolver and MUST live in the preload (requiring webUtils in the renderer breaks bundlers).
  // Known caveat class: some versions resolve '' for drag/drop Files — the caller logs it.
  pathForFile(file: File): string {
    try {
      return webUtils.getPathForFile(file) ?? '';
    } catch {
      return '';
    }
  },
  // DROP LEG · the presenter ships the resolved absolute paths; main quotes + joins them and
  // delivers through the SAME __scsPaste channel the clipboard leg uses.
  sendDropPaths(sessionId: string, paths: string[]): void {
    try {
      ipcRenderer.send('scs:drop-paths', { sessionId, paths });
    } catch {
      /* swallow */
    }
  },
  // SWRM · MD-5 Wound B (RESIZE) · the presenter forwards its new bounds so main can setSize the
  // paired offscreen window — the GL surface stretches the texture, this reflows the source. The
  // offscreen window.resize then drives safeFit → pty.resize (terminal) or native DOM reflow (SCP).
  forwardResize(sessionId: string, width: number, height: number): void {
    try {
      ipcRenderer.send('scs:presenter-resize', { sessionId, width, height });
    } catch {
      /* swallow */
    }
  },
});
