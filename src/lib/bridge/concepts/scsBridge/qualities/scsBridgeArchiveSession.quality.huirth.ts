/**
 * scsBridgeArchiveSession · ARST · scs_archive_session MCP tool
 *
 * The ARchival-Session-Tool. Sibling to DISSIPATE (scsBridgeDissipateSession). Where
 * Dissipate DELETES the real ClaudeCode session, Archive MOVES it into
 * Cascades/Archive/YYYY/MM/DD/ (archiveSession · registry.ts) THEN removes the entry
 * from sessions.json. Like dissipate, it is anchor-guarded (S4 H2 · AGTD — the page's
 * durable Setup/Chat Anchor is NEVER archived) and resilient (RSAR — an absent real
 * session is a no-op move; the entry is still removed).
 *
 * The anchor guard + the real-session move live INSIDE the archiveSession chainWrite
 * body (registry.ts): load → isAnchor-guard → archiveRealClaudeSession (move) → filter
 * → save, atomic. PFCX: the real-session move is the intentional, user-directed crossing
 * of the bridge-detached law — scoped to the single resolved .jsonl.
 *
 * Form-α (Method+Reducer). Reducer returns {} · no own-state mutation. Archive is a
 * side-effect-only operation (ACK-OD pattern) — the archiveSession chainWrite IS the
 * Lambda; saveRegistry triggers the sessions.json json-watcher relay → the SCP grid
 * drops the archived entry. IDTND: sessionId is the ULID lookup key, never mutated.
 *
 * Template: scsBridgeDissipateSession.quality.huirth.ts (form-α + registry side-effect)
 * Citation: DISSOLUTION-ARCHIVAL-DIAMOND-WGB.md §2 ARST · §4 Wave 2 · registry.ts archiveSession
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
  ScsBridgeArchiveSessionPayload,
  ScsBridgeArchiveSession,
} from '../scsBridge.types';
import { archiveSession } from '../../../registry';
import { log } from '../../../debugLog';

export type { ScsBridgeArchiveSession };

export const scsBridgeArchiveSession = createQualityCardWithPayload<
  ScsBridgeState,
  ScsBridgeArchiveSessionPayload
>({
  type: 'Scs Bridge Archive Session',
  reducer: () => ({}),
  methodCreator: () =>
    createMethodWithConcepts(({ action }) => {
      console.log('[SCS-Bridge ARCHIVE] method fired');
      const payload = selectPayload<ScsBridgeArchiveSessionPayload>(action);
      const { sessionId } = payload;

      // IDTND guard: sessionId is the ULID lookup key. Bail on empty — never
      // synthesize or fall back to any other field as a key.
      if (typeof sessionId !== 'string' || sessionId.length === 0) {
        console.error('[Scs Bridge] ArchiveSession invalid sessionId · skipping');
        return action.strategy ? strategySuccess(action.strategy) : muxiumConclude();
      }

      log('scsbridge.archive.dispatched', { sessionId });
      console.log('[SCS-Bridge ARCHIVE] dispatched · sessionId=', sessionId);

      // Side-effect-only · fire-and-forget per DISSIPATE ACK-OD sibling pattern.
      // The archiveSession chainWrite IS the Lambda; saveRegistry triggers the
      // json-watcher relay → the SCP grid drops the entry. No own-state mutation.
      // S4 H2 · AGTD · the isAnchor guard + the real-session move live inside
      // archiveSession's chainWrite body.
      void (async (): Promise<void> => {
        try {
          await archiveSession(sessionId);
          log('scsbridge.archive.written', { sessionId });
          console.log('[SCS-Bridge ARCHIVE] written · sessionId=', sessionId);
        } catch (err) {
          const m = err instanceof Error ? err.message : String(err);
          log('scsbridge.archive.error', { sessionId, message: m });
          console.error('[SCS-Bridge ARCHIVE] error · sessionId=', sessionId, '· error=', m);
        }
      })();

      return action.strategy ? strategySuccess(action.strategy) : muxiumConclude();
    }),
});
