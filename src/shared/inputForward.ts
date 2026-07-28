// SWRM · D1 Wave 5c · the normalized pointer-forward payload the presenter ships to main for
// the offscreen xterm (mouse + wheel pass-through). The presenter builds it from DOM events;
// session.forwardMouse translates it to an Electron sendInputEvent on the offscreen webContents,
// where xterm performs its own mouse-mode / scrollback translation (full parity with a focused
// terminal). Coordinates are CRT-Flat 1:1; the geometric tier (D2) inverseWarp-s them first.

export type MouseForwardModifier = 'shift' | 'control' | 'alt' | 'meta';

export interface MouseForward {
  kind: 'down' | 'up' | 'move' | 'wheel';
  x: number;
  y: number;
  button?: 'left' | 'middle' | 'right';
  clickCount?: number;
  // wheel only · Electron sign convention (positive deltaY = scroll up), so the presenter
  // negates the DOM deltas (DOM positive deltaY = scroll down) before sending.
  deltaX?: number;
  deltaY?: number;
  modifiers?: MouseForwardModifier[];
}

// SWRM · SCP Input Wave · the DOM keyboard-forward payload. The SCP presenter (sessionId
// 'scp-<id>') ships the raw KeyboardEvent essentials; main's scpInput.forwardScpDomKey maps them
// to a keyDown + char(printable) + keyUp sendInputEvent triple on the offscreen SCP webContents.
// Distinct from the terminal's keyEventToBytes→PTY path: a DOM page consumes key EVENTS, not PTY
// escape bytes. The Electron keyCode mapping (ArrowUp→Up, printable→the char) lives main-side.
export interface DomKeyForward {
  key: string;   // KeyboardEvent.key — 'a', 'A', 'Enter', 'ArrowUp', 'Backspace', ...
  code: string;  // KeyboardEvent.code — 'KeyA', 'Enter', ... (reserved for future layout mapping)
  modifiers: MouseForwardModifier[];
}
