import { mkdtempSync, rmSync, mkdirSync, writeFileSync, existsSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import * as path from 'node:path';

import {
  dropInClaudeMd,
  namespaceAgents,
  namespaceCommands,
  mergeSettingsJson,
} from './muxCompose';

let tempRoot: string;

beforeEach(() => {
  tempRoot = mkdtempSync(path.join(tmpdir(), 'mux-compose-test-'));
});

afterEach(() => {
  if (tempRoot && existsSync(tempRoot)) {
    rmSync(tempRoot, { recursive: true, force: true });
  }
});

describe('dropInClaudeMd (Diamond B-24-FIX · CD-88 CNRPFT updated · drop-in replaces delimited append)', () => {
  const SCS_CONTENT = '# SCS Manifold\n\nProtocol stuff here.\n';

  test('creates new file when no prior CLAUDE.md exists (action=created)', () => {
    const target = path.join(tempRoot, 'CLAUDE.md');
    const entry = dropInClaudeMd(target, SCS_CONTENT, 'CLAUDE.md');
    expect(entry.action).toBe('created');
    expect(entry.preInstallExisted).toBe(false);
    expect(readFileSync(target, 'utf8')).toBe(SCS_CONTENT);
  });

  test('drops in over existing file verbatim (action=replaced)', () => {
    const target = path.join(tempRoot, 'CLAUDE.md');
    writeFileSync(target, '# User Content\n\nWill be replaced.\n', 'utf8');
    const entry = dropInClaudeMd(target, SCS_CONTENT, 'CLAUDE.md');
    expect(entry.action).toBe('replaced');
    expect(entry.preInstallExisted).toBe(true);
    expect(readFileSync(target, 'utf8')).toBe(SCS_CONTENT);
  });

  test('drop-in is byte-for-byte verbatim (no delimiter wrapping)', () => {
    const target = path.join(tempRoot, 'CLAUDE.md');
    dropInClaudeMd(target, SCS_CONTENT, 'CLAUDE.md');
    const result = readFileSync(target, 'utf8');
    expect(result).not.toContain('<!-- BEGIN SCS-BRIDGE-MANIFOLD');
    expect(result).not.toContain('<!-- END SCS-BRIDGE-MANIFOLD');
    expect(result).toBe(SCS_CONTENT);
  });

  test('idempotent on re-muxify (same content drop-in produces same file)', () => {
    const target = path.join(tempRoot, 'CLAUDE.md');
    dropInClaudeMd(target, SCS_CONTENT, 'CLAUDE.md');
    const after1 = readFileSync(target, 'utf8');
    dropInClaudeMd(target, SCS_CONTENT, 'CLAUDE.md');
    const after2 = readFileSync(target, 'utf8');
    expect(after1).toBe(after2);
  });

  test('creates parent directory if missing (.claude/CLAUDE.md case)', () => {
    const target = path.join(tempRoot, '.claude', 'CLAUDE.md');
    dropInClaudeMd(target, SCS_CONTENT, '.claude/CLAUDE.md');
    expect(existsSync(target)).toBe(true);
  });

  test('manifest entry has no delimiter fields (schema v2 drop-in semantic)', () => {
    const target = path.join(tempRoot, 'CLAUDE.md');
    const entry = dropInClaudeMd(target, SCS_CONTENT, 'CLAUDE.md');
    expect(entry.delimiterStart).toBeUndefined();
    expect(entry.delimiterEnd).toBeUndefined();
  });
});

describe('namespaceAgents (Diamond B-24 · CD-93 ASNCPP)', () => {
  test('copies clone agents to user dir with scs- prefix', () => {
    const cloneAgents = path.join(tempRoot, 'clone', 'agents');
    const userAgents = path.join(tempRoot, 'user', 'agents');
    mkdirSync(cloneAgents, { recursive: true });
    writeFileSync(path.join(cloneAgents, 'r0-base.md'), '# r0');
    writeFileSync(path.join(cloneAgents, 'teal-claude.md'), '# teal');
    const entries = namespaceAgents(cloneAgents, userAgents);
    expect(existsSync(path.join(userAgents, 'scs-r0-base.md'))).toBe(true);
    expect(existsSync(path.join(userAgents, 'scs-teal-claude.md'))).toBe(true);
    expect(entries).toHaveLength(2);
    expect(entries[0].relPath).toMatch(/^\.claude\/agents\/scs-/);
  });

  test('preserves existing user agents (collision prevention via prefix)', () => {
    const cloneAgents = path.join(tempRoot, 'clone', 'agents');
    const userAgents = path.join(tempRoot, 'user', 'agents');
    mkdirSync(cloneAgents, { recursive: true });
    mkdirSync(userAgents, { recursive: true });
    writeFileSync(path.join(userAgents, 'my-reviewer.md'), '# user agent');
    writeFileSync(path.join(cloneAgents, 'r0-base.md'), '# scs');
    namespaceAgents(cloneAgents, userAgents);
    expect(readFileSync(path.join(userAgents, 'my-reviewer.md'), 'utf8')).toBe('# user agent');
    expect(existsSync(path.join(userAgents, 'scs-r0-base.md'))).toBe(true);
  });

  test('idempotent re-muxify: scs-prefixed source not double-prefixed', () => {
    const cloneAgents = path.join(tempRoot, 'clone', 'agents');
    const userAgents = path.join(tempRoot, 'user', 'agents');
    mkdirSync(cloneAgents, { recursive: true });
    writeFileSync(path.join(cloneAgents, 'scs-already.md'), '# pre-prefixed');
    namespaceAgents(cloneAgents, userAgents);
    expect(existsSync(path.join(userAgents, 'scs-already.md'))).toBe(true);
    expect(existsSync(path.join(userAgents, 'scs-scs-already.md'))).toBe(false);
  });

  test('returns empty array when clone source missing', () => {
    expect(namespaceAgents(path.join(tempRoot, 'nonexistent'), tempRoot)).toEqual([]);
  });
});

describe('namespaceCommands (Diamond ζ Option X · /cascade canonical anchor restored)', () => {
  test('copies clone commands AS-IS (no scs- prefix · ζ revert of B-24 ASNCPP)', () => {
    const cloneCmds = path.join(tempRoot, 'clone', 'commands');
    const userCmds = path.join(tempRoot, 'user', 'commands');
    mkdirSync(cloneCmds, { recursive: true });
    writeFileSync(path.join(cloneCmds, 'cascade.md'), '# /cascade');
    namespaceCommands(cloneCmds, userCmds);
    expect(existsSync(path.join(userCmds, 'cascade.md'))).toBe(true);
    // Verify NO prefix applied (Cascade IS the doing of SCS · canonical anchor preserved)
    expect(existsSync(path.join(userCmds, 'scs-cascade.md'))).toBe(false);
  });

  test('recursively copies cascade/ subdirectory (R0 GT-2 Polarity Flip fix)', () => {
    const cloneCmds = path.join(tempRoot, 'clone', 'commands');
    const userCmds = path.join(tempRoot, 'user', 'commands');
    mkdirSync(path.join(cloneCmds, 'cascade'), { recursive: true });
    writeFileSync(path.join(cloneCmds, 'cascade.md'), '# /cascade');
    writeFileSync(path.join(cloneCmds, 'cascade', 'hello.md'), '# /cascade:hello');
    writeFileSync(path.join(cloneCmds, 'cascade', 'loop.md'), '# /cascade:loop');
    namespaceCommands(cloneCmds, userCmds);
    expect(existsSync(path.join(userCmds, 'cascade.md'))).toBe(true);
    expect(existsSync(path.join(userCmds, 'cascade', 'hello.md'))).toBe(true);
    expect(existsSync(path.join(userCmds, 'cascade', 'loop.md'))).toBe(true);
  });

  test('preserves user-owned commands (no overwrite)', () => {
    const cloneCmds = path.join(tempRoot, 'clone', 'commands');
    const userCmds = path.join(tempRoot, 'user', 'commands');
    mkdirSync(cloneCmds, { recursive: true });
    mkdirSync(userCmds, { recursive: true });
    writeFileSync(path.join(userCmds, 'review.md'), '# user cmd');
    writeFileSync(path.join(cloneCmds, 'cascade.md'), '# scs cmd');
    namespaceCommands(cloneCmds, userCmds);
    expect(readFileSync(path.join(userCmds, 'review.md'), 'utf8')).toBe('# user cmd');
  });
});

describe('mergeSettingsJson (Diamond B-24 · CD-88 CNRPFT)', () => {
  test('creates settings.json when missing', () => {
    const target = path.join(tempRoot, '.claude', 'settings.json');
    const entry = mergeSettingsJson(target, [{ name: 'scs-hook' }], ['Bash(git:*)']);
    expect(entry.action).toBe('merged');
    expect(entry.preInstallExisted).toBe(false);
    const content = JSON.parse(readFileSync(target, 'utf8'));
    expect(content.hooks).toHaveLength(1);
    expect(content.permissions.allow).toContain('Bash(git:*)');
  });

  test('user wins: existing user permissions/hooks preserved + appended', () => {
    const target = path.join(tempRoot, '.claude', 'settings.json');
    mkdirSync(path.dirname(target), { recursive: true });
    writeFileSync(
      target,
      JSON.stringify({
        permissions: { allow: ['Bash(npm:*)'] },
        hooks: [{ name: 'user-hook' }],
      }),
      'utf8',
    );
    mergeSettingsJson(target, [{ name: 'scs-hook' }], ['Bash(git:*)']);
    const content = JSON.parse(readFileSync(target, 'utf8'));
    expect(content.permissions.allow).toContain('Bash(npm:*)');
    expect(content.permissions.allow).toContain('Bash(git:*)');
    expect(content.hooks).toHaveLength(2);
    expect(content.hooks[0].name).toBe('user-hook');
    expect(content.hooks[1].name).toBe('scs-hook');
  });

  test('dedup permissions.allow on collision', () => {
    const target = path.join(tempRoot, '.claude', 'settings.json');
    mkdirSync(path.dirname(target), { recursive: true });
    writeFileSync(target, JSON.stringify({ permissions: { allow: ['Bash(git:*)'] } }), 'utf8');
    mergeSettingsJson(target, [], ['Bash(git:*)', 'Bash(npm:*)']);
    const content = JSON.parse(readFileSync(target, 'utf8'));
    expect(content.permissions.allow.filter((s: string) => s === 'Bash(git:*)')).toHaveLength(1);
    expect(content.permissions.allow).toContain('Bash(npm:*)');
  });

  test('throws on invalid JSON (fail-fast)', () => {
    const target = path.join(tempRoot, '.claude', 'settings.json');
    mkdirSync(path.dirname(target), { recursive: true });
    writeFileSync(target, '{invalid', 'utf8');
    expect(() => mergeSettingsJson(target, [{}], [])).toThrow(/invalid JSON/);
  });

  test('records scsAdditions in manifest entry for B-25 reverse', () => {
    const target = path.join(tempRoot, '.claude', 'settings.json');
    const entry = mergeSettingsJson(target, [{ name: 'h' }], ['p1']);
    expect(entry.scsAdditions).toEqual(['hooks[+1]', 'permissions.allow[+1]']);
  });
});
