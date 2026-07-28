/**
 * `scs scp open <scpName>` subcommand · Cycle 140 MSCM
 *
 * Opens the SCP's web UI in the user's default browser. Resolves the bound
 * port via the bridge MCP get_scp_status snapshot, then spawns the
 * platform-native opener (`open` macOS · `xdg-open` linux · `start` windows).
 *
 * Per Yellow §6.1 — does NOT go through MCP for browser open. CLI opens
 * directly once port is known.
 *
 * Citation: SUITE-3-YELLOW-CYCLE-140-MSCM-TQDR-BLUEPRINT.md §6.1
 */
import { Command } from 'commander';
import { spawn } from 'node:child_process';
import { platform } from 'node:os';
import { invokeMcpTool } from '../../lib/scp/mcpInvoke';

export function openSubcommand(): Command {
  const cmd = new Command('open');
  cmd
    .description('Open the SCP web UI in the default browser')
    .argument('<scpName>', 'SCP designation as registered in Cascades/SCPs.json')
    .action(async (scpName: string) => {
      const status = await invokeMcpTool('get_scp_status', {});
      if (!status.ok) {
        console.error(`✗ get_scp_status failed (${status.code ?? 'UNKNOWN'}): ${status.error}`);
        process.exit(1);
      }
      const r = status.result as
        | { content?: Array<{ text?: string }>; scps?: Array<{ scpName: string; scpPort: number }> }
        | undefined;
      let parsed: { scps?: Array<{ scpName: string; scpPort: number }> } | undefined;
      if (r?.content && r.content[0]?.text) {
        try {
          parsed = JSON.parse(r.content[0].text);
        } catch {
          parsed = undefined;
        }
      } else if (r?.scps) {
        parsed = r as { scps: Array<{ scpName: string; scpPort: number }> };
      }
      const match = parsed?.scps?.find((s) => s.scpName === scpName);
      if (!match) {
        console.error(`✗ SCP not currently connected: ${scpName}`);
        console.error('  Run `scs scp launch ' + scpName + '` first, or check `scs scp status`.');
        process.exit(1);
      }
      const url = `http://localhost:${match.scpPort}/`;
      const os = platform();
      const opener =
        os === 'darwin'
          ? 'open'
          : os === 'win32'
            ? 'start'
            : 'xdg-open';
      const args = os === 'win32' ? ['', url] : [url];
      try {
        const child = spawn(opener, args, { detached: true, stdio: 'ignore', shell: os === 'win32' });
        child.unref();
        console.log(`✓ Opened ${url} via ${opener}`);
      } catch (err) {
        console.error(
          `✗ Failed to open browser via ${opener}:`,
          err instanceof Error ? err.message : String(err),
        );
        process.exit(1);
      }
    });
  return cmd;
}
