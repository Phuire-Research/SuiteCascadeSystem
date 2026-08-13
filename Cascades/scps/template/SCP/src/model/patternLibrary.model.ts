/**
 * patternLibrary.model.ts — D-PSVG · PSVG-1 · THE PER-SCP JSON PATTERN LIBRARY (server stratum)
 *
 * THE NAME LAW: shared · token-free · never copied by the mint.
 *
 * THE AVAILABILITY SUBSTRATE: Cascades/patternLibrary.json is the SCP's EXTENSIBLE pattern
 * truth — the SyncLibrary's SECOND ACCOUNTED CITIZEN (scpSyncLibrary.model.ts ·
 * ACCOUNTED_PATTERN_LIBRARY_KEY). A NEW pattern is a JSON drop: no code edit, no Turn Over;
 * a foreign observer enumerates + previews a target's patterns through the accounted stamp
 * lane + the /scp-pattern-library/:scpName query (cascadeMemoryQuery.model.ts). The in-code
 * PATTERN_LIBRARY (suitePatternOverride.model.ts) stays the FACTORY FLOOR — the JSON seeds
 * from it once and extends beyond it; on id collision the in-code entry WINS (the collision
 * law lives at applySuitePatternOverrides).
 *
 * THE SEED LAW: write-if-absent ONLY — an existing file is NEVER clobbered (a citizen's
 * hand-authored patterns are its truth; a malformed file is the citizen's to mend). THE
 * INJECTION LAW: every css value entering the runtime must pass isValidPatternCss
 * (url("data:image/svg+xml,…") anor 'none') — re-exported here as Band 2's Huirth-side gate.
 *
 * The client-side loader pair lives in patternLibraryClientAccess.model.ts (the fs/fetch
 * split — the hifiConfig.model.ts / scpSyncLibrary.model.ts convention); the shape normalizer
 * is single-sourced there and reused by the fs read below.
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import {
  PATTERN_LIBRARY,
  isValidPatternCss,
  type RuntimePatternEntry,
} from './suitePatternOverride.model';
import {
  normalizePatternLibraryDocument,
  type PatternLibraryDocument,
} from './patternLibraryClientAccess.model';
import { sinkSyncLibraryTelemetry } from './scpSyncLibrary.model';

// The Band 2 Huirth-side gate rides this model (the injection law's server seat).
export { isValidPatternCss };
export type { PatternLibraryDocument, RuntimePatternEntry };

export const PATTERN_LIBRARY_SCHEMA_VERSION = '1';

// The library's one seat — <root>/Cascades/patternLibrary.json (the hifiConfig.json sibling:
// SCP-global, the package root's Cascades/, observed at whichever root the locality names).
export const resolvePatternLibraryPath = (root: string): string =>
  path.resolve(root, 'Cascades', 'patternLibrary.json');

// Read a root's pattern library — Honest-Absence null on absent / unreadable / malformed /
// non-document shape (the normalizer's law · patternLibraryClientAccess.model.ts).
export const readPatternLibrary = (root: string): PatternLibraryDocument | null => {
  try {
    return normalizePatternLibraryDocument(
      JSON.parse(readFileSync(resolvePatternLibraryPath(root), 'utf8')) as unknown,
    );
  } catch {
    return null;
  }
};

export type PatternLibrarySeedResult = { wrote: boolean; reason: string };

// THE BOOT SEED (write-if-absent · the Lambda-event): an absent Cascades/patternLibrary.json
// is written FROM the in-code factory floor (the PATTERN_LIBRARY entries verbatim); ANY
// existing file — well-formed anor not — stands untouched (never clobber). Never throws —
// a failed write is telemetry (the sync-library sink: the library IS an accounted citizen).
export const seedPatternLibraryIfAbsent = (root: string): PatternLibrarySeedResult => {
  const filePath = resolvePatternLibraryPath(root);
  try {
    readFileSync(filePath, 'utf8');
    return { wrote: false, reason: 'exists' };
  } catch {
    /* absent — the seed writes below */
  }
  const document: PatternLibraryDocument = {
    schemaVersion: PATTERN_LIBRARY_SCHEMA_VERSION,
    patterns: PATTERN_LIBRARY.map((entry) => ({ id: entry.id, label: entry.label, css: entry.css })),
  };
  try {
    mkdirSync(path.dirname(filePath), { recursive: true });
    writeFileSync(filePath, JSON.stringify(document, null, 2) + '\n', 'utf8');
    sinkSyncLibraryTelemetry('pattern-library.seed.wrote', {
      root,
      patternCount: document.patterns.length,
    });
    return { wrote: true, reason: 'seeded-from-factory' };
  } catch (err) {
    sinkSyncLibraryTelemetry('pattern-library.seed.write-failed', { root, error: String(err) });
    return { wrote: false, reason: 'write-failed' };
  }
};
