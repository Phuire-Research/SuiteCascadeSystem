/**
 * scpMessageRouter Quality Type Definitions · Phase B.2 · Cycle 130
 *
 * Template: src/lib/bridge/concepts/scpRegistryWatcher/qualities/types.ts (B.1 inherited)
 * Template: ADMIN_ICP/src/concepts/icp/qualities/types.ts
 * Pattern: Explicit Quality<State, Payload> type mapping (NEVER typeof)
 *
 * 4-Quality split (Option B per R1 §4 · R2 LOCKED):
 *   1. BridgeJsonReceived       (Reducer-only)
 *   2. BmrEnvelopeReceived      (Method+Reducer+Bucket)
 *   3. WatcherArm               (Method+Reducer+Bucket · kind-branch)
 *   4. WatcherDisarm            (Method+Reducer · kind-branch · no bucket)
 *
 * WatcherKind 2-member union enforces tsc exhaustive switch in Method body.
 *
 * Citation: M63 Copy-Paste-Plus · STRATIMUX-REFERENCE.md Quality Creation Patterns
 * Citation: SUITE-1-RED-B2-MSGROUTER-CURATION.md §2 (Pattern Cards 1-12)
 * Citation: SUITE-2-ORANGE-B2-MSGROUTER-NAMING.md §3 (Per-Quality Payload Shape)
 * Citation: SUITE-3-YELLOW-B2-MSGROUTER-BLUEPRINT.md §3.1
 */

import type { Quality } from 'stratimux';
import type { ScpMessageRouterState } from '../scpMessageRouter.type';

// ────────────────────────────────────────────────
// WATCHER KIND DISCRIMINATOR
// ────────────────────────────────────────────────

// F2 · SCP-WINDOW-CLOSURE-CONSUME · 'sessionsJson' watches the top-level registry
// file (bridgeRoot()/sessions.json) for the scpWindowClosures array the electron-side
// F1 recordScpWindowClosure writer appends when the no-handle close mode fires. The
// daemon consumer (Stage 4) dedupes by a closedAt watermark → dispatches
// scpLifecycleWindowClosed for each newer closure. NO write-back (the watermark dedupes;
// the F1 cap self-limits the array). This is the cross-process Diameter completing leg.
// PSSM · W0/W5 · 'scpsJson' watches the WORKSPACE registry file (<userCwd>/Cascades/SCPs.json)
// for the per-SCP persisted `status` field ('live'|'pending'). CRITICAL HARDENING (WebSearch-
// grounded): our writers are atomic tmp+RENAME — a chokidar SINGLE-FILE watch silently dies on
// the rename inode-swap under fsevents (LIVE-PROVEN by the sessionsJson handler never firing for
// a post-boot closure). So this watch (and the hardened sessionsJson watch) target the PARENT DIR
// with a filename filter in the handler (the robust idiom · depth 0 · awaitWriteFinish kept).
// The daemon consumer dispatches scpLifecycleWindowClosed on 'pending' → the surface follows the
// persisted status; 'live' arrives via the spawn path already.
export type WatcherKind = 'bridgeJson' | 'sessionsDir' | 'bridgeSessionsDir' | 'sessionsJson' | 'scpsJson';

export type BmrEnvelopeKind = 'boot-request' | 'heartbeat' | 'log';

// ────────────────────────────────────────────────
// PAYLOAD TYPES
// ────────────────────────────────────────────────

export type ScpMessageRouterBridgeJsonReceivedPayload = {
  content: unknown;
};

export type ScpMessageRouterBmrEnvelopeReceivedPayload = {
  envelopePath: string;
  ulid: string;
  kind: BmrEnvelopeKind | string;
  scpName: string;
  payload: unknown;
};

export type ScpMessageRouterWatcherArmPayload = {
  watcherKind: WatcherKind;
};

export type ScpMessageRouterWatcherDisarmPayload = {
  watcherKind: WatcherKind;
};

// ────────────────────────────────────────────────
// QUALITY TYPES
// ────────────────────────────────────────────────

export type ScpMessageRouterBridgeJsonReceived =
  Quality<ScpMessageRouterState, ScpMessageRouterBridgeJsonReceivedPayload>;

export type ScpMessageRouterBmrEnvelopeReceived =
  Quality<ScpMessageRouterState, ScpMessageRouterBmrEnvelopeReceivedPayload>;

export type ScpMessageRouterWatcherArm =
  Quality<ScpMessageRouterState, ScpMessageRouterWatcherArmPayload>;

export type ScpMessageRouterWatcherDisarm =
  Quality<ScpMessageRouterState, ScpMessageRouterWatcherDisarmPayload>;

// ────────────────────────────────────────────────
// B.3 DADTE · Downstream-Aware Deck for Cross-Concept Dispatch
// ────────────────────────────────────────────────

/**
 * B.3 addition · downstream-aware Deck type for form-α LOCK cross-Concept
 * dispatch from scpMessageRouter.BmrEnvelopeReceived.Method into scpLifecycle.
 * Used by the BmrEnvelopeReceived Quality's 3rd generic to type-honor the
 * `deck.scpLifecycle.e.scpLifecycle*` access surface at compile time.
 *
 * Citation: M63 Copy-Paste-Plus · ADMIN_ICP icpExecuteTool precedent
 * Citation: SUITE-2-ORANGE-B3-LIFECYCLE-NAMING.md §8.2
 * Citation: SUITE-3-YELLOW-B3-LIFECYCLE-BLUEPRINT.md §3.12
 */
import type { Concept } from 'stratimux';
import type { ScpLifecycleConcept } from '../../scpLifecycle/scpLifecycle.concept';
import type { ScsBridgeConcept } from '../../scsBridge/scsBridge.types';

export type ScpMessageRouterDownstreamDeck = {
  scpMessageRouter: Concept<ScpMessageRouterState, Record<string, unknown>>;
  scpLifecycle: ScpLifecycleConcept;
  scsBridge: ScsBridgeConcept;
};
