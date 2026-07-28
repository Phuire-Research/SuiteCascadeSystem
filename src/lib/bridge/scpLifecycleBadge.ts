/**
 * SCP Lifecycle Badge Helper (SB-Final)
 *
 * Pure rendering helper for the per-SCP lifecycle state badge surfaced in
 * renderScpSubMenuPane (menu.ts). Reads ScpLifecycleStateValue (4-state union ·
 * Interactive COLLAPSED per R4 SB-Final Bidirectional + R6 SB-Final Sequence)
 * and composes a 14-char-wide padded label that fits the existing menu column.
 *
 * Higher-Order Composition: pure function · zero Stratimux imports · no
 * side-effects · isolated from menu.ts layout to keep concerns muxified-not-
 * unified (helper composes INTO renderScpSubMenuPane via direct import).
 *
 * Citation: SUITE-6-PURPLE-SB-FINAL-SEQUENCE.md Step 5 (badge surface)
 * Citation: SUITE-4-GREEN-SB-FINAL-BIDIRECTIONAL.md (A) COLLAPSE decision
 * Citation: SUITE-1-RED-SB-FINAL-CURATION.md Card 7 (extension point)
 */
import type { ScpLifecycleStateValue } from './concepts/scpLifecycle/scpLifecycle.type';

export const BADGE_COLUMN_WIDTH = 14;

export type ScpLifecycleBadgeOptions = {
  sessionCount?: number;
  port?: number;
  bootingElapsedMs?: number;
};

/**
 * Render a lifecycle badge string for the given FSM state. Pure function ·
 * returns a string padded to BADGE_COLUMN_WIDTH characters (semantic styling
 * is applied by the caller via ANSI wrappers; this function emits the label
 * text only so the column width is calculable without ANSI-escape stripping).
 *
 * Format per state (Interactive COLLAPSED · 4-state surface):
 *   - pending       (12 chars + 2 pad)
 *   - idle          (4 chars + 10 pad)
 *   - booting Xs    (variable · padEnd 14)
 *   - live :PORT or live (N) :PORT (variable · padEnd 14)
 *
 * Live + sessionCount > 0 surfaces the session-count sub-marker `(N)` derived
 * from spawnsByScp size for that SCP (R4 Angle 5: collapses Interactive into
 * user-observable density without adding an FSM state).
 */
export function renderScpLifecycleBadge(
  state: ScpLifecycleStateValue,
  opts: ScpLifecycleBadgeOptions = {},
): string {
  switch (state) {
    case 'pending':
      return 'pending'.padEnd(BADGE_COLUMN_WIDTH);
    case 'idle':
      return 'idle'.padEnd(BADGE_COLUMN_WIDTH);
    case 'booting': {
      const elapsedSec = Math.max(
        0,
        Math.floor((opts.bootingElapsedMs ?? 0) / 1000),
      );
      return `booting ${elapsedSec}s`.padEnd(BADGE_COLUMN_WIDTH);
    }
    case 'live': {
      const portFragment = opts.port !== undefined ? `:${opts.port}` : '';
      const sessionFragment =
        opts.sessionCount !== undefined && opts.sessionCount > 0
          ? ` (${opts.sessionCount})`
          : '';
      return `live${sessionFragment}${portFragment}`.padEnd(BADGE_COLUMN_WIDTH);
    }
  }
}

/**
 * Defensive fallback for callers handling undefined snapshot entries (an SCP
 * present in the registry but absent from lifecycleByScp before the first
 * PendingToIdle transition fires). Treats unknown as 'pending' — matches the
 * documented FSM entry state.
 */
export function renderScpLifecycleBadgeWithFallback(
  state: ScpLifecycleStateValue | undefined,
  opts: ScpLifecycleBadgeOptions = {},
): string {
  return renderScpLifecycleBadge(state ?? 'pending', opts);
}
