<script setup lang="ts">
/**
 * PewterLanding.vue — HIFI.3 · the Pewter Tessera page (Main/Sub triad)
 *
 * A dedicated Suite Color page. Main = the Suite Color Selection (reuse HIFI.2
 * SuiteColorSelection.vue) + a ShatteriteMenu header (Cadmium pattern · default
 * stage fallback) + the Shatterite Tome. WIRE.1 · SOE: the per-page Spawn Button is
 * RETIRED — the ShatteriteMenu header is now the origin of engagement and surfaces its
 * own Spawn + Anchor button when there is no live anchor (anchorSpawn 'prompt').
 * Sub = a components-preview gallery so the live re-tint is visible (one
 * .hifi-pane-{s} + each .hifi-btn-{s} + the .spectrum-bar, all spectrum-token-driven).
 *
 * P1 SPAWN-FIX · the page binds a Muxium (GitmLanding shape · empty page-concept array).
 * The spawn + engage dispatches ride the BASE scsBridge deck (BASE_CONCEPTS_CREATORS,
 * always composed at Tier-1 of ClientMuxiumDeck) — so the page needs NO page concept of its
 * own, only a bound Muxium so the universal scsBridgeController can dispatch. Without this
 * binding, triggerSpawnSuite8Session AND triggerEngageSession both !currentMuxium-guard →
 * silent return (the spawn / re-engage never fire). The sub-page selector stays a plain Vue
 * `ref` (Main/Sub); the color control still writes through the HIFI.1 documentElement override
 * (re-tints every island live · no extra wiring). The ShatteriteMenu + Tome resolve the page's
 * Anchor from the live sessionsList by suite8Name 'Pewter Tessera'; the menu owns spawn (SOE)
 * + re-engage via the universal scsBridge controller (now armed by this binding).
 *
 * Output Firewall: SPECTRUM names + FUNCTIONAL designations ONLY in user-facing
 * labels — no profession/cascade names, no scare-quotes.
 *
 * Reachability: registered in IslandWrapper.vue islandRegistry ('pewter' → this)
 * and vue.principle.ts REGISTERED_MUXONOMICS (pewterMuxonomic · nav entry /pewter).
 *
 * Citation: Suite8Landing.vue (Main/Sub v-if/v-else triad + SubPageNav idiom)
 * Citation: CadmiumLanding.vue:785 (<ShatteriteMenu :menu-stage> · default stage fallback)
 * Citation: CadmiumLanding.vue:452-471 / GitmLanding.vue:50-58 (GPIM · createClientMuxiumInstance + setMuxium)
 * Citation: ShatteriteMenu.vue (WIRE.1 · SOE · the menu owns Spawn + Anchor + re-engage)
 * Citation: ShatteriteTomeSetup.vue (STSC · :suite8Name + :sfsd setup feed)
 * Citation: SuiteColorSelection.vue (HIFI.2 · reused self-contained control)
 */
import { ref, computed, watch, markRaw, onMounted, onUnmounted } from 'vue';
import type { Muxium } from 'stratimux';
import type { MenuStage, MenuDocument } from '../../../model/shatteriteMenu.model';
import { EMPTY_MENU_STAGE, EMPTY_MENU_DOCUMENT } from '../../../model/shatteriteMenu.model';
// C870 · the live keyed Shatterite relay (Suite8HomeLanding parity — same component, same wiring).
import { createSuite8ClientConcept } from '../../suite8/suite8.concept.client';
import { suite8Muxonomic } from '../../suite8/suite8.muxonomy';
// SMSP · the Pewter design menu (Modify Suite Colors / Patterns · 'prime' Skill options).
import { PEWTER_DEFAULT_MENU_STAGE } from '../../../model/pewterDefaultMenu.model';
import { createClientMuxiumInstance, type ClientMuxiumDeck } from '../../client/client.muxonomy';
// GPIM · bind this landing's Muxium into the universal scsBridge controller so the
// ShatteriteMenu's Spawn (triggerSpawnSuite8Session) + re-engage (triggerEngageSession) dispatch.
import { getGlobalScsBridgeController } from '../../scsBridge/scsBridgeController';
import ShatteriteMenu from '../../suite8/vue/components/ShatteriteMenu.vue';
import SuiteColorSelection from '../../scsBridge/vue/components/SuiteColorSelection.vue';
import SuitePatternSelection from '../../scsBridge/vue/components/SuitePatternSelection.vue';
// MD-6 · D-BP-3 · the CARD subpage mounts the MD-5 Character-Forward Card for Pewter.
import Suite8Card from '../../vue/components/S8Card.vue';
import Suite8CascadeDocs from '../../suite8/vue/components/Suite8CascadeDocs.vue';
// MD-USP · US-3 · THE PAGE INDUCTION — Pewter becomes a registered standard S8 page (the #670 INDUCT
// gap). The LENT drawer (markRaw(Suite8ControlDrawer) · slot 4) seats the toolbar S8 button + Control
// panel; the s8-AXIS counter (S8_PAGE_COUNTER · slot 3) is the rename-proof shared axis value (C373 S8_
// law). Cross-concept imports to the suite8 concept — the SAME paths Suite8HomeLanding.vue:52,178 and
// CadmiumLanding.vue:70 walk (the wild-class precedent). Shape matches Suite8HomeLanding.vue:178 exactly.
import Suite8ControlDrawer from '../../suite8/vue/components/Suite8ControlDrawer.vue';
import { S8_PAGE_COUNTER } from '../../suite8/suite8.type';
// MD-USP · US-3 · THE PAGE-OWNED LOCALITY — the page's muxium is the page's, so the page arms the ONE
// locality subscription (V-4g) and publishes the shared S8LocalityFace every surface reads. Pewter's
// preview binding reads currentS8Locality.value?.specified (the target citizen's name) to drive the
// COLOR-locality adaptation. Held model import (s8LocalityPageOwner.model · Suite8HomeLanding.vue:52).
import { armS8LocalityPageOwner } from '../../../model/s8LocalityPageOwner.model';
// MD-USP · US-3 · THE COLOR-LOCALITY ADAPTATION — when a Specified locality names a target, Pewter's
// preview surfaces the TARGET citizen's shipped colors (the hifiConfig relay), NOT its documents. The
// by-name fetch is the read-only cross-SCP twin of the local /hifi-config boot-read.
import { loadTargetHifiConfig, type HifiConfig } from '../../../model/hifiConfig.model';
// MD-USP · US-3 · deriveVariants expands each target hex into the five HiFi variants (base/dark/light/
// fade/shadow · RD §6 law) — the SAME expansion applySuiteColorOverrides writes to documentElement, but
// here bound to a SCOPED wrapper element's inline style so the re-tint stays inside the preview surface.
import { deriveVariants } from '../../../model/suiteColorOverride.model';

// The page's Suite 8 designation — the literal Cascades/8_SUITES/<name>/ key the
// spawn-anchor + ShatteriteMenu + Tome all resolve against.
const PEWTER_SUITE_8_NAME = 'Pewter Tessera';

// ============================================================
// D-EF-0 · THE SUB-NAV STANDARDIZATION (one bar per island · Card LAST)
// The MD-6 biplane HOME|CARD wrapper is DISSOLVED into the island's OWN subnav: HOME's
// content WAS the Suite Colors surface, so 'main' (Suite Colors) is the honest first
// subpage. The single bar = Suite Colors · Preview · Card. The 'card' subpage mounts the
// MD-5 Suite8Card the biplane wrapper previously mounted.
// ============================================================
const pewterCardEntry = {
  name: PEWTER_SUITE_8_NAME,
  directoryPath: `Cascades/8_SUITES/${PEWTER_SUITE_8_NAME}`,
  description: 'HiFi design language · spectrum colors + patterns',
  color: '#9aa0a8',
};

// ============================================================
// SUB-PAGE SET (Suite Colors / Preview / Card · local-only selector · no Muxium)
// ============================================================

type PewterSubPage = 'main' | 'preview' | 'card';

interface PewterSubPageOption {
  value: PewterSubPage;
  label: string;
}

const SUB_PAGE_OPTIONS: PewterSubPageOption[] = [
  { value: 'main', label: 'Suite Colors' },
  { value: 'preview', label: 'Preview' },
  { value: 'card', label: 'Card' },
];

const activeSubPage = ref<PewterSubPage>('main');

function selectSubPage(value: PewterSubPage): void {
  activeSubPage.value = value;
}

// ============================================================
// MD-USP · US-3 · THE COLOR-LOCALITY ADAPTATION (preview binding · PREVIEW-ONLY · S4-V5 Seat 4 law)
// ============================================================
//
// When a Specified locality names a TARGET citizen (currentS8Locality.value.specified !== null), the
// preview surface adapts to show the TARGET's SHIPPED COLORS (the hifiConfig relay — NOT its documents;
// that is Pewter's transposition of the locality drawer's meaning). PREVIEW-ONLY, by the S4 ground's
// ruling: the target's colors render as SCOPED CSS custom properties on the preview WRAPPER element ONLY
// — documentElement is NEVER written from this path, so the user's OWN runtime overrides stand
// undisturbed (a user opens a locality to SEE, not to ADOPT). Honest-Absence: the fetch returning null
// (target offline / absent hifiConfig) shows a named "no color design" state, never a silent local
// masquerade. A locality FLIP anor CLEAR returns the preview to LOCAL (reactive · the watch below).

const SPECTRUM_NAMES = ['base', 'red', 'orange', 'yellow', 'green', 'blue', 'purple', 'fuchsia'] as const;

// The reactive target name — reads the shared locality face the page-owned owner publishes. null = LOCAL.
const targetScpName = computed<string | null>(
  () => getGlobalScsBridgeController()?.currentS8Locality.value?.specified ?? null,
);

// The fetched target design + the honest fetch state (idle | loading | loaded | absent).
const targetHifiConfig = ref<HifiConfig | null>(null);
const targetFetchState = ref<'idle' | 'loading' | 'loaded' | 'absent'>('idle');

// The preview surfaces the target's colors ONLY when a target is named AND its design loaded.
const previewIsTarget = computed<boolean>(() => targetScpName.value !== null && targetFetchState.value === 'loaded');

// SCOPED inline style: the target's colors expanded into the SAME CSS custom properties
// applySuiteColorOverrides writes (--color-{n} / -dark / -light / --fade-{n} / --shadow-{n} non-base),
// bound to the preview WRAPPER's :style so the grid inside re-tints from the wrapper scope alone. Empty
// object when LOCAL — the wrapper then inherits documentElement's :root (the user's own live tokens).
const previewOverrideStyle = computed<Record<string, string>>(() => {
  if (!previewIsTarget.value || !targetHifiConfig.value) return {};
  const style: Record<string, string> = {};
  const colors = targetHifiConfig.value.colors ?? {};
  for (const n of SPECTRUM_NAMES) {
    const hex = colors[n];
    if (!hex) continue;
    const v = deriveVariants(hex);
    style[`--color-${n}`] = v.base;
    style[`--color-${n}-dark`] = v.dark;
    style[`--color-${n}-light`] = v.light;
    style[`--fade-${n}`] = v.fade;
    if (n !== 'base') style[`--shadow-${n}`] = v.shadow;
  }
  return style;
});

// The by-name target-hifi fetch — extracted so BOTH the reactive watch (target CHANGE) and the D-PXT
// PXT-4 preview-coherence hook (a same-target color PUSH settling) can invoke it. Idempotent + stale-safe.
async function refetchTargetHifiConfig(): Promise<void> {
  const name = targetScpName.value;
  if (!name) {
    targetHifiConfig.value = null;
    targetFetchState.value = 'idle';
    return;
  }
  targetFetchState.value = 'loading';
  const cfg = await loadTargetHifiConfig(name);
  // Guard against a stale resolve — the target may have flipped again while this fetch was in flight.
  if (targetScpName.value !== name) return;
  targetHifiConfig.value = cfg;
  targetFetchState.value = cfg ? 'loaded' : 'absent';
}

// The reactive fetch: a locality flip anor clear re-runs this. null target → LOCAL (idle · no fetch).
watch(targetScpName, () => void refetchTargetHifiConfig(), { immediate: true });

// ============================================================
// SHATTERITE MENU (Cadmium pattern · default static stage fallback)
// ============================================================
//
// No live menu.json relay on this page yet — the menu renders its standing
// explainer (PEWTER_DEFAULT_STAGE) until/unless an Anchor instance authors a
// stage. menuStage stays EMPTY_MENU_STAGE (stageIndex -1) so defaultStage wins.

const menuStage = ref<MenuStage>(EMPTY_MENU_STAGE);
// C870 · the LIVE document — the N-watcher SMRP relay flows shatteriteMenus['Pewter Tessera']
// into here; the component's activeDoc prefers it over the mount floor (live advance · no refresh).
const menuDocument = ref<MenuDocument>(EMPTY_MENU_DOCUMENT);

// SMSP · the Pewter design menu (Modify Suite Colors / Patterns · 'prime' Skill options) is the
// standing default stage until/unless an Anchor instance authors a live menu.json stage.
const PEWTER_DEFAULT_STAGE: MenuStage = PEWTER_DEFAULT_MENU_STAGE;

function onMenuOption(payload: { label: string; kind: string; ok: boolean }): void {
  console.log('[PewterLanding] menu option selected', payload);
}

// WIRE.1 · SOE · the per-page Spawn Button is RETIRED. The ShatteriteMenu header above is now the
// origin of engagement: it reads this Suite 8's anchorSpawn mode + surfaces its own Spawn + Anchor
// button (or auto-fires on 'auto') when no live anchor exists — so the page no longer wires a spawn.

// ============================================================
// P1 SPAWN-FIX · MUXIUM BINDING (GPIM · GitmLanding shape · empty page-concept array)
// ============================================================
//
// The spawn (triggerSpawnSuite8Session) + re-engage (triggerEngageSession) dispatches both
// !currentMuxium-guard on the universal scsBridgeController → silent return when no Muxium is
// bound. PewterLanding previously held NONE, so the menu's Spawn + re-engage buttons dispatched
// into a warn-and-return. Bind a Muxium with an EMPTY page-concept array (GitmLanding precedent):
// the spawn/engage dispatches ride the BASE scsBridge deck (always composed at Tier-1 of
// ClientMuxiumDeck), so Pewter needs NO page concept of its own — only a bound Muxium. setMuxium
// is last-write-win; restored to the principle shim on unmount (setMuxium(null) + muxium.close()).

let muxium: Muxium<ClientMuxiumDeck> | null = null;
// MD-USP · US-3 · the page-owned locality subscription handle (armed after setMuxium, concluded on
// unmount) — Suite8HomeLanding.vue:260 shape exactly.
let localityOwner: { conclude: () => void } | null = null;

onMounted(() => {
  if (typeof window === 'undefined') return;

  // scsBridge is the universal base (BASE_CONCEPTS_CREATORS) — no page concepts needed; the spawn +
  // engage dispatches live on the base scsBridge deck (reached via mux.deck.d.client.d.scsBridge.e.*).
  // C870 · suite8 supplied as the muxonomic page concept — the keyed shatteriteMenus Record
  // (the SMRP relay target) must EXIST on this page muxium for live menu advance (the
  // refresh-required wound: the prior empty-concepts muxium had no relay state to read).
  muxium = createClientMuxiumInstance<ClientMuxiumDeck>(
    [{ concept: createSuite8ClientConcept(), muxonomy: suite8Muxonomic }],
    {
      title: 'PewterLanding',
      logging: true,
      storeDialog: true,
    },
  );

  // GPIM · bind this landing's Muxium into the universal scsBridge controller — arms BOTH the
  // ShatteriteMenu Spawn (triggerSpawnSuite8Session) AND the orphan-anchor re-engage
  // (triggerEngageSession). Without this, both controller triggers warn-and-return.
  const sbController = getGlobalScsBridgeController();
  if (sbController) sbController.setMuxium(muxium);

  // D-PXT · PXT-4 · THE PREVIEW COHERENCE — register Pewter's target-hifi refetch so a cross-SCP color
  // injection settling (SuiteColorSelection's Specified fork · the receipt anor bounded timeout) nudges
  // the preview to reflect the TARGET's now-pushed hifiConfig.json. A same-target push does not change
  // targetScpName, so the watch alone would not re-fire — this hook closes that gap.
  sbController?.registerTargetHifiPreviewRefresh(() => void refetchTargetHifiConfig());

  // MD-USP · US-3 · THE PAGE INDUCTION — register Pewter as the current standard S8 page (the #670
  // INDUCT gap cured): the toolbar S8 button + drawer appear (slot 4 = markRaw(Suite8ControlDrawer) ·
  // IslandWrapper.vue reads currentS8Page.value.drawer), the counter axis contributes (slot 3 =
  // S8_PAGE_COUNTER), the '0.0.0' version stamp is the frozen field the S8 face does not display.
  // Shape matches Suite8HomeLanding.vue:178 exactly.
  sbController?.registerCurrentS8Page(PEWTER_SUITE_8_NAME, '0.0.0', S8_PAGE_COUNTER, markRaw(Suite8ControlDrawer));

  // MD-USP · US-3 · THE PAGE-OWNED LOCALITY (V-4g) — the page's muxium was just created + bound, so the
  // page arms the ONE locality subscription (no bind race) and publishes the shared S8LocalityFace. The
  // preview binding reads currentS8Locality.value?.specified to drive the color-locality adaptation.
  // Suite8HomeLanding.vue:203 shape exactly.
  localityOwner = armS8LocalityPageOwner(muxium, PEWTER_SUITE_8_NAME);

  // C870 · BSSM parity (Suite8HomeLanding:393) — flow the keyed relay Record into the live ref.
  muxium.plan<ClientMuxiumDeck>(
    'pewterMenuStageSubscription',
    ({ staging, stage, d__ }) =>
      staging(() => [
        stage(
          ({ d }) => {
            const record = d.client.d.suite8.k.shatteriteMenus.select() as Record<string, MenuDocument>;
            menuDocument.value = record[PEWTER_SUITE_8_NAME] ?? EMPTY_MENU_DOCUMENT;
          },
          { selectors: [d__.client.d.suite8.k.shatteriteMenus] },
        ),
      ]),
  );
});

onUnmounted(() => {
  // MD-USP · US-3 · conclude the page-owned locality subscription + clear the current S8 page seat so
  // the toolbar S8 face + drawer fall away when leaving this page (Suite8HomeLanding.vue:263-265).
  localityOwner?.conclude();
  localityOwner = null;
  // D-PXT · PXT-4 · unregister the preview-coherence hook (the page leaves · no dangling refetch).
  getGlobalScsBridgeController()?.registerTargetHifiPreviewRefresh(null);
  getGlobalScsBridgeController()?.clearCurrentS8Page();
  // GPIM cleanup · unbind the controller from this landing's Muxium (restores the principle shim)
  // and close the page Muxium so it is not leaked across navigation (GitmLanding :100-106).
  const sbController = getGlobalScsBridgeController();
  if (sbController) sbController.setMuxium(null);
  if (muxium) muxium.close();
});

</script>

<template>
  <div class="pewter-landing">
    <header class="landing-header">
      <h1 class="hifi-heading spectrum-text">Pewter Tessera</h1>
      <p class="subtitle hifi-label">
        Pick the spectrum colors — the whole app re-tints live and remembers across restart.
      </p>
    </header>

    <!-- D-EF-0 · THE STANDARDIZED SUB-NAV (one bar · island subpages + Card LAST · biplane-tab pill) -->
    <nav class="pewter-subnav hifi-pane-base">
      <div class="biplane-tabs">
        <button
          v-for="opt in SUB_PAGE_OPTIONS"
          :key="opt.value"
          type="button"
          :class="[
            'biplane-tab',
            opt.value === 'card' ? 'tab--viridian' : 'tab--amethyst',
            { 'biplane-tab--active': activeSubPage === opt.value },
          ]"
          @click="selectSubPage(opt.value)"
        >
          {{ opt.label }}
        </button>
      </div>
    </nav>

    <!-- CARD SUBPAGE — the MD-5 Character-Forward Card for Pewter (now the LAST tab of the one bar) -->
    <main v-if="activeSubPage === 'card'" class="landing-content pewter-card-subpage">
      <Suite8Card :entry="pewterCardEntry" domain="HiFi" :compact="false" />
    </main>

    <template v-else>
    <!-- Suite Cascade Bar (spectrum-token-driven · re-tints live with the Main selection) -->
    <div class="spectrum-bar pewter-spectrum-bar" aria-hidden="true">
      <span class="spectrum-bar--red"></span>
      <span class="spectrum-bar--orange"></span>
      <span class="spectrum-bar--yellow"></span>
      <span class="spectrum-bar--green"></span>
      <span class="spectrum-bar--blue"></span>
      <span class="spectrum-bar--purple"></span>
      <span class="spectrum-bar--fuchsia"></span>
    </div>

    <main class="landing-content">
      <!-- MAIN · ShatteriteMenu header + Suite Color Selection + Spawn Button + Tome -->
      <section v-if="activeSubPage === 'main'" class="pewter-main">
        <!-- C868/C870 · the standardized Cascade Memory (Suite8CascadeDocs · collapsed by default ·
             own header) — present on EVERY Suite 8 page for consistency, functional anor not:
             Pewter's design cycles record onto its Diamond/Onyx tiers the same as any domain. -->
        <Suite8CascadeDocs designation="Pewter Tessera" />

        <ShatteriteMenu
          :menu-stage="menuStage"
          :menu-document="menuDocument"
          :suite8-name="PEWTER_SUITE_8_NAME"
          :default-stage="PEWTER_DEFAULT_STAGE"
          title="Pewter Tessera"
          @option-selected="onMenuOption"
        />

        <!-- The reused HIFI.2 control (self-contained — re-tints :root live) -->
        <SuiteColorSelection />

        <!-- The reused HIFI.3 control (self-contained — re-tiles :root patterns live) -->
        <SuitePatternSelection />

        <!-- WIRE.1 · SOE · the per-page Spawn Button is RETIRED — the ShatteriteMenu header above is
             now the origin of engagement and surfaces its own Spawn + Anchor button. -->

        <!-- C881 · PRUNED: the Setup Tome — the Shatterite menu's Skills are the engagement
             surface; the reserved palette-note field carried no live function. -->
      </section>

      <!-- SUB · components-preview gallery (re-tints live as the Main selection changes) -->
      <section v-else-if="activeSubPage === 'preview'" class="pewter-preview">
        <!-- MD-USP · US-3 · THE COLOR-LOCALITY SOURCE LABEL — honest about WHOSE colors the preview shows.
             LOCAL (no target) → the standing re-tint note; TARGET loaded → the target's shipped design;
             TARGET absent → the Honest-Absence "no color design" state (never a silent local masquerade). -->
        <p v-if="!targetScpName" class="pewter-preview-note hifi-label">
          Each pane + button reads the live spectrum tokens — change a color on the
          Suite Colors tab and watch every surface re-tint.
        </p>
        <p
          v-else-if="targetFetchState === 'loaded'"
          class="pewter-preview-note pewter-preview-source hifi-label"
        >
          Previewing {{ targetScpName }}'s shipped design — colors, not documents. Your own runtime
          colors are untouched.
        </p>
        <p
          v-else-if="targetFetchState === 'loading'"
          class="pewter-preview-note hifi-label"
        >
          Loading {{ targetScpName }}'s shipped design…
        </p>
        <p
          v-else
          class="pewter-preview-note pewter-preview-absent hifi-label"
        >
          No color design from {{ targetScpName }}.
        </p>

        <!-- MD-USP · US-3 · THE SCOPED PREVIEW WRAPPER — the target's colors apply as CSS custom
             properties on THIS element's :style ONLY (previewOverrideStyle); the grid inside re-tints
             from the wrapper scope. documentElement is never written — LOCAL colors persist outside. -->
        <div class="pewter-preview-scope" :style="previewOverrideStyle">
          <div class="pewter-preview-grid">
            <div
              v-for="s in SPECTRUM_NAMES"
              :key="s"
              :class="`hifi-pane-${s}`"
              class="pewter-preview-pane"
            >
              <h3 class="hifi-heading pewter-preview-title">{{ s }}</h3>
              <button type="button" :class="`hifi-btn hifi-btn-${s}`" class="pewter-preview-btn">
                {{ s }}
              </button>
            </div>
          </div>

          <!-- The full spectrum strip (the framing-chrome reference) -->
          <div class="spectrum-bar pewter-preview-spectrum" aria-hidden="true">
            <span class="spectrum-bar--red"></span>
            <span class="spectrum-bar--orange"></span>
            <span class="spectrum-bar--yellow"></span>
            <span class="spectrum-bar--green"></span>
            <span class="spectrum-bar--blue"></span>
            <span class="spectrum-bar--purple"></span>
            <span class="spectrum-bar--fuchsia"></span>
          </div>
        </div>
      </section>
    </main>
    </template>
  </div>
</template>

<style scoped>
/* D-EF-0 · the standardized one-bar subnav (biplane-tab pill idiom · shared across islands). */
.pewter-card-subpage {
  max-width: 560px;
  margin: 0 auto;
}

.pewter-landing {
  min-height: 100vh;
  padding: 2rem;
  color: var(--color-white-conductor, #f0f0f0);
}

.landing-header {
  text-align: center;
  margin-bottom: 1rem;
}
.landing-header h1 {
  font-size: 2rem;
  margin: 0 0 0.5rem;
}
.subtitle {
  color: var(--color-white-muted, #a0a0a8);
  font-size: 0.875rem;
}

.pewter-spectrum-bar {
  max-width: 900px;
  margin: 0 auto 1.5rem;
}

.landing-content {
  max-width: 900px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

/* D-EF-0 · the standardized one-bar subnav (biplane-tab pill idiom · Card LAST). */
.pewter-subnav {
  max-width: 900px;
  margin: 0 auto 1.25rem;
  border-radius: 0.5rem;
  padding: 0.6rem 0.9rem;
}
.pewter-subnav .biplane-tabs {
  display: flex;
  gap: 0.5rem;
}
.pewter-subnav .biplane-tab {
  font-family: var(--font-heading, 'Orbitron', sans-serif);
  font-weight: 600;
  font-size: 0.72rem;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  padding: 0.375rem 1.1rem;
  border-radius: 0.375rem;
  border: 1px solid rgba(0, 0, 0, 0.4);
  background: var(--color-board-dark, #1a1a2e);
  color: rgba(255, 255, 255, 0.55);
  cursor: pointer;
  transition: all 0.2s ease;
}
.pewter-subnav .tab--amethyst {
  --biplane-accent: var(--color-amethyst, #a855f7);
  --biplane-light: var(--color-amethyst-light, #c4b5fd);
}
.pewter-subnav .tab--viridian {
  --biplane-accent: var(--color-viridian, #10b981);
  --biplane-light: var(--color-viridian-light, #6ee7b7);
}
.pewter-subnav .biplane-tab:hover {
  border-color: var(--biplane-accent);
  color: rgba(255, 255, 255, 0.9);
}
.pewter-subnav .biplane-tab--active {
  background: var(--biplane-accent);
  color: var(--color-board-dark, #1a1a2e);
  border-color: var(--biplane-light);
}

.pewter-main {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.pewter-preview {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.pewter-preview-note {
  margin: 0;
  font-size: 0.8rem;
  opacity: 0.7;
}
/* MD-USP · US-3 · the color-locality source label — the target-loaded voice reads confident (opaque). */
.pewter-preview-source {
  opacity: 0.9;
  color: var(--color-blue-light, #93c5fd);
}
/* MD-USP · US-3 · the Honest-Absence state — the "no color design" voice reads muted + honest. */
.pewter-preview-absent {
  opacity: 0.9;
  color: var(--color-white-muted, #a0a0a8);
  font-style: italic;
}
/* MD-USP · US-3 · the scoped preview wrapper carries the target's CSS-var overrides (or none = LOCAL).
   A plain flow container — it re-tints only its own subtree; documentElement is never touched. */
.pewter-preview-scope {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.pewter-preview-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 0.75rem;
}
.pewter-preview-pane {
  border-radius: 8px;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.6rem;
}
.pewter-preview-title {
  margin: 0;
  font-size: 0.78rem;
  text-transform: capitalize;
  letter-spacing: 0.04em;
}
.pewter-preview-btn {
  font-size: 0.78rem;
  padding: 0.4rem 1rem;
  text-transform: capitalize;
}
.pewter-preview-spectrum {
  margin-top: 0.5rem;
}
</style>
