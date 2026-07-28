/**
 * scsBridgeSendMessage · D3 FKIS · Focused-Keyed-Input-Streaming
 *
 * BMTI Quality · MCP tool 'send_message'. Sibling to CMIA-Focus and CHAT.
 * Replaces UIMJ queue path (scsBridgeChatSession) for live delivery: focuses
 * target Electron window, streams chars per FBP, fires Return keyDown,
 * restores origin SCP focus. Real-time, NOT deferred-to-next-turn.
 *
 * Form-α (Method+Reducer · ACK-OD pattern). Reducer returns {} · no own-state
 * mutation. Side-effect-only Quality — the CSSP relay IS the Lambda; no UI
 * state changes on the server.
 *
 * EVRC origin discovery: reads process.env.SCS_BRIDGE_ORIGIN_SCP (Template
 * special case under dev:self) anor SCS_BRIDGE_SCP_NAME (production boot var)
 * to populate originScpName at tool-call time. Caller (Vue / Agent) does NOT
 * supply origin identity — it's a server-side property.
 *
 * Cross-process relay: dispatchFkisMessage spawns bin/scs.js with verb
 * 'sendMessage' + JSON envelope; bin/scs.js routes via CSSP socket to
 * Electron-main cli-handler `case 'sendMessage'` → executeFkis().
 *
 * Template: scsBridgeChatSession.quality.huirth.ts (form-α pattern)
 * Citation: D3 FKIS S3 Ochre Blueprint §E.1 + S6 Amethyst W3 spec
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
  ScsBridgeSendMessagePayload,
  ScsBridgeSendMessage,
} from '../scsBridge.types';
import { dispatchFkisMessage } from '../../../electronMessageDispatch';
import { log } from '../../../debugLog';
import { fdia } from '../../../fdia';

export type { ScsBridgeSendMessage };

export const scsBridgeSendMessage = createQualityCardWithPayload<
  ScsBridgeState,
  ScsBridgeSendMessagePayload
>({
  type: 'Scs Bridge Send Message',
  reducer: () => ({}),
  methodCreator: () =>
    createMethodWithConcepts(({ action }) => {
      const payload = selectPayload<ScsBridgeSendMessagePayload>(action);
      const { targetUlid, text } = payload;
      // C768 · the focus discipline rides the tool args: In Focus (true) suppresses the final refocus.
      const inFocus = (payload as { inFocus?: unknown }).inFocus === true;

      // C382 L3 ENTRY LOG (L2→L3 boundary observable): FIRST line of the method body. A
      // future silent skip (C381 class) names itself by this log's ABSENCE against a
      // received toolcall — the beat pre-load kill leaves no bail, only missing entry.
      log('fkis.method.entered', { sessionId: targetUlid, kind: 'sendMessage' });

      fdia('fkis.mcp.invoked', {
        targetUlid,
        textLength: typeof text === 'string' ? text.length : 0,
        hasOriginEnv: !!process.env.SCS_BRIDGE_ORIGIN_SCP,
        hasScpNameEnv: !!process.env.SCS_BRIDGE_SCP_NAME,
        originScpEnv: process.env.SCS_BRIDGE_ORIGIN_SCP ?? null,
        scpNameEnv: process.env.SCS_BRIDGE_SCP_NAME ?? null,
        payloadOrigin: payload.originScpName ?? null,
      });

      if (typeof targetUlid !== 'string' || targetUlid.length === 0) {
        fdia('fkis.mcp.bail', { reason: 'invalid-target-ulid', targetUlid });
        console.error('[Scs Bridge] SendMessage invalid targetUlid · skipping');
        return action.strategy
          ? strategyFailed(action.strategy, { reason: 'invalid-target-ulid' })
          : muxiumConclude();
      }
      if (typeof text !== 'string' || text.length === 0) {
        fdia('fkis.mcp.bail', { reason: 'empty-text', targetUlid });
        console.error('[Scs Bridge] SendMessage empty text · skipping');
        return action.strategy
          ? strategyFailed(action.strategy, { reason: 'empty-text' })
          : muxiumConclude();
      }

      // EVRC · Env-Var-Read-at-Call (S2 §D.4 verdict) · ENV-FIRST, payload-fallback.
      // Template path: dev:self injects SCS_BRIDGE_ORIGIN_SCP=template.
      // Production path: SCP server boot already injects SCS_BRIDGE_SCP_NAME.
      // UI-send gap (Per-SCP-Identity-Config): the SHARED workspace bridge muxium (port 7111)
      // boots before any SCP is chosen and serves multiple boundScps — it has NEITHER env. The
      // UI controller carries the origin from the SCP's OWN scp.config.json (GET /scp-config) as
      // payload.originScpName. Env stays FIRST so agents/dev:self remain server-authoritative &
      // unspoofable; the payload only fills the gap where no env exists.
      const originScpName =
        process.env.SCS_BRIDGE_ORIGIN_SCP ??
        process.env.SCS_BRIDGE_SCP_NAME ??
        payload.originScpName;

      if (!originScpName) {
        log('scsbridge.sendMessage.no-origin', { targetUlid });
        fdia('fkis.mcp.bail', { reason: 'no-origin', targetUlid });
        console.error(
          '[Scs Bridge SEND] no origin identity in env (SCS_BRIDGE_ORIGIN_SCP or SCS_BRIDGE_SCP_NAME) · skipping send',
        );
        return action.strategy
          ? strategyFailed(action.strategy, { reason: 'no-origin' })
          : muxiumConclude();
      }

      fdia('fkis.mcp.pre-relay', { targetUlid, textLength: text.length, originScpName, inFocus, rawInFocus: String((payload as { inFocus?: unknown }).inFocus) });

      log('scsbridge.sendMessage.dispatched', {
        targetUlid,
        textLength: text.length,
        originScpName,
      });
      console.log(
        '[SCS-Bridge SEND] dispatched · targetUlid=',
        targetUlid,
        '· textLength=',
        text.length,
        '· originScpName=',
        originScpName,
      );

      // CSSP relay · fire-and-forget per ACK-OD sibling pattern.
      try {
        dispatchFkisMessage(
          { targetUlid, text, originScpName, ...(inFocus ? { inFocus: true } : {}) },
          {
            onError: (err) => {
              log('scsbridge.sendMessage.spawn-error', {
                targetUlid,
                error: err.message,
              });
              console.error('[SCS-Bridge SEND] CSSP relay spawn error:', err);
            },
          },
        );
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        log('scsbridge.sendMessage.error', { targetUlid, message });
        console.error('[SCS-Bridge SEND] error:', targetUlid, message);
      }

      return action.strategy ? strategySuccess(action.strategy) : muxiumConclude();
    }),
});
