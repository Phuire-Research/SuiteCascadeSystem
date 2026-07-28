import { mkdtempSync, rmSync, existsSync, writeFileSync, mkdirSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import * as path from 'node:path';

import {
  bridgeMetadataPath,
  writeBridgeMetadata,
  readBridgeMetadata,
  type BridgeMetadataState,
} from './bridgeMetadata';

let tempHome: string;

beforeEach(() => {
  tempHome = mkdtempSync(path.join(tmpdir(), 'bridge-metadata-test-home-'));
});

afterEach(() => {
  if (tempHome && existsSync(tempHome)) {
    rmSync(tempHome, { recursive: true, force: true });
  }
});

describe('bridgeMetadataPath (REF-D2 · BJLM)', () => {
  test('resolves to <home>/.scs-bridge/bridge.json when override provided', () => {
    expect(bridgeMetadataPath(tempHome)).toBe(
      path.join(tempHome, '.scs-bridge', 'bridge.json'),
    );
  });

  test('uses os.homedir() when override absent', () => {
    const real = bridgeMetadataPath();
    expect(real.endsWith(path.join('.scs-bridge', 'bridge.json'))).toBe(true);
  });
});

describe('writeBridgeMetadata (REF-D2 · BJLM atomic write)', () => {
  test('writes valid JSON with schemaVersion 1 to ~/.scs-bridge/bridge.json', async () => {
    const state: BridgeMetadataState = {
      bridgeVersion: '0.41.0',
      port: 7111,
      userCwd: '/test/project',
      spawnsByScp: new Map(),
      installedScps: [],
    };
    await writeBridgeMetadata(state, bridgeMetadataPath(tempHome));
    const finalPath = bridgeMetadataPath(tempHome);
    expect(existsSync(finalPath)).toBe(true);
    const raw = readFileSync(finalPath, 'utf8');
    const parsed = JSON.parse(raw);
    expect(parsed.schemaVersion).toBe(1);
    expect(parsed.bridgeVersion).toBe('0.41.0');
    expect(parsed.port).toBe(7111);
    expect(parsed.endpoint).toBe('http://127.0.0.1:7111');
    expect(parsed.userCwd).toBe('/test/project');
    expect(typeof parsed.writtenAt).toBe('number');
    expect(parsed.boundScps).toEqual({});
    expect(parsed.installedScps).toEqual([]);
  });

  test('derives boundScps from spawnsByScp Map at write time', async () => {
    const state: BridgeMetadataState = {
      bridgeVersion: '0.41.0',
      port: 7111,
      userCwd: '/test/project',
      spawnsByScp: new Map([
        ['TestSeven', { port: 8001, browserUrl: 'http://localhost:8001' }],
        ['TestEight', { port: 8002, browserUrl: 'http://localhost:8002' }],
      ]),
      installedScps: ['TestSeven', 'TestEight'],
    };
    await writeBridgeMetadata(state, bridgeMetadataPath(tempHome));
    const read = await readBridgeMetadata(bridgeMetadataPath(tempHome));
    expect(read).not.toBeNull();
    expect(read!.boundScps['TestSeven']).toEqual({
      port: 8001,
      status: 'live',
      browserUrl: 'http://localhost:8001',
    });
    expect(read!.boundScps['TestEight'].port).toBe(8002);
    expect(read!.installedScps).toEqual(['TestSeven', 'TestEight']);
  });

  test('creates ~/.scs-bridge directory if absent (mkdir recursive)', async () => {
    const state: BridgeMetadataState = {
      bridgeVersion: '0.41.0',
      port: 7111,
      userCwd: '/test/project',
      spawnsByScp: new Map(),
      installedScps: [],
    };
    expect(existsSync(path.join(tempHome, '.scs-bridge'))).toBe(false);
    await writeBridgeMetadata(state, bridgeMetadataPath(tempHome));
    expect(existsSync(path.join(tempHome, '.scs-bridge'))).toBe(true);
    expect(existsSync(bridgeMetadataPath(tempHome))).toBe(true);
  });
});

describe('readBridgeMetadata (REF-D2 · BJLM graceful absence)', () => {
  test('returns null when bridge.json absent (ENOENT)', async () => {
    const result = await readBridgeMetadata(bridgeMetadataPath(tempHome));
    expect(result).toBeNull();
  });

  test('returns null on malformed JSON (parse failure)', async () => {
    const dir = path.join(tempHome, '.scs-bridge');
    mkdirSync(dir, { recursive: true });
    writeFileSync(path.join(dir, 'bridge.json'), 'NOT VALID JSON {{{', 'utf8');
    const result = await readBridgeMetadata(bridgeMetadataPath(tempHome));
    expect(result).toBeNull();
  });
});

describe('L_smoke_3 · new-user-flow bridge.json roundtrip (R7 requirement)', () => {
  test('write then read roundtrip preserves all canonical fields', async () => {
    const state: BridgeMetadataState = {
      bridgeVersion: '0.41.0',
      port: 7111,
      userCwd: '/test/project',
      spawnsByScp: new Map([
        ['TestSeven', { port: 8001, browserUrl: 'http://localhost:8001' }],
      ]),
      installedScps: ['TestSeven'],
    };
    await writeBridgeMetadata(state, bridgeMetadataPath(tempHome));
    const read = await readBridgeMetadata(bridgeMetadataPath(tempHome));
    expect(read).not.toBeNull();
    expect(read!.schemaVersion).toBe(1);
    expect(read!.bridgeVersion).toBe('0.41.0');
    expect(read!.port).toBe(7111);
    expect(read!.endpoint).toBe('http://127.0.0.1:7111');
    expect(read!.userCwd).toBe('/test/project');
    expect(read!.installedScps).toEqual(['TestSeven']);
    expect(read!.boundScps['TestSeven'].port).toBe(8001);
    expect(read!.boundScps['TestSeven'].status).toBe('live');
    expect(read!.boundScps['TestSeven'].browserUrl).toBe('http://localhost:8001');
    expect(typeof read!.writtenAt).toBe('number');
    expect(read!.writtenAt).toBeGreaterThan(0);
  });
});
