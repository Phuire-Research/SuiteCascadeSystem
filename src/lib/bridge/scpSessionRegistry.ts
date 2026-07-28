/**
 * SCP Session Registry · Cascades/SCPs.json sessions[] append + read.
 *
 * Diamond CSRA: calling-session-ID registration is the automatic side-effect
 * of an MCP `launch_scp` tool call. The session entry is appended to the
 * target SCP's `sessions[]` array in `Cascades/SCPs.json` as part of the
 * dispatch path.
 *
 * R4 HIGH-3 resolution: uses an in-process `chainWrite` mutex + atomic
 * tmp+rename write — the EXACT pattern from `registry.ts:25-53`. Two
 * concurrent MCP calls cannot interleave read-mutate-write. Per-link `.catch`
 * keeps the chain alive after a single failed write.
 *
 * Pattern citations:
 *  - CSRA · Calling-Session-Registration-Append (atomic)
 *  - M61  · Project-Totality Authoritative Scope (SCPs.json single source)
 *  - M69  · Canonical Registry Source (read → mutate → write)
 *
 * Scholar citations:
 *  - S13 State Design — registry data lives on filesystem, not in state.
 *  - M60 State-or-Payload Anor — session entry is data-on-disk, not state.
 *
 * Schema is additive: existing SCPs.json entries without `sessions[]`
 * receive an empty array on first write. Dedup-by-sessionId mirrors
 * `registry.ts:59` (filter-before-push).
 */

import { readFile, writeFile, rename } from 'node:fs/promises';
import { resolve } from 'node:path';
import { log } from './debugLog';

export type ScpSessionEntry = {
  sessionId: string;
  registeredVia: 'mcp' | 'tui' | 'manual';
  registeredAt: number;
  mcpClientId?: string;
};

// PSSM · Persisted-SCP-Status-Muxameter · the per-SCP live/pending status the daemon
// watches (parent-dir-hardened watch → scpLifecycle transition → TUI row). 'live' is
// written CLI-side on launch (W3); 'pending' is written server-side just before self-exit
// (W2) AND CLI-side on the boot consistency sweep (W4). The TUI row derives from this.
//
// C653 · THE WORKTREE INSTALL STAGE · 'installing' is the birth-transient a fresh MULTIPLY
// instance carries between its SCPs.json registration and its node_modules being present. A
// git-worktree tree carries only TRACKED files (package.json, NO node_modules) — so the add
// quality registers the instance 'installing' and spawns a non-blocking `npm install`; on
// install exit the status flips to 'pending' (boot-spawnable). The helm reads this transient
// off the roster (scpStatuses) to hold the MULTIPLY staged bar's INSTALL tick + disable the
// instance-row Spawn button until dependencies land. The TUI menu row is FSM-driven
// (scpLifecycle) — this widened union flows through the projection/echo as an opaque string
// (degrades honestly · no exhaustiveness site switches on it).
export type ScpPersistedStatus = 'live' | 'pending' | 'installing';

type ScpRegistryRecord = {
  name: string;
  path?: string;
  port?: number;
  sessions?: ScpSessionEntry[];
  // SWFB · the SCP page window's Electron windowId — bound at open-url time,
  // read by the refocus tool to focus the specific window by id.
  windowId?: number;
  // M2 · WINDOW-RENDERED (D-WR C628 · the RENDERED projection). Epoch-ms of the FIRST successful
  // did-finish-load of the SCP window (electronWindow M1 showRendered moment) — window truly PAINTED,
  // not merely BOUND (windowId lands at construction, BEFORE paint). The helm gates its ONE focus
  // round on THIS (window shown) rather than on windowId presence (window bound). Absent ⇒ bound
  // but not yet rendered (the bar keeps sweeping 'booting').
  windowRenderedAt?: number;
  // PSSM · persisted lifecycle status + its last-write timestamp (W0-W5).
  status?: ScpPersistedStatus;
  statusUpdatedAt?: number;
  [key: string]: unknown;
};

type ScpsJsonShape = {
  scps?: ScpRegistryRecord[];
};

function scpsJsonPath(): string {
  return resolve(process.cwd(), 'Cascades', 'SCPs.json');
}

let writeChain: Promise<void> = Promise.resolve();

function chainWrite(label: string, body: () => Promise<void>): Promise<void> {
  const next = writeChain.then(body).catch((err) => {
    log('scpSessionRegistry.write.error', { label, error: String(err) });
  });
  writeChain = next;
  return next;
}

async function loadScpsJson(): Promise<ScpsJsonShape> {
  try {
    const raw = await readFile(scpsJsonPath(), 'utf8');
    const parsed = JSON.parse(raw) as ScpsJsonShape;
    if (!parsed || typeof parsed !== 'object') return { scps: [] };
    if (!Array.isArray(parsed.scps)) return { scps: [] };
    return parsed;
  } catch {
    return { scps: [] };
  }
}

async function saveScpsJson(payload: ScpsJsonShape): Promise<void> {
  const path = scpsJsonPath();
  const tmp = path + '.tmp';
  await writeFile(tmp, JSON.stringify(payload, null, 2), 'utf8');
  await rename(tmp, path);
}

export async function appendSessionToScp(
  scpName: string,
  sessionId: string,
  registeredVia: 'mcp' | 'tui' | 'manual' = 'mcp',
  mcpClientId?: string,
): Promise<void> {
  return chainWrite('appendSessionToScp', async () => {
    const data = await loadScpsJson();
    const scps = data.scps ?? [];
    const idx = scps.findIndex((entry) => entry?.name === scpName);
    if (idx < 0) {
      log('scpSessionRegistry.append.missing', { scpName, sessionId });
      return;
    }
    const target = scps[idx];
    const existing = Array.isArray(target.sessions) ? target.sessions : [];
    const dedup = existing.filter((s) => s?.sessionId !== sessionId);
    const entry: ScpSessionEntry = {
      sessionId,
      registeredVia,
      registeredAt: Date.now(),
    };
    if (mcpClientId !== undefined) entry.mcpClientId = mcpClientId;
    dedup.push(entry);
    scps[idx] = { ...target, sessions: dedup };
    await saveScpsJson({ ...data, scps });
    log('scpSessionRegistry.append', { scpName, sessionId, registeredVia });
  });
}

export async function listSessionsForScp(
  scpName: string,
): Promise<ScpSessionEntry[]> {
  const data = await loadScpsJson();
  const scps = data.scps ?? [];
  const target = scps.find((entry) => entry?.name === scpName);
  if (!target || !Array.isArray(target.sessions)) return [];
  return target.sessions;
}

export async function lookupScpRecord(
  scpName: string,
): Promise<ScpRegistryRecord | undefined> {
  const data = await loadScpsJson();
  const scps = data.scps ?? [];
  return scps.find((entry) => entry?.name === scpName);
}

// SWFB · upsert the SCP page window's Electron windowId keyed by SCP name.
// UPSERT because the scaffolded template starts as `scps: []` — the open-url
// path is the first writer, so a missing record is CREATED here. Atomic
// chainWrite mirrors appendSessionToScp (no read-mutate-write interleave).
export async function setScpWindowId(
  scpName: string,
  windowId: number,
): Promise<void> {
  return chainWrite('setScpWindowId', async () => {
    const data = await loadScpsJson();
    const scps = data.scps ?? [];
    const idx = scps.findIndex((entry) => entry?.name === scpName);
    if (idx < 0) {
      scps.push({ name: scpName, windowId });
    } else {
      scps[idx] = { ...scps[idx], windowId };
    }
    await saveScpsJson({ ...data, scps });
    log('scpSessionRegistry.setWindowId', { scpName, windowId });
  });
}

// M2 · WINDOW-RENDERED WRITER (D-WR C628). Upsert `windowRenderedAt` (epoch-ms of the SCP window's
// FIRST successful did-finish-load — the M1 show-on-rendered moment). Rides the SAME chainWrite mutex
// + tmp+rename writer as setScpWindowId (no interleave). UPSERT because a name-guarded caller may be
// the first writer of this record. The window host calls this at the SAME fire-once rendered moment it
// shows the window, name-guarded exactly like setScpWindowId's effectiveScpName guard.
export async function setScpWindowRendered(
  scpName: string,
  at: number,
): Promise<void> {
  return chainWrite('setScpWindowRendered', async () => {
    const data = await loadScpsJson();
    const scps = data.scps ?? [];
    const idx = scps.findIndex((entry) => entry?.name === scpName);
    if (idx < 0) {
      scps.push({ name: scpName, windowRenderedAt: at });
    } else {
      scps[idx] = { ...scps[idx], windowRenderedAt: at };
    }
    await saveScpsJson({ ...data, scps });
    log('scpSessionRegistry.setWindowRendered', { scpName, windowRenderedAt: at });
  });
}

// SWFB · read the bound Electron windowId for an SCP, or null when absent.
// The refocus tool prefers this id (BrowserWindow.fromId) over URL matching.
export async function lookupScpWindowId(
  scpName: string,
): Promise<number | null> {
  const data = await loadScpsJson();
  const scps = data.scps ?? [];
  const rec = scps.find((entry) => entry?.name === scpName);
  return rec && typeof rec.windowId === 'number' ? rec.windowId : null;
}

// PSSM · W1 · THE SHARED STATUS WRITER (bridge side).
// Atomic read-modify-write of a single SCP's persisted status, riding the SAME
// chainWrite mutex + tmp+rename writer every other SCPs.json mutation uses (no
// interleave with appendSessionToScp / setScpWindowId). UPSERT: a missing record
// is CREATED (the scaffolded template can start as `scps: []`; the launch path may
// be the first status writer). W3 writes 'live' on launch; W4 sweeps 'pending'.
// The template server's own pre-exit 'pending' write (W2) is the SYNC MIRROR of
// this shape (selfOwnedShutdown.model.ts) — the two shapes MUST stay identical.
export async function setScpStatus(
  scpName: string,
  status: ScpPersistedStatus,
): Promise<void> {
  return chainWrite('setScpStatus', async () => {
    const data = await loadScpsJson();
    const scps = data.scps ?? [];
    const statusUpdatedAt = Date.now();
    const idx = scps.findIndex((entry) => entry?.name === scpName);
    if (idx < 0) {
      scps.push({ name: scpName, status, statusUpdatedAt });
    } else {
      scps[idx] = { ...scps[idx], status, statusUpdatedAt };
    }
    await saveScpsJson({ ...data, scps });
    log('scpSessionRegistry.setStatus', { scpName, status });
  });
}

// PSSM · W4 · THE BOOT CONSISTENCY SWEEP (bridge side).
// The markAllSessionsOffline mirror for SCPs.json: on COMPLETE daemon restart, force
// ALL persisted entries → 'pending' (the consistency point — no SCP is live until the
// launch path re-writes 'live'). One atomic write over the whole array; entries with no
// prior status are stamped 'pending' too. Runs BEFORE the status watcher arms (W0).
export async function markAllScpsPending(): Promise<void> {
  return chainWrite('markAllScpsPending', async () => {
    const data = await loadScpsJson();
    const scps = data.scps ?? [];
    if (scps.length === 0) {
      await saveScpsJson({ ...data, scps });
      log('scpSessionRegistry.markAllPending', { count: 0 });
      return;
    }
    const statusUpdatedAt = Date.now();
    const swept = scps.map((entry) => ({ ...entry, status: 'pending' as const, statusUpdatedAt }));
    await saveScpsJson({ ...data, scps: swept });
    log('scpSessionRegistry.markAllPending', { count: swept.length });
  });
}
