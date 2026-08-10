<script setup lang="ts">
/**
 * Suite8CascadeDocs — the D-O Muxified Read, as a generic Suite 8 page surface.
 *
 * The two-pane home surface: the changeable plan (Diamond · Ego) on the left, the durable
 * trajectory log (Onyx · Lambda) on the right, both fed LIVE from THIS designation's own
 * Cascades/Extended/<designation>/ memory folder via the registered cascade state
 * (`cascades[<designation>].activeCascadeFiles` · the extended auto-registration circuit).
 *
 * GENERIC — the designation arrives by prop (`designation`), so ANY Suite 8 (minted anor
 * forged) reads its OWN pair by directory Name. This is the template promotion of the IE
 * bound component: the DECK path reads the shared Tier-2 suiteCascade member
 * (d.client.d.suiteCascade.k.cascades) — the exact precedent Suite8Landing.vue:311
 * establishes — and the routes are the generic /suite8-doc-tiers + /suite8-doc-save pair.
 *
 * Write authority split by nature:
 *   - The plan pane (Diamond · prunable) is PAGE-EDITABLE — a textarea toggle saves via the
 *     path-guarded /suite8-doc-save endpoint (writes DIAMOND-*.md only · DIAMOND-only · 403 ONYX).
 *   - The trajectory pane (Onyx · sacred) is READ-ONLY on the page — written only by working
 *     sessions. It carries a "session-written" label.
 *
 * The tier menu (falling-out-of-scope law as UI) enumerates prior tiers by filename presence
 * WITHOUT loading their content (a lightweight directory listing via /suite8-doc-tiers),
 * mirroring the RI Diamond/Onyx Menu.
 *
 * Fully self-encapsulated: every path resolves the SCP-local Cascades/Extended/<designation>/
 * folder server-side; the component reads only the relayed cascade Record for this designation.
 *
 * Render seat: mounted by Suite8HomeLanding (the ZONE 1 WTO Triptych RI-widget seat · replaces
 * the prop-fed SuiteCascadeDiamondOnyxPane). Reads the shared Tier-2 suiteCascade member.
 *
 * Pattern precedent: Suite8Landing.vue (Tier-2 cascades subscription) ·
 *                    SuiteCascadeDiamondOnyxPane.vue (marked render + Pewter hifi-* panes).
 */
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import { createAction } from 'stratimux';
import type { Action, Muxium } from 'stratimux';
import { marked } from 'marked';
import { createClientMuxiumInstance, type ClientMuxiumDeck } from '../../../client/client.muxonomy';
import { createSuite8ClientConcept } from '../../suite8.concept.client';
import { createSuiteCascadeConcept } from '../../../suiteCascade/suiteCascade.concept.client';
import { suiteCascadeMuxonomic } from '../../../suiteCascade/suiteCascade.muxonomy';
import { suite8Muxonomic } from '../../suite8.muxonomy';
// W1 (C758) · REWRITE-PROOF ROUTES — the /suite8-* literals live ONLY in the never-copied
// scsBridge s8Routes model; the mint's suite8-token rewrite cannot break these fetch paths.
import { s8CascadePath, s8DocTiersPath, S8_DOC_SAVE_PATH, scpCascadeMemoryPath } from '../../../scsBridge/model/s8Routes.model';
// CMLS-R · the face is the switch's FAST signal (the Control pushes it right after the POST);
// the on-demand fetch rides it — a SPEED lane only, the truth still confirmed by the relay.
import { getGlobalScsBridgeController } from '../../../scsBridge/scsBridgeController';
import type { Cascade, CascadeFileEntry, CascadeSubscriptionTarget } from '../../../suiteCascade/suiteCascade.type';
// SCRR sentinel constants (the client request leg) — reused by the on-mount re-request.
import {
  SUITE_CASCADE_REQUEST_ACTION_TYPE,
  SUITE_CASCADE_REQUEST_SENTINEL,
} from '../../../suiteCascade/principles/suiteCascadeRequestOnLoad.principle.client';

const props = withDefaults(
  defineProps<{
    // The designation Name to read from the shared Record (byte-matches the Extended dir basename).
    designation?: string;
  }>(),
  {
    designation: 'Your Domain',
  },
);

// COLLAPSIBLE SECTION (the Pewter section header + toggle). Default EXPANDED. The choice persists
// per-designation in localStorage under a namespaced key (`suite8-cascade-docs:<designation>` ·
// SSR-guarded). Collapsed = header only; expanded = the two panes + tier menu. The subscription +
// tier fetch keep running regardless (the state stays live under a fold).
// C865 · collapsed by default EVERYWHERE (component consistency); an explicit stored
// 'true' (the user's own toggle · localStorage per designation) expands thereafter.
const sectionExpanded = ref<boolean>(false);
const sectionStorageKey = computed<string>(() => `suite8-cascade-docs:${props.designation}`);

function loadSectionExpanded(): void {
  try {
    if (typeof localStorage === 'undefined') return;
    const raw = localStorage.getItem(sectionStorageKey.value);
    // Absent → keep the default (collapsed · C865). An explicit stored value wins.
    if (raw === 'false') sectionExpanded.value = false;
    else if (raw === 'true') sectionExpanded.value = true;
  } catch {
    /* SSR / disabled storage / malformed → the default (collapsed · C865) stands (never breaks). */
  }
}

function toggleSection(): void {
  sectionExpanded.value = !sectionExpanded.value;
  try {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(sectionStorageKey.value, sectionExpanded.value ? 'true' : 'false');
  } catch {
    /* SSR / disabled storage → the toggle is session-only (never breaks). */
  }
}

// Live cascade state for THIS designation (the extended auto-registration relay lands here).
const cascade = ref<Cascade | null>(null);

// CMLS · the relayed subscription target for THIS designation (the cascade lane's own state ·
// set beside cascade.value in the subscription stage). null = Local. Feeds the C836 record-leg
// label + the flip-watch (the page keys off the cascade lane, not the bridge controller's face).
const subscriptionTargetForDesignation = ref<CascadeSubscriptionTarget | null>(null);
// CMLS · the floor route's serving echo (the SERVER's truth · C837 fix 2) — feeds the C836
// floor-leg label so the label reads the server's resolution, not the client's ask.
const floorServing = ref<string | null>(null);
// C833 · the race-guard epoch — re-keyed to the subscription-target change (the CMLS re-point
// boundary), replacing the prior locality-epoch.
const subscriptionEpoch = ref(0);

// Prior-tier filenames (enumerated WITHOUT loading their content — the tier menu).
const priorTierNames = ref<string[]>([]);

// Diamond editing (the plan is page-editable).
const editingDiamond = ref<boolean>(false);
const diamondDraft = ref<string>('');
const savingDiamond = ref<boolean>(false);
const saveError = ref<string>('');

let muxium: Muxium<ClientMuxiumDeck> | null = null;
let stagePlanner: { conclude: () => void } | null = null;
// Connection-gated mount-hydration plan handle (self-concludes after the SCRR request;
// concluded defensively on unmount).
let mountHydrationPlanner: { conclude: () => void } | null = null;

// ── THE ON-BOOT SELF-QUERY floor (the Shatterite Menu RD · the MOCH hydrate idiom) ──
// bootCascade = the HTTP-fetched cold-boot floor; cascade = the live Record leg (WS relay).
// Render precedence: the Record WINS whenever it FILLS (non-empty activeCascadeFiles);
// the fetch only floors the boot — an empty registration relay never blanks a filled floor,
// and a filled relay always overrides the floor (the fetch never blocks the relay).
const bootCascade = ref<Cascade | null>(null);
// CHECKPOINT PRECEDENCE — the Record WINS whenever it fills (non-empty activeCascadeFiles);
// the floor holds the boot when the Record is empty. Trust is STRUCTURAL: the relayed entry
// IS this designation's content by construction (the subscription re-point makes stamp
// adjudication unreachable). The registration-stub blink is still guarded (a filled floor is
// not blanked by an empty relay).
const effectiveCascade = computed<Cascade | null>(() => {
  const live = cascade.value;
  if (live && live.activeCascadeFiles.length > 0) return live;
  return bootCascade.value ?? live;
});
// C835 · THE EMPTY-GROUND UNIFICATION (empty is a state) — EVERY 0-file ground states
// itself plainly; the pane branch renders only when files exist. One truth, one render,
// no locality conditional in the branch (Wave 4 re-feeds the label from the state-held
// target).
const emptyGround = computed<boolean>(() =>
  effectiveCascade.value !== null
  && effectiveCascade.value.activeCascadeFiles.length === 0,
);
// C836 · THE MEMORY SOURCE LABEL (troubleshooting surface · re-fed by the state-held target ·
// the commission's letter). Record leg: Serving = the relayed subscription target's specifiedScp
// (anor Local). Floor leg: Serving = the route's serving echo (the SERVER's truth · C837 fix 2).
// Locality tracks the same state-held target (the page-owner face import is gone). via leg +
// files unchanged.
const memorySourceLabel = computed<string>(() => {
  const target = subscriptionTargetForDesignation.value;
  const locality = target?.specifiedScp ?? 'Local';
  const eff = effectiveCascade.value;
  if (!eff) return `Locality: ${locality} · Serving: — (no ground)`;
  const onFloor = eff === bootCascade.value;
  const serving = onFloor
    ? (floorServing.value ?? 'Local')            // floor leg — the route's server truth.
    : (target?.specifiedScp ?? 'Local');         // record leg — the state-held target.
  const leg = onFloor ? 'floor' : 'record';
  return `Locality: ${locality} · Serving: ${serving} · via ${leg} · files: ${eff.activeCascadeFiles.length}`;
});

// CMLS · §3.7.2 · THE SUBSCRIPTION FLIP-WATCH (the ONE replacement watch) — a flip re-floors from
// the NEW resolution (the server seat) + re-fetches the tier menu. Compare absoluteDir (F6 guard:
// a target reinstall changes the root even at the same specifiedScp — the absoluteDir is the true
// identity). C833 re-keyed: the epoch bump discards any floor fetch in flight across the flip.
watch(subscriptionTargetForDesignation, (now, prior) => {
  if ((now?.absoluteDir ?? null) === (prior?.absoluteDir ?? null)) return;
  console.log('[Suite8CascadeDocs] subscription flip · target=', now?.specifiedScp ?? 'Local');
  subscriptionEpoch.value += 1;   // C833 re-keyed — the race-guard epoch.
  bootCascade.value = null;       // the stale floor dies at the flip boundary.
  void hydrateCascadeBootFloor(); // re-floor from the NEW resolution (server seat).
  void refreshPriorTiers();       // the tier menu is HTTP-only — light re-fetch.
});

// ── Diamond / Onyx split from the finite activeCascadeFiles list ──────────────────
// The manifest lists activeDiamond → a DIAMOND-*.md path, activeOnyx → an ONYX-*.md path.
// Split by filename convention (the durable naming law: DIAMOND / ONYX).
const diamondFile = computed<CascadeFileEntry | null>(() => {
  const files = effectiveCascade.value?.activeCascadeFiles ?? [];
  return files.find((f) => /DIAMOND/i.test(f.filePath)) ?? null;
});
const onyxFile = computed<CascadeFileEntry | null>(() => {
  const files = effectiveCascade.value?.activeCascadeFiles ?? [];
  return files.find((f) => /ONYX/i.test(f.filePath)) ?? null;
});

const renderedDiamond = computed<string>(() =>
  diamondFile.value?.markdown
    ? (marked.parse(diamondFile.value.markdown, { async: false }) as string)
    : '',
);
const renderedOnyx = computed<string>(() =>
  onyxFile.value?.markdown
    ? (marked.parse(onyxFile.value.markdown, { async: false }) as string)
    : '',
);

const hasCascade = computed<boolean>(() => effectiveCascade.value !== null);

// ── Diamond edit ─────────────────────────────────────────────────────────────
function beginEditDiamond() {
  diamondDraft.value = diamondFile.value?.markdown ?? '';
  saveError.value = '';
  editingDiamond.value = true;
}
function cancelEditDiamond() {
  editingDiamond.value = false;
  saveError.value = '';
}
async function saveDiamond() {
  const file = diamondFile.value;
  if (!file) return;
  savingDiamond.value = true;
  saveError.value = '';
  try {
    const r = await fetch(S8_DOC_SAVE_PATH, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        designation: props.designation,
        filePath: file.filePath,
        markdown: diamondDraft.value,
      }),
    });
    const body = (await r.json()) as { ok?: boolean; error?: string };
    if (!r.ok || !body.ok) {
      saveError.value = body.error ?? `Save failed (${r.status})`;
      return;
    }
    // The watcher's chokidar 'change' event re-reads the file + relays the new
    // activeCascadeFiles → the pane updates from the live cascade state (no local write).
    editingDiamond.value = false;
  } catch (err) {
    saveError.value = `Save unreachable: ${String(err)}`;
  } finally {
    savingDiamond.value = false;
  }
}

// ── Prior-tier enumeration (WITHOUT loading content) ────────────────────────────
async function refreshPriorTiers(): Promise<void> {
  try {
    const r = await fetch(s8DocTiersPath(props.designation), {
      headers: { Accept: 'application/json' },
    });
    if (!r.ok) return;
    const body = (await r.json()) as { priorTiers?: string[] };
    priorTierNames.value = Array.isArray(body.priorTiers) ? body.priorTiers : [];
  } catch {
    /* absent / offline → no prior tiers listed (the active pair still renders) */
  }
}

// ── THE ON-BOOT HTTP SELF-QUERY (the Shatterite Menu MOCH idiom · timing-immune) ────
// The WS legs (relay · reconnect-gated SCRR · backfill) all race a cold-boot mount; this
// fetch does not. GET /suite8-cascade/<designation> reads Cascade.json + the manifest's
// active files straight from disk (two-roots resolved · own-root-first) and floors the
// panes IMMEDIATELY. The live Record still WINS when it fills (effectiveCascade
// precedence) — the fetch never blocks anor clobbers the relay.
// CMLS-R · THE ON-DEMAND ARM — the owner face's specified is the fastest observable switch
// signal; on change the floor fetches the TARGET's memory DIRECTLY (the by-name query) while
// the server re-point places the change detection in parallel. Same epoch guard; the relay
// leg confirms/updates behind it.
const onDemandTargetScp = computed<string | null>(
  () => getGlobalScsBridgeController()?.currentS8Locality.value?.specified ?? null,
);
watch(onDemandTargetScp, (now, prior) => {
  if (now === prior) return;
  subscriptionEpoch.value += 1;
  console.log('[Suite8CascadeDocs] on-demand switch fetch · target=', now ?? 'Local');
  void hydrateCascadeBootFloor(now);
});

async function hydrateCascadeBootFloor(onDemandTarget?: string | null): Promise<void> {
  // C833 · THE IN-FLIGHT RACE GUARD (re-keyed to subscriptionEpoch): a query launched under the
  // PRIOR subscription can land AFTER a flip and overwrite the new ground; the response's identity
  // is the epoch AT FETCH START — a flip mid-flight discards the landing.
  const fetchEpoch = subscriptionEpoch.value;
  try {
    // the on-demand arm queries the TARGET by name; the RELEASE (explicit null) queries the
    // OWN ground via the reserved Local name (seat-free — the C847 release-race cure); the
    // bare mount rides the seat route (the standing subscription's truth).
    const floorUrl = onDemandTarget
      ? scpCascadeMemoryPath(onDemandTarget, props.designation)
      : (onDemandTarget === null
        ? scpCascadeMemoryPath('Local', props.designation)
        : s8CascadePath(props.designation));
    const r = await fetch(floorUrl, {
      headers: { Accept: 'application/json' },
    });
    if (fetchEpoch !== subscriptionEpoch.value) return; // stale in-flight — a flip occurred.
    if (!r.ok) return; // 404 honest → no floor (the relay legs still stand)
    const body = (await r.json()) as {
      name?: string;
      cascadeJson?: Record<string, unknown> | null;
      activeCascadeFiles?: { filePath?: string; content?: string }[];
      serving?: string | null;
    };
    if (fetchEpoch !== subscriptionEpoch.value) return; // stale — flip during the body parse.
    const entries: CascadeFileEntry[] = (body.activeCascadeFiles ?? [])
      .filter((f) => typeof f.filePath === 'string' && typeof f.content === 'string')
      .map((f) => ({ filePath: f.filePath as string, markdown: f.content as string }));
    // C835 · EMPTY IS A STATE (the standing law) — a memory-less ground floors an EMPTY
    // cascade so the render is honest (always set the floor, even for 0 files).
    bootCascade.value = {
      name: body.name ?? props.designation,
      cascadeDirectory: '',
      cascadeJson: body.cascadeJson ?? null,
      activeCascadeFiles: entries,
      missingCascadeJson: false,
    };
    // C837 fix 2 · the floor-leg label reads the SERVER's serving truth (not the client's ask).
    floorServing.value = typeof body.serving === 'string' ? body.serving : null;
    console.log('[Suite8CascadeDocs] on-boot self-query floored · files=', entries.length);
  } catch {
    /* unreachable anor malformed → no floor (AFPR · the relay legs still stand) */
  }
}

onMounted(() => {
  if (typeof window === 'undefined') return;

  // hydrate the persisted collapse choice (client-only · default expanded stands on absence).
  loadSectionExpanded();

  muxium = createClientMuxiumInstance<ClientMuxiumDeck>(
    [
      { concept: createSuite8ClientConcept(), muxonomy: suite8Muxonomic },
      { concept: createSuiteCascadeConcept(), muxonomy: suiteCascadeMuxonomic }, // top-level base · serverToClient relay lands here (CadmiumLanding:568)
    ],
    {
      title: 'Suite8CascadeDocs',
      logging: false,
      storeDialog: true,
    },
  );

  // Tier-2 subscription — the shared suiteCascade member's cascades Record (Suite8Landing.vue:311
  // precedent) + the CMLS cascadeSubscriptionTargets Record (the flip-watch source). Reads THIS
  // designation's key from BOTH — one stage, one selector list. The relayed target IS the cascade
  // lane's own state (the page keys off it, not the bridge controller's face).
  stagePlanner = muxium.plan<ClientMuxiumDeck>(
    'suite8CascadeDocsSubscription',
    ({ staging, stage, d__ }) =>
      staging(() => [
        stage(
          ({ d }) => {
            const cascades = d.client.d.suiteCascade.k.cascades.select() as Record<
              string,
              Cascade
            >;
            cascade.value = cascades[props.designation] ?? null;
            const targets = d.client.d.suiteCascade.k.cascadeSubscriptionTargets.select() as Record<
              string,
              CascadeSubscriptionTarget
            >;
            subscriptionTargetForDesignation.value = targets[props.designation] ?? null;
          },
          {
            selectors: [
              d__.client.d.suiteCascade.k.cascades,
              d__.client.d.suiteCascade.k.cascadeSubscriptionTargets,
            ],
          },
        ),
      ]),
  );

  // ── THE CONNECTION-GATED MOUNT HYDRATION (the navigation-load gap closed) ──────
  // The subscription stage above is selector-GATED — it fires only when the cascades
  // Record CHANGES. A re-mounted page (SPA navigation away → back) creates a FRESH
  // ClientMuxium whose WebSocket connects LATER — a request dispatched at mount rides
  // an unopened socket and is DROPPED. This plan closes the gap as a SINGLE
  // self-concluding selector stage — the #640 law: never append a stage behind a
  // non-iterating stage (the prior two-stage shape parked its pointer at stage 0
  // and hung; its firstRun pass fired disconnected WITHOUT a dispatch, then the
  // one-shot false→true delta had to land perfectly anor never). On every fire:
  // render-what-is-held (a relay that landed before this plan registered renders
  // now); WHEN isConnected reads true (set inside ws.onopen AFTER the reconnect
  // message + semaphore registration — the socket can carry the request AND the
  // server will answer) dispatch the idempotent SCRR sentinel DIRECTLY, then
  // stagePlanner.conclude() — no stage traversal, no muxiumKick middleman. The
  // lone selector-driven self-concluding stage is the proven firing idiom on this
  // exact selector (the connection badges) anor the #640 proven-fix shape.
  mountHydrationPlanner = muxium.plan<ClientMuxiumDeck>(
    'suite8CascadeDocsConnectionGatedMountHydrationSingleStage',
    ({ staging, stage, d__ }) =>
      staging(() => [
        stage(
          ({ d, dispatch, stagePlanner }) => {
            const cascades = d.client.d.suiteCascade.k.cascades.select() as Record<
              string,
              Cascade
            >;
            cascade.value = cascades[props.designation] ?? null;
            const connected = d.client.d.webSocketClient.k.isConnected.select() as boolean;
            if (connected) {
              const sentinelAction = createAction(SUITE_CASCADE_REQUEST_ACTION_TYPE, {
                payload: { sentinel: SUITE_CASCADE_REQUEST_SENTINEL },
              });
              dispatch(
                (d as any).client.d.webSocketClient.e.webSocketClientAppendToActionQue({
                  actionQue: [sentinelAction as unknown as Action],
                }),
                {},
              );
              stagePlanner.conclude();
            }
          },
          {
            selectors: [d__.client.d.webSocketClient.k.isConnected],
          },
        ),
      ]),
  );

  void refreshPriorTiers();
  // THE ON-BOOT SELF-QUERY — the cold-boot floor fires beside the WS legs, racing nothing.
  void hydrateCascadeBootFloor();
});

onUnmounted(() => {
  if (mountHydrationPlanner) mountHydrationPlanner.conclude();
  if (stagePlanner) stagePlanner.conclude();
  if (muxium) muxium.close();
});
</script>

<template>
  <div class="s8cd-card">
    <!-- THE PEWTER SECTION HEADER (the section-label voice · collapse/expand toggle).
         Collapsed = this header only; expanded = the two panes + tier menu. Default collapsed (C865);
         the choice persists per-designation in localStorage. -->
    <button
      type="button"
      class="s8cd-header s8cd-header-toggle"
      :aria-expanded="sectionExpanded"
      @click="toggleSection"
    >
      <span class="s8cd-header-chevron" :class="{ 's8cd-header-chevron--open': sectionExpanded }"
        >&#9656;</span
      >
      <span class="s8cd-header-icon">&#9670;</span>
      <span class="hifi-label s8cd-header-title">Cascade Memory</span>
      <span class="s8cd-header-sub">Plan &amp; Trajectory</span>
    </button>

    <template v-if="sectionExpanded">
      <!-- C836 · the memory source label — always visible while expanded -->
      <div class="s8cd-source-label hifi-mono hifi-label">{{ memorySourceLabel }}</div>

      <div v-if="!hasCascade" class="hifi-pane-base s8cd-empty">
        <span class="hifi-label s8cd-placeholder">Cascade memory is loading…</span>
      </div>

      <!-- C835 · the unified honest empty state — every 0-file ground, Local included -->
      <div v-else-if="emptyGround" class="hifi-pane-base s8cd-empty">
        <span class="hifi-label s8cd-placeholder">No cascade memory for this designation.</span>
      </div>

      <template v-else>
        <div class="s8cd-grid">
          <!-- ===================== DIAMOND (Ego · plan · page-editable) ===================== -->
          <div class="hifi-pane-diamond s8cd-pane">
            <div class="s8cd-pane-head">
              <span class="s8cd-pane-label s8cd-pane-label-diamond">Plan</span>
              <span class="s8cd-pane-tag">Editable</span>
              <button
                v-if="!editingDiamond && diamondFile"
                type="button"
                class="s8cd-edit-btn"
                @click="beginEditDiamond"
              >
                Edit
              </button>
            </div>

            <div class="hifi-stamp s8cd-pane-body">
              <template v-if="editingDiamond">
                <textarea v-model="diamondDraft" class="s8cd-textarea" spellcheck="false" />
                <p v-if="saveError" class="s8cd-error">{{ saveError }}</p>
                <div class="s8cd-edit-actions">
                  <button
                    type="button"
                    class="s8cd-save-btn"
                    :disabled="savingDiamond"
                    @click="saveDiamond"
                  >
                    {{ savingDiamond ? 'Saving…' : 'Save' }}
                  </button>
                  <button
                    type="button"
                    class="s8cd-cancel-btn"
                    :disabled="savingDiamond"
                    @click="cancelEditDiamond"
                  >
                    Cancel
                  </button>
                </div>
              </template>
              <template v-else>
                <div v-if="renderedDiamond" class="s8cd-markdown-body" v-html="renderedDiamond" />
                <span v-else class="hifi-label s8cd-placeholder">(No plan document)</span>
              </template>
            </div>
          </div>

          <!-- ===================== ONYX (Lambda · trajectory · session-written) ===================== -->
          <div class="hifi-pane-onyx s8cd-pane">
            <div class="s8cd-pane-head">
              <span class="s8cd-pane-label s8cd-pane-label-onyx">Trajectory</span>
              <span class="s8cd-pane-tag s8cd-pane-tag-locked">Session-written</span>
            </div>
            <div class="hifi-stamp s8cd-pane-body">
              <div v-if="renderedOnyx" class="s8cd-markdown-body" v-html="renderedOnyx" />
              <span v-else class="hifi-label s8cd-placeholder">(No trajectory document)</span>
            </div>
          </div>
        </div>

        <!-- ===================== TIER MENU (enumerate priors WITHOUT loading) ===================== -->
        <div v-if="priorTierNames.length > 0" class="s8cd-tier-menu">
          <span class="s8cd-tier-menu-label">Prior tiers</span>
          <ul class="s8cd-tier-list">
            <li v-for="name in priorTierNames" :key="name" class="s8cd-tier-item">
              <span class="s8cd-tier-dot">&#9671;</span>
              <span class="s8cd-tier-name">{{ name }}</span>
              <span class="s8cd-tier-hint">(retained · not loaded)</span>
            </li>
          </ul>
        </div>
      </template>
    </template>
  </div>
</template>

<style scoped>
.s8cd-card {
  background: linear-gradient(135deg, #141414 0%, #0a0a0a 100%);
  border: 1px solid rgba(180, 160, 120, 0.12);
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 3px 12px rgba(0, 0, 0, 0.5);
}

.s8cd-header {
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
  padding: 0.625rem 0.875rem;
  background: linear-gradient(90deg,
    rgba(180, 160, 120, 0.04) 0%,
    rgba(120, 100, 70, 0.02) 50%,
    rgba(80, 60, 100, 0.04) 100%
  );
  border-bottom: 1px solid rgba(180, 160, 120, 0.06);
}

/* the header is a full-width collapse/expand toggle (button reset · pointer). */
.s8cd-header-toggle {
  width: 100%;
  font: inherit;
  text-align: left;
  cursor: pointer;
  transition: background 0.2s ease;
}

.s8cd-header-toggle:hover {
  background: linear-gradient(90deg,
    rgba(180, 160, 120, 0.08) 0%,
    rgba(120, 100, 70, 0.05) 50%,
    rgba(80, 60, 100, 0.08) 100%
  );
}

.s8cd-header-chevron {
  align-self: center;
  font-size: 0.6rem;
  color: rgba(200, 190, 170, 0.55);
  transition: transform 0.2s ease;
}

.s8cd-header-chevron--open {
  transform: rotate(90deg);
}

.s8cd-header-icon {
  font-size: 0.75rem;
  background: linear-gradient(135deg,
    rgba(239, 68, 68, 0.8) 0%, rgba(249, 115, 22, 0.8) 16%, rgba(234, 179, 8, 0.8) 33%,
    rgba(34, 197, 94, 0.8) 50%, rgba(59, 130, 246, 0.8) 66%, rgba(168, 85, 247, 0.8) 83%,
    rgba(236, 72, 153, 0.8) 100%
  );
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.s8cd-header-title {
  font-family: 'Orbitron', system-ui, sans-serif;
  font-size: 0.8rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  color: rgba(200, 190, 170, 0.9);
}

.s8cd-header-sub {
  font-size: 0.65rem;
  color: rgba(200, 200, 200, 0.3);
  font-style: italic;
}

/* C836 · the memory source label (the troubleshooting surface) */
.s8cd-source-label {
  font-size: 0.6rem;
  letter-spacing: 0.08em;
  opacity: 0.75;
  padding: 2px 6px 6px;
  text-transform: none;
}

.s8cd-empty {
  padding: 1.25rem;
  text-align: center;
}

.s8cd-placeholder {
  font-size: 0.8rem;
  color: rgba(200, 200, 200, 0.4);
  font-style: italic;
}

.s8cd-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
  padding: 0.75rem;
}

@media (max-width: 700px) {
  .s8cd-grid {
    grid-template-columns: 1fr;
  }
}

.s8cd-pane {
  border-radius: 6px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.s8cd-pane-head {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.4rem 0.625rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.s8cd-pane-label {
  font-family: 'Orbitron', system-ui, sans-serif;
  font-size: 0.65rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.s8cd-pane-label-diamond {
  background: linear-gradient(90deg, rgba(220, 180, 80, 0.9) 0%, rgba(200, 170, 100, 0.7) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.s8cd-pane-label-onyx {
  background: linear-gradient(90deg, rgba(220, 220, 230, 0.9) 0%, rgba(160, 160, 170, 0.7) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.s8cd-pane-tag {
  font-size: 0.55rem;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: rgba(120, 200, 140, 0.6);
  border: 1px solid rgba(120, 200, 140, 0.25);
  border-radius: 3px;
  padding: 0.05rem 0.3rem;
}

.s8cd-pane-tag-locked {
  color: rgba(180, 180, 190, 0.5);
  border-color: rgba(180, 180, 190, 0.2);
}

.s8cd-edit-btn {
  margin-left: auto;
  font-size: 0.6rem;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: rgba(220, 180, 80, 0.85);
  background: transparent;
  border: 1px solid rgba(220, 180, 80, 0.3);
  border-radius: 3px;
  padding: 0.1rem 0.5rem;
  cursor: pointer;
  transition: all 0.2s;
}

.s8cd-edit-btn:hover {
  background: rgba(220, 180, 80, 0.1);
  border-color: rgba(220, 180, 80, 0.6);
}

.s8cd-pane-body {
  padding: 0.625rem 0.75rem;
  max-height: 55vh;
  overflow-y: auto;
}

.s8cd-textarea {
  width: 100%;
  min-height: 40vh;
  background: rgba(0, 0, 0, 0.35);
  border: 1px solid rgba(220, 180, 80, 0.25);
  border-radius: 4px;
  color: rgba(230, 230, 230, 0.9);
  font-family: 'Space Mono', monospace;
  font-size: 0.72rem;
  line-height: 1.5;
  padding: 0.6rem;
  resize: vertical;
  box-sizing: border-box;
}

.s8cd-error {
  color: rgba(239, 120, 120, 0.9);
  font-size: 0.72rem;
  margin: 0.4rem 0 0;
}

.s8cd-edit-actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.s8cd-save-btn,
.s8cd-cancel-btn {
  font-size: 0.65rem;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  border-radius: 4px;
  padding: 0.3rem 0.75rem;
  cursor: pointer;
  border: 1px solid transparent;
}

.s8cd-save-btn {
  color: rgba(20, 20, 20, 0.95);
  background: linear-gradient(90deg, rgba(220, 180, 80, 0.9), rgba(200, 170, 100, 0.8));
  border-color: rgba(220, 180, 80, 0.5);
}

.s8cd-save-btn:disabled {
  opacity: 0.5;
  cursor: default;
}

.s8cd-cancel-btn {
  color: rgba(200, 200, 200, 0.7);
  background: rgba(60, 60, 60, 0.4);
  border-color: rgba(255, 255, 255, 0.1);
}

/* C764 · Pewter task-list checkboxes — HiFi green on checked. marked emits DISABLED native
   checkboxes and Chromium greys those regardless of accent-color (the C763 lesson) — so the
   box is custom-drawn: appearance none + a painted :checked state that the disabled attribute
   cannot wash out. */
.s8cd-markdown-body :deep(input[type='checkbox']) {
  appearance: none;
  -webkit-appearance: none;
  width: 0.95em;
  height: 0.95em;
  margin-right: 0.4em;
  border: 1px solid var(--color-green-dark);
  border-radius: 3px;
  background: transparent;
  vertical-align: -0.15em;
  position: relative;
  opacity: 1;
}
.s8cd-markdown-body :deep(input[type='checkbox']:checked) {
  background: var(--color-green);
  border-color: var(--color-green);
}
.s8cd-markdown-body :deep(input[type='checkbox']:checked::after) {
  content: '';
  position: absolute;
  left: 0.26em;
  top: 0.06em;
  width: 0.24em;
  height: 0.5em;
  border: solid var(--fade-green);
  border-width: 0 2px 2px 0;
  transform: rotate(45deg);
}

.s8cd-markdown-body {
  font-size: 0.78rem;
  line-height: 1.5;
  color: rgba(220, 220, 220, 0.85);
}

.s8cd-markdown-body :deep(h1),
.s8cd-markdown-body :deep(h2),
.s8cd-markdown-body :deep(h3) {
  font-family: 'Orbitron', sans-serif;
  font-weight: 600;
  letter-spacing: 0.02em;
  margin: 0.75rem 0 0.4rem;
  color: rgba(240, 240, 240, 0.9);
}

.s8cd-markdown-body :deep(h1) { font-size: 0.95rem; }
.s8cd-markdown-body :deep(h2) { font-size: 0.88rem; }
.s8cd-markdown-body :deep(h3) { font-size: 0.82rem; }
.s8cd-markdown-body :deep(p) { margin: 0.4rem 0; }
.s8cd-markdown-body :deep(strong) { color: rgba(255, 255, 255, 0.9); font-weight: 600; }

.s8cd-markdown-body :deep(code) {
  font-family: 'Space Mono', monospace;
  font-size: 0.72rem;
  background: rgba(0, 0, 0, 0.35);
  padding: 0.1rem 0.3rem;
  border-radius: 3px;
}

.s8cd-markdown-body :deep(ul),
.s8cd-markdown-body :deep(ol) {
  margin: 0.4rem 0;
  padding-left: 1.4rem;
}

.s8cd-markdown-body :deep(li) { margin: 0.2rem 0; }

.s8cd-markdown-body :deep(blockquote) {
  border-left: 2px solid rgba(255, 255, 255, 0.25);
  padding-left: 0.75rem;
  margin: 0.4rem 0;
  color: rgba(200, 200, 200, 0.7);
  font-style: italic;
}

.s8cd-tier-menu {
  border-top: 1px solid rgba(255, 255, 255, 0.05);
  padding: 0.625rem 0.875rem;
}

.s8cd-tier-menu-label {
  font-family: 'Orbitron', system-ui, sans-serif;
  font-size: 0.6rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: rgba(200, 190, 170, 0.55);
}

.s8cd-tier-list {
  list-style: none;
  margin: 0.4rem 0 0;
  padding: 0;
}

.s8cd-tier-item {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.72rem;
  color: rgba(200, 200, 200, 0.6);
  padding: 0.15rem 0;
}

.s8cd-tier-dot {
  color: rgba(180, 160, 120, 0.5);
  font-size: 0.6rem;
}

.s8cd-tier-name {
  font-family: 'Space Mono', monospace;
  color: rgba(220, 220, 220, 0.8);
}

.s8cd-tier-hint {
  font-size: 0.62rem;
  font-style: italic;
  color: rgba(200, 200, 200, 0.3);
}
</style>
