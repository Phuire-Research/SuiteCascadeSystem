/**
 * scsBridgeInstallScp · MB-W2 · install_scp MCP Tool Quality
 *
 * Thin Method+Reducer Quality (form-α · mirrors scsBridgeLaunchScp). Mediates the
 * MCP `install_scp` tool input ({designation, sourcePath?, sourceUrl?}) into a
 * NON-BLOCKING install pipeline run against the bridge's userCwd (the workspace
 * root where SCPs.json lives). The tool ACKs immediately — the roster updates when
 * the pipeline registers the SCP in SCPs.json and the next bridge.json write
 * broadcasts the change. sourceUrl WINS if both source arms are set (MB-W1 contract).
 *
 * Source arms (MB-W1 · THE SOURCE SEAM):
 *   - neither      → bundled template install (the original path)
 *   - sourcePath   → a local SCP source directory (copied · foreign source)
 *   - sourceUrl    → a git/file:// URL (cloned via performClone · foreign source)
 *
 * TQNI satisfied · qualityName 'scsBridgeInstallScp' literally matches the scsBridge
 * concept emitter key. conceptName remains 'scsBridge' (no Tier-2 selectStratiDECK
 * from the Quality manifold).
 *
 * Reducer · returns {} (no own-state mutation). Method does the real work.
 *
 * Citation: STRATIMUX-REFERENCE.md "🧩 Quality Creation Patterns & Best Practices"
 * Citation: scsBridgeLaunchScp.quality.huirth.ts (Cycle 140 TQDR form-α template)
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
  ScsBridgeInstallScpPayload,
  ScsBridgeInstallScp,
} from '../scsBridge.types';
import { runInstallScpPipelineAsync } from '../../../../scp/scpInstall';
import { getActiveScsBridgeMuxiumHandle } from '../../../scsBridgeMuxium';
import { log } from '../../../debugLog';
import { validateScpManifest } from '../../../../scp/scpManifest.model';
// C839 · THE STAGED INSTALL RELAY — per-designation stage sidecar the SCP page polls.
import { writeInstallProgress } from '../../../../scp/scpInstallProgress.model';

export type { ScsBridgeInstallScp };

export const scsBridgeInstallScp = createQualityCardWithPayload<
  ScsBridgeState,
  ScsBridgeInstallScpPayload
>({
  type: 'Scs Bridge Install Scp',
  reducer: () => ({}),
  methodCreator: () =>
    createMethodWithConcepts(({ action }) => {
      const payload = selectPayload<ScsBridgeInstallScpPayload>(action);
      // C853 · THE scpName ALIAS — the sibling tool family (scp_stop · get_scp_status ·
      // scp_launch_session_management) speaks scpName; the RunThrough T3 wound was
      // install_scp {scpName} silently skipping. Both names land.
      const { sourcePath, sourceUrl, manifestJson } = payload;
      const designation = payload.designation ?? (payload as { scpName?: string }).scpName;

      if (typeof designation !== 'string' || designation.length === 0) {
        console.error('[Scs Bridge] InstallScp invalid designation · skipping');
        return action.strategy ? strategySuccess(action.strategy) : muxiumConclude();
      }

      const handle = getActiveScsBridgeMuxiumHandle();
      if (handle === null) {
        console.error('[Scs Bridge] InstallScp muxium handle null · action dropped:', designation);
        return action.strategy ? strategySuccess(action.strategy) : muxiumConclude();
      }

      const projectRoot = handle.muxium.deck.d.scsBridge.k.userCwd.select() ?? process.cwd();

      log('scsbridge.install.dispatched', {
        designation,
        sourcePath: sourcePath ?? null,
        sourceUrl: sourceUrl ?? null,
        projectRoot,
      });

      // C822 D2 · THE COMMIT-LOCKED VARIANT: a manifestJson makes the install anchor-pinned —
      // validated STRICTLY per RD-SCP-MANIFEST v1 BEFORE any network act; requires sourceUrl;
      // the clone checks out manifest.commit.hash (never HEAD).
      let anchorCommit: string | undefined;
      if (typeof manifestJson === 'string' && manifestJson.length > 0) {
        const check = validateScpManifest(manifestJson);
        if (!check.ok) {
          log('scsbridge.install.manifest-rejected', { designation, reason: check.reason });
          console.error('[Scs Bridge InstallScp] manifest rejected:', check.reason);
          return action.strategy ? strategySuccess(action.strategy) : muxiumConclude();
        }
        if (typeof sourceUrl !== 'string' || sourceUrl.length === 0) {
          log('scsbridge.install.manifest-rejected', { designation, reason: 'manifest installs require sourceUrl' });
          console.error('[Scs Bridge InstallScp] manifest install requires sourceUrl');
          return action.strategy ? strategySuccess(action.strategy) : muxiumConclude();
        }
        anchorCommit = check.manifest.commit.hash;
        log('scsbridge.install.anchor', { designation, anchorCommit });
      }

      // Fire-and-forget · NON-BLOCKING. The tool ACKs immediately (below); the
      // pipeline registers the SCP into SCPs.json + the bridge broadcasts the
      // roster change via the next bridge.json write. sourceUrl WINS if both set.
      // C839 · THE STAGED INSTALL RELAY — Clone → Install → Ready (the SCP WorkTree
      // scaffolding's proven shape remuxified): each transition lands in the
      // per-designation sidecar the SCP page polls; a failure carries its HONEST
      // reason (the field wound: "accepted" → silence → debug-only clone failure).
      const anchorForProgress = anchorCommit ?? '';
      writeInstallProgress(projectRoot, {
        designation,
        stage: 'cloning',
        detail: anchorCommit ? `cloning at anchor ${anchorCommit.slice(0, 8)}` : 'cloning the source',
        reason: '',
        anchor: anchorForProgress,
        at: Date.now(),
      });
      void runInstallScpPipelineAsync(
        {
          projectRoot,
          designation,
          sourcePath,
          sourceUrl,
          anchorCommit,
          parentEnv: process.env as Record<string, string>,
        },
        (phase) => {
          // staging (clone + materialize) stays 'cloning'; npm anor finalize = 'installing'.
          if (phase === 'npm' || phase === 'finalize') {
            writeInstallProgress(projectRoot, {
              designation,
              stage: 'installing',
              detail: phase === 'npm' ? 'installing dependencies (npm)' : 'finalizing the install',
              reason: '',
              anchor: anchorForProgress,
              at: Date.now(),
            });
          }
        },
      )
        .then((result) => {
          if (result.ok) {
            log('scsbridge.install.complete', {
              designation,
              installPath: result.installPath ?? null,
              port: result.port ?? null,
            });
            console.log(
              '[Scs Bridge InstallScp] ok · designation:',
              designation,
              '· installPath:',
              result.installPath,
            );
            // C839 · registration landed — the roster lists the citizen (the worktree idiom:
            // registration IS the reactive availability).
            writeInstallProgress(projectRoot, {
              designation,
              stage: 'ready',
              detail: 'registered — the roster now lists it',
              reason: '',
              anchor: anchorForProgress,
              at: Date.now(),
            });
          } else {
            log('scsbridge.install.failed', { designation, reason: result.reason ?? null });
            console.error('[Scs Bridge InstallScp] failed · designation:', designation, '· reason:', result.reason);
            writeInstallProgress(projectRoot, {
              designation,
              stage: 'failed',
              detail: '',
              reason: result.reason ?? 'install failed (no reason reported)',
              anchor: anchorForProgress,
              at: Date.now(),
            });
          }
        })
        .catch((err) => {
          log('scsbridge.install.error', {
            designation,
            error: err instanceof Error ? err.message : String(err),
          });
          console.error(
            '[Scs Bridge InstallScp] pipeline error · designation:',
            designation,
            err instanceof Error ? err.message : String(err),
          );
          writeInstallProgress(projectRoot, {
            designation,
            stage: 'failed',
            detail: '',
            reason: err instanceof Error ? err.message : String(err),
            anchor: anchorForProgress,
            at: Date.now(),
          });
        });

      console.log('[Scs Bridge InstallScp] ack · install pipeline started for:', designation);

      return action.strategy ? strategySuccess(action.strategy) : muxiumConclude();
    }),
});
