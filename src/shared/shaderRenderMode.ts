// SWRM · Shader-Wrap Render-mode · the shared vocabulary (one home for main, renderer,
// and the SCP). 12 modes · ◇ Muxon DEFAULT (the Muxameter: curvature⟷chromatic co-enabled).
// Named ShaderRenderMode to avoid the collision with vue.model.ts's RenderMode (SSR strategy).
// Keys + the uMode integers + the geometric curvature amounts mirror the reference design
// (DevCascades/Reference/Refinements prior Release/shader-wrap-reference-design-v2.html).

export type ShaderRenderMode =
  | 'muxon'
  | 'crtcurve'
  | 'fishbowl'
  | 'chroma'
  | 'crtflat'
  | 'lcd'
  | 'dmg'
  | 'cga'
  | 'vhs'
  | 'vfd'
  | 'eink'
  | 'off';

export const SHADER_RENDER_MODE_DEFAULT: ShaderRenderMode = 'muxon';

export const SHADER_RENDER_MODES: ShaderRenderMode[] = [
  'muxon', 'crtcurve', 'fishbowl', 'chroma', 'crtflat',
  'lcd', 'dmg', 'cga', 'vhs', 'vfd', 'eink', 'off',
];

// mode key → the `uMode` integer the fragment shader switches on (reference MODEMAP).
export const SHADER_MODE_UMODE: Record<ShaderRenderMode, number> = {
  off: 0,
  crtflat: 1,
  lcd: 2,
  dmg: 3,
  cga: 4,
  vhs: 5,
  vfd: 6,
  eink: 7,
  crtcurve: 10,
  fishbowl: 11,
  chroma: 12,
  muxon: 13,
};

// the geometric tier (curvature moves pixels → needs the inverse-warp for input). The value
// is the `uCurve` barrel amount; absence = a color/temporal mode (no warp, input forwards 1:1).
// Muxon: uCurve ALSO drives the chromatic separation (sep = uCurve·r²·1.8 in the FRAG) — the
// Muxameter coupling — so one knob scales curvature + fringe together. User-tuned 2026-06-08:
// 0.10 → 0.017 (~1/6) → 0.011 (a further 1/3rd less · whisper-subtle). Vignette pruned (FRAG).
export const SHADER_GEO_CURVE: Partial<Record<ShaderRenderMode, number>> = {
  crtcurve: 0.07,
  fishbowl: 0.16,
  muxon: 0.011,
};

// time-driven modes need an independent rAF tick (uTime) even when the source frame is idle
// (the dual-clock · so VHS jitter / VFD glow keep animating between page repaints).
export const SHADER_TIME_DRIVEN: Partial<Record<ShaderRenderMode, boolean>> = {
  vhs: true,
  vfd: true,
};

// C919 · THE FRAME GOVERNOR — the shader's output frame rate. Default 24 = Like Animation
// (the animation-film rate · the user-chosen brand cadence). The presenter raf loop skips
// draws between frame intervals; the Settings slider (8–60) rides bridge.json.shaderFps
// through the SAME Watcher-Cascade-Pipe as renderMode.
export const DEFAULT_SHADER_FPS = 24;
export const SHADER_FPS_MIN = 8;
export const SHADER_FPS_MAX = 60;

export function clampShaderFps(v: unknown): number | null {
  const n = typeof v === 'number' ? v : typeof v === 'string' ? Number(v) : NaN;
  if (!Number.isFinite(n)) return null;
  return Math.min(SHADER_FPS_MAX, Math.max(SHADER_FPS_MIN, Math.round(n)));
}

export function isShaderRenderMode(v: unknown): v is ShaderRenderMode {
  return typeof v === 'string' && Object.prototype.hasOwnProperty.call(SHADER_MODE_UMODE, v);
}

export function isGeometricMode(mode: ShaderRenderMode): boolean {
  return SHADER_GEO_CURVE[mode] !== undefined;
}
