// SWRM · SCP Input Wave · forward presenter input to the OFFSCREEN SCP webContents.
//
// The SCP Shaded Window (D5-extended) renders the SCP page offscreen and shades it through the
// presenter. Input flows the same way as the terminal (presenter → main → offscreen webContents)
// but the SCP is a DOM PAGE, not a PTY/xterm — so BOTH mouse and keyboard go through
// `sendInputEvent` on the offscreen webContents (the DOM does its own hit-testing + key handling).
//
// Resolution: the presenter's sessionId is `'scp-' + offscreenWin.id` (scpPresenter.ts). The
// offscreen SCP window IS a BrowserWindow, so `BrowserWindow.fromId(id)` returns it directly — no
// parallel registry needed (S2 OWISCIARPRTSR · electronWindow.ts focusWindowById precedent).
//
// The terminal path (session.forwardMouse) is intentionally NOT reused/refactored here — it is
// proven (user-confirmed scroll+select) and stays byte-identical. This module owns the SCP-only
// forwarders, with S4's hover fix (no phantom held-button on a no-drag move).

import { BrowserWindow } from 'electron';
import type { WebContents } from 'electron';
import type { MouseForward, DomKeyForward, MouseForwardModifier } from '../shared/inputForward';
import { sdia } from './diagnostics';

const SCP_PREFIX = 'scp-';

export function isScpSessionId(sessionId: string): boolean {
  return sessionId.startsWith(SCP_PREFIX);
}

// Resolve the offscreen SCP webContents from a 'scp-<id>' sessionId. Returns null if the id is
// unparseable or the window is gone (closed mid-event) — callers no-op silently.
export function getScpWebContents(sessionId: string): WebContents | null {
  if (!isScpSessionId(sessionId)) return null;
  const id = Number.parseInt(sessionId.slice(SCP_PREFIX.length), 10);
  if (Number.isNaN(id)) return null;
  const win = BrowserWindow.fromId(id);
  if (!win || win.isDestroyed()) return null;
  return win.webContents;
}

// ── Mouse (W1) ──────────────────────────────────────────────────────────────────────────────
// Coordinates arrive ALREADY inverseWarp-corrected (the presenter applies the INVERSE warp for the
// geometric tier before sending · presenter.ts forwardMouse). So this is a straight replay.
function forwardMouseOnWebContents(wc: WebContents, ev: MouseForward): void {
  if (ev.kind === 'wheel') {
    wc.sendInputEvent({
      type: 'mouseWheel',
      x: ev.x,
      y: ev.y,
      deltaX: ev.deltaX ?? 0,
      deltaY: ev.deltaY ?? 0,
      canScroll: true,
      modifiers: ev.modifiers,
    });
    return;
  }
  const type = ev.kind === 'down' ? 'mouseDown' : ev.kind === 'up' ? 'mouseUp' : 'mouseMove';
  // C910 · THE FOCUS BELT (the documented sendInputEvent precondition): the receiving
  // contents must be focused for synthesized input to land — assert it at every press so
  // the drag sequence that follows is never dropped by an unfocused target.
  if (type === 'mouseDown') {
    try { wc.focus(); } catch { /* focus is best-effort */ }
  }
  if (ev.kind === 'move' && ev.button === undefined) {
    // S4 hover fix · a plain hover must NOT assert a held button, or the DOM page reads phantom
    // drag state (event.buttons). Omit `button` entirely on a no-held move.
    wc.sendInputEvent({ type, x: ev.x, y: ev.y, modifiers: ev.modifiers });
    return;
  }
  // C908 · THE DRAG CURE: Chromium's selection/drag tracking on a synthesized mouseMove reads
  // the WebInputEvent MODIFIERS ('leftButtonDown' et al), NOT the `button` field — without the
  // modifier a held move never extends a selection (the no-drag-select field wound). Held moves
  // and the closing mouseUp carry the corresponding <button>ButtonDown modifier.
  const heldModifier =
    type !== 'mouseDown' && ev.button !== undefined ? `${ev.button ?? 'left'}ButtonDown` : undefined;
  const modifiers = heldModifier
    ? ([...(ev.modifiers ?? []), heldModifier] as unknown as typeof ev.modifiers)
    : ev.modifiers;
  wc.sendInputEvent({
    type,
    x: ev.x,
    y: ev.y,
    button: ev.button ?? 'left',
    clickCount: ev.clickCount,
    modifiers,
  } as Electron.MouseInputEvent);
}

export function forwardScpMouse(sessionId: string, ev: MouseForward): void {
  const wc = getScpWebContents(sessionId);
  if (!wc) return;
  try {
    forwardMouseOnWebContents(wc, ev);
    sdia('scp.input.mouse', { sessionId, kind: ev.kind, x: ev.x, y: ev.y, button: ev.button });
  } catch (err) {
    sdia('scp.input.mouse-FAIL', { sessionId, error: String(err) });
  }
}

// ── Keyboard (W2) ───────────────────────────────────────────────────────────────────────────
// Map a DOM KeyboardEvent.key to the Electron sendInputEvent keyCode. Printables pass as the char
// itself; the named navigation keys map to Electron's accelerator names. Everything else passes
// through (Enter/Backspace/Tab/Escape/Delete/Home/End/PageUp/PageDown already match).
function domKeyToElectronCode(key: string): string {
  switch (key) {
    case 'ArrowUp': return 'Up';
    case 'ArrowDown': return 'Down';
    case 'ArrowLeft': return 'Left';
    case 'ArrowRight': return 'Right';
    default: return key;
  }
}

function hasMod(mods: MouseForwardModifier[], m: MouseForwardModifier): boolean {
  return mods.indexOf(m) !== -1;
}

function forwardDomKeyOnWebContents(wc: WebContents, ev: DomKeyForward): void {
  const keyCode = domKeyToElectronCode(ev.key);
  wc.sendInputEvent({ type: 'keyDown', keyCode, modifiers: ev.modifiers });
  // The `char` event is what actually inserts text into inputs/textareas. Fire it only for a
  // printable single char with no control/meta chord (those are commands, not text). Enter gets an
  // explicit carriage return so forms submit / newlines land.
  if (ev.key.length === 1 && !hasMod(ev.modifiers, 'control') && !hasMod(ev.modifiers, 'meta')) {
    wc.sendInputEvent({ type: 'char', keyCode: ev.key });
  } else if (ev.key === 'Enter') {
    wc.sendInputEvent({ type: 'char', keyCode: '\r' });
  }
  wc.sendInputEvent({ type: 'keyUp', keyCode, modifiers: ev.modifiers });
}

export function forwardScpDomKey(sessionId: string, ev: DomKeyForward): void {
  const wc = getScpWebContents(sessionId);
  if (!wc) return;
  try {
    forwardDomKeyOnWebContents(wc, ev);
    sdia('scp.input.key', { sessionId, key: ev.key, mods: ev.modifiers });
  } catch (err) {
    sdia('scp.input.key-FAIL', { sessionId, error: String(err) });
  }
}
