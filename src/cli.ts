import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { Command } from 'commander';
import { helloCommand } from './commands/hello';
import { bridgeCommand } from './commands/bridge/index';
import { hookCommand } from './commands/__hook';
import { uninstallCommand } from './commands/uninstall';
import { scpCommand } from './commands/scp';
import { suite8Command } from './commands/suite8';
import { devCommand } from './commands/dev';
import { startAnimatedTui } from './lib/tui';
import { setDebugEnabled } from './lib/bridge/debugLog';

const pkgPath = resolve(__dirname, '../package.json');
const pkg = JSON.parse(readFileSync(pkgPath, 'utf8')) as { version: string };

// TOH-12 · BREAK 6 · the build-identity stamp (deploy-drift witness). The built cli.cjs
// sits in dist/ beside build-identity.json (written by bin/stamp-build-identity.js on
// every `npm run build`); --version therefore names the BUILD, not just the package —
// a stale deploy can no longer wear a fresher version string. Absent stamp (a dev tsx
// run, or a pre-epoch build) reports itself honestly as unstamped.
let buildIdentity = 'unstamped build';
try {
  const stamp = JSON.parse(readFileSync(resolve(__dirname, 'build-identity.json'), 'utf8')) as {
    builtAt?: string;
    gitSha?: string;
  };
  if (typeof stamp.builtAt === 'string') {
    buildIdentity = `build ${stamp.builtAt}${typeof stamp.gitSha === 'string' ? ` · ${stamp.gitSha}` : ''}`;
  }
} catch {
  /* no stamp beside this entry point — honest 'unstamped build' */
}

const program = new Command();

program
  .name('scs')
  .description('Suite Cascade System CLI')
  .version(`${pkg.version} (${buildIdentity})`)
  .option('--debug', 'Pipe trace events to ./Cascades/Bridge/debug.log')
  .hook('preAction', (thisCommand) => {
    if (thisCommand.opts().debug) setDebugEnabled(true);
  });

program.action(async () => {
  if (program.opts().debug) setDebugEnabled(true);
  await startAnimatedTui();
});

program.addCommand(helloCommand());
program.addCommand(bridgeCommand());
program.addCommand(uninstallCommand());
program.addCommand(scpCommand());
program.addCommand(suite8Command());
program.addCommand(devCommand());
program.addCommand(hookCommand(), { hidden: true });

program.parseAsync(process.argv).catch((err: unknown) => {
  if (err instanceof Error) {
    console.error(err.message);
  } else {
    console.error('Unknown error');
  }
  process.exit(1);
});
