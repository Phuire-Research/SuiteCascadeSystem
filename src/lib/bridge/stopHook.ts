/**
 * D3C · JTCH · JSONL-Turn-Count-Hook
 *
 * Stop hook fired by Claude Code once per completed assistant turn (TPSR invariant).
 * Reads the JSONL transcript at `transcript_path`, counts assistant entries, extracts
 * the last assistant message, truncates to 200 chars, and updates the session
 * registry entry via TICR (updateSessionTurnState).
 *
 * HAZARD-E mitigation (MANDATORY): filters `hook_event_name !== 'Stop'` immediately
 * after stdin parse. Without this filter, SubagentStop fires would inflate
 * finalTurnIndex by counting subagent completions as user turns.
 *
 * HAZARD-D mitigation: defensive per-line JSON.parse with skip-on-malformed —
 * tail line may be incomplete when JSONL flush races the hook subprocess.
 *
 * Citation: D3C-CURRYING-FOUNDATION-R2-RUST-PROSPECTING.md §JTCH §TRAS §TICR
 * Citation: D3C-CURRYING-FOUNDATION-R4-VIRIDIAN-AUDIT.md §HAZARD-E §HAZARD-D
 */

import { readFile } from 'node:fs/promises';
import { readStdin } from './sessionStartHook';
import { setDebugEnabled, log } from './debugLog';
import { tdia } from './tdia';
import { updateSessionTurnState } from './registry';

interface StopHookPayload {
  session_id?: string;
  transcript_path?: string;
  cwd?: string;
  permission_mode?: string;
  hook_event_name?: string;
}

interface JsonlEntry {
  type?: string;
  role?: string;
  content?: unknown;
  message?: {
    content?: unknown;
  };
}

function extractContent(entry: JsonlEntry): string {
  const direct = entry.content;
  if (typeof direct === 'string') return direct;
  if (Array.isArray(direct)) {
    return direct
      .map((c) => {
        if (c && typeof c === 'object' && 'text' in c) {
          const t = (c as { text?: unknown }).text;
          return typeof t === 'string' ? t : '';
        }
        return '';
      })
      .join(' ');
  }
  const nested = entry.message?.content;
  if (typeof nested === 'string') return nested;
  return '';
}

export async function runStopHook(): Promise<void> {
  // W1.6 · D2 Recurse-5 BNPC diagnostic · stop hook fire-site entry log
  // Symmetric to W1.5 in sessionStartHook.ts. Unconditional log on every fire —
  // captures Node context evidence (pid/ppid/execPath/argv) so post-fix run
  // proves the Stop hook actually executes under Node (NOT Electron).
  tdia('hook.fire.stop', {
    pid: process.pid,
    ppid: process.ppid,
    execPath: process.execPath,
    argv: process.argv,
    ulid: process.env.SCS_BRIDGE_ULID ?? null,
    cwd: process.cwd(),
    isElectronCtx: !!process.versions.electron,
  });
  const ulid = process.env.SCS_BRIDGE_ULID;
  if (!ulid) {
    log('stop.hook.no-ulid', {});
    process.exit(0);
  }

  if (process.env.SCS_BRIDGE_DEBUG === '1') setDebugEnabled(true);

  let stdinPayload: string;
  try {
    stdinPayload = await readStdin();
  } catch {
    process.exit(0);
  }

  let parsed: StopHookPayload = {};
  try {
    parsed = JSON.parse(stdinPayload);
  } catch (err) {
    log('stop.hook.parse-failed', { err: String(err) });
    process.exit(0);
  }

  // HAZARD-E MANDATORY · SubagentStop filter
  // Citation: D3C-CURRYING-FOUNDATION-R4-VIRIDIAN-AUDIT.md §HAZARD-E
  // Without this guard, every subagent tool-call completion would increment
  // finalTurnIndex, making the turn counter meaningless.
  if (parsed.hook_event_name !== 'Stop') {
    log('stop.hook.subagent-filtered', { event: parsed.hook_event_name });
    process.exit(0);
  }

  // HAZARD-D mitigation · defensive JSONL parsing.
  // Transcript may have an incomplete tail line when flush races the hook fire.
  // Skip malformed lines silently; report what successfully parsed.
  let finalTurnSummary: string | undefined;
  let finalTurnIndex: number | undefined;
  if (parsed.transcript_path) {
    try {
      const raw = await readFile(parsed.transcript_path, 'utf-8');
      const lines = raw.split('\n').filter((l) => l.trim().length > 0);
      let assistantCount = 0;
      let lastAssistantContent: string | undefined;
      for (const line of lines) {
        try {
          const obj = JSON.parse(line) as JsonlEntry;
          const isAssistant = obj?.type === 'assistant' || obj?.role === 'assistant';
          if (isAssistant) {
            assistantCount++;
            const content = extractContent(obj);
            if (content) lastAssistantContent = content;
          }
        } catch {
          // HAZARD-D · skip malformed/incomplete line silently
        }
      }
      finalTurnIndex = assistantCount;
      finalTurnSummary = lastAssistantContent?.slice(0, 200);
    } catch (err) {
      log('stop.hook.transcript-read-failed', {
        err: String(err),
        path: parsed.transcript_path,
      });
    }
  }

  const lastActivityAt = Date.now();
  const finalTurnTimestamp = new Date().toISOString();

  try {
    await updateSessionTurnState(ulid, {
      lastActivityAt,
      finalTurnIndex,
      finalTurnTimestamp,
      finalTurnSummary,
      isProcessing: false,  // D3D · BLOCKING-2 fix · TPCT WORKING→OPEN transition
    });
    console.log(
      '[SCS-Bridge JTCH] Turn state updated · ulid=',
      ulid,
      '· turnIndex=',
      finalTurnIndex,
      '· isProcessing=false',
    );
    log('stop.hook.turn-updated', {
      ulid,
      finalTurnIndex,
      summaryLen: finalTurnSummary?.length ?? 0,
      isProcessing: false,
    });
  } catch (err) {
    log('stop.hook.update-failed', { err: String(err) });
  }

  process.exit(0);
}
