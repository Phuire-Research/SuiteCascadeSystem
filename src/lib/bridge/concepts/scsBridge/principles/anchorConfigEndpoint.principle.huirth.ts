/**
 * anchorConfigEndpoint · SEAP · Per-page Anchor Config read endpoint (SAC.3)
 *
 * A SCS-Bridge huirth principle that extends the shared bridge Express server (the
 * SAME app that hosts /mcp + /sessionArchive + /suite8/available) with the per-page
 * anchor-config read endpoint — GET /suite8/anchor-config?name=<suite8Name>. Sibling
 * to suite8PickerEndpointPrinciple; a SEPARATE principle from scpExpressTransport.
 *
 * SEAP: the Express app is acquired via `d_.muxium.d.server.k.server.select()` in the
 * principle BODY (verbatim seam from suite8PickerEndpoint:158 / sessionArchive:42) — the
 * route registers synchronously, before any plan, within the server.listen boot window.
 * CORS is global-inherited (server.use(cors())); GET needs no body-parser.
 *
 * One route (SAC.3 shape · { autoAnchor, default }):
 *   GET /suite8/anchor-config?name=<suite8Name>  → { autoAnchor, default }
 *
 * The value is resolveAnchorConfig(name) — RESOLVED = override ?? menu-creator default ??
 * system default true. AFPR: resolveAnchorConfig NEVER throws (missing/malformed config files
 * → { autoAnchor:true, default:true }). A blank/absent ?name= also resolves to the system
 * default (resolveAnchorConfig short-circuits a blank scope). Latest-on-request — NO cache,
 * NO watcher (the override file the bridge writes is read fresh each request; cheap FS reads).
 *
 * Pure filesystem READS — NO dispatch, NO state mutation, NEVER writes the filesystem.
 *
 * Citation: SAC-WGB.md § ◆ SAC.3 · anchorConfig.model.ts (resolveAnchorConfig · AFPR)
 * Citation: suite8PickerEndpoint.principle.huirth.ts (SEAP / AFPR precedent · the clone template)
 */

import type { Deck, MuxiumDeck, PrincipleFunction } from 'stratimux';
import type { Request, Response } from 'express';
import type { ServerDeck } from '../../server/server.concept';
import type { ScsBridgeState, ScsBridgeQualities } from '../scsBridge.types';
import { resolveAnchorConfig, type ResolvedAnchorConfig } from '../model/anchorConfig.model';

type ScsBridgeAnchorConfigDeck = Deck<MuxiumDeck & ServerDeck>;

export const anchorConfigEndpointPrinciple: PrincipleFunction<
  ScsBridgeQualities,
  ScsBridgeAnchorConfigDeck,
  ScsBridgeState
> = ({ d_ }) => {
  // SEAP — acquire the shared Express server (verbatim seam from suite8PickerEndpoint:158).
  const expressApp = d_.muxium.d.server.k.server.select();
  if (!expressApp) {
    console.error(
      '[SCS-Bridge Anchor Config] No Express server in state · /suite8/anchor-config NOT registered',
    );
    return;
  }

  // GET /suite8/anchor-config?name=<suite8Name> — the resolved { autoAnchor, default }.
  // AFPR-clean: resolveAnchorConfig never throws (a blank/absent name → system default).
  expressApp.get('/suite8/anchor-config', (req: Request, res: Response) => {
    const nameRaw = req.query.name;
    const name = typeof nameRaw === 'string' ? nameRaw : '';
    const config: ResolvedAnchorConfig = resolveAnchorConfig(name);
    res.json(config);
  });

  console.log('[SCS-Bridge Anchor Config] /suite8/anchor-config registered');
};
