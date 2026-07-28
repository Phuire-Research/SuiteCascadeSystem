import { mkdtempSync, rmSync, writeFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import * as path from 'node:path';

import { detectRouterPattern } from './routerDetect';

let tempRoot: string;

beforeEach(() => {
  tempRoot = mkdtempSync(path.join(tmpdir(), 'router-detect-test-'));
});

afterEach(() => {
  if (tempRoot && existsSync(tempRoot)) {
    rmSync(tempRoot, { recursive: true, force: true });
  }
});

describe('detectRouterPattern (Diamond B-25-UX · CD-101 CMSRD · 3-signal gate)', () => {
  test('returns empty result on missing file', () => {
    const r = detectRouterPattern(path.join(tempRoot, 'missing.md'));
    expect(r.isRouterPattern).toBe(false);
    expect(r.h2Count).toBe(0);
  });

  test('NOT router-pattern: simple non-router doc with 2 H2s', () => {
    const target = path.join(tempRoot, 'CLAUDE.md');
    writeFileSync(target, '# Project\n\n## Conventions\n\n## Workflow\n', 'utf8');
    const r = detectRouterPattern(target);
    expect(r.isRouterPattern).toBe(false);
    expect(r.h2Count).toBe(2);
  });

  test('NOT router-pattern: 4 H2s but no router keywords (Suite 4 Green non-router 4-section case)', () => {
    const target = path.join(tempRoot, 'CLAUDE.md');
    writeFileSync(
      target,
      '# Tool\n## Installation\n## Configuration\n## Deployment\n## Troubleshooting\n',
      'utf8',
    );
    const r = detectRouterPattern(target);
    expect(r.h2Count).toBe(4);
    expect(r.routerKeywordsFound.length).toBeLessThan(2);
    expect(r.isRouterPattern).toBe(false);
  });

  test('NOT router-pattern: router keywords but H2s are token-overlapping (Auth Tips / Auth Patterns)', () => {
    const target = path.join(tempRoot, 'CLAUDE.md');
    writeFileSync(
      target,
      '# Auth Project\n## Auth Tips\n## Auth Patterns\n## Auth Helpers\n## Auth Errors\nrouter and dispatch logic\n',
      'utf8',
    );
    const r = detectRouterPattern(target);
    expect(r.routerKeywordsFound.length).toBeGreaterThanOrEqual(2);
    expect(r.mutualExclusiveCount).toBeLessThan(2);
    expect(r.isRouterPattern).toBe(false);
  });

  test('IS router-pattern: 4+ H2s · 2+ router keywords · 2+ mutually exclusive pairs', () => {
    const target = path.join(tempRoot, 'CLAUDE.md');
    writeFileSync(
      target,
      `# Multi-Service App

This project uses a router pattern to dispatch requests across services.

## Auth Service

Handles login, sessions, tokens.

## Payment Service

Handles checkout and billing.

## Notification Service

Handles email and push.

## Admin Console

Backend management UI.
`,
      'utf8',
    );
    const r = detectRouterPattern(target);
    expect(r.h2Count).toBe(4);
    expect(r.routerKeywordsFound).toEqual(expect.arrayContaining(['router', 'dispatch']));
    expect(r.mutualExclusiveCount).toBeGreaterThanOrEqual(2);
    expect(r.isRouterPattern).toBe(true);
  });

  test('returns distinct H2 labels (no dupes)', () => {
    const target = path.join(tempRoot, 'CLAUDE.md');
    writeFileSync(target, '## A\n## A\n## B\n', 'utf8');
    const r = detectRouterPattern(target);
    expect(r.h2Labels).toEqual(['A', 'B']);
    expect(r.h2Count).toBe(2);
  });

  test('detects router keywords case-insensitively', () => {
    const target = path.join(tempRoot, 'CLAUDE.md');
    writeFileSync(target, 'ROUTER and DISPATCH and Orchestrate', 'utf8');
    const r = detectRouterPattern(target);
    expect(r.routerKeywordsFound).toEqual(
      expect.arrayContaining(['router', 'dispatch', 'orchestrat']),
    );
  });
});
