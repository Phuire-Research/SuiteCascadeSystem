/**
 * scsBridgeTurnOverFieldWatcher Principle — Huirth Deployment
 *
 * BO-2-G (C446) · D-BN-2 · THE FIELD-TRIGGERED TURN OVER — the layered watcher's SCP-side half.
 *
 * The bridge writes THE SPECIFIED FIELD `turnOver: { at, source, hard }` into the WORKSPACE
 * gitm.json (D-BN-2 · THE turnOver RELOCATION — branch business belongs on the git manifold
 * file · user design · the gitm turn-over legs are the only writers that ADVANCE it, threaded
 * through the reducer → the GITEP snapshot). This principle watches THAT file and, when
 * turnOver.at ADVANCES beyond the boot-time baseline, writes the local `.bridge-restart.json` —
 * the blunt trigger nodemon already watches. The SIGNAL is field-based on gitm.json; the
 * RESTART mechanic stays the proven one.
 *
 * Guard telemetry (the *.skip{reason} law): absent file · malformed JSON · absent field ·
 * non-advancing at — each logs its reason and does nothing. A restart can never fire from
 * noise; only a strictly-advancing numeric turnOver.at.
 *
 * D-TOH H3 · THE WATCHER SELF-DISCRIMINATION (THE NAME-FIRST LAW · defense-in-depth): the bridge
 * stamps `turnOver.targetScpName` — the NAME the turn-over resolved its dir FROM. This watcher
 * reads its OWN name ONCE from `<package root>/scp.config.json` (the FKIS identity file — the
 * SAME file the boot report reads; Honest-Absence: unreadable → no discrimination, legacy
 * behavior). A stamp carrying a target that is NOT this SCP's own name SKIPS
 * (reason=not-own-target) with the baseline NOT advanced — an out-of-order own stamp observed
 * after a foreign one must still fire (advancing on a foreign stamp could wedge the watcher
 * against its OWN in-flight stamp: the switch-without-stamp class). A stamp WITHOUT
 * targetScpName (legacy bridge) is treated as OWN — old bridges keep working.
 *
 * Pattern source: scsBridgeJsonWatcher.principle.huirth.ts (chokidar on the Bridge dir ·
 * ENOENT-safe reads · cleanup order watcher → conclude). This principle dispatches NOTHING —
 * pure fs observation → fs write (the one principle whose output is a file, by design).
 *
 * D-MSE C939 · THE SIGNAL LANE — **RETIRED at C968.** It was built for the C937 wound (a trigger
 * landing in a void, the turn-over presenting as a stall) on the belief that nodemon's watch dies
 * silently. The clean room disproved the premise: same nodemon, same chokidar, same config, same
 * volume — 0/6 detections after 203 days of host uptime, 14/14 after a restart (and 6/6 with five
 * concurrent watchers, so multiplicity was never the cause). **The watch was never unreliable; the
 * HOST's FSEvents state degrades over long uptime and a reboot restores it.**
 *
 * The probe was also structurally unreachable: the CLI-direct write reaches nodemon in ~100ms, so
 * this process is torn down and reborn before the probe's 4s timer could ever fire — and lab-wide,
 * across every SCP boot log, `turnover.fired` = 0 anor `turnover.skip` = 1032. It never armed once.
 *
 * THE LAW IT LEAVES BEHIND (C966): a failsafe is an indicator that the Means introduced an
 * inconsistency. Compensation retained past its cause hardens into architecture — so it is pruned
 * rather than carried, and the file write stands alone as the primary lane anor boot fingerprint.
 *
 * Citation: DIAMOND-BREAKOUT-SEQUENCE.md §BO-2-G (the layered watcher design · superseded here).
 */
import { resolveScpLocalBridgeDir } from '../bridgeRoot.model';
import { createWatcher } from '../../../model/watcherSingleton.model';
import type { PrincipleFunction, MuxiumDeck, Concept } from 'stratimux';
import { type FSWatcher } from 'chokidar';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import type { ScsBridgeHuirthState, ScsBridgeHuirthQualities } from '../scsBridge.type';

export type ScsBridgeTurnOverFieldWatcherDeck = MuxiumDeck & {
  scsBridge: Concept<ScsBridgeHuirthState, ScsBridgeHuirthQualities>;
};

type TurnOverField = { at?: unknown; source?: unknown; hard?: unknown; targetScpName?: unknown };

export const scsBridgeTurnOverFieldWatcherPrinciple: PrincipleFunction<
  ScsBridgeHuirthQualities,
  ScsBridgeTurnOverFieldWatcherDeck,
  ScsBridgeHuirthState
> = () => {
  // D-BN-2 · THE turnOver RELOCATION — the signal rides gitm.json (the same file the gitm
  // STCP relay watches · gitmRelay.config.ts). MD-A D2 · SCP BRIDGE SOVEREIGNTY: the watch
  // moves to the SCP's OWN Cascades/Bridge/gitm.json (resolveScpLocalBridgeDir · cwd-local)
  // — the bridge's GITEP writer lands the snapshot on the CALLING SCP's rail, closing the
  // turn-over circuit fully per-SCP: own gitm.json → this watcher → own .bridge-restart.json.
  const bridgeJsonPath = path.join(resolveScpLocalBridgeDir(), 'gitm.json');
  // The boot baseline: a turnOver already present at startup was CONSUMED by a prior life
  // (anor predates this boot) — only an ADVANCE beyond it triggers.
  let baselineAt = 0;
  let watcher: FSWatcher | null = null;
  // D-TOH H3 — this SCP's OWN name, read ONCE at arm from <package root>/scp.config.json (the
  // FKIS identity file · process.cwd() IS the package root — the same root the .bridge-restart.json
  // write below targets). Honest-Absence: unreadable/absent → null → NO discrimination (legacy).
  let ownScpName: string | null = null;

  const readTurnOverStamp = async (): Promise<{ at: number; targetScpName: string } | null> => {
    try {
      const raw = await readFile(bridgeJsonPath, 'utf8');
      const parsed = JSON.parse(raw) as { turnOver?: TurnOverField | null };
      const at = parsed.turnOver?.at;
      if (typeof at !== 'number') return null;
      // D-TOH H3 — '' = legacy stamp (a pre-discrimination bridge) → treated as own below.
      const target = parsed.turnOver?.targetScpName;
      return { at, targetScpName: typeof target === 'string' ? target : '' };
    } catch {
      return null;
    }
  };

  void (async () => {
    try {
      const cfgRaw = await readFile(path.resolve(process.cwd(), 'scp.config.json'), 'utf8');
      const cfg = JSON.parse(cfgRaw) as { scpName?: unknown };
      if (typeof cfg?.scpName === 'string' && cfg.scpName.length > 0) ownScpName = cfg.scpName;
    } catch {
      /* Honest-Absence — no scp.config.json (dev:self / pre-install) → legacy behavior, no skip */
    }
    baselineAt = (await readTurnOverStamp())?.at ?? 0;
    console.log(
      '[SCS-Bridge TurnOverFieldWatcher] armed · path=',
      bridgeJsonPath,
      '· baselineAt=',
      baselineAt,
      '· ownScpName=',
      ownScpName ?? '(none)',
    );
    watcher = createWatcher('scsBridgeTurnOverFieldWatcher#1', bridgeJsonPath, {
      ignoreInitial: true,
      awaitWriteFinish: { stabilityThreshold: 150, pollInterval: 50 },
    });
    watcher.on('add', () => void onChange());
    watcher.on('change', () => void onChange());
  })();

  // D-MSE C939 · THE SIGNAL LANE — see the header. One probe per fire; a fresh fire re-arms.
  // ── C968 · THE C939 SIGNAL LANE, PRUNED ──────────────────────────────────────────────
  // The survival probe (a 4s timer that pgrep'd this lane's nodemon and SIGUSR2'd it when the
  // server was still alive) is GONE, and the measurement is why: lab-wide, across EVERY SCP
  // boot log ever written, `turnover.fired` = 0 and `turnover.skip` = 1032 — every one of them
  // `reason=not-advancing`. `signal-lane` lines: 0. The probe never armed, because it was only
  // ever armed inside a fire branch that never ran.
  //
  // THE MECHANISM (C967 field record): the CLI-direct write reaches nodemon in ~100ms, so the
  // SCP is torn down and reborn before this watcher can act — and the FRESH watcher arms with
  // baselineAt set to the very stamp it would have fired on, making `at <= baselineAt` true
  // forever. This path is not redundant; it is structurally unreachable.
  //
  // THE LAW (C966, the user's): a failsafe is an indicator that the Means introduced an
  // inconsistency. The turn-over was never broken — 203 days of OS uptime degraded FSEvents,
  // and a reboot restored it (0/6 → 14/14 in the clean room). Compensation retained past its
  // cause becomes architecture. Pruned rather than carried.

  const onChange = async (): Promise<void> => {
    const stamp = await readTurnOverStamp();
    if (stamp === null) {
      console.log('[SCS-Bridge TurnOverFieldWatcher] turnover.skip · reason=absent-or-malformed-field');
      return;
    }
    const { at, targetScpName } = stamp;
    // D-TOH H3 · THE SELF-DISCRIMINATION GATE — a stamp CARRYING a target that is not OUR name is
    // a FOREIGN turn-over that leaked onto this rail: skip, and do NOT advance the baseline (our
    // OWN in-flight stamp may carry an earlier at — advancing past it would wedge us against it;
    // a Date.now() stamp from our own NEXT turn-over always exceeds the untouched baseline).
    // A legacy stamp (targetScpName '') anor an unknown own name (Honest-Absence) fires as own.
    if (targetScpName !== '' && ownScpName !== null && targetScpName !== ownScpName) {
      console.log('[SCS-Bridge TurnOverFieldWatcher] turnover.skip · reason=not-own-target · target=', targetScpName, '· own=', ownScpName);
      return;
    }
    if (at <= baselineAt) {
      console.log('[SCS-Bridge TurnOverFieldWatcher] turnover.skip · reason=not-advancing · at=', at, '· baseline=', baselineAt);
      return;
    }
    baselineAt = at;
    // ── C968 · THE DOUBLED WRITE, PRUNED — this principle is now PURE OBSERVATION ──────────
    // It used to write its OWN `.bridge-restart.json` here, a second restart trigger beside the
    // CLI's. The measurement retired it: lab-wide, `turnover.fired` = 0 anor `turnover.skip` =
    // 1032 across every SCP boot log ever written. It never once reached this line.
    //
    // WHY IT COULD NOT: the CLI-direct write reaches nodemon in ~100ms (C967 field record:
    // restart-signal +0.0s → nodemon-restarting +0.1s → listening +7.1s), so this process is
    // torn down and reborn before it can act — and the FRESH watcher arms with baselineAt set
    // to the very stamp it would have fired on, so `at <= baselineAt` holds forever. The write
    // was never a fallback; it was unreachable by construction.
    //
    // WHAT REMAINS, and why it is kept: the observation itself, and the H3 self-discrimination
    // gate above it. H3 (a foreign target must never turn THIS SCP over) is the user's card and
    // is still PENDING TESTING — its logic stays seated here, exercised on every gitm.json
    // change, so the guard is proven by telemetry even with no write behind it.
    //
    // REVERT: one commit (C968). The write is five lines and the header records its shape.
    console.log('[SCS-Bridge TurnOverFieldWatcher] turnover.observed · fieldAt=', at, '· own=', ownScpName ?? '(unknown)');
  };
};
