import { existsSync, readFileSync, writeFileSync, realpathSync } from 'node:fs';
import * as nodePath from 'node:path';
import { ulid } from 'ulid';
import { sessionRegistry } from './session-registry';
import { Session, getActiveDefaultModel } from './session';
import { injectKeystrokes } from './input-bridge';
import { openUrlWindow, closeUrlWindow, focusUrlWindow, focusWindowById, closeWindowById , getVisibleScpWindowId, getVisibleUrlWindow } from './electronWindow';
// SWFB · bind the SCP page window's Electron windowId in Cascades/SCPs.json.
import { setScpWindowId, lookupScpWindowId } from '../lib/bridge/scpSessionRegistry';
import { BrowserWindow } from 'electron';
import {
  executeOrchestrationSequence,
  captureWindowRender,
  type OrchestrateStep,
} from './windowOrchestrate';
import { resolveActiveScpName } from './scpClientLogs';

// D-N2/D-N3 · Neon PlayTester · shared window-target resolution for the orchestrate/capture
// verbs. WINDOW-GENERAL: windowId (any window) → sessionId (a terminal session window) →
// scpName → the ACTIVE SCP (bridge.json activeScp via resolveActiveScpName).
async function resolvePlayTestTargetWindow(target: {
  windowId?: number;
  sessionId?: string;
  scpName?: string;
}): Promise<{ win: BrowserWindow | null; resolvedVia: string }> {
  if (typeof target.windowId === 'number' && Number.isFinite(target.windowId)) {
    return { win: BrowserWindow.fromId(target.windowId), resolvedVia: 'windowId' };
  }
  if (typeof target.sessionId === 'string' && target.sessionId.length > 0) {
    return {
      win: sessionRegistry.get(target.sessionId)?.getWindow() ?? null,
      resolvedVia: 'sessionId',
    };
  }
  const scpName =
    typeof target.scpName === 'string' && target.scpName.length > 0
      ? target.scpName
      : resolveActiveScpName();
  if (scpName) {
    const id = await lookupScpWindowId(scpName);
    return {
      win: id !== null ? BrowserWindow.fromId(id) : null,
      resolvedVia: `scpName:${scpName}`,
    };
  }
  return { win: null, resolvedVia: 'none' };
}
// STVI · pure {{VAR_NAME}} → value hydration for the anchor Onboard spawn-prompt.
import { hydrateOnboardTemplate, composeAnchorOnboardPrompt, STVI_ABSENT_FALLBACK, type OnboardValues } from '../lib/bridge/onboardHydration.model';
import { listSessions, updateSessionLaunchMeta } from '../lib/bridge/registry';
import { normalizeModelId } from '../shared/modelCatalog.model';
import { loadSessionMeta } from '../lib/bridge/manager';
import { writeSpawnSettings } from '../lib/bridge/spawnSettings';
import { bridgeMetadataPathPerProject } from '../lib/bridge/bridgeMetadata';
import { spawnSettingsPath, bridgeRoot } from '../lib/bridge/paths';
import { resolveGeneratedBasePromptPath } from '../lib/bridge/baseSystemPrompt/baseSystemPrompt';
import { resolveSuite8InstanceMd, resolveSuite8OnboardMd, resolveSuite8OnboardMdAcrossGrounds, resolveShatteriteMenuMd } from '../lib/bridge/instanceMdResolver.model';
import { sdia } from './diagnostics';
import { executeFkis } from './messageDispatch';
import type { ControlCommand, ControlResponse } from './control-server';
import { resolveOwningScpRoot } from '../lib/bridge/concepts/scsBridge/model/anchorConfig.model';

// C1-D3 DOCK · reads the committed scs-bridge-dock-suite8.md skeleton (the
// "Active Crystraline Suite 8" activation layer). Uses the SAME package-root
// resolution as baseSystemPrompt.ts (realpathSync(process.argv[1]) → dist/cli.cjs
// → grandparent = package root), which is bundling-surviving + format-agnostic.
// Returns '' on read failure so the composer gracefully degrades to a 2-layer
// Base→Instance compose if the Dock is missing.
function resolveDockContent(): string {
  try {
    const rawPath = process.argv[1] ?? '';
    if (!rawPath) return '';
    let cliPath: string;
    try {
      cliPath = realpathSync(rawPath);
    } catch {
      cliPath = rawPath;
    }
    const pkgRoot = nodePath.resolve(nodePath.dirname(cliPath), '..');
    // RELEASE W1: relocated from src/lib/bridge/baseSystemPrompt/ — src/ never
    // ships in the npm tarball, so the Dock silently degraded to '' (a 2-layer
    // compose, no Suite 8 activation layer) for every global-install user.
    //
    // C755 · THE DEV-BRIDGE FALLBACK RUNG: under the DEV electron launch argv[1]
    // is the app DIRECTORY (not dist/cli.cjs), so the argv-derived pkgRoot lands a
    // level too high and the Dock silently dropped (dockIncluded:false on EVERY dev
    // spawn — the stamped geography never attached). The bundled module lives at
    // dist/main/, so __dirname/../.. IS the package root — try both candidates and
    // take the first whose assets/ Dock exists.
    const candidates = [
      nodePath.join(pkgRoot, 'assets', 'baseSystemPrompt', 'scs-bridge-dock-suite8.md'),
      nodePath.resolve(__dirname, '..', '..', 'assets', 'baseSystemPrompt', 'scs-bridge-dock-suite8.md'),
    ];
    for (const dockPath of candidates) {
      if (existsSync(dockPath)) {
        return readFileSync(dockPath, 'utf8');
      }
    }
    sdia('cli-handler.suite8.dock-missing', { candidates });
    return '';
  } catch {
    return '';
  }
}

// A-3 SAPR · BDAP+Suite8 composition.
// When a session has a suite8Name, the BDAP base prompt (scs-bridge-base.generated.md),
// the shared Dock (scs-bridge-dock-suite8.md · C1-D3), and the Suite 8's Instance.md
// are COMPOSED into a single combined file written to bridgeRoot(). This preserves the
// RM-D2 BDAP relay contract (base prompt is never dropped) while appending the Suite 8
// activation + identity. The combined file is then passed as the single
// --append-system-prompt-file argument.
//
// 3-layer order (C1-D3 BDAP): Base (generated · SORD contract) → Dock (static ·
// Active Crystraline Suite 8 activation) → Instance.md (specific identity). The Dock
// sits in the middle: it activates Suite-8 operating mode AFTER the tool contract and
// BEFORE the specific identity.
//
// File naming: scs-bridge-suite8-<suite8Name>.generated.md (one per Suite 8 name,
// regenerated on every engage so the Instance.md content is always current).
//
// General-skip preserved: no suite8Name → return basePath unchanged (Base only).
// Graceful fallback: if Instance.md is absent (NDEP mismatch / Suite 8 not installed),
// the function returns the plain BDAP base prompt path (unchanged behavior). If the
// Dock is absent, the composer degrades to a 2-layer Base→Instance compose.
function resolveComposedAppendPath(
  basePromptPath: string | undefined,
  suite8Name: string | undefined,
  scpRoot?: string,
): string | undefined {
  if (!suite8Name) return basePromptPath;

  // THE OWNING-SCP PROBE (the generated-page identity law): a Shatterite spawn from a
  // GENERATED Suite 8 page carries suite8Name but often NO scpName (the session entry's
  // scpName is unset → the caller's resolveScpDir yields undefined → the SCP-LOCAL
  // Instance.md was unreachable and the compose silently degraded to base-only — the
  // bare, identity-less spawn). When scpRoot is absent, PROBE which installed SCP OWNS
  // the designation (the SCP whose Cascades/8_SUITES/<suite8Name>/ exists — the same
  // C465 resolver the Extended relocation trusts). Covers every generated page AND the
  // bare Step-2 mint (the 8_SUITES dir exists before the Entourage Forge builds the page).
  if (!scpRoot || scpRoot.length === 0) {
    const owningRoot = resolveOwningScpRoot(suite8Name);
    if (owningRoot) {
      scpRoot = owningRoot;
      sdia('cli-handler.suite8.owning-scp-probe', { suite8Name, owningRoot });
    }
  }

  // MD-1 · D-SB-3 · scpRoot re-root: when the session's SCP carries an install dir
  // (resolved from boundScps[scpName].dir), the compose reads the SCP-LOCAL Instance.md
  // (Cascades/8_SUITES/<name>/Instance.md under scpRoot) — the Sovereignty Boundary.
  //
  // C378 · THE ONBOARD SOVEREIGNTY THREAD (Instance.md leg — one rule, both documents).
  // The prior single resolveSuite8InstanceMd(name, scpRoot) picked the SCP dir XOR the
  // workspace root, so a defined-but-absent SCP-local Instance.md dropped to base-only
  // with NO fall-through to the workspace Instance.md — the SAME BARE-spawn gap the
  // Onboard read carried. Try BOTH grounds (SCP-local FIRST, workspace SECOND) and NAME
  // which ground resolved via the same instance.resolve telemetry.
  const workspaceInstancePath = resolveSuite8InstanceMd(suite8Name);
  const scpLocalInstancePath =
    scpRoot && scpRoot.length > 0 ? resolveSuite8InstanceMd(suite8Name, scpRoot) : undefined;
  let instancePath: string;
  let instanceGround: 'scp-local' | 'workspace' | 'absent';
  if (scpLocalInstancePath && existsSync(scpLocalInstancePath)) {
    instancePath = scpLocalInstancePath;
    instanceGround = 'scp-local';
  } else if (existsSync(workspaceInstancePath)) {
    instancePath = workspaceInstancePath;
    instanceGround = 'workspace';
  } else {
    instancePath = scpLocalInstancePath ?? workspaceInstancePath;
    instanceGround = 'absent';
  }
  sdia('cli-handler.suite8.instance.resolve', {
    suite8Name,
    scpRoot: scpRoot ?? null,
    ground: instanceGround,
    resolvedPath: instanceGround === 'absent' ? null : instancePath,
    scpLocalPathTried: scpLocalInstancePath ?? null,
    workspacePathTried: workspaceInstancePath,
  });
  if (instanceGround === 'absent') {
    // MD-1 FailureNode: both grounds absent → graceful fallback to the plain BDAP base
    // prompt (the spawn never breaks · no bridge-root leak into the SCP compose).
    sdia('cli-handler.suite8.instance-md-missing', {
      suite8Name,
      instancePath,
      scpRoot: scpRoot ?? null,
      ground: instanceGround,
      scpLocalPathTried: scpLocalInstancePath ?? null,
      workspacePathTried: workspaceInstancePath,
    });
    return basePromptPath;
  }

  let baseContent = '';
  if (basePromptPath && existsSync(basePromptPath)) {
    baseContent = readFileSync(basePromptPath, 'utf8');
  }
  // C754 · THE STAMPED DOCK (the Withheld-Answer fix): the bridge KNOWS the designation and
  // — via the owning-SCP probe above — the SCP root at compose time; stamp both into the
  // Dock §4 placeholders so the newborn receives its geography as a GIVEN. The discovery
  // ladder in the newborn guard remains only as the fallback for an unresolved stamp.
  const rawDockContent = resolveDockContent();
  const dockContent = rawDockContent
    .split('{{SUITE8_DESIGNATION}}')
    .join(suite8Name)
    .split('{{SCP_ROOT}}')
    .join(
      scpRoot && scpRoot.length > 0
        ? scpRoot
        : 'unresolved at spawn — use the fallback ladder in the newborn guard below',
    );
  const instanceContent = readFileSync(instancePath, 'utf8');

  // 3-layer compose · Base → Dock → Instance, joined by `\n\n---\n\n`.
  // Each layer is optional-by-presence: missing Base → start at Dock; missing Dock →
  // Base→Instance directly; missing both → Instance only (unreachable here since
  // suite8Name+Instance.md are guaranteed present at this point).
  const layers = [baseContent, dockContent, instanceContent].filter(
    (layer) => layer && layer.length > 0,
  );
  const composed = layers.join('\n\n---\n\n');

  const safeName = suite8Name.replace(/[^a-zA-Z0-9_-]/g, '_');
  const outPath = nodePath.join(bridgeRoot(), `scs-bridge-suite8-${safeName}.generated.md`);
  writeFileSync(outPath, composed, 'utf8');

  sdia('cli-handler.suite8.composed-prompt-written', {
    suite8Name,
    outPath,
    instancePath,
    layers: layers.length,
    dockIncluded: dockContent.length > 0,
  });
  return outPath;
}

// MD-1 · D-SB-3 · THE SCP-DIR RESOLVER (spawn re-root). Reads boundScps[scpName].dir
// from the per-project bridge.json (the D-SB-1 field). Secondary source: SCPs.json
// `path` resolved against process.cwd() (covers the pre-bind window where the SCP is
// installed but not yet a live boundScp). FailureNode: unknown scpName / absent both
// registries → undefined ⇒ the compose + roster fall back to the bridge root (unchanged
// behavior · the SCP simply has no sovereign boundary yet). NEVER throws.
function resolveScpDir(scpName: string | undefined): string | undefined {
  if (!scpName || scpName.length === 0) return undefined;
  // F2 · THE ROOT PIN · both registry reads resolve against bridgeRoot() (the C375
  // setBridgeRootOverride-aware / SCS_BRIDGE_ROOT_OVERRIDE-aware junction root), NOT
  // raw process.cwd(). The electron process's cwd can DIVERGE from the daemon's, so a
  // cwd-relative read reaches a stray dev-repo Cascades/ instead of the live install —
  // the same drift the paths.ts F3 pin cures for the registry write. bridgeRoot()
  // returns <root>/Cascades/Bridge: bridge.json sits directly there; SCPs.json is its
  // sibling one level up (<root>/Cascades/SCPs.json).
  const bridgeJsonPath = nodePath.join(bridgeRoot(), 'bridge.json');
  const scpsJsonPath = nodePath.join(bridgeRoot(), '..', 'SCPs.json');
  const scpsJsonBase = nodePath.dirname(scpsJsonPath); // <root>/Cascades — SCPs.json `path` base
  // 1. bridge.json boundScps[scpName].dir — the live, bridge-resolved absolute root.
  try {
    const raw = readFileSync(bridgeJsonPath, 'utf8');
    const bj = JSON.parse(raw) as { boundScps?: Record<string, { dir?: unknown }> };
    const dir = bj.boundScps?.[scpName]?.dir;
    if (typeof dir === 'string' && dir.length > 0) return dir;
  } catch {
    /* absent/malformed bridge.json → fall through to SCPs.json */
  }
  // 2. SCPs.json `path` resolved against the pinned Cascades dir (installed-but-not-
  //    yet-bound fallback).
  try {
    const raw = readFileSync(scpsJsonPath, 'utf8');
    const parsed = JSON.parse(raw) as { scps?: Array<{ name?: string; path?: string }> };
    const entry = Array.isArray(parsed.scps)
      ? parsed.scps.find((s) => s?.name === scpName && typeof s?.path === 'string')
      : undefined;
    if (entry && typeof entry.path === 'string' && entry.path.length > 0) {
      return nodePath.resolve(scpsJsonBase, entry.path);
    }
  } catch {
    /* absent/malformed SCPs.json → undefined (bridge-root fallback downstream) */
  }
  // F2 · THE GUARD-TELEMETRY LAW · both pinned reads missed (unknown scpName / neither
  // registry carried it). Name the two paths tried so the next spawn's bare-base cause
  // is diagnosable from the sdia stream (was it a wrong-root read, or a genuine miss).
  sdia('cli-handler.resolveScpDir.miss', {
    scpName,
    bridgeJsonPathTried: bridgeJsonPath,
    scpsJsonPathTried: scpsJsonPath,
  });
  return undefined;
}

export interface SessionFactoryOptions {
  command: string;
  args: string[];
  cwd?: string;
  env?: NodeJS.ProcessEnv;
}

export interface CliHandlerContext {
  preloadPath: string;
  rendererHtmlPath: string;
  // SWRM · the presenter window HTML, forwarded to SessionConfig for the shader-wrap split.
  presenterHtmlPath?: string;
  defaultSessionFactory: (id: string) => SessionFactoryOptions;
  onQuit: () => Promise<void>;
}

// RFCL+SSRF output bag · resolved per-session bridge state for PISF construction.
// C422 · THE SCOPE-PARITY PORT (Electron-process side): the daemon scanned+bound the
// per-workspace port and bridge.json carries it (the discovery rail — the C402 per-project
// read idiom). The Electron never shares the daemon's activeBridgePort module; it reads the
// file. 7111 fallback = the pre-scan world (single workspace · missing file).
function resolveBridgePortFromMetadata(): number {
  try {
    const raw = readFileSync(bridgeMetadataPathPerProject(process.cwd()), 'utf8');
    const port = (JSON.parse(raw) as { port?: number }).port;
    return typeof port === 'number' && port > 0 ? port : 7111;
  } catch {
    return 7111;
  }
}

// Populated by 'open-session' verb before makeSession; absent for 'run' verb.
interface SessionResolveOpts {
  claudeSessionId?: string;
  cwd: string;
  scpName?: string;
  // A-3 SAPR · parallel to scpName — the Suite 8 assigned to this session (NDEP name).
  suite8Name?: string;
  // MD-9 · D-MC-2 · Per-Instance Model Control · the per-session model recorded at spawn
  // (entry.model · a full AVAILABLE_MODELS id). Threaded from the registry-resolve leg;
  // buildBlcwSpawnOpts modelClause = `resolved.model ?? getActiveDefaultModel()`, so BOTH
  // new AND resume (and the anchor bridge-restart resume) inject the recorded model OVER
  // the global default. Absent ⇒ the global default (unchanged behavior).
  model?: string;
  settingsPath: string;
  mode: 'new' | 'resume';
  // RM-D2 · generated BDAP path (bridge.json-adjacent). Absent ⇒ no --append clause.
  // A-3 SAPR: when suite8Name is present this path points to the COMPOSED file
  // (base + Instance.md) rather than the plain BDAP base. BDAP contract preserved.
  appendSystemPromptFilePath?: string;
  // ASDR · W2 spawn-prompt · the name-resolved Onboard Vermillion text, injected as
  // claude's INITIAL POSITIONAL prompt (new-mode only). Set ONLY for the ANCHOR spawn
  // (mode 'new' + suite8Name + no-other-anchor); research workers leave it undefined.
  // Absent ⇒ graceful no-prompt spawn (never breaks spawn).
  onboardPromptText?: string;
  // MRQ-RC3 · WAPM · worker-scoped auto-permission marker, threaded from the
  // open-session handler's `entry?.isWorker` read. When true (asWorker research
  // spawn ONLY) buildBlcwSpawnOpts appends ` --permission-mode auto` to the claudeCmd
  // so the worker boots in Claude Code's classifier-gated auto mode (auto-accepts
  // safe Bash/WebSearch/edits, blocks risky). The FLAG route is required because
  // CC v2.1.142+ may silently ignore `defaultMode:"auto"` from a `--settings` file;
  // `--permission-mode auto` is always honored. Absent/false ⇒ no flag → anchors,
  // plain SCP sessions, and the install path keep the approval gate intact.
  isWorker?: boolean;
}

// open-install · explicit-command session envelope for the install instance.
// Distinct from SessionResolveOpts (registry-resolved): every field is supplied
// by the install pipeline, nothing is looked up. Reuses makeSession/Session.
// Two Demometers (open-install / open-session) share the makeSession/Session
// Diameter — neither parent to the other (Higher-Order Composition · §1.1).
interface InstallSpawnDescriptor {
  cwd: string;                        // user project dir
  seedPrompt?: string | null;         // claude positional [prompt]
  appendSystemPromptFilePath: string; // joined Suite 8 (--append-system-prompt-file)
  settingsPath: string;               // install spawn-settings.json (--settings)
  bridgeRootOverride: string;         // RBJP env injection · §3
}

// Shell-safe single-quote escape (POSIX idiom: '\'' to embed literal single quote).
// All other shell-special chars ($, `, \, ", etc.) are literal inside single quotes.
// Per S3 Q4 ruling · matches RC-to-AppKiller escapeForBashSingleQuote algorithm.
function shellQuote(s: string): string {
  return "'" + String(s).replace(/'/g, "'\\''") + "'";
}

// BLCW · Bash-Login-Claude-Wrap (S6-refined to '-ilc', S4 zsh-default).
// BPEI · Bridge-Pty-Env-Injection (5-key envelope · RC parity + S6 terminal experience).
// Constructs spawn opts for the 'open-session' verb. Coexists with defaultSessionFactory
// for the 'run' verb · neither replaces the other (Higher-Order Composition).
function buildBlcwSpawnOpts(id: string, resolved: SessionResolveOpts): SessionFactoryOptions {
  const shell = process.env.SHELL || '/bin/zsh';
  const cwdQ = shellQuote(resolved.cwd);
  const settingsQ = shellQuote(resolved.settingsPath);
  // RM-D2 · BDAP wiring · --append-system-prompt-file into BOTH branches.
  // Mirrors osTerminal.ts:87-100 appendClause (REFERENCE — osTerminal NOT modified).
  // Quoted because the bridge runtime dir may contain spaces (macOS Application Support).
  // Omitted when the generated BDAP path is absent (graceful: relay falls back to
  // whatever the session already carries — never breaks spawn).
  const appendClause = resolved.appendSystemPromptFilePath
    ? ` --append-system-prompt-file ${shellQuote(resolved.appendSystemPromptFilePath)}`
    : '';
  // ASDR · W2 spawn-prompt · ANCHOR-ONLY initial positional prompt.
  // When the anchor spawn (mode 'new' · no-other-anchor) carries the name-resolved
  // Onboard Vermillion, inject it as claude's INITIAL POSITIONAL prompt — BEFORE the
  // flags (`claude '<onboard>' --settings …`). shellQuote handles the multi-line text
  // (POSIX single-quote escape). Resume-mode and prompt-less spawns are unchanged
  // (graceful no-prompt when onboardPromptText is absent).
  const positionalPrompt =
    resolved.mode === 'new' &&
    typeof resolved.onboardPromptText === 'string' &&
    resolved.onboardPromptText.length > 0
      ? ` ${shellQuote(resolved.onboardPromptText)}`
      : '';
  // MRQ-RC3 · WAPM · worker-ONLY classifier-gated auto mode. When resolved.isWorker
  // is true (the asWorker research spawn) append the literal CC flag ` --permission-mode
  // auto` so the worker boots in auto mode (auto-accepts safe Bash/WebSearch/edits via
  // the classifier, blocks risky). The FLAG is the SOLE worker mechanism: it is always
  // honored, whereas `defaultMode:"auto"` from a `--settings` file may be silently
  // ignored by CC v2.1.142+ (Part B/C · MRQ-AUTOMODE-CLASSIFIER-VERMILLION.md). Plain
  // non-quoted flag. Empty for anchors / plain SCP / install spawns → NO flag → the
  // approval gate is intact (NO-REGRESSION binding).
  // C772 · W4 · THE AUTO MODE TOGGLE (filesystem-anchored): the Suite 8's OWN S8.json
  // (Extended/<name>/S8.json · the C481 rail the Auto-Spawn toggle already writes) carries
  // `autoMode: true` when the user toggles the HiFi-yellow pill. The bridge reads the TRUTH
  // at every spawn AND resume (no client threading — the file is the authority), so the flag
  // attaches at first spawn anor resume exactly. OR'd with the asWorker lane (unchanged).
  const readSuite8AutoMode = (name: string | undefined): boolean => {
    if (!name) return false;
    try {
      const root = resolveOwningScpRoot(name);
      if (!root) return false;
      const raw = readFileSync(
        nodePath.join(root, 'Cascades', 'Extended', name, 'S8.json'),
        'utf8',
      );
      return (JSON.parse(raw) as { autoMode?: unknown }).autoMode === true;
    } catch {
      return false; // absent anor malformed → the approval gate stays intact.
    }
  };
  const s8AutoMode = readSuite8AutoMode(resolved.suite8Name);
  const autoModeClause =
    resolved.isWorker === true || s8AutoMode ? ' --permission-mode auto' : '';
  if (s8AutoMode) {
    sdia('spawn.auto-mode', { suite8Name: resolved.suite8Name, source: 's8-json-toggle' });
  }
  // Model Control · EVERY spawn AND resume (general agent or Suite 8 alike) runs a model.
  // MD-9 · D-MC-2 · Per-Instance Model Control: the PER-SESSION recorded model (resolved.model,
  // read from entry.model in the registry-resolve leg) OVERRIDES the bridge global default
  // (bridge.json.defaultModel → activeDefaultModel · seeded Opus 4.8). Absent ⇒ the global.
  // Applies to new AND resume (and the anchor bridge-restart resume — all flow through here).
  // Full pinned ID (aliases drift). Same inline-clause idiom as autoModeClause.
  const modelClause = ` --model ${shellQuote(resolved.model ?? getActiveDefaultModel())}`;
  const claudeCmd =
    resolved.mode === 'resume' && resolved.claudeSessionId
      ? `cd ${cwdQ} && claude --resume ${shellQuote(resolved.claudeSessionId)} --settings ${settingsQ}${modelClause}${autoModeClause}${appendClause}`
      : `cd ${cwdQ} && claude${positionalPrompt} --settings ${settingsQ}${modelClause}${autoModeClause}${appendClause}`;
  const env: NodeJS.ProcessEnv = {
    ...process.env, // post-LCFPS: PATH carries login-shell augmentations
    SCS_BRIDGE_ULID: id,
    TERM: 'xterm-256color',
    LANG: process.env.LANG || 'en_US.UTF-8',
    COLORTERM: 'truecolor',
    // MRQ Shift+Tab fix · force Claude Code to LEGACY keyboard mode (not the kitty
    // protocol). CC gates kitty on TERM_PROGRAM ∈ {iTerm.app, kitty, WezTerm, ghostty};
    // the `...process.env` spread above LEAKS the host terminal's TERM_PROGRAM, so launching
    // the bridge from a kitty-allow-list terminal made CC-in-worker enable kitty and IGNORE
    // the legacy \x1b[Z back-tab (the AutoMode relay's sequence). Overriding it keeps CC in
    // legacy mode so \x1b[Z×3 toggles auto-accept exactly as designed, deterministically and
    // independent of which terminal the operator launched from.
    TERM_PROGRAM: 'scs-bridge',
  };
  if (resolved.scpName) {
    env.SCS_BRIDGE_SCP_NAME = resolved.scpName;
  }
  // A-3 SAPR · parallel env injection for suite8Name (hook processes read this).
  if (resolved.suite8Name) {
    env.SCS_BRIDGE_SUITE8_NAME = resolved.suite8Name;
  }
  return {
    command: shell,
    args: ['-ilc', claudeCmd],
    cwd: resolved.cwd,
    env,
  };
}

// open-install spawn-opts builder (§1.2.2). Modeled on buildBlcwSpawnOpts but
// ALWAYS mode='new' — NO resume branch, NO onboardPromptText/ASDR, NO isWorker/WAPM,
// NO SAPR compose. Every field arrives via the InstallSpawnDescriptor (nothing is
// looked up). Reuses the SAME proven pty/login-shell shape (`-ilc` + bash-login-wrap)
// the session path uses; only the command body + env injection differ.
function buildInstallSpawnOpts(id: string, d: InstallSpawnDescriptor): SessionFactoryOptions {
  const shell = process.env.SHELL || '/bin/zsh';
  // Positional seed prompt (the verbose Strategy S1 directive). Quoted (POSIX
  // single-quote escape) so multi-line text survives. Absent ⇒ no positional.
  const positionalPrompt =
    typeof d.seedPrompt === 'string' && d.seedPrompt.length > 0
      ? ' ' + shellQuote(d.seedPrompt)
      : '';
  // Command parity (§command parity): same `claude <seedPrompt> --settings <path>
  // --append-system-prompt-file <path>` invocation the OS-terminal path ran, in the
  // SAME user cwd. cd into the user project dir first (matches buildBlcwSpawnOpts).
  const claudeCmd =
    `cd ${shellQuote(d.cwd)} && claude${positionalPrompt} `
    + `--settings ${shellQuote(d.settingsPath)} `
    + `--append-system-prompt-file ${shellQuote(d.appendSystemPromptFilePath)}`
    // Model Control · the install instance also runs the bridge default model.
    + ` --model ${shellQuote(getActiveDefaultModel())}`;
  const env: NodeJS.ProcessEnv = {
    ...process.env, // post-LCFPS: PATH carries login-shell augmentations
    SCS_BRIDGE_ULID: id,
    TERM: 'xterm-256color',
    LANG: process.env.LANG || 'en_US.UTF-8',
    COLORTERM: 'truecolor',
    // Same legacy-keyboard pin as buildBlcwSpawnOpts (CC legacy mode, not kitty).
    TERM_PROGRAM: 'scs-bridge',
    // RBJP · §3 · the install child resolves bridge state at the bridge junction,
    // NOT the user project cwd. Captured at the bridge layer (spawnInstallInstance)
    // and threaded through the descriptor → JSON envelope → here, because the
    // open-install Electron-main process does NOT share the bridge's process.env.
    // Same discipline buildBlcwSpawnOpts uses for SCS_BRIDGE_SCP_NAME.
    SCS_BRIDGE_ROOT_OVERRIDE: d.bridgeRootOverride,
  };
  return {
    command: shell,
    args: ['-ilc', claudeCmd],
    cwd: d.cwd,
    env,
  };
}

// PISF · Per-Id-Session-Factory.
// When `resolved` is supplied (the 'open-session' verb's RFCL+SSRF result),
// construct BLCW spawn opts directly. Otherwise fall back to the static
// defaultSessionFactory (the 'run' verb's bare-shell test fixture path).
function makeSession(
  id: string,
  ctx: CliHandlerContext,
  resolved?: SessionResolveOpts,
  install?: InstallSpawnDescriptor,
): Session {
  // open-install branch (takes precedence): explicit-command envelope from the
  // install pipeline. The Session construction + spawn + ensureWindow + register
  // + onExit below are IDENTICAL to the session path (the proven xterm-in-
  // BrowserWindow) — only the spawn opts differ (buildInstallSpawnOpts).
  const opts: SessionFactoryOptions = install
    ? buildInstallSpawnOpts(id, install)
    : resolved
    ? buildBlcwSpawnOpts(id, resolved)
    : ctx.defaultSessionFactory(id);
  const session = new Session(
    {
      id,
      command: opts.command,
      args: opts.args,
      cwd: opts.cwd,
      env: opts.env,
    },
    {
      preloadPath: ctx.preloadPath,
      rendererHtmlPath: ctx.rendererHtmlPath,
      presenterHtmlPath: ctx.presenterHtmlPath,
    }
  );
  session.spawn();
  session.ensureWindow();
  sessionRegistry.register(id, session);
  session.onExit(() => {
    sessionRegistry.remove(id);
  });
  return session;
}

// STVI · buildOnboardValues
// Reads live filesystem state at anchor-spawn time and returns a values map for
// hydrateOnboardTemplate. ALWAYS populates BOTH STVI keys with value-or-fallback
// (S4 correction): a resolved value when the source is present, otherwise
// STVI_ABSENT_FALLBACK. Pairing this with replace-known-only hydration means the
// anchor always sees a meaningful string at the STVI positions while any
// genuinely-unknown {{VAR}} is left intact.
//
// Per-SCP extensibility: add new var→source mappings here. At current scale
// (two vars, one Suite 8) inline branching is sufficient.
async function buildOnboardValues(scpName: string): Promise<OnboardValues> {
  const values: OnboardValues = {};

  // SCP_WINDOW_ID — SWFB-bound Electron windowId from Cascades/SCPs.json.
  // A real number → its String form; null/absent → STVI_ABSENT_FALLBACK, and
  // the anchor calls scs_focus_bridge_window with no args (server resolves).
  const windowId = await lookupScpWindowId(scpName);
  values['SCP_WINDOW_ID'] =
    typeof windowId === 'number' ? String(windowId) : STVI_ABSENT_FALLBACK;

  // BRIDGE_ENDPOINT — endpoint field from Cascades/Bridge/bridge.json.
  // Graceful: absent or malformed bridge.json → STVI_ABSENT_FALLBACK.
  let endpoint = STVI_ABSENT_FALLBACK;
  try {
    const bridgeJsonPath = nodePath.join(process.cwd(), 'Cascades', 'Bridge', 'bridge.json');
    const meta = JSON.parse(readFileSync(bridgeJsonPath, 'utf8')) as {
      endpoint?: string;
    };
    if (typeof meta.endpoint === 'string' && meta.endpoint.length > 0) {
      endpoint = meta.endpoint;
    }
  } catch {
    // missing or malformed bridge.json — STVI_ABSENT_FALLBACK retained
  }
  values['BRIDGE_ENDPOINT'] = endpoint;

  return values;
}

export function createCliHandler(ctx: CliHandlerContext) {
  return async function handleCommand(payload: ControlCommand): Promise<ControlResponse> {
    const argv = payload.cmd;
    const sub = argv[0];

    switch (sub) {
      case 'run': {
        const id = argv[1] && !argv[1].startsWith('--') ? argv[1] : ulid();
        const session = makeSession(id, ctx);
        session.show(true);
        return { ok: true, data: { id } };
      }
      case 'show': {
        const id = argv[1];
        if (!id) return { ok: false, error: 'missing session id' };
        const session = sessionRegistry.get(id);
        if (!session) return { ok: false, error: 'session not found: ' + id };
        session.show(false);
        return { ok: true };
      }
      case 'focus': {
        const id = argv[1];
        if (!id) return { ok: false, error: 'missing session id' };
        const session = sessionRegistry.get(id);
        if (!session) return { ok: false, error: 'session not found: ' + id };
        session.focus();
        return { ok: true };
      }
      case 'hide': {
        const id = argv[1];
        if (!id) return { ok: false, error: 'missing session id' };
        const session = sessionRegistry.get(id);
        if (!session) return { ok: false, error: 'session not found: ' + id };
        session.hide();
        return { ok: true };
      }
      case 'type': {
        const id = argv[1];
        const text = argv.slice(2).join(' ');
        if (!id) return { ok: false, error: 'missing session id' };
        const session = sessionRegistry.get(id);
        if (!session) return { ok: false, error: 'session not found: ' + id };
        injectKeystrokes(session, text);
        return { ok: true };
      }
      case 'sendMessage': {
        sdia('fkis.cli.received', { argvLen: argv.length, hasArgsJson: !!argv[1], argsPreview: String(argv[1] ?? '').slice(0, 200) }, 'fkis');
        const argsJson = argv[1];
        if (!argsJson) {
          sdia('fkis.cli.bail', { reason: 'missing-args-json' }, 'fkis');
          return { ok: false, error: 'sendMessage requires JSON args argument' };
        }
        let envelope: { targetUlid?: string; text?: string; originScpName?: string; inFocus?: boolean };
        try {
          envelope = JSON.parse(argsJson);
        } catch (e) {
          sdia('fkis.cli.bail', { reason: 'json-parse-failed', error: String(e) }, 'fkis');
          return { ok: false, error: 'sendMessage args JSON parse failed: ' + String(e) };
        }
        // C404 · THE LAST ORIGIN GATE. originScpName is OPTIONAL on the delivery path —
        // executeFkis handles an unresolvable origin gracefully (origin-MISSING → deliver
        // without the focus return; C402-proven). The prior `!originScpName` term dropped
        // the C403 relay's legitimate empty-origin envelopes AFTER relaySend had already
        // reported delivered (the four-layer ACK abyss in one gate). Origin absence must
        // never cost the payload — only the focus-return nicety.
        const { targetUlid, text, originScpName } = envelope;
        if (!targetUlid || typeof text !== 'string') {
          sdia('fkis.cli.bail', {
            reason: 'envelope-validation-failed',
            hasTargetUlid: !!targetUlid,
            hasText: typeof text === 'string',
            hasOriginScpName: !!originScpName,
          }, 'fkis');
          return {
            ok: false,
            error: 'sendMessage requires {targetUlid, text}',
          };
        }
        const origin = typeof originScpName === 'string' ? originScpName : '';
        sdia('fkis.cli.envelope-parsed', {
          targetUlid,
          textLength: text.length,
          originScpName: origin || null,
        }, 'fkis');
        // C770 · THE DROPPED-FLAG SEAT (the four-hop flight proved it): the socket carried
        // inFocus intact and THIS rebuild discarded it — the sole break in the whole chain.
        const result = await executeFkis({
          targetUlid,
          text,
          originScpName: origin,
          inFocus: envelope.inFocus === true,
        });
        sdia('fkis.cli.executeFkis-result', {
          targetUlid,
          ok: result.ok,
          charsStreamed: result.charsStreamed ?? null,
          error: result.error ?? null,
        }, 'fkis');
        return result.ok
          ? { ok: true, data: { charsStreamed: result.charsStreamed } }
          : {
              ok: false,
              error: result.error ?? 'unknown FKIS error',
              data: { charsStreamed: result.charsStreamed },
            };
      }
      case 'press':
      case 'key': {
        const id = argv[1];
        const key = argv[2];
        if (!id || !key) return { ok: false, error: 'missing session id or key' };
        const session = sessionRegistry.get(id);
        if (!session) return { ok: false, error: 'session not found: ' + id };
        const mapped = mapKey(key);
        session.sendInput(mapped);
        return { ok: true };
      }
      // MRQ Shift+Tab fix · MVP-RC3 · RAW-byte keystroke transport for AutoMode.
      // PARALLEL to case 'key' (the proven arrow-key raw path) but takes a literal
      // byte STRING (e.g. '\x1b[Z\x1b[Z\x1b[Z') from a JSON envelope rather than a
      // mnemonic key name. Routes straight to session.sendInput → ptyProcess.write
      // (session.ts:289 RAW pty byte write — ESC 0x1b survives). This is DELIBERATELY
      // NOT the FKIS char-event path (case 'sendMessage' → executeFkis →
      // sendInputViaKeystroke → sendInputEvent{type:'char'} session.ts:298, which
      // drops the non-printable ESC and produced the literal `[Z[Z[Z` symptom).
      // Envelope mirrors 'sendMessage': JSON arg via spawn argv (ESC survives
      // JSON.stringify→argv→JSON.parse · proven Concluder · WGB Part B.4).
      case 'sendRawKeys': {
        const argsJson = argv[1];
        if (!argsJson) {
          return { ok: false, error: 'sendRawKeys requires JSON args argument' };
        }
        let envelope: { targetUlid?: string; bytes?: string };
        try {
          envelope = JSON.parse(argsJson);
        } catch (e) {
          return { ok: false, error: 'sendRawKeys args JSON parse failed: ' + String(e) };
        }
        const { targetUlid, bytes } = envelope;
        if (!targetUlid || typeof bytes !== 'string') {
          return { ok: false, error: 'sendRawKeys requires {targetUlid, bytes}' };
        }
        const session = sessionRegistry.get(targetUlid);
        if (!session) return { ok: false, error: 'session not found: ' + targetUlid };
        session.sendInput(bytes);
        return { ok: true };
      }
      case 'kill': {
        const id = argv[1];
        if (!id) return { ok: false, error: 'missing session id' };
        const session = sessionRegistry.get(id);
        if (!session) return { ok: false, error: 'session not found: ' + id };
        // D-GTC · the per-SCP EXIT / scp_stop terminal reap (the field-incident trigger).
        // Ctrl-C the `claude` CLI and await its transcript flush (bounded · never hangs)
        // BEFORE the hard dispose() reaps the pty + windows. dispose() stays synchronous
        // for its own re-entrancy path; here we simply gate it on the graceful flush.
        await session.gracefulClose(5000);
        session.dispose();
        sessionRegistry.remove(id);
        return { ok: true };
      }
      // MVP-RC3 D2 · RRRRQ resize verb · mirrors case 'kill' lookup; scales the
      // session's BrowserWindow bounds by scalePct. `getWindow(): BrowserWindow | null`
      // (session.ts:323); setBounds/getBounds are Electron core (BrowserWindow already
      // imported session.ts:2). Guard `win && !win.isDestroyed()` → null/destroyed
      // window no-ops safely (H1-aligned advance-on-no-op). Fired AFTER focus (relay
      // ordering) so the window exists by resize time.
      case 'resize': {
        const id = argv[1];
        const scalePct = parseFloat(argv[2] ?? '1');
        if (!id) return { ok: false, error: 'missing session id' };
        const session = sessionRegistry.get(id);
        if (!session) return { ok: false, error: 'session not found: ' + id };
        const win = session.getWindow();
        if (win && !win.isDestroyed()) {
          const b = win.getBounds();
          win.setBounds({
            x: b.x,
            y: b.y,
            width: Math.round(b.width * scalePct),
            height: Math.round(b.height * scalePct),
          });
        }
        return { ok: true };
      }
      case 'list': {
        return { ok: true, data: sessionRegistry.listIds() };
      }
      case 'status': {
        return {
          ok: true,
          data: {
            sessions: sessionRegistry.listIds(),
            count: sessionRegistry.size(),
          },
        };
      }
      case 'quit': {
        await ctx.onQuit();
        return { ok: true };
      }
      case 'open-url': {
        const url = argv[1];
        if (typeof url !== 'string' || url.length === 0) {
          return { ok: false, error: 'open-url: url argument required' };
        }
        const focusFlag = argv.includes('--focus');
        // SWFB · F1 THE NAME THREAD (window-close signal cure): scpName resolution, ARG-FIRST
        // and HONEST. The explicit `--scp-name <name>` is the spawning site's own knowledge
        // (F1 now threads it from ALL three open-url callers), so it is authoritative. Only when
        // the arg is absent do we resolve the RUNNING SCP's identity from bridge.json
        // (activeScp → boundScps → installedScps). CRITICAL HONESTY CHANGE: a genuinely unknown
        // name resolves to `undefined` WITH an sdia note — NEVER a silent 'template' masquerade
        // onto a real SCP's window (the old `?? 'template'` mis-bound the id, which is what made
        // signalScpWindowClosed's scpName undefined → silent no-op → zero close events).
        const scpNameIdx = argv.indexOf('--scp-name');
        const argScpNameRaw =
          scpNameIdx >= 0 && typeof argv[scpNameIdx + 1] === 'string'
            ? argv[scpNameIdx + 1]
            : undefined;
        const argScpName =
          typeof argScpNameRaw === 'string' && argScpNameRaw.length > 0 && argScpNameRaw !== 'template'
            ? argScpNameRaw
            : undefined;
        const envScpName =
          typeof process.env.SCS_BRIDGE_ORIGIN_SCP === 'string' &&
          process.env.SCS_BRIDGE_ORIGIN_SCP.length > 0 &&
          process.env.SCS_BRIDGE_ORIGIN_SCP !== 'template'
            ? process.env.SCS_BRIDGE_ORIGIN_SCP
            : undefined;
        try {
          // Arg-first → env → bridge.json. A genuinely unknown name stays undefined (no 'template'
          // fallback). openUrlWindow tolerates undefined scpName (flat URL window · no FSM key).
          const effectiveScpName =
            argScpName ?? envScpName ?? resolveActiveScpName() ?? undefined;
          if (effectiveScpName === undefined) {
            sdia('cli-handler.open-url.scpName-unknown', {
              url,
              argScpNameRaw: argScpNameRaw ?? null,
              envScp: process.env.SCS_BRIDGE_ORIGIN_SCP ?? null,
              note: 'no honest scpName resolved · window opens flat · no FSM close signal',
            });
          }
          const win = openUrlWindow({ url, focus: focusFlag, scpName: effectiveScpName });
          // SWFB · bind this window's Electron id under the SCP name so the refocus tool can
          // later focus THIS specific window by id — ONLY when we have an honest name. Binding
          // an id under a masqueraded 'template' key is exactly the mis-bind that broke the
          // close signal; an unknown-name window opens flat (no id binding, no FSM key).
          const visibleId = getVisibleScpWindowId(win.id);
          if (effectiveScpName !== undefined) {
            void setScpWindowId(effectiveScpName, visibleId);
          }
          sdia('cli-handler.open-url.window-bound', {
            scpName: effectiveScpName ?? null,
            argScpName: argScpNameRaw ?? null,
            winId: win.id,
            visibleId,
            windowId: win.id,
          });
          return { ok: true, data: { windowId: win.id } };
        } catch (e) {
          return { ok: false, error: String(e) };
        }
      }
      case 'close-url': {
        const url = argv[1];
        if (typeof url !== 'string' || url.length === 0) {
          return { ok: false, error: 'close-url: url argument required' };
        }
        const found = closeUrlWindow(url);
        return found
          ? { ok: true }
          : { ok: false, error: 'close-url: no window for url' };
      }
      // W3.5 (C781) · scp_focus_suite8_page: NAVIGATE the bound SCP window to the new Suite 8
      // page (loadURL of the ?island= deep-link) AND bring it forward. windowId -1 → fall back
      // to the url-window match on the base URL. Graceful ok:false when nothing resolves.
      case 'focus-suite8-page': {
        const id = Number(argv[1]);
        const navUrl = argv[2];
        if (typeof navUrl !== 'string' || navUrl.length === 0) {
          return { ok: false, error: 'focus-suite8-page: navUrl argument required' };
        }
        const { BrowserWindow } = await import('electron');
        let win = Number.isFinite(id) && id > 0 ? BrowserWindow.fromId(id) : null;
        if (!win || win.isDestroyed()) {
          // fall back: match the existing window by the BASE url (strip the deep-link query).
          const base = navUrl.split('?')[0];
          win = getVisibleUrlWindow(base) ?? null;
        }
        if (!win || win.isDestroyed()) {
          sdia('cli-handler.focus-suite8-page.miss', { id, navUrl });
          return { ok: false, error: 'focus-suite8-page: no window resolved' };
        }
        void win.webContents.loadURL(navUrl);
        win.show();
        win.focus();
        win.moveTop();
        sdia('cli-handler.focus-suite8-page.done', { id: win.id, navUrl });
        return { ok: true };
      }
      case 'focus-url': {
        const url = argv[1];
        if (typeof url !== 'string' || url.length === 0) {
          return { ok: false, error: 'focus-url: url argument required' };
        }
        const found = focusUrlWindow(url);
        return found
          ? { ok: true }
          : { ok: false, error: 'focus-url: no window for url' };
      }
      // SWFB · focus the SCP page window by its bound Electron windowId —
      // deterministic "specific not last" refocus (BrowserWindow.fromId).
      case 'focus-by-id': {
        const id = Number(argv[1]);
        if (!Number.isFinite(id)) {
          return { ok: false, error: 'focus-by-id: numeric id argument required' };
        }
        const ok = focusWindowById(id);
        sdia('cli-handler.focus-by-id.resolved', { id, found: ok });
        return ok
          ? { ok: true }
          : { ok: false, error: 'focus-by-id: no window for id' };
      }
      // SES · THE STOP RAIL · close the SCP page window by its bound Electron
      // windowId — the sibling of focus-by-id (electronWindow.closeWindowById →
      // BrowserWindow.fromId(id).close()). The `win.on('closed')` handler then
      // cascades the FULL stop (scpLifecycleWindowClosed surface→pending +
      // scpSpawnManagerKillRequested SIGTERM+FSM+re-seat). scp_stop resolves the
      // id via lookupScpWindowId(scpName) and drives this verb.
      case 'close-by-id': {
        const id = Number(argv[1]);
        if (!Number.isFinite(id)) {
          return { ok: false, error: 'close-by-id: numeric id argument required' };
        }
        const ok = closeWindowById(id);
        sdia('cli-handler.close-by-id.resolved', { id, found: ok });
        return ok
          ? { ok: true }
          : { ok: false, error: 'close-by-id: no window for id' };
      }
      // D-N3 · Neon PlayTester · execute an atomic step sequence against a target window.
      // WINDOW-GENERAL: the SCP is the binding location but a terminal session window is
      // equally targetable — the SCS-Bridge is the Grounding Literal Bridge. Target resolution:
      // windowId → sessionId (terminal) → scpName → the ACTIVE SCP (bridge.json).
      case 'orchestrate-window': {
        const rawPayload = argv[1];
        if (typeof rawPayload !== 'string' || rawPayload.length === 0) {
          return { ok: false, error: 'orchestrate-window: JSON payload argument required' };
        }
        let parsed: {
          target?: { windowId?: number; sessionId?: string; scpName?: string };
          steps?: OrchestrateStep[];
          runId?: string;
        };
        try {
          parsed = JSON.parse(rawPayload);
        } catch (e) {
          return { ok: false, error: `orchestrate-window: invalid JSON payload: ${String(e)}` };
        }
        const steps = Array.isArray(parsed.steps) ? parsed.steps : [];
        if (steps.length === 0) {
          return { ok: false, error: 'orchestrate-window: steps[] required' };
        }
        const runId =
          typeof parsed.runId === 'string' && parsed.runId.length > 0
            ? parsed.runId.replace(/[^a-zA-Z0-9_-]/g, '_')
            : `run-${Date.now()}`;
        const { win, resolvedVia } = await resolvePlayTestTargetWindow(parsed.target ?? {});
        if (!win || win.isDestroyed()) {
          sdia('cli-handler.orchestrate-window.no-target', { resolvedVia, runId });
          return {
            ok: false,
            error: `orchestrate-window: no live window for target (via ${resolvedVia || 'none'})`,
          };
        }
        sdia('cli-handler.orchestrate-window.begin', {
          resolvedVia,
          runId,
          windowId: win.id,
          stepCount: steps.length,
        });
        const data = await executeOrchestrationSequence(win, steps, runId);
        return { ok: data.ok || data.partial, data };
      }
      // D-N2 · Neon PlayTester · capture the target window's CURRENT render to a PNG.
      // Returns the STREAMED pre-shader frame for a shader-wrapped (offscreen) window —
      // "the render context PRIOR to the shader pass" — else capturePage for flat windows.
      case 'capture-window-render': {
        const rawPayload = argv[1];
        let parsed: {
          target?: { windowId?: number; sessionId?: string; scpName?: string };
          label?: string;
          runId?: string;
        } = {};
        if (typeof rawPayload === 'string' && rawPayload.length > 0) {
          try {
            parsed = JSON.parse(rawPayload);
          } catch (e) {
            return { ok: false, error: `capture-window-render: invalid JSON payload: ${String(e)}` };
          }
        }
        const runId =
          typeof parsed.runId === 'string' && parsed.runId.length > 0
            ? parsed.runId.replace(/[^a-zA-Z0-9_-]/g, '_')
            : `run-${Date.now()}`;
        const { win, resolvedVia } = await resolvePlayTestTargetWindow(parsed.target ?? {});
        if (!win || win.isDestroyed()) {
          sdia('cli-handler.capture-window-render.no-target', { resolvedVia, runId });
          return {
            ok: false,
            error: `capture-window-render: no live window for target (via ${resolvedVia})`,
          };
        }
        const data = await captureWindowRender(win, parsed.label ?? 'render', runId);
        sdia('cli-handler.capture-window-render.done', {
          resolvedVia,
          runId,
          windowId: win.id,
          ok: data.ok,
          mode: data.mode ?? null,
          path: data.path ?? null,
        });
        return { ok: data.ok, error: data.ok ? undefined : data.reason, data };
      }
      case 'open-session': {
        const sessionUlid = argv[1];
        if (typeof sessionUlid !== 'string' || sessionUlid.length === 0) {
          return { ok: false, error: 'open-session: sessionUlid argument required' };
        }
        if (sessionRegistry.has(sessionUlid)) {
          const existing = sessionRegistry.get(sessionUlid);
          sdia('session.open.hot-reuse', { ulid: sessionUlid });
          existing?.markResumed();
          existing?.show(true);
          // SPGR · Stale-Predicate-Guard-Removal · hot-reuse must re-assert launched
          // status so the Vue send-gate (status !== 'launched') does not silently block
          // a session that is genuinely interactive. Boot markAllSessionsOffline /
          // markSessionOffline can leave the registry status stale 'offline' for a ULID
          // whose Session object is still hot; the focus-only reuse path never re-promoted
          // it. Status-only write (partial meta) — does NOT clobber claudePid /
          // claudeSessionId / launchedAt (updateSessionLaunchMeta writes only defined fields).
          await updateSessionLaunchMeta(sessionUlid, { status: 'launched' });
          // F1 · THE COMPOSE-ON-REUSE. The hot-reuse branch historically exited HERE,
          // running NO compose refresh — so a re-engaged / re-used session kept whatever
          // spawn-settings + append file it was born with (bare scs-bridge-base for a
          // session first created without suite8 compose). Run the SAME refresh the full
          // open-session path runs below (resolveScpDir → resolveComposedAppendPath →
          // writeSpawnSettings with suite8Name + scpDir), so the composed suite8 append
          // file is (re)written to disk and the settings file carries the current
          // scpName/suite8Name/scpDir.
          //
          // WHAT THE REFRESH COVERS ON EACH SUB-PATH:
          //  · Pure-focus hot path (NO respawn — the existing window is merely shown):
          //    the running Claude process does NOT re-read the append file, so THIS
          //    invocation does not change the live prompt. What it DOES do is (re)write
          //    the composed file + refresh the settings so the NEXT actual `--resume`
          //    respawn of this ULID picks the composed file up via appendClause. It
          //    converts a would-be-bare next-respawn into a composed one.
          //  · Any subsequent respawn (--resume) reads the just-refreshed
          //    appendSystemPromptFilePath → the suite8 identity is present from that
          //    respawn onward. The refresh is idempotent (regenerates from current
          //    Instance.md), so repeated hot-reuses converge on the current compose.
          try {
            const reuseSessions = await listSessions();
            const reuseEntry = reuseSessions.find((s) => s.id === sessionUlid);
            const reuseScpName = reuseEntry?.scpName;
            const reuseSuite8Name = reuseEntry?.suite8Name;
            const reuseScpDir = resolveScpDir(reuseScpName);
            await writeSpawnSettings(
              sessionUlid,
              reuseScpName,
              resolveBridgePortFromMetadata(),
              reuseSuite8Name,
              reuseScpDir,
            );
            const reuseGeneratedBasePromptPath = resolveGeneratedBasePromptPath();
            const reuseBasePath = existsSync(reuseGeneratedBasePromptPath)
              ? reuseGeneratedBasePromptPath
              : undefined;
            const reuseComposedPath = resolveComposedAppendPath(
              reuseBasePath,
              reuseSuite8Name,
              reuseScpDir,
            );
            sdia('cli-handler.open-session.hot-reuse-compose-refresh', {
              ulid: sessionUlid,
              scpName: reuseScpName ?? null,
              suite8Name: reuseSuite8Name ?? null,
              scpDir: reuseScpDir ?? null,
              composedPath: reuseComposedPath ?? null,
              // NOTE: no respawn occurs on this branch — refresh targets the NEXT resume.
              refreshTargetsNextResume: true,
            });
          } catch (e) {
            // Graceful: a refresh failure must NEVER break the hot-reuse show/return.
            // The session stays interactive on its prior settings; the miss is logged.
            sdia('cli-handler.open-session.hot-reuse-compose-refresh-error', {
              ulid: sessionUlid,
              error: String(e),
            });
          }
          return { ok: true, data: { id: sessionUlid, alreadyRunning: true } };
        }
        try {
          // RFCL · Registry-First-Claude-Lookup
          // Resolves claudeSessionId + cwd + scpName + suite8Name from bridge state.
          // Mirrors launchInformative (manager.ts:173-235): registry first,
          // meta.json fallback. .catch on loadSessionMeta handles the rare
          // orphan case (entry exists but meta.json missing — synthesized).
          const sessions = await listSessions();
          const entry = sessions.find((s) => s.id === sessionUlid);
          const meta = await loadSessionMeta(sessionUlid).catch(() => null);
          const claudeSessionId = entry?.claudeSessionId ?? meta?.claudeSessionId;
          const cwd = entry?.cwd ?? meta?.cwd ?? process.cwd();
          const scpName = entry?.scpName ?? meta?.scpName;
          // A-3 SAPR · suite8Name resolution (registry only — not persisted to meta.json)
          const suite8Name = entry?.suite8Name;
          // MD-9 · D-MC-2 · Per-Instance Model Control · the recorded per-session model
          // (registry only). Threaded into resolved.model so buildBlcwSpawnOpts injects it
          // OVER the global default (new AND resume). Undefined ⇒ the global default.
          // Haiku pin shim: old-recorded sessions may carry the retired
          // 'claude-haiku-4-5' alias — forward it to the pinned id so resolved.model
          // still injects a valid catalog id (undefined ⇒ the global default).
          const model = entry?.model ? normalizeModelId(entry.model) : entry?.model;
          // MD-1 · D-SB-3 · THE SPAWN RE-ROOT. Resolve this session's SCP install dir
          // (boundScps[scpName].dir → SCPs.json path fallback). When present, the Suite 8
          // compose + Onboard read re-root to the SCP-LOCAL Cascades/8_SUITES/<name>/ —
          // the Sovereignty Boundary. Undefined ⇒ the bridge root (unchanged behavior).
          const scpDir = resolveScpDir(scpName);
          // MRQ-RC3 · WAPM · worker auto-permission resolution (registry only). The spawn
          // quality stamped entry.isWorker=true on asWorker spawns BEFORE this detached
          // open-session process fired; reading it here is the load-bearing scoping gate —
          // it is threaded into the resolved opts so buildBlcwSpawnOpts appends the
          // ` --permission-mode auto` CLI flag for workers ONLY (the FLAG route, always
          // honored; the settings `defaultMode` emit was retired). Anchors / plain SCP
          // sessions have isWorker undefined → no flag → approval gate intact.
          const isWorker = entry?.isWorker === true;
          const mode: 'new' | 'resume' = claudeSessionId ? 'resume' : 'new';

          // ASDR · W2 spawn-prompt · ANCHOR-spawn detection + name-resolved Onboard read.
          // This spawn is the ANCHOR (and receives the Onboard Vermillion as its initial
          // positional prompt) ONLY when: mode 'new' (fresh, not a resume) + suite8Name set
          // + there is NO OTHER anchor of that suite8Name already in the registry. The
          // FSBA/STDB research workers spawn when an anchor ALREADY exists → the find()
          // matches → onboardPromptText stays undefined → research-worker-safe (no prompt).
          // H: the no-OTHER-anchor predicate EXCLUDES this session's own ulid (s.id !== sessionUlid)
          // so a hot-reuse / self entry never masks the spawn as "anchor-exists".
          let onboardPromptText: string | undefined;
          if (mode === 'new' && suite8Name) {
            const otherAnchorExists = sessions.some(
              (s) =>
                s.suite8Name === suite8Name &&
                s.isAnchor === true &&
                s.id !== sessionUlid,
            );
            if (!otherAnchorExists) {
              // The anchor spawn — resolve the per-Suite-8 Onboard.md (parallel to Instance.md)
              // and read it. Absent / unreadable → graceful no-prompt spawn (never break spawn).
              // C378 · THE ONBOARD SOVEREIGNTY THREAD: an SCP-resident Suite 8 keeps its
              // Onboard.md in the SCP's OWN Cascades/8_SUITES/<name>/ (0 at the workspace
              // root, 1 SCP-local). The prior single-path resolveSuite8OnboardMd(name, scpDir)
              // picked the SCP dir XOR the workspace root — a defined-but-absent SCP-local
              // Onboard.md spawned the anchor BARE with no fall-through. Try BOTH grounds
              // (SCP-local FIRST, workspace SECOND) and NAME which ground resolved.
              const onboardResolution = resolveSuite8OnboardMdAcrossGrounds(
                suite8Name,
                scpDir,
                existsSync,
              );
              const onboardPath = onboardResolution.path;
              // THE GUARD-TELEMETRY LAW · the next spawn names its seed source: which
              // ground resolved (scp-local | workspace | absent) + both paths tried.
              sdia('cli-handler.open-session.onboard.resolve', {
                ulid: sessionUlid,
                suite8Name,
                scpName: scpName ?? null,
                scpDir: scpDir ?? null,
                ground: onboardResolution.ground,
                resolvedPath: onboardResolution.ground === 'absent' ? null : onboardPath,
                scpLocalPathTried: onboardResolution.scpLocalPath ?? null,
                workspacePathTried: onboardResolution.workspacePath,
              });
              if (onboardResolution.ground !== 'absent' && existsSync(onboardPath)) {
                try {
                  const rawOnboard = readFileSync(onboardPath, 'utf8');
                  const onboardValues = await buildOnboardValues(scpName ?? 'template');
                  const hydratedOnboard = hydrateOnboardTemplate(rawOnboard, onboardValues);
                  sdia('cli-handler.open-session.stvi-inject', {
                    scpName: scpName ?? 'template',
                    windowIdResolved: onboardValues.SCP_WINDOW_ID,
                    endpointResolved: onboardValues.BRIDGE_ENDPOINT,
                    promptLength: hydratedOnboard.length,
                  });
                  // SMO · prepend the generic Shatterite Menu How (the "How"), read
                  // beside the bridge module, to the STVI-hydrated Onboard.md (the
                  // "Why"). Graceful-absent: on any read failure the menuHow stays ''
                  // and composeAnchorOnboardPrompt returns the hydrated Onboard alone,
                  // so the spawn never breaks.
                  let menuHow = '';
                  try {
                    const menuHowPath = resolveShatteriteMenuMd();
                    if (existsSync(menuHowPath)) {
                      menuHow = readFileSync(menuHowPath, 'utf8');
                    }
                  } catch (e) {
                    sdia('cli-handler.open-session.shatterite-menu-read-error', {
                      ulid: sessionUlid,
                      suite8Name,
                      error: String(e),
                    });
                  }
                  onboardPromptText = composeAnchorOnboardPrompt(menuHow, hydratedOnboard);
                  sdia('cli-handler.open-session.smo-prepend', {
                    ulid: sessionUlid,
                    suite8Name,
                    menuHowChars: menuHow.length,
                    composedChars: onboardPromptText.length,
                  });
                } catch (e) {
                  sdia('cli-handler.open-session.onboard-read-error', {
                    ulid: sessionUlid,
                    suite8Name,
                    onboardPath,
                    error: String(e),
                  });
                }
              } else {
                // C378 · both grounds absent → graceful no-seed spawn (unchanged
                // behavior). onboard.resolve above already named ground='absent'.
                sdia('cli-handler.open-session.onboard-md-missing', {
                  ulid: sessionUlid,
                  suite8Name,
                  ground: onboardResolution.ground,
                  scpLocalPathTried: onboardResolution.scpLocalPath ?? null,
                  workspacePathTried: onboardResolution.workspacePath,
                });
              }
            }
            sdia('cli-handler.open-session.asdr-anchor-gate', {
              ulid: sessionUlid,
              suite8Name,
              otherAnchorExists,
              onboardPromptInjected: typeof onboardPromptText === 'string',
              onboardPromptLength: onboardPromptText?.length ?? 0,
            });
          }

          // W1.3 · D2 Recurse-5 BNPC diagnostic · pre/post writeSpawnSettings
          // Proves cli-handler IS the Electron-context caller invoking the BNPC
          // write site. Captures process.execPath + process.argv[1] AT THIS LAYER
          // to compare against the values spawnSettings.ts captures internally.
          sdia('cli-handler.open-session.write-spawn-settings', {
            ulid: sessionUlid,
            scpName: scpName ?? null,
            suite8Name: suite8Name ?? null,
            isWorker, // MRQ-RC3 · WAPM · trace the worker auto-accept scoping decision
            processExecPath: process.execPath,
            processArgv1: process.argv[1] ?? null,
            isElectronCtx: !!process.versions.electron,
          });
          // SSRF · Spawn-Settings-Refresh-on-engage
          // Refresh hooks JSON so SessionStart fires with current scpName + hook
          // command paths. A-3 SAPR: suite8Name threaded so SCS_BRIDGE_SUITE8_NAME
          // is also injected into the SessionStart hook command string.
          // MRQ-RC3 · WAPM: the worker auto-permission is NO LONGER carried in the
          // settings file — `isWorker` now drives the ` --permission-mode auto` CLI
          // flag in buildBlcwSpawnOpts (the FLAG route, always honored; the settings
          // `defaultMode` emit was retired). The settings file is mode-agnostic again.
          await writeSpawnSettings(sessionUlid, scpName, resolveBridgePortFromMetadata(), suite8Name, scpDir);
          const settingsPath = spawnSettingsPath(sessionUlid);
          sdia('cli-handler.open-session.spawn-settings-written', {
            ulid: sessionUlid,
            path: settingsPath,
          });

          // RM-D2 · BDAP resolution (SSGH). The generated Base prompt is written at
          // bridge startup (port already substituted) sibling to bridge.json. Resolve
          // its deterministic path; gate on existence so a missing file (older bridge /
          // generation skipped) yields undefined → appendClause omitted → graceful
          // no-append spawn (--append-system-prompt-file at a nonexistent path would
          // otherwise fail the spawn). Existence is normally guaranteed by Phase B startup.
          const generatedBasePromptPath = resolveGeneratedBasePromptPath();
          const basePath = existsSync(generatedBasePromptPath)
            ? generatedBasePromptPath
            : undefined;
          // A-3 SAPR · BDAP composition: when suite8Name is set, compose BDAP base +
          // Instance.md into a single combined file. BDAP relay contract is preserved —
          // the base prompt content is never dropped. If Instance.md is missing the
          // plain basePath is returned (graceful fallback, no spawn breakage).
          const appendSystemPromptFilePath = resolveComposedAppendPath(basePath, suite8Name, scpDir);
          sdia('cli-handler.open-session.base-prompt-resolved', {
            ulid: sessionUlid,
            path: generatedBasePromptPath,
            exists: !!basePath,
            suite8Name: suite8Name ?? null,
            scpDir: scpDir ?? null,
            composedPath: appendSystemPromptFilePath ?? null,
          });

          // PISF · Per-Id-Session-Factory (BLCW + BPEI constructed inside makeSession).
          const session = makeSession(sessionUlid, ctx, {
            claudeSessionId,
            cwd,
            scpName,
            suite8Name,
            model,                      // MD-9 · D-MC-2 · per-instance recorded model → modelClause override
            settingsPath,
            mode,
            appendSystemPromptFilePath, // RM-D2 · A-3 SAPR: composed path when suite8Name present
            onboardPromptText,          // ASDR · W2: anchor-only initial positional prompt (undefined for workers)
            isWorker,                   // MRQ-RC3 · WAPM: drives worker-only ` --permission-mode auto` CLI flag
          });
          // DM-D4 W1 (Ochre-E §B.5 · S4 §0 MAIN-side correction) · mark ReEngagement
          // here at the Electron-main resume path (NOT daemon manager.ts:173).
          if (mode === 'resume') {
            session.markResumed();
          }
          session.show(true);
          return { ok: true, data: { id: sessionUlid, alreadyRunning: false, mode } };
        } catch (e) {
          // Install recurse: this error previously returned into a DETACHED fire-and-forget
          // relay and evaporated (the silent ReEngage failure). Surface it in electron-debug.
          sdia('cli-handler.open-session.error', { ulid: sessionUlid, error: String(e) });
          return { ok: false, error: String(e) };
        }
      }
      case 'open-install': {
        // §1.2.4 · the install instance · explicit-command envelope, NOT a
        // registry-resolved session. JSON-via-argv (not positional) because
        // seedPrompt is multi-line verbose text and appendSystemPromptFilePath may
        // contain spaces (macOS Application Support); JSON survives
        // JSON.stringify → argv → JSON.parse (proven by sendMessage/sendRawKeys).
        const argsJson = argv[1];
        if (!argsJson) return { ok: false, error: 'open-install requires JSON args' };
        let d: InstallSpawnDescriptor & { ulid: string };
        try {
          d = JSON.parse(argsJson);
        } catch (e) {
          return { ok: false, error: 'open-install JSON parse failed: ' + String(e) };
        }
        if (!d.ulid || !d.cwd || !d.appendSystemPromptFilePath || !d.settingsPath) {
          return {
            ok: false,
            error: 'open-install requires {ulid,cwd,appendSystemPromptFilePath,settingsPath}',
          };
        }
        if (sessionRegistry.has(d.ulid)) {
          // hot-reuse focus (parity with open-session:561)
          const ex = sessionRegistry.get(d.ulid);
          ex?.show(true);
          return { ok: true, data: { id: d.ulid, alreadyRunning: true } };
        }
        const session = makeSession(d.ulid, ctx, undefined, d); // install descriptor branch
        session.show(true); // focus the install window so SCS-Bridge branding is visible
        return { ok: true, data: { id: d.ulid, alreadyRunning: false } };
      }
      case 'list-sessions': {
        return { ok: true, data: sessionRegistry.listIds() };
      }
      default:
        // W1.4 · D2 Recurse-5 BNPC diagnostic · surface silent-failure path
        // Pre-fix Concluder evidence: this branch's `grep -c unknown-subcommand`
        // returns 0, which proves the singleton-lock relay swallows the argv
        // BEFORE cli-handler ever sees it (per S4 Stage 2 §A1.2 + §A1.3).
        // Behavior unchanged — same return shape; this log surfaces the silent
        // path so any future BNPC-class regression is visible at failure moment.
        sdia('cli-handler.unknown-subcommand', {
          cmd: sub ?? '<empty>',
          fullArgv: argv,
          hint:
            'Likely Electron-CLI received Node-CLI subcommand; check spawnSettings hook commands (BNPC).',
        });
        return { ok: false, error: 'unknown subcommand: ' + (sub ?? '<empty>') };
    }
  };
}

function mapKey(key: string): string {
  switch (key.toLowerCase()) {
    case 'enter':
    case 'return':
      return '\r';
    case 'tab':
      return '\t';
    case 'escape':
    case 'esc':
      return '\x1b';
    case 'backspace':
      return '\x7f';
    case 'up':
      return '\x1b[A';
    case 'down':
      return '\x1b[B';
    case 'right':
      return '\x1b[C';
    case 'left':
      return '\x1b[D';
    case 'space':
      return ' ';
    default:
      return key;
  }
}
