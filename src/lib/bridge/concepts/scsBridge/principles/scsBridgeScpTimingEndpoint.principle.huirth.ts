/**
 * scsBridgeScpTimingEndpoint · SEAP · Server-Extension SCP-Boot-Timing Principle
 * (TOH-10 · build-order step 5 · C961)
 *
 * THE COMMISSION (TOH10-L3): a 7-minute turn-over whose build span was 14 SECONDS left the user
 * with no way to see where the other 6m46s went — the boot log's 500-line ring buffer had already
 * overwritten every build-stage line with ordinary runtime chatter. `scpBootTiming.model` now
 * records the stages append-only, WITH the machine-pressure snapshot taken at the same instant.
 * This endpoint is the read half: the overlay's console (build-order step 3, the user's approved
 * mock) renders stages instead of noise, and a diagnosis can read the stall directly.
 *
 * TWO ROUTES, one file — the raw tail for a render, the summary for a verdict:
 *   GET /scp-boot-timing/:scpName            → { events: ScpBootTimingEvent[] }
 *   GET /scp-boot-timing/:scpName/summary    → the last run: stallMs · totalMs · crashed
 *
 * `stallMs` is the number this whole instrument exists to produce: signal → first sign of life
 * from the child. In the C959 field that was 498s against a 14s build — the single fact that
 * redirected the diagnosis from "the build is slow" to "the machine is starving", and then, after
 * the user's memory cure, from "starving" to "contended" (four concurrent build chains, load 9.87).
 *
 * Pure filesystem reads — NO dispatch, NO state mutation. ABSENCE IS A STATE: no instrument file
 * yet returns an EMPTY events array and a null summary, never a fabricated run.
 *
 * Citation: scsBridgeScpStatusEndpoint.principle.huirth.ts (the SEAP idiom, verbatim)
 * Citation: TOH10-L3-SLOW-TURNOVER.md (the timeline the instrument was commissioned from)
 */

import type { Deck, MuxiumDeck, PrincipleFunction } from 'stratimux';
import type { Request, Response } from 'express';
import type { ServerDeck } from '../../server/server.concept';
import type { ScsBridgeState, ScsBridgeQualities } from '../scsBridge.types';
import { readScpBootTiming, summarizeLastBootRun } from '../../../scpBootTiming.model';
import { log } from '../../../debugLog';

type ScsBridgeScpTimingDeck = Deck<MuxiumDeck & ServerDeck>;

export const scsBridgeScpTimingEndpointPrinciple: PrincipleFunction<
  ScsBridgeQualities,
  ScsBridgeScpTimingDeck,
  ScsBridgeState
> = ({ d_ }) => {
  const expressApp = d_.muxium.d.server.k.server.select();
  if (!expressApp) {
    console.error('[SCS-Bridge SEAP] No Express server in state · /scp-boot-timing NOT registered');
    return;
  }

  // The summary route is registered FIRST: Express matches in registration order, and
  // '/scp-boot-timing/:scpName' would otherwise swallow '/scp-boot-timing/:scpName/summary'.
  expressApp.get('/scp-boot-timing/:scpName/summary', (req: Request, res: Response) => {
    const scpName = req.params.scpName;
    if (typeof scpName !== 'string' || scpName.length === 0) {
      res.status(400).json({ error: 'missing scpName' });
      return;
    }
    try {
      res.json({ scpName, summary: summarizeLastBootRun(scpName) });
    } catch (err) {
      log('seap.scptiming.summary.error', {
        scpName,
        error: err instanceof Error ? err.message : String(err),
      });
      // A read failure is NOT evidence about the turn-over — say null, never a fabricated run.
      res.json({ scpName, summary: null });
    }
  });

  expressApp.get('/scp-boot-timing/:scpName', (req: Request, res: Response) => {
    const scpName = req.params.scpName;
    if (typeof scpName !== 'string' || scpName.length === 0) {
      res.status(400).json({ error: 'missing scpName' });
      return;
    }
    const rawMax = Number(req.query.max);
    const max = Number.isFinite(rawMax) && rawMax > 0 ? Math.min(400, Math.floor(rawMax)) : 120;
    try {
      res.json({ scpName, events: readScpBootTiming(scpName, max) });
    } catch (err) {
      log('seap.scptiming.error', {
        scpName,
        error: err instanceof Error ? err.message : String(err),
      });
      res.json({ scpName, events: [] });
    }
  });

  console.log('[SCS-Bridge SEAP] /scp-boot-timing/:scpName route registered');
};
