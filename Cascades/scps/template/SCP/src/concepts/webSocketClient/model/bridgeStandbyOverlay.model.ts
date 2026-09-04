/**
 * Bridge Turn Over standby overlay.
 *
 * A full-screen notice shown while the connection to the bridge is being
 * re-established. It signals the operator to cease activity until the page
 * resumes automatically. Self-contained: a single injected element carrying
 * its own scoped styles, removed automatically when the page reloads.
 *
 * Design tokens (--color-*, --fade-*, --shadow-*, --font-heading) are sourced
 * from the global stylesheet :root; literal fallbacks keep the overlay legible
 * if the stylesheet has not yet applied.
 */

import { raiseSurface, lowerSurface } from '../../../model/surfaceSupremacy.model';
import type { GitmTurnoverProgress } from '../../../model/gitmTurnover.model';
import { GITM_TURNOVER_DEADLINE_MS } from '../../../model/gitmTurnover.model';
// C960 · THE STATUS INDICATOR TAKES TWO SEATS, ONE FACT. The overlay seat (here, the primary
// during a turn-over) and the dock seat (the C958 pip in TaskBar.vue) read the SAME
// /scp-status fact through the SAME resolved origin, and classify it through the SAME pure
// law. No second source of truth: if the two seats ever disagree, the render is wrong — the
// fact never is. Pure model, zero DOM/fetch/Vue — safe to import from this DOM-side module.
import type {
  ScpStatusFactShape,
  ScpStatusPipDeclineReason,
  ScpStatusPipState,
} from '../../vue/shell/scpStatusPip.model';
import {
  classifyScpStatus,
  declineExplanation,
  SCP_STATUS_PIP_PRESENTATION,
} from '../../vue/shell/scpStatusPip.model';

const STANDBY_OVERLAY_ID = 'bridge-turn-over-standby';
/** C1006 · this surface's identity in the supremacy registry. */
const STANDBY_SURFACE_ID = 'bridge-standby';
const STANDBY_STYLE_ID = 'bridge-turn-over-standby-style';
// C962 · BAND 2. Its own root element, deliberately: a sibling band cannot overflow a container
// it does not sit in (the T5 cure), and the three bands compute their edges from one shared
// arithmetic so they can never collide.
const STANDBY_CONSOLE_ID = 'bridge-turn-over-console';

/**
 * C962 · THE ONE SWEEP. The overlay and the console are two bands with ONE lifetime — every path
 * that takes the overlay down must take the console with it, or a terminal outlives the event it
 * was reporting and sits over a live page. Called from the DISMISS and from both self-clearing
 * interval guards; the reload path takes both with the document.
 */
function removeStandbyConsole(): void {
  if (typeof document === 'undefined') return;
  const node = document.getElementById(STANDBY_CONSOLE_ID);
  if (node) node.remove();
}

// SORD Shield/Sword title glyph — an inline SVG (1.2em · stroke currentColor · the retained
// blue/fuchsia palette rides the title's own color). The shield precedes the RETURN-TO-STABLE-A
// (recovery) title; the sword precedes the TURN-OVER-TO-B (carry) title. Non-seat modes (the plain
// 'turn-over' + the 'b-still-rebuilding' informational) carry no glyph.
const SHIELD_SVG =
  `<svg viewBox="0 0 24 24" width="1.2em" height="1.2em" fill="none" stroke="currentColor" ` +
  `stroke-width="2" stroke-linecap="round" stroke-linejoin="round" ` +
  `style="vertical-align:-0.15em;margin-right:0.32em" xmlns="http://www.w3.org/2000/svg">` +
  `<path d="M12 3 4 6v5c0 4.5 3.2 8 8 10 4.8-2 8-5.5 8-10V6l-8-3Z"/></svg>`;
const SWORD_SVG =
  `<svg viewBox="0 0 24 24" width="1.2em" height="1.2em" fill="none" stroke="currentColor" ` +
  `stroke-width="2" stroke-linecap="round" stroke-linejoin="round" ` +
  `style="vertical-align:-0.15em;margin-right:0.32em" xmlns="http://www.w3.org/2000/svg">` +
  `<path d="M14.5 3.5 21 3l-.5 6.5-9 9"/><path d="M11.5 18.5 3 21l2.5-8.5 9-9"/>` +
  `<path d="M6.5 15.5 8.5 17.5"/><path d="M4 21l3.5-3.5"/></svg>`;

// The glyph for a given mode — '' for the non-seat (turn-over / informational) modes.
function standbyIconSvg(mode: StandbyMode): string {
  if (mode === 'shield-a') return SHIELD_SVG;
  if (mode === 'sword-b') return SWORD_SVG;
  return '';
}

// STRATIPUNK TURN-OVER EXPRESSIONS (Pewter Tessera · the Suite 8 design pass · C637). The
// SAME StratiPUNK composition (ring crown · glow type · countdown · footer rail) wears one of
// three FUNCTIONAL COLOR REGISTERS keyed to the turn-over CLASS the trigger fired — a body-class
// on the overlay root drives per-class accent overrides (STAND BY line · countdown · glow · rail).
//   'shield' = SHIELD — the Ground · the Tactical Fall Back — RETAINS the current blue/fuchsia
//              scheme (the existing overlay IS the Shield's · zero visual regression on the
//              unthreaded/legacy paths, which default here).
//   'sword'  = SWORD  — the Experiment — YELLOW ⊗ BLUE interplay.
//   'sparks' = SPARKS — the Compromise (a curation of what exists) — the RED register.
// The CLASS is orthogonal to StandbyMode (which carries the message CONTENT): a plain 'turn-over'
// mode is shared by BOTH the A-leg fallback (Shield) AND the hard turn-over leg (Sparks), so the
// register cannot be derived from the mode alone — the trigger passes it explicitly.
export type StandbyTurnClass = 'shield' | 'sword' | 'sparks';

// The overlay-root body-class carrying the register (default 'shield' — the retained scheme).
function standbyClassName(turnClass: StandbyTurnClass): string {
  return `standby-express-${turnClass}`;
}

const STANDBY_STYLES = `
#${STANDBY_OVERLAY_ID} {
  /* THE RIBBON (user design · Cycle 261): the overlay composes ONLY the middle 3/5 of the
     screen — the top and bottom fifths are NOT covered at all, so the TaskBar (bottom fifth)
     stays LIVE. Why: if a B turn-over stalls, the escape is Turn Over A — the full-screen
     overlay was BLOCKING its own escape hatch (067 stalled exactly this way). */
  /* C962 · THE THREE-BAND STACK (Pewter Tessera · the user's layout: Overlay / Terminal /
     ToolBar, neatly stacked, no overlap). Three tokens carry the WHOLE stack — every band edge
     is computed from the SAME arithmetic, so the bands cannot drift apart or collide at any
     viewport height, and changing the console height moves the overlay's floor in the same
     expression. --standby-dock-h is MEASURED from TaskBar.vue:576, never guessed.

     THE RIBBON LAW (C261) SURVIVES AND STRENGTHENS: the overlay never covered the bottom band
     because a stalled B turn-over's escape is Turn Over A ON THE DOCK — a full-screen overlay
     blocked its own escape hatch. The dock is now protected by calc() from TWO elements rather
     than by one hard-coded 20vh. */
  --standby-dock-h: 68px;
  --standby-band-gap: 10px;
  --standby-console-h: clamp(184px, 26vh, 320px);
  position: fixed;
  left: 0;
  right: 0;
  top: 5vh;
  bottom: calc(var(--standby-dock-h) + var(--standby-console-h) + var(--standby-band-gap) * 2);
  z-index: 2147483647;
  display: flex;
  align-items: center;
  justify-content: center;
  border-top: 1px solid rgba(110, 170, 255, 0.55);
  border-bottom: 1px solid rgba(110, 170, 255, 0.55);
  font-family: var(--font-heading, 'Orbitron', system-ui, sans-serif);
  color: #dfe6f5;
  background-color: #050608;
  background-image:
    repeating-linear-gradient(
      0deg,
      rgba(255, 255, 255, 0.025) 0px,
      rgba(255, 255, 255, 0.025) 1px,
      transparent 1px,
      transparent 3px
    ),
    radial-gradient(
      ellipse at 50% 42%,
      var(--color-blue-dark, rgb(50, 111, 209)) 0%,
      #0a1020 34%,
      #050608 72%,
      #020203 100%
    );
  overflow: hidden;
  animation: bridge-standby-fade-in 0.25s ease-out;
}

#${STANDBY_OVERLAY_ID} .standby-frame {
  position: absolute;
  inset: 14px;
  pointer-events: none;
  border: 1px solid rgba(110, 170, 255, 0.55);
  clip-path: polygon(
    22px 0, calc(100% - 22px) 0, 100% 22px,
    100% calc(100% - 22px), calc(100% - 22px) 100%,
    22px 100%, 0 calc(100% - 22px), 0 22px
  );
  box-shadow:
    0 0 18px 2px rgba(59, 130, 246, 0.45),
    inset 0 0 26px 1px rgba(59, 130, 246, 0.30),
    inset 0 0 60px 6px rgba(236, 72, 153, 0.18);
  animation: bridge-standby-frame-pulse 2.6s ease-in-out infinite;
}

#${STANDBY_OVERLAY_ID} .standby-core {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 0 24px;
  text-align: center;
  /* C962 · the stream LEFT this core for its own band, so the core no longer hosts a growing
     region at all — the T5 overflow it used to fight is gone by construction. The floor of 0
     stays: a flex column in a fixed ribbon must be allowed to shrink rather than overflow. */
  min-height: 0;
}

/* THE STALL TIMER (user design): elapsed mm:ss since the turn-over began — the user working
   in the retained fifths gets a FEEL for a stalled turn-over and can revert to A. */
#${STANDBY_OVERLAY_ID} .standby-timer {
  margin: 0;
  font-family: var(--font-mono, 'Space Mono', monospace);
  font-size: 1.35rem;
  font-weight: 700;
  letter-spacing: 0.4em;
  text-indent: 0.4em;
  color: var(--color-blue-light, rgb(68, 150, 255));
  text-shadow: 0 0 10px rgba(59, 130, 246, 0.8);
}

/* C960 · SEAT 1 · THE ALWAYS-ON STATUS READOUT. One slim mono line carrying the SAME verdict
   the dock pip carries, rendered on EVERY tick of the 1s poll — not only on a crash. Its dot
   color is STATE-driven and deliberately independent of the SHIELD/SWORD/SPARKS turn-class
   register (Pewter D9: state meaning is not turn-class decoration — two color systems answering
   two different questions must never be conflated). One step below .standby-hint in emphasis so
   it reads as DATA, not narration. Colors are written from SCP_STATUS_PIP_PRESENTATION at
   render time — this rule carries only the geometry. */
#${STANDBY_OVERLAY_ID} .standby-status-strip {
  margin: 0;
  display: flex;
  align-items: baseline;
  gap: 8px;
  max-width: min(560px, 74vw);
  font-family: var(--font-mono, 'Space Mono', monospace);
  font-size: 0.62rem;
  letter-spacing: 0.1em;
  line-height: 1.4;
  text-align: left;
}
#${STANDBY_OVERLAY_ID} .standby-status-dot {
  flex: 0 0 auto;
  font-size: 0.72rem;
  line-height: 1;
}
#${STANDBY_OVERLAY_ID} .standby-status-text {
  flex: 1 1 auto;
}

#${STANDBY_OVERLAY_ID} .standby-hint {
  margin: 0;
  font-family: var(--font-mono, 'Space Mono', monospace);
  font-size: 0.62rem;
  letter-spacing: 0.18em;
  text-indent: 0.18em;
  color: rgba(150, 168, 200, 0.6);
}

#${STANDBY_OVERLAY_ID} .standby-shapes {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 22px;
  height: 56px;
}

/* THE SUITE POLYGON SEQUENCE: 8 regular polygons — the triangle (3 sides) for the dark base
   ascending one side per position to the decagon (10). The base polygon is onyx-dark with a
   small diamond INLAID (the pairing); the seven that follow carry their suite colors as neon
   outlines. The svg strokes ride currentColor; the glow is a drop-shadow filter. */
#${STANDBY_OVERLAY_ID} .standby-shape {
  width: 28px;
  height: 28px;
  opacity: 0.25;
  animation:
    bridge-standby-shape 1.5s ease-in-out infinite,
    bridge-standby-charge 9s ease-in-out infinite;
}
#${STANDBY_OVERLAY_ID} .standby-shape svg {
  display: block;
  width: 100%;
  height: 100%;
  filter: drop-shadow(0 0 6px currentColor);
}

#${STANDBY_OVERLAY_ID} .standby-shape:nth-child(1) { color: rgb(232, 233, 238); animation-delay: 0s, 0s; } /* the off-white border shadow — the drop-shadow rides currentColor */
#${STANDBY_OVERLAY_ID} .standby-shape:nth-child(2) { color: var(--color-red, rgb(239, 68, 68)); animation-delay: 0.12s, 0s; }
#${STANDBY_OVERLAY_ID} .standby-shape:nth-child(3) { color: var(--color-orange, rgb(249, 115, 22)); animation-delay: 0.24s, 0s; }
#${STANDBY_OVERLAY_ID} .standby-shape:nth-child(4) { color: var(--color-yellow, rgb(234, 179, 8)); animation-delay: 0.36s, 0s; }
#${STANDBY_OVERLAY_ID} .standby-shape:nth-child(5) { color: var(--color-green, rgb(34, 197, 94)); animation-delay: 0.48s, 0s; }
#${STANDBY_OVERLAY_ID} .standby-shape:nth-child(6) { color: var(--color-blue-light, rgb(68, 150, 255)); animation-delay: 0.6s, 0s; }
#${STANDBY_OVERLAY_ID} .standby-shape:nth-child(7) { color: var(--color-purple, rgb(168, 85, 247)); animation-delay: 0.72s, 0s; }
#${STANDBY_OVERLAY_ID} .standby-shape:nth-child(8) { color: var(--color-fuchsia, rgb(236, 72, 153)); animation-delay: 0.84s, 0s; }

#${STANDBY_OVERLAY_ID} .standby-title {
  margin: 0;
  font-size: clamp(1.5rem, 4.2vw, 2.6rem); /* ribbon-fitted (60vh) — was 2-4rem full-screen */
  font-weight: 700;
  letter-spacing: 0.32em;
  text-indent: 0.32em;
  color: #eaf1ff;
  text-shadow:
    0 0 8px rgba(59, 130, 246, 0.9),
    0 0 22px rgba(59, 130, 246, 0.55),
    0 0 38px rgba(236, 72, 153, 0.35);
}

#${STANDBY_OVERLAY_ID} .standby-subtitle {
  margin: 0;
  font-size: clamp(0.85rem, 2.2vw, 1.15rem);
  font-weight: 600;
  letter-spacing: 0.5em;
  text-indent: 0.5em;
  color: var(--color-fuchsia-light, rgb(255, 83, 176));
  text-shadow:
    0 0 8px rgba(236, 72, 153, 0.85),
    0 0 18px rgba(236, 72, 153, 0.45);
}

#${STANDBY_OVERLAY_ID} .standby-note {
  margin: 0;
  font-family: var(--font-mono, 'Space Mono', monospace);
  font-size: 0.72rem;
  font-weight: 400;
  letter-spacing: 0.22em;
  text-indent: 0.22em;
  color: rgba(170, 190, 225, 0.7);
}

/* THE CLASS-NAME EYEBROW (W2 · C637): the human-readable turn-over class (SHIELD / SWORD /
   SPARKS) as a compact tracked eyebrow above the content title. Base = the SHIELD register's
   blue tint; the SWORD/SPARKS blocks below re-tint it to the register color. */
/* C638 · THE LOGO BADGE — the class glyph centered at the head of the title stack. Base = the
   SHIELD register (the retained scheme); the express blocks re-tint per class. Accents+shadows
   only (the OSR root-paint law holds). */
#${STANDBY_OVERLAY_ID} .standby-logo-badge {
  margin: 0 0 10px;
  font-size: 2.3rem;
  line-height: 1;
  color: var(--color-blue-light, rgb(68, 150, 255));
  text-shadow:
    0 0 12px rgba(59, 130, 246, 0.85),
    0 0 28px rgba(217, 70, 239, 0.35);
}
#${STANDBY_OVERLAY_ID} .standby-class-name {
  margin: 0;
  font-family: var(--font-mono, 'Space Mono', monospace);
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.42em;
  text-indent: 0.42em;
  color: var(--color-blue-light, rgb(68, 150, 255));
  text-shadow: 0 0 9px rgba(59, 130, 246, 0.7);
}

#${STANDBY_OVERLAY_ID} .standby-bracket {
  position: absolute;
  left: 50%;
  bottom: 42px;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 14px;
  width: min(560px, 70vw);
  color: rgba(150, 168, 200, 0.85);
}

#${STANDBY_OVERLAY_ID} .standby-bracket .bracket-tick {
  width: 14px;
  height: 22px;
  flex: 0 0 auto;
}

#${STANDBY_OVERLAY_ID} .standby-bracket .bracket-tick.left {
  border-left: 2px solid currentColor;
  border-top: 2px solid currentColor;
  border-bottom: 2px solid currentColor;
}

#${STANDBY_OVERLAY_ID} .standby-bracket .bracket-tick.right {
  border-right: 2px solid currentColor;
  border-top: 2px solid currentColor;
  border-bottom: 2px solid currentColor;
}

#${STANDBY_OVERLAY_ID} .standby-bracket .bracket-rail {
  flex: 1 1 auto;
  height: 2px;
  background: linear-gradient(
    90deg,
    transparent 0%,
    var(--color-blue, rgb(59, 130, 246)) 22%,
    var(--color-fuchsia, rgb(236, 72, 153)) 50%,
    var(--color-blue, rgb(59, 130, 246)) 78%,
    transparent 100%
  );
  box-shadow: 0 0 10px 1px rgba(59, 130, 246, 0.55);
  animation: bridge-standby-rail 2.6s linear infinite;
}

@keyframes bridge-standby-fade-in {
  from { opacity: 0; }
  to   { opacity: 1; }
}

@keyframes bridge-standby-frame-pulse {
  0%, 100% {
    box-shadow:
      0 0 18px 2px rgba(59, 130, 246, 0.45),
      inset 0 0 26px 1px rgba(59, 130, 246, 0.30),
      inset 0 0 60px 6px rgba(236, 72, 153, 0.18);
  }
  50% {
    box-shadow:
      0 0 30px 4px rgba(59, 130, 246, 0.70),
      inset 0 0 38px 2px rgba(59, 130, 246, 0.45),
      inset 0 0 84px 10px rgba(236, 72, 153, 0.30);
  }
}

@keyframes bridge-standby-shape {
  0%, 100% { opacity: 0.22; transform: scale(0.86); }
  50%      { opacity: 1;    transform: scale(1.12); }
}

@keyframes bridge-standby-charge {
  0%   { animation-duration: 1.5s; filter: brightness(1); }
  100% { animation-duration: 0.55s; filter: brightness(1.4); }
}

@keyframes bridge-standby-rail {
  0%   { opacity: 0.55; }
  50%  { opacity: 1; }
  100% { opacity: 0.55; }
}

/* ═══════════════════════════════════════════════════════════════════════════════════════
   C962 · BAND 2 · THE BRIDGE TURN OVER CONSOLE — Pewter Tessera, HiFi BASE panel.

   THE SELF-CRITIQUE THIS ANSWERS (TOH10-PEWTER-CONSOLE-RD.md Part I): the old '.standby-stream'
   carried six declarations and NO surface — no background, no border, no shadow, no text-shadow.
   A surface that declares no ground inherits every ground beneath it, which is why boot-log text
   read over the page in the field frame. Transparency there was not a treatment; it was an
   omission wearing one. Four more failures rode with it: the absolute .standby-bracket drew
   THROUGH the glyphs (no z-order contract, no reserved space); overflow:hidden clipped the tail
   with no scrollbar and no ellipsis, so truncated was indistinguishable from finished;
   rgba(120,140,170,.5) at .58rem computed to ~2.2:1, styling the diagnosis to be ignored; and a
   centered flex child in a fixed ribbon overflows BOTH ends at once.

   ROOT: the console was added as TEXT inside a MESSAGE when it is a SURFACE and needed to be a
   BAND. It is now its own fixed band — it cannot overflow a container it does not sit in.

   THE REGISTER IS BASE, and that is semantic, not decorative: Base is Suite 0 — Unification anor
   Summarization — and the console output IS a Summation. The pane formula below is reused
   VERBATIM from style.css:212-224 (.hifi-pane-base): the starfield tile, the 87.5% 12.5% ellipse
   spotlight spreading 0%→88%, 2px embossed borders (dark top/right · light bottom/left, the
   top-right light source), the -3px 3px 0 hard shadow, and the warm Base text-shadow complement.
   Every value carries a literal fallback — this stylesheet is injected and must render before the
   page stylesheet is guaranteed. Nothing here is invented. */
#bridge-turn-over-console {
  --standby-dock-h: 68px;
  --standby-band-gap: 10px;
  --standby-console-h: clamp(184px, 26vh, 320px);
  position: fixed;
  left: 0;
  right: 0;
  bottom: calc(var(--standby-dock-h) + var(--standby-band-gap));
  height: var(--standby-console-h);
  z-index: 2147483646;
  display: flex;
  align-items: stretch;
  justify-content: center;
  padding: 0 16px;
  pointer-events: none;
  animation: bridge-standby-fade-in 0.25s ease-out;
}

/* LETTER WIDE, CENTERED (the user's word). A terminal is measured in COLUMNS, and 80 is the
   column count every build tool in this chain wraps to — at this mono size that lands near a
   letter page's proportion, and it is the width the boot output was authored for. */
#bridge-turn-over-console .standby-console-pane {
  pointer-events: auto;
  width: min(80ch, 94vw);
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
  border-radius: 2px;
  background-image:
    var(--pattern-base, none),
    radial-gradient(
      ellipse at 87.5% 12.5%,
      var(--color-diamond, rgb(232, 236, 245)) 0%,
      var(--fade-base, rgb(4, 4, 4)) 88%
    );
  background-size: 30px 30px, 100% 100%;
  background-repeat: repeat, no-repeat;
  border-top: 2px solid var(--color-base-dark, rgb(22, 22, 22));
  border-right: 2px solid var(--color-base-dark, rgb(22, 22, 22));
  border-bottom: 2px solid var(--color-base-light, rgb(30, 30, 30));
  border-left: 2px solid var(--color-base-light, rgb(30, 30, 30));
  box-shadow: -3px 3px 0 rgba(0, 0, 0, 0.4);
  text-shadow: 0.5px 0.5px 0 rgba(200, 170, 120, 0.7);
}

/* THE HEADER BAR (D14 treatment P2 · header bar only — a terminal pane is grounding-EXCLUDED,
   the pane IS the surface, so no inner grounded card). Transparent bar over the pane's own
   gradient, hairline-separated from the body. */
#bridge-turn-over-console .standby-console-head {
  flex: 0 0 auto;
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  padding: 7px 12px 6px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.09);
  font-family: var(--font-heading, 'Orbitron', system-ui, sans-serif);
  font-size: 0.58rem;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: rgba(226, 232, 240, 0.82);
  white-space: nowrap;
  overflow: hidden;
}
#bridge-turn-over-console .standby-console-title { text-overflow: ellipsis; overflow: hidden; }
#bridge-turn-over-console .standby-console-who {
  font-family: var(--font-mono, 'Space Mono', monospace);
  letter-spacing: 0.1em;
  text-transform: none;
  color: rgba(160, 180, 210, 0.9);
}

/* THE SUMMATION STRIP — the point of the whole band, and the half that answers a 7-minute
   turn-over. Fed by the C961 timing instrument (GET /scp-boot-timing/:scpName/summary, each
   event carrying load1 + freeMemMb). D10's readout register governs it: TABULAR NUMERALS so the
   digits do not jitter tick to tick, labels one step dimmer than their values. A raw tail shows
   runtime chatter; the Summation shows STALL 06:46 beside LOAD 9.87 — the diagnosis on the glass. */
#bridge-turn-over-console .standby-console-sum {
  flex: 0 0 auto;
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 4px 18px;
  padding: 7px 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  font-family: var(--font-mono, 'Space Mono', monospace);
  font-size: 0.6rem;
  line-height: 1.3;
  font-variant-numeric: tabular-nums;
  font-feature-settings: "tnum";
}
#bridge-turn-over-console .standby-console-cell { display: inline-flex; gap: 6px; align-items: baseline; }
#bridge-turn-over-console .standby-console-k {
  color: rgba(148, 163, 184, 0.62);
  letter-spacing: 0.14em;
  font-size: 0.54rem;
  text-transform: uppercase;
}
#bridge-turn-over-console .standby-console-v { color: var(--color-white-conductor, #f0f0f0); }
/* The absence render — an older CLI that has never heard of the instrument says so plainly,
   rather than presenting zeros as though they were measurements. */
#bridge-turn-over-console .standby-console-sum.is-absent .standby-console-v {
  color: rgba(148, 163, 184, 0.7);
  letter-spacing: 0.08em;
}

/* THE STREAM BODY. T3's cure: a REAL scrollbar (D8 .hifi-scrollbar, style.css:1513) instead of
   overflow:hidden, so truncated is never mistaken for finished. T4's cure: off-white body text
   (D14's --color-white-conductor law) at ~13:1 in place of the old ~2.2:1. */
#bridge-turn-over-console .standby-console-body {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
  margin: 0;
  padding: 8px 12px 10px;
  font-family: var(--font-mono, 'Space Mono', monospace);
  font-size: 0.58rem;
  line-height: 1.45;
  color: rgba(240, 240, 240, 0.82);
  text-align: left;
  white-space: pre-wrap;
  word-break: break-word;
  text-shadow: none;
  scrollbar-width: thin;
  scrollbar-color: rgba(255, 255, 255, 0.12) transparent;
}
#bridge-turn-over-console .standby-console-body::-webkit-scrollbar { width: 6px; }
#bridge-turn-over-console .standby-console-body::-webkit-scrollbar-track { background: transparent; }
#bridge-turn-over-console .standby-console-body::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.12);
  border-radius: 3px;
}
#bridge-turn-over-console .standby-console-body::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.2);
}
/* ABSENCE IS DRAWN, never implied — an empty accumulation states itself, centered and dimmed. */
#bridge-turn-over-console .standby-console-body.is-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  color: rgba(148, 163, 184, 0.55);
  font-style: italic;
}

/* THE CRASH REGISTER on the console — the ONLY register that may speak failure, and only ever
   from the CLI's evidence-established fact. Matches the overlay's own .standby-crashed tones so
   one glance reads as one event across both bands. */
#bridge-turn-over-console .standby-console-pane.is-crashed {
  border-top-color: rgba(180, 60, 60, 0.9);
  border-right-color: rgba(180, 60, 60, 0.9);
  border-bottom-color: rgba(248, 113, 113, 0.6);
  border-left-color: rgba(248, 113, 113, 0.6);
}
#bridge-turn-over-console .standby-console-pane.is-crashed .standby-console-body {
  color: rgba(252, 165, 165, 0.9);
}

/* TOH-8 · BAND A · THE NO-EFFECT REGISTER + ITS DISMISS. Slate-neutral: this is not a failure of
   the SCP, it is an action that never reached it — the wording carries the meaning, the color does
   not dramatize it. The dismiss is the overlay's only self-removal, offered ONLY on proven fact. */
#${STANDBY_OVERLAY_ID}.standby-no-effect .standby-title {
  color: rgba(226, 232, 240, 0.95);
  text-shadow: 0 0 12px rgba(148, 163, 184, 0.7), 0 0 30px rgba(100, 116, 139, 0.4);
}
#${STANDBY_OVERLAY_ID}.standby-no-effect .standby-subtitle { color: rgba(148, 163, 184, 0.9); }
#${STANDBY_OVERLAY_ID} .standby-dismiss {
  margin-top: 18px;
  padding: 7px 22px;
  font-family: var(--font-mono, 'Space Mono', monospace);
  font-size: 0.62rem;
  letter-spacing: 0.18em;
  color: rgba(226, 232, 240, 0.9);
  background: rgba(30, 41, 59, 0.75);
  border: 1px solid rgba(148, 163, 184, 0.55);
  border-radius: 2px;
  cursor: pointer;
}
#${STANDBY_OVERLAY_ID} .standby-dismiss:hover {
  background: rgba(51, 65, 85, 0.9);
  border-color: rgba(226, 232, 240, 0.8);
}

/* TOH-7 · THE CRASH PRESENTATION. The ONLY register that may speak failure — it renders solely
   from the CLI's evidence-established fact (/scp-status), never from an elapsed clock. Amber-red
   so it reads as distinct from the neutral rebuild registers at a glance. */
#${STANDBY_OVERLAY_ID}.standby-crashed .standby-title {
  color: rgba(248, 113, 113, 0.95);
  text-shadow:
    0 0 12px rgba(248, 113, 113, 0.85),
    0 0 30px rgba(239, 68, 68, 0.5);
}
#${STANDBY_OVERLAY_ID}.standby-crashed .standby-subtitle {
  color: rgba(251, 146, 60, 0.9);
}

/* THE ESCALATING PULSE (user design): every 15 elapsed seconds the stall deepens the title's
   glow + a subtle scale beat — a growing visual urgency so a stalled turn-over reads as stalled.
   pulseLevel drives the class swap in showBridgeStandby (cap 4); the body[data-standby-pulse]
   mirror escalates the LIVE toolbar's Turn Over A (style.css) in lockstep. */
#${STANDBY_OVERLAY_ID} .standby-title.pulse-1 {
  transition: text-shadow 0.6s ease, transform 0.6s ease;
  transform: scale(1.0);
  text-shadow:
    0 0 10px rgba(59, 130, 246, 0.95),
    0 0 24px rgba(59, 130, 246, 0.6),
    0 0 40px rgba(236, 72, 153, 0.4);
}
#${STANDBY_OVERLAY_ID} .standby-title.pulse-2 {
  transition: text-shadow 0.6s ease, transform 0.6s ease;
  transform: scale(1.06);
  text-shadow:
    0 0 12px rgba(59, 130, 246, 1),
    0 0 30px rgba(59, 130, 246, 0.7),
    0 0 52px rgba(236, 72, 153, 0.5);
}
#${STANDBY_OVERLAY_ID} .standby-title.pulse-3 {
  transition: text-shadow 0.6s ease, transform 0.6s ease;
  transform: scale(1.12);
  text-shadow:
    0 0 16px rgba(59, 130, 246, 1),
    0 0 38px rgba(236, 72, 153, 0.7),
    0 0 64px rgba(236, 72, 153, 0.6);
}
#${STANDBY_OVERLAY_ID} .standby-title.pulse-4 {
  transition: text-shadow 0.6s ease, transform 0.6s ease;
  transform: scale(1.18);
  text-shadow:
    0 0 20px rgba(236, 72, 153, 1),
    0 0 48px rgba(236, 72, 153, 0.85),
    0 0 80px rgba(236, 72, 153, 0.7);
}

/* ══ STRATIPUNK TURN-OVER EXPRESSIONS (Pewter Tessera · C637) ══════════════════════════════
   Per-class ACCENT overrides keyed to the overlay-root register class. The SHIELD register is
   the base rules above (no override block — the retained blue/fuchsia scheme · zero regression).
   SWORD and SPARKS re-tint ONLY the functional accent surfaces (the frame glow · the STAND BY
   subtitle · the countdown · the title glow · the footer rail); the ring crown's suite-spectrum
   sequence, the layout, and the composition stay identical across all three.

   OSR LESSON (C598/C602): the overlay paints its background DELIBERATELY (background-color +
   background-image on the root); the register overrides touch only foreground accents + shadows,
   never the opaque backdrop — so no transparency artifact opens under the shader. */

/* ── SWORD (Turn Over B · the Experiment) — YELLOW ⊗ BLUE interplay ──
   The blade divides the palette: the STAND BY subtitle carries YELLOW (the striking edge · the
   experiment declaring itself); the title glow + countdown + rail keep BLUE (the tempered spine
   the experiment rides). Yellow-over-blue is the Sword's two-metal fold. */
#${STANDBY_OVERLAY_ID}.standby-express-sword .standby-frame {
  box-shadow:
    0 0 18px 2px rgba(59, 130, 246, 0.45),
    inset 0 0 26px 1px rgba(59, 130, 246, 0.30),
    inset 0 0 60px 6px rgba(234, 179, 8, 0.20);
}
#${STANDBY_OVERLAY_ID}.standby-express-sword .standby-logo-badge {
  color: var(--color-yellow-light, rgb(255, 206, 9));
  text-shadow:
    0 0 12px rgba(234, 179, 8, 0.85),
    0 0 28px rgba(59, 130, 246, 0.45);
}
#${STANDBY_OVERLAY_ID}.standby-express-sword .standby-class-name {
  color: var(--color-yellow-light, rgb(255, 206, 9));
  text-shadow: 0 0 9px rgba(234, 179, 8, 0.7);
}
#${STANDBY_OVERLAY_ID}.standby-express-sword .standby-subtitle {
  color: var(--color-yellow-light, rgb(255, 206, 9));
  text-shadow:
    0 0 8px rgba(234, 179, 8, 0.85),
    0 0 18px rgba(234, 179, 8, 0.45);
}
#${STANDBY_OVERLAY_ID}.standby-express-sword .standby-title {
  text-shadow:
    0 0 8px rgba(59, 130, 246, 0.9),
    0 0 22px rgba(59, 130, 246, 0.55),
    0 0 38px rgba(234, 179, 8, 0.35);
}
#${STANDBY_OVERLAY_ID}.standby-express-sword .standby-timer {
  color: var(--color-blue-light, rgb(68, 150, 255));
  text-shadow: 0 0 10px rgba(59, 130, 246, 0.8);
}
#${STANDBY_OVERLAY_ID}.standby-express-sword .standby-bracket .bracket-rail {
  background: linear-gradient(
    90deg,
    transparent 0%,
    var(--color-blue, rgb(59, 130, 246)) 22%,
    var(--color-yellow, rgb(234, 179, 8)) 50%,
    var(--color-blue, rgb(59, 130, 246)) 78%,
    transparent 100%
  );
  box-shadow: 0 0 10px 1px rgba(234, 179, 8, 0.55);
}

/* ── SPARKS (Hard Turn Over · the Compromise) — the RED register ──
   The clean-slate reset reads as a single decisive red: every accent surface (frame glow · STAND
   BY · countdown · title glow · rail) burns to red. No interplay — the Compromise is one register,
   a curation of what exists with no other pursuit. */
#${STANDBY_OVERLAY_ID}.standby-express-sparks .standby-frame {
  box-shadow:
    0 0 18px 2px rgba(239, 68, 68, 0.48),
    inset 0 0 26px 1px rgba(239, 68, 68, 0.32),
    inset 0 0 60px 6px rgba(239, 68, 68, 0.18);
}
#${STANDBY_OVERLAY_ID}.standby-express-sparks .standby-logo-badge {
  color: var(--color-red-light, rgb(255, 78, 78));
  text-shadow:
    0 0 12px rgba(239, 68, 68, 0.85),
    0 0 28px rgba(203, 58, 58, 0.45);
}
#${STANDBY_OVERLAY_ID}.standby-express-sparks .standby-class-name {
  color: var(--color-red-light, rgb(255, 78, 78));
  text-shadow: 0 0 9px rgba(239, 68, 68, 0.7);
}
#${STANDBY_OVERLAY_ID}.standby-express-sparks .standby-subtitle {
  color: var(--color-red-light, rgb(255, 78, 78));
  text-shadow:
    0 0 8px rgba(239, 68, 68, 0.85),
    0 0 18px rgba(239, 68, 68, 0.45);
}
#${STANDBY_OVERLAY_ID}.standby-express-sparks .standby-title {
  text-shadow:
    0 0 8px rgba(239, 68, 68, 0.9),
    0 0 22px rgba(239, 68, 68, 0.55),
    0 0 38px rgba(203, 58, 58, 0.35);
}
#${STANDBY_OVERLAY_ID}.standby-express-sparks .standby-timer {
  color: var(--color-red-light, rgb(255, 78, 78));
  text-shadow: 0 0 10px rgba(239, 68, 68, 0.8);
}
#${STANDBY_OVERLAY_ID}.standby-express-sparks .standby-bracket .bracket-rail {
  background: linear-gradient(
    90deg,
    transparent 0%,
    var(--color-red-dark, rgb(203, 58, 58)) 22%,
    var(--color-red-light, rgb(255, 78, 78)) 50%,
    var(--color-red-dark, rgb(203, 58, 58)) 78%,
    transparent 100%
  );
  box-shadow: 0 0 10px 1px rgba(239, 68, 68, 0.55);
}

/* The pulse escalation stays fuchsia-toned for SHIELD (base) but re-tints per register so a
   stalled Sword/Sparks turn-over escalates in its OWN color (the growing urgency reads honest to
   the class). Only the deepest two levels re-tint — the register asserts as the stall deepens. */
#${STANDBY_OVERLAY_ID}.standby-express-sword .standby-title.pulse-3,
#${STANDBY_OVERLAY_ID}.standby-express-sword .standby-title.pulse-4 {
  text-shadow:
    0 0 18px rgba(234, 179, 8, 0.9),
    0 0 44px rgba(59, 130, 246, 0.7),
    0 0 72px rgba(234, 179, 8, 0.6);
}
#${STANDBY_OVERLAY_ID}.standby-express-sparks .standby-title.pulse-3,
#${STANDBY_OVERLAY_ID}.standby-express-sparks .standby-title.pulse-4 {
  text-shadow:
    0 0 18px rgba(239, 68, 68, 1),
    0 0 44px rgba(203, 58, 58, 0.85),
    0 0 72px rgba(239, 68, 68, 0.7);
}
`;

// A regular polygon's points (n sides · centered 14,14 · radius 11 · flat-bottom orientation).
function polygonPoints(n: number, rot = -Math.PI / 2, r = 11): string {
  const pts: string[] = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * 2 * Math.PI + rot;
    pts.push(`${(14 + r * Math.cos(a)).toFixed(2)},${(14 + r * Math.sin(a)).toFixed(2)}`);
  }
  return pts.join(' ');
}

// The eight polygons: position 0 = THE OBSIDIAN TRIANGLE — flipped POINT-DOWN, the outline
// WHITE with a shadowed off-white border glow, the body an obsidian-like volume (the radial
// inset shadow darkening toward the edges + the glassy sheen sliver + the speckle texture),
// the diamond INLAID in pewter-light (the pairing); positions 1-7 = square → decagon, neon
// suite outlines.
function suitePolygonShapes(): string {
  let shapes = '';
  for (let i = 0; i < 8; i++) {
    const sides = i + 3;
    let body = '';
    let inlay = '';
    if (i === 0) {
      const tri = polygonPoints(3, Math.PI / 2); // point-DOWN
      const triInner = polygonPoints(3, Math.PI / 2, 9); // the inset-shadow inner line
      body =
        `<defs>` +
        `<radialGradient id="hf-obsidian" cx="0.42" cy="0.32" r="0.95">` +
        `<stop offset="0%" stop-color="rgb(28,28,34)"/>` +
        `<stop offset="55%" stop-color="rgb(13,13,17)"/>` +
        `<stop offset="100%" stop-color="rgb(4,4,6)"/>` +
        `</radialGradient>` +
        `<clipPath id="hf-obsidian-clip"><polygon points="${tri}"/></clipPath>` +
        `</defs>` +
        // The obsidian body — the radial fill IS the inset shadow (dark pooling at the edges).
        `<polygon points="${tri}" fill="url(#hf-obsidian)" stroke="rgb(255,255,255)" stroke-width="1.6"/>` +
        // The inner shadow line — the volume's lip.
        `<polygon points="${triInner}" fill="none" stroke="rgba(0,0,0,0.65)" stroke-width="1.4"/>` +
        // The glassy sheen sliver + the speckle texture, clipped to the triangle.
        `<g clip-path="url(#hf-obsidian-clip)">` +
        `<circle cx="10.5" cy="11" r="0.55" fill="rgba(232,233,238,0.22)"/>` +
        `<circle cx="17" cy="9.5" r="0.4" fill="rgba(232,233,238,0.16)"/>` +
        `<circle cx="14.5" cy="16" r="0.45" fill="rgba(232,233,238,0.12)"/>` +
        `</g>`;
      // No graphic within (user): the interior is just starry space + the inner shadow.
    } else {
      body = `<polygon points="${polygonPoints(sides)}" fill="none" stroke="currentColor" stroke-width="2"/>`;
    }
    shapes += `<span class="standby-shape"><svg viewBox="0 0 28 28" xmlns="http://www.w3.org/2000/svg">${body}${inlay}</svg></span>`;
  }
  return shapes;
}

// GITM A↔B (#641 · TOH-6 the agency cure) — the standby variant. 'turn-over' is the normal
// connection-turnover notice; 'b-still-rebuilding' is the NEUTRAL informational message the
// deadline timer swaps in when the watch window elapses before B's boot report. THE BENEFIT
// OF THE DOUBT BELONGS TO THE USER: the wording never claims failure (time proves nothing —
// a large SCP may honestly still be recompiling); it names the user's own Turn Over on A
// instead — the system never fires it.
//
// SORD Shield/Sword (Macro Diamond · D5/TVOS) — two SORD-routed turn-over variants. 'shield-a'
// is the recovery/return-to-stable-A overlay (the Shield-A turn-over); 'sword-b' is the
// carry-changes-onto-B overlay (the Sword-B turn-over). TEXT-ONLY variants — the shield/sword
// GRAPHIC is deferred polish; the shapes/frame/bracket/CSS are identical across all modes.
export type StandbyMode = 'turn-over' | 'b-still-rebuilding' | 'shield-a' | 'sword-b';

const STANDBY_TEXTS: Record<StandbyMode, { title: string; subtitle: string; note: string }> = {
  'turn-over': {
    title: 'BRIDGE TURN OVER',
    subtitle: 'STAND BY &middot; CEASE ACTIVITY',
    note: 'the system resumes automatically',
  },
  'b-still-rebuilding': {
    title: 'B STILL REBUILDING',
    subtitle: 'LARGE APPS TAKE TIME',
    note: 'if it does not return, Turn Over on A from the dock',
  },
  'shield-a': {
    title: 'RETURN TO STABLE A',
    subtitle: 'STAND BY &middot; RECOVERING',
    note: 'restoring the stable branch',
  },
  'sword-b': {
    title: 'TURN OVER TO B',
    subtitle: 'STAND BY &middot; CARRYING CHANGES',
    note: 'the system resumes automatically',
  },
};

// STRATIPUNK TURN-OVER EXPRESSIONS (W2 · the naming line · C637) — the human-readable class name
// per register. Surfaced as an EYEBROW sub-line above the content title (NOT a title replacement):
// the existing title strings carry load-bearing message content ("TURN OVER TO B" · "RETURN TO
// STABLE A") that fidelity requires be retained, so the class name rides its own tinted line and
// the title stays intact.
const STANDBY_CLASS_NAMES: Record<StandbyTurnClass, string> = {
  shield: 'SHIELD',
  sword: 'SWORD',
  sparks: 'SPARKS',
};

// The markup is mode-parameterized — only the title/subtitle/note strings swap; the shapes,
// frame, bracket, styles, and layout are identical across modes. The turn-over CLASS adds the
// eyebrow naming line (W2) and drives the accent register via the overlay-root body-class (W3).
// The register a mode implies when no explicit class is passed (the honest default per leg):
//   'sword-b'            → SWORD  (the carry-onto-B experiment)
//   'shield-a'           → SHIELD (the recovery/return-to-stable-A)
//   'b-still-rebuilding' → SHIELD (unthreaded fallback only — the swap keeps the mounted class)
//   'turn-over'          → SHIELD (the plain restart · the retained scheme · zero regression)
// The hard turn-over (SPARKS) uses the plain 'turn-over' message but MUST pass 'sparks' explicitly
// — the mode alone cannot distinguish an A-leg fallback (Shield) from a hard reset (Sparks).
// C638 · THE LOGO BADGE ICONS (user law: the Bridge's own iconography, centered to the user) —
// Shield/Sword ride the SAME FA glyphs their Tactical Bridge buttons wear (fa-shield-halved ·
// fa-khanda); Sparks wears the honest spark (fa-bolt — the hard button's fa-rotate is a verb,
// not the class identity). FA resolves via the client's CDN kit (vue.principle:522).
const STANDBY_CLASS_ICONS: Record<StandbyTurnClass, string> = {
  shield: 'fa-shield-halved',
  sword: 'fa-khanda',
  sparks: 'fa-bolt',
};

function turnClassForMode(mode: StandbyMode): StandbyTurnClass {
  if (mode === 'sword-b') return 'sword';
  return 'shield';
}

function buildStandbyMarkup(mode: StandbyMode, turnClass: StandbyTurnClass): string {
  const texts = STANDBY_TEXTS[mode];
  const className = STANDBY_CLASS_NAMES[turnClass];
  return `
  <div class="standby-frame"></div>
  <div class="standby-core">
    <div class="standby-shapes">
      ${suitePolygonShapes()}
    </div>
    <div class="standby-logo-badge"><i class="fa-solid ${STANDBY_CLASS_ICONS[turnClass]}" aria-hidden="true"></i></div>
    <p class="standby-class-name">${className} &middot; TURN OVER</p>
    <h1 class="standby-title">${texts.title}</h1>
    <p class="standby-subtitle">${texts.subtitle}</p>
    <p class="standby-timer">00:00</p>
    <p class="standby-note">${texts.note}</p>
    <p class="standby-status-strip" data-state="unknown">
      <span class="standby-status-dot">&#9675;</span>
      <span class="standby-status-text">STATUS UNKNOWN &middot; no reading has landed yet</span>
    </p>
    <p class="standby-hint">the toolbar remains live &middot; Turn Over A reverts to the stable branch</p>
  </div>
  <div class="standby-bracket">
    <span class="bracket-tick left"></span>
    <span class="bracket-rail"></span>
    <span class="bracket-tick right"></span>
  </div>
`;
}

/**
 * C962 · Build the Bridge Turn Over Console — BAND 2 of the three-band stack.
 *
 * Two strata inside one HiFi BASE panel (D13 Sectioned Panel Scannability):
 *   · the SUMMATION strip — stage, elapsed-in-stage, stall, and machine pressure, from the C961
 *     timing instrument. This is the half that answers a 7-minute turn-over.
 *   · the STREAM body — the boot tail, scrollable, off-white, with a drawn empty state.
 *
 * The Summation renders its own ABSENCE first and by design: it must be legible and correct on an
 * older CLI that has never heard of /scp-boot-timing, rather than presenting zeros as measurements.
 */
function buildConsoleMarkup(scpName: string): string {
  const who = scpName.length > 0 ? scpName : 'this SCP';
  return `
  <div class="standby-console-pane">
    <div class="standby-console-head">
      <span class="standby-console-title">Bridge Turn Over Console</span>
      <span class="standby-console-who">${who}</span>
    </div>
    <div class="standby-console-sum is-absent">
      <span class="standby-console-cell">
        <span class="standby-console-k">stage</span><span class="standby-console-v">&mdash;</span>
      </span>
      <span class="standby-console-cell">
        <span class="standby-console-k">stall</span><span class="standby-console-v">&mdash;</span>
      </span>
      <span class="standby-console-cell">
        <span class="standby-console-k">load</span><span class="standby-console-v">&mdash;</span>
      </span>
    </div>
    <pre class="standby-console-body is-empty">&mdash; awaiting the first boot-log line &middot; standing by on /scp-boot-log &mdash;</pre>
  </div>
`;
}

/** mm:ss from a millisecond span — the console's one time formatter, shared by every cell. */
function consoleClock(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

/**
 * Mount the standby overlay onto document.body. Idempotent for the SAME mode: a second
 * call while the overlay is already present is a no-op, so repeated connection losses do
 * not stack overlays. The overlay is cleared automatically when the page reloads on
 * reconnection.
 *
 * GITM A↔B (#641 · TOH-6): when the informational deadline swaps in 'b-still-rebuilding'
 * while a standby is ALREADY mounted, the idempotency guard would block the message
 * upgrade — so an already-mounted overlay performs an INNER-TEXT SWAP instead of returning
 * (single overlay, no double-mount). The swap is WORDING ONLY: the mounted register class
 * stays (the turn-over is still in progress — nothing reverted, so nothing re-tints).
 *
 * STRATIPUNK TURN-OVER EXPRESSIONS (Pewter Tessera · C637): the optional `turnClass` selects the
 * functional color register (SHIELD / SWORD / SPARKS · W3). Absent ⇒ derived from the mode
 * (turnClassForMode) so unthreaded/legacy callers land on SHIELD — the retained scheme, zero
 * visual regression.
 */
/**
 * C1000 · CLEAR THE STANDBY (the user's law: *"Clicking Turn over on A Clears the Current Turn Over
 * Overlay."*)
 *
 * THE WOUND THAT TAUGHT IT: pressing Turn Over on A while a B standby was mounted left the B
 * overlay in place. `showBridgeStandby`'s already-mounted branch updates the title/subtitle/note
 * ONLY for `mode === 'b-still-rebuilding'` and then RETURNS — so an A re-show could not change the
 * copy, and it never reached the timer, which lives in the mount-only path below. The field saw
 * `B STILL REBUILDING` with a counter still running from the B attempt (00:52) against a console
 * reading `crashed 00:39`: two clocks measuring different events. Worse, on the dirty-tree fork the
 * A handler opened the carry panel and RETURNED without touching the overlay at all, so the panel
 * rendered over a stale overlay AND over the dock.
 *
 * WHY REMOVE RATHER THAN MUTATE IN PLACE: a fresh mount is the only path that re-runs the whole
 * construction — the correct register, the correct copy, AND a counter that starts at zero. Trying
 * to patch each field on a live node is how the re-show branch got its narrow, wrong behaviour in
 * the first place. **Take it down; let the next show build it true.**
 *
 * THE TIMER NEEDS NO EXPLICIT CLEAR: its interval self-reaps on the next tick once the node is
 * gone (it checks for the element and clears itself). But the pulse dataset and the console are
 * dropped HERE, synchronously, so nothing outlives the overlay by up to a second.
 */
export const hideBridgeStandby = (): void => {
  // C1006 · release the slot FIRST — keyed by id, so this is a no-op if something already
  // superseded us (a late teardown must never evict the surface that replaced it).
  lowerSurface(STANDBY_SURFACE_ID);
  if (typeof document === 'undefined') return;
  const node = document.getElementById(STANDBY_OVERLAY_ID);
  if (node) node.remove();
  if (document.body && document.body.dataset) delete document.body.dataset.standbyPulse;
  // C962 · THE ONE SWEEP — the overlay and its console have ONE lifetime.
  removeStandbyConsole();
};

export const showBridgeStandby = (
  mode: StandbyMode = 'turn-over',
  progress?: GitmTurnoverProgress | null,
  turnClass?: StandbyTurnClass,
): void => {
  if (typeof document === 'undefined' || !document.body) {
    return;
  }

  const resolvedClass: StandbyTurnClass = turnClass ?? turnClassForMode(mode);

  // C1006 · THE SUPREMACY REGISTRY. The standby is the RECOVERY surface — the escape hatch a user
  // recovers THROUGH — so raising it cancels whatever holds the slot, including the A-confirm modal
  // whose inset:0 backdrop buried the dock in the field. This is seated HERE, at the raise, because
  // the standby is raised by a WebSocket CLOSE with no gesture at all: a cure at the click could
  // never have reached it.
  raiseSurface(STANDBY_SURFACE_ID, 'recovery', hideBridgeStandby);

  const existing = document.getElementById(STANDBY_OVERLAY_ID);
  if (existing) {
    // C639 · THE STICKY-EXPLICIT REGISTER — an EXPLICIT turnClass on a re-show re-tints the
    // mounted overlay in place (register classes + eyebrow + badge glyph); a derived default
    // NEVER downgrades an expression that a trigger declared (the Shield-on-B field round:
    // whichever show mounts first, the declared class wins).
    if (turnClass && !existing.classList.contains(standbyClassName(turnClass))) {
      existing.classList.remove('standby-express-shield', 'standby-express-sword', 'standby-express-sparks');
      existing.classList.add(standbyClassName(turnClass));
      const classEl = existing.querySelector('.standby-class-name');
      if (classEl) classEl.innerHTML = `${STANDBY_CLASS_NAMES[turnClass]} &middot; TURN OVER`;
      const badgeEl = existing.querySelector('.standby-logo-badge i');
      if (badgeEl) badgeEl.className = `fa-solid ${STANDBY_CLASS_ICONS[turnClass]}`;
    }
    // Already mounted — upgrade the message in place when the informational deadline elapses.
    // TOH-6 · WORDING ONLY: the register class the trigger declared STAYS (the turn-over is
    // still in progress — nothing reverted, so nothing re-tints; the sticky-explicit guard
    // above already handled any explicit class the caller re-declared).
    if (mode === 'b-still-rebuilding') {
      const texts = STANDBY_TEXTS[mode];
      const titleEl = existing.querySelector('.standby-title');
      const subtitleEl = existing.querySelector('.standby-subtitle');
      const noteEl = existing.querySelector('.standby-note');
      if (titleEl) titleEl.innerHTML = texts.title;
      if (subtitleEl) subtitleEl.innerHTML = texts.subtitle;
      if (noteEl) noteEl.innerHTML = texts.note;
    }
    return;
  }

  if (!document.getElementById(STANDBY_STYLE_ID)) {
    const style = document.createElement('style');
    style.id = STANDBY_STYLE_ID;
    style.textContent = STANDBY_STYLES;
    document.head.appendChild(style);
  }

  const overlay = document.createElement('div');
  overlay.id = STANDBY_OVERLAY_ID;
  overlay.classList.add(standbyClassName(resolvedClass));
  overlay.setAttribute('role', 'alert');
  overlay.setAttribute('aria-live', 'assertive');
  overlay.innerHTML = buildStandbyMarkup(mode, resolvedClass);
  document.body.appendChild(overlay);

  // THE STALL TIMER (user design · Cycle 261): elapsed mm:ss from mount. The user working in
  // the retained top/bottom fifths gets a FEEL for a stalled turn-over — past the expected
  // beat, the LIVE toolbar's Turn Over A is the revert. Self-clearing: the interval kills
  // itself when the overlay leaves the DOM (page reload anor manual removal).
  const startedAt = Date.now();
  const timerEl = overlay.querySelector('.standby-timer');
  const titleEl = overlay.querySelector('.standby-title');
  // THE ESCALATING PULSE (user design): every 15 elapsed seconds the stall deepens — pulseLevel
  // climbs (cap 4), swapping the .standby-title pulse-N class + mirroring on document.body's
  // data-standby-pulse so the LIVE toolbar's Turn Over A escalates in lockstep (style.css).
  let pulseLevel = 0;
  const timerInterval = setInterval(() => {
    if (!document.getElementById(STANDBY_OVERLAY_ID)) {
      clearInterval(timerInterval);
      delete document.body.dataset.standbyPulse;
      removeStandbyConsole();
      return;
    }
    const elapsed = Math.floor((Date.now() - startedAt) / 1000);
    if (timerEl) {
      timerEl.textContent =
        String(Math.floor(elapsed / 60)).padStart(2, '0') +
        ':' +
        String(elapsed % 60).padStart(2, '0');
    }
    const nextLevel = Math.min(4, Math.floor(elapsed / 15));
    if (nextLevel !== pulseLevel) {
      pulseLevel = nextLevel;
      if (titleEl) {
        titleEl.classList.remove('pulse-1', 'pulse-2', 'pulse-3', 'pulse-4');
        if (pulseLevel > 0) titleEl.classList.add(`pulse-${pulseLevel}`);
      }
      if (pulseLevel > 0) {
        document.body.dataset.standbyPulse = String(pulseLevel);
      } else {
        delete document.body.dataset.standbyPulse;
      }
    }
  }, 1000);

  // BOOT-STREAM (the live tail · user design): poll the re-booting SCP's boot log across the
  // respawn gap and render the tail into the console band's body. Same DOM-existence self-clear
  // guard as the timer — the interval kills itself (and clears the pulse mirror) when the overlay
  // leaves the DOM. Requires the carrier (bridgeEndpoint + scpName); silent no-op otherwise.
  // TOH-9 · C957 · THE OVERLAY MUST ASK THE CLI THAT OWNS THIS SCP.
  //
  // THE FIELD PROOF (the deliberate-crash test): the CLI detected the crash correctly and served it
  //   GET 7113/scp-status/IsomorphicExpanse → {"state":"crashed","signature":"[nodemon] app crashed"}
  // while the overlay asked the OTHER CLI —  7111/scp-status/... → 404 — and therefore showed the
  // ordinary countdown with no information. `progress.bridgeEndpoint` is stamped at CLICK TIME from
  // the RAW shared `bridge.json.endpoint` (GitmTurnOverBButton), which an older production peer
  // rewrites with ITS own port (the C952 erasure). The C953 cure fixed the 13 controller dial sites
  // and MISSED this one carrier field — the same class, one line away.
  //
  // THE CURE, same-origin and self-healing: our OWN server publishes `originEndpoint` on
  // /scp-config (C953 Band B) — the channel no other CLI can overwrite. Resolve it live and prefer
  // it; the stamped carrier stays the fallback, so a progress record already sitting in localStorage
  // (stamped with the wrong port) still heals on the next poll.
  // ══════════════════════════════════════════════════════════════════════════
  // C961 · THE SELF-RESOLVING OVERLAY — the root the C959 Salvo named, cured at the seat.
  //
  // THE WOUND (measured): the three pollers were gated on `bootEndpoint && bootScpName`, BOTH read
  // from the STAMPED carrier. Only ONE caller in the whole tree stamps a complete carrier
  // (GitmTurnOverBButton.vue:231, the only site that awaits getScpName()). Every other leg fails
  // the gate and the overlay goes blind:
  //   · the HARD turn-over (IslandWrapper 'turn-over' + the A-modal's ground-reset fork) wrote
  //     NO carrier at all → progress === null → both fields '' → all three pollers dead. This is
  //     the leg the user tested with, and the exact reason a Hard Turn Over showed a bare timer.
  //   · the DOCK's A anor B legs write a carrier but OMIT scpName (buttonClicked is sync; the
  //     name resolves async) → the gate still fails.
  //
  // THE CURE — NO PARALLEL PATHS: stop asking the CALLER for what the SERVER already publishes.
  // /scp-config carries BOTH `originEndpoint` (C953) and `scpName`, same-origin, and cannot be
  // overwritten by a peer CLI (the C952 erasure class). Resolve them HERE, once, cached; the
  // stamped carrier stays as the fallback so an older progress record still heals. Every leg —
  // hard, dock-A, dock-B, button, and a post-reload remount with no carrier at all — now polls.
  //
  // ABSENCE IS A STATE: an unresolvable origin never fakes a reading. The pollers no-op and the
  // status strip says WHY it declined, in the C958 pip's own words.
  type ResolvedOrigin = { endpoint: string; scpName: string };
  let resolvedOrigin: ResolvedOrigin | null = null;
  let originDecline: ScpStatusPipDeclineReason = 'not-yet-polled';
  const carrierEndpoint = progress?.bridgeEndpoint ?? '';
  const carrierScpName = progress?.scpName ?? '';
  const resolveOrigin = async (): Promise<ResolvedOrigin | null> => {
    if (resolvedOrigin) return resolvedOrigin;
    let endpoint = '';
    let scpName = '';
    let configAnswered = false;
    try {
      const res = await fetch('/scp-config', { cache: 'no-store' });
      if (res.ok) {
        configAnswered = true;
        const cfg = (await res.json()) as { originEndpoint?: string; scpName?: string | null };
        if (typeof cfg.originEndpoint === 'string') endpoint = cfg.originEndpoint;
        if (typeof cfg.scpName === 'string') scpName = cfg.scpName;
      }
    } catch {
      /* the SCP is mid-reboot — fall through to the stamped carrier for this tick */
    }
    if (!endpoint) endpoint = carrierEndpoint;
    if (!scpName) scpName = carrierScpName;
    if (!endpoint || !scpName) {
      // configAnswered ⇒ an older citizen that publishes no origin (a build-age fact, permanent
      // for this session); otherwise the server simply did not answer this tick (transient).
      originDecline = configAnswered ? 'no-origin' : 'fetch-failed';
      return null;
    }
    originDecline = null;
    resolvedOrigin = { endpoint, scpName };
    return resolvedOrigin;
  };

  // ── C962 · MOUNT BAND 2 · the console, as the overlay's sibling ──────────────────────────
  // Its own root: a sibling band cannot overflow a container it does not sit in. Same lifecycle
  // as the overlay — mounted here, self-clearing on the same DOM-existence guard below, and swept
  // by every path that removes the overlay (the reload, the DISMISS).
  let consoleEl = document.getElementById(STANDBY_CONSOLE_ID);
  if (!consoleEl) {
    consoleEl = document.createElement('div');
    consoleEl.id = STANDBY_CONSOLE_ID;
    consoleEl.setAttribute('aria-live', 'polite');
    consoleEl.innerHTML = buildConsoleMarkup(progress?.scpName ?? '');
    document.body.appendChild(consoleEl);
  }
  const consolePane = consoleEl.querySelector('.standby-console-pane') as HTMLElement | null;
  const consoleWho = consoleEl.querySelector('.standby-console-who') as HTMLElement | null;
  const consoleSum = consoleEl.querySelector('.standby-console-sum') as HTMLElement | null;
  // THE STREAM'S NEW SEAT. `streamEl` keeps its name so every writer below is unchanged — the
  // region moved bands, it did not change meaning (T2 anor T5 cured by relocation, not by rewrite).
  const streamEl = consoleEl.querySelector('.standby-console-body');
  if (streamEl) {
    // TOH-7 · BAND 3 · THE CRASH FACT ON THE OVERLAY. The client polls its own CLI (it knows the
    // CLI's port — C950 namedBridges anor resolveOriginPort) for the FACT the CLI established from
    // the server's own STD. THE FACT, NEVER THE CLOCK: 'CRASHED' appears here ONLY while
    // /scp-status says crashed — the deadline timer still may not claim failure (TOH-6). The
    // client→server polling that queues the restart is UNTOUCHED; this rides alongside it.
    let crashRendered = false;

    // C962 · THE ONE WRITER into the stream body — it owns the empty-state class so no caller can
    // leave the band claiming "awaiting the first line" while text sits in it, nor blank when it
    // has nothing. ABSENCE IS DRAWN: empty text restores the stated empty render, never a void box.
    const writeStream = (text: string): void => {
      if (!streamEl) return;
      if (text.length === 0) {
        streamEl.classList.add('is-empty');
        streamEl.textContent =
          '— awaiting the first boot-log line · standing by on /scp-boot-log —';
        return;
      }
      const wasPinned =
        streamEl.scrollTop + streamEl.clientHeight >= streamEl.scrollHeight - 4;
      streamEl.classList.remove('is-empty');
      streamEl.textContent = text;
      // TAIL-FOLLOW, but never against the reader: the band re-pins to the newest line only when
      // the reader was already at the bottom. Scrolling up to read a build error holds position.
      if (wasPinned) streamEl.scrollTop = streamEl.scrollHeight;
    };

    // ══════════════════════════════════════════════════════════════════════
    // C960 · SEAT 1 · THE ALWAYS-ON STATUS READOUT (the user's word: the indicator moves ONTO
    // the overlay — during a turn-over the overlay owns the viewport, so a dock chip behind it
    // is the wrong place to look; the dock pip stays as Seat 2 for the steady state).
    //
    // ONE FACT, TWO RENDERS: this strip and the C958 dock pip read the same /scp-status fact
    // through the same resolved origin and classify it through the same pure law
    // (classifyScpStatus + SCP_STATUS_PIP_PRESENTATION). It repaints on EVERY tick of the 1s
    // poll below — not only on `crashed`, which was the whole gap: a rebuild in flight said
    // nothing at all for its entire duration (the 7-minute field run showed an IDENTICAL DOM
    // from minute 1 to minute 7 · TOH10-L4 silence #1).
    //
    // THE ONE DEVIATION FROM THE PIP'S CLASSIFIER, and why: classifyScpStatus keys 'restarting'
    // off `overlayPresent` because the DOCK defers to the overlay for the verdict. The overlay
    // does not defer to itself — it IS the seat that holds the verdict — so it passes `false`
    // and reads the fact directly, then names a recognized not-crashed fact 'restarting'
    // (the overlay is up: the rebuild IS the event, and nothing has crashed).
    const statusStrip = overlay.querySelector('.standby-status-strip') as HTMLElement | null;
    const statusDot = overlay.querySelector('.standby-status-dot') as HTMLElement | null;
    const statusText = overlay.querySelector('.standby-status-text') as HTMLElement | null;
    // The ASCII stand-ins for the pip's Font Awesome glyphs: filled for a live reading, an
    // X-mark for crashed, a HOLLOW ring for unknown — absence is drawn, never left blank.
    const STATUS_GLYPH: Record<ScpStatusPipState, string> = {
      unknown: '○',
      healthy: '●',
      crashed: '✖',
      restarting: '●',
    };
    let lastFact: ScpStatusFactShape | null = null;
    let factDecline: ScpStatusPipDeclineReason = 'not-yet-polled';
    const renderStatus = (): void => {
      if (!statusStrip || !statusDot || !statusText) return;
      const classified = classifyScpStatus(lastFact, false);
      const state: ScpStatusPipState =
        classified === 'crashed'
          ? 'crashed'
          : originDecline !== null || factDecline !== null
            ? 'unknown'
            : 'restarting';
      const look = SCP_STATUS_PIP_PRESENTATION[state];
      const who = resolvedOrigin?.scpName ?? carrierScpName;
      const name = who.length > 0 ? who : 'THIS SCP';
      let body: string;
      if (state === 'crashed') {
        const signature =
          lastFact?.signature && lastFact.signature.length > 0
            ? lastFact.signature
            : 'THE BUILD DID NOT RETURN';
        body = `${signature} · the fuchsia Hard Turn Over at the right of the dock restarts it`;
      } else if (state === 'restarting') {
        body = `the origin CLI reports not-crashed · polling ${resolvedOrigin?.endpoint ?? ''}`;
      } else {
        // A DECLINING READOUT ALWAYS SAYS WHY — never an unexplained dim dot (the C958 law).
        body = declineExplanation(originDecline ?? factDecline);
      }
      statusStrip.dataset.state = state;
      statusDot.textContent = STATUS_GLYPH[state];
      statusDot.style.color = look.color;
      statusDot.style.textShadow = `0 0 8px ${look.accent}`;
      statusText.style.color = look.color;
      statusText.textContent = `${name} · ${look.label} · ${body}`;
    };
    renderStatus();

    const renderCrash = (signature: string, excerpt: string[]): void => {
      if (crashRendered) return;
      crashRendered = true;
      overlay.classList.add('standby-crashed');
      const titleEl = overlay.querySelector('.standby-title');
      const subEl = overlay.querySelector('.standby-subtitle');
      const noteEl = overlay.querySelector('.standby-note');
      if (titleEl) titleEl.textContent = 'SERVER CRASHED';
      if (subEl) subEl.textContent = signature || 'THE BUILD DID NOT RETURN';
      if (noteEl) {
        noteEl.textContent =
          'the last output is below · a restart was requested · Turn Over on A remains at your discretion';
      }
      consolePane?.classList.add('is-crashed');
      if (excerpt.length > 0) writeStream(excerpt.slice(-8).join('\n'));
    };
    const pollCrashFact = async (): Promise<void> => {
      const origin = await resolveOrigin();
      if (!origin) {
        renderStatus();
        return;
      }
      try {
        const res = await fetch(`${origin.endpoint}/scp-status/${origin.scpName}`);
        if (!res.ok) {
          factDecline = 'fetch-failed';
          renderStatus();
          return;
        }
        const fact = (await res.json()) as ScpStatusFactShape;
        lastFact = fact;
        factDecline =
          fact.state === 'crashed' || fact.state === 'not-crashed' ? null : 'unrecognized';
        if (fact.state === 'crashed') {
          renderCrash(fact.signature ?? '', Array.isArray(fact.excerpt) ? fact.excerpt : []);
        }
      } catch {
        /* the CLI may be mid-write — the next tick reads it; silence is never a crash claim */
        factDecline = 'fetch-failed';
      }
      renderStatus();
    };
    const pollBootStream = async (): Promise<void> => {
      const origin = await resolveOrigin();
      if (!origin) return;
      try {
        const res = await fetch(`${origin.endpoint}/scp-boot-log/${origin.scpName}`);
        if (!res.ok) return;
        const data = (await res.json()) as { lines?: string[] };
        const lines = Array.isArray(data.lines) ? data.lines : [];
        // While the crash presentation stands, its excerpt owns the stream — the tail would
        // scroll the evidence away.
        // The band is taller than the old 72px clip, so it carries more of the tail honestly.
        if (!crashRendered) writeStream(lines.slice(-24).join('\n'));
      } catch {
        /* the SCP is mid-reboot — the poll simply misses until it comes up */
      }
    };
    // ─────────────────────────────────────────────────────────────────────────
    // TOH-8 · BAND A · THE BOOT WITNESS anor THE NO-EFFECT VERDICT.
    //
    // THE C952 WOUND: the standby has NO removal path of its own — the only one in the tree is
    // `window.location.reload()`, and it is armed solely by the WebSocket `close` handler. When a
    // turn-over NEVER FIRES (the C952 field: the click reached a CLI that did not own this SCP, so
    // no branch · no stamp · no restart), the server never dies, the socket never closes, and the
    // overlay counts forever while telling the user 'the system resumes automatically'. Silence
    // was structurally indistinguishable from progress.
    //
    // THE CURE, FROM SAME-ORIGIN EVIDENCE ALONE: our own server publishes `bootedAt` on
    // /scp-config. A server that ANSWERS while its bootedAt still PRECEDES the click has
    // demonstrably NOT restarted — that is a FACT, not a clock reading, so the Agency Cure
    // (TOH-6) holds: we never claim failure from elapsed time. Two honest outcomes:
    //   · bootedAt ADVANCED past the click  → the server DID restart → reload NOW (the clear seam
    //     no longer waits on a socket event that may never come).
    //   · the server answers, bootedAt UNCHANGED, past the grace window → THE TURN-OVER DID NOT
    //     FIRE → say so, and offer dismissal (the user's agency, restored with information).
    const NO_EFFECT_GRACE_MS = 12_000;
    // The click time is DERIVED from the persisted deadline (`Date.now() + GITM_TURNOVER_DEADLINE_MS`
    // at write time) — no schema change, and it works for progress already in localStorage.
    const clickAt =
      typeof progress?.deadline === 'number' && progress.deadline > 0
        ? progress.deadline - GITM_TURNOVER_DEADLINE_MS
        : Date.now();
    let noEffectRendered = false;
    const renderNoEffect = (bootedAt: number): void => {
      if (noEffectRendered || crashRendered) return;
      noEffectRendered = true;
      overlay.classList.add('standby-no-effect');
      const titleEl = overlay.querySelector('.standby-title');
      const subEl = overlay.querySelector('.standby-subtitle');
      const noteEl = overlay.querySelector('.standby-note');
      if (titleEl) titleEl.textContent = 'THE TURN-OVER DID NOT FIRE';
      if (subEl) subEl.textContent = 'THIS SERVER NEVER RESTARTED';
      if (noteEl) {
        noteEl.textContent =
          'no restart reached this SCP · dismiss below and try again, or Turn Over on A from the dock';
      }
      writeStream(
        `server boot ${new Date(bootedAt).toLocaleTimeString()} · your action ${new Date(clickAt).toLocaleTimeString()}`,
      );
      // THE DISMISS — the overlay's FIRST self-removal path in the tree. Only ever offered on a
      // proven no-effect: a standby over a genuinely rebuilding server must never be dismissable.
      if (!overlay.querySelector('.standby-dismiss')) {
        const btn = document.createElement('button');
        btn.className = 'standby-dismiss';
        btn.textContent = 'DISMISS';
        btn.addEventListener('click', () => {
          const node = document.getElementById(STANDBY_OVERLAY_ID);
          if (node) node.remove();
          delete document.body.dataset.standbyPulse;
          // Both bands, one gesture — a console left behind would report an event that is over.
          removeStandbyConsole();
        });
        (overlay.querySelector('.standby-note')?.parentElement ?? overlay).appendChild(btn);
      }
    };
    const pollBootWitness = async (): Promise<void> => {
      try {
        const res = await fetch('/scp-config', { cache: 'no-store' });
        if (!res.ok) return; // no answer ⇒ the server IS down ⇒ a genuine rebuild is in flight
        const cfg = (await res.json()) as { bootedAt?: number };
        const bootedAt = typeof cfg.bootedAt === 'number' ? cfg.bootedAt : 0;
        if (bootedAt === 0) return; // an older SCP build publishes no witness — stay silent
        if (bootedAt > clickAt) {
          // THE SERVER CAME BACK — the honest clear, independent of the socket's close event.
          window.location.reload();
          return;
        }
        if (Date.now() - clickAt > NO_EFFECT_GRACE_MS) renderNoEffect(bootedAt);
      } catch {
        /* mid-restart: the fetch simply fails — that is a HEALTHY rebuild, never a claim */
      }
    };

    // ══════════════════════════════════════════════════════════════════════
    // C962 · THE SUMMATION — BAND 2's reason to exist (Base is Suite 0: Unification anor
    // Summarization, so the Summation register is semantic, not decorative).
    //
    // Fed by the C961 timing instrument: GET /scp-boot-timing/:scpName/summary carries `stallMs`
    // (signal → first sign of life from the child) and the last event's machine pressure. THE
    // 7-MINUTE TURN-OVER IS THE CASE THIS ANSWERS: its build span was 14 SECONDS, so a raw tail
    // showed nothing but runtime chatter while 97% of the time went unexplained. STALL 06:46 read
    // beside LOAD 9.87 puts the diagnosis on the glass.
    //
    // A CLI THAT HAS NEVER HEARD OF THE INSTRUMENT IS A FIRST-CLASS CASE, not an error: it 404s,
    // and the strip holds its stated absence rather than presenting zeros as measurements.
    const setCell = (index: number, key: string, value: string): void => {
      const cells = consoleSum?.querySelectorAll('.standby-console-cell');
      const cell = cells?.[index];
      if (!cell) return;
      const k = cell.querySelector('.standby-console-k');
      const v = cell.querySelector('.standby-console-v');
      if (k) k.textContent = key;
      if (v) v.textContent = value;
    };
    const pollSummation = async (): Promise<void> => {
      const origin = await resolveOrigin();
      if (!origin || !consoleSum) return;
      try {
        const res = await fetch(`${origin.endpoint}/scp-boot-timing/${origin.scpName}/summary`);
        if (!res.ok) return; // an older CLI — the stated absence stands, never overwritten by zeros
        const body = (await res.json()) as {
          summary?: {
            events?: { stage?: string; t?: number; load1?: number; freeMemMb?: number }[];
            signalAt?: number | null;
            stallMs?: number | null;
            crashed?: boolean;
          } | null;
        };
        const sum = body.summary;
        if (!sum || !Array.isArray(sum.events) || sum.events.length === 0) return;
        const last = sum.events[sum.events.length - 1];
        consoleSum.classList.remove('is-absent');
        // STAGE — the stage the child is IN, with how long it has been there. A stage that stops
        // advancing while the clock climbs IS the stall, visible without arithmetic.
        const inStage = typeof last.t === 'number' ? consoleClock(Date.now() - last.t) : '--:--';
        setCell(0, 'stage', `${last.stage ?? '—'} ${inStage}`);
        // STALL — signal → first sign of life. Still running ⇒ measure against now, so a stall in
        // progress climbs on the glass instead of appearing only after it ends.
        const stall =
          typeof sum.stallMs === 'number'
            ? consoleClock(sum.stallMs)
            : typeof sum.signalAt === 'number' && sum.signalAt !== null
              ? consoleClock(Date.now() - sum.signalAt)
              : '--:--';
        setCell(1, 'stall', stall);
        // PRESSURE — the half that separates exhaustion from contention. Same timeline, two very
        // different wounds; without this cell both read as "the build is slow".
        const load = typeof last.load1 === 'number' ? last.load1.toFixed(2) : '—';
        const free = typeof last.freeMemMb === 'number' ? `${last.freeMemMb}M free` : '';
        setCell(2, 'load', free.length > 0 ? `${load} · ${free}` : load);
      } catch {
        /* mid-write or unreachable — the strip holds its last honest reading; silence claims nothing */
      }
    };

    if (consoleWho && resolvedOrigin === null && carrierScpName.length === 0) {
      // The name was unknown at mount (no carrier). Fill it in once the origin resolves.
      void resolveOrigin().then((o) => {
        if (o && consoleWho) consoleWho.textContent = o.scpName;
      });
    }

    void pollBootStream();
    void pollCrashFact();
    void pollBootWitness();
    void pollSummation();
    const bootInterval = setInterval(() => {
      if (!document.getElementById(STANDBY_OVERLAY_ID)) {
        clearInterval(bootInterval);
        delete document.body.dataset.standbyPulse;
        removeStandbyConsole();
        return;
      }
      void pollBootStream();
      void pollCrashFact();
      void pollBootWitness();
      void pollSummation();
    }, 1000);
  }
};
