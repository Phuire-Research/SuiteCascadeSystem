import { Command } from 'commander';
import { mkdir } from 'node:fs/promises';
import { priorityDir } from '../../lib/bridge/paths';
import { createEnvelope, enqueueMessage } from '../../lib/bridge/message';
import type { Priority, Sender } from '../../lib/bridge/types';

export function bridgeSendCommand(): Command {
  const cmd = new Command('send');

  cmd
    .description('Enqueue a message to a bridge session')
    .argument('<sessionId>', 'Target session ID')
    .argument('<content>', 'Message content')
    .requiredOption('--priority <level>', 'Message priority: head | body | tail')
    .option('--sender <role>', 'Sender role: user | agent | router', 'user')
    .action(
      async (sessionId: string, content: string, opts: { priority: string; sender: string }) => {
        const priority = opts.priority as Priority;
        if (!['head', 'body', 'tail'].includes(priority)) {
          console.error(`Invalid priority: ${priority}. Must be head, body, or tail.`);
          process.exit(1);
        }
        const sender = opts.sender as Sender;
        try {
          const folder = priority === 'head' ? 'heads' : priority === 'tail' ? 'tails' : 'body';
          await mkdir(priorityDir(sessionId, folder), { recursive: true });
          const env = createEnvelope({ sessionId, priority, content, sender });
          await enqueueMessage(env);
          console.log(env.id);
        } catch (err: unknown) {
          if (err instanceof Error) {
            console.error(`Send failed: ${err.message}`);
          } else {
            console.error('Send failed: unknown error');
          }
          process.exit(1);
        }
      },
    );

  return cmd;
}
