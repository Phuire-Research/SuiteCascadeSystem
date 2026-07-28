import { Command } from 'commander';
import { listSessions } from '../../lib/bridge/registry';
import { launchInformative } from '../../lib/bridge/manager';

export function bridgeAttachCommand(): Command {
  const cmd = new Command('attach');

  cmd
    .description('Resume a Claude Code bridge session by session ID')
    .argument('<sessionId>', 'ULID session ID to resume')
    .action(async (sessionId: string) => {
      const sessions = await listSessions();
      const found = sessions.find((s) => s.id === sessionId);
      if (!found) {
        console.error(`Session not found: ${sessionId}`);
        process.exit(1);
      }
      if (!found.claudeSessionId) {
        console.error(
          `Session ${sessionId} hasn't started yet (the SessionStart hook hasn't fired — typically takes ~100ms after spawn). Wait a moment and try again.`,
        );
        process.exit(1);
      }

      try {
        const {
          ulid,
          claudeSessionId: resumedUuid,
          terminalCommand,
        } = await launchInformative(sessionId, 'resume');
        console.log(
          `Resumed session ${ulid}${
            resumedUuid ? ` (claude UUID ${resumedUuid})` : ''
          } in new window`,
        );
        console.error(`[attach] Terminal: ${terminalCommand}`);
      } catch (err: unknown) {
        if (err instanceof Error) {
          console.error(`Bridge attach failed: ${err.message}`);
        } else {
          console.error('Bridge attach failed: unknown error');
        }
        process.exit(1);
      }
    });

  return cmd;
}
