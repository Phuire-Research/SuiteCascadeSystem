// hifiConfig.model.ts — the SCP-resident controlling JSON for HiFi (colors + patterns).
//
// The DURABLE, agent-writable twin of the localStorage overrides. Where suiteColorOverride /
// suitePatternOverride persist a USER's clicks per-browser (ephemeral), hifiConfig.json persists the
// SCP's SHIPPED HiFi design — authored by a spawned Pewter via the Set-Colors-via-JSON /
// Add-SVG-Pattern Skills (direct JSON modification). It lives at the SCP's Cascades/hifiConfig.json
// and is served by the /hifi-config endpoint (vue.principle.ts).
//
// PRECEDENCE (user Conference 2026-06-23): factory :root < hifiConfig.json (SCP design) < localStorage
// (user clicks win) — "localStorage wins, the JSON overrides the factory defaults." On boot the
// IslandWrapper applies the localStorage overrides first (sync · no flash for returning users), then
// applies the JSON ONLY for spectra the user has NOT overridden — so the user's click always wins, the
// SCP design fills the rest over the factory defaults, and there is no flicker (disjoint var sets).

import {
  type SpectrumName,
  applySuiteColorOverrides,
  loadSuiteColorOverrides,
} from './suiteColorOverride.model';
import {
  applySuitePatternOverrides,
  loadSuitePatternOverrides,
} from './suitePatternOverride.model';

export interface HifiConfig {
  schemaVersion: string;
  colors?: Partial<Record<SpectrumName, string>>;
  // D-PSVG · PSVG-2 · OPEN string ids — the JSON may name a per-SCP library pattern beyond the
  // closed factory union (patternLibrary.model.ts); apply resolves in-code first, registry second.
  patterns?: Partial<Record<SpectrumName, string>>;
}

// Fetch the SCP's controlling hifiConfig.json via the server endpoint. Null on absent/unreadable/malformed.
export async function loadHifiConfig(): Promise<HifiConfig | null> {
  if (typeof window === 'undefined') return null;
  try {
    const r = await fetch('/hifi-config');
    if (!r.ok) return null;
    const j = (await r.json()) as unknown;
    return j && typeof j === 'object' && 'schemaVersion' in j ? (j as HifiConfig) : null;
  } catch {
    return null;
  }
}

// MD-USP · US-3 · Fetch a TARGET SCP's shipped hifiConfig.json by name via the cross-SCP query surface
// (/scp-hifi-config/:scpName · cascadeMemoryQuery.model.ts). The read-only twin of loadHifiConfig — same
// shape, same Honest-Absence discipline — but for ANOTHER citizen's design (Pewter's color-locality
// preview: a Specified locality surfaces the target's COLORS). Null on 404 / absent / unreadable /
// malformed / non-HifiConfig (the server serves {} for absence; a {} with no schemaVersion resolves null).
export async function loadTargetHifiConfig(scpName: string): Promise<HifiConfig | null> {
  if (typeof window === 'undefined') return null;
  if (!scpName) return null;
  try {
    const r = await fetch(`/scp-hifi-config/${encodeURIComponent(scpName)}`);
    if (!r.ok) return null;
    const j = (await r.json()) as unknown;
    return j && typeof j === 'object' && 'schemaVersion' in j ? (j as HifiConfig) : null;
  } catch {
    return null;
  }
}

// Apply the SCP-design baseline UNDER the user's localStorage clicks (precedence: JSON < localStorage).
// Applies a JSON entry ONLY where the user has NOT overridden that spectrum — so the user's click
// always wins, no re-apply, no flicker (the JSON + localStorage spectrum sets are disjoint). Call
// AFTER the localStorage overrides at boot.
export function applyHifiConfigUnderOverrides(config: HifiConfig): void {
  const colorOverrides = loadSuiteColorOverrides();
  const patternOverrides = loadSuitePatternOverrides();
  const jsonColors: Partial<Record<SpectrumName, string>> = {};
  for (const [k, v] of Object.entries(config.colors ?? {})) {
    if (!(k in colorOverrides)) jsonColors[k as SpectrumName] = v;
  }
  const jsonPatterns: Partial<Record<SpectrumName, string>> = {};
  for (const [k, v] of Object.entries(config.patterns ?? {})) {
    if (!(k in patternOverrides)) jsonPatterns[k as SpectrumName] = v;
  }
  if (Object.keys(jsonColors).length) applySuiteColorOverrides(jsonColors);
  if (Object.keys(jsonPatterns).length) applySuitePatternOverrides(jsonPatterns);
}

// D-PCL · THE ROUND-TRIP COLOR CIRCUIT · the RETURN-apply. Re-runs the FULL boot precedence
// (localStorage FIRST, then JSON UNDER it) so a fresh hifiConfig broadcast paints uniformly across
// every connected client. This is the exact two-layer sequence IslandWrapper runs at mount
// (applySuiteColorOverrides(loadSuiteColorOverrides()) THEN applyHifiConfigUnderOverrides(cfg)) —
// factory :root < JSON < localStorage held verbatim.
//
// THE SHADOW-WRINKLE CURE (choice α · documented on the D-PCL board): the clicker writes their new
// color into their OWN localStorage at click time (intent · NO paint — painting stays the return's
// act). When THIS return-apply runs on the clicker's window, the localStorage layer paints their new
// color; on every OTHER client (no such localStorage entry) the JSON layer paints it. Precedence law
// is preserved: localStorage still wins where the user set it — which is now their fresh click.
export function applyHifiConfigWithOverrides(config: HifiConfig): void {
  applySuiteColorOverrides(loadSuiteColorOverrides());
  applySuitePatternOverrides(loadSuitePatternOverrides());
  applyHifiConfigUnderOverrides(config);
}
