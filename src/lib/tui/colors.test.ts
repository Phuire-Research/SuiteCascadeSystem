import {
  hslToRgb,
  rgbToAnsi,
  rgbToAnsiBg,
  classifyColor,
  SUITE_COLORS,
  SUITE_ORDER,
} from './colors';
import type { TerminalCaps } from './terminalCaps';

const trueCaps: TerminalCaps = {
  truecolor: true,
  unicode: true,
  altBuffer: true,
  cols: 80,
  rows: 24,
};
const downCaps: TerminalCaps = {
  truecolor: false,
  unicode: true,
  altBuffer: true,
  cols: 80,
  rows: 24,
};

describe('hslToRgb', () => {
  test('red = hsl(0, 1, 0.5)', () => {
    expect(hslToRgb(0, 1, 0.5)).toEqual({ r: 255, g: 0, b: 0 });
  });
  test('green = hsl(120, 1, 0.5)', () => {
    expect(hslToRgb(120, 1, 0.5)).toEqual({ r: 0, g: 255, b: 0 });
  });
  test('blue = hsl(240, 1, 0.5)', () => {
    expect(hslToRgb(240, 1, 0.5)).toEqual({ r: 0, g: 0, b: 255 });
  });
  test('white = hsl(0, 0, 1)', () => {
    expect(hslToRgb(0, 0, 1)).toEqual({ r: 255, g: 255, b: 255 });
  });
  test('black = hsl(0, 0, 0)', () => {
    expect(hslToRgb(0, 0, 0)).toEqual({ r: 0, g: 0, b: 0 });
  });
});

describe('rgbToAnsi', () => {
  test('truecolor caps produces 38;2; format', () => {
    expect(rgbToAnsi({ r: 78, g: 205, b: 196 }, trueCaps)).toBe('\x1b[38;2;78;205;196m');
  });
  test('256-color caps produces 38;5; format', () => {
    expect(rgbToAnsi({ r: 0, g: 255, b: 0 }, downCaps)).toMatch(/^\x1b\[38;5;\d+m$/);
  });
  test('clamps out-of-range channels', () => {
    expect(rgbToAnsi({ r: 999, g: -10, b: 128 }, trueCaps)).toBe('\x1b[38;2;255;0;128m');
  });
});

describe('rgbToAnsiBg', () => {
  test('truecolor caps produces 48;2; format', () => {
    expect(rgbToAnsiBg({ r: 10, g: 20, b: 30 }, trueCaps)).toBe('\x1b[48;2;10;20;30m');
  });
  test('256-color caps produces 48;5; format', () => {
    expect(rgbToAnsiBg({ r: 0, g: 0, b: 255 }, downCaps)).toMatch(/^\x1b\[48;5;\d+m$/);
  });
});

describe('classifyColor', () => {
  test('returns RGB with channels in [0, 255]', () => {
    const c = classifyColor(1.5, 2);
    expect(c.r).toBeGreaterThanOrEqual(0);
    expect(c.r).toBeLessThanOrEqual(255);
    expect(c.g).toBeGreaterThanOrEqual(0);
    expect(c.g).toBeLessThanOrEqual(255);
    expect(c.b).toBeGreaterThanOrEqual(0);
    expect(c.b).toBeLessThanOrEqual(255);
  });
});

describe('SUITE_COLORS', () => {
  test('has 8 entries', () => {
    expect(Object.keys(SUITE_COLORS).length).toBe(8);
  });
  test('Ochre matches defined value', () => {
    expect(SUITE_COLORS.Ochre).toEqual({ r: 204, g: 119, b: 34 });
  });
  test('SUITE_ORDER has 8 names matching SUITE_COLORS keys', () => {
    expect(SUITE_ORDER).toHaveLength(8);
    for (const name of SUITE_ORDER) {
      expect(SUITE_COLORS[name]).toBeDefined();
    }
  });
});
