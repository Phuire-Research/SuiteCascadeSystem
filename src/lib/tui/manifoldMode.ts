// Diamond B-18 (CD-53 SMPSA · Pewter Tessera v2 — SCS Manifold Particle Sphere):
// Replaces STRATIDIAN_MODES[idx] backdrop in installAnimation.ts. Renders the
// SCS §§0-9 Manifold as a tilted, rotating particle sphere with concept-label
// orbits and Diameter connection lines. Phase-driven density + dominant accent.
//
// Pewter doctrinal anchor: D8 .suite-hr rotating-through-8-suite-colors projected
// into 3D + time. Mosaic principle (each Suite = one tessera) extends from the
// 30px web SVG tile to spherical particle distribution. The metallic frame that
// holds the colors operates at 30 FPS via the Pewter D5 Embossed Border framing
// the rotating Manifold visible through it.

import { setCell, type Grid } from './grid';
import type { TerminalCaps } from './terminalCaps';
import { rgbToAnsi, SUITE_COLORS, SUITE_COLORS_DARK, SUITE_ORDER, type RGB } from './colors';

const ASPECT = 0.5;
const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));
const AXIS_TILT = (23 * Math.PI) / 180;

export type ManifoldPhase = 'pre-spawn' | 'awaiting-alive' | 'ready';

export type SphericalConcept = {
  label: string;
  suite: keyof typeof SUITE_COLORS;
  thetaDeg: number;
  phiDeg: number;
};

export type DiameterConnection = {
  a: string;
  b: string;
  colorHint: keyof typeof SUITE_COLORS;
};

// 42-concept SCS Manifold inventory curated from CLAUDE.md §§0-9.
// theta = longitude (0..360 deg) · phi = latitude (-90..90 deg).
// Equator (phi=0) = 8 Suites · mid-latitudes = Crystralines · poles = §0/§5 anchors.
export const MANIFOLD_CONCEPTS: SphericalConcept[] = [
  { label: 'Huirth', suite: 'Obsidian', thetaDeg: 0, phiDeg: 90 },
  { label: 'Muxium of Muxiums', suite: 'Obsidian', thetaDeg: 60, phiDeg: 75 },
  { label: 'Higher-Order', suite: 'Obsidian', thetaDeg: 180, phiDeg: 75 },
  { label: 'Demometer', suite: 'Maroon', thetaDeg: 0, phiDeg: 30 },
  { label: 'Diameter', suite: 'Rust', thetaDeg: 45, phiDeg: 30 },
  { label: 'Muxameter', suite: 'Ochre', thetaDeg: 90, phiDeg: 30 },
  { label: 'Muxonomy', suite: 'Viridian', thetaDeg: 135, phiDeg: 30 },
  { label: 'Stratidia', suite: 'Cobalt', thetaDeg: 180, phiDeg: 30 },
  { label: 'Vermillion', suite: 'Maroon', thetaDeg: 225, phiDeg: 30 },
  { label: 'A-I Pattern', suite: 'Rust', thetaDeg: 270, phiDeg: 30 },
  { label: 'Band', suite: 'Ochre', thetaDeg: 315, phiDeg: 30 },
  { label: 'Maroon', suite: 'Maroon', thetaDeg: 0, phiDeg: 0 },
  { label: 'Rust', suite: 'Rust', thetaDeg: 45, phiDeg: 0 },
  { label: 'Ochre', suite: 'Ochre', thetaDeg: 90, phiDeg: 0 },
  { label: 'Viridian', suite: 'Viridian', thetaDeg: 135, phiDeg: 0 },
  { label: 'Cobalt', suite: 'Cobalt', thetaDeg: 180, phiDeg: 0 },
  { label: 'Amethyst', suite: 'Amethyst', thetaDeg: 225, phiDeg: 0 },
  { label: 'Rose', suite: 'Rose', thetaDeg: 270, phiDeg: 0 },
  { label: 'Obsidian', suite: 'Obsidian', thetaDeg: 315, phiDeg: 0 },
  { label: 'Cascade Length', suite: 'Cobalt', thetaDeg: 30, phiDeg: -15 },
  { label: '8-Gate Cycle', suite: 'Amethyst', thetaDeg: 75, phiDeg: -15 },
  { label: 'Triadic Band', suite: 'Amethyst', thetaDeg: 120, phiDeg: -15 },
  { label: 'Pearl', suite: 'Maroon', thetaDeg: 165, phiDeg: -15 },
  { label: 'Cerulean', suite: 'Ochre', thetaDeg: 210, phiDeg: -15 },
  { label: 'Base Lambda', suite: 'Obsidian', thetaDeg: 255, phiDeg: -15 },
  { label: 'Critical-Active', suite: 'Rose', thetaDeg: 300, phiDeg: -15 },
  { label: 'RI', suite: 'Cobalt', thetaDeg: 345, phiDeg: -15 },
  { label: 'Diamond', suite: 'Ochre', thetaDeg: 0, phiDeg: -30 },
  { label: 'Onyx', suite: 'Obsidian', thetaDeg: 60, phiDeg: -30 },
  { label: 'Opal', suite: 'Amethyst', thetaDeg: 120, phiDeg: -30 },
  { label: 'Automata', suite: 'Rust', thetaDeg: 180, phiDeg: -30 },
  { label: 'Ego-Lambda Pair', suite: 'Viridian', thetaDeg: 240, phiDeg: -30 },
  { label: 'Concluder', suite: 'Maroon', thetaDeg: 300, phiDeg: -30 },
  { label: 'Muxistration', suite: 'Rose', thetaDeg: 30, phiDeg: -50 },
  { label: 'Forward Pass', suite: 'Viridian', thetaDeg: 90, phiDeg: -50 },
  { label: 'Suite 8', suite: 'Amethyst', thetaDeg: 150, phiDeg: -50 },
  { label: 'Conductor', suite: 'Cobalt', thetaDeg: 210, phiDeg: -50 },
  { label: 'Shatterite', suite: 'Rose', thetaDeg: 270, phiDeg: -50 },
  { label: 'Tier 0 anor 1', suite: 'Rust', thetaDeg: 330, phiDeg: -50 },
  { label: 'Anor', suite: 'Ochre', thetaDeg: 0, phiDeg: -75 },
  { label: 'Lambda Event', suite: 'Obsidian', thetaDeg: 120, phiDeg: -75 },
  { label: 'Stratidian Trajectory', suite: 'Viridian', thetaDeg: 240, phiDeg: -75 },
];

// 18 logical Diameter connections (cross-references in CLAUDE.md).
// Lines render only when both endpoints are on the visible hemisphere (front-facing) —
// the Manifold reveals itself as it rotates: connections compose + decompose
// like neurons firing across the rotating brain.
export const MANIFOLD_DIAMETERS: DiameterConnection[] = [
  { a: 'Demometer', b: 'Diameter', colorHint: 'Maroon' },
  { a: 'Diameter', b: 'Muxameter', colorHint: 'Rust' },
  { a: 'Muxameter', b: 'Muxonomy', colorHint: 'Ochre' },
  { a: 'Diamond', b: 'Onyx', colorHint: 'Viridian' },
  { a: 'Diamond', b: 'Opal', colorHint: 'Amethyst' },
  { a: 'Onyx', b: 'Pearl', colorHint: 'Maroon' },
  { a: 'Vermillion', b: 'A-I Pattern', colorHint: 'Rust' },
  { a: 'Pearl', b: 'Vermillion', colorHint: 'Maroon' },
  { a: 'Base Lambda', b: 'RI', colorHint: 'Obsidian' },
  { a: 'Base Lambda', b: 'Automata', colorHint: 'Rose' },
  { a: 'RI', b: 'Automata', colorHint: 'Cobalt' },
  { a: 'Critical-Active', b: 'Concluder', colorHint: 'Rose' },
  { a: 'Triadic Band', b: 'Forward Pass', colorHint: 'Amethyst' },
  { a: 'Suite 8', b: 'Conductor', colorHint: 'Cobalt' },
  { a: 'Suite 8', b: 'Shatterite', colorHint: 'Amethyst' },
  { a: 'Cascade Length', b: 'Tier 0 anor 1', colorHint: 'Rust' },
  { a: 'Anor', b: 'Muxistration', colorHint: 'Ochre' },
  { a: 'Huirth', b: 'Stratidian Trajectory', colorHint: 'Obsidian' },
];

type PhaseParams = {
  particleRatio: number;
  labelBudget: number;
  lineCount: number;
  spinRate: number;
  accentSuiteIdx: number;
};

const PHASE_PARAMS: Record<ManifoldPhase, PhaseParams> = {
  'pre-spawn': {
    particleRatio: 0.3,
    labelBudget: 5,
    lineCount: 0,
    spinRate: 0.18,
    accentSuiteIdx: 4,
  },
  'awaiting-alive': {
    particleRatio: 0.7,
    labelBudget: 12,
    lineCount: 5,
    spinRate: 0.3,
    accentSuiteIdx: 2,
  },
  ready: { particleRatio: 1.0, labelBudget: 24, lineCount: 18, spinRate: 0.55, accentSuiteIdx: 3 },
};

export function particleCountFor(cols: number, rows: number): number {
  if (cols < 100 || rows < 32) return 80;
  if (cols < 140 || rows < 44) return 160;
  return 280;
}

export function labelBudgetFor(termWidth: number, phaseBudget: number): number {
  if (termWidth < 100) return Math.min(phaseBudget, 8);
  if (termWidth < 140) return Math.min(phaseBudget, 16);
  if (termWidth < 180) return Math.min(phaseBudget, 24);
  return phaseBudget;
}

type Vec3 = { x: number; y: number; z: number };

function rotateY(v: Vec3, angle: number): Vec3 {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  return { x: v.x * c + v.z * s, y: v.y, z: -v.x * s + v.z * c };
}

function rotateX(v: Vec3, angle: number): Vec3 {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  return { x: v.x, y: v.y * c - v.z * s, z: v.y * s + v.z * c };
}

export function applyManifoldRotation(v: Vec3, t: number, spinRate: number): Vec3 {
  return rotateX(rotateY(v, t * spinRate), AXIS_TILT);
}

type Projected = { x: number; y: number; depth: number };

function project(v: Vec3, cx: number, cy: number, radiusX: number, radiusY: number): Projected {
  return {
    x: cx + Math.round(v.x * radiusX),
    y: cy + Math.round(v.y * radiusY * ASPECT),
    depth: v.z,
  };
}

function glyphForDepth(depth: number, unicode: boolean): string {
  if (!unicode) {
    if (depth >= 0.55) return 'O';
    if (depth >= 0.2) return 'o';
    if (depth >= -0.2) return '*';
    return '.';
  }
  if (depth >= 0.85) return '●';
  if (depth >= 0.55) return '◉';
  if (depth >= 0.2) return '◯';
  if (depth >= -0.2) return '*';
  if (depth >= -0.55) return '•';
  return '·';
}

function brightnessForDepth(depth: number): number {
  return 0.35 + 0.65 * ((depth + 1) / 2);
}

function blendRgb(rgb: RGB, brightness: number): RGB {
  return {
    r: Math.round(rgb.r * brightness),
    g: Math.round(rgb.g * brightness),
    b: Math.round(rgb.b * brightness),
  };
}

export function fibonacciParticle(i: number, n: number): Vec3 {
  const y = 1 - (2 * i) / Math.max(1, n - 1);
  const radius = Math.sqrt(Math.max(0, 1 - y * y));
  const theta = i * GOLDEN_ANGLE;
  return { x: radius * Math.cos(theta), y, z: radius * Math.sin(theta) };
}

export function sphericalToCart(thetaDeg: number, phiDeg: number): Vec3 {
  const theta = (thetaDeg * Math.PI) / 180;
  const phi = (phiDeg * Math.PI) / 180;
  return {
    x: Math.cos(phi) * Math.cos(theta),
    y: Math.sin(phi),
    z: Math.cos(phi) * Math.sin(theta),
  };
}

// Local copies of bresenham + lineChar — kept here to keep modes.ts unchanged.
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

function renderDiameterLines(
  grid: Grid,
  caps: TerminalCaps,
  t: number,
  spinRate: number,
  lineCount: number,
  cx: number,
  cy: number,
  radiusX: number,
  radiusY: number,
): void {
  const conceptLookup = new Map<string, SphericalConcept>(
    MANIFOLD_CONCEPTS.map((c) => [c.label, c]),
  );
  const slice = MANIFOLD_DIAMETERS.slice(0, Math.min(lineCount, MANIFOLD_DIAMETERS.length));
  for (const conn of slice) {
    const ca = conceptLookup.get(conn.a);
    const cb = conceptLookup.get(conn.b);
    if (!ca || !cb) continue;
    const va = applyManifoldRotation(sphericalToCart(ca.thetaDeg, ca.phiDeg), t, spinRate);
    const vb = applyManifoldRotation(sphericalToCart(cb.thetaDeg, cb.phiDeg), t, spinRate);
    if (va.z < 0.05 || vb.z < 0.05) continue; // both endpoints must be visibly forward
    const pa = project(va, cx, cy, radiusX, radiusY);
    const pb = project(vb, cx, cy, radiusX, radiusY);
    const baseRgb = SUITE_COLORS[conn.colorHint];
    const dimRgb = blendRgb(baseRgb, 0.45);
    const ch = lineChar(pb.x - pa.x, pb.y - pa.y);
    bresenham(grid, pa.x, pa.y, pb.x, pb.y, ch, rgbToAnsi(dimRgb, caps));
  }
}

function renderConceptLabels(
  grid: Grid,
  caps: TerminalCaps,
  t: number,
  spinRate: number,
  budget: number,
  cx: number,
  cy: number,
  radiusX: number,
  radiusY: number,
): void {
  type RenderedLabel = {
    label: string;
    x: number;
    y: number;
    depth: number;
    suite: keyof typeof SUITE_COLORS;
  };
  const candidates: RenderedLabel[] = [];
  for (const concept of MANIFOLD_CONCEPTS) {
    const v = applyManifoldRotation(sphericalToCart(concept.thetaDeg, concept.phiDeg), t, spinRate);
    if (v.z < 0) continue; // back-facing — skip
    const proj = project(v, cx, cy, radiusX, radiusY);
    candidates.push({
      label: concept.label,
      x: proj.x,
      y: proj.y,
      depth: proj.depth,
      suite: concept.suite,
    });
  }
  // Front-most labels selected first up to budget
  candidates.sort((a, b) => b.depth - a.depth);
  const selected = candidates.slice(0, budget);
  for (const lbl of selected) {
    const baseRgb = SUITE_COLORS[lbl.suite];
    const brightness = brightnessForDepth(lbl.depth);
    const rgb = blendRgb(baseRgb, brightness);
    const color = rgbToAnsi(rgb, caps);
    // Render label characters left-to-right starting at projected position
    for (let i = 0; i < lbl.label.length; i++) {
      setCell(grid, lbl.x + i, lbl.y, lbl.label[i], color);
    }
  }
}

export function renderManifoldSphere(
  t: number,
  grid: Grid,
  caps: TerminalCaps,
  phase: ManifoldPhase,
): void {
  const cols = grid.cols;
  const rows = grid.rows;
  const cx = Math.floor(cols / 2);
  const cy = Math.floor(rows / 2);
  const radiusX = Math.max(8, Math.floor(cols * 0.42));
  const radiusY = Math.max(6, Math.floor(rows * 0.85));

  const params = PHASE_PARAMS[phase];
  const N = particleCountFor(cols, rows);

  // Particles: filtered by phase ratio (deterministic skip-modulus by index)
  type RenderedParticle = { proj: Projected; suiteIdx: number; isAccent: boolean };
  const particles: RenderedParticle[] = [];
  for (let i = 0; i < N; i++) {
    if (params.particleRatio < 1.0) {
      const skipModulus = Math.max(1, Math.round(1 / params.particleRatio));
      if (i % skipModulus !== 0) continue;
    }
    const base = fibonacciParticle(i, N);
    const rot = applyManifoldRotation(base, t, params.spinRate);
    const proj = project(rot, cx, cy, radiusX, radiusY);
    const suiteIdx = i % 8;
    const isAccent = suiteIdx === params.accentSuiteIdx;
    particles.push({ proj, suiteIdx, isAccent });
  }
  particles.sort((a, b) => a.proj.depth - b.proj.depth);
  for (const p of particles) {
    const suiteName = SUITE_ORDER[p.suiteIdx];
    const baseRgb = p.proj.depth > 0 ? SUITE_COLORS[suiteName] : SUITE_COLORS_DARK[suiteName];
    let brightness = brightnessForDepth(p.proj.depth);
    if (p.isAccent) brightness = Math.min(1.0, brightness * 1.2);
    const rgb = blendRgb(baseRgb, brightness);
    const ch = glyphForDepth(p.proj.depth, caps.unicode);
    setCell(grid, p.proj.x, p.proj.y, ch, rgbToAnsi(rgb, caps));
  }

  if (params.lineCount > 0) {
    renderDiameterLines(grid, caps, t, params.spinRate, params.lineCount, cx, cy, radiusX, radiusY);
  }

  renderConceptLabels(
    grid,
    caps,
    t,
    params.spinRate,
    labelBudgetFor(cols, params.labelBudget),
    cx,
    cy,
    radiusX,
    radiusY,
  );
}
