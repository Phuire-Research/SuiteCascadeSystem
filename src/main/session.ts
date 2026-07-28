import * as path from 'node:path';
import { existsSync } from 'node:fs';
import { BrowserWindow, MessageChannelMain } from 'electron';
import type { MessagePortMain } from 'electron';
import { spawnRemotePty, type RemotePty } from './ptyHostClient';
import { wireDevToolsOnWindow } from './devToolsBinding';
import { attachHiFiCursor, attachRealCursorStyle, wireCursorStateRelay, setCursorOverlayEnabled, setRealCursorCombined } from './cursorOverlay.model';
import { sdia } from './diagnostics';
import { setLatestWindowFrame, clearLatestWindowFrame, getLatestWindowFrame } from './windowOrchestrate';
import { updateSessionLaunchMeta, updateSessionStatus } from '../lib/bridge/registry';
import { isTearingDown } from './teardownFlag';
import { preSeedTrust } from '../lib/bridge/trustPreSeed';
import type { MouseForward } from '../shared/inputForward';
import { isShaderRenderMode, SHADER_RENDER_MODE_DEFAULT, DEFAULT_SHADER_FPS, type ShaderRenderMode } from '../shared/shaderRenderMode';
import { DEFAULT_MODEL as MODEL_DEFAULT } from '../shared/modelCatalog.model';

// SDIA · Session-Diagnostic-In-Append · file-based log surface for the PTY pipeline
// chain · written eagerly so we can post-mortem a stuck cursor without DevTools.
// Path: <projectRoot>/Cascades/Bridge/electron-debug.json (per diagnostics module).

export interface SessionSpawnOptions {
  id: string;
  command: string;
  args?: string[];
  cwd?: string;
  env?: NodeJS.ProcessEnv;
  cols?: number;
  rows?: number;
}

export interface SessionConfig {
  preloadPath: string;
  rendererHtmlPath: string;
  // SWRM · the presenter window's HTML (dist/renderer/presenter.html). Only consulted when
  // the shader-wrap split is enabled; absent → the current single-window path is used verbatim.
  presenterHtmlPath?: string;
  width?: number;
  height?: number;
}

const DEFAULT_COLS = 80;
const DEFAULT_ROWS = 40;
const DEFAULT_WIDTH = 700;
const DEFAULT_HEIGHT = 620;

// WRA · Window-Resize Auto-Format · Resume-Resize Render-Reset tuning. A RESUMED Claude
// Code session (`--resume`) renders its restored scrollback COLLAPSED inside the
// BrowserWindow; growing then restoring the window forces the xterm fit-addon to
// recompute cols/rows → node-pty SIGWINCH → CC reflows into a correct full render.
// WRA_SETTLE_MS: delay after the PDFL `launched` signal so CC paints the (collapsed)
// resume render BEFORE the resize. WRA_GROW_PX: the grow delta — must exceed one xterm
// character-cell (~8-9px) so cols/rows ACTUALLY change (a sub-cell nudge fires no
// SIGWINCH); the restore is the EXACT captured bounds, so the magnitude is cosmetic.
// WRA_RESTORE_MS: settle between grow and restore so the grow's SIGWINCH lands first.
const WRA_SETTLE_MS = Number(process.env.SCS_WRA_SETTLE_MS ?? 500);
const WRA_GROW_PX = 64;
const WRA_RESTORE_MS = 80;

// WRA-DARK · the Final Point of Recovery — APPENDED after the WRA restore (the WRA sequence itself
// stays verbatim). The restore has an intermittent chance of landing the offscreen render
// COMPLETELY DARK (a stale/failed xterm raster at the restored bounds). Because the terminal
// renders OFFSCREEN we hold its frame (the `paint` NativeImage, cached per-window); we QUERY that
// frame for darkness and, if dark, trigger the renderer's SCROLL-RECOVER — scroll the viewport up
// a tad then back to the bottom, which forces xterm to re-rasterize the viewport rows → a fresh
// paint that clears the dark render (the user's empirical cure · no window-geometry change · the
// up + down land in SEPARATE frames so each triggers its own raster). Re-queries between attempts;
// bounded; the focus-nudge sweep (nudgeRedrawViaResize) is the fallback beyond the cap.
const WRA_RECOVER_SETTLE_MS = 200;   // per-attempt settle: renderer up→down scroll → re-raster → paint → cache
const WRA_RECOVER_MAX = 6;           // bounded attempts
const WRA_RECOVER_SCROLL_LINES = 3;  // "a tad" — lines to scroll up before snapping back to the bottom
const WRA_DARK_LUMA_MAX = 8;         // per-pixel near-black luminance ceiling (0-255)
const WRA_DARK_FRACTION = 0.98;      // fraction of sampled pixels near-black → "completely dark"
const WRA_DARK_SAMPLE_STRIDE = 64;   // strided pixel scan — sample every Nth pixel (cheap, synchronous)

// SWRM · D1 · Shader-Wrap offscreen+presenter split. Gated OFF by default — OFF keeps the
// CURRENT single visible xterm window verbatim (zero regression). When SCS_SHADER_WRAP=1 (and
// a presenter HTML path is configured), the xterm window is created OFFSCREEN (the render
// source) and a VISIBLE presenter window shows its `paint` frames shaded through the GLSL.
// The PTY pipe (mainPort), FKIS (sendInputViaKeystroke targets this.window = the offscreen),
// pingChannel and WRA all keep targeting the offscreen window unchanged; only show/hide/focus
// repoint to the presenter, and interactive user keyboard/mouse forwarding is a later sub-wave.
// First-light is fixed to CRT Flat (color-tier · no warp · no input remap).
// Install Epoch recurse (Blank-Test-002): the opt-in gate was D1 dev conservatism — production
// users never set the flag, so the install instance (and every production session) rendered
// UNBRANDED on the legacy single-window path. The Branded Means IS the point of entry: the
// offscreen+presenter split is now DEFAULT ON (terminal input is user-proven; 'off' renderMode
// is a true raw pass-through; bridge.json.renderMode is the real control). Opt-out: '0'.
const SHADER_WRAP_ENABLED = process.env.SCS_SHADER_WRAP !== '0';
// SWRM · D2 · the active render mode at session boot. Default = Muxon (the branding default · the
// Muxameter). Overridable via SCS_SHADER_MODE (e.g. crtflat/chroma/vhs…) for testing any mode;
// an invalid value falls back to Muxon. D3 will replace this with the bridge.json.renderMode pipe.
const SHADER_WRAP_DEFAULT_MODE =
  process.env.SCS_SHADER_MODE && isShaderRenderMode(process.env.SCS_SHADER_MODE)
    ? process.env.SCS_SHADER_MODE
    : SHADER_RENDER_MODE_DEFAULT;
const SHADER_WRAP_FRAME_RATE = Number(process.env.SCS_SHADER_WRAP_FPS ?? 30);

// SWRM · D3 · the live Terminal render mode shared by all sessions. Seeded from the boot default;
// the bridge.json watcher (renderModeWatch) updates it on change. A NEW presenter hydrates to this
// at spawn; setRenderMode() live-swaps an EXISTING one. Module-level = one current mode for all.
let activeRenderMode: ShaderRenderMode = SHADER_WRAP_DEFAULT_MODE;
export function setActiveRenderMode(mode: ShaderRenderMode): void {
  activeRenderMode = mode;
}
export function getActiveRenderMode(): ShaderRenderMode {
  return activeRenderMode;
}

// SWRM · the live SCP render mode shared by ALL shaded SCPs (the offscreen presenters). Seeded
// from the same boot default as the terminal; renderModeWatch updates it from bridge.json
// .scpRenderMode and fans the swap to every SCP presenter (electronWindow.setAllScpRenderMode).
// A NEW SCP presenter hydrates to this at create (scpPresenter.getActiveScpRenderMode). Distinct
// from activeRenderMode so the Terminal and the SCPs can run different modes.
let activeScpRenderMode: ShaderRenderMode = SHADER_WRAP_DEFAULT_MODE;
export function setActiveScpRenderMode(mode: ShaderRenderMode): void {
  activeScpRenderMode = mode;
}
export function getActiveScpRenderMode(): ShaderRenderMode {
  return activeScpRenderMode;
}

// C919 · THE FRAME GOVERNOR · the live shader OUTPUT fps shared by ALL presenters (terminal
// AND SCP — one cadence for the whole shaded surface). Default 24 = Like Animation. Distinct
// from SHADER_WRAP_FRAME_RATE (the OSR SOURCE paint rate — how often the offscreen page
// paints) — this governs how often the visible presenter DRAWS. renderModeWatch updates it
// from bridge.json.shaderFps and fans 'scs:shaderFps' to every presenter; a NEW presenter
// hydrates to it beside its initial 'scs:renderMode'.
let activeShaderFps: number = DEFAULT_SHADER_FPS;
export function setActiveShaderFps(fps: number): void {
  activeShaderFps = fps;
}
export function getActiveShaderFps(): number {
  return activeShaderFps;
}

// Model Control · the live default model EVERY instance spawn/resume injects as
// `claude --model <id>` (general agent or Suite 8 alike). Seeded Opus 4.8 (DEFAULT_MODEL);
// renderModeWatch updates it from bridge.json.defaultModel — the SAME Diameter as
// activeRenderMode (bridge.json is the junction; the Settings UI edits it post-Epoch).
// Applies at the NEXT spawn/resume; a running instance keeps its model (no live-swap).
let activeDefaultModel: string = MODEL_DEFAULT;
export function setActiveDefaultModel(model: string): void {
  activeDefaultModel = model;
}
export function getActiveDefaultModel(): string {
  return activeDefaultModel;
}

function resolveShellEnv(extra?: NodeJS.ProcessEnv): NodeJS.ProcessEnv {
  const base: NodeJS.ProcessEnv = { ...process.env, ...(extra ?? {}) };
  if (!base.PATH && (base as Record<string, string | undefined>).Path) {
    base.PATH = (base as Record<string, string | undefined>).Path;
  }
  return base;
}

export class Session {
  public readonly id: string;
  private ptyProcess: RemotePty | null = null;
  private window: BrowserWindow | null = null;
  private mainPort: MessagePortMain | null = null;
  private readonly spawnOpts: SessionSpawnOptions;
  private readonly config: SessionConfig;
  private exitHandlers: Array<(code: number, signal: number) => void> = [];
  // D2 Recurse-3 · PFCD-guard · idempotency defense for PDFL trigger.
  // ULMR fires ONCE per session lifecycle on first pty.data.posted event;
  // subsequent PTY chunks short-circuit via this boolean check.
  private launched: boolean = false;
  // D2 Recurse-3 · cached terminal command string for ULMR.terminalCommand
  // field write. Captured at spawn time from spawnOpts.command + args.
  private cachedCommand: string = '';
  // DM-D4 P1 · Layer-1 Window↔Main MessagePort Ping-Back · permanent
  // Connection-Liveness Concluder. Pending nonce → resolver map; the
  // port.on('message') handler resolves the matching {type:'scs:pong', nonce}.
  // Lambda truth: a pong round-trip proves the renderer→main return leg is
  // pumping — distinct from fkis.execute.complete ok:true (the inject-call
  // false-positive). 500ms timeout → false. mainPort null → false.
  private pingPending: Map<number, (ok: boolean) => void> = new Map();
  private pingNonceSeq: number = 0;
  // DM-D4 W1 instrumentation field (Ochre-E §B.5) · set MAIN-side by cli-handler
  // makeSession when mode==='resume' fires. Read by deriveIsReEngaged() in
  // messageDispatch.ts. Lifecycle: false at construction · true on ReEngagement
  // (sticky for the lifetime of the Session instance · never resets).
  private wasResumed: boolean = false;
  // D-UP · THE STAND BY OVERLAY pending flag — set by cli-handler open-session (registry
  // standBy marker · manualMode primed spawn); the presenter did-finish-load paints from it;
  // clearStandBy() drops it when the directive delivery lands (anor never — the renderer's
  // own input/timeout clears are self-sufficient).
  private standByPending: boolean = false;
  // WRA · Window-Resize Auto-Format · fire-once guard. The resume-resize render-reset runs
  // at most ONCE per Session lifecycle (resumed sessions only · gated on this.wasResumed).
  private wraDone: boolean = false;
  // SWRM · D1 · the visible presenter window (shader-wrap ON only). this.window stays the
  // OFFSCREEN xterm render source; this.presenterWindow shades its paint frames.
  private presenterWindow: BrowserWindow | null = null;
  // SWRM · paint-frame counter (instrument: confirms the offscreen pipeline emits frames —
  // count==0 in electron-debug.json = offscreen rendering not producing bitmaps).
  private paintCount: number = 0;
  // C474 · bounded re-kick counter for empty first frames (reset on any real frame).
  private emptyFrameRetries = 0;
  // SWRM · memoized shader-wrap resolution. The presenter-asset existence is fixed per Session
  // lifecycle, so we resolve once (and log the MISSING case at most once — no getter spam).
  private shaderWrapResolved: boolean | null = null;
  // D-WC-1 · Window-Close Signal · fire-once guard. A user window close records the
  // session offline exactly once. Shader-wrap closes BOTH the presenter (visible ·
  // what the user closes) AND the offscreen this.window (dispose cross-close), so both
  // 'closed' handlers call recordOfflineOnUserClose; this flag drops the second write.
  private statusRecorded: boolean = false;

  constructor(spawnOpts: SessionSpawnOptions, config: SessionConfig) {
    this.id = spawnOpts.id;
    this.spawnOpts = spawnOpts;
    this.config = config;
  }

  spawn(): void {
    if (this.ptyProcess) {
      sdia('spawn.skip', { id: this.id, reason: 'already-spawned' });
      return;
    }
    const cwd = this.spawnOpts.cwd ?? process.cwd();
    // WORKSPACE-TRUST PRE-SEED at the UNIVERSAL spawn seam (Lambda-of-2 finding): a claude
    // session spawned into an untrusted cwd drops its permissions.allow entries ("Ignoring N
    // permissions.allow entries ... workspace has not been trusted"). The TUI install path
    // pre-seeds (animatedTui preSeedTrust) but the UI spawn routes did NOT — this seam covers
    // ALL routes. Gated to claude-like commands; non-fatal (the user can still click the dialog).
    if (/claude/i.test(this.spawnOpts.command + ' ' + (this.spawnOpts.args ?? []).join(' '))) {
      try {
        const seeded = preSeedTrust(cwd);
        sdia('spawn.trust-preseed', { id: this.id, cwd, ...seeded });
      } catch (err) {
        sdia('spawn.trust-preseed-FAIL', { id: this.id, cwd, error: String(err) });
      }
    }
    const env = resolveShellEnv(this.spawnOpts.env);
    const cols = this.spawnOpts.cols ?? DEFAULT_COLS;
    const rows = this.spawnOpts.rows ?? DEFAULT_ROWS;
    sdia('spawn.attempt', {
      id: this.id,
      command: this.spawnOpts.command,
      args: this.spawnOpts.args ?? [],
      cwd,
      cols,
      rows,
      hasShellEnv: typeof env.SHELL === 'string',
      hasPathEnv: typeof env.PATH === 'string',
    });

    // C918 · THE PTY HOST EVACUATION — node-pty no longer lives in this (main) process.
    // spawnRemotePty is sync-optimistic: the shim returns immediately (pid -1 until the
    // host's 'spawned' ack · sdia 'ptyhost.spawned' carries the real pid); a host-side
    // spawn failure arrives as a synthesized exit through the SAME onExit path below.
    // The fork-failure seam (script missing) throws here — the same throw contract the
    // in-process pty.spawn had.
    try {
      this.ptyProcess = spawnRemotePty(this.id, this.spawnOpts.command, this.spawnOpts.args ?? [], {
        name: 'xterm-256color',
        cols,
        rows,
        cwd,
        env: env as { [key: string]: string },
      });
      // D2 Recurse-3 · cache cmd string for ULMR.terminalCommand on PDFL fire
      this.cachedCommand = this.spawnOpts.command + ' ' + (this.spawnOpts.args ?? []).join(' ');
      sdia('spawn.pty-spawned', { id: this.id, pid: this.ptyProcess.pid });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      sdia('spawn.pty-spawn-FAIL', { id: this.id, error: msg, command: this.spawnOpts.command });
      console.error('[Session] pty host spawn failed:', err);
      throw err;
    }

    this.ptyProcess.onData((data: string) => {
      const bytes = data.length;
      // D2 Recurse-3 · PDFL · Pty-Data-First-as-Launched · idempotent via PFCD-guard.
      // SLOM semantic: first PTY data chunk = end-to-end byte flow proven through
      // the MessagePort pipeline = session is structurally 'launched'. ULMR writes
      // the four launch-meta fields atomically (status + launchedAt + windowId +
      // command). RWID closure: terminalWindowId carries BrowserWindow.id here
      // (Electron) rather than macOS Terminal.app window-id (legacy spawnInTerminal
      // path). this.launched boolean defends against ULMR firing on every chunk.
      if (!this.launched) {
        this.launched = true;
        void updateSessionLaunchMeta(this.id, {
          status: 'launched',
          launchedAt: Date.now(),
          terminalWindowId: this.window?.id,
          terminalCommand: this.cachedCommand,
        }).catch((err) => {
          sdia('session.launched-meta-FAIL', { id: this.id, error: String(err) });
        });
        sdia('session.launched-via-pdfl', {
          id: this.id,
          windowId: this.window?.id,
          pid: this.ptyProcess?.pid,
        });
        // WRA · resume-only render-reset. Fires here (first PTY byte = CC is rendering),
        // gated INSIDE the method on this.wasResumed — so fresh 'new' sessions are
        // structurally skipped, and Anchors (resume on bridge restart) are included.
        this.scheduleAutoFormatResumeRender();
      }
      if (this.mainPort) {
        try {
          this.mainPort.postMessage(data);
          sdia('pty.data.posted', { id: this.id, bytes });
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          sdia('pty.data.post-FAIL', { id: this.id, bytes, error: msg });
          console.error('[Session] mainPort.postMessage failed:', err);
        }
      } else {
        sdia('pty.data.DROPPED', { id: this.id, bytes, reason: 'mainPort-null' });
      }
    });

    this.ptyProcess.onExit(({ exitCode, signal }) => {
      sdia('pty.exit', { id: this.id, exitCode, signal });
      for (const handler of this.exitHandlers) {
        try {
          handler(exitCode, signal ?? 0);
        } catch (err) {
          console.error('[Session] exitHandler error:', err);
        }
      }
      this.ptyProcess = null;
      // α-2 RESERVATION: SLCS · SessionsList-Concept-Sync
      // When session exits, dispatch d.scsBridge.e.setSessionStatus({ id, status: 'offline' })
      // α-2 fills this in · α-1 leaves the dispatch hook reserved
    });
  }

  /**
   * WRA · Window-Resize Auto-Format · Resume-Resize Render-Reset. A RESUMED Claude Code
   * session (`--resume`) paints its restored scrollback COLLAPSED inside the BrowserWindow
   * (resume render ≠ fresh render). Growing then restoring the window forces the renderer's
   * xterm fit-addon to recompute cols/rows → it posts a resize → node-pty SIGWINCH → CC
   * reflows into a correct full render.
   *
   * RESUMED-ONLY + FIRE-ONCE: gated on `this.wasResumed` (set by cli-handler markResumed on
   * the mode==='resume' path, BEFORE show() — so it is true by the time the PDFL trigger
   * fires) and `this.wraDone`. Fresh 'new' sessions never set wasResumed → structurally
   * skipped. Anchors resume on bridge restart (mode==='resume') → included, no special-case.
   *
   * Maneuver: capture EXACT bounds → grow by WRA_GROW_PX (> one xterm cell, so cols/rows
   * actually change and SIGWINCH fires) → settle → restore the CAPTURED bounds (exact · no
   * inverse-computed rounding drift). Destroyed/null guards span the async gaps.
   */
  // C475/C476 · THE REDRAW NUDGE (the user's finding, refined hands-on): a window RESIZE
  // cures the blank render — but the maneuver is TRICKY: a grow/restore BOUNCE can land the
  // final geometry back in a RENDER VALLEY (staggered pixel placements where the render
  // logic gaps). The cure is ONE ATOMIC +25px Y JUMP THAT STICKS — a straight committed move
  // clears the stagger; no restore leg to fall back into the valley. Successive nudges
  // ALTERNATE direction (+25 · −25) so the offscreen geometry never drifts. The presenter
  // never moves — the jump is invisible; only the offscreen xterm reflows (SIGWINCH → full
  // Claude Code redraw → full frames). Debounced so focus bursts nudge once.
  private lastRedrawNudgeAtMs = 0;
  private nudgeRedrawViaResize(): void {
    const now = Date.now();
    if (now - this.lastRedrawNudgeAtMs < 3000) {
      sdia('session.wra.nudge-debounced', { id: this.id, msSince: now - this.lastRedrawNudgeAtMs });
      return;
    }
    this.lastRedrawNudgeAtMs = now;
    // C490 · THE ANIMATED SWEEP (user refinement of the C476 stick-jump): an INSTANT jump on
    // focus can JIGGLE the render both on- and off-screen — the sweep interpolates the ±25px
    // over 8 smoothstepped frames (~190ms), each step firing resize/SIGWINCH progressively;
    // the FINAL bounds stick (no restore) and the post-sweep invalidate requests the full
    // frame at the settled geometry. The C478 immediate-commit law holds: the FIRST step's
    // setBounds fires synchronously in this call (no defer racing did-finish-load).
    const win = this.window;
    if (!win || win.isDestroyed()) return;
    const orig = win.getBounds();
    // C491 · DOWN-AND-BACK (user spec): 100px BOTH WAYS across 24 frames — a full sine arc
    // (0 → +100 at midsweep → 0) returning to the ORIGINAL bounds. Every frame carries a
    // resize/SIGWINCH; the round trip clears the render valley in BOTH directions and the
    // window ends exactly where it began (no parity drift, no stuck offset).
    const SWEEP_PX = 100;
    const SWEEP_STEPS = 24;
    const SWEEP_STEP_MS = 24;
    let step = 0;
    const sweepOnce = (): boolean => {
      step += 1;
      const w2 = this.window;
      if (!w2 || w2.isDestroyed()) return false;
      const t = step / SWEEP_STEPS;
      const offset = Math.round(SWEEP_PX * Math.sin(Math.PI * t)); // down then back up
      try {
        w2.setBounds({ ...orig, height: orig.height + offset });
      } catch (err) {
        sdia('session.wra.nudge-FAIL', { id: this.id, error: String(err) });
        return false;
      }
      if (step >= SWEEP_STEPS) {
        try {
          w2.setBounds(orig); // land EXACTLY home (sin(π)=0 rounds true, but be exact)
          w2.webContents.invalidate();
          sdia('session.wra.nudge-sweep', { id: this.id, px: SWEEP_PX, frames: SWEEP_STEPS });
        } catch { /* window gone at the finish line */ }
        return false;
      }
      return true;
    };
    // C492 · THE RASTER BLEEP — the presenter wears the CRT power-cycle for the sweep's
    // exact duration (collapse to the scanline at the down-apex · bloom back on the up).
    try {
      if (this.presenterWindow && !this.presenterWindow.isDestroyed()) {
        this.presenterWindow.webContents.send('scs:raster-bleep', SWEEP_STEPS * SWEEP_STEP_MS);
      }
    } catch { /* presenter absent — the sweep runs bare */ }
    if (!sweepOnce()) return; // the first step commits synchronously (C478 law)
    const sweepTimer = setInterval(() => {
      if (!sweepOnce()) clearInterval(sweepTimer);
    }, SWEEP_STEP_MS);
  }

  private scheduleAutoFormatResumeRender(): void {
    if (!this.wasResumed || this.wraDone) return;
    this.wraDone = true;
    setTimeout(() => {
      const win = this.window;
      if (!win || win.isDestroyed()) return;
      const orig = win.getBounds();
      try {
        win.setBounds({
          ...orig,
          width: orig.width + WRA_GROW_PX,
          height: orig.height + WRA_GROW_PX,
        });
        sdia('session.wra.grow', { id: this.id, from: orig, growPx: WRA_GROW_PX });
      } catch (err) {
        sdia('session.wra.grow-FAIL', { id: this.id, error: String(err) });
        return;
      }
      setTimeout(() => {
        const w2 = this.window;
        if (!w2 || w2.isDestroyed()) return;
        try {
          w2.setBounds(orig);
          sdia('session.wra.restore', { id: this.id, to: orig });
          // WRA-DARK · the Final Point of Recovery — after the restore lands, verify the offscreen
          // render is not COMPLETELY DARK; if it is, run the query-gated scroll-recover.
          this.recoverFromDarkRender();
        } catch (err) {
          sdia('session.wra.restore-FAIL', { id: this.id, error: String(err) });
        }
      }, WRA_RESTORE_MS);
    }, WRA_SETTLE_MS);
  }

  // WRA-DARK · sample the offscreen window's LATEST real frame for a completely-dark render. Reads
  // the cached `paint` NativeImage and does a strided BGRA-buffer scan — toBitmap() (the typed
  // twin of the paint handler's legacy getBitmap alias) is BGRA premultiplied with opaque alpha
  // (see shaderWrap.ts setRawFrame: byte order [B,G,R,A], R↔B). Returns null when no frame is
  // cached (can't tell → never triggers recovery on unknown).
  private sampleFrameDarkness(): { dark: boolean; fraction: number; sampled: number } | null {
    const win = this.window;
    if (!win || win.isDestroyed()) return null;
    const img = getLatestWindowFrame(win.id);
    if (!img || img.isEmpty()) return null;
    let bmp: Buffer;
    try {
      bmp = img.toBitmap();
    } catch {
      return null;
    }
    if (bmp.length < 4) return null;
    const stride = 4 * WRA_DARK_SAMPLE_STRIDE;
    let dark = 0;
    let sampled = 0;
    for (let i = 0; i + 2 < bmp.length; i += stride) {
      const b = bmp[i];
      const g = bmp[i + 1];
      const r = bmp[i + 2];
      const luma = 0.114 * b + 0.587 * g + 0.299 * r; // BGRA channel order
      if (luma < WRA_DARK_LUMA_MAX) dark += 1;
      sampled += 1;
    }
    if (sampled === 0) return null;
    const fraction = dark / sampled;
    return { dark: fraction > WRA_DARK_FRACTION, fraction, sampled };
  }

  // WRA-DARK · the Final Point of Recovery. Called ONCE after the WRA restore. If the offscreen
  // render is COMPLETELY DARK, trigger the renderer's SCROLL-RECOVER (up a tad → back to the
  // bottom) — the user's empirical cure — which forces xterm to re-rasterize the viewport rows into
  // a fresh paint, WITHOUT touching window geometry. Re-queries between attempts until a non-dark
  // frame reveals or the attempt cap is hit (accept the intermittent dark · the focus-nudge sweep
  // is the fallback). Never worse than doing nothing.
  private recoverFromDarkRender(): void {
    let attempt = 0;
    const evaluate = (): void => {
      const win = this.window;
      if (!win || win.isDestroyed()) return;
      const d = this.sampleFrameDarkness();
      if (d === null) {
        sdia('session.wra.recover-skip', { id: this.id, attempt, reason: 'no-frame' });
        return;
      }
      if (!d.dark) {
        if (attempt > 0) sdia('session.wra.recover-clear', { id: this.id, attempt, fraction: d.fraction });
        return; // rendered — nothing more to do
      }
      attempt += 1;
      if (attempt > WRA_RECOVER_MAX) {
        sdia('session.wra.recover-capped', { id: this.id, attempts: WRA_RECOVER_MAX, fraction: d.fraction });
        return; // give up — the next focus-nudge sweep (nudgeRedrawViaResize) is the fallback
      }
      this.scrollRecover(WRA_RECOVER_SCROLL_LINES);
      sdia('session.wra.recover-step', { id: this.id, attempt, scrollLines: WRA_RECOVER_SCROLL_LINES, fraction: d.fraction });
      setTimeout(evaluate, WRA_RECOVER_SETTLE_MS);
    };
    setTimeout(evaluate, WRA_RECOVER_SETTLE_MS);
  }

  // WRA-DARK · trigger the renderer's scroll-recover via the same executeJavaScript idiom as
  // __scsGetSelection/__scsPaste. Scrolling the viewport up a tad then back to the bottom (in
  // SEPARATE frames) forces xterm to re-rasterize the viewport rows → a fresh paint that clears a
  // completely-dark render, with NO window-geometry change.
  private scrollRecover(lines: number): void {
    const win = this.window;
    if (!win || win.isDestroyed()) return;
    win.webContents
      .executeJavaScript(`window.__scsScrollRecover && window.__scsScrollRecover(${lines})`)
      .catch((err) => sdia('session.wra.scroll-recover-FAIL', { id: this.id, error: String(err) }));
  }

  // SWRM · the split is live only when the env flag is set, a presenter path is configured, AND
  // that presenter asset actually EXISTS on disk. A partial build (`npm run build` alone rimrafs
  // dist + rebuilds main only — presenter.html is emitted by `build:renderer`/`build:all`) leaves
  // the path set but the file gone, which previously loaded ERR_FILE_NOT_FOUND into the presenter
  // → a black, seemingly-hung window (the agent runs fine underneath; only the shade is broken).
  // Now: fall back to the legacy direct-render single-window path + a loud one-shot sdia so a
  // partial build is diagnosable in seconds rather than mistaken for an agent hang. Memoized.
  private get shaderWrapActive(): boolean {
    if (this.shaderWrapResolved !== null) return this.shaderWrapResolved;
    const presenter = this.config.presenterHtmlPath;
    if (!SHADER_WRAP_ENABLED || !presenter) {
      this.shaderWrapResolved = false;
      return false;
    }
    if (!existsSync(presenter)) {
      sdia('session.osr.presenter-MISSING', {
        id: this.id,
        path: presenter,
        fallback: 'direct-render',
        hint: 'run `npm run build:all` (or `build:renderer`) — `npm run build` alone strips dist/renderer',
      });
      this.shaderWrapResolved = false;
      return false;
    }
    this.shaderWrapResolved = true;
    return true;
  }

  ensureWindow(): BrowserWindow {
    if (this.window && !this.window.isDestroyed()) return this.window;
    const shaderWrap = this.shaderWrapActive;
    const win = new BrowserWindow({
      width: this.config.width ?? DEFAULT_WIDTH,
      height: this.config.height ?? DEFAULT_HEIGHT,
      show: false,
      backgroundColor: '#1a1a1a',
      webPreferences: {
        preload: this.config.preloadPath,
        contextIsolation: true,
        nodeIntegration: false,
        // C674 · DMF2 S1-EXT + S5: explicit hardening + sandbox. The shared preload is sandbox-safe
        // (contextBridge/ipcRenderer/webUtils only); the pty runs in MAIN, the xterm renderer is
        // pure web (no Node in the renderer), so sandbox:true is transparent. contextIsolation stays.
        webSecurity: true,
        allowRunningInsecureContent: false,
        experimentalFeatures: false,
        webviewTag: false,
        sandbox: true,
        // SWRM · ON → render the xterm OFFSCREEN (the shader source); the presenter is the
        // visible window. OFF → unchanged (a normal visible window · zero regression).
        // OSR CURSOR LAW (C398) · an offscreen window is permanently background-class:
        // Chromium throttles its TIMERS and flips its Page Visibility — xterm's cursor-blink
        // interval parked in the hidden phase (the C393 false positive: activity resets blink
        // to SOLID, so the cursor showed exactly while being watched). The presenter carried
        // this guard already — the offscreen source, where xterm actually LIVES, missed it.
        // C473 · paintWhenInitiallyHidden (electronWindow.ts SCP parity): the OSR paint loop
        // must run from birth — without it the hidden offscreen source may never start
        // painting until organic dirty events arrive (the blank-terminal r4 finding).
        ...(shaderWrap ? { offscreen: true, backgroundThrottling: false, paintWhenInitiallyHidden: true } : {}),
      },
    });
    win.on('closed', () => {
      // D-WC-1 · a user closing the (non-shader) terminal window signals the session
      // is no longer live → record offline (skipped during teardown / once already recorded).
      this.recordOfflineOnUserClose();
      clearLatestWindowFrame(win.id); // WRA-DARK · release the cached frame with the window
      this.window = null;
      this.mainPort = null;
    });
    // DevTools attaches to the VISIBLE surface — the presenter when shader-wrapped (an
    // offscreen window has no visible DevTools), else the terminal window itself.
    if (!shaderWrap) wireDevToolsOnWindow(win);
    // THE IN-SURFACE GLYPH (the Authority Split): the virtual pointer attaches to THIS window —
    // the surface itself. When shader-wrapped, the overlay is REDACTED (only the arrow + the
    // paired-diamond body show; the band ring + state indicator move to the real pointer) and
    // RELAYS its state transitions to the presenter's real-pointer style-swap. When NOT
    // shader-wrapped (a flat visible terminal), the surface gets the styled real pointer instead.
    if (shaderWrap) {
      attachHiFiCursor(win, { redacted: true, stateRelay: true });
      // The boot-time initial state for the no-shader disable: assert per the live mode once
      // the page loads (the inject listener registered above runs first — same event, in order).
      win.webContents.on('did-finish-load', () => {
        setCursorOverlayEnabled(win, getActiveRenderMode() !== 'off');
      });
    } else {
      attachRealCursorStyle(win);
    }
    win.loadFile(this.config.rendererHtmlPath).catch((err) => {
      console.error('[Session] loadFile failed:', err);
    });
    this.window = win;
    this.attachMessageChannel(win);
    if (shaderWrap) this.ensurePresenterWindow(win);
    // α-2 RESERVATION: SLCS · SessionsList-Concept-Sync
    // When window attaches, dispatch d.scsBridge.e.addSession({ id, status: 'active', ... })
    // α-2 fills this in · α-1 leaves the dispatch hook reserved
    return win;
  }

  // SWRM · D1 · create the visible presenter window and wire the offscreen → present loop.
  // Each offscreen `paint` forwards the frame bitmap to the presenter (preload onOsrFrame →
  // ShaderWrap.setRawFrame). did-finish-load primes the first-light mode through the same
  // 'scs:renderMode' pipe D3 will later drive live. The presenter shares the session preload.
  private ensurePresenterWindow(offscreenWin: BrowserWindow): void {
    if (this.presenterWindow && !this.presenterWindow.isDestroyed()) return;
    const presenterHtml = this.config.presenterHtmlPath;
    if (!presenterHtml) return;
    const presenter = new BrowserWindow({
      width: this.config.width ?? DEFAULT_WIDTH,
      height: this.config.height ?? DEFAULT_HEIGHT,
      show: false,
      backgroundColor: '#000000',
      webPreferences: {
        preload: this.config.preloadPath,
        contextIsolation: true,
        nodeIntegration: false,
        // C674 · DMF2 S1-EXT + S5 (terminal presenter · same sandbox-safe preload + GL canvas)
        webSecurity: true,
        allowRunningInsecureContent: false,
        experimentalFeatures: false,
        webviewTag: false,
        sandbox: true,
        // SWRM: same throttle guard as the SCP presenter
        backgroundThrottling: false,
      },
    });
    presenter.on('closed', () => {
      // D-WC-1 · when shader-wrapped the USER closes the PRESENTER (the visible surface);
      // the offscreen this.window is not auto-closed by this handler, so the signal must
      // fire here too. The fire-once guard collapses any subsequent offscreen 'closed'.
      this.recordOfflineOnUserClose();
      this.presenterWindow = null;
      // C472→C479 · THE FULL TEARDOWN (the 6⊗7 wrap verdict): the C472 cross-close tore the
      // WINDOWS down but the PTY lived on — sessionRegistry removal rides PTY exit, so the
      // corpse stayed registered and every later engage HOT-REUSED it into the rebuilt-window
      // empty-paint hole (the 04:23 telemetry: one real frame, then paint-empty forever after
      // the WIGF rebuild). A USER closing the terminal ENDS the session: dispose() kills the
      // PTY → onExit → sessionRegistry.remove → the next engage takes the PROVEN fresh
      // `--resume` spawn path (new pair · new port wiring · WRA · working paint). App-quit
      // teardown keeps its own path (isTearingDown guard).
      if (!isTearingDown()) {
        sdia('session.user-close.full-teardown', { id: this.id });
        this.dispose();
      } else if (this.window && !this.window.isDestroyed()) {
        this.window.close();
      }
    });
    // THE REAL POINTER (the Authority Split): no overlay on the presenter — the OS pointer here
    // is STYLED as the Suite-Cascade wheel (attachRealCursorStyle). The offscreen overlay relays
    // its state transitions here (wireCursorStateRelay) so the real pointer swaps to the matching
    // state image (pointer / text / busy / grab) as the cursor moves over the shaded content.
    attachRealCursorStyle(presenter);
    wireCursorStateRelay(offscreenWin, presenter);
    wireDevToolsOnWindow(presenter);
    presenter.loadFile(presenterHtml).catch((err) => {
      console.error('[Session] presenter loadFile failed:', err);
      sdia('session.osr.presenter-load-FAIL', { id: this.id, error: String(err) });
    });
    this.presenterWindow = presenter;
    try {
      offscreenWin.webContents.setFrameRate(SHADER_WRAP_FRAME_RATE);
    } catch (err) {
      sdia('session.osr.setFrameRate-FAIL', { id: this.id, error: String(err) });
    }
    offscreenWin.webContents.on('paint', (_details, _dirty, image) => {
      const p = this.presenterWindow;
      if (!p || p.isDestroyed()) return;
      const size = image.getSize();
      // C474 · THE EMPTY-FRAME GUARD (the 03:30 telemetry: the first paint after invalidate
      // arrived w:0 h:0 — the electron#14739 class). Uploading a zero bitmap BLACKS the
      // presenter's texture; skip it and re-kick a bounded invalidate until a REAL frame
      // passes (the input-event re-kick of electron#7830, self-supplied).
      if (size.width === 0 || size.height === 0) {
        sdia('session.osr.paint-empty', { id: this.id, retries: this.emptyFrameRetries });
        if (this.emptyFrameRetries < 8) {
          this.emptyFrameRetries += 1;
          setTimeout(() => {
            try {
              if (this.window && !this.window.isDestroyed()) this.window.webContents.invalidate();
            } catch { /* window gone — the retry dies with it */ }
          }, 150);
        }
        return;
      }
      this.emptyFrameRetries = 0;
      // WRA-DARK · cache this REAL frame per-window so recoverFromDarkRender can QUERY the
      // offscreen output on demand. The terminal paint stream (unlike the SCP presenter,
      // scpPresenter.ts) never populated latestFrames before this; only non-empty frames reach
      // here (the empty-frame guard above), so a genuinely all-black frame IS the dark-render bug.
      setLatestWindowFrame(offscreenWin.id, image);
      this.paintCount += 1;
      if (this.paintCount === 1 || this.paintCount % 120 === 0) {
        sdia('session.osr.paint', { id: this.id, count: this.paintCount, w: size.width, h: size.height });
      }
      try {
        p.webContents.send('osr:frame', image.getBitmap(), size.width, size.height);
      } catch (err) {
        sdia('session.osr.paint-FAIL', { id: this.id, error: String(err) });
      }
    });
    presenter.webContents.on('did-finish-load', () => {
      try {
        // Wave 5b · tell the presenter which session it shades (routes its keystrokes' PTY).
        presenter.webContents.send('scs:presenter-init', { sessionId: this.id });
        // D3 · hydrate to the live shared mode (bridge.json.renderMode), not the static default.
        presenter.webContents.send('scs:renderMode', activeRenderMode);
        // C919 · hydrate the frame governor beside the mode (bridge.json.shaderFps · default 24).
        presenter.webContents.send('scs:shaderFps', activeShaderFps);
        // D-UP · the primed-spawn Stand By overlay — painted the moment the presenter is
        // ready so the user never watches a bare Claude Code boot waiting for the directive.
        if (this.standByPending) {
          presenter.webContents.send('scs:stand-by');
          sdia('session.standby.shown', { id: this.id, surface: 'presenter' });
        }
        // C473 · THE FULL-FRAME REPLAY (r4 Fix B): frames emitted BEFORE this load were
        // dropped (no listener yet · no replay) — force the offscreen source to repaint its
        // WHOLE surface into the now-ready channel.
        // C478 · PROHOG fix — microtask-deferred so a same-tick nudge's setBounds (now
        // immediate) is committed before this full-frame request lands.
        void Promise.resolve().then(() => {
          if (!offscreenWin.isDestroyed()) offscreenWin.webContents.invalidate();
        });
        sdia('session.osr.presenter-ready', { id: this.id, mode: activeRenderMode });
      } catch (err) {
        sdia('session.osr.presenter-mode-FAIL', { id: this.id, error: String(err) });
      }
    });
  }

  // SWRM · the on-screen window: the presenter when shader-wrapped (this.window is then the
  // offscreen render source), else the terminal window itself. show/hide/focus operate here.
  // Public so messageDispatch (FKIS focus-in) can target the VISIBLE window for OS-window ops.
  public visibleWindow(): BrowserWindow | null {
    if (this.shaderWrapActive && this.presenterWindow && !this.presenterWindow.isDestroyed()) {
      return this.presenterWindow;
    }
    return this.window;
  }

  private attachMessageChannel(win: BrowserWindow): void {
    const channel = new MessageChannelMain();
    const port1 = channel.port1;
    const port2 = channel.port2;
    this.mainPort = port1;
    port1.start();
    sdia('mc.attach', { id: this.id, hasPty: this.ptyProcess !== null });
    port1.on('message', (event) => {
      const data = event.data;
      if (typeof data === 'string' && this.ptyProcess) {
        sdia('mc.from-renderer.string', { id: this.id, bytes: data.length });
        this.ptyProcess.write(data);
      } else if (data && typeof (data as { type?: string }).type === 'string') {
        const msg = data as { type: string; cols?: number; rows?: number; nonce?: number };
        // DM-D4 P1 · Layer-1 pong branch · resolves the pingChannel() round-trip.
        // The renderer echoes {type:'scs:pong', nonce} from its port.onmessage arm;
        // matching the pending nonce resolves the Connection-Liveness Concluder true.
        if (msg.type === 'scs:pong' && typeof msg.nonce === 'number') {
          const resolver = this.pingPending.get(msg.nonce);
          if (resolver) {
            this.pingPending.delete(msg.nonce);
            resolver(true);
          }
          return;
        }
        if (msg.type === 'resize' && this.ptyProcess && msg.cols && msg.rows) {
          sdia('mc.from-renderer.resize', { id: this.id, cols: msg.cols, rows: msg.rows });
          try {
            this.ptyProcess.resize(msg.cols, msg.rows);
          } catch (err) {
            console.error('[Session] resize failed:', err);
          }
        }
      }
    });
    win.webContents.on('did-finish-load', () => {
      sdia('renderer.did-finish-load · sending port', { id: this.id });
      try {
        win.webContents.postMessage('scs:port', { sessionId: this.id }, [port2]);
        sdia('renderer.port-sent', { id: this.id });
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        sdia('renderer.port-send-FAIL', { id: this.id, error: msg });
      }
      // D-UP · the Stand By overlay on the shader-OFF legacy path (the visible xterm window;
      // under the default shader-wrap the presenter's own did-finish-load carries it instead).
      if (this.standByPending && !this.presenterWindow) {
        try {
          win.webContents.send('scs:stand-by');
          sdia('session.standby.shown', { id: this.id, surface: 'terminal' });
        } catch {
          /* cosmetic */
        }
      }
    });
    win.webContents.on('did-fail-load', (_e, code, desc) => {
      sdia('renderer.did-fail-load', { id: this.id, code, desc });
    });
    win.webContents.on('render-process-gone', (_e, details) => {
      sdia('renderer.render-process-gone', { id: this.id, details });
    });
  }

  show(focus: boolean): void {
    // C477 · circuit logging (user: 'the window doesn't seem to resize') — every show()
    // narrates which surface it operates on and whether the nudge will fire.
    sdia('session.show', {
      id: this.id,
      focus,
      shaderWrap: this.shaderWrapActive,
      hasWindow: !!(this.window && !this.window.isDestroyed()),
      hasPresenter: !!(this.presenterWindow && !this.presenterWindow.isDestroyed()),
      msSinceLastNudge: Date.now() - this.lastRedrawNudgeAtMs,
    });
    this.ensureWindow();
    // SWRM · operate on the visible surface (presenter when shader-wrapped, else the terminal
    // window). OFF: visibleWindow() === this.window === the just-ensured window — identical.
    const vis = this.visibleWindow();
    if (!vis || vis.isDestroyed()) return;
    if (focus) {
      vis.show();
      vis.focus();
    } else {
      vis.showInactive();
    }
    // C473 · THE TAB-BACK REPAINT (r4 Fix A · the blank-terminal root): an idle xterm only
    // dirty-paints the animated status row — the presenter's canvas holds black plus that
    // one row unless the offscreen source is forced to emit a FULL frame on every show.
    if (this.shaderWrapActive && this.window && !this.window.isDestroyed()) {
      this.window.webContents.invalidate();
      // C475 · the redraw nudge — invalidate alone re-emits the COMPOSITOR's frame; only a
      // SIGWINCH makes Claude Code REDRAW its content (the user-proven resize cure).
      this.nudgeRedrawViaResize();
    }
  }

  hide(): void {
    const vis = this.visibleWindow();
    if (vis && !vis.isDestroyed()) {
      vis.hide();
    }
  }

  focus(): void {
    this.show(true);
  }

  sendInput(text: string): void {
    // DD-4: SIEK preferred. ptyMaster.write fallback used in α-1 for simplicity.
    // α-4 wires sendInputEvent as primary path with this as fallback.
    if (this.ptyProcess) {
      this.ptyProcess.write(text);
    }
  }

  sendInputViaKeystroke(text: string): void {
    if (!this.window || this.window.isDestroyed()) return;
    const wc = this.window.webContents;
    for (const ch of text) {
      try {
        wc.sendInputEvent({ type: 'char', keyCode: ch });
      } catch (err) {
        console.error('[Session] sendInputEvent failed:', err);
      }
    }
  }

  // SWRM · D1 Wave 5c · replay a forwarded pointer event onto the offscreen xterm. this.window
  // is the offscreen render source; sendInputEvent delivers to its webContents regardless of OS
  // focus, and xterm runs its own mouse-mode / scrollback translation (full pass-through parity).
  // Only reached when the shader-wrap split is active (the presenter is the event source).
  forwardMouse(ev: MouseForward): void {
    if (!this.window || this.window.isDestroyed()) return;
    const wc = this.window.webContents;
    try {
      if (ev.kind === 'wheel') {
        wc.sendInputEvent({
          type: 'mouseWheel',
          x: ev.x,
          y: ev.y,
          deltaX: ev.deltaX ?? 0,
          deltaY: ev.deltaY ?? 0,
          canScroll: true,
          modifiers: ev.modifiers,
        });
      } else {
        const type = ev.kind === 'down' ? 'mouseDown' : ev.kind === 'up' ? 'mouseUp' : 'mouseMove';
        wc.sendInputEvent({
          type,
          x: ev.x,
          y: ev.y,
          button: ev.button ?? 'left',
          clickCount: ev.clickCount,
          modifiers: ev.modifiers,
        });
      }
    } catch (err) {
      sdia('session.osr.mouse-FAIL', { id: this.id, error: String(err) });
    }
  }

  // SWRM · D3 · live-swap THIS session's presenter to a new render mode (the Watcher-Cascade-Pipe
  // terminus · hops 4-5 already exist from D1). No-op when there is no presenter (shader-wrap off
  // or not yet created — the spawn hydration path covers a not-yet-built presenter).
  setRenderMode(mode: ShaderRenderMode): void {
    const p = this.presenterWindow;
    if (!p || p.isDestroyed()) return;
    try {
      p.webContents.send('scs:renderMode', mode);
      // THE NO-SHADER DISABLE (the final cursor Diamond): 'off' stands the in-surface virtual
      // down on the offscreen; any shaded mode re-enables it.
      if (this.window && !this.window.isDestroyed()) {
        setCursorOverlayEnabled(this.window, mode !== 'off');
      }
      // The COMBINED brand cursor on 'off' (no virtual → the real carries the full mark).
      setRealCursorCombined(p, mode === 'off');
      sdia('session.osr.mode-swap', { id: this.id, mode });
    } catch (err) {
      sdia('session.osr.mode-swap-FAIL', { id: this.id, error: String(err) });
    }
  }

  // C919 · live-swap THIS session's presenter frame governor (the setRenderMode idiom).
  setShaderFps(fps: number): void {
    const p = this.presenterWindow;
    if (!p || p.isDestroyed()) return;
    try {
      p.webContents.send('scs:shaderFps', fps);
      sdia('session.osr.fps-swap', { id: this.id, fps });
    } catch (err) {
      sdia('session.osr.fps-swap-FAIL', { id: this.id, error: String(err) });
    }
  }

  onExit(handler: (code: number, signal: number) => void): void {
    this.exitHandlers.push(handler);
  }

  isAlive(): boolean {
    return this.ptyProcess !== null;
  }

  getWindow(): BrowserWindow | null {
    return this.window;
  }

  // DM-D4 W1 (Ochre-E §B.5) · MAIN-side setter called by cli-handler makeSession
  // on the mode==='resume' path. NOT daemon-side manager.ts (layer-incorrect per S4 §0).
  markResumed(): void {
    this.wasResumed = true;
  }

  // DM-D4 W1 (Ochre-E §B.5) · reader called by deriveIsReEngaged() in messageDispatch.ts.
  isReEngaged(): boolean {
    return this.wasResumed;
  }

  // D-UP · THE STAND BY OVERLAY (main side) — set by cli-handler open-session when the
  // registry entry carries the standBy marker (a manualMode primed spawn: the Gitm Resolver
  // class). The presenter's did-finish-load reads the flag and paints the overlay; delivery
  // (cli-handler sendMessage → clearStandBy) drops it the moment the directive enters.
  markStandBy(): void {
    this.standByPending = true;
  }

  hasStandBy(): boolean {
    return this.standByPending;
  }

  clearStandBy(): void {
    if (!this.standByPending) return;
    this.standByPending = false;
    const targets = [this.presenterWindow, this.window];
    for (const target of targets) {
      if (!target || target.isDestroyed()) continue;
      try {
        target.webContents.send('scs:stand-by-clear');
      } catch {
        /* cosmetic — never block the delivery */
      }
    }
    sdia('session.standby.cleared', { id: this.id });
  }

  // DM-D4 P1 · Layer-1 Window↔Main MessagePort Ping-Back · Connection-Liveness
  // Concluder. Posts {type:'scs:ping', nonce} via the live mainPort; the renderer's
  // attachPort onmessage arm echoes {type:'scs:pong', nonce}; resolves true on pong
  // within 500ms, false on mainPort-null or timeout. This is the round-trip the bridge
  // previously lacked — it MEASURES the channel rather than inferring it from a status
  // flag or the fkis.execute.complete ok:true false-positive. Wired at the START of
  // executeFkis (messageDispatch.ts) so channel-liveness is logged right before the send.
  pingChannel(): Promise<boolean> {
    if (!this.mainPort) {
      sdia('fkis.ping.roundtrip', { sessionId: this.id, ok: false, reason: 'mainPort-null', ms: 0 }, 'ping');
      return Promise.resolve(false);
    }
    const nonce = ++this.pingNonceSeq;
    const t0 = Date.now();
    const port = this.mainPort;
    return new Promise<boolean>((resolve) => {
      let settled = false;
      const settle = (ok: boolean) => {
        if (settled) return;
        settled = true;
        this.pingPending.delete(nonce);
        sdia('fkis.ping.roundtrip', { sessionId: this.id, ok, ms: Date.now() - t0 }, 'ping');
        resolve(ok);
      };
      this.pingPending.set(nonce, settle);
      try {
        port.postMessage({ type: 'scs:ping', nonce });
      } catch (err) {
        sdia('fkis.ping.post-FAIL', { sessionId: this.id, error: String(err) }, 'ping');
        settle(false);
        return;
      }
      setTimeout(() => settle(false), 500);
    });
  }

  /**
   * D-WC-1 · Window-Close Signal · record the session offline on a USER window close.
   *
   * `offline` = not-live, resumable (SessionStatus vocabulary) — an anchor simply fails
   * PAOLR's 'alive' test on next load and re-spawns, so recording offline here does NOT
   * strand a session the relaunch would resume.
   *
   * Two guards:
   *  (a) isTearingDown() — app-quit / turn-over closes EVERY window via disposeAll; those
   *      mass-closes must NOT storm the registry (and boot-reset markAllSessionsOffline
   *      already offlines every entry on next launch). Skip during teardown.
   *  (b) statusRecorded — fire-once; the shader-wrap presenter close + the offscreen
   *      window close both route here (and dispose() may close after), so only the first
   *      close writes.
   *
   * PTY interplay: onExit (:277) leaves the offline write RESERVED (no registry write today),
   * so there is no competing writer — this is the sole offline signal. updateSessionStatus
   * is idempotent (find-by-ULID; missing entry → no-op) and the write is fire-and-forget.
   */
  private recordOfflineOnUserClose(): void {
    if (isTearingDown() || this.statusRecorded) return;
    this.statusRecorded = true;
    sdia('session.window.closed.offline', { id: this.id });
    void updateSessionStatus(this.id, 'offline').catch((err) => {
      sdia('session.window.closed.offline-FAIL', { id: this.id, error: String(err) });
    });
  }

  /**
   * D-GTC · THE GRACEFUL TERMINAL CLOSE · the awaitable soft-close path (the Diameter to
   * dispose()'s hard/sync path). The `claude` CLI IGNORES SIGTERM but FLUSHES its transcript
   * on SIGINT (Ctrl-C · its graceful pipeline ~5s). Today dispose() sends a bare `.kill()`
   * (SIGHUP) and NEVER awaits the child exit — the transcript can be reaped mid-flush.
   *
   * gracefulClose: (a) resolve immediately if there is no live pty; (b) register a one-shot
   * pty onExit → resolve (idempotent via `settled`); (c) write `\x03` (Ctrl-C) to pty stdin so
   * CC runs its graceful flush; (d) arm a `graceMs` fallback that, if the child has not exited,
   * escalates to SIGKILL (POSIX) / bare kill() (Windows — a signal arg THROWS on win32) then
   * resolves. NEVER hangs — the timeout always resolves. dispose() stays the hard/sync path for
   * non-quit callers (user window-close); gracefulClose is the new awaitable path for the quit /
   * SCP-EXIT funnels. SIGKILL / power-loss is UNCATCHABLE and OUT OF SCOPE (the RI backstop).
   */
  /**
   * D-GTC S5 · fire the "Shutting Down…" overlay on the VISIBLE terminal surface. Under the
   * default shader-wrap the visible window is the presenter (the offscreen xterm is never seen),
   * so target the presenter first; fall back to the terminal window (shader-OFF path). Guarded +
   * fire-and-forget cosmetic — never blocks the graceful close.
   */
  private notifyShuttingDown(): void {
    const target =
      this.presenterWindow && !this.presenterWindow.isDestroyed()
        ? this.presenterWindow
        : this.window && !this.window.isDestroyed()
          ? this.window
          : null;
    if (!target) return;
    try {
      target.webContents.send('scs:shutting-down');
    } catch {
      /* window tearing down mid-send — cosmetic, ignore */
    }
  }

  gracefulClose(graceMs = 5000): Promise<void> {
    return new Promise<void>((resolve) => {
      const pty = this.ptyProcess;
      // (a) no live pty (never spawned, or already exited via onExit :285 which nulls it) → done.
      if (!pty) {
        sdia('session.graceful-close.no-pty', { id: this.id });
        resolve();
        return;
      }
      let settled = false;
      let timer: ReturnType<typeof setTimeout> | null = null;
      const finish = (): void => {
        if (settled) return;
        settled = true;
        if (timer) {
          clearTimeout(timer);
          timer = null;
        }
        resolve();
      };
      // D-GTC S5 · surface the "Shutting Down…" overlay on the visible terminal surface for the
      // graceful-flush window, so the user sees the graceful close (not a frozen terminal).
      this.notifyShuttingDown();
      // (b) one-shot: the REAL child exit (post-flush) resolves the wait.
      pty.onExit(() => {
        sdia('session.graceful-close.pty-exit', { id: this.id });
        finish();
      });
      // (c) Ctrl-C → CC graceful transcript flush. Guarded — a racing exit may already
      // have torn the pty's write end down.
      try {
        pty.write('\x03');
        sdia('session.graceful-close.sigint-sent', { id: this.id });
      } catch (err) {
        sdia('session.graceful-close.sigint-FAIL', { id: this.id, error: String(err) });
      }
      // (d) fallback: if the child has not exited within the grace window, hard-kill it.
      // Cross-platform: win32 rejects a signal arg (bare kill()); POSIX takes SIGKILL.
      timer = setTimeout(() => {
        if (settled) return;
        sdia('session.graceful-close.grace-timeout-sigkill', { id: this.id, graceMs });
        try {
          if (process.platform === 'win32') {
            pty.kill();
          } else {
            pty.kill('SIGKILL');
          }
        } catch (err) {
          sdia('session.graceful-close.sigkill-FAIL', { id: this.id, error: String(err) });
        }
        finish();
      }, graceMs);
    });
  }

  private disposedOnce = false;
  dispose(): void {
    // C479 · re-entrancy guard — dispose() closes the presenter, whose 'closed' handler
    // routes back here on the user-close path; the second entry is a no-op.
    if (this.disposedOnce) return;
    this.disposedOnce = true;
    if (this.ptyProcess) {
      try {
        this.ptyProcess.kill();
      } catch (err) {
        console.error('[Session] pty.kill failed:', err);
      }
      this.ptyProcess = null;
    }
    if (this.mainPort) {
      try {
        this.mainPort.close();
      } catch (err) {
        console.error('[Session] mainPort.close failed:', err);
      }
      this.mainPort = null;
    }
    // SWRM · tear the presenter down with the session (it is bound to this.window's lifecycle).
    if (this.presenterWindow && !this.presenterWindow.isDestroyed()) {
      try {
        this.presenterWindow.close();
      } catch (err) {
        console.error('[Session] presenter.close failed:', err);
      }
    }
    this.presenterWindow = null;
    if (this.window && !this.window.isDestroyed()) {
      clearLatestWindowFrame(this.window.id); // WRA-DARK · release the cached frame with the window
      this.window.close();
    }
    this.window = null;
  }
}

// C918 · NodePtyModule + loadNodePty PRUNED — node-pty is loaded ONLY in the pty host
// utilityProcess (ptyHost.ts); this process talks RemotePty (ptyHostClient.ts).
