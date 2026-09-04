#!/usr/bin/env node
// TOH-12 · BREAK 6 · THE BUILD-IDENTITY STAMP (deploy-drift witness).
//
// The wound: the globally-installed `scs` (built 2026-08-13) and the dev repo's build
// (2026-08-18) BOTH report `0.950.2` — a build wearing a version it does not carry
// defeats every freshness check in the field. This stamp makes builds distinguishable:
// every `npm run build` writes dist/build-identity.json ({version, builtAt, gitSha}),
// and the CLI's --version output carries it. A dist WITHOUT the stamp is, from now on,
// self-identifying as an unstamped (pre-epoch or hand-rolled) build.
//
// Deliberately tiny (stamp only): fixing the deployed global build is the USER'S
// release act, never this script's.
'use strict';
const { writeFileSync, readFileSync, existsSync, mkdirSync } = require('node:fs');
const { resolve } = require('node:path');
const { execSync } = require('node:child_process');

const repoRoot = resolve(__dirname, '..');
const distDir = resolve(repoRoot, 'dist');
const pkg = JSON.parse(readFileSync(resolve(repoRoot, 'package.json'), 'utf8'));

let gitSha = 'unknown';
try {
  gitSha = execSync('git rev-parse --short HEAD', { cwd: repoRoot, stdio: ['ignore', 'pipe', 'ignore'] })
    .toString()
    .trim();
} catch {
  /* not a git checkout (npm tarball build) — 'unknown' is honest */
}

if (!existsSync(distDir)) mkdirSync(distDir, { recursive: true });
const stamp = {
  version: pkg.version,
  builtAt: new Date().toISOString(),
  gitSha,
};
const outPath = resolve(distDir, 'build-identity.json');
writeFileSync(outPath, JSON.stringify(stamp, null, 2) + '\n', 'utf8');
console.log(`[build-identity] ${stamp.version} · ${stamp.builtAt} · ${stamp.gitSha} → ${outPath}`);
