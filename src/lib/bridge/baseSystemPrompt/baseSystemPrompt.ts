// baseSystemPrompt.ts — SSGH plumbing (Static Skeleton + Generated Instance)
// RM-D2 R3 Yellow §D.3 · R6 Purple NOTE-2/NOTE-4 · Cycle 168.
//
// This is BRIDGE INFRA, NOT a .model.ts — it does file I/O (reads the committed
// skeleton, writes the generated instance), so it is a plumbing module, not a pure
// transform.
//
// Two responsibilities:
//   generateBaseSystemPrompt(endpoint, port)  — called ONCE at bridge startup, after
//     bridge.json is written (port known). Reads the skeleton, substitutes the live
//     {{BRIDGE_ENDPOINT}} / {{BRIDGE_PORT}} tokens, writes scs-bridge-base.generated.md
//     to bridgeRoot() (sibling to bridge.json).
//   resolveGeneratedBasePromptPath() — computes the deterministic generated-instance
//     path (bridgeRoot() + GENERATED_NAME). Existence is guaranteed by startup
//     generation; cli-handler treats an absent file as a graceful no-append.
//
// SKELETON LOCATION (R6 NOTE-4 resolution): the build is tsup → format ['cjs'],
// which BUNDLES src/main/index.ts (which transitively imports this module) into
// dist/main/index.js. After bundling, neither __dirname nor import.meta.url points
// at src/lib/bridge/baseSystemPrompt/ — both resolve into dist/. The committed
// skeleton .md is NOT copied into dist/. Therefore the skeleton is located via the
// PACKAGE ROOT, using the same realpathSync(process.argv[1]) → dist/cli.cjs →
// grandparent convention proven in bridgeVersion.ts:getBridgeVersion (DVSP/SRRP).
// This is format-agnostic (works for cjs or esm) AND bundling-surviving. The
// R6 ESM __dirname concern is subsumed: the real hazard is bundling, which this
// resolution avoids entirely.

import { readFileSync, writeFileSync, realpathSync } from 'node:fs';
import * as path from 'node:path';
import { bridgeRoot } from '../paths';

const GENERATED_NAME = 'scs-bridge-base.generated.md';

// Skeleton committed at assets/baseSystemPrompt/scs-bridge-base.skeleton.md.
// Relative to the PACKAGE ROOT (the dir holding package.json / src / dist).
// RELEASE W1: relocated from src/lib/bridge/baseSystemPrompt/ — src/ never ships
// in the npm tarball (files array), so a src-resident skeleton ENOENTs at first
// bridge startup for every global-install user. assets/ ships.
const SKELETON_REL = path.join(
  'assets',
  'baseSystemPrompt',
  'scs-bridge-base.skeleton.md',
);

// Resolve the package root the same way getBridgeVersion (bridgeVersion.ts) resolves
// it: process.argv[1] is the cli entry (e.g. dist/cli.cjs, possibly a symlink);
// realpathSync resolves the symlink; the package root is its grandparent
// (dist/cli.cjs → <root>). Optional override for tests / direct callers.
function resolvePackageRoot(cliPathOverride?: string): string {
  const rawPath = cliPathOverride ?? process.argv[1] ?? '';
  if (!rawPath) {
    // Last-resort: assume the process cwd is the package root (dev / test).
    return process.cwd();
  }
  let cliPath: string;
  try {
    cliPath = realpathSync(rawPath);
  } catch {
    cliPath = rawPath;
  }
  // dist/cli.cjs → package root is one level up from dist/.
  return path.resolve(path.dirname(cliPath), '..');
}

function resolveSkeletonPath(cliPathOverride?: string): string {
  return path.join(resolvePackageRoot(cliPathOverride), SKELETON_REL);
}

// Deterministic generated-instance path · sibling to bridge.json under bridgeRoot().
export function resolveGeneratedBasePromptPath(): string {
  return path.join(bridgeRoot(), GENERATED_NAME);
}

// Called ONCE at bridge startup, immediately after writeBridgeMetadata (port known).
// Reads the skeleton, substitutes the live endpoint/port tokens, writes the
// generated instance. The bridgeRoot() dir is guaranteed to exist by the
// mkdir({ recursive: true }) inside writeBridgeMetadata (R6 OV-4).
export function generateBaseSystemPrompt(
  endpoint: string,
  port: number,
  cliPathOverride?: string,
): string {
  const skeleton = readFileSync(resolveSkeletonPath(cliPathOverride), 'utf8');
  const generated = skeleton
    .replace(/\{\{BRIDGE_ENDPOINT\}\}/g, endpoint)
    .replace(/\{\{BRIDGE_PORT\}\}/g, String(port));
  const outPath = resolveGeneratedBasePromptPath();
  writeFileSync(outPath, generated, 'utf8');
  return outPath;
}
