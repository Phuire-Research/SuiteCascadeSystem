/**
 * suite8PageCreate.ts tests — Streamline Macro Diamond MD-1 (W3).
 *
 * Exercises the SVLF model against a synthetic tmp SCP fixture using a stubbed
 * `execRunner` (no real tsc / build:client) so the unit suite stays fast — the
 * W4 G5 LIVE Concluder runs the real subprocesses against the real template.
 *
 * Groups:
 *   1 — Tokenizer reuse (validateAndDerive wired)
 *   2 — No-SCP fail-loud (requires-existing-SCP)
 *   3 — LFRCL gate order + zero-grep over the GLOB-walked fixture
 *   4 — AIME idempotence (double-invoke = single insert · S8ERI)
 *   5 — SAMLS targets ONLY the HomeNavigation block (the named hazard · NON-OPTIONAL)
 *   6 — A1 Context-B skip-to-Phase-2 branch
 */
import { mkdtempSync, rmSync, mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { execSync } from 'node:child_process';
import * as os from 'node:os';
import * as path from 'node:path';
import { runSuite8PageCreate, ExecRunner } from './suite8PageCreate';

// A grep-backed exec stub: the model's tsc/build:client calls are stubbed to
// succeed (empty stdout); grep -ric / grep -ril run for REAL against the fixture
// so the zero-grep gate exercises the actual GLOB walk + find-replace.
const grepStub: ExecRunner = (command, cwd) => {
  if (command.startsWith('npx tsc') || command.startsWith('npm run build:client')) {
    return '';
  }
  // grep -ric / grep -ril → run for real (the fixture has no node_modules dep).
  return execSync(command, { cwd, stdio: 'pipe' }).toString();
};

/**
 * Builds a minimal but structurally-faithful tmp SCP. The suite8 concept carries
 * the load-bearing token surfaces: the type.ts constants, the muxonomy with TWO
 * NavigationConfig blocks (suite8Navigation + suite8HomeNavigation), a vue/
 * subdir with the HomeLanding + a vue/components/ subdir (the S3-discovery
 * deep-nesting case), the double-token quality basename, and a model/ subdir.
 * The 2 foreign AIME targets are seeded with the exact live anchors.
 */
function buildFixture(): string {
  const tmp = mkdtempSync(path.join(os.tmpdir(), 'md1-svlf-'));
  const scpRoot = path.join(tmp, 'Cascades', 'scps', 'Scratch', 'SCP');
  const concepts = path.join(scpRoot, 'src', 'concepts');
  const suite8 = path.join(concepts, 'suite8');
  mkdirSync(path.join(suite8, 'vue', 'components'), { recursive: true });
  mkdirSync(path.join(suite8, 'model'), { recursive: true });
  mkdirSync(path.join(suite8, 'qualities'), { recursive: true });
  mkdirSync(path.join(concepts, 'vue'), { recursive: true });
  mkdirSync(path.join(concepts, 'huirth'), { recursive: true });
  // FT-008 AIME-3 + Phase-2 home ops: the THIRD foreign surface (vue.principle.ts) +
  // the cadmium muxonomy (the incumbent flip target).
  mkdirSync(path.join(concepts, 'cadmium'), { recursive: true });

  // SCPs.json registry (debug OFF → template holdback applies; this is a real entry).
  writeFileSync(
    path.join(tmp, 'Cascades', 'SCPs.json'),
    JSON.stringify({ scps: [{ name: 'Scratch', path: 'Cascades/scps/Scratch/SCP' }] }, null, 2),
  );

  // suite8.type.ts — the 2 constant sites.
  writeFileSync(
    path.join(suite8, 'suite8.type.ts'),
    [
      // bare-SUITE8 citation comment (no trailing underscore) — the G5-discovered
      // residual form the zero-grep gate counts case-insensitively.
      `// Citation: MASTER-DIAMOND-SUITE8-CONCEPT-ASPIRANT.md §1`,
      `export const SUITE8_CONCEPT_NAME = 'suite8';`,
      `export const suite8Name = SUITE8_CONCEPT_NAME;`,
      `export const SUITE8_FLAG = true;`,
      `export const DEFAULT_SUITE8_DESIGNATION_NAME = 'Template Suite 8';`,
      ``,
    ].join('\n'),
  );

  // suite8.muxonomy.ts — TWO NavigationConfig blocks (the SAMLS hazard).
  writeFileSync(
    path.join(suite8, 'suite8.muxonomy.ts'),
    [
      `import { NavigationConfig } from '../muxonomy/muxonomy.model';`,
      ``,
      `export const suite8Navigation: NavigationConfig = {`,
      `  isMainLanding: false,`,
      `  label: 'Suite 8',`,
      `  order: 3,`,
      `  componentPath: 'suite8/vue/Suite8Landing',`,
      `};`,
      ``,
      `export const suite8HomeNavigation: NavigationConfig = {`,
      `  isMainLanding: false,`,
      `  label: 'Domain Home',`,
      `  order: 2,`,
      `  componentPath: 'suite8/vue/Suite8HomeLanding',`,
      `};`,
      ``,
      // Multi-line muxonomic struct (faithful to the real shape) so the navigation-swap
      // block boundary ('\n};') lands on the struct terminus, not file-end.
      `export const suite8Muxonomic: MuxonomicConfig<'suite8'> = {`,
      `  conceptName: 'suite8',`,
      `  navigation: suite8Navigation,`,
      `};`,
      ``,
    ].join('\n'),
  );

  // Concept entrypoints in the manifest.
  writeFileSync(
    path.join(suite8, 'suite8.concept.huirth.ts'),
    `export const createSuite8HuirthConcept = () => ({ name: 'suite8' });\n`,
  );
  writeFileSync(
    path.join(suite8, 'suite8.concept.client.ts'),
    `import { SUITE8_CONCEPT_NAME } from './suite8.type';\nexport const suite8ClientConcept = SUITE8_CONCEPT_NAME;\n`,
  );

  // The double-token quality basename (suite8RegisterSuite8).
  writeFileSync(
    path.join(suite8, 'qualities', 'suite8RegisterSuite8.quality.client.ts'),
    `import { SUITE8_CONCEPT_NAME } from '../suite8.type';\nexport const suite8RegisterSuite8 = SUITE8_CONCEPT_NAME;\n`,
  );

  // model/ subdir file.
  writeFileSync(
    path.join(suite8, 'model', 'suite8Registration.model.ts'),
    `export const suite8RegistrationModel = 'suite8';\n`,
  );

  // vue/ HomeLanding (manifest) + a deep vue/components/ token .vue (S3-discovery).
  writeFileSync(
    path.join(suite8, 'vue', 'Suite8HomeLanding.vue'),
    `<template><div>Suite8 Home</div></template>\n<script>import { suite8Name } from '../suite8.type';</script>\n`,
  );
  writeFileSync(
    path.join(suite8, 'vue', 'components', 'Suite8SessionList.vue'),
    `<template><div :data-name="suite8Name">Suite8</div></template>\n`,
  );

  // Foreign AIME targets — byte-exact live anchors.
  writeFileSync(
    path.join(concepts, 'vue', 'IslandWrapper.vue'),
    [
      `const islandRegistry = {`,
      `  default: () => import('../vue/vue/DefaultLanding.vue'),`,
      `  suite8: () => import('../suite8/vue/Suite8Landing.vue'),`,
      `  suite8Home: () => import('../suite8/vue/Suite8HomeLanding.vue'),`,
      `  cadmium: () => import('../cadmium/vue/CadmiumLanding.vue'),`,
      `};`,
      ``,
    ].join('\n'),
  );
  writeFileSync(
    path.join(concepts, 'huirth', 'huirth.concept.ts'),
    [
      `import { createSuite8HuirthConcept } from '../suite8/suite8.concept.huirth';`,
      `import { createCadmiumHuirthConcept } from '../cadmium/cadmium.concept.huirth';`,
      ``,
      `export const createHuirthConcept = () => {`,
      `  return muxifyConcepts([`,
      `      createCadmiumHuirthConcept(),`,
      `      createSuite8HuirthConcept(),`,
      `  ]);`,
      `};`,
      ``,
    ].join('\n'),
  );

  // FT-008 AIME-3 target — vue.principle.ts with DEFAULT_LANDING_MUXONOMIC (the
  // default-disable block · conceptName 'default' + isMainLanding: true) + the
  // REGISTERED_MUXONOMICS array (suiteCascadeMuxonomic is the last entry · the
  // array-entry anchor). Byte-exact live anchors.
  writeFileSync(
    path.join(concepts, 'vue', 'vue.principle.ts'),
    [
      `import { notificationMuxonomic } from '../notification/notification.muxonomy';`,
      `import { scsBridgeMuxonomic } from '../scsBridge/scsBridge.muxonomy';`,
      `import { suite8Muxonomic } from '../suite8/suite8.muxonomy';`,
      `import { cadmiumMuxonomic } from '../cadmium/cadmium.muxonomy';`,
      `import { suiteCascadeMuxonomic } from '../suiteCascade/suiteCascade.muxonomy';`,
      `import { type MuxonomicConfig } from '../muxonomy/muxonomy.model';`,
      ``,
      `const DEFAULT_LANDING_MUXONOMIC: MuxonomicConfig<'default'> = {`,
      `  conceptName: 'default',`,
      `  navigation: {`,
      `    isMainLanding: true,`,
      `    label: 'Home',`,
      `    order: 0,`,
      `    pages: [],`,
      `  },`,
      `};`,
      ``,
      `const REGISTERED_MUXONOMICS: MuxonomicConfig[] = [`,
      `  DEFAULT_LANDING_MUXONOMIC,`,
      `  notificationMuxonomic,`,
      `  scsBridgeMuxonomic,`,
      `  suite8Muxonomic,`,
      `  cadmiumMuxonomic,`,
      `  suiteCascadeMuxonomic,`,
      `];`,
      ``,
      `export const registeredCount = REGISTERED_MUXONOMICS.length;`,
      ``,
    ].join('\n'),
  );

  // FT-008 Phase-2 incumbent flip target — cadmium.muxonomy.ts with the
  // cadmiumNavigation block (isMainLanding: true · the (c) op flips it to false).
  writeFileSync(
    path.join(concepts, 'cadmium', 'cadmium.muxonomy.ts'),
    [
      `import { type NavigationConfig } from '../muxonomy/muxonomy.model';`,
      ``,
      `export const cadmiumNavigation: NavigationConfig = {`,
      `  isMainLanding: true,`,
      `  label: 'Cadmium Researcher',`,
      `  order: 4,`,
      `  pages: [],`,
      `};`,
      ``,
      `export const cadmiumMuxonomic = { conceptName: 'cadmium', navigation: cadmiumNavigation };`,
      ``,
    ].join('\n'),
  );

  return tmp;
}

describe('runSuite8PageCreate', () => {
  // ---- Group 1 — Tokenizer reuse ----
  describe('tokenizer reuse (validateAndDerive)', () => {
    it('rejects an invalid name with a reason', () => {
      const tmp = buildFixture();
      try {
        const r = runSuite8PageCreate({ projectRoot: tmp, name: 'my-bad-name', execRunner: grepStub });
        expect(r.ok).toBe(false);
        expect(r.reason).toMatch(/Invalid/);
      } finally {
        rmSync(tmp, { recursive: true, force: true });
      }
    });

    it('derives designation/conceptName for a valid name (Research → research)', () => {
      const tmp = buildFixture();
      try {
        const r = runSuite8PageCreate({ projectRoot: tmp, name: 'Research', execRunner: grepStub });
        expect(r.ok).toBe(true);
        expect(r.designation).toBe('Research');
        expect(r.conceptName).toBe('research');
      } finally {
        rmSync(tmp, { recursive: true, force: true });
      }
    });
  });

  // ---- Group 2 — No-SCP fail-loud ----
  describe('requires-existing-SCP', () => {
    it('fails loud against a projectRoot with no SCP', () => {
      const tmp = mkdtempSync(path.join(os.tmpdir(), 'md1-nosp-'));
      try {
        const r = runSuite8PageCreate({ projectRoot: tmp, name: 'Research', execRunner: grepStub });
        expect(r.ok).toBe(false);
        expect(r.reason).toMatch(/No installed SCP/);
      } finally {
        rmSync(tmp, { recursive: true, force: true });
      }
    });
  });

  // ---- Group 3 — LFRCL gate order + zero-grep over the GLOB-walked fixture ----
  describe('LFRCL gate order + zero-grep', () => {
    it('passes gates in order and zeroes the suite8 grep over the new dir', () => {
      const tmp = buildFixture();
      try {
        const r = runSuite8PageCreate({ projectRoot: tmp, name: 'Research', execRunner: grepStub });
        expect(r.ok).toBe(true);
        expect(r.gatesPassed).toEqual(['positive-presence', 'zero-grep', 'tsc']);

        const newDir = path.join(tmp, 'Cascades/scps/Scratch/SCP/src/concepts/research');
        // positive-presence
        expect(existsSync(path.join(newDir, 'research.muxonomy.ts'))).toBe(true);
        // zero-grep — the GLOB walk + find-replace caught the deep vue/components/
        // file, the model/ file, and the double-token quality basename.
        const grepCount = execSync(`grep -ric 'suite8' "${newDir}" || true`, { stdio: 'pipe' })
          .toString()
          .split('\n')
          .filter(Boolean)
          .reduce((s, l) => s + Number(l.split(':').pop()), 0);
        expect(grepCount).toBe(0);
        // double-token basename renamed correctly.
        expect(
          existsSync(path.join(newDir, 'qualities', 'researchRegisterResearch.quality.client.ts')),
        ).toBe(true);
        // deep vue/components/ .vue renamed.
        expect(existsSync(path.join(newDir, 'vue', 'components', 'ResearchSessionList.vue'))).toBe(
          true,
        );
        // template SOURCE untouched.
        const src = path.join(tmp, 'Cascades/scps/Scratch/SCP/src/concepts/suite8');
        expect(existsSync(path.join(src, 'suite8.type.ts'))).toBe(true);
      } finally {
        rmSync(tmp, { recursive: true, force: true });
      }
    });

    it('reverts on a forced grep failure (the template SOURCE survives)', () => {
      const tmp = buildFixture();
      try {
        // execRunner that makes the zero-grep gate report a non-zero remainder.
        const failingGrep: ExecRunner = (command, cwd) => {
          if (command.includes("grep -ric 'suite8'")) {
            return `${path.join(tmp, 'x')}:3\n`;
          }
          if (command.includes("grep -ril 'suite8'")) {
            return `someFile.ts\n`;
          }
          if (command.startsWith('npx tsc') || command.startsWith('npm run build:client')) {
            return '';
          }
          return execSync(command, { cwd, stdio: 'pipe' }).toString();
        };
        const r = runSuite8PageCreate({ projectRoot: tmp, name: 'Research', execRunner: failingGrep });
        expect(r.ok).toBe(false);
        expect(r.reverted).toBe(true);
        expect(r.reason).toMatch(/zero-grep/);
        // the new dir was removed on revert
        const newDir = path.join(tmp, 'Cascades/scps/Scratch/SCP/src/concepts/research');
        expect(existsSync(newDir)).toBe(false);
        // the foreign IslandWrapper.vue was restored (no research key)
        const island = readFileSync(
          path.join(tmp, 'Cascades/scps/Scratch/SCP/src/concepts/vue/IslandWrapper.vue'),
          'utf8',
        );
        expect(island).not.toContain('research:');
        // AIME-3: the foreign vue.principle.ts was ALSO restored (no researchMuxonomic).
        const vp = readFileSync(
          path.join(tmp, 'Cascades/scps/Scratch/SCP/src/concepts/vue/vue.principle.ts'),
          'utf8',
        );
        expect(vp).not.toContain('researchMuxonomic');
      } finally {
        rmSync(tmp, { recursive: true, force: true });
      }
    });
  });

  // ---- Group 4 — AIME idempotence (double-invoke = single insert · S8ERI) ----
  describe('AIME idempotence (S8ERI)', () => {
    it('double-invoke (--force re-run) yields exactly ONE insert each', () => {
      const tmp = buildFixture();
      try {
        const islandPath = path.join(
          tmp,
          'Cascades/scps/Scratch/SCP/src/concepts/vue/IslandWrapper.vue',
        );
        const huirthPath = path.join(
          tmp,
          'Cascades/scps/Scratch/SCP/src/concepts/huirth/huirth.concept.ts',
        );

        const vpPath = path.join(
          tmp,
          'Cascades/scps/Scratch/SCP/src/concepts/vue/vue.principle.ts',
        );

        const r1 = runSuite8PageCreate({ projectRoot: tmp, name: 'Research', execRunner: grepStub });
        expect(r1.ok).toBe(true);
        expect(r1.aimeInserts).toEqual({
          island: 'inserted',
          huirth: 'inserted',
          registry: 'inserted',
        });

        const island1 = readFileSync(islandPath, 'utf8');
        const huirth1 = readFileSync(huirthPath, 'utf8');
        expect((island1.match(/research: \(\) => import/g) || []).length).toBe(1);
        expect((huirth1.match(/createResearchHuirthConcept/g) || []).length).toBe(2); // import + call

        // Re-run with --force; the AIME skip-if-present guard must fire.
        const r2 = runSuite8PageCreate({
          projectRoot: tmp,
          name: 'Research',
          force: true,
          execRunner: grepStub,
        });
        expect(r2.ok).toBe(true);
        expect(r2.aimeInserts).toEqual({
          island: 'skipped',
          huirth: 'skipped',
          registry: 'skipped',
        });

        const island2 = readFileSync(islandPath, 'utf8');
        const huirth2 = readFileSync(huirthPath, 'utf8');
        expect((island2.match(/research: \(\) => import/g) || []).length).toBe(1); // STILL 1
        expect((huirth2.match(/createResearchHuirthConcept/g) || []).length).toBe(2); // STILL 2
        // AIME-3 registry: import + array entry = exactly 2 researchMuxonomic occurrences,
        // STILL 2 after the --force re-run (the guard fired).
        const vp2 = readFileSync(vpPath, 'utf8');
        expect((vp2.match(/researchMuxonomic/g) || []).length).toBe(2);
      } finally {
        rmSync(tmp, { recursive: true, force: true });
      }
    });
  });

  // ---- Group 5 — SAMLS block-scope (THE NAMED HAZARD · NON-OPTIONAL) ----
  describe('SAMLS targets ONLY the HomeNavigation block', () => {
    it('flips researchHomeNavigation to true while researchNavigation stays false', () => {
      const tmp = buildFixture();
      try {
        const r = runSuite8PageCreate({
          projectRoot: tmp,
          name: 'Research',
          home: true,
          execRunner: grepStub, // build:client stubbed to succeed
        });
        expect(r.ok).toBe(true);
        expect(r.homeRequested).toBe(true);
        expect(r.homeClaimed).toBe(true);
        expect(r.gatesPassed).toContain('build:client');

        const mux = readFileSync(
          path.join(tmp, 'Cascades/scps/Scratch/SCP/src/concepts/research/research.muxonomy.ts'),
          'utf8',
        );
        // Block-scope proof: the non-home block retains isMainLanding: false.
        const navBlock = mux.slice(
          mux.indexOf('export const researchNavigation'),
          mux.indexOf('export const researchHomeNavigation'),
        );
        expect(navBlock).toContain('isMainLanding: false');
        expect(navBlock).toContain('order: 3');
        // The home block flipped to true + order: 0.
        const homeBlock = mux.slice(
          mux.indexOf('export const researchHomeNavigation'),
          mux.indexOf('export const researchMuxonomic'),
        );
        expect(homeBlock).toContain('isMainLanding: true');
        expect(homeBlock).toContain('order: 0');
        // Exactly ONE isMainLanding: true across the whole file (no global flip).
        expect((mux.match(/isMainLanding: true/g) || []).length).toBe(1);
      } finally {
        rmSync(tmp, { recursive: true, force: true });
      }
    });

    it('SAMLS-only revert preserves the base concept when build:client fails', () => {
      const tmp = buildFixture();
      try {
        const failingBuild: ExecRunner = (command, cwd) => {
          if (command.startsWith('npm run build:client')) {
            throw new Error('simulated build:client failure');
          }
          if (command.startsWith('npx tsc')) return '';
          return execSync(command, { cwd, stdio: 'pipe' }).toString();
        };
        const r = runSuite8PageCreate({
          projectRoot: tmp,
          name: 'Research',
          home: true,
          execRunner: failingBuild,
        });
        // base PRESERVED — ok:true, home NOT claimed.
        expect(r.ok).toBe(true);
        expect(r.homeClaimed).toBe(false);
        expect(r.homeClaimRevertReason).toMatch(/build:client failed/);

        const newDir = path.join(tmp, 'Cascades/scps/Scratch/SCP/src/concepts/research');
        // the page still exists (base preserved)
        expect(existsSync(path.join(newDir, 'research.muxonomy.ts'))).toBe(true);
        // the SAMLS was reverted — no isMainLanding: true
        const mux = readFileSync(path.join(newDir, 'research.muxonomy.ts'), 'utf8');
        expect(mux).not.toContain('isMainLanding: true');
      } finally {
        rmSync(tmp, { recursive: true, force: true });
      }
    });
  });

  // ---- Group 6 — A1 Context-B skip-to-Phase-2 branch ----
  describe('A1 Context-B branch (dir exists + --home + !--force)', () => {
    it('skips creation and runs only the SAMLS phase on the existing dir', () => {
      const tmp = buildFixture();
      try {
        // First, create the page WITHOUT home.
        const r1 = runSuite8PageCreate({ projectRoot: tmp, name: 'Research', execRunner: grepStub });
        expect(r1.ok).toBe(true);
        expect(r1.homeRequested).toBe(false);

        const newDir = path.join(tmp, 'Cascades/scps/Scratch/SCP/src/concepts/research');
        const muxBefore = readFileSync(path.join(newDir, 'research.muxonomy.ts'), 'utf8');
        expect(muxBefore).not.toContain('isMainLanding: true');

        // Now re-invoke with --home but NO --force → Context-B skip-to-Phase-2.
        const r2 = runSuite8PageCreate({
          projectRoot: tmp,
          name: 'Research',
          home: true,
          execRunner: grepStub,
        });
        expect(r2.ok).toBe(true);
        expect(r2.homeRequested).toBe(true);
        expect(r2.homeClaimed).toBe(true);
        // It did NOT hit the alreadyInstalled guard.
        expect(r2.alreadyInstalled).toBeUndefined();

        const muxAfter = readFileSync(path.join(newDir, 'research.muxonomy.ts'), 'utf8');
        expect(muxAfter).toContain('isMainLanding: true');
      } finally {
        rmSync(tmp, { recursive: true, force: true });
      }
    });

    it('a plain re-run without --home returns alreadyInstalled', () => {
      const tmp = buildFixture();
      try {
        runSuite8PageCreate({ projectRoot: tmp, name: 'Research', execRunner: grepStub });
        const r2 = runSuite8PageCreate({ projectRoot: tmp, name: 'Research', execRunner: grepStub });
        expect(r2.ok).toBe(false);
        expect(r2.alreadyInstalled).toBe(true);
        expect(r2.reason).toMatch(/already created/);
      } finally {
        rmSync(tmp, { recursive: true, force: true });
      }
    });
  });

  // ---- Group 7 — AIME-3 · REGISTERED_MUXONOMICS wire (THE THIRD SURFACE · FT-008) ----
  describe('AIME-3 REGISTERED_MUXONOMICS (BARE create · page VISIBLE without --home)', () => {
    const vpRel = 'Cascades/scps/Scratch/SCP/src/concepts/vue/vue.principle.ts';

    it('BARE create wires the import + array entry (grep >=2) without any home claim', () => {
      const tmp = buildFixture();
      try {
        const r = runSuite8PageCreate({ projectRoot: tmp, name: 'Research', execRunner: grepStub });
        expect(r.ok).toBe(true);
        // BARE create — no home requested.
        expect(r.homeRequested).toBe(false);
        expect(r.aimeInserts?.registry).toBe('inserted');

        const vp = readFileSync(path.join(tmp, vpRel), 'utf8');
        // The CRITICAL Concluder (S7 Fuchsia): grep -c researchMuxonomic >= 2 (import + entry).
        expect((vp.match(/researchMuxonomic/g) || []).length).toBeGreaterThanOrEqual(2);
        // The import line lands ABOVE the registry declaration.
        expect(vp).toContain(
          `import { researchMuxonomic } from '../research/research.muxonomy';`,
        );
        // The array entry lands AFTER the suiteCascade anchor.
        const arr = vp.slice(vp.indexOf('const REGISTERED_MUXONOMICS'));
        expect(arr).toContain('  suiteCascadeMuxonomic,\n  researchMuxonomic,');
        // The page is VISIBLE without a home claim: the DEFAULT block stays isMainLanding: true.
        expect(vp).toContain('isMainLanding: true');
      } finally {
        rmSync(tmp, { recursive: true, force: true });
      }
    });

    it('AIME-3 is idempotent — a --force re-run leaves exactly 2 occurrences', () => {
      const tmp = buildFixture();
      try {
        runSuite8PageCreate({ projectRoot: tmp, name: 'Research', execRunner: grepStub });
        const r2 = runSuite8PageCreate({
          projectRoot: tmp,
          name: 'Research',
          force: true,
          execRunner: grepStub,
        });
        expect(r2.aimeInserts?.registry).toBe('skipped');
        const vp = readFileSync(path.join(tmp, vpRel), 'utf8');
        expect((vp.match(/researchMuxonomic/g) || []).length).toBe(2); // STILL 2
      } finally {
        rmSync(tmp, { recursive: true, force: true });
      }
    });
  });

  // ---- Group 8 — the navigation swap (Gap 2 · block-scoped to the muxonomic struct) ----
  describe('Phase-2 navigation swap (registers researchHomeNavigation)', () => {
    it('--home swaps the muxonomic navigation field from researchNavigation to researchHomeNavigation', () => {
      const tmp = buildFixture();
      try {
        const r = runSuite8PageCreate({
          projectRoot: tmp,
          name: 'Research',
          home: true,
          execRunner: grepStub,
        });
        expect(r.ok).toBe(true);
        expect(r.homeClaimed).toBe(true);

        const mux = readFileSync(
          path.join(tmp, 'Cascades/scps/Scratch/SCP/src/concepts/research/research.muxonomy.ts'),
          'utf8',
        );
        // The muxonomic struct now registers the HOME navigation (the home claim is what
        // getLandingIsland() reads). Block-scoped: only the struct's navigation field changed.
        const structBlock = mux.slice(mux.indexOf('export const researchMuxonomic'));
        expect(structBlock).toContain('navigation: researchHomeNavigation');
        expect(structBlock).not.toContain('navigation: researchNavigation');
        // The sidebar nav export itself is untouched (still defined).
        expect(mux).toContain('export const researchNavigation');
      } finally {
        rmSync(tmp, { recursive: true, force: true });
      }
    });
  });

  // ---- Group 9 — the default-disable + cadmium-flip + their revert (USER DECISION) ----
  describe('Phase-2 default-disable + cadmium-flip (USER DECISION · all-three revert)', () => {
    const vpRel = 'Cascades/scps/Scratch/SCP/src/concepts/vue/vue.principle.ts';
    const cadRel = 'Cascades/scps/Scratch/SCP/src/concepts/cadmium/cadmium.muxonomy.ts';

    it('--home disables DEFAULT_LANDING and flips cadmium incumbent to false', () => {
      const tmp = buildFixture();
      try {
        const r = runSuite8PageCreate({
          projectRoot: tmp,
          name: 'Research',
          home: true,
          execRunner: grepStub,
        });
        expect(r.ok).toBe(true);
        expect(r.homeClaimed).toBe(true);

        // (b) DEFAULT disabled: the DEFAULT_LANDING block's isMainLanding flipped to false.
        const vp = readFileSync(path.join(tmp, vpRel), 'utf8');
        const defaultBlock = vp.slice(
          vp.indexOf(`conceptName: 'default'`),
          vp.indexOf('const REGISTERED_MUXONOMICS'),
        );
        expect(defaultBlock).toContain('isMainLanding: false');
        expect(defaultBlock).not.toContain('isMainLanding: true');

        // (c) cadmium incumbent flipped: the cadmiumNavigation block isMainLanding false.
        const cad = readFileSync(path.join(tmp, cadRel), 'utf8');
        const cadBlock = cad.slice(
          cad.indexOf('export const cadmiumNavigation'),
          cad.indexOf('export const cadmiumMuxonomic'),
        );
        expect(cadBlock).toContain('isMainLanding: false');
        expect(cadBlock).not.toContain('isMainLanding: true');
      } finally {
        rmSync(tmp, { recursive: true, force: true });
      }
    });

    it('build:client failure reverts ALL THREE Phase-2 files (base PRESERVED)', () => {
      const tmp = buildFixture();
      try {
        const failingBuild: ExecRunner = (command, cwd) => {
          if (command.startsWith('npm run build:client')) {
            throw new Error('simulated build:client failure');
          }
          if (command.startsWith('npx tsc')) return '';
          return execSync(command, { cwd, stdio: 'pipe' }).toString();
        };
        const r = runSuite8PageCreate({
          projectRoot: tmp,
          name: 'Research',
          home: true,
          execRunner: failingBuild,
        });
        expect(r.ok).toBe(true);
        expect(r.homeClaimed).toBe(false);
        expect(r.homeClaimRevertReason).toMatch(/build:client failed/);

        // The base concept is PRESERVED (AIME-3 registry wire from Phase 1 stays).
        const vp = readFileSync(path.join(tmp, vpRel), 'utf8');
        expect((vp.match(/researchMuxonomic/g) || []).length).toBe(2);
        // But the Phase-2 DEFAULT disable was REVERTED — DEFAULT stays isMainLanding: true.
        const defaultBlock = vp.slice(
          vp.indexOf(`conceptName: 'default'`),
          vp.indexOf('const REGISTERED_MUXONOMICS'),
        );
        expect(defaultBlock).toContain('isMainLanding: true');

        // cadmium reverted — incumbent stays true.
        const cad = readFileSync(path.join(tmp, cadRel), 'utf8');
        expect(cad).toContain('isMainLanding: true');

        // The muxonomy SAMLS + nav swap reverted — no isMainLanding: true, nav field restored.
        const mux = readFileSync(
          path.join(tmp, 'Cascades/scps/Scratch/SCP/src/concepts/research/research.muxonomy.ts'),
          'utf8',
        );
        expect(mux).not.toContain('isMainLanding: true');
        expect(mux).toContain('navigation: researchNavigation');
      } finally {
        rmSync(tmp, { recursive: true, force: true });
      }
    });
  });
});
