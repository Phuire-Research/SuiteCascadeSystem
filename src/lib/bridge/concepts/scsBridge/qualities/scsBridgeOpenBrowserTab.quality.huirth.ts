/**
 * scsBridgeOpenBrowserTab · Cycle 139 · CPPP Wiring
 *
 * Migration source: scpDockHostOpenBrowserTab.quality.ts (Cycle 137 · Cross-Platform Browser Tab)
 *
 * Method+Reducer Quality (form-α). Method opens a tab in the user's default browser
 * pointing at payload.logEndpoint via cross-platform browserTab.ts helper. Reducer
 * commits state.openedBrowserTabs on the augmented commit dispatch.
 *
 * Two-layer idempotency:
 *   1. pendingBrowserOpenScps: Set<string>       module-scoped · in-flight guard
 *   2. state.openedBrowserTabs[scpName]          committed-state guard
 *
 * Citation: SUITE-3-YELLOW-CYCLE-139-CPPP-WIRING-BLUEPRINT.md §5 Step 2
 * Citation: CADMIUM-PLANNEDQUERY-BROWSER-TAB-CROSSPLATFORM.md §4 + §5 + §6
 */

import {
  createQualityCardWithPayload,
  createMethodWithConcepts,
  selectPayload,
  muxiumConclude,
  strategySuccess,
  strategyDetermine,
} from 'stratimux';
import type {
  ScsBridgeState,
  ScsBridgeOpenBrowserTabPayload,
  ScsBridgeOpenBrowserTab,
  OpenedTabEntry,
} from '../scsBridge.types';
import { validateLogEndpoint } from './dockHostValidation';
import type { BrowserPlatform } from '../../../browserTab';
import { log } from '../../../debugLog';

export type { ScsBridgeOpenBrowserTab };

const pendingBrowserOpenScps = new Set<string>();

type ScsBridgeOpenBrowserTabCommitPayload = ScsBridgeOpenBrowserTabPayload & {
  openedAt: number;
  platform: BrowserPlatform;
  opener: string;
};

export const scsBridgeOpenBrowserTab = createQualityCardWithPayload<
  ScsBridgeState,
  ScsBridgeOpenBrowserTabPayload
>({
  type: 'Scs Bridge Open Browser Tab',
  reducer: (state, action) => {
    const payload = selectPayload<ScsBridgeOpenBrowserTabPayload>(
      action,
    ) as Partial<ScsBridgeOpenBrowserTabCommitPayload>;

    if (typeof payload.openedAt !== 'number' || !payload.scpName) {
      return {};
    }

    const { scpName, logEndpoint, openedAt, platform, opener } = payload as
      ScsBridgeOpenBrowserTabCommitPayload;

    if (state.openedBrowserTabs[scpName]) {
      return {};
    }

    const entry: OpenedTabEntry = {
      openedAt,
      logEndpoint,
      platform,
      opener,
    };

    console.log(
      '[Scs Bridge] OpenBrowserTab committed:',
      scpName,
      'platform=', platform,
      'opener=', opener,
    );

    return {
      openedBrowserTabs: { ...state.openedBrowserTabs, [scpName]: entry },
    };
  },
  methodCreator: () =>
    createMethodWithConcepts(({ action, deck }) => {
      const payload = selectPayload<ScsBridgeOpenBrowserTabPayload>(action) as
        Partial<ScsBridgeOpenBrowserTabCommitPayload>;
      const { scpName, logEndpoint } = payload;

      if (typeof payload.openedAt === 'number') {
        return action.strategy ? strategySuccess(action.strategy) : muxiumConclude();
      }

      if (typeof scpName !== 'string' || scpName.length === 0) {
        console.warn('[Scs Bridge] OpenBrowserTab invalid scpName · skipping');
        return action.strategy ? strategySuccess(action.strategy) : muxiumConclude();
      }
      const endpoint = typeof logEndpoint === 'string' ? logEndpoint : '';
      const validation = validateLogEndpoint(endpoint);
      if (!validation.ok) {
        console.warn(
          '[Scs Bridge] OpenBrowserTab invalid logEndpoint · skipping:',
          scpName,
          'reason:', validation.reason,
        );
        return action.strategy ? strategySuccess(action.strategy) : muxiumConclude();
      }

      if (pendingBrowserOpenScps.has(scpName)) {
        console.warn(
          '[Scs Bridge] OpenBrowserTab already pending · skipping:',
          scpName,
        );
        return action.strategy ? strategySuccess(action.strategy) : muxiumConclude();
      }
      pendingBrowserOpenScps.add(scpName);

      // OBRS · Diamond 1 · Route URL through CSCB/CSSP relay → Electron BrowserWindow
      // (replaces previous openBrowserTab OS-default-browser dispatch).
      // Fire-and-forget detached spawn of `node bin/scs.js open-url <url> --focus`.
      // bin/scs.js routes to CSSP socket (running Electron) or spawns Electron.
      // Commit dispatch fires synchronously — optimistic state update; spawn failures
      // surface via the obrsChild.on('error') log handler below.
      const { spawn: spawnChild } = require('node:child_process') as typeof import('node:child_process');
      const nodePath = require('node:path') as typeof import('node:path');
      // Install Epoch recurse (Blank-Test-003): process.cwd() = the USER PROJECT DIR in the
      // global install → <project>/bin/scs.js ENOENT → the SCP window silently never opened
      // while the SCP read "live". resolveScsRoot probes for the real package root.
      const { resolveScsRoot } = require('../../../electronWindowSpawn') as typeof import('../../../electronWindowSpawn');
      const scsPath = nodePath.join(resolveScsRoot(), 'bin', 'scs.js');
      // SWFB · F1 THE NAME THREAD (window-close signal cure): this was the third open-url
      // caller that issued a FLAGLESS argv — it spawned open-url directly, bypassing
      // spawnElectronWindowForUrl (which already carries --scp-name). Without --scp-name the
      // cli-handler's effectiveScpName fell to the env/'template' fallback and the SCP window's
      // id bound under the wrong key → signalScpWindowClosed's scpName was undefined ⇒ silent
      // no-op ⇒ the observed zero scp.window.closed events. scpName is validated non-empty
      // above (line ~95), so this caller ALWAYS knows the real name; thread it honestly.
      const obrsArgs = [scsPath, 'open-url', endpoint, '--focus', '--scp-name', scpName];
      const obrsChild = spawnChild(
        process.execPath,
        obrsArgs,
        { detached: true, stdio: 'ignore' },
      );
      obrsChild.on('error', (err) => {
        console.error(
          '[Scs Bridge] OpenBrowserTab OBRS spawn error:',
          scpName,
          'error=', err.message,
        );
      });
      obrsChild.unref();
      pendingBrowserOpenScps.delete(scpName);

      const commitPayload: ScsBridgeOpenBrowserTabCommitPayload = {
        scpName,
        logEndpoint: endpoint,
        openedAt: Date.now(),
        platform: 'electron',
        opener: 'scs-cssp',
      };
      const commitAction =
        (deck as unknown as {
          scsBridge: {
            e: {
              scsBridgeOpenBrowserTab: (
                p: ScsBridgeOpenBrowserTabCommitPayload,
              ) => unknown;
            };
          };
        }).scsBridge.e.scsBridgeOpenBrowserTab(commitPayload);
      try {
        strategyDetermine(commitAction as never);
      } catch (err) {
        console.error('[Scs Bridge] OpenBrowserTab OBRS commit dispatch error:', err);
      }

      console.log(
        '[Scs Bridge] OpenBrowserTab dispatched · spawn in-flight:',
        scpName,
      );
      log('scsbridge.browser-tab.dispatched', { scpName, logEndpoint: endpoint });

      return action.strategy ? strategySuccess(action.strategy) : muxiumConclude();
    }),
});
