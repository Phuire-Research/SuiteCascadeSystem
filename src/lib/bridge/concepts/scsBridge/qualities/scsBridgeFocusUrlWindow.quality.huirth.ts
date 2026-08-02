/**
 * scsBridgeFocusUrlWindow · ASDR · BWRF · scs_focus_bridge_window MCP tool
 *
 * The Bridge-Window-Refocus tool. Sibling to send_message (FKIS) and OpenBrowserTab
 * (OBRS). Invoked by the SPAWNED ANCHOR ITSELF (the page-bound Cadmium session) during
 * its name-resolved Onboard routine: after it reads topics.json, branches, and authors
 * menu.json, it calls this tool to bring the SCS-Bridge UI window to the foreground so
 * the user SEES the Shatterite Menu it just authored. Research workers (anchor already
 * exists) are NOT given the Onboard prompt and do not call this.
 *
 * Server-side URL resolution (EVRC pattern · mirrors send_message origin discovery):
 *   1. optional payload.url override (caller knows the exact urlWindowMap key) — used as-is.
 *   2. else process.env.SCS_BRIDGE_ORIGIN_SCP anor SCS_BRIDGE_SCP_NAME → the bound SCP name.
 *   3. readBridgeMetadata().boundScps[scpName].browserUrl → the EXACT URL the SCP's window
 *      was opened with (the EWHM/urlWindowMap key focusUrlWindow matches by exact equality).
 *   4. fallback to bridge.json `endpoint` if no bound entry browserUrl is present.
 * Caller does NOT normally supply the URL — it is a server-side property (like send_message
 * origin). The agent simply calls scs_focus_bridge_window with no args.
 *
 * Form-α (Method+Reducer · ACK-OD pattern). Reducer returns {} · no own-state mutation.
 * Side-effect-only Quality — the CSSP `focus-url` relay (spawnFocusUrlWindow → cli-handler
 * `case 'focus-url'` → focusUrlWindow) IS the Lambda; focusUrlWindow no-ops gracefully when
 * the URL is not in urlWindowMap (non-Electron / browser-only mode), so the routine never
 * breaks. Fire-and-forget detached spawn per the OBRS sibling posture.
 *
 * Template: scsBridgeSendMessage.quality.huirth.ts (EVRC origin) + scsBridgeOpenBrowserTab
 *           (OBRS detached spawn). TQNI invariant: the type string 'Scs Bridge Focus Url
 *           Window' camelCases to the scsBridge.e key 'scsBridgeFocusUrlWindow'.
 * Citation: ANCHOR-SELF-DIRECTION-ROUTINE-WGB.md §7 W1 BWRF · ASDR-S1-RED-CURATION C5
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
  ScsBridgeFocusUrlWindowPayload,
  ScsBridgeFocusUrlWindow,
} from '../scsBridge.types';
import { spawnFocusUrlWindow, spawnFocusWindowById } from '../../../electronWindowSpawn';
import { readBridgeMetadata, bridgeMetadataPathPerProject } from '../../../bridgeMetadata';
import { lookupScpWindowId } from '../../../scpSessionRegistry';
import { log } from '../../../debugLog';

export type { ScsBridgeFocusUrlWindow };

// SWFB · resolve the SCP page window's bound Electron windowId server-side.
// PREFERRED over URL resolution — deterministic "specific not last" focus via
// BrowserWindow.fromId. Reads Cascades/SCPs.json by the origin SCP name; returns
// null when no id is bound (then the URL fallback below takes over).
//
// M3 · THE FOCUS RECORD SEAM (D-WR C628). The id-space is CORRECT — cli-handler binds
// visibleId = getVisibleScpWindowId(win.id) (the presenter when shader-wrapped, else the window),
// and BrowserWindow.fromId(visibleId) resolves that exact visible surface. The R7 defect was the
// WRONG RECORD: this resolver read ONLY env, which fell through to 'template' → a stale windowId:1
// (the helm/first window), producing {scp:'template', id:1}. The cure: PREFER the caller's known
// scpName (the /bridge-focus route has the row name) over the env fallback, so the right record's
// id is read. Env stays as the fallback for the BWRF anchor self-focus path (no scpName arg).
async function resolveBridgeWindowId(preferredScpName?: string): Promise<number | null> {
  const scp =
    (typeof preferredScpName === 'string' && preferredScpName.length > 0
      ? preferredScpName
      : undefined) ??
    process.env.SCS_BRIDGE_ORIGIN_SCP ??
    process.env.SCS_BRIDGE_SCP_NAME ??
    'template';
  try {
    return await lookupScpWindowId(scp);
  } catch (err) {
    log('scsbridge.focusBridgeWindow.id-resolve-error', {
      scp,
      error: String(err),
    });
    return null;
  }
}

// BWRF · resolve the SCS-Bridge UI window URL server-side. Returns the exact
// urlWindowMap-key URL focusUrlWindow expects, or null when nothing resolves
// (graceful no-focus · the routine continues). EVRC env → bridge.json browserUrl.
async function resolveBridgeWindowUrl(override?: string, preferredScpName?: string): Promise<string | null> {
  if (typeof override === 'string' && override.length > 0) {
    return override;
  }
  // M3 parity (the FrontierTest5 focus catch): the caller's known citizen wins here too —
  // the SHARED workspace muxium carries no per-SCP env, so the env-only read fell to the
  // endpoint fallback (the wrong anor a non-interactive window instead of the bound page).
  const originScpName =
    (typeof preferredScpName === 'string' && preferredScpName.length > 0
      ? preferredScpName
      : undefined) ??
    process.env.SCS_BRIDGE_ORIGIN_SCP ??
    process.env.SCS_BRIDGE_SCP_NAME;
  try {
    // CDV Break B · read the PROJECT-LOCAL bridge.json (Cascades/Bridge/bridge.json) the bridge
    // actually writes. readBridgeMetadata() with no arg defaults to the absent ~/.scs-bridge/
    // bridge.json → null → the focus silently no-ops (the tool returns success · ACK-OD masks it).
    // Mirror the SCS_BRIDGE_ROOT_OVERRIDE ?? cwd discipline (cadmiumOkMonitor + /cadmium-menu).
    const scsRoot = process.env.SCS_BRIDGE_ROOT_OVERRIDE
      ? process.env.SCS_BRIDGE_ROOT_OVERRIDE
      : process.cwd();
    const metadata = await readBridgeMetadata(bridgeMetadataPathPerProject(scsRoot));
    if (!metadata) {
      log('scsbridge.focusUrl.no-metadata', { originScpName: originScpName ?? null });
      return null;
    }
    if (originScpName) {
      const boundEntry = metadata.boundScps?.[originScpName];
      if (boundEntry?.browserUrl) {
        return boundEntry.browserUrl;
      }
    }
    // Fallback · the bridge endpoint (forward-compat address). Best-effort focus
    // of the bridge's own localhost window when no bound SCP browserUrl is present.
    if (typeof metadata.endpoint === 'string' && metadata.endpoint.length > 0) {
      return metadata.endpoint;
    }
    return null;
  } catch (err) {
    log('scsbridge.focusUrl.resolve-error', {
      originScpName: originScpName ?? null,
      error: String(err),
    });
    return null;
  }
}

export const scsBridgeFocusUrlWindow = createQualityCardWithPayload<
  ScsBridgeState,
  ScsBridgeFocusUrlWindowPayload
>({
  type: 'Scs Bridge Focus Url Window',
  reducer: () => ({}),
  methodCreator: () =>
    createMethodWithConcepts(({ action }) => {
      const payload = selectPayload<ScsBridgeFocusUrlWindowPayload>(action);
      const { url } = payload;
      // M3 · THE FOCUS RECORD SEAM — the caller's known SCP name (helm /bridge-focus threads it).
      const payloadScpName =
        typeof payload.scpName === 'string' && payload.scpName.length > 0 ? payload.scpName : undefined;

      console.log('[SCS-Bridge BWRF] method fired · urlOverride=', url ?? null, '· scpName=', payloadScpName ?? null);

      // Side-effect-only · fire-and-forget. Resolve windowId FIRST (SWFB · the
      // specific bound window), fall back to URL resolution. ACK-OD: return
      // success immediately (the focus relay IS the Lambda; a missing window
      // no-ops gracefully inside focusWindowById / focusUrlWindow).
      void (async (): Promise<void> => {
        // SWFB · prefer the bound windowId unless the caller forced a url override.
        if (typeof url !== 'string' || url.length === 0) {
          // M3 · pass the caller's known scpName so the RIGHT record's id resolves (not env 'template').
          const windowId = await resolveBridgeWindowId(payloadScpName);
          if (windowId !== null) {
            const scp =
              payloadScpName ??
              process.env.SCS_BRIDGE_ORIGIN_SCP ??
              process.env.SCS_BRIDGE_SCP_NAME ??
              'template';
            log('scsbridge.focusBridgeWindow.by-id', { scp, id: windowId });
            console.log('[SCS-Bridge SWFB] focus by-id · scp=', scp, '· id=', windowId);
            try {
              spawnFocusWindowById(windowId, {
                onError: (err) => {
                  log('scsbridge.focusBridgeWindow.by-id-spawn-error', {
                    id: windowId,
                    error: err.message,
                  });
                  console.error('[SCS-Bridge SWFB] CSSP focus-by-id spawn error:', err);
                },
              });
            } catch (err) {
              const m = err instanceof Error ? err.message : String(err);
              log('scsbridge.focusBridgeWindow.by-id-error', { id: windowId, message: m });
              console.error('[SCS-Bridge SWFB] error · id=', windowId, '· error=', m);
            }
            return;
          }
        }

        // BWRF fallback · no bound windowId (or a payload.url override) → resolve
        // the URL and use the original focus-url relay (preserves browserUrl override).
        // M3 parity: the caller's known citizen threads into the URL leg too.
        const resolvedUrl = await resolveBridgeWindowUrl(url, payloadScpName);
        if (!resolvedUrl) {
          log('scsbridge.focusUrl.no-url', {});
          console.warn(
            '[SCS-Bridge BWRF] no bridge window URL resolved (no env scp / no bridge.json browserUrl) · skipping focus',
          );
          return;
        }
        log('scsbridge.focusUrl.dispatched', { url: resolvedUrl });
        console.log('[SCS-Bridge BWRF] dispatched · url=', resolvedUrl);
        try {
          spawnFocusUrlWindow(resolvedUrl, {
            onError: (err) => {
              log('scsbridge.focusUrl.spawn-error', {
                url: resolvedUrl,
                error: err.message,
              });
              console.error('[SCS-Bridge BWRF] CSSP focus-url spawn error:', err);
            },
          });
        } catch (err) {
          const m = err instanceof Error ? err.message : String(err);
          log('scsbridge.focusUrl.error', { url: resolvedUrl, message: m });
          console.error('[SCS-Bridge BWRF] error · url=', resolvedUrl, '· error=', m);
        }
      })();

      return action.strategy ? strategySuccess(action.strategy) : muxiumConclude();
    }),
});
