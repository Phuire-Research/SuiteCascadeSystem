import * as childProcessActual from 'node:child_process';
import * as fsActual from 'node:fs';
import {
  escapeForOsascript,
  escapeForCmd,
  buildTerminalCommand,
  detectTerminal,
} from './osTerminal';

jest.mock('node:child_process', () => ({
  execSync: jest.fn(),
}));

jest.mock('node:fs', () => ({
  existsSync: jest.fn(),
}));

const childProcess = childProcessActual as unknown as { execSync: jest.Mock };
const fs = fsActual as unknown as { existsSync: jest.Mock };

const ORIGINAL_PLATFORM = process.platform;
const ORIGINAL_ENV = { ...process.env };

function setPlatform(value: NodeJS.Platform): void {
  Object.defineProperty(process, 'platform', { value, configurable: true });
}

function restorePlatform(): void {
  Object.defineProperty(process, 'platform', { value: ORIGINAL_PLATFORM, configurable: true });
}

beforeEach(() => {
  childProcess.execSync.mockReset();
  fs.existsSync.mockReset();
  fs.existsSync.mockReturnValue(false);
  delete process.env.WSL_DISTRO_NAME;
});

afterEach(() => {
  restorePlatform();
  process.env = { ...ORIGINAL_ENV };
});

describe('escapeForOsascript', () => {
  it('passes plain path through unchanged', () => {
    expect(escapeForOsascript('/Users/me/proj')).toBe('/Users/me/proj');
  });

  it('preserves spaces (no transformation)', () => {
    expect(escapeForOsascript('/Users/me/my project')).toBe('/Users/me/my project');
  });

  it('escapes a double-quote as backslash-quote', () => {
    expect(escapeForOsascript('a"b')).toBe('a\\"b');
  });

  it('escapes a single dollar sign as backslash-dollar', () => {
    expect(escapeForOsascript('/Users/$VAR/proj')).toBe('/Users/\\$VAR/proj');
  });

  it('escapes a single backslash as double backslash', () => {
    expect(escapeForOsascript('a\\b')).toBe('a\\\\b');
  });

  it('escapes backslashes BEFORE other escapes (order matters)', () => {
    expect(escapeForOsascript('a\\"b')).toBe('a\\\\\\"b');
  });

  it('handles a path containing space, quote, and dollar', () => {
    expect(escapeForOsascript('/p ath/"q"/$v')).toBe('/p ath/\\"q\\"/\\$v');
  });

  it('handles all four classes combined', () => {
    expect(escapeForOsascript('a\\b"c$d e')).toBe('a\\\\b\\"c\\$d e');
  });
});

describe('escapeForCmd', () => {
  it('wraps a plain path in double-quotes', () => {
    expect(escapeForCmd('C:\\foo')).toBe('"C:\\foo"');
  });

  it('doubles interior double-quotes per Windows CMD convention', () => {
    expect(escapeForCmd('a"b')).toBe('"a""b"');
  });
});

describe('detectTerminal — macOS', () => {
  beforeEach(() => {
    setPlatform('darwin');
  });

  it('returns macos / Terminal', () => {
    const result = detectTerminal();
    expect(result.platform).toBe('macos');
    expect(result.terminalChoice).toBe('Terminal');
  });
});

describe('detectTerminal — WSL detection (filesystem signal)', () => {
  beforeEach(() => {
    setPlatform('linux');
    fs.existsSync.mockImplementation((p: string) => p === '/proc/sys/fs/binfmt_misc/WSLInterop');
  });

  it('returns wsl when WSLInterop path exists', () => {
    const result = detectTerminal();
    expect(result.platform).toBe('wsl');
    expect(result.terminalChoice).toBe('wt.exe');
  });
});

describe('detectTerminal — WSL detection (env var signal)', () => {
  beforeEach(() => {
    setPlatform('linux');
    fs.existsSync.mockReturnValue(false);
    process.env.WSL_DISTRO_NAME = 'Ubuntu';
  });

  it('returns wsl when WSL_DISTRO_NAME is set', () => {
    const result = detectTerminal();
    expect(result.platform).toBe('wsl');
  });
});

describe('detectTerminal — Linux (no WSL)', () => {
  beforeEach(() => {
    setPlatform('linux');
    fs.existsSync.mockReturnValue(false);
    delete process.env.WSL_DISTRO_NAME;
  });

  it('returns linux / x-terminal-emulator when first probe succeeds', () => {
    childProcess.execSync.mockImplementation((cmd: string) => {
      if (cmd.includes('x-terminal-emulator')) return Buffer.from('/usr/bin/x-terminal-emulator');
      throw new Error('not found');
    });
    const result = detectTerminal();
    expect(result.platform).toBe('linux');
    expect(result.terminalChoice).toBe('x-terminal-emulator');
  });
});

describe('detectTerminal — Windows', () => {
  beforeEach(() => {
    setPlatform('win32');
    fs.existsSync.mockReturnValue(false);
  });

  it('returns windows', () => {
    childProcess.execSync.mockImplementation(() => Buffer.from('found'));
    const result = detectTerminal();
    expect(result.platform).toBe('windows');
  });

  it('terminalChoice = wt when wt.exe is present', () => {
    childProcess.execSync.mockImplementation(() => Buffer.from('found'));
    const result = detectTerminal();
    expect(result.terminalChoice).toBe('wt');
  });

  it('terminalChoice = cmd when wt.exe is absent', () => {
    childProcess.execSync.mockImplementation(() => {
      throw new Error('not found');
    });
    const result = detectTerminal();
    expect(result.terminalChoice).toBe('cmd');
  });
});

describe('buildTerminalCommand — macOS', () => {
  beforeEach(() => {
    setPlatform('darwin');
  });

  it('mode=new produces osascript with --settings, no --session-id', () => {
    const out = buildTerminalCommand({
      cwd: '/tmp/foo',
      mode: 'new',
      settingsPath: '/tmp/foo/spawn-settings.json',
    });
    expect(out.cmd).toBe('osascript');
    expect(out.args[0]).toBe('-e');
    expect(out.args[1]).toContain('--settings');
    expect(out.args[1]).not.toContain('--session-id');
    expect(out.args[1]).toContain('/tmp/foo');
  });

  it('mode=resume produces osascript with --resume <uuid> and --settings', () => {
    const out = buildTerminalCommand({
      cwd: '/tmp/foo',
      mode: 'resume',
      settingsPath: '/tmp/foo/spawn-settings.json',
      claudeUuid: 'abc-123',
    });
    expect(out.args[1]).toContain('--resume');
    expect(out.args[1]).toContain('abc-123');
    expect(out.args[1]).toContain('--settings');
    expect(out.args[1]).not.toContain('--session-id');
  });

  it('cwd with double-quote is escaped in AppleScript', () => {
    const out = buildTerminalCommand({
      cwd: '/p/"q"/r',
      mode: 'new',
      settingsPath: '/tmp/spawn-settings.json',
    });
    expect(out.args[1]).toContain('\\"q\\"');
  });

  it('cwd with dollar sign is escaped', () => {
    const out = buildTerminalCommand({
      cwd: '/p/$VAR/r',
      mode: 'new',
      settingsPath: '/tmp/spawn-settings.json',
    });
    expect(out.args[1]).toContain('\\$VAR');
  });

  it('settingsPath is wrapped with AppleScript boundary quotes', () => {
    const out = buildTerminalCommand({
      cwd: '/c',
      mode: 'new',
      settingsPath: '/p ath/spawn-settings.json',
    });
    expect(out.args[1]).toContain('\\"/p ath/spawn-settings.json\\"');
  });

  it('settingsPath with double-quote is escaped per Diamond C boundary discipline', () => {
    const out = buildTerminalCommand({
      cwd: '/c',
      mode: 'new',
      settingsPath: '/p/"q"/spawn-settings.json',
    });
    expect(out.args[1]).toContain('\\"q\\"');
  });

  it('resume mode without claudeUuid throws', () => {
    expect(() =>
      buildTerminalCommand({ cwd: '/c', mode: 'resume', settingsPath: '/c/s.json' }),
    ).toThrow(/claudeUuid required for resume/);
  });

  // Diamond B-16 (CD-46 PCSP) — positional [prompt] argument tests
  it('seedPrompt /cascade with mode=new appends positional bash-single-quoted', () => {
    const out = buildTerminalCommand({
      cwd: '/tmp/foo',
      mode: 'new',
      settingsPath: '/tmp/foo/spawn-settings.json',
      seedPrompt: '/cascade',
    });
    // bash-single-quote layer: '/cascade'
    // AppleScript layer leaves it unchanged (no \ no " no $)
    expect(out.args[1]).toContain("'/cascade'");
  });

  it('seedPrompt with mode=resume is IGNORED (positional reserves next-message semantics)', () => {
    const out = buildTerminalCommand({
      cwd: '/tmp/foo',
      mode: 'resume',
      settingsPath: '/tmp/foo/spawn-settings.json',
      claudeUuid: 'abc-123',
      seedPrompt: '/cascade',
    });
    expect(out.args[1]).not.toContain("'/cascade'");
    expect(out.args[1]).toContain('--resume');
  });

  it('seedPrompt undefined produces no positional (no extra trailing arg)', () => {
    const out = buildTerminalCommand({
      cwd: '/tmp/foo',
      mode: 'new',
      settingsPath: '/tmp/foo/spawn-settings.json',
    });
    expect(out.args[1]).not.toMatch(/'[^']*'$/);
  });

  it('seedPrompt empty string is treated as no seed (no positional appended)', () => {
    const out = buildTerminalCommand({
      cwd: '/tmp/foo',
      mode: 'new',
      settingsPath: '/tmp/foo/spawn-settings.json',
      seedPrompt: '',
    });
    expect(out.args[1]).not.toMatch(/''$/);
  });

  it('seedPrompt with internal single-quote is bash-escaped via close-escape-reopen pattern (Diamond B-25-UX-fix · escape-order swap)', () => {
    const out = buildTerminalCommand({
      cwd: '/tmp/foo',
      mode: 'new',
      settingsPath: '/tmp/foo/spawn-settings.json',
      seedPrompt: "Don't worry",
    });
    // Suite 7 Fuchsia clinical fix: escape order swapped in osTerminal.ts:121
    // Old order (BUG): escapeForOsascript(escapeForBashSingleQuote(s)) — double-escaped
    //   the backslash in `'\''` → `'\\''` → bash parsed `\\` as literal backslash →
    //   single-quote string never closed → cd consumed inside broken quote.
    // New order: escapeForBashSingleQuote(escapeForOsascript(s)) — osascript first
    //   on raw content (handles `\`, `"`, `$`), then bash wrap (handles `'`).
    // Result: clean bash idiom `'Don'\''t worry'` reaches the shell intact.
    expect(out.args[1]).toContain("'Don'\\''t worry'");
  });

  it('seedPrompt verbose Strategy S1 (Path B) renders as bash-single-quoted block', () => {
    const verbose =
      'You are operating as SCS Bridge. Begin: execute Strategy S1 — detect Cascades/.';
    const out = buildTerminalCommand({
      cwd: '/tmp/foo',
      mode: 'new',
      settingsPath: '/tmp/foo/spawn-settings.json',
      seedPrompt: verbose,
    });
    expect(out.args[1]).toContain("'" + verbose + "'");
  });
});

describe('buildTerminalCommand — Linux fallback chain ordering', () => {
  beforeEach(() => {
    setPlatform('linux');
    fs.existsSync.mockReturnValue(false);
  });

  function probeOnly(present: string[]) {
    childProcess.execSync.mockImplementation((cmd: string) => {
      const found = present.some((name) => cmd.includes(name));
      if (found) return Buffer.from('ok');
      throw new Error('not found');
    });
  }

  it('first match wins: x-terminal-emulator', () => {
    probeOnly(['x-terminal-emulator', 'gnome-terminal', 'konsole', 'xterm']);
    const out = buildTerminalCommand({ cwd: '/c', mode: 'new', settingsPath: '/c/s.json' });
    expect(out.terminalChoice).toBe('x-terminal-emulator');
  });

  it('second match: gnome-terminal when first absent', () => {
    probeOnly(['gnome-terminal', 'konsole', 'xterm']);
    const out = buildTerminalCommand({ cwd: '/c', mode: 'new', settingsPath: '/c/s.json' });
    expect(out.terminalChoice).toBe('gnome-terminal');
    expect(out.args).toContain('--working-directory');
    expect(out.args).toContain('/c');
    expect(out.args).toContain('--settings');
    expect(out.args).toContain('/c/s.json');
    expect(out.args).not.toContain('--session-id');
  });

  it('third match: konsole', () => {
    probeOnly(['konsole', 'xterm']);
    const out = buildTerminalCommand({ cwd: '/c', mode: 'new', settingsPath: '/c/s.json' });
    expect(out.terminalChoice).toBe('konsole');
    expect(out.args).toContain('--workdir');
    expect(out.args).toContain('--settings');
  });

  it('fourth match: xterm', () => {
    probeOnly(['xterm']);
    const out = buildTerminalCommand({ cwd: '/c', mode: 'new', settingsPath: '/c/s.json' });
    expect(out.terminalChoice).toBe('xterm');
    expect(out.args[0]).toBe('-e');
    expect(out.args.join(' ')).toContain('--settings');
  });

  it('throws when entire chain is exhausted', () => {
    probeOnly([]);
    expect(() =>
      buildTerminalCommand({ cwd: '/c', mode: 'new', settingsPath: '/c/s.json' }),
    ).toThrow(/No supported terminal/);
  });
});

describe('buildTerminalCommand — Windows', () => {
  beforeEach(() => {
    setPlatform('win32');
    fs.existsSync.mockReturnValue(false);
  });

  it('wt.exe present → cmd=wt with -d flag, cwd, and --settings', () => {
    childProcess.execSync.mockImplementation(() => Buffer.from('found'));
    const out = buildTerminalCommand({
      cwd: 'C:\\proj',
      mode: 'new',
      settingsPath: 'C:\\proj\\s.json',
    });
    expect(out.cmd).toBe('wt');
    expect(out.args).toContain('-d');
    expect(out.args).toContain('C:\\proj');
    expect(out.args).toContain('--settings');
    expect(out.args).not.toContain('--session-id');
  });

  it('wt.exe absent → cmd=cmd with /c start fallback', () => {
    childProcess.execSync.mockImplementation(() => {
      throw new Error('not found');
    });
    const out = buildTerminalCommand({
      cwd: 'C:\\proj',
      mode: 'new',
      settingsPath: 'C:\\proj\\s.json',
    });
    expect(out.cmd).toBe('cmd');
    expect(out.args).toContain('/c');
    expect(out.args).toContain('start');
  });
});

describe('buildTerminalCommand — WSL', () => {
  beforeEach(() => {
    setPlatform('linux');
    fs.existsSync.mockImplementation((p: string) => p === '/proc/sys/fs/binfmt_misc/WSLInterop');
  });

  it('returns cmd=wt.exe and args include wsl.exe', () => {
    const out = buildTerminalCommand({
      cwd: '/home/user',
      mode: 'new',
      settingsPath: '/home/user/s.json',
    });
    expect(out.cmd).toBe('wt.exe');
    expect(out.args).toContain('wsl.exe');
  });

  it('mode=new threads --settings into bash command', () => {
    const out = buildTerminalCommand({
      cwd: '/home/user',
      mode: 'new',
      settingsPath: '/home/user/s.json',
    });
    const bashCmd = out.args[out.args.length - 1];
    expect(bashCmd).toContain('--settings');
    expect(bashCmd).not.toContain('--session-id');
  });

  it('mode=resume threads --resume <uuid> + --settings into bash command', () => {
    const out = buildTerminalCommand({
      cwd: '/home/user',
      mode: 'resume',
      settingsPath: '/home/user/s.json',
      claudeUuid: 'real-uuid',
    });
    const bashCmd = out.args[out.args.length - 1];
    expect(bashCmd).toContain('--resume');
    expect(bashCmd).toContain('real-uuid');
    expect(bashCmd).toContain('--settings');
  });
});
