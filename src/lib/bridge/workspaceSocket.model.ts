/**
 * workspaceSocket.model · C416 · THE ONE SOCKET DERIVATION → C947 · THE ONE SHARED DERIVATION.
 *
 * C410 scoped the Electron singleton per workspace (the lock's userData + the control
 * socket) — but the socket path had THREE copies: control-server.ts (updated),
 * electronWindowSpawn.getCsspSocketPath (stale global), and bin/scs.js (stale global,
 * plain JS). C416 unified the TS copies here and left bin/scs.js as a by-hand INLINE
 * MIRROR (plain JS could not import the TS canonical) — the drift the mirror comment
 * existed to prevent.
 *
 * C947 (the Named Environment · the Dev Lane) retires the mirror: the canonical lives in
 * `bin/scsEnvironment.js` (plain CommonJS · dependency-free · shipped in `bin/`), which
 * bin/scs.js requires directly and THIS module re-exports for the TS tree. One derivation,
 * one file. The key folds the Environment Carrier (`SCS_ENV`, set by the launcher from
 * `--name <Env>` only — C1083) into sha1(cwd) — production (no name) is unchanged.
 */

export {
  workspaceSingletonKey,
  csspSocketPath,
  environmentName,
  environmentSegment,
} from '../../../bin/scsEnvironment';
