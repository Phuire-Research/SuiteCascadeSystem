/**
 * browserTab · Cross-Platform Default-Browser Tab Opener · Cycle 137
 *
 * Mirrors src/lib/bridge/osTerminal.ts four-branch dispatch shape applied to
 * default-browser-tab opening instead of terminal spawning. Zero new npm
 * dependencies; canonical-tool-per-platform; detached fire-and-forget spawn.
 *
 * Platform dispatch (LOCKED · Cadmium PQ §3 + §4):
 *   macOS  → spawn('open', [url], { detached:true, stdio:'ignore' })
 *   Linux  → spawn('xdg-open', [url], ...) with fallback chain:
 *              gio open → kde-open → gnome-open
 *   WSL    → spawn('wslview', [url], ...) with fallback to explorer.exe
 *   Win32  → spawn('cmd', ['/c', 'start', '""', url], ...)
 *
 * Detection mirrors osTerminal.ts:298-313 detectTerminal exactly:
 *   isWSL  = /proc/sys/fs/binfmt_misc/WSLInterop OR $WSL_DISTRO_NAME
 *   macOS  = process.platform === 'darwin'
 *   Win32  = process.platform === 'win32'
 *   linux  = default branch
 *
 * Why custom inline (not sindresorhus/open):
 *   1. osTerminal.ts already implements the identical four-branch shape;
 *      keeping browser opening inline preserves project symmetry.
 *   2. Zero new dependencies (.claude/CLAUDE.md discipline).
 *   3. ESM-only constraint of sindresorhus/open v9+ would require dynamic
 *      import on this CommonJS project (per tsconfig.module === "CommonJS").
 *   4. ~120 lines fully auditable against four primary sources cited in PQ §2.
 *
 * M76 candidate: Cross-Platform-Process-Resolution doctrine — single inline
 * dispatch table per OS-process invocation domain (terminal, browser, ...).
 *
 * Citation: CADMIUM-PLANNEDQUERY-BROWSER-TAB-CROSSPLATFORM.md §3 + §4 + §11
 * Citation: src/lib/bridge/osTerminal.ts:49-57 (probeExecutable precedent)
 * Citation: src/lib/bridge/osTerminal.ts:298-328 (detectTerminal + dispatch precedent)
 * Citation: src/lib/bridge/installSpawn.ts:278-280 (detached spawn discipline)
 * Citation: Stratimuxian Scholar S14 From-Scratch Manifold (cross-platform shape)
 */

import { execSync, spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { log } from './debugLog';

export type BrowserPlatform = 'macos' | 'linux' | 'windows' | 'wsl' | 'electron';

// 'electron' is a logical platform tag used by SCS Bridge when routing URLs to
// the Electron BrowserWindow (OBRS · Diamond 1). detectBrowserOpener() never
// returns 'electron' at runtime — it dispatches on process.platform — so the
// buildBrowserOpenCommand switch below covers only the four OS branches.

export type BrowserOpenerChoice = string;

export type BrowserOpenResult = {
  launched: boolean;
  platform: BrowserPlatform;
  opener: BrowserOpenerChoice;
  pid?: number;
  error?: string;
};

// Internal: PATH probe mirrors osTerminal.ts:49-57 probeExecutable discipline.
function probeBrowserOpenerExecutable(name: string): boolean {
  const probe = process.platform === 'win32' ? 'where' : 'which';
  try {
    execSync(`${probe} ${name}`, { stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}

export function detectBrowserOpener(): {
  platform: BrowserPlatform;
  opener: BrowserOpenerChoice;
} {
  // WSL detection FIRST (identical to osTerminal.ts:299-301): WSL reports
  // process.platform === 'linux' but is a distinct branch with its own opener.
  const isWSL =
    existsSync('/proc/sys/fs/binfmt_misc/WSLInterop') ||
    process.env['WSL_DISTRO_NAME'] !== undefined;
  if (isWSL) {
    const opener = probeBrowserOpenerExecutable('wslview') ? 'wslview' : 'explorer.exe';
    return { platform: 'wsl', opener };
  }
  if (process.platform === 'darwin') {
    return { platform: 'macos', opener: 'open' };
  }
  if (process.platform === 'win32') {
    return { platform: 'windows', opener: 'cmd' };
  }
  // Linux fallback chain (Cadmium PQ §3.2): xdg-open → gio → kde-open → gnome-open.
  if (probeBrowserOpenerExecutable('xdg-open')) return { platform: 'linux', opener: 'xdg-open' };
  if (probeBrowserOpenerExecutable('gio')) return { platform: 'linux', opener: 'gio' };
  if (probeBrowserOpenerExecutable('kde-open')) return { platform: 'linux', opener: 'kde-open' };
  if (probeBrowserOpenerExecutable('gnome-open')) return { platform: 'linux', opener: 'gnome-open' };
  return { platform: 'linux', opener: 'xdg-open' };
}

export type BuildBrowserOpenCommandOutput = {
  cmd: string;
  args: string[];
  platform: BrowserPlatform;
  opener: BrowserOpenerChoice;
};

export function buildBrowserOpenCommand(url: string): BuildBrowserOpenCommandOutput {
  const { platform, opener } = detectBrowserOpener();
  switch (platform) {
    case 'macos':
      // Apple open(1) manpage: `open <url>` resolves via LaunchServices.
      return { cmd: 'open', args: [url], platform, opener };
    case 'linux':
      // gio takes a leading 'open' subcommand; all others take the URL directly.
      if (opener === 'gio') {
        return { cmd: 'gio', args: ['open', url], platform, opener };
      }
      return { cmd: opener, args: [url], platform, opener };
    case 'wsl':
      // wslview <url> OR explorer.exe <url>; opener was selected at detection.
      return { cmd: opener, args: [url], platform, opener };
    case 'windows':
      // cmd /c start "" <url> — the empty "" is the title placeholder so a
      // quoted URL is not consumed as the window title (Microsoft `start` ref).
      return { cmd: 'cmd', args: ['/c', 'start', '""', url], platform, opener: 'cmd' };
    case 'electron':
      // Unreachable at runtime — detectBrowserOpener() never returns 'electron'.
      // 'electron' is a logical SCS Bridge tag used at the OBRS commit boundary.
      throw new Error('buildBrowserOpenCommand: electron platform is not an OS opener');
  }
}

export function openBrowserTab(url: string): Promise<BrowserOpenResult> {
  return new Promise((resolve) => {
    let built: BuildBrowserOpenCommandOutput;
    try {
      built = buildBrowserOpenCommand(url);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      resolve({
        launched: false,
        platform: 'linux',
        opener: 'unknown',
        error: 'build-command-failed:' + message,
      });
      return;
    }
    try {
      log('browsertab.spawn.attempt', {
        url,
        platform: built.platform,
        opener: built.opener,
        cmd: built.cmd,
      });
      // Detached fire-and-forget — mirrors installSpawn.ts:278-280 discipline.
      const child = spawn(built.cmd, built.args, {
        detached: true,
        stdio: 'ignore',
      });
      // Bind 'error' before unref so spawn failures (ENOENT for missing opener)
      // resolve the Promise instead of crashing the parent process.
      let settled = false;
      child.on('error', (err) => {
        if (settled) return;
        settled = true;
        log('browsertab.spawn.error', {
          url,
          platform: built.platform,
          opener: built.opener,
          error: err.message,
        });
        resolve({
          launched: false,
          platform: built.platform,
          opener: built.opener,
          error: 'spawn-failed:' + err.message,
        });
      });
      child.unref();
      // The child has started OR is about to error; we resolve optimistically.
      // The 'error' handler above catches synchronous spawn failures already
      // captured by Node before unref returns. Subsequent async errors are
      // out-of-band (the user simply will not see a tab open).
      setImmediate(() => {
        if (settled) return;
        settled = true;
        log('browsertab.spawn.complete', {
          url,
          platform: built.platform,
          opener: built.opener,
          pid: child.pid,
        });
        resolve({
          launched: true,
          platform: built.platform,
          opener: built.opener,
          pid: child.pid,
        });
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      resolve({
        launched: false,
        platform: built.platform,
        opener: built.opener,
        error: 'spawn-threw:' + message,
      });
    }
  });
}
