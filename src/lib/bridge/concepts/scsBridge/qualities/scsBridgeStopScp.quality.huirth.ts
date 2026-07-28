/**
 * scsBridgeStopScp · SES · THE STOP RAIL · C632 (Helm Exit + Icon Redesign)
 *
 * BMTI Quality · MASN tool 'scp_stop'. The honest full-STOP of a named LIVE SCP
 * from the helm's new EXIT ability (the × now means exit, not multiply). Composes
 * three EXISTING, battle-tested legs — this Quality REUSES, it does not reinvent:
 *
 *   (1) WINDOW CLOSE — resolve the bound Electron windowId (lookupScpWindowId,
 *       Cascades/SCPs.json) and close it via the CSSP `close-by-id` verb
 *       (spawnCloseWindowById → bin/scs.js → cli-handler → closeWindowById →
 *       BrowserWindow.fromId(id).close()). The window's `win.on('closed')` handler
 *       (electronWindow.ts :323 → signalScpWindowClosed) is ALREADY wired to
 *       cascade the full stop: it dispatches scpLifecycleWindowClosed (surface →
 *       'pending') AND scpSpawnManagerKillRequested (SIGTERM the dedicated server
 *       + FSM dying→gone + re-seat). So closing the window IS the stop. We use the
 *       CROSS-PROCESS CSSP transport ONLY (exactly as scsBridgeFocusUrlWindow does
 *       for focus-by-id): the SCP window lives in a SEPARATE electron process (the
 *       proven no-handle mode · two-process topology), so the socket-relayed verb
 *       reaches the live electron-main that owns the window. This Quality runs in
 *       the dock-server manifold and does NOT import electron-main directly (no
 *       existing bridge quality does — pulling `electron` into this bundle would
 *       break the build). No-ops gracefully in-target when the window is absent.
 *
 *   (2) FSM + SERVER KILL (belt-and-suspenders / re-adopted-SCP path) — directly
 *       dispatch scpSpawnManagerKillRequested via the active bridge handle. This
 *       quality ALREADY carries the honest 4-branch fallback (handle → state-pid →
 *       port `lsof` → honest skip) AND drives scpLifecycleDyingToGone on
 *       settlement. It is the ONLY leg guaranteed to stop a RE-ADOPTED SCP (an SCP
 *       spawned by an EARLIER daemon whose child handle did not survive restart) —
 *       the window-close cascade needs a same-process handle it may not have; the
 *       kill quality's port fallback (spawnsByScp[scpName].port → lsof) closes
 *       that hole. Idempotent: a second SIGTERM against a dead process is an
 *       honest ESRCH-settle, not an error.
 *
 *   (3) STATUS 'pending' — write the PSSM shared status (setScpStatus, the SAME
 *       chainWrite mutex the launch/sweep paths use). The FSM re-seat already
 *       drives the surface, but the persisted status is the single source the
 *       boot-consistency sweep + the helm roster read; writing it here makes the
 *       stop durable across a bridge restart even if the row-derivation window
 *       missed the transition. Matches the SYNC MIRROR shape the template server's
 *       selfOwnedShutdown.model.ts writes on its own pre-exit 'pending'.
 *
 * HONEST LIMITATION (declared per the Muxistration Proof):
 *   - A RE-ADOPTED SCP has NO bound windowId in SCPs.json (the window belonged to
 *     the dead daemon) → the window-close leg (1) no-ops (no id to relay). The stop
 *     STILL lands: leg (2)'s port fallback SIGTERMs the listener and drives
 *     DyingToGone; leg (3) persists 'pending'. So the server dies and the surface
 *     rests even when no window can be closed — the honest degrade.
 *   - If NO handle AND NO state-pid AND NO resolvable port (the row is a pure
 *     stale registry entry with nothing listening), leg (2) honest-skips (nothing
 *     to SIGTERM, no death to settle); leg (3) still writes 'pending' so the row
 *     rests. This is correct: there is no live process to stop.
 *
 * Form-α (Method+Reducer). Reducer returns {} (no own-state mutation). Method
 * reads the registry, closes the window (CSSP cross-process transport), dispatches
 * the kill quality (Tier-2 self→scp→scpSpawnManager cast), writes persisted status.
 *
 * ACK-OD: the tool returns success immediately (the stop relay IS the Lambda; the
 * async settlement rides scpSpawnManagerKillRequested's own poll). RECOVERABLE —
 * Spawn re-boots the SCP; NO destructive worktree removal (that stays on the
 * typed-name DELETE round).
 *
 * TQNI satisfied · qualityName 'scsBridgeStopScp' literally byte-matches the
 * scsBridge concept emitter key (createSCPQualityManifold does
 * qualityEmitter[meta.qualityName] — a mismatch silently no-ops).
 *
 * Template: scsBridgeActivateScpSession.quality.huirth.ts (Cycle 150 BMTI form-α)
 * Citation: STRATIMUX-REFERENCE.md "🧩 Quality Creation Patterns & Best Practices" (advanced Method)
 * Citation: STRATIMUX-REFERENCE.md "🏗️ Muxified Concept Access Patterns" (Tier-2 self→scp→scpSpawnManager cast)
 * Citation: scpSpawnManagerKillRequested.quality.ts (Server-Close Cure · the 4-branch honest kill)
 * Citation: electronWindow.ts :323 signalScpWindowClosed (the window-close cascade)
 *
 * LAWS (C632): NO process driving · absolute-path briefs · Read-back verifies the
 * write · comment header states the laws · no commits/push in-flight.
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
  ScsBridgeStopScpPayload,
  ScsBridgeStopScp,
} from '../scsBridge.types';
import { readScpRegistry } from '../../../../scp/scpPersistence';
import { getActiveScsBridgeMuxiumHandle } from '../../../scsBridgeMuxium';
import { lookupScpWindowId, setScpStatus } from '../../../scpSessionRegistry';
import { spawnCloseWindowById } from '../../../electronWindowSpawn';
import { log } from '../../../debugLog';

export type { ScsBridgeStopScp };

export const scsBridgeStopScp = createQualityCardWithPayload<
  ScsBridgeState,
  ScsBridgeStopScpPayload
>({
  type: 'Scs Bridge Stop Scp',
  reducer: () => ({}),
  methodCreator: () =>
    createMethodWithConcepts(({ action }) => {
      const payload = selectPayload<ScsBridgeStopScpPayload>(action);
      const { scpName, callerSessionUlid } = payload;

      if (typeof scpName !== 'string' || scpName.length === 0) {
        console.error('[Scs Bridge] StopScp invalid scpName · skipping');
        return action.strategy ? strategySuccess(action.strategy) : muxiumConclude();
      }

      const handle = getActiveScsBridgeMuxiumHandle();
      if (handle === null) {
        console.error('[Scs Bridge] StopScp muxium handle null · action dropped:', scpName);
        return action.strategy ? strategySuccess(action.strategy) : muxiumConclude();
      }

      const userCwd = handle.muxium.deck.d.scsBridge.k.userCwd.select() ?? process.cwd();
      const registry = readScpRegistry(userCwd);
      const entry = registry.scps.find((s) => s.name === scpName);

      if (!entry) {
        console.error('[Scs Bridge] StopScp scpName not in SCPs.json:', scpName);
        return action.strategy ? strategySuccess(action.strategy) : muxiumConclude();
      }

      log('scsbridge.stop.dispatched', {
        scpName: entry.name,
        callerSessionUlid: callerSessionUlid ?? null,
      });

      // ── LEG 1 · WINDOW CLOSE (CSSP cross-process · the closed-event cascade) ──
      // The window's own `closed` handler drives surface→pending + SIGTERM + FSM;
      // we only need to CLOSE it. Resolve the bound windowId (SWFB registry) and
      // relay the CSSP `close-by-id` verb into the live electron-main that owns the
      // window (two-process topology). A re-adopted SCP has no bound windowId →
      // this leg no-ops; Leg 2's port fallback still lands the stop.
      void (async (): Promise<void> => {
        let windowId: number | null = null;
        try {
          windowId = await lookupScpWindowId(entry.name);
        } catch (err) {
          log('scsbridge.stop.windowid-lookup-error', {
            scpName: entry.name,
            error: err instanceof Error ? err.message : String(err),
          });
        }

        if (windowId !== null) {
          try {
            spawnCloseWindowById(windowId, {
              onError: (err) => {
                log('scsbridge.stop.close-by-id-spawn-error', {
                  scpName: entry.name,
                  id: windowId,
                  error: err.message,
                });
                console.error('[Scs Bridge] StopScp CSSP close-by-id spawn error:', err);
              },
            });
            log('scsbridge.stop.window-close-fired', { scpName: entry.name, id: windowId });
            console.log('[Scs Bridge] StopScp CSSP close-by-id fired:', entry.name, '· id=', windowId);
          } catch (err) {
            log('scsbridge.stop.close-by-id-spawn-throw', {
              scpName: entry.name,
              id: windowId,
              error: err instanceof Error ? err.message : String(err),
            });
          }
        } else {
          log('scsbridge.stop.no-window', { scpName: entry.name });
          console.log('[Scs Bridge] StopScp no bound windowId (re-adopted / never-painted):', entry.name);
        }
      })();

      // ── LEG 2 · FSM + SERVER KILL (the honest 4-branch fallback + DyingToGone) ──
      // Direct Tier-2 self→scp→scpSpawnManager cast. scpSpawnManagerKillRequested
      // owns handle→state-pid→port→skip resolution AND drives scpLifecycleDyingToGone
      // on settlement. THIS is the leg that stops a re-adopted SCP (no window). The
      // window-close cascade in Leg 1 ALSO fires this quality when a same-process
      // handle exists — the double-fire is idempotent (a marked-voluntary re-seat +
      // an ESRCH-settle on the second SIGTERM are both honest, non-erroring).
      try {
        handle.muxium.dispatch(
          handle.muxium.deck.d.scp.d.scpSpawnManager.e.scpSpawnManagerKillRequested({
            scpName: entry.name,
          }) as never,
        );
        log('scsbridge.stop.kill-dispatched', { scpName: entry.name });
      } catch (err) {
        console.error(
          '[Scs Bridge] StopScp kill dispatch error:',
          entry.name,
          err instanceof Error ? err.message : String(err),
        );
        log('scsbridge.stop.kill-dispatch-error', {
          scpName: entry.name,
          error: err instanceof Error ? err.message : String(err),
        });
      }

      // ── LEG 3 · PERSIST STATUS 'pending' (PSSM shared writer · durable rest) ──
      // Chained atomic write on the SAME mutex the launch/sweep paths use. Makes
      // the stop durable across a bridge restart even if the row-derivation window
      // missed the FSM transition. ACK-OD: fire-and-forget (the async chainWrite
      // settles independently; a failure logs but does not fail the stop ACK).
      void setScpStatus(entry.name, 'pending')
        .then(() => {
          log('scsbridge.stop.status-pending-written', { scpName: entry.name });
          console.log('[Scs Bridge] StopScp status pending written:', entry.name);
        })
        .catch((err) => {
          log('scsbridge.stop.status-pending-error', {
            scpName: entry.name,
            error: err instanceof Error ? err.message : String(err),
          });
          console.error('[Scs Bridge] StopScp status pending write error:', entry.name, err);
        });

      console.log('[Scs Bridge] StopScp composed the Stop Rail (window-close + kill + status pending):', scpName);

      return action.strategy ? strategySuccess(action.strategy) : muxiumConclude();
    }),
});
