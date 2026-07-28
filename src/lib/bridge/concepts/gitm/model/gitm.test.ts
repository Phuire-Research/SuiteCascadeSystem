/**
 * STARC Parser Unit Battery · GITM D2 (#633) · gitmStatus.model.ts
 *
 * Tests the PURE parse seam (parseGitStatus / parseBranchList) against five
 * porcelain v2 fixture cases — ZERO I/O, no bridge process. The unit-test seam
 * the blueprint §3 mandates: feed fixture strings, assert the shape.
 *
 * Jest config: roots <rootDir>/src · testRegex (test|spec)\.(ts)$ · ts-jest.
 * Citation: GITM-D2-S3-YELLOW-BLUEPRINT.md §3 + §9 Wave 6
 */

import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { parseGitStatus, parseBranchList } from './gitmStatus.model';
import { gitmExec, parseGitmLog } from './gitmExec.model';
import {
  issueToken,
  validateToken,
  hashParams,
  EXPIRY_MS,
} from './gitmConfirmToken.model';

describe('STARC parseGitStatus — porcelain v2 fixtures', () => {
  it('Case 1 — clean repo on main, no ahead/behind', () => {
    const raw = [
      '# branch.oid 0123456789abcdef0123456789abcdef01234567',
      '# branch.head main',
      '# branch.upstream origin/main',
      '# branch.ab +0 -0',
    ].join('\n');
    const r = parseGitStatus(raw);
    expect(r.currentBranch).toBe('main');
    expect(r.detachedHead).toBe(false);
    expect(r.dirty).toBe(false);
    expect(r.ahead).toBe(0);
    expect(r.behind).toBe(0);
    expect(r.stagedFiles).toEqual([]);
    expect(r.unstagedFiles).toEqual([]);
    expect(r.conflicts).toEqual([]);
  });

  it('Case 2 — dirty repo: staged + unstaged + untracked', () => {
    const raw = [
      '# branch.head feature/x',
      '# branch.ab +0 -0',
      // staged modification (index M, worktree .)
      '1 M. N... 100644 100644 100644 aaa bbb staged-only.ts',
      // unstaged modification (index ., worktree M)
      '1 .M N... 100644 100644 100644 ccc ddd unstaged-only.ts',
      // both staged AND unstaged (index M, worktree M)
      '1 MM N... 100644 100644 100644 eee fff both.ts',
      // untracked
      '? untracked.txt',
    ].join('\n');
    const r = parseGitStatus(raw);
    expect(r.currentBranch).toBe('feature/x');
    expect(r.dirty).toBe(true);
    expect(r.stagedFiles).toEqual(['staged-only.ts', 'both.ts']);
    expect(r.unstagedFiles).toEqual(['unstaged-only.ts', 'both.ts']);
    expect(r.conflicts).toEqual([]);
  });

  it('Case 3 — detached HEAD', () => {
    const raw = [
      '# branch.oid 0123456789abcdef0123456789abcdef01234567',
      '# branch.head (detached)',
    ].join('\n');
    const r = parseGitStatus(raw);
    expect(r.detachedHead).toBe(true);
    expect(r.currentBranch).toBe('');
    expect(r.dirty).toBe(false);
  });

  it('Case 4 — merge conflict (unmerged entry)', () => {
    const raw = [
      '# branch.head main',
      '# branch.ab +0 -0',
      // unmerged: u <xy> <sub> <m1> <m2> <m3> <mW> <h1> <h2> <h3> <path>
      'u UU N... 100644 100644 100644 100644 aaa bbb ccc conflicted.ts',
    ].join('\n');
    const r = parseGitStatus(raw);
    expect(r.conflicts).toEqual(['conflicted.ts']);
    expect(r.dirty).toBe(true);
    expect(r.currentBranch).toBe('main');
  });

  it('Case 5 — ahead/behind divergence', () => {
    const raw = [
      '# branch.head main',
      '# branch.upstream origin/main',
      '# branch.ab +3 -2',
    ].join('\n');
    const r = parseGitStatus(raw);
    expect(r.ahead).toBe(3);
    expect(r.behind).toBe(2);
    expect(r.currentBranch).toBe('main');
  });

  it('Case 5b — renamed entry (kind 2) staged path extraction', () => {
    const raw = [
      '# branch.head main',
      '# branch.ab +0 -0',
      // renamed: 2 <XY> <sub> <mH> <mI> <mW> <hH> <hI> <Xscore> <path>\t<orig>
      '2 R. N... 100644 100644 100644 aaa bbb R100 new-name.ts\told-name.ts',
    ].join('\n');
    const r = parseGitStatus(raw);
    expect(r.stagedFiles).toEqual(['new-name.ts']);
    expect(r.dirty).toBe(true);
  });
});

describe('STARC parseBranchList', () => {
  it('parses %(refname:short) lines, trims, drops blanks', () => {
    const raw = 'main\nfeature/x\n\n  develop  \n';
    expect(parseBranchList(raw)).toEqual(['main', 'feature/x', 'develop']);
  });

  it('empty input → empty list', () => {
    expect(parseBranchList('')).toEqual([]);
  });
});

// ════════════════════════════════════════════════════════════════════
// GITM D3 (#634) · gitmExec.model seams
// ════════════════════════════════════════════════════════════════════

describe('GITMEXEC gitmExec — real /tmp repo exec seam', () => {
  let repoDir: string;

  beforeAll(() => {
    repoDir = mkdtempSync(join(tmpdir(), 'gitm-d3-exec-'));
    execFileSync('git', ['init'], { cwd: repoDir });
    execFileSync('git', ['config', 'user.email', 'test@test.com'], { cwd: repoDir });
    execFileSync('git', ['config', 'user.name', 'Test'], { cwd: repoDir });
  });

  afterAll(() => {
    rmSync(repoDir, { recursive: true, force: true });
  });

  it('returns { ok: true } for git status in a real repo', () => {
    const r = gitmExec(['status', '--porcelain=v2'], repoDir);
    expect(r.ok).toBe(true);
    expect(r.error).toBe('');
  });

  it('returns { ok: false } with a non-empty error outside a git repo', () => {
    const notRepo = mkdtempSync(join(tmpdir(), 'gitm-d3-notrepo-'));
    const r = gitmExec(['status'], notRepo);
    expect(r.ok).toBe(false);
    expect(r.error.length).toBeGreaterThan(0);
    rmSync(notRepo, { recursive: true, force: true });
  });
});

describe('GITMEXEC parseGitmLog — pure log-parse seam', () => {
  it('parses unit-separator log lines into GitmCommitEntry[]', () => {
    const SEP = '\x1f';
    const raw = [
      ['abc123', 'Alice', 'alice@x.com', '2026-06-09 10:00:00 -0700', 'init commit'].join(SEP),
      ['def456', 'Bob', 'bob@x.com', '2026-06-09 11:00:00 -0700', 'add feature'].join(SEP),
    ].join('\n');
    const entries = parseGitmLog(raw);
    expect(entries).toEqual([
      {
        hash: 'abc123',
        author: 'Alice',
        email: 'alice@x.com',
        date: '2026-06-09 10:00:00 -0700',
        subject: 'init commit',
      },
      {
        hash: 'def456',
        author: 'Bob',
        email: 'bob@x.com',
        date: '2026-06-09 11:00:00 -0700',
        subject: 'add feature',
      },
    ]);
  });

  it('empty stdout → empty list; malformed lines dropped', () => {
    expect(parseGitmLog('')).toEqual([]);
    expect(parseGitmLog('only-one-field')).toEqual([]);
  });

  it('preserves subjects containing spaces (last field is the remainder)', () => {
    const SEP = '\x1f';
    const raw = ['h', 'a', 'e', 'd', 'subject with multiple words'].join(SEP);
    const entries = parseGitmLog(raw);
    expect(entries).toHaveLength(1);
    expect(entries[0].subject).toBe('subject with multiple words');
  });
});

// ════════════════════════════════════════════════════════════════════
// GITM D4 (#635) · WATCHKEY · the T3 double-confirm token model
// ════════════════════════════════════════════════════════════════════

describe('WATCHKEY issueToken — mint a sealed token', () => {
  it('issues a token sealed to (action, params) with a fresh nonce + timestamp', () => {
    const before = Date.now();
    const t = issueToken('gitmReset', { action: 'gitmReset', mode: 'hard', ref: 'HEAD~1' });
    const after = Date.now();
    expect(t.action).toBe('gitmReset');
    expect(t.token.length).toBeGreaterThan(0);
    expect(t.paramsHash).toBe(hashParams({ action: 'gitmReset', mode: 'hard', ref: 'HEAD~1' }));
    expect(t.issuedAt).toBeGreaterThanOrEqual(before);
    expect(t.issuedAt).toBeLessThanOrEqual(after);
  });

  it('mints a DISTINCT nonce on each call (no reuse)', () => {
    const a = issueToken('gitmForcePush', { action: 'gitmForcePush', remote: '', branch: '' });
    const b = issueToken('gitmForcePush', { action: 'gitmForcePush', remote: '', branch: '' });
    expect(a.token).not.toBe(b.token);
  });
});

describe('WATCHKEY hashParams — PARAMSEAL canonical hash', () => {
  it('is order-independent (sorted by key) and idempotent', () => {
    const h1 = hashParams({ mode: 'hard', ref: 'HEAD~1', action: 'gitmReset' });
    const h2 = hashParams({ action: 'gitmReset', ref: 'HEAD~1', mode: 'hard' });
    expect(h1).toBe(h2);
  });

  it('differs when any sealed param differs (bait-and-switch surface)', () => {
    const h1 = hashParams({ action: 'gitmReset', mode: 'hard', ref: 'HEAD~1' });
    const h2 = hashParams({ action: 'gitmReset', mode: 'hard', ref: 'HEAD~5' });
    expect(h1).not.toBe(h2);
  });
});

describe('WATCHKEY validateToken — ok / expired / mismatch', () => {
  const params = { action: 'gitmReset', mode: 'hard', ref: 'HEAD~1' };

  it('returns "ok" for the exact token + params within the BURNTIME window', () => {
    const t = issueToken('gitmReset', params);
    expect(validateToken(t, 'gitmReset', params, t.token, t.issuedAt + 1000)).toBe('ok');
  });

  it('returns "mismatch" when there is no pending confirm', () => {
    expect(validateToken(null, 'gitmReset', params, 'anything')).toBe('mismatch');
  });

  it('returns "mismatch" when the token string differs', () => {
    const t = issueToken('gitmReset', params);
    expect(validateToken(t, 'gitmReset', params, 'wrong-token', t.issuedAt + 1000)).toBe('mismatch');
  });

  it('returns "mismatch" when the action differs', () => {
    const t = issueToken('gitmReset', params);
    expect(validateToken(t, 'gitmBranchDelete', params, t.token, t.issuedAt + 1000)).toBe('mismatch');
  });

  it('returns "mismatch" on PARAMSEAL bait-and-switch (token for ref A, submit ref B)', () => {
    const t = issueToken('gitmReset', params);
    const swapped = { action: 'gitmReset', mode: 'hard', ref: 'HEAD~5' };
    expect(validateToken(t, 'gitmReset', swapped, t.token, t.issuedAt + 1000)).toBe('mismatch');
  });

  it('returns "expired" once now reaches issuedAt + EXPIRY_MS (BURNTIME)', () => {
    const t = issueToken('gitmReset', params);
    expect(validateToken(t, 'gitmReset', params, t.token, t.issuedAt + EXPIRY_MS)).toBe('expired');
    expect(validateToken(t, 'gitmReset', params, t.token, t.issuedAt + EXPIRY_MS - 1)).toBe('ok');
  });
});
