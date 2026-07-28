/**
 * scpNameValidation · Card-PSS Path-Separator Sanitization · Cycle 132 · Phase B.4
 *
 * Pure validation module · zero Stratimux imports. Called from the TOP of Q1's
 * scpSpawnManagerSpawnRequested Method body, BEFORE any filesystem touch or
 * `spawn()` call. Invalid scpName never enters the FSM.
 *
 * 7-check list (LOCK 5 · ratified R3 §1.5):
 *   1. typeof scpName !== 'string' → 'not-string'
 *   2. scpName.length === 0        → 'empty'
 *   3. scpName.includes('/')       → 'forward-slash'
 *   4. scpName.includes('\\')      → 'backslash'
 *   5. scpName.includes('..')      → 'parent-dir'
 *   6. scpName.includes('\0')      → 'null-byte'
 *   7. scpName.startsWith('.')     → 'leading-dot'
 *
 * Citation: SUITE-3-YELLOW-B4-SPAWNMGR-BLUEPRINT.md §1.5 + §2.3 · LOCK 5
 * Citation: SUITE-4-GREEN-B4-SPAWNMGR-BIDIRECTIONAL.md §3 LOCK 5 CONFIRMED
 */

export type ScpNameValidationResult = { ok: true } | { ok: false; reason: string };

export function validateScpName(scpName: string): ScpNameValidationResult {
  if (typeof scpName !== 'string') return { ok: false, reason: 'not-string' };
  if (scpName.length === 0) return { ok: false, reason: 'empty' };
  if (scpName.includes('/')) return { ok: false, reason: 'forward-slash' };
  if (scpName.includes('\\')) return { ok: false, reason: 'backslash' };
  if (scpName.includes('..')) return { ok: false, reason: 'parent-dir' };
  if (scpName.includes('\0')) return { ok: false, reason: 'null-byte' };
  if (scpName.startsWith('.')) return { ok: false, reason: 'leading-dot' };
  return { ok: true };
}
