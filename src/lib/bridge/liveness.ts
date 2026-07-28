import type { RegistryEntry } from './types';

export type LivenessTickResult = {
  aliveIds: string[];
  offlineIds: string[];
  staleIds: string[];
};

export const STALE_AGE_MS = 5 * 60 * 1000;

export function isPidAlive(pid: number): boolean {
  if (!pid || pid <= 0) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch (err) {
    const code = (err as NodeJS.ErrnoException).code;
    if (code === 'EPERM') return true;
    return false;
  }
}

export function probeLivenessTick(
  sessions: RegistryEntry[],
  nowMs: number = Date.now(),
  staleAgeMs: number = STALE_AGE_MS,
): LivenessTickResult {
  const aliveIds: string[] = [];
  const offlineIds: string[] = [];
  const staleIds: string[] = [];
  for (const s of sessions) {
    // Diamond N Fix N-A2: synthesized (auto-discovered) entries route to alive
    // regardless of claudePid or age. They have no PID and ancient mtimes
    // (JSONL born long before bridge launch), which would otherwise trigger
    // the stale/offline path within 2s every bridge launch.
    if (s.synthesizedAt !== undefined) {
      aliveIds.push(s.id);
      continue;
    }
    if (s.claudePid !== undefined) {
      if (isPidAlive(s.claudePid)) {
        aliveIds.push(s.id);
      } else {
        offlineIds.push(s.id);
      }
    } else {
      const ageMs = nowMs - s.spawnedAt;
      if (ageMs >= staleAgeMs) {
        staleIds.push(s.id);
      } else {
        aliveIds.push(s.id);
      }
    }
  }
  return { aliveIds, offlineIds, staleIds };
}
