/**
 * gitmScpUpdateRunDiff Quality · SCP-UPD D-U4.3 (Fork C) · NODE 2
 *
 * The second strategy node. Stamps `stage='diffing'` then runs the READ-ONLY 3-way
 * diff script (`scripts/scp-3way-diff.sh`, D-U2) via `execFileSync` (bounded sync on
 * the action beat · gitmExec discipline). The script self-polices read-only on the
 * SCP working tree (exit 6 = read-only breach).
 *
 *   args: bash scp-3way-diff.sh <activeScpDir> <templatePath> <scpName>
 *     activeScpDir = the SCP RED-repo root (SCP-Sovereign · holds .git + base)
 *     templatePath = the retained clone's template (carried from NODE 1 strategy data)
 *     scpName      = the output filename key (state's scpName · basename fallback)
 *
 * On NON-ZERO exit the node routes to the EXISTING errorCode/errorMessage relay and
 * stamps stage='error' + stageError (exit 4 = HALT base-lineage · exit 6 = read-only
 * breach · others = diff-failed), and `strategyFailed` terminates the chain.
 *
 * The diff JSON is written to Cascades/Bridge/scp-update-diff.<name>.json (the script
 * uses process.cwd()/Cascades/Bridge). The SCP_UPD_CLONE_MODE env carries the clone
 * mode (from NODE 1) into the diff JSON provenance.
 *
 * Template: gitmExec.model.ts:28-45 (execFileSync discipline · catch → ok/stderr) ·
 *   gitmPull.quality.ts (bucket + partial reducer + strategySuccess/Failed branch).
 * Citation: SCP-UPD-D-U4-GND-ACTIONSTRATEGY.md §3 (NODE 2) + §4 (sync op pattern) +
 *   SCP-UPD-D-U4-WGB.md §D-U4.3 Error path (exit 4/6 → errorCode relay · REUSE).
 */

import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join, basename, dirname } from 'node:path';
import { log } from '../../../debugLog';
import {
  createQualityCardWithPayload,
  createMethodWithConcepts,
  muxiumConclude,
  strategySuccess,
  strategyFailed,
  strategyData_select,
  strategyData_muxifyData,
  selectPayload,
  type Concept,
} from 'stratimux';
import type { GitmState, UpdateStatusShape } from '../gitm.types';
import { stampSliceUpdateStatus } from '../model/gitmSliceStore.model';
import type {
  GitmScpUpdateRunDiffPayload,
  GitmScpUpdateRunDiff,
  GitmScpUpdateCloneStrategyData,
} from './types';

export type { GitmScpUpdateRunDiff };

type GitmSelfDeck = {
  gitm: Concept<GitmState, Record<string, unknown>>;
};

type DiffBucketItem =
  | { ok: true; targetDir: string }
  | { ok: false; errorCode: string; errorMessage: string; targetDir: string };
const bucket: DiffBucketItem[] = [];

// Map the script's exit code → a canonical errorCode for the branch-flow relay.
function classifyDiffExit(code: number): string {
  if (code === 4) return 'update-diff-halt'; // base lineage ambiguous (HALT guard)
  if (code === 6) return 'update-readonly-breach'; // SCP repo status changed (invariant broken)
  if (code === 3) return 'update-no-red-repo'; // not a git repo / template missing
  if (code === 2) return 'update-diff-usage'; // missing arg / missing tool (git|jq)
  return 'update-diff-failed';
}

export const gitmScpUpdateRunDiff = createQualityCardWithPayload<
  GitmState,
  GitmScpUpdateRunDiffPayload,
  GitmSelfDeck
>({
  type: 'Gitm Scp Update Run Diff',
  reducer: (state) => {
    const item = bucket.pop();
    if (!item) {
      // Stamp 'diffing' even before the exec result lands (the method has fired;
      // the bucket fills on the same beat — defensive empty-pop keeps the rail moving).
      const updateStatus: UpdateStatusShape = { ...state.updateStatus, stage: 'diffing' };
      return { updateStatus };
    }
    // RS.4 · THE PER-SCP RAIL — stamp the TARGET's slice; flat is the ACTIVE projection.
    const stamp = item.ok
      ? { stage: 'diffing' as const }
      : { stage: 'error' as const, stageError: item.errorMessage };
    stampSliceUpdateStatus(item.targetDir, stamp);
    if (item.targetDir !== '' && item.targetDir !== state.activeScpDir) {
      return { updateRailTick: state.updateRailTick + 1 };
    }
    if (!item.ok) {
      const updateStatus: UpdateStatusShape = {
        ...state.updateStatus,
        stage: 'error',
        stageError: item.errorMessage,
      };
      return { updateStatus, errorCode: item.errorCode, errorMessage: item.errorMessage };
    }
    const updateStatus: UpdateStatusShape = { ...state.updateStatus, stage: 'diffing' };
    return { updateStatus };
  },
  methodCreator: () =>
    createMethodWithConcepts(({ action, deck }) => {
      const activeScpDir = deck.gitm.k.activeScpDir.select();
      const userCwd = deck.gitm.k.userCwd.select();
      // RS.4 — identity rides the node payload (Begin resolved once); state fallbacks
      // remain for a payload-less legacy dispatch only.
      const payload = selectPayload<GitmScpUpdateRunDiffPayload>(action);
      const payloadTarget = payload?.targetScpDir ?? '';
      // RED-repo root resolution (Cycle 282 · the 077 exit-3 root): the target dir is the SCP
      // SUBDIR (Cascades/scps/<name>/SCP); the .git lives ONE UP at Cascades/scps/<name>/ —
      // the script's documented <scp-repo-root>. Walk up (bounded 2) to the dir holding .git.
      const candidate =
        payloadTarget !== '' ? payloadTarget : activeScpDir !== '' ? activeScpDir : userCwd;
      const scpRepoRoot = existsSync(join(candidate, '.git'))
        ? candidate
        : existsSync(join(dirname(candidate), '.git'))
          ? dirname(candidate)
          : candidate;
      const stateScpName = deck.gitm.k.updateStatus.select().scpName;
      const scpName =
        payload?.scpName && payload.scpName !== ''
          ? payload.scpName
          : stateScpName !== ''
            ? stateScpName
            : basename(scpRepoRoot);

      const cloneData = action.strategy
        ? strategyData_select<GitmScpUpdateCloneStrategyData>(action.strategy)
        : undefined;
      const templatePath = cloneData?.templatePath ?? '';
      const cloneMode = cloneData?.cloneMode ?? '';

      if (templatePath === '') {
        const errorMessage = 'update diff: no template path from clone node';
        bucket.push({
          ok: false,
          errorCode: 'update-diff-no-template',
          errorMessage,
          targetDir: candidate,
        });
        return action.strategy ? strategyFailed(action.strategy) : muxiumConclude();
      }

      // Script resolution (Cycle 281 · the 077 install root): userCwd/scripts/ only exists in
      // dev:self — an INSTALLED bridge's userCwd is the install dir (no scripts/). The retained
      // clone NODE 1 just refreshed IS the SCS source and ships the script; derive its root
      // from templatePath (<cloneRoot>/Cascades/scps/template/SCP · updateCloneManager
      // templatePathFor). Dev-first so a repo-local script edit still wins in dev:self.
      const devScriptPath = join(userCwd, 'scripts', 'scp-3way-diff.sh');
      const cloneScriptPath = join(templatePath, '..', '..', '..', '..', 'scripts', 'scp-3way-diff.sh');
      const scriptPath = existsSync(devScriptPath) ? devScriptPath : cloneScriptPath;
      log('gitm.update.run-diff.entry', { scpRepoRoot, scpName, scriptPath });
      try {
        execFileSync('bash', [scriptPath, scpRepoRoot, templatePath, scpName], {
          cwd: userCwd,
          encoding: 'utf8',
          stdio: ['pipe', 'pipe', 'pipe'],
          env: { ...process.env, SCP_UPD_CLONE_MODE: cloneMode },
        });
        bucket.push({ ok: true, targetDir: candidate });
        return action.strategy
          ? strategySuccess(
              action.strategy,
              strategyData_muxifyData(action.strategy, { scpName, templatePath }),
            )
          : muxiumConclude();
      } catch (err: unknown) {
        const e = err as { status?: number; stderr?: string; message?: string };
        const code = typeof e.status === 'number' ? e.status : 1;
        const errorCode = classifyDiffExit(code);
        const errorMessage =
          (typeof e.stderr === 'string' && e.stderr.trim() !== ''
            ? e.stderr.trim()
            : typeof e.message === 'string'
              ? e.message
              : String(err)) || 'update diff failed';
        log('gitm.update.run-diff.failed', { errorCode, errorMessage: errorMessage.slice(0, 200) });
        bucket.push({ ok: false, errorCode, errorMessage, targetDir: candidate });
        return action.strategy ? strategyFailed(action.strategy) : muxiumConclude();
      }
    }),
});
