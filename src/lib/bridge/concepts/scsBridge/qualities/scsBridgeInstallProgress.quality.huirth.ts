/**
 * scsBridgeInstallProgress · C853 · scp_install_progress MCP tool
 *
 * THE AGENT'S STAGED APERTURE (the RunThrough T3 wound): install_scp ACKs {} and runs
 * async — the agent's only taught poll was scp_query_holdings, which cannot distinguish
 * slow-clone vs silent-fail vs roster-lag. The C839 staged relay ALREADY writes the truth
 * per leg (Cascades/Bridge/scp-install-progress.<Designation>.json — cloning → installing →
 * ready anor failed + the honest reason); this tool is the MCP read of that sidecar (the
 * MOCH idiom · AFPR — absent/unreadable/malformed → { ok: true, progress: null } = the
 * install has not reached its first stage write anor never started).
 *
 * Sync file read · never spawns · never hangs. Return path: strategy.data ({ progress })
 * → scpExtractAndSendResponse → the JSON-RPC result (the queryHoldings precedent).
 * NDEP: the designation is a single NAME — separators/traversal answer null.
 * TQNI: 'Scs Bridge Install Progress' camelCases to the scsBridge.e key
 * 'scsBridgeInstallProgress' (matches installProgressMetadata.qualityName).
 */

import {
  createQualityCardWithPayload,
  createAsyncMethodWithConcepts,
  muxiumConclude,
  strategySuccess,
  strategyData_muxifyData,
  selectPayload,
} from 'stratimux';
import type { ScsBridgeState, ScsBridgeInstallProgressPayload } from '../scsBridge.types';
import { installProgressPath } from '../../../../scp/scpInstallProgress.model';
import { log } from '../../../debugLog';
import { readFileSync } from 'node:fs';

export type ScsBridgeInstallProgress = ReturnType<typeof createQualityCardWithPayload<
  ScsBridgeState,
  ScsBridgeInstallProgressPayload
>>;

export const scsBridgeInstallProgress = createQualityCardWithPayload<
  ScsBridgeState,
  ScsBridgeInstallProgressPayload
>({
  type: 'Scs Bridge Install Progress',
  reducer: () => ({}),
  methodCreator: () =>
    createAsyncMethodWithConcepts(({ controller, action }) => {
      const payload = selectPayload<ScsBridgeInstallProgressPayload>(action);
      // C853 · the scpName alias — the sibling tool family speaks scpName; both land.
      const designation = (payload.designation ?? payload.scpName ?? '').trim();
      let progress: Record<string, unknown> | null = null;
      if (
        designation.length > 0 &&
        !designation.includes('/') &&
        !designation.includes('\\') &&
        !designation.includes('..')
      ) {
        const scsRoot = process.env.SCS_BRIDGE_ROOT_OVERRIDE ?? process.cwd();
        try {
          const parsed = JSON.parse(
            readFileSync(installProgressPath(scsRoot, designation), 'utf8'),
          ) as unknown;
          if (parsed && typeof parsed === 'object') progress = parsed as Record<string, unknown>;
        } catch {
          /* AFPR — absent/unreadable/malformed → null (not yet started anor never started) */
        }
      }
      log('scsbridge.installProgress.served', {
        designation,
        stage: progress ? (progress.stage ?? null) : null,
      });
      controller.fire(
        action.strategy
          ? strategySuccess(
              action.strategy,
              strategyData_muxifyData(action.strategy, { ok: true, designation, progress }),
            )
          : muxiumConclude(),
      );
    }),
});
