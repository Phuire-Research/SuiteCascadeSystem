/**
 * scsBridgeScpStatusEndpoint · SEAP · Server-Extension SCP-Status Principle (TOH-7 · Band 2)
 *
 * THE COMMISSION (D-TOH · the user's word C951): the SCP client polls its server across a
 * Turn-Over and, when the server never returns, receives NOTHING but a ticking timer. This
 * endpoint gives the CLI a voice: the SCP's client — which already knows its CLI's port (C950
 * `resolveOriginPort` · `namedBridges`) — asks the CLI for the TRUE status of the server the CLI
 * itself spawned, and the Turn-Over overlay renders the honest state while it keeps polling.
 *
 * THE FACT, NEVER THE CLOCK (TOH-6's Agency Cure, preserved): this endpoint serves ONLY what
 * `scpCrashState.model` established from evidence — the binary `crashed | not-crashed`, its
 * `detectedAt`, the matched `signature`, and the boot-log `excerpt` the user actually needs to
 * read. No timer, no inference. The polling mechanism itself is UNCHANGED — this is information
 * alongside it, never a replacement for it.
 *
 * ABSENCE IS A STATE: no fact file yet ⇒ the CLI does NOT assume health — it RECOVERS from the
 * boot log's tail (`recoverScpCrashStateFromLog`), because a CLI that booted after the crash never
 * witnessed the line live.
 *
 * One route (mirrors /scp-boot-log/:scpName · the SEAP idiom verbatim):
 *   GET /scp-status/:scpName → ScpStatusFact
 *
 * Pure filesystem reads — NO dispatch, NO state mutation.
 *
 * Citation: scsBridgeBootLogEndpoint.principle.huirth.ts (the SEAP precedent · same data family)
 * Citation: scpCrashState.model.ts (the fact half · Class A lane-exit anor Class B stdout-signature)
 */

import type { Deck, MuxiumDeck, PrincipleFunction } from 'stratimux';
import type { Request, Response } from 'express';
import type { ServerDeck } from '../../server/server.concept';
import type { ScsBridgeState, ScsBridgeQualities } from '../scsBridge.types';
import {
  readScpStatusFact,
  recoverScpCrashStateFromLog,
} from '../../../scpCrashState.model';
import { log } from '../../../debugLog';

type ScsBridgeScpStatusDeck = Deck<MuxiumDeck & ServerDeck>;

export const scsBridgeScpStatusEndpointPrinciple: PrincipleFunction<
  ScsBridgeQualities,
  ScsBridgeScpStatusDeck,
  ScsBridgeState
> = ({ d_ }) => {
  const expressApp = d_.muxium.d.server.k.server.select();
  if (!expressApp) {
    console.error('[SCS-Bridge SEAP] No Express server in state · /scp-status NOT registered');
    return;
  }

  expressApp.get('/scp-status/:scpName', (req: Request, res: Response) => {
    const scpName = req.params.scpName;
    if (typeof scpName !== 'string' || scpName.length === 0) {
      res.status(400).json({ error: 'missing scpName' });
      return;
    }
    try {
      // The live fact first; absent ⇒ recover from the log tail (never assume health).
      const fact = readScpStatusFact(scpName) ?? recoverScpCrashStateFromLog(scpName);
      res.json(fact);
    } catch (err) {
      // A read failure is NOT evidence of a crash — report the honest unknown as not-crashed
      // with the failing signal named, so no surface can speak FAILED from an error path.
      log('seap.scpstatus.error', {
        scpName,
        error: err instanceof Error ? err.message : String(err),
      });
      res.json({
        scpName,
        state: 'not-crashed',
        detectedAt: Date.now(),
        signal: 'recovered-from-log',
        signature: '',
        excerpt: [],
      });
    }
  });

  console.log('[SCS-Bridge SEAP] /scp-status/:scpName route registered');
};
