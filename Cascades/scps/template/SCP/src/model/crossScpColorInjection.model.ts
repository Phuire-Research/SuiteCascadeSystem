/**
 * crossScpColorInjection.model.ts — D-PXT · PXT-2 · THE ORIGIN-BLIND CROSS-SCP COLOR INJECTION
 *
 * THE NAME LAW: held · token-free · never copied by the mint (no SUITE8_/Suite8/suite8 tokens in this
 * file anor its import specifiers — the shared-stratum discipline scpSyncLibrary.model documents).
 *
 * THE COMMISSION (D-PXT · DIAMOND 2): once D-PCL's round-trip color circuit stands (click → the
 * Induction → the Huirth merge-writes hifiConfig.json → the RETURN broadcast paints), the cross-SCP
 * means is INJECTION, not a new circuit. Under a Specified locality on Pewter, the color click's SAME
 * deck-matched Induction ('Scs Bridge Apply Hifi Config') travels to THE TARGET SCP's WebSocket instead
 * of the own server's. The target's server is ORIGIN-BLIND — the action arrives exactly as its own
 * clients' actions arrive (any /muxium connection is a client · webSocketServer.principle deferred
 * registration on first message); the identical round trip runs; the TARGET's windows re-tint on ITS
 * OWN return; the TARGET's hifiConfig.json carries the ship truth. THE PORT is the address.
 *
 * THE FLOW (sendColorToTarget):
 *   1. THE PORT LANE — fetch the target's port by NAME (GET /scp-port/:scpName · PXT-1 · the SCP's
 *      own bridge.json boundScps[scpName].port). The client stays name-only until the moment of send.
 *   2. THE EPHEMERAL CONNECT — open a second WebSocket to ws://localhost:<port>/muxium (the URL shape
 *      the own webSocketClient principle composes · here to the TARGET's port).
 *   3. THE INJECTION — send the SAME Induction action the own click sends, serialized through the OWN
 *      pipeline (strategyDetermine · the createInductionQualityCardWithPayload reducer's wrap · then
 *      dehydrateAction · the webSocketClient principle's send). NEVER hand-rolled: the action is built
 *      by the caller's deck constructor (buildInductionAction) — the deck-matched shape verbatim.
 *   4. THE RECEIPT — await the return broadcast ('Scs Bridge Set Hifi Config Relay') arriving ON the
 *      ephemeral socket (the target's Huirth Real broadcasts to ALL connected clients with no routing
 *      key · webSocketServer.principle global-broadcast branch — the ephemeral socket is registered, so
 *      it receives the return). Bounded ~5s: a timeout is an HONEST report (the write may still have
 *      landed — the target painted on its own windows), NOT a failure.
 *   5. THE CLOSE — close the ephemeral socket (win or timeout).
 *
 * THE α-FIREWALL: this foreign push writes NOTHING to the SENDER's own layers — no localStorage
 * (the α intent-write is for the OWN colors only), no own-window paint (the target paints on ITS
 * return). SuiteColorSelection's Specified fork calls THIS instead of the own-controller dispatch.
 *
 * TELEMETRY: color-write.target {scp, spectra} at the SENDING side — console only (the SCP-local
 * telemetry sinks are Huirth-side principles · no client-reachable sink lane exists for the click
 * path · noted honestly).
 *
 * Citation: webSocketClient.principle.ts (the URL shape ws://host/muxium · the dehydrateAction send)
 * Citation: webSocketServer.principle.ts (origin-blind deferred registration · the no-routing-key
 *   global-broadcast branch — the return relay reaches the ephemeral socket)
 * Citation: muxonomy.model.ts createInductionQualityCardWithPayload (the strategyDetermine wrap)
 * Citation: cascadeMemoryQuery.model.ts /scp-port/:scpName (PXT-1 · the port-by-name lane)
 * Citation: hifiConfig.model.ts loadTargetHifiConfig (the by-name client-fetch idiom mirrored here)
 */
import type { AnyAction } from 'stratimux';
import { strategyDetermine } from 'stratimux';
import { dehydrateAction } from '../concepts/webSocketClient/model/actionDehydration.model';

// The receipt type string — the target's RETURN broadcast (byte-match to setHifiConfigRelay.quality.ts
// + scsBridge.muxonomy.ts actionExchange.serverToClient · 'Scs Bridge Set Hifi Config Relay').
const RECEIPT_ACTION_TYPE = 'Scs Bridge Set Hifi Config Relay';

// The receipt await bound — a generous window for the target's merge-write + muxiumTimeOut broadcast
// (~30ms) + WS round trip. A timeout past this is an HONEST report, never a failure verdict.
const RECEIPT_TIMEOUT_MS = 5000;

export type CrossScpColorInjectionResult = {
  ok: boolean;
  // 'receipt'  — the return relay arrived on the ephemeral socket (the round trip completed).
  // 'timeout'  — no receipt within the bound (the write may still have landed · honest report).
  // 'no-port'  — the target is unknown / unbound / portless (GET /scp-port 404).
  // 'ws-error' — the ephemeral connection failed to open anor errored before the receipt.
  outcome: 'receipt' | 'timeout' | 'no-port' | 'ws-error';
  scpName: string;
  port: number | null;
  detail: string;
};

// Fetch the target SCP's live WebSocket port by NAME (PXT-1 · GET /scp-port/:scpName). Null on
// unknown / unbound / portless (the Honest-Absence Law — the caller reports 'no-port', never a phantom).
export async function fetchTargetPort(scpName: string): Promise<number | null> {
  if (typeof window === 'undefined') return null;
  if (!scpName) return null;
  try {
    const r = await fetch(`/scp-port/${encodeURIComponent(scpName)}`);
    if (!r.ok) return null;
    const j = (await r.json()) as { ok?: boolean; port?: number };
    if (j && j.ok === true && typeof j.port === 'number' && Number.isFinite(j.port) && j.port > 0) {
      return j.port;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * sendColorToTarget — the origin-blind injection (PXT-2).
 *
 * @param scpName              the TARGET citizen's name (the Specified locality)
 * @param colors               the sparse per-spectrum hex map (the click's payload)
 * @param buildInductionAction the caller's DECK constructor — builds the SAME Induction action the own
 *                             click dispatches (deck.d.client.d.scsBridge.e.scsBridgeApplyHifiConfig).
 *                             Passed in so the model reuses the deck-matched shape verbatim, never a
 *                             hand-rolled action literal. Returns the plain Induction AnyAction.
 */
export async function sendColorToTarget(
  scpName: string,
  colors: Record<string, string>,
  buildInductionAction: (colors: Record<string, string>) => AnyAction,
): Promise<CrossScpColorInjectionResult> {
  const spectra = Object.keys(colors ?? {}).length;
  // THE SENDING-SIDE TELEMETRY — console only (no client-reachable sink lane · noted honestly).
  console.log('[crossScpColorInjection] color-write.target', { scp: scpName, spectra });

  if (typeof window === 'undefined') {
    return { ok: false, outcome: 'ws-error', scpName, port: null, detail: 'no window (SSR)' };
  }

  // 1. THE PORT LANE — learn the target's port by name (client stays name-only until now).
  const port = await fetchTargetPort(scpName);
  if (port === null) {
    console.warn('[crossScpColorInjection] no port for target · injection skipped', { scp: scpName });
    return { ok: false, outcome: 'no-port', scpName, port: null, detail: 'target unknown / unbound / portless' };
  }

  // 3. THE INJECTION SHAPE — build the deck-matched Induction, then run the OWN serialization pipeline:
  //    strategyDetermine (the induction reducer's wrap for clientStateKey routing · the server Real
  //    handles both strategy + plain) THEN dehydrateAction (the principle's circular-ref-safe send).
  //    NEVER hand-rolled — buildInductionAction is the caller's deck constructor.
  const inductionAction = buildInductionAction(colors);
  const determined = inductionAction.strategy ? inductionAction : strategyDetermine(inductionAction);
  const wireAction = dehydrateAction(determined);

  // 2 + 4 + 5. THE EPHEMERAL CONNECT → INJECT → AWAIT RECEIPT → CLOSE.
  return new Promise<CrossScpColorInjectionResult>((resolve) => {
    let settled = false;
    let ws: WebSocket | null = null;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const finish = (result: CrossScpColorInjectionResult): void => {
      if (settled) return;
      settled = true;
      if (timer !== undefined) clearTimeout(timer);
      try {
        ws?.close();
      } catch {
        /* already closing — ignore */
      }
      resolve(result);
    };

    try {
      // THE URL SHAPE — the own webSocketClient principle composes ws://<host>/muxium; the ephemeral
      // twin addresses the TARGET's port (localhost — the workspace SCPs are co-hosted · the bridge
      // boundScps ports are localhost ports · composeRingOrigin's http://localhost:<port> precedent).
      const url = `ws://localhost:${port}/muxium`;
      ws = new WebSocket(url);
    } catch (err) {
      finish({ ok: false, outcome: 'ws-error', scpName, port, detail: `WebSocket ctor threw: ${String(err)}` });
      return;
    }

    // THE RECEIPT BOUND — a timeout is HONEST (the write may still have landed; the target painted on
    // ITS windows on ITS own return), never a failure verdict.
    timer = setTimeout(() => {
      finish({
        ok: true,
        outcome: 'timeout',
        scpName,
        port,
        detail: 'no receipt within bound · target may still have painted (honest report)',
      });
    }, RECEIPT_TIMEOUT_MS);

    ws.addEventListener('open', () => {
      try {
        // THE INJECTION — the SAME serialized Induction the own client sends (the origin-blind delivery).
        // This is the ephemeral socket's FIRST message → the target deferred-registers it as a fresh
        // client (webSocketServer.principle · generateClientStateId) AND routes the action into its
        // stream. The Huirth Real merge-writes hifiConfig.json + broadcasts the return to ALL clients.
        ws?.send(JSON.stringify(wireAction));
        console.log('[crossScpColorInjection] injection sent to target', { scp: scpName, port, spectra });
      } catch (err) {
        finish({ ok: false, outcome: 'ws-error', scpName, port, detail: `send threw: ${String(err)}` });
      }
    });

    ws.addEventListener('message', (message: MessageEvent) => {
      // Ignore the server's keep-alive 'ping' frames (webSocketServer.principle sends these every 3s).
      if (message.data === 'ping') return;
      try {
        const act = JSON.parse(String(message.data)) as { type?: string };
        // THE RECEIPT — the return relay arriving on THIS ephemeral socket proves the round trip
        // completed (the global broadcast reached the registered ephemeral client).
        if (act && act.type === RECEIPT_ACTION_TYPE) {
          console.log('[crossScpColorInjection] receipt received · round trip complete', { scp: scpName, port });
          finish({ ok: true, outcome: 'receipt', scpName, port, detail: 'return relay received on ephemeral socket' });
        }
        // Other frames (assign-client-state-id · atomic state updates) are the registration handshake —
        // ignored; we await ONLY the color receipt.
      } catch {
        /* non-JSON frame — ignore (never throws to the caller) */
      }
    });

    ws.addEventListener('error', () => {
      finish({ ok: false, outcome: 'ws-error', scpName, port, detail: 'ephemeral WebSocket error' });
    });

    ws.addEventListener('close', () => {
      // A close BEFORE a receipt (and before the timeout) is honestly reported as a ws-error — but if we
      // already settled (receipt anor timeout), finish() no-ops.
      finish({ ok: false, outcome: 'ws-error', scpName, port, detail: 'ephemeral socket closed before receipt' });
    });
  });
}
