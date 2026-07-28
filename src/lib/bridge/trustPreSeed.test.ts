import { preSeedTrust } from './trustPreSeed';
import * as fsActual from 'node:fs';
import * as osActual from 'node:os';

jest.mock('node:fs', () => ({
  existsSync: jest.fn(),
  readFileSync: jest.fn(),
  writeFileSync: jest.fn(),
  renameSync: jest.fn(),
}));

jest.mock('node:os', () => ({
  homedir: jest.fn(() => '/mock/home'),
}));

const fs = fsActual as unknown as {
  existsSync: jest.Mock;
  readFileSync: jest.Mock;
  writeFileSync: jest.Mock;
  renameSync: jest.Mock;
};

const os = osActual as unknown as {
  homedir: jest.Mock;
};

beforeEach(() => {
  fs.existsSync.mockReset();
  fs.readFileSync.mockReset();
  fs.writeFileSync.mockReset();
  fs.renameSync.mockReset();
  os.homedir.mockReset();
  os.homedir.mockReturnValue('/mock/home');
});

describe('preSeedTrust — Diamond B-13 (CD-38)', () => {
  test('creates ~/.claude.json with projects entry when file does not exist', () => {
    fs.existsSync.mockReturnValue(false);

    const result = preSeedTrust('/Users/test/test-007');

    expect(result).toEqual({
      fileExisted: false,
      entryExisted: false,
      alreadyTrusted: false,
    });

    expect(fs.writeFileSync).toHaveBeenCalledTimes(1);
    const [tmpPath, content] = fs.writeFileSync.mock.calls[0];
    expect(tmpPath).toBe('/mock/home/.claude.json.tmp');

    const data = JSON.parse(content as string);
    expect(data.projects['/Users/test/test-007'].hasTrustDialogAccepted).toBe(true);
  });

  test('atomic write — writes to .tmp then renames to final path', () => {
    fs.existsSync.mockReturnValue(false);

    preSeedTrust('/Users/test/abc');

    expect(fs.writeFileSync).toHaveBeenCalledWith(
      '/mock/home/.claude.json.tmp',
      expect.any(String),
      'utf8',
    );
    expect(fs.renameSync).toHaveBeenCalledWith(
      '/mock/home/.claude.json.tmp',
      '/mock/home/.claude.json',
    );
    // rename must come AFTER writeFileSync (atomic-replace pattern)
    const writeOrder = fs.writeFileSync.mock.invocationCallOrder[0];
    const renameOrder = fs.renameSync.mock.invocationCallOrder[0];
    expect(renameOrder).toBeGreaterThan(writeOrder);
  });

  test('preserves existing projects entries (merge-safe)', () => {
    fs.existsSync.mockReturnValue(true);
    fs.readFileSync.mockReturnValue(
      JSON.stringify({
        projects: {
          '/other/project': { hasTrustDialogAccepted: true, allowedTools: ['Read'] },
        },
        userId: 'user-123',
      }),
    );

    const result = preSeedTrust('/Users/test/new-project');

    expect(result).toEqual({
      fileExisted: true,
      entryExisted: false,
      alreadyTrusted: false,
    });

    const [, content] = fs.writeFileSync.mock.calls[0];
    const data = JSON.parse(content as string);
    expect(data.userId).toBe('user-123');
    expect(data.projects['/other/project']).toEqual({
      hasTrustDialogAccepted: true,
      allowedTools: ['Read'],
    });
    expect(data.projects['/Users/test/new-project'].hasTrustDialogAccepted).toBe(true);
  });

  test('preserves other fields on existing project entry (merge-safe)', () => {
    fs.existsSync.mockReturnValue(true);
    fs.readFileSync.mockReturnValue(
      JSON.stringify({
        projects: {
          '/Users/test/already-known': {
            hasTrustDialogAccepted: false,
            customField: 'preserved',
          },
        },
      }),
    );

    const result = preSeedTrust('/Users/test/already-known');

    expect(result).toEqual({
      fileExisted: true,
      entryExisted: true,
      alreadyTrusted: false,
    });

    const [, content] = fs.writeFileSync.mock.calls[0];
    const data = JSON.parse(content as string);
    expect(data.projects['/Users/test/already-known']).toEqual({
      hasTrustDialogAccepted: true,
      customField: 'preserved',
    });
  });

  test('reports alreadyTrusted=true when entry already has hasTrustDialogAccepted=true', () => {
    fs.existsSync.mockReturnValue(true);
    fs.readFileSync.mockReturnValue(
      JSON.stringify({
        projects: {
          '/Users/test/trusted': { hasTrustDialogAccepted: true },
        },
      }),
    );

    const result = preSeedTrust('/Users/test/trusted');

    expect(result).toEqual({
      fileExisted: true,
      entryExisted: true,
      alreadyTrusted: true,
    });
    // Idempotent — still writes (overwrites with same value)
    expect(fs.writeFileSync).toHaveBeenCalledTimes(1);
  });

  test('treats corrupt JSON as fresh and proceeds', () => {
    fs.existsSync.mockReturnValue(true);
    fs.readFileSync.mockReturnValue('{ this is not valid json');

    const result = preSeedTrust('/Users/test/recovery');

    expect(result.fileExisted).toBe(true);
    expect(result.entryExisted).toBe(false);
    expect(result.alreadyTrusted).toBe(false);

    const [, content] = fs.writeFileSync.mock.calls[0];
    const data = JSON.parse(content as string);
    expect(data.projects['/Users/test/recovery'].hasTrustDialogAccepted).toBe(true);
  });

  test('handles file that exists but has no projects key', () => {
    fs.existsSync.mockReturnValue(true);
    fs.readFileSync.mockReturnValue(JSON.stringify({ userId: 'u1' }));

    const result = preSeedTrust('/Users/test/no-projects-key');

    expect(result.fileExisted).toBe(true);
    expect(result.entryExisted).toBe(false);

    const [, content] = fs.writeFileSync.mock.calls[0];
    const data = JSON.parse(content as string);
    expect(data.userId).toBe('u1');
    expect(data.projects['/Users/test/no-projects-key'].hasTrustDialogAccepted).toBe(true);
  });
});
