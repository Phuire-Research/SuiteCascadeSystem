/**
 * suite8:page command surface smoke test — MD-1 (W3).
 * Mirrors src/commands/scp/init.test.ts — asserts the Commander surface only
 * (no execution).
 */
import { Command } from 'commander';
import { suite8PageCommand } from './page';
import { suite8Command } from './index';

describe('suite8PageCommand', () => {
  it('returns a Command instance', () => {
    expect(suite8PageCommand()).toBeInstanceOf(Command);
  });

  it('has the colon-name suite8:page', () => {
    expect(suite8PageCommand().name()).toBe('suite8:page');
  });

  it('has a required <name> argument', () => {
    const args = suite8PageCommand().registeredArguments;
    expect(args).toHaveLength(1);
    expect(args[0].required).toBe(true);
  });

  it('registers --home, --force, and --designation options', () => {
    const opts = suite8PageCommand().options;
    expect(opts.find((o) => o.long === '--home')).toBeDefined();
    expect(opts.find((o) => o.long === '--force')).toBeDefined();
    expect(opts.find((o) => o.long === '--designation')).toBeDefined();
  });

  it('factory returns the leaf suite8:page command directly', () => {
    expect(suite8Command().name()).toBe('suite8:page');
  });
});
