<script setup lang="ts">
/**
 * Suite8HomeLanding — Template Suite 8 Page (DSSLS · Domain-Scoped SCP Landing Scaffold)
 *
 * The pared-down Cadmium homepage shape. This is the page the install Opus adapts
 * (S9-DomainPageCreate + S10-HomePageAdapt) into the user's domain Suite 8 as the
 * SCP HOME PAGE. The Cadmium research-pipeline machinery (bulletins, topics, sweep,
 * dispatch) has been removed — what remains is the three-zone scaffold any domain
 * Suite 8 can claim by filling the ADAPT markers below:
 *
 *   Zone 1 · DOMAIN HEADER       — the Suite 8 name + one-line identity (hifi-pane · suite-tier)
 *   Zone 2 · SSMC                — ScsBridgeSessionManagement (mode=specific · suite8Name)
 *   Zone 3 · DOMAIN WORK SURFACE — a clearly-delimited section the Opus fills in minutes
 *
 * The install Opus edits the `ADAPT:` markers on the fly: it reads the user's domain
 * from their muxified Cascades/8_SUITES/{name}/Instance.md identity, writes the domain
 * name + tagline, binds the SSMC suite8Name, and fills the work surface. Then it flips
 * `isMainLanding: true` (SAMLS) so this page becomes the SCP's `/` route.
 *
 * Patterns: DSSLS · SSMC · SAMLS · CACB
 * Citation: TU-ARC-S2-ORANGE-NAMING.md (DSSLS · SSMC · SAMLS) · TU-ARC-S1-RED-CURATION.md §4 (ISMC)
 * Reference model: CadmiumLanding.vue (the populated domain page this scaffold pares down)
 */
import { ref, computed, markRaw, onMounted, onUnmounted } from 'vue';
import type { Muxium } from 'stratimux';
import { createClientMuxiumInstance, type ClientMuxiumDeck } from '../../client/client.muxonomy';
// IUPA · the suite8 CLIENT concept supplies this landing's page Muxium (mirrors CadmiumLanding
// supplying createCadmiumClientConcept). The SSMC's GPIM controller binding needs a live Muxium.
import { createSuite8ClientConcept } from '../suite8.concept.client';
import { suite8Muxonomic } from '../suite8.muxonomy';
// SSMC · the importable Session Management component (mode=specific · suite8Name) — the SAME
// import + props CadmiumLanding.vue:37 uses. This binds the session list to the domain Suite 8.
import ScsBridgeSessionManagement from '../../scsBridge/vue/components/ScsBridgeSessionManagement.vue';
// GPIM · Vue-layer Muxium binding into the universal scsBridge controller (the SSMC reads its
// bridgeJson + sessionsList shallowRefs through this controller).
import { getGlobalScsBridgeController } from '../../scsBridge/scsBridgeController';
// GTMS8C · the FS-parsed Base Cascade Menu — the shared MenuStage contract + the generic menu
// component (the renderer · carries its OWN anchor-alive guard internally · S4 Risk-2).
import type { MenuStage, MenuDocument } from '../../../model/shatteriteMenu.model';
import { EMPTY_MENU_STAGE, EMPTY_MENU_DOCUMENT } from '../../../model/shatteriteMenu.model';
import ShatteriteMenu from './components/ShatteriteMenu.vue';
// IE-D4 · CREATE-S8 DYNAMIC LINKAGE · the LIVE D-O widget (the generic Suite8CascadeDocs · reads THIS
// designation's Cascades/Extended/<name>/ pair from the Tier-2 suiteCascade cascades Record · page-
// editable plan + session-written trajectory + tier menu). Replaces the prop-fed SuiteCascadeDiamondOnyxPane
// at the ZONE 1 WTO Triptych RI-widget seat — the lowest-diff live seat. Leads the triptych (1st · context).
import Suite8CascadeDocs from './components/Suite8CascadeDocs.vue';
// PRE-EPOCH · decision 5 · the MINIMAL default standing menu (spawn-anchor row + documentation row).
import { SUITE8_DEFAULT_MENU_STAGE } from '../model/suite8DefaultMenu.model';
// W3 · THE ONE-BAR SUBNAV (D-EF-0) · the Card subpage mounts the Suite8Card by this page's display name.
import type { Suite8Entry } from '../suite8.type';
import { S8_PAGE_VERSION } from '../suite8.type';
import { armS8LocalityPageOwner } from '../../../model/s8LocalityPageOwner.model';
// V-4b · THE LENT DRAWER — this page lends its OWN Control drawer to the toolbar seat (in a
// minted twin the rename converts this to the twin's drawer, which reads the twin's own slice).
import Suite8ControlDrawer from './components/Suite8ControlDrawer.vue';
import Suite8Card from '../../vue/components/S8Card.vue';
// EF-3' · 4A · THE PANE PRUNE — the inline Forge pane folded into Suite8Control SIV
// (the door · the model select · the previous conductions · the engage all live THERE now).

// ============================================================
// ADAPT: DOMAIN IDENTITY
// The install Opus fills these two refs from the user's muxified Instance.md identity.
// `suite8Name` MUST byte-match the Suite 8 directory name (Cascades/8_SUITES/{name}/) so the
// SSMC mode=specific filter narrows the session list to THIS domain's sessions.
// ============================================================
// ADAPT: replace 'Your Domain' with the user's Suite 8 designation (from Instance.md Designation).
const domainName = ref<string>('Your Domain');
// ADAPT: replace with the user's one-line domain identity (from Instance.md Identity / tagline).
const domainTagline = ref<string>(
  'Your project, now a first-class Suite 8 within the Stratidian Manifold.',
);
// ADAPT: set this to the EXACT Cascades/8_SUITES/{name}/ directory name so SSMC filters correctly.
const suite8Name = ref<string>('Your Domain');

// SSMC · reactive reads from the global scsBridge controller (shallowRefs · same idiom as
// CadmiumLanding bridgeJsonForSm / sessionsListForSm). computed() re-reads on every change.
const bridgeJsonForSm = computed(() => getGlobalScsBridgeController()?.bridgeJson.value ?? null);
const sessionsListForSm = computed(() => getGlobalScsBridgeController()?.sessionsList.value ?? []);

// PRE-EPOCH · BSSM · the live keyed per-designation Shatterite Menu stage for THIS page's
// designation. The N-watcher SMRP relay flows shatteriteMenus[suite8Name] into here; absent a live
// stage it stays EMPTY_MENU_STAGE and ShatteriteMenu renders the SUITE8_DEFAULT_MENU_STAGE
// (passed as :default-stage · decision 5). The scalar `menuStage` slot is superseded for the page
// render by this keyed read (the scalar pipe remains for backward-compat in the concept).
// C766 · STAGED — the keyed Record now carries the WHOLE MenuDocument; the page holds the
// document and the component owns presentation/navigation/persistence.
const menuDocument = ref<MenuDocument>(EMPTY_MENU_DOCUMENT);

// PRE-EPOCH · WTO triptych · the RI widget content (loadedDiamondContent / loadedOnyxContent from the
// suite8 state · populated by D4 Diametric reads · empty at first render → the pane shows its built-in
// empty state · S6 composition gap note). Passed `|| null` so the pane's bothNull branch renders.
const loadedDiamondContent = ref<string>('');
const loadedOnyxContent = ref<string>('');

// ============================================================
// W3 · THE ONE-BAR SUBNAV (D-EF-0) — Home · Card. Home = the current island contents (the RI
// widget + the Forge menu + the Shatterite Menu + the Session Manager); Card = the Suite8Card
// mounted by THIS page's display name (the biplane-tab idiom · Suite8Biplane's HOME|CARD standard).
// ============================================================
type HomeTab = 'home' | 'card';
const activeTab = ref<HomeTab>('home');

// W3 · THE CARD ENTRY — a minimal Suite8Entry keyed on THIS page's display name (suite8Name). The
// local-roster fetch below fills its snippet + color; before it resolves the Card renders the name
// with the base placeholder (never a broken surface). Suite8Card consumes {entry, domain, snippet}.
const selfSnippet = ref<string>('');
const cardEntry = computed<Suite8Entry>(() => ({
  name: suite8Name.value,
  directoryPath: `Cascades/8_SUITES/${suite8Name.value}`,
  description: selfSnippet.value.length > 0 ? selfSnippet.value : 'Suite 8',
  color: '#9aa0a8',
}));

// ============================================================
// W2 · THE FORGE PREDICATE — the generated page knows its own 8_SUITES dir name (suite8Name · the
// display-name binding). Fetch THIS SCP's local-roster and read the entry matching suite8Name for
// its isUnactualized flag (the Suite8Landing idiom · the raw Instance.md still carries the scaffold's
// '**Domain**: TBD'). true → the Forge menu shows at the TOP of Home; the Forge writes the real
// Domain → the next roster load flips this false → the menu SELF-CLEARS (dissolving-once-set).
// ============================================================
// W1 · THE FORGE PREDICATE (robust) — a GENERATED page is un-forged by construction: its concept
// was minted by `suite8:page` but NO Cascades/8_SUITES/{display-name}/ scaffold exists yet, so THIS
// page's own roster self-entry is ABSENT. Absence IS the forgeable signal (alongside the explicit
// '**Domain**: TBD' mark on a scaffold that DOES exist). The predicate is therefore: show the launch
// UNLESS a real self-entry resolves that is NOT unactualized. The launch SELF-CLEARS only once the
// Forge writes a real Instance.md whose roster entry reports isUnactualized === false.
//
// C370-B · RENAME-PROOF ROUTE: the roster fetch uses /s8/local-roster (the `s8` string carries no
// `suite8`/`Suite8` token, so `suite8:page`'s copy-move-rename can NEVER rewrite it) — a GENERATED
// page now reads a WORKING roster keyed by its DISPLAY name (suite8Name · the 8_SUITES dir). The
// forge predicate therefore self-clears honestly once the Forge writes the real Instance.md.
// HONEST-FETCH GUARD (belt-and-braces): should any prefix ever go unrouted, the SPA HTML fallback
// returns 200 + '<!DOCTYPE html>'. We treat a non-array / HTML body as ABSENT (never parse the SPA
// shell as data) → the launch shows (the SAFE side · the page is un-forged). Only a genuine JSON
// array with a self-entry that reports isUnactualized === false can flip the launch off.
const isUnactualized = ref<boolean>(true);

async function refreshSelfForgeState(): Promise<void> {
  try {
    const r = await fetch('/s8/local-roster', { headers: { Accept: 'application/json' } });
    if (!r.ok) return; // route present but errored → keep the default (launch shows · un-forged)
    const ct = (r.headers.get('content-type') ?? '').toLowerCase();
    const body = await r.text();
    // SPA fallback / non-JSON → NOT a roster (the renamed route is unrouted on a generated page).
    if (!ct.includes('json') && /^\s*<(?:!doctype|html)/i.test(body)) return;
    let entries: Array<{ name: string; snippet?: string; isUnactualized?: boolean }>;
    try {
      entries = JSON.parse(body);
    } catch {
      return; // unparseable → absent → keep the launch (un-forged).
    }
    if (!Array.isArray(entries)) return;
    const self = entries.find((e) => e.name === suite8Name.value);
    if (self) {
      // A real self-entry resolved: honor its forge state (TBD mark → still forgeable).
      isUnactualized.value = self.isUnactualized === true;
      selfSnippet.value = (self.snippet ?? '').trim();
    }
    // No self-entry → generated-but-unforged → keep isUnactualized = true (the launch shows).
  } catch {
    /* offline / SSR-guard — keep the default (the launch shows; the Forge is the only build path). */
  }
}

// WIRE.1 · SOE · the anchor-spawn PROMPT is now owned by the ShatteriteMenu (the origin of
// engagement) — it reads this Suite 8's anchorSpawn mode itself in onMounted and surfaces its own
// Spawn + Anchor button when there is no live anchor. The page no longer renders a spawn-prompt row
// nor reads anchorSpawnMode here. The PPOL poll below KEEPS its alive→focus / offline→engage branches
// (page-load convenience) but DEFERS first-run spawn entirely to the menu (no page-level spawn).

let muxium: Muxium<ClientMuxiumDeck> | null = null;

onMounted(() => {
  // V-2 · register this page's designation + frozen version into the shared controller seat
  // (the toolbar's presence predicate + the V-5 update detection read THIS).
  getGlobalScsBridgeController()?.registerCurrentS8Page(suite8Name.value, S8_PAGE_VERSION, markRaw(Suite8ControlDrawer));
  if (typeof window === 'undefined') return;

  // C376 · THE MOUNT STAMP — the relay's proof of WHICH build the window is running.
  console.log('[Suite8HomeLanding] mounted · build=C376-pointerfix-clickprobe');

  // IUPA · this landing supplies suite8 as the muxonomic page concept (the SSMC controller
  // binding needs a live Muxium; the domain work surface can dispatch into it once adapted).
  muxium = createClientMuxiumInstance<ClientMuxiumDeck>(
    [{ concept: createSuite8ClientConcept(), muxonomy: suite8Muxonomic }],
    {
      title: 'Suite8HomeLanding',
      logging: true,
      storeDialog: true,
    },
  );

  // GPIM · bind this landing's Muxium into the universal scsBridge controller (so the SSMC's
  // spawn/engage/focus actions route through it · mirrors CadmiumLanding onMounted).
  const sbController = getGlobalScsBridgeController();
  if (sbController) sbController.setMuxium(muxium);

  // V-4g · THE PAGE-OWNED LOCALITY — the page's muxium is created HERE, so the page arms
  // the ONE locality subscription (no bind race) and publishes the shared face every
  // surface reads; the drawer panel is a reader+writer, never an owner.
  localityOwner = armS8LocalityPageOwner(muxium, suite8Name.value);

  // ============================================================
  // ADAPT: DOMAIN WORK SURFACE — onMounted wiring
  // If the domain work surface needs live state, add the stage-planner subscription here
  // (mirror CadmiumLanding's `muxium.plan(...)` + `d.client.d.suite8.k.<prop>.select()` reads).
  // The scaffold ships with a static work surface; wire reactive state only when the domain needs it.
  // ============================================================

  // PRE-EPOCH · BSSM · subscribe the page muxium's keyed shatteriteMenus Record + the RI widget
  // content into reactive refs. The N-watcher SMRP relay dispatches suite8SetDesignationMenuStage into
  // this page muxium; the selector flows the keyed Record in, and we read THIS page's designation key
  // (suite8Name), falling back to EMPTY_MENU_STAGE (the default menu is supplied via :default-stage).
  // loadedDiamondContent / loadedOnyxContent feed the WTO RI widget (Tier-2 page-muxium reach · suite8
  // is mounted under client). Mirrors the cadmiumLandingSubscription staging/stage/d__ shape.
  muxium.plan<ClientMuxiumDeck>(
    'suite8MenuStageSubscription',
    ({ staging, stage, d__ }) =>
      staging(() => [
        stage(
          ({ d }) => {
            const record = d.client.d.suite8.k.shatteriteMenus.select() as Record<string, MenuDocument>;
            menuDocument.value = record[suite8Name.value] ?? EMPTY_MENU_DOCUMENT;
            loadedDiamondContent.value = d.client.d.suite8.k.loadedDiamondContent.select() as string;
            loadedOnyxContent.value = d.client.d.suite8.k.loadedOnyxContent.select() as string;
          },
          {
            selectors: [
              d__.client.d.suite8.k.shatteriteMenus,
              d__.client.d.suite8.k.loadedDiamondContent,
              d__.client.d.suite8.k.loadedOnyxContent,
            ],
          },
        ),
      ]),
  );

  // GTMS8C · PPOL+PAOLRP · Persistent Spawn-on-Page-Load. One-shot plan; the settle poll
  // (alive→focus · offline→engage · absent-after-3s→defer-to-menu) keyed on isAnchor. The poll runs in
  // a setInterval (macrotask · PPOL-WUD safe · NOT a plan selector · #616 recursion guard). 250ms/3000ms.
  // The designation source is the suite8Name ref (the ADAPT marker · Design Decision 3) — the SSMC
  // filter, this PAOLRP, and the ShatteriteMenu anchor-lookup ALL read suite8Name (W3-A).
  //
  // WIRE.1 · SOE · first-run spawn is now the ShatteriteMenu's responsibility (the origin of
  // engagement reads anchorSpawn mode + surfaces its own Spawn + Anchor button / auto-fires on 'auto').
  // The page PPOL therefore only handles the convenience branches for an EXISTING page anchor
  // (alive→focus · offline→engage) and DEFERS the no-anchor first-run case to the menu (no-op here).
  // C489 · THE PAGE CARRIES NOTHING (Cadmium parity): the ShatteriteMenu owns the anchor
  // lifecycle entirely (the one switch · the visit tombstone · the authority). The legacy
  // page-side PPOL is erased.

  // W2 · seed the Forge predicate + the Card snippet from THIS SCP's OWN local-roster (keyed by
  // suite8Name). Runs once on mount; the Forge menu shows only while isUnactualized === true.
  void refreshSelfForgeState();

});

let localityOwner: { conclude: () => void } | null = null;

onUnmounted(() => {
  localityOwner?.conclude();
  localityOwner = null;
  getGlobalScsBridgeController()?.clearCurrentS8Page();
  // GPIM cleanup · unbind controller from this landing's Muxium (mirror CadmiumLanding onUnmounted).
  const sbController = getGlobalScsBridgeController();
  if (sbController) sbController.setMuxium(null);
  // muxium.close() concludes the menuStage subscription plan (and all page plans) too.
  if (muxium) muxium.close();
});
</script>

<template>
  <div class="domain-landing">
    <!-- ============================================================
         ZONE 1 · DOMAIN HEADER
         ADAPT: the hifi-pane-base neutral pane can become any suite tier — swap to
         hifi-pane-cobalt / hifi-pane-viridian / hifi-pane-orange etc. to match the
         user's chosen Suite 8 color (the muxonomy `color` field · S10 sets it).
         ============================================================ -->
    <header class="domain-header hifi-pane-base">
      <!-- ADAPT: domainName renders the Suite 8 designation. spectrum-text is neutral;
           swap for a suite-tier text-shadow class once the color is chosen. -->
      <h1 class="hifi-heading spectrum-text">{{ domainName }}</h1>
      <p class="domain-tagline hifi-label">{{ domainTagline }}</p>
    </header>

    <!-- ============================================================
         W3 · THE ONE-BAR SUBNAV (D-EF-0) — Home · Card. Home = the current island contents (RI
         widget + Forge menu + Shatterite Menu + Session Manager); Card = the Suite8Card by display
         name (the biplane-tab idiom · Suite8Biplane HOME|CARD standard).
         ============================================================ -->
    <nav class="domain-subnav hifi-pane-base">
      <button
        type="button"
        :class="['subnav-tab', 'tab-btn--amethyst', { 'subnav-tab--active': activeTab === 'home' }]"
        @click="activeTab = 'home'"
      >
        Home
      </button>
      <button
        type="button"
        :class="['subnav-tab', 'tab-btn--viridian', { 'subnav-tab--active': activeTab === 'card' }]"
        @click="activeTab = 'card'"
      >
        Card
      </button>
    </nav>

    <!-- ===================== HOME SUBPAGE ===================== -->
    <main v-if="activeTab === 'home'" class="domain-content">
      <!-- ============================================================
           IE-D4 · WTO TRIPTYCH · ZONE 1 (1st) · the LIVE RI widget — Suite8CascadeDocs.
           Leads the triptych (context-first · user-binding order RI → Menu → Session Manager ·
           decision 4). Reads THIS designation's Cascades/Extended/<suite8Name>/ Diamond+Onyx pair
           LIVE from the Tier-2 suiteCascade cascades Record (the extended auto-registration circuit) ·
           the plan pane is page-editable (/suite8-doc-save · DIAMOND-only) · the trajectory pane is
           session-written · the tier menu enumerates priors without loading. Replaces the prop-fed
           SuiteCascadeDiamondOnyxPane (the empty-slot placeholder) with the live two-pane surface.
           ============================================================ -->
      <Suite8CascadeDocs :designation="suite8Name" />

      <!-- ============================================================
           PRE-EPOCH · WTO TRIPTYCH · ZONE 2 (2nd) · the Shatterite Menu. ShatteriteMenu carries the
           MANDATORY anchor-alive guard INTERNALLY (optionsEnabled gates dispatch on a live anchor ·
           S4 Risk-2) — so the menu can safely LEAD the Session Manager visually without blocking on
           session confirmation (decision 4 · the guard makes the order safe). :menu-stage is the
           live keyed relay state (shatteriteMenus[suite8Name]); :default-stage is the MINIMAL default
           menu (decision 5) the component renders when no live stage exists; :suite8-name binds the
           anchor lookup to the SAME designation the SSMC + PAOLRP use.

           WIRE.1 · SOE · the spawn-anchor PROMPT now lives INSIDE the ShatteriteMenu (the origin of
           engagement): with no live anchor + anchorSpawn 'prompt' the menu surfaces its own Spawn +
           Anchor button; the page no longer renders a separate spawn-prompt row.
           ============================================================ -->
      <!-- V-4 · THE PAGE PRUNE — the inline Suite8Control mount retired; the S8 toolbar
           drawer is the sole Control surface (presence-predicated on this page's
           registerCurrentS8Page). -->
      <div class="domain-menu-zone">
        <ShatteriteMenu
          :menu-stage="EMPTY_MENU_STAGE"
          :menu-document="menuDocument"
          :default-stage="SUITE8_DEFAULT_MENU_STAGE"
          :suite8-name="suite8Name"
          title="Base Cascade Menu"
        />
      </div>

      <!-- ============================================================
           PRE-EPOCH · WTO TRIPTYCH · ZONE 3 (3rd) · SSMC · Suite-8-Scoped Session Management
           (mode=specific). bridgeJson + sessionsList resolve from the global controller shallowRefs.
           ADAPT: suite8Name is already bound to the domain ref above — no edit needed here
           UNLESS the domain Suite 8 directory name differs from domainName.
           ============================================================ -->
      <ScsBridgeSessionManagement
        :bridge-json="bridgeJsonForSm"
        :sessions-list="sessionsListForSm"
        :mode="'specific'"
        :s8-name="suite8Name"
      />
      <!-- W2 · THE DOMAIN WORK SURFACE (the boilerplate placeholder + scaffold hints) is PRUNED. Its
           build-out is now orchestrated through the Entourage Forge (the Forge menu at the TOP of
           Home · shown while unactualized). The adapted domain surface arrives via the Forge, not a
           hand-filled placeholder. -->
    </main>

    <!-- ===================== CARD SUBPAGE ===================== -->
    <main v-else class="domain-content domain-card-page">
      <!-- W3 · THE CARD — the Suite8Card mounted by THIS page's display name (the biplane CARD tab). -->
      <Suite8Card
        :key="cardEntry.name"
        :entry="cardEntry"
        :domain="selfSnippet"
        :snippet="selfSnippet"
        :compact="false"
      />
    </main>
  </div>
</template>

<style scoped>
.domain-landing {
  min-height: 100vh;
  padding: 2rem;
  color: var(--color-white-conductor, #f0f0f0);
  font-family: system-ui, -apple-system, sans-serif;
}

.domain-header {
  text-align: center;
  margin: 0 auto 2rem;
  max-width: 1000px;
  border-radius: 8px;
  padding: 1.5rem;
}

.domain-header h1 {
  font-size: 2rem;
  margin: 0 0 0.5rem;
}

.domain-tagline {
  color: var(--color-white-muted, #a0a0a8);
  font-size: 0.95rem;
  margin: 0;
}

.domain-content {
  max-width: 1000px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.domain-menu-zone {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

/* ============================================================
   W3 · THE ONE-BAR SUBNAV (D-EF-0) — the same-page tab idiom (Suite8Biplane bearing · zero raw hex).
   ============================================================ */
.domain-subnav {
  display: flex;
  gap: 0.5rem;
  max-width: 1000px;
  margin: 0 auto 1.5rem;
  border-radius: 0.5rem;
  padding: 0.6rem 0.9rem;
}

.subnav-tab {
  font-family: var(--font-heading, 'Orbitron', sans-serif);
  font-weight: 600;
  font-size: 0.72rem;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  padding: 0.375rem 1.1rem;
  border-radius: 0.375rem;
  border: 1px solid var(--tab-dark, rgba(0, 0, 0, 0.4));
  background: var(--color-board-dark, #1a1a2e);
  color: rgba(255, 255, 255, 0.55);
  cursor: pointer;
  transition: all 0.2s ease;
}

.tab-btn--amethyst {
  --tab-accent: var(--color-amethyst, #a855f7);
  --tab-dark: var(--color-amethyst-dark, #6b21a8);
  --tab-light: var(--color-amethyst-light, #c4b5fd);
}
.tab-btn--viridian {
  --tab-accent: var(--color-viridian, #10b981);
  --tab-dark: var(--color-viridian-dark, #065f46);
  --tab-light: var(--color-viridian-light, #6ee7b7);
}

.subnav-tab:hover {
  border-color: var(--tab-accent);
  color: rgba(255, 255, 255, 0.9);
}

.subnav-tab--active {
  background: var(--tab-accent);
  color: var(--color-board-dark, #1a1a2e);
  border-color: var(--tab-light);
}

.domain-card-page {
  max-width: 560px;
}

/* ============================================================
   W1 · THE PRISMATIC FORGE LAUNCH — a HiFi PRISMATIC variant of the Shatterite Menu pane. The
   .shatterite-menu skeleton (dark Pewter field #14110c · the offset embossed shadow · rounded
   corners) is kept, but the Pewter split-metal border is replaced by a PRISMATIC spectrum border
   (a conic full-spectrum ring painted into a masked ::before) + a spectrum GLOW. The pane PULSES
   (a soft spectrum glow breathe) until the first hover anor first utilization drops .forge-launch--
   pulsing (the forgeLaunchEngaged session ref). Spectrum vocabulary = the --color-red…--color-fuchsia
   HiFi tokens (the same the .spectrum-text heading clips), so it reads as one with the HiFi system.
   ============================================================ */
.forge-launch-prismatic {
  position: relative;
  border-radius: 8px;
  padding: 2px; /* the prismatic ring thickness (the ::before spectrum fills this frame) */
  box-shadow: -3px 3px 0 rgba(91, 83, 71, 0.4);
  isolation: isolate;
}

/* THE PRISMATIC RING — a full-spectrum conic gradient painted into the 2px padding frame. */
.forge-launch-prismatic::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  z-index: 0;
  /* C375 THE POINTER TRAP: the masked ring paints only the 2px frame but HIT-TESTS across its
     whole box above static children — the Engage button was pointer-dead (zero clicked telemetry)
     while the dropdown (its own stacking context) survived. Decorative layers never take the pointer. */
  pointer-events: none;
  background: conic-gradient(
    from 210deg,
    var(--color-red),
    var(--color-orange),
    var(--color-yellow),
    var(--color-green),
    var(--color-blue),
    var(--color-purple),
    var(--color-fuchsia),
    var(--color-red)
  );
  opacity: 0.85;
}

/* THE SPECTRUM GLOW — a soft blurred spectrum halo behind the pane (animated when pulsing). */
.forge-launch-glow {
  position: absolute;
  inset: -6px;
  border-radius: 12px;
  z-index: -1;
  background: conic-gradient(
    from 210deg,
    var(--color-red),
    var(--color-orange),
    var(--color-yellow),
    var(--color-green),
    var(--color-blue),
    var(--color-purple),
    var(--color-fuchsia),
    var(--color-red)
  );
  filter: blur(14px);
  opacity: 0.28;
  transition: opacity 0.3s ease;
  pointer-events: none;
}

/* THE PANE FIELD — the dark Pewter body inside the prismatic frame (the .shatterite-menu field). */
.forge-launch-body {
  position: relative;
  z-index: 1;
  background: #14110c;
  border-radius: 6px;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

/* THE PULSE — a soft spectrum-glow breathe, LOOPING until the first hover/utilization settles it.
   Both the ring opacity and the glow halo breathe together (the eye-catch), spoken in spectrum. */
.forge-launch--pulsing .forge-launch-glow {
  animation: forge-launch-glow-pulse 2.2s ease-in-out infinite both;
}
.forge-launch--pulsing::before {
  animation: forge-launch-ring-pulse 2.2s ease-in-out infinite both;
}

@keyframes forge-launch-glow-pulse {
  0%   { opacity: 0.22; filter: blur(12px); }
  50%  { opacity: 0.5;  filter: blur(18px); }
  100% { opacity: 0.22; filter: blur(12px); }
}

@keyframes forge-launch-ring-pulse {
  0%   { opacity: 0.72; }
  50%  { opacity: 1; }
  100% { opacity: 0.72; }
}

/* Accessibility — reduced-motion keeps the prismatic ring + a steady glow, drops the breathe. */
@media (prefers-reduced-motion: reduce) {
  .forge-launch--pulsing .forge-launch-glow { animation: none; opacity: 0.4; }
  .forge-launch--pulsing::before { animation: none; opacity: 0.9; }
}

.forge-launch-heading {
  font-family: var(--font-heading, 'Orbitron', sans-serif);
  font-size: 0.95rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  margin: 0 0 0.25rem;
}

/* MD-9 · D-MC-3 · THE ACTUALIZATION MODEL ROW — the label + the offscreen-safe ScsDropdown. Rides
   the pane's own gap (the .forge-launch-body flex column · no bespoke margin). Neutral pewter chrome
   (the model picker is system tooling, not a suite-keyed action · the spawn-model-row precedent). */
.forge-model-row {
  display: flex;
  align-items: center;
  gap: 8px;
  position: relative; /* anchor for the ScsDropdown's absolutely-positioned in-DOM drawer */
}
.forge-model-label {
  font-family: var(--font-mono, monospace);
  font-size: 0.62rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--color-pewter, rgba(255, 255, 255, 0.55));
}
.forge-model-dropdown {
  flex: 1 1 auto;
  min-width: 0;
}

.forge-launch-intro {
  color: rgba(230, 226, 216, 0.88);
  font-size: 0.85rem;
  line-height: 1.55;
  margin: 0;
}

.forge-launch-intro--muted {
  color: rgba(206, 202, 194, 0.68);
  font-size: 0.8rem;
}

.forge-launch-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  align-self: flex-start;
  margin-top: 0.25rem;
  padding: 0.55rem 1.2rem;
  border-radius: 4px;
  font-family: var(--font-heading, 'Orbitron', sans-serif);
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  cursor: pointer;
  color: #1c1812;
  background: #d8c79a;
  border-top: 1px solid #efe2bb;
  border-right: 1px solid #efe2bb;
  border-bottom: 1px solid #a8975e;
  border-left: 1px solid #a8975e;
  box-shadow: -1px 1px 3px rgba(168, 151, 94, 0.5);
  transition: filter 0.15s ease;
}

.forge-launch-btn:hover:not(:disabled) {
  filter: brightness(1.08);
}

.forge-launch-btn:disabled {
  opacity: 0.6;
  cursor: default;
}

/* W1 · THE SWORD-B TURN-OVER TREATMENT — rides the GitmSwordBButton ochre neon-edge + chamfer
   language (deep near-black field · the thin ochre/amber ring · the chamfered clip · the neon glyph).
   The turn-over-request leg reads as one with the Sword-B setter it fires. */
.forge-launch-btn--sword-b {
  color: rgb(255, 206, 9);
  background:
    radial-gradient(ellipse at 38% 30%, rgba(234, 179, 8, 0.16) 0%, rgba(16, 13, 5, 0) 62%),
    radial-gradient(ellipse at 50% 120%, rgba(234, 179, 8, 0.09) 0%, rgba(14, 11, 4, 0) 70%),
    rgb(15, 12, 6);
  border: 1px solid rgba(234, 179, 8, 0.55);
  clip-path: polygon(
    8px 0, calc(100% - 8px) 0, 100% 8px,
    100% calc(100% - 8px), calc(100% - 8px) 100%,
    8px 100%, 0 calc(100% - 8px), 0 8px
  );
  box-shadow:
    0 0 8px 0 rgba(234, 179, 8, 0.28),
    inset 0 0 10px 0 rgba(234, 179, 8, 0.10);
  text-shadow: 0 0 6px rgba(234, 179, 8, 0.6);
  transition: box-shadow 0.2s ease, border-color 0.2s ease, color 0.2s ease;
}

.forge-launch-btn--sword-b:hover:not(:disabled) {
  filter: none;
  border-color: rgba(234, 179, 8, 0.9);
  color: rgb(255, 224, 120);
  box-shadow:
    0 0 14px 1px rgba(234, 179, 8, 0.5),
    inset 0 0 14px 0 rgba(234, 179, 8, 0.18);
}

.forge-launch-note {
  color: rgba(216, 199, 154, 0.85);
  font-size: 0.8rem;
  margin: 0;
}

/* C386 · W3 · THE PREVIOUS-CONDUCTIONS ROW — muted pewter, no ceremony (the pane is mortal). A small
   inline-wrap of re-openable OFFLINE conductions beneath the Engage button. */
.forge-previous-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.4rem;
  margin-top: 0.5rem;
}

.forge-previous-label {
  font-family: var(--font-mono, monospace);
  font-size: 0.62rem;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: rgba(206, 202, 194, 0.55);
}

.forge-previous-btn {
  display: inline-flex;
  align-items: baseline;
  gap: 0.35rem;
  padding: 0.2rem 0.55rem;
  border-radius: 4px;
  background: rgba(0, 0, 0, 0.35);
  border: 1px solid rgba(168, 151, 94, 0.3);
  color: rgba(216, 199, 154, 0.8);
  cursor: pointer;
  transition: border-color 0.15s ease, background 0.15s ease;
}

.forge-previous-btn:hover {
  border-color: rgba(216, 199, 154, 0.6);
  background: rgba(0, 0, 0, 0.5);
}

.forge-previous-ulid {
  font-size: 0.68rem;
  color: rgba(230, 226, 216, 0.9);
}

.forge-previous-ulid.mono {
  font-family: var(--font-mono, monospace);
}

.forge-previous-model {
  font-size: 0.6rem;
  color: rgba(206, 202, 194, 0.6);
}
</style>
