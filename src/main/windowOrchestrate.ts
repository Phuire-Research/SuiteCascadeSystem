/**
 * windowOrchestrate.ts · D-N3 · the 8R6 Neon PlayTester — window orchestration executor
 *
 * Executes an atomic STEP SEQUENCE against a target BrowserWindow — the PlayTester's
 * prime mover. Sequences (not single actions) are the design lesson of the turn-over
 * epoch: the CGDA arm→confirm demands two clicks inside a 10s window; agent tool-call
 * round-trips cannot hold that beat, so the timing runs HERE, in Electron main, with
 * zero latency between steps.
 *
 * WINDOW-GENERAL BY DESIGN: the SCP is the binding location, but a terminal session
 * window spawned through the bridge is equally targetable — the SCS-Bridge is the
 * Grounding Literal Bridge, not an SCP-specific tool. Target resolution lives in the
 * cli-handler verb (`orchestrate-window`); this module takes the resolved window.
 *
 * Step kinds:
 *   click   {selector}          — real MouseEvent chain on the element (pointer+mouse+click)
 *   key     {key, modifiers?}   — sendInputEvent keyDown/char/keyUp
 *   js      {code}              — executeJavaScript · SERIALIZED RETURN (the assertion primitive)
 *   wait    {ms}                — bounded pause (the arm-window beat)
 *   capture {label?}            — capturePage → PNG → Cascades/Bridge/playtests/<runId>/
 *   probe   {}                  — alive? URL? loading? bridge.json freshness (restart-spanning)
 *
 * A destroyed window mid-sequence returns {ok:false, reason:'window-destroyed'} for that
 * step and the sequence reports PARTIAL — a turn-over test EXPECTS to lose the window.
 * Wall-time capped so the /mcp call never hangs; restart-waiting is the caller poll-looping
 * cheap probe sequences.
 */
import * as path from 'node:path';
import * as fs from 'node:fs';
import { type BrowserWindow, type NativeImage } from 'electron';
import { sdia } from './diagnostics';

const MAX_STEPS = 24;
const MAX_WAIT_MS = 10_000;
const MAX_TOTAL_MS = 30_000;

// ────────────────────────────────────────────────
// D-N2 · the STREAMING latest-frame store. A shader-wrapped SCP renders OFFSCREEN and its
// `paint` events stream the PRE-SHADER NativeImage to the presenter (scpPresenter.ts) — we
// keep the most recent frame per window so a render capture returns the CURRENTLY STREAMED
// frame instantly (no repaint round-trip). Flat (non-shaded) windows have no paint stream;
// captureWindowRender falls back to capturePage() for them.
// ────────────────────────────────────────────────
const latestFrames = new Map<number, NativeImage>();

export function setLatestWindowFrame(windowId: number, image: NativeImage): void {
  latestFrames.set(windowId, image);
}

export function clearLatestWindowFrame(windowId: number): void {
  latestFrames.delete(windowId);
}

// WRA-DARK · the symmetric read — hand the CURRENTLY STREAMED frame to an on-demand querier
// (recoverFromDarkRender samples it for a completely-dark render). Null when no frame is cached.
export function getLatestWindowFrame(windowId: number): NativeImage | null {
  return latestFrames.get(windowId) ?? null;
}

export interface RenderCaptureResult {
  ok: boolean;
  path?: string;
  w?: number;
  h?: number;
  bytes?: number;
  mode?: 'stream' | 'page';
  reason?: string;
}

/**
 * D-N2 · capture the window's CURRENT render to a PNG under playtests/<runId>/.
 * Prefers the streamed latest paint frame (the pre-shader source of a shader-wrapped
 * window — "the render context PRIOR to the shader pass"); falls back to capturePage()
 * for flat windows. Shared by the orchestrate `capture` step AND the scs_render_capture verb.
 */
export async function captureWindowRender(
  win: BrowserWindow,
  label: string,
  runId: string,
): Promise<RenderCaptureResult> {
  if (win.isDestroyed()) return { ok: false, reason: 'window-destroyed' };
  try {
    const streamed = latestFrames.get(win.id);
    const image = streamed && !streamed.isEmpty() ? streamed : await win.webContents.capturePage();
    const mode: 'stream' | 'page' = streamed && !streamed.isEmpty() ? 'stream' : 'page';
    const size = image.getSize();
    const safeLabel = (label || 'frame').replace(/[^a-zA-Z0-9_-]/g, '_');
    const p = path.join(playtestDir(runId), `${safeLabel}-${Date.now()}.png`);
    const png = image.toPNG();
    fs.writeFileSync(p, png);
    return { ok: true, path: p, w: size.width, h: size.height, bytes: png.length, mode };
  } catch (err) {
    return { ok: false, reason: String(err) };
  }
}

export type OrchestrateStep =
  | { kind: 'click'; selector: string }
  | { kind: 'key'; key: string; modifiers?: string[] }
  | { kind: 'js'; code: string }
  | { kind: 'wait'; ms: number }
  | { kind: 'capture'; label?: string }
  | { kind: 'probe' }
  // scroll (Lambda-of-2 finding — the PlayTester MUST be able to scroll):
  //  - selector given → DOM scroll of that element (to:'top'|'bottom' anor by deltaY).
  //  - no selector → a mouseWheel input event at (x,y | window center) — the route for
  //    terminal scrollback (xterm listens to wheel events, not DOM scrollTop).
  | {
      kind: 'scroll';
      selector?: string;
      deltaY?: number;
      to?: 'top' | 'bottom';
      x?: number;
      y?: number;
    };

export interface OrchestrateStepResult {
  kind: string;
  ok: boolean;
  value?: unknown;
  path?: string;
  reason?: string;
}

export interface OrchestrateSequenceResult {
  ok: boolean;
  partial: boolean;
  runId: string;
  durationMs: number;
  steps: OrchestrateStepResult[];
}

function playtestDir(runId: string): string {
  const dir = path.join(process.cwd(), 'Cascades', 'Bridge', 'playtests', runId);
  try {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  } catch {
    /* capture step will surface the failure */
  }
  return dir;
}

// JSON-safe serialization of an executeJavaScript result (drops functions/cycles gracefully).
function safeSerialize(value: unknown): unknown {
  try {
    return JSON.parse(JSON.stringify(value ?? null));
  } catch {
    return String(value);
  }
}

function clickScript(selector: string): string {
  const sel = JSON.stringify(selector);
  return `(() => {
    const el = document.querySelector(${sel});
    if (!el) return { found: false };
    el.scrollIntoView({ block: 'center', inline: 'center' });
    for (const t of ['pointerdown', 'mousedown', 'pointerup', 'mouseup', 'click']) {
      el.dispatchEvent(new MouseEvent(t, { bubbles: true, cancelable: true, view: window }));
    }
    return { found: true, tag: el.tagName, text: (el.textContent || '').trim().slice(0, 60) };
  })()`;
}

async function probeWindow(win: BrowserWindow): Promise<Record<string, unknown>> {
  const alive = !win.isDestroyed();
  const probe: Record<string, unknown> = { alive };
  if (alive) {
    try {
      probe.url = win.webContents.getURL();
      probe.loading = win.webContents.isLoading();
      probe.title = win.getTitle();
    } catch (err) {
      probe.probeError = String(err);
    }
  }
  // bridge.json freshness — the restart-spanning signal (nodemon respawn rewrites it).
  try {
    const raw = fs.readFileSync(
      path.join(process.cwd(), 'Cascades', 'Bridge', 'bridge.json'),
      'utf8',
    );
    const bj = JSON.parse(raw) as { writtenAt?: number };
    if (typeof bj.writtenAt === 'number') {
      probe.bridgeJsonAgeMs = Date.now() - bj.writtenAt;
    }
  } catch {
    probe.bridgeJsonAgeMs = null;
  }
  return probe;
}

export async function executeOrchestrationSequence(
  win: BrowserWindow,
  steps: OrchestrateStep[],
  runId: string,
): Promise<OrchestrateSequenceResult> {
  const started = Date.now();
  const results: OrchestrateStepResult[] = [];
  let partial = false;

  const bounded = steps.slice(0, MAX_STEPS);
  for (const step of bounded) {
    if (Date.now() - started > MAX_TOTAL_MS) {
      results.push({ kind: step.kind, ok: false, reason: 'sequence-wall-time-exceeded' });
      partial = true;
      break;
    }
    // The turn-over EXPECTS to lose the window — report PARTIAL, never hang.
    if (win.isDestroyed() && step.kind !== 'probe') {
      results.push({ kind: step.kind, ok: false, reason: 'window-destroyed' });
      partial = true;
      break;
    }
    try {
      switch (step.kind) {
        case 'click': {
          const value = await win.webContents.executeJavaScript(clickScript(step.selector), true);
          const found = (value as { found?: boolean } | null)?.found === true;
          results.push({
            kind: 'click',
            ok: found,
            value: safeSerialize(value),
            reason: found ? undefined : 'selector-not-found',
          });
          break;
        }
        case 'key': {
          const modifiers = Array.isArray(step.modifiers) ? step.modifiers : [];
          win.webContents.sendInputEvent({
            type: 'keyDown',
            keyCode: step.key,
            modifiers: modifiers as Electron.InputEvent['modifiers'],
          });
          if (step.key.length === 1) {
            win.webContents.sendInputEvent({ type: 'char', keyCode: step.key });
          }
          win.webContents.sendInputEvent({
            type: 'keyUp',
            keyCode: step.key,
            modifiers: modifiers as Electron.InputEvent['modifiers'],
          });
          results.push({ kind: 'key', ok: true, value: step.key });
          break;
        }
        case 'js': {
          const value = await win.webContents.executeJavaScript(step.code, true);
          results.push({ kind: 'js', ok: true, value: safeSerialize(value) });
          break;
        }
        case 'wait': {
          const ms = Math.max(0, Math.min(step.ms ?? 0, MAX_WAIT_MS));
          await new Promise((r) => setTimeout(r, ms));
          results.push({ kind: 'wait', ok: true, value: ms });
          break;
        }
        case 'capture': {
          // D-N2 shared: prefers the STREAMED latest paint frame (pre-shader), else capturePage.
          const cap = await captureWindowRender(win, step.label ?? 'frame', runId);
          results.push({
            kind: 'capture',
            ok: cap.ok,
            path: cap.path,
            value: { w: cap.w, h: cap.h, mode: cap.mode },
            reason: cap.reason,
          });
          break;
        }
        case 'probe': {
          results.push({ kind: 'probe', ok: true, value: await probeWindow(win) });
          break;
        }
        case 'scroll': {
          if (typeof step.selector === 'string' && step.selector.length > 0) {
            // DOM scroll of a specific element (SCP panels, session lists).
            const sel = JSON.stringify(step.selector);
            const to = step.to === 'top' || step.to === 'bottom' ? JSON.stringify(step.to) : 'null';
            const delta = typeof step.deltaY === 'number' ? step.deltaY : 0;
            const value = await win.webContents.executeJavaScript(
              `(() => {
                const el = document.querySelector(${sel});
                if (!el) return { found: false };
                const to = ${to};
                if (to === 'top') el.scrollTop = 0;
                else if (to === 'bottom') el.scrollTop = el.scrollHeight;
                else el.scrollBy({ top: ${delta}, behavior: 'instant' });
                return { found: true, scrollTop: el.scrollTop, scrollHeight: el.scrollHeight, clientHeight: el.clientHeight };
              })()`,
              true,
            );
            const found = (value as { found?: boolean } | null)?.found === true;
            results.push({
              kind: 'scroll',
              ok: found,
              value: safeSerialize(value),
              reason: found ? undefined : 'selector-not-found',
            });
          } else {
            // mouseWheel input event — terminal scrollback (xterm) + whole-page scrolling.
            // deltaY > 0 scrolls UP (toward scrollback); deltaY < 0 scrolls down.
            const [w, h] = win.getSize();
            const x = typeof step.x === 'number' ? step.x : Math.floor(w / 2);
            const y = typeof step.y === 'number' ? step.y : Math.floor(h / 2);
            const deltaY = typeof step.deltaY === 'number' ? step.deltaY : 240;
            win.webContents.sendInputEvent({
              type: 'mouseWheel',
              x,
              y,
              deltaX: 0,
              deltaY,
              canScroll: true,
            });
            results.push({ kind: 'scroll', ok: true, value: { x, y, deltaY, mode: 'wheel' } });
          }
          break;
        }
        default:
          results.push({
            kind: String((step as { kind?: unknown }).kind ?? 'unknown'),
            ok: false,
            reason: 'unknown-step-kind',
          });
      }
    } catch (err) {
      const destroyed = win.isDestroyed();
      results.push({
        kind: step.kind,
        ok: false,
        reason: destroyed ? 'window-destroyed' : String(err),
      });
      if (destroyed) {
        partial = true;
        break;
      }
    }
  }

  const result: OrchestrateSequenceResult = {
    ok: results.every((r) => r.ok) && !partial,
    partial,
    runId,
    durationMs: Date.now() - started,
    steps: results,
  };
  sdia('orchestrate.sequence', {
    runId,
    stepCount: results.length,
    ok: result.ok,
    partial,
    durationMs: result.durationMs,
  });
  return result;
}
