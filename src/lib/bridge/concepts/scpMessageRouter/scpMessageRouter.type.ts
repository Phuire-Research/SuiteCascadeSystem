/**
 * scpMessageRouter Type Definitions · Phase A · Cycle 127 Copy-Paste-Plus
 *
 * Template: ADMIN_ICP/src/concepts/fileSystem/principles/fileSystemWatcher.principle.ts
 *           (FSWatcher pattern · double-watcher for bridge.json + sessions/heads/)
 *           + ADMIN_ICP/src/concepts/icp/qualities/icpStoreHttpResponse.quality.huirth.ts
 *           (non-serializable Map / Set in state)
 *
 * SCP-specific: bridge.json + sessions/heads/ envelope routing · MEFRI ledger
 * (Module-Edged Frame Routing Index · consumedUlids Set · dedup discipline).
 *
 * M59 ActionQue Inductive Reservation: this concept does NOT cross-observe
 * actionQue. Each watcher is the principle's OWN subscription. Cross-Concept
 * routing happens via principle dispatch through deck.
 *
 * Phase A scope: state shape + factory · NO principle wiring yet.
 * Phase B adds: scpMessageRouter.principle.ts (two chokidar watchers) + 4 Qualities.
 *
 * Citation: M59 ActionQue Inductive · M60 State-or-Payload Anor · M63 Copy-Paste-Plus
 */

import type { FSWatcher } from 'chokidar';

export const scpMessageRouterName = 'scpMessageRouter';

// Phase B.2 trace structure · most recent envelope per kind
export type EnvelopeTrace = {
  ulid: string;
  scpName: string;
  payload: unknown;
  receivedAt: number;
};

export type ScpMessageRouterState = {
  userCwd: string;
  bridgeJsonWatcher: FSWatcher | null;
  sessionsDirWatcher: FSWatcher | null;
  // B.7 Regression #4 Hotfix · M73 Path-Diameter-Pairing-Doctrine
  // Watches Cascades/Bridge/sessions/{TUI_SESSION_ID}/heads/{envId}.json (depth: 3).
  // Pairs with the write path produced by src/lib/bridge/paths.ts `priorityDir`.
  // Any change to one MUST be paired with a change to the other.
  bridgeSessionsDirWatcher: FSWatcher | null;
  // F2 · SCP-WINDOW-CLOSURE-CONSUME · watches bridgeRoot()/sessions.json (single-file,
  // depth: 0) for the scpWindowClosures array (F1 electron-side writer). The principle's
  // Stage 4 handler re-reads + consumes closures newer than scpWindowClosureWatermark →
  // dispatches scpLifecycleWindowClosed into the sibling scpLifecycle concept. Paired
  // with paths.ts `registryPath()` (M73 Path-Diameter-Pairing-Doctrine).
  sessionsJsonWatcher: FSWatcher | null;
  // PSSM · W0/W5 · watches the PARENT DIR of <userCwd>/Cascades/SCPs.json (dir-watch
  // hardened against the tmp+rename inode-swap that silently kills a single-file fsevents
  // watch) with a filename filter in the handler. The standalone status-consume plan re-reads
  // SCPs.json on change → dispatches scpLifecycleWindowClosed on 'pending' so lifecycleByScp
  // mirrors the persisted status. Paired with <userCwd>/Cascades/SCPs.json (W0 registry choice).
  scpsJsonWatcher: FSWatcher | null;
  // MEFRI ledger · Set of consumed envelope ULIDs · prevents double-route
  consumedUlids: Set<string>;
  // Phase B.2 extension: parsed bridge.json content (schema TBD by B.6 scsBridgeCore)
  bridgeJsonContent: unknown | null;
  // Phase B.2 extension: most recent envelope trace per kind
  lastEnvelopeByKind: Record<string, EnvelopeTrace>;
};

export const createScpMessageRouterState = (userCwd: string): ScpMessageRouterState => ({
  userCwd,
  bridgeJsonWatcher: null,
  sessionsDirWatcher: null,
  bridgeSessionsDirWatcher: null,
  sessionsJsonWatcher: null,
  scpsJsonWatcher: null,
  consumedUlids: new Set<string>(),
  bridgeJsonContent: null,
  lastEnvelopeByKind: {},
});

// ScpMessageRouterQualities + ScpMessageRouterConcept are now defined in
// scpMessageRouter.concept.ts (Phase B.2 explicit Quality type mapping per
// B.1 scpRegistryWatcher.concept.ts precedent).
