import { Command } from 'commander';
import { bridgeSpawnCommand } from './spawn';

describe('bridgeSpawnCommand', () => {
  it('returns a Command instance', () => {
    const cmd = bridgeSpawnCommand();
    expect(cmd).toBeInstanceOf(Command);
  });

  it('has name spawn', () => {
    const cmd = bridgeSpawnCommand();
    expect(cmd.name()).toBe('spawn');
  });

  it('has a description', () => {
    const cmd = bridgeSpawnCommand();
    expect(cmd.description()).toBeTruthy();
  });

  it('has --cwd option', () => {
    const cmd = bridgeSpawnCommand();
    const opt = cmd.options.find((o) => o.long === '--cwd');
    expect(opt).toBeDefined();
  });

  it('does NOT have --attach option (deleted in Diamond B)', () => {
    const cmd = bridgeSpawnCommand();
    const opt = cmd.options.find((o) => o.long === '--attach');
    expect(opt).toBeUndefined();
  });

  it('has --no-launch option', () => {
    const cmd = bridgeSpawnCommand();
    const opt = cmd.options.find((o) => o.long === '--no-launch');
    expect(opt).toBeDefined();
  });
});
