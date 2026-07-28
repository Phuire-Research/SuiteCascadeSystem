import type { Session } from './session';

export function injectKeystrokes(session: Session, text: string): void {
  // D3 FKIS · FBP closure · routes to renderer/xterm path (NOT PTY-direct)
  // to preserve typed-cadence semantics. Callers (cli-handler.ts 'type' verb)
  // inherit the fix. Replaces α-4 vestige.
  session.sendInputViaKeystroke(text);
}

export function injectKeystrokesViaSendInputEvent(session: Session, text: string): void {
  // α-4 RESERVATION: SIEK · sendInputEvent into xterm-helper-textarea
  // Requires renderer-side textarea focus + Electron BrowserWindow.webContents.sendInputEvent
  // Already wired in Session.sendInputViaKeystroke; this exports a stable handle for α-4 use.
  session.sendInputViaKeystroke(text);
}
