// SWRM · D5-extended · the SCP Shaded Window (pixel half). The SCP page is an Electron
// BrowserWindow — so, exactly like the terminal (D1-D4), it can render OFFSCREEN and be presented
// through the REAL GLSL shader (full distortions: curvature + chroma + scanlines · not the CSS
// skin). "One Muxameter, two texture sources" — the only thing that changes vs the terminal is the
// source of the texture (the SCP webContents) and the input tier (DOM, not PTY · the next wave).
//
// This module is the pixel loop: offscreen SCP paint → presenter → ShaderWrap → present. Reuses
// presenter.html / presenter.ts / ShaderWrap unchanged (the renderer shades ANY source). Gated by
// electronWindow's SCS_SCP_SHADER_WRAP flag (default off) so the working SCP is never disturbed.
// Interactive input (mouse + inverseWarp, DOM keyboard) is the next wave — until then the shaded
// SCP is a non-interactive PREVIEW (flag off = the normal interactive SCP).

import { BrowserWindow, type NativeImage } from 'electron';
import { setLatestWindowFrame, clearLatestWindowFrame } from './windowOrchestrate';
import { wireDevToolsOnWindow } from './devToolsBinding';
import { attachRealCursorStyle, setRealCursorCombined } from './cursorOverlay.model';
import { getActiveScpRenderMode, getActiveShaderFps } from './session';
import { sdia } from './diagnostics';

const SCP_SHADER_FRAME_RATE = Number(process.env.SCS_SHADER_WRAP_FPS ?? 30);

/**
 * Create a presenter window that shades the given (offscreen) SCP window's paint frames through
 * the real GLSL. Returns the visible presenter; the caller shows it and owns both lifecycles.
 */
export function createScpPresenter(
  offscreenScpWin: BrowserWindow,
  presenterHtmlPath: string,
  preloadPath: string,
): BrowserWindow {
  const bounds = offscreenScpWin.getBounds();
  const presenter = new BrowserWindow({
    width: bounds.width,
    height: bounds.height,
    show: false,
    backgroundColor: '#000000',
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      nodeIntegration: false,
      // C674 · DMF2 S1-EXT: explicit hardening (parity with the content window).
      webSecurity: true,
      allowRunningInsecureContent: false,
      experimentalFeatures: false,
      webviewTag: false,
      // C674 · DMF2 S5: sandbox the renderer. The shared preload (src/preload/index.ts) uses ONLY
      // contextBridge/ipcRenderer/webUtils + DOM — all survive sandbox (Band 4 doc-verified) — and
      // contextIsolation stays true. presenter.html is a pure GL canvas (no Node in the renderer).
      sandbox: true,
      // SWRM: presenter rAF must not pause when unfocused
      backgroundThrottling: false,
    },
  });
  // THE REAL POINTER (the Authority Split): the SCP presenter's OS pointer is styled as the
  // Suite-Cascade wheel; the offscreen overlay's relay (wired by the caller) swaps its state.
  attachRealCursorStyle(presenter);
  // The boot-time combined state ('off' at create → the full brand mark from first paint).
  setRealCursorCombined(presenter, getActiveScpRenderMode() === 'off');
  wireDevToolsOnWindow(presenter);
  presenter.loadFile(presenterHtmlPath).catch((err) => {
    sdia('scp.presenter.load-FAIL', { error: String(err) });
  });

  try {
    offscreenScpWin.webContents.setFrameRate(SCP_SHADER_FRAME_RATE);
  } catch (err) {
    sdia('scp.osr.setFrameRate-FAIL', { error: String(err) });
  }

  let paintCount = 0;
  // C1016 · THE NAMED SUBSCRIPTION (the user's ruling: *"Remove the Individual Painter
  // Subscription"*). Hoisted out of the inline arrow so it can be removed BY REFERENCE. The prior
  // form used `removeAllListeners('paint')` from electronWindow.ts, which was correct today but
  // took EVERY paint listener on that webContents — including any Electron or a future component
  // might own. **A targeted removal cannot surprise a later reader; a blanket one can.**
  const onPaint = (_details: unknown, _dirty: unknown, image: NativeImage): void => {
    if (presenter.isDestroyed()) return;
    paintCount += 1;
    // D-N2 · Neon PlayTester · keep the CURRENTLY STREAMED pre-shader frame — scs_render_capture
    // returns THIS image (the render context PRIOR to the shader pass) without a repaint round-trip.
    setLatestWindowFrame(offscreenScpWin.id, image);
    const size = image.getSize();
    if (paintCount === 1 || paintCount % 120 === 0) {
      sdia('scp.osr.paint', { count: paintCount, w: size.width, h: size.height });
    }
    try {
      presenter.webContents.send('osr:frame', image.getBitmap(), size.width, size.height);
    } catch (err) {
      sdia('scp.osr.paint-FAIL', { error: String(err) });
    }
  };
  offscreenScpWin.webContents.on('paint', onPaint);

  // C1016 · THE TARGETED TEARDOWN, seated AT THE REGISTRATION SITE — the only scope where the
  // handler reference exists. `once` so it cannot double-fire.
  //
  // WHAT ACTUALLY LEAKS: `latestFrames` (windowOrchestrate.ts:45) is a MODULE-LEVEL
  // Map<number, NativeImage>. The webContents and its listeners die with the window on their own —
  // but that Map entry does NOT, so every SCP window that ever painted left a full bitmap resident
  // for the life of the main process. The terminal path has always released it (session.ts:592,
  // :1189 · the WRA-DARK marker); the SCP path never did. **Clearing the frame is the cure; removing
  // the listener is hygiene.**
  offscreenScpWin.once('closed', () => {
    try {
      // Guard: a destroyed webContents has already dropped its listeners — removing again would
      // throw, and a teardown that throws is worse than one that no-ops.
      if (!offscreenScpWin.isDestroyed()) {
        offscreenScpWin.webContents.removeListener('paint', onPaint);
      }
    } catch {
      /* nothing to remove — the contents went with the window */
    }
    clearLatestWindowFrame(offscreenScpWin.id);
  });

  presenter.webContents.on('did-finish-load', () => {
    try {
      // sessionId namespaced 'scp-<id>' so the (next-wave) input IPC can distinguish SCP windows
      // from terminal sessions. inputMode 'dom' tells the presenter to forward DOM events (wave 2).
      presenter.webContents.send('scs:presenter-init', { sessionId: 'scp-' + offscreenScpWin.id });
      presenter.webContents.send('scs:renderMode', getActiveScpRenderMode());
      // C919 · hydrate the frame governor beside the mode (bridge.json.shaderFps · default 24).
      presenter.webContents.send('scs:shaderFps', getActiveShaderFps());
      sdia('scp.osr.presenter-ready', { id: offscreenScpWin.id, mode: getActiveScpRenderMode() });
    } catch (err) {
      sdia('scp.osr.presenter-mode-FAIL', { error: String(err) });
    }
  });

  return presenter;
}
