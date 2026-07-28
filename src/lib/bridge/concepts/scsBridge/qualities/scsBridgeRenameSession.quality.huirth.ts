/**
 * scsBridgeRenameSession · RM-D4 · SNDF/DUAL · scp_rename_session MCP tool
 *
 * BMTI Quality. Sibling to CHAT (scsBridgeChatSession). The DUAL convergence:
 * this Quality is the Vue surface's write leg onto SNDF; the TUI surface's leg
 * is animatedTui.ts rename-confirm. BOTH call setSessionDisplayName — one field,
 * one writer, no surface-specific state. IDTND: writes displayName ONLY; the
 * ULID (sessionId) is the lookup key, never mutated, never routed.
 *
 * Form-α (Method+Reducer). Reducer returns {} · no own-state mutation. Rename is
 * a side-effect-only operation (ACK-OD pattern) — the setSessionDisplayName
 * chainWrite IS the Lambda; saveRegistry triggers the sessions.json json-watcher
 * relay → DUAL surfaces (Vue label + TUI column) re-render. Empty/whitespace name
 * forwards as undefined → setSessionDisplayName deletes the field (idempotent
 * absence · matches the TUI empty-buffer confirm). The session ULID is the lookup
 * key and is NEVER changed or used for routing.
 *
 * Template: scsBridgeChatSession.quality.huirth.ts (form-α + registry side-effect)
 * Citation: RM-D4-R3-WIRING-ARCHITECTURE.md §1.2
 * Citation: RM-D4-R6-PURPLE-VALIDATION.md §0 Canonical Seam Contract
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
  ScsBridgeRenameSessionPayload,
  ScsBridgeRenameSession,
} from '../scsBridge.types';
import { setSessionScsLabel } from '../../../registry';
import { log } from '../../../debugLog';

export type { ScsBridgeRenameSession };

export const scsBridgeRenameSession = createQualityCardWithPayload<
  ScsBridgeState,
  ScsBridgeRenameSessionPayload
>({
  type: 'Scs Bridge Rename Session',
  reducer: () => ({}),
  methodCreator: () =>
    createMethodWithConcepts(({ action }) => {
      const payload = selectPayload<ScsBridgeRenameSessionPayload>(action);
      const { sessionId, name } = payload;

      // IDTND guard: sessionId is the ULID lookup key. Bail on empty — never
      // synthesize or fall back to name as a key.
      if (typeof sessionId !== 'string' || sessionId.length === 0) {
        console.error('[Scs Bridge] RenameSession invalid sessionId · skipping');
        return action.strategy ? strategySuccess(action.strategy) : muxiumConclude();
      }
      // `name` may be empty/whitespace → setSessionScsLabel deletes the field
      // (idempotent absence). So we DO NOT bail on empty name; we forward it as
      // undefined so the registry writer clears scsLabel.
      const nameArg = typeof name === 'string' && name.trim().length > 0 ? name : undefined;

      log('scsbridge.rename.dispatched', { sessionId, hasName: nameArg !== undefined });
      console.log(
        '[SCS-Bridge RENAME] dispatched · sessionId=',
        sessionId,
        '· hasName=',
        nameArg !== undefined,
      );

      // Side-effect-only · fire-and-forget per ChatSession ACK-OD sibling pattern.
      // The setSessionScsLabel chainWrite IS the Lambda; saveRegistry triggers
      // the json-watcher relay → DUAL surfaces update. No own-state mutation.
      // RM-D4 · SCSLA redirect · writes scsLabel (SCS-Bridge-only), NOT displayName
      // (ADSO remedy — displayName is coupled to ClaudeCode's identity layer).
      void (async (): Promise<void> => {
        try {
          await setSessionScsLabel(sessionId, nameArg);
          log('scsbridge.rename.written', { sessionId, scsLabel: nameArg ?? null });
          console.log(
            '[SCS-Bridge RENAME] written · sessionId=',
            sessionId,
            '· scsLabel=',
            nameArg ?? null,
          );
        } catch (err) {
          const m = err instanceof Error ? err.message : String(err);
          log('scsbridge.rename.error', { sessionId, message: m });
          console.error('[SCS-Bridge RENAME] error · sessionId=', sessionId, '· error=', m);
        }
      })();

      return action.strategy ? strategySuccess(action.strategy) : muxiumConclude();
    }),
});
