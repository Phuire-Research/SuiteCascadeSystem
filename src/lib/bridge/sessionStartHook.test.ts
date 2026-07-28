import { EventEmitter } from 'node:events';
import * as fsActual from 'node:fs/promises';
import * as registryActual from './registry';
import * as pathsActual from './paths';
import * as scpResolverActual from './scpResolver';
import { runSessionStartHook } from './sessionStartHook';

jest.mock('node:fs/promises', () => ({
  readFile: jest.fn(),
  writeFile: jest.fn(),
  rename: jest.fn(),
}));

jest.mock('./registry', () => ({
  updateSessionLiveIdentity: jest.fn(),
  setSessionScpAffinity: jest.fn(),
}));

jest.mock('./scpResolver', () => ({
  resolveScpNameFromCwd: jest.fn(),
}));

jest.mock('./paths', () => ({
  metaPath: jest.fn((id: string) => `/mock/sessions/${id}/meta.json`),
}));

const fs = fsActual as unknown as {
  readFile: jest.Mock;
  writeFile: jest.Mock;
  rename: jest.Mock;
};
const registry = registryActual as unknown as {
  updateSessionLiveIdentity: jest.Mock;
  setSessionScpAffinity: jest.Mock;
};
const scpResolver = scpResolverActual as unknown as {
  resolveScpNameFromCwd: jest.Mock;
};
const paths = pathsActual as unknown as {
  metaPath: jest.Mock;
};

const ORIGINAL_ENV = { ...process.env };
let exitSpy: jest.SpyInstance;
let stderrSpy: jest.SpyInstance;
let originalStdin: typeof process.stdin;

class MockStdin extends EventEmitter {}

function installStdin(): MockStdin {
  const mock = new MockStdin();
  Object.defineProperty(process, 'stdin', { value: mock, configurable: true });
  return mock;
}

function restoreStdin(): void {
  Object.defineProperty(process, 'stdin', { value: originalStdin, configurable: true });
}

beforeEach(() => {
  fs.readFile.mockReset();
  fs.writeFile.mockReset();
  fs.rename.mockReset();
  registry.updateSessionLiveIdentity.mockReset();
  registry.setSessionScpAffinity.mockReset();
  scpResolver.resolveScpNameFromCwd.mockReset();
  paths.metaPath.mockClear();
  paths.metaPath.mockImplementation((id: string) => `/mock/sessions/${id}/meta.json`);
  exitSpy = jest.spyOn(process, 'exit').mockImplementation(((_code?: number) => {
    throw new Error('__exit__');
  }) as never);
  stderrSpy = jest.spyOn(process.stderr, 'write').mockImplementation(() => true);
  originalStdin = process.stdin;
});

afterEach(() => {
  exitSpy.mockRestore();
  stderrSpy.mockRestore();
  restoreStdin();
  // SS-P1 · HIGH risk mitigation: explicit env var deletion prevents test
  // leakage of SCS_BRIDGE_SCP_NAME across the Jest worker.
  delete process.env.SCS_BRIDGE_SCP_NAME;
  process.env = { ...ORIGINAL_ENV };
});

describe('runSessionStartHook', () => {
  it('exits 0 silently when SCS_BRIDGE_ULID env var is absent', async () => {
    delete process.env.SCS_BRIDGE_ULID;
    await expect(runSessionStartHook()).rejects.toThrow('__exit__');
    expect(exitSpy).toHaveBeenCalledWith(0);
    expect(registry.updateSessionLiveIdentity).not.toHaveBeenCalled();
    expect(fs.readFile).not.toHaveBeenCalled();
    expect(fs.writeFile).not.toHaveBeenCalled();
  });

  it('updates registry and meta.json on valid stdin + ULID', async () => {
    process.env.SCS_BRIDGE_ULID = 'TESTULID';
    const stdin = installStdin();
    fs.readFile.mockResolvedValue(
      JSON.stringify({ id: 'TESTULID', status: 'allocated', claudeBinary: 'claude', cwd: '/c' }),
    );
    fs.writeFile.mockResolvedValue(undefined);
    fs.rename.mockResolvedValue(undefined);
    registry.updateSessionLiveIdentity.mockResolvedValue(undefined);

    const promise = runSessionStartHook();
    setImmediate(() => {
      stdin.emit(
        'data',
        Buffer.from(
          JSON.stringify({
            session_id: 'real-claude-uuid',
            cwd: '/c',
            hook_event_name: 'SessionStart',
            source: 'startup',
          }),
        ),
      );
      stdin.emit('end');
    });

    await expect(promise).rejects.toThrow('__exit__');
    expect(registry.updateSessionLiveIdentity).toHaveBeenCalledWith(
      'TESTULID',
      'real-claude-uuid',
      process.ppid,
    );
    expect(fs.writeFile).toHaveBeenCalled();
    expect(fs.rename).toHaveBeenCalled();
    expect(exitSpy).toHaveBeenCalledWith(0);
  });

  it('exits 0 silently when stdin JSON has no session_id field', async () => {
    process.env.SCS_BRIDGE_ULID = 'TESTULID';
    const stdin = installStdin();
    const promise = runSessionStartHook();
    setImmediate(() => {
      stdin.emit('data', Buffer.from(JSON.stringify({ cwd: '/c', source: 'startup' })));
      stdin.emit('end');
    });
    await expect(promise).rejects.toThrow('__exit__');
    expect(registry.updateSessionLiveIdentity).not.toHaveBeenCalled();
    expect(fs.readFile).not.toHaveBeenCalled();
  });

  it('exits 0 silently on malformed JSON stdin', async () => {
    process.env.SCS_BRIDGE_ULID = 'TESTULID';
    const stdin = installStdin();
    const promise = runSessionStartHook();
    setImmediate(() => {
      stdin.emit('data', Buffer.from('not json at all { ['));
      stdin.emit('end');
    });
    await expect(promise).rejects.toThrow('__exit__');
    expect(registry.updateSessionLiveIdentity).not.toHaveBeenCalled();
  });

  it('writes stderr message and exits 0 when registry update throws', async () => {
    process.env.SCS_BRIDGE_ULID = 'TESTULID';
    const stdin = installStdin();
    registry.updateSessionLiveIdentity.mockRejectedValue(new Error('registry-boom'));

    const promise = runSessionStartHook();
    setImmediate(() => {
      stdin.emit(
        'data',
        Buffer.from(JSON.stringify({ session_id: 'real-uuid', source: 'startup' })),
      );
      stdin.emit('end');
    });
    await expect(promise).rejects.toThrow('__exit__');
    expect(stderrSpy).toHaveBeenCalledWith(
      expect.stringContaining('[scs-hook] registry update failed:'),
    );
    expect(exitSpy).toHaveBeenCalledWith(0);
  });

  it('writes stderr message but still exits 0 when meta read fails', async () => {
    process.env.SCS_BRIDGE_ULID = 'TESTULID';
    const stdin = installStdin();
    registry.updateSessionLiveIdentity.mockResolvedValue(undefined);
    fs.readFile.mockRejectedValue(new Error('ENOENT'));

    const promise = runSessionStartHook();
    setImmediate(() => {
      stdin.emit(
        'data',
        Buffer.from(JSON.stringify({ session_id: 'real-uuid', source: 'startup' })),
      );
      stdin.emit('end');
    });
    await expect(promise).rejects.toThrow('__exit__');
    expect(stderrSpy).toHaveBeenCalledWith(
      expect.stringContaining('[scs-hook] meta.json update failed:'),
    );
    expect(exitSpy).toHaveBeenCalledWith(0);
  });

  it('exits 0 silently when stdin produces empty payload — JSON.parse fails on empty string', async () => {
    process.env.SCS_BRIDGE_ULID = 'TESTULID';
    const stdin = installStdin();
    const promise = runSessionStartHook();
    setImmediate(() => {
      stdin.emit('end');
    });
    await expect(promise).rejects.toThrow('__exit__');
    expect(registry.updateSessionLiveIdentity).not.toHaveBeenCalled();
    expect(fs.readFile).not.toHaveBeenCalled();
  });
});

describe('SS-P1 · SCP affinity resolution in runSessionStartHook', () => {
  const fireHook = (
    stdinPayload: Record<string, unknown>,
    opts: { affinityResolves?: boolean } = { affinityResolves: true },
  ): Promise<unknown> => {
    const stdin = installStdin();
    fs.readFile.mockResolvedValue(
      JSON.stringify({ id: 'TESTULID', status: 'allocated', claudeBinary: 'claude', cwd: '/c' }),
    );
    fs.writeFile.mockResolvedValue(undefined);
    fs.rename.mockResolvedValue(undefined);
    registry.updateSessionLiveIdentity.mockResolvedValue(undefined);
    if (opts.affinityResolves !== false) {
      registry.setSessionScpAffinity.mockResolvedValue(undefined);
    }

    const promise = runSessionStartHook();
    setImmediate(() => {
      stdin.emit('data', Buffer.from(JSON.stringify(stdinPayload)));
      stdin.emit('end');
    });
    return promise;
  };

  it('reads SCS_BRIDGE_SCP_NAME env var and calls setSessionScpAffinity (env override)', async () => {
    process.env.SCS_BRIDGE_ULID = 'TESTULID';
    process.env.SCS_BRIDGE_SCP_NAME = 'EnvProject';
    scpResolver.resolveScpNameFromCwd.mockResolvedValue(undefined);

    await expect(
      fireHook({ session_id: 'real-uuid', cwd: '/some/cwd', source: 'startup' }),
    ).rejects.toThrow('__exit__');

    expect(registry.setSessionScpAffinity).toHaveBeenCalledWith('TESTULID', 'EnvProject');
  });

  it('falls back to CWD-match when env var is absent', async () => {
    process.env.SCS_BRIDGE_ULID = 'TESTULID';
    delete process.env.SCS_BRIDGE_SCP_NAME;
    scpResolver.resolveScpNameFromCwd.mockResolvedValue('CwdProject');

    await expect(
      fireHook({ session_id: 'real-uuid', cwd: '/projects/myapp', source: 'startup' }),
    ).rejects.toThrow('__exit__');

    expect(scpResolver.resolveScpNameFromCwd).toHaveBeenCalledWith('/projects/myapp');
    expect(registry.setSessionScpAffinity).toHaveBeenCalledWith('TESTULID', 'CwdProject');
  });

  it('env var wins when both SCS_BRIDGE_SCP_NAME and CWD-match produce results (EOBIC)', async () => {
    process.env.SCS_BRIDGE_ULID = 'TESTULID';
    process.env.SCS_BRIDGE_SCP_NAME = 'EnvWins';
    scpResolver.resolveScpNameFromCwd.mockResolvedValue('CwdValue');

    await expect(
      fireHook({ session_id: 'real-uuid', cwd: '/projects/somewhere', source: 'startup' }),
    ).rejects.toThrow('__exit__');

    expect(registry.setSessionScpAffinity).toHaveBeenCalledWith('TESTULID', 'EnvWins');
    expect(registry.setSessionScpAffinity).toHaveBeenCalledTimes(1);
    expect(scpResolver.resolveScpNameFromCwd).not.toHaveBeenCalled();
  });

  it('does NOT call setSessionScpAffinity when neither env nor CWD-match produces a result', async () => {
    process.env.SCS_BRIDGE_ULID = 'TESTULID';
    delete process.env.SCS_BRIDGE_SCP_NAME;
    scpResolver.resolveScpNameFromCwd.mockResolvedValue(undefined);

    await expect(
      fireHook({ session_id: 'real-uuid', cwd: '/unrelated/cwd', source: 'startup' }),
    ).rejects.toThrow('__exit__');

    expect(registry.setSessionScpAffinity).not.toHaveBeenCalled();
  });

  it('treats empty string SCS_BRIDGE_SCP_NAME as absent and falls back to CWD-match', async () => {
    process.env.SCS_BRIDGE_ULID = 'TESTULID';
    process.env.SCS_BRIDGE_SCP_NAME = '   ';
    scpResolver.resolveScpNameFromCwd.mockResolvedValue('CwdFromBlank');

    await expect(
      fireHook({ session_id: 'real-uuid', cwd: '/projects/x', source: 'startup' }),
    ).rejects.toThrow('__exit__');

    expect(registry.setSessionScpAffinity).toHaveBeenCalledWith('TESTULID', 'CwdFromBlank');
  });

  it('writes stderr but continues hook flow when setSessionScpAffinity throws', async () => {
    process.env.SCS_BRIDGE_ULID = 'TESTULID';
    process.env.SCS_BRIDGE_SCP_NAME = 'EnvProject';
    registry.setSessionScpAffinity.mockRejectedValue(new Error('affinity-write-boom'));

    await expect(
      fireHook({ session_id: 'real-uuid', cwd: '/c', source: 'startup' }, { affinityResolves: false }),
    ).rejects.toThrow('__exit__');

    expect(stderrSpy).toHaveBeenCalledWith(
      expect.stringContaining('[scs-hook] scpName affinity bind failed:'),
    );
    expect(exitSpy).toHaveBeenCalledWith(0);
  });
});

describe('SS-Final · SPMEM (preferredScpName) fallback in runSessionStartHook', () => {
  // Three-step fallback chain: env var > preferredScpName (meta.json) > CWD-match.
  // SPMEM reads meta.json BEFORE invoking resolveScpNameFromCwd.
  const fireHookWithMeta = (
    stdinPayload: Record<string, unknown>,
    metaShape: Record<string, unknown>,
  ): Promise<unknown> => {
    const stdin = installStdin();
    fs.readFile.mockResolvedValue(JSON.stringify(metaShape));
    fs.writeFile.mockResolvedValue(undefined);
    fs.rename.mockResolvedValue(undefined);
    registry.updateSessionLiveIdentity.mockResolvedValue(undefined);
    registry.setSessionScpAffinity.mockResolvedValue(undefined);

    const promise = runSessionStartHook();
    setImmediate(() => {
      stdin.emit('data', Buffer.from(JSON.stringify(stdinPayload)));
      stdin.emit('end');
    });
    return promise;
  };

  it('reads preferredScpName from meta.json when env var is absent (SPMEM fallback)', async () => {
    process.env.SCS_BRIDGE_ULID = 'TESTULID';
    delete process.env.SCS_BRIDGE_SCP_NAME;
    scpResolver.resolveScpNameFromCwd.mockResolvedValue(undefined);

    await expect(
      fireHookWithMeta(
        { session_id: 'real-uuid', cwd: '/projects/whatever', source: 'startup' },
        { id: 'TESTULID', status: 'allocated', claudeBinary: 'claude', cwd: '/c', preferredScpName: 'StickyProject' },
      ),
    ).rejects.toThrow('__exit__');

    expect(registry.setSessionScpAffinity).toHaveBeenCalledWith('TESTULID', 'StickyProject');
    expect(scpResolver.resolveScpNameFromCwd).not.toHaveBeenCalled();
  });

  it('env var wins over preferredScpName (SCS_BRIDGE_SCP_NAME > SPMEM)', async () => {
    process.env.SCS_BRIDGE_ULID = 'TESTULID';
    process.env.SCS_BRIDGE_SCP_NAME = 'EnvWinsOverSPMEM';
    scpResolver.resolveScpNameFromCwd.mockResolvedValue(undefined);

    await expect(
      fireHookWithMeta(
        { session_id: 'real-uuid', cwd: '/c', source: 'startup' },
        { id: 'TESTULID', status: 'allocated', claudeBinary: 'claude', cwd: '/c', preferredScpName: 'IgnoredPreferred' },
      ),
    ).rejects.toThrow('__exit__');

    expect(registry.setSessionScpAffinity).toHaveBeenCalledWith('TESTULID', 'EnvWinsOverSPMEM');
    expect(registry.setSessionScpAffinity).toHaveBeenCalledTimes(1);
  });

  it('preferredScpName wins over CWD-match (SPMEM > CWD)', async () => {
    process.env.SCS_BRIDGE_ULID = 'TESTULID';
    delete process.env.SCS_BRIDGE_SCP_NAME;
    scpResolver.resolveScpNameFromCwd.mockResolvedValue('CwdFallback');

    await expect(
      fireHookWithMeta(
        { session_id: 'real-uuid', cwd: '/projects/somewhere', source: 'startup' },
        { id: 'TESTULID', status: 'allocated', claudeBinary: 'claude', cwd: '/c', preferredScpName: 'PreferredWins' },
      ),
    ).rejects.toThrow('__exit__');

    expect(registry.setSessionScpAffinity).toHaveBeenCalledWith('TESTULID', 'PreferredWins');
    expect(scpResolver.resolveScpNameFromCwd).not.toHaveBeenCalled();
  });

  it('falls through to CWD-match when meta.json lacks preferredScpName (graceful)', async () => {
    process.env.SCS_BRIDGE_ULID = 'TESTULID';
    delete process.env.SCS_BRIDGE_SCP_NAME;
    scpResolver.resolveScpNameFromCwd.mockResolvedValue('CwdResolved');

    await expect(
      fireHookWithMeta(
        { session_id: 'real-uuid', cwd: '/projects/cwd-only', source: 'startup' },
        { id: 'TESTULID', status: 'allocated', claudeBinary: 'claude', cwd: '/c' },
      ),
    ).rejects.toThrow('__exit__');

    expect(registry.setSessionScpAffinity).toHaveBeenCalledWith('TESTULID', 'CwdResolved');
    expect(scpResolver.resolveScpNameFromCwd).toHaveBeenCalledWith('/projects/cwd-only');
  });

  it('treats empty/whitespace preferredScpName as absent and falls through to CWD', async () => {
    process.env.SCS_BRIDGE_ULID = 'TESTULID';
    delete process.env.SCS_BRIDGE_SCP_NAME;
    scpResolver.resolveScpNameFromCwd.mockResolvedValue('CwdFromBlankPreferred');

    await expect(
      fireHookWithMeta(
        { session_id: 'real-uuid', cwd: '/projects/x', source: 'startup' },
        { id: 'TESTULID', status: 'allocated', claudeBinary: 'claude', cwd: '/c', preferredScpName: '   ' },
      ),
    ).rejects.toThrow('__exit__');

    expect(registry.setSessionScpAffinity).toHaveBeenCalledWith('TESTULID', 'CwdFromBlankPreferred');
  });

  it('falls through to CWD-match when meta.json file is missing (read throws · graceful)', async () => {
    process.env.SCS_BRIDGE_ULID = 'TESTULID';
    delete process.env.SCS_BRIDGE_SCP_NAME;
    scpResolver.resolveScpNameFromCwd.mockResolvedValue('CwdFromMissing');

    const stdin = installStdin();
    // First readFile call (SPMEM read) throws ENOENT, second readFile (meta.json update) succeeds
    let readCallCount = 0;
    fs.readFile.mockImplementation(() => {
      readCallCount++;
      if (readCallCount === 1) {
        return Promise.reject(Object.assign(new Error('ENOENT'), { code: 'ENOENT' }));
      }
      return Promise.resolve(
        JSON.stringify({ id: 'TESTULID', status: 'allocated', claudeBinary: 'claude', cwd: '/c' }),
      );
    });
    fs.writeFile.mockResolvedValue(undefined);
    fs.rename.mockResolvedValue(undefined);
    registry.updateSessionLiveIdentity.mockResolvedValue(undefined);
    registry.setSessionScpAffinity.mockResolvedValue(undefined);

    const promise = runSessionStartHook();
    setImmediate(() => {
      stdin.emit('data', Buffer.from(JSON.stringify({ session_id: 'real-uuid', cwd: '/projects/missing-meta', source: 'startup' })));
      stdin.emit('end');
    });
    await expect(promise).rejects.toThrow('__exit__');

    expect(registry.setSessionScpAffinity).toHaveBeenCalledWith('TESTULID', 'CwdFromMissing');
    expect(scpResolver.resolveScpNameFromCwd).toHaveBeenCalled();
  });
});
