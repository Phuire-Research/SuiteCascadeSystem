/**
 * `scs scp launch <scpName>` subcommand · Cycle 140 MSCM
 *
 * Invokes the bridge MCP tool `launch_scp` to spawn a registered SCP child
 * process. Mirrors the Shatterite SM-SCP-MANAGE `[L]` row.
 *
 * Citation: SUITE-3-YELLOW-CYCLE-140-MSCM-TQDR-BLUEPRINT.md §6.1
 */
import { Command } from 'commander';
import { invokeMcpTool } from '../../lib/scp/mcpInvoke';

export function launchSubcommand(): Command {
  const cmd = new Command('launch');
  cmd
    .description('Launch a registered SCP via the bridge MCP launch_scp tool')
    .argument('<scpName>', 'SCP designation as registered in Cascades/SCPs.json')
    .action(async (scpName: string) => {
      const result = await invokeMcpTool('launch_scp', { scpName });
      if (!result.ok) {
        console.error(`✗ launch_scp failed (${result.code ?? 'UNKNOWN'}): ${result.error}`);
        process.exit(1);
      }
      console.log(`✓ launch_scp dispatched for ${scpName}`);
      console.log(JSON.stringify(result.result, null, 2));
    });
  return cmd;
}
