import { STRATIDIAN_MODES, STRATIDIAN_MODE_NAMES } from './modes';
import { createGrid } from './grid';
import type { TerminalCaps } from './terminalCaps';

const trueCaps: TerminalCaps = {
  truecolor: true,
  unicode: true,
  altBuffer: true,
  cols: 80,
  rows: 24,
};

describe('STRATIDIAN_MODES registry', () => {
  test('has 6 modes', () => {
    expect(STRATIDIAN_MODES).toHaveLength(6);
  });
  test('has 6 mode names matching', () => {
    expect(STRATIDIAN_MODE_NAMES).toHaveLength(6);
    expect(STRATIDIAN_MODE_NAMES).toEqual([
      'CASCADE',
      'DIAMETER',
      'DEMOMETER',
      'MUXAMETER',
      'STRATIDIA',
      'SUITE-WHEEL',
    ]);
  });
});

describe.each(STRATIDIAN_MODE_NAMES.map((n, i) => [n, STRATIDIAN_MODES[i]] as const))(
  'mode %s',
  (_name, modeFn) => {
    test('fills non-empty cells at t=0 on standard 80x24 grid', () => {
      const g = createGrid(80, 24);
      modeFn(0, g, trueCaps);
      let nonEmpty = 0;
      for (let r = 0; r < g.rows; r++) {
        for (let c = 0; c < g.cols; c++) {
          if (g.cells[r][c].ch !== ' ' || g.cells[r][c].color !== null) nonEmpty++;
        }
      }
      expect(nonEmpty).toBeGreaterThan(0);
    });

    test('does not crash at t=3.5 (mid-cycle)', () => {
      const g = createGrid(80, 24);
      expect(() => modeFn(3.5, g, trueCaps)).not.toThrow();
    });

    test('does not crash on minimal 10x10 grid', () => {
      const g = createGrid(10, 10);
      expect(() => modeFn(1.0, g, trueCaps)).not.toThrow();
    });

    test('does not crash on large 200x60 grid', () => {
      const g = createGrid(200, 60);
      expect(() => modeFn(0, g, trueCaps)).not.toThrow();
    });

    test('does not crash on degenerate 4x4 grid', () => {
      const g = createGrid(4, 4);
      expect(() => modeFn(0, g, trueCaps)).not.toThrow();
    });

    test('is deterministic: same t produces same cell state', () => {
      const g1 = createGrid(80, 24);
      const g2 = createGrid(80, 24);
      modeFn(2.5, g1, trueCaps);
      modeFn(2.5, g2, trueCaps);
      expect(g1.cells).toEqual(g2.cells);
    });
  },
);
