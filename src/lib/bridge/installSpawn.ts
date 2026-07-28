import { execFile as execFileCb } from 'node:child_process';
import {
  copyFileSync,
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { cp as fsCp, mkdir, mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import * as path from 'node:path';
import { promisify } from 'node:util';
import { buildInstallSpawnSettings } from './spawnSettings';
// SCS Install Epoch D1 · §1.5 · install spawn surface swapped from the OS terminal
// (osTerminal.buildTerminalCommand) to the proven Electron xterm window. osTerminal.ts
// itself stays live (spawn.ts / menu.ts / commands/bridge/* still consume it) — only
// the install path's coupling is removed here.
import { spawnElectronInstallInstance } from './electronSessionSpawn';
import {
  buildFreshCascadeJson,
  deriveInstallState,
  markInstallationComplete,
} from './installConstants';
import { detectMuxState, type UserStatePresence } from './muxDetect';
import {
  buildManifestSkeleton,
  captureSnapshot,
  ensureUserSCSConfigDir,
  writeManifest,
  type ManifestFileEntry,
} from './icedManifest';
import {
  dropInClaudeMd,
  mergeSettingsJson,
  namespaceAgents,
  namespaceCommands,
} from './muxCompose';
import { addSession } from './registry';
import { archiveDir, priorityDir } from './paths';
import { ensureNestedGitStructure } from './gitmNestedMaintain';
// SCS Install Epoch D1 · §1.5 · `import { spawn }` removed — the install path no
// longer spawns directly; spawnElectronInstallInstance owns the detached spawn. The
// only prior `spawn(` use in this file was the now-swapped buildTerminalCommand site.
// (execFile at the top is a separate import and stays.)
import { log } from './debugLog';
// ICSM1-D1 · Iced Skill Trilogy Macro 1 · Gap 1 closure (R4 Bidirectional Diameter 3).
// installSpawn.ts:751 `log('install.muxified.complete', ...)` is a FILE logger, not
// a Stratimux dispatch. To enable scpDockHost.principle.ts Surface 3 observation,
// a Muxium action dispatch is added at the same call site. The 6th routing-only
// Quality (scpDockHostInstallMuxifiedComplete · S12 ShortestPath `{}`) routes the
// signal into the action bus.
// Stratimuxian Scholar S3 Planning Stage Control · S7 Dispatch Patterns.
// Cycle 139 CPPP · install-muxified-complete dispatch removed; import dropped.

// Diamond B-10 Fix 2: ISO 8601 compact timestamp for filesystem-safe backup suffix.
// Format: YYYYMMDDTHHMMSS (e.g., 20260508T143015).
export function timestampSuffix(): string {
  return new Date().toISOString().split('.')[0].replace(/[-:]/g, '');
}

const execFile = promisify(execFileCb);

// C787 · THE REFINEMENT SALVO Seat 2 — the install Diamonds land IN-HAND. The clone's
// Cascades/Working is EXCLUDED from the scaffold copy (never user state), so the boards ride
// the Suite 8 home (Diamonds/) and are CODE-copied into the user's Working/ here. The agent
// CHOOSES UnFounded anor Founded by the ground, follows THAT board's Cerulean tasks, and
// records its own ONYX-INSTALL.md. THE BOARD OUTRANKS ANY COMMENT INSIDE A MINTED FILE.
const INSTALL_DIAMONDS = [
  'DIAMOND-INSTALL-UNFOUNDED.md',
  'DIAMOND-INSTALL-FOUNDED.md',
] as const;
export function copyInstallDiamonds(cloneCascadesPath: string, userCwd: string): number {
  let copied = 0;
  for (const name of INSTALL_DIAMONDS) {
    const src = path.join(cloneCascadesPath, '8_SUITES', 'SCS Bridge', 'Diamonds', name);
    const dst = path.join(userCwd, 'Cascades', 'Working', name);
    try {
      if (existsSync(src)) {
        copyFileSync(src, dst);
        copied += 1;
      }
    } catch {
      /* non-fatal — the joined envelope still carries the doctrine */
    }
  }
  log('install.scaffold.diamonds', { copied });
  return copied;
}

// Diamond B-24-FIX: SOURCES grows 9 → 10. S7 added at end. Order matters for
// `assembleJoinedSuite8` concatenation — S7 lands at the bottom of the joined
// envelope so the install agent reads S1..S6 (install pipeline strategies) BEFORE
// reading S7 (Muxify-User-Claude-Md, the post-scaffold intelligence step).
const SOURCES = [
  'Instance.md',
  'Conductor.md',
  'Skill.md',
  'Strategy/S1-DetectCascadesPresence.md',
  'Strategy/S2-ConfirmInstallation.md',
  'Strategy/S3-CloneRepo.md',
  'Strategy/S4-ScaffoldCascadesDir.md',
  'Strategy/S5-ConvertClaudeMd.md',
  'Strategy/S6-CleanupTempDir.md',
  'Strategy/S7-MuxifyUserClaudeMd.md',
  'Strategy/S8-StratidianWelcome.md',
  'Strategy/S9-DomainPageCreate.md',
  // C787 · S10-HomePageAdapt SHED from the envelope — the home claim is RETIRED (C780); the
  // banner file remains on disk as history but no longer teaches the install agent.
] as const;

// SCP-UPD-FND D-U1 · Shared clone primitive extracted from cloneScsBridge so the
// retained-clone manager (updateCloneManager.ts) reuses the EXACT dual-path logic
// (file://-fsCp · remote-git-clone) WITHOUT mutating cloneScsBridge's 3-caller
// install contract. Writes the clone INTO `clonePath` (caller owns the path's
// lifetime: install removes it; update retains it). Behavior is byte-identical to
// the prior inline body — cloneScsBridge now delegates here.
// C822 D2 · THE COMMIT-LOCKED CLONE (the SCP Manifest doctrine): clone FULL (never
// --depth=1 — HEAD-only is structurally incompatible with an anchor checkout) then check out
// THE SPECIFIC COMMIT the manifest provides — never the most recent. The chain: the registry
// verifies an anchor → the manifest carries it → this function installs exactly that tree.
// git clone handles file:// and remote URLs alike (no cpSync arm — .git must exist to checkout).
export async function performCloneAtCommit(
  repoUrl: string,
  clonePath: string,
  commitHash: string,
): Promise<void> {
  if (!/^[0-9a-f]{7,40}$/.test(commitHash)) {
    throw new Error(`performCloneAtCommit: invalid commit hash '${commitHash}'`);
  }
  await execFile('git', ['clone', repoUrl, clonePath]);
  await execFile('git', ['-C', clonePath, 'checkout', commitHash]);
}

export async function performClone(repoUrl: string, clonePath: string): Promise<void> {
  // Cycle 151 SAWSR · Working-Tree-Source Resolution (WTSR · M136 PROVISIONAL)
  // Defeats SCSD (Skill-Context-Staleness-Drift) for local dev workflow.
  //
  // When SCS_INSTALL_REPO_URL is a `file://` URL, `git clone --depth=1` reads
  // HEAD (committed state) ONLY — uncommitted working-tree edits to Skills,
  // Conductor.md, Strategy/*, etc. are INVISIBLE to the install agent's
  // joined Suite 8. This is the structural source of recurrent stale-doctrine
  // bias the Installation Agent diagnosed via S4+S7 Tier 0 (Cycle 151).
  //
  // Solution: detect file:// URLs and cpSync the working tree directly,
  // bypassing git's commit-state requirement. End-user installs (github.com/...)
  // remain on git clone path unchanged.
  if (repoUrl.startsWith('file://')) {
    const localSource = repoUrl.replace(/^file:\/\//, '');
    const EXCLUDED_DIRS = new Set([
      '.git',
      'node_modules',
      'dist',
      // Runtime artifacts · never source-of-truth · per SB-S30 PLBSS
      'Cascades/Bridge',
      'Cascades/Working',
      'Cascades/Lab',
      '.staging',
    ]);
    try {
      // Blank-Test-001 recurse (S6 W-b) · cpSync froze the event loop ~4.7s here (the
      // file:// dev path), starving the TUI install overlay of frames → read as hung.
      // fs.promises.cp yields the loop so the animation keeps painting during the copy.
      await fsCp(localSource, clonePath, {
        recursive: true,
        // Per-entry filter · exclude runtime artifacts to keep tempdir lean
        filter: (src) => {
          const rel = path.relative(localSource, src);
          if (rel === '') return true; // include root itself
          for (const excl of EXCLUDED_DIRS) {
            if (rel === excl || rel.startsWith(excl + path.sep)) return false;
          }
          return true;
        },
      });
      log('install.clone.wtsr.copy-complete', { source: localSource, clonePath });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      throw new Error(`WTSR cpSync failed (file:// local source): ${message}`);
    }
    return;
  }

  // Remote git URL · standard clone path · end-user install
  try {
    await execFile('git', ['clone', '--depth=1', repoUrl, clonePath]);
  } catch (err: unknown) {
    const nodeErr = err as NodeJS.ErrnoException;
    if (nodeErr.code === 'ENOENT') {
      throw new Error('git executable not found; install git first');
    }
    const execErr = err as { stderr?: string; message?: string };
    const stderr = execErr.stderr ?? execErr.message ?? String(err);
    throw new Error(`git clone failed: ${stderr}`);
  }
}

export async function cloneScsBridge(
  repoUrl: string,
  tempDir: string,
): Promise<{ clonePath: string }> {
  const clonePath = path.join(tempDir, 'clone');
  await performClone(repoUrl, clonePath);
  return { clonePath };
}

export function backupUserClaudeMd(
  userCwd: string,
  tempDir: string,
): { backupPath: string; originalExists: boolean } {
  const sourcePath = path.join(userCwd, 'CLAUDE.md');
  if (!existsSync(sourcePath)) {
    return { backupPath: '', originalExists: false };
  }
  const content = readFileSync(sourcePath);
  const backupPath = path.join(tempDir, 'user-CLAUDE.md.bak');
  writeFileSync(backupPath, content);
  return { backupPath, originalExists: true };
}

export function backupUserDotClaudeAgents(
  userCwd: string,
  tempDir: string,
): { backupPath: string; originalExists: boolean } {
  const sourcePath = path.join(userCwd, '.claude', 'agents');
  if (!existsSync(sourcePath)) {
    return { backupPath: '', originalExists: false };
  }
  const backupPath = path.join(tempDir, 'agents.bak');
  cpSync(sourcePath, backupPath, { recursive: true });
  return { backupPath, originalExists: true };
}

export function assembleJoinedSuite8(
  clonedRepoPath: string,
  tempDir: string,
): { joinedPath: string; lineCount: number } {
  const baseDir = path.join(clonedRepoPath, 'Cascades', '8_SUITES', 'SCS Bridge');
  const sections = SOURCES.map((rel) => {
    const content = readFileSync(path.join(baseDir, rel), 'utf8');
    return `\n\n---\n\n## Suite 8 SCS Bridge — ${rel}\n\n${content}`;
  });
  const joined =
    `# Joined Suite 8 SCS Bridge (install-mode injection)\n\n` +
    `Spawn-time concatenation of Instance.md + Conductor.md + Skill.md + 10 Strategy files.` +
    sections.join('');
  const joinedPath = path.join(tempDir, 'joined-suite-8-scs-bridge.md');
  writeFileSync(joinedPath, joined);
  return { joinedPath, lineCount: joined.split('\n').length };
}

// Diamond B-10 Fix 1 (CD-36 candidate): bridge-side .claude/ scaffold + timestamped
// CLAUDE.md backup. Runs post-trust-confer (CD-32 sanctioning chain) before spawn.
//
// Diamond B-24 (CD-84..CD-93 · Muxified Path): refactored from cpSync-replace
// to muxifyUserState compose-not-replace. SCS agents/commands always land at
// scs-* prefix sub-namespace; CLAUDE.md gets delimited append. Returns rich
// manifest entries for B-25 reverse-muxify contract. Universal across fresh
// (no user state) and muxified (user state detected) installs.
export function scaffoldUserDotClaude(
  userCwd: string,
  clonePath: string,
): {
  dotClaudeCreated: boolean;
  existingClaudeMdBackedUp: string | null;
  agentsCopied: boolean;
  commandsCopied: boolean;
} {
  const result = muxifyUserState(userCwd, clonePath, '');
  return {
    dotClaudeCreated: result.dotClaudeCreated,
    existingClaudeMdBackedUp: result.existingClaudeMdBackedUp,
    agentsCopied: result.agentEntries.length > 0,
    commandsCopied: result.commandEntries.length > 0,
  };
}

// Diamond B-24 (CD-84..CD-93 · Muxified Path universal compose-not-replace):
// Single function handling fresh AND muxified installs uniformly. Behavior:
//   1. Timestamped backup of root CLAUDE.md (B-3 belt-and-suspenders preserved)
//   2. Compose-not-replace per file type:
//      - .claude/CLAUDE.md (root + .claude/) → composeClaudeMd (delimited append)
//      - .claude/agents/ → namespaceAgents (scs-* prefix, preserves user agents)
//      - .claude/commands/ → namespaceCommands (scs-* prefix)
//      - .claude/settings.json → mergeSettingsJson (additive, user wins)
//   3. Returns ManifestFileEntry[] for caller to embed in MuxificationManifest
//
// scsBridgeVersion is the version-aware delimiter token (caller passes from package.json).
export function muxifyUserState(
  userCwd: string,
  clonePath: string,
  scsBridgeVersion: string,
): {
  dotClaudeCreated: boolean;
  existingClaudeMdBackedUp: string | null;
  rootClaudeMdEntry: ManifestFileEntry | null;
  dotClaudeMdEntry: ManifestFileEntry | null;
  agentEntries: ManifestFileEntry[];
  commandEntries: ManifestFileEntry[];
  settingsEntry: ManifestFileEntry | null;
} {
  const dotClaudePath = path.join(userCwd, '.claude');
  const userClaudeMdPath = path.join(userCwd, 'CLAUDE.md');
  const userDotClaudeMdPath = path.join(dotClaudePath, 'CLAUDE.md');
  const userAgentsPath = path.join(dotClaudePath, 'agents');
  const userCommandsPath = path.join(dotClaudePath, 'commands');
  const userSettingsPath = path.join(dotClaudePath, 'settings.json');

  const cloneClaudeMdPath = path.join(clonePath, '.claude', 'CLAUDE.md');
  const cloneAgentsPath = path.join(clonePath, '.claude', 'agents');
  const cloneCommandsPath = path.join(clonePath, '.claude', 'commands');

  // Ensure .claude/ exists
  const dotClaudeCreated = !existsSync(dotClaudePath);
  if (dotClaudeCreated) {
    mkdirSync(dotClaudePath, { recursive: true });
  }

  // B-3 belt-and-suspenders: timestamped *.bak of root CLAUDE.md (Iced is primary
  // for B-25 reverse; *.bak is secondary defense-in-depth)
  let existingClaudeMdBackedUp: string | null = null;
  if (existsSync(userClaudeMdPath)) {
    const ts = timestampSuffix();
    const backupPath = path.join(userCwd, `CLAUDE.md.${ts}.bak`);
    copyFileSync(userClaudeMdPath, backupPath);
    existingClaudeMdBackedUp = backupPath;
  }

  // Diamond B-24-FIX: drop-in semantic for .claude/CLAUDE.md.
  // SCS Manifold (clone's .claude/CLAUDE.md) writes verbatim to user's
  // .claude/CLAUDE.md — NO delimited append. Honors Claude Code's tight 40K
  // project-memory budget. User's prior content (if any) lives in
  // Cascades/Iced/PreInstallSnapshot/{ts}/ — install agent's Strategy S7
  // muxifies that into a Suite 8 with first-class Stratidian standing.
  let dotClaudeMdEntry: ManifestFileEntry | null = null;
  if (existsSync(cloneClaudeMdPath)) {
    const scsContent = readFileSync(cloneClaudeMdPath, 'utf8');
    dotClaudeMdEntry = dropInClaudeMd(userDotClaudeMdPath, scsContent, '.claude/CLAUDE.md');
  }

  // Agents: scs- prefixed sub-namespace
  const agentEntries = namespaceAgents(cloneAgentsPath, userAgentsPath);

  // Commands: scs- prefixed sub-namespace
  const commandEntries = namespaceCommands(cloneCommandsPath, userCommandsPath);

  // Settings: additive merge (only when SCS has hooks/permissions to add).
  // Currently SCS has no hooks to install at scaffold-time; future Diamonds
  // can extend this. The merge ALSO ensures user's settings.json stays valid
  // when present.
  let settingsEntry: ManifestFileEntry | null = null;
  // Only touch settings.json if user already has one (don't create empty one)
  if (existsSync(userSettingsPath)) {
    settingsEntry = mergeSettingsJson(userSettingsPath, [], []);
  }

  return {
    dotClaudeCreated,
    existingClaudeMdBackedUp,
    rootClaudeMdEntry: null, // root CLAUDE.md is NOT modified by SCS (only .claude/CLAUDE.md is)
    dotClaudeMdEntry,
    agentEntries,
    commandEntries,
    settingsEntry,
  };
}

export function copyScsPromptTemplate(
  clonedRepoPath: string,
  tempDir: string,
): { promptPath: string } {
  const sourcePath = path.join(clonedRepoPath, '.claude', 'CLAUDE.md');
  const content = readFileSync(sourcePath);
  const promptPath = path.join(tempDir, 'scs-prompt.md');
  writeFileSync(promptPath, content);
  return { promptPath };
}

export function spawnInstallInstance(opts: {
  // SCS Install Epoch D1 · §1.6 · the Electron session registry is ULID-keyed, so the
  // install window registers under the SAME ULID the install pipeline already
  // addSession'd. Threaded from the two spawning pipelines (both have it in scope).
  ulid: string;
  cwd: string;
  joinedFilePath: string;
  spawnSettingsPath: string;
  // Diamond B-16 (CD-46 PCSP): first-prompt seed for the install instance.
  // For Path B this is the verbose Strategy S1 directive; AppleEvents-free path.
  seedPrompt?: string | null;
}): { pid: number } {
  const { ulid, cwd, joinedFilePath, spawnSettingsPath: settingsPath, seedPrompt } = opts;
  // RBJP · §3 · the install child reads bridge state from the bridge junction (the
  // bridge's own cwd = SCS install dir in production), not the user project cwd.
  // Captured HERE (the install pipeline runs IN the bridge process, so process.env
  // carries the dev override; in production it falls back to the bridge's cwd = the
  // junction) and threaded through the descriptor → JSON envelope → buildInstallSpawnOpts
  // → pty env, because the open-install Electron-main process does NOT share this env.
  const bridgeRootOverride = process.env.SCS_BRIDGE_ROOT_OVERRIDE ?? process.cwd();
  // §1.5 · spawn surface swapped: OS terminal (buildTerminalCommand + spawn) → the
  // proven Electron xterm window (spawnElectronInstallInstance). The `{pid}` return
  // shape is preserved so all three install pipelines call unchanged. Command parity:
  // buildInstallSpawnOpts runs the SAME `claude <seedPrompt> --settings …
  // --append-system-prompt-file …` invocation in the SAME user cwd the OS-terminal
  // path ran (§command parity).
  const child = spawnElectronInstallInstance(ulid, {
    cwd,
    seedPrompt,
    appendSystemPromptFilePath: joinedFilePath,
    settingsPath: settingsPath,
    bridgeRootOverride,
    // Blank-Test-001 recurse · the detached+ignore+unref shape swallowed the ENOENT
    // that killed the first production install SILENTLY (no event after
    // spawnSettings.build). Surface spawn-level failure into debug.json.
    onError: (err) => {
      const code = (err as NodeJS.ErrnoException).code;
      log('install.spawn.error', { ulid, code, message: err.message });
    },
  });
  // Observability Concluder: the relay child was handed off (pid) — the NEXT expected
  // event is cli-handler open-install in electron-debug.json; its absence localizes
  // any future break to the bin/scs.js → Electron leg.
  log('install.spawn.relay-pending', { ulid, pid: child.pid ?? -1 });
  return { pid: child.pid ?? -1 };
}

export function pollScaffoldComplete(
  tempDir: string,
  timeoutMs: number,
  intervalMs = 500,
): Promise<{ done: boolean; payload?: Record<string, unknown> }> {
  return new Promise((resolve) => {
    const flagPath = path.join(tempDir, 'scaffold-done.flag');
    let elapsed = 0;
    // Diamond B-10 Fix 4: emit install.poll.tick every 30s (not every interval — too noisy).
    const TICK_LOG_INTERVAL_MS = 30_000;
    let lastTickLog = 0;
    const timer = setInterval(() => {
      if (existsSync(flagPath)) {
        clearInterval(timer);
        try {
          const raw = readFileSync(flagPath, 'utf8');
          resolve({ done: true, payload: JSON.parse(raw) as Record<string, unknown> });
        } catch {
          resolve({ done: true });
        }
      } else {
        elapsed += intervalMs;
        if (elapsed - lastTickLog >= TICK_LOG_INTERVAL_MS) {
          log('install.poll.tick', { tempDir, elapsedMs: elapsed, flagPresent: false });
          lastTickLog = elapsed;
        }
        if (elapsed >= timeoutMs) {
          clearInterval(timer);
          resolve({ done: false });
        }
      }
    }, intervalMs);
  });
}

export function cleanupInstallTemp(tempDir: string): void {
  rmSync(tempDir, { recursive: true, force: true });
}

// Diamond B-13 Fix 3 (CD-39 + Green B4 Fix-2/3): cpSync filter for Cascades/
// scaffold copy in Path A (blank-slate install). Excludes dev-only state and
// machine-noise artifacts so a fresh install gets a clean baseline.
//
// Pattern 4 Modulation: filter operates on path strings only (no content read).
//
// Green B4 Fix-2 (Cascade.json exclusion): Cascade.json is dev live state —
// only Cascade.template.json copies; runInstallScaffoldOnly renames the
// template to Cascade.json on the user side post-copy.
export function pathFilterCascadesScaffold(srcRoot: string, src: string): boolean {
  const rel = path.relative(srcRoot, src).split(path.sep);
  if (rel.length === 0 || rel[0] === '') return true; // root dir itself

  // EXCLUDE machine noise
  const basenameStr = rel[rel.length - 1];
  if (basenameStr === '.DS_Store') return false;

  // EXCLUDE Working/* except .gitkeep
  if (rel[0] === 'Working') {
    if (rel.length === 1) return true; // copy the directory itself
    if (rel.length === 2 && rel[1] === '.gitkeep') return true;
    return false;
  }

  // EXCLUDE Lab/* except .gitkeep
  if (rel[0] === 'Lab') {
    if (rel.length === 1) return true;
    if (rel.length === 2 && rel[1] === '.gitkeep') return true;
    return false;
  }

  // EXCLUDE Bridge runtime artifacts (sessions.json, debug.json, sessions/)
  if (rel[0] === 'Bridge') {
    if (rel.length === 1) return true;
    if (rel.length >= 2 && (rel[1] === 'sessions.json' || rel[1] === 'debug.json')) return false;
    if (rel[1] === 'sessions') return false;
    return true;
  }

  // Diamond B-24 (CD-89 RRTMU + Suite 6 Purple D-6): EXCLUDE Iced/ during cpSync.
  // Iced is per-install muxification record + user personalization layer; it
  // MUST NOT be overwritten on reinstall. Reading user's existing manifest is
  // the responsibility of detectMuxState BEFORE this cpSync runs.
  if (rel[0] === 'Iced') return false;

  // EXCLUDE assets/
  if (rel[0] === 'assets') return false;

  // EXCLUDE Cascade.json at top-level (dev live state); Cascade.template.json IS copied
  if (rel.length === 1 && rel[0] === 'Cascade.json') return false;

  return true;
}

// Diamond B-13 Fix 2 (CD-39 · Path-A-Scaffold-Only-No-Spawn-Install):
// Path A install — clone + scaffold .claude/ + scaffold Cascades/ + cleanup.
// NO Terminal spawn, NO Strategy execution, NO typeahead. Used when the user's
// cwd is a blank slate (no Cascades/8_SUITES present) — bridge does the full
// install statically and returns control to the menu. User can then manually
// launch claude in the cwd; .claude/CLAUDE.md (SCS prompt) loads natively and
// the trust dialog is skipped via preSeedTrust (called separately by handleInstall).
//
// Green B4 Fix-2 (Cascade.template.json rename): Cascade.json excluded by filter;
// template renamed in-place to seed live state on user side.
//
// Diamond B-19 (CD-58 BECIS · CD-59 FFHF · CD-60 PHRSD): bridge-embedded
// Cascade.json default written after rename block to ensure source-independence
// (works regardless of clone branch state). Last-writer-wins composition.
export async function runInstallScaffoldOnly(
  userCwd: string,
  repoUrl: string,
  scsBridgeVersion = '0.34.0',
): Promise<{
  ulid: string;
  tempDir: string;
  cascadesScaffolded: boolean;
  templateRenamed: boolean;
  cascadeJsonSeeded: boolean;
  dotClaudeResult: ReturnType<typeof muxifyUserState>;
  muxState: ReturnType<typeof detectMuxState>;
  manifestWritten: boolean;
}> {
  const ulid = Date.now().toString(36).toUpperCase();
  const tempDir = await mkdtemp(path.join(tmpdir(), 'scs-install-scaffold-'));
  log('install.scaffold-only.start', { ulid, userCwd, repoUrl, tempDir, scsBridgeVersion });
  try {
    // Diamond B-24 (CD-84 MPAD + CD-89 RRTMU): detect mux state BEFORE any write.
    // Result drives downstream routing (muxified vs fresh) and snapshot capture.
    const muxState = detectMuxState(userCwd);
    log('install.mux-detect', {
      state: muxState.state,
      userStateDetected: muxState.userState.detected,
      hasIcedManifest: muxState.hasIcedManifest,
    });

    log('install.clone.start', { repoUrl, tempDir });
    const cloneStart = Date.now();
    const { clonePath } = await cloneScsBridge(repoUrl, tempDir);
    log('install.clone.complete', { clonePath, durationMs: Date.now() - cloneStart });

    // Diamond B-24 (CD-86 PISCD): capture pre-install snapshot to Cascades/Iced/
    // BEFORE any write. Replaces B-5 EPHEMERAL tempDir backup (Suite 4 Green B-23
    // finding). Snapshot timestamped per install run for multi-reinstall coexistence.
    // Diamond δ-1 (FAVPL mitigation): log the skip explicitly so debug output shows
    // which path was probed and why the snapshot was empty.
    const installTimestamp = timestampSuffix();
    let preInstallSnapshotRelPath = '';
    if (muxState.userState.detected) {
      const snapshot = captureSnapshot(userCwd, installTimestamp, muxState.userState);
      preInstallSnapshotRelPath = snapshot.snapshotRelPath;
      log('install.iced.snapshot.captured', {
        snapshotRelPath: snapshot.snapshotRelPath,
        files: snapshot.capturedFiles.length,
      });
    } else {
      // δ-1 FAVPL skip-log: surface the silent no-op so debug output makes the
      // probe result auditable. userState sub-fields show which paths were checked.
      log('install.iced.snapshot.skipped', {
        userCwd,
        reason: 'userState.detected === false',
        hasRootClaudeMd: muxState.userState.hasRootClaudeMd,
        hasDotClaudeClaudeMd: muxState.userState.hasDotClaudeClaudeMd,
        hasUserAgents: muxState.userState.hasUserAgents,
        hasUserCommands: muxState.userState.hasUserCommands,
        hasUserSettings: muxState.userState.hasUserSettings,
      });
    }

    // δ-3 SPVI Concluder: muxified state declared but snapshot dir empty is a
    // FAVPL violation · the install would silently lose user content. Halt before
    // any fixture write. (state === 'fresh' OR 'remuxify' skip this check.)
    if (muxState.state === 'muxified' && preInstallSnapshotRelPath === '') {
      const msg = `SPVI violation: muxState='muxified' but snapshot was not captured. userCwd=${userCwd} · userState=${JSON.stringify(muxState.userState)}`;
      log('install.spvi.violation', { userCwd, userState: muxState.userState });
      throw new Error(msg);
    }

    // Legacy B-3 *.bak (defense-in-depth · belt-and-suspenders preserved)
    const claudeBak = backupUserClaudeMd(userCwd, tempDir);
    log('install.backup.bridge-temp.claude', claudeBak);

    log('install.scaffold.dotclaude.start', { userCwd, scsBridgeVersion });
    const dotClaudeResult = muxifyUserState(userCwd, clonePath, scsBridgeVersion);
    log('install.scaffold.dotclaude.complete', {
      dotClaudeCreated: dotClaudeResult.dotClaudeCreated,
      agentEntries: dotClaudeResult.agentEntries.length,
      commandEntries: dotClaudeResult.commandEntries.length,
      claudeMdAction: dotClaudeResult.dotClaudeMdEntry?.action ?? 'skipped',
    });

    // Bridge-side Cascades/ scaffold (Path A only)
    const cloneCascadesPath = path.join(clonePath, 'Cascades');
    const userCascadesPath = path.join(userCwd, 'Cascades');
    let cascadesScaffolded = false;
    if (existsSync(cloneCascadesPath)) {
      log('install.scaffold.cascades.start', { src: cloneCascadesPath, dst: userCascadesPath });
      cpSync(cloneCascadesPath, userCascadesPath, {
        recursive: true,
        filter: (src) => pathFilterCascadesScaffold(cloneCascadesPath, src),
      });
      cascadesScaffolded = true;
      // FT-008 P-C scaffold gap: pathFilterCascadesScaffold strips Working/* contents
      // (the dev tree's Diamond/Onyx are never user state). Ensure the EMPTY container
      // exists so riActivate's DIAMOND-TIER-1.md / ONYX-TIER-1.md writes never ENOENT.
      mkdirSync(path.join(userCwd, 'Cascades', 'Working'), { recursive: true });
      copyInstallDiamonds(cloneCascadesPath, userCwd);
      log('install.scaffold.cascades.complete', { dst: userCascadesPath });
    }

    // Green B4 Fix-2: Cascade.template.json → Cascade.json (live state seed)
    // Defensive layer for SCS-Bridge-Install branch case where template DOES
    // exist in clone. Becomes legacy path post-merge to main; B-19 BECIS write
    // (below) is the canonical fresh-install state authority.
    let templateRenamed = false;
    const templatePath = path.join(userCascadesPath, 'Cascade.template.json');
    const livePath = path.join(userCascadesPath, 'Cascade.json');
    if (existsSync(templatePath) && !existsSync(livePath)) {
      renameSync(templatePath, livePath);
      templateRenamed = true;
      log('install.scaffold.cascade-template-rename', { from: templatePath, to: livePath });
    }

    // Diamond B-19 (CD-58 BECIS · Bridge-Embedded-Cascade-Initial-State):
    // Source-independent fresh-install Cascade.json. Skip-if-exists guard
    // preserves any user state (including a successful template rename above);
    // when push-HELD branch divergence means the rename never fired (clone
    // source = main lacks template), the bridge embedded constant is the
    // sole authority. Pattern 4 modulation preserved (write into user-cwd
    // sanctioned by trust-confer chain).
    // Install-State Branching Diamond (CASS · IFSB · PRSCD · Suite 4 Green H3):
    // BECIS write extended with installState · claudeMdPresent · installedAt ·
    // installVersion via buildFreshCascadeJson. muxState already in scope from
    // line 410 detection (no re-probe · IFSB threading discipline). Atomic
    // write migrated to tmp+rename pattern matching writeApprovalSettings
    // (scpInstall.ts:109-120) to close H3 partial-write window.
    let cascadeJsonSeeded = false;
    if (!existsSync(livePath) && existsSync(userCascadesPath)) {
      const installState = deriveInstallState(muxState.state);
      const cascadeContent = buildFreshCascadeJson({
        installState,
        claudeMdPresent: muxState.userState.hasRootClaudeMd,
        installedAt: new Date().toISOString(),
        installVersion: scsBridgeVersion,
      });
      const tmpLivePath = `${livePath}.tmp`;
      writeFileSync(tmpLivePath, cascadeContent, 'utf8');
      renameSync(tmpLivePath, livePath);
      cascadeJsonSeeded = true;
      log('install.scaffold.cascade-json-embedded-write', {
        path: livePath,
        bytes: cascadeContent.length,
        installState,
      });
    }

    // GITM 3LOC nested-git maintain (idempotent · FRESH-INSTALL-ONLY · Decision A). The
    // Cascades/ scaffold above is clean (never Base-tracked), so this inits Cascades/.git
    // + scps/<n>/.git + the two gitignore boundaries. Non-fatal — re-attempted on bridge boot.
    if (cascadesScaffolded) {
      try {
        const nested = ensureNestedGitStructure(userCwd);
        log('install.scaffold.gitm-nested-maintain', { skipped: nested.skipped, reason: nested.reason });
      } catch (err) {
        log('install.scaffold.gitm-nested-maintain.error', { message: String(err) });
      }
    }

    // Diamond B-24 (CD-87 MMDC · CD-91 MALBUS · CD-92 USCPPP):
    // Write MuxificationManifest.json + ensure UserSCSConfig/ exists.
    // Manifest is the load-bearing contract B-25 reverse-muxify reads.
    let manifestWritten = false;
    if (existsSync(path.join(userCwd, 'Cascades'))) {
      const manifest = buildManifestSkeleton({
        scsBridgeVersion,
        installTimestamp: new Date().toISOString(),
        preInstallSnapshotRelPath,
        userStateDetected: muxState.userState,
      });
      // Aggregate file entries from muxify
      if (dotClaudeResult.dotClaudeMdEntry) manifest.files.push(dotClaudeResult.dotClaudeMdEntry);
      manifest.files.push(...dotClaudeResult.agentEntries);
      manifest.files.push(...dotClaudeResult.commandEntries);
      if (dotClaudeResult.settingsEntry) manifest.files.push(dotClaudeResult.settingsEntry);
      writeManifest(userCwd, manifest);
      ensureUserSCSConfigDir(userCwd);
      manifestWritten = true;
      log('install.iced.manifest.written', {
        files: manifest.files.length,
        scsBridgeVersion,
      });
    }

    cleanupInstallTemp(tempDir);

    // Suite 5 Blue · Installation-Status completion mark (Wave 2 Path A · fresh).
    // Atomic transition: installing/muxifying → installed/muxified. Non-fatal:
    // a failed mark leaves the file in the incomplete state · next boot will
    // re-issue the install agent (boot-time check at animatedTui handleInstall).
    const completionMark = markInstallationComplete(userCwd);
    log('install.scaffold-only.completion-mark', {
      ok: completionMark.ok,
      installationStatus: completionMark.installationStatus,
      reason: completionMark.reason,
    });

    log('install.scaffold-only.complete', {
      ulid,
      cascadesScaffolded,
      templateRenamed,
      cascadeJsonSeeded,
      muxState: muxState.state,
      manifestWritten,
      installationStatus: completionMark.installationStatus,
    });
    return {
      ulid,
      tempDir,
      cascadesScaffolded,
      templateRenamed,
      cascadeJsonSeeded,
      dotClaudeResult,
      muxState,
      manifestWritten,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    log('install.scaffold-only.error', { message, tempDir });
    cleanupInstallTemp(tempDir);
    throw err;
  }
}

// Diamond B-24-FIX (Path B routing for Muxified Path · Suite 4 Green angle 1):
// Combines bridge-side scaffolding (Cascades/, .claude/ drop-in, Iced snapshot,
// MuxificationManifest, UserSCSConfig) with Path B spawn (assembleJoinedSuite8 +
// spawnInstallInstance with --append-system-prompt-file). The install agent
// receives the full SCS Bridge Suite 8 (Instance + Conductor + Skill + S1..S7)
// as appended system prompt and a plain-text seedPrompt directing it to execute
// Strategy S7 (MuxifyUserClaudeMd).
//
// Replaces B-24's wrong-path routing through Path A (runInstallScaffoldOnly +
// menu launchInformative) for Muxified installs. Path A retained for Reinstall
// re-scaffold case (B-21 RRSF) where re-spawn is not desired.
//
// Pre-spawn invariants verified via fs.statSync (Suite 4 Green angle 6):
//   - .claude/commands/cascade.md exists (canonical Lambda anchor · ζ Option X)
//   - joined Suite 8 file exists (--append-system-prompt-file target)
// Both invariants fail-fast with clear error if missing.
export async function runInstallMuxifiedPath(opts: {
  userCwd: string;
  repoUrl: string;
  scsBridgeVersion: string;
  seedPrompt: string;
}): Promise<{
  ulid: string;
  tempDir: string;
  pid: number;
  cascadesScaffolded: boolean;
  manifestWritten: boolean;
  muxState: ReturnType<typeof detectMuxState>;
}> {
  const { userCwd, repoUrl, scsBridgeVersion, seedPrompt } = opts;
  const ulid = Date.now().toString(36).toUpperCase();
  const tempDir = await mkdtemp(path.join(tmpdir(), 'scs-install-mux-'));
  log('install.muxified.start', { ulid, userCwd, repoUrl, tempDir, scsBridgeVersion });

  // Diamond B-25-UX-fix4 (CD-113 IAPSP · Install-Agent-Pre-Spawn-Registry-Add):
  // Pair install agent registration with New Session pattern — addSession BEFORE
  // spawn so the menu shows the install entry immediately as 'allocated'. The
  // register-install hook (B-25-UX-fix2 CD-108 IARSR) then UPDATES this entry
  // via updateSessionLiveIdentity to capture claudeSessionId + claudePid · entry
  // becomes 'launched'/'alive'. Liveness probe handles offline transition.
  // Pre-fix: hook updateSessionLiveIdentity silently no-op'd because no entry
  // existed (Suite 7 Fuchsia clinical · registry.ts:85 hard guard).
  try {
    await addSession({
      id: ulid,
      cwd: userCwd,
      spawnedAt: Date.now(),
      status: 'allocated',
    });
    log('install.muxified.registry-add', { ulid });
    // ReEngage recurse (S4+S6+S7 salvo · MQ7FKKDS): install-born sessions had NO per-session
    // dir capsule -> the engage-time writeSpawnSettings threw ENOENT silently. Create the full
    // capsule HERE (the bridge process owns the correct junction · matches the normal session
    // pattern: heads/body/tails for FKIS delivery + archive).
    await mkdir(priorityDir(ulid, 'heads'), { recursive: true });
    await mkdir(priorityDir(ulid, 'body'), { recursive: true });
    await mkdir(priorityDir(ulid, 'tails'), { recursive: true });
    await mkdir(archiveDir(ulid), { recursive: true });
  } catch (err) {
    log('install.muxified.registry-add.error', {
      ulid,
      message: err instanceof Error ? err.message : String(err),
    });
    // non-fatal · proceed without registry entry · install continues but won't appear in menu
  }

  try {
    // Detect mux state BEFORE any write
    const muxState = detectMuxState(userCwd);
    log('install.muxified.mux-detect', {
      state: muxState.state,
      userStateDetected: muxState.userState.detected,
    });

    // Clone repo (provides Cascades/ source + .claude/ source + joined Suite 8 source)
    log('install.clone.start', { repoUrl, tempDir });
    const cloneStart = Date.now();
    const { clonePath } = await cloneScsBridge(repoUrl, tempDir);
    log('install.clone.complete', { clonePath, durationMs: Date.now() - cloneStart });

    // Capture pre-install snapshot (CD-86 PISCD) BEFORE any write — replaces B-5 EPHEMERAL
    // Diamond δ-1 (FAVPL mitigation): same skip-log + SPVI Concluder as scaffold-only path.
    const installTimestamp = timestampSuffix();
    let preInstallSnapshotRelPath = '';
    if (muxState.userState.detected) {
      const snapshot = captureSnapshot(userCwd, installTimestamp, muxState.userState);
      preInstallSnapshotRelPath = snapshot.snapshotRelPath;
      log('install.iced.snapshot.captured', {
        snapshotRelPath: snapshot.snapshotRelPath,
        files: snapshot.capturedFiles.length,
      });
    } else {
      log('install.iced.snapshot.skipped', {
        userCwd,
        reason: 'userState.detected === false',
        hasRootClaudeMd: muxState.userState.hasRootClaudeMd,
        hasDotClaudeClaudeMd: muxState.userState.hasDotClaudeClaudeMd,
        hasUserAgents: muxState.userState.hasUserAgents,
        hasUserCommands: muxState.userState.hasUserCommands,
        hasUserSettings: muxState.userState.hasUserSettings,
      });
    }

    // δ-3 SPVI Concluder: halt if muxified declared but snapshot not captured.
    if (muxState.state === 'muxified' && preInstallSnapshotRelPath === '') {
      const msg = `SPVI violation: muxState='muxified' but snapshot was not captured. userCwd=${userCwd} · userState=${JSON.stringify(muxState.userState)}`;
      log('install.spvi.violation', { userCwd, userState: muxState.userState });
      throw new Error(msg);
    }

    // B-3 *.bak defense-in-depth (kept alongside Iced primary)
    const claudeBak = backupUserClaudeMd(userCwd, tempDir);
    log('install.backup.bridge-temp.claude', claudeBak);

    // Bridge-side scaffold via muxifyUserState (.claude/ drop-in + scs-* prefix)
    log('install.scaffold.dotclaude.start', { userCwd, scsBridgeVersion });
    const dotClaudeResult = muxifyUserState(userCwd, clonePath, scsBridgeVersion);
    log('install.scaffold.dotclaude.complete', {
      dotClaudeCreated: dotClaudeResult.dotClaudeCreated,
      agentEntries: dotClaudeResult.agentEntries.length,
      commandEntries: dotClaudeResult.commandEntries.length,
      claudeMdAction: dotClaudeResult.dotClaudeMdEntry?.action ?? 'skipped',
    });

    // Cascades/ scaffold (filter excludes Working/Lab/Bridge/Iced + Cascade.json)
    const cloneCascadesPath = path.join(clonePath, 'Cascades');
    const userCascadesPath = path.join(userCwd, 'Cascades');
    let cascadesScaffolded = false;
    if (existsSync(cloneCascadesPath)) {
      cpSync(cloneCascadesPath, userCascadesPath, {
        recursive: true,
        filter: (src) => pathFilterCascadesScaffold(cloneCascadesPath, src),
      });
      cascadesScaffolded = true;
      // FT-008 P-C scaffold gap (muxified path · parallels runInstallScaffoldOnly):
      // ensure the empty Working/ container exists so riActivate's writes never ENOENT.
      mkdirSync(path.join(userCwd, 'Cascades', 'Working'), { recursive: true });
      copyInstallDiamonds(cloneCascadesPath, userCwd);
    }

    // Cascade.template.json → Cascade.json rename (legacy path) + BECIS embedded write
    // Install-State Branching Diamond (CASS · IFSB · PRSCD · Suite 4 Green H3):
    // Muxified-path BECIS write parallels scaffold-only path. Atomic tmp+rename
    // for partial-write resilience. installState derived from muxState already
    // detected at line 628 (no re-probe; IFSB threading discipline).
    const templatePath = path.join(userCascadesPath, 'Cascade.template.json');
    const livePath = path.join(userCascadesPath, 'Cascade.json');
    if (existsSync(templatePath) && !existsSync(livePath)) {
      renameSync(templatePath, livePath);
    }
    if (!existsSync(livePath) && existsSync(userCascadesPath)) {
      const installState = deriveInstallState(muxState.state);
      const cascadeContent = buildFreshCascadeJson({
        installState,
        claudeMdPresent: muxState.userState.hasRootClaudeMd,
        installedAt: new Date().toISOString(),
        installVersion: scsBridgeVersion,
      });
      const tmpLivePath = `${livePath}.tmp`;
      writeFileSync(tmpLivePath, cascadeContent, 'utf8');
      renameSync(tmpLivePath, livePath);
      log('install.muxified.cascade-json-embedded-write', {
        path: livePath,
        bytes: cascadeContent.length,
        installState,
      });
    }

    // Iced manifest write (CD-87 MMDC) + UserSCSConfig (CD-92 USCPPP)
    let manifestWritten = false;
    if (existsSync(userCascadesPath)) {
      const manifest = buildManifestSkeleton({
        scsBridgeVersion,
        installTimestamp: new Date().toISOString(),
        preInstallSnapshotRelPath,
        userStateDetected: muxState.userState,
      });
      if (dotClaudeResult.dotClaudeMdEntry) manifest.files.push(dotClaudeResult.dotClaudeMdEntry);
      manifest.files.push(...dotClaudeResult.agentEntries);
      manifest.files.push(...dotClaudeResult.commandEntries);
      if (dotClaudeResult.settingsEntry) manifest.files.push(dotClaudeResult.settingsEntry);
      writeManifest(userCwd, manifest);
      ensureUserSCSConfigDir(userCwd);
      manifestWritten = true;
    }

    // GITM 3LOC nested-git maintain (idempotent · FRESH-INSTALL-ONLY · Decision A). The
    // muxified path scaffolds Cascades/ clean (never Base-tracked); this inits Cascades/.git
    // + scps/<n>/.git + the two gitignore boundaries. Non-fatal — re-attempted on bridge boot.
    if (existsSync(userCascadesPath)) {
      try {
        const nested = ensureNestedGitStructure(userCwd);
        log('install.muxified.gitm-nested-maintain', { skipped: nested.skipped, reason: nested.reason });
      } catch (err) {
        log('install.muxified.gitm-nested-maintain.error', { message: String(err) });
      }
    }

    // Pre-spawn invariant: cascade.md exists (the canonical Lambda anchor).
    // Diamond ζ Option X: was scs-cascade.md under ASNCPP · reverted (R0 GT-1).
    const scsCascadeCmdPath = path.join(userCwd, '.claude', 'commands', 'cascade.md');
    if (!existsSync(scsCascadeCmdPath)) {
      throw new Error(
        `runInstallMuxifiedPath: pre-spawn invariant failed — ${scsCascadeCmdPath} not found after scaffold`,
      );
    }

    // Assemble joined Suite 8 (Instance + Conductor + Skill + S1..S7) for spawn
    const joined = assembleJoinedSuite8(clonePath, tempDir);
    log('install.assemble.joined', joined);

    // Pre-spawn invariant: joined file exists
    if (!existsSync(joined.joinedPath)) {
      throw new Error(
        `runInstallMuxifiedPath: pre-spawn invariant failed — joined Suite 8 file not at ${joined.joinedPath}`,
      );
    }

    // Spawn settings.json (per-session SCS spawn settings)
    const settings = buildInstallSpawnSettings({ sessionId: ulid, tempDir });
    const settingsJsonPath = path.join(tempDir, 'spawn-settings.json');
    await writeFile(settingsJsonPath, JSON.stringify(settings, null, 2), 'utf8');

    // Path B spawn: install agent receives joined Suite 8 as appended system prompt
    // AND seedPrompt as positional CLI argument directing S7 execution.
    // §1.6 · thread ulid so the install window registers under the SAME ULID this
    // pipeline already addSession'd.
    const { pid } = spawnInstallInstance({
      ulid,
      cwd: userCwd,
      joinedFilePath: joined.joinedPath,
      spawnSettingsPath: settingsJsonPath,
      seedPrompt,
    });
    log('install.spawn.terminal', { pid, ulid });

    // Suite 5 Blue · Installation-Status completion mark (Wave 2 Path B · muxified).
    // Atomic transition: muxifying/installing → muxified/installed. Non-fatal:
    // a failed mark leaves the file in the incomplete state · next boot will
    // re-issue the install agent (boot-time check at animatedTui handleInstall).
    const completionMark = markInstallationComplete(userCwd);
    log('install.muxified.completion-mark', {
      ok: completionMark.ok,
      installationStatus: completionMark.installationStatus,
      reason: completionMark.reason,
    });

    log('install.muxified.complete', {
      ulid,
      cascadesScaffolded,
      manifestWritten,
      muxState: muxState.state,
      pid,
      installationStatus: completionMark.installationStatus,
    });

    // Cycle 139 CPPP · ICSM1-D1 Gap 1 closure dispatch removed. The original
    // scpDockHostInstallMuxifiedComplete Quality was a LOCK 1 DEFER no-op Reducer
    // in the pre-CPPP scpDockHost concept (its principle Surface 3 was the
    // observation site that never fired). With scsBridge as the CPPP-shaped
    // replacement, no equivalent install-muxified-complete signal exists. The
    // authoritative SCP registration channel remains the HTTP POST /dock route
    // (now served by scp's express transport principle into scsBridgeRegisterScp).
    // If a downstream Diamond needs install-muxified-complete signaling, it should
    // be reintroduced as a NEW Quality on scsBridge.
    void ulid;

    return {
      ulid,
      tempDir,
      pid,
      cascadesScaffolded,
      manifestWritten,
      muxState,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    log('install.muxified.error', { message, tempDir });
    cleanupInstallTemp(tempDir);
    throw err;
  }
}

// Diamond B-16 (CD-46 PCSP) RETIREMENT: dispatchTypeahead removed.
// Superseded by positional CLI argument injection at spawn time
// (buildTerminalCommand seedPrompt parameter). The AppleEvents-based
// keystroke injection had a hard TCC permission boundary (-1743);
// the documented `claude "[prompt]"` positional argument has none.
// Diamond B-11 SB-S46 + Diamond B-15 SB-S53 (AAPD) retired together.

// Diamond B-16 (CD-46 PCSP) RETIREMENT: pollSessionReadyAndTypeahead +
// pollRegisterReadyAndTypeahead removed. Both polled for a ready signal
// then fired dispatchTypeahead — that whole indirection collapses to a
// single positional CLI argument at spawn time. Diamond B-14 SB-S51 (PSRT)
// + Diamond B-11 SB-S46 retired.

export async function runInstallSpawnPipeline(
  userCwd: string,
  repoUrl: string,
  seedPrompt?: string | null,
): Promise<{ ulid: string; tempDir: string; pid: number }> {
  const ulid = Date.now().toString(36).toUpperCase();
  const tempDir = await mkdtemp(path.join(tmpdir(), 'scs-install-'));

  // Diamond B-25-UX-fix4 (CD-113 IAPSP): same pre-spawn registry add as
  // runInstallMuxifiedPath — Reinstall path also needed visibility pairing.
  try {
    await addSession({
      id: ulid,
      cwd: userCwd,
      spawnedAt: Date.now(),
      status: 'allocated',
    });
    log('install.pipeline.registry-add', { ulid });
    // ReEngage recurse (S4+S6+S7 salvo · MQ7FKKDS): install-born sessions had NO per-session
    // dir capsule -> the engage-time writeSpawnSettings threw ENOENT silently. Create the full
    // capsule HERE (the bridge process owns the correct junction · matches the normal session
    // pattern: heads/body/tails for FKIS delivery + archive).
    await mkdir(priorityDir(ulid, 'heads'), { recursive: true });
    await mkdir(priorityDir(ulid, 'body'), { recursive: true });
    await mkdir(priorityDir(ulid, 'tails'), { recursive: true });
    await mkdir(archiveDir(ulid), { recursive: true });
  } catch (err) {
    log('install.pipeline.registry-add.error', {
      ulid,
      message: err instanceof Error ? err.message : String(err),
    });
    // non-fatal · proceed without registry entry
  }

  // Diamond B-10 Fix 4: bridge-side step logging — every step emits start/complete/error
  // via existing dot-namespaced log() so silent-failure modes become observable.
  log('install.pipeline.start', { ulid, userCwd, repoUrl, tempDir });
  try {
    log('install.clone.start', { repoUrl, tempDir });
    const cloneStart = Date.now();
    const { clonePath } = await cloneScsBridge(repoUrl, tempDir);
    log('install.clone.complete', { clonePath, durationMs: Date.now() - cloneStart });

    const claudeBak = backupUserClaudeMd(userCwd, tempDir);
    log('install.backup.bridge-temp.claude', claudeBak);

    const agentsBak = backupUserDotClaudeAgents(userCwd, tempDir);
    log('install.backup.bridge-temp.agents', agentsBak);

    const joined = assembleJoinedSuite8(clonePath, tempDir);
    log('install.assemble.joined', joined);

    // Diamond B-10 Fix 1: bridge-side .claude/ scaffold post-confer.
    log('install.scaffold.dotclaude.start', { userCwd });
    const dotClaudeResult = scaffoldUserDotClaude(userCwd, clonePath);
    log('install.scaffold.dotclaude.complete', dotClaudeResult);

    const promptCopy = copyScsPromptTemplate(clonePath, tempDir);
    log('install.copy.prompt', promptCopy);

    const settings = buildInstallSpawnSettings({ sessionId: ulid, tempDir });
    const settingsJsonPath = path.join(tempDir, 'spawn-settings.json');
    await writeFile(settingsJsonPath, JSON.stringify(settings, null, 2), 'utf8');

    // §1.6 · thread ulid so the install window registers under the SAME ULID this
    // pipeline already addSession'd.
    const { pid } = spawnInstallInstance({
      ulid,
      cwd: userCwd,
      joinedFilePath: joined.joinedPath,
      spawnSettingsPath: settingsJsonPath,
      seedPrompt,
    });
    log('install.spawn.terminal', { pid, ulid });
    log('install.pipeline.complete', { ulid, tempDir, pid });
    return { ulid, tempDir, pid };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    log('install.pipeline.error', { message, tempDir });
    cleanupInstallTemp(tempDir);
    throw err;
  }
}
