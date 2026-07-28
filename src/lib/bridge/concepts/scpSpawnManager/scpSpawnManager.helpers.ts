/**
 * scpSpawnManager Helpers · Phase A · Cycle 127 Copy-Paste-Plus
 *
 * Pure helper functions consumed by menu.ts for SCP heartbeat filtering.
 * Module-level pure functions (NO Stratimux import · no state coupling).
 *
 * CRITICAL CONSUMER CONTRACT (from src/lib/bridge/menu.ts:613-619):
 *   filterRecentHeartbeats(
 *     interactiveSessionsByScp: Map<string, Map<string, number>>,
 *     scpName: string,
 *     now: number,
 *     stalenessThresholdMs: number,
 *   ): Map<string, number>   // returns the filtered inner-Map for that SCP
 *                             // consumer calls .size on the result
 *
 *   INTERACTIVE_STALENESS_THRESHOLD_MS · numeric constant
 *
 * F4 ZSDA pattern (Zero-Source Destination-Added) · justified by menu.ts consumer
 * signature. Phase A signature is built to satisfy the exact menu.ts call site.
 *
 * Citation: SB-Final menu.ts:613-619 consumer signature · M63 Copy-Paste-Plus · M61 (consumer-driven)
 */

/**
 * Interactive staleness threshold (milliseconds). If an interactive session's
 * receivedAt timestamp is older than this threshold from now, the menu surface
 * filters it out (NOT live). 90 seconds = pragmatic default matching M17
 * filterRecentHeartbeats(now, 90_000) annotation at animatedTui.ts:268.
 */
export const INTERACTIVE_STALENESS_THRESHOLD_MS = 90_000;

/**
 * Filter recent heartbeats for a specific SCP from interactiveSessionsByScp.
 *
 * Returns a Map<sessionId, lastReceivedAt> containing only the sessions whose
 * last-received timestamp is within stalenessThresholdMs of `now`. Returns an
 * empty Map if the SCP has no entry. Consumer (menu.ts) calls `.size` on the
 * result to derive interactive session count.
 *
 * Pure function · referentially transparent · no state observation.
 */
export function filterRecentHeartbeats(
  interactiveSessionsByScp: Map<string, Map<string, number>>,
  scpName: string,
  now: number,
  stalenessThresholdMs: number,
): Map<string, number> {
  const inner = interactiveSessionsByScp.get(scpName);
  if (!inner) {
    return new Map<string, number>();
  }
  const filtered = new Map<string, number>();
  for (const [sessionId, receivedAt] of inner) {
    if (now - receivedAt < stalenessThresholdMs) {
      filtered.set(sessionId, receivedAt);
    }
  }
  return filtered;
}
