import { Command } from 'commander';
import { bridgeSpawnCommand } from './spawn';
import { bridgeSendCommand } from './send';
import { bridgeListCommand } from './list';
import { bridgeAttachCommand } from './attach';
import { bridgeArchiveCommand } from './archive';
import { bridgeMenuCommand } from './menu';
import { startMenu } from '../../lib/bridge/menu';

export function bridgeCommand(): Command {
  const cmd = new Command('bridge');

  cmd.description(
    'SCS Bridge — persistent session manager (no subcommand opens menu) and CLI controls',
  );

  cmd.addCommand(bridgeSpawnCommand());
  cmd.addCommand(bridgeSendCommand());
  cmd.addCommand(bridgeListCommand());
  cmd.addCommand(bridgeAttachCommand());
  cmd.addCommand(bridgeArchiveCommand());
  cmd.addCommand(bridgeMenuCommand());

  cmd.action(async () => {
    await startMenu();
  });

  return cmd;
}
