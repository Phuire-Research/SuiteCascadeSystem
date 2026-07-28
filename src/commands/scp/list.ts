// Diamond SCP-5 · `scs scp list` subcommand
//
// Enumerates SCP Suite 8 instances under cwd's Cascades/8_SUITES/ directory.
// Reads each candidate Suite 8's Instance.md and includes it if it declares
// `**Mode**: Personal|Organizational|Project`. Excludes SCP Researcher (the
// meta-Suite-8 type spec; it is not an instance).
//
// Read-only operation. Exit 0 on success (including empty list).

import { Command } from 'commander';
import { listScpInstances, type ScpInstance } from '../../lib/scp/scpInstance';

export function listSubcommand(): Command {
  const cmd = new Command('list');
  cmd.description('List SCP Suite 8 instances registered in this project').action(() => {
    const cwd = process.cwd();
    const instances = listScpInstances(cwd);
    if (instances.length === 0) {
      console.log('No SCP Suite 8 instances found in Cascades/8_SUITES/.');
      console.log('  Use `scs scp init <designation>` to create one.');
      return;
    }
    printInstances(instances);
  });
  return cmd;
}

function printInstances(instances: ScpInstance[]): void {
  const designationWidth = Math.max(11, ...instances.map((i) => i.designation.length));
  const modeWidth = 14;
  const runtimeWidth = 24;
  const sep = `${'-'.repeat(designationWidth)} · ${'-'.repeat(modeWidth)} · ${'-'.repeat(
    runtimeWidth,
  )}`;
  console.log('SCP Suite 8 Instances');
  console.log('');
  console.log(
    `${'Designation'.padEnd(designationWidth)} · ${'Mode'.padEnd(modeWidth)} · ${'Runtime'.padEnd(
      runtimeWidth,
    )}`,
  );
  console.log(sep);
  for (const inst of instances) {
    console.log(
      `${inst.designation.padEnd(designationWidth)} · ${String(inst.mode).padEnd(modeWidth)} · ${(
        inst.runtimePath ?? '(unknown)'
      ).padEnd(runtimeWidth)}`,
    );
  }
  console.log('');
  console.log(`${instances.length} instance(s) found.`);
}
