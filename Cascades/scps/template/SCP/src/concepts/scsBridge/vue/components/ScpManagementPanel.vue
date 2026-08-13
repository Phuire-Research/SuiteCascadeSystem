<script setup lang="ts">
// ScpManagementPanel.vue — THE SCP MANAGEMENT ORGAN (B1b carve · DSP-2a)
//
// THE ONE MANAGEMENT SURFACE, TWO MOUNTS (never a fork): this component holds the
// SCP COMMAND helm (W1 footer roster source · W2 spawn/focus/exit · W3 MULTIPLY worktree
// rail · W4 typed-name DELETE · W6 simulated boot bar · C652 staged multiply bar · C655
// ONLINE/OFFLINE grouping). Extracted WHOLESALE from ScsBridgeSessionManagement.vue so the
// Session Manager (full mode) and the Suite 8 Control drawer (compact mode) render the SAME
// organ off the SAME bridge proxy rails.
//
// compact === true → hide the W1 footer (reads bridgeJson, which the Suite 8 mount does not
// provide) AND the "SCP MANAGEMENT →" nav button (navigation is irrelevant inside a Suite 8
// page). Everything else — the rows, the bars, the panels — renders in BOTH modes.
import { computed, inject, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import {
  BRIDGE_STATUS_COLORS,
  type BridgeJsonShape,
} from '../../scsBridge.type';
import { SCS_BRIDGE_CONTROLLER_KEY } from '../../scsBridgeController';
// THE SCP COMMAND MENU (W3/W4 · THE WORKTREE RAIL) — the reactive gitm controller (gitmJson only)
// carries pendingConfirm back to the client so the WATCHKEY two-call remove round closes here (call-1
// mints the token → gitmJson.pendingConfirm.token → call-2). Same inject-with-getGlobal-fallback
// pattern GitmSwordBButton.vue proves (getGlobal is null/stale in the TaskBar render context).
import { GITM_CONTROLLER_KEY, getGlobalGitmController } from '../../../gitm/gitmController';
import ScsInput from '../../../vue/components/ScsInput.vue';

interface Props {
  // W1 footer data — optional; the footer hides when compact (the Suite 8 mount omits this).
  bridgeJson?: BridgeJsonShape | null;
  // Layout hint — false (default) renders all incl. footer + "SCP MANAGEMENT →" nav button;
  // true hides both (the Suite 8 Control drawer mount).
  compact?: boolean;
}
const props = defineProps<Props>();

// The "SCP MANAGEMENT →" button's action — emitted only in non-compact mode; the parent handles
// navigation (the Session Manager switches sub-page via the C821/C825 dual path; Suite8Control
// never binds the listener because it hides the button). The dual-path getCurrentInstance detection
// MUST stay in the Session Manager host (this component always has the listener bound), so here we
// only emit.
const emit = defineEmits<{ (e: 'navigate-scp-management'): void }>();

// PP-D5 · Ochre-C §6 · Surface 2 · controller bridgeActive binding
const controller = inject(SCS_BRIDGE_CONTROLLER_KEY);
// THE SCP COMMAND MENU (W3/W4) — the gitm controller for the reactive pendingConfirm read (the
// remove round). inject-first with the getGlobal fallback (GitmSwordBButton pattern).
const gitmController = inject(GITM_CONTROLLER_KEY) ?? getGlobalGitmController();

// W1 footer computeds — derived from the panel's own bridgeJson prop + controller inject.
const lastUpdate = computed((): string => {
  if (!props.bridgeJson?.writtenAt) return '—';
  return new Date(props.bridgeJson.writtenAt).toLocaleTimeString();
});

const bridgeStatusDisplay = computed((): string => {
  return props.bridgeJson?.bridgeVersion ?? 'disconnected';
});

// D3D Hotfix-1 · Bug A B1 Single-Source Collapse · PPLD ↔ Connection unification.
// connectionEstablished is the authoritative Connection truth (SF-2 sticky-up gate).
// bridgeActive remains on controller for future debug · demoted from primary display.
// Label semantics aligned with Connection Status card ("Pending" / "Connected").
// Cite: D3D-HOTFIX-1-R7-FUCHSIA-CLINICAL.md §B B1.
const bridgeActiveDisplay = computed((): string =>
  (controller?.connectionEstablished.value ?? false) ? 'Connected' : 'Pending',
);

// ═══════════════════════════════════════════════════════════════════════════
// SCP COMMAND (W1 footer roster source + W2 management section) · SCP-COMMAND-MENU
// ───────────────────────────────────────────────────────────────────────────
// LAW · REUSE ONLY, INVENT NO TRANSPORT. The Installation sub-page (MD-B ·
// ScsBridgeInstallationSubPage.vue) already proved the roster rail: the three
// SCP-server proxy routes (vue.principle.ts) talk to THE BRIDGE only —
//   GET  /bridge-roster  → { bridgeUp, installedScps[], boundScps{}, writtenAt }
//   POST /bridge-boot    → SPAWN an offline SCP  (scpName in body)
//   POST /bridge-focus   → FOCUS a live SCP      (scpName in body)
// This helm SURFACES those same rails; nothing new is minted. installedScps =
// the SCPs.json registry broadcast · boundScps = the live spawnsByScp projection.
// LAW · a row is LIVE when its name is a key of boundScps (present = live);
// offline → SPAWN (/bridge-boot) · live → FOCUS (/bridge-focus). BRIDGE_STATUS_COLORS
// tokens carry the badge (connected=live · idle=offline) per the Suite-color map.
// ═══════════════════════════════════════════════════════════════════════════
type ScpCommandBoundEntry = { port: number; status: string; browserUrl: string };
type ScpCommandRosterShape = {
  bridgeUp: boolean;
  installedScps: string[];
  boundScps: Record<string, ScpCommandBoundEntry>;
  // W6a · THE LIFECYCLE PROJECTION (SCM W6) · scpName → FSM-state-string (pending/idle/booting/live).
  // The booting-signal source the simulated loading bar + focus-on-open ride (W6b/W6c).
  scpLifecycle: Record<string, string>;
  // SWFB · W6 REFINEMENT · THE WINDOW-PRESENCE PROJECTION · scpName → visible Electron windowId. The
  // TRUE window-open signal — bound by cli-handler AFTER FSM 'live', so a name here means its OS window
  // actually exists (not merely that the server answered). The phase engine gates its ONE focus round
  // on THIS (not on 'live'), closing the moments gap the user observed. Empty on a pre-refinement bridge.
  scpWindows: Record<string, number>;
  // M2 · WINDOW-RENDERED (D-WR C628) · scpName → first did-finish-load epoch-ms. One step past
  // scpWindows (BOUND): a name here means the OS window truly PAINTED (electronWindow's M1
  // show-on-rendered moment), not merely that cli-handler bound its windowId at construction. The
  // phase engine gates its ONE focus round on THIS — so /bridge-focus never lands on a bound-but-blank
  // window (the exact blank the user saw focused). Empty on a pre-rendered-refinement bridge.
  scpWindowsRendered: Record<string, number>;
  // C653 · THE STATUS PROJECTION (MEND C) · scpName → PSSM status string ('live' | 'pending' |
  // 'installing'). A fresh MULTIPLY worktree instance is registered 'installing' (its tree carries
  // package.json but NO node_modules) and flips to 'pending' when its async npm install exits. The
  // MULTIPLY staged bar holds the INSTALL tick + the instance-row Spawn stays disabled while a name
  // reads 'installing' here. Empty on a pre-C653 bridge (⇒ every instance treated install-complete).
  scpStatuses: Record<string, string>;
  writtenAt: number;
};

const scpCommandRoster = ref<ScpCommandRosterShape>({
  bridgeUp: false,
  installedScps: [],
  boundScps: {},
  scpLifecycle: {},
  scpWindows: {},
  scpWindowsRendered: {},
  scpStatuses: {},
  writtenAt: 0,
});
// Per-row in-flight guard (Spawn/Focus) · mirrors InstallationSubPage rowBusy.
const scpCommandRowBusy = ref<Record<string, boolean>>({});
let scpCommandPollTimer: ReturnType<typeof setTimeout> | null = null;

async function refreshScpCommandRoster(): Promise<void> {
  try {
    const res = await fetch('/bridge-roster');
    scpCommandRoster.value = (await res.json()) as ScpCommandRosterShape;
  } catch {
    scpCommandRoster.value = { bridgeUp: false, installedScps: [], boundScps: {}, scpLifecycle: {}, scpWindows: {}, scpWindowsRendered: {}, scpStatuses: {}, writtenAt: 0 };
  }
  // W6b + W6c · every roster read drives the open spawn rounds forward on the fresh signal (phase
  // advance + focus-on-open). Guarded internally to a no-op when no round is open.
  advanceSpawnRounds(scpCommandRoster.value);
  // C652 · every roster read likewise drives the open MULTIPLY rounds forward (create→register→ready
  // on the ${base}--wt-* citizen surfacing). Guarded internally to a no-op when no round is open.
  advanceMultiplyRounds(scpCommandRoster.value);
}

// The helm rows · union of registry inventory + live-bound names, live-badged.
// THE SCP COMMAND MENU (W3 · THE WORKTREE RAIL) — the instance-name scheme (D-SCM-W3 §3e):
// `${scpName}--wt-${branchSlug}`. A row is a WORKTREE INSTANCE when its name carries the `--wt-`
// marker → it gets the DELETE (W4) affordance instead of MULTIPLY.
const WT_INSTANCE_MARKER = '--wt-';
const isWorktreeInstanceName = (name: string): boolean => name.includes(WT_INSTANCE_MARKER);

// C629 · THE LIVE-PRESENTATION LAW (the last un-hooked portion · S4∥S7 convergent): the
// LIVE badge + Focus v-if + Spawn v-if all derive from row.live — bare boundScps membership
// flipped them at spawn INITIATION (setStatus 'live' fires 10.6s before scp.window.shown,
// R7 field-proven). During an OPEN spawn round the live presentation holds until the round's
// terminal phase 'done' (post-RENDERED, keeping the badge/Focus synchronized with the bar
// through the DONE_LINGER settle). Steady-state rows (no round in flight — already live at
// page load) keep raw membership.
const rowPresentsLive = (name: string, bound: Record<string, unknown>): boolean => {
  const round = controller?.spawnProgressByScp.value[name];
  if (round) return round.phase === 'done';
  return name in bound;
};

const scpCommandRows = computed(() => {
  const bound = scpCommandRoster.value.boundScps ?? {};
  // C653 · THE STATUS PROJECTION (MEND C) · the per-SCP PSSM status map — a row is 'installing'
  // while its fresh MULTIPLY worktree instance's async npm install runs (registered 'installing' by
  // gitmWorktreeAdd.quality.ts; flips to 'pending' on install exit). The instance-row Spawn button
  // is disabled while installing (its node_modules are absent → a spawn would `sh: vite: command
  // not found`). Only worktree instances (--wt-) ever carry 'installing'; a base SCP never does.
  const statuses = scpCommandRoster.value.scpStatuses ?? {};
  const names = new Set<string>([
    ...(scpCommandRoster.value.installedScps ?? []),
    ...Object.keys(bound),
  ]);
  return [...names].sort().map((name) => ({
    name,
    live: rowPresentsLive(name, bound),
    port: bound[name]?.port ?? null,
    // W3/W4 · a worktree instance row (name carries `--wt-`) → DELETE affordance; else → MULTIPLY.
    isInstance: isWorktreeInstanceName(name),
    // C653 · the instance is still installing dependencies → Spawn disabled (title below).
    installing: statuses[name] === 'installing',
  }));
});

// C655 · THE HELM GROUPING (MEND B) — the SCP COMMAND rows split into an ONLINE
// section (row.live · the running SCPs) leading and an OFFLINE section (the rest)
// following, MIRRORING the sessions list's ONLINE/OFFLINE section-label idiom in
// this same component (isFirstOfflineRow + session-section-label family). The
// grouping is presentational only — scpCommandRows keeps its sort + C621-C653
// row behavior (badges · Spawn/Focus · MULTIPLY · Delete · the bars).
const scpCommandOnlineRows = computed(() => scpCommandRows.value.filter((r) => r.live));
const scpCommandOfflineRows = computed(() => scpCommandRows.value.filter((r) => !r.live));
// THE SAFE INTERLEAVE — online first then offline; a single v-for walks this so the
// OFFLINE label injects at the boundary row (never a standalone/undefined item).
const scpCommandSectionedRows = computed(() => [
  ...scpCommandOnlineRows.value,
  ...scpCommandOfflineRows.value,
]);
// True at the first OFFLINE row — the template injects the OFFLINE label before it
// (mirrors isFirstOfflineRow · C535 visibility law: OFFLINE chrome renders ONLY
// when it holds rows; the ONLINE label always leads whenever anything is shown).
function isFirstScpCommandOfflineRow(index: number): boolean {
  return scpCommandOfflineRows.value.length > 0 && index === scpCommandOnlineRows.value.length;
}

// W2 action · offline → /bridge-boot (SPAWN) · live → /bridge-focus (FOCUS).
// The SAME handler InstallationSubPage proved; the route decides the verb.
async function handleScpCommandAction(
  name: string,
  route: '/bridge-boot' | '/bridge-focus',
): Promise<void> {
  if (scpCommandRowBusy.value[name]) return;
  scpCommandRowBusy.value = { ...scpCommandRowBusy.value, [name]: true };
  // W6b · THE SIMULATED BAR (SCM W6) · a SPAWN press OPENS a spawn-progress round on the controller
  // (phase 'requested'). App-singleton state → the round + its bar survive a page hop mid-boot. A
  // FOCUS press is not a spawn round (no bar).
  if (route === '/bridge-boot') controller?.startSpawnProgress(name);
  try {
    await fetch(route, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scpName: name }),
    });
    void refreshScpCommandRoster();
  } catch {
    // Transport failure is surfaced only by the row settling back to its badge;
    // the roster poll re-establishes truth on the next tick (ACK-only rail).
  } finally {
    const next = { ...scpCommandRowBusy.value };
    delete next[name];
    scpCommandRowBusy.value = next;
  }
}

// SES · THE STOP RAIL (C632 · the EXIT ability) · live → /bridge-stop (STOP).
// The honest full-stop: the bridge closes the SCP window, SIGTERMs its dedicated
// server, drives the lifecycle FSM dying→gone, and writes status 'pending'. Busy-
// guarded like handleScpCommandAction. RECOVERABLE — Spawn re-boots; NO confirm
// modal (the typed-name round stays reserved for the destructive worktree DELETE).
// Composes with the spawn-round state: clearSpawnProgress(name) tears down any
// in-flight bar for this row (a stop mid-boot must not leave a phantom sweep). The
// roster poll flips the row offline naturally once the FSM settles.
async function handleScpCommandExit(name: string): Promise<void> {
  if (scpCommandRowBusy.value[name]) return;
  scpCommandRowBusy.value = { ...scpCommandRowBusy.value, [name]: true };
  // Compose with the spawn-round state — tear down any live spawn bar for this row.
  controller?.clearSpawnProgress(name);
  try {
    await fetch('/bridge-stop', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scpName: name }),
    });
    void refreshScpCommandRoster();
  } catch {
    // Transport failure surfaces only by the row not settling offline; the roster
    // poll re-establishes truth on the next tick (ACK-only rail · same as W2).
  } finally {
    const next = { ...scpCommandRowBusy.value };
    delete next[name];
    scpCommandRowBusy.value = next;
  }
}

// ───────────────────────────────────────────────────────────────────────────
// W6b + W6c · THE SIMULATED LOADING BAR + FOCUS-ON-OPEN (SCM W6 · lifecycle-signal driven)
// ───────────────────────────────────────────────────────────────────────────
// THE SIGNAL (never a timer): the roster's scpLifecycle projection carries each SCP's FSM state
// ('pending' | 'idle' | 'booting' | 'live'). The booting-class = every pre-live state.
//
// SWFB · W6 REFINEMENT · THE WINDOW-BOUND GATE. Previously a row landed 'focusing' the moment FSM
// 'live' fired — but the OS WINDOW spawns MOMENTS LATER (the server answers first, the window loads
// second, THEN cli-handler binds windowId). Focusing on 'live' fired /bridge-focus into a window that
// did not yet exist. The refined signal: hold the bar sweeping through 'booting' until FSM-live AND
// window presence (scpWindows[name]) — the TRUE window-open moment. Only THEN advance to 'focusing'
// (the ONE /bridge-focus lands on a window that actually exists) → 'done'. 'booting' is REUSED for the
// post-live pre-window gap (no new phase · smallest surface); the bar keeps its indeterminate sweep.
// Focus-on-open fires ONCE per spawn round (the didFocus guard · never a timer). The bar reads ONLY the
// controller ref → a page hop + return re-renders it mid-boot (W6d law).
const BOOTING_CLASS = new Set<string>(['pending', 'idle', 'booting']);

// The controller-held spawn-progress map (app-singleton · survives navigation). The template's bar
// reads THIS (via spawnPhaseFor) so it is agnostic to whether this component just mounted.
const spawnProgress = computed<Record<string, import('../../scsBridgeController').ScsBridgeSpawnProgressEntry>>(
  () => controller?.spawnProgressByScp.value ?? {},
);
const spawnPhaseFor = (name: string): string | null => spawnProgress.value[name]?.phase ?? null;
// The bar renders while the round is pre-live (requested anor booting) — it resolves/fills on live.
const spawnBarActiveFor = (name: string): boolean => {
  const phase = spawnPhaseFor(name);
  return phase === 'requested' || phase === 'booting';
};

// WHILE any spawn round is in flight (requested/booting/focusing) the poll tightens to 1s so the
// booting→live signal is caught promptly; with none in flight it relaxes to 5s (the original idiom).
const anySpawnInFlight = computed<boolean>(() =>
  Object.values(spawnProgress.value).some(
    (e) => e.phase === 'requested' || e.phase === 'booting' || e.phase === 'focusing',
  ),
);

// THE PHASE-ADVANCE ENGINE · reads the roster's scpLifecycle + boundScps and drives each open
// spawn round forward on the SIGNAL. Fires focus-on-open exactly ONCE (didFocus guard), then lingers
// on 'done' briefly so the bar visually resolves before clearing. NEVER a timer for the WHEN — the
// linger is only the visual settle after the live signal already arrived.
const DONE_LINGER_MS = 900;
function advanceSpawnRounds(roster: ScpCommandRosterShape): void {
  const progress = spawnProgress.value;
  const openNames = Object.keys(progress);
  if (openNames.length === 0) return;
  const bound = roster.boundScps ?? {};
  const lifecycle = roster.scpLifecycle ?? {};
  // M2 · WINDOW-RENDERED (D-WR C628) · the window-RENDERED map · a name here = its OS window truly
  // PAINTED (electronWindow's M1 show-on-rendered did-finish-load moment). This SUPERSEDES scpWindows
  // (BOUND) as the focus gate — a windowId lands at construction, MOMENTS before paint, so gating on
  // it (the prior windowBound) still fired /bridge-focus into a bound-but-blank window (the exact
  // blank the user saw focused). Gating on RENDERED closes that residual gap.
  const rendered = roster.scpWindowsRendered ?? {};
  for (const name of openNames) {
    const entry = progress[name];
    if (!entry || entry.phase === 'done' || entry.phase === 'failed') continue;
    const fsm = lifecycle[name];
    const boundEntry = bound[name];
    const isLiveBound = name in bound && typeof boundEntry?.browserUrl === 'string' && boundEntry.browserUrl.length > 0;
    // M2 · THE WINDOW-RENDERED SIGNAL — a numeric windowRenderedAt under this name means the OS
    // window's FIRST successful did-finish-load fired (electronWindow showed it · truly painted). This,
    // NOT windowId presence (BOUND) and NOT FSM 'live', gates focus.
    // C630 · THE ROUND-FRESHNESS LAW (the re-spawn regression): windowRenderedAt PERSISTS in
    // SCPs.json from the PREVIOUS round — bare presence short-circuited a re-spawn to 'done' in one
    // poll beat (no bar · instant Live/Focus via the C629 phase predicate). A spawn-round gate
    // compares the signal's TIMESTAMP against the round's startedAt — only a render that happened
    // AFTER this round's Spawn press counts. First-spawn behavior unchanged (no prior key).
    const renderedAt = rendered[name];
    const windowRendered = typeof renderedAt === 'number' && renderedAt > entry.startedAt;
    const isLive = isLiveBound || fsm === 'live';
    if (windowRendered) {
      // WINDOW TRULY RENDERED → focus-on-open. Fire /bridge-focus ONCE for this round (didFocus guard).
      // The window is painted, so the focus lands on real content (the blank-focus fix — no more focusing
      // into a bound-but-blank window).
      if (!entry.didFocus) {
        controller?.advanceSpawnProgress(name, 'focusing', true);
        void fetch('/bridge-focus', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ scpName: name }),
        }).catch(() => {
          // Focus is best-effort (ACK-only rail) — the window is open regardless; the bar still resolves.
        });
      }
      // Resolve the bar: move to 'done' + clear after a short linger (visual settle only).
      controller?.advanceSpawnProgress(name, 'done');
      const settleName = name;
      window.setTimeout(() => controller?.clearSpawnProgress(settleName), DONE_LINGER_MS);
    } else if (isLive || (fsm !== undefined && BOOTING_CLASS.has(fsm))) {
      // M2 · FSM live-or-booting (may even be window-BOUND) BUT NOT yet RENDERED → hold 'booting' so the
      // bar keeps sweeping through the post-live/post-bound pre-RENDERED gap. The user sees continuous
      // loading until the OS window actually PAINTS (windowRendered above), NOT a premature 'Launched'
      // resolve into a blank window.
      controller?.advanceSpawnProgress(name, 'booting');
    }
    // else: no FSM entry yet (pre-registration) → stay 'requested' (the bar keeps its indeterminate run).
  }
}

// ───────────────────────────────────────────────────────────────────────────
// THE SCP COMMAND MENU (W3 · MULTIPLY · the worktree rail) + (W4 · TYPED-NAME DELETE)
// ───────────────────────────────────────────────────────────────────────────
// TRANSPORT (REUSED · NOT invented) — the SAME rail GitmSwordBButton.vue proves:
// controller.triggerGitmAction('gitm_*', args) dispatches a gitm_* MCP tool (the void
// same-origin setter · scsBridgeController.ts:1828). The remove ROUND needs the minted
// confirmToken back — it rides the reactive gitmController.gitmJson.pendingConfirm (the
// gitm.json relay · the exact channel GitmTurnOverAConfirmModal's two-call handshake uses).
// If the scsBridge controller is unreachable (null inject) the affordances degrade HONESTLY
// (disabled + a title naming the missing rail · never a silent dispatch into the void).
const worktreeRailReachable = computed<boolean>(() => controller != null && typeof controller.triggerGitmAction === 'function');

// W3 · MULTIPLY — a compact per-row branch prompt (default = the SCP's own working branch anor a
// fresh slug). Kept minimal: one open row at a time, the input seeds a branch, FIRE dispatches
// gitm_worktree_add for that SCP. The bridge derives the instance name (${scpName}--wt-${slug}).
const multiplyOpenFor = ref<string>(''); // the scpName whose MULTIPLY prompt is open ('' = none)
const multiplyBranch = ref<string>('');

function openMultiply(name: string): void {
  multiplyOpenFor.value = name;
  // Default seed = a timestamped working slug (the SCP's live branch is not carried in this roster;
  // the bridge's own existence-guard rejects a non-existent branch honestly, so the user edits it).
  multiplyBranch.value = `b/${name}-${Date.now()}`;
}
function cancelMultiply(): void {
  multiplyOpenFor.value = '';
  multiplyBranch.value = '';
}
function fireMultiply(name: string): void {
  const branch = multiplyBranch.value.trim();
  if (branch.length === 0 || !worktreeRailReachable.value) return;
  // C652 · THE STAGED MULTIPLY ROUND — open a create-round on THIS base SCP (stage 'create') BEFORE
  // the dispatch. The bar rides OBSERVABLE signals only (never a timer for the WHEN): the roster poll
  // advances 'register' when the ${name}--wt-* citizen lands, then 'ready' + a short linger on the row
  // rendered. A relayed errorCode (the gitmController watch below) resolves it to an honest failure line.
  startMultiplyRound(name);
  // originScpName = the row's SCP so the bridge resolves ITS OWN repo (the FKIS origin thread).
  controller?.triggerGitmAction('gitm_worktree_add', { originScpName: name, branch });
  cancelMultiply();
  // Tighten the poll immediately (anyMultiplyInFlight flips the cadence to 1s · W6 idiom) so the new
  // ${name}--wt-* citizen is caught promptly. The new instance appears as a fresh SCPs.json citizen.
  window.setTimeout(() => void refreshScpCommandRoster(), 700);
}

// ───────────────────────────────────────────────────────────────────────────
// C652 · THE STAGED MULTIPLY BAR (MEND B · the SCP's birth-from-the-worktree readout)
// ───────────────────────────────────────────────────────────────────────────
// THE SMALLER HONEST SHAPE (the W6d cross-page law WEIGHED, then declined): a multiply round is
// SHORT-LIVED — create→register lands in a poll tick or two and RESOLVES before the user Spawns (the
// W6 boot bar takes over from there). It does NOT need the app-singleton controller survival the
// spawn-progress rounds require (10s+ boot spanning a page hop). So this is LOCAL component state (a
// plain ref), driven by the ALREADY-component-local roster poll — the smaller honest shape.
//
// THE STAGES (three labeled ticks · the panel renders a segmented mini-bar):
//   1 CREATE   — from FIRE until the ${base}--wt-* citizen appears (the void create rail · no positive
//                ack channel exists — lastActionResult is a bridge WITNESS, not a relayed field — so
//                stage 1 holds on the sweep until stage 2's OBSERVABLE roster signal, OR resolves to a
//                failure line on a relayed errorCode).
//   2 REGISTER — the instance name is in the roster (installed anor bound). The row is materializing.
//   3 INSTALL  — C653 · THE SKIPPED STEP. A `git worktree add` tree carries only TRACKED files
//                (package.json but NO node_modules) — the instance cannot boot (`sh: vite: command
//                not found`) until its async `npm install` (spawned by gitmWorktreeAdd.quality.ts)
//                lands. This tick holds WHILE scpStatuses[instanceName]==='installing'; it clears the
//                instant the status flips off 'installing' (the bridge stamps 'pending' on install exit).
//   4 READY    — the instance ROW is rendered with Spawn enabled → resolve + a short linger, then clear.
type MultiplyStage = 'create' | 'register' | 'install' | 'ready' | 'failed';
type MultiplyRoundEntry = {
  stage: MultiplyStage;
  startedAt: number;
  // The ${base}--wt- prefix this round watches for in the roster (the register signal · the instance
  // name is bridge-derived, so we match the PREFIX, resolving the concrete name on first sight).
  instancePrefix: string;
  // Resolved once stage 2 lands — the concrete ${base}--wt-${slug} name (for the ready-row check).
  instanceName: string;
  // An honest failure line (a relayed errorCode/errorMessage) — non-empty → the bar reads 'failed'.
  failure: string;
};
// Keyed by the BASE scpName that was multiplied (one open round per base row at a time · matches the
// one-open-panel discipline). Local ref (NOT controller state · the smaller honest shape above).
const multiplyRoundByScp = ref<Record<string, MultiplyRoundEntry>>({});

function startMultiplyRound(baseName: string): void {
  multiplyRoundByScp.value = {
    ...multiplyRoundByScp.value,
    [baseName]: {
      stage: 'create',
      startedAt: Date.now(),
      instancePrefix: `${baseName}${WT_INSTANCE_MARKER}`,
      instanceName: '',
      failure: '',
    },
  };
}
function clearMultiplyRound(baseName: string): void {
  if (!multiplyRoundByScp.value[baseName]) return;
  const next = { ...multiplyRoundByScp.value };
  delete next[baseName];
  multiplyRoundByScp.value = next;
}

// The template reads these (per-base-row): is a round open, its stage, and the ordered tick states.
const multiplyRoundFor = (baseName: string): MultiplyRoundEntry | null =>
  multiplyRoundByScp.value[baseName] ?? null;
const multiplyStageOrder: MultiplyStage[] = ['create', 'register', 'install', 'ready'];
// A tick is 'done' when the round is PAST it, 'active' on the current sweep, else 'pending'. On a
// 'failed' round every not-yet-done tick reads 'failed' (the honest inline stop · never a stuck bar).
const multiplyTickState = (baseName: string, tick: MultiplyStage): 'done' | 'active' | 'pending' | 'failed' => {
  const round = multiplyRoundByScp.value[baseName];
  if (!round) return 'pending';
  if (round.stage === 'failed') {
    // The honest-failure watch fires ONLY on a create/register-stage round (the worktree-add exec/guard
    // failed BEFORE the instance registered → instanceName === ''), so in practice every tick reads
    // 'failed'. Guard defensively: a pre-'ready' tick whose stage was genuinely reached (instanceName
    // latched) reads 'done'; the rest read 'failed' (the honest inline stop · never a stuck bar).
    return multiplyStageOrder.indexOf(tick) < multiplyStageOrder.indexOf('ready') && round.instanceName !== ''
      ? 'done'
      : 'failed';
  }
  const cur = multiplyStageOrder.indexOf(round.stage);
  const idx = multiplyStageOrder.indexOf(tick);
  if (idx < cur) return 'done';
  if (idx === cur) return 'active';
  return 'pending';
};

// WHILE any multiply round is pre-ready the poll tightens to 1s (catch the register signal promptly ·
// the W6 anySpawnInFlight idiom). A 'ready'/'failed' round is resolving (its linger clears it) — it
// does not hold the fast cadence.
const anyMultiplyInFlight = computed<boolean>(() =>
  Object.values(multiplyRoundByScp.value).some(
    (r) => r.stage === 'create' || r.stage === 'register' || r.stage === 'install',
  ),
);

// THE ROUND-ADVANCE ENGINE (mirror advanceSpawnRounds) — reads the roster's installed+bound names and
// drives each open multiply round forward on the OBSERVABLE signal. NEVER a timer for the WHEN; the
// MULTIPLY_READY_LINGER is only the visual settle after the row already rendered.
const MULTIPLY_READY_LINGER_MS = 1100;
function advanceMultiplyRounds(roster: ScpCommandRosterShape): void {
  const open = multiplyRoundByScp.value;
  const baseNames = Object.keys(open);
  if (baseNames.length === 0) return;
  const bound = roster.boundScps ?? {};
  const names = new Set<string>([...(roster.installedScps ?? []), ...Object.keys(bound)]);
  // C653 · THE STATUS PROJECTION (MEND C) · the per-SCP PSSM status map — the install-transient rail.
  const statuses = roster.scpStatuses ?? {};
  for (const baseName of baseNames) {
    const round = open[baseName];
    if (!round || round.stage === 'ready' || round.stage === 'failed') continue;
    // STAGE 2 REGISTER — the ${base}--wt-* citizen appeared in the roster (installed anor bound). Match
    // the prefix, latch the concrete instance name (the register signal · resolves stage 'create'→'register').
    const found = round.instanceName !== ''
      ? round.instanceName
      : [...names].find((n) => n.startsWith(round.instancePrefix)) ?? '';
    if (found === '') continue; // stage 1 holds until the citizen lands (no positive create ack rail).
    if (round.stage === 'create') {
      multiplyRoundByScp.value = {
        ...multiplyRoundByScp.value,
        [baseName]: { ...round, stage: 'register', instanceName: found },
      };
      continue; // one advance per poll beat (the install-status check runs on the NEXT tick).
    }
    // STAGE 3 INSTALL (C653 · THE SKIPPED STEP) — the citizen is registered; now its node_modules
    // must land. gitmWorktreeAdd.quality.ts registered it 'installing' and spawned `npm install`.
    // Advance register→install unconditionally on the tick AFTER register (the instance IS registered),
    // so the INSTALL tick shows while scpStatuses[found]==='installing'. One advance per beat.
    if (round.stage === 'register') {
      multiplyRoundByScp.value = {
        ...multiplyRoundByScp.value,
        [baseName]: { ...round, stage: 'install', instanceName: found },
      };
      continue;
    }
    // STAGE 4 READY — install complete (scpStatuses[found] is NO LONGER 'installing' — the bridge
    // stamped 'pending' when the async npm install exited) AND the instance ROW is materialized
    // (present in the sorted names → scpCommandRows renders it, Spawn now enabled). Resolve + a short
    // linger, then clear (the user Spawns from here). The install tick holds until the status flips.
    const installing = statuses[found] === 'installing';
    if (round.stage === 'install' && !installing && names.has(found)) {
      multiplyRoundByScp.value = {
        ...multiplyRoundByScp.value,
        [baseName]: { ...round, stage: 'ready', instanceName: found },
      };
      const settleName = baseName;
      window.setTimeout(() => clearMultiplyRound(settleName), MULTIPLY_READY_LINGER_MS);
    }
  }
}

// THE HONEST-FAILURE WATCH (mirror the W4 pendingConfirm watch idiom) — a relayed errorCode from the
// create leg (gitm_worktree_add's guard/exec failure lands errorCode/errorMessage · the ONLY relayed
// reveal channel · lastActionResult is a WITNESS, not relayed) resolves the newest open round to a
// 'failed' inline line rather than a stuck bar. Scoped to the worktree-add error codes so an unrelated
// gitm error never trips a multiply round.
const WORKTREE_ADD_ERROR_CODES = new Set(['GITM_WORKTREE_ADD_FAILED', 'GITM_WORKTREE_ADD_GUARD']);
if (gitmController) {
  watch(
    () => {
      const j = gitmController.gitmJson.value;
      return j ? { code: j.errorCode, msg: j.errorMessage } : null;
    },
    (err) => {
      if (err == null || !WORKTREE_ADD_ERROR_CODES.has(err.code)) return;
      // Resolve the NEWEST open create/register round (the one that just fired) to failed.
      const open = multiplyRoundByScp.value;
      const candidates = Object.entries(open).filter(([, r]) => r.stage === 'create' || r.stage === 'register');
      if (candidates.length === 0) return;
      candidates.sort((a, b) => b[1].startedAt - a[1].startedAt);
      const [baseName, round] = candidates[0];
      multiplyRoundByScp.value = {
        ...multiplyRoundByScp.value,
        [baseName]: { ...round, stage: 'failed', failure: err.msg || err.code },
      };
    },
  );
}

// W4 · TYPED-NAME DELETE — the ARMED→FIRE pattern strengthened to typed-match. The user must type
// the EXACT instanceName; mismatch = disarmed. FIRE runs the two-call remove: call-1 (no token) mints
// pendingConfirm → the reactive gitmJson relay surfaces pendingConfirm.token → call-2 with the token.
const deleteOpenFor = ref<string>(''); // the instanceName whose DELETE panel is open ('' = none)
const deleteTyped = ref<string>(''); // the user's typed confirmation
const deletePhase = ref<'idle' | 'awaiting-token'>('idle'); // call-1 dispatched → awaiting the minted token

// The ARM gate — FIRE is armed ONLY when the typed name EXACTLY matches the open instanceName.
const deleteArmed = computed<boolean>(
  // C656 · THE TYPED-DELETE ARM (user law: instance names are unreasonable to type — the
  // consent word is `Delete`, CASE-INSENSITIVE). The bridge PARAMSEAL still binds the token
  // to the instanceName server-side; only the USER'S consent gesture changes.
  () => deleteOpenFor.value !== '' && deleteTyped.value.trim().toLowerCase() === 'delete' && worktreeRailReachable.value,
);

function openDelete(name: string): void {
  deleteOpenFor.value = name;
  deleteTyped.value = '';
  deletePhase.value = 'idle';
}
function cancelDelete(): void {
  deleteOpenFor.value = '';
  deleteTyped.value = '';
  deletePhase.value = 'idle';
}
function fireDelete(): void {
  if (!deleteArmed.value) return; // disarmed on any mismatch — never fires the wrong instance.
  const name = deleteOpenFor.value;
  // MD-ARC+C W7b · THE STUCK-REMOVE CURE (the AmberlightStudio--wt field break): the prior
  // WATCHKEY two-call awaited pendingConfirm on THIS surface's relayed gitmJson — but a
  // NON-pointer origin's token lands on the ORIGIN's OWN rail (MD-C M7), which an OFFLINE
  // instance never relays here → 'Removing…' forever. The delete now rides the Wave-7
  // scp_delete: ONE ack call — WAPF H2 runs `git worktree remove --force` from the PARENT
  // (git functionality maintained) + registry removal + slice/watcher teardown. The
  // typed-name arm above IS the destructive confirmation; no token round, no stuck channel.
  controller?.triggerGitmAction('scp_delete', { scpName: name });
  cancelDelete();
  window.setTimeout(() => void refreshScpCommandRoster(), 1200);
}

// W6b · THE DYNAMIC POLL (SCM W6) · the poll idiom kept, the interval made dynamic. 1s WHILE any
// spawn round is in flight (catch the booting→live signal promptly) · 5s when idle (the original
// InstallationSubPage cadence · no needless traffic). A self-scheduling setTimeout re-reads
// anySpawnInFlight each tick so the cadence flips the instant a Spawn opens a round (anor the last
// round resolves). scpCommandPollTimer holds the pending timeout so unmount clears it cleanly.
const SCP_POLL_INTERVAL_ACTIVE_MS = 1000;
const SCP_POLL_INTERVAL_IDLE_MS = 5000;
function scheduleScpCommandPoll(): void {
  // C652 · a multiply round in flight ALSO tightens the cadence to 1s (catch the register signal
  // promptly · the W6 idiom extended to the create rail).
  const delay = anySpawnInFlight.value || anyMultiplyInFlight.value ? SCP_POLL_INTERVAL_ACTIVE_MS : SCP_POLL_INTERVAL_IDLE_MS;
  scpCommandPollTimer = setTimeout(() => {
    void refreshScpCommandRoster().finally(() => scheduleScpCommandPoll());
  }, delay);
}

onMounted(() => {
  void refreshScpCommandRoster();
  // The bridge registers/spawns async — a light poll keeps the helm honest (dynamic-cadence variant
  // of the InstallationSubPage roster poll · W6b).
  scheduleScpCommandPoll();
});
onBeforeUnmount(() => {
  if (scpCommandPollTimer !== null) clearTimeout(scpCommandPollTimer);
});
</script>

<template>
  <div class="scp-management-panel">
    <!-- C832 · SEAT 2 (Pewter) · the "SCP MANAGEMENT →" nav button. Full mode only — hidden when
         compact (the Suite 8 mount is already inside SCP management context; navigation is
         irrelevant). Emits navigate-scp-management; the SessionManager host owns the C821/C825
         dual-path travel (getCurrentInstance listener detection stays in the host). -->
    <div v-if="!compact" class="smgmt-scpm-row">
      <button type="button" class="hifi-btn hifi-btn-blue smgmt-scpm-btn" @click="emit('navigate-scp-management')">SCP MANAGEMENT →</button>
    </div>

    <!-- ═══ SCP COMMAND · W2 · the helm section (SPAWN offline · FOCUS live) ═══
         LAW · this section SHARES the menu column with the spawn-session controls
         above and the compact footer below. Every row rides the EXISTING bridge
         proxy rails (/bridge-boot = SPAWN · /bridge-focus = FOCUS), the same rails
         the Installation sub-page (MD-B) proved — NO transport is invented here.
         A row is LIVE iff its name keys boundScps (present = live). -->
    <section class="scp-command-section hifi-pane-base">
      <div class="scp-command-head">
        <span class="scp-command-title">SCP COMMAND</span>
        <span class="scp-command-count">{{ scpCommandRows.length }}</span>
      </div>
      <p v-if="scpCommandRows.length === 0" class="scp-command-empty">
        No SCPs installed — install one from the Installation page.
      </p>
      <!-- C655 · MEND B · ONLINE section label — always leads whenever any row is shown
           (mirrors the sessions list · session-section-label idiom). -->
      <div
        v-if="scpCommandRows.length > 0"
        class="scp-command-section-label scp-command-section-label-online"
        role="heading"
        aria-level="3"
      >
        <span class="scp-command-section-label-text">ONLINE ·</span>
        <span class="scp-command-section-label-count">{{ scpCommandOnlineRows.length }}</span>
      </div>
      <template v-for="(row, index) in scpCommandSectionedRows" :key="row.name">
      <!-- C655 · MEND B · THE OFFLINE BOUNDARY · label injects before the first offline row
           (C535 law: OFFLINE chrome only when it holds rows). Anchored to a real, keyed row
           fragment — never a standalone item (mirrors isFirstOfflineRow at the sessions list). -->
      <div
        v-if="isFirstScpCommandOfflineRow(index)"
        class="scp-command-section-label scp-command-section-label-offline"
        role="heading"
        aria-level="3"
      >
        <span class="scp-command-section-label-text">OFFLINE ·</span>
        <span class="scp-command-section-label-count">{{ scpCommandOfflineRows.length }}</span>
      </div>
      <!-- C621 · THE TWO-ROW CARD (user Pewter critique): the round pill badge wrapped into a
           ring under the OSR and OFFSET the row. Row 1 = identity (name + SQUARED status+port
           chip, nowrap, same line); Row 2 = the per-SCP controls on their own line. -->
      <div class="scp-command-card">
      <div class="scp-command-row-id">
        <span class="scp-command-name">{{ row.name }}</span>
        <span class="scp-command-spacer"></span>
        <span
          class="scp-command-badge"
          :style="{
            color: row.live ? BRIDGE_STATUS_COLORS.connected : BRIDGE_STATUS_COLORS.idle,
            borderColor: row.live ? BRIDGE_STATUS_COLORS.connected : BRIDGE_STATUS_COLORS.idle,
          }"
        >{{ row.live ? `LIVE · :${row.port}` : 'OFFLINE' }}</span>
      </div>
      <!-- W6b · THE SIMULATED LOADING BAR (SCM W6) · rides ONLY the controller spawn-progress state
           (survives a page hop mid-boot). Renders under the identity row while the round is pre-live
           (requested anor booting); the indeterminate CSS animation is SIMULATED — it resolves/fills
           when the SCP lands live (the round advances to focusing→done and the bar unmounts). -->
      <div v-if="spawnBarActiveFor(row.name)" class="scp-command-bootbar" aria-hidden="true">
        <div class="scp-command-bootbar-fill"></div>
      </div>
      <div class="scp-command-row-controls">
        <button
          v-if="!row.live"
          class="scp-command-btn scp-command-btn-spawn"
          type="button"
          :disabled="!!scpCommandRowBusy[row.name] || spawnBarActiveFor(row.name) || !scpCommandRoster.bridgeUp || row.installing"
          :title="row.installing ? 'installing dependencies…' : ''"
          @click="handleScpCommandAction(row.name, '/bridge-boot')"
        >{{ row.installing ? 'Installing…' : (scpCommandRowBusy[row.name] || spawnBarActiveFor(row.name) ? 'Spawning…' : 'Spawn') }}</button>
        <button
          v-if="row.live"
          class="scp-command-btn scp-command-btn-focus"
          type="button"
          :disabled="!!scpCommandRowBusy[row.name]"
          @click="handleScpCommandAction(row.name, '/bridge-focus')"
        >{{ scpCommandRowBusy[row.name] ? 'Focusing…' : 'Focus' }}</button>
        <!-- W3 · MULTIPLY — a base SCP row spawns a worktree INSTANCE (gitm_worktree_add). Degrades
             HONESTLY when the gitm rail is unreachable (disabled + a title naming the missing rail).
             C632 · restyled HiFi YELLOW + the copy-and-paste glyph (fa-copy · the duplicate icon) — the
             honest "make another of this" mark, freeing × for the new EXIT ability. -->
        <button
          v-if="!row.isInstance"
          class="scp-command-btn scp-command-btn-multiply"
          type="button"
          :disabled="!worktreeRailReachable"
          :title="worktreeRailReachable ? 'Multiply — spawn a worktree instance of this SCP' : 'Worktree rail unavailable (gitm controller not injected)'"
          @click="multiplyOpenFor === row.name ? cancelMultiply() : openMultiply(row.name)"
        ><i class="fa-solid fa-copy" aria-hidden="true"></i></button>
        <!-- SES · THE STOP RAIL (C632 · the EXIT ability) — a LIVE SCP row STOPS the running SCP.
             The × (fa-xmark) now HONESTLY means exit/close (was the misleading multiply mark). HiFi
             Base glass, transitioning to HiFi Red on hover. RECOVERABLE (Spawn re-boots) — no confirm
             modal; the typed-name round stays reserved for the destructive worktree DELETE. -->
        <button
          v-if="row.live"
          class="scp-command-btn scp-command-btn-exit"
          type="button"
          :disabled="!!scpCommandRowBusy[row.name] || !scpCommandRoster.bridgeUp"
          title="Exit — stop this running SCP (recoverable · Spawn re-boots)"
          @click="handleScpCommandExit(row.name)"
        ><i class="fa-solid fa-xmark" aria-hidden="true"></i></button>
        <!-- W4 · DELETE — a worktree instance row opens the typed-name confirm. -->
        <button
          v-if="row.isInstance"
          class="scp-command-btn scp-command-btn-delete"
          type="button"
          :disabled="!worktreeRailReachable"
          :title="worktreeRailReachable ? 'Delete this worktree instance (type the exact name to arm)' : 'Worktree rail unavailable (gitm controller not injected)'"
          @click="deleteOpenFor === row.name ? cancelDelete() : openDelete(row.name)"
        >Delete</button>
      </div>
      </div>

      <!-- W3 · MULTIPLY PROMPT — a compact inline branch entry (default = a fresh working slug).
           ScsInput sized by a wrapping div (the attrs-sizing law — never a class on ScsInput). -->
      <div v-if="multiplyOpenFor === row.name" class="scp-command-panel scp-command-panel-multiply">
        <span class="scp-command-panel-label">Worktree branch</span>
        <div class="scp-command-panel-input">
          <ScsInput v-model="multiplyBranch" type="text" placeholder="branch to check out" />
        </div>
        <div class="scp-command-panel-actions">
          <button class="scp-command-panel-cancel" type="button" @click="cancelMultiply">Cancel</button>
          <button
            class="scp-command-panel-fire scp-command-panel-fire-multiply"
            type="button"
            :disabled="multiplyBranch.trim().length === 0 || !worktreeRailReachable"
            @click="fireMultiply(row.name)"
          >Multiply</button>
        </div>
      </div>

      <!-- C652 · THE STAGED MULTIPLY BAR — the SCP's birth-from-the-worktree readout. Rides OBSERVABLE
           signals only (create → the ${base}--wt-* citizen surfacing → the row rendered). Three labeled
           ticks as a segmented mini-bar (Pewter · the .scp-command-bootbar family). A relayed errorCode
           resolves it to an honest inline failure line rather than a stuck bar. Local round state (the
           smaller honest shape · a multiply round resolves before the user Spawns). -->
      <div
        v-if="multiplyRoundFor(row.name)"
        class="scp-command-panel scp-command-panel-multiply-progress"
        :class="{ 'is-failed': multiplyRoundFor(row.name)?.stage === 'failed' }"
      >
        <span class="scp-command-panel-label">Creating instance</span>
        <div class="scp-command-mstages">
          <div
            v-for="tick in (['create', 'register', 'install', 'ready'] as const)"
            :key="tick"
            class="scp-command-mstage"
            :class="`is-${multiplyTickState(row.name, tick)}`"
          >
            <span class="scp-command-mstage-fill"></span>
            <span class="scp-command-mstage-label">{{
              tick === 'create' ? 'Create' : tick === 'register' ? 'Register' : tick === 'install' ? 'Install' : 'Ready'
            }}</span>
          </div>
        </div>
        <span
          v-if="multiplyRoundFor(row.name)?.stage === 'failed'"
          class="scp-command-mstage-failline"
        >{{ multiplyRoundFor(row.name)?.failure }}</span>
      </div>

      <!-- W4 · TYPED-NAME DELETE PANEL — the ARMED→FIRE red register. FIRE arms ONLY on an exact
           typed match of the instanceName (mismatch = disarmed · the Ghost Measurer caret serves it). -->
      <div v-if="deleteOpenFor === row.name" class="scp-command-panel scp-command-panel-delete">
        <span class="scp-command-panel-warn">
          Type <strong>{{ row.name }}</strong> to arm the delete
        </span>
        <div class="scp-command-panel-input">
          <ScsInput v-model="deleteTyped" type="text" placeholder="Delete" />
        </div>
        <div class="scp-command-panel-actions">
          <button class="scp-command-panel-cancel" type="button" @click="cancelDelete">Cancel</button>
          <button
            class="scp-command-panel-fire scp-command-panel-fire-delete"
            :class="{ 'is-armed': deleteArmed }"
            type="button"
            :disabled="!deleteArmed || deletePhase === 'awaiting-token'"
            @click="fireDelete"
          >{{ deletePhase === 'awaiting-token' ? 'Removing…' : 'Delete Instance' }}</button>
        </div>
      </div>
      </template>
    </section>

    <!-- ═══ THE COMPACT FOOTER · W1 · details collapse ═══
         LAW · the old three-card status-summary-bar (Last Update · Bridge · PPLD)
         collapses into ONE footer strip of small Pewter metric chips at the base of
         the menu column. EVERY datum stays alive — lastUpdate, bridge version, and
         the connection label are preserved as inline chips. Full mode only — hidden
         when compact (the Suite 8 mount provides no bridgeJson source). -->
    <footer v-if="!compact" class="scp-command-footer">
      <span class="scp-command-chip">
        <span class="scp-command-chip-label">Update</span>
        <span class="scp-command-chip-value">{{ lastUpdate }}</span>
      </span>
      <span class="scp-command-chip">
        <span class="scp-command-chip-label">Bridge</span>
        <span class="scp-command-chip-value">{{ bridgeStatusDisplay }}</span>
      </span>
      <span class="scp-command-chip">
        <span class="scp-command-chip-label">PPLD</span>
        <span
          class="scp-command-chip-value"
          :style="{
            color: (controller?.connectionEstablished.value ?? false)
              ? BRIDGE_STATUS_COLORS.connected
              : BRIDGE_STATUS_COLORS.error,
          }"
        >{{ bridgeActiveDisplay }}</span>
      </span>
    </footer>
  </div>
</template>

<style scoped>
/* C832 · SEAT 2 (Pewter) · the SCP Management button — its own row, the column order held. */
.smgmt-scpm-row {
  margin: 0.55rem 0 0.2rem;
  display: flex;
}
.smgmt-scpm-btn {
  font-size: 0.72rem;
  padding: 0.4rem 0.95rem;
}

/* ═══ SCP COMMAND · W2 · the helm management section ═══
   LAW · shares the menu column with the spawn controls; matches the Installation
   sub-page roster idioms (dir-keyed live badge · per-row Spawn/Focus) rendered in
   the SESSION MANAGEMENT Pewter idiom (dark glass · mono names · recede chrome). */
.scp-command-section {
  display: flex; flex-direction: column; gap: 0.5rem;
  padding: 0.75rem 0.9rem; border-radius: 6px;
}
.scp-command-head {
  display: flex; align-items: baseline; gap: 0.5rem;
}
.scp-command-title {
  font-family: var(--font-heading, 'Orbitron'); font-size: 0.72rem;
  text-transform: uppercase; letter-spacing: 0.08em;
  color: #ffffff; text-shadow: var(--pewter-text-glow);
}
.scp-command-count {
  font-family: var(--font-mono); font-size: 0.68rem;
  color: var(--pewter-text-recede);
}
.scp-command-empty {
  margin: 0; font-size: 0.7rem; color: var(--pewter-text-recede);
}
/* C621 · the two-row card — identity line (name + squared status chip) over a controls line.
   The 999px pill wrapped into a RING under the OSR (the offset the user flagged); the chip is
   SQUARED + nowrap so LIVE · :port holds one line beside the name. */
.scp-command-card {
  padding: 0.4rem 0.2rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}
.scp-command-row-id {
  display: flex; align-items: center; gap: 0.55rem;
}
.scp-command-row-controls {
  display: flex; align-items: center; gap: 0.45rem;
  padding-top: 0.35rem;
}
.scp-command-name {
  font-family: var(--font-mono); font-size: 0.76rem;
  color: #ffffff; text-shadow: var(--pewter-text-glow);
}
.scp-command-badge {
  border: 1px solid; border-radius: 0.25rem;
  font-family: var(--font-mono); font-size: 0.6rem;
  padding: 0.12rem 0.45rem;
  white-space: nowrap; line-height: 1.2;
}
.scp-command-spacer { flex: 1; }
.scp-command-btn {
  border: 1px solid; border-radius: 0.375rem;
  color: #ffffff; cursor: pointer;
  font-size: 0.68rem; padding: 0.28rem 0.8rem;
  transition: all 0.15s ease;
}
.scp-command-btn-spawn {
  background: rgba(59, 130, 246, 0.12);
  border-color: var(--color-cobalt, #3b82f6);
}
.scp-command-btn-focus {
  background: rgba(47, 158, 119, 0.12);
  border-color: var(--color-viridian, #2f9e77);
}
.scp-command-btn:hover:not(:disabled) {
  box-shadow: 0 0 8px rgba(255, 255, 255, 0.2);
}
.scp-command-btn:disabled {
  opacity: 0.45; cursor: not-allowed;
}

/* ═══ W6b · THE SIMULATED LOADING BAR (SCM W6 · Spawn Window Focus + Simulated Loading Bar) ═══
   A compact dark-glass Pewter track with an indeterminate cobalt sweep — SIMULATED (it animates
   through the booting phase and unmounts when the SCP lands live). Sits under the identity row,
   above the controls. Matches the .scp-command-* dark-glass idioms (thin recessed track · cobalt
   accent · low-contrast base). Reads ONLY the controller spawn-progress state (survives page nav). */
.scp-command-bootbar {
  position: relative;
  height: 3px;
  margin: 0.3rem 0 0.1rem;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.06);
  overflow: hidden;
}
.scp-command-bootbar-fill {
  position: absolute;
  top: 0; left: 0; height: 100%;
  width: 38%;
  border-radius: 999px;
  background: linear-gradient(
    90deg,
    rgba(59, 130, 246, 0) 0%,
    var(--color-cobalt, #3b82f6) 50%,
    rgba(59, 130, 246, 0) 100%
  );
  box-shadow: 0 0 6px rgba(59, 130, 246, 0.5);
  animation: scp-command-bootbar-sweep 1.15s ease-in-out infinite;
}
@keyframes scp-command-bootbar-sweep {
  0%   { left: -40%; }
  100% { left: 100%; }
}

/* ═══ C652 · THE STAGED MULTIPLY BAR (the SCP's birth-from-the-worktree readout) ═══
   A compact three-tick segmented mini-bar sharing the .scp-command-bootbar dark-glass idiom (thin
   recessed track · cobalt accent). Ticks: pending (dim) · active (cobalt sweep) · done (solid cobalt) ·
   failed (maroon). The panel carries the MULTIPLY amethyst edge; the failed variant reddens honestly. */
.scp-command-panel-multiply-progress {
  flex-direction: column; align-items: stretch; gap: 6px;
  border-color: color-mix(in srgb, var(--color-amethyst, #8b5cf6) 40%, var(--color-board-light));
}
.scp-command-panel-multiply-progress.is-failed {
  border-color: color-mix(in srgb, var(--color-maroon, #be3c46) 50%, var(--color-board-light));
}
.scp-command-mstages {
  display: flex; align-items: center; gap: 6px; width: 100%;
}
.scp-command-mstage {
  position: relative; flex: 1 1 0;
  display: flex; flex-direction: column; gap: 3px;
}
.scp-command-mstage-fill {
  position: relative; overflow: hidden;
  height: 3px; border-radius: 999px;
  background: rgba(255, 255, 255, 0.06);
}
/* DONE — solid cobalt track (the stage passed · the register/create beats confirmed observably). */
.scp-command-mstage.is-done .scp-command-mstage-fill {
  background: var(--color-cobalt, #3b82f6);
  box-shadow: 0 0 5px rgba(59, 130, 246, 0.45);
}
/* ACTIVE — the indeterminate cobalt sweep (this stage is in flight · the same bootbar sweep). */
.scp-command-mstage.is-active .scp-command-mstage-fill::after {
  content: ''; position: absolute; top: 0; left: -40%; height: 100%; width: 38%;
  border-radius: 999px;
  background: linear-gradient(
    90deg,
    rgba(59, 130, 246, 0) 0%,
    var(--color-cobalt, #3b82f6) 50%,
    rgba(59, 130, 246, 0) 100%
  );
  box-shadow: 0 0 6px rgba(59, 130, 246, 0.5);
  animation: scp-command-bootbar-sweep 1.15s ease-in-out infinite;
}
/* FAILED — maroon track (the honest inline stop · the failure line names the reason below). */
.scp-command-mstage.is-failed .scp-command-mstage-fill {
  background: var(--color-maroon, #be3c46);
  box-shadow: 0 0 5px rgba(190, 60, 70, 0.4);
}
.scp-command-mstage-label {
  font-family: var(--font-body); font-size: 9px;
  text-transform: uppercase; letter-spacing: 0.05em;
  color: var(--pewter-text-recede);
}
.scp-command-mstage.is-active .scp-command-mstage-label,
.scp-command-mstage.is-done .scp-command-mstage-label {
  color: var(--color-cobalt, #3b82f6);
}
.scp-command-mstage.is-failed .scp-command-mstage-label {
  color: var(--color-maroon, #be3c46);
}
.scp-command-mstage-failline {
  font-family: var(--font-mono, monospace); font-size: 10px;
  color: var(--color-maroon, #be3c46);
  word-break: break-word;
}

/* ═══ THE SCP COMMAND MENU (W3/W4 · THE WORKTREE RAIL · C632 restyle) ═══
   MULTIPLY = the additive HiFi YELLOW mark (the copy-and-paste glyph · "make another of this");
   EXIT = the HiFi BASE glass mark that transitions to HiFi RED on hover (the × now honestly means
   stop/close, not multiply); DELETE = the destructive maroon typed-name register. All ride the
   shared .scp-command-btn base. Spectrum tokens (var(--color-*)) per the Pewter idiom — no raw hex
   where a token exists (the rgba fills carry the token's rgb literal for the low-alpha glass). */
.scp-command-btn-multiply {
  background: rgba(234, 179, 8, 0.12);
  border-color: var(--color-yellow, #eab308);
  font-weight: 700; min-width: 1.9rem;
}
.scp-command-btn-multiply:hover:not(:disabled) {
  background: rgba(234, 179, 8, 0.22);
  box-shadow: 0 0 8px rgba(234, 179, 8, 0.35);
}
/* SES · THE STOP RAIL (C632 · the EXIT ability). HiFi Base glass at rest → HiFi Red on hover —
   the × reads as a live exit affordance that reddens as a stop signal on approach. */
.scp-command-btn-exit {
  background: rgba(26, 26, 26, 0.55);
  border-color: var(--color-base-light, #1e1e1e);
  color: rgba(255, 255, 255, 0.82);
  font-weight: 700; min-width: 1.9rem;
  transition: all 0.15s ease;
}
.scp-command-btn-exit:hover:not(:disabled) {
  background: rgba(239, 68, 68, 0.18);
  border-color: var(--color-red, #ef4444);
  color: var(--color-red-light, #ff4e4e);
  box-shadow: 0 0 8px rgba(239, 68, 68, 0.4);
}
.scp-command-btn-delete {
  background: rgba(190, 60, 70, 0.12);
  border-color: var(--color-maroon, #be3c46);
}

/* THE INLINE PANEL — a compact drop below the row (MULTIPLY prompt · DELETE typed-name confirm).
   Pewter recessed field; the DELETE variant carries the destructive maroon edge. */
.scp-command-panel {
  display: flex; align-items: center; gap: 8px; flex-wrap: wrap;
  margin: 2px 0 6px; padding: 8px 10px; border-radius: 6px;
  background: var(--color-board-elevated);
  border: 1px solid var(--color-board-light);
}
.scp-command-panel-delete {
  border-color: color-mix(in srgb, var(--color-maroon, #be3c46) 55%, var(--color-board-light));
  background: radial-gradient(ellipse at 20% 0%, rgba(190, 60, 70, 0.1) 0%, rgba(0, 0, 0, 0) 70%), var(--color-board-elevated);
}
.scp-command-panel-label,
.scp-command-panel-warn {
  font-family: var(--font-body); font-size: 10px;
  text-transform: uppercase; letter-spacing: 0.06em;
  color: var(--pewter-text-recede);
}
.scp-command-panel-warn strong {
  color: var(--color-maroon, #be3c46);
  font-family: var(--font-mono, monospace); text-transform: none; letter-spacing: 0;
}
/* THE ATTRS-SIZING LAW — the wrapping div sizes ScsInput; NEVER a class on the component. */
.scp-command-panel-input {
  flex: 1 1 160px; min-width: 140px;
}
.scp-command-panel-actions {
  display: flex; align-items: center; gap: 6px; margin-left: auto;
}
.scp-command-panel-cancel,
.scp-command-panel-fire {
  border: 1px solid; border-radius: 0.375rem;
  color: #ffffff; cursor: pointer;
  font-size: 0.68rem; padding: 0.28rem 0.8rem;
  transition: all 0.15s ease;
}
.scp-command-panel-cancel {
  background: rgba(255, 255, 255, 0.05);
  border-color: var(--color-board-light);
  color: var(--pewter-text-recede);
}
.scp-command-panel-fire-multiply {
  background: rgba(139, 92, 246, 0.16);
  border-color: var(--color-amethyst, #8b5cf6);
}
/* THE ARMED→FIRE RED REGISTER — dim/disarmed until the typed name matches, then the maroon lights. */
.scp-command-panel-fire-delete {
  background: rgba(190, 60, 70, 0.1);
  border-color: color-mix(in srgb, var(--color-maroon, #be3c46) 45%, transparent);
  opacity: 0.7;
}
.scp-command-panel-fire-delete.is-armed {
  background: rgba(190, 60, 70, 0.28);
  border-color: var(--color-maroon, #be3c46);
  box-shadow: 0 0 10px rgba(190, 60, 70, 0.45);
  opacity: 1;
}
.scp-command-panel-fire:disabled,
.scp-command-panel-cancel:disabled {
  opacity: 0.4; cursor: not-allowed;
}
.scp-command-panel-fire:hover:not(:disabled) {
  box-shadow: 0 0 8px rgba(255, 255, 255, 0.2);
}

/* ═══ THE COMPACT FOOTER · W1 · details collapse ═══
   LAW · the three status cards become one row of small Pewter chips; every datum
   (Update · Bridge version · PPLD) survives as an inline label→value chip. */
.scp-command-footer {
  display: flex; align-items: center; gap: 10px;
  padding: 8px 12px; border-radius: 6px; flex-wrap: wrap;
  background: var(--color-board-elevated);
  border: 1px solid var(--color-board-light);
}
.scp-command-chip {
  display: inline-flex; align-items: baseline; gap: 0.35rem;
}
/* THE PEWTER BRIGHTNESS PASS · footer chips → recede label, mono value. */
.scp-command-chip-label {
  font-family: var(--font-body); font-size: 10px;
  text-transform: uppercase; letter-spacing: 0.06em;
  /* STRATIDIAN MUXONOMY · THE RECEDE — chrome yields; the rows carry the glance. */
  color: var(--pewter-text-recede);
}
.scp-command-chip-value {
  font-family: var(--font-mono); font-size: 12px; letter-spacing: 0.02em;
  color: var(--pewter-text-recede);
}

/* C655 · MEND B · THE HELM GROUPING — the SCP COMMAND section labels MIRROR the
   sessions .session-section-label family (small caps · Orbitron uppercase · the
   colored left tick · RECEDE-toned count). ONLINE = viridian · OFFLINE = maroon.
   Slimmer horizontal padding suits the narrower helm column. */
.scp-command-section-label {
  display: flex;
  align-items: baseline;
  gap: 0.4rem;
  padding: 0.35rem 0.5rem 0.25rem;
  margin-top: 0.25rem;
  border-left: 3px solid transparent;
  font-family: var(--font-heading, 'Orbitron');
  font-size: 0.66rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
}
.scp-command-section-label-text {
  color: #ffffff;
  text-shadow: var(--pewter-text-glow);
}
.scp-command-section-label-count {
  /* STRATIDIAN MUXONOMY · THE RECEDE — the count is wayfinding, not the glance. */
  color: var(--pewter-text-recede);
  font-family: var(--font-mono, monospace);
  font-size: 0.6rem;
}
.scp-command-section-label-online {
  border-left-color: var(--color-viridian);
}
.scp-command-section-label-online .scp-command-section-label-text {
  color: var(--color-viridian);
}
.scp-command-section-label-offline {
  border-left-color: var(--color-maroon);
  /* THE DIVIDER GAP · the offline label row separates OFFLINE from ONLINE above. */
  margin-top: 0.85rem;
  padding-top: 0.5rem;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}
.scp-command-section-label-offline .scp-command-section-label-text {
  color: var(--color-maroon);
}
</style>
