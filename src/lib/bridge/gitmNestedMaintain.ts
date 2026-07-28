/**
 * GITM SCP-SOVEREIGN · Nested-Git Maintain Seam · ensureNestedGitStructure
 *
 * The single idempotent maintain pass for the SCP-sovereign nested-git model (the SCP turns over
 * ONLY its own RED repo · the Cascade BLUE repo is DROPPED for no-embed safety):
 *   - ensure the Base .gitignore contains `Cascades/`   (Base ignores the Cascade workspace)
 *   - ensure Cascades/.gitignore contains `scps/`        (Cascade ignores the SCP repos)
 *   - write Cascades/.keep                               (the user-tree anchor · gitignore AND keep)
 *   - write each SCP package .gitignore THEN `git init`  (the RED repos · source-scoped count)
 *
 * FRESH-INSTALL-ONLY (Decision A · the load-bearing safety guard): the pass DETECTS a
 * Base-tracked Cascades/ (the live dev repo + any project whose Base already version-controls
 * Cascades/) and SKIPS the conversion ENTIRELY — it NEVER runs `git rm --cached`, NEVER
 * auto-migrates. Adding `Cascades/` to .gitignore does NOT untrack already-tracked files;
 * the real migration would need `git rm -r --cached Cascades/`, which would orphan hundreds
 * of committed docs mid-development. So when Base tracks Cascades/, we log
 * `skipped: dev-repo / tracked-cascades` and leave the repo untouched. New/clean installs
 * (where Cascades/ is scaffolded clean, never Base-tracked) get the nested structure.
 *
 * Framework-free (NO Stratimux imports) — `execFileSync` + node:fs, mirroring the
 * gitmStatus.model.ts STARC discipline + the scpInstall.ts Step-6b git-init pattern.
 * Idempotent throughout (append-if-absent gitignore lines · rev-parse-guarded git init) ·
 * non-fatal (a failure leaves the location un-nested; the badge falls back to the baseline).
 *
 * Citation: gitmStatus.model.ts (framework-free execFileSync) · scpInstall.ts:952-976
 *           (idempotent rev-parse-guarded git init) · GITM-3LOC-S3-OCHRE.md Wave B.
 */

import { execFileSync } from 'node:child_process';
import {
  existsSync,
  readFileSync,
  writeFileSync,
  readdirSync,
  statSync,
  realpathSync,
} from 'node:fs';
import { join } from 'node:path';
import {
  GITM_BASE_GITIGNORE_LINE,
  GITM_CASCADE_GITIGNORE_LINE,
  GITM_CASCADE_BRIDGE_GITIGNORE_LINE,
  GITM_GITIGNORE_BOUNDARY_COMMENT,
} from './installConstants';

export type NestedMaintainResult = {
  baseGitignoreEnsured: boolean; // 'Cascades/' present in the Base .gitignore after the pass
  cascadeGitignoreEnsured: boolean; // 'scps/' present in Cascades/.gitignore after the pass
  // GITM SCP-SOVEREIGN — the Cascade BLUE repo init is DROPPED (no-embed safety · cascadeRepoInit
  // field removed). The boundary is the gitignore + the .keep anchor, NOT a nested Cascades/.git.
  keepEnsured: boolean; // Cascades/.keep present (the gitignored-Cascade anchor in the user tree)
  scpReposInit: string[]; // SCP dirs that are now their own RED repos (init'd or already)
  skipped: boolean; // the fresh-install-only guard tripped (Base tracks Cascades/)
  reason: string; // human-readable summary (the log line)
};

// ────────────────────────────────────────────────
// SMALL FRAMEWORK-FREE GIT HELPERS (each a mini-Concluder · all non-fatal)
// ────────────────────────────────────────────────

function gitOutput(dir: string, args: string[]): string {
  return execFileSync('git', args, { cwd: dir, encoding: 'utf8', stdio: 'pipe' }).trim();
}

function gitRun(dir: string, args: string[]): void {
  execFileSync('git', args, { cwd: dir, stdio: 'pipe' });
}

// `git rev-parse --show-toplevel` resolves to the work-tree root of whatever repo owns `dir`.
// The realpath compare distinguishes "dir is its OWN repo root" from "dir is inside a parent's
// work tree" — load-bearing: Cascades/ inside a Base repo reports the BASE toplevel, not itself.
function gitToplevel(dir: string): string | null {
  try {
    const top = gitOutput(dir, ['rev-parse', '--show-toplevel']);
    if (!top) return null;
    return realpathSync(top);
  } catch {
    return null;
  }
}

function isOwnRepoRoot(dir: string): boolean {
  const top = gitToplevel(dir);
  if (top === null) return false;
  let dirReal: string;
  try {
    dirReal = realpathSync(dir);
  } catch {
    return false;
  }
  return top === dirReal;
}

// Decision A · the fresh-install-only guard. Returns true when the Base repo ALREADY tracks
// files under Cascades/ — the dev-repo / tracked-cascades case → SKIP the conversion entirely.
// Uses `git ls-files Cascades/` (the first tracked path is enough); empty stdout = not tracked.
function baseTracksCascades(baseDir: string): boolean {
  try {
    const out = gitOutput(baseDir, ['ls-files', 'Cascades/']);
    return out.length > 0;
  } catch {
    // baseDir is not a git repo (or git unavailable) → nothing tracked → safe to nest.
    return false;
  }
}

// Append-if-absent for a single .gitignore line (idempotent). Creates the file if absent.
// Returns true when the line is present after the pass.
function ensureGitignoreLine(gitignorePath: string, line: string): boolean {
  let body = '';
  if (existsSync(gitignorePath)) {
    try {
      body = readFileSync(gitignorePath, 'utf8');
    } catch {
      return false;
    }
  }
  const target = line.trim();
  const present = body
    .split('\n')
    .map((l) => l.trim())
    .some((l) => l === target);
  if (present) return true;
  const needsNewline = body.length > 0 && !body.endsWith('\n');
  const addition = `${needsNewline ? '\n' : ''}${GITM_GITIGNORE_BOUNDARY_COMMENT}\n${line}\n`;
  try {
    writeFileSync(gitignorePath, body + addition, 'utf8');
    return true;
  } catch {
    return false;
  }
}

// GITM SCP-SOVEREIGN — write an empty Cascades/.keep (idempotent · existsSync-gated). The user's
// Base .gitignore ignores Cascades/, so a fresh clone / git clean -fd would drop the Cascade mount
// point entirely; the .keep is the user-tree anchor (the "gitignore AND keep" directive). Non-fatal.
function ensureKeepFile(cascadeDir: string): boolean {
  const keepPath = join(cascadeDir, '.keep');
  if (existsSync(keepPath)) return true;
  try {
    writeFileSync(keepPath, '', 'utf8');
    return true;
  } catch {
    return false;
  }
}

// GITM SCP-SOVEREIGN — write the SCP package's own .gitignore (node_modules/, dist/, the restart
// trigger, tsbuildinfo) BEFORE the RED `git add -A` so the badge counts SCP SOURCE, not the ~12,968
// over-tracked dependency files (S4 Seam D). Idempotent (append-if-absent per line). The SCP RED repo
// root is the <name>/ parent; the package's node_modules/dist live under <name>/SCP/, so the ignore
// must be written into the package dir (where those paths are) for `git add -A` from the parent to skip
// them. Non-fatal. Mirrors ensureGitignoreLine append discipline.
function ensureScpGitignore(scpRepoDir: string): boolean {
  // scpRepoDir is the RED repo root (<name>/). The package is <name>/SCP/ — write the .gitignore
  // there if it exists, else at the repo root (covers both layouts). The ignore lines are relative
  // so they match regardless of which level holds the .gitignore.
  const packageDir = join(scpRepoDir, 'SCP');
  const target = existsSync(packageDir) ? packageDir : scpRepoDir;
  const gitignorePath = join(target, '.gitignore');
  // .bridge-* are the bridge's own per-boot artifacts (restart trigger, the detect sentinel) —
  // ignore them so a fresh boot reads 0 changes, not a phantom `.bridge-detect.sentinel`.
  // MD-A D1 · SCP Bridge Sovereignty: Cascades/Bridge/ is the SCP's own bridge rail (per-SCP
  // bridge.json + gitm.json, bridge-written runtime state) — without this entry the RED repo
  // tracks the churn and the sovereign badge runs permanently dirty. Heals existing installs
  // idempotently on every maintain pass; new installs ship it via the template .gitignore.
  const lines = ['node_modules/', 'dist/', '.bridge-restart.json', '.bridge-detect.sentinel', '*.tsbuildinfo', 'Cascades/Bridge/'];
  let allOk = true;
  for (const line of lines) {
    if (!ensureGitignoreLine(gitignorePath, line)) allOk = false;
  }
  return allOk;
}

// rev-parse-guarded `git init` for a location (idempotent · non-fatal). Inits + makes a first
// commit ONLY when `dir` is NOT already its own repo root. Mirrors scpInstall.ts:967-972.
function ensureGitRepo(dir: string, commitMsg: string): boolean {
  if (!existsSync(dir)) return false;
  if (isOwnRepoRoot(dir)) return true; // already its own repo
  try {
    gitRun(dir, ['init']);
    gitRun(dir, ['add', '-A']);
    gitRun(dir, [
      '-c',
      'user.name=SCS',
      '-c',
      'user.email=scs@local',
      'commit',
      '-m',
      commitMsg,
    ]);
    return isOwnRepoRoot(dir);
  } catch {
    // Init/commit failed (e.g. nothing to commit, permissions) — re-check: an init that
    // succeeded but had nothing to commit still leaves dir as its own repo root.
    return isOwnRepoRoot(dir);
  }
}

// Enumerate the present SCP directories under Cascades/scps/ (each is a `<name>/` dir that
// is NOT .staging and NOT a dotfile). Each becomes its own RED repo.
function listScpDirs(scpsRoot: string): string[] {
  if (!existsSync(scpsRoot)) return [];
  let entries: string[];
  try {
    entries = readdirSync(scpsRoot);
  } catch {
    return [];
  }
  const dirs: string[] = [];
  for (const name of entries) {
    if (name.startsWith('.')) continue; // .staging, .gitignore, etc.
    const full = join(scpsRoot, name);
    try {
      if (statSync(full).isDirectory()) dirs.push(full);
    } catch {
      /* skip unreadable entry */
    }
  }
  return dirs;
}

// ────────────────────────────────────────────────
// THE SINGLE IDEMPOTENT MAINTAIN PASS
// ────────────────────────────────────────────────

export function ensureNestedGitStructure(
  userCwd: string,
  opts?: { scpName?: string; stamp?: string },
): NestedMaintainResult {
  const cascadeDir = join(userCwd, 'Cascades');
  const scpsRoot = join(cascadeDir, 'scps');

  // The nested-repo initial commit message — dated when the install threads a stamp through, so a
  // freshly-init'd SCP RED repo carries Time and Date (the user's ask). Boot/spawn re-maintain
  // passes nothing → the idempotency guard (isOwnRepoRoot) skips already-init repos, so the
  // generated fallback stamp only ever lands on a genuinely-fresh repo here.
  const nestedCommitMsg = `SCS: initialize ${opts?.scpName ?? 'location'} — ${opts?.stamp ?? new Date().toISOString()}`;

  const result: NestedMaintainResult = {
    baseGitignoreEnsured: false,
    cascadeGitignoreEnsured: false,
    keepEnsured: false,
    scpReposInit: [],
    skipped: false,
    reason: '',
  };

  // Nothing to nest if there is no Cascades/ directory yet.
  if (!existsSync(cascadeDir)) {
    result.skipped = true;
    result.reason = 'skipped: no-cascades-dir';
    return result;
  }

  // Decision A · FRESH-INSTALL-ONLY guard. If the Base ALREADY tracks Cascades/ (the dev repo
  // or any project version-controlling its Cascades/), SKIP the conversion entirely — never
  // `git rm --cached`, never auto-migrate. Only when Cascades/ is its own repo already do we
  // still maintain (a clean install that already nested) — but a Base-tracked Cascades/ that
  // is NOT its own repo is the dev-repo case we must leave untouched.
  const cascadeIsOwnRepo = isOwnRepoRoot(cascadeDir);
  if (!cascadeIsOwnRepo && baseTracksCascades(userCwd)) {
    result.skipped = true;
    result.reason = 'skipped: dev-repo / tracked-cascades';
    return result;
  }

  // (1) Base .gitignore += Cascades/  (only meaningful where Cascades/ is NOT Base-tracked).
  result.baseGitignoreEnsured = ensureGitignoreLine(
    join(userCwd, '.gitignore'),
    GITM_BASE_GITIGNORE_LINE,
  );

  // (2) Cascades/.gitignore += scps/ (the RED repos) AND Bridge/ (the bridge's own runtime
  // bookkeeping — debug.json/gitm.json/sessions.json churn constantly; tracking it keeps the
  // Cascade/BLUE location perpetually dirty and pins mostRecentLocation to it).
  result.cascadeGitignoreEnsured =
    ensureGitignoreLine(join(cascadeDir, '.gitignore'), GITM_CASCADE_GITIGNORE_LINE) &&
    ensureGitignoreLine(join(cascadeDir, '.gitignore'), GITM_CASCADE_BRIDGE_GITIGNORE_LINE);

  // (3) GITM SCP-SOVEREIGN — the Cascade BLUE repo init is DROPPED (no-embed safety · S4 Seam A:
  // Cascades/.git was the ONE BLUE embedding surface). Instead write Cascades/.keep — the user-tree
  // anchor for the gitignored Cascade mount point ("gitignore AND keep").
  result.keepEnsured = ensureKeepFile(cascadeDir);

  // (4) git init each present SCP  (the RED repos · each aware only of itself). Write the SCP
  // package .gitignore (node_modules/, dist/, …) BEFORE the RED `git add -A` (inside ensureGitRepo)
  // so the badge counts SCP SOURCE, not the dependency over-track (S4 Seam D · 12,968 files).
  for (const scpDir of listScpDirs(scpsRoot)) {
    ensureScpGitignore(scpDir);
    if (ensureGitRepo(scpDir, nestedCommitMsg)) {
      result.scpReposInit.push(scpDir);
    }
  }

  result.reason = `sovereign: keep=${result.keepEnsured} scps=${result.scpReposInit.length}`;
  return result;
}
