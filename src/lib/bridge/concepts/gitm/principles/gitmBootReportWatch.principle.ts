/**
 * gitmBootReportWatch Principle · C300 · THE ONE-SHOT SEAT RETURN (CLAUSE 6 · the Observed Seat Return)
 *
 * The bridge-owned OBSERVER that lands the seat back on B after A has ACTUALLY BOOTED. Clones the
 * gitmResolvedManifestWatch pattern (chokidar on <userCwd>/Cascades/Bridge · depth 0 · ignoreInitial
 * · awaitWriteFinish · plan+beat arm until userCwd is ready) — with ONE Diameter of difference: this
 * watcher is STANDING. It does NOT stagePlanner-conclude the chokidar once armed (a manifest-watch
 * fires-and-forgets per resolution; the seat-return must OBSERVE many boots across a session). THE
 * ONE-SHOT IS THE ARM (seatReturnArm.model · single slot), NOT THE WATCHER — the arm gates every
 * event, so an unarmed boot-report is a no-op no matter how many boots fire.
 *
 * The circuit (retires gitmTurnOverWithSource's setTimeout blind-return):
 *   1. gitmTurnOverWithSource source:'A' (working B present) → armSeatReturn({ workingBranch, stableBranch }).
 *   2. The A-prove restart boots the SCP server → the SCP server's serverPrinciple writes
 *      scp-boot-report.<scpName>.json = { scpName, activeBranch, bootedAt } into <userCwd>/Cascades/Bridge.
 *   3. THIS watcher observes the add/change → reads the arm → if activeBranch === arm.stableBranch
 *      (A booted · the observation), DISARM FIRST (one-shot · re-entrancy guard), THEN
 *      gitmExec(['switch', arm.workingBranch]) at the active SCP cwd + log gitm.seatlaw.checkout-return
 *      + dispatch gitmSetStatus (refresh STARC via the live handle).
 *
 * Mismatched branch (report shows a b/* · the return itself, or an unrelated boot) ANOR no arm =
 * log-only (the arm gate + the branch-equality gate keep the checkout from firing spuriously). The
 * checkout does NOT reboot the SCP (no .bridge-restart.json write) — the running SCP keeps serving
 * A's built tree while the git seat sits on B (the counter-tie: master renders N, the seat is b/*).
 *
 * Template: gitmResolvedManifestWatch.principle.ts (plan + beat arm + chokidar opts · live-handle
 *   dispatch seam) · gitmScpWatcherArm.quality.ts (live-handle gitmSetStatus refresh).
 * Citation: PLAYTEST-AB-LAW-ROADMAP.md CLAUSE 6 · seatReturnArm.model.ts · gitmTurnOverWithSource.quality.ts (retired setTimeout).
 */

import type { PrincipleFunction } from 'stratimux';
import { watch, type FSWatcher } from 'chokidar';
import { existsSync, readFileSync, readdirSync, statSync, unlinkSync } from 'node:fs';
import { join, basename } from 'node:path';
import { log } from '../../../debugLog';
import { getActiveScsBridgeMuxiumHandle } from '../../../scsBridgeMuxium';
import { fenceWatchTargets } from '../../../watcherFence.model';
import { gitmExec } from '../model/gitmExec.model';
import { disarmSeatReturn, readSeatReturnArm } from '../model/seatReturnArm.model';
// MD-C M5 · THE ORIGIN-THREADED CONFIRM (the C570 field find) — the B-proof gate compared the
// booted SCP's activeBranch against the POINTER's flat roles/workingBranch/abMode, so a
// non-pointer origin's boot NEVER confirmed (IE stranded at 'turned-over' while PE held the
// pointer). The report carries scpName — resolve it to the origin's slice and gate THERE.
import { resolveScpNameToDir } from '../model/gitmOpCwd.model';
// M6 · upsertSliceFields — the rehydration slice-mirror (the restored A/B state lands on the
// rehydrated SCP's OWN rail, not just the flat view — the M4 pattern completed).
import { getSlice, upsertSliceFields } from '../model/gitmSliceStore.model';
// GITM Dev Epoch (MD-E · THE C318 FOLD · THE BRIDGE-OWNED DEADLINE) — the FLOOR under the observation.
import {
  disarmDeadline,
  isDeadlinePassed,
  readDeadlineArm,
} from '../model/bridgeOwnedDeadline.model';
import type { GitmState, GitmABMode } from '../gitm.types';
import { UPDATE_APPLIED_NOTE } from '../gitm.types';
import type { GitmQualities } from '../gitm.concept';
import type { GitmSetStatusPayload, GitmScpUpdateProgressPayload } from '../qualities/types';

// Module-scope arm guard (the watcher itself is STANDING — armed ONCE, never concluded) + per-file
// mtime dedup (a re-fired chokidar event on the same write is a no-op).
let bootReportWatcher: FSWatcher | null = null;
const lastActedMtime = new Map<string, number>();

const BOOT_REPORT_PATTERN = /^scp-boot-report\.(.*)\.json$/;

export const gitmBootReportWatchPrinciple: PrincipleFunction<
  GitmQualities,
  void,
  GitmState
> = ({ k_, plan }) => {
  const onBootReportEvent = (filePath: string): void => {
    const name = basename(filePath);
    if (!BOOT_REPORT_PATTERN.test(name)) return;

    // mtime dedup — act once per distinct write.
    let mtimeMs = 0;
    try {
      mtimeMs = statSync(filePath).mtimeMs;
    } catch {
      return; // vanished between event and stat
    }
    if (lastActedMtime.get(name) === mtimeMs) return;
    lastActedMtime.set(name, mtimeMs);

    // Parse the report ONCE up front — both the B-proof branch (below) and the armed A-return
    // branch read activeBranch. The mtime dedup above already one-shots this per boot write.
    let report: { scpName?: unknown; activeBranch?: unknown; bootedAt?: unknown };
    try {
      report = JSON.parse(readFileSync(filePath, 'utf8')) as typeof report;
    } catch {
      log('gitm.seatlaw.boot-report.unparseable', { name });
      return;
    }
    const activeBranch = typeof report.activeBranch === 'string' ? report.activeBranch : '';

    // MD-E (THE C318 FOLD) — DISARM THE DEADLINE FIRST. A boot-report arriving AT ALL is the proof
    // the SCP booted (the deadline's whole question is "did it boot?"). Disarm on EITHER branch
    // (the B-proof below OR the armed A-return) BEFORE any routing — the deadline's job is done the
    // moment a report lands, regardless of which branch it shows. The seat-law's own arm gate still
    // governs the checkout-return; this only lifts the failure floor.
    disarmDeadline();

    // C326 · THE B-PROOF BRANCH (THE OBSERVED-PROOF CONFIRM + THE UPDATE-CYCLE RESET). The Sword
    // BOOTED on B after a turn-over — the STRUCTURAL proof B works (the boot itself, not a
    // client-side carrier seam that dies with severed sessions · Run 16 fired zero confirm events).
    // The three-gate proof: report shows a b/* branch AND it equals the tracked workingBranch AND
    // abMode is 'turned-over' (the turn-over landed the seat on B, awaiting confirmation). This is
    // a DISTINCT branch from the armed A-return below (no seat-return arm is in flight for a B-boot)
    // — it does NOT consume the arm and MUST NOT disturb the armed A-return path. One-shot per boot
    // (the mtime dedup already guards re-fires).
    // D-BN · THE branchRoles SWEEP — the B-proof gate decides via ROLES EQUALITY (activeBranch ===
    // roles.b), the canonical working-B truth — NOT the `b/` prefix (lineage naming only). roles.b is
    // maintained in LOCKSTEP with workingBranch, so the tracked-pointer equality below still holds.
    // MD-C M5 · THE ORIGIN-SLICE GATE — the report names WHICH SCP booted; a non-pointer origin's
    // proof fields live on ITS slice (the flat view is the pointer's — comparing against it starved
    // every non-pointer confirm). Pointer/unresolved/cold-rail falls through to the flat reads.
    const reportScpName = typeof report.scpName === 'string' ? report.scpName : '';
    const originDir =
      reportScpName !== '' ? resolveScpNameToDir(reportScpName, k_.userCwd.select()) : '';
    const originSlice =
      originDir !== '' && originDir !== k_.activeScpDir.select() ? getSlice(originDir) : undefined;
    const proofRoles = originSlice?.branchRoles ?? k_.branchRoles.select();
    const proofWorkingBranch = originSlice?.workingBranch ?? k_.workingBranch.select();
    const proofAbMode = originSlice?.abMode ?? k_.abMode.select();
    if (
      activeBranch === proofRoles.b &&
      proofRoles.b.length > 0 &&
      activeBranch === proofWorkingBranch &&
      proofAbMode === 'turned-over'
    ) {
      const bh = getActiveScsBridgeMuxiumHandle();
      if (bh !== null) {
        const gitmDeck = bh.muxium.deck.d.gitm;
        // (a) Refresh the C316 blind spot FIRST — gitmConfirmSuccess's guard reads
        //     changesPrimedOnB; gitmSetStatus repopulates the live CHANGEDIAL count so the
        //     confirm's clean-B gate reads the true value (~0ms).
        setTimeout(() => {
          bh.muxium.dispatch(gitmDeck.e.gitmSetStatus({} as GitmSetStatusPayload) as never);
        }, 0);
        // (b) Confirm success (~1200ms — after STARC settles from (a)). Flips the Merge gate:
        //     abMode='success' · bMergeable=true · lastTurnOverResult='success' — the proof
        //     observed, no client carrier required. M5 — the confirm carries the BOOTED SCP's
        //     name, so a non-pointer origin's success lands on ITS OWN slice (the M4 mirror).
        setTimeout(() => {
          bh.muxium.dispatch(
            gitmDeck.e.gitmConfirmSuccess(
              reportScpName !== '' ? { originScpName: reportScpName } : {},
            ) as never,
          );
          log('gitm.turnover.observed-proof-confirm', { activeBranch, originScpName: reportScpName });
        }, 1200);
        // (c) THE PANEL YIELDS (~2000ms) — clear the Update rail (stage idle · note cleared ·
        //     diffPresent false) THEN unlink both residual update artifacts so the cycle resets.
        setTimeout(() => {
          bh.muxium.dispatch(
            gitmDeck.e.gitmScpUpdateProgress({
              stage: 'idle',
              note: '',
              diffPresent: false,
            } as GitmScpUpdateProgressPayload) as never,
          );
          const userCwd = k_.userCwd.select();
          const scpName =
            k_.updateStatus.select().scpName !== ''
              ? k_.updateStatus.select().scpName
              : basename(k_.activeScpDir.select() !== '' ? k_.activeScpDir.select() : userCwd);
          const bridgeDir = join(userCwd, 'Cascades', 'Bridge');
          for (const artifact of [
            `scp-update-diff.${scpName}.json`,
            `scp-update-resolved.${scpName}.json`,
          ]) {
            const artifactPath = join(bridgeDir, artifact);
            try {
              if (existsSync(artifactPath)) unlinkSync(artifactPath);
            } catch (err) {
              log('gitm.update.cycle-reset.unlink-failed', {
                artifact,
                error: err instanceof Error ? err.message.slice(0, 200) : String(err),
              });
            }
          }
          log('gitm.update.cycle-reset', { scpName, bridgeDir });
        }, 2000);
      }
      return; // B-proof handled — do NOT fall through to the armed A-return path.
    }

    // MD-ATC-F · THE UPDATE-FINALIZE RESET (side-agnostic · the no-reset field break): a boot
    // report arriving while the origin's Update rail still shows the APPLIED terminal is the
    // reboot-proof of the UPDATE itself — the Apply-to-Current A-side finalize boots on A/master
    // and the B-proof branch above cannot match. Yield the panel + clear the artifacts exactly
    // as the B-proof does, so the Update workflow can run again. The Progress stamp carries the
    // ORIGIN (RS.4 — the reset lands on the booted SCP's own rail). One-shot per boot (the mtime
    // dedup guards re-fires) · does NOT consume the seat-return arm (falls through to it).
    const originUpdateStatus = originSlice?.updateStatus ?? k_.updateStatus.select();
    if (originUpdateStatus.note === UPDATE_APPLIED_NOTE) {
      const finalizeHandle = getActiveScsBridgeMuxiumHandle();
      if (finalizeHandle !== null) {
        const finalizeDeck = finalizeHandle.muxium.deck.d.gitm;
        setTimeout(() => {
          finalizeHandle.muxium.dispatch(
            finalizeDeck.e.gitmScpUpdateProgress({
              stage: 'idle',
              note: '',
              diffPresent: false,
              ...(reportScpName !== '' ? { originScpName: reportScpName } : {}),
            } as GitmScpUpdateProgressPayload) as never,
          );
          const userCwd = k_.userCwd.select();
          const finalizeScpName =
            reportScpName !== ''
              ? reportScpName
              : originUpdateStatus.scpName !== ''
                ? originUpdateStatus.scpName
                : basename(k_.activeScpDir.select() !== '' ? k_.activeScpDir.select() : userCwd);
          const bridgeDir = join(userCwd, 'Cascades', 'Bridge');
          for (const artifact of [
            `scp-update-diff.${finalizeScpName}.json`,
            `scp-update-resolved.${finalizeScpName}.json`,
          ]) {
            const artifactPath = join(bridgeDir, artifact);
            try {
              if (existsSync(artifactPath)) unlinkSync(artifactPath);
            } catch (err) {
              log('gitm.update.cycle-reset.unlink-failed', {
                artifact,
                error: err instanceof Error ? err.message.slice(0, 200) : String(err),
              });
            }
          }
          log('gitm.update.cycle-reset', { scpName: finalizeScpName, bridgeDir, via: 'update-finalize' });
        }, 2000);
      }
    }

    // THE ONE-SHOT GATE — no arm = no seat-return in flight (a boot-report is otherwise inert).
    const arm = readSeatReturnArm();
    if (!arm) return;

    // THE OBSERVATION — A booted only when its report shows the stable (A) branch. A mismatch (the
    // report shows b/* · the return itself, ANOR an unrelated boot) is log-only: the seat stays put.
    if (activeBranch !== arm.stableBranch) {
      log('gitm.seatlaw.boot-report.mismatch', { name, activeBranch, expected: arm.stableBranch });
      return;
    }

    // DISARM FIRST (one-shot · re-entrancy guard — a second boot-report must not re-fire), THEN
    // checkout-return the seat to B. opCwd = the active SCP dir (selectGitmOpCwd inline via k_).
    disarmSeatReturn();
    const activeScpDir = k_.activeScpDir.select();
    const opCwd = activeScpDir !== '' ? activeScpDir : k_.userCwd.select();
    let switchExec = gitmExec(['switch', arm.workingBranch], opCwd);
    // D-BN-2 · THE SEAT-RETURN NET (mirror of the C500 turn-over net) — the bare switch had NO
    // telemetry net: a per-SCP Cascades/Bridge/ drift the bridge rewrote between the arm and the
    // return refused the seat-return silently (the seat stayed on A while the machine believed B).
    // Retry 1 · THE TELEMETRY DISCARD: the Cascades/Bridge/ telemetry is the only LOSSLESS-to-drop
    // colliding class (the writer regenerates it). Retry 2 · THE STASH CARRY: genuine drift collides
    // — stash across the switch, pop toward the drift (the newer truth) on a conflict.
    if (!switchExec.ok) {
      log('gitm.seatlaw.checkout-return.retry', {
        stage: 'telemetry-discard',
        workingBranch: arm.workingBranch,
        error: (switchExec.error || switchExec.stderr).slice(0, 200),
      });
      gitmExec(['checkout', '--', 'Cascades/Bridge'], opCwd);
      switchExec = gitmExec(['switch', arm.workingBranch], opCwd);
    }
    if (!switchExec.ok) {
      log('gitm.seatlaw.checkout-return.retry', {
        stage: 'stash-carry',
        workingBranch: arm.workingBranch,
        error: (switchExec.error || switchExec.stderr).slice(0, 200),
      });
      const stashPush = gitmExec(['stash', 'push', '-u', '-m', 'gitm: seat-return stash carry'], opCwd);
      if (stashPush.ok) {
        switchExec = gitmExec(['switch', arm.workingBranch], opCwd);
        if (switchExec.ok) {
          const pop = gitmExec(['stash', 'pop'], opCwd);
          if (!pop.ok) {
            gitmExec(['checkout', '--theirs', '--', '.'], opCwd);
            gitmExec(['add', '-A'], opCwd);
            gitmExec(['stash', 'drop'], opCwd);
          }
        }
      }
    }
    if (!switchExec.ok) {
      log('gitm.seatlaw.checkout-return.refused', {
        workingBranch: arm.workingBranch,
        opCwd,
        error: (switchExec.error || switchExec.stderr).slice(0, 200),
      });
    }
    log('gitm.seatlaw.checkout-return', {
      workingBranch: arm.workingBranch,
      opCwd,
      ok: switchExec.ok,
      error: switchExec.ok ? '' : (switchExec.error || switchExec.stderr).slice(0, 200),
    });
    console.log('[Gitm BootReportWatch] seat-return checkout →', arm.workingBranch, '·', switchExec.ok ? 'ok' : 'FAILED');

    // Refresh STARC via the live handle (the checkout changed the branch · the badge must catch up).
    // The checkout does NOT write .bridge-restart.json — the running SCP keeps serving A's build.
    const h = getActiveScsBridgeMuxiumHandle();
    if (h !== null) {
      h.muxium.dispatch(h.muxium.deck.d.gitm.e.gitmSetStatus({} as GitmSetStatusPayload) as never);
    }

    // D-BN-3 · THE CARRY-A PROOF (the user's law: the confirmed carry that lands B, boots A, and
    // seat-returns onto B IS the proof — Merge B→A enables WITHOUT a second B turn-over). Gates:
    // the machine sits at 'turned-over' from a carry-A attempt whose target IS the canonical
    // roles.b, the arm returned to that same B, AND the checkout-return above verifiably landed
    // (switchExec.ok — the on-B verification). The setStatus above refreshes changesPrimedOnB so
    // the confirm's clean-B gate (~1200ms, the C326 timing) reads the carried committed tree.
    const carryAttempt = k_.turnOverAttempt.select();
    if (
      switchExec.ok &&
      h !== null &&
      k_.abMode.select() === 'turned-over' &&
      carryAttempt !== null &&
      carryAttempt.source === 'carry-A' &&
      carryAttempt.targetBranch === k_.branchRoles.select().b &&
      arm.workingBranch === k_.branchRoles.select().b
    ) {
      setTimeout(() => {
        // M5 — origin-stamped (the carry-A flow is pointer-territory today; the stamp keeps the
        // confirm's resolve exact if the pointer moves between the arm and this fire).
        h.muxium.dispatch(
          h.muxium.deck.d.gitm.e.gitmConfirmSuccess(
            reportScpName !== '' ? { originScpName: reportScpName } : {},
          ) as never,
        );
        log('gitm.turnover.carry-a-proof-confirm', { workingBranch: arm.workingBranch });
      }, 1200);
    }
  };

  const armPlan = plan('Gitm Boot Report Watch Arm', ({ stage, conclude }) => [
    // Repeating arm stage — waits on the beat until userCwd is populated and the Bridge dir exists,
    // arms the STANDING watcher ONCE, then iterates to the FT-006 terminal. The watcher persists
    // (does NOT conclude) — the ONE-SHOT is the arm (seatReturnArm.model), not this watcher.
    stage(
      ({ stagePlanner }) => {
        if (bootReportWatcher !== null) {
          stagePlanner.conclude();
          return;
        }
        const userCwd = k_.userCwd.select();
        if (userCwd === '') return; // not yet populated · retry on the next beat
        const bridgeDir = join(userCwd, 'Cascades', 'Bridge');
        if (!existsSync(bridgeDir)) return; // no Bridge dir yet · retry on the next beat
        try {
          bootReportWatcher = watch(fenceWatchTargets('gitmBootReportWatch', [bridgeDir], userCwd), {
            ignored: [/(^|[/\\])\.git([/\\]|$)/],
            ignoreInitial: true,
            persistent: true,
            depth: 0,
            awaitWriteFinish: {
              stabilityThreshold: 300,
              pollInterval: 100,
            },
          });
        } catch (err) {
          console.error('[Gitm BootReportWatch] chokidar.watch failed:', err);
          stagePlanner.conclude();
          return;
        }
        bootReportWatcher.on('error', (err: Error) => {
          console.error('[Gitm BootReportWatch] chokidar error:', err);
        });
        bootReportWatcher.on('add', onBootReportEvent);
        bootReportWatcher.on('change', onBootReportEvent);
        console.log('[Gitm BootReportWatch] armed (standing) on:', bridgeDir);
        log('gitm.seatlaw.boot-report-watch.armed', { bridgeDir });
        // C412 · THE REBOOT REHYDRATION (write-the-attempt / check-the-attempt). The A↔B
        // machine is in-memory — a bridge restart regressed 'turned-over' to the derive's
        // 'candidate-created' (the derive knows branches, not history) and the C326
        // observed-proof circuit went dark. THE CHECK, at arm time, one-shot: read the
        // persisted gitm.json's ATTEMPT LEDGER (turnOverAttempt — written by the advance
        // reducer) + the SCP server's OWN boot report (activeBranch — the running proof
        // the server wrote at boot). A source:'B' attempt whose target MATCHES the
        // reported running branch restores abMode 'turned-over' — the machine survives.
        // THE A-GUARD: a source:'A' attempt NEVER restores merge-enabling state (an
        // A-prove's own success — A written before the seat returns to B — must not
        // register as B-proven; the derive's candidate-created ground is already correct
        // for it). A stale attempt (branch moved/dead/mismatched) falls through — the
        // self-healing derive stays authoritative. The filesystem is the source of truth.
        try {
          // MD-A D3 · SCP BRIDGE SOVEREIGNTY — the GITEP writer lands gitm.json on the CALLING
          // SCP's own Cascades/Bridge/ (activeScpDir), so the rehydration read follows the same
          // resolution ('' → the workspace degrade). The chokidar WATCH above stays on the
          // workspace bridgeDir — the boot reports are workspace-territory; only the gitm.json
          // read moves. Without this follow, a bridge restart starves the A↔B rehydration and
          // the 45s failsafe fires phantom reverts (the C449 class).
          const rehydrateScpDir = k_.activeScpDir.select();
          const gitmBase = rehydrateScpDir !== '' ? rehydrateScpDir : userCwd;
          const gitmJsonPath = join(gitmBase, 'Cascades', 'Bridge', 'gitm.json');
          if (existsSync(gitmJsonPath)) {
            const persisted = JSON.parse(readFileSync(gitmJsonPath, 'utf8')) as {
              turnOverAttempt?: { source?: string; targetBranch?: string; ts?: number } | null;
              stableBranch?: string;
              branchRoles?: { a?: string; b?: string };
            };
            const attempt = persisted.turnOverAttempt ?? null;
            // D-BN · THE branchRoles SWEEP — recognize the B attempt via persisted ROLES EQUALITY
            // (branchRoles.b === attempt.targetBranch), the canonical truth; the `b/`-prefix check is
            // the FALLBACK only when persisted roles are absent (a legacy gitm.json predating the field).
            const persistedRolesPresent =
              persisted.branchRoles !== undefined && typeof persisted.branchRoles.b === 'string';
            const attemptIsWorkingB =
              typeof attempt?.targetBranch === 'string' &&
              (persistedRolesPresent
                ? persisted.branchRoles?.b === attempt.targetBranch
                : attempt.targetBranch.startsWith('b/'));
            // D-BN-2 · THE CARRY MEND — a 'carry-A' attempt is the LEGACY confirmed-carry A-advance whose
            // targetBranch IS the carried B (the reducer wrote branchRoles.b = carriedB). It restores
            // 'turned-over' the SAME way a 'B' attempt does (roles.b === attempt.targetBranch → the
            // boot-report proof gate below) — UNLIKE a plain 'A' attempt, which grounds. Recognizing
            // it here is what makes the carried B survive a bridge restart.
            // C791 · SERVE THE CARRY — a 'carry-B' attempt is the NEW confirmed carry that reboots ONTO
            // the carried B (targetBranch === roles.b). It restores 'turned-over' identically — the app
            // booted on B, so the boot-report proof gate below reads the B seat truthfully.
            const attemptRestoresTurnedOver =
              attempt !== null &&
              (attempt.source === 'B' || attempt.source === 'carry-A' || attempt.source === 'carry-B') &&
              typeof attempt.targetBranch === 'string' &&
              attemptIsWorkingB;
            if (attemptRestoresTurnedOver && attempt && typeof attempt.targetBranch === 'string') {
              // The running proof: the newest boot report's activeBranch (the server wrote
              // what it actually booted on). Sweep the Bridge dir for boot reports.
              // M6 · THE MATCHED-REPORT SWEEP (the C572 multi-SCP find): the old sweep took the
              // FIRST parseable report regardless of WHICH SCP wrote it — with two live citizens,
              // one SCP's attempt was checked against the OTHER's booted branch. Match each
              // report's scpName to the dir being rehydrated; an unmatched sweep falls through
              // honestly (reportedBranch '' → attempt-stale — the derive stays authoritative).
              let reportedBranch = '';
              try {
                for (const f of readdirSync(bridgeDir)) {
                  if (!BOOT_REPORT_PATTERN.test(f)) continue;
                  const rep = JSON.parse(readFileSync(join(bridgeDir, f), 'utf8')) as {
                    activeBranch?: unknown;
                    scpName?: unknown;
                  };
                  if (typeof rep.activeBranch !== 'string' || rep.activeBranch.length === 0) continue;
                  if (rehydrateScpDir !== '') {
                    const repDir =
                      typeof rep.scpName === 'string' && rep.scpName !== ''
                        ? resolveScpNameToDir(rep.scpName, userCwd)
                        : '';
                    if (repDir !== rehydrateScpDir) continue; // another citizen's boot — not this proof
                  }
                  reportedBranch = rep.activeBranch;
                  break;
                }
              } catch { /* report unreadable → fall through */ }
              if (reportedBranch === attempt.targetBranch) {
                const bh = getActiveScsBridgeMuxiumHandle();
                if (bh !== null) {
                  const gitmDeck = bh.muxium.deck.d.gitm;
                  // D-BN · THE branchRoles SWEEP — carry the persisted canonical roles back so the
                  // rehydrated state is LOCKSTEP. M6 · THE ROLES COHERENCE GUARD (the C572 chimera
                  // residue): persisted roles are trusted ONLY when a === the persisted stableBranch
                  // (roles and stable are written lockstep by every legitimate writer — a mismatch
                  // is chimera-era residue in the file, e.g. IE carrying PE's pair). Incoherent anor
                  // absent → reconstruct from the A/B facts this restore already verified
                  // (a=persisted stable, b=the proven target).
                  const persistedStable =
                    typeof persisted.stableBranch === 'string' ? persisted.stableBranch : '';
                  const rolesCoherent =
                    persistedRolesPresent &&
                    persistedStable !== '' &&
                    persisted.branchRoles?.a === persistedStable;
                  const rehydratedRoles = rolesCoherent
                    ? {
                        a: typeof persisted.branchRoles?.a === 'string' ? persisted.branchRoles.a : '',
                        b: typeof persisted.branchRoles?.b === 'string' ? persisted.branchRoles.b : '',
                      }
                    : {
                        a: persistedStable,
                        b: attempt.targetBranch,
                      };
                  // M6 · THE REHYDRATION SLICE-MIRROR (the M4 pattern completed) — the restored A/B
                  // state lands on the rehydrated SCP's OWN slice, so its rail carries the truth even
                  // if the pointer moves before (anor while) the flat dispatch below lands.
                  if (rehydrateScpDir !== '') {
                    upsertSliceFields(rehydrateScpDir, {
                      abMode: 'turned-over' as GitmABMode,
                      turnedOverTo: 'B',
                      lastTurnOverResult: 'success',
                      workingBranch: attempt.targetBranch,
                      ...(persistedStable !== '' ? { stableBranch: persistedStable } : {}),
                      branchRoles: rehydratedRoles,
                    });
                  }
                  bh.muxium.dispatch(
                    gitmDeck.e.gitmRehydrateAbState({
                      abMode: 'turned-over',
                      turnedOverTo: 'B',
                      lastTurnOverResult: 'success',
                      workingBranch: attempt.targetBranch,
                      stableBranch: persistedStable !== '' ? persistedStable : undefined,
                      branchRoles: rehydratedRoles,
                      // M6 · the origin dir — the reducer gates the flat write to the pointer.
                      originScpDir: rehydrateScpDir,
                    }) as never,
                  );
                  log('gitm.rehydrate', {
                    verdict:
                      attempt.source === 'carry-A'
                        ? 'restored-carry-a-turnover'
                        : attempt.source === 'carry-B'
                          ? 'restored-carry-b-turnover'
                          : 'restored-b-turnover',
                    attempt,
                    reportedBranch,
                    rolesCoherent,
                  });
                } else {
                  log('gitm.rehydrate', { verdict: 'no-live-handle', attempt, reportedBranch });
                }
              } else {
                log('gitm.rehydrate', { verdict: 'attempt-stale-fell-through', attempt, reportedBranch });
              }
            } else if (attempt) {
              log('gitm.rehydrate', { verdict: 'a-attempt-ground', attempt });
            } else {
              // THE RESTART CONTINUITY LAW (division of labor · honest note): 'no-attempt' means the
              // last Lambda was NOT a B/carry-A turn-over — so THIS one-shot (a TURN-OVER-PROOF
              // rehydration) legitimately restores nothing. The CONTINUITY restore of the last
              // selected registration (stable · working · roles · abMode) is now owned by
              // gitmAutoInductAB's persisted-first gate (the bind seam · fired before this beat), NOT
              // here. This branch remains authoritative ONLY for in-flight B turn-over proofs.
              log('gitm.rehydrate', { verdict: 'no-attempt' });
            }
          }
        } catch (err) {
          log('gitm.rehydrate', { verdict: 'error', error: String(err) });
        }
        stagePlanner.conclude();
      },
      { beat: 500 },
    ),
    conclude(),
  ]);
  void armPlan;

  // MD-E (THE C318 FOLD · THE BRIDGE-OWNED DEADLINE) — the standing FLOOR beat. A source:'A'
  // turn-over that carried a working B armed BOTH the seat-return arm AND the 45s deadline
  // (bridgeOwnedDeadline.model). The boot-report watcher above DISARMS the deadline the moment ANY
  // report lands (the SCP booted). If NO report arrives within 45s — A never booted, the observed
  // failure — this beat fires the FLOOR: disarm (one-shot · re-entrancy guard), dispatch
  // gitmRevertToStable via the LIVE handle (commit B if dirty → switch A → restart), stamp the
  // outcome (updateStatus note · the never-silent rule) + log gitm.deadline.reverted. The C319
  // client pulse remains the AWARENESS layer; THIS is the floor. Non-concluding stage (a monitoring
  // beat · never stagePlanner.conclude() so it polls each tick · mirror the location-dial WGHA beat).
  const deadlinePlan = plan('Gitm Bridge Owned Deadline', ({ stage }) => [
    stage(() => {
      if (!isDeadlinePassed()) return; // no arm ANOR window not yet elapsed · retry next beat
      const arm = readDeadlineArm();
      // DISARM FIRST (one-shot · re-entrancy — a second beat must not re-fire the revert).
      disarmDeadline();
      const bh = getActiveScsBridgeMuxiumHandle();
      if (bh === null) {
        // No live handle to revert through — log and move on (the arm is already cleared; a later
        // turn-over re-arms). Never silent.
        log('gitm.deadline.reverted', { fired: false, reason: 'no-live-handle', stableBranch: arm?.stableBranch ?? '' });
        return;
      }
      const gitmDeck = bh.muxium.deck.d.gitm;
      // Stamp the outcome onto the Update rail FIRST (the never-silent rule — the strip/panel shows
      // WHY the app reverted before the revert restarts it).
      bh.muxium.dispatch(
        gitmDeck.e.gitmScpUpdateProgress({
          note: 'B did not boot within the deadline — reverted to ground',
        } as GitmScpUpdateProgressPayload) as never,
      );
      // Fire the failsafe (commit B if dirty → switch A → restart). Empty payload.
      bh.muxium.dispatch(gitmDeck.e.gitmRevertToStable({}) as never);
      log('gitm.deadline.reverted', { fired: true, stableBranch: arm?.stableBranch ?? '' });
      console.log('[Gitm BootReportWatch] DEADLINE — B did not boot within 45s · reverted to stable ground');
    }, { beat: 1000 }),
  ]);
  void deadlinePlan;
};
