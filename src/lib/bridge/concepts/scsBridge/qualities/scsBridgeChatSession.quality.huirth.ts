/**
 * scsBridgeChatSession · D3RM-G · CHAT · PCBW (Pending-Chat-Batch-Write)
 *
 * BMTI Quality · MCP tool 'scp_chat_session'. Sibling to CMIA-Focus
 * (scsBridgeFocusSession). Writes the user's chat message to the per-session
 * UIMJ queue file (~/.claude/pending-chat/{ulid}.txt) using atomic tmp→rename
 * write semantics; ACK-only response. The CHMH Stop hook (registered via
 * spawnSettings with asyncRewake: true) reads the queue at the target session's
 * next turn-end and injects the message via process.stdout.write + exit(2).
 *
 * Form-α (Method+Reducer). Reducer returns {} · no own-state mutation.
 * Chat is a side-effect-only operation (ACK-OD pattern) — the WriteFile is the
 * Lambda, no UI state changes on the server. Atomic write avoids partial-read
 * race with the hook subprocess. Pre-flight ensures the pending-chat directory
 * exists (mkdir -p semantics) on first write per session/host.
 *
 * Hook-side resolution: the queue file is keyed by ULID (not claudeSessionId)
 * because the hook subprocess has only SCS_BRIDGE_ULID env var available; the
 * server Quality knows both, so it writes to the path the hook can read.
 *
 * Template: scsBridgeFocusSession.quality.huirth.ts (form-α + side-effect path)
 * Citation: D3RM-G-FOUNDATION-R7-FUCHSIA-CLINICAL.md §5 Wave 2
 * Citation: D3RM-G-FOUNDATION-R6-PURPLE-ORCHESTRATION.md §4 Architecture
 * Citation: D3RM-G-FOUNDATION-R1-RED-CURATION.md §4 (MCP registration pattern)
 */

import {
  createQualityCardWithPayload,
  createMethodWithConcepts,
  selectPayload,
  muxiumConclude,
  strategySuccess,
} from 'stratimux';
import { promises as fs } from 'node:fs';
import { dirname } from 'node:path';
import type {
  ScsBridgeState,
  ScsBridgeChatSessionPayload,
  ScsBridgeChatSession,
} from '../scsBridge.types';
import { pendingChatPath } from '../../../paths';
import { listSessions } from '../../../registry';
import { log } from '../../../debugLog';

export type { ScsBridgeChatSession };

export const scsBridgeChatSession = createQualityCardWithPayload<
  ScsBridgeState,
  ScsBridgeChatSessionPayload
>({
  type: 'Scs Bridge Chat Session',
  reducer: () => ({}),
  methodCreator: () =>
    createMethodWithConcepts(({ action }) => {
      const payload = selectPayload<ScsBridgeChatSessionPayload>(action);
      const { sessionId, message, callerSessionUlid } = payload;

      if (typeof sessionId !== 'string' || sessionId.length === 0) {
        console.error('[Scs Bridge] ChatSession invalid sessionId · skipping');
        return action.strategy ? strategySuccess(action.strategy) : muxiumConclude();
      }
      if (typeof message !== 'string' || message.length === 0) {
        console.error('[Scs Bridge] ChatSession empty message · skipping');
        return action.strategy ? strategySuccess(action.strategy) : muxiumConclude();
      }

      log('scsbridge.chat.dispatched', {
        sessionId,
        messageLength: message.length,
        callerSessionUlid: callerSessionUlid ?? null,
      });
      console.log(
        '[SCS-Bridge CHAT] dispatched · sessionId=',
        sessionId,
        '· messageLength=',
        message.length,
        '· callerSessionUlid=',
        callerSessionUlid ?? null,
      );

      // Side-effect-only · fire-and-forget per scsBridgeFocusSession pattern.
      // PCBW: atomic tmp→rename write to UIMJ queue. The CHMH Stop hook will
      // read this file on the next turn-end in the target session and inject
      // via process.stdout.write + exit(2) (asyncRewake mechanism).
      void (async (): Promise<void> => {
        try {
          // Resolve session entry to confirm it exists in the bridge registry.
          // We still write the queue file keyed by the requested ULID even if
          // the registry lookup is empty — this preserves the "deliver on next
          // turn" semantic for sessions that may be re-launching.
          const sessions = await listSessions();
          const entry = sessions.find((s) => s.id === sessionId);
          if (!entry) {
            console.warn(
              '[SCS-Bridge CHAT] sessionId not found in registry · writing queue anyway · sessionId=',
              sessionId,
            );
          }

          const queuePath = pendingChatPath(sessionId);
          const tmpPath = `${queuePath}.tmp`;

          // Ensure parent directory exists (mkdir -p semantics).
          await fs.mkdir(dirname(queuePath), { recursive: true });

          // Atomic write: tmp → rename. Prevents partial-read races with hook.
          await fs.writeFile(tmpPath, message, 'utf8');
          await fs.rename(tmpPath, queuePath);

          log('scsbridge.chat.queued', {
            sessionId,
            queuePath,
            messageLength: message.length,
          });
          console.log(
            '[SCS-Bridge CHAT] queued · sessionId=',
            sessionId,
            '· queuePath=',
            queuePath,
            '· awaiting next turn-end Stop hook · asyncRewake delivery',
          );
        } catch (err) {
          const messageStr = err instanceof Error ? err.message : String(err);
          log('scsbridge.chat.error', { sessionId, message: messageStr });
          console.error(
            '[SCS-Bridge CHAT] ChatSession error · sessionId=',
            sessionId,
            '· error=',
            messageStr,
          );
        }
      })();

      return action.strategy ? strategySuccess(action.strategy) : muxiumConclude();
    }),
});
