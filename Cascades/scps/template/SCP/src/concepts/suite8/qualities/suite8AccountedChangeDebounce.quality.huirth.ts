/**
 * suite8AccountedChangeDebounce Quality — C909 · THE ACCOUNTED SETTLE (the debounce node prior)
 *
 * The node PRIOR to the SET on the ACCOUNTED-CHANGE path ONLY (the Smooth Foreign Transition
 * refinement): rapid successive target-side hifiConfig changes cascade stamp advances through
 * the observer — the widget re-seeds through intermediate values. The cure is a
 * createMethodDebounce settle window on THIS node: the Usher's accounted lane dispatches a
 * two-node strategy (this node → successNode → suite8SetLocalityHuirthBase); the debounce
 * method lets only the LAST strategy of a burst through (intermediate actions are emitted as
 * Muxium Conclude — their strategies die), so ONLY THE FINAL VALUE lands on the SET. Each
 * accounted event composes its snapshot FRESH from disk (after chokidar's awaitWriteFinish),
 * so the last action of the burst already carries the final value — no fire-time re-compose.
 *
 * THE DEBOUNCE LAW (why the node prior, not the SET's own methodCreator): the reducer runs
 * per action regardless of method debouncing — a debounce ON the SET would still write every
 * intermediate snapshot. The settle must sit on the node PRIOR, whose nullReducer writes
 * NOTHING; the SET's change-gate reducer stays the single canonical truth. Mode flips /
 * library changes / bridge lifecycle / boot keep their DIRECT dispatch (no debounce —
 * locality selection stays snappy).
 *
 * ACCOUNTED_SETTLE_MS = 400 — the settle window sized to the burst, distinct from the
 * watcher's 100ms event-coalescer (ACCOUNTED_DEBOUNCE_MS). Far under the 5000ms default
 * Action expiration — NO agreement machinery required (the Action-Validity doctrine holds
 * without a raised ceiling).
 *
 * TQNI: 'Suite8 Accounted Change Debounce' — Huirth-only · null reducer · MUST be ABSENT from
 * suite8.muxonomy.ts actionExchange (the TQNI invariant · mirrors the SET sibling's absence).
 *
 * Citation: suite8SetLocalityHuirthBase.quality.huirth.ts (the SET this node fronts · the
 *           change-gate reducer that stays the truth).
 * Citation: suite8GraceRevertCheckHuirthBase.quality.huirth.ts (the nullReducer sibling idiom).
 * Citation: stratimux dist ownershipClearStrategyStubsFromLedgerAndSelf (createMethodDebounce
 *           passing the strategy through with strategySuccess — the shipped precedent).
 * Citation: DIAMOND-PEWTER-FOREIGN-REFLECTION.md §C909 (the user's chosen fork).
 */
import {
  createQualityCardWithPayload,
  createMethodDebounce,
  strategySuccess,
  nullReducer,
} from 'stratimux';
import type {
  Suite8HuirthState,
  Suite8AccountedChangeDebouncePayload,
} from '../suite8.type';

export type { Suite8AccountedChangeDebouncePayload };

// The settle window — sized to the target-side burst; distinct from the watcher's 100ms
// event-coalescer. The LAST strategy of the window passes; every earlier one concludes.
const ACCOUNTED_SETTLE_MS = 400;

export const suite8AccountedChangeDebounce = createQualityCardWithPayload<
  Suite8HuirthState,
  Suite8AccountedChangeDebouncePayload
>({
  type: 'Suite8 Accounted Change Debounce',
  // Intermediate actions must write NOTHING — the SET node carries the real payload and the
  // change-gate. SHORTEST PATH: null reducer.
  reducer: nullReducer,
  methodCreator: () =>
    createMethodDebounce<Suite8HuirthState, Suite8AccountedChangeDebouncePayload>(
      ({ action }) => {
        // The strategy pass-through (the shipped precedent): the settled LAST action continues
        // to its successNode (the SET); a stray strategy-less fire re-returns itself (harmless).
        if (action.strategy) {
          return strategySuccess(action.strategy);
        }
        return action;
      },
      ACCOUNTED_SETTLE_MS,
    ),
});
