/**
 * electronWindowSpawn.ts · CLI-side Spawn-Relay Model Function
 *
 * Isolates the detached-spawn pattern that routes a URL through bin/scs.js
 * to the Electron main process. bin/scs.js handles CSSP socket relay
 * (if Electron is already running) or fresh Electron spawn + relay otherwise.
 *
 * Consumers:
 *   - scsBridgeOpenBrowserTab quality (D1 OBRS path · production bridge state)
 *   - dev:self orchestrator auto-spawn (PoC of openUrlWindow function · also
 *     serves as live smoke test for Diamond 1 SCP-Window-via-Electron)
 *
 * Spawn shape: `process.execPath bin/scs.js open-url <url> [--focus]`
 *              detached + stdio:ignore + unref → fire-and-forget
 *
 * Citation: ETMD Macro · Diamond 1 OBRS · model function isolation for dev:self pass.
 */
import { spawn, type ChildProcess } from 'node:child_process';
import { csspSocketPath } from './workspaceSocket.model';
import * as fs from 'node:fs';
import * as net from 'node:net';
import * as os from 'node:os';
import path from 'node:path';

/**
 * Install Epoch recurse (Blank-Test-002 sessions · Blank-Test-003 SCP window): the old
 * `process.cwd()` default resolved bin/scs.js inside the USER'S PROJECT DIR when the bridge runs
 * as a global npm install → silent ENOENT (detached+ignore+unref) → no Electron window. The
 * canonical resolver (moved here from electronSessionSpawn — this is the base module both
 * relay files share). Self-verifying probe chain — first candidate containing bin/scs.js wins:
 *   1. the caller's explicit scsRoot
 *   2. bundled production: __dirname = <pkgRoot>/dist (dist/cli.cjs) → '..'
 *   3. un-bundled dev (tsx): __dirname = <repo>/src/lib/bridge → '../../..'
 *   4. process.cwd() — the legacy default (dev:self runs from the SCS root)
 */
export function resolveScsRoot(explicit?: string): string {
  const candidates = [
    explicit,
    path.resolve(__dirname, '..'),
    path.resolve(__dirname, '..', '..', '..'),
    process.cwd(),
  ];
  for (const candidate of candidates) {
    if (candidate && fs.existsSync(path.join(candidate, 'bin', 'scs.js'))) return candidate;
  }
  return process.cwd();
}

export interface SpawnElectronWindowOptions {
  /** Default true · '--focus' affirmative opt-in per CSCB §3.1 */
  focus?: boolean;
  /** Override SCS project root · defaults to process.cwd() */
  scsRoot?: string;
  /** Spawn-error callback · receives the spawn-level Error */
  onError?: (err: Error) => void;
  /** SWFB · SCP name to bind the opened window's id under in Cascades/SCPs.json */
  scpName?: string;
}

export function spawnElectronWindowForUrl(
  url: string,
  opts: SpawnElectronWindowOptions = {},
): ChildProcess {
  const focus = opts.focus ?? true;
  const scsRoot = resolveScsRoot(opts.scsRoot);
  const scsPath = path.join(scsRoot, 'bin', 'scs.js');

  const args = ['open-url', url];
  if (focus) args.push('--focus');
  // SWFB · carry the SCP name so cli-handler open-url binds the windowId
  // under the right key in Cascades/SCPs.json.
  if (opts.scpName) args.push('--scp-name', opts.scpName);

  const child = spawn(process.execPath, [scsPath, ...args], {
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
 * BWRF · Bridge-Window-Refocus spawn-relay. Fire-and-forget detached spawn of
 * `process.execPath bin/scs.js focus-url <url>` — sibling to spawnElectronWindowForUrl
 * but routes the CSSP `focus-url` verb (cli-handler → focusUrlWindow) which brings an
 * EXISTING URL-keyed BrowserWindow to the foreground WITHOUT opening one (no-op if the
 * URL is not already in urlWindowMap). Used by scsBridgeFocusUrlWindow to refocus the
 * SCS-Bridge UI window so a spawned anchor can surface its Shatterite Menu to the user.
 *
 * Mirrors the OBRS detached + stdio:ignore + unref → fire-and-forget posture.
 */
export function spawnFocusUrlWindow(
  url: string,
  opts: Pick<SpawnElectronWindowOptions, 'scsRoot' | 'onError'> = {},
): ChildProcess {
  const scsRoot = resolveScsRoot(opts.scsRoot);
  const scsPath = path.join(scsRoot, 'bin', 'scs.js');

  const child = spawn(process.execPath, [scsPath, 'focus-url', url], {
    detached: true,
    stdio: 'ignore',
  });

  if (opts.onError) {
    child.on('error', opts.onError);
  }

  child.unref();
  return child;
}

// W3.5 (C781) · the navigate+focus relay for scp_focus_suite8_page: CSSP verb
// `focus-suite8-page <windowId> <navUrl>` — cli-handler loads the deep-linked URL into the
// bound window (fromId) and brings it forward. windowId -1 = unresolved (the case falls back
// to the url-window match). Mirrors spawnFocusUrlWindow's detached fire-and-forget posture.
export function spawnFocusSuite8Page(
  windowId: number,
  navUrl: string,
  opts: { scsRoot?: string; onError?: (err: Error) => void } = {},
): ChildProcess {
  const scsRoot = resolveScsRoot(opts.scsRoot);
  const scsPath = path.join(scsRoot, 'bin', 'scs.js');
  const child = spawn(process.execPath, [scsPath, 'focus-suite8-page', String(windowId), navUrl], {
    detached: true,
    stdio: 'ignore',
  });
  child.on('error', (err) => opts.onError?.(err));
  child.unref();
  return child;
}

/**
 * C793 · SRH · the RESULT-BEARING focus-suite8-page relay. Sibling of spawnFocusSuite8Page but
 * the fire-and-forget posture becomes result-bearing: NOT detached, stdio pipes captured, resolves
 * on child close with relayed = (exit code 0). This is the leg the focus quality awaits so
 * focus.ok reflects the RELAY outcome (did the CSSP hop land) rather than the mere dispatch.
 *
 * NEVER rejects — always resolves. A timeout (default 3000ms) kills the child and resolves
 * { relayed: false, code: null, detail: 'timeout' }. Captured stdout+stderr are capped (~4KB)
 * and the tail carried out as `detail`. Mirrors sendControlRequest's always-resolve discipline
 * while keeping the argv-spawn shape (rather than a direct socket write) so it rides the exact
 * same bin/scs.js relay/fallback path the other verbs use.
 */
export function spawnFocusSuite8PageAwait(
  windowId: number,
  navUrl: string,
  opts: { scsRoot?: string; timeoutMs?: number } = {},
): Promise<{ relayed: boolean; code: number | null; detail?: string }> {
  const timeoutMs = opts.timeoutMs ?? 3000;
  return new Promise((resolve) => {
    const scsRoot = resolveScsRoot(opts.scsRoot);
    const scsPath = path.join(scsRoot, 'bin', 'scs.js');
    let settled = false;
    let output = '';
    const CAP = 4096;
    const append = (chunk: Buffer): void => {
      if (output.length >= CAP) return;
      output += chunk.toString('utf8');
      if (output.length > CAP) output = output.slice(0, CAP);
    };
    const child = spawn(process.execPath, [scsPath, 'focus-suite8-page', String(windowId), navUrl], {
      detached: false,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    const finalize = (result: { relayed: boolean; code: number | null; detail?: string }): void => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve(result);
    };
    const timer = setTimeout(() => {
      try {
        child.kill();
      } catch {
        /* ignore */
      }
      finalize({ relayed: false, code: null, detail: 'timeout' });
    }, timeoutMs);
    child.stdout?.on('data', append);
    child.stderr?.on('data', append);
    child.on('error', (err) => {
      finalize({ relayed: false, code: null, detail: err.message });
    });
    child.on('close', (code) => {
      const tail = output.trim().slice(-512);
      finalize({
        relayed: code === 0,
        code: code ?? null,
        detail: tail.length > 0 ? tail : undefined,
      });
    });
  });
}

/**
 * SWFB · Specific-Window-Focus spawn-relay. Fire-and-forget detached spawn of
 * `process.execPath bin/scs.js focus-by-id <windowId>` — sibling to
 * spawnFocusUrlWindow but routes the CSSP `focus-by-id` verb (cli-handler →
 * focusWindowById → BrowserWindow.fromId). Deterministic "specific not last":
 * focuses the EXACT window whose id was bound in Cascades/SCPs.json, bypassing
 * the URL-key matching that the old refocus path missed on.
 *
 * Mirrors the OBRS detached + stdio:ignore + unref → fire-and-forget posture.
 */
export function spawnFocusWindowById(
  windowId: number,
  opts: Pick<SpawnElectronWindowOptions, 'scsRoot' | 'onError'> = {},
): ChildProcess {
  const scsRoot = resolveScsRoot(opts.scsRoot);
  const scsPath = path.join(scsRoot, 'bin', 'scs.js');

  const child = spawn(process.execPath, [scsPath, 'focus-by-id', String(windowId)], {
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
 * SES · THE STOP RAIL close-relay (C632 · Exit ability). Fire-and-forget detached
 * spawn of `process.execPath bin/scs.js close-by-id <windowId>` — sibling of
 * spawnFocusWindowById but routes the CSSP `close-by-id` verb (cli-handler →
 * closeWindowById → BrowserWindow.fromId(id).close()). Closing the SCP window
 * fires its `win.on('closed')` handler (electronWindow.ts :323 →
 * signalScpWindowClosed), which cascades the FULL stop: scpLifecycleWindowClosed
 * (surface → pending) + scpSpawnManagerKillRequested (SIGTERM the dedicated
 * server + FSM dying→gone + re-seat). This is the cross-process leg — the SCP
 * window may live in a SEPARATE electron process, so the CSSP verb reaches it
 * where a same-process BrowserWindow.fromId would return null.
 *
 * Mirrors the OBRS detached + stdio:ignore + unref → fire-and-forget posture.
 */
export function spawnCloseWindowById(
  windowId: number,
  opts: Pick<SpawnElectronWindowOptions, 'scsRoot' | 'onError'> = {},
): ChildProcess {
  const scsRoot = resolveScsRoot(opts.scsRoot);
  const scsPath = path.join(scsRoot, 'bin', 'scs.js');

  const child = spawn(process.execPath, [scsPath, 'close-by-id', String(windowId)], {
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
 * CSSP socket path resolver · shared with bin/scs.js (kept in sync).
 * Unix: per-user .sock in tmpdir · Windows: named pipe.
 */
export function getCsspSocketPath(): string {
  // C416 · delegates to the canonical per-workspace derivation (the stale global copy
  // here made the ULT quit relay knock on a dead socket — orphan windows on CLI exit).
  return csspSocketPath();
}

/**
 * D-N3 · CSSP REQUEST/RESPONSE · send a command to the running Electron control-server
 * and read its one-line JSON ControlResponse back. The control-server ALWAYS writes a
 * response line ({ok, error?, data?} · control-server.ts processLine) — the fire-and-forget
 * spawns above simply never read it. This helper is the round-trip the Neon PlayTester
 * needs: the bridge quality awaits the WHOLE orchestration sequence result.
 * Never rejects — resolves {ok:false, error} on timeout / no socket / parse failure.
 */
export function sendControlRequest(
  cmd: string[],
  timeoutMs = 35_000,
): Promise<{ ok: boolean; error?: string; data?: unknown }> {
  return new Promise((resolve) => {
    const socketPath = getCsspSocketPath();
    try {
      if (process.platform !== 'win32' && !fs.existsSync(socketPath)) {
        resolve({ ok: false, error: 'control socket not present (Electron not running)' });
        return;
      }
    } catch (err) {
      resolve({ ok: false, error: String(err) });
      return;
    }
    let settled = false;
    let buffer = '';
    const finalize = (result: { ok: boolean; error?: string; data?: unknown }): void => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      try {
        client.destroy();
      } catch {
        /* ignore */
      }
      resolve(result);
    };
    const client = net.createConnection(socketPath);
    const timer = setTimeout(() => {
      finalize({ ok: false, error: `control request timeout after ${timeoutMs}ms` });
    }, timeoutMs);
    client.on('connect', () => {
      try {
        client.write(JSON.stringify({ cmd }) + '\n');
      } catch (err) {
        finalize({ ok: false, error: String(err) });
      }
    });
    client.on('data', (chunk) => {
      buffer += chunk.toString('utf8');
      const newlineIdx = buffer.indexOf('\n');
      if (newlineIdx === -1) return;
      const line = buffer.slice(0, newlineIdx).trim();
      try {
        finalize(JSON.parse(line) as { ok: boolean; error?: string; data?: unknown });
      } catch (err) {
        finalize({ ok: false, error: `response parse failure: ${String(err)}` });
      }
    });
    client.on('error', (err) => {
      finalize({ ok: false, error: err.message });
    });
    client.on('close', () => {
      finalize({ ok: false, error: 'socket closed before response' });
    });
  });
}

/**
 * ULT · Unified-Lifecycle-Termination · Send `quit` to a running Electron
 * instance via CSSP socket · best-effort · resolves on socket close or timeout.
 *
 * Used by CLI exit paths (dev:self shutdown · animatedTui cleanExit) to
 * tear down the Electron tray + windows when the CLI itself is exiting.
 * Without this · Electron would survive as an orphan tray after CLI exit.
 *
 * Promise always resolves (never rejects) so callers can `.finally(() => exit(0))`.
 */
export function sendElectronQuitViaSocket(timeoutMs = 300): Promise<void> {
  return new Promise<void>((resolve) => {
    const socketPath = getCsspSocketPath();
    try {
      if (process.platform !== 'win32' && !fs.existsSync(socketPath)) {
        resolve();
        return;
      }
    } catch {
      resolve();
      return;
    }
    let settled = false;
    const finalize = (): void => {
      if (settled) return;
      settled = true;
      resolve();
    };
    const client = net.createConnection(socketPath);
    const timer = setTimeout(() => {
      try {
        client.destroy();
      } catch {
        /* ignore */
      }
      finalize();
    }, timeoutMs);
    client.on('connect', () => {
      try {
        client.write(JSON.stringify({ cmd: ['quit'] }) + '\n');
        client.end();
      } catch {
        clearTimeout(timer);
        finalize();
      }
    });
    client.on('close', () => {
      clearTimeout(timer);
      finalize();
    });
    client.on('error', () => {
      clearTimeout(timer);
      finalize();
    });
  });
}
