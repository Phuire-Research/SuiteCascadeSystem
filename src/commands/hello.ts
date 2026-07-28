import { Command } from 'commander';
import { greet } from '../lib/core';

export function helloCommand(): Command {
  const cmd = new Command('hello');

  cmd
    .description('Print a greeting')
    .argument('[name]', 'Name to greet', 'World')
    .action((name: string) => {
      console.log(greet(name));
    });

  return cmd;
}
