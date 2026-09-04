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
import { bridgeRoot, bridgeLogDir } from '../paths';

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
export function resolvePackageRoot(cliPathOverride?: string): string {
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

// GUARD 8 (RESUME INDUCTION · Lane 7) · THE ONE PACKAGE-ROOT HELPER. Three
// independently-maintained resolvers previously guessed the package root (paths.ts's
// F3 pin, resolvePackageRoot above, and cli-handler's own copy inside
// resolveDockContent) — and only the third carried the C755 second candidate, so a
// packaging change could silently blank ONE layer while the others stayed correct.
// The DUAL CANDIDATE lives here now and dockContent.ts reads through it.
//
// Candidate 1 — argv[1]-derived (dist/cli.cjs → grandparent = package root).
// Candidate 2 — C755 · THE DEV-BRIDGE FALLBACK RUNG: under the DEV electron launch
//   argv[1] is the app DIRECTORY (not dist/cli.cjs), so the argv-derived root lands a
//   level too high. The bundled module lives at dist/main/, so __dirname/../.. IS the
//   package root.
// Order is load-bearing (argv FIRST); an empty argv[1] yields NO candidates, exactly as
// the relocated cli-handler body did (`if (!rawPath) return ''`).
export function resolvePackageRootCandidates(cliPathOverride?: string): string[] {
  const rawPath = cliPathOverride ?? process.argv[1] ?? '';
  if (!rawPath) return [];
  let cliPath: string;
  try {
    cliPath = realpathSync(rawPath);
  } catch {
    cliPath = rawPath;
  }
  return [
    path.resolve(path.dirname(cliPath), '..'),
    path.resolve(__dirname, '..', '..'),
  ];
}

function resolveSkeletonPath(cliPathOverride?: string): string {
  return path.join(resolvePackageRoot(cliPathOverride), SKELETON_REL);
}

// Deterministic generated-instance path · sibling to bridge.json under bridgeRoot().
export function resolveGeneratedBasePromptPath(): string {
  // C1076 · PER ENVIRONMENT SEGMENT. The generated base carries THIS bridge's endpoint and port; written at the
  // shared root, a named bridge's boot overwrote the unnamed production bridge's copy (measured: production's
  // sessions received Dev's `ENDPOINT …:7113/mcp`). The segment dir (Cascades/Bridge/<Env>/) is the same sink
  // the logs and the named sessions already use; production stays at the root, unchanged.
  return path.join(bridgeLogDir(), GENERATED_NAME);
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
  const generated = renderBaseSystemPrompt(endpoint, port, cliPathOverride);
  const outPath = resolveGeneratedBasePromptPath();
  writeFileSync(outPath, generated, 'utf8');
  return outPath;
}

// RESUME INDUCTION · THE FIRE-TIME LAW (the user, C1088): "the Resume Always Calls for
// the Most Recent of All the Files we are Joining for the Dock." composeAppendedSystemPrompt
// REGENERATES this layer at every compose, so the substitution must be reachable WITHOUT
// the write — same skeleton, same tokens, one law (generateBaseSystemPrompt above now
// renders through it, so startup and fire time can never drift). Pure read + substitute:
// throws only when the skeleton itself is unreadable (the caller degrades to the on-disk
// base — the spawn never breaks).
export function renderBaseSystemPrompt(
  endpoint: string,
  port: number,
  cliPathOverride?: string,
): string {
  const skeleton = readFileSync(resolveSkeletonPath(cliPathOverride), 'utf8');
  return skeleton
    .replace(/\{\{BRIDGE_ENDPOINT\}\}/g, endpoint)
    .replace(/\{\{BRIDGE_PORT\}\}/g, String(port));
}
