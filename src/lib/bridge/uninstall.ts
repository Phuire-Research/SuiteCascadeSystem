// Diamond B-26 (CD-114 IPRM · Iced-Preserving-Reverse-Muxify):
// Manifest-driven SCS Bridge uninstall · reverses install operations per
// MuxificationManifest.json action enum · preserves Cascades/Iced/ as the
// install record (Snapshot + Manifest + UserSCSConfig persist for re-install).
//
// LOAD-BEARING PRINCIPLE (CD-120 PFND · Preservation-First-Not-Deletion):
// uninstall and reinstall are not opposites — they traverse the same Diameter
// with Iced/ as the pivot. SCS install is reversible · the reversal preserves
// enough state that the install can return without re-meeting-from-scratch.
//
// Atomicity: best-effort with per-step error accumulation (Suite 4 Green B-26
// Angle 6 verdict). Forward-only operation — no rollback. Failed steps are
// reported in errors[] · Iced/ preservation is structural (skip-list, not
// fallible).

import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs';
import * as path from 'node:path';
import {
  SCS_CLAUDEMD_DELIMITER_OPEN_PREFIX,
  SCS_CLAUDEMD_DELIMITER_CLOSE,
  SCS_AGENT_PREFIX,
  SCS_COMMAND_PREFIX,
  ICED_DIR_NAME,
} from './installConstants';
import { icedSnapshotRoot, readManifest, type ManifestFileEntry } from './icedManifest';
import { log } from './debugLog';

export type UninstallResult = {
  ulid: string;
  reversedFiles: number;
  preservedIced: boolean;
  removedDirs: string[];
  errors: string[];
};

// Diamond B-26-PEWTER hotfix (v0.36.3 · CD-127 RDDU · Retained-Data-Dirs-on-Uninstall):
// User directive (verbatim): "Let's Retain: 8_SUITES, Working, Documentation as it's
// Just Data the User May Access. Noting Bridge can be Removed as it's the Removal of
// a Session Manager. If not User it would become Stale."
//
// Original sweep removed all 5 Cascades/ subdirs SCS scaffolds. Spot-change shrinks
// to Bridge/ only — session-manager state goes stale without SCS · everything else
// is user data (Suite 8 templates · Diamond/Onyx WGBs · reference docs · sandbox).
//
// Cascades/Iced/ is NOT in this list (CD-120 PFND structural invariant).
// CD-127 RDDU extends the preservation-first principle from Iced to user-data dirs.
const SCS_OWNED_CASCADE_DIRS = [
  'Cascades/Bridge', // session-manager state · stale without SCS
] as const;

const SCS_OWNED_CASCADE_FILES = [
  'Cascades/CHANGELOG.md',
  'Cascades/SUITE8-REGISTRY.md',
  'Cascades/Cascade.json',
] as const;

// Diamond B-26 (CD-114 IPRM): main entry point.
// Reverses SCS install · preserves Iced/ · returns summary.
export async function uninstallSCS(opts: {
  userCwd: string;
  scsBridgeVersion: string;
}): Promise<UninstallResult> {
  const { userCwd } = opts;
  const ulid = Date.now().toString(36).toUpperCase();
  const errors: string[] = [];
  let reversedFiles = 0;
  const removedDirs: string[] = [];

  log('uninstall.start', { ulid, userCwd });

  // Step 1: Manifest-driven per-file reversal (CD-119 SVRC · schema v1/v2/v3 backward-compat)
  const manifest = readManifest(userCwd);
  if (manifest) {
    log('uninstall.manifest.found', {
      schemaVersion: manifest.schemaVersion,
      filesCount: manifest.files.length,
    });
    const snapshotRoot = icedSnapshotRoot(userCwd);
    // preInstallSnapshotDir is e.g., "PreInstallSnapshot/20260510T120000"
    const snapshotTimestamp = manifest.preInstallSnapshotDir.split('/').pop() ?? '';
    const snapshotDir = path.join(snapshotRoot, snapshotTimestamp);

    for (const entry of manifest.files) {
      const targetPath = path.join(userCwd, entry.relPath);
      try {
        reverseEntry(entry, targetPath, snapshotDir);
        reversedFiles++;
        log('uninstall.entry.reversed', { relPath: entry.relPath, action: entry.action });
      } catch (err) {
        const msg = `reversal failed for ${entry.relPath}: ${
          err instanceof Error ? err.message : String(err)
        }`;
        errors.push(msg);
        log('uninstall.entry.error', { relPath: entry.relPath, error: msg });
      }
    }
  } else {
    log('uninstall.manifest.missing', { userCwd });
    // Manifest absent — sweep SCS dirs anyway (best-effort cleanup)
    errors.push(
      'MuxificationManifest.json not found — per-file reversal skipped; sweeping SCS dirs only',
    );
  }

  // Step 2: Sweep scs-* agents and commands (CD-93 ASNCPP discipline)
  errors.push(...sweepScsNamespaced(path.join(userCwd, '.claude', 'agents'), SCS_AGENT_PREFIX));
  errors.push(...sweepScsNamespaced(path.join(userCwd, '.claude', 'commands'), SCS_COMMAND_PREFIX));

  // Step 3: Remove B-3 *.bak files (cleanup · *.bak preserves user CLAUDE.md AT install-time;
  // post-uninstall the user's CLAUDE.md is restored via 'replaced' reversal so *.bak is redundant)
  sweepBakFiles(userCwd, errors);

  // Step 4: Remove SCS-owned Cascades/ dirs (Iced/ NOT in list · CD-120 PFND)
  for (const relDir of SCS_OWNED_CASCADE_DIRS) {
    const absDir = path.join(userCwd, relDir);
    if (existsSync(absDir)) {
      try {
        rmSync(absDir, { recursive: true, force: true });
        removedDirs.push(relDir);
        log('uninstall.dir.removed', { relDir });
      } catch (err) {
        errors.push(
          `dir removal failed for ${relDir}: ${err instanceof Error ? err.message : String(err)}`,
        );
      }
    }
  }

  // Step 5: Remove SCS-owned Cascades/ loose files
  for (const relFile of SCS_OWNED_CASCADE_FILES) {
    const absFile = path.join(userCwd, relFile);
    if (existsSync(absFile)) {
      try {
        unlinkSync(absFile);
        log('uninstall.file.removed', { relFile });
      } catch (err) {
        errors.push(
          `file removal failed for ${relFile}: ${err instanceof Error ? err.message : String(err)}`,
        );
      }
    }
  }

  // Verify Iced/ is structurally preserved (CD-120 PFND · CD-114 IPRM invariant)
  const icedDir = path.join(userCwd, 'Cascades', ICED_DIR_NAME);
  const preservedIced = existsSync(icedDir);

  log('uninstall.complete', {
    ulid,
    reversedFiles,
    errorsCount: errors.length,
    removedDirs,
    preservedIced,
  });

  return {
    ulid,
    reversedFiles,
    preservedIced,
    removedDirs,
    errors,
  };
}

// Diamond B-26 (CD-119 SVRC · per-action enum reversal dispatcher).
// Schema v1 ('appended') · v2 ('replaced', 'agent-derived') · v3 ('updated') all handled.
function reverseEntry(entry: ManifestFileEntry, targetPath: string, snapshotDir: string): void {
  switch (entry.action) {
    case 'created':
      // SCS created this file — remove entirely
      if (existsSync(targetPath)) unlinkSync(targetPath);
      break;

    case 'appended':
      // v1 schema: delimited block appended to user CLAUDE.md.
      // Strip the SCS block between OPEN_PREFIX...CLOSE delimiters.
      if (existsSync(targetPath)) {
        const content = readFileSync(targetPath, 'utf8');
        const stripped = stripDelimitedBlock(content);
        writeFileSync(targetPath, stripped, 'utf8');
      }
      break;

    case 'merged':
      // settings.json: remove only scsAdditions; preserve user keys
      if (existsSync(targetPath) && entry.scsAdditions && entry.scsAdditions.length > 0) {
        reverseSettingsMerge(targetPath, entry.scsAdditions);
      }
      break;

    case 'untouched':
      // No-op
      break;

    case 'replaced':
      // v2 schema: drop-in replace. Restore from PreInstallSnapshot/ if snapshot exists.
      if (entry.preInstallExisted) {
        const snapshotFile = path.join(snapshotDir, entry.relPath);
        if (existsSync(snapshotFile)) {
          const parent = path.dirname(targetPath);
          if (!existsSync(parent)) mkdirSync(parent, { recursive: true });
          copyFileSync(snapshotFile, targetPath);
        }
        // snapshot absent but preInstallExisted=true: silent log — non-fatal
      } else {
        // File did not exist before install — remove it
        if (existsSync(targetPath)) unlinkSync(targetPath);
      }
      break;

    case 'agent-derived':
      // v2 schema: install-agent-created (Suite 8 Instance.md · Onyx-Tier-1 ·
      // Diamond-Tier-1). These files live inside Cascades/{8_SUITES,Working}/
      // which are user-data dirs RETAINED on uninstall (CD-127 RDDU spot-change ·
      // v0.36.3). The Suite 8 holds the user's pre-install CLAUDE.md content
      // (S7 muxification) · the Onyx + Diamond hold their first cycle's RI seed.
      // Removing these would contradict the "data the user may access" framing.
      // No-op · log for traceability.
      log('uninstall.agent-derived.skipped', {
        relPath: entry.relPath,
        reason: 'CD-127 RDDU · user-data retention',
      });
      break;

    case 'updated':
      // v3 schema: in-place mutation (Cascade.json cycle 0→1).
      // Restore via preInstallValueSnapshot JSON.
      if (entry.preInstallValueSnapshot && existsSync(targetPath)) {
        writeFileSync(targetPath, entry.preInstallValueSnapshot, 'utf8');
      }
      break;

    default:
      log('uninstall.entry.unknown-action', {
        relPath: entry.relPath,
        action: (entry as ManifestFileEntry).action,
      });
  }
}

// Strip SCS delimited block from CLAUDE.md content (v1 schema 'appended' reversal).
export function stripDelimitedBlock(content: string): string {
  const openMatch = content.match(
    new RegExp(`${escapeRegex(SCS_CLAUDEMD_DELIMITER_OPEN_PREFIX)}[^\n]*`),
  );
  if (!openMatch || openMatch.index === undefined) return content;
  const openIdx = openMatch.index;
  const closeIdx = content.indexOf(SCS_CLAUDEMD_DELIMITER_CLOSE, openIdx);
  if (closeIdx === -1) return content; // malformed · leave intact
  const endIdx = closeIdx + SCS_CLAUDEMD_DELIMITER_CLOSE.length;
  const before = content.slice(0, openIdx).replace(/\n+$/, '');
  const after = content.slice(endIdx).replace(/^\n+/, '');
  if (before.length === 0 && after.length === 0) return '';
  if (before.length === 0) return after + '\n';
  if (after.length === 0) return before + '\n';
  return before + '\n\n' + after + (after.endsWith('\n') ? '' : '\n');
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Reverse settings.json merge: remove SCS-added hooks + permissions.
// Conservative on permissions.allow (B-27 will track exact values for precise reversal).
function reverseSettingsMerge(targetPath: string, scsAdditions: string[]): void {
  const raw = readFileSync(targetPath, 'utf8');
  const settings = JSON.parse(raw) as Record<string, unknown>;

  for (const addition of scsAdditions) {
    if (addition.startsWith('hooks[+')) {
      const count = parseInt(addition.match(/\+(\d+)/)?.[1] ?? '0', 10);
      if (Array.isArray(settings.hooks)) {
        settings.hooks = (settings.hooks as unknown[]).slice(0, -count);
        if ((settings.hooks as unknown[]).length === 0) delete settings.hooks;
      }
    }
    // permissions.allow[+N]: B-26 conservative · leave intact
    // (TODO B-27: track exact added values in scsAdditions for precise reversal)
  }

  writeFileSync(targetPath, JSON.stringify(settings, null, 2) + '\n', 'utf8');
}

// Glob-remove scs-* files in a directory (CD-93 ASNCPP discipline).
function sweepScsNamespaced(dir: string, prefix: string): string[] {
  const errors: string[] = [];
  if (!existsSync(dir)) return errors;
  try {
    const items = readdirSync(dir);
    for (const item of items) {
      if (item.startsWith(prefix) && item.endsWith('.md')) {
        try {
          unlinkSync(path.join(dir, item));
          log('uninstall.scs-namespaced.removed', { dir, item });
        } catch (err) {
          errors.push(
            `scs-* removal failed: ${path.join(dir, item)} — ${
              err instanceof Error ? err.message : String(err)
            }`,
          );
        }
      }
    }
  } catch (err) {
    errors.push(
      `scs-* sweep dir read failed: ${dir} — ${err instanceof Error ? err.message : String(err)}`,
    );
  }
  return errors;
}

// Remove B-3 *.bak files from root + .claude/.
function sweepBakFiles(userCwd: string, errors: string[]): void {
  for (const searchDir of [userCwd, path.join(userCwd, '.claude')]) {
    if (!existsSync(searchDir)) continue;
    try {
      const items = readdirSync(searchDir);
      for (const item of items) {
        if (item.endsWith('.bak')) {
          try {
            unlinkSync(path.join(searchDir, item));
            log('uninstall.bak.removed', { searchDir, item });
          } catch (err) {
            errors.push(
              `*.bak removal failed: ${path.join(searchDir, item)} — ${
                err instanceof Error ? err.message : String(err)
              }`,
            );
          }
        }
      }
    } catch {
      // dir read failed · non-fatal
    }
  }
}
