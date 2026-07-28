import { mkdtempSync, rmSync, mkdirSync, writeFileSync, existsSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import * as path from 'node:path';

import { uninstallSCS, stripDelimitedBlock } from './uninstall';
import { writeManifest, buildManifestSkeleton } from './icedManifest';
import {
  ICED_DIR_NAME,
  ICED_PRE_INSTALL_SNAPSHOT_DIRNAME,
  ICED_USER_SCS_CONFIG_DIRNAME,
  SCS_CLAUDEMD_DELIMITER_OPEN_PREFIX,
  SCS_CLAUDEMD_DELIMITER_CLOSE,
} from './installConstants';

let tempRoot: string;

beforeEach(() => {
  tempRoot = mkdtempSync(path.join(tmpdir(), 'uninstall-test-'));
});

afterEach(() => {
  if (tempRoot && existsSync(tempRoot)) {
    rmSync(tempRoot, { recursive: true, force: true });
  }
});

// Helper: scaffold a minimal "post-install" state (Cascades/ + Iced/ + manifest + snapshot)
function scaffoldPostInstall(opts: {
  withClaudeMd?: boolean;
  withScsAgent?: boolean;
  withSuite8Dir?: boolean;
  withCascadeJson?: boolean;
  withUserSCSConfig?: boolean;
}): { snapshotDir: string; ts: string } {
  const ts = '20260510T000000';
  // Iced/PreInstallSnapshot/{ts}/
  const snapshotDir = path.join(
    tempRoot,
    'Cascades',
    ICED_DIR_NAME,
    ICED_PRE_INSTALL_SNAPSHOT_DIRNAME,
    ts,
  );
  mkdirSync(snapshotDir, { recursive: true });

  // Pre-install user CLAUDE.md captured in snapshot
  if (opts.withClaudeMd) {
    mkdirSync(path.join(snapshotDir, '.claude'), { recursive: true });
    writeFileSync(
      path.join(snapshotDir, '.claude', 'CLAUDE.md'),
      '# User CLAUDE.md (pre-install)\n',
      'utf8',
    );
    // Live .claude/CLAUDE.md = SCS Manifold (drop-in)
    mkdirSync(path.join(tempRoot, '.claude'), { recursive: true });
    writeFileSync(
      path.join(tempRoot, '.claude', 'CLAUDE.md'),
      '# SCS Manifold (drop-in replacement)\n',
      'utf8',
    );
  }

  if (opts.withScsAgent) {
    mkdirSync(path.join(tempRoot, '.claude', 'agents'), { recursive: true });
    writeFileSync(
      path.join(tempRoot, '.claude', 'agents', 'scs-r0-origin.md'),
      'agent content',
      'utf8',
    );
    writeFileSync(path.join(tempRoot, '.claude', 'agents', 'my-reviewer.md'), 'user agent', 'utf8');
  }

  if (opts.withSuite8Dir) {
    mkdirSync(path.join(tempRoot, 'Cascades', '8_SUITES', 'My Project'), { recursive: true });
    writeFileSync(
      path.join(tempRoot, 'Cascades', '8_SUITES', 'My Project', 'Instance.md'),
      'Suite 8',
      'utf8',
    );
  }

  if (opts.withCascadeJson) {
    writeFileSync(
      path.join(tempRoot, 'Cascades', 'Cascade.json'),
      JSON.stringify({ cyclePosition: { cycle: 1, rotation: 1 } }, null, 2),
      'utf8',
    );
  }

  if (opts.withUserSCSConfig) {
    const dir = path.join(tempRoot, 'Cascades', ICED_DIR_NAME, ICED_USER_SCS_CONFIG_DIRNAME);
    mkdirSync(dir, { recursive: true });
    writeFileSync(path.join(dir, 'my-customization.md'), '# user content', 'utf8');
  }

  return { snapshotDir, ts };
}

describe('uninstallSCS — exits gracefully when no manifest', () => {
  test('returns errors[] non-empty + preservedIced=false when manifest absent', async () => {
    const result = await uninstallSCS({ userCwd: tempRoot, scsBridgeVersion: '0.36.0' });
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors[0]).toContain('MuxificationManifest.json not found');
    expect(result.preservedIced).toBe(false); // no Iced/ to preserve
  });
});

describe('uninstallSCS — schema v3 action enum reversal (Diamond B-26 · CD-119 SVRC)', () => {
  test("'replaced' action restores file from PreInstallSnapshot (CLAUDE.md drop-in reverse)", async () => {
    const { ts } = scaffoldPostInstall({ withClaudeMd: true });
    const manifest = buildManifestSkeleton({
      scsBridgeVersion: '0.35.4',
      installTimestamp: '2026-05-10T00:00:00Z',
      preInstallSnapshotRelPath: `${ICED_PRE_INSTALL_SNAPSHOT_DIRNAME}/${ts}`,
      userStateDetected: {
        hasRootClaudeMd: false,
        hasDotClaudeClaudeMd: true,
        hasUserAgents: false,
        hasUserCommands: false,
        hasUserSettings: false,
        detected: true,
      },
    });
    manifest.files.push({
      relPath: '.claude/CLAUDE.md',
      action: 'replaced',
      preInstallExisted: true,
    });
    writeManifest(tempRoot, manifest);

    const result = await uninstallSCS({ userCwd: tempRoot, scsBridgeVersion: '0.36.0' });

    expect(result.reversedFiles).toBe(1);
    expect(result.preservedIced).toBe(true);
    const restored = readFileSync(path.join(tempRoot, '.claude', 'CLAUDE.md'), 'utf8');
    expect(restored).toBe('# User CLAUDE.md (pre-install)\n');
  });

  test("'created' action removes the file SCS created", async () => {
    scaffoldPostInstall({});
    const targetFile = path.join(tempRoot, '.claude', 'agents', 'scs-r0-origin.md');
    mkdirSync(path.dirname(targetFile), { recursive: true });
    writeFileSync(targetFile, 'agent content', 'utf8');

    const manifest = buildManifestSkeleton({
      scsBridgeVersion: '0.35.4',
      installTimestamp: '2026-05-10T00:00:00Z',
      preInstallSnapshotRelPath: `${ICED_PRE_INSTALL_SNAPSHOT_DIRNAME}/20260510T000000`,
      userStateDetected: {
        hasRootClaudeMd: false,
        hasDotClaudeClaudeMd: false,
        hasUserAgents: false,
        hasUserCommands: false,
        hasUserSettings: false,
        detected: false,
      },
    });
    manifest.files.push({
      relPath: '.claude/agents/scs-r0-origin.md',
      action: 'created',
      preInstallExisted: false,
    });
    writeManifest(tempRoot, manifest);

    const result = await uninstallSCS({ userCwd: tempRoot, scsBridgeVersion: '0.36.0' });
    expect(result.reversedFiles).toBe(1);
    expect(existsSync(targetFile)).toBe(false);
  });

  test("'agent-derived' action is no-op (CD-127 RDDU · v0.36.3 · user-data retention)", async () => {
    // Diamond B-26-PEWTER hotfix v0.36.3: 'agent-derived' files live inside
    // Cascades/{8_SUITES,Working}/ which are user-data dirs RETAINED on uninstall.
    // Reversal is no-op · Suite 8 dir survives · log records skip.
    scaffoldPostInstall({ withSuite8Dir: true });
    const manifest = buildManifestSkeleton({
      scsBridgeVersion: '0.35.4',
      installTimestamp: '2026-05-10T00:00:00Z',
      preInstallSnapshotRelPath: `${ICED_PRE_INSTALL_SNAPSHOT_DIRNAME}/20260510T000000`,
      userStateDetected: {
        hasRootClaudeMd: false,
        hasDotClaudeClaudeMd: false,
        hasUserAgents: false,
        hasUserCommands: false,
        hasUserSettings: false,
        detected: false,
      },
    });
    manifest.files.push({
      relPath: 'Cascades/8_SUITES/My Project',
      action: 'agent-derived',
      preInstallExisted: false,
    });
    writeManifest(tempRoot, manifest);

    const result = await uninstallSCS({ userCwd: tempRoot, scsBridgeVersion: '0.36.0' });
    expect(result.reversedFiles).toBe(1); // entry processed (logged · skipped)
    // CD-127 RDDU: Suite 8 dir is user data · RETAINED post-uninstall
    expect(existsSync(path.join(tempRoot, 'Cascades', '8_SUITES', 'My Project'))).toBe(true);
  });

  test("'updated' action restores Cascade.json from preInstallValueSnapshot", async () => {
    scaffoldPostInstall({ withCascadeJson: true });
    const priorSnapshot = JSON.stringify({ cyclePosition: { cycle: 0, rotation: 1 } }, null, 2);
    const manifest = buildManifestSkeleton({
      scsBridgeVersion: '0.35.4',
      installTimestamp: '2026-05-10T00:00:00Z',
      preInstallSnapshotRelPath: `${ICED_PRE_INSTALL_SNAPSHOT_DIRNAME}/20260510T000000`,
      userStateDetected: {
        hasRootClaudeMd: false,
        hasDotClaudeClaudeMd: false,
        hasUserAgents: false,
        hasUserCommands: false,
        hasUserSettings: false,
        detected: false,
      },
    });
    manifest.files.push({
      relPath: 'Cascades/Cascade.json',
      action: 'updated',
      preInstallExisted: true,
      preInstallValueSnapshot: priorSnapshot,
    });
    writeManifest(tempRoot, manifest);

    const result = await uninstallSCS({ userCwd: tempRoot, scsBridgeVersion: '0.36.0' });
    expect(result.reversedFiles).toBe(1);
    // Note: Cascade.json gets removed in step 5 sweep regardless of 'updated' reversal
    // (post-uninstall · entire SCS state removed)
    // The reversal restored it briefly · but step 5 sweep removed it after
    expect(existsSync(path.join(tempRoot, 'Cascades', 'Cascade.json'))).toBe(false);
  });

  test("'untouched' action is a no-op", async () => {
    scaffoldPostInstall({});
    const manifest = buildManifestSkeleton({
      scsBridgeVersion: '0.35.4',
      installTimestamp: '2026-05-10T00:00:00Z',
      preInstallSnapshotRelPath: `${ICED_PRE_INSTALL_SNAPSHOT_DIRNAME}/20260510T000000`,
      userStateDetected: {
        hasRootClaudeMd: false,
        hasDotClaudeClaudeMd: false,
        hasUserAgents: false,
        hasUserCommands: false,
        hasUserSettings: false,
        detected: false,
      },
    });
    manifest.files.push({
      relPath: 'CLAUDE.md',
      action: 'untouched',
      preInstallExisted: true,
    });
    writeManifest(tempRoot, manifest);

    const result = await uninstallSCS({ userCwd: tempRoot, scsBridgeVersion: '0.36.0' });
    expect(result.reversedFiles).toBe(1);
    expect(result.errors).toEqual([]);
  });
});

describe('uninstallSCS — Iced preservation (Diamond B-26 · CD-114 IPRM · CD-120 PFND)', () => {
  test('Iced/ directory preserved across uninstall (PreInstallSnapshot + Manifest + UserSCSConfig)', async () => {
    scaffoldPostInstall({ withClaudeMd: true, withUserSCSConfig: true });
    const manifest = buildManifestSkeleton({
      scsBridgeVersion: '0.35.4',
      installTimestamp: '2026-05-10T00:00:00Z',
      preInstallSnapshotRelPath: `${ICED_PRE_INSTALL_SNAPSHOT_DIRNAME}/20260510T000000`,
      userStateDetected: {
        hasRootClaudeMd: false,
        hasDotClaudeClaudeMd: true,
        hasUserAgents: false,
        hasUserCommands: false,
        hasUserSettings: false,
        detected: true,
      },
    });
    manifest.files.push({
      relPath: '.claude/CLAUDE.md',
      action: 'replaced',
      preInstallExisted: true,
    });
    writeManifest(tempRoot, manifest);

    const result = await uninstallSCS({ userCwd: tempRoot, scsBridgeVersion: '0.36.0' });

    expect(result.preservedIced).toBe(true);
    expect(existsSync(path.join(tempRoot, 'Cascades', ICED_DIR_NAME))).toBe(true);
    // Snapshot preserved
    expect(
      existsSync(
        path.join(
          tempRoot,
          'Cascades',
          ICED_DIR_NAME,
          ICED_PRE_INSTALL_SNAPSHOT_DIRNAME,
          '20260510T000000',
        ),
      ),
    ).toBe(true);
    // Manifest preserved
    expect(
      existsSync(path.join(tempRoot, 'Cascades', ICED_DIR_NAME, 'MuxificationManifest.json')),
    ).toBe(true);
    // UserSCSConfig preserved with user content (CD-116 USCPPP-CR cross-reinstall persistence)
    expect(
      existsSync(
        path.join(
          tempRoot,
          'Cascades',
          ICED_DIR_NAME,
          ICED_USER_SCS_CONFIG_DIRNAME,
          'my-customization.md',
        ),
      ),
    ).toBe(true);
  });

  test('Cascades/Bridge/ removed · Cascades/{8_SUITES,Working,Documentation} retained · Iced/ preserved (CD-127 RDDU)', async () => {
    // Diamond B-26-PEWTER hotfix v0.36.3 (CD-127 RDDU):
    // User directive — retain user-data dirs · only remove session-manager state
    scaffoldPostInstall({ withSuite8Dir: true });
    // Scaffold all 5 dirs to verify selective removal
    mkdirSync(path.join(tempRoot, 'Cascades', 'Working'), { recursive: true });
    mkdirSync(path.join(tempRoot, 'Cascades', 'Documentation'), { recursive: true });
    mkdirSync(path.join(tempRoot, 'Cascades', 'Bridge'), { recursive: true });
    mkdirSync(path.join(tempRoot, 'Cascades', 'Lab'), { recursive: true });

    const manifest = buildManifestSkeleton({
      scsBridgeVersion: '0.35.4',
      installTimestamp: '2026-05-10T00:00:00Z',
      preInstallSnapshotRelPath: `${ICED_PRE_INSTALL_SNAPSHOT_DIRNAME}/20260510T000000`,
      userStateDetected: {
        hasRootClaudeMd: false,
        hasDotClaudeClaudeMd: false,
        hasUserAgents: false,
        hasUserCommands: false,
        hasUserSettings: false,
        detected: false,
      },
    });
    writeManifest(tempRoot, manifest);

    const result = await uninstallSCS({ userCwd: tempRoot, scsBridgeVersion: '0.36.0' });

    // ONLY Bridge/ in removedDirs (CD-127 RDDU)
    expect(result.removedDirs).toEqual(['Cascades/Bridge']);
    expect(existsSync(path.join(tempRoot, 'Cascades', 'Bridge'))).toBe(false);
    // User-data dirs RETAINED
    expect(existsSync(path.join(tempRoot, 'Cascades', '8_SUITES'))).toBe(true);
    expect(existsSync(path.join(tempRoot, 'Cascades', 'Working'))).toBe(true);
    expect(existsSync(path.join(tempRoot, 'Cascades', 'Documentation'))).toBe(true);
    expect(existsSync(path.join(tempRoot, 'Cascades', 'Lab'))).toBe(true);
    // Iced/ preserved (CD-114 IPRM · pre-existing)
    expect(existsSync(path.join(tempRoot, 'Cascades', ICED_DIR_NAME))).toBe(true);
  });
});

describe('uninstallSCS — scs-* namespaced sweep (CD-93 ASNCPP)', () => {
  test('removes scs-* agents but preserves user agents (e.g., my-reviewer.md)', async () => {
    scaffoldPostInstall({ withScsAgent: true });
    const manifest = buildManifestSkeleton({
      scsBridgeVersion: '0.35.4',
      installTimestamp: '2026-05-10T00:00:00Z',
      preInstallSnapshotRelPath: `${ICED_PRE_INSTALL_SNAPSHOT_DIRNAME}/20260510T000000`,
      userStateDetected: {
        hasRootClaudeMd: false,
        hasDotClaudeClaudeMd: false,
        hasUserAgents: false,
        hasUserCommands: false,
        hasUserSettings: false,
        detected: false,
      },
    });
    writeManifest(tempRoot, manifest);

    await uninstallSCS({ userCwd: tempRoot, scsBridgeVersion: '0.36.0' });

    expect(existsSync(path.join(tempRoot, '.claude', 'agents', 'scs-r0-origin.md'))).toBe(false);
    expect(existsSync(path.join(tempRoot, '.claude', 'agents', 'my-reviewer.md'))).toBe(true);
  });
});

describe('stripDelimitedBlock (Diamond B-26 · v1 schema appended reversal)', () => {
  const DELIM_OPEN = `${SCS_CLAUDEMD_DELIMITER_OPEN_PREFIX} v0.34.0 -->`;
  const DELIM_CLOSE = SCS_CLAUDEMD_DELIMITER_CLOSE;

  test('strips delimited block · preserves user content above + below', () => {
    const content = `# User Content\n\nUser body.\n\n${DELIM_OPEN}\nSCS Manifold\n${DELIM_CLOSE}\n`;
    expect(stripDelimitedBlock(content)).toBe('# User Content\n\nUser body.\n');
  });

  test('returns content unchanged when no delimiters present', () => {
    const content = '# User\n\nNo SCS\n';
    expect(stripDelimitedBlock(content)).toBe(content);
  });

  test('returns content unchanged when malformed (open without close)', () => {
    const content = `# User\n${DELIM_OPEN}\nincomplete`;
    expect(stripDelimitedBlock(content)).toBe(content);
  });

  test('strips when SCS block is at start (no preceding user content)', () => {
    const content = `${DELIM_OPEN}\nSCS\n${DELIM_CLOSE}\n# User After\n`;
    const result = stripDelimitedBlock(content);
    expect(result).toContain('# User After');
    expect(result).not.toContain('SCS Manifold');
  });
});
