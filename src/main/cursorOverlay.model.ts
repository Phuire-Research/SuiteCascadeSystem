// cursorOverlay.model.ts — the HiFi pointer surface for every visible Bridge presenter window.
//
// THE AUTHORITY SPLIT (the design verdict · the user follows the in-surface VIRTUAL pointer; the
// real pointer carries the SELECTION dynamic). Two distinct surfaces, never the same window:
//
//   THE VIRTUAL (in-surface · the offscreen overlay) — a fixed <div> drawn synchronously on each
//   mousemove. On the SHADED surfaces it is REDACTED: only the arrow + the paired-diamond body
//   show; the band ring + the state indicator are hidden (the real pointer carries those now).
//   On the flat (non-shaded) windows the overlay is not used at all.
//
//   THE REAL (the presenter / flat windows) — the OS pointer itself, STYLED via
//   `cursor: url(svg) x y, auto`. NO hiding anywhere: the real pointer becomes a small image of
//   the Suite-Cascade wheel (default) or one of the four alternative-state images. A per-window
//   style-swap drives the state; on the shaded pair the swap is fed by a relay from the offscreen
//   overlay's state transitions.
//
// ARCHITECTURE NOTES (grounded in the design doc — verdicts binding):
//   60fps overlay        → a single fixed-position <div> updated SYNCHRONOUSLY in a mousemove
//                          handler via translate3d; will-change:transform promotes a GPU layer;
//                          pointer-events:none is mandatory (the overlay must never hit-test).
//   Warp correction      → NONE in the draw path. The overlay draws at the forwarded coordinate.
//   Rotating band        → @property --angle + an 8-stop conic-gradient on ::before, masked with
//                          composite:exclude so only a ring shows. ~7s/rev (slow + dignified). Note:
//                          a cursor IMAGE cannot animate, so the real-pointer wheel is STATIC.
//   Flash mitigation     → blur → opacity 0; focus → opacity 1 (overlay only).
//
// The injected CSS/JS strings below are self-contained shipped frontend code: standard CSS custom
// properties, inline SVG, and a mousemove state resolver. No build-system vocabulary leaks into the
// shipped surface — this file's comments may cite the design; the injected strings may not.
//
// ── The pointer design (authored by the design pass · the user's spec) ─────────────────────────
//
// THE BODY — the paired-glyph arrow. The pointer is an arrow whose body carries two small diamonds
// offset along the arrow axis: a FILLED (opaque) diamond toward the tip and an OPEN (outlined)
// diamond toward the back. The pair reads as one mark: the filled diamond is the realized half (the
// done thing), the open diamond is the intended half (the planned thing) — a depth-paired motif.
// The arrow + glyphs carry a top-left light source via drop-shadow filters (a subtle dark/light edge,
// matching the embossed-border light convention) for pewter-like raised depth.
//
// THE BAND — the BACK of the arrow is accented with a rotating ring of the eight cascade-suite
// colors (a conic-gradient masked to a ring on ::before). The eight stops are tokened from the same
// suite palette the renderer uses (mirrored below as --cursor-band-* so the shipped overlay carries
// no cross-module import). Rotation is slow (~7s per revolution) so it reads as a dignified accent,
// not a spinner.
//
// THE STATE INDICATOR — ONE base pointer serves every state. Alternative states ADD a small circular
// indicator at the pointer's lower-right (absent in the default state), filled with a minimal glyph
// whose color is a SINGLE suite color per state. The same four glyphs back the real-pointer state
// images (the wheel ring + the suite-colored state circle). The state→color assignment (rationale):
//
//   ┌──────────┬───────────┬──────────────────────────────────────────────────────────────────┐
//   │ state    │ suite     │ rationale                                                          │
//   ├──────────┼───────────┼──────────────────────────────────────────────────────────────────┤
//   │ text     │ Ochre     │ the Architect drafts structure — an I-beam marks where text is     │
//   │          │ (gold)    │ composed; the closest cascade analogue to naming/laying-out text.  │
//   │ pointer  │ Cobalt    │ the Professional acts — interactivity IS the doing; a clickable    │
//   │          │ (blue)    │ target is an invitation to act, so the action color marks it.      │
//   │ busy     │ Rose      │ the Clinician measures — a busy/loading state is a measurement in   │
//   │          │ (pink)    │ progress; the diagnostic color marks the wait.                     │
//   │ grab     │ Viridian  │ the Sculptor shapes — a drag reshapes layout; the shaping color    │
//   │          │ (green)   │ marks a grabbable / dragging surface.                              │
//   └──────────┴───────────┴──────────────────────────────────────────────────────────────────┘
//
// THE STATE DETECTION — the injected script keeps a selector→state map and resolves it via
// elementFromPoint on each mousemove (cheap — the same event already fires). A mouseleave/enter
// window guard hides the pointer when the cursor leaves the window. Default state shows no indicator.

import type { BrowserWindow } from 'electron';

// ── Tokens ─────────────────────────────────────────────────────────────────────────────────────
// The eight cascade-suite band colors (the conic ring) + the paired-glyph body colors. Mirrored as
// literal values so the shipped overlay carries no import; kept in suite order for the ring stops.
const BAND_OBSIDIAN = 'rgb(30, 30, 30)';
const BAND_MAROON = 'rgb(128, 0, 0)';
const BAND_RUST = 'rgb(183, 65, 14)';
const BAND_OCHRE = 'rgb(204, 119, 34)';
const BAND_VIRIDIAN = 'rgb(64, 130, 109)';
const BAND_COBALT = 'rgb(0, 71, 171)';
const BAND_AMETHYST = 'rgb(153, 102, 204)';
const BAND_ROSE = 'rgb(255, 102, 178)';

// The paired-glyph body. Filled = the realized half; open = the intended half.
const GLYPH_FILLED = 'rgb(12, 12, 14)'; // deep, opaque — the done mark
const GLYPH_FILLED_EDGE = 'rgb(210, 212, 220)'; // a light pewter rim on the filled glyph
const GLYPH_OPEN = 'rgb(232, 233, 238)'; // bright outline — the planned mark
const ARROW_FILL = 'rgb(228, 230, 236)'; // the arrow body — pewter-light
const ARROW_EDGE = 'rgb(40, 42, 48)'; // the arrow outline — pewter-dark

// State indicator suite colors (see the rationale table above).
const STATE_TEXT_COLOR = BAND_OCHRE;
const STATE_POINTER_COLOR = BAND_COBALT;
const STATE_BUSY_COLOR = BAND_ROSE;
const STATE_GRAB_COLOR = BAND_VIRIDIAN;

// ── The injected stylesheet ──────────────────────────────────────────────────────────────────
// Styles the overlay element + the rotating band ring. The OS pointer is NEVER hidden here — it is
// styled separately (attachRealCursorStyle) on the presenter / flat windows. The `[data-redacted]`
// belt hides the band ring + state indicator on the shaded surfaces (the real pointer carries those).
const cursorStylesheet = `
:root {
  --cursor-band-1: ${BAND_OBSIDIAN};
  --cursor-band-2: ${BAND_MAROON};
  --cursor-band-3: ${BAND_RUST};
  --cursor-band-4: ${BAND_OCHRE};
  --cursor-band-5: ${BAND_VIRIDIAN};
  --cursor-band-6: ${BAND_COBALT};
  --cursor-band-7: ${BAND_AMETHYST};
  --cursor-band-8: ${BAND_ROSE};
  --cursor-state-text: ${STATE_TEXT_COLOR};
  --cursor-state-pointer: ${STATE_POINTER_COLOR};
  --cursor-state-busy: ${STATE_BUSY_COLOR};
  --cursor-state-grab: ${STATE_GRAB_COLOR};
}

/* The redacted surface (the shaded presenters' offscreen source): the virtual keeps ONLY the
   arrow + paired-diamond body; the band ring and the state indicator belong to the real pointer. */
#hf-pointer[data-redacted] .hf-band,
#hf-pointer[data-redacted] .hf-state { display: none !important; }

@property --hf-pointer-angle {
  syntax: '<angle>';
  inherits: false;
  initial-value: 0deg;
}

#hf-pointer {
  position: fixed;
  top: 0;
  left: 0;
  width: 38px;
  height: 38px;
  z-index: 2147483647;
  pointer-events: none;
  will-change: transform;
  transform: translate3d(-100px, -100px, 0);
  opacity: 1;
  transition: opacity 90ms linear;
}

/* The rotating eight-band ring, anchored at the BACK of the arrow (lower-left of the box). */
#hf-pointer .hf-band {
  position: absolute;
  left: 1px;
  bottom: 1px;
  width: 16px;
  height: 16px;
  border-radius: 50%;
}
#hf-pointer .hf-band::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 50%;
  padding: 2px;
  background: conic-gradient(
    from var(--hf-pointer-angle),
    var(--cursor-band-1) 0deg 45deg,
    var(--cursor-band-2) 45deg 90deg,
    var(--cursor-band-3) 90deg 135deg,
    var(--cursor-band-4) 135deg 180deg,
    var(--cursor-band-5) 180deg 225deg,
    var(--cursor-band-6) 225deg 270deg,
    var(--cursor-band-7) 270deg 315deg,
    var(--cursor-band-8) 315deg 360deg
  );
  -webkit-mask:
    linear-gradient(#000 0 0) content-box,
    linear-gradient(#000 0 0);
  -webkit-mask-composite: xor;
  mask:
    linear-gradient(#000 0 0) content-box,
    linear-gradient(#000 0 0);
  mask-composite: exclude;
  animation: hf-pointer-spin 7s linear infinite;
}

@keyframes hf-pointer-spin {
  to { --hf-pointer-angle: 360deg; }
}

/* The arrow + paired-glyph body. Top-left light source via the drop-shadow pair. */
#hf-pointer .hf-arrow {
  position: absolute;
  top: 0;
  left: 0;
  width: 38px;
  height: 38px;
  filter:
    drop-shadow(-0.5px -0.5px 0 rgba(255, 255, 255, 0.45))
    drop-shadow(1px 1px 1.5px rgba(0, 0, 0, 0.55));
}

/* The state indicator — lower-right, present only in alternative states. */
#hf-pointer .hf-state {
  position: absolute;
  right: 0;
  bottom: 0;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  display: none;
  align-items: center;
  justify-content: center;
  background: rgba(18, 18, 22, 0.92);
  box-shadow:
    -1px -1px 0 rgba(255, 255, 255, 0.35),
    1px 1px 2px rgba(0, 0, 0, 0.6);
}
#hf-pointer .hf-state svg { width: 12px; height: 12px; }
#hf-pointer[data-state="text"] .hf-state,
#hf-pointer[data-state="pointer"] .hf-state,
#hf-pointer[data-state="busy"] .hf-state,
#hf-pointer[data-state="grab"] .hf-state { display: flex; }
#hf-pointer .hf-glyph { display: none; }
#hf-pointer[data-state="text"] .hf-glyph-text,
#hf-pointer[data-state="pointer"] .hf-glyph-pointer,
#hf-pointer[data-state="busy"] .hf-glyph-busy,
#hf-pointer[data-state="grab"] .hf-glyph-grab { display: block; }
#hf-pointer[data-state="busy"] .hf-glyph-busy {
  transform-origin: center;
  animation: hf-pointer-spin-glyph 0.9s linear infinite;
}
@keyframes hf-pointer-spin-glyph { to { transform: rotate(360deg); } }
`;

// ── The injected script ────────────────────────────────────────────────────────────────────────
// Builds the overlay element, drives position synchronously on mousemove, resolves the state from
// the element under the pointer, and guards opacity on window focus/blur + cursor leave/enter.
// Guarded by window.__scsCursor so re-injection on focus re-entry is idempotent. The OS pointer is
// NOT hidden here (it is styled by attachRealCursorStyle on the presenter / flat windows).
//   redacted  → the overlay carries data-redacted (the CSS hides the band ring + state indicator).
//   stateRelay→ each state TRANSITION emits console.log('[hf-state]', next) so main can relay it to
//               the paired presenter's real-pointer style-swap (wireCursorStateRelay).
function cursorScript(opts: { redacted: boolean; stateRelay: boolean }): string {
  return `
(function () {
  if (window.__scsCursor) { return; }
  window.__scsCursor = true;

  var REDACTED = ${opts.redacted ? 'true' : 'false'};
  var STATE_RELAY = ${opts.stateRelay ? 'true' : 'false'};

  var ARROW = ${JSON.stringify(arrowSvg())};
  var ICON_TEXT = ${JSON.stringify(iconText())};
  var ICON_POINTER = ${JSON.stringify(iconPointer())};
  var ICON_BUSY = ${JSON.stringify(iconBusy())};
  var ICON_GRAB = ${JSON.stringify(iconGrab())};

  function build() {
    if (document.getElementById('hf-pointer')) { return; }
    var el = document.createElement('div');
    el.id = 'hf-pointer';
    el.setAttribute('aria-hidden', 'true');
    if (REDACTED) { el.setAttribute('data-redacted', ''); }
    el.innerHTML =
      '<span class="hf-band"></span>' +
      '<span class="hf-arrow">' + ARROW + '</span>' +
      '<span class="hf-state">' +
        '<span class="hf-glyph hf-glyph-text">' + ICON_TEXT + '</span>' +
        '<span class="hf-glyph hf-glyph-pointer">' + ICON_POINTER + '</span>' +
        '<span class="hf-glyph hf-glyph-busy">' + ICON_BUSY + '</span>' +
        '<span class="hf-glyph hf-glyph-grab">' + ICON_GRAB + '</span>' +
      '</span>';
    (document.body || document.documentElement).appendChild(el);
    return el;
  }

  var pointer = build();
  if (!pointer) { return; }

  function resolveState(target) {
    var node = target;
    var depth = 0;
    while (node && node.nodeType === 1 && depth < 6) {
      if (node === pointer) { node = node.parentElement; depth++; continue; }
      if (node.getAttribute) {
        if (node.getAttribute('aria-busy') === 'true') { return 'busy'; }
        var role = node.getAttribute('role');
        if (node.hasAttribute('data-grab') || node.getAttribute('draggable') === 'true') { return 'grab'; }
        var tag = node.tagName;
        if (tag === 'A' || tag === 'BUTTON' || role === 'button') { return 'pointer'; }
        if (tag === 'INPUT' || tag === 'TEXTAREA' || node.isContentEditable) { return 'text'; }
        var cls = node.classList;
        if (cls) {
          if (cls.contains('loading')) { return 'busy'; }
          if (cls.contains('clickable')) { return 'pointer'; }
        }
      }
      node = node.parentElement;
      depth++;
    }
    return 'default';
  }

  var lastState = 'default';
  function drawAt(x, y) {
    pointer.style.transform = 'translate3d(' + x + 'px,' + y + 'px,0)';
    var under = document.elementFromPoint(x, y);
    var next = under ? resolveState(under) : 'default';
    if (next !== lastState) {
      lastState = next;
      if (next === 'default') { pointer.removeAttribute('data-state'); }
      else { pointer.setAttribute('data-state', next); }
      // THE STATE RELAY (offscreen → main → presenter): on each transition, mark the new state so
      // main's console-message listener can drive the presenter's real-pointer style-swap.
      if (STATE_RELAY) { console.log('[hf-state]', next); }
    }
  }

  // DISTORTION HANDLING PRUNED (user · the final cursor Diamond): the virtual draws EXACTLY
  // at this window's event position — which IS the forwarded/click coordinate (this overlay
  // lives in the offscreen; the events arriving here are already the ray-corrected clicks).
  // The real cursor carries the informative aspect; no draw-side transform exists anymore.
  function position(e) {
    drawAt(e.clientX, e.clientY);
  }

  // THE NO-SHADER DISABLE: when the user selects no shader ('off' · the raw pass-through)
  // the virtual cursor system stands down — main toggles this on every mode swap.
  window.__scsCursorSetEnabled = function (on) {
    pointer.style.display = on ? '' : 'none';
  };

  window.addEventListener('mousemove', position, { passive: true });
  document.addEventListener('mouseleave', function () { pointer.style.opacity = '0'; });
  document.addEventListener('mouseenter', function () { pointer.style.opacity = '1'; });
  window.addEventListener('blur', function () { pointer.style.opacity = '0'; });
  window.addEventListener('focus', function () { pointer.style.opacity = '1'; });
})();
`;
}

// ── Inline SVG factories (the body + the four state glyphs) ──────────────────────────────────────
// THE SWEPT DART (user retool · the reference image): a sleek angular dart — dark body with a
// thin light edge, FEATHERED echo layers trailing the left edge, and an inner stripe of the
// EIGHT SUITE COLORS as diagonal bands down the dart's axis (replacing the reference's blue).
// Tip at top-left (~5,4); the body sweeps down-right.
function arrowSvg(): string {
  // The tip edges BULGE OUTWARD (user): both lines converging on the tip are convex curves.
  const DART = 'M5 4 Q6 19 13 32 L16.5 20.5 L29 17 Q19 7.5 5 4 Z';
  // The colored bands REDACTED (user): the dart is the clean white body alone — the suite
  // colors live on the real bead's ring.
  return (
    '<svg width="38" height="38" viewBox="0 0 38 38" xmlns="http://www.w3.org/2000/svg">' +
    // The feathered echo layers — trailing the left edge (the reference's speed lines).
    `<path d="${DART}" fill="rgb(120,122,130)" fill-opacity="0.22" transform="translate(-3.5,1.5)"/>` +
    `<path d="${DART}" fill="rgb(160,162,170)" fill-opacity="0.3" transform="translate(-1.8,0.8)"/>` +
    // The dart body — near-black with a thin light edge.
    // WHITE background (user) with a dark edge for definition.
    `<path d="${DART}" fill="rgb(255,255,255)" stroke="${ARROW_EDGE}" stroke-width="1.1" stroke-linejoin="round"/>` +
    // (the stripe group removed — user redaction)
    '</svg>'
  );
}

function iconText(): string {
  // An I-beam.
  return (
    '<svg viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">' +
    `<path d="M3 1.5 H9 M3 10.5 H9 M6 1.5 V10.5" stroke="${STATE_TEXT_COLOR}" stroke-width="1.6" ` +
    'stroke-linecap="round" fill="none"/></svg>'
  );
}

function iconPointer(): string {
  // A chevron — the interactive forward beat.
  return (
    '<svg viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">' +
    `<path d="M4 2.5 L8 6 L4 9.5" stroke="${STATE_POINTER_COLOR}" stroke-width="1.8" ` +
    'stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>'
  );
}

function iconBusy(): string {
  // A spinner-arc (open ring) — animated via .hf-glyph-busy.
  return (
    '<svg viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">' +
    `<path d="M6 1.5 A4.5 4.5 0 1 1 1.7 7.2" stroke="${STATE_BUSY_COLOR}" stroke-width="1.7" ` +
    'stroke-linecap="round" fill="none"/></svg>'
  );
}

function iconGrab(): string {
  // A grip — three short bars.
  return (
    '<svg viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">' +
    `<g stroke="${STATE_GRAB_COLOR}" stroke-width="1.5" stroke-linecap="round">` +
    '<path d="M3 3.5 H9"/><path d="M3 6 H9"/><path d="M3 8.5 H9"/></g></svg>'
  );
}

// ── attachHiFiCursor ─────────────────────────────────────────────────────────────────────────
// Idempotent. Injects the overlay stylesheet + the cursor script on did-finish-load and on every
// webContents focus re-entry. A per-window guard prevents binding the same window's events twice;
// the script's own window.__scsCursor guard makes re-injection a no-op for element creation.
//   redacted   → the virtual keeps ONLY the arrow + paired-diamond body (the shaded surfaces).
//   stateRelay → each state transition emits the [hf-state] marker for the relay to the presenter.
const attachedWindows = new WeakSet<BrowserWindow>();

export interface HiFiCursorOptions {
  redacted?: boolean;
  stateRelay?: boolean;
}

export function attachHiFiCursor(win: BrowserWindow, opts: HiFiCursorOptions = {}): void {
  if (!win || win.isDestroyed()) { return; }
  if (attachedWindows.has(win)) { return; }
  attachedWindows.add(win);

  const script = cursorScript({ redacted: !!opts.redacted, stateRelay: !!opts.stateRelay });
  const inject = (): void => {
    if (win.isDestroyed()) { return; }
    const wc = win.webContents;
    wc.insertCSS(cursorStylesheet).catch(() => { /* renderer may be mid-navigation */ });
    wc.executeJavaScript(script, true).catch(() => { /* swallow — re-asserted on next focus */ });
  };

  win.webContents.on('did-finish-load', inject);
  win.webContents.on('focus', inject);
}

// ── The real-pointer cursor images (THE BEAD · the macOS rule-set redesign) ─────────────────────
// The OS pointer itself is styled `cursor: url(svg) x y, auto` — NO hiding. The 32px wheel
// triggered macOS's custom-cursor rule set (rendered huge + blurred with the fallback arrow
// composited over it — user Lambda). THE BEAD (user design): a SMALL (20px) circular bead —
// solid black, the state indicator WITHIN it — with a TAB pointing to the TOP-RIGHT corner
// (off-white fill · solid black outline · the hotspot at the tab tip) and the suite band ring
// AROUND the bead, drawn OVERLAPPING ON TOP of the tab. Visual weight deliberately stays LOW:
// the in-surface virtual cursor reads as the primary; the bead is the informative satellite.
const REAL_CURSOR_SIZE = 20;
// The ring center sits down-right of the hotspot so the bead body OVERLAPS the in-surface
// virtual arrow beneath it (the arrow also extends down-right from its tip) — the user's
// mockup correction: the prior top-right tab flipped the body AWAY from the virtual.
const BEAD_CX = 11;
const BEAD_CY = 11;
const RING_R = 7;
// The hotspot — the tab's tip at the TOP-LEFT corner (the standard pointing direction).
const HOTSPOT_X = 2;
const HOTSPOT_Y = 2;

// The band ring: 8 equal arcs in suite order around the bead. Static (a cursor image cannot
// animate). Painted LAST so it overlaps ON TOP of the tab where they cross (user spec).
function wheelRing(): string {
  const cx = BEAD_CX;
  const cy = BEAD_CY;
  const r = RING_R;
  const colors = [
    BAND_OBSIDIAN, BAND_MAROON, BAND_RUST, BAND_OCHRE,
    BAND_VIRIDIAN, BAND_COBALT, BAND_AMETHYST, BAND_ROSE,
  ];
  let segs = '';
  for (let i = 0; i < 8; i++) {
    const a0 = (i / 8) * 2 * Math.PI - Math.PI / 2;
    const a1 = ((i + 1) / 8) * 2 * Math.PI - Math.PI / 2;
    const x0 = (cx + r * Math.cos(a0)).toFixed(2);
    const y0 = (cy + r * Math.sin(a0)).toFixed(2);
    const x1 = (cx + r * Math.cos(a1)).toFixed(2);
    const y1 = (cy + r * Math.sin(a1)).toFixed(2);
    segs += `<path d="M ${x0} ${y0} A ${r} ${r} 0 0 1 ${x1} ${y1}" stroke="${colors[i]}" stroke-width="2.7" fill="none"/>`;
  }
  return segs;
}

// The state backing disc RESTORED (user) — WHITE: it appears ONLY when a cursor state is
// active, backing the suite-colored symbol in the open circle; the default center stays open.
function stateBackingDisc(): string {
  return (
    `<circle cx="${BEAD_CX}" cy="${BEAD_CY}" r="4.75" ` +
    `fill="rgb(255,255,255)" fill-opacity="0.95"/>`
  );
}

// The tab: points to the TOP-LEFT corner (the hotspot at its tip · the standard pointing
// direction) — off-white fill with a solid black outline (the macOS rule-set anchor).
// Anchored toward the ring; the band ring paints OVER it where they cross (user spec).
function beadTab(): string {
  // 30% value, saturation kept (user change 1): the off-white rgb(228,230,236) scaled to
  // V=0.3 with its tint proportions intact.
  return (
    `<path d="M${HOTSPOT_X} ${HOTSPOT_Y} L3.5 9.5 L9.5 3.5 Z" ` +
    `fill="none" stroke="rgb(8,8,10)" stroke-width="1.25" stroke-linejoin="round"/>`
  );
}

// The state indicator read IN THE OPEN CIRCLE: the shared suite-colored glyph at the ring center.
function stateWithinBead(glyphSvg: string): string {
  const s = 8;
  const x = BEAD_CX - s / 2;
  const y = BEAD_CY - s / 2;
  return `<svg x="${x}" y="${y}" width="${s}" height="${s}" viewBox="0 0 12 12">${stripSvgWrapper(glyphSvg)}</svg>`;
}

// Strip the outer <svg ...> ... </svg> wrapper, returning the inner markup (the icon factories
// return a full <svg>; for nesting inside the cursor SVG only the body is wanted).
function stripSvgWrapper(svg: string): string {
  const open = svg.indexOf('>');
  const close = svg.lastIndexOf('</svg>');
  if (open < 0 || close < 0) { return svg; }
  return svg.slice(open + 1, close);
}

// Build one full real-pointer image: the open center (default) anor the backing disc + the
// state glyph emitting into it → the tab → the band ring LAST (on top of the tab — user spec).
function realCursorSvg(state?: 'text' | 'pointer' | 'busy' | 'grab'): string {
  let glyph = '';
  if (state === 'text') { glyph = stateBackingDisc() + stateWithinBead(iconText()); }
  else if (state === 'pointer') { glyph = stateBackingDisc() + stateWithinBead(iconPointer()); }
  else if (state === 'busy') { glyph = stateBackingDisc() + stateWithinBead(iconBusy()); }
  else if (state === 'grab') { glyph = stateBackingDisc() + stateWithinBead(iconGrab()); }
  return (
    `<svg width="${REAL_CURSOR_SIZE}" height="${REAL_CURSOR_SIZE}" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">` +
    glyph +
    beadTab() +
    wheelRing() +
    '</svg>'
  );
}

// ── THE COMBINED CURSOR (the 'off' mode · user design) ─────────────────────────────────────────
// When no shader is selected there is no distortion and no in-surface virtual — the real OS
// pointer carries the FULL brand mark as one image: the white swept dart (the virtual's body,
// scaled to cursor size) with the suite band ring at its back, the states emitting into the
// ring's open center exactly as on the bead. 24px solid-bodied — inside the proven macOS rule
// set. Hotspot at the dart tip.
const COMBINED_SIZE = 24;
const COMBINED_DART = 'M2.5 2 Q3 9.5 6.5 16 L8.25 10.25 L14.5 8.5 Q9.5 3.75 2.5 2 Z';
const COMBINED_RING_CX = 16.5;
const COMBINED_RING_CY = 16.5;
const COMBINED_RING_R = 5.5;

function combinedRing(): string {
  const colors = [
    BAND_OBSIDIAN, BAND_MAROON, BAND_RUST, BAND_OCHRE,
    BAND_VIRIDIAN, BAND_COBALT, BAND_AMETHYST, BAND_ROSE,
  ];
  let segs = '';
  for (let i = 0; i < 8; i++) {
    const a0 = (i / 8) * 2 * Math.PI - Math.PI / 2;
    const a1 = ((i + 1) / 8) * 2 * Math.PI - Math.PI / 2;
    const x0 = (COMBINED_RING_CX + COMBINED_RING_R * Math.cos(a0)).toFixed(2);
    const y0 = (COMBINED_RING_CY + COMBINED_RING_R * Math.sin(a0)).toFixed(2);
    const x1 = (COMBINED_RING_CX + COMBINED_RING_R * Math.cos(a1)).toFixed(2);
    const y1 = (COMBINED_RING_CY + COMBINED_RING_R * Math.sin(a1)).toFixed(2);
    segs += `<path d="M ${x0} ${y0} A ${COMBINED_RING_R} ${COMBINED_RING_R} 0 0 1 ${x1} ${y1}" stroke="${colors[i]}" stroke-width="2.2" fill="none"/>`;
  }
  return segs;
}

function combinedCursorSvg(state?: 'text' | 'pointer' | 'busy' | 'grab'): string {
  let glyph = '';
  const s = 6.5;
  const gx = COMBINED_RING_CX - s / 2;
  const gy = COMBINED_RING_CY - s / 2;
  const glyphFor = (icon: string): string =>
    `<circle cx="${COMBINED_RING_CX}" cy="${COMBINED_RING_CY}" r="3.8" fill="rgb(255,255,255)" fill-opacity="0.95"/>` +
    `<svg x="${gx}" y="${gy}" width="${s}" height="${s}" viewBox="0 0 12 12">${stripSvgWrapper(icon)}</svg>`;
  if (state === 'text') { glyph = glyphFor(iconText()); }
  else if (state === 'pointer') { glyph = glyphFor(iconPointer()); }
  else if (state === 'busy') { glyph = glyphFor(iconBusy()); }
  else if (state === 'grab') { glyph = glyphFor(iconGrab()); }
  return (
    `<svg width="${COMBINED_SIZE}" height="${COMBINED_SIZE}" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">` +
    // The ring first — the dart rides OVER it where they cross (the dart leads here).
    combinedRing() +
    glyph +
    // The white swept dart — the virtual's body at cursor scale, the brand carried whole.
    `<path d="${COMBINED_DART}" fill="rgb(255,255,255)" stroke="${ARROW_EDGE}" stroke-width="0.9" stroke-linejoin="round"/>` +
    '</svg>'
  );
}

// Encode an SVG string as a `cursor: url(...)` data-URI (URL-encoded, not base64 — smaller for SVG).
function cursorDataUri(svg: string): string {
  const encoded = encodeURIComponent(svg).replace(/'/g, '%27').replace(/"/g, '%22');
  return `data:image/svg+xml,${encoded}`;
}

// The real-pointer CSS for one state. `combined` (the 'off' mode) swaps the bead for the full
// brand mark with the hotspot at the dart tip. `!important` + `*` wins every page-origin rule.
function realCursorRule(state?: 'text' | 'pointer' | 'busy' | 'grab', combined?: boolean): string {
  if (combined) {
    const uri = cursorDataUri(combinedCursorSvg(state));
    return `html, body, * { cursor: url("${uri}") 2 2, auto !important; }`;
  }
  const uri = cursorDataUri(realCursorSvg(state));
  return `html, body, * { cursor: url("${uri}") ${HOTSPOT_X} ${HOTSPOT_Y}, auto !important; }`;
}

export type RealCursorState = 'default' | 'text' | 'pointer' | 'busy' | 'grab';

// The script that installs / swaps the real-pointer style element. Idempotent: re-running with the
// same state is a no-op; a different state replaces the rule text. Guarded by a single <style> id.
function realCursorScript(state: RealCursorState, combined?: boolean): string {
  const rule = realCursorRule(state === 'default' ? undefined : state, combined);
  return `
(function () {
  var id = 'hf-real-cursor';
  var rule = ${JSON.stringify(rule)};
  var s = document.getElementById(id);
  if (!s) {
    s = document.createElement('style');
    s.id = id;
    (document.head || document.documentElement).appendChild(s);
  }
  if (s.textContent !== rule) { s.textContent = rule; }
})();
`;
}

// ── attachRealCursorStyle ──────────────────────────────────────────────────────────────────────
// Styles the OS pointer on a presenter / flat window as the Suite-Cascade wheel (default state),
// re-asserted on did-finish-load + focus (a navigation drops the injected <style>). Idempotent per
// window. The real pointer is NEVER hidden — this IS the pointer on these surfaces.
const realCursorWindows = new WeakSet<BrowserWindow>();
// The per-window cursor record: the state (from the relay) × the combined flag (the 'off'
// mode). Both setters update the record and re-apply — early calls before the page loads
// land in the record and the did-finish-load inject reads them.
const realCursorRecord = new WeakMap<BrowserWindow, { state: RealCursorState; combined: boolean }>();

function applyRealCursor(win: BrowserWindow): void {
  if (!win || win.isDestroyed()) { return; }
  const rec = realCursorRecord.get(win) ?? { state: 'default' as RealCursorState, combined: false };
  win.webContents
    .executeJavaScript(realCursorScript(rec.state, rec.combined), true)
    .catch(() => { /* renderer may be mid-navigation — re-asserted on next focus/swap */ });
}

export function attachRealCursorStyle(win: BrowserWindow): void {
  if (!win || win.isDestroyed()) { return; }
  if (realCursorWindows.has(win)) { return; }
  realCursorWindows.add(win);
  if (!realCursorRecord.has(win)) {
    realCursorRecord.set(win, { state: 'default', combined: false });
  }

  const inject = (): void => applyRealCursor(win);
  win.webContents.on('did-finish-load', inject);
  win.webContents.on('focus', inject);
}

// ── setRealCursorState ─────────────────────────────────────────────────────────────────────────
// Swap a presenter window's real-pointer image to a state (the style-swap). Idempotent + guarded.
export function setRealCursorState(win: BrowserWindow, state: RealCursorState): void {
  if (!win || win.isDestroyed()) { return; }
  const rec = realCursorRecord.get(win) ?? { state: 'default' as RealCursorState, combined: false };
  rec.state = state;
  realCursorRecord.set(win, rec);
  applyRealCursor(win);
}

// ── setRealCursorCombined ──────────────────────────────────────────────────────────────────────
// The 'off' mode (user design): no shader → no virtual → the real pointer carries the FULL brand
// mark (the dart + the suite ring as ONE image — the best placement, since 'off' has no
// distortion). Any shaded mode reverts to the bead. The record survives pre-load calls.
export function setRealCursorCombined(win: BrowserWindow, combined: boolean): void {
  if (!win || win.isDestroyed()) { return; }
  const rec = realCursorRecord.get(win) ?? { state: 'default' as RealCursorState, combined: false };
  rec.combined = combined;
  realCursorRecord.set(win, rec);
  applyRealCursor(win);
}

// ── wireCursorStateRelay ───────────────────────────────────────────────────────────────────────
// Bridge the offscreen overlay's state transitions to the presenter's real-pointer style-swap.
// The overlay (attachHiFiCursor with stateRelay:true) emits console.log('[hf-state]', next); main
// listens on the OFFSCREEN window's console-message and drives setRealCursorState on the PRESENTER.
const VALID_STATES: RealCursorState[] = ['default', 'text', 'pointer', 'busy', 'grab'];

export function wireCursorStateRelay(offscreenWin: BrowserWindow, presenterWin: BrowserWindow): void {
  if (!offscreenWin || offscreenWin.isDestroyed()) { return; }
  if (!presenterWin || presenterWin.isDestroyed()) { return; }
  offscreenWin.webContents.on('console-message', (_event, _level, message) => {
    const idx = message.indexOf('[hf-state]');
    if (idx < 0) { return; }
    const next = message.slice(idx + '[hf-state]'.length).trim();
    if ((VALID_STATES as string[]).includes(next)) {
      setRealCursorState(presenterWin, next as RealCursorState);
    }
  });
}

// THE NO-SHADER DISABLE (the final cursor Diamond): toggles the in-surface virtual pointer on
// a window. main calls this on every render-mode swap — 'off' (no shader · the raw
// pass-through) stands the virtual down; any shaded mode re-enables it. Guarded + fire-and-
// forget (the overlay may not be injected yet on early calls — the attach-time initial state
// covers the boot path).
export function setCursorOverlayEnabled(win: BrowserWindow, enabled: boolean): void {
  if (!win || win.isDestroyed()) { return; }
  win.webContents
    .executeJavaScript(
      `window.__scsCursorSetEnabled && window.__scsCursorSetEnabled(${enabled ? 'true' : 'false'});`,
      true,
    )
    .catch(() => { /* pre-injection anor mid-navigation — the next swap re-asserts */ });
}
