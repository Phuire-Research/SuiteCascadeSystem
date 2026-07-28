import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';

export type Platform = 'macos' | 'linux' | 'windows' | 'wsl';

export type TerminalChoice = string;

export type BuildTerminalCommandInput = {
  cwd: string;
  mode: 'new' | 'resume';
  settingsPath: string | null;
  claudeUuid?: string;
  appendSystemPromptFile?: string | null;
  // Diamond B-16 (CD-46 PCSP · Positional [prompt] Cascade Seeding Pattern):
  // documented at code.claude.com/docs/en/cli-reference — `claude "query"` is
  // "Start interactive session with initial prompt." Applied only when
  // mode === 'new' (resume mode would inject as next message in existing
  // conversation, which is not the intent). Replaces the entire AppleEvents
  // typeahead path retired this Diamond.
  seedPrompt?: string | null;
};

export type BuildTerminalCommandOutput = {
  cmd: string;
  args: string[];
  platform: Platform;
  terminalChoice: TerminalChoice;
  humanReadable: string;
};

export function escapeForOsascript(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\$/g, '\\$');
}

export function escapeForCmd(s: string): string {
  return '"' + s.replace(/"/g, '""') + '"';
}

// Diamond B-16 (CD-46 PCSP): bash-shell-safe single-quoted literal. Wraps `s`
// in single quotes; replaces internal single-quote with `'\''` (close-quote +
// escape-quote + reopen-quote — bash idiom). Required for seedPrompt as a
// positional CLI argument inside the bash shell command that AppleScript's
// `do script` ultimately invokes. For inputs without single quotes (e.g.,
// `/cascade`, `Strategy S1 verbose: true`), result is a clean `'...'` literal.
export function escapeForBashSingleQuote(s: string): string {
  return "'" + s.replace(/'/g, "'\\''") + "'";
}

function probeExecutable(name: string): boolean {
  const probe = process.platform === 'win32' ? 'where' : 'which';
  try {
    execSync(`${probe} ${name}`, { stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}

function selectLinuxTerminal(): string {
  const chain = ['x-terminal-emulator', 'gnome-terminal', 'konsole', 'xterm'];
  for (const term of chain) {
    if (probeExecutable(term)) return term;
  }
  throw new Error(
    'No supported terminal found on this Linux system. Install xterm, gnome-terminal, konsole, or x-terminal-emulator.',
  );
}

function buildClaudeCommandFragment(
  mode: 'new' | 'resume',
  claudeUuid: string | undefined,
  escapedSettingsPath: string | null,
  inAppleScript: boolean,
  escapedAppendPath?: string | null,
  shellEscapedSeedPrompt?: string | null,
): string {
  // Boundary-quote pattern: when embedded inside AppleScript `do shell script "..."`,
  // wrap path with \\"...\\" so the wrapper persists into the shell layer below.
  // For Linux/Windows shells, wrap with literal "..." since we are not inside
  // AppleScript's outer string.
  // Diamond O Issue 1 (function-level null guard): when settingsPath is null,
  // omit the --settings clause entirely. Synthesized resume sessions never had
  // spawn-settings.json written; --settings would resolve to a missing file.
  const q = inAppleScript ? '\\"' : '"';
  const settingsClause =
    escapedSettingsPath !== null ? ` --settings ${q}${escapedSettingsPath}${q}` : '';
  const appendClause =
    escapedAppendPath != null ? ` --append-system-prompt-file ${q}${escapedAppendPath}${q}` : '';
  // Diamond B-16 CD-46 PCSP: positional [prompt] argument. Only applied when
  // mode === 'new' (resume mode reserves positional for next-message semantics).
  // Caller is responsible for passing pre-bash-escaped string (escapeForBashSingleQuote);
  // this function additionally applies AppleScript escape if needed.
  const seedClause = mode === 'new' && shellEscapedSeedPrompt ? ` ${shellEscapedSeedPrompt}` : '';
  if (mode === 'resume') {
    if (!claudeUuid) {
      throw new Error('claudeUuid required for resume mode');
    }
    return `claude --resume ${claudeUuid}${settingsClause}${appendClause}`;
  }
  return `claude${settingsClause}${appendClause}${seedClause}`;
}

function buildMacOSCommand(input: BuildTerminalCommandInput): BuildTerminalCommandOutput {
  const { cwd, mode, settingsPath, claudeUuid, appendSystemPromptFile, seedPrompt } = input;
  const escapedCwd = escapeForOsascript(cwd);
  // Diamond O Issue 1: preserve null through escape so buildClaudeCommandFragment
  // can omit the --settings clause for synthesized resumes.
  const escapedSettings = settingsPath !== null ? escapeForOsascript(settingsPath) : null;
  // Boundary quotes around paths must themselves be AppleScript-escaped:
  // the outer AppleScript string uses " as delimiter, so any literal " inside
  // must be written as \". The escapeForOsascript call above handles special
  // chars WITHIN each path value; the \\" here escapes the structural quote
  // chars that wrap each at the AppleScript embedding boundary. This discipline
  // (Diamond C Rose fix) extends uniformly to settingsPath.
  const escapedAppend =
    appendSystemPromptFile != null ? escapeForOsascript(appendSystemPromptFile) : null;
  // Diamond B-16 PCSP: 2-layer escape — original order was bash-first then osascript-second.
  //
  // Diamond B-25-UX-fix (Suite 7 Fuchsia clinical diagnosis): SWAPPED ORDER.
  // Root cause: bash's `'\''` apostrophe escape contains a literal backslash; when
  // `escapeForOsascript` ran SECOND, it doubled the backslash to `'\\''`. Bash then
  // parsed the resulting `'\\''` as `\\` (literal backslash) inside the single-quoted
  // string instead of as the bash close-quote/escape-quote/reopen-quote idiom. The
  // single-quoted string never closed; `&&`, `cd`, the rest of the priming, and
  // claude itself were all consumed inside one broken argument. Terminal landed at
  // HOME (`~ %`) because `cd` was inside the broken quote. Fix: apply osascript
  // escaping to raw content FIRST (handles `\`, `"`, `$` at AppleScript boundary),
  // then bash-single-quote wrap (handles `'` correctly · `'\''` idiom never mangled).
  const escapedSeed =
    mode === 'new' && seedPrompt ? escapeForBashSingleQuote(escapeForOsascript(seedPrompt)) : null;
  const claudeFragment = buildClaudeCommandFragment(
    mode,
    claudeUuid,
    escapedSettings,
    true,
    escapedAppend,
    escapedSeed,
  );
  const inner = `cd \\"${escapedCwd}\\" && ${claudeFragment}`;
  const appleScriptExpr = `tell application "Terminal" to do script "${inner}"`;
  return {
    cmd: 'osascript',
    args: ['-e', appleScriptExpr],
    platform: 'macos',
    terminalChoice: 'Terminal',
    humanReadable: `osascript -e '${appleScriptExpr}'`,
  };
}

function buildLinuxCommand(input: BuildTerminalCommandInput): BuildTerminalCommandOutput {
  const { cwd, mode, settingsPath, claudeUuid, appendSystemPromptFile, seedPrompt } = input;
  const terminal = selectLinuxTerminal();
  // Diamond O Issue 1 (branch-level null guard): when settingsPath is null,
  // omit ['--settings', path] from the args array. Spawn would otherwise
  // serialize null as the string "null", corrupting the launched command.
  const settingsArgs: string[] = settingsPath !== null ? ['--settings', settingsPath] : [];
  const appendArgs: string[] =
    appendSystemPromptFile != null ? ['--append-system-prompt-file', appendSystemPromptFile] : [];
  // Diamond B-16 PCSP: positional arg as separate spawn arg (no shell escape needed
  // — Node passes argv directly to the spawned process; only the bash-c branch
  // composes a shell string).
  const seedArgs: string[] = mode === 'new' && seedPrompt ? [seedPrompt] : [];
  let args: string[];
  switch (terminal) {
    case 'gnome-terminal':
      args =
        mode === 'resume'
          ? [
              '--working-directory',
              cwd,
              '--',
              'claude',
              '--resume',
              claudeUuid ?? '',
              ...settingsArgs,
              ...appendArgs,
            ]
          : [
              '--working-directory',
              cwd,
              '--',
              'claude',
              ...settingsArgs,
              ...appendArgs,
              ...seedArgs,
            ];
      break;
    case 'konsole':
      args =
        mode === 'resume'
          ? [
              '--workdir',
              cwd,
              '-e',
              'claude',
              '--resume',
              claudeUuid ?? '',
              ...settingsArgs,
              ...appendArgs,
            ]
          : ['--workdir', cwd, '-e', 'claude', ...settingsArgs, ...appendArgs, ...seedArgs];
      break;
    case 'x-terminal-emulator':
    case 'xterm':
    default: {
      const escapedSeed =
        mode === 'new' && seedPrompt ? escapeForBashSingleQuote(seedPrompt) : null;
      const claudeFragment = buildClaudeCommandFragment(
        mode,
        claudeUuid,
        settingsPath,
        false,
        appendSystemPromptFile,
        escapedSeed,
      );
      args = ['-e', 'bash', '-c', `cd "${cwd}" && ${claudeFragment}`];
      break;
    }
  }
  return {
    cmd: terminal,
    args,
    platform: 'linux',
    terminalChoice: terminal,
    humanReadable: `${terminal} ${args.join(' ')}`,
  };
}

function buildWindowsCommand(input: BuildTerminalCommandInput): BuildTerminalCommandOutput {
  const { cwd, mode, settingsPath, claudeUuid, appendSystemPromptFile, seedPrompt } = input;
  const hasWt = probeExecutable('wt');
  // Diamond O Issue 1 (branch-level null guard): omit ['--settings', path]
  // when settingsPath is null; spawn would otherwise serialize null as "null".
  const settingsArgs: string[] = settingsPath !== null ? ['--settings', settingsPath] : [];
  const appendArgs: string[] =
    appendSystemPromptFile != null ? ['--append-system-prompt-file', appendSystemPromptFile] : [];
  // Diamond B-16 PCSP: positional arg as separate spawn arg.
  const seedArgs: string[] = mode === 'new' && seedPrompt ? [seedPrompt] : [];
  if (hasWt) {
    // wt.exe -d <cwd> shorthand for --startingDirectory; -d requires Windows
    // Terminal 1.5+ (released 2021).
    const args =
      mode === 'resume'
        ? ['-d', cwd, '--', 'claude', '--resume', claudeUuid ?? '', ...settingsArgs, ...appendArgs]
        : ['-d', cwd, '--', 'claude', ...settingsArgs, ...appendArgs, ...seedArgs];
    return {
      cmd: 'wt',
      args,
      platform: 'windows',
      terminalChoice: 'wt',
      humanReadable: `wt ${args.join(' ')}`,
    };
  }
  // cmd /c start "" cmd /k "cd /d <cwd> && claude --settings <path>"
  const escapedSeedCmd = mode === 'new' && seedPrompt ? escapeForCmd(seedPrompt) : null;
  const claudeFragment = buildClaudeCommandFragment(
    mode,
    claudeUuid,
    settingsPath,
    false,
    appendSystemPromptFile,
    escapedSeedCmd,
  );
  const innerCmd = `cd /d ${escapeForCmd(cwd)} && ${claudeFragment}`;
  const args = ['/c', 'start', '""', 'cmd', '/k', innerCmd];
  return {
    cmd: 'cmd',
    args,
    platform: 'windows',
    terminalChoice: 'cmd',
    humanReadable: `cmd ${args.join(' ')}`,
  };
}

function buildWSLCommand(input: BuildTerminalCommandInput): BuildTerminalCommandOutput {
  const { cwd, mode, settingsPath, claudeUuid, appendSystemPromptFile, seedPrompt } = input;
  // Diamond B-16 PCSP: bash single-quote escape for the inner shell command.
  const escapedSeed = mode === 'new' && seedPrompt ? escapeForBashSingleQuote(seedPrompt) : null;
  const claudeFragment = buildClaudeCommandFragment(
    mode,
    claudeUuid,
    settingsPath,
    false,
    appendSystemPromptFile,
    escapedSeed,
  );
  const innerCmd = `cd "${cwd}" && ${claudeFragment}`;
  const args = ['wsl.exe', '--', 'bash', '-c', innerCmd];
  return {
    cmd: 'wt.exe',
    args,
    platform: 'wsl',
    terminalChoice: 'wt.exe',
    humanReadable: `wt.exe ${args.join(' ')}`,
  };
}

export function detectTerminal(): { platform: Platform; terminalChoice: TerminalChoice } {
  const isWSL =
    existsSync('/proc/sys/fs/binfmt_misc/WSLInterop') ||
    process.env['WSL_DISTRO_NAME'] !== undefined;
  if (isWSL) {
    return { platform: 'wsl', terminalChoice: 'wt.exe' };
  }
  if (process.platform === 'darwin') {
    return { platform: 'macos', terminalChoice: 'Terminal' };
  }
  if (process.platform === 'win32') {
    const choice = probeExecutable('wt') ? 'wt' : 'cmd';
    return { platform: 'windows', terminalChoice: choice };
  }
  const linuxChoice = selectLinuxTerminal();
  return { platform: 'linux', terminalChoice: linuxChoice };
}

export function buildTerminalCommand(input: BuildTerminalCommandInput): BuildTerminalCommandOutput {
  const { platform } = detectTerminal();
  switch (platform) {
    case 'macos':
      return buildMacOSCommand(input);
    case 'linux':
      return buildLinuxCommand(input);
    case 'windows':
      return buildWindowsCommand(input);
    case 'wsl':
      return buildWSLCommand(input);
  }
}

// ============================================
// D2 · focusTerminalWindow REMOVED (Electron transition)
// ============================================
//
// D3RM-E ASFP (macOS Terminal.app window-front activation via osascript) was
// the shared focus primitive for the MCP path (scsBridgeFocusSession quality)
// and TUI path (Diamond F hotkey). D2 retires this primitive — focus now
// routes through Electron's `open-session <ulid>` CSSP verb, which under
// Q2=Option A focuses-existing in Electron main. The new primitive is
// focusElectronSessionForUlid in electronSessionSpawn.ts.
//
// buildTerminalCommand (above) is preserved for legacy Terminal.app spawn
// paths still used by menu.ts, commands/bridge/spawn.ts + attach.ts, and
// installSpawn.ts. Those paths will migrate to Electron-native spawn in D3+.
//
// Citation: ETMD Diamond 2 · OTPS · TWPC · Q2 Option A focus-existing semantics
