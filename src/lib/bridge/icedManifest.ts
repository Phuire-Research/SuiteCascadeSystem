// Diamond B-24 (CD-87 MMDC · Muxification-Manifest-Declarative-Change-Record):
// Read/write/schema for Cascades/Iced/MuxificationManifest.json — the
// declarative record of every change SCS install made to user state.
// B-25 reverse-muxify reads this contract; the schema is FROZEN at B-24 close
// (Suite 6 Purple D-1 load-bearing contract).
//
// Pattern 4 Modulation: filesystem-only operations within user cwd.
// Atomic write: .tmp → rename to prevent partial-state on mid-write crash.

import {
  copyFileSync,
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import * as path from 'node:path';
import {
  ICED_DIR_NAME,
  ICED_MANIFEST_FILENAME,
  ICED_MANIFEST_SCHEMA_VERSION,
  ICED_PRE_INSTALL_SNAPSHOT_DIRNAME,
  ICED_USER_SCS_CONFIG_DIRNAME,
} from './installConstants';
import type { UserStatePresence } from './muxDetect';
import { log } from './debugLog';

// Diamond B-24 (CD-87 MMDC): per-file change record.
// `action` enum maps directly to B-25 reversal operations.
//
// Diamond B-24-FIX (schema v2): added 'replaced' (drop-in CLAUDE.md · supersedes
// 'appended' for `.claude/CLAUDE.md`) and 'agent-derived' (Suite 8 directory
// created by install agent during S7 muxification — B-25 reverse removes the
// directory entirely).
//
// Diamond B-25-UX (schema v3 · Suite 4 Green Angle 8 gap): added 'updated' for
// in-place mutations of existing files (e.g., Cascade.json cycle 0→1 by riActivate).
// `preInstallValueSnapshot` field captures the prior value for B-26 reverse.
export type ManifestFileEntry = {
  relPath: string; // POSIX-style relative path within userCwd
  action:
    | 'created'
    | 'appended'
    | 'merged'
    | 'untouched'
    | 'replaced'
    | 'agent-derived'
    | 'updated';
  preInstallExisted: boolean; // was file present before install
  delimiterStart?: string; // for 'appended' (v1 schema): open delimiter
  delimiterEnd?: string; // for 'appended' (v1 schema): close delimiter
  scsAdditions?: string[]; // for 'merged': list of keys/items SCS added
  preInstallValueSnapshot?: string; // for 'updated' (v3): JSON-serialized prior value
};

// Diamond B-24 (CD-87 MMDC): top-level manifest structure.
export type MuxificationManifest = {
  schemaVersion: number; // ICED_MANIFEST_SCHEMA_VERSION (frozen contract)
  scsBridgeVersion: string; // package.json version at install moment
  installTimestamp: string; // ISO 8601 UTC
  preInstallSnapshotDir: string; // 'PreInstallSnapshot/{ts}/' relative to Iced/
  userStateDetected: UserStatePresence; // captured at detect time
  files: ManifestFileEntry[]; // per-file change record
};

// Diamond B-24: helper paths
export function icedDir(userCwd: string): string {
  return path.join(userCwd, 'Cascades', ICED_DIR_NAME);
}

export function icedManifestPath(userCwd: string): string {
  return path.join(icedDir(userCwd), ICED_MANIFEST_FILENAME);
}

export function icedSnapshotRoot(userCwd: string): string {
  return path.join(icedDir(userCwd), ICED_PRE_INSTALL_SNAPSHOT_DIRNAME);
}

export function icedUserSCSConfigDir(userCwd: string): string {
  return path.join(icedDir(userCwd), ICED_USER_SCS_CONFIG_DIRNAME);
}

// Diamond B-24 (CD-87 MMDC): atomic manifest write (.tmp → rename).
export function writeManifest(userCwd: string, manifest: MuxificationManifest): void {
  const targetPath = icedManifestPath(userCwd);
  const parent = path.dirname(targetPath);
  if (!existsSync(parent)) mkdirSync(parent, { recursive: true });
  const tmpPath = targetPath + '.tmp';
  writeFileSync(tmpPath, JSON.stringify(manifest, null, 2), 'utf8');
  renameSync(tmpPath, targetPath);
  log('iced.manifest.write', { path: targetPath, files: manifest.files.length });
}

// Diamond B-24 (CD-87 MMDC): manifest read with schema validation.
export function readManifest(userCwd: string): MuxificationManifest | null {
  const targetPath = icedManifestPath(userCwd);
  if (!existsSync(targetPath)) return null;
  try {
    const raw = readFileSync(targetPath, 'utf8');
    const parsed = JSON.parse(raw) as MuxificationManifest;
    if (parsed.schemaVersion !== ICED_MANIFEST_SCHEMA_VERSION) {
      log('iced.manifest.schema-mismatch', {
        expected: ICED_MANIFEST_SCHEMA_VERSION,
        actual: parsed.schemaVersion,
      });
    }
    return parsed;
  } catch (err) {
    log('iced.manifest.read.error', { error: err instanceof Error ? err.message : String(err) });
    return null;
  }
}

// Diamond B-24 (CD-86 PISCD · Pre-Install-Snapshot-Capture-Discipline):
// Capture user's pre-install state to Cascades/Iced/PreInstallSnapshot/{ts}/
// for B-25 revert source. Replaces the EPHEMERAL B-5 backupUserDotClaudeAgents
// (which wrote to tempDir cleaned at install end — Suite 4 Green B-23 finding).
//
// Returns the relative snapshot dir (e.g., 'PreInstallSnapshot/20260509T160000')
// for embedding in manifest.preInstallSnapshotDir.
export function captureSnapshot(
  userCwd: string,
  timestamp: string,
  userState: UserStatePresence,
): { snapshotDir: string; snapshotRelPath: string; capturedFiles: string[] } {
  const snapshotRoot = icedSnapshotRoot(userCwd);
  const snapshotDir = path.join(snapshotRoot, timestamp);
  if (!existsSync(snapshotDir)) {
    mkdirSync(snapshotDir, { recursive: true });
  }

  const capturedFiles: string[] = [];

  // Root CLAUDE.md
  if (userState.hasRootClaudeMd) {
    const src = path.join(userCwd, 'CLAUDE.md');
    const dest = path.join(snapshotDir, 'CLAUDE.md');
    copyFileSync(src, dest);
    capturedFiles.push('CLAUDE.md');
  }

  // .claude/CLAUDE.md
  if (userState.hasDotClaudeClaudeMd) {
    const src = path.join(userCwd, '.claude', 'CLAUDE.md');
    const dest = path.join(snapshotDir, '.claude', 'CLAUDE.md');
    mkdirSync(path.dirname(dest), { recursive: true });
    copyFileSync(src, dest);
    capturedFiles.push('.claude/CLAUDE.md');
  }

  // .claude/agents/ (recursive)
  if (userState.hasUserAgents) {
    const src = path.join(userCwd, '.claude', 'agents');
    const dest = path.join(snapshotDir, '.claude', 'agents');
    mkdirSync(path.dirname(dest), { recursive: true });
    cpSync(src, dest, { recursive: true });
    capturedFiles.push('.claude/agents/');
  }

  // .claude/commands/ (recursive)
  if (userState.hasUserCommands) {
    const src = path.join(userCwd, '.claude', 'commands');
    const dest = path.join(snapshotDir, '.claude', 'commands');
    mkdirSync(path.dirname(dest), { recursive: true });
    cpSync(src, dest, { recursive: true });
    capturedFiles.push('.claude/commands/');
  }

  // .claude/settings.json
  if (userState.hasUserSettings) {
    const src = path.join(userCwd, '.claude', 'settings.json');
    const dest = path.join(snapshotDir, '.claude', 'settings.json');
    mkdirSync(path.dirname(dest), { recursive: true });
    copyFileSync(src, dest);
    capturedFiles.push('.claude/settings.json');
  }

  const snapshotRelPath = path.posix.join(ICED_PRE_INSTALL_SNAPSHOT_DIRNAME, timestamp);
  log('iced.snapshot.capture', { snapshotDir, capturedFiles: capturedFiles.length });
  return { snapshotDir, snapshotRelPath, capturedFiles };
}

// Diamond B-24: ensure Iced/UserSCSConfig/ exists with .gitkeep so user
// has an immediately-visible personalization area on first install.
export function ensureUserSCSConfigDir(userCwd: string): void {
  const dir = icedUserSCSConfigDir(userCwd);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
    writeFileSync(path.join(dir, '.gitkeep'), '', 'utf8');
    writeFileSync(
      path.join(dir, 'README.md'),
      '# User SCS Configuration\n\nThis directory is YOURS. SCS Bridge updates will not modify or remove its contents. Place your personalization here — custom Suite 8 instances, project-specific overrides, etc.\n',
      'utf8',
    );
  }
}

// Diamond B-24: build a fresh manifest skeleton (no file entries yet).
export function buildManifestSkeleton(opts: {
  scsBridgeVersion: string;
  installTimestamp: string;
  preInstallSnapshotRelPath: string;
  userStateDetected: UserStatePresence;
}): MuxificationManifest {
  return {
    schemaVersion: ICED_MANIFEST_SCHEMA_VERSION,
    scsBridgeVersion: opts.scsBridgeVersion,
    installTimestamp: opts.installTimestamp,
    preInstallSnapshotDir: opts.preInstallSnapshotRelPath,
    userStateDetected: opts.userStateDetected,
    files: [],
  };
}

// Diamond B-24: utility to detect if a captured snapshot subdir is non-empty.
export function snapshotHasContent(snapshotDir: string): boolean {
  if (!existsSync(snapshotDir)) return false;
  try {
    const st = statSync(snapshotDir);
    return st.isDirectory();
  } catch {
    return false;
  }
}
