import { execFile as execFileCb } from 'node:child_process';
import { existsSync, rmSync } from 'node:fs';
import { homedir } from 'node:os';
import * as path from 'node:path';
import { promisify } from 'node:util';
import { performClone } from './installSpawn';
import { log } from './debugLog';

const execFile = promisify(execFileCb);

// SCP-UPD-FND D-U1 · the Retained Reference Clone manager.
//
// Install clones into mkdtemp() and removes the temp dir via cleanupInstallTemp.
// The UPDATE path inverts that lifetime: it RETAINS a single canonical clone at a
// stable, user-home-scoped cache dir (OUTSIDE every project — no embedded .git, no
// per-SCP re-clone) and PULLS-if-present rather than re-cloning. The retained clone
// is read-only as the authoritative current SCS template ("theirs" for the 3-way
// diff D-U2). It is NEVER cleanupInstallTemp'd — retention is the whole point.
//
// Cache location (RESOLVED): `~/.scs-bridge/update-clone/` — os.homedir()-derived,
// cross-platform, multi-SCP (one clone serves every SCP on the machine), survives
// project deletes, zero embedding risk.

export type RetainedCloneMode = 'cloned' | 'pulled' | 'reused-offline';

export interface RetainedCloneResult {
  // The retained SCS working tree (the clone root).
  clonePath: string;
  // <clonePath>/Cascades/scps/template/SCP — the THEIRS template root for D-U2.
  templatePath: string;
  // How this invocation obtained the clone.
  mode: RetainedCloneMode;
  // git rev-parse HEAD of the clone (provenance for the diff JSON). For file://
  // working-tree copies (no .git), this is the literal 'working-tree'.
  headSha: string;
}

export interface EnsureRetainedCloneOptions {
  // Override the cache root (default: ~/.scs-bridge/update-clone/). Mainly for tests.
  cacheRoot?: string;
  // The branch to fetch/reset to on pull-if-present (default: the clone's current
  // upstream tip via FETCH_HEAD off origin HEAD).
  branch?: string;
  // If a pull fails (e.g. offline), keep serving the stale-but-present clone rather
  // than throwing. Default false — the caller (the update flow) decides whether a
  // degraded diff is acceptable (the diff JSON stamps mode so it can warn).
  offlineOk?: boolean;
}

// The stable cache root — `~/.scs-bridge/update-clone/`. os.homedir() is the same
// cross-platform pattern paths.ts already uses; never hard-code `~`.
export function retainedCloneCacheRoot(): string {
  return path.join(homedir(), '.scs-bridge', 'update-clone');
}

// <clonePath>/Cascades/scps/template/SCP — the THEIRS template root for D-U2.
export function templatePathFor(clonePath: string): string {
  return path.join(clonePath, 'Cascades', 'scps', 'template', 'SCP');
}

// MD-UFS · THE REFRESH MUTEX (the Case 2 cold-race field break): ensureRetainedClone
// had NO concurrency guard — a second Run Update's rmSync destroyed the first's
// in-flight copy (the file:// refresh is rm + full re-copy EVERY call). The disrupted
// chain died with the empty-stageError all-red fingerprint while the survivor's copy
// completed and the NEXT run sailed warm. Concurrent callers now JOIN the in-flight
// refresh instead of racing it.
const inFlightRefreshByPath = new Map<string, Promise<RetainedCloneResult>>();

// Clone-if-absent / pull-if-present into the stable cache. Returns the retained
// clone path, the template root, the obtain-mode, and the clone HEAD sha.
export async function ensureRetainedClone(
  repoUrl: string,
  opts: EnsureRetainedCloneOptions = {},
): Promise<RetainedCloneResult> {
  const cacheRoot = opts.cacheRoot ?? retainedCloneCacheRoot();
  const clonePath = path.join(cacheRoot, 'clone');
  const inFlight = inFlightRefreshByPath.get(clonePath);
  if (inFlight) {
    log('update.clone.retained.joined-in-flight', { clonePath });
    return inFlight;
  }
  const run = ensureRetainedCloneInner(repoUrl, opts, clonePath);
  inFlightRefreshByPath.set(clonePath, run);
  try {
    return await run;
  } finally {
    inFlightRefreshByPath.delete(clonePath);
  }
}

async function ensureRetainedCloneInner(
  repoUrl: string,
  opts: EnsureRetainedCloneOptions,
  clonePath: string,
): Promise<RetainedCloneResult> {
  const templatePath = templatePathFor(clonePath);
  const isFileUrl = repoUrl.startsWith('file://');
  const gitDir = path.join(clonePath, '.git');

  // Presence test: a remote clone is "present" only when its .git exists; a file://
  // working-tree copy (no .git) is "present" when the clone dir itself exists.
  const present = isFileUrl ? existsSync(clonePath) : existsSync(gitDir);
  // MD-UFS · the settling instrumentation: two same-second entries with
  // present:false on one clonePath = the race the mutex now prevents.
  log('update.clone.presence-check', { clonePath, present, isFileUrl });

  if (!present) {
    // Absent → fresh clone via the shared install primitive (file://-fsCp · remote
    // git clone --depth=1). performClone writes INTO clonePath; we never remove it.
    if (existsSync(clonePath)) {
      // A half-populated dir with no .git (interrupted prior clone) — rebuild clean.
      rmSync(clonePath, { recursive: true, force: true });
    }
    await performClone(repoUrl, clonePath);
    const headSha = await resolveHeadSha(clonePath, isFileUrl);
    log('update.clone.retained.cloned', { repoUrl, clonePath, headSha });
    return { clonePath, templatePath, mode: 'cloned', headSha };
  }

  // Present → refresh.
  if (isFileUrl) {
    // file:// working-tree source has no commit state — re-copy over the cache so the
    // retained clone tracks the latest working tree (defeats commit-state staleness).
    const localSource = repoUrl.replace(/^file:\/\//, '');
    try {
      rmSync(clonePath, { recursive: true, force: true });
      await performClone(repoUrl, clonePath);
      const headSha = await resolveHeadSha(clonePath, isFileUrl);
      log('update.clone.retained.refreshed-file', { localSource, clonePath });
      return { clonePath, templatePath, mode: 'pulled', headSha };
    } catch (err) {
      if (opts.offlineOk) {
        log('update.clone.retained.refresh-file-failed-offline', { localSource, clonePath });
        return {
          clonePath,
          templatePath,
          mode: 'reused-offline',
          headSha: 'working-tree',
        };
      }
      const message = err instanceof Error ? err.message : String(err);
      throw new Error(`retained clone file:// refresh failed: ${message}`);
    }
  }

  // Remote present → shallow-safe pull: fetch the branch tip + hard-reset to it.
  // NOT bare `git pull` (which can stall on local state / merge); this is idempotent
  // and never leaves a dirty/half-merged reference tree (S4 Risk 6 mitigation).
  try {
    const branch = opts.branch ?? (await resolveCloneBranch(clonePath));
    await execFile('git', ['-C', clonePath, 'fetch', '--depth=1', 'origin', branch]);
    await execFile('git', ['-C', clonePath, 'reset', '--hard', 'FETCH_HEAD']);
    const headSha = await resolveHeadSha(clonePath, isFileUrl);
    log('update.clone.retained.pulled', { repoUrl, clonePath, branch, headSha });
    return { clonePath, templatePath, mode: 'pulled', headSha };
  } catch (err) {
    if (opts.offlineOk) {
      const headSha = await resolveHeadSha(clonePath, isFileUrl).catch(() => 'unknown');
      log('update.clone.retained.pull-failed-offline', { repoUrl, clonePath, headSha });
      return { clonePath, templatePath, mode: 'reused-offline', headSha };
    }
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(`retained clone pull failed (use offlineOk to serve stale): ${message}`);
  }
}

// git rev-parse HEAD of the clone. file:// copies have no .git → 'working-tree'.
async function resolveHeadSha(clonePath: string, isFileUrl: boolean): Promise<string> {
  if (isFileUrl || !existsSync(path.join(clonePath, '.git'))) {
    return 'working-tree';
  }
  const { stdout } = await execFile('git', ['-C', clonePath, 'rev-parse', 'HEAD']);
  return stdout.trim();
}

// The branch a shallow clone tracks. `git clone --depth=1` records the remote HEAD
// branch in remote-tracking refs; rev-parse the abbrev symbolic ref, falling back to
// origin/HEAD's target, then to 'main'/'master' detection.
async function resolveCloneBranch(clonePath: string): Promise<string> {
  try {
    const { stdout } = await execFile('git', [
      '-C',
      clonePath,
      'rev-parse',
      '--abbrev-ref',
      'HEAD',
    ]);
    const branch = stdout.trim();
    if (branch && branch !== 'HEAD') {
      return branch;
    }
  } catch {
    // fall through
  }
  try {
    const { stdout } = await execFile('git', [
      '-C',
      clonePath,
      'symbolic-ref',
      '--short',
      'refs/remotes/origin/HEAD',
    ]);
    const ref = stdout.trim();
    if (ref.startsWith('origin/')) {
      return ref.slice('origin/'.length);
    }
  } catch {
    // fall through
  }
  return 'main';
}
