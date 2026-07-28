/**
 * bridgeOwnedDeadline Model · GITM Dev Epoch (MD-E · THE C318 FOLD · THE BRIDGE-OWNED DEADLINE)
 *
 * The FLOOR under the C300 Observed Seat Return. gitmBootReportWatch OBSERVES A's boot and returns
 * the seat to B (the awareness layer · the C319 pulse is the client-side awareness); this model is
 * the deadline that fires when NO boot-report arrives at all. Composed WITH the seat-return arm — the
 * turn-over quality arms BOTH (armSeatReturn + armDeadline) on a source:'A' turn-over that carried a
 * working B; the boot-report watcher disarms BOTH when a report arrives (either branch); a new
 * turn-over re-arms (overwrites). The boot-report principle's standing beat checks isDeadlinePassed()
 * each tick and, when true, dispatches gitmRevertToStable via the live handle + stamps the outcome.
 *
 * WHY module-scope + PURE (no Stratimux imports · mirror seatReturnArm.model / gitmExec.model): the
 * Doer is the WATCHER (the principle's beat); this model is only the latch it reads. Single slot —
 * one deadline at a time (re-arm overwrites · a later A turn-over supersedes an earlier pending one).
 *
 * THE SEAT-LAW COMPOSITION (do NOT break it): the deadline is a SUPERSET of the seat-return arm's
 * lifetime — armed alongside it, disarmed alongside it. It NEVER fires when the seat-return already
 * fired (the boot-report disarms both before the deadline elapses). The revert is the failure floor,
 * NOT the success path.
 *
 * Citation: DIAMOND-GITM-DEVELOPER-EPOCH.md MD-E FOLD (C318) · seatReturnArm.model.ts (single-slot
 *   arm discipline) · gitmRevertToStable.quality.ts (the failsafe the deadline dispatches).
 */

// The bridge-owned deadline window. 45s — the RD FLOOR (long enough that a healthy SCP boot +
// boot-report always beats it; short enough that a dead boot reverts before the user is stranded).
export const BRIDGE_DEADLINE_MS = 45_000;

export type BridgeDeadlineArm = {
  armedAt: number; // Date.now() at arm time — isDeadlinePassed compares against BRIDGE_DEADLINE_MS
  stableBranch: string; // A — the branch the boot-report must show; carried for the revert stamp
};

// Single slot · module-scope. null = disarmed (no A-prove in flight ANOR the boot was observed).
let deadlineSlot: BridgeDeadlineArm | null = null;

/** Arm the deadline (re-arm OVERWRITES the single slot). Called alongside armSeatReturn. */
export function armDeadline(stableBranch: string): void {
  deadlineSlot = { armedAt: Date.now(), stableBranch };
}

/** Disarm — the boot-report arrived (either branch) ANOR the revert has fired. Called alongside disarmSeatReturn. */
export function disarmDeadline(): void {
  deadlineSlot = null;
}

/** Read the current deadline arm (null = disarmed). */
export function readDeadlineArm(): BridgeDeadlineArm | null {
  return deadlineSlot;
}

/**
 * True when a deadline is armed AND its window has elapsed (now − armedAt > BRIDGE_DEADLINE_MS).
 * The boot-report principle's beat checks this each tick; on true it disarms + reverts + stamps.
 * @param now injectable clock (Date.now() default · fixture-testable without a timer).
 */
export function isDeadlinePassed(now: number = Date.now()): boolean {
  if (!deadlineSlot) return false;
  return now - deadlineSlot.armedAt > BRIDGE_DEADLINE_MS;
}
