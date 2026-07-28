import { isPidAlive, probeLivenessTick, STALE_AGE_MS } from './liveness';
import type { RegistryEntry } from './types';

describe('isPidAlive', () => {
  let killSpy: jest.SpyInstance;

  beforeEach(() => {
    killSpy = jest.spyOn(process, 'kill').mockImplementation(((..._args: unknown[]) => {
      return true;
    }) as unknown as typeof process.kill);
  });

  afterEach(() => {
    killSpy.mockRestore();
  });

  test('returns false for pid 0', () => {
    expect(isPidAlive(0)).toBe(false);
    expect(killSpy).not.toHaveBeenCalled();
  });

  test('returns false for negative pid', () => {
    expect(isPidAlive(-1)).toBe(false);
    expect(killSpy).not.toHaveBeenCalled();
  });

  test('returns true when process.kill returns void (live process)', () => {
    expect(isPidAlive(12345)).toBe(true);
    expect(killSpy).toHaveBeenCalledWith(12345, 0);
  });

  test('returns false when process.kill throws ESRCH (dead process)', () => {
    killSpy.mockImplementation(() => {
      const err = new Error('no such process') as NodeJS.ErrnoException;
      err.code = 'ESRCH';
      throw err;
    });
    expect(isPidAlive(99999)).toBe(false);
  });

  test('returns true when process.kill throws EPERM (different uid, alive)', () => {
    killSpy.mockImplementation(() => {
      const err = new Error('operation not permitted') as NodeJS.ErrnoException;
      err.code = 'EPERM';
      throw err;
    });
    expect(isPidAlive(1)).toBe(true);
  });

  test('returns false on unexpected error code', () => {
    killSpy.mockImplementation(() => {
      const err = new Error('mystery') as NodeJS.ErrnoException;
      err.code = 'EUNKNOWN';
      throw err;
    });
    expect(isPidAlive(12345)).toBe(false);
  });
});

describe('probeLivenessTick', () => {
  const mkEntry = (id: string, overrides: Partial<RegistryEntry> = {}): RegistryEntry => ({
    id,
    claudeSessionId: `uuid-${id}`,
    spawnedAt: 1714834000000,
    status: 'launched',
    cwd: '/test',
    ...overrides,
  });

  let killSpy: jest.SpyInstance;

  beforeEach(() => {
    killSpy = jest.spyOn(process, 'kill').mockImplementation(((..._args: unknown[]) => {
      return true;
    }) as unknown as typeof process.kill);
  });

  afterEach(() => {
    killSpy.mockRestore();
  });

  test('empty sessions returns three empty arrays', () => {
    const result = probeLivenessTick([]);
    expect(result.aliveIds).toEqual([]);
    expect(result.offlineIds).toEqual([]);
    expect(result.staleIds).toEqual([]);
  });

  test('buckets alive (with live pid), offline (with dead pid), pending-fresh (no pid, < stale), stale (no pid, >= stale)', () => {
    const now = 1_700_000_000_000;
    killSpy.mockImplementation(((pid: number) => {
      if (pid === 100) return true;
      const err = new Error('no such process') as NodeJS.ErrnoException;
      err.code = 'ESRCH';
      throw err;
    }) as unknown as typeof process.kill);

    const sessions: RegistryEntry[] = [
      mkEntry('alive-with-pid', { claudePid: 100, spawnedAt: now - 10_000 }),
      mkEntry('dead-with-pid', { claudePid: 200, spawnedAt: now - 10_000 }),
      mkEntry('pending-fresh', { claudePid: undefined, spawnedAt: now - 60_000 }),
      mkEntry('stale-no-pid', { claudePid: undefined, spawnedAt: now - 6 * 60 * 1000 }),
    ];

    const result = probeLivenessTick(sessions, now);
    expect(result.aliveIds).toEqual(['alive-with-pid', 'pending-fresh']);
    expect(result.offlineIds).toEqual(['dead-with-pid']);
    expect(result.staleIds).toEqual(['stale-no-pid']);
  });

  test('honors custom nowMs and staleAgeMs', () => {
    const now = 1_700_000_000_000;
    const sessions: RegistryEntry[] = [
      mkEntry('boundary', { claudePid: undefined, spawnedAt: now - 30_000 }),
    ];
    const resultDefault = probeLivenessTick(sessions, now, STALE_AGE_MS);
    expect(resultDefault.staleIds).toEqual([]);
    expect(resultDefault.aliveIds).toEqual(['boundary']);

    const resultTight = probeLivenessTick(sessions, now, 20_000);
    expect(resultTight.staleIds).toEqual(['boundary']);
    expect(resultTight.aliveIds).toEqual([]);
  });

  test('STALE_AGE_MS is 5 minutes', () => {
    expect(STALE_AGE_MS).toBe(5 * 60 * 1000);
  });

  // Diamond N Fix N-A2: synthesizedAt entries route to alive regardless of claudePid/age
  test('synthesizedAt entry with no claudePid routes to aliveIds (not stale)', () => {
    const now = 1_700_000_000_000;
    const sessions: RegistryEntry[] = [
      mkEntry('discovered-old', {
        claudePid: undefined,
        spawnedAt: now - 10 * 24 * 60 * 60 * 1000, // 10 days ago
        synthesizedAt: now - 5_000,
      }),
    ];
    const result = probeLivenessTick(sessions, now);
    expect(result.aliveIds).toEqual(['discovered-old']);
    expect(result.staleIds).toEqual([]);
    expect(result.offlineIds).toEqual([]);
  });

  test('synthesizedAt entry takes precedence over claudePid path', () => {
    const now = 1_700_000_000_000;
    killSpy.mockImplementation((() => {
      const err = new Error('no such process') as NodeJS.ErrnoException;
      err.code = 'ESRCH';
      throw err;
    }) as unknown as typeof process.kill);
    const sessions: RegistryEntry[] = [
      mkEntry('discovered-with-stale-pid', {
        claudePid: 99999,
        spawnedAt: now - 10_000,
        synthesizedAt: now - 5_000,
      }),
    ];
    const result = probeLivenessTick(sessions, now);
    expect(result.aliveIds).toEqual(['discovered-with-stale-pid']);
    expect(result.offlineIds).toEqual([]);
  });
});
