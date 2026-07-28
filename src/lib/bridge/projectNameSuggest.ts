// Diamond B-25-UX (CD-98 SDSWN · CD-99 PTSNS · Project Name Suggestion + Sanitize):
// Generates 4-6 Suite 8 name suggestions for Strategy S8's SM-NAME-SUITE-8 menu.
// Sources: package.json `name` + CLAUDE.md H1/H2 + project type signals + dir basename.
// Sanitize pipeline fixes B-24-FIX bug where `user-project` would yield
// "User Project Project Context" via literal title-case + suffix append.
//
// Pattern 4 Modulation: filesystem-only reads within user cwd.

import { existsSync, readFileSync } from 'node:fs';
import * as path from 'node:path';

// Generic project names that should be SKIPPED — they offer no signal
// (post-sanitize match). Suite 4 Green's exhaustive list.
const GENERIC_SKIP_LIST: readonly string[] = [
  'my-app',
  'my-project',
  'user-project',
  'app',
  'project',
  'starter',
  'template',
  'boilerplate',
  'example',
  'test',
  'demo',
  'repo',
  'code',
];

// Trailing suffix variants stripped by sanitize step 2 (case-insensitive).
const TRAILING_SUFFIX_PATTERNS: readonly RegExp[] = [/-project$/i, /_project$/i, /\sproject$/i];

export type ProjectTypeSignal =
  | 'TypeScript'
  | 'Node'
  | 'Python'
  | 'Rust'
  | 'Go'
  | 'Vue'
  | 'React'
  | 'unknown';

export type NameSuggestion = {
  label: string; // Display text in SM-NAME-SUITE-8 menu
  value: string; // Suite 8 directory name (sanitized · ready for Cascades/8_SUITES/{value}/)
  source: 'pkg-name' | 'pkg-name-typed' | 'h2-vocab' | 'h1-derived' | 'dir-basename' | 'fallback';
};

// Diamond B-25-UX (CD-98 SDSWN · sanitize bug fix):
// Pipeline: strip @scope/ → strip trailing -project/_project/ project →
// replace - and _ with space → title-case → return BARE name.
// Caller appends " Project Context" or type-specific suffix.
export function sanitizeProjectName(raw: string): string {
  if (!raw || raw.trim() === '') return '';

  let s = raw.trim();

  // Step 1: strip @scope/ prefix
  s = s.replace(/^@[^/]+\//, '');

  // Step 2: strip trailing -project / _project /  project (case-insensitive · ONLY trailing)
  for (const pattern of TRAILING_SUFFIX_PATTERNS) {
    s = s.replace(pattern, '');
  }

  // Step 3: replace - and _ with space
  s = s.replace(/[-_]+/g, ' ').trim();

  // Step 4: title-case each word (preserve internal capitalization for known patterns)
  s = s
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');

  return s;
}

// Diamond B-25-UX: check if sanitized name is generic (post-sanitize comparison).
export function isGenericName(sanitized: string): boolean {
  const lower = sanitized.toLowerCase();
  // Compare against original generic-skip list AND post-sanitize variants
  for (const generic of GENERIC_SKIP_LIST) {
    if (lower === generic) return true;
    // Also check sanitized form of the generic itself
    if (lower === sanitizeProjectName(generic).toLowerCase()) return true;
  }
  return false;
}

// Diamond B-25-UX (CD-99 PTSNS · Project Type Signal Naming Suggestion Heuristic):
// Detect project type from filesystem signals · informs Slot B suggestion.
export function detectProjectType(userCwd: string): ProjectTypeSignal {
  if (existsSync(path.join(userCwd, 'tsconfig.json'))) return 'TypeScript';
  if (existsSync(path.join(userCwd, 'pyproject.toml'))) return 'Python';
  if (existsSync(path.join(userCwd, 'requirements.txt'))) return 'Python';
  if (existsSync(path.join(userCwd, 'Cargo.toml'))) return 'Rust';
  if (existsSync(path.join(userCwd, 'go.mod'))) return 'Go';
  if (existsSync(path.join(userCwd, 'vue.config.js'))) return 'Vue';
  if (existsSync(path.join(userCwd, 'package.json'))) {
    try {
      const pkg = JSON.parse(readFileSync(path.join(userCwd, 'package.json'), 'utf8')) as {
        dependencies?: Record<string, string>;
        devDependencies?: Record<string, string>;
      };
      const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };
      if (allDeps.vue) return 'Vue';
      if (allDeps.react) return 'React';
      if (allDeps.typescript) return 'TypeScript';
      return 'Node';
    } catch {
      return 'Node';
    }
  }
  return 'unknown';
}

// Diamond B-25-UX: extract H1 + first 2 distinct H2 headers from CLAUDE.md.
export function extractClaudeMdHeaders(claudeMdPath: string): {
  h1: string | null;
  h2List: string[];
} {
  if (!existsSync(claudeMdPath)) return { h1: null, h2List: [] };
  try {
    const content = readFileSync(claudeMdPath, 'utf8');
    const lines = content.split('\n');
    let h1: string | null = null;
    const h2List: string[] = [];
    for (const line of lines) {
      const h1Match = line.match(/^#\s+(.+)$/);
      if (h1Match && !h1) h1 = h1Match[1].trim();
      const h2Match = line.match(/^##\s+(.+)$/);
      if (h2Match) {
        const label = h2Match[1].trim();
        if (!h2List.includes(label)) h2List.push(label);
      }
    }
    return { h1, h2List };
  } catch {
    return { h1: null, h2List: [] };
  }
}

// Diamond B-25-UX (CD-98 SDSWN · main suggestion generator):
// Reads package.json + CLAUDE.md + project signals · returns 4-6 suggestions.
// Suggestion mix per Suite 4 Green Angle 1:
//   Slot A: top algorithmic (pkg.name → sanitized + " Project Context")
//   Slot B: type-qualified (pkg.name + detected type label)
//   Slot C: H2 vocab — first distinct
//   Slot D: H2 vocab — second distinct (omit if <2 H2s)
//   Slot E: bare name (no suffix)
//   Slot F: [Custom] free-text input — handled by menu, not by this function
export function generateNameSuggestions(opts: {
  userCwd: string;
  preInstallSnapshotDir?: string; // optional: read CLAUDE.md from snapshot if scaffold already replaced live
}): NameSuggestion[] {
  const { userCwd, preInstallSnapshotDir } = opts;

  // Read package.json
  let pkgName = '';
  const pkgPath = path.join(userCwd, 'package.json');
  if (existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(readFileSync(pkgPath, 'utf8')) as { name?: string };
      pkgName = pkg.name ?? '';
    } catch {
      pkgName = '';
    }
  }

  // Read CLAUDE.md (snapshot preferred · live fallback)
  const candidateClaudeMdPaths = [
    preInstallSnapshotDir ? path.join(preInstallSnapshotDir, '.claude', 'CLAUDE.md') : '',
    preInstallSnapshotDir ? path.join(preInstallSnapshotDir, 'CLAUDE.md') : '',
    path.join(userCwd, '.claude', 'CLAUDE.md'),
    path.join(userCwd, 'CLAUDE.md'),
  ].filter(Boolean);

  let h1: string | null = null;
  let h2List: string[] = [];
  for (const p of candidateClaudeMdPaths) {
    if (existsSync(p)) {
      const headers = extractClaudeMdHeaders(p);
      if (headers.h1 || headers.h2List.length > 0) {
        h1 = headers.h1;
        h2List = headers.h2List;
        break;
      }
    }
  }

  const projectType = detectProjectType(userCwd);
  const suggestions: NameSuggestion[] = [];

  // Slot A: top algorithmic from pkg.name (skipping if generic)
  const sanitizedPkg = sanitizeProjectName(pkgName);
  if (sanitizedPkg && !isGenericName(sanitizedPkg)) {
    suggestions.push({
      label: `${sanitizedPkg} Project Context`,
      value: `${sanitizedPkg} Project Context`,
      source: 'pkg-name',
    });
  } else if (h1) {
    // Fallback: derive from H1
    const sanitizedH1 = sanitizeProjectName(h1);
    if (sanitizedH1 && !isGenericName(sanitizedH1)) {
      suggestions.push({
        label: `${sanitizedH1} Project Context`,
        value: `${sanitizedH1} Project Context`,
        source: 'h1-derived',
      });
    }
  }

  // Slot B: type-qualified (only if type detected AND we have a base name)
  if (projectType !== 'unknown' && sanitizedPkg && !isGenericName(sanitizedPkg)) {
    const typeSuffix = projectType === 'TypeScript' ? 'TypeScript Library' : `${projectType} App`;
    suggestions.push({
      label: `${sanitizedPkg} ${typeSuffix}`,
      value: `${sanitizedPkg} ${typeSuffix}`,
      source: 'pkg-name-typed',
    });
  }

  // Slot C: H2 vocab — first distinct (skip generic conventions/workflow/testing)
  const genericH2 = new Set([
    'conventions',
    'workflow',
    'testing',
    'usage',
    'overview',
    'introduction',
    'getting started',
    'installation',
    'configuration',
  ]);
  const meaningfulH2 = h2List.filter((h) => !genericH2.has(h.toLowerCase()));
  if (meaningfulH2.length >= 1) {
    const slotC = sanitizeProjectName(meaningfulH2[0]);
    if (slotC) {
      suggestions.push({
        label: `${slotC} Context`,
        value: `${slotC} Context`,
        source: 'h2-vocab',
      });
    }
  }

  // Slot D: H2 vocab — second distinct
  if (meaningfulH2.length >= 2) {
    const slotD = sanitizeProjectName(meaningfulH2[1]);
    if (slotD) {
      suggestions.push({
        label: `${slotD} Context`,
        value: `${slotD} Context`,
        source: 'h2-vocab',
      });
    }
  }

  // Slot E: bare name (no suffix · only if non-generic)
  if (sanitizedPkg && !isGenericName(sanitizedPkg)) {
    const bare: NameSuggestion = {
      label: sanitizedPkg,
      value: sanitizedPkg,
      source: 'pkg-name',
    };
    // Avoid duplicate if Slot A already used the bare name
    if (!suggestions.some((s) => s.value === bare.value)) {
      suggestions.push(bare);
    }
  }

  // Fallback: dir basename if we have nothing
  if (suggestions.length === 0) {
    const basename = path.basename(userCwd);
    const sanitized = sanitizeProjectName(basename);
    if (sanitized && !isGenericName(sanitized)) {
      suggestions.push({
        label: `${sanitized} Project Context`,
        value: `${sanitized} Project Context`,
        source: 'dir-basename',
      });
    }
  }

  // Final fallback: literal default
  if (suggestions.length === 0) {
    suggestions.push({
      label: 'User Project Context',
      value: 'User Project Context',
      source: 'fallback',
    });
  }

  // Cap at 5 algorithmic suggestions (menu adds Custom + Cancel rows separately)
  return suggestions.slice(0, 5);
}
