/**
 * scsBridgeSpawnNewScpSession · SAWSR-D2.A · Cycle 150
 *
 * BMTI Quality #3 · MASN tool 'scp_menu_spawn_new_session'. Mirrors TUI
 * [N] keypress from PSM filtered context (Cycle 149 NSESF path) — spawns
 * a NEW Claude Code session bound to the given scpName via
 * manager.createSession({ scpName }) + launchInformative.
 *
 * Imperative work in Method (parallels how scsBridgeLaunchScp imperatively
 * reads registry · this Quality imperatively invokes the createSession
 * + launchInformative pipeline). Method dispatches no Stratimux action
 * downstream — the session lifecycle is managed by Bridge file watcher
 * + SessionStart hook (already wired · NSESF Cycle 149).
 *
 * Form-α (Method+Reducer). Reducer returns {} · no own-state mutation.
 * Async createSession/launchInformative fire-and-forget via void promise.
 *
 * Template: scsBridgeLaunchScp.quality.huirth.ts (form-α pattern)
 * Citation: Stratimuxian Scholar S10 Quality Creation Pattern 5 (advanced Method)
 * Citation: ONYX-TIER-15.md Cycle 149 NSESF (createSession scpName propagation)
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
  ScsBridgeSpawnNewScpSessionPayload,
  ScsBridgeSpawnNewScpSession,
} from '../scsBridge.types';
import { createSession } from '../../../manager';
import { spawnElectronSessionForUlid } from '../../../electronSessionSpawn';
import { setSessionModel } from '../../../registry';
import { isAvailableModel } from '../../../../../shared/modelCatalog.model';
import { log } from '../../../debugLog';

export type { ScsBridgeSpawnNewScpSession };

export const scsBridgeSpawnNewScpSession = createQualityCardWithPayload<
  ScsBridgeState,
  ScsBridgeSpawnNewScpSessionPayload
>({
  type: 'Scs Bridge Spawn New Scp Session',
  reducer: () => ({}),
  methodCreator: () =>
    createMethodWithConcepts(({ action }) => {
      const payload = selectPayload<ScsBridgeSpawnNewScpSessionPayload>(action);
      const { scpName, callerSessionUlid } = payload;
      // MD-9 · D-MC-1 · Per-Instance Model Control · read + validate the optional spawn-time
      // model (warn + global-default fallback on a bad value · spawn NEVER breaks).
      const requestedModel = payload.model;
      const modelToRecord =
        typeof requestedModel === 'string' && isAvailableModel(requestedModel)
          ? requestedModel
          : undefined;
      if (requestedModel !== undefined && modelToRecord === undefined) {
        console.warn(
          '[SCS-Bridge SpawnQuality] invalid model · falling back to global default · model=',
          requestedModel,
        );
      }

      // TTVS · accept null as valid trigger (spawn without SCP binding · Template SCP default).
      // Cite: D3D-HOTFIX-2-R4-GREEN-AUDIT.md Angle 6 · D3D-HOTFIX-2-R7-FUCHSIA-CLINICAL.md §B.
      if (scpName !== null && (typeof scpName !== 'string' || scpName.length === 0)) {
        console.warn('[SCS-Bridge SpawnQuality] Rejected · invalid scpName=', scpName);
        return action.strategy ? strategySuccess(action.strategy) : muxiumConclude();
      }
      console.log('[SCS-Bridge SpawnQuality] Invoked · scpName=', scpName, '· (null=Template-SCP-default)');

      log('scsbridge.spawn-new.dispatched', {
        scpName,
        callerSessionUlid: callerSessionUlid ?? null,
      });

      // Imperative async — fire-and-forget per scsBridgeLaunchScp pattern.
      // createSession writes registry + spawn-settings (with SCS_BRIDGE_SCP_NAME
      // env prefix per NSESF/M22 CHCS) BEFORE addSession exposes the entry.
      //
      // D2 Electron transition: launchInformative (Terminal.app via osTerminal)
      // replaced by spawnElectronSessionForUlid (CSSP `open-session` verb to
      // Electron main). createSession path PRESERVED — still writes sessions.json
      // entry + spawn-settings.json before Electron spawns the PTY. SessionStart
      // hook fires inside claude (when user invokes it in the login-shell PTY)
      // → updateSessionLiveIdentity → registry write → PSM filter accepts.
      void (async (): Promise<void> => {
        try {
          const { sessionId } = await createSession({ scpName: scpName ?? undefined });
          // MD-9 · D-MC-1 · record the per-instance model on the now-existing entry BEFORE spawn
          // so the detached open-session resolver reads entry.model. No-op on undefined/invalid.
          await setSessionModel(sessionId, modelToRecord);
          spawnElectronSessionForUlid(sessionId);
          log('scsbridge.spawn-new.launched', { scpName, sessionId, transport: 'electron' });
          console.log('[SCS-Bridge SpawnQuality] Spawn dispatched · sessionId=', sessionId, '· scpName=', scpName);
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          log('scsbridge.spawn-new.error', { scpName, message });
          console.error('[Scs Bridge] SpawnNewScpSession error:', scpName, message);
        }
      })();

      console.log('[Scs Bridge] SpawnNewScpSession dispatched createSession+launchInformative:', scpName);

      return action.strategy ? strategySuccess(action.strategy) : muxiumConclude();
    }),
});
