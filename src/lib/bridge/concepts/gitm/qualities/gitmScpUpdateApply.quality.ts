/**
 * gitmScpUpdateApply Quality · SCP-UPD D-U5 · the APPLY node (the held gate)
 *
 * The single load-bearing Lambda that LANDS the SCP update — the leg the 3-node
 * read-only update strategy (ensureClone → runDiff → stageRelay) deliberately omits.
 * Registered as the `gitm_run_apply` MCP tool, fired by the Update tab's Apply button
 * once the resolution is complete (pending === 0).
 *
 * SOURCE-OF-TRUTH (R3 · two paths, the SAME write loop):
 *   1. RESOLVED path (the normal case): read the resolver's manifest
 *      (Cascades/Bridge/scp-update-resolved.<name>.json). Its decisions[] is the TOTALITY
 *      (every file from all three buckets, one disposition each). HALT if pending !== 0.
 *   2. EMPTY-CONFERENCE path (no resolver needed): if no resolved manifest but the diff
 *      (scp-update-diff.<name>.json) has conference === 0, synthesize 'patch' decisions
 *      from the diff's `apply` bucket — the safe template-non-conflicts auto-apply with no
 *      user gate. (Apply still NEVER touches the `preserve` bucket.)
 *
 * THE PRESERVE-DOCTRINE (R4 fracture-point · built IN, not trusted to the classifier):
 *   a decision of disposition 'preserve' is a NO-OP — the file is NEVER written/overwritten,
 *   even if a future template ships a default for it (e.g. Cascades/hifiConfig.json, the
 *   Pewter color). The diff classifier's allow-list is HARDCODED; this quality does NOT
 *   trust it alone — preserve is enforced here at the write seam. The manifold test's color
 *   MUST survive an update.
 *
 * THE WRITE LOOP (iterate decisions ONCE):
 *   'write'    → write resolvedContent verbatim to <scpDir>/<path> (mkdir -p the parent).
 *   'patch'    → apply the unified-diff hunk via `git apply` against <scpDir>.
 *   'preserve' → NO-OP (the user's file wins).
 *   applied files (write + patch) are staged via the EXISTING gitmExec seam (`git add`),
 *   then committed (`git commit -m`) on the SCP RED repo — landing via the GitM we built.
 *
 * THE RAIL: stamps stage='applying' on entry; stage='idle' on success (or 'error' on a
 *   write/apply/commit failure, with the count of applied files + the error surfaced on
 *   updateStatus). HALT (pending !== 0 OR no source) returns the rail to 'reviewing'.
 *
 * Read-only on the DIFF script (apply is a SEPARATE Lambda · the diff's read-only invariant
 * stays intact). Synchronous Method (bounded sync on the action beat · gitmExec discipline).
 *
 * Template: gitmScpUpdateStageRelay.quality.ts (diff-JSON read + bucket + partial reducer +
 *   muxiumConclude) · gitmCommit.quality.ts / gitmStageFile.quality.ts (gitmExec landing seam) ·
 *   selectGitmOpCwd (the SCP-Sovereign cwd).
 * Citation: UPDATE-GROUND-R4-VIRIDIAN.md §Forward Context 1-3 (the apply leg · reconcile ·
 *   source-of-truth) · UPDATE-GROUND-R6-AMETHYST.md §4.1 (the apply quality · preserve-doctrine)
 *   · MANIFOLD-TEST-R7-FUCHSIA.md §3 (the D-U5 apply · pending gate · totality).
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync, unlinkSync } from 'node:fs';
import { homedir } from 'node:os';
import { join, basename, dirname, isAbsolute } from 'node:path';
import {
  createQualityCardWithPayload,
  createMethodWithConcepts,
  muxiumConclude,
  strategySuccess,
  selectPayload,
  type Concept,
} from 'stratimux';
import type { GitmState, UpdateStatusShape, GitmABMode } from '../gitm.types';
import { UPDATE_APPLIED_NOTE } from '../gitm.types';
import { stampSliceUpdateStatus, getSlice, upsertSliceFields } from '../model/gitmSliceStore.model';
import { gitmExec } from '../model/gitmExec.model';
import { resolveGitmTargetCwd } from '../model/gitmOpCwd.model';
import { isSelectedWorkingBranch } from '../model/gitmBranchRoot.model';
import { log } from '../../../debugLog';
import { getBridgeMuxameter } from '../../../bridgeVersion';
import { getActiveScsBridgeMuxiumHandle } from '../../../scsBridgeMuxium';
import type { GitmScpUpdateApplyPayload, GitmScpUpdateApply } from './types';

export type { GitmScpUpdateApply };

type GitmSelfDeck = {
  gitm: Concept<GitmState, Record<string, unknown>>;
};

// GITM Dev Epoch (MD-C · FOLD #5a · THE SCP/SCP/ PATH-DOUBLING AUDIT). The diff decision paths are
// `SCP/...`-prefixed (the RED repo tracks files at that prefix · scp-3way-diff.sh:59). opCwd is
// SUPPOSED to be the SCP repo ROOT (the parent of the SCP/ package dir) — but the C316 stray
// `SCP/SCP/` observation proves opCwd SOMETIMES already ends in /SCP (the package dir itself). In
// that case join(opCwd, 'SCP/foo') → <…>/SCP/SCP/foo (doubled). FIX: if opCwd's basename equals the
// decision path's FIRST segment, strip that duplicate first segment before joining (join from the
// already-inside-the-segment opCwd). Returns { abs, dedoubled } so the caller logs the marker once.
export function resolveApplyPath(opCwd: string, relPath: string): { abs: string; dedoubled: boolean } {
  const firstSeg = relPath.split('/')[0];
  if (firstSeg !== '' && basename(opCwd) === firstSeg) {
    const stripped = relPath.slice(firstSeg.length + 1); // drop 'SCP/' → 'foo/bar'
    return { abs: join(opCwd, stripped), dedoubled: true };
  }
  return { abs: join(opCwd, relPath), dedoubled: false };
}

// ── The bridge-local resolved-manifest shape (the bridge reads its OWN JSON · the SCP
//    template's UpdateResolvedShape is the client mirror · same canonical contract). ──
type ApplyDisposition = 'write' | 'patch' | 'preserve';
type ApplyDecision = {
  path: string;
  disposition: ApplyDisposition;
  resolvedContent: string;
  patch: string;
};

// The result the reducer stamps onto updateStatus (applied count + error surface).
// RS.4: targetDir = the resolved target SCP dir (the slice key) rides every landing.
type ApplyBucketItem =
  | {
      ok: true;
      applied: number;
      preserved: number;
      committed: boolean;
      mintedSword: string;
      targetDir: string;
    }
  | { ok: false; error: string; halt: boolean; targetDir: string }; // halt → rail back to 'reviewing'
const bucket: ApplyBucketItem[] = [];

// Coerce ONE raw resolved decision → the apply decision (the silent-coerce trap guard:
// an unknown disposition becomes 'preserve' — a no-op — never a wild write).
function coerceDecision(raw: unknown): ApplyDecision {
  const d = (raw ?? {}) as Record<string, unknown>;
  const dispRaw = d.disposition;
  const disposition: ApplyDisposition =
    dispRaw === 'write' || dispRaw === 'patch' || dispRaw === 'preserve' ? dispRaw : 'preserve';
  return {
    path: typeof d.path === 'string' ? d.path : '',
    disposition,
    resolvedContent: typeof d.resolvedContent === 'string' ? d.resolvedContent : '',
    patch: typeof d.patch === 'string' ? d.patch : '',
  };
}

// Read + parse the resolved manifest → { decisions, pending } or null (absent/unparseable).
function readResolved(
  resolvedPath: string,
): { decisions: ApplyDecision[]; pending: number } | null {
  try {
    const raw = readFileSync(resolvedPath, 'utf8');
    if (!raw.trim()) return null;
    const parsed = JSON.parse(raw) as { decisions?: unknown; pending?: unknown };
    const decisions = Array.isArray(parsed.decisions)
      ? parsed.decisions.map(coerceDecision)
      : [];
    const pending = typeof parsed.pending === 'number' ? parsed.pending : 0;
    return { decisions, pending };
  } catch {
    return null;
  }
}

// Read the diff manifest → the EMPTY-CONFERENCE fallback (no resolver run). MD-C · FOLD #5b —
// THE RESOLVER HUNK-EMBEDDING: the diff script now embeds a `hunk` (ours→resultTree per path) on
// every apply-bucket entry, so a conference-0 update lands NO-AGENT — this fallback synthesizes
// 'patch' decisions bridge-side directly from the embedded hunks (zero-collision zero-round). The
// `preserve` bucket is not landed (it is the user's own state · left untouched). GATED to
// conference === 0 AND every apply entry carrying a hunk (else HALT — a resolver is required for
// collisions, and a hunk-less apply entry is a pre-fold diff needing the resolver's resultTree).
function readDiffFallback(
  diffPath: string,
  opCwd: string,
): { decisions: ApplyDecision[]; pending: number } | null {
  try {
    const raw = readFileSync(diffPath, 'utf8');
    if (!raw.trim()) return null;
    const parsed = JSON.parse(raw) as {
      summary?: { apply?: unknown; conference?: unknown };
      buckets?: { apply?: unknown };
      provenance?: { oursSha?: unknown; resultTree?: unknown };
    };
    const summary = parsed.summary ?? {};
    const conference = typeof summary.conference === 'number' ? summary.conference : 0;
    const apply = typeof summary.apply === 'number' ? summary.apply : 0;
    // A resolver is mandatory whenever there is a collision (conference > 0).
    if (conference > 0) return null;
    // CLEAN diff (nothing to apply) → land nothing.
    if (apply === 0) return { decisions: [], pending: 0 };
    // FOLD #5b — the apply bucket carries embedded hunks. Synthesize 'patch' decisions from them.
    const applyBucket = Array.isArray(parsed.buckets?.apply) ? (parsed.buckets!.apply as unknown[]) : [];
    const oursSha =
      typeof parsed.provenance?.oursSha === 'string' ? parsed.provenance.oursSha : '';
    const resultTree =
      typeof parsed.provenance?.resultTree === 'string' ? parsed.provenance.resultTree : '';
    const decisions: ApplyDecision[] = [];
    for (const rawEntry of applyBucket) {
      const e = (rawEntry ?? {}) as Record<string, unknown>;
      const path = typeof e.path === 'string' ? e.path : '';
      let hunk = typeof e.hunk === 'string' ? e.hunk : '';
      if (path === '') return null;
      // D-MB · THE OVERSIZE-HUNK EVICTION: an entry with hunkBytes declares its hunk was
      // evicted from the JSON (a lock-file hunk alone measured 668KB) — the bytes live in
      // the repo's object db; source them on demand (the same command the script ran).
      if (hunk === '' && typeof e.hunkBytes === 'number' && oursSha !== '' && resultTree !== '') {
        const sourced = gitmExec(['diff', oursSha, resultTree, '--', path], opCwd);
        if (sourced.ok && sourced.stdout.trim() !== '') {
          hunk = sourced.stdout;
        }
      }
      // A hunk-less apply entry (and no eviction marker anor sourcing failed) means the
      // resolver is required (it has the resultTree to mint bytes). HALT the no-agent path.
      if (hunk === '') return null;
      decisions.push({ path, disposition: 'patch', resolvedContent: '', patch: hunk });
    }
    return { decisions, pending: 0 };
  } catch {
    return null;
  }
}

// ── R3 · THE PART-RENEWAL RULES (apply-seam placement · RAMS-lite) ──
// scripts/scp-update-rules.json declares two seam controls: neverDeletePaths (a delete-landing
// on one of these is coerced to preserve) and preservedJsonFields (a 'write' landing on one of
// these JSON files copies the named field values from the user's ON-DISK file onto the incoming
// resolvedContent BEFORE landing — so a template default never clobbers name/scpName/etc.).
// Absent file = no rules (unchanged behavior · the doctrine still holds at the write seam).
type PartRenewalRules = {
  preservedJsonFields: Record<string, string[]>;
  neverDeletePaths: string[];
};

const EMPTY_RULES: PartRenewalRules = { preservedJsonFields: {}, neverDeletePaths: [] };

// Load the rules JSON from the dev userCwd first, else the retained-clone fallback (an INSTALLED
// bridge's userCwd has no scripts/ — the update-clone retains the template's scripts/). Absent /
// unparseable at both → EMPTY_RULES (no rules · unchanged behavior).
function loadPartRenewalRules(userCwd: string): PartRenewalRules {
  const candidates = [
    join(userCwd, 'scripts', 'scp-update-rules.json'),
    join(homedir(), '.scs-bridge', 'update-clone', 'clone', 'scripts', 'scp-update-rules.json'),
  ];
  for (const p of candidates) {
    if (!existsSync(p)) continue;
    try {
      const raw = readFileSync(p, 'utf8');
      if (!raw.trim()) continue;
      const parsed = JSON.parse(raw) as {
        preservedJsonFields?: unknown;
        neverDeletePaths?: unknown;
      };
      const preservedJsonFields =
        parsed.preservedJsonFields && typeof parsed.preservedJsonFields === 'object'
          ? (parsed.preservedJsonFields as Record<string, string[]>)
          : {};
      const neverDeletePaths = Array.isArray(parsed.neverDeletePaths)
        ? parsed.neverDeletePaths.filter((x): x is string => typeof x === 'string')
        : [];
      return { preservedJsonFields, neverDeletePaths };
    } catch {
      // fall through to the next candidate
    }
  }
  return EMPTY_RULES;
}

// RS.2c · THE SELF-DESCRIBING DIFF: the diff script pins the rules the merge was computed
// under into provenance.rules — prefer them over any on-disk rules file (a bridge update
// mid-flight can skew the disk rules away from the computed merge, and the update flow is
// exactly where that window opens). Absent/malformed → null (older diffs use the disk chain).
function readPinnedRules(diffPath: string): PartRenewalRules | null {
  try {
    if (!existsSync(diffPath)) return null;
    const raw = readFileSync(diffPath, 'utf8');
    if (!raw.trim()) return null;
    const parsed = JSON.parse(raw) as { provenance?: { rules?: unknown } };
    const rules = parsed.provenance?.rules;
    if (!rules || typeof rules !== 'object') return null;
    const r = rules as { preservedJsonFields?: unknown; neverDeletePaths?: unknown };
    const preservedJsonFields =
      r.preservedJsonFields && typeof r.preservedJsonFields === 'object'
        ? (r.preservedJsonFields as Record<string, string[]>)
        : {};
    const neverDeletePaths = Array.isArray(r.neverDeletePaths)
      ? r.neverDeletePaths.filter((x): x is string => typeof x === 'string')
      : [];
    return { preservedJsonFields, neverDeletePaths };
  } catch {
    return null;
  }
}

// Copy the preserved field values from the user's ON-DISK JSON onto the incoming parsed content.
// Selector "packages..name" = packages[""].name (the package-lock root-package name mirror);
// every other selector is a flat root field by name. Mutates `into` in place.
function applyPreservedFields(
  onDisk: Record<string, unknown>,
  into: Record<string, unknown>,
  selectors: string[],
): void {
  for (const selector of selectors) {
    if (selector === 'packages..name') {
      const onDiskPackages = onDisk.packages;
      const intoPackages = into.packages;
      if (
        onDiskPackages && typeof onDiskPackages === 'object' &&
        intoPackages && typeof intoPackages === 'object'
      ) {
        const odRoot = (onDiskPackages as Record<string, unknown>)[''];
        const intoRoot = (intoPackages as Record<string, unknown>)[''];
        if (
          odRoot && typeof odRoot === 'object' &&
          intoRoot && typeof intoRoot === 'object' &&
          'name' in (odRoot as Record<string, unknown>)
        ) {
          (intoRoot as Record<string, unknown>).name = (odRoot as Record<string, unknown>).name;
        }
      }
      continue;
    }
    if (selector in onDisk) into[selector] = onDisk[selector];
  }
}

export const gitmScpUpdateApply = createQualityCardWithPayload<
  GitmState,
  GitmScpUpdateApplyPayload,
  GitmSelfDeck
>({
  type: 'Gitm Scp Update Apply',
  reducer: (state) => {
    const item = bucket.pop();
    if (!item) {
      // Stamp 'applying' on the entry beat (the method has fired; the bucket fills on the
      // same beat — the defensive empty-pop keeps the rail moving to 'applying').
      const updateStatus: UpdateStatusShape = { ...state.updateStatus, stage: 'applying' };
      return { updateStatus };
    }
    // RS.4 · THE PER-SCP RAIL — stamp the TARGET's slice; flat is the ACTIVE projection.
    const stamp = item.ok
      ? {
          stage: 'idle' as const,
          stageError: '',
          diffPresent: false,
          resolvedPending: 0,
        }
      : {
          stage: item.halt ? ('reviewing' as const) : ('error' as const),
          stageError: item.halt ? '' : item.error,
        };
    stampSliceUpdateStatus(item.targetDir, stamp);
    if (item.targetDir !== '' && item.targetDir !== state.activeScpDir) {
      // THE STRANDED-SWORD CURE (the CaseA field break): the flat-only A/B
      // registration was gated away here — the Turn Over then found NO working B,
      // minted a FRESH Sword from pre-update A, and stranded the landing commit.
      // A non-active target's minted Sword registers on ITS OWN slice (branchRoles.a
      // = the TARGET's stable — never the active flat's); error surfaces likewise.
      if (item.ok && item.mintedSword !== '') {
        const targetStable = getSlice(item.targetDir)?.stableBranch ?? '';
        upsertSliceFields(item.targetDir, {
          workingBranch: item.mintedSword,
          branchRoles: { a: targetStable, b: item.mintedSword },
          abMode: 'candidate-created',
        });
      } else if (!item.ok && !item.halt) {
        upsertSliceFields(item.targetDir, {
          errorCode: 'update-apply-failed',
          errorMessage: item.error,
        });
      }
      return { updateRailTick: state.updateRailTick + 1 };
    }
    if (!item.ok) {
      // HALT (pending/no-source) → return the rail to 'reviewing' so the user can resolve +
      // retry; a real write/apply/commit failure → 'error' with the message.
      const updateStatus: UpdateStatusShape = {
        ...state.updateStatus,
        ...stamp,
      };
      return item.halt
        ? { updateStatus }
        : { updateStatus, errorCode: 'update-apply-failed', errorMessage: item.error };
    }
    // Success → land the rail at 'idle' (the update is complete · the changed files surface
    // in the normal git panels). Clear the diff-present flag so the section collapses.
    const updateStatus: UpdateStatusShape = {
      ...state.updateStatus,
      ...stamp,
    };
    // C324: the apply minted the Sword — register the signifier so the Turn Over system
    // (the panel's B control · the seat law · the merge-back gate) sees the working B.
    // D-BN · branchRoles LOCKSTEP — the minted Sword becomes roles.b (a=stable preserved).
    if (item.mintedSword !== '') {
      return {
        updateStatus,
        errorCode: '',
        errorMessage: '',
        workingBranch: item.mintedSword,
        branchRoles: { a: state.stableBranch, b: item.mintedSword },
        abMode: 'candidate-created' as GitmABMode,
      };
    }
    return { updateStatus, errorCode: '', errorMessage: '' };
  },
  methodCreator: () =>
    createMethodWithConcepts(({ action, deck }) => {
      // MULTI-SCP GITM MUXIFICATION (MC-W1) — CALLING SCP's RED repo (origin-aware) · SCP-Sovereign fallback.
      const opCwd = resolveGitmTargetCwd(deck, selectPayload<GitmScpUpdateApplyPayload>(action).originScpName);
      const userCwd = deck.gitm.k.userCwd.select(); // the install root (Cascades/Bridge lives here)
      const stateScpName = deck.gitm.k.updateStatus.select().scpName;
      const payload = selectPayload<GitmScpUpdateApplyPayload>(action);
      const scpName =
        payload?.scpName && payload.scpName !== ''
          ? payload.scpName
          : stateScpName !== ''
            ? stateScpName
            : basename(opCwd);

      const bridgeDir = join(userCwd, 'Cascades', 'Bridge');
      const resolvedPath = join(bridgeDir, `scp-update-resolved.${scpName}.json`);
      const diffPath = join(bridgeDir, `scp-update-diff.${scpName}.json`);

      // 1) Resolve the source of truth: the resolver manifest first, else the empty-conference
      //    diff fallback. No source at all → HALT (return to 'reviewing').
      let source = readResolved(resolvedPath);
      if (source === null) {
        source = readDiffFallback(diffPath, opCwd);
        if (source === null) {
          bucket.push({
            ok: false,
            halt: true,
            error:
              'apply: no resolved manifest and the diff is non-trivial — run the resolver first',
            targetDir: opCwd,
          });
          return action.strategy ? strategySuccess(action.strategy) : muxiumConclude();
        }
      }

      // 2) THE HALT GATE — never auto-apply unresolved conferences.
      if (source.pending !== 0) {
        bucket.push({
          ok: false,
          halt: true,
          error: `apply: ${source.pending} conference decision(s) still pending`,
          targetDir: opCwd,
        });
        return action.strategy ? strategySuccess(action.strategy) : muxiumConclude();
      }

      // 2.5) LOAD THE PART-RENEWAL RULES (R3 · apply-seam placement). The diff's own pinned
      // provenance.rules first (RS.2c); the disk chain only for older diffs. Absent → EMPTY_RULES.
      const rules = readPinnedRules(diffPath) ?? loadPartRenewalRules(userCwd);

      // 2.7) THE DIRTY-TREE GATE (C284 · the 077 second-run collision): the diff computes
      // against HEAD, but patches land on the WORKING TREE — a tree carrying uncommitted
      // changes (a prior apply never boot-tested) collides (delete-of-deleted, re-patch of
      // patched). The canon: Turn-Over B commits + boot-tests the tree FIRST. HALT with the
      // recovery instruction (halt:true → the rail returns to reviewing · user-correctable).
      const treeStatus = gitmExec(['status', '--porcelain'], opCwd);
      if (!treeStatus.ok || (treeStatus.stdout ?? '').trim() !== '') {
        bucket.push({
          ok: false,
          halt: true,
          error:
            'apply: B carries uncommitted changes — Turn Over B first (commits + boot-tests them), then re-run the update',
          targetDir: opCwd,
        });
        return action.strategy ? strategySuccess(action.strategy) : muxiumConclude();
      }

      // 2.9) APPLY-TO-CURRENT (MD-ATC · the user law · REPEALS the C324 forced Sword-seat):
      // the landing commits to WHATEVER branch is checked out — never force-minted onto a
      // B. When the CURRENT branch is a working B (the Selected-B predicate: the b/
      // namespace anor the registered roles.b — a hopped-to, never-registered B counts),
      // it registers as the working B downstream (mintedSword carries it; the C324 flat
      // registration + the RS.4 slice leg both key off it) so Turn Over B enables. On A
      // anor any non-B branch, NO B registers and the landing simply arrives at the
      // current branch — the dirty-tree gate above remains the guard.
      let mintedSword = '';
      {
        const knownB = deck.gitm.k.branchRoles.select().b;
        const cur = gitmExec(['branch', '--show-current'], opCwd);
        const curBranch = (cur.stdout ?? '').trim();
        if (cur.ok && isSelectedWorkingBranch(curBranch, knownB)) {
          mintedSword = curBranch;
          log('gitm.update.apply.current-b-registered', { branch: curBranch });
        } else {
          log('gitm.update.apply.landing-on-current', { branch: curBranch });
        }
      }

      // 3) THE WRITE LOOP — iterate the totality ONCE. write / patch / preserve(no-op).
      const stagedPaths: string[] = [];
      let applied = 0;
      let preserved = 0;
      try {
        for (const decision of source.decisions) {
          if (decision.path === '') continue;
          // Guard: never escape the SCP repo root (no absolute paths, no `..` traversal).
          if (isAbsolute(decision.path) || decision.path.split('/').includes('..')) {
            throw new Error(`apply: refused unsafe path "${decision.path}"`);
          }
          // R3 · NEVER-DELETE COERCION — a decision whose path is in neverDeletePaths AND whose
          // landing would DELETE the file (write of empty content) is coerced to preserve (skip).
          const wouldDelete = decision.disposition === 'write' && decision.resolvedContent === '';
          if (rules.neverDeletePaths.includes(decision.path) && wouldDelete) {
            log('gitm.update.apply.part-preserved', { path: decision.path, reason: 'never-delete' });
            preserved += 1;
            continue;
          }
          // THE PRESERVE-DOCTRINE — a preserve decision is inviolable (no write, ever).
          if (decision.disposition === 'preserve') {
            preserved += 1;
            continue;
          }
          // FOLD #5a · the SCP/SCP/ dedouble (opCwd already ends in the path's first segment).
          const resolved = resolveApplyPath(opCwd, decision.path);
          const absTarget = resolved.abs;
          if (resolved.dedoubled) {
            log('gitm.update.apply.path-dedoubled', { path: decision.path, opCwd });
          }
          if (decision.disposition === 'write') {
            // R3 · PART-PRESERVATION — a 'write' onto a preservedJsonFields JSON file copies the
            // named field values from the user's ON-DISK JSON onto the incoming content BEFORE
            // landing (so a template default never clobbers name/scpName/etc.). Parse failure →
            // land resolvedContent unmodified + log.
            let contentToWrite = decision.resolvedContent;
            const preservedSelectors = rules.preservedJsonFields[decision.path];
            if (preservedSelectors && preservedSelectors.length > 0 && existsSync(absTarget)) {
              try {
                const onDisk = JSON.parse(readFileSync(absTarget, 'utf8')) as Record<string, unknown>;
                const incoming = JSON.parse(decision.resolvedContent) as Record<string, unknown>;
                applyPreservedFields(onDisk, incoming, preservedSelectors);
                contentToWrite = JSON.stringify(incoming, null, 2);
                log('gitm.update.apply.part-preserved', {
                  path: decision.path,
                  fields: preservedSelectors,
                  reason: 'json-field',
                });
              } catch {
                // parse failure → land resolvedContent unmodified
                contentToWrite = decision.resolvedContent;
                log('gitm.update.apply.part-preserved', {
                  path: decision.path,
                  reason: 'parse-failed-land-verbatim',
                });
              }
            }
            mkdirSync(dirname(absTarget), { recursive: true });
            writeFileSync(absTarget, contentToWrite, 'utf8');
            stagedPaths.push(decision.path);
            applied += 1;
          } else if (decision.disposition === 'patch') {
            if (decision.patch.trim() === '') {
              // A patch decision with no hunk is a no-op (defensive · never a wild write).
              continue;
            }
            // C293 · THE IDENTITY-PATCH HOLE (085): the rules only guarded 'write' — an
            // identity reversion delivered as a PATCH bypassed the seam and reverted
            // scpName/name on the live install. Snapshot the preserved field values
            // BEFORE the patch; restore them after (the seam guards ALL dispositions).
            const patchPreservedSelectors = rules.preservedJsonFields[decision.path];
            let prePatchSnapshot: Record<string, unknown> | null = null;
            if (patchPreservedSelectors && patchPreservedSelectors.length > 0 && existsSync(absTarget)) {
              try {
                prePatchSnapshot = JSON.parse(readFileSync(absTarget, 'utf8')) as Record<string, unknown>;
              } catch {
                prePatchSnapshot = null;
              }
            }
            // `git apply` against the SCP repo root · the hunk is fed on stdin via the UNIFIED
            // gitmExec input seam (MD-A · so hunk ops never escape the command log). Control flow
            // preserved: a non-ok exec RE-THROWS into the catch (was execFileSync's throw).
            // C284 idempotence: on failure, if the REVERSE applies cleanly the patch is
            // ALREADY LANDED (covers delete-of-already-deleted) → skip as satisfied;
            // otherwise rethrow the original (a genuine conflict must surface).
            const applyExec = gitmExec(['apply', '--whitespace=nowarn', '-'], opCwd, decision.patch);
            if (!applyExec.ok) {
              const reverseCheck = gitmExec(
                ['apply', '--whitespace=nowarn', '--reverse', '--check', '-'],
                opCwd,
                decision.patch,
              );
              if (reverseCheck.ok) {
                log('gitm.update.apply.already-applied', { path: decision.path });
                // C315: an already-satisfied patch has NOTHING in the tree to stage — pushing it
                // to stagedPaths made `git add` fatal on never-existed paths (the 087 deletion).
                continue;
              }
              throw new Error(applyExec.error || applyExec.stderr || 'git apply failed');
            }
            if (prePatchSnapshot !== null && patchPreservedSelectors) {
              try {
                const postPatch = JSON.parse(readFileSync(absTarget, 'utf8')) as Record<string, unknown>;
                applyPreservedFields(prePatchSnapshot, postPatch, patchPreservedSelectors);
                writeFileSync(absTarget, JSON.stringify(postPatch, null, 2), 'utf8');
                log('gitm.update.apply.part-preserved', {
                  path: decision.path,
                  fields: patchPreservedSelectors,
                  reason: 'json-field-post-patch',
                });
              } catch (restoreErr: unknown) {
                // C310 (FailureNode Doctrine): the patch LANDED but the identity restore FAILED —
                // a silent continue ships an inconsistent file as success. Hand the outcome.
                const rMsg = restoreErr instanceof Error ? restoreErr.message : String(restoreErr);
                throw new Error(`post-patch identity restore failed on "${decision.path}": ${rMsg}`);
              }
            }
            stagedPaths.push(decision.path);
            applied += 1;
          }
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        bucket.push({
          ok: false,
          halt: false,
          error: `apply write loop: ${message}`,
          targetDir: opCwd,
        });
        return action.strategy ? strategySuccess(action.strategy) : muxiumConclude();
      }

      // D-RD1 · THE APPLIED-COUNTER STAMP (the Red Discipline): the landed payload IS the
      // installed package's scp counter — stamp it into the SCP's own scp.config.json BEFORE
      // the landing commit so the stamp rides it. The /scs-bridge-version verdict keys the
      // red label on THIS applied counter (not the global install): red persists until the
      // payload lands; purple returns here. Absent counter (pre-counter build) → skip.
      let stampWrote = false;
      const freshMuxameter = getBridgeMuxameter(undefined, true);
      if (freshMuxameter) {
        try {
          const configAbs = resolveApplyPath(opCwd, 'SCP/scp.config.json').abs;
          const rawConfig = existsSync(configAbs)
            ? (JSON.parse(readFileSync(configAbs, 'utf8')) as Record<string, unknown>)
            : {};
          if (rawConfig.scsMuxameterScp !== freshMuxameter.scp) {
            rawConfig.scsMuxameterScp = freshMuxameter.scp;
            writeFileSync(configAbs, JSON.stringify(rawConfig, null, 2) + '\n', 'utf8');
            stampWrote = true;
            log('gitm.update.apply.muxameter-stamped', { scpName, appliedScp: freshMuxameter.scp });
          }
        } catch (err: unknown) {
          log('gitm.update.apply.muxameter-stamp-failed', {
            error: err instanceof Error ? err.message.slice(0, 200) : String(err),
          });
        }
      }

      // 4) LAND via the EXISTING GitM seam — stage the applied files, then commit on the SCP
      //    RED repo. Nothing applied → nothing to land (success · no commit). The stamp alone
      //    also lands (an all-preserved apply is still a landed payload).
      let committed = false;
      if (stagedPaths.length > 0 || stampWrote) {
        // C322 · STAGE-THE-OUTCOME, NOT THE MANIFEST: per-path `git add <p>` dies on pathspec
        // quirks the write loop legitimately produces (deletions of absent-but-tracked files —
        // the 087/088 fatal class). The tree IS the truth after the write loop; one sweep
        // stages it whole (the proven gitm_stage_all_and_commit verb).
        const add = gitmExec(['add', '-A'], opCwd);
        if (!add.ok) {
          bucket.push({
            ok: false,
            halt: false,
            error: `apply stage sweep: ${add.error || add.stderr}`,
            targetDir: opCwd,
          });
          return action.strategy ? strategySuccess(action.strategy) : muxiumConclude();
        }
        const commitMessage = `SCS update · applied ${applied} template change(s) [${scpName}]`;
        const commit = gitmExec(['commit', '-m', commitMessage], opCwd);
        if (!commit.ok) {
          bucket.push({
            ok: false,
            halt: false,
            error: `apply commit: ${commit.error || commit.stderr}`,
            targetDir: opCwd,
          });
          return action.strategy ? strategySuccess(action.strategy) : muxiumConclude();
        }
        committed = true;
      }

      // D-UP3 · THE CYCLE-COMPLETE ARTIFACT CLEAR (the stale-availability wound): the diff +
      // resolved artifacts are THIS cycle's working papers — leaving them on disk let C1
      // hydration resurrect a finished cycle after restart and enable the resolver/apply off
      // stale state before the next Run Update. Clear them at apply success (the boot-watch
      // clear remains as the Turn-Over belt). Failure is logged, never fatal — the apply landed.
      for (const artifactPath of [resolvedPath, diffPath]) {
        try {
          if (existsSync(artifactPath)) unlinkSync(artifactPath);
        } catch (err: unknown) {
          log('gitm.update.apply.artifact-clear-failed', {
            artifactPath,
            error: err instanceof Error ? err.message.slice(0, 200) : String(err),
          });
        }
      }
      log('gitm.update.apply.artifacts-cleared', { scpName });

      bucket.push({ ok: true, applied, preserved, committed, mintedSword, targetDir: opCwd });
      // C289 AUTO-SEQUENCE (the bridge-owned Concluding Sequence): when the manifest watcher
      // triggered this apply, the bridge itself fires the boot-test turn-over to B after the
      // beat settles — the resolver session's in-turn /mcp calls (the queue-serialization
      // starvation) are no longer on the landing path. Dispatch rides the live-handle seam
      // (async · outside this action's context), same as the chokidar arms.
      if (payload?.autoSequence === true) {
        // C293 (user flow decision): the bridge does NOT auto-turn-over — the update's
        // final stage belongs to the USER. Stamp the rail so the Update view enables
        // the Bridge Turn-Over controls as the finalize step.
        log('gitm.update.apply.auto-sequence', { scpName, applied, committed });
        setTimeout(() => {
          const h = getActiveScsBridgeMuxiumHandle();
          if (h !== null) {
            h.muxium.dispatch(
              // RS.3 · SOVEREIGN — the terminal applied note routes to THIS update's rail
              // (originScpName carried; scpName fallback = the target IS the updated SCP).
              h.muxium.deck.d.gitm.e.gitmScpUpdateProgress({
                stage: 'idle',
                note: UPDATE_APPLIED_NOTE,
                originScpName: payload?.originScpName ?? scpName,
              }) as never,
            );
            // F3 · THE PASS BACK — after the terminal applied stamp lands (the Apply Success
            // panel now firing), bring the SCP window to the foreground so the user's eyes land
            // on it. Reuse the scs_focus_bridge_window Lambda DIRECTLY (its quality on the same
            // live-handle seam · no HTTP). It resolves the SCP window by env SCS_BRIDGE_ORIGIN_SCP
            // → lookupScpWindowId; set it to this update's scpName so the EXACT window is focused.
            // Guard: only on the auto-sequence path (the manifest-watcher landing · user is elsewhere).
            try {
              process.env.SCS_BRIDGE_ORIGIN_SCP = scpName;
              h.muxium.dispatch(
                h.muxium.deck.d.scsBridge.e.scsBridgeFocusUrlWindow({}) as never,
              );
            } catch (focusErr: unknown) {
              log('gitm.update.apply.focus-failed', {
                scpName,
                error: focusErr instanceof Error ? focusErr.message : String(focusErr),
              });
            }
          }
        }, 600);
      }
      // Concluder: no successNode follows; this is a standalone tool Lambda (not a strategy node).
      return action.strategy ? strategySuccess(action.strategy) : muxiumConclude();
    }),
});
