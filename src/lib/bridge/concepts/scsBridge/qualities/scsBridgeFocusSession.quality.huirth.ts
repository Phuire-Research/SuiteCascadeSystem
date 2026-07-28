/**
 * scsBridgeFocusSession · D3RM-E · CMIA-Focus · MAFF
 *
 * BMTI Quality · MCP tool 'scp_focus_session'. Sibling to CMIA-Engage
 * (scsBridgeEngageSession). Brings the target session's Terminal.app window
 * to the foreground via the shared focusTerminalWindow primitive (ASFP) in
 * osTerminal.ts. The same primitive will be called by the TUI hotkey path
 * (Diamond F · deferred) — SFDS (Shared-Function-Discipline-Satisfied)
 * preserved forward.
 *
 * Form-α (Method+Reducer). Reducer returns {} · no own-state mutation.
 * Focus is a side-effect-only operation (ACK-OD pattern). Async
 * focusTerminalWindow fire-and-forget via void promise.
 *
 * Pre-flight: reads sessions.json registry to resolve terminalWindowId for
 * the target sessionId. When window-id is undefined (pre-D3RM-E session,
 * capture failed, non-macOS), focusTerminalWindow degrades to generic
 * Terminal.app activate (DD-3 Option Q · logs scsbridge.focus.degraded).
 *
 * Template: scsBridgeEngageSession.quality.huirth.ts (form-α pattern)
 * Citation: D3RM-E-FOUNDATION-R7-FUCHSIA-CLINICAL.md §5 Wave 3
 * Citation: D3RM-E-FOUNDATION-R4-GREEN-AUDIT.md §5 (MCP registration pattern)
 */

import {
  createQualityCardWithPayload,
  createMethodWithConcepts,
  selectPayload,
  muxiumConclude,
  strategySuccess,
} from 'stratimux';
import type {
  ScsBridgeState,
  ScsBridgeFocusSessionPayload,
  ScsBridgeFocusSession,
} from '../scsBridge.types';
import { focusElectronSessionForUlid } from '../../../electronSessionSpawn';
import { listSessions } from '../../../registry';
import { log } from '../../../debugLog';

export type { ScsBridgeFocusSession };

export const scsBridgeFocusSession = createQualityCardWithPayload<
  ScsBridgeState,
  ScsBridgeFocusSessionPayload
>({
  type: 'Scs Bridge Focus Session',
  reducer: () => ({}),
  methodCreator: () =>
    createMethodWithConcepts(({ action }) => {
      const payload = selectPayload<ScsBridgeFocusSessionPayload>(action);
      const { sessionId, callerSessionUlid } = payload;

      if (typeof sessionId !== 'string' || sessionId.length === 0) {
        console.error('[Scs Bridge] FocusSession invalid sessionId · skipping');
        return action.strategy ? strategySuccess(action.strategy) : muxiumConclude();
      }

      log('scsbridge.focus.dispatched', {
        sessionId,
        callerSessionUlid: callerSessionUlid ?? null,
      });
      console.log(
        '[SCS-Bridge CMIA-Focus] dispatched · sessionId=',
        sessionId,
        '· callerSessionUlid=',
        callerSessionUlid ?? null,
      );

      // D2 Electron transition: terminalWindowId-based osascript focus replaced
      // by ULID-based CSSP relay. Q2=Option A: focusElectronSessionForUlid invokes
      // `open-session <ulid>` which focuses-existing in Electron main via
      // sessionRegistry.has(ulid) gate → session.show(true). Single-stack focus
      // path across macOS/Linux/Windows; no TCC / AppleScript dependency.
      //
      // listSessions check preserved as a pre-flight validation that the ULID
      // exists in sessions.json — if missing, log and skip the focus call.
      void (async (): Promise<void> => {
        try {
          const sessions = await listSessions();
          const entry = sessions.find((s) => s.id === sessionId);
          if (entry === undefined) {
            log('scsbridge.focus.not-found', { sessionId });
            console.warn(
              '[SCS-Bridge CMIA-Focus] sessionId not in registry · skipping focus · sessionId=',
              sessionId,
            );
            return;
          }
          focusElectronSessionForUlid(sessionId);
          log('scsbridge.focus.completed', { sessionId, transport: 'electron' });
          console.log(
            '[SCS-Bridge CMIA-Focus] focusElectronSessionForUlid dispatched · sessionId=',
            sessionId,
          );
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          log('scsbridge.focus.error', { sessionId, message });
          console.error('[SCS-Bridge CMIA-Focus] FocusSession error:', sessionId, message);
        }
      })();

      return action.strategy ? strategySuccess(action.strategy) : muxiumConclude();
    }),
});
