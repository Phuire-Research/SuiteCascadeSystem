import * as fsActual from 'node:fs/promises';
import { resolveScpNameFromCwd } from './scpResolver';

jest.mock('node:fs/promises', () => ({
  readFile: jest.fn(),
}));

const fs = fsActual as unknown as {
  readFile: jest.Mock;
};

let stderrSpy: jest.SpyInstance;

beforeEach(() => {
  fs.readFile.mockReset();
  stderrSpy = jest.spyOn(process.stderr, 'write').mockImplementation(() => true);
});

afterEach(() => {
  stderrSpy.mockRestore();
});

describe('SS-P1 · resolveScpNameFromCwd (SAID CWD-Match)', () => {
  it('returns undefined when SCPs.json is absent (ENOENT graceful)', async () => {
    fs.readFile.mockRejectedValue(Object.assign(new Error('ENOENT'), { code: 'ENOENT' }));

    const result = await resolveScpNameFromCwd('/some/cwd');

    expect(result).toBeUndefined();
    expect(stderrSpy).not.toHaveBeenCalled();
  });

  it('returns undefined and warns when SCPs.json is malformed JSON', async () => {
    fs.readFile.mockResolvedValue('this is not { valid JSON');

    const result = await resolveScpNameFromCwd('/some/cwd');

    expect(result).toBeUndefined();
    expect(stderrSpy).toHaveBeenCalledWith(expect.stringContaining('SCPs.json malformed'));
  });

  it('returns undefined when SCPs.json has empty scps array (current production state)', async () => {
    fs.readFile.mockResolvedValue(JSON.stringify({ scps: [] }));

    const result = await resolveScpNameFromCwd('/some/cwd');

    expect(result).toBeUndefined();
  });

  it('returns undefined when entries are missing required fields', async () => {
    fs.readFile.mockResolvedValue(
      JSON.stringify({ scps: [{ name: '' }, { path: '/only/path' }, {}] }),
    );

    const result = await resolveScpNameFromCwd('/only/path/subdir');

    expect(result).toBeUndefined();
  });

  it('returns scpName when cwd is inside an installPath', async () => {
    fs.readFile.mockResolvedValue(
      JSON.stringify({ scps: [{ name: 'MyProject', path: '/projects/myapp' }] }),
    );

    const result = await resolveScpNameFromCwd('/projects/myapp/src/components');

    expect(result).toBe('MyProject');
  });

  it('returns scpName when cwd equals installPath exactly', async () => {
    fs.readFile.mockResolvedValue(
      JSON.stringify({ scps: [{ name: 'Exact', path: '/projects/exact' }] }),
    );

    const result = await resolveScpNameFromCwd('/projects/exact');

    expect(result).toBe('Exact');
  });

  it('returns undefined when cwd is outside all installPaths', async () => {
    fs.readFile.mockResolvedValue(
      JSON.stringify({
        scps: [
          { name: 'A', path: '/projects/a' },
          { name: 'B', path: '/projects/b' },
        ],
      }),
    );

    const result = await resolveScpNameFromCwd('/unrelated/location');

    expect(result).toBeUndefined();
  });

  it('returns the most-specific match when installPaths overlap (longest-prefix-wins)', async () => {
    fs.readFile.mockResolvedValue(
      JSON.stringify({
        scps: [
          { name: 'Outer', path: '/projects' },
          { name: 'Inner', path: '/projects/app/submodule' },
          { name: 'Middle', path: '/projects/app' },
        ],
      }),
    );

    const result = await resolveScpNameFromCwd('/projects/app/submodule/src');

    expect(result).toBe('Inner');
  });

  it('returns undefined when cwd is empty string', async () => {
    fs.readFile.mockResolvedValue(
      JSON.stringify({ scps: [{ name: 'A', path: '/projects/a' }] }),
    );

    const result = await resolveScpNameFromCwd('');

    expect(result).toBeUndefined();
    expect(fs.readFile).not.toHaveBeenCalled();
  });

  it('does not false-match similar-prefix sibling directories (path-boundary check)', async () => {
    fs.readFile.mockResolvedValue(
      JSON.stringify({ scps: [{ name: 'Original', path: '/projects/myapp' }] }),
    );

    const result = await resolveScpNameFromCwd('/projects/myappv2/src');

    expect(result).toBeUndefined();
  });
});
