/**
 * gitmWorktreeAdd Quality · THE SCP COMMAND MENU (W3 · THE WORKTREE RAIL) · git worktree add + REGISTER
 *
 * THE MULTIPLICATION (the macro rung): the user spawns AS MANY of one SCP as they want — each worktree
 * = a spawnable SCP INSTANCE. This quality creates a worktree of the CALLING SCP's repo AND registers
 * it as a FIRST-CLASS SCPs.json citizen (own name/path/port + re-stamped scp.config.json), the one move
 * that closes the three highest risks at once (R1 name collision · R2 port-pair crash · R3 FKIS
 * mis-route · D-SCM-W3 §5 top-3). The parent SCP and the instance SHARE object history but are DISTINCT
 * registry citizens — the individuation the Base/Muxified principle predicts.
 *
 * THE IDENTITY SCHEME (D-SCM-W3 §3e · SETTLED): instanceName = `${scpName}--wt-${branchSlug}` (branch
 * with `/`→`-`). The instance is placed as a SIBLING citizen dir under the install root's scps/,
 * mirroring the citizen shape (the checkout's SCP/ subdir is the spawn cwd). scp.config.json in the
 * worktree is re-stamped to the instance name (the same writer shape as scpInstall.ts:1155-1158) so the
 * FKIS origin guard resolves the instance's OWN dir.
 *
 * GUARDS (D-SCM-W3 §3h · the danger map):
 *   1. ORIGIN RESOLVABLE + HAS OWN .git — the target must be an installed citizen with its OWN git
 *      toplevel DISTINCT from the dev root (dev:self template has NO own .git → a worktree is
 *      meaningless · R8 · named guard 'worktree-origin-no-git').
 *   2. BRANCH EXISTS — slice-first roster (the C592 existence law · verbatim, NO resolveStableRoot
 *      rewrite of an explicit pick · the user law). A missing branch → 'worktree-branch-not-found'.
 *   3. TARGET INSTANCE DIR FREE — the sibling dir must not already exist ('worktree-target-dir-exists').
 *   4. INSTANCE NAME COLLISION-FREE — no SCPs.json entry may already carry the instanceName
 *      ('worktree-instance-name-taken' · R1).
 *
 * THE B-HOP COMPOSITION SEAM (D-SCM-W4 §4c): the add is a checkout-into-a-NEW-tree — A's HEAD is
 * untouched, and this quality NEVER writes .bridge-restart.json into the A tree (that would restart A
 * onto B's branch — the exact wrong-branch hazard gitmTurnOverWithSource warns of). Purely additive.
 *
 * WRITES: worktree add (via gitmExec) → SCPs.json entry (buildScpRegistryEntry → appendScpEntry) →
 * port (pickPortFromRegistry → updateScpStatus) → writeScpRegistry → scp.config.json re-stamp. The
 * reducer lands the outcome surface only (the git tree + the SCPs.json/scp.config.json writes are the
 * durable products · Shortest-Path partial return). Long-op latch around the exec (worktree add clones
 * a working tree · slow) so the progress rail shows it.
 *
 * Template: gitmBranchCreate.quality.ts (the create-op bucket · inline outcome) · gitmAssignRole
 *   .quality.ts (the origin thread · slice-first roster read) · scpInstall.ts:1155-1158 (the
 *   scp.config.json re-stamp writer shape) · scpPersistence.ts (the immutable registry mutators).
 * Citation: D-SCM-W3-WORKTREE-GROUNDING.md §3c-3h · §4 (the B-hop composition) · §5 (risks R1/R2/R3/R8).
 */

import {
  createQualityCardWithPayload,
  createMethodWithConcepts,
  selectPayload,
  muxiumConclude,
  strategySuccess,
  strategyData_muxifyData,
  type Concept,
} from 'stratimux';
import { existsSync, writeFileSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { basename, dirname, join, relative } from 'node:path';
import type { GitmState } from '../gitm.types';
import type { GitmWorktreeAddPayload, GitmWorktreeAdd, GitmActionResult } from './types';
import { gitmExec, setCurrentOp, clearCurrentOp } from '../model/gitmExec.model';
import { resolveGitmTargetCwd } from '../model/gitmOpCwd.model';
import {
  readScpRegistry,
  writeScpRegistry,
  appendScpEntry,
  updateScpStatus,
  buildScpRegistryEntry,
  pickPortFromRegistry,
} from '../../../../scp/scpPersistence';
import { SCP_CONFIG_FILENAME } from '../../../scpConfig.model';
import { setScpStatus } from '../../../scpSessionRegistry';
import { log } from '../../../debugLog';

export type { GitmWorktreeAdd };

interface WorktreeAddBucketItem {
  result: GitmActionResult;
  // C652 · THE HONEST-FAILURE RELAY — a guard/exec failure lands errorCode/errorMessage (the
  // gitmBranchCreate precedent · the ONLY relayed reveal channel for the create leg, since
  // lastActionResult is a WITNESS not a relayed GitmStatusSnapshot field). Absent (undefined) on the
  // SUCCESS path so the reducer does not double-write '' churn (the next STARC read clears any stale).
  errorCode?: string;
  errorMessage?: string;
}

const bucket: WorktreeAddBucketItem[] = [];

type GitmSelfDeck = {
  gitm: Concept<GitmState, Record<string, unknown>>;
};

// Slug a branch the way the b/-lineage discipline does: `/`→`-`. Leaves the rest verbatim (an
// explicit pick is honored · the C596 user law).
const slugBranch = (branch: string): string => branch.replace(/\//g, '-');

export const gitmWorktreeAdd = createQualityCardWithPayload<
  GitmState,
  GitmWorktreeAddPayload,
  GitmSelfDeck
>({
  type: 'Gitm Worktree Add',
  reducer: (state) => {
    const item = bucket.pop();
    if (!item) {
      return {};
    }
    // THE SHORTEST-PATH PARTIAL RETURN — the git tree + the registry/config writes are the durable
    // products (side-effected in the method); only the outcome surface lands on state. C652 · a
    // FAILURE also lands errorCode/errorMessage (the relayed reveal channel) so the client bar
    // surfaces the honest failure line; SUCCESS omits them (no '' churn · the STARC read clears stale).
    if (item.errorCode !== undefined) {
      return {
        lastActionResult: item.result,
        errorCode: item.errorCode,
        errorMessage: item.errorMessage ?? '',
      };
    }
    return { lastActionResult: item.result };
  },
  methodCreator: () =>
    createMethodWithConcepts(({ action, deck }) => {
      const { branch, instanceSlug, originScpName } = selectPayload<GitmWorktreeAddPayload>(action);
      const opCwd = resolveGitmTargetCwd(deck, originScpName);
      const userCwd = deck.gitm.k.userCwd.select();

      const guardOut = (reason: string, error = ''): ReturnType<typeof muxiumConclude> => {
        const guard: GitmActionResult = {
          action: 'gitmWorktreeAdd',
          ok: false,
          error,
          guardFired: true,
          reason,
          at: Date.now(),
        };
        log('gitm.worktree.add.guard', { reason, branch, opCwd });
        // C652 · THE HONEST-FAILURE RELAY — a guard also lands errorCode/errorMessage (the reason as
        // the relayed reveal · e.g. 'worktree-instance-name-taken') so the client staged bar surfaces
        // an inline failure line instead of a stuck bar. errorMessage prefers the git error, else the
        // guard reason (a human-legible token · the panel reads whichever is present).
        bucket.push({
          result: guard,
          errorCode: 'GITM_WORKTREE_ADD_GUARD',
          errorMessage: error !== '' ? error : reason,
        });
        return action.strategy
          ? strategySuccess(action.strategy, strategyData_muxifyData(action.strategy, { ...guard, branch }))
          : muxiumConclude();
      };

      const name = branch.trim();
      if (name.length === 0) return guardOut('worktree-branch-empty');

      // GUARD 1 · ORIGIN HAS OWN .git — the git toplevel of opCwd. dev:self (the template) has NO own
      // .git → --show-toplevel returns the DEV root (userCwd), NOT the SCP's own citizen dir. A worktree
      // of the dev repo is meaningless (R8): refuse honestly. An installed citizen's toplevel is its
      // OWN dir (the parent of SCP/ · DISTINCT from userCwd).
      const topProbe = gitmExec(['rev-parse', '--show-toplevel'], opCwd);
      if (!topProbe.ok) return guardOut('worktree-origin-no-git', topProbe.error || topProbe.stderr);
      const citizenTop = topProbe.stdout.trim();
      if (citizenTop === '' || citizenTop === userCwd) {
        return guardOut('worktree-origin-no-git');
      }

      // GUARD 2 · BRANCH FORK (C652 · THE CREATE LEG · the user design law) — the existence check
      // becomes a FORK, authoritative via a git rev-parse probe (NOT the slice roster — the slice can
      // lag a just-typed fresh slug, and MULTIPLY's whole point is a branch that does NOT yet exist).
      //   branch EXISTS (rev-parse --verify succeeds) → plain `worktree add <dir> <branch>` (unchanged).
      //   branch ABSENT → MULTIPLY MINTS B-CLASS LINEAGE: `worktree add -b <branch> <dir> HEAD` — the
      //   branch is CREATED WITH the tree in one motion, based from the origin's current seat HEAD.
      // The existence guard is NOT removed — it FORKS. `git worktree add` STILL enforces the honest
      // guard for an existing branch already checked out in ANOTHER tree (its own 'already checked out'
      // error surfaces verbatim via the !exec.ok branch below · we do not pre-empt it).
      const branchProbe = gitmExec(['rev-parse', '--verify', '--quiet', `refs/heads/${name}`], citizenTop);
      const branchExists = branchProbe.ok && branchProbe.stdout.trim() !== '';

      // THE INSTANCE IDENTITY (D-SCM-W3 §3e) — `${originName}--wt-${slug}`. The originName is the
      // registry-resolved name (the caller's own SCPs.json entry) so the instance individuates from a
      // real citizen; fall back to the citizen dir's basename when no name is supplied (dev/agent path).
      const slug = slugBranch((instanceSlug ?? name).trim());
      const registryPre = readScpRegistry(userCwd !== '' ? userCwd : process.cwd());
      const parentEntry =
        (originScpName !== undefined && registryPre.scps.find((s) => s.name === originScpName)) ||
        registryPre.scps.find((s) => citizenTop.endsWith(dirname(s.path)) || s.path.endsWith(basename(citizenTop)));
      const originName = parentEntry ? parentEntry.name : basename(citizenTop);
      const instanceName = `${originName}--wt-${slug}`;

      // GUARD 4 · INSTANCE NAME COLLISION-FREE (R1) — no SCPs.json entry may already own it.
      if (registryPre.scps.some((s) => s.name === instanceName)) {
        return guardOut('worktree-instance-name-taken');
      }

      // THE PLACEMENT (D-SCM-W3 §3c) — a SIBLING citizen dir under the same install root's scps/,
      // mirroring the citizen shape. The instance dir sits beside citizenTop; its SCP/ subdir is the
      // spawn cwd. (The origin's own package is a `SCP/` subdir of citizenTop · the --show-prefix case.)
      const instanceDir = join(dirname(citizenTop), instanceName);

      // GUARD 3 · TARGET INSTANCE DIR FREE — never clobber an existing tree.
      if (existsSync(instanceDir)) {
        return guardOut('worktree-target-dir-exists');
      }

      // ── EXEC · THE BRANCH+TREE LEG (C652 · the FORK) — from the citizen toplevel · a NEW tree
      //    sharing the SAME object store · A's HEAD untouched. NEVER writes .bridge-restart.json into
      //    the A tree (the B-hop composition seam · §4c). Long-op latch (it clones a working tree).
      //      branchExists → `git worktree add <dir> <branch>`        (plain add · the C619 form).
      //      absent       → `git worktree add -b <branch> <dir> HEAD` (MINT B-class lineage + tree in
      //                     one motion · based from the origin's seat HEAD · the user design law).
      //    THE STAGED SPINE (C652 · MEND A telemetry) — per-stage logs (branch → tree → registry →
      //    config) are the observable rail the client bar rides via the relay even when it cannot see
      //    the log directly (the -leg's progress latch + the roster surfacing carry the same beats).
      log('gitm.worktree.add.stage', {
        stage: 'branch',
        instanceName,
        branch: name,
        exists: branchExists,
      });
      const addArgs = branchExists
        ? ['worktree', 'add', instanceDir, name]
        : ['worktree', 'add', '-b', name, instanceDir, 'HEAD'];
      log('gitm.worktree.add.stage', { stage: 'tree', instanceName, mint: !branchExists });
      setCurrentOp({
        message: branchExists ? 'Adding worktree instance…' : 'Minting branch + worktree instance…',
        command: `git ${addArgs.join(' ')}`,
      });
      let exec;
      try {
        exec = gitmExec(addArgs, citizenTop);
      } finally {
        clearCurrentOp();
      }
      if (!exec.ok) {
        const error = exec.error || exec.stderr;
        const result: GitmActionResult = {
          action: 'gitmWorktreeAdd',
          ok: false,
          error,
          guardFired: false,
          reason: '',
          at: Date.now(),
        };
        // THE HONEST-FAILURE RELAY (C652) — an existing branch already checked out in another tree
        // (git's own enforcement · surfaced verbatim), a mint collision, etc. Land errorCode/
        // errorMessage on the FAILURE path (the gitmBranchCreate precedent) so the relayed
        // GitmStatusSnapshot carries the reveal to the client bar (lastActionResult is a WITNESS,
        // not a relayed field · errorCode/errorMessage ARE relayed).
        log('gitm.worktree.add.exec-fail', { instanceName, error });
        bucket.push({ result, errorCode: 'GITM_WORKTREE_ADD_FAILED', errorMessage: error });
        return action.strategy
          ? strategySuccess(action.strategy, strategyData_muxifyData(action.strategy, { ...result }))
          : muxiumConclude();
      }

      // ── THE REGISTRATION LEGS (D-SCM-W3 §3g · reuse the immutable mutators):
      //    entry (relative path from userCwd) → append → port allocate → status/port stamp → write.
      log('gitm.worktree.add.stage', { stage: 'registry', instanceName });
      const wtPackageDir = join(instanceDir, 'SCP');
      const installPath = userCwd !== '' ? relative(userCwd, wtPackageDir) : wtPackageDir;
      const entry = buildScpRegistryEntry({
        name: instanceName,
        conceptName: parentEntry?.conceptName ?? originName,
        installPath,
        templateVersion: parentEntry?.templateVersion ?? '0.1.0',
        status: 'installed',
      });
      const registryWithEntry = appendScpEntry(registryPre, entry);
      // R2 · PORT — allocate a FRESH port-pair (the stride-2 allocator's used-set spans all entries;
      // the new entry has boundBridgePort:null so it does not pre-consume · pick then stamp).
      const port = pickPortFromRegistry(registryWithEntry);
      const registryFinal = updateScpStatus(registryWithEntry, instanceName, 'installed', undefined, port);
      writeScpRegistry(registryFinal, userCwd !== '' ? userCwd : process.cwd());

      // ── THE scp.config.json RE-STAMP (R3/FKIS · same writer shape as scpInstall.ts:1155-1158) —
      //    the worktree carries the parent's `{ scpName }`; overwrite it with the INSTANCE identity so
      //    the origin guard resolves the instance's OWN dir. Best-effort (the env-first path remains).
      log('gitm.worktree.add.stage', { stage: 'config', instanceName });
      try {
        const scpConfigPath = join(wtPackageDir, SCP_CONFIG_FILENAME);
        writeFileSync(
          scpConfigPath,
          JSON.stringify({ scpName: instanceName }, null, 2) + '\n',
          'utf8',
        );
      } catch {
        /* non-fatal · the SCP falls back to env-first origin resolution if the stamp is absent */
      }

      // ── C653 · THE ASYNC INSTALL LEG (MEND A · the skipped step) — a `git worktree add` tree
      //    carries only TRACKED files (package.json but NO node_modules), so the instance's SCP
      //    package cannot boot (`sh: vite: command not found`) until dependencies land. Register
      //    the instance's PSSM status as 'installing' (NOT 'pending' — it is not yet spawnable),
      //    then spawn `npm install` NON-BLOCKING in the instance SCP package dir. NEVER execSync a
      //    30-60s install inside the method (it would freeze the render loop + the reducer); we
      //    MIRROR the scpInstall.ts:1433-1440 spawn shape (per-platform npm.cmd on win32, stdio
      //    'ignore' — the add returns immediately, the install rides async). On exit 0 → flip the
      //    PSSM status to 'pending' (boot-spawnable · the helm's INSTALL tick clears, Spawn enables).
      //    On failure → log install-failed AND STILL flip to 'pending' (never a stuck 'installing' —
      //    the boot will surface the real error honestly). Telemetry stages: install-start /
      //    install-done / install-failed (the observable rail the client bar rides via the roster).
      log('gitm.worktree.add.stage', { stage: 'install-start', instanceName });
      void setScpStatus(instanceName, 'installing').catch((err: unknown) => {
        log('gitm.worktree.add.install-status-fail', { instanceName, error: String(err) });
      });
      try {
        const installChild = spawn(
          process.platform === 'win32' ? 'npm.cmd' : 'npm',
          ['install'],
          { cwd: wtPackageDir, stdio: 'ignore' },
        );
        installChild.on('error', (err) => {
          // spawn-launch failure (e.g. npm not on PATH) — log AND still flip to 'pending' so the
          // instance is never stuck 'installing'; the boot surfaces the real dependency error.
          log('gitm.worktree.add.stage', {
            stage: 'install-failed',
            instanceName,
            code: -1,
            error: String(err),
          });
          void setScpStatus(instanceName, 'pending').catch((e: unknown) => {
            log('gitm.worktree.add.install-status-fail', { instanceName, error: String(e) });
          });
        });
        installChild.on('close', (code) => {
          if (code === 0) {
            log('gitm.worktree.add.stage', { stage: 'install-done', instanceName, code });
          } else {
            // Non-zero exit — log install-failed but STILL flip to 'pending' (honest surfacing at
            // boot beats a permanently 'installing' row).
            log('gitm.worktree.add.stage', {
              stage: 'install-failed',
              instanceName,
              code: code ?? -1,
            });
          }
          void setScpStatus(instanceName, 'pending').catch((e: unknown) => {
            log('gitm.worktree.add.install-status-fail', { instanceName, error: String(e) });
          });
        });
      } catch (err) {
        // Synchronous spawn throw (extremely rare) — never leave the instance 'installing'.
        log('gitm.worktree.add.stage', {
          stage: 'install-failed',
          instanceName,
          code: -1,
          error: String(err),
        });
        void setScpStatus(instanceName, 'pending').catch((e: unknown) => {
          log('gitm.worktree.add.install-status-fail', { instanceName, error: String(e) });
        });
      }

      const result: GitmActionResult = {
        action: 'gitmWorktreeAdd',
        ok: true,
        error: '',
        guardFired: false,
        reason: '',
        at: Date.now(),
      };
      log('gitm.worktree.add.registered', { instanceName, installPath, port, branch: name });
      bucket.push({ result });
      return action.strategy
        ? strategySuccess(
            action.strategy,
            strategyData_muxifyData(action.strategy, { ...result, instanceName, port }),
          )
        : muxiumConclude();
    }),
});
