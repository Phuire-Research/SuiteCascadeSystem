/**
 * `suite8:page` SVLF model — Streamline Macro Diamond MD-1.
 *
 * Deterministic copy-move-rename of the template `suite8` concept into a domain
 * Suite 8 page, plus the foreign-file Muxonomy wiring (AIMEs) and the optional
 * `--home` route claim (SSBLF). The model is SILENT — it returns a structured
 * `Suite8PageCreateResult`; the CLI verb (`src/commands/suite8/page.ts`) does all
 * console I/O. This preserves the DCRS property: an MCP mirror calls the same
 * model and renders the result differently.
 *
 * Architecture: MD1-S3-YELLOW-BLUEPRINT.md (W1) · MD1-S4-GREEN-VALIDATION.md ·
 * MD1-S6-PURPLE-COMPOSITION.md (A1/A2/A3 amendments).
 *
 * Citations:
 *   - GLOB mv walk (S3 PRIME DISCOVERY): the 24 token-named files renamed by
 *     basename; the in-dir find-replace handles the 696 token occurrences across
 *     all 36 files. The zero-grep gate (ii) verifies the full surface.
 *   - Two-phase LFRCL (Decision b): tsc proves concept correctness (Phase 1 ·
 *     full revert on fail); build:client proves routing correctness (Phase 2 ·
 *     SAMLS-only revert on fail, base concept PRESERVED).
 *   - SAMLS block-scope (A2 named hazard): the `isMainLanding: false` token
 *     appears in TWO NavigationConfig blocks; the swap is scoped to the
 *     `{domainLower}HomeNavigation` block only — never a global replace.
 */
import {
  existsSync,
  rmSync,
  renameSync,
  readFileSync,
  writeFileSync,
  cpSync,
  readdirSync,
  statSync,
} from 'node:fs';
import { join } from 'node:path';
import { execSync } from 'node:child_process';
import { validateAndDerive } from './installScpPrompts';
import { readScpRegistry } from './scpPersistence';

// ============================================
// PUBLIC SURFACE
// ============================================

/**
 * An exec runner — the seam that keeps W3 tests fast (stub tsc / build:client)
 * while the W4 G5 LIVE Concluder runs the real subprocesses. Default = execSync.
 * Throws on non-zero exit (mirrors execSync). Returns stdout.
 */
export type ExecRunner = (command: string, cwd: string) => string;

const defaultExecRunner: ExecRunner = (command, cwd) =>
  execSync(command, { cwd, stdio: 'pipe' }).toString();

export interface Suite8PageCreateOptions {
  projectRoot: string; // = process.cwd() from the CLI
  name: string; // PascalCase Suite8Name (the --name argv)
  home?: boolean; // the --home flag (SSBLF)
  designation?: string; // OPTIONAL: explicit SCP designation to target; default = most-recent installed
  displayName?: string; // OPTIONAL: the EXACT Cascades/8_SUITES/{name}/ dir name (spaced) — the
  // ADAPT fill + SSMC binding form; fallback = PascalCase split on case boundaries
  force?: boolean; // OPTIONAL: S8ERI re-run override (skip the already-installed guard)
  execRunner?: ExecRunner; // OPTIONAL: test seam — stubs tsc / build:client
}

export interface Suite8PageCreateResult {
  ok: boolean;
  reason?: string; // fail-loud diagnostic (the failing gate + exact site)
  designation?: string; // {Domain}
  conceptName?: string; // {domainLower}
  scpRoot?: string; // resolved install root
  newConceptDir?: string; // {scpRoot}/src/concepts/{domainLower}
  filesRenamed?: number; // count from the glob mv walk
  aimeInserts?: {
    island: 'inserted' | 'skipped';
    huirth: 'inserted' | 'skipped';
    // FT-008 AIME-3: the THIRD SURFACE — the server-side nav/routing registry. Without
    // this the page is INVISIBLE (vue.principle.ts REGISTERED_MUXONOMICS is the only source
    // getNavItems/getLandingIsland/getAuthorizedIslandIds read). import + array entry as one.
    registry: 'inserted' | 'skipped';
  };
  gatesPassed?: ('positive-presence' | 'zero-grep' | 'tsc' | 'build:client' | 'one-home')[];
  homeRequested?: boolean;
  homeClaimed?: boolean; // true only if --home AND gate iv passed
  homeClaimRevertReason?: string; // populated when --home requested but gate iv failed
  preDeleted?: boolean; // step 0 scaffold removal happened
  reverted?: boolean; // Phase-1 full revert fired
  alreadyInstalled?: boolean; // S8ERI: dir present, skipped (use --force note)
}

interface ForeignSnapshot {
  island: string | null;
  huirth: string | null;
  // FT-008 AIME-3: vue.principle.ts joins the Phase-1 foreign snapshot. The registry
  // wire (import + REGISTERED_MUXONOMICS entry) is part of the BARE create — restored on
  // a Phase-1 full revert exactly like island/huirth.
  vuePrinciple: string | null;
}

// ============================================
// PRIVATE HELPERS
// ============================================

/**
 * Single-site exact string replacement. Drift (count !== 1) is a LOUD fail —
 * a missed anchor is never a silent no-op.
 */
function replaceInFile(path: string, oldStr: string, newStr: string): void {
  const content = readFileSync(path, 'utf8');
  const parts = content.split(oldStr);
  if (parts.length - 1 !== 1) {
    throw new Error(
      `anchor drift in ${path}: expected exactly 1 occurrence of "${oldStr}", found ${parts.length - 1}`,
    );
  }
  writeFileSync(path, parts.join(newStr));
}

const RENAME_ELIGIBLE = /\.(ts|vue)$/;

/**
 * Recursively walks `dir`; for each `.ts`/`.vue` file applies the ordered
 * [oldStr,newStr] pairs via split/join. Ordered so the longest/most-specific
 * token replaces first (SUITE8_ → Suite8 → suite8) — a prefix-substring never
 * pre-consumes a longer match. NEW dir only; never the template, never foreign.
 */
function replaceInDir(dir: string, pairs: [string, string][]): void {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      replaceInDir(full, pairs);
    } else if (RENAME_ELIGIBLE.test(entry)) {
      let content = readFileSync(full, 'utf8');
      for (const [oldStr, newStr] of pairs) {
        content = content.split(oldStr).join(newStr);
      }
      writeFileSync(full, content);
    }
  }
}

/**
 * The GLOB mv walk (S3 PRIME DISCOVERY · supersedes the literal 14-mv). Walks
 * `dir` recursively; for every file whose BASENAME starts `suite8`/`Suite8`,
 * renames in place with the basename token-substituted. `Suite8` FIRST (longest-
 * distinct) so the double-token `suite8RegisterSuite8` resolves both halves
 * correctly. Dir names in this concept are token-free, so only files rename.
 */
function renameBasenamesInDir(dir: string, Domain: string, domainLower: string): number {
  let count = 0;
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      count += renameBasenamesInDir(full, Domain, domainLower);
    } else if (/^(suite8|Suite8)/.test(entry)) {
      const newBasename = entry.replace(/Suite8/g, Domain).replace(/suite8/g, domainLower);
      renameSync(full, join(dir, newBasename));
      count++;
    }
  }
  return count;
}

/**
 * Anchored, idempotent foreign-file insert. If `guardToken` is already present
 * → skip (S8ERI idempotence). Else insert `insert` immediately AFTER the
 * `anchor` line, preserving the anchor's structure. Read-back verifies. Anchor
 * drift (anchor absent) is a LOUD fail.
 */
function aimeInsertAfter(
  path: string,
  anchor: string,
  insert: string,
  guardToken: string,
): 'inserted' | 'skipped' {
  const content = readFileSync(path, 'utf8');
  if (content.includes(guardToken)) {
    return 'skipped';
  }
  if (!content.includes(anchor)) {
    throw new Error(`AIME anchor drifted in ${path}: "${anchor}" not found`);
  }
  // Split on the anchor line; rejoin with anchor + newline + insert.
  const idx = content.indexOf(anchor);
  const lineEnd = content.indexOf('\n', idx);
  const cut = lineEnd === -1 ? content.length : lineEnd;
  const next = content.slice(0, cut) + '\n' + insert + content.slice(cut);
  writeFileSync(path, next);
  // Read-back Concluder.
  const back = readFileSync(path, 'utf8');
  if (!back.includes(insert)) {
    throw new Error(`AIME insert verify failed in ${path}: "${insert}" not present after write`);
  }
  return 'inserted';
}

/**
 * Inserts `importLine` directly ABOVE the line containing `beforeAnchor`. Guard:
 * skip if `guardToken` already present (the import is symmetric with the call —
 * one token, two sites; guarded together by the caller).
 */
function insertImportAbove(path: string, importLine: string, beforeAnchor: string): void {
  const content = readFileSync(path, 'utf8');
  if (!content.includes(beforeAnchor)) {
    throw new Error(`AIME import anchor drifted in ${path}: "${beforeAnchor}" not found`);
  }
  const idx = content.indexOf(beforeAnchor);
  // Back up to the start of the line holding the anchor.
  const lineStart = content.lastIndexOf('\n', idx) + 1;
  const next = content.slice(0, lineStart) + importLine + '\n' + content.slice(lineStart);
  writeFileSync(path, next);
}

// ============================================
// THE SVLF MODEL
// ============================================

export function runSuite8PageCreate(opts: Suite8PageCreateOptions): Suite8PageCreateResult {
  const { projectRoot, name } = opts;
  const home = opts.home === true;
  const force = opts.force === true;
  const exec = opts.execRunner ?? defaultExecRunner;

  // ---- S0 · Resolve scpRoot (fail-loud if no SCP) ----
  // NOTE: readScpRegistry applies the template holdback in non-debug mode — the
  // bundled 'template' SCP is filtered out. No redundant name!=='template' check
  // is needed here (S4 Green Forward-Context #3).
  const registry = readScpRegistry(projectRoot);
  if (registry.scps.length === 0) {
    return {
      ok: false,
      reason:
        'No installed SCP found in Cascades/SCPs.json — run `scs scp install <Designation>` first.',
    };
  }
  const entry = opts.designation
    ? registry.scps.find((s) => s.name === opts.designation)
    : registry.scps[registry.scps.length - 1]; // most-recent (S9 Band 2 precedent)
  if (!entry) {
    return { ok: false, reason: `SCP "${opts.designation}" not found in registry.` };
  }
  const scpRoot = join(projectRoot, entry.path); // entry.path = 'Cascades/scps/{Designation}/SCP'
  const templateDir = join(scpRoot, 'src/concepts/suite8');
  if (!existsSync(templateDir)) {
    return {
      ok: false,
      reason: `Template suite8 concept not found at ${templateDir} — the SCP scaffold is incomplete.`,
    };
  }

  // ---- S1 · validateAndDerive tokens (REUSE) ----
  const derived = validateAndDerive(name);
  if (!derived.ok) {
    return { ok: false, reason: `Invalid Suite 8 name "${name}": ${derived.reason}` };
  }
  const Domain = derived.derivation.designation; // 'Research'
  const domainLower = derived.derivation.conceptName; // 'research'
  const DOMAIN_UPPER = domainLower.toUpperCase(); // 'RESEARCH' (for SUITE8_ → {DOMAIN}_)
  const newDir = join(scpRoot, 'src/concepts', domainLower);

  const muxPath = join(newDir, `${domainLower}.muxonomy.ts`);

  // ---- S2 · S8ERI already-installed guard ----
  // A1 (S6 Purple): Context-B branch — dir exists + --home + !--force → SKIP
  // creation, jump straight to Phase 2 (the SAMLS-only re-claim).
  if (existsSync(newDir) && home && !force) {
    // C780 · THE HOME-CLAIM IS RETIRED (user directive): the converted domain Suite 8 is NO
    // LONGER set as the SCP home page — the default Home keeps the landing. --home is inert.
    return {
      ok: true,
      designation: Domain,
      conceptName: domainLower,
      scpRoot,
      newConceptDir: newDir,
      homeRequested: true,
      homeClaimed: false,
      gatesPassed: [],
    };
  }
  if (existsSync(newDir) && !force) {
    return {
      ok: false,
      alreadyInstalled: true,
      reason: `Page already created at src/concepts/${domainLower} — re-run with --force to recreate, or invoke --home to claim the home route.`,
    };
  }

  // ---- S3 · Snapshot (AIME foreign targets — Decision a) ----
  const islandPath = join(scpRoot, 'src/concepts/vue/IslandWrapper.vue');
  const huirthPath = join(scpRoot, 'src/concepts/huirth/huirth.concept.ts');
  // FT-008 AIME-3: vue.principle.ts is the THIRD foreign surface (the server nav/routing
  // registry). It joins the Phase-1 snapshot so a full revert restores it.
  const vuePrinciplePath = join(scpRoot, 'src/concepts/vue/vue.principle.ts');
  const snapshot: ForeignSnapshot = {
    island: existsSync(islandPath) ? readFileSync(islandPath, 'utf8') : null,
    huirth: existsSync(huirthPath) ? readFileSync(huirthPath, 'utf8') : null,
    vuePrinciple: existsSync(vuePrinciplePath) ? readFileSync(vuePrinciplePath, 'utf8') : null,
  };

  const revertAll = (): true => {
    if (existsSync(newDir)) rmSync(newDir, { recursive: true, force: true });
    if (snapshot.island !== null) writeFileSync(islandPath, snapshot.island);
    if (snapshot.huirth !== null) writeFileSync(huirthPath, snapshot.huirth);
    if (snapshot.vuePrinciple !== null) writeFileSync(vuePrinciplePath, snapshot.vuePrinciple);
    // Read-back Concluder on the restored foreign files.
    if (snapshot.island !== null) readFileSync(islandPath, 'utf8');
    if (snapshot.huirth !== null) readFileSync(huirthPath, 'utf8');
    if (snapshot.vuePrinciple !== null) readFileSync(vuePrinciplePath, 'utf8');
    return true;
  };

  try {
    // ---- S4 · Step 0 pre-delete (B1 collision · scripted) ----
    let preDeleted = false;
    if (existsSync(newDir)) {
      rmSync(newDir, { recursive: true, force: true });
      preDeleted = true;
    }

    // ---- S5 · cp the template concept (template dir UNTOUCHED) ----
    cpSync(templateDir, newDir, { recursive: true });

    // ---- S6 · GLOB mv walk (S3 DISCOVERY · supersedes the literal 14-mv) ----
    const filesRenamed = renameBasenamesInDir(newDir, Domain, domainLower);
    // Expected-rename manifest (positive-presence, NOT the bound).
    const manifest = [
      `${domainLower}.type.ts`,
      `${domainLower}.muxonomy.ts`,
      `${domainLower}.concept.huirth.ts`,
      `${domainLower}.concept.client.ts`,
      join('vue', `${Domain}HomeLanding.vue`),
    ];
    for (const rel of manifest) {
      if (!existsSync(join(newDir, rel))) {
        revertAll();
        return {
          ok: false,
          reverted: true,
          reason: `(manifest) expected renamed file absent: ${rel} — the GLOB mv walk did not land it.`,
        };
      }
    }

    // ---- S7 · Constant edit (ONE file · 2 sites) ----
    // Value-edit FIRST (the SUITE8_CONCEPT_NAME identifier is renamed by S8).
    const typePath = join(newDir, `${domainLower}.type.ts`);
    replaceInFile(
      typePath,
      `export const SUITE8_CONCEPT_NAME = 'suite8';`,
      `export const SUITE8_CONCEPT_NAME = '${domainLower}';`,
    );
    // THE DESIGNATION IS THE SPACED 8_SUITES DIR NAME (the Basalt bare-spawn fix): every
    // designation-keyed rail (the Instance.md identity compose · Extended/<designation>/S8.json ·
    // the SSMC session filter) resolves against Cascades/8_SUITES/<displayName>/ — the SPACED
    // name. Writing the Pascal `name` here made every generated page miss its own Instance.md
    // (graceful base-only degrade → a bare, identity-less spawn). displayName first; the
    // Pascal→spaced split as the fallback (the same idiom as the header fill below).
    replaceInFile(
      typePath,
      `export const DEFAULT_SUITE8_DESIGNATION_NAME = 'Template Suite 8';`,
      `export const DEFAULT_SUITE8_DESIGNATION_NAME = '${opts.displayName ?? name.replace(/([a-z0-9])([A-Z])/g, '$1 $2')}';`,
    );

    // ---- S8 · In-dir find-replace (case forms · NEW dir ONLY) ----
    // Order matters: longest/most-specific token FIRST so a prefix-substring
    // never pre-consumes a longer match.
    //   SUITE8_ → {DOMAIN}_   the screaming-snake macro prefix (SUITE8_CONCEPT_NAME)
    //   SUITE8  → {DOMAIN}    bare screaming-snake — citation comments
    //                         (e.g. DIAMOND-SUITE8-CONCEPT) the G5 LIVE Concluder
    //                         surfaced these 13 residuals the 3-form list missed;
    //                         the zero-grep gate (ii) is case-INsensitive so they count.
    //   Suite8  → {Domain}    PascalCase identifiers + in-file refs
    //   suite8  → {domainLower} camelCase identifiers + relative import strings
    replaceInDir(newDir, [
      ['SUITE8_', `${DOMAIN_UPPER}_`],
      ['SUITE8', DOMAIN_UPPER],
      ['Suite8', Domain],
      ['suite8', domainLower],
    ]);

    // ---- S8.5 · Derivable ADAPT fills (FT-006 miss · the ASIB boundary test) ----
    // The agent had to hand-Edit values the command ALREADY KNOWS from the name token:
    //   domainName ref          'Your Domain' → the designation (the page header)
    //   {domainLower}Name ref   'Your Domain' → the designation (the SSMC binding —
    //                            byte-matched to the Cascades/8_SUITES/{name}/ dir name)
    // Both placeholders are the SAME literal — one targeted replace in the landing file
    // fills both. The TAGLINE stays agent-side (creative content · fails the ASIB test).
    const landingPath = join(newDir, 'vue', `${Domain}HomeLanding.vue`);
    if (existsSync(landingPath)) {
      // FT-007 refinement: the fill must be the SPACED display form — the SSMC binding ref must
      // byte-match the Cascades/8_SUITES/{name}/ dir ('User Project Context'), NOT the PascalCase
      // command token ('UserProjectContext'). --display-name carries the exact dir name; the
      // fallback splits PascalCase on case boundaries (UserProjectContext → User Project Context).
      const display =
        opts.displayName ?? Domain.replace(/([a-z0-9])([A-Z])/g, '$1 $2');
      // BOTH placeholder occurrences (the header ref + the SSMC binding ref) fill with the
      // display form — an all-occurrences replace (replaceInFile enforces exactly-1; not this).
      const landingContent = readFileSync(landingPath, 'utf8');
      writeFileSync(landingPath, landingContent.split(`'Your Domain'`).join(`'${display}'`));

      // FT-009 refinement: the NAV LABEL is display-derivable too — the muxonomy's
      // HomeNavigation block shipped the template literal 'Domain Home' into the live nav
      // ("Doesn't have the Suite 8 Rename"). Block-scoped to the HomeNavigation export so
      // the roster labels stay untouched.
      const muxContent = readFileSync(muxPath, 'utf8');
      const homeNavAnchor = `export const ${domainLower}HomeNavigation`;
      const navIdx = muxContent.indexOf(homeNavAnchor);
      if (navIdx !== -1) {
        const blockEnd = muxContent.indexOf('};', navIdx);
        const block = muxContent.slice(navIdx, blockEnd);
        if (block.includes(`label: 'Domain Home'`)) {
          const filled = block.replace(`label: 'Domain Home'`, `label: '${display}'`);
          writeFileSync(muxPath, muxContent.slice(0, navIdx) + filled + muxContent.slice(blockEnd));
        }
      }

      // W1 · THE NAV LABEL RENAME GAP — the REGISTERED nav (the non-`--home` default) points at
      // `{domainLower}Navigation`, whose label ships the template literal 'Suite 8' (a spaced string
      // the `Suite8` → {Domain} token replace in S8 never touches). Without this fill EVERY generated
      // page's sidebar shows "Suite 8" instead of the display name. Block-scoped to the
      // `{domainLower}Navigation` export (the roster nav · the one getNavItems reads without --home)
      // so the HomeNavigation label + the roster PageEntry labels stay untouched. Re-read the file
      // fresh (the HomeNavigation fill above may have rewritten it).
      const muxAfterHome = readFileSync(muxPath, 'utf8');
      const rosterNavAnchor = `export const ${domainLower}Navigation`;
      const rosterIdx = muxAfterHome.indexOf(rosterNavAnchor);
      if (rosterIdx !== -1) {
        // Boundary = the NEXT `export const` (the HomeNavigation export or the muxonomic struct) so
        // the swap never reaches a sibling block.
        const afterRosterStart = rosterIdx + rosterNavAnchor.length;
        const nextRosterExport = muxAfterHome.indexOf('export const', afterRosterStart);
        const rosterEnd = nextRosterExport === -1 ? muxAfterHome.length : nextRosterExport;
        const rosterBlock = muxAfterHome.slice(rosterIdx, rosterEnd);
        if (rosterBlock.includes(`label: 'Suite 8'`)) {
          const rosterFilled = rosterBlock.replace(`label: 'Suite 8'`, `label: '${display}'`);
          writeFileSync(
            muxPath,
            muxAfterHome.slice(0, rosterIdx) + rosterFilled + muxAfterHome.slice(rosterEnd),
          );
        }
      }
    }

    // ---- S9 · The 3 foreign AIMEs (anchored · idempotent · skip-if-present) ----
    let island: 'inserted' | 'skipped' = 'skipped';
    let huirth: 'inserted' | 'skipped' = 'skipped';
    let registry: 'inserted' | 'skipped' = 'skipped';

    if (snapshot.island !== null) {
      island = aimeInsertAfter(
        islandPath,
        `  suite8Home: () => import('../suite8/vue/Suite8HomeLanding.vue'),`,
        `  ${domainLower}: () => import('../${domainLower}/vue/${Domain}HomeLanding.vue'),`,
        `  ${domainLower}: () => import('../${domainLower}/vue/${Domain}HomeLanding.vue')`,
      );
    }

    if (snapshot.huirth !== null) {
      const huirthGuard = `create${Domain}HuirthConcept`;
      const huirthContent = readFileSync(huirthPath, 'utf8');
      if (huirthContent.includes(huirthGuard)) {
        huirth = 'skipped';
      } else {
        // Insert the call AFTER the createSuite8HuirthConcept() anchor (6-space indent).
        aimeInsertAfter(
          huirthPath,
          `      createSuite8HuirthConcept(),`,
          `      create${Domain}HuirthConcept(),`,
          // call-only guard is the same token; pass a guard that won't pre-skip
          // (the outer guard above already gated; use a unique never-present token).
          ` __never_present__ `,
        );
        // Insert the import directly above `export const createHuirthConcept`.
        insertImportAbove(
          huirthPath,
          `import { create${Domain}HuirthConcept } from '../${domainLower}/${domainLower}.concept.huirth';`,
          `export const createHuirthConcept`,
        );
        huirth = 'inserted';
      }
    }

    // ---- S9.5 · AIME-3 · vue.principle.ts REGISTERED_MUXONOMICS (FT-008 THE THIRD SURFACE) ----
    // The CRITICAL missing wire (FT-008 S4 Green audit §2). Without the registry entry the
    // server runtime has ZERO knowledge of the new concept at nav-build time — no sidebar nav,
    // no route, absent from getAuthorizedIslandIds(). This is Phase 1 of the BARE create: the
    // page becomes VISIBLE in the nav WITHOUT any home claim. Two insertions, one guard token
    // (`${domainLower}Muxonomic` — domain-scoped + idempotent):
    //   (A) import line ABOVE `const REGISTERED_MUXONOMICS`.
    //   (B) array entry AFTER the `suiteCascadeMuxonomic,` anchor.
    if (snapshot.vuePrinciple !== null) {
      const registryGuard = `${domainLower}Muxonomic`;
      const vpContent = readFileSync(vuePrinciplePath, 'utf8');
      if (vpContent.includes(registryGuard)) {
        registry = 'skipped';
      } else {
        // (A) Import above the registry declaration.
        insertImportAbove(
          vuePrinciplePath,
          `import { ${domainLower}Muxonomic } from '../${domainLower}/${domainLower}.muxonomy';`,
          `const REGISTERED_MUXONOMICS`,
        );
        // (B) Array entry after the last existing entry (the suiteCascade anchor).
        aimeInsertAfter(
          vuePrinciplePath,
          `  suiteCascadeMuxonomic,`,
          `  ${domainLower}Muxonomic,`,
          // call-only guard: the outer guard above already gated; pass a never-present
          // token so the entry inserts (the import write does not pre-trip the guard).
          ` __never_present__ `,
        );
        registry = 'inserted';
      }
    }

    // ---- S10 · LFRCL Phase 1 (gates i-iii) ----
    // (i) POSITIVE PRESENCE
    if (!existsSync(muxPath)) {
      revertAll();
      return {
        ok: false,
        reverted: true,
        reason: `(i) positive-presence: ${domainLower}.muxonomy.ts absent — cp+rename did not land.`,
      };
    }
    // (ii) ZERO-GREP (the S3-DISCOVERY-validated gate · all 696 tokens must be gone)
    let remaining = 0;
    let remainingFiles = '';
    try {
      const out = exec(`grep -ric 'suite8' "${newDir}" || true`, scpRoot);
      remaining = out
        .split('\n')
        .filter(Boolean)
        .reduce((s, l) => s + Number(l.split(':').pop()), 0);
      if (remaining !== 0) {
        try {
          remainingFiles = exec(`grep -ril 'suite8' "${newDir}" || true`, scpRoot).trim();
        } catch {
          remainingFiles = '(grep -rl unavailable)';
        }
      }
    } catch (e) {
      revertAll();
      return {
        ok: false,
        reverted: true,
        reason: `(ii) zero-grep: grep failed: ${(e as Error).message}`,
      };
    }
    if (remaining !== 0) {
      revertAll();
      return {
        ok: false,
        reverted: true,
        reason: `(ii) zero-grep: ${remaining} 'suite8' token(s) remain — un-renamed sites: ${remainingFiles}`,
      };
    }
    // (iii) tsc
    try {
      exec('npx tsc --noEmit', scpRoot);
    } catch (e) {
      const detail = (e as { stdout?: { toString(): string }; message?: string }).stdout
        ? (e as { stdout: { toString(): string } }).stdout.toString()
        : (e as Error).message;
      revertAll();
      return {
        ok: false,
        reverted: true,
        reason: `(iii) tsc --noEmit FAILED:\n${detail}`,
      };
    }

    const gatesPassed: Suite8PageCreateResult['gatesPassed'] = [
      'positive-presence',
      'zero-grep',
      'tsc',
    ];

    const baseResult: Suite8PageCreateResult = {
      ok: true,
      designation: Domain,
      conceptName: domainLower,
      scpRoot,
      newConceptDir: newDir,
      filesRenamed,
      aimeInserts: { island, huirth, registry },
      gatesPassed,
      preDeleted,
    };

    // ---- S11 · SSBLF Phase 2 (`--home` ONLY · two-phase · Decision b) ----
    if (!home) {
      return { ...baseResult, homeRequested: false, homeClaimed: false };
    }
    // C780 · THE HOME-CLAIM IS RETIRED (user directive) — --home is inert; the default Home
    // keeps the landing. The phase function remains below for historical reference only.
    return { ...baseResult, homeRequested: true, homeClaimed: false };
  } catch (err) {
    // Any unexpected throw during Phase 1 → full revert (loud fail).
    revertAll();
    return {
      ok: false,
      reverted: true,
      reason: `Phase-1 unexpected failure: ${(err as Error).message}`,
    };
  }
}

/**
 * Replaces ONLY the first occurrence of `oldStr` within the block bounded by
 * `blockAnchor` (a unique `export const ...` / `conceptName: ...` start) and the
 * NEXT `boundaryToken`. A LOUD fail when the anchor or the in-block token drifts.
 * This is the block-scoped swap primitive all THREE Phase-2 ops share — a naive
 * global flip would catch sibling NavigationConfig blocks (A2 named hazard · FT-008).
 */
function blockScopedReplace(
  path: string,
  blockAnchor: string,
  boundaryToken: string,
  oldStr: string,
  newStr: string,
  label: string,
): void {
  const content = readFileSync(path, 'utf8');
  const blockStart = content.indexOf(blockAnchor);
  if (blockStart === -1) {
    throw new Error(`${label}: block anchor drifted: "${blockAnchor}" not found in ${path}`);
  }
  const afterStart = blockStart + blockAnchor.length;
  const nextBoundary = content.indexOf(boundaryToken, afterStart);
  const blockEnd = nextBoundary === -1 ? content.length : nextBoundary;
  const block = content.slice(blockStart, blockEnd);
  const flipped = block.replace(oldStr, newStr);
  if (flipped === block) {
    throw new Error(`${label}: "${oldStr}" not found in the block at "${blockAnchor}"`);
  }
  writeFileSync(path, content.slice(0, blockStart) + flipped + content.slice(blockEnd));
}

/**
 * SSBLF Phase 2 — the `--home` route claim. THREE block-scoped swaps + gate iv:
 *   (a) the muxonomic NAVIGATION SWAP — the registered config's `navigation` field
 *       points at `{domainLower}Navigation` (the sidebar nav); the home claim must
 *       register `{domainLower}HomeNavigation` so isMainLanding:true is the one read
 *       (Gap 2 · FT-008 S7 Fuchsia). Without this the SAMLS flip is invisible.
 *   (b) the DEFAULT HOME DISABLE (USER DECISION) — DEFAULT_LANDING_MUXONOMIC in
 *       vue.principle.ts flips isMainLanding:true → false so the default yields the
 *       `/` route the moment the user's page claims it.
 *   (c) the incumbent flip — cadmium.muxonomy.ts isMainLanding:true → false so the
 *       template's landing incumbent yields too (USER DECISION supersedes the prior
 *       order-resolution no-flip).
 *   + the SAMLS flip in the {domainLower}HomeNavigation block (isMainLanding:false→true,
 *     order:2→0 · A2 named hazard).
 * gate iv build:client stays LAST (after every edit · the audit's ordering note).
 * On gate-iv failure / any swap error → SAMLS-only revert restoring ALL THREE files
 * (base concept PRESERVED). Reused by both the fresh `--home` path (S11) and the
 * Context-B re-claim (A1 / S2).
 */
function runHomeClaimPhase(
  exec: ExecRunner,
  scpRoot: string,
  newDir: string,
  muxPath: string,
  domainLower: string,
  carry: Suite8PageCreateResult,
): Suite8PageCreateResult {
  if (!existsSync(muxPath)) {
    return {
      ...carry,
      homeRequested: true,
      homeClaimed: false,
      homeClaimRevertReason: `${domainLower}.muxonomy.ts absent — cannot claim home route.`,
    };
  }

  // Phase-2 snapshots (SAMLS-only revert scope · all three home-claim files).
  const vuePrinciplePath = join(scpRoot, 'src/concepts/vue/vue.principle.ts');
  const cadmiumMuxPath = join(scpRoot, 'src/concepts/cadmium/cadmium.muxonomy.ts');
  const muxSnapshot = readFileSync(muxPath, 'utf8');
  const vuePrincipleSnapshot = existsSync(vuePrinciplePath)
    ? readFileSync(vuePrinciplePath, 'utf8')
    : null;
  const cadmiumSnapshot = existsSync(cadmiumMuxPath)
    ? readFileSync(cadmiumMuxPath, 'utf8')
    : null;

  const revertPhase2 = (): void => {
    writeFileSync(muxPath, muxSnapshot);
    if (vuePrincipleSnapshot !== null) writeFileSync(vuePrinciplePath, vuePrincipleSnapshot);
    if (cadmiumSnapshot !== null) writeFileSync(cadmiumMuxPath, cadmiumSnapshot);
  };

  try {
    // ---- SAMLS swap · block-scoped to the *HomeNavigation block (A2) ----
    // The `isMainLanding: false` + `order:` tokens appear in MULTIPLE NavigationConfig
    // blocks. Anchor on `export const {domainLower}HomeNavigation` and replace ONLY
    // within the slice up to the NEXT `export const`.
    const content = readFileSync(muxPath, 'utf8');
    const blockAnchor = `export const ${domainLower}HomeNavigation`;
    const blockStart = content.indexOf(blockAnchor);
    if (blockStart === -1) {
      throw new Error(`SAMLS anchor drifted: "${blockAnchor}" not found in ${muxPath}`);
    }
    const afterStart = blockStart + blockAnchor.length;
    const nextExport = content.indexOf('export const', afterStart);
    const blockEnd = nextExport === -1 ? content.length : nextExport;
    const block = content.slice(blockStart, blockEnd);

    const flipMain = block.replace('isMainLanding: false', 'isMainLanding: true');
    if (flipMain === block) {
      throw new Error(`SAMLS: "isMainLanding: false" not found in the ${domainLower}HomeNavigation block`);
    }
    const flipOrder = flipMain.replace('order: 2', 'order: 0');
    if (flipOrder === flipMain) {
      throw new Error(`SAMLS: "order: 2" not found in the ${domainLower}HomeNavigation block`);
    }
    const swapped = content.slice(0, blockStart) + flipOrder + content.slice(blockEnd);
    writeFileSync(muxPath, swapped);

    // ---- (a) the muxonomic NAVIGATION SWAP (Gap 2) ----
    // Block-scoped to the `{domainLower}Muxonomic` struct: `navigation: {domainLower}Navigation`
    // → `navigation: {domainLower}HomeNavigation`. The registered config must expose the home
    // nav so the SAMLS isMainLanding:true is the one getLandingIsland() reads. The boundary is
    // the closing `};` of the struct (the LAST export in the file).
    blockScopedReplace(
      muxPath,
      `export const ${domainLower}Muxonomic`,
      '\n};',
      `navigation: ${domainLower}Navigation`,
      `navigation: ${domainLower}HomeNavigation`,
      'navigation-swap',
    );

    // ---- (b) the DEFAULT HOME DISABLE (USER DECISION) ----
    // Block-scoped to the DEFAULT_LANDING_MUXONOMIC inline constant (anchor: the
    // `conceptName: 'default'` line · boundary: the next `const REGISTERED_MUXONOMICS`).
    // isMainLanding: true → false so the default yields `/` the moment the user claims it.
    if (vuePrincipleSnapshot !== null) {
      blockScopedReplace(
        vuePrinciplePath,
        `conceptName: 'default'`,
        'const REGISTERED_MUXONOMICS',
        'isMainLanding: true',
        'isMainLanding: false',
        'default-disable',
      );

      // ---- (b2) DHCU · the DEFAULT HOME UNREGISTERED from the Muxonomy (USER DIRECTIVE ·
      // the DH salvo unanimous): the nav filter gates ONLY on `enabled === false` — the flag
      // flip above governs the LANDING pick but the 'Home' nav entry persists as long as the
      // DEFAULT sits in REGISTERED_MUXONOMICS. Remove the ARRAY ENTRY (the const stays defined
      // as the revert anchor · the vuePrinciple snapshot restores on any Phase-2 failure). All
      // consumers verified array-driven (no 'default' lookups); the unclaimed fallback is safe.
      const vpContent = readFileSync(vuePrinciplePath, 'utf8');
      if (vpContent.includes('  DEFAULT_LANDING_MUXONOMIC,\n')) {
        writeFileSync(
          vuePrinciplePath,
          vpContent.replace('  DEFAULT_LANDING_MUXONOMIC,\n', ''),
        );
      }
    }

    // ---- (c) the incumbent flip (USER DECISION supersedes the no-flip) ----
    // Block-scoped to `export const cadmiumNavigation` (boundary: the next `export const`).
    // isMainLanding: true → false so the template landing incumbent yields to the user's page.
    if (cadmiumSnapshot !== null) {
      // FT-009 correction (user): the template now SHIPS cadmium isMainLanding:false (the
      // DEFAULT Home owns the template landing). The flip is an idempotent SAFETY for older
      // installs — skip when already false.
      if (readFileSync(cadmiumMuxPath, 'utf8').includes('isMainLanding: true')) {
        blockScopedReplace(
          cadmiumMuxPath,
          `export const cadmiumNavigation`,
          'export const',
          'isMainLanding: true',
          'isMainLanding: false',
          'cadmium-flip',
        );
      }
    }

    // ---- gate iv · build:client (LAST · after ALL edits · audit ordering note) ----
    try {
      exec('npm run build:client', scpRoot);
    } catch (e) {
      revertPhase2(); // SAMLS-only revert — base PRESERVED, all three files restored
      return {
        ...carry,
        ok: true,
        homeRequested: true,
        homeClaimed: false,
        homeClaimRevertReason: `build:client failed: ${(e as Error).message}`,
      };
    }

    // ---- gate v · ONE-HOME static assertion (FT-009 · what the retired smoke would have
    // caught belongs IN the command): exactly one claimant across the three surfaces —
    // the domain HomeNavigation true · the DEFAULT landing false · cadmium false. A launch
    // on a fresh boot then CANNOT land on the default.
    const after = readFileSync(muxPath, 'utf8');
    const homeClaimed = after.includes('isMainLanding: true');
    const vueAfter = readFileSync(vuePrinciplePath, 'utf8');
    const defaultBlock = vueAfter.slice(
      vueAfter.indexOf(`conceptName: 'default'`),
      vueAfter.indexOf('const REGISTERED_MUXONOMICS'),
    );
    const cadAfter = readFileSync(cadmiumMuxPath, 'utf8');
    // DHCU (the DH salvo · gate-v extension): the DEFAULT must be UNREGISTERED — the comma
    // form targets the ARRAY ENTRY only (the const definition stays as the revert anchor).
    const defaultUnregistered = !vueAfter.includes('  DEFAULT_LANDING_MUXONOMIC,');
    const oneHome =
      homeClaimed &&
      defaultUnregistered &&
      !defaultBlock.includes('isMainLanding: true') &&
      !cadAfter.includes('isMainLanding: true');
    if (!oneHome) {
      revertPhase2();
      return {
        ...carry,
        ok: true,
        homeRequested: true,
        homeClaimed: false,
        homeClaimRevertReason:
          'one-home assertion failed: ' +
          `domain=${homeClaimed} defaultUnregistered=${defaultUnregistered} ` +
          `defaultFalse=${!defaultBlock.includes('isMainLanding: true')} ` +
          `cadmiumFalse=${!cadAfter.includes('isMainLanding: true')}`,
      };
    }
    const gatesPassed: Suite8PageCreateResult['gatesPassed'] = [
      ...(carry.gatesPassed ?? []),
      'build:client',
      'one-home',
    ];
    return {
      ...carry,
      ok: true,
      homeRequested: true,
      homeClaimed,
      gatesPassed,
    };
  } catch (e) {
    revertPhase2(); // SAMLS-only revert on any swap error — all three files restored
    return {
      ...carry,
      ok: true,
      homeRequested: true,
      homeClaimed: false,
      homeClaimRevertReason: `SAMLS swap failed: ${(e as Error).message}`,
    };
  }
}
