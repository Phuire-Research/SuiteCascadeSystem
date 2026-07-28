/**
 * workspaceSocket.model · C416 · THE ONE SOCKET DERIVATION.
 *
 * C410 scoped the Electron singleton per workspace (the lock's userData + the control
 * socket) — but the socket path had THREE copies: control-server.ts (updated),
 * electronWindowSpawn.getCsspSocketPath (stale global), and bin/scs.js (stale global,
 * plain JS). The stale copies knocked on a socket nobody listened to: the TUI's ULT
 * quit relay died silently (orphan windows after CLI exit) and every bin/scs.js relay
 * paid a failed-socket → Electron-boot → lock-relay detour.
 *
 * THIS module is the canonical TS derivation; control-server + electronWindowSpawn
 * import it. bin/scs.js (plain JS · cannot import TS) carries an INLINE MIRROR —
 * kept in sync BY HAND; change one, change both (the mirror is marked C416).
 */

import * as path from 'node:path';
import * as os from 'node:os';
import * as crypto from 'node:crypto';

// The per-workspace singleton key — sha1(cwd) short-hash. The same ground every
// workspace-scoped primitive trusts (startRenderModeWatch(process.cwd()) · the C402
// origin read · the C410 lock userData).
export function workspaceSingletonKey(cwd: string = process.cwd()): string {
  return crypto.createHash('sha1').update(cwd).digest('hex').slice(0, 12);
}

// The per-workspace CSSP control-socket path (Unix .sock anor Windows named pipe).
export function csspSocketPath(cwd: string = process.cwd()): string {
  const key = workspaceSingletonKey(cwd);
  return process.platform === 'win32'
    ? `\\\\.\\pipe\\scs-bridge-${key}`
    : path.join(os.tmpdir(), `scs-bridge-${process.getuid?.() ?? 'user'}-${key}.sock`);
}
