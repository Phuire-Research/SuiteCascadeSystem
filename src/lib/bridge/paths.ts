import { homedir } from 'node:os';
import { join } from 'node:path';

// F3 · THE ROOT PIN · quit-race cure. bridgeRoot() historically = process.cwd() +
// Cascades/Bridge, but the electron process's cwd can DIVERGE from the daemon's (a
// stray dev-repo Cascades/Bridge/sessions.json is live evidence of this drift). A
// misrooted registry write lands the F1/F2 closure record in the WRONG sessions.json
// → the daemon watcher never sees it. Two override sources pin the root to the
// daemon's junction regardless of cwd drift:
//   1. setBridgeRootOverride(dir) — the programmatic pin (electron main calls it at
//      startup with the SAME userCwd that seeds startRenderModeWatch: process.cwd()).
//   2. SCS_BRIDGE_ROOT_OVERRIDE env — the established junction convention (dev.ts:297,
//      installSpawn.ts, scpSpawn.model.ts all thread it); electron inherits it when
//      spawned by the daemon. Consumers treat it as the SCS/junction root, so we
//      append Cascades/Bridge here (matching every other consumer's discipline).
// Resolution precedence: explicit programmatic override → env junction → cwd fallback.
// The daemon path is unaffected (daemon cwd already = userCwd → identity).
let bridgeRootOverride: string | undefined;

export function setBridgeRootOverride(dir: string): void {
  bridgeRootOverride = dir;
}

export function bridgeRoot(): string {
  if (bridgeRootOverride !== undefined) {
    return join(bridgeRootOverride, 'Cascades', 'Bridge');
  }
  const envRoot = process.env.SCS_BRIDGE_ROOT_OVERRIDE;
  if (typeof envRoot === 'string' && envRoot.length > 0) {
    return join(envRoot, 'Cascades', 'Bridge');
  }
  return join(process.cwd(), 'Cascades', 'Bridge');
}

export function sessionsRoot(): string {
  return join(bridgeRoot(), 'sessions');
}

export function sessionDir(sessionId: string): string {
  return join(sessionsRoot(), sessionId);
}

export function priorityDir(sessionId: string, priority: 'heads' | 'body' | 'tails'): string {
  return join(sessionDir(sessionId), priority);
}

export function archiveDir(sessionId: string): string {
  return join(sessionDir(sessionId), 'archive');
}

export function metaPath(sessionId: string): string {
  return join(sessionDir(sessionId), 'meta.json');
}

export function spawnSettingsPath(sessionId: string): string {
  return join(sessionDir(sessionId), 'spawn-settings.json');
}

export function registryPath(): string {
  return join(bridgeRoot(), 'sessions.json');
}

// ARST · CADD · Cascades-Archive root for archived real ClaudeCode sessions.
// SIBLING of Cascades/Bridge/ (NOT under it) — `<cwd>/Cascades/Archive/`. The
// dated subdir (YYYY/MM/DD) is composed in sessionArchival.model.ts (RSTM).
// DISAMBIGUATION: distinct from archiveDir(sessionId) above, which is the
// per-session BRIDGE message archive (Cascades/Bridge/sessions/<id>/archive).
export function claudeArchiveRoot(): string {
  return join(process.cwd(), 'Cascades', 'Archive');
}

export function priorityFolderName(priority: 'head' | 'body' | 'tail'): 'heads' | 'body' | 'tails' {
  if (priority === 'head') return 'heads';
  if (priority === 'tail') return 'tails';
  return 'body';
}

export function scpBootLogsDir(): string {
  return join(bridgeRoot(), 'scp-boot-logs');
}

export function scpBootLogPath(scpName: string): string {
  return join(scpBootLogsDir(), scpName, 'boot.log');
}

// D3RM-G · UIMJ · User-Injected-Message-Queue
// Per-session pending chat queue file. Keyed by ULID (not claudeSessionId)
// because the hook subprocess has SCS_BRIDGE_ULID env var only — ULID is the
// stable identifier shared between server Quality writer and CHMH hook reader.
// Diamond G: single-message overwrite semantics; Diamond H extends to append.
// Citation: D3RM-G-FOUNDATION-R6-PURPLE-ORCHESTRATION.md §4 · §7 Risk-7
// Citation: D3RM-G-FOUNDATION-R7-FUCHSIA-CLINICAL.md §4 Queue File Path
export function pendingChatDir(): string {
  return join(homedir(), '.claude', 'pending-chat');
}
export function pendingChatPath(ulid: string): string {
  return join(pendingChatDir(), `${ulid}.txt`);
}
