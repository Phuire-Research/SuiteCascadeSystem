/**
 * scsBridgeDeleteScp · MD-ARC+C · Wave 7 · SDEL · scp_delete
 *
 * BMTI Quality (form-α · MASN tool 'scp_delete'). The PERMANENT rm of an SCP —
 * the destructive sibling of scp_archive (which is reversible via scp_reinstate).
 * ALL the substance lives in deleteScpEntry (scpSessionRegistry · the chainWrite
 * mutex): the guards (system/template · SDEL live · not-found), the seat
 * resolution (installed Cascades/scps/<name> anor archived .archive/<name>), the
 * WAPF branches (H0 clean rmSync · H1 owner REFUSED retire-first · H2 instance
 * git-worktree-remove-from-parent with the rmSync + dangling-note fallback), the
 * ledger removal (scps[] anor archivedScps[]), and the retirement teardown
 * (deleteSlice + disarmWatchersForScp).
 *
 * ACK-OD: the tool acks immediately; the durable products are the SCPs.json
 * ledger row removal + the removed package dir + the sink log (every guard reason
 * logged — the helm's direct-call path surfaces reasons inline).
 *
 * TQNI satisfied · qualityName 'scsBridgeDeleteScp' byte-matches the scsBridge
 * concept emitter key.
 *
 * Template: scsBridgeArchiveScp.quality.huirth.ts (form-α · ACK-OD · REUSE not reinvent).
 * Citation: STRATIMUX-REFERENCE.md "🧩 Quality Creation Patterns & Best Practices"
 * Citation: Cascades/Working/MD-ARC-PEWTER-UIFLOW.md §1.5 (PERMANENT vs reversible).
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
  ScsBridgeDeleteScpPayload,
  ScsBridgeDeleteScp,
} from '../scsBridge.types';
import { deleteScpEntry } from '../../../scpSessionRegistry';
import { log } from '../../../debugLog';

export type { ScsBridgeDeleteScp };

export const scsBridgeDeleteScp = createQualityCardWithPayload<
  ScsBridgeState,
  ScsBridgeDeleteScpPayload
>({
  type: 'Scs Bridge Delete Scp',
  reducer: () => ({}),
  methodCreator: () =>
    createMethodWithConcepts(({ action }) => {
      const payload = selectPayload<ScsBridgeDeleteScpPayload>(action);
      const { scpName, fromArchive } = payload;

      if (typeof scpName !== 'string' || scpName.length === 0) {
        console.error('[Scs Bridge] DeleteScp invalid scpName · skipping');
        return action.strategy ? strategySuccess(action.strategy) : muxiumConclude();
      }

      void deleteScpEntry(scpName, { fromArchive: fromArchive === true })
        .then((result) => {
          if (result.ok) {
            log('scsbridge.delete.ok', {
              scpName,
              fromArchive: fromArchive === true,
              worktreeNote: result.worktreeNote ?? null,
            });
            console.log('[Scs Bridge] DeleteScp removed:', scpName);
          } else {
            log('scsbridge.delete.refused', {
              scpName,
              reason: result.reason,
              detail: result.detail ?? null,
              instances: result.instances ?? null,
            });
            console.error('[Scs Bridge] DeleteScp refused:', scpName, '·', result.reason);
          }
        })
        .catch((err) => {
          log('scsbridge.delete.error', {
            scpName,
            error: err instanceof Error ? err.message : String(err),
          });
          console.error('[Scs Bridge] DeleteScp error:', scpName, err);
        });

      return action.strategy ? strategySuccess(action.strategy) : muxiumConclude();
    }),
});
