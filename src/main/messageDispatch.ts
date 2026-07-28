// src/main/messageDispatch.ts · D3 FKIS · Focused-Keyed-Input-Streaming
//
// Composes FORF (Focus-In-Stream-Focus-Return-Out) as a single Lambda-event-
// producing primitive. Single call site for TUI + MCP + Vue per D3D-SFA. Per-
// Session FIFO chain (F3 closure) serializes concurrent sends to the same
// target ULID. Disposal-aware guards (F4 + F5) re-check liveness between chars.
//
// Citation: D3 FKIS Stage 2 · S3 Ochre Blueprint §B · S6 Amethyst W2 spec
// Patterns: FBP · CSDF · OSRR · FORF · SBOR · EVRC · ZIDC

import type { BrowserWindow } from 'electron';
import { sessionRegistry } from './session-registry';
import { getVisibleUrlWindow, listUrlWindows } from './electronWindow';
import { readBridgeMetadata, bridgeMetadataPathPerProject } from '../lib/bridge/bridgeMetadata';
import { sdia } from './diagnostics';

// SBOR · S2 pattern · the message envelope shape
export interface FkisEnvelope {
  targetUlid: string;
  text: string;
  originScpName: string;
  // C768 · THE FOCUS DISCIPLINE — `In Focus` (true): the terminal KEEPS focus; the final
  // Focus-Return-Out to the origin SCP is SUPPRESSED (Ask Me + SCS:In-Focus rows).
  // Absent/false = `Pass Through`: traditional background messaging; the refocus occurs.
  inFocus?: boolean;
}

export interface FkisResult {
  ok: boolean;
  error?: string;
  charsStreamed?: number;
}

// DM-D4 W1 (Ochre-E §B.5) · isReEngaged discriminator for FDIA-Plus grain.
// Reads the MAIN-side Session.wasResumed flag (set by cli-handler on resume path).
// Wave-1 does NOT block on this — zero-cost fields (isFocused/windowId/webContentsId/
// focusInConfirmedDeltaMs) directly discriminate the fresh-vs-ReEngaged differential.
function deriveIsReEngaged(targetUlid: string): boolean {
  const session = sessionRegistry.get(targetUlid);
  return session?.isReEngaged() ?? false;
}

// F3 · per-Session FIFO chain. Modeled on registry.ts chainWrite mutex pattern.
// Each targetUlid has its own Promise chain. Sends to different targets run
// concurrently; sends to the same target serialize in arrival order. Prior
// failure does NOT poison the chain (per registry.ts:28 .catch pattern).
const sendChains = new Map<string, Promise<FkisResult>>();

// RM-D1 · awaitable delay primitive. All SFORDS staggers (DWTFS rungs + IBRG)
// are awaited INSIDE executeFkisLocked so the per-ULID FIFO critical section
// owns the timing — no delay bleeds into the sendChains coordination layer.
const sleep = (ms: number): Promise<void> => new Promise<void>((r) => setTimeout(r, ms));

export function executeFkis(envelope: FkisEnvelope): Promise<FkisResult> {
  const { targetUlid } = envelope;

  const priorTail = sendChains.get(targetUlid) ?? Promise.resolve({ ok: true } as FkisResult);
  const nextTail: Promise<FkisResult> = priorTail.then(
    () => executeFkisLocked(envelope),
    () => executeFkisLocked(envelope),
  );
  sendChains.set(targetUlid, nextTail);

  nextTail.finally(() => {
    if (sendChains.get(targetUlid) === nextTail) {
      sendChains.delete(targetUlid);
    }
  });

  return nextTail;
}

async function executeFkisLocked(envelope: FkisEnvelope): Promise<FkisResult> {
  const { targetUlid, originScpName } = envelope;
  // RM-D1 SDRD mitigation (R4 Risk 2) + RM-D1.1 leading-pad trim · .trim() removes
  // BOTH leading whitespace (live-Lambda: padding appeared before the first char) AND
  // any trailing CR/LF so the distinct step-7 Return stays the ONLY submit (no
  // double-submit). Interior whitespace / multi-line bodies are preserved — trim only
  // affects the leading + trailing edges.
  const text = envelope.text.trim();

  sdia('fkis.execute.start', { targetUlid, originScpName, textLength: text.length }, 'fkis');

  // (1) Resolve target Session — disposal guard
  const targetSession = sessionRegistry.get(targetUlid);
  if (!targetSession) {
    sdia('fkis.execute.target-MISSING', { targetUlid }, 'fkis');
    sdia('fkis.target.not-found', { targetUlid });
    return { ok: false, error: 'target session not found: ' + targetUlid };
  }
  if (!targetSession.isAlive()) {
    sdia('fkis.target.not-alive', { targetUlid });
    return { ok: false, error: 'target session not alive: ' + targetUlid };
  }
  const targetWindow = targetSession.getWindow();
  if (!targetWindow || targetWindow.isDestroyed()) {
    sdia('fkis.target.window-destroyed', { targetUlid });
    return { ok: false, error: 'target window destroyed' };
  }
  // SWRM · the OS-window ops (show/focus/moveTop) must target the VISIBLE window — the presenter when
  // shader-wrapped (targetWindow = getWindow() is then the OFFSCREEN source, which renders Electron's
  // "No content under offscreen mode" placeholder if shown directly). visibleWindow() === getWindow()
  // for non-shader sessions (zero change). The input ops (webContents.focus + sendInputEvent) stay on
  // the offscreen source (targetWindow) where xterm's DOM lives.
  const targetVisible = targetSession.visibleWindow() ?? targetWindow;

  sdia('fkis.execute.target-resolved', { targetUlid, windowId: targetWindow.id }, 'fkis');

  // RM-D1 · pingChannel() NO LONGER fires here (was at the pre-focus position). It is
  // relocated to SFORDS step 3 — AFTER the window-focus block — so the renderer-side
  // terminal.focus() lands in an OS-active window. See the SFORDS STEP 3 block below.

  // (2) Resolve origin window — OCMD-safe: continue on failure (no focus-restore)
  const originWindow = await resolveOriginWindow(originScpName);
  if (!originWindow) {
    sdia('fkis.execute.origin-MISSING', { originScpName }, 'fkis');
    sdia('fkis.origin.not-found', { originScpName });
  } else {
    sdia('fkis.execute.origin-resolved', { originScpName, windowId: originWindow.id }, 'fkis');
  }

  // (3) FORF Step 1 · Focus-In · F1 closure: 3-step EWHM pattern
  sdia('fkis.execute.focus-in-attempt', {
    targetUlid,
    windowId: targetWindow.id,
    isFocusedBefore: targetWindow.isFocused(),
  }, 'fkis');
  targetVisible.show();
  targetVisible.focus();
  // DM-D4 Focus-Cure Layer 1 · MAIN webContents DOM-focus. targetVisible.focus()
  // (BrowserWindow.focus) focuses the OS window chrome ONLY; webContents.focus()
  // focuses the renderer DOM so the synthetic sendInputEvent({type:'char'}) has a
  // focused document to land on (the window-vs-DOM gap from the S4 audit Angle 3).
  // This is the OS-window→web-contents layer; Layer 2/3 supply the textarea layer.
  // SWRM: webContents.focus stays on the OFFSCREEN source (targetWindow) — that is where xterm's DOM is.
  targetWindow.webContents.focus();
  targetVisible.moveTop();
  // DM-D4 W1 (Ochre-E §B.4) · pin timestamp for focusInConfirmedDeltaMs at return-attempt
  const focusInConfirmedTs = Date.now();
  sdia('fkis.execute.focus-in-confirmed', {
    targetUlid,
    windowId: targetWindow.id,
    isFocused: targetWindow.isFocused(),
    ts: focusInConfirmedTs,
  }, 'fkis');

  // ── SFORDS STEP 2 · DWTFS rung 1 (DELTA 2) · OS window-activation settle ──
  await sleep(10);

  // ── SFORDS STEP 3 · Focus Terminal via ping (DELTA 1 · MOVED from pre-focus) ──
  // DM-D4 P1 · Layer-1 Connection-Liveness Concluder. pingChannel() round-trips
  // {scs:ping}→{scs:pong} over the live mainPort and logs fkis.ping.roundtrip {ok, ms}.
  // It MEASURES the renderer→main return leg (channel live) independent of
  // fkis.execute.complete ok:true (the inject-call false-positive). It now fires AFTER
  // the window-focus block, so the renderer terminal.focus() (terminal.ts:136) lands in
  // an OS-active window; the pong confirms channel-liveness AND textarea-focus.
  //
  // PRIME-STALL FIX A · BOUNDED READINESS POLL (the cold-spawn guard). Prior code
  // DISCARDED this boolean — a just-spawned anchor that flipped status='launched' on its
  // first PTY boot byte (session.ts PDFL) but whose xterm renderer channel was not yet
  // live would silently swallow the streamed chars. Now we HONOR the pong: retry every
  // ~250ms up to a ~5000ms budget and proceed to the stream ONLY once it returns ready.
  // WARM anchor short-circuit: the FIRST ping returns ready immediately → ZERO added
  // latency (the existing live-Lambda send path is unchanged). COLD anchor: we wait for
  // the renderer channel to come live before injecting. If readiness never confirms in
  // budget we DROP THROUGH to the reconcile-gated stream and report ok:false below
  // (never a silent ok:true into the void).
  const READINESS_PING_INTERVAL_MS = 250;
  const READINESS_PING_BUDGET_MS = 5000;
  let channelReady = false;
  {
    const readinessDeadline = Date.now() + READINESS_PING_BUDGET_MS;
    // First attempt is immediate — warm anchors confirm here with no added latency.
    channelReady = await targetSession.pingChannel();
    while (!channelReady && Date.now() < readinessDeadline) {
      if (targetWindow.isDestroyed() || !targetSession.isAlive()) {
        sdia('fkis.readiness.target-died-during-poll', { targetUlid }, 'fkis');
        return { ok: false, error: 'target died during readiness poll', charsStreamed: 0 };
      }
      await sleep(READINESS_PING_INTERVAL_MS);
      channelReady = await targetSession.pingChannel();
    }
    sdia('fkis.readiness.poll-result', {
      targetUlid,
      channelReady,
      budgetMs: READINESS_PING_BUDGET_MS,
    }, 'fkis');
  }

  // ── SFORDS STEP 4 · THE TEXTAREA-FOCUS CONCLUDER (C402 — the blind settle retired) ──
  // The 100ms flat settle (RM-D1.1) regressed: the "Please Stand"→"se Stand" trim returned
  // WITH the settle in place — injectCount proved all chars left main; the leading 4 were
  // swallowed renderer-side inside the settle window. The C398 law applied: deterministic
  // state-check over blind timer. One executeJavaScript per attempt FOCUSES xterm's helper
  // textarea and RETURNS whether it is the active element — the warm path confirms on the
  // first round-trip (faster than the flat 100ms); a cold renderer retries to a bounded
  // budget. Never-confirms → proceed + the named telemetry (never a silent trim).
  const TEXTAREA_FOCUS_INTERVAL_MS = 50;
  const TEXTAREA_FOCUS_BUDGET_MS = 1500;
  let textareaFocused = false;
  {
    const textareaDeadline = Date.now() + TEXTAREA_FOCUS_BUDGET_MS;
    const focusProbeJs =
      "(() => { const t = document.querySelector('.xterm-helper-textarea');" +
      ' if (t && document.activeElement !== t) t.focus();' +
      ' return !!t && document.activeElement === t; })()';
    while (Date.now() < textareaDeadline) {
      if (targetWindow.isDestroyed() || !targetSession.isAlive()) {
        sdia('fkis.textarea-focus.target-died', { targetUlid }, 'fkis');
        return { ok: false, error: 'target died during textarea-focus poll', charsStreamed: 0 };
      }
      try {
        textareaFocused =
          (await targetWindow.webContents.executeJavaScript(focusProbeJs)) === true;
      } catch {
        textareaFocused = false;
      }
      if (textareaFocused) break;
      await sleep(TEXTAREA_FOCUS_INTERVAL_MS);
    }
    sdia('fkis.textarea-focus.poll-result', {
      targetUlid,
      textareaFocused,
      budgetMs: TEXTAREA_FOCUS_BUDGET_MS,
    }, 'fkis');
  }
  // A short post-confirm grace — the focus event handlers settle before the first char.
  await sleep(30);

  // (4) FORF Step 2a · CSDF body stream · honors FBP · F4/F5 between-char guards
  //
  // C282 · SIMD Station 3 · THE PACED CHUNK STREAM (the 077 resolver truncation root):
  // the prior zero-pause per-char burst saturated Chromium's input-event queue on
  // multi-KB directives — back pressure silently dropped TAIL chars mid-stream and the
  // CR then submitted a truncated buffer. sendInputEvent is fire-and-forget (no ack,
  // no echo channel on mainPort) — the deterministic cure is chunked delivery with an
  // inter-chunk yield so the renderer queue drains. 50-char chunks; pause scaled by
  // total size (SIMD-RD · S2/S4/S6 ground, Cycle 282).
  sdia('fkis.execute.stream-start', { targetUlid, textLength: text.length }, 'fkis');
  const SIMD_CHUNK = 50;
  const interChunkPause = text.length >= 400 ? 25 : 15;
  let charsStreamed = 0;
  let streamIndex = 0;
  while (streamIndex < text.length) {
    const slice = text.slice(streamIndex, streamIndex + SIMD_CHUNK);
    for (const ch of slice) {
      if (targetWindow.isDestroyed()) {
        sdia('fkis.stream.window-destroyed-midstream', { targetUlid, charsStreamed });
        return { ok: false, error: 'window destroyed mid-stream', charsStreamed };
      }
      if (!targetSession.isAlive()) {
        sdia('fkis.stream.session-died-midstream', { targetUlid, charsStreamed });
        return { ok: false, error: 'session died mid-stream', charsStreamed };
      }
      targetSession.sendInputViaKeystroke(ch);
      charsStreamed += 1;
    }
    streamIndex += slice.length;
    if (charsStreamed % 50 === 0) {
      sdia('fkis.execute.char-tick', { targetUlid, charsStreamed }, 'fkis');
    }
    // The SIMD yield — lets the Chromium input-event queue drain before the next chunk.
    if (streamIndex < text.length) {
      await sleep(interChunkPause);
    }
  }

  // ── SFORDS STEP 6 · IBRG buffer-registration gap (DELTA 3) ──
  // NEW gap placed AFTER the stream loop and BEFORE the distinct '\r'. Lets the full
  // char sequence register in xterm's input buffer / PTY write pipeline as one unit so
  // the submit '\r' does not overtake the last streamed char. DISTINCT from — and
  // upstream of — the post-'\r' 50ms reconcile settle at the reconcile Concluder below.
  //
  // C282 · THE BUFFERED-DIRECTIVE FIX (the 077 resolver spawn finding): a LONG directive
  // (the Vermillion spawn class · multi-KB) streams as a rapid char burst the target TUI
  // coalesces as a PASTE; a CR arriving inside the paste-coalescing window is inserted as
  // a literal NEWLINE instead of a submit — the directive sits fully typed in the input,
  // unsent (-- INSERT --). Idle long enough for paste-mode to CLOSE before the submit CR.
  // Chat-sized sends keep the proven 30ms. SIMD Station 4: PROPORTIONAL to size (the flat
  // 400ms proved short for multi-KB payloads) — len/20 ms, floored 400, capped 800.
  await sleep(
    text.length > 400 ? Math.min(800, Math.max(400, Math.ceil(text.length / 20))) : 30,
  );

  // (5) FORF Step 2b · F2 closure · char-CR submit (0x0D via the char-event channel)
  // The char-event CR ('\r' = 0x0D) is the canonical cross-platform xterm.js submit:
  // it reuses the SAME proven channel the body chars stream through
  // (sendInputViaKeystroke → sendInputEvent({type:'char', keyCode:ch})), so the submit
  // byte is the literal CR xterm.js's onData waits for, layout/keymap-independent.
  // The prior keyDown:'Return' keyName path was platform-fragile (Electron #24279:
  // synthetic keyName Enter/Return resolves unreliably across darwin/win/linux);
  // codebase precedent cli-handler.ts:355-359 mapKey already maps enter/return → '\r'.
  //
  // DM-D4 W1 (Ochre-E §B.2/§B.4) · FDIA-Plus grain enhancement (INSTRUMENT ONLY).
  // pre-return + enhanced return-attempt (10-field) + post-return bracket the
  // keyDown:Return dispatch so the fresh-vs-ReEngaged differential is observable.
  // pty.data byte capture DEFERRED to Wave-1.5 (S6 §D.2). NO cure applied here (M-CLPRC).
  sdia('fkis.execute.pre-return', {
    targetUlid,
    charsStreamed,
    windowId: targetWindow.id,
    isFocused: targetWindow.isFocused(),
    webContentsId: targetWindow.webContents.id,
    isReEngaged: deriveIsReEngaged(targetUlid),
  }, 'fkis');
  sdia('fkis.execute.return-attempt', {
    targetUlid,
    charsStreamed,
    windowId: targetWindow.id,
    isFocused: targetWindow.isFocused(),
    isDestroyed: targetWindow.isDestroyed(),
    webContentsId: targetWindow.webContents.id,
    originScpName,
    textLength: text.length,
    isReEngaged: deriveIsReEngaged(targetUlid),
    focusInConfirmedDeltaMs: Date.now() - focusInConfirmedTs,
  }, 'fkis');
  if (!targetWindow.isDestroyed()) {
    targetSession.sendInputViaKeystroke('\r');
  }
  sdia('fkis.execute.post-return', {
    targetUlid,
    charsStreamed,
    windowId: targetWindow.id,
    isFocused: targetWindow.isFocused(),
    isDestroyed: targetWindow.isDestroyed(),
  }, 'fkis');

  // DM-D4 P3 · inject==receipt==echo reconciliation Concluder (MAIN side). After the
  // send + a short settle (so the renderer terminal.user-input rlog lands in the unified
  // electron-debug.json), log the MAIN injectCount. injectCount = charsStreamed + 1 (the
  // +1 = the CR submit char from step 5). The renderer-side receiptCount is userInputCount
  // in the rlog stream; the Concluder reconciles MAIN injectCount vs RENDERER
  // userInputCount. injectCount > 0 && receiptCount == 0 = hop-A cold (the cure target).
  await new Promise<void>((r) => setTimeout(r, 50));
  // PRIME-STALL FIX A · post-stream re-ping. A second main-side liveness round-trip
  // AFTER the inject. If the renderer channel is still live the pong returns true,
  // confirming the chars landed on a receiving xterm (the warm/normal case → ok:true).
  // If it returns false the channel went cold across the stream — combined with a failed
  // readiness poll this is the hop-A-cold signal → report ok:false so the swallowed send
  // surfaces a failure up the chain instead of the prior silent ok:true.
  const postStreamChannelReady = await targetSession.pingChannel();
  const delivered = channelReady && postStreamChannelReady;
  sdia('fkis.execute.reconcile', {
    targetUlid,
    charsExpected: text.length,
    injectCount: charsStreamed + 1,
    channelReady,
    postStreamChannelReady,
    delivered,
    isReEngaged: deriveIsReEngaged(targetUlid),
  }, 'fkis');

  // (6) FORF Step 3 · Focus-Return-Out · F1 closure: 3-step EWHM pattern.
  // C768 · IN FOCUS HOLD — an inFocus envelope (Ask Me · SCS:In-Focus) keeps the TERMINAL
  // focused: the final refocus to the origin SCP is suppressed entirely.
  sdia('fkis.execute.focus-out-decision', { targetUlid, inFocus: envelope.inFocus === true }, 'fkis');
  if (envelope.inFocus === true) {
    sdia('fkis.execute.focus-out-suppressed', { targetUlid, reason: 'in-focus-hold' }, 'fkis');
  } else if (originWindow && !originWindow.isDestroyed()) {
    originWindow.show();
    originWindow.focus();
    originWindow.moveTop();
  }
  sdia('fkis.execute.focus-out-confirmed', {
    targetUlid,
    originRestored: !!originWindow,
    isFocusedOrigin: originWindow?.isFocused() ?? null,
  }, 'fkis');

  // PRIME-STALL FIX A · honest delivery report. delivered = the channel was live
  // BEFORE the inject (readiness poll) AND stayed live AFTER it (post-stream re-ping).
  // A warm anchor satisfies both immediately → ok:true (no regression). A cold-spawn
  // anchor whose renderer channel never came live within budget, OR went cold across
  // the stream (hop-A cold), reports ok:false so the SWALLOWED send is no longer a
  // silent success — the client can release its menu lock and offer a retry.
  if (!delivered) {
    sdia('fkis.execute.complete', { targetUlid, charsStreamed, ok: false, delivered }, 'fkis');
    sdia('fkis.complete', { targetUlid, charsStreamed, originRestored: !!originWindow, ok: false });
    return {
      ok: false,
      error: 'anchor channel not ready — chars may have been dropped (hop-A cold)',
      charsStreamed,
    };
  }
  sdia('fkis.execute.complete', { targetUlid, charsStreamed, ok: true }, 'fkis');
  sdia('fkis.complete', { targetUlid, charsStreamed, originRestored: !!originWindow });
  return { ok: true, charsStreamed };
}

async function resolveOriginWindow(originScpName: string): Promise<BrowserWindow | null> {
  // H2 cure · D3 W5 Recurse-1 · Template SCP special case.
  // dev:self auto-spawns the Template URL window directly (dev.ts:335
  // spawnElectronWindowForUrl) so its URL lands in urlWindowMap but the
  // Template is NOT formally installed · bridge.json.boundScps has no
  // 'template' entry. Fall back to the default Template URL (port 7637 ·
  // server.concept.ts:23) then to any localhost URL in urlWindowMap.
  // Citation: DIAMOND-3-FKIS-W5-FAILURE-S7-CLINICAL-NOTE §F · S6 §B.4 CURE-3
  if (originScpName === 'template') {
    const templateUrl = 'http://localhost:7637/';
    const direct = getVisibleUrlWindow(templateUrl);
    if (direct && !direct.isDestroyed()) {
      sdia('fkis.execute.origin-template-resolved', { url: templateUrl, windowId: direct.id }, 'fkis');
      return direct;
    }
    const known = listUrlWindows();
    const fallbackUrl = known.find((u) => /^https?:\/\/localhost(:\d+)?\//.test(u));
    if (fallbackUrl) {
      const win = getVisibleUrlWindow(fallbackUrl);
      if (win && !win.isDestroyed()) {
        sdia('fkis.execute.origin-template-fallback', { url: fallbackUrl, windowId: win.id }, 'fkis');
        return win;
      }
    }
    sdia('fkis.execute.origin-template-MISS', { tried: templateUrl, knownUrls: known }, 'fkis');
    return null;
  }
  try {
    // C402 · THE PPRR STRAGGLER (the refocus root — fkis.origin.no-metadata on EVERY send):
    // bare readBridgeMetadata() reads the LEGACY GLOBAL ~/.scs-bridge/bridge.json; the live
    // registry moved to <userCwd>/Cascades/Bridge/bridge.json (PPRR) — this call site never
    // followed. The Electron main's process.cwd() IS userCwd (index.ts:433 precedent). Read
    // per-project FIRST; the bare legacy read stays as the fallback.
    const metadata =
      (await readBridgeMetadata(bridgeMetadataPathPerProject(process.cwd()))) ??
      (await readBridgeMetadata());
    if (!metadata) {
      sdia('fkis.origin.no-metadata', { originScpName });
      return null;
    }
    const boundEntry = metadata.boundScps?.[originScpName];
    if (!boundEntry) {
      sdia('fkis.origin.no-bound-entry', {
        originScpName,
        knownScps: Object.keys(metadata.boundScps ?? {}),
      });
      return null;
    }
    const url = boundEntry.browserUrl;
    const win = getVisibleUrlWindow(url);
    if (!win) {
      sdia('fkis.origin.no-ewhm-window', {
        originScpName,
        url,
        knownUrls: listUrlWindows(),
      });
      return null;
    }
    return win.isDestroyed() ? null : win;
  } catch (err) {
    sdia('fkis.origin.resolve-error', { originScpName, error: String(err) });
    return null;
  }
}
