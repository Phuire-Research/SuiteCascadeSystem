/**
 * `scs scp logs <scpName>` subcommand · Cycle 140 MSCM
 *
 * Invokes the bridge MCP tool `get_scp_logs` to read buffered log entries
 * for a named SCP.
 *
 * Citation: SUITE-3-YELLOW-CYCLE-140-MSCM-TQDR-BLUEPRINT.md §6.1
 */
import { Command } from 'commander';
import { invokeMcpTool } from '../../lib/scp/mcpInvoke';

interface LogsOptions {
  tail: string;
  json?: boolean;
}

export function logsSubcommand(): Command {
  const cmd = new Command('logs');
  cmd
    .description('Read buffered log entries for a named SCP via bridge MCP get_scp_logs')
    .argument('<scpName>', 'SCP name to read logs for')
    .option('--tail <N>', 'Show only the last N entries', '50')
    .option('--json', 'Output raw JSON instead of formatted lines')
    .action(async (scpName: string, options: LogsOptions) => {
      const result = await invokeMcpTool('get_scp_logs', { scpName });
      if (!result.ok) {
        console.error(`✗ get_scp_logs failed (${result.code ?? 'UNKNOWN'}): ${result.error}`);
        process.exit(1);
      }
      if (options.json) {
        console.log(JSON.stringify(result.result, null, 2));
        return;
      }
      const r = result.result as
        | { content?: Array<{ text?: string }>; logs?: Array<{ timestamp: number; logEntry: string }> }
        | undefined;
      let parsed: { logs?: Array<{ timestamp: number; logEntry: string }>; error?: string } | undefined;
      if (r?.content && r.content[0]?.text) {
        try {
          parsed = JSON.parse(r.content[0].text);
        } catch {
          parsed = undefined;
        }
      } else if (r?.logs) {
        parsed = r as { logs: Array<{ timestamp: number; logEntry: string }> };
      }
      if (parsed?.error) {
        console.error(`✗ ${parsed.error}`);
        process.exit(1);
      }
      const all = parsed?.logs ?? [];
      const tailN = Math.max(1, parseInt(options.tail, 10) || 50);
      const slice = all.slice(-tailN);
      if (slice.length === 0) {
        console.log(`No log entries for ${scpName}.`);
        return;
      }
      for (const entry of slice) {
        const iso = new Date(entry.timestamp).toISOString();
        console.log(`[${iso}] ${entry.logEntry}`);
      }
    });
  return cmd;
}
