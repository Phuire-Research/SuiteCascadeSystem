/**
 * gitmSetRemote Quality · C928 · THE RELEASE DOOR · git remote add/set-url origin <url>
 *
 * The user-facing seam that makes a push a RELEASE: an SCP with no remote gains one
 * (`remote add origin`), an SCP with a stale one is repointed (`remote set-url origin`).
 * The probe (`remote get-url origin`) decides which verb — idempotent either way.
 *
 * PARAMSEAL (URL): only `https://…`, `git@host:path`, anor `ssh://…` shapes pass; anything
 * else returns { guardFired: true, reason: 'invalid-remote-url' } and git is NEVER invoked
 * (no shell-arg smuggling through a free-text field — the T3 guard discipline).
 *
 * EXPLICIT STARC RE-READ (the gitmPush idiom): the C837 status read records remoteOrigin
 * (`git remote get-url origin`) — the inline refresh lands the NEW origin in gitm.json in
 * the SAME reducer return, so the page reflects the repoint on the next relay beat.
 *
 * Template: gitmPush.quality.ts (bucket + inline refresh) · gitmBranchCreate (payload validation)
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
import type { GitmSetRemotePayload, GitmSetRemote, GitmActionResult } from './types';
import { gitmExec, setCurrentOp, clearCurrentOp } from '../model/gitmExec.model';
import { resolveGitmTargetCwd } from '../model/gitmOpCwd.model';
import { readGitStatus, type GitmStatusResult } from '../model/gitmStatus.model';

export type { GitmSetRemote };

interface SetRemoteBucketItem {
  result: GitmActionResult;
  refresh: GitmStatusResult | null;
}

const bucket: SetRemoteBucketItem[] = [];

type GitmSelfDeck = {
  gitm: Concept<GitmState, Record<string, unknown>>;
};

// PARAMSEAL · the three honest remote-URL shapes. Anything else never reaches git.
const REMOTE_URL_SHAPE = /^(https:\/\/[\w.-]+(:\d+)?\/[\w./~-]+|git@[\w.-]+:[\w./~-]+|ssh:\/\/[\w.@-]+(:\d+)?\/[\w./~-]+)$/;

export const gitmSetRemote = createQualityCardWithPayload<
  GitmState,
  GitmSetRemotePayload,
  GitmSelfDeck
>({
  type: 'Gitm Set Remote',
  reducer: (state) => {
    const item = bucket.pop();
    if (!item) {
      return {};
    }
    if (item.refresh) {
      return {
        isRepo: item.refresh.isRepo,
        currentBranch: item.refresh.currentBranch,
        dirty: item.refresh.dirty,
        ahead: item.refresh.ahead,
        behind: item.refresh.behind,
        branches: item.refresh.branches,
        stagedFiles: item.refresh.stagedFiles,
        unstagedFiles: item.refresh.unstagedFiles,
        detachedHead: item.refresh.detachedHead,
        conflicts: item.refresh.conflicts,
        lastReadAt: item.refresh.lastReadAt,
        // THE POINT of this quality — the repointed origin lands in state → gitm.json → the page.
        remoteOrigin: item.refresh.remoteOrigin,
        lastActionResult: item.result,
      };
    }
    return { lastActionResult: item.result };
  },
  methodCreator: () =>
    createMethodWithConcepts(({ action, deck }) => {
      const payload = selectPayload<GitmSetRemotePayload>(action);
      const url = (payload.url ?? '').trim();

      // PARAMSEAL — the URL shape gate (pre-exec · git never invoked on a refusal).
      if (!REMOTE_URL_SHAPE.test(url)) {
        const guard: GitmActionResult = {
          action: 'gitmSetRemote',
          ok: false,
          error: '',
          guardFired: true,
          reason: 'invalid-remote-url',
          at: Date.now(),
        };
        bucket.push({ result: guard, refresh: null });
        return action.strategy
          ? strategySuccess(action.strategy, strategyData_muxifyData(action.strategy, { ...guard }))
          : muxiumConclude();
      }

      const userCwd = resolveGitmTargetCwd(deck, payload.originScpName);
      setCurrentOp({ message: 'Setting remote origin…', command: 'git remote' });
      // The probe decides the verb: an existing origin is REPOINTED, an absent one is ADDED.
      const probe = gitmExec(['remote', 'get-url', 'origin'], userCwd);
      const exec = probe.ok
        ? gitmExec(['remote', 'set-url', 'origin', url], userCwd)
        : gitmExec(['remote', 'add', 'origin', url], userCwd);
      clearCurrentOp();

      const result: GitmActionResult = {
        action: 'gitmSetRemote',
        ok: exec.ok,
        error: exec.ok ? '' : `set-remote-failed: ${(exec.stderr || exec.error || '').trim()}`,
        guardFired: false,
        reason: '',
        at: Date.now(),
      };

      // EXPLICIT STARC RE-READ — the C837 status read carries remoteOrigin; the page sees
      // the new origin on the next gitm.json relay beat.
      const refresh = exec.ok ? readGitStatus(userCwd) : null;
      bucket.push({ result, refresh });
      return action.strategy
        ? strategySuccess(action.strategy, strategyData_muxifyData(action.strategy, { ...result }))
        : muxiumConclude();
    }),
});
