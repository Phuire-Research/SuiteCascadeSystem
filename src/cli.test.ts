import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';

const cli = resolve(process.cwd(), 'dist/cli.cjs');

describe('CLI integration (Layer 3)', () => {
  it('--version prints a semver string', () => {
    const output = execFileSync('node', [cli, '--version'], { encoding: 'utf8' }).trim();
    expect(output).toMatch(/^\d+\.\d+\.\d+/);
  });

  it('--help short-circuits before default action (regression guard for OQ-1)', () => {
    const output = execFileSync('node', [cli, '--help'], { encoding: 'utf8' });
    expect(output).toMatch(/Usage:\s+scs/);
    expect(output).toMatch(/hello/);
    expect(output).toMatch(/bridge/);
  });

  it('hello prints Hello, World!', () => {
    const output = execFileSync('node', [cli, 'hello'], { encoding: 'utf8' }).trim();
    expect(output).toBe('Hello, World!');
  });

  it('hello Stratidian prints Hello, Stratidian!', () => {
    const output = execFileSync('node', [cli, 'hello', 'Stratidian'], { encoding: 'utf8' }).trim();
    expect(output).toBe('Hello, Stratidian!');
  });

  it('exits non-zero on unknown command', () => {
    let status: number | undefined;
    try {
      execFileSync('node', [cli, 'unknowncommand'], { encoding: 'utf8' });
    } catch (err: unknown) {
      const e = err as NodeJS.ErrnoException & { status?: number };
      status = typeof e.status === 'number' ? e.status : -1;
    }
    expect(status).toBeDefined();
    expect(status).toBeGreaterThan(0);
  });
});

describe('CLI bridge integration (Layer 3)', () => {
  it('scs bridge --help returns exit 0 and lists subcommands', () => {
    const output = execFileSync('node', [cli, 'bridge', '--help'], {
      encoding: 'utf8',
    }).trim();
    expect(output).toMatch(/spawn/);
    expect(output).toMatch(/send/);
    expect(output).toMatch(/list/);
    expect(output).toMatch(/attach/);
    expect(output).toMatch(/archive/);
  });

  it('scs bridge spawn --help returns exit 0', () => {
    const output = execFileSync('node', [cli, 'bridge', 'spawn', '--help'], {
      encoding: 'utf8',
    }).trim();
    expect(output).toMatch(/spawn/i);
    expect(output).toMatch(/--cwd/);
    expect(output).toMatch(/--no-launch/);
  });

  it('scs bridge send --help returns exit 0', () => {
    const output = execFileSync('node', [cli, 'bridge', 'send', '--help'], {
      encoding: 'utf8',
    }).trim();
    expect(output).toMatch(/send/i);
    expect(output).toMatch(/--priority/);
  });

  it('existing hello world still works after bridge extension', () => {
    const output = execFileSync('node', [cli, 'hello'], { encoding: 'utf8' }).trim();
    expect(output).toBe('Hello, World!');
  });

  it('scs bridge spawn --no-launch allocates a session and exits 0', () => {
    const output = execFileSync('node', [cli, 'bridge', 'spawn', '--no-launch'], {
      encoding: 'utf8',
    }).trim();
    expect(output).toMatch(/^[0-9A-Z]{26}$/);
  });

  it('scs bridge menu --help documents the persistent menu subcommand', () => {
    const output = execFileSync('node', [cli, 'bridge', 'menu', '--help'], {
      encoding: 'utf8',
    }).trim();
    expect(output).toMatch(/Open the persistent live-updating session menu/);
  });
});

describe('CLI __hook integration (Layer 3)', () => {
  it('scs __hook --help is accessible (hidden subcommand)', () => {
    const output = execFileSync('node', [cli, '__hook', '--help'], {
      encoding: 'utf8',
    }).trim();
    expect(output).toMatch(/session-start/);
  });

  it('scs __hook session-start --help describes the SessionStart hook', () => {
    const output = execFileSync('node', [cli, '__hook', 'session-start', '--help'], {
      encoding: 'utf8',
    }).trim();
    expect(output).toMatch(/SessionStart hook/i);
  });

  it('scs __hook session-start exits 0 silently when SCS_BRIDGE_ULID is absent', () => {
    let status: number | undefined;
    try {
      execFileSync('node', [cli, '__hook', 'session-start'], {
        encoding: 'utf8',
        input: '',
        env: { ...process.env, SCS_BRIDGE_ULID: '' },
      });
      status = 0;
    } catch (err: unknown) {
      const e = err as NodeJS.ErrnoException & { status?: number };
      status = typeof e.status === 'number' ? e.status : -1;
    }
    expect(status).toBe(0);
  });
});
