import { mkdtempSync, rmSync, mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import * as path from 'node:path';

import { getBridgeVersion, _resetBridgeVersionCacheForTesting } from './bridgeVersion';

let tempRoot: string;

beforeEach(() => {
  tempRoot = mkdtempSync(path.join(tmpdir(), 'bridge-version-test-'));
  _resetBridgeVersionCacheForTesting();
});

afterEach(() => {
  if (tempRoot && existsSync(tempRoot)) {
    rmSync(tempRoot, { recursive: true, force: true });
  }
  _resetBridgeVersionCacheForTesting();
});

describe('getBridgeVersion (Diamond B-25-UX-fix3 · CD-110 DVSP)', () => {
  test('reads version from package.json at parent of cli.cjs', () => {
    // Mimic npm-install-g layout: <prefix>/lib/node_modules/scs-bridge/dist/cli.cjs
    const distDir = path.join(tempRoot, 'dist');
    mkdirSync(distDir, { recursive: true });
    const cliPath = path.join(distDir, 'cli.cjs');
    writeFileSync(cliPath, '#!/usr/bin/env node\nconsole.log("test");\n');
    writeFileSync(
      path.join(tempRoot, 'package.json'),
      JSON.stringify({ name: 'scs-bridge', version: '0.99.42' }),
    );
    expect(getBridgeVersion(cliPath)).toBe('0.99.42');
  });

  test('caches version on first call (subsequent calls return cached)', () => {
    const distDir = path.join(tempRoot, 'dist');
    mkdirSync(distDir, { recursive: true });
    const cliPath = path.join(distDir, 'cli.cjs');
    writeFileSync(cliPath, '');
    writeFileSync(path.join(tempRoot, 'package.json'), JSON.stringify({ version: '1.2.3' }));
    expect(getBridgeVersion(cliPath)).toBe('1.2.3');
    // Mutate package.json — cached value should still return
    writeFileSync(path.join(tempRoot, 'package.json'), JSON.stringify({ version: '9.9.9' }));
    expect(getBridgeVersion(cliPath)).toBe('1.2.3');
  });

  test('returns "unknown" when package.json missing', () => {
    const distDir = path.join(tempRoot, 'dist');
    mkdirSync(distDir, { recursive: true });
    const cliPath = path.join(distDir, 'cli.cjs');
    writeFileSync(cliPath, '');
    // No package.json
    expect(getBridgeVersion(cliPath)).toBe('unknown');
  });

  test('returns "unknown" when package.json malformed', () => {
    const distDir = path.join(tempRoot, 'dist');
    mkdirSync(distDir, { recursive: true });
    const cliPath = path.join(distDir, 'cli.cjs');
    writeFileSync(cliPath, '');
    writeFileSync(path.join(tempRoot, 'package.json'), '{not valid json');
    expect(getBridgeVersion(cliPath)).toBe('unknown');
  });

  test('returns "unknown" when cliPath empty (defensive)', () => {
    expect(getBridgeVersion('')).toBe('unknown');
  });

  test('returns version field even without other fields (defensive parse)', () => {
    const distDir = path.join(tempRoot, 'dist');
    mkdirSync(distDir, { recursive: true });
    const cliPath = path.join(distDir, 'cli.cjs');
    writeFileSync(cliPath, '');
    writeFileSync(path.join(tempRoot, 'package.json'), '{"version":"7.7.7"}');
    expect(getBridgeVersion(cliPath)).toBe('7.7.7');
  });
});
