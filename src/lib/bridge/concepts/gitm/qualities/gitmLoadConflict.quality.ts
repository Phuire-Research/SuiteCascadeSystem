/**
 * gitmLoadConflict Quality · GITM Dev Epoch (MD-D · THE THREE-WAY SURFACE) · read
 *
 * Loads the FOUR sides of one conflicted file into activeConflict so the three-way editor
 * (LOCAL/BASE/REMOTE/OUTPUT) can render them — the client has no file-read reach, so the bridge
 * reads them here:
 *   ours   = `git show :2:<path>` (LOCAL · HEAD/current side)
 *   base   = `git show :1:<path>` (BASE · merge base · may be absent for add/add → '')
 *   theirs = `git show :3:<path>` (REMOTE · incoming side)
 *   merged = the working file's current (marker-laden) content read from disk
 * Read-only · no guard · no WATCHDIAL refresh (touches no .git target · reads index + worktree).
 * Lands { activeConflict, lastActionResult } in ONE partial return. activeConflict changes WITHOUT
 * lastReadAt so gitmEndpoint witnesses it directly (TQNI ×4 · the leaner state-field carry).
 *
 * Template: gitmLoadDiff.quality.ts (read discipline) · gitmDiscard (tracked/worktree read).
 * Citation: DIAMOND-GITM-DEVELOPER-EPOCH.md §MD-D (gitm_load_conflict · git show :2:/:1:/:3:).
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
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { GitmState } from '../gitm.types';
import type {
  GitmLoadConflictPayload,
  GitmLoadConflict,
  GitmActionResult,
  ActiveConflict,
} from './types';
import { gitmExec, resolveConflictPaths } from '../model/gitmExec.model';
import { resolveGitmTargetCwd } from '../model/gitmOpCwd.model';
import { log } from '../../../debugLog';

export type { GitmLoadConflict };

interface LoadConflictBucketItem {
  result: GitmActionResult;
  activeConflict: ActiveConflict | null;
}

const bucket: LoadConflictBucketItem[] = [];

type GitmSelfDeck = {
  gitm: Concept<GitmState, Record<string, unknown>>;
};

export const gitmLoadConflict = createQualityCardWithPayload<
  GitmState,
  GitmLoadConflictPayload,
  GitmSelfDeck
>({
  type: 'Gitm Load Conflict',
  reducer: (state) => {
    const item = bucket.pop();
    if (!item) {
      return {};
    }
    return { activeConflict: item.activeConflict, lastActionResult: item.result };
  },
  methodCreator: () =>
    createMethodWithConcepts(({ action, deck }) => {
      const { path, originScpName } = selectPayload<GitmLoadConflictPayload>(action);
      // MULTI-SCP GITM MUXIFICATION (MC-W1) — CALLING SCP's repo (origin-aware) · SCP-Sovereign fallback.
      const userCwd = resolveGitmTargetCwd(deck, originScpName);

      // PATH-PREFIX REPAIR (093 · E4) — opCwd may be a git SUBDIR (`<repo>/SCP`) while the git
      // ROOT is `<repo>`. `git show :N:` needs ROOT-relative (indexPath); FS read needs CWD-relative
      // (workPath). resolveConflictPaths derives both via `rev-parse --show-prefix` (idempotent —
      // a path already carrying the prefix is not doubled).
      const rp = resolveConflictPaths(path, userCwd);
      log('gitm.conflict.path-resolved', { given: rp.given, used: rp.indexPath, work: rp.workPath });

      // The three index stages (absent stage → '' · e.g. base absent for an add/add conflict).
      const oursExec = gitmExec(['show', `:2:${rp.indexPath}`], userCwd);
      const baseExec = gitmExec(['show', `:1:${rp.indexPath}`], userCwd);
      const theirsExec = gitmExec(['show', `:3:${rp.indexPath}`], userCwd);

      // The working file (marker-laden) — FailureNode on the read (returns '' + a note).
      let merged = '';
      let mergedOk = true;
      let mergedErr = '';
      try {
        merged = readFileSync(join(userCwd, rp.workPath), 'utf8');
      } catch (err: unknown) {
        mergedOk = false;
        mergedErr = err instanceof Error ? err.message : String(err);
      }

      // ok when at least one side loaded AND the working file read (the editor needs OUTPUT).
      const anySide = oursExec.ok || baseExec.ok || theirsExec.ok;
      const ok = mergedOk && anySide;
      const activeConflict: ActiveConflict | null = ok
        ? {
            path,
            ours: oursExec.ok ? oursExec.stdout : '',
            base: baseExec.ok ? baseExec.stdout : '',
            theirs: theirsExec.ok ? theirsExec.stdout : '',
            merged,
          }
        : null;
      const result: GitmActionResult = {
        action: 'gitmLoadConflict',
        ok,
        error: ok
          ? ''
          : !mergedOk
            ? mergedErr || 'working-file-read-failed'
            : 'no-conflict-stages',
        guardFired: false,
        reason: ok ? '' : 'conflict-load-failed',
        at: Date.now(),
      };
      bucket.push({ result, activeConflict });
      return action.strategy
        ? strategySuccess(action.strategy, strategyData_muxifyData(action.strategy, { ...result }))
        : muxiumConclude();
    }),
});
