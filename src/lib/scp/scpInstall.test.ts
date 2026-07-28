/**
 * scpInstall.ts tests — RM-D3
 *
 * Tmpdir-isolated tests of the 7-step pipeline. Constructs a minimal fake
 * template tree, runs the pipeline, asserts on filesystem reality + SCPs.json
 * mutation + descriptor shape.
 */
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync, rmSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import {
  runInstallScpPipeline,
  generateBareMinimumConcept,
  buildRenameRules,
  applyRenameRules,
  shouldSkip,
  isRenameEligible,
  buildSpawnDescriptor,
  pickPortFromRegistry,
  cloneWithRename,
  writeApprovalSettings,
  REQUIRED_ALLOW_PATTERNS,
  SCP_PORT_RANGE_START,
  SCP_PORT_RANGE_END,
} from './scpInstall';
import { readScpRegistry } from './scpPersistence';

describe('scpInstall', () => {
  let tmp: string;

  beforeEach(() => {
    tmp = mkdtempSync(path.join(tmpdir(), 'scp-install-test-'));
    // Construct fake template at {tmp}/Cascades/scps/template/SCP/
    const tmpl = path.join(tmp, 'Cascades/scps/template/SCP');
    mkdirSync(path.join(tmpl, 'src'), { recursive: true });
    mkdirSync(path.join(tmpl, 'public'), { recursive: true });
    writeFileSync(
      path.join(tmpl, 'package.json'),
      JSON.stringify({ name: 'huirth-scp-template', version: '0.1.0', scripts: { bridge: 'echo bridge' } }, null, 2),
    );
    writeFileSync(path.join(tmpl, 'src/main.ts'), '// huirth-scp-template entry');
    // RM-Asp-1 staging validation requires src/index.ts present
    writeFileSync(path.join(tmpl, 'src/index.ts'), '// huirth-scp-template server entry');
    writeFileSync(path.join(tmpl, 'public/favicon.ico'), Buffer.from([0x00, 0x01, 0x02]));
  });

  afterEach(() => {
    rmSync(tmp, { recursive: true, force: true });
  });

  describe('inline-ported pure functions (smoke)', () => {
    // RM-Asp-3: bundle extended 3 → 4 files (adds Vue Landing surface)
    it('generateBareMinimumConcept produces 4-file bundle (type · state · concept · Vue)', () => {
      const b = generateBareMinimumConcept({ designation: 'Foo', conceptName: 'foo' });
      expect(b.fileCount).toBe(4);
      expect(b.files[0].content).toContain('export const fooName');
      expect(b.files[3].relativePath).toContain('FooLanding.vue');
      expect(b.files[3].content).toContain('<template>');
    });
    it('buildRenameRules produces 2 rules', () => {
      expect(buildRenameRules({ designation: 'X', conceptName: 'x' }).length).toBe(2);
    });
    it('applyRenameRules substitutes', () => {
      const r = buildRenameRules({ designation: 'Foo', conceptName: 'foo' });
      expect(applyRenameRules('"huirth-scp-template"', r)).toContain('foo-scp');
    });
    it('shouldSkip / isRenameEligible', () => {
      expect(shouldSkip('node_modules')).toBe(true);
      expect(isRenameEligible('x.ts')).toBe(true);
      expect(isRenameEligible('x.png')).toBe(false);
    });
    it('buildSpawnDescriptor SABO invariants', () => {
      const d = buildSpawnDescriptor({
        installPath: '/abs',
        derivation: { designation: 'X', conceptName: 'x' },
        port: 7711,
      });
      expect(d.detached).toBe(true);
      expect(d.shouldUnref).toBe(true);
      expect(d.browserUrl).toBe('http://localhost:7711');
    });
  });

  describe('pickPortFromRegistry', () => {
    it('returns start when registry empty', () => {
      expect(pickPortFromRegistry({ scps: [] })).toBe(SCP_PORT_RANGE_START);
    });
    it('skips used ports', () => {
      const reg = {
        scps: [
          {
            name: 'A',
            conceptName: 'a',
            path: 'p',
            templateVersion: '0',
            installedAt: '',
            status: 'launched' as const,
            managingInstancePid: null,
            boundBridgePort: SCP_PORT_RANGE_START,
            sessions: [],
          },
        ],
      };
      expect(pickPortFromRegistry(reg)).toBe(SCP_PORT_RANGE_START + 1);
    });
    it('respects range bounds', () => {
      const port = pickPortFromRegistry({ scps: [] });
      expect(port).toBeGreaterThanOrEqual(SCP_PORT_RANGE_START);
      expect(port).toBeLessThanOrEqual(SCP_PORT_RANGE_END);
    });
  });

  describe('cloneWithRename', () => {
    it('binary file byte-preserved', () => {
      const src = path.join(tmp, 'src-dir');
      mkdirSync(src, { recursive: true });
      const bytes = Buffer.from([0x89, 0x50, 0x4e, 0x47]);
      writeFileSync(path.join(src, 'x.png'), bytes);
      const dest = path.join(tmp, 'dest-dir');
      cloneWithRename(src, dest, []);
      expect(readFileSync(path.join(dest, 'x.png')).equals(bytes)).toBe(true);
    });
  });

  describe('runInstallScpPipeline · happy path (no npm · no descriptor build)', () => {
    it('end-to-end clone + write + SCPs.json update', () => {
      const result = runInstallScpPipeline({
        projectRoot: tmp,
        designation: 'MyTest',
        runNpmInstall: false,
        buildDescriptor: false,
      });
      expect(result.ok).toBe(true);
      expect(result.designation).toBe('MyTest');
      expect(result.conceptName).toBe('myTest');
      expect(result.npmInstallRan).toBe(false);
      expect(result.scpsJsonUpdated).toBe(true);

      // Filesystem reality
      const installPath = path.join(tmp, 'Cascades/scps/MyTest/SCP');
      expect(existsSync(installPath)).toBe(true);
      expect(existsSync(path.join(installPath, 'package.json'))).toBe(true);

      // Stage A/B split (FT-009): the user concept is NOT generated at SCP install —
      // Stage B (scs suite8:page) is the sole creator. Assert ABSENCE.
      expect(existsSync(path.join(installPath, 'src/concepts/myTest'))).toBe(false);

      // Rename applied
      const pkg = readFileSync(path.join(installPath, 'package.json'), 'utf8');
      expect(pkg).toContain('mytest-scp');

      // SCPs.json populated
      const registry = readScpRegistry(tmp);
      expect(registry.scps.length).toBe(1);
      expect(registry.scps[0].name).toBe('MyTest');
      expect(registry.scps[0].boundBridgePort).toBe(SCP_PORT_RANGE_START);
    });

    it('builds descriptor when requested', () => {
      const result = runInstallScpPipeline({
        projectRoot: tmp,
        designation: 'MyTest',
        runNpmInstall: false,
        buildDescriptor: true,
      });
      expect(result.descriptor).toBeDefined();
      expect(result.descriptor?.scpName).toBe('MyTest');
      expect(result.descriptor?.detached).toBe(true);
    });
  });

  describe('runInstallScpPipeline · fail-fast', () => {
    it('rejects invalid designation', () => {
      const result = runInstallScpPipeline({
        projectRoot: tmp,
        designation: 'lowercase-start',
        runNpmInstall: false,
        buildDescriptor: false,
      });
      expect(result.ok).toBe(false);
      expect(result.reason).toContain('uppercase');
    });

    it('rejects when template missing', () => {
      // Diamond γ: pass explicit templateRoot so resolveBundledTemplatePath fallback
      // doesn't find the real repo template when test fixture removed
      const result = runInstallScpPipeline({
        projectRoot: tmp,
        designation: 'MyTest',
        templateRoot: path.join(tmp, 'no-such-template'),
        runNpmInstall: false,
        buildDescriptor: false,
      });
      expect(result.ok).toBe(false);
      expect(result.reason).toContain('Template not found');
    });

    it('rejects when install path already exists', () => {
      // First install
      runInstallScpPipeline({
        projectRoot: tmp,
        designation: 'MyTest',
        runNpmInstall: false,
        buildDescriptor: false,
      });
      // Second install with same name
      const result = runInstallScpPipeline({
        projectRoot: tmp,
        designation: 'MyTest',
        runNpmInstall: false,
        buildDescriptor: false,
      });
      expect(result.ok).toBe(false);
      expect(result.reason).toContain('already exists');
    });
  });

  describe('runInstallScpPipeline · port allocation across multiple installs', () => {
    it('second install gets next port in range', () => {
      const r1 = runInstallScpPipeline({
        projectRoot: tmp,
        designation: 'First',
        runNpmInstall: false,
        buildDescriptor: false,
      });
      const r2 = runInstallScpPipeline({
        projectRoot: tmp,
        designation: 'Second',
        runNpmInstall: false,
        buildDescriptor: false,
      });
      expect(r1.port).toBe(SCP_PORT_RANGE_START);
      expect(r2.port).toBe(SCP_PORT_RANGE_START + 1);
    });
  });

  // ============================================
  // REF-D1 · ISAPSP · writeApprovalSettings unit tests
  // Citation: SUITE-3-YELLOW-REF-D1-ARCHITECTURE.md D1
  // ============================================
  describe('writeApprovalSettings (REF-D1 ISAPSP)', () => {
    it('absent settings.json creates with both required patterns', () => {
      const settingsPath = path.join(tmp, '.claude', 'settings.json');
      expect(existsSync(settingsPath)).toBe(false);

      writeApprovalSettings(tmp);

      expect(existsSync(settingsPath)).toBe(true);
      const written = JSON.parse(readFileSync(settingsPath, 'utf8'));
      expect(written.permissions.allow).toEqual(expect.arrayContaining([...REQUIRED_ALLOW_PATTERNS]));
      expect(written.permissions.allow.length).toBe(REQUIRED_ALLOW_PATTERNS.length);
    });

    it('already-complete settings.json is no-op (content unchanged)', () => {
      const settingsDir = path.join(tmp, '.claude');
      const settingsPath = path.join(settingsDir, 'settings.json');
      mkdirSync(settingsDir, { recursive: true });
      const original = {
        permissions: { allow: [...REQUIRED_ALLOW_PATTERNS] },
      };
      writeFileSync(settingsPath, JSON.stringify(original, null, 2) + '\n', 'utf8');
      const beforeContent = readFileSync(settingsPath, 'utf8');

      writeApprovalSettings(tmp);

      const afterContent = readFileSync(settingsPath, 'utf8');
      expect(afterContent).toBe(beforeContent);
    });

    it('partial settings.json merges additively · preserves unrelated patterns', () => {
      const settingsDir = path.join(tmp, '.claude');
      const settingsPath = path.join(settingsDir, 'settings.json');
      mkdirSync(settingsDir, { recursive: true });
      const partial = {
        permissions: {
          allow: ['Bash(scs scp install *)', 'Bash(git status)'],
        },
      };
      writeFileSync(settingsPath, JSON.stringify(partial, null, 2) + '\n', 'utf8');

      writeApprovalSettings(tmp);

      const written = JSON.parse(readFileSync(settingsPath, 'utf8'));
      expect(written.permissions.allow).toContain('Bash(scs scp install *)');
      expect(written.permissions.allow).toContain('Bash(npm install)');
      expect(written.permissions.allow).toContain('Bash(git status)');
      expect(written.permissions.allow.length).toBe(3);
    });

    it('malformed JSON in settings.json is graceful (no throw · content untouched)', () => {
      const settingsDir = path.join(tmp, '.claude');
      const settingsPath = path.join(settingsDir, 'settings.json');
      mkdirSync(settingsDir, { recursive: true });
      const malformed = 'not json at all { [ }';
      writeFileSync(settingsPath, malformed, 'utf8');

      expect(() => writeApprovalSettings(tmp)).not.toThrow();

      const after = readFileSync(settingsPath, 'utf8');
      expect(after).toBe(malformed);
    });

    it('write failure (settings dir is a regular file) is graceful · install pipeline continues', () => {
      // Replace .claude/ with a regular FILE so mkdir + write inside fails.
      const settingsDir = path.join(tmp, '.claude');
      writeFileSync(settingsDir, 'collision · this is a file not a dir', 'utf8');

      expect(() => writeApprovalSettings(tmp)).not.toThrow();

      // The file replacement is still there (we did not corrupt it · we caught the failure).
      expect(existsSync(settingsDir)).toBe(true);
      expect(statSync(settingsDir).isFile()).toBe(true);
    });
  });

  // ============================================
  // REF-D1 · ISAPSP · Install pipeline integration
  // Citation: SUITE-3-YELLOW-REF-D1-ARCHITECTURE.md D2
  // ============================================
  describe('runInstallScpPipeline · approval settings integration (REF-D1)', () => {
    it('pipeline writes .claude/settings.json before npm install fires', () => {
      const settingsPath = path.join(tmp, '.claude', 'settings.json');
      expect(existsSync(settingsPath)).toBe(false);

      const result = runInstallScpPipeline({
        projectRoot: tmp,
        designation: 'ApprovalProbe',
        templateRoot: path.join(tmp, 'Cascades/scps/template/SCP'),
        runNpmInstall: false,
        buildDescriptor: false,
      });

      expect(result.ok).toBe(true);
      expect(existsSync(settingsPath)).toBe(true);
      const written = JSON.parse(readFileSync(settingsPath, 'utf8'));
      expect(written.permissions.allow).toEqual(expect.arrayContaining([...REQUIRED_ALLOW_PATTERNS]));
    });

    it('writeApprovalSettings is idempotent across re-installs (no duplicates)', () => {
      const settingsPath = path.join(tmp, '.claude', 'settings.json');

      const r1 = runInstallScpPipeline({
        projectRoot: tmp,
        designation: 'FirstSpawn',
        templateRoot: path.join(tmp, 'Cascades/scps/template/SCP'),
        runNpmInstall: false,
        buildDescriptor: false,
      });
      const r2 = runInstallScpPipeline({
        projectRoot: tmp,
        designation: 'SecondSpawn',
        templateRoot: path.join(tmp, 'Cascades/scps/template/SCP'),
        runNpmInstall: false,
        buildDescriptor: false,
      });

      expect(r1.ok).toBe(true);
      expect(r2.ok).toBe(true);
      const written = JSON.parse(readFileSync(settingsPath, 'utf8'));
      // Each required pattern present exactly once.
      for (const pattern of REQUIRED_ALLOW_PATTERNS) {
        const occurrences = written.permissions.allow.filter((p: string) => p === pattern).length;
        expect(occurrences).toBe(1);
      }
    });
  });
});
