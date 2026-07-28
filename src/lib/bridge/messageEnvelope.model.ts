/**
 * BridgeMessageEnvelope SPVI Validator (SB-A1-D1)
 *
 * Pure validation surface for the kinded BridgeMessageEnvelope. Zero stratimux
 * imports · zero file I/O · idempotent — runs the same envelope twice yields
 * the same ValidationResult.
 *
 * SPVI = Schema-Pattern-Validation-Idempotency. The function `validateEnvelope`
 * checks base envelope shape AND, when `kind` is present, the typed kindPayload
 * shape. Type guards `isBootRequestEnvelope` and `isLiveAckEnvelope` discriminate
 * validated envelopes for downstream routing.
 *
 * R2 BMEKW defense-in-depth: when both `kind` field AND `content` are present,
 * and `content` parses as JSON, the validator cross-checks consistency between
 * the embedded `content`-JSON kind and the typed `kind` field. Mismatched kinds
 * yield ValidationFail. This preserves the canonical M2-A2-D3 substrate while
 * recognizing the BMEKW pattern for legacy/cross-surface envelope writers.
 *
 * Citation: SUITE-2-ORANGE-SB-A1-D1-PROSPECTING.md A3 (BMEKW)
 * Citation: SUITE-3-YELLOW-SB-A1-D1-ARCHITECTURE.md B2 (SPVI · messageEnvelope.model.ts)
 * Citation: SUITE-6-PURPLE-SB-A1-D1-SEQUENCE.md Step 3 (validator surface)
 */
import type {
  BootRequestPayload,
  BridgeMessageEnvelope,
  EnvelopeKind,
  HeartbeatPayload,
  LiveAckPayload,
  Priority,
  Sender,
} from './types';

// ============================================
// VALIDATION RESULT TYPES
// ============================================

export type ValidationOk = {
  valid: true;
  envelope: BridgeMessageEnvelope;
};

export type ValidationFail = {
  valid: false;
  reason: string;
};

export type ValidationResult = ValidationOk | ValidationFail;

// ============================================
// PRIMITIVE TYPE GUARDS
// ============================================

function isString(v: unknown): v is string {
  return typeof v === 'string';
}

function isNumber(v: unknown): v is number {
  return typeof v === 'number' && Number.isFinite(v);
}

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

const PRIORITY_VALUES: readonly Priority[] = ['head', 'body', 'tail'];
const SENDER_VALUES: readonly Sender[] = ['user', 'agent', 'router'];
const ENVELOPE_KIND_VALUES: readonly EnvelopeKind[] = [
  'boot-request',
  'live-ack',
  'presence-ping',
];

// ============================================
// BASE FIELD VALIDATION
// ============================================

function validateBaseFields(raw: Record<string, unknown>): ValidationFail | null {
  if (!isString(raw['id']) || raw['id'].length === 0) {
    return { valid: false, reason: 'missing-or-empty-id' };
  }
  if (!isString(raw['sessionId']) || raw['sessionId'].length === 0) {
    return { valid: false, reason: 'missing-or-empty-sessionId' };
  }
  if (!isString(raw['priority']) || !PRIORITY_VALUES.includes(raw['priority'] as Priority)) {
    return { valid: false, reason: 'invalid-priority' };
  }
  if (!isString(raw['content'])) {
    return { valid: false, reason: 'missing-content' };
  }
  if (!isNumber(raw['createdAt'])) {
    return { valid: false, reason: 'missing-or-invalid-createdAt' };
  }
  if (!isString(raw['sender']) || !SENDER_VALUES.includes(raw['sender'] as Sender)) {
    return { valid: false, reason: 'invalid-sender' };
  }
  if (raw['consumedAt'] !== undefined && !isNumber(raw['consumedAt'])) {
    return { valid: false, reason: 'invalid-consumedAt' };
  }
  return null;
}

// ============================================
// KIND-PAYLOAD VALIDATION
// ============================================

function validateBootRequestPayload(raw: unknown): ValidationFail | null {
  if (!isObject(raw)) {
    return { valid: false, reason: 'boot-request-payload-not-object' };
  }
  if (!isString(raw['scpName']) || raw['scpName'].length === 0) {
    return { valid: false, reason: 'boot-request-missing-or-empty-scpName' };
  }
  if (!isNumber(raw['requestedAt'])) {
    return { valid: false, reason: 'boot-request-missing-or-invalid-requestedAt' };
  }
  return null;
}

function validateLiveAckPayload(raw: unknown): ValidationFail | null {
  if (!isObject(raw)) {
    return { valid: false, reason: 'live-ack-payload-not-object' };
  }
  if (!isString(raw['scpName']) || raw['scpName'].length === 0) {
    return { valid: false, reason: 'live-ack-missing-or-empty-scpName' };
  }
  if (!isNumber(raw['port'])) {
    return { valid: false, reason: 'live-ack-missing-or-invalid-port' };
  }
  if (!isNumber(raw['boundAt'])) {
    return { valid: false, reason: 'live-ack-missing-or-invalid-boundAt' };
  }
  if (raw['browserUrl'] !== undefined && !isString(raw['browserUrl'])) {
    return { valid: false, reason: 'invalid-browserUrl' };
  }
  return null;
}

/**
 * SS-A1-D2 · PPHB envelope payload validator. Mirrors validateBootRequestPayload
 * shape (object · non-empty strings · finite number). Idempotent · zero I/O.
 *
 * Citation: SUITE-4-GREEN-SS-A1-D2-BIDIRECTIONAL.md (D1 · validator extension)
 * Citation: SUITE-6-PURPLE-SS-A1-D2-SEQUENCE.md Step 3 (validateHeartbeatPayload)
 */
function validateHeartbeatPayload(raw: unknown): ValidationFail | null {
  if (!isObject(raw)) {
    return { valid: false, reason: 'presence-ping-payload-not-object' };
  }
  if (!isString(raw['sessionId']) || raw['sessionId'].length === 0) {
    return { valid: false, reason: 'presence-ping-missing-or-empty-sessionId' };
  }
  if (!isString(raw['scpName']) || raw['scpName'].length === 0) {
    return { valid: false, reason: 'presence-ping-missing-or-empty-scpName' };
  }
  if (!isNumber(raw['sentAt'])) {
    return { valid: false, reason: 'presence-ping-missing-or-invalid-sentAt' };
  }
  return null;
}

// ============================================
// BMEKW DEFENSE-IN-DEPTH: parse content JSON · cross-check kind
// ============================================

function tryParseContentKind(content: string): string | null {
  if (content.length === 0) return null;
  try {
    const parsed: unknown = JSON.parse(content);
    if (isObject(parsed) && isString(parsed['kind'])) {
      return parsed['kind'];
    }
  } catch {
    // content is not JSON · not a BMEKW envelope · skip cross-check
  }
  return null;
}

// ============================================
// PRIMARY EXPORT: validateEnvelope
// ============================================

/**
 * Validates an unknown value as a BridgeMessageEnvelope.
 *
 * Idempotent: same input yields same ValidationResult. Pure: no I/O, no closure
 * mutation. R2 BMEKW defense-in-depth: when both `kind` and parsable content
 * JSON are present, the validator cross-checks that `content.kind === kind`.
 */
export function validateEnvelope(raw: unknown): ValidationResult {
  if (!isObject(raw)) {
    return { valid: false, reason: 'not-an-object' };
  }

  const baseFail = validateBaseFields(raw);
  if (baseFail !== null) {
    return baseFail;
  }

  const kind = raw['kind'];
  const kindPayload = raw['kindPayload'];

  // Case 1: no kind · plain envelope (backward-compatible · 10 frozen tests path)
  if (kind === undefined) {
    if (kindPayload !== undefined) {
      return { valid: false, reason: 'kindPayload-without-kind' };
    }
    return { valid: true, envelope: raw as unknown as BridgeMessageEnvelope };
  }

  // Case 2: kind present · must be valid EnvelopeKind literal
  if (!isString(kind) || !ENVELOPE_KIND_VALUES.includes(kind as EnvelopeKind)) {
    return { valid: false, reason: `unknown-kind:${String(kind)}` };
  }

  if (kindPayload === undefined) {
    return { valid: false, reason: 'kind-without-kindPayload' };
  }

  // Per-kind payload validation
  if (kind === 'boot-request') {
    const payloadFail = validateBootRequestPayload(kindPayload);
    if (payloadFail !== null) return payloadFail;
  } else if (kind === 'live-ack') {
    const payloadFail = validateLiveAckPayload(kindPayload);
    if (payloadFail !== null) return payloadFail;
  } else if (kind === 'presence-ping') {
    const payloadFail = validateHeartbeatPayload(kindPayload);
    if (payloadFail !== null) return payloadFail;
  }

  // BMEKW defense-in-depth: if content parses as JSON carrying a kind field,
  // cross-check consistency. Mismatch is a validation failure (corrupted or
  // legacy envelope mixing two schemas).
  const content = raw['content'] as string;
  const embeddedKind = tryParseContentKind(content);
  if (embeddedKind !== null && embeddedKind !== kind) {
    return {
      valid: false,
      reason: `kind-mismatch:envelope-kind=${kind}:content-kind=${embeddedKind}`,
    };
  }

  return { valid: true, envelope: raw as unknown as BridgeMessageEnvelope };
}

// ============================================
// TYPE GUARDS (post-validation discriminators)
// ============================================

/**
 * Type guard for BSBRE-shaped envelopes. Assumes envelope has already passed
 * `validateEnvelope`. Returns true only when both `kind === 'boot-request'`
 * AND a valid BootRequestPayload is present.
 */
export function isBootRequestEnvelope(
  env: BridgeMessageEnvelope,
): env is BridgeMessageEnvelope & { kind: 'boot-request'; kindPayload: BootRequestPayload } {
  if (env.kind !== 'boot-request') return false;
  const payload = env.kindPayload as unknown;
  if (!isObject(payload)) return false;
  const scpName = payload['scpName'];
  const requestedAt = payload['requestedAt'];
  return isString(scpName) && scpName.length > 0 && isNumber(requestedAt);
}

/**
 * Type guard for SLAC-shaped envelopes. Assumes envelope has already passed
 * `validateEnvelope`. Returns true only when both `kind === 'live-ack'`
 * AND a valid LiveAckPayload is present.
 */
export function isLiveAckEnvelope(
  env: BridgeMessageEnvelope,
): env is BridgeMessageEnvelope & { kind: 'live-ack'; kindPayload: LiveAckPayload } {
  if (env.kind !== 'live-ack') return false;
  const payload = env.kindPayload as unknown;
  if (!isObject(payload)) return false;
  const scpName = payload['scpName'];
  const port = payload['port'];
  const boundAt = payload['boundAt'];
  return (
    isString(scpName) &&
    scpName.length > 0 &&
    isNumber(port) &&
    isNumber(boundAt)
  );
}

/**
 * SS-A1-D2 · Type guard for PPHB heartbeat envelopes. Assumes envelope has
 * already passed `validateEnvelope`. Returns true only when both
 * `kind === 'presence-ping'` AND a valid HeartbeatPayload is present.
 *
 * Citation: SUITE-4-GREEN-SS-A1-D2-BIDIRECTIONAL.md (D1 · isHeartbeatEnvelope)
 * Citation: SUITE-6-PURPLE-SS-A1-D2-SEQUENCE.md Step 3 (type guard)
 */
export function isHeartbeatEnvelope(
  env: BridgeMessageEnvelope,
): env is BridgeMessageEnvelope & { kind: 'presence-ping'; kindPayload: HeartbeatPayload } {
  if (env.kind !== 'presence-ping') return false;
  const payload = env.kindPayload as unknown;
  if (!isObject(payload)) return false;
  const sessionId = payload['sessionId'];
  const scpName = payload['scpName'];
  const sentAt = payload['sentAt'];
  return (
    isString(sessionId) &&
    sessionId.length > 0 &&
    isString(scpName) &&
    scpName.length > 0 &&
    isNumber(sentAt)
  );
}
