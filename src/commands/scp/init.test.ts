import { mkdtempSync, rmSync, writeFileSync, mkdirSync, existsSync, readFileSync } from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { Command } from 'commander';
import { initSubcommand } from './init';
import { SUITE_8_DIR, SCP_RESEARCHER_DIR } from '../../lib/scp/scpInstance';

describe('initSubcommand', () => {
  it('returns a Command instance', () => {
    const cmd = initSubcommand();
    expect(cmd).toBeInstanceOf(Command);
  });

  it('has name init', () => {
    expect(initSubcommand().name()).toBe('init');
  });

  it('has a required <designation> argument', () => {
    const args = initSubcommand().registeredArguments;
    expect(args).toHaveLength(1);
    expect(args[0].required).toBe(true);
  });

  it('has a --mode option with Personal default', () => {
    const opts = initSubcommand().options;
    const mode = opts.find((o) => o.long === '--mode');
    expect(mode).toBeDefined();
    expect(mode?.defaultValue).toBe('Personal');
  });
});

describe('initSubcommand action — materialization', () => {
  let tmpDir: string;
  let prevCwd: string;
  let consoleLogSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;
  let exitSpy: jest.SpyInstance;

  beforeEach(() => {
    tmpDir = mkdtempSync(path.join(os.tmpdir(), 'scp-init-test-'));
    prevCwd = process.cwd();
    process.chdir(tmpDir);
    // Seed SCP Researcher templates
    const templatesDir = path.join(tmpDir, SUITE_8_DIR, SCP_RESEARCHER_DIR, 'Templates');
    mkdirSync(templatesDir, { recursive: true });
    writeFileSync(
      path.join(templatesDir, 'Instance.md.template'),
      '# {{DESIGNATION}}\n\n**Mode**: {{MODE}}\n**Path**: | {{RUNTIME_PATH}} |\nRole: {{ROLE}}\nDate: {{ORIGIN_DATE}}\n',
    );
    writeFileSync(
      path.join(templatesDir, 'Skill.md.template'),
      '# {{DESIGNATION}} — Skills\n\nMode: {{MODE}}\n',
    );
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => undefined);
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    exitSpy = jest.spyOn(process, 'exit').mockImplementation(((code?: number) => {
      throw new Error(`process.exit(${code ?? 0})`);
    }) as never);
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    exitSpy.mockRestore();
    process.chdir(prevCwd);
    rmSync(tmpDir, { recursive: true, force: true });
  });

  it('creates an instance with Personal mode default', async () => {
    const cmd = initSubcommand();
    await cmd.parseAsync(['MyPersonal'], { from: 'user' });
    const inst = path.join(tmpDir, SUITE_8_DIR, 'MyPersonal');
    expect(existsSync(path.join(inst, 'Instance.md'))).toBe(true);
    expect(existsSync(path.join(inst, 'Skill.md'))).toBe(true);
    const content = readFileSync(path.join(inst, 'Instance.md'), 'utf8');
    expect(content).toContain('**Mode**: Personal');
  });

  it('honors --mode Organizational override', async () => {
    const cmd = initSubcommand();
    await cmd.parseAsync(['AcmeOrg', '--mode', 'Organizational'], { from: 'user' });
    const inst = path.join(tmpDir, SUITE_8_DIR, 'AcmeOrg');
    const content = readFileSync(path.join(inst, 'Instance.md'), 'utf8');
    expect(content).toContain('**Mode**: Organizational');
  });

  it('rejects invalid mode with exit 1', async () => {
    const cmd = initSubcommand();
    await expect(cmd.parseAsync(['Foo', '--mode', 'Bogus'], { from: 'user' })).rejects.toThrow(
      /process\.exit\(1\)/,
    );
    expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Invalid mode'));
  });

  it('rejects existing designation with exit 1', async () => {
    const cmd1 = initSubcommand();
    await cmd1.parseAsync(['Existing'], { from: 'user' });
    const cmd2 = initSubcommand();
    await expect(cmd2.parseAsync(['Existing'], { from: 'user' })).rejects.toThrow(
      /process\.exit\(1\)/,
    );
    expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Failed to create'));
  });

  it('fails when SCP Researcher templates missing', async () => {
    rmSync(path.join(tmpDir, SUITE_8_DIR, SCP_RESEARCHER_DIR), { recursive: true, force: true });
    const cmd = initSubcommand();
    await expect(cmd.parseAsync(['AnyName'], { from: 'user' })).rejects.toThrow(
      /process\.exit\(1\)/,
    );
    expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('templates not found'));
  });
});
