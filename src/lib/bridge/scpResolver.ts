import { readFile } from 'node:fs/promises';
import { isAbsolute, relative, resolve } from 'node:path';

/**
 * SS-P1 · SAID Diameter · CWD-Match Resolver
 *
 * Reads Cascades/SCPs.json relative to process.cwd() and resolves whether a
 * given session cwd falls inside any registered SCP installPath. The CHCS
 * pattern (Claude Code sanitizes ambient env before hook fires) makes this
 * resolver the secondary path — SCS_BRIDGE_SCP_NAME env-prefix injection is
 * the explicit-override primary; CWD-match is the auto-detect fallback.
 *
 * Field grounding (R3 + R5 source-read): ScpRegistryEntry has `path: string`
 * (NOT `installPath`) at scpPersistence.ts:47. `buildScpRegistryEntry` accepts
 * `installPath` as factory input but stores it under the `path` field.
 *
 * Algorithm (PRCTM · Path-Relative-Containment-Test):
 *   path.relative(scpPath, cwd) — if result does NOT begin with '..' AND is not
 *   itself an absolute path, cwd is inside scpPath. Cross-platform via node:path.
 *
 * Longest-prefix-wins on overlap: sort entries by path length descending,
 * return first match (most-specific SCP).
 *
 * Graceful absence: ENOENT, malformed JSON, empty array, missing/blank entry
 * fields all return undefined. NEVER throws.
 */
export async function resolveScpNameFromCwd(cwd: string): Promise<string | undefined> {
  if (!cwd) return undefined;

  let raw: string;
  try {
    const scpsPath = resolve(process.cwd(), 'Cascades', 'SCPs.json');
    raw = await readFile(scpsPath, 'utf8');
  } catch {
    return undefined;
  }

  let parsed: { scps?: Array<{ name?: string; path?: string }> };
  try {
    parsed = JSON.parse(raw) as { scps?: Array<{ name?: string; path?: string }> };
  } catch {
    process.stderr.write('[scs-bridge] SCPs.json malformed — scpName CWD-match skipped\n');
    return undefined;
  }

  if (!parsed || !Array.isArray(parsed.scps) || parsed.scps.length === 0) {
    return undefined;
  }

  const candidates = parsed.scps.filter(
    (entry): entry is { name: string; path: string } =>
      typeof entry?.name === 'string' &&
      entry.name.length > 0 &&
      typeof entry?.path === 'string' &&
      entry.path.length > 0,
  );

  if (candidates.length === 0) return undefined;

  const sorted = [...candidates].sort((a, b) => b.path.length - a.path.length);

  const resolvedCwd = resolve(cwd);
  for (const entry of sorted) {
    const resolvedScp = resolve(process.cwd(), entry.path);
    const rel = relative(resolvedScp, resolvedCwd);
    if (rel === '' || (!rel.startsWith('..') && !isAbsolute(rel))) {
      return entry.name;
    }
  }

  return undefined;
}
