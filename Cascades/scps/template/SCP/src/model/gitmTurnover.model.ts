/**
 * GitM Turn-Over Failsafe Model (#641-R W5 · HAZARD-5 byte-match single source)
 *
 * The SINGLE source of the GITM_TURNOVER_KEY localStorage contract, byte-imported by
 * BOTH the writer (GitmTurnOverBButton.vue) AND the reader (webSocketClient.principle.ts
 * close handler). One definition, never two — the localStorage shape can never drift
 * (S4 Green HAZARD 5 · S3 Yellow Blueprint §W5-step-1).
 *
 * When the user turns over to B, the B button writes GITM_TURNOVER_KEY BEFORE dispatching
 * the MCP turn-over. The close handler reads it to distinguish an A↔B turn-over
 * (deadline-armed) from a normal restart (unbounded ping). TOH-6 · THE AGENCY CURE: the
 * deadline is INFORMATIONAL ONLY — when GITM_TURNOVER_DEADLINE_MS elapses without a boot,
 * the timer re-words the standby to the neutral 'b-still-rebuilding' message and nothing
 * else. No revert, no turn-over, ever fires on this clock — THE BENEFIT OF THE DOUBT
 * BELONGS TO THE USER; Turn Over on A is their button, from the dock.
 *
 * Citation: webSocketClient.principle.ts (the verbatim L39-59 it replaces).
 * Citation: GITM-AB-R-S3-YELLOW-BLUEPRINT.md §W5-step-1 + §W6a.
 */

// The localStorage key the B button writes + the close handler reads.
export const GITM_TURNOVER_KEY = 'gitm_turnover_in_progress';

// The client watch window. 45s — INFORMATIONAL PACING ONLY (D-TOH TOH-6 · the agency cure):
// nothing fires when it elapses; the WS-close deadline timer only swaps the standby to the
// neutral 'b-still-rebuilding' wording while the ping loop keeps waiting. HELD at 45s by
// judgment: the TOH-5 field showed a healthy ~77s boot, so 45s is no longer a failure floor —
// it is 45s of quiet patience before the honest 'taking a while' note; earlier would nag every
// healthy fast boot, later would leave a long boot wordless. Time proves nothing.
export const GITM_TURNOVER_DEADLINE_MS = 45_000;

export type GitmTurnoverProgress = {
  // SORD Shield/Sword (Macro Diamond) — the source is now 'A' OR 'B'. A Shield-A turn-over
  // (return/recovery to stable A) writes source:'A'; a Sword-B turn-over (carry onto B) writes
  // source:'B'. TOH-6 — the WS-close deadline is informational-only for either source.
  source: 'A' | 'B';
  deadline: number; // Date.now() + GITM_TURNOVER_DEADLINE_MS (set at write time by the button)
  stableA: string; // the stableBranch name at turn-over time
  bridgeEndpoint: string; // the outer SCS-Bridge /mcp base (reachable while the SCP is down)
  // D-T-REVERT (Cycle 270 · user semantics): when an A turn-over fires FROM the working B (the
  // revert), the client RESUMES on B after A boots — the ping-success seam fires
  // gitm_branch_switch to this branch (nodemon watches only .bridge-restart.json, so the
  // re-checkout does NOT restart the server: A keeps running while the tree sits on B).
  resumeToB?: string;
  // SORD Shield/Sword (D5/TVOS) — the overlay variant the WS-close handler re-shows across the
  // respawn gap so the SAME visual continues after the restart tears the connection down. Absent
  // ⇒ the close handler falls back to the plain 'turn-over' overlay.
  overlayVariant?: 'shield-a' | 'sword-b';
  // C639 · THE STICKY EXPRESSION — the turn-over CLASS rides the marker so EVERY re-show
  // (the WS-close re-assert · the post-reload connect gap) lands the same register the
  // trigger declared. Absent ⇒ the show derives from the mode (legacy · shield).
  turnClass?: 'shield' | 'sword' | 'sparks';
  // BOOT-STREAM (standby live tail) — THIS SCP's own name (GET /scp-config · getScpName), captured
  // at turn-over-write time. The standby overlay polls `${bridgeEndpoint}/scp-boot-log/${scpName}`
  // to tail the re-booting SCP's boot log across the respawn gap. Absent ⇒ no live tail (the
  // overlay still shows; the stream div stays empty).
  scpName?: string;
};

// TOH-12 · THE SOVEREIGN-IDENTITY SCOPE: the carrier key is scoped by this SCP's own name
// (scpIdentityStorage.model — synchronous, outage-surviving), so a recycled port's next
// tenant never reads a prior tenant's turn-over carrier. Reads fall back to the bare
// legacy key (a carrier written pre-scope stays honored); clears remove both.
import {
  readScopedWithLegacyFallback,
  removeScopedAndLegacy,
  scpScopedStorageKey,
} from './scpIdentityStorage.model';

// Read + parse the turn-over progress key (null when absent or malformed).
export const readGitmTurnoverProgress = (): GitmTurnoverProgress | null => {
  if (typeof localStorage === 'undefined') return null;
  const raw = readScopedWithLegacyFallback(GITM_TURNOVER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as GitmTurnoverProgress;
  } catch {
    return null;
  }
};

// SORD Shield/Sword — the single write helper the turn-over buttons call BEFORE firing the SORD
// anchor. Byte-match single source (HAZARD-5): the buttons never hand-roll the localStorage write,
// so the shape the WS-close handler reads can never drift from what the button wrote.
export const writeGitmTurnoverProgress = (p: GitmTurnoverProgress): void => {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(scpScopedStorageKey(GITM_TURNOVER_KEY), JSON.stringify(p));
  } catch {
    /* localStorage unavailable — the turn-over still fires, just without the informational deadline/variant */
  }
};

// TOH-12 · the single clear helper — removes the scoped AND the bare legacy carrier, so a
// consumed turn-over never survives under either name. The WS-close handler's two
// removeItem sites route through THIS, never a hand-rolled removeItem.
export const clearGitmTurnoverProgress = (): void => {
  removeScopedAndLegacy(GITM_TURNOVER_KEY);
};
