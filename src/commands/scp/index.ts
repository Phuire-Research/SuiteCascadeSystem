// Diamond SCP-5 · The User Surface — scs scp parent command
//
// Parent: `scs scp`
// Subcommands: list, init
// Doctrine: Cascades/8_SUITES/SCP Researcher/Conductor.md Pattern A
// Reference Design: Cascades/8_SUITES/Teal Claude/Skills/S-SHATTERITE-MENU/SM-SCP.md

import { Command } from 'commander';
import { listSubcommand } from './list';
import { initSubcommand } from './init';
import { installSubcommand } from './install';
import { launchSubcommand } from './launch';
import { statusSubcommand } from './status';
import { logsSubcommand } from './logs';
import { openSubcommand } from './open';
import { dockSubcommand } from './dock';
import { unregisterSubcommand } from './unregister';

export function scpCommand(): Command {
  const cmd = new Command('scp');
  cmd
    .description(
      'Suite Cascade Protocol — SCP Suite 8 lifecycle operations (list, init, install, launch, status, logs, open, dock, unregister). The Suite 8 designation IS the access perimeter.',
    )
    .addCommand(listSubcommand())
    .addCommand(initSubcommand())
    .addCommand(installSubcommand())
    .addCommand(launchSubcommand())
    .addCommand(statusSubcommand())
    .addCommand(logsSubcommand())
    .addCommand(openSubcommand())
    .addCommand(dockSubcommand())
    .addCommand(unregisterSubcommand());
  return cmd;
}
