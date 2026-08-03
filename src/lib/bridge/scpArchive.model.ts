/**
 * scpArchive.model · MD-ARC+C · WAPF + the Archive Move primitives
 *
 * Pure filesystem/process helpers — NO Stratimux imports (testable in isolation).
 * The registry mutation rides scpSessionRegistry's chainWrite (the single write
 * surface); this model owns ONLY:
 *   - WAPF (the Worktree Archive Pre-Flight): the .git shape probe that branches
 *     H0-clean / H1-owner / H2-instance BEFORE any move (the user's overrule of
 *     the flat refusal — the worktree is RESOLVED, not walled).
 *   - the vault move (SARC 2B): Cascades/scps/<name>/ → Cascades/scps/.archive/<name>/
 *     via atomic rename with the EXDEV copy-then-unlink fallback.
 *   - the Path B repair leg: `git worktree repair <instances>` run FROM the vault —
 *     non-fatal + logged (man-page-sound · the Wave-6 smoke is the empirical proof).
 *
 * The .archive/ vault is excluded from every scan by the dot-dir convention
 * (listScpDirs skips name.startsWith('.')) — the Exclusion Law costs nothing.
 *
 * Citation: Cascades/Working/MD-ARC-R4B-WORKTREE-RESOLUTION.md (WAPF · H0/H1/H2 ·
 *   Path A anor Path B) · MD-ARC-R3-BLUEPRINT.md §3.3 (the move) §7 R1/R6.
 */
import {
  existsSync,
  lstatSync,
  readFileSync,
  readdirSync,
  mkdirSync,
  renameSync,
  cpSync,
  rmSync,
} from 'node:fs';
import { execFileSync } from 'node:child_process';
import { resolve, join, dirname, isAbsolute } from 'node:path';

export const SCP_ARCHIVE_DIR_RELATIVE = 'Cascades/scps/.archive';

// ── WAPF · the Worktree Archive Pre-Flight ──────────────────────────────────
// The package dir is Cascades/scps/<name>/ — its .git (when present) is the RED
// repo. Shape probe: .git DIRECTORY with worktrees/ entries → H1-owner (linked
// worktrees hold git-written ABSOLUTE gitdir paths that go stale on move);
// .git FILE → H2-instance (this SCP IS a linked worktree of a parent — moving it
// dangles the parent's metadata; archive is the wrong lifecycle verb for a
// derivative). No .git anor an empty worktrees/ → H0-clean.
export type WorktreePreFlight =
  | { branch: 'clean' }
  | { branch: 'owner'; instanceGitdirs: string[] }
  | { branch: 'instance'; parentGitdir: string };

export function worktreeArchivePreFlight(packageDirAbs: string): WorktreePreFlight {
  const dotGit = join(packageDirAbs, '.git');
  if (!existsSync(dotGit)) return { branch: 'clean' };
  let stat;
  try {
    stat = lstatSync(dotGit);
  } catch {
    return { branch: 'clean' };
  }
  if (stat.isFile()) {
    // H2 · the .git file carries `gitdir: <abs-path-into-parent>/.git/worktrees/<i>`
    // — the parent resolves from the CONTENT (more reliable than name derivation).
    let parentGitdir = '';
    try {
      const content = readFileSync(dotGit, 'utf8');
      const match = content.match(/^gitdir:\s*(.+)\s*$/m);
      parentGitdir = match ? match[1].trim() : '';
    } catch {
      parentGitdir = '';
    }
    return { branch: 'instance', parentGitdir };
  }
  // .git directory — probe worktrees/ for linked-instance gitdir pointers.
  const worktreesDir = join(dotGit, 'worktrees');
  if (!existsSync(worktreesDir)) return { branch: 'clean' };
  let entries: string[] = [];
  try {
    entries = readdirSync(worktreesDir).filter((e) => !e.startsWith('.'));
  } catch {
    entries = [];
  }
  if (entries.length === 0) return { branch: 'clean' };
  // Each entry's gitdir file names the INSTANCE's absolute .git-file path — the
  // instance working tree is its dirname (what `git worktree repair` wants).
  const instanceGitdirs: string[] = [];
  for (const e of entries) {
    try {
      const raw = readFileSync(join(worktreesDir, e, 'gitdir'), 'utf8').trim();
      if (raw !== '') instanceGitdirs.push(dirname(raw));
    } catch {
      // an unreadable pointer still counts as an owner signal — carry the name
      instanceGitdirs.push(join(worktreesDir, e));
    }
  }
  return { branch: 'owner', instanceGitdirs };
}

// ── the vault move (2B) ─────────────────────────────────────────────────────
// Atomic rename on the same filesystem; EXDEV → copy-then-unlink (the safety
// net, not the primary path). Returns the destination absolute path.
export function moveScpToArchive(name: string, projectRoot: string): string {
  const src = resolve(projectRoot, 'Cascades', 'scps', name);
  const vault = resolve(projectRoot, SCP_ARCHIVE_DIR_RELATIVE);
  const dst = join(vault, name);
  if (!existsSync(src)) throw new Error(`archive move: source missing: ${src}`);
  if (existsSync(dst)) throw new Error(`archive move: vault occupied: ${dst}`);
  mkdirSync(vault, { recursive: true });
  renameOrCopy(src, dst);
  return dst;
}

// Reinstate: vault → the original seat (RROC — the occupied-seat refusal is the
// CALLER's guard; this throws to honor it if raced).
export function moveScpFromArchive(name: string, projectRoot: string): string {
  const src = resolve(projectRoot, SCP_ARCHIVE_DIR_RELATIVE, name);
  const dst = resolve(projectRoot, 'Cascades', 'scps', name);
  if (!existsSync(src)) throw new Error(`reinstate move: vault entry missing: ${src}`);
  if (existsSync(dst)) throw new Error(`reinstate move: seat occupied: ${dst}`);
  renameOrCopy(src, dst);
  return dst;
}

function renameOrCopy(src: string, dst: string): void {
  try {
    renameSync(src, dst);
  } catch (err: unknown) {
    const code = (err as { code?: string }).code;
    if (code !== 'EXDEV') throw err;
    cpSync(src, dst, { recursive: true });
    rmSync(src, { recursive: true, force: true });
  }
}

// ── Path B · the post-move repair leg ───────────────────────────────────────
// `git worktree repair <instance-paths…>` run FROM the vaulted package dir
// re-links the instances' gitdir pointers to the moved owner. NON-FATAL: the
// archive stands regardless; the outcome is returned for the caller's log/sink.
// Run SYNCHRONOUSLY right after the rename (the prune-window caution — no git
// operation may interpose before the repair).
export function repairWorktreesFromVault(
  vaultPackageDirAbs: string,
  instancePaths: string[],
): { ok: boolean; detail: string } {
  const targets = instancePaths.filter((p) => isAbsolute(p) && existsSync(p));
  if (targets.length === 0) return { ok: true, detail: 'no reachable instances' };
  try {
    execFileSync('git', ['worktree', 'repair', ...targets], {
      cwd: vaultPackageDirAbs,
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    return { ok: true, detail: `repaired ${targets.length}` };
  } catch (err: unknown) {
    const e = err as { stderr?: string; message?: string };
    const detail =
      (typeof e.stderr === 'string' && e.stderr.trim() !== ''
        ? e.stderr.trim()
        : e.message ?? 'repair failed') ?? 'repair failed';
    return { ok: false, detail: detail.slice(0, 300) };
  }
}
