/**
 * scsBridgeActivateScpSession · SAWSR-D2.A · Cycle 150
 *
 * BMTI Quality #1 · MASN tool 'scp_menu_activate_session_management'.
 * Composes ALHOC double-bind from Bridge MCP side: overlay-show +
 * launch (via scpSpawnManagerSpawnRequested). Mirrors the TUI Enter-on-
 * SCP-entry sub-menu path that landed in Cycle 148 ALHOC M130 — same
 * downstream composition, originated from agent MCP call instead of
 * user keypress. callerSessionUlid carried for SCSER backward Arc
 * (D2.B · agent session binding back to SCP scope).
 *
 * Form-α (Method+Reducer). Reducer returns {} (no own-state mutation).
 * Method imperatively reads registry, builds spawn payload, and dispatches
 * BOTH overlay-show AND spawn-requested via Tier-2 deck cast.
 *
 * Template: scsBridgeLaunchScp.quality.huirth.ts (Cycle 140 TQDR pattern)
 * Citation: Stratimuxian Scholar S10 Quality Creation Pattern 5 (advanced Method)
 * Citation: Stratimuxian Scholar S8 Muxified Concept Access (Tier-2)
 * Citation: ONYX-TIER-15.md Cycle 148 ALHOC M130 + M131 (single-source-of-truth composition)
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
  ScsBridgeActivateScpSessionPayload,
  ScsBridgeActivateScpSession,
} from '../scsBridge.types';
import type { ScpSpawnManagerSpawnRequestedPayload } from '../../scpSpawnManager/qualities/types';
import { readScpRegistry } from '../../../../scp/scpPersistence';
import { getActiveScsBridgeMuxiumHandle } from '../../../scsBridgeMuxium';
import { buildBridgeSpawnDescriptor } from '../../../scpSpawn.model';
import { log } from '../../../debugLog';

export type { ScsBridgeActivateScpSession };

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

export const scsBridgeActivateScpSession = createQualityCardWithPayload<
  ScsBridgeState,
  ScsBridgeActivateScpSessionPayload
>({
  type: 'Scs Bridge Activate Scp Session',
  reducer: (_state, action) => {
    // MASF · MCP-Active-Scp-Filter setter · SAWSR-D2.A Rung 1 Cycle 152
    // Reducer-side state mutation that the M17 closure in animatedTui subscribes
    // to. MTAM (MCP-Tui-Activate-Mirror) syncs this to menuState.activeScpFilter
    // → TUI PSM surfaces Active Display for the activated SCP · matching
    // keypress-driven activate path semantic (Cycle 148 ALHOC M130).
    // Stratimuxian Scholar S12 shortest-path partial return.
    const payload = selectPayload<ScsBridgeActivateScpSessionPayload>(action);
    return { activeScpFromMcp: payload.scpName, activeScpFromMcpAt: Date.now() };
  },
  methodCreator: () =>
    createMethodWithConcepts(({ action }) => {
      const payload = selectPayload<ScsBridgeActivateScpSessionPayload>(action);
      const { scpName, callerSessionUlid } = payload;

      if (typeof scpName !== 'string' || scpName.length === 0) {
        console.error('[Scs Bridge] ActivateScpSession invalid scpName · skipping');
        return action.strategy ? strategySuccess(action.strategy) : muxiumConclude();
      }

      const handle = getActiveScsBridgeMuxiumHandle();
      if (handle === null) {
        console.error('[Scs Bridge] ActivateScpSession muxium handle null · action dropped:', scpName);
        return action.strategy ? strategySuccess(action.strategy) : muxiumConclude();
      }

      const userCwd = handle.muxium.deck.d.scsBridge.k.userCwd.select() ?? process.cwd();
      const registry = readScpRegistry(userCwd);
      const entry = registry.scps.find((s) => s.name === scpName);

      if (!entry) {
        console.error('[Scs Bridge] ActivateScpSession scpName not in SCPs.json:', scpName);
        return action.strategy ? strategySuccess(action.strategy) : muxiumConclude();
      }

      if (typeof entry.boundBridgePort !== 'number' || entry.boundBridgePort <= 0) {
        console.error('[Scs Bridge] ActivateScpSession missing boundBridgePort for:', scpName);
        return action.strategy ? strategySuccess(action.strategy) : muxiumConclude();
      }

      log('scsbridge.activate.dispatched', {
        scpName: entry.name,
        port: entry.boundBridgePort,
        callerSessionUlid: callerSessionUlid ?? null,
      });

      // ALHOC double-bind composition · two dispatches:
      //   (1) scpBootOverlayShow — visual feedback for activation
      //   (2) scpSpawnManagerSpawnRequested — launch composition
      // Same pair the TUI fires from case 'scp-menu-activate' (post-Cycle 148 R7).
      try {
        const overlayDeck = handle.muxium.deck as unknown as {
          d: {
            scp: {
              d: {
                scpBootOverlay: {
                  e: { scpBootOverlayShow: (p: { scpName: string }) => unknown };
                };
              };
            };
          };
        };
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (handle.muxium as any).dispatch(
          // RA-3b — spawn intent: reset the ring buffer (the stale-console fix).
          overlayDeck.d.scp.d.scpBootOverlay.e.scpBootOverlayShow({ scpName: entry.name, freshBoot: true } as never),
        );
      } catch (err) {
        console.error(
          '[Scs Bridge] ActivateScpSession overlay-show error:',
          err instanceof Error ? err.message : String(err),
        );
      }

      // SCSER env propagation (CSEP) · SAWSR-D2.B Cycle 153
      // Resolve Bridge MCP endpoint from active scsBridge muxium handle so SCP
      // can callback. dockServerPort lives on the server concept (Tier-1 sibling).
      let mcpEndpoint: string | undefined = undefined;
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const serverDeck = handle.muxium.deck as unknown as { d: { server: { k: { port: { select: () => number | null } } } } };
        const dockPort = serverDeck.d.server.k.port.select();
        if (typeof dockPort === 'number' && dockPort > 0) {
          mcpEndpoint = `http://127.0.0.1:${dockPort}/mcp`;
        }
      } catch {
        // mcpEndpoint stays undefined · CSEP omits env injection · SCP startup binding skips
      }

      log('scsbridge.activate.csep.env-prepared', {
        scpName: entry.name,
        callerSessionUlid: callerSessionUlid ?? null,
        mcpEndpoint: mcpEndpoint ?? null,
      });

      const descriptor = buildBridgeSpawnDescriptor({
        scpName: entry.name,
        installPath: entry.path,
        port: entry.boundBridgePort,
        parentEnv: process.env as Record<string, string>,
        callerSessionUlid,
        mcpEndpoint,
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
        // CSEP · pass through to scpSpawnManagerSpawnRequested so its internal
        // descriptor rebuild includes our env vars · without this the env is dropped
        callerSessionUlid,
        mcpEndpoint,
      };

      try {
        handle.muxium.dispatch(
          handle.muxium.deck.d.scp.d.scpSpawnManager.e.scpSpawnManagerSpawnRequested(
            spawnPayload,
          ) as never,
        );
      } catch (err) {
        console.error(
          '[Scs Bridge] ActivateScpSession spawn dispatch error:',
          scpName,
          err instanceof Error ? err.message : String(err),
        );
      }

      // GITM SCP-SOVEREIGN — the BIND SEAM (activate path · the active SCP is now THIS one). Set
      // activeScpDir = entry.path (the SCP PACKAGE dir) THEN re-arm the path-aware SCP watcher.
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
          '[Scs Bridge] ActivateScpSession gitm activeScpDir bind error:',
          scpName,
          err instanceof Error ? err.message : String(err),
        );
      }

      console.log('[Scs Bridge] ActivateScpSession composed ALHOC double-bind:', scpName);

      return action.strategy ? strategySuccess(action.strategy) : muxiumConclude();
    }),
});
