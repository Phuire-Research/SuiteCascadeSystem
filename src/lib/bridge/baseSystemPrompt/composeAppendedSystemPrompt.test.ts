// composeAppendedSystemPrompt.test.ts — RESUME INDUCTION W2.
//
// Real files on a real temp tree (no node:fs mock): the write discipline (tmp+rename),
// the idempotence Concluder and THE OUTPUT PATH LAW are only honest against a real
// filesystem. Two collaborators ARE mocked, both for reachability rather than
// convenience: `../registry` (heavy transitive graph · we need to control the row) and
// `./baseSystemPrompt`'s renderBaseSystemPrompt + the Dock reader (both resolve the
// PACKAGE ROOT from process.argv[1], which under jest is the jest binary).

import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

let registryRows: Array<{ id: string; suite8Name?: string; scpName?: string }> = [];
jest.mock('../registry', () => ({
  listSessions: jest.fn(async () => registryRows),
}));

let dockLayer: { content: string; path: string | undefined } = {
  content: '',
  path: undefined,
};
jest.mock('./dockContent', () => ({
  readDockLayer: jest.fn(() => dockLayer),
  resolveDockContent: jest.fn(() => dockLayer.content),
}));

let baseRender: string | null = 'BASE {{x}} ENDPOINT: http://127.0.0.1:PORT/mcp';
jest.mock('./baseSystemPrompt', () => {
  const actual = jest.requireActual('./baseSystemPrompt');
  return {
    ...actual,
    renderBaseSystemPrompt: jest.fn((_endpoint: string, port: number) => {
      if (baseRender === null) throw new Error('skeleton unreadable');
      return baseRender.replace('PORT', String(port));
    }),
  };
});

import {
  COMPOSED_SIZE_WARN_BYTES,
  LAYER_JOINER,
  composeAppendedSystemPrompt,
  resolveComposedPromptPath,
  safeDesignationName,
} from './composeAppendedSystemPrompt';

const DESIGNATION = 'MeteoricShipwright';
const ULID = '01TESTULID0000000000000000';

let root: string;
let bridgeDir: string;
let cwdSpy: jest.SpyInstance;

function instanceDir(underRoot: string): string {
  return path.join(underRoot, 'Cascades', '8_SUITES', DESIGNATION);
}

function writeInstanceMd(body: string): string {
  const dir = instanceDir(root);
  mkdirSync(dir, { recursive: true });
  const p = path.join(dir, 'Instance.md');
  writeFileSync(p, body, 'utf8');
  return p;
}

beforeEach(() => {
  root = path.join(os.tmpdir(), `scs-compose-test-${process.pid}-${Math.random().toString(36).slice(2)}`);
  bridgeDir = path.join(root, 'Cascades', 'Bridge');
  mkdirSync(bridgeDir, { recursive: true });
  writeFileSync(path.join(bridgeDir, 'bridge.json'), JSON.stringify({ port: 7111 }), 'utf8');
  process.env.SCS_BRIDGE_ROOT_OVERRIDE = root;
  delete process.env.SCS_ENV;
  cwdSpy = jest.spyOn(process, 'cwd').mockReturnValue(root);
  registryRows = [];
  dockLayer = { content: '', path: undefined };
  baseRender = 'BASE ENDPOINT: http://127.0.0.1:PORT/mcp';
});

afterEach(() => {
  cwdSpy.mockRestore();
  delete process.env.SCS_BRIDGE_ROOT_OVERRIDE;
  delete process.env.SCS_ENV;
  try {
    rmSync(root, { recursive: true, force: true });
  } catch {
    /* best effort */
  }
});

describe('the General branch', () => {
  it('composes the BASE ONLY — no Dock, no Instance — when the session has no suite8Name', async () => {
    registryRows = [{ id: ULID }];
    dockLayer = { content: 'DOCK BODY', path: '/pkg/assets/dock.md' };
    writeInstanceMd('INSTANCE BODY');

    const result = await composeAppendedSystemPrompt(ULID);

    expect(result.designation).toBeNull();
    expect(result.layers.map((l) => l.name)).toEqual(['base']);
    expect(result.path).toBe(path.join(bridgeDir, 'scs-bridge-base.generated.md'));
    const written = readFileSync(result.path as string, 'utf8');
    expect(written).toContain('7111');
    expect(written).not.toContain('DOCK BODY');
    expect(written).not.toContain('INSTANCE BODY');
  });

  it('returns path: undefined when the base cannot be rendered AND none is on disk', async () => {
    registryRows = [{ id: ULID }];
    baseRender = null;
    const events: string[] = [];

    const result = await composeAppendedSystemPrompt(ULID, {
      emit: (e) => {
        events.push(e);
      },
    });

    expect(result.path).toBeUndefined();
    expect(result.layers).toEqual([]);
    expect(events).toContain('prompt.base.regen-failed');
    expect(events).toContain('prompt.base-absent');
  });
});

describe('the Suite 8 sandwich', () => {
  it('joins base → Dock → Instance in that order with the `\\n\\n---\\n\\n` joiner', async () => {
    registryRows = [{ id: ULID, suite8Name: DESIGNATION }];
    dockLayer = { content: 'DOCK {{SUITE8_DESIGNATION}} @ {{SCP_ROOT}}', path: '/pkg/dock.md' };
    const instancePath = writeInstanceMd('INSTANCE BODY LAST');

    const result = await composeAppendedSystemPrompt(ULID);

    expect(result.designation).toBe(DESIGNATION);
    expect(result.layers.map((l) => l.name)).toEqual(['base', 'dock', 'instance']);
    expect(result.instanceGround).toBe('workspace');
    const body = readFileSync(result.path as string, 'utf8');
    const parts = body.split(LAYER_JOINER);
    expect(parts).toHaveLength(3);
    expect(parts[0]).toContain('BASE');
    expect(parts[1]).toBe(`DOCK ${DESIGNATION} @ unresolved at spawn — use the fallback ladder in the newborn guard below`);
    expect(parts[2]).toBe('INSTANCE BODY LAST');
    expect(body.endsWith(readFileSync(instancePath, 'utf8'))).toBe(true);
    expect(result.bytes).toBe(Buffer.byteLength(body, 'utf8'));
  });

  it('stamps {{SCP_ROOT}} with the door-supplied scpDir and prefers the SCP-LOCAL Instance.md', async () => {
    const scpRoot = path.join(root, 'Cascades', 'scps', 'Citizen', 'SCP');
    mkdirSync(instanceDir(scpRoot), { recursive: true });
    writeFileSync(path.join(instanceDir(scpRoot), 'Instance.md'), 'SCP LOCAL IDENTITY', 'utf8');
    writeInstanceMd('WORKSPACE IDENTITY');
    dockLayer = { content: '{{SCP_ROOT}}', path: '/pkg/dock.md' };

    const result = await composeAppendedSystemPrompt(ULID, {
      suite8NameOverride: DESIGNATION,
      scpDirOverride: scpRoot,
    });

    expect(result.instanceGround).toBe('scp-local');
    const body = readFileSync(result.path as string, 'utf8');
    expect(body).toContain(scpRoot);
    expect(body).toContain('SCP LOCAL IDENTITY');
    expect(body).not.toContain('WORKSPACE IDENTITY');
  });

  it('degrades to a 2-layer compose when the Dock is absent', async () => {
    registryRows = [{ id: ULID, suite8Name: DESIGNATION }];
    dockLayer = { content: '', path: undefined };
    writeInstanceMd('INSTANCE BODY');

    const result = await composeAppendedSystemPrompt(ULID);

    expect(result.layers.map((l) => l.name)).toEqual(['base', 'instance']);
    expect(readFileSync(result.path as string, 'utf8').split(LAYER_JOINER)).toHaveLength(2);
  });

  it('degrades to base-only when the Instance.md is absent on BOTH grounds', async () => {
    registryRows = [{ id: ULID, suite8Name: DESIGNATION }];
    dockLayer = { content: 'DOCK BODY', path: '/pkg/dock.md' };
    const events: string[] = [];

    const result = await composeAppendedSystemPrompt(ULID, {
      emit: (e) => {
        events.push(e);
      },
    });

    expect(result.instanceGround).toBe('absent');
    expect(result.designation).toBe(DESIGNATION);
    expect(result.layers.map((l) => l.name)).toEqual(['base']);
    expect(result.path).toBe(path.join(bridgeDir, 'scs-bridge-base.generated.md'));
    expect(events).toContain('prompt.instance-md-missing');
    expect(existsSync(resolveComposedPromptPath(DESIGNATION))).toBe(false);
  });

  it('falls back to meta.json when the registry row lost its suite8Name (D3RM-H)', async () => {
    registryRows = [{ id: ULID }];
    const sessionDir = path.join(bridgeDir, 'sessions', ULID);
    mkdirSync(sessionDir, { recursive: true });
    writeFileSync(
      path.join(sessionDir, 'meta.json'),
      JSON.stringify({ id: ULID, suite8Name: DESIGNATION }),
      'utf8',
    );
    writeInstanceMd('INSTANCE BODY');

    const result = await composeAppendedSystemPrompt(ULID);

    expect(result.designation).toBe(DESIGNATION);
    expect(result.layers.map((l) => l.name)).toContain('instance');
  });
});

describe('the write discipline', () => {
  it('is idempotent — a second compose of identical bytes reports unchanged and leaves no tmp file', async () => {
    registryRows = [{ id: ULID, suite8Name: DESIGNATION }];
    dockLayer = { content: 'DOCK BODY', path: '/pkg/dock.md' };
    writeInstanceMd('INSTANCE BODY');

    const first = await composeAppendedSystemPrompt(ULID);
    const second = await composeAppendedSystemPrompt(ULID);

    expect(first.unchanged).toBe(false);
    expect(second.unchanged).toBe(true);
    expect(second.path).toBe(first.path);
    expect(readFileSync(second.path as string, 'utf8')).toBe(
      readFileSync(first.path as string, 'utf8'),
    );
    const strays = require('node:fs')
      .readdirSync(bridgeDir)
      .filter((f: string) => f.includes('.tmp.'));
    expect(strays).toEqual([]);
  });

  it('re-reads the Instance.md at FIRE TIME (the C1088 law) — an edit lands in the next compose', async () => {
    registryRows = [{ id: ULID, suite8Name: DESIGNATION }];
    dockLayer = { content: 'DOCK BODY', path: '/pkg/dock.md' };
    writeInstanceMd('INSTANCE BODY');
    await composeAppendedSystemPrompt(ULID);

    writeInstanceMd('INSTANCE BODY · FIRE-TIME-MARKER');
    const second = await composeAppendedSystemPrompt(ULID);

    expect(second.unchanged).toBe(false);
    expect(readFileSync(second.path as string, 'utf8')).toContain('FIRE-TIME-MARKER');
  });

  it('never throws on the session path — a broken registry read still yields the base', async () => {
    const { listSessions } = require('../registry');
    (listSessions as jest.Mock).mockRejectedValueOnce(new Error('registry unreadable'));
    writeInstanceMd('INSTANCE BODY');

    const result = await composeAppendedSystemPrompt(ULID);

    expect(result.designation).toBeNull();
    expect(result.path).toBe(path.join(bridgeDir, 'scs-bridge-base.generated.md'));
  });
});

describe('THE OUTPUT PATH LAW', () => {
  it('seats the composed file at the bridge root for the unnamed seat', async () => {
    registryRows = [{ id: ULID, suite8Name: DESIGNATION }];
    dockLayer = { content: 'DOCK BODY', path: '/pkg/dock.md' };
    writeInstanceMd('INSTANCE BODY');

    const result = await composeAppendedSystemPrompt(ULID);

    expect(path.dirname(result.path as string)).toBe(bridgeDir);
    expect(path.basename(result.path as string)).toBe(
      `scs-bridge-suite8-${DESIGNATION}.generated.md`,
    );
    expect(result.segment).toBe('');
  });

  it('MOVES the composed file into the segment dir when SCS_ENV names an environment', async () => {
    registryRows = [{ id: ULID, suite8Name: DESIGNATION }];
    dockLayer = { content: 'DOCK BODY', path: '/pkg/dock.md' };
    writeInstanceMd('INSTANCE BODY');
    writeFileSync(
      path.join(bridgeDir, 'bridge.json'),
      JSON.stringify({ port: 7111, namedBridges: { Dev: { port: 7113 } } }),
      'utf8',
    );
    process.env.SCS_ENV = 'Dev';
    const events: Array<{ e: string; p: Record<string, unknown> }> = [];

    const result = await composeAppendedSystemPrompt(ULID, {
      emit: (e, p) => {
        events.push({ e, p });
      },
    });

    expect(result.segment).toBe('Dev');
    expect(path.dirname(result.path as string)).toBe(path.join(bridgeDir, 'Dev'));
    // The segmented compose carries the NAMED bridge's endpoint, not the unnamed seat's.
    const body = readFileSync(result.path as string, 'utf8');
    expect(body).toContain('7113');
    expect(body).not.toContain('7111');
    // …and the segmented BASE is written into the segment dir too.
    expect(existsSync(path.join(bridgeDir, 'Dev', 'scs-bridge-base.generated.md'))).toBe(true);
    expect(events.some((x) => x.e === 'prompt.assembled')).toBe(true);
  });

  it('announces a legacy root twin exactly once without deleting it', async () => {
    registryRows = [{ id: ULID, suite8Name: DESIGNATION }];
    dockLayer = { content: 'DOCK BODY', path: '/pkg/dock.md' };
    writeInstanceMd('INSTANCE BODY');
    const twin = path.join(bridgeDir, `scs-bridge-suite8-${DESIGNATION}.generated.md`);
    writeFileSync(twin, 'LEGACY TWIN', 'utf8');
    process.env.SCS_ENV = 'Dev';
    const events: string[] = [];
    const emit = (e: string): void => {
      events.push(e);
    };

    await composeAppendedSystemPrompt(ULID, { emit });
    await composeAppendedSystemPrompt(ULID, { emit });

    expect(events.filter((e) => e === 'prompt.legacy-root-twin')).toHaveLength(1);
    expect(readFileSync(twin, 'utf8')).toBe('LEGACY TWIN');
  });

  it('sanitizes the designation into the filename', () => {
    expect(safeDesignationName('Pewter Tessera/2')).toBe('Pewter_Tessera_2');
  });
});

describe('the size warning (visibility only, no cap)', () => {
  it('emits prompt.size-warn past the threshold and still composes', async () => {
    registryRows = [{ id: ULID, suite8Name: DESIGNATION }];
    dockLayer = { content: 'DOCK BODY', path: '/pkg/dock.md' };
    writeInstanceMd('X'.repeat(COMPOSED_SIZE_WARN_BYTES + 1));
    const events: string[] = [];
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => undefined);

    const result = await composeAppendedSystemPrompt(ULID, {
      emit: (e) => {
        events.push(e);
      },
    });

    expect(events).toContain('prompt.size-warn');
    expect(result.bytes).toBeGreaterThan(COMPOSED_SIZE_WARN_BYTES);
    expect(existsSync(result.path as string)).toBe(true);
    warnSpy.mockRestore();
  });
});
