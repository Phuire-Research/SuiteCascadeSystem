/**
 * applyHifiConfig Quality — Client Diameter (Induction · ClientToServer)
 *
 * D-PCL · THE ROUND-TRIP COLOR CIRCUIT (PCL-1 · the Client half of the deck-matched pair).
 *
 * The color click dispatches THIS Induction. It does NOT paint. It routes the sparse per-spectrum
 * hex map through actionQue → the webSocketClient principle sends via WebSocket → the Huirth Real
 * ('Scs Bridge Apply Hifi Config' · same type string) merge-writes hifiConfig.json and broadcasts
 * the fresh merged config back to ALL clients. The visible color is the RETURN's act, never the click's.
 *
 * Diametric Induction pattern: createInductionQualityCardWithPayload routes to actionQue; the Huirth
 * Real (applyHifiConfig.quality.huirth.diameter.ts) executes by type-string lookup across the WebSocket
 * Diameter (actionExchange.clientToServer · scsBridge.muxonomy.ts).
 *
 * Type-string source of truth: the actionExchange declaration in scsBridge.muxonomy.ts.
 * This file MUST match EXACTLY ('Scs Bridge Apply Hifi Config' · Verbose Split).
 *
 * Citation: sendBridgeMessage.quality.client.diameter.ts (the Client Induction exemplar)
 * Citation: notification/qualities/helloWorld.quality.huirth.diameter.ts (Diameter pair contract)
 * Citation: muxonomy.model.ts createInductionQualityCardWithPayload
 */
import { createInductionQualityCardWithPayload } from '../../muxonomy/muxonomy.model';
import type {
  ScsBridgeClientState,
  ScsBridgeApplyHifiConfigPayload,
} from '../scsBridge.type';

export type { ScsBridgeApplyHifiConfigPayload };

export const scsBridgeApplyHifiConfigInduction = createInductionQualityCardWithPayload<
  ScsBridgeClientState,
  ScsBridgeApplyHifiConfigPayload
>('Scs Bridge Apply Hifi Config');
