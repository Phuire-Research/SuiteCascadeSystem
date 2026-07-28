import * as fsActual from 'node:fs/promises';
import * as pathsActual from './paths';
import { setDebugEnabled } from './debugLog';
import { buildSpawnSettings, buildInstallSpawnSettings, writeSpawnSettings } from './spawnSettings';

jest.mock('node:fs/promises', () => ({
  writeFile: jest.fn(),
  // ReEngage recurse: writeSpawnSettings now mkdirs the session dir before writing.
  mkdir: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('./paths', () => ({
  spawnSettingsPath: jest.fn((id: string) => `/mock/sessions/${id}/spawn-settings.json`),
  sessionDir: jest.fn((id: string) => `/mock/sessions/${id}`),
}));

const fs = fsActual as unknown as { writeFile: jest.Mock };
const paths = pathsActual as unknown as { spawnSettingsPath: jest.Mock };

const ORIGINAL_EXEC_PATH = process.execPath;
const ORIGINAL_ARGV = [...process.argv];

beforeEach(() => {
  fs.writeFile.mockReset();
  fs.writeFile.mockResolvedValue(undefined);
  paths.spawnSettingsPath.mockClear();
  paths.spawnSettingsPath.mockImplementation(
    (id: string) => `/mock/sessions/${id}/spawn-settings.json`,
  );
  Object.defineProperty(process, 'execPath', {
    value: '/mock/node',
    configurable: true,
  });
  process.argv = ['/mock/node', '/mock/dist/cli.cjs'];
});

afterEach(() => {
  Object.defineProperty(process, 'execPath', { value: ORIGINAL_EXEC_PATH, configurable: true });
  process.argv = ORIGINAL_ARGV;
});

describe('buildSpawnSettings', () => {
  it('returns shape with hooks.SessionStart[0].hooks[0]', () => {
    const settings = buildSpawnSettings('TESTULIDXYZ');
    expect(settings.hooks.SessionStart).toBeInstanceOf(Array);
    expect(settings.hooks.SessionStart[0].hooks[0]).toEqual({
      type: 'command',
      command: 'SCS_BRIDGE_ULID=TESTULIDXYZ /mock/node /mock/dist/cli.cjs __hook session-start',
    });
  });

  it('returns shape with hooks.SessionEnd[0].hooks[0] (Diamond K)', () => {
    const settings = buildSpawnSettings('TESTULIDXYZ');
    expect(settings.hooks.SessionEnd).toBeInstanceOf(Array);
    expect(settings.hooks.SessionEnd[0].hooks[0]).toEqual({
      type: 'command',
      command: 'SCS_BRIDGE_ULID=TESTULIDXYZ /mock/node /mock/dist/cli.cjs __hook session-end',
    });
  });

  it('command includes SCS_BRIDGE_ULID env prefix with session id, then execPath and cli path', () => {
    const settings = buildSpawnSettings('MY-ULID-123');
    expect(settings.hooks.SessionStart[0].hooks[0].command).toBe(
      'SCS_BRIDGE_ULID=MY-ULID-123 /mock/node /mock/dist/cli.cjs __hook session-start',
    );
    expect(settings.hooks.SessionEnd[0].hooks[0].command).toBe(
      'SCS_BRIDGE_ULID=MY-ULID-123 /mock/node /mock/dist/cli.cjs __hook session-end',
    );
  });

  it('embeds different session ids correctly', () => {
    const a = buildSpawnSettings('ULID-A');
    const b = buildSpawnSettings('ULID-B');
    expect(a.hooks.SessionStart[0].hooks[0].command).toContain('SCS_BRIDGE_ULID=ULID-A');
    expect(b.hooks.SessionStart[0].hooks[0].command).toContain('SCS_BRIDGE_ULID=ULID-B');
    expect(a.hooks.SessionEnd[0].hooks[0].command).toContain('SCS_BRIDGE_ULID=ULID-A');
    expect(b.hooks.SessionEnd[0].hooks[0].command).toContain('SCS_BRIDGE_ULID=ULID-B');
  });
});

// Diamond N Fix N-C: SCS_BRIDGE_DEBUG env-prefix injection
describe('Diamond N Fix N-C — debug env-prefix injection', () => {
  afterEach(() => {
    setDebugEnabled(false);
  });

  it('omits SCS_BRIDGE_DEBUG when debug mode is disabled (default)', () => {
    setDebugEnabled(false);
    const settings = buildSpawnSettings('TESTULIDXYZ');
    expect(settings.hooks.SessionStart[0].hooks[0].command).not.toContain('SCS_BRIDGE_DEBUG');
    expect(settings.hooks.SessionEnd[0].hooks[0].command).not.toContain('SCS_BRIDGE_DEBUG');
  });

  it('injects SCS_BRIDGE_DEBUG=1 prefix for both hooks when debug enabled', () => {
    setDebugEnabled(true);
    const settings = buildSpawnSettings('TESTULIDXYZ');
    expect(settings.hooks.SessionStart[0].hooks[0].command).toBe(
      'SCS_BRIDGE_DEBUG=1 SCS_BRIDGE_ULID=TESTULIDXYZ /mock/node /mock/dist/cli.cjs __hook session-start',
    );
    expect(settings.hooks.SessionEnd[0].hooks[0].command).toBe(
      'SCS_BRIDGE_DEBUG=1 SCS_BRIDGE_ULID=TESTULIDXYZ /mock/node /mock/dist/cli.cjs __hook session-end',
    );
  });

  it('debug prefix precedes ULID prefix in env ordering', () => {
    setDebugEnabled(true);
    const settings = buildSpawnSettings('ULID-DEBUG');
    const command = settings.hooks.SessionStart[0].hooks[0].command;
    const debugIdx = command.indexOf('SCS_BRIDGE_DEBUG=1');
    const ulidIdx = command.indexOf('SCS_BRIDGE_ULID=');
    expect(debugIdx).toBeGreaterThanOrEqual(0);
    expect(ulidIdx).toBeGreaterThan(debugIdx);
  });
});

describe('buildInstallSpawnSettings', () => {
  it('returns SessionStart array with exactly 2 entries', () => {
    const settings = buildInstallSpawnSettings({
      sessionId: 'INSTALL-ULID',
      tempDir: '/tmp/scs-install-abc',
    });
    expect(settings.hooks.SessionStart).toHaveLength(2);
  });

  it('first SessionStart entry contains __hook register-install', () => {
    const settings = buildInstallSpawnSettings({
      sessionId: 'INSTALL-ULID',
      tempDir: '/tmp/scs-install-abc',
    });
    expect(settings.hooks.SessionStart[0].hooks[0].command).toContain('__hook register-install');
  });

  it('second SessionStart entry contains __hook user-prompt-submit-install', () => {
    const settings = buildInstallSpawnSettings({
      sessionId: 'INSTALL-ULID',
      tempDir: '/tmp/scs-install-abc',
    });
    expect(settings.hooks.SessionStart[1].hooks[0].command).toContain(
      '__hook user-prompt-submit-install',
    );
  });

  it('second SessionStart entry contains SCS_BRIDGE_INSTALL_TEMP (Fix 3)', () => {
    const settings = buildInstallSpawnSettings({
      sessionId: 'INSTALL-ULID',
      tempDir: '/tmp/scs-install-abc',
    });
    expect(settings.hooks.SessionStart[1].hooks[0].command).toContain(
      'SCS_BRIDGE_INSTALL_TEMP=/tmp/scs-install-abc',
    );
  });

  it('first SessionStart entry also contains SCS_BRIDGE_INSTALL_TEMP', () => {
    const settings = buildInstallSpawnSettings({
      sessionId: 'INSTALL-ULID',
      tempDir: '/tmp/scs-install-abc',
    });
    expect(settings.hooks.SessionStart[0].hooks[0].command).toContain(
      'SCS_BRIDGE_INSTALL_TEMP=/tmp/scs-install-abc',
    );
  });

  it('propagates debugPrefix to both install hook commands (Fix 3)', () => {
    setDebugEnabled(true);
    const settings = buildInstallSpawnSettings({
      sessionId: 'INSTALL-ULID',
      tempDir: '/tmp/scs-install-abc',
    });
    expect(settings.hooks.SessionStart[0].hooks[0].command).toContain('SCS_BRIDGE_DEBUG=1');
    expect(settings.hooks.SessionStart[1].hooks[0].command).toContain('SCS_BRIDGE_DEBUG=1');
    setDebugEnabled(false);
  });

  it('SessionEnd array has 1 entry pointing to session-end (regression: install uses same end hook)', () => {
    const settings = buildInstallSpawnSettings({
      sessionId: 'INSTALL-ULID',
      tempDir: '/tmp/scs-install-abc',
    });
    expect(settings.hooks.SessionEnd).toHaveLength(1);
    expect(settings.hooks.SessionEnd[0].hooks[0].command).toContain('__hook session-end');
  });
});

describe('buildSpawnSettings regression — install-mode does NOT affect normal mode', () => {
  it('buildSpawnSettings SessionStart still has exactly 1 entry', () => {
    const settings = buildSpawnSettings('NORMAL-ULID');
    expect(settings.hooks.SessionStart).toHaveLength(1);
  });

  it('buildSpawnSettings SessionStart contains session-start (not register-install)', () => {
    const settings = buildSpawnSettings('NORMAL-ULID');
    expect(settings.hooks.SessionStart[0].hooks[0].command).toContain('__hook session-start');
    expect(settings.hooks.SessionStart[0].hooks[0].command).not.toContain('register-install');
  });

  // Diamond B-8 Fix 2 (PTS): regression — session-mode never carries permissions slot.
  it('buildSpawnSettings does NOT include permissions slot (session-mode unaffected)', () => {
    const settings = buildSpawnSettings('NORMAL-ULID');
    expect(settings.permissions).toBeUndefined();
  });
});

// Diamond B-8 Fix 2 (PTS): install-scope targeted permission allow-rules.
describe('Diamond B-8 Fix 2 — buildInstallSpawnSettings permissions.allow', () => {
  it('install-mode includes permissions.allow array', () => {
    const settings = buildInstallSpawnSettings({
      sessionId: 'INSTALL-ULID',
      tempDir: '/tmp/scs-install-abc',
    });
    expect(settings.permissions).toBeDefined();
    expect(Array.isArray(settings.permissions?.allow)).toBe(true);
    expect((settings.permissions?.allow ?? []).length).toBeGreaterThanOrEqual(9);
  });

  it('permissions.allow includes Cascades write rule and bash install rules', () => {
    const settings = buildInstallSpawnSettings({
      sessionId: 'INSTALL-ULID',
      tempDir: '/tmp/scs-install-abc',
    });
    const allow = settings.permissions?.allow ?? [];
    // C590 · THE EDIT-RULE LAW — Edit(path) covers all file-editing tools; Write() rules are dead.
    expect(allow.some((rule) => rule.includes('Edit(') && rule.includes('/Cascades/**'))).toBe(
      true,
    );
    expect(allow).toContain('Bash(git clone *)');
    expect(allow).toContain('Bash(cp -R *)');
    expect(allow).toContain('Bash(mkdir -p *)');
    expect(allow).toContain('Bash(test -d *)');
    expect(allow).toContain('Bash(test -f *)');
  });
});

describe('writeSpawnSettings', () => {
  it('calls writeFile with spawnSettingsPath result and JSON-stringified settings containing ULID', async () => {
    await writeSpawnSettings('MYULID');
    expect(paths.spawnSettingsPath).toHaveBeenCalledWith('MYULID');
    expect(fs.writeFile).toHaveBeenCalledWith(
      '/mock/sessions/MYULID/spawn-settings.json',
      expect.stringContaining('SessionStart'),
      'utf8',
    );
    const writtenJson = fs.writeFile.mock.calls[0][1] as string;
    const parsed = JSON.parse(writtenJson);
    expect(parsed.hooks.SessionStart[0].hooks[0].type).toBe('command');
    expect(parsed.hooks.SessionStart[0].hooks[0].command).toContain('SCS_BRIDGE_ULID=MYULID');
    expect(parsed.hooks.SessionEnd[0].hooks[0].type).toBe('command');
    expect(parsed.hooks.SessionEnd[0].hooks[0].command).toContain('SCS_BRIDGE_ULID=MYULID');
    expect(parsed.hooks.SessionEnd[0].hooks[0].command).toContain('__hook session-end');
  });

  it('returns the path returned by spawnSettingsPath', async () => {
    const result = await writeSpawnSettings('XYZ123');
    expect(result).toBe('/mock/sessions/XYZ123/spawn-settings.json');
  });
});
