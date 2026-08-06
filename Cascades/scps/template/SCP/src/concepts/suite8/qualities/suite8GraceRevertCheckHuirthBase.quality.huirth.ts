/**
 * suite8GraceRevertCheckHuirthBase Quality — B-RLM-1′ · THE REVERT STRATEGY'S CHECK+ACT NODE
 *
 * The initial node of the Closure Grace Revert ActionStrategy (built in
 * suite8BeginClosureGraceHuirthBase). Fired by the muxiumTimeOut fuse at grace-end (the Tail
 * Whip · Strategy Temporal Expansion · STRATIMUX-REFERENCE.md:1342). This is the FIRE-TIME
 * Concluder re-check (the Scholar's §2 ruling · "cancellation without timer-clearing"): the
 * fuse cannot be cleared, so the fired strategy re-reads BOTH gates and no-ops when either
 * says stand-down.
 *
 *   1. GRACE ABSENT (state)   → cancelled while waiting → strategyFailed (the failure node
 *                               cancels — a no-op clear · sink 'usher.grace.fire-noop' grace-cleared).
 *   2. TARGET RETURNED LIVE   → the standing selection survives → strategyFailed (the failure
 *                               node clears the now-stale grace · sink reason target-returned).
 *   3. TARGET NOT LIVE        → revertSpecifiedIfTargetNotLive (the pure-model disk write; the
 *                               echo drives the machine via the library watcher — the proven
 *                               circuit) → strategySuccess (the success node clears the grace).
 *
 * THE STATE RE-CHECK IS UNCHANGED by the Agreement form — the agreement keeps the action VALID
 * across the grace window; it never FORCES the revert. Cancellation stays a pure state clear.
 *
 * TQNI: 'Suite8 Grace Revert Check Huirth Base' — Huirth-only · MUST be ABSENT from
 * suite8.muxonomy.ts actionExchange (the TQNI invariant).
 *
 * Citation: scpExecuteTool.quality.huirth.ts (createMethodWithConcepts · deck.k.getState(concepts_)
 *           state read · strategySuccess/strategyFailed termination).
 * Citation: D-RLM-SCHOLAR-STATE-SIGNALS-MEANS.md §2/§3 · DIAMOND-DIAMETRIC-SUITE8-PATTERN.md C750 ADDENDUM.
 */
import {
  createQualityCardWithPayload,
  createMethodWithConcepts,
  selectPayload,
  strategySuccess,
  strategyFailed,
  nullReducer,
} from 'stratimux';
import type {
  Suite8HuirthState,
  Suite8GraceRevertCheckHuirthBasePayload,
} from '../suite8.type';
import type { Suite8SyncUsherDeck } from '../principles/suite8SyncUsher.principle.huirth';
import {
  isSpecifiedTargetLive,
  revertSpecifiedIfTargetNotLive,
  sinkSyncLibraryTelemetry,
} from '../../../model/scpSyncLibrary.model';

export type { Suite8GraceRevertCheckHuirthBasePayload };

export const suite8GraceRevertCheckHuirthBase = createQualityCardWithPayload<
  Suite8HuirthState,
  Suite8GraceRevertCheckHuirthBasePayload,
  Suite8SyncUsherDeck
>({
  type: 'Suite8 Grace Revert Check Huirth Base',
  // No state change in the check itself — the grace clear rides the strategy's cancel nodes
  // (state-signaled) + the disk revert rides the pure model. SHORTEST PATH: null reducer.
  reducer: nullReducer,
  methodCreator: () =>
    createMethodWithConcepts<
      Suite8HuirthState,
      Suite8GraceRevertCheckHuirthBasePayload,
      Suite8SyncUsherDeck
    >(({ action, deck, concepts_ }) => {
      const { designation } = selectPayload<Suite8GraceRevertCheckHuirthBasePayload>(action);
      // This node is ONLY ever the initial node of the revert strategy — action.strategy is
      // always populated. The guard mirrors the writeFile precedent (never throw): a stray fire
      // without a strategy re-fires itself (a harmless no-op the muxium drops on next round).
      const strategy = action.strategy;
      if (!strategy) return action;
      // GATE 1 · the grace must still stand in state (cancelled → the entry is gone).
      const state = deck.suite8.k.getState(concepts_);
      const grace = state?.closureGraces[designation];
      if (!grace) {
        sinkSyncLibraryTelemetry('usher.grace.fire-noop', {
          designation,
          reason: 'grace-cleared',
        });
        // The failure node (a cancel with reason 'target-returned-anor-cleared') clears nothing
        // that stands — an idempotent no-op; the strategy terminates cleanly.
        return strategyFailed(strategy);
      }
      // GATE 2 · the boundary Concluder — the specified target's live status re-read at FIRE.
      const { live } = isSpecifiedTargetLive(designation);
      if (live) {
        sinkSyncLibraryTelemetry('usher.grace.fire-noop', {
          designation,
          reason: 'target-returned',
        });
        // The failure node clears the now-stale grace (target returned within the window).
        return strategyFailed(strategy);
      }
      // GATE 3 · sustained closure → the pure-model revert write (specified → null WRITTEN);
      // the disk echo drives the library watcher → the mode re-dispatches → the machine winds
      // down through the proven circuit.
      const result = revertSpecifiedIfTargetNotLive(designation);
      sinkSyncLibraryTelemetry('usher.grace.reverted', {
        designation,
        ...result,
      });
      // The success node clears the grace state after the revert.
      return strategySuccess(strategy);
    }),
});
