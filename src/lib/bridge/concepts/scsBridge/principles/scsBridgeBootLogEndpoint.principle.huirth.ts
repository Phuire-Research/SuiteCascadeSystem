/**
 * scsBridgeBootLogEndpoint · SEAP · Server-Extension Boot-Log Principle (SE)
 *
 * The Boot-Log-Endpoint-Principle: a SCS-Bridge huirth principle that extends the shared
 * bridge Express server (the SAME app that hosts /mcp + /hooks + /session + /sessionArchive)
 * with the on-demand per-SCP boot-log tail endpoint — the standby-overlay "/scp-boot-log/"
 * Server Extension. Sibling to scsBridgeSessionArchiveEndpointPrinciple; the same doctrine —
 * serving heavy/live-tail content on-demand instead of over the WebSocket relay + client state.
 *
 * SEPAR: the Express app is acquired via `d_.muxium.d.server.k.server.select()` in the
 * principle BODY (copied verbatim from the archive endpoint) — routes register synchronously,
 * before any plan, within the server.listen boot window (WBOD-safe). CORS is global-inherited
 * (server.use(cors())); GET needs no body-parser.
 *
 * One route (BOOT-STREAM · the standby overlay polls it across the respawn gap):
 *   GET /scp-boot-log/:scpName → { lines: string[] }  (readScpBootLog · absent log → 200 { lines: [] })
 *
 * Pure filesystem reads — NO dispatch, NO state mutation. The bridge writes the per-SCP boot log
 * (scpBootLog.ts · CRLB/PSLF); this endpoint tails the last N lines on demand for the standby
 * overlay that mounts while the SCP re-boots (the WebSocket is torn down, so it cannot relay).
 *
 * Citation: scsBridgeSessionArchiveEndpoint.principle.huirth.ts (SEAP precedent · verbatim idiom)
 * Citation: scpBootLog.ts:103 readScpBootLog(scpName, maxLines) → string[]
 */

import type { Deck, MuxiumDeck, PrincipleFunction } from 'stratimux';
import type { Request, Response } from 'express';
import type { ServerDeck } from '../../server/server.concept';
import type { ScsBridgeState, ScsBridgeQualities } from '../scsBridge.types';
import { readScpBootLog } from '../../../scpBootLog';
import { log } from '../../../debugLog';

type ScsBridgeBootLogDeck = Deck<MuxiumDeck & ServerDeck>;

export const scsBridgeBootLogEndpointPrinciple: PrincipleFunction<
  ScsBridgeQualities,
  ScsBridgeBootLogDeck,
  ScsBridgeState
> = ({ d_ }) => {
  const expressApp = d_.muxium.d.server.k.server.select();
  if (!expressApp) {
    console.error('[SCS-Bridge SEAP] No Express server in state · /scp-boot-log NOT registered');
    return;
  }

  // GET /scp-boot-log/:scpName — the last 50 lines of THIS SCP's rolling boot log.
  // Absent log → 200 { lines: [] } (the SCP may not have written a boot line yet); never a 500.
  expressApp.get('/scp-boot-log/:scpName', async (req: Request, res: Response) => {
    const scpName = req.params.scpName;
    if (typeof scpName !== 'string' || scpName.length === 0) {
      res.status(400).json({ error: 'missing scpName' });
      return;
    }
    try {
      const lines = readScpBootLog(scpName, 50);
      res.json({ lines });
    } catch (err) {
      log('seap.bootlog.error', { scpName, error: err instanceof Error ? err.message : String(err) });
      res.json({ lines: [] });
    }
  });

  console.log('[SCS-Bridge SEAP] /scp-boot-log/:scpName route registered');
};
