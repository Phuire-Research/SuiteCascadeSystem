/**
 * scsBridgeArchiveScp · MD-ARC+C · SARC · scp_archive
 *
 * BMTI Quality (form-α · MASN tool 'scp_archive'). The reversible vault move of a
 * STOPPED SCP — the gentler sibling of the typed-Delete retire. ALL the substance
 * lives in archiveScpEntry (scpSessionRegistry · the chainWrite mutex): the guards
 * (system · SARC-GUARD live 3A · standard seat · WAPF H0/H1/H2), the vault move
 * (EXDEV-safe), the ledger mutation (scps[] → archivedScps[] · path re-pointed),
 * the retirement teardown (deleteSlice + disarmWatchersForScp), and the Path B
 * `git worktree repair` when force rides the payload.
 *
 * ACK-OD: the tool acks immediately; the durable products are the SCPs.json
 * ledger + the vault dir + the sink log (every guard reason logged — the helm's
 * direct-call path surfaces reasons inline; the MCP path reads the ledger).
 *
 * TQNI satisfied · qualityName 'scsBridgeArchiveScp' byte-matches the scsBridge
 * concept emitter key.
 *
 * Template: scsBridgeStopScp.quality.huirth.ts (form-α · ACK-OD · REUSE not reinvent).
 * Citation: STRATIMUX-REFERENCE.md "🧩 Quality Creation Patterns & Best Practices"
 * Citation: Cascades/Working/MD-ARC-R3-BLUEPRINT.md §3.4 · MD-ARC-R4B (WAPF).
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
  ScsBridgeArchiveScpPayload,
  ScsBridgeArchiveScp,
} from '../scsBridge.types';
import { archiveScpEntry } from '../../../scpSessionRegistry';
import { log } from '../../../debugLog';

export type { ScsBridgeArchiveScp };

export const scsBridgeArchiveScp = createQualityCardWithPayload<
  ScsBridgeState,
  ScsBridgeArchiveScpPayload
>({
  type: 'Scs Bridge Archive Scp',
  reducer: () => ({}),
  methodCreator: () =>
    createMethodWithConcepts(({ action }) => {
      const payload = selectPayload<ScsBridgeArchiveScpPayload>(action);
      const { scpName, force } = payload;

      if (typeof scpName !== 'string' || scpName.length === 0) {
        console.error('[Scs Bridge] ArchiveScp invalid scpName · skipping');
        return action.strategy ? strategySuccess(action.strategy) : muxiumConclude();
      }

      void archiveScpEntry(scpName, { force: force === true })
        .then((result) => {
          if (result.ok) {
            log('scsbridge.archive.ok', {
              scpName,
              archivedAt: result.archivedAt,
              worktreeRepair: result.worktreeRepair ?? null,
            });
            console.log('[Scs Bridge] ArchiveScp vaulted:', scpName);
          } else {
            log('scsbridge.archive.refused', {
              scpName,
              reason: result.reason,
              detail: result.detail ?? null,
              instances: result.instances ?? null,
            });
            console.error('[Scs Bridge] ArchiveScp refused:', scpName, '·', result.reason);
          }
        })
        .catch((err) => {
          log('scsbridge.archive.error', {
            scpName,
            error: err instanceof Error ? err.message : String(err),
          });
          console.error('[Scs Bridge] ArchiveScp error:', scpName, err);
        });

      return action.strategy ? strategySuccess(action.strategy) : muxiumConclude();
    }),
});
