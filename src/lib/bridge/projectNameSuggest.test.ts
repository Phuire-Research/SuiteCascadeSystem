import { mkdtempSync, rmSync, mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import * as path from 'node:path';

import {
  sanitizeProjectName,
  isGenericName,
  detectProjectType,
  extractClaudeMdHeaders,
  generateNameSuggestions,
} from './projectNameSuggest';

let tempRoot: string;

beforeEach(() => {
  tempRoot = mkdtempSync(path.join(tmpdir(), 'name-suggest-test-'));
});

afterEach(() => {
  if (tempRoot && existsSync(tempRoot)) {
    rmSync(tempRoot, { recursive: true, force: true });
  }
});

describe('sanitizeProjectName (Diamond B-25-UX · CD-98 SDSWN · Suite 4 Green test cases)', () => {
  test('strips @scope/ prefix', () => {
    expect(sanitizeProjectName('@scope/pkg')).toBe('Pkg');
  });

  test('strips trailing -project case-insensitive', () => {
    expect(sanitizeProjectName('awesome-project')).toBe('Awesome');
    expect(sanitizeProjectName('AWESOME-PROJECT')).toBe('AWESOME');
  });

  test('strips trailing _project', () => {
    expect(sanitizeProjectName('weird_project')).toBe('Weird');
  });

  test('strips trailing space-project', () => {
    expect(sanitizeProjectName('Weird Project')).toBe('Weird');
  });

  test('B-24-FIX BUG FIX: user-project → User (no double Project)', () => {
    expect(sanitizeProjectName('user-project')).toBe('User');
  });

  test('replaces - and _ with space and title-cases', () => {
    expect(sanitizeProjectName('weird_name')).toBe('Weird Name');
    expect(sanitizeProjectName('my-typescript-app')).toBe('My Typescript App');
  });

  test('handles empty string', () => {
    expect(sanitizeProjectName('')).toBe('');
    expect(sanitizeProjectName('   ')).toBe('');
  });

  test('preserves numeric prefix', () => {
    expect(sanitizeProjectName('123-numbers')).toBe('123 Numbers');
  });

  test('strips multiple internal separators', () => {
    expect(sanitizeProjectName('a__b---c')).toBe('A B C');
  });
});

describe('isGenericName (Suite 4 Green generic-skip list)', () => {
  test('matches generic names case-insensitively', () => {
    expect(isGenericName('My App')).toBe(true);
    expect(isGenericName('my-app')).toBe(true);
    expect(isGenericName('Project')).toBe(true);
    expect(isGenericName('Demo')).toBe(true);
  });

  test('does NOT match meaningful names', () => {
    expect(isGenericName('Pkg')).toBe(false);
    expect(isGenericName('Awesome')).toBe(false);
    expect(isGenericName('My Cool App')).toBe(false);
  });
});

describe('detectProjectType (Diamond B-25-UX · CD-99 PTSNS)', () => {
  test('detects TypeScript via tsconfig.json', () => {
    writeFileSync(path.join(tempRoot, 'tsconfig.json'), '{}');
    expect(detectProjectType(tempRoot)).toBe('TypeScript');
  });

  test('detects Python via pyproject.toml', () => {
    writeFileSync(path.join(tempRoot, 'pyproject.toml'), '');
    expect(detectProjectType(tempRoot)).toBe('Python');
  });

  test('detects Rust via Cargo.toml', () => {
    writeFileSync(path.join(tempRoot, 'Cargo.toml'), '');
    expect(detectProjectType(tempRoot)).toBe('Rust');
  });

  test('detects Vue via package.json devDependencies', () => {
    writeFileSync(
      path.join(tempRoot, 'package.json'),
      JSON.stringify({ devDependencies: { vue: '^3.0' } }),
    );
    expect(detectProjectType(tempRoot)).toBe('Vue');
  });

  test('falls back to Node for plain package.json', () => {
    writeFileSync(path.join(tempRoot, 'package.json'), '{}');
    expect(detectProjectType(tempRoot)).toBe('Node');
  });

  test('returns unknown for empty directory', () => {
    expect(detectProjectType(tempRoot)).toBe('unknown');
  });
});

describe('extractClaudeMdHeaders', () => {
  test('extracts H1 + distinct H2 list', () => {
    const target = path.join(tempRoot, 'CLAUDE.md');
    writeFileSync(
      target,
      '# Project Title\n\n## Conventions\n\n## Workflow\n\n## Auth Service\n',
      'utf8',
    );
    const r = extractClaudeMdHeaders(target);
    expect(r.h1).toBe('Project Title');
    expect(r.h2List).toEqual(['Conventions', 'Workflow', 'Auth Service']);
  });

  test('returns empty when file missing', () => {
    expect(extractClaudeMdHeaders(path.join(tempRoot, 'missing.md'))).toEqual({
      h1: null,
      h2List: [],
    });
  });
});

describe('generateNameSuggestions (Diamond B-25-UX · CD-98 SDSWN · 4-6 slot mix)', () => {
  test('generic pkg.name skips Slot A → falls to H1 derivation', () => {
    writeFileSync(path.join(tempRoot, 'package.json'), JSON.stringify({ name: 'user-project' }));
    writeFileSync(
      path.join(tempRoot, 'CLAUDE.md'),
      '# Awesome Service\n\n## Configuration\n',
      'utf8',
    );
    const suggestions = generateNameSuggestions({ userCwd: tempRoot });
    expect(suggestions[0].source).toBe('h1-derived');
    expect(suggestions[0].value).toContain('Awesome Service');
  });

  test('non-generic pkg.name + TypeScript signal yields type-qualified Slot B', () => {
    writeFileSync(
      path.join(tempRoot, 'package.json'),
      JSON.stringify({ name: 'awesome-lib', devDependencies: { typescript: '^5' } }),
    );
    writeFileSync(path.join(tempRoot, 'tsconfig.json'), '{}');
    const suggestions = generateNameSuggestions({ userCwd: tempRoot });
    const typeQualified = suggestions.find((s) => s.source === 'pkg-name-typed');
    expect(typeQualified?.value).toBe('Awesome Lib TypeScript Library');
  });

  test('returns "User Project Context" fallback when ALL signals (incl. dir basename) are generic', () => {
    // Use a known-generic dir basename so dir-basename layer ALSO skips
    const generic = path.join(tempRoot, 'project');
    mkdirSync(generic);
    const suggestions = generateNameSuggestions({ userCwd: generic });
    expect(suggestions).toHaveLength(1);
    expect(suggestions[0].value).toBe('User Project Context');
    expect(suggestions[0].source).toBe('fallback');
  });

  test('uses dir basename when no other signal but basename is meaningful', () => {
    const meaningful = path.join(tempRoot, 'cool-service');
    mkdirSync(meaningful);
    const suggestions = generateNameSuggestions({ userCwd: meaningful });
    expect(suggestions[0].source).toBe('dir-basename');
    expect(suggestions[0].value).toContain('Cool Service');
  });

  test('caps suggestions at 5 algorithmic slots', () => {
    writeFileSync(
      path.join(tempRoot, 'package.json'),
      JSON.stringify({ name: 'cool-lib', devDependencies: { typescript: '^5' } }),
    );
    writeFileSync(path.join(tempRoot, 'tsconfig.json'), '{}');
    writeFileSync(
      path.join(tempRoot, 'CLAUDE.md'),
      '# Cool\n\n## Auth\n\n## API\n\n## UI\n\n## Database\n',
      'utf8',
    );
    const suggestions = generateNameSuggestions({ userCwd: tempRoot });
    expect(suggestions.length).toBeLessThanOrEqual(5);
  });

  test('reads CLAUDE.md from preInstallSnapshotDir if provided (post-drop-in scenario)', () => {
    const snap = path.join(tempRoot, 'snap');
    mkdirSync(path.join(snap, '.claude'), { recursive: true });
    writeFileSync(
      path.join(snap, '.claude', 'CLAUDE.md'),
      '# Snapshot Service\n\n## Operations\n',
      'utf8',
    );
    // Live .claude/CLAUDE.md is SCS Manifold (drop-in) — should NOT be source
    mkdirSync(path.join(tempRoot, '.claude'), { recursive: true });
    writeFileSync(path.join(tempRoot, '.claude', 'CLAUDE.md'), '# SCS Manifold\n', 'utf8');
    const suggestions = generateNameSuggestions({
      userCwd: tempRoot,
      preInstallSnapshotDir: snap,
    });
    expect(suggestions[0].value).toContain('Snapshot Service');
  });
});
