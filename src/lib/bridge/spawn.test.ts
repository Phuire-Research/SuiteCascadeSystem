import * as childProcessActual from 'node:child_process';
import * as osTerminalActual from './osTerminal';
import { launchClaudeWindow } from './spawn';

jest.mock('node:child_process', () => ({
  spawn: jest.fn(),
}));

jest.mock('./osTerminal', () => ({
  buildTerminalCommand: jest.fn(),
}));

const childProcess = childProcessActual as unknown as { spawn: jest.Mock };
const osTerminal = osTerminalActual as unknown as { buildTerminalCommand: jest.Mock };

function makeMockChild(pid: number | undefined) {
  return { pid, unref: jest.fn() };
}

const baseOpts = {
  cwd: '/tmp',
  mode: 'new' as const,
  settingsPath: '/tmp/spawn-settings.json',
  sessionId: 'TESTULID',
};

describe('launchClaudeWindow', () => {
  beforeEach(() => {
    childProcess.spawn.mockReset();
    osTerminal.buildTerminalCommand.mockReset();
    osTerminal.buildTerminalCommand.mockReturnValue({
      cmd: 'test-cmd',
      args: ['arg1', 'arg2'],
      platform: 'macos',
      terminalChoice: 'Terminal',
      humanReadable: 'test-cmd arg1 arg2',
    });
  });

  it('calls spawn with detached: true, stdio: ignore, and SCS_BRIDGE_ULID env var', async () => {
    childProcess.spawn.mockReturnValue(makeMockChild(12345));
    await launchClaudeWindow(baseOpts);
    expect(childProcess.spawn).toHaveBeenCalledWith(
      'test-cmd',
      ['arg1', 'arg2'],
      expect.objectContaining({
        detached: true,
        stdio: 'ignore',
        env: expect.objectContaining({ SCS_BRIDGE_ULID: 'TESTULID' }),
      }),
    );
  });

  it('threads sessionId into env as SCS_BRIDGE_ULID', async () => {
    childProcess.spawn.mockReturnValue(makeMockChild(12345));
    await launchClaudeWindow({ ...baseOpts, sessionId: 'ANOTHER-ULID' });
    const callEnv = (childProcess.spawn.mock.calls[0][2] as { env: Record<string, string> }).env;
    expect(callEnv.SCS_BRIDGE_ULID).toBe('ANOTHER-ULID');
  });

  it('calls child.unref()', async () => {
    const child = makeMockChild(12345);
    childProcess.spawn.mockReturnValue(child);
    await launchClaudeWindow(baseOpts);
    expect(child.unref).toHaveBeenCalledTimes(1);
  });

  it('resolves with pid from child.pid', async () => {
    childProcess.spawn.mockReturnValue(makeMockChild(12345));
    const result = await launchClaudeWindow(baseOpts);
    expect(result.pid).toBe(12345);
  });

  it('resolves with terminalCommand from buildTerminalCommand humanReadable', async () => {
    childProcess.spawn.mockReturnValue(makeMockChild(12345));
    const result = await launchClaudeWindow(baseOpts);
    expect(result.terminalCommand).toBe('test-cmd arg1 arg2');
  });

  it('pid defaults to -1 when child.pid is undefined', async () => {
    childProcess.spawn.mockReturnValue(makeMockChild(undefined));
    const result = await launchClaudeWindow(baseOpts);
    expect(result.pid).toBe(-1);
  });

  it('passes cwd, mode, settingsPath through to buildTerminalCommand (mode=new)', async () => {
    childProcess.spawn.mockReturnValue(makeMockChild(1));
    await launchClaudeWindow({
      ...baseOpts,
      cwd: '/p/q',
      settingsPath: '/p/q/spawn-settings.json',
    });
    expect(osTerminal.buildTerminalCommand).toHaveBeenCalledWith({
      cwd: '/p/q',
      mode: 'new',
      settingsPath: '/p/q/spawn-settings.json',
      claudeUuid: undefined,
    });
  });

  it('passes claudeUuid + mode=resume through to buildTerminalCommand', async () => {
    childProcess.spawn.mockReturnValue(makeMockChild(1));
    await launchClaudeWindow({
      ...baseOpts,
      mode: 'resume',
      claudeUuid: 'real-uuid',
      cwd: '/c',
      settingsPath: '/c/s.json',
    });
    expect(osTerminal.buildTerminalCommand).toHaveBeenCalledWith({
      cwd: '/c',
      mode: 'resume',
      settingsPath: '/c/s.json',
      claudeUuid: 'real-uuid',
    });
  });

  it('does not block — resolves before any external process completion', async () => {
    childProcess.spawn.mockReturnValue(makeMockChild(99));
    const start = Date.now();
    await launchClaudeWindow(baseOpts);
    const elapsed = Date.now() - start;
    expect(elapsed).toBeLessThan(100);
  });
});
