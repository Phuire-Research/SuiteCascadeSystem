import { Command } from 'commander';
import { startMenu } from '../../lib/bridge/menu';

export function bridgeMenuCommand(): Command {
  const cmd = new Command('menu');
  cmd
    .description('Open the persistent live-updating session menu (interactive TUI)')
    .action(async () => {
      await startMenu();
    });
  return cmd;
}
