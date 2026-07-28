/**
 * scsBridgeAlertTurnOver · C785 · scp_alert_turn_over MCP tool
 *
 * THE STALE-SERVER CURE (Blank-Test-004 field evidence): under the C784 SCP-centric ladder the
 * SCP boots BEFORE the Step-6 mint, so the served bundle ALWAYS predates a newly minted page
 * (routes 200 via the SPA catch-all but serve the old landing). The cure is NEVER an
 * agent-side build/kill/restart — the bridge owns the SCP lifecycle; an external kill strands
 * the session registry (status stays live) and the relaunch silently no-ops on the LOCK 2
 * idempotency. The cure is THE USER'S OWN TURN OVER A — the sovereign GitM rebuild+restart,
 * and their first contact with the build-while-you-use loop.
 *
 * The tool (routed by SCP NAME):
 *   1. bridge.json boundScps[scpName] → dir (exact, else case-insensitive).
 *   2. Read-modify-write <dir>/Cascades/Bridge/gitm.json: turnOverAlert = { requestedAt,
 *      source:'A', purpose } — the GitM relay renders the IslandWrapper banner directing the
 *      user to the TaskBar TURN OVER A button.
 *   3. Focus the SCP window (lookupScpWindowId → spawnFocusWindowById) so the banner is seen.
 *
 * THE SELF-RETIRING ALERT (no clear-write · no race): the GITEP ALERT HOLD
 * (gitmEndpoint.principle.ts writeGitmJsonUnsafe) carries the field write-to-write UNTIL the
 * D-BN-2 turnOver stamp lands NEWER than requestedAt — the user performed the Turn Over. The
 * agent's stand-by outcome poll reads the SAME signal (turnOver.at > turnOverAlert.requestedAt).
 *
 * Form-α side-effect-only (the FS8P sibling posture). TQNI: 'Scs Bridge Alert Turn Over'
 * camelCases to the scsBridge.e key 'scsBridgeAlertTurnOver'.
 * Citation: scsBridgeFocusSuite8Page.quality.huirth.ts (the mirror source).
 */

import {
  createQualityCardWithPayload,
  createMethodWithConcepts,
  selectPayload,
  muxiumConclude,
  strategySuccess,
} from 'stratimux';
import type { ScsBridgeState, ScsBridgeAlertTurnOverPayload } from '../scsBridge.types';
import { spawnFocusWindowById } from '../../../electronWindowSpawn';
import { readBridgeMetadata, bridgeMetadataPathPerProject } from '../../../bridgeMetadata';
import { lookupScpWindowId } from '../../../scpSessionRegistry';
import { log } from '../../../debugLog';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const DEFAULT_PURPOSE =
  'A newly minted page awaits — Turn Over A rebuilds and re-serves this SCP under you.';

export const scsBridgeAlertTurnOver = createQualityCardWithPayload<
  ScsBridgeState,
  ScsBridgeAlertTurnOverPayload
>({
  type: 'Scs Bridge Alert Turn Over',
  reducer: () => ({}),
  methodCreator: () =>
    createMethodWithConcepts(({ action }) => {
      const { scpName, purpose } = selectPayload<ScsBridgeAlertTurnOverPayload>(action);
      void (async (): Promise<void> => {
        if (typeof scpName !== 'string' || scpName.trim().length === 0) {
          log('scsbridge.alertTurnOver.skip', { reason: 'empty-scpName' });
          return;
        }
        try {
          const scsRoot = process.env.SCS_BRIDGE_ROOT_OVERRIDE
            ? process.env.SCS_BRIDGE_ROOT_OVERRIDE
            : process.cwd();
          const metadata = await readBridgeMetadata(bridgeMetadataPathPerProject(scsRoot));
          if (!metadata || !metadata.boundScps) {
            log('scsbridge.alertTurnOver.skip', { reason: 'no-metadata' });
            return;
          }
          // Routed by NAME — exact key first, case-insensitive fallback.
          let dir: string | null = null;
          let resolvedName: string | null = null;
          for (const [name, entry] of Object.entries(metadata.boundScps)) {
            if (name === scpName || name.toLowerCase() === scpName.trim().toLowerCase()) {
              dir = (entry as { dir?: string }).dir ?? null;
              resolvedName = name;
              break;
            }
          }
          if (!dir || !resolvedName) {
            log('scsbridge.alertTurnOver.skip', { reason: 'scp-unresolved', scpName });
            return;
          }
          const gitmPath = join(dir, 'Cascades', 'Bridge', 'gitm.json');
          if (!existsSync(gitmPath)) {
            log('scsbridge.alertTurnOver.skip', { reason: 'no-gitm-json', gitmPath });
            return;
          }
          const parsed = JSON.parse(readFileSync(gitmPath, 'utf8')) as Record<string, unknown>;
          // C872 · THE ACTIVE-SIDE INTELLIGENCE: signal the user's CURRENT tactical branch —
          // the side depends on the stage of their utilization (turnedOverTo 'B' anor the
          // current branch riding the working branch = they stand on B; else A). A fixed 'A'
          // mis-directed a user mid-B (the Foundry field evidence: turnedOverTo:'B').
          const turnedOverTo = typeof parsed.turnedOverTo === 'string' ? parsed.turnedOverTo : '';
          const currentBranch = typeof parsed.currentBranch === 'string' ? parsed.currentBranch : '';
          const workingBranch = typeof parsed.workingBranch === 'string' ? parsed.workingBranch : '';
          // C877 · THE FIRST-INIT CONDITION: a freshly initialized SCP is BORN on its b/
          // tactical branch BEFORE any A→B turn-over registers turnedOverTo anor workingBranch
          // (both empty on a virgin gitm.json) — the majority new-project case. The b/ prefix
          // IS the tactical-branch convention (gitmBranchRoot.model resolveStableRoot), so a
          // current branch under b/ signals B even with the registers unset.
          const activeSide =
            turnedOverTo === 'B'
            || (currentBranch.length > 0 && currentBranch === workingBranch)
            || currentBranch.startsWith('b/')
              ? 'B'
              : 'A';
          parsed.turnOverAlert = {
            requestedAt: Date.now(),
            source: activeSide,
            purpose:
              typeof purpose === 'string' && purpose.trim().length > 0
                ? purpose.trim()
                : DEFAULT_PURPOSE,
          };
          writeFileSync(gitmPath, JSON.stringify(parsed, null, 2), 'utf8');
          log('scsbridge.alertTurnOver.written', { scpName: resolvedName, gitmPath });
          const windowId = await lookupScpWindowId(resolvedName).catch(() => null);
          if (typeof windowId === 'number' && windowId > 0) {
            spawnFocusWindowById(windowId, {
              onError: (err) =>
                log('scsbridge.alertTurnOver.focus-error', {
                  scpName: resolvedName,
                  error: err.message,
                }),
            });
          } else {
            log('scsbridge.alertTurnOver.no-window', { scpName: resolvedName });
          }
        } catch (err) {
          log('scsbridge.alertTurnOver.error', {
            scpName,
            error: err instanceof Error ? err.message : String(err),
          });
        }
      })();
      return action.strategy ? strategySuccess(action.strategy) : muxiumConclude();
    }),
});
