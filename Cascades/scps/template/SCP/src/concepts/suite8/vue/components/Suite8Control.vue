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
// EF-2 · THE ENTOURAGE FORGE FOLD (§IV) — the engagement machinery ported from Suite8HomeLanding's
// forge zone (RD-E §I). The model catalog (offscreen-safe ScsDropdown feed) + the rename-proof anchor
// contract (findLiveS8Session / filterS8Sessions · the ONE MOTION law) + the model catalog labels.
import { SCS_AVAILABLE_MODELS, SCS_DEFAULT_MODEL, scsModelLabel } from '../../../scsBridge/model/scsModelCatalog.model';
import { findLiveS8Session, filterS8Sessions } from '../../../scsBridge/model/s8Anchor.model';
import ScsDropdown from '../../../vue/components/ScsDropdown.vue';
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
// EF-3′ · THE TWO-STATE DOOR (ported from Suite8HomeLanding W2) — the branch-aware Turn-Over
// leg: forging modifies this Suite's ground, so on a NON-working branch the door is the TURN
// OVER request (the D-BN canonical roles.b identity), on a working (B) branch the Engage.
import { getGlobalGitmController, GITM_CONTROLLER_KEY } from '../../../gitm/gitmController';
import { isWorkingBranchPer } from '../../../gitm/gitm.type';
import {
  writeGitmTurnoverProgress,
  GITM_TURNOVER_DEADLINE_MS,
} from '../../../../model/gitmTurnover.model';
import { showBridgeStandby } from '../../../webSocketClient/model/bridgeStandbyOverlay.model';
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
  readConductionTarget,
} from '../../../../model/scpLocalityClientAccess.model';
// EF-5 · THE INSTALL CIRCUIT (held · token-free — survives every twin's rename): the gate-file
// schema + the three dissipating Vermillion builders (Mapper · Install Entourage · Update Circuit).
import {
  installRequirementsEndpoint,
  buildRequirementsMapperVermillion,
  buildInstallEntourageVermillion,
  buildUpdateCircuitVermillion,
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
// EF-2 · SECTION IV · THE ENTOURAGE FORGE — THE HARD-CODED CONFIG
// The user's ruling: 'managed ourselves internal to the component'. This object is the
// component-owned, self-managed source of truth for the Forge fold — NO external registry, NO
// server round-trip. `blankSlateLaunch` is the EF-4 launch-option governance SEAT (the WIRING is
// EF-4's band — Cadmium prunes it OFF · the Template toggles it ON; the seat exists NOW, unread).
// `menu` is the five hard-coded RD entries drawn from the EF-RD-CORPUS Menu Entry sections (RD-A..E) —
// each { label · line · rdKey · shape } where `shape` is the adaptation-shape string the row primes.
const ENTOURAGE_FORGE_CONFIG = {
  // EF-4 · the launch-option governance seat. Cadmium prunes · Template toggles ON. Unread at EF-2.
  blankSlateLaunch: false,
  menu: [
    {
      rdKey: 'RD-A',
      label: 'Topics Registry + Live Article Bulletin',
      line: 'A user-curated topic list synced to a live folder-tree of research articles, merged and relayed to the client in real-time.',
      shape:
        'Topics Registry-Driven Content Tree with Live Folder-Tree Relay — 2 relay configs + 4 qualities (2 Huirth-base, 2 client) + muxonomy wiring + the Frontier component + 1 Sync registration.',
    },
    {
      rdKey: 'RD-B',
      label: 'Research Dispatch + Workers',
      line: 'Single or full-salvo fleet dispatch of ephemeral researchers; the bridge serializes the fleet, the page observes via the session registry.',
      shape:
        'A pure Vermillion builder feeding ONE batch enqueue — AUTHOR ONLY the Vermillion builder + output contract; spec stamping, batch, observatory, locality resolution ALL inherited.',
    },
    {
      rdKey: 'RD-C',
      label: 'The Relay Lanes',
      line: 'The reactive spine every surface rides: file → watcher → Huirth state → SMRP → client state → subscription → ref.',
      shape:
        'The Relay Lane Class — the 6-step registration checklist (model config · Huirth Base quality · Relay quality · muxonomy · Huirth principles · Landing subscription+ODCF) under THE FOUR LAWS (empty-is-a-state · absence-is-not-emptiness · unlinkDir coverage · no boot-skips).',
    },
    {
      rdKey: 'RD-D',
      label: 'Sync Library + Locality',
      line: 'The diametric capability: view or operate another live SCP’s Cascade content from your Suite 8 page.',
      shape:
        'The vault + the 3-stage usher machine + the three guards + the locality relay — ONE entry in KNOWN_SURFACE_REGISTRATIONS (+ optional empty form); everything else inherited at zero cost. Hard Live Gate: the target must be spawned + online.',
    },
    {
      rdKey: 'RD-E',
      label: 'The Forge + Actualization',
      line: 'The Suite 8 creation system: the forge predicate + the 4-step create pipeline + the 6-band creation Vermillion.',
      shape:
        'THE GROUND FOR EF-2..4 — the fold seat (Suite8Control §IV) · the flair exchange (transparent ↔ the Forge’s prismatic) · the launch toggle seats · THE NAMED BIAS attach seat (Band 4.5 — page-creation guidance).',
    },
  ],
} as const;

// ============================================================
// EF-2 · SECTION IV · THE FORGE ENGAGEMENT STATE (ported from Suite8HomeLanding RD-E §I)
// The toggle governs §IV visibility (the §II SCPs-drawer idiom). forgeLaunchEngaged drops the
// prismatic PULSE on first hover/utilization (session-only · no storage). forgeSpawning guards the
// ONE MOTION engage; selectedModel persists to the controller (setSpawnModel) so the NEXT spawn pins.
// ============================================================
// EF-3′ · 2A · a FRESH page (worked=false) boots the Forge section OPEN — the Entourage
// Forge greets every minted page; a WORKED page boots collapsed (user-toggled thereafter).
const forgeMenuOpen = ref<boolean>(!props.worked);
const forgeLaunchEngaged = ref<boolean>(false);
const forgeSpawning = ref<boolean>(false);
const forgeSpawnNote = ref<string>('');
const selectedModel = ref<string>(SCS_DEFAULT_MODEL);
const selectedModelLabel = computed<string>(
  () => scsModelLabel(selectedModel.value) ?? selectedModel.value,
);
// EF-2 · the RD-menu clipboard-prime note (the fire decision · see below).
const forgeMenuNote = ref<string>('');

// EF-2 · the offscreen-safe ScsDropdown feed (the Suite8HomeLanding modelDropdownOptions idiom).
const modelDropdownOptions = computed(() =>
  SCS_AVAILABLE_MODELS.map((m) => ({ value: m.id, label: m.label, hint: m.tier, title: m.blurb })),
);

// W1 · THE PULSE — drops on first hover/utilization (session ref · no storage).
function settleForgeLaunchPulse(): void {
  if (!forgeLaunchEngaged.value) forgeLaunchEngaged.value = true;
}

// MD-9 · D-MC-3 · persist the model choice to the controller (→ pendingSpawnModel · read at spawn).
function handleForgeModelChange(): void {
  getGlobalScsBridgeController()?.setSpawnModel(selectedModel.value);
}

// ============================================================
// EF-2 · THE FORGE ENGAGEMENT ROW — THE ONE MOTION LAW (ported VERBATIM from Suite8HomeLanding's
// engageEntourageForge · RD-E §I ¶2). A LIVE Entourage Forge session for this suite8Name is FOCUSED,
// never duplicated; ELSE a fresh anchor spawn (fresh:true). The controller triggers are REUSED EXACTLY
// (getGlobalScsBridgeController lanes) — findLiveS8Session → triggerFocusSession · else
// triggerSpawnS8Session. The Turn-Over leg is NAMED as an EF-3 remainder (needs the gitm branch read).
// ============================================================
async function engageEntourageForge(): Promise<void> {
  console.log('[Forge Engage · Control] clicked');
  const ctrl = getGlobalScsBridgeController();
  if (!ctrl || forgeSpawning.value) return;
  settleForgeLaunchPulse();
  forgeSpawning.value = true;
  forgeSpawnNote.value = '';
  try {
    // THE TIMEOUT RACE (C375) — a never-settling getScpName must never hang the dispatch.
    const scpName = (await Promise.race([
      ctrl.getScpName(),
      new Promise<string | null>((r) => setTimeout(() => r(null), 3000)),
    ])) ?? undefined;
    // THE ONE MOTION — a live Forge conduction for THIS SCP is FOCUSED, never duplicated.
    const liveForge = findLiveS8Session(ctrl.sessionsList.value ?? [], 'Entourage Forge', scpName);
    if (liveForge) {
      console.log('[Forge Engage · Control] ONE MOTION · live Forge found · focusing · ulid=', liveForge.id);
      ctrl.triggerFocusSession(liveForge.id);
      forgeSpawnNote.value = 'Focused the running Forge.';
      return;
    }
    // ELSE — a fresh anchor spawn (fresh:true · the bridge re-claims THIS page's anchor).
    // EF-3′ · 1A · THE TARGET S8 THREAD + THE LEADING VERMILLION ASPECT — the conduction is
    // COMMISSIONED to formalize THIS page: the target rides the registry entry (the Previous
    // Conductions per-page filter) AND leads the spawn Vermillion as the initial directive.
    const forgeDirective = [
      `THE ENTOURAGE FORGE COMMISSION · target Suite 8 page: "${props.suite8Name}".`,
      `This conduction formalizes the "${props.suite8Name}" page — research its domain, build out the page, and hand the Suite back ready.`,
      'THE SIGN-OFF (V-4): the Suite 8 Control rides the toolbar drawer now — there is NO inline mount to flip. When the page is sufficiently developed, record the completion in the page\'s Cascades/Working notes and alert for turn-over; the drawer boots the Forge section collapsed by design.',
    ].join('\n');
    ctrl.triggerSpawnS8Session('Entourage Forge', scpName, false, true, false, forgeDirective, true, true, props.suite8Name);
    forgeSpawnNote.value = 'Entourage Forge engaged. It will research and build out this Suite.';
  } catch {
    forgeSpawnNote.value = 'Could not engage the Entourage Forge — is the Bridge running?';
  } finally {
    setTimeout(() => {
      forgeSpawning.value = false;
    }, 1200);
  }
}

// ============================================================
// EF-3′ · 3A · THE PREVIOUS-CONDUCTIONS ROW (ported from Suite8HomeLanding W3 · C386) —
// this SCP's OFFLINE Entourage Forge sessions, TARGET-AWARE: a conduction shows on the page
// it was commissioned to formalize (targetSuite8Name === suite8Name) anor on every page when
// target-less (legacy). Up to 3 · re-openable (triggerEngageSession · the resume leg).
// ============================================================
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
// EF-3′d · THE PILL FILTER SYSTEM — the SCP-wide pool of OFFLINE Forge conductions renders
// under target PILLS (one per distinct commissioned page + 'unlabeled' for pre-thread
// legacy). AUTO-SELECTS this page's own pill; any prior remains referenceable from the same
// page (user orientation with their own work). Every target read rides the HELD model
// (EF-3′c — a twin's rename never touches the registry field).
const conductionPool = computed(() => {
  const list = getGlobalScsBridgeController()?.sessionsList.value ?? [];
  const scp = resolvedScpName.value;
  return filterS8Sessions(list, 'Entourage Forge')
    .filter((s) => (scp === null || s.scpName === scp) && s.status === 'offline');
});
const selectedConductionTarget = ref<string>(props.suite8Name);
watch(
  () => props.suite8Name,
  (v) => {
    // the designation-arrival re-sync — the auto-select follows the page's own identity.
    selectedConductionTarget.value = v;
  },
);
const conductionTargets = computed(() => {
  // the page's own pill leads (the auto-selected home); the rest in pool order.
  const targets = new Set<string>([props.suite8Name]);
  for (const s of conductionPool.value) targets.add(readConductionTarget(s) ?? 'unlabeled');
  return [...targets];
});
const previousForgeConductions = computed(() =>
  conductionPool.value
    .filter((s) => (readConductionTarget(s) ?? 'unlabeled') === selectedConductionTarget.value)
    .slice(0, 3),
);
function shortUlid(id: string): string {
  return id.length > 8 ? id.slice(-8) : id;
}
function conductionModelLabel(model: string | undefined): string {
  return model ? scsModelLabel(model) ?? model : 'default model';
}
function reopenConduction(id: string): void {
  console.log('[Forge Previous · Control] re-opening conduction · ulid=', id);
  getGlobalScsBridgeController()?.triggerEngageSession(id);
}

// ============================================================
// EF-3′ · THE TWO-STATE DOOR (ported from Suite8HomeLanding W2 VERBATIM · branch-aware) —
// on a NON-working branch (the A side · the safe default when the branch read is absent)
// the door is the TURN OVER request; on a working (B) branch it is the Engage.
// ============================================================
const gitmControllerForDoor = inject(GITM_CONTROLLER_KEY) ?? getGlobalGitmController();
const scsBridgeControllerForDoor =
  inject(SCS_BRIDGE_CONTROLLER_KEY) ?? getGlobalScsBridgeController();
const currentBranch = computed<string>(
  () => gitmControllerForDoor?.gitmJson.value?.currentBranch ?? '',
);
const onWorkingB = computed<boolean>(() =>
  isWorkingBranchPer(currentBranch.value, gitmControllerForDoor?.gitmJson.value),
);
const showTurnOverDoor = computed<boolean>(() => !onWorkingB.value);
const turnOverSpawning = ref<boolean>(false);
const turnOverNote = ref<string>('');
async function requestTurnOverToB(): Promise<void> {
  const sb = scsBridgeControllerForDoor;
  if (!sb || turnOverSpawning.value) return;
  settleForgeLaunchPulse();
  turnOverSpawning.value = true;
  turnOverNote.value = '';
  try {
    const fromBranch = currentBranch.value.length > 0 ? currentBranch.value : 'a';
    // D-BN · THE CANONICAL MINT — `b/<fromBranch>-<uuid>`, fromBranch VERBATIM.
    const newBranch = `b/${fromBranch}-${crypto.randomUUID()}`;
    showBridgeStandby('sword-b');
    writeGitmTurnoverProgress({
      source: 'B',
      overlayVariant: 'sword-b',
      turnClass: 'sword',
      deadline: Date.now() + GITM_TURNOVER_DEADLINE_MS,
      stableA: fromBranch,
      bridgeEndpoint: sb.bridgeJson.value?.endpoint ?? '',
      scpName: (await sb.getScpName()) ?? undefined,
    });
    // ONE dispatch — git switch -c carries the dirty tree onto B; nodemon restarts on B.
    sb.triggerHardTurnOver('B', newBranch, true);
    turnOverNote.value = 'Turning over to B — the SCP restarts on your working branch…';
  } catch {
    turnOverNote.value = 'Could not turn over to B — is the Bridge running?';
  } finally {
    setTimeout(() => {
      turnOverSpawning.value = false;
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

// ============================================================
// EF-2 · THE RD MENU FIRE — CLIPBOARD-PRIME (the fire decision · read the fire lane).
// DECISION: the ShatteriteMenu option-fire lane (handleOption + primeSend) is HEAVY dispatch
// machinery — /suite8-skill-prime fetch → SORD envelope → triggerSendMessage to a LIVE anchor, gated
// on anchorAlive/optionsEnabled. That extraction is EF-3-class (live-anchor dispatch of the adaptation
// shape). At EF-2 the five rows PRIME CHEAPLY: copy the row's adaptation-shape string to the clipboard.
// EF-3 REMAINDER: dispatch the shape to the live Forge anchor via the ShatteriteMenu fire lane.
async function primeForgeMenuEntry(entry: { rdKey: string; label: string; shape: string }): Promise<void> {
  settleForgeLaunchPulse();
  const text = `${entry.rdKey} · ${entry.label}\n\n${entry.shape}`;
  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      forgeMenuNote.value = `${entry.rdKey} adaptation shape copied to clipboard.`;
    } else {
      forgeMenuNote.value = `${entry.rdKey}: clipboard unavailable in this context.`;
    }
  } catch {
    forgeMenuNote.value = `${entry.rdKey}: could not copy to clipboard.`;
  }
}

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
      const jx = j as SyncLocalityInfo & { targetRoot?: unknown; targetLive?: unknown; localLive?: unknown };
      const snapshot: Suite8SyncLocalitySnapshot = {
        localScp: typeof j.localScp === 'string' ? j.localScp : null,
        specified: typeof j.specified === 'string' ? j.specified : null,
        targetScp: typeof j.targetScp === 'string' ? j.targetScp : null,
        targetRoot: typeof jx.targetRoot === 'string' ? jx.targetRoot : null,
        targetLive: jx.targetLive === true,
        localLive: jx.localLive === true,
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

    <!-- SECTION IV · THE ENTOURAGE FORGE (EF-2 · the hard-coded Forge Shatterite Menu + the flair
         exchange). The §II SCPs-drawer toggle idiom (▸/▾). When OPEN: the ROOT pane exchanges the
         HiFi Transparent for the Forge's prismatic flair (bound reactively on the root <section>
         above · forgeMenuOpen); the model select + the ONE MOTION engage row + the five hard-coded
         RD rows (clipboard-prime · EF-3 will dispatch to the live anchor) render inside. -->
    <div
      class="s8c-section s8c-forge-section"
      :class="forgeMenuOpen ? ['hifi-pane-transparent', 's8c-forge-section--open'] : []"
    >
      <!-- D-EF-BREAKOUT-b · TOTAL STYLE: the button wears EF's prismatic AT REST. -->
      <button
        class="s8c-forge-toggle s8c-forge-flair-btn hifi-mono"
        :class="{ 's8c-forge-engaged': forgeLaunchEngaged }"
        @click="forgeMenuOpen = !forgeMenuOpen"
        @mouseenter="settleForgeLaunchPulse"
      >
        {{ forgeMenuOpen ? '▾' : '▸' }} ENTOURAGE FORGE
      </button>

      <div
        v-if="forgeMenuOpen"
        :class="[
          's8c-forge-flair',
          { 's8c-forge-flair--pulsing': !forgeLaunchEngaged },
        ]"
        @mouseenter="settleForgeLaunchPulse"
      >
        <div class="s8c-forge-flair-glow" aria-hidden="true"></div>
        <div class="s8c-forge-flair-body">
          <h4 class="s8c-forge-heading spectrum-text">Forge this Suite</h4>

          <!-- THE MODEL SELECT (MD-9 · D-MC-3 · offscreen-safe ScsDropdown · setSpawnModel persist) -->
          <div class="s8c-forge-model-row">
            <label class="s8c-forge-model-label hifi-mono">Model</label>
            <ScsDropdown
              :options="modelDropdownOptions"
              :model-value="selectedModel"
              class="s8c-forge-model-dropdown"
              @update:model-value="(v) => { selectedModel = v ?? SCS_DEFAULT_MODEL; handleForgeModelChange(); }"
            />
          </div>

          <!-- EF-3′ · THE TWO-STATE DOOR (ported from Suite8HomeLanding W2 · branch-aware): on a
               NON-working branch the TURN OVER request (forging modifies this Suite's ground);
               on a working (B) branch the ONE MOTION engage + the Previous Conductions row. -->
          <template v-if="showTurnOverDoor">
            <p class="s8c-forge-intro">
              Forging works on a fresh working branch — turn over first, so nothing on your main
              line is touched. You can keep the branch or revert it.
            </p>
            <button
              type="button"
              class="s8c-forge-btn s8c-forge-btn--sword-b"
              :disabled="turnOverSpawning"
              @click="requestTurnOverToB"
            >
              <i class="fa-solid fa-arrow-right-to-bracket" aria-hidden="true"></i>
              <span>{{ turnOverSpawning ? 'Turning over…' : 'Turn Over · Forge on B' }}</span>
            </button>
            <p v-if="turnOverNote" class="s8c-forge-note">{{ turnOverNote }}</p>
          </template>
          <template v-else>
            <button
              type="button"
              class="s8c-forge-btn"
              :disabled="forgeSpawning"
              @click="engageEntourageForge"
            >
              <i class="fa-solid fa-hammer" aria-hidden="true"></i>
              <span>{{
                forgeSpawning ? 'Engaging…' : `Engage Entourage Forge · ${selectedModelLabel}`
              }}</span>
            </button>
            <p v-if="forgeSpawnNote" class="s8c-forge-note">{{ forgeSpawnNote }}</p>

            <!-- EF-3′d · THE PILL FILTER SYSTEM — target pills over the SCP-wide conduction
                 pool; the page's own pill AUTO-SELECTS (leads the row); any prior remains
                 referenceable from the same page. The chips stay lean (ulid + model) — the
                 active pill names the target. -->
            <div v-if="conductionPool.length > 0" class="s8c-forge-previous-block">
              <div class="s8c-forge-previous-pills">
                <span class="s8c-forge-previous-label hifi-mono">Previous conductions:</span>
                <button
                  v-for="t in conductionTargets"
                  :key="t"
                  type="button"
                  class="s8c-forge-pill hifi-mono"
                  :class="{ 's8c-forge-pill--active': t === selectedConductionTarget }"
                  @click="selectedConductionTarget = t"
                >{{ t }}</button>
              </div>
              <div v-if="previousForgeConductions.length > 0" class="s8c-forge-previous-row">
                <button
                  v-for="c in previousForgeConductions"
                  :key="c.id"
                  type="button"
                  class="s8c-forge-previous-btn"
                  @click="reopenConduction(c.id)"
                >
                  <span class="s8c-forge-previous-ulid hifi-mono">{{ shortUlid(c.id) }}</span>
                  <span class="s8c-forge-previous-model">{{ conductionModelLabel(c.model) }}</span>
                </button>
              </div>
              <p v-else class="s8c-forge-previous-empty">
                No prior conductions for {{ selectedConductionTarget }}.
              </p>
            </div>
          </template>

          <!-- THE RD MENU — the five hard-coded rows (label + one-liner · the Shatterite option-row
               idiom). FIRE: clipboard-prime the adaptation shape (EF-2). Live-anchor dispatch = EF-3. -->
          <div class="s8c-forge-rd-list">
            <span class="s8c-forge-rd-eyebrow hifi-mono">Cascade this into your Suite 8</span>
            <button
              v-for="entry in ENTOURAGE_FORGE_CONFIG.menu"
              :key="entry.rdKey"
              type="button"
              class="s8c-forge-rd-row"
              :title="entry.shape"
              @click="primeForgeMenuEntry(entry)"
            >
              <span class="s8c-forge-rd-key hifi-mono">{{ entry.rdKey }}</span>
              <span class="s8c-forge-rd-text">
                <span class="s8c-forge-rd-label">{{ entry.label }}</span>
                <span class="s8c-forge-rd-line">{{ entry.line }}</span>
              </span>
            </button>
          </div>
          <p v-if="forgeMenuNote" class="s8c-forge-note s8c-forge-note--menu">{{ forgeMenuNote }}</p>
        </div>
      </div>
    </div>

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
/* EF-3′ · THE DOOR + PREVIOUS-CONDUCTIONS styling (the s8c idiom · muted, no ceremony). */
.s8c-forge-intro {
  margin: 0 0 0.5rem;
  font-size: 0.78rem;
  line-height: 1.45;
  opacity: 0.75;
}
.s8c-forge-btn--sword-b {
  border-color: rgba(120, 160, 255, 0.45);
  background: rgba(60, 90, 180, 0.18);
}
.s8c-forge-btn--sword-b:hover {
  background: rgba(60, 90, 180, 0.3);
}
.s8c-forge-previous-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.4rem;
  margin-top: 0.55rem;
  opacity: 0.85;
}
/* EF-3′b · DARK-BACKGROUND HIFI COLORING — explicit light text (the chips sat on the dark
   ground with inherited dark text · the field find); the target field carries a cool accent. */
.s8c-forge-previous-label {
  font-size: 0.68rem;
  letter-spacing: 0.04em;
  color: rgba(232, 238, 244, 0.72);
}
.s8c-forge-previous-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.18rem 0.5rem;
  font-size: 0.68rem;
  color: rgba(236, 242, 248, 0.92);
  border: 1px solid rgba(255, 255, 255, 0.22);
  border-radius: 6px;
  background: rgba(10, 14, 18, 0.55);
  cursor: pointer;
}
.s8c-forge-previous-btn:hover {
  background: rgba(30, 38, 46, 0.75);
  border-color: rgba(255, 255, 255, 0.35);
}
.s8c-forge-previous-ulid {
  color: rgba(240, 246, 252, 0.95);
}
.s8c-forge-previous-model {
  color: rgba(208, 218, 228, 0.68);
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

/* EF-3′d · THE PILLS — the target filter row; the active pill carries the cool accent the
   per-chip target span wore (the pill now names the target · the chips stay lean). */
.s8c-forge-previous-block {
  margin-top: 0.55rem;
}
.s8c-forge-previous-pills {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.4rem;
}
.s8c-forge-pill {
  padding: 0.14rem 0.55rem;
  font-size: 0.66rem;
  letter-spacing: 0.03em;
  color: rgba(208, 218, 228, 0.75);
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: 999px;
  background: rgba(10, 14, 18, 0.45);
  cursor: pointer;
}
.s8c-forge-pill:hover {
  border-color: rgba(255, 255, 255, 0.35);
  color: rgba(236, 242, 248, 0.92);
}
.s8c-forge-pill--active {
  color: rgba(170, 220, 255, 0.95);
  border-color: rgba(170, 220, 255, 0.55);
  background: rgba(40, 70, 100, 0.35);
}
.s8c-forge-previous-empty {
  margin: 0.35rem 0 0;
  font-size: 0.68rem;
  color: rgba(208, 218, 228, 0.55);
}

/* EF-2 · B1 · THE FLAIR EXCHANGE — the base Pewter frame rides ONLY the closed state so the swapped
   pane treatment governs when open. Closed → this frame (over the base .hifi-pane); open → the
   .hifi-pane-transparent glass vessel shows through (its border/background take, uncontested). */
.s8-control {
  border: 1px solid rgba(255, 255, 255, 0.14);
  background: rgba(0, 0, 0, 0.28);
}
/* §IV zone recede — the transparent glass bounds the Forge's space when open
   (hifi-pane-transparent supplies glass + embossed border; this trims the fit) */
.s8c-forge-section--open {
  border-radius: 10px;
  padding: 0.45rem 0.5rem;
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

/* ============================================================
   EF-2 · SECTION IV · THE ENTOURAGE FORGE — the fold styling (the s8c-* idiom). The prismatic flair
   itself (.s8c-forge-flair · ring + glow + body) is GLOBAL (src/style.css · extracted from
   Suite8HomeLanding) so it reaches this scoped component; only the row chrome is scoped here.
   ============================================================ */
.s8c-forge-toggle {
  padding: 0.2rem 0.55rem;
  border-radius: 9px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: transparent;
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.62rem;
  letter-spacing: 0.06em;
  cursor: pointer;
  transition: color 0.15s ease, border-color 0.15s ease;
}
.s8c-forge-toggle:hover {
  color: rgba(255, 255, 255, 0.9);
  border-color: rgba(255, 255, 255, 0.24);
}
/* the toggle picks up a faint spectrum hint once the pane has been engaged (pulse settled) */
.s8c-forge-toggle.s8c-forge-engaged {
  border-color: rgba(168, 85, 247, 0.4);
  color: rgba(232, 226, 248, 0.9);
}
.s8c-forge-flair {
  margin-top: 0.4rem;
}
.s8c-forge-heading {
  font-family: var(--font-heading, 'Orbitron', sans-serif);
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  margin: 0 0 0.15rem;
}
.s8c-forge-model-row {
  display: flex;
  align-items: center;
  gap: 8px;
  position: relative; /* anchor for the ScsDropdown's absolutely-positioned in-DOM drawer */
}
.s8c-forge-model-label {
  font-size: 0.6rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--color-pewter, rgba(255, 255, 255, 0.55));
}
.s8c-forge-model-dropdown {
  flex: 1 1 auto;
  min-width: 0;
}
.s8c-forge-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  align-self: flex-start;
  margin-top: 0.15rem;
  padding: 0.45rem 1rem;
  border-radius: 4px;
  font-family: var(--font-heading, 'Orbitron', sans-serif);
  font-size: 0.68rem;
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
.s8c-forge-btn:hover:not(:disabled) {
  filter: brightness(1.08);
}
.s8c-forge-btn:disabled {
  opacity: 0.6;
  cursor: default;
}
.s8c-forge-note {
  color: rgba(216, 199, 154, 0.85);
  font-size: 0.68rem;
  margin: 0;
}
.s8c-forge-note--menu {
  color: rgba(147, 197, 253, 0.85);
}
/* THE RD MENU — the five hard-coded rows (the Shatterite option-row idiom · clipboard-prime). */
.s8c-forge-rd-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-top: 0.35rem;
  padding-top: 0.45rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}
.s8c-forge-rd-eyebrow {
  font-size: 0.56rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: rgba(206, 202, 194, 0.55);
  margin-bottom: 0.1rem;
}
.s8c-forge-rd-row {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  padding: 0.35rem 0.55rem;
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(0, 0, 0, 0.3);
  color: rgba(230, 226, 216, 0.85);
  text-align: left;
  cursor: pointer;
  transition: border-color 0.15s ease, background 0.15s ease;
}
.s8c-forge-rd-row:hover {
  border-color: rgba(168, 85, 247, 0.4);
  background: rgba(0, 0, 0, 0.45);
}
.s8c-forge-rd-key {
  flex: 0 0 auto;
  font-size: 0.58rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  color: rgba(147, 197, 253, 0.9);
  padding-top: 0.05rem;
}
.s8c-forge-rd-text {
  display: flex;
  flex-direction: column;
  gap: 1px;
  min-width: 0;
}
.s8c-forge-rd-label {
  font-size: 0.66rem;
  font-weight: 600;
  color: rgba(239, 226, 187, 0.95);
}
.s8c-forge-rd-line {
  font-size: 0.6rem;
  line-height: 1.35;
  color: rgba(206, 202, 194, 0.68);
}
</style>
