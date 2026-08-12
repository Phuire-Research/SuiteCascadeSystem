/**
 * graphiteScribeSetObservedRootHuirthBase Quality — Huirth-side Base Reducer (GLW-2 · the editor-locality pair)
 *
 * Writes the editor's OBSERVED-ROOT PAIR (observedScpName + observedRoot) into the graphiteScribe
 * Demometer's OWN Huirth (Base) state — the server source of truth the /editor-fs lanes serve from
 * (GLW-4 · through the module-published getter the locality-watch principle sets). Dispatched by the
 * graphiteScribeLocalityWatch principle (GLW-3) on its boot pass + on every SyncLibrary change:
 * resolveSyncLocality → Specified {targetScp, root} anor the honest LOCAL fall {'' , process.cwd()}.
 * Partial reducer return (only the two changed slots · Shortest Path Principle).
 *
 * TQNI byte-match anchor — the type string 'GraphiteScribe Set Observed Root Huirth Base' is DISTINCT
 * from the two menu Base types and MUST be ABSENT from graphiteScribe.muxonomy.ts
 * actionExchange.serverToClient (Huirth-only · local reducer · the TQNI invariant).
 *
 * Citation: graphiteScribeSetMenuStageHuirthBase.quality.huirth.ts (Huirth-only Base · SBIS sibling).
 * Citation: STRATIMUX-REFERENCE.md "🧩 Quality Creation Patterns" (Payload Quality · partial return).
 * Citation: S4-GRAPHITE-EDITOR-LOCALITY-GROUND.md §3(a) + Rung GLW-2.
 */
import { createQualityCardWithPayload, defaultMethodCreator } from 'stratimux';
import type {
  GraphiteScribeHuirthState,
  GraphiteScribeSetObservedRootHuirthBasePayload,
} from '../graphiteScribe.type';

export type { GraphiteScribeSetObservedRootHuirthBasePayload };

export const graphiteScribeSetObservedRootHuirthBase = createQualityCardWithPayload<
  GraphiteScribeHuirthState,
  GraphiteScribeSetObservedRootHuirthBasePayload
>({
  // TQNI · = VERBOSE('SetObservedRootHuirthBase') · rename target. DISTINCT from the menu Base
  // types. MUST NOT appear in graphiteScribe.muxonomy.ts actionExchange (Huirth-only · local reducer).
  type: 'GraphiteScribe Set Observed Root Huirth Base',
  reducer: (_state, action) => {
    const { observedScpName, observedRoot } = action.payload;
    // SHORTEST PATH — return only the two changed slots, never the whole state.
    return { observedScpName, observedRoot };
  },
  methodCreator: defaultMethodCreator,
});
