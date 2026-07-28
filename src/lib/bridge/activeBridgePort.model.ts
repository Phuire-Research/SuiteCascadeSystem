/**
 * activeBridgePort.model · C422 · THE SCOPE-PARITY COMPLETION (the port member).
 *
 * C410/C416 scoped the singleton's lock, userData, and control socket per workspace —
 * the HTTP /mcp PORT stayed a global constant (7111). Two workspaces = first-binder-wins:
 * the loser's bridge.json still CLAIMED 7111 while another workspace's daemon served it,
 * so every probe/tool call silently landed on the WRONG workspace (the C421 finding: the
 * NP arrival smoke against the dev stage captured the Lab).
 *
 * THE DESIGN: bind-time free-port scan starting at 7111 (single-workspace installs keep
 * their port untouched — full back-compat), the ACTUAL bound port held here (per-process)
 * and flowed into the muxium options → the server concept binds it → the state commits
 * it → bridge.json carries it. bridge.json IS the discovery rail — every consumer (the
 * SCP client's bj.endpoint · NP's preflight · the CLI relays) already reads it.
 *
 * Cross-process note: this model is DAEMON-process scope. The Electron main resolves the
 * port by reading the per-project bridge.json (the C402 idiom), never this module.
 */

import * as net from 'node:net';

let activeBridgePort = 7111;

export function setActiveBridgePort(port: number): void {
  activeBridgePort = port;
}

export function getActiveBridgePort(): number {
  return activeBridgePort;
}

/**
 * Scan for a bindable port starting at `start`. Each probe binds+closes a throwaway
 * server on 127.0.0.1. Returns the first free port; throws after `tries` exhausted
 * (a machine with 20 bridges has bigger problems — named failure over silent reuse).
 */
export function findFreeBridgePort(start = 7111, tries = 20): Promise<number> {
  return new Promise((resolve, reject) => {
    const probe = (port: number, remaining: number): void => {
      if (remaining <= 0) {
        reject(new Error(`no free bridge port in [${start}..${port - 1}]`));
        return;
      }
      const server = net.createServer();
      server.once('error', () => {
        try {
          server.close();
        } catch {
          /* ignore */
        }
        probe(port + 1, remaining - 1);
      });
      server.once('listening', () => {
        server.close(() => resolve(port));
      });
      // C423 · THE PROBE-PARITY LAW: probe EXACTLY what the server will bind. Post C665-S0
      // the server binds 127.0.0.1 (the loopback flip — the MCP tool surface must not reach
      // the LAN), so the probe binds 127.0.0.1 too. Two daemons both binding 127.0.0.1:port
      // still collide (EADDRINUSE · no SO_REUSEPORT), so the per-workspace port scan is
      // preserved. (Historic hole this parity closes: probing 127.0.0.1 while another process
      // held the 0.0.0.0 WILDCARD SUCCEEDED under macOS SO_REUSEADDR — the scan claimed 7111
      // while the Lab served it. With both on 127.0.0.1 the collision is detected honestly.)
      server.listen(port, '127.0.0.1');
    };
    probe(start, tries);
  });
}
