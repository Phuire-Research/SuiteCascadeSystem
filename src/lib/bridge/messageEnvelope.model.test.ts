/**
 * BridgeMessageEnvelope SPVI Validator Tests (SB-A1-D1)
 *
 * Pure-function unit tests for messageEnvelope.model.ts. Tests cover:
 *   - validateEnvelope: valid envelope (no kind) · valid BSBRE · valid SLAC ·
 *     missing fields · invalid kind · payload mismatch · BMEKW cross-check
 *   - isBootRequestEnvelope type guard
 *   - isLiveAckEnvelope type guard
 *
 * Pattern: async/await-friendly flat tests (bridge module convention same as
 * queue.test.ts) — done-callback discipline applies to concept-level tests.
 *
 * Citation: SUITE-3-YELLOW-SB-A1-D1-ARCHITECTURE.md B2 (SPVI surface)
 * Citation: SUITE-6-PURPLE-SB-A1-D1-SEQUENCE.md Step 19 (8-12 tests · 120-180 LOC)
 * Citation: STRATIMUX-REFERENCE.md "🧪 Stratimux Testing Patterns"
 */
import {
  isBootRequestEnvelope,
  isHeartbeatEnvelope,
  isLiveAckEnvelope,
  validateEnvelope,
} from './messageEnvelope.model';
import type { BridgeMessageEnvelope } from './types';

describe('validateEnvelope · base envelope (no kind)', () => {
  it('validates a plain envelope without kind (backward-compatible with 10 frozen tests)', () => {
    const env = {
      id: '01TEST00000000000000000001',
      sessionId: '01SESSION0000000000000000A',
      priority: 'head',
      content: 'plain text',
      createdAt: Date.now(),
      sender: 'user',
    };
    const result = validateEnvelope(env);
    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.envelope.id).toBe('01TEST00000000000000000001');
    }
  });

  it('rejects non-object input', () => {
    const result = validateEnvelope(null);
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.reason).toBe('not-an-object');
    }
  });

  it('rejects envelope missing id', () => {
    const result = validateEnvelope({
      sessionId: 'sid',
      priority: 'head',
      content: '',
      createdAt: 0,
      sender: 'user',
    });
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.reason).toBe('missing-or-empty-id');
    }
  });

  it('rejects envelope with invalid priority', () => {
    const result = validateEnvelope({
      id: 'x',
      sessionId: 'sid',
      priority: 'urgent',
      content: '',
      createdAt: 0,
      sender: 'user',
    });
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.reason).toBe('invalid-priority');
    }
  });

  it('rejects envelope with invalid sender', () => {
    const result = validateEnvelope({
      id: 'x',
      sessionId: 'sid',
      priority: 'head',
      content: '',
      createdAt: 0,
      sender: 'somebody',
    });
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.reason).toBe('invalid-sender');
    }
  });
});

describe('validateEnvelope · BSBRE (kind: boot-request)', () => {
  it('validates a well-formed BSBRE envelope', () => {
    const env = {
      id: '01BSBRE0000000000000000001',
      sessionId: '01SESSION0000000000000000A',
      priority: 'head',
      content: '',
      createdAt: Date.now(),
      sender: 'router',
      kind: 'boot-request',
      kindPayload: { scpName: 'test-scp', requestedAt: Date.now() },
    };
    const result = validateEnvelope(env);
    expect(result.valid).toBe(true);
  });

  it('rejects BSBRE with empty scpName', () => {
    const env = {
      id: 'x',
      sessionId: 'sid',
      priority: 'head',
      content: '',
      createdAt: Date.now(),
      sender: 'router',
      kind: 'boot-request',
      kindPayload: { scpName: '', requestedAt: Date.now() },
    };
    const result = validateEnvelope(env);
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.reason).toBe('boot-request-missing-or-empty-scpName');
    }
  });

  it('rejects BSBRE with kind but no kindPayload', () => {
    const env = {
      id: 'x',
      sessionId: 'sid',
      priority: 'head',
      content: '',
      createdAt: Date.now(),
      sender: 'router',
      kind: 'boot-request',
    };
    const result = validateEnvelope(env);
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.reason).toBe('kind-without-kindPayload');
    }
  });
});

describe('validateEnvelope · SLAC (kind: live-ack)', () => {
  it('validates a well-formed SLAC envelope', () => {
    const env = {
      id: '01SLAC0000000000000000001',
      sessionId: '01SESSION0000000000000000A',
      priority: 'head',
      content: '',
      createdAt: Date.now(),
      sender: 'router',
      kind: 'live-ack',
      kindPayload: {
        scpName: 'test-scp',
        port: 4400,
        boundAt: Date.now(),
        browserUrl: 'http://localhost:4400',
      },
    };
    const result = validateEnvelope(env);
    expect(result.valid).toBe(true);
  });

  it('rejects SLAC with missing port', () => {
    const env = {
      id: 'x',
      sessionId: 'sid',
      priority: 'head',
      content: '',
      createdAt: Date.now(),
      sender: 'router',
      kind: 'live-ack',
      kindPayload: { scpName: 'scp-a', boundAt: Date.now() },
    };
    const result = validateEnvelope(env);
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.reason).toBe('live-ack-missing-or-invalid-port');
    }
  });
});

describe('validateEnvelope · BMEKW defense-in-depth (content-JSON cross-check)', () => {
  it('cross-checks content JSON kind against envelope kind · matching kinds PASS', () => {
    const env = {
      id: 'x',
      sessionId: 'sid',
      priority: 'head',
      content: JSON.stringify({ kind: 'boot-request', extra: 'data' }),
      createdAt: Date.now(),
      sender: 'router',
      kind: 'boot-request',
      kindPayload: { scpName: 'scp-a', requestedAt: Date.now() },
    };
    const result = validateEnvelope(env);
    expect(result.valid).toBe(true);
  });

  it('cross-checks content JSON kind · mismatched kinds FAIL with kind-mismatch reason', () => {
    const env = {
      id: 'x',
      sessionId: 'sid',
      priority: 'head',
      content: JSON.stringify({ kind: 'live-ack' }),
      createdAt: Date.now(),
      sender: 'router',
      kind: 'boot-request',
      kindPayload: { scpName: 'scp-a', requestedAt: Date.now() },
    };
    const result = validateEnvelope(env);
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.reason).toMatch(/^kind-mismatch:/);
    }
  });
});

describe('validateEnvelope · unknown kind', () => {
  it('rejects an envelope with an unknown kind value', () => {
    const env = {
      id: 'x',
      sessionId: 'sid',
      priority: 'head',
      content: '',
      createdAt: Date.now(),
      sender: 'router',
      kind: 'mystery-kind',
      kindPayload: {},
    };
    const result = validateEnvelope(env);
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.reason).toContain('unknown-kind');
    }
  });

  it('rejects envelope with kindPayload but no kind (asymmetry)', () => {
    const env = {
      id: 'x',
      sessionId: 'sid',
      priority: 'head',
      content: '',
      createdAt: Date.now(),
      sender: 'router',
      kindPayload: { scpName: 'a', requestedAt: 1 },
    };
    const result = validateEnvelope(env);
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.reason).toBe('kindPayload-without-kind');
    }
  });
});

describe('isBootRequestEnvelope / isLiveAckEnvelope type guards', () => {
  it('isBootRequestEnvelope: true for valid BSBRE', () => {
    const env: BridgeMessageEnvelope = {
      id: 'x',
      sessionId: 'sid',
      priority: 'head',
      content: '',
      createdAt: Date.now(),
      sender: 'router',
      kind: 'boot-request',
      kindPayload: { scpName: 'scp-a', requestedAt: 100 },
    };
    expect(isBootRequestEnvelope(env)).toBe(true);
  });

  it('isBootRequestEnvelope: false for SLAC envelope', () => {
    const env: BridgeMessageEnvelope = {
      id: 'x',
      sessionId: 'sid',
      priority: 'head',
      content: '',
      createdAt: Date.now(),
      sender: 'router',
      kind: 'live-ack',
      kindPayload: { scpName: 'scp-a', port: 4400, boundAt: 100 },
    };
    expect(isBootRequestEnvelope(env)).toBe(false);
  });

  it('isLiveAckEnvelope: true for valid SLAC', () => {
    const env: BridgeMessageEnvelope = {
      id: 'x',
      sessionId: 'sid',
      priority: 'head',
      content: '',
      createdAt: Date.now(),
      sender: 'router',
      kind: 'live-ack',
      kindPayload: { scpName: 'scp-a', port: 4400, boundAt: 100 },
    };
    expect(isLiveAckEnvelope(env)).toBe(true);
  });

  it('isLiveAckEnvelope: false for BSBRE envelope', () => {
    const env: BridgeMessageEnvelope = {
      id: 'x',
      sessionId: 'sid',
      priority: 'head',
      content: '',
      createdAt: Date.now(),
      sender: 'router',
      kind: 'boot-request',
      kindPayload: { scpName: 'scp-a', requestedAt: 100 },
    };
    expect(isLiveAckEnvelope(env)).toBe(false);
  });

  it('both guards return false for plain envelope (no kind)', () => {
    const env: BridgeMessageEnvelope = {
      id: 'x',
      sessionId: 'sid',
      priority: 'head',
      content: '',
      createdAt: Date.now(),
      sender: 'user',
    };
    expect(isBootRequestEnvelope(env)).toBe(false);
    expect(isLiveAckEnvelope(env)).toBe(false);
  });
});

describe('SS-A1-D2 · presence-ping (PPHB heartbeat) envelope validation', () => {
  it('validates a well-formed presence-ping envelope', () => {
    const env = {
      id: '01PPHB0000000000000000001A',
      sessionId: '01SESSION0000000000000000A',
      priority: 'head',
      content: '',
      createdAt: Date.now(),
      sender: 'router',
      kind: 'presence-ping',
      kindPayload: {
        sessionId: '01SESSION0000000000000000A',
        scpName: 'scp-alpha',
        sentAt: 1_700_000_000_000,
      },
    };
    const result = validateEnvelope(env);
    expect(result.valid).toBe(true);
  });

  it('rejects presence-ping missing sessionId', () => {
    const env = {
      id: '01PPHB0000000000000000002A',
      sessionId: '01SESSION0000000000000000A',
      priority: 'head',
      content: '',
      createdAt: Date.now(),
      sender: 'router',
      kind: 'presence-ping',
      kindPayload: {
        scpName: 'scp-alpha',
        sentAt: 1_700_000_000_000,
      },
    };
    const result = validateEnvelope(env);
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.reason).toBe('presence-ping-missing-or-empty-sessionId');
    }
  });

  it('rejects presence-ping with empty scpName', () => {
    const env = {
      id: '01PPHB0000000000000000003A',
      sessionId: 'sid',
      priority: 'head',
      content: '',
      createdAt: Date.now(),
      sender: 'router',
      kind: 'presence-ping',
      kindPayload: {
        sessionId: 'sid',
        scpName: '',
        sentAt: 100,
      },
    };
    const result = validateEnvelope(env);
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.reason).toBe('presence-ping-missing-or-empty-scpName');
    }
  });

  it('rejects presence-ping with non-numeric sentAt', () => {
    const env = {
      id: '01PPHB0000000000000000004A',
      sessionId: 'sid',
      priority: 'head',
      content: '',
      createdAt: Date.now(),
      sender: 'router',
      kind: 'presence-ping',
      kindPayload: {
        sessionId: 'sid',
        scpName: 'scp-alpha',
        sentAt: 'not-a-number',
      },
    };
    const result = validateEnvelope(env);
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.reason).toBe('presence-ping-missing-or-invalid-sentAt');
    }
  });

  it('isHeartbeatEnvelope: true for valid presence-ping envelope', () => {
    const env: BridgeMessageEnvelope = {
      id: '01PPHB',
      sessionId: 'sid',
      priority: 'head',
      content: '',
      createdAt: Date.now(),
      sender: 'router',
      kind: 'presence-ping',
      kindPayload: {
        sessionId: 'sid',
        scpName: 'scp-alpha',
        sentAt: 100,
      },
    };
    expect(isHeartbeatEnvelope(env)).toBe(true);
  });

  it('isHeartbeatEnvelope: false for boot-request envelope', () => {
    const env: BridgeMessageEnvelope = {
      id: 'x',
      sessionId: 'sid',
      priority: 'head',
      content: '',
      createdAt: Date.now(),
      sender: 'router',
      kind: 'boot-request',
      kindPayload: { scpName: 'scp-a', requestedAt: 100 },
    };
    expect(isHeartbeatEnvelope(env)).toBe(false);
  });

  it('isHeartbeatEnvelope: false for live-ack envelope', () => {
    const env: BridgeMessageEnvelope = {
      id: 'x',
      sessionId: 'sid',
      priority: 'head',
      content: '',
      createdAt: Date.now(),
      sender: 'router',
      kind: 'live-ack',
      kindPayload: { scpName: 'scp-a', port: 4400, boundAt: 100 },
    };
    expect(isHeartbeatEnvelope(env)).toBe(false);
  });
});
