/**
 * `scs scp install <designation>` subcommand — RM-D5
 *
 * CLI mirror of the TUI Install SCP wizard. Materializes a new SCP runtime
 * tree at `Cascades/scps/{Designation}/SCP/` via the 7-step pipeline in
 * `src/lib/scp/scpInstall.ts`.
 *
 * Flags:
 *   --no-launch        Skip the SABO spawn step (descriptor returned but unused)
 *   --skip-npm         Skip the `npm install` step (faster for dev iteration)
 *   --source <path|url> MB-W1 · install a FOREIGN SCP source instead of the bundled
 *                      template: a git/file:// URL (cloned) anor a local path (copied)
 *
 * Default behavior: validate → generate concept → clone + rename → npm install
 * → write SCPs.json entry → build spawn descriptor → log spawn command for
 * manual launch (caller can copy-paste or use --launch flag in future).
 *
 * Citation: DIAMOND-TIER-REFINE-MACRO-SCP-INSTALL.md RM-D5
 * Citation: scpInstall.ts runInstallScpPipeline
 */
import { Command } from 'commander';
import { runInstallScpPipeline } from '../../lib/scp/scpInstall';
import { readBridgeMetadata, bridgeMetadataPathPerProject } from '../../lib/bridge/bridgeMetadata';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

interface InstallOptions {
  launch: boolean;
  npm: boolean;
  source?: string;
}

// MB-W1 · classify a --source value: a git/file:// URL routes to sourceUrl (cloned
// via performClone); anything else is treated as a local path (sourcePath).
const SOURCE_URL_PATTERN = /^(https?:\/\/|git@|file:\/\/)/;

export function installSubcommand(): Command {
  const cmd = new Command('install');
  cmd
    .description(
      'Install a personalized SCP — materializes a new SCP runtime instance from the ' +
        'bundled template, a local PATH, anor a git/file:// URL (--source)',
    )
    .argument('<designation>', 'PascalCase SCP designation (e.g. MyResearchSCP)')
    .option('--no-launch', 'Skip the SABO spawn step (descriptor returned but unused)', true)
    .option('--no-npm', 'Skip the npm install step (faster for dev iteration)', true)
    .option(
      '--source <path-or-url>',
      'MB-W1 · Install a FOREIGN SCP source instead of the bundled template: a git/file:// URL (cloned) or a local directory path (copied). A matching /^(https?:\\/\\/|git@|file:\\/\\/)/ value is a URL; else a local path.',
    )
    .action(async (designation: string, options: InstallOptions) => {
      const cwd = process.cwd();
      // MB-W1 · a --source matching the URL pattern → sourceUrl; else → sourcePath.
      const sourceUrl =
        options.source && SOURCE_URL_PATTERN.test(options.source) ? options.source : undefined;
      const sourcePath =
        options.source && !SOURCE_URL_PATTERN.test(options.source) ? options.source : undefined;
      const result = runInstallScpPipeline({
        projectRoot: cwd,
        designation,
        runNpmInstall: options.npm !== false,
        buildDescriptor: true,
        sourcePath,
        sourceUrl,
      });

      if (!result.ok) {
        console.error(`✗ Install failed: ${result.reason}`);
        process.exit(1);
      }

      console.log(`✓ SCP installed`);
      console.log(`  Designation:    ${result.designation}`);
      console.log(`  Concept name:   ${result.conceptName}`);
      console.log(`  Install path:   ${result.installPath}`);
      console.log(`  Files copied:   ${result.filesCopied}`);
      console.log(`  Generated:      ${result.generatedFilesWritten}`);
      console.log(`  npm install:    ${result.npmInstallRan ? 'completed' : 'skipped'}`);
      console.log(`  SCPs.json:      updated`);
      console.log(`  Bound port:     ${result.port}`);

      // Concluder #9 · STRONG (SUITE-5-BLUE-MCP-LIVENESS-TRUTH).
      // Freshness alone is insufficient — the prior implementation reported
      // "discoverable" based on bridge.json mtime without verifying the port
      // had a live listener. Combined with the animatedTui hardcoded
      // BRIDGE_METADATA_PORT = 7111 clobber, this produced false-positive
      // MCP-available signals while the endpoint was genuinely unreachable.
      //
      // The strong Concluder runs a JSON-RPC `initialize` handshake against
      // http://127.0.0.1:{port}/mcp with a 2s timeout. Only protocolVersion
      // round-trip == LIVE. Anything else (HTTP error, ECONNREFUSED, timeout)
      // == not reachable; user must start `scs` in another terminal.
      // PPRR/CPCR · Read per-project bridge.json at <projectRoot>/Cascades/Bridge/bridge.json
      // (replaces global ~/.scs-bridge/bridge.json). FIX-6 mitigation: if cwd has
      // no Cascades/ subdir, log a warning — install likely ran from wrong dir.
      const projectRoot = process.cwd();
      if (!existsSync(join(projectRoot, 'Cascades'))) {
        console.warn(
          `  ⚠ Cascades/ directory not found at ${projectRoot} — install may need to run from project root for per-project bridge.json discovery`,
        );
      }
      const perProjectBridgePath = bridgeMetadataPathPerProject(projectRoot);
      const bridgeMeta = await readBridgeMetadata(perProjectBridgePath);
      const bridgeMetaAgeMs = bridgeMeta ? Date.now() - bridgeMeta.writtenAt : Infinity;
      const bridgeMetaFresh = bridgeMetaAgeMs < 60 * 60 * 1000;

      let mcpReachable = false;
      let mcpProbeError = '';
      if (bridgeMeta && bridgeMetaFresh) {
        try {
          const probeUrl = `http://127.0.0.1:${bridgeMeta.port}/mcp`;
          const probeBody = JSON.stringify({
            jsonrpc: '2.0',
            id: 0,
            method: 'initialize',
            params: { protocolVersion: '2024-11-05' },
          });
          const probeRes = await fetch(probeUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: probeBody,
            signal: AbortSignal.timeout(2000),
          });
          if (probeRes.ok) {
            const probeJson = (await probeRes.json()) as {
              result?: { protocolVersion?: string };
            };
            mcpReachable = probeJson?.result?.protocolVersion === '2024-11-05';
            if (!mcpReachable) {
              mcpProbeError = 'handshake protocolVersion mismatch';
            }
          } else {
            mcpProbeError = `HTTP ${probeRes.status}`;
          }
        } catch (err) {
          mcpProbeError = err instanceof Error ? err.message : String(err);
        }
      }

      if (mcpReachable && bridgeMeta) {
        console.log(
          `  ✓ SCS-Bridge MCP LIVE (port=${bridgeMeta.port} · initialize handshake OK · age=${Math.round(bridgeMetaAgeMs / 1000)}s)`,
        );
      } else if (bridgeMeta && bridgeMetaFresh && !mcpReachable) {
        console.log(
          `  ⚠ SCS-Bridge bridge.json fresh but /mcp NOT REACHABLE at port ${bridgeMeta.port} (${mcpProbeError}) · run \`scs\` to start MCP endpoint`,
        );
      } else if (bridgeMeta && !bridgeMetaFresh) {
        console.log(
          `  ⚠ SCS-Bridge bridge.json stale (writtenAt > 1h) · run \`scs\` to refresh`,
        );
      } else {
        console.log(
          `  ⚠ SCS-Bridge not running (no bridge.json) · MCP option unavailable · run \`scs\` in another terminal to enable`,
        );
      }
      console.log(`  ✓ SCPs.json registered (status='installed' · boundBridgePort=${result.port})`);
      console.log('');

      if (options.launch !== false && result.descriptor) {
        console.log('Browser URL:  ' + result.descriptor.browserUrl);
        console.log('');
        console.log('Engage via SCS-Bridge:');
        if (mcpReachable && bridgeMeta) {
          console.log(
            `  • MCP (recommended · agent-invokable): POST /mcp tools/call launch_scp on port ${bridgeMeta.port} (SB-S126/SB-S127)`,
          );
          console.log(
            `  • TUI (manual self-direction): run \`scs\` and Enter on \`${result.designation}\` (DSBL auto-launch)`,
          );
        } else {
          console.log(
            `  • MCP (CURRENTLY UNREACHABLE · start \`scs\` first): POST /mcp tools/call launch_scp (SB-S126/SB-S127)`,
          );
          console.log(
            `  • TUI (recommended now): run \`scs\` and Enter on \`${result.designation}\` (DSBL auto-launch)`,
          );
        }
        console.log('');
        console.log('AJMI Cadmium Tutorial Join armed (pending) — Macro 3 hand-off ready.');
      }
    });
  return cmd;
}
