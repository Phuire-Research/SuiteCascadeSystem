import { setCell, type Grid } from './grid';
import type { TerminalCaps } from './terminalCaps';
import { hslToRgb, rgbToAnsi, SUITE_COLORS, SUITE_ORDER } from './colors';

export type ModeFn = (t: number, grid: Grid, caps: TerminalCaps) => void;

const ASPECT = 0.5;

function bresenham(
  grid: Grid,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  ch: string,
  color: string | null,
): void {
  let cx = Math.round(x0);
  let cy = Math.round(y0);
  const ex = Math.round(x1);
  const ey = Math.round(y1);
  const dx = Math.abs(ex - cx);
  const dy = Math.abs(ey - cy);
  const sx = cx < ex ? 1 : -1;
  const sy = cy < ey ? 1 : -1;
  let err = dx - dy;
  let safety = dx + dy + 4;
  while (safety-- > 0) {
    setCell(grid, cx, cy, ch, color);
    if (cx === ex && cy === ey) break;
    const e2 = 2 * err;
    if (e2 > -dy) {
      err -= dy;
      cx += sx;
    }
    if (e2 < dx) {
      err += dx;
      cy += sy;
    }
  }
}

function lineChar(dx: number, dy: number): string {
  const adx = Math.abs(dx);
  const ady = Math.abs(dy);
  if (adx === 0 && ady === 0) return '·';
  if (ady * 2 < adx) return '─';
  if (adx * 2 < ady) return '│';
  return dx * dy > 0 ? '╲' : '╱';
}

export const cascade: ModeFn = (t, grid, caps) => {
  const cols = grid.cols;
  const rows = grid.rows;
  const shift = Math.floor(t * 10);
  const bandWidth = Math.max(1, Math.floor(cols / 8));
  const suiteChars = ['·', '╌', '─', '┼', '│', '◆', '○', '▪'];
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const idx = Math.floor(((((x + y + shift) % cols) + cols) % cols) / bandWidth) % 8;
      const name = SUITE_ORDER[idx];
      const rgb = SUITE_COLORS[name];
      setCell(grid, x, y, suiteChars[idx], rgbToAnsi(rgb, caps));
    }
  }
};

export const diameter: ModeFn = (t, grid, caps) => {
  const cols = grid.cols;
  const rows = grid.rows;
  const cx = Math.floor(cols / 2);
  const cy = Math.floor(rows / 2);
  const radius = Math.max(2, Math.floor(Math.min(cols * 0.4, rows * 0.8)));
  const cobalt = rgbToAnsi(SUITE_COLORS.Cobalt, caps);
  for (let a = 0; a < Math.PI * 2; a += 0.05) {
    const px = cx + Math.round(radius * Math.cos(a));
    const py = cy + Math.round(radius * Math.sin(a) * ASPECT);
    setCell(grid, px, py, '·', cobalt);
  }
  const a1 = t * 0.8;
  const a2 = t * 1.37;
  const p1x = cx + Math.round(radius * Math.cos(a1));
  const p1y = cy + Math.round(radius * Math.sin(a1) * ASPECT);
  const p2x = cx + Math.round(radius * Math.cos(a2));
  const p2y = cy + Math.round(radius * Math.sin(a2) * ASPECT);
  const amethyst = rgbToAnsi(SUITE_COLORS.Amethyst, caps);
  bresenham(grid, p1x, p1y, p2x, p2y, lineChar(p2x - p1x, p2y - p1y), amethyst);
  setCell(grid, p1x, p1y, '◈', rgbToAnsi(SUITE_COLORS.Rust, caps));
  setCell(grid, p2x, p2y, '◈', rgbToAnsi(SUITE_COLORS.Ochre, caps));
};

export const demometer: ModeFn = (t, grid, caps) => {
  const cols = grid.cols;
  const rows = grid.rows;
  const cx = Math.floor(cols / 2);
  const cy = Math.floor(rows / 2);
  const radius = Math.max(2, Math.floor(Math.min(cols * 0.35, rows * 0.7)));
  const sides = 8;
  const rotAngle = t * 0.3;
  const vx: number[] = [];
  const vy: number[] = [];
  for (let i = 0; i < sides; i++) {
    const angle = rotAngle + (i * Math.PI * 2) / sides;
    vx.push(cx + Math.round(radius * Math.cos(angle)));
    vy.push(cy + Math.round(radius * Math.sin(angle) * ASPECT));
  }
  for (let i = 0; i < sides; i++) {
    const j = (i + 1) % sides;
    const name = SUITE_ORDER[i % 8];
    const color = rgbToAnsi(SUITE_COLORS[name], caps);
    bresenham(grid, vx[i], vy[i], vx[j], vy[j], lineChar(vx[j] - vx[i], vy[j] - vy[i]), color);
  }
  for (let i = 0; i < sides; i++) {
    const name = SUITE_ORDER[i % 8];
    setCell(grid, vx[i], vy[i], '◉', rgbToAnsi(SUITE_COLORS[name], caps));
  }
};

export const muxameter: ModeFn = (t, grid, caps) => {
  const cols = grid.cols;
  const rows = grid.rows;
  const cx = Math.floor(cols / 2);
  const cy = Math.floor(rows / 2);
  // OQ-6 WARN fix: r_node = Math.min(cols * 0.3, rows * 0.6)
  const r_node = Math.max(2, Math.min(cols * 0.3, rows * 0.6));
  const N = 6;
  const nx: number[] = [];
  const ny: number[] = [];
  const pulse: number[] = [];
  for (let i = 0; i < N; i++) {
    const angle = (i * Math.PI * 2) / N;
    nx.push(cx + Math.round(r_node * Math.cos(angle)));
    ny.push(cy + Math.round(r_node * Math.sin(angle) * ASPECT));
    pulse.push(0.5 + 0.5 * Math.sin(t * 1.5 + (i * Math.PI) / 3));
  }
  const dim = '\x1b[2m';
  const edges: Array<[number, number]> = [
    [0, 2],
    [1, 3],
    [2, 4],
    [3, 5],
    [4, 0],
    [5, 1],
  ];
  for (const [a, b] of edges) {
    bresenham(grid, nx[a], ny[a], nx[b], ny[b], '·', dim);
  }
  const nodeChars = ['⬡', '⬢', '◈', '◉', '●', '○'];
  for (let i = 0; i < N; i++) {
    const rgb = hslToRgb(i * 60, 0.8, 0.4 + pulse[i] * 0.4);
    setCell(grid, nx[i], ny[i], nodeChars[i], rgbToAnsi(rgb, caps));
  }
};

export const stratidia: ModeFn = (t, grid, caps) => {
  const cols = grid.cols;
  const rows = grid.rows;
  const cx = Math.floor(cols / 2);
  const cy = Math.floor(rows / 2);
  const rotOffset = t * 0.5;
  const turns = 4 * Math.PI;
  const step = 0.15;
  const baseScale = Math.min(cols, rows * 2) * 0.06;
  const spiralChars = ['·', '○', '◉', '●'];
  for (let theta = 0; theta < turns; theta += step) {
    const r = 2 + theta * baseScale;
    const angle = theta + rotOffset;
    const sx = cx + Math.round(r * Math.cos(angle));
    const sy = cy + Math.round(r * Math.sin(angle) * ASPECT);
    const progress = theta / turns;
    const rgb = hslToRgb(progress * 300, 0.9, 0.6);
    const ch = spiralChars[Math.floor(progress * 4) % 4];
    setCell(grid, sx, sy, ch, rgbToAnsi(rgb, caps));
  }
};

export const suiteWheel: ModeFn = (t, grid, caps) => {
  const cols = grid.cols;
  const rows = grid.rows;
  const cx = Math.floor(cols / 2);
  const cy = Math.floor(rows / 2);
  const outerR = Math.max(3, Math.floor(Math.min(cols * 0.4, rows * 0.8)));
  const innerR = Math.max(1, Math.floor(outerR * 0.15));
  const rotAngle = t * 0.2;
  const obsidian = rgbToAnsi(SUITE_COLORS.Obsidian, caps);
  for (let a = 0; a < Math.PI * 2; a += 0.05) {
    const px = cx + Math.round(outerR * Math.cos(a));
    const py = cy + Math.round(outerR * Math.sin(a) * ASPECT);
    setCell(grid, px, py, '○', obsidian);
  }
  for (let i = 0; i < 8; i++) {
    const spokeAngle = rotAngle + (i * Math.PI * 2) / 8;
    const name = SUITE_ORDER[i];
    const color = rgbToAnsi(SUITE_COLORS[name], caps);
    const sx = cx + Math.round(innerR * Math.cos(spokeAngle));
    const sy = cy + Math.round(innerR * Math.sin(spokeAngle) * ASPECT);
    const ex = cx + Math.round(outerR * Math.cos(spokeAngle));
    const ey = cy + Math.round(outerR * Math.sin(spokeAngle) * ASPECT);
    bresenham(grid, sx, sy, ex, ey, lineChar(ex - sx, ey - sy), color);
  }
  setCell(grid, cx, cy, '✦', rgbToAnsi(SUITE_COLORS.Ochre, caps));
};

export const STRATIDIAN_MODES: ModeFn[] = [
  cascade,
  diameter,
  demometer,
  muxameter,
  stratidia,
  suiteWheel,
];

export const STRATIDIAN_MODE_NAMES: string[] = [
  'CASCADE',
  'DIAMETER',
  'DEMOMETER',
  'MUXAMETER',
  'STRATIDIA',
  'SUITE-WHEEL',
];
