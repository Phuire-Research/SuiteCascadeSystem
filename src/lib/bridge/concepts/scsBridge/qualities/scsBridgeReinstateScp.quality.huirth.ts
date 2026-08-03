/**
 * scsBridgeReinstateScp · MD-ARC+C · SRST · scp_reinstate
 *
 * BMTI Quality (form-α · MASN tool 'scp_reinstate'). The reverse of SARC: the
 * vault entry moves back to its original seat and the ledger row returns to
 * scps[] at status 'pending' (launch is manual — no auto-spawn). Substance in
 * reinstateScpEntry (scpSessionRegistry · chainWrite): the RROC guards
 * (not-in-archive · name collision · occupied seat) + the reverse move + the
 * ledger restoration. ACK-OD (the SCPs.json mutation is the durable product).
 *
 * TQNI satisfied · qualityName 'scsBridgeReinstateScp' byte-matches the emitter key.
 *
 * Template: scsBridgeArchiveScp.quality.huirth.ts (the SARC sibling).
 * Citation: Cascades/Working/MD-ARC-R3-BLUEPRINT.md §3.5.
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
  ScsBridgeReinstateScpPayload,
  ScsBridgeReinstateScp,
} from '../scsBridge.types';
import { reinstateScpEntry } from '../../../scpSessionRegistry';
import { log } from '../../../debugLog';

export type { ScsBridgeReinstateScp };

export const scsBridgeReinstateScp = createQualityCardWithPayload<
  ScsBridgeState,
  ScsBridgeReinstateScpPayload
>({
  type: 'Scs Bridge Reinstate Scp',
  reducer: () => ({}),
  methodCreator: () =>
    createMethodWithConcepts(({ action }) => {
      const payload = selectPayload<ScsBridgeReinstateScpPayload>(action);
      const { scpName } = payload;

      if (typeof scpName !== 'string' || scpName.length === 0) {
        console.error('[Scs Bridge] ReinstateScp invalid scpName · skipping');
        return action.strategy ? strategySuccess(action.strategy) : muxiumConclude();
      }

      void reinstateScpEntry(scpName)
        .then((result) => {
          if (result.ok) {
            log('scsbridge.reinstate.ok', { scpName });
            console.log('[Scs Bridge] ReinstateScp restored:', scpName);
          } else {
            log('scsbridge.reinstate.refused', {
              scpName,
              reason: result.reason,
              detail: result.detail ?? null,
            });
            console.error('[Scs Bridge] ReinstateScp refused:', scpName, '·', result.reason);
          }
        })
        .catch((err) => {
          log('scsbridge.reinstate.error', {
            scpName,
            error: err instanceof Error ? err.message : String(err),
          });
          console.error('[Scs Bridge] ReinstateScp error:', scpName, err);
        });

      return action.strategy ? strategySuccess(action.strategy) : muxiumConclude();
    }),
});
