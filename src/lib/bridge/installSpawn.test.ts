import * as childProcess from 'node:child_process';
import * as fs from 'node:fs';
import * as fsp from 'node:fs/promises';
import * as os from 'node:os';
import * as path from 'node:path';

jest.mock('node:child_process');
jest.mock('node:fs');
jest.mock('node:fs/promises');
jest.mock('node:os');
jest.mock('./spawnSettings', () => ({
  buildInstallSpawnSettings: jest.fn(() => ({ hooks: { SessionStart: [], SessionEnd: [] } })),
}));
// SCS Install Epoch D1 · W4 · the install spawn surface swapped from osTerminal
// (buildTerminalCommand + child_process.spawn) to the Electron xterm window
// (spawnElectronInstallInstance). Mock that relay instead of osTerminal/spawn.
jest.mock('./electronSessionSpawn', () => ({
  spawnElectronInstallInstance: jest.fn(() => ({ pid: 12345, unref: jest.fn() })),
}));

import {
  cloneScsBridge,
  backupUserClaudeMd,
  backupUserDotClaudeAgents,
  assembleJoinedSuite8,
  copyScsPromptTemplate,
  spawnInstallInstance,
  cleanupInstallTemp,
  runInstallSpawnPipeline,
  pollScaffoldComplete,
} from './installSpawn';
import { spawnElectronInstallInstance } from './electronSessionSpawn';

const mockExecFile = childProcess.execFile as unknown as jest.Mock;
const mockExistsSync = fs.existsSync as unknown as jest.Mock;
const mockReadFileSync = fs.readFileSync as unknown as jest.Mock;
const mockWriteFileSync = fs.writeFileSync as unknown as jest.Mock;
const mockCpSync = fs.cpSync as unknown as jest.Mock;
const mockRmSync = fs.rmSync as unknown as jest.Mock;
const mockMkdtemp = fsp.mkdtemp as unknown as jest.Mock;
const mockWriteFile = fsp.writeFile as unknown as jest.Mock;
const mockTmpdir = os.tmpdir as unknown as jest.Mock;
const mockSpawnElectronInstallInstance =
  spawnElectronInstallInstance as unknown as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
  mockTmpdir.mockReturnValue('/tmp');
  mockWriteFile.mockResolvedValue(undefined);
  mockMkdtemp.mockResolvedValue('/tmp/scs-install-abc123');
});

describe('cloneScsBridge', () => {
  it('calls execFile with git clone --depth=1', async () => {
    mockExecFile.mockImplementation((_cmd: string, _args: string[], cb: (err: null) => void) =>
      cb(null),
    );
    const result = await cloneScsBridge('https://github.com/example/repo', '/tmp/mytemp');
    expect(mockExecFile).toHaveBeenCalledWith(
      'git',
      ['clone', '--depth=1', 'https://github.com/example/repo', '/tmp/mytemp/clone'],
      expect.any(Function),
    );
    expect(result.clonePath).toBe('/tmp/mytemp/clone');
  });

  it('throws git-not-found message on ENOENT', async () => {
    const err = Object.assign(new Error('spawn git ENOENT'), { code: 'ENOENT' });
    mockExecFile.mockImplementation((_cmd: string, _args: string[], cb: (err: Error) => void) =>
      cb(err),
    );
    await expect(cloneScsBridge('https://example.com/repo', '/tmp/mytemp')).rejects.toThrow(
      'git executable not found; install git first',
    );
  });

  it('throws clone-fail message on non-zero exit (Fix 1 regression)', async () => {
    const err = Object.assign(new Error('exit 128'), { code: 128, stderr: 'Repository not found' });
    mockExecFile.mockImplementation((_cmd: string, _args: string[], cb: (err: Error) => void) =>
      cb(err),
    );
    await expect(cloneScsBridge('https://example.com/repo', '/tmp/mytemp')).rejects.toThrow(
      'git clone failed:',
    );
  });

  it('ENOENT message is distinct from clone-fail message (Fix 1)', async () => {
    const enoentErr = Object.assign(new Error('spawn git ENOENT'), { code: 'ENOENT' });
    mockExecFile.mockImplementation((_cmd: string, _args: string[], cb: (err: Error) => void) =>
      cb(enoentErr),
    );
    let enoentMsg = '';
    try {
      await cloneScsBridge('https://example.com/repo', '/tmp/mytemp');
    } catch (e) {
      enoentMsg = (e as Error).message;
    }

    const nonZeroErr = Object.assign(new Error('exit 128'), {
      code: 128,
      stderr: 'fatal: repo not found',
    });
    mockExecFile.mockImplementation((_cmd: string, _args: string[], cb: (err: Error) => void) =>
      cb(nonZeroErr),
    );
    let cloneFailMsg = '';
    try {
      await cloneScsBridge('https://example.com/repo', '/tmp/mytemp');
    } catch (e) {
      cloneFailMsg = (e as Error).message;
    }

    expect(enoentMsg).not.toBe(cloneFailMsg);
    expect(enoentMsg).toContain('git executable not found');
    expect(cloneFailMsg).toContain('git clone failed');
  });
});

describe('backupUserClaudeMd', () => {
  it('returns originalExists: false when CLAUDE.md absent', () => {
    mockExistsSync.mockReturnValue(false);
    const result = backupUserClaudeMd('/user/project', '/tmp/mytemp');
    expect(result.originalExists).toBe(false);
    expect(result.backupPath).toBe('');
    expect(mockReadFileSync).not.toHaveBeenCalled();
  });

  it('reads source and writes verbatim to backup path', () => {
    mockExistsSync.mockReturnValue(true);
    const fakeContent = Buffer.from('# My CLAUDE.md content');
    mockReadFileSync.mockReturnValue(fakeContent);
    const result = backupUserClaudeMd('/user/project', '/tmp/mytemp');
    expect(mockReadFileSync).toHaveBeenCalledWith('/user/project/CLAUDE.md');
    expect(mockWriteFileSync).toHaveBeenCalledWith('/tmp/mytemp/user-CLAUDE.md.bak', fakeContent);
    expect(result.originalExists).toBe(true);
    expect(result.backupPath).toBe('/tmp/mytemp/user-CLAUDE.md.bak');
  });
});

describe('backupUserDotClaudeAgents', () => {
  it('returns originalExists: false and no-op when .claude/agents/ absent', () => {
    mockExistsSync.mockReturnValue(false);
    const result = backupUserDotClaudeAgents('/user/project', '/tmp/mytemp');
    expect(result.originalExists).toBe(false);
    expect(result.backupPath).toBe('');
    expect(mockCpSync).not.toHaveBeenCalled();
  });

  it('cpSync to agents.bak when .claude/agents/ present', () => {
    mockExistsSync.mockReturnValue(true);
    const result = backupUserDotClaudeAgents('/user/project', '/tmp/mytemp');
    expect(mockCpSync).toHaveBeenCalledWith(
      '/user/project/.claude/agents',
      '/tmp/mytemp/agents.bak',
      { recursive: true },
    );
    expect(result.originalExists).toBe(true);
    expect(result.backupPath).toBe('/tmp/mytemp/agents.bak');
  });
});

describe('assembleJoinedSuite8', () => {
  it('reads 12 source files and writes joined blob with section headers (C787 sheds retired S10)', () => {
    mockReadFileSync.mockReturnValue('content');
    const result = assembleJoinedSuite8('/tmp/mytemp/clone', '/tmp/mytemp');
    expect(mockReadFileSync).toHaveBeenCalledTimes(12);
    const written: string = mockWriteFileSync.mock.calls[0][1] as string;
    expect(written).toContain('## Suite 8 SCS Bridge — Instance.md');
    expect(written).toContain('## Suite 8 SCS Bridge — Conductor.md');
    expect(written).toContain('## Suite 8 SCS Bridge — Strategy/S1-DetectCascadesPresence.md');
    expect(written).toContain('## Suite 8 SCS Bridge — Strategy/S6-CleanupTempDir.md');
    expect(written).toContain('## Suite 8 SCS Bridge — Strategy/S7-MuxifyUserClaudeMd.md');
    expect(written).toContain('## Suite 8 SCS Bridge — Strategy/S8-StratidianWelcome.md');
    expect(written).toContain('## Suite 8 SCS Bridge — Strategy/S9-DomainPageCreate.md');
    expect(written).not.toContain('S10-HomePageAdapt');
  });

  it('returns joinedPath ending with joined-suite-8-scs-bridge.md', () => {
    mockReadFileSync.mockReturnValue('content');
    const result = assembleJoinedSuite8('/tmp/mytemp/clone', '/tmp/mytemp');
    expect(result.joinedPath).toMatch(/joined-suite-8-scs-bridge\.md$/);
  });

  it('returns lineCount > 0', () => {
    mockReadFileSync.mockReturnValue('line1\nline2\nline3');
    const result = assembleJoinedSuite8('/tmp/mytemp/clone', '/tmp/mytemp');
    expect(result.lineCount).toBeGreaterThan(0);
  });
});

describe('spawnInstallInstance — routes to the Electron install window (D1 swap)', () => {
  it('calls spawnElectronInstallInstance with the install descriptor envelope', () => {
    mockSpawnElectronInstallInstance.mockReturnValue({ pid: 12345, unref: jest.fn() });

    const result = spawnInstallInstance({
      ulid: 'ABC123',
      cwd: '/user/project',
      joinedFilePath: '/tmp/mytemp/joined-suite-8-scs-bridge.md',
      spawnSettingsPath: '/tmp/mytemp/spawn-settings.json',
      seedPrompt: 'install seed directive',
    });

    // §1.5/§1.6 · the joined Suite 8 is the --append-system-prompt-file, the spawn
    // settings are the --settings path, the user cwd flows through, and the ULID
    // keys the Electron session registry.
    expect(mockSpawnElectronInstallInstance).toHaveBeenCalledWith(
      'ABC123',
      expect.objectContaining({
        cwd: '/user/project',
        appendSystemPromptFilePath: '/tmp/mytemp/joined-suite-8-scs-bridge.md',
        settingsPath: '/tmp/mytemp/spawn-settings.json',
        seedPrompt: 'install seed directive',
      }),
    );
    // {pid} return shape preserved so the three pipelines call unchanged.
    expect(result.pid).toBe(12345);
  });

  it('threads SCS_BRIDGE_ROOT_OVERRIDE as bridgeRootOverride (RBJP · §3)', () => {
    mockSpawnElectronInstallInstance.mockReturnValue({ pid: 999, unref: jest.fn() });
    const prev = process.env.SCS_BRIDGE_ROOT_OVERRIDE;
    process.env.SCS_BRIDGE_ROOT_OVERRIDE = '/bridge/junction';
    try {
      spawnInstallInstance({
        ulid: 'ROOTTEST',
        cwd: '/user/project',
        joinedFilePath: '/tmp/joined.md',
        spawnSettingsPath: '/tmp/spawn-settings.json',
      });
      expect(mockSpawnElectronInstallInstance).toHaveBeenCalledWith(
        'ROOTTEST',
        expect.objectContaining({ bridgeRootOverride: '/bridge/junction' }),
      );
    } finally {
      if (prev === undefined) delete process.env.SCS_BRIDGE_ROOT_OVERRIDE;
      else process.env.SCS_BRIDGE_ROOT_OVERRIDE = prev;
    }
  });
});

describe('cleanupInstallTemp', () => {
  it('calls rmSync with recursive: true, force: true', () => {
    cleanupInstallTemp('/tmp/mytemp');
    expect(mockRmSync).toHaveBeenCalledWith('/tmp/mytemp', { recursive: true, force: true });
  });
});

describe('pollScaffoldComplete', () => {
  it('resolves {done: true, payload} when flag appears before timeout', async () => {
    const flagPayload = JSON.stringify({
      done: true,
      timestamp: 12345,
      cascadesCount: 3,
      dotClaudeCount: 5,
    });
    mockExistsSync.mockReturnValue(false);
    const resultPromise = pollScaffoldComplete('/tmp/scs-test', 500, 10);
    setTimeout(() => {
      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue(flagPayload);
    }, 20);
    const result = await resultPromise;
    expect(result.done).toBe(true);
    expect(result.payload).toBeDefined();
    expect((result.payload as Record<string, unknown>).cascadesCount).toBe(3);
  });

  it('resolves {done: false} when flag is absent at timeout', async () => {
    mockExistsSync.mockReturnValue(false);
    const result = await pollScaffoldComplete('/tmp/scs-test', 50, 10);
    expect(result.done).toBe(false);
    expect(result.payload).toBeUndefined();
  });
});

// Diamond B-16 (CD-46 PCSP) RETIREMENT: pollSessionReadyAndTypeahead +
// dispatchTypeahead test blocks removed. The functions they covered are
// retired this Diamond — superseded by positional CLI argument injection
// at spawn time (osTerminal.ts buildTerminalCommand seedPrompt parameter).

describe('SCS_INSTALL_MUXIFY_AGENT_PROMPT — Diamond B-25-UX-fix (drastically shortened · apostrophe-free · shell-quoting-paranoid)', () => {
  it('is plain text (not a slash command) — timing-race immune', async () => {
    const { SCS_INSTALL_MUXIFY_AGENT_PROMPT } = await import('./installConstants');
    expect(SCS_INSTALL_MUXIFY_AGENT_PROMPT.startsWith('/')).toBe(false);
  });

  it('directs install agent to execute Strategy S7 then S8', async () => {
    const { SCS_INSTALL_MUXIFY_AGENT_PROMPT } = await import('./installConstants');
    expect(SCS_INSTALL_MUXIFY_AGENT_PROMPT).toContain('S7');
    expect(SCS_INSTALL_MUXIFY_AGENT_PROMPT).toContain('S8');
  });

  // Diamond δ-2 (FAVPL mitigation): bumped 250 → 1000 chars to accommodate CSDSS
  // fallback instructions. Apostrophe + em-dash tests below still enforce the
  // critical shell-quoting safety properties (those were the actual shell-escape
  // hazards · length was a heuristic proxy).
  // SPP continuous-motion extension (Filled-Test-003 recurse): the seed now carries the full
  // S1-S10 READ directive + the Decision Block. The 1000-char cap was osascript-era paranoia —
  // the install spawns via Electron JSON-argv + shellQuoted pty arg (D1) where length is safe.
  it('Diamond δ: kept reasonably short (under 2000 chars · CSDSS+SPP-extended)', async () => {
    const { SCS_INSTALL_MUXIFY_AGENT_PROMPT } = await import('./installConstants');
    expect(SCS_INSTALL_MUXIFY_AGENT_PROMPT.length).toBeLessThan(2000);
  });

  it('B-25-UX-fix: contains NO apostrophes (defense-in-depth against escape-order regression)', async () => {
    const { SCS_INSTALL_MUXIFY_AGENT_PROMPT } = await import('./installConstants');
    expect(SCS_INSTALL_MUXIFY_AGENT_PROMPT).not.toContain("'");
  });

  it('B-25-UX-fix: contains NO em-dashes (avoid UTF-8 multi-byte fragility at AppleScript boundary)', async () => {
    const { SCS_INSTALL_MUXIFY_AGENT_PROMPT } = await import('./installConstants');
    expect(SCS_INSTALL_MUXIFY_AGENT_PROMPT).not.toContain('—');
  });

  it('B-25-UX-fix2: MANDATES Shatterite menu rendering (AskUserQuestion · do not auto-decide)', async () => {
    const { SCS_INSTALL_MUXIFY_AGENT_PROMPT } = await import('./installConstants');
    expect(SCS_INSTALL_MUXIFY_AGENT_PROMPT).toContain('AskUserQuestion');
    expect(SCS_INSTALL_MUXIFY_AGENT_PROMPT).toContain('Shatterite');
    expect(SCS_INSTALL_MUXIFY_AGENT_PROMPT.toLowerCase()).toContain('user');
  });
});

describe('ICED_MANIFEST_SCHEMA_VERSION — Diamond B-25-UX bumped 2 → 3', () => {
  it('schema version is 3 (B-25-UX added "updated" action enum for Cascade.json cycle tracking)', async () => {
    const { ICED_MANIFEST_SCHEMA_VERSION } = await import('./installConstants');
    expect(ICED_MANIFEST_SCHEMA_VERSION).toBe(3);
  });
});

describe('SCS_PATH_A_PRIMING_PROMPT — Diamond B-15 (CD-44 PASCP) · Diamond ζ Option X /cascade restoration', () => {
  // Diamond ζ Option X (Cycle 97): R0 Obsidian grounding established `/cascade`
  // as the canonical Lambda anchor (GT-1/GT-3). Reverted B-24-FIX's `/scs-cascade`.
  it('exports `/cascade` as Path A priming (ζ: matches canonical anchor · no scs- prefix)', async () => {
    const { SCS_PATH_A_PRIMING_PROMPT } = await import('./installConstants');
    expect(SCS_PATH_A_PRIMING_PROMPT).toBe('/cascade');
  });

  it('Path B SCS_INSTALL_PRIMING_PROMPT remains the verbose Strategy S1 directive', async () => {
    const { SCS_INSTALL_PRIMING_PROMPT } = await import('./installConstants');
    expect(SCS_INSTALL_PRIMING_PROMPT).toContain('SCS Bridge');
    expect(SCS_INSTALL_PRIMING_PROMPT).toContain('Strategy S1');
    // Path B prompt is a paragraph, not a slash command
    expect(SCS_INSTALL_PRIMING_PROMPT.startsWith('/')).toBe(false);
  });
});

describe('SCS_FRESH_CASCADE_JSON — Diamond B-19 (CD-58 BECIS)', () => {
  it('exports a parseable JSON string', async () => {
    const { SCS_FRESH_CASCADE_JSON } = await import('./installConstants');
    expect(() => JSON.parse(SCS_FRESH_CASCADE_JSON)).not.toThrow();
  });

  it('parses to fresh-install state with required fields', async () => {
    const { SCS_FRESH_CASCADE_JSON } = await import('./installConstants');
    const parsed = JSON.parse(SCS_FRESH_CASCADE_JSON);
    expect(parsed.activeDiamond).toBeNull();
    expect(parsed.activeOnyx).toBeNull();
    expect(parsed.colorSelectionComplete).toBe(false);
    expect(parsed.automata).toBeNull();
    expect(parsed.cyclePosition).toEqual({
      cycle: 0,
      rotation: 1,
      totalRotations: 1,
      gate: 0,
    });
  });

  it('includes the full 8-color suiteColors map (Base + 7 colors)', async () => {
    const { SCS_FRESH_CASCADE_JSON } = await import('./installConstants');
    const parsed = JSON.parse(SCS_FRESH_CASCADE_JSON);
    expect(parsed.suiteColors).toEqual({
      '0': 'Obsidian',
      '1': 'Maroon',
      '2': 'Rust',
      '3': 'Ochre',
      '4': 'Viridian',
      '5': 'Cobalt',
      '6': 'Amethyst',
      '7': 'Rose',
    });
  });

  it('content shape matches Cascades/Cascade.template.json (single source of truth invariant)', () => {
    // Lambda evidence: bridge-embedded constant must match the on-disk template
    // exactly so SCS-Bridge-Install branch's rename and B-19's embedded write
    // produce identical fresh-install state. If this test fails, sync is required.
    const fs = jest.requireActual('node:fs') as typeof import('node:fs');
    const path = jest.requireActual('node:path') as typeof import('node:path');
    const repoRoot = path.resolve(__dirname, '..', '..', '..');
    const templatePath = path.join(repoRoot, 'Cascades', 'Cascade.template.json');
    if (!fs.existsSync(templatePath)) {
      // Template absence is the very condition B-19 fixes — skip gracefully
      return;
    }
    const onDisk = fs.readFileSync(templatePath, 'utf8').trim();
    const { SCS_FRESH_CASCADE_JSON } = jest.requireActual('./installConstants') as {
      SCS_FRESH_CASCADE_JSON: string;
    };
    expect(JSON.parse(SCS_FRESH_CASCADE_JSON)).toEqual(JSON.parse(onDisk));
  });
});

describe('runInstallSpawnPipeline — cleanup on failure (Fix 2)', () => {
  it('calls cleanupInstallTemp if clone fails', async () => {
    mockMkdtemp.mockResolvedValue('/tmp/scs-install-fail');
    const err = Object.assign(new Error('spawn git ENOENT'), { code: 'ENOENT' });
    mockExecFile.mockImplementation((_cmd: string, _args: string[], cb: (err: Error) => void) =>
      cb(err),
    );
    await expect(
      runInstallSpawnPipeline('/user/project', 'https://example.com/repo', '/cascade'),
    ).rejects.toThrow('git executable not found');
    expect(mockRmSync).toHaveBeenCalledWith('/tmp/scs-install-fail', {
      recursive: true,
      force: true,
    });
  });
});
