import { mkdtempSync, rmSync, mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import * as path from 'node:path';

import { detectUserState, detectMuxState } from './muxDetect';

let tempRoot: string;

beforeEach(() => {
  tempRoot = mkdtempSync(path.join(tmpdir(), 'mux-detect-test-'));
});

afterEach(() => {
  if (tempRoot && existsSync(tempRoot)) {
    rmSync(tempRoot, { recursive: true, force: true });
  }
});

describe('detectUserState (Diamond B-24 · CD-84 MPAD)', () => {
  test('returns all-false on empty directory', () => {
    const r = detectUserState(tempRoot);
    expect(r.detected).toBe(false);
    expect(r.hasRootClaudeMd).toBe(false);
    expect(r.hasDotClaudeClaudeMd).toBe(false);
    expect(r.hasUserAgents).toBe(false);
    expect(r.hasUserCommands).toBe(false);
    expect(r.hasUserSettings).toBe(false);
  });

  test('detects root CLAUDE.md', () => {
    writeFileSync(path.join(tempRoot, 'CLAUDE.md'), '# user');
    const r = detectUserState(tempRoot);
    expect(r.hasRootClaudeMd).toBe(true);
    expect(r.detected).toBe(true);
  });

  test('detects .claude/CLAUDE.md', () => {
    mkdirSync(path.join(tempRoot, '.claude'), { recursive: true });
    writeFileSync(path.join(tempRoot, '.claude', 'CLAUDE.md'), '# user');
    const r = detectUserState(tempRoot);
    expect(r.hasDotClaudeClaudeMd).toBe(true);
    expect(r.detected).toBe(true);
  });

  test('detects user agents (ignores .gitkeep)', () => {
    mkdirSync(path.join(tempRoot, '.claude', 'agents'), { recursive: true });
    writeFileSync(path.join(tempRoot, '.claude', 'agents', '.gitkeep'), '');
    expect(detectUserState(tempRoot).hasUserAgents).toBe(false);
    writeFileSync(path.join(tempRoot, '.claude', 'agents', 'my-reviewer.md'), '# agent');
    expect(detectUserState(tempRoot).hasUserAgents).toBe(true);
  });

  test('detects user commands', () => {
    mkdirSync(path.join(tempRoot, '.claude', 'commands'), { recursive: true });
    writeFileSync(path.join(tempRoot, '.claude', 'commands', 'review.md'), '# cmd');
    expect(detectUserState(tempRoot).hasUserCommands).toBe(true);
  });

  test('detects non-empty settings.json (treats {} as empty)', () => {
    mkdirSync(path.join(tempRoot, '.claude'), { recursive: true });
    writeFileSync(path.join(tempRoot, '.claude', 'settings.json'), '{}');
    expect(detectUserState(tempRoot).hasUserSettings).toBe(false);
    writeFileSync(path.join(tempRoot, '.claude', 'settings.json'), '{"permissions":{"allow":[]}}');
    expect(detectUserState(tempRoot).hasUserSettings).toBe(true);
  });
});

describe('detectMuxState (Diamond B-24 · CD-84 MPAD + CD-89 RRTMU)', () => {
  test('returns fresh on empty cwd', () => {
    const r = detectMuxState(tempRoot);
    expect(r.state).toBe('fresh');
    expect(r.hasIcedManifest).toBe(false);
  });

  test('returns muxified when user state present, no Iced', () => {
    writeFileSync(path.join(tempRoot, 'CLAUDE.md'), '# user');
    const r = detectMuxState(tempRoot);
    expect(r.state).toBe('muxified');
    expect(r.userState.detected).toBe(true);
  });

  test('returns remuxify when Iced manifest present', () => {
    mkdirSync(path.join(tempRoot, 'Cascades', 'Iced'), { recursive: true });
    writeFileSync(
      path.join(tempRoot, 'Cascades', 'Iced', 'MuxificationManifest.json'),
      '{"version":1}',
    );
    const r = detectMuxState(tempRoot);
    expect(r.state).toBe('remuxify');
    expect(r.hasIcedManifest).toBe(true);
  });

  test('remuxify takes precedence over user state', () => {
    writeFileSync(path.join(tempRoot, 'CLAUDE.md'), '# user');
    mkdirSync(path.join(tempRoot, 'Cascades', 'Iced'), { recursive: true });
    writeFileSync(
      path.join(tempRoot, 'Cascades', 'Iced', 'MuxificationManifest.json'),
      '{"version":1}',
    );
    expect(detectMuxState(tempRoot).state).toBe('remuxify');
  });
});
