'use strict';

// C947 · THE NAMED ENVIRONMENT (the Dev Lane) · THE ONE SHARED DERIVATION.
//
// Plain CommonJS on purpose: bin/scs.js (the launcher, no TS) AND the TS tree
// (src/lib/bridge/workspaceSocket.model.ts re-exports this) both REQUIRE this file —
// the C416 by-hand inline mirror is retired. Change the derivation HERE and only here.
//
// The Environment Carrier: `SCS_ENV` — established ONCE by the launcher from
// `--name <Env>` — and ONLY that flag (C1083: the calling name is never a name; `scs-dev`
// is an npm link to this launcher, not a variant) — and inherited by the whole
// process tree (daemon → Electron → nodemon lanes → hooks) because every spawn passes
// `env: process.env`. Prod = SCS_ENV unset/empty → every derivation collapses to the
// pre-C947 value (existing userData dirs, sockets and sinks keep their names).

const path = require('node:path');
const os = require('node:os');
const crypto = require('node:crypto');

const ENV_VAR = 'SCS_ENV';
const NAME_FLAG = '--name';

/** The environment name this process runs under ('' = production, the default lane). */
function environmentName() {
  const v = process.env[ENV_VAR];
  return typeof v === 'string' ? v.trim() : '';
}

/**
 * Resolve the environment name from the launcher's argv (+ how it was called).
 * `--name X` / `--name=X`; else '' (production — the unnamed conventional seat).
 * C1083: the calling name is NOT consulted. `scs-dev` is an npm link, so an unnamed
 * `scs-dev` and an unnamed `scs` are the SAME seat; only `--name` spaces a second
 * instance in one directory (the user's law: a name is for a duplicate CLI in the same dir).
 * Returns { name, argv } with the --name flag STRIPPED from argv (downstream parsers
 * never see it — the carrier is SCS_ENV, not argv).
 */
function resolveEnvironmentName(argv) {
  const out = [];
  let name = '';
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === NAME_FLAG && i + 1 < argv.length) {
      name = String(argv[i + 1]).trim();
      i += 1;
      continue;
    }
    if (typeof a === 'string' && a.startsWith(NAME_FLAG + '=')) {
      name = a.slice(NAME_FLAG.length + 1).trim();
      continue;
    }
    out.push(a);
  }
  return { name, argv: out };
}

/**
 * The per-workspace singleton key — sha1(cwd) short-hash, FOLDED with the environment
 * name when one is set. The same ground every workspace-scoped primitive trusts
 * (the C410 lock userData · the CSSP socket · the C402 origin read).
 */
function workspaceSingletonKey(cwd, env) {
  const c = typeof cwd === 'string' ? cwd : process.cwd();
  const e = typeof env === 'string' ? env : environmentName();
  const material = e ? c + '\0' + e : c;
  return crypto.createHash('sha1').update(material).digest('hex').slice(0, 12);
}

/** The per-workspace CSSP control-socket path (Unix .sock anor Windows named pipe). */
function csspSocketPath(cwd, env) {
  const key = workspaceSingletonKey(cwd, env);
  return process.platform === 'win32'
    ? '\\\\.\\pipe\\scs-bridge-' + key
    : path.join(os.tmpdir(), 'scs-bridge-' + (process.getuid ? process.getuid() : 'user') + '-' + key + '.sock');
}

/** The sink segment: '' for production, the environment name otherwise (Cascades/Bridge/<Env>/). */
function environmentSegment(env) {
  const e = typeof env === 'string' ? env : environmentName();
  return e ? e : '';
}

/**
 * The N4 link (the user's ruling C947): the CURRENT variables stay canonical downstream.
 * The launcher resolves `<ENV>_SCS_*` → `SCS_*` INTO the child environment ONCE, so every
 * consumer keeps reading `SCS_*` unchanged, and a production launch (no name) never sees a
 * namespaced pin. Returns the list of variables that were linked (for the boot log).
 */
function linkNamespacedVariables(env, target) {
  const e = typeof env === 'string' ? env : environmentName();
  const t = target || process.env;
  const linked = [];
  if (!e) return linked;
  const prefix = e.toUpperCase().replace(/[^A-Z0-9]/g, '_') + '_';
  for (const key of Object.keys(t)) {
    if (!key.startsWith(prefix + 'SCS_')) continue;
    const canonical = key.slice(prefix.length);
    t[canonical] = t[key];
    linked.push(canonical);
  }
  return linked;
}

module.exports = {
  ENV_VAR,
  NAME_FLAG,
  environmentName,
  resolveEnvironmentName,
  workspaceSingletonKey,
  csspSocketPath,
  environmentSegment,
  linkNamespacedVariables,
};
