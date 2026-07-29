/**
 * scpConfig.model.ts — the per-SCP declarative identity reader (Per-SCP-Identity-Config).
 *
 * Pure helper module — reads `<scpDir>/scp.config.json` → `scpName`. ZERO stratimux
 * imports. ZERO Tier-2 concept coupling. The Higher-Order inversion of the prior
 * env-on-spawn fix: each SCP is a Base Concept declaring its OWN identity in data,
 * and the bridge COMPOSES that identity — it does not OWN the SCP's name.
 *
 * The template ships `Cascades/scps/template/SCP/scp.config.json` = { "scpName": "template" }.
 * `scs scp install <designation>` stamps the same file with { "scpName": <designation> }
 * into the cloned SCP/ dir (finalizeScpInstall). `scs dev` reads the template's config to
 * resolve SCS_BRIDGE_ORIGIN_SCP instead of hard-coding 'template'.
 *
 * Tolerant by design (mirrors loadHifiConfig + the SCPs.json registry read): a missing
 * file, an unreadable file, malformed JSON, or an absent/non-string `scpName` field ALL
 * resolve to null. Callers fall back (dev → 'template'; guard → env-first).
 *
 * Precedent: bridgeMetadata.ts (pure helper · ZERO stratimux · tolerant read pattern).
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';

export const SCP_CONFIG_FILENAME = 'scp.config.json';

export interface ScpConfig {
  scpName: string;
  // D-RD1 · THE APPLIED-COUNTER (the Red Discipline): the scp Muxameter counter last
  // LANDED into this SCP — born at install (the installing package's counter), stamped
  // at every update-apply success. Absent (pre-law SCP) → verdicts fall back to the
  // installed-vs-remote comparison until the first stamped apply.
  scsMuxameterScp?: number | null;
}

/**
 * Reads `<scpDir>/scp.config.json` and returns its `scpName`. Returns null on any
 * failure mode (missing file, unreadable, malformed JSON, absent/non-string field).
 *
 * `scpDir` is the SCP package root (the directory CONTAINING scp.config.json), e.g.
 * `Cascades/scps/<designation>/SCP` or the template `Cascades/scps/template/SCP`.
 */
export function readScpConfigName(scpDir: string): string | null {
  try {
    const configPath = join(scpDir, SCP_CONFIG_FILENAME);
    const raw = readFileSync(configPath, 'utf8');
    const parsed = JSON.parse(raw) as unknown;
    if (
      parsed &&
      typeof parsed === 'object' &&
      'scpName' in parsed &&
      typeof (parsed as { scpName: unknown }).scpName === 'string' &&
      (parsed as { scpName: string }).scpName.length > 0
    ) {
      return (parsed as { scpName: string }).scpName;
    }
    return null;
  } catch {
    return null;
  }
}
