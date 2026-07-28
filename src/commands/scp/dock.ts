/**
 * `scs scp dock <scpName>` subcommand · Cycle 140 MSCM
 *
 * Invokes the bridge MCP tool `dock_scp` to manually register an SCP with
 * the bridge. Typically the SCP self-docks on boot — this CLI route is
 * provided for the SM-SCP-MANAGE `[D]` row + admin troubleshooting.
 *
 * Citation: SUITE-3-YELLOW-CYCLE-140-MSCM-TQDR-BLUEPRINT.md §6.1
 */
import { Command } from 'commander';
import { invokeMcpTool } from '../../lib/scp/mcpInvoke';

interface DockOptions {
  port: string;
  logEndpoint: string;
}

export function dockSubcommand(): Command {
  const cmd = new Command('dock');
  cmd
    .description('Manually dock an SCP with the bridge via MCP dock_scp')
    .argument('<scpName>', 'SCP name to register')
    .requiredOption('--port <N>', 'SCP HTTP port')
    .requiredOption('--log-endpoint <URL>', 'SCP log endpoint URL')
    .action(async (scpName: string, options: DockOptions) => {
      const scpPort = parseInt(options.port, 10);
      if (Number.isNaN(scpPort) || scpPort <= 0) {
        console.error('✗ --port must be a positive integer');
        process.exit(1);
      }
      const result = await invokeMcpTool('dock_scp', {
        scpName,
        scpPort,
        logEndpoint: options.logEndpoint,
      });
      if (!result.ok) {
        console.error(`✗ dock_scp failed (${result.code ?? 'UNKNOWN'}): ${result.error}`);
        process.exit(1);
      }
      console.log(`✓ dock_scp registered ${scpName} on port ${scpPort}`);
      console.log(JSON.stringify(result.result, null, 2));
    });
  return cmd;
}
