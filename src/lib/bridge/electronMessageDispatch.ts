/**
 * electronMessageDispatch.ts · CSSP relay helper for FKIS send_message
 *
 * Bridge-daemon-side helper. Routes scsBridgeSendMessage Quality call across
 * the process boundary to Electron main's cli-handler `sendMessage` case via
 * the existing CSSP socket relay (bin/scs.js). Fire-and-forget detached spawn,
 * mirroring spawnElectronSessionForUlid / focusElectronSessionForUlid in
 * electronSessionSpawn.ts.
 *
 * Citation: D3 FKIS Stage 2 · S3 Ochre Blueprint §F · S6 Amethyst W3 spec
 */
import { spawn, type ChildProcess } from 'node:child_process';
import path from 'node:path';
import { fdia } from './fdia';
// Install Epoch recurse · the process.cwd() default broke every bin/scs.js relay in the global
// install (cwd = the user project). resolveScsRoot probes for the real package root.
import { resolveScsRoot } from './electronWindowSpawn';

export interface FkisDispatchEnvelope {
  targetUlid: string;
  text: string;
  originScpName: string;
  inFocus?: boolean;
}

export interface SpawnFkisOptions {
  scsRoot?: string;
  onError?: (err: Error) => void;
}

export function dispatchFkisMessage(
  envelope: FkisDispatchEnvelope,
  opts: SpawnFkisOptions = {},
): ChildProcess {
  const scsRoot = resolveScsRoot(opts.scsRoot);
  const scsPath = path.join(scsRoot, 'bin', 'scs.js');
  const argsJson = JSON.stringify(envelope);

  fdia('fkis.relay.attempt', {
    targetUlid: envelope.targetUlid,
    textLength: envelope.text.length,
    originScpName: envelope.originScpName,
    inFocus: envelope.inFocus === true,
    scsPath,
  });

  try {
    const child = spawn(process.execPath, [scsPath, 'sendMessage', argsJson], {
      detached: true,
      stdio: 'ignore',
    });

    child.on('error', (err) => {
      fdia('fkis.relay.spawn-error', {
        targetUlid: envelope.targetUlid,
        error: err.message,
      });
      if (opts.onError) opts.onError(err);
    });

    fdia('fkis.relay.spawned', {
      targetUlid: envelope.targetUlid,
      pid: child.pid ?? null,
    });

    child.unref();
    return child;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    fdia('fkis.relay.spawn-throw', {
      targetUlid: envelope.targetUlid,
      error: message,
    });
    throw err;
  }
}

// MRQ Shift+Tab fix · MVP-RC3 · RAW-byte keystroke dispatch.
// CLONE of dispatchFkisMessage (above) that targets the NEW cli-handler verb
// 'sendRawKeys' (NOT 'sendMessage'). The envelope carries a literal byte string
// (`bytes`) instead of `text`, so the receiver routes it to session.sendInput →
// ptyProcess.write (RAW pty byte write, session.ts:289) rather than the FKIS
// char-event stream (sendInputEvent{type:'char'}, session.ts:298) that drops the
// non-printable ESC (0x1b). Same CSSP-socket/spawn shape: ESC survives
// JSON.stringify→argv→JSON.parse (proven Concluder · WGB Part B.4), then pty.write
// preserves it. dispatchFkisMessage + the FKIS char path are UNTOUCHED.
export interface RawKeysDispatchEnvelope {
  targetUlid: string;
  bytes: string;
}

export function dispatchRawKeys(
  envelope: RawKeysDispatchEnvelope,
  opts: SpawnFkisOptions = {},
): ChildProcess {
  const scsRoot = resolveScsRoot(opts.scsRoot);
  const scsPath = path.join(scsRoot, 'bin', 'scs.js');
  const argsJson = JSON.stringify(envelope);

  fdia('rawkeys.relay.attempt', {
    targetUlid: envelope.targetUlid,
    byteLength: envelope.bytes.length,
    scsPath,
  });

  try {
    const child = spawn(process.execPath, [scsPath, 'sendRawKeys', argsJson], {
      detached: true,
      stdio: 'ignore',
    });

    child.on('error', (err) => {
      fdia('rawkeys.relay.spawn-error', {
        targetUlid: envelope.targetUlid,
        error: err.message,
      });
      if (opts.onError) opts.onError(err);
    });

    fdia('rawkeys.relay.spawned', {
      targetUlid: envelope.targetUlid,
      pid: child.pid ?? null,
    });

    child.unref();
    return child;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    fdia('rawkeys.relay.spawn-throw', {
      targetUlid: envelope.targetUlid,
      error: message,
    });
    throw err;
  }
}
