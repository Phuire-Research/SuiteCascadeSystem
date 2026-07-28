/**
 * sessionArchival.model.ts — Real-Session-Teardown-Model (RSTM · Dissolution + Archival Diamond)
 *
 * PURE module · zero Stratimux/Huirth deps · CLI-importable. Owns the real
 * ClaudeCode session-file teardown that registry.ts (dissipateSession / archiveSession)
 * composes. Two operations on the stored real session at
 *   ~/.claude/projects/<cwd-dashed>/<claudeSessionId>.jsonl :
 *   - deleteRealClaudeSession  (DAST · Dissolution · resilient unlink)
 *   - archiveRealClaudeSession (ARST · Archival · resilient move → Cascades/Archive/YYYY/MM/DD/)
 *
 * PFCX · Pattern-Four-Crossing: the SCS-Bridge normally NEVER touches Claude's
 * ~/.claude/projects/ storage (the bridge-detached law). This module is the
 * INTENTIONAL, user-directed exception — and it is scoped TIGHTLY: it only ever
 * resolves the SINGLE per-session .jsonl via the single-home encoder
 * (resolveClaudeProjectDir) and operates on that one file. No dir-wide ops, no
 * arbitrary paths.
 *
 * RSAR · Resilient-Session-Absence-Resolution: every op CATCHES internally and
 * returns a {deleted|archived: false} result rather than throwing — so the caller
 * (registry) always proceeds to the sessions.json removal even when the real
 * session is absent (the "delete from sessions.json only" contract, both paths).
 *
 * H1 EXDEV: ~/.claude (home volume) and Cascades/Archive (cwd volume) may differ,
 * which would make fs.rename throw EXDEV. archiveRealClaudeSession therefore uses
 * copyFile + unlink (a true cross-device move) rather than rename.
 *
 * Anti-drift: resolveClaudeProjectDir is imported (NOT re-derived) so the Path-B
 * encoding (cwd.replace(/\//g,'-')) stays single-home with lastTurnExtraction.model.ts.
 *
 * Citation: DISSOLUTION-ARCHIVAL-DIAMOND-WGB.md §2 RSTM/CADD/RSAR/PFCX · §3 H1-H6
 */
import { copyFile, mkdir, rename, stat, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { resolveClaudeProjectDir } from './lastTurnExtraction.model';
import { claudeArchiveRoot } from './paths';
import { log } from './debugLog';
import type { RegistryEntry } from './types';
import type { ArchiveEntryJson } from './archiveManifest.types';

// CSJP-mirror · the single resolved real-session path for a registry entry.
// Byte-identical Path-B encoding to lastTurnExtraction.model.ts (single-home).
export function resolveRealClaudeSessionPath(cwd: string, claudeSessionId: string): string {
  return path.join(resolveClaudeProjectDir(cwd), `${claudeSessionId}.jsonl`);
}

// CADD · dated archive dir Cascades/Archive/YYYY/MM/DD. `now` is injected (PURE).
function pad2(n: number): string {
  return String(n).padStart(2, '0');
}
export function archiveDatedDir(now: Date): string {
  const y = String(now.getFullYear());
  const m = pad2(now.getMonth() + 1);
  const d = pad2(now.getDate());
  return path.join(claudeArchiveRoot(), y, m, d);
}

// DAST · resilient real-session delete. Never throws (RSAR). Returns whether a
// file was actually removed + the path attempted (diagnostic). Missing
// claudeSessionId or ENOENT → { deleted:false } (caller still removes the entry).
export async function deleteRealClaudeSession(
  cwd: string,
  claudeSessionId: string | undefined,
): Promise<{ deleted: boolean; path: string | null }> {
  if (!claudeSessionId || typeof cwd !== 'string' || cwd.length === 0) {
    return { deleted: false, path: null };
  }
  const filePath = resolveRealClaudeSessionPath(cwd, claudeSessionId);
  try {
    await unlink(filePath);
    log('sessionArchival.delete.ok', { path: filePath });
    return { deleted: true, path: filePath };
  } catch (err) {
    // ENOENT (already gone) or any read/perm failure → resilient skip (RSAR).
    log('sessionArchival.delete.absent-or-fail', {
      path: filePath,
      error: err instanceof Error ? err.message : String(err),
    });
    return { deleted: false, path: filePath };
  }
}

// ARST · resilient real-session ARCHIVE (move) to Cascades/Archive/YYYY/MM/DD/.
// Never throws (RSAR). copyFile + unlink = cross-device-safe move (H1 EXDEV).
// Missing source → { archived:false } (caller still removes the entry).
export async function archiveRealClaudeSession(
  cwd: string,
  claudeSessionId: string | undefined,
  now: Date,
): Promise<{ archived: boolean; from: string | null; to: string | null }> {
  if (!claudeSessionId || typeof cwd !== 'string' || cwd.length === 0) {
    return { archived: false, from: null, to: null };
  }
  const from = resolveRealClaudeSessionPath(cwd, claudeSessionId);
  // Resilience: if the source does not exist, skip the move (caller removes entry).
  try {
    await stat(from);
  } catch {
    log('sessionArchival.archive.absent', { from });
    return { archived: false, from, to: null };
  }
  const destDir = archiveDatedDir(now);
  const to = path.join(destDir, `${claudeSessionId}.jsonl`);
  try {
    await mkdir(destDir, { recursive: true });
    // copyFile + unlink (NOT rename) — cross-device safe (H1 EXDEV: home vs cwd volume).
    await copyFile(from, to);
    await unlink(from);
    log('sessionArchival.archive.ok', { from, to });
    return { archived: true, from, to };
  } catch (err) {
    // Move failed (perm / disk) → resilient: report not-archived; caller still
    // removes the registry entry. The source .jsonl is left intact on failure.
    log('sessionArchival.archive.fail', {
      from,
      to,
      error: err instanceof Error ? err.message : String(err),
    });
    return { archived: false, from, to: null };
  }
}

// AEJP · the constrained RegistryEntry → ArchiveEntryJson projection. Durable
// metadata only (excludes transient ATID/PRMX/transcript/pid/windowId); `archivedAt`
// is the move's `now` (shared with archiveDatedDir → path consistency · EAPS/MDEF guard).
export function projectArchiveEntry(entry: RegistryEntry, now: Date): ArchiveEntryJson {
  return {
    id: entry.id,
    claudeSessionId: entry.claudeSessionId,
    archivedAt: now.getTime(),
    label: entry.scsLabel ?? entry.displayName,
    cwd: entry.cwd,
    suite8Name: entry.suite8Name,
    scpName: entry.scpName,
    spawnedAt: entry.spawnedAt,
    status: entry.status,
    preview: entry.transcriptSnippet ?? entry.finalTurnSummary,
  };
}

// ASEC/AEJP · co-locate the session's metadata as <id>.entry.json BESIDE the moved
// <claudeSessionId>.jsonl in the SAME dated folder. Uses `archiveDatedDir(now)` with the
// SAME `now` the caller passed to archiveRealClaudeSession → identical destDir (no
// re-derivation · EAPS/MDEF). Atomic tmp→rename (EJMP — never a partial entry.json the
// manifest scan could read). RSAR: resilient — a write failure NEVER throws (the caller
// still removes the registry entry). Written even when the .jsonl was absent (the entry
// metadata is still archived · keyed by ULID, so independent of claudeSessionId).
export async function archiveEntryMetadata(
  entry: RegistryEntry,
  now: Date,
): Promise<{ written: boolean; to: string | null }> {
  const destDir = archiveDatedDir(now);
  const to = path.join(destDir, `${entry.id}.entry.json`);
  try {
    await mkdir(destDir, { recursive: true });
    const tmp = to + '.tmp';
    await writeFile(tmp, JSON.stringify(projectArchiveEntry(entry, now), null, 2), 'utf8');
    await rename(tmp, to); // EJMP · atomic — the manifest scan never sees a partial file
    log('sessionArchival.entry-json.ok', { ulid: entry.id, to });
    return { written: true, to };
  } catch (err) {
    log('sessionArchival.entry-json.fail', {
      ulid: entry.id,
      to,
      error: err instanceof Error ? err.message : String(err),
    });
    return { written: false, to: null };
  }
}
