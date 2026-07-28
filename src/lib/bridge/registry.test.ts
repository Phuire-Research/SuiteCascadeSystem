import * as fsActual from 'node:fs/promises';
import * as pathsActual from './paths';
import {
  addSession,
  markSessionOffline,
  removeSession,
  setSessionDisplayName,
  setSessionPreferredScp,
  setSessionScpAffinity,
} from './registry';
import type { RegistryEntry, SessionMeta } from './types';

jest.mock('node:fs/promises', () => ({
  mkdir: jest.fn(),
  readFile: jest.fn(),
  writeFile: jest.fn(),
  rename: jest.fn(),
}));

jest.mock('./paths', () => ({
  bridgeRoot: jest.fn(() => '/mock/bridge-root'),
  registryPath: jest.fn(() => '/mock/bridge-root/registry.json'),
  metaPath: jest.fn((id: string) => `/mock/bridge-root/sessions/${id}/meta.json`),
}));

const fs = fsActual as unknown as {
  mkdir: jest.Mock;
  readFile: jest.Mock;
  writeFile: jest.Mock;
  rename: jest.Mock;
};

const paths = pathsActual as unknown as {
  bridgeRoot: jest.Mock;
  registryPath: jest.Mock;
  metaPath: jest.Mock;
};

beforeEach(() => {
  fs.mkdir.mockReset();
  fs.mkdir.mockResolvedValue(undefined);
  fs.readFile.mockReset();
  fs.writeFile.mockReset();
  fs.writeFile.mockResolvedValue(undefined);
  fs.rename.mockReset();
  fs.rename.mockResolvedValue(undefined);
  paths.bridgeRoot.mockClear();
  paths.registryPath.mockClear();
  paths.metaPath.mockClear();
});

const mkEntry = (overrides: Partial<RegistryEntry> = {}): RegistryEntry => ({
  id: 'TESTULID',
  claudeSessionId: 'uuid-A',
  claudePid: 12345,
  spawnedAt: 1714834000000,
  status: 'launched',
  cwd: '/test/cwd',
  ...overrides,
});

describe('markSessionOffline (Diamond K)', () => {
  test('sets status="offline" and clears claudePid; preserves claudeSessionId + cwd', async () => {
    const entry = mkEntry({
      id: 'A1',
      claudePid: 9999,
      cwd: '/work/dir',
      claudeSessionId: 'cuid-A',
    });
    fs.readFile.mockResolvedValue(JSON.stringify({ sessions: [entry] }));

    await markSessionOffline('A1');

    expect(fs.writeFile).toHaveBeenCalledTimes(1);
    const writtenJson = fs.writeFile.mock.calls[0][1] as string;
    const parsed = JSON.parse(writtenJson) as { sessions: RegistryEntry[] };
    expect(parsed.sessions).toHaveLength(1);
    expect(parsed.sessions[0].id).toBe('A1');
    expect(parsed.sessions[0].status).toBe('offline');
    expect(parsed.sessions[0].claudePid).toBeUndefined();
    expect(parsed.sessions[0].claudeSessionId).toBe('cuid-A');
    expect(parsed.sessions[0].cwd).toBe('/work/dir');
    expect(fs.rename).toHaveBeenCalled();
  });

  test('idempotent: entry without claudePid still ends as offline', async () => {
    const entry = mkEntry({ id: 'A2', claudePid: undefined, status: 'allocated' });
    fs.readFile.mockResolvedValue(JSON.stringify({ sessions: [entry] }));

    await markSessionOffline('A2');

    const writtenJson = fs.writeFile.mock.calls[0][1] as string;
    const parsed = JSON.parse(writtenJson) as { sessions: RegistryEntry[] };
    expect(parsed.sessions[0].status).toBe('offline');
    expect(parsed.sessions[0].claudePid).toBeUndefined();
  });

  test('no-op when ULID is not found in registry (no write)', async () => {
    const entry = mkEntry({ id: 'A3' });
    fs.readFile.mockResolvedValue(JSON.stringify({ sessions: [entry] }));

    await markSessionOffline('NOT-PRESENT');

    expect(fs.writeFile).not.toHaveBeenCalled();
    expect(fs.rename).not.toHaveBeenCalled();
  });

  test('atomic write: writes to .tmp then rename to final path', async () => {
    const entry = mkEntry({ id: 'A4' });
    fs.readFile.mockResolvedValue(JSON.stringify({ sessions: [entry] }));

    await markSessionOffline('A4');

    expect(fs.writeFile).toHaveBeenCalledWith(
      '/mock/bridge-root/registry.json.tmp',
      expect.any(String),
      'utf8',
    );
    expect(fs.rename).toHaveBeenCalledWith(
      '/mock/bridge-root/registry.json.tmp',
      '/mock/bridge-root/registry.json',
    );
  });
});

describe('removeSession (regression — still removes row entirely)', () => {
  test('filters target ULID from sessions array', async () => {
    const a = mkEntry({ id: 'KEEP' });
    const b = mkEntry({ id: 'REMOVE' });
    fs.readFile.mockResolvedValue(JSON.stringify({ sessions: [a, b] }));

    await removeSession('REMOVE');

    const writtenJson = fs.writeFile.mock.calls[0][1] as string;
    const parsed = JSON.parse(writtenJson) as { sessions: RegistryEntry[] };
    expect(parsed.sessions).toHaveLength(1);
    expect(parsed.sessions[0].id).toBe('KEEP');
  });
});

describe('Diamond M Fix M-2 — async write-chain mutex', () => {
  test('5 concurrent addSession calls serialize through the chain (no interleave)', async () => {
    // In-memory state simulates the on-disk registry. Each load reads it; each
    // save mutates it. Without the mutex, two concurrent calls both load the
    // same snapshot and only one survives. With the mutex, all 5 land.
    let onDisk: { sessions: RegistryEntry[] } = { sessions: [] };
    let activeWrites = 0;
    let maxConcurrent = 0;

    fs.readFile.mockImplementation(async () => JSON.stringify(onDisk));
    fs.writeFile.mockImplementation(async (_path: string, data: string) => {
      activeWrites++;
      maxConcurrent = Math.max(maxConcurrent, activeWrites);
      // Yield to let any concurrent call attempt to overlap.
      await new Promise<void>((r) => setImmediate(r));
      onDisk = JSON.parse(data) as { sessions: RegistryEntry[] };
      activeWrites--;
    });
    fs.rename.mockResolvedValue(undefined);

    const ids = ['M1', 'M2', 'M3', 'M4', 'M5'];
    await Promise.all(ids.map((id) => addSession(mkEntry({ id, claudeSessionId: `c-${id}` }))));

    expect(onDisk.sessions).toHaveLength(5);
    const writtenIds = onDisk.sessions.map((s) => s.id).sort();
    expect(writtenIds).toEqual(ids.sort());
    expect(maxConcurrent).toBe(1);
  });

  test('failing write does NOT poison subsequent mutations (per-link .catch)', async () => {
    let onDisk: { sessions: RegistryEntry[] } = { sessions: [{ ...mkEntry({ id: 'PRE' }) }] };
    let writeCallCount = 0;

    fs.readFile.mockImplementation(async () => JSON.stringify(onDisk));
    fs.writeFile.mockImplementation(async (_path: string, data: string) => {
      writeCallCount++;
      if (writeCallCount === 1) {
        throw new Error('disk-full-simulated');
      }
      onDisk = JSON.parse(data) as { sessions: RegistryEntry[] };
    });
    fs.rename.mockResolvedValue(undefined);

    // First call rejects internally (caught by chain). Chain still alive.
    await addSession(mkEntry({ id: 'WILL-FAIL' }));
    // Subsequent call must still succeed.
    await addSession(mkEntry({ id: 'AFTER', claudeSessionId: 'c-after' }));

    expect(onDisk.sessions.some((s) => s.id === 'AFTER')).toBe(true);
  });
});

describe('Diamond Q — setSessionDisplayName (User-Sourced Identification Diameter)', () => {
  test('sets displayName on a known ulid', async () => {
    const entry = mkEntry({ id: 'Q1' });
    fs.readFile.mockResolvedValue(JSON.stringify({ sessions: [entry] }));

    await setSessionDisplayName('Q1', 'Workbench');

    expect(fs.writeFile).toHaveBeenCalledTimes(1);
    const writtenJson = fs.writeFile.mock.calls[0][1] as string;
    const parsed = JSON.parse(writtenJson) as { sessions: RegistryEntry[] };
    expect(parsed.sessions[0].displayName).toBe('Workbench');
  });

  test('clears displayName when given empty trimmed string', async () => {
    const entry = mkEntry({ id: 'Q2', displayName: 'OldName' });
    fs.readFile.mockResolvedValue(JSON.stringify({ sessions: [entry] }));

    await setSessionDisplayName('Q2', '   ');

    const writtenJson = fs.writeFile.mock.calls[0][1] as string;
    const parsed = JSON.parse(writtenJson) as { sessions: RegistryEntry[] };
    expect(parsed.sessions[0].displayName).toBeUndefined();
  });

  test('clears displayName when given undefined', async () => {
    const entry = mkEntry({ id: 'Q3', displayName: 'StaleName' });
    fs.readFile.mockResolvedValue(JSON.stringify({ sessions: [entry] }));

    await setSessionDisplayName('Q3', undefined);

    const writtenJson = fs.writeFile.mock.calls[0][1] as string;
    const parsed = JSON.parse(writtenJson) as { sessions: RegistryEntry[] };
    expect(parsed.sessions[0].displayName).toBeUndefined();
  });

  test('no-ops when ulid is missing (no write, no throw)', async () => {
    const entry = mkEntry({ id: 'Q4' });
    fs.readFile.mockResolvedValue(JSON.stringify({ sessions: [entry] }));

    await setSessionDisplayName('NOT-PRESENT', 'AnyName');

    expect(fs.writeFile).not.toHaveBeenCalled();
    expect(fs.rename).not.toHaveBeenCalled();
  });

  test('truncates displayName to 32 chars at write site', async () => {
    const entry = mkEntry({ id: 'Q5' });
    fs.readFile.mockResolvedValue(JSON.stringify({ sessions: [entry] }));

    const longName = 'a'.repeat(50);
    await setSessionDisplayName('Q5', longName);

    const writtenJson = fs.writeFile.mock.calls[0][1] as string;
    const parsed = JSON.parse(writtenJson) as { sessions: RegistryEntry[] };
    expect(parsed.sessions[0].displayName).toHaveLength(32);
    expect(parsed.sessions[0].displayName).toBe('a'.repeat(32));
  });
});

describe('SS-P1 · setSessionScpAffinity (Session-Registry-Affinity-Annotation)', () => {
  test('sets scpName on a known ulid and persists to disk', async () => {
    const entry = mkEntry({ id: 'S1' });
    fs.readFile.mockResolvedValue(JSON.stringify({ sessions: [entry] }));

    await setSessionScpAffinity('S1', 'MyProject');

    expect(fs.writeFile).toHaveBeenCalledTimes(1);
    const writtenJson = fs.writeFile.mock.calls[0][1] as string;
    const parsed = JSON.parse(writtenJson) as { sessions: RegistryEntry[] };
    expect(parsed.sessions[0].scpName).toBe('MyProject');
    expect(fs.rename).toHaveBeenCalled();
  });

  test('idempotent — no write when scpName already matches', async () => {
    const entry = mkEntry({ id: 'S2', scpName: 'SameProject' });
    fs.readFile.mockResolvedValue(JSON.stringify({ sessions: [entry] }));

    await setSessionScpAffinity('S2', 'SameProject');

    expect(fs.writeFile).not.toHaveBeenCalled();
    expect(fs.rename).not.toHaveBeenCalled();
  });

  test('updates scpName from old value to new value (mutability path)', async () => {
    const entry = mkEntry({ id: 'S3', scpName: 'OldProject' });
    fs.readFile.mockResolvedValue(JSON.stringify({ sessions: [entry] }));

    await setSessionScpAffinity('S3', 'NewProject');

    const writtenJson = fs.writeFile.mock.calls[0][1] as string;
    const parsed = JSON.parse(writtenJson) as { sessions: RegistryEntry[] };
    expect(parsed.sessions[0].scpName).toBe('NewProject');
  });

  test('no-op when ulid is not found (no write, no throw)', async () => {
    const entry = mkEntry({ id: 'S4' });
    fs.readFile.mockResolvedValue(JSON.stringify({ sessions: [entry] }));

    await setSessionScpAffinity('NOT-PRESENT', 'AnyName');

    expect(fs.writeFile).not.toHaveBeenCalled();
    expect(fs.rename).not.toHaveBeenCalled();
  });

  test('does NOT truncate scpName (unlike displayName 32-char cap)', async () => {
    const entry = mkEntry({ id: 'S5' });
    fs.readFile.mockResolvedValue(JSON.stringify({ sessions: [entry] }));

    const longName = 'a'.repeat(60);
    await setSessionScpAffinity('S5', longName);

    const writtenJson = fs.writeFile.mock.calls[0][1] as string;
    const parsed = JSON.parse(writtenJson) as { sessions: RegistryEntry[] };
    expect(parsed.sessions[0].scpName).toBe(longName);
    expect(parsed.sessions[0].scpName).toHaveLength(60);
  });

  test('preserves other fields on the entry when setting scpName', async () => {
    const entry = mkEntry({
      id: 'S6',
      claudeSessionId: 'preserved-uuid',
      claudePid: 4242,
      displayName: 'PreservedDisplay',
    });
    fs.readFile.mockResolvedValue(JSON.stringify({ sessions: [entry] }));

    await setSessionScpAffinity('S6', 'ProjectName');

    const writtenJson = fs.writeFile.mock.calls[0][1] as string;
    const parsed = JSON.parse(writtenJson) as { sessions: RegistryEntry[] };
    expect(parsed.sessions[0].scpName).toBe('ProjectName');
    expect(parsed.sessions[0].claudeSessionId).toBe('preserved-uuid');
    expect(parsed.sessions[0].claudePid).toBe(4242);
    expect(parsed.sessions[0].displayName).toBe('PreservedDisplay');
  });
});

const mkMeta = (overrides: Partial<SessionMeta> = {}): SessionMeta => ({
  id: 'TESTULID',
  claudeSessionId: 'uuid-A',
  status: 'launched',
  spawnedAt: 1714834000000,
  claudeBinary: 'claude',
  cwd: '/test/cwd',
  ...overrides,
});

describe('SS-Final · setSessionPreferredScp (Session-Preferred-SCP-Memory · SPMEM)', () => {
  test('writes preferredScpName to meta.json on a known ulid', async () => {
    const meta = mkMeta({ id: 'P1' });
    fs.readFile.mockResolvedValue(JSON.stringify(meta));

    await setSessionPreferredScp('P1', 'MyProject');

    expect(fs.writeFile).toHaveBeenCalledTimes(1);
    expect(paths.metaPath).toHaveBeenCalledWith('P1');
    const writtenJson = fs.writeFile.mock.calls[0][1] as string;
    const parsed = JSON.parse(writtenJson) as SessionMeta;
    expect(parsed.preferredScpName).toBe('MyProject');
    expect(fs.rename).toHaveBeenCalled();
  });

  test('idempotent — no write when preferredScpName already matches', async () => {
    const meta = mkMeta({ id: 'P2', preferredScpName: 'SameProject' });
    fs.readFile.mockResolvedValue(JSON.stringify(meta));

    await setSessionPreferredScp('P2', 'SameProject');

    expect(fs.writeFile).not.toHaveBeenCalled();
    expect(fs.rename).not.toHaveBeenCalled();
  });

  test('updates preferredScpName from old value to new value', async () => {
    const meta = mkMeta({ id: 'P3', preferredScpName: 'OldProject' });
    fs.readFile.mockResolvedValue(JSON.stringify(meta));

    await setSessionPreferredScp('P3', 'NewProject');

    const writtenJson = fs.writeFile.mock.calls[0][1] as string;
    const parsed = JSON.parse(writtenJson) as SessionMeta;
    expect(parsed.preferredScpName).toBe('NewProject');
  });

  test('no-op when meta.json file is missing (graceful · no throw)', async () => {
    fs.readFile.mockRejectedValue(Object.assign(new Error('ENOENT'), { code: 'ENOENT' }));

    await expect(setSessionPreferredScp('MISSING-ULID', 'AnyName')).resolves.toBeUndefined();

    expect(fs.writeFile).not.toHaveBeenCalled();
    expect(fs.rename).not.toHaveBeenCalled();
  });

  test('no-op on malformed meta.json (graceful · no throw)', async () => {
    fs.readFile.mockResolvedValue('not valid json {');

    await expect(setSessionPreferredScp('P5', 'AnyName')).resolves.toBeUndefined();

    expect(fs.writeFile).not.toHaveBeenCalled();
    expect(fs.rename).not.toHaveBeenCalled();
  });

  test('uses atomic tmp+rename write pattern (cross-process safety)', async () => {
    const meta = mkMeta({ id: 'P6' });
    fs.readFile.mockResolvedValue(JSON.stringify(meta));

    await setSessionPreferredScp('P6', 'AtomicProject');

    expect(fs.writeFile).toHaveBeenCalledTimes(1);
    expect(fs.rename).toHaveBeenCalledTimes(1);
    const tmpPath = fs.writeFile.mock.calls[0][0] as string;
    const finalPath = fs.rename.mock.calls[0][1] as string;
    expect(tmpPath.endsWith('.tmp')).toBe(true);
    expect(finalPath).toBe('/mock/bridge-root/sessions/P6/meta.json');
  });

  test('preserves other SessionMeta fields when setting preferredScpName', async () => {
    const meta = mkMeta({
      id: 'P7',
      claudeSessionId: 'preserved-uuid',
      claudePid: 9999,
      scpName: 'CurrentProject',
      launchedAt: 1714999999999,
    });
    fs.readFile.mockResolvedValue(JSON.stringify(meta));

    await setSessionPreferredScp('P7', 'PreferredProject');

    const writtenJson = fs.writeFile.mock.calls[0][1] as string;
    const parsed = JSON.parse(writtenJson) as SessionMeta;
    expect(parsed.preferredScpName).toBe('PreferredProject');
    expect(parsed.claudeSessionId).toBe('preserved-uuid');
    expect(parsed.claudePid).toBe(9999);
    expect(parsed.scpName).toBe('CurrentProject');
    expect(parsed.launchedAt).toBe(1714999999999);
  });
});
