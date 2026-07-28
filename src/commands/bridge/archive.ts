import { Command } from 'commander';
import { readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { archiveDir } from '../../lib/bridge/paths';
import { readMessage } from '../../lib/bridge/message';

export function bridgeArchiveCommand(): Command {
  const cmd = new Command('archive');

  cmd
    .description('Read consumed message history for a bridge session')
    .argument('<sessionId>', 'Session ID')
    .option('--read <id>', 'Print full JSON for a specific message ID')
    .action(async (sessionId: string, opts: { read?: string }) => {
      const dir = archiveDir(sessionId);
      let filenames: string[];
      try {
        filenames = await readdir(dir);
      } catch {
        console.log('No archive found for session (no messages consumed yet).');
        return;
      }

      const jsonFiles = filenames.filter((f) => f.endsWith('.json')).sort();

      if (opts.read) {
        const target = jsonFiles.find((f) => f.startsWith(opts.read!));
        if (!target) {
          console.error(`Message ID not found in archive: ${opts.read}`);
          process.exit(1);
        }
        const env = await readMessage(join(dir, target));
        console.log(JSON.stringify(env, null, 2));
        return;
      }

      if (jsonFiles.length === 0) {
        console.log('Archive is empty.');
        return;
      }

      console.log(
        `Archive for session ${sessionId.slice(0, 10)}... (${jsonFiles.length} messages)`,
      );
      console.log('-'.repeat(60));
      for (const filename of jsonFiles) {
        const env = await readMessage(join(dir, filename));
        const consumedStr = env.consumedAt
          ? new Date(env.consumedAt).toISOString().slice(0, 16)
          : 'pending';
        console.log(
          `${env.id.slice(0, 10)} | ${env.priority.padEnd(4)} | ${env.sender.padEnd(
            6,
          )} | consumed: ${consumedStr} | ${env.content.slice(0, 40)}`,
        );
      }
    });

  return cmd;
}
