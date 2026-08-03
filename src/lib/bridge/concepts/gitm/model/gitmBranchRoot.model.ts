/**
 * gitmBranchRoot · BASEANCHOR (Macro Diamond D-T0.5 · the Blank-Test-049 fix)
 *
 * The A↔B working namespace is `b/<base>-<ts>`. When a fork derives its name from an ALREADY-`b/`
 * branch — a prior cycle's B left checked out after a state reset, then re-registered as A — the
 * `b/` prefix COMPOUNDS: `b/b/master-<ts>-<ts>`, and A gets registered as a `b/` branch instead of
 * the true stable base. 049 surfaced exactly this (stableBranch=`b/master-…`, workingBranch=`b/b/…`).
 *
 * `resolveStableRoot` recursively strips leading `b/` segments + trailing `-<digits>` timestamps to
 * recover the root base name. The induct/fork anchors to THIS, never to the current (possibly `b/`)
 * branch — so the `b/` namespace stays single-level and A is always the true stable.
 *
 *   resolveStableRoot('master')                                  -> 'master'
 *   resolveStableRoot('b/master-1782706909711')                  -> 'master'
 *   resolveStableRoot('b/b/master-1782706909711-1782708507333')  -> 'master'
 */
import { randomUUID } from 'node:crypto';
import type { GitmABMode } from '../gitm.types';

/**
 * D-BN · THE branchRoles SWEEP · THE CANONICAL MINT. `branchRoles: { a, b }` is the ONLY A/B role
 * truth; the `b/` prefix is PURE LINEAGE NAMING and NEVER decides role semantics. When the B Turn
 * Over System needs a working branch and `branchRoles.b` is unassigned, MINT `b/<aBranch>-<uuid>`
 * using the A branch name VERBATIM — no prefix stripping (resolveStableRoot is NOT called here). A
 * `b/` branch legally assigned as A therefore mints its own `b/b/…-uuid` child that merges back into
 * it as origin (compounding is now LEGAL by doctrine · the lineage records the pairing). The UUID
 * replaces the legacy Date.now() suffix — unique + collision-free, no longer timestamp-orderable
 * (callers that listed by timestamp switch to `--sort=-committerdate`).
 */
export function mintWorkingBranchName(aBranch: string): string {
  return `b/${aBranch}-${randomUUID()}`;
}

/**
 * D-BN · THE ROLE-DECIDING PROBE. True when `branch` is the working B for the given `knownB` (the
 * live `branchRoles.b`). When `knownB` is assigned, the decision is pure ROLES EQUALITY (branch ===
 * knownB) — the prefix is irrelevant. ONLY when `knownB` is unassigned ('') does it fall back to the
 * legacy `b/`-prefix inference (roles-unassigned legacy files predating branchRoles). Every role
 * decision across the concept routes through THIS chokepoint; the bare `startsWith('b/')` survives
 * only inside this model's legacy utilities (resolveStableRoot / parseSwordBranch / this fallback).
 */
export function isWorkingBranchFor(branch: string, knownB: string): boolean {
  if (knownB.length > 0) return branch === knownB;
  return branch.trim().startsWith('b/');
}

// MD-ATC · THE SELECTED-B PREDICATE (checkout-sovereign · the CaseA hop break): the
// CURRENT branch is a working B when it lives in the b/ namespace ANOR it IS the
// registered roles.b — UNLIKE isWorkingBranchFor, the namespace check is UNCONDITIONAL,
// so a hopped-to B that was never registered (anor differs from a stale registration —
// the Double-B) still counts. Enablement follows the CHECKOUT; registration is
// bookkeeping, never a gate.
export function isSelectedWorkingBranch(branch: string, knownB: string): boolean {
  const b = branch.trim();
  if (b === '') return false;
  return b.startsWith('b/') || (knownB.length > 0 && b === knownB);
}

export function resolveStableRoot(branch: string): string {
  let n = branch.trim();
  let prev = '';
  while (n !== prev) {
    prev = n;
    if (n.startsWith('b/')) n = n.slice(2);
    n = n.replace(/-\d+$/, '');
    // C592 · THE UUID TAIL (the IE phantom-stable fragmentation): mintWorkingBranchName moved
    // to `b/<aBranch>-<uuid>` (randomUUID · 8-4-4-4-12 hex) but this deriver only knew the
    // legacy `-<digits>` timestamp tail — a relaunch-time induction seated on a uuid B derived
    // the stable as `<aBranch>-<uuid>` (a PHANTOM branch: divergence 0 · merge dead · a switch
    // target that does not exist). Strip the uuid tail the same recursive way.
    n = n.replace(/-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i, '');
  }
  return n;
}

/** True when the branch is in the working-B namespace (`b/…`) — i.e. NOT a clean stable base. */
export function isWorkingBranch(branch: string): boolean {
  return branch.trim().startsWith('b/');
}

/**
 * GITM Dev Epoch (MD-B · THE SHIELD-SWORD PAIRING DERIVATION) — parse a Sword branch name
 * `b/<shield>-<ts>` into its Shield signifier + timestamp. The Shield MAY contain hyphens
 * (e.g. `b/feature/rc-refinement-1782706909711`) — the `ts` is the FINAL numeric segment ONLY,
 * everything before the final `-<digits>` is the Shield. Returns null when the name is not a
 * `b/`-namespaced Sword OR has no trailing numeric timestamp segment (a bare `b/foo` is NOT a
 * Sword — a Sword is always minted with a Date.now() suffix). Pure · fixture-testable.
 *
 *   parseSwordBranch('b/master-1782706909711')        -> { shield: 'master', ts: 1782706909711 }
 *   parseSwordBranch('b/rc-refinement-1782706909711') -> { shield: 'rc-refinement', ts: 1782706909711 }
 *   parseSwordBranch('b/Working-4af5770c-4640-429e-b351-26b9f8520f1b')
 *                                                     -> { shield: 'Working', ts: 0 }  (uuid mint)
 *   parseSwordBranch('master')                        -> null   (not a b/ Sword)
 *   parseSwordBranch('b/master')                      -> null   (no trailing mint suffix)
 *
 * D-BN-4 · THE UUID LINEAGE PARSE — mintWorkingBranchName suffixes with a UUID (not Date.now()),
 * so the lineage parse accepts BOTH suffix forms. A uuid Sword carries ts:0 (uuids are not
 * temporally orderable — newestSwordFor's greatest-ts contest treats them as oldest; the live
 * seat-return already orders by --sort=-committerdate instead).
 */
const UUID_SWORD_SUFFIX = /^(.+)-([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/i;

export function parseSwordBranch(name: string): { shield: string; ts: number } | null {
  const n = name.trim();
  if (!n.startsWith('b/')) return null;
  const body = n.slice(2); // strip the leading `b/`
  // The UUID mint form first (D-BN-4) — the uuid itself contains hyphens, so match it whole.
  const uuidMatch = UUID_SWORD_SUFFIX.exec(body);
  if (uuidMatch !== null && uuidMatch[1].length > 0) {
    return { shield: uuidMatch[1], ts: 0 };
  }
  const lastDash = body.lastIndexOf('-');
  if (lastDash <= 0) return null; // no separator, or the separator is at index 0 (empty shield)
  const shield = body.slice(0, lastDash);
  const tsRaw = body.slice(lastDash + 1);
  if (shield.length === 0) return null;
  if (!/^\d+$/.test(tsRaw)) return null; // the final segment MUST be a pure numeric timestamp
  return { shield, ts: Number(tsRaw) };
}

/**
 * GITM Dev Epoch (MD-B · THE MOST-RECENT-SWORD EQUIP RULE) — given a Shield name + the live
 * branch list, return the `b/<shield>-<ts>` Sword with the GREATEST ts (the newest paired Sword),
 * or null when the Shield has no paired Swords. The Shield is matched against parseSwordBranch's
 * `.shield` (so a hyphenated Shield pairs correctly). Newest-ts wins — the Shield-Sword pairing
 * derivation the RE-PAIR amendment equips on select. Pure · fixture-testable.
 */
export function newestSwordFor(shield: string, branches: string[]): string | null {
  const wanted = shield.trim();
  let best: { name: string; ts: number } | null = null;
  for (const branch of branches) {
    const parsed = parseSwordBranch(branch);
    if (parsed === null) continue;
    if (parsed.shield !== wanted) continue;
    if (best === null || parsed.ts > best.ts) {
      best = { name: branch.trim(), ts: parsed.ts };
    }
  }
  return best ? best.name : null;
}

/**
 * C600 · THE COMMIT-DATE SWORD ORDER (the uuid-tie steering defect): uuid Swords all parse
 * ts:0 — the greatest-ts contest TIES and the pick falls to roster order (the field incident:
 * Set Active equipped a STALE fossil Sword and the turn-over sealed onto it). When more than
 * one Sword pairs to the Shield, order by COMMITTERDATE via for-each-ref (the seat-return's
 * own idiom) and take the newest; exec-fail anor a single candidate falls back to the ts
 * contest (pure · fixture-safe).
 */
export function newestSwordForByCommit(
  shield: string,
  branches: string[],
  cwd: string,
  execGit: (args: string[], cwd: string) => { ok: boolean; stdout?: string },
): string | null {
  const wanted = shield.trim();
  const candidates = branches.filter((b) => parseSwordBranch(b)?.shield === wanted);
  if (candidates.length <= 1) return candidates[0] ?? null;
  if (cwd !== '') {
    const exec = execGit(
      ['for-each-ref', '--sort=-committerdate', '--format=%(refname:short)', 'refs/heads/b/'],
      cwd,
    );
    if (exec.ok) {
      const ordered = (exec.stdout ?? '').split('\n').map((l) => l.trim());
      for (const name of ordered) {
        if (candidates.includes(name)) return name;
      }
    }
  }
  return newestSwordFor(shield, branches);
}

/**
 * C366 · THE STARC RE-PAIR — derive the A↔B pointers from a STARC refresh landing.
 *
 * Every status refresh (WATCHDIAL/CHANGEDIAL tick + boot read) flows through the ONE
 * gitmSetStatus reducer where the STARC result lands whole. The A↔B pointer (workingBranch)
 * is set ONLY inside gitmBranchCreate's reducer (the Cycle-273 POINTER FIX). So any branch
 * born via the HARD TURN-OVER path (triggerHardTurnOver — SCP-side, freehop-class, writes
 * .bridge-restart.json; it cannot reach the bridge gitm state), AND any bridge RESTART while
 * checked out on a `b/` Sword, loses the pointer: workingBranch stays '' → the Turn-Over-B
 * button (gated workingBranch !== '') is dead and the A↔B diff surface shows nothing despite
 * a real file difference. This is the single point every path flows through, so the re-pair
 * lives HERE and every refresh re-asserts it (idempotent · value-guarded · no write-storm).
 *
 * The C366 live incident: user sat ON `b/master-1783470183849` (45 files vs master) with
 * gitm.json workingBranch:'' — the Sword came via triggerHardTurnOver, never gitmBranchCreate.
 *
 * Returns ONLY the pointer keys that CHANGE (value-guarded — an already-correct pointer yields
 * {}), so the caller can spread it into its partial-return without a self-triggering write loop.
 *
 * Legs (see the RE-PAIR amendment):
 *  - currentBranch is a `b/` Sword AND workingBranch !== it → set workingBranch = it,
 *    abMode = 'candidate-created' (mirror the Cycle-273 POINTER FIX); ALSO if stableBranch is
 *    empty, derive it via the Shield-Sword Pairing Derivation (parse the Sword → root) when that
 *    root exists in branches[].
 *  - currentBranch is NOT `b/` (a Shield) → honor the stale-pointer prune: if workingBranch
 *    names a branch that NO LONGER exists in branches[], clear it (and reset abMode to 'idle').
 *    Do NOT auto-equip a Sword here — that is gitmSelectBranch's job (the Law).
 *
 * D-BN · THE branchRoles SWEEP — the re-pair now consults `branchRoles: { a, b }`, the canonical
 * A/B role truth. RE-PAIR FROM ROLES EQUALITY FIRST: current === roles.b → the working seat is
 * assured (re-assert the pointer); current === roles.a → the stable ground. The `b/`-prefix
 * inference (parseSwordBranch / the legacy isWorkingBranch fallback below) fires ONLY when BOTH
 * roles are unassigned ('' / '') — the roles-unassigned legacy path. The function returns the
 * updated `branchRoles` alongside stableBranch/workingBranch so callers stay LOCKSTEP (a=stable,
 * b=working). Value-guarded throughout — an already-correct field is omitted (no write-storm).
 */
export function deriveAbPointers(
  refresh: { currentBranch: string; branches: string[] },
  currentState: {
    workingBranch: string;
    stableBranch: string;
    branchRoles: { a: string; b: string };
  },
): {
  workingBranch?: string;
  stableBranch?: string;
  abMode?: GitmABMode;
  branchRoles?: { a: string; b: string };
} {
  const current = refresh.currentBranch.trim();
  const roles = currentState.branchRoles;
  const out: {
    workingBranch?: string;
    stableBranch?: string;
    abMode?: GitmABMode;
    branchRoles?: { a: string; b: string };
  } = {};

  // ROLES EQUALITY FIRST (D-BN) — when either role is assigned, the roles decide, not the prefix.
  const rolesAssigned = roles.a.length > 0 || roles.b.length > 0;
  if (rolesAssigned) {
    // On the working B (roles.b) — re-assert the pointer (value-guarded · lockstep with roles.b).
    if (roles.b.length > 0 && current === roles.b) {
      if (currentState.workingBranch !== current) {
        out.workingBranch = current;
        out.abMode = 'candidate-created';
      }
      // D-BN-4 · THE A-RECOVERY LEG — roles seeded with an EMPTY a (the C503 Lab incident: the
      // uuid Sword defeated the pre-D-BN-4 numeric-only lineage parse, seeding {a:'', b:current};
      // the roles-assigned path then never re-derived A — recount starved at 0, A turn-over dead,
      // Merge dark). When roles.a is '' and the seat sits on the roles.b Sword, derive the Shield
      // from the lineage name (uuid-aware parseSwordBranch) and heal a + stableBranch in lockstep
      // — only when the derived Shield exists as a real branch. Value-guarded · one-shot by nature.
      if (roles.a.length === 0) {
        const parsed = parseSwordBranch(current);
        if (parsed !== null && refresh.branches.includes(parsed.shield)) {
          if (currentState.stableBranch !== parsed.shield) {
            out.stableBranch = parsed.shield;
          }
          out.branchRoles = { a: parsed.shield, b: current };
        }
      }
      return out;
    }
    // D-BN-4 · THE NEW-SWORD ADOPTION — the seat sits on a `b/`-lineage branch that is NEITHER
    // roles.b NOR roles.a (a Sword minted outside the tracked pair — e.g. a hard turn-over anor a
    // carry landing while state lagged). Adopt it as the working seat: roles.b moves to the live
    // Sword, roles.a is PRESERVED (never stomped — the a truth persists; derive it only when '').
    if (current !== roles.a && isWorkingBranch(current)) {
      out.workingBranch = current;
      out.abMode = 'candidate-created';
      let adoptedA = roles.a;
      if (adoptedA.length === 0) {
        const parsed = parseSwordBranch(current);
        if (parsed !== null && refresh.branches.includes(parsed.shield)) {
          adoptedA = parsed.shield;
          if (currentState.stableBranch !== parsed.shield) {
            out.stableBranch = parsed.shield;
          }
        }
      }
      out.branchRoles = { a: adoptedA, b: current };
      return out;
    }
    // On the stable A (roles.a) — stale-pointer prune only; never auto-equip (gitmSelectBranch's Law).
    if (
      currentState.workingBranch !== '' &&
      !refresh.branches.includes(currentState.workingBranch)
    ) {
      out.workingBranch = '';
      out.abMode = 'idle';
      // The working seat vanished — clear roles.b in lockstep (the pointer + the role truth move together).
      if (roles.b.length > 0) {
        out.branchRoles = { a: roles.a, b: '' };
      }
    }
    return out;
  }

  // ── ROLES-UNASSIGNED LEGACY (both roles '') — prefix inference is the ONLY signal. ──
  if (isWorkingBranch(current)) {
    // On a Sword — re-assert the pointer (value-guarded) + assign roles.b in lockstep.
    if (currentState.workingBranch !== current) {
      out.workingBranch = current;
      out.abMode = 'candidate-created';
    }
    // Derive the Shield (stableBranch) when unset AND the root exists as a real branch.
    let derivedStable = currentState.stableBranch;
    if (currentState.stableBranch === '') {
      const parsed = parseSwordBranch(current);
      if (parsed !== null && refresh.branches.includes(parsed.shield)) {
        out.stableBranch = parsed.shield;
        derivedStable = parsed.shield;
      }
    }
    // Seed branchRoles from the legacy inference so subsequent refreshes take the roles-equality path.
    out.branchRoles = { a: derivedStable, b: current };
    return out;
  }

  // On a Shield (or a bare branch) — stale-pointer prune. Clear a workingBranch that no
  // longer exists among the live branches; never auto-equip (gitmSelectBranch's Law).
  if (currentState.workingBranch !== '' && !refresh.branches.includes(currentState.workingBranch)) {
    out.workingBranch = '';
    out.abMode = 'idle';
  }
  return out;
}
