/**
 * setHifiConfigRelay Quality — Dual-Deployment (Huirth emitter + Client receiver)
 *
 * D-PCL · THE ROUND-TRIP COLOR CIRCUIT (PCL-1 (c) · the RETURN SET · the round trip's paint).
 *
 * Huirth: the scsBridgeApplyHifiConfig Real emits this (via webSocketServerAppendToActionQue) after it
 *   merge-writes hifiConfig.json — it carries the FRESH merged config IN the payload (one fewer round ·
 *   no client re-GET of /hifi-config). Server-side this reducer/method is a structural no-op (there is
 *   no documentElement to tint · the model helpers guard on `typeof document === 'undefined'`).
 *
 * Client: received via actionExchange.serverToClient (Path B explicit broadcast · mirrors the
 *   setBridgeJsonRelay / setHighlightTarget precedent). The method re-runs the FULL boot precedence
 *   (localStorage < JSON · applyHifiConfigWithOverrides) so the whole app re-tints uniformly. THIS —
 *   the receipt of the truth — is where the color finally paints, no earlier than every other client.
 *
 * The color is NOT render-state: it is a documentElement :root side-effect. So the reducer is
 * nullReducer (no state change · shortest-path per Scholar S12) and the method carries the side-effect
 * (createMethodWithState · the forceSync.quality.ts precedent for a side-effecting client method).
 *
 * Type-string source of truth: the actionExchange declaration in scsBridge.muxonomy.ts.
 * Must match EXACTLY ('Scs Bridge Set Hifi Config Relay' · Verbose Split).
 *
 * Citation: setBridgeJsonRelay.quality.ts (dual-deployment relay exemplar)
 * Citation: webSocketClient/qualities/forceSync.quality.ts (nullReducer + side-effecting method)
 * Citation: notification/qualities/addNotification.quality.ts (dual-deployment exemplar)
 * Citation: STRATIMUX-REFERENCE.md "🚀 Critical Reducer Performance Optimization"
 */
import {
  createQualityCardWithPayload,
  createMethodWithState,
  selectPayload,
  muxiumConclude,
  nullReducer,
} from 'stratimux';
import type {
  ScsBridgeClientState,
  ScsBridgeSetHifiConfigRelayPayload,
} from '../scsBridge.type';
import { applyHifiConfigWithOverrides } from '../../../model/hifiConfig.model';

export type { ScsBridgeSetHifiConfigRelayPayload };

export const scsBridgeSetHifiConfigRelay = createQualityCardWithPayload<
  ScsBridgeClientState,
  ScsBridgeSetHifiConfigRelayPayload
>({
  type: 'Scs Bridge Set Hifi Config Relay',
  reducer: nullReducer,
  methodCreator: () =>
    createMethodWithState(({ action }) => {
      const payload = selectPayload<ScsBridgeSetHifiConfigRelayPayload>(action);
      const config = payload?.scsBridgeHifiConfig;
      if (config) {
        // The RETURN paints: re-run the boot precedence (localStorage < JSON) against the fresh config.
        // SSR-/server-safe — the model helpers guard on documentElement absence (no-op on Huirth).
        applyHifiConfigWithOverrides(config);
        console.log(
          '[SCS-Bridge setHifiConfigRelay] Applied fresh hifiConfig (round-trip paint) · colors=',
          Object.keys(config.colors ?? {}).length,
        );
      }
      if (action.strategy) {
        return action;
      }
      return muxiumConclude();
    }),
});
