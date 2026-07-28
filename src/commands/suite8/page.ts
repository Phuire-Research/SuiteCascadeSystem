/**
 * `scs suite8:page <name>` — Streamline Macro Diamond MD-1.
 *
 * The CLI verb body. Mirrors `src/commands/scp/install.ts`: the model
 * (`runSuite8PageCreate`) is silent and returns a structured result; THIS verb
 * does all console I/O (Decision d). The verb name is the literal colon-name
 * `suite8:page` (Decision c) — Commander treats it as a single command name,
 * not a parent/child split; it auto-falls-through `bin/scs.js` to dist/cli.cjs.
 *
 * Architecture: MD1-S3-YELLOW-BLUEPRINT.md (W2).
 */
import { Command } from 'commander';
import { runSuite8PageCreate } from '../../lib/scp/suite8PageCreate';

interface PageOptions {
  home?: boolean;
  force?: boolean;
  designation?: string;
  displayName?: string;
}

export function suite8PageCommand(): Command {
  const cmd = new Command('suite8:page');
  cmd
    .description(
      'Create a domain Suite 8 page from the template concept — deterministic copy-move-rename + Muxonomy wiring',
    )
    .argument('<name>', 'PascalCase Suite 8 name (e.g. Research) — the domain concept identity')
    .option('--home', 'Claim the SCP home route for this page (SAMLS swap + build:client)', false)
    .option('--force', 'Recreate the page even if the concept dir already exists', false)
    .option('--designation <scp>', 'Target a specific installed SCP (default: most-recently installed)')
    .option('--display-name <name>', 'The EXACT Cascades/8_SUITES/{name}/ dir name (spaced) for the page header + session filter binding')
    .action((name: string, options: PageOptions) => {
      const result = runSuite8PageCreate({
        projectRoot: process.cwd(),
        name,
        home: options.home === true,
        force: options.force === true,
        designation: options.designation,
        displayName: options.displayName,
      });

      if (!result.ok) {
        console.error(`✗ suite8:page failed: ${result.reason}`);
        if (result.reverted) {
          console.log('  Reverted: filesystem restored to pre-run state');
        }
        process.exit(1);
      }

      console.log('✓ Suite 8 page created');
      console.log(`  Domain:        ${result.designation}`);
      console.log(`  Concept:       ${result.conceptName}`);
      console.log(`  SCP root:      ${result.scpRoot}`);
      console.log(`  Files renamed: ${result.filesRenamed}`);
      console.log(
        `  AIME inserts:  island=${result.aimeInserts?.island} · huirth=${result.aimeInserts?.huirth}`,
      );
      console.log(`  Gates passed:  ${result.gatesPassed?.join(' → ')}`);
      if (result.homeRequested) {
        console.log(
          result.homeClaimed
            ? `  ✓ Home route claimed (isMainLanding: true · build:client OK)`
            : `  ⚠ Home route NOT claimed — base page preserved · ${result.homeClaimRevertReason}`,
        );
      }
      console.log('');
    });
  return cmd;
}
