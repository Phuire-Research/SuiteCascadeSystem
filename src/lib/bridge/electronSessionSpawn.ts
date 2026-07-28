/**
 * electronSessionSpawn.ts · CLI-side Session-Spawn-Relay Model Function
 *
 * Sibling to electronWindowSpawn.ts (URL window path). Routes session
 * lifecycle commands through bin/scs.js to the Electron main process.
 * bin/scs.js handles CSSP socket relay (if Electron is already running)
 * or fresh Electron spawn + relay otherwise.
 *
 * Consumers (D2 refactor):
 *   - scsBridgeEngageSession quality  · open-session <ulid> (focus-existing per Q2=Option A)
 *   - scsBridgeFocusSession  quality  · open-session <ulid> (focus-existing semantics)
 *   - scsBridgeSpawnNewScpSession quality · open-session <ulid> (create + focus)
 *   - src/lib/tui/animatedTui.ts      · open-session <ulid> for TUI resume/spawn/[z]-focus
 *
 * Per Q2=Option A: `open-session` on an existing ULID FOCUSES the existing
 * Electron BrowserWindow rather than erroring. Therefore spawnElectronSessionForUlid
 * is the universal verb for both "new session" and "focus existing session".
 * focusElectronSessionForUlid is a semantic alias preserved for caller clarity.
 *
 * Spawn shape: `process.execPath bin/scs.js open-session <ulid>`
 *              detached + stdio:ignore + unref → fire-and-forget
 *
 * Citation: ETMD Diamond 2 · TSEW + ECRS + CCRD · Q2 Option A focus-existing semantics
 */
import { spawn, type ChildProcess } from 'node:child_process';
import path from 'node:path';
import { getCsspSocketPath as _getCsspSocketPath, resolveScsRoot } from './electronWindowSpawn';

export { _getCsspSocketPath as getCsspSocketPath };
// the canonical resolver lives in electronWindowSpawn (the base module both relay files share);
// re-exported here so existing consumers of this module keep their import surface.
export { resolveScsRoot };

export interface SpawnElectronSessionOptions {
  /** Override SCS project root · defaults to resolveScsRoot() (NOT process.cwd()) */
  scsRoot?: string;
  /** Spawn-error callback · receives the spawn-level Error */
  onError?: (err: Error) => void;
}

/**
 * Spawn (or focus-existing) an Electron terminal session for the given ULID.
 *
 * Q2=Option A semantics: if a session with this ULID is already registered in
 * the SRMP, the existing window is focused. Otherwise a new Session is created
 * via makeSession + cli-handler `open-session` case.
 */
export function spawnElectronSessionForUlid(
  ulid: string,
  opts: SpawnElectronSessionOptions = {},
): ChildProcess {
  const scsRoot = resolveScsRoot(opts.scsRoot);
  const scsPath = path.join(scsRoot, 'bin', 'scs.js');

  const child = spawn(process.execPath, [scsPath, 'open-session', ulid], {
    detached: true,
    stdio: 'ignore',
  });

  if (opts.onError) {
    child.on('error', opts.onError);
  }

  child.unref();
  return child;
}

/**
 * SCS Install Epoch D1 · §1.4 · CLI-side relay for the install instance.
 *
 * Sibling to spawnElectronSessionForUlid (`:45`) — same detached fire-and-forget
 * shape, different verb (`open-install`) + a JSON envelope arg (not a bare ULID).
 * The envelope is JSON-via-argv (ESC/space-safe): seedPrompt is multi-line verbose
 * text and appendSystemPromptFilePath may contain spaces (macOS Application Support),
 * so JSON.stringify → argv → JSON.parse is the reliable carry across the process
 * boundary (proven by sendMessage/sendRawKeys). bin/scs.js lists `open-install` in
 * ELECTRON_SUBCOMMANDS so it relays to the running Electron main over the CSSP socket
 * → cli-handler `case 'open-install'` → makeSession(install branch) → Session.spawn.
 */
export interface SpawnElectronInstallOptions extends SpawnElectronSessionOptions {
  cwd: string;
  seedPrompt?: string | null;
  appendSystemPromptFilePath: string;
  settingsPath: string;
  bridgeRootOverride: string;
}

export function spawnElectronInstallInstance(
  ulid: string,
  opts: SpawnElectronInstallOptions,
): ChildProcess {
  const scsRoot = resolveScsRoot(opts.scsRoot);
  const scsPath = path.join(scsRoot, 'bin', 'scs.js');
  const envelope = JSON.stringify({
    ulid,
    cwd: opts.cwd,
    seedPrompt: opts.seedPrompt ?? null,
    appendSystemPromptFilePath: opts.appendSystemPromptFilePath,
    settingsPath: opts.settingsPath,
    bridgeRootOverride: opts.bridgeRootOverride,
  });

  const child = spawn(process.execPath, [scsPath, 'open-install', envelope], {
    detached: true,
    stdio: 'ignore',
  });

  if (opts.onError) {
    child.on('error', opts.onError);
  }

  child.unref();
  return child;
}

/**
 * Focus the Electron terminal session for the given ULID.
 *
 * Under Q2=Option A (focus-existing semantics on open-session), this is a
 * semantic alias for spawnElectronSessionForUlid. Preserved as a distinct
 * named export so caller intent stays readable.
 */
export function focusElectronSessionForUlid(
  ulid: string,
  opts: SpawnElectronSessionOptions = {},
): ChildProcess {
  return spawnElectronSessionForUlid(ulid, opts);
}

/**
 * CWDC · Close-Wait-Dissipate Close-leg · gracefully CLOSE the Electron terminal
 * session for the given ULID by dispatching the `kill` verb through the SAME
 * `bin/scs.js` CSSP channel spawnElectronSessionForUlid uses for `open-session`.
 *
 * Mirror of spawnElectronSessionForUlid (same detached fire-and-forget shape) —
 * the ONLY difference is the verb: `kill <ulid>` instead of `open-session <ulid>`.
 * bin/scs.js already lists `kill` in ELECTRON_SUBCOMMANDS, so it relays to the
 * running Electron main over the CSSP socket → cli-handler `case 'kill'` →
 * session.dispose() (ptyProcess.kill()) → sessionRegistry.remove(ulid).
 *
 * This is the graceful pty teardown the worker's dissipation needs and cannot
 * reach from the bridge-server process directly (the pty lives in Electron main).
 * Fire-and-forget: the bridge process does not await the kill ACK — the WAIT leg
 * in the calling quality bounds the time before the registry reap.
 *
 * Citation: electronSessionSpawn.ts spawnElectronSessionForUlid (channel sibling) ·
 * bin/scs.js ELECTRON_SUBCOMMANDS 'kill' · cli-handler.ts case 'kill' (L391-398)
 */
export function killElectronSessionForUlid(
  ulid: string,
  opts: SpawnElectronSessionOptions = {},
): ChildProcess {
  const scsRoot = resolveScsRoot(opts.scsRoot);
  const scsPath = path.join(scsRoot, 'bin', 'scs.js');

  const child = spawn(process.execPath, [scsPath, 'kill', ulid], {
    detached: true,
    stdio: 'ignore',
  });

  if (opts.onError) {
    child.on('error', opts.onError);
  }

  child.unref();
  return child;
}

/**
 * MVP-RC3 D2 · RRRRQ Resume-Resize Render-Reset substrate · gracefully RESIZE the
 * Electron terminal session's BrowserWindow for the given ULID by dispatching the
 * NEW `resize` verb through the SAME `bin/scs.js` CSSP channel
 * spawnElectronSessionForUlid / killElectronSessionForUlid use.
 *
 * Mirror of killElectronSessionForUlid (`:98-116`) — same detached fire-and-forget
 * shape — the ONLY differences are the verb (`resize` instead of `kill`) and the
 * extra `scalePct` arg. bin/scs.js lists `resize` in ELECTRON_SUBCOMMANDS so it
 * relays to the running Electron main over the CSSP socket → cli-handler
 * `case 'resize'` → session.getWindow().setBounds(scaled bounds). The window IS a
 * BrowserWindow (session.ts:182-210 ensureWindow · getWindow() at session.ts:323),
 * so setBounds/getBounds are Electron core (no IPC path existed; this is the new one).
 *
 * scalePct scales the CURRENT bounds (e.g. 1.10 expand, 0.909 contract-back). The
 * cli-handler guards `if (win && !win.isDestroyed())` so a null/destroyed window
 * no-ops safely (H1-aligned advance-on-no-op). Fire-and-forget: the bridge process
 * does not await the resize ACK — the in-Method settle floor of the calling relay
 * Quality bounds the render-settle window.
 *
 * Citation: electronSessionSpawn.ts killElectronSessionForUlid (channel sibling) ·
 * bin/scs.js ELECTRON_SUBCOMMANDS 'resize' · cli-handler.ts case 'resize' ·
 * MRQ-DIAMOND-WGB.md §2.5a (Resize CSSP verb — the S6 GAP RESOLVED)
 */
export function resizeElectronSessionForUlid(
  ulid: string,
  scalePct: number,
  opts: SpawnElectronSessionOptions = {},
): ChildProcess {
  const scsRoot = resolveScsRoot(opts.scsRoot);
  const scsPath = path.join(scsRoot, 'bin', 'scs.js');

  const child = spawn(process.execPath, [scsPath, 'resize', ulid, String(scalePct)], {
    detached: true,
    stdio: 'ignore',
  });

  if (opts.onError) {
    child.on('error', opts.onError);
  }

  child.unref();
  return child;
}
