/**
 * devToolsBinding · DevTools enable on BrowserWindow
 *
 * Auto-opens DevTools in dev mode (NODE_ENV=development OR SCS_SELF_DEV=1).
 * Always wires shortcuts in ALL modes:
 *   F12              · cross-platform toggle
 *   Cmd+Opt+I        · macOS toggle
 *   Ctrl+Shift+I     · Win/Linux toggle
 *
 * Used by D1 URL windows (electronWindow.ts) and D2 session windows (session.ts).
 * Intercepts at `webContents.before-input-event` so the renderer (xterm.js) never
 * sees these key combos — devtools can be opened even when terminal is consuming input.
 *
 * Citation: ETMD Macro · Diamond 2 user-Lambda surfaced cursor-without-input symptom
 *           · diagnostic + ergonomic addition · cross-platform xterm.js debug discipline.
 */
import { BrowserWindow } from 'electron';

function isDevMode(): boolean {
  return (
    process.env.NODE_ENV === 'development' ||
    process.env.SCS_SELF_DEV === '1'
  );
}

export function wireDevToolsOnWindow(win: BrowserWindow): void {
  if (isDevMode()) {
    win.webContents.once('did-finish-load', () => {
      try {
        win.webContents.openDevTools({ mode: 'detach' });
      } catch (err) {
        console.error('[devTools] auto-open failed:', err);
      }
    });
  }

  win.webContents.on('before-input-event', (event, input) => {
    if (input.type !== 'keyDown') return;

    if (input.key === 'F12') {
      win.webContents.toggleDevTools();
      event.preventDefault();
      return;
    }

    const isI = input.key === 'i' || input.key === 'I';
    if (!isI) return;

    const isMac = process.platform === 'darwin';
    if (isMac && input.meta && input.alt) {
      win.webContents.toggleDevTools();
      event.preventDefault();
      return;
    }
    if (!isMac && input.control && input.shift) {
      win.webContents.toggleDevTools();
      event.preventDefault();
      return;
    }
  });
}
