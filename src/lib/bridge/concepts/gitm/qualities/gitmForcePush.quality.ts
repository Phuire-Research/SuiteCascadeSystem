/**
 * gitmForcePush Quality · GITM D4 (#635) · T3 GUARDED · git push --force-with-lease
 *
 * FORCEDIAL (GITM-D4-S2-ORANGE §5 · EXAM Q3): raw `--force` is NEVER exposed. The
 * Method HARDCODES ['push', '--force-with-lease', ...] — no payload option can
 * override it. force-with-lease aborts if a teammate has pushed since the last
 * fetch (shared-branch protection); the WATCHKEY double-confirm adds the friction.
 *
 * WATCHKEY double-confirm token round (EXAM Q2):
 *   call 1 (no token)    → guardFired + token issued (pendingConfirm set).
 *   call 2 (valid token) → execute + pendingConfirm cleared.
 * PARAMSEAL seals (remote, branch); BURNTIME (120s) expires it.
 *
 * Protected-branch SOFT guard (EXAM Q3): when the current branch matches a
 * protected pattern (main/master/develop/release/*), the confirmed-path result
 * carries an extra `protectedBranch` warning in strategyData — but still executes
 * if the token is valid (a soft note on the confirmed path · NOT a third round).
 *
 * EXPLICIT STARC RE-READ (inline · the D3 canon · push leaves local .git's
 * ahead/behind unchanged so the inline readGitStatus refreshes them).
 *
 * Template: gitmReset.quality.ts (WATCHKEY round) · gitmPush.quality.ts (push re-read)
 * Citation: GITM-D4-S4-GREEN-EXAM.md Q3 (force-with-lease UNCONDITIONAL + protected soft guard)
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
  GitmForcePushPayload,
  GitmForcePush,
  GitmActionResult,
  PendingConfirm,
} from './types';
import { gitmExec } from '../model/gitmExec.model';
import { resolveGitmTargetCwd } from '../model/gitmOpCwd.model';
import { readGitStatus, type GitmStatusResult } from '../model/gitmStatus.model';
import { issueToken, validateToken } from '../model/gitmConfirmToken.model';
import { computeForcePushPreview } from '../model/gitmDestructivePreview.model';

export type { GitmForcePush };

interface ForcePushBucketItem {
  result: GitmActionResult;
  refresh: GitmStatusResult | null;
  pendingConfirm: PendingConfirm | null;
  clearPending: boolean;
}

const bucket: ForcePushBucketItem[] = [];

const PROTECTED_PATTERNS = [/^main$/, /^master$/, /^develop$/, /^release\//];

const isProtectedBranch = (branch: string): boolean =>
  PROTECTED_PATTERNS.some((re) => re.test(branch));

type GitmSelfDeck = {
  gitm: Concept<GitmState, Record<string, unknown>>;
};

export const gitmForcePush = createQualityCardWithPayload<
  GitmState,
  GitmForcePushPayload,
  GitmSelfDeck
>({
  type: 'Gitm Force Push',
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
        lastActionResult: item.result,
        pendingConfirm: null,
      };
    }
    if (item.pendingConfirm) {
      return { lastActionResult: item.result, pendingConfirm: item.pendingConfirm };
    }
    if (item.clearPending) {
      return { lastActionResult: item.result, pendingConfirm: null };
    }
    return { lastActionResult: item.result };
  },
  methodCreator: () =>
    createMethodWithConcepts(({ action, deck }) => {
      const { remote, branch, confirmToken, originScpName } = selectPayload<GitmForcePushPayload>(action);
      // MULTI-SCP GITM MUXIFICATION (MC-W1) — CALLING SCP's repo (origin-aware) · SCP-Sovereign fallback.
      const userCwd = resolveGitmTargetCwd(deck, originScpName);
      // PARAMSEAL — seal the optional remote/branch (empty string when omitted).
      const sealParams = {
        action: 'gitmForcePush',
        remote: remote ?? '',
        branch: branch ?? '',
      };

      // ── WATCHKEY double-confirm token round
      const pending = deck.gitm.k.pendingConfirm.select();
      const validation =
        confirmToken !== undefined && confirmToken !== ''
          ? validateToken(pending, 'gitmForcePush', sealParams, confirmToken)
          : 'mismatch';
      if (validation !== 'ok') {
        const token = issueToken('gitmForcePush', sealParams);
        // MD-D DESTRUCTIVE PREVIEW — the remote commits HEAD would overwrite
        // (`git log <remote>/<branch> ^HEAD --oneline` · best-effort · absent-remote note).
        const currentBranch = deck.gitm.k.currentBranch.select();
        const preview = computeForcePushPreview(userCwd, remote ?? '', branch ?? '', currentBranch);
        const guard: GitmActionResult = {
          action: 'gitmForcePush',
          ok: false,
          error: '',
          guardFired: true,
          reason: validation === 'expired' ? 'force-push-confirm-expired' : 'force-push-confirm-required',
          at: Date.now(),
          preview,
        };
        bucket.push({ result: guard, refresh: null, pendingConfirm: token, clearPending: false });
        return action.strategy
          ? strategySuccess(
              action.strategy,
              strategyData_muxifyData(action.strategy, {
                ...guard,
                confirmToken: token.token,
                preview,
                forceMode: 'force-with-lease',
              }),
            )
          : muxiumConclude();
      }

      // ── EXECUTE — valid token · --force-with-lease HARDCODED (FORCEDIAL)
      const currentBranch = deck.gitm.k.currentBranch.select();
      const protectedHit = isProtectedBranch(currentBranch);
      const args = ['push', '--force-with-lease'];
      if (remote) args.push(remote);
      if (branch) args.push(branch);
      const exec = gitmExec(args, userCwd);
      const result: GitmActionResult = {
        action: 'gitmForcePush',
        ok: exec.ok,
        error: exec.ok ? '' : exec.error || exec.stderr,
        guardFired: false,
        reason: protectedHit ? 'protected-branch-force-pushed' : '',
        at: Date.now(),
      };
      const refresh = exec.ok ? readGitStatus(userCwd) : null;
      bucket.push({ result, refresh, pendingConfirm: null, clearPending: true });
      return action.strategy
        ? strategySuccess(
            action.strategy,
            strategyData_muxifyData(action.strategy, {
              ...result,
              protectedBranch: protectedHit,
              forceMode: 'force-with-lease',
            }),
          )
        : muxiumConclude();
    }),
});
