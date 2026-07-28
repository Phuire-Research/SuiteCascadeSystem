/**
 * SCP Install Pipeline Orchestrator (RM-D3)
 *
 * 7-step composer for the SCP installation Lambda-event:
 *   1. Validate designation (via RM-D1 validateAndDerive)
 *   2. Generate bare-minimum concept bundle (inline-ported from template)
 *   3. Materialize template tree (clone + case-preserving rename · inline-ported)
 *   4. Run npm install in the cloned tree (optional · gated by runNpmInstall)
 *   5. Update Cascades/SCPs.json (via RM-D4 helpers)
 *   6. Build spawn descriptor (inline-ported from template scpSpawn.model.ts)
 *   7. Caller spawns from descriptor (NOT performed here · returns descriptor)
 *
 * Cross-Project Boundary (Option α / CSCPIBIP): pure functions copied verbatim
 * from the template-side M2 substrate with citation comments. Future Diamond
 * may extract to shared package; for Macro 3 install the inline-port keeps the
 * CLI self-contained.
 *
 * Citation: DIAMOND-TIER-REFINE-MACRO-SCP-INSTALL.md RM-D3
 * Citation: SUITE-2-ORANGE-CLI-INSTALL-MANIFOLD.md SIPCO
 * Citation: SUITE-6-PURPLE-INSTALL-PIPELINE-ORCHESTRATION.md RM-D3 + Option α
 */
import {
  existsSync,
  statSync,
  readdirSync,
  readFileSync,
  writeFileSync,
  copyFileSync,
  mkdirSync,
  renameSync,
  rmSync,
  openSync,
  closeSync,
} from 'node:fs';
import {
  mkdir as fsMkdir,
  readdir as fsReaddir,
  stat as fsStat,
  readFile as fsReadFile,
  writeFile as fsWriteFile,
  copyFile as fsCopyFile,
} from 'node:fs/promises';
import path from 'node:path';
import { execSync, spawn } from 'node:child_process';
import {
  validateAndDerive,
  type NameDerivation,
} from './installScpPrompts';
import {
  readScpRegistry,
  writeScpRegistry,
  appendScpEntry,
  buildScpRegistryEntry,
  pickPortFromRegistry,
  type ScpRegistry,
} from './scpPersistence';
import { ensureNestedGitStructure } from '../bridge/gitmNestedMaintain';
import { SCP_CONFIG_FILENAME } from '../bridge/scpConfig.model';
// MB-W1 · THE URL PRIMITIVE · performClone owns the dual-path clone (file:// → fs cp,
// remote → git clone --depth=1). Reused verbatim for sourceUrl foreign-source installs.
import { performClone, performCloneAtCommit } from '../bridge/installSpawn';

// ============================================
// REF-D1 · ISAPSP · Install-SCP-Approval-Pre-Supplied-Pathing
// ============================================
// Minimal allowlist patterns pre-granted in .claude/settings.json before
// the install pipeline fires npm install. Closes the macOS AppleEvents/TCC
// mid-pipeline Bash approval prompt friction site at scpInstall.ts:672.
// MINIMAL set per R2 RECOMMENDATION + R4 DECISION + R3 blueprint A1:
// no Bash(npm run *) or Bash(node *) — those exceed REF-D1's UX isolation.
// Citation: SUITE-3-YELLOW-REF-D1-ARCHITECTURE.md A1 + A2
export const REQUIRED_ALLOW_PATTERNS = [
  'Bash(scs scp install *)',
  'Bash(npm install)',
] as const;

/**
 * writeApprovalSettings · ISAPSP install pipeline step
 *
 * Writes/merges .claude/settings.json at projectRoot with the MINIMAL
 * allowlist pattern set so ClaudeCode does not prompt for Bash approval
 * mid-pipeline (specifically at execSync('npm install') line 672 below).
 *
 * Idempotent: re-running is a no-op when both required patterns already
 * present. Additive: existing custom patterns preserved via spread.
 * Non-fatal: malformed JSON or write failures log a warning and return —
 * install pipeline continues (TCC may still prompt; acceptable degradation
 * per R3 blueprint Edge Case table row F).
 *
 * Atomic write: tmp + rename to avoid torn writes on crash.
 *
 * Does NOT touch .claude/settings.local.json (user-owned per R3 + R7).
 *
 * Citation: SUITE-3-YELLOW-REF-D1-ARCHITECTURE.md B2 + B3
 */
export function writeApprovalSettings(projectRoot: string): void {
  const settingsDir = path.join(projectRoot, '.claude');
  const settingsPath = path.join(settingsDir, 'settings.json');

  let existing: { permissions?: { allow?: string[] } } = {};
  if (existsSync(settingsPath)) {
    try {
      existing = JSON.parse(readFileSync(settingsPath, 'utf8')) as typeof existing;
    } catch {
      console.warn('[install] stage approval-pregrant · settings.json malformed · skipping write');
      return;
    }
  }

  const currentAllow: string[] = existing?.permissions?.allow ?? [];
  const missing = REQUIRED_ALLOW_PATTERNS.filter((p) => !currentAllow.includes(p));

  if (missing.length === 0) {
    return;
  }

  const merged = {
    ...existing,
    permissions: {
      ...(existing.permissions ?? {}),
      allow: [...currentAllow, ...missing],
    },
  };

  const tmpPath = settingsPath + '.tmp';
  try {
    if (!existsSync(settingsDir)) {
      mkdirSync(settingsDir, { recursive: true });
    }
    writeFileSync(tmpPath, JSON.stringify(merged, null, 2) + '\n', 'utf8');
    renameSync(tmpPath, settingsPath);
    console.log(`[install] stage approval-pregrant · settings.json updated · ${missing.length} pattern(s) added`);
  } catch (err) {
    console.warn(`[install] stage approval-pregrant · settings.json write failed (non-fatal): ${String(err)}`);
    if (existsSync(tmpPath)) {
      try {
        rmSync(tmpPath);
      } catch {
        /* best-effort cleanup */
      }
    }
  }
}

// ============================================
// INLINE-PORTED · conceptGenerator.model.ts (template M2-A1-D2)
// ============================================

export interface GeneratedConceptFile {
  relativePath: string;
  content: string;
}

export interface GeneratedConceptBundle {
  files: GeneratedConceptFile[];
  conceptName: string;
  designation: string;
  fileCount: number;
}

function generateTypeFile(d: NameDerivation): string {
  const PascalName = d.designation;
  const camelName = d.conceptName;
  return `/**
 * ${PascalName} Concept Type Definitions
 *
 * Bare-minimum SCP concept generated by SCS-Bridge install (RM-D3).
 */
import type { Concept, Quality, AnyAction } from 'stratimux';

export const ${camelName}Name = '${camelName}';

export type ${PascalName}State = {
  actionQue: AnyAction[];
  filterKeys: string[];
  initializedAt: number;
};

export type ${PascalName}Qualities = Record<string, Quality<${PascalName}State, Record<string, unknown>>>;

export type ${PascalName}Concept = Concept<${PascalName}State, ${PascalName}Qualities>;
`;
}

function generateStateFile(d: NameDerivation): string {
  const PascalName = d.designation;
  const camelName = d.conceptName;
  const upperName = camelName.toUpperCase();
  return `/**
 * ${PascalName} Concept State Factory
 */
import type { ${PascalName}State } from './${camelName}.type';

export function create${PascalName}State(): ${PascalName}State {
  return {
    actionQue: [],
    filterKeys: ${upperName}_FILTER_KEYS,
    initializedAt: Date.now(),
  };
}

export const ${upperName}_FILTER_KEYS: string[] = [
  'actionQue',
  'filterKeys',
];
`;
}

function generateConceptFile(d: NameDerivation): string {
  const PascalName = d.designation;
  const camelName = d.conceptName;
  return `/**
 * ${PascalName} Concept Factory
 */
import { createConcept } from 'stratimux';
import { ${camelName}Name, type ${PascalName}Qualities } from './${camelName}.type';
import { create${PascalName}State } from './${camelName}.state';

const ${camelName}Qualities: ${PascalName}Qualities = {};

export const create${PascalName}Concept = () => {
  return createConcept(
    ${camelName}Name,
    create${PascalName}State(),
    ${camelName}Qualities,
    [],
  );
};
`;
}

// Diamond β RM-Asp-3: Vue Landing surface generation
// Minimum viable Home Page feature · auto-registers as the SCP's landing.
// Full Vue-route activation (default island binding) is design-deferred per S7;
// MVP scope is generator + bundle extension to 4 files.
function generateLandingFile(d: NameDerivation): string {
  const PascalName = d.designation;
  const camelName = d.conceptName;
  return `<script setup lang="ts">
/**
 * ${PascalName} Landing — Personal SCP Home Page (RM-Asp-3)
 *
 * Auto-generated by SCS-Bridge install wizard. This is the FEATURED Home Page
 * for the ${d.designation} SCP — your personalized landing surface within the
 * Stratimuxian Manifold. Customize freely.
 *
 * Pattern: each concept owns its Vue pages. Place additional components under
 * ./components/ as features land.
 */
import { ref } from 'vue';

const designation = ref<string>('${PascalName}');
const conceptName = ref<string>('${camelName}');
const installedAt = ref<string>(new Date().toLocaleString());
</script>

<template>
  <main class="${camelName}-landing">
    <h1>{{ designation }} SCP</h1>
    <p class="subtitle">Personalized Stratimuxian Manifold · Concept: <code>{{ conceptName }}</code></p>

    <section class="welcome">
      <p>Welcome to your SCP. This is the auto-generated Home Page from the install wizard.</p>
      <p>Customize this surface as your SCP grows: add features, register qualities, compose
      concepts via muxifyConcepts.</p>
    </section>

    <section class="next-steps">
      <h2>Next Steps</h2>
      <ul>
        <li>Add qualities to <code>src/concepts/{{ conceptName }}/{{ conceptName }}.concept.ts</code></li>
        <li>Compose additional concepts into the muxonomy</li>
        <li>Engage Cadmium Researcher (Macro 3) for hyper-personalization</li>
      </ul>
    </section>

    <footer class="footprint">
      <span>Installed: {{ installedAt }}</span>
    </footer>
  </main>
</template>

<style scoped>
.${camelName}-landing {
  max-width: 720px;
  margin: 4rem auto;
  padding: 2rem;
  font-family: system-ui, sans-serif;
  color: #d4d4d4;
}
.${camelName}-landing h1 {
  font-size: 2.5rem;
  margin-bottom: 0.5rem;
}
.subtitle {
  color: #888;
  margin-bottom: 2rem;
}
.welcome, .next-steps {
  margin-bottom: 2rem;
  line-height: 1.6;
}
.next-steps h2 {
  font-size: 1.5rem;
  margin-bottom: 1rem;
}
.next-steps ul {
  padding-left: 1.5rem;
}
.next-steps li {
  margin-bottom: 0.5rem;
}
.footprint {
  margin-top: 4rem;
  padding-top: 1rem;
  border-top: 1px solid #333;
  font-size: 0.85rem;
  color: #666;
}
code {
  background: #2a2a2a;
  padding: 0.15rem 0.4rem;
  border-radius: 3px;
  font-size: 0.9em;
}
</style>
`;
}

export function generateBareMinimumConcept(d: NameDerivation): GeneratedConceptBundle {
  const dir = `concepts/${d.conceptName}`;
  const files: GeneratedConceptFile[] = [
    { relativePath: `${dir}/${d.conceptName}.type.ts`, content: generateTypeFile(d) },
    { relativePath: `${dir}/${d.conceptName}.state.ts`, content: generateStateFile(d) },
    { relativePath: `${dir}/${d.conceptName}.concept.ts`, content: generateConceptFile(d) },
    // Diamond β RM-Asp-3: Vue Landing surface for Home Page featuring
    { relativePath: `${dir}/vue/${d.designation}Landing.vue`, content: generateLandingFile(d) },
  ];
  return { files, conceptName: d.conceptName, designation: d.designation, fileCount: files.length };
}

// ============================================
// INLINE-PORTED · cloneRenameEngine.model.ts (template M2-A1-D3)
// ============================================

export const CLONE_SKIP_DIRS: readonly string[] = ['node_modules', 'dist', 'coverage', '.git'];
export const CLONE_SKIP_FILES: readonly string[] = ['.bridge-restart.json', '.DS_Store', '*.tsbuildinfo'];
export const RENAME_ELIGIBLE_EXTENSIONS: readonly string[] = [
  '.ts',
  '.tsx',
  '.js',
  '.jsx',
  '.json',
  '.md',
  '.html',
  '.css',
  '.vue',
];

export interface RenameRule {
  template: string;
  replacement: string;
  caseSensitive: boolean;
}

export function buildRenameRules(d: NameDerivation): RenameRule[] {
  return [
    {
      template: 'huirth-scp-template',
      replacement: `${d.conceptName.toLowerCase()}-scp`,
      caseSensitive: true,
    },
    {
      template: 'HuiRth SCP Template - Barebones Co-Located Vue Island Architecture',
      replacement: `${d.designation} SCP - Personalized Stratimuxian Manifold`,
      caseSensitive: true,
    },
  ];
}

export function applyRenameRules(content: string, rules: RenameRule[]): string {
  let result = content;
  for (const rule of rules) {
    if (rule.caseSensitive) {
      result = result.split(rule.template).join(rule.replacement);
    } else {
      const lower = rule.template.toLowerCase();
      const upper = rule.template.toUpperCase();
      const capitalized = rule.template.charAt(0).toUpperCase() + rule.template.slice(1).toLowerCase();
      const replLower = rule.replacement.toLowerCase();
      const replUpper = rule.replacement.toUpperCase();
      const replCap =
        rule.replacement.charAt(0).toUpperCase() + rule.replacement.slice(1).toLowerCase();
      result = result.split(lower).join(replLower);
      result = result.split(upper).join(replUpper);
      result = result.split(capitalized).join(replCap);
    }
  }
  return result;
}

export function shouldSkip(basename: string): boolean {
  if (CLONE_SKIP_DIRS.includes(basename)) return true;
  for (const pattern of CLONE_SKIP_FILES) {
    if (pattern.startsWith('*')) {
      const ext = pattern.slice(1);
      if (basename.endsWith(ext)) return true;
    } else if (basename === pattern) {
      return true;
    }
  }
  return false;
}

export function isRenameEligible(filePath: string): boolean {
  const ext = path.extname(filePath).toLowerCase();
  return RENAME_ELIGIBLE_EXTENSIONS.includes(ext);
}

export function cloneWithRename(
  srcDir: string,
  destDir: string,
  rules: RenameRule[],
): { filesCopied: number; dirsCreated: number } {
  let filesCopied = 0;
  let dirsCreated = 0;

  function walk(currentSrc: string, currentDest: string): void {
    if (!existsSync(currentDest)) {
      mkdirSync(currentDest, { recursive: true });
      dirsCreated++;
    }
    const entries = readdirSync(currentSrc);
    for (const entry of entries) {
      if (shouldSkip(entry)) continue;
      const srcEntry = path.join(currentSrc, entry);
      const destEntry = path.join(currentDest, entry);
      const stat = statSync(srcEntry);
      if (stat.isDirectory()) {
        walk(srcEntry, destEntry);
      } else if (stat.isFile()) {
        if (isRenameEligible(srcEntry)) {
          const content = readFileSync(srcEntry, 'utf8');
          const renamed = applyRenameRules(content, rules);
          writeFileSync(destEntry, renamed, 'utf8');
        } else {
          copyFileSync(srcEntry, destEntry);
        }
        filesCopied++;
      }
    }
  }

  walk(srcDir, destDir);
  return { filesCopied, dirsCreated };
}

// ============================================
// Issue #643 Refinement · NON-BLOCKING clone (event-loop yielding)
// ============================================
//
// `cloneWithRename` (above) is a SYNC recursive walk (readFileSync /
// writeFileSync / copyFileSync). On the async install path it BLOCKED the
// event loop for the whole template materialization → the TUI render loop
// could not paint → the progress bar froze during the `staging` phase.
//
// `cloneWithRenameAsync` is a byte-equivalent mirror that swaps every FS call
// for its `node:fs/promises` form. Each `await` yields the event loop so the
// render loop keeps painting throughout the copy (mirrors the WTSR `fsCp`
// remedy at installSpawn.ts). Rename-eligible files still get the per-file
// content transform (readFile → applyRenameRules → writeFile); non-eligible
// files are copyFile'd. SYNC `cloneWithRename` is left untouched for the sync
// callers (`runInstallScpPipeline`, `scs scp install`, tests).
export async function cloneWithRenameAsync(
  srcDir: string,
  destDir: string,
  rules: RenameRule[],
): Promise<{ filesCopied: number; dirsCreated: number }> {
  let filesCopied = 0;
  let dirsCreated = 0;

  async function walk(currentSrc: string, currentDest: string): Promise<void> {
    if (!existsSync(currentDest)) {
      await fsMkdir(currentDest, { recursive: true });
      dirsCreated++;
    }
    const entries = await fsReaddir(currentSrc);
    for (const entry of entries) {
      if (shouldSkip(entry)) continue;
      const srcEntry = path.join(currentSrc, entry);
      const destEntry = path.join(currentDest, entry);
      const stat = await fsStat(srcEntry);
      if (stat.isDirectory()) {
        await walk(srcEntry, destEntry);
      } else if (stat.isFile()) {
        if (isRenameEligible(srcEntry)) {
          const content = await fsReadFile(srcEntry, 'utf8');
          const renamed = applyRenameRules(content, rules);
          await fsWriteFile(destEntry, renamed, 'utf8');
        } else {
          await fsCopyFile(srcEntry, destEntry);
        }
        filesCopied++;
      }
    }
  }

  await walk(srcDir, destDir);
  return { filesCopied, dirsCreated };
}

export function writeGeneratedConcept(
  installSrcDir: string,
  bundle: GeneratedConceptBundle,
): { filesWritten: number } {
  let filesWritten = 0;
  for (const file of bundle.files) {
    const fullPath = path.join(installSrcDir, file.relativePath);
    const dir = path.dirname(fullPath);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
    writeFileSync(fullPath, file.content, 'utf8');
    filesWritten++;
  }
  return { filesWritten };
}

// ============================================
// INLINE-PORTED · scpSpawn.model.ts (template M2-A1-D5)
// ============================================

export interface SerializableSpawnDescriptor {
  command: string;
  args: string[];
  cwd: string;
  detached: true;
  stdio: ['ignore', 'pipe' | 'inherit' | 'ignore', 'pipe' | 'inherit' | 'ignore'];
  env: Record<string, string>;
  shouldUnref: true;
  browserUrl: string;
  scpName: string;
}

export const SCP_PORT_RANGE_START = 7700;
export const SCP_PORT_RANGE_END = 7799;

export interface BuildSpawnDescriptorOptions {
  installPath: string;
  derivation: NameDerivation;
  port: number;
  parentEnv?: Record<string, string>;
}

export function buildSpawnDescriptor(opts: BuildSpawnDescriptorOptions): SerializableSpawnDescriptor {
  const env: Record<string, string> = {
    ...(opts.parentEnv ?? {}),
    SCP_NAME: opts.derivation.designation,
    SCP_CONCEPT_NAME: opts.derivation.conceptName,
    SCP_BRIDGE_PORT: String(opts.port),
    PORT: String(opts.port),
  };

  return {
    command: 'npm',
    args: ['run', 'bridge'],
    cwd: path.resolve(opts.installPath),
    detached: true,
    stdio: ['ignore', 'pipe', 'pipe'],
    env,
    shouldUnref: true,
    browserUrl: `http://localhost:${opts.port}`,
    scpName: opts.derivation.designation,
  };
}

// ============================================
// PORT RESOLUTION (migrated to scpPersistence.ts · Template Citizenship BO-2-C)
// ============================================
// pickPortFromRegistry now lives in scpPersistence.ts (co-located with the
// registry read/write surface so upsertTemplateCitizen can call it without a
// circular import). Imported above and re-exported here to preserve the public
// API — all existing callers (and scpInstall.test.ts) keep importing it from
// './scpInstall'.
export { pickPortFromRegistry };

// ============================================
// PIPELINE ORCHESTRATOR (7-step composer)
// ============================================

export interface RunInstallScpPipelineOptions {
  projectRoot: string;
  designation: string;
  templateRoot?: string; // defaults to {projectRoot}/Cascades/scps/template/SCP
  // C822 D2 · THE COMMIT ANCHOR (RD-SCP-MANIFEST v1): when present, the sourceUrl clone
  // checks out THIS hash — never HEAD. Recorded onto the registry row as anchoredAt.
  anchorCommit?: string;
  runNpmInstall?: boolean; // default true · false for tests
  buildDescriptor?: boolean; // default true · false skips step 6
  templateVersion?: string; // for SCPs.json entry · default '0.1.0'
  parentEnv?: Record<string, string>; // for spawn descriptor env
  // MB-W1 · THE SOURCE SEAM · foreign-source installs. When either is set the
  // install materializes from a FOREIGN SCP source (a real, already-named SCP
  // package) instead of the bundled template — empty rename rules are used and
  // the -scp-suffix / concept-absent Concluders are relaxed (a real SCP is free
  // to carry its own name + concepts). `sourcePath` and `sourceUrl` are mutually
  // exclusive; if BOTH are supplied, sourceUrl WINS.
  sourcePath?: string; // absolute/relative path to a local SCP source directory
  sourceUrl?: string; // git URL (or file:// URL) cloned via performClone
}

export interface InstallScpResult {
  ok: boolean;
  reason?: string;
  designation?: string;
  conceptName?: string;
  installPath?: string;
  filesCopied?: number;
  dirsCreated?: number;
  generatedFilesWritten?: number;
  npmInstallRan?: boolean;
  npmInstallExitCode?: number | null;
  scpsJsonUpdated?: boolean;
  port?: number;
  descriptor?: SerializableSpawnDescriptor;
  // RM-Asp-1: staging metadata (populated on staging-related operations)
  stagingPath?: string; // path used as staging dir during install
  stagingPreserved?: boolean; // true when staging dir kept for inspection (on failure)
  stagingValidationFailures?: string[]; // concrete failure reasons when validation fails
}

// ============================================
// Diamond γ Item 4a · Bundled Template Path Resolution
// ============================================

/**
 * Resolves the bundled SCP template path from the SCS-Bridge installation.
 *
 * Resolution strategy (in priority order):
 *   1. SCS_TEMPLATE_PATH env var (test/dev override)
 *   2. {pkgRoot}/Cascades/scps/template/SCP from __dirname walk
 *   3. Fallback: process.cwd()/Cascades/scps/template/SCP (user project)
 *
 * The bundled template ships with the npm package via package.json `files`
 * array. When `scs scp install` runs in the user's project, the template
 * source files come from the SCS-Bridge installation · NOT the user's project.
 *
 * Template Citizenship (BO-2-C · Edit 3.2): step 0 checks the SCPs.json registry
 * for a 'template' entry. When the template is a standard citizen, its path is the
 * authoritative source. Falls through to bundled/cwd for npm-global contexts
 * without a seeded registry.
 */
export function resolveBundledTemplatePath(projectRoot?: string): string {
  // 0. Registry lookup (Template Citizenship) — authoritative when citizen is seeded
  const root = projectRoot ?? process.cwd();
  try {
    const registry = readScpRegistry(root);
    const templateEntry = registry.scps.find((s) => s.name === 'template');
    if (templateEntry?.path) {
      const registryPath = path.resolve(root, templateEntry.path);
      if (existsSync(registryPath)) {
        return registryPath;
      }
    }
  } catch {
    // fall through
  }
  // 1. Env var override (tests + dev)
  const envOverride = process.env.SCS_TEMPLATE_PATH;
  if (envOverride && existsSync(envOverride)) {
    return envOverride;
  }
  // 2. Bundled template at {pkgRoot}/Cascades/scps/template/SCP
  //    __dirname when running from dist/cli.cjs: {pkgRoot}/dist
  //    so package root is path.resolve(__dirname, '..')
  try {
    const pkgRoot = path.resolve(__dirname, '..');
    const bundledPath = path.join(pkgRoot, 'Cascades', 'scps', 'template', 'SCP');
    if (existsSync(bundledPath)) {
      return bundledPath;
    }
  } catch {
    // __dirname unavailable in some bundler contexts · fall through
  }
  // 3. Fallback: user project's local template (dev repo with template in cwd)
  return path.join(process.cwd(), 'Cascades', 'scps', 'template', 'SCP');
}

// ============================================
// RM-Asp-1 · Temp-Folder Staging + Validation Concluders
// ============================================

/**
 * Generates a staging directory path under Cascades/scps/.staging/.
 * Repo-local (not os.tmpdir) so failed installs can be inspected adjacent to
 * the project. Format: .staging/{Designation}-{timestamp}/SCP/
 */
export function buildStagingPath(projectRoot: string, designation: string): string {
  const stamp = Date.now().toString(36);
  return path.join(projectRoot, 'Cascades', 'scps', '.staging', `${designation}-${stamp}`, 'SCP');
}

export interface StagingValidationResult {
  valid: boolean;
  failures: string[];
}

/**
 * Validates a staged install before commit-move. 4 Concluders:
 *   (a) package.json parses + name matches expected pattern
 *   (b) src/index.ts exists
 *   (c) Generated concept tree exists at expected path
 *   (d) src/main.ts exists (Vue client entry)
 *
 * Returns valid=false with reason list if any Concluder fails. Caller decides
 * whether to commit-move or leave staging dir for inspection.
 *
 * MB-W1 · FOREIGN SOURCE RULES · when `opts.foreignSource` is true (a real SCP
 * cloned from a PATH/URL rather than materialized from the bundled template),
 * Concluders (a) [-scp suffix] and (c) [concept-dir absent] are SKIPPED — a
 * foreign package is free to carry its own name and its own concepts. Concluders
 * (b) [src/index.ts] and (d) [src/main.ts] STILL run: the source must still BE an
 * SCP. Failure messages carry the foreign source so the reason names it.
 */
export function validateStagedInstall(
  stagingPath: string,
  conceptName: string,
  opts?: { foreignSource?: boolean; sourceLabel?: string },
): StagingValidationResult {
  const failures: string[] = [];
  const foreignSource = opts?.foreignSource === true;
  const sourceSuffix = foreignSource && opts?.sourceLabel ? ` (foreign source: ${opts.sourceLabel})` : '';
  // (a) package.json parse + name check — SKIP the -scp suffix check for a foreign source.
  const pkgPath = path.join(stagingPath, 'package.json');
  if (!existsSync(pkgPath)) {
    failures.push(`package.json missing${sourceSuffix}`);
  } else if (!foreignSource) {
    try {
      const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
      if (typeof pkg.name !== 'string' || !pkg.name.endsWith('-scp')) {
        failures.push(`package.json name "${pkg.name}" does not end in -scp`);
      }
    } catch (err) {
      failures.push(`package.json parse error: ${String(err)}`);
    }
  } else {
    // Foreign source: still assert package.json is PARSEABLE (it IS an SCP package),
    // just do not police the -scp suffix (a foreign name is free).
    try {
      JSON.parse(readFileSync(pkgPath, 'utf8'));
    } catch (err) {
      failures.push(`package.json parse error: ${String(err)}${sourceSuffix}`);
    }
  }
  // (b) src/index.ts exists — KEPT for both bundled + foreign (it must BE an SCP).
  if (!existsSync(path.join(stagingPath, 'src', 'index.ts'))) {
    failures.push(`src/index.ts missing${sourceSuffix}`);
  }
  // (c) TRIMMED (FT-009 · the Stage A/B split): the user concept tree is NO LONGER generated
  // at SCP install — Stage B (scs suite8:page) is the sole creator. The validator now asserts
  // the concept dir is ABSENT (a present dir = the old scaffold leaked back).
  // MB-W1 · SKIPPED for a foreign source — a real SCP may legitimately carry concepts.
  if (!foreignSource) {
    const conceptDir = path.join(stagingPath, 'src', 'concepts', conceptName);
    if (existsSync(conceptDir)) {
      failures.push(`Stage A/B violation: src/concepts/${conceptName} pre-exists at install`);
    }
  }
  // (d) src/main.ts exists (Vue client entry) — KEPT for both bundled + foreign.
  if (!existsSync(path.join(stagingPath, 'src', 'main.ts'))) {
    failures.push(`src/main.ts missing${sourceSuffix}`);
  }
  return { valid: failures.length === 0, failures };
}

/**
 * Cleanup helper: removes staging dir entirely. Used on commit-move (when
 * succession completes · staging parent left empty) and on validation failure
 * if caller opts to clean rather than inspect.
 */
export function cleanStagingPath(stagingPath: string): void {
  if (existsSync(stagingPath)) {
    rmSync(stagingPath, { recursive: true, force: true });
  }
  // Also clean parent dir if empty (.staging/{Designation}-{stamp}/ vs .staging/)
  const parent = path.dirname(stagingPath);
  try {
    if (existsSync(parent) && readdirSync(parent).length === 0) {
      rmSync(parent, { recursive: true, force: true });
    }
  } catch {
    // best-effort cleanup
  }
}

// ============================================
// Issue #643 Half A · Wave 2 · Shared Phase Helpers (sync + async parity)
// ============================================
//
// The sync `runInstallScpPipeline` and the new async `runInstallScpPipelineAsync`
// share IDENTICAL pre-npm and post-npm phases — ONLY the npm step differs
// (execSync vs spawn+await). These two helpers carry the shared phases so the
// only divergence between variants is the npm invocation. Smallest correct diff:
// no behavior change to the sync path beyond delegating its identical steps here.

interface PrepareResult {
  derivation: NameDerivation;
  installRelative: string;
  installPath: string;
  stagingPath: string;
  filesCopied: number;
  dirsCreated: number;
  // MB-W1 · a foreign sourceUrl clones into a temp dir under the staging parent
  // (`${stagingPath}.clone-src`). finalizeScpInstall removes it after the atomic
  // commit-move (mirrors cleanStagingPath). undefined for bundled/sourcePath installs.
  cloneSrcDir?: string;
}

// ============================================
// MB-W1 · THE SOURCE SEAM · foreign-source resolution
// ============================================
//
// Resolves the materialization source for an install: the bundled template
// (default), a local `sourcePath` directory, or a `sourceUrl` cloned via
// performClone. Returns the srcDir to clone-with-rename FROM, the rename rules
// (EMPTY for a foreign source — a real package is already named), and the
// foreign-source flag/label threaded into validateStagedInstall.
//
// `sourceUrl` WINS if both are set (mutual-exclusion resolution per the option
// contract). The sync resolver CANNOT clone a URL (performClone is async) — it
// returns an honest failure naming the URL and directing to the async pipeline.

interface ForeignSourceResolution {
  srcDir: string;
  rules: RenameRule[];
  foreignSource: boolean;
  sourceLabel?: string;
  cloneSrcDir?: string; // set only for a URL clone → finalize cleans it
}

/**
 * Guards a resolved foreign srcDir: it must EXIST and contain a package.json.
 * Returns a failure reason NAMING the foreign source, or null when the dir is a
 * plausible SCP source.
 */
function guardForeignSrcDir(srcDir: string, sourceLabel: string): string | null {
  if (!existsSync(srcDir)) {
    return `Foreign SCP source not found: ${sourceLabel}`;
  }
  if (!existsSync(path.join(srcDir, 'package.json'))) {
    return `Foreign SCP source has no package.json: ${sourceLabel}`;
  }
  return null;
}

// C839 · THE PACKAGE LOCATOR — a clone is a REPO ROOT; the SCP package may be a SUBDIR of
// its repo (IE: <repo>/SCP). The root WINS when scp.config.json sits there; else the
// SHALLOWEST scp.config.json within a bounded walk (depth ≤ 3 · BFS · node_modules/.git
// skipped — the C782 SCS-Signature-Discriminant precedent: scp.config.json IS the SCP
// package signature). No match anywhere → the root falls through so guardForeignSrcDir
// reports the honest package.json failure.
function locateScpPackageDir(cloneRoot: string): string {
  if (existsSync(path.join(cloneRoot, SCP_CONFIG_FILENAME))) return cloneRoot;
  let frontier: string[] = [cloneRoot];
  for (let depth = 0; depth < 3; depth += 1) {
    const next: string[] = [];
    for (const dir of frontier) {
      let entries: import('node:fs').Dirent[];
      try {
        entries = readdirSync(dir, { withFileTypes: true });
      } catch {
        continue;
      }
      for (const e of entries) {
        if (!e.isDirectory() || e.name === 'node_modules' || e.name === '.git') continue;
        const candidate = path.join(dir, e.name);
        if (existsSync(path.join(candidate, SCP_CONFIG_FILENAME))) return candidate;
        next.push(candidate);
      }
    }
    frontier = next;
  }
  return cloneRoot;
}

/**
 * SYNC foreign-source resolver. Handles the bundled-template default and a local
 * `sourcePath` directory. A `sourceUrl` (needing the async performClone) returns
 * an honest failure directing to the async pipeline.
 */
function resolveInstallSourceSync(
  opts: RunInstallScpPipelineOptions,
  derivation: NameDerivation,
): { ok: true; resolved: ForeignSourceResolution } | { ok: false; reason: string } {
  if (opts.sourceUrl) {
    return {
      ok: false,
      reason: `sourceUrl installs require the async pipeline (runInstallScpPipelineAsync); the sync pipeline cannot clone ${opts.sourceUrl}`,
    };
  }
  if (opts.sourcePath) {
    const srcDir = path.resolve(opts.sourcePath);
    const guard = guardForeignSrcDir(srcDir, srcDir);
    if (guard !== null) return { ok: false, reason: guard };
    return { ok: true, resolved: { srcDir, rules: [], foreignSource: true, sourceLabel: srcDir } };
  }
  // Bundled-template default — the original behavior.
  const templateRoot = opts.templateRoot ?? resolveBundledTemplatePath();
  if (!existsSync(templateRoot)) {
    return { ok: false, reason: `Template not found at ${templateRoot}` };
  }
  return { ok: true, resolved: { srcDir: templateRoot, rules: buildRenameRules(derivation), foreignSource: false } };
}

/**
 * ASYNC foreign-source resolver. Superset of the sync resolver: additionally
 * handles a `sourceUrl` by cloning (performClone) into a temp dir under the
 * staging parent (`${stagingPath}.clone-src`). `sourceUrl` WINS if both set.
 */
async function resolveInstallSourceAsync(
  opts: RunInstallScpPipelineOptions,
  derivation: NameDerivation,
  stagingPath: string,
): Promise<{ ok: true; resolved: ForeignSourceResolution } | { ok: false; reason: string }> {
  if (opts.sourceUrl) {
    // C840 · THE FILE:// ROOT NORMALIZATION (receiver-side resilience) — a stale anor
    // hand-written local origin may point INSIDE the repo (pre-C839 manifests carried the
    // package subdir · the field wound twice over). git clones ROOTS only: when the given
    // local path exists but carries no .git, walk UP (bounded ≤4) to the first dir with
    // .git and clone THAT — the C839 package locator then finds the package inside the
    // clone. A remote URL passes through untouched.
    let cloneUrl = opts.sourceUrl;
    if (cloneUrl.startsWith('file://')) {
      const localPath = cloneUrl.slice('file://'.length);
      if (existsSync(localPath) && !existsSync(path.join(localPath, '.git'))) {
        let walk = localPath;
        for (let i = 0; i < 4; i += 1) {
          const parent = path.dirname(walk);
          if (parent === walk) break;
          walk = parent;
          if (existsSync(path.join(walk, '.git'))) {
            cloneUrl = `file://${walk}`;
            break;
          }
        }
      }
    }
    const cloneSrcDir = `${stagingPath}.clone-src`;
    if (existsSync(cloneSrcDir)) {
      rmSync(cloneSrcDir, { recursive: true, force: true });
    }
    try {
      if (opts.anchorCommit) {
        await performCloneAtCommit(cloneUrl, cloneSrcDir, opts.anchorCommit);
      } else {
        await performClone(cloneUrl, cloneSrcDir);
      }
    } catch (err) {
      // Clean any partial clone before returning the honest failure.
      try {
        if (existsSync(cloneSrcDir)) rmSync(cloneSrcDir, { recursive: true, force: true });
      } catch {
        /* best-effort */
      }
      return { ok: false, reason: `Foreign SCP clone failed for ${opts.sourceUrl}: ${String(err)}` };
    }
    // C839 · locate the SCP package WITHIN the clone (the repo root anor its SCP subdir).
    const packageDir = locateScpPackageDir(cloneSrcDir);
    const guard = guardForeignSrcDir(packageDir, opts.sourceUrl);
    if (guard !== null) {
      try {
        if (existsSync(cloneSrcDir)) rmSync(cloneSrcDir, { recursive: true, force: true });
      } catch {
        /* best-effort */
      }
      return { ok: false, reason: guard };
    }
    return {
      ok: true,
      resolved: { srcDir: packageDir, rules: [], foreignSource: true, sourceLabel: opts.sourceUrl, cloneSrcDir },
    };
  }
  if (opts.sourcePath) {
    const srcDir = path.resolve(opts.sourcePath);
    const guard = guardForeignSrcDir(srcDir, srcDir);
    if (guard !== null) return { ok: false, reason: guard };
    return { ok: true, resolved: { srcDir, rules: [], foreignSource: true, sourceLabel: srcDir } };
  }
  const templateRoot = opts.templateRoot ?? resolveBundledTemplatePath();
  if (!existsSync(templateRoot)) {
    return { ok: false, reason: `Template not found at ${templateRoot}` };
  }
  return { ok: true, resolved: { srcDir: templateRoot, rules: buildRenameRules(derivation), foreignSource: false } };
}

/**
 * Issue #643 Refinement · install-pipeline phase boundaries.
 * Emitted by `runInstallScpPipelineAsync` via its `onPhase` callback so the TUI
 * can range the step-aware asymptotic progress bar: `staging` (template clone),
 * `npm` (the long `npm install`), `finalize` (validate + commit-move + sentinel).
 */
export type ScpInstallPhase = 'staging' | 'npm' | 'finalize';

/**
 * Pre-npm phase: validate designation, resolve paths, guard existing install,
 * materialize the template tree into staging, pre-grant Bash approval patterns.
 * Returns either the prepared context OR a terminal InstallScpResult (the early
 * validation / existing-path failures that both variants surface identically).
 */
function prepareScpInstallStaging(
  opts: RunInstallScpPipelineOptions,
): { ok: true; prepared: PrepareResult } | { ok: false; result: InstallScpResult } {
  // Step 1: Validate designation
  const validation = validateAndDerive(opts.designation);
  if (!validation.ok) {
    return { ok: false, result: { ok: false, reason: validation.reason } };
  }
  const derivation = validation.derivation;

  // Resolve paths
  // Diamond γ Item 4a: templateRoot resolves from the SCS-Bridge installation
  // path (bundled template at {pkgRoot}/Cascades/scps/template/SCP/).
  // MB-W1: resolveInstallSourceSync selects bundled template anor a local sourcePath
  // (a sourceUrl returns a terminal failure directing to the async pipeline).
  const installRelative = path.join('Cascades', 'scps', derivation.designation, 'SCP');
  const installPath = path.join(opts.projectRoot, installRelative);

  const source = resolveInstallSourceSync(opts, derivation);
  if (!source.ok) {
    return { ok: false, result: { ok: false, reason: source.reason } };
  }
  const { srcDir, rules } = source.resolved;

  if (existsSync(installPath)) {
    return {
      ok: false,
      result: { ok: false, reason: `Install path already exists: ${installPath}` },
    };
  }

  // RM-Asp-1: Stage to .staging/ first · validate · then atomic commit-move
  const stagingPath = buildStagingPath(opts.projectRoot, derivation.designation);

  // Step 2 TRIMMED (FT-009 · the Stage A/B split): Stage A = the SCP install ONLY.

  // Step 3: Materialize source tree INTO STAGING (not final path). Foreign source
  // → EMPTY rules (a real package is already named); bundled → template rename rules.
  const cloneResult = cloneWithRename(srcDir, stagingPath, rules);

  // Step 3b: REF-D1 ISAPSP · Pre-grant Bash approval patterns before npm install.
  writeApprovalSettings(opts.projectRoot);

  return {
    ok: true,
    prepared: {
      derivation,
      installRelative,
      installPath,
      stagingPath,
      filesCopied: cloneResult.filesCopied,
      dirsCreated: cloneResult.dirsCreated,
    },
  };
}

/**
 * Issue #643 Refinement · NON-BLOCKING staging prep (async clone variant).
 *
 * Byte-equivalent to `prepareScpInstallStaging` EXCEPT the heavy template
 * materialization uses `cloneWithRenameAsync` (event-loop yielding) instead of
 * the sync `cloneWithRename`. This is what keeps the TUI render loop painting
 * during the `staging` phase on the async install path. Same early-return /
 * PrepareResult contract — only the FS strategy differs. The sync variant is
 * preserved untouched for the sync callers.
 */
async function prepareScpInstallStagingAsync(
  opts: RunInstallScpPipelineOptions,
): Promise<{ ok: true; prepared: PrepareResult } | { ok: false; result: InstallScpResult }> {
  // Step 1: Validate designation
  const validation = validateAndDerive(opts.designation);
  if (!validation.ok) {
    return { ok: false, result: { ok: false, reason: validation.reason } };
  }
  const derivation = validation.derivation;

  // Resolve paths (identical to the sync variant).
  const installRelative = path.join('Cascades', 'scps', derivation.designation, 'SCP');
  const installPath = path.join(opts.projectRoot, installRelative);

  // Guard the existing install path BEFORE the (potentially expensive URL) clone.
  if (existsSync(installPath)) {
    return {
      ok: false,
      result: { ok: false, reason: `Install path already exists: ${installPath}` },
    };
  }

  const stagingPath = buildStagingPath(opts.projectRoot, derivation.designation);

  // MB-W1: resolveInstallSourceAsync selects bundled template, a local sourcePath, anor
  // a sourceUrl cloned via performClone into `${stagingPath}.clone-src`. sourceUrl WINS.
  const source = await resolveInstallSourceAsync(opts, derivation, stagingPath);
  if (!source.ok) {
    return { ok: false, result: { ok: false, reason: source.reason } };
  }
  const { srcDir, rules, cloneSrcDir } = source.resolved;

  // Step 3: Materialize source tree INTO STAGING — ASYNC (event-loop free). Foreign
  // source → EMPTY rules; bundled → template rename rules.
  const cloneResult = await cloneWithRenameAsync(srcDir, stagingPath, rules);

  // Step 3b: REF-D1 ISAPSP · Pre-grant Bash approval patterns before npm install.
  writeApprovalSettings(opts.projectRoot);

  return {
    ok: true,
    prepared: {
      derivation,
      installRelative,
      installPath,
      stagingPath,
      filesCopied: cloneResult.filesCopied,
      dirsCreated: cloneResult.dirsCreated,
      cloneSrcDir,
    },
  };
}

/**
 * Post-npm phase: validate staged install, atomic commit-move staging → final,
 * git-init the project root, update SCPs.json, write the PIRP sentinel, build the
 * spawn descriptor. Identical for sync + async variants — npm has already run by
 * the time this is called. `npmInstallExitCode`/`runNpm` are threaded through to
 * the result. Returns the terminal InstallScpResult.
 */
function finalizeScpInstall(
  opts: RunInstallScpPipelineOptions,
  prepared: PrepareResult,
  runNpm: boolean,
  npmInstallExitCode: number | null,
): InstallScpResult {
  const { derivation, installRelative, installPath, stagingPath, cloneSrcDir } = prepared;

  // MB-W1 · a foreign source (sourcePath anor sourceUrl set) relaxes the -scp-suffix
  // + concept-absent Concluders in validateStagedInstall. Derived from opts (the same
  // signal that drove resolveInstallSource*). cleanCloneSrc removes the URL clone-src
  // temp dir; called after the commit-move (and on the validation-failure branch).
  const foreignSource = Boolean(opts.sourcePath) || Boolean(opts.sourceUrl);
  const sourceLabel = opts.sourceUrl ?? opts.sourcePath;
  const cleanCloneSrc = (): void => {
    if (cloneSrcDir && existsSync(cloneSrcDir)) {
      try {
        rmSync(cloneSrcDir, { recursive: true, force: true });
      } catch {
        /* best-effort · a leftover clone-src temp dir is inspectable, not fatal */
      }
    }
  };

  // RM-Asp-1: Step 5 NEW · Validate staged install via 4 Concluders
  const stagingValidation = validateStagedInstall(stagingPath, derivation.conceptName, {
    foreignSource,
    sourceLabel,
  });
  if (!stagingValidation.valid) {
    cleanCloneSrc();
    return {
      ok: false,
      reason: `Staged install validation failed: ${stagingValidation.failures.join(' · ')}. Inspect: ${stagingPath}`,
      designation: derivation.designation,
      conceptName: derivation.conceptName,
      installPath,
      filesCopied: prepared.filesCopied,
      dirsCreated: prepared.dirsCreated,
      generatedFilesWritten: 0, // Stage A/B split: Stage A generates NO user concept
      npmInstallRan: runNpm,
      npmInstallExitCode,
      stagingPath,
      stagingPreserved: true,
      stagingValidationFailures: stagingValidation.failures,
    };
  }

  // RM-Asp-1: Step 6 · Atomic commit-move staging → final
  const finalParent = path.dirname(installPath);
  if (!existsSync(finalParent)) {
    mkdirSync(finalParent, { recursive: true });
  }
  try {
    renameSync(stagingPath, installPath);
  } catch (err) {
    cleanCloneSrc();
    return {
      ok: false,
      reason: `Commit-move failed (${String(err)}). Staged: ${stagingPath}`,
      designation: derivation.designation,
      conceptName: derivation.conceptName,
      installPath,
      stagingPath,
      stagingPreserved: true,
    };
  }
  cleanStagingPath(stagingPath); // cleans .staging/{name}-{stamp}/
  cleanCloneSrc(); // MB-W1 · remove the URL clone-src temp dir after the commit-move

  // Step 6a-bis · PER-SCP IDENTITY STAMP (Per-SCP-Identity-Config · FKIS Origin).
  // "Rename the property": the cloned tree carries the template's scp.config.json
  // ({ "scpName": "template" }); overwrite it with THIS install's designation so the
  // freshly-installed SCP declares its OWN identity in data. The SCP server serves it
  // at GET /scp-config; the controller reads it and carries originScpName on every UI
  // send — closing the installed-SCP 'no-origin' bail (the workspace bridge muxium has
  // no per-SCP env to read). Higher-Order: the SCP is a Base Concept declaring its name;
  // the bridge composes it, it does not own it. Non-fatal (best-effort · the env-first
  // resolution in the guard remains for env-carrying spawn routes).
  try {
    const scpConfigPath = path.join(installPath, SCP_CONFIG_FILENAME);
    writeFileSync(
      scpConfigPath,
      JSON.stringify({ scpName: derivation.designation }, null, 2) + '\n',
      'utf8',
    );
  } catch {
    /* non-fatal · the SCP falls back to env-first origin resolution if the stamp is absent */
  }

  // Step 6a-ter · SEED .bridge-restart.json (BRTF NODEMON-WATCH FIX · r7 diagnosis).
  // .bridge-restart.json is in CLONE_SKIP_FILES (:343) — INTENTIONALLY not copied (stale-timestamp
  // avoidance). BUT nodemon parses its watch config at STARTUP: if the watched file does not EXIST,
  // tryBaseDir (nodemon match.js) ENOENTs → config.dirs falls back to the SCP root → because that
  // path has no dot-component, nodemon adds ALL dotfiles to chokidar's ignore list → the turn-over's
  // .bridge-restart.json write is then IGNORED → NO RESTART. dev:self works ONLY because the template's
  // .bridge-restart.json is COMMITTED (exists at startup → nodemon watches the SPECIFIC file, not the
  // dir → dotfiles not ignored). Seed a FRESH marker here so the installed SCP's nodemon watches the
  // FILE. No hardTurnOver flag → the startup reset is a no-op; the first real turn-over restarts. Non-fatal.
  try {
    const restartSeedPath = path.join(installPath, '.bridge-restart.json');
    if (!existsSync(restartSeedPath)) {
      writeFileSync(
        restartSeedPath,
        JSON.stringify({ restartedAt: new Date().toISOString(), source: 'scs-install-seed' }, null, 2) + '\n',
        'utf8',
      );
    }
  } catch {
    /* non-fatal · without the seed the BRTF restart stays inert until a marker first exists */
  }

  // Step 6b · GIT INIT THE PROJECT ROOT (user · the GitM/A↔B precondition).
  // Idempotent (rev-parse guard) · non-fatal.
  // C846 · THE PRIVACY-PARTITION MEND — the installed SCP's .gitignore MUST carry the
  // private-substrate ignores (Extended · Working · Bridge · Cascade.json) BEFORE any
  // git add fires. Fresh template installs carry them from birth (the template .gitignore);
  // this mend covers ADOPTED SCPs — a cloned foreign source whose sharer predates the
  // partition. Append-missing-only (a user's own ignores are never disturbed); best-effort
  // (a mend failure never fails the install).
  try {
    const scpDirAbs = path.resolve(opts.projectRoot, installRelative);
    const giPath = path.join(scpDirAbs, '.gitignore');
    const PRIVACY_LINES = ['Cascades/Bridge/', 'Cascades/Extended/', 'Cascades/Working/', 'Cascades/Cascade.json'];
    const current = existsSync(giPath) ? readFileSync(giPath, 'utf-8') : '';
    const have = new Set(current.split('\n').map((l) => l.trim()));
    const missing = PRIVACY_LINES.filter((l) => !have.has(l));
    if (missing.length > 0) {
      const appended = `${current.endsWith('\n') || current === '' ? current : current + '\n'}# C846 · the Privacy Partition (appended by the install mend)\n${missing.join('\n')}\n`;
      writeFileSync(giPath, appended, 'utf-8');
    }
  } catch {
    /* best-effort — the partition mend never fails the install */
  }

  // ONE install stamp (ISO date+time) for both initial commits — the user asked the install
  // git-init to carry an Initial Message with Time and Date. Bridge install runtime (NOT a
  // workflow script), so new Date() is allowed here.
  const installStamp = new Date().toISOString();
  try {
    const isRepo = (() => {
      try {
        execSync('git rev-parse --is-inside-work-tree', {
          cwd: opts.projectRoot,
          stdio: 'pipe',
        });
        return true;
      } catch {
        return false;
      }
    })();
    if (!isRepo) {
      execSync('git init', { cwd: opts.projectRoot, stdio: 'pipe' });
      execSync('git add -A', { cwd: opts.projectRoot, stdio: 'pipe' });
      execSync(
        `git -c user.name=SCS -c user.email=scs@local commit -m "SCS: initialize ${derivation.designation} — ${installStamp}"`,
        { cwd: opts.projectRoot, stdio: 'pipe' },
      );
    }
  } catch {
    /* non-fatal · the GitM page will read isRepo:false until the user inits manually */
  }

  // Step 6c · GITM 3LOC nested-git maintain (idempotent · FRESH-INSTALL-ONLY · Decision A).
  // After the Base git-init (6b) + the commit-move, ensure the nested structure so the
  // freshly-installed SCP gets its own RED repo (Cascades/scps/<name>/.git) + the two
  // gitignore boundaries. A Base-tracked Cascades/ (dev repo) returns skipped (never
  // `git rm --cached`). Non-fatal — the GitM badge falls back to the Yellow baseline.
  try {
    ensureNestedGitStructure(opts.projectRoot, {
      scpName: derivation.designation,
      stamp: installStamp,
    });
  } catch {
    /* non-fatal · the nested structure will be re-attempted on bridge boot */
  }

  // Step 7: Update Cascades/SCPs.json (post-commit-move)
  const registry = readScpRegistry(opts.projectRoot);
  const entry = buildScpRegistryEntry({
    anchoredAt: opts.anchorCommit,
    name: derivation.designation,
    conceptName: derivation.conceptName,
    installPath: installRelative,
    templateVersion: opts.templateVersion ?? '0.1.0',
    status: 'installed',
  });
  const port = pickPortFromRegistry(registry);
  entry.boundBridgePort = port;
  const updatedRegistry = appendScpEntry(registry, entry);
  writeScpRegistry(updatedRegistry, opts.projectRoot);

  // Stage I8 · PIRP Sentinel Write (REF-D3 · CRBSP fix)
  {
    const sentinelPath = path.join(installPath, '.bridge-detect.sentinel');
    try {
      writeFileSync(
        sentinelPath,
        JSON.stringify({
          scpName: derivation.designation,
          conceptName: derivation.conceptName,
          installedAt: Date.now(),
          version: '1.0',
        }),
        'utf8',
      );
      console.log(`[install] stage I8 PIRP · sentinel written to ${sentinelPath}`);
    } catch (err) {
      console.warn(`[install] stage I8 PIRP · sentinel write failed (non-fatal): ${String(err)}`);
    }
  }

  // Step 8: Build spawn descriptor (optional · default true)
  let descriptor: SerializableSpawnDescriptor | undefined;
  if (opts.buildDescriptor !== false) {
    descriptor = buildSpawnDescriptor({
      installPath,
      derivation,
      port,
      parentEnv: opts.parentEnv,
    });
  }

  return {
    ok: true,
    designation: derivation.designation,
    conceptName: derivation.conceptName,
    installPath,
    filesCopied: prepared.filesCopied,
    dirsCreated: prepared.dirsCreated,
    generatedFilesWritten: 0, // Stage A/B split: Stage A generates NO user concept
    npmInstallRan: runNpm,
    npmInstallExitCode,
    scpsJsonUpdated: true,
    port,
    descriptor,
  };
}

/**
 * Build the npm-failure InstallScpResult (staging PRESERVED for inspection).
 * Shared by sync + async variants so the failure shape is identical.
 */
function buildNpmFailureResult(
  prepared: PrepareResult,
  npmInstallExitCode: number,
): InstallScpResult {
  return {
    ok: false,
    reason: `npm install failed in staging (exit ${npmInstallExitCode}). Inspect: ${prepared.stagingPath}`,
    designation: prepared.derivation.designation,
    conceptName: prepared.derivation.conceptName,
    installPath: prepared.installPath,
    filesCopied: prepared.filesCopied,
    dirsCreated: prepared.dirsCreated,
    generatedFilesWritten: 0, // Stage A/B split: Stage A generates NO user concept
    npmInstallRan: true,
    npmInstallExitCode,
    stagingPath: prepared.stagingPath,
    stagingPreserved: true,
  };
}

/**
 * Top-level 7-step pipeline (now with RM-Asp-1 temp-folder staging).
 *
 * Refactored sequence:
 *   1. Validate designation (RM-D1 validateAndDerive)
 *   2. Generate bare-minimum concept bundle (in-memory · pure)
 *   3. Materialize template tree TO STAGING (not final path)
 *   4. Run npm install IN STAGING
 *   5. Validate staged install via 4 Concluders
 *   6. Commit-move staging → final via atomic renameSync
 *   7. Update SCPs.json
 *   8. Build spawn descriptor
 *
 * On validation/npm failure: staging dir preserved for inspection (path in
 * result.stagingPath) · final path never touched.
 *
 * SYNCHRONOUS variant — execSync('npm install') BLOCKS the event loop 30-120s.
 * Retained for non-TUI callers/tests. TUI install paths now prefer the async
 * variant below (Issue #643 Half A · Wave 2) so the render loop never freezes.
 */
export function runInstallScpPipeline(opts: RunInstallScpPipelineOptions): InstallScpResult {
  const prep = prepareScpInstallStaging(opts);
  if (!prep.ok) return prep.result;
  const prepared = prep.prepared;

  // Step 4: Run npm install IN STAGING (optional · default true) · SYNCHRONOUS
  const runNpm = opts.runNpmInstall !== false;
  let npmInstallExitCode: number | null = null;
  if (runNpm) {
    try {
      execSync('npm install', { cwd: prepared.stagingPath, stdio: 'pipe' });
      npmInstallExitCode = 0;
    } catch (err) {
      const e = err as { status?: number };
      npmInstallExitCode = e.status ?? 1;
      return buildNpmFailureResult(prepared, npmInstallExitCode);
    }
  }

  return finalizeScpInstall(opts, prepared, runNpm, npmInstallExitCode);
}

/**
 * Issue #643 Half A · Wave 2 · ASYNCHRONOUS install pipeline.
 *
 * Mirror of runInstallScpPipeline with ONE difference: the npm install step
 * spawns via `child_process.spawn('npm', ['install'], { cwd: stagingPath })`
 * and AWAITS its `close` event rather than blocking the event loop with
 * execSync. Pre-npm (scaffold/clone/approval) and post-npm (validate, move,
 * git-init, SCPs.json, sentinel, descriptor) phases are byte-identical to the
 * sync version via the shared phase helpers.
 *
 * The non-freezing async path is what lets the TUI render loop keep ticking
 * (and the pseudo-progress bar animate) during the 30-120s npm install.
 *
 * On npm non-zero exit: resolves `{ ok: false, reason }` with staging PRESERVED
 * (identical shape to the sync npm-failure branch). spawn-launch failure (e.g.
 * npm not on PATH) rejects via the 'error' event → resolves a failure result.
 *
 * Issue #643 Refinement · `onPhase` reports the three install-phase boundaries
 * (`staging` → `npm` → `finalize`) so the TUI can range its step-aware
 * asymptotic progress bar. Staging now uses the NON-BLOCKING async prep
 * (`prepareScpInstallStagingAsync`) so the render loop paints throughout.
 */
export function runInstallScpPipelineAsync(
  opts: RunInstallScpPipelineOptions,
  onPhase?: (phase: ScpInstallPhase) => void,
): Promise<InstallScpResult> {
  return new Promise<InstallScpResult>((resolve) => {
    let settled = false;
    const settle = (result: InstallScpResult): void => {
      if (settled) return;
      settled = true;
      resolve(result);
    };

    // Phase 1 · STAGING — async (event-loop yielding) template materialization.
    onPhase?.('staging');
    void prepareScpInstallStagingAsync(opts)
      .then((prep) => {
        if (!prep.ok) {
          settle(prep.result);
          return;
        }
        const prepared = prep.prepared;

        const runNpm = opts.runNpmInstall !== false;
        if (!runNpm) {
          // No npm step → straight to finalize.
          onPhase?.('finalize');
          settle(finalizeScpInstall(opts, prepared, false, null));
          return;
        }

        // Phase 2 · NPM — spawn + await close (event loop free).
        // Redirect npm's stdout+stderr to a log file in the staging dir so the
        // OS drains the child's verbose output to disk. A piped-but-undrained
        // child deadlocks once npm fills the ~64KB OS pipe buffer (npm blocks on
        // write → install hangs → asymptotic bar crawls forever). Draining to a
        // file frees the Electron main loop (render setInterval resumes) AND
        // leaves npm-install.log next to the preserved staging dir for the
        // failure path ("Inspect: {stagingPath}"). Resolve npm directly (no
        // shell:true) — shell compounds the pipe-hang and is unneeded once the
        // exe is named per-platform.
        onPhase?.('npm');
        const npmLogPath = path.join(prepared.stagingPath, 'npm-install.log');
        const npmLogFd = openSync(npmLogPath, 'a');
        let npmLogClosed = false;
        const closeNpmLog = (): void => {
          if (npmLogClosed) return;
          npmLogClosed = true;
          try {
            closeSync(npmLogFd);
          } catch {
            // fd already closed / never opened cleanly — nothing to recover.
          }
        };
        const child = spawn(
          process.platform === 'win32' ? 'npm.cmd' : 'npm',
          ['install'],
          {
            cwd: prepared.stagingPath,
            stdio: ['ignore', npmLogFd, npmLogFd],
          },
        );

        child.on('error', (err) => {
          // spawn-launch failure (e.g. npm not found) — treat as npm failure
          // exit 1, staging preserved. Surface the message in the reason.
          // Phase 3 · FINALIZE boundary (failure branch still finalizes the
          // result shape) so the bar checkpoints before the error pane.
          closeNpmLog();
          onPhase?.('finalize');
          const failure = buildNpmFailureResult(prepared, 1);
          failure.reason = `npm install spawn failed in staging (${String(err)}). Inspect: ${prepared.stagingPath}`;
          settle(failure);
        });

        child.on('close', (code) => {
          closeNpmLog();
          // Phase 3 · FINALIZE — validate, commit-move, sentinel, descriptor.
          onPhase?.('finalize');
          const exitCode = code ?? 1;
          if (exitCode !== 0) {
            settle(buildNpmFailureResult(prepared, exitCode));
            return;
          }
          // npm succeeded — run the identical post-npm phase (sync FS work).
          try {
            settle(finalizeScpInstall(opts, prepared, true, 0));
          } catch (err) {
            settle({
              ok: false,
              reason: `post-npm finalize failed (${String(err)}). Staged: ${prepared.stagingPath}`,
              designation: prepared.derivation.designation,
              conceptName: prepared.derivation.conceptName,
              installPath: prepared.installPath,
              stagingPath: prepared.stagingPath,
              stagingPreserved: true,
            });
          }
        });
      })
      .catch((err) => {
        // Defensive: async staging prep threw (FS error mid-clone). Surface as
        // a generic failure result — no prepared context to preserve staging.
        settle({
          ok: false,
          reason: `async staging prep failed (${String(err)})`,
        });
      });
  });
}
