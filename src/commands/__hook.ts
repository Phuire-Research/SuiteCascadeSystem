import { Command } from 'commander';
import { runSessionStartHook } from '../lib/bridge/sessionStartHook';
import { runSessionEndHook } from '../lib/bridge/sessionEndHook';
import { runStopHook } from '../lib/bridge/stopHook';
import {
  runRegisterInstallHook,
  runUserPromptSubmitInstallHook,
  runChatMessageHook,
} from '../lib/bridge/installHooks';
import { runUserPromptSubmitHook } from '../lib/bridge/userPromptSubmitHook';

export function hookCommand(): Command {
  const cmd = new Command('__hook');
  cmd
    .description(
      '[INTERNAL] SCS Bridge hook subcommands — invoked by Claude Code, not for user use',
    )
    .addHelpText('after', '\nThis subcommand is internal. Do not invoke directly.');

  cmd
    .command('session-start')
    .description(
      '[INTERNAL] SessionStart hook — captures Claude session_id from stdin, updates bridge registry',
    )
    .action(async () => {
      await runSessionStartHook();
    });

  cmd
    .command('session-end')
    .description('[INTERNAL] SessionEnd hook — marks session offline in bridge registry')
    .action(async () => {
      await runSessionEndHook();
    });

  cmd
    .command('stop')
    .description('[INTERNAL] D3C · JTCH · Stop hook — captures final turn state per assistant turn')
    .action(async () => {
      await runStopHook();
    });

  cmd
    .command('register-install')
    .description(
      '[INTERNAL] register-install hook — writes ready status to bridge install-temp registry',
    )
    .action(async () => {
      await runRegisterInstallHook();
    });

  cmd
    .command('user-prompt-submit-install')
    .description(
      '[INTERNAL] user-prompt-submit-install hook — fires Priming Prompt on first user prompt',
    )
    .action(async () => {
      await runUserPromptSubmitInstallHook();
    });

  cmd
    .command('user-prompt-submit')
    .description(
      '[INTERNAL] D3D · UPSH · user-prompt-submit hook — fires on user prompt in session-mode spawns',
    )
    .action(async () => {
      await runUserPromptSubmitHook();
    });

  cmd
    .command('chat-message')
    .description(
      '[INTERNAL] D3RM-G · CHMH · chat-message hook — Stop hook with asyncRewake; reads UIMJ queue file, injects via stdout + exit(2) on non-empty',
    )
    .action(async () => {
      await runChatMessageHook();
    });

  return cmd;
}
