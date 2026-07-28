/**
 * `scs scp status [scpName]` subcommand · Cycle 140 MSCM
 *
 * Invokes the bridge MCP tool `get_scp_status` to snapshot connected SCPs.
 * Optional scpName arg currently ignored at MCP layer (returns all); CLI
 * filters client-side if provided.
 *
 * Citation: SUITE-3-YELLOW-CYCLE-140-MSCM-TQDR-BLUEPRINT.md §6.1
 */
import { Command } from 'commander';
import { invokeMcpTool } from '../../lib/scp/mcpInvoke';

interface StatusOptions {
  json?: boolean;
}

export function statusSubcommand(): Command {
  const cmd = new Command('status');
  cmd
    .description('Show connected SCP registry snapshot via bridge MCP get_scp_status')
    .argument('[scpName]', 'Optional SCP name to filter the snapshot')
    .option('--json', 'Output raw JSON instead of formatted text')
    .action(async (scpName: string | undefined, options: StatusOptions) => {
      const result = await invokeMcpTool('get_scp_status', {});
      if (!result.ok) {
        console.error(`✗ get_scp_status failed (${result.code ?? 'UNKNOWN'}): ${result.error}`);
        process.exit(1);
      }
      if (options.json) {
        console.log(JSON.stringify(result.result, null, 2));
        return;
      }
      const r = result.result as
        | { content?: Array<{ text?: string }>; scps?: Array<Record<string, unknown>> }
        | undefined;
      let parsed: { scps?: Array<Record<string, unknown>>; count?: number } | undefined;
      if (r?.content && r.content[0]?.text) {
        try {
          parsed = JSON.parse(r.content[0].text);
        } catch {
          parsed = undefined;
        }
      } else if (r?.scps) {
        parsed = r as { scps: Array<Record<string, unknown>>; count?: number };
      }
      const scps = parsed?.scps ?? [];
      if (scps.length === 0) {
        console.log('No SCPs connected.');
        return;
      }
      const rows = scpName ? scps.filter((s) => s.scpName === scpName) : scps;
      if (rows.length === 0) {
        console.log(`No connected SCP matches: ${scpName}`);
        return;
      }
      for (const s of rows) {
        console.log(
          `${String(s.scpName).padEnd(24)} port=${String(s.scpPort).padStart(5)}  ` +
            `status=${String(s.status ?? '?').padEnd(10)} dockedAt=${String(s.dockedAt ?? '?')}`,
        );
      }
      console.log(`---\n${rows.length} SCP${rows.length === 1 ? '' : 's'} connected.`);
    });
  return cmd;
}
