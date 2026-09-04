import { homedir } from 'node:os';
import { join } from 'node:path';
// C950 · THE SHARED ENVIRONMENT, TWO PERSPECTIVES (the user's ruling). State is SHARED between
// a production CLI and a named one — ONE bridge.json · ONE sessions.json · ONE SCPs.json (sparse,
// read-dominated; last-writer-wins accepted BY DESIGN). Only THREE things differ: the CLI's PORT
// (registered by name inside the shared bridge.json — `namedBridges`), WHERE THE CLI'S LOGS land
// (bridgeLogDir() below), and the Electron process (the workspace-key fold gives each its own
// singleton lock + CSSP socket). The C947 state partition is RETIRED here.
import { environmentSegment } from './workspaceSocket.model';

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

// C947 · the WORKSPACE bridge dir for an explicit root — `<root>/Cascades/Bridge[/<Env>]`.
// Every workspace-level sink/junction (bridge.json · sessions.json · debug sinks · gitm.json
// at the workspace · install progress · playtests) composes through THIS, never by hand, so
// the environment partition holds everywhere. Per-SCP `Cascades/Bridge` dirs (scpDir-rooted)
// are SCP-local and stay unpartitioned — one bridge binds one SCP.
export function workspaceBridgeDir(root: string): string {
  return join(root, 'Cascades', 'Bridge');
}

// C950 · THE LOG SEAT — the ONLY path that carries the environment name. A named CLI's own
// logs land in `Cascades/Bridge/<Name>/` so the two perspectives never interleave their
// telemetry; production (no name) writes them at the bridge root exactly as before.
export function bridgeLogDir(): string {
  const segment = environmentSegment();
  return segment ? join(bridgeRoot(), segment) : bridgeRoot();
}

export function bridgeRoot(): string {
  if (bridgeRootOverride !== undefined) {
    return workspaceBridgeDir(bridgeRootOverride);
  }
  const envRoot = process.env.SCS_BRIDGE_ROOT_OVERRIDE;
  if (typeof envRoot === 'string' && envRoot.length > 0) {
    return workspaceBridgeDir(envRoot);
  }
  return workspaceBridgeDir(process.cwd());
}

// C950 · THE SCP REGISTRY IS SHARED — one `Cascades/SCPs.json` for every perspective (the
// user's ruling: no mirroring; an SCP is only ever engaged from ONE location by practice).
// These helpers remain the single composition seat every call site now goes through.
export function scpsJsonBasename(): string {
  return 'SCPs.json';
}

// TOH-12 · THE ANCHORED WORKSPACE ROOT (Port Sovereignty · BREAK 2). The registry seat
// historically resolved against raw process.cwd() while bridgeRoot() four lines above was
// deliberately hardened against cwd drift (F3) — the two CLIs agreed on ONE SCPs.json only
// by coincidence of invocation. This helper gives the registry seat the SAME three-tier
// anchor chain bridgeRoot() already trusts:
//   programmatic setBridgeRootOverride pin → SCS_BRIDGE_ROOT_OVERRIDE env junction → cwd.
// It returns the WORKSPACE root itself (bridgeRoot()'s grandparent by construction), so
// scpsJsonPath keeps composing `<root>/Cascades/SCPs.json` unchanged. With no override set
// and cwd at the workspace (today's live invocation), resolution is byte-identical to the
// prior default — the anchor changes nothing until cwd actually drifts.
export function scsWorkspaceRoot(): string {
  if (bridgeRootOverride !== undefined) {
    return bridgeRootOverride;
  }
  const envRoot = process.env.SCS_BRIDGE_ROOT_OVERRIDE;
  if (typeof envRoot === 'string' && envRoot.length > 0) {
    return envRoot;
  }
  return process.cwd();
}

export function scpsJsonPath(root: string = scsWorkspaceRoot()): string {
  return join(root, 'Cascades', scpsJsonBasename());
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
