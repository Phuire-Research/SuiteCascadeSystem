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

type RosterShape = {
  bridgeUp?: boolean;
  installedScps?: string[];
  boundScps?: Record<string, { status?: string }>;
  scpStatuses?: Record<string, string>;
};
const roster = ref<RosterShape | null>(null);
const drawerOpen = ref<boolean>(false);
const busyScp = ref<string | null>(null);
const gateNote = ref<string>('');

async function fetchLocality(): Promise<void> {
  try {
    const r = await fetch(`/suite8-sync-locality/${encodeURIComponent(props.suite8Name)}`);
    if (r.ok) syncLocality.value = (await r.json()) as SyncLocalityInfo;
  } catch {
    /* the endpoint absent — the Local default renders */
  }
}

async function fetchRoster(): Promise<void> {
  try {
    const r = await fetch('/bridge-roster');
    if (r.ok) roster.value = (await r.json()) as RosterShape;
  } catch {
    roster.value = null;
  }
}

function refreshAll(): void {
  void fetchLocality();
  void fetchRoster();
}

onMounted(() => {
  if (typeof window === 'undefined') return;
  refreshAll();
  window.addEventListener('focus', refreshAll);
  document.addEventListener('visibilitychange', refreshAll);
});
onBeforeUnmount(() => {
  if (typeof window === 'undefined') return;
  window.removeEventListener('focus', refreshAll);
  document.removeEventListener('visibilitychange', refreshAll);
});

const localityLabel = computed<string>(() => {
  const s = syncLocality.value;
  if (!s) return 'Local';
  if (s.specified) return s.specified;
  return `Local${s.localScp ? ` · ${s.localScp}` : ''}`;
});
const isSpecified = computed<boolean>(() => !!syncLocality.value?.specified);

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

// The drawer's rows — the roster truth (installed ∪ statuses); the SAME lane the Session
// Manager reads. status resolution: scpStatuses[name] anor boundScps[name].status anor 'offline'.
const drawerRows = computed<{ scpName: string; status: string; isLocal: boolean }[]>(() => {
  const r = roster.value;
  const local = syncLocality.value?.localScp ?? null;
  if (!r) return [];
  const names = [...new Set(r.installedScps ?? [])];
  return names.map((scpName) => ({
    scpName,
    status:
      r.scpStatuses?.[scpName] ?? r.boundScps?.[scpName]?.status ?? 'offline',
    isLocal: scpName === local,
  }));
});

async function spawnScp(scpName: string): Promise<void> {
  if (busyScp.value) return;
  busyScp.value = scpName;
  try {
    await fetch('/bridge-boot', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scpName }),
    });
  } catch {
    /* the boot lane unreachable — the roster refresh shows the truth */
  } finally {
    // The boot settles asynchronously — refresh now + once more after a settle beat.
    refreshAll();
    setTimeout(() => {
      refreshAll();
      busyScp.value = null;
    }, 2500);
  }
}
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

    <!-- SECTION II · THE SCP DRAWER (spawn-if-absent · the shared Session Manager lanes) -->
    <div class="s8c-section">
      <button class="s8c-drawer-toggle hifi-mono" @click="drawerOpen = !drawerOpen">
        {{ drawerOpen ? '▾' : '▸' }} SCPs
      </button>
      <div v-if="drawerOpen" class="s8c-drawer">
        <div v-for="row in drawerRows" :key="row.scpName" class="s8c-drawer-row">
          <span
            class="s8c-bead"
            :class="row.status !== 'offline' ? 's8c-bead-live' : 's8c-bead-dim'"
          ></span>
          <span class="s8c-drawer-name">{{ row.scpName }}{{ row.isLocal ? ' · this page' : '' }}</span>
          <button
            v-if="row.status === 'offline'"
            class="s8c-spawn hifi-mono"
            :disabled="busyScp !== null"
            @click="spawnScp(row.scpName)"
          >
            {{ busyScp === row.scpName ? 'SPAWNING…' : 'SPAWN' }}
          </button>
        </div>
        <p v-if="drawerRows.length === 0" class="s8c-gate-note hifi-mono">
          (the bridge roster is unreachable)
        </p>
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
