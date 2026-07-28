/**
 * WATCHKEY Model · GITM D4 (#635) · the T3 double-confirm token seam
 *
 * The pure, testable core of the WATCHKEY round-trip (Warning-Action Token
 * Confirmation Key). NO Stratimux imports — `issueToken` mints a PendingConfirm;
 * `validateToken` re-verifies one against an incoming (action, params, now). The
 * T3 qualities consult these two functions to gate every destructive op.
 *
 * The three guarantees this seam enforces:
 *   - WATCHKEY : a destructive op cannot proceed without a token it only gets
 *               AFTER being warned (call 1 mints; call 2 carries it back).
 *   - PARAMSEAL: the token is sealed to the EXACT params (canonical concat hash);
 *               a bait-and-switch (token for ref A, submit ref B) → 'mismatch'.
 *   - BURNTIME : the token expires at issuedAt + EXPIRY_MS; a stale token →
 *               'expired', forcing a fresh warning (re-round).
 *
 * Citation: GITM-D4-S2-ORANGE-NAMING.md §1-3 (WATCHKEY · PARAMSEAL · BURNTIME)
 * Citation: GITM-D4-S4-GREEN-EXAM.md Q2 (token mechanics · paramsHash + expiry)
 */

import { randomUUID, createHash } from 'node:crypto';
import type { PendingConfirm } from '../qualities/types';

// BURNTIME boundary — 120_000ms (2 minutes). A token unused past this burns;
// the caller must re-initiate the destructive action to surface a fresh warning.
export const EXPIRY_MS = 120000;

/**
 * The centralized PARAMSEAL hash. The destructive params are folded into ONE
 * canonical ordered string then SHA-256'd. BOTH the issuing call and the
 * validating call MUST route through this single function so the hash is
 * byte-identical for identical params (idempotent verification).
 *
 * Each entry is `key=value`; the params object is sorted by key so field order
 * in the caller payload never changes the hash. Values are coerced to string.
 */
export function hashParams(params: Record<string, string | number | boolean>): string {
  const canonical = Object.keys(params)
    .sort()
    .map((key) => `${key}=${String(params[key])}`)
    .join('\x1f'); // ASCII unit separator — collision-safe field boundary
  return createHash('sha256').update(canonical).digest('hex');
}

/**
 * Mint a fresh WATCHKEY token sealed to (action, params). The returned
 * PendingConfirm is stored on GitmState.pendingConfirm; its `.token` is surfaced
 * to the caller in lastActionResult.confirmToken on the call-1 guard result.
 */
export function issueToken(
  action: string,
  params: Record<string, string | number | boolean>,
): PendingConfirm {
  return {
    action,
    token: randomUUID(),
    paramsHash: hashParams(params),
    issuedAt: Date.now(),
  };
}

export type TokenValidation = 'ok' | 'expired' | 'mismatch';

/**
 * Validate an incoming call-2 token against the state-held PendingConfirm.
 *
 *   - 'mismatch' — no pending confirm, wrong action, wrong token, or a params
 *                 hash that does not match the sealed one (PARAMSEAL reject).
 *   - 'expired'  — token + params match BUT now ≥ issuedAt + EXPIRY_MS (BURNTIME).
 *   - 'ok'       — token + params match AND within the BURNTIME window → execute.
 *
 * Pure: takes `now` as an argument so the expiry boundary is deterministically
 * testable without clock mocking.
 */
export function validateToken(
  pending: PendingConfirm | null,
  action: string,
  params: Record<string, string | number | boolean>,
  token: string,
  now: number = Date.now(),
): TokenValidation {
  if (
    pending === null ||
    pending.action !== action ||
    pending.token !== token ||
    pending.paramsHash !== hashParams(params)
  ) {
    return 'mismatch';
  }
  if (now - pending.issuedAt >= EXPIRY_MS) {
    return 'expired';
  }
  return 'ok';
}
