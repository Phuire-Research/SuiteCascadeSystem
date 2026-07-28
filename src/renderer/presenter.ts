// SWRM · D1 · the Presenter renderer. A full-window GL canvas that shades the offscreen
// terminal's composited frames. main forwards each offscreen `paint` bitmap over the
// 'osr:frame' IPC channel (preload → window.scs.onOsrFrame); the presenter binds it as the
// ShaderWrap source. D3 wires the live 'scs:renderMode' swap; D1 first-light is fixed to
// CRT Flat (a color-tier mode — NO warp, NO input remap — so the terminal stays clickable
// until D2 adds the geometric tier + inverseWarp pointer forwarding).

import { ShaderWrap } from './shaderWrap';
import {
  isShaderRenderMode,
  isGeometricMode,
  SHADER_RENDER_MODE_DEFAULT,
  type ShaderRenderMode,
} from '../shared/shaderRenderMode';
import type { MouseForward, MouseForwardModifier, DomKeyForward } from '../shared/inputForward';
import './scsGlobal';

function rlog(event: string, data?: Record<string, unknown>): void {
  try {
    window.scs?.log(event, data);
  } catch {
    /* swallow */
  }
}

// SWRM · D1 Wave 5b · a compact xterm-style keymap: a DOM KeyboardEvent → the terminal byte
// sequence CC (a raw-mode TUI) expects on the PTY. Returns null for keys we don't forward
// (modifier-only presses · app-level Cmd chords). 1:1 — no warp remap (geometric input = D2).
function keyEventToBytes(e: KeyboardEvent): string | null {
  const k = e.key;
  if (k === 'Shift' || k === 'Control' || k === 'Alt' || k === 'Meta' || k === 'CapsLock') return null;
  // Cmd/Win (meta) chords belong to the app shell, not the terminal.
  if (e.metaKey) return null;

  // Ctrl chords → C0 control bytes (Ctrl-A..Z → 0x01..0x1a, plus the bracket group).
  if (e.ctrlKey && !e.altKey && k.length === 1) {
    const lower = k.toLowerCase();
    const c = lower.charCodeAt(0);
    if (c >= 97 && c <= 122) return String.fromCharCode(c - 96);
    const ctrlMap: Record<string, string> = {
      '[': '\x1b', '\\': '\x1c', ']': '\x1d', '^': '\x1e', '_': '\x1f', ' ': '\x00',
    };
    if (ctrlMap[k] !== undefined) return ctrlMap[k];
  }

  switch (k) {
    case 'Enter': return '\r';
    case 'Backspace': return '\x7f';
    case 'Tab': return e.shiftKey ? '\x1b[Z' : '\t';
    case 'Escape': return '\x1b';
    case 'ArrowUp': return '\x1b[A';
    case 'ArrowDown': return '\x1b[B';
    case 'ArrowRight': return '\x1b[C';
    case 'ArrowLeft': return '\x1b[D';
    case 'Home': return '\x1b[H';
    case 'End': return '\x1b[F';
    case 'PageUp': return '\x1b[5~';
    case 'PageDown': return '\x1b[6~';
    case 'Delete': return '\x1b[3~';
    case 'Insert': return '\x1b[2~';
  }

  // Printable single char (respects shift for capitals/symbols). Alt = meta-sends-escape.
  if (k.length === 1) {
    return e.altKey ? '\x1b' + k : k;
  }
  return null;
}

rlog('presenter.module-load', { href: window.location.href });

const canvas = document.getElementById('present') as HTMLCanvasElement | null;

// C492/C493 · THE RASTER BLEEP — NO graphic warping (user spec): a BLACK OVERLAY fades
// transparent → opaque → transparent across the sweep, MASKING the physical up/down window
// transformation. On the black: the HiFi SPOTLIGHT (soft radial center light) + SNOW static —
// alive only around the full-down apex, gone as the terminal blooms back into focus.
let bleepRaf = 0;
let bleepOverlay: HTMLDivElement | null = null;
let bleepSnow: HTMLCanvasElement | null = null;
function ensureBleepOverlay(): HTMLDivElement {
  if (bleepOverlay && document.body.contains(bleepOverlay)) return bleepOverlay;
  const overlay = document.createElement('div');
  overlay.id = 'raster-bleep-overlay';
  overlay.style.cssText =
    'position:fixed;inset:0;background:#000;opacity:0;pointer-events:none;z-index:9999;';
  const snow = document.createElement('canvas');
  // C494 · MUCH FINER SNOW (user) — half-window resolution: the grain rides the pixel, not
  // the tile (the 160×120 stretch read as blocks).
  snow.width = Math.max(640, Math.floor(window.innerWidth / 2));
  snow.height = Math.max(480, Math.floor(window.innerHeight / 2));
  // C495 · visibility eased by 2/3 (user): the snow whispers.
  snow.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;opacity:0.06;';
  overlay.appendChild(snow);
  const spot = document.createElement('div');
  spot.style.cssText =
    'position:absolute;inset:0;background:radial-gradient(circle at 50% 44%,' +
    'rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.02) 28%, transparent 58%);';
  overlay.appendChild(spot);
  document.body.appendChild(overlay);
  bleepOverlay = overlay;
  bleepSnow = snow;
  return overlay;
}
function drawSnowFrame(): void {
  const snow = bleepSnow;
  const ctx2d = snow?.getContext('2d');
  if (!snow || !ctx2d) return;
  const img = ctx2d.createImageData(snow.width, snow.height);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const v = Math.random() * 255;
    d[i] = v; d[i + 1] = v; d[i + 2] = v; d[i + 3] = 255;
  }
  ctx2d.putImageData(img, 0, 0);
}
function runRasterBleep(ms: number): void {
  const overlay = ensureBleepOverlay();
  if (bleepRaf) cancelAnimationFrame(bleepRaf);
  const start = performance.now();
  const tick = (now: number): void => {
    const t = Math.min(1, (now - start) / ms);
    const opacity = Math.sin(Math.PI * t); // transparent → OPAQUE at the apex → transparent
    overlay.style.opacity = String(opacity);
    if (opacity > 0.35) drawSnowFrame(); // the snow lives only around full-down
    if (t < 1) {
      bleepRaf = requestAnimationFrame(tick);
    } else {
      overlay.style.opacity = '0';
      bleepRaf = 0;
    }
  };
  bleepRaf = requestAnimationFrame(tick);
}
window.scs?.onRasterBleep?.((ms: number) => runRasterBleep(ms));

// D-GTC S5 · THE SHUTTING-DOWN OVERLAY — main fires 'scs:shutting-down' at the top of
// gracefulClose (the \x03 flush window); paint a full-surface notice so the user sees the
// graceful close rather than a frozen terminal. One-way: it stays up until the window closes.
let shuttingDownShown = false;
function showShuttingDown(): void {
  if (shuttingDownShown) return;
  shuttingDownShown = true;
  const el = document.createElement('div');
  el.id = 'scs-shutting-down-overlay';
  el.setAttribute('aria-hidden', 'true');
  el.style.cssText = [
    'position:fixed', 'inset:0', 'display:flex', 'z-index:10000',
    'align-items:center', 'justify-content:center', 'pointer-events:none',
    'background:rgba(6,8,10,0.82)',
  ].join(';');
  const label = document.createElement('span');
  label.style.cssText = [
    "font-family:ui-monospace,'SF Mono','Menlo',monospace", 'font-size:15px', 'font-weight:700',
    'letter-spacing:0.1em', 'text-transform:uppercase', 'color:rgba(180,200,220,0.95)',
    'text-shadow:0 0 10px rgba(120,150,190,0.5)', 'padding:0.6rem 1.2rem',
  ].join(';');
  label.textContent = 'Shutting Down… flushing session';
  el.appendChild(label);
  document.body.appendChild(el);
}
window.scs?.onShuttingDown?.(() => showShuttingDown());

// D-UP · THE STAND BY OVERLAY — main fires 'scs:stand-by' for primed manualMode spawns
// ONLY (the Gitm Resolver's specific spawn pathing — no other spawning means reaches it):
// Claude Code boots for seconds after the first PTY byte and the directive delivery is
// still pending — this notice is the honest wait.
//
// D-UP4 (the spawn-failure hardening): the overlay is a FIXED, FULLY TRANSPARENT layer —
// no background paint, pointer-events:none — it NEVER interacts with the terminal draw
// beneath it. Cleared on: 'scs:stand-by-clear' (the delivery landing), the user's FIRST
// KEY PRESS (keydown only — a mouse click never clears it), anor the safety timeout.
const STAND_BY_SAFETY_MS = 25000;
let standByEl: HTMLDivElement | null = null;
let standByTimer = 0;
function clearStandBy(): void {
  if (standByTimer) { window.clearTimeout(standByTimer); standByTimer = 0; }
  if (!standByEl) return;
  standByEl.remove();
  standByEl = null;
  window.removeEventListener('keydown', clearStandBy, true);
}
function showStandBy(): void {
  if (standByEl) return;
  const el = document.createElement('div');
  el.id = 'scs-stand-by-overlay';
  el.setAttribute('aria-hidden', 'true');
  el.style.cssText = [
    'position:fixed', 'inset:0', 'display:flex', 'flex-direction:column', 'gap:0.5rem',
    'z-index:10000', 'align-items:center', 'justify-content:center', 'pointer-events:none',
    'background:transparent',
  ].join(';');
  const label = document.createElement('span');
  label.style.cssText = [
    "font-family:ui-monospace,'SF Mono','Menlo',monospace", 'font-size:15px', 'font-weight:700',
    'letter-spacing:0.1em', 'text-transform:uppercase', 'color:rgba(200,216,232,0.95)',
    'text-shadow:0 0 3px rgba(0,0,0,0.95), 0 0 8px rgba(0,0,0,0.9), 0 0 14px rgba(120,150,190,0.6)',
    'padding:0.2rem 1.2rem',
  ].join(';');
  label.textContent = 'Stand By';
  const sub = document.createElement('span');
  sub.style.cssText = [
    "font-family:ui-monospace,'SF Mono','Menlo',monospace", 'font-size:12px',
    'letter-spacing:0.06em', 'color:rgba(170,188,206,0.9)',
    'text-shadow:0 0 3px rgba(0,0,0,0.95), 0 0 8px rgba(0,0,0,0.9)',
    'padding:0 1.2rem',
  ].join(';');
  sub.textContent = 'Claude Code is initializing — instructions will enter on their own';
  el.appendChild(label);
  el.appendChild(sub);
  document.body.appendChild(el);
  standByEl = el;
  window.addEventListener('keydown', clearStandBy, true);
  standByTimer = window.setTimeout(clearStandBy, STAND_BY_SAFETY_MS);
}
window.scs?.onStandBy?.(() => showStandBy());
window.scs?.onStandByClear?.(() => clearStandBy());

if (!canvas) {
  rlog('presenter.canvas-missing', {});
  throw new Error('#present canvas not found');
}

let wrap: ShaderWrap;
try {
  wrap = new ShaderWrap(canvas);
  rlog('presenter.shaderwrap-init', {});
} catch (err) {
  rlog('presenter.shaderwrap-init-FAIL', { error: String(err) });
  throw err;
}

// SWRM · the active mode. Default = Muxon (the branding default · D2); main overrides via
// 'scs:renderMode' immediately, and D3 drives live swaps. Tracked here too so the pointer path
// knows whether to warp (geometric tier).
let currentMode: ShaderRenderMode = SHADER_RENDER_MODE_DEFAULT;
wrap.setMode(currentMode);

// THE TRANSFER CHANNEL RETIRED (the final cursor Diamond · user): the overlay lives in the
// OFFSCREEN and draws exactly at the forwarded coordinate — no draw-side distortion handling
// exists anymore. The forward side (the downward ray in forwardMouse) remains the single
// transform: the real cursor carries the informative aspect; the virtual renders where the
// clicks occur.

// SWRM · D1 Wave 5b · the session this presenter shades. Declared HERE (above resize()) so the
// initial synchronous resize() call can read it without a TDZ throw — onPresenterInit assigns it
// once main sends the id; until then resize()'s Wound-B forward is skipped by the guard.
let presenterSessionId: string | null = null;

function resize(): void {
  const w = Math.max(1, window.innerWidth);
  const h = Math.max(1, window.innerHeight);
  wrap.resize(w, h);
  rlog('presenter.resize', { w, h });
  // SWRM · MD-5 Wound B (RESIZE) · re-fit the OFFSCREEN window to the presenter's new bounds. The
  // GL surface above stretches the OLD-sized texture; without this the offscreen keeps its spawn
  // dimensions and the content is scaled, not reflowed. Forward {width,height} → main → setSize on
  // the paired offscreen window. The terminal reflows via the proven WRA chain (offscreen
  // window.resize → safeFit → port resize → pty.resize → SIGWINCH); the SCP DOM reflows natively.
  // Guarded on init: the first resize events fire before onPresenterInit sets the id and are skipped
  // (the offscreen already matches the spawn size; only subsequent user resizes need forwarding).
  if (presenterSessionId && window.scs?.forwardResize) {
    window.scs.forwardResize(presenterSessionId, w, h);
  }
}
resize();
window.addEventListener('resize', resize);
wrap.start();
rlog('presenter.started', {});

let frameCount = 0;
window.scs?.onOsrFrame?.((bitmap, width, height) => {
  frameCount += 1;
  if (frameCount === 1) {
    rlog('presenter.first-frame', { width, height, bytes: bitmap.length });
  } else if (frameCount % 120 === 0) {
    rlog('presenter.frame-tick', { frameCount });
  }
  wrap.setRawFrame(bitmap, width, height);
});

window.scs?.onRenderMode?.((mode) => {
  if (isShaderRenderMode(mode)) {
    currentMode = mode;
    wrap.setMode(mode);
    rlog('presenter.mode-swap', { mode });
    // THE ON-THE-FLY CURVE UPDATE (user · the in-surface glyph): the surface glyph's position
    // comes from forwarded mousemoves — without movement it would sit at the OLD curve's
    // intersection until the next move. Re-forward the last known raw position through the
    // NEW mode's ray so the glyph retargets the moment the shader changes.
    if (lastRawMouse) {
      forwardMouse({ ...lastRawMouse, kind: 'move' } as MouseForward);
    }
  } else {
    rlog('presenter.mode-invalid', { mode });
  }
});

// C919 · THE FRAME GOVERNOR live swap — bridge.json.shaderFps → main 'scs:shaderFps' →
// re-gate the raf loop. Default 24 (Like Animation) is compiled into ShaderWrap; this
// channel carries both the initial hydration (sent beside scs:renderMode on load) and
// the Settings-slider live changes.
window.scs?.onShaderFps?.((fps) => {
  wrap.setFps(fps);
  rlog('presenter.fps-swap', { fps });
});

// SWRM · D1 Wave 5b · interactive keyboard. main tells the presenter which session it shades;
// every keydown resolves to a terminal byte sequence forwarded to that session's PTY.
// (presenterSessionId is declared above resize() to avoid a TDZ on the initial synchronous fit.)
let keyCount = 0;
window.scs?.onPresenterInit?.((id) => {
  presenterSessionId = id;
  rlog('presenter.init', { sessionId: id });
});
// SWRM · SCP Input Wave · the DOM modifier list for a KeyboardEvent (the SCP path; mirrors
// mouseModifiers for pointer events).
function keyModifiers(e: KeyboardEvent): MouseForwardModifier[] {
  const m: MouseForwardModifier[] = [];
  if (e.ctrlKey) m.push('control');
  if (e.shiftKey) m.push('shift');
  if (e.altKey) m.push('alt');
  if (e.metaKey) m.push('meta');
  return m;
}
window.addEventListener('keydown', (e) => {
  // SWRM · MD-5 Wound A (COPY) · Cmd+C is hard-dropped by BOTH downstream paths (keyEventToBytes
  // drops every metaKey; the SCP branch below early-returns on metaKey). The selection lives in the
  // OFFSCREEN window (xterm or SCP DOM) — the presenter owns no text, so its OS-level Cmd+C copies
  // nothing. Intercept the chord BEFORE either metaKey drop and ask main to read the offscreen
  // selection + write it to the system clipboard. Covers both window classes (one handler, one id).
  if (e.metaKey && (e.key === 'c' || e.key === 'C')) {
    e.preventDefault();
    if (presenterSessionId && window.scs?.requestCopy) {
      window.scs.requestCopy(presenterSessionId);
    }
    return;
  }
  // PASTE LEG · Cmd+V — the inverse twin of the Cmd+C intercept above. The presenter owns no
  // clipboard read; main reads the system clipboard and delivers to the offscreen terminal's
  // __scsPaste (terminal.paste → bracketed-paste-safe → the same onData → PTY stream). Without
  // this intercept the chord dies in the same metaKey drops that killed Cmd+C.
  if (e.metaKey && (e.key === 'v' || e.key === 'V')) {
    e.preventDefault();
    if (presenterSessionId && window.scs?.requestPaste) {
      rlog('presenter.paste-request', { sessionId: presenterSessionId });
      window.scs.requestPaste(presenterSessionId);
    }
    return;
  }
  // SWRM · SCP Input Wave · the shaded SCP is a DOM page, not a terminal. Forward the raw key
  // (main maps it to a keyDown + char + keyUp sendInputEvent triple) instead of PTY escape bytes.
  if (presenterSessionId && presenterSessionId.startsWith('scp-')) {
    const k = e.key;
    if (k === 'Shift' || k === 'Control' || k === 'Alt' || k === 'Meta' || k === 'CapsLock') return;
    if (e.metaKey) return; // Cmd/Win chords belong to the app shell, not the page
    e.preventDefault();
    if (window.scs?.sendDomKey) {
      keyCount += 1;
      if (keyCount === 1) rlog('presenter.first-dom-key', { sessionId: presenterSessionId });
      const payload: DomKeyForward = { key: e.key, code: e.code, modifiers: keyModifiers(e) };
      window.scs.sendDomKey(presenterSessionId, payload);
    }
    return;
  }
  const bytes = keyEventToBytes(e);
  if (bytes === null) return;
  e.preventDefault();
  if (presenterSessionId && window.scs?.sendKey) {
    keyCount += 1;
    if (keyCount === 1) rlog('presenter.first-key', { sessionId: presenterSessionId });
    window.scs.sendKey(presenterSessionId, bytes);
  } else {
    rlog('presenter.key-dropped', { reason: presenterSessionId ? 'no-sendKey' : 'no-sessionId' });
  }
});

// SWRM · D1 Wave 5c · complete pointer pass-through (mouse + scroll). Forward DOM mouse/wheel
// to main → the offscreen xterm (sendInputEvent), where xterm runs its own mouse-mode/scrollback
// translation — full parity with a focused terminal. CRT-Flat = 1:1 coords (geometric remap = D2).
function mouseButton(b: number): 'left' | 'middle' | 'right' | undefined {
  return b === 0 ? 'left' : b === 1 ? 'middle' : b === 2 ? 'right' : undefined;
}
// On a move, e.button is meaningless (always 0); the HELD button (for drag-selection) lives in
// the e.buttons bitmask (1=left · 2=right · 4=middle).
function heldButton(e: MouseEvent): 'left' | 'middle' | 'right' | undefined {
  if (e.buttons & 1) return 'left';
  if (e.buttons & 2) return 'right';
  if (e.buttons & 4) return 'middle';
  return undefined;
}
function mouseModifiers(e: MouseEvent | WheelEvent): MouseForwardModifier[] {
  const m: MouseForwardModifier[] = [];
  if (e.ctrlKey) m.push('control');
  if (e.shiftKey) m.push('shift');
  if (e.altKey) m.push('alt');
  if (e.metaKey) m.push('meta');
  return m;
}
let mouseCount = 0;
// The last RAW (pre-ray) position — re-forwarded on a mode swap so the in-surface glyph
// retargets to the new curve without requiring mouse movement.
let lastRawMouse: MouseForward | null = null;
function forwardMouse(payload: MouseForward): void {
  if (!presenterSessionId || !window.scs?.sendMouse) return;
  lastRawMouse = payload;
  // THE DOWNWARD ORTHOGRAPHIC RAY (user semantics + CURSOR-ORIENTATION-S6-GROUNDING.md ·
  // Concluder-grounded): priority belongs to the REAL cursor's placement — the glyph
  // replicates it (raw draw · the identity trace below) — and the forwarded coordinate is
  // the INTERSECTION of what the real cursor is attempting to select GIVEN the
  // transformation: the shader samples `uSource @ warp(screen_uv)`, so the content cell
  // under the real pixel is warpPoint(raw) — the FORWARD warp, y-down, NO flip (the chain
  // is fully co-oriented: the vertex `vUv.y = 1-y` consumes the framebuffer flip; no
  // UNPACK_FLIP_Y exists). The probe table falsified inverseWarp as the content function
  // (its corner lands off-surface). Color tier = no-op.
  if (isGeometricMode(currentMode)) {
    const p = wrap.warpPoint(payload.x, payload.y);
    payload = { ...payload, x: Math.round(p.x), y: Math.round(p.y) };
  }
  mouseCount += 1;
  if (mouseCount === 1) rlog('presenter.first-mouse', { sessionId: presenterSessionId, kind: payload.kind });
  window.scs.sendMouse(presenterSessionId, payload);
}
window.addEventListener('mousedown', (e) => {
  forwardMouse({ kind: 'down', x: Math.round(e.clientX), y: Math.round(e.clientY), button: mouseButton(e.button), clickCount: e.detail || 1, modifiers: mouseModifiers(e) });
});
window.addEventListener('mouseup', (e) => {
  forwardMouse({ kind: 'up', x: Math.round(e.clientX), y: Math.round(e.clientY), button: mouseButton(e.button), clickCount: e.detail || 1, modifiers: mouseModifiers(e) });
});
window.addEventListener('mousemove', (e) => {
  forwardMouse({ kind: 'move', x: Math.round(e.clientX), y: Math.round(e.clientY), button: heldButton(e), modifiers: mouseModifiers(e) });
});
window.addEventListener('contextmenu', (e) => {
  // suppress the presenter's native menu; the right-click rides mousedown/up as button:'right'.
  e.preventDefault();
});
window.addEventListener('wheel', (e) => {
  e.preventDefault();
  // DOM deltaY positive = scroll down; Electron mouseWheel positive = scroll up → negate.
  forwardMouse({ kind: 'wheel', x: Math.round(e.clientX), y: Math.round(e.clientY), deltaX: -e.deltaX, deltaY: -e.deltaY, modifiers: mouseModifiers(e) });
}, { passive: false });

if (window.scs?.onOsrFrame) {
  rlog('presenter.osr-channel-ready', {});
} else {
  rlog('presenter.osr-channel-MISSING', {});
  console.error('[presenter] window.scs.onOsrFrame preload API missing');
}

// DROP LEG · the Drop Area Overlay. Native drag-and-drop dies under the offscreen split — the
// visible presenter is a GL surface, the terminal never sees the OS drop. The overlay lives in
// the PRESENTER DOM above the canvas: hidden until dragenter, framed while a drag hovers, and on
// drop it resolves each File's absolute path through the preload (webUtils.getPathForFile — the
// Electron ≥32 File.path replacement), ships them to main, and main delivers through the SAME
// __scsPaste channel the clipboard leg rides. Local to THIS window's load — no bridge relay.
// The flash: after a drop the overlay lingers ~1.2s showing the delivered count (user option 2).
const dropOverlay = document.createElement('div');
dropOverlay.id = 'scs-drop-overlay';
dropOverlay.setAttribute('aria-hidden', 'true');
dropOverlay.style.cssText = [
  'position:fixed', 'inset:0', 'display:none', 'z-index:9999',
  'align-items:center', 'justify-content:center', 'pointer-events:none',
  'background:rgba(10,14,12,0.55)',
  'border:2px dashed rgba(64,224,168,0.85)', 'border-radius:6px',
  'box-sizing:border-box',
].join(';');
const dropLabel = document.createElement('span');
dropLabel.style.cssText = [
  "font-family:ui-monospace,'SF Mono','Menlo',monospace", 'font-size:14px', 'font-weight:700',
  'letter-spacing:0.08em', 'text-transform:uppercase', 'color:rgba(64,224,168,0.95)',
  'text-shadow:0 0 8px rgba(64,224,168,0.45)',
  'padding:0.5rem 1rem', 'background:rgba(10,14,12,0.85)', 'border-radius:4px',
].join(';');
dropLabel.textContent = 'Drop to enter path';
dropOverlay.appendChild(dropLabel);
document.body.appendChild(dropOverlay);

let dropFlashTimer: ReturnType<typeof setTimeout> | null = null;
function showDropOverlay(text: string): void {
  dropLabel.textContent = text;
  dropOverlay.style.display = 'flex';
}
function hideDropOverlay(): void {
  dropOverlay.style.display = 'none';
}
function flashDropOverlay(text: string): void {
  if (dropFlashTimer) clearTimeout(dropFlashTimer);
  showDropOverlay(text);
  dropFlashTimer = setTimeout(() => {
    hideDropOverlay();
    dropFlashTimer = null;
  }, 1200);
}

// dragenter/leave fire per-element — depth-count so crossing the label doesn't flicker the frame.
let dragDepth = 0;
window.addEventListener('dragenter', (e) => {
  e.preventDefault();
  dragDepth += 1;
  if (dropFlashTimer) { clearTimeout(dropFlashTimer); dropFlashTimer = null; }
  showDropOverlay('Drop to enter path');
});
window.addEventListener('dragover', (e) => {
  e.preventDefault(); // required — without it the browser rejects the drop outright
});
window.addEventListener('dragleave', (e) => {
  e.preventDefault();
  dragDepth = Math.max(0, dragDepth - 1);
  if (dragDepth === 0 && !dropFlashTimer) hideDropOverlay();
});
window.addEventListener('drop', (e) => {
  e.preventDefault();
  dragDepth = 0;
  const files = Array.from(e.dataTransfer?.files ?? []);
  if (files.length === 0 || !presenterSessionId || !window.scs?.pathForFile || !window.scs?.sendDropPaths) {
    rlog('presenter.drop-skip', {
      reason: files.length === 0 ? 'no-files' : presenterSessionId ? 'no-preload-api' : 'no-sessionId',
    });
    hideDropOverlay();
    return;
  }
  const paths = files.map((f) => window.scs!.pathForFile!(f)).filter((p) => p.length > 0);
  // GUARD-TELEMETRY · the known Electron caveat class resolves '' for some drops — name it.
  rlog('presenter.drop-resolve', { sessionId: presenterSessionId, files: files.length, resolved: paths.length });
  if (paths.length === 0) {
    flashDropOverlay('Path resolve failed');
    return;
  }
  window.scs.sendDropPaths(presenterSessionId, paths);
  flashDropOverlay(`${paths.length} path${paths.length === 1 ? '' : 's'} delivered`);
});
