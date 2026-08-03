/**
 * scsBridge Concept · Cycle 139 · CPPP Wiring
 *
 * Top-level (Tier 1) sibling of scp + server. Owns the cross-SCP bridge state
 * (connectedScps, logBuffers, openedBrowserTabs) and contributes Bridge-management
 * tools to the SCP MCP registry via scsBridgeScpToolRegistrationPrinciple.
 *
 * Migration source: scpDockHost (Phase B.5 · Cycle 133). The 4 migrated Qualities
 * are state-only Reducer/Method composition — the HTTP transport responsibility
 * moves to server (port) + scp (express endpoints).
 *
 * Citation: SUITE-3-YELLOW-CYCLE-139-CPPP-WIRING-BLUEPRINT.md §3 + §5 Step 4
 * Citation: STRATIMUX-REFERENCE.md "Quality Creation Patterns"
 */

import { createConcept, type Concept } from 'stratimux';
import {
  scsBridgeName,
  createScsBridgeState,
  type ScsBridgeState,
  type ScsBridgeQualities,
} from './scsBridge.types';

// Quality imports (5 legacy + 3 BMTI · SAWSR-D2.A · Cycle 150)
import { scsBridgeRegisterScp } from './qualities/scsBridgeRegisterScp.quality.huirth';
import { scsBridgePublishLogs } from './qualities/scsBridgePublishLogs.quality.huirth';
import { scsBridgeUnregisterScp } from './qualities/scsBridgeUnregisterScp.quality.huirth';
import { scsBridgeOpenBrowserTab } from './qualities/scsBridgeOpenBrowserTab.quality.huirth';
import { scsBridgeLaunchScp } from './qualities/scsBridgeLaunchScp.quality.huirth';
// MB-W2 · install_scp MCP tool · install an SCP (template / local PATH / git URL)
import { scsBridgeInstallScp } from './qualities/scsBridgeInstallScp.quality.huirth';
// BMTI Qualities · MASN namespace · per Stratimuxian Scholar S10 Option B narrow
import { scsBridgeActivateScpSession } from './qualities/scsBridgeActivateScpSession.quality.huirth';
// SES · THE STOP RAIL (C632) · scp_stop · close window + SIGTERM server + FSM + status pending
import { scsBridgeStopScp } from './qualities/scsBridgeStopScp.quality.huirth';
// MD-ARC+C · SARC anor SRST · scp_archive / scp_reinstate · the vault move + ledger
import { scsBridgeArchiveScp } from './qualities/scsBridgeArchiveScp.quality.huirth';
import { scsBridgeReinstateScp } from './qualities/scsBridgeReinstateScp.quality.huirth';
// MD-ARC+C · Wave 7 · SDEL · scp_delete · PERMANENT rm + ledger removal + teardown
import { scsBridgeDeleteScp } from './qualities/scsBridgeDeleteScp.quality.huirth';
import { scsBridgeLaunchScpRuntime } from './qualities/scsBridgeLaunchScpRuntime.quality.huirth';
import { scsBridgeSpawnNewScpSession } from './qualities/scsBridgeSpawnNewScpSession.quality.huirth';
// C1-D2 · SBST · scs_spawn_suite8_session MCP tool · setSessionSuite8Name BEFORE spawn
import { scsBridgeSpawnSuite8Session } from './qualities/scsBridgeSpawnSuite8Session.quality.huirth';
// D3D · CMIA-Engage · Cycle 163 R0 · scp_engage_session MCP tool
import { scsBridgeEngageSession } from './qualities/scsBridgeEngageSession.quality.huirth';
// D3RM-E · CMIA-Focus · scp_focus_session MCP tool · ASFP primitive caller
import { scsBridgeFocusSession } from './qualities/scsBridgeFocusSession.quality.huirth';
// D3RM-G · CHAT · scp_chat_session MCP tool · PCBW writes UIMJ queue file
import { scsBridgeChatSession } from './qualities/scsBridgeChatSession.quality.huirth';
// RM-D4 · RENAME · scp_rename_session MCP tool · setSessionDisplayName (SNDF/DUAL)
import { scsBridgeRenameSession } from './qualities/scsBridgeRenameSession.quality.huirth';
// A-D3b · ARFSP · scs_set_anchor_session MCP tool · setSessionAnchor (Anchor Pattern)
import { scsBridgeSetSessionAnchor } from './qualities/scsBridgeSetSessionAnchor.quality.huirth';
// SAC.1 · ARFSP · scs_unset_anchor_session MCP tool · unsetSessionAnchor (Anchor Pattern · release)
import { scsBridgeUnsetSessionAnchor } from './qualities/scsBridgeUnsetSessionAnchor.quality.huirth';
// SAC.3 · scs_set_anchor_config MCP tool · writeAnchorOverride (per-page USER OVERRIDE)
import { scsBridgeSetAnchorConfig } from './qualities/scsBridgeSetAnchorConfig.quality.huirth';
// SAC.3 · scs_reset_anchor_config MCP tool · deleteAnchorOverride (revert to menu-creator default)
import { scsBridgeResetAnchorConfig } from './qualities/scsBridgeResetAnchorConfig.quality.huirth';
// VS · DSST · scs_dissipate_session MCP tool · dissipateSession (S4 H2 anchor-guarded)
import { scsBridgeDissipateSession } from './qualities/scsBridgeDissipateSession.quality.huirth';
// CWDC · scs_close_wait_dissipate MCP tool · CLOSE→WAIT→dissipateSession→SDTC (S4 H2 anchor-guarded)
import { scsBridgeCloseWaitDissipate } from './qualities/scsBridgeCloseWaitDissipate.quality.huirth';
// ARST · scs_archive_session MCP tool · archiveSession (move real → Cascades/Archive · S4 H2)
import { scsBridgeArchiveSession } from './qualities/scsBridgeArchiveSession.quality.huirth';
// VS · VSDT · scs_deliver_vermillion MCP tool · SCS:Vermillion via dispatchFkisMessage
import { scsBridgeDeliverVermillion } from './qualities/scsBridgeDeliverVermillion.quality.huirth';
// D3 FKIS · send_message MCP tool · live keystroke streaming via FORF
import { scsBridgeSendMessage } from './qualities/scsBridgeSendMessage.quality.huirth';
// SCSER intake · SAWSR-D2.B Cycle 153 · debounced 500ms
import { scsBridgeBindCallerSessionToScp } from './qualities/scsBridgeBindCallerSessionToScp.quality.huirth';
// S8P-SCP-TOOL · suite8_page_create MCP tool · runSuite8PageCreate SVLF model for the calling SCP
import { scsBridgeSuite8PageCreate } from './qualities/scsBridgeSuite8PageCreate.quality.huirth';
// PP-D2 · PPLD · Cycle 160 · MCP Pong handler · stateless · bridge.json write (Option β)
import { scsBridgePingPong } from './qualities/bridgePingPong.quality.huirth';
// DIAGNOSTIC-REENGAGED R2 · TSPK · scs_persist_last_turn MCP tool · Single-Writer batch persist
import { scsBridgePersistLastTurn } from './qualities/scsBridgePersistLastTurn.quality.huirth';
// ASDR · BWRF · scs_focus_bridge_window MCP tool · CSSP focus-url relay → focusUrlWindow
import { scsBridgeFocusUrlWindow } from './qualities/scsBridgeFocusUrlWindow.quality.huirth';
import { scsBridgeFocusSuite8Page } from './qualities/scsBridgeFocusSuite8Page.quality.huirth';
import { scsBridgeAlertTurnOver } from './qualities/scsBridgeAlertTurnOver.quality.huirth';
import { scsBridgeQueryHoldings } from './qualities/scsBridgeQueryHoldings.quality.huirth';
import { scsBridgeInstallProgress } from './qualities/scsBridgeInstallProgress.quality.huirth';
// D-N3 · Neon PlayTester · scs_orchestrate_window MCP tool · CSSP orchestrate-window round-trip
import { scsBridgeOrchestrateWindow } from './qualities/scsBridgeOrchestrateWindow.quality.huirth';
// D-N2 · Neon PlayTester · scs_render_capture MCP tool · streamed pre-shader frame anor capturePage
import { scsBridgeRenderCapture } from './qualities/scsBridgeRenderCapture.quality.huirth';
// SBMRQ · D1 Focused-Blocking Core · message relay queue (enqueue + Focus relay + unblock)
import { scsBridgeRelayEnqueue } from './qualities/scsBridgeRelayEnqueue.quality.huirth';
import { scsBridgeRelayFocus } from './qualities/scsBridgeRelayFocus.quality.huirth';
import { scsBridgeRelayUnblock } from './qualities/scsBridgeRelayUnblock.quality.huirth';
// SBMRQ · D3 relay set · send-message + resize (RRRRQ) relays
import { scsBridgeRelaySendMessage } from './qualities/scsBridgeRelaySendMessage.quality.huirth';
import { scsBridgeRelayResize } from './qualities/scsBridgeRelayResize.quality.huirth';
import { scsBridgeRelaySpawn } from './qualities/scsBridgeRelaySpawn.quality.huirth';
// MVP-RC3 Build B · ENQUEUE-BATCH · scs_relay_enqueue MCP tool · builds relay Actions
// server-side from JSON-safe specs then dispatches scsBridgeRelayEnqueue (deck-deferral).
import { scsBridgeEnqueueRelayBatch } from './qualities/scsBridgeEnqueueRelayBatch.quality.huirth';

// Principle imports (2 + RQPOAD drainer)
import { scsBridgeScpToolRegistrationPrinciple } from './principles/scsBridgeScpToolRegistration.principle.huirth';
// SEAP · SE · extends the bridge Express server with the /sessionArchive on-demand endpoint
import { scsBridgeSessionArchiveEndpointPrinciple } from './principles/scsBridgeSessionArchiveEndpoint.principle.huirth';
// SEAP · BOOT-STREAM · extends the bridge Express server with the /scp-boot-log/:scpName tail endpoint
import { scsBridgeBootLogEndpointPrinciple } from './principles/scsBridgeBootLogEndpoint.principle.huirth';
// SEAP · SSP D-SSP.1 · extends the bridge Express server with the /suite8/available roster endpoint
import { suite8PickerEndpointPrinciple } from './principles/suite8PickerEndpoint.principle.huirth';
// SEAP · SAC.3 · extends the bridge Express server with the /suite8/anchor-config read endpoint
import { anchorConfigEndpointPrinciple } from './principles/anchorConfigEndpoint.principle.huirth';
// RQPOAD · SBMRQ · pure selector-driven drainer of messageRelayQue (D1 Focused-Blocking Core)
import { scsBridgeRelayQueuePrinciple } from './principles/scsBridgeRelayQueue.principle.huirth';

export { scsBridgeName };

export type ScsBridgeConcept = Concept<ScsBridgeState, ScsBridgeQualities>;

export type ScsBridgeDeck = {
  scsBridge: ScsBridgeConcept;
};

export type CreateScsBridgeConceptOptions = {
  userCwd: string;
};

export const createScsBridgeConcept = (options: CreateScsBridgeConceptOptions) =>
  createConcept(
    scsBridgeName,
    createScsBridgeState(options.userCwd),
    {
      scsBridgeRegisterScp,
      scsBridgePublishLogs,
      scsBridgeUnregisterScp,
      scsBridgeOpenBrowserTab,
      scsBridgeLaunchScp,
      scsBridgeInstallScp,
      scsBridgeActivateScpSession,
      // SES · THE STOP RAIL (C632) · TQNI key matches `type:` 'Scs Bridge Stop Scp'
      scsBridgeStopScp,
      // MD-ARC+C · SARC anor SRST anor SDEL · TQNI keys match their `type:` strings
      scsBridgeArchiveScp,
      scsBridgeReinstateScp,
      // MD-ARC+C · Wave 7 · SDEL · scp_delete · PERMANENT · TQNI 'Scs Bridge Delete Scp'
      scsBridgeDeleteScp,
      scsBridgeLaunchScpRuntime,
      scsBridgeSpawnNewScpSession,
      scsBridgeSpawnSuite8Session,
      scsBridgeEngageSession,
      scsBridgeFocusSession,
      scsBridgeChatSession,
      scsBridgeRenameSession,
      scsBridgeSetSessionAnchor,
      scsBridgeUnsetSessionAnchor,
      scsBridgeSetAnchorConfig,
      scsBridgeResetAnchorConfig,
      scsBridgeDissipateSession,
      scsBridgeCloseWaitDissipate,
      scsBridgeArchiveSession,
      scsBridgeDeliverVermillion,
      scsBridgeSendMessage,
      scsBridgeBindCallerSessionToScp,
      // S8P-SCP-TOOL · TQNI key matches `type:` 'Scs Bridge Suite8 Page Create'
      scsBridgeSuite8PageCreate,
      scsBridgePingPong,
      scsBridgePersistLastTurn,
      scsBridgeFocusUrlWindow,
      scsBridgeFocusSuite8Page,
      scsBridgeAlertTurnOver,
      scsBridgeQueryHoldings,
      scsBridgeInstallProgress,
      // D-N3 · Neon PlayTester · TQNI key matches `type:` 'Scs Bridge Orchestrate Window'
      scsBridgeOrchestrateWindow,
      // D-N2 · Neon PlayTester · TQNI key matches `type:` 'Scs Bridge Render Capture'
      scsBridgeRenderCapture,
      // SBMRQ · D1 Focused-Blocking Core · TQNI keys match relay quality `type:` literals
      scsBridgeRelayEnqueue,
      scsBridgeRelayFocus,
      scsBridgeRelayUnblock,
      // SBMRQ · D3 relay set · TQNI keys match relay quality `type:` literals
      scsBridgeRelaySendMessage,
      scsBridgeRelayResize,
      scsBridgeRelaySpawn,
      // MVP-RC3 Build B · ENQUEUE-BATCH · TQNI key matches `type:` 'Scs Bridge Enqueue Relay Batch'
      scsBridgeEnqueueRelayBatch,
    },
    [
      scsBridgeScpToolRegistrationPrinciple,
      scsBridgeSessionArchiveEndpointPrinciple,
      scsBridgeBootLogEndpointPrinciple,
      suite8PickerEndpointPrinciple,
      anchorConfigEndpointPrinciple,
      scsBridgeRelayQueuePrinciple,
    ],
  );
