/**
 * scpBootOverlay Concept · Boot Overlay Diamond
 *
 * Template: scpLifecycle.concept.ts (B.3 inherited)
 * Pattern: Explicit Quality type mapping (NEVER typeof per CLAUDE.md non-negotiable)
 *
 * 4 Qualities · 0 principles (Reducer + Method timer · no upstream stage planner required):
 *   - scpBootOverlayAppendLine          (Method+Reducer · BOLS feeds · RPDA resets timer)
 *   - scpBootOverlayShow                (Reducer-only   · OREE re-entry + spawn-init dispatch)
 *   - scpBootOverlayDismiss             (Reducer-only   · OREE user-esc + force-hold reset)
 *   - scpBootOverlayRestPeriodElapsed   (Reducer-only   · RPDA timer commit · failureLatched gate)
 *
 * Tier 2 muxification: composed inside scp container via createScpConcept.
 * Access path: d.scp.d.scpBootOverlay.k.{overlays,activeOverlayScpName} · ECK respected.
 *
 * Citation: M63 Copy-Paste-Plus · STRATIMUX-REFERENCE.md Quality Creation Patterns
 * Citation: SUITE-3-YELLOW-BOOT-OVERLAY-BLUEPRINT.md §2 Concept Definition
 */

import { createConcept, type Concept } from 'stratimux';
import {
  scpBootOverlayName,
  createScpBootOverlayState,
  type ScpBootOverlayState,
} from './scpBootOverlay.type';

import {
  scpBootOverlayAppendLine,
  type ScpBootOverlayAppendLine,
} from './qualities/scpBootOverlayAppendLine.quality';
import {
  scpBootOverlayShow,
  type ScpBootOverlayShow,
} from './qualities/scpBootOverlayShow.quality';
import {
  scpBootOverlayDismiss,
  type ScpBootOverlayDismiss,
} from './qualities/scpBootOverlayDismiss.quality';
import {
  scpBootOverlayRestPeriodElapsed,
  type ScpBootOverlayRestPeriodElapsed,
} from './qualities/scpBootOverlayRestPeriodElapsed.quality';

export type ScpBootOverlayQualities = {
  scpBootOverlayAppendLine: ScpBootOverlayAppendLine;
  scpBootOverlayShow: ScpBootOverlayShow;
  scpBootOverlayDismiss: ScpBootOverlayDismiss;
  scpBootOverlayRestPeriodElapsed: ScpBootOverlayRestPeriodElapsed;
};

export type ScpBootOverlayConcept = Concept<ScpBootOverlayState, ScpBootOverlayQualities>;

export type ScpBootOverlayDeck = {
  scpBootOverlay: Concept<ScpBootOverlayState, ScpBootOverlayQualities>;
};

export type CreateScpBootOverlayConceptOptions = {
  userCwd: string;
};

export const createScpBootOverlayConcept = (_options: CreateScpBootOverlayConceptOptions) =>
  createConcept(
    scpBootOverlayName,
    createScpBootOverlayState(),
    {
      scpBootOverlayAppendLine,
      scpBootOverlayShow,
      scpBootOverlayDismiss,
      scpBootOverlayRestPeriodElapsed,
    },
    [],
  );
