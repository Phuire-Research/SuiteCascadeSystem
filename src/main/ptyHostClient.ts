/**
 * ptyHostClient.ts · C918 · THE PTY HOST CLIENT — main-process side of the evacuation.
 *
 * Pairs with ptyHost.ts (the utilityProcess child). One host carries ALL sessions'
 * ptys (the VS Code shape). Session.ts talks to RemotePty — the same narrow surface
 * it used on IPty (pid · onData · onExit · write · resize · kill) — so the session
 * lifecycle (PDFL launch-meta · gracefulClose's second onExit · dispose) is untouched.
 *
 * OPTIMISTIC SPAWN: Session.spawn() is sync; spawnRemotePty returns the shim
 * immediately (pid -1), posts the spawn op, and the host's 'spawned' ack fills the
 * real pid (sdia 'ptyhost.spawned'). A 'spawn-error' synthesizes an honest exit
 * (exitCode -1) through the SAME onExit path the session already handles.
 *
 * THE BLAST-RADIUS CONTAINMENT (the C917 prize): if the host process dies — the
 * C868 SIGTRAP anor anything else — the 'exit' handler synthesizes exits for every
 * live RemotePty (sessions read as exited · windows LIVE · bridge LIVE) and nulls
 * the host so the NEXT spawn re-forks a fresh one. A crash-to-desktop becomes a
 * sessions-restartable event. sdia 'ptyhost.died' carries the post-mortem.
 */

import * as path from 'node:path';
import { utilityProcess, type UtilityProcess } from 'electron';
import { sdia } from './diagnostics';

export interface RemotePtySpawnOptions {
  name: string;
  cols: number;
  rows: number;
  cwd: string;
  env: { [key: string]: string };
}

type HostOutbound =
  | { ev: 'spawned'; id: string; pid: number }
  | { ev: 'spawn-error'; id: string; error: string }
  | { ev: 'data'; id: string; data: string }
  | { ev: 'exit'; id: string; exitCode: number; signal: number };

export class RemotePty {
  pid = -1;
  private dataListeners: Array<(data: string) => void> = [];
  private exitListeners: Array<(e: { exitCode: number; signal?: number }) => void> = [];
  private exited = false;

  constructor(private readonly id: string) {}

  onData(listener: (data: string) => void): void {
    this.dataListeners.push(listener);
  }

  onExit(listener: (e: { exitCode: number; signal?: number }) => void): void {
    this.exitListeners.push(listener);
  }

  write(data: string): void {
    postToHost({ op: 'write', id: this.id, data });
  }

  resize(cols: number, rows: number): void {
    postToHost({ op: 'resize', id: this.id, cols, rows });
  }

  kill(signal?: string): void {
    postToHost({ op: 'kill', id: this.id, signal });
  }

  /** internal — host demux only */
  emitData(data: string): void {
    for (const listener of this.dataListeners) {
      try {
        listener(data);
      } catch (err) {
        console.error('[PtyHostClient] data listener error:', err);
      }
    }
  }

  /** internal — host demux + host-death synthesis. Fires once. */
  emitExit(exitCode: number, signal: number): void {
    if (this.exited) return;
    this.exited = true;
    for (const listener of this.exitListeners) {
      try {
        listener({ exitCode, signal });
      } catch (err) {
        console.error('[PtyHostClient] exit listener error:', err);
      }
    }
  }
}

let host: UtilityProcess | null = null;
const remotes = new Map<string, RemotePty>();

function postToHost(message: unknown): void {
  if (!host) return;
  try {
    host.postMessage(message);
  } catch (err) {
    sdia('ptyhost.post-FAIL', { error: String(err) });
  }
}

function ensureHost(): UtilityProcess {
  if (host) return host;
  const scriptPath = path.join(__dirname, 'ptyHost.js');
  const forked = utilityProcess.fork(scriptPath, [], { serviceName: 'scs-pty-host' });
  host = forked;
  sdia('ptyhost.forked', { scriptPath });

  forked.on('message', (raw: unknown) => {
    const msg = raw as HostOutbound;
    if (!msg || typeof msg !== 'object' || typeof (msg as { ev?: unknown }).ev !== 'string') return;
    const remote = remotes.get(msg.id);
    if (!remote) return;
    switch (msg.ev) {
      case 'spawned':
        remote.pid = msg.pid;
        sdia('ptyhost.spawned', { id: msg.id, pid: msg.pid });
        break;
      case 'spawn-error':
        sdia('ptyhost.spawn-error', { id: msg.id, error: msg.error });
        console.error('[PtyHostClient] spawn failed in host:', msg.id, msg.error);
        remotes.delete(msg.id);
        remote.emitExit(-1, 0);
        break;
      case 'data':
        remote.emitData(msg.data);
        break;
      case 'exit':
        remotes.delete(msg.id);
        remote.emitExit(msg.exitCode, msg.signal);
        break;
    }
  });

  forked.on('exit', (code: number) => {
    // THE CONTAINED LIGHTNING — the host died (trap anor otherwise). Synthesize honest
    // exits for every live session; null the host so the next spawn re-forks fresh.
    const liveIds = Array.from(remotes.keys());
    sdia('ptyhost.died', { code, liveSessions: liveIds.length, ids: liveIds });
    host = null;
    for (const [id, remote] of Array.from(remotes.entries())) {
      remotes.delete(id);
      remote.emitExit(-1, 0);
    }
  });

  return forked;
}

/**
 * Spawn a pty in the host (sync-optimistic). Throws only if the fork itself fails
 * (script missing) — session.ts's existing try/catch seam catches that. Runtime
 * spawn failures arrive as 'spawn-error' → synthesized exit.
 */
export function spawnRemotePty(
  id: string,
  command: string,
  args: string[],
  options: RemotePtySpawnOptions,
): RemotePty {
  ensureHost();
  const remote = new RemotePty(id);
  remotes.set(id, remote);
  postToHost({ op: 'spawn', id, command, args, options });
  return remote;
}
