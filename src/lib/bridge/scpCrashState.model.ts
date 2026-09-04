/**
 * scpCrashState.model · TOH-7 · THE CRASH-STATE RELAY (the fact half).
 *
 * THE WOUND (D-TOH · C924-C951): an SCP's server dies and **nodemon survives**, printing
 * `[nodemon] app crashed - waiting for file changes before starting...`. The lane's process tree
 * therefore looks HEALTHY — the CLI's `child.on('exit')` never fires (the child it holds is the
 * lane wrapper, not the server) — while the SCP client polls a port that will never answer. The
 * user is left with a ticking timer and ZERO information. The process tree LIES BY STAYING ALIVE;
 * the server's own STD is the only witness, and the CLI already drains it per SCP name
 * (`scpSpawnManagerSpawnRequested.quality.ts` STDIO-DLF → `appendScpBootLogLine`).
 *
 * THE FACT, NEVER THE CLOCK (TOH-6's Agency Cure, preserved): this module produces a BINARY fact —
 * `crashed` anor `not-crashed` — from evidence only. No timer, no inference, no third value. The
 * word FAILED may be spoken by any surface ONLY while this fact reads `crashed`.
 *
 * TWO SIGNAL CLASSES → ONE FACT:
 *   · Class A · LANE DEATH — the OS fact (`child.on('exit')` · a non-voluntary exit).
 *   · Class B · SERVER CRASH, LANE ALIVE — the `[nodemon] app crashed` line on the live drain.
 *     THE ACTUAL WOUND; text is the only witness.
 *
 * THE CLEAR-BACK: a fact that only ever SETS becomes a lie. The state returns to `not-crashed` on
 * fresh healthy evidence (a readiness probe success · a boot report landing · a restart beginning).
 * `detectedAt` is always carried so staleness is VISIBLE, never inferred.
 *
 * THE SEAT: `<scpBootLogPath(scpName)'s dir>/status.json` — the fact sits BESIDE the boot log that
 * witnessed it (`scp-boot-logs/<scpName>/`), so the log, the excerpt and the fact are one data
 * family at one address. It is NOT partitioned per CLI perspective: a given SCP is spawned by ONE
 * CLI (the user's standing practice · one lane per SCP), so the writer is single by construction —
 * and a fact split from its own evidence would be the harder thing to trust.
 */

import { writeFileSync, renameSync, readFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
// TOH-10 · step 5 · the stall's OPENING BRACKET — the only stamp that exists before the
// child speaks. Without it the pre-build stall (97 percent of a 7-minute turn-over) has no
// start time, and the timeline reads as a slow build rather than a starving machine.
import { recordScpRestartSignal } from './scpBootTiming.model';
import { scpBootLogPath } from './paths';
import { readScpBootLog } from './scpBootLog';
import { log } from './debugLog';

export type ScpCrashState = 'crashed' | 'not-crashed';

export type ScpStatusFact = {
  scpName: string;
  /** THE BINARY — the only two values that may ever be written. */
  state: ScpCrashState;
  /** When THIS state was established (ms epoch) — staleness is visible, never inferred. */
  detectedAt: number;
  /** Which signal produced it: the OS exit fact, the STD line, or the clearing evidence. */
  signal: 'lane-exit' | 'stdout-signature' | 'healthy-boot' | 'restart-begun' | 'recovered-from-log';
  /** The matched signature text (Class B) anor the exit description (Class A) — '' when clear. */
  signature: string;
  /** The last lines around the detection — what the user actually needs to see. */
  excerpt: string[];
};

/**
 * THE SIGNATURE SET — OURS, not a guess. Every entry is a line this set-up genuinely emits.
 * `[nodemon] app crashed` is the PRIME (the user's own naming): nodemon prints it verbatim as
 * `[nodemon] app crashed - waiting for file changes before starting...` when the server process
 * exits non-zero while the lane stays alive.
 */
export const CRASH_SIGNATURES: readonly string[] = [
  '[nodemon] app crashed',
];

/**
 * The DOWN-not-crashed sibling. `[nodemon] clean exit - waiting for changes before restart` is the
 * line the C924 storm ended on (AmberlightStudio left down): the server exited ZERO and the lane
 * waits. It is NOT a crash — but it IS a server that will never answer the client's poll, so it is
 * recorded as its own signal while the binary stays honest.
 */
export const QUIESCENT_SIGNATURES: readonly string[] = [
  '[nodemon] clean exit',
];

/**
 * C1008 · THE RECOVERY SIGNATURES — the clear-back half of the pair.
 *
 * THE WOUND: `status.json` could be written `crashed` from the stdout stream but had NO path back
 * to healthy on that same stream. The ONLY `clearScpCrashState(…, 'healthy-boot')` lived inside
 * `probeReadiness(...).then(...)`, and `probeReadiness` is called from exactly ONE place — the
 * SPAWN quality. **A turn-over never spawns a lane** (nodemon restarts its child in place), so on
 * the path the user takes most, the one mechanism that could say "recovered" was unreachable.
 * Field-measured: crash recorded 21:23:39, server answered HTTP 200 at 21:25:55, and the indicator
 * still read SERVER CRASHED because the fact file was never rewritten.
 *
 * THE SHAPE OF THE BUG: many ways in, one way out — and the one way out behind a door this path
 * does not use. The cure is SYMMETRY: the stream that can set the fact must also be able to clear
 * it.
 *
 * WHY THESE LINES: taken from the timing instrument's own `server-listening` matcher
 * (`scpBootTiming.model.ts:120`) so ONE vocabulary decides "the server is up" for both the clock
 * and the crash fact. Two detectors disagreeing about what "up" means is its own future bug.
 */
export const RECOVERY_SIGNATURES: readonly string[] = [
  'Running on http',
  'Server running on http',
];

/** The recovery twin of `matchCrashSignature`. */
export function matchRecoverySignature(line: string): string | null {
  for (const sig of RECOVERY_SIGNATURES) {
    if (line.includes(sig)) return sig;
  }
  return null;
}

export function matchCrashSignature(line: string): string | null {
  for (const sig of CRASH_SIGNATURES) {
    if (line.includes(sig)) return sig;
  }
  return null;
}

export function matchQuiescentSignature(line: string): string | null {
  for (const sig of QUIESCENT_SIGNATURES) {
    if (line.includes(sig)) return sig;
  }
  return null;
}

export function scpStatusPath(scpName: string): string {
  return join(dirname(scpBootLogPath(scpName)), 'status.json');
}

function writeFact(fact: ScpStatusFact): void {
  try {
    const path = scpStatusPath(fact.scpName);
    const dir = dirname(path);
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    // The atomic tmp+rename law. The tmp name carries the pid so two CLI perspectives writing the
    // same SCP's fact can never consume each other's tmp (the MD-4 P1 ENOENT class).
    const tmp = `${path}.tmp.${process.pid}`;
    writeFileSync(tmp, JSON.stringify(fact, null, 2) + '\n', 'utf8');
    renameSync(tmp, path);
  } catch (err) {
    log('scp.crashstate.write.skip', { scpName: fact.scpName, reason: String(err) });
  }
}

/** The last-known fact for an SCP — absent file ⇒ null (ABSENCE IS A STATE, never a false clear). */
export function readScpStatusFact(scpName: string): ScpStatusFact | null {
  try {
    const raw = readFileSync(scpStatusPath(scpName), 'utf8');
    const parsed = JSON.parse(raw) as Partial<ScpStatusFact>;
    if (parsed && (parsed.state === 'crashed' || parsed.state === 'not-crashed')) {
      return parsed as ScpStatusFact;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * CLASS B · the live drain hook. Called for EVERY line the CLI already drains from an SCP's
 * stdout/stderr (per SCP name). Returns true when THIS line established a crash fact — so the
 * caller may act (telemetry · the fact-licensed restart) at the instant the silence ends.
 */
export function observeScpOutputLine(scpName: string, line: string): boolean {
  const crash = matchCrashSignature(line);
  if (crash !== null) {
    const prior = readScpStatusFact(scpName);
    if (prior?.state === 'crashed') return false; // already known — do not re-fire per repeated line
    writeFact({
      scpName,
      state: 'crashed',
      detectedAt: Date.now(),
      signal: 'stdout-signature',
      signature: crash,
      excerpt: readScpBootLog(scpName, 12),
    });
    log('scp.crashstate.detected', { scpName, signature: crash, class: 'B-stdout' });
    return true;
  }
  // C1008 · THE CLEAR-BACK, on the SAME stream that sets the fact. This stdout belongs to the
  // long-lived nodemon process, which SURVIVES its own internal restarts — so this one seam covers
  // turn-overs, crash-restarts and spawns alike, where the spawn-time probe covered only spawns.
  //
  // RETURNS FALSE, ALWAYS. The caller reads a `true` as "a NEW crash was detected" and licenses a
  // restart on it (`requestFactLicensedRestart`). A recovery must never be mistaken for a crash —
  // returning true here would make a healthy boot trigger a restart, which is the opposite of the
  // cure and would loop.
  const recovery = matchRecoverySignature(line);
  if (recovery !== null) {
    const priorFact = readScpStatusFact(scpName);
    if (priorFact?.state === 'crashed') {
      // NO EXTRA LOG HERE. `clearScpCrashState` already emits `scp.crashstate.cleared` with the
      // prior signature and this signal — a second line would double-count one event.
      // AND THE NAME MATTERS: `scp.crashstate.recovered` is ALREADY TAKEN, by
      // `recoverScpCrashStateFromLog`, where it means "the crash RECORD was recovered from the log"
      // and WRITES state:'crashed'. That is the opposite of what happens here. Reusing it would
      // make one grep return two events with inverted meanings.
      clearScpCrashState(scpName, 'healthy-boot');
    }
    return false;
  }

  const quiescent = matchQuiescentSignature(line);
  if (quiescent !== null) {
    // NOT a crash — recorded as telemetry only. The binary is reserved for genuine crash evidence;
    // a clean exit that leaves the client polling is a SEPARATE card (the DOWN-not-crashed class).
    log('scp.crashstate.quiescent', { scpName, signature: quiescent });
  }
  return false;
}

/** CLASS A · the OS fact. A non-voluntary lane exit IS a crash fact — no text needed. */
export function observeScpLaneExit(
  scpName: string,
  exitCode: number | null,
  exitSignal: string | null,
  voluntary: boolean,
): void {
  if (voluntary) {
    writeFact({
      scpName,
      state: 'not-crashed',
      detectedAt: Date.now(),
      signal: 'healthy-boot',
      signature: '',
      excerpt: [],
    });
    return;
  }
  writeFact({
    scpName,
    state: 'crashed',
    detectedAt: Date.now(),
    signal: 'lane-exit',
    signature: `lane exit · code=${String(exitCode)} · signal=${String(exitSignal)}`,
    excerpt: readScpBootLog(scpName, 12),
  });
  log('scp.crashstate.detected', { scpName, exitCode, exitSignal, class: 'A-lane-exit' });
}

/**
 * THE CLEAR-BACK. Fresh healthy evidence returns the fact to `not-crashed`. Called on a readiness
 * probe success, a boot report landing, and at the beginning of a restart — the three moments the
 * system genuinely knows the prior crash is no longer the present truth.
 */
export function clearScpCrashState(
  scpName: string,
  signal: 'healthy-boot' | 'restart-begun',
): void {
  const prior = readScpStatusFact(scpName);
  if (prior?.state === 'not-crashed' && prior.signal === signal) return; // idempotent
  writeFact({
    scpName,
    state: 'not-crashed',
    detectedAt: Date.now(),
    signal,
    signature: '',
    excerpt: [],
  });
  if (signal === 'healthy-boot') {
    // A server that came back earns the licence again (the bound is CONSECUTIVE failures).
    resetFactLicensedRestarts(scpName);
  }
  if (prior?.state === 'crashed') {
    log('scp.crashstate.cleared', { scpName, from: prior.signature, signal });
  }
}

/**
 * THE RECOVERY PATH. A CLI that booted AFTER a crash never witnessed the line live — it reads the
 * tail of the per-SCP boot log once and recovers the fact it missed. Used by the status endpoint
 * when no fact file exists yet (absence ⇒ look, do not assume health).
 */
export function recoverScpCrashStateFromLog(scpName: string): ScpStatusFact {
  const tail = readScpBootLog(scpName, 40);
  for (let i = tail.length - 1; i >= 0; i -= 1) {
    const sig = matchCrashSignature(tail[i]);
    if (sig !== null) {
      const fact: ScpStatusFact = {
        scpName,
        state: 'crashed',
        detectedAt: Date.now(),
        signal: 'recovered-from-log',
        signature: sig,
        excerpt: tail.slice(Math.max(0, i - 8)),
      };
      writeFact(fact);
      log('scp.crashstate.recovered', { scpName, signature: sig });
      return fact;
    }
  }
  return {
    scpName,
    state: 'not-crashed',
    detectedAt: Date.now(),
    signal: 'recovered-from-log',
    signature: '',
    excerpt: [],
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// TOH-7 · BAND 4 · THE FACT-LICENSED RESTART
//
// THE MOTION: write `.bridge-restart.json` into the SCP PACKAGE dir. That file is the ONLY entry
// in the SCP's `nodemon.json` watch list — and a crashed nodemon is literally "waiting for file
// changes before starting", so the watched write is the exact key to its lock. Its `restart` event
// pkills the `scp-tag=$PWD` tree first, so no orphan survives the respawn.
//
// WHY NOT SIGUSR2 (the field law that outranks the obvious cure): C937 proved SIGUSR2 restarts a
// HEALTHY deaf lane — but C939 proved **a SIGUSR2 to a CHILDLESS nodemon TERMINATES it**, and a
// crashed lane is childless BY DEFINITION (its app is the thing that died). The signal that cures
// the deaf-watch wound would KILL the crash wound's lane. Never signal here; write the file.
//
// LOOPS ARE DESIGNED TO HALT: a build that crashes on every boot would otherwise be re-triggered
// forever. The licence is bounded — MAX_FACT_LICENSED_RESTARTS consecutive attempts per SCP with no
// intervening healthy boot; beyond it the CLI STOPS and leaves the fact standing so the overlay
// tells the user the truth instead of the machine thrashing. `clearScpCrashState('healthy-boot')`
// resets the counter — a server that came back earns the licence again.
// ─────────────────────────────────────────────────────────────────────────────

export const MAX_FACT_LICENSED_RESTARTS = 2;

const restartAttemptsByScp = new Map<string, number>();

export function resetFactLicensedRestarts(scpName: string): void {
  restartAttemptsByScp.delete(scpName);
}

export type FactLicensedRestartResult =
  | { fired: true; attempt: number }
  | { fired: false; reason: 'cap-reached' | 'no-scp-dir' | 'write-failed' };

export function requestFactLicensedRestart(
  scpName: string,
  scpDir: string,
  signature: string,
): FactLicensedRestartResult {
  if (typeof scpDir !== 'string' || scpDir.length === 0) {
    log('scp.crashstate.restart.skip', { scpName, reason: 'no-scp-dir' });
    return { fired: false, reason: 'no-scp-dir' };
  }
  const attempts = (restartAttemptsByScp.get(scpName) ?? 0) + 1;
  if (attempts > MAX_FACT_LICENSED_RESTARTS) {
    // The honest halt — the fact STANDS so the overlay keeps telling the truth.
    log('scp.crashstate.restart.skip', {
      scpName,
      reason: 'cap-reached',
      attempts: attempts - 1,
      cap: MAX_FACT_LICENSED_RESTARTS,
    });
    return { fired: false, reason: 'cap-reached' };
  }
  restartAttemptsByScp.set(scpName, attempts);
  // THE OPENING BRACKET for the relay's own leg — a fact-licensed restart is a turn-over the user
  // never clicked, and it must be as measurable as one they did.
  recordScpRestartSignal(scpName, 'fact-licensed-restart');
  try {
    const target = join(scpDir, '.bridge-restart.json');
    const payload = {
      at: Date.now(),
      source: 'crash-state-relay',
      reason: 'fact-licensed-restart',
      signature,
      attempt: attempts,
      scpName,
    };
    // The watched file is the signal; a plain write is what nodemon is waiting for.
    writeFileSync(target, JSON.stringify(payload, null, 2) + '\n', 'utf8');
    log('scp.crashstate.restart.fired', { scpName, attempt: attempts, signature, target });
    return { fired: true, attempt: attempts };
  } catch (err) {
    log('scp.crashstate.restart.skip', { scpName, reason: 'write-failed', error: String(err) });
    return { fired: false, reason: 'write-failed' };
  }
}
