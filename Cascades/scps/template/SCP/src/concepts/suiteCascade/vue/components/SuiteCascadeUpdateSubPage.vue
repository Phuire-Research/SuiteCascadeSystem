<script setup lang="ts">
/**
 * SuiteCascadeUpdateSubPage · THE COMPUTER's update surface (C1053)
 *
 * THE COMPUTER/PROGRAM MODEL (the user's): the SCS is the COMPUTER that loads an SCP. GitM's Update
 * page updates the PROGRAM (the SCP). THIS page updates the COMPUTER — the SCS itself, whose
 * operative document is the instruction set (`.claude/CLAUDE.md`). The SCS encloses the SCP; two
 * circuits, two pages, never one control with two meanings.
 *
 * THREE PARTS, each riding a means that already ships:
 *   LAUNCH  — the Update Agent, passed `/cascade:update` on Rail A (the same fire the badge uses)
 *   VIEWER  — the local instruction set, rendered (marked · the Documentation sibling's renderer)
 *   DIFF    — current vs published, WORD-level, previewed BEFORE consent
 *
 * THE PAGE NEVER RESOLVES A PATH. The CLI is the Base; this page is an Informative. It asks the CLI
 * (`/instruction-set/*`) and the CLI resolves the remote through SCS_INSTALL_REPO_URL — a file://
 * working-tree read in the dev lane, a raw fetch in production. The junction the user named ("after
 * the fact, or an env-var path") is the second, and it lives on the server, not here.
 *
 * THE REF IS SHOWN, NOT HIDDEN. In the remote lane the published text comes from `main`, which may
 * be ahead of the release the badge measured. The CLI carries `ref` in its answer and this page
 * SAYS what it compared against. A diff that silently compares the wrong pair is worse than none.
 *
 * MANUAL MODE IS THE USER'S, DEFAULT ON, PERSISTED. A session that can rewrite the governing document
 * must never run unattended for a developer's convenience — the opt-out is a visible toggle here,
 * never a call-site prop.
 *
 * THE PEWTER RENEWAL (C1124 · Salvo FTU). Presentation only — the three means, the endpoints, and the
 * manual-mode semantics are unchanged. The three parts become D14 header-bar panels (LAUNCH bar-only;
 * VIEWER anor DIFF grounded), the counters a small D10 readout with the D11 drift gate, the buttons D7
 * variants. The VIEWER gains the Graphite Scribe's LINE NUMBERS — source lines, block-anchored from a
 * `marked.lexer` walk — and Suite coloring from the user-set HiFi Suite Color variables: the Suite
 * rows in their own variable, the Crystraline headers in a rotation FROM RED keyed on the parsed
 * C-number, SECTION headers in the HiFi heading register. The DIFF speaks the same line coordinates
 * and its del/ins colors are the red anor green variables. See instructionSetViewerRender.model.ts.
 */
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { loadScpConfig } from '../../../../model/scpConfig.model';
import { getGlobalScsBridgeController } from '../../../scsBridge/scsBridgeController';
import { renderInstructionSet, hunkHeaderNewStart } from '../../model/instructionSetViewerRender.model';

type Verdict = { installed: number | null; published: number | null; updateAvailable: boolean };
type DiffAnswer =
  | { unavailable: true; reason: string }
  | { source: 'local' | 'remote'; ref: string; differs: boolean; diff: string; localLines: number; remoteLines: number };

const origin = ref<string>('');
const loading = ref<boolean>(true);
const loadError = ref<string>('');
const verdict = ref<Verdict>({ installed: null, published: null, updateAvailable: false });
const localText = ref<string>('');
const localLines = ref<number>(0);
const diffAnswer = ref<DiffAnswer | null>(null);
const activePane = ref<'viewer' | 'diff'>('viewer');
const fired = ref<boolean>(false);

// THE MANUAL-MODE TOGGLE · default ON · persisted per viewer. Absence of a stored value = ON.
const MANUAL_KEY = 'scs.update.manualMode';
const manualMode = ref<boolean>(true);
try {
  const stored = localStorage.getItem(MANUAL_KEY);
  if (stored === 'false') manualMode.value = false;
} catch { /* storage unavailable → the safe default stands */ }
function setManualMode(next: boolean): void {
  manualMode.value = next;
  try { localStorage.setItem(MANUAL_KEY, String(next)); } catch { /* best-effort persistence */ }
}

// THE STATUS LINE · three states, and ABSENCE IS NOT "BEHIND".
const statusLine = computed<string>(() => {
  const { installed, published, updateAvailable } = verdict.value;
  if (installed === null && published === null) return 'Instruction set · not yet stamped, and the published revision has not been read.';
  if (installed === null) return `Instruction set · this project carries no stamp (installed before tracking began) · published v${published}.`;
  if (published === null) return `Instruction set v${installed} · the published revision has not been read yet.`;
  if (!updateAvailable) return `Instruction set v${installed} · current with the published revision.`;
  return `Instruction set v${installed} · the published revision is v${published} — an update is available.`;
});

// THE D10 READOUT reads what /instruction-set serves TODAY (installed · published · updateAvailable);
// absence renders an honest dash, never a 0 floor.
const counterText = (n: number | null): string => (n === null ? '—' : `v${n}`);

// THE VIEWER · marked render + the source-line gutter stamps + the content-keyed Suite/Crystraline tags
// (presentation passes over the SAME render — the means is unchanged).
const renderedLocal = computed<string>(() => renderInstructionSet(localText.value));

// THE WORD-DIFF RENDER · [-removed-] and {+added+} are git's plain word-diff markers. Each body line is
// stamped with its source line from the parsed `@@ -a,b +c,d @@` hunk header (the `+` side) so the gutter
// speaks the viewer's coordinates; the escape-then-mark order is unchanged (the stamp is an attribute).
const escapeHtml = (s: string): string =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const renderedDiff = computed<string>(() => {
  const d = diffAnswer.value;
  if (!d || 'unavailable' in d || !d.differs) return '';
  let lineNo = 1;
  return d.diff
    .split('\n')
    .filter((line) => !/^(diff --git|index |--- |\+\+\+ )/.test(line))
    .map((line) => {
      if (/^@@/.test(line)) {
        const start = hunkHeaderNewStart(line);
        if (start !== null) lineNo = start;
        return `<div class="isdiff-hunk">${escapeHtml(line)}</div>`;
      }
      const html = escapeHtml(line)
        .replace(/\[-([\s\S]*?)-\]/g, '<del class="isdiff-del">$1</del>')
        .replace(/\{\+([\s\S]*?)\+\}/g, '<ins class="isdiff-ins">$1</ins>');
      return `<div class="isdiff-line" data-line="${lineNo++}">${html || '&nbsp;'}</div>`;
    })
    .join('');
});
const diffCaption = computed<string>(() => {
  const d = diffAnswer.value;
  if (!d) return '';
  if ('unavailable' in d) return `Diff unavailable — ${d.reason}`;
  const against = d.source === 'local' ? 'the local development tree' : `the published source (ref: ${d.ref})`;
  return d.differs
    ? `Compared against ${against} · ${d.localLines} → ${d.remoteLines} lines.`
    : `Identical to ${against}.`;
});

async function readAll(): Promise<void> {
  loading.value = true;
  loadError.value = '';
  try {
    const cfg = await loadScpConfig();
    const o = typeof cfg?.originEndpoint === 'string' ? cfg.originEndpoint.replace(/\/+$/, '') : '';
    if (!o) { loadError.value = 'The SCS-Bridge CLI origin is not published for this SCP.'; return; }
    origin.value = o;
    const [v, l, d] = await Promise.all([
      fetch(`${o}/instruction-set`, { cache: 'no-store' }).then((r) => (r.ok ? r.json() : null)),
      fetch(`${o}/instruction-set/local`, { cache: 'no-store' }).then((r) => (r.ok ? r.json() : null)),
      fetch(`${o}/instruction-set/diff`, { cache: 'no-store' }).then((r) => (r.ok ? r.json() : null)),
    ]);
    if (v && typeof v === 'object') {
      verdict.value = {
        installed: typeof v.installed === 'number' ? v.installed : null,
        published: typeof v.published === 'number' ? v.published : null,
        updateAvailable: v.updateAvailable === true,
      };
    }
    if (l && typeof l.text === 'string') { localText.value = l.text; localLines.value = typeof l.lines === 'number' ? l.lines : 0; }
    if (d && typeof d === 'object') diffAnswer.value = d as DiffAnswer;
  } catch (err) {
    loadError.value = err instanceof Error ? err.message : String(err);
  } finally {
    loading.value = false;
  }
}

// THE FIRE · Rail A · onboard:false is THE DECIDING FLAG (the directive rides ALONE at column 1,
// the only position at which a slash command executes) · manualMode is the user's toggle.
function fireUpdate(): void {
  try {
    getGlobalScsBridgeController()?.triggerSpawnSuite8Session(
      'Cascade Update', null, /* asWorker */ true, /* fresh */ false,
      manualMode.value, '/cascade:update', /* onboard */ false,
    );
    fired.value = true;
  } catch { /* a spawn failure must never break the page; the button stays available */ }
}

// C1062 · THE PULL PARTNER (the badge's twin). The stamp moves when the Update Agent — launched from this
// page anor the badge — writes Cascade.json. Poll the LIGHT verdict only (`/instruction-set`: two small
// file reads server-side); the heavy content and diff reads stay on mount and Refresh. Re-read when the
// tab becomes visible again (the user returns from the agent's window). A push is carded for Release.
const VERDICT_POLL_MS = 10_000;
let verdictTimer: ReturnType<typeof setInterval> | null = null;
async function readVerdict(): Promise<void> {
  const o = origin.value;
  if (!o) return;
  try {
    const r = await fetch(`${o}/instruction-set`, { cache: 'no-store' });
    if (!r.ok) return;
    const v = (await r.json()) as { installed?: unknown; published?: unknown; updateAvailable?: unknown };
    verdict.value = {
      installed: typeof v.installed === 'number' ? v.installed : null,
      published: typeof v.published === 'number' ? v.published : null,
      updateAvailable: v.updateAvailable === true,
    };
  } catch { /* a decline leaves the last verdict standing */ }
}
function onVisibility(): void {
  if (document.visibilityState === 'visible') void readVerdict();
}
onMounted(() => {
  void readAll();
  verdictTimer = setInterval(() => { void readVerdict(); }, VERDICT_POLL_MS);
  document.addEventListener('visibilitychange', onVisibility);
});
onUnmounted(() => {
  if (verdictTimer !== null) { clearInterval(verdictTimer); verdictTimer = null; }
  document.removeEventListener('visibilitychange', onVisibility);
});
</script>

<template>
  <section class="suitecascade-update-subpage">
    <div class="docsite hifi-pane-mux">
      <div class="docsite-header">
        <span class="hifi-heading docsite-title">Update · the SCS</span>
        <span class="hifi-label docsite-sub">The computer that loads your SCPs — its instruction set, viewed and diffed before you consent</span>
        <!-- BLUE is cobalt's SPECTRUM name — the CSS tokens carry spectrum names (blue/red/…), the
             registry carries the Suite alias (cobalt). Same colour, two registers. D5 embossed rule. -->
        <div class="hifi-embossed-blue" style="margin-top: 0.4rem;" />
      </div>

      <!-- LAUNCH · D14 P2 — header bar only, NO ground (interactive controls are grounding-excluded).
           The bar carries the D10 readout (degraded to the mono role · D6) under the D11 drift gate. -->
      <section class="isupd-part isupd-part--launch">
        <header class="hifi-panel-toolbar">
          <span class="hifi-heading isupd-part-title">Launch</span>
          <div class="isupd-readout hifi-mono" :class="{ 'isupd-readout--drift': verdict.updateAvailable }" :title="statusLine">
            <span class="isupd-cell">
              <span class="isupd-cell-label">Installed</span><span class="isupd-cell-value">{{ counterText(verdict.installed) }}</span>
            </span>
            <span class="isupd-cell-sep" aria-hidden="true">·</span>
            <span class="isupd-cell">
              <span class="isupd-cell-label">Published</span><span class="isupd-cell-value">{{ counterText(verdict.published) }}</span>
            </span>
            <span v-if="verdict.updateAvailable" class="isupd-readout-pill">Update available</span>
          </div>
        </header>
        <div class="hifi-panel-body isupd-launch-body">
          <div class="isupd-status">
            <span class="hifi-label">{{ loading ? 'Reading…' : statusLine }}</span>
            <span v-if="loadError" class="hifi-label isupd-error">{{ loadError }}</span>
          </div>
          <div class="isupd-controls">
            <label class="isupd-toggle hifi-label">
              <input type="checkbox" :checked="manualMode" @change="setManualMode(($event.target as HTMLInputElement).checked)" />
              Manual mode — the agent asks before each change
            </label>
            <button
              type="button"
              class="hifi-btn hifi-btn-blue isupd-fire"
              :disabled="loading || fired"
              @click="fireUpdate"
            >
              {{ fired ? 'Update Agent dispatched' : 'Update the SCS · run /cascade:update' }}
            </button>
            <button type="button" class="hifi-btn hifi-btn-transparent isupd-refresh" :disabled="loading" @click="readAll">Refresh</button>
          </div>
        </div>
      </section>

      <!-- THE PANE SWITCH · D7 Suite pills (the Documentation sub-page's SECTION_PILL idiom) -->
      <nav class="isupd-panes">
        <button type="button" :class="['hifi-btn', 'hifi-btn-blue', 'isupd-tab', 'isupd-tab--viewer', { active: activePane === 'viewer' }]" @click="activePane = 'viewer'">
          Instruction Set <span class="docsite-count">{{ localLines }}</span>
        </button>
        <button type="button" :class="['hifi-btn', 'hifi-btn-fuchsia', 'isupd-tab', 'isupd-tab--diff', { active: activePane === 'diff' }]" @click="activePane = 'diff'">
          Diff
          <span v-if="diffAnswer && !('unavailable' in diffAnswer) && diffAnswer.differs" class="docsite-count">changed</span>
        </button>
      </nav>

      <div class="isupd-body">
        <!-- VIEWER · D14 P3 — header bar + the full .hifi-subtext-ground around multi-line statement prose.
             The One-Line rule: an absent document renders as a plain label, ungrounded. -->
        <section v-if="activePane === 'viewer'" class="isupd-part isupd-part--viewer">
          <header class="hifi-panel-toolbar">
            <span class="hifi-heading isupd-part-title">Instruction Set</span>
            <span class="hifi-label isupd-part-meta">{{ localLines }} lines · source line numbers in the gutter</span>
          </header>
          <div class="hifi-panel-body isupd-reader-body">
            <div v-if="!localText" class="hifi-label isupd-caption">No instruction set found at the workspace root.</div>
            <div v-else class="hifi-subtext-ground isupd-ground">
              <div class="isupd-markdown custom-scrollbar" v-html="renderedLocal" />
            </div>
          </div>
        </section>
        <!-- DIFF · D14 P3 in the same register; the caption rides the bar when the body renders,
             and stands alone (ungrounded · One-Line rule) when there is nothing to show. -->
        <section v-else class="isupd-part isupd-part--diff">
          <header class="hifi-panel-toolbar">
            <span class="hifi-heading isupd-part-title">Diff</span>
            <span v-if="renderedDiff" class="hifi-label isupd-part-meta">{{ diffCaption }}</span>
          </header>
          <div class="hifi-panel-body isupd-reader-body">
            <div v-if="renderedDiff" class="hifi-subtext-ground isupd-ground">
              <div class="isupd-diff-body hifi-mono custom-scrollbar" v-html="renderedDiff" />
            </div>
            <div v-else class="hifi-label isupd-caption">{{ diffCaption || 'The comparison has not been read yet.' }}</div>
          </div>
        </section>
      </div>
    </div>
  </section>
</template>

<style scoped>
/* ════════════════════════════════════════════════════════════════════════════════════════════════
   Salvo FTU · the Update sub-page in the Pewter register. D-numbers cite the Pewter Tessera Skill.
   Every color is a --color-<spectrum> variable or its -light / -dark / --shadow- sibling (D1 · D9 Law 2).
   Absent hifiConfig.json → the shipped :root defaults stand; no rule here carries a hex fallback for a
   suite color (synthesis U10 · Absence Is a State). Neutral chrome is the MARKED neutral — the shipped
   --color-white-conductor / --color-white-muted tokens and the hairline rgba whites of .hifi-panel-toolbar
   (D9 Law 3).
   ════════════════════════════════════════════════════════════════════════════════════════════════ */
.suitecascade-update-subpage { display: flex; flex-direction: column; gap: 0.75rem; }
.docsite { border-radius: 8px; overflow: hidden; padding: 0.75rem; }
.docsite-header { display: flex; flex-direction: column; gap: 0.2rem; padding: 0 0.25rem 0.5rem; }
.docsite-sub { opacity: 0.75; }

/* D14 · the three parts as header-bar panels (.hifi-panel-toolbar + .hifi-panel-body, the shipped
   primitive classes). LAUNCH = P2 (bar only — controls are grounding-EXCLUDED); VIEWER anor DIFF = P3
   (bar + .hifi-subtext-ground). The panel frame is neutral chrome (the header bar applies to ANY panel). */
.isupd-part {
  margin-top: 0.75rem;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(0, 0, 0, 0.22);
}
.isupd-part-title { font-size: 0.78rem; letter-spacing: 0.08em; text-transform: uppercase; color: var(--color-white-conductor); }
.isupd-part-meta { font-size: 0.7rem; opacity: 0.72; text-align: right; }
.isupd-launch-body { display: flex; flex-direction: column; gap: 0.65rem; padding: 0.85rem 1rem 1rem; }
/* D14 · .hifi-panel-body padding IS the inset gap from the grounded card's edge — tightened for a reader. */
.isupd-reader-body { padding: 0.75rem; }

/* D10 · the instrument readout, DEGRADED to the mono role with tabular figures (D6 — this SCP ships no
   segment face) · D11 §6 desaturation gate: idle = saturate(0.3) yet fully rendered; drift = saturate(1)
   + the miniature offset drop-glow (-3px 3px 12px · down-left, D5's light source) + the pill's halo
   (D11 §1). Reads what /instruction-set serves TODAY (U7): installed · published · updateAvailable. */
.isupd-readout {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.2rem 0.6rem;
  border-radius: 4px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(0, 0, 0, 0.35);
  font-size: 0.72rem;
  font-variant-numeric: tabular-nums;
  font-feature-settings: 'tnum';
  filter: saturate(0.3);
  transition: filter 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease;
}
.isupd-readout--drift {
  filter: saturate(1);
  box-shadow: -3px 3px 12px var(--shadow-blue);
  border-color: color-mix(in srgb, var(--color-blue) 45%, transparent);
}
.isupd-cell { display: inline-flex; align-items: baseline; gap: 0.35rem; }
.isupd-cell-label { font-size: 0.58rem; letter-spacing: 0.1em; text-transform: uppercase; color: var(--color-white-muted); }
.isupd-cell-value { color: var(--color-blue-light); font-weight: 700; }
.isupd-cell-sep { opacity: 0.4; }
.isupd-readout-pill {
  margin-left: 0.25rem;
  padding: 0.05rem 0.45rem;
  border-radius: 999px;
  border: 1px dotted var(--color-blue);
  color: var(--color-blue-light);
  font-size: 0.58rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  text-shadow: 0 0 6px var(--shadow-blue);
}

/* LAUNCH body · the prose status line stays (its Absence-Is-Not-"Behind" states are the honest record);
   the drift signal moved to the readout above (D11), so the old cobalt border-left is gone. */
.isupd-status { display: flex; flex-direction: column; gap: 0.25rem; font-size: 0.8rem; }
.isupd-error { color: var(--color-red-light); }
.isupd-controls { display: flex; flex-wrap: wrap; align-items: center; gap: 0.75rem; }
.isupd-toggle { display: inline-flex; align-items: center; gap: 0.4rem; cursor: pointer; font-size: 0.8rem; }
.isupd-toggle input { accent-color: var(--color-blue); }
/* D7 · Fire = the blue Suite pill (implementation action · D9 Law 1); Refresh = the TRANSPARENT variant —
   the MARKED neutral for a secondary action (an unclassed button is an accidental neutral · D9 Law 3). */
.isupd-fire, .isupd-refresh { cursor: pointer; padding: 0.55rem 1.1rem; font-size: 0.78rem; }

/* D7 · the pane switch — Suite pills per the Documentation sub-page's SECTION_PILL idiom. Instruction Set
   = the SCS's own document → blue, the page's suite (the same variable as the header rule and the fire
   button — D9 Law 3 repetition under derivation); Diff = comparison/diagnosis → fuchsia (D9 Law 1).
   The active outline wears the +3-spectrum COMPLEMENT (the C885 law the Documentation sub-page proves). */
.isupd-panes { display: flex; gap: 0.5rem; margin-top: 0.75rem; flex-wrap: wrap; }
.isupd-tab { cursor: pointer; font: inherit; padding: 0.4rem 0.8rem; }
.isupd-tab--viewer.active { outline: 2px solid var(--color-red); outline-offset: 1px; }
.isupd-tab--diff.active { outline: 2px solid var(--color-yellow); outline-offset: 1px; }
.docsite-count { opacity: 0.6; margin-left: 0.4rem; font-size: 0.75em; }
.isupd-body { min-height: 12rem; }
.isupd-caption { display: block; padding: 0.25rem 0.25rem 0.5rem; opacity: 0.8; }

/* ─── THE GUTTER (U4) · the Graphite Scribe's line-number gutter adapted to rendered markdown ──────────
   SOURCE line numbers, block-anchored: the lexer walk stamps data-line on each top-level block; CSS
   renders it on the block's FIRST visual row, so wrapped prose and tables cannot drift it. The gutter
   band is var(--color-base) — the Scribe's #1a1a1a IS the base token — behind a 1px hairline; digits in
   the mono role (D6). rem units keep the column aligned across heading and body font sizes. The band
   does not scroll with the content (background-attachment scroll on an overflow box), the digits do. */
.isupd-markdown,
.isupd-diff-body {
  position: relative;
  max-height: 60vh;
  overflow: auto;
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background:
    linear-gradient(90deg,
      var(--color-base) 0, var(--color-base) 3rem,
      rgba(255, 255, 255, 0.07) 3rem, rgba(255, 255, 255, 0.07) calc(3rem + 1px),
      rgba(0, 0, 0, 0.22) calc(3rem + 1px));
  color: var(--color-white-conductor);
}
.isupd-markdown { padding: 0.75rem 0.9rem 0.9rem 3.6rem; line-height: 1.55; font-size: 0.9rem; }
.isupd-markdown :deep([data-line]),
.isupd-diff-body :deep(.isdiff-line) { position: relative; }
.isupd-markdown :deep([data-line])::before,
.isupd-diff-body :deep(.isdiff-line)::before {
  content: attr(data-line);
  position: absolute;
  top: 0;
  left: -3.6rem;
  width: 2.6rem;
  text-align: right;
  font-family: var(--font-mono);
  font-size: 0.66rem;
  font-weight: 400;
  font-style: normal;
  line-height: 1.5rem;
  letter-spacing: 0;
  text-transform: none;
  text-shadow: none;
  color: var(--color-white-muted);
  opacity: 0.85;
  white-space: nowrap;
  user-select: none;
  pointer-events: none;
}
/* Wide blocks scroll WITHIN themselves so the container never scrolls horizontally away from the band. */
.isupd-markdown :deep(table) { display: block; max-width: 100%; overflow-x: auto; }
.isupd-markdown :deep(pre) { overflow-x: auto; }

/* ─── THE MARKDOWN READOUT · the Documentation sub-page's register at its density ──────────────────── */
/* D6 · h1/h2 wear the heading face — the HiFi heading register the Documentation sub-page gives its main
   headers. U6: SECTION headers are NOT Suite-colored (a third colored stratum dilutes the two the user
   named); the tagger anchors them (data-section · id) and this rule gives them a neutral hairline. */
.isupd-markdown :deep(h1) {
  font-family: var(--font-heading);
  font-weight: 600;
  letter-spacing: 0.02em;
  font-size: 1.3rem;
  margin: 0.3rem 0 1rem;
  color: var(--color-white-conductor);
}
/* D8 · the .suite-hr composition as the title's rule · D9 Law 3: the spectrum signature marks a
   total-system moment — the constitution's own title — and it consumes the variables, so a re-tint
   recolors the mark itself. */
.isupd-markdown :deep(h1)::after {
  content: '';
  display: block;
  height: 2px;
  margin-top: 0.5rem;
  background: linear-gradient(90deg,
    transparent 0%,
    var(--color-red) 12%, var(--color-orange) 25%, var(--color-yellow) 38%, var(--color-green) 50%,
    var(--color-blue) 62%, var(--color-purple) 75%, var(--color-fuchsia) 88%,
    transparent 100%);
}
.isupd-markdown :deep(h2) {
  font-family: var(--font-heading);
  font-weight: 600;
  letter-spacing: 0.02em;
  font-size: 1.02rem;
  margin: 1.6rem 0 0.7rem;
  padding-bottom: 0.3rem;
  color: var(--color-white-conductor);
  border-bottom: 1px solid rgba(255, 255, 255, 0.14);
}
.isupd-markdown :deep(h3) { font-size: 0.96rem; font-weight: 600; margin: 1.3rem 0 0.5rem; color: var(--color-white-conductor); }
.isupd-markdown :deep(h4) { font-size: 0.88rem; font-weight: 600; margin: 1rem 0 0.4rem; color: var(--color-white-muted); }

/* ─── THE CRYSTRALINE ROTATION (U1 · FROM RED, keyed on the parsed C-number) ─────────────────────────
   Each Crystraline header wears its own spectrum variable — the tagger derives the spectrum from the
   header's OWN text (D9 Law 1: derived, never hand-picked, never positional). C1 red · C2 orange ·
   C3 yellow · C4 green · C5 blue · C6 purple · C7 fuchsia · C8 red · C9 orange. D4 crisp complement
   shadow (0.5px 0.5px 0 · alpha 0.7) realized through the +3-spectrum complement law (C885) via
   color-mix — token-derived, so a re-hue through hifiConfig.json moves the shadow with it (D9 Law 2).
   The nested <strong> inside the C5 header inherits the color — the whole header is one treatment. */
.isupd-markdown :deep(h3[data-crystraline]) {
  padding-left: 0.6rem;
  border-left: 3px solid var(--crst);
  color: var(--crst);
  text-shadow: 0.5px 0.5px 0 color-mix(in srgb, var(--crst-comp) 70%, transparent);
}
.isupd-markdown :deep(h3[data-crystraline="red"])     { --crst: var(--color-red);     --crst-comp: var(--color-green); }
.isupd-markdown :deep(h3[data-crystraline="orange"])  { --crst: var(--color-orange);  --crst-comp: var(--color-blue); }
.isupd-markdown :deep(h3[data-crystraline="yellow"])  { --crst: var(--color-yellow);  --crst-comp: var(--color-purple); }
.isupd-markdown :deep(h3[data-crystraline="green"])   { --crst: var(--color-green);   --crst-comp: var(--color-fuchsia); }
.isupd-markdown :deep(h3[data-crystraline="blue"])    { --crst: var(--color-blue);    --crst-comp: var(--color-red); }
.isupd-markdown :deep(h3[data-crystraline="purple"])  { --crst: var(--color-purple);  --crst-comp: var(--color-orange); }
.isupd-markdown :deep(h3[data-crystraline="fuchsia"]) { --crst: var(--color-fuchsia); --crst-comp: var(--color-yellow); }

/* ─── THE SUITE-COLORING LAW (U3) · the §4 Suite table rows, tagged by the parsed Suite NAME ─────────
   Rows 1-7 wear their OWN variable — the index cell's rule in the base color, the name cell's text in
   -light for contrast (D1 five-variant cascade · D9 Law 3 legibility). Row 0 Base stays in the neutral
   register: --color-base is near-black on a near-black board — Base BACKS the cascade, it does not
   color (the MARKED neutral, D9 Law 3). */
.isupd-markdown :deep(tr[data-suite])           { --suite: var(--color-white-muted); --suite-text: var(--color-white-conductor); }
.isupd-markdown :deep(tr[data-suite="red"])     { --suite: var(--color-red);     --suite-text: var(--color-red-light); }
.isupd-markdown :deep(tr[data-suite="orange"])  { --suite: var(--color-orange);  --suite-text: var(--color-orange-light); }
.isupd-markdown :deep(tr[data-suite="yellow"])  { --suite: var(--color-yellow);  --suite-text: var(--color-yellow-light); }
.isupd-markdown :deep(tr[data-suite="green"])   { --suite: var(--color-green);   --suite-text: var(--color-green-light); }
.isupd-markdown :deep(tr[data-suite="blue"])    { --suite: var(--color-blue);    --suite-text: var(--color-blue-light); }
.isupd-markdown :deep(tr[data-suite="purple"])  { --suite: var(--color-purple);  --suite-text: var(--color-purple-light); }
.isupd-markdown :deep(tr[data-suite="fuchsia"]) { --suite: var(--color-fuchsia); --suite-text: var(--color-fuchsia-light); }
.isupd-markdown :deep(tr[data-suite] > td:first-child) { border-left: 3px solid var(--suite); font-weight: 700; color: var(--suite-text); }
.isupd-markdown :deep(tr[data-suite] > td:nth-child(2)) { color: var(--suite-text); font-weight: 600; letter-spacing: 0.02em; }

/* Tables · the Documentation sub-page's cell idiom; headers in the mono role (D6) as neutral chrome. */
.isupd-markdown :deep(table) { border-collapse: collapse; margin: 1rem 0; font-size: 0.84rem; }
.isupd-markdown :deep(th), .isupd-markdown :deep(td) { border: 1px solid rgba(255, 255, 255, 0.14); padding: 0.35rem 0.6rem; vertical-align: top; }
.isupd-markdown :deep(th) {
  font-family: var(--font-mono);
  font-size: 0.7rem;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  text-align: left;
  color: var(--color-white-muted);
  background: rgba(255, 255, 255, 0.03);
}

/* Body prose · off-white per D14 (the shipped .hifi-subtext-ground rule lifts p/li; these complete it). */
.isupd-markdown :deep(p) { margin: 0.7rem 0; }
.isupd-markdown :deep(ul), .isupd-markdown :deep(ol) { margin: 0.7rem 0; padding-left: 1.5rem; }
.isupd-markdown :deep(li) { margin: 0.3rem 0; }
.isupd-markdown :deep(li)::marker { color: var(--color-white-muted); }
.isupd-markdown :deep(strong) { color: var(--color-white-conductor); }
.isupd-markdown :deep(a) { color: var(--color-blue-light); text-decoration-color: color-mix(in srgb, var(--color-blue) 50%, transparent); }
.isupd-markdown :deep(code) { font-family: var(--font-mono); font-size: 0.86em; }
.isupd-markdown :deep(:not(pre) > code) { background: rgba(255, 255, 255, 0.06); padding: 0.05em 0.35em; border-radius: 3px; }
.isupd-markdown :deep(pre) {
  padding: 0.75rem 0.9rem;
  margin: 1rem 0;
  border-radius: 6px;
  background: rgba(0, 0, 0, 0.35);
  border-left: 3px solid rgba(255, 255, 255, 0.12);
  font-family: var(--font-mono);
  font-size: 0.78rem;
  line-height: 1.45;
}
.isupd-markdown :deep(blockquote) { margin: 1rem 0; padding: 0.4rem 0.9rem; background: rgba(255, 255, 255, 0.03); border-left: 3px solid rgba(255, 255, 255, 0.18); }
.isupd-markdown :deep(hr) { border: none; height: 1px; background: rgba(255, 255, 255, 0.12); margin: 1.2rem 0; }

/* ─── THE DIFF in the same register (U5 · U9) ─────────────────────────────────────────────────────────
   Per-line SOURCE numbers from the parsed @@ hunk header ride the same gutter column as the viewer.
   del/ins are the red anor green VARIABLES through color-mix (D1 · D9 Law 2 — the old rgba literals
   would desync from a re-hue; the green never had a token behind it). The hunk header is MARKED neutral
   chrome (D9 Law 3) over a D8 hairline divider. The escape-first order in renderedDiff is unchanged. */
.isupd-diff-body { padding: 0.75rem 0.9rem 0.9rem 3.6rem; font-size: 0.82rem; line-height: 1.5; white-space: pre-wrap; word-break: break-word; }
.isupd-diff-body :deep(.isdiff-line) { min-height: 1.2em; }
.isupd-diff-body :deep(.isdiff-hunk) {
  margin: 0.8rem 0 0.3rem;
  padding: 0.2rem 0 0.15rem 0.5rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  color: var(--color-white-muted);
  font-size: 0.72rem;
  letter-spacing: 0.02em;
}
.isupd-diff-body :deep(.isdiff-del) {
  background: color-mix(in srgb, var(--color-red) 22%, transparent);
  color: var(--color-red-light);
  text-decoration: line-through;
  text-decoration-color: color-mix(in srgb, var(--color-red-light) 70%, transparent);
  padding: 0 2px;
  border-radius: 2px;
}
.isupd-diff-body :deep(.isdiff-ins) {
  background: color-mix(in srgb, var(--color-green) 22%, transparent);
  color: var(--color-green-light);
  text-decoration: none;
  padding: 0 2px;
  border-radius: 2px;
}
</style>
