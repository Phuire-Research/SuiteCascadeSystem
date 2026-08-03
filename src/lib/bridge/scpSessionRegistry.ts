/**
 * SCP Session Registry · Cascades/SCPs.json sessions[] append + read.
 *
 * Diamond CSRA: calling-session-ID registration is the automatic side-effect
 * of an MCP `launch_scp` tool call. The session entry is appended to the
 * target SCP's `sessions[]` array in `Cascades/SCPs.json` as part of the
 * dispatch path.
 *
 * R4 HIGH-3 resolution: uses an in-process `chainWrite` mutex + atomic
 * tmp+rename write — the EXACT pattern from `registry.ts:25-53`. Two
 * concurrent MCP calls cannot interleave read-mutate-write. Per-link `.catch`
 * keeps the chain alive after a single failed write.
 *
 * Pattern citations:
 *  - CSRA · Calling-Session-Registration-Append (atomic)
 *  - M61  · Project-Totality Authoritative Scope (SCPs.json single source)
 *  - M69  · Canonical Registry Source (read → mutate → write)
 *
 * Scholar citations:
 *  - S13 State Design — registry data lives on filesystem, not in state.
 *  - M60 State-or-Payload Anor — session entry is data-on-disk, not state.
 *
 * Schema is additive: existing SCPs.json entries without `sessions[]`
 * receive an empty array on first write. Dedup-by-sessionId mirrors
 * `registry.ts:59` (filter-before-push).
 */

import { readFile, writeFile, rename } from 'node:fs/promises';
import { existsSync, rmSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { resolve, resolve as resolvePath, dirname } from 'node:path';
import { log } from './debugLog';
// MD-ARC+C · SARC/SRST — the vault-move primitives + WAPF (pure model) and the
// gitmWorktreeRemove retirement legs (slice + watcher teardown on archive).
import {
  worktreeArchivePreFlight,
  moveScpToArchive,
  moveScpFromArchive,
  repairWorktreesFromVault,
} from './scpArchive.model';
import { deleteSlice } from './concepts/gitm/model/gitmSliceStore.model';
import { disarmWatchersForScp } from './concepts/gitm/model/gitmWatcherRegistry.model';

export type ScpSessionEntry = {
  sessionId: string;
  registeredVia: 'mcp' | 'tui' | 'manual';
  registeredAt: number;
  mcpClientId?: string;
};

// PSSM · Persisted-SCP-Status-Muxameter · the per-SCP live/pending status the daemon
// watches (parent-dir-hardened watch → scpLifecycle transition → TUI row). 'live' is
// written CLI-side on launch (W3); 'pending' is written server-side just before self-exit
// (W2) AND CLI-side on the boot consistency sweep (W4). The TUI row derives from this.
//
// C653 · THE WORKTREE INSTALL STAGE · 'installing' is the birth-transient a fresh MULTIPLY
// instance carries between its SCPs.json registration and its node_modules being present. A
// git-worktree tree carries only TRACKED files (package.json, NO node_modules) — so the add
// quality registers the instance 'installing' and spawns a non-blocking `npm install`; on
// install exit the status flips to 'pending' (boot-spawnable). The helm reads this transient
// off the roster (scpStatuses) to hold the MULTIPLY staged bar's INSTALL tick + disable the
// instance-row Spawn button until dependencies land. The TUI menu row is FSM-driven
// (scpLifecycle) — this widened union flows through the projection/echo as an opaque string
// (degrades honestly · no exhaustiveness site switches on it).
export type ScpPersistedStatus = 'live' | 'pending' | 'installing';

type ScpRegistryRecord = {
  name: string;
  path?: string;
  port?: number;
  sessions?: ScpSessionEntry[];
  // SWFB · the SCP page window's Electron windowId — bound at open-url time,
  // read by the refocus tool to focus the specific window by id.
  windowId?: number;
  // M2 · WINDOW-RENDERED (D-WR C628 · the RENDERED projection). Epoch-ms of the FIRST successful
  // did-finish-load of the SCP window (electronWindow M1 showRendered moment) — window truly PAINTED,
  // not merely BOUND (windowId lands at construction, BEFORE paint). The helm gates its ONE focus
  // round on THIS (window shown) rather than on windowId presence (window bound). Absent ⇒ bound
  // but not yet rendered (the bar keeps sweeping 'booting').
  windowRenderedAt?: number;
  // PSSM · persisted lifecycle status + its last-write timestamp (W0-W5).
  status?: ScpPersistedStatus;
  statusUpdatedAt?: number;
  [key: string]: unknown;
};

// MD-ARC+C · SARC — the archived ledger row: the full record preserved (port ·
// sessions · description) so Reinstate restores identity exactly; path re-pointed
// into the vault; originalPath enables exact-seat restoration without guessing.
export type ArchivedScpEntry = ScpRegistryRecord & {
  archivedAt: number;
  originalPath: string;
};

type ScpsJsonShape = {
  scps?: ScpRegistryRecord[];
  // MD-ARC+C · the sibling ledger — every existing scps[] reader excludes archived
  // SCPs by construction (they never look here). The CLI-side surface
  // (scpPersistence.ts) carries this field OPAQUELY through its parse/write.
  archivedScps?: ArchivedScpEntry[];
};

function scpsJsonPath(): string {
  return resolve(process.cwd(), 'Cascades', 'SCPs.json');
}

let writeChain: Promise<void> = Promise.resolve();

function chainWrite(label: string, body: () => Promise<void>): Promise<void> {
  const next = writeChain.then(body).catch((err) => {
    log('scpSessionRegistry.write.error', { label, error: String(err) });
  });
  writeChain = next;
  return next;
}

async function loadScpsJson(): Promise<ScpsJsonShape> {
  try {
    const raw = await readFile(scpsJsonPath(), 'utf8');
    const parsed = JSON.parse(raw) as ScpsJsonShape;
    if (!parsed || typeof parsed !== 'object') return { scps: [] };
    if (!Array.isArray(parsed.scps)) return { scps: [] };
    return parsed;
  } catch {
    return { scps: [] };
  }
}

async function saveScpsJson(payload: ScpsJsonShape): Promise<void> {
  const path = scpsJsonPath();
  const tmp = path + '.tmp';
  await writeFile(tmp, JSON.stringify(payload, null, 2), 'utf8');
  await rename(tmp, path);
}

export async function appendSessionToScp(
  scpName: string,
  sessionId: string,
  registeredVia: 'mcp' | 'tui' | 'manual' = 'mcp',
  mcpClientId?: string,
): Promise<void> {
  return chainWrite('appendSessionToScp', async () => {
    const data = await loadScpsJson();
    const scps = data.scps ?? [];
    const idx = scps.findIndex((entry) => entry?.name === scpName);
    if (idx < 0) {
      log('scpSessionRegistry.append.missing', { scpName, sessionId });
      return;
    }
    const target = scps[idx];
    const existing = Array.isArray(target.sessions) ? target.sessions : [];
    const dedup = existing.filter((s) => s?.sessionId !== sessionId);
    const entry: ScpSessionEntry = {
      sessionId,
      registeredVia,
      registeredAt: Date.now(),
    };
    if (mcpClientId !== undefined) entry.mcpClientId = mcpClientId;
    dedup.push(entry);
    scps[idx] = { ...target, sessions: dedup };
    await saveScpsJson({ ...data, scps });
    log('scpSessionRegistry.append', { scpName, sessionId, registeredVia });
  });
}

export async function listSessionsForScp(
  scpName: string,
): Promise<ScpSessionEntry[]> {
  const data = await loadScpsJson();
  const scps = data.scps ?? [];
  const target = scps.find((entry) => entry?.name === scpName);
  if (!target || !Array.isArray(target.sessions)) return [];
  return target.sessions;
}

export async function lookupScpRecord(
  scpName: string,
): Promise<ScpRegistryRecord | undefined> {
  const data = await loadScpsJson();
  const scps = data.scps ?? [];
  return scps.find((entry) => entry?.name === scpName);
}

// SWFB · upsert the SCP page window's Electron windowId keyed by SCP name.
// UPSERT because the scaffolded template starts as `scps: []` — the open-url
// path is the first writer, so a missing record is CREATED here. Atomic
// chainWrite mirrors appendSessionToScp (no read-mutate-write interleave).
export async function setScpWindowId(
  scpName: string,
  windowId: number,
): Promise<void> {
  return chainWrite('setScpWindowId', async () => {
    const data = await loadScpsJson();
    const scps = data.scps ?? [];
    const idx = scps.findIndex((entry) => entry?.name === scpName);
    if (idx < 0) {
      scps.push({ name: scpName, windowId });
    } else {
      scps[idx] = { ...scps[idx], windowId };
    }
    await saveScpsJson({ ...data, scps });
    log('scpSessionRegistry.setWindowId', { scpName, windowId });
  });
}

// M2 · WINDOW-RENDERED WRITER (D-WR C628). Upsert `windowRenderedAt` (epoch-ms of the SCP window's
// FIRST successful did-finish-load — the M1 show-on-rendered moment). Rides the SAME chainWrite mutex
// + tmp+rename writer as setScpWindowId (no interleave). UPSERT because a name-guarded caller may be
// the first writer of this record. The window host calls this at the SAME fire-once rendered moment it
// shows the window, name-guarded exactly like setScpWindowId's effectiveScpName guard.
export async function setScpWindowRendered(
  scpName: string,
  at: number,
): Promise<void> {
  return chainWrite('setScpWindowRendered', async () => {
    const data = await loadScpsJson();
    const scps = data.scps ?? [];
    const idx = scps.findIndex((entry) => entry?.name === scpName);
    if (idx < 0) {
      scps.push({ name: scpName, windowRenderedAt: at });
    } else {
      scps[idx] = { ...scps[idx], windowRenderedAt: at };
    }
    await saveScpsJson({ ...data, scps });
    log('scpSessionRegistry.setWindowRendered', { scpName, windowRenderedAt: at });
  });
}

// SWFB · read the bound Electron windowId for an SCP, or null when absent.
// The refocus tool prefers this id (BrowserWindow.fromId) over URL matching.
export async function lookupScpWindowId(
  scpName: string,
): Promise<number | null> {
  const data = await loadScpsJson();
  const scps = data.scps ?? [];
  const rec = scps.find((entry) => entry?.name === scpName);
  return rec && typeof rec.windowId === 'number' ? rec.windowId : null;
}

// PSSM · W1 · THE SHARED STATUS WRITER (bridge side).
// Atomic read-modify-write of a single SCP's persisted status, riding the SAME
// chainWrite mutex + tmp+rename writer every other SCPs.json mutation uses (no
// interleave with appendSessionToScp / setScpWindowId). UPSERT: a missing record
// is CREATED (the scaffolded template can start as `scps: []`; the launch path may
// be the first status writer). W3 writes 'live' on launch; W4 sweeps 'pending'.
// The template server's own pre-exit 'pending' write (W2) is the SYNC MIRROR of
// this shape (selfOwnedShutdown.model.ts) — the two shapes MUST stay identical.
export async function setScpStatus(
  scpName: string,
  status: ScpPersistedStatus,
): Promise<void> {
  return chainWrite('setScpStatus', async () => {
    const data = await loadScpsJson();
    const scps = data.scps ?? [];
    const statusUpdatedAt = Date.now();
    const idx = scps.findIndex((entry) => entry?.name === scpName);
    if (idx < 0) {
      scps.push({ name: scpName, status, statusUpdatedAt });
    } else {
      scps[idx] = { ...scps[idx], status, statusUpdatedAt };
    }
    await saveScpsJson({ ...data, scps });
    log('scpSessionRegistry.setStatus', { scpName, status });
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// MD-ARC+C · SARC anor SRST — Archive anor Reinstate (rides the chainWrite mutex)
// ═══════════════════════════════════════════════════════════════════════════

export type ScpArchiveResult =
  | { ok: true; archivedAt: number; worktreeRepair?: { ok: boolean; detail: string } }
  | { ok: false; reason: string; detail?: string; instances?: string[] };

export type ScpReinstateResult =
  | { ok: true }
  | { ok: false; reason: string; detail?: string };

// MD-ARC+C · Wave 7 · SDEL — the PERMANENT delete result. The destructive
// sibling of ScpArchiveResult (which is reversible via reinstate). `worktreeNote`
// carries a non-fatal 'worktree-metadata-dangling' marker when the git-worktree
// removal fell back to a plain rmSync (the parent's metadata may need a later
// `git worktree prune`).
export type ScpDeleteResult =
  | { ok: true; worktreeNote?: string }
  | { ok: false; reason: string; detail?: string; instances?: string[] };

// SARC · archive an installed SCP: the guards (system · SARC-GUARD live · the
// standard seat · WAPF) → the vault move → the ledger mutation → the teardown
// (deleteSlice + disarmWatchersForScp — the gitmWorktreeRemove retirement legs).
// ALL checks run INSIDE the chainWrite body (R3: no concurrent write interposes).
// WAPF branches (the user's overrule of the flat refusal):
//   H2 instance → refused toward the typed-Delete retire (the branch survives in
//   the parent — archive is the wrong lifecycle verb for a derivative).
//   H1 owner without force → 'worktrees-present' + the instance list (the caller
//   confers Path A retire-first anor re-calls with force = Path B).
//   H1 owner with force → move, then `git worktree repair` from the vault
//   (non-fatal · the outcome rides the result for the sink).
export async function archiveScpEntry(
  scpName: string,
  opts?: { force?: boolean },
): Promise<ScpArchiveResult> {
  let result: ScpArchiveResult = { ok: false, reason: 'archive-not-run' };
  await chainWrite('archiveScpEntry', async () => {
    const projectRoot = process.cwd();
    const data = await loadScpsJson();
    const scps = data.scps ?? [];
    const idx = scps.findIndex((entry) => entry?.name === scpName);
    if (idx < 0) {
      result = { ok: false, reason: 'scp-not-found' };
      return;
    }
    const target = scps[idx];
    if (target.system === true || scpName === 'template') {
      result = { ok: false, reason: 'system-scp-cannot-archive' };
      return;
    }
    // SARC-GUARD (3A) — the persisted status rail is the contract (W-series);
    // 'live' → refuse with the stop-first voice.
    if (target.status === 'live') {
      result = { ok: false, reason: 'scp-must-be-stopped-before-archive' };
      return;
    }
    const packageDir = resolvePath(projectRoot, 'Cascades', 'scps', scpName);
    if (!existsSync(packageDir)) {
      // install-via-path SCPs may seat outside Cascades/scps/ — the vault move
      // is standard-seat only this pass (no fine controls yet).
      result = { ok: false, reason: 'scp-outside-standard-seat' };
      return;
    }
    // WAPF — the Worktree Archive Pre-Flight (H0/H1/H2).
    const preFlight = worktreeArchivePreFlight(packageDir);
    if (preFlight.branch === 'instance') {
      result = {
        ok: false,
        reason: 'worktree-instance-use-retire',
        detail: preFlight.parentGitdir,
      };
      return;
    }
    if (preFlight.branch === 'owner' && opts?.force !== true) {
      result = {
        ok: false,
        reason: 'worktrees-present',
        instances: preFlight.instanceGitdirs,
      };
      return;
    }
    let vaultDir = '';
    try {
      vaultDir = moveScpToArchive(scpName, projectRoot);
    } catch (err: unknown) {
      result = {
        ok: false,
        reason: 'archive-move-failed',
        detail: err instanceof Error ? err.message : String(err),
      };
      return;
    }
    // Path B — repair SYNCHRONOUSLY right after the rename (the prune-window
    // caution); non-fatal — the archive stands regardless.
    let worktreeRepair: { ok: boolean; detail: string } | undefined;
    if (preFlight.branch === 'owner') {
      worktreeRepair = repairWorktreesFromVault(vaultDir, preFlight.instanceGitdirs);
      log('scpSessionRegistry.archive.worktree-repair', { scpName, ...worktreeRepair });
    }
    // The ledger mutation: path re-pointed into the vault (exact-suffix carry).
    const originalPath =
      typeof target.path === 'string' && target.path !== ''
        ? target.path
        : `Cascades/scps/${scpName}/SCP`;
    const archivedPath = originalPath.startsWith(`Cascades/scps/${scpName}`)
      ? `Cascades/scps/.archive/${originalPath.slice('Cascades/scps/'.length)}`
      : `Cascades/scps/.archive/${scpName}/SCP`;
    const archivedAt = Date.now();
    const archivedEntry: ArchivedScpEntry = {
      ...target,
      path: archivedPath,
      archivedAt,
      originalPath,
    };
    const nextScps = scps.filter((entry) => entry?.name !== scpName);
    const archivedScps = [...(data.archivedScps ?? []), archivedEntry];
    await saveScpsJson({ ...data, scps: nextScps, archivedScps });
    // Teardown — the retirement legs (key = the OLD SCP subdir absolute · the
    // slice/watcher key convention).
    const sliceKey = resolvePath(projectRoot, originalPath);
    deleteSlice(sliceKey);
    disarmWatchersForScp(sliceKey);
    log('scpSessionRegistry.archive', { scpName, vaultDir, archivedAt });
    result = worktreeRepair ? { ok: true, archivedAt, worktreeRepair } : { ok: true, archivedAt };
  });
  return result;
}

// SRST · reinstate an archived SCP: the ledger guards (present · RROC name
// collision) → the reverse move (the occupied-seat throw honors RROC at the
// filesystem too) → the entry restored to scps[] at status 'pending' (launch is
// manual — no auto-spawn). Port re-validation is deferred to the launch path.
export async function reinstateScpEntry(scpName: string): Promise<ScpReinstateResult> {
  let result: ScpReinstateResult = { ok: false, reason: 'reinstate-not-run' };
  await chainWrite('reinstateScpEntry', async () => {
    const projectRoot = process.cwd();
    const data = await loadScpsJson();
    const scps = data.scps ?? [];
    const archivedScps = data.archivedScps ?? [];
    const archived = archivedScps.find((entry) => entry?.name === scpName);
    if (!archived) {
      result = { ok: false, reason: 'scp-not-in-archive' };
      return;
    }
    if (scps.some((entry) => entry?.name === scpName)) {
      result = { ok: false, reason: 'scp-name-collision-in-live-registry' };
      return;
    }
    try {
      moveScpFromArchive(scpName, projectRoot);
    } catch (err: unknown) {
      result = {
        ok: false,
        reason: 'reinstate-move-failed',
        detail: err instanceof Error ? err.message : String(err),
      };
      return;
    }
    // A force-archived OWNER's worktree pointers re-break on the move BACK —
    // the same repair leg runs from the restored seat (non-fatal · logged).
    const restoredDir = resolvePath(projectRoot, 'Cascades', 'scps', scpName);
    const restoredFlight = worktreeArchivePreFlight(restoredDir);
    if (restoredFlight.branch === 'owner') {
      const repair = repairWorktreesFromVault(restoredDir, restoredFlight.instanceGitdirs);
      log('scpSessionRegistry.reinstate.worktree-repair', { scpName, ...repair });
    }
    const { archivedAt: _archivedAt, originalPath, ...rest } = archived;
    const reinstated: ScpRegistryRecord = {
      ...rest,
      path: originalPath !== '' ? originalPath : `Cascades/scps/${scpName}/SCP`,
      status: 'pending',
      statusUpdatedAt: Date.now(),
    };
    const nextArchived = archivedScps.filter((entry) => entry?.name !== scpName);
    await saveScpsJson({ ...data, scps: [...scps, reinstated], archivedScps: nextArchived });
    log('scpSessionRegistry.reinstate', { scpName, path: reinstated.path });
    result = { ok: true };
  });
  return result;
}

// ═══════════════════════════════════════════════════════════════════════════
// MD-ARC+C · Wave 7 · SDEL — deleteScpEntry (the PERMANENT rm · rides chainWrite)
// ═══════════════════════════════════════════════════════════════════════════
//
// The destructive sibling of archiveScpEntry: it does NOT vault — it removes the
// package dir from disk AND removes the ledger row (scps[] anor archivedScps[]).
// ALL checks run INSIDE the chainWrite body (R3: no concurrent write interposes).
//
// Guards (INSIDE the body):
//   system/template            → 'system-scp-cannot-delete'
//   live status                → 'scp-must-be-stopped-before-delete'
//   not-found (either ledger)  → 'scp-not-found'
//   H1 owner-with-instances    → 'worktrees-present-retire-first' (delete never
//                                strands instances — retire the branch first)
//
// Seat resolution: fromArchive → Cascades/scps/.archive/<name> · else the
// installed seat Cascades/scps/<name>.
//
// WAPF branches (the .git shape probe):
//   H2 instance → resolve the parent repo root from parentGitdir and run
//     `git worktree remove --force <packageDir>` from that root (registry-first
//     cleanup · the branch survives in the parent). Non-fatal fallback: plain
//     rmSync + a logged 'worktree-metadata-dangling' note.
//   H1 owner   → REFUSED (see above · delete never strands instances).
//   H0 clean   → plain rmSync of the package dir.
export async function deleteScpEntry(
  scpName: string,
  opts?: { fromArchive?: boolean },
): Promise<ScpDeleteResult> {
  let result: ScpDeleteResult = { ok: false, reason: 'delete-not-run' };
  await chainWrite('deleteScpEntry', async () => {
    const projectRoot = process.cwd();
    const fromArchive = opts?.fromArchive === true;
    const data = await loadScpsJson();
    const scps = data.scps ?? [];
    const archivedScps = data.archivedScps ?? [];

    // The ledger row — installed seat searches scps[]; archive seat searches
    // archivedScps[] (a fromArchive delete of a still-installed entry is a caller
    // error, resolved to not-found here).
    const liveIdx = scps.findIndex((entry) => entry?.name === scpName);
    const archivedIdx = archivedScps.findIndex((entry) => entry?.name === scpName);
    const target = fromArchive ? archivedScps[archivedIdx] : scps[liveIdx];
    if (target === undefined) {
      result = { ok: false, reason: 'scp-not-found' };
      return;
    }
    if (target.system === true || scpName === 'template') {
      result = { ok: false, reason: 'system-scp-cannot-delete' };
      return;
    }
    // Only an installed (non-archived) SCP can be live — an archived entry is
    // inert by construction; the guard is a no-op there but harmless.
    if (!fromArchive && target.status === 'live') {
      result = { ok: false, reason: 'scp-must-be-stopped-before-delete' };
      return;
    }

    // Seat resolution: the vault dir vs the installed dir.
    const packageDir = fromArchive
      ? resolvePath(projectRoot, 'Cascades', 'scps', '.archive', scpName)
      : resolvePath(projectRoot, 'Cascades', 'scps', scpName);

    // WAPF — the .git shape probe branches the physical delete.
    let worktreeNote: string | undefined;
    if (existsSync(packageDir)) {
      const preFlight = worktreeArchivePreFlight(packageDir);
      if (preFlight.branch === 'owner') {
        // H1 owner-with-instances — delete never strands linked instances.
        result = {
          ok: false,
          reason: 'worktrees-present-retire-first',
          instances: preFlight.instanceGitdirs,
        };
        return;
      }
      if (preFlight.branch === 'instance') {
        // H2 instance — this SCP IS a linked worktree of a parent. Resolve the
        // parent repo root from parentGitdir (<parent>/.git/worktrees/<i>) and run
        // `git worktree remove --force <packageDir>` from there so the parent's
        // worktree metadata is cleaned (registry-first · the branch survives).
        const parentRoot = resolveParentRepoRoot(preFlight.parentGitdir);
        let removed = false;
        if (parentRoot !== '') {
          try {
            execFileSync('git', ['worktree', 'remove', '--force', packageDir], {
              cwd: parentRoot,
              encoding: 'utf8',
              stdio: ['pipe', 'pipe', 'pipe'],
            });
            removed = true;
            log('scpSessionRegistry.delete.worktree-remove', { scpName, parentRoot });
          } catch (err: unknown) {
            const e = err as { stderr?: string; message?: string };
            log('scpSessionRegistry.delete.worktree-remove-failed', {
              scpName,
              detail: (typeof e.stderr === 'string' && e.stderr.trim() !== ''
                ? e.stderr.trim()
                : e.message ?? 'remove failed').slice(0, 300),
            });
          }
        }
        if (!removed) {
          // Non-fatal fallback: plain rmSync + the dangling-metadata note.
          try {
            rmSync(packageDir, { recursive: true, force: true });
          } catch (err: unknown) {
            result = {
              ok: false,
              reason: 'delete-rm-failed',
              detail: err instanceof Error ? err.message : String(err),
            };
            return;
          }
          worktreeNote = 'worktree-metadata-dangling';
          log('scpSessionRegistry.delete.worktree-metadata-dangling', { scpName, packageDir });
        }
      } else {
        // H0 clean — plain rmSync of the package dir.
        try {
          rmSync(packageDir, { recursive: true, force: true });
        } catch (err: unknown) {
          result = {
            ok: false,
            reason: 'delete-rm-failed',
            detail: err instanceof Error ? err.message : String(err),
          };
          return;
        }
      }
    } else {
      // The dir is already gone — the ledger removal still proceeds (idempotent).
      log('scpSessionRegistry.delete.dir-absent', { scpName, packageDir });
    }

    // The ledger mutation — remove from BOTH arrays (a bare name never lingers).
    const nextScps = scps.filter((entry) => entry?.name !== scpName);
    const nextArchived = archivedScps.filter((entry) => entry?.name !== scpName);
    await saveScpsJson({ ...data, scps: nextScps, archivedScps: nextArchived });

    // Teardown — the archive precedent's retirement legs (key = the OLD SCP subdir
    // absolute · the slice/watcher key convention). Installed seat uses the record's
    // path (or the standard suffix); archived seat uses originalPath when present.
    const teardownRel =
      fromArchive && typeof (target as ArchivedScpEntry).originalPath === 'string'
        ? (target as ArchivedScpEntry).originalPath
        : typeof target.path === 'string' && target.path !== ''
          ? target.path
          : `Cascades/scps/${scpName}/SCP`;
    const sliceKey = resolvePath(projectRoot, teardownRel);
    deleteSlice(sliceKey);
    disarmWatchersForScp(sliceKey);

    log('scpSessionRegistry.delete', { scpName, fromArchive, worktreeNote: worktreeNote ?? null });
    result = worktreeNote ? { ok: true, worktreeNote } : { ok: true };
  });
  return result;
}

// SDEL helper — resolve the parent repo root from an instance's parentGitdir. The
// .git file names `<parent>/.git/worktrees/<i>`; the parent working tree is the
// dir two levels up from that (…/worktrees/<i> → …/worktrees → …/.git → parent).
// When the pointer instead names the parent's .git DIRECTORY directly, dirname of
// .git is the root. Returns '' when it cannot be resolved (caller falls back).
function resolveParentRepoRoot(parentGitdir: string): string {
  if (parentGitdir === '') return '';
  // Walk up to the `.git` component, then dirname is the repo root.
  const marker = `${'/.git/'}worktrees${'/'}`;
  const gitIdx = parentGitdir.indexOf(marker);
  if (gitIdx >= 0) {
    // parentGitdir = <root>/.git/worktrees/<i> → <root> is up to gitIdx.
    return parentGitdir.slice(0, gitIdx);
  }
  // Fallback: if it ends in /.git, the parent is its dirname; else best-effort.
  if (parentGitdir.endsWith(`${'/'}.git`)) return dirname(parentGitdir);
  return '';
}

// The Archived fold's read (the helm renders it · dimmed rows + Reinstate).
export async function listArchivedScps(): Promise<ArchivedScpEntry[]> {
  const data = await loadScpsJson();
  return data.archivedScps ?? [];
}

// PSSM · W4 · THE BOOT CONSISTENCY SWEEP (bridge side).
// The markAllSessionsOffline mirror for SCPs.json: on COMPLETE daemon restart, force
// ALL persisted entries → 'pending' (the consistency point — no SCP is live until the
// launch path re-writes 'live'). One atomic write over the whole array; entries with no
// prior status are stamped 'pending' too. Runs BEFORE the status watcher arms (W0).
export async function markAllScpsPending(): Promise<void> {
  return chainWrite('markAllScpsPending', async () => {
    const data = await loadScpsJson();
    const scps = data.scps ?? [];
    if (scps.length === 0) {
      await saveScpsJson({ ...data, scps });
      log('scpSessionRegistry.markAllPending', { count: 0 });
      return;
    }
    const statusUpdatedAt = Date.now();
    const swept = scps.map((entry) => ({ ...entry, status: 'pending' as const, statusUpdatedAt }));
    await saveScpsJson({ ...data, scps: swept });
    log('scpSessionRegistry.markAllPending', { count: swept.length });
  });
}
