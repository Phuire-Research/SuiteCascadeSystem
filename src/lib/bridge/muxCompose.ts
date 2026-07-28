// Diamond B-24 (CD-88 CNRPFT · Compose-Not-Replace-Per-File-Type-Rules):
// The executable ruleset for muxifying SCS additions WITH user's pre-existing
// Claude Code state — never replacing. Four file types, four rules:
//   - CLAUDE.md (root + .claude/) → delimited append (idempotent across versions)
//   - .claude/agents/             → SCS agents land at scs-*.md sub-namespace
//   - .claude/commands/           → SCS commands land at scs-*.md sub-namespace
//   - .claude/settings.json       → additive merge (user wins on collision)
//
// Pattern 4 Modulation: filesystem-only operations within user cwd.
// All four functions return a ManifestFileEntry for B-25 reverse-muxify contract.

import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import * as path from 'node:path';
import { SCS_AGENT_PREFIX, SCS_COMMAND_PREFIX } from './installConstants';
import type { ManifestFileEntry } from './icedManifest';
import { log } from './debugLog';

// Diamond B-24-FIX (CD-88 CNRPFT updated · DROP-IN replaces delimited append):
// SCS Manifold is a TIGHT manifold honoring Claude Code's 40K project-memory
// budget. User content is NOT appended above SCS content; instead `.claude/CLAUDE.md`
// becomes SCS content ALONE (drop-in replace). User's prior content is preserved
// in `Cascades/Iced/PreInstallSnapshot/{ts}/` and muxified into a Suite 8 by
// the install agent's Strategy S7 (NOT by the bridge).
//
// Returns ManifestFileEntry with action='replaced' (existing user content) OR
// 'created' (no prior file).
//
// SUPERSEDES B-24 `composeClaudeMd` — that function is removed because delimited
// append violated the 40K budget constraint and conflated bridge work
// (filesystem scaffolding) with agent work (intelligent muxification of user
// content into Suite 8 form).
export function dropInClaudeMd(
  targetPath: string,
  scsContent: string,
  relPathInManifest: string,
): ManifestFileEntry {
  const preInstallExisted = existsSync(targetPath);
  // Ensure parent dir exists
  const parent = path.dirname(targetPath);
  if (!existsSync(parent)) mkdirSync(parent, { recursive: true });
  writeFileSync(targetPath, scsContent, 'utf8');

  const action: 'created' | 'replaced' = preInstallExisted ? 'replaced' : 'created';
  log('mux-compose.claudemd.drop-in', { targetPath, action, bytes: scsContent.length });
  return {
    relPath: relPathInManifest,
    action,
    preInstallExisted,
  };
}

// Diamond B-24 (CD-93 ASNCPP · Agent Sub-Namespace):
// Copy SCS agents from clone source to user's .claude/agents/ with `scs-` prefix.
// User's pre-existing agents (e.g., my-reviewer.md) are NEVER touched — collision
// prevention is structural via prefix.
//
// Returns array of ManifestFileEntry — one per copied SCS agent.
export function namespaceAgents(
  cloneAgentsDir: string,
  userAgentsDir: string,
): ManifestFileEntry[] {
  return namespaceFiles(cloneAgentsDir, userAgentsDir, SCS_AGENT_PREFIX, '.claude/agents');
}

// Diamond B-24 (CD-93 ASNCPP · Command Sub-Namespace):
// Same pattern as namespaceAgents, applied to commands. Flat namespace
// (Claude Code expects flat .claude/commands/*.md discovery).
// Diamond ζ Option X: commands install WITHOUT the scs- prefix · the Cascade
// IS the doing of SCS · `/cascade` is the canonical Lambda anchor (R0 GT
// statements). SCS_COMMAND_PREFIX retained as legacy export for any opt-in
// future use · but namespaceCommands passes empty string here. Recursive flag
// added so `cascade/` subdir (with /cascade:hello, /cascade:loop, etc.) is
// copied · was silently dropped under ASNCPP (GT-2 Polarity Flip at sub-cmd layer).
export function namespaceCommands(
  cloneCommandsDir: string,
  userCommandsDir: string,
): ManifestFileEntry[] {
  return namespaceFiles(cloneCommandsDir, userCommandsDir, '', '.claude/commands', true);
}

// Diamond ζ Option X: `recursive` flag added so command subdirectories
// (e.g. `.claude/commands/cascade/` with /cascade:hello, /cascade:loop, etc.)
// are no longer silently dropped (R0 Obsidian GT-2 · the install-time
// Diameter break). When prefix is the empty string, no rename occurs —
// preserves the canonical anchor (e.g. `cascade.md` stays `cascade.md`).
function namespaceFiles(
  srcDir: string,
  destDir: string,
  prefix: string,
  manifestPathPrefix: string,
  recursive = false,
): ManifestFileEntry[] {
  if (!existsSync(srcDir)) return [];
  if (!existsSync(destDir)) mkdirSync(destDir, { recursive: true });

  const entries: ManifestFileEntry[] = [];
  const items = readdirSync(srcDir);
  for (const item of items) {
    const srcPath = path.join(srcDir, item);
    const stat = statSync(srcPath);
    // ζ: recurse into subdirectories (preserve directory structure · no prefix
    // on the directory name itself · files inside MAY get prefix if applicable)
    if (stat.isDirectory()) {
      if (!recursive) continue;
      const subEntries = namespaceFiles(
        srcPath,
        path.join(destDir, item),
        prefix,
        path.posix.join(manifestPathPrefix, item),
        recursive,
      );
      entries.push(...subEntries);
      continue;
    }
    if (!item.endsWith('.md')) continue;
    // ζ: prefix application only when non-empty · empty prefix = pure copy
    // (preserves canonical anchor names like `cascade.md`). Idempotence guard
    // retained for the non-empty case (handles re-muxify safely).
    let destName: string;
    if (prefix.length === 0) {
      destName = item;
    } else {
      destName = item.startsWith(prefix) ? item : `${prefix}${item}`;
    }
    const destPath = path.join(destDir, destName);
    const preInstallExisted = existsSync(destPath);
    copyFileSync(srcPath, destPath);
    entries.push({
      relPath: path.posix.join(manifestPathPrefix, destName),
      action: preInstallExisted ? 'appended' : 'created', // 'appended' covers re-muxify overwrite
      preInstallExisted,
    });
  }
  log('mux-compose.namespace', {
    srcDir,
    destDir,
    prefix,
    recursive,
    copied: entries.length,
  });
  return entries;
}

// Diamond B-24 (CD-88 CNRPFT · settings.json additive merge):
// Add SCS-required hooks/permissions to user's settings.json.
// Rules:
//   - User wins on every key collision (SCS additions only fill gaps)
//   - hooks[] are concatenated (SCS appends; user's hooks stay first)
//   - Invalid JSON → fail-fast with clear error
// Returns ManifestFileEntry with action='merged' and scsAdditions listing
// keys/items SCS added (B-25 reverse uses this to remove ONLY SCS additions).
export function mergeSettingsJson(
  targetPath: string,
  scsHooks: unknown[],
  scsPermissionsAllow: string[] = [],
): ManifestFileEntry {
  const preInstallExisted = existsSync(targetPath);
  let userSettings: Record<string, unknown> = {};

  if (preInstallExisted) {
    try {
      const raw = readFileSync(targetPath, 'utf8');
      userSettings = (JSON.parse(raw) as Record<string, unknown>) ?? {};
    } catch (err) {
      throw new Error(
        `mergeSettingsJson: invalid JSON at ${targetPath} — ${
          err instanceof Error ? err.message : String(err)
        }`,
      );
    }
  }

  const scsAdditions: string[] = [];

  // Merge hooks (additive append)
  if (scsHooks.length > 0) {
    const userHooks = Array.isArray(userSettings.hooks) ? (userSettings.hooks as unknown[]) : [];
    userSettings.hooks = [...userHooks, ...scsHooks];
    scsAdditions.push(`hooks[+${scsHooks.length}]`);
  }

  // Merge permissions.allow (additive · dedup)
  if (scsPermissionsAllow.length > 0) {
    const perms = (userSettings.permissions as Record<string, unknown> | undefined) ?? {};
    const userAllow = Array.isArray(perms.allow) ? (perms.allow as string[]) : [];
    const merged = Array.from(new Set([...userAllow, ...scsPermissionsAllow]));
    perms.allow = merged;
    userSettings.permissions = perms;
    const added = scsPermissionsAllow.filter((p) => !userAllow.includes(p));
    if (added.length > 0) scsAdditions.push(`permissions.allow[+${added.length}]`);
  }

  const parent = path.dirname(targetPath);
  if (!existsSync(parent)) mkdirSync(parent, { recursive: true });
  writeFileSync(targetPath, JSON.stringify(userSettings, null, 2) + '\n', 'utf8');

  log('mux-compose.settings', { targetPath, scsAdditions });
  return {
    relPath: '.claude/settings.json',
    action: 'merged',
    preInstallExisted,
    scsAdditions,
  };
}
