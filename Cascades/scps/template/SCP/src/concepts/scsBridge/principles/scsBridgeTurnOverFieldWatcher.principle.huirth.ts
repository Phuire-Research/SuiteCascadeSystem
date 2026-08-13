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
 * D-MSE C939 · THE SIGNAL LANE (the deaf-watch failsafe): the trigger write below is observed
 * by nodemon's single-file watch — a watch that can die SILENTLY (the C937 field wound: every
 * upstream hop clean, the trigger landing in a void, the turn-over presenting as a stall).
 * THE SURVIVAL PROBE: a healthy watch kills THIS process within ~1s of the trigger write (the
 * restart event's scoped pkill). If this process is still alive PROBE_MS later, the watch is
 * deaf — the principle sends the lane's own nodemon its manual-restart signal (SIGUSR2 · the
 * field-proven remedy) directly: ancestry walk first (this server's OWN lane), pgrep by this
 * SCP's own directory as the fallback (the Name-First class — identity resolves the target).
 * The file write REMAINS the primary lane anor the boot fingerprint; the signal never fires
 * when the watch is healthy, because the process it would fire from is already dead.
 *
 * Citation: DIAMOND-BREAKOUT-SEQUENCE.md §BO-2-G (the layered watcher design).
 */
import { resolveScpLocalBridgeDir } from '../bridgeRoot.model';
import type { PrincipleFunction, MuxiumDeck, Concept } from 'stratimux';
import { watch as chokidarWatch, type FSWatcher } from 'chokidar';
import { readFile } from 'node:fs/promises';
import { writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
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
    watcher = chokidarWatch(bridgeJsonPath, {
      ignoreInitial: true,
      awaitWriteFinish: { stabilityThreshold: 150, pollInterval: 50 },
    });
    watcher.on('add', () => void onChange());
    watcher.on('change', () => void onChange());
  })();

  // D-MSE C939 · THE SIGNAL LANE — see the header. One probe per fire; a fresh fire re-arms.
  let survivalProbe: NodeJS.Timeout | null = null;
  const SIGNAL_LANE_PROBE_MS = 4000;

  const findLaneNodemonPids = (): number[] => {
    try {
      let pid = process.pid;
      for (let hop = 0; hop < 8; hop++) {
        const ppid = Number(execFileSync('ps', ['-o', 'ppid=', '-p', String(pid)], { encoding: 'utf8' }).trim());
        if (!Number.isFinite(ppid) || ppid <= 1) break;
        const cmd = execFileSync('ps', ['-o', 'command=', '-p', String(ppid)], { encoding: 'utf8' }).trim();
        if (cmd.includes('node_modules/.bin/nodemon')) return [ppid];
        pid = ppid;
      }
    } catch {
      /* detached lane anor ps unavailable — the pgrep fallback below */
    }
    try {
      const out = execFileSync('pgrep', ['-f', `${process.cwd()}/node_modules/.bin/nodemon`], { encoding: 'utf8' });
      return out
        .split('\n')
        .map((line) => Number(line.trim()))
        .filter((pid) => Number.isFinite(pid) && pid > 1);
    } catch {
      return [];
    }
  };

  const armSignalLaneProbe = (fieldAt: number): void => {
    if (survivalProbe) clearTimeout(survivalProbe);
    survivalProbe = setTimeout(() => {
      // Still alive → the restart never came → the watch is deaf. The signal completes it.
      const pids = findLaneNodemonPids();
      if (pids.length === 0) {
        console.log('[SCS-Bridge TurnOverFieldWatcher] turnover.signal-lane.skip · reason=nodemon-not-found · fieldAt=', fieldAt);
        return;
      }
      for (const pid of pids) {
        try {
          process.kill(pid, 'SIGUSR2');
          console.log('[SCS-Bridge TurnOverFieldWatcher] turnover.signal-lane.fired · nodemonPid=', pid, '· fieldAt=', fieldAt, '· probeMs=', SIGNAL_LANE_PROBE_MS);
        } catch (err) {
          console.log('[SCS-Bridge TurnOverFieldWatcher] turnover.signal-lane.skip · reason=signal-failed · pid=', pid, '·', String(err));
        }
      }
    }, SIGNAL_LANE_PROBE_MS);
    survivalProbe.unref();
  };

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
    try {
      writeFileSync(
        path.resolve(process.cwd(), '.bridge-restart.json'),
        JSON.stringify({ hardTurnOver: true, timestamp: Date.now(), source: 'turnOver-field', fieldAt: at }, null, 2),
        'utf-8',
      );
      console.log('[SCS-Bridge TurnOverFieldWatcher] turnover.fired · fieldAt=', at);
      armSignalLaneProbe(at);
    } catch (err) {
      console.log('[SCS-Bridge TurnOverFieldWatcher] turnover.skip · reason=restart-write-failed ·', String(err));
    }
  };
};
