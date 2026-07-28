import { Command } from 'commander';
import { createSession, launchInformative } from '../../lib/bridge/manager';

export function bridgeSpawnCommand(): Command {
  const cmd = new Command('spawn');

  cmd
    .description('Spawn a new Claude Code bridge session')
    .option('--cwd <path>', 'Working directory for the spawned session', process.cwd())
    .option('--no-launch', 'Allocate session ID and directories without spawning subprocess')
    .action(async (opts: { cwd: string; launch: boolean }) => {
      try {
        const { sessionId, claudeSessionId } = await createSession({
          spawnOpts: { cwd: opts.cwd },
        });
        console.log(sessionId);
        console.error(
          `[spawn] ULID: ${sessionId}  UUID: ${claudeSessionId ?? 'pending (hook-captured)'}`,
        );

        if (opts.launch) {
          const { ulid, terminalCommand } = await launchInformative(sessionId, 'new');
          console.error(
            `Launched session ${ulid} in new window (claude UUID will be hook-captured)`,
          );
          console.error(`[spawn] Terminal: ${terminalCommand}`);
        }
      } catch (err: unknown) {
        if (err instanceof Error) {
          console.error(`Bridge spawn failed: ${err.message}`);
        } else {
          console.error('Bridge spawn failed: unknown error');
        }
        process.exit(1);
      }
    });

  return cmd;
}
