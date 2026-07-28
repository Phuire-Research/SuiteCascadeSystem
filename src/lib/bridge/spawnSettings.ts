import { mkdir, writeFile } from 'node:fs/promises';
import * as path from 'node:path';
import { sessionDir, spawnSettingsPath } from './paths';
import { isDebugEnabled, log } from './debugLog';
import { tdia } from './tdia';

/**
 * ECNR · Electron-Context-Node-Resolver · Pattern P3 bin/scs.js shebang routing
 * (S6 Amethyst Stage 2 Orchestration §A.3 · S7 Rose Clinical Note §C cure name)
 *
 * Disease (BNPC · Binary-Name-Process-Capture-at-write-time): when this module
 * is invoked from Electron-main context (post-D2 ETMD topology) it captures
 * process.execPath = Electron binary + process.argv[1] = projectRoot — both
 * INVALID for hook subprocesses claude must invoke as Node.
 *
 * Cure: detect Electron context, route nodeBin to <projectRoot>/bin/scs.js
 * (shebang `#!/usr/bin/env node` resolves Node at exec time via PATH). bin/scs.js
 * already routes `__hook` through fallbackToLegacyCli → require('dist/cli.cjs') →
 * registered hookCommand at src/cli.ts:37. The downstream routing is ALREADY
 * CORRECT; only the spawn-settings command-string author was misrouted.
 *
 * Back-compat: when NOT in Electron context (MVP-RC Node-CLI path · bridge
 * daemon · TUI install flow), preserves original process.execPath +
 * process.argv[1] capture verbatim. Tests in spawnSettings.test.ts that mock
 * /mock/node + /mock/dist/cli.cjs continue to pass via the Node branch.
 *
 * projectRoot resolution: inside Electron main, process.argv[1] = projectRoot
 * per Lambda evidence at S1 Lens 2 + S4 Stage 2 §A1.2 (verified against
 * sessions/01KSP99H0H6PKE0HQN6Y62VRCZ/spawn-settings.json). Falls back to
 * process.cwd() if argv[1] unavailable.
 */
function resolveHookCommandBinary(): { nodeBin: string; cliPath: string } {
  const isElectronCtx = !!process.versions.electron;
  if (isElectronCtx) {
    const projectRoot = process.argv[1] || process.cwd();
    const scsBin = path.resolve(projectRoot, 'bin', 'scs.js');
    // bin/scs.js shebang resolves node via /usr/bin/env at exec time.
    // cliPath = '' because bin/scs.js takes argv directly — no second path arg.
    return { nodeBin: scsBin, cliPath: '' };
  }
  return { nodeBin: process.execPath, cliPath: process.argv[1] };
}

// RM-D3 · ATID/PRMX · HTTP hook variant for the permission means.
// type:'http' registers a Claude Code HTTP hook (PROVEN canary contract).
// Claude Code POSTs the hook payload to `url` and (for blocking events)
// awaits the JSON response. `timeout` in seconds (Claude Code default 600).
type HttpHookEntry = { type: 'http'; url: string; timeout?: number };
// asyncRewake: true on the chat-message hook · empty/false on JTCH stop.
// When true + hook exits 2: Claude Code wakes the model with stdout.
type CommandHookEntry = { type: 'command'; command: string; asyncRewake?: boolean };

export type SpawnSettings = {
  hooks: {
    SessionStart: Array<{ hooks: Array<CommandHookEntry> }>;
    SessionEnd: Array<{ hooks: Array<CommandHookEntry> }>;
    // D3C · JTCH · Stop hook fires once per assistant turn completion (TPSR)
    // D3RM-G · CHMH · second Stop entry with asyncRewake: true · reads UIMJ
    // queue file, injects via stdout + exit(2) → claude wakes with stdout as
    // next user context. Citation: D3RM-G-FOUNDATION-R7-FUCHSIA-CLINICAL.md §4
    Stop?: Array<{ matcher?: string; hooks: Array<CommandHookEntry> }>;
    // D3D · TPHP · UPSH general session variant
    // Completes TPHP (Turn-Phase-Hook-Pair): UPSH (open) + JTCH (close) = full turn observation
    UserPromptSubmit?: Array<{ matcher?: string; hooks: Array<CommandHookEntry> }>;
    // RM-D3 · ATID substrate (non-blocking) + PRMX overlay (blocking).
    // PreToolUse/PostToolUse respond {} instantly; PermissionRequest holds.
    PreToolUse?: Array<{ matcher?: string; hooks: Array<HttpHookEntry> }>;
    PostToolUse?: Array<{ matcher?: string; hooks: Array<HttpHookEntry> }>;
    PermissionRequest?: Array<{ matcher?: string; hooks: Array<HttpHookEntry> }>;
  };
  // Diamond B-8 Fix 2 (PTS): install-scope targeted allow-rules.
  // Optional — undefined means no permissions slot (session-mode spawns unaffected).
  // JSON key path confirmed via Conductor decision (resolves Green USER-CONFER gate);
  // failure mode is silent-ignore not breakage if Claude Code uses a different key.
  permissions?: {
    // Diamond B-8 Fix 2 (PTS): install-scope targeted allow-rules. The install path
    // (buildInstallSpawnSettings) is the only emitter of this block.
    // MRQ-RC3 · WAPM: the worker auto-permission mode is NO LONGER carried here. It was
    // migrated to the ` --permission-mode auto` CLI flag (cli-handler.buildBlcwSpawnOpts)
    // because CC v2.1.142+ may silently ignore `defaultMode:"auto"` from a `--settings`
    // file (Part B/C · MRQ-AUTOMODE-CLASSIFIER-VERMILLION.md). buildSpawnSettings no
    // longer emits a permissions block — worker settings files are mode-agnostic.
    allow?: string[];
  };
};

/**
 * Shell-quote a value for safe inclusion in the hook command string.
 * SS-P1 CHCS guard: scpName may contain user-provided characters (spaces,
 * dashes, etc.). Single-quote wrap with backslash-escape for embedded
 * single quotes. ULID values pass through quoting as no-op (alphanumeric).
 */
function shellQuote(value: string): string {
  return `'${value.replace(/'/g, "'\\''")}'`;
}

// RM-D3 · bridgePort threaded from the spawn context (manager reads bridge.json
// port; falls back to the canonical 7111 when unavailable — matches the
// scpExpressTransport listen port at L304). V6 (Green+Purple): the =7111 default
// is sufficient for all current deployments; call-site port-threading is an
// optional polish step deferred unless a non-7111 deployment exists.
export function buildSpawnSettings(
  sessionId: string,
  scpName?: string,
  bridgePort = 7111,
  suite8Name?: string,
  // MD-1 · D-SB-3 · the SCP install root (Sovereignty Boundary). When present, the
  // session's allow-list is EXTENDED with a targeted Write/Edit rule scoped to that
  // SCP's Cascades tree — so a Suite 8 session operating inside its SCP can maintain its
  // own local Cascades documents. Additive-by-presence: absent ⇒ NO permissions block
  // (the mode-agnostic session default · unchanged behavior).
  scpDir?: string,
): SpawnSettings {
  // W2 · ECNR · Electron-Context-Node-Resolver (replaces BNPC at lines 63-64)
  // See top-of-file ECNR doc. In Electron context: nodeBin = bin/scs.js
  // (shebang resolves node); cliPath = '' (bin/scs.js takes argv directly).
  // In Node context: preserves MVP-RC verbatim — process.execPath + argv[1].
  const { nodeBin, cliPath } = resolveHookCommandBinary();
  // DHTL · Dev-Hook-Tsx-Loader · Cycle 163 R3
  // When cli is invoked as source .ts (dev:self mode), the hook subprocess
  // would run raw Node which fails on extension-less ESM imports
  // (cli.ts:4 import './commands/hello' → ERR_MODULE_NOT_FOUND).
  // tsx provides a Node ESM loader hook that resolves TypeScript paths.
  // Production bundled cli.cjs uses CommonJS (no ESM resolution) → no loader needed.
  // ECNR Electron branch: cliPath = '' → endsWith('.ts') false → tsxLoader = ''
  // (bin/scs.js is .js; never needs tsx loader).
  const tsxLoader = cliPath.endsWith('.ts') ? '--import tsx ' : '';
  // ECNR cliPath assembly: in Electron branch cliPath = ''. Build the binary+path
  // segment with a single trailing space so the downstream argv ' __hook ...' is
  // clean (no double-space). In Node branch this evaluates to the legacy form.
  const binAndCli = cliPath ? `${nodeBin} ${tsxLoader}${cliPath}` : nodeBin;
  // Diamond N Fix N-C: env-prefix injection for SCS_BRIDGE_DEBUG.
  // Claude Code sanitizes ambient env before running hooks, so the hook
  // subprocess never inherits SCS_BRIDGE_DEBUG from the bridge process.
  // Inject it directly into the command string when debug mode is active —
  // mirrors how SCS_BRIDGE_ULID is propagated. Hooks then read
  // process.env.SCS_BRIDGE_DEBUG === '1' as before.
  const debugPrefix = isDebugEnabled() ? 'SCS_BRIDGE_DEBUG=1 ' : '';
  // SS-P1 · CHCS pattern: SCS_BRIDGE_SCP_NAME injected via the same
  // command-string prefix channel as SCS_BRIDGE_ULID (Claude Code sanitizes
  // ambient env). Absent when scpName is undefined → SWAF backward-compat.
  const scpPrefix = scpName ? `SCS_BRIDGE_SCP_NAME=${shellQuote(scpName)} ` : '';
  // A-3 SAPR · suite8Name env-prefix parallel to scpPrefix. Hook subprocesses
  // read SCS_BRIDGE_SUITE8_NAME for future A-4 ODSS registration confirmation.
  const suite8Prefix = suite8Name ? `SCS_BRIDGE_SUITE8_NAME=${shellQuote(suite8Name)} ` : '';
  const commandStart = `${debugPrefix}${scpPrefix}${suite8Prefix}SCS_BRIDGE_ULID=${sessionId} ${binAndCli} __hook session-start`;
  const commandEnd = `${debugPrefix}SCS_BRIDGE_ULID=${sessionId} ${binAndCli} __hook session-end`;
  // D3C · JTCH · Stop hook · fires once per assistant turn completion
  // Citation: D3C-CURRYING-FOUNDATION-R2-RUST-PROSPECTING.md §JTCH §TPSR
  const commandStop = `${debugPrefix}SCS_BRIDGE_ULID=${sessionId} ${binAndCli} __hook stop`;
  // D3RM-G · CHMH · Chat-Message-Hook · second Stop entry with asyncRewake: true
  // Reads ~/.claude/pending-chat/{ulid}.txt (UIMJ queue) at every turn-end.
  // If non-empty: process.stdout.write(message) + process.exit(2) → Claude Code
  // wakes the model with stdout as next user context. If empty: process.exit(0)
  // (no-op, no rewake). Citation: D3RM-G-FOUNDATION-R7-FUCHSIA-CLINICAL.md §4
  const commandChatMessage = `${debugPrefix}SCS_BRIDGE_ULID=${sessionId} ${binAndCli} __hook chat-message`;
  // D3D · UPSH · UserPromptSubmit-Hook-General
  // Completes TPHP: UPSH (open boundary) + JTCH (close boundary) = full turn observation
  // CDH discipline: 'user-prompt-submit' subcommand is the context discriminator —
  // structural separation from 'user-prompt-submit-install' enforced at spawn time
  // (buildInstallSpawnSettings uses different command subcommand)
  const commandUserPromptSubmit = `${debugPrefix}SCS_BRIDGE_ULID=${sessionId} ${binAndCli} __hook user-prompt-submit`;
  // RM-D3 · HTTP hook base — the CLI Bridge daemon owns this port (scpExpressTransport
  // listens on 7111; bridgeJson.endpoint uses the same 127.0.0.1 host).
  const hookBase = `http://127.0.0.1:${bridgePort}`;
  // W1.1 · D2 Recurse-5 BNPC diagnostic · build-end log
  // Captures the binary-name-process-capture-at-write-time values + context discriminator.
  // Pre-fix expected: isElectronCtx=true, nodeBin contains 'Electron', cliPath = projectRoot.
  // Post-fix expected: isElectronCtx=true with ECNR routing nodeBin to bin/scs.js.
  tdia('spawnSettings.build', {
    fn: 'buildSpawnSettings',
    ulid: sessionId,
    nodeBin,
    cliPath,
    tsxLoader,
    isElectronCtx: !!process.versions.electron,
    electronVersion: process.versions.electron ?? null,
    nodeVersion: process.versions.node,
    commandStartPreview: commandStart.slice(0, 200),
  });
  return {
    hooks: {
      SessionStart: [
        {
          hooks: [{ type: 'command', command: commandStart }],
        },
      ],
      SessionEnd: [
        {
          hooks: [{ type: 'command', command: commandEnd }],
        },
      ],
      Stop: [
        {
          matcher: '*',
          hooks: [{ type: 'command', command: commandStop }],
        },
        // D3RM-G · CHMH · second Stop entry with asyncRewake: true
        // Reads UIMJ queue at every turn-end. Non-empty → stdout + exit(2) →
        // Claude Code wakes model with stdout as next user context. Empty →
        // exit(0), no rewake fires. Co-exists with JTCH (commandStop) above —
        // both Stop entries fire in array order on every turn-end.
        {
          matcher: '*',
          hooks: [
            {
              type: 'command',
              command: commandChatMessage,
              asyncRewake: true,
            },
          ],
        },
      ],
      UserPromptSubmit: [
        {
          matcher: '*',
          hooks: [{ type: 'command', command: commandUserPromptSubmit }],
        },
      ],
      // RM-D3 · ATID prime (PreTool) + clear (PostTool) · matcher '*' = every tool.
      // 10s timeout — they respond instantly; a down Bridge does not freeze a tool.
      PreToolUse: [
        { matcher: '*', hooks: [{ type: 'http', url: `${hookBase}/hooks/pre-tool-use`, timeout: 10 }] },
      ],
      PostToolUse: [
        { matcher: '*', hooks: [{ type: 'http', url: `${hookBase}/hooks/post-tool-use`, timeout: 10 }] },
      ],
      // RM-D3 · PRMX · PermissionRequest holds for the genuine user-decision wait.
      // 600s = Claude Code default; the Bridge default-denies + clears at 595s.
      PermissionRequest: [
        { matcher: '*', hooks: [{ type: 'http', url: `${hookBase}/hooks/permission-request`, timeout: 600 }] },
      ],
    },
    // MRQ-RC3 · WAPM · this builder emits NO worker auto-permission mode. That moved to
    // the ` --permission-mode auto` CLI flag (cli-handler.buildBlcwSpawnOpts) — always
    // honored, unlike a settings-file `defaultMode`. Session-mode spawn settings stay
    // mode-agnostic.
    //
    // MD-1 · D-SB-3 · the Sovereignty allow-list. When scpDir is present, extend the
    // session with a targeted Write/Edit rule scoped to the SCP's Cascades tree (so a
    // Suite 8 session can maintain its own SCP-LOCAL Cascades documents). Targeted paths
    // ONLY (NOT bypassPermissions) — the user's other work is unaffected. Absent scpDir ⇒
    // the field is OMITTED entirely (undefined permissions · the mode-agnostic default).
    ...(scpDir
      ? {
          permissions: {
            allow: [
              // C590 · THE EDIT-RULE LAW (Claude Code's own session warning): Write(path)
              // rules are NOT matched by the file permission checks — Edit(path) rules
              // cover ALL file-editing tools (Write included). One rule, total coverage.
              `Edit(${scpDir}/Cascades/**)`,
            ],
          },
        }
      : {}),
  };
}

export function buildInstallSpawnSettings(opts: {
  sessionId: string;
  tempDir: string;
}): SpawnSettings {
  const { sessionId, tempDir } = opts;
  // W2 · ECNR · symmetric application per S4 Stage 2 §A1.1 + §A7.4
  // Today this function runs in bridge daemon Node context where the legacy
  // capture is correct; ECNR's Node-branch preserves byte-equivalent behavior.
  // If a future Diamond moves install through Electron CSSP, ECNR's Electron
  // branch automatically activates and routes through bin/scs.js — zero-cost
  // future-proofing.
  const { nodeBin, cliPath } = resolveHookCommandBinary();
  // DHTL · Dev-Hook-Tsx-Loader · matches buildSpawnSettings discipline above.
  const tsxLoader = cliPath.endsWith('.ts') ? '--import tsx ' : '';
  const binAndCli = cliPath ? `${nodeBin} ${tsxLoader}${cliPath}` : nodeBin;
  const debugPrefix = isDebugEnabled() ? 'SCS_BRIDGE_DEBUG=1 ' : '';
  const commandRegisterInstall = `${debugPrefix}SCS_BRIDGE_ULID=${sessionId} SCS_BRIDGE_INSTALL_TEMP=${tempDir} ${binAndCli} __hook register-install`;
  const commandUserPromptSubmitInstall = `${debugPrefix}SCS_BRIDGE_ULID=${sessionId} SCS_BRIDGE_INSTALL_TEMP=${tempDir} ${binAndCli} __hook user-prompt-submit-install`;
  const commandEnd = `${debugPrefix}SCS_BRIDGE_ULID=${sessionId} ${binAndCli} __hook session-end`;
  // Diamond B-8 Fix 2 (PTS): install-scope targeted allow-rules. Targeted paths only
  // (NOT bypassPermissions mode) — user's other Claude work unaffected. CD-25 preserved.
  // Tool(glob) string syntax Lambda-confirmed via `claude --help` (Green Angle 1).
  // JSON key path `permissions.allow` per Conductor decision (resolves Green USER-CONFER gate).
  const userCwd = process.cwd();
  // W1.1 · D2 Recurse-5 BNPC diagnostic · install build-end log
  // Parallel BNPC site per S4 Stage 2 §A1.1. Today shielded (install runs in
  // bridge daemon Node context); fragile if future migration moves install
  // through Electron CSSP. Same diagnostic shape as buildSpawnSettings.
  tdia('spawnSettings.build', {
    fn: 'buildInstallSpawnSettings',
    ulid: sessionId,
    nodeBin,
    cliPath,
    tsxLoader,
    isElectronCtx: !!process.versions.electron,
    electronVersion: process.versions.electron ?? null,
    nodeVersion: process.versions.node,
    commandRegisterPreview: commandRegisterInstall.slice(0, 200),
  });
  return {
    hooks: {
      SessionStart: [
        {
          hooks: [{ type: 'command', command: commandRegisterInstall }],
        },
        {
          hooks: [{ type: 'command', command: commandUserPromptSubmitInstall }],
        },
      ],
      SessionEnd: [
        {
          hooks: [{ type: 'command', command: commandEnd }],
        },
      ],
    },
    permissions: {
      allow: [
        // C590 · THE EDIT-RULE LAW — Edit(path) covers all file-editing tools; Write() is dead.
        `Edit(${userCwd}/Cascades/**)`,
        `Edit(${userCwd}/.claude/CLAUDE.md)`,
        `Edit(${userCwd}/.claude/agents/**)`,
        `Edit(${userCwd}/.claude/commands/**)`,
        `Read(${userCwd}/CLAUDE.md)`,
        'Bash(git clone *)',
        'Bash(cp -R *)',
        'Bash(mkdir -p *)',
        'Bash(test -d *)',
        'Bash(test -f *)',
      ],
    },
  };
}

export async function writeSpawnSettings(
  sessionId: string,
  scpName?: string,
  bridgePort = 7111,
  suite8Name?: string,
  // MD-1 · D-SB-3 · the SCP install root threaded to buildSpawnSettings for the
  // Sovereignty allow-list (Write/Edit scoped to <scpDir>/Cascades/**). Absent ⇒ no
  // permissions block (unchanged behavior).
  scpDir?: string,
): Promise<string> {
  // MRQ-RC3 · WAPM · the worker auto-permission mode is NO LONGER written here. It is
  // applied via the ` --permission-mode auto` CLI flag in cli-handler.buildBlcwSpawnOpts
  // (scoped by the registry's entry.isWorker), because CC v2.1.142+ may silently ignore
  // a settings-file `defaultMode` (Part B/C · MRQ-AUTOMODE-CLASSIFIER-VERMILLION.md).
  const settings = buildSpawnSettings(sessionId, scpName, bridgePort, suite8Name, scpDir);
  const path = spawnSettingsPath(sessionId);
  // Install recurse (ReEngage break · MQ7FKKDS): install-born sessions had NO per-session dir
  // capsule -> writeFile threw ENOENT, swallowed silently, no window. Self-sufficient mkdir.
  await mkdir(sessionDir(sessionId), { recursive: true });
  await writeFile(path, JSON.stringify(settings, null, 2), 'utf8');
  log('spawnSettings.write', { ulid: sessionId, path, scpName: scpName ?? null, suite8Name: suite8Name ?? null });
  // W1.2 · D2 Recurse-5 BNPC diagnostic · write-end log
  // Tier-2 evidence: what landed on disk. Captures the SessionStart command
  // string snippet so Concluder can grep for 'Electron' (pre-fix) anor 'bin/scs.js' (post-fix).
  const sessionStartCmd = settings.hooks.SessionStart[0]?.hooks[0]?.command ?? '';
  tdia('spawnSettings.write', {
    ulid: sessionId,
    path,
    scpName: scpName ?? null,
    sessionStartCommandPreview: sessionStartCmd.slice(0, 200),
    isElectronCtx: !!process.versions.electron,
  });
  return path;
}
