/**
 * cascadeSubscriptionRegistry.model.ts — CSRS · THE CASCADE-SUBSCRIPTION-REGISTRY-SEAT
 *
 * The ONE in-process resolution surface for the Cascade Memory Locality Subscription (CMLS).
 * The STATE (cascadeSubscriptionTargets on the suiteCascade Huirth concept) is the truth; this
 * seat is its synchronous projection for non-deck consumers (the Express route handlers cannot
 * select DECK state at request time).
 *
 * INVARIANT · SINGLE WRITER: only the CSS sweep motion (the watcher principle
 * suiteCascadeJsonWatcher) publishes into this seat. Readers: the three /suite8-* cascade
 * routes (floor · tiers · doc-save) + the watcher's own manifest-fallback-root math. Same-process
 * only — the vue principle (routes) and the watcher run in the ONE SCP server muxium.
 *
 * This module replaces the read-time SyncLibrary consult (the SL-3 seam) with a state-projected
 * resolution: the read lane, the floor route, and the write lane all resolve through this one
 * seat, so the routes and the watcher can never disagree (the C837 disjoint class dies).
 *
 * Import geometry mirrors the SL-3 seam it replaces: a shared-model downward type import from the
 * suiteCascade concept (type-only · no concept-boundary crossing at runtime).
 *
 * Citation: DESIGN-CASCADE-MEMORY-LOCALITY.md §S3.6 (the ONE seat · single writer).
 * Citation: STRATIMUX-REFERENCE.md "🧠 Strategic State Management" (no optional state).
 */
import type { CascadeSubscriptionTarget } from '../concepts/suiteCascade/suiteCascade.type';

// The seat entry — a designation's resolved subscription state (the synchronous projection of
// the Huirth cascadeSubscriptionTargets Record entry + its effective directory).
export type CascadeSubscriptionResolution = {
  name: string;
  effectiveDir: string; // absolute — where the subscription points (target absoluteDir anor the registered dir)
  target: CascadeSubscriptionTarget | null; // null = Local (the registered dir serves)
};

// The ONE seat — same-process Map keyed by designation. Written ONLY by the CSS sweep.
const seat = new Map<string, CascadeSubscriptionResolution>();

// SINGLE WRITER — the CSS sweep publishes a designation's resolution (idempotent: the sweep keeps
// the seat warm every pass, and re-points overwrite the prior entry).
export const publishCascadeSubscriptionResolution = (
  name: string,
  effectiveDir: string,
  target: CascadeSubscriptionTarget | null,
): void => {
  seat.set(name, { name, effectiveDir, target });
};

// The route + watcher read — the state-projected target resolution (replaces the SL-3 consult).
// Absent = the seat has never resolved this designation (the sweep has not yet run for it).
export const resolveCascadeSubscriptionDir = (
  designation: string,
): CascadeSubscriptionResolution | null => seat.get(designation) ?? null;
