/**
 * scsBridgeQueryHoldings · C787/C789 · scp_query_holdings MCP tool
 *
 * THE HOLDINGS QUERY → THE LIVE ROSTER (the Blank-Test-006 cure): the C787 version was a
 * pure file read, and both projections agents leaned on are BOOT-LAGGED BY DESIGN
 * (scpLifecycle = the boot-time writer's honest {} · boundScps.browserUrl lands at
 * window-open) — agents idled minutes against a clearly-live SCP. C789 makes live status a
 * PROBE RESULT, not a projection: every candidate port (the SCPs.json registry
 * boundBridgePort ∪ boundScps.port) gets a REAL socket probe — net.connect on 127.0.0.1,
 * 300ms cap, all in parallel. A listening socket is the strongest liveness Lambda there is
 * (stronger than any dock/registry stamp — those say "registered once"; the socket says
 * "listening NOW"). The dock-registry muxium-state read was considered and set aside: no
 * method in this codebase reads concepts_ state (the never-guess law), and the probe
 * supersedes it.
 *
 * THE ROSTER (the headline · the user spec verbatim): roster: [{ name, live, host, port,
 * url }] — url COMPOSED from the port (http://localhost:<port>/), never dependent on the
 * lag-prone browserUrl. The C787 detail (gitm turnOver/turnOverAlert · the stand-by outcome
 * signal · lifecycle/windowId when present) rides alongside unchanged.
 *
 * Async posture: createAsyncMethodWithConcepts + controller.fire (the orchestrate mirror).
 * Bounded: the probe cap is 300ms — the whole call answers in well under a second.
 * Return path: strategy.data ({holdings}) → scpExtractAndSendResponse → the JSON-RPC result.
 * TQNI: 'Scs Bridge Query Holdings' camelCases to the scsBridge.e key 'scsBridgeQueryHoldings'.
 */

import {
  createQualityCardWithPayload,
  createAsyncMethodWithConcepts,
  muxiumConclude,
  strategySuccess,
  strategyData_muxifyData,
} from 'stratimux';
import type { ScsBridgeState, ScsBridgeQueryHoldingsPayload } from '../scsBridge.types';
import { bridgeMetadataPathPerProject } from '../../../bridgeMetadata';
import { log } from '../../../debugLog';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { connect } from 'node:net';
import { scpsJsonPath } from '../../../paths';

type LooseRecord = Record<string, unknown>;

const PROBE_TIMEOUT_MS = 300;
const PROBE_HOST = '127.0.0.1';

const readJson = (p: string): LooseRecord | null => {
  try {
    const parsed = JSON.parse(readFileSync(p, 'utf8')) as unknown;
    return parsed && typeof parsed === 'object' ? (parsed as LooseRecord) : null;
  } catch {
    return null;
  }
};

// The liveness Lambda: does ANYTHING answer the socket on 127.0.0.1:<port> right now?
const probePort = (port: number): Promise<boolean> =>
  new Promise((resolvePromise) => {
    const socket = connect({ host: PROBE_HOST, port, timeout: PROBE_TIMEOUT_MS });
    const settle = (live: boolean): void => {
      socket.removeAllListeners();
      socket.destroy();
      resolvePromise(live);
    };
    socket.once('connect', () => settle(true));
    socket.once('timeout', () => settle(false));
    socket.once('error', () => settle(false));
  });

type RosterSeed = {
  name: string;
  port: number | null;
  dir: string | null;
  status: string | null;
  lifecycle: string | null;
  windowId: number | null;
  gitm: LooseRecord | null;
};

const collectSeeds = (): { meta: LooseRecord | null; metaPath: string; seeds: RosterSeed[] } => {
  const scsRoot = process.env.SCS_BRIDGE_ROOT_OVERRIDE
    ? process.env.SCS_BRIDGE_ROOT_OVERRIDE
    : process.cwd();
  const metaPath = bridgeMetadataPathPerProject(scsRoot);
  const meta = readJson(metaPath);
  const byName = new Map<string, RosterSeed>();
  const upsert = (name: string): RosterSeed => {
    const existing = byName.get(name);
    if (existing) return existing;
    const fresh: RosterSeed = {
      name,
      port: null,
      dir: null,
      status: null,
      lifecycle: null,
      windowId: null,
      gitm: null,
    };
    byName.set(name, fresh);
    return fresh;
  };
  if (meta) {
    const lifecycle = (meta.scpLifecycle ?? {}) as Record<string, string>;
    const windows = (meta.scpWindows ?? {}) as Record<string, number>;
    for (const [name, entryRaw] of Object.entries((meta.boundScps ?? {}) as LooseRecord)) {
      const entry = (entryRaw ?? {}) as { dir?: string; port?: number };
      const seed = upsert(name);
      seed.dir = entry.dir ?? seed.dir;
      seed.port = typeof entry.port === 'number' ? entry.port : seed.port;
      seed.lifecycle = lifecycle[name] ?? seed.lifecycle;
      seed.windowId = typeof windows[name] === 'number' ? windows[name] : seed.windowId;
    }
    const userCwd = typeof meta.userCwd === 'string' ? meta.userCwd : scsRoot;
    const registry = readJson(scpsJsonPath(userCwd));
    const scps = Array.isArray(registry?.scps) ? (registry?.scps as LooseRecord[]) : [];
    for (const row of scps) {
      const name = typeof row.name === 'string' ? row.name : null;
      if (!name) continue;
      const seed = upsert(name);
      seed.status = typeof row.status === 'string' ? row.status : seed.status;
      if (seed.port === null && typeof row.boundBridgePort === 'number') {
        seed.port = row.boundBridgePort;
      }
      if (seed.dir === null && typeof row.installPath === 'string') {
        seed.dir = row.installPath;
      }
    }
    for (const seed of byName.values()) {
      if (seed.dir) {
        const g = readJson(join(seed.dir, 'Cascades', 'Bridge', 'gitm.json'));
        if (g) {
          seed.gitm = {
            currentBranch: g.currentBranch ?? null,
            stableBranch: g.stableBranch ?? null,
            workingBranch: g.workingBranch ?? null,
            abMode: g.abMode ?? null,
            turnOver: g.turnOver ?? null,
            turnOverAlert: g.turnOverAlert ?? null,
          };
        }
      }
    }
  }
  return { meta, metaPath, seeds: Array.from(byName.values()) };
};

export const scsBridgeQueryHoldings = createQualityCardWithPayload<
  ScsBridgeState,
  ScsBridgeQueryHoldingsPayload
>({
  type: 'Scs Bridge Query Holdings',
  reducer: () => ({}),
  methodCreator: () =>
    createAsyncMethodWithConcepts(({ controller, action }) => {
      void (async (): Promise<void> => {
        const { meta, metaPath, seeds } = collectSeeds();
        const roster = await Promise.all(
          seeds.map(async (seed) => {
            const live = seed.port !== null ? await probePort(seed.port) : false;
            return {
              name: seed.name,
              live,
              host: live ? PROBE_HOST : null,
              port: seed.port,
              url: live && seed.port !== null ? `http://localhost:${seed.port}/` : null,
              status: seed.status,
              lifecycle: seed.lifecycle,
              windowId: seed.windowId,
              dir: seed.dir,
              gitm: seed.gitm,
            };
          }),
        );
        const holdings: LooseRecord = meta
          ? {
              ok: true,
              port: meta.port ?? null,
              endpoint: meta.endpoint ?? null,
              userCwd: meta.userCwd ?? null,
              writtenAt: meta.writtenAt ?? null,
              installState: meta.installState ?? null,
              activeScp: meta.activeScp ?? null,
              installedScps: meta.installedScps ?? [],
              roster,
            }
          : { ok: false, reason: 'no-bridge-json', metaPath, roster };
        log('scsbridge.queryHoldings.served', {
          ok: holdings.ok === true,
          roster: roster.map((r) => `${r.name}:${r.live ? 'live' : 'dark'}`),
        });
        controller.fire(
          action.strategy
            ? strategySuccess(
                action.strategy,
                strategyData_muxifyData(action.strategy, { holdings }),
              )
            : muxiumConclude(),
        );
      })();
    }),
});
