// Diamond SCP-5 · `scs scp init <designation>` subcommand
//
// Materializes a new SCP Suite 8 instance by cloning the SCP Researcher
// Templates into a user-named directory under Cascades/8_SUITES/.
//
// Default mode: Personal. Use --mode <Personal|Organizational|Project> to
// override. Default runtime composition: reference (the instance's Instance.md
// declares Runtime: ../../scps/template/SCP/ pointing at the shared template at repo
// root).
//
// Doctrine: Cascades/8_SUITES/SCP Researcher/Conductor.md Pattern A.
// Reference Design: Cascades/8_SUITES/Teal Claude/Skills/S-SHATTERITE-MENU/SM-SCP.md

import { Command } from 'commander';
import { existsSync } from 'node:fs';
import * as path from 'node:path';
import {
  createScpInstance,
  validateMode,
  SCP_RESEARCHER_DIR,
  SUITE_8_DIR,
  type ScpMode,
} from '../../lib/scp/scpInstance';

interface InitOptions {
  mode: string;
  diamond?: string;
}

export function initSubcommand(): Command {
  const cmd = new Command('init');
  cmd
    .description(
      'Create a new SCP Suite 8 instance · clone-and-rename from SCP Researcher templates',
    )
    .argument('<designation>', 'User-chosen designation for the new SCP S8 (e.g., MicahsPersonal)')
    .option('-m, --mode <mode>', 'Membership mode: Personal | Organizational | Project', 'Personal')
    .option(
      '--diamond <id>',
      'Origin Diamond ID for the instance trajectory (default: SCP-5-Init)',
      'SCP-5-Init',
    )
    .action((designation: string, options: InitOptions) => {
      if (!validateMode(options.mode)) {
        console.error(
          `Invalid mode: "${options.mode}". Must be Personal, Organizational, or Project.`,
        );
        process.exit(1);
      }
      const cwd = process.cwd();
      const templatesDir = path.join(cwd, SUITE_8_DIR, SCP_RESEARCHER_DIR, 'Templates');
      if (!existsSync(templatesDir)) {
        console.error(
          `SCP Researcher templates not found at ${templatesDir}.\nMake sure you are running this from a directory where Diamond SCP-3 has landed (cwd should contain Cascades/8_SUITES/SCP Researcher/Templates/).`,
        );
        process.exit(1);
      }

      const result = createScpInstance({
        cwd,
        designation,
        mode: options.mode as ScpMode,
        originDiamond: options.diamond ?? 'SCP-5-Init',
        originDate: today(),
      });

      if (!result.ok) {
        console.error('Failed to create SCP Suite 8 instance:');
        for (const err of result.errors) console.error(`  · ${err}`);
        process.exit(1);
      }

      console.log(`✓ SCP Suite 8 created`);
      console.log(`  Designation: ${designation}`);
      console.log(`  Mode:        ${options.mode}`);
      console.log(`  Location:    ${result.instancePath}`);
      console.log('');
      console.log('Files written:');
      for (const f of result.filesWritten) console.log(`  · ${f}`);
      console.log('');
      console.log('Next steps:');
      console.log(`  · Review Cascades/8_SUITES/${designation}/Instance.md`);
      console.log(
        `  · Edit Cascades/8_SUITES/${designation}/Skill.md to declare instance-specific overrides`,
      );
      console.log(`  · Register the instance in Cascades/SUITE8-REGISTRY.md (manual for now)`);
    });
  return cmd;
}

function today(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
