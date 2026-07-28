/**
 * Diamond B-6 (CD-24 / RUSGF): Repo URL source for SCS install pipeline.
 *
 * Hardcoded canonical HTTPS source. HTTPS for portability across npm-installed users
 * (npm strips .git/ at pack time, so .git/config remote discovery is unavailable for
 * end-users). Optional env override `SCS_INSTALL_REPO_URL` enabled for dev/testing.
 *
 * Pattern: Repo-URL-Sourcing-GitHub-Fallback (RUSGF) — hardcoded-canonical ↔ env-override.
 *
 * Issue #643 Half A · Wave 1 (LOCAL-SOURCE-SELF-INSTALL · ENOENT fix):
 * The hardcoded github remote LACKS `Cascades/8_SUITES/SCS Bridge/Instance.md`
 * (the working tree HAS it · committed · the maintainer does not push), so a
 * git-clone install path makes `assembleJoinedSuite8` ENOENT-throw → the
 * Installation Agent allocates but never spawns. The resolver below makes the
 * running CLI install from ITSELF when its own tree carries the Suite 8 — both
 * the dev symlink (global `scs` → this repo) and a COMPLETE npm package qualify.
 * The github remote is the LAST resort, used only for an incomplete package.
 *
 * Pattern: Local-Source-Self-Install (LSSI) — env-override ↔ self-tree (file://)
 * ↔ hardcoded-canonical.
 */
// eslint-disable-next-line @typescript-eslint/no-require-imports
const _fs = require('node:fs') as typeof import('node:fs');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const _path = require('node:path') as typeof import('node:path');

const HARDCODED_REPO_URL = 'https://github.com/Phuire-Research/SuiteCascadeSystem.git';

/**
 * The Suite 8 anchor a complete SCS source tree MUST carry. Its presence is the
 * Concluder distinguishing a self-installable tree (dev symlink OR complete npm
 * package) from an incomplete package that must fall back to the github remote.
 */
const SUITE_8_ANCHOR_RELPATH = _path.join('Cascades', '8_SUITES', 'SCS Bridge', 'Instance.md');

export type RepoUrlResolution = {
  url: string;
  source: 'env-override' | 'self-tree' | 'hardcoded-remote';
  root?: string; // resolved local root when source === 'self-tree'
};

/**
 * Walk UP from a starting directory (cap MAX_WALK_LEVELS) testing each ancestor
 * for the Suite 8 anchor. Returns the first ancestor that carries it, else null.
 * CRITICAL: the caller passes a `fs.realpathSync`-resolved start so the global
 * `scs` symlink is followed into this repo BEFORE the walk begins.
 */
const MAX_WALK_LEVELS = 8;
export function findSuite8AnchorRoot(startDir: string): string | null {
  let dir = startDir;
  for (let i = 0; i <= MAX_WALK_LEVELS; i++) {
    try {
      if (_fs.existsSync(_path.join(dir, SUITE_8_ANCHOR_RELPATH))) {
        return dir;
      }
    } catch {
      // permission / transient FS error · treat as miss, keep walking
    }
    const parent = _path.dirname(dir);
    if (parent === dir) break; // reached filesystem root
    dir = parent;
  }
  return null;
}

/**
 * Resolve the install repo source URL. Priority order (LSSI):
 *   (1) SCS_INSTALL_REPO_URL env var — highest priority, unchanged (dev/test).
 *   (2) self-tree: realpath the running module dir (follow the `scs` symlink),
 *       walk UP for the Suite 8 anchor → `file://<root>` when found. Both the
 *       dev symlink and a complete npm package satisfy this.
 *   (3) hardcoded github remote — incomplete-package fallback.
 *
 * Robust module-dir anchor: `__dirname` is available in the tsup CJS output
 * (dist/cli.cjs/index.js). `process.argv[1]` (the CLI entry · the symlinked
 * `scs` bin) is the realpath seed that crosses the global symlink into the repo.
 * Both are probed; the first that yields the anchor wins.
 */
export function resolveScsInstallRepoUrl(): RepoUrlResolution {
  // (1) env override — highest priority, unchanged
  const envOverride = process.env.SCS_INSTALL_REPO_URL;
  if (envOverride) {
    return { url: envOverride, source: 'env-override' };
  }

  // (2) self-tree — follow the symlink (realpathSync) then walk up for the anchor.
  // Probe seeds in order of reliability: the CLI entry (process.argv[1], the
  // symlinked bin) THEN the bundled module dir (__dirname). realpathSync on each
  // crosses the global `scs` symlink into the real repo before the walk.
  const seeds: string[] = [];
  try {
    if (typeof process.argv[1] === 'string' && process.argv[1].length > 0) {
      seeds.push(_path.dirname(_fs.realpathSync(process.argv[1])));
    }
  } catch {
    /* argv[1] unresolvable · skip seed */
  }
  try {
    // __dirname resolves to the bundle dir in the tsup CJS output; realpath it
    // in case the dist tree itself is symlinked.
    seeds.push(_fs.realpathSync(__dirname));
  } catch {
    // __dirname unavailable (non-CJS context) OR realpath failed · use raw
    try {
      seeds.push(__dirname);
    } catch {
      /* __dirname truly absent · no seed */
    }
  }
  for (const seed of seeds) {
    const root = findSuite8AnchorRoot(seed);
    if (root) {
      return { url: `file://${root}`, source: 'self-tree', root };
    }
  }

  // (3) hardcoded github remote — last resort (incomplete package)
  return { url: HARDCODED_REPO_URL, source: 'hardcoded-remote' };
}

// Computed once at module load. Resolution decision logged below the export so
// the chosen branch + URL are auditable in install debug output.
const _repoResolution = resolveScsInstallRepoUrl();

export const SCS_INSTALL_REPO_URL: string = _repoResolution.url;

// Audit the resolution decision (which branch won + the resolved URL). Lazy
// require + try/catch so a logging failure never breaks module load (debugLog
// itself does FS I/O). Matches the file's lazy-require discipline.
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { log: _log } = require('./debugLog') as typeof import('./debugLog');
  _log('install.repo-url.resolved', {
    source: _repoResolution.source,
    url: _repoResolution.url,
    root: _repoResolution.root,
  });
} catch {
  /* logging best-effort · resolution already computed */
}

/**
 * Diamond B-11 Fix 1 (Green-required PRIMING_PROMPT extraction): single source of truth
 * for the install instance's first user message. Previously duplicated across
 * installSpawn.ts + installHooks.ts (3-copy divergence risk). Consolidated here.
 *
 * USED BY PATH B (install-instance flow) — the install instance is spawned with
 * --append-system-prompt-file pointing at the joined Suite 8 SCS Bridge content;
 * its cwd is NOT yet fully scaffolded (no .claude/commands/cascade.md yet),
 * so it needs a verbose Strategy S1 directive to bootstrap the install.
 */
export const SCS_INSTALL_PRIMING_PROMPT =
  'You are operating as SCS Bridge (SuiteCascadeSystem install assistant). Begin the installation procedure: execute Strategy S1 — detect whether a Cascades/ directory is present in the current working directory.';

/**
 * Diamond B-15 Fix 1 (CD-44 PASCP · Path-A-Slash-Command-Priming).
 *
 * Diamond ζ Option X RESTORATION (Cycle 97): reverted from B-24-FIX rename.
 * The Cascade IS the doing of SCS · `/cascade` is the canonical Lambda anchor
 * (R0 Obsidian GT-1/GT-3). Source file `.claude/commands/cascade.md` is the
 * source of truth · install now writes the same filename (no `scs-` prefix
 * per Option X). Reinstated original B-24 priming value.
 *
 * Polarity-Flip history (R0 GT-3): B-24 had `/cascade` · B-24-FIX (same day)
 * flipped to `/scs-cascade` to match the ASNCPP rename · ζ restores `/cascade`
 * and undoes the rename at namespaceCommands (muxCompose.ts).
 */
// C784 · THE TRAJECTORY PRIMING (the Install BreakOut): never a bare /cascade — the spawn
// instruction itself carries the P1/P2/P3 order. Apostrophe-free (the escape law).
export const SCS_PATH_A_PRIMING_PROMPT =
  'Read the appended SCS Bridge install Vermillion fully, then follow THE SCP-CENTRIC LADDER: P1 install and boot the first SCP for the user (the assumed default). P2 offer Suite 8 creation only as domain emergence, minted INSIDE the installed SCP. P3 the final option is displaying the cascade menu. Your board lives in Cascades/Working - DIAMOND-INSTALL-UNFOUNDED or DIAMOND-INSTALL-FOUNDED - choose by the ground, follow its Cerulean tasks, and record ONYX-INSTALL.md. Begin at the SPP step your ground indicates and announce every checkpoint.';

/**
 * Diamond B-24-FIX (Muxified-Path spawn priming · Plain-text · Strategy-S7-driven):
 * Plain-text (NOT slash command) — timing-race immune.
 *
 * Diamond B-25-UX (S7→S8 sequence directive).
 *
 * Diamond B-25-UX-fix (Suite 7 Fuchsia clinical · escape-order + priming shortening):
 * Drastically shortened to <140 chars · NO apostrophes · NO em-dashes · NO smart-quotes.
 * Strategy substance lives entirely in the joined Suite 8 file (4760 lines · loaded
 * as appended system prompt). Priming is just the entry-point pointer. Avoids
 * shell-quoting fragility AND osascript-AppleScript embedding limits.
 *
 * Root-cause history (B-25-UX install on test-004 failure): the prior 1391-char
 * priming with `user's` apostrophe triggered the bash/osascript double-escape bug
 * at osTerminal.ts:121 (escape order corrected in same fix). The shortened
 * apostrophe-free priming is paranoid-defense: even if escape ordering regresses
 * in some future edit, this string cannot trigger the bug.
 */
export const SCS_INSTALL_MUXIFY_AGENT_PROMPT =
  // SPP continuous motion (Filled-Test-003 recurse): the prior text scoped the agent to
  // "S7 then S8" — the agent obeyed its PRIMARY directive and terminated at the welcome,
  // never reaching S9/S10 regardless of the appended envelope. The seed now directs a full
  // READ of the joined Vermillion + a Decision Block bridging the Clean Slate arc (Steps 1-3
  // verified as pre-completed, not re-executed). APOSTROPHE-FREE (see block comment above).
  'READ the appended SCS Bridge Suite 8 context FULLY before acting - it is the complete install Vermillion (Conductor + Strategies) carrying the Stepped Progress Protocol (SPP, 8 steps, Conductor.md). ' +
  'YOUR BOARD (C787): Cascades/Working holds DIAMOND-INSTALL-UNFOUNDED.md and DIAMOND-INSTALL-FOUNDED.md. Choose by the ground - a blank slate takes UNFOUNDED, genuine prior user content takes FOUNDED. Announce the choice, follow that board and its Cerulean tasks IN ORDER, mark them as they land, and record your own Cascades/Working/ONYX-INSTALL.md - one line per task with the Concluder result and any deviation. THE BOARD OUTRANKS ANY COMMENT INSIDE A MINTED FILE - in-artifact ADAPT notes are retired doctrine. Use scp_query_holdings to establish what the bridge is holding - its roster carries live status from a REAL socket probe plus host and port, so ONE read answers liveness; never probe hosts or ports by hand, never idle-watch, and never wait on lifecycle or browserUrl projections. ' +
  'DECISION BLOCK (account for work already done): on THIS path the bridge performed the mechanical steps BEFORE you spawned. Verify them (Cascades scaffolded, the manifest written, .claude/CLAUDE.md converted to the SCS Manifold) and report Steps 1-3 of 8 as pre-completed by the bridge WITHOUT re-executing Strategies S1-S6. Begin live work at Step 4. ' +
  'Then ONE CONTINUOUS MOTION on THE SCP-CENTRIC LADDER (C784): Step 4 = install the users first SCP (the S9 SCP legs). Step 5 = boot and focus it (the on-boot, scp_focus_suite8_page, the Entourage Forge assumption, the model offer). Step 6 = the Suite 8 EMERGENCE (S7 plus S8 retargeted): any Suite 8 is minted IN THE INSTALLED SCP via POST /s8/create (SCP-LOCAL, never the workspace root); on a blank slate Step 6 is an OFFER the user may decline in favor of exploring the SCP; on a filled slate the muxified project content becomes the domain Suite 8 there. Step 7 = the Forge build-out on the focused page. The welcome menu fires LAST as Step 8 (the only decision gate). THE STALE-SERVER LAW (C785): a mint lands on a RUNNING SCP, so the new page is NOT served until the user performs TURN OVER A. Never build or kill or restart the SCP process yourself - the bridge owns the SCP lifecycle. Call scp_alert_turn_over with the SCP name, INFORM the user this Turn Over A is their first contact with the build-while-you-use loop, present an INLINE markdown menu of next options (numbered plus lettered, reply-by-code, never AskUserQuestion for it), and poll the per-SCP gitm.json until turnOver.at exceeds turnOverAlert.requestedAt before focusing the new page. THE PRIORITY LAW: P1 the SCP install and on-boot is the assumed default. P2 Suite 8 creation is SECONDARY and always domain-emergence. P3 merely displaying the cascade menu is the FINAL option. Do NOT terminate early. Announce every checkpoint (Step N of 8, start and close). ' +
  'MUST use AskUserQuestion for the Shatterite menus the strategies specify (naming, branching, the Step 8 welcome). Do not auto-decide those. ' +
  'Diamond δ CSDSS fallback (C782 · the SCS-Signature Discriminant): BEFORE concluding anything about user state, probe the live filesystem at the user cwd AND judge by CONTENT, never existence. Check `.claude/CLAUDE.md` (and any PreInstallSnapshot copy): content carrying the SCS Manifold signatures (SECTION 0: EMBODIMENT · STRATIDIA MUXONOMY) anor an agents/ dir holding only scs--prefixed files is SCS\'S OWN STATE from a prior anor partial install — it is NOT user content and NOT a FAVPL violation. In that case do NOT halt and do NOT confer: treat it as REINSTALL-OVER-PARTIAL — skip S7 (there is nothing to muxify) and proceed DIRECTLY to the goal: install the initial SCP for the user, perform the on-boot on it, and continue the S9 sequence (the proven mint → load → focus the page → the Entourage Forge assumption → the model offer). ONLY genuinely user-authored content (a CLAUDE.md that is NOT the SCS Manifold · non-scs agents anor commands) halts for the AskUserQuestion conference — the user, not the agent, owns the Suite 8 designation choice, and no Suite 8 scaffold is ever auto-created from user content without confirmation. THE ICED DOCTRINE: Cascades/Iced/ (the PreInstallSnapshot + MuxificationManifest) exists FOR UNINSTALL — the restore reserve that makes SCS removable. It is NEVER a user-content oracle; the S7 question is answered by the content discriminant above. THE TEMPLATE-SCP LAW: the shipped Template SCP is a DEFAULT — every is-an-SCP-present check IGNORES it (an inventory holding only the template counts as ZERO installed SCPs; the initial SCP install always proceeds).';

/**
 * Diamond B-19 (CD-58 BECIS · Bridge-Embedded-Cascade-Initial-State):
 * Canonical fresh-install Cascade.json content. Bridge writes this directly to
 * `<userCwd>/Cascades/Cascade.json` after cpSync + template-rename, with
 * skip-if-exists guard. Source-independent: works regardless of which branch
 * the clone is from (push-HELD-resilient · CD-60 PHRSD).
 *
 * Content MUST match `Cascades/Cascade.template.json` exactly. When
 * SCS-Bridge-Install merges to main, last-writer-wins composition (CD-62
 * LWWSC) means the embedded write is canonical regardless of which path ran.
 *
 * Pattern matches existing bridge-embedded-constant discipline (B-11 Strategy
 * S1 prompt, B-15 /cascade prompt, B-6 repo URL).
 */
export const SCS_FRESH_CASCADE_JSON = `{
  "activeDiamond": null,
  "activeOnyx": null,
  "suiteColors": {
    "0": "Base",
    "1": "Red",
    "2": "Orange",
    "3": "Yellow",
    "4": "Green",
    "5": "Blue",
    "6": "Purple",
    "7": "Fuchsia"
  },
  "cyclePosition": {
    "cycle": 0,
    "rotation": 1,
    "totalRotations": 1,
    "gate": 0
  },
  "colorSelectionComplete": false,
  "automata": null
}
`;

/**
 * Install-State Branching Diamond (CMID · CASS · IFSB · PRSCD · IDDS · BJVR):
 * Three concrete install-state values + 'unknown' legacy-migration sentinel.
 *
 * - 'fresh-slate-scaffolded'    — MuxState 'fresh': no CLAUDE.md detected anywhere
 * - 'existing-project-augmented'— MuxState 'muxified': user CLAUDE.md detected, first SCS install
 * - 'reinstall-existing'        — MuxState 'remuxify': Iced manifest detected, re-install
 * - 'unknown'                   — H4 schema-migration sentinel: legacy Cascade.json
 *                                  written pre-Diamond lacks the field. Downstream
 *                                  consumers treat as existing-project (safe default
 *                                  per Suite 4 Green H4 reconciliation).
 *
 * Authoritative state: written to Cascade.json at install time (CASS · PRSCD).
 * Bridge.json echoes via BJVR Option B. Shatterite reads Cascade.json for
 * MSMRD-FS / MSMRD-EP / MSMRD-RE variant selection (Teal Claude scope).
 */
export type InstallState =
  | 'fresh-slate-scaffolded'
  | 'existing-project-augmented'
  | 'reinstall-existing'
  | 'unknown';

/**
 * CMID Pure Derivation — MuxState → InstallState.
 * Reuses existing detectMuxState() infrastructure; introduces NO new
 * filesystem probe (Suite 4 Green H1 reconciliation; M58 Field-of-Poppies
 * anti-pattern compliance). MuxState binary is the install-time signal;
 * sub-location nuance (root vs .claude/) is captured separately in the
 * Iced manifest userStateDetected payload.
 */
export function deriveInstallState(
  muxState: 'fresh' | 'muxified' | 'remuxify',
): InstallState {
  switch (muxState) {
    case 'fresh':
      return 'fresh-slate-scaffolded';
    case 'muxified':
      return 'existing-project-augmented';
    case 'remuxify':
      return 'reinstall-existing';
    default:
      return 'unknown';
  }
}

/**
 * H4 Schema-Migration Resolver — read legacy/current Cascade.json values
 * into a guaranteed InstallState. Unknown / undefined / malformed values
 * collapse to 'unknown' sentinel. Downstream consumers (Shatterite menu
 * variant selection) MUST handle 'unknown' as safe-default existing-project
 * (never auto-render fresh-slate Tutorial when ambiguity is present).
 */
export function resolveInstallState(
  rawValue: unknown,
): InstallState {
  if (
    rawValue === 'fresh-slate-scaffolded' ||
    rawValue === 'existing-project-augmented' ||
    rawValue === 'reinstall-existing'
  ) {
    return rawValue;
  }
  return 'unknown';
}

/**
 * Installation-Status Progress Field (Suite 5 Blue · DISTINCT from InstallState):
 *
 * InstallState (above)         → "Which PATH did the install take?" (fresh-slate
 *                                 vs existing-project vs reinstall)
 * InstallationStatus (below)   → "Is the install COMPLETE or IN-PROGRESS?"
 *
 * Both fields coexist in Cascade.json. The state machine:
 *   - 'fresh-slate-scaffolded' install   → starts 'installing'  → ends 'installed'
 *   - 'existing-project-augmented'       → starts 'muxifying'   → ends 'muxified'
 *   - 'reinstall-existing'               → starts 'muxifying'   → ends 'muxified'
 *   - 'unknown' / legacy / missing       → 'unknown' (safe fallback: TREAT AS
 *                                          complete · do NOT re-trigger install)
 *
 * Stored explicitly (NOT derived-on-read) so mid-install crashes leave the file
 * in the incomplete state · next boot sees the incomplete marker and re-issues
 * the install agent rather than abandoning a half-scaffolded project.
 *
 * Boot-time consumer: CLI on `scs` invocation reads Cascade.json (if present)
 * and routes:
 *   - Cascades/ absent              → existing install-menu path (unchanged)
 *   - installationStatus complete   → Shatterite Main Menu (normal flow)
 *   - installationStatus in-progress→ re-issue install agent (resume from state)
 *   - installationStatus unknown    → safe fallback to complete (legacy users)
 */
export type InstallationStatus =
  | 'installing'   // clean-slate path · mid-process
  | 'installed'    // clean-slate path · complete
  | 'muxifying'    // existing-project path · mid-process
  | 'muxified'     // existing-project path · complete
  | 'unknown';     // legacy / fallback sentinel

/**
 * Initial-status derivation — INSTALLING/MUXIFYING from the install path taken.
 * Called at BECIS write (the moment Cascade.json is first written). The file
 * stays in this in-progress state until markInstallationComplete fires.
 */
export function deriveInitialInstallationStatus(installState: InstallState): InstallationStatus {
  switch (installState) {
    case 'fresh-slate-scaffolded':
      return 'installing';
    case 'existing-project-augmented':
      return 'muxifying';
    case 'reinstall-existing':
      return 'muxifying';
    default:
      return 'unknown';
  }
}

/**
 * Completed-status derivation — INSTALLED/MUXIFIED from the install path taken.
 * Called at the install pipeline's completion site (after all Concluders pass)
 * via markInstallationComplete (below) to atomically transition the file from
 * in-progress to complete.
 */
export function deriveCompletedInstallationStatus(installState: InstallState): InstallationStatus {
  switch (installState) {
    case 'fresh-slate-scaffolded':
      return 'installed';
    case 'existing-project-augmented':
      return 'muxified';
    case 'reinstall-existing':
      return 'muxified';
    default:
      return 'unknown';
  }
}

/**
 * Schema-Migration Resolver — read raw value from Cascade.json into a guaranteed
 * InstallationStatus. Unknown / undefined / malformed values collapse to
 * 'unknown' sentinel. Downstream consumers (boot-time check) MUST handle
 * 'unknown' as safe-default complete (never auto-re-trigger install for legacy
 * users whose Cascade.json predates this field).
 */
export function resolveInstallationStatus(rawValue: unknown): InstallationStatus {
  if (
    rawValue === 'installing' ||
    rawValue === 'installed' ||
    rawValue === 'muxifying' ||
    rawValue === 'muxified'
  ) {
    return rawValue;
  }
  return 'unknown';
}

/**
 * Predicate · is the install COMPLETE? True for 'installed' / 'muxified'.
 * NOTE: 'unknown' returns false here · use isInstallationLegacy for the
 * safe-fallback branch.
 */
export function isInstallationComplete(status: InstallationStatus): boolean {
  return status === 'installed' || status === 'muxified';
}

/**
 * Predicate · is the install IN-PROGRESS? True for 'installing' / 'muxifying'.
 * Boot-time CLI uses this to detect crashed-mid-install state.
 */
export function isInstallationInProgress(status: InstallationStatus): boolean {
  return status === 'installing' || status === 'muxifying';
}

/**
 * Predicate · is the install LEGACY (pre-Diamond Cascade.json)? True for
 * 'unknown'. Boot-time CLI treats legacy state as safe-fallback complete to
 * preserve existing-user state (do NOT re-trigger install for users whose
 * Cascade.json simply pre-dates this field).
 */
export function isInstallationLegacy(status: InstallationStatus): boolean {
  return status === 'unknown';
}

/**
 * CASS Builder — produce the Cascade.json content string with install-time
 * values threaded in. Matches SCS_FRESH_CASCADE_JSON existing shape plus the
 * four BECIS-extension fields (installState · claudeMdPresent · installedAt ·
 * installVersion) AND the new installationStatus field (Suite 5 Blue · derived
 * from installState as initial in-progress marker). Backward compat:
 * SCS_FRESH_CASCADE_JSON constant unchanged so the existing template-equivalence
 * test (installSpawn.test.ts:360 single-source-of-truth invariant) still passes.
 *
 * Output uses 2-space indentation matching the original constant.
 */
export interface CascadeJsonInitOptions {
  installState: InstallState;
  claudeMdPresent: boolean;
  installedAt: string;
  installVersion: string;
}

export function buildFreshCascadeJson(opts: CascadeJsonInitOptions): string {
  const cascade = {
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
    installState: opts.installState,
    installationStatus: deriveInitialInstallationStatus(opts.installState),
    claudeMdPresent: opts.claudeMdPresent,
    installedAt: opts.installedAt,
    installVersion: opts.installVersion,
  };
  return JSON.stringify(cascade, null, 2) + '\n';
}

/**
 * markInstallationComplete · atomic transition of installationStatus from
 * in-progress to complete. Called at the install pipeline's completion site
 * AFTER all Concluders pass. Reads existing Cascade.json, derives the completed
 * status from the recorded installState, writes back atomically via tmp+rename.
 *
 * Non-fatal: if Cascade.json doesn't exist OR is malformed, logs and returns
 * without throwing — install remains in the incomplete state and next boot will
 * re-issue the install agent.
 *
 * The completion timestamp (installedAt) is also refreshed to reflect actual
 * completion time (the BECIS-write installedAt reflects scaffold start).
 *
 * Returns { ok, installationStatus, reason? }. Callers may log the result but
 * MUST NOT fail the install pipeline on a failed completion-mark.
 */
export interface MarkInstallationCompleteResult {
  ok: boolean;
  installationStatus?: InstallationStatus;
  reason?: string;
}

export function markInstallationComplete(userCwd: string): MarkInstallationCompleteResult {
  // Lazy node:fs require to keep this file lightweight for non-node consumers
  // (matches existing pattern in bridgeMetadata.ts).
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const fs = require('node:fs') as typeof import('node:fs');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const pathMod = require('node:path') as typeof import('node:path');

  const cascadePath = pathMod.join(userCwd, 'Cascades', 'Cascade.json');
  if (!fs.existsSync(cascadePath)) {
    return { ok: false, reason: `Cascade.json not found at ${cascadePath}` };
  }
  try {
    const raw = fs.readFileSync(cascadePath, 'utf8');
    const cascade = JSON.parse(raw) as Record<string, unknown>;
    // INSTALL-FIX-007 · FIX 3 · FIELD ALIGNMENT. Both install paths rename
    // Cascade.template.json → Cascade.json BEFORE the buildFreshCascadeJson seed
    // (which is gated on !existsSync(livePath), so it is SKIPPED once the template
    // is renamed). The template carries NO installState field, so the file reaching
    // this completion mark has installState === undefined → resolveInstallState →
    // 'unknown' → deriveCompletedInstallationStatus('unknown') → 'unknown'
    // (Blank-Test-007 debug.json:80 installationStatus:'unknown'). That left the
    // SCPGATE installationComplete derivation unreliable. Alignment: when
    // installState is absent (template-rename path), BACKFILL it on the same
    // read-modify-write so installState and installationStatus stay consistent and
    // the completed status derives to a definite installed/muxified value. We reach
    // this function ONLY at the pipeline's completion site, so a missing-state file
    // genuinely IS a fresh-slate install → 'fresh-slate-scaffolded' / 'installed'.
    let installState = resolveInstallState(cascade.installState);
    if (installState === 'unknown') {
      installState = 'fresh-slate-scaffolded';
      cascade.installState = installState;
    }
    const completedStatus = deriveCompletedInstallationStatus(installState);
    cascade.installationStatus = completedStatus;
    cascade.installedAt = new Date().toISOString();
    // SCPGATE FBSN: arm the first-run consent note exactly once at install resolution.
    // Only set when absent — never clobber a CONSUMED (true) value on a reinstall.
    if (cascade.scpInstallAgentNoteShown === undefined) {
      cascade.scpInstallAgentNoteShown = false;
    }
    const tmpPath = `${cascadePath}.tmp`;
    fs.writeFileSync(tmpPath, JSON.stringify(cascade, null, 2) + '\n', 'utf8');
    fs.renameSync(tmpPath, cascadePath);
    return { ok: true, installationStatus: completedStatus };
  } catch (err) {
    return {
      ok: false,
      reason: `markInstallationComplete failed: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}

/**
 * SCPGATE FBSN · markScpInstallNoteShown — atomic tmp+rename write flipping
 * scpInstallAgentNoteShown → true (State A→B CONSUMED). Mirrors
 * markInstallationComplete's pattern. Read-modify-write preserving ALL existing
 * (unknown) fields per the S6 merge-preserve NOTE — only the single flag is set.
 * Non-fatal: a failed write only means the note may re-render next session
 * (acceptable degradation · fire-and-forget).
 */
export function markScpInstallNoteShown(userCwd: string): { ok: boolean; reason?: string } {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const fs = require('node:fs') as typeof import('node:fs');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const pathMod = require('node:path') as typeof import('node:path');
  const cascadePath = pathMod.join(userCwd, 'Cascades', 'Cascade.json');
  if (!fs.existsSync(cascadePath)) return { ok: false, reason: 'Cascade.json not found' };
  try {
    const cascade = JSON.parse(fs.readFileSync(cascadePath, 'utf8')) as Record<string, unknown>;
    cascade.scpInstallAgentNoteShown = true;
    const tmpPath = `${cascadePath}.tmp`;
    fs.writeFileSync(tmpPath, JSON.stringify(cascade, null, 2) + '\n', 'utf8');
    fs.renameSync(tmpPath, cascadePath);
    return { ok: true };
  } catch (err) {
    return { ok: false, reason: err instanceof Error ? err.message : String(err) };
  }
}

/**
 * Diamond B-24 (CD-85 IFALS · CD-87 MMDC · Iced folder structural constants):
 * `Cascades/Iced/` is the new convention for muxification record + user
 * personalization layer. Three sub-areas:
 *   - PreInstallSnapshot/{ts}/ — backup of user state at install moment (revert source)
 *   - MuxificationManifest.json — declarative change record (B-25 reverse contract)
 *   - UserSCSConfig/ — user customizations protected from SCS updates
 */
export const ICED_DIR_NAME = 'Iced';
export const ICED_MANIFEST_FILENAME = 'MuxificationManifest.json';
export const ICED_PRE_INSTALL_SNAPSHOT_DIRNAME = 'PreInstallSnapshot';
export const ICED_USER_SCS_CONFIG_DIRNAME = 'UserSCSConfig';

/**
 * Diamond B-24 (CD-93 ASNCPP · Agent + Command Sub-Namespace):
 * SCS agents land at `.claude/agents/scs-*.md` and SCS commands at
 * `.claude/commands/scs-*.md` to prevent collision with user's pre-existing
 * agents (e.g., `my-reviewer.md` from B-23 Reference Design fixture).
 * Flat prefix mirrors agents pattern; matches Claude Code's flat command
 * discovery convention.
 */
export const SCS_AGENT_PREFIX = 'scs-';
export const SCS_COMMAND_PREFIX = 'scs-';

/**
 * Diamond B-24 (CD-88 CNRPFT · CLAUDE.md Delimited Append):
 * SCS Manifold appended to user CLAUDE.md (root + .claude/) between these
 * delimiters. Opening delimiter carries version (for upgrade tracking);
 * closing delimiter is version-agnostic (enables idempotent upgrade across
 * versions — open-tag regex matches any version).
 *
 * B-25 reverse-muxify imports these same constants — single source of truth
 * prevents Diameter rupture (Suite 6 Purple D-7 risk mitigation).
 */
export const SCS_CLAUDEMD_DELIMITER_OPEN_PREFIX = '<!-- BEGIN SCS-BRIDGE-MANIFOLD';
export const SCS_CLAUDEMD_DELIMITER_CLOSE = '<!-- END SCS-BRIDGE-MANIFOLD -->';

/**
 * Build the version-aware opening delimiter for a given SCS Bridge version.
 * Closing delimiter is version-agnostic (constant above).
 */
export function buildClaudeMdDelimiterOpen(scsBridgeVersion: string): string {
  return `${SCS_CLAUDEMD_DELIMITER_OPEN_PREFIX} v${scsBridgeVersion} -->`;
}

/**
 * Diamond B-24 (CD-87 MMDC · Manifest Schema Version):
 * Bumped when manifest JSON shape changes; B-25 reads + verifies version
 * matches its expected range.
 *
 * Diamond B-24-FIX bumped 1 → 2: added `'replaced'` action enum for drop-in
 * CLAUDE.md (replaces B-24's `'appended'` delimited-append), and `'agent-derived'`
 * action enum for files the install agent (not bridge) creates during S7
 * muxification (e.g., Suite 8 Instance.md from user CLAUDE.md content).
 * B-25 branches on schema version: v1 reverses 'appended' via delimiter strip;
 * v2 reverses 'replaced' via snapshot drop-back; both versions handle 'agent-derived'
 * via directory removal.
 */
export const ICED_MANIFEST_SCHEMA_VERSION = 3;

/**
 * Diamond B-23 (CD-77 RDTFS · CD-81 TUSS · Reference Design Test Fixture):
 * 8-file Reference Design representing a "typical user Claude Code setup" before
 * SCS Bridge muxification. Bridge-embedded constants (matches B-19 BECIS pattern)
 * make the fixture bytes-stable and source-controlled. `scaffoldReferenceDesignFixture`
 * (muxFixture.ts) writes these to a target directory; tests clone from the
 * materialized fixture and verify Muxification reversibility.
 *
 * Cross-platform-ready: forward-slash paths · no shebang · no macOS assumptions.
 * The .gitignore includes `*.bak` so install-flow timestamped backups (B-3)
 * don't contaminate fixture state assertions.
 */
export const SCS_MUX_FIXTURE_CLAUDE_MD = `# Project Instructions for Claude Code

This is a typical user-project CLAUDE.md, present BEFORE SCS Bridge muxification.
The user has already configured Claude Code for their project; SCS Bridge will
compose WITH this setup, not replace it.

## Conventions

- Use 2-space indentation for TypeScript
- Prefer named exports
- Run \`npm test\` before committing

## Workflow

When asked to implement a feature, first read existing code patterns, then
write tests alongside implementation.
`;

export const SCS_MUX_FIXTURE_AGENT_MD = `---
name: my-reviewer
description: Custom user-defined code review agent. Predates SCS Bridge install.
---

You are a code reviewer for this project. When invoked:

1. Read the user's diff
2. Identify potential issues (correctness, performance, style)
3. Report findings concisely

Focus on actionable feedback; avoid speculation.
`;

export const SCS_MUX_FIXTURE_COMMAND_MD = `---
description: Run a quick code review on staged changes
---

Review the staged git changes for this project. Use the my-reviewer agent
if appropriate. Provide concise feedback on:

- Correctness
- Style consistency with the project's conventions
- Test coverage of the changes
`;

export const SCS_MUX_FIXTURE_SETTINGS_JSON = `{
  "permissions": {
    "allow": []
  }
}
`;

export const SCS_MUX_FIXTURE_README_MD = `# user-project

A typical user project with pre-existing Claude Code setup.

## Setup

\`\`\`
npm install
npm test
\`\`\`

## Project Structure

- \`src/\` — TypeScript source
- \`.claude/\` — Claude Code customizations (agents, commands, project instructions)
`;

export const SCS_MUX_FIXTURE_PACKAGE_JSON = `{
  "name": "user-project",
  "version": "0.1.0",
  "description": "Typical user project — Reference Design for SCS Bridge muxification testing",
  "scripts": {
    "test": "echo \\"no tests configured\\""
  }
}
`;

export const SCS_MUX_FIXTURE_INDEX_TS = `export function greet(name: string): string {
  return \`Hello, \${name}!\`;
}
`;

export const SCS_MUX_FIXTURE_GITIGNORE = `node_modules/
dist/
*.log

# SCS Bridge timestamped backups — exclude from fixture state assertions
*.bak
`;

// ────────────────────────────────────────────────
// GITM 3LOC — the nested-gitignore lines the maintain pass ensures (idempotent ·
// append-if-absent). The Base ignores the Cascade workspace so the SCS churn never
// pollutes the user's project; the Cascade ignores the SCP repos so each SCP is its
// own isolated history. Used by ensureNestedGitStructure (gitmNestedMaintain.ts).
// ────────────────────────────────────────────────

// The Base .gitignore line: ignore the Cascade workspace (its own BLUE repo).
export const GITM_BASE_GITIGNORE_LINE = 'Cascades/';
// The Cascade .gitignore line: ignore the SCP repos (each its own RED repo).
export const GITM_CASCADE_GITIGNORE_LINE = 'scps/';
// The Cascade .gitignore line: ignore the bridge's own runtime bookkeeping. Bridge/ holds
// debug.json/gitm.json/sessions.json which the bridge rewrites constantly — tracking it keeps
// the Cascade/BLUE location perpetually dirty and pins mostRecentLocation to it. The base
// projectWatcher already excludes Cascades/Bridge/; this is its cascade-git counterpart.
export const GITM_CASCADE_BRIDGE_GITIGNORE_LINE = 'Bridge/';
// The comment that marks an SCS-maintained nested-location boundary in a .gitignore.
export const GITM_GITIGNORE_BOUNDARY_COMMENT = '# SCS Bridge — nested location boundary';
// The commit message for a freshly-initialized nested location repo.
export const GITM_NESTED_GIT_COMMIT_MSG = 'SCS: initialize nested location repository';

/**
 * Diamond B-23 (CD-81 TUSS): Reference Design file inventory.
 * Used by scaffoldReferenceDesignFixture to write all 8 files from constants.
 * Tuple of [relativePath, content] preserves write order (parents → children).
 */
export const SCS_MUX_FIXTURE_FILES: ReadonlyArray<readonly [string, string]> = [
  ['CLAUDE.md', SCS_MUX_FIXTURE_CLAUDE_MD],
  ['.claude/CLAUDE.md', SCS_MUX_FIXTURE_CLAUDE_MD],
  ['.claude/agents/my-reviewer.md', SCS_MUX_FIXTURE_AGENT_MD],
  ['.claude/commands/review.md', SCS_MUX_FIXTURE_COMMAND_MD],
  ['.claude/settings.json', SCS_MUX_FIXTURE_SETTINGS_JSON],
  ['README.md', SCS_MUX_FIXTURE_README_MD],
  ['package.json', SCS_MUX_FIXTURE_PACKAGE_JSON],
  ['src/index.ts', SCS_MUX_FIXTURE_INDEX_TS],
  ['.gitignore', SCS_MUX_FIXTURE_GITIGNORE],
];
