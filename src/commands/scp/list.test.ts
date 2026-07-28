import { mkdtempSync, rmSync, writeFileSync, mkdirSync } from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { Command } from 'commander';
import { listSubcommand } from './list';
import { SUITE_8_DIR, SCP_RESEARCHER_DIR } from '../../lib/scp/scpInstance';

describe('listSubcommand', () => {
  it('returns a Command instance', () => {
    const cmd = listSubcommand();
    expect(cmd).toBeInstanceOf(Command);
  });

  it('has name list', () => {
    expect(listSubcommand().name()).toBe('list');
  });

  it('has a description', () => {
    expect(listSubcommand().description()).toBeTruthy();
  });
});

describe('listSubcommand action — output', () => {
  let tmpDir: string;
  let prevCwd: string;
  let consoleLogSpy: jest.SpyInstance;

  beforeEach(() => {
    tmpDir = mkdtempSync(path.join(os.tmpdir(), 'scp-list-test-'));
    prevCwd = process.cwd();
    process.chdir(tmpDir);
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => undefined);
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    process.chdir(prevCwd);
    rmSync(tmpDir, { recursive: true, force: true });
  });

  it('reports zero-instance state cleanly', async () => {
    const cmd = listSubcommand();
    await cmd.parseAsync([], { from: 'user' });
    const messages = consoleLogSpy.mock.calls.map((c) => c[0]).join('\n');
    expect(messages).toMatch(/No SCP Suite 8 instances/);
  });

  it('prints instances when present', async () => {
    const inst = path.join(tmpDir, SUITE_8_DIR, 'TestPersonal');
    mkdirSync(inst, { recursive: true });
    writeFileSync(
      path.join(inst, 'Instance.md'),
      '# TestPersonal\n\n**Mode**: Personal\n**Path**: | ../../scps/template/SCP/ |\n',
    );
    const cmd = listSubcommand();
    await cmd.parseAsync([], { from: 'user' });
    const out = consoleLogSpy.mock.calls.map((c) => c[0]).join('\n');
    expect(out).toContain('TestPersonal');
    expect(out).toContain('Personal');
    expect(out).toMatch(/1 instance/);
  });

  it('excludes SCP Researcher from listing', async () => {
    const meta = path.join(tmpDir, SUITE_8_DIR, SCP_RESEARCHER_DIR);
    mkdirSync(meta, { recursive: true });
    writeFileSync(
      path.join(meta, 'Instance.md'),
      '# SCP Researcher\n\n**Mode**: Personal (test fixture)\n',
    );
    const cmd = listSubcommand();
    await cmd.parseAsync([], { from: 'user' });
    const out = consoleLogSpy.mock.calls.map((c) => c[0]).join('\n');
    expect(out).not.toContain('SCP Researcher');
    expect(out).toMatch(/No SCP Suite 8 instances/);
  });
});
