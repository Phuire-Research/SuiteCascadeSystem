import { mkdir, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { ulid } from 'ulid';

const fakeHome = join(tmpdir(), 'scs-bridge-blank-test', ulid());

jest.mock('node:os', () => {
  const actual = jest.requireActual('node:os');
  return {
    ...actual,
    homedir: jest.fn(() => fakeHome),
  };
});

import {
  BLANK_SIZE_THRESHOLD_BYTES,
  discoverPersistedSessions,
  encodeCwdForClaudeProjects,
  claudeSessionJsonlPath,
  getJsonlMtime,
  hasPersistedSession,
  synthesizeDiscoveredUlid,
} from './sessionPersistence';

describe('sessionPersistence — Diamond L Pattern 4 Modulation', () => {
  describe('BLANK_SIZE_THRESHOLD_BYTES', () => {
    test('5KB empirical Layer-4 boundary (Diamond P: bisects 2-3KB dead vs 9-10KB real-exchange)', () => {
      expect(BLANK_SIZE_THRESHOLD_BYTES).toBe(5 * 1024);
    });
  });

  describe('encodeCwdForClaudeProjects', () => {
    test('encodes absolute path with leading dash', () => {
      expect(encodeCwdForClaudeProjects('/Users/foo/proj')).toBe('-Users-foo-proj');
    });

    test('replaces every / with -', () => {
      expect(encodeCwdForClaudeProjects('/a/b/c/d')).toBe('-a-b-c-d');
    });

    test('handles relative-style strings without dashes', () => {
      expect(encodeCwdForClaudeProjects('proj')).toBe('proj');
    });
  });

  describe('claudeSessionJsonlPath', () => {
    test('joins ~/.claude/projects/<encoded-cwd>/<sessionId>.jsonl', () => {
      const path = claudeSessionJsonlPath('/Users/foo/proj', 'abc-123');
      expect(path).toMatch(/\.claude\/projects\/-Users-foo-proj\/abc-123\.jsonl$/);
    });

    test('uses mocked homedir as root', () => {
      const path = claudeSessionJsonlPath('/Users/foo/proj', 'abc-123');
      expect(path.startsWith(fakeHome)).toBe(true);
    });
  });

  describe('hasPersistedSession (real fs in tmpdir)', () => {
    beforeAll(async () => {
      await mkdir(fakeHome, { recursive: true });
    });

    afterAll(async () => {
      try {
        await rm(fakeHome, { recursive: true, force: true });
      } catch {
        // ignore
      }
    });

    test('returns false when projects dir does not exist', () => {
      expect(hasPersistedSession('/nonexistent/cwd', 'no-such-session')).toBe(false);
    });

    test('returns false when JSONL file is missing', async () => {
      const cwd = '/Users/foo/proj-missing';
      const projDir = join(fakeHome, '.claude', 'projects', encodeCwdForClaudeProjects(cwd));
      await mkdir(projDir, { recursive: true });
      expect(hasPersistedSession(cwd, 'missing-session-id')).toBe(false);
    });

    test('returns false when JSONL file is empty (size 0)', async () => {
      const cwd = '/Users/foo/proj-empty';
      const sessionId = 'empty-session';
      const projDir = join(fakeHome, '.claude', 'projects', encodeCwdForClaudeProjects(cwd));
      await mkdir(projDir, { recursive: true });
      await writeFile(join(projDir, `${sessionId}.jsonl`), '', 'utf8');
      expect(hasPersistedSession(cwd, sessionId)).toBe(false);
    });

    test('returns false for sub-threshold content (under 5KB = dead-startup-only)', async () => {
      const cwd = '/Users/foo/proj-blank';
      const sessionId = 'blank-session';
      const projDir = join(fakeHome, '.claude', 'projects', encodeCwdForClaudeProjects(cwd));
      await mkdir(projDir, { recursive: true });
      await writeFile(join(projDir, `${sessionId}.jsonl`), '{"type":"user"}\n', 'utf8');
      expect(hasPersistedSession(cwd, sessionId)).toBe(false);
    });

    test('returns false for single-byte content (threshold = 5KB exclusive)', async () => {
      const cwd = '/Users/foo/proj-tiny';
      const sessionId = 'tiny-session';
      const projDir = join(fakeHome, '.claude', 'projects', encodeCwdForClaudeProjects(cwd));
      await mkdir(projDir, { recursive: true });
      await writeFile(join(projDir, `${sessionId}.jsonl`), 'x', 'utf8');
      expect(hasPersistedSession(cwd, sessionId)).toBe(false);
    });

    test('returns true when JSONL exceeds threshold (single-exchange ~9KB > 5KB)', async () => {
      const cwd = '/Users/foo/proj-real';
      const sessionId = 'real-session';
      const projDir = join(fakeHome, '.claude', 'projects', encodeCwdForClaudeProjects(cwd));
      await mkdir(projDir, { recursive: true });
      await writeFile(join(projDir, `${sessionId}.jsonl`), 'x'.repeat(9 * 1024), 'utf8');
      expect(hasPersistedSession(cwd, sessionId)).toBe(true);
    });
  });

  describe('Diamond M Fix M-3 — discoverPersistedSessions', () => {
    test('returns [] when projects dir does not exist', () => {
      expect(discoverPersistedSessions('/nonexistent/cwd-disc')).toEqual([]);
    });

    test('skips files under threshold; returns only persisted JSONLs', async () => {
      const cwd = '/Users/foo/proj-disc';
      const projDir = join(fakeHome, '.claude', 'projects', encodeCwdForClaudeProjects(cwd));
      await mkdir(projDir, { recursive: true });
      await writeFile(join(projDir, 'tiny.jsonl'), 'x', 'utf8');
      await writeFile(join(projDir, 'real.jsonl'), 'x'.repeat(9 * 1024), 'utf8');
      await writeFile(join(projDir, 'not-jsonl.txt'), 'x'.repeat(9 * 1024), 'utf8');

      const result = discoverPersistedSessions(cwd);
      const ids = result.map((d) => d.claudeSessionId).sort();
      expect(ids).toEqual(['real']);
      const r = result[0];
      expect(r.sizeBytes).toBeGreaterThan(BLANK_SIZE_THRESHOLD_BYTES);
      expect(typeof r.mtimeMs).toBe('number');
    });

    test('returns multiple persisted JSONLs', async () => {
      const cwd = '/Users/foo/proj-multi';
      const projDir = join(fakeHome, '.claude', 'projects', encodeCwdForClaudeProjects(cwd));
      await mkdir(projDir, { recursive: true });
      await writeFile(join(projDir, 'aaa.jsonl'), 'x'.repeat(9 * 1024), 'utf8');
      await writeFile(join(projDir, 'bbb.jsonl'), 'x'.repeat(9 * 1024), 'utf8');

      const result = discoverPersistedSessions(cwd);
      const ids = result.map((d) => d.claudeSessionId).sort();
      expect(ids).toEqual(['aaa', 'bbb']);
    });
  });

  describe('Diamond M Fix M-3 — synthesizeDiscoveredUlid (Green Issue 2 tie-breaker)', () => {
    test('produces 01DISCOVERED-prefixed deterministic ID', () => {
      const id = synthesizeDiscoveredUlid(1746576000000, 'abc-123-uuid');
      expect(id.startsWith('01DISCOVERED-')).toBe(true);
    });

    test('idempotent: same (mtime, sessionId) produces same ID', () => {
      const id1 = synthesizeDiscoveredUlid(1746576000000, 'abc-123-uuid');
      const id2 = synthesizeDiscoveredUlid(1746576000000, 'abc-123-uuid');
      expect(id1).toBe(id2);
    });

    test('mtime collision is broken by claudeSessionId prefix tie-breaker', () => {
      // Two distinct claudeSessionIds with identical mtime → distinct synthesized IDs.
      const a = synthesizeDiscoveredUlid(1746576000000, 'abcdef-1');
      const b = synthesizeDiscoveredUlid(1746576000000, 'ghijkl-2');
      expect(a).not.toBe(b);
    });

    test('encodes mtime as base36 (lex-sortable by time)', () => {
      const earlier = synthesizeDiscoveredUlid(1000, 'aaaaaa');
      const later = synthesizeDiscoveredUlid(2000000000000, 'aaaaaa');
      expect(earlier < later).toBe(true);
    });
  });

  describe('Diamond N Fix N-D2 — getJsonlMtime (orphan-detection signal)', () => {
    test('returns null when JSONL does not exist', () => {
      expect(getJsonlMtime('/nonexistent/cwd-mtime', 'no-session')).toBeNull();
    });

    test('returns null when projects dir is missing', () => {
      expect(getJsonlMtime('/totally/missing/path', 'session-x')).toBeNull();
    });

    test('returns mtimeMs (number) when JSONL exists', async () => {
      const cwd = '/Users/foo/proj-mtime';
      const sessionId = 'mtime-session';
      const projDir = join(fakeHome, '.claude', 'projects', encodeCwdForClaudeProjects(cwd));
      await mkdir(projDir, { recursive: true });
      await writeFile(join(projDir, `${sessionId}.jsonl`), 'content', 'utf8');
      const mtime = getJsonlMtime(cwd, sessionId);
      expect(typeof mtime).toBe('number');
      expect(mtime).toBeGreaterThan(0);
    });

    test('mtime advances after re-write (orphan-detection viable)', async () => {
      const cwd = '/Users/foo/proj-mtime-advance';
      const sessionId = 'advance-session';
      const projDir = join(fakeHome, '.claude', 'projects', encodeCwdForClaudeProjects(cwd));
      await mkdir(projDir, { recursive: true });
      const filepath = join(projDir, `${sessionId}.jsonl`);
      await writeFile(filepath, 'first', 'utf8');
      const m1 = getJsonlMtime(cwd, sessionId);
      // Wait long enough for filesystem mtime resolution (HFS+ = 1s).
      await new Promise((r) => setTimeout(r, 1100));
      await writeFile(filepath, 'second', 'utf8');
      const m2 = getJsonlMtime(cwd, sessionId);
      expect(m1).not.toBeNull();
      expect(m2).not.toBeNull();
      expect((m2 ?? 0) >= (m1 ?? 0)).toBe(true);
    });
  });
});
