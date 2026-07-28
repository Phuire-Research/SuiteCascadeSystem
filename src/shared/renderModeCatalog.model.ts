// SWRM · D3 · the SHARED RENDER-MODE MODEL — the single source of truth for which render modes
// exist. The bridge (Terminal render) consumes it directly; it is PUBLISHED into bridge.json
// (`availableRenderModes`) at every write so the SCP — which watches bridge.json — becomes aware
// of the SAME catalog. One model → the Terminal render and the SCPs draw the identical list (the
// modes can never drift between the two surfaces). The SCP mirrors only the TYPE; the DATA always
// arrives from this model via bridge.json.

import type { ShaderRenderMode } from './shaderRenderMode';
import { SHADER_RENDER_MODES } from './shaderRenderMode';

// the cognitive grouping a UI can tier by (geometric warps · color/grade · temporal · passthrough).
export type RenderModeTier = 'geometric' | 'color' | 'temporal' | 'off';

export interface RenderModeCatalogEntry {
  id: ShaderRenderMode;
  label: string;
  tier: RenderModeTier;
  // one-line human description for the Settings deck (D4) and the SCP picker (D5).
  blurb: string;
}

// the canonical catalog. ◇ Muxon first (the default · the Muxameter). Order = display order.
export const RENDER_MODE_CATALOG: RenderModeCatalogEntry[] = [
  { id: 'muxon',    label: 'Muxon',         tier: 'geometric', blurb: 'The Muxameter — curvature ⟷ chromatic co-enabled. SCS default.' },
  { id: 'crtcurve', label: 'CRT Curve',     tier: 'geometric', blurb: 'Barrel-curved CRT with scanlines and aperture mask.' },
  { id: 'fishbowl', label: 'Fishbowl',      tier: 'geometric', blurb: 'Heavy lens curvature with edge chromatic split.' },
  { id: 'chroma',   label: 'Chroma',        tier: 'color',     blurb: 'Flat chromatic-aberration split, no curvature.' },
  { id: 'crtflat',  label: 'CRT Flat',      tier: 'color',     blurb: 'Scanlines and aperture mask, flat (no warp).' },
  { id: 'lcd',      label: 'LCD',           tier: 'color',     blurb: 'RGB sub-pixel stripe grid.' },
  { id: 'dmg',      label: 'Game Boy DMG',  tier: 'color',     blurb: 'Four-tone green dot-matrix.' },
  { id: 'cga',      label: 'CGA',           tier: 'color',     blurb: '4-color ordered-dither palette.' },
  { id: 'vhs',      label: 'VHS',           tier: 'temporal',  blurb: 'Tape jitter, noise and color bleed (animated).' },
  { id: 'vfd',      label: 'VFD',           tier: 'color',     blurb: 'Vacuum-fluorescent cyan-green glow.' },
  { id: 'eink',     label: 'E-Ink',         tier: 'color',     blurb: 'High-contrast paper-and-ink threshold.' },
  { id: 'off',      label: 'Off',           tier: 'off',       blurb: 'No shader — the raw terminal.' },
];

const CATALOG_BY_ID: Record<ShaderRenderMode, RenderModeCatalogEntry> = RENDER_MODE_CATALOG.reduce(
  (acc, e) => {
    acc[e.id] = e;
    return acc;
  },
  {} as Record<ShaderRenderMode, RenderModeCatalogEntry>,
);

export function renderModeLabel(id: ShaderRenderMode): string {
  return CATALOG_BY_ID[id]?.label ?? id;
}

// invariant guard — the catalog must cover every ShaderRenderMode (caught at module load in dev).
export function renderModeCatalogIsComplete(): boolean {
  return SHADER_RENDER_MODES.every((m) => CATALOG_BY_ID[m] !== undefined);
}
