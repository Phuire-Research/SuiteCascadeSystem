/**
 * gitmFetch Quality · GITM Dev Menu (#644) · T2 catch-based · git fetch --prune
 *
 * Fetch WITHOUT merge (DEVBAR Fetch) — distinct from gitmPull (fetch + ff-only
 * merge). Empty payload. Runs gitmExec(['fetch', '--prune']). On failure the
 * stderr is classified into a canonical error code (same shape as gitmPull):
 *   - 'no tracking information' / 'no remote' / 'does not appear to be a git
 *     repository' → 'no-remote'
 *   - anything else → 'fetch-failed'
 * Fetch only updates remote-tracking refs (.git/refs/remotes) — it does NOT
 * change the working tree or local HEAD, so the ahead/behind counts shift on the
 * next STARC read (WATCHDIAL fires on the remote-ref update). Reducer partial-
 * return { lastActionResult } only.
 *
 * Template: gitmPull.quality.ts (T2 catch-based · classified error surface)
 * Citation: GITM-DEVMENU-S4-GREEN-INVENTORY.md §5 GAP 3 (gitmFetch · git fetch · catch-based)
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
import type { GitmFetchPayload, GitmFetch, GitmActionResult } from './types';
import { gitmExec, setCurrentOp, clearCurrentOp } from '../model/gitmExec.model';
import { resolveGitmTargetCwd } from '../model/gitmOpCwd.model';

export type { GitmFetch };

const bucket: GitmActionResult[] = [];

type GitmSelfDeck = {
  gitm: Concept<GitmState, Record<string, unknown>>;
};

function classifyFetchError(stderr: string): string {
  const s = stderr.toLowerCase();
  if (
    s.includes('no tracking information') ||
    s.includes('no remote') ||
    s.includes('does not appear to be a git repository') ||
    s.includes('could not read from remote repository')
  ) {
    return 'no-remote';
  }
  return 'fetch-failed';
}

export const gitmFetch = createQualityCardWithPayload<
  GitmState,
  GitmFetchPayload,
  GitmSelfDeck
>({
  type: 'Gitm Fetch',
  reducer: (state) => {
    const item = bucket.pop();
    if (!item) {
      return {};
    }
    return { lastActionResult: item };
  },
  methodCreator: () =>
    createMethodWithConcepts(({ action, deck }) => {
      const userCwd = resolveGitmTargetCwd(deck, selectPayload<GitmFetchPayload>(action).originScpName); // MULTI-SCP GITM MUXIFICATION (MC-W1): CALLING SCP repo (origin-aware) · SCP-Sovereign fallback
      // MD-E (part 2 · PROGRESS) — stamp the current-op latch (fetch is remote · can exceed 1s).
      setCurrentOp({ message: 'Fetching from remote…', command: 'git fetch --prune' });
      const exec = gitmExec(['fetch', '--prune'], userCwd);
      clearCurrentOp();
      const result: GitmActionResult = {
        action: 'gitmFetch',
        ok: exec.ok,
        error: exec.ok ? '' : classifyFetchError(exec.stderr || exec.error),
        guardFired: false,
        reason: '',
        at: Date.now(),
      };
      bucket.push(result);
      return action.strategy
        ? strategySuccess(action.strategy, strategyData_muxifyData(action.strategy, { ...result }))
        : muxiumConclude();
    }),
});
