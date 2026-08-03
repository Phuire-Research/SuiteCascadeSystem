/**
 * gitmResolvedManifestWatch Principle · SCP-UPD C289 · AUTO-APPLY-ON-MANIFEST
 *
 * The bridge-owned landing trigger for the Update circuit's Concluding Sequence.
 * The resolver session's OWN turn cannot invoke gitm_run_apply over /mcp — an in-turn
 * tools/call queues its strategy behind the turn's in-flight work on the single-threaded
 * muxium queue and the stored response starves (C289 ShotGun · H1 isProcessing refuted;
 * the root is queue serialization). So the manifest write IS the resolver's deliverable,
 * and THIS principle lands it: it arms its own chokidar watcher on
 * <userCwd>/Cascades/Bridge and, when a resolution manifest
 * (scp-update-resolved.<name>.json) arrives with pending === 0, dispatches
 * gitmScpUpdateApply({ scpName, autoSequence: true }) through the live muxium handle —
 * the same async-dispatch seam the SCP watcher arm uses.
 *
 * Guards (defense stays at the apply seam — this trigger only avoids churn):
 *   - pending !== 0 → no dispatch (the apply quality's HALT gate is the enforcement
 *     point; conference-carrying manifests self-block there regardless).
 *   - ignoreInitial: true → a stale manifest present at bridge boot never fires; only
 *     a fresh resolver write triggers.
 *   - per-file mtime dedup → a re-fired chokidar event on the same write is a no-op.
 *   - stage === 'applying' → an apply already in flight; skip.
 *
 * NOTE: the Base + Cascade dial watchers are PRUNED from this concept (SCP-Sovereign),
 * so no existing watcher covers <userCwd>/Cascades/Bridge — this arm is not redundant.
 *
 * Template: gitmWatchdial.principle.ts (plan + beat + FT-006 conclude) ·
 *   gitmScpWatcherArm.quality.ts (chokidar opts · live-handle dispatch seam).
 * Citation: ONYX-TIER-23 C289 (S6 escape topology · auto-apply-on-manifest).
 */

import type { PrincipleFunction } from 'stratimux';
import { watch, type FSWatcher } from 'chokidar';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { join, basename } from 'node:path';
import { log } from '../../../debugLog';
import { getActiveScsBridgeMuxiumHandle } from '../../../scsBridgeMuxium';
import { fenceWatchTargets } from '../../../watcherFence.model';
import type { GitmState } from '../gitm.types';
import type { GitmQualities } from '../gitm.concept';

// Module-scope arm guard + per-file mtime dedup (a re-fired event on the same write is a no-op).
let manifestWatcher: FSWatcher | null = null;
const lastActedMtime = new Map<string, number>();

const RESOLVED_PATTERN = /^scp-update-resolved\.(.+)\.json$/;

export const gitmResolvedManifestWatchPrinciple: PrincipleFunction<
  GitmQualities,
  void,
  GitmState
> = ({ k_, plan }) => {
  const onManifestEvent = (filePath: string): void => {
    const name = basename(filePath);
    const match = RESOLVED_PATTERN.exec(name);
    if (!match) return;
    const scpName = match[1];

    // mtime dedup — act once per distinct write.
    let mtimeMs = 0;
    try {
      mtimeMs = statSync(filePath).mtimeMs;
    } catch {
      return; // vanished between event and stat
    }
    if (lastActedMtime.get(name) === mtimeMs) return;

    // Churn guard — only dispatch when the manifest reads pending 0 (the apply quality's
    // HALT gate remains the enforcement point; this read just avoids a pointless beat).
    let pending = -1;
    try {
      const parsed = JSON.parse(readFileSync(filePath, 'utf8')) as { pending?: unknown };
      pending = typeof parsed.pending === 'number' ? parsed.pending : -1;
    } catch {
      log('gitm.update.manifest-watch.unparseable', { name });
      return;
    }
    if (pending !== 0) {
      log('gitm.update.manifest-watch.pending-held', { name, pending });
      return;
    }
    if (k_.updateStatus.select().stage === 'applying') {
      log('gitm.update.manifest-watch.apply-in-flight', { name });
      return;
    }

    log('gitm.update.manifest-watch.auto-apply', { scpName, mtimeMs });
    console.log('[Gitm ManifestWatch] pending-0 resolution manifest arrived · auto-apply:', scpName);
    const h = getActiveScsBridgeMuxiumHandle();
    if (h !== null) {
      // C310: stamp acted ONLY on a confirmed dispatch — a null handle must not consume the
      // manifest (no dispatch + no retry = the rail stuck at reviewing with no outcome).
      lastActedMtime.set(name, mtimeMs);
      h.muxium.dispatch(
        // RS.3 · SOVEREIGN TOOL CALLS — the manifest filename names the target; thread it as
        // originScpName so the apply routes to THAT SCP's repo + rail, not the active fallback.
        h.muxium.deck.d.gitm.e.gitmScpUpdateApply({
          scpName,
          originScpName: scpName,
          autoSequence: true,
        }) as never,
      );
    } else {
      log('gitm.update.manifest-watch.no-handle-retry', { scpName });
    }
  };

  const armPlan = plan('Gitm Resolved Manifest Watch Arm', ({ stage, conclude }) => [
    // Repeating arm stage — waits on the beat until userCwd is populated and the Bridge
    // dir exists, arms ONCE, then iterates to the FT-006 terminal.
    stage(
      ({ stagePlanner }) => {
        if (manifestWatcher !== null) {
          stagePlanner.conclude();
          return;
        }
        const userCwd = k_.userCwd.select();
        if (userCwd === '') return; // not yet populated · retry on the next beat
        const bridgeDir = join(userCwd, 'Cascades', 'Bridge');
        if (!existsSync(bridgeDir)) return; // no Bridge dir yet · retry on the next beat
        try {
          manifestWatcher = watch(fenceWatchTargets('gitmResolvedManifestWatch', [bridgeDir], userCwd), {
            ignored: [/(^|[/\\])\.git([/\\]|$)/],
            ignoreInitial: true,
            persistent: true,
            depth: 0,
            awaitWriteFinish: {
              stabilityThreshold: 300,
              pollInterval: 100,
            },
          });
        } catch (err) {
          console.error('[Gitm ManifestWatch] chokidar.watch failed:', err);
          stagePlanner.conclude();
          return;
        }
        manifestWatcher.on('error', (err: Error) => {
          console.error('[Gitm ManifestWatch] chokidar error:', err);
        });
        manifestWatcher.on('add', onManifestEvent);
        manifestWatcher.on('change', onManifestEvent);
        console.log('[Gitm ManifestWatch] armed on:', bridgeDir);
        log('gitm.update.manifest-watch.armed', { bridgeDir });
        stagePlanner.conclude();
      },
      { beat: 500 },
    ),
    conclude(),
  ]);
  void armPlan;
};
