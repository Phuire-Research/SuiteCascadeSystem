// Diamond B-26 (CD-118 SCDU · Shatterite-Confirmation-Destructive-Uninstall):
// `scs uninstall` CLI subcommand — confirmation-gated reverse-muxify.
//
// Pre-flight: check Cascades/Iced/MuxificationManifest.json exists (otherwise
// nothing to uninstall · friendly no-op exit).
// Confirmation: SM-UNINSTALL-CONFIRM Shatterite menu (NEW Reference Design)
// rendered inline · default [N] for destructive-op safety.
// On confirm: invoke uninstallSCS() · surface result summary + post-uninstall
// guidance ("Your Iced record persists at Cascades/Iced/ · run `scs` again to
// re-install").
// Errors: surface via stderr · non-zero exit · errors[] from uninstallSCS()
// listed for user.

import { Command } from 'commander';
import { existsSync } from 'node:fs';
import * as path from 'node:path';
import * as readline from 'node:readline/promises';
import { stdin, stdout } from 'node:process';
import { uninstallSCS } from '../lib/bridge/uninstall';
import { getBridgeVersion } from '../lib/bridge/bridgeVersion';
import { ICED_DIR_NAME, ICED_MANIFEST_FILENAME } from '../lib/bridge/installConstants';

export function uninstallCommand(): Command {
  const cmd = new Command('uninstall');
  cmd
    .description('Uninstall SCS Bridge from current cwd · preserves Cascades/Iced/ for re-install')
    .option('--yes', 'Skip Shatterite confirmation (use with care)', false)
    .action(async (options: { yes: boolean }) => {
      const userCwd = process.cwd();
      const manifestPath = path.join(userCwd, 'Cascades', ICED_DIR_NAME, ICED_MANIFEST_FILENAME);

      // Pre-flight: nothing-to-uninstall guard
      if (!existsSync(manifestPath)) {
        console.log('No SCS Bridge install detected in this directory.');
        console.log(`  Manifest expected at: ${manifestPath}`);
        console.log('  Nothing to uninstall.');
        process.exit(0);
      }

      // Confirmation gate (CD-118 SCDU · unless --yes flag)
      if (!options.yes) {
        renderUninstallConfirmMenu(userCwd);
        const rl = readline.createInterface({ input: stdin, output: stdout });
        const answer = (await rl.question('  Continue? [y/N]: ')).trim().toLowerCase();
        rl.close();
        if (answer !== 'y' && answer !== 'yes') {
          console.log('  Cancelled · no changes made.');
          process.exit(0);
        }
      }

      // Engage uninstallSCS
      console.log('Running SCS Bridge uninstall...');
      try {
        const result = await uninstallSCS({
          userCwd,
          scsBridgeVersion: getBridgeVersion(),
        });

        console.log('');
        console.log(`SCS Bridge uninstalled (ulid: ${result.ulid})`);
        console.log(`  Reversed: ${result.reversedFiles} files via manifest`);
        console.log(`  Removed: ${result.removedDirs.length} SCS-owned directories`);
        console.log(
          `  Preserved: Cascades/Iced/ ${result.preservedIced ? 'OK' : 'WARNING — missing!'}`,
        );

        if (result.errors.length > 0) {
          console.log('');
          console.log(`  Warnings (${result.errors.length}):`);
          for (const err of result.errors) {
            console.log(`    · ${err}`);
          }
        }

        console.log('');
        console.log('Your Iced record persists at Cascades/Iced/');
        console.log('  · PreInstallSnapshot · MuxificationManifest · UserSCSConfig');
        console.log('  Run `scs` again to re-install (Iced record will be detected).');
        console.log('');
        console.log('To fully erase: rm -rf Cascades/');

        process.exit(result.errors.length === 0 ? 0 : 1);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`SCS uninstall failed: ${message}`);
        process.exit(1);
      }
    });

  return cmd;
}

// Diamond B-26 (CD-118 SCDU): inline render of the SM-UNINSTALL-CONFIRM menu.
// Pewter HiFi D5 closed-box · D7 button-variant active inversion · Rose-tint
// for destructive option · default [N] for safety. Full Reference Design at
// Cascades/8_SUITES/Teal Claude/Skills/S-SHATTERITE-MENU/SM-UNINSTALL-CONFIRM.md.
function renderUninstallConfirmMenu(userCwd: string): void {
  const out = stdout;
  out.write('\n');
  out.write('  ┌──────────────────────────────────────────────────────────────┐\n');
  out.write('  │  Uninstall SCS Bridge                                        │\n');
  out.write('  │                                                              │\n');
  out.write('  │  This will:                                                  │\n');
  out.write('  │    · Reverse install operations from MuxificationManifest    │\n');
  out.write('  │    · Restore .claude/CLAUDE.md from PreInstallSnapshot       │\n');
  out.write('  │    · Remove .claude/agents/scs-*.md + .claude/commands/scs-* │\n');
  out.write('  │    · Remove Cascades/Bridge/  (session-manager state · stale)│\n');
  out.write('  │                                                              │\n');
  out.write('  │  Will PRESERVE:                                              │\n');
  out.write('  │    · Cascades/8_SUITES/  (Suite 8 templates)                 │\n');
  out.write('  │    · Cascades/Working/  (your Diamond + Onyx WGBs)           │\n');
  out.write('  │    · Cascades/Documentation/  (reference docs)               │\n');
  out.write('  │    · Cascades/Iced/  (Snapshot + Manifest + UserSCSConfig)   │\n');
  out.write('  │                                                              │\n');
  out.write(`  │  cwd: ${truncateFor(userCwd, 56).padEnd(56)}│\n`);
  out.write('  └──────────────────────────────────────────────────────────────┘\n');
}

function truncateFor(s: string, maxLen: number): string {
  if (s.length <= maxLen) return s;
  return '…' + s.slice(s.length - (maxLen - 1));
}
