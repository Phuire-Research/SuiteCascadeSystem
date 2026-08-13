<script setup lang="ts">
/**
 * S8CinnabarSeed.vue — D-MSE-4 · THE CINNABAR SEED WIDGET (the Method Seed door).
 *
 * THE SEED-DOOR LAW: the acquired method ships as a Seed beside the constitution, and this
 * widget is its ONE door — three faces over ZERO new server code. THE MANUAL browses the
 * Seed docs fresh-from-disk through the existing Documentation Site route pair
 * (/documentation-index + /documentation-doc · the Seed Versioning Law: a template update
 * refreshes the Manual without a rebuild). THE DIALECTICS reads the Cinnabar Dialectic
 * Instance through the rename-proof /s8/:name/instance reader and client-parses its
 * Observed Pattern Registry (`### Pn:` · ONE truth — the Instance IS the registry) into
 * engageable rows. THE PASS-THROUGH is the ONE MOTION fork in the S8ForgeMenu shape: a
 * live Seed conduction is FOCUSED anor routed-to, never duplicated; none live spawns fresh
 * carrying the Induction Vermillion from the pure builders (src/model — never inline).
 * Induction is invited, never automatic; the agent writes to ITS OWN memory seat (the
 * memory law — no path is minted client-side). Bridge-less, the Manual and Dialectics
 * stand read-only (Honest-Absence) and the fire disables with an honest note.
 *
 * TOKEN-FREE by the S8ForgeMenu law: the shared vue concept is NEVER inside the mint copy
 * surface — ONE canonical file updates every install via the SCP UPDATE circuit.
 *
 * Citation: SEED-WIDGET-BLUEPRINT.md (the commission) · S8ForgeMenu.vue (the widget-class
 * precedent) · seedInductionVermillion.model.ts (the pure builders).
 */
import { ref, computed, onMounted } from 'vue';
import { marked } from 'marked';
import { findLiveS8ConductionForTarget } from '../../scsBridge/model/s8Anchor.model';
import { getGlobalScsBridgeController } from '../../scsBridge/scsBridgeController';
import {
  buildSeedInductionVermillion,
  buildDialecticDirective,
  type DialecticRow,
} from '../../../model/seedInductionVermillion.model';

const props = defineProps<{
  // The mounting page's identity (the ForgeMenu `designation` precedent — token-free).
  designation: string;
  // REQUIRED (the boolean-prop trap law: an absent optional boolean coerces to false, so
  // requiring it forces every mount to declare). false = boots OPEN; true = boots collapsed.
  worked: boolean;
}>();

// The Seed's own Suite 8 — the conduction target AND the registry stamp the ONE MOTION
// re-finds (targetSuite8Name). ONE literal, one seat.
const SEED_TARGET = 'Cinnabar Dialectic';

// ============================================================
// THE FOLD (the ForgeMenu boot idiom, trimmed): fresh mounts boot OPEN, worked collapsed.
// No persistence in v1 — the Home seat is the canonical placement.
// ============================================================
const seedOpen = ref<boolean>(!props.worked);
const activeFace = ref<'manual' | 'dialectics'>('manual');
function toggleSeedOpen(): void {
  seedOpen.value = !seedOpen.value;
  if (seedOpen.value) ensureFacesLoaded();
}

// ============================================================
// FACE (a) · THE MANUAL — the Seed docs through the Documentation Site route pair.
// Honest-Absence: a failed index anor doc fetch renders a quiet note, never a fabricated
// Manual.
// ============================================================
type SeedDocEntry = { file: string; title: string };
const manualLoaded = ref<boolean>(false);
const manualDocs = ref<SeedDocEntry[]>([]);
const manualNote = ref<string>('');
const activeManualFile = ref<string>('');
const manualMarkdown = ref<string>('');
const manualDocLoading = ref<boolean>(false);
async function loadManualIndex(): Promise<void> {
  try {
    const r = await fetch('/documentation-index');
    if (!r.ok) {
      manualNote.value = 'The Seed documentation could not be indexed from this install.';
      return;
    }
    const j = (await r.json()) as {
      sections?: { id: string; docs?: SeedDocEntry[] }[];
    };
    const local = j.sections?.find((s) => s.id === 'local');
    const docs = (local?.docs ?? [])
      .filter((d) => d.file.startsWith('Seed/'))
      .sort((a, b) => a.file.localeCompare(b.file));
    manualDocs.value = docs;
    if (docs.length === 0) {
      manualNote.value = 'No Seed documents were found in this install — the Seed ships with the template update.';
      return;
    }
    // SEED-0 leads (the filename sort places the index first) — open it as the Manual's home.
    void openManualDoc(docs[0].file);
  } catch {
    manualNote.value = 'The Seed documentation could not be reached — the install still carries it on disk.';
  }
}
async function openManualDoc(file: string): Promise<void> {
  activeManualFile.value = file;
  manualDocLoading.value = true;
  manualMarkdown.value = '';
  try {
    const r = await fetch(
      `/documentation-doc?section=local&file=${encodeURIComponent(file)}`,
    );
    if (activeManualFile.value !== file) return; // stale-guard — the reader moved on mid-flight.
    if (!r.ok) {
      manualNote.value = `Could not read ${file}.`;
      return;
    }
    const j = (await r.json()) as { markdown?: string };
    if (activeManualFile.value !== file) return; // stale-guard — the json() await is a second gap.
    manualMarkdown.value = typeof j.markdown === 'string' ? j.markdown : '';
    manualNote.value = '';
  } catch {
    manualNote.value = `Could not read ${file}.`;
  } finally {
    if (activeManualFile.value === file) manualDocLoading.value = false;
  }
}
const renderedManualDoc = computed<string>(() =>
  manualMarkdown.value
    ? (marked.parse(manualMarkdown.value, { async: false }) as string)
    : '',
);
function manualDocLabel(d: SeedDocEntry): string {
  return d.title || d.file.replace(/^Seed\//, '');
}

// ============================================================
// FACE (b) · THE DIALECTICS — the Observed Pattern Registry out of the Cinnabar Instance
// (the /s8/:name/instance reader · ONE truth). Rows are engageable: a selected row PRIMES
// a question into the Pass-Through. Honest-Absence (R4): zero parsed rows render the raw
// Instance note, never an empty fabrication.
// ============================================================
const dialecticsLoaded = ref<boolean>(false);
const dialecticRows = ref<DialecticRow[]>([]);
const dialecticsNote = ref<string>('');
const selectedDialectic = ref<DialecticRow | null>(null);
function parseDialecticRows(md: string): DialecticRow[] {
  const rows: DialecticRow[] = [];
  const lines = md.split('\n');
  for (let i = 0; i < lines.length; i += 1) {
    const m = /^### (P\d+): (.+)$/.exec(lines[i]);
    if (!m) continue;
    const bodyLines: string[] = [];
    for (let j = i + 1; j < lines.length; j += 1) {
      if (/^#{1,6} /.test(lines[j])) break;
      bodyLines.push(lines[j]);
    }
    rows.push({ key: m[1], label: m[2].trim(), line: i + 1, body: bodyLines.join('\n').trim() });
  }
  return rows;
}
async function loadDialectics(): Promise<void> {
  try {
    const r = await fetch(`/s8/${encodeURIComponent(SEED_TARGET)}/instance`);
    if (!r.ok) {
      dialecticsNote.value = 'The Cinnabar Dialectic Instance could not be read from this install.';
      return;
    }
    const rows = parseDialecticRows(await r.text());
    dialecticRows.value = rows;
    if (rows.length === 0) {
      dialecticsNote.value =
        'No registry patterns parsed — read the Instance directly at Cascades/8_SUITES/Cinnabar Dialectic/Instance.md.';
    }
  } catch {
    dialecticsNote.value = 'The Cinnabar Dialectic Instance could not be reached.';
  }
}
function selectDialectic(row: DialecticRow): void {
  selectedDialectic.value = selectedDialectic.value?.key === row.key ? null : row;
}
function clearDialecticPrime(): void {
  selectedDialectic.value = null;
}

// ============================================================
// FACE (c) · THE PASS-THROUGH — the ONE MOTION fork (the S8ForgeMenu engage idiom).
// UNPRIMED: a live Seed conduction is FOCUSED (questions route to the running agent —
// never a duplicate spawn); none live SPAWNS fresh carrying the Induction Vermillion.
// PRIMED (a Dialectic row selected): the QUESTION directive routes to the live conduction
// (triggerDeliverVermillion + focus — the fireForgeMenuEntry fork) anor spawns with it.
// ============================================================
const bridgeReady = ref<boolean>(false);
const passFiring = ref<boolean>(false);
const passNote = ref<string>('');
async function engageSeedPassThrough(): Promise<void> {
  const ctrl = getGlobalScsBridgeController();
  if (!ctrl) {
    passNote.value = 'The Bridge is not connected — the Manual and Dialectics stand; induction waits.';
    return;
  }
  if (passFiring.value) return;
  passFiring.value = true;
  passNote.value = '';
  try {
    // THE TIMEOUT RACE (C375) — a never-settling getScpName must never hang the dispatch.
    const scpName = (await Promise.race([
      ctrl.getScpName(),
      new Promise<string | null>((r) => setTimeout(() => r(null), 3000)),
    ])) ?? undefined;
    // THE ONE MOTION — the live Seed conduction, target-stamped (never duplicated).
    const live = findLiveS8ConductionForTarget(
      ctrl.sessionsList.value ?? [], SEED_TARGET, scpName, SEED_TARGET,
    );
    const primed = selectedDialectic.value;
    if (primed) {
      const directive = buildDialecticDirective(primed);
      if (live) {
        const result = await ctrl.triggerDeliverVermillion(live.id, directive);
        if (result.ok) {
          ctrl.triggerFocusSession(live.id);
          passNote.value = `${primed.key} routed to the running Seed session.`;
        } else {
          passNote.value = `${primed.key}: the route was refused — ${result.error ?? 'unknown'}.`;
        }
        return;
      }
      ctrl.triggerSpawnS8Session(SEED_TARGET, scpName, false, true, false, directive, true, true, SEED_TARGET);
      passNote.value = `${primed.key} engaged a fresh Seed session for this dialectic.`;
      return;
    }
    if (live) {
      ctrl.triggerFocusSession(live.id);
      passNote.value = 'Focused the running Seed session — confer with it directly.';
      return;
    }
    ctrl.triggerSpawnS8Session(
      SEED_TARGET, scpName, false, true, false, buildSeedInductionVermillion(), true, true, SEED_TARGET,
    );
    passNote.value = "Induction engaged — the agent reads the Seed and records it into this project's memory.";
  } catch {
    passNote.value = 'Could not engage — is the Bridge running?';
  } finally {
    setTimeout(() => {
      passFiring.value = false;
    }, 1200);
  }
}
const passButtonLabel = computed<string>(() => {
  if (passFiring.value) return 'Engaging…';
  return selectedDialectic.value
    ? `Open Dialectic · ${selectedDialectic.value.key}`
    : 'Engage the Induction Agent';
});

// ============================================================
// THE LOAD GATE — both read-only faces fetch once, on first open (fresh-from-disk; the
// Bridge is never required for either).
// ============================================================
function ensureFacesLoaded(): void {
  if (!manualLoaded.value) {
    manualLoaded.value = true;
    void loadManualIndex();
  }
  if (!dialecticsLoaded.value) {
    dialecticsLoaded.value = true;
    void loadDialectics();
  }
}
onMounted(() => {
  bridgeReady.value = getGlobalScsBridgeController() !== null;
  if (seedOpen.value) ensureFacesLoaded();
});
</script>

<template>
  <!-- THE WIDGET ROOT — the ForgeMenu flair exchange: open wears the transparent glass
       vessel; closed is the quiet toggle row. -->
  <div
    class="s8-cinnabar-seed"
    :class="seedOpen ? ['hifi-pane-transparent', 's8seed--open'] : []"
  >
    <button class="s8seed-toggle hifi-mono" @click="toggleSeedOpen">
      {{ seedOpen ? '▾' : '▸' }} THE METHOD SEED
    </button>

    <div v-if="seedOpen" class="s8seed-body">
      <!-- THE FACE TABS (Manual · Dialectics) — the Pass-Through stands beneath both as the
           persistent fire band (the priming Diameter: a selected row changes the fire in
           place, no tab hop). -->
      <div class="s8seed-tabs">
        <button
          type="button"
          class="s8seed-tab hifi-mono"
          :class="{ 's8seed-tab--active': activeFace === 'manual' }"
          @click="activeFace = 'manual'"
        >THE MANUAL</button>
        <button
          type="button"
          class="s8seed-tab hifi-mono"
          :class="{ 's8seed-tab--active': activeFace === 'dialectics' }"
          @click="activeFace = 'dialectics'"
        >THE DIALECTICS</button>
      </div>

      <!-- FACE (a) · THE MANUAL -->
      <div v-if="activeFace === 'manual'" class="s8seed-face">
        <p v-if="manualNote" class="s8seed-note">{{ manualNote }}</p>
        <template v-if="manualDocs.length > 0">
          <div class="s8seed-doc-pills">
            <button
              v-for="d in manualDocs"
              :key="d.file"
              type="button"
              class="s8seed-pill hifi-mono"
              :class="{ 's8seed-pill--active': d.file === activeManualFile }"
              :title="d.file"
              @click="openManualDoc(d.file)"
            >{{ manualDocLabel(d) }}</button>
          </div>
          <p v-if="manualDocLoading" class="s8seed-note">Reading from disk…</p>
          <div
            v-else-if="renderedManualDoc"
            class="s8seed-markdown-body custom-scrollbar"
            v-html="renderedManualDoc"
          />
        </template>
      </div>

      <!-- FACE (b) · THE DIALECTICS -->
      <div v-if="activeFace === 'dialectics'" class="s8seed-face">
        <span class="s8seed-eyebrow hifi-mono">The Observed Pattern Registry — select a pattern to prime a dialectic</span>
        <p v-if="dialecticsNote" class="s8seed-note">{{ dialecticsNote }}</p>
        <div v-for="row in dialecticRows" :key="row.key" class="s8seed-dialectic-wrap">
          <button
            type="button"
            class="s8seed-dialectic-row"
            :class="{ 's8seed-dialectic-row--selected': selectedDialectic?.key === row.key }"
            @click="selectDialectic(row)"
          >
            <span class="s8seed-dialectic-key hifi-mono">{{ row.key }}</span>
            <span class="s8seed-dialectic-label">{{ row.label }}</span>
          </button>
          <div
            v-if="selectedDialectic?.key === row.key && row.body"
            class="s8seed-dialectic-body"
          >{{ row.body }}</div>
        </div>
      </div>

      <!-- FACE (c) · THE PASS-THROUGH — the persistent fire band. -->
      <div class="s8seed-pass">
        <div v-if="selectedDialectic" class="s8seed-primed-row">
          <span class="s8seed-eyebrow hifi-mono">
            Primed: {{ selectedDialectic.key }} · {{ selectedDialectic.label }}
          </span>
          <button
            type="button"
            class="s8seed-clear hifi-mono"
            title="Clear the primed dialectic — the fire returns to the Seed induction."
            @click="clearDialecticPrime"
          >✕</button>
        </div>
        <p v-else class="s8seed-pass-lede">
          The Induction Agent reads the Seed and records the method into this project's own
          memory — invited, never automatic. A running Seed session is focused, never duplicated.
        </p>
        <button
          type="button"
          class="s8seed-btn"
          :disabled="passFiring || !bridgeReady"
          @click="engageSeedPassThrough"
        >
          <i class="fa-solid fa-seedling" aria-hidden="true"></i>
          <span>{{ passButtonLabel }}</span>
        </button>
        <p v-if="!bridgeReady" class="s8seed-note">
          The Bridge is not connected — the Manual and Dialectics stand read-only; induction
          waits for a live Bridge.
        </p>
        <p v-if="passNote" class="s8seed-note">{{ passNote }}</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* THE PEWTER REGISTER — the ForgeMenu chrome idiom, owned here (scoped · one canonical
   file · the compact one-line rule idiom). The glass vessel is hifi-pane-transparent (global). */
.s8seed--open { border-radius: 10px; padding: 0.45rem 0.5rem; }
.s8seed-toggle { padding: 0.2rem 0.55rem; border-radius: 9px; border: 1px solid rgba(255, 255, 255, 0.12); background: transparent; color: rgba(255, 255, 255, 0.6); font-size: 0.62rem; letter-spacing: 0.06em; cursor: pointer; transition: color 0.15s ease, border-color 0.15s ease; }
.s8seed-toggle:hover { color: rgba(255, 255, 255, 0.9); border-color: rgba(255, 255, 255, 0.24); }
.s8seed-body { margin-top: 0.4rem; display: flex; flex-direction: column; gap: 0.5rem; }
.s8seed-tabs { display: flex; gap: 0.35rem; }
.s8seed-tab { padding: 0.2rem 0.6rem; border-radius: 9px; border: 1px solid rgba(255, 255, 255, 0.12); background: transparent; color: rgba(255, 255, 255, 0.55); font-size: 0.6rem; letter-spacing: 0.07em; cursor: pointer; transition: color 0.15s ease, border-color 0.15s ease; }
.s8seed-tab:hover { color: rgba(255, 255, 255, 0.85); }
.s8seed-tab--active { color: rgba(232, 226, 248, 0.95); border-color: rgba(168, 85, 247, 0.4); }
.s8seed-face { display: flex; flex-direction: column; gap: 0.4rem; }
.s8seed-eyebrow { font-size: 0.6rem; letter-spacing: 0.08em; text-transform: uppercase; color: rgba(255, 255, 255, 0.5); }
.s8seed-note { color: rgba(216, 199, 154, 0.85); font-size: 0.68rem; margin: 0; }
.s8seed-doc-pills { display: flex; flex-wrap: wrap; gap: 0.3rem; }
.s8seed-pill { padding: 0.18rem 0.5rem; border-radius: 9px; border: 1px solid rgba(255, 255, 255, 0.12); background: transparent; color: rgba(255, 255, 255, 0.6); font-size: 0.58rem; letter-spacing: 0.04em; cursor: pointer; }
.s8seed-pill--active { color: rgba(232, 226, 248, 0.95); border-color: rgba(168, 85, 247, 0.4); }
/* The Seed reader — the s8cd-markdown-body register, owned scoped (v-html needs :deep). */
.s8seed-markdown-body { max-height: 24rem; overflow-y: auto; font-size: 0.74rem; line-height: 1.5; color: rgba(255, 255, 255, 0.78); padding: 0.4rem 0.5rem; border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 8px; }
.s8seed-markdown-body :deep(h1),
.s8seed-markdown-body :deep(h2),
.s8seed-markdown-body :deep(h3) { font-family: var(--font-heading, 'Orbitron', sans-serif); letter-spacing: 0.04em; color: rgba(255, 255, 255, 0.92); margin: 0.6rem 0 0.25rem; }
.s8seed-markdown-body :deep(h1) { font-size: 0.95rem; }
.s8seed-markdown-body :deep(h2) { font-size: 0.88rem; }
.s8seed-markdown-body :deep(h3) { font-size: 0.82rem; }
.s8seed-markdown-body :deep(p) { margin: 0.4rem 0; }
.s8seed-markdown-body :deep(strong) { color: rgba(255, 255, 255, 0.9); font-weight: 600; }
.s8seed-markdown-body :deep(code) { font-family: var(--font-mono, monospace); font-size: 0.68rem; background: rgba(255, 255, 255, 0.07); border-radius: 4px; padding: 0.05rem 0.3rem; }
.s8seed-markdown-body :deep(ul),
.s8seed-markdown-body :deep(ol) { margin: 0.3rem 0; padding-left: 1.1rem; }
.s8seed-markdown-body :deep(li) { margin: 0.2rem 0; }
.s8seed-markdown-body :deep(blockquote) { margin: 0.4rem 0; padding: 0.2rem 0.6rem; border-left: 2px solid rgba(168, 85, 247, 0.4); color: rgba(255, 255, 255, 0.65); }
.s8seed-dialectic-wrap { display: flex; flex-direction: column; }
.s8seed-dialectic-row { display: flex; align-items: baseline; gap: 0.5rem; width: 100%; text-align: left; padding: 0.3rem 0.5rem; border-radius: 6px; border: 1px solid rgba(255, 255, 255, 0.08); background: transparent; color: rgba(255, 255, 255, 0.75); font-size: 0.72rem; cursor: pointer; transition: border-color 0.15s ease, color 0.15s ease; }
.s8seed-dialectic-row:hover { color: rgba(255, 255, 255, 0.95); border-color: rgba(255, 255, 255, 0.2); }
.s8seed-dialectic-row--selected { border-color: rgba(168, 85, 247, 0.45); color: rgba(232, 226, 248, 0.95); }
.s8seed-dialectic-key { font-size: 0.62rem; letter-spacing: 0.06em; color: rgba(216, 199, 154, 0.9); }
.s8seed-dialectic-body { white-space: pre-wrap; font-size: 0.68rem; line-height: 1.45; color: rgba(255, 255, 255, 0.65); padding: 0.35rem 0.6rem 0.1rem; }
.s8seed-pass { display: flex; flex-direction: column; gap: 0.35rem; border-top: 1px solid rgba(255, 255, 255, 0.08); padding-top: 0.45rem; }
.s8seed-primed-row { display: flex; align-items: center; gap: 0.5rem; }
.s8seed-clear { padding: 0.05rem 0.35rem; border-radius: 6px; border: 1px solid rgba(255, 255, 255, 0.12); background: transparent; color: rgba(255, 255, 255, 0.55); font-size: 0.6rem; cursor: pointer; }
.s8seed-pass-lede { margin: 0; font-size: 0.7rem; color: rgba(255, 255, 255, 0.6); }
/* The Induct fire — the s8c-forge-btn chemistry, owned scoped. */
.s8seed-btn { display: inline-flex; align-items: center; gap: 0.45rem; align-self: flex-start; margin-top: 0.15rem; padding: 0.45rem 1rem; border-radius: 4px; font-family: var(--font-heading, 'Orbitron', sans-serif); font-size: 0.68rem; font-weight: 700; letter-spacing: 0.05em; text-transform: uppercase; cursor: pointer; color: #1c1812; background: #d8c79a; border-top: 1px solid #efe2bb; border-right: 1px solid #efe2bb; border-bottom: 1px solid #a8975e; border-left: 1px solid #a8975e; box-shadow: -1px 1px 3px rgba(168, 151, 94, 0.5); transition: filter 0.15s ease; }
.s8seed-btn:hover:not(:disabled) { filter: brightness(1.08); }
.s8seed-btn:disabled { opacity: 0.6; cursor: default; }
</style>
