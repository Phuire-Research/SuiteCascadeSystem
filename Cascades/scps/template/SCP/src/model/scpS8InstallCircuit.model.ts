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
// C796 · THE BEST BETWEEN (the user's ruling): the deterministic transfer rides ONE named
// tool (suite8_page_transfer — the exact means); the Entourage keeps the JUDGMENT (npm ·
// concerns · the report · the closing motion). The Vermillion is ERROR-CORRECTING by design —
// deviation on live evidence is the pattern working, and every correction lands in the report.
export const buildInstallEntourageVermillion = (
  designation: string,
  sourceScpName: string,
  targetScpName: string,
): string =>
  [
    `SCS:Vermillion · THE INSTALL ENTOURAGE · Suite 8 "${designation}" · ${sourceScpName} → ${targetScpName}.`,
    'You are a DISSIPATING Entourage session (the RD-B worker class). ONE install, then teardown. This Vermillion is ERROR-CORRECTING: where reality diverges from it, verify against the LIVE target and correct course — record every correction in the install report.',
    '',
    'THE NAMED TOOLING (the exact means · no hunting): read Cascades/Bridge/bridge.json (this SCP root anor the workspace ancestor) → `port` → every tool below is POST http://127.0.0.1:<port>/mcp (jsonrpc tools/call):',
    '- `suite8_page_transfer` — the deterministic transfer: the page-creation engine scaffolds into the target (+ the 3 AIME wirings + its own gates), the source\'s REAL concept body overlays the scaffold, Cascades/8_SUITES/<designation>/ copies across, the target tsc gates with honest revert. Returns the changed-file manifest.',
    '- `scp_alert_turn_over` · `scp_focus_suite8_page` — the closing motion (the bridge routes the focus navigation presenter-aware; you need no window knowledge).',
    '- your teardown: `scs_dissipate_session` anor `scs_close_wait_dissipate`.',
    '',
    'THE GATE (refuse-first · THE PRESENCE-UNLOCKS LAW):',
    `1. Read ${installRequirementsRelPath(designation)} in THIS (the source) SCP root. ABSENT → write nothing, report the refusal in one line, and dissipate — PRESENCE is the gate. The user's discretion authorized this fire: installReady anor the scan date never re-lock it.`,
    'THE VERIFY-AGAINST-TARGET LAW: the gate file was scanned against a reference surface — re-verify each concernNote against the ACTUAL target before acting on it; concerns often DISSOLVE there (routes · modules · pins may all pre-exist — the field precedent).',
    '',
    'THE INSTALL (the teeth land FIRST):',
    `2. Fire suite8_page_transfer { designation: "${designation}", sourceScpName: "${sourceScpName}", targetScpName: "${targetScpName}" } EARLY. Read its manifest honestly — ok/reverted/tscErrors are yours to report, never to hide.`,
    '3. YOUR JUDGMENT · npm: check each npmRequirement against the TARGET package.json (dependencies anor devDependencies); npm install in the target root ONLY what is genuinely absent, pinning the recorded versions.',
    `4. YOUR JUDGMENT · the residue: resolve what the transfer does not carry — designation-spelling-split identity docs reconciled toward the CORRECT spelling · Installed-in corrected to "${targetScpName}" (Home SCP is NEVER re-homed) · any concern the manifest leaves standing. NEVER fabricate Diamond/Onyx Cascade Memory for the target — operation-born docs belong to its own anchor.`,
    `5. THE INSTALL REPORT — the durable artifact: write the TARGET's Cascades/Working/S8-INSTALL-${designation.replace(/\s+/g, '-')}.md (mkdir -p): verified-vs-dissolved concerns · the manifest's changed files · npm actions · held items. The report is the Muxistration; the transcript is not.`,
    '',
    'THE CLOSING MOTION (the Topic-Researcher idiom):',
    `6. scp_alert_turn_over for "${targetScpName}". THE ACK LAW: read the DISCRIMINATED result — { dropped, reason } means NOT landed: verify via scp_query_holdings, re-fire ONCE; still dropped → record it in the report and proceed. Never loop.`,
    `7. scp_focus_suite8_page for "${targetScpName}" — the turn-over lands before the user's eyes.`,
    '8. THEN dissipate. No artifacts beyond the install + the report.',
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

// MD-S8PM · PM-5 · THE FORGE UPDATE VERMILLION — the SINGLE-SCP page-vs-Template update lane.
// THE CONFLATION GUARD: this is a SIBLING of buildUpdateCircuitVermillion, NEVER the same builder.
// The Update Circuit (:108) is the Base↔Informative BILATERAL sync between two installed SCPs; THIS
// is the ONE page adapting to the Template Suite 8 Page per the standardization updates between the
// page's own s8 counter (pageS8) and the INSTALLED system's s8 counter (installedS8). THE UPDATE-ORDER
// LAW: the installed bridge package.json IS the source of truth for the S8 system counter — the S8
// update unlocks only after the bridge update lands the new counter. Token-free export (copy surface).
export const buildUpdateVermillion = (
  designation: string,
  pageS8: number,
  installedS8: number,
): string => {
  const camel = designation.charAt(0).toLowerCase() + designation.slice(1);
  const reportPath = `Cascades/Working/S8-UPDATE-${designation.replace(/\s+/g, '-')}.md`;

  return `SCS:Vermillion Update the Suite 8 page ${designation} to the current S8 Page System standard, then write the update report.

<VermillionPlan topic="S8 Page Update · ${designation}">

Page: ${designation} (concept dir src/concepts/${camel}/)
Page Counter At Spawn: #${pageS8}
Installed System Counter At Spawn: #${installedS8}
Update Report: ${reportPath}

Step 1 (Simple Prompt) — Read your doctrine:
  Informative: Your update doctrine is your own Suite 8's Strategy (SCP-local):
    Cascades/8_SUITES/Entourage Forge/Strategy/EF-S1-S8-Page-Update.md
  Actionable: Read it in full. Its Parameters section binds to this anchor:
    <designation> = ${designation} · <pageS8> = ${pageS8} · <installedS8> = ${installedS8}

Step 2 (Simple Prompt) — Execute the Strategy:
  Informative: The Strategy carries every ground and law — the source of truth, the
    template source, the conference, the restamp, the report, and the concluding
    sequence. This anchor carries only the run: the page and the counter pair above.
  Actionable: Execute the Strategy start to contract line with the bound parameters.

</VermillionPlan>

After acting, respond with the contract line first:
SCS:Vermillion:OK:<one-line summary of the update pass>`;
};
