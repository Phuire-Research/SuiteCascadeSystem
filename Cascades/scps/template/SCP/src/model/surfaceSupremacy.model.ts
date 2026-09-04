/**
 * surfaceSupremacy.model · C1006 · THE SUPREMACY REGISTRY (the user's charge)
 *
 * *"Review the Overlay Mechanism to Determine how to have Any Overlay Cancel the Other."*
 *
 * ── THE WOUND ───────────────────────────────────────────────────────────────────────────────────
 * A crashed SCP raised the standby overlay while the Turn-Over-A confirm modal was still mounted.
 * The standby honours THE RIBBON LAW — it paints only the middle band and deliberately leaves the
 * dock's 68px strip alone, because a stalled turn-over's escape is Turn Over A ON THE DOCK. But the
 * modal's backdrop is `inset: 0; z-index: 400; pointer-events: auto`, and the dock is z-index 110.
 * So in the ONE strip the standby protects, the modal was topmost — and it ate the clicks.
 * **The Ribbon Law worked. A different surface walked in underneath and covered the escape hatch.**
 *
 * ── WHY A REGISTRY AND NOT ANOTHER PER-SITE HIDE ───────────────────────────────────────────────
 * Measured before building: **16 `showBridgeStandby(` call sites against 1 `hideBridgeStandby()`**
 * — and that one is behind a click. THAT ASYMMETRY IS THE DEFECT. Sixteen ways to raise a surface
 * and one way to lower it guarantees the next surface repeats the bug. Teaching each new surface to
 * cancel its siblings is exactly the convention-by-good-manners that produced this.
 *
 * ── AND WHY THE GESTURE-SIDE CURE COULD NEVER HAVE WORKED ──────────────────────────────────────
 * C1000 seated a hide at the turn-over-a GESTURE. But the modal has a SECOND raise path: a
 * `watch()` on `gitmJson.pendingConfirm` that opens it from STATE — no gesture, no click. And the
 * standby itself is raised by a WebSocket CLOSE. **A surface raised by state cannot be cured at the
 * gesture.** The rule must live where surfaces are RAISED.
 *
 * ── THE RULE ───────────────────────────────────────────────────────────────────────────────────
 * ONE SLOT. Raising any surface lowers whoever holds it — that is "any overlay cancels the other",
 * literally. One guard rides on top: **a `utility` surface may never cover a live `recovery`
 * surface**, because that is precisely how an escape hatch gets buried. A declined raise is LOUD,
 * never silent — a surface that quietly fails to appear is a worse bug than one that covers.
 *
 * ── TECHNOLOGY-AGNOSTIC ON PURPOSE ─────────────────────────────────────────────────────────────
 * PURE — no Vue, no DOM, no framework import. The caller supplies its own `lower` callback, so the
 * raw-DOM standby (`bridgeStandbyOverlay.model.ts`, built with `document.createElement`) and the
 * Vue-reactive modal (a `ref<boolean>`) can share ONE registry despite living in different worlds.
 * That shared reach is the whole reason the slot can arbitrate between them at all.
 *
 * Template: `toolbarRegistration.model.ts` (module-scope registry · register/read seam).
 */

/**
 * THE TIERS — three, deliberately. Fewer cannot express "the escape hatch outranks a drawer"; more
 * invites bikeshedding about where a surface sits.
 */
export type SurfaceTier =
  /** The escape hatch. The standby overlay: the surface a user recovers THROUGH. Outranks all. */
  | 'recovery'
  /** A decision the user is being asked to make — the A-confirm modal. May supersede recovery,
   *  because acting on the recovery state is the POINT of the recovery state. */
  | 'guarded'
  /** Convenience: drawers, palettes, pickers. **Never permitted to cover a live recovery surface.** */
  | 'utility';

// NO RANK TABLE, DELIBERATELY. A `TIER_RANK` map existed here and drove the guard as
// `rank(incoming) < rank(holder)` — a dry run PROVED that wrong: it also blocked the A-confirm modal
// from opening over the standby, which is the one action the standby exists to invite. The rule is
// not an ordering, it is a single named prohibition (see THE ONE GUARD below). A rank table left
// lying here would only invite someone to restore the version that was wrong.

type Occupant = {
  id: string;
  tier: SurfaceTier;
  /** The surface's OWN teardown. The registry never guesses how to take a surface down. */
  lower: () => void;
};

/** THE SLOT. Single-occupancy by construction — that is what makes cancellation total. */
let slot: Occupant | null = null;

function say(event: string, detail: Record<string, unknown>): void {
  // NEVER SILENCE THE SIGNAL — a decline that says nothing is indistinguishable from a bug.
  console.log('[SurfaceSupremacy]', event, JSON.stringify(detail));
}

/**
 * RAISE a surface, cancelling whoever holds the slot.
 *
 * @returns `true` when the surface may show; **`false` when the raise was DECLINED** — the caller
 *          MUST honour a `false` and not paint, or the registry is decoration.
 *
 * RE-ENTRANCY: the slot is cleared BEFORE the outgoing occupant's `lower()` runs, so a teardown
 * that calls `lowerSurface()` on its way out (the honest thing for it to do) finds an empty slot
 * and no-ops, instead of recursing or evicting the incoming surface.
 */
export function raiseSurface(id: string, tier: SurfaceTier, lower: () => void): boolean {
  const holder = slot;

  if (holder && holder.id === id) {
    // A re-raise of the SAME surface is not a cancellation — it is a refresh. Keep the slot, let
    // the caller re-render. (The standby's own re-show branch depends on this being non-destructive.)
    slot = { id, tier, lower };
    return true;
  }

  if (holder && tier === 'utility' && holder.tier === 'recovery') {
    // THE ONE GUARD — narrowed C1006 after a dry run PROVED the first form wrong. It read
    // `TIER_RANK[tier] < TIER_RANK[holder.tier]`, which also declined a 'guarded' raise against a
    // live recovery surface — i.e. it blocked the A-confirm modal from opening over the standby,
    // which is the ONE action the standby exists to invite ("Turn Over on A from the dock").
    // The rule is not "lower may not cover higher"; it is specifically: **a UTILITY surface must
    // never bury the escape hatch.** Acting on a recovery state is the POINT of a recovery state.
    // Declined LOUDLY so the caller and the log both know.
    say('raise.declined', { id, tier, reason: 'would-cover-live-recovery', holder: holder.id });
    return false;
  }

  if (holder) {
    say('raise.superseded', { incoming: id, tier, lowered: holder.id, loweredTier: holder.tier });
    slot = null; // cleared FIRST — see RE-ENTRANCY above
    try {
      holder.lower();
    } catch (err) {
      // A teardown that throws must never strand the incoming surface: the slot is already free,
      // so the raise proceeds. One bad occupant cannot wedge the whole mechanism.
      say('lower.threw', { id: holder.id, message: err instanceof Error ? err.message : String(err) });
    }
  }

  slot = { id, tier, lower };
  say('raised', { id, tier });
  return true;
}

/**
 * LOWER a surface. Idempotent, and keyed to the id: a stale teardown for a surface that was already
 * superseded finds someone ELSE in the slot and correctly does nothing, so a late callback can never
 * evict the surface that replaced it.
 */
export function lowerSurface(id: string): void {
  if (!slot || slot.id !== id) return;
  slot = null;
  say('lowered', { id });
}

/** Diagnostics — the Concluder surface for this module. */
export function currentSurface(): { id: string; tier: SurfaceTier } | null {
  return slot ? { id: slot.id, tier: slot.tier } : null;
}

/** Test seam ONLY — the field never calls this. */
export function resetSurfaceRegistry(): void {
  slot = null;
}
