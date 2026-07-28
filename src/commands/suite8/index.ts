// MD-1 · The `scs suite8:page` verb surface.
//
// One verb under the suite8 namespace. The colon-name IS the leaf; this dir IS
// the namespace for future suite8:* verbs (MD-3). Decision c: NOT a parent-with-
// subcommands — `suite8Command()` returns the single `suite8:page` Command
// directly. If MD-3 adds verbs, this becomes a parent; the dir already supports
// that growth.

import { Command } from 'commander';
import { suite8PageCommand } from './page';

export function suite8Command(): Command {
  return suite8PageCommand();
}
