<script setup lang="ts">
/**
 * SuiteColorSelection.vue — HIFI.2 · the Suite Color Selection control (functional · in Settings)
 *
 * 8 per-spectrum color controls that re-tint the whole app live via the HIFI.1 runtime override
 * mechanism (`suiteColorOverride.model`) and persist across restart through localStorage.
 *
 * Each row is a swatch button + a spectrum label + a functional designation; clicking the swatch
 * opens the constrained in-DOM canvas picker (WIRE.2 · SuiteColorPickerPanel · hue band-clamped,
 * no native dialog).
 *
 * D-PCL · THE ROUND-TRIP COLOR CIRCUIT — On change the click NO LONGER paints. It (α) persists the new
 * hex to the user's OWN localStorage (intent · so the return's precedence merge paints their fresh
 * click, not their stale one) and dispatches the Client Induction (scsBridgeApplyHifiConfig) via the
 * scsBridge controller → the Huirth merge-writes hifiConfig.json → the RETURN broadcast (setHifiConfigRelay)
 * re-runs the boot precedence on EVERY client and re-tints. The visible color IS the receipt of the
 * truth — the clicking window paints no earlier than the rest. applySuiteColorOverrides is RETIRED from
 * the click path (it survives inside the return-apply · hifiConfig.model applyHifiConfigWithOverrides).
 * Reset stays local (clears the user's overrides + restores :root defaults · a distinct un-set op).
 *
 * Output Firewall: SPECTRUM names + FUNCTIONAL designations ONLY — no profession/cascade names,
 * no scare-quotes. The user picks colors; the cascade/profession semantics stay internal.
 */
import { reactive, ref, computed, watch, onMounted } from 'vue';
import {
  type SpectrumName,
  SPECTRUM_NAMES,
  loadSuiteColorOverrides,
  saveSuiteColorOverrides,
  clearSuiteColorOverrides,
} from '../../../../model/suiteColorOverride.model';
import { getGlobalScsBridgeController, SCS_BRIDGE_CONTROLLER_KEY } from '../../scsBridgeController';
import { inject } from 'vue';
import SuiteColorPickerPanel from './SuiteColorPickerPanel.vue';
// D-PXT · PXT-2 · the origin-blind cross-SCP color injection (the Specified-locality send path).
import { sendColorToTarget } from '../../../../model/crossScpColorInjection.model';
// C904 · LEG-B · THE TARGET-READ (read-coherence cure) — under a Specified locality the swatches must
// load the TARGET's CURRENT palette (the same US-3 read lane PewterLanding's preview uses), so the user
// sees + edits the TARGET's actual colors, not their own. Read-only twin of loadHifiConfig · raw target
// config (no own-override merge — that merge lives in applyHifiConfigUnderOverrides, a distinct path).
import { loadTargetHifiConfig } from '../../../../model/hifiConfig.model';

// D-PCL · the scsBridge controller carries the color click's Induction dispatch (applyHifiConfig).
// inject-first (Vue runtime-singleton) with the getGlobal fallback — the GitmTurnOver button idiom.
const scsBridgeController = inject(SCS_BRIDGE_CONTROLLER_KEY) ?? getGlobalScsBridgeController();

// D-PXT · PXT-2/PXT-3 · THE TARGET FACE — the controller-direct locality read (the PewterLanding idiom
// currentS8Locality.value?.specified). null = LOCAL (the own SCP · the D-PCL own-circuit dispatch);
// a name = SPECIFIED (a cross-SCP TARGET · the injection fork). The stamp (PXT-3) + the fork (PXT-2)
// both read THIS. The own SCP's name (for the quiet Local stamp) rides the same face's localScp.
const targetScpName = computed<string | null>(
  () => scsBridgeController?.currentS8Locality.value?.specified ?? null,
);
const localScpName = computed<string | null>(
  () => scsBridgeController?.currentS8Locality.value?.localScp ?? null,
);
// D-PFR · THE CHANGE-STAMP (Conference 1A) — the TARGET hifiConfig's mtimeMs riding the same
// face. On advance while Specified the swatches refetch the target's ACTUAL colors through the
// existing loadTargetHifiConfig lane (the colors never ride the snapshot) — every door lands
// here: the target's own click, a foreign push, a direct hifiConfig.json edit.
const targetHifiStamp = computed<number | null>(
  () => scsBridgeController?.currentS8Locality.value?.targetHifiStamp ?? null,
);

// The RD default hex per spectrum suite — the `:root` baseline a Reset restores to.
const DEFAULT_HEX: Record<SpectrumName, string> = {
  base: '#1a1a1a',
  red: '#ef4444',
  orange: '#f97316',
  yellow: '#eab308',
  green: '#22c55e',
  blue: '#3b82f6',
  purple: '#a855f7',
  fuchsia: '#ec4899',
};

// The spectrum label + functional designation per row (Output Firewall — no profession names).
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

// The live selection — saved overrides win over the RD defaults on setup.
const selection = reactive<Record<SpectrumName, string>>({
  ...DEFAULT_HEX,
  ...loadSuiteColorOverrides(),
});

// ============================================================
// C904 · LEG-B · THE SWATCH-SEEDING (the read-coherence cure the user named:
// "under a Specified locality the Suite Colors do not Change Based on that Configuration")
// ============================================================
//
// The swatch state is `selection`. LOCAL (targetScpName null) it holds the user's OWN palette
// (DEFAULT_HEX under localStorage overrides). SPECIFIED it must instead hold the TARGET's shipped
// palette so the user EDITS the target's actual colors (every onColorChange under a Specified locality
// injects `{ ...selection }` to the target — a stale-own seed would push the user's own colors, not the
// target's edited ones). The seed reads the SAME US-3 lane (loadTargetHifiConfig) PewterLanding's
// preview uses; a target hex fills its row, an absent hex falls to the RD default (Honest-Absence, never
// a silent own-color masquerade). Local resumes the user's OWN palette. Stale-safe: a flip mid-fetch
// discards the late resolve (the targetScpName guard).

function seedFromOwn(): void {
  const own = { ...DEFAULT_HEX, ...loadSuiteColorOverrides() };
  for (const n of SPECTRUM_NAMES) selection[n] = own[n];
}

async function seedFromTarget(name: string): Promise<void> {
  const cfg = await loadTargetHifiConfig(name);
  // Stale-guard — the locality may have flipped again while this fetch was in flight.
  if (targetScpName.value !== name) return;
  const colors = cfg?.colors ?? {};
  for (const n of SPECTRUM_NAMES) selection[n] = colors[n] ?? DEFAULT_HEX[n];
}

function reseedSwatches(): void {
  const name = targetScpName.value;
  if (name) void seedFromTarget(name);
  else seedFromOwn();
}

// C898 face-watch idiom (GraphiteScribeHomeLanding:373) — react on the locality EDGE only. Specified →
// load the target's palette into the swatches; Local → restore the own palette. immediate seeds the
// initial mount state (a page opened already under a Specified locality shows the target's colors).
watch(targetScpName, (next, prev) => {
  if (next === prev) return;
  reseedSwatches();
});
// D-PFR · Conference 1A — the stamp watch. R2-gated on the Specified state (Local stamp moves
// are the locality edge's business, handled above); reseedSwatches carries its own stale-guard.
watch(targetHifiStamp, (next, prev) => {
  if (next === prev) return;
  if (!targetScpName.value) return;
  reseedSwatches();
});
onMounted(() => {
  if (targetScpName.value) reseedSwatches();
});

// D-PXT · PXT-2 · THE INJECTION SEND — the origin-blind cross-SCP push. Builds the deck-matched
// Induction via the controller (never hand-rolled) and hands it to sendColorToTarget, which opens the
// ephemeral WS to the TARGET's port, injects the SAME action, and awaits the receipt (bounded). The
// α-FIREWALL: NO localStorage write (the α intent is for the OWN colors only), NO own-window paint
// (the target paints on ITS return). On settle (receipt anor timeout) fires PXT-4 preview coherence.
function pushColorToTarget(scpName: string, full: Record<SpectrumName, string>): void {
  const build = scsBridgeController?.buildApplyHifiConfigAction;
  if (!build) {
    console.warn('[SuiteColorSelection] no controller · cross-SCP injection skipped', { scp: scpName });
    return;
  }
  void sendColorToTarget(scpName, full, (colors) => {
    const action = build(colors);
    if (!action) {
      // No bound Muxium — sendColorToTarget still telemetries; a null action cannot be sent. Throw so
      // the ephemeral send path reports ws-error honestly rather than injecting an undefined frame.
      throw new Error('[SuiteColorSelection] buildApplyHifiConfigAction returned null (no bound Muxium)');
    }
    return action;
  }).then((result) => {
    console.log('[SuiteColorSelection] cross-SCP injection settled', result);
    // PXT-4 · THE PREVIEW COHERENCE — nudge Pewter's target-hifi refetch so the preview reflects the
    // pushed state (a same-target push does not change targetScpName, so the Pewter watch alone would
    // not re-fire). Honest no-op on a page with no preview registered.
    scsBridgeController?.triggerTargetHifiPreviewRefresh();
    // C904 · LEG-B · THE RECEIPT RE-SEED — the injection landed on the TARGET; re-read its now-pushed
    // hifiConfig into the swatches so they confirm the landed truth (a same-target push does not change
    // targetScpName, so the LEG-B watch alone would not re-fire — this closes that gap, the swatch twin
    // of the preview-coherence hook above).
    reseedSwatches();
  });
}

function onColorChange(n: SpectrumName, hex: string): void {
  selection[n] = hex;
  const full: Record<SpectrumName, string> = { ...selection };
  // D-PXT · THE SPECIFIED FORK — a Specified locality names a TARGET → inject to the target's WS
  // (NO localStorage · NO own paint · the α-firewall). Local (null) → the own D-PCL round-trip circuit.
  const target = targetScpName.value;
  if (target) {
    pushColorToTarget(target, full);
    return;
  }
  // D-PCL · (α) persist the intent to the user's OWN localStorage — NO paint here. This makes the
  // return's precedence merge (localStorage < JSON) paint their FRESH click, not their stale override.
  saveSuiteColorOverrides(full);
  // D-PCL · dispatch the Client Induction — the round trip paints on the RETURN broadcast, not now.
  scsBridgeController?.applyHifiConfig(full);
}

function onReset(): void {
  clearSuiteColorOverrides();
  SPECTRUM_NAMES.forEach((n) => {
    selection[n] = DEFAULT_HEX[n];
  });
  activePicker.value = null;
}

// WIRE.2 · which spectrum's constrained canvas picker is open (single-panel toggle).
const activePicker = ref<SpectrumName | null>(null);
function togglePicker(n: SpectrumName): void {
  activePicker.value = activePicker.value === n ? null : n;
}
function onResetOne(n: SpectrumName): void {
  selection[n] = DEFAULT_HEX[n];
  const full: Record<SpectrumName, string> = { ...selection };
  // D-PXT · THE SPECIFIED FORK — reset-one under a Specified locality is a re-selection of the RD
  // default pushed to the TARGET (same injection · α-firewall). Local → the own D-PCL circuit.
  const target = targetScpName.value;
  if (target) {
    pushColorToTarget(target, full);
    return;
  }
  // D-PCL · reset-one is a re-selection of the RD default — same round trip: persist intent (α),
  // dispatch the Induction, paint on the return. No local applySuiteColorOverrides.
  saveSuiteColorOverrides(full);
  scsBridgeController?.applyHifiConfig(full);
}
</script>

<template>
  <section class="suite-colors-root hifi-pane-base">
    <header class="suite-colors-header">
      <div class="suite-colors-title-row">
        <h2 class="hifi-heading suite-colors-title">Suite Colors</h2>
        <!-- D-PXT · PXT-3 · THE TARGET STAMP (Pewter's own design voice — the blue-accent target voice
             pewter-preview-source established, NOT Graphite's amber chip). Quiet/own-styled when LOCAL
             (names the own citizen); the blue alert accent naming the TARGET when SPECIFIED — informing
             which SCP the color change lands on. The GLW-stamp Diameter rendered through Pewter. -->
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
      <p class="suite-colors-subtitle">
        Pick the spectrum colors — the whole app re-tints live and remembers across restart.
      </p>
    </header>

    <div class="suite-colors-grid">
      <!-- C881 · WHOLE-CARD SELECT — the entire row is the control (not just the swatch tile). -->
      <button
        v-for="n in SPECTRUM_NAMES"
        :key="n"
        type="button"
        class="suite-color-row"
        :class="{ 'is-active': activePicker === n }"
        :aria-label="`Edit ${FUNCTIONAL_LABEL[n].name}`"
        @click="togglePicker(n)"
      >
        <!-- D-PFR · Conference 2A · THE TILES-ONLY FORK (the R2 gate absolute): Specified →
             selection[n] (the target-seeded truth + the 3A intent-immediate preview); Local →
             var(--color-n) (the own paint — the D-PCL round-trip law unchanged). -->
        <span
          class="suite-color-swatch-btn"
          :style="{ background: targetScpName ? selection[n] : `var(--color-${n})` }"
        ></span>
        <span class="suite-color-label">
          <strong class="suite-color-name">{{ FUNCTIONAL_LABEL[n].name }}</strong>
          <span class="suite-color-designation">— {{ FUNCTIONAL_LABEL[n].designation }}</span>
        </span>
      </button>
    </div>

    <!-- WIRE.2 · the constrained in-DOM canvas picker for the active spectrum (in-flow · no native
         dialog · resolves the off-screen GLSL-presenter escape · hand-off Item 2+3). -->
    <SuiteColorPickerPanel
      v-if="activePicker"
      :suite="activePicker!"
      :model-value="selection[activePicker!]"
      :default-color="DEFAULT_HEX[activePicker!]"
      :has-custom-color="selection[activePicker!] !== DEFAULT_HEX[activePicker!]"
      @update:model-value="(hex: string) => onColorChange(activePicker!, hex)"
      @reset="onResetOne(activePicker!)"
      @close="activePicker = null"
    />

    <div class="suite-colors-actions">
      <button type="button" class="hifi-btn hifi-btn-red suite-colors-reset" @click="onReset()">
        Reset
      </button>
    </div>
  </section>
</template>

<style scoped>
.suite-colors-root {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 1rem 1.5rem 1.25rem;
}

.suite-colors-header {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}
/* D-PXT · PXT-3 · the title row holds the heading + the target stamp on one line. */
.suite-colors-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  flex-wrap: wrap;
}
.suite-colors-title {
  margin: 0;
}

/* D-PXT · PXT-3 · THE TARGET STAMP — Pewter's design voice (the blue-accent target voice, matching
   pewter-preview-source's --color-blue-light · NOT Graphite's amber OBSERVING chip). A small pill with
   a status dot + a "Lands on <name>" clause, informing which SCP the color change lands on. */
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
/* LOCAL · quiet / own-styled — the muted ground voice (the own citizen · no alert). */
.suite-colors-target-stamp.stamp--local {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.12);
  color: rgba(255, 255, 255, 0.55);
}
.suite-colors-target-stamp.stamp--local .stamp-dot {
  background: rgba(255, 255, 255, 0.4);
}
/* SPECIFIED · the blue alert accent naming the TARGET — Pewter's confident target voice
   (--color-blue-light · the pewter-preview-source register), so the user READS that the change
   lands elsewhere. Opaque + accent-bordered = the moment carries weight. */
.suite-colors-target-stamp.stamp--specified {
  background: color-mix(in srgb, var(--color-blue, #3b82f6) 16%, transparent);
  border: 1px solid var(--color-blue, #3b82f6);
  color: var(--color-blue-light, #93c5fd);
}
.suite-colors-target-stamp.stamp--specified .stamp-dot {
  background: var(--color-blue-light, #93c5fd);
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--color-blue, #3b82f6) 35%, transparent);
}
.suite-colors-subtitle {
  margin: 0;
  font-size: 0.75rem;
  opacity: 0.65;
}

.suite-colors-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 0.5rem;
}

.suite-color-row {
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

.suite-color-swatch-btn {
  flex: 0 0 auto;
  width: 1.6rem;
  height: 1.6rem;
  padding: 0;
  border-radius: 0.25rem;
  border: 1px solid rgba(255, 255, 255, 0.25);
  cursor: pointer;
  transition: box-shadow 0.12s;
}
.suite-color-swatch-btn:hover {
  box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.25);
}
.suite-color-row.is-active .suite-color-swatch-btn {
  box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.55);
}

.suite-color-label {
  display: flex;
  flex-direction: column;
  line-height: 1.2;
  min-width: 0;
}
.suite-color-name {
  font-family: var(--font-heading);
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.92);
}
.suite-color-designation {
  font-size: 0.68rem;
  opacity: 0.6;
}

.suite-colors-actions {
  display: flex;
  justify-content: flex-start;
}
.suite-colors-reset {
  font-size: 0.78rem;
  padding: 0.45rem 1.1rem;
}

/* C881 · whole-card select — the row IS the button: reset chrome + point + hover lift. */
.suite-color-row {
  appearance: none;
  background: transparent;
  border: 1px solid transparent;
  font: inherit;
  color: inherit;
  text-align: left;
  width: 100%;
  cursor: pointer;
}
.suite-color-row:hover {
  border-color: rgba(234, 179, 8, 0.35);
  background: rgba(255, 255, 255, 0.03);
}
.suite-color-swatch-btn {
  pointer-events: none;
  display: inline-block;
}
</style>
