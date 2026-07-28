/**
 * D-WC · Window-Close Signal · teardown flag (the app-quit / turn-over guard).
 *
 * A single module-level flag shared across the Electron-main process so the
 * per-window `win.on('closed')` handlers (session.ts, electronWindow.ts) can
 * distinguish a USER window close (record offline / return-to-pending) from a
 * teardown-driven mass close (performQuit → sessionRegistry.disposeAll(), which
 * calls win.close() on EVERY window). During teardown every window fires
 * 'closed'; recording each would storm the registry AND is redundant (boot-reset
 * markAllSessionsOffline already sets every entry offline on next launch, and
 * anchors resume from offline). index.ts sets this true at the TOP of
 * performQuit(), BEFORE disposeAll runs, so all subsequent 'closed' events skip.
 *
 * Kept in its own module (not exported from index.ts) to avoid a circular import:
 * index.ts imports session.ts / electronWindow.ts, so those cannot import index.ts.
 */

let tearingDown = false;

export function markTearingDown(): void {
  tearingDown = true;
}

export function isTearingDown(): boolean {
  return tearingDown;
}
