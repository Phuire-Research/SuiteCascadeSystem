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
import { updateSessionTranscriptSnippets, listSessions, setSessionModel } from '../../../registry';
import { log } from '../../../debugLog';

export type { ScsBridgePersistLastTurn };

/**
 * OBSERVE · the IN-PROCESS half of the precedence law (C1104). Remembers the model
 * last OBSERVED per ulid so an unchanged observation never re-enters the chainWrite
 * queue on the 4,984-events/day beat — and, crucially, never re-clobbers a page-fired
 * SET with a value nothing changed. The DURABLE half is entry.modelSetAt in the
 * registry; this map is only the throttle.
 */
const lastObservedModel = new Map<string, string>();

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
          // OBSERVE · accumulated alongside the snippet patches, written AFTER the
          // batch so the snippet write stays ONE json-watcher event.
          const observations: Array<{ ulid: string; id: string; at: number | null }> = [];
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
            if (result.transcriptLastModelId) {
              observations.push({
                ulid: sessionId,
                id: result.transcriptLastModelId,
                at: result.transcriptLastModelAt,
              });
            }
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
          // OBSERVE · one setSessionModel per CHANGED observation, after the batch.
          // chainWrite serialises these against the batch and any concurrent SET;
          // setSessionModel re-guards the id against the catalog and enforces the
          // modelSetAt precedence gate, so nothing invalid or stale can land.
          for (const obs of observations) {
            if (lastObservedModel.get(obs.ulid) === obs.id) continue;
            lastObservedModel.set(obs.ulid, obs.id);
            await setSessionModel(obs.ulid, obs.id, 'observed', obs.at);
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
