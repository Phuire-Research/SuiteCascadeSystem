/**
 * bootOverlay · Pewter-Tessera Embossed Boot Overlay Renderer · Boot Overlay Diamond
 *
 * Pure render function · no state · no timers. Produces an OverlayMap from
 * display parameters · animatedTui.ts composites onto topGrid.
 *
 * Pattern: PTSE Pewter-Tessera-Styled-Embellishment (R2 Pattern 7) — D5 embossed
 * border (top-left light · bottom-right dark) + D1 suite-color identity tint.
 *
 * Border characters (Pewter D5 double-line):
 *   ╔═══╗   top:    lighten(suiteColor)  → raised edge
 *   ║...║   sides:  rgbToAnsi(suiteColor) → identity
 *   ╠══╣   header/footer divider with title pockets
 *   ╚═══╝   bottom: darken(suiteColor)   → shadow edge
 *
 * Citation: SUITE-2-ORANGE-BOOT-OVERLAY-FRONTIER-NAMING.md §Pattern 7 (PTSE)
 * Citation: SUITE-3-YELLOW-BOOT-OVERLAY-BLUEPRINT.md §6 Pewter Translation Table
 * Citation: SUITE-4-GREEN-BOOT-OVERLAY-AUDIT.md §2 Dark Background Readability
 */

import { createOverlay, setOverlayText, type OverlayMap } from './overlay';
import { rgbToAnsi, lighten, darken, type RGB } from './colors';
import type { TerminalCaps } from './terminalCaps';

const ANSI_RESET = '\x1b[0m';
const ANSI_DIM = '\x1b[2m';
const ANSI_BOLD = '\x1b[1m';

export type BuildScpBootOverlayParams = {
  scpName: string;
  suiteColor: RGB;
  ringBufferLines: string[];
  width: number;
  height: number;
  caps: TerminalCaps;
  offsetX?: number;
  offsetY?: number;
};

const ANSI_STRIP_RE = /\x1b\[[0-9;]*[a-zA-Z]/g;
function stripAnsi(s: string): string {
  return s.replace(ANSI_STRIP_RE, '');
}

function truncate(s: string, max: number): string {
  if (s.length <= max) return s;
  if (max <= 1) return s.slice(0, max);
  return s.slice(0, max - 1) + '…';
}

export function buildScpBootOverlay(params: BuildScpBootOverlayParams): OverlayMap {
  const {
    scpName,
    suiteColor,
    ringBufferLines,
    width,
    height,
    caps,
    offsetX = 0,
    offsetY = 0,
  } = params;

  const map: OverlayMap = createOverlay();
  const w = Math.max(20, width);
  const h = Math.max(8, height);

  const lightColor = rgbToAnsi(lighten(suiteColor, 0.55), caps);
  const darkColor = rgbToAnsi(darken(suiteColor, 0.45), caps);
  const baseColor = rgbToAnsi(suiteColor, caps);

  const topLine = '╔' + '═'.repeat(Math.max(0, w - 2)) + '╗';
  const bottomLine = '╚' + '═'.repeat(Math.max(0, w - 2)) + '╝';

  setOverlayText(map, offsetX, offsetY, topLine, lightColor + ANSI_BOLD);
  setOverlayText(map, offsetX, offsetY + h - 1, bottomLine, darkColor);

  for (let row = 1; row < h - 1; row++) {
    setOverlayText(map, offsetX, offsetY + row, '║', baseColor);
    setOverlayText(map, offsetX + w - 1, offsetY + row, '║', baseColor);
  }

  const innerWidth = Math.max(0, w - 4);
  const titleText = truncate(`Boot · ${scpName}`, innerWidth);
  const titleX = offsetX + 2;
  const titleY = offsetY + 1;
  setOverlayText(map, titleX, titleY, titleText, baseColor + ANSI_BOLD);

  const dividerY = offsetY + 2;
  const dividerLine = '╠' + '═'.repeat(Math.max(0, w - 2)) + '╣';
  setOverlayText(map, offsetX, dividerY, dividerLine, baseColor);

  const footerHint = truncate('Esc dismiss · V re-show', innerWidth);
  const footerY = offsetY + h - 2;
  const footerDividerY = offsetY + h - 3;
  setOverlayText(map, offsetX, footerDividerY, dividerLine, baseColor);
  setOverlayText(
    map,
    offsetX + 2,
    footerY,
    footerHint,
    ANSI_DIM,
  );

  const bodyStartY = offsetY + 3;
  const bodyEndY = offsetY + h - 4;
  const bodyRows = Math.max(0, bodyEndY - bodyStartY + 1);

  const lines = ringBufferLines.slice(Math.max(0, ringBufferLines.length - bodyRows));
  const padPrefix = ' ';
  for (let i = 0; i < lines.length; i++) {
    const y = bodyStartY + i;
    const cleaned = stripAnsi(lines[i]);
    const visible = truncate(padPrefix + cleaned, innerWidth);
    setOverlayText(map, offsetX + 2, y, visible.padEnd(innerWidth, ' '), ANSI_DIM);
  }

  // suppress unused reset import warning for downstream pipelines
  void ANSI_RESET;

  return map;
}

export function computeScpBootOverlayBox(termCols: number, termRows: number): {
  width: number;
  height: number;
  offsetX: number;
  offsetY: number;
} {
  const width = Math.max(20, Math.min(80, termCols - 4));
  const height = Math.max(8, Math.min(20, termRows - 8));
  const offsetX = Math.max(0, Math.floor((termCols - width) / 2));
  const offsetY = Math.max(2, Math.floor((termRows - height) / 2));
  return { width, height, offsetX, offsetY };
}
