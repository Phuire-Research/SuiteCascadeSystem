/**
 * SCP Lifecycle Badge Helper Tests (SB-Final)
 *
 * Pure-function unit tests for renderScpLifecycleBadge + the defensive fallback
 * wrapper. Verifies the 4-state surface (Interactive COLLAPSED), elapsed-time
 * formatting for Booting, session-count sub-marker for Live, and the
 * BADGE_COLUMN_WIDTH invariant (every emitted label padEnds to 14 chars so the
 * existing renderScpSubMenuPane column math remains intact).
 *
 * Citation: SUITE-6-PURPLE-SB-FINAL-SEQUENCE.md Step 6
 * Citation: SUITE-4-GREEN-SB-FINAL-BIDIRECTIONAL.md (A) COLLAPSE decision
 */
import {
  BADGE_COLUMN_WIDTH,
  renderScpLifecycleBadge,
  renderScpLifecycleBadgeWithFallback,
} from './scpLifecycleBadge';

describe('renderScpLifecycleBadge · 4-state surface (Interactive COLLAPSED)', () => {
  it('renders pending state padded to BADGE_COLUMN_WIDTH', () => {
    const badge = renderScpLifecycleBadge('pending');
    expect(badge).toMatch(/^pending\s+$/);
    expect(badge.length).toBe(BADGE_COLUMN_WIDTH);
  });

  it('renders idle state padded to BADGE_COLUMN_WIDTH', () => {
    const badge = renderScpLifecycleBadge('idle');
    expect(badge).toMatch(/^idle\s+$/);
    expect(badge.length).toBe(BADGE_COLUMN_WIDTH);
  });

  it('renders booting state with 0s elapsed when no elapsedMs provided', () => {
    const badge = renderScpLifecycleBadge('booting');
    expect(badge.trim()).toBe('booting 0s');
    expect(badge.length).toBe(BADGE_COLUMN_WIDTH);
  });

  it('renders booting state with elapsed seconds (30s)', () => {
    const badge = renderScpLifecycleBadge('booting', { bootingElapsedMs: 30_000 });
    expect(badge.trim()).toBe('booting 30s');
    expect(badge.length).toBe(BADGE_COLUMN_WIDTH);
  });

  it('renders live state with port and no sub-marker when sessionCount=0', () => {
    const badge = renderScpLifecycleBadge('live', { port: 7111, sessionCount: 0 });
    expect(badge.trim()).toBe('live:7111');
    expect(badge.length).toBe(BADGE_COLUMN_WIDTH);
  });

  it('renders live state with session-count sub-marker when sessionCount>0', () => {
    const badge = renderScpLifecycleBadge('live', { port: 7111, sessionCount: 1 });
    expect(badge.trim()).toBe('live (1):7111');
    expect(badge.length).toBe(BADGE_COLUMN_WIDTH);
  });

  it('renders live state with no port when port absent', () => {
    const badge = renderScpLifecycleBadge('live');
    expect(badge.trim()).toBe('live');
    expect(badge.length).toBe(BADGE_COLUMN_WIDTH);
  });
});

describe('renderScpLifecycleBadgeWithFallback · undefined safety', () => {
  it('treats undefined as pending (FSM entry state)', () => {
    const badge = renderScpLifecycleBadgeWithFallback(undefined);
    expect(badge.trim()).toBe('pending');
    expect(badge.length).toBe(BADGE_COLUMN_WIDTH);
  });

  it('passes through known state unchanged', () => {
    const badge = renderScpLifecycleBadgeWithFallback('live', { port: 7200 });
    expect(badge.trim()).toBe('live:7200');
    expect(badge.length).toBe(BADGE_COLUMN_WIDTH);
  });
});

describe('renderScpLifecycleBadge · column width invariant', () => {
  it('emits BADGE_COLUMN_WIDTH characters for every state', () => {
    const widths = [
      renderScpLifecycleBadge('pending').length,
      renderScpLifecycleBadge('idle').length,
      renderScpLifecycleBadge('booting', { bootingElapsedMs: 30_000 }).length,
      renderScpLifecycleBadge('live', { port: 7111, sessionCount: 1 }).length,
    ];
    widths.forEach((w) => expect(w).toBe(BADGE_COLUMN_WIDTH));
  });
});
