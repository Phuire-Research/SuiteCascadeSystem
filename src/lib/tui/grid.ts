import type { TerminalCaps } from './terminalCaps';

export type Cell = { ch: string; color: string | null };

export type Grid = {
  cols: number;
  rows: number;
  cells: Cell[][];
};

export function createGrid(cols: number, rows: number, fillCh?: string): Grid {
  const fill = fillCh ?? ' ';
  const cells: Cell[][] = [];
  for (let r = 0; r < rows; r++) {
    const row: Cell[] = [];
    for (let c = 0; c < cols; c++) {
      row.push({ ch: fill, color: null });
    }
    cells.push(row);
  }
  return { cols, rows, cells };
}

export function setCell(
  grid: Grid,
  x: number,
  y: number,
  ch: string,
  color: string | null = null,
): void {
  if (y < 0 || y >= grid.rows) return;
  if (x < 0 || x >= grid.cols) return;
  const cell = grid.cells[y][x];
  cell.ch = ch;
  cell.color = color;
}

export function getCell(grid: Grid, x: number, y: number): Cell | undefined {
  if (y < 0 || y >= grid.rows) return undefined;
  if (x < 0 || x >= grid.cols) return undefined;
  return grid.cells[y][x];
}

export function clearGrid(grid: Grid, fillCh?: string): void {
  const fill = fillCh ?? ' ';
  for (let r = 0; r < grid.rows; r++) {
    for (let c = 0; c < grid.cols; c++) {
      const cell = grid.cells[r][c];
      cell.ch = fill;
      cell.color = null;
    }
  }
}

export function serializeGrid(grid: Grid, _caps?: TerminalCaps): string {
  const parts: string[] = ['\x1b[H'];
  for (let r = 0; r < grid.rows; r++) {
    let lastColor: string | null | undefined = undefined;
    for (let c = 0; c < grid.cols; c++) {
      const cell = grid.cells[r][c];
      if (cell.color !== lastColor) {
        parts.push(cell.color ?? '\x1b[0m');
        lastColor = cell.color;
      }
      parts.push(cell.ch);
    }
    parts.push('\x1b[0m\n');
  }
  return parts.join('');
}
