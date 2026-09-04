/**
 * scsBridgeFocusSuite8Page · W3.5 (C781) · C791 FOCUS TRUTH · scp_focus_suite8_page MCP tool
 *
 * THE INSTALL-FLOW SEQUENCE STEP (c): after the proven mint scaffolds the domain Suite 8 and
 * the SCP loads, the Installation Agent calls THIS tool to focus the SCP window AND navigate
 * it to the NEW Suite 8 page — the user is LOOKING AT the page before the agent assumes the
 * Entourage Forge persona (S9-DomainPageCreate.md · the post-scaffold sequence).
 *
 * C791 · BY-NAME RESOLUTION (FOCUS TRUTH · the never-guess law, corrected):
 *   The prior version resolved the target SCP ONLY via an owner probe (which bound SCP dir
 *   contains Cascades/8_SUITES/<suite8Name>) and returned an empty ACK {} on skip. Field
 *   evidence: a freshly minted page EXISTS on the SCP but the S8 body dir does NOT yet →
 *   'owner-unresolved' → SILENT no-op. The cure: the caller names the SCP it was just working
 *   on (payload.scpName), so resolution is by NAME and needs no body-dir probe.
 *   1. payload.scpName present → resolve the bound entry by NAME from metadata.boundScps
 *      (exact key, else case-insensitive) for dir + port + browserUrl; else fall back to the
 *      SCPs.json registry (name-matched case-insensitively) for port + dir. NO body-dir probe
 *      on this path — the island deep-link composes from suite8Name directly.
 *   2. payload.scpName absent → the EXISTING owner probe (iterate boundScps · existsSync
 *      join(dir,'Cascades','8_SUITES',suite8Name)).
 *
 * C789 · THE COMPOSED-URL LAW: navUrl prefers browserUrl when present; when absent it is
 *   COMPOSED from the resolved port (http://localhost:<port>/) — browserUrl is a lag-prone
 *   projection that may not yet exist for a just-launched SCP. Then (?|&) + island=<key>.
 *
 * NO-SILENT-FAIL LAW: every early-out fires the result object with ok:false + a reason string
 *   (never a bare ACK); success fires ok:true with scpName/navUrl/windowId. Exactly ONE
 *   controller.fire on EVERY path.
 *
 * Async form: createAsyncMethodWithConcepts (template: scsBridgeOrchestrateWindow) — ONE
 * controller.fire carrying strategyData_muxifyData({focus: result}). Reducer {} · no state
 * mutation. spawnFocusSuite8PageAwait (the CSSP `focus-suite8-page` navigate+focus verb) IS the
 * Lambda.
 * Form-α side-effect-only (the BWRF sibling posture). TQNI: 'Scs Bridge Focus Suite8 Page'
 * camelCases to the scsBridge.e key 'scsBridgeFocusSuite8Page'.
 * Citation: scsBridgeOrchestrateWindow.quality.huirth.ts (the async mirror source).
 *
 * C793 · SRH · FOCUS.OK NOW REFLECTS THE RELAY OUTCOME: the prior version dispatched the relay
 *   fire-and-forget and always fired ok:true — honest one layer (the dispatch happened),
 *   success-shaped the next (the severed middle hop in bin/scs.js meant the subprocess died on an
 *   unknown command). Now the quality AWAITS spawnFocusSuite8PageAwait and folds relay.relayed
 *   into ok (+ relayed/relayDetail fields; reason 'relay-failed' when the hop fails).
 */

import {
  createQualityCardWithPayload,
  createAsyncMethodWithConcepts,
  selectPayload,
  muxiumConclude,
  strategySuccess,
  strategyData_muxifyData,
} from 'stratimux';
import type { ScsBridgeState, ScsBridgeFocusSuite8PagePayload } from '../scsBridge.types';
import { spawnFocusSuite8PageAwait } from '../../../electronWindowSpawn';
import { readBridgeMetadata, bridgeMetadataPathPerProject } from '../../../bridgeMetadata';
import { lookupScpWindowId } from '../../../scpSessionRegistry';
import { log } from '../../../debugLog';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { scpsJsonPath } from '../../../paths';

// The NDEP dir name → the compiled island key: strip spaces, lower the first char.
// 'Frontier Hello World' → 'frontierHelloWorld'.
const islandKeyOf = (suite8Name: string): string => {
  const joined = suite8Name.replace(/\s+/g, '');
  return joined.length > 0 ? joined[0].toLowerCase() + joined.slice(1) : joined;
};

// C791 · FOCUS TRUTH · the by-name resolution result carried out to the caller.
type FocusResult = {
  ok: boolean;
  reason?: string;
  scpName: string | null;
  navUrl?: string;
  windowId?: number | null;
  relayed?: boolean;
  relayDetail?: string | null;
};

// C789 · compose the navUrl from a browserUrl (preferred) anor a port (the composed-url law),
// then append the island deep-link. Returns null when neither a url nor a port resolves.
const composeNavUrl = (
  browserUrl: string | null,
  port: number | null,
  suite8Name: string,
): string | null => {
  const base =
    browserUrl && browserUrl.length > 0
      ? browserUrl
      : typeof port === 'number' && port > 0
        ? `http://localhost:${port}/`
        : null;
  if (!base) return null;
  const sep = base.includes('?') ? '&' : '?';
  return `${base}${sep}island=${encodeURIComponent(islandKeyOf(suite8Name))}`;
};

export const scsBridgeFocusSuite8Page = createQualityCardWithPayload<
  ScsBridgeState,
  ScsBridgeFocusSuite8PagePayload
>({
  type: 'Scs Bridge Focus Suite8 Page',
  reducer: () => ({}),
  methodCreator: () =>
    createAsyncMethodWithConcepts(({ controller, action }) => {
      const { suite8Name, scpName: payloadScpName } =
        selectPayload<ScsBridgeFocusSuite8PagePayload>(action);
      console.log(
        '[SCS-Bridge FS8P] method fired · suite8Name=',
        suite8Name,
        '· scpName=',
        payloadScpName ?? null,
      );

      void (async (): Promise<void> => {
        // The single fire seam — EVERY exit path fires exactly one result (no-silent-fail law).
        const fire = (result: FocusResult): void => {
          controller.fire(
            action.strategy
              ? strategySuccess(
                  action.strategy,
                  strategyData_muxifyData(action.strategy, { focus: result }),
                )
              : muxiumConclude(),
          );
        };

        if (typeof suite8Name !== 'string' || suite8Name.trim().length === 0) {
          log('scsbridge.focusSuite8Page.skip', { reason: 'empty-suite8Name' });
          fire({ ok: false, reason: 'empty-suite8Name', scpName: null });
          return;
        }

        try {
          const scsRoot = process.env.SCS_BRIDGE_ROOT_OVERRIDE
            ? process.env.SCS_BRIDGE_ROOT_OVERRIDE
            : process.cwd();
          const metadata = await readBridgeMetadata(bridgeMetadataPathPerProject(scsRoot));
          if (!metadata || !metadata.boundScps) {
            log('scsbridge.focusSuite8Page.skip', { reason: 'no-metadata' });
            fire({ ok: false, reason: 'no-metadata', scpName: payloadScpName ?? null });
            return;
          }

          let scpName: string | null = null;
          let browserUrl: string | null = null;
          let port: number | null = null;

          if (typeof payloadScpName === 'string' && payloadScpName.trim().length > 0) {
            // ── C791 · BY-NAME path (no body-dir probe) ──────────────────────────────
            const wanted = payloadScpName.trim();
            const boundEntries = Object.entries(metadata.boundScps);
            // Exact key first, else case-insensitive.
            let match = boundEntries.find(([name]) => name === wanted);
            if (!match) {
              const lc = wanted.toLowerCase();
              match = boundEntries.find(([name]) => name.toLowerCase() === lc);
            }
            if (match) {
              const [name, entry] = match;
              const e = entry as { dir?: string; browserUrl?: string; port?: number };
              scpName = name;
              browserUrl = e.browserUrl ?? null;
              port = typeof e.port === 'number' ? e.port : null;
            } else {
              // Fall back to the SCPs.json registry (name-matched case-insensitively).
              const registry = readScpsRegistry(metadata.userCwd ?? scsRoot);
              const lc = wanted.toLowerCase();
              const reg = registry.find(
                (s) => typeof s.name === 'string' && s.name.toLowerCase() === lc,
              );
              if (reg) {
                scpName = reg.name ?? wanted;
                port = typeof reg.port === 'number' ? reg.port : null;
                // No browserUrl in the registry — navUrl composes from the port (C789).
                browserUrl = null;
              }
            }
            if (!scpName) {
              log('scsbridge.focusSuite8Page.skip', {
                reason: 'name-unresolved',
                suite8Name,
                requestedScpName: wanted,
              });
              fire({ ok: false, reason: 'name-unresolved', scpName: null });
              return;
            }
          } else {
            // ── EXISTING owner probe (payload.scpName absent · unchanged) ─────────────
            for (const [name, entry] of Object.entries(metadata.boundScps)) {
              const e = entry as { dir?: string; browserUrl?: string; port?: number };
              if (e.dir && existsSync(join(e.dir, 'Cascades', '8_SUITES', suite8Name))) {
                scpName = name;
                browserUrl = e.browserUrl ?? null;
                port = typeof e.port === 'number' ? e.port : null;
                break;
              }
            }
            if (!scpName) {
              log('scsbridge.focusSuite8Page.skip', {
                reason: 'owner-unresolved',
                suite8Name,
                scpName,
                hasUrl: !!browserUrl,
              });
              fire({ ok: false, reason: 'owner-unresolved', scpName: null });
              return;
            }
          }

          // C789 · compose the navUrl (browserUrl preferred, else port-composed).
          const navUrl = composeNavUrl(browserUrl, port, suite8Name);
          if (!navUrl) {
            log('scsbridge.focusSuite8Page.skip', {
              reason: 'navurl-uncomposable',
              suite8Name,
              scpName,
              hasUrl: !!browserUrl,
              port,
            });
            fire({ ok: false, reason: 'navurl-uncomposable', scpName });
            return;
          }

          const windowId = await lookupScpWindowId(scpName).catch(() => null);
          log('scsbridge.focusSuite8Page.dispatch', { suite8Name, scpName, navUrl, windowId });
          // C793 · SRH · AWAIT the relay outcome — focus.ok now reflects whether the CSSP hop
          // landed (relay.relayed), not the mere dispatch (which was honest one layer,
          // success-shaped the next when the middle hop was severed).
          const relay = await spawnFocusSuite8PageAwait(windowId ?? -1, navUrl);
          log('scsbridge.focusSuite8Page.relay', {
            relayed: relay.relayed,
            code: relay.code,
            detail: relay.detail,
          });
          fire({
            ok: relay.relayed,
            reason: relay.relayed ? undefined : 'relay-failed',
            scpName,
            navUrl,
            windowId: windowId ?? null,
            relayed: relay.relayed,
            relayDetail: relay.detail ?? null,
          });
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          log('scsbridge.focusSuite8Page.error', { suite8Name, error: message });
          fire({ ok: false, reason: `error: ${message}`, scpName: payloadScpName ?? null });
        }
      })();
    }),
});

// C791 · SCPs.json registry fallback reader. Shape { scps: [{ name, boundBridgePort,
// installPath, ... }] }. NEVER throws — an absent/malformed registry yields []. Reads the
// brief-named fields (boundBridgePort / installPath) and tolerates the legacy `path` field.
type ScpRegistryEntry = { name?: string; port?: number; dir?: string };
const readScpsRegistry = (userCwd: string): ScpRegistryEntry[] => {
  try {
    const raw = readFileSync(scpsJsonPath(userCwd), 'utf8');
    const parsed = JSON.parse(raw) as {
      scps?: Array<{
        name?: string;
        boundBridgePort?: number;
        installPath?: string;
        path?: string;
      }>;
    };
    if (!parsed || !Array.isArray(parsed.scps)) return [];
    return parsed.scps.map((s) => ({
      name: s.name,
      port: typeof s.boundBridgePort === 'number' ? s.boundBridgePort : undefined,
      dir: s.installPath ?? s.path,
    }));
  } catch {
    return [];
  }
};
