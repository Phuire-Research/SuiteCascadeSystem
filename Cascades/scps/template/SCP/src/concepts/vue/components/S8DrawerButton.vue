<script setup lang="ts">
/**
 * S8DrawerButton — V-3 · THE TOOLBAR BREAKOUT · THE S8 LOCALITY FACE (R3)
 *
 * THE HELD, TOKEN-FREE NAME: this button is HELD under the shared vue concept (not the
 * suite8 concept) — its file name carries no suite8 token so a minted twin's rename never
 * touches it; it is the ONE always-visible locality face for EVERY Suite 8 page.
 *
 * R3 · THE LOCALITY FACE: the S8 button is NOT a plain fallback button — it is a custom
 * button face (componentMap key 's8-drawer' · resolved by id in TaskBar.resolveComponent)
 * rendering the CURRENT page's locality:
 *   'S8: <specified>'          when a locality is specified (and live),
 *   'S8: Local <localScp>'     when the page composes on its own SCP,
 *   'S8: <designation>'        while the locality snapshot is still absent (the intake face).
 * This is the readout the user watches when switching pages.
 *
 * THE SUBSCRIPTION IDIOM (ported from Suite8Control.vue · the PROVEN shape): the page muxium
 * (getGlobalScsBridgeController().getCurrentMuxium()) carries the suite8 client concept whose
 * relay-fed `localities` Record is read through the HELD, token-free accessors
 * (readClientSyncLocalities / clientSyncLocalitiesSelector) keyed by currentS8Page.designation.
 * ensureLocalitySubscription arms a keyed stage-planner; a bounded 250ms settle (the
 * mount-before-bind window · ~10s cap) covers the muxium-binding race; the planner concludes
 * on unmount.
 *
 * THE EMIT CONTRACT: mirrors ScsBridgeSessionsButton VERBATIM — the button's native @click
 * bubbles to the parent TaskBar's `@click="$emit('buttonClicked', btn.id)"` binding; `handleClick`
 * additionally emits 'clicked' for forward-compat (the Sessions face precedent).
 *
 * Citation: Suite8Control.vue (ensureLocalitySubscription + the 250ms settle + conclude on
 * unmount · the localityLabel computed) · ScsBridgeSessionsButton.vue (the custom-face
 * emit/props contract) · TaskBar.vue :188-193 (resolveComponent · by-id map lookup).
 */
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue';
import type { Muxium } from 'stratimux';
import { getGlobalScsBridgeController } from '../../scsBridge/scsBridgeController';
import type { ClientMuxiumDeck } from '../../client/client.muxonomy';
// V-3 · THE HELD LOCALITY ACCESS (token-free · survives a minted twin's rename) — the same
// accessors Suite8Control subscribes through; the concept path + selector live HERE, never copied.
import {
  readClientSyncLocalities,
  clientSyncLocalitiesSelector,
  syncLocalityEndpoint,
} from '../../../model/scpLocalityClientAccess.model';

interface Props {
  // popupOpen parity with ScsBridgeSessionsButton — drives the active-state styling.
  drawerOpen?: boolean;
}

defineProps<Props>();

const emit = defineEmits<{
  (e: 'clicked'): void;
}>();

// The relay-fed locality snapshot for THIS page's designation (the four fields the face reads).
type LocalityFaceInfo = {
  localScp: string | null;
  specified: string | null;
  ring: { scpName: string; status: string }[];
};
const syncLocality = ref<LocalityFaceInfo | null>(null);
// V-4c · the controller-pushed face (the page-owned Control's truth — works on ANY island)
// takes precedence; the local snapshot (subscription anor HTTP seed) is the fallback.
const effectiveFace = computed<LocalityFaceInfo | null>(
  () => getGlobalScsBridgeController()?.currentS8Locality.value ?? syncLocality.value,
);

// The page identity — currentS8Page is the shared controller seat the Landing registers in
// onMounted (null → not a Suite 8 page; the parent filters this button out entirely then).
const currentDesignation = computed<string>(
  () => getGlobalScsBridgeController()?.currentS8Page.value?.designation ?? '',
);

// MD-S8PM · PM-4 · THE OUT-OF-SYNC SIGNAL (token-free · controller-direct — the SAME idiom this
// button already reads its locality face through). The controller's s8PageBehind compares the
// page's minted s8 counter against npm's available s8 (fed by the TaskBar relay). ONLY `true`
// signals: null (either half unknown — no npm answer yet · not an S8 page) stays QUIET, never
// signals on unknown. The border colors amber when the page is behind (the update surface).
// THE NO-RED LAW holds: this reads s8PageBehind, never the TaskBar badge verdict.
const s8OutOfSync = computed<boolean>(
  () => getGlobalScsBridgeController()?.s8PageBehind.value === true,
);

// THE EFFECTIVE LOCALITY (ported from Suite8Control.localityLabel) — specified-if-live, else the
// real composed-on SCP, else the designation intake face. The surface never rests on a dead locality.
const specifiedLive = computed<boolean>(() => {
  const s = effectiveFace.value;
  if (!s?.specified) return false;
  return s.ring.some((e) => e.scpName === s.specified && e.status !== 'offline');
});
const localityFaceLabel = computed<string>(() => {
  const s = effectiveFace.value;
  const designation = currentDesignation.value;
  // 'S8: <specified>' when a live specified locality stands.
  if (s?.specified && specifiedLive.value) return `S8: ${s.specified}`;
  // 'S8: Local <localScp>' when the page composes on its own known SCP.
  if (s?.localScp) return `S8: Local ${s.localScp}`;
  // 'S8: <designation>' while the snapshot is still absent (the intake face).
  return `S8: ${designation || '…'}`;
});

// ============================================================
// THE RELAY SUBSCRIPTION (ported from Suite8Control · the ONE plan this face holds) — a keyed
// stage-planner on the page muxium's suite8 localities Record; reads THIS page's designation key.
// ============================================================
function snapshotToInfo(snap: Record<string, unknown>): LocalityFaceInfo {
  const ringRaw = Array.isArray(snap.ring) ? (snap.ring as unknown[]) : [];
  return {
    localScp: typeof snap.localScp === 'string' ? snap.localScp : null,
    specified: typeof snap.specified === 'string' ? snap.specified : null,
    ring: ringRaw
      .map((e) => e as { scpName?: unknown; status?: unknown })
      .filter((e) => typeof e.scpName === 'string')
      .map((e) => ({ scpName: e.scpName as string, status: typeof e.status === 'string' ? e.status : 'offline' })),
  };
}

let localityPlanner: { conclude: () => void } | null = null;
let armedMuxium: unknown = null;
let localitySubSettleTimer: ReturnType<typeof setTimeout> | null = null;
let localitySubSettleTries = 0;
function ensureLocalitySubscription(): boolean {
  const muxium = getGlobalScsBridgeController()?.getCurrentMuxium() as Muxium<ClientMuxiumDeck> | null;
  if (!muxium) return false;
  // C823 · THE MUXIUM-IDENTITY RE-ARM — armed-once was deaf to a REPLACED page muxium
  // (GPIM re-bind); a planner concluded against a dead muxium never hears the live one.
  if (localityPlanner && armedMuxium === muxium) return true;
  if (localityPlanner) {
    localityPlanner.conclude();
    localityPlanner = null;
  }
  armedMuxium = muxium;
  localityPlanner = muxium.plan<ClientMuxiumDeck>(
    's8DrawerButtonLocalitySubscription',
    ({ staging, stage, d__ }) =>
      staging(() => [
        stage(
          ({ d }) => {
            const record = readClientSyncLocalities(d) as Record<string, Record<string, unknown>>;
            const key = currentDesignation.value;
            const snap = key ? record[key] : undefined;
            // ABSENCE IS NOT EMPTINESS — an un-relayed record has no key for this designation;
            // only a REAL snapshot assigns (the null 'no locality' is itself a snapshot with
            // specified:null · the intake face stands until one arrives).
            if (snap) syncLocality.value = snapshotToInfo(snap);
          },
          { selectors: [clientSyncLocalitiesSelector(d__)] },
        ),
      ]),
  );
  return true;
}
// V-4c · THE HTTP SEED (token-free endpoint · answers for ANY designation) — the muxium
// subscription only feeds where the suite8 slice composes; a twin island's face would
// otherwise rest on the designation fallback until the drawer's Control pushes.
function hydrateFaceOnce(): void {
  const designation = currentDesignation.value;
  if (!designation) return;
  void fetch(syncLocalityEndpoint(designation))
    .then((r) => (r.ok ? r.json() : null))
    .then((data) => {
      if (!data || typeof data !== 'object') return;
      syncLocality.value = snapshotToInfo(data as Record<string, unknown>);
    })
    .catch(() => undefined);
}

function settleLocalitySubscription(): void {
  if (ensureLocalitySubscription()) return;
  if (localitySubSettleTries >= 40) return;
  localitySubSettleTries += 1;
  localitySubSettleTimer = setTimeout(settleLocalitySubscription, 250);
}

// A designation-arrival re-arm — the seat may register AFTER this face mounts; re-attempt the
// subscription (and clear a stale snapshot) the moment the page's own identity lands.
watch(currentDesignation, (name, prior) => {
  if (name === prior) return;
  syncLocality.value = null;
  localitySubSettleTries = 0;
  hydrateFaceOnce();
  settleLocalitySubscription();
});

function handleClick() {
  emit('clicked');
}

onMounted(() => {
  if (typeof window === 'undefined') return;
  hydrateFaceOnce();
  settleLocalitySubscription();
});
onBeforeUnmount(() => {
  if (localityPlanner) {
    localityPlanner.conclude();
    localityPlanner = null;
  }
  if (localitySubSettleTimer !== null) {
    clearTimeout(localitySubSettleTimer);
    localitySubSettleTimer = null;
  }
});
</script>

<template>
  <span class="taskbar-btn-wrap s8-drawer-btn-wrap" :style="{ '--btn-neon': 'var(--color-viridian)' }">
    <button
      :class="['taskbar-btn', 'btn-base', 's8-drawer-btn', { active: drawerOpen, 's8-out-of-sync': s8OutOfSync }]"
      data-readout="Suite 8 Control · This page's locality + the Suite 8 helm. Click to open the control drawer."
      aria-label="Suite 8 Control"
      @click="handleClick"
    >
      <i class="fa-solid fa-diagram-project taskbar-btn-icon" aria-hidden="true"></i>
      <span class="s8-drawer-btn-label hifi-mono">{{ localityFaceLabel }}</span>
    </button>
    <!-- C811 · NO HINT (the user's ruling) — the face's label IS the information
         (S8: Local <SCP>); the unstyled tip was flowing INLINE and shoving the MVP
         controls off-screen (the scoped-style boundary — TaskBar's .btn-tip rules
         cannot reach a child component's internals). -->
  </span>
</template>

<style scoped>
/* THE LOCALITY FACE — a pill-shaped native taskbar button carrying the viridian voice + the
   always-visible locality readout. Widens to fit the label (unlike the 44px icon buttons); a
   min-width guard so the preemptive x-scroll engages instead of squashing (R2). */
.s8-drawer-btn-wrap {
  flex-shrink: 0;
}
.s8-drawer-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  width: auto;
  min-width: max-content;
  height: 44px;
  padding: 0 0.7rem;
  border-radius: 8px;
  white-space: nowrap;
}
.s8-drawer-btn .taskbar-btn-icon {
  color: var(--color-viridian, #40826d);
  font-size: 0.9rem;
}
.s8-drawer-btn-label {
  font-size: 0.66rem;
  letter-spacing: 0.04em;
  color: #ffffff;
  text-shadow: var(--pewter-text-glow, 1px 1px 2px rgba(255, 255, 255, 0.45));
  white-space: nowrap;
}
.s8-drawer-btn.active {
  box-shadow: 0 0 0 1px var(--color-viridian, #40826d), 0 0 10px rgba(64, 130, 109, 0.4);
}
/* MD-S8PM · PM-4 · THE OUT-OF-SYNC SIGNAL — the border colors amber when the page is behind
   npm's s8 counter (the update surface · the .turn-over-btn.armed amber precedent
   rgba(249, 115, 22, *) · the toolbar-button neon voice). QUIET when current anor unknown
   (the class only binds on s8PageBehind === true). The .active viridian ring still layers when
   the drawer is open — the amber border reads underneath it (border-color, not box-shadow). */
.s8-drawer-btn.s8-out-of-sync {
  border-color: rgba(249, 115, 22, 0.85);
  box-shadow: 0 0 8px rgba(249, 115, 22, 0.45);
}
.s8-drawer-btn.s8-out-of-sync .taskbar-btn-icon {
  color: rgb(253, 186, 116);
}
</style>
