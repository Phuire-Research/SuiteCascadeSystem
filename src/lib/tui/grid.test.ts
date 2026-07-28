import { createGrid, setCell, getCell, clearGrid, serializeGrid } from './grid';

describe('createGrid', () => {
  test('produces correct dimensions', () => {
    const g = createGrid(10, 5);
    expect(g.cols).toBe(10);
    expect(g.rows).toBe(5);
    expect(g.cells.length).toBe(5);
    expect(g.cells[0].length).toBe(10);
  });
  test('fills with space by default', () => {
    const g = createGrid(5, 3);
    expect(g.cells[0][0].ch).toBe(' ');
    expect(g.cells[0][0].color).toBeNull();
  });
  test('accepts fill character', () => {
    const g = createGrid(3, 2, '·');
    expect(g.cells[0][0].ch).toBe('·');
  });
});

describe('setCell', () => {
  test('mutates correct position (x=col, y=row)', () => {
    const g = createGrid(5, 5);
    setCell(g, 2, 1, 'X', '\x1b[31m');
    expect(g.cells[1][2].ch).toBe('X');
    expect(g.cells[1][2].color).toBe('\x1b[31m');
  });
  test('out-of-bounds silently no-ops', () => {
    const g = createGrid(5, 5);
    expect(() => setCell(g, 99, 99, 'Z')).not.toThrow();
    expect(() => setCell(g, -1, -1, 'Z')).not.toThrow();
  });
  test('color defaults to null', () => {
    const g = createGrid(3, 3);
    setCell(g, 0, 0, 'A');
    expect(g.cells[0][0].color).toBeNull();
  });
});

describe('getCell', () => {
  test('returns the cell at position', () => {
    const g = createGrid(5, 5);
    setCell(g, 1, 2, 'Q', '\x1b[33m');
    const c = getCell(g, 1, 2);
    expect(c?.ch).toBe('Q');
    expect(c?.color).toBe('\x1b[33m');
  });
  test('returns undefined out-of-bounds', () => {
    const g = createGrid(3, 3);
    expect(getCell(g, 99, 99)).toBeUndefined();
    expect(getCell(g, -1, 0)).toBeUndefined();
  });
});

describe('clearGrid', () => {
  test('resets all cells to space + null color', () => {
    const g = createGrid(3, 3);
    setCell(g, 1, 1, 'A', '\x1b[32m');
    clearGrid(g);
    expect(g.cells[1][1].ch).toBe(' ');
    expect(g.cells[1][1].color).toBeNull();
  });
});

describe('serializeGrid', () => {
  test('starts with cursor-home escape', () => {
    const g = createGrid(2, 1);
    const s = serializeGrid(g);
    expect(s.startsWith('\x1b[H')).toBe(true);
  });
  test('contains color escape when cell.color is set', () => {
    const g = createGrid(2, 1);
    setCell(g, 0, 0, 'A', '\x1b[31m');
    const s = serializeGrid(g);
    expect(s).toContain('\x1b[31m');
    expect(s).toContain('A');
  });
  test('emits row-terminator reset + newline per row', () => {
    const g = createGrid(2, 3);
    const s = serializeGrid(g);
    const newlineCount = (s.match(/\n/g) ?? []).length;
    expect(newlineCount).toBe(3);
  });
  test('color-tracking minimizes redundant escape sequences', () => {
    const g = createGrid(3, 1);
    setCell(g, 0, 0, 'A', '\x1b[31m');
    setCell(g, 1, 0, 'B', '\x1b[31m');
    setCell(g, 2, 0, 'C', '\x1b[31m');
    const s = serializeGrid(g);
    const redCount = (s.match(/\x1b\[31m/g) ?? []).length;
    expect(redCount).toBe(1);
  });
});
