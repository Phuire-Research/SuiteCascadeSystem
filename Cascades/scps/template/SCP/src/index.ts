import { createOwnershipConcept, muxification } from 'stratimux';

import { createHuirthConcept } from './concepts/huirth/huirth.concept';
import { registerCallerSessionWithBridge } from './scsRegisterSession';

(() => {
  // SCSER · SAWSR-D2.B Cycle 153 · fire-and-forget caller-session binding callback
  // Reads SCS_BRIDGE_CALLER_SESSION + SCS_BRIDGE_MCP_ENDPOINT env vars · HTTP POSTs
  // to Bridge MCP tool scs_bridge_bind_caller_session if present · non-blocking
  void registerCallerSessionWithBridge();

  // C1018 · THE C1017 WATCH IS RETIRED FROM THE BOOT PATH. It polled for the owner's death and
  // signalled the lane root — correct facts, correct guards, and it NEVER RAN: this server's own
  // 8s self-shutdown grace killed it at t+8s, mid-count, against a 15s confirmation window.
  // The teardown now lives where it cannot be pre-empted — inside selfOwnedShutdown itself, which
  // IS the moment of the event. See `signalLaneRoot()` there.
  // The model file is KEPT, unarmed: it remains the only candidate cover for an ABRUPT CLI death,
  // where the window never closes and selfOwnedShutdown therefore never fires.

  const muxiumName = 'SCP Template Server';
  const port = parseInt(process.env.PORT || '7637', 10);
  // C667 · S0b: default the reported bind to loopback (the actual server binds 127.0.0.1 via
  // server.principle HOST); the IP env escape hatch remains for a deliberate LAN-dev override.
  const ip = process.env.IP || '127.0.0.1';

  console.log(`[Huirth] Starting ${muxiumName} (PID: ${process.pid}, port: ${port}, ip: ${ip})`);

  // Define filterKeys - properties to exclude from sync entirely
  const filterKeys = [
    'lastSyncTimestamp', // Timestamp of last sync - not to be synced itself
    'lastKnownBuffer', // Internal diff calculation state - not to be synced
    'actionQue', // Action queue is server-specific
    'filterKeys', // Filter configuration is meta-property
    'clientSemaphore', // WebSocket connection state identifier
    'novelChangeHandlers', // Handler configuration is meta-property
    'webSocketClients', // Connection list is server-specific
    'stateUpdates', // Update queue is server-specific
    'specificQue', // Client-specific routing queue
    'port', // Server configuration
    'clientState', // Server state tracking
    'syncClientState', // Server configuration flag
  ];

  muxification(
    muxiumName,
    {
      huirth: createHuirthConcept({ port }, filterKeys),
      ownership: createOwnershipConcept(),
    },
    {},
  );

  console.log('[Huirth] Bridge Restart Manifold: READY');
})();
