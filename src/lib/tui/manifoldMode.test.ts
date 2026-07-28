import {
  renderManifoldSphere,
  applyManifoldRotation,
  fibonacciParticle,
  sphericalToCart,
  particleCountFor,
  labelBudgetFor,
  MANIFOLD_CONCEPTS,
  MANIFOLD_DIAMETERS,
} from './manifoldMode';
import { createGrid } from './grid';
import type { TerminalCaps } from './terminalCaps';

const CAPS: TerminalCaps = {
  truecolor: true,
  unicode: true,
  altBuffer: true,
  cols: 120,
  rows: 40,
};

const ASCII_CAPS: TerminalCaps = {
  truecolor: false,
  unicode: false,
  altBuffer: true,
  cols: 80,
  rows: 30,
};

describe('manifoldMode — Diamond B-18 (CD-53 SMPSA · SCS Manifold Particle Sphere)', () => {
  it('exports 42 concepts in MANIFOLD_CONCEPTS', () => {
    expect(MANIFOLD_CONCEPTS).toHaveLength(42);
    // Sanity: north pole anchor exists, equator suites exist, south pole closer exists
    const labels = MANIFOLD_CONCEPTS.map((c) => c.label);
    expect(labels).toContain('Huirth');
    expect(labels).toContain('Maroon');
    expect(labels).toContain('Cobalt');
    expect(labels).toContain('Stratidian Trajectory');
  });

  it('exports 18 Diameter connections in MANIFOLD_DIAMETERS', () => {
    expect(MANIFOLD_DIAMETERS).toHaveLength(18);
    // Sanity: canonical Diamond ↔ Onyx Ego-Lambda Pair edge
    expect(MANIFOLD_DIAMETERS.find((d) => d.a === 'Diamond' && d.b === 'Onyx')).toBeDefined();
  });

  it('Fibonacci sphere distributes points on unit sphere (radius ≈ 1)', () => {
    const N = 100;
    for (let i = 0; i < N; i++) {
      const v = fibonacciParticle(i, N);
      const r = Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
      // Allow small numerical tolerance
      expect(r).toBeGreaterThan(0.95);
      expect(r).toBeLessThan(1.05);
    }
  });

  it('sphericalToCart converts canonical polar/equator points correctly', () => {
    // North pole (phi=90)
    const np = sphericalToCart(0, 90);
    expect(np.y).toBeCloseTo(1);
    expect(np.x).toBeCloseTo(0);
    expect(np.z).toBeCloseTo(0);

    // Equator at theta=0 → x=1
    const eq0 = sphericalToCart(0, 0);
    expect(eq0.x).toBeCloseTo(1);
    expect(eq0.y).toBeCloseTo(0);
    expect(eq0.z).toBeCloseTo(0);

    // Equator at theta=90 → z=1
    const eq90 = sphericalToCart(90, 0);
    expect(eq90.z).toBeCloseTo(1);
    expect(eq90.y).toBeCloseTo(0);
  });

  it('applyManifoldRotation preserves vector magnitude (rotation invariance)', () => {
    const v = { x: 0.5, y: 0.7, z: 0.5 };
    const original = Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
    const rotated = applyManifoldRotation(v, 5.0, 0.3);
    const rotMag = Math.sqrt(rotated.x * rotated.x + rotated.y * rotated.y + rotated.z * rotated.z);
    expect(rotMag).toBeCloseTo(original, 5);
  });

  it('particleCountFor scales by terminal size', () => {
    expect(particleCountFor(80, 30)).toBe(80); // small
    expect(particleCountFor(120, 40)).toBe(160); // medium
    expect(particleCountFor(180, 60)).toBe(280); // large
  });

  it('labelBudgetFor caps phase budget by terminal width', () => {
    expect(labelBudgetFor(80, 24)).toBe(8); // narrow caps to 8
    expect(labelBudgetFor(120, 24)).toBe(16); // medium caps to 16
    expect(labelBudgetFor(160, 24)).toBe(24); // large caps to 24
    expect(labelBudgetFor(120, 5)).toBe(5); // already-low budget retained
  });

  it('renderManifoldSphere produces non-empty grid output (truecolor + unicode)', () => {
    const grid = createGrid(120, 40);
    renderManifoldSphere(2.0, grid, CAPS, 'ready');
    let nonBlank = 0;
    for (let y = 0; y < grid.rows; y++) {
      for (let x = 0; x < grid.cols; x++) {
        const cell = grid.cells[y][x];
        if (cell.ch !== ' ' && cell.ch !== '') nonBlank++;
      }
    }
    expect(nonBlank).toBeGreaterThan(50);
  });

  it('phase ready renders more cells than phase pre-spawn (density modulation)', () => {
    const grid1 = createGrid(120, 40);
    const grid2 = createGrid(120, 40);
    renderManifoldSphere(2.0, grid1, CAPS, 'pre-spawn');
    renderManifoldSphere(2.0, grid2, CAPS, 'ready');
    let preSpawnCount = 0;
    let readyCount = 0;
    for (let y = 0; y < grid1.rows; y++) {
      for (let x = 0; x < grid1.cols; x++) {
        if (grid1.cells[y][x].ch !== ' ') preSpawnCount++;
        if (grid2.cells[y][x].ch !== ' ') readyCount++;
      }
    }
    expect(readyCount).toBeGreaterThan(preSpawnCount);
  });

  it('ASCII fallback produces output without unicode glyphs', () => {
    const grid = createGrid(80, 30);
    renderManifoldSphere(2.0, grid, ASCII_CAPS, 'ready');
    const unicodeGlyphs = ['●', '◉', '◯', '•', '·'];
    let foundUnicode = 0;
    for (let y = 0; y < grid.rows; y++) {
      for (let x = 0; x < grid.cols; x++) {
        if (unicodeGlyphs.includes(grid.cells[y][x].ch)) foundUnicode++;
      }
    }
    expect(foundUnicode).toBe(0);
  });

  it('all Diameter endpoints reference valid concepts (no orphans)', () => {
    const conceptLabels = new Set(MANIFOLD_CONCEPTS.map((c) => c.label));
    for (const conn of MANIFOLD_DIAMETERS) {
      expect(conceptLabels.has(conn.a)).toBe(true);
      expect(conceptLabels.has(conn.b)).toBe(true);
    }
  });
});
