// scpStatusPip.model.ts — THE STATUS PIP's pure classification + presentation law (C958).
//
// THE GAP THIS CLOSES: the SCP's crash/health FACT has always been served
// (`/scp-status/:scpName` · the TOH-7 relay) but only ever RENDERED inside the standby overlay,
// which exists ONLY during a turn-over. A crashed SCP that is not mid-turn-over had nowhere to
// say so. The pip is the persistent seat for that fact on the always-mounted dock (TaskBar.vue).
//
// THIS FILE IS PURE — no fetch, no DOM, no Vue import. The I/O (the poll, the overlay DOM probe,
// the interval + its onUnmounted cleanup) lives in TaskBar.vue; everything decidable is decided
// here so it is trivially testable in isolation. Same seam-shape as toolbarRegistration.model.ts.
//
// ABSENCE IS A STATE — the governing law of this file. `unknown` is the default AND the
// failed-fetch state AND the no-origin state. There is NO code path into `healthy` or `crashed`
// that does not carry a parsed fact from an `res.ok` answer: silence is NEVER a crash claim
// (the verbatim discipline of bridgeStandbyOverlay.model.ts's own pollCrashFact), and absence is
// never a false green.

/** The four render states. `restarting` is overlay-keyed, never fact-keyed (see classifyScpStatus). */
export type ScpStatusPipState = 'unknown' | 'healthy' | 'crashed' | 'restarting';

/**
 * WHY the pip is `unknown` — a declining guard must always say why (never a silent muted dot).
 * Carried into the hover readout so a dim pip is diagnosable without opening a console.
 */
export type ScpStatusPipDeclineReason =
  /** `originEndpoint` absent from /scp-config — an older citizen that publishes no origin.
   *  The pip renders `unknown` and NEVER polls: there is no endpoint to dial. */
  | 'no-origin'
  /** Mounted; the first tick has not landed yet. Never a green head-start. */
  | 'not-yet-polled'
  /** fetch() threw, or `res.ok === false` — the origin CLI is down/mid-write/unreachable.
   *  Indistinguishable from a hard crash by design; we decline rather than guess. */
  | 'fetch-failed'
  /** `res.ok` but the fact carries a `state` this build does not recognize. */
  | 'unrecognized'
  /** No decline in force (the state is healthy/crashed/restarting). */
  | null;

/**
 * The wire shape of `/scp-status/:scpName`'s answer, read structurally rather than imported:
 * `ScpStatusFact` is declared bridge-side (scpCrashState.model.ts, in the CLI package), which the
 * SCP template does not depend on. Every field is optional — an older origin CLI may answer less.
 */
export interface ScpStatusFactShape {
  state?: string;
  signature?: string;
  excerpt?: string[];
  detectedAt?: number;
}

/**
 * THE POLL CADENCE. 5000ms: the overlay's own crash poll runs at 1000ms, but that cadence is
 * bought by transience (the overlay lives for seconds). The pip's poll is permanent — every page,
 * every tab, every session — so it trades ≤5s of crash-detection lag for a twentieth of the load.
 * A named constant so a later cycle can retune it without re-reading the blueprint.
 */
export const SCP_STATUS_PIP_POLL_MS = 5000;

/**
 * THE CLASSIFIER — the whole verdict, as one pure function.
 *
 * @param fact          the parsed `/scp-status` answer, or null (never polled · failed · declined)
 * @param overlayPresent  whether `#bridge-turn-over-standby` is in the DOM right now
 *
 * ORDER IS LOAD-BEARING: `overlayPresent` is checked FIRST. While the standby overlay is mounted
 * it owns the crash verdict (it has its own 1s poll and renders the signature + boot tail); the
 * pip must not race it and show the user two disagreeing answers on one screen. This is
 * render-authority deduplication — TaskBar.vue additionally skips the FETCH on such a tick.
 */
export function classifyScpStatus(
  fact: ScpStatusFactShape | null,
  overlayPresent: boolean,
): ScpStatusPipState {
  if (overlayPresent) return 'restarting';
  if (!fact) return 'unknown';
  if (fact.state === 'crashed') return 'crashed';
  if (fact.state === 'not-crashed') return 'healthy';
  return 'unknown';
}

/** The per-state presentation law — label, color, accent, glyph. */
export interface ScpStatusPipPresentation {
  /** The uppercase word the hover readout leads with. */
  label: string;
  /** The dot/glyph color. */
  color: string;
  /** The glow/halo tint (crashed pairs the TOH-7 red title with its amber subtitle). */
  accent: string;
  /** Font Awesome class — the health idiom, distinct from the dock's shield/khanda/bolt family. */
  glyph: string;
}

/**
 * THE COLOR LAW — every value below is an EXACT reuse of a register this dock already ships.
 * The pip invents no new color:
 *   healthy    rgb(19, 213, 148)         the Shield/A viridian (GitmStableAButton.vue:323 ·
 *                                        GitmTurnOverAButton.vue:173) — the dock's own "stable".
 *   crashed    rgba(248, 113, 113, .95)  TOH-7's crash title + rgba(251, 146, 60, .9) its amber
 *                                        subtitle (bridgeStandbyOverlay.model.ts:376,382) — a user
 *                                        who has seen a crashed overlay recognizes the pip at once.
 *   restarting rgb(68, 150, 255)         the standby timer's blue (…overlay.model.ts:140).
 *   unknown    rgba(148, 163, 184, …)    the overlay's own muted/recede tone (…:354) — dim, and
 *                                        emphatically NOT green.
 */
export const SCP_STATUS_PIP_PRESENTATION: Record<ScpStatusPipState, ScpStatusPipPresentation> = {
  unknown: {
    label: 'STATUS UNKNOWN',
    color: 'rgba(148, 163, 184, 0.72)',
    accent: 'rgba(148, 163, 184, 0.35)',
    glyph: 'fa-solid fa-heart-pulse',
  },
  healthy: {
    label: 'HEALTHY',
    color: 'rgb(19, 213, 148)',
    accent: 'rgba(19, 213, 148, 0.45)',
    glyph: 'fa-solid fa-heart-pulse',
  },
  crashed: {
    label: 'SERVER CRASHED',
    color: 'rgba(248, 113, 113, 0.95)',
    accent: 'rgba(251, 146, 60, 0.9)',
    glyph: 'fa-solid fa-heart-crack',
  },
  restarting: {
    label: 'RESTARTING',
    color: 'rgb(68, 150, 255)',
    accent: 'rgba(68, 150, 255, 0.45)',
    glyph: 'fa-solid fa-heart-pulse',
  },
};

/** The recovery lever, named once so the crashed readout and any future teaching copy agree. */
export const SCP_STATUS_PIP_RECOVERY_HINT =
  'press the fuchsia Hard Turn Over at the right of this dock to restart it';

/**
 * THE READOUT — the hover string, built pure so the actionable copy is testable.
 *
 * A crashed pip is ACTIONABLE, not decorative: it names the crash signature AND the lever that
 * recovers (the Hard Turn Over — the sanctioned recovery, structurally independent of the A/B
 * state that can leave Turn Over A disabled). A DECLINING pip says WHY it declined — a guard that
 * refuses to poll must never present as an unexplained dim dot.
 */
export function scpStatusPipReadout(
  scpName: string,
  state: ScpStatusPipState,
  fact: ScpStatusFactShape | null,
  reason: ScpStatusPipDeclineReason,
): string {
  const who = scpName.length > 0 ? scpName : 'THIS SCP';
  const head = `${who} · ${SCP_STATUS_PIP_PRESENTATION[state].label}`;
  switch (state) {
    case 'crashed': {
      const signature = fact?.signature && fact.signature.length > 0
        ? fact.signature
        : 'THE BUILD DID NOT RETURN';
      return `${head} · ${signature} · ${SCP_STATUS_PIP_RECOVERY_HINT}`;
    }
    case 'healthy':
      return `${head} · the origin CLI reports not-crashed`;
    case 'restarting':
      return `${head} · a turn-over is in flight — the standby overlay holds the verdict`;
    default:
      return `${head} · ${declineExplanation(reason)}`;
  }
}

/** The WHY behind a dim pip — one honest sentence per decline reason. */
export function declineExplanation(reason: ScpStatusPipDeclineReason): string {
  switch (reason) {
    case 'no-origin':
      return 'this SCP publishes no originEndpoint (an older build) — there is no /scp-status to poll, so the pip declines rather than guess';
    case 'fetch-failed':
      return 'the origin CLI did not answer this tick — unreachable is NEVER reported as a crash';
    case 'unrecognized':
      return 'the origin CLI answered with a state this build does not recognize';
    case 'not-yet-polled':
    default:
      return 'no reading has landed yet';
  }
}
