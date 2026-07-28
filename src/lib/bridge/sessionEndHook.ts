import { readStdin } from './sessionStartHook';
import { setDebugEnabled, log } from './debugLog';
import { markSessionOffline, removeSession } from './registry';
import { hasPersistedSession } from './sessionPersistence';

export async function runSessionEndHook(): Promise<void> {
  const ulid = process.env.SCS_BRIDGE_ULID;
  if (!ulid) {
    process.exit(0);
  }

  if (process.env.SCS_BRIDGE_DEBUG === '1') setDebugEnabled(true);

  let stdinPayload: string;
  try {
    stdinPayload = await readStdin();
  } catch {
    process.exit(0);
  }

  let parsed: { session_id?: string; cwd?: string };
  try {
    parsed = JSON.parse(stdinPayload);
  } catch {
    process.exit(0);
  }

  try {
    const cwd = parsed.cwd ?? process.cwd();
    const claudeSessionId = parsed.session_id;
    const persisted = claudeSessionId ? hasPersistedSession(cwd, claudeSessionId) : false;
    log('persistence.check', { ulid, claudeSessionId, persisted, phase: 'session-end' });
    if (persisted) {
      await markSessionOffline(ulid);
      log('hook.exit', { ulid, claudeSessionId, action: 'offline' });
    } else {
      await removeSession(ulid);
      log('hook.exit', { ulid, claudeSessionId, action: 'removed', reason: 'unpersisted-on-exit' });
    }
  } catch (err) {
    process.stderr.write(
      `[scs-hook] session-end registry update failed: ${(err as Error).message}\n`,
    );
    process.exit(0);
  }

  process.exit(0);
}
