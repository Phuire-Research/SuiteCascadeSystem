/**
 * ptyHost.ts · C918 · THE PTY HOST — the utilityProcess node-pty evacuation.
 *
 * THE LIGHTNING WOUND (C917): node-pty lived in the Electron MAIN process; the
 * C868-family SIGTRAP (EXC_BREAKPOINT · CrBrowserMain · identical offsets across
 * captures) fires in main-process Node internals shortly after a pty spawn — and a
 * main-process death is a CRASH-TO-DESKTOP: every window, every session, gone.
 *
 * THE EVACUATION (the VS Code precedent — its ptys live in a pty host process):
 * this script runs inside an Electron utilityProcess forked by ptyHostClient.ts.
 * ALL node-pty spawns happen HERE. If the trap ever fires again it kills THIS
 * process — the client synthesizes honest exits for every session and re-forks on
 * the next spawn. Blast radius: sessions restartable, windows alive, bridge alive.
 *
 * PROTOCOL (MessagePort · structured-clone JSON):
 *   in  → { op: 'spawn',  id, command, args, options{name,cols,rows,cwd,env} }
 *       → { op: 'write',  id, data }
 *       → { op: 'resize', id, cols, rows }
 *       → { op: 'kill',   id, signal? }        (no signal = bare kill · win32 path)
 *   out ← { ev: 'spawned', id, pid }
 *       ← { ev: 'spawn-error', id, error }
 *       ← { ev: 'data',    id, data }
 *       ← { ev: 'exit',    id, exitCode, signal }
 *
 * This file is its OWN tsup entry (dist/main/ptyHost.js) — utilityProcess.fork
 * needs a real on-disk script. node-pty stays external (N-API prebuilds).
 */

import type { IPty } from 'node-pty';

interface PtySpawnOptions {
  name: string;
  cols: number;
  rows: number;
  cwd: string;
  env: { [key: string]: string };
}

interface NodePtyModule {
  spawn(command: string, args: string[], options: PtySpawnOptions): IPty;
}

type HostInbound =
  | { op: 'spawn'; id: string; command: string; args: string[]; options: PtySpawnOptions }
  | { op: 'write'; id: string; data: string }
  | { op: 'resize'; id: string; cols: number; rows: number }
  | { op: 'kill'; id: string; signal?: string };

// Electron's utilityProcess Node env exposes process.parentPort (not in @types/node).
interface ParentPortLike {
  on(event: 'message', listener: (e: { data: unknown }) => void): void;
  postMessage(message: unknown): void;
}

const parentPort = (process as unknown as { parentPort: ParentPortLike }).parentPort;

// eslint-disable-next-line @typescript-eslint/no-var-requires
const nodePty = require('node-pty') as NodePtyModule;

const ptys = new Map<string, IPty>();

function post(message: unknown): void {
  try {
    parentPort.postMessage(message);
  } catch {
    /* parent tearing down — nothing further to report to */
  }
}

parentPort.on('message', (e) => {
  const msg = e.data as HostInbound;
  if (!msg || typeof msg !== 'object' || typeof (msg as { op?: unknown }).op !== 'string') return;
  switch (msg.op) {
    case 'spawn': {
      try {
        const p = nodePty.spawn(msg.command, msg.args, msg.options);
        ptys.set(msg.id, p);
        p.onData((data: string) => {
          post({ ev: 'data', id: msg.id, data });
        });
        p.onExit(({ exitCode, signal }) => {
          ptys.delete(msg.id);
          post({ ev: 'exit', id: msg.id, exitCode, signal: signal ?? 0 });
        });
        post({ ev: 'spawned', id: msg.id, pid: p.pid });
      } catch (err) {
        post({
          ev: 'spawn-error',
          id: msg.id,
          error: err instanceof Error ? err.message : String(err),
        });
      }
      break;
    }
    case 'write': {
      const p = ptys.get(msg.id);
      if (p) {
        try {
          p.write(msg.data);
        } catch {
          /* racing exit tore the write end down — the exit event carries the truth */
        }
      }
      break;
    }
    case 'resize': {
      const p = ptys.get(msg.id);
      if (p) {
        try {
          p.resize(msg.cols, msg.rows);
        } catch {
          /* racing exit — ignore */
        }
      }
      break;
    }
    case 'kill': {
      const p = ptys.get(msg.id);
      if (p) {
        try {
          if (msg.signal) p.kill(msg.signal);
          else p.kill();
        } catch {
          /* already dead — the exit event carries the truth */
        }
      }
      break;
    }
  }
});
