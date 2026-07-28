// Diamond B-25-UX (CD-101 CMSRD · Conditional-Multi-Suite-8-Router-Detection):
// Three-signal hard gate — Suite 4 Green Angle 2 resolution.
// Drops false-positive rate from ~40% (keyword-only) to ~5% (3-signal AND).
//
// Triggers SM-MULTI-SUITE-BRANCH menu offering Single | Multi(N) | Custom.
// User-confirmation invariant: agent NEVER auto-splits regardless of signal strength.

import { existsSync, readFileSync } from 'node:fs';

const ROUTER_KEYWORDS: readonly string[] = [
  'router',
  'dispatch',
  'orchestrat', // matches orchestrate, orchestration, orchestrator
  'multi-agent',
  'routing',
  'agent a', // case-insensitive 'agent a' / 'agent b' / etc.
];

// Hard thresholds (Suite 4 Green Angle 2)
const MIN_H2_COUNT = 4;
const MIN_ROUTER_KEYWORDS = 2;
const MIN_MUTUAL_EXCLUSIVE_PAIRS = 2;

export type RouterDetectionResult = {
  h2Count: number;
  h2Labels: string[];
  routerKeywordsFound: string[];
  mutualExclusiveCount: number;
  isRouterPattern: boolean;
};

// Diamond B-25-UX: detect router pattern in a CLAUDE.md file.
// All three signals must fire for isRouterPattern=true.
export function detectRouterPattern(claudeMdPath: string): RouterDetectionResult {
  const empty: RouterDetectionResult = {
    h2Count: 0,
    h2Labels: [],
    routerKeywordsFound: [],
    mutualExclusiveCount: 0,
    isRouterPattern: false,
  };

  if (!existsSync(claudeMdPath)) return empty;

  let content: string;
  try {
    content = readFileSync(claudeMdPath, 'utf8');
  } catch {
    return empty;
  }

  // Extract H2 labels (distinct)
  const h2Labels: string[] = [];
  for (const line of content.split('\n')) {
    const m = line.match(/^##\s+(.+)$/);
    if (m) {
      const label = m[1].trim();
      if (!h2Labels.includes(label)) h2Labels.push(label);
    }
  }

  // Find router keywords (case-insensitive · count distinct)
  const lowered = content.toLowerCase();
  const routerKeywordsFound = ROUTER_KEYWORDS.filter((kw) => lowered.includes(kw));

  // Count mutually-exclusive H2 pairs (token overlap < 50%)
  let mutualExclusiveCount = 0;
  for (let i = 0; i < h2Labels.length; i++) {
    for (let j = i + 1; j < h2Labels.length; j++) {
      if (areLabelsMutuallyExclusive(h2Labels[i], h2Labels[j])) {
        mutualExclusiveCount += 1;
      }
    }
  }

  const isRouterPattern =
    h2Labels.length >= MIN_H2_COUNT &&
    routerKeywordsFound.length >= MIN_ROUTER_KEYWORDS &&
    mutualExclusiveCount >= MIN_MUTUAL_EXCLUSIVE_PAIRS;

  return {
    h2Count: h2Labels.length,
    h2Labels,
    routerKeywordsFound,
    mutualExclusiveCount,
    isRouterPattern,
  };
}

function areLabelsMutuallyExclusive(labelA: string, labelB: string): boolean {
  const tokensA = new Set(tokenize(labelA));
  const tokensB = new Set(tokenize(labelB));
  if (tokensA.size === 0 || tokensB.size === 0) return false;
  let overlap = 0;
  for (const t of tokensA) {
    if (tokensB.has(t)) overlap += 1;
  }
  const minSize = Math.min(tokensA.size, tokensB.size);
  // Mutually exclusive = LESS than 50% overlap
  return overlap / minSize < 0.5;
}

function tokenize(label: string): string[] {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9 ]+/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 2); // drop tiny noise tokens
}
