import { mkdtempSync, rmSync, writeFileSync, existsSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import * as path from 'node:path';

import {
  scaffoldReferenceDesignFixture,
  snapshotDirectoryHash,
  compareDirectories,
  cloneFixtureToDir,
} from './muxFixture';
import { SCS_MUX_FIXTURE_FILES } from './installConstants';

let tempRoot: string;

beforeEach(() => {
  tempRoot = mkdtempSync(path.join(tmpdir(), 'mux-fixture-test-'));
});

afterEach(() => {
  if (tempRoot && existsSync(tempRoot)) {
    rmSync(tempRoot, { recursive: true, force: true });
  }
});

describe('scaffoldReferenceDesignFixture (Diamond B-23 · CD-77 RDTFS)', () => {
  test('writes all 8 fixture files to destDir', () => {
    const dest = path.join(tempRoot, 'fixture-out');
    const written = scaffoldReferenceDesignFixture(dest);
    expect(written.length).toBe(SCS_MUX_FIXTURE_FILES.length);
    for (const [relPath] of SCS_MUX_FIXTURE_FILES) {
      expect(existsSync(path.join(dest, relPath))).toBe(true);
    }
  });

  test('writes content matching SCS_MUX_FIXTURE_FILES constants', () => {
    const dest = path.join(tempRoot, 'fixture-out');
    scaffoldReferenceDesignFixture(dest);
    for (const [relPath, expectedContent] of SCS_MUX_FIXTURE_FILES) {
      const actual = readFileSync(path.join(dest, relPath), 'utf8');
      expect(actual).toBe(expectedContent);
    }
  });

  test('idempotent — overwrites existing files on re-run', () => {
    const dest = path.join(tempRoot, 'fixture-out');
    scaffoldReferenceDesignFixture(dest);
    // Mutate one file
    const claudeMdPath = path.join(dest, 'CLAUDE.md');
    writeFileSync(claudeMdPath, 'mutated content', 'utf8');
    expect(readFileSync(claudeMdPath, 'utf8')).toBe('mutated content');
    // Re-scaffold should restore
    scaffoldReferenceDesignFixture(dest);
    expect(readFileSync(claudeMdPath, 'utf8')).toContain('Project Instructions for Claude Code');
  });

  test('creates parent directories for nested paths (.claude/agents/, src/)', () => {
    const dest = path.join(tempRoot, 'nested-out');
    scaffoldReferenceDesignFixture(dest);
    expect(existsSync(path.join(dest, '.claude', 'agents', 'my-reviewer.md'))).toBe(true);
    expect(existsSync(path.join(dest, 'src', 'index.ts'))).toBe(true);
  });
});

describe('snapshotDirectoryHash (Diamond B-23 · CD-82 SHSDV)', () => {
  test('returns deterministic 64-char SHA-256 hex', () => {
    const dest = path.join(tempRoot, 'fixture-out');
    scaffoldReferenceDesignFixture(dest);
    const hash1 = snapshotDirectoryHash(dest);
    const hash2 = snapshotDirectoryHash(dest);
    expect(hash1).toBe(hash2);
    expect(hash1.length).toBe(64);
    expect(/^[0-9a-f]{64}$/.test(hash1)).toBe(true);
  });

  test('detects content change in any file', () => {
    const dest = path.join(tempRoot, 'fixture-out');
    scaffoldReferenceDesignFixture(dest);
    const hashBefore = snapshotDirectoryHash(dest);
    // Mutate one file
    writeFileSync(path.join(dest, 'CLAUDE.md'), 'changed', 'utf8');
    const hashAfter = snapshotDirectoryHash(dest);
    expect(hashAfter).not.toBe(hashBefore);
  });

  test('skip-list excludes *.bak files (B-3 timestamped backups)', () => {
    const dest = path.join(tempRoot, 'fixture-out');
    scaffoldReferenceDesignFixture(dest);
    const hashBefore = snapshotDirectoryHash(dest);
    // Add a .bak file (simulating B-3 timestamped backup)
    writeFileSync(path.join(dest, 'CLAUDE.md.20260509T120000.bak'), 'old content', 'utf8');
    const hashAfter = snapshotDirectoryHash(dest);
    // Hash should be unchanged because .bak is in skip-list
    expect(hashAfter).toBe(hashBefore);
  });

  test('throws when directory does not exist', () => {
    expect(() => snapshotDirectoryHash(path.join(tempRoot, 'nonexistent'))).toThrow();
  });
});

describe('compareDirectories (Diamond B-23 · CD-78 MRV)', () => {
  test('returns empty diff for identical fixtures', () => {
    const a = path.join(tempRoot, 'a');
    const b = path.join(tempRoot, 'b');
    scaffoldReferenceDesignFixture(a);
    scaffoldReferenceDesignFixture(b);
    const diffs = compareDirectories(a, b);
    expect(diffs).toEqual([]);
  });

  test('detects content-mismatch when one file changes', () => {
    const a = path.join(tempRoot, 'a');
    const b = path.join(tempRoot, 'b');
    scaffoldReferenceDesignFixture(a);
    scaffoldReferenceDesignFixture(b);
    writeFileSync(path.join(b, 'CLAUDE.md'), 'changed', 'utf8');
    const diffs = compareDirectories(a, b);
    expect(diffs.length).toBe(1);
    expect(diffs[0].relPath).toBe('CLAUDE.md');
    expect(diffs[0].kind).toBe('content-mismatch');
  });

  test('detects only-in-a + only-in-b for unique files', () => {
    const a = path.join(tempRoot, 'a');
    const b = path.join(tempRoot, 'b');
    scaffoldReferenceDesignFixture(a);
    scaffoldReferenceDesignFixture(b);
    writeFileSync(path.join(a, 'extra-a.txt'), 'a-only', 'utf8');
    writeFileSync(path.join(b, 'extra-b.txt'), 'b-only', 'utf8');
    const diffs = compareDirectories(a, b);
    expect(diffs.find((d) => d.relPath === 'extra-a.txt')?.kind).toBe('only-in-a');
    expect(diffs.find((d) => d.relPath === 'extra-b.txt')?.kind).toBe('only-in-b');
  });

  test('skip-list excludes *.bak from comparison (B-3 backups irrelevant)', () => {
    const a = path.join(tempRoot, 'a');
    const b = path.join(tempRoot, 'b');
    scaffoldReferenceDesignFixture(a);
    scaffoldReferenceDesignFixture(b);
    writeFileSync(path.join(b, 'CLAUDE.md.20260509T120000.bak'), 'backup', 'utf8');
    const diffs = compareDirectories(a, b);
    expect(diffs).toEqual([]);
  });
});

describe('cloneFixtureToDir (Diamond B-23 round-trip support)', () => {
  test('clones fixture to destination preserving all files', () => {
    const src = path.join(tempRoot, 'src');
    const dest = path.join(tempRoot, 'dest');
    scaffoldReferenceDesignFixture(src);
    cloneFixtureToDir(src, dest);
    for (const [relPath] of SCS_MUX_FIXTURE_FILES) {
      expect(existsSync(path.join(dest, relPath))).toBe(true);
    }
  });

  test('clone produces directory matching source via compareDirectories', () => {
    const src = path.join(tempRoot, 'src');
    const dest = path.join(tempRoot, 'dest');
    scaffoldReferenceDesignFixture(src);
    cloneFixtureToDir(src, dest);
    expect(compareDirectories(src, dest)).toEqual([]);
  });
});

describe('B-23 baseline reversibility round-trip (stub for B-26)', () => {
  // Stub-to-real binding: this test will be expanded in B-26 with actual
  // muxify/reverse-muxify steps from B-24/B-25. For B-23, we verify the
  // INFRASTRUCTURE works end-to-end on a no-op round-trip (clone → no-op → compare).
  test('clone → no-op → compare returns empty diff (infrastructure baseline)', () => {
    const src = path.join(tempRoot, 'reference');
    const work = path.join(tempRoot, 'work');
    scaffoldReferenceDesignFixture(src);
    const beforeHash = snapshotDirectoryHash(src);
    cloneFixtureToDir(src, work);
    // ... B-24 muxify would happen here ...
    // ... B-25 reverse-muxify would happen here ...
    const afterHash = snapshotDirectoryHash(work);
    expect(afterHash).toBe(beforeHash);
    expect(compareDirectories(src, work)).toEqual([]);
  });
});
