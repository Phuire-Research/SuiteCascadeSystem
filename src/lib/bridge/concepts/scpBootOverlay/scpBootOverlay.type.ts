/**
 * scpBootOverlay Type Definitions · Boot Overlay Diamond
 *
 * Template: scpLifecycle.type.ts (B.3 inherited · Map-keyed-by-scpName)
 * Pattern: PBSM Per-SCP-Boot-State-Machine state shape (R2 Pattern 2)
 *
 * State shape:
 *   - overlays:              Map<scpName, ScpOverlayEntry> · ring buffer + lastLineAt
 *   - activeOverlayScpName:  string | null · MOSM single-most-visible slot (R2 Pattern 8)
 *
 * Reconciled Decisions (R3 + R4 Synthesis):
 *   - Single activeOverlayScpName in scpBootOverlay state — separate from
 *     MenuState.activeScpFilter (overlay visible while filter changes).
 *   - Map mutation pattern: `new Map(state.overlays)` required for
 *     KeyedSelector change detection (B.2 Card 10 precedent).
 *
 * Muxonomy filterKeys: ['overlays', 'activeOverlayScpName'] — server-side only.
 * Ring buffer + activeName are non-serializable in spirit (Map); excluded from sync.
 *
 * Citation: M60 State-or-Payload Anor · M63 Copy-Paste-Plus
 * Citation: SUITE-2-ORANGE-BOOT-OVERLAY-FRONTIER-NAMING.md §Pattern 2 (PBSM) · §Pattern 8 (MOSM)
 * Citation: SUITE-3-YELLOW-BOOT-OVERLAY-BLUEPRINT.md §2 State Shape
 * Citation: SUITE-4-GREEN-BOOT-OVERLAY-AUDIT.md HIGH-1 (single-slot arbitration)
 */

export const scpBootOverlayName = 'scpBootOverlay';

export type ScpOverlayDismissReason = 'user-esc' | 'rest-period' | 'force-hold' | null;

export type ScpOverlayEntry = {
  scpName: string;
  ringBuffer: string[];
  lastLineAt: number;
  dismissedReason: ScpOverlayDismissReason;
  totalLinesAppended: number;
  failureLatched: boolean;
};

export type ScpBootOverlayState = {
  overlays: Map<string, ScpOverlayEntry>;
  activeOverlayScpName: string | null;
};

export const createScpBootOverlayState = (): ScpBootOverlayState => ({
  overlays: new Map<string, ScpOverlayEntry>(),
  activeOverlayScpName: null,
});

export const RING_BUFFER_K = 30;
