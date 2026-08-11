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
// page's own s8 counter (pageS8) and npm's current s8 counter (npmS8). Token-free export (copy surface).
export const buildUpdateVermillion = (
  designation: string,
  pageS8: number,
  npmS8: number,
): string =>
  [
    `SCS:Vermillion · THE FORGE UPDATE · Suite 8 page "${designation}" · s8 #${pageS8} → npm s8 #${npmS8}.`,
    'You are the page\'s Entourage Forge conducting ONE update, then dissipating (the ONE MOTION law spawned you as this page\'s anchor Forge so a duplicate engage FOCUSES you rather than re-spawning; your Lambda is the update + the report, then teardown). This Vermillion is ERROR-CORRECTING: where reality diverges from it, verify against the LIVE surfaces and correct course — record every correction in the update report.',
    '',
    // (a) THE COMMISSION — the s8 PAIR embedded literally + the /scs-bridge-version surface NAMED
    // so the session can RE-READ npm-current during the update (the pair may be stale at spawn).
    `THE COMMISSION: update THIS page's Suite 8 from the Template Suite 8 Page per the standardization updates between counter s8 #${pageS8} (this page's minted counter) and counter s8 #${npmS8} (npm's current). The pair above is the spawn-time snapshot; RE-READ npm-current during the update via the SCP-local surface GET /scs-bridge-version (the served answer carries scsMuxameter.s8) so you standardize toward the LIVE counter, not a stale number.`,
    `1. Resolve THIS SCP root (Cascades/Bridge/bridge.json boundScps anor the workspace ancestor) and the Template Suite 8 Page surface: the page's concept directory under src/concepts/ (the camelCase of "${designation}") + Cascades/8_SUITES/${designation}/. The Template's current stratum is the standardization target.`,
    '2. Diff the page\'s stratum against the Template Suite 8 Page (the 3-way-diff discipline — additions · removals · both-changed), scoped to the standardization updates the s8 counter names.',
    '',
    // (b) THE HONOR-THE-DESIGN CONFERENCE — apply anor conference anor preserve; every uniquely
    // changed file HOLDS for the user's choice (the buildUpdateCircuitVermillion :120-122 discipline).
    'THE HONOR-THE-DESIGN CONFERENCE (apply anor conference anor preserve): a Template standardization the page has NOT diverged on APPLIES; a file the page\'s owner UNIQUELY changed is a CONFERENCE — hold it, NEVER clobber, and surface it to the user for the choice of which aspects adapt over. Divergence REQUIRES resolution, never a blind overwrite — the owner\'s design is sovereign.',
    '3. CONFER: present each held file (both sides quoted) and let the user choose apply anor preserve per aspect. Apply only what the user accepts; preserve the rest verbatim.',
    '',
    // (c) THE PGED FRAME — the update rides the same rail the page's own dispatches ride.
    'THE PGED FRAME: this update rides the SAME rail the page\'s own dispatches ride — the spawn rail (triggerSpawnS8Session · designation-agnostic by the s8 alias contract), the relay-lane spine, and CMLS locality. You are the page\'s own Entourage, updating it toward the standardization.',
    '',
    // (d) THE RESTAMP — on completion + user implementation, S8_PAGE_COUNTER updates to the npm value
    // (the update itself edits the constant as part of the standardization apply).
    `4. THE RESTAMP: once the standardization is applied and the user has implemented the changes, update the page's own counter constant S8_PAGE_COUNTER (src/concepts/suite8/suite8.type.ts) to the npm value #${npmS8} — the restamp is part of the standardization apply, so the page's counter names the version it now carries.`,
    `5. THE UPDATE REPORT — the durable artifact: write this SCP's Cascades/Working/S8-UPDATE-${designation.replace(/\s+/g, '-')}.md: applied standardizations · held (conferred) files with both sides quoted + the user's choice · the S8_PAGE_COUNTER restamp · the re-run instruction. The report is the Muxistration; the transcript is not. Gate: this SCP's tsc must hold its own baseline — a regression → revert and report honestly.`,
    '',
    // (e) THE CLOSE — the Install Entourage precedent (:100-102) VERBATIM in discipline.
    // THE RECEIVING SCP is this page's OWN SCP (single-SCP update); resolve its scpName from
    // bridge.json — "${designation}" is the suite8 page name (focus's suite8Name), NOT the scpName.
    'THE CLOSING MOTION (the Topic-Researcher idiom · the RECEIVING SCP is THIS page\'s own SCP — resolve its scpName from Cascades/Bridge/bridge.json boundScps):',
    '6. scp_alert_turn_over { scpName: <this SCP\'s name> }. THE ACK LAW: read the DISCRIMINATED result — { dropped, reason } means NOT landed: verify via scp_query_holdings, re-fire ONCE; still dropped → record it in the report and proceed. Never loop.',
    `7. scp_focus_suite8_page { suite8Name: "${designation}", scpName: <this SCP's name> } — the turn-over lands before the user's eyes; check focus.ok, report it, and proceed regardless.`,
    '8. THEN dissipate via scs_dissipate_session (your OWN session). No artifacts beyond the update + the report.',
  ].join('\n');
