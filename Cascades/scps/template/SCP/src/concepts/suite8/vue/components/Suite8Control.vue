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
import { ref, computed, watch, onMounted, onBeforeUnmount, inject } from 'vue';
import type { Muxium } from 'stratimux';
// D-FM · FM-1 · 1A · THE FORGE FOLD (§IV) IS EXTRACTED WHOLESALE into the shared S8-class
// widget S8ForgeMenu (the lent-shapes stratum · src/concepts/vue/components/ · OUTSIDE the
// mint copy surface — ONE canonical file updates every page). This panel keeps ONLY the
// rename-proof findLiveS8Session (the PM-4 version-row lane below) + ScsDropdown (§V).
import { findLiveS8Session } from '../../../scsBridge/model/s8Anchor.model';
import ScsDropdown from '../../../vue/components/ScsDropdown.vue';
import S8ForgeMenu from '../../../vue/components/S8ForgeMenu.vue';
// B1b · DSP-2a · THE SCP MANAGEMENT ORGAN (extracted from the Session Manager) replaces this
// component's interim SCP drawer WHOLESALE — the same /bridge-roster + /bridge-boot lanes, now the
// full helm (Spawn/Focus/Exit/Multiply/Delete + the boot/multiply bars + ONLINE/OFFLINE grouping).
// Mounted `compact` (no W1 footer · no "SCP MANAGEMENT →" nav button) behind the existing SCPs toggle.
import ScpManagementPanel from '../../../scsBridge/vue/components/ScpManagementPanel.vue';
// B-RLM-2 · THE LOCALITY RELAY (the poll retirement) — the page muxium (bound by the parent Landing
// into the universal controller · GPIM) carries the suite8 client concept whose relay-fed `localities`
// Record this component now subscribes to. getGlobalScsBridgeController().getCurrentMuxium() is the
// same held reference every controller dispatch uses; a keyed stage-planner reads localities[suite8Name].
import { getGlobalScsBridgeController, SCS_BRIDGE_CONTROLLER_KEY } from '../../../scsBridge/scsBridgeController';
// EF-3′ · THE TWO-STATE DOOR moved to S8ForgeMenu with §IV (the gitm branch read, the
// turn-over progress write, and the standby overlay all ride the widget now — FM-1).
import type { ClientMuxiumDeck } from '../../../client/client.muxonomy';
import type { Suite8SyncLocalitySnapshot, InstallRequirementsPayload } from '../../suite8.type';
// D-MINT-SURFACE · THE HELD LOCALITY ACCESS — every suite8-tokened locality access (the
// concept path · the endpoint · the dispatch target) routes through the held model so a
// minted twin's token-renamed copy keeps reading the ONE true slice + the ONE true endpoint.
import {
  syncLocalityEndpoint,
  readClientSyncLocalities,
  clientSyncLocalitiesSelector,
  dispatchClientSyncLocalitySnapshot,
} from '../../../../model/scpLocalityClientAccess.model';
// EF-5 · THE INSTALL CIRCUIT (held · token-free — survives every twin's rename): the gate-file
// schema + the three dissipating Vermillion builders (Mapper · Install Entourage · Update Circuit).
import {
  installRequirementsEndpoint,
  buildRequirementsMapperVermillion,
  buildInstallEntourageVermillion,
  buildUpdateCircuitVermillion,
  buildUpdateVermillion,
  type InstallRequirementsShape,
  type UpdateCircuitDirection,
} from '../../../../model/scpS8InstallCircuit.model';

const props = defineProps<{
  suite8Name: string;
  // EF-3′ · 2A · THE FRESH-ANOR-WORKED CONTROL — REQUIRED (the boolean-prop trap law: an
  // absent optional boolean coerces to false, so requiring it forces every mount to declare).
  // false = a FRESH page: the Entourage Forge section boots OPEN (the minted-page Lambda).
  // true = a WORKED page: boots collapsed (the standard toggle). THE SIGN-OFF: when the
  // Entourage deems the page sufficiently developed, it flips the page's hard-coded
  // :worked="false" mount to :worked="true" — that one edit IS the sign-off.
  worked: boolean;
  // V-3 · THE TOOLBAR BREAKOUT · noScpSection — the OPT-OUT NEGATIVE (the boolean-prop trap
  // law: an ABSENT optional boolean coerces to false, so every existing mount renders §II as
  // today; only an explicit :no-scp-section="true" suppresses it). The Suite8ControlDrawer
  // passes true — the toolbar already carries the dedicated SCP Management drawer, so the
  // Control drawer omits its own §II SCPs drawer to avoid a duplicate SCP helm.
  noScpSection?: boolean;
}>();

type SyncLocalityInfo = {
  localScp: string | null;
  specified: string | null;
  targetScp: string | null;
  // D-PFR · the target hifiConfig change-stamp — carried through to the face push (a face
  // composed without it would clobber the page owner's stamped face).
  targetHifiStamp: number | null;
  // D-PSVG · PSVG-1 · the target patternLibrary change-stamp — the exact twin (same clobber law).
  targetPatternLibraryStamp: number | null;
  ring: { scpName: string; status: string; origin?: string | null }[];
};
const syncLocality = ref<SyncLocalityInfo | null>(null);

// ============================================================
// D-EF-PAGE-PING · THE PAGE-PRESENCE PROBE (the user's design — the Conference ruling):
// window.location's MOST BASE PATH (`/<seg>`) is the page identity we already know; a
// HEAD fetch against each LIVE ring target's <origin><basePath> reveals by STATUS CODE
// whether that SCP carries THIS page (the server's HEAD island-truth answers 200 anor
// 404; the CORS * makes the cross-origin status readable). CONFIRM-TO-ENABLE: a row is
// selectable only once its target's page presence is CONFIRMED — the gate is a UI
// limitation only (no server refusal face — per the ruling).
// ============================================================
const pagePresence = ref<Record<string, boolean>>({});
function pageBasePath(): string {
  if (typeof window === 'undefined') return '/';
  const seg = window.location.pathname.split('/')[1] ?? '';
  return `/${seg}`;
}
// D-EF-PAGE-PING-b · THE DETERMINATION READOUT (the user's ask) — every probe decision
// logs: the base path, the ring as received (origin presence is the known kill: an
// origin-less entry can NEVER confirm under confirm-to-enable), each HEAD's status, and
// every skip with its reason. Read the console during the determination.
function probePagePresence(): void {
  const entries = syncLocality.value?.ring ?? [];
  const basePath = pageBasePath();
  console.log(
    '[Suite8Control PAGE-PING] determination · basePath=', basePath,
    '· ring=', entries.map((e) => ({ scpName: e.scpName, status: e.status, origin: e.origin ?? null })),
    '· presence=', { ...pagePresence.value },
  );
  for (const entry of entries) {
    if (entry.status === 'offline') {
      console.log('[Suite8Control PAGE-PING] skip', entry.scpName, '· reason=offline');
      continue;
    }
    if (!entry.origin) {
      console.log('[Suite8Control PAGE-PING] skip', entry.scpName, '· reason=NO-ORIGIN (the ring entry carries no browser origin — the row can never confirm; the server GET/relay must supply it)');
      continue;
    }
    if (pagePresence.value[entry.scpName] !== undefined) {
      console.log('[Suite8Control PAGE-PING] skip', entry.scpName, '· reason=already-determined →', pagePresence.value[entry.scpName]);
      continue;
    }
    const url = `${entry.origin}${basePath}`;
    console.log('[Suite8Control PAGE-PING] HEAD', url, 'for', entry.scpName);
    void fetch(url, { method: 'HEAD' })
      .then((r) => {
        console.log('[Suite8Control PAGE-PING] result', entry.scpName, '·', r.status, '· ok=', r.ok);
        pagePresence.value = { ...pagePresence.value, [entry.scpName]: r.ok };
      })
      .catch((err) => {
        console.log('[Suite8Control PAGE-PING] FETCH-REJECTED', entry.scpName, '·', String(err), '(cross-origin block anor network — marked not-carrying)');
        pagePresence.value = { ...pagePresence.value, [entry.scpName]: false };
      });
  }
}
watch(() => syncLocality.value?.ring, () => probePagePresence(), { deep: true, immediate: true });

// D-EF-PAGE-PING-c · THE VISIBLE FILTER (the user's ruling — S6·Fable's design): a ring
// SCP whose HEAD says it does NOT carry this page does not APPEAR (presence===false →
// PRUNED); an origin-less entry can NEVER confirm under confirm-to-enable (the template
// class) → equally pruned — never a forever-'Confirming…' row; undefined-with-origin =
// probe pending → rendered disabled 'Confirming…'; true → enabled.
const visibleRing = computed(() =>
  (syncLocality.value?.ring ?? []).filter((e) => {
    if (pagePresence.value[e.scpName] === false) return false; // the HEAD answered: not carried.
    if (!e.origin) return false; // structurally unconfirmable — never renders.
    return true;
  }),
);

const drawerOpen = ref<boolean>(false);
const gateNote = ref<string>('');

// ============================================================
// D-FM · FM-1 · SECTION IV MOVED — the hard-coded Forge config, the engagement state, the
// ONE MOTION engage, the Two-State Door, the pill filter system, the menu-path update row,
// and the RD-menu clipboard-prime ALL live in S8ForgeMenu.vue now (the shared S8-class widget).
// ============================================================

// THE RESOLVED SCP NAME (retained — §V's selfScpName + installTargetOptions read it; the
// widget carries its own twin of this mount race for its conduction pool).
const resolvedScpName = ref<string | null>(null);
onMounted(() => {
  void (async () => {
    try {
      const ctrl = getGlobalScsBridgeController();
      if (!ctrl) return;
      resolvedScpName.value = (await Promise.race([
        ctrl.getScpName(),
        new Promise<string | null>((r) => setTimeout(() => r(null), 3000)),
      ])) ?? null;
    } catch {
      /* best-effort · null matches by suite8Name alone */
    }
  })();
});

// FM-1 · the Two-State Door moved to S8ForgeMenu with §IV; this panel keeps ONLY the settled
// bridge-controller ref the PM-4 version-row computeds read (the proven reactive idiom).
const scsBridgeControllerForDoor =
  inject(SCS_BRIDGE_CONTROLLER_KEY) ?? getGlobalScsBridgeController();

// ============================================================
// MD-S8PM · PM-4 · THE PANEL VERSION ROW — the s8-axis counters + the always-enabled update
// control. Reads the controller's PM-3 seats through the SAME settled ref every dispatch uses
// (scsBridgeControllerForDoor · the proven reactive idiom). THE NO-RED LAW: these never touch
// the TaskBar badge verdict — the s8 signal owns this panel row + the toolbar toggle border only.
// ============================================================
// PAGE — the current page's minted s8 counter (floor 0 for wild pages · null only when no S8
// page is mounted, which cannot happen while this Control renders). Honest render: 0 → '#0'.
const pageS8CounterValue = computed<number | null>(
  () => scsBridgeControllerForDoor?.pageS8Counter.value ?? null,
);
// SYSTEM — the INSTALLED bridge's s8 counter fed by the TaskBar relay (null until an s8-carrying
// answer lands · '—' when unknown, never a fabricated 0). THE UPDATE-ORDER LAW: the installed
// bridge package.json IS the source of truth for the S8 system counter — the page cannot update
// until the bridge update lands the new package.json, so this reads the INSTALLED side, not npm.
const installedS8CounterValue = computed<number | null>(
  () => scsBridgeControllerForDoor?.installedS8Counter.value ?? null,
);
// BEHIND — the compare (page < installed system · null when either half unknown). Colors the row +
// control amber; ONLY true signals (null stays quiet — never signals on unknown).
const s8PageBehindValue = computed<boolean>(
  () => scsBridgeControllerForDoor?.s8PageBehind.value === true,
);
// The honest counter renders — page shows its number (0 = '#0'); system shows '#M' anor '—'.
const pageS8Display = computed<string>(() =>
  pageS8CounterValue.value === null ? '—' : `#${pageS8CounterValue.value}`,
);
const installedS8Display = computed<string>(() =>
  installedS8CounterValue.value === null ? '—' : `#${installedS8CounterValue.value}`,
);
// MD-S8PM · PM-5 · engageVersionedUpdate — THE FORGE UPDATE VERMILLION (the PM-4 version-row
// lane). D-FM · THE CONVERGENCE SEAM, carried across the FM-1 extraction: the MENU-PATH update
// row moved into S8ForgeMenu (which fires its OWN page-scoped twin of this lane via
// findLiveS8ConductionForTarget); this retained function serves the version row ONLY and keeps
// the shipped SCP-scoped findLiveS8Session behavior (its liveness keys on suite8Name ===
// 'Entourage Forge' + scpName + status === 'launched' — behavior-identical retention).
// De-duplication into a held model is CARDED (Band B). The note ref below has no render seat
// (the §IV note element moved with the fold — matching the prior closed-fold visibility).
const versionedUpdateSpawning = ref<boolean>(false);
const versionedUpdateNote = ref<string>('');
async function engageVersionedUpdate(): Promise<void> {
  const ctrl = getGlobalScsBridgeController();
  if (!ctrl || versionedUpdateSpawning.value) return;
  // FM-1 · settleForgeLaunchPulse moved with the fold — the pulse ref lives in the widget.
  versionedUpdateSpawning.value = true;
  versionedUpdateNote.value = '';
  try {
    // THE HONEST PAIR — the page's minted counter (floor 0) and the INSTALLED system's current
    // (page value when the installed s8 is unknown, so the embedded pair never fabricates a behind
    // delta; the session RE-READs /scs-bridge-version for the live installed counter regardless).
    // THE UPDATE-ORDER LAW: the installed bridge package.json's s8 is the source of truth.
    const pageS8 = pageS8CounterValue.value ?? 0;
    const installedS8 = installedS8CounterValue.value ?? pageS8;
    // THE TIMEOUT RACE (C375) — a never-settling getScpName must never hang the dispatch.
    const scpName = (await Promise.race([
      ctrl.getScpName(),
      new Promise<string | null>((r) => setTimeout(() => r(null), 3000)),
    ])) ?? undefined;
    // THE ONE MOTION — a live Forge conduction for THIS SCP is FOCUSED, never duplicated (the
    // update session shares the Entourage Forge pool; see the verdict note above).
    const liveForge = findLiveS8Session(ctrl.sessionsList.value ?? [], 'Entourage Forge', scpName);
    if (liveForge) {
      ctrl.triggerFocusSession(liveForge.id);
      versionedUpdateNote.value = 'Focused the running Forge.';
      return;
    }
    // ELSE — a fresh anchor spawn carrying the Forge Update Vermillion (the engageEntourageForge
    // idiom VERBATIM: fresh:false · onboard:true · anchor:true · target = this page).
    ctrl.triggerSpawnS8Session(
      'Entourage Forge', scpName, false, true, false,
      buildUpdateVermillion(props.suite8Name, pageS8, installedS8),
      true, true, props.suite8Name,
    );
    versionedUpdateNote.value = 'The Forge Update engaged — it will confer the standardization and hand the Suite back.';
  } catch {
    versionedUpdateNote.value = 'Could not engage the Forge Update — is the Bridge running?';
  } finally {
    setTimeout(() => {
      versionedUpdateSpawning.value = false;
    }, 1200);
  }
}

// ============================================================
// EF-5 · SECTION V · THE INSTALL CIRCUIT (the Approach · C790) — Requirements LOADED anor
// GENERATED (REGENERATE past a cleared gate) → the target-SCP dropdown → the Final Gate
// (the Install Entourage: honors the gate · turn-over request · focus · dissipate) → the
// Update Circuit (Origin→Informative anor Base←Informative). Every dispatch is a
// DISSIPATING RD-B worker (asWorker · fresh · onboard:false · anchor:false · target=page).
// ============================================================
const installMenuOpen = ref<boolean>(false);
const concernsOpen = ref<boolean>(false);
const installRequirements = ref<InstallRequirementsShape | null>(null);
// C798 · THE STORED BASE — Maintainer.md's Sovereignty Boundary (Home SCP) served by the
// endpoint. Home == self → this page IS the Base; else this page is the Informative and
// the Base is NAMED. The Update Circuit renders the CONCRETE relation, never the
// arbitrary labels: `Base:Name -> Informative:Name` anor `Base:Name <- Informative:Name`.
const homeScpName = ref<string | null>(null);
const selfScpName = computed(() => syncLocality.value?.localScp ?? resolvedScpName.value);
const selfIsBase = computed(
  () => homeScpName.value == null || homeScpName.value === selfScpName.value,
);
const baseScpName = computed(() => (selfIsBase.value ? selfScpName.value : homeScpName.value));
// on the Base page the Informative is the SELECTED target; on an Informative page the
// pair is STORED — self is the Informative and no target selection is needed.
const informativeScpName = computed(() =>
  selfIsBase.value ? (selectedInstallTarget.value.length > 0 ? selectedInstallTarget.value : null) : selfScpName.value,
);
const updateForwardLabel = computed(
  () => `Base:${baseScpName.value ?? '…'} -> Informative:${informativeScpName.value ?? '…'}`,
);
const updateBackwardLabel = computed(
  () => `Base:${baseScpName.value ?? '…'} <- Informative:${informativeScpName.value ?? '…'}`,
);
const requirementsPresent = computed(() => installRequirements.value !== null);
const mapperDispatching = ref<boolean>(false);
const installDispatching = ref<boolean>(false);
const updateDispatching = ref<boolean>(false);
const installNote = ref<string>('');
const selectedInstallTarget = ref<string>('');
// C792 · THE ROSTER FEED (the salvo's Band-2 verdict) — the controller's bridgeJson ref is
// ALREADY reactive + relay-driven (boundScps ∪ installedScps + scpStatuses): zero fetch,
// zero poll, LOCALITY-INDEPENDENT (the ring feed starved any designation without a sync
// registration — the field find).
const installTargetOptions = computed(() => {
  const ctrl = getGlobalScsBridgeController();
  const bj = ctrl?.bridgeJson.value;
  if (!bj) return [];
  // self-identity: the locality snapshot when registered, else the resolved SCP name (a
  // fresh twin has NO sync registration — localScp null would leave self in the list).
  const local = syncLocality.value?.localScp ?? resolvedScpName.value;
  const statuses = (bj.scpStatuses ?? {}) as Record<string, string>;
  const names = new Set<string>([
    ...(bj.installedScps ?? []),
    ...Object.keys(bj.boundScps ?? {}),
  ]);
  return [...names]
    .filter((name) => name !== local && name !== 'template')
    .map((name) => ({
      value: name,
      label: name,
      hint: name in (bj.boundScps ?? {}) ? 'live' : statuses[name] ?? 'offline',
    }))
    .sort((a, b) => a.label.localeCompare(b.label));
});
// C792 · THE REQUIREMENTS SUBSCRIPTION (the relay lane · the 90s heuristic RETIRED) — the
// keyed client-state subscription (the locality-subscription idiom · DIRECT concept path:
// this lane is PER-CONCEPT, so a twin's rename points at the twin's OWN slice — correct).
let installReqPlanner: { conclude: () => void } | null = null;
let installReqSettleTimer: ReturnType<typeof setTimeout> | null = null;
let installReqSettleTries = 0;
function ensureInstallReqSubscription(): boolean {
  if (installReqPlanner) return true;
  const muxium = getGlobalScsBridgeController()?.getCurrentMuxium() as Muxium<ClientMuxiumDeck> | null;
  if (!muxium) return false;
  installReqPlanner = muxium.plan<ClientMuxiumDeck>(
    'suite8ControlInstallRequirementsSubscription',
    ({ staging, stage, d__ }) =>
      staging(() => [
        stage(
          ({ d }) => {
            const record = d.client.d.suite8.k.installRequirementsMap.select() as Record<
              string,
              InstallRequirementsPayload
            >;
            const snap = record[props.suite8Name];
            // absence-is-not-emptiness: no key = not-yet-relayed (keep the ODCF truth);
            // a REAL payload assigns — {present:false} honestly clears the station.
            if (snap) installRequirements.value = snap.present ? snap.requirements : null;
          },
          { selectors: [d__.client.d.suite8.k.installRequirementsMap] },
        ),
      ]),
  );
  return true;
}
function settleInstallReqSubscription(): void {
  if (ensureInstallReqSubscription()) return;
  if (installReqSettleTries >= 40) return;
  installReqSettleTries += 1;
  installReqSettleTimer = setTimeout(settleInstallReqSubscription, 250);
}
async function fetchInstallRequirements(): Promise<void> {
  if (!props.suite8Name) return;
  try {
    const r = await fetch(installRequirementsEndpoint(props.suite8Name));
    const j = (await r.json()) as {
      present: boolean;
      requirements?: InstallRequirementsShape;
      homeScp?: string | null;
      installedIn?: string | null;
    };
    const requirements = j.present && j.requirements ? j.requirements : null;
    installRequirements.value = requirements;
    // C798 · the stored Base rides the same read (Maintainer.md's Home SCP).
    homeScpName.value = typeof j.homeScp === 'string' && j.homeScp.length > 0 ? j.homeScp : null;
    ensureInstallReqSubscription();
    // the dual write — the ODCF snapshot lands in the concept state too (shared truth).
    const muxium = getGlobalScsBridgeController()?.getCurrentMuxium() as Muxium<ClientMuxiumDeck> | null;
    if (muxium) {
      muxium.dispatch(
        muxium.deck.d.client.d.suite8.e.suite8SetInstallRequirements({
          designation: props.suite8Name,
          payload: { present: !!j.present, requirements },
        }),
      );
    }
  } catch {
    /* absent-is-a-state — the GENERATE station renders */
  }
}
onMounted(() => {
  void fetchInstallRequirements();
  settleInstallReqSubscription();
});
async function dispatchRequirementsMapper(): Promise<void> {
  const ctrl = getGlobalScsBridgeController();
  if (!ctrl || mapperDispatching.value) return;
  mapperDispatching.value = true;
  installNote.value = 'The Requirements Mapper is scanning — the gate file lands on completion…';
  try {
    const scpName = (await Promise.race([
      ctrl.getScpName(),
      new Promise<string | null>((r) => setTimeout(() => r(null), 3000)),
    ])) ?? undefined;
    ctrl.triggerSpawnS8Session(
      'Entourage Forge', scpName, true, true, false,
      buildRequirementsMapperVermillion(props.suite8Name), false, false, props.suite8Name,
    );
  } catch {
    installNote.value = 'Could not dispatch the Mapper — is the Bridge running?';
  } finally {
    // C792 · the relay lane carries the result LIVE (the watcher fires on the gate-file
    // write) — this is only the double-click guard, not a scan window.
    setTimeout(() => {
      mapperDispatching.value = false;
    }, 5000);
  }
}
async function dispatchInstallEntourage(): Promise<void> {
  const ctrl = getGlobalScsBridgeController();
  const target = selectedInstallTarget.value;
  if (!ctrl || installDispatching.value || target.length === 0) return;
  // C794b · THE PAIR-ARM SWEEP — the handler's twin of the button guard: PRESENCE unlocks
  // (the user's ruling); the verdict + date inform discretion, never lock.
  if (!requirementsPresent.value) {
    installNote.value = 'The gate stands — generate the Install Requirements first.';
    return;
  }
  installDispatching.value = true;
  installNote.value = `The Install Entourage engages · ${props.suite8Name} → ${target}…`;
  try {
    const scpName = (await Promise.race([
      ctrl.getScpName(),
      new Promise<string | null>((r) => setTimeout(() => r(null), 3000)),
    ])) ?? undefined;
    ctrl.triggerSpawnS8Session(
      'Entourage Forge', scpName, true, true, false,
      buildInstallEntourageVermillion(
        props.suite8Name, syncLocality.value?.localScp ?? scpName ?? 'this SCP', target,
      ),
      false, false, props.suite8Name,
    );
  } catch {
    installNote.value = 'Could not dispatch the Install Entourage — is the Bridge running?';
  } finally {
    setTimeout(() => {
      installDispatching.value = false;
    }, 5000);
  }
}
async function dispatchUpdateCircuit(direction: UpdateCircuitDirection): Promise<void> {
  const ctrl = getGlobalScsBridgeController();
  // C798 · THE ROLE-CORRECT DISPATCH — the stored Base composes the pair (on an
  // Informative page the Base is the NAMED Home; the prior local/target composition
  // wrongly cast every page as the Base).
  const base = baseScpName.value;
  const informative = informativeScpName.value;
  if (!ctrl || updateDispatching.value || !base || !informative) return;
  updateDispatching.value = true;
  installNote.value =
    direction === 'origin-to-informative'
      ? `The Update Circuit engages · Base:${base} -> Informative:${informative}…`
      : `The Update Circuit engages · Base:${base} <- Informative:${informative}…`;
  try {
    const scpName = (await Promise.race([
      ctrl.getScpName(),
      new Promise<string | null>((r) => setTimeout(() => r(null), 3000)),
    ])) ?? undefined;
    ctrl.triggerSpawnS8Session(
      'Entourage Forge', scpName, true, true, false,
      buildUpdateCircuitVermillion(props.suite8Name, direction, base, informative),
      false, false, props.suite8Name,
    );
  } catch {
    installNote.value = 'Could not dispatch the Update Circuit — is the Bridge running?';
  } finally {
    setTimeout(() => {
      updateDispatching.value = false;
    }, 5000);
  }
}


// B-RLM-2 · map the relay snapshot (which carries the extra Scholar fields) down to the exact
// SyncLocalityInfo shape the Effective Locality Law computeds already consume (unchanged).
function snapshotToInfo(snap: Suite8SyncLocalitySnapshot): SyncLocalityInfo {
  return {
    localScp: snap.localScp,
    specified: snap.specified,
    targetScp: snap.targetScp,
    targetHifiStamp: snap.targetHifiStamp,
    targetPatternLibraryStamp: snap.targetPatternLibraryStamp,
    ring: Array.isArray(snap.ring) ? snap.ring : [],
  };
}

// B-RLM-2 · ODCF — one-shot mount hydration (the CadmiumLanding two-phase pattern). The relay only
// reaches WebSocket-connected clients; a fresh page load before any relay fire would see the empty
// default. GET the current locality ONCE and dispatch it into the page muxium so the subscription
// gets an initial value. B3b · dispatch even the Local/empty snapshot (empty is a state).
function hydrateLocalityOnce(): void {
  if (!props.suite8Name) return; // pre-designation mount — the arrival watch re-fires this.
  void fetch(syncLocalityEndpoint(props.suite8Name))
    .then((r) => (r.ok ? r.json() : null))
    .then((data) => {
      if (!data || typeof data !== 'object') return;
      const j = data as SyncLocalityInfo;
      // Compose the state-shape snapshot from the GET (the extra Scholar fields default at the
      // client — they are relay-authoritative; the GET carries the four the component consumes).
      // D-TRL-c · the GET now carries the Scholar fields — map them (the prior defaults
      // poisoned the effective-locality computation on relay-silent pages).
      const jx = j as SyncLocalityInfo & { targetRoot?: unknown; targetLive?: unknown; localLive?: unknown; targetHifiStamp?: unknown; targetPatternLibraryStamp?: unknown };
      const snapshot: Suite8SyncLocalitySnapshot = {
        localScp: typeof j.localScp === 'string' ? j.localScp : null,
        specified: typeof j.specified === 'string' ? j.specified : null,
        targetScp: typeof j.targetScp === 'string' ? j.targetScp : null,
        targetRoot: typeof jx.targetRoot === 'string' ? jx.targetRoot : null,
        targetLive: jx.targetLive === true,
        localLive: jx.localLive === true,
        targetHifiStamp: typeof jx.targetHifiStamp === 'number' ? jx.targetHifiStamp : null,
        targetPatternLibraryStamp: typeof jx.targetPatternLibraryStamp === 'number' ? jx.targetPatternLibraryStamp : null,
        ring: Array.isArray(j.ring) ? j.ring : [],
      };
      // B-RLM-2b · THE DUAL WRITE — the ref sets DIRECTLY (the panel-grade resilient path: the
      // component owns its truth even muxium-less), AND the snapshot dispatches into the muxium
      // when bound (the shared state + every other subscriber). The subscription re-arms here too.
      syncLocality.value = snapshotToInfo(snapshot);
      ensureLocalitySubscription();
      const muxium = getGlobalScsBridgeController()?.getCurrentMuxium() as Muxium<ClientMuxiumDeck> | null;
      if (!muxium) return;
      dispatchClientSyncLocalitySnapshot(muxium, props.suite8Name, snapshot);
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
let armedMuxium: unknown = null;
// B-RLM-2b · ARM-ON-BIND — Vue mounts children BEFORE the parent Landing's onMounted binds the
// muxium (setMuxium), so a mount-time arm finds null and MUST retry: a bounded 250ms settle (the
// SOE boot-coalescer class · stops the beat it arms · ~10s cap) covers the binding window, and
// every hydrate re-attempts opportunistically. Without this the subscription silently never arms
// and Section I goes uncontrollable (the field find).
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
    'suite8ControlLocalitySubscription',
    ({ staging, stage, d__ }) =>
      staging(() => [
        stage(
          ({ d }) => {
            const record = readClientSyncLocalities(d) as Record<
              string,
              Suite8SyncLocalitySnapshot
            >;
            const snap = record[props.suite8Name];
            // B-RLM-2c · ABSENCE IS NOT EMPTINESS — an un-relayed record (fresh connect ·
            // BOCR dormant) has NO key for this designation; writing null here CLOBBERS the
            // ODCF dual-write and blanks the rows until a POST round-trips (the field find:
            // nothing visible until 'Local' was selected). Only a REAL snapshot assigns —
            // the true 'no locality' is a snapshot with specified:null, which IS a snapshot.
            if (snap) syncLocality.value = snapshotToInfo(snap);
          },
          { selectors: [clientSyncLocalitiesSelector(d__)] },
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
  // D-EF-PAGE-PING-b · the focus refresh is the RE-PROBE lane: clear the determinations so
  // a target's turn-over (its island truth changing) re-reads on the next tab-in.
  pagePresence.value = {};
  hydrateLocalityOnce();
}

// B-RLM-2d · THE DESIGNATION-ARRIVAL RE-HYDRATE (the C486 class, ported) — pages whose
// designation hydrates ASYNC (CadmiumLanding's cadmiumDesignationName starts EMPTY) mount
// this Control BEFORE the name exists: the mount ODCF fires against '' and lands nothing,
// and NOTHING retried — the bare 'Local' render that teaches no mechanism (the field find).
// The ShatteriteMenu carries this watch (C486); the Control now does too: the moment the
// real designation lands, the ODCF re-fires and the default render teaches — the current
// real Locale selected (Local · <localScp>) with every possible SCP standing beside it.
watch(
  () => props.suite8Name,
  (name, prior) => {
    if (!name || name === prior) return;
    hydrateLocalityOnce();
  },
);

onMounted(() => {
  if (typeof window === 'undefined') return;
  settleLocalitySubscription();
  hydrateLocalityOnce();
  window.addEventListener('focus', refreshAll);
  document.addEventListener('visibilitychange', refreshAll);
});
onBeforeUnmount(() => {
  // V-4g · the C822 unmount null-push RETIRED — the PAGE owner holds the face now; a panel
  // clearing it on close was exactly the drawer-close revert the user field-found.
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
  if (installReqPlanner) {
    installReqPlanner.conclude();
    installReqPlanner = null;
  }
  if (installReqSettleTimer !== null) {
    clearTimeout(installReqSettleTimer);
    installReqSettleTimer = null;
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
// V-4c · THE FACE PUSH — this Control owns the live locality truth (its HTTP lanes work on
// ANY island); push the face-grade snapshot to the shared controller so the held toolbar
// face reflects it without assuming a concept slice. Null push = fall back to the seed.
watch(
  syncLocality,
  (s) => {
    // V-4g · TRUTH-ONLY PUSH — the page owner holds the face; this panel reinforces with
    // its own hydrated truth but NEVER writes null over the owner (the mount-null clobber).
    if (!s) return;
    console.log('[S8-LOC] control FACE PUSH · specified=', s.specified, '· localScp=', s.localScp);
    getGlobalScsBridgeController()?.setCurrentS8Locality({
      localScp: s.localScp ?? null,
      specified: s.specified ?? null,
      targetScp: s.targetScp ?? null,
      targetHifiStamp: s.targetHifiStamp ?? null,
      targetPatternLibraryStamp: s.targetPatternLibraryStamp ?? null,
      ring: (s.ring ?? []).map((e) => ({ scpName: e.scpName, status: e.status })),
    });
  },
);

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
    const r = await fetch(syncLocalityEndpoint(props.suite8Name), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ specified: scpName }),
    });
    console.log('[S8-LOC] control CHOOSE POST · specified=', scpName, '· status=', r.status);
    if (!r.ok) {
      const j = (await r.json().catch(() => null)) as { error?: string } | null;
      gateNote.value = j?.error ?? 'the locality write was refused';
    }
  } catch (err) {
    gateNote.value = String(err).slice(0, 120);
  } finally {
    refreshAll();
    // V-4g · the POST echo — the page owner re-GETs immediately (no relay dependence).
    getGlobalScsBridgeController()?.triggerS8LocalityRefresh();
  }
}

// B1b · DSP-2a · drawerRows / spawnScp / busyScp REMOVED — the interim per-row Spawn drawer is
// replaced WHOLESALE by <ScpManagementPanel compact /> (the full helm off the same bridge lanes).
</script>

<template>
  <!-- EF-2 · B1 · THE FLAIR EXCHANGE (root pane · reactive) — forge-open trades the base Pewter
       vessel for the transparent glass treatment (RD-E §V · the Suite 8 vessel · the ground shows
       through so the inner prismatic Forge body reads as the featured surface); forge-closed restores
       the base `hifi-pane` Pewter frame. The inner menu carries the actual prismatic flair
       (.s8c-forge-flair · the ring + glow, extracted global from Suite8HomeLanding's forge zone). -->
  <!-- D-EF-BREAKOUT · THE FUNCTIONAL BACKING LAW (Pewter conference): the root NO LONGER
       exchanges — each chosen space wears the identity of the system whose functionality it
       carries, BOUNDED to its zone (§II = the SCS-Bridge's cobalt glass · §IV = EF's
       prismatic + transparent recede · §I = the Control's own Pewter voice). -->
  <section class="s8-control hifi-pane">
    <header class="s8c-head">
      <span class="s8c-eyebrow hifi-mono">{{ props.suite8Name }}</span>
      <h3 class="s8c-title hifi-heading">SUITE 8 CONTROL</h3>
    </header>

    <!-- MD-S8PM · PM-4 · THE PANEL VERSION ROW — the page's minted s8 counter beside the installed
         system's s8 (the installed bridge package.json is the source of truth · the update-order
         law), plus the ALWAYS-ENABLED update control (THE ALWAYS-ENABLED LAW: enabled
         current anor behind). Colored amber when s8PageBehind (the SAME amber as the toolbar
         toggle border · quiet when current). Renders ALWAYS (floor-0 pages show PAGE #0 — the
         honest behind state). The control fires engageVersionedUpdate (the PM-5 seam · a stub
         until PM-5 wires the Forge Vermillion). THE NO-RED LAW: never a badge input. -->
    <div class="s8c-version-row" :class="{ 's8c-version-row--behind': s8PageBehindValue }">
      <span class="s8c-version-pair hifi-mono">
        PAGE {{ pageS8Display }} · SYSTEM {{ installedS8Display }}
      </span>
      <button
        type="button"
        class="s8c-version-update-btn hifi-mono"
        :class="{ 's8c-version-update-btn--behind': s8PageBehindValue }"
        title="Update this Suite 8 page from the Template Suite 8 (always available — enabled whether current or behind)."
        @click="engageVersionedUpdate"
      >
        <i class="fa-solid fa-arrows-rotate" aria-hidden="true"></i>
        <span>S8 UPDATE</span>
      </button>
    </div>

    <!-- SECTION I · THE LOCALITY -->
    <div class="s8c-section">
      <div class="s8c-current" :class="{ 's8c-specified': isSpecified }">
        <span class="s8c-label hifi-mono">LOCALITY</span>
        <span class="s8c-value">{{ localityLabel }}</span>
      </div>
      <div class="s8c-rows">
        <!-- V-4d · THE BASE ROW — Local is the ALWAYS-GIVEN Base (never an option the user
             must earn): it renders as the standing ground; clicking it REVERTS a specified
             locality back to the Base. -->
        <button
          class="s8c-row s8c-row-base"
          :class="{ 's8c-row-current': !syncLocality?.specified }"
          :title="syncLocality?.specified
            ? `Revert to the Base — this page composes on ${syncLocality?.localScp ?? 'its own SCP'}`
            : 'The Base locality — always given (this page composes here)'"
          @click="chooseLocality(null)"
        >
          <span class="s8c-bead s8c-bead-live"></span>
          Base · Local{{ syncLocality?.localScp ? ` · ${syncLocality.localScp}` : '' }}
        </button>
        <button
          v-for="entry in visibleRing"
          :key="entry.scpName"
          class="s8c-row"
          :class="{ 's8c-row-current': syncLocality?.specified === entry.scpName }"
          :disabled="!ringRowLive(entry) || pagePresence[entry.scpName] !== true"
          :title="!ringRowLive(entry)
            ? 'Spawn this SCP to enable its locality (the Live Locality Law)'
            : pagePresence[entry.scpName] === true
              ? `Set this page's locality to ${entry.scpName}`
              : pagePresence[entry.scpName] === false
                ? 'This SCP does not carry this page'
                : 'Confirming this SCP carries this page…'"
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
         /bridge-roster poll + the full helm (Spawn/Focus/Exit/Multiply/Delete + the bars).
         V-3 · THE TOOLBAR BREAKOUT — v-if="!noScpSection": the Suite8ControlDrawer suppresses §II
         (:no-scp-section="true") since the toolbar carries the dedicated SCP Management drawer; an
         absent prop coerces false, so every existing mount renders §II exactly as today. -->
    <div v-if="!noScpSection" class="s8c-section">
      <!-- D-EF-BREAKOUT-b · TOTAL STYLE: the button wears the Bridge's cobalt AT REST. -->
      <button
        class="s8c-drawer-toggle s8c-scp-backing-btn hifi-mono"
        :class="{ 's8c-drawer-toggle--scp-open': drawerOpen }"
        @click="drawerOpen = !drawerOpen"
      >
        {{ drawerOpen ? '▾' : '▸' }} SCPs
      </button>
      <!-- D-EF-BREAKOUT · THE SCP BACKING — the drawer's functionality IS the Session
           Manager's; the opened space wears the SCS-Bridge's identity (dark glass under a
           cobalt working-light) AND relays the pewter text tokens the panel's chrome consumes
           (the token-severed compact mount cured — the Law proven in CSS inheritance). -->
      <div v-if="drawerOpen" class="s8c-drawer s8c-scp-backing">
        <ScpManagementPanel compact />
      </div>
    </div>

    <!-- SECTION IV · THE ENTOURAGE FORGE — D-FM · FM-1 · 1A · EXTRACTED WHOLESALE into the
         shared S8-class widget (src/concepts/vue/components/S8ForgeMenu.vue · the lent-shapes
         stratum · OUTSIDE the mint copy surface). THIS IS THE PANEL SEAT: allowRemove is
         OMITTED (default disabled — FM-6c: the panel placement is permanent, the
         always-accessible re-access surface; legacy target-less conductions stay reachable
         via its 'unlabeled' pill). The flair exchange, the ONE MOTION engage (now PAGE-SCOPED
         via findLiveS8ConductionForTarget — FM-2), the Two-State Door, the Update-from-
         Template row, the Previous Conductions pills, and the RD rows all live in the widget. -->
    <!-- The widget prop is the token-free `designation` (the BO-1 law — this mount line is
         INSIDE the copy surface, so a `suite8`-tokened attribute would be mint-rewritten
         against the never-copied widget; the VALUE expr renames consistently with this
         component's own prop). -->
    <S8ForgeMenu :designation="props.suite8Name" :worked="props.worked" />

    <!-- SECTION V · THE INSTALL CIRCUIT (EF-5 · the Approach C790) — Requirements →
         Target → the Final Gate (the Install Entourage) → the Update Circuit. -->
    <div class="s8c-section s8c-install-section">
      <button class="s8c-install-toggle hifi-mono" @click="installMenuOpen = !installMenuOpen">
        {{ installMenuOpen ? '▾' : '▸' }} S8 INSTALL
      </button>
      <div v-if="installMenuOpen" class="s8c-install-body">
        <!-- STATION 1 · REQUIREMENTS (LOADED anor GENERATED · REGENERATE past a cleared gate) -->
        <div class="s8c-install-station">
          <span class="s8c-install-eyebrow hifi-mono">Requirements</span>
          <template v-if="requirementsPresent">
            <p class="s8c-install-line">
              Gate {{ installRequirements?.installReady ? 'CLEARED' : 'HELD' }} ·
              {{ installRequirements?.npmRequirements?.length ?? 0 }} npm requirement(s) ·
              scanned {{ new Date(installRequirements?.scannedAt ?? 0).toLocaleString() }}
            </p>
            <ul
              v-if="(installRequirements?.npmRequirements?.length ?? 0) > 0"
              class="s8c-install-reqs"
            >
              <li v-for="p in installRequirements?.npmRequirements" :key="p.name" class="hifi-mono">
                {{ p.name }}@{{ p.version }}<span v-if="!p.inTemplateBaseline"> · page-added</span>
              </li>
            </ul>
            <!-- C794 · THE CONCERNS (user discretion's evidence — the Mapper's install
                 intelligence; advisory, never a lock). -->
            <button
              v-if="(installRequirements?.concernNotes?.length ?? 0) > 0"
              type="button"
              class="s8c-install-btn"
              @click="concernsOpen = !concernsOpen"
            >
              {{ concernsOpen ? 'Hide' : 'Show' }} concerns ({{ installRequirements?.concernNotes?.length }})
            </button>
            <ul v-if="concernsOpen" class="s8c-install-concerns">
              <li v-for="(n, i) in installRequirements?.concernNotes" :key="i">{{ n }}</li>
            </ul>
          </template>
          <p v-else class="s8c-install-line s8c-install-line--muted">
            No gate file — generate the Install Requirements to unlock the final gate.
          </p>
          <button
            type="button"
            class="s8c-install-btn"
            :disabled="mapperDispatching"
            @click="dispatchRequirementsMapper"
          >
            {{ mapperDispatching ? 'Scanning…' : requirementsPresent ? 'Regenerate Requirements' : 'Generate Requirements' }}
          </button>
        </div>
        <!-- STATION 2 · THE TARGET (ring-fed dropdown · the SCP to move this Suite 8 onto) -->
        <div class="s8c-install-station">
          <span class="s8c-install-eyebrow hifi-mono">Target SCP</span>
          <ScsDropdown
            :options="installTargetOptions"
            :model-value="selectedInstallTarget"
            class="s8c-install-dropdown"
            @update:model-value="(v) => { selectedInstallTarget = v ?? ''; }"
          />
        </div>
        <!-- STATION 3 · THE FINAL GATE (the Install Entourage · turn-over → focus → dissipate) -->
        <div class="s8c-install-station">
          <span class="s8c-install-eyebrow hifi-mono">The Final Gate</span>
          <!-- C794 · THE PRESENCE-UNLOCKS LAW (the user's ruling): the gate unlocks on the
               requirements being HELD (the file present) + a target — the verdict and the
               generation date INFORM user discretion, they never re-lock the gate. -->
          <button
            type="button"
            class="s8c-install-btn s8c-install-btn--gate"
            :disabled="installDispatching || !requirementsPresent || selectedInstallTarget.length === 0"
            @click="dispatchInstallEntourage"
          >
            <i class="fa-solid fa-arrow-right-to-bracket" aria-hidden="true"></i>
            <span>{{ installDispatching ? 'Engaging…' : `Install onto ${selectedInstallTarget || '…'}` }}</span>
          </button>
        </div>
        <!-- STATION 4 · THE UPDATE CIRCUIT (EF-5d · the epoch's last refinement) -->
        <div class="s8c-install-station">
          <span class="s8c-install-eyebrow hifi-mono">The Update Circuit</span>
          <!-- C798 · THE CONCRETE RELATION (the stored Base renders · never arbitrary
               labels): on the Base page the Informative is the selected target; on an
               Informative page the pair is STORED — no selection needed. -->
          <div class="s8c-install-update-row">
            <button
              type="button"
              class="s8c-install-btn"
              :disabled="updateDispatching || !baseScpName || !informativeScpName"
              @click="dispatchUpdateCircuit('origin-to-informative')"
            >{{ updateForwardLabel }}</button>
            <button
              type="button"
              class="s8c-install-btn"
              :disabled="updateDispatching || !baseScpName || !informativeScpName"
              @click="dispatchUpdateCircuit('informative-to-base')"
            >{{ updateBackwardLabel }}</button>
          </div>
        </div>
        <p v-if="installNote" class="s8c-install-note">{{ installNote }}</p>
      </div>
    </div>

    <!-- SECTION III · THE DOCUMENTATION (the B3 fold seat · reserved — §IV is the Forge's) -->
  </section>
</template>

<style scoped>
/* THE SUITE 8 CONTROL (Pewter · D-DSP2-PEWTER-CONTROL-RD) — the Featured pewter frame;
   the glow informs (green = Local/live · fuchsia = Specified), never a flooded fill. */
.s8-control {
  padding: 0.9rem 1.1rem;
  border-radius: 12px;
}
/* EF-5 · SECTION V · THE INSTALL CIRCUIT — the station workflow (the s8c pewter idiom). */
.s8c-install-toggle {
  padding: 0.3rem 0.7rem;
  font-size: 0.72rem;
  letter-spacing: 0.06em;
  color: rgba(232, 238, 244, 0.85);
  border: 1px solid rgba(255, 255, 255, 0.22);
  border-radius: 8px;
  background: rgba(10, 14, 18, 0.5);
  cursor: pointer;
}
.s8c-install-toggle:hover {
  border-color: rgba(255, 255, 255, 0.4);
}
.s8c-install-body {
  margin-top: 0.6rem;
  display: flex;
  flex-direction: column;
  gap: 0.7rem;
}
.s8c-install-station {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}
.s8c-install-eyebrow {
  font-size: 0.64rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: rgba(170, 220, 255, 0.75);
}
.s8c-install-line {
  margin: 0;
  font-size: 0.74rem;
  color: rgba(232, 238, 244, 0.85);
}
.s8c-install-line--muted {
  color: rgba(208, 218, 228, 0.55);
}
.s8c-install-reqs {
  margin: 0;
  padding-left: 1.1rem;
  font-size: 0.7rem;
  color: rgba(236, 242, 248, 0.8);
}
.s8c-install-btn {
  align-self: flex-start;
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.28rem 0.7rem;
  font-size: 0.72rem;
  color: rgba(236, 242, 248, 0.92);
  border: 1px solid rgba(255, 255, 255, 0.22);
  border-radius: 8px;
  background: rgba(10, 14, 18, 0.55);
  cursor: pointer;
}
.s8c-install-btn:hover:not(:disabled) {
  background: rgba(30, 38, 46, 0.75);
}
.s8c-install-btn:disabled {
  opacity: 0.45;
  cursor: default;
}
.s8c-install-btn--gate {
  border-color: rgba(170, 220, 255, 0.5);
  background: rgba(40, 70, 100, 0.3);
}
.s8c-install-update-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
}
.s8c-install-note {
  margin: 0;
  font-size: 0.7rem;
  color: rgba(170, 220, 255, 0.8);
}
.s8c-install-concerns {
  margin: 0.35rem 0 0;
  padding-left: 1.1rem;
  max-height: 14rem;
  overflow-y: auto;
  font-size: 0.66rem;
  line-height: 1.5;
  color: rgba(208, 218, 228, 0.65);
}

/* EF-2 · B1 · THE FLAIR EXCHANGE — the base Pewter frame rides ONLY the closed state so the swapped
   pane treatment governs when open. Closed → this frame (over the base .hifi-pane); open → the
   .hifi-pane-transparent glass vessel shows through (its border/background take, uncontested). */
.s8-control {
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
/* MD-S8PM · PM-4 · THE VERSION ROW — the s8 counters + the always-enabled update control. The
   row wears the Pewter neutral voice AT REST (current) and shifts amber when behind (the SAME
   amber alert token as the toolbar toggle border · rgba(249, 115, 22, *)). Renders ALWAYS. */
.s8c-version-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.6rem;
  margin-bottom: 0.6rem;
  padding: 0.3rem 0.6rem;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.02);
}
.s8c-version-row--behind {
  border-color: rgba(249, 115, 22, 0.6);
  background: rgba(249, 115, 22, 0.06);
}
.s8c-version-pair {
  font-size: 0.62rem;
  letter-spacing: 0.06em;
  color: rgba(255, 255, 255, 0.6);
}
.s8c-version-row--behind .s8c-version-pair {
  color: rgb(253, 186, 116);
}
/* THE UPDATE CONTROL — the Pewter forge-button idiom AT REST (quiet · current), amber when
   behind. ALWAYS ENABLED (never :disabled — THE ALWAYS-ENABLED LAW). */
.s8c-version-update-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.35rem 0.7rem;
  border-radius: 4px;
  font-family: var(--font-heading, 'Orbitron', sans-serif);
  font-size: 0.6rem;
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
  flex-shrink: 0;
}
.s8c-version-update-btn:hover {
  filter: brightness(1.08);
}
.s8c-version-update-btn--behind {
  color: #1a0f08;
  background: #fdba74;
  border-top-color: #ffd8a8;
  border-right-color: #ffd8a8;
  border-bottom-color: #c2410c;
  border-left-color: #c2410c;
  box-shadow: -1px 1px 4px rgba(194, 65, 12, 0.55);
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
/* layout only — the ground belongs to the SCP BACKING (the Functional Backing Law) */
.s8c-drawer {
  margin-top: 0.35rem;
  display: flex;
  flex-direction: column;
  gap: 3px;
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
