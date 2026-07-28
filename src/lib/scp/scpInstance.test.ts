import { mkdtempSync, rmSync, writeFileSync, mkdirSync, existsSync, readFileSync } from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import {
  validateDesignation,
  validateMode,
  substituteSlots,
  listScpInstances,
  createScpInstance,
  readScpInstance,
  MODE_DEFAULTS,
  SUITE_8_DIR,
  SCP_RESEARCHER_DIR,
  type SlotValues,
} from './scpInstance';

describe('validateDesignation', () => {
  it('accepts simple alphanumeric', () => {
    expect(validateDesignation('MicahsPersonal').valid).toBe(true);
  });

  it('accepts hyphens and spaces', () => {
    expect(validateDesignation('Acme Corp Tooling').valid).toBe(true);
    expect(validateDesignation('Build-Kit-Alpha').valid).toBe(true);
  });

  it('rejects empty', () => {
    expect(validateDesignation('').valid).toBe(false);
  });

  it('rejects overlong (>64)', () => {
    expect(validateDesignation('a'.repeat(65)).valid).toBe(false);
  });

  it('rejects leading/trailing separators', () => {
    expect(validateDesignation('-Foo').valid).toBe(false);
    expect(validateDesignation('Foo-').valid).toBe(false);
    expect(validateDesignation(' Foo').valid).toBe(false);
    expect(validateDesignation('Foo ').valid).toBe(false);
  });

  it('rejects forbidden characters', () => {
    expect(validateDesignation('Foo/Bar').valid).toBe(false);
    expect(validateDesignation('Foo:Bar').valid).toBe(false);
    expect(validateDesignation('Foo$Bar').valid).toBe(false);
  });

  it('rejects reserved SCP Researcher designation', () => {
    expect(validateDesignation(SCP_RESEARCHER_DIR).valid).toBe(false);
  });
});

describe('validateMode', () => {
  it('accepts the three valid modes', () => {
    expect(validateMode('Personal')).toBe(true);
    expect(validateMode('Organizational')).toBe(true);
    expect(validateMode('Project')).toBe(true);
  });

  it('rejects anything else', () => {
    expect(validateMode('personal')).toBe(false);
    expect(validateMode('Other')).toBe(false);
    expect(validateMode('')).toBe(false);
  });
});

describe('substituteSlots', () => {
  const slots: SlotValues = {
    designation: 'TestInst',
    mode: 'Personal',
    role: 'Test role',
    originDiamond: 'SCP-Test',
    originDate: '2026-05-10',
    modeDescription: 'Test description',
    membershipLine: 'Test membership',
    identityLayer: 'Test identity',
    transportMode: 'WebSocket',
    transportBinding: 'localhost:7111',
    persistenceBoundary: 'User-private',
    runtimeComposition: 'reference',
    runtimePath: '../../scps/template/SCP/',
    designationRationale: 'Test rationale',
  };

  it('substitutes single slot', () => {
    expect(substituteSlots('Hello {{DESIGNATION}}', slots)).toBe('Hello TestInst');
  });

  it('substitutes multiple slots', () => {
    const tpl = '{{DESIGNATION}} runs in {{MODE}} mode at {{TRANSPORT_BINDING}}';
    expect(substituteSlots(tpl, slots)).toBe('TestInst runs in Personal mode at localhost:7111');
  });

  it('substitutes the same slot multiple times', () => {
    expect(substituteSlots('{{MODE}} and {{MODE}}', slots)).toBe('Personal and Personal');
  });

  it('leaves untouched text intact', () => {
    expect(substituteSlots('plain text', slots)).toBe('plain text');
  });

  it('does not touch unknown slots', () => {
    expect(substituteSlots('{{UNKNOWN_SLOT}}', slots)).toBe('{{UNKNOWN_SLOT}}');
  });
});

describe('MODE_DEFAULTS', () => {
  it('provides defaults for all three modes', () => {
    expect(MODE_DEFAULTS.Personal).toBeDefined();
    expect(MODE_DEFAULTS.Organizational).toBeDefined();
    expect(MODE_DEFAULTS.Project).toBeDefined();
  });

  it('Personal defaults use localhost', () => {
    expect(MODE_DEFAULTS.Personal.transportBinding).toContain('localhost');
  });

  it('Project defaults use stdio', () => {
    expect(MODE_DEFAULTS.Project.transportMode.toLowerCase()).toContain('stdio');
  });
});

describe('listScpInstances + readScpInstance + createScpInstance', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = mkdtempSync(path.join(os.tmpdir(), 'scp-test-'));
    // Seed SCP Researcher templates
    const templatesDir = path.join(tmpDir, SUITE_8_DIR, SCP_RESEARCHER_DIR, 'Templates');
    mkdirSync(templatesDir, { recursive: true });
    writeFileSync(
      path.join(templatesDir, 'Instance.md.template'),
      '# {{DESIGNATION}}\n\n**Mode**: {{MODE}}\n**Path**: | {{RUNTIME_PATH}} |\nRole: {{ROLE}}\n',
    );
    writeFileSync(
      path.join(templatesDir, 'Skill.md.template'),
      '# {{DESIGNATION}} — Skills\n\nMode: {{MODE}}\n',
    );
  });

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  it('returns empty list when no instances exist', () => {
    expect(listScpInstances(tmpDir)).toEqual([]);
  });

  it('readScpInstance returns null for SCP Researcher meta-spec', () => {
    expect(readScpInstance(tmpDir, SCP_RESEARCHER_DIR)).toBeNull();
  });

  it('readScpInstance returns null for non-SCP Suite 8 (no Mode field)', () => {
    const other = path.join(tmpDir, SUITE_8_DIR, 'OtherSuite');
    mkdirSync(other, { recursive: true });
    writeFileSync(path.join(other, 'Instance.md'), '# OtherSuite\n\nNo mode here.\n');
    expect(readScpInstance(tmpDir, 'OtherSuite')).toBeNull();
  });

  it('createScpInstance materializes a Personal instance', () => {
    const result = createScpInstance({
      cwd: tmpDir,
      designation: 'MicahsPersonal',
      mode: 'Personal',
      originDiamond: 'SCP-Test',
      originDate: '2026-05-10',
    });
    expect(result.ok).toBe(true);
    expect(result.errors).toEqual([]);
    expect(result.filesWritten).toHaveLength(2);
    expect(existsSync(path.join(tmpDir, SUITE_8_DIR, 'MicahsPersonal', 'Instance.md'))).toBe(true);
    expect(existsSync(path.join(tmpDir, SUITE_8_DIR, 'MicahsPersonal', 'Skill.md'))).toBe(true);
  });

  it('createScpInstance fills slots correctly', () => {
    createScpInstance({
      cwd: tmpDir,
      designation: 'MicahsPersonal',
      mode: 'Personal',
      originDiamond: 'SCP-Test',
      originDate: '2026-05-10',
    });
    const instanceMd = readFileSync(
      path.join(tmpDir, SUITE_8_DIR, 'MicahsPersonal', 'Instance.md'),
      'utf8',
    );
    expect(instanceMd).toContain('# MicahsPersonal');
    expect(instanceMd).toContain('**Mode**: Personal');
    expect(instanceMd).toContain('../../scps/template/SCP/');
  });

  it('createScpInstance refuses an existing designation', () => {
    createScpInstance({
      cwd: tmpDir,
      designation: 'MicahsPersonal',
      mode: 'Personal',
      originDiamond: 'SCP-Test',
      originDate: '2026-05-10',
    });
    const second = createScpInstance({
      cwd: tmpDir,
      designation: 'MicahsPersonal',
      mode: 'Personal',
      originDiamond: 'SCP-Test',
      originDate: '2026-05-10',
    });
    expect(second.ok).toBe(false);
    expect(second.errors[0]).toContain('already exists');
  });

  it('createScpInstance refuses invalid designation', () => {
    const result = createScpInstance({
      cwd: tmpDir,
      designation: '/etc/passwd',
      mode: 'Personal',
      originDiamond: 'SCP-Test',
      originDate: '2026-05-10',
    });
    expect(result.ok).toBe(false);
  });

  it('createScpInstance refuses reserved SCP Researcher designation', () => {
    const result = createScpInstance({
      cwd: tmpDir,
      designation: SCP_RESEARCHER_DIR,
      mode: 'Personal',
      originDiamond: 'SCP-Test',
      originDate: '2026-05-10',
    });
    expect(result.ok).toBe(false);
  });

  it('listScpInstances includes created instances and excludes SCP Researcher', () => {
    createScpInstance({
      cwd: tmpDir,
      designation: 'MicahsPersonal',
      mode: 'Personal',
      originDiamond: 'SCP-Test',
      originDate: '2026-05-10',
    });
    createScpInstance({
      cwd: tmpDir,
      designation: 'AcmeOrg',
      mode: 'Organizational',
      originDiamond: 'SCP-Test',
      originDate: '2026-05-10',
    });
    const instances = listScpInstances(tmpDir);
    expect(instances).toHaveLength(2);
    const designations = instances.map((i) => i.designation).sort();
    expect(designations).toEqual(['AcmeOrg', 'MicahsPersonal']);
    expect(instances.find((i) => i.designation === SCP_RESEARCHER_DIR)).toBeUndefined();
  });

  it('createScpInstance fails gracefully when SCP Researcher templates are missing', () => {
    const bareDir = mkdtempSync(path.join(os.tmpdir(), 'scp-bare-'));
    try {
      const result = createScpInstance({
        cwd: bareDir,
        designation: 'AnyInstance',
        mode: 'Personal',
        originDiamond: 'SCP-Test',
        originDate: '2026-05-10',
      });
      expect(result.ok).toBe(false);
      expect(result.errors[0]).toContain('templates not found');
    } finally {
      rmSync(bareDir, { recursive: true, force: true });
    }
  });
});
