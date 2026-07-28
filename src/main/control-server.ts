import * as net from 'node:net';
import * as fs from 'node:fs';
// C416 · THE ONE SOCKET DERIVATION — the canonical per-workspace key + socket path
// (three drifted copies unified; see workspaceSocket.model.ts).
import { workspaceSingletonKey, csspSocketPath } from '../lib/bridge/workspaceSocket.model';

export { workspaceSingletonKey };

// C410 · THE PPRR PROCESS HALF — the per-workspace singleton key. PPRR moved bridge.json
// per-project; the Electron singleton (the lock + this relay socket) stayed machine-global,
// so every workspace's windows lived in the FIRST CLI's Electron and the owner's death was
// everyone's window-death. Both sides of the pair key on process.cwd() — the workspace —
// the same ground startRenderModeWatch(process.cwd()) and the C402 origin read already
// trust. Every relay client (a second `scs`, the FKIS CLI children) inherits the workspace
// cwd, so each relays to its OWN instance by construction.

export const SOCKET_PATH: string = csspSocketPath();

export interface ControlCommand {
  cmd: string[];
}

export interface ControlResponse {
  ok: boolean;
  error?: string;
  data?: unknown;
}

export type ControlHandler = (command: ControlCommand) => Promise<ControlResponse> | ControlResponse;

export interface ControlServerHandle {
  server: net.Server;
  close: () => Promise<void>;
}

function cleanupStaleSocket(socketPath: string): void {
  if (process.platform === 'win32') return;
  try {
    if (fs.existsSync(socketPath)) {
      fs.unlinkSync(socketPath);
    }
  } catch (err) {
    console.error('[ControlServer] failed to unlink stale socket:', err);
  }
}

export function createControlServer(handler: ControlHandler): Promise<ControlServerHandle> {
  return new Promise((resolve, reject) => {
    cleanupStaleSocket(SOCKET_PATH);

    const server = net.createServer((socket) => {
      let buffer = '';
      socket.on('data', (chunk) => {
        buffer += chunk.toString('utf8');
        let newlineIdx = buffer.indexOf('\n');
        while (newlineIdx !== -1) {
          const line = buffer.slice(0, newlineIdx).trim();
          buffer = buffer.slice(newlineIdx + 1);
          if (line.length > 0) {
            processLine(line, socket, handler);
          }
          newlineIdx = buffer.indexOf('\n');
        }
      });
      socket.on('error', (err) => {
        console.error('[ControlServer] socket error:', err);
      });
    });

    server.on('error', (err) => {
      reject(err);
    });

    server.listen(SOCKET_PATH, () => {
      const close = (): Promise<void> =>
        new Promise((res) => {
          server.close(() => {
            cleanupStaleSocket(SOCKET_PATH);
            res();
          });
        });
      resolve({ server, close });
    });
  });
}

async function processLine(
  line: string,
  socket: net.Socket,
  handler: ControlHandler
): Promise<void> {
  let response: ControlResponse;
  try {
    const parsed = JSON.parse(line) as ControlCommand;
    if (!parsed || !Array.isArray(parsed.cmd)) {
      response = { ok: false, error: 'invalid command shape' };
    } else {
      response = await Promise.resolve(handler(parsed));
    }
  } catch (err) {
    response = {
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
  try {
    socket.write(JSON.stringify(response) + '\n');
  } catch (writeErr) {
    console.error('[ControlServer] write response failed:', writeErr);
  }
}
