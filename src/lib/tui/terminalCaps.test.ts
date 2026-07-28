import { detectTerminalCaps } from './terminalCaps';

describe('detectTerminalCaps', () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  test('truecolor=true when COLORTERM=truecolor', () => {
    process.env.COLORTERM = 'truecolor';
    expect(detectTerminalCaps().truecolor).toBe(true);
  });

  test('truecolor=true when COLORTERM=24bit', () => {
    process.env.COLORTERM = '24bit';
    expect(detectTerminalCaps().truecolor).toBe(true);
  });

  test('truecolor=false when COLORTERM unset and TERM=xterm-256color', () => {
    delete process.env.COLORTERM;
    process.env.TERM = 'xterm-256color';
    expect(detectTerminalCaps().truecolor).toBe(false);
  });

  test('unicode=true when LANG includes utf-8', () => {
    process.env.LANG = 'en_US.UTF-8';
    expect(detectTerminalCaps().unicode).toBe(true);
  });

  test('unicode=false when LANG/LC_ALL/LC_CTYPE unset', () => {
    delete process.env.LANG;
    delete process.env.LC_ALL;
    delete process.env.LC_CTYPE;
    expect(detectTerminalCaps().unicode).toBe(false);
  });

  test('altBuffer is always true', () => {
    expect(detectTerminalCaps().altBuffer).toBe(true);
  });

  test('cols defaults to 80 when stdout.columns is undefined', () => {
    const original = Object.getOwnPropertyDescriptor(process.stdout, 'columns');
    Object.defineProperty(process.stdout, 'columns', {
      get: () => undefined,
      configurable: true,
    });
    try {
      expect(detectTerminalCaps().cols).toBe(80);
    } finally {
      if (original) Object.defineProperty(process.stdout, 'columns', original);
    }
  });

  test('rows defaults to 24 when stdout.rows is undefined', () => {
    const original = Object.getOwnPropertyDescriptor(process.stdout, 'rows');
    Object.defineProperty(process.stdout, 'rows', {
      get: () => undefined,
      configurable: true,
    });
    try {
      expect(detectTerminalCaps().rows).toBe(24);
    } finally {
      if (original) Object.defineProperty(process.stdout, 'rows', original);
    }
  });
});
