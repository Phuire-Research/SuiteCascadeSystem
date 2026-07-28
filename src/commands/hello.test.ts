import { Command } from 'commander';
import { helloCommand } from './hello';

describe('helloCommand', () => {
  it('returns a Command instance', () => {
    const cmd = helloCommand();
    expect(cmd).toBeInstanceOf(Command);
  });

  it('has name hello', () => {
    const cmd = helloCommand();
    expect(cmd.name()).toBe('hello');
  });

  it('has a description', () => {
    const cmd = helloCommand();
    expect(cmd.description()).toBeTruthy();
  });

  it('has an optional [name] argument', () => {
    const cmd = helloCommand();
    const args = cmd.registeredArguments;
    expect(args).toHaveLength(1);
    expect(args[0].required).toBe(false);
    expect(args[0].defaultValue).toBe('World');
  });

  it('action prints Hello, World! when no name provided', async () => {
    const cmd = helloCommand();
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => undefined);
    await cmd.parseAsync([], { from: 'user' });
    expect(consoleSpy).toHaveBeenCalledWith('Hello, World!');
    consoleSpy.mockRestore();
  });
});
