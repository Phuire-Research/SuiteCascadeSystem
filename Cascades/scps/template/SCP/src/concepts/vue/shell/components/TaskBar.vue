<script setup lang="ts">
/**
 * TaskBar — Fixed-Bottom Toolbar (FXAB + TBFL Patterns)
 *
 * Shell-concept primitive rendering registered toolbar buttons in a three-zone
 * flex layout (LEFT reserved · CENTER placeholder · RIGHT user-registered).
 * Buttons are resolved through `componentMap` by id (with `componentName` override).
 *
 * Pewter Tessera HiFi:
 *   D3 Pane Gradient + D8 Locked-Pane (hifi-pane-base + backdrop blur)
 *   D5 Embossed Border (top separator)
 *   D7 Button Variant (btn-base fallback)
 *
 * Layout: position: fixed; bottom: 0; left: 0; right: 0; z-index: 110
 * Option B per Ochre-Shell blueprint — full-width overlay spanning sidebar.
 *
 * Citation: TASKBAR-PEWTER-PASS-WAVE2-OCHRE-SHELL-BLUEPRINT.md §3
 * Citation: STRATIMUX-REFERENCE.md "Vue-Stratimux Integration Patterns"
 */
import { computed, onMounted, onUnmounted, ref } from 'vue';
import type { Component } from 'vue';
import type { ToolbarButtonRegistration } from '../../../scsBridge/scsBridge.type';
import { RESERVED_TOOLBAR_BUTTON_IDS } from '../../../../model/toolbarRegistration.model';
// THE STATUS PIP (C958) · the persistent health seat. The crash FACT has always been served
// (/scp-status/:scpName) but only ever RENDERED inside the standby overlay, which exists ONLY
// during a turn-over — a crashed SCP that was not mid-turn-over had nowhere to say so. The pip
// is that seat: every page, every session. All verdict logic is PURE and lives in the model;
// this file owns only the I/O (the poll, the overlay DOM probe, the interval + its cleanup).
import {
  classifyScpStatus,
  scpStatusPipReadout,
  SCP_STATUS_PIP_POLL_MS,
  SCP_STATUS_PIP_PRESENTATION,
} from '../scpStatusPip.model';
import type {
  ScpStatusFactShape,
  ScpStatusPipDeclineReason,
  ScpStatusPipState,
} from '../scpStatusPip.model';
import type { ScpConfig } from '../../../../model/scpConfig.model';
// SCP IDENTITY INDICATOR (C698) · the SCP's declarative identity (scp.config.json scpName ·
// the FKIS Per-SCP-Identity-Config) rendered at the FAR LEFT of the toolbar — the SCP tells
// the user WHO IT IS. loadScpConfig is the 3s-abort-bounded /scp-config fetch (null-tolerant:
// no name → no chip, never a placeholder).
import { loadScpConfig } from '../../../../model/scpConfig.model';
// MD-S8PM · PM-4 · THE RELAY FEED — TaskBar is the always-mounted toolbar that co-hosts the
// S8DrawerButton AND already polls /scs-bridge-version + parses the s8 leg (installedCounters).
// It hands the parsed INSTALLED s8 to the controller's token-free relayInstalledS8Counter (no new
// poll): the controller then answers s8PageBehind for the S8 toggle border + the panel version row.
// THE UPDATE-ORDER LAW: the installed bridge package.json IS the source of truth for the S8 system
// counter — the S8 page cannot update until the bridge update lands the new package.json, so the
// S8 lane reads installedMuxameter.s8 (served locally off disk), never npm directly.
// Token-free reach (the S8DrawerButton idiom) — a bare number in, no suite8-token coupling.
import { getGlobalScsBridgeController } from '../../../scsBridge/scsBridgeController';

interface Props {
  buttons: ToolbarButtonRegistration[];
  componentMap: Record<string, Component>;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: 'buttonClicked', id: string): void;
}>();

// Cycle 158 R6 · Zone distribution by `position` field (TBFL pattern · Ochre-Shell)
// Default to 'right' for buttons without explicit position (preserves backward-compat
// for any user-registered buttons missing the field · matches Pewter contextual-action
// convention where contextual actions live right of primary registry navigation).
const leftButtons = computed(() =>
  props.buttons.filter((btn) => (btn.position ?? 'right') === 'left'),
);

// SCP IDENTITY INDICATOR (C698) · resolved once at mount; empty until (and unless) the
// SCP's own server answers /scp-config — absence renders NOTHING (no placeholder flash).
const scpIdentityName = ref('');
onMounted(() => {
  void loadScpConfig().then((cfg) => {
    if (cfg?.scpName) scpIdentityName.value = cfg.scpName;
    // THE STATUS PIP rides the SAME resolved cfg — originEndpoint + scpName both arrive in this
    // one answer, so the pip issues NO second /scp-config fetch (the token-free-reach idiom:
    // hand forward data already in flight, never re-poll a value you are holding).
    startScpStatusPip(cfg);
  });
});

// ─────────────────────────────────────────────────────────────────────────────────────────────
// THE STATUS PIP (C958) — the always-present health chip.
//
// ABSENCE IS A STATE: `unknown` is the default, the failed-fetch state, AND the no-origin state.
// No path reaches `healthy`/`crashed` without a parsed fact from an res.ok answer — silence is
// NEVER a crash claim (the verbatim discipline of the standby overlay's own pollCrashFact).
const scpStatusPipState = ref<ScpStatusPipState>('unknown');
const scpStatusPipFact = ref<ScpStatusFactShape | null>(null);
const scpStatusPipReason = ref<ScpStatusPipDeclineReason>('not-yet-polled');
// Non-reactive I/O handles — the timer is the FIRST repeating timer TaskBar has ever owned.
let scpStatusPipTimer: ReturnType<typeof setInterval> | null = null;
let scpStatusPipEndpoint = '';
// C1046 · THE SECOND QUERY's RESULT — the PROJECT-SPECIFIC axis. Query 1 (/scs-bridge-version, the
// SCP's own server) answers what the ARTIFACT is; this answers what the BASE PROJECT carries.
// null = UNKNOWN (no stamp, or the CLI never answered) and unknown NEVER renders as behind.
const instructionSetInstalled = ref<number | null>(null);
const instructionSetUpdateAvailable = ref<boolean>(false);
// C1057 · the published half, which layer answered it, and whether the CLI ANSWERED AT ALL — a 404
// from an older CLI must never render as "unstamped": ignorance and absence are different states.
const instructionSetPublished = ref<number | null>(null);
const instructionSetPublishedSource = ref<'local' | 'npm' | null>(null);
const instructionSetRead = ref<boolean>(false);
// C1059 · THE INSTRUCTION-SET AXIS, DERIVED FROM THE TWO SERVED NUMBERS (Salvo B · D5). Direction
// matters: BEHIND (iv < pv) is the computer's constitution lagging what is published — actionable;
// AHEAD (iv > pv) is a dev machine past the publish — informational, never offered a downgrade;
// UNSTAMPED (no iv, pv known) has never been synced — actionable, but not BEHIND. Ignorance (pv unknown)
// renders honestly and reveals nothing. `instructionSetUpdateAvailable` (the endpoint's boolean) stays
// read for bridge.json parity; the badge composes from the numbers so it can tell the directions apart.
const instructionSetKnown = computed<boolean>(
  () => typeof instructionSetInstalled.value === 'number' && typeof instructionSetPublished.value === 'number',
);
const instructionSetBehind = computed<boolean>(
  () =>
    instructionSetKnown.value &&
    (instructionSetInstalled.value as number) < (instructionSetPublished.value as number),
);
const instructionSetAhead = computed<boolean>(
  () =>
    instructionSetKnown.value &&
    (instructionSetInstalled.value as number) > (instructionSetPublished.value as number),
);
const instructionSetUnstamped = computed<boolean>(
  () => instructionSetInstalled.value === null && instructionSetPublished.value !== null,
);
// THE STATE, in the counters' own `#N` grammar (`#` is the unit — never a naked number beside a system
// noun · Pewter). It renders in its OWN ROW beneath the counters (Salvo B · D2: 50 characters cannot
// fit a 218px line, and the instruction set is a different Demometer from the package counters).
const instructionSetState = computed<string>(() => {
  if (!instructionSetRead.value) return '';
  const iv = instructionSetInstalled.value;
  const pv = instructionSetPublished.value;
  if (iv === null && pv === null) return '—';
  if (iv === null) return `— → #${pv}`;
  if (pv === null || iv === pv) return `#${iv}`;
  return `#${iv} → #${pv}`;
});
// THE REGISTER (spectrum names · the house grammar Lane R4 mapped): red = behind · orange = out of
// sync / never stamped (the S8 out-of-sync precedent) · fuchsia = ahead (the version axis's own
// "ahead") · base = current anor unknown.
const instructionSetRegister = computed<'red' | 'orange' | 'fuchsia' | 'base'>(() => {
  if (instructionSetBehind.value) return 'red';
  if (instructionSetUnstamped.value) return 'orange';
  if (instructionSetAhead.value) return 'fuchsia';
  return 'base';
});
const instructionSetNote = computed<string>(() => {
  const src = instructionSetPublishedSource.value === 'local' ? ' · local repo' : '';
  if (instructionSetBehind.value) return `behind the published revision${src}`;
  if (instructionSetUnstamped.value) return `not yet stamped · published #${instructionSetPublished.value}${src}`;
  if (instructionSetAhead.value) return `ahead of the published revision${src}`;
  if (instructionSetKnown.value) return `current${src}`;
  return 'published revision not read';
});
// THE REVEAL PREDICATE — BEHIND anor UNSTAMPED. Never AHEAD: the Update Agent would overwrite a dev
// machine's newer constitution with the published one.
const instructionSetActionable = computed<boolean>(
  () => instructionSetBehind.value || instructionSetUnstamped.value,
);
let scpStatusPipScpName = '';
// The unmount latch: an in-flight fetch must not land its verdict into a disposed component.
let scpStatusPipDisposed = false;

// THE OVERLAY PROBE — the standby overlay's own presence test, verbatim (it mounts this exact id
// for ALL THREE restart triggers: hard turn-over, Shield A, Sword B).
function standbyOverlayPresent(): boolean {
  return typeof document !== 'undefined'
    && document.getElementById('bridge-turn-over-standby') !== null;
}

function applyScpStatusPip(
  state: ScpStatusPipState,
  fact: ScpStatusFactShape | null,
  reason: ScpStatusPipDeclineReason,
): void {
  if (scpStatusPipDisposed) return;
  scpStatusPipState.value = state;
  scpStatusPipFact.value = fact;
  scpStatusPipReason.value = reason;
}

async function readScpStatusOnce(): Promise<void> {
  // (a) THE OVERLAY CHECK FIRST — and it suppresses the FETCH, not merely the render. While the
  // standby overlay is mounted it owns the crash verdict (its own 1s poll renders the signature
  // and the boot tail); the pip must never race it and show the user two disagreeing answers on
  // one screen. Render-authority deduplication.
  if (standbyOverlayPresent()) {
    applyScpStatusPip(classifyScpStatus(null, true), null, null);
    return;
  }
  // (b) THE FACT READ — a failed read is a DECLINE, never a crash claim.
  try {
    const res = await fetch(
      `${scpStatusPipEndpoint}/scp-status/${encodeURIComponent(scpStatusPipScpName)}`,
      { cache: 'no-store' },
    );
    if (!res.ok) {
      applyScpStatusPip('unknown', null, 'fetch-failed');
      return;
    }
    const fact = (await res.json()) as ScpStatusFactShape;
    // (c) THE CLASSIFY — pure, in the model. An unrecognized state declines with its own reason
    // rather than collapsing silently into the same mute as a network failure.
    const next = classifyScpStatus(fact, false);
    if (next === 'unknown') {
      applyScpStatusPip('unknown', null, 'unrecognized');
      return;
    }
    applyScpStatusPip(next, fact, null);
  } catch {
    // the origin CLI may be down or mid-write — the next tick reads it; never a crash claim
    applyScpStatusPip('unknown', null, 'fetch-failed');
  }
}

// C1046 · THE SECOND QUERY · the project-specific aspect of the Muxameter.
// Served by the CLI (`/instruction-set`) because THE CLI IS THE BASE and the SCPs are Informatives —
// the base project's Cascade.json is the ground, and only the process rooted in it should read it.
async function readInstructionSetOnce(): Promise<void> {
  if (scpStatusPipEndpoint.length === 0) return;
  try {
    const res = await fetch(`${scpStatusPipEndpoint}/instruction-set`, { cache: 'no-store' });
    if (!res.ok) return; // a decline leaves the UNKNOWN defaults standing
    const body = (await res.json()) as {
      installed?: unknown;
      published?: unknown;
      publishedSource?: unknown;
      updateAvailable?: unknown;
    };
    instructionSetInstalled.value = typeof body.installed === 'number' ? body.installed : null;
    instructionSetPublished.value = typeof body.published === 'number' ? body.published : null;
    instructionSetPublishedSource.value =
      body.publishedSource === 'local' || body.publishedSource === 'npm' ? body.publishedSource : null;
    instructionSetUpdateAvailable.value = body.updateAvailable === true;
    instructionSetRead.value = true;
  } catch {
    // the origin CLI may be down or mid-write — never a drift claim from an error path
  }
}

// THE ABSENT-ORIGIN GUARD — an older citizen publishes no `originEndpoint`. There is no endpoint
// to dial, so the pip renders `unknown` and NEVER STARTS THE INTERVAL (no poll, not merely a
// suppressed render). The guard says WHY through the readout — a declining guard is never a
// silent dim dot.
function startScpStatusPip(cfg: ScpConfig | null): void {
  if (!cfg) {
    // /scp-config itself did not answer — distinct from a config that answered without an origin.
    applyScpStatusPip('unknown', null, 'fetch-failed');
    return;
  }
  const origin = typeof cfg.originEndpoint === 'string' ? cfg.originEndpoint.trim() : '';
  if (origin.length === 0 || cfg.scpName.length === 0) {
    applyScpStatusPip('unknown', null, 'no-origin');
    return;
  }
  scpStatusPipEndpoint = origin.replace(/\/+$/, '');
  scpStatusPipScpName = cfg.scpName;
  void readScpStatusOnce();
  // C1046 · THE SECOND QUERY fires on the SAME resolved origin the pip already dials — the CLI
  // address is resolved ONCE (/scp-config → originEndpoint) and reused. A decline is silent-but-
  // honest: the refs stay at their UNKNOWN defaults, so the badge never claims drift it cannot see.
  void readInstructionSetOnce();
  // C1062 · THE PULL PARTNER. The stamp moves when the Update Agent writes Cascade.json — a process this
  // page cannot see. The CLI re-reads the stamp on every request; the page must ASK again. The instruction
  // set rides the status pip's own tick (no second timer) and re-reads on every chip hover (the moment the
  // user looks). A push (the CLI watching Cascade.json → bridge.json → the relay) is carded for Release.
  scpStatusPipTimer = setInterval(() => {
    void readScpStatusOnce();
    void readInstructionSetOnce();
  }, SCP_STATUS_PIP_POLL_MS);
}

// THE CLEANUP — TaskBar has never owned a repeating timer, so it has never carried an unmount
// lifecycle. IslandWrapper unmounting is a REAL condition in this codebase (six sibling dock
// components document controller globals going null/stale on exactly that event); without this
// the interval would leak and keep firing into a detached context. The idiom is the one already
// shipped at GitmStableAButton.vue:200-202.
onUnmounted(() => {
  scpStatusPipDisposed = true;
  if (scpStatusPipTimer !== null) {
    clearInterval(scpStatusPipTimer);
    scpStatusPipTimer = null;
  }
});

// The hover readout — ACTIONABLE when crashed (it names the signature AND the Hard Turn Over,
// the recovery lever that stays available even when Turn Over A is disabled for want of a
// registered stable A) and self-explaining when it declines.
const scpStatusPipTitle = computed(() => scpStatusPipReadout(
  scpIdentityName.value,
  scpStatusPipState.value,
  scpStatusPipFact.value,
  scpStatusPipReason.value,
));
const scpStatusPipGlyph = computed(
  () => SCP_STATUS_PIP_PRESENTATION[scpStatusPipState.value].glyph,
);
// ─────────────────────────────────────────────────────────────────────────────────────────────

// D-UP8 · THE VERSION LABEL — the installed SCS-Bridge version beside the SCP name,
// populated by THIS SCP's own server (/scs-bridge-version · checked at server boot via
// `npm view scs-bridge version` with a registry fallback — independent of the bridge
// vintage, visible even when nothing else changed). The btn-tip hover pane (the
// SCS-Bridge inspiration) reveals the npm side and whether they differ. Color law:
// purple = current anor unknown · RED = the npm publish is GREATER than the installed
// bridge (update it) · FUCHSIA = the npm publish is LESSER (this install is ahead).
const bridgeInstalledVersion = ref<string | null>(null);
const bridgeNpmVersion = ref<string | null>(null);
// THE VERSIONING MUXAMETER · the classed verdict from the SCP server's counter comparison
// ('cli' → the CLI update · 'scp' → the Update circuit · 'both' · 'unknown' = a pre-counter
// publish, both paths). Drives the tip's routing lines; the click lands the Update page.
const bridgeUpdateClass = ref<'none' | 'cli' | 'scp' | 'both' | 'unknown'>('none');
// THE FULL MUXAMETER LINE — the two Demometers' counters, installed → remote, rendered in
// the pop over once available (installed rides bridge.json; remote rides the npm /latest
// custom field — absent until a counter-carrying publish).
// MD-S8PM · PM-1 · TQNI: `s8` joins the schema (OPTIONAL-TOLERANT — old bridge data omits it;
// nothing here consumes it yet · THE NO-RED LAW leaves the badge verdict untouched — PM-2/PM-4).
type CounterPair = { cli: number; scp: number; s8?: number };
const installedCounters = ref<CounterPair | null>(null);
const remoteCounters = ref<CounterPair | null>(null);
const muxameterLine = computed<string | null>(() => {
  const i = installedCounters.value;
  const r = remoteCounters.value;
  if (!i && !r) return null;
  const side = (label: string, iv: number | undefined, rv: number | undefined): string => {
    if (iv === undefined && rv === undefined) return `${label} —`;
    if (rv === undefined || iv === rv) return `${label} #${iv ?? rv}`;
    return `${label} #${iv ?? '—'} → #${rv}`;
  };
  // MD-S8PM · PM-2 · THE s8 INFORMATION LEG — the INSTALLED S8 Page System counter appended to
  // the muxameter hover line as pure INFORMATION (THE NO-RED LAW: this never enters the badge
  // verdict — versionState/bridgeUpdateClass read only cli/scp). THE UPDATE-ORDER LAW: the tip
  // informs the system's LOCAL truth — the installed bridge package.json's s8 (installedMuxameter.s8,
  // read from disk by the SCP's own answer); it rides no extra fetch and never reads npm directly.
  const s8Leg = typeof i?.s8 === 'number' ? ` · S8 #${i.s8}` : '';
  return `${side('CLI', i?.cli, r?.cli)} · ${side('App', i?.scp, r?.scp)}${s8Leg}`;
});
// D-UP8c · the hover state crosses the body Teleport (CSS :hover cannot).
const versionTipVisible = ref(false);
// C1060 · THE GAP (the classic hover-intent wound, met on the body-Teleported tip). The tip is NOT a DOM
// descendant of the chip — D-UP8c put it on document.body, fixed 79px above the viewport floor, so the
// bar's clipping cannot eat it. The price: the chip's `mouseleave` fires the instant the pointer enters
// the ~40px of dead space between the chip and the tip, and `--visible` drops `pointer-events` with it —
// the button rendered perfectly and could not be reached. TWO CURES, COMPOSED (the user's: "spacing and
// duration"): (1) DURATION — a grace timer holds the tip open long enough to cross the gap; any re-entry
// (chip or tip) cancels it; (2) SPACING — `.taskbar-version-tip::after` (CSS) extends the tip's hit area
// down across the gap while visible, so the pointer never actually leaves. Either alone has a miss (a
// long SCP name pushes the chip past the bridge's width; a slow hand outlasts a timer); together, none.
// Keyboard focus rides the same machine (the chip is tabindex=0).
const VERSION_TIP_GRACE_MS = 360;
let versionTipHideTimer: ReturnType<typeof setTimeout> | null = null;
function clearVersionTipTimer(): void {
  if (versionTipHideTimer !== null) {
    clearTimeout(versionTipHideTimer);
    versionTipHideTimer = null;
  }
}
function showVersionTip(): void {
  clearVersionTipTimer();
  versionTipVisible.value = true;
}
// The chip's own enter also re-asks the CLI — the tip the user is about to read must be current.
function showVersionTipFromChip(): void {
  showVersionTip();
  void readInstructionSetOnce();
}
function scheduleVersionTipHide(): void {
  clearVersionTipTimer();
  versionTipHideTimer = setTimeout(() => {
    versionTipHideTimer = null;
    versionTipVisible.value = false;
  }, VERSION_TIP_GRACE_MS);
}
onUnmounted(clearVersionTipTimer);


// THE MUXAMETER CLICK — the DUAL-RAIL deep link (the goScpManagement exemplar): the GitM
// island's Update tab is the one destination for every update class.
function goUpdatePage(): void {
  // C1047 · THE ONE-DESTINATION LAW STANDS — the C1046 branch is RETIRED.
  //
  // THE COMPUTER/PROGRAM MODEL (the user's): **the SCS is the COMPUTER that loads an SCP.** A
  // program can be updated and loaded on a computer; a computer can be updated separately from a
  // program. GitM updates the PROGRAM (the SCP); the Update Agent updates the COMPUTER (the SCS and
  // its instruction set). Two circuits, because the SCS ENCLOSES the SCP.
  //
  // I briefly made this click conditional on which axis had moved. That was wrong: it gave ONE
  // CONTROL TWO MEANINGS, and it retired a stated law that never needed retiring. **A second need
  // earns a SECOND CONTROL** — the pop-over's button below — never a conditional on the first.
  const params = new URLSearchParams(window.location.search);
  params.set('island', 'gitm');
  params.set('sub', 'update');
  window.location.search = params.toString();
}

// C1046 · THE FIRE · Rail A, the spawn-with-anchor path.
//
// `onboard: false` IS THE DECIDING FLAG and is not optional: it suppresses the Onboard seed so the
// directive rides ALONE as the initial positional prompt — column 1 — which is the only position at
// which a slash command executes. With the seed present the directive is appended after a separator
// and arrives as inert body text (cli-handler.ts:1259,1370-1376).
//
// `manualMode: true` is ENFORCED, never a caller's choice: this session can rewrite the user's own
// governing document, and it must never run unattended for a developer's convenience.
//
// `asWorker: true` mirrors the Gitm Resolver — a fresh worker, anti-flood skipped, so repeat updates
// always spawn rather than silently reusing a stale session.
function fireInstructionSetUpdate(): void {
  try {
    const ctrl = getGlobalScsBridgeController();
    ctrl?.triggerSpawnSuite8Session(
      'Cascade Update',
      null, // workspace-level — the instruction set is the BASE PROJECT's, not any one SCP's
      true, // asWorker
      false, // fresh
      true, // manualMode — the approval gate stays intact
      '/cascade:update',
      false, // onboard:false — the directive rides ALONE at column 1
    );
  } catch {
    // a spawn failure must never break the toolbar; the badge stays lit and the user can retry
  }
}
function versionNewer(a: string, b: string): boolean {
  const av = a.split('.').map((s) => parseInt(s, 10) || 0);
  const bv = b.split('.').map((s) => parseInt(s, 10) || 0);
  for (let i = 0; i < Math.max(av.length, bv.length); i += 1) {
    if ((av[i] ?? 0) > (bv[i] ?? 0)) return true;
    if ((av[i] ?? 0) < (bv[i] ?? 0)) return false;
  }
  return false;
}
// D-RD1 · THE APPLIED-COUNTER RED DISCIPLINE: RED keys on the CLASSED verdict (the server
// compares the cli counter against the global install AND the scp counter against what THIS
// app has LANDED) — red persists after a global sync until Run Update lands the payload, and
// purple stands even when the npm VERSION is newer but the counters say nothing of value
// changed. Fuchsia (install ahead) is version-keyed as before.
const versionState = computed<'unknown' | 'current' | 'remote-greater' | 'remote-lesser'>(() => {
  const i = bridgeInstalledVersion.value;
  const n = bridgeNpmVersion.value;
  if (!i || !n) return 'unknown';
  if (versionNewer(i, n)) return 'remote-lesser';
  if (bridgeUpdateClass.value !== 'none') return 'remote-greater';
  // C1046 widened this verdict over the instruction set; C1059 (Salvo B · D4/D5) moves that composition
  // into `chipRegister` below, so this state speaks for the VERSION axis (cli/scp) alone again and the
  // tooltip body it drives never asserts anything about the instruction set — the row beneath does.
  return 'current';
});
// C1059 · THE CHIP REGISTER — the ONE verdict the chip paints, composed over BOTH axes (the C1046 law:
// measure over the axis-set the surface represents). Priority: red (cli/scp behind ∨ instruction set
// behind) › orange (unstamped) › fuchsia (install ahead ∨ instruction set ahead) › purple. Actionable
// outranks informational, so fuchsia can never swallow a red (R6 · I-VERDICT-SWALLOWED); ahead is
// never red (R6 · I-RED-FOR-AHEAD). Spectrum names only.
const chipRegister = computed<'red' | 'orange' | 'fuchsia' | 'purple'>(() => {
  if (versionState.value === 'remote-greater' || instructionSetBehind.value) return 'red';
  if (instructionSetUnstamped.value) return 'orange';
  if (versionState.value === 'remote-lesser' || instructionSetAhead.value) return 'fuchsia';
  return 'purple';
});
const versionTipBody = computed<string>(() => {
  const i = bridgeInstalledVersion.value ?? '—';
  const n = bridgeNpmVersion.value;
  if (!n) return `Installed v${i} · npm not yet checked`;
  switch (versionState.value) {
    case 'remote-greater': {
      // THE MUXAMETER ROUTING LINES — the classed verdict names the honest path(s).
      const routes: Record<string, string> = {
        cli: 'A CLI update only — one install + restart from the Update page; your app needs no changes.',
        scp: 'A template update awaits this app — run it through the GitM Update page.',
        both: 'Both aspects updated — the CLI install + restart, then this app updates through its GitM page.',
        unknown: 'A newer SCS-Bridge is published — open the Update page for both paths.',
        none: 'A newer SCS-Bridge is published — open the Update page.',
      };
      // C1046 asked the copy to name which axis moved; C1059 gives the instruction set its own row
      // beneath, so this body speaks for the version axis alone (Salvo B · D4 · I-BODY-MISMATCH).
      return `Installed v${i} · npm v${n} — ${routes[bridgeUpdateClass.value] ?? routes.unknown} Click to open.`;
    }
    case 'remote-lesser':
      return `Installed v${i} · npm v${n} — this install is ahead of the npm publish.`;
    default:
      return i !== n
        ? `Installed v${i} · npm v${n} — current: nothing of value changed for this app anor the CLI.`
        : `Installed v${i} · npm v${n} — current.`;
  }
});
onMounted(() => {
  const abort = new AbortController();
  const timer = setTimeout(() => abort.abort(), 5000);
  fetch('/scs-bridge-version', { signal: abort.signal })
    .then((r) => (r.ok ? r.json() : null))
    .then((body: {
      installedVersion?: unknown;
      npmLatestVersion?: unknown;
      updateClass?: unknown;
      installedMuxameter?: unknown;
      remoteMuxameter?: unknown;
    } | null) => {
      if (body && typeof body.installedVersion === 'string') bridgeInstalledVersion.value = body.installedVersion;
      if (body && typeof body.npmLatestVersion === 'string') bridgeNpmVersion.value = body.npmLatestVersion;
      if (
        body &&
        typeof body.updateClass === 'string' &&
        ['none', 'cli', 'scp', 'both', 'unknown'].includes(body.updateClass)
      ) {
        bridgeUpdateClass.value = body.updateClass as 'none' | 'cli' | 'scp' | 'both' | 'unknown';
      }
      const pair = (m: unknown): CounterPair | null => {
        const o = m as { cli?: unknown; scp?: unknown; s8?: unknown } | null | undefined;
        return o && typeof o.cli === 'number' && typeof o.scp === 'number'
          ? typeof o.s8 === 'number'
            ? { cli: o.cli, scp: o.scp, s8: o.s8 }
            : { cli: o.cli, scp: o.scp }
          : null;
      };
      if (body) {
        installedCounters.value = pair(body.installedMuxameter);
        remoteCounters.value = pair(body.remoteMuxameter);
        // MD-S8PM · PM-4 · relay the INSTALLED s8 to the controller (null when absent — never
        // signals on unknown). THE UPDATE-ORDER LAW: the installed bridge's package.json IS the
        // source of truth for the S8 system counter (installedMuxameter.s8 · read from disk by the
        // SCP's own /scs-bridge-version answer). The S8 page cannot update until the bridge update
        // lands the new package.json — so the S8 lane reads the INSTALLED side, never npm directly.
        // THE NO-RED LAW: this feeds only the s8 toggle border / panel row, never the badge verdict
        // (bridgeUpdateClass is set above from body.updateClass alone).
        getGlobalScsBridgeController()?.relayInstalledS8Counter(
          typeof installedCounters.value?.s8 === 'number' ? installedCounters.value.s8 : null,
        );
      }
    })
    .catch(() => { /* absent server route (an older SCP) — no label, never a placeholder */ })
    .finally(() => clearTimeout(timer));
});
const centerButtons = computed(() =>
  props.buttons.filter((btn) => btn.position === 'center'),
);
const rightButtons = computed(() =>
  props.buttons.filter((btn) => (btn.position ?? 'right') === 'right'),
);

// Component resolution: componentName override OR by-id lookup
function resolveComponent(btn: ToolbarButtonRegistration): Component | undefined {
  if (btn.componentName && props.componentMap[btn.componentName]) {
    return props.componentMap[btn.componentName];
  }
  return props.componentMap[btn.id];
}

// Per-button props resolver — UI PREP stub; WAVE 4 expands per-id mapping
function componentPropsFor(btn: ToolbarButtonRegistration): Record<string, unknown> {
  if (btn.id === 'turn-over') {
    return { pendingCount: btn.badgeCount ?? 0 };
  }
  return { enabled: btn.enabled };
}

function handleFallbackClick(btn: ToolbarButtonRegistration): void {
  if (!btn.enabled) return;
  emit('buttonClicked', btn.id);
}

// The hover-panel content: a TITLE + a one-sentence role explanation, keyed by button id.
// Falls back to the registration label when a button has no bespoke explanation.
const FALLBACK_TIP_CONTENT: Record<string, { title: string; body: string }> = {
  'create-b': {
    title: 'Working Branch (B)',
    body: 'Branches a new working version from A and checks it out — develop on B while A stays safe.',
  },
  // V-3 · THE TOOLBAR BREAKOUT — the two new drawer buttons' hover tips (the S8 face carries its
  // own tip inside S8DrawerButton.vue; this covers the plain 'scp-drawer' fallback + a safety tip
  // for 's8-drawer' should it ever render as a fallback).
  's8-drawer': {
    title: 'Suite 8 Control',
    body: "This page's locality + the Suite 8 helm. Opens the Suite 8 Control drawer.",
  },
  'scp-drawer': {
    title: 'SCP Management',
    body: 'The full SCP helm — Spawn, Focus, Multiply, and manage every installed SCP. Opens the SCP Management drawer.',
  },
  'merge-b-a': {
    title: 'Merge B → A · Land the Proven Work',
    body: 'Merges proven working Branch B into the guarded stable A. Available after you confirm B successful. A fresh B is auto-forked on the next bind — you stay on B, always working ahead of stable.',
  },
};

function fallbackTipTitle(btn: ToolbarButtonRegistration): string {
  return FALLBACK_TIP_CONTENT[btn.id]?.title ?? btn.label;
}

function fallbackTipBody(btn: ToolbarButtonRegistration): string {
  return FALLBACK_TIP_CONTENT[btn.id]?.body ?? '';
}

// C813 · the one-line readout the body-level portal renders (title · body).
function fallbackReadout(btn: ToolbarButtonRegistration): string {
  const tip = FALLBACK_TIP_CONTENT[btn.id];
  return tip ? `${tip.title} · ${tip.body}` : btn.label;
}

function handleTurnOverTriggered(): void {
  console.log('[TaskBar] handleTurnOverTriggered FIRED · emitting buttonClicked turn-over');
  emit('buttonClicked', 'turn-over');
}
</script>

<template>
  <div class="scs-taskbar">
    <div class="taskbar-inner">

      <div class="taskbar-zone taskbar-zone--left">
        <!-- SCP IDENTITY INDICATOR (C698) · the far-left name chip — WHO this SCP is,
             dynamically provided (scp.config.json scpName via /scp-config). -->
        <span v-if="scpIdentityName" class="taskbar-scp-identity" :title="'SCP · ' + scpIdentityName">
          {{ scpIdentityName }}
        </span>
        <!-- D-UP8 · THE VERSION LABEL — beside the SCP name · HiFi purple base; RED when the
             npm publish is greater (update) · FUCHSIA when lesser (ahead). The hover pane
             (the btn-tip idiom) carries installed-vs-npm and the difference verdict. -->
        <span v-if="bridgeInstalledVersion" class="taskbar-version-wrap">
          <!-- THE MUXAMETER CLICK — the label navigates to the GitM island's Update tab
               (the one destination for every update class · the DUAL-RAIL deep link). -->
          <span
            class="taskbar-bridge-version"
            :class="{
              'taskbar-bridge-version--red': chipRegister === 'red',
              'taskbar-bridge-version--orange': chipRegister === 'orange',
              'taskbar-bridge-version--fuchsia': chipRegister === 'fuchsia',
            }"
            role="button"
            tabindex="0"
            @mouseenter="showVersionTipFromChip"
            @mouseleave="scheduleVersionTipHide"
            @focus="showVersionTipFromChip"
            @blur="scheduleVersionTipHide"
            @click="goUpdatePage"
            @keydown.enter="goUpdatePage"
          >
            v{{ bridgeInstalledVersion }}
          </span>
          <!-- D-UP8c · BODY-MOUNTED (the bridgeStandbyOverlay law): the taskbar's inner row
               clips vertically (the BO-5 overflow cure) — no in-bar tip can rise above it.
               The Tactical Bridge's own strip escapes by living on document.body with fixed
               positioning; the Teleport is the same means. -->
          <Teleport to="body">
            <span
              class="taskbar-version-tip"
              :class="{ 'taskbar-version-tip--visible': versionTipVisible }"
              :role="instructionSetActionable ? 'dialog' : 'tooltip'"
              @mouseenter="showVersionTip"
              @mouseleave="scheduleVersionTipHide"
            >
              <span class="taskbar-version-tip-title">SCS-Bridge</span>
              <span class="taskbar-version-tip-body">{{ versionTipBody }}</span>
              <!-- THE FULL MUXAMETER LINE — the two counters, installed → remote, once
                   the data serves (installed via bridge.json · remote via the npm publish). -->
              <span v-if="muxameterLine" class="taskbar-version-tip-counters">{{ muxameterLine }}</span>
              <!-- C1059 · THE INSTRUCTION-SET ROW (Salvo B · D2) — its own row, present whenever the CLI answered,
                   so no body branch can leave the button below without its subject (R6 · I-BODY-MISMATCH).
                   Label · state (`#N` grammar, weighted in the register color) · one note. -->
              <span
                v-if="instructionSetRead"
                class="taskbar-version-tip-isrow"
                :class="'taskbar-version-tip-isrow--' + instructionSetRegister"
              >
                <span class="taskbar-version-tip-isrow-label">Instruction Set</span>
                <span class="taskbar-version-tip-isrow-state">{{ instructionSetState }}</span>
                <span class="taskbar-version-tip-isrow-note">{{ instructionSetNote }}</span>
              </span>
              <!-- C1047 · THE SECOND CONTROL · update the COMPUTER, not the program.
                   The badge CLICK remains the shortcut to GitM's Update page (the PROGRAM · the
                   SCP). This button updates the SCS ITSELF (the COMPUTER that loads it) by
                   dispatching the Update Agent with the Cascade Command. Two circuits, two
                   controls — never one control with two meanings.
                   Revealed when the instruction set is BEHIND anor UNSTAMPED (C1059) — never when AHEAD: the
                   agent would overwrite a newer constitution. Ignorance still reveals nothing. -->
              <button
                v-if="instructionSetActionable"
                type="button"
                class="taskbar-version-tip-action hifi-btn hifi-btn-blue"
                @click.stop="fireInstructionSetUpdate"
              >
                Update the SCS
              </button>
            </span>
          </Teleport>
        </span>
        <!-- THE STATUS PIP (C958) · the third local-ref chip — the SCP's own server health,
             persistent on every page (the standby overlay only ever showed this DURING a
             turn-over). Read-only: no click, no dispatch, no toolbar registration — the same
             class as the identity + version chips beside it. It renders ALWAYS, dim `unknown`
             included: a missing reading is a STATE the user gets to see, never a false green. -->
        <span
          class="taskbar-status-pip"
          :class="'taskbar-status-pip--' + scpStatusPipState"
          :title="scpStatusPipTitle"
          :data-readout="scpStatusPipTitle"
          :aria-label="scpStatusPipTitle"
          role="status"
        >
          <i :class="['taskbar-status-pip-glyph', scpStatusPipGlyph]" aria-hidden="true"></i>
        </span>
        <template v-for="btn in leftButtons" :key="btn.id">
          <component
            :is="resolveComponent(btn)"
            v-if="resolveComponent(btn)"
            v-bind="componentPropsFor(btn)"
            :disabled="!btn.enabled"
            @turn-over-triggered="handleTurnOverTriggered"
            @click="$emit('buttonClicked', btn.id)"
          />
          <span
            v-else
            class="taskbar-btn-wrap"
            :style="{ '--btn-neon': `var(--color-${btn.suiteColor})` }"
          >
            <!-- C813 · the readout portal (the pair-arm sweep — the left lane's twin). -->
            <button
              :class="['taskbar-btn', 'btn-base', { 'taskbar-btn--disabled': !btn.enabled }]"
              :disabled="!btn.enabled"
              :aria-label="btn.label"
              :data-readout="fallbackReadout(btn)"
              @click="handleFallbackClick(btn)"
            >
              <i :class="['taskbar-btn-icon', btn.icon]"></i>
              <span v-if="btn.badgeCount && btn.badgeCount > 0" class="taskbar-btn-badge">
                {{ btn.badgeCount }}
              </span>
            </button>
          </span>
        </template>
      </div>

      <div class="taskbar-zone taskbar-zone--center">
        <!-- WAVE 4: future expansion (Sessions button center-mount) -->
      </div>

      <!-- V-3 · THE TOOLBAR BREAKOUT · R2 THE PREEMPTIVE X-SCROLL — ONLY the right BUTTON ROW
           scrolls (the inner row no longer owns overflow, so the SCP identity label in the LEFT
           zone stays fixed / never clips). The scroll region carries overflow-x:auto preemptively
           with a thin/hidden scrollbar so an overflow never clips a button; its flex children
           (taskbar-btn-wrap) carry flex-shrink:0 so the scroll ENGAGES instead of squashing. -->
      <div class="taskbar-zone taskbar-zone--right">
        <div class="taskbar-right-scroll">
          <template v-for="btn in rightButtons" :key="btn.id">
            <component
              :is="resolveComponent(btn)"
              v-if="resolveComponent(btn)"
              v-bind="componentPropsFor(btn)"
              :disabled="!btn.enabled"
              @turn-over-triggered="handleTurnOverTriggered"
              @click="$emit('buttonClicked', btn.id)"
            />
            <span
              v-else
              class="taskbar-btn-wrap"
              :style="{ '--btn-neon': `var(--color-${btn.suiteColor})` }"
            >
              <!-- C813 · THE ON-HOVER READOUT (the Reference Design · the Tactical Bridge
                   pattern): data-readout → the ONE body-level portal (fixed · measured ·
                   viewport-clamped · NEVER clipped) — the per-element tip retired. -->
              <button
                :class="['taskbar-btn', 'btn-base', { 'taskbar-btn--disabled': !btn.enabled }]"
                :disabled="!btn.enabled"
                :aria-label="btn.label"
                :data-readout="fallbackReadout(btn)"
                @click="handleFallbackClick(btn)"
              >
                <i :class="['taskbar-btn-icon', btn.icon]"></i>
                <span v-if="btn.badgeCount && btn.badgeCount > 0" class="taskbar-btn-badge">
                  {{ btn.badgeCount }}
                </span>
              </button>
            </span>
          </template>
        </div>
      </div>

    </div>
    <!-- The bottom spectrum band: the INVERSE of the top bar — an 8px buffer under the
         buttons absorbing the shader curve's bottom-edge distortion (the curved modes bend
         the bottom rows; this band is what bends instead of the controls). -->
    <div class="taskbar-bottom-band" aria-hidden="true"></div>
  </div>
</template>

<style scoped>
.scs-taskbar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 110;
  /* 56px content + the 12px bottom spectrum band — the buttons ride above the
     shader curve's bottom-edge distortion; the band is what bends instead. */
  height: 68px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(8, 10, 16, 0.92);
  backdrop-filter: blur(8px);
}

.taskbar-inner {
  display: flex;
  align-items: center;
  height: 56px;
  padding: 0 0.5rem;
  gap: 0.5rem;
  /* BO-5 (C454) · THE X-SCROLL CURE: the inner row overflowed the viewport (1280 vs 1200)
     and pushed the PAGE wide. min-width:0 lets flex children shrink instead of summing past.
     V-3 · R2 THE PREEMPTIVE X-SCROLL: the overflow moved DOWN to .taskbar-right-scroll (only
     the right BUTTON ROW scrolls) so the SCP identity label in the left zone stays FIXED and
     never clips. The inner itself no longer scrolls — it clips to guard the page width. */
  min-width: 0;
  overflow: hidden;
}

/* The bottom spectrum band — the INVERSE of the top bar's order (pink → red), 8px. */
.taskbar-bottom-band {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 12px;
  opacity: 0.85;
  /* dimmed 33% — less value, hue + saturation kept */
  filter: brightness(0.67);
  /* D1 · hardcoded spectrum hex → var(--color-*) so a user re-tint flows through the
     bottom Suite Cascade Bar (values are byte-identical to the tokens — zero default change).
     The brown ::after overlay below is the footer EXCLUSION — preserved as-is. */
  background: linear-gradient(90deg,
    var(--color-fuchsia) 0%, var(--color-fuchsia) 14.28%,
    var(--color-purple) 14.28%, var(--color-purple) 28.57%,
    var(--color-blue) 28.57%, var(--color-blue) 42.85%,
    var(--color-green) 42.85%, var(--color-green) 57.14%,
    var(--color-yellow) 57.14%, var(--color-yellow) 71.42%,
    var(--color-orange) 71.42%, var(--color-orange) 85.71%,
    var(--color-red) 85.71%, var(--color-red) 100%);
}

/* The fixed overlay atop the band: full length, a 3-part gradient — transparent at the
   beginning, brown through the middle, transparent at the end. Lives INSIDE the band
   container so it rides under the same brightness filter. */
.taskbar-bottom-band::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg,
    transparent 0%,
    rgb(101, 67, 33) 50%,
    transparent 100%);
}

.taskbar-zone--left {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-shrink: 0;
}

/* SCP IDENTITY INDICATOR (C698) · Pewter voice — Orbitron uppercase, white glow text,
   a slim accent rule on its left edge; recede-toned so it identifies without shouting. */
.taskbar-scp-identity {
  font-family: var(--font-heading, 'Orbitron');
  font-size: 0.68rem;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: #ffffff;
  text-shadow: var(--pewter-text-glow);
  border-left: 3px solid var(--color-viridian, #40826d);
  padding: 0.15rem 0.6rem 0.15rem 0.5rem;
  white-space: nowrap;
  max-width: 180px;
  overflow: hidden;
  text-overflow: ellipsis;
  user-select: none;
}

/* THE STATUS PIP (C958) · the health chip beside the identity + version labels.
   THE COLOR LAW — the pip invents NO new color; every value is an exact reuse of a register
   this dock already ships (the model file carries the same table + its citations):
     healthy    rgb(19, 213, 148)        the Shield/A viridian (GitmStableAButton.vue:323)
     crashed    rgba(248,113,113,.95)    TOH-7's crash title + rgba(251,146,60,.9) its amber
                                         subtitle (bridgeStandbyOverlay.model.ts:376,382)
     restarting rgb(68, 150, 255)        the standby timer's blue (…overlay.model.ts:140)
     unknown    rgba(148,163,184,…)      the overlay's own recede tone (…:354) — dim, NOT green.
   The chamfer + neon-edge feel matches .taskbar-btn at a smaller, non-interactive weight so the
   pip reads as an INDICATOR, never as a button the user should press. */
.taskbar-status-pip {
  --pip-color: rgba(148, 163, 184, 0.72);
  --pip-accent: rgba(148, 163, 184, 0.3);
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  flex-shrink: 0;
  cursor: default;
  user-select: none;
  background: rgba(12, 14, 20, 0.85);
  border: 1px solid color-mix(in srgb, var(--pip-color) 45%, transparent);
  /* the smaller sibling of the taskbar-btn chamfer (4px cut for a 24px body) */
  clip-path: polygon(
    4px 0, calc(100% - 4px) 0, 100% 4px,
    100% calc(100% - 4px), calc(100% - 4px) 100%,
    4px 100%, 0 calc(100% - 4px), 0 4px
  );
  box-shadow: 0 0 6px 0 var(--pip-accent);
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.taskbar-status-pip-glyph {
  font-size: 0.6rem;
  line-height: 1;
  color: var(--pip-color);
  text-shadow: 0 0 6px var(--pip-accent);
}

/* unknown — the default AND the honest decline (no reading · no origin · unreachable).
   Deliberately the quietest state on the bar: it claims nothing. */
.taskbar-status-pip--unknown {
  --pip-color: rgba(148, 163, 184, 0.72);
  --pip-accent: rgba(148, 163, 184, 0.3);
  opacity: 0.75;
}

/* healthy — the Shield's own viridian, so "things are fine" reads in the SAME register the dock
   already assigns to "stable". A slow breath, not a blink. */
.taskbar-status-pip--healthy {
  --pip-color: rgb(19, 213, 148);
  --pip-accent: rgba(19, 213, 148, 0.45);
}
.taskbar-status-pip--healthy .taskbar-status-pip-glyph {
  animation: taskbar-pip-breathe 3.2s ease-in-out infinite;
}

/* crashed — the TOH-7 crash palette verbatim, so a user who has seen a crashed standby overlay
   recognizes this pip instantly. The one state that raises its voice (amber halo + pulse); its
   hover line names the signature and the Hard Turn Over that recovers. */
.taskbar-status-pip--crashed {
  --pip-color: rgba(248, 113, 113, 0.95);
  --pip-accent: rgba(251, 146, 60, 0.9);
  border-color: color-mix(in srgb, var(--pip-color) 80%, transparent);
  animation: taskbar-pip-alarm 1.6s ease-in-out infinite;
}

/* restarting — the standby timer's blue. Overlay-keyed: while the overlay is up it owns the
   verdict and the pip simply agrees with it rather than polling against it. */
.taskbar-status-pip--restarting {
  --pip-color: rgb(68, 150, 255);
  --pip-accent: rgba(68, 150, 255, 0.45);
}
.taskbar-status-pip--restarting .taskbar-status-pip-glyph {
  animation: taskbar-pip-breathe 1.1s ease-in-out infinite;
}

@keyframes taskbar-pip-breathe {
  0%, 100% { opacity: 0.55; }
  50% { opacity: 1; }
}

@keyframes taskbar-pip-alarm {
  0%, 100% { box-shadow: 0 0 6px 0 var(--pip-accent); }
  50% { box-shadow: 0 0 13px 2px var(--pip-accent); }
}

/* The state still reads through color + the hover line when motion is unwelcome. */
@media (prefers-reduced-motion: reduce) {
  .taskbar-status-pip,
  .taskbar-status-pip .taskbar-status-pip-glyph {
    animation: none;
  }
}

.taskbar-zone--center {
  /* C812 · THE GAP CURE — the center zone is EMPTY today (Wave-4 future seat); flex:1 was
     fighting the right zone for the free space, opening the strange gap between the version
     badge and the button area. Restore flex:1 when Wave-4 mounts content here. */
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  justify-content: center;
}

.taskbar-zone--right {
  /* V-3 · R2 — the right zone takes the remaining width and lets its scroll child clip+scroll
     (min-width:0 is the flex law that lets a flex child shrink below its content size so the
     inner overflow ENGAGES instead of pushing the page wide). */
  display: flex;
  align-items: center;
  flex: 1 1 auto;
  min-width: 0;
  justify-content: flex-end;
}

/* V-3 · R2 · THE PREEMPTIVE X-SCROLL REGION — ONLY the right button row scrolls. overflow-x:auto
   is preemptive so an overflow never clips a button; the button wraps carry flex-shrink:0 so the
   scroll engages instead of squashing them. The 4px thin/hidden scrollbar recipe (the codebase
   precedent · ScsBridgeSessionsPopup body) keeps the bar clean. */
.taskbar-right-scroll {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  min-width: 0;
  max-width: 100%;
  overflow-x: auto;
  /* C812 · overflow-y:visible COMPUTES to auto when overflow-x is auto (the CSS law) — the
     wrapper WILL clip vertically. The badge pills overhang the button tops, so the wrapper
     carries HEADROOM (padding-top + negative margin) keeping them inside the scrollable box.
     The hover panels ESCAPE separately (position:fixed · set on mouseenter). */
  padding-top: 14px;
  margin-top: -14px;
  overflow-y: visible;
  scrollbar-width: thin;
  scrollbar-color: rgba(255, 255, 255, 0.15) transparent;
}
.taskbar-right-scroll::-webkit-scrollbar {
  height: 4px;
}
.taskbar-right-scroll::-webkit-scrollbar-track {
  background: transparent;
}
.taskbar-right-scroll::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.15);
  border-radius: 3px;
}
.taskbar-right-scroll::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.25);
}
/* THE FLEX-CHILD MIN-WIDTH GUARD — the button wraps must NOT shrink; the scroll engages instead. */
.taskbar-right-scroll > .taskbar-btn-wrap,
.taskbar-right-scroll > * {
  flex-shrink: 0;
}

/* The positioning wrapper — carries --btn-neon + hosts the tooltip OUTSIDE the clipped body
   so the chamfer cannot cut the panel away. NO clip-path here. */
.taskbar-btn-wrap {
  --btn-neon: rgba(255, 255, 255, 0.6);
  position: relative;
  display: inline-flex;
  align-items: center;
}

/* Dark neon-framed register: a deep near-black chamfered body whose suite identity reads
   through a thin glowing edge (--btn-neon, set per-button from the registration suiteColor).
   The color informs via the glow — never a flooded fill. */
.taskbar-btn {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  padding: 0.5rem;
  cursor: pointer;

  /* The deep field — radial depth over near-black. */
  background:
    radial-gradient(ellipse at 40% 32%, rgba(255, 255, 255, 0.05) 0%, rgba(12, 14, 20, 0) 64%),
    rgb(12, 14, 20);

  /* The neon edge — thin ring tinted by the suite color. */
  border: 1px solid color-mix(in srgb, var(--btn-neon) 50%, transparent);
  /* Chamfered corners — the angular StratiPUNK cut. */
  clip-path: polygon(
    8px 0, calc(100% - 8px) 0, 100% 8px,
    100% calc(100% - 8px), calc(100% - 8px) 100%,
    8px 100%, 0 calc(100% - 8px), 0 8px
  );
  box-shadow:
    0 0 7px 0 color-mix(in srgb, var(--btn-neon) 24%, transparent),
    inset 0 0 9px 0 color-mix(in srgb, var(--btn-neon) 8%, transparent);
  color: var(--color-white-conductor, #f0f0f0);
  transition: box-shadow 0.2s ease, border-color 0.2s ease;
}

/* The neon glyph — the suite color glowing on the dark body. */
.taskbar-btn-icon {
  color: var(--btn-neon);
  text-shadow: 0 0 6px color-mix(in srgb, var(--btn-neon) 55%, transparent);
}

.taskbar-btn:hover:not(:disabled) {
  border-color: color-mix(in srgb, var(--btn-neon) 85%, transparent);
  box-shadow:
    0 0 13px 1px color-mix(in srgb, var(--btn-neon) 45%, transparent),
    inset 0 0 13px 0 color-mix(in srgb, var(--btn-neon) 15%, transparent);
}

.taskbar-btn:active:not(:disabled) {
  box-shadow: inset 0 0 11px 1px color-mix(in srgb, var(--btn-neon) 30%, transparent);
}

.taskbar-btn--disabled {
  opacity: 0.3;
  cursor: not-allowed;
}






.taskbar-btn-badge {
  position: absolute;
  top: -6px;
  right: -6px;
  min-width: 18px;
  height: 18px;
  padding: 0 4px;
  border-radius: 9px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-mono, 'Space Mono', monospace);
  font-size: 9px;
  font-weight: bold;
  background: rgba(20, 10, 25, 0.9);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: rgba(255, 255, 255, 0.85);
}

/* D-UP8 · THE VERSION LABEL — HiFi purple base beside the SCP name; the state variants
   swap the neon (RED = npm greater · update / FUCHSIA = npm lesser · ahead). The hover
   pane mirrors the btn-tip recipe exactly (the SCS-Bridge inspiration). */
.taskbar-version-wrap {
  position: relative;
  display: inline-flex;
  align-items: center;
}
.taskbar-bridge-version {
  --ver-neon: var(--color-purple, #a78bfa);
  font-family: var(--font-mono, 'SF Mono', Monaco, monospace);
  font-size: 0.62rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  padding: 0.1rem 0.45rem;
  border-radius: 4px;
  border: 1px solid color-mix(in srgb, var(--ver-neon) 55%, transparent);
  color: var(--ver-neon);
  text-shadow: 0 0 6px color-mix(in srgb, var(--ver-neon) 40%, transparent);
  cursor: pointer;
  /* THE CLICKABLE FEEL — the label IS the update button; the cursor alone was the only
     tell. Hover lifts + fills the neon; active PRESSES (the taskbar-btn family feel). */
  background: transparent;
  transition: background 0.14s ease, box-shadow 0.14s ease, transform 0.1s ease;
}
.taskbar-bridge-version:hover {
  background: color-mix(in srgb, var(--ver-neon) 14%, transparent);
  box-shadow: 0 0 10px color-mix(in srgb, var(--ver-neon) 45%, transparent);
  transform: translateY(-1px);
}
.taskbar-bridge-version:active {
  background: color-mix(in srgb, var(--ver-neon) 26%, transparent);
  box-shadow: 0 0 4px color-mix(in srgb, var(--ver-neon) 60%, transparent) inset;
  transform: translateY(1px) scale(0.97);
}
.taskbar-bridge-version--red {
  --ver-neon: var(--color-red, #f87171);
}
.taskbar-bridge-version--fuchsia {
  --ver-neon: var(--color-fuchsia, #e879f9);
}
/* C1059 · the fourth register — the instruction set UNSTAMPED: out of sync, not behind (the S8
   out-of-sync precedent · Salvo B D1). Never red; red is behind. */
.taskbar-bridge-version--orange {
  --ver-neon: var(--color-orange, #f97316);
}
.taskbar-version-tip {
  /* D-UP8c · BODY-MOUNTED + FIXED (the bridgeStandbyOverlay law · the working Tactical
     Bridge means): the pane lives on document.body, positioned above the bar at the
     label's corner — no taskbar ancestor exists to clip it. 79px = the 68px bar + 11px. */
  position: fixed;
  bottom: 79px;
  left: 12px;
  transform: translateY(4px);
  display: flex;
  flex-direction: column;
  gap: 3px;
  width: 240px;
  padding: 8px 11px;
  white-space: normal;
  text-align: left;
  background: rgba(10, 12, 18, 0.97);
  border: 1px solid color-mix(in srgb, var(--color-purple, #a78bfa) 50%, transparent);
  border-radius: 5px;
  box-shadow: 0 0 12px color-mix(in srgb, var(--color-purple, #a78bfa) 32%, transparent), 0 6px 16px rgba(0, 0, 0, 0.6);
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.16s ease, transform 0.16s ease;
  z-index: 220;
}
/* C1060 · THE SPACING BRIDGE — an invisible extension of the tip's hit area, from its bottom edge down
   across the gap to the bar (79px floor − 68px bar = 11px, plus the chip's own offset inside the bar ≈
   40px). Pseudo-elements hit-test as part of their element, so the pointer crossing the gap never
   triggers the tip's mouseleave. Inert at rest (pointer-events inherits `none`), live with `--visible`.
   Paired with the grace timer in the script — the two cures cover each other's miss. */
.taskbar-version-tip::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  top: 100%;
  height: 48px;
}
.taskbar-version-tip-title {
  font-family: var(--font-heading, 'Orbitron', system-ui, sans-serif);
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  color: var(--color-purple, #a78bfa);
  text-shadow: 0 0 6px color-mix(in srgb, var(--color-purple, #a78bfa) 45%, transparent), 0.5px 0.5px 0 #fff;
}
.taskbar-version-tip-body {
  font-family: var(--font-mono, 'SF Mono', Monaco, monospace);
  font-size: 0.64rem;
  line-height: 1.45;
  letter-spacing: 0.02em;
  color: rgba(228, 232, 240, 0.82);
}
.taskbar-version-tip-counters {
  font-family: var(--font-mono, 'SF Mono', Monaco, monospace);
  font-size: 0.62rem;
  letter-spacing: 0.05em;
  color: color-mix(in srgb, var(--color-purple, #a78bfa) 85%, #fff);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  padding-top: 4px;
  margin-top: 2px;
}
.taskbar-version-tip--visible {
  opacity: 1;
  transform: translateY(0);
  /* C1047 · THE REACHABILITY CURE. The tip carries `pointer-events: none` at rest — correct for a
     pure tooltip, and FATAL once it holds a button: the pointer would pass straight through, the
     tip's own mouseenter would never fire, and the button would render perfectly while doing
     nothing. Nothing would error. Restored ONLY in the visible state, so the resting tip still
     never intercepts a pointer crossing the bar. */
  pointer-events: auto;
}

/* C1047 · THE SECOND CONTROL's own affordance — the COMPUTER update, distinct from the badge click
   (the PROGRAM update via GitM). Blue is the Suite 5 · Implementation register, matching every
   other fire-button in this codebase. */
/* C1059 · the compact D7 variant of `hifi-btn hifi-btn-blue` for a 240px tip (R4 + R7: the base class
   was MISSING — the "washed ghost" was a class omission, not contrast; text measures 16:1). */
.taskbar-version-tip-action {
  margin-top: 6px;
  align-self: stretch;
  width: 100%;
  cursor: pointer;
  font-size: 0.68rem;
  padding: 0.5rem 0.75rem;
  letter-spacing: 0.04em;
  white-space: nowrap;
}
.taskbar-version-tip-isrow {
  --is-neon: rgba(228, 232, 240, 0.82);
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 0 6px;
  font-family: var(--font-mono, 'SF Mono', Monaco, monospace);
  font-size: 0.62rem;
  letter-spacing: 0.05em;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  padding-top: 4px;
  margin-top: 2px;
}
.taskbar-version-tip-isrow--red {
  --is-neon: var(--color-red, #f87171);
}
.taskbar-version-tip-isrow--orange {
  --is-neon: var(--color-orange, #f97316);
}
.taskbar-version-tip-isrow--fuchsia {
  --is-neon: var(--color-fuchsia, #e879f9);
}
.taskbar-version-tip-isrow-label {
  color: color-mix(in srgb, var(--color-purple, #a78bfa) 85%, #fff);
}
.taskbar-version-tip-isrow-state {
  color: var(--is-neon);
  font-weight: 700;
}
.taskbar-version-tip-isrow-note {
  flex-basis: 100%;
  font-size: 0.6rem;
  letter-spacing: 0.02em;
  color: rgba(228, 232, 240, 0.7);
}
</style>
