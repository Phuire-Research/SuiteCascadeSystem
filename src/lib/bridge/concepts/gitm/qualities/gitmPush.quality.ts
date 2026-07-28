/**
 * gitmPush Quality · GITM D3 (#634) · T2 GUARDSHUNT + catch + STARC re-read · git push
 *
 * GUARDSHUNT (behind-remote): the Method reads deck.gitm.k.behind BEFORE exec. If
 * behind > 0 → guardFired { reason: 'behind-remote' }; git is NEVER invoked (push
 * when behind risks divergence — pull first). Otherwise runs gitmExec(['push']).
 * On failure stderr is classified:
 *   - 'rejected' / 'updates were rejected' → error 'push-rejected'
 *   - 'no tracking information' / 'no remote' → error 'no-remote'
 *
 * EXPLICIT STARC RE-READ (the blueprint's intent): push changes remote-only state;
 * local .git is unchanged so WATCHDIAL cannot observe ahead/behind shifts. A
 * quality Method returns ONE action and CANNOT capture nextA (MethodWithConceptsParams
 * exposes no nextA — see scpRegistryDirectoryWatcherArm.quality.ts:11-12). The
 * refresh is therefore INLINE: readGitStatus(userCwd) runs in the same Method and
 * its fields land alongside lastActionResult in ONE partial reducer return — same
 * outcome as a deferred nextA(gitmSetStatus), single-action-legal.
 *
 * Template: gitmBranchSwitch.quality.ts (GUARDSHUNT) · gitmDiscard.quality.ts (inline STARC re-read)
 * Citation: GITM-D3-S3-YELLOW-BLUEPRINT.md §4 (push · behind-remote soft guard + explicit re-read)
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
import type { GitmPushPayload, GitmPush, GitmActionResult } from './types';
import { gitmExec, setCurrentOp, clearCurrentOp } from '../model/gitmExec.model';
import { resolveGitmTargetCwd } from '../model/gitmOpCwd.model';
import { readGitStatus, type GitmStatusResult } from '../model/gitmStatus.model';

export type { GitmPush };

interface PushBucketItem {
  result: GitmActionResult;
  refresh: GitmStatusResult | null; // present only after a successful push
}

const bucket: PushBucketItem[] = [];

type GitmSelfDeck = {
  gitm: Concept<GitmState, Record<string, unknown>>;
};

// MD-E (part 1 · HOOKS SURFACING) — classify to a canonical code, but PRESERVE the verbatim output
// for anything the taxonomy does not name (a pre-push hook abort, a server-side reject reason). The
// classified code is the guidance key; the raw text is appended so the hook's OWN message reaches
// lastActionResult ('shows the hook's own output' — the RD). `raw` = the composed exec.error (message
// + stderr + stdout · hook stdout included by the gitmExec seam). For the two named remote-state
// causes the code alone is the clearer surface; the generic 'push-failed' fallback carries the raw
// text verbatim so a hook failure is never reduced to a bare code.
function classifyPushError(stderr: string, raw: string): string {
  const s = stderr.toLowerCase();
  if (s.includes('no tracking information') || s.includes('no remote')) {
    return 'no-remote';
  }
  if (s.includes('rejected') || s.includes('updates were rejected')) {
    return 'push-rejected';
  }
  const detail = (raw || stderr || '').trim();
  return detail !== '' ? `push-failed: ${detail}` : 'push-failed';
}

export const gitmPush = createQualityCardWithPayload<
  GitmState,
  GitmPushPayload,
  GitmSelfDeck
>({
  type: 'Gitm Push',
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
      };
    }
    return { lastActionResult: item.result };
  },
  methodCreator: () =>
    createMethodWithConcepts(({ action, deck }) => {
      // GUARDSHUNT (pre-exec · git never invoked when fired)
      const behind = deck.gitm.k.behind.select();
      if (behind > 0) {
        const guard: GitmActionResult = {
          action: 'gitmPush',
          ok: false,
          error: '',
          guardFired: true,
          reason: 'behind-remote',
          at: Date.now(),
        };
        bucket.push({ result: guard, refresh: null });
        return action.strategy
          ? strategySuccess(
              action.strategy,
              strategyData_muxifyData(action.strategy, { ...guard, recommendation: 'pull' }),
            )
          : muxiumConclude();
      }

      const userCwd = resolveGitmTargetCwd(deck, selectPayload<GitmPushPayload>(action).originScpName); // MULTI-SCP GITM MUXIFICATION (MC-W1): CALLING SCP repo (origin-aware) · SCP-Sovereign fallback
      // MD-E (part 2 · PROGRESS) — stamp the current-op latch BEFORE the exec (push is remote · can
      // exceed 1s · the GITEP snapshot surfaces it while in flight); clear after (a failing exec still
      // clears · gitmExec catches internally and returns, so no throw escapes here).
      setCurrentOp({ message: 'Pushing to remote…', command: 'git push' });
      // C928 · FIRST-PUSH EASE — a repo with an origin but NO upstream (the release shape:
      // remote just set via gitm_set_remote, branch never pushed) pushes `-u origin <branch>`
      // automatically; a bare 'push' would fail 'no tracking information'. No origin → the
      // bare push stands and fails honest ('no-remote').
      let pushArgs = ['push'];
      const upstreamProbe = gitmExec(['rev-parse', '--abbrev-ref', '@{u}'], userCwd);
      if (!upstreamProbe.ok) {
        const originProbe = gitmExec(['remote', 'get-url', 'origin'], userCwd);
        const branch = deck.gitm.k.currentBranch.select();
        if (originProbe.ok && typeof branch === 'string' && branch !== '') {
          pushArgs = ['push', '-u', 'origin', branch];
        }
      }
      const exec = gitmExec(pushArgs, userCwd);
      clearCurrentOp();
      const result: GitmActionResult = {
        action: 'gitmPush',
        ok: exec.ok,
        // MD-E (part 1) — the composed exec.error (message+stderr+stdout · hook output included) is
        // appended verbatim under the generic 'push-failed' code so a pre-push hook's own message rides.
        error: exec.ok ? '' : classifyPushError(exec.stderr || exec.error, exec.error),
        guardFired: false,
        reason: '',
        at: Date.now(),
      };

      // EXPLICIT STARC RE-READ (inline · push leaves local .git unchanged)
      const refresh = exec.ok ? readGitStatus(userCwd) : null;
      bucket.push({ result, refresh });
      return action.strategy
        ? strategySuccess(action.strategy, strategyData_muxifyData(action.strategy, { ...result }))
        : muxiumConclude();
    }),
});
