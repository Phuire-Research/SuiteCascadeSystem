import * as fs from 'node:fs';
import * as fsp from 'node:fs/promises';

jest.mock('node:fs');
jest.mock('node:fs/promises');
jest.mock('./sessionStartHook', () => ({
  readStdin: jest.fn(),
}));
jest.mock('./registry', () => ({
  updateSessionLiveIdentity: jest.fn(),
}));

import {
  runRegisterInstallHook,
  runScaffoldCompleteSignalHook,
  runUserPromptSubmitInstallHook,
} from './installHooks';
import { readStdin } from './sessionStartHook';
import { updateSessionLiveIdentity } from './registry';

const mockExistsSync = fs.existsSync as unknown as jest.Mock;
const mockWriteFileSync = fs.writeFileSync as unknown as jest.Mock;
const mockWriteFile = fsp.writeFile as unknown as jest.Mock;
const mockReadStdin = readStdin as unknown as jest.Mock;
const mockUpdateSessionLiveIdentity = updateSessionLiveIdentity as unknown as jest.Mock;

const originalEnv = process.env;
let mockExit: jest.SpyInstance;
let mockStdoutWrite: jest.SpyInstance;

beforeEach(() => {
  jest.clearAllMocks();
  mockWriteFile.mockResolvedValue(undefined);
  mockUpdateSessionLiveIdentity.mockResolvedValue(undefined);
  process.env = {
    ...originalEnv,
    SCS_BRIDGE_ULID: 'TEST-ULID',
    SCS_BRIDGE_INSTALL_TEMP: '/tmp/scs-install-test',
  };
  mockExit = jest.spyOn(process, 'exit').mockImplementation((_code?: string | number | null) => {
    throw new Error(`process.exit(${_code})`);
  });
  mockStdoutWrite = jest.spyOn(process.stdout, 'write').mockImplementation(() => true);
});

afterEach(() => {
  process.env = originalEnv;
  mockExit.mockRestore();
  mockStdoutWrite.mockRestore();
});

describe('runRegisterInstallHook', () => {
  it('exits 0 without env vars', async () => {
    process.env = { ...originalEnv };
    await expect(runRegisterInstallHook()).rejects.toThrow('process.exit(0)');
    expect(mockWriteFile).not.toHaveBeenCalled();
  });

  it('writes register-state.json with ready status and session_id', async () => {
    mockReadStdin.mockResolvedValue(JSON.stringify({ session_id: 'claude-session-abc' }));
    await expect(runRegisterInstallHook()).rejects.toThrow('process.exit(0)');
    expect(mockWriteFile).toHaveBeenCalledWith(
      '/tmp/scs-install-test/register-state.json',
      expect.stringContaining('"status": "ready"'),
      'utf8',
    );
    const writtenJson = mockWriteFile.mock.calls[0][1] as string;
    const parsed = JSON.parse(writtenJson);
    expect(parsed.status).toBe('ready');
    expect(parsed.sessionId).toBe('claude-session-abc');
    expect(typeof parsed.timestamp).toBe('number');
  });

  it('still exits 0 when stdin is invalid JSON', async () => {
    mockReadStdin.mockResolvedValue('not valid json');
    await expect(runRegisterInstallHook()).rejects.toThrow('process.exit(0)');
  });

  it('B-25-UX-fix2 (CD-108 IARSR): registers with bridge session registry via updateSessionLiveIdentity', async () => {
    mockReadStdin.mockResolvedValue(JSON.stringify({ session_id: 'claude-session-abc' }));
    await expect(runRegisterInstallHook()).rejects.toThrow('process.exit(0)');
    expect(mockUpdateSessionLiveIdentity).toHaveBeenCalledWith(
      'TEST-ULID',
      'claude-session-abc',
      expect.any(Number), // process.ppid
    );
  });

  it('B-25-UX-fix2: skips registry update if no session_id in stdin payload', async () => {
    mockReadStdin.mockResolvedValue(JSON.stringify({})); // missing session_id
    await expect(runRegisterInstallHook()).rejects.toThrow('process.exit(0)');
    expect(mockUpdateSessionLiveIdentity).not.toHaveBeenCalled();
  });

  it('B-25-UX-fix2: registry write failure is non-fatal (legacy tempDir flag still written)', async () => {
    mockReadStdin.mockResolvedValue(JSON.stringify({ session_id: 'claude-session-xyz' }));
    mockUpdateSessionLiveIdentity.mockRejectedValue(new Error('registry write failed'));
    const stderrSpy = jest.spyOn(process.stderr, 'write').mockImplementation(() => true);
    await expect(runRegisterInstallHook()).rejects.toThrow('process.exit(0)');
    // Legacy tempDir flag still written despite registry failure
    expect(mockWriteFile).toHaveBeenCalledWith(
      '/tmp/scs-install-test/register-state.json',
      expect.stringContaining('"status": "ready"'),
      'utf8',
    );
    stderrSpy.mockRestore();
  });
});

describe('runScaffoldCompleteSignalHook', () => {
  it('exits 0 without env vars', async () => {
    process.env = { ...originalEnv };
    await expect(runScaffoldCompleteSignalHook()).rejects.toThrow('process.exit(0)');
    expect(mockWriteFileSync).not.toHaveBeenCalled();
  });

  it('writes scaffold-done.flag with JSON payload', async () => {
    await expect(
      runScaffoldCompleteSignalHook({ cascadesCount: 42, dotClaudeCount: 10 }),
    ).rejects.toThrow('process.exit(0)');
    expect(mockWriteFileSync).toHaveBeenCalledWith(
      '/tmp/scs-install-test/scaffold-done.flag',
      expect.stringContaining('"done":true'),
    );
    const writtenJson = mockWriteFileSync.mock.calls[0][1] as string;
    const parsed = JSON.parse(writtenJson);
    expect(parsed.done).toBe(true);
    expect(parsed.cascadesCount).toBe(42);
    expect(parsed.dotClaudeCount).toBe(10);
    expect(typeof parsed.timestamp).toBe('number');
  });

  it('idempotent re-write: second call overwrites flag with updated timestamp', async () => {
    await expect(runScaffoldCompleteSignalHook({ cascadesCount: 5 })).rejects.toThrow(
      'process.exit(0)',
    );
    const firstCall = mockWriteFileSync.mock.calls[0][1] as string;
    jest.clearAllMocks();
    await expect(runScaffoldCompleteSignalHook({ cascadesCount: 5 })).rejects.toThrow(
      'process.exit(0)',
    );
    expect(mockWriteFileSync).toHaveBeenCalledTimes(1);
    const secondCall = mockWriteFileSync.mock.calls[0][1] as string;
    expect(secondCall).toContain('"done":true');
    expect(firstCall).toContain('"done":true');
  });
});

describe('runUserPromptSubmitInstallHook', () => {
  it('exits 0 without env vars', async () => {
    process.env = { ...originalEnv };
    await expect(runUserPromptSubmitInstallHook()).rejects.toThrow('process.exit(0)');
    expect(mockWriteFileSync).not.toHaveBeenCalled();
  });

  it('writes flag and emits priming prompt when flag absent', async () => {
    mockExistsSync.mockReturnValue(false);
    await expect(runUserPromptSubmitInstallHook()).rejects.toThrow('process.exit(0)');
    expect(mockWriteFileSync).toHaveBeenCalledWith('/tmp/scs-install-test/installPrimed.flag', '');
    expect(mockStdoutWrite).toHaveBeenCalledWith(
      expect.stringContaining('SuiteCascadeSystem install assistant'),
    );
  });

  it('does NOT emit priming prompt when flag present (single-fire idempotency)', async () => {
    mockExistsSync.mockReturnValue(true);
    await expect(runUserPromptSubmitInstallHook()).rejects.toThrow('process.exit(0)');
    expect(mockWriteFileSync).not.toHaveBeenCalled();
    expect(mockStdoutWrite).not.toHaveBeenCalled();
  });

  it('priming prompt contains Strategy S1 instruction', async () => {
    mockExistsSync.mockReturnValue(false);
    await expect(runUserPromptSubmitInstallHook()).rejects.toThrow('process.exit(0)');
    const written = mockStdoutWrite.mock.calls[0][0] as string;
    expect(written).toContain('Strategy S1');
  });
});
