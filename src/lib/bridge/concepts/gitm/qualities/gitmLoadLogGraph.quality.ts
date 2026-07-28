/**
 * gitmLoadLogGraph Quality · GITM Dev Epoch (MD-C · THE DAG) · T2 read · git log --topo-order
 *
 * Read-only. Runs gitmExec with the GRAPH format string (%H%x1f%P%x1f%D%x1f%an%x1f%s ·
 * --topo-order so the caller can lane-assign without re-sorting), parses via the pure
 * parseGitmLogGraph seam, lands { commitGraph, lastActionResult } in one partial return.
 * No guard. No WATCHDIAL refresh needed (read-only · touches no .git target).
 *
 * A SEPARATE quality from gitmLoadLog (NOT a flag): gitmLoadLog lands commitLog (flat ·
 * author/email/date); this lands commitGraph (TRUE parents + refs). Two surfaces, two
 * reducers — never contend for one field. The simpler diff (the flag route would fork
 * gitmLoadLog's format string, parse, AND reducer return · this is one clean mirror).
 *
 * Template: gitmLoadLog.quality.ts (D3 read set discipline) · parseGitmLogGraph (model)
 * Citation: DIAMOND-GITM-DEVELOPER-EPOCH.md §MD-C (THE DAG · parseGitmLogGraph → commitGraph)
 */

import {
  createQualityCardWithPayload,
  createMethodWithConcepts,
  selectPayload,
  muxiumConclude,
  strategySuccess,
  strategyData_muxifyData,
  type Concept,
} from 'stratimux';
import type { GitmState } from '../gitm.types';
import type {
  GitmLoadLogGraphPayload,
  GitmLoadLogGraph,
  GitmActionResult,
  GitmCommitGraphEntry,
} from './types';
import { gitmExec, parseGitmLogGraph } from '../model/gitmExec.model';
import { resolveGitmTargetCwd } from '../model/gitmOpCwd.model';

export type { GitmLoadLogGraph };

interface LoadLogGraphBucketItem {
  result: GitmActionResult;
  commitGraph: GitmCommitGraphEntry[];
}

const bucket: LoadLogGraphBucketItem[] = [];

type GitmSelfDeck = {
  gitm: Concept<GitmState, Record<string, unknown>>;
};

export const gitmLoadLogGraph = createQualityCardWithPayload<
  GitmState,
  GitmLoadLogGraphPayload,
  GitmSelfDeck
>({
  type: 'Gitm Load Log Graph',
  reducer: (state) => {
    const item = bucket.pop();
    if (!item) {
      return {};
    }
    return { commitGraph: item.commitGraph, lastActionResult: item.result };
  },
  methodCreator: () =>
    createMethodWithConcepts(({ action, deck }) => {
      const { limit, originScpName } = selectPayload<GitmLoadLogGraphPayload>(action);
      // MULTI-SCP GITM MUXIFICATION (MC-W1) — CALLING SCP's repo (origin-aware) · SCP-Sovereign fallback.
      const userCwd = resolveGitmTargetCwd(deck, originScpName);
      const exec = gitmExec(
        [
          'log',
          '--topo-order',
          '--format=%H%x1f%P%x1f%D%x1f%an%x1f%s',
          '-n',
          String(limit ?? 100),
        ],
        userCwd,
      );
      const commitGraph = exec.ok ? parseGitmLogGraph(exec.stdout) : [];
      const result: GitmActionResult = {
        action: 'gitmLoadLogGraph',
        ok: exec.ok,
        error: exec.ok ? '' : exec.error || exec.stderr,
        guardFired: false,
        reason: '',
        at: Date.now(),
      };
      bucket.push({ result, commitGraph });
      return action.strategy
        ? strategySuccess(
            action.strategy,
            strategyData_muxifyData(action.strategy, { ...result, commitGraph }),
          )
        : muxiumConclude();
    }),
});
