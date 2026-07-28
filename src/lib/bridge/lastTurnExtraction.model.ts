/**
 * lastTurnExtraction.model.ts — Last-Turn Snippet Extraction (LTSP · D1 Model File)
 *
 * DIAGNOSTIC-REENGAGED R2 · Last-Turn MCP-Mediated Single-Writer · S3 Ochre §1.
 *
 * PURE module · zero Stratimux/Huirth deps · CLI-importable. Individualizes the
 * extraction logic previously embedded in the SCP-side AQSD Quality
 * (scsBridgeReadSessionTranscript.quality.huirth.ts) into a dispatch-free helper
 * callable from the CLI MCP handler quality (and potentially the Stop hook).
 *
 * Lifted VERBATIM from scsBridgeReadSessionTranscript.quality.huirth.ts:
 *   readJsonlForSession   (quality :43-53 · PUTR per-ulid · NO directory-MRU fallback)
 *   extractContentText    (quality :58-77 · c.type==='text' filter MANDATORY)
 *   extractLastTurn       (quality :82-111 · LTUM line-by-line try/catch parse)
 *   TSTR truncation       (quality :155-158)
 *   transcriptLastReadAt  (quality :169 · Date.now())
 *
 * resolveClaudeProjectDir is the SINGLE HOME for the CSJP Path-B encoding rule
 * (cwd.replace(/\//g,'-')) — byte-identical to the watcher targetFile and the
 * quality CSJP. No drift.
 *
 * Naming rationale (S2 Rust LTSP lineage): `.model.ts` suffix per Stratidian
 * convention for pure, dispatch-free, Stratimux-agnostic helpers
 * (cf. muxonomy.model.ts, diametric.model.ts). NO `.huirth.ts` suffix.
 *
 * Citation: DIAGNOSTIC-REENGAGED-R2-LASTTURN-MCP-S3-OCHRE-BLUEPRINT.md §1
 * Citation: DIAGNOSTIC-REENGAGED-R2-LASTTURN-MCP-S6-COMPOSITION-VALIDATION.md §C (C1 unchanged)
 */
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';

// TSWB · Transcript-Snippet-Write-Bundle shape (S3 §1 signature)
export interface LastTurnExtractionResult {
  transcriptSnippet: string; // TSTR · 120-char truncated lastModel + ellipsis
  transcriptLastUserInput: string;
  transcriptLastModelOutput: string;
  transcriptLastReadAt: number; // Date.now() at read
  transcriptPath: string; // resolved .jsonl path (LSSD/diagnostic)
}

// PUTR · Per-Ulid-Transcript-Reader (lifted quality :43-53)
// Resolves the EXACT per-session JSONL via CSJP path construction
// (path.join(sessionDir, `${claudeSessionId}.jsonl`)) — NO readdir, NO mtime-sort.
// Returns null on missing claudeSessionId, ENOENT, or any read failure.
// CRITICAL: NEVER falls back to directory-MRU — RMRA defeated structurally.
function readJsonlForSession(
  sessionDir: string,
  claudeSessionId: string,
): Promise<{ content: string; filePath: string } | null> {
  if (!claudeSessionId) return Promise.resolve(null);
  // CSJP · Claude-Session-JSONL-Path — byte-identical to watcher targetFile
  const filePath = path.join(sessionDir, `${claudeSessionId}.jsonl`);
  return stat(filePath)
    .then(() => readFile(filePath, 'utf-8').then((content) => ({ content, filePath })))
    .catch(() => null);
}

// LTUM helper — handles nested content shapes present in Claude Code JSONL (lifted quality :58-77)
// c.type === 'text' filter MANDATORY — skips thinking blocks (prevents garbage bytes)
function extractContentText(entry: Record<string, unknown>): string {
  if (typeof entry?.content === 'string') return entry.content as string;
  if (Array.isArray(entry?.content)) {
    return (entry.content as Array<Record<string, unknown>>)
      .map((c) => (c && typeof c === 'object' && c.type === 'text' && typeof c.text === 'string' ? (c.text as string) : ''))
      .filter(Boolean)
      .join(' ')
      .trim();
  }
  const msg = entry?.message as Record<string, unknown> | undefined;
  if (typeof msg?.content === 'string') return msg.content as string;
  if (Array.isArray(msg?.content)) {
    return (msg.content as Array<Record<string, unknown>>)
      .map((c) => (c && typeof c === 'object' && c.type === 'text' && typeof c.text === 'string' ? (c.text as string) : ''))
      .filter(Boolean)
      .join(' ')
      .trim();
  }
  return '';
}

// LTUM · Last-Turn-User-Model (lifted quality :82-111)
// Parses JSONL content line-by-line with HAZARD-D defensive parse.
// Returns the terminal user message and terminal model message.
function extractLastTurn(jsonlContent: string): {
  lastUser: string;
  lastModel: string;
} {
  const lines = jsonlContent.split('\n').filter((l) => l.trim().length > 0);
  let lastUser = '';
  let lastModel = '';

  for (const line of lines) {
    try {
      // HAZARD-D-Reuse: JSON.parse in try/catch — skip malformed/binary lines
      const obj = JSON.parse(line) as Record<string, unknown>;
      const role = (obj?.role ?? obj?.type) as string | undefined;
      if (!role) continue;

      const content = extractContentText(obj);
      if (!content) continue;

      if (role === 'user') {
        lastUser = content;
      } else if (role === 'assistant') {
        lastModel = content;
      }
    } catch {
      // HAZARD-D: skip silently — never throw out of extractor
    }
  }

  return { lastUser, lastModel };
}

// CSJP encoding — single home for Path-B policy (S3 §1 Path Helper)
//   os.homedir() / '.claude' / 'projects' / cwd.replace(/\//g, '-')
export function resolveClaudeProjectDir(cwd: string): string {
  const encodedCwd = cwd.replace(/\//g, '-');
  return path.join(os.homedir(), '.claude', 'projects', encodedCwd);
}

// extractLastTurnSnippet — read JSONL → extract → return the bundle. PURE.
// null on missing claudeSessionId / ENOENT / parse-fail.
export async function extractLastTurnSnippet(
  sessionDir: string,
  claudeSessionId: string,
): Promise<LastTurnExtractionResult | null> {
  if (!claudeSessionId) return null;
  const result = await readJsonlForSession(sessionDir, claudeSessionId);
  if (!result) return null;
  const { content, filePath } = result;
  const { lastUser, lastModel } = extractLastTurn(content);
  // TSTR: 120-char truncated snippet (lifted quality :155-158)
  const transcriptSnippet =
    lastModel.length > 0 ? lastModel.slice(0, 120) + (lastModel.length > 120 ? '…' : '') : '';
  return {
    transcriptSnippet,
    transcriptLastUserInput: lastUser,
    transcriptLastModelOutput: lastModel,
    transcriptLastReadAt: Date.now(), // lifted quality :169
    transcriptPath: filePath,
  };
}
