/**
 * gitmRunCliUpdate Quality · THE VERSIONING MUXAMETER · npm install -g scs-bridge
 *
 * The CLI self-update the Update page fires when the counter verdict is 'cli' anor 'both'
 * (remote.cli > installed.cli). The install runs AUTOMATICALLY; the RESTART stays in the
 * user's hands (the Conference law): on success the reducer stamps cliUpdate
 * 'restart-required' with the honest derivation — the FRESH re-read of the grandparent
 * package.json (the on-disk NEW release) vs the RUNNING process's cached version. The
 * page renders the RESTART REQUIRED state from gitm.json; no self-relaunch exists here.
 *
 * The execFileSync-Npm-Mirror: the same sync-exec-on-beat discipline every gitm quality
 * rides (gitmExec's execFileSync · setCurrentOp/clearCurrentOp progress latch), targeting
 * `npm` instead of `git`. The install can run tens of seconds — the progress strip carries
 * it (the MD-E visibility law: never-silent is met by VISIBILITY).
 *
 * Template: gitmPull.quality.ts (bucket + catch classification) · gitmScpUpdateApply
 * (the entry-beat defensive stamp — here it stamps 'installing').
 */

import {
  createQualityCardWithPayload,
  createMethodWithConcepts,
  muxiumConclude,
  strategySuccess,
  strategyData_muxifyData,
  type Concept,
} from 'stratimux';
import { execFileSync } from 'node:child_process';
import type { GitmState, GitmCliUpdateState } from '../gitm.types';
import type { GitmRunCliUpdatePayload, GitmRunCliUpdate, GitmActionResult } from './types';
import { setCurrentOp, clearCurrentOp } from '../model/gitmExec.model';
import { getBridgeVersion, getBridgeVersionFresh } from '../../../bridgeVersion';
import { log } from '../../../debugLog';

export type { GitmRunCliUpdate };

interface CliUpdateBucketItem {
  result: GitmActionResult;
  cliUpdate: GitmCliUpdateState;
}

const bucket: CliUpdateBucketItem[] = [];

type GitmSelfDeck = {
  gitm: Concept<GitmState, Record<string, unknown>>;
};

export const gitmRunCliUpdate = createQualityCardWithPayload<
  GitmState,
  GitmRunCliUpdatePayload,
  GitmSelfDeck
>({
  type: 'Gitm Run Cli Update',
  reducer: (state) => {
    const item = bucket.pop();
    if (!item) {
      // The entry-beat defensive stamp (the apply precedent) — the rail reads 'installing'
      // while the method's sync install runs.
      return {
        cliUpdate: {
          status: 'installing',
          installedOnDisk: '',
          runningVersion: getBridgeVersion(),
          error: '',
          at: Date.now(),
        },
      };
    }
    return { cliUpdate: item.cliUpdate, lastActionResult: item.result };
  },
  methodCreator: () =>
    createMethodWithConcepts(({ action }) => {
      const runningVersion = getBridgeVersion();
      setCurrentOp({
        message: 'Updating the SCS-Bridge CLI…',
        command: 'npm install -g scs-bridge',
      });
      let ok = true;
      let error = '';
      try {
        // WITH SCRIPTS (the install-scripts law — node-pty's darwin-arm64 build) · 4-minute
        // ceiling · the sync discipline: the progress latch is the visibility.
        execFileSync('npm', ['install', '-g', 'scs-bridge'], {
          encoding: 'utf8',
          timeout: 240_000,
        });
      } catch (err: unknown) {
        ok = false;
        error = err instanceof Error ? err.message.slice(0, 300) : String(err);
      }
      clearCurrentOp();

      // THE HONEST RESTART DERIVATION — the fresh on-disk read vs the running process.
      const installedOnDisk = ok ? getBridgeVersionFresh() : '';
      const restartRequired = ok && installedOnDisk !== '' && installedOnDisk !== runningVersion;
      const cliUpdate: GitmCliUpdateState = {
        status: ok ? (restartRequired ? 'restart-required' : 'idle') : 'failed',
        installedOnDisk,
        runningVersion,
        error,
        at: Date.now(),
      };
      const result: GitmActionResult = {
        action: 'gitmRunCliUpdate',
        ok,
        error: ok ? '' : 'cli-update-failed',
        guardFired: false,
        reason: '',
        at: Date.now(),
      };
      log('gitm.cli-update.complete', {
        ok,
        runningVersion,
        installedOnDisk,
        restartRequired,
        error: error.slice(0, 120),
      });
      bucket.push({ result, cliUpdate });
      return action.strategy
        ? strategySuccess(action.strategy, strategyData_muxifyData(action.strategy, { ...result }))
        : muxiumConclude();
    }),
});
