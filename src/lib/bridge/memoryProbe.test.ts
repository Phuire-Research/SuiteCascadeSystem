import { mkdtempSync, rmSync, mkdirSync, writeFileSync, existsSync, utimesSync } from 'node:fs';
import { tmpdir } from 'node:os';
import * as path from 'node:path';

import { encodeCwdForMemory, probeProjectMemory, formatLatestSessionAge } from './memoryProbe';

let tempHome: string;
let originalHome: string | undefined;

beforeEach(() => {
  tempHome = mkdtempSync(path.join(tmpdir(), 'memory-probe-test-home-'));
  originalHome = process.env.HOME;
  process.env.HOME = tempHome;
});

afterEach(() => {
  if (originalHome) process.env.HOME = originalHome;
  if (tempHome && existsSync(tempHome)) {
    rmSync(tempHome, { recursive: true, force: true });
  }
});

describe('encodeCwdForMemory (Diamond B-25-UX · CD-100 MSEPD)', () => {
  test('replaces / with - · leading dash', () => {
    expect(encodeCwdForMemory('/Users/x/Work/proj')).toBe('-Users-x-Work-proj');
  });

  test('handles cwd ending with slash gracefully', () => {
    expect(encodeCwdForMemory('/Users/x/Work/proj/')).toBe('-Users-x-Work-proj-');
  });

  test('matches verified format from real filesystem (test-fixture path)', () => {
    expect(
      encodeCwdForMemory('/Users/testuser/Work/TestingSCSDiamondB/typical-user-reference-003'),
    ).toBe('-Users-testuser-Work-TestingSCSDiamondB-typical-user-reference-003');
  });
});

describe('probeProjectMemory (Diamond B-25-UX · Pattern 4 metadata-only)', () => {
  test('classifies as fresh-slate when projects dir absent', () => {
    const result = probeProjectMemory('/some/nonexistent/path');
    expect(result.exists).toBe(false);
    expect(result.classification).toBe('fresh-slate');
    expect(result.sessionCount).toBe(0);
  });

  test('classifies as fresh-slate when dir exists but contains no jsonls', () => {
    const cwd = '/test/cwd';
    const projectsDir = path.join(tempHome, '.claude', 'projects', encodeCwdForMemory(cwd));
    mkdirSync(projectsDir, { recursive: true });
    const result = probeProjectMemory(cwd, tempHome);
    expect(result.exists).toBe(true);
    expect(result.classification).toBe('fresh-slate');
  });

  test('classifies as existing-project when jsonls present', () => {
    const cwd = '/test/cwd';
    const projectsDir = path.join(tempHome, '.claude', 'projects', encodeCwdForMemory(cwd));
    mkdirSync(projectsDir, { recursive: true });
    writeFileSync(path.join(projectsDir, '11f23557.jsonl'), '');
    writeFileSync(path.join(projectsDir, 'abc12345.jsonl'), '');
    const result = probeProjectMemory(cwd, tempHome);
    expect(result.classification).toBe('existing-project');
    expect(result.sessionCount).toBe(2);
    expect(result.latestMtime).not.toBeNull();
  });

  test('ignores non-jsonl files in count', () => {
    const cwd = '/test/cwd';
    const projectsDir = path.join(tempHome, '.claude', 'projects', encodeCwdForMemory(cwd));
    mkdirSync(projectsDir, { recursive: true });
    writeFileSync(path.join(projectsDir, '11f23557.jsonl'), '');
    writeFileSync(path.join(projectsDir, 'metadata.json'), '');
    writeFileSync(path.join(projectsDir, 'other.txt'), '');
    const result = probeProjectMemory(cwd, tempHome);
    expect(result.sessionCount).toBe(1);
  });

  test('reports latestMtime as max across all jsonl files', () => {
    const cwd = '/test/cwd';
    const projectsDir = path.join(tempHome, '.claude', 'projects', encodeCwdForMemory(cwd));
    mkdirSync(projectsDir, { recursive: true });
    const oldFile = path.join(projectsDir, 'old.jsonl');
    const newFile = path.join(projectsDir, 'new.jsonl');
    writeFileSync(oldFile, '');
    writeFileSync(newFile, '');
    // Force old to be older
    const yesterdayMs = (Date.now() - 86400 * 1000) / 1000;
    utimesSync(oldFile, yesterdayMs, yesterdayMs);
    const result = probeProjectMemory(cwd, tempHome);
    expect(result.latestMtime).toBeGreaterThan(yesterdayMs * 1000 + 1000); // newer file wins
  });
});

describe('formatLatestSessionAge', () => {
  test('returns "no prior sessions" for null', () => {
    expect(formatLatestSessionAge(null)).toBe('no prior sessions');
  });

  test('returns "just now" for <1 minute', () => {
    expect(formatLatestSessionAge(Date.now() - 30_000, Date.now())).toBe('just now');
  });

  test('returns minutes for 1-59 minutes', () => {
    const now = Date.now();
    expect(formatLatestSessionAge(now - 5 * 60 * 1000, now)).toBe('5 minutes ago');
    expect(formatLatestSessionAge(now - 60 * 1000, now)).toBe('1 minute ago');
  });

  test('returns hours for 1-23 hours', () => {
    const now = Date.now();
    expect(formatLatestSessionAge(now - 3 * 3600 * 1000, now)).toBe('3 hours ago');
  });

  test('returns days for >=1 day', () => {
    const now = Date.now();
    expect(formatLatestSessionAge(now - 5 * 86400 * 1000, now)).toBe('5 days ago');
    expect(formatLatestSessionAge(now - 1 * 86400 * 1000, now)).toBe('1 day ago');
  });
});
