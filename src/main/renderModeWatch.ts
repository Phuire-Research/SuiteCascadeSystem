// SWRM · D3 · the Watcher-Cascade-Pipe (front of the pipe). The main process watches the
// per-project bridge.json; on a renderMode change it seeds the shared activeRenderMode (so future
// spawns hydrate correctly) AND live-swaps every running presenter (hops 4-5 — the scs:renderMode
// channel — already exist from D1). Sole writer of bridge.json is writeBridgeMetadata; this is a
// pure READER + reactor, so a manual hand-edit of bridge.json.renderMode live-swaps a terminal
// (the D3 Lambda · the headless proof before the D4 Settings panel dispatches through it).

import { type FSWatcher } from 'chokidar';
import { createWatcher } from '../lib/bridge/watcherSingleton.model';
import { readBridgeMetadata, bridgeMetadataPathPerProject } from '../lib/bridge/bridgeMetadata';
import { isShaderRenderMode, clampShaderFps } from '../shared/shaderRenderMode';
import {
  setActiveRenderMode,
  getActiveRenderMode,
  setActiveScpRenderMode,
  getActiveScpRenderMode,
  setActiveDefaultModel,
  getRecordedBridgeDefaultModel,
  setActiveShaderFps,
  getActiveShaderFps,
} from './session';
import { setAllScpRenderMode, setAllScpShaderFps } from './electronWindow';
import { sessionRegistry } from './session-registry';
import { sdia } from './diagnostics';

let watcher: FSWatcher | null = null;

async function applyFromBridgeJson(bridgeJsonPath: string): Promise<void> {
  const meta = await readBridgeMetadata(bridgeJsonPath);

  // Terminal render mode → live-swap every running terminal-session presenter. Absent/invalid →
  // leave the current mode (default Muxon) in place — never force a mode.
  const mode = meta?.renderMode;
  if (mode && isShaderRenderMode(mode) && mode !== getActiveRenderMode()) {
    setActiveRenderMode(mode); // future spawns hydrate to this.
    const sessions = sessionRegistry.list();
    for (const s of sessions) s.setRenderMode(mode); // live-swap every running presenter.
    sdia('renderMode.watch.applied', { mode, sessions: sessions.length });
  }

  // SWRM · SCP render mode → swap EVERY shaded SCP presenter (the Terminal pattern fanned to ALL
  // SCPs · the user-directed "set such via the bridge"). Independent of the terminal mode; the
  // huirth RMW is the live writer, so a main rewrite that clears the field leaves the swap in
  // place (absent → keep current · mirrors the terminal's persistence).
  const scpMode = meta?.scpRenderMode;
  if (scpMode && isShaderRenderMode(scpMode) && scpMode !== getActiveScpRenderMode()) {
    setActiveScpRenderMode(scpMode); // future SCP presenters hydrate to this.
    const swapped = setAllScpRenderMode(scpMode);
    sdia('scpRenderMode.watch.applied', { mode: scpMode, presenters: swapped });
  }

  // C919 · THE FRAME GOVERNOR · bridge.json.shaderFps → re-gate EVERY presenter (terminal
  // sessions AND SCPs — one cadence for the whole shaded surface). Absent/invalid → keep the
  // current fps (default 24 · Like Animation) — never force; the huirth RMW is the live writer.
  const fps = clampShaderFps(meta?.shaderFps);
  if (fps !== null && fps !== getActiveShaderFps()) {
    setActiveShaderFps(fps); // future presenters hydrate to this.
    const sessions = sessionRegistry.list();
    for (const s of sessions) s.setShaderFps(fps);
    const scpPresenters = setAllScpShaderFps(fps);
    sdia('shaderFps.watch.applied', { fps, sessions: sessions.length, scpPresenters });
  }

  // Model Control · bridge.json.defaultModel → the model EVERY subsequent spawn/resume
  // injects (`claude --model <id>`). Loose validation (any non-empty string) — the catalog
  // is advisory; the Settings UI may later add custom IDs/aliases. Applies at the NEXT
  // spawn — running instances keep their model (no live-swap possible).
  // C1104 · ruling d-A: the field is INFORMATIONAL — the spawn default is derived. The
  // recorded value is still tracked (diagnostics + the Settings UI read it back); it no
  // longer steers a spawn, so the comparison is against the RECORDED value, never the
  // derivation (comparing against the derivation would re-fire on every watch tick).
  const model = meta?.defaultModel;
  if (typeof model === 'string' && model.length > 0 && model !== getRecordedBridgeDefaultModel()) {
    setActiveDefaultModel(model);
    sdia('defaultModel.watch.applied', { model });
  }
}

export function startRenderModeWatch(userCwd: string): void {
  if (watcher) return;
  const bridgeJsonPath = bridgeMetadataPathPerProject(userCwd);
  // seed from the existing bridge.json (if any) before arming the watch.
  void applyFromBridgeJson(bridgeJsonPath).catch((err) =>
    sdia('renderMode.watch.seed-FAIL', { error: String(err) }),
  );
  // awaitWriteFinish absorbs the tmp-file + atomic-rename write so we read the settled file once.
  // C978 · THE OUTLIER, BROUGHT IN. This was the ONE chokidar arm bypassing the workspace fence
  // (C976 §1) — Electron-main side, so a sweep keyed on `watch(fenceWatchTargets(` could never
  // have caught it. It now takes the same singleton as every other arm, which both REGISTERS it
  // for release and FENCES it for the first time. The fence cannot drop this path: bridgeJsonPath
  // is DERIVED from userCwd two lines above, so it is inside the workspace by construction.
  watcher = createWatcher('renderModeWatch', bridgeJsonPath, userCwd, {
    ignoreInitial: true,
    awaitWriteFinish: { stabilityThreshold: 100, pollInterval: 20 },
  });
  watcher.on('all', () => {
    void applyFromBridgeJson(bridgeJsonPath).catch((err) =>
      sdia('renderMode.watch.read-FAIL', { error: String(err) }),
    );
  });
  sdia('renderMode.watch.started', { path: bridgeJsonPath });
}

export function stopRenderModeWatch(): void {
  if (watcher) {
    void watcher.close();
    watcher = null;
  }
}
