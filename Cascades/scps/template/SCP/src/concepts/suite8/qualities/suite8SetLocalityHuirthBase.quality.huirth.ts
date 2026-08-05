/**
 * suite8SetLocalityHuirthBase Quality — B-RLM-2 · THE LOCALITY BASE (Huirth-side keyed Base Reducer)
 *
 * Writes one designation's locality SNAPSHOT into the suite8 Demometer's Huirth `localities` Record —
 * the state the suite8LocalityStcpRelay SMRP selector-gates on. Dispatched by the Usher principle's
 * TWO boundary dispatchers (the SyncLibrary.json library watcher's dispatchModeAndLocalityFromDisk +
 * the bridge.json watcher's handleLifecycle) AND the boot leg — the Zero-Knowledge boundary reads the
 * ring + resolution FRESH, composes a snapshot, and dispatches this (disk → Base action → state →
 * SMRP relay broadcasts → clients update; the Stratimuxian circuit).
 *
 * THE NO-STORM DISCIPLINE (the change-gate): the reducer no-ops an IDENTICAL snapshot (JSON compare)
 * so a boundary burst that recomposes an unchanged snapshot never fires the SMRP selector — the
 * localities Record reference stays stable, the relay stays quiet. The gate lives HERE (the reducer),
 * NOT in the principle: the principle stays a pure dispatcher (the commission's law · the boundary
 * does exactly ONE thing), and the reducer is the single, canonical no-op seat every dispatcher shares.
 * B3b — an EMPTY snapshot (the Local sentinel · ring [] · specified null) is a first-class WRITE (a
 * revert to Local MUST clear the specified row); the JSON compare only suppresses a REPEAT, never an
 * empty.
 *
 * TQNI: 'Suite8 Set Locality Huirth Base' — Huirth-only · local reducer · MUST be ABSENT from
 * suite8.muxonomy.ts actionExchange (the TQNI invariant).
 *
 * Citation: suite8SetSyncModeHuirthBase.quality.huirth.ts (the keyed Base sibling · the no-op idiom).
 * Citation: STRATIMUX-REFERENCE.md "🚀 Critical Reducer Performance Optimization" (shortest-path partial return).
 * Citation: D-RLM-R3-REACTIVE-LOCALITY-BLUEPRINT.md §2a · D-RLM-SCHOLAR-STATE-SIGNALS-MEANS.md §1.
 */
import { createQualityCardWithPayload, defaultMethodCreator } from 'stratimux';
import type { Suite8HuirthState, Suite8SetLocalityHuirthBasePayload } from '../suite8.type';

export type { Suite8SetLocalityHuirthBasePayload };

export const suite8SetLocalityHuirthBase = createQualityCardWithPayload<
  Suite8HuirthState,
  Suite8SetLocalityHuirthBasePayload
>({
  type: 'Suite8 Set Locality Huirth Base',
  reducer: (state, action) => {
    const { designation, snapshot } = action.payload;
    // THE CHANGE-GATE (the no-storm discipline) — an identical recompose no-ops so the SMRP
    // selector never fires on unchanged localities. Empty snapshots still write (B3b · a repeat
    // of the SAME empty is what dedupes, never the empty itself).
    const held = state.localities[designation];
    if (held !== undefined && JSON.stringify(held) === JSON.stringify(snapshot)) return {};
    // SHORTEST PATH — keyed merge: return only the changed Record.
    return { localities: { ...state.localities, [designation]: snapshot } };
  },
  methodCreator: defaultMethodCreator,
});
