// instanceMdResolver.model.ts — SAPR path-derivation (pure, zero I/O)
// A-3 SAPR: derives the absolute path to Cascades/8_SUITES/<suite8Name>/Instance.md
// from the suite8Name (NDEP — the literal directory entry name).
// Path-derivation-over-state-lookup per Diamond A-3 §Automata Routing Option b.
//
// The bridge root is process.cwd() (same convention as paths.ts bridgeRoot()).
// The Instance.md path is therefore:
//   process.cwd() / Cascades / 8_SUITES / <suite8Name> / Instance.md
//
// This module is PURE: no imports from Stratimux, no file I/O. Callers are
// responsible for existence-checking (existsSync) before using the resolved path.

import * as path from 'node:path';

export const SUITE8_SUITES_DIR = path.join('Cascades', '8_SUITES');
export const INSTANCE_MD_FILENAME = 'Instance.md';
// ASDR · W2 spawn-prompt · the per-Suite-8 Onboard Vermillion the page-bound Anchor
// executes as its FIRST turn. Sibling to Instance.md in the same Cascades/8_SUITES/<name>/ dir.
export const ONBOARD_MD_FILENAME = 'Onboard.md';

/**
 * SAPR-NDEP: derive the absolute path to a Suite 8's Instance.md from its
 * NDEP name (the literal Cascades/8_SUITES/<name>/ directory entry).
 *
 * cwdOverride is provided for tests (avoids process.cwd() capture at test time).
 */
export function resolveSuite8InstanceMd(
  suite8Name: string,
  cwdOverride?: string,
): string {
  const root = cwdOverride ?? process.cwd();
  return path.join(root, SUITE8_SUITES_DIR, suite8Name, INSTANCE_MD_FILENAME);
}

/**
 * ASDR · W2 · derive the absolute path to a Suite 8's Onboard.md from its NDEP name —
 * the name-resolved Onboard Vermillion delivered as the spawned Anchor's INITIAL
 * positional prompt. Parallel to resolveSuite8InstanceMd (same dir, sibling file).
 * Absent Onboard.md → caller gates on existsSync → graceful no-prompt spawn.
 *
 * Citation: ANCHOR-SELF-DIRECTION-ROUTINE-WGB.md §6 decision (a) · §7 W2.
 */
export function resolveSuite8OnboardMd(
  suite8Name: string,
  cwdOverride?: string,
): string {
  const root = cwdOverride ?? process.cwd();
  return path.join(root, SUITE8_SUITES_DIR, suite8Name, ONBOARD_MD_FILENAME);
}

// C378 · THE ONBOARD SOVEREIGNTY THREAD (mirror of resolveComposedAppendPath's
// MD-1 scpRoot re-root, applied to the Onboard.md READ). An SCP-resident Suite 8
// (e.g. Entourage Forge — the MD-2 sovereignty mirror) keeps its Onboard.md in the
// SCP's OWN Cascades/8_SUITES/<name>/ — 0 copies at the workspace root. The single-
// path resolveSuite8OnboardMd(name, scpDir) picked the SCP dir XOR the workspace
// root, so a defined-but-absent SCP-local Onboard.md spawned the anchor BARE (no
// fall-through to the workspace copy). This resolver tries BOTH grounds in order —
// SCP-local FIRST, workspace root SECOND — and NAMES which ground resolved so the
// spawn telemetry can report its seed source.

export type OnboardResolveGround = 'scp-local' | 'workspace' | 'absent';

export interface OnboardResolution {
  /** The absolute Onboard.md path to READ (the first ground that exists), or the
   *  last-tried path when ground='absent' (caller gates on ground, not existence). */
  path: string;
  /** Which ground resolved — scp-local (SCP's own dir), workspace (process.cwd),
   *  or absent (neither existed → graceful no-seed spawn). */
  ground: OnboardResolveGround;
  /** The SCP-local path tried (undefined when no scpDir was supplied). */
  scpLocalPath?: string;
  /** The workspace-root path tried (always computed). */
  workspacePath: string;
}

/**
 * C378 · resolve the anchor's Onboard.md across the two sovereignty grounds.
 * SCP-local FIRST (scpDir/Cascades/8_SUITES/<name>/Onboard.md), workspace SECOND
 * (process.cwd()/...). Returns the resolved path + which ground won so the caller
 * can emit `onboard.resolve` telemetry naming the seed source. Both absent →
 * ground='absent' (the current no-seed behavior · the spawn never breaks).
 *
 * PURE: the existence probe is injected (exists) so the model stays zero-I/O and
 * unit-testable; cli-handler passes node:fs existsSync.
 *
 * @param scpDir   the SCP install dir (resolveScpDir result) · undefined ⇒ skip the
 *                 SCP-local ground entirely and resolve at the workspace root only.
 * @param cwdOverride  the workspace root (tests pass a temp dir); defaults to cwd.
 */
export function resolveSuite8OnboardMdAcrossGrounds(
  suite8Name: string,
  scpDir: string | undefined,
  exists: (p: string) => boolean,
  cwdOverride?: string,
): OnboardResolution {
  const workspacePath = resolveSuite8OnboardMd(suite8Name, cwdOverride);
  const scpLocalPath =
    scpDir && scpDir.length > 0 ? resolveSuite8OnboardMd(suite8Name, scpDir) : undefined;

  // Ground 1 · SCP-local (the Sovereignty Boundary) — tried FIRST when present.
  if (scpLocalPath && exists(scpLocalPath)) {
    return { path: scpLocalPath, ground: 'scp-local', scpLocalPath, workspacePath };
  }
  // Ground 2 · workspace root — the fall-through.
  if (exists(workspacePath)) {
    return { path: workspacePath, ground: 'workspace', scpLocalPath, workspacePath };
  }
  // Both absent · graceful no-seed spawn. Report the SCP-local as the last-tried
  // path when a scpDir was supplied (the primary intent), else the workspace path.
  return {
    path: scpLocalPath ?? workspacePath,
    ground: 'absent',
    scpLocalPath,
    workspacePath,
  };
}

// SMO · the generic Shatterite Menu How doc — shipped beside the bridge model
// files (SOURCE tree), NOT a per-install Cascades artifact.
export const SHATTERITE_MENU_MD_FILENAME = 'ShatteriteMenu.md';

/**
 * SMO · resolve the absolute path to the shared, generic Shatterite Menu How doc.
 *
 * UNLIKE resolveSuite8OnboardMd (per-Suite-8, cwd-rooted under Cascades/8_SUITES/),
 * this is a FIXED path beside THIS bridge lib module, so it resolves correctly
 * regardless of the process cwd. The .md lives in the source tree next to the model
 * files (src/lib/bridge/ShatteriteMenu.md), so it is resolved against __dirname —
 * the codebase's native CJS dirname idiom (tsconfig module = CommonJS; dev:self runs
 * via tsx → CJS, where __dirname is the directory of the executing module). Mirrors
 * the existing __dirname usage in server.principle.ts. The dirnameOverride param
 * keeps the function pure-testable.
 */
export function resolveShatteriteMenuMd(dirnameOverride?: string): string {
  const here = dirnameOverride ?? __dirname;
  return path.join(here, SHATTERITE_MENU_MD_FILENAME);
}
