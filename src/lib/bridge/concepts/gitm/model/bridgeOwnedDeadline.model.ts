/**
 * bridgeOwnedDeadline Model · GITM Dev Epoch (MD-E · THE C318 FOLD · THE BRIDGE-OWNED DEADLINE)
 *
 * The INFORMATIONAL CLOCK under the C300 Observed Seat Return. gitmBootReportWatch OBSERVES A's
 * boot and returns the seat to B (the awareness layer · the C319 pulse is the client-side
 * awareness); this model is the watch window that INFORMS when NO boot-report has yet arrived.
 * Composed WITH the seat-return arm — the turn-over quality arms BOTH (armSeatReturn + armDeadline)
 * on a source:'A' turn-over that carried a working B; the boot-report watcher disarms BOTH when a
 * report arrives (either branch); a new turn-over re-arms (overwrites). The boot-report principle's
 * standing beat checks isDeadlinePassed() each tick and, when true, logs + stamps a NEUTRAL note.
 *
 * D-TOH TOH-6 · THE AGENCY CURE (the user's ruling): THE BENEFIT OF THE DOUBT BELONGS TO THE USER.
 * The AUTO-REVERT is RETIRED — the elapsed window NEVER fires gitmRevertToStable (nor any
 * turn-over); a long boot may be a large SCP honestly recompiling (the TOH-5 field: ~77s healthy
 * boot vs the 45s window). Turning over on A is the user's button; this clock only informs.
 *
 * WHY module-scope + PURE (no Stratimux imports · mirror seatReturnArm.model / gitmExec.model): the
 * Doer is the WATCHER (the principle's beat); this model is only the latch it reads. Single slot —
 * one deadline at a time (re-arm overwrites · a later A turn-over supersedes an earlier pending one).
 *
 * THE SEAT-LAW COMPOSITION (do NOT break it): the deadline is a SUPERSET of the seat-return arm's
 * lifetime — armed alongside it, disarmed alongside it. It NEVER notes when the seat-return already
 * fired (the boot-report disarms both before the deadline elapses).
 *
 * Citation: DIAMOND-GITM-DEVELOPER-EPOCH.md MD-E FOLD (C318) · seatReturnArm.model.ts (single-slot
 *   arm discipline) · gitmRevertToStable.quality.ts (the failsafe the deadline dispatches).
 */

// The bridge-owned watch window. 45s — INFORMATIONAL PACING ONLY (D-TOH TOH-6 · the agency cure):
// nothing fires when it elapses; the beat logs gitm.deadline.expired-informational + stamps a
// neutral 'may still be rebuilding' note on the origin's rail. HELD at 45s by judgment: the TOH-5
// field showed a healthy ~77s boot, so 45s is no longer a floor claim — it is 45s of quiet
// patience before the honest 'taking a while' note; earlier would nag every healthy fast boot,
// later would leave a long boot wordless. Time proves nothing — the note never claims failure.
export const BRIDGE_DEADLINE_MS = 45_000;

export type BridgeDeadlineArm = {
  armedAt: number; // Date.now() at arm time — isDeadlinePassed compares against BRIDGE_DEADLINE_MS
  stableBranch: string; // A — the branch the boot-report must show; carried for the revert stamp
  // D-TOH H1 · THE DEADLINE ORIGIN-THREADING (THE NAME-FIRST LAW): the SCP NAME the arming
  // turn-over operated on (scp.config.json identity — the SAME name the boot report carries).
  // THE NAME is the arm's identity; the informational note lands on ITS rail (TOH-6 — nothing
  // fires). '' = a legacy/no-identity arm — the note SKIPS with a named sink rather than falling
  // to the pointer (the severed fall-through IS the wound).
  originScpName: string;
};

// Single slot · module-scope. null = disarmed (no A-prove in flight ANOR the boot was observed).
let deadlineSlot: BridgeDeadlineArm | null = null;

/** Arm the deadline (re-arm OVERWRITES the single slot). Called alongside armSeatReturn.
 * D-TOH H1 — the arm carries THE NAME of the SCP the turn-over operated on. */
export function armDeadline(stableBranch: string, originScpName: string): void {
  deadlineSlot = { armedAt: Date.now(), stableBranch, originScpName };
}

/** Disarm — the boot-report arrived (either branch) ANOR the informational note has fired. Called alongside disarmSeatReturn. */
export function disarmDeadline(): void {
  deadlineSlot = null;
}

/**
 * D-TOH H1 · THE KEYED DISARM (THE NAME-FIRST LAW): disarm ONLY when the observed boot/turn-over
 * belongs to THE ARMED ORIGIN. A foreign observation leaves the arm STANDING (the old any-report
 * disarm silently killed a legitimate deadline). Legacy tolerance: an arm without a name ANOR an
 * observation without a name disarms (old bridges/reports keep working). Returns true when the
 * slot was disarmed; false when a foreign observation left it standing (the caller sinks it).
 */
export function disarmDeadlineFor(observedScpName: string): boolean {
  if (deadlineSlot === null) return true; // nothing armed — vacuously disarmed
  if (
    deadlineSlot.originScpName !== '' &&
    observedScpName !== '' &&
    observedScpName !== deadlineSlot.originScpName
  ) {
    return false; // foreign observation — the arm stands
  }
  deadlineSlot = null;
  return true;
}

/** Read the current deadline arm (null = disarmed). */
export function readDeadlineArm(): BridgeDeadlineArm | null {
  return deadlineSlot;
}

/**
 * True when a deadline is armed AND its window has elapsed (now − armedAt > BRIDGE_DEADLINE_MS).
 * The boot-report principle's beat checks this each tick; on true it disarms + logs + stamps the
 * neutral informational note (TOH-6 — nothing fires).
 * @param now injectable clock (Date.now() default · fixture-testable without a timer).
 */
export function isDeadlinePassed(now: number = Date.now()): boolean {
  if (!deadlineSlot) return false;
  return now - deadlineSlot.armedAt > BRIDGE_DEADLINE_MS;
}
