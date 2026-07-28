/**
 * scsBridgeDissipateSession · VS · DSST · scs_dissipate_session MCP tool
 *
 * The Dissipate-Session-SCS-Tool. Sibling to SET-ANCHOR (scsBridgeSetSessionAnchor)
 * and RENAME (scsBridgeRenameSession). Invoked by the SPAWNED RESEARCHER ITSELF as
 * the final step of its handed Vermillion: once the timestamped Markdown (+ paired
 * JSON) is written, the worker calls this tool via MCP to remove its own ephemeral
 * session from the Session Manager. Research spawns are non-anchor by the Epoch's
 * architectural distinction — the page's durable Setup/Chat Anchor is NEVER a
 * research worker, and (S4 H2) MUST NEVER be dissipated.
 *
 * The anchor guard lives INSIDE the dissipateSession chainWrite body (registry.ts):
 * load → `if (entry?.isAnchor) return;` → filter-remove → save, atomic. Reading the
 * isAnchor flag inside the chainWrite reflects the current registry state (not a
 * stale snapshot) and closes the window between check and remove.
 *
 * Form-α (Method+Reducer). Reducer returns {} · no own-state mutation. Dissipate is a
 * side-effect-only operation (ACK-OD pattern) — the dissipateSession chainWrite IS the
 * Lambda; saveRegistry triggers the sessions.json json-watcher relay → the SCP grid
 * drops the dissipated entry. IDTND: sessionId is the ULID lookup key, never mutated,
 * never routed. Session-dir filesystem cleanup is OUT OF SCOPE (S4 H6 · benign race).
 *
 * Template: scsBridgeSetSessionAnchor.quality.huirth.ts (form-α + registry side-effect)
 * Citation: EPOCH-DIAMOND §6 Macro VS DSST · EPOCH-SR-S4-GREEN-SCULPT.md H2 · registry.ts dissipateSession
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
  ScsBridgeDissipateSessionPayload,
  ScsBridgeDissipateSession,
} from '../scsBridge.types';
import { dissipateSession } from '../../../registry';
import { log } from '../../../debugLog';

export type { ScsBridgeDissipateSession };

export const scsBridgeDissipateSession = createQualityCardWithPayload<
  ScsBridgeState,
  ScsBridgeDissipateSessionPayload
>({
  type: 'Scs Bridge Dissipate Session',
  reducer: () => ({}),
  methodCreator: () =>
    createMethodWithConcepts(({ action }) => {
      console.log('[SCS-Bridge DISSIPATE] method fired');
      const payload = selectPayload<ScsBridgeDissipateSessionPayload>(action);
      const { sessionId } = payload;

      // IDTND guard: sessionId is the ULID lookup key. Bail on empty — never
      // synthesize or fall back to any other field as a key.
      if (typeof sessionId !== 'string' || sessionId.length === 0) {
        console.error('[Scs Bridge] DissipateSession invalid sessionId · skipping');
        return action.strategy ? strategySuccess(action.strategy) : muxiumConclude();
      }

      log('scsbridge.dissipate.dispatched', { sessionId });
      console.log('[SCS-Bridge DISSIPATE] dispatched · sessionId=', sessionId);

      // Side-effect-only · fire-and-forget per SET-ANCHOR ACK-OD sibling pattern.
      // The dissipateSession chainWrite IS the Lambda; saveRegistry triggers the
      // json-watcher relay → the SCP grid drops the entry. No own-state mutation.
      // S4 H2 · the isAnchor guard lives inside dissipateSession's chainWrite body —
      // a research-spawn that is somehow the Anchor is NEVER removed (no-op return).
      void (async (): Promise<void> => {
        try {
          await dissipateSession(sessionId);
          log('scsbridge.dissipate.written', { sessionId });
          console.log('[SCS-Bridge DISSIPATE] written · sessionId=', sessionId);
        } catch (err) {
          const m = err instanceof Error ? err.message : String(err);
          log('scsbridge.dissipate.error', { sessionId, message: m });
          console.error('[SCS-Bridge DISSIPATE] error · sessionId=', sessionId, '· error=', m);
        }
      })();

      return action.strategy ? strategySuccess(action.strategy) : muxiumConclude();
    }),
});
