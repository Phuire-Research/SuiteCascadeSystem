/**
 * patternLibraryClientAccess.model.ts — D-PSVG · PSVG-1 · THE CLIENT LOADER PAIR (fetch stratum)
 *
 * THE NAME LAW: shared · token-free · never copied by the mint.
 *
 * CLIENT-SAFE by construction — fetch only, NO node:fs (the split convention the hifiConfig /
 * sync-library pair demonstrates: hifiConfig.model.ts carries the client fetch lanes while the
 * server fs lives elsewhere; here the fs half lives in patternLibrary.model.ts and THIS half
 * rides the browser bundle).
 *
 * loadOwnPatternLibrary — GET /pattern-library (the SCP's own JSON · vue.principle.ts).
 * loadTargetPatternLibrary — GET /scp-pattern-library/:scpName (the cross-SCP query surface ·
 * cascadeMemoryQuery.model.ts — the /scp-hifi-config sibling). Both Honest-Absence null on
 * 404 / absent / unreadable / malformed / non-document (the server serves {} for absence; a
 * {} with no schemaVersion resolves null — the loadTargetHifiConfig discipline verbatim).
 */
import type { RuntimePatternEntry } from './suitePatternOverride.model';

// The per-SCP JSON pattern library document — Cascades/patternLibrary.json. `patterns` entries
// carry OPEN string ids (the runtime registry's shape); the css injection gate (isValidPatternCss)
// fires at the CONSUMING boundary (registerRuntimePatterns anor the Band 2 Huirth write leg),
// never here — an invalid entry names its skip reason where it matters.
export interface PatternLibraryDocument {
  schemaVersion: string;
  patterns: RuntimePatternEntry[];
}

const isPlainObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

// Normalize a raw parsed JSON into the document shape — null on non-document (no schemaVersion
// anor no patterns array); entries shape-filtered (string id + css required; absent label falls
// back to the id). Shared by BOTH read lanes (the server fs read + the fetch pair) — the shape
// law is single-sourced here.
export const normalizePatternLibraryDocument = (raw: unknown): PatternLibraryDocument | null => {
  if (!isPlainObject(raw) || typeof raw.schemaVersion !== 'string' || !Array.isArray(raw.patterns)) {
    return null;
  }
  const patterns: RuntimePatternEntry[] = [];
  for (const entry of raw.patterns) {
    if (!isPlainObject(entry)) continue;
    if (typeof entry.id !== 'string' || entry.id.trim().length === 0) continue;
    if (typeof entry.css !== 'string') continue;
    patterns.push({
      id: entry.id,
      label: typeof entry.label === 'string' && entry.label.length > 0 ? entry.label : entry.id,
      css: entry.css,
    });
  }
  return { schemaVersion: raw.schemaVersion, patterns };
};

// Fetch the SCP's OWN pattern library via the server endpoint. Null on absent/unreadable/malformed.
export async function loadOwnPatternLibrary(): Promise<PatternLibraryDocument | null> {
  if (typeof window === 'undefined') return null;
  try {
    const r = await fetch('/pattern-library');
    if (!r.ok) return null;
    return normalizePatternLibraryDocument((await r.json()) as unknown);
  } catch {
    return null;
  }
}

// Fetch a TARGET SCP's pattern library by name via the cross-SCP query surface — the read-only
// twin of loadOwnPatternLibrary for ANOTHER citizen's library (the foreign observer's
// enumerate + preview lane). Null on 404 / absent / unreadable / malformed / non-document.
export async function loadTargetPatternLibrary(scpName: string): Promise<PatternLibraryDocument | null> {
  if (typeof window === 'undefined') return null;
  if (!scpName) return null;
  try {
    const r = await fetch(`/scp-pattern-library/${encodeURIComponent(scpName)}`);
    if (!r.ok) return null;
    return normalizePatternLibraryDocument((await r.json()) as unknown);
  } catch {
    return null;
  }
}
