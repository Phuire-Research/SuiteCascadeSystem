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
 * DISCRIMINATED RETURN (C785+ · the sibling suite8_page_create DATA-returning posture, NOT
 * the old Form-α side-effect-only silence): the resolve + not-advancing guard + gitm write run
 * SYNCHRONOUSLY and carry a SHAPED result out via strategyData_muxifyData ({ alertTurnOver })
 * — { ok:true, requestedAt } on a write, { dropped:true, reason:'at-equals-baseline', at } when
 * the guard drops (the requestedAt cannot advance past the last turnOver/pending-alert baseline),
 * { ok:false, error } on any honest failure. The caller can no longer mis-read a bare {} as
 * success. The window focus stays a fire-and-forget async tail (it does not gate the result).
 * TQNI: 'Scs Bridge Alert Turn Over' camelCases to the scsBridge.e key 'scsBridgeAlertTurnOver'.
 * Citation: scsBridgeSuite8PageCreate.quality.huirth.ts (the carry(result) envelope mirror) ·
 * scsBridgeFocusSuite8Page.quality.huirth.ts (the focus mirror source).
 */

import {
  createQualityCardWithPayload,
  createMethodWithConcepts,
  selectPayload,
  muxiumConclude,
  strategySuccess,
  strategyData_muxifyData,
} from 'stratimux';
import type { ScsBridgeState, ScsBridgeAlertTurnOverPayload } from '../scsBridge.types';
import { spawnFocusWindowById } from '../../../electronWindowSpawn';
import { bridgeMetadataPathPerProject } from '../../../bridgeMetadata';
import type { BridgeMetadata } from '../../../bridgeMetadata';
import { lookupScpWindowId } from '../../../scpSessionRegistry';
import { log } from '../../../debugLog';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
// E-ALERT-RACE (C888) — the alert write JOINS the per-rail gitm.json write chain (the bare
// writeFileSync raced the fan-out's read-modify-write and the alert was ERASED pre-arm).
import { enqueueGitmRailMutation } from '../../gitm/principles/gitmEndpoint.principle';

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

      // C785+ · THE DISCRIMINATED RETURN (field: first fire returned a bare {} with NO
      // write — the not-advancing guard silently dropped it; the re-fire only landed because
      // the baseline had advanced between). The tool now carries a SHAPED result out through
      // the SCP manifold tail (scpExtractAndSendResponse renders strategy.data as the JSON-RPC
      // content) — mirroring the sibling scsBridgeSuite8PageCreate.quality `carry(result)`
      // envelope so the caller can distinguish dropped / needless / unreachable from a write.
      const carry = (result: unknown) =>
        action.strategy
          ? strategySuccess(
              action.strategy,
              strategyData_muxifyData(action.strategy, { alertTurnOver: result }),
            )
          : muxiumConclude();

      if (typeof scpName !== 'string' || scpName.trim().length === 0) {
        log('scsbridge.alertTurnOver.skip', { reason: 'empty-scpName' });
        return carry({ ok: false, error: 'scpName is required.' });
      }

      // ── SYNCHRONOUS resolve + guard + write (the sibling's DATA-returning posture) ──
      // The window focus stays a fire-and-forget async tail (it does not gate the result);
      // the gitm read/guard/write is synchronous so the discriminated result rides out cleanly.
      try {
        const scsRoot = process.env.SCS_BRIDGE_ROOT_OVERRIDE
          ? process.env.SCS_BRIDGE_ROOT_OVERRIDE
          : process.cwd();
        const metadataPath = bridgeMetadataPathPerProject(scsRoot);
        if (!existsSync(metadataPath)) {
          log('scsbridge.alertTurnOver.skip', { reason: 'no-metadata' });
          return carry({ ok: false, error: `bridge.json not found at ${metadataPath}.` });
        }
        let metadata: BridgeMetadata | null = null;
        try {
          metadata = JSON.parse(readFileSync(metadataPath, 'utf8')) as BridgeMetadata;
        } catch (e) {
          log('scsbridge.alertTurnOver.skip', { reason: 'metadata-parse-fail' });
          return carry({
            ok: false,
            error: `bridge.json parse failed: ${e instanceof Error ? e.message : String(e)}`,
          });
        }
        if (!metadata || !metadata.boundScps) {
          log('scsbridge.alertTurnOver.skip', { reason: 'no-metadata' });
          return carry({ ok: false, error: 'bridge.json has no boundScps.' });
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
          return carry({
            ok: false,
            error: `SCP "${scpName}" not found in bridge.json boundScps.`,
          });
        }
        const gitmPath = join(dir, 'Cascades', 'Bridge', 'gitm.json');
        if (!existsSync(gitmPath)) {
          log('scsbridge.alertTurnOver.skip', { reason: 'no-gitm-json', gitmPath });
          return carry({ ok: false, error: `gitm.json not found at ${gitmPath}.` });
        }
        const parsed = JSON.parse(readFileSync(gitmPath, 'utf8')) as Record<string, unknown>;

        // ── THE NOT-ADVANCING GUARD (discriminated) ──
        // The baseline = the last turnOver stamp anor the pending alert's own requestedAt (the
        // ALERT HOLD self-retires only when turnOver.at EXCEEDS the alert's requestedAt). If the
        // computed requestedAt cannot ADVANCE past that baseline, a re-write is needless — the
        // pending alert already holds. Drop with a NAMED result (never a bare {}), so the caller
        // reads dropped:true and knows the alert is already live rather than mis-reading silence.
        const requestedAt = Date.now();
        const turnOverAt =
          typeof (parsed.turnOver as { at?: unknown } | undefined)?.at === 'number'
            ? (parsed.turnOver as { at: number }).at
            : 0;
        const priorAlert = parsed.turnOverAlert as { requestedAt?: unknown } | null | undefined;
        const priorAlertAt =
          priorAlert && typeof priorAlert.requestedAt === 'number' ? priorAlert.requestedAt : 0;
        const baseline = Math.max(turnOverAt, priorAlertAt);
        if (requestedAt <= baseline) {
          log('scsbridge.alertTurnOver.dropped', {
            scpName: resolvedName,
            reason: 'at-equals-baseline',
            at: baseline,
          });
          return carry({ dropped: true, reason: 'at-equals-baseline', at: baseline });
        }

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
        const alertBody = {
          requestedAt,
          source: activeSide,
          purpose:
            typeof purpose === 'string' && purpose.trim().length > 0
              ? purpose.trim()
              : DEFAULT_PURPOSE,
        };
        // E-ALERT-RACE (C888): the write ENQUEUES onto the per-rail chain — serialized with
        // every fan-out write, so no in-flight read-modify-write can erase it. The mutator
        // RE-READS + RE-GUARDS at run time (the queue delay may have advanced the baseline).
        // ok:true = QUEUED ON THE ATOMIC RAIL — the LANDING signal remains the caller's poll
        // (turnOverAlert visible · turnOver.at > requestedAt = the user performed it).
        const railDir = dir;
        void enqueueGitmRailMutation(railDir, () => {
          try {
            const fresh = JSON.parse(readFileSync(gitmPath, 'utf8')) as Record<string, unknown>;
            const freshTurnOverAt =
              typeof (fresh.turnOver as { at?: unknown } | undefined)?.at === 'number'
                ? (fresh.turnOver as { at: number }).at
                : 0;
            if (freshTurnOverAt > requestedAt) {
              log('scsbridge.alertTurnOver.born-retired', { scpName: resolvedName, freshTurnOverAt, requestedAt });
              return;
            }
            fresh.turnOverAlert = alertBody;
            writeFileSync(gitmPath, JSON.stringify(fresh, null, 2), 'utf8');
            log('scsbridge.alertTurnOver.written', { scpName: resolvedName, gitmPath, requestedAt });
          } catch (mutErr) {
            log('scsbridge.alertTurnOver.chain-write-error', {
              scpName: resolvedName,
              error: mutErr instanceof Error ? mutErr.message : String(mutErr),
            });
          }
        });

        // ── the window focus · fire-and-forget async tail (does NOT gate the result) ──
        void (async (): Promise<void> => {
          const windowId = await lookupScpWindowId(resolvedName!).catch(() => null);
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
        })();

        return carry({ ok: true, requestedAt });
      } catch (err) {
        log('scsbridge.alertTurnOver.error', {
          scpName,
          error: err instanceof Error ? err.message : String(err),
        });
        return carry({
          ok: false,
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }),
});
