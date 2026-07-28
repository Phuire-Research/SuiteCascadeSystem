/**
 * dockHostValidation · Cycle 139 · CPPP Wiring
 *
 * Migration source: src/lib/bridge/concepts/scpDockHost/qualities/dockHostValidation.ts
 * Pure validation module · zero Stratimux imports. Copy verbatim to decouple from
 * to-be-deleted scpDockHost directory.
 *
 * Citation: SUITE-3-YELLOW-CYCLE-139-CPPP-WIRING-BLUEPRINT.md §5 Step 2
 */

export type DockHostValidationField = 'scpName' | 'scpPort' | 'logEndpoint';

export type DockHostValidationResult =
  | { ok: true }
  | { ok: false; reason: string; field: DockHostValidationField };

export function validateScpName(scpName: string): DockHostValidationResult {
  if (typeof scpName !== 'string') {
    return { ok: false, reason: 'not-string', field: 'scpName' };
  }
  if (scpName.length === 0) {
    return { ok: false, reason: 'empty', field: 'scpName' };
  }
  if (scpName.length > 64) {
    return { ok: false, reason: 'too-long', field: 'scpName' };
  }
  if (scpName.includes('/')) {
    return { ok: false, reason: 'forward-slash', field: 'scpName' };
  }
  if (scpName.includes('\\')) {
    return { ok: false, reason: 'backslash', field: 'scpName' };
  }
  if (scpName.includes('..')) {
    return { ok: false, reason: 'parent-dir', field: 'scpName' };
  }
  if (scpName.includes('\0')) {
    return { ok: false, reason: 'null-byte', field: 'scpName' };
  }
  return { ok: true };
}

export function validateScpPort(scpPort: unknown): DockHostValidationResult {
  if (typeof scpPort !== 'number') {
    return { ok: false, reason: 'not-number', field: 'scpPort' };
  }
  if (!Number.isInteger(scpPort)) {
    return { ok: false, reason: 'not-integer', field: 'scpPort' };
  }
  if (scpPort < 1 || scpPort > 65535) {
    return { ok: false, reason: 'out-of-range', field: 'scpPort' };
  }
  return { ok: true };
}

export function validateLogEndpoint(logEndpoint: string): DockHostValidationResult {
  if (typeof logEndpoint !== 'string') {
    return { ok: false, reason: 'not-string', field: 'logEndpoint' };
  }
  if (logEndpoint.length === 0) {
    return { ok: false, reason: 'empty', field: 'logEndpoint' };
  }
  let parsed: URL;
  try {
    parsed = new URL(logEndpoint);
  } catch {
    return { ok: false, reason: 'invalid-url', field: 'logEndpoint' };
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return { ok: false, reason: 'invalid-protocol', field: 'logEndpoint' };
  }
  return { ok: true };
}

export function validateDockRegistrationPayload(
  scpName: string,
  scpPort: unknown,
  logEndpoint: string,
): DockHostValidationResult {
  const nameResult = validateScpName(scpName);
  if (!nameResult.ok) return nameResult;
  const portResult = validateScpPort(scpPort);
  if (!portResult.ok) return portResult;
  const endpointResult = validateLogEndpoint(logEndpoint);
  if (!endpointResult.ok) return endpointResult;
  return { ok: true };
}
