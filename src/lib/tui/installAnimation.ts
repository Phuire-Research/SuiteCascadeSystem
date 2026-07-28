// Diamond B-17 (CD-48 FSIAO · Pewter Tessera D5 Embossed Pane Border):
// Full-screen install initialization animation. Activated by handleInstall
// (Path A or Path B), ceases on first-spawn-alive registry signal. Composes
// existing Stratidian-mode animation (modes.ts) with a Pewter-styled centered
// status pane (D5 Embossed Border Pair top-right-dark / bottom-left-light).
//
// Phases:
//   'pre-spawn'      — bridge cloning + scaffolding + spawn pipeline running
//   'awaiting-alive' — spawn dispatched; waiting for SessionStart hook to
//                      write claudeSessionId to registry (ACOFSAT signal)
//   'ready'          — alive signal received; brief 250ms ✓ frame before menu
//
// Mode subset (Pewter HiFi recommendation): 3 of 6 Stratidian modes selected
// for "initializing" semantics; rotated by phase rather than by elapsed-time
// bucket so the visual identity matches the install state machine.

import type { TerminalCaps } from './terminalCaps';
import { createGrid, serializeGrid, type Grid } from './grid';
import { createOverlay, setOverlayText, composeOverlayOnGrid, type OverlayMap } from './overlay';
import { rgbToAnsi, SUITE_COLORS, SUITE_COLORS_DARK, SUITE_COLORS_LIGHT } from './colors';
import { renderManifoldSphere } from './manifoldMode';

const ANSI_RESET = '\x1b[0m';
const ANSI_DIM = '\x1b[2m';
const ANSI_BOLD = '\x1b[1m';

export type InstallPhase = 'pre-spawn' | 'awaiting-alive' | 'ready';

export type InstallAnimationState = {
  startedAt: number;
  ulid: string;
  phase: InstallPhase;
};

// Diamond B-18 (CD-53 SMPSA): backdrop swap from STRATIDIAN_MODES rotation to
// SCS-Manifold-Particle-Sphere render. Phase param threads through the same
// state machine — only the visual content changed.
const PHASE_LABELS: Record<InstallPhase, string> = {
  'pre-spawn': 'INITIALIZING',
  'awaiting-alive': 'AWAITING FIRST RESPONSE',
  ready: 'READY',
};

const PHASE_COLOR_NAMES: Record<InstallPhase, string> = {
  'pre-spawn': 'Cobalt',
  'awaiting-alive': 'Ochre',
  ready: 'Viridian',
};

// Sub-status text driven by phase + elapsed bucket (no fine-grained log-event
// subscription needed; time-based fallback is robust).
function subStatusFor(phase: InstallPhase, elapsedMs: number): string {
  if (phase === 'ready') return 'ALIVE';
  if (phase === 'awaiting-alive') {
    if (elapsedMs > 8_000) return 'Hook latency unusual...';
    return 'SessionStart hook firing...';
  }
  // pre-spawn time buckets (rough — actual phase advance is event-driven)
  if (elapsedMs < 2_000) return 'Cloning bridge...';
  if (elapsedMs < 4_000) return 'Scaffolding cwd...';
  return 'Spawning Terminal...';
}

// Phase-driven progress bar fill ratio [0..1]
function progressFor(phase: InstallPhase, elapsedMs: number): number {
  if (phase === 'ready') return 1;
  if (phase === 'awaiting-alive') {
    // Climb from 0.6 to 0.9 over 8s (slow approach to 1)
    const t = Math.min(elapsedMs / 8_000, 1);
    return 0.6 + 0.3 * t;
  }
  // pre-spawn: 0 → 0.6 over ~5s
  const t = Math.min(elapsedMs / 5_000, 1);
  return 0.6 * t;
}

// Pewter D5 Embossed Pane Border — top + right use DARK; bottom + left use LIGHT.
// Box-drawing glyphs produce the metallic-frame depth effect.
function buildPewterPane(
  overlay: OverlayMap,
  cols: number,
  rows: number,
  paneWidth: number,
  paneHeight: number,
  phase: InstallPhase,
  caps: TerminalCaps,
  elapsedMs: number,
): void {
  const colorName = PHASE_COLOR_NAMES[phase];
  const dark = rgbToAnsi(SUITE_COLORS_DARK[colorName], caps);
  const light = rgbToAnsi(SUITE_COLORS_LIGHT[colorName], caps);
  const accent = rgbToAnsi(SUITE_COLORS[colorName], caps);
  const dim = rgbToAnsi(SUITE_COLORS.Obsidian, caps) + ANSI_DIM;

  const startX = Math.max(0, Math.floor((cols - paneWidth) / 2));
  const startY = Math.max(0, Math.floor((rows - paneHeight) / 2));

  // Top edge — DARK
  setOverlayText(overlay, startX, startY, '┌' + '─'.repeat(paneWidth - 2) + '┐', dark);
  // Bottom edge — LIGHT
  setOverlayText(
    overlay,
    startX,
    startY + paneHeight - 1,
    '└' + '─'.repeat(paneWidth - 2) + '┘',
    light,
  );
  // Left edge — LIGHT (each row)
  // Right edge — DARK (each row)
  for (let i = 1; i < paneHeight - 1; i++) {
    setOverlayText(overlay, startX, startY + i, '│', light);
    setOverlayText(overlay, startX + paneWidth - 1, startY + i, '│', dark);
    // Pane interior fill — clear cells for transparency-via-dim
    const fillRow = ' '.repeat(paneWidth - 2);
    setOverlayText(overlay, startX + 1, startY + i, fillRow, dim);
  }

  // Title (centered, accent + bold)
  const title = 'SCS BRIDGE INITIALIZATION';
  const titleX = startX + Math.max(1, Math.floor((paneWidth - title.length) / 2));
  setOverlayText(overlay, titleX, startY + 1, title, ANSI_BOLD + accent);

  // Phase label (centered)
  const phaseLabel = PHASE_LABELS[phase];
  const phaseX = startX + Math.max(1, Math.floor((paneWidth - phaseLabel.length) / 2));
  setOverlayText(overlay, phaseX, startY + 3, phaseLabel, accent);

  // Sub-status (centered)
  const subStatus = subStatusFor(phase, elapsedMs);
  const subX = startX + Math.max(1, Math.floor((paneWidth - subStatus.length) / 2));
  setOverlayText(overlay, subX, startY + 5, subStatus, dim + ANSI_RESET + dim);

  // Progress bar (centered, full width minus 4 padding)
  const barWidth = paneWidth - 6;
  const filled = Math.round(barWidth * progressFor(phase, elapsedMs));
  const bar = '▓'.repeat(filled) + '░'.repeat(Math.max(0, barWidth - filled));
  const barX = startX + 3;
  setOverlayText(overlay, barX, startY + 7, bar, accent);

  // Diamond B-18: footer text is now the rendering surface designation
  const modeText = 'mode: MANIFOLD';
  const modeX = startX + Math.max(1, Math.floor((paneWidth - modeText.length) / 2));
  setOverlayText(overlay, modeX, startY + paneHeight - 2, modeText, dim);
}

export function renderInstallAnimation(
  state: InstallAnimationState,
  cols: number,
  rows: number,
  caps: TerminalCaps,
  nowMs: number,
): string {
  const elapsedMs = nowMs - state.startedAt;
  const t = elapsedMs / 1000;

  // Diamond B-18 (CD-53 SMPSA): SCS Manifold particle sphere fills the full
  // viewport. Phase parameter drives density modulation (CD-57 MPDM):
  //   pre-spawn 30% sparse · awaiting-alive 70% organizing · ready 100% bloom
  const grid: Grid = createGrid(cols, rows);
  renderManifoldSphere(t, grid, caps, state.phase);

  // Pewter HiFi pane composed over the animation
  const overlay: OverlayMap = createOverlay();
  const paneWidth = Math.min(60, Math.max(40, cols - 8));
  const paneHeight = 12;
  buildPewterPane(overlay, cols, rows, paneWidth, paneHeight, state.phase, caps, elapsedMs);

  // Abort hint (bottom-right, dim, omitted on narrow terminals)
  if (cols >= 60) {
    const abortText = 'Ctrl-C to abort';
    setOverlayText(
      overlay,
      Math.max(0, cols - abortText.length - 2),
      rows - 1,
      abortText,
      ANSI_DIM,
    );
  }

  composeOverlayOnGrid(grid, overlay);
  return serializeGrid(grid, caps);
}

// Public phase-advance helper for handleInstall to drive transitions.
// Returns a NEW InstallAnimationState; caller spread-reassigns into MenuState.
export function advancePhase(
  state: InstallAnimationState,
  nextPhase: InstallPhase,
): InstallAnimationState {
  return { ...state, phase: nextPhase };
}
