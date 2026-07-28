import { EventEmitter } from 'node:events';
import * as registryActual from './registry';
import * as persistenceActual from './sessionPersistence';
import { runSessionEndHook } from './sessionEndHook';

jest.mock('./registry', () => ({
  markSessionOffline: jest.fn(),
  removeSession: jest.fn(),
}));

jest.mock('./sessionPersistence', () => ({
  hasPersistedSession: jest.fn(),
}));

const registry = registryActual as unknown as {
  markSessionOffline: jest.Mock;
  removeSession: jest.Mock;
};

const persistence = persistenceActual as unknown as {
  hasPersistedSession: jest.Mock;
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
  registry.markSessionOffline.mockReset();
  registry.removeSession.mockReset();
  persistence.hasPersistedSession.mockReset();
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
  process.env = { ...ORIGINAL_ENV };
});

describe('runSessionEndHook', () => {
  it('exits 0 silently when SCS_BRIDGE_ULID env var is absent', async () => {
    delete process.env.SCS_BRIDGE_ULID;
    await expect(runSessionEndHook()).rejects.toThrow('__exit__');
    expect(exitSpy).toHaveBeenCalledWith(0);
    expect(registry.markSessionOffline).not.toHaveBeenCalled();
    expect(registry.removeSession).not.toHaveBeenCalled();
  });

  it('Diamond M: persisted JSONL → markSessionOffline (preserve row)', async () => {
    process.env.SCS_BRIDGE_ULID = 'TESTULID';
    const stdin = installStdin();
    persistence.hasPersistedSession.mockReturnValue(true);
    registry.markSessionOffline.mockResolvedValue(undefined);

    const promise = runSessionEndHook();
    setImmediate(() => {
      stdin.emit(
        'data',
        Buffer.from(
          JSON.stringify({
            session_id: 'real-claude-uuid',
            cwd: '/c',
            hook_event_name: 'SessionEnd',
          }),
        ),
      );
      stdin.emit('end');
    });

    await expect(promise).rejects.toThrow('__exit__');
    expect(persistence.hasPersistedSession).toHaveBeenCalledWith('/c', 'real-claude-uuid');
    expect(registry.markSessionOffline).toHaveBeenCalledWith('TESTULID');
    expect(registry.removeSession).not.toHaveBeenCalled();
    expect(exitSpy).toHaveBeenCalledWith(0);
  });

  it('Diamond M: unpersisted JSONL → removeSession (phantom evict)', async () => {
    process.env.SCS_BRIDGE_ULID = 'TESTULID';
    const stdin = installStdin();
    persistence.hasPersistedSession.mockReturnValue(false);
    registry.removeSession.mockResolvedValue(undefined);

    const promise = runSessionEndHook();
    setImmediate(() => {
      stdin.emit(
        'data',
        Buffer.from(
          JSON.stringify({
            session_id: 'blank-uuid',
            cwd: '/c',
            hook_event_name: 'SessionEnd',
          }),
        ),
      );
      stdin.emit('end');
    });

    await expect(promise).rejects.toThrow('__exit__');
    expect(persistence.hasPersistedSession).toHaveBeenCalledWith('/c', 'blank-uuid');
    expect(registry.removeSession).toHaveBeenCalledWith('TESTULID');
    expect(registry.markSessionOffline).not.toHaveBeenCalled();
    expect(exitSpy).toHaveBeenCalledWith(0);
  });

  it('Diamond M: missing session_id treated as unpersisted → removeSession', async () => {
    process.env.SCS_BRIDGE_ULID = 'TESTULID';
    const stdin = installStdin();
    registry.removeSession.mockResolvedValue(undefined);

    const promise = runSessionEndHook();
    setImmediate(() => {
      stdin.emit('data', Buffer.from(JSON.stringify({ cwd: '/c' })));
      stdin.emit('end');
    });

    await expect(promise).rejects.toThrow('__exit__');
    expect(persistence.hasPersistedSession).not.toHaveBeenCalled();
    expect(registry.removeSession).toHaveBeenCalledWith('TESTULID');
    expect(registry.markSessionOffline).not.toHaveBeenCalled();
  });

  it('exits 0 silently on malformed JSON stdin', async () => {
    process.env.SCS_BRIDGE_ULID = 'TESTULID';
    const stdin = installStdin();
    const promise = runSessionEndHook();
    setImmediate(() => {
      stdin.emit('data', Buffer.from('not json at all { ['));
      stdin.emit('end');
    });
    await expect(promise).rejects.toThrow('__exit__');
    expect(registry.markSessionOffline).not.toHaveBeenCalled();
    expect(registry.removeSession).not.toHaveBeenCalled();
  });

  it('writes stderr message and exits 0 when registry update throws (offline path)', async () => {
    process.env.SCS_BRIDGE_ULID = 'TESTULID';
    const stdin = installStdin();
    persistence.hasPersistedSession.mockReturnValue(true);
    registry.markSessionOffline.mockRejectedValue(new Error('registry-boom'));

    const promise = runSessionEndHook();
    setImmediate(() => {
      stdin.emit('data', Buffer.from(JSON.stringify({ session_id: 'real-uuid', cwd: '/c' })));
      stdin.emit('end');
    });
    await expect(promise).rejects.toThrow('__exit__');
    expect(stderrSpy).toHaveBeenCalledWith(
      expect.stringContaining('[scs-hook] session-end registry update failed:'),
    );
    expect(exitSpy).toHaveBeenCalledWith(0);
  });
});
