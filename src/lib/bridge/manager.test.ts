import { readFileSync, existsSync } from 'node:fs';
import { mkdtemp, rm, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

// Diamond N Fix N-B: registry-first resume. Layer-1 source-scan invariants —
// the manager.ts source must consult listSessions() BEFORE loadSessionMeta()
// for claudeSessionId resolution, with meta.json as fallback.

describe('manager Diamond N Fix N-B — registry-first resume (Layer-1 invariants)', () => {
  const src = readFileSync(join(__dirname, 'manager.ts'), 'utf-8');

  test('imports listSessions from registry', () => {
    expect(src).toMatch(/import\s*\{[^}]*\blistSessions\b[^}]*\}\s*from\s*['"]\.\/registry['"]/s);
  });

  test('launchInformative calls listSessions to read registry first', () => {
    // Find the launchInformative function body and assert listSessions appears.
    const fnMatch = src.match(/export async function launchInformative[\s\S]*?^}/m);
    expect(fnMatch).not.toBeNull();
    expect(fnMatch![0]).toMatch(/await\s+listSessions\(\)/);
  });

  test('claudeSessionId resolved from registry first, meta as fallback', () => {
    const fnMatch = src.match(/export async function launchInformative[\s\S]*?^}/m);
    expect(fnMatch).not.toBeNull();
    const body = fnMatch![0];
    // Must have an entry-find against listed sessions.
    expect(body).toMatch(/sessions\.find\(\s*\(s\)\s*=>\s*s\.id\s*===\s*sessionId\s*\)/);
    // Must have the fallback assignment to meta.claudeSessionId.
    expect(body).toMatch(/claudeSessionId\s*===\s*undefined/);
    expect(body).toMatch(/claudeSessionId\s*=\s*meta\.claudeSessionId/);
  });

  test('resume guard checks resolved claudeSessionId (not meta.claudeSessionId directly)', () => {
    const fnMatch = src.match(/export async function launchInformative[\s\S]*?^}/m);
    const body = fnMatch![0];
    // The throw guard should test the resolved local, not meta.claudeSessionId.
    expect(body).toMatch(/if\s*\(\s*mode\s*===\s*'resume'\s*&&\s*!claudeSessionId\s*\)/);
  });

  test('return shape uses resolved claudeSessionId (not meta.claudeSessionId)', () => {
    const fnMatch = src.match(/export async function launchInformative[\s\S]*?^}/m);
    const body = fnMatch![0];
    // The return statement must reference claudeSessionId directly, not meta.claudeSessionId.
    expect(body).toMatch(/return\s*\{[\s\S]*?claudeSessionId,[\s\S]*?\}/);
    expect(body).not.toMatch(/claudeSessionId:\s*meta\.claudeSessionId/);
  });

  test('throw message preserved verbatim (backward-compat)', () => {
    expect(src).toMatch(/hasn't started yet/);
    expect(src).toMatch(/SessionStart hook hasn't fired/);
  });
});

// Diamond P Fix P-2c: Diamond O isSynthesized gate REVERTED.
// Synthesized sessions are now first-class via Diamond P scaffold —
// loadSessionMeta + writeSessionMeta operate unconditionally because the
// scaffold has already written meta.json + spawn-settings.json before
// addSession exposes the entry. Layer-1 source-scan asserts the revert.
describe('manager Diamond P Fix P-2c — isSynthesized gate REVERTED (Layer-1 invariants)', () => {
  const src = readFileSync(join(__dirname, 'manager.ts'), 'utf-8');
  const fnMatch = src.match(/export async function launchInformative[\s\S]*?^}/m);

  test('launchInformative function exists', () => {
    expect(fnMatch).not.toBeNull();
  });

  test('launchInformative body contains NO isSynthesized identifier (gate fully reverted)', () => {
    const body = fnMatch![0];
    expect(body).not.toMatch(/isSynthesized/);
  });

  test('loadSessionMeta is called unconditionally (not behind a !isSynthesized branch)', () => {
    const body = fnMatch![0];
    expect(body).toMatch(/await\s+loadSessionMeta\s*\(/);
    expect(body).not.toMatch(/if\s*\(\s*!\s*isSynthesized\s*\)\s*\{[\s\S]*?loadSessionMeta\(/);
  });

  test('settingsPath is passed unconditionally to launchClaudeWindow (no ternary)', () => {
    const body = fnMatch![0];
    expect(body).not.toMatch(/settingsPath:\s*isSynthesized\s*\?\s*null\s*:\s*settingsPath/);
    expect(body).toMatch(/settingsPath,/);
  });

  test('writeSessionMeta is called unconditionally (no isSynthesized branch)', () => {
    const body = fnMatch![0];
    expect(body).toMatch(/await\s+writeSessionMeta\s*\(/);
    expect(body).not.toMatch(/if\s*\(\s*!\s*isSynthesized\s*\)\s*\{[\s\S]*?writeSessionMeta\(/);
  });
});

// Diamond P Fix P-2a: scaffoldDiscoveredSession real-fs idempotent capsule writer.
describe('manager Diamond P Fix P-2a — scaffoldDiscoveredSession (real-fs capsule)', () => {
  // Module-cached cwd capture before mocking.
  const ORIGINAL_CWD = process.cwd();
  let tmpRoot: string;
  let originalChdir: string;

  beforeAll(async () => {
    tmpRoot = await mkdtemp(join(tmpdir(), 'scs-bridge-scaffold-'));
    originalChdir = process.cwd();
    process.chdir(tmpRoot);
  });

  afterAll(async () => {
    process.chdir(originalChdir ?? ORIGINAL_CWD);
    await rm(tmpRoot, { recursive: true, force: true });
  });

  test('scaffoldDiscoveredSession exists as exported function', () => {
    const src = readFileSync(join(__dirname, 'manager.ts'), 'utf-8');
    expect(src).toMatch(/export\s+async\s+function\s+scaffoldDiscoveredSession/);
  });

  test('scaffold creates session dir + 4 priority subdirs + meta.json + spawn-settings.json', async () => {
    const { scaffoldDiscoveredSession } = await import('./manager');
    const ulidStr = '01DISCOVERED-TESTSCAFFOLD-AAAAAA';
    const cwd = '/Users/foo/proj-scaffold';
    const claudeSessionId = 'abc-123-uuid';
    const mtimeMs = 1746576000000;

    await scaffoldDiscoveredSession(ulidStr, cwd, claudeSessionId, mtimeMs);

    const sessionRoot = join(tmpRoot, 'Cascades', 'Bridge', 'sessions', ulidStr);
    expect(existsSync(sessionRoot)).toBe(true);
    expect(existsSync(join(sessionRoot, 'heads'))).toBe(true);
    expect(existsSync(join(sessionRoot, 'body'))).toBe(true);
    expect(existsSync(join(sessionRoot, 'tails'))).toBe(true);
    expect(existsSync(join(sessionRoot, 'archive'))).toBe(true);
    expect(existsSync(join(sessionRoot, 'meta.json'))).toBe(true);
    expect(existsSync(join(sessionRoot, 'spawn-settings.json'))).toBe(true);

    const metaRaw = await readFile(join(sessionRoot, 'meta.json'), 'utf8');
    const meta = JSON.parse(metaRaw);
    expect(meta.id).toBe(ulidStr);
    expect(meta.claudeSessionId).toBe(claudeSessionId);
    expect(meta.cwd).toBe(cwd);
    expect(meta.spawnedAt).toBe(mtimeMs);
    expect(meta.claudeBinary).toBe('claude');
  });

  test('idempotent: second call with same ULID does not throw and does not overwrite', async () => {
    const { scaffoldDiscoveredSession } = await import('./manager');
    const ulidStr = '01DISCOVERED-IDEMPOTENT-BBBBBB';
    await scaffoldDiscoveredSession(ulidStr, '/cwd1', 'uuid1', 1000);
    const metaPathStr = join(tmpRoot, 'Cascades', 'Bridge', 'sessions', ulidStr, 'meta.json');
    const first = await readFile(metaPathStr, 'utf8');
    // Second call with different params must NOT overwrite.
    await scaffoldDiscoveredSession(ulidStr, '/cwd2', 'uuid2', 2000);
    const second = await readFile(metaPathStr, 'utf8');
    expect(second).toBe(first);
  });
});
