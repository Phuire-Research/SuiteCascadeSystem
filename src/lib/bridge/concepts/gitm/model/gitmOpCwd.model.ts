/**
 * gitmOpCwd Model · GITM SCP-SOVEREIGN · the single operating-cwd seam
 *
 * `selectGitmOpCwd(deck)` resolves the cwd EVERY gitm git op runs against:
 *   activeScpDir (the active SCP PACKAGE dir) when an SCP is bound, ELSE userCwd (the install
 *   root · the no-SCP / dev-repo fallback). A PURE derivation — no state field, no sync invariant
 *   (S4 Seam C · the helper cannot drift the way a duplicated `gitmOpCwd` field could).
 *
 * The 28 gitmExec-calling qualities swap `deck.gitm.k.userCwd.select()` → `selectGitmOpCwd(deck)`.
 * gitmRecountLocation is the ONE exception — it is the location router (it picks the cwd per
 * location: base=userCwd, cascade=userCwd/Cascades, scp=activeScpDir) and MUST keep that logic.
 *
 * The `||` fallback keeps a half-wired state safe: if the helper is called before the bind seam
 * sets activeScpDir, it resolves to userCwd (the ops keep working on the install root, no crash).
 *
 * Citation: GITM-SOV-S4-GREEN.md Seam C (the helper · shape 1) · GITM-SOV-S1-RED.md REPOINT-2.
 */

// The minimal STRUCTURAL deck shape the helper needs — just the two string selectors it reads.
// Structural (not the full ConceptDECK) so it accepts the runtime deck every gitmExec-calling
// quality's Method already holds (deck.gitm.k.<field>.select()), without coupling to the exact
// ConceptDECK generic the methods carry.
type GitmOpCwdDeck = {
  gitm: {
    k: {
      activeScpDir: { select: () => string };
      userCwd: { select: () => string };
    };
  };
};

export function selectGitmOpCwd(deck: GitmOpCwdDeck): string {
  const activeScpDir = deck.gitm.k.activeScpDir.select();
  const userCwd = deck.gitm.k.userCwd.select();
  return activeScpDir !== '' ? activeScpDir : userCwd;
}

// ────────────────────────────────────────────────
// MULTI-SCP GITM MUXIFICATION (Fork B · MC-W1 · THE ORIGIN THREAD)
// ────────────────────────────────────────────────
//
// THE DEFECT resolveGitmTargetCwd repairs: ONE flat GitmState + ONE gitm.json write target serve
// N running SCPs, so every gitm op resolved to the SINGLE active SCP's cwd (selectGitmOpCwd) — an
// op invoked BY a non-active SCP ran against the active SCP's tree (THE CHIMERA). The origin thread
// routes each op to ITS OWN caller's repo by resolving the CALLER's identity through the FKIS chain.
//
// THE FKIS CHAIN (env-first · the scsBridgeSendMessage precedent):
//   1. process.env.SCS_BRIDGE_ORIGIN_SCP — the origin SCP NAME (dev:self / agent · injected on the
//      bridge process). A NAME (e.g. 'template'), NOT a dir — resolved to its package dir via the
//      SCPs.json registry (readScpRegistry(userCwd).scps.find(s => s.name === name).path — the SAME
//      name→dir map scsBridgeLaunchScp uses to bind activeScpDir = entry.path).
//   2. originScpName (payload) — carried per-op from the SCP's own send path (GET /scp-config →
//      controller → payload.originScpName), same NAME→dir treatment. If the name is NOT in the
//      registry BUT is an absolute directory path, it is accepted AS a directory (documented
//      fallback per the MC-W1 brief — a caller may pass its package dir directly).
//   3. selectGitmOpCwd(deck) — the existing active→userCwd chain (no origin identity available).
//
// WithOrigin (qualities/types.ts) threads originScpName onto every gitm operation payload; the
// ~30 gitmExec-calling qualities swap selectGitmOpCwd(deck) → resolveGitmTargetCwd(deck,
// payload.originScpName). selectGitmOpCwd stays exported + the terminal fallback (a half-wired
// state — no env, no payload — resolves to the active SCP or the install root, never crashes).
//
// Citation: scpConfig.model.ts (readScpConfigName · tolerant per-SCP identity) · scsBridgeLaunchScp
// .quality.huirth.ts:75-131 (readScpRegistry name→entry.path bind seam) · scsBridgeSendMessage
// .quality.huirth.ts:94 (env-first origin resolution precedent).

import { isAbsolute, resolve } from 'node:path';
import { existsSync } from 'node:fs';
import { readScpRegistry } from '../../../../scp/scpPersistence';
import { getSlice } from './gitmSliceStore.model';
import type { GitmABMode } from '../gitm.types';

// Canonicalize a dir to ABSOLUTE against userCwd — the SLICE/WATCHER KEY LAW. gitmSetActiveScpDir
// absolute-resolves entry.path (the registry `path` is relative, e.g. 'Cascades/scps/<name>/SCP'), so
// activeScpDir in state is ABSOLUTE. resolveGitmTargetCwd MUST return the SAME canonical form or a
// non-active SCP's slice would be keyed differently from its watcher/GITEP rail (a silent split).
function canonicalScpDir(dir: string, userCwd: string): string {
  if (dir === '') return '';
  if (isAbsolute(dir)) return dir;
  return resolve(userCwd !== '' ? userCwd : process.cwd(), dir);
}

// Resolve an origin SCP NAME to its ABSOLUTE package directory via the SCPs.json registry. Returns ''
// when the name is absent from the registry (the caller then tries the absolute-path fallback).
// Tolerant: a registry-read failure yields an empty scps list → '' (mirrors readScpRegistry's own).
// MD-C M5 — exported: the boot-report proof gate maps report.scpName → the origin's slice key.
export function resolveScpNameToDir(originScpName: string, userCwd: string): string {
  const registry = readScpRegistry(userCwd !== '' ? userCwd : process.cwd());
  const entry = registry.scps.find((s) => s.name === originScpName);
  return entry ? canonicalScpDir(entry.path, userCwd) : '';
}

// Resolve the cwd a gitm op runs against for the CALLING SCP (the origin thread). Env-first, then
// the payload origin, then the active→userCwd fallback (selectGitmOpCwd). A NAME is mapped to its
// package dir via the registry; an unmatched NAME that IS an existing absolute directory path is
// accepted verbatim (documented fallback). NEVER throws — every branch has a safe terminal.
export function resolveGitmTargetCwd(deck: GitmOpCwdDeck, originScpName?: string): string {
  const userCwd = deck.gitm.k.userCwd.select();

  // 1. Env origin (dev:self / agent) — a NAME on the bridge process.
  const envOrigin = process.env.SCS_BRIDGE_ORIGIN_SCP;
  if (typeof envOrigin === 'string' && envOrigin.length > 0) {
    const dir = resolveScpNameToDir(envOrigin, userCwd);
    if (dir !== '') return dir;
    if (isAbsolute(envOrigin) && existsSync(envOrigin)) return envOrigin;
  }

  // 2. Payload origin (per-op · the SCP's own send path) — same NAME→dir treatment, with the
  //    absolute-directory-path fallback documented in the MC-W1 brief.
  if (typeof originScpName === 'string' && originScpName.length > 0) {
    const dir = resolveScpNameToDir(originScpName, userCwd);
    if (dir !== '') return dir;
    if (isAbsolute(originScpName) && existsSync(originScpName)) return originScpName;
  }

  // 3. No origin identity — the existing active→userCwd chain.
  return selectGitmOpCwd(deck);
}

// ────────────────────────────────────────────────
// MULTI-SCP GITM MUXIFICATION (Fork B · MC-W3 · THE DECISION-FIELD READ · THE SLICE-FIRST READ)
// ────────────────────────────────────────────────
//
// THE PROVEN DEFECT selectGitmDecisionFields repairs (the field log): resolveGitmTargetCwd routes the
// git CWD to the ORIGIN's repo correctly, but the A/B DECISION FIELDS (currentBranch / stableBranch /
// workingBranch / branchRoles / abMode / dirty / changesPrimedOnB / turnOverAttempt / conflicts /
// staged & unstagedFiles) were still read from the FLAT deck selectors — the ACTIVE POINTER's
// materialized view. When the origin ≠ the pointer, the op ran in the RIGHT repo with the WRONG
// branch names (`git switch` on a nonexistent branch → dead). The pointer-owner SCP worked; any other
// origin failed.
//
// THE MATERIALIZED-VIEW LAW (why the branch is safe): the flat GitmState IS the ACTIVE pointer's slice
// materialized (gitmSliceStore.model.ts §the ACTIVE-slice materialized-view law). So when targetCwd IS
// the pointer (targetCwd === activeScpDir, or no SCP is bound, or the resolve fell to '') the flat
// selectors ARE that repo's slice — read them directly (no lag, and they carry live probe repairs the
// slice may not yet hold). ONLY a NON-pointer target reads its OWN slice via getSlice(targetCwd). If no
// slice exists yet for a non-pointer target (a cold rail), fall back to the flat view — the ops keep
// working against the resolved cwd, and the terminal fallback never crashes (mirrors selectGitmOpCwd).
//
// GitmDecisionFields = byte-compatible with the GitmState field types AND the GitmRepoSlice field
// types (cross-checked: gitm.types.ts ↔ gitmSliceStore.model.ts) — so a swap from a flat selector to a
// slice field is type-transparent at every call site.
//
// Citation: gitmSliceStore.model.ts §GitmRepoSlice (the per-repo identity subset · getSlice) ·
// resolveGitmTargetCwd (above · the origin→cwd resolve the decision read pairs with) · the field log
// (IE's B turn-over: opCwd=origin correct, currentBranch/workingBranch=pointer's branch wrong).

export type GitmDecisionFields = {
  currentBranch: string;
  dirty: boolean;
  stableBranch: string;
  workingBranch: string;
  branchRoles: { a: string; b: string };
  abMode: GitmABMode;
  changesPrimedOnB: number;
  turnOverAttempt: { source: 'A' | 'B' | 'carry-A' | 'carry-B'; targetBranch: string; ts: number } | null;
  conflicts: string[];
  stagedFiles: string[];
  unstagedFiles: string[];
};

// The structural deck shape the decision read needs — the 11 per-repo A/B selectors PLUS activeScpDir
// (the pointer identity the materialized-view gate compares targetCwd against). Structural (not the
// full ConceptDECK) so it accepts the runtime deck each A/B quality's Method already holds.
type GitmDecisionDeck = {
  gitm: {
    k: {
      activeScpDir: { select: () => string };
      currentBranch: { select: () => string };
      dirty: { select: () => boolean };
      stableBranch: { select: () => string };
      workingBranch: { select: () => string };
      branchRoles: { select: () => { a: string; b: string } };
      abMode: { select: () => GitmABMode };
      changesPrimedOnB: { select: () => number };
      turnOverAttempt: {
        select: () => { source: 'A' | 'B' | 'carry-A' | 'carry-B'; targetBranch: string; ts: number } | null;
      };
      conflicts: { select: () => string[] };
      stagedFiles: { select: () => string[] };
      unstagedFiles: { select: () => string[] };
    };
  };
};

// Resolve the A/B DECISION FIELDS for the repo a gitm op ACTUALLY runs against (targetCwd = the output
// of resolveGitmTargetCwd). SLICE-FIRST for a NON-pointer target with a live rail; FLAT-VIEW for the
// pointer (or no-SCP / cold-rail fallback). Pairs 1:1 with resolveGitmTargetCwd — call it with the SAME
// resolved cwd so the DECISION and the git EXEC agree on the repo. NEVER throws.
export function selectGitmDecisionFields(
  deck: GitmDecisionDeck,
  targetCwd: string,
): GitmDecisionFields {
  const activeScpDir = deck.gitm.k.activeScpDir.select();
  // The pointer's slice IS the flat view (the materialized-view law): a pointer target, a no-SCP dev
  // path (activeScpDir === ''), or a resolve that fell to '' all read the flat selectors directly.
  const isPointerTarget = targetCwd === activeScpDir || activeScpDir === '' || targetCwd === '';
  if (!isPointerTarget) {
    const slice = getSlice(targetCwd);
    if (slice !== undefined) {
      return {
        currentBranch: slice.currentBranch,
        dirty: slice.dirty,
        stableBranch: slice.stableBranch,
        workingBranch: slice.workingBranch,
        branchRoles: slice.branchRoles,
        abMode: slice.abMode,
        changesPrimedOnB: slice.changesPrimedOnB,
        turnOverAttempt: slice.turnOverAttempt,
        conflicts: slice.conflicts,
        stagedFiles: slice.stagedFiles,
        unstagedFiles: slice.unstagedFiles,
      };
    }
    // No rail yet for this non-pointer target — fall through to the flat view (cold-rail fallback).
  }
  return {
    currentBranch: deck.gitm.k.currentBranch.select(),
    dirty: deck.gitm.k.dirty.select(),
    stableBranch: deck.gitm.k.stableBranch.select(),
    workingBranch: deck.gitm.k.workingBranch.select(),
    branchRoles: deck.gitm.k.branchRoles.select(),
    abMode: deck.gitm.k.abMode.select(),
    changesPrimedOnB: deck.gitm.k.changesPrimedOnB.select(),
    turnOverAttempt: deck.gitm.k.turnOverAttempt.select(),
    conflicts: deck.gitm.k.conflicts.select(),
    stagedFiles: deck.gitm.k.stagedFiles.select(),
    unstagedFiles: deck.gitm.k.unstagedFiles.select(),
  };
}
