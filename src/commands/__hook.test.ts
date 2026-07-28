jest.mock('../lib/bridge/sessionStartHook', () => ({
  runSessionStartHook: jest.fn(),
}));
jest.mock('../lib/bridge/sessionEndHook', () => ({
  runSessionEndHook: jest.fn(),
}));
jest.mock('../lib/bridge/installHooks', () => ({
  runRegisterInstallHook: jest.fn(),
  runUserPromptSubmitInstallHook: jest.fn(),
}));

import { hookCommand } from './__hook';

describe('hookCommand', () => {
  it('creates a Command named __hook', () => {
    const cmd = hookCommand();
    expect(cmd.name()).toBe('__hook');
  });

  it('registers session-start subcommand', () => {
    const cmd = hookCommand();
    const names = cmd.commands.map((c) => c.name());
    expect(names).toContain('session-start');
  });

  it('registers session-end subcommand', () => {
    const cmd = hookCommand();
    const names = cmd.commands.map((c) => c.name());
    expect(names).toContain('session-end');
  });

  it('registers register-install subcommand', () => {
    const cmd = hookCommand();
    const names = cmd.commands.map((c) => c.name());
    expect(names).toContain('register-install');
  });

  it('registers user-prompt-submit-install subcommand', () => {
    const cmd = hookCommand();
    const names = cmd.commands.map((c) => c.name());
    expect(names).toContain('user-prompt-submit-install');
  });

  it('has exactly 4 subcommands (regression guard — no unexpected additions)', () => {
    const cmd = hookCommand();
    expect(cmd.commands).toHaveLength(4);
  });

  it('session-start description contains INTERNAL', () => {
    const cmd = hookCommand();
    const sessionStart = cmd.commands.find((c) => c.name() === 'session-start');
    expect(sessionStart?.description()).toContain('[INTERNAL]');
  });

  it('register-install description contains INTERNAL', () => {
    const cmd = hookCommand();
    const registerInstall = cmd.commands.find((c) => c.name() === 'register-install');
    expect(registerInstall?.description()).toContain('[INTERNAL]');
  });

  it('user-prompt-submit-install description contains INTERNAL', () => {
    const cmd = hookCommand();
    const upsi = cmd.commands.find((c) => c.name() === 'user-prompt-submit-install');
    expect(upsi?.description()).toContain('[INTERNAL]');
  });
});
