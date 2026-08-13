<script setup lang="ts">
/**
 * S8ForgeMenu.vue — D-FM · FM-1 · THE FORGE MENU WIDGET (the §IV extraction · 1A wholesale)
 *
 * THE SHARED-WIDGET LAW (the commission's fourth ruling): this widget IS the Suite 8 Control
 * panel's own Forge fold, individuated into the lent-shapes stratum
 * (src/concepts/vue/components/S8*.vue — token-free name · NEVER inside the mint copy surface,
 * the BO-1 kill class) so ONE canonical file updates every page. The panel mounts it with the
 * remove capability OMITTED (the always-accessible seat); template S8 pages mount it
 * remove-ENABLED (FM-6). The widget internals ride the SCP UPDATE circuit; the page carries
 * only the mount line — the S8_PAGE_COUNTER never moves for a widget improvement.
 *
 * FM-2 · THE ORIGIN FILTER (2A): the session surfaces are PAGE-SCOPED — the ONE MOTION engage
 * keys the registry's targetSuite8Name via findLiveS8ConductionForTarget (a live Forge FOR
 * THIS PAGE is focused, never duplicated; a live Forge for ANOTHER page never collides), and
 * the Previous Conductions pool keeps the shipped pill filter while ALSO surfacing the LIVE
 * page-Forge as the launchable highlight row. LEGACY (target-less) conductions are EXCLUDED
 * from page mounts; the panel mount keeps the 'unlabeled' pill (legacy remains reachable).
 *
 * THE TWIN-RENAME LAW: every session-field read routes through the HELD models
 * (s8Anchor.model + readConductionTarget) — this file lives OUTSIDE the mint copy surface,
 * but the discipline is kept regardless.
 *
 * Citation: Suite8Control.vue (the §IV source · EF-2..EF-5 lineage) ·
 * DIAMOND-FORGE-MENU.md (the commission · the Conference codes 1A·2A + FM-6).
 */
import { ref, computed, watch, onMounted, inject } from 'vue';
// EF-2 · the model catalog (offscreen-safe ScsDropdown feed) + the rename-proof anchor
// contract (findLiveS8ConductionForTarget / filterS8Sessions · the ONE MOTION law, page-scoped).
import { SCS_AVAILABLE_MODELS, SCS_DEFAULT_MODEL, scsModelLabel } from '../../scsBridge/model/scsModelCatalog.model';
import { findLiveS8ConductionForTarget, filterS8Sessions } from '../../scsBridge/model/s8Anchor.model';
import ScsDropdown from './ScsDropdown.vue';
import { getGlobalScsBridgeController, SCS_BRIDGE_CONTROLLER_KEY } from '../../scsBridge/scsBridgeController';
// EF-3′ · THE TWO-STATE DOOR — the branch-aware Turn-Over leg: forging modifies this Suite's
// ground, so on a NON-working branch the door is the TURN OVER request (the D-BN canonical
// roles.b identity), on a working (B) branch the Engage.
import { getGlobalGitmController, GITM_CONTROLLER_KEY } from '../../gitm/gitmController';
import { isWorkingBranchPer } from '../../gitm/gitm.type';
import {
  writeGitmTurnoverProgress,
  GITM_TURNOVER_DEADLINE_MS,
} from '../../../model/gitmTurnover.model';
import { showBridgeStandby } from '../../webSocketClient/model/bridgeStandbyOverlay.model';
// EF-3′c · every conduction-target read rides the HELD model; FM-6 · the removal-flag
// endpoint literal is held beside it (token-free · one literal, one seat); FM-4 · the
// manifest endpoint literal rides the same seat; FM-5 · the collapsed-state endpoint
// literal (the removal flag's sibling) rides it too.
import {
  readConductionTarget,
  forgeMenuRemovalEndpoint,
  forgeMenuManifestEndpoint,
  forgeMenuCollapsedEndpoint,
} from '../../../model/scpLocalityClientAccess.model';
// MD-S8PM · PM-5 · the Forge Update Vermillion builder (the menu-path update row rides here).
// D-FM · FM-4 · the Forge Menu Vermillion builder (the Build Button fire rides here).
import {
  buildUpdateVermillion,
  buildForgeMenuVermillion,
  type ForgeMenuEntry,
} from '../../../model/scpS8InstallCircuit.model';

const props = defineProps<{
  // The page designation — the origin identity every session surface filters on. TOKEN-FREE
  // BY LAW (the BO-1 kill class · the Suite8ControlDrawer `designation` precedent): the mint's
  // content rewrite renames every `suite8`-tokened mount attribute inside the copy surface,
  // but this widget is NEVER copied — a `suite8Name` prop here would sever every minted
  // twin's mount. `designation` survives the rewrite untouched on both sides.
  designation: string;
  // EF-3′ · 2A · THE FRESH-ANOR-WORKED CONTROL — REQUIRED (the boolean-prop trap law: an
  // absent optional boolean coerces to false, so requiring it forces every mount to declare).
  // PANEL mounts ONLY (FM-5 honest note): false = boots OPEN, true = boots collapsed — the
  // panel's utility boot stands unchanged. PAGE mounts now IGNORE this prop for the open
  // state: the fold derives from the persisted collapsed state (ForgeMenuCollapsed.json ·
  // absent = OPEN, the first-authored auto-expand). The prop STAYS — the panel still reads it.
  worked: boolean;
  // FM-6c · THE PROPERTY LAW (the user's ruling): the remove capability is a PROP — DEFAULT
  // DISABLED (an absent optional boolean coerces to false — the omission IS the default).
  // The PAGES enable it; the Suite 8 Control panel mount leaves it disabled (the panel
  // placement is permanent — the always-accessible re-access seat). allowRemove is ALSO the
  // page-anor-panel context discriminator (2A): the ruling itself defines the panel as the
  // allowRemove-disabled mount, so no second prop is minted.
  allowRemove?: boolean;
}>();

// ============================================================
// EF-2 · THE ENTOURAGE FORGE — THE HARD-CODED CONFIG
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
        'LIVE in Cadmium: topics.json curated through the page (SCS:TopicUpdate chip input) + the frontier folder-tree watcher (armFolderTreeWatch) merging worker articles → the Huirth-base bulletin quality FIRST → the relay quality → client state → subscription → the Frontier ref. Four sibling STCP relay instances already run this (menu · topics · researchBulletin · targeted-menu). The single unifying Reference Design formalizes on cascade; the spine it names is built.',
    },
    {
      rdKey: 'RD-B',
      label: 'Prepared Agent Dispatch (PGED) — an Entourage for Your Page',
      line: 'THE CONCEPTION PAIR: a Seeded Concept in, an Actualized Artifact out — you name the governing abstraction your page holds; the dispatched agent draws the Diameter from your Concept through ANY text-based artifact it is trained on (code · specs · fiction · ADRs · tests · migrations · lessons · copy · clause drafts — and a Vermillion itself). Concept in, Artifact out — a Topic becoming an Article is the shape. Prepare, by way of your page UI, the dispatch of any number of agents in sequence, grounded on YOUR page; the bridge serializes the fleet, your page observes every worker land its work. The Primed Vermillion is the first-class Reference Design this actualizes TODAY — the three live priming lanes (Installation · Updating · Onboard) prove it just by landing on this Suite 8 page.',
      shape:
        'Page-Grounded Entourage Dispatch, the Conception Pair as content law (A ⊗ B — the Seeded Concept anor the Actualized Artifact; Topic → Article is the worked instance that ALWAYS stands beside the general claim). AUTHOR ONLY two Demometers: (1) your Prepare Surface (the domain unit list + fire controls) and (2) a pure Vermillion builder with its output contract (unit + RI path + write-shape + teardown step). INHERITED WHOLE: the spawn rail (triggerRelayEnqueue kind:spawn anor triggerSpawnS8Session), the ASTO sequence law (serialized spawn→gate→prime blocks · MISO), the grounding (TPRI · your designation + RI dir · CMLS locality for remote citizens), and the observation lane (registry ledger → roster → focus → All Clear + your registered relay lanes). The Primed Vermillion is the core SCS feature that sets it apart — crafted and refined through OUR OWN utilization across the three live lanes: the Install Entourage Vermillion, buildUpdateVermillion, and the Cadmium Onboard.md ASDR.',
    },
    {
      rdKey: 'RD-C',
      label: 'The Relay Lanes',
      line: 'The reactive spine every surface rides: file → watcher → Huirth state → SMRP → client state → subscription → ref.',
      shape:
        'LIVE: the file → watcher → Huirth-base quality → relay quality (SMRP) → client state → subscription → ref spine runs across four sibling STCP instances in Cadmium today — the same spine RD-A rides. Any new surface registers into the lane the page already carries; results-return is a property of the page, not of the dispatch. The 6-step registration checklist and THE FOUR LAWS (empty-is-a-state · absence-is-not-emptiness · unlinkDir coverage · no boot-skips) formalize as one Reference Design on cascade; the spine they codify is built and observable.',
    },
    {
      rdKey: 'RD-D',
      label: 'Sync Library + Locality',
      line: 'The diametric capability: view or operate another live SCP’s Cascade content from your Suite 8 page.',
      shape:
        'LIVE (CMLS locality, as built): scpName stamps the spawn, riBase roots the RI read at the TARGET citizen\'s absolute tree, targetScpName labels the Vermillion header — a dispatch grounds on a REMOTE citizen\'s memory (the D-SLE Effective Locality stamp + D-TRL target-rooting in Cadmium). The subscription rides the same relay spine; a signal-watch carries the target\'s content back; absence is a state, not an error (HONEST ABSENCE — an offline target reports offline, it does not fabricate content). HARD LIVE GATE: the target must be spawned + online. The vault + 3-stage usher + KNOWN_SURFACE_REGISTRATIONS entry formalize as one Reference Design on cascade; the locality relay they wrap is built.',
    },
    {
      rdKey: 'RD-E',
      label: 'The Forge + Actualization',
      line: 'The Suite 8 creation system: the forge predicate + the 4-step create pipeline + the 6-band creation Vermillion.',
      shape:
        'LIVE in this very component (EF-2..4): the fold seat (Suite8Control §IV) · the flair exchange (transparent ↔ the Forge\'s prismatic PULSE) · the launch toggle seat (blankSlateLaunch, §IV config) · THE ONE MOTION engage — a live Forge is FOCUSED, else a fresh anchor spawn carrying the forgeDirective (triggerSpawnS8Session). The Forge dispatches THROUGH the same PGED rail RD-B names: the capability it cascades into a page is the capability that dispatched it. THE NAMED BIAS attach seat (Band 4.5 · page-creation guidance) formalizes on cascade — not yet wired.',
    },
    {
      rdKey: 'RD-F',
      label: 'OnBoard.md — the Primed Vermillion Your Page Ships',
      line: 'Place a Primed Vermillion you refine at Cascades/8_SUITES/<designation>/Onboard.md; your page ships as a First-Class Intelligent Application — its anchor onboards YOUR user. The 8_SUITES folder travels with your page (suite8_page_transfer), so the receiving citizen spawns the anchor WITH it — the C378 two-ground resolver + STVI hydration are LIVE today.',
      shape:
        'The anchor spawn reads Cascades/8_SUITES/<designation>/Onboard.md at fire time (SCP-local FIRST, workspace SECOND — the C378 sovereignty resolver). The cli-handler hydrates runtime tokens (BRIDGE_ENDPOINT · SCP_WINDOW_ID · SCP_NAME), prepends the generic Shatterite Menu How, and delivers the composed prompt as the anchor\'s FIRST turn. Absent = graceful no-seed spawn (the page works; the anchor receives a bare seat, no priming). THE WORKED INSTANCE: the Cadmium Researcher Onboard.md ASDR — the routine that reads topics.json, authors menu.json, refocuses the UI, and stays interactive. HONEST MARKS: the mint does NOT create Onboard.md — the Forge F5 Close is the first author; refine yours thereafter through the three live lanes (Installation · Updating · Live-use), and the anchor receives the refined version on every fresh spawn. The on-location refinement editor is deferred by doctrine — refinement today IS editing the file.',
    },
  ],
} as const;

// ============================================================
// EF-2 · THE FORGE ENGAGEMENT STATE (ported from Suite8Control §IV · Suite8HomeLanding RD-E §I)
// The toggle governs the fold visibility (the §II SCPs-drawer idiom). forgeLaunchEngaged drops the
// prismatic PULSE on first hover/utilization (session-only · no storage). forgeSpawning guards the
// ONE MOTION engage; selectedModel persists to the controller (setSpawnModel) so the NEXT spawn pins.
// ============================================================
// EF-3′ · 2A · the PANEL boot: a FRESH mount (worked=false) boots the Forge section OPEN;
// a WORKED mount boots collapsed (user-toggled thereafter · no persistence — the panel is
// the utility surface). FM-5 · the PAGE boot: `worked` is IGNORED — the fold boots OPEN
// (the first-authored auto-expand) then derives from the persisted collapsed state
// (consultCollapsedState below · Honest-Absence: absent = OPEN stands).
const forgeMenuOpen = ref<boolean>(props.allowRemove === true ? true : !props.worked);
// FM-5 · THE PERSISTED COLLAPSE CONSULT (page mounts only — the panel never persists).
// The removal-fetch idiom replicated: designation-keyed, STALE-GUARDED across both awaits
// (the C904 idiom — a late resolve for a prior page discards). HONEST-ABSENCE: absent anor
// unanswerable anor fetch-fail = NOT collapsed — the OPEN boot stands.
async function consultCollapsedState(): Promise<void> {
  if (!props.allowRemove || !props.designation) return;
  const name = props.designation;
  try {
    const r = await fetch(forgeMenuCollapsedEndpoint(name));
    if (props.designation !== name) return; // stale-guard — the page moved on mid-flight.
    if (!r.ok) return; // Honest-Absence — an unanswerable state is NOT a collapse.
    const j = (await r.json()) as { collapsed?: unknown };
    if (props.designation !== name) return; // stale-guard — the json() await is a second gap.
    forgeMenuOpen.value = j.collapsed !== true;
  } catch {
    /* Honest-Absence — fetch fail = not collapsed (the open boot stands). */
  }
}
// FM-5 · THE TOGGLE IS THE WRITER (page mounts): flipping the fold POSTs the NEW state —
// a collapse is SAVED anor a re-expand is SAVED (both directions · get-it-out-of-the-way,
// leave-it-if-they-choose). Best-effort: a failed persist never blocks the local toggle.
// The panel toggle persists NOTHING (the utility surface — behavior unchanged).
function toggleForgeMenuOpen(): void {
  forgeMenuOpen.value = !forgeMenuOpen.value;
  if (!props.allowRemove || !props.designation) return;
  void fetch(forgeMenuCollapsedEndpoint(props.designation), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ collapsed: !forgeMenuOpen.value }),
  }).catch(() => {
    /* best-effort — the local toggle already landed; the save retries on the next flip. */
  });
}
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
// EF-2 · THE FORGE ENGAGEMENT ROW — THE ONE MOTION LAW, PAGE-SCOPED (FM-2 · 2A). A LIVE
// Entourage Forge conduction COMMISSIONED TO THIS PAGE (targetSuite8Name === suite8Name ·
// the held read) is FOCUSED, never duplicated; ELSE a fresh anchor spawn (fresh:true)
// stamping targetSuite8Name = this page. The prior SCP-scoped findLiveS8Session pool
// collided an update-Forge with another page's build-Forge (the Suite8Control ONE MOTION
// verdict) — findLiveS8ConductionForTarget is the cure. The controller triggers are REUSED
// EXACTLY (getGlobalScsBridgeController lanes).
// ============================================================
async function engageEntourageForge(): Promise<void> {
  console.log('[Forge Engage · ForgeMenu] clicked');
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
    // THE ONE MOTION (page-scoped) — a live Forge conduction FOR THIS PAGE is FOCUSED,
    // never duplicated; a live Forge for another page never collides (FM-2).
    const liveForge = findLiveS8ConductionForTarget(
      ctrl.sessionsList.value ?? [], 'Entourage Forge', scpName, props.designation,
    );
    if (liveForge) {
      console.log('[Forge Engage · ForgeMenu] ONE MOTION · live page-Forge found · focusing · ulid=', liveForge.id);
      ctrl.triggerFocusSession(liveForge.id);
      forgeSpawnNote.value = 'Focused the running Forge.';
      return;
    }
    // ELSE — a fresh anchor spawn (fresh:true · the bridge re-claims THIS page's anchor).
    // EF-3′ · 1A · THE TARGET S8 THREAD + THE LEADING VERMILLION ASPECT — the conduction is
    // COMMISSIONED to formalize THIS page: the target rides the registry entry (the Previous
    // Conductions per-page filter) AND leads the spawn Vermillion as the initial directive.
    const forgeDirective = [
      `THE ENTOURAGE FORGE COMMISSION · target Suite 8 page: "${props.designation}".`,
      `This conduction formalizes the "${props.designation}" page — research its domain, build out the page, and hand the Suite back ready.`,
      'THE PGED FRAME: the capability you cascade into this page is the capability that dispatched YOU — Page-Grounded Entourage Dispatch, the UI-prepared dispatch of any number of agents in sequence grounded on one Suite 8 page. THE CONCEPTION PAIR is its content law: a Seeded Concept in (the abstraction the page holds), an Actualized Artifact out (ANY text-based means the agent is trained on — code, specs, fiction, ADRs, tests, copy, a Vermillion itself). Author only two Demometers per page (the Prepare Surface + a pure Vermillion builder with its output contract); inherit four whole (the spawn rail, the ASTO sequence law, the grounding, the observation lane).',
      'THE WORKED INSTANCE (the Conception Pair, worked): the Topic Researcher IS the general pattern proven in the field — Topic in, Article out is the shape that ALWAYS stands beside the general claim. Read its Inspirant docs (Cadmium Researcher/Onboard.md) as the worked example that teaches PGED and the Conception Pair, not as a research-only feature.',
      'THE REAL-SYSTEM ANCHORS you may build against, verified live: the spawn rail (triggerSpawnS8Session · designation-agnostic by the s8 alias contract) · the relay-lane spine (file → watcher → Huirth state → client → subscription → ref) · CMLS locality (a page may serve a REMOTE citizen\'s memory) · the s8 counter axis (S8_PAGE_COUNTER · the version row).',
      'THE SIGN-OFF (V-4): the Suite 8 Control rides the toolbar drawer now — there is NO inline mount to flip. When the page is sufficiently developed, record the completion in the page\'s Cascades/Working notes and alert for turn-over; the drawer boots the Forge section collapsed by design.',
    ].join('\n');
    ctrl.triggerSpawnS8Session('Entourage Forge', scpName, false, true, false, forgeDirective, true, true, props.designation);
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
// EF-3′ · 3A · THE PREVIOUS-CONDUCTIONS ROW (ported from Suite8Control §IV · C386) —
// this SCP's Entourage Forge conductions, TARGET-AWARE. FM-2 · the union law: OFFLINE
// conductions re-open (triggerEngageSession · the resume leg) AND the LIVE page-Forge
// surfaces as the launchable highlight row (live = engaged/focusable · triggerFocusSession).
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
  // FM-6 · the removal-flag consult (page mounts only — the panel never gates).
  void consultRemovalFlag();
  // FM-5 · the persisted-collapse consult (page mounts only — absent = the OPEN boot stands).
  void consultCollapsedState();
  // FM-4 · the manifest fetch (mount leg — the designation-change leg rides the watch below).
  void fetchForgeMenuManifest();
});
// FM-2 · 2A · THE CONTEXT DISCRIMINATOR (judged): allowRemove IS the page-anor-panel
// discriminator — the ruling defines the panel as the allowRemove-disabled mount, so no
// second prop is minted. Page context → LEGACY (target-less) conductions are EXCLUDED
// (no 'unlabeled' pill); panel context keeps the 'unlabeled' pill (legacy reachable there).
const isPageMount = computed<boolean>(() => props.allowRemove === true);
// EF-3′d · THE PILL FILTER SYSTEM — PANEL MOUNTS ONLY (FM-5 · the page-scope law): on the
// panel the SCP-wide pool of Forge conductions renders under target PILLS (one per distinct
// commissioned page + 'unlabeled' for pre-thread legacy). FM-5 · PAGE mounts scope the
// ENTIRE Previous-Conductions surface to the page's OWN target: the pool narrows by
// readConductionTarget === designation, the pill row hides (one target = no chooser — the
// selected target is fixed to the own designation), and the block gate rides the OWN-scoped
// pool — a fresh page with ZERO own conductions renders NO Previous block at all (the
// prior SCP-wide pool leaked OTHER pages' conductions onto a fresh page — the FM-5 field
// find; the §IV design was panel-correct, page-wrong). Every target read rides the HELD
// model (EF-3′c — a twin's rename never touches the registry field).
// FM-2 · the pool carries offline AND launched (the union law — the live highlight).
const conductionPool = computed(() => {
  const list = getGlobalScsBridgeController()?.sessionsList.value ?? [];
  const scp = resolvedScpName.value;
  const pool = filterS8Sessions(list, 'Entourage Forge')
    .filter((s) => (scp === null || s.scpName === scp) && (s.status === 'offline' || s.status === 'launched'));
  // FM-5 · the page-scope narrowing — page mounts see ONLY this page's own conductions
  // (legacy target-less entries drop with the rest: undefined never equals a designation).
  return isPageMount.value
    ? pool.filter((s) => readConductionTarget(s) === props.designation)
    : pool;
});
const selectedConductionTarget = ref<string>(props.designation);
watch(
  () => props.designation,
  (v) => {
    // the designation-arrival re-sync — the auto-select follows the page's own identity.
    selectedConductionTarget.value = v;
  },
);
const conductionTargets = computed(() => {
  // the page's own pill leads (the auto-selected home); the rest in pool order.
  const targets = new Set<string>([props.designation]);
  for (const s of conductionPool.value) {
    const t = readConductionTarget(s);
    if (t === undefined) {
      // FM-2 · 2A · legacy (target-less) EXCLUDED from page widgets; the panel keeps
      // the 'unlabeled' pill so pre-thread conductions remain reachable.
      if (!isPageMount.value) targets.add('unlabeled');
      continue;
    }
    targets.add(t);
  }
  return [...targets];
});
const previousForgeConductions = computed(() =>
  conductionPool.value
    .filter((s) =>
      s.status === 'offline' &&
      (readConductionTarget(s) ?? 'unlabeled') === selectedConductionTarget.value)
    .slice(0, 3),
);
// FM-2 · THE LAUNCHABLE HIGHLIGHT — the LIVE conduction commissioned to the selected target
// (live = engaged/focusable); clicking FOCUSES it (the ONE MOTION focus leg as a row).
const liveConductionForTarget = computed(() =>
  conductionPool.value.find(
    (s) =>
      s.status === 'launched' &&
      (readConductionTarget(s) ?? 'unlabeled') === selectedConductionTarget.value,
  ),
);
function focusLiveConduction(id: string): void {
  console.log('[Forge Previous · ForgeMenu] focusing live conduction · ulid=', id);
  getGlobalScsBridgeController()?.triggerFocusSession(id);
}
function shortUlid(id: string): string {
  return id.length > 8 ? id.slice(-8) : id;
}
function conductionModelLabel(model: string | undefined): string {
  return model ? scsModelLabel(model) ?? model : 'default model';
}
function reopenConduction(id: string): void {
  console.log('[Forge Previous · ForgeMenu] re-opening conduction · ulid=', id);
  getGlobalScsBridgeController()?.triggerEngageSession(id);
}

// ============================================================
// EF-3′ · THE TWO-STATE DOOR (ported from Suite8Control §IV VERBATIM · branch-aware) —
// on a NON-working branch (the A side · the safe default when the branch read is absent)
// the door is the TURN OVER request; on a working (B) branch it is the Engage.
// ============================================================
const gitmControllerForDoor = inject(GITM_CONTROLLER_KEY) ?? getGlobalGitmController();
const scsBridgeControllerForDoor =
  inject(SCS_BRIDGE_CONTROLLER_KEY) ?? getGlobalScsBridgeController();
const currentBranch = computed<string>(
  () => gitmControllerForDoor?.gitmJson.value?.currentBranch ?? '',
);

// ============================================================
// MD-S8PM · PM-5 · THE MENU-PATH UPDATE LANE (moved with §IV). The counter computeds read the
// controller's PM-3 seats through the SAME settled ref every dispatch uses. THE CONVERGENCE
// SEAM, carried across the extraction: Suite8Control's PM-4 version row RETAINS its own thin
// twin of this lane (the row stays in the panel; the menu-path row lives here) — both compose
// buildUpdateVermillion over the same controller seats. De-duplication into a held model is
// CARDED (Band B), not pursued in-scope.
// ============================================================
const pageS8CounterValue = computed<number | null>(
  () => scsBridgeControllerForDoor?.pageS8Counter.value ?? null,
);
const installedS8CounterValue = computed<number | null>(
  () => scsBridgeControllerForDoor?.installedS8Counter.value ?? null,
);
const s8PageBehindValue = computed<boolean>(
  () => scsBridgeControllerForDoor?.s8PageBehind.value === true,
);
const pageS8Display = computed<string>(() =>
  pageS8CounterValue.value === null ? '—' : `#${pageS8CounterValue.value}`,
);
const installedS8Display = computed<string>(() =>
  installedS8CounterValue.value === null ? '—' : `#${installedS8CounterValue.value}`,
);
const versionedUpdateSpawning = ref<boolean>(false);
const versionedUpdateNote = ref<string>('');
async function engageVersionedUpdate(): Promise<void> {
  const ctrl = getGlobalScsBridgeController();
  if (!ctrl || versionedUpdateSpawning.value) return;
  settleForgeLaunchPulse();
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
    // THE ONE MOTION (page-scoped · FM-2) — a live Forge conduction FOR THIS PAGE is FOCUSED,
    // never duplicated (the update session shares the page's pool by its target stamp).
    const liveForge = findLiveS8ConductionForTarget(
      ctrl.sessionsList.value ?? [], 'Entourage Forge', scpName, props.designation,
    );
    if (liveForge) {
      ctrl.triggerFocusSession(liveForge.id);
      versionedUpdateNote.value = 'Focused the running Forge.';
      return;
    }
    // ELSE — a fresh anchor spawn carrying the Forge Update Vermillion (the engageEntourageForge
    // idiom VERBATIM: fresh:false · onboard:true · anchor:true · target = this page).
    ctrl.triggerSpawnS8Session(
      'Entourage Forge', scpName, false, true, false,
      buildUpdateVermillion(props.designation, pageS8, installedS8),
      true, true, props.designation,
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
// FM-4 · 3A · THE MANIFEST FETCH — the per-page Build Button manifest
// (Cascades/8_SUITES/<designation>/ForgeMenu.json · the s8-forge-menu route · the held
// forgeMenuManifestEndpoint literal). Fetched on mount + designation change; STALE-GUARDED
// (the C904 idiom — capture the designation at fetch start, discard a late resolve for a
// prior page; both awaits are gaps). HONEST-ABSENCE: `{}` anor a failed fetch = null —
// the factory rows render.
// ============================================================
const forgeMenuManifest = ref<ForgeMenuEntry[] | null>(null);
async function fetchForgeMenuManifest(): Promise<void> {
  const name = props.designation;
  if (!name) return;
  try {
    const r = await fetch(forgeMenuManifestEndpoint(name));
    if (props.designation !== name) return; // stale-guard — the page moved on mid-flight.
    if (!r.ok) return; // Honest-Absence — an unanswerable manifest is the factory state.
    const j = (await r.json()) as { entries?: ForgeMenuEntry[] };
    if (props.designation !== name) return; // stale-guard — the json() await is a second gap.
    forgeMenuManifest.value =
      Array.isArray(j.entries) && j.entries.length > 0 ? j.entries : null;
  } catch {
    /* Honest-Absence — fetch fail = no manifest (the factory rows stand). */
  }
}

// FM-4 · THE ROW UNION — manifest entries when present (3A · the Forge-authored menu); the
// hard-coded RD rows as the FACTORY FALLBACK (the PATTERN_LIBRARY manifest-over-factory
// precedent — the factory content stands untouched; it is the fallback, never deleted).
type ForgeMenuRow = { key: string; label: string; line: string; prime: string };
const forgeMenuRows = computed<ForgeMenuRow[]>(() => {
  const manifest = forgeMenuManifest.value;
  if (manifest && manifest.length > 0) {
    return manifest.map((e) => ({ key: e.id, label: e.label, line: '', prime: e.prime }));
  }
  return ENTOURAGE_FORGE_CONFIG.menu.map((m) => ({
    key: m.rdKey, label: m.label, line: m.line, prime: m.shape,
  }));
});

// ============================================================
// FM-4 · 4A · THE BUILD BUTTON FIRE — the spawn-anor-route FORK (the EF-3 remainder CLOSED:
// clipboard-prime is DEMOTED to the quiet secondary copy affordance below, not deleted).
// A LIVE Forge conduction commissioned to THIS page → ROUTE the built Vermillion to it via
// the controller's triggerDeliverVermillion lane (the scs_deliver_vermillion contract — the
// bridge Quality prefixes the bare `SCS:Vermillion` directive line and types the text into
// the session via the FKIS relay; the controller carries originScpName — never a hand-rolled
// bridge action) + FOCUS it. NONE live → SPAWN the Forge with the Vermillion riding the
// initialDirective + the page stamp (the ONE MOTION engage's own triggerSpawnS8Session
// shape, reused exactly).
// ============================================================
const forgeMenuFiring = ref<boolean>(false);
async function fireForgeMenuEntry(row: ForgeMenuRow): Promise<void> {
  const ctrl = getGlobalScsBridgeController();
  if (!ctrl || forgeMenuFiring.value) return;
  settleForgeLaunchPulse();
  forgeMenuFiring.value = true;
  forgeMenuNote.value = '';
  try {
    const vermillion = buildForgeMenuVermillion(props.designation, {
      id: row.key, label: row.label, prime: row.prime,
    });
    // THE TIMEOUT RACE (C375) — a never-settling getScpName must never hang the dispatch.
    const scpName = (await Promise.race([
      ctrl.getScpName(),
      new Promise<string | null>((r) => setTimeout(() => r(null), 3000)),
    ])) ?? undefined;
    // THE FORK — the same target-aware ONE MOTION find the engage row keys (FM-2).
    const liveForge = findLiveS8ConductionForTarget(
      ctrl.sessionsList.value ?? [], 'Entourage Forge', scpName, props.designation,
    );
    if (liveForge) {
      console.log('[Forge Menu · ForgeMenu] ROUTE · live page-Forge · ulid=', liveForge.id);
      const result = await ctrl.triggerDeliverVermillion(liveForge.id, vermillion);
      if (result.ok) {
        ctrl.triggerFocusSession(liveForge.id);
        forgeMenuNote.value = `${row.key} routed to the running Forge.`;
      } else {
        forgeMenuNote.value = `${row.key}: the route was refused — ${result.error ?? 'unknown'}.`;
      }
      return;
    }
    console.log('[Forge Menu · ForgeMenu] SPAWN · no live page-Forge · target=', props.designation);
    ctrl.triggerSpawnS8Session(
      'Entourage Forge', scpName, false, true, false, vermillion, true, true, props.designation,
    );
    forgeMenuNote.value = `${row.key} engaged a fresh Forge for this page.`;
  } catch {
    forgeMenuNote.value = `${row.key}: could not reach the Bridge.`;
  } finally {
    setTimeout(() => {
      forgeMenuFiring.value = false;
    }, 1200);
  }
}

// FM-4 · THE QUIET SECONDARY — clipboard-prime DEMOTED (the prior EF-2 primary fire, kept as
// the per-row copy glyph — the prior behavior demoted, not deleted). Copies the row's prime.
async function copyForgeMenuEntry(row: ForgeMenuRow): Promise<void> {
  settleForgeLaunchPulse();
  const text = `${row.key} · ${row.label}\n\n${row.prime}`;
  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      forgeMenuNote.value = `${row.key} commission copied to clipboard.`;
    } else {
      forgeMenuNote.value = `${row.key}: clipboard unavailable in this context.`;
    }
  } catch {
    forgeMenuNote.value = `${row.key}: could not copy to clipboard.`;
  }
}

// ============================================================
// FM-6 · THE REMOVAL SOVEREIGNTY — the persisted per-designation per-SCP removal flag
// (Cascades/Extended/<designation>/ForgeMenuRemoved.json · served by the s8-forge-menu-removal
// routes · OUTSIDE the S8 update's diff surface by construction). HONEST-ABSENCE: an absent
// flag anor a failed fetch = NOT removed (the widget renders). The render gate lives HERE
// (the one-canonical-file law — no per-Landing fetch code): a page mount (allowRemove) with
// the flag set renders NOTHING; the mount line REMAINS in the page — the flag IS the
// sovereignty, so the S8 page update never conflicts. The panel NEVER gates (the
// always-accessible re-access surface).
// ============================================================
const removedByOwner = ref<boolean>(false);
const removeArmed = ref<boolean>(false);
const removeNote = ref<string>('');
async function consultRemovalFlag(): Promise<void> {
  if (!props.allowRemove || !props.designation) return;
  try {
    const r = await fetch(forgeMenuRemovalEndpoint(props.designation));
    if (!r.ok) return; // Honest-Absence — an unanswerable flag is NOT a removal.
    const j = (await r.json()) as { removed?: unknown };
    removedByOwner.value = j.removed === true;
  } catch {
    /* Honest-Absence — fetch fail = not removed (the widget stands). */
  }
}
// the designation-arrival re-consult (the C486 class — async-hydrating designations).
// FM-4 · the manifest re-fetch rides the same edge (reset-then-fetch — a prior page's
// manifest never bleeds; the in-flight stale-guard covers the race).
// FM-5 · the collapsed-state re-consult rides it too (reset to the OPEN boot, then derive —
// a prior page's saved collapse never bleeds; the in-flight stale-guard covers the race).
watch(
  () => props.designation,
  (name, prior) => {
    if (!name || name === prior) return;
    removedByOwner.value = false;
    removeArmed.value = false;
    void consultRemovalFlag();
    if (props.allowRemove) {
      forgeMenuOpen.value = true;
      void consultCollapsedState();
    }
    forgeMenuManifest.value = null;
    void fetchForgeMenuManifest();
  },
);
// FM-6b · THE REMOVE COMMAND — a quiet two-click arm/confirm beat (no shipped in-widget
// confirm idiom exists in the §IV lineage to match — judged). Firing POSTs the flag; the
// widget hides INSTANTLY (no Turn Over); the panel remains the re-access surface.
async function fireRemoveWidget(): Promise<void> {
  if (!props.allowRemove) return;
  if (!removeArmed.value) {
    removeArmed.value = true;
    removeNote.value = 'Press again to remove this widget from the page — the Suite 8 Control panel keeps it.';
    return;
  }
  try {
    const r = await fetch(forgeMenuRemovalEndpoint(props.designation), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ removed: true }),
    });
    if (r.ok) {
      removedByOwner.value = true; // instant hide — the mount line remains; the flag is the sovereignty.
    } else {
      removeNote.value = 'The removal write was refused — the widget stays.';
    }
  } catch {
    removeNote.value = 'Could not reach the SCP server — the widget stays.';
  } finally {
    removeArmed.value = false;
  }
}
</script>

<template>
  <!-- FM-1 · THE WIDGET ROOT — the Suite8Control §IV section, individuated (the flair exchange
       rides THIS section: forge-open wears the transparent glass vessel · forge-closed the quiet
       toggle row). FM-6 · the page-mount render gate: an owner-removed widget (allowRemove + the
       persisted flag) renders NOTHING; the panel (allowRemove absent → false) NEVER gates. -->
  <div
    v-if="!(allowRemove && removedByOwner)"
    class="s8-forge-menu s8c-section s8c-forge-section"
    :class="forgeMenuOpen ? ['hifi-pane-transparent', 's8c-forge-section--open'] : []"
  >
    <!-- D-EF-BREAKOUT-b · TOTAL STYLE: the button wears EF's prismatic AT REST. -->
    <button
      class="s8c-forge-toggle s8c-forge-flair-btn hifi-mono"
      :class="{ 's8c-forge-engaged': forgeLaunchEngaged }"
      @click="toggleForgeMenuOpen"
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

        <!-- EF-3′ · THE TWO-STATE DOOR (branch-aware): on a NON-working branch the TURN OVER
             request (forging modifies this Suite's ground); on a working (B) branch the ONE
             MOTION engage + the Previous Conductions row. -->
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

          <!-- MD-S8PM · PM-5 · THE MENU-PATH UPDATE PRESENCE — the update option present GENERALLY
               on the same Forge menu path as "Engage Entourage Forge", ACTIVATED over the versioned
               state (amber when s8PageBehind · the SAME amber as the panel version-row control).
               ALWAYS ENABLED (enabled current anor behind); the amber only signals the behind state. -->
          <button
            type="button"
            class="s8c-forge-btn s8c-forge-update-btn"
            :class="{ 's8c-forge-update-btn--behind': s8PageBehindValue }"
            :disabled="versionedUpdateSpawning"
            title="Update this Suite 8 page from the Template Suite 8 — the Forge confers which standardizations adapt over (always available; amber when the page is behind the installed system's s8 counter)."
            @click="engageVersionedUpdate"
          >
            <i class="fa-solid fa-arrows-rotate" aria-hidden="true"></i>
            <span>{{
              versionedUpdateSpawning
                ? 'Engaging…'
                : `Update from Template · PAGE ${pageS8Display} → SYSTEM ${installedS8Display}`
            }}</span>
          </button>
          <p v-if="versionedUpdateNote" class="s8c-forge-note">{{ versionedUpdateNote }}</p>

          <!-- EF-3′d · THE PILL FILTER SYSTEM (PANEL mounts) — target pills over the SCP-wide
               conduction pool; the page's own pill AUTO-SELECTS (leads the row); any prior
               remains referenceable. FM-5 · THE PAGE-SCOPE LAW: page mounts ride the OWN-scoped
               pool (conductionPool narrows to this page's target), so this gate renders NO
               Previous block on a fresh page with zero own conductions; the pill row hides on
               page mounts (one target = no chooser — the selection is fixed to the own
               designation). FM-2 · the LIVE page-Forge surfaces as the launchable highlight
               row above the offline re-openables; legacy (target-less) conductions render
               only under the panel's 'unlabeled' pill. -->
          <div v-if="conductionPool.length > 0" class="s8c-forge-previous-block">
            <div v-if="!isPageMount" class="s8c-forge-previous-pills">
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
            <!-- FM-2 · THE LAUNCHABLE HIGHLIGHT — the live conduction for the selected target. -->
            <div v-if="liveConductionForTarget" class="s8c-forge-previous-row">
              <button
                type="button"
                class="s8c-forge-previous-btn s8c-forge-previous-btn--live"
                title="A live Forge conduction for this page — focus it (the ONE MOTION focus leg)."
                @click="focusLiveConduction(liveConductionForTarget.id)"
              >
                <span class="s8c-forge-live-bead" aria-hidden="true"></span>
                <span class="s8c-forge-previous-ulid hifi-mono">{{ shortUlid(liveConductionForTarget.id) }}</span>
                <span class="s8c-forge-previous-model">{{ conductionModelLabel(liveConductionForTarget.model) }} · LIVE</span>
              </button>
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
            <p v-else-if="!liveConductionForTarget" class="s8c-forge-previous-empty">
              No prior conductions for {{ selectedConductionTarget }}.
            </p>
          </div>
        </template>

        <!-- FM-4 · THE BUILD BUTTONS — manifest entries when present (3A · the Forge-authored
             ForgeMenu.json), the hard-coded RD rows as the factory fallback (the Shatterite
             option-row idiom). FIRE: the spawn-anor-route fork (4A — route the SCS:Vermillion
             conferral to the live page-Forge anor spawn one). The copy glyph is the demoted
             clipboard-prime (the quiet secondary). -->
        <div class="s8c-forge-rd-list">
          <span class="s8c-forge-rd-eyebrow hifi-mono">Cascade this into your Suite 8</span>
          <div v-for="row in forgeMenuRows" :key="row.key" class="s8c-forge-rd-row-wrap">
            <button
              type="button"
              class="s8c-forge-rd-row"
              :title="row.prime"
              :disabled="forgeMenuFiring"
              @click="fireForgeMenuEntry(row)"
            >
              <span class="s8c-forge-rd-key hifi-mono">{{ row.key }}</span>
              <span class="s8c-forge-rd-text">
                <span class="s8c-forge-rd-label">{{ row.label }}</span>
                <span v-if="row.line" class="s8c-forge-rd-line">{{ row.line }}</span>
              </span>
            </button>
            <button
              type="button"
              class="s8c-forge-rd-copy hifi-mono"
              title="Copy this commission to the clipboard (the quiet secondary)."
              @click="copyForgeMenuEntry(row)"
            >⧉</button>
          </div>
        </div>
        <p v-if="forgeMenuNote" class="s8c-forge-note s8c-forge-note--menu">{{ forgeMenuNote }}</p>

        <!-- FM-6b · THE REMOVE COMMAND (page mounts ONLY — allowRemove-gated; the panel renders
             none at all). Quiet Pewter voice; the two-click arm/confirm beat; the POST persists
             the flag and the widget hides instantly — the panel remains the re-access surface. -->
        <div v-if="allowRemove" class="s8c-forge-remove-row">
          <button
            type="button"
            class="s8c-forge-remove-btn hifi-mono"
            :class="{ 's8c-forge-remove-btn--armed': removeArmed }"
            title="Remove this Forge Menu widget from the page. The removal persists (per-page · per-SCP · survives S8 page updates); the Suite 8 Control panel keeps the menu."
            @click="fireRemoveWidget"
          >
            {{ removeArmed ? 'CONFIRM REMOVE' : 'Remove this widget' }}
          </button>
          <p v-if="removeNote" class="s8c-forge-note">{{ removeNote }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* ============================================================
   FM-1 · THE FORGE MENU WIDGET — the §IV fold styling MOVED WHOLE (the s8c-* idiom, now
   scoped here). The prismatic flair itself (.s8c-forge-flair · ring + glow + body) is GLOBAL
   (src/style.css · extracted from Suite8HomeLanding) so it reaches this scoped component;
   only the row chrome is scoped here. The panel's parent scoped `.s8c-section` rule still
   lands on this widget's root (Vue parent-scoped-styles-reach-child-root), preserving the
   in-panel spacing; page mounts space through their own flex gap.
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
/* §IV zone recede — the transparent glass bounds the Forge's space when open
   (hifi-pane-transparent supplies glass + embossed border; this trims the fit) */
.s8c-forge-section--open {
  border-radius: 10px;
  padding: 0.45rem 0.5rem;
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
/* MD-S8PM · PM-5 · THE MENU-PATH UPDATE BUTTON — reuses .s8c-forge-btn (the Pewter bevel) as its
   base; the --behind variant wears the SAME amber lineage as the panel version-row control (the
   amber convergence · #fdba74 / #c2410c). Quiet Pewter at rest (current), amber when behind. */
.s8c-forge-update-btn--behind {
  color: #1a0f08;
  background: #fdba74;
  border-top-color: #ffd8a8;
  border-right-color: #ffd8a8;
  border-bottom-color: #c2410c;
  border-left-color: #c2410c;
  box-shadow: -1px 1px 4px rgba(194, 65, 12, 0.55);
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
/* FM-2 · THE LAUNCHABLE HIGHLIGHT — the live page-Forge row wears the live-bead green accent
   (the s8c-bead-live lineage) so the engaged conduction reads as the focusable one. */
.s8c-forge-previous-btn--live {
  border-color: rgba(74, 222, 128, 0.45);
  box-shadow: 0 0 6px rgba(74, 222, 128, 0.16);
}
.s8c-forge-live-bead {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  flex: 0 0 auto;
  background: #4ade80;
  box-shadow: 0 0 5px rgba(74, 222, 128, 0.6);
}
.s8c-forge-previous-ulid {
  color: rgba(240, 246, 252, 0.95);
}
.s8c-forge-previous-model {
  color: rgba(208, 218, 228, 0.68);
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
/* FM-4 · THE BUILD BUTTONS — manifest-anor-factory rows (the Shatterite option-row idiom ·
   the spawn-anor-route fire) + the demoted copy glyph riding each row's edge. */
.s8c-forge-rd-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-top: 0.35rem;
  padding-top: 0.45rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}
.s8c-forge-rd-row-wrap {
  display: flex;
  align-items: stretch;
  gap: 4px;
}
.s8c-forge-rd-row {
  flex: 1 1 auto;
  min-width: 0;
}
.s8c-forge-rd-row:disabled {
  opacity: 0.6;
  cursor: default;
}
/* the quiet secondary — the demoted clipboard-prime as a muted glyph (never the row's voice) */
.s8c-forge-rd-copy {
  flex: 0 0 auto;
  padding: 0 0.45rem;
  font-size: 0.7rem;
  color: rgba(208, 218, 228, 0.45);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 6px;
  background: rgba(0, 0, 0, 0.2);
  cursor: pointer;
  transition: color 0.15s ease, border-color 0.15s ease;
}
.s8c-forge-rd-copy:hover {
  color: rgba(236, 242, 248, 0.85);
  border-color: rgba(255, 255, 255, 0.25);
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
/* FM-6b · THE REMOVE COMMAND — the quiet Pewter voice (muted at rest · the amber alert lineage
   when ARMED — the same rgba(249, 115, 22, *) family as the behind state · never a flooded fill). */
.s8c-forge-remove-row {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  margin-top: 0.45rem;
  padding-top: 0.4rem;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}
.s8c-forge-remove-btn {
  align-self: flex-start;
  padding: 0.18rem 0.55rem;
  font-size: 0.6rem;
  letter-spacing: 0.06em;
  color: rgba(208, 218, 228, 0.55);
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 8px;
  background: transparent;
  cursor: pointer;
  transition: color 0.15s ease, border-color 0.15s ease, background 0.15s ease;
}
.s8c-forge-remove-btn:hover {
  color: rgba(236, 242, 248, 0.85);
  border-color: rgba(255, 255, 255, 0.3);
}
.s8c-forge-remove-btn--armed {
  color: rgb(253, 186, 116);
  border-color: rgba(249, 115, 22, 0.6);
  background: rgba(249, 115, 22, 0.06);
}
</style>
