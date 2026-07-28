import { setDebugEnabled, isDebugEnabled, log, debugLogPath } from './debugLog';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const fs = require('node:fs') as {
  appendFileSync: typeof import('node:fs').appendFileSync;
  mkdirSync: typeof import('node:fs').mkdirSync;
};

describe('debugLog', () => {
  let appendSpy: jest.SpyInstance;
  let mkdirSpy: jest.SpyInstance;

  beforeEach(() => {
    appendSpy = jest.spyOn(fs, 'appendFileSync').mockImplementation(() => undefined);
    mkdirSpy = jest.spyOn(fs, 'mkdirSync').mockImplementation((() => undefined) as never);
    setDebugEnabled(false);
  });

  afterEach(() => {
    appendSpy.mockRestore();
    mkdirSpy.mockRestore();
    setDebugEnabled(false);
  });

  test('log() is no-op when disabled (zero-cost guard)', () => {
    log('test.event', { x: 1 });
    expect(appendSpy).not.toHaveBeenCalled();
    expect(mkdirSpy).not.toHaveBeenCalled();
  });

  test('isDebugEnabled() reflects setDebugEnabled() state', () => {
    expect(isDebugEnabled()).toBe(false);
    setDebugEnabled(true);
    expect(isDebugEnabled()).toBe(true);
    setDebugEnabled(false);
    expect(isDebugEnabled()).toBe(false);
  });

  test('log() writes JSONL line when enabled', () => {
    setDebugEnabled(true);
    log('test.event', { x: 1 });
    expect(appendSpy).toHaveBeenCalledTimes(1);
    const [path, content] = appendSpy.mock.calls[0] as [string, string];
    expect(path).toBe(debugLogPath());
    expect(content.endsWith('\n')).toBe(true);
    const parsed = JSON.parse(content.trimEnd()) as Record<string, unknown>;
    expect(parsed.event).toBe('test.event');
    expect(parsed.x).toBe(1);
    expect(typeof parsed.ts).toBe('string');
    expect(parsed.ts as string).toMatch(/\d{4}-\d{2}-\d{2}T/);
  });

  test('canonical fields (ts, event) are not shadowed by payload (Green Angle 2 fix)', () => {
    setDebugEnabled(true);
    log('canonical.event', { event: 'rogue', ts: 'fake-ts', ulid: 'abc' });
    const [, content] = appendSpy.mock.calls[0] as [string, string];
    const parsed = JSON.parse(content.trimEnd()) as Record<string, unknown>;
    expect(parsed.event).toBe('canonical.event');
    expect(parsed.ts).not.toBe('fake-ts');
    expect(parsed.ulid).toBe('abc');
  });

  test('setDebugEnabled(false) after true prevents writes', () => {
    setDebugEnabled(true);
    setDebugEnabled(false);
    log('test.event', {});
    expect(appendSpy).not.toHaveBeenCalled();
  });

  test('log() with no payload writes only canonical fields', () => {
    setDebugEnabled(true);
    log('empty.event');
    const [, content] = appendSpy.mock.calls[0] as [string, string];
    const parsed = JSON.parse(content.trimEnd()) as Record<string, unknown>;
    expect(parsed.event).toBe('empty.event');
    expect(typeof parsed.ts).toBe('string');
    expect(Object.keys(parsed).sort()).toEqual(['event', 'ts']);
  });

  test('log() swallows fs errors (must not crash bridge)', () => {
    setDebugEnabled(true);
    appendSpy.mockImplementation(() => {
      throw new Error('disk full');
    });
    expect(() => log('boom.event', { x: 1 })).not.toThrow();
  });

  test('debugLogPath() resolves to ./Cascades/Bridge/debug.log (project-local)', () => {
    const path = debugLogPath();
    expect(path).toMatch(/Cascades[\\/]Bridge[\\/]debug\.log$/);
  });
});
