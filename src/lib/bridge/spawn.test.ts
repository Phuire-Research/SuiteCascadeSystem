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
      // C1104: the model slot is always threaded; null = no --model clause built.
      model: null,
      settingsPath: '/p/q/spawn-settings.json',
      claudeUuid: undefined,
      // RESUME INDUCTION (Lane 7 row 13): the append path is part of the contract now.
      // Absent on the opts ⇒ an EXPLICIT null, so osTerminal omits the clause.
      appendSystemPromptFile: null,
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
      appendSystemPromptFile: null,
      // C1104 · ruling A: a resume with no recorded model threads null, and osTerminal
      // then builds NO --model clause — the user's own /model default applies.
      model: null,
    });
  });

  // RESUME INDUCTION · THE DEAD WIRE CLOSED (Lane 7 row 13). Before this, the type had no
  // slot for the composed path, so every TUI/attach/CLI resume dropped it at THIS boundary
  // even though all four osTerminal transports already consumed it.
  it('threads appendSystemPromptFile through to buildTerminalCommand', async () => {
    childProcess.spawn.mockReturnValue(makeMockChild(1));
    await launchClaudeWindow({
      ...baseOpts,
      mode: 'resume',
      claudeUuid: 'real-uuid',
      appendSystemPromptFile: '/b/Cascades/Bridge/scs-bridge-suite8-Anchor.generated.md',
    });
    expect(osTerminal.buildTerminalCommand).toHaveBeenCalledWith(
      expect.objectContaining({
        appendSystemPromptFile: '/b/Cascades/Bridge/scs-bridge-suite8-Anchor.generated.md',
      }),
    );
  });

  it('does not block — resolves before any external process completion', async () => {
    childProcess.spawn.mockReturnValue(makeMockChild(99));
    const start = Date.now();
    await launchClaudeWindow(baseOpts);
    const elapsed = Date.now() - start;
    expect(elapsed).toBeLessThan(100);
  });
});

// C1104 · ruling A · launchClaudeWindow THREADS the model into buildTerminalCommand.
// LaunchClaudeWindowOpts had no model slot at all before, so the daemon door could not
// reach the clause even once osTerminal grew one (the RESUME-INDUCTION dead-wire shape).
describe('launchClaudeWindow · the model thread (C1104)', () => {
  beforeEach(() => {
    childProcess.spawn.mockReset();
    osTerminal.buildTerminalCommand.mockReset();
    osTerminal.buildTerminalCommand.mockReturnValue({
      cmd: 'test-cmd',
      args: ['arg1'],
      platform: 'macos',
      terminalChoice: 'Terminal',
      humanReadable: 'test-cmd arg1',
    });
    childProcess.spawn.mockReturnValue(makeMockChild(1));
  });

  it('T3 · passes model: null when the caller supplies none', async () => {
    await launchClaudeWindow(baseOpts);
    expect(osTerminal.buildTerminalCommand).toHaveBeenCalledWith(
      expect.objectContaining({ model: null }),
    );
  });

  it('passes model: null through explicitly (a resume with no recorded model)', async () => {
    await launchClaudeWindow({ ...baseOpts, mode: 'resume', claudeUuid: 'u', model: null });
    expect(osTerminal.buildTerminalCommand).toHaveBeenCalledWith(
      expect.objectContaining({ model: null }),
    );
  });

  it('threads a recorded model verbatim', async () => {
    await launchClaudeWindow({ ...baseOpts, model: 'claude-fable-5-1' });
    expect(osTerminal.buildTerminalCommand).toHaveBeenCalledWith(
      expect.objectContaining({ model: 'claude-fable-5-1' }),
    );
  });
});
