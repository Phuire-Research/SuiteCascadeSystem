import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { ulid } from 'ulid';
import { sessionDir, priorityDir, archiveDir, metaPath, spawnSettingsPath } from './paths';
import {
  addSession,
  listSessions,
  updateSessionStatus,
  updateSessionTerminalWindowId,
} from './registry';
import { launchClaudeWindow } from './spawn';
import { writeSpawnSettings } from './spawnSettings';
import { getActiveBridgePort } from './activeBridgePort.model';
import { log } from './debugLog';
import type { SessionMeta, SpawnOptions } from './types';

type CreateSessionOpts = {
  spawnOpts?: SpawnOptions;
  launch?: boolean;
  // SS-P1 · MSSPCP: scpName threaded from TUI MenuSpawn (scp sub-menu context)
  // through createSession → writeSpawnSettings → buildSpawnSettings command-string
  // prefix → hook reads SCS_BRIDGE_SCP_NAME from env. Optional · backward-compat.
  scpName?: string;
  // F3 · DEFENSE-IN-DEPTH · suite8Name threaded so the INITIAL writeSpawnSettings the
  // suite8 spawn path fires (before setSessionSuite8Name + spawn) is never bare — the
  // first settings file carries SCS_BRIDGE_SUITE8_NAME. Optional · backward-compat; the
  // non-suite8 callers (TUI MenuSpawn, plain SCP spawn) leave it undefined unchanged.
  suite8Name?: string;
};

type CreateSessionResult = {
  sessionId: string;
  claudeSessionId: string | undefined;
  meta: SessionMeta;
};

export type LaunchInformativeResult = {
  ulid: string;
  claudeSessionId: string | undefined;
  terminalCommand: string;
  pid: number;
  // D3RM-E · WIPS · forwarded from launchClaudeWindow result for downstream
  // consumers (e.g., MCP tool acks, telemetry). Persisted into SessionMeta
  // via updatedMeta.terminalWindowId before this return.
  terminalWindowId?: number;
};

async function createSessionDirs(sessionId: string): Promise<void> {
  await mkdir(sessionDir(sessionId), { recursive: true });
  await mkdir(priorityDir(sessionId, 'heads'), { recursive: true });
  await mkdir(priorityDir(sessionId, 'body'), { recursive: true });
  await mkdir(priorityDir(sessionId, 'tails'), { recursive: true });
  await mkdir(archiveDir(sessionId), { recursive: true });
}

async function writeSessionMeta(sessionId: string, meta: SessionMeta): Promise<void> {
  await writeFile(metaPath(sessionId), JSON.stringify(meta, null, 2), 'utf8');
}

export async function loadSessionMeta(sessionId: string): Promise<SessionMeta> {
  const raw = await readFile(metaPath(sessionId), 'utf8');
  return JSON.parse(raw) as SessionMeta;
}

/**
 * Diamond P Fix P-2a: Scaffold a synthesized session directory for an
 * auto-discovered JSONL.
 *
 * Idempotent: if meta.json already exists for this ULID, no-op and return.
 * Otherwise, create the full session-dir capsule (heads/body/tails/archive),
 * write meta.json via writeSessionMeta (single source of truth), and write
 * spawn-settings.json via writeSpawnSettings (single source of truth) so the
 * SessionStart hook fires correctly on resume.
 *
 * After Diamond P, synthesized sessions are first-class — they have the same
 * on-disk capsule as natively-spawned sessions. This collapses the Diamond O
 * Fix O-1 special-casing in launchInformative (the isSynthesized gate is
 * removed; loadSessionMeta + writeSessionMeta operate unconditionally).
 *
 * Pattern 4 Modulation: writes only to bridge-owned territory under
 * Cascades/Bridge/sessions/<ulid>/. Does NOT read JSONL content — accepts
 * only metadata params (claudeSessionId, mtimeMs, cwd) sourced from
 * filesystem stat in discoverPersistedSessions.
 *
 * Ordering invariant (CD-11 Hook Pair · CD-14 Registry-Truth Quartet):
 * the auto-discovery loop in animatedTui.ts MUST call this BEFORE addSession
 * for the same ULID, so the session never appears in the registry/menu
 * without a scaffolded capsule. This eliminates the ENOENT race window in
 * launchInformative (Green Issues 2+3).
 */
export async function scaffoldDiscoveredSession(
  ulid: string,
  cwd: string,
  claudeSessionId: string,
  mtimeMs: number,
): Promise<void> {
  if (existsSync(metaPath(ulid))) return;

  await createSessionDirs(ulid);
  await writeSpawnSettings(ulid);

  const meta: SessionMeta = {
    id: ulid,
    claudeSessionId,
    status: 'offline',
    spawnedAt: mtimeMs,
    claudeBinary: 'claude',
    cwd,
  };
  await writeSessionMeta(ulid, meta);
  log('manager.scaffold', { ulid, claudeSessionId });
}

export async function createSession(opts: CreateSessionOpts = {}): Promise<CreateSessionResult> {
  const sessionId = ulid();
  const cwd = opts.spawnOpts?.cwd ?? process.cwd();
  const now = Date.now();

  await createSessionDirs(sessionId);

  // TODO Diamond F: archive cleanup should delete spawn-settings.json
  // (or rely on session-dir-wholesale removal if archive does that).
  // F3 · thread suite8Name (4th param) so the initial settings are never bare when the
  // suite8 spawn path supplies it; scpDir stays undefined here (resolved later by the
  // open-session compose) — the settings just carry the name for the SessionStart hook.
  // C422 · the scanned per-workspace port (never the 7111 literal).
  await writeSpawnSettings(sessionId, opts.scpName, getActiveBridgePort(), opts.suite8Name);

  // C390 · THE scpName BIRTH-STAMP. createSession has ALWAYS received scpName
  // (SS-P1) yet wrote it only to spawn-settings.json — never to the meta nor the
  // registry entry. The detached open-session process resolves the Onboard ground
  // via `entry?.scpName ?? meta?.scpName` (cli-handler RFCL) — both were undefined
  // at spawn time, so every anchor spawn read ground:'absent' and seeded BARE while
  // the later SCSER callback write made the entry LOOK correct in post-hoc reads
  // (the C389 contrast: hot-reuse resolved scp-local clean). Stamp scpName at birth
  // on BOTH lanes so the LINCHPIN ordering (createSession → setSessionSuite8Name →
  // spawn) carries the full identity before the relay fires.
  // D3RM-H · suite8Name joins the birth-stamp on BOTH lanes (the C390 lesson,
  // second field): registry-only suite8Name was the FrontierTest1 field wound —
  // the row vanished between engagements and the open-session RFCL had no meta
  // fallback → re-engage composed BARE. meta.json now carries it from birth.
  const meta: SessionMeta = {
    id: sessionId,
    claudeSessionId: undefined,
    status: 'allocated',
    spawnedAt: now,
    claudeBinary: 'claude',
    cwd,
    scpName: opts.scpName,
    suite8Name: opts.suite8Name,
  };

  await writeSessionMeta(sessionId, meta);
  await addSession({
    id: sessionId,
    claudeSessionId: undefined,
    spawnedAt: now,
    status: 'allocated',
    cwd,
    scpName: opts.scpName,
    suite8Name: opts.suite8Name,
    isProcessing: false,  // D3D · SSBF · initial OPEN state; prevents undefined no-badge on first render
  });
  log('manager.create', { ulid: sessionId, scpName: opts.scpName ?? null });
  console.log(
    '[SCS-Bridge SSBF] createSession initial registry write · ulid=',
    sessionId,
    '· isProcessing=false',
  );

  return { sessionId, claudeSessionId: undefined, meta };
}

// D3H Bug B fix · R7 Path C · pre-flight resumable-identity check helper.
// Returns claudeSessionId (string) when session has resumable identity, or undefined
// when session is an orphan-class (never received SessionStart hook · cannot
// be resumed via `claude --resume`). Used by scsBridgeEngageSession quality to
// gate launchInformative('resume') invocations BEFORE the void-async block
// fires — so MCP HTTP can fail synchronously rather than ack-only-then-throw.
//
// Dual-source resolution mirrors launchInformative L149-156: registry entry
// first, meta.json fallback. Pure observation · no side effects.
//
// D3RM-H · KNOWN GAP (dormant · LOW): a recorded claudeSessionId does NOT prove
// the conversation .jsonl exists on disk (Claude Code writes it lazily at the
// first message — the same ghost the cli-handler open-session GHOST-RESUME GUARD
// closes via hasPersistedSession). Only the retired TUI/launchInformative path
// reads this helper without that guard; do NOT restructure the TUI path for it.
export async function hasResumableIdentity(
  sessionId: string,
): Promise<string | undefined> {
  const sessions = await listSessions();
  const entry = sessions.find((s) => s.id === sessionId);
  let claudeSessionId: string | undefined = entry?.claudeSessionId;
  if (!claudeSessionId) {
    try {
      const meta = await loadSessionMeta(sessionId);
      claudeSessionId = meta.claudeSessionId;
    } catch {
      // meta.json absent — treat as no identity
    }
  }
  return claudeSessionId;
}

export async function launchInformative(
  sessionId: string,
  mode: 'new' | 'resume',
  seedPrompt?: string | null,
): Promise<LaunchInformativeResult> {
  // Diamond N Fix N-B: registry-first claudeSessionId resolution.
  // Diamond P Fix P-2c: prior synthesized-session conditional gate REVERTED.
  // Synthesized sessions are now first-class — scaffoldDiscoveredSession
  // writes meta.json + spawn-settings.json BEFORE addSession exposes the
  // entry (animatedTui.ts auto-discovery loop), so loadSessionMeta and
  // writeSessionMeta operate unconditionally without ENOENT risk.
  const sessions = await listSessions();
  const entry = sessions.find((s) => s.id === sessionId);
  const meta = await loadSessionMeta(sessionId);
  let claudeSessionId: string | undefined = entry?.claudeSessionId;
  let cwd: string | undefined = entry?.cwd;
  if (claudeSessionId === undefined) {
    claudeSessionId = meta.claudeSessionId;
  }
  if (cwd === undefined) {
    cwd = meta.cwd;
  }

  if (mode === 'resume' && !claudeSessionId) {
    throw new Error(
      `Session ${sessionId} hasn't started yet (the SessionStart hook hasn't fired — typically takes ~100ms after spawn). Wait a moment and try again.`,
    );
  }
  if (cwd === undefined) {
    throw new Error(`Session ${sessionId} has no cwd in registry or meta.json.`);
  }

  // D3RM-G Bug A · SSRF · refresh spawn-settings on every engage to propagate
  // any new hook entries (e.g., chat-message asyncRewake from Diamond G).
  // Pre-Diamond-G sessions had stale settings missing the 2nd Stop entry.
  await writeSpawnSettings(sessionId, meta.scpName);
  const settingsPath = spawnSettingsPath(sessionId);
  log('manager.launch', { ulid: sessionId, mode });
  const { pid, terminalCommand, terminalWindowId } = await launchClaudeWindow({
    cwd,
    mode,
    settingsPath,
    claudeUuid: mode === 'resume' ? claudeSessionId : undefined,
    sessionId,
    // Diamond B-16 (CD-46 PCSP): seed only applies in 'new' mode; resume reserves
    // positional for next-message semantics.
    seedPrompt: mode === 'new' ? seedPrompt : undefined,
  });

  const launchedAt = Date.now();
  const updatedMeta = await loadSessionMeta(sessionId);
  updatedMeta.terminalCommand = terminalCommand;
  if (!updatedMeta.launchedAt) {
    updatedMeta.launchedAt = launchedAt;
  }
  // D3RM-E · WIPS · persist captured Terminal.app window-id into meta.json.
  // Undefined on non-macOS (HAZARD-D) or when capture failed (Q-strategy
  // fallback in focusTerminalWindow handles absent value gracefully).
  if (terminalWindowId !== undefined) {
    updatedMeta.terminalWindowId = terminalWindowId;
  }
  // Status transition to 'launched' is normally hook-driven; for resume we
  // set it explicitly since the session already has identity.
  if (mode === 'resume') {
    updatedMeta.status = 'launched';
    await updateSessionStatus(sessionId, 'launched');
  }
  await writeSessionMeta(sessionId, updatedMeta);
  // D3RM-E · WIPS · also persist into registry (sessions.json) so the Client
  // sessions list (relayed via actionExchange) carries terminalWindowId for
  // the FOCUS button gate on the Vue side. Sibling to updateSessionLiveIdentity
  // pattern; chainWrite-mutex protected via registry helper.
  if (terminalWindowId !== undefined) {
    await updateSessionTerminalWindowId(sessionId, terminalWindowId);
  }
  log('manager.launched', { ulid: sessionId, pid, mode, terminalWindowId: terminalWindowId ?? null });

  return {
    ulid: sessionId,
    claudeSessionId,
    terminalCommand,
    pid,
    terminalWindowId,
  };
}
