import { mkdir, readFile, rename, stat, writeFile } from 'node:fs/promises';
// F1 · sync fs for the quit-race closure write — a small JSON write on a user-gesture
// path where the process may be quitting. See recordScpWindowClosureSync below.
import { readFileSync, writeFileSync, renameSync } from 'node:fs';
import { bridgeRoot, metaPath, registryPath } from './paths';
import type { RegistryEntry, SessionMeta, SessionStatus } from './types';
import { log } from './debugLog';
// MD-9 · D-MC-1 · Per-Instance Model Control · validate the spawn-time model against the
// maintained static catalog before recording it onto the entry (spawn NEVER breaks on a
// bad model — the caller warns + falls back to the global default).
import { isAvailableModel, normalizeModelId } from '../../shared/modelCatalog.model';
// RSTM · Dissolution + Archival Diamond · real ClaudeCode session teardown (PFCX).
// ASEC/AEJP (SE) · archiveEntryMetadata co-locates <id>.entry.json beside the .jsonl.
import {
  deleteRealClaudeSession,
  archiveRealClaudeSession,
  archiveEntryMetadata,
} from './sessionArchival.model';
// SAC.3 · the per-page Anchor config resolver. claimAnchorIfUnclaimed gates the auto-stamp
// on the RESOLVED autoAnchor (override ?? menu-default ?? system default true). AFPR-pure.
import { resolveAnchorConfig } from './concepts/scsBridge/model/anchorConfig.model';
// DF1 · THE S8 SESSION BINDING · the durable mirror write. THE DF1 BINDING LAW: S8.json =
// the S8's durable session memory; the anchor seams below are its SOLE writers; UnAnchor
// clears. Best-effort defense-in-depth (never a gate) — the registry isAnchor write is the
// operational truth, this mirrors it to the SCP-LOCAL Extended/<name>/S8.json for resume.
import { writeSuite8BoundSession } from './concepts/scsBridge/model/suite8Binding.model';

/**
 * F1 · SCP-WINDOW-CLOSURE-RECORD · the cross-process Diameter for the no-handle
 * close mode. A closure is a TOP-LEVEL registry field (NOT a session entry): the
 * electron process already chainWrite's sessions.json (D-WC-1 offline leg PASSES
 * live), so recording the window-close here rides the SAME writer the daemon-side
 * scsBridgeJsonWatcher already watches. The daemon consumer dedupes by closedAt +
 * advances a watermark; the array is APPEND + capped (~20) so it self-limits.
 */
type ScpWindowClosure = { scpName: string; closedAt: number };

const SCP_WINDOW_CLOSURE_CAP = 20;

type Registry = {
  sessions: RegistryEntry[];
  // F1 · optional · additive · absent in every prior sessions.json write (the
  // reader `?? []`s it). Never a session-entry mutation — a sibling top-level key.
  scpWindowClosures?: ScpWindowClosure[];
};

/**
 * Diamond M Fix M-2: Async Write-Chain Mutex.
 *
 * All mutating exports serialize through this single in-process Promise chain.
 * Concurrent callers (liveness tick, hook process, auto-discovery) cannot interleave
 * load → modify → write → rename and produce last-writer-wins drops.
 *
 * Green Issue 1 fix: per-link `.catch` swallows rejections so a single failing
 * write does NOT poison the chain for the lifetime of the process. The error
 * is logged but subsequent mutations still execute.
 *
 * Cross-process scope (Green Angle 8): hook subprocesses load their own copy of
 * this module with their own writeChain. Atomic tmp+rename (Diamond I) remains
 * the cross-process serializer; this mutex serializes only within one process.
 */
let writeChain: Promise<void> = Promise.resolve();

function chainWrite(label: string, body: () => Promise<void>): Promise<void> {
  const next = writeChain.then(body).catch((err) => {
    log('registry.write.error', { label, error: String(err) });
  });
  writeChain = next;
  return next;
}

/**
 * F2 · THE QUIT FLUSH · the class cure for the quit-race.
 *
 * Returns the CURRENT tail of the async writeChain. The Electron performQuit site
 * (src/main/index.ts) awaits Promise.race([flushRegistryWrites(), timeout]) BEFORE
 * the process actually dies, so ANY pending async registry write completes its
 * readFile→writeFile→rename before performQuit proceeds. This cures the WHOLE class:
 * the D-WC-1 session-offline leg has the SAME hazard when a session window is the
 * LAST window (window-all-closed → performQuit → process death mid-write). The chain
 * already .catch()es per-link (writes never poison the chain), so awaiting the tail
 * is safe — it resolves once every currently-queued mutation has drained.
 */
export function flushRegistryWrites(): Promise<void> {
  return writeChain;
}

async function ensureBridgeRoot(): Promise<void> {
  await mkdir(bridgeRoot(), { recursive: true });
}

export async function loadRegistry(): Promise<Registry> {
  await ensureBridgeRoot();
  try {
    const raw = await readFile(registryPath(), 'utf8');
    return JSON.parse(raw) as Registry;
  } catch {
    return { sessions: [] };
  }
}

async function saveRegistry(registry: Registry): Promise<void> {
  const path = registryPath();
  const tmp = path + '.tmp';
  await writeFile(tmp, JSON.stringify(registry, null, 2), 'utf8');
  await rename(tmp, path);
}

export async function addSession(entry: RegistryEntry): Promise<void> {
  return chainWrite('addSession', async () => {
    const registry = await loadRegistry();
    // RM-D4 · ADSO hardening · the replace-then-push pattern is a clobber vector
    // for user-assigned label fields: a re-discovery scan that re-adds an existing
    // ULID would drop scsLabel/displayName. PRESERVE both from the prior entry on
    // ULID-match so a user's rename survives any entry reconstruction. The new
    // entry's own scsLabel/displayName (if explicitly set) still wins.
    const prior = registry.sessions.find((s) => s.id === entry.id);
    if (prior) {
      if (entry.scsLabel === undefined && prior.scsLabel !== undefined) {
        entry.scsLabel = prior.scsLabel;
      }
      if (entry.displayName === undefined && prior.displayName !== undefined) {
        entry.displayName = prior.displayName;
      }
    }
    registry.sessions = registry.sessions.filter((s) => s.id !== entry.id);
    registry.sessions.push(entry);
    await saveRegistry(registry);
    log('registry.add', { ulid: entry.id });
  });
}

export async function updateSessionStatus(id: string, status: SessionStatus): Promise<void> {
  return chainWrite('updateSessionStatus', async () => {
    const registry = await loadRegistry();
    const session = registry.sessions.find((s) => s.id === id);
    if (session) {
      session.status = status;
      await saveRegistry(registry);
    }
  });
}

/**
 * SCSER · SAWSR-D2.B Cycle 153 · Self-Session-Binding-Method (SSBM).
 *
 * Atomic update of RegistryEntry.scpName for the caller-session-ULID. Invoked
 * by Bridge SCSER intake Quality (scsBridgeBindCallerSessionToScp · debounced
 * 500ms) after SCP-side SCSER Strategy POSTs callback.
 *
 * Idempotent: setting same scpName is no-op write; setting different scpName
 * overrides (last-write-wins semantic acceptable per debounced upstream).
 *
 * Logging: registry.update.scp-name marks the binding for flow tracing.
 */
export async function updateSessionScpName(
  ulid: string,
  scpName: string,
): Promise<void> {
  return chainWrite('updateSessionScpName', async () => {
    const registry = await loadRegistry();
    const session = registry.sessions.find((s) => s.id === ulid);
    if (!session) {
      log('registry.update.scp-name.skipped', { ulid, scpName, reason: 'session-not-found' });
      return;
    }
    if (session.scpName === scpName) {
      log('registry.update.scp-name.noop', { ulid, scpName, reason: 'already-bound' });
      return;
    }
    session.scpName = scpName;
    await saveRegistry(registry);
    log('registry.update.scp-name', { ulid, scpName });
  });
}

/**
 * D3RM-E · WIPS (Window-Identity-Per-Session) · macOS Terminal.app window-id
 * write helper. Called by manager.launchInformative after launchClaudeWindow
 * captures the front-window id via Method C (post-spawn osascript query).
 *
 * Idempotent — no-op when entry.terminalWindowId === windowId already.
 * No-op on missing ulid (consistent with updateSessionLiveIdentity behavior).
 * chainWrite mutex protects against interleaved writes on multi-spawn flows.
 */
export async function updateSessionTerminalWindowId(
  sessionId: string,
  windowId: number,
): Promise<void> {
  return chainWrite('updateSessionTerminalWindowId', async () => {
    const registry = await loadRegistry();
    const session = registry.sessions.find((s) => s.id === sessionId);
    if (!session) return;
    if (session.terminalWindowId === windowId) return;
    session.terminalWindowId = windowId;
    await saveRegistry(registry);
    log('registry.update.terminal-window-id', { ulid: sessionId, terminalWindowId: windowId });
  });
}

/**
 * D2 Recurse-3 · ULMR · Update-Launch-Meta-Registry · composite atomic write.
 *
 * Called by src/main/session.ts PDFL trigger (Pty-Data-First-as-Launched) on
 * the first pty.data.posted event. SLOM semantic: Session-Launched-On-MessagePort
 * — end-to-end byte flow from PTY → mainPort → renderer is proven, so the
 * session is structurally launched.
 *
 * Atomic merge of four launch-meta fields (status + launchedAt + terminalWindowId
 * + terminalCommand). Each field is merged only when defined on the meta object
 * (undefined values skipped) — matches updateSessionTurnState pattern.
 *
 * DRWM (Direct-Registry-Write-Module) closure: Electron main process imports
 * this helper directly rather than routing through manager.ts (which is the
 * D2-baseline launchInformative caller · bypassed by spawnElectronSessionForUlid).
 *
 * RWID (Repurposed-WindowId) closure: terminalWindowId carries BrowserWindow.id
 * for PMPH-launched sessions (not macOS Terminal.app window-id). Field name
 * retained for backward-compat with focusTerminalWindow primitive.
 *
 * Composes with chainWrite mutex (in-process serialization) + atomic tmp+rename
 * in saveRegistry (cross-process serialization). No-op on missing ulid.
 *
 * Citation: DIAMOND-2-RECURSE3-R1-MAROON-STATUS-TRANSITION-CURATION.md
 * Citation: DIAMOND-2-RECURSE3-R2-RUST-NAMING.md §ULMR
 */
export async function updateSessionLaunchMeta(
  ulid: string,
  meta: {
    status?: SessionStatus;
    launchedAt?: number;
    terminalWindowId?: number;
    terminalCommand?: string;
  },
): Promise<void> {
  return chainWrite('updateSessionLaunchMeta', async () => {
    const registry = await loadRegistry();
    const session = registry.sessions.find((s) => s.id === ulid);
    if (!session) {
      log('registry.update-launch-meta.session-not-found', { ulid });
      return;
    }
    if (meta.status !== undefined) session.status = meta.status;
    if (meta.launchedAt !== undefined) session.launchedAt = meta.launchedAt;
    if (meta.terminalWindowId !== undefined) session.terminalWindowId = meta.terminalWindowId;
    if (meta.terminalCommand !== undefined) session.terminalCommand = meta.terminalCommand;
    await saveRegistry(registry);
    log('registry.update-launch-meta', {
      ulid,
      status: meta.status,
      launchedAt: meta.launchedAt,
      terminalWindowId: meta.terminalWindowId,
    });
  });
}

export async function updateSessionLiveIdentity(
  sessionId: string,
  claudeSessionId: string,
  claudePid?: number,
): Promise<void> {
  return chainWrite('updateSessionLiveIdentity', async () => {
    const registry = await loadRegistry();
    const session = registry.sessions.find((s) => s.id === sessionId);
    if (!session) {
      return;
    }
    session.claudeSessionId = claudeSessionId;
    if (claudePid !== undefined) {
      session.claudePid = claudePid;
    }
    session.status = 'launched';
    await saveRegistry(registry);
    log('registry.update', { ulid: sessionId, claudeSessionId, claudePid });
  });
}

/**
 * F1 · SCP-WINDOW-CLOSURE-RECORD writer · the electron-side no-handle close leg.
 *
 * APPENDS a {scpName, closedAt} record to the top-level scpWindowClosures array
 * (NOT a session entry) and caps the array at SCP_WINDOW_CLOSURE_CAP (keeps the
 * newest, drops the oldest). Idempotence is NOT needed here — the daemon consumer
 * dedupes by closedAt against its watermark, and the cap self-limits the array so
 * it never grows unbounded across a long-running electron process.
 *
 * Rides the SAME chainWrite mutex + atomic tmp+rename (saveRegistry) as every
 * other registry writer, so the sessions.json `change` event the daemon watcher
 * arms on fires exactly once per closure write. This IS the cross-process Diameter
 * that replaces the dead direct-dispatch fast path when getActiveScsBridgeMuxiumHandle
 * is null (the separate-electron-process close mode · scp.window.closed.skip no-handle).
 */
export async function recordScpWindowClosure(scpName: string): Promise<void> {
  return chainWrite('recordScpWindowClosure', async () => {
    const registry = await loadRegistry();
    const closures = registry.scpWindowClosures ?? [];
    closures.push({ scpName, closedAt: Date.now() });
    // Cap: keep the newest SCP_WINDOW_CLOSURE_CAP records (drop from the front).
    registry.scpWindowClosures =
      closures.length > SCP_WINDOW_CLOSURE_CAP
        ? closures.slice(closures.length - SCP_WINDOW_CLOSURE_CAP)
        : closures;
    await saveRegistry(registry);
    log('registry.scp-window-closure', {
      scpName,
      count: registry.scpWindowClosures.length,
    });
  });
}

/**
 * F1 · THE SYNCHRONOUS CLOSURE WRITE · quit-race cure.
 *
 * SYNC sibling of recordScpWindowClosure (above). PROVEN ROOT CAUSE: closing the SCP
 * window fires the close handler synchronously, but the SCP window is usually the LAST
 * window → Electron window-all-closed → performQuit → the process dies BEFORE the ASYNC
 * recordScpWindowClosure (readFile→writeFile→rename) completes → scpWindowClosures NEVER
 * lands on disk. This sync variant uses node:fs SYNC APIs so the append+cap+atomic-write
 * completes on the user-gesture close path itself — no chainWrite tick to lose.
 *
 * Sync is CORRECT here: the process may be quitting; this is a small JSON write on a
 * user-gesture path. Same append + cap (SCP_WINDOW_CLOSURE_CAP · keep newest, drop the
 * front) + atomic tmp+renameSync as the async writer. readFileSync catch → {sessions:[]}
 * (mirrors loadRegistry's absent-file fallback). NOT chained through writeChain (the
 * whole point is to bypass the async chain the quit-race outruns). Resilient — a write
 * failure is swallowed + logged so the close handler never throws.
 *
 * Called from electronWindow.ts signalScpWindowClosed's no-handle leg (replaces the
 * async void recordScpWindowClosure call).
 */
export function recordScpWindowClosureSync(scpName: string): void {
  try {
    const path = registryPath();
    let registry: Registry;
    try {
      registry = JSON.parse(readFileSync(path, 'utf8')) as Registry;
    } catch {
      registry = { sessions: [] };
    }
    const closures = registry.scpWindowClosures ?? [];
    closures.push({ scpName, closedAt: Date.now() });
    registry.scpWindowClosures =
      closures.length > SCP_WINDOW_CLOSURE_CAP
        ? closures.slice(closures.length - SCP_WINDOW_CLOSURE_CAP)
        : closures;
    const tmp = path + '.tmp';
    writeFileSync(tmp, JSON.stringify(registry, null, 2), 'utf8');
    renameSync(tmp, path);
    log('registry.scp-window-closure.sync', {
      scpName,
      count: registry.scpWindowClosures.length,
    });
  } catch (err) {
    log('registry.scp-window-closure.sync.error', { scpName, error: String(err) });
  }
}

export async function removeSession(id: string): Promise<void> {
  return chainWrite('removeSession', async () => {
    const registry = await loadRegistry();
    registry.sessions = registry.sessions.filter((s) => s.id !== id);
    await saveRegistry(registry);
    log('registry.remove', { ulid: id });
  });
}

/**
 * VS · DSST · dissipateSession — anchor-guarded removal (Cadmium Researcher Epoch).
 *
 * The Dissipate-Session-SCS-Tool's registry writer. Sibling to removeSession but
 * adds the S4 H2 anchor guard: research spawns are ephemeral non-anchor instances;
 * the page's durable Setup/Chat Anchor MUST NEVER be dissipated. The load → guard →
 * filter → save runs in ONE chainWrite body so the isAnchor read reflects the current
 * registry state (not a stale snapshot) and no remove window opens between the check
 * and the filter. No-op (no removal) when the entry is missing OR is the page Anchor.
 *
 * DAST · Dissolution-Adds-Session-Teardown (Dissolution + Archival Diamond): the
 * dissipation now ALSO deletes the stored REAL ClaudeCode session
 * (~/.claude/projects/<cwd-dashed>/<claudeSessionId>.jsonl) via deleteRealClaudeSession
 * (RSTM). The Bridge-session dir under Cascades/Bridge/sessions/<ulid>/ remains
 * benign-persistent (separate concern). PFCX: the real-session delete is the
 * INTENTIONAL, user-directed crossing of the bridge-detached law — scoped to the
 * single resolved .jsonl. RSAR: if that file is absent, the delete is a no-op and
 * the entry is STILL removed from sessions.json (resilient · never throws).
 *
 * Callers: the scs_dissipate_session MCP tool (the spawned researcher's final
 * Vermillion step) + the TUI Dissipate hotkey. chainWrite mutex + atomic tmp+rename.
 * H6: the real-session op runs INSIDE the chainWrite body, BEFORE the filter, so
 * the entry's cwd/claudeSessionId read reflects current registry state.
 * Citation: EPOCH-SR-S4-GREEN-SCULPT.md H2 · DISSOLUTION-ARCHIVAL-DIAMOND-WGB.md §2 DAST
 */
export async function dissipateSession(id: string): Promise<void> {
  return chainWrite('dissipateSession', async () => {
    const registry = await loadRegistry();
    const entry = registry.sessions.find((s) => s.id === id);
    // S4 H2 · AGTD · NEVER dissipate the anchor. Guard reads current registry state
    // inside the chainWrite body; missing-or-anchor → no removal.
    if (entry?.isAnchor) {
      log('registry.dissipate.rejected.is-anchor', { ulid: id });
      console.log('[SCS-Bridge DISSIPATE] rejected · is-anchor · ulid=', id);
      return;
    }
    // DAST · Dissolution: delete the real ClaudeCode session too (resilient · RSAR).
    if (entry) {
      const res = await deleteRealClaudeSession(entry.cwd, entry.claudeSessionId);
      log('registry.dissipate.real-session', { ulid: id, deleted: res.deleted, path: res.path });
      console.log('[SCS-Bridge DISSIPATE] real-session · ulid=', id, '· deleted=', res.deleted);
    }
    registry.sessions = registry.sessions.filter((s) => s.id !== id);
    await saveRegistry(registry);
    log('registry.dissipate', { ulid: id });
  });
}

/**
 * ARST · ARchival-Session-Tool · archiveSession — anchor-guarded ARCHIVE + removal.
 *
 * Sibling to dissipateSession. Where Dissolution DELETES the real ClaudeCode
 * session, Archival MOVES it into Cascades/Archive/YYYY/MM/DD/ (CADD) via
 * archiveRealClaudeSession (RSTM · copyFile+unlink · EXDEV-safe), THEN removes the
 * entry from sessions.json. AGTD: never archives the page Anchor. RSAR: if the
 * real session is absent, the move is a no-op and the entry is STILL removed
 * (resilient · never throws). PFCX: the real-session move is the intentional,
 * user-directed crossing — scoped to the single resolved .jsonl.
 *
 * Callers: the scs_archive_session MCP tool + the TUI Archive hotkey. chainWrite
 * mutex + atomic tmp+rename (saveRegistry). H6: the FS move runs INSIDE the
 * chainWrite body, BEFORE the filter (current-state read of cwd/claudeSessionId).
 * Citation: DISSOLUTION-ARCHIVAL-DIAMOND-WGB.md §2 ARST/CADD · §3 H1-H6
 */
export async function archiveSession(id: string): Promise<void> {
  return chainWrite('archiveSession', async () => {
    const registry = await loadRegistry();
    const entry = registry.sessions.find((s) => s.id === id);
    // ASDR Testing-Refinement #4 · anchor-archive ENABLED (for now). The user clears the
    // page Anchor via the SessionManager Archive button instead of manually resetting
    // sessions.json. Archive is the SAFE teardown (recoverable move into Cascades/Archive),
    // so the AGTD anchor-guard is lifted HERE only — log + PROCEED (no early return).
    // dissipateSession (permanent delete) KEEPS its anchor-guard. Restore the early return
    // to re-instate the AGTD invariant for archive.
    if (entry?.isAnchor) {
      log('registry.archive.anchor-permitted', { ulid: id });
      console.log('[SCS-Bridge ARCHIVE] anchor-permitted · ASDR#4 · ulid=', id);
    }
    // ARST · move the real ClaudeCode session → Cascades/Archive/YYYY/MM/DD/ (resilient).
    if (entry) {
      const now = new Date();
      const res = await archiveRealClaudeSession(entry.cwd, entry.claudeSessionId, now);
      // ASEC/AEJP · co-locate the entry metadata as <id>.entry.json in the SAME dated
      // dir (shared `now` → identical destDir). Written even if the .jsonl was absent.
      // Resilient (RSAR · never throws) — the entry is removed regardless.
      const meta = await archiveEntryMetadata(entry, now);
      log('registry.archive.real-session', { ulid: id, archived: res.archived, to: res.to, entryJson: meta.to });
      console.log('[SCS-Bridge ARCHIVE] real-session · ulid=', id, '· archived=', res.archived, '· entryJson=', meta.written);
    }
    registry.sessions = registry.sessions.filter((s) => s.id !== id);
    await saveRegistry(registry);
    log('registry.archive', { ulid: id });
  });
}

export async function markSessionOffline(id: string): Promise<void> {
  return chainWrite('markSessionOffline', async () => {
    const registry = await loadRegistry();
    const session = registry.sessions.find((s) => s.id === id);
    if (!session) {
      return;
    }
    session.status = 'offline';
    session.claudePid = undefined;
    await saveRegistry(registry);
    log('registry.offline', { ulid: id });
  });
}

/**
 * Diamond Q: User-Sourced Identification Diameter (CD-18 candidate).
 *
 * Sets or clears the user-sourced displayName on a registry entry. Empty
 * trimmed input → field deletion (idempotent absence). Non-empty input is
 * truncated at 32 chars at the write site (storage cap). No-ops on missing
 * ulid (idempotent on absent entry — does not throw).
 *
 * Composes with chainWrite mutex (Pattern 4 Modulation preserved — registry
 * IS the single source of truth; JSONL untouched).
 */
export async function setSessionDisplayName(ulid: string, name: string | undefined): Promise<void> {
  return chainWrite('setSessionDisplayName', async () => {
    const registry = await loadRegistry();
    const idx = registry.sessions.findIndex((s) => s.id === ulid);
    if (idx < 0) return;
    if (name === undefined || name.trim() === '') {
      delete registry.sessions[idx].displayName;
    } else {
      registry.sessions[idx].displayName = name.slice(0, 32);
    }
    await saveRegistry(registry);
    log('registry.rename', { ulid, displayName: registry.sessions[idx].displayName ?? null });
  });
}

/**
 * RM-D4 · SCSLA writer · Set-Session-SCS-Label.
 *
 * The SCS-Bridge rename write target. Mirror of setSessionDisplayName but writes
 * scsLabel — the SCS-Bridge-only label field structurally isolated from
 * ClaudeCode's displayName (ADSO remedy / SFSWC fix). Both rename surfaces (Vue
 * Quality + TUI rename-confirm) call THIS, not setSessionDisplayName. 32-char
 * cap; empty/whitespace → delete (idempotent absence). chainWrite mutex; the
 * saveRegistry triggers the sessions.json json-watcher relay → DUAL surfaces
 * (Vue DPCO label + TUI nameOrUuid) re-render. IDTND: ULID is the lookup key,
 * never mutated, never routed.
 */
export async function setSessionScsLabel(ulid: string, name: string | undefined): Promise<void> {
  return chainWrite('setSessionScsLabel', async () => {
    const registry = await loadRegistry();
    const idx = registry.sessions.findIndex((s) => s.id === ulid);
    if (idx < 0) return;
    if (name === undefined || name.trim() === '') {
      delete registry.sessions[idx].scsLabel;
    } else {
      registry.sessions[idx].scsLabel = name.slice(0, 32);
    }
    await saveRegistry(registry);
    log('registry.scsLabel', { ulid, scsLabel: registry.sessions[idx].scsLabel ?? null });
  });
}

/**
 * SS-P1 · SAID Diameter — Session-Affinity-Identifier-Declaration binding.
 *
 * Sets the SCP affinity on a registry entry. Called by sessionStartHook when
 * SCS_BRIDGE_SCP_NAME env var is present (MenuSpawn explicit-override path)
 * or when CWD matches a Cascades/SCPs.json entry (CWD auto-detect fallback).
 *
 * Composes with chainWrite mutex (Pattern 4 Modulation preserved · same
 * structural pattern as setSessionDisplayName). Idempotent on value-match
 * (no write when entry.scpName === scpName already). No-op on missing ulid
 * (consistent with updateSessionStatus + setSessionDisplayName behavior).
 *
 * No truncation (unlike displayName 32-char cap) — scpName is a filesystem
 * path segment used for lookup, truncation would break matching.
 */
export async function setSessionScpAffinity(ulid: string, scpName: string): Promise<void> {
  return chainWrite('setSessionScpAffinity', async () => {
    const registry = await loadRegistry();
    const entry = registry.sessions.find((s) => s.id === ulid);
    if (!entry || entry.scpName === scpName) return;
    entry.scpName = scpName;
    await saveRegistry(registry);
    log('registry.scpAffinity', { ulid, scpName });
  });
}

/**
 * A-3 SAPR · Suite8-Assignment write helper.
 *
 * Sets the suite8Name (NDEP) on a registry entry. Parallel to setSessionScpAffinity
 * — the two assignment lanes are independent; setting suite8Name does NOT affect
 * scpName and vice versa.
 *
 * Idempotent on value-match (no write when entry.suite8Name === suite8Name already).
 * No-op on missing ulid. No truncation — suite8Name is a filesystem path segment
 * used for Instance.md derivation; truncation would break path resolution.
 *
 * Callers: A-4 ODSS spawn invoke (client principle) and any future MCP tool
 * that assigns a Suite 8 to a session.
 */
export async function setSessionSuite8Name(
  ulid: string,
  suite8Name: string | undefined,
): Promise<void> {
  return chainWrite('setSessionSuite8Name', async () => {
    const registry = await loadRegistry();
    const entry = registry.sessions.find((s) => s.id === ulid);
    if (!entry) return;
    if (suite8Name === undefined || suite8Name.trim() === '') {
      delete entry.suite8Name;
    } else if (entry.suite8Name !== suite8Name) {
      entry.suite8Name = suite8Name;
    } else {
      log('registry.suite8Name.noop', { ulid, suite8Name, reason: 'already-set' });
      return;
    }
    await saveRegistry(registry);
    log('registry.suite8Name', { ulid, suite8Name: entry.suite8Name ?? null });
  });
}

/**
 * MD-9 · D-MC-1 · Per-Instance Model Control write helper.
 *
 * Records the spawn-time model ID (a full AVAILABLE_MODELS id) onto the registry
 * entry. Parallel to setSessionSuite8Name — an independent lane; setting model does
 * NOT affect suite8Name/scpName and vice versa. The cli-handler `open-session`
 * resolver reads entry.model → resolved.model → modelClause `resolved.model ??
 * getActiveDefaultModel()`, so resume injects the recorded model OVER the global.
 *
 * Validated against the maintained static catalog (isAvailableModel): an invalid or
 * empty/undefined model is a NO-OP (the entry keeps whatever it had — the session
 * rides the global default). This mirrors the spawn-quality guard (warn + proceed)
 * so a bad model can NEVER break the spawn. Idempotent on value-match. No-op on
 * missing ulid. chainWrite mutex + atomic tmp+rename (saveRegistry).
 *
 * Callers: the spawn qualities (scsBridgeSpawnSuite8Session + scsBridgeSpawnNewScpSession),
 * asWorker + anchor + plain paths alike, AFTER the entry exists.
 */
export async function setSessionModel(ulid: string, model: string | undefined): Promise<void> {
  return chainWrite('setSessionModel', async () => {
    const registry = await loadRegistry();
    const entry = registry.sessions.find((s) => s.id === ulid);
    if (!entry) return;
    // Haiku pin shim: forward the retired 'claude-haiku-4-5' alias to the pinned id
    // BEFORE the isAvailableModel guard (else the drifting alias fails validation).
    const normalized =
      typeof model === 'string' ? normalizeModelId(model) : model;
    // Guard: only a valid catalog id records. Absent/invalid → no-op (global default).
    if (typeof normalized !== 'string' || normalized.trim() === '' || !isAvailableModel(normalized)) {
      log('registry.model.skipped', { ulid, model: model ?? null, reason: 'invalid-or-absent' });
      return;
    }
    if (entry.model === normalized) {
      log('registry.model.noop', { ulid, model: normalized, reason: 'already-set' });
      return;
    }
    entry.model = normalized;
    await saveRegistry(registry);
    log('registry.model', { ulid, model: normalized });
  });
}

/**
 * A-D1 · ARF · setSessionAnchor — reassignment writer (Anchor Pattern).
 *
 * Sets entry.isAnchor=true on `ulid` and clears isAnchor on every OTHER entry
 * sharing the same suite8Name (the ≤1-anchor-per-page invariant). The anchor is
 * the session BOUND to a Suite 8's page; reassigning re-binds the page to a
 * different live instance ("fragment then correct"). Clear-then-set runs in ONE
 * chainWrite body so no two-anchor window opens (S4 hazard). No-op on missing ulid
 * or a session with no suite8Name (no page scope to anchor within).
 *
 * Callers: the scs_set_anchor_session MCP tool (A-D3 reassignment) + PAOLR
 * re-anchor on PPOL re-spawn. chainWrite mutex + atomic tmp+rename (saveRegistry).
 */
export async function setSessionAnchor(ulid: string): Promise<void> {
  return chainWrite('setSessionAnchor', async () => {
    const registry = await loadRegistry();
    const entry = registry.sessions.find((s) => s.id === ulid);
    if (!entry) return;
    const scope = entry.suite8Name;
    if (scope === undefined || scope.trim() === '') {
      log('registry.anchor.noop', { ulid, reason: 'no-suite8Name-scope' });
      return;
    }
    // THE ANCHOR SCOPE LAW · the reassign sweep clears ONLY the same-citizen prior anchor —
    // claiming a designation's anchor on one SCP never unanchors another SCP's page.
    for (const s of registry.sessions) {
      if (
        s.suite8Name === scope &&
        (s.scpName ?? null) === (entry.scpName ?? null) &&
        s.id !== ulid &&
        s.isAnchor
      ) {
        delete s.isAnchor;
      }
    }
    entry.isAnchor = true;
    await saveRegistry(registry);
    // DF1 · THE SEAM WRITE (setSessionAnchor) · mirror the bound ULID to the durable S8.json.
    // scope is the validated non-empty entry.suite8Name — the page whose binding this is.
    writeSuite8BoundSession(scope, ulid, entry.scpName ?? undefined);
    log('registry.anchor.set', { ulid, suite8Name: scope });
  });
}

/**
 * SAC.1 · ARF · unsetSessionAnchor — release writer (Anchor Pattern · un-anchor).
 *
 * Clears entry.isAnchor on `ulid` so the session is no longer the Anchor BOUND to
 * its Suite 8's page. Faithful mirror of setSessionAnchor (A-D1) MINUS the scope-clear
 * loop — un-anchor touches ONLY the one target entry (releasing one anchor cannot
 * create a two-anchor window, so no scope sweep is needed). Reads `isAnchor` the same
 * way the rest of the module does (truthy presence) and `delete`s the key to match
 * setSessionAnchor's clear idiom (delete s.isAnchor). No-op on missing ulid or an
 * entry that is not currently anchored (idempotent release).
 *
 * Callers: the scs_unset_anchor_session MCP tool (SAC.1 release). chainWrite mutex +
 * atomic tmp+rename (saveRegistry). Sibling to setSessionAnchor.
 */
export async function unsetSessionAnchor(ulid: string): Promise<void> {
  return chainWrite('unsetSessionAnchor', async () => {
    const registry = await loadRegistry();
    const entry = registry.sessions.find((s) => s.id === ulid);
    if (!entry) return;
    if (!entry.isAnchor) {
      log('registry.anchor.unset.noop', { ulid, reason: 'not-anchored' });
      return;
    }
    delete entry.isAnchor;
    await saveRegistry(registry);
    // DF1 · THE UNANCHOR CLEAR · UnAnchor ALSO severs the durable binding (the user's law).
    // The entry's suite8Name is the page scope in hand here; when present, clear boundSessionId
    // from that page's S8.json (writeSuite8BoundSession(scope, null)). A scopeless entry has no
    // page binding to clear (no-op — mirrors the seam guards elsewhere in this module).
    const scope = entry.suite8Name;
    if (typeof scope === 'string' && scope.trim() !== '') {
      writeSuite8BoundSession(scope, null, entry.scpName ?? undefined);
    }
    log('registry.anchor.unset', { ulid });
  });
}

/**
 * A-D1 · ARF · claimAnchorIfUnclaimed — spawn-time auto-stamp (Anchor Pattern).
 *
 * Stamps `ulid` as the anchor for its suite8Name ONLY IF no other entry of that
 * suite8Name already holds isAnchor=true. This makes the auto-spawned PPOL session
 * the page's default anchor ("the auto-spawned agent IS the anchor") WITHOUT
 * stealing an existing binding — manual non-anchor instances stay unanchored. An
 * explicit reassignment (setSessionAnchor / PAOLR re-anchor) overrides this.
 * No-op on missing ulid or no suite8Name scope. Serialized after setSessionSuite8Name
 * via the shared chainWrite mutex (the entry has its suite8Name by the time this runs).
 */
export async function claimAnchorIfUnclaimed(ulid: string): Promise<void> {
  return chainWrite('claimAnchorIfUnclaimed', async () => {
    const registry = await loadRegistry();
    const entry = registry.sessions.find((s) => s.id === ulid);
    if (!entry) return;
    const scope = entry.suite8Name;
    if (scope === undefined || scope.trim() === '') return;
    // SAC.3 · per-page auto-anchor gate. The RESOLVED autoAnchor (override ?? menu-creator
    // default ?? system default true) decides whether this page auto-stamps its spawn. A page
    // configured autoAnchor:false SKIPS the claim — the session still spawns, it just is not
    // auto-anchored (a manual Set-as-Anchor still works · setSessionAnchor is unaffected).
    // AFPR: resolveAnchorConfig never throws (missing/malformed config → system default true).
    if (resolveAnchorConfig(scope).autoAnchor === false) {
      log('registry.anchor.claim.skip', { ulid, suite8Name: scope, reason: 'autoAnchor-disabled' });
      return;
    }
    // THE ANCHOR SCOPE LAW · anchor identity = (suite8Name, scpName) — a claim on one
    // citizen never collides with another citizen's anchor of the same designation.
    const alreadyClaimed = registry.sessions.some(
      (s) =>
        s.suite8Name === scope &&
        (s.scpName ?? null) === (entry.scpName ?? null) &&
        s.id !== ulid &&
        s.isAnchor === true,
    );
    if (alreadyClaimed) {
      log('registry.anchor.claim.noop', { ulid, suite8Name: scope, reason: 'already-claimed' });
      return;
    }
    entry.isAnchor = true;
    await saveRegistry(registry);
    // DF1 · THE SEAM WRITE (claimAnchorIfUnclaimed) · the auto-stamp mint seam writes the fresh
    // binding. scope is the validated non-empty entry.suite8Name — so a first-spawn page gains
    // its durable boundSessionId here (the mint leg the spawn fallback's non-resumable branch relies on).
    writeSuite8BoundSession(scope, ulid, entry.scpName ?? undefined);
    log('registry.anchor.claim', { ulid, suite8Name: scope });
  });
}

/**
 * MRQ-RC3 · WAPM · setSessionWorker — research-worker auto-permission marker.
 *
 * Stamps entry.isWorker=true on `ulid`. The inverse-class sibling of
 * claimAnchorIfUnclaimed: where the anchor path marks the page-bound continuous
 * session, this marks an asWorker research spawn (SBST asWorker:true path). The
 * marker is persisted at spawn time (BEFORE spawnElectronSessionForUlid) so the
 * detached `open-session` process — which re-derives ALL spawn state from the
 * registry by ULID and receives ONLY the ULID — can scope the auto-accept
 * permission mode (permissions.defaultMode='acceptEdits') to workers ONLY.
 *
 * Unconditional set (no anchor-style "if-unclaimed" guard): asWorker is decided
 * upstream in the spawn quality; the worker is non-anchor by definition (DSST-
 * ephemeral), so there is no sibling-clear invariant to maintain. Idempotent on
 * value-match. No-op on missing ulid (consistent with setSessionSuite8Name /
 * claimAnchorIfUnclaimed). chainWrite mutex + atomic tmp+rename (saveRegistry).
 *
 * Callers: scsBridgeSpawnSuite8Session quality, asWorker:true branch ONLY.
 */
export async function setSessionWorker(ulid: string): Promise<void> {
  return chainWrite('setSessionWorker', async () => {
    const registry = await loadRegistry();
    const entry = registry.sessions.find((s) => s.id === ulid);
    if (!entry) return;
    if (entry.isWorker === true) {
      log('registry.worker.noop', { ulid, reason: 'already-marked' });
      return;
    }
    entry.isWorker = true;
    await saveRegistry(registry);
    log('registry.worker.set', { ulid });
  });
}

/**
 * D-UP · THE STAND-BY MARKER · setSessionStandBy — primed-session overlay marker.
 *
 * Stamps entry.standBy on `ulid`. The setSessionWorker rail exactly: persisted at
 * spawn time (BEFORE spawnElectronSessionForUlid) so the detached open-session —
 * which re-derives ALL spawn state from the registry by ULID — knows to paint the
 * Stand By overlay on the presenter while the directive delivery is pending
 * (manualMode spawns: Claude Code boots for seconds after the first PTY byte; the
 * overlay is the honest wait). CLEARED (set false) by cli-handler's sendMessage
 * leg when the FKIS delivery lands, so a later re-engage never re-shows a stale
 * overlay. Idempotent on value-match; no-op on missing ulid; chainWrite mutex.
 *
 * Callers: scsBridgeSpawnSuite8Session quality (manualMode:true → set true) ·
 * cli-handler sendMessage delivery (→ set false).
 */
export async function setSessionStandBy(ulid: string, standBy: boolean): Promise<void> {
  return chainWrite('setSessionStandBy', async () => {
    const registry = await loadRegistry();
    const entry = registry.sessions.find((s) => s.id === ulid);
    if (!entry) return;
    if ((entry.standBy === true) === standBy) {
      log('registry.standby.noop', { ulid, standBy, reason: 'already-set' });
      return;
    }
    entry.standBy = standBy;
    await saveRegistry(registry);
    log('registry.standby.set', { ulid, standBy });
  });
}

/**
 * RS.2b · THE COMBINED INITIAL ENTRY · setSessionInitialDirective — the per-run
 * directive carrier. The setSessionStandBy rail exactly: persisted at spawn time
 * (BEFORE spawnElectronSessionForUlid) so the detached open-session — which
 * re-derives ALL spawn state from the registry by ULID — appends the directive
 * to the Onboard seed as ONE initial positional prompt. Retires the post-boot
 * typed delivery for spawn-time directives (the C285 interleave class).
 *
 * Callers: scsBridgeSpawnSuite8Session quality (payload.initialDirective → set).
 */
export async function setSessionInitialDirective(ulid: string, directive: string): Promise<void> {
  return chainWrite('setSessionInitialDirective', async () => {
    const registry = await loadRegistry();
    const entry = registry.sessions.find((s) => s.id === ulid);
    if (!entry) return;
    if (entry.initialDirective === directive) {
      log('registry.initial-directive.noop', { ulid, reason: 'already-set' });
      return;
    }
    entry.initialDirective = directive;
    await saveRegistry(registry);
    log('registry.initial-directive.set', { ulid, directiveChars: directive.length });
  });
}

/**
 * THE ONBOARD OPTION · setSessionSuppressOnboard — the seed-suppression marker.
 * Persisted at spawn time (payload.onboard === false) on the setSessionStandBy rail
 * so the detached open-session skips the Onboard compose for THIS spawn. Default
 * (never called) = the Onboard rides per the anchor predicate, unchanged.
 */
export async function setSessionSuppressOnboard(ulid: string, suppress: boolean): Promise<void> {
  return chainWrite('setSessionSuppressOnboard', async () => {
    const registry = await loadRegistry();
    const entry = registry.sessions.find((s) => s.id === ulid);
    if (!entry) return;
    if ((entry.suppressOnboard === true) === suppress) {
      log('registry.suppress-onboard.noop', { ulid, suppress, reason: 'already-set' });
      return;
    }
    entry.suppressOnboard = suppress;
    await saveRegistry(registry);
    log('registry.suppress-onboard.set', { ulid, suppress });
  });
}

/**
 * D3C · JTCH · Turn-Index-Counter-Registry (TICR) atomic merge.
 *
 * Updates the four finalTurn* / lastActivityAt fields on the session entry
 * matching `ulid`. Each field is merged only when defined on the patch object
 * (undefined values skipped) — preserves prior values across partial updates.
 *
 * Composes with chainWrite mutex (same in-process serialization as all other
 * registry writers). Cross-process safety via atomic tmp+rename in saveRegistry.
 * No-op on missing ulid (graceful — SessionStart fires before Stop hook can).
 *
 * Citation: D3C-CURRYING-FOUNDATION-R2-RUST-PROSPECTING.md §TICR
 * Citation: D3C-CURRYING-FOUNDATION-R4-VIRIDIAN-AUDIT.md §Angle 6
 */
export async function updateSessionTurnState(
  ulid: string,
  patch: {
    lastActivityAt?: number;
    finalTurnIndex?: number;
    finalTurnTimestamp?: string;
    finalTurnSummary?: string;
    isProcessing?: boolean;  // D3D · BLOCKING-2 · TPCT close-transition
  },
): Promise<void> {
  return chainWrite('updateSessionTurnState', async () => {
    const registry = await loadRegistry();
    const entry = registry.sessions.find((s) => s.id === ulid);
    if (!entry) {
      log('registry.update-turn-state.session-not-found', { ulid });
      return;
    }
    if (patch.lastActivityAt !== undefined) entry.lastActivityAt = patch.lastActivityAt;
    if (patch.finalTurnIndex !== undefined) entry.finalTurnIndex = patch.finalTurnIndex;
    if (patch.finalTurnTimestamp !== undefined) entry.finalTurnTimestamp = patch.finalTurnTimestamp;
    if (patch.finalTurnSummary !== undefined) entry.finalTurnSummary = patch.finalTurnSummary;
    if (patch.isProcessing !== undefined) entry.isProcessing = patch.isProcessing;  // D3D · BLOCKING-2
    await saveRegistry(registry);
    log('registry.update-turn-state', {
      ulid,
      finalTurnIndex: patch.finalTurnIndex,
      isProcessing: patch.isProcessing,  // D3D: surfaces BLOCKING-2 fix in logs
    });
  });
}

/**
 * DIAGNOSTIC-REENGAGED R2 · TSPK · Transcript-Snippet-Persistence-Key (batch).
 *
 * Single-Writer batch persistence of transcript fields into sessions.json.
 * The CLI SCS-Bridge is the EXCLUSIVE writer of transcriptSnippet (+ siblings) —
 * mirrors how finalTurnSummary persists via the Stop hook (updateSessionTurnState).
 *
 * ONE chainWrite transaction (NOT N sequential): loadRegistry once → apply every
 * patch (find by ULID · partial undefined-guarded merge) → saveRegistry once.
 * Atomic single visible state transition for the whole batch · one json-watcher
 * `change` event → one broadcast. The `applied > 0` guard skips the write entirely
 * on an all-miss batch (no spurious change event for D6 · the SCP json-watcher).
 *
 * Key = ULID (TSPK). RegistryEntry pre-declares all five transcript fields
 * (types.ts:152-156) — ZERO type additions. No-op (continue) on missing ulid.
 *
 * Composes with chainWrite mutex (in-process serialization) + atomic tmp+rename
 * in saveRegistry (cross-process serialization · races neither the SCP json-watcher
 * reader nor the Electron-main Stop-hook writer). Pattern 4 preserved: registry IS
 * the single source of truth; bridge-owned JSONL is read-only upstream, never mutated.
 *
 * Citation: DIAGNOSTIC-REENGAGED-R2-LASTTURN-MCP-S6-COMPOSITION-VALIDATION.md §A.2 (batch)
 * Citation: DIAGNOSTIC-REENGAGED-R2-LASTTURN-MCP-S3-OCHRE-BLUEPRINT.md §2
 */
export async function updateSessionTranscriptSnippets(
  patches: Array<{
    ulid: string;
    transcriptSnippet?: string;
    transcriptLastUserInput?: string;
    transcriptLastModelOutput?: string;
    transcriptLastReadAt?: number;
    transcriptPath?: string;
  }>,
): Promise<{ requested: number; written: number }> {
  let written = 0;
  await chainWrite('updateSessionTranscriptSnippets', async () => {
    const registry = await loadRegistry();
    let applied = 0;
    for (const p of patches) {
      const entry = registry.sessions.find((s) => s.id === p.ulid);
      if (!entry) {
        log('registry.update-transcript-snippets.session-not-found', { ulid: p.ulid });
        continue;
      }
      if (p.transcriptSnippet !== undefined) entry.transcriptSnippet = p.transcriptSnippet;
      if (p.transcriptLastUserInput !== undefined) entry.transcriptLastUserInput = p.transcriptLastUserInput;
      if (p.transcriptLastModelOutput !== undefined) entry.transcriptLastModelOutput = p.transcriptLastModelOutput;
      if (p.transcriptLastReadAt !== undefined) entry.transcriptLastReadAt = p.transcriptLastReadAt;
      if (p.transcriptPath !== undefined) entry.transcriptPath = p.transcriptPath;
      applied++;
    }
    if (applied > 0) await saveRegistry(registry); // ONCE — skip the write if nothing matched
    written = applied;
    log('registry.update-transcript-snippets', { requested: patches.length, applied });
  });
  return { requested: patches.length, written };
}

/**
 * RM-D3 · ATID/PRMX single-writer. Atomic merge of the RM-D3 tool/permission
 * fields on the entry matching `ulid`. Each field merges only when defined on
 * the patch (undefined skipped) — preserves prior values across partial writes.
 * Mirrors updateSessionTurnState (chainWrite mutex + atomic tmp+rename).
 * No-op on missing ulid (graceful — hook may fire before SessionStart in races).
 */
export async function updateSessionToolState(
  ulid: string,
  patch: {
    activeTool?: string;
    activeToolInput?: string;
    permissionPending?: boolean;
    pendingPermissionTool?: string;
    pendingPermissionInput?: string;
    pendingPermissionRequestId?: string;
    permissionSuggestions?: string;
    // PSTK · the FIFO landing-order queue mirror. The transport writes the WHOLE array
    // on every queue change (push · resolve · drain) alongside the head-mirrored PRMX
    // scalars above. An empty array is a MEANINGFUL write (queue drained) — so unlike
    // the scalar merges this must distinguish `undefined` (skip) from `[]` (clear).
    pendingPermissions?: RegistryEntry['pendingPermissions'];
    askUserQuestionPending?: boolean;
    lastTool?: string;
    lastToolAt?: number;
  },
): Promise<void> {
  return chainWrite('updateSessionToolState', async () => {
    const registry = await loadRegistry();
    const entry = registry.sessions.find((s) => s.id === ulid);
    if (!entry) {
      log('registry.update-tool-state.session-not-found', { ulid });
      return;
    }
    if (patch.activeTool !== undefined) entry.activeTool = patch.activeTool;
    if (patch.activeToolInput !== undefined) entry.activeToolInput = patch.activeToolInput;
    if (patch.permissionPending !== undefined) entry.permissionPending = patch.permissionPending;
    if (patch.pendingPermissionTool !== undefined) entry.pendingPermissionTool = patch.pendingPermissionTool;
    if (patch.pendingPermissionInput !== undefined) entry.pendingPermissionInput = patch.pendingPermissionInput;
    if (patch.pendingPermissionRequestId !== undefined) entry.pendingPermissionRequestId = patch.pendingPermissionRequestId;
    if (patch.permissionSuggestions !== undefined) entry.permissionSuggestions = patch.permissionSuggestions;
    // PSTK · an empty array clears the queue (delete the key to keep the entry small);
    // a non-empty array replaces it. undefined = skip (partial write preserves prior).
    if (patch.pendingPermissions !== undefined) {
      if (patch.pendingPermissions.length === 0) delete entry.pendingPermissions;
      else entry.pendingPermissions = patch.pendingPermissions;
    }
    if (patch.askUserQuestionPending !== undefined) entry.askUserQuestionPending = patch.askUserQuestionPending;
    if (patch.lastTool !== undefined) entry.lastTool = patch.lastTool;
    if (patch.lastToolAt !== undefined) entry.lastToolAt = patch.lastToolAt;
    await saveRegistry(registry);
    log('registry.update-tool-state', { ulid, activeTool: patch.activeTool, permissionPending: patch.permissionPending });
  });
}

/**
 * RM-D3 · ATID clear (PostToolUse + Direction C defensive). DELETES the ATID chip +
 * the FSSF flag on the entry — distinct from updateSessionToolState (which merges) so a
 * clear truly removes the keys (keeps the entry small per the size constraint).
 * No-op on missing ulid.
 *
 * PSTK · QUEUE-AWARE. A PostToolUse for the FIRST resolved tool must NOT wipe a SECOND
 * pending item that landed while the first was held (the queue survives the first tool's
 * completion). So when pendingPermissions is non-empty, RE-MIRROR the head's scalars
 * instead of clearing them — only the ATID/FSSF fields drop. An empty (or absent) queue
 * → the legacy full permission clear (nothing pends).
 */
export async function clearSessionToolState(ulid: string): Promise<void> {
  return chainWrite('clearSessionToolState', async () => {
    const registry = await loadRegistry();
    const entry = registry.sessions.find((s) => s.id === ulid);
    if (!entry) return;
    // ATID chip + FSSF flag always clear (the active/answered tool is done).
    delete entry.activeTool;
    delete entry.activeToolInput;
    delete entry.askUserQuestionPending;
    const queue = entry.pendingPermissions;
    if (queue && queue.length > 0) {
      // PSTK · a queued item survives — re-mirror the head so the pane keeps rendering
      // the next held permission. Do NOT touch pendingPermissions itself here.
      const head = queue[0];
      entry.permissionPending = true;
      entry.pendingPermissionTool = head.tool;
      entry.pendingPermissionInput = head.input;
      entry.pendingPermissionRequestId = head.requestId;
      if (head.suggestions !== undefined) entry.permissionSuggestions = head.suggestions;
      else delete entry.permissionSuggestions;
      await saveRegistry(registry);
      log('registry.clear-tool-state.queue-remirror', { ulid, remaining: queue.length });
      return;
    }
    // Empty/absent queue → nothing pends → full permission clear.
    delete entry.permissionPending;
    delete entry.pendingPermissionTool;
    delete entry.pendingPermissionInput;
    delete entry.pendingPermissionRequestId;
    delete entry.permissionSuggestions;
    delete entry.pendingPermissions;
    await saveRegistry(registry);
    log('registry.clear-tool-state', { ulid });
  });
}

/**
 * D3D · UPSH · TPCT open-transition atomic merge.
 *
 * Updates isProcessing and optionally lastUserSubmitAt on the session entry
 * matching `ulid`. Called by userPromptSubmitHook (isProcessing: true) and
 * may be called standalone if a future pattern needs isolated processing-state
 * writes without touching turn-state fields.
 *
 * Composes with chainWrite mutex (same in-process serialization as all other
 * registry writers). No-op on missing ulid (graceful — session may not yet
 * appear in registry at hook fire time in edge cases).
 *
 * LSSD: [SCS-Bridge TPCT] tag in structured log output.
 *
 * Citation: D3D-ARCHITECTURE-R3B-YELLOW-SERVER-SUBSTRATE.md §S5
 */
export async function updateSessionProcessingState(
  ulid: string,
  state: { isProcessing: boolean; lastUserSubmitAt?: number },
): Promise<void> {
  return chainWrite('updateSessionProcessingState', async () => {
    const registry = await loadRegistry();
    const entry = registry.sessions.find((s) => s.id === ulid);
    if (!entry) {
      log('registry.update-processing-state.session-not-found', { ulid });
      console.log(
        '[SCS-Bridge TPCT] update-processing-state · session-not-found · ulid=',
        ulid,
      );
      return;
    }
    entry.isProcessing = state.isProcessing;
    if (state.lastUserSubmitAt !== undefined) {
      entry.lastUserSubmitAt = state.lastUserSubmitAt;
    }
    await saveRegistry(registry);
    log('registry.update-processing-state', { ulid, isProcessing: state.isProcessing });
    console.log(
      '[SCS-Bridge TPCT] update-processing-state · ulid=',
      ulid,
      '· isProcessing=',
      state.isProcessing,
    );
  });
}

/**
 * SS-Final · SPMEM Diameter — Session-Preferred-SCP-Memory binding.
 *
 * Writes preferredScpName to the session's meta.json for reboot persistence.
 * Invoked by animatedTui ADSC Live-detection closure when SLAC confirms Live
 * state for a TUI-originated boot. sessionStartHook reads this on next launch
 * as the second fallback in SAID resolution (env var > preferredScpName >
 * CWD-match), enabling sticky SCP routing across bridge restarts without
 * requiring re-navigation through the SCP sub-menu.
 *
 * Operates on meta.json (SessionMeta) NOT sessions.json (RegistryEntry) —
 * distinct from setSessionScpAffinity which targets RegistryEntry.scpName.
 * Uses chainWrite mutex (same in-process serialization as setSessionScpAffinity)
 * for write-safety. tmp+rename atomic write provides cross-process safety
 * against concurrent meta.json mutations from sessionStartHook subprocesses.
 *
 * No-op on missing ulid (graceful absence — TUI sessions are ephemeral and
 * may not have a corresponding meta.json file). Idempotent on value-match.
 *
 * Convention: set* prefix per M23 (set-naming convention for write functions).
 */
export async function setSessionPreferredScp(ulid: string, scpName: string): Promise<void> {
  return chainWrite('setSessionPreferredScp', async () => {
    const path = metaPath(ulid);
    let raw: string;
    try {
      raw = await readFile(path, 'utf8');
    } catch {
      return;
    }
    let meta: SessionMeta;
    try {
      meta = JSON.parse(raw) as SessionMeta;
    } catch {
      return;
    }
    if (meta.preferredScpName === scpName) return;
    meta.preferredScpName = scpName;
    const tmp = path + '.tmp';
    await writeFile(tmp, JSON.stringify(meta, null, 2), 'utf8');
    await rename(tmp, path);
    log('registry.preferredScp', { ulid, scpName });
  });
}

export async function listSessions(): Promise<RegistryEntry[]> {
  const registry = await loadRegistry();
  return registry.sessions;
}

/**
 * Diamond 3H Bug A Recurse: Boot-Reset-As-Clean-Slate Pattern.
 *
 * Iterates the entire sessions.json registry on SCS-Bridge startup and sets
 * every entry's status to 'offline'. Atomically written via the established
 * tmp+rename pattern in saveRegistry (matches the cross-process safety contract
 * used by addSession / removeSession / markSessionOffline). Serialized through
 * chainWrite so concurrent boot-time hook subprocesses queue behind it.
 *
 * Invariant: the Bridge starts with a known-clean registry. Only sessions
 * spawned in this process lifecycle and confirmed by SessionStart hook can
 * transition to LAUNCHED. Eliminates "ghost LAUNCHED" entries from prior runs
 * whose processes are long gone.
 *
 * Citation: D3H-BUG-A-RECURSE-R7-FUCHSIA-CLINICAL.md §3 (boot-reset insertion spec)
 */
export async function markAllSessionsOffline(): Promise<void> {
  return chainWrite('markAllSessionsOffline', async () => {
    const registry = await loadRegistry();
    for (const session of registry.sessions) {
      session.status = 'offline';
      // RM-D3 · clear stale tool/permission state on restart. A held res from a
      // prior Bridge run is gone (process-memory Map wiped); permissionPending
      // must not persist (brief §99). The disk shadow is cleared here.
      delete session.activeTool;
      delete session.activeToolInput;
      delete session.permissionPending;
      delete session.pendingPermissionTool;
      delete session.pendingPermissionInput;
      delete session.pendingPermissionRequestId;
      delete session.permissionSuggestions;
      // PSTK · the held-res queue is process-memory (heldPermissions Map) — wiped with
      // the Bridge. The disk shadow of the FIFO queue must clear too, else a stale
      // multi-item strip survives across restart (same reasoning as the PRMX scalars).
      delete session.pendingPermissions;
      delete session.askUserQuestionPending;
      // Live-Lambda refinement · reset turn/working phase. Restarted sessions do
      // not spawn into a working state — isProcessing false prevents the WORKING
      // badge from persisting across bridge restarts (HAZARD-Z: false = OPEN, not
      // undefined = unknown; the ghost 'working' badge is the failure mode).
      session.isProcessing = false;
      // A-D1 · ARF: isAnchor is INTENTIONALLY preserved here — the page↔session
      // binding survives bridge restart (an offline anchor simply fails PAOLR's
      // 'alive' test on next load → PPOL re-spawn + re-anchor). Do NOT delete it.
    }
    await saveRegistry(registry);
    log('registry.boot-reset', { count: registry.sessions.length });
  });
}

/**
 * D-SJP · GHOST-SESSION PRUNE — the auto-verification sessions.json never had.
 *
 * Claude Code's own retention (`cleanupPeriodDays` · default 30 days) deletes old
 * transcript JSONLs out from under the registry, leaving entries whose transcriptPath
 * points at nothing — unresumable ghosts that accumulate unbounded. This sweep runs at
 * boot (after markAllSessionsOffline) and routes every ghost through archiveSession —
 * the RECOVERABLE teardown (the <id>.entry.json ledger lands in Cascades/Archive even
 * when the .jsonl is already gone · RSAR).
 *
 * GHOST predicate (conservative — never guess):
 *  - transcriptPath recorded + missing on disk        → ghost (CC cleanup / manual delete)
 *  - transcriptPath recorded + file exists at 0 bytes → ghost (empty · nothing to resume)
 *  - NO transcriptPath AND NO claudeSessionId         → ghost (never materialized a turn)
 * KEPT always: the page Anchor (isAnchor · the binding is PAOLR's to resolve, not ours),
 * any 'launched' entry (defensive — boot-reset has already grounded these), and entries
 * holding a claudeSessionId without a recorded path (the transcript may live at CC's
 * default location — we never reconstruct paths to judge existence).
 */
export async function pruneGhostSessions(): Promise<{ pruned: string[]; kept: number }> {
  const registry = await loadRegistry();
  const ghosts: string[] = [];
  for (const s of registry.sessions) {
    if (s.isAnchor) continue;
    if (s.status === 'launched') continue;
    if (s.transcriptPath) {
      try {
        const st = await stat(s.transcriptPath);
        if (st.size === 0) ghosts.push(s.id);
      } catch {
        ghosts.push(s.id);
      }
    } else if (!s.claudeSessionId) {
      ghosts.push(s.id);
    }
  }
  for (const id of ghosts) {
    try {
      await archiveSession(id);
    } catch (err) {
      log('registry.ghost-prune.archive-FAIL', { ulid: id, error: String(err) });
    }
  }
  const kept = registry.sessions.length - ghosts.length;
  log('registry.ghost-prune', { pruned: ghosts.length, kept, ids: ghosts });
  return { pruned: ghosts, kept };
}
