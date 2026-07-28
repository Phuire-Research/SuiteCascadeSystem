/**
 * scpPersistence.ts tests — RM-D4
 *
 * Tmpdir-isolated read/write roundtrip + AJMI derivation correctness.
 */
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import {
  readScpRegistry,
  writeScpRegistry,
  parseScpRegistry,
  appendScpEntry,
  updateScpStatus,
  removeScpEntry,
  buildScpRegistryEntry,
  resolveScpsJsonPath,
  deriveUserFacingStatus,
  deriveMainMenuMirrorEntry,
  type ScpRegistry,
  type ScpRegistryEntry,
} from './scpPersistence';

describe('scpPersistence', () => {
  let tmp: string;

  beforeEach(() => {
    tmp = mkdtempSync(path.join(tmpdir(), 'scp-persist-test-'));
  });

  afterEach(() => {
    rmSync(tmp, { recursive: true, force: true });
  });

  describe('resolveScpsJsonPath', () => {
    it('resolves to cwd/Cascades/SCPs.json', () => {
      expect(resolveScpsJsonPath('/abs/project')).toBe('/abs/project/Cascades/SCPs.json');
    });
  });

  describe('parseScpRegistry', () => {
    it('returns empty on missing scps array', () => {
      expect(parseScpRegistry('{}')).toEqual({ scps: [] });
    });
    it('returns empty on invalid JSON', () => {
      expect(parseScpRegistry('not-json')).toEqual({ scps: [] });
    });
    it('returns parsed registry on valid input', () => {
      const r = parseScpRegistry('{"scps":[]}');
      expect(r.scps).toEqual([]);
    });
  });

  describe('readScpRegistry', () => {
    it('returns empty when SCPs.json missing', () => {
      expect(readScpRegistry(tmp)).toEqual({ scps: [] });
    });
    it('reads existing SCPs.json', () => {
      mkdirSync(path.join(tmp, 'Cascades'), { recursive: true });
      writeFileSync(path.join(tmp, 'Cascades/SCPs.json'), '{"scps":[]}');
      expect(readScpRegistry(tmp)).toEqual({ scps: [] });
    });
    it('returns empty on parse error (defensive)', () => {
      mkdirSync(path.join(tmp, 'Cascades'), { recursive: true });
      writeFileSync(path.join(tmp, 'Cascades/SCPs.json'), 'corrupt');
      expect(readScpRegistry(tmp)).toEqual({ scps: [] });
    });
  });

  describe('writeScpRegistry', () => {
    it('writes atomically with parent dir creation', () => {
      const reg: ScpRegistry = { scps: [] };
      writeScpRegistry(reg, tmp);
      expect(existsSync(path.join(tmp, 'Cascades/SCPs.json'))).toBe(true);
      const back = readScpRegistry(tmp);
      expect(back).toEqual(reg);
    });

    it('roundtrip preserves entry data', () => {
      const entry = buildScpRegistryEntry({
        name: 'TestSCP',
        conceptName: 'testSCP',
        installPath: 'Cascades/scps/TestSCP/SCP',
        templateVersion: '0.1.0',
      });
      const reg: ScpRegistry = { scps: [entry] };
      writeScpRegistry(reg, tmp);
      const back = readScpRegistry(tmp);
      expect(back.scps).toHaveLength(1);
      expect(back.scps[0].name).toBe('TestSCP');
      expect(back.scps[0].status).toBe('installed');
    });
  });

  describe('appendScpEntry', () => {
    const make = (name: string): ScpRegistryEntry =>
      buildScpRegistryEntry({
        name,
        conceptName: name.charAt(0).toLowerCase() + name.slice(1),
        installPath: `Cascades/scps/${name}/SCP`,
        templateVersion: '0.1.0',
      });

    it('appends a new entry', () => {
      const r0: ScpRegistry = { scps: [make('A')] };
      const r1 = appendScpEntry(r0, make('B'));
      expect(r1.scps.map((s) => s.name)).toEqual(['A', 'B']);
    });
    it('upserts on name collision (preserves index)', () => {
      const r0: ScpRegistry = { scps: [make('A'), make('B'), make('C')] };
      const updated = { ...make('B'), conceptName: 'updated' };
      const r1 = appendScpEntry(r0, updated);
      expect(r1.scps[1].conceptName).toBe('updated');
    });
    it('does not mutate input', () => {
      const r0: ScpRegistry = { scps: [] };
      appendScpEntry(r0, make('A'));
      expect(r0.scps).toEqual([]);
    });
  });

  describe('updateScpStatus', () => {
    const seed = (): ScpRegistry => ({
      scps: [
        buildScpRegistryEntry({
          name: 'A',
          conceptName: 'a',
          installPath: 'p',
          templateVersion: '0.1.0',
        }),
      ],
    });

    it('updates status', () => {
      const r1 = updateScpStatus(seed(), 'A', 'launched', 12345, 7711);
      expect(r1.scps[0].status).toBe('launched');
      expect(r1.scps[0].managingInstancePid).toBe(12345);
      expect(r1.scps[0].boundBridgePort).toBe(7711);
    });
    it('no-op when name missing', () => {
      const r0 = seed();
      const r1 = updateScpStatus(r0, 'NotThere', 'launched');
      expect(r1).toBe(r0);
    });
    it('preserves pid/port when not supplied', () => {
      const r1 = updateScpStatus(seed(), 'A', 'launched', 12345, 7711);
      const r2 = updateScpStatus(r1, 'A', 'primed');
      expect(r2.scps[0].managingInstancePid).toBe(12345);
      expect(r2.scps[0].boundBridgePort).toBe(7711);
    });
  });

  describe('removeScpEntry', () => {
    it('removes by name', () => {
      const r0: ScpRegistry = {
        scps: [
          buildScpRegistryEntry({ name: 'A', conceptName: 'a', installPath: 'p', templateVersion: '0.1.0' }),
          buildScpRegistryEntry({ name: 'B', conceptName: 'b', installPath: 'p', templateVersion: '0.1.0' }),
        ],
      };
      const r1 = removeScpEntry(r0, 'A');
      expect(r1.scps.map((s) => s.name)).toEqual(['B']);
    });
    it('no-op when name missing', () => {
      const r0: ScpRegistry = { scps: [] };
      expect(removeScpEntry(r0, 'X')).toBe(r0);
    });
  });

  describe('deriveUserFacingStatus', () => {
    it('undefined or template → Not Installed', () => {
      expect(deriveUserFacingStatus(undefined)).toBe('Not Installed');
      expect(deriveUserFacingStatus('template')).toBe('Not Installed');
    });
    it('launched → Installed', () => {
      expect(deriveUserFacingStatus('launched')).toBe('Installed');
    });
    it('installed/primed/launching → Installing', () => {
      expect(deriveUserFacingStatus('installed')).toBe('Installing');
      expect(deriveUserFacingStatus('primed')).toBe('Installing');
      expect(deriveUserFacingStatus('launching')).toBe('Installing');
    });
  });

  describe('deriveMainMenuMirrorEntry', () => {
    const make = (name: string, status: ScpRegistry['scps'][number]['status']): ScpRegistryEntry => ({
      ...buildScpRegistryEntry({ name, conceptName: name.toLowerCase(), installPath: 'p', templateVersion: '0.1.0' }),
      status,
    });

    it('empty registry → Install Personalized SCP', () => {
      const entry = deriveMainMenuMirrorEntry({ scps: [] });
      expect(entry.kind).toBe('install');
    });
    it('has launched SCP → Show SCP-{name}', () => {
      const entry = deriveMainMenuMirrorEntry({ scps: [make('A', 'launched')] });
      if (entry.kind !== 'show') throw new Error('expected show');
      expect(entry.scpName).toBe('A');
      expect(entry.label).toBe('Show SCP-A');
    });
    it('prefers launched over installing when multiple', () => {
      const entry = deriveMainMenuMirrorEntry({
        scps: [make('Installing', 'installed'), make('Live', 'launched')],
      });
      if (entry.kind !== 'show') throw new Error('expected show');
      expect(entry.scpName).toBe('Live');
    });
    it('falls back to first registered if none launched', () => {
      const entry = deriveMainMenuMirrorEntry({ scps: [make('A', 'installed')] });
      if (entry.kind !== 'show') throw new Error('expected show');
      expect(entry.scpName).toBe('A');
    });
  });

  describe('buildScpRegistryEntry factory', () => {
    it('defaults status to installed', () => {
      const e = buildScpRegistryEntry({ name: 'A', conceptName: 'a', installPath: 'p', templateVersion: '0.1.0' });
      expect(e.status).toBe('installed');
    });
    it('initializes null pid/port + empty sessions', () => {
      const e = buildScpRegistryEntry({ name: 'A', conceptName: 'a', installPath: 'p', templateVersion: '0.1.0' });
      expect(e.managingInstancePid).toBeNull();
      expect(e.boundBridgePort).toBeNull();
      expect(e.sessions).toEqual([]);
    });
  });
});
