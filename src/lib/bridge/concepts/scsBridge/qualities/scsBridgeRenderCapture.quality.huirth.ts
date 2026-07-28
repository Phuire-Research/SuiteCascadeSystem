/**
 * scsBridgeRenderCapture · D-N2 · Neon PlayTester · scs_render_capture MCP tool
 *
 * Captures the target window's CURRENT render to a PNG. For a shader-wrapped (offscreen)
 * SCP the STREAMED latest paint frame is returned — the render context PRIOR to the shader
 * pass, AS IT STREAMS (scpPresenter's paint hook keeps the most recent NativeImage in the
 * windowOrchestrate latest-frame store; no repaint round-trip). Flat windows fall back to
 * capturePage(). The PNG lands under `<cwd>/Cascades/Bridge/playtests/<runId>/` — the agent
 * consumer Reads the image (VISUAL Lambda: the Chamfer-Clip class of build-green-but-
 * visually-broken defects becomes agent-catchable).
 *
 * BRIDGE-OWNED per SORD §2 (the SCP turn-over kills its own server mid-test) and
 * WINDOW-GENERAL (target: windowId → sessionId [terminal] → scpName → the ACTIVE SCP) —
 * the SCS-Bridge is the Grounding Literal Bridge. Sibling of scsBridgeOrchestrateWindow
 * (whose inline `capture` step shares the same captureWindowRender model function).
 *
 * Async form: createAsyncMethodWithConcepts — ONE controller.fire carrying
 * strategyData_muxifyData({renderCapture: result}) → the SCP manifold tail returns it.
 * Reducer {} · no state mutation. The PNG on disk IS the Lambda; debug.json logs
 * renderCapture.received/.result; the Electron side logs cli-handler.capture-window-render.done.
 *
 * TQNI invariant: 'Scs Bridge Render Capture' camelCases to the scsBridge.e key
 * 'scsBridgeRenderCapture' (byte-matches the metadata qualityName).
 * Citation: SORD-TOOL-SYSTEM.md §1-§3 · WGB §D-N-ACT ENHANCED · D-N2.
 */

import {
  createQualityCardWithPayload,
  createAsyncMethodWithConcepts,
  selectPayload,
  muxiumConclude,
  strategySuccess,
  strategyData_muxifyData,
} from 'stratimux';
import type {
  ScsBridgeState,
  ScsBridgeRenderCapturePayload,
  ScsBridgeRenderCapture,
} from '../scsBridge.types';
import { sendControlRequest } from '../../../electronWindowSpawn';
import { log } from '../../../debugLog';

export type { ScsBridgeRenderCapture };

// A capture is a single fast operation — well under the orchestrate sequence cap.
const RENDER_CAPTURE_TIMEOUT_MS = 10_000;

export const scsBridgeRenderCapture = createQualityCardWithPayload<
  ScsBridgeState,
  ScsBridgeRenderCapturePayload
>({
  type: 'Scs Bridge Render Capture',
  reducer: () => ({}),
  methodCreator: () =>
    createAsyncMethodWithConcepts(({ controller, action }) => {
      const payload = selectPayload<ScsBridgeRenderCapturePayload>(action);
      const runId =
        typeof payload.runId === 'string' && payload.runId.length > 0
          ? payload.runId
          : `run-${Date.now()}`;

      log('renderCapture.received', {
        runId,
        label: payload.label ?? null,
        target: payload.target ?? null,
      });
      console.log('[SCS-Bridge D-N2] render-capture · runId=', runId, '· label=', payload.label ?? 'render');

      void (async (): Promise<void> => {
        const result = await sendControlRequest(
          [
            'capture-window-render',
            JSON.stringify({ target: payload.target, label: payload.label, runId }),
          ],
          RENDER_CAPTURE_TIMEOUT_MS,
        );
        log('renderCapture.result', {
          runId,
          ok: result.ok,
          error: result.error ?? null,
        });
        console.log(
          '[SCS-Bridge D-N2] render-capture result · runId=',
          runId,
          '· ok=',
          result.ok,
          result.error ? `· error=${result.error}` : '',
        );
        controller.fire(
          action.strategy
            ? strategySuccess(
                action.strategy,
                strategyData_muxifyData(action.strategy, { renderCapture: result }),
              )
            : muxiumConclude(),
        );
      })();
    }),
});
