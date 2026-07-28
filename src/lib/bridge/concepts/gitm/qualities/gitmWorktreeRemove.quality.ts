/**
 * gitmWorktreeRemove Quality · THE SCP COMMAND MENU (W4 · TYPED-NAME DELETE) · git worktree remove + RETIRE
 *
 * THE DESTRUCTIVE LEG (WATCHKEY two-call · same round as gitmBranchDelete -D / gitmResetAb): removing a
 * worktree instance forgets a live citizen, so it is gated by the two-call token round. The token is
 * PARAMSEAL-sealed to the INSTANCE NAME — the token minted for instance X can NEVER fire a remove of Y
 * (the bidirectional lock: the UI typed-match arms the button, the PARAMSEAL binds the token to the same
 * name · both must agree · D-SCM-W4 §6c).
 *   call 1 (no valid confirmToken) → { guardFired:true, reason:'worktree-remove-needs-confirmation',
 *                                      confirmToken } sealed to { action, instanceName }.
 *   call 2 (valid token)           → git worktree remove [--force] + the registry-retirement legs.
 * PARAMSEAL seals { action:'gitmWorktreeRemove', instanceName }; BURNTIME (120s) expires an unused token.
 *
 * THE DIRTY-TREE REFUSAL (R6 · honest degradation): `git worktree remove` refuses a dirty/locked tree.
 * Without force:true the refusal surfaces as a SOFT guard { reason:'worktree-dirty-use-force' } (the
 * caller re-calls with force:true · MIRRORS gitmBranchDelete's -d→-D soft-guard). force:true runs
 * `git worktree remove --force` behind the SAME confirm token.
 *
 * THE RETIREMENT LEGS (R7 · D-SCM-W3 §3 · §6c · all existing APIs): on a confirmed successful remove —
 *   1. removeScpEntry(reg, instanceName) + writeScpRegistry — the citizen leaves the registry.
 *   2. deleteSlice(wtDir) — the per-repo slice retires (its gitm.json stops being fanned out · MC-W3).
 *   3. disarmWatchersForScp(wtDir) — the per-SCP watcher pair tears down (the callable behind the
 *      gitmWatcherDisarmForScp quality · no self-dispatch mid-method).
 *
 * The reducer clears pendingConfirm on both the guard-surface (call-1 mint) and the execute path; it
 * never mutates the flat git view (the removed tree is not the active pointer · the git tree + registry
 * writes are the durable products · Shortest-Path partial return).
 *
 * Template: gitmResetAb.quality.ts (the WATCHKEY two-call pendingConfirm round · PARAMSEAL) ·
 *   gitmBranchDelete.quality.ts (the -d→-D soft-guard-then-force idiom) · gitmWatcherDisarmForScp
 *   .quality.ts (the disarmWatchersForScp + deleteSlice retirement callables).
 * Citation: D-SCM-W4 §6 (git semantics · WATCHKEY · typed-name PARAMSEAL) · D-SCM-W3 §5 (R6 dirty · R7 orphan).
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
import { isAbsolute, resolve } from 'node:path';
import type { GitmState } from '../gitm.types';
import type {
  GitmWorktreeRemovePayload,
  GitmWorktreeRemove,
  GitmActionResult,
  PendingConfirm,
} from './types';
import { gitmExec } from '../model/gitmExec.model';
import { resolveGitmTargetCwd } from '../model/gitmOpCwd.model';
import { issueToken, validateToken } from '../model/gitmConfirmToken.model';
import { deleteSlice } from '../model/gitmSliceStore.model';
import { disarmWatchersForScp } from '../model/gitmWatcherRegistry.model';
import {
  readScpRegistry,
  writeScpRegistry,
  removeScpEntry,
} from '../../../../scp/scpPersistence';
import { log } from '../../../debugLog';

export type { GitmWorktreeRemove };

interface WorktreeRemoveBucketItem {
  result: GitmActionResult;
  pendingConfirm: PendingConfirm | null; // call-1 mint (guard route)
  clearPending: boolean; // execute path → clear the state token
}

const bucket: WorktreeRemoveBucketItem[] = [];

type GitmSelfDeck = {
  gitm: Concept<GitmState, Record<string, unknown>>;
};

export const gitmWorktreeRemove = createQualityCardWithPayload<
  GitmState,
  GitmWorktreeRemovePayload,
  GitmSelfDeck
>({
  type: 'Gitm Worktree Remove',
  reducer: (state) => {
    const item = bucket.pop();
    if (!item) {
      return {};
    }
    // call-1 guard — surface the pending token, no removal.
    if (item.pendingConfirm) {
      return { lastActionResult: item.result, pendingConfirm: item.pendingConfirm };
    }
    // execute path (success OR soft dirty-guard) — clear any minted token.
    if (item.clearPending) {
      return { lastActionResult: item.result, pendingConfirm: null };
    }
    return { lastActionResult: item.result };
  },
  methodCreator: () =>
    createMethodWithConcepts(({ action, deck }) => {
      const { instanceName, force, confirmToken, originScpName } =
        selectPayload<GitmWorktreeRemovePayload>(action);
      // MULTI-SCP GITM MUXIFICATION (MC-W1) — CALLING SCP's repo (origin-aware · the exec runs from
      // the parent citizen's toplevel · git worktree remove resolves the instance by its own path).
      const opCwd = resolveGitmTargetCwd(deck, originScpName);
      const userCwd = deck.gitm.k.userCwd.select();

      const nameTrim = (instanceName ?? '').trim();
      if (nameTrim.length === 0) {
        const guard: GitmActionResult = {
          action: 'gitmWorktreeRemove',
          ok: false,
          error: '',
          guardFired: true,
          reason: 'worktree-instance-name-empty',
          at: Date.now(),
        };
        bucket.push({ result: guard, pendingConfirm: null, clearPending: false });
        return action.strategy
          ? strategySuccess(action.strategy, strategyData_muxifyData(action.strategy, { ...guard }))
          : muxiumConclude();
      }

      // PARAMSEAL — bind the token to the SPECIFIC instance (the typed name arms the token · §6c).
      const sealParams = { action: 'gitmWorktreeRemove', instanceName: nameTrim };

      // ── WATCHKEY double-confirm (destructive · same round as gitmBranchDelete -D / gitmResetAb).
      const pending = deck.gitm.k.pendingConfirm.select();
      const validation =
        confirmToken !== undefined && confirmToken !== ''
          ? validateToken(pending, 'gitmWorktreeRemove', sealParams, confirmToken)
          : 'mismatch';
      if (validation !== 'ok') {
        const token = issueToken('gitmWorktreeRemove', sealParams);
        const guard: GitmActionResult = {
          action: 'gitmWorktreeRemove',
          ok: false,
          error: '',
          guardFired: true,
          reason:
            validation === 'expired'
              ? 'worktree-remove-confirm-expired'
              : 'worktree-remove-needs-confirmation',
          at: Date.now(),
        };
        log('gitm.worktree.remove.confirm', { reason: guard.reason, instanceName: nameTrim });
        bucket.push({ result: guard, pendingConfirm: token, clearPending: false });
        return action.strategy
          ? strategySuccess(
              action.strategy,
              strategyData_muxifyData(action.strategy, { ...guard, confirmToken: token.token, instanceName: nameTrim }),
            )
          : muxiumConclude();
      }

      // ── EXECUTE (valid token). Resolve the instance's OWN dir from the registry (the canonical
      //    absolute checkout path · the slice/watcher key).
      const registry = readScpRegistry(userCwd !== '' ? userCwd : process.cwd());
      const target = registry.scps.find((s) => s.name === nameTrim);
      // The registry `path` is the SCP PACKAGE dir (…/SCP); the worktree checkout is its parent dir
      // (…/<instanceName>). git worktree remove takes the WORKTREE dir, so resolve the package path to
      // absolute then step up to the tree dir.
      const packageAbs =
        target && target.path !== ''
          ? isAbsolute(target.path)
            ? target.path
            : resolve(userCwd !== '' ? userCwd : process.cwd(), target.path)
          : '';
      const wtDir = packageAbs !== '' ? resolve(packageAbs, '..') : '';

      if (wtDir === '') {
        const guard: GitmActionResult = {
          action: 'gitmWorktreeRemove',
          ok: false,
          error: '',
          guardFired: true,
          reason: 'worktree-instance-not-in-registry',
          at: Date.now(),
        };
        bucket.push({ result: guard, pendingConfirm: null, clearPending: true });
        return action.strategy
          ? strategySuccess(action.strategy, strategyData_muxifyData(action.strategy, { ...guard }))
          : muxiumConclude();
      }

      const removeArgs = force === true
        ? ['worktree', 'remove', '--force', wtDir]
        : ['worktree', 'remove', wtDir];
      const exec = gitmExec(removeArgs, opCwd);

      // R6 · DIRTY-TREE REFUSAL — a clean remove refuses a dirty/locked tree; surface the soft guard so
      // the caller re-calls with force:true (mirror gitmBranchDelete's not-fully-merged → -D). The
      // token is spent either way (clearPending) — a fresh confirm re-arms the force call.
      if (!exec.ok && force !== true) {
        const dirty = /(contains modified|use --force|locked|dirty)/i.test(exec.error || exec.stderr);
        const guard: GitmActionResult = {
          action: 'gitmWorktreeRemove',
          ok: false,
          error: exec.error || exec.stderr,
          guardFired: dirty,
          reason: dirty ? 'worktree-dirty-use-force' : '',
          at: Date.now(),
        };
        log('gitm.worktree.remove.refused', { instanceName: nameTrim, dirty, error: guard.error });
        bucket.push({ result: guard, pendingConfirm: null, clearPending: true });
        return action.strategy
          ? strategySuccess(action.strategy, strategyData_muxifyData(action.strategy, { ...guard, instanceName: nameTrim }))
          : muxiumConclude();
      }

      // ── THE RETIREMENT LEGS (R7 · all existing APIs) — only on a clean remove.
      if (exec.ok) {
        writeScpRegistry(removeScpEntry(registry, nameTrim), userCwd !== '' ? userCwd : process.cwd());
        deleteSlice(wtDir);
        disarmWatchersForScp(wtDir);
        log('gitm.worktree.remove.retired', { instanceName: nameTrim, wtDir });
      }

      const result: GitmActionResult = {
        action: 'gitmWorktreeRemove',
        ok: exec.ok,
        error: exec.ok ? '' : exec.error || exec.stderr,
        guardFired: false,
        reason: '',
        at: Date.now(),
      };
      bucket.push({ result, pendingConfirm: null, clearPending: true });
      return action.strategy
        ? strategySuccess(action.strategy, strategyData_muxifyData(action.strategy, { ...result, instanceName: nameTrim }))
        : muxiumConclude();
    }),
});
