/**
 * scsBridgeBindCallerSessionToScp · SAWSR-D2.B Cycle 153
 *
 * SCSER intake Quality · Bridge side. Receives HTTP POST callback from SCP-side
 * SCSER Strategy (scserCallerSessionBinding.strategy.ts) after SCP boots and
 * reads SCS_BRIDGE_CALLER_SESSION env var. The Strategy POSTs to MCP tool
 * scs_bridge_bind_caller_session which routes through scpExecuteTool → this
 * Quality.
 *
 * DEBOUNCED Method (createMethodDebounceWithConcepts · 500ms) per user-author
 * (Stratimux's Author) guidance. Rationale: rapid re-callbacks from SCP startup
 * retries collapse into ONE registry write. Reducer fires immediately each
 * dispatch (no-op return {}); Method fires ONCE at debounce-window end with
 * latest action payload.
 *
 * Form-α (Method+Reducer). Reducer returns {} (no own-state mutation · idempotent).
 * Method imperatively calls registry.updateSessionScpName (SSBM atomic helper).
 *
 * COMPREHENSIVE FLOW LOGGING (per user direction · Cycle 153):
 *   scsbridge.bind-caller-session.reducer.fired   (every dispatch · pre-debounce)
 *   scsbridge.bind-caller-session.method.fired    (post-debounce · latest action wins)
 *   scsbridge.bind-caller-session.registry.updated (post atomic write)
 *   scsbridge.bind-caller-session.error           (on failure)
 *
 * Template: scsBridgeActivateScpSession.quality.huirth.ts (form-α pattern)
 * Citation: Stratimuxian Scholar S10 Quality Creation Pattern 5 (advanced Method)
 * Citation: Stratimux source `src/model/method/methodDebounce.ts:95` createMethodDebounceWithConcepts
 * Citation: ONYX-TIER-15.md Cycle 152 MASF/MTAM (Forward Arc completion · this closes Backward Arc)
 */

import {
  createQualityCardWithPayload,
  createMethodDebounceWithConcepts,
  selectPayload,
  muxiumConclude,
  strategySuccess,
} from 'stratimux';
import type {
  ScsBridgeState,
  ScsBridgeBindCallerSessionToScpPayload,
  ScsBridgeBindCallerSessionToScp,
} from '../scsBridge.types';
import { updateSessionScpName } from '../../../registry';
import { log } from '../../../debugLog';

export type { ScsBridgeBindCallerSessionToScp };

const SCSER_DEBOUNCE_MS = 500;

export const scsBridgeBindCallerSessionToScp = createQualityCardWithPayload<
  ScsBridgeState,
  ScsBridgeBindCallerSessionToScpPayload
>({
  type: 'Scs Bridge Bind Caller Session To Scp',
  reducer: (_state, action) => {
    // Reducer fires on EVERY dispatch (Stratimux semantic · not debounced).
    // Per user-author: Method moves through Debounce · Reducer is immediate.
    // No own-state mutation; flow-trace log only.
    const payload = selectPayload<ScsBridgeBindCallerSessionToScpPayload>(action);
    log('scsbridge.bind-caller-session.reducer.fired', {
      callerSessionUlid: payload?.callerSessionUlid ?? null,
      scpName: payload?.scpName ?? null,
      semaphoreNote: 'reducer-immediate-method-debounced',
    });
    return {};
  },
  methodCreator: () =>
    createMethodDebounceWithConcepts(({ action }) => {
      // Method fires AFTER 500ms debounce window with latest action.
      // Rapid re-callbacks collapse into single registry write.
      const payload = selectPayload<ScsBridgeBindCallerSessionToScpPayload>(action);
      const { callerSessionUlid, scpName } = payload;

      log('scsbridge.bind-caller-session.method.fired', {
        callerSessionUlid: callerSessionUlid ?? null,
        scpName: scpName ?? null,
        debounceMs: SCSER_DEBOUNCE_MS,
      });

      if (typeof callerSessionUlid !== 'string' || callerSessionUlid.length === 0) {
        log('scsbridge.bind-caller-session.error', {
          reason: 'invalid-callerSessionUlid',
          callerSessionUlid: callerSessionUlid ?? null,
        });
        return action.strategy ? strategySuccess(action.strategy) : muxiumConclude();
      }
      if (typeof scpName !== 'string' || scpName.length === 0) {
        log('scsbridge.bind-caller-session.error', {
          reason: 'invalid-scpName',
          scpName: scpName ?? null,
        });
        return action.strategy ? strategySuccess(action.strategy) : muxiumConclude();
      }

      // Imperative async · fire-and-forget per scsBridgeLaunchScp pattern.
      // updateSessionScpName is atomic via chainWrite mutex (Diamond M Fix M-2).
      void (async (): Promise<void> => {
        try {
          await updateSessionScpName(callerSessionUlid, scpName);
          log('scsbridge.bind-caller-session.registry.updated', {
            callerSessionUlid,
            scpName,
          });
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          log('scsbridge.bind-caller-session.error', {
            reason: 'registry-write-failed',
            callerSessionUlid,
            scpName,
            message,
          });
        }
      })();

      return action.strategy ? strategySuccess(action.strategy) : muxiumConclude();
    }, SCSER_DEBOUNCE_MS),
});
