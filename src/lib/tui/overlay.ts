import { setCell, type Grid } from './grid';

export type OverlayCell = { ch: string; color: string | null };
export type OverlayMap = Map<string, OverlayCell>;

function key(x: number, y: number): string {
  return `${y},${x}`;
}

export function createOverlay(): OverlayMap {
  return new Map();
}

export function setOverlayCell(
  map: OverlayMap,
  x: number,
  y: number,
  ch: string,
  color: string | null = null,
): void {
  map.set(key(x, y), { ch, color });
}

export function setOverlayText(
  map: OverlayMap,
  x: number,
  y: number,
  text: string,
  color: string | null = null,
): void {
  for (let i = 0; i < text.length; i++) {
    map.set(key(x + i, y), { ch: text.charAt(i), color });
  }
}

export function clearOverlay(map: OverlayMap): void {
  map.clear();
}

export function composeOverlayOnGrid(grid: Grid, map: OverlayMap): void {
  for (const [k, cell] of map) {
    const [yStr, xStr] = k.split(',');
    const y = parseInt(yStr, 10);
    const x = parseInt(xStr, 10);
    setCell(grid, x, y, cell.ch, cell.color);
  }
}
