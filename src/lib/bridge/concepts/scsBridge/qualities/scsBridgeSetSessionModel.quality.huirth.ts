/**
 * scsBridgeSetSessionModel · C1104 · ruling A · scs_set_session_model MCP tool
 *
 * BMTI Quality. Sibling to RENAME (scsBridgeRenameSession). The D3D convergence: this
 * Quality is the page/MCP write leg onto entry.model; the TUI surface's leg is
 * animatedTui.ts `set-model-pick`. BOTH call the SAME in-process registry function
 * (setSessionModel) — one field, one writer, no surface-specific state.
 *
 * Form-α (Method+Reducer). Reducer returns {} · no own-state mutation. Setting a model is
 * side-effect-only (ACK-OD) — the setSessionModel chainWrite IS the Lambda; saveRegistry
 * triggers the sessions.json json-watcher relay → the SessionManager chip/picker and the
 * TUI model column re-render.
 *
 * Lane 7 row 12 / guard 8 · THE EXISTENCE CHECK. registry.setSessionModel silently
 * `return`s on a missing ulid, so a typo'd id would ACK success with nothing written.
 * This quality checks the ULID EXISTS via listSessions() and errors BEFORE delegating —
 * it never creates a session, and it never pretends.
 *
 * VALIDATION lives in setSessionModel (normalizeModelId → isAvailableModel): an
 * off-catalog id is refused there with registry.model.skipped and can never reach
 * `claude --model`. This quality forwards the id verbatim; it does not second-guess.
 *
 * IDTND: writes model ONLY; the ULID (sessionId) is the lookup key, never mutated,
 * never routed. A model set on an ALIVE session takes effect at its NEXT resume.
 *
 * Template: scsBridgeRenameSession.quality.huirth.ts (form-α + registry side-effect)
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
  ScsBridgeSetSessionModelPayload,
  ScsBridgeSetSessionModel,
} from '../scsBridge.types';
import { setSessionModel, listSessions } from '../../../registry';
import { log } from '../../../debugLog';

export type { ScsBridgeSetSessionModel };

export const scsBridgeSetSessionModel = createQualityCardWithPayload<
  ScsBridgeState,
  ScsBridgeSetSessionModelPayload
>({
  type: 'Scs Bridge Set Session Model',
  reducer: () => ({}),
  methodCreator: () =>
    createMethodWithConcepts(({ action }) => {
      const payload = selectPayload<ScsBridgeSetSessionModelPayload>(action);
      const { sessionId, model } = payload;

      // IDTND guard: sessionId is the ULID lookup key. Bail on empty — never
      // synthesize or fall back to any other field as a key.
      if (typeof sessionId !== 'string' || sessionId.length === 0) {
        console.error('[Scs Bridge] SetSessionModel invalid sessionId · skipping');
        return action.strategy ? strategySuccess(action.strategy) : muxiumConclude();
      }
      // Unlike rename, an empty model is meaningless (it is not a "clear") — refuse it.
      if (typeof model !== 'string' || model.trim().length === 0) {
        log('scsbridge.setmodel.invalid', { sessionId, reason: 'empty-model' });
        console.error('[Scs Bridge] SetSessionModel empty model · skipping ·', sessionId);
        return action.strategy ? strategySuccess(action.strategy) : muxiumConclude();
      }

      log('scsbridge.setmodel.dispatched', { sessionId, model });
      console.log('[SCS-Bridge SETMODEL] dispatched · sessionId=', sessionId, '· model=', model);

      // Side-effect-only · fire-and-forget per the RENAME ACK-OD sibling pattern.
      void (async (): Promise<void> => {
        try {
          // Lane 7 guard 8 · REFUSE, never create, never silently no-op.
          const sessions = await listSessions();
          if (!sessions.some((s) => s.id === sessionId)) {
            log('scsbridge.setmodel.not-found', { sessionId, model });
            console.error('[SCS-Bridge SETMODEL] sessionId not found · sessionId=', sessionId);
            return;
          }
          await setSessionModel(sessionId, model, 'set');
          log('scsbridge.setmodel.written', { sessionId, model });
          console.log('[SCS-Bridge SETMODEL] written · sessionId=', sessionId, '· model=', model);
        } catch (err) {
          const m = err instanceof Error ? err.message : String(err);
          log('scsbridge.setmodel.error', { sessionId, message: m });
          console.error('[SCS-Bridge SETMODEL] error · sessionId=', sessionId, '· error=', m);
        }
      })();

      return action.strategy ? strategySuccess(action.strategy) : muxiumConclude();
    }),
});
