/**
 * scpBootTiming · THE TURN-OVER TIMING INSTRUMENT (TOH-10 · build-order step 5 · C961)
 *
 * THE WOUND THIS CLOSES (TOH10-L3, measured on the user's own 7-minute turn-over):
 *   trigger 15:40:24 → first build artifact 15:48:42 (+498s) → server listening 15:48:56 (+512s).
 *   THE BUILD+BOOT SPAN IS 14 SECONDS. 97% of the time is a PRE-BUILD STALL — and the stall is
 *   INVISIBLE, because the only record was `boot.log`, a 500-line ring buffer that steady-state
 *   runtime chatter overwrites: 449 lines read back after that run were 100% ordinary noise with
 *   ZERO build-stage lines in them. The evidence of the stall was destroyed by the log that was
 *   supposed to hold it.
 *
 * THE INSTRUMENT: an APPEND-ONLY `timing.jsonl` beside the boot log and the crash fact
 * (`scp-boot-logs/<scpName>/timing.jsonl` — one seat, one data family). One line per STAGE, each
 * carrying the elapsed time since the restart SIGNAL and a machine-pressure snapshot taken at the
 * SAME instant. A turn-over costs ~8 lines; nothing overwrites them.
 *
 * WHY THIS MATTERS MORE THAN A FASTER BUILD: the C959 close measured the machine at the stall —
 * swap 93.7% used, free RAM 33MB, 332 nodemon pids — and the C960 close measured the NEXT stall
 * after the user's memory cure — RAM healthy, but load 9.87 with FOUR concurrent
 * `build:server && build:client` chains in flight. Same signature, DIFFERENT cause. Without the
 * pressure snapshot the timeline alone would have read as "the build is slow" both times, and
 * both diagnoses would have been wrong. THE STAGE AND THE PRESSURE MUST BE ONE RECORD.
 *
 * DEVIATION FROM THE L3 REFERENCE DESIGN, and why: L3 asked for a `vm_stat`/`uptime` snapshot.
 * This uses Node's own `os.loadavg()` / `os.freemem()` — the SAME two facts (loadavg IS what
 * uptime prints; freemem IS the free-page count vm_stat reports) with NO subprocess. Spawning two
 * processes per stage line, on a machine whose diagnosed wound is process contention, would make
 * the instrument a participant in the thing it measures. An instrument must not push on its subject.
 *
 * ABSENCE IS A STATE: a stage with no preceding signal records `sinceSignalMs: null` rather than
 * inventing a zero — the file says "I do not know when this started", never a false 0ms.
 *
 * Citation: TOH10-L3-SLOW-TURNOVER.md (the timeline + the named instrument)
 * Citation: scpCrashState.model.ts (the seat idiom · atomic writes · the fact-beside-the-log law)
 */

import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { freemem, loadavg, totalmem } from 'node:os';
import { scpBootLogPath } from './paths';

/**
 * THE STAGE VOCABULARY — the `&&` boundaries of the nodemon exec chain, plus the two brackets
 * that make the PRE-BUILD STALL measurable at all: `restart-signal` (the CLI's own write, the
 * only stamp that exists BEFORE the child says anything) and `server-listening` (the close).
 */
export type ScpBootStage =
  /** The CLI wrote `.bridge-restart.json`. The stall's opening bracket — no child output yet. */
  | 'restart-signal'
  | 'nodemon-restarting'
  | 'nodemon-starting'
  | 'build-tsup-start'
  | 'build-server-start'
  | 'build-client-start'
  | 'build-end'
  | 'server-starting'
  | 'server-listening'
  | 'crashed';

export type ScpBootTimingEvent = {
  scpName: string;
  stage: ScpBootStage;
  /** epoch ms — the instant the stage was OBSERVED, not when it was written. */
  t: number;
  iso: string;
  /** The raw line (or the writer's name, for `restart-signal`) that established the stage. */
  detail: string;
  /** ms since the last `restart-signal` for this SCP · null when none has been seen. */
  sinceSignalMs: number | null;
  /** ms since the previous stage of this run · null on the first stage after a signal. */
  sincePrevMs: number | null;
  /** THE PRESSURE, at this instant — the half of the record that distinguishes the two stalls. */
  load1: number;
  load5: number;
  freeMemMb: number;
  totalMemMb: number;
};

/**
 * THE CAP. Append-only is the point (L3's wound was a ring buffer eating the evidence), so this
 * is deliberately far above one run's needs: ~10 lines per turn-over ⇒ 4000 holds ~400 turn-overs.
 * On overflow the TAIL is retained — the newest runs, never the oldest. A cap this high can only
 * fire after hundreds of runs, by which time the oldest are genuinely spent.
 */
const CAP_EVENTS = 4000;
const RETAIN_EVENTS = 3000;

export function scpBootTimingPath(scpName: string): string {
  return join(dirname(scpBootLogPath(scpName)), 'timing.jsonl');
}

/** Per-SCP run state — the two anchors every elapsed number is measured against. */
const lastSignalAtByScp: Map<string, number> = new Map();
const lastStageAtByScp: Map<string, number> = new Map();

/**
 * THE STAGE MATCHER — line → stage, or null for the overwhelming majority (runtime chatter).
 * Order is load-bearing: `[nodemon] app crashed` is tested before the generic nodemon prefixes,
 * and the two npm script echoes before the vite banner they precede.
 */
export function matchBootStage(line: string): ScpBootStage | null {
  const l = line.trim();
  // C970 · THE HARD LEG'S OWN SIGNAL. The Hard Turn Over does NOT go through the CLI — it is
  // written SCP-side (writerLeg 'freehop-triggerHardTurnOver'), so recordScpRestartSignal (a
  // CLI-process function) can never be called for it. Its ONE cross-process channel is this
  // line on the SCP's stdout, which the drain already carries. Matching it here gives the leg
  // the anchor every other leg gets. Tested FIRST so it can never be shadowed.
  if (l.includes('Hard Turn Over triggered')) return 'restart-signal';
  if (l.includes('[nodemon] app crashed')) return 'crashed';
  if (l.includes('[nodemon] restarting')) return 'nodemon-restarting';
  if (l.includes('[nodemon] starting')) return 'nodemon-starting';
  // The npm-run echoes — the literal `&&` boundaries of the exec chain.
  if (/^>\s*build:server\b/.test(l)) return 'build-server-start';
  if (/^>\s*build:client\b/.test(l)) return 'build-client-start';
  if (/^>\s*build\b/.test(l)) return 'build-tsup-start';
  if (/^>\s*tsup\b/.test(l)) return 'build-tsup-start';
  // vite's own close, emitted once per vite build (server then client).
  if (/^✓\s*built in\b/.test(l) || /\bbuilt in \d/.test(l)) return 'build-end';
  if (l.includes('Starting SCP') || l.includes('[Huirth] Starting')) return 'server-starting';
  if (/^Running on http/.test(l) || l.includes('Server running on http')) return 'server-listening';
  return null;
}

function appendEvent(ev: ScpBootTimingEvent): void {
  try {
    const path = scpBootTimingPath(ev.scpName);
    const dir = dirname(path);
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    appendFileSync(path, JSON.stringify(ev) + '\n', 'utf8');
    // The tail-retain sweep — cheap enough to attempt only on the closing stages, so the common
    // path is a single append with no read.
    if (ev.stage === 'server-listening' || ev.stage === 'crashed') {
      const lines = readFileSync(path, 'utf8').split('\n').filter((s) => s.length > 0);
      if (lines.length > CAP_EVENTS) {
        writeFileSync(path, lines.slice(-RETAIN_EVENTS).join('\n') + '\n', 'utf8');
      }
    }
  } catch {
    /* the instrument NEVER throws into the drain — a lost timing line must not cost a boot line */
  }
}

function record(scpName: string, stage: ScpBootStage, detail: string): ScpBootTimingEvent {
  const t = Date.now();
  const signalAt = lastSignalAtByScp.get(scpName);
  const prevAt = lastStageAtByScp.get(scpName);
  const load = loadavg();
  const ev: ScpBootTimingEvent = {
    scpName,
    stage,
    t,
    iso: new Date(t).toISOString(),
    detail: detail.slice(0, 240),
    sinceSignalMs: typeof signalAt === 'number' ? t - signalAt : null,
    sincePrevMs: typeof prevAt === 'number' ? t - prevAt : null,
    load1: Math.round(load[0] * 100) / 100,
    load5: Math.round(load[1] * 100) / 100,
    freeMemMb: Math.round(freemem() / 1048576),
    totalMemMb: Math.round(totalmem() / 1048576),
  };
  lastStageAtByScp.set(scpName, t);
  appendEvent(ev);
  return ev;
}

/**
 * THE OPENING BRACKET — called by every writer of `.bridge-restart.json`. This is the ONLY stamp
 * that exists during the pre-build stall: the child has not spoken yet, so nothing else in the
 * system knows the clock has started. `writer` names WHICH leg fired (turn-over-a · turn-over-b ·
 * hard · fact-licensed · revert-to-stable), so a stall can be attributed to a leg.
 */
export function recordScpRestartSignal(scpName: string, writer: string): void {
  const t = Date.now();
  lastSignalAtByScp.set(scpName, t);
  lastStageAtByScp.delete(scpName);
  record(scpName, 'restart-signal', writer);
}

/**
 * THE DRAIN HOOK — one call per boot-log line. Returns the stage when the line established one
 * (so a caller may log it), null otherwise. Cheap by design: the matcher rejects ordinary runtime
 * chatter on a handful of string tests before any allocation.
 */
export function observeScpBootTimingLine(scpName: string, line: string): ScpBootStage | null {
  const stage = matchBootStage(line);
  if (!stage) return null;
  // C970 · A SIGNAL IS A SIGNAL, WHICHEVER DOOR IT ARRIVES BY. `recordScpRestartSignal` set the
  // anchor; this path only recorded — so a restart signal observed through the DRAIN (the SCP-side
  // hard leg's only channel) left the anchor pointing at the PREVIOUS run. The field showed it
  // exactly: a hard turn-over logged `nodemon-restarting +9.7s` measured from the prior signal
  // when the true elapsed was ~0.1s — the instrument mis-timing the one leg reached for in
  // recovery. Anchoring here makes the rule structural: ANY observed restart-signal opens a new
  // run, from any source, rather than the CLI-called path being privileged.
  if (stage === 'restart-signal') {
    const t = Date.now();
    lastSignalAtByScp.set(scpName, t);
    lastStageAtByScp.delete(scpName);
  }
  record(scpName, stage, line);
  return stage;
}

/** Read the tail of the instrument — newest last. The endpoint's read half. */
export function readScpBootTiming(scpName: string, maxEvents = 120): ScpBootTimingEvent[] {
  try {
    const path = scpBootTimingPath(scpName);
    if (!existsSync(path)) return [];
    const lines = readFileSync(path, 'utf8').split('\n').filter((s) => s.length > 0);
    const out: ScpBootTimingEvent[] = [];
    for (const line of lines.slice(-maxEvents)) {
      try {
        out.push(JSON.parse(line) as ScpBootTimingEvent);
      } catch {
        /* a torn line (a write interleaved at the cap sweep) is skipped, never fatal */
      }
    }
    return out;
  } catch {
    return [];
  }
}

/**
 * THE LAST RUN, as one summary — the shape the console (build-order step 3) renders and the shape
 * a diagnosis reads. Takes the events from the most recent `restart-signal` forward.
 *
 * `stallMs` is the headline number this whole instrument exists to produce: the gap between the
 * signal and the FIRST sign of life from the child. In the C959 field that number was 498s against
 * a 14s build — the single fact that redirected the diagnosis from "the build is slow" to
 * "the machine is starving".
 */
export function summarizeLastBootRun(scpName: string): {
  events: ScpBootTimingEvent[];
  signalAt: number | null;
  firstOutputAt: number | null;
  listeningAt: number | null;
  stallMs: number | null;
  totalMs: number | null;
  crashed: boolean;
} | null {
  const all = readScpBootTiming(scpName, 400);
  if (all.length === 0) return null;
  let start = -1;
  for (let i = all.length - 1; i >= 0; i -= 1) {
    if (all[i].stage === 'restart-signal') {
      start = i;
      break;
    }
  }
  // No signal in the window ⇒ report the tail as an unanchored run rather than nothing at all.
  const events = start >= 0 ? all.slice(start) : all;
  const signalAt = start >= 0 ? all[start].t : null;
  const firstOutput = events.find((e) => e.stage !== 'restart-signal') ?? null;
  const listening = [...events].reverse().find((e) => e.stage === 'server-listening') ?? null;
  return {
    events,
    signalAt,
    firstOutputAt: firstOutput ? firstOutput.t : null,
    listeningAt: listening ? listening.t : null,
    stallMs: signalAt !== null && firstOutput ? firstOutput.t - signalAt : null,
    totalMs: signalAt !== null && listening ? listening.t - signalAt : null,
    crashed: events.some((e) => e.stage === 'crashed'),
  };
}
