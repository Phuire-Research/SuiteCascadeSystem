// SCS Install Epoch · Model Control · the SHARED model catalog (mirrors
// renderModeCatalog.model.ts — the proven publish-into-bridge.json pattern). The bridge OWNS
// this catalog and PUBLISHES it into bridge.json.availableModels on every write, alongside
// bridge.json.defaultModel; every instance spawn/resume (general agent or Suite 8) injects
// `--model <defaultModel>` into its claude invocation. Post-Epoch the SCS-Bridge Settings UI
// edits both the list and the default for the user.
//
// Grounded 2026-07-27 (C929 Vermillion WebSearch): Claude Opus 5 (claude-opus-5 · released
// 2026-07-24 · near-Fable frontier at half the price · 1M context) is the NEW DEFAULT per the
// user's word for the pending release. Sonnet 5 (2026-06-30) stands. Mythos 5 EXCLUDED
// (trusted-access only — not a public spawn target).
// Grounded 2026-06-09 (S6 Purple Vermillion WebSearch + the claude-api reference): full model
// IDs are PINNED snapshots; bare aliases (`opus`, `fable`) DRIFT to the latest in tier — the
// catalog uses full IDs for deterministic spawns. Fable 5 is GA; it is reserved for Formative
// upgrade-in-scale cases (an instance can be upgraded in scale to it), NOT the default.

export interface ModelCatalogEntry {
  /** the exact string passed to `claude --model <id>` (full pinned ID, not a drifting alias) */
  id: string;
  label: string;
  tier: 'flagship' | 'formative' | 'balanced' | 'fast';
  blurb: string;
}

/**
 * numeric version vector: 'claude-opus-4-5-20251101' → [4,5,20251101]; a non-numeric
 * segment sorts -1. NEVER a string compare — 'claude-opus-5-8' > 'claude-opus-5-10' is
 * TRUE lexically and WRONG numerically (shipped as the regression fixture in
 * modelCatalog.test.ts).
 */
function opusVersion(id: string): number[] {
  return id
    .slice('claude-opus-'.length)
    .split('-')
    .map((s) => (/^\d+$/.test(s) ? Number(s) : -1));
}

/** segment-wise numeric compare; a missing segment sorts -1. */
function compareOpusVersion(a: string, b: string): number {
  const va = opusVersion(a);
  const vb = opusVersion(b);
  const len = Math.max(va.length, vb.length);
  for (let i = 0; i < len; i += 1) {
    const sa = i < va.length ? va[i] : -1;
    const sb = i < vb.length ? vb[i] : -1;
    if (sa !== sb) return sa - sb;
  }
  return 0;
}

/**
 * THE HIGHEST OPUS · the spawn default BY LAW (C1102 law 1 — "we Default to the Highest
 * Version of Opus"). Filters the `claude-opus-*` rows and reduces by NUMERIC segment
 * compare; ties break by catalog order (first wins). No Opus row ⇒ AVAILABLE_MODELS[0].id
 * — this NEVER throws at module load (a throw at import time bricks boot).
 */
export function highestOpusId(rows: ModelCatalogEntry[]): string {
  const opus = rows.filter((m) => m.id.startsWith('claude-opus-'));
  if (opus.length === 0) return rows[0]?.id ?? '';
  return opus.reduce((best, m) => (compareOpusVersion(m.id, best.id) > 0 ? m : best)).id;
}

export const AVAILABLE_MODELS: ModelCatalogEntry[] = [
  {
    id: 'claude-opus-5',
    label: 'Opus 5',
    tier: 'flagship',
    blurb:
      'Default spawn model. The latest Opus — near-frontier intelligence, strongest complex multi-step work. 1M context.',
  },
  {
    id: 'claude-opus-4-8',
    label: 'Opus 4.8',
    tier: 'flagship',
    blurb:
      'Prior Opus flagship — complex reasoning, long-horizon agentic coding, high-autonomy work. 1M context.',
  },
  {
    id: 'claude-fable-5-1',
    label: 'Fable 5.1',
    tier: 'formative',
    blurb:
      'The newest Formative upgrade-in-scale — the Fable 5.1 generation. 1M context.',
  },
  {
    id: 'claude-fable-5',
    label: 'Fable 5',
    tier: 'formative',
    blurb:
      'Upgrade-in-scale for Formative cases. Sustains long autonomous sessions; investigates and verifies more deeply. 1M context.',
  },
  {
    id: 'claude-sonnet-5',
    label: 'Sonnet 5',
    tier: 'balanced',
    blurb:
      'Latest Sonnet generation — a capability step above 4.6 with improved reasoning. 1M context.',
  },
  {
    id: 'claude-opus-4-7',
    label: 'Opus 4.7',
    tier: 'flagship',
    blurb:
      'Prior Opus flagship — proven long-horizon agentic work. 1M context.',
  },
  {
    id: 'claude-opus-4-6',
    label: 'Opus 4.6',
    tier: 'flagship',
    blurb:
      'Opus 4.6 generation — stable complex reasoning and multi-step coding. 1M context.',
  },
  {
    id: 'claude-opus-4-5-20251101',
    label: 'Opus 4.5',
    tier: 'flagship',
    blurb:
      'Pinned Opus 4.5 — full agentic capability. 1M context.',
  },
  {
    id: 'claude-sonnet-4-6',
    label: 'Sonnet 4.6',
    tier: 'balanced',
    blurb:
      'Best combination of speed and intelligence — fast throughput with near-Opus capability for daily tasks. 1M context.',
  },
  {
    id: 'claude-sonnet-4-5-20250929',
    label: 'Sonnet 4.5',
    tier: 'balanced',
    blurb:
      'Pinned Sonnet 4.5 — reliable mid-tier throughput. 1M context.',
  },
  {
    id: 'claude-haiku-4-5-20251001',
    label: 'Haiku 4.5',
    tier: 'fast',
    blurb:
      'Fastest model — low latency, lowest cost for simple tasks and high-volume work. 200K context.',
  },
];

/**
 * the default spawn model — DERIVED from the catalog (C1102 law 1; ruling d-A: this
 * derivation SUPERSEDES bridge.json.defaultModel, which becomes informational). Adding a
 * higher Opus row moves the default with ZERO edits; modelCatalog.test.ts PINS today's
 * value so a malformed catalog edit fails loudly. SPAWN default only — a resume whose
 * registry entry carries no model omits `--model` entirely (ruling A · cli-handler.ts).
 */
export const DEFAULT_MODEL = highestOpusId(AVAILABLE_MODELS);

/**
 * C1104 · ruling m-A · THE HISTORICAL BIRTH DEFAULTS. Every id this project's spawn
 * default has ever been. The one-time reconcile sweep (registry.reconcileSessionModels)
 * CLEARS a stamp only when it is one of these AND the transcript agrees — that is the
 * forced flag's own echo, not a choice.
 *
 * EXPLICIT, NEVER DERIVED. Deriving this from DEFAULT_MODEL would mean a future Opus 6
 * default retroactively clearing real, deliberate Opus 5 choices. Append here only when
 * the spawn default actually moves; never remove.
 *
 * Measured evidence for the two entries (Lane 3 Gate 0 · 85 live sessions):
 *   claude-opus-5   ×59 — the current era's stamp
 *   claude-opus-4-8 ×17 — every one spawned BEFORE the default moved on 2026-07-27
 * The 2 `claude-fable-5` stamps are NOT here: Fable 5 was never a default, so those are
 * real choices and the sweep leaves them standing.
 */
export const HISTORICAL_BIRTH_DEFAULTS: readonly string[] = Object.freeze([
  'claude-opus-5',
  'claude-opus-4-8',
]);

export function isAvailableModel(id: string): boolean {
  return AVAILABLE_MODELS.some((m) => m.id === id);
}

/**
 * MIGRATION SHIM · the haiku pin (the catalog doctrine: aliases drift). Old sessions
 * recorded the unpinned 'claude-haiku-4-5' alias; the catalog now pins
 * 'claude-haiku-4-5-20251001'. Map the retired alias forward to the pinned id so a
 * recorded entry.model still resolves through the isAvailableModel guard. Identity for
 * every other id (including ids already pinned or unknown — those fall to the default
 * downstream). Applied in registry.setSessionModel BEFORE the guard, and in the
 * cli-handler where entry.model is read into resolved.model.
 */
export function normalizeModelId(id: string): string {
  if (id === 'claude-haiku-4-5') return 'claude-haiku-4-5-20251001';
  return id;
}

/** resolve a recorded model id to its friendly label (falls back to the raw id). */
export function modelLabel(id: string | undefined): string | undefined {
  if (!id) return undefined;
  return AVAILABLE_MODELS.find((m) => m.id === id)?.label ?? id;
}
