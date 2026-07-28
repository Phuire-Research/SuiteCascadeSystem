/**
 * scsBridgePersistLastTurn · DIAGNOSTIC-REENGAGED R2 · TSPK · Single-Writer (BATCH)
 *
 * MCP tool 'scs_persist_last_turn'. Sibling to CHAT (scsBridgeChatSession).
 * Form-α (Method+Reducer). Reducer returns {} · no own-state mutation —
 * side-effect-only (ACK-OD pattern). The Lambda is the registry write.
 *
 * The CLI is the SINGLE WRITER of transcriptSnippet into sessions.json. The body
 * loops the rolled-up sessionIds: for each id resolve the registry entry, guard
 * claudeSessionId, resolveClaudeProjectDir(entry.cwd) → extractLastTurnSnippet
 * (C1 pure model) → accumulate patches → ONE updateSessionTranscriptSnippets
 * (C2 batch · one chainWrite transaction). The SCP json-watcher then carries the
 * persisted snippet to clients — no race against the Electron-main Stop-hook writer.
 *
 * Triggered by the SCP-side Last-Turn transcript watcher, which coalesces N
 * per-session extraction triggers into ONE batched POST (the salvo fix).
 *
 * Template: scsBridgeChatSession.quality.huirth.ts (form-α + side-effect path)
 * Citation: DIAGNOSTIC-REENGAGED-R2-LASTTURN-MCP-S6-COMPOSITION-VALIDATION.md §A.3
 * Citation: DIAGNOSTIC-REENGAGED-R2-LASTTURN-MCP-S3-OCHRE-BLUEPRINT.md §3.1
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
  ScsBridgePersistLastTurnPayload,
  ScsBridgePersistLastTurn,
} from '../scsBridge.types';
import { extractLastTurnSnippet, resolveClaudeProjectDir } from '../../../lastTurnExtraction.model';
import { updateSessionTranscriptSnippets, listSessions } from '../../../registry';
import { log } from '../../../debugLog';

export type { ScsBridgePersistLastTurn };

export const scsBridgePersistLastTurn = createQualityCardWithPayload<
  ScsBridgeState,
  ScsBridgePersistLastTurnPayload
>({
  type: 'Scs Bridge Persist Last Turn',
  reducer: () => ({}),
  methodCreator: () =>
    createMethodWithConcepts(({ action }) => {
      const payload = selectPayload<ScsBridgePersistLastTurnPayload>(action);
      const { sessionIds, callerSessionUlid } = payload;

      if (!Array.isArray(sessionIds) || sessionIds.length === 0) {
        console.error('[Scs Bridge] PersistLastTurn empty sessionIds · skipping');
        return action.strategy ? strategySuccess(action.strategy) : muxiumConclude();
      }

      log('scsbridge.lastturn.dispatched', {
        requested: sessionIds.length,
        callerSessionUlid: callerSessionUlid ?? null,
      });
      console.log(
        '[SCS-Bridge LASTTURN] dispatched · requested=',
        sessionIds.length,
        '· callerSessionUlid=',
        callerSessionUlid ?? null,
      );

      // Side-effect-only · fire-and-forget per scsBridgeChatSession pattern.
      // Loop extract per id (C1 model), accumulate patches, ONE batch write (C2).
      void (async (): Promise<void> => {
        try {
          const sessions = await listSessions(); // registry · ONCE
          const patches: Array<{
            ulid: string;
            transcriptSnippet?: string;
            transcriptLastUserInput?: string;
            transcriptLastModelOutput?: string;
            transcriptLastReadAt?: number;
            transcriptPath?: string;
          }> = [];
          for (const sessionId of sessionIds) {
            const entry = sessions.find((s) => s.id === sessionId);
            if (!entry) {
              console.warn('[SCS-Bridge LASTTURN] sessionId not found · skip ·', sessionId);
              continue;
            }
            if (!entry.claudeSessionId) {
              console.warn('[SCS-Bridge LASTTURN] no claudeSessionId yet · skip ·', sessionId);
              continue;
            }
            const dir = resolveClaudeProjectDir(entry.cwd); // RegistryEntry.cwd = types.ts:117
            const result = await extractLastTurnSnippet(dir, entry.claudeSessionId);
            if (!result) {
              console.warn('[SCS-Bridge LASTTURN] extraction null · skip ·', sessionId);
              continue;
            }
            patches.push({
              ulid: sessionId,
              transcriptSnippet: result.transcriptSnippet,
              transcriptLastUserInput: result.transcriptLastUserInput,
              transcriptLastModelOutput: result.transcriptLastModelOutput,
              transcriptLastReadAt: result.transcriptLastReadAt,
              transcriptPath: result.transcriptPath,
            });
          }
          if (patches.length > 0) {
            const out = await updateSessionTranscriptSnippets(patches); // C2 batch · ONE chainWrite
            log('scsbridge.lastturn.persisted', {
              requested: sessionIds.length,
              persisted: patches.length,
              written: out.written,
            });
            console.log(
              '[SCS-Bridge LASTTURN] persisted · requested=',
              sessionIds.length,
              '· persisted=',
              patches.length,
              '· written=',
              out.written,
            );
          } else {
            console.warn('[SCS-Bridge LASTTURN] no patches accumulated · skip write');
          }
        } catch (err) {
          const messageStr = err instanceof Error ? err.message : String(err);
          log('scsbridge.lastturn.error', { message: messageStr });
          console.error('[SCS-Bridge LASTTURN] error · error=', messageStr);
        }
      })();

      return action.strategy ? strategySuccess(action.strategy) : muxiumConclude();
    }),
});
