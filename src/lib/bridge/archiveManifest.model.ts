/**
 * archiveManifest.model.ts — the archive scan/read primitives (SE · Epoch Extension)
 *
 * PURE module · zero Stratimux/Huirth deps. Reads the flat dated archive tree
 * (Cascades/Archive/YYYY/MM/DD/<id>.entry.json + <claudeSessionId>.jsonl) and produces
 * the ATMS shapes. Used bridge-side by the SEAP GET handlers; the SCP-side AMWP watcher
 * keeps a byte-identical SMFT copy (different package) for the manifest broadcast.
 *
 * Resilience (AFPR/RDSC/EJMP): an absent Cascades/Archive/ → empty manifest (never a
 * throw); a malformed/partial <id>.entry.json → skipped, never crashes the scan.
 *
 * Citation: EPOCH-EXT-SE-S1-RED-CURATION.md (scan) · EPOCH-EXT-SE-S2-ORANGE-NAMING.md ATMS
 */
import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { claudeArchiveRoot } from './paths';
import { extractLastTurnSnippet } from './lastTurnExtraction.model';
import type { ArchiveEntryJson, ArchiveManifestEntry, ArchiveContents } from './archiveManifest.types';
import { manifestEntryFromJson } from './archiveManifest.types';
import { log } from './debugLog';

export const MANIFEST_CAP = 50; // RDSC · bound the manifest as archives accumulate

// Recursively collect all *.entry.json paths under the archive root (YYYY/MM/DD/<id>.entry.json).
// AFPR: absent / unreadable dir → skip (returns []). Never throws.
async function collectEntryJsonPaths(root: string): Promise<string[]> {
  const out: string[] = [];
  async function walk(dir: string): Promise<void> {
    let names: string[];
    try {
      names = await readdir(dir);
    } catch {
      return; // absent / unreadable → skip (AFPR)
    }
    for (const name of names) {
      const full = path.join(dir, name);
      try {
        const s = await stat(full);
        if (s.isDirectory()) {
          await walk(full);
        } else if (name.endsWith('.entry.json')) {
          out.push(full);
        }
      } catch {
        // race / vanished entry → skip
      }
    }
  }
  await walk(root);
  return out;
}

async function readEntryJson(p: string): Promise<ArchiveEntryJson | null> {
  try {
    const parsed = JSON.parse(await readFile(p, 'utf8')) as ArchiveEntryJson;
    if (parsed && typeof parsed.id === 'string') return parsed;
    return null;
  } catch {
    return null; // malformed / partial (EJMP) → skip
  }
}

// ATMS · build the manifest (sorted archivedAt desc, capped). Absent root → [].
export async function buildArchiveManifest(): Promise<ArchiveManifestEntry[]> {
  const paths = await collectEntryJsonPaths(claudeArchiveRoot());
  const entries: ArchiveEntryJson[] = [];
  for (const p of paths) {
    const e = await readEntryJson(p);
    if (e) entries.push(e);
  }
  entries.sort((a, b) => b.archivedAt - a.archivedAt);
  log('archiveManifest.build', { count: entries.length });
  return entries.slice(0, MANIFEST_CAP).map(manifestEntryFromJson);
}

// ATMS · read one archived session's contents by ULID: find <id>.entry.json, read it,
// then extract the last turn from the SIBLING <claudeSessionId>.jsonl in the SAME dated
// dir (EAPS — derive the .jsonl dir from the entry.json's own dir, not re-computed).
// Returns null when no matching entry.json exists.
export async function readArchiveContents(id: string): Promise<ArchiveContents | null> {
  const paths = await collectEntryJsonPaths(claudeArchiveRoot());
  const target = paths.find((p) => path.basename(p) === `${id}.entry.json`);
  if (!target) return null;
  const entry = await readEntryJson(target);
  if (!entry) return null;
  let lastTurn: ArchiveContents['lastTurn'] = null;
  if (entry.claudeSessionId) {
    lastTurn = await extractLastTurnSnippet(path.dirname(target), entry.claudeSessionId);
  }
  return { entry, lastTurn };
}
