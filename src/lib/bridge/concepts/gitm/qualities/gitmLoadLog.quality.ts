/**
 * gitmLoadLog Quality · GITM D3 (#634) · T2 read · git log --format=... -n <limit>
 *
 * Read-only. Runs gitmExec with the unit-separator format string, parses via the
 * pure parseGitmLog seam, lands { commitLog, lastActionResult } in one partial
 * return. No guard. No WATCHDIAL refresh needed (read-only · touches no .git target).
 *
 * Format: %H\x1f%an\x1f%ae\x1f%ai\x1f%s — parsed per line by \x1f (ASCII unit sep).
 *
 * Template: gitmStageFile.quality.ts (D3 set discipline) · parseGitmLog (model)
 * Citation: GITM-D3-S3-YELLOW-BLUEPRINT.md §4 (loadLog · parse detail)
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
  GitmLoadLogPayload,
  GitmLoadLog,
  GitmActionResult,
  GitmCommitEntry,
} from './types';
import { gitmExec, parseGitmLog } from '../model/gitmExec.model';
import { resolveGitmTargetCwd } from '../model/gitmOpCwd.model';

export type { GitmLoadLog };

interface LoadLogBucketItem {
  result: GitmActionResult;
  commitLog: GitmCommitEntry[];
}

const bucket: LoadLogBucketItem[] = [];

type GitmSelfDeck = {
  gitm: Concept<GitmState, Record<string, unknown>>;
};

export const gitmLoadLog = createQualityCardWithPayload<
  GitmState,
  GitmLoadLogPayload,
  GitmSelfDeck
>({
  type: 'Gitm Load Log',
  reducer: (state) => {
    const item = bucket.pop();
    if (!item) {
      return {};
    }
    return { commitLog: item.commitLog, lastActionResult: item.result };
  },
  methodCreator: () =>
    createMethodWithConcepts(({ action, deck }) => {
      const { limit, originScpName } = selectPayload<GitmLoadLogPayload>(action);
      // MULTI-SCP GITM MUXIFICATION (MC-W1) — CALLING SCP's repo (origin-aware) · SCP-Sovereign fallback.
      const userCwd = resolveGitmTargetCwd(deck, originScpName);
      const exec = gitmExec(
        ['log', '--format=%H%x1f%an%x1f%ae%x1f%ai%x1f%s', '-n', String(limit ?? 50)],
        userCwd,
      );
      const commitLog = exec.ok ? parseGitmLog(exec.stdout) : [];
      const result: GitmActionResult = {
        action: 'gitmLoadLog',
        ok: exec.ok,
        error: exec.ok ? '' : exec.error || exec.stderr,
        guardFired: false,
        reason: '',
        at: Date.now(),
      };
      bucket.push({ result, commitLog });
      return action.strategy
        ? strategySuccess(
            action.strategy,
            strategyData_muxifyData(action.strategy, { ...result, commitLog }),
          )
        : muxiumConclude();
    }),
});
