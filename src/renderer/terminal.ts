import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { WebLinksAddon } from '@xterm/addon-web-links';
import { Unicode11Addon } from '@xterm/addon-unicode11';
import { WebglAddon } from '@xterm/addon-webgl';
import '@xterm/xterm/css/xterm.css';
// SWRM · the window.scs ambient type lives in scsGlobal (one home · TS2717-safe). Type-only
// import — no runtime effect; the preload sets window.scs regardless.
import './scsGlobal';

function rlog(event: string, data?: Record<string, unknown>): void {
  try {
    window.scs?.log(event, data);
  } catch {
    /* swallow */
  }
}

rlog('terminal.module-load', { href: window.location.href, ua: navigator.userAgent.slice(0, 80) });

const terminal = new Terminal({
  fontFamily: "'FiraCode Nerd Font', ui-monospace, 'SF Mono', 'Cascadia Code', 'Menlo', monospace",
  fontSize: 14,
  lineHeight: 1.0,
  // OSR CURSOR LAW (C398) · blink OFF — blink is a timer-driven cosmetic and the timer is
  // exactly what stalls in a background-class offscreen renderer (parked in the hidden phase
  // = no cursor at idle; the C393 confirmation was activity resetting blink to SOLID). With
  // blink off the cursor path is PHASE-FREE: focused → steady block; unfocused →
  // cursorInactiveStyle block. No timer anywhere in the presence chain.
  cursorBlink: false,
  // OSR CURSOR LAW (C399 · THE OWN-DRAWN CURSOR) · xterm's cursor rendering was RETIRED on
  // this surface: C393 (inactive-style bypassed by the focus leg) → C398 (blink timer parked
  // by background-class throttling) → no presence at the prompt → the #scs-own-cursor DOM
  // layer became the sole presence (a steady CSS block, composited into the same OSR frame).
  // C692 AMENDMENT (WRA-DARK leg F) · the engine cursor is RESTORED as a WHITE UNDER-LAYER —
  // legs C (scroll-on-input) + D (dead-space pruner) now keep the viewport actively redrawn,
  // so the engine cursor tracks reliably again. The engine draws in the canvas/WebGL layer;
  // the HiFi #scs-own-cursor overlay (DOM · above the canvas) renders ON TOP of it when it
  // surfaces — the HiFi cursor is EASTER-EGG canon (C691): a delight when it appears, never a
  // forced presence. White block focused + block inactive = engine presence with or without
  // focus; the white block is the base presence everywhere else (scrollback · DECTCEM ·
  // pre-surface). Blink stays OFF (the C398 timer never un-parks under OSR).
  cursorInactiveStyle: 'block',
  allowTransparency: false,
  theme: {
    background: '#1a1a1a',
    foreground: '#e8e8e8',
    cursor: '#ffffff',
    cursorAccent: '#1a1a1a',
  },
  scrollback: 10000,
  allowProposedApi: true,
});

const fitAddon = new FitAddon();
terminal.loadAddon(fitAddon);
terminal.loadAddon(new WebLinksAddon());
const unicode11 = new Unicode11Addon();
terminal.loadAddon(unicode11);
terminal.unicode.activeVersion = '11';

const mount = document.getElementById('terminal');
if (!mount) {
  rlog('terminal.mount-missing', {});
  throw new Error('#terminal element not found');
}
terminal.open(mount);
// OSR CURSOR LAW (leg 2) · assert focus into the xterm textarea (input routing benefits);
// hasFocus is logged so the focus ground is never dark again. Presence no longer depends
// on it — the own-drawn cursor below is focus-independent by construction.
terminal.focus();
rlog('terminal.opened', {
  cols: terminal.cols,
  rows: terminal.rows,
  documentHasFocus: document.hasFocus(),
});

// C399 · THE OWN-DRAWN CURSOR (SB-DS6 class — the in-DOM replacement of an engine affordance
// dead under OSR). One steady block div, absolutely positioned over the cursor cell, appended
// INTO terminal.element (position:relative per xterm.css) so it composites into the same
// offscreen frame the presenter shades. NO timer, NO blink, NO focus state — position is
// recomputed on the terminal's own events (cursor move · render · resize · scroll), each of
// which fires on real content changes, so the layer can never park in a stale phase.
// rgba 0.8 keeps the glyph under the block legible (the block-cursor idiom without inversion).
// C400 · THE FULL SUITE CURSOR (Pewter Tessera formalization · StratiPUNK + texture).
// Token source: the design-system :root set (template SCP src/style.css:21-70) — read, never
// invented. The composition:
//   · The LADDER — the seven chromatic suites descend the block top→bottom (red → orange →
//     yellow → green → blue → purple → fuchsia) at 0.85 alpha: the full run present in every
//     cell, reading as a spectrum sheen at cursor scale, glyph legible beneath.
//   · The GROUND — base rgb(26,26,26) carries the frame's shadow side: the embossed inset
//     pair (light top/left · dark bottom/right, the system's one light source) seats the
//     block in pewter relief. All eight suites present: seven in the ladder, base in the
//     ground.
//   · The TEXTURE — a 4×4 diagonal hairline tile over the ladder: the pewter grain.
//   · The StratiPUNK cut — the top-right corner chamfered via clip-path (percent-based, so
//     the cut scales with the cell).
// Steady · event-positioned · no timer — the C399 presence law unchanged; only the face.
const OWN_CURSOR_TILE =
  'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'4\' height=\'4\'%3E%3Cpath d=\'M0 4L4 0\' stroke=\'rgba(255,255,255,0.22)\' stroke-width=\'0.5\'/%3E%3C/svg%3E")';
const OWN_CURSOR_LADDER =
  'linear-gradient(180deg,' +
  'rgba(239,68,68,0.85) 0%,rgba(249,115,22,0.85) 16%,rgba(234,179,8,0.85) 33%,' +
  'rgba(34,197,94,0.85) 50%,rgba(59,130,246,0.85) 67%,rgba(168,85,247,0.85) 84%,' +
  'rgba(236,72,153,0.85) 100%)';
const ownCursor = document.createElement('div');
ownCursor.id = 'scs-own-cursor';
ownCursor.setAttribute('aria-hidden', 'true');
ownCursor.style.cssText = [
  'position:absolute',
  'display:none',
  'pointer-events:none',
  'z-index:12',
  `background-image:${OWN_CURSOR_TILE},${OWN_CURSOR_LADDER}`,
  'background-size:4px 4px,100% 100%',
  'background-repeat:repeat,no-repeat',
  'clip-path:polygon(0 0,70% 0,100% 24%,100% 100%,0 100%)',
  'box-shadow:inset 1px 1px 0 rgba(232,232,232,0.35),inset -1px -1px 0 rgba(26,26,26,0.9)',
].join(';');
terminal.element?.appendChild(ownCursor);

function syncOwnCursor(): void {
  try {
    const host = terminal.element;
    const screen = host?.querySelector('.xterm-screen') as HTMLElement | null;
    if (!host || !screen) {
      ownCursor.style.display = 'none';
      return;
    }
    // DECTCEM · the app hid the cursor (spinners, some TUI redraws). No public API — the
    // guarded private read defaults VISIBLE when the internals shift (fail-open presence).
    const coreHidden =
      (terminal as unknown as { _core?: { coreService?: { isCursorHidden?: boolean } } })
        ._core?.coreService?.isCursorHidden === true;
    const buf = terminal.buffer.active;
    // C693 · THE SCROLL-OFFSET REVEAL (the super-narrow root). The cursor CELL is
    // buffer-absolute (baseY + cursorY); its viewport row under ANY scroll offset is that
    // minus viewportY. The old guard hid on ANY scroll (viewportY !== baseY) — which is
    // exactly why the cursor rendered at the live bottom but vanished on a one-line scroll
    // with NO entry: the cell was still on screen, we just refused to draw it. Hide only
    // when the cell actually leaves the viewport (deep scrollback), never on offset alone.
    const x = buf.cursorX;
    const viewRow = buf.baseY + buf.cursorY - buf.viewportY;
    if (coreHidden || x < 0 || x >= terminal.cols || viewRow < 0 || viewRow >= terminal.rows) {
      ownCursor.style.display = 'none';
      return;
    }
    const hostRect = host.getBoundingClientRect();
    const screenRect = screen.getBoundingClientRect();
    const cellW = screenRect.width / terminal.cols;
    const cellH = screenRect.height / terminal.rows;
    ownCursor.style.left = `${screenRect.left - hostRect.left + x * cellW}px`;
    ownCursor.style.top = `${screenRect.top - hostRect.top + viewRow * cellH}px`;
    ownCursor.style.width = `${Math.max(1, cellW)}px`;
    ownCursor.style.height = `${Math.max(1, cellH)}px`;
    ownCursor.style.display = 'block';
  } catch {
    ownCursor.style.display = 'none';
  }
}
terminal.onCursorMove(syncOwnCursor);
terminal.onRender(syncOwnCursor);
terminal.onResize(syncOwnCursor);
terminal.onScroll(syncOwnCursor);
syncOwnCursor();
rlog('terminal.own-cursor-armed', {});

// SWRM · MD-5 Wound A (COPY) · expose the xterm selection to main. The `terminal` instance lives in
// this OFFSCREEN renderer and is unreachable from main via any existing channel; main reads it with
// executeJavaScript('window.__scsGetSelection()') on this webContents when the presenter's Cmd+C
// fires. Double-underscore = internal convention; returns '' when there is no selection.
(window as unknown as { __scsGetSelection?: () => string }).__scsGetSelection = () =>
  terminal.getSelection();

// PASTE LEG · the inverse twin of __scsGetSelection. main delivers clipboard/drop text here via
// executeJavaScript; terminal.paste() routes it through xterm's paste path — bracketed-paste
// wrapping (ESC[200~/201~) fires exactly when the running app enabled mode 2004 (vim, CC), so a
// multiline paste arrives as ONE paste, never a stream of Enter-firing char events. Feeds the
// same onData → PTY stream as typing, one layer up. Returns the length as the delivery receipt.
(window as unknown as { __scsPaste?: (text: string) => number }).__scsPaste = (text: string) => {
  if (typeof text !== 'string' || text.length === 0) return 0;
  terminal.paste(text);
  rlog('terminal.paste-delivered', { chars: text.length });
  return text.length;
};

// WRA-DARK · leg A · the scroll-recover cure. MAIN detects a completely-dark offscreen render (it
// holds the frame) and calls this via executeJavaScript. Scrolling the viewport up a tad then back
// to the bottom forces xterm to re-rasterize the viewport rows → a fresh paint that resolves the
// dark render (the user's empirical cure · replaces the resize search · no geometry change). The
// up and the back-to-bottom run in SEPARATE frames so each triggers its OWN raster (a same-tick
// up+down nets to zero and may skip the redraw). Re-syncs the own-drawn cursor after the move.
// Returns the row count scrolled as the delivery receipt.
(window as unknown as { __scsScrollRecover?: (lines?: number) => number }).__scsScrollRecover = (
  lines = 3,
) => {
  const n = Math.max(1, Math.floor(lines));
  terminal.scrollLines(-n); // up a tad (into scrollback) — renders the up state
  setTimeout(() => {
    terminal.scrollToBottom(); // back down to the bottom (baseY) — the raster that reveals content
    syncOwnCursor();
  }, 32);
  rlog('terminal.scroll-recover', { lines: n });
  return n;
};

// WRA-DARK · leg D · THE DEAD-SPACE PRUNER (the retained-textarea offset). Claude Code's
// auto-expanding input pushes lines into scrollback as it grows (baseY rises); deleting the text
// shrinks CC's UI but a terminal CANNOT unscroll — the rows the textarea occupied remain in the
// viewport as a BLANK band below CC's redrawn (now higher) UI. That retained band is the offset
// that strands the cursor mid-screen; the field proof of the cure was a WINDOW resize (xterm's
// resize reflow trims blank bottom rows and pulls real lines back from scrollback). The pruner IS
// that reflow, self-triggered from in here: when the anomaly signature is STABLE (bottom rows
// blank · scrollback present · normal buffer · viewport at the live bottom), jiggle terminal.rows
// down by the blank count and back — the shrink POPS the below-cursor blank band (xterm
// Buffer.resize pops lines below the cursor on row-shrink), the grow PULLS real lines back from
// scrollback (ybase--) — the dead band is replaced by history and the cursor lands back near page
// end. Each leg fires resize→PTY→SIGWINCH→CC repaint (the WRA-proven class). Debounced +
// two-sighting stability gate + cooldown so we never fight a live CC redraw.
const PRUNE_MIN_BLANK_ROWS = 3;
const PRUNE_STABLE_MS = 350;
const PRUNE_COOLDOWN_MS = 2000;
const PRUNE_JIGGLE_SETTLE_MS = 90;
let pruneTimer: ReturnType<typeof setTimeout> | null = null;
let pruneLastSignature = '';
let pruneInFlight = false;
let pruneCooldownUntil = 0;

function bottomBlankRows(): number {
  const buf = terminal.buffer.active;
  let blanks = 0;
  for (let row = terminal.rows - 1; row >= 0; row--) {
    const line = buf.getLine(buf.viewportY + row);
    if (line && line.translateToString(true).length > 0) break;
    blanks += 1;
  }
  return blanks;
}

function deadSpaceCheck(): void {
  if (pruneInFlight || Date.now() < pruneCooldownUntil) return;
  const buf = terminal.buffer.active;
  if (buf.type !== 'normal') return; // alt-screen apps own their whole layout — never prune
  if (buf.viewportY !== buf.baseY) return; // only at the live bottom (user not reading history)
  if (buf.baseY <= 0) return; // nothing in scrollback to reclaim — a short screen is just short
  const blanks = bottomBlankRows();
  if (blanks < PRUNE_MIN_BLANK_ROWS || buf.cursorY >= terminal.rows - blanks) {
    pruneLastSignature = '';
    return;
  }
  const signature = `${buf.baseY}:${buf.cursorY}:${blanks}`;
  if (signature !== pruneLastSignature) {
    // first sighting — self-schedule the confirming look (renders may have gone quiet) and only
    // prune when the SAME state holds across both (CC not mid-redraw)
    pruneLastSignature = signature;
    if (pruneTimer) clearTimeout(pruneTimer);
    pruneTimer = setTimeout(deadSpaceCheck, PRUNE_STABLE_MS);
    return;
  }
  pruneLastSignature = '';
  const k = Math.min(blanks, buf.baseY, Math.floor(terminal.rows / 2));
  if (k < 1) return;
  pruneInFlight = true;
  pruneCooldownUntil = Date.now() + PRUNE_COOLDOWN_MS;
  const cols = terminal.cols;
  const rows = terminal.rows;
  rlog('terminal.deadspace-prune', { k, blanks, baseY: buf.baseY, cursorY: buf.cursorY });
  try {
    terminal.resize(cols, rows - k); // pops the below-cursor blank band
  } catch (err) {
    rlog('terminal.deadspace-prune-FAIL', { error: String(err) });
    pruneInFlight = false;
    return;
  }
  setTimeout(() => {
    try {
      terminal.resize(cols, rows); // pulls k real lines back from scrollback
      terminal.scrollToBottom();
      syncOwnCursor();
      rlog('terminal.deadspace-pruned', { k });
    } catch (err) {
      rlog('terminal.deadspace-prune-restore-FAIL', { error: String(err) });
    }
    pruneInFlight = false;
  }, PRUNE_JIGGLE_SETTLE_MS);
}

function scheduleDeadSpaceCheck(): void {
  if (pruneTimer) clearTimeout(pruneTimer);
  pruneTimer = setTimeout(deadSpaceCheck, PRUNE_STABLE_MS);
}
terminal.onRender(scheduleDeadSpaceCheck);
terminal.onCursorMove(scheduleDeadSpaceCheck);
rlog('terminal.deadspace-pruner-armed', {});

try {
  const webglAddon = new WebglAddon();
  webglAddon.onContextLoss(() => {
    rlog('terminal.webgl-context-loss', {});
    webglAddon.dispose();
    void import('@xterm/addon-canvas')
      .then(({ CanvasAddon }) => {
        terminal.loadAddon(new CanvasAddon());
        rlog('terminal.canvas-fallback-loaded', {});
      })
      .catch((err) => {
        rlog('terminal.canvas-fallback-FAIL', { error: String(err) });
      });
  });
  terminal.loadAddon(webglAddon);
  rlog('terminal.webgl-loaded', {});
} catch (err) {
  rlog('terminal.webgl-load-FAIL', { error: String(err) });
  void import('@xterm/addon-canvas')
    .then(({ CanvasAddon }) => {
      terminal.loadAddon(new CanvasAddon());
      rlog('terminal.canvas-loaded-after-webgl-fail', {});
    })
    .catch((canvasErr) => {
      rlog('terminal.canvas-load-FAIL', { error: String(canvasErr) });
    });
}

function safeFit() {
  try {
    fitAddon.fit();
    rlog('terminal.fit-ok', { cols: terminal.cols, rows: terminal.rows });
  } catch (err) {
    rlog('terminal.fit-FAIL', { error: String(err) });
    console.error('[renderer] fit failed:', err);
  }
  // OSR CURSOR PERSISTENCE (WRA-DARK · leg B) · a window resize — the WRA grow/restore, the
  // dark-recovery search, or a user drag — reflows the cursor cell and can leave the own-drawn
  // #scs-own-cursor stranded off-viewport, or positioned against a STALE screen rect measured
  // mid-reflow. onResize only fires when cols/rows CHANGE, so a pixel-only resize refreshes
  // nothing. Re-place the cursor on the NEXT frame (post-layout) so it stays PERSISTENT across
  // every resize.
  requestAnimationFrame(syncOwnCursor);
}

safeFit();
window.addEventListener('resize', safeFit);

let activePort: MessagePort | null = null;
let portDataByteCount = 0;
let firstDataLogged = false;
// DM-D4 P2 · onData re-arm count · increments each attachPort run (= each port
// attach for this window). Reveals whether the send-pump was (re-)bound on the
// ReEngaged re-attach. attachCount > 1 on a ReEngaged window = re-attach happened.
let attachCount = 0;
// DM-D4 P3 · receipt-count side of the inject==receipt==echo reconciliation Concluder.
// Increments in the terminal.onData send handler; MAIN logs injectCount in
// messageDispatch.reconcile; the Concluder reconciles MAIN injectCount vs RENDERER
// userInputCount across the unified electron-debug.json.
let userInputCount = 0;
// DM-D4 Cure A · the live onData disposable. Disposed before each re-register so the
// send-pump is bound ONCE to the LIVE port (idempotent re-arm). xterm onData is an
// additive IEvent — re-registering without dispose accumulates duplicate listeners.
let onDataDisposable: { dispose(): void } | null = null;

function attachPort(port: MessagePort, sessionId: string) {
  attachCount += 1;
  rlog('terminal.attach-port', { sessionId });
  activePort = port;
  port.onmessage = (event) => {
    const data = event.data;
    // DM-D4 P1 · Layer-1 pong arm · main posts {type:'scs:ping', nonce}; echo
    // {type:'scs:pong', nonce} back over the SAME port. Do NOT write to the terminal.
    if (data && typeof data === 'object' && (data as { type?: string }).type === 'scs:ping') {
      const nonce = (data as { nonce?: number }).nonce;
      rlog('terminal.ping-received', { sessionId, nonce });
      // DM-D4 Focus-Cure Layer 3 (OPERATIVE) · per-send deterministic textarea focus.
      // RM-D1 · MAIN awaits pingChannel() in messageDispatch.ts at SFORDS step 3 — AFTER
      // the window-focus block (show/focus/webContents.focus/moveTop) + before the char
      // stream — so focusing the helper-textarea HERE, before posting the pong, means
      // that by the time the awaited ping resolves on MAIN and proceeds to the stream,
      // the textarea is the focused DOM element inside an OS-active window. The pong now confirms BOTH channel-
      // liveness AND focus-established: a deterministic round-trip, NOT a fixed-delay
      // setTimeout (honors the PFSD lesson). Focus can be lost BETWEEN sends (S4 found
      // sends 4 AND 5 dropped on the same window), so Layer 2's on-attach focus is
      // insufficient alone — this re-establishes focus on EVERY send.
      try {
        terminal.focus();
        rlog('terminal.focused-on-ping', { sessionId, nonce });
      } catch {
        /* swallow */
      }
      try {
        port.postMessage({ type: 'scs:pong', nonce });
      } catch {
        /* swallow */
      }
      return;
    }
    if (typeof data === 'string') {
      portDataByteCount += data.length;
      if (!firstDataLogged) {
        firstDataLogged = true;
        rlog('terminal.port-data-first', { bytes: data.length, preview: data.slice(0, 60) });
      } else if (portDataByteCount % 1000 < data.length) {
        rlog('terminal.port-data-tick', { totalBytes: portDataByteCount });
      }
      terminal.write(data);
    } else if (data instanceof Uint8Array) {
      portDataByteCount += data.byteLength;
      if (!firstDataLogged) {
        firstDataLogged = true;
        rlog('terminal.port-data-first-binary', { bytes: data.byteLength });
      }
      terminal.write(data);
    } else {
      rlog('terminal.port-data-UNKNOWN-TYPE', { typeOf: typeof data });
    }
  };
  // DM-D4 Cure A · re-arm the send-pump idempotently on EVERY attach-port. xterm
  // terminal.onData is an additive IEvent — re-registering on a ReEngaged re-attach
  // without disposing the prior listener accumulates duplicate onData closures. Dispose
  // the prior disposable first, then re-register bound to the LIVE module-level
  // activePort (reassigned above). This guarantees exactly one send-pump bound to the
  // live port on every (re-)attach. P2 emits onData-armed with attachCount so the
  // re-arm is Concluder-observable on disk.
  if (onDataDisposable) {
    try {
      onDataDisposable.dispose();
    } catch {
      /* swallow */
    }
    onDataDisposable = null;
  }
  onDataDisposable = terminal.onData((data) => {
    userInputCount += 1;
    rlog('terminal.user-input', { bytes: data.length, userInputCount });
    if (activePort) {
      activePort.postMessage(data);
    } else {
      rlog('terminal.user-input-DROPPED', { reason: 'activePort-null', bytes: data.length });
    }
    // OSR CURSOR (WRA-DARK · leg C) · each keypress auto-refreshes the own-drawn cursor location.
    // buffer.cursorY is relative to baseY, so working in the auto-expanding input while scrolled up
    // a tad drops the cursor cell below the viewport — and cursor movement alone never brought it
    // back (only a manual scroll-down did). Bringing the active line into view on input (the
    // standard scroll-on-input behaviour the OSR path was missing) fires onScroll → syncOwnCursor;
    // the explicit sync also covers the already-at-bottom case (scrollToBottom is then a no-op that
    // emits no onScroll).
    terminal.scrollToBottom();
    syncOwnCursor();
  });
  rlog('terminal.onData-armed', { sessionId, attachCount });
  // DM-D4 Focus-Cure Layer 2 · restore xterm helper-textarea focus on EVERY (re-)attach.
  // terminal.open() auto-focuses the textarea ONCE at fresh mount; a ReEngaged re-attach
  // re-arms onData (Cure A above) but never re-focuses the textarea, so synthetic chars
  // have no target. terminal.focus() replicates the manual entry at attach time, making
  // the ReEngaged window symmetric with a fresh open. Layer 3 (per-send via pong) covers
  // focus lost BETWEEN sends; this covers the structural re-attach case.
  try {
    terminal.focus();
    rlog('terminal.focused-on-attach', { sessionId, attachCount });
  } catch {
    /* swallow */
  }
  terminal.onResize(({ cols, rows }) => {
    rlog('terminal.resize', { cols, rows });
    if (activePort) {
      activePort.postMessage({ type: 'resize', cols, rows });
    }
  });
  port.start?.();
  rlog('terminal.port-started', { sessionId });
  safeFit();
}

// PMPH · Preload-Mediated-Port-Handshake · canonical receive side.
// Preload forwards the MessagePort via window.postMessage with the transfer
// list set — this is the only Electron pattern that preserves MessagePort
// functionality across contextIsolation. Listening via addEventListener
// captures `event.ports[0]` correctly (unlike a contextBridge callback,
// which wraps the port as a phantom proxy without working onmessage).
if (window.scs) {
  rlog('terminal.scs-preload-present', { platform: window.scs.platform });
} else {
  rlog('terminal.scs-preload-MISSING', {});
  console.error('[renderer] window.scs preload API missing');
}

// D-GTC S5 · THE SHUTTING-DOWN OVERLAY (shader-OFF twin of the presenter overlay). When shader
// wrap is disabled this terminal window is the visible surface, so it must paint the notice too.
let shuttingDownShown = false;
function showShuttingDown(): void {
  if (shuttingDownShown) return;
  shuttingDownShown = true;
  const el = document.createElement('div');
  el.id = 'scs-shutting-down-overlay';
  el.setAttribute('aria-hidden', 'true');
  el.style.cssText = [
    'position:fixed', 'inset:0', 'display:flex', 'z-index:10000',
    'align-items:center', 'justify-content:center', 'pointer-events:none',
    'background:rgba(6,8,10,0.82)',
  ].join(';');
  const label = document.createElement('span');
  label.style.cssText = [
    "font-family:ui-monospace,'SF Mono','Menlo',monospace", 'font-size:15px', 'font-weight:700',
    'letter-spacing:0.1em', 'text-transform:uppercase', 'color:rgba(180,200,220,0.95)',
    'text-shadow:0 0 10px rgba(120,150,190,0.5)', 'padding:0.6rem 1.2rem',
  ].join(';');
  label.textContent = 'Shutting Down… flushing session';
  el.appendChild(label);
  document.body.appendChild(el);
}
window.scs?.onShuttingDown?.(() => showShuttingDown());

// D-UP4 · the Stand By overlay lives in the PRESENTER ONLY (the resolver's specific spawn
// pathing always runs under the default shader-wrap — the presenter is its visible surface).
// The shader-OFF terminal twin was RETIRED: the offscreen xterm surface carries NO overlay
// code so the terminal draw is never interacted with.

window.addEventListener('message', (event: MessageEvent) => {
  const data = event.data as { type?: string; sessionId?: string } | undefined;
  if (data?.type !== 'scs:port') return;
  const port = event.ports[0];
  if (!port) {
    rlog('terminal.window-message-no-port', { sessionId: data.sessionId });
    return;
  }
  rlog('terminal.window-message-port-received', { sessionId: data.sessionId });
  attachPort(port, data.sessionId ?? 'unknown');
});
rlog('terminal.window-message-listener-registered', {});
