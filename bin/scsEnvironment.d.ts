// C947 · type surface of bin/scsEnvironment.js — the one shared derivation (see the .js).
export const ENV_VAR: 'SCS_ENV';
export const NAME_FLAG: '--name';
export function environmentName(): string;
export function resolveEnvironmentName(argv: readonly string[]): { name: string; argv: string[] };
export function workspaceSingletonKey(cwd?: string, env?: string): string;
export function csspSocketPath(cwd?: string, env?: string): string;
export function environmentSegment(env?: string): string;
export function linkNamespacedVariables(env?: string, target?: NodeJS.ProcessEnv): string[];
