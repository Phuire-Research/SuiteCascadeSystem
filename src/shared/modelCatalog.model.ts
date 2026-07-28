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

/** the default spawn/resume model — Opus 5 (C929 · the pending-release default). */
export const DEFAULT_MODEL = 'claude-opus-5';

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
