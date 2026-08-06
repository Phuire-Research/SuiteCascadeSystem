/**
 * scpS8InstallCircuit.model.ts — EF-5 · THE INSTALL CIRCUIT (held · client-safe)
 *
 * THE NAME LAW: token-free file name + token-free exports — this model is imported FROM the
 * mint copy surface (the Suite 8 Control) and must survive every twin's token-rename.
 * CLIENT-SAFE: no node imports — the server-side gate-file READ lives in vue.principle
 * (outside the copy surface); the gate-file WRITE is the Mapper session's own Lambda.
 *
 * THE CIRCUIT (DIAMOND-ENTOURAGE-FORGE.md C790 · the Approach):
 *   EF-5a · THE REQUIREMENTS MAPPER — a dissipating Entourage session (RD-B class) scans the
 *           SPECIFIC Suite 8 page and writes THE GATE FILE, then dissipates.
 *   EF-5b · THE PEWTER INSTALL WORKFLOW — Requirements LOADED anor GENERATED (REGENERATE
 *           past a cleared gate) → target-SCP dropdown → the final gate.
 *   EF-5c · THE INSTALL ENTOURAGE — honors the gate file onto the target, then requests the
 *           target's TURN-OVER via the SCP tool, FOCUSES it, and dissipates.
 *   EF-5d · THE UPDATE CIRCUIT — Origin → Informative anor Base ← Informative (the resolved
 *           Informative becomes the new Base) — the Managing Vermillion.
 *
 * THE GATE FILE: Cascades/8_SUITES/<designation>/Install.Requirements.json — rides the
 * S8's transferable package AND the SCP upload (one user runs the means for all).
 */

export const INSTALL_REQUIREMENTS_SCHEMA_VERSION = 1;
export const INSTALL_REQUIREMENTS_FILE_NAME = 'Install.Requirements.json';

export type InstallNpmRequirement = {
  name: string;
  version: string;
  // true = the stock template SCP already ships it (informational); false = the page's OWN
  // addition — the install MUST npm-install it on the target (the honor-the-user law).
  inTemplateBaseline: boolean;
};

export type InstallRequirementsShape = {
  schemaVersion: number;
  designation: string;
  scannedAt: number;
  npmRequirements: InstallNpmRequirement[];
  concernNotes: string[];
  // the gate verdict — true unlocks the final gate (the Install Entourage refuses without it).
  installReady: boolean;
};

export const installRequirementsRelPath = (designation: string): string =>
  `Cascades/8_SUITES/${designation}/${INSTALL_REQUIREMENTS_FILE_NAME}`;

export const installRequirementsEndpoint = (designation: string): string =>
  `/s8-install-requirements/${encodeURIComponent(designation)}`;

// EF-5a · THE REQUIREMENTS MAPPER VERMILLION — seeds the dissipating scan session
// (spawned asWorker · fresh · onboard:false · anchor:false · target = the page).
export const buildRequirementsMapperVermillion = (designation: string): string =>
  [
    `SCS:Vermillion · THE REQUIREMENTS MAPPER · target Suite 8 page: "${designation}".`,
    'You are a DISSIPATING Entourage session (the RD-B worker class — see Cascades/Working/EF-RD-CORPUS/RD-B-RESEARCH-DISPATCH-AND-WORKERS.md if present). Your whole Lambda is ONE durable artifact, then teardown.',
    '',
    'THE SCAN (this SCP root is your cwd):',
    `1. Locate the page's concept directory under src/concepts/ whose name is the camelCase of "${designation}", and the package directory Cascades/8_SUITES/${designation}/.`,
    '2. Enumerate every EXTERNAL package import (bare specifiers · not relative · not node:) across the concept directory\'s .ts/.vue files.',
    '3. THE PINNED PRESENCE RULE: a package is PRESENT iff it is listed in this SCP\'s package.json under dependencies OR devDependencies; version = the listed range verbatim. A package IMPORTED but in NEITHER list is a HARD requirement finding (version null · installReady may hold on it).',
    '4. inTemplateBaseline is INFORMATIONAL ONLY (the installer keys off the TARGET\'s package.json, never this flag): judge best-effort against the stock template dependency set (vue · stratimux · express · express-ws · marked · nanoid · rxjs · cors · chokidar · the codemirror family + the stock devDependencies: vite · nodemon · typescript · jest and kin). true = ships with every stock SCP; false = this page\'s own addition.',
    '',
    'THE GATE FILE (the durable artifact · Write then Read-back):',
    `Write ${installRequirementsRelPath(designation)} as JSON:`,
    `{ "schemaVersion": ${INSTALL_REQUIREMENTS_SCHEMA_VERSION}, "designation": "${designation}", "scannedAt": <Date.now()>, "npmRequirements": [{ "name", "version", "inTemplateBaseline" }...], "concernNotes": [<anything an installer must know — endpoints, files outside the concept dir, env expectations>], "installReady": <true unless the scan found something an install CANNOT honor> }`,
    '',
    'THE TEARDOWN: after the Read-back verifies the file, dissipate this session via the scs dissipate tool for your OWN session (the DSST path). Produce NO other artifacts.',
  ].join('\n');

// EF-5c · THE INSTALL ENTOURAGE VERMILLION — the final gate's dissipating installer.
export const buildInstallEntourageVermillion = (
  designation: string,
  sourceScpName: string,
  targetScpName: string,
): string =>
  [
    `SCS:Vermillion · THE INSTALL ENTOURAGE · Suite 8 "${designation}" · ${sourceScpName} → ${targetScpName}.`,
    'You are a DISSIPATING Entourage session (the RD-B worker class). You facilitate ONE install, then teardown.',
    '',
    'THE GATE (refuse-first · THE PRESENCE-UNLOCKS LAW):',
    `1. Read ${installRequirementsRelPath(designation)} in THIS (the source) SCP root. ABSENT → write nothing, report the refusal in one line, and dissipate — PRESENCE is the gate. The user's discretion authorized this fire: installReady anor the scan date never re-lock it. The concernNotes are YOUR install intelligence — blockers named there are yours to resolve during the install (out-of-dir modules to copy · routes to port · wiring edits), and an unresolvable one is reported honestly, never silently skipped.`,
    '',
    'THE INSTALL (the engine IS the installer):',
    `2. Resolve the target SCP "${targetScpName}" root from the workspace bridge ring (the workspace Cascades/Bridge/bridge.json boundScps entry's dir).`,
    `3. In the target root, run the Suite 8 page-creation engine for "${designation}" (the same suite8:page lane this page was minted through — the engine's own tsc/build gates + revert protect the target).`,
    `4. Copy Cascades/8_SUITES/${designation}/ from the source into the target (the gate file rides the copy).`,
    '5. Honor npmRequirements: for each entry absent from the target\'s package.json, npm install it in the target root (pin the recorded version).',
    '',
    'THE CLOSING MOTION (the Topic-Researcher idiom · just prior to the step):',
    `6. Utilize the SCP turn-over tool to REQUEST the target SCP "${targetScpName}" be turned over (the gitm turn-over lane — the target restarts carrying the install).`,
    `7. FOCUS the target SCP "${targetScpName}" via the scs focus tool — the turn-over occurs before the user's eyes.`,
    '8. THEN dissipate this session via the scs dissipate tool for your OWN session (DSST).',
  ].join('\n');

// EF-5d · THE UPDATE CIRCUIT VERMILLION — the Managing Vermillion (the epoch's last refinement).
export type UpdateCircuitDirection = 'origin-to-informative' | 'informative-to-base';

export const buildUpdateCircuitVermillion = (
  designation: string,
  direction: UpdateCircuitDirection,
  originScpName: string,
  informativeScpName: string,
): string =>
  [
    `SCS:Vermillion · THE UPDATE CIRCUIT · Suite 8 "${designation}" · ${direction === 'origin-to-informative' ? `${originScpName} (Base) → ${informativeScpName} (Informative)` : `${informativeScpName} (Informative) → ${originScpName} (Base · the resolved Informative becomes the new Base)`}.`,
    'You are a DISSIPATING Entourage session managing the Base-Informative retention. Divergence REQUIRES resolution — never a blind overwrite.',
    '',
    '1. Resolve BOTH SCP roots from the workspace bridge ring (Cascades/Bridge/bridge.json boundScps dirs).',
    `2. Diff the "${designation}" stratum between the two roots: the concept directory under src/concepts/ (the camelCase of the designation) + Cascades/8_SUITES/${designation}/ (the 3-way-diff discipline of the gitm resolver precedent — additions · removals · both-changed).`,
    direction === 'origin-to-informative'
      ? '3. APPLY Base → Informative: bring the Informative\'s stratum up to the Base; a file the Informative ALONE changed is a CONFLICT — hold it, do not clobber.'
      : '3. APPLY Informative → Base: bring the Base\'s stratum up to the resolved Informative — the resolved Informative BECOMES the new Base; a file the Base ALONE changed since is a CONFLICT — hold it.',
    `4. Write the resolution report to the RECEIVING SCP's Cascades/Working/S8-UPDATE-${designation.replace(/\s+/g, '-')}.md: applied · held conflicts (each with both sides quoted) · the re-run instruction.`,
    '5. Gate the receiving SCP: its tsc must hold its own baseline; a regression → revert your applications and report honestly.',
    '6. Utilize the SCP turn-over tool for the RECEIVING SCP, FOCUS it, then dissipate (DSST).',
  ].join('\n');
