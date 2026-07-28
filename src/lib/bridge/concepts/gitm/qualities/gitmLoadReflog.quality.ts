/**
 * gitmLoadReflog Quality · GITM Dev Epoch (MD-D · TRUST COMPLETIONS) · read · git reflog
 *
 * Read-only. Runs `git reflog --format=%h|%gd|%gs -<limit>` (default 20), lands the raw
 * `<hash>|<selector>|<subject>` lines into reflogEntries[] + lastActionResult in ONE partial
 * return. The Universal-Undo picker renders the roster; each row's selector (%gd · e.g. HEAD@{2})
 * is the reflogRef gitmUndo takes. No guard. No WATCHDIAL refresh needed (read-only · touches no
 * .git target). reflogEntries changes WITHOUT lastReadAt so gitmEndpoint witnesses it directly
 * (TQNI ×4 — the relay carries it free per the whole-file STCP parse).
 *
 * Template: gitmLoadLog.quality.ts (read discipline · one partial return · strategyData carry).
 * Citation: DIAMOND-GITM-DEVELOPER-EPOCH.md §MD-D (Universal undo · gitmLoadReflog).
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
import type { GitmLoadReflogPayload, GitmLoadReflog, GitmActionResult } from './types';
import { gitmExec } from '../model/gitmExec.model';
import { resolveGitmTargetCwd } from '../model/gitmOpCwd.model';

export type { GitmLoadReflog };

interface LoadReflogBucketItem {
  result: GitmActionResult;
  reflogEntries: string[];
}

const bucket: LoadReflogBucketItem[] = [];

type GitmSelfDeck = {
  gitm: Concept<GitmState, Record<string, unknown>>;
};

export const gitmLoadReflog = createQualityCardWithPayload<
  GitmState,
  GitmLoadReflogPayload,
  GitmSelfDeck
>({
  type: 'Gitm Load Reflog',
  reducer: (state) => {
    const item = bucket.pop();
    if (!item) {
      return {};
    }
    return { reflogEntries: item.reflogEntries, lastActionResult: item.result };
  },
  methodCreator: () =>
    createMethodWithConcepts(({ action, deck }) => {
      const { limit, originScpName } = selectPayload<GitmLoadReflogPayload>(action);
      // MULTI-SCP GITM MUXIFICATION (MC-W1) — CALLING SCP's repo (origin-aware) · SCP-Sovereign fallback.
      const userCwd = resolveGitmTargetCwd(deck, originScpName);
      const exec = gitmExec(
        ['reflog', '--format=%h|%gd|%gs', '-' + String(limit ?? 20)],
        userCwd,
      );
      // Split into the raw `<hash>|<selector>|<subject>` lines (defensive: drop empties).
      const reflogEntries = exec.ok
        ? exec.stdout.split('\n').filter((line) => line.length > 0)
        : [];
      const result: GitmActionResult = {
        action: 'gitmLoadReflog',
        ok: exec.ok,
        error: exec.ok ? '' : exec.error || exec.stderr,
        guardFired: false,
        reason: '',
        at: Date.now(),
      };
      bucket.push({ result, reflogEntries });
      return action.strategy
        ? strategySuccess(
            action.strategy,
            strategyData_muxifyData(action.strategy, { ...result, reflogEntries }),
          )
        : muxiumConclude();
    }),
});
