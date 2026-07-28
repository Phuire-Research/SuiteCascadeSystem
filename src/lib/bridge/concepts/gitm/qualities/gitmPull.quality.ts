/**
 * gitmPull Quality · GITM D3 (#634) · T2 catch-based · git pull --ff-only
 *
 * Empty payload. Runs gitmExec(['pull', '--ff-only']). On failure the stderr is
 * classified into a canonical error code:
 *   - 'no tracking information' / 'no remote' → error 'no-remote'
 *   - 'merge conflict' / 'Automatic merge failed' / generic ff-rejection → 'merge-conflict'
 * The T1 `conflicts` field populates via the next WATCHDIAL cycle (the merge
 * leaves markers in .git/index). On success WATCHDIAL fires on .git/HEAD + refs →
 * STARC refresh follows. Reducer partial-return { lastActionResult } only.
 *
 * Template: gitmStageFile.quality.ts (D3 set discipline) · catch classification (Curation §5)
 * Citation: GITM-D3-S3-YELLOW-BLUEPRINT.md §4 (pull · catch-based error surface)
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
import type { GitmPullPayload, GitmPull, GitmActionResult } from './types';
import { gitmExec, setCurrentOp, clearCurrentOp } from '../model/gitmExec.model';
import { resolveGitmTargetCwd } from '../model/gitmOpCwd.model';

export type { GitmPull };

const bucket: GitmActionResult[] = [];

type GitmSelfDeck = {
  gitm: Concept<GitmState, Record<string, unknown>>;
};

function classifyPullError(stderr: string): string {
  const s = stderr.toLowerCase();
  if (s.includes('no tracking information') || s.includes('no remote')) {
    return 'no-remote';
  }
  if (
    s.includes('merge conflict') ||
    s.includes('automatic merge failed') ||
    s.includes('not possible to fast-forward')
  ) {
    return 'merge-conflict';
  }
  return 'pull-failed';
}

export const gitmPull = createQualityCardWithPayload<
  GitmState,
  GitmPullPayload,
  GitmSelfDeck
>({
  type: 'Gitm Pull',
  reducer: (state) => {
    const item = bucket.pop();
    if (!item) {
      return {};
    }
    return { lastActionResult: item };
  },
  methodCreator: () =>
    createMethodWithConcepts(({ action, deck }) => {
      const userCwd = resolveGitmTargetCwd(deck, selectPayload<GitmPullPayload>(action).originScpName); // MULTI-SCP GITM MUXIFICATION (MC-W1): CALLING SCP repo (origin-aware) · SCP-Sovereign fallback
      // MD-E (part 2 · PROGRESS) — stamp the current-op latch (pull is remote · can exceed 1s).
      setCurrentOp({ message: 'Pulling from remote…', command: 'git pull --ff-only' });
      const exec = gitmExec(['pull', '--ff-only'], userCwd);
      clearCurrentOp();
      const result: GitmActionResult = {
        action: 'gitmPull',
        ok: exec.ok,
        error: exec.ok ? '' : classifyPullError(exec.stderr || exec.error),
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
