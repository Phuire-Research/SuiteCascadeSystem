<script setup lang="ts">
/**
 * SuitePatternSelection.vue — HIFI.3 · the Suite Pattern Selection control (functional · in Settings)
 *
 * The Diameter twin of SuiteColorSelection.vue: 8 per-spectrum texture controls. Independent of the
 * color axis — separate model, separate localStorage key, separate root tokens (`--pattern-*` vs
 * `--color-*`). They compose on the shared token plane; neither owns the other.
 *
 * D-PSVG · PSVG-2 · THE ROUND-TRIP CONVERSION + THE SELECTION FORK — this widget now mirrors
 * SuiteColorSelection.vue ORGAN-FOR-ORGAN (the proven D-PCL/D-PXT shape):
 *
 *   1. THE STAMP PILL (mirror of SuiteColorSelection:51-63 + :236-246) — the locality face read
 *      (targetScpName/localScpName off currentS8Locality) + the blue-voiced 'Lands on' pill.
 *   2. THE TARGET-SEED (mirror of :109-144) — under Specified the tiles seed from the TARGET's
 *      chosen patterns (loadTargetHifiConfig(name)?.patterns) AND the picker's AVAILABLE entries
 *      render from the TARGET's library (loadTargetPatternLibrary — its css data-URIs let
 *      thumbnails render honestly even for ids the local bundle lacks). Watch seats: the locality
 *      EDGE + targetPatternLibraryStamp (library change → re-fetch) + targetHifiStamp (chosen-
 *      pattern change → re-seed) + mount. Stale-guards per the color widget.
 *   3. THE α-FIREWALL SPECIFIED PUSH (mirror of :146-177) — Specified = push-only: NO
 *      saveSuitePatternOverrides, NO own paint; the deck-matched Induction rides the cross-SCP
 *      pattern-push lane (sendPatternsToTarget · ids only, never css); receipt re-seed on settle.
 *   4. THE LOCAL ROUND TRIP (mirror of :179-194) — a Local click (α) persists the intent to the
 *      user's OWN localStorage and dispatches the Induction via the controller
 *      (applyHifiPatterns). applySuitePatternOverrides is RETIRED from the click path — the paint
 *      arrives on the RETURN (setHifiConfigRelay → applyHifiConfigWithOverrides ·
 *      hifiConfig.model.ts:93-97 re-applies localStorage patterns then JSON under). The clicking
 *      window re-tiles NO EARLIER than the rest — the round-trip law. Reset stays local (a
 *      distinct un-set op · the color widget's onReset discipline).
 *
 * HONEST-ABSENCE: an id the current library cannot resolve renders a NAMED state (the row caption
 * + the picker notice) — never a silent blank-tile masquerade.
 *
 * Output Firewall: SPECTRUM names + FUNCTIONAL designations + MOTIF labels ONLY — no profession/
 * cascade names, no scare-quotes.
 */
import { reactive, ref, computed, watch, onMounted, inject } from 'vue';
import {
  type SpectrumName,
  type RuntimePatternEntry,
  SPECTRUM_NAMES,
  PATTERN_LIBRARY,
  DEFAULT_PATTERN,
  loadSuitePatternOverrides,
  saveSuitePatternOverrides,
  clearSuitePatternOverrides,
  resolvePatternEntryById,
} from '../../../../model/suitePatternOverride.model';
import { getGlobalScsBridgeController, SCS_BRIDGE_CONTROLLER_KEY } from '../../scsBridgeController';
import SuitePatternPickerPanel from './SuitePatternPickerPanel.vue';
// D-PSVG · PSVG-2 · the origin-blind cross-SCP pattern push (the color circuit's pattern leg).
import { sendPatternsToTarget } from '../../../../model/crossScpColorInjection.model';
// The target's CHOSEN patterns ride its hifiConfig (the same US-3 read lane the color widget seeds
// from — SuiteColorSelection:41 · loadTargetHifiConfig).
import { loadTargetHifiConfig } from '../../../../model/hifiConfig.model';
// The AVAILABLE entries per locality — the per-SCP JSON pattern library loader pair (PSVG-1).
import {
  loadOwnPatternLibrary,
  loadTargetPatternLibrary,
  type PatternLibraryDocument,
} from '../../../../model/patternLibraryClientAccess.model';

// The scsBridge controller carries the pattern click's Induction dispatch (applyHifiPatterns) +
// the injection deck-constructor. inject-first with the getGlobal fallback (SuiteColorSelection:45).
const scsBridgeController = inject(SCS_BRIDGE_CONTROLLER_KEY) ?? getGlobalScsBridgeController();

// ORGAN 1 · THE STAMP PILL — the controller-direct locality face read (SuiteColorSelection:51-63).
// null = LOCAL (the own round trip); a name = SPECIFIED (the injection fork).
const targetScpName = computed<string | null>(
  () => scsBridgeController?.currentS8Locality.value?.specified ?? null,
);
const localScpName = computed<string | null>(
  () => scsBridgeController?.currentS8Locality.value?.localScp ?? null,
);
// The TARGET hifiConfig change-stamp — chosen-pattern moves at the target re-seed the tiles
// (the color widget's targetHifiStamp seat verbatim · SuiteColorSelection:61-63).
const targetHifiStamp = computed<number | null>(
  () => scsBridgeController?.currentS8Locality.value?.targetHifiStamp ?? null,
);
// D-PSVG · the SECOND accounted stamp — the TARGET patternLibrary.json's mtimeMs; a library change
// at the target (a new JSON pattern dropped) re-fetches the AVAILABLE entries (the Band 1 face seat
// · scsBridgeController.ts:36 · closing its 3-seat consumption delta).
const targetPatternLibraryStamp = computed<number | null>(
  () => scsBridgeController?.currentS8Locality.value?.targetPatternLibraryStamp ?? null,
);

// The spectrum label + functional designation per row (Output Firewall — no profession names).
// Mirrors SuiteColorSelection's FUNCTIONAL_LABEL.
const FUNCTIONAL_LABEL: Record<SpectrumName, { name: string; designation: string }> = {
  base: { name: 'Base', designation: 'Ground chrome' },
  red: { name: 'Red', designation: 'Primary actions' },
  orange: { name: 'Orange', designation: 'Discovery accents' },
  yellow: { name: 'Yellow', designation: 'Planning surfaces' },
  green: { name: 'Green', designation: 'Go / advance' },
  blue: { name: 'Blue', designation: 'Working-system panes' },
  purple: { name: 'Purple', designation: 'Secondary actions' },
  fuchsia: { name: 'Fuchsia', designation: 'Closing accents' },
};

// The live selection — OPEN string ids (a JSON-registered id beyond the factory union is a first-
// class choice). Saved overrides win over the defaults on setup.
const selection = reactive<Record<SpectrumName, string>>({
  ...DEFAULT_PATTERN,
  ...loadSuitePatternOverrides(),
});

// ============================================================
// ORGAN 2 · THE TARGET-SEED (tiles + AVAILABLE library per locality)
// ============================================================

// The OWN JSON library's extension entries (ids beyond the factory floor — the collision law:
// in-code wins, so a factory-colliding JSON id is dropped here as it would never resolve anyway).
const ownExtensionEntries = ref<RuntimePatternEntry[]>([]);
// The TARGET's library document under a Specified locality (null = not fetched anor absent).
const targetLibrary = ref<PatternLibraryDocument | null>(null);

// The AVAILABLE entries the picker renders — the locality's honest availability set.
// Specified: the TARGET's own library (seeded-from-factory + its extensions · its css lets
// thumbnails render for ids the local bundle lacks); a null target library falls to the factory
// floor (every citizen ships it in-code — the honest minimum, with the picker naming any id
// beyond it). Local: the factory floor + the own JSON extensions.
const FACTORY_IDS = new Set<string>(PATTERN_LIBRARY.map((entry) => entry.id));
const availableEntries = computed<RuntimePatternEntry[]>(() => {
  if (targetScpName.value) {
    const doc = targetLibrary.value;
    return doc && doc.patterns.length > 0 ? doc.patterns : [...PATTERN_LIBRARY];
  }
  return [...PATTERN_LIBRARY, ...ownExtensionEntries.value];
});

// Resolve an id to its motif label for the row caption. HONEST-ABSENCE: an unresolvable id is
// NAMED (never silently blanked) — the picker carries the matching notice.
function patternLabel(id: string): string {
  const entry =
    availableEntries.value.find((candidate) => candidate.id === id) ?? resolvePatternEntryById(id);
  return entry ? entry.label : `${id} — not available here`;
}

// Resolve an id to its css for the Specified tile preview (the tiles-only fork below). The target
// library resolves first (its data-URIs render foreign ids honestly); the local resolution second;
// an id in neither previews as none (the caption names the absence — no masquerade).
function patternCssFor(id: string): string {
  const entry =
    availableEntries.value.find((candidate) => candidate.id === id) ?? resolvePatternEntryById(id);
  return entry ? entry.css : 'none';
}

// The tile-seeding pair — the color widget's seedFromOwn/seedFromTarget verbatim shape
// (SuiteColorSelection:109-126), patterns for hexes.
function seedFromOwn(): void {
  const own: Record<SpectrumName, string> = { ...DEFAULT_PATTERN, ...loadSuitePatternOverrides() };
  for (const n of SPECTRUM_NAMES) selection[n] = own[n];
}

async function seedFromTarget(name: string): Promise<void> {
  const cfg = await loadTargetHifiConfig(name);
  // Stale-guard — the locality may have flipped again while this fetch was in flight.
  if (targetScpName.value !== name) return;
  const patterns = cfg?.patterns ?? {};
  for (const n of SPECTRUM_NAMES) selection[n] = patterns[n] ?? DEFAULT_PATTERN[n];
}

function reseedTiles(): void {
  const name = targetScpName.value;
  if (name) void seedFromTarget(name);
  else seedFromOwn();
}

// The library-fetch pair — the AVAILABLE entries per locality (stale-guarded like the seeds).
async function fetchOwnLibrary(): Promise<void> {
  const doc = await loadOwnPatternLibrary();
  ownExtensionEntries.value = (doc?.patterns ?? []).filter((entry) => !FACTORY_IDS.has(entry.id));
}

async function fetchTargetLibrary(name: string): Promise<void> {
  const doc = await loadTargetPatternLibrary(name);
  // Stale-guard — a locality flip mid-fetch discards the late resolve.
  if (targetScpName.value !== name) return;
  targetLibrary.value = doc;
}

// The locality-EDGE watch (the C898 face-watch idiom · SuiteColorSelection:131-134): Specified →
// seed the target's tiles + fetch its library; Local → restore the own tiles + drop the target doc.
watch(targetScpName, (next, prev) => {
  if (next === prev) return;
  reseedTiles();
  if (next) void fetchTargetLibrary(next);
  else targetLibrary.value = null;
});
// The chosen-pattern stamp watch — Specified-gated (SuiteColorSelection:137-141): a target
// hifiConfig advance (its own click, a foreign push, a direct JSON edit) re-seeds the tiles.
watch(targetHifiStamp, (next, prev) => {
  if (next === prev) return;
  if (!targetScpName.value) return;
  reseedTiles();
});
// D-PSVG · the LIBRARY stamp watch — Specified-gated: a target patternLibrary.json advance (a NEW
// pattern dropped for that locality) re-fetches the AVAILABLE entries so the picker surfaces it.
watch(targetPatternLibraryStamp, (next, prev) => {
  if (next === prev) return;
  const name = targetScpName.value;
  if (!name) return;
  void fetchTargetLibrary(name);
});
onMounted(() => {
  void fetchOwnLibrary();
  if (targetScpName.value) {
    reseedTiles();
    void fetchTargetLibrary(targetScpName.value);
  }
});

// ============================================================
// ORGAN 3 · THE α-FIREWALL SPECIFIED PUSH (SuiteColorSelection:146-177 mirrored)
// ============================================================
//
// Builds the deck-matched patterns Induction via the controller (never hand-rolled) and hands it
// to sendPatternsToTarget (the color transport's pattern leg). The α-FIREWALL: NO localStorage
// write (the α intent is for the OWN patterns only), NO own-window re-tile (the target re-tiles
// on ITS return). On settle: preview-coherence nudge + receipt re-seed.
function pushPatternsToTarget(scpName: string, full: Record<SpectrumName, string>): void {
  const build = scsBridgeController?.buildApplyHifiPatternsAction;
  if (!build) {
    console.warn('[SuitePatternSelection] no controller · cross-SCP injection skipped', { scp: scpName });
    return;
  }
  void sendPatternsToTarget(scpName, full, (patterns) => {
    const action = build(patterns);
    if (!action) {
      // No bound Muxium — a null action cannot be sent. Throw so the ephemeral send path reports
      // ws-error honestly rather than injecting an undefined frame (the color widget's discipline).
      throw new Error('[SuitePatternSelection] buildApplyHifiPatternsAction returned null (no bound Muxium)');
    }
    return action;
  }).then((result) => {
    console.log('[SuitePatternSelection] cross-SCP injection settled', result);
    // The preview coherence nudge — the push changed the TARGET's hifiConfig; a registered Pewter
    // preview refetches (SuiteColorSelection:170 · honest no-op where none is registered).
    scsBridgeController?.triggerTargetHifiPreviewRefresh();
    // THE RECEIPT RE-SEED — re-read the target's now-pushed patterns into the tiles so they
    // confirm the landed truth (a same-target push moves no watch — this closes that gap).
    reseedTiles();
  });
}

// ============================================================
// ORGAN 4 · THE LOCAL ROUND TRIP + THE FORK (SuiteColorSelection:179-223 mirrored)
// ============================================================

function onPatternChange(n: SpectrumName, id: string): void {
  selection[n] = id;
  const full: Record<SpectrumName, string> = { ...selection };
  // THE SPECIFIED FORK — a Specified locality names a TARGET → inject to the target's WS
  // (NO localStorage · NO own re-tile · the α-firewall). Local (null) → the own round-trip circuit.
  const target = targetScpName.value;
  if (target) {
    pushPatternsToTarget(target, full);
    return;
  }
  // (α) persist the intent to the user's OWN localStorage — NO re-tile here. The return's
  // precedence merge (localStorage < JSON) re-tiles their FRESH click, not their stale override.
  saveSuitePatternOverrides(full);
  // Dispatch the Client Induction — the round trip re-tiles on the RETURN broadcast
  // (setHifiConfigRelay → applyHifiConfigWithOverrides applies patterns · hifiConfig.model.ts:95),
  // not now. applySuitePatternOverrides is RETIRED from this click path.
  scsBridgeController?.applyHifiPatterns(full);
}

// Reset stays LOCAL (the color widget's onReset discipline · SuiteColorSelection:196-202): a
// distinct un-set op — clear the user's own overrides + restore the `:root` defaults (the model's
// removeProperty path). Never a foreign write.
function onReset(): void {
  clearSuitePatternOverrides();
  SPECTRUM_NAMES.forEach((n) => {
    selection[n] = DEFAULT_PATTERN[n];
  });
  activePicker.value = null;
}

// Which spectrum's thumbnail picker is open (single-panel toggle).
const activePicker = ref<SpectrumName | null>(null);
function togglePicker(n: SpectrumName): void {
  activePicker.value = activePicker.value === n ? null : n;
}
// Reset-one is a RE-SELECTION of the default — the same fork as any change
// (SuiteColorSelection:209-223): Specified → push to the target; Local → the own round trip.
function onResetOne(n: SpectrumName): void {
  selection[n] = DEFAULT_PATTERN[n];
  const full: Record<SpectrumName, string> = { ...selection };
  const target = targetScpName.value;
  if (target) {
    pushPatternsToTarget(target, full);
    return;
  }
  saveSuitePatternOverrides(full);
  scsBridgeController?.applyHifiPatterns(full);
}
</script>

<template>
  <section class="suite-patterns-root hifi-pane-base">
    <header class="suite-patterns-header">
      <div class="suite-patterns-title-row">
        <h2 class="hifi-heading suite-patterns-title">Suite Patterns</h2>
        <!-- ORGAN 1 · THE TARGET STAMP — the blue-voiced 'Lands on' pill, the color widget's
             classes reused verbatim (SuiteColorSelection:236-246 · the Pewter target voice). -->
        <span
          class="suite-colors-target-stamp"
          :class="targetScpName ? 'stamp--specified' : 'stamp--local'"
        >
          <span class="stamp-dot" aria-hidden="true"></span>
          <span v-if="targetScpName" class="stamp-text">
            Lands on <strong>{{ targetScpName }}</strong>
          </span>
          <span v-else class="stamp-text">
            Lands on {{ localScpName ?? 'this SCP' }}
          </span>
        </span>
      </div>
      <p class="suite-patterns-subtitle">
        Pick a texture for each Suite — the whole app re-tiles live and remembers across restart.
      </p>
    </header>

    <div class="suite-patterns-grid">
      <!-- C881 · WHOLE-CARD SELECT — the entire row is the control (not just the swatch tile). -->
      <button
        v-for="n in SPECTRUM_NAMES"
        :key="n"
        type="button"
        class="suite-pattern-row"
        :class="{ 'is-active': activePicker === n }"
        :aria-label="`Edit ${FUNCTIONAL_LABEL[n].name}`"
        @click="togglePicker(n)"
      >
        <!-- THE TILES-ONLY FORK (the color widget's swatch fork · SuiteColorSelection:264-270):
             Specified → the target-seeded id resolved through the TARGET's library css (an
             unresolvable id previews none; the caption names it); Local → var(--pattern-n)
             (the own paint — the round-trip law unchanged). -->
        <span
          class="suite-pattern-swatch-btn"
          :style="{
            backgroundColor: `var(--color-${n})`,
            backgroundImage: targetScpName ? patternCssFor(selection[n]) : `var(--pattern-${n})`,
          }"
        ></span>
        <span class="suite-pattern-label">
          <strong class="suite-pattern-name">{{ FUNCTIONAL_LABEL[n].name }}</strong>
          <span class="suite-pattern-designation">— {{ FUNCTIONAL_LABEL[n].designation }}</span>
          <span class="suite-pattern-current">{{ patternLabel(selection[n]) }}</span>
        </span>
      </button>
    </div>

    <SuitePatternPickerPanel
      v-if="activePicker"
      :suite="activePicker!"
      :model-value="selection[activePicker!]"
      :default-pattern="DEFAULT_PATTERN[activePicker!]"
      :has-custom-pattern="selection[activePicker!] !== DEFAULT_PATTERN[activePicker!]"
      :entries="availableEntries"
      @update:model-value="(id: string) => onPatternChange(activePicker!, id)"
      @reset="onResetOne(activePicker!)"
      @close="activePicker = null"
    />

    <div class="suite-patterns-actions">
      <button type="button" class="hifi-btn hifi-btn-red suite-patterns-reset" @click="onReset()">
        Reset
      </button>
    </div>
  </section>
</template>

<style scoped>
.suite-patterns-root {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 1rem 1.5rem 1.25rem;
}

.suite-patterns-header {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}
/* ORGAN 1 · the title row holds the heading + the target stamp on one line (the color widget's
   title-row shape · SuiteColorSelection). */
.suite-patterns-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  flex-wrap: wrap;
}
.suite-patterns-title {
  margin: 0;
}

/* ORGAN 1 · THE TARGET STAMP — the color widget's stamp styles reused class-for-class
   (SuiteColorSelection:327-369 · scoped styles do not cross components, so the block rides here
   verbatim under the SAME class names — one visual voice, two widgets). */
.suite-colors-target-stamp {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.22rem 0.6rem;
  border-radius: 0.35rem;
  font-family: var(--font-heading, 'Orbitron', sans-serif);
  font-size: 0.66rem;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  line-height: 1;
  white-space: nowrap;
}
.suite-colors-target-stamp .stamp-dot {
  width: 0.5rem;
  height: 0.5rem;
  border-radius: 50%;
  flex: 0 0 auto;
}
.suite-colors-target-stamp .stamp-text strong {
  font-weight: 700;
}
.suite-colors-target-stamp.stamp--local {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.12);
  color: rgba(255, 255, 255, 0.55);
}
.suite-colors-target-stamp.stamp--local .stamp-dot {
  background: rgba(255, 255, 255, 0.4);
}
.suite-colors-target-stamp.stamp--specified {
  background: color-mix(in srgb, var(--color-blue, #3b82f6) 16%, transparent);
  border: 1px solid var(--color-blue, #3b82f6);
  color: var(--color-blue-light, #93c5fd);
}
.suite-colors-target-stamp.stamp--specified .stamp-dot {
  background: var(--color-blue-light, #93c5fd);
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--color-blue, #3b82f6) 35%, transparent);
}

.suite-patterns-subtitle {
  margin: 0;
  font-size: 0.75rem;
  opacity: 0.65;
}

.suite-patterns-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 0.5rem;
}

.suite-pattern-row {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.4rem 0.6rem;
  border-radius: 0.3rem;
  background: rgba(0, 0, 0, 0.28);
  border-top:    1px solid rgba(255, 255, 255, 0.14);
  border-left:   1px solid rgba(255, 255, 255, 0.14);
  border-bottom: 1px solid rgba(0, 0, 0, 0.34);
  border-right:  1px solid rgba(0, 0, 0, 0.34);
}

.suite-pattern-swatch-btn {
  flex: 0 0 auto;
  width: 1.6rem;
  height: 1.6rem;
  padding: 0;
  border-radius: 0.25rem;
  border: 1px solid rgba(255, 255, 255, 0.25);
  cursor: pointer;
  background-repeat: repeat;
  background-size: 30px 30px;
  transition: box-shadow 0.12s;
}
.suite-pattern-swatch-btn:hover {
  box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.25);
}
.suite-pattern-row.is-active .suite-pattern-swatch-btn {
  box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.55);
}

.suite-pattern-label {
  display: flex;
  flex-direction: column;
  line-height: 1.2;
  min-width: 0;
}
.suite-pattern-name {
  font-family: var(--font-heading);
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.92);
}
.suite-pattern-designation {
  font-size: 0.68rem;
  opacity: 0.6;
}
.suite-pattern-current {
  font-size: 0.64rem;
  opacity: 0.45;
}

.suite-patterns-actions {
  display: flex;
  justify-content: flex-start;
}
.suite-patterns-reset {
  font-size: 0.78rem;
  padding: 0.45rem 1.1rem;
}

/* C881 · whole-card select — the row IS the button: reset chrome + point + hover lift. */
.suite-pattern-row {
  appearance: none;
  background: transparent;
  border: 1px solid transparent;
  font: inherit;
  color: inherit;
  text-align: left;
  width: 100%;
  cursor: pointer;
}
.suite-pattern-row:hover {
  border-color: rgba(234, 179, 8, 0.35);
  background: rgba(255, 255, 255, 0.03);
}
.suite-pattern-swatch-btn {
  pointer-events: none;
  display: inline-block;
}
</style>
