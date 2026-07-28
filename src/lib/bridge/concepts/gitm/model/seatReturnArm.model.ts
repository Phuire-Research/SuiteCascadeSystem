/**
 * seatReturnArm Model · C300 · THE ONE-SHOT SEAT RETURN (CLAUSE 6 · the Observed Seat Return)
 *
 * The module-scope ARM the C300 seat law hands off to. RETIRES the setTimeout blind-return that
 * gitmTurnOverWithSource used to fire (a fixed ~1500ms guess at when the A-prove restart settled).
 * The setTimeout was a TIMING guess; the arm is an OBSERVATION latch — armed on a source:'A'
 * turn-over that carried a working B, DISARMED-then-checked-out by gitmBootReportWatch when the
 * SCP server's own boot-report shows activeBranch === stableBranch (A actually booted).
 *
 * Single slot (one active seat-return at a time · re-arm overwrites · a later A turn-over supersedes
 * an earlier pending one). PURE — no Stratimux imports (mirror gitmExec.model / gitmOpCwd.model
 * discipline: the model is fixture-testable without a muxium). The Doer is the WATCHER; this model
 * is only the latch it reads.
 *
 * Template: gitmConfirmToken.model.ts (module-scope single-slot arm · issue/validate seam).
 * Citation: PLAYTEST-AB-LAW-ROADMAP.md CLAUSE 6 · gitmTurnOverWithSource.quality.ts:347-371 (retired setTimeout).
 */

export type SeatReturnArm = {
  workingBranch: string; // B — the seat to return to once A is observed to have booted
  stableBranch: string; // A — the branch the SCP server's boot-report must show to fire the return
};

// Single slot · module-scope. null = disarmed (the seat is home ANOR no A-prove is in flight).
let armSlot: SeatReturnArm | null = null;

/** Arm the one-shot seat return (re-arm OVERWRITES the single slot). */
export function armSeatReturn(arm: SeatReturnArm): void {
  armSlot = { workingBranch: arm.workingBranch, stableBranch: arm.stableBranch };
}

/** Disarm — the seat is home (a source:'B' turn-over) ANOR the return has just fired. */
export function disarmSeatReturn(): void {
  armSlot = null;
}

/** Read the current arm (null = disarmed). The watcher reads this on every boot-report event. */
export function readSeatReturnArm(): SeatReturnArm | null {
  return armSlot;
}
