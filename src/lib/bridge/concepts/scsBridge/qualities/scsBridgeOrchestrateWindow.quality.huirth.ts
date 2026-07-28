/**
 * scsBridgeOrchestrateWindow · D-N3 · Neon PlayTester · scs_orchestrate_window MCP tool
 *
 * THE PRIME MOVER of the PlayTester: executes an ATOMIC step sequence against a target
 * BrowserWindow and returns the FULL per-step result array to the /mcp caller. Sequences
 * (not single actions) are the turn-over epoch's design lesson — the CGDA arm→confirm
 * needs two clicks inside a 10s window; agent tool-call round-trips cannot hold that
 * beat, so the timing runs in Electron main (windowOrchestrate.ts) with zero latency
 * between steps.
 *
 * WINDOW-GENERAL (not SCP-specific): the SCP is the binding location, but a terminal
 * session window spawned through the bridge is equally targetable — the SCS-Bridge is
 * the Grounding Literal Bridge. Target resolution happens Electron-side (cli-handler
 * 'orchestrate-window'): windowId → sessionId → scpName → the ACTIVE SCP (bridge.json).
 *
 * BRIDGE-OWNED per SORD §2: the SCP's turn-over cycle kills its own server mid-test —
 * orchestration must live on the stable bridge, never inside the SCP. The CSSP
 * round-trip (sendControlRequest → control-server → cli-handler) is the seam; the
 * control-server ALWAYS writes a {ok,error?,data?} response line, so the sequence
 * result awaits back into this quality and out through the SCP manifold tail
 * (scpExtractAndSendResponse reads strategy.data → the JSON-RPC result). The agent
 * consumer READS the tool response (the gitm_load_log precedent); the client-dispatch
 * discipline stays ACK-only (SORD §3).
 *
 * Async form: createAsyncMethodWithConcepts (template: scsBridgeRelaySendMessage) —
 * ONE controller.fire carrying strategyData_muxifyData({orchestrate: result}).
 * Reducer {} · no state mutation. The sequence execution IS the Lambda; every run
 * logs orchestrate.received / orchestrate.result to debug.json (file-capturable) and
 * the Electron side logs orchestrate.sequence to electron-debug.json.
 *
 * TQNI invariant: the type string 'Scs Bridge Orchestrate Window' camelCases to the
 * scsBridge.e key 'scsBridgeOrchestrateWindow' (byte-matches the metadata qualityName).
 * Citation: SORD-TOOL-SYSTEM.md §1-§3 · WGB §D-N-ACT ENHANCED · D-N3.
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
  ScsBridgeOrchestrateWindowPayload,
  ScsBridgeOrchestrateWindow,
} from '../scsBridge.types';
import { sendControlRequest } from '../../../electronWindowSpawn';
import { log } from '../../../debugLog';

export type { ScsBridgeOrchestrateWindow };

// The Electron-side executor caps the sequence at 30s wall time; this timeout sits
// above it so a healthy long sequence returns rather than being cut mid-flight.
const ORCHESTRATE_REQUEST_TIMEOUT_MS = 35_000;

export const scsBridgeOrchestrateWindow = createQualityCardWithPayload<
  ScsBridgeState,
  ScsBridgeOrchestrateWindowPayload
>({
  type: 'Scs Bridge Orchestrate Window',
  reducer: () => ({}),
  methodCreator: () =>
    createAsyncMethodWithConcepts(({ controller, action }) => {
      const payload = selectPayload<ScsBridgeOrchestrateWindowPayload>(action);
      const steps = Array.isArray(payload.steps) ? payload.steps : [];
      const runId =
        typeof payload.runId === 'string' && payload.runId.length > 0
          ? payload.runId
          : `run-${Date.now()}`;

      log('orchestrate.received', {
        runId,
        stepCount: steps.length,
        target: payload.target ?? null,
      });
      console.log(
        '[SCS-Bridge D-N3] orchestrate-window · runId=',
        runId,
        '· steps=',
        steps.length,
      );

      void (async (): Promise<void> => {
        let result: { ok: boolean; error?: string; data?: unknown };
        if (steps.length === 0) {
          result = { ok: false, error: 'steps[] required' };
        } else {
          result = await sendControlRequest(
            [
              'orchestrate-window',
              JSON.stringify({ target: payload.target, steps, runId }),
            ],
            ORCHESTRATE_REQUEST_TIMEOUT_MS,
          );
        }
        log('orchestrate.result', {
          runId,
          ok: result.ok,
          error: result.error ?? null,
        });
        console.log(
          '[SCS-Bridge D-N3] orchestrate-window result · runId=',
          runId,
          '· ok=',
          result.ok,
          result.error ? `· error=${result.error}` : '',
        );
        controller.fire(
          action.strategy
            ? strategySuccess(
                action.strategy,
                strategyData_muxifyData(action.strategy, { orchestrate: result }),
              )
            : muxiumConclude(),
        );
      })();
    }),
});
