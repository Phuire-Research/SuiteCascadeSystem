import { spawn } from 'node:child_process';
import { buildTerminalCommand } from './osTerminal';
import { isDebugEnabled, log } from './debugLog';

export type LaunchClaudeWindowOpts = {
  cwd: string;
  mode: 'new' | 'resume';
  settingsPath: string | null;
  claudeUuid?: string;
  sessionId: string;
  // Diamond B-16 (CD-46 PCSP): optional first-prompt seed passed as positional
  // CLI argument to claude. Applied only when mode === 'new'.
  seedPrompt?: string | null;
  // RESUME INDUCTION · THE DEAD WIRE (Lane 7 row 13). osTerminal's
  // BuildTerminalCommandInput has ALWAYS carried appendSystemPromptFile and all four
  // transports consume it — but this type had no slot, so every caller of
  // launchClaudeWindow (menu.ts ×3 · attach.ts · commands/bridge/spawn.ts) resumed with
  // NOTHING appended, not even the base. Threading the composed path into
  // launchInformative without THIS field would have shipped an inert cure.
  appendSystemPromptFile?: string | null;
  // C1104 · ruling A · the per-session model threaded to the OS-terminal door. null ⇒ no
  // --model clause is built at all (the user's own /model default applies on resume).
  model?: string | null;
};

export type LaunchClaudeWindowResult = {
  pid: number;
  terminalCommand: string;
  // D2 Electron transition: terminalWindowId capture removed (was osascript
  // Method C query for downstream focusTerminalWindow). Electron-spawned
  // sessions are keyed by sessionUlid, not Terminal.app window-id. Field kept
  // optional + always undefined so legacy callers reading it don't break;
  // they should migrate to spawnElectronSessionForUlid for focus.
  terminalWindowId?: number;
};

// D2 NOTE: launchClaudeWindow is the LEGACY Terminal.app spawn path. Session
// creation now routes through spawnElectronSessionForUlid (Electron CSSP path).
// Preserved as TUI/install/CLI fallback per PMPP for menu.ts, commands/bridge/
// spawn.ts + attach.ts, and installSpawn.ts. These paths remain functional but
// will be migrated to Electron-native spawn in D3+.
export async function launchClaudeWindow(
  opts: LaunchClaudeWindowOpts,
): Promise<LaunchClaudeWindowResult> {
  log('spawn.attempt', { ulid: opts.sessionId, mode: opts.mode });
  try {
    const { cmd, args, humanReadable } = buildTerminalCommand({
      cwd: opts.cwd,
      mode: opts.mode,
      settingsPath: opts.settingsPath,
      claudeUuid: opts.claudeUuid,
      seedPrompt: opts.seedPrompt,
      appendSystemPromptFile: opts.appendSystemPromptFile ?? null,
      model: opts.model ?? null,
    });
    const child = spawn(cmd, args, {
      detached: true,
      stdio: 'ignore',
      env: {
        ...process.env,
        SCS_BRIDGE_ULID: opts.sessionId,
        ...(isDebugEnabled() ? { SCS_BRIDGE_DEBUG: '1' } : {}),
      },
    });
    child.unref();
    const pid = child.pid ?? -1;
    log('spawn.complete', { ulid: opts.sessionId, pid });
    return { pid, terminalCommand: humanReadable };
  } catch (err) {
    log('spawn.error', { ulid: opts.sessionId, message: (err as Error).message });
    throw err;
  }
}
