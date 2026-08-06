<script setup lang="ts">
/**
 * Suite8Control.vue — THE SUITE 8 CONTROL (the Featured component · DSP-2 base · C740)
 *
 * THE HOLDING LAW (the user's ruling): this component is HELD under the suite8 concept —
 * NEVER rendered on the suite8 base page. Live Suite 8 pages MOUNT IT DIRECTLY (Cadmium
 * first · the create-S8 generator emits it for minted pages) — ONE canonical file updates
 * every page.
 *
 * SECTION I · THE LOCALITY — the Register's machinery re-homed: the current locality +
 * the rows (Local + the ring). THE HARD LIVE GATE (the Live Locality Law · DSP-1): a
 * non-live target is NOT choosable (row disabled) AND the server refuses regardless
 * (POST 409). Choosing POSTs /suite8-sync-locality; the page follows LIVE through the
 * proven circuit (the usher machine · the menu re-arm · the anchor induction).
 *
 * SECTION II · THE SCP DRAWER — expandable; EVERY installed SCP off /bridge-roster (the
 * SAME lane the SCS-Bridge Session Manager reads) with a SPAWN micro-button per offline
 * row riding POST /bridge-boot (the SAME lane it fires). B1b (carded): the Session
 * Manager's SCP-management aspect extracted into its own component replaces this drawer's
 * rows — the data lanes are already one; the extraction unifies the face.
 *
 * SECTION III · THE DOCUMENTATION — the B3 fold seat (reserved).
 *
 * Citation: D-DSP2-PEWTER-CONTROL-RD.md (the design) · DIAMOND-DIAMETRIC-SUITE8-PATTERN.md
 * (the Live Locality Law · the C739 recursion) · D-SL5-PEWTER-LOCALITY-RD.md (the Register
 * precedent this re-homes).
 */
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import type { Muxium } from 'stratimux';
// B1b · DSP-2a · THE SCP MANAGEMENT ORGAN (extracted from the Session Manager) replaces this
// component's interim SCP drawer WHOLESALE — the same /bridge-roster + /bridge-boot lanes, now the
// full helm (Spawn/Focus/Exit/Multiply/Delete + the boot/multiply bars + ONLINE/OFFLINE grouping).
// Mounted `compact` (no W1 footer · no "SCP MANAGEMENT →" nav button) behind the existing SCPs toggle.
import ScpManagementPanel from '../../../scsBridge/vue/components/ScpManagementPanel.vue';
// B-RLM-2 · THE LOCALITY RELAY (the poll retirement) — the page muxium (bound by the parent Landing
// into the universal controller · GPIM) carries the suite8 client concept whose relay-fed `localities`
// Record this component now subscribes to. getGlobalScsBridgeController().getCurrentMuxium() is the
// same held reference every controller dispatch uses; a keyed stage-planner reads localities[suite8Name].
import { getGlobalScsBridgeController } from '../../../scsBridge/scsBridgeController';
import type { ClientMuxiumDeck } from '../../../client/client.muxonomy';
import type { Suite8SyncLocalitySnapshot } from '../../suite8.type';

const props = defineProps<{
  suite8Name: string;
}>();

type SyncLocalityInfo = {
  localScp: string | null;
  specified: string | null;
  targetScp: string | null;
  ring: { scpName: string; status: string }[];
};
const syncLocality = ref<SyncLocalityInfo | null>(null);

const drawerOpen = ref<boolean>(false);
const gateNote = ref<string>('');

// B-RLM-2 · map the relay snapshot (which carries the extra Scholar fields) down to the exact
// SyncLocalityInfo shape the Effective Locality Law computeds already consume (unchanged).
function snapshotToInfo(snap: Suite8SyncLocalitySnapshot): SyncLocalityInfo {
  return {
    localScp: snap.localScp,
    specified: snap.specified,
    targetScp: snap.targetScp,
    ring: Array.isArray(snap.ring) ? snap.ring : [],
  };
}

// B-RLM-2 · ODCF — one-shot mount hydration (the CadmiumLanding two-phase pattern). The relay only
// reaches WebSocket-connected clients; a fresh page load before any relay fire would see the empty
// default. GET the current locality ONCE and dispatch it into the page muxium so the subscription
// gets an initial value. B3b · dispatch even the Local/empty snapshot (empty is a state).
function hydrateLocalityOnce(): void {
  void fetch(`/suite8-sync-locality/${encodeURIComponent(props.suite8Name)}`)
    .then((r) => (r.ok ? r.json() : null))
    .then((data) => {
      if (!data || typeof data !== 'object') return;
      const j = data as SyncLocalityInfo;
      // Compose the state-shape snapshot from the GET (the extra Scholar fields default at the
      // client — they are relay-authoritative; the GET carries the four the component consumes).
      const snapshot: Suite8SyncLocalitySnapshot = {
        localScp: typeof j.localScp === 'string' ? j.localScp : null,
        specified: typeof j.specified === 'string' ? j.specified : null,
        targetScp: typeof j.targetScp === 'string' ? j.targetScp : null,
        targetRoot: null,
        targetLive: false,
        localLive: false,
        ring: Array.isArray(j.ring) ? j.ring : [],
      };
      // B-RLM-2b · THE DUAL WRITE — the ref sets DIRECTLY (the panel-grade resilient path: the
      // component owns its truth even muxium-less), AND the snapshot dispatches into the muxium
      // when bound (the shared state + every other subscriber). The subscription re-arms here too.
      syncLocality.value = snapshotToInfo(snapshot);
      ensureLocalitySubscription();
      const muxium = getGlobalScsBridgeController()?.getCurrentMuxium() as Muxium<ClientMuxiumDeck> | null;
      if (!muxium) return;
      muxium.dispatch(
        muxium.deck.d.client.d.suite8.e.suite8SetSyncLocalityClient({
          localities: { [props.suite8Name]: snapshot },
          closureGraces: {},
        }),
      );
    })
    .catch(() => {
      /* ODCF absent/unreachable → stay on null; the relay still delivers live snapshots */
    });
}

// B-RLM-2 · THE RELAY SUBSCRIPTION (the 10s poll retirement) — a keyed stage-planner on the page
// muxium's suite8 localities Record. The selector fires on any relay-fed change; we read THIS
// component's designation key (props.suite8Name) into syncLocality. Concludes on unmount (mirror
// CadmiumLanding's stagePlanner.conclude cleanup). NO Stratimux plan runs synchronously in the
// template — this is the ONE plan this component holds, purely for the reactive read.
let localityPlanner: { conclude: () => void } | null = null;
// B-RLM-2b · ARM-ON-BIND — Vue mounts children BEFORE the parent Landing's onMounted binds the
// muxium (setMuxium), so a mount-time arm finds null and MUST retry: a bounded 250ms settle (the
// SOE boot-coalescer class · stops the beat it arms · ~10s cap) covers the binding window, and
// every hydrate re-attempts opportunistically. Without this the subscription silently never arms
// and Section I goes uncontrollable (the field find).
let localitySubSettleTimer: ReturnType<typeof setTimeout> | null = null;
let localitySubSettleTries = 0;
function ensureLocalitySubscription(): boolean {
  if (localityPlanner) return true;
  const muxium = getGlobalScsBridgeController()?.getCurrentMuxium() as Muxium<ClientMuxiumDeck> | null;
  if (!muxium) return false;
  localityPlanner = muxium.plan<ClientMuxiumDeck>(
    'suite8ControlLocalitySubscription',
    ({ staging, stage, d__ }) =>
      staging(() => [
        stage(
          ({ d }) => {
            const record = d.client.d.suite8.k.localities.select() as Record<
              string,
              Suite8SyncLocalitySnapshot
            >;
            const snap = record[props.suite8Name];
            syncLocality.value = snap ? snapshotToInfo(snap) : null;
          },
          { selectors: [d__.client.d.suite8.k.localities] },
        ),
      ]),
  );
  return true;
}
function settleLocalitySubscription(): void {
  if (ensureLocalitySubscription()) return;
  if (localitySubSettleTries >= 40) return;
  localitySubSettleTries += 1;
  localitySubSettleTimer = setTimeout(settleLocalitySubscription, 250);
}

// B-RLM-2 · focus/visibility resilience KEPT (cheap · calls the SAME ODCF setter) — a page that was
// backgrounded when a relay fired re-hydrates on return; the relay otherwise keeps state live.
function refreshAll(): void {
  hydrateLocalityOnce();
}

onMounted(() => {
  if (typeof window === 'undefined') return;
  settleLocalitySubscription();
  hydrateLocalityOnce();
  window.addEventListener('focus', refreshAll);
  document.addEventListener('visibilitychange', refreshAll);
});
onBeforeUnmount(() => {
  if (typeof window === 'undefined') return;
  window.removeEventListener('focus', refreshAll);
  document.removeEventListener('visibilitychange', refreshAll);
  if (localityPlanner) {
    localityPlanner.conclude();
    localityPlanner = null;
  }
  if (localitySubSettleTimer !== null) {
    clearTimeout(localitySubSettleTimer);
    localitySubSettleTimer = null;
  }
});

// DSP-B2d · THE EFFECTIVE LOCALITY LAW (the user's ruling) — the current-locality line
// renders the EFFECTIVE locality: specified-if-live, else the real composed-on SCP. The
// disk keeps the grace-protected selection; the surface never rests on a dead locality
// (preventative — no command may be aimed where it cannot arrive).
const specifiedLive = computed<boolean>(() => {
  const s = syncLocality.value;
  if (!s?.specified) return false;
  return s.ring.some((e) => e.scpName === s.specified && e.status !== 'offline');
});
const localityLabel = computed<string>(() => {
  const s = syncLocality.value;
  if (!s) return 'Local';
  if (s.specified && specifiedLive.value) return s.specified;
  return `Local${s.localScp ? ` · ${s.localScp}` : ''}`;
});
const isSpecified = computed<boolean>(() => !!syncLocality.value?.specified && specifiedLive.value);

// THE HARD LIVE GATE (client face) — a ring row is choosable ONLY when live.
function ringRowLive(entry: { status: string }): boolean {
  return entry.status !== 'offline';
}

async function chooseLocality(scpName: string | null): Promise<void> {
  gateNote.value = '';
  try {
    const r = await fetch(`/suite8-sync-locality/${encodeURIComponent(props.suite8Name)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ specified: scpName }),
    });
    if (!r.ok) {
      const j = (await r.json().catch(() => null)) as { error?: string } | null;
      gateNote.value = j?.error ?? 'the locality write was refused';
    }
  } catch (err) {
    gateNote.value = String(err).slice(0, 120);
  } finally {
    refreshAll();
  }
}

// B1b · DSP-2a · drawerRows / spawnScp / busyScp REMOVED — the interim per-row Spawn drawer is
// replaced WHOLESALE by <ScpManagementPanel compact /> (the full helm off the same bridge lanes).
</script>

<template>
  <section class="s8-control hifi-pane">
    <header class="s8c-head">
      <span class="s8c-eyebrow hifi-mono">{{ props.suite8Name }}</span>
      <h3 class="s8c-title hifi-heading">SUITE 8 CONTROL</h3>
    </header>

    <!-- SECTION I · THE LOCALITY -->
    <div class="s8c-section">
      <div class="s8c-current" :class="{ 's8c-specified': isSpecified }">
        <span class="s8c-label hifi-mono">LOCALITY</span>
        <span class="s8c-value">{{ localityLabel }}</span>
      </div>
      <div class="s8c-rows">
        <button
          class="s8c-row"
          :class="{ 's8c-row-current': !syncLocality?.specified }"
          @click="chooseLocality(null)"
        >
          <span class="s8c-bead s8c-bead-live"></span>
          Local{{ syncLocality?.localScp ? ` · ${syncLocality.localScp}` : '' }}
        </button>
        <button
          v-for="entry in syncLocality?.ring ?? []"
          :key="entry.scpName"
          class="s8c-row"
          :class="{ 's8c-row-current': syncLocality?.specified === entry.scpName }"
          :disabled="!ringRowLive(entry)"
          :title="ringRowLive(entry)
            ? `Set this page's locality to ${entry.scpName}`
            : 'Spawn this SCP to enable its locality (the Live Locality Law)'"
          @click="chooseLocality(entry.scpName)"
        >
          <span
            class="s8c-bead"
            :class="ringRowLive(entry) ? 's8c-bead-live' : 's8c-bead-dim'"
          ></span>
          {{ entry.scpName }}
        </button>
      </div>
      <p v-if="gateNote" class="s8c-gate-note hifi-mono">{{ gateNote }}</p>
    </div>

    <!-- SECTION II · THE SCP DRAWER — B1b · DSP-2a. The interim roster+Spawn rows are REPLACED
         WHOLESALE by the muxified ScpManagementPanel (compact mode: no W1 footer · no "SCP
         MANAGEMENT →" nav button) behind the SAME expandable SCPs toggle. The panel owns its own
         /bridge-roster poll + the full helm (Spawn/Focus/Exit/Multiply/Delete + the bars). -->
    <div class="s8c-section">
      <button class="s8c-drawer-toggle hifi-mono" @click="drawerOpen = !drawerOpen">
        {{ drawerOpen ? '▾' : '▸' }} SCPs
      </button>
      <div v-if="drawerOpen" class="s8c-drawer">
        <ScpManagementPanel compact />
      </div>
    </div>

    <!-- SECTION III · THE DOCUMENTATION (the B3 fold seat · reserved) -->
  </section>
</template>

<style scoped>
/* THE SUITE 8 CONTROL (Pewter · D-DSP2-PEWTER-CONTROL-RD) — the Featured pewter frame;
   the glow informs (green = Local/live · fuchsia = Specified), never a flooded fill. */
.s8-control {
  padding: 0.9rem 1.1rem;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.14);
  background: rgba(0, 0, 0, 0.28);
}
.s8c-head {
  display: flex;
  align-items: baseline;
  gap: 0.6rem;
  margin-bottom: 0.6rem;
}
.s8c-eyebrow {
  font-size: 0.6rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: rgba(255, 255, 255, 0.45);
}
.s8c-title {
  font-size: 0.8rem;
  letter-spacing: 0.1em;
  color: #cfc8ba;
  margin: 0;
}
.s8c-section {
  margin-top: 0.5rem;
}
.s8c-current {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.25rem 0.6rem;
  border-radius: 10px;
  border: 1px solid rgba(74, 222, 128, 0.35);
  box-shadow: 0 0 6px rgba(74, 222, 128, 0.12);
}
.s8c-current.s8c-specified {
  border-color: rgba(232, 121, 249, 0.5);
  box-shadow: 0 0 8px rgba(232, 121, 249, 0.22);
}
.s8c-label {
  font-size: 0.6rem;
  letter-spacing: 0.08em;
  color: rgba(255, 255, 255, 0.5);
}
.s8c-value {
  font-size: 0.72rem;
  color: rgba(255, 255, 255, 0.85);
}
.s8c-rows {
  display: flex;
  flex-wrap: wrap;
  gap: 0.3rem;
  margin-top: 0.4rem;
}
.s8c-row {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.2rem 0.55rem;
  border-radius: 9px;
  border: 1px solid rgba(255, 255, 255, 0.14);
  background: transparent;
  color: rgba(255, 255, 255, 0.65);
  font-size: 0.62rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  cursor: pointer;
  transition: color 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease;
}
.s8c-row:hover:not(:disabled) {
  color: rgba(255, 255, 255, 0.95);
  border-color: rgba(255, 255, 255, 0.25);
}
.s8c-row:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}
.s8c-row-current {
  border-color: rgba(74, 222, 128, 0.45);
  box-shadow: 0 0 6px rgba(74, 222, 128, 0.16);
}
.s8c-bead {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  flex: 0 0 auto;
}
.s8c-bead-live {
  background: #4ade80;
  box-shadow: 0 0 5px rgba(74, 222, 128, 0.6);
}
.s8c-bead-dim {
  background: rgba(255, 255, 255, 0.22);
}
.s8c-gate-note {
  margin-top: 0.35rem;
  font-size: 0.6rem;
  color: rgba(248, 113, 113, 0.85);
}
.s8c-drawer-toggle {
  padding: 0.2rem 0.55rem;
  border-radius: 9px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: transparent;
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.62rem;
  letter-spacing: 0.06em;
  cursor: pointer;
}
.s8c-drawer {
  margin-top: 0.35rem;
  display: flex;
  flex-direction: column;
  gap: 3px;
  padding: 0.4rem;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(0, 0, 0, 0.3);
}
.s8c-drawer-row {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.16rem 0.4rem;
  font-size: 0.64rem;
  color: rgba(255, 255, 255, 0.7);
}
.s8c-drawer-name {
  flex: 1 1 auto;
}
.s8c-spawn {
  padding: 0.12rem 0.5rem;
  border-radius: 8px;
  border: 1px solid rgba(74, 222, 128, 0.4);
  background: transparent;
  color: #4ade80;
  font-size: 0.58rem;
  letter-spacing: 0.06em;
  cursor: pointer;
}
.s8c-spawn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
