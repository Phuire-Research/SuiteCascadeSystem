/**
 * gitmRecountChanges Quality · GITM A↔B-R (#641-R) · CHANGEDIAL live recount
 *
 * Pure recount of the CHECKED-OUT branch's working tree: readGitStatus(userCwd) →
 * changesPrimedOnB = stagedFiles.length + unstagedFiles.length + conflicts.length.
 * The "rises AND falls" live count (LOCKED Q2) — when the bridge HEAD is on B, this
 * reports B's dirty-file count; the user edits → it climbs, the user reverts/commits →
 * it returns to 0 (the MERGEGATE precondition).
 *
 * A FOCUSED single-field write — the Reducer returns ONLY { changesPrimedOnB }, NOT a
 * full STARC refresh, so it never collides with gitmSetStatus's STARC-coherence reducer
 * (which lands all status fields whole). It deliberately does NOT touch lastReadAt.
 *
 * Template: gitmSetStatus.quality.ts (readGitStatus seam) · gitmConfirmSuccess (bucket).
 * Citation: GITM-AB-R-S3-YELLOW-BLUEPRINT.md §W2c (Nb3 · LOCKED Q2).
 */

import {
  createQualityCardWithPayload,
  createMethodWithConcepts,
  selectPayload,
  muxiumConclude,
  strategySuccess,
  type Concept,
} from 'stratimux';
import type { GitmState } from '../gitm.types';
import type { GitmRecountChanges, GitmRecountChangesPayload } from './types';
import { readGitStatus } from '../model/gitmStatus.model';
import { resolveGitmTargetCwd } from '../model/gitmOpCwd.model';

export type { GitmRecountChanges };

// GITM Branch-Flow (#644 · Decision A) — the bucket carries the live count AND the clearError
// gate (true only on a REAL user-tree change · path outside Cascades/Bridge/) so the reducer
// retires the transient action-error there but NOT on the bridge's own bookkeeping writes.
interface RecountBucketItem {
  count: number;
  clearError: boolean;
}

const bucket: RecountBucketItem[] = [];

type GitmSelfDeck = {
  gitm: Concept<GitmState, Record<string, unknown>>;
};

export const gitmRecountChanges = createQualityCardWithPayload<
  GitmState,
  GitmRecountChangesPayload,
  GitmSelfDeck
>({
  type: 'Gitm Recount Changes',
  reducer: (state) => {
    const item = bucket.pop();
    if (item === undefined) {
      return {};
    }
    // GITM Branch-Flow (#644 · Decision A) — clear the transient action-error ONLY on a real
    // user-tree change (clearError true · path outside Cascades/Bridge/). Partial-return law:
    // 1 field on a bookkeeping write, 3 on a real user change; never collides with the STARC-
    // coherence reducer (the error fields are write-only-empty here).
    if (item.clearError) {
      return { changesPrimedOnB: item.count, errorCode: '', errorMessage: '' };
    }
    return { changesPrimedOnB: item.count };
  },
  methodCreator: () =>
    createMethodWithConcepts(({ action, deck }) => {
      const { clearError, originScpName } = selectPayload<GitmRecountChangesPayload>(action);
      // MULTI-SCP GITM MUXIFICATION (MC-W1) — CALLING SCP's repo (origin-aware) · SCP-Sovereign fallback.
      const userCwd = resolveGitmTargetCwd(deck, originScpName);
      const status = readGitStatus(userCwd);
      // GITM color-cascade (W2 · Counter A) — INCLUDE untracked (NEW files). A brand-new file
      // (e.g. a freshly-written hifiConfig.json) is untracked → without this it never registers
      // (the badge / CHANGEDIAL read 0 despite git status showing it). Mirrors gitmStatus.model.ts
      // `dirty` (which already counts untracked) AND gitmRecountLocation's changeCount (Sovereign).
      const count =
        status.stagedFiles.length +
        status.unstagedFiles.length +
        status.conflicts.length +
        status.untrackedFiles.length;
      bucket.push({ count, clearError });
      return action.strategy ? strategySuccess(action.strategy) : muxiumConclude();
    }),
});
