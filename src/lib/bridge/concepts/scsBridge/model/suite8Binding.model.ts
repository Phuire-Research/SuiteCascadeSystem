/**
 * suite8Binding.model · DF1 · THE S8 SESSION BINDING (the durable mirror)
 *
 * THE DF1 BINDING LAW: S8.json IS the S8's durable session memory. The stored
 * SessionID lives ON Cascades/Extended/<suite8Name>/S8.json as `boundSessionId`.
 * The anchor seams are its SOLE writers — setSessionAnchor / claimAnchorIfUnclaimed
 * write the bound ULID; unsetSessionAnchor (UnAnchor) CLEARS it. No other leg mutates
 * this field. This single-writer discipline is the mitigation for the r4 HIGH risk
 * (a second binding desyncing from RegistryEntry.isAnchor): the binding only ever
 * moves at the same registry seams that move isAnchor, so the two stay in lockstep.
 *
 * WHY a second binding at all: RegistryEntry.isAnchor lives in the WORKSPACE
 * sessions.json (registry.ts) — an OPERATIONAL, boot-scoped record. S8.json lives in
 * the SCP-LOCAL Extended dir (the C465 rail) — a DURABLE, per-Suite-8 record that
 * survives a fresh SCP install / a wiped registry. The spawn fallback (leg 3) consults
 * S8.json to RESUME a page's prior session when the operational isAnchor is gone.
 *
 * THE ADDITIVE LAW: S8.json today carries `{ anchorSpawn }` (the C481 filesystem
 * anchor · cli-handler.ts:1055-1064 read leg). Writing `boundSessionId` here is a
 * read-modify-write that PRESERVES anchorSpawn + every unknown field — exactly the
 * additive pattern the template vue.principle POST leg and scs_set_anchor_config
 * (anchorConfig.model writeAnchorOverride) precedents establish. Clearing deletes ONLY
 * the boundSessionId key; the rest of the object is untouched.
 *
 * SCP root resolution reuses resolveOwningScpRoot (anchorConfig.model.ts:69) — the SAME
 * C465 probe cli-handler / the anchor config resolver trust: the installed SCP whose
 * Cascades/8_SUITES/<suite8Name>/ exists owns that designation's Extended substrate.
 * Fallback (no owning SCP found) = SCS_BRIDGE_ROOT_OVERRIDE ?? process.cwd() — the same
 * legacy root the sibling extendedDir() falls to.
 *
 * AFPR (Always-Forgiving Path): a missing dir/file on read → null; on write the dir is
 * created (mkdirSync recursive). A malformed / unreadable S8.json on write is treated as
 * an empty base object (the write still lands a valid `{ boundSessionId }`), and on read
 * → null. This module NEVER throws on a path/parse fault — faults are swallowed + logged.
 *
 * Citation: anchorConfig.model.ts (resolveOwningScpRoot · scsRoot · the AFPR read idiom)
 * Citation: cli-handler.ts:1055-1064 (the S8.json anchorSpawn read · the Extended path)
 * Citation: Cascades/scps/template/SCP/Cascades/Extended/<name>/S8.json ({ anchorSpawn })
 */

import { existsSync, readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { log } from '../../../debugLog';
import { resolveOwningScpRoot, resolveScpRootByName } from './anchorConfig.model';
// C727 · 1 · the scpName reader (reads <scpDir>/scp.config.json → scpName · null on any failure).
import { readScpConfigName } from '../../../scpConfig.model';

// The per-Suite-8 durable RI file basename (the C481 filesystem anchor · the same file
// cli-handler.ts reads for anchorSpawn). The DF1 binding rides it as boundSessionId.
const S8_JSON_BASENAME = 'S8.json';

// The durable-binding field name. Absent ⇒ no session bound (a page with no prior anchor
// ever, or one whose UnAnchor cleared it). A ULID string ⇒ the last-anchored session.
const BOUND_SESSION_ID_FIELD = 'boundSessionId';

// C716 · 1A THE MINT-STAMP field. The OWNING SCP's absolute root, resolved the SAME way the
// binding path is (resolveOwningScpRoot). Stamped into the WORKSPACE-visible S8.json so a newborn
// Anchor — whose cwd is the workspace, not the owning SCP — can read its own SCP-local root from
// S8.json and write its founding Diamond/Onyx pair at <scpLocalRoot>/Cascades/Extended/<name>/
// (ABSOLUTE) rather than at bare cwd. Absent ⇒ the owning SCP could not be resolved; the founding
// falls back to declaring the ambiguity (asking the user) rather than guessing (the never-guess law).
const SCP_LOCAL_ROOT_FIELD = 'scpLocalRoot';

// C727 · 1 THE scpName STAMP field. The OWNING SCP's designation (scp.config.json scpName),
// resolved additively-alongside scpLocalRoot at the SAME seam (readScpConfigName of the owning
// SCP root). Stamped into the WORKSPACE-visible S8.json so a newborn Anchor knows its SCP BY NAME
// (not only by root) out of the box — closing the r1 identity GAP (no second scp.config.json read
// needed). Absent ⇒ the owning SCP could not be resolved OR carries no scp.config.json (dev:self /
// pre-install); OMIT the field (never guess · matches the scpLocalRoot writer's own discipline).
const SCP_NAME_FIELD = 'scpName';

// SCS root fallback — mirrors anchorConfig.model.ts scsRoot() (env ?? cwd). Used only when
// resolveOwningScpRoot finds no installed SCP owning the designation (standalone / unregistered
// boot keeps the legacy root, exactly as the sibling extendedDir() does).
function fallbackScsRoot(): string {
  return process.env.SCS_BRIDGE_ROOT_OVERRIDE
    ? resolve(process.env.SCS_BRIDGE_ROOT_OVERRIDE)
    : resolve(process.cwd());
}

// The per-Suite-8 S8.json path: <owningScpRoot>/Cascades/Extended/<suite8Name>/S8.json.
// Resolves the OWNING SCP first (C465), falling to the legacy root — the SAME resolution
// order the sibling anchorConfig extendedDir() uses.
function resolveS8JsonPath(suite8Name: string, scpName?: string): string {
  // C880 · the session's OWN citizen wins (collision-immune); the designation probe is the fallback.
  const base =
    (scpName ? resolveScpRootByName(scpName) : undefined)
    ?? resolveOwningScpRoot(suite8Name)
    ?? fallbackScsRoot();
  return resolve(base, 'Cascades', 'Extended', suite8Name, S8_JSON_BASENAME);
}

// AFPR parse of the S8.json object. Absent / unreadable / non-JSON / non-object → {} (an
// empty base the write can additively extend). NEVER throws — a fault is swallowed + logged.
function readS8JsonObject(filePath: string): Record<string, unknown> {
  if (!existsSync(filePath)) {
    return {};
  }
  let raw: string;
  try {
    raw = readFileSync(filePath, 'utf8');
  } catch (err) {
    log('suite8Binding.read.unreadable', {
      filePath,
      error: err instanceof Error ? err.message : String(err),
    });
    return {};
  }
  if (!raw.trim()) {
    return {};
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    log('suite8Binding.read.parseFail', { filePath });
    return {};
  }
  if (!parsed || typeof parsed !== 'object') {
    return {};
  }
  return parsed as Record<string, unknown>;
}

/**
 * readSuite8BoundSession — the spawn-fallback read leg (leg 3 consults this).
 *
 * Returns the durable boundSessionId ULID for a Suite 8 page, or null when absent /
 * unreadable / non-string. AFPR-pure · NEVER throws. Blank suite8Name → null (no page
 * scope to read).
 */
export function readSuite8BoundSession(suite8Name: string, scpName?: string): string | null {
  if (typeof suite8Name !== 'string' || suite8Name.trim() === '') {
    return null;
  }
  // THE CITIZEN-STRICT READ (the FrontierTest4 disjoint): when the caller NAMES its
  // citizen, the binding may come ONLY from THAT citizen's Extended. A pending/
  // unregistered citizen (resolveScpRootByName null — fresh mints before SCPs.json
  // lands) has NO binding: return null. NEVER fall to the owning-probe — its
  // first-found owner is ANOTHER citizen, and reading ITS binding adopted a foreign
  // dead session (the template-poisoned boundSessionId that re-opened FrontierTest1's
  // zombie on every fresh mint's page spawn).
  if (scpName !== undefined) {
    const ownRoot = resolveScpRootByName(scpName);
    if (!ownRoot) {
      log('suite8Binding.read.citizen-unresolved', { suite8Name, scpName });
      return null;
    }
    const strictObj = readS8JsonObject(
      resolve(ownRoot, 'Cascades', 'Extended', suite8Name, S8_JSON_BASENAME),
    );
    const strictValue = strictObj[BOUND_SESSION_ID_FIELD];
    return typeof strictValue === 'string' && strictValue.length > 0 ? strictValue : null;
  }
  const obj = readS8JsonObject(resolveS8JsonPath(suite8Name, scpName));
  const value = obj[BOUND_SESSION_ID_FIELD];
  return typeof value === 'string' && value.length > 0 ? value : null;
}

/**
 * writeSuite8BoundSession — the anchor-seam mirror write (the SOLE binding writer · DF1 LAW).
 *
 * Read-modify-writes Cascades/Extended/<suite8Name>/S8.json:
 *   - sessionId (a ULID string) → SET obj.boundSessionId = sessionId.
 *   - null                      → DELETE obj.boundSessionId (THE UNANCHOR CLEAR).
 * Preserves anchorSpawn + every unknown field (the additive law · read-modify-write).
 * Creates the Extended/<name>/ dir on demand (mkdirSync recursive) so a page whose S8.json
 * does not yet exist still lands a valid `{ boundSessionId }`.
 *
 * ONLY the anchor seams (setSessionAnchor · claimAnchorIfUnclaimed · unsetSessionAnchor)
 * call this — the single-writer discipline that keeps the binding in lockstep with isAnchor.
 *
 * AFPR: a genuine FS write fault is swallowed + logged (the anchor operation itself already
 * landed in the registry — the durable mirror is best-effort defense-in-depth, never a gate).
 * Blank suite8Name → no-op (no page scope to write · matches the registry seams' own guard).
 */
export function writeSuite8BoundSession(suite8Name: string, sessionId: string | null, scpName?: string): void {
  if (typeof suite8Name !== 'string' || suite8Name.trim() === '') {
    log('suite8Binding.write.noop', { reason: 'blank-suite8Name' });
    return;
  }
  // THE CITIZEN-STRICT WRITE (the contamination vector): when the caller NAMES its
  // citizen but that citizen cannot resolve (pending mint · absent from SCPs.json),
  // SKIP the write — the owning-probe fallback would land the binding in ANOTHER
  // citizen's Extended (the exact write that poisoned the template citizen's S8.json
  // with FrontierTest1's ULID). The registry anchor already landed; the durable
  // mirror is best-effort and NEVER cross-citizen.
  if (scpName !== undefined && !resolveScpRootByName(scpName)) {
    log('suite8Binding.write.citizen-unresolved-skip', { suite8Name, scpName });
    return;
  }
  const filePath = resolveS8JsonPath(suite8Name, scpName);
  try {
    const obj = readS8JsonObject(filePath);
    if (sessionId === null) {
      delete obj[BOUND_SESSION_ID_FIELD];
    } else {
      obj[BOUND_SESSION_ID_FIELD] = sessionId;
    }
    // C716 · 1A THE MINT-STAMP · additive-alongside. Stamp the OWNING SCP's absolute root so the
    // newborn Anchor (cwd = workspace) can locate its SCP-local Extended to write its founding pair.
    // Resolved the SAME way the S8.json path is (resolveOwningScpRoot · the C465 8_SUITES probe).
    // ABSENT owning SCP ⇒ OMIT the field (never guess · the founding declares the ambiguity instead).
    // Persists across the UnAnchor clear (it is durable geography, not the transient binding) — the
    // read-modify-write already preserves it when absent; we re-stamp on every write when resolvable
    // so a page that gains an owning SCP later heals its S8.json.
    const owningScpRoot =
      (scpName ? resolveScpRootByName(scpName) : undefined) ?? resolveOwningScpRoot(suite8Name);
    if (typeof owningScpRoot === 'string' && owningScpRoot.length > 0) {
      obj[SCP_LOCAL_ROOT_FIELD] = owningScpRoot;
    }
    // C727 · 1 · additive-alongside · stamp the owning SCP's designation (scp.config.json scpName)
    // so the newborn Anchor knows its SCP BY NAME. Resolved from the SAME owningScpRoot; OMIT when
    // unresolvable (readScpConfigName returns null on any failure) — the never-guess law.
    const owningScpName =
      typeof owningScpRoot === 'string' && owningScpRoot.length > 0
        ? readScpConfigName(owningScpRoot)
        : null;
    if (typeof owningScpName === 'string' && owningScpName.length > 0) {
      obj[SCP_NAME_FIELD] = owningScpName;
    }
    const dir = resolve(filePath, '..');
    mkdirSync(dir, { recursive: true });
    writeFileSync(filePath, JSON.stringify(obj, null, 2) + '\n', 'utf8');
    log('suite8Binding.write', {
      suite8Name,
      boundSessionId: sessionId,
      cleared: sessionId === null,
      scpLocalRoot: typeof owningScpRoot === 'string' ? owningScpRoot : null,
      scpName: typeof owningScpName === 'string' ? owningScpName : null,
      filePath,
    });
  } catch (err) {
    log('suite8Binding.write.error', {
      suite8Name,
      filePath,
      error: err instanceof Error ? err.message : String(err),
    });
  }
}
