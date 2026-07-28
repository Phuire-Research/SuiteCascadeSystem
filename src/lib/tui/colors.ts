import type { TerminalCaps } from './terminalCaps';

export type RGB = { r: number; g: number; b: number };

export function hslToRgb(h: number, s: number, l: number): RGB {
  const hh = ((h % 360) + 360) % 360;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((hh / 60) % 2) - 1));
  const m = l - c / 2;
  let r1 = 0;
  let g1 = 0;
  let b1 = 0;
  if (hh < 60) {
    r1 = c;
    g1 = x;
  } else if (hh < 120) {
    r1 = x;
    g1 = c;
  } else if (hh < 180) {
    g1 = c;
    b1 = x;
  } else if (hh < 240) {
    g1 = x;
    b1 = c;
  } else if (hh < 300) {
    r1 = x;
    b1 = c;
  } else {
    r1 = c;
    b1 = x;
  }
  return {
    r: Math.round((r1 + m) * 255),
    g: Math.round((g1 + m) * 255),
    b: Math.round((b1 + m) * 255),
  };
}

function clamp255(n: number): number {
  if (n < 0) return 0;
  if (n > 255) return 255;
  return Math.round(n);
}

function rgbTo256(rgb: RGB): number {
  const r = clamp255(rgb.r);
  const g = clamp255(rgb.g);
  const b = clamp255(rgb.b);
  // Grayscale special-case
  if (Math.abs(r - g) <= 4 && Math.abs(g - b) <= 4) {
    if (r < 8) return 16;
    if (r > 248) return 231;
    return Math.round(((r - 8) / 247) * 24) + 232;
  }
  // 6x6x6 color cube: index = 16 + 36*r + 6*g + b
  const r6 = Math.round((r / 255) * 5);
  const g6 = Math.round((g / 255) * 5);
  const b6 = Math.round((b / 255) * 5);
  return 16 + 36 * r6 + 6 * g6 + b6;
}

export function rgbToAnsi(rgb: RGB, caps: TerminalCaps): string {
  if (caps.truecolor) {
    return `\x1b[38;2;${clamp255(rgb.r)};${clamp255(rgb.g)};${clamp255(rgb.b)}m`;
  }
  return `\x1b[38;5;${rgbTo256(rgb)}m`;
}

export function rgbToAnsiBg(rgb: RGB, caps: TerminalCaps): string {
  if (caps.truecolor) {
    return `\x1b[48;2;${clamp255(rgb.r)};${clamp255(rgb.g)};${clamp255(rgb.b)}m`;
  }
  return `\x1b[48;5;${rgbTo256(rgb)}m`;
}

export function classifyColor(t: number, modeIdx: number): RGB {
  return hslToRgb((t * 30 + modeIdx * 60) % 360, 0.8, 0.6);
}

export const SUITE_COLORS: Record<string, RGB> = {
  Maroon: { r: 128, g: 0, b: 0 },
  Rust: { r: 183, g: 65, b: 14 },
  Ochre: { r: 204, g: 119, b: 34 },
  Viridian: { r: 64, g: 130, b: 109 },
  Cobalt: { r: 0, g: 71, b: 171 },
  Amethyst: { r: 153, g: 102, b: 204 },
  Rose: { r: 255, g: 102, b: 178 },
  Obsidian: { r: 30, g: 30, b: 30 },
};

export const SUITE_ORDER: string[] = [
  'Maroon',
  'Rust',
  'Ochre',
  'Viridian',
  'Cobalt',
  'Amethyst',
  'Rose',
  'Obsidian',
];

// Diamond B-17 (CD-48 FSIAO · Pewter Tessera D5 Embossed Border Pair token):
// darken/lighten helpers for the Embossed Pane Border. Top/right edges use
// SUITE_COLORS_DARK; bottom/left edges use SUITE_COLORS_LIGHT. Together they
// produce the metallic-frame depth effect Pewter HiFi specifies.
export function darken(rgb: RGB, factor = 0.5): RGB {
  return {
    r: clamp255(rgb.r * factor),
    g: clamp255(rgb.g * factor),
    b: clamp255(rgb.b * factor),
  };
}

export function lighten(rgb: RGB, factor = 0.5): RGB {
  return {
    r: clamp255(rgb.r + (255 - rgb.r) * factor),
    g: clamp255(rgb.g + (255 - rgb.g) * factor),
    b: clamp255(rgb.b + (255 - rgb.b) * factor),
  };
}

export const SUITE_COLORS_DARK: Record<string, RGB> = Object.fromEntries(
  Object.entries(SUITE_COLORS).map(([name, rgb]) => [name, darken(rgb, 0.45)]),
);

export const SUITE_COLORS_LIGHT: Record<string, RGB> = Object.fromEntries(
  Object.entries(SUITE_COLORS).map(([name, rgb]) => [name, lighten(rgb, 0.55)]),
);

// SUITE_COLOR_ORDER_FOR_HASH · Boot Overlay Diamond · PTSE per-SCP suite color
// derivation. Seven primary suites (excludes Obsidian — reserved for Suite 0).
// Hash of scpName mod 7 selects one — deterministic per SCP, distinct across
// neighbors. Citation: R4 §2 Suite Coherence (Option B Auto-Derived).
const SUITE_COLOR_ORDER_FOR_HASH: string[] = [
  'Maroon',
  'Rust',
  'Ochre',
  'Viridian',
  'Cobalt',
  'Amethyst',
  'Rose',
];

export function suiteColorForScp(scpName: string): RGB {
  if (!scpName || scpName.length === 0) {
    return SUITE_COLORS.Cobalt;
  }
  let hash = 0;
  for (let i = 0; i < scpName.length; i++) {
    hash = (hash + scpName.charCodeAt(i)) | 0;
  }
  const idx = ((hash % SUITE_COLOR_ORDER_FOR_HASH.length) + SUITE_COLOR_ORDER_FOR_HASH.length)
    % SUITE_COLOR_ORDER_FOR_HASH.length;
  const name = SUITE_COLOR_ORDER_FOR_HASH[idx];
  return SUITE_COLORS[name] ?? SUITE_COLORS.Cobalt;
}
