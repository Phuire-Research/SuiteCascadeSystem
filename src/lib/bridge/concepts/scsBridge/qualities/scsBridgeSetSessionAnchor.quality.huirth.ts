/**
 * scsBridgeSetSessionAnchor · A-D3b · ARFSP · scs_set_anchor_session MCP tool
 *
 * The manual "fragment then correct" override for the Anchor Pattern. Sibling to
 * RENAME (scsBridgeRenameSession). Where the auto-spawned PPOL session is the page's
 * default Anchor (claimAnchorIfUnclaimed), this Quality is the Vue surface's write
 * leg that REASSIGNS the page Anchor to a user-chosen session. Instead of
 * setSessionScsLabel, it calls setSessionAnchor(sessionId) — which sets isAnchor=true
 * on the target and clears isAnchor on every OTHER entry sharing the same suite8Name
 * (the ≤1-anchor-per-page invariant; one chainWrite body so no two-anchor window).
 * IDTND: sessionId is the ULID lookup key, never mutated, never routed.
 *
 * Form-α (Method+Reducer). Reducer returns {} · no own-state mutation. Set-Anchor is
 * a side-effect-only operation (ACK-OD pattern) — the setSessionAnchor chainWrite IS
 * the Lambda; saveRegistry triggers the sessions.json json-watcher relay → the SCP
 * grid Anchor column (⚓) re-renders. The Method no-ops gracefully when the session
 * has no suite8Name scope (setSessionAnchor itself short-circuits). The session ULID
 * is the lookup key and is NEVER changed or used for routing.
 *
 * Template: scsBridgeRenameSession.quality.huirth.ts (form-α + registry side-effect)
 * Citation: registry.ts setSessionAnchor (A-D1) · ScsBridgeSessionManagement Anchor cell (A-D2)
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
  ScsBridgeSetSessionAnchorPayload,
  ScsBridgeSetSessionAnchor,
} from '../scsBridge.types';
import { setSessionAnchor } from '../../../registry';
import { log } from '../../../debugLog';

export type { ScsBridgeSetSessionAnchor };

export const scsBridgeSetSessionAnchor = createQualityCardWithPayload<
  ScsBridgeState,
  ScsBridgeSetSessionAnchorPayload
>({
  type: 'Scs Bridge Set Session Anchor',
  reducer: () => ({}),
  methodCreator: () =>
    createMethodWithConcepts(({ action }) => {
      const payload = selectPayload<ScsBridgeSetSessionAnchorPayload>(action);
      const { sessionId } = payload;

      // IDTND guard: sessionId is the ULID lookup key. Bail on empty — never
      // synthesize or fall back to any other field as a key.
      if (typeof sessionId !== 'string' || sessionId.length === 0) {
        console.error('[Scs Bridge] SetSessionAnchor invalid sessionId · skipping');
        return action.strategy ? strategySuccess(action.strategy) : muxiumConclude();
      }

      log('scsbridge.setAnchor.dispatched', { sessionId });
      console.log('[SCS-Bridge SET-ANCHOR] dispatched · sessionId=', sessionId);

      // Side-effect-only · fire-and-forget per RENAME ACK-OD sibling pattern.
      // The setSessionAnchor chainWrite IS the Lambda; saveRegistry triggers the
      // json-watcher relay → the SCP grid Anchor column updates. No own-state mutation.
      // A-D3b · setSessionAnchor clears isAnchor on every OTHER entry of the same
      // suite8Name (≤1 per page) and no-ops if the session has no suite8Name scope.
      void (async (): Promise<void> => {
        try {
          await setSessionAnchor(sessionId);
          log('scsbridge.setAnchor.written', { sessionId });
          console.log('[SCS-Bridge SET-ANCHOR] written · sessionId=', sessionId);
        } catch (err) {
          const m = err instanceof Error ? err.message : String(err);
          log('scsbridge.setAnchor.error', { sessionId, message: m });
          console.error('[SCS-Bridge SET-ANCHOR] error · sessionId=', sessionId, '· error=', m);
        }
      })();

      return action.strategy ? strategySuccess(action.strategy) : muxiumConclude();
    }),
});
