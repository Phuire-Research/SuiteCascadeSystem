/**
 * scsBridgeLaunchScpRuntime · SAWSR-D2.A · Cycle 150
 *
 * BMTI Quality #2 · MASN tool 'scp_menu_launch_runtime'. Mirrors TUI [L]
 * hotkey path — pure launch via scpSpawnManagerSpawnRequested (NO overlay
 * show · subset of #1 Activate). Parallels existing scsBridgeLaunchScp POC
 * with extended payload (callerSessionUlid for SCSER backward Arc).
 *
 * Distinguishing from scsBridgeLaunchScp: MASN-aligned naming + caller-
 * session payload extension. Both Qualities ultimately dispatch
 * scpSpawnManagerSpawnRequested · the legacy launch_scp tool remains
 * registered as POC while MASN namespace surfaces the aligned form.
 *
 * Form-α (Method+Reducer). Internal idempotency via launchScpRuntime
 * Gate 1+2 doctrine downstream (ALHOC M131 internal-conditionals).
 *
 * Template: scsBridgeLaunchScp.quality.huirth.ts (Cycle 140 TQDR pattern)
 * Citation: Stratimuxian Scholar S10 Quality Creation Pattern 5
 * Citation: ONYX-TIER-15.md Cycle 146 [L] hotkey HotWire (TUI L launch path)
 */

import {
  createQualityCardWithPayload,
  createMethodWithConcepts,
  selectPayload,
  muxiumConclude,
  strategySuccess,
} from 'stratimux';
import type {
  ScsBridgeState,
  ScsBridgeLaunchScpRuntimePayload,
  ScsBridgeLaunchScpRuntime,
} from '../scsBridge.types';
import type { ScpSpawnManagerSpawnRequestedPayload } from '../../scpSpawnManager/qualities/types';
import { readScpRegistry } from '../../../../scp/scpPersistence';
import { getActiveScsBridgeMuxiumHandle } from '../../../scsBridgeMuxium';
import { buildBridgeSpawnDescriptor } from '../../../scpSpawn.model';
import { log } from '../../../debugLog';

export type { ScsBridgeLaunchScpRuntime };

const generateRequestUlid = (): string => {
  const ts = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 10);
  return `boot_${ts}_${rand}`;
};

const generateSessionId = (): string => {
  const ts = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 10);
  return `sess_${ts}_${rand}`;
};

export const scsBridgeLaunchScpRuntime = createQualityCardWithPayload<
  ScsBridgeState,
  ScsBridgeLaunchScpRuntimePayload
>({
  type: 'Scs Bridge Launch Scp Runtime',
  reducer: () => ({}),
  methodCreator: () =>
    createMethodWithConcepts(({ action }) => {
      const payload = selectPayload<ScsBridgeLaunchScpRuntimePayload>(action);
      const { scpName, callerSessionUlid } = payload;

      if (typeof scpName !== 'string' || scpName.length === 0) {
        console.error('[Scs Bridge] LaunchScpRuntime invalid scpName · skipping');
        return action.strategy ? strategySuccess(action.strategy) : muxiumConclude();
      }

      const handle = getActiveScsBridgeMuxiumHandle();
      if (handle === null) {
        console.error('[Scs Bridge] LaunchScpRuntime muxium handle null · action dropped:', scpName);
        return action.strategy ? strategySuccess(action.strategy) : muxiumConclude();
      }

      const userCwd = handle.muxium.deck.d.scsBridge.k.userCwd.select() ?? process.cwd();
      const registry = readScpRegistry(userCwd);
      const entry = registry.scps.find((s) => s.name === scpName);

      if (!entry) {
        console.error('[Scs Bridge] LaunchScpRuntime scpName not in SCPs.json:', scpName);
        return action.strategy ? strategySuccess(action.strategy) : muxiumConclude();
      }

      if (typeof entry.boundBridgePort !== 'number' || entry.boundBridgePort <= 0) {
        console.error('[Scs Bridge] LaunchScpRuntime missing boundBridgePort for:', scpName);
        return action.strategy ? strategySuccess(action.strategy) : muxiumConclude();
      }

      const descriptor = buildBridgeSpawnDescriptor({
        scpName: entry.name,
        installPath: entry.path,
        port: entry.boundBridgePort,
        parentEnv: process.env as Record<string, string>,
      });

      const spawnPayload: ScpSpawnManagerSpawnRequestedPayload = {
        scpName: entry.name,
        scpPath: entry.path,
        command: descriptor.command,
        args: descriptor.args,
        port: entry.boundBridgePort,
        sessionId: generateSessionId(),
        bootRequestUlid: generateRequestUlid(),
        requestedAt: Date.now(),
      };

      log('scsbridge.launch-runtime.dispatched', {
        scpName: entry.name,
        port: entry.boundBridgePort,
        bootRequestUlid: spawnPayload.bootRequestUlid,
        callerSessionUlid: callerSessionUlid ?? null,
      });

      try {
        handle.muxium.dispatch(
          handle.muxium.deck.d.scp.d.scpSpawnManager.e.scpSpawnManagerSpawnRequested(
            spawnPayload,
          ) as never,
        );
      } catch (err) {
        console.error(
          '[Scs Bridge] LaunchScpRuntime dispatch error:',
          scpName,
          err instanceof Error ? err.message : String(err),
        );
      }

      // GITM SCP-SOVEREIGN — the BIND SEAM (parallel launch path). Set activeScpDir = entry.path
      // (the SCP PACKAGE dir) THEN re-arm the path-aware SCP watcher.
      try {
        handle.muxium.dispatch(
          handle.muxium.deck.d.gitm.e.gitmSetActiveScpDir({ activeScpDir: entry.path }) as never,
        );
        handle.muxium.dispatch(handle.muxium.deck.d.gitm.e.gitmScpWatcherArm({}) as never);
        // MULTI-SCP GITM MUXIFICATION (MC-W2) — arm THIS SCP's OWN per-SCP watcher pair in the registry.
        handle.muxium.dispatch(
          handle.muxium.deck.d.gitm.e.gitmWatcherArmForScp({ scpDir: entry.path }) as never,
        );
        handle.muxium.dispatch(
          handle.muxium.deck.d.gitm.e.gitmRecountLocation({ location: 'scp', clearError: false }) as never,
        );
        // GITM A↔B Auto-Induction ("Move with C") — prime A + register A + fork B + land on B,
        // ONCE per cycle (self-guarded · idempotent · re-armed by the merged→idle reset).
        handle.muxium.dispatch(handle.muxium.deck.d.gitm.e.gitmAutoInductAB({}) as never);
        // C645 · THE BIND-SEAM STARC (the composition contract: the bind seam lands its OWN first live
        // roster) — dispatch gitmSetStatus for THIS SCP (originScpName=entry.path → resolveGitmTargetCwd
        // targets its own repo) so a live STARC enumeration lands on bind, NOT only on a later .git event.
        // Without it the freshly-bound slice is born branches:[] and GITEP fans the empty roster out
        // verbatim (the phantom partial-roster). Mirrors the MC-W2 per-SCP watcher dispatch idiom.
        handle.muxium.dispatch(
          handle.muxium.deck.d.gitm.e.gitmSetStatus({ originScpName: entry.path } as never) as never,
        );
      } catch (err) {
        console.error(
          '[Scs Bridge] LaunchScpRuntime gitm activeScpDir bind error:',
          scpName,
          err instanceof Error ? err.message : String(err),
        );
      }

      console.log('[Scs Bridge] LaunchScpRuntime dispatched scpSpawnManagerSpawnRequested:', scpName);

      return action.strategy ? strategySuccess(action.strategy) : muxiumConclude();
    }),
});
