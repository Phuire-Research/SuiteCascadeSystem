// SWRM · the single ambient declaration of the preload-exposed `window.scs` API, shared by
// both renderer entries (terminal + presenter). Two separate `declare global` blocks with
// diverging `scs?` shapes collide (TS2717) — this is the one home. The presenter-only channels
// (onOsrFrame/onRenderMode) and the Cadmium-only openUrl are optional: each entry uses only
// the members it needs; the others never call them. Type-only — erased at build, no runtime.

export interface ScsRendererApi {
  platform: string;
  log(event: string, data?: Record<string, unknown>): void;
  openUrl?(url: string): Promise<void>;
  onOsrFrame?(cb: (bitmap: Uint8Array, width: number, height: number) => void): void;
  onRenderMode?(cb: (mode: string) => void): void;
  // C919 · the frame-governor live swap (bridge.json.shaderFps → the presenter raf gate).
  onShaderFps?(cb: (fps: number) => void): void;
  // C492 · the Raster Bleep announcement (the focus-sweep CRT power-cycle overlay).
  onRasterBleep?(cb: (ms: number) => void): void;
  // D-GTC S5 · the graceful-close notice → paint a "Shutting Down…" overlay.
  onShuttingDown?(cb: () => void): void;
  onPresenterInit?(cb: (sessionId: string) => void): void;
  sendKey?(sessionId: string, data: string): void;
  sendMouse?(sessionId: string, payload: import('../shared/inputForward').MouseForward): void;
  // SWRM · SCP Input Wave · the DOM-key path (only the SCP presenter, sessionId 'scp-<id>', calls
  // it; the terminal presenter uses sendKey→PTY bytes instead).
  sendDomKey?(sessionId: string, payload: import('../shared/inputForward').DomKeyForward): void;
  // SWRM · MD-5 Wound A (COPY) · Cmd+C → main reads the offscreen selection → system clipboard.
  requestCopy?(sessionId: string): void;
  // PASTE LEG · Cmd+V → main reads the clipboard → __scsPaste on the offscreen terminal
  // (terminal.paste → bracketed-safe → the same onData → PTY stream as typing).
  requestPaste?(sessionId: string): void;
  // DROP LEG · preload-resolved absolute path (webUtils.getPathForFile · '' on resolve failure).
  pathForFile?(file: File): string;
  // DROP LEG · resolved paths → main quotes/joins → the same __scsPaste delivery.
  sendDropPaths?(sessionId: string, paths: string[]): void;
  // SWRM · MD-5 Wound B (RESIZE) · presenter bounds → main setSize on the paired offscreen window.
  forwardResize?(sessionId: string, width: number, height: number): void;
}

declare global {
  interface Window {
    scs?: ScsRendererApi;
  }
}
