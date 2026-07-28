import { mkdtempSync, rmSync, mkdirSync, writeFileSync, existsSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import * as path from 'node:path';

import {
  writeManifest,
  readManifest,
  captureSnapshot,
  buildManifestSkeleton,
  ensureUserSCSConfigDir,
  icedManifestPath,
  icedSnapshotRoot,
  icedUserSCSConfigDir,
} from './icedManifest';
import { detectUserState } from './muxDetect';

let tempRoot: string;

beforeEach(() => {
  tempRoot = mkdtempSync(path.join(tmpdir(), 'iced-manifest-test-'));
});

afterEach(() => {
  if (tempRoot && existsSync(tempRoot)) {
    rmSync(tempRoot, { recursive: true, force: true });
  }
});

describe('Manifest skeleton + write + read (Diamond B-24 · CD-87 MMDC)', () => {
  test('buildManifestSkeleton returns valid shape with empty files', () => {
    const m = buildManifestSkeleton({
      scsBridgeVersion: '0.34.0',
      installTimestamp: '2026-05-09T12:00:00Z',
      preInstallSnapshotRelPath: 'PreInstallSnapshot/20260509T120000',
      userStateDetected: detectUserState(tempRoot),
    });
    expect(m.schemaVersion).toBe(3);
    expect(m.scsBridgeVersion).toBe('0.34.0');
    expect(m.files).toEqual([]);
  });

  test('writeManifest creates Cascades/Iced/MuxificationManifest.json (atomic)', () => {
    const m = buildManifestSkeleton({
      scsBridgeVersion: '0.34.0',
      installTimestamp: '2026-05-09T12:00:00Z',
      preInstallSnapshotRelPath: 'PreInstallSnapshot/20260509T120000',
      userStateDetected: detectUserState(tempRoot),
    });
    writeManifest(tempRoot, m);
    expect(existsSync(icedManifestPath(tempRoot))).toBe(true);
    // No leftover .tmp
    expect(existsSync(icedManifestPath(tempRoot) + '.tmp')).toBe(false);
  });

  test('readManifest round-trips identical content', () => {
    const m = buildManifestSkeleton({
      scsBridgeVersion: '0.34.0',
      installTimestamp: '2026-05-09T12:00:00Z',
      preInstallSnapshotRelPath: 'PreInstallSnapshot/20260509T120000',
      userStateDetected: detectUserState(tempRoot),
    });
    m.files.push({
      relPath: 'CLAUDE.md',
      action: 'appended',
      preInstallExisted: true,
      delimiterStart: '<!-- BEGIN SCS-BRIDGE-MANIFOLD v0.34.0 -->',
      delimiterEnd: '<!-- END SCS-BRIDGE-MANIFOLD -->',
    });
    writeManifest(tempRoot, m);
    const r = readManifest(tempRoot);
    expect(r).not.toBeNull();
    expect(r?.files).toHaveLength(1);
    expect(r?.files[0].action).toBe('appended');
  });

  test('readManifest returns null when missing', () => {
    expect(readManifest(tempRoot)).toBeNull();
  });

  test('readManifest returns null on invalid JSON', () => {
    mkdirSync(path.join(tempRoot, 'Cascades', 'Iced'), { recursive: true });
    writeFileSync(icedManifestPath(tempRoot), '{invalid json', 'utf8');
    expect(readManifest(tempRoot)).toBeNull();
  });
});

describe('captureSnapshot (Diamond B-24 · CD-86 PISCD)', () => {
  test('captures all detected user files to timestamped subdir', () => {
    writeFileSync(path.join(tempRoot, 'CLAUDE.md'), '# user root');
    mkdirSync(path.join(tempRoot, '.claude', 'agents'), { recursive: true });
    writeFileSync(path.join(tempRoot, '.claude', 'agents', 'my-reviewer.md'), '# agent');
    mkdirSync(path.join(tempRoot, '.claude', 'commands'), { recursive: true });
    writeFileSync(path.join(tempRoot, '.claude', 'commands', 'review.md'), '# cmd');
    writeFileSync(path.join(tempRoot, '.claude', 'settings.json'), '{"permissions":{"allow":[]}}');

    const userState = detectUserState(tempRoot);
    const result = captureSnapshot(tempRoot, '20260509T120000', userState);

    expect(result.capturedFiles).toContain('CLAUDE.md');
    expect(result.capturedFiles).toContain('.claude/agents/');
    expect(result.capturedFiles).toContain('.claude/commands/');
    expect(result.capturedFiles).toContain('.claude/settings.json');

    const snap = path.join(icedSnapshotRoot(tempRoot), '20260509T120000');
    expect(existsSync(path.join(snap, 'CLAUDE.md'))).toBe(true);
    expect(existsSync(path.join(snap, '.claude', 'agents', 'my-reviewer.md'))).toBe(true);
    expect(existsSync(path.join(snap, '.claude', 'commands', 'review.md'))).toBe(true);
    expect(existsSync(path.join(snap, '.claude', 'settings.json'))).toBe(true);
  });

  test('snapshotRelPath is POSIX-style for cross-platform manifest', () => {
    writeFileSync(path.join(tempRoot, 'CLAUDE.md'), '# user');
    const result = captureSnapshot(tempRoot, '20260509T120000', detectUserState(tempRoot));
    expect(result.snapshotRelPath).toBe('PreInstallSnapshot/20260509T120000');
    expect(result.snapshotRelPath).not.toMatch(/\\/);
  });

  test('captures preserved content byte-for-byte', () => {
    const original = '# user content with special chars: <!-- > & "\n';
    writeFileSync(path.join(tempRoot, 'CLAUDE.md'), original, 'utf8');
    const userState = detectUserState(tempRoot);
    captureSnapshot(tempRoot, '20260509T120000', userState);
    const captured = readFileSync(
      path.join(icedSnapshotRoot(tempRoot), '20260509T120000', 'CLAUDE.md'),
      'utf8',
    );
    expect(captured).toBe(original);
  });
});

describe('ensureUserSCSConfigDir (Diamond B-24 · CD-92 USCPPP)', () => {
  test('creates UserSCSConfig with .gitkeep + README on first call', () => {
    ensureUserSCSConfigDir(tempRoot);
    const dir = icedUserSCSConfigDir(tempRoot);
    expect(existsSync(dir)).toBe(true);
    expect(existsSync(path.join(dir, '.gitkeep'))).toBe(true);
    expect(existsSync(path.join(dir, 'README.md'))).toBe(true);
  });

  test('idempotent — does not overwrite existing files', () => {
    ensureUserSCSConfigDir(tempRoot);
    const userFile = path.join(icedUserSCSConfigDir(tempRoot), 'my-config.md');
    writeFileSync(userFile, '# user personalization', 'utf8');
    ensureUserSCSConfigDir(tempRoot);
    expect(readFileSync(userFile, 'utf8')).toBe('# user personalization');
  });
});
