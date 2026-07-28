/**
 * archiveManifest.types.ts — ATMS · Archive-Tab-Manifest-Shape (SE · Epoch Extension)
 *
 * The TypeScript contract shared by the Server-Extension archive endpoints (SEAP ·
 * GET /sessionArchive/ + /:id) and the archive-manifest writer (AEJP · the
 * <id>.entry.json projection). PURE types — zero runtime deps — so both the bridge
 * GET handler and the SCP-side AMWP watcher (SMFT byte-copy) reference one shape.
 *
 * AEJP projection rationale: the persisted <id>.entry.json carries the durable,
 * non-transient subset of a RegistryEntry — enough to render the manifest row AND
 * the contents view — explicitly EXCLUDING transient state (claudePid,
 * terminalWindowId, activeTool/permission*, isProcessing) and the transcript fields
 * (the last turn is read live from the archived .jsonl via extractLastTurnSnippet at
 * GET time). `archivedAt` is the move's `now.getTime()` — the manifest sort key.
 *
 * Citation: EPOCH-EXT-SE-S2-ORANGE-NAMING.md §ATMS/AEJP · EPOCH-DIAMOND §6 SE Build-Card
 */

// AEJP · the on-disk <id>.entry.json projection (constrained RegistryEntry subset).
export interface ArchiveEntryJson {
  id: string; // ULID — the manifest key + the entry.json filename basename
  claudeSessionId?: string; // pairs with <claudeSessionId>.jsonl in the same dated dir
  archivedAt: number; // ms epoch — move time (now.getTime()); manifest sort key
  label?: string; // user-facing (scsLabel ?? displayName)
  cwd: string;
  suite8Name?: string;
  scpName?: string;
  spawnedAt: number;
  status: string;
  preview?: string; // last-known snippet (transcriptSnippet ?? finalTurnSummary)
}

// ATMS · GET /sessionArchive/ manifest row (the lightweight list shape · UFRT-in-state).
export interface ArchiveManifestEntry {
  id: string;
  claudeSessionId?: string;
  archivedAt: number;
  label?: string;
  suite8Name?: string;
  preview?: string;
}

// ATMS · GET /sessionArchive/:id contents (entry metadata + the on-demand last turn).
// `lastTurn` mirrors LastTurnExtractionResult (lastTurnExtraction.model.ts); null when
// the archived session has no .jsonl (absent claudeSessionId or moved-but-empty).
export interface ArchiveContents {
  entry: ArchiveEntryJson;
  lastTurn: {
    transcriptSnippet: string;
    transcriptLastUserInput: string;
    transcriptLastModelOutput: string;
    transcriptLastReadAt: number;
    transcriptPath: string;
  } | null;
}

// The manifest entry derives from the on-disk projection (drops the heavier fields).
export function manifestEntryFromJson(e: ArchiveEntryJson): ArchiveManifestEntry {
  return {
    id: e.id,
    claudeSessionId: e.claudeSessionId,
    archivedAt: e.archivedAt,
    label: e.label,
    suite8Name: e.suite8Name,
    preview: e.preview,
  };
}
