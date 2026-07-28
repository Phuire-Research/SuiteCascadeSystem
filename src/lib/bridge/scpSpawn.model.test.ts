/**
 * scpSpawn.model tests (SB-A1-D2 · CSCPIBIP partial port verification)
 *
 * Pure-function unit tests for the bridge-side scpSpawn.model module:
 *   - isPortInScpRange: range predicate boundaries
 *   - buildBridgeSpawnDescriptor: SABO invariant + env injection + parentEnv merge
 *   - findFreePortInScpRange: real net.createServer scan + range exhaustion
 *
 * No mocking of node:net — these tests open and close real sockets on
 * localhost in the SCP_PORT_RANGE (7700-7799). They are fast (<100ms each)
 * because findFreePortInScpRange returns on first free port.
 *
 * Citation: SUITE-6-PURPLE-SB-A1-D2-SEQUENCE.md Step 3 (5-6 test groups)
 * Citation: SUITE-3-YELLOW-SB-A1-D2-ARCHITECTURE.md E (CSCPIBIP 5-8 tests)
 * Citation: src/lib/bridge/message.test.ts (async/await flat-directory pattern)
 */
import net from 'node:net';
import {
  SCP_PORT_RANGE_START,
  SCP_PORT_RANGE_END,
  isPortInScpRange,
  buildBridgeSpawnDescriptor,
  findFreePortInScpRange,
} from './scpSpawn.model';

describe('isPortInScpRange', () => {
  it('returns true for in-range port (7750)', () => {
    expect(isPortInScpRange(7750)).toBe(true);
  });

  it('returns true at both inclusive boundaries', () => {
    expect(isPortInScpRange(SCP_PORT_RANGE_START)).toBe(true);
    expect(isPortInScpRange(SCP_PORT_RANGE_END)).toBe(true);
  });

  it('returns false below range (7699)', () => {
    expect(isPortInScpRange(7699)).toBe(false);
  });

  it('returns false above range (7800)', () => {
    expect(isPortInScpRange(7800)).toBe(false);
  });
});

describe('buildBridgeSpawnDescriptor', () => {
  it('returns SABO-invariant descriptor shape', () => {
    const desc = buildBridgeSpawnDescriptor({
      scpName: 'testScp',
      installPath: '/tmp/scps/testScp/SCP',
      port: 7750,
    });
    expect(desc.command).toBe('npm');
    expect(desc.args).toEqual(['run', 'bridge']);
    expect(desc.detached).toBe(true);
    expect(desc.shouldUnref).toBe(true);
    expect(desc.stdio).toEqual(['ignore', 'pipe', 'pipe']);
    expect(desc.scpName).toBe('testScp');
    expect(desc.browserUrl).toBe('http://localhost:7750');
  });

  it('injects SCP_NAME, SCP_BRIDGE_PORT, and PORT env vars', () => {
    const desc = buildBridgeSpawnDescriptor({
      scpName: 'envScp',
      installPath: '/tmp/scps/envScp/SCP',
      port: 7711,
    });
    expect(desc.env['SCP_NAME']).toBe('envScp');
    expect(desc.env['SCP_BRIDGE_PORT']).toBe('7711');
    expect(desc.env['PORT']).toBe('7711');
  });

  it('merges parentEnv but SCP_NAME wins on collision', () => {
    const desc = buildBridgeSpawnDescriptor({
      scpName: 'realScp',
      installPath: '/tmp/scps/realScp/SCP',
      port: 7720,
      parentEnv: {
        HOME: '/home/test',
        SCP_NAME: 'staleParentValue',
        PATH: '/usr/bin',
      },
    });
    expect(desc.env['HOME']).toBe('/home/test');
    expect(desc.env['PATH']).toBe('/usr/bin');
    expect(desc.env['SCP_NAME']).toBe('realScp');
  });

  it('resolves installPath to absolute via path.resolve', () => {
    const desc = buildBridgeSpawnDescriptor({
      scpName: 'absScp',
      installPath: '/tmp/scps/absScp/SCP',
      port: 7730,
    });
    expect(desc.cwd.startsWith('/')).toBe(true);
  });
});

describe('findFreePortInScpRange', () => {
  it('returns a port number in the SCP range', async () => {
    const port = await findFreePortInScpRange();
    expect(typeof port).toBe('number');
    expect(port).toBeGreaterThanOrEqual(SCP_PORT_RANGE_START);
    expect(port).toBeLessThanOrEqual(SCP_PORT_RANGE_END);
  });

  it('respects excludePorts Set during scan', async () => {
    const excluded = new Set<number>([SCP_PORT_RANGE_START]);
    const port = await findFreePortInScpRange(
      SCP_PORT_RANGE_START,
      SCP_PORT_RANGE_END,
      excluded,
    );
    expect(port).not.toBe(SCP_PORT_RANGE_START);
    expect(port).toBeGreaterThanOrEqual(SCP_PORT_RANGE_START);
    expect(port).toBeLessThanOrEqual(SCP_PORT_RANGE_END);
  });

  it('throws when range is exhausted (single-port range pre-occupied)', async () => {
    const occupied = await new Promise<{ server: net.Server; port: number }>(
      (resolve, reject) => {
        const server = net.createServer();
        server.once('error', reject);
        server.once('listening', () => {
          const addr = server.address();
          if (addr && typeof addr === 'object') {
            resolve({ server, port: addr.port });
          } else {
            server.close();
            reject(new Error('no-address'));
          }
        });
        server.listen(0, '127.0.0.1');
      },
    );
    try {
      await expect(
        findFreePortInScpRange(occupied.port, occupied.port),
      ).rejects.toThrow(/no-free-port-in-range/);
    } finally {
      await new Promise<void>((resolve) => occupied.server.close(() => resolve()));
    }
  });
});
