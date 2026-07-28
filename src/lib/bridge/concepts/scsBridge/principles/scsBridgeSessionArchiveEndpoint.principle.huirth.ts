/**
 * scsBridgeSessionArchiveEndpoint · SEAP · Server-Extension Archive Principle (SE)
 *
 * The Session-Extension-Archive-Principle: a SCS-Bridge huirth principle that extends
 * the shared bridge Express server (the SAME app that hosts /mcp + /hooks + /session)
 * with the on-demand archive endpoint family — the user-directed "/sessionArchive/"
 * Server Extension. Sibling to scpExpressTransportPrinciple; the reusable doctrine home
 * for serving heavy, rarely-changing content on-demand instead of over the WebSocket
 * relay + Stratimux client state.
 *
 * SEPAR: the Express app is acquired via `d_.muxium.d.server.k.server.select()` in the
 * principle BODY (copied verbatim from scpExpressTransport:185-191) — routes register
 * synchronously, before any plan, within the server.listen boot window (WBOD-safe).
 * CORS is global-inherited (server.use(cors())); GET needs no body-parser.
 *
 * Two routes (ATMS shapes · archiveManifest.model.ts):
 *   GET /sessionArchive       → { manifest: ArchiveManifestEntry[] }  (AFPR: absent dir → 200 [])
 *   GET /sessionArchive/:id    → { entry, lastTurn }  (on-demand last turn · 404 if not found)
 *
 * Pure filesystem reads — NO dispatch, NO state mutation. The manifest-in-state (the
 * reactive list) is a SEPARATE channel: the SCP-side AMWP watcher broadcasts it. This
 * endpoint serves the on-demand bodies (ODCF) + a fallback/initial manifest fetch.
 *
 * Citation: EPOCH-EXT-SE-S1-RED-CURATION.md · EPOCH-EXT-SE-S2-ORANGE-NAMING.md SEAP/ATMS
 * Citation: EPOCH-DIAMOND §6 SE Build-Card W2 · scpExpressTransport.principle.huirth.ts (precedent)
 */

import type { Deck, MuxiumDeck, PrincipleFunction } from 'stratimux';
import type { Request, Response } from 'express';
import type { ServerDeck } from '../../server/server.concept';
import type { ScsBridgeState, ScsBridgeQualities } from '../scsBridge.types';
import { buildArchiveManifest, readArchiveContents } from '../../../archiveManifest.model';
import { log } from '../../../debugLog';

type ScsBridgeArchiveDeck = Deck<MuxiumDeck & ServerDeck>;

export const scsBridgeSessionArchiveEndpointPrinciple: PrincipleFunction<
  ScsBridgeQualities,
  ScsBridgeArchiveDeck,
  ScsBridgeState
> = ({ d_ }) => {
  const expressApp = d_.muxium.d.server.k.server.select();
  if (!expressApp) {
    console.error('[SCS-Bridge SEAP] No Express server in state · /sessionArchive NOT registered');
    return;
  }

  // GET /sessionArchive — the lightweight manifest (on-demand list source + fallback).
  // AFPR: absent Cascades/Archive/ → 200 { manifest: [] }; never a 500 on the list.
  expressApp.get('/sessionArchive', async (_req: Request, res: Response) => {
    try {
      const manifest = await buildArchiveManifest();
      res.json({ manifest });
    } catch (err) {
      log('seap.manifest.error', { error: err instanceof Error ? err.message : String(err) });
      res.json({ manifest: [] });
    }
  });

  // GET /sessionArchive/:id — one archived session's contents: entry metadata + the
  // on-demand last turn (extractLastTurnSnippet on the archived .jsonl · ODCF). 404 if absent.
  expressApp.get('/sessionArchive/:id', async (req: Request, res: Response) => {
    const id = req.params.id;
    if (typeof id !== 'string' || id.length === 0) {
      res.status(400).json({ error: 'missing id' });
      return;
    }
    try {
      const contents = await readArchiveContents(id);
      if (!contents) {
        res.status(404).json({ error: 'archived session not found', id });
        return;
      }
      res.json(contents);
    } catch (err) {
      log('seap.contents.error', { id, error: err instanceof Error ? err.message : String(err) });
      res.status(500).json({ error: 'archive read failed', id });
    }
  });

  console.log('[SCS-Bridge SEAP] /sessionArchive routes registered (GET / + GET /:id)');
};
