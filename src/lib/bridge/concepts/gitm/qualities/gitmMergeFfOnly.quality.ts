/**
 * gitmMergeFfOnly Quality · GITM D3 (#634) · T2 catch-based · git merge --ff-only <branch>
 *
 * ff-only ceiling: non-fast-forward merges fall to T3 (guarded WARNING + confirm =
 * D4 scope). This quality implements ONLY the ff-only path. On a non-ff / conflict
 * failure, error = 'merge-conflict' and reason carries the structural T3-fallback
 * note ('non-ff merge requires T3 interactive resolution') — the seam D4 builds on.
 * If a merge does conflict, WATCHDIAL fires (.git/index markers) → T1 conflicts
 * field populates on the next STARC cycle. On success WATCHDIAL fires on .git/HEAD
 * + refs → STARC refresh follows. Reducer partial-return { lastActionResult } only.
 *
 * Template: gitmStageFile.quality.ts (D3 set discipline) · catch classification (Curation §5)
 * Citation: GITM-D3-S3-YELLOW-BLUEPRINT.md §4 (mergeFfOnly · T3-fallback note)
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
import type { GitmMergeFfOnlyPayload, GitmMergeFfOnly, GitmActionResult } from './types';
import { gitmExec } from '../model/gitmExec.model';
import { resolveGitmTargetCwd } from '../model/gitmOpCwd.model';

export type { GitmMergeFfOnly };

const T3_FALLBACK_NOTE = 'non-ff merge requires T3 interactive resolution';

const bucket: GitmActionResult[] = [];

type GitmSelfDeck = {
  gitm: Concept<GitmState, Record<string, unknown>>;
};

export const gitmMergeFfOnly = createQualityCardWithPayload<
  GitmState,
  GitmMergeFfOnlyPayload,
  GitmSelfDeck
>({
  type: 'Gitm Merge Ff Only',
  reducer: (state) => {
    const item = bucket.pop();
    if (!item) {
      return {};
    }
    return { lastActionResult: item };
  },
  methodCreator: () =>
    createMethodWithConcepts(({ action, deck }) => {
      const { branch, originScpName } = selectPayload<GitmMergeFfOnlyPayload>(action);
      // MULTI-SCP GITM MUXIFICATION (MC-W1) — CALLING SCP's repo (origin-aware) · SCP-Sovereign fallback.
      const userCwd = resolveGitmTargetCwd(deck, originScpName);
      const exec = gitmExec(['merge', '--ff-only', branch], userCwd);
      const result: GitmActionResult = {
        action: 'gitmMergeFfOnly',
        ok: exec.ok,
        error: exec.ok ? '' : 'merge-conflict',
        guardFired: false,
        reason: exec.ok ? '' : T3_FALLBACK_NOTE,
        at: Date.now(),
      };
      bucket.push(result);
      return action.strategy
        ? strategySuccess(action.strategy, strategyData_muxifyData(action.strategy, { ...result }))
        : muxiumConclude();
    }),
});
