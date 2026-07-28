/**
 * scsBridgeDeliverVermillion · VS · VSDT · scs_deliver_vermillion MCP tool
 *
 * The Vermillion-SORD-Delivery-Tool. Sibling to send_message (scsBridgeSendMessage).
 * Invoked by the ORCHESTRATOR (the CadmiumBulletin trigger, via the controller's
 * triggerDeliverVermillion → /mcp tools/call). Hands a spawned research worker its
 * Vermillion — the plan text plus the create+actualize-Planned-Query command — so
 * the worker can run: Research Topic → generate Planned Query (Topic + RI) → write
 * timestamped+titled Markdown (+ paired JSON) → dissipate (scs_dissipate_session).
 *
 * Delivery REUSES the send_message transport: the Vermillion body is prefixed with a
 * 'SCS:Vermillion' FIRST LINE (mirroring the SCS:Aspect first-line Cascade Directive
 * contract — a directive the worker reads + executes directly, NOT a tool call) and
 * the whole text is typed into the target session via dispatchFkisMessage (the same
 * CSSP live-keystroke relay scsBridgeSendMessage uses). EVRC origin discovery
 * (SCS_BRIDGE_ORIGIN_SCP anor SCS_BRIDGE_SCP_NAME) is identical to the send_message
 * leg — caller does NOT supply origin identity.
 *
 * Form-α (Method+Reducer · ACK-OD pattern). Reducer returns {} · no own-state
 * mutation. Side-effect-only Quality — the CSSP keystroke relay IS the Lambda.
 *
 * Template: scsBridgeSendMessage.quality.huirth.ts (form-α + dispatchFkisMessage transport)
 * Citation: EPOCH-DIAMOND §6 Macro VS VSDT · scs-bridge-base.skeleton.md §7 (SCS:<Aspect> first-line contract)
 */

import {
  createQualityCardWithPayload,
  createMethodWithConcepts,
  selectPayload,
  muxiumConclude,
  strategySuccess,
  strategyFailed,
} from 'stratimux';
import type {
  ScsBridgeState,
  ScsBridgeDeliverVermillionPayload,
  ScsBridgeDeliverVermillion,
} from '../scsBridge.types';
import { dispatchFkisMessage } from '../../../electronMessageDispatch';
import { log } from '../../../debugLog';
import { fdia } from '../../../fdia';

export type { ScsBridgeDeliverVermillion };

export const scsBridgeDeliverVermillion = createQualityCardWithPayload<
  ScsBridgeState,
  ScsBridgeDeliverVermillionPayload
>({
  type: 'Scs Bridge Deliver Vermillion',
  reducer: () => ({}),
  methodCreator: () =>
    createMethodWithConcepts(({ action }) => {
      console.log('[SCS-Bridge VERMILLION] method fired');
      const payload = selectPayload<ScsBridgeDeliverVermillionPayload>(action);
      const { sessionId, vermillion } = payload;

      // C382 L3 ENTRY LOG (L2→L3 boundary observable): FIRST structured entry of the method
      // body. A future silent skip (C381 class) names itself by this log's ABSENCE against a
      // received toolcall — the beat pre-load kill leaves no bail, only missing entry.
      log('fkis.method.entered', { sessionId, kind: 'deliverVermillion' });

      // IDTND guard: sessionId is the ULID lookup key. Bail on empty.
      if (typeof sessionId !== 'string' || sessionId.length === 0) {
        fdia('vsdt.mcp.bail', { reason: 'invalid-session-id', sessionId });
        console.error('[Scs Bridge] DeliverVermillion invalid sessionId · skipping');
        return action.strategy
          ? strategyFailed(action.strategy, { reason: 'invalid-session-id' })
          : muxiumConclude();
      }
      if (typeof vermillion !== 'string' || vermillion.length === 0) {
        fdia('vsdt.mcp.bail', { reason: 'empty-vermillion', sessionId });
        console.error('[Scs Bridge] DeliverVermillion empty vermillion · skipping');
        return action.strategy
          ? strategyFailed(action.strategy, { reason: 'empty-vermillion' })
          : muxiumConclude();
      }

      // EVRC · Env-Var-Read-at-Call (mirrors scsBridgeSendMessage) · ENV-FIRST, payload-fallback.
      // Per-SCP-Identity-Config: the shared workspace bridge muxium has no per-SCP env on the UI-send
      // path → the controller carries the SCP's OWN name (GET /scp-config) as payload.originScpName.
      // Env stays FIRST (agents/dev:self server-authoritative & unspoofable).
      const originScpName =
        process.env.SCS_BRIDGE_ORIGIN_SCP ??
        process.env.SCS_BRIDGE_SCP_NAME ??
        payload.originScpName;

      if (!originScpName) {
        log('scsbridge.deliverVermillion.no-origin', { sessionId });
        fdia('vsdt.mcp.bail', { reason: 'no-origin', sessionId });
        console.error(
          '[SCS-Bridge VERMILLION] no origin identity in env (SCS_BRIDGE_ORIGIN_SCP or SCS_BRIDGE_SCP_NAME) · skipping delivery',
        );
        return action.strategy
          ? strategyFailed(action.strategy, { reason: 'no-origin' })
          : muxiumConclude();
      }

      // SCS:Vermillion first-line Cascade Directive contract — the worker reads the
      // directive + executes the described Cascade behavior directly (NOT a tool call).
      // Body is the opaque Vermillion text (plan + create+actualize command).
      const text = `SCS:Vermillion\n${vermillion}`;

      fdia('vsdt.mcp.pre-relay', {
        sessionId,
        vermillionLength: vermillion.length,
        originScpName,
      });
      log('scsbridge.deliverVermillion.dispatched', {
        sessionId,
        vermillionLength: vermillion.length,
        originScpName,
      });
      console.log(
        '[SCS-Bridge VERMILLION] dispatched · sessionId=',
        sessionId,
        '· vermillionLength=',
        vermillion.length,
        '· originScpName=',
        originScpName,
      );

      // CSSP relay · fire-and-forget per send_message ACK-OD sibling pattern.
      // The Vermillion is typed into the target session as a SCS:Vermillion directive.
      try {
        dispatchFkisMessage(
          { targetUlid: sessionId, text, originScpName },
          {
            onError: (err) => {
              log('scsbridge.deliverVermillion.spawn-error', {
                sessionId,
                error: err.message,
              });
              console.error('[SCS-Bridge VERMILLION] CSSP relay spawn error:', err);
            },
          },
        );
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        log('scsbridge.deliverVermillion.error', { sessionId, message });
        console.error('[SCS-Bridge VERMILLION] error:', sessionId, message);
      }

      return action.strategy ? strategySuccess(action.strategy) : muxiumConclude();
    }),
});
