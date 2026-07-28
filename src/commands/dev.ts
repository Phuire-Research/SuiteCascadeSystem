/**
 * `scs dev --self-dev` subcommand — SCS Self-Development Orchestrator
 *
 * Treats the working SCS source tree as both the CLI and the template
 * host. Scaffolds Cascade.json with `installationStatus: 'muxified'`
 * so the boot path resolves to non-fresh-install (Shatterite menu · NOT
 * the Installation Agent UI). Then runs the TUI via `startAnimatedTui()`,
 * which boots the SCS-Bridge daemon (MCP server) internally — matching
 * the production code path. Sets `SCS_SELF_DEV=1` for all child processes
 * and spawns a cascading Nodemon Pair:
 *
 *   Process A · `nodemon --config nodemon.dev.json` (SCS root)
 *              · watches `src/` · on change runs
 *                `scripts/writeBridgeRestartTrigger.ts` which writes
 *                `.bridge-restart.json` into the template SCP root.
 *   Process B · `npm run bridge` inside the template SCP
 *              · template's own `nodemon.json` watches
 *                `.bridge-restart.json` and restarts its ts-node bridge.
 *
 * Conditional `npm install` runs once at startup when the template's
 * `node_modules` is absent (gated by `--no-npm`).
 *
 * Flags:
 *   --self-dev        Signal flag — sets SCS_SELF_DEV=1 + skips Installation Agent
 *   --scp <path>      Override template SCP path (default ./Cascades/scps/template/SCP)
 *   --no-npm          Skip conditional npm install even if node_modules absent
 *
 * Citation: SCS-DEV-SCRIPT-WAVE2-OCHRE-DEVSCRIPT-BLUEPRINT.md Section 3
 * Citation: Cycle 160 R5 Wave 2 · DSPM Full Extraction Refactor
 * Citation: Cycle 160 R9 · Cobalt-MFC · TUI in dev:self + Cascade.json scaffold
 */
import { Command } from 'commander';
import { existsSync, mkdirSync, writeFileSync, appendFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { spawn, execSync, ChildProcess } from 'node:child_process';
import { isDebugEnabled } from '../lib/bridge/debugLog';
import { capLogFile } from '../lib/bridge/logCap';
import { readScpConfigName } from '../lib/bridge/scpConfig.model';
import { sendElectronQuitViaSocket, spawnElectronWindowForUrl } from '../lib/bridge/electronWindowSpawn';
import { startAnimatedTui } from '../lib/tui/animatedTui';

let devDebugLogPath: string | null = null;
let templateDebugLogPath: string | null = null;

function initDevDebugLog(): void {
  if (!isDebugEnabled()) return;
  const dir = join(process.cwd(), 'Cascades', 'Bridge');
  mkdirSync(dir, { recursive: true });
  devDebugLogPath = join(dir, 'debug.json');
  templateDebugLogPath = join(dir, 'template-debug.json');
  appendDevDebug('dev-orchestrator', `--- dev:self started at ${new Date().toISOString()} ---`);
  appendDevDebug('SCP', `--- template-debug.json opened at ${new Date().toISOString()} ---`);
}

function appendDevDebug(source: string, line: string): void {
  // Route by source · SCP (template) gets its own sink · orchestrator + nodemon stay in debug.json
  const targetPath = source === 'SCP' ? templateDebugLogPath : devDebugLogPath;
  if (!targetPath) return;
  try {
    const entry = { ts: new Date().toISOString(), source, line };
    appendFileSync(targetPath, JSON.stringify(entry) + '\n');
    capLogFile(targetPath); // D-LHT · drop-oldest cap (the 99M template-debug.json offender)
  } catch {
    /* swallow · debug log must never crash dev orchestrator */
  }
}

function writeDev(line: string): void {
  process.stdout.write(line);
  appendDevDebug('dev-orchestrator', line.endsWith('\n') ? line.slice(0, -1) : line);
}

interface DevOptions {
  selfDev?: boolean;
  scp?: string;
  npm?: boolean;
}

function prefixLines(
  prefix: string,
  stream: NodeJS.ReadableStream,
  outStream: NodeJS.WritableStream,
  onLine?: (line: string) => void,
): void {
  let buf = '';
  const sourceTag = prefix.replace(/[\[\]\s]/g, '') || 'unknown';
  stream.on('data', (chunk: Buffer | string) => {
    buf += typeof chunk === 'string' ? chunk : chunk.toString('utf8');
    const lines = buf.split('\n');
    buf = lines.pop() ?? '';
    for (const line of lines) {
      outStream.write(`${prefix} ${line}\n`);
      appendDevDebug(sourceTag, line);
      if (onLine) onLine(line);
    }
  });
  stream.on('end', () => {
    if (buf.length > 0) {
      outStream.write(`${prefix} ${buf}\n`);
      appendDevDebug(sourceTag, buf);
      if (onLine) onLine(buf);
      buf = '';
    }
  });
}

function killProcessGroup(proc: ChildProcess | null, label: string): void {
  if (!proc || proc.killed) return;
  try {
    if (proc.pid) {
      try {
        process.kill(-proc.pid, 'SIGKILL');
      } catch {
        proc.kill('SIGKILL');
      }
    } else {
      proc.kill('SIGKILL');
    }
  } catch (err) {
    process.stderr.write(
      `[SCS dev] Failed to terminate ${label}: ${err instanceof Error ? err.message : String(err)}\n`,
    );
  }
}

/**
 * Scaffold bridge.json + sessions.json under <scpRoot>/Cascades/Bridge/ if missing.
 * Eliminates ENOENT errors in scsBridgeJsonWatcher.principle.huirth.ts (L113, L134).
 *
 * Idempotent: existsSync() gates each writeFileSync · pre-existing valid state preserved.
 * Synchronous: writeFileSync ensures files exist BEFORE template bridge spawn arms watcher.
 * Anchored: uses scpRoot (NOT process.cwd) to prevent path-resolution mismatch.
 *
 * Cycle 158 R2 · Path A (BJFM) · DOSU scope · BRTF surface (.bridge-restart.json) UNTOUCHED.
 */
function scaffoldBridgeStateFiles(scpRoot: string): void {
  const bridgeDir = join(scpRoot, 'Cascades', 'Bridge');
  const bridgeJsonPath = join(bridgeDir, 'bridge.json');
  const sessionsJsonPath = join(bridgeDir, 'sessions.json');

  mkdirSync(bridgeDir, { recursive: true });

  if (!existsSync(bridgeJsonPath)) {
    const defaultBridgeJson = {
      schemaVersion: 1,
      bridgeVersion: '0.0.0-dev-scaffold',
      writtenAt: Date.now(),
      port: 0,
      endpoint: '',
      userCwd: scpRoot,
      boundScps: {},
      installedScps: [],
      _devScaffolded: true,
    };
    writeFileSync(
      bridgeJsonPath,
      JSON.stringify(defaultBridgeJson, null, 2) + '\n',
    );
    process.stdout.write('[SCS dev] Scaffolded bridge.json\n');
  }

  if (!existsSync(sessionsJsonPath)) {
    const defaultSessionsJson = { sessions: [] };
    writeFileSync(
      sessionsJsonPath,
      JSON.stringify(defaultSessionsJson, null, 2) + '\n',
    );
    process.stdout.write('[SCS dev] Scaffolded sessions.json\n');
  }

  // GITM #639 · scaffold gitm.json so the SCP-side gitm STCP watcher always has a file on
  // startup (belt-and-suspenders · the watcher is ENOENT-safe, but this eliminates the
  // null-state window before the bridge's gitmEndpoint writes the authoritative snapshot
  // asynchronously after its first gitmSetStatus read). Runs synchronously before any
  // watcher arms. isRepo:false + lastReadAt:0 = the known-empty seed AND the SMRP boot-skip
  // gate. The shape is authoritative in Cascades/scps/template/SCP/src/concepts/gitm/gitm.type.ts
  // (GitmJsonShape · the clean import-graph home · NOT scsBridge.type.ts); declared inline here
  // because dev.ts lives outside the SCP-package rootDir (no cross-package type import).
  const gitmJsonPath = join(bridgeDir, 'gitm.json');
  if (!existsSync(gitmJsonPath)) {
    const defaultGitmJson = {
      isRepo: false,
      currentBranch: '',
      dirty: false,
      ahead: 0,
      behind: 0,
      branches: [] as string[],
      stagedFiles: [] as string[],
      unstagedFiles: [] as string[],
      detachedHead: false,
      conflicts: [] as string[],
      lastReadAt: 0,
      // GITM Dev Menu (#644) — STASHCOUNT default (Wave B mirrors on GitmJsonShape).
      stashCount: 0,
      // D-BN · THE branchRoles SWEEP — the canonical A/B role truth seed (none assigned). Mirrors
      // GitmState.branchRoles + GitmStatusSnapshot.branchRoles (TQNI: SCP GitmJsonShape mirrors later wave).
      branchRoles: { a: '', b: '' },
      // D-BN-2 · THE turnOver RELOCATION — the turn-over restart signal seed (moved off per-SCP
      // bridge.json onto gitm.json). at:0 = never fired (the SCP field-watcher's boot baseline).
      turnOver: { at: 0, source: '', hard: false },
    };
    writeFileSync(gitmJsonPath, JSON.stringify(defaultGitmJson, null, 2) + '\n');
    process.stdout.write('[SCS dev] Scaffolded gitm.json\n');
  }

  // Cobalt-MFC · Cycle 160 R9 · scaffold Cascade.json with installationStatus
  // = 'muxified' so the boot path resolves to the non-fresh-install branch and
  // the TUI routes to normal Shatterite menu (NOT the Installation Agent UI).
  // Schema mirrors buildFreshCascadeJson output (installConstants.ts:301-329)
  // but with installationStatus pre-set to a completed sentinel. Idempotent:
  // existsSync gate preserves any prior user-authored Cascade.json.
  const cascadesDir = join(scpRoot, 'Cascades');
  const cascadeJsonPath = join(cascadesDir, 'Cascade.json');
  mkdirSync(cascadesDir, { recursive: true });
  if (!existsSync(cascadeJsonPath)) {
    const defaultCascadeJson = {
      activeDiamond: null,
      activeOnyx: null,
      suiteColors: {
        '0': 'Base',
        '1': 'Red',
        '2': 'Orange',
        '3': 'Yellow',
        '4': 'Green',
        '5': 'Blue',
        '6': 'Purple',
        '7': 'Fuchsia',
      },
      cyclePosition: {
        cycle: 0,
        rotation: 1,
        totalRotations: 1,
        gate: 0,
      },
      colorSelectionComplete: false,
      automata: null,
      installState: 'existing-project-augmented',
      installationStatus: 'muxified',
      claudeMdPresent: false,
      installedAt: new Date().toISOString(),
      installVersion: '0.0.0-dev-scaffold',
      _devScaffolded: true,
    };
    writeFileSync(
      cascadeJsonPath,
      JSON.stringify(defaultCascadeJson, null, 2) + '\n',
    );
    process.stdout.write('[SCS dev] Scaffolded Cascade.json (installationStatus=muxified)\n');
  }

  // SWFB · scaffold Cascades/SCPs.json — the SCP registry, now the windowId-binding
  // home for the refocus tool (setScpWindowId upserts the electron window id per SCP
  // name). It is a gitignored runtime artifact (untracked), so fresh clones no longer
  // receive it from git — seed an empty registry if absent so the upsert has a file to
  // write into. Idempotent: existsSync gate preserves a populated registry.
  const scpsJsonPath = join(cascadesDir, 'SCPs.json');
  if (!existsSync(scpsJsonPath)) {
    writeFileSync(scpsJsonPath, JSON.stringify({ scps: [] }, null, 2) + '\n');
    process.stdout.write('[SCS dev] Scaffolded SCPs.json (empty registry)\n');
  }
}

async function runDevMode(options: DevOptions): Promise<void> {
  const cwd = process.cwd();
  const targetScpPath = resolve(
    cwd,
    options.scp ?? join('Cascades', 'scps', 'template', 'SCP'),
  );

  if (!existsSync(targetScpPath)) {
    process.stderr.write(
      `[SCS dev] Template not found: ${targetScpPath}\n`,
    );
    process.stderr.write(
      `[SCS dev] Run \`scs dev\` from the SCS source repository root.\n`,
    );
    process.exit(1);
  }

  process.env.SCS_SELF_DEV = '1';
  // OEPP · Orchestrator-Env-Parity-Propagation · D3 W5 Recurse-1 cure.
  // The bridge muxium runs IN the dev-orchestrator process (NOT in templateProc
  // or watcherProc) · so SCS_BRIDGE_ORIGIN_SCP must be on THIS process.env
  // for the EVRC env-read in scsBridgeSendMessage.quality to find it.
  // childEnv below propagates the SAME var to children for parity.
  // Citation: DIAMOND-3-FKIS-W5-FAILURE-S7-CLINICAL-NOTE §F.6
  //
  // Per-SCP-Identity-Config · FKIS Origin · lift the hard-coded 'template' into data: read the
  // template SCP's scp.config.json scpName (the same declarative identity the install wizard stamps
  // per-SCP). Fallback to 'template' so dev:self never breaks if the config is absent/malformed.
  const templateOriginScp = readScpConfigName(targetScpPath) ?? 'template';
  process.env.SCS_BRIDGE_ORIGIN_SCP = templateOriginScp;

  initDevDebugLog();

  const childEnv: NodeJS.ProcessEnv = {
    ...process.env,
    SCS_SELF_DEV: '1',
    // RBJP · Cycle 160 R10 · Root-Bridge-Junction-Pattern · the CLI IS the bridge
    // junction · bridge.json lives at the CLI's cwd (SCS root in dev:self · install
    // dir in production). All SCPs (template + installed) READ from this single
    // junction file. Template SCP runs with cwd=targetScpPath · so it needs
    // SCS_BRIDGE_ROOT_OVERRIDE to point at the junction (SCS root). scsBridgeJsonWatcher
    // principle honors this env var to resolve BRIDGE_JSON_PATH correctly.
    SCS_BRIDGE_ROOT_OVERRIDE: cwd,
    // D3 FKIS · TOEI · Template-Origin-Env-Injection. Template SCP server reads
    // this at MCP tool-call time (EVRC) to populate originScpName when sending
    // FKIS messages. Production SCPs use their own SCS_BRIDGE_SCP_NAME from
    // their existing boot env. Citation: DIAMOND-3-FKIS-S3-OCHRE-BLUEPRINT §H.1
    // Per-SCP-Identity-Config: propagate the SAME resolved value (template scp.config.json
    // scpName · fallback 'template') for orchestrator↔child parity (OEPP).
    SCS_BRIDGE_ORIGIN_SCP: templateOriginScp,
    ...(isDebugEnabled() ? { SCS_BRIDGE_DEBUG: '1' } : {}),
  };

  if (devDebugLogPath && templateDebugLogPath) {
    process.stdout.write(`[SCS dev] Debug capture enabled · orchestrator → ${devDebugLogPath}\n`);
    process.stdout.write(`[SCS dev]                         · template SCP → ${templateDebugLogPath}\n`);
    appendDevDebug('dev-orchestrator', `targetScpPath=${targetScpPath} · bridge.json at ${join(targetScpPath, 'Cascades', 'Bridge', 'bridge.json')}`);
  }

  const npmShouldRun =
    options.npm !== false &&
    !existsSync(join(targetScpPath, 'node_modules'));

  if (npmShouldRun) {
    process.stdout.write(
      `[SCS dev] Template node_modules absent — running \`npm install\` in ${targetScpPath}\n`,
    );
    try {
      execSync('npm install', {
        cwd: targetScpPath,
        stdio: 'inherit',
        env: childEnv,
      });
    } catch (err) {
      process.stderr.write(
        `[SCS dev] npm install failed: ${err instanceof Error ? err.message : String(err)}\n`,
      );
      process.exit(1);
    }
  }

  const scriptsDir = join(cwd, 'scripts');
  if (!existsSync(scriptsDir)) {
    mkdirSync(scriptsDir, { recursive: true });
  }

  // RBJP · Cycle 160 R10 · scaffold at the JUNCTION (CLI cwd = SCS root) ·
  // NOT at template SCP path. The watcher honors SCS_BRIDGE_ROOT_OVERRIDE
  // pointing at the junction. The daemon also writes here (process.cwd()).
  scaffoldBridgeStateFiles(cwd);

  process.stdout.write(
    `[SCS dev] SCS_SELF_DEV=1 · targetScpPath=${targetScpPath}\n`,
  );
  process.stdout.write(
    `[SCS dev] Spawning template bridge (npm run bridge) ...\n`,
  );

  const templateProc = spawn('npm', ['run', 'bridge'], {
    cwd: targetScpPath,
    env: childEnv,
    stdio: 'pipe',
    detached: true,
  });

  // CFEU + USWP · dev:self auto-spawn of the Template SCP into an Electron
  // BrowserWindow once the Template Server is DONE BUILDING + SERVING. Specific
  // logical branch — only fires inside `scs dev --self-dev` · production scs CLI
  // does NOT auto-spawn (the proven scsBridgeOpenBrowserTab quality OBRS path
  // owns engaged SCPs). Serves as the live smoke test for Diamond 1
  // SCP-Window-via-Electron (PoC of openUrlWindow via CSSP relay).
  //
  // Detection: TEMPLATE-STDOUT-IDLE-DETECT (TSID). Reading a specific
  // ready-signal line (e.g., "Bridge Restart Manifold: READY") is unreliable —
  // it fires before the Vite client/SSR pipeline finishes serving HTTP.
  // Instead we fire when the SCP stdout stream has been quiet for
  // SCP_IDLE_THRESHOLD_MS · which captures "build finished AND server serving."
  //
  // Port-signal: stdout line "[Huirth] Starting SCP Template Server (PID: N, port: P, ip: I)"
  //              extracted once · then idle-timer-debounce on subsequent lines.
  let templatePort: number | null = null;
  let electronSpawned = false;
  let templateIdleTimer: NodeJS.Timeout | null = null;
  const SCP_IDLE_THRESHOLD_MS = 3000;
  const tryAutoSpawnElectronTemplate = (): void => {
    if (electronSpawned || templatePort === null) return;
    electronSpawned = true;
    const url = `http://localhost:${templatePort}/`;
    process.stdout.write(
      `[SCS dev] Template SCP stdout idle ${SCP_IDLE_THRESHOLD_MS}ms · auto-spawning Electron: ${url}\n`,
    );
    appendDevDebug(
      'dev-orchestrator',
      `Auto-spawn Electron window for Template SCP url=${url}`,
    );
    spawnElectronWindowForUrl(url, {
      focus: true,
      scsRoot: cwd,
      // SWFB · bind the opened window's id under the dev:self origin SCP name
      // ('template') so the refocus tool can focus THIS specific window by id.
      scpName: process.env.SCS_BRIDGE_ORIGIN_SCP ?? 'template',
      onError: (err) => {
        process.stderr.write(
          `[SCS dev] Auto-spawn Electron window failed: ${err.message}\n`,
        );
      },
    });
  };
  const resetTemplateIdleTimer = (): void => {
    if (templateIdleTimer) {
      clearTimeout(templateIdleTimer);
      templateIdleTimer = null;
    }
    if (templatePort === null || electronSpawned) return;
    templateIdleTimer = setTimeout(
      tryAutoSpawnElectronTemplate,
      SCP_IDLE_THRESHOLD_MS,
    );
  };
  const onScpStdoutLine = (line: string): void => {
    if (templatePort === null) {
      const portMatch = line.match(/port:\s*(\d+)/);
      if (portMatch) {
        templatePort = parseInt(portMatch[1], 10);
      }
    }
    resetTemplateIdleTimer();
  };

  if (templateProc.stdout) {
    prefixLines('[SCP]', templateProc.stdout, process.stdout, onScpStdoutLine);
  }
  if (templateProc.stderr) {
    prefixLines('[SCP]', templateProc.stderr, process.stderr, onScpStdoutLine);
  }

  templateProc.on('exit', (code, signal) => {
    process.stdout.write(
      `[SCS dev] Template bridge exited code=${code ?? 'null'} signal=${signal ?? 'null'}\n`,
    );
  });

  process.stdout.write(
    `[SCS dev] Spawning SCS root nodemon (nodemon.dev.json) ...\n`,
  );

  const watcherProc = spawn(
    'npx',
    ['nodemon', '--config', 'nodemon.dev.json'],
    {
      cwd,
      env: childEnv,
      stdio: 'pipe',
      detached: true,
    },
  );

  if (watcherProc.stdout) {
    prefixLines('[SCS]', watcherProc.stdout, process.stdout);
  }
  if (watcherProc.stderr) {
    prefixLines('[SCS]', watcherProc.stderr, process.stderr);
  }

  watcherProc.on('exit', (code, signal) => {
    process.stdout.write(
      `[SCS dev] Watcher exited code=${code ?? 'null'} signal=${signal ?? 'null'}\n`,
    );
  });

  const shutdown = (signal: NodeJS.Signals): void => {
    process.stdout.write(`[SCS dev] Received ${signal} — terminating Electron + children\n`);
    if (templateIdleTimer) {
      clearTimeout(templateIdleTimer);
      templateIdleTimer = null;
    }
    // ULT · Unified-Lifecycle-Termination · send quit to Electron tray via CSSP
    // socket FIRST · so the tray dies with the CLI rather than orphaning.
    // Best-effort · 300ms timeout · always settles so children-kill + exit follow.
    void sendElectronQuitViaSocket(300).finally(() => {
      killProcessGroup(watcherProc, 'watcher');
      killProcessGroup(templateProc, 'template bridge');
      // Cobalt-MFC · Cycle 160 R9 · TUI cleanExit owns SCS-Bridge daemon
      // teardown internally (startAnimatedTui boots it · its cleanExit closes it).
      // dev:self no longer holds a direct daemon handle.
      process.exit(0);
    });
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));

  // Cobalt-MFC · Cycle 160 R9 · Manifold-Full-Convergence. Run TUI in dev:self.
  // startAnimatedTui internally boots the SCS-Bridge daemon (MCP server) with
  // userCwd=process.cwd() at animatedTui.ts:271.
  //
  // RBJP · Cycle 160 R10 · Root-Bridge-Junction-Pattern · NO chdir hack.
  // The CLI IS the bridge junction · its cwd IS the bridge root · bridge.json
  // lives at SCS_root/Cascades/Bridge/. Template SCP huirth (spawned above with
  // cwd=targetScpPath) reads bridge.json via SCS_BRIDGE_ROOT_OVERRIDE env var
  // (set in childEnv above) pointing back at the junction. Process.cwd() stays
  // at SCS root · TUI runs at the junction · Cascade.json (SCS root's real one
  // with cycle/Onyx state) is what the daemon's bridge.metadata.cascade-read
  // resolves (installState=unknown → safe-fallback complete → normal menu).
  process.stdout.write('[SCS dev] Starting animated TUI (boots SCS-Bridge daemon at junction · cwd=SCS root) ...\n');
  appendDevDebug('dev-orchestrator', `Starting TUI · cwd=${process.cwd()} · bridge junction at ${join(process.cwd(), 'Cascades', 'Bridge')}`);
  await startAnimatedTui();
}

export function devCommand(): Command {
  const cmd = new Command('dev');
  cmd
    .description(
      'SCS self-development mode — starts template SCP bridge with SCS source watching',
    )
    .option(
      '--self-dev',
      'Treat launch dir as SCS source repo — skip Installation Agent, resolve template in-place',
    )
    .option(
      '--scp <path>',
      'Override template SCP path (default: ./Cascades/scps/template/SCP)',
    )
    .option('--no-npm', 'Skip conditional npm install even if node_modules absent')
    .action(async (options: DevOptions) => {
      await runDevMode(options);
    });
  return cmd;
}
