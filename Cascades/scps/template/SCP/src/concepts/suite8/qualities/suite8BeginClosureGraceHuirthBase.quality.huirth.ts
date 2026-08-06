/**
 * suite8BeginClosureGraceHuirthBase Quality — B-RLM-1′ · THE GRACE OPEN (the Agreement form)
 *
 * Opens ONE designation's standing closure grace: writes the grace entry into the suite8
 * Demometer's Huirth `closureGraces` Record (reducer · the state gate) AND registers the deferred
 * revert ActionStrategy on the muxiumTimeOut Tail Whip (method · Strategy Temporal Expansion ·
 * STRATIMUX-REFERENCE.md:1342). Dispatched by the Usher principle's bridge-json dispatcher (a
 * not-live specified target with NO grace standing) + the boot leg (always systemic 30s).
 *
 * THE CASE-4 STATE GATE (the r4 has-guard, now as state): if a grace ALREADY stands for this
 * designation, the reducer returns {} (never restart anor escalate) and the method no-ops (never
 * register a second fuse). The `!closureGraces[designation]` presence IS the guard — write A's
 * standing grace blocks write B's reclassification; the residual coalesced case lands on whichever
 * graceMs opened first (the layered cure preserved).
 *
 * THE AGREEMENT FORM (DIAMOND-DIAMETRIC-SUITE8-PATTERN.md C750 ADDENDUM — the user's ruling):
 * Action.agreement RAISES the validity ceiling, so the revert strategy is constructed ONCE here in
 * plain method flow with `agreement: graceMs + AGREEMENT_MARGIN_MS` on EVERY node — no
 * strategy-inside-the-callback contortion (that existed only to dodge the 5000ms default
 * expiration). The muxiumTimeOut callback shrinks to `refreshAction(strategyBegin(strategy))` — the
 * refresh recomposes the action with updated expiration at resolve-time (before fire), honoring the
 * agreement. Bonus: the strategy exists at grace-START, so its topic sinks with 'usher.grace.begun'
 * when the grace BEGINS, not when it fires.
 *
 * THE REVERT STRATEGY SHAPE — topic 'Suite8 Closure Grace Revert · <designation>':
 *   initialNode  = suite8GraceRevertCheck({ designation })    (the fire-time re-check + revert)
 *     successNode = suite8CancelClosureGrace({ reason 'reverted' })                (clear after revert)
 *     failureNode = suite8CancelClosureGrace({ reason 'target-returned-anor-cleared' }) (clear the stale)
 * Every node carries agreement: graceMs + AGREEMENT_MARGIN_MS (the action stays valid across the
 * whole grace window + the check/cancel round-trip).
 *
 * TQNI: 'Suite8 Begin Closure Grace Huirth Base' — Huirth-only · MUST be ABSENT from
 * suite8.muxonomy.ts actionExchange (the TQNI invariant).
 *
 * Citation: notificationBridge.model.ts notifyLocal (muxiumTimeOut · the callback RETURNS the
 *           Action, the muxium dispatches it).
 * Citation: fileChangeStrategies.ts createReadFileStrategy (createActionNode agreement + failureNode
 *           + createStrategy topic/initialNode).
 * Citation: appendActionQue.quality.ts refreshAction (recompose with updated expiration).
 * Citation: scpExecuteTool.quality.huirth.ts (createMethodWithConcepts · deck.e.* strategy building
 *           inside a method · return the strategy-begin Action).
 */
import {
  createQualityCardWithPayload,
  createMethodWithConcepts,
  createStrategy,
  createActionNode,
  strategyBegin,
  refreshAction,
  muxiumTimeOut,
  selectPayload,
  type ActionStrategy,
} from 'stratimux';
import type {
  Suite8HuirthState,
  Suite8BeginClosureGraceHuirthBasePayload,
} from '../suite8.type';
import type { Suite8SyncUsherDeck } from '../principles/suite8SyncUsher.principle.huirth';
import { sinkSyncLibraryTelemetry } from '../../../model/scpSyncLibrary.model';

export type { Suite8BeginClosureGraceHuirthBasePayload };

// The agreement ceiling margin — keeps the deferred revert action VALID across the whole grace
// window plus the check → cancel round-trip. NEVER forces the revert (the check node's state
// re-check governs that); merely prevents the Action-Validity doctrine's silent late-drop.
const AGREEMENT_MARGIN_MS = 10_000;

export const suite8BeginClosureGraceHuirthBase = createQualityCardWithPayload<
  Suite8HuirthState,
  Suite8BeginClosureGraceHuirthBasePayload,
  Suite8SyncUsherDeck
>({
  type: 'Suite8 Begin Closure Grace Huirth Base',
  reducer: (state, action) => {
    const { designation, specified, leg, graceMs } = action.payload;
    // THE CASE-4 STATE GATE — a standing grace is never restarted anor escalated.
    if (state.closureGraces[designation] !== undefined) return {};
    // SHORTEST PATH — keyed merge: return only the changed Record.
    return {
      closureGraces: {
        ...state.closureGraces,
        [designation]: {
          specified,
          leg,
          graceMs,
          startedAtIso: new Date().toISOString(), // Informative record only — never beat-compared.
        },
      },
    };
  },
  methodCreator: () =>
    createMethodWithConcepts<
      Suite8HuirthState,
      Suite8BeginClosureGraceHuirthBasePayload,
      Suite8SyncUsherDeck
    >(({ action, deck, concepts_ }) => {
      const { designation, specified, leg, graceMs } =
        selectPayload<Suite8BeginClosureGraceHuirthBasePayload>(action);
      // THE CASE-4 SINGLE-OPEN GUARANTEE is layered: (1) the dispatcher (the Usher principle's
      // bridge-json + boot legs) only dispatches this action when `!closureGraces[designation]`
      // in state — so a standing grace never re-dispatches; (2) the reducer refuses a duplicate
      // entry (idempotent {}). Given (1), this method registers the fuse for exactly the action
      // it receives — a grace-open is a grace-open. No second read is required; the state gate
      // lives upstream at the dispatcher and in the reducer, not here.
      // Build the revert strategy ONCE (the Agreement form) — agreement carried on every node.
      const agreement = graceMs + AGREEMENT_MARGIN_MS;
      const revertStrategy: ActionStrategy | undefined = createStrategy({
        topic: `Suite8 Closure Grace Revert · ${designation}`,
        initialNode: createActionNode(
          deck.suite8.e.suite8GraceRevertCheckHuirthBase({ designation }),
          {
            agreement,
            successNode: createActionNode(
              deck.suite8.e.suite8CancelClosureGraceHuirthBase({
                designation,
                reason: 'reverted',
              }),
              { agreement },
            ),
            failureNode: createActionNode(
              deck.suite8.e.suite8CancelClosureGraceHuirthBase({
                designation,
                reason: 'target-returned-anor-cleared',
              }),
              { agreement },
            ),
            successNotes: { preposition: 'then', denoter: 'specified reverted to Local;' },
          },
        ),
      });
      if (revertStrategy) {
        // THE TAIL WHIP — the callback refreshes (updated expiration · honoring agreement) + fires
        // the strategy-begin Action; the muxium dispatches what the callback returns.
        muxiumTimeOut(
          concepts_,
          () => refreshAction(strategyBegin(revertStrategy)),
          graceMs,
        );
        sinkSyncLibraryTelemetry('usher.grace.begun', {
          designation,
          specified,
          leg,
          graceMs,
          topic: revertStrategy.topic,
        });
      } else {
        sinkSyncLibraryTelemetry('usher.grace.begun-skip', {
          designation,
          reason: 'strategy-build-failed',
        });
      }
      return action;
    }),
});
