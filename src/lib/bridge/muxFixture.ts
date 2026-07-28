// Diamond B-23 (CD-77 RDTFS · CD-78 MRV · CD-82 SHSDV · Muxification Test Fixture):
// Test infrastructure for the Muxification Branch. Suite 5 Cobalt scaffolds the
// Reference Design (typical Claude Code user setup) into a target directory;
// tests clone from the fixture, run muxification, run reverse-muxification,
// and verify state matches original via directory snapshot + compare.
//
// Defers actual muxify/reverse implementation to Diamond B-24 (muxify) and
// Diamond B-25 (uninstall command). B-23 provides only the test infrastructure.

import { createHash } from 'node:crypto';
import {
  cpSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import * as path from 'node:path';

import { SCS_MUX_FIXTURE_FILES } from './installConstants';
import { log } from './debugLog';

// Skip-list for snapshot + compare operations.
// - *.bak: B-3 timestamped CLAUDE.md backups (install-added; not part of fixture identity)
// - Cascades/Cascade.json: B-19 BECIS-written; varies on every install
// - Cascades/Bridge/: bridge runtime state (sessions, debug logs)
// - Cascades/Iced/: B-24 muxification record (install-added; varies per install) — Suite 6 Purple D-6
// - .git/: git metadata (not fixture-relevant)
// - node_modules/: never relevant for fixture comparison
const DEFAULT_SKIP_PATTERNS: readonly RegExp[] = [
  /\.bak$/,
  /(^|\/)Cascades\/Cascade\.json$/,
  /(^|\/)Cascades\/Bridge(\/|$)/,
  /(^|\/)Cascades\/Iced(\/|$)/,
  /(^|\/)\.git(\/|$)/,
  /(^|\/)node_modules(\/|$)/,
  /(^|\/)\.DS_Store$/,
];

function shouldSkip(relPath: string, extraPatterns: readonly RegExp[] = []): boolean {
  for (const re of DEFAULT_SKIP_PATTERNS) {
    if (re.test(relPath)) return true;
  }
  for (const re of extraPatterns) {
    if (re.test(relPath)) return true;
  }
  return false;
}

// Diamond B-23 (CD-77 RDTFS): scaffold the 8-file Reference Design at destDir.
// Idempotent — overwrites existing files (matches B-19 BECIS write semantic).
// Returns the list of files written for caller verification.
export function scaffoldReferenceDesignFixture(destDir: string): string[] {
  if (!existsSync(destDir)) {
    mkdirSync(destDir, { recursive: true });
  }
  const written: string[] = [];
  for (const [relPath, content] of SCS_MUX_FIXTURE_FILES) {
    const fullPath = path.join(destDir, relPath);
    const parentDir = path.dirname(fullPath);
    if (!existsSync(parentDir)) {
      mkdirSync(parentDir, { recursive: true });
    }
    writeFileSync(fullPath, content, 'utf8');
    written.push(relPath);
  }
  log('mux-fixture.scaffolded', { destDir, fileCount: written.length });
  return written;
}

// Diamond B-23 (CD-82 SHSDV): walk a directory recursively, hash each file's
// content, return aggregate SHA-256 over sorted (relPath, contentHash) pairs.
// Content-only — no stat metadata (mtime/atime would cause false-negatives).
// Skip-list excludes irrelevant files (.bak, .git/, node_modules/, etc.).
export function snapshotDirectoryHash(
  dir: string,
  extraSkipPatterns: readonly RegExp[] = [],
): string {
  if (!existsSync(dir)) {
    throw new Error(`snapshotDirectoryHash: directory does not exist: ${dir}`);
  }
  const entries: Array<{ relPath: string; contentHash: string }> = [];

  function walk(currentDir: string, relPrefix: string): void {
    const items = readdirSync(currentDir).sort();
    for (const item of items) {
      const fullPath = path.join(currentDir, item);
      const relPath = relPrefix ? `${relPrefix}/${item}` : item;
      if (shouldSkip(relPath, extraSkipPatterns)) continue;
      const st = statSync(fullPath);
      if (st.isDirectory()) {
        walk(fullPath, relPath);
      } else if (st.isFile()) {
        const content = readFileSync(fullPath);
        const fileHash = createHash('sha256').update(content).digest('hex');
        entries.push({ relPath, contentHash: fileHash });
      }
    }
  }

  walk(dir, '');
  // Aggregate: sort by relPath (deterministic) then hash the concatenation
  entries.sort((a, b) => a.relPath.localeCompare(b.relPath));
  const aggregator = createHash('sha256');
  for (const e of entries) {
    aggregator.update(e.relPath);
    aggregator.update('\0');
    aggregator.update(e.contentHash);
    aggregator.update('\0');
  }
  return aggregator.digest('hex');
}

// Diamond B-23 (CD-78 MRV): file-by-file content comparison between two
// directories. Returns array of differences; empty array means directories match.
// Difference type: 'only-in-a' | 'only-in-b' | 'content-mismatch'.
export type DirectoryDiff = {
  relPath: string;
  kind: 'only-in-a' | 'only-in-b' | 'content-mismatch';
};

export function compareDirectories(
  dirA: string,
  dirB: string,
  extraSkipPatterns: readonly RegExp[] = [],
): DirectoryDiff[] {
  if (!existsSync(dirA)) {
    throw new Error(`compareDirectories: dirA does not exist: ${dirA}`);
  }
  if (!existsSync(dirB)) {
    throw new Error(`compareDirectories: dirB does not exist: ${dirB}`);
  }

  function walkToMap(dir: string): Map<string, string> {
    const map = new Map<string, string>();
    function w(currentDir: string, relPrefix: string): void {
      const items = readdirSync(currentDir).sort();
      for (const item of items) {
        const fullPath = path.join(currentDir, item);
        const relPath = relPrefix ? `${relPrefix}/${item}` : item;
        if (shouldSkip(relPath, extraSkipPatterns)) continue;
        const st = statSync(fullPath);
        if (st.isDirectory()) {
          w(fullPath, relPath);
        } else if (st.isFile()) {
          const content = readFileSync(fullPath);
          const fileHash = createHash('sha256').update(content).digest('hex');
          map.set(relPath, fileHash);
        }
      }
    }
    w(dir, '');
    return map;
  }

  const mapA = walkToMap(dirA);
  const mapB = walkToMap(dirB);
  const diffs: DirectoryDiff[] = [];

  for (const [relPath, hashA] of mapA) {
    const hashB = mapB.get(relPath);
    if (hashB === undefined) {
      diffs.push({ relPath, kind: 'only-in-a' });
    } else if (hashB !== hashA) {
      diffs.push({ relPath, kind: 'content-mismatch' });
    }
  }
  for (const relPath of mapB.keys()) {
    if (!mapA.has(relPath)) {
      diffs.push({ relPath, kind: 'only-in-b' });
    }
  }
  diffs.sort((a, b) => a.relPath.localeCompare(b.relPath));
  return diffs;
}

// Diamond B-23: clone fixture (or any directory) to destination using cpSync.
// Idempotent — overwrites existing destination contents (matches B-13 cpSync
// semantic). Returns destDir for caller chaining.
export function cloneFixtureToDir(srcDir: string, destDir: string): string {
  if (!existsSync(srcDir)) {
    throw new Error(`cloneFixtureToDir: srcDir does not exist: ${srcDir}`);
  }
  if (!existsSync(destDir)) {
    mkdirSync(destDir, { recursive: true });
  }
  cpSync(srcDir, destDir, { recursive: true });
  log('mux-fixture.cloned', { srcDir, destDir });
  return destDir;
}
