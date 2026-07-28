/**
 * scsBridgeLaunchScp · Cycle 140 · TQDR + MSCM Implementation
 *
 * Thin Method+Reducer Quality (form-α). Mediates the MCP `launch_scp` tool input
 * shape ({scpName}) into the full ScpSpawnManagerSpawnRequestedPayload (8 fields)
 * by reading Cascades/SCPs.json for scpPath/port and synthesizing sessionId,
 * bootRequestUlid, requestedAt. Dispatches scpSpawnManagerSpawnRequested via
 * the active scsBridge muxium handle (canonical cross-concept Tier-2 path
 * `deck.scp.d.scpSpawnManager.e.scpSpawnManagerSpawnRequested`).
 *
 * TQNI satisfied · qualityName 'scsBridgeLaunchScp' literally matches the
 * scsBridge concept emitter key. conceptName remains 'scsBridge' (no risky
 * Tier-2 selectStratiDECK call from the Quality manifold).
 *
 * Reducer · returns {} (no own-state mutation). Method does the real work.
 *
 * Citation: STRATIMUX-REFERENCE.md "🧩 Quality Creation Patterns & Best Practices"
 * Citation: SUITE-3-YELLOW-CYCLE-140-MSCM-TQDR-BLUEPRINT.md §2 + §4.1 + §7 Step 3
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
  ScsBridgeLaunchScpPayload,
  ScsBridgeLaunchScp,
} from '../scsBridge.types';
import type { ScpSpawnManagerSpawnRequestedPayload } from '../../scpSpawnManager/qualities/types';
import { readScpRegistry } from '../../../../scp/scpPersistence';
import { getActiveScsBridgeMuxiumHandle } from '../../../scsBridgeMuxium';
import { buildBridgeSpawnDescriptor } from '../../../scpSpawn.model';
import { log } from '../../../debugLog';

export type { ScsBridgeLaunchScp };

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

export const scsBridgeLaunchScp = createQualityCardWithPayload<
  ScsBridgeState,
  ScsBridgeLaunchScpPayload
>({
  type: 'Scs Bridge Launch Scp',
  reducer: () => ({}),
  methodCreator: () =>
    createMethodWithConcepts(({ action }) => {
      const payload = selectPayload<ScsBridgeLaunchScpPayload>(action);
      const { scpName } = payload;

      if (typeof scpName !== 'string' || scpName.length === 0) {
        console.error('[Scs Bridge] LaunchScp invalid scpName · skipping');
        return action.strategy ? strategySuccess(action.strategy) : muxiumConclude();
      }

      const handle = getActiveScsBridgeMuxiumHandle();
      if (handle === null) {
        console.error('[Scs Bridge] LaunchScp muxium handle null · action dropped:', scpName);
        return action.strategy ? strategySuccess(action.strategy) : muxiumConclude();
      }

      const registry = readScpRegistry(handle.muxium.deck.d.scsBridge.k.userCwd.select() ?? process.cwd());
      const entry = registry.scps.find((s) => s.name === scpName);

      if (!entry) {
        console.error('[Scs Bridge] LaunchScp scpName not in SCPs.json:', scpName);
        return action.strategy ? strategySuccess(action.strategy) : muxiumConclude();
      }

      if (typeof entry.boundBridgePort !== 'number' || entry.boundBridgePort <= 0) {
        console.error('[Scs Bridge] LaunchScp missing boundBridgePort for:', scpName);
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

      log('scsbridge.launch.dispatched', {
        scpName: entry.name,
        port: entry.boundBridgePort,
        bootRequestUlid: spawnPayload.bootRequestUlid,
      });

      try {
        handle.muxium.dispatch(
          handle.muxium.deck.d.scp.d.scpSpawnManager.e.scpSpawnManagerSpawnRequested(
            spawnPayload,
          ) as never,
        );
      } catch (err) {
        console.error(
          '[Scs Bridge] LaunchScp dispatch error:',
          scpName,
          err instanceof Error ? err.message : String(err),
        );
      }

      // GITM SCP-SOVEREIGN — the BIND SEAM. The launched SCP becomes the active one: set
      // activeScpDir = entry.path (the SCP PACKAGE dir, where nodemon watches .bridge-restart.json
      // and git ops resolve UP to the parent RED repo), THEN re-arm the path-aware SCP watcher.
      try {
        handle.muxium.dispatch(
          handle.muxium.deck.d.gitm.e.gitmSetActiveScpDir({ activeScpDir: entry.path }) as never,
        );
        handle.muxium.dispatch(handle.muxium.deck.d.gitm.e.gitmScpWatcherArm({}) as never);
        // MULTI-SCP GITM MUXIFICATION (MC-W2) — arm THIS SCP's OWN per-SCP watcher pair in the registry
        // (the plurality: every running SCP keeps a live .git + tree watcher, not just the active one).
        handle.muxium.dispatch(
          handle.muxium.deck.d.gitm.e.gitmWatcherArmForScp({ scpDir: entry.path }) as never,
        );
        // INITIAL recount so the SCP location + changesPrimedOnB populate on bind (not only on the
        // next file event) — else the badge reads 0 until the user happens to edit a file.
        handle.muxium.dispatch(
          handle.muxium.deck.d.gitm.e.gitmRecountLocation({ location: 'scp', clearError: false }) as never,
        );
        // GITM A↔B Auto-Induction ("Move with C") — prime A (init-commit) + register A + fork B +
        // land the user on B, ONCE per cycle. The quality self-guards (abMode==='idle' &&
        // stableBranch===''), so firing on every bind is idempotent; the merged→idle reset re-arms it.
        handle.muxium.dispatch(handle.muxium.deck.d.gitm.e.gitmAutoInductAB({}) as never);
        // C645 · THE BIND-SEAM STARC (the composition contract: the bind seam lands its OWN first live
        // roster) — dispatch gitmSetStatus for THIS SCP (originScpName=entry.path → resolveGitmTargetCwd
        // targets its own repo) so a live STARC enumeration lands on bind, NOT only on a later .git event.
        // Without it the freshly-bound slice is born branches:[] and GITEP fans the empty roster out
        // verbatim (the phantom partial-roster). Mirrors the MC-W2 per-SCP watcher dispatch idiom
        // (gitmWatcherArmForScp · { originScpName: scpDir } as never); the Method ignores the payload
        // fields and calls readGitStatus against the resolved cwd.
        handle.muxium.dispatch(
          handle.muxium.deck.d.gitm.e.gitmSetStatus({ originScpName: entry.path } as never) as never,
        );
      } catch (err) {
        console.error(
          '[Scs Bridge] LaunchScp gitm activeScpDir bind error:',
          scpName,
          err instanceof Error ? err.message : String(err),
        );
      }

      console.log('[Scs Bridge] LaunchScp dispatched scpSpawnManagerSpawnRequested:', scpName);

      return action.strategy ? strategySuccess(action.strategy) : muxiumConclude();
    }),
});
