import {
  createOverlay,
  setOverlayCell,
  setOverlayText,
  clearOverlay,
  composeOverlayOnGrid,
} from './overlay';
import { createGrid } from './grid';

describe('createOverlay', () => {
  test('returns empty Map', () => {
    const m = createOverlay();
    expect(m.size).toBe(0);
  });
});

describe('setOverlayText', () => {
  test('writes each character at correct x offset using "y,x" key', () => {
    const m = createOverlay();
    setOverlayText(m, 5, 2, 'ABC', '\x1b[32m');
    expect(m.get('2,5')?.ch).toBe('A');
    expect(m.get('2,6')?.ch).toBe('B');
    expect(m.get('2,7')?.ch).toBe('C');
  });
  test('uses provided color for each character', () => {
    const m = createOverlay();
    setOverlayText(m, 0, 0, 'XY', '\x1b[31m');
    expect(m.get('0,0')?.color).toBe('\x1b[31m');
    expect(m.get('0,1')?.color).toBe('\x1b[31m');
  });
});

describe('setOverlayCell', () => {
  test('writes single character at "y,x" key', () => {
    const m = createOverlay();
    setOverlayCell(m, 3, 4, '*', null);
    expect(m.get('4,3')?.ch).toBe('*');
    expect(m.get('4,3')?.color).toBeNull();
  });
});

describe('clearOverlay', () => {
  test('empties the map', () => {
    const m = createOverlay();
    setOverlayCell(m, 3, 3, '!', null);
    clearOverlay(m);
    expect(m.size).toBe(0);
  });
});

describe('composeOverlayOnGrid', () => {
  test('mutates target grid at overlay positions', () => {
    const g = createGrid(10, 5);
    const m = createOverlay();
    setOverlayCell(m, 3, 2, 'Z', '\x1b[35m');
    composeOverlayOnGrid(g, m);
    expect(g.cells[2][3].ch).toBe('Z');
    expect(g.cells[2][3].color).toBe('\x1b[35m');
  });
  test('overlay WINS — overwrites existing cell content', () => {
    const g = createGrid(5, 3);
    g.cells[0][0] = { ch: 'X', color: '\x1b[31m' };
    const m = createOverlay();
    setOverlayCell(m, 0, 0, 'Y', '\x1b[34m');
    composeOverlayOnGrid(g, m);
    expect(g.cells[0][0].ch).toBe('Y');
    expect(g.cells[0][0].color).toBe('\x1b[34m');
  });
  test('out-of-bounds overlay positions silently no-op', () => {
    const g = createGrid(5, 3);
    const m = createOverlay();
    setOverlayCell(m, 99, 99, '?', null);
    expect(() => composeOverlayOnGrid(g, m)).not.toThrow();
  });
});
