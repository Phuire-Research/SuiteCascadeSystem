/**
 * gitmStashList Quality · GITM Dev Epoch (MD-B · THE LABELED STASH BROWSER) · git stash list
 *
 * The Stash Browser roster read. Method runs
 *   gitmExec(['stash', 'list', '--format=%gd|%s'], opCwd)
 * (the MD-A gitmExec seam · LOGS free — the command lands on the command ring). Each stdout line
 * is `<gitref>|<subject>` (e.g. `stash@{0}|WIP on master: 1a2b3c fix`); the split lines land whole
 * as GitmState.stashList (KeyedSelector-safe · []). The reducer partial-returns ONLY the roster +
 * the action-result surface (shortest-path · M-perf). No guard — an empty roster is a valid read.
 *
 * FailureNode Doctrine: a failed `git stash list` surfaces { ok:false, error:<git stderr> } on
 * lastActionResult (never silent) and leaves the roster as the last-good [] (the bucket carries []).
 *
 * Template: gitmStashPush.quality.ts (D3 simple-set discipline · selectGitmOpCwd) ·
 *           gitmLoadLog.quality.ts (a read landing whole into a state array).
 * Citation: DIAMOND-GITM-DEVELOPER-EPOCH.md §MD-B (the labeled stash browser) · MD-A (gitmExec LOGS free).
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
import type { GitmStashListPayload, GitmStashList, GitmActionResult } from './types';
import { gitmExec } from '../model/gitmExec.model';
import { resolveGitmTargetCwd } from '../model/gitmOpCwd.model';
import { log } from '../../../debugLog';

export type { GitmStashList };

interface StashListBucketItem {
  result: GitmActionResult;
  stashList: string[];
}

const bucket: StashListBucketItem[] = [];

type GitmSelfDeck = {
  gitm: Concept<GitmState, Record<string, unknown>>;
};

export const gitmStashList = createQualityCardWithPayload<
  GitmState,
  GitmStashListPayload,
  GitmSelfDeck
>({
  type: 'Gitm Stash List',
  reducer: (state) => {
    const item = bucket.pop();
    if (!item) {
      return {};
    }
    return { stashList: item.stashList, lastActionResult: item.result };
  },
  methodCreator: () =>
    createMethodWithConcepts(({ action, deck }) => {
      const opCwd = resolveGitmTargetCwd(deck, selectPayload<GitmStashListPayload>(action).originScpName); // MULTI-SCP GITM MUXIFICATION (MC-W1): CALLING SCP repo (origin-aware) · SCP-Sovereign fallback
      const exec = gitmExec(['stash', 'list', '--format=%gd|%s'], opCwd);
      // The roster: one `<gitref>|<subject>` line per stash entry. Empty stdout = no stashes = [].
      const stashList =
        exec.ok && exec.stdout.trim() !== ''
          ? exec.stdout.split('\n').map((l) => l.trim()).filter((l) => l.length > 0)
          : [];
      const result: GitmActionResult = {
        action: 'gitmStashList',
        ok: exec.ok,
        error: exec.ok ? '' : exec.error || exec.stderr,
        guardFired: false,
        reason: '',
        at: Date.now(),
      };
      log('gitm.stashlist.read', { count: stashList.length, ok: exec.ok });
      bucket.push({ result, stashList });
      return action.strategy
        ? strategySuccess(action.strategy, strategyData_muxifyData(action.strategy, { ...result }))
        : muxiumConclude();
    }),
});
