/**
 * scsBridgeEngageSession · D3D · CMIA-Engage · Cycle 163 R0
 *
 * BMTI Quality · MCP tool 'scp_engage_session'. Sibling to CMIA-Spawn
 * (scsBridgeSpawnNewScpSession). Mirrors the TUI handleResume path.
 *
 * DOCBLOCK DRIFT CORRECTED (RESUME INDUCTION · RI-D3): this block narrated
 * launchInformative(sessionId, 'resume'), but the D2 Electron transition (below)
 * moved the body to spawnElectronSessionForUlid → the Electron `open-session` verb.
 * BOTH doors now compose through the ONE assembler
 * (src/lib/bridge/baseSystemPrompt/composeAppendedSystemPrompt.ts), so the engage
 * path receives base → Dock → Instance.md whichever door it travels. Shared-function
 * discipline (SFDS) is maintained on the assembler, not on launchInformative alone.
 *
 * Per user clarification 2026-05-23: "the MCP Tool Calling the Same
 * Functionality. Where if Such is Not a Function, should be Made One to
 * Reduce the Complexity of Management. Where the TUI would Call the Function
 * and the MCP Tool Would Call the Function."
 *
 * Form-α (Method+Reducer). Reducer returns {} · no own-state mutation.
 * Async spawnElectronSessionForUlid fire-and-forget via void promise (parallels
 * scsBridgeSpawnNewScpSession L66-76).
 *
 * Template: scsBridgeSpawnNewScpSession.quality.huirth.ts (form-α pattern)
 * Citation: D3D-ARCHITECTURE-R3A-YELLOW-SHARED-FUNCTION-VERIFICATION.md §4
 * Citation: Stratimuxian Scholar S10 Quality Creation Pattern 5 (advanced Method)
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
  ScsBridgeEngageSessionPayload,
  ScsBridgeEngageSession,
} from '../scsBridge.types';
import { hasResumableIdentity } from '../../../manager';
import { spawnElectronSessionForUlid } from '../../../electronSessionSpawn';
import { log } from '../../../debugLog';

export type { ScsBridgeEngageSession };

export const scsBridgeEngageSession = createQualityCardWithPayload<
  ScsBridgeState,
  ScsBridgeEngageSessionPayload
>({
  type: 'Scs Bridge Engage Session',
  reducer: () => ({}),
  methodCreator: () =>
    createMethodWithConcepts(({ action }) => {
      const payload = selectPayload<ScsBridgeEngageSessionPayload>(action);
      const { sessionId, callerSessionUlid } = payload;

      if (typeof sessionId !== 'string' || sessionId.length === 0) {
        console.error('[Scs Bridge] EngageSession invalid sessionId · skipping');
        return action.strategy ? strategySuccess(action.strategy) : muxiumConclude();
      }

      log('scsbridge.engage.dispatched', {
        sessionId,
        callerSessionUlid: callerSessionUlid ?? null,
      });
      console.log(
        '[SCS-Bridge CMIA-Engage] dispatched · sessionId=',
        sessionId,
        '· callerSessionUlid=',
        callerSessionUlid ?? null,
      );

      // D3H Bug B fix · R7 Path C · pre-flight resumable-identity gate.
      // Architectural lock (Cycle 165 R0+, 4-Transition Truth Table): engage on
      // session without claudeSessionId = orphan-class · cannot be resumed via
      // `claude --resume`. Discriminate Sub-Case 1 (orphan) vs Sub-Case 2
      // (resumable) at the quality level rather than letting launchInformative
      // throw the misleading "SessionStart hook hasn't fired" message. Distinct
      // log event 'scsbridge.engage.orphan' replaces 'scsbridge.engage.error'
      // for the no-claudeSessionId case.
      //
      // Imperative async — fire-and-forget per scsBridgeSpawnNewScpSession pattern.
      // RI-D3 · the call below is spawnElectronSessionForUlid (the CSSP relay to the
      // Electron `open-session` verb), NOT launchInformative — the D2 transition note
      // inside the closure is the accurate one. SFDS is preserved at the assembler.
      void (async (): Promise<void> => {
        try {
          // D2 Electron transition: launchInformative (Terminal.app via osTerminal)
          // replaced by spawnElectronSessionForUlid (CSSP relay to Electron main
          // `open-session` verb). Q2=Option A: `open-session` is idempotent — focuses
          // existing window if ULID already in SRMP, else creates new Session via
          // cli-handler makeSession factory. PTY runs in Electron main; xterm.js
          // renders in BrowserWindow. Single-stack rendering across macOS/Linux/Windows.
          //
          // Resumable-identity discrimination is preserved as a log/debug signal
          // (orphan vs resumable) even though Electron path no longer branches on
          // mode here — claude --resume vs fresh spawn is currently a user-typed
          // command inside the login-shell PTY (D2 BSRC Phase 1 per R4 Angle 7).
          const claudeSessionId = await hasResumableIdentity(sessionId);
          const mode: 'new' | 'resume' = claudeSessionId ? 'resume' : 'new';
          if (mode === 'new') {
            log('scsbridge.engage.fresh-spawn', { sessionId, reason: 'no-resumable-identity' });
            console.log(
              '[SCS-Bridge CMIA-Engage] Orphan session → fresh spawn on existing ULID · sessionId=',
              sessionId,
            );
          }
          spawnElectronSessionForUlid(sessionId);
          log('scsbridge.engage.launched', { sessionId, mode, transport: 'electron' });
          console.log(
            '[SCS-Bridge CMIA-Engage] spawnElectronSessionForUlid(' + mode + ') dispatched · sessionId=',
            sessionId,
          );
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          log('scsbridge.engage.error', { sessionId, message });
          console.error('[SCS-Bridge CMIA-Engage] EngageSession error:', sessionId, message);
        }
      })();

      return action.strategy ? strategySuccess(action.strategy) : muxiumConclude();
    }),
});
