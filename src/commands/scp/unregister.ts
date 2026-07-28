/**
 * `scs scp unregister <scpName>` subcommand · Cycle 140 MSCM · STUB
 *
 * STUB per Yellow §6.1 — destructive bridge-state removal lacks an MCP tool
 * surface in the current bridge roster. Deferred to Macro 3 (admin-header
 * route OR new `unregister_scp` tool). Until then this CLI prints a directive
 * and exits 0.
 *
 * Citation: SUITE-3-YELLOW-CYCLE-140-MSCM-TQDR-BLUEPRINT.md §6.1 (STUB note)
 */
import { Command } from 'commander';

interface UnregisterOptions {
  force?: boolean;
}

export function unregisterSubcommand(): Command {
  const cmd = new Command('unregister');
  cmd
    .description('Remove an SCP from the bridge registry · STUB · deferred to Macro 3')
    .argument('<scpName>', 'SCP name to unregister')
    .option('--force', 'Skip confirmation prompt (no effect in STUB)')
    .action(async (scpName: string, _options: UnregisterOptions) => {
      console.log(
        `Unregister command deferred to Macro 3 — no MCP tool currently exposes scsBridgeUnregisterScp.`,
      );
      console.log(
        `Workaround · use the \`scs\` TUI to unregister ${scpName}, or restart the bridge to clear all registrations.`,
      );
      process.exit(0);
    });
  return cmd;
}
