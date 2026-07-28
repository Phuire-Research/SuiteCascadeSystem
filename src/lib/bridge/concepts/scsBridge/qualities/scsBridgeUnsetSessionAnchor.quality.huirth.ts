/**
 * scsBridgeUnsetSessionAnchor · SAC.1 · ARFSP · scs_unset_anchor_session MCP tool
 *
 * The manual "release the Anchor" leg for the Anchor Pattern. Faithful mirror of
 * scsBridgeSetSessionAnchor — the Vue surface's write leg that RELEASES the page
 * Anchor from a user-chosen session. Instead of setSessionAnchor, it calls
 * unsetSessionAnchor(sessionId) — which clears isAnchor=false on the one target entry
 * (no scope-clear loop; releasing one anchor cannot open a two-anchor window).
 * IDTND: sessionId is the ULID lookup key, never mutated, never routed.
 *
 * Form-α (Method+Reducer). Reducer returns {} · no own-state mutation. Un-Anchor is
 * a side-effect-only operation (ACK-OD pattern) — the unsetSessionAnchor chainWrite IS
 * the Lambda; saveRegistry triggers the sessions.json json-watcher relay → the SCP
 * grid Anchor column (⚓) re-renders. The Method no-ops gracefully when the session
 * is not currently anchored (unsetSessionAnchor itself short-circuits). The session ULID
 * is the lookup key and is NEVER changed or used for routing.
 *
 * Template: scsBridgeSetSessionAnchor.quality.huirth.ts (form-α + registry side-effect)
 * Citation: registry.ts unsetSessionAnchor (SAC.1) · SAC-WGB.md § ◆ SAC.1
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
  ScsBridgeUnsetSessionAnchorPayload,
  ScsBridgeUnsetSessionAnchor,
} from '../scsBridge.types';
import { unsetSessionAnchor } from '../../../registry';
import { log } from '../../../debugLog';

export type { ScsBridgeUnsetSessionAnchor };

export const scsBridgeUnsetSessionAnchor = createQualityCardWithPayload<
  ScsBridgeState,
  ScsBridgeUnsetSessionAnchorPayload
>({
  type: 'Scs Bridge Unset Session Anchor',
  reducer: () => ({}),
  methodCreator: () =>
    createMethodWithConcepts(({ action }) => {
      const payload = selectPayload<ScsBridgeUnsetSessionAnchorPayload>(action);
      const { sessionId } = payload;

      // IDTND guard: sessionId is the ULID lookup key. Bail on empty — never
      // synthesize or fall back to any other field as a key.
      if (typeof sessionId !== 'string' || sessionId.length === 0) {
        console.error('[Scs Bridge] UnsetSessionAnchor invalid sessionId · skipping');
        return action.strategy ? strategySuccess(action.strategy) : muxiumConclude();
      }

      log('scsbridge.unsetAnchor.dispatched', { sessionId });
      console.log('[SCS-Bridge UNSET-ANCHOR] dispatched · sessionId=', sessionId);

      // Side-effect-only · fire-and-forget per SET-ANCHOR ACK-OD sibling pattern.
      // The unsetSessionAnchor chainWrite IS the Lambda; saveRegistry triggers the
      // json-watcher relay → the SCP grid Anchor column updates. No own-state mutation.
      // SAC.1 · unsetSessionAnchor clears isAnchor on ONLY the one target entry (no
      // scope-clear loop) and no-ops if the session is not currently anchored.
      void (async (): Promise<void> => {
        try {
          await unsetSessionAnchor(sessionId);
          log('scsbridge.unsetAnchor.written', { sessionId });
          console.log('[SCS-Bridge UNSET-ANCHOR] written · sessionId=', sessionId);
        } catch (err) {
          const m = err instanceof Error ? err.message : String(err);
          log('scsbridge.unsetAnchor.error', { sessionId, message: m });
          console.error('[SCS-Bridge UNSET-ANCHOR] error · sessionId=', sessionId, '· error=', m);
        }
      })();

      return action.strategy ? strategySuccess(action.strategy) : muxiumConclude();
    }),
});
