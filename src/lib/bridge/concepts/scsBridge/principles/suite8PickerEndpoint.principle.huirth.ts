/**
 * suite8PickerEndpoint · SEAP · Suite-8 Enumeration Server Extension (D-SSP.1)
 *
 * A SCS-Bridge huirth principle that extends the shared bridge Express server (the
 * SAME app that hosts /mcp + /sessionArchive + /gitm-status) with the on-demand
 * Suite-8 roster endpoint — GET /suite8/available. Sibling to
 * scsBridgeSessionArchiveEndpointPrinciple; a SEPARATE principle from scpExpressTransport
 * (that one is at its complexity ceiling — NOT extended here).
 *
 * SEAP: the Express app is acquired via `d_.muxium.d.server.k.server.select()` in the
 * principle BODY (verbatim from scsBridgeSessionArchiveEndpoint:42 / scpExpressTransport)
 * — the route registers synchronously, before any plan, within the server.listen boot
 * window. CORS is global-inherited (server.use(cors())); GET needs no body-parser.
 *
 * One route (SSP-WGB §D-SSP.1 shape · { name, snippet, hasInstance }[]):
 *   GET /suite8/available  → [{ name, snippet, hasInstance }]   (cached · latest-on-request)
 *
 * The roster is the live set of subdirectories under Cascades/8_SUITES/ — each subdir is a
 * Suite 8 any SCP can spawn. Per dir: hasInstance = existsSync(resolveSuite8InstanceMd(name));
 * when present, a BOUNDED snippet (first heading + identity line, or first ~200 chars) is read
 * from Instance.md. AFPR: a dir that throws (unreadable) is SKIPPED — one bad dir never 500s the
 * list. hasPage is OMITTED in v1 (SCP-route-side · out of scope).
 *
 * Cache: a module-scope roster cache (getRoster recomputes via fetchSuite8Available on miss). A
 * module-scope chokidar watch on SUITE8_SUITES_DIR (clone gitmWatcherArm:112-120 · awaitWriteFinish
 * · path-aware idempotency) invalidates the cache on add/addDir/unlink/unlinkDir/change. The watch
 * ARMS once.
 *
 * Pure filesystem READS — NO dispatch, NO state mutation, NEVER writes the filesystem.
 *
 * Citation: SSP-WGB.md §D-SSP.1 · SSP-S1B-EXPRESS-ENDPOINT-CURATION.md (SEAP / AFPR / chokidar clone)
 * Citation: scsBridgeSessionArchiveEndpoint.principle.huirth.ts (SEAP precedent) ·
 *           gitmWatcherArm.quality.ts:112-120 (chokidar opts) ·
 *           instanceMdResolver.model.ts:15/27 (SUITE8_SUITES_DIR / resolveSuite8InstanceMd)
 */

import type { Deck, MuxiumDeck, PrincipleFunction } from 'stratimux';
import type { Request, Response } from 'express';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { watch, type FSWatcher } from 'chokidar';
import type { ServerDeck } from '../../server/server.concept';
import type { ScsBridgeState, ScsBridgeQualities } from '../scsBridge.types';
import {
  SUITE8_SUITES_DIR,
  resolveSuite8InstanceMd,
} from '../../../instanceMdResolver.model';
import { log } from '../../../debugLog';
import { fenceWatchTargets } from '../../../watcherFence.model';

type ScsBridgeSuite8PickerDeck = Deck<MuxiumDeck & ServerDeck>;

export interface Suite8PickerEntry {
  name: string;
  snippet: string;
  hasInstance: boolean;
}

// SNIPPET CAP — the bounded slice of Instance.md held in the cache + served in the
// response. Keep the roster light; the picker only needs an identity glance.
const SNIPPET_CHAR_CAP = 200;

/**
 * Extract a BOUNDED identity snippet from an Instance.md body: the first markdown
 * heading line + the next non-empty line (an identity caption), else the first
 * ~SNIPPET_CHAR_CAP chars. Whitespace-collapsed, length-capped — never the whole file.
 */
function extractInstanceSnippet(body: string): string {
  const lines = body.split('\n');
  let heading = '';
  let identity = '';
  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    if (trimmed.length === 0) {
      continue;
    }
    if (heading === '') {
      heading = trimmed.replace(/^#+\s*/, '');
      continue;
    }
    identity = trimmed.replace(/^#+\s*/, '');
    break;
  }
  const joined = (heading + (identity ? ' — ' + identity : '')).trim();
  const snippet = joined.length > 0 ? joined : body.trim();
  const collapsed = snippet.replace(/\s+/g, ' ').trim();
  return collapsed.length > SNIPPET_CHAR_CAP
    ? collapsed.slice(0, SNIPPET_CHAR_CAP).trimEnd()
    : collapsed;
}

/**
 * Pure roster read — scan SUITE8_SUITES_DIR for subdirectories, and for each derive
 * { name, snippet, hasInstance }. AFPR: an absent suites dir → []; a dir that throws on
 * read (unreadable / disappeared mid-scan) → SKIPPED, never a thrown list. READ-only.
 *
 * MD-1 · D-SB-2 · scpRootOverride: when a SCP-local root is supplied (resolved from
 * boundScps[scpName].dir), the roster scans THAT SCP's Cascades/8_SUITES/ instead of
 * the bridge root — the Sovereignty Boundary. Absent ⇒ the bridge root (process.cwd())
 * unchanged. The module cache (getRoster) keys the bridge-root roster ONLY; an override
 * BYPASSES the cache (per-request scan · the honest simplest — one SCP's roster is small
 * and requested rarely, so caching it per-root is unnecessary complexity).
 */
export function fetchSuite8Available(scpRootOverride?: string): Suite8PickerEntry[] {
  const root = scpRootOverride ?? process.cwd();
  const suitesRoot = join(root, SUITE8_SUITES_DIR);
  let dirents;
  try {
    dirents = readdirSync(suitesRoot, { withFileTypes: true });
  } catch (err) {
    // AFPR: absent (or unreadable) Cascades/8_SUITES/ → empty roster, never a 500.
    // MD-1 FailureNode: a SCP with no local 8_SUITES yields the honest empty roster
    // (its OWN empty set), NOT the bridge's roster.
    log('suite8Picker.scan.absent', {
      root,
      error: err instanceof Error ? err.message : String(err),
    });
    return [];
  }

  const roster: Suite8PickerEntry[] = [];
  for (const dirent of dirents) {
    if (!dirent.isDirectory()) {
      continue;
    }
    const name = dirent.name;
    try {
      // MD-1 · D-SB-2 · resolveSuite8InstanceMd(name, cwdOverride) threads the SCP root
      // so hasInstance/snippet read the SCP-LOCAL Instance.md.
      const instancePath = resolveSuite8InstanceMd(name, scpRootOverride);
      const hasInstance = existsSync(instancePath);
      let snippet = '';
      if (hasInstance) {
        const body = readFileSync(instancePath, 'utf8');
        snippet = extractInstanceSnippet(body);
      }
      roster.push({ name, snippet, hasInstance });
    } catch (err) {
      // AFPR: a single unreadable / malformed Suite 8 is SKIPPED — one bad dir never
      // 500s the list. The rest of the roster still serves.
      log('suite8Picker.entry.skip', {
        name,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }
  return roster;
}

/**
 * MD-1 · D-SB-3 · resolve a bound SCP's absolute install dir from the per-project
 * bridge.json (boundScps[scpName].dir · the D-SB-1 field). The bridge process runs at
 * the project root, so the per-project bridge.json sits at
 * <cwd>/Cascades/Bridge/bridge.json. Synchronous (the Express handler is sync). AFPR:
 * absent / malformed bridge.json OR an unknown / dir-less scpName → undefined (the
 * handler answers 404 · never a bridge-root leak). NEVER throws.
 */
function resolveBoundScpDir(scpName: string): string | undefined {
  try {
    const bridgeJsonPath = join(process.cwd(), 'Cascades', 'Bridge', 'bridge.json');
    const raw = readFileSync(bridgeJsonPath, 'utf8');
    const bj = JSON.parse(raw) as { boundScps?: Record<string, { dir?: unknown }> };
    const dir = bj.boundScps?.[scpName]?.dir;
    return typeof dir === 'string' && dir.length > 0 ? dir : undefined;
  } catch {
    return undefined;
  }
}

// Module-scope roster cache — null = stale/uncomputed. getRoster recomputes on miss.
let cached: Suite8PickerEntry[] | null = null;

function getRoster(): Suite8PickerEntry[] {
  if (cached === null) {
    cached = fetchSuite8Available();
  }
  return cached;
}

// Module-scope chokidar watcher (armed once in the principle body, below) + path-aware
// idempotency guard — the suites dir the watcher is currently armed on (mirrors
// gitmWatcherArm's gitWatchedGitDir path-awareness).
let suite8Watcher: FSWatcher | null = null;
let suite8WatchedPath = '';

export const suite8PickerEndpointPrinciple: PrincipleFunction<
  ScsBridgeQualities,
  ScsBridgeSuite8PickerDeck,
  ScsBridgeState
> = ({ d_ }) => {
  // SEAP — acquire the shared Express server (verbatim seam from sessionArchive:42).
  const expressApp = d_.muxium.d.server.k.server.select();
  if (!expressApp) {
    console.error('[SCS-Bridge Suite8 Picker] No Express server in state · /suite8/available NOT registered');
    return;
  }

  // GET /suite8/available[?scpName=] — the Suite-8 roster.
  //   - no scpName    → the bridge-root roster (cached · getRoster · latest-on-request).
  //   - ?scpName=X     → MD-1 · D-SB-3 · the SCP-LOCAL roster. Resolve X's install dir
  //                      from the bridge metadata (boundScps[X].dir · the D-SB-1 field);
  //                      scan THAT SCP's Cascades/8_SUITES/ (cache-bypassing per-root).
  //     FailureNode: an unknown / unbound scpName (no dir resolvable) → 404 with the
  //     honest reason (NOT a silent fall-back to the bridge roster · that would leak the
  //     bridge's Suite 8s into the SCP's sovereign surface). AFPR: fetchSuite8Available
  //     swallows per-dir + absent-dir → a bound SCP with no local 8_SUITES → honest [].
  // AFPR-clean: getRoster never throws (fetchSuite8Available swallows per-dir + absent-dir).
  expressApp.get('/suite8/available', (req: Request, res: Response) => {
    const scpNameRaw = req.query?.scpName;
    const scpName = typeof scpNameRaw === 'string' && scpNameRaw.length > 0 ? scpNameRaw : undefined;
    if (!scpName) {
      res.json(getRoster());
      return;
    }
    const scpDir = resolveBoundScpDir(scpName);
    if (!scpDir) {
      // MD-1 FailureNode · unknown/unbound scpName → 404 with the honest reason.
      log('suite8Picker.scpName.unresolved', { scpName });
      res.status(404).json({
        error: 'scpName-unresolved',
        reason: `No install dir resolvable for scpName='${scpName}' (not a live boundScp).`,
        scpName,
      });
      return;
    }
    res.json(fetchSuite8Available(scpDir));
  });

  // Arm the chokidar watch on Cascades/8_SUITES/ ONCE (clone gitmWatcherArm:112-120 ·
  // awaitWriteFinish · path-aware idempotency). add/remove/change → invalidate the cache.
  const suitesRoot = join(process.cwd(), SUITE8_SUITES_DIR);
  // Path-aware idempotency: same dir already watched → no-op (mirrors gitmWatcherArm:93).
  if (suite8Watcher === null || suite8WatchedPath !== suitesRoot) {
    if (suite8Watcher !== null) {
      void suite8Watcher.close();
    }
    try {
      const watcher = watch(fenceWatchTargets('suite8PickerEndpoint', suitesRoot, process.cwd()), {
        ignoreInitial: true,
        persistent: true,
        depth: 1,
        awaitWriteFinish: {
          stabilityThreshold: 300,
          pollInterval: 100,
        },
      });
      watcher.on('error', (err: Error) => {
        console.error('[SCS-Bridge Suite8 Picker] chokidar error:', err);
      });
      const invalidate = (): void => {
        cached = null;
        log('suite8Picker.cache.invalidate');
      };
      watcher.on('add', invalidate);
      watcher.on('addDir', invalidate);
      watcher.on('unlink', invalidate);
      watcher.on('unlinkDir', invalidate);
      watcher.on('change', invalidate);
      suite8Watcher = watcher;
      suite8WatchedPath = suitesRoot;
      log('suite8Picker.watch.armed', { suitesRoot });
    } catch (err) {
      console.error('[SCS-Bridge Suite8 Picker] chokidar.watch (8_SUITES) failed:', err);
    }
  }

  console.log('[SCS-Bridge Suite8 Picker] /suite8/available registered');
};
