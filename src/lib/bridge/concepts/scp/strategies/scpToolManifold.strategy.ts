/**
 * SCP Tool Manifold Strategy Creators
 *
 * Creates ActionStrategies for SCP tool execution that actualize Stratimux.
 * Tools are executed via deck dispatch, NOT standalone handler functions.
 *
 * Two Manifold Variants:
 * 1. Quality-Based: Quality as initial node → Return tail
 * 2. Strategy-Based: Strategy sequence → Return tail (zero-knowledge to SCP)
 *
 * The Fundamental Principle:
 * - SCP is an Actualization of Stratimux
 * - Same tools accessible by User (UI) and AI (SCP)
 * - Different access method, same operational means
 *
 * Citation: POC-3-MUXONOMIC-SCP-BRIDGE-TOGGLE-WORKGAMEBOARD.md
 * Citation: STRATIMUX-REFERENCE.md "🎬 ActionStrategies - Orchestrated Action Sequences"
 * Citation: hairTriggerCDRUM.strategy.ts - selectStratiDECK pattern
 */

import {
  ActionStrategy,
  Concepts,
  createActionNode,
  createStrategy,
  selectStratiDECK,
  strategySequence,
  type AnyAction,
} from 'stratimux';
import type { Response } from 'express';
import type { SCPQualityMetadataRegistered } from '../scp.types';
import type { SCPConcept } from '../scp.concept';

/**
 * Create SCP Quality Manifold - Quality as Initial Node
 *
 * Manifold Structure:
 * - [OPTIONAL HEAD] STORE NODE: scpStoreHttpResponse → stores httpResponse in
 *   pendingHttpResponses Map BEFORE the quality executes (mirrors the strategy
 *   manifold's HEAD). Prepended via strategySequence ONLY when httpResponse is
 *   supplied — i.e. when the principle drives the manifold directly (C287 W1).
 *   When httpResponse is omitted (legacy scpExecuteTool caller), the caller's
 *   own reducer stores the res, so the HEAD is skipped.
 * - QUALITY NODE (Initial): Dispatches quality via deck, produces DataField
 * - RETURN NODE (Tail): Extracts DataField, formats MCPResponse, sends
 *
 * The quality's methodCreator calls strategySuccess(strategy, strategyData_muxifyData(...))
 * which carries the DataField forward for the Return node to extract.
 *
 * Citation: hairTriggerCDRUM.strategy.ts - selectStratiDECK pattern
 * Citation: createSCPStrategyManifold - identical HEAD res-storage mechanism (C287 W1)
 *
 * @param deck - Huirth deck for selectStratiDECK access
 * @param meta - Registered tool metadata with conceptName
 * @param params - Tool parameters from SCP request
 * @param requestId - MCP request ID for response correlation
 * @param connectionId - SCP connection ID for routing
 * @param httpResponse - Express Response for manifold closure. When present, a
 *   scpStoreHttpResponse HEAD is prepended so the res is registered in
 *   pendingHttpResponses before the tail extracts it (mirrors the strategy path).
 */
export function createSCPQualityManifold(
  deck: unknown,
  meta: SCPQualityMetadataRegistered,
  params: Record<string, unknown>,
  requestId: string | number,
  connectionId: string,
  httpResponse?: Response,
): ActionStrategy | undefined {
  // Get SCP deck via selectStratiDECK
  const scpDeck = selectStratiDECK<SCPConcept>(deck, 'scp');
  if (!scpDeck) {
    console.error('[SCP Manifold] Failed to access SCP deck');
    return undefined;
  }

  // Get concept deck via selectStratiDECK using metadata conceptName
  const conceptDeck = selectStratiDECK(deck, meta.conceptName);
  if (!conceptDeck) {
    console.error(`[SCP Manifold] Failed to access ${meta.conceptName} deck`);
    return undefined;
  }

  console.log('[SCP Manifold] Creating Quality Manifold:', {
    toolName: meta.toolName,
    qualityName: meta.qualityName,
    conceptName: meta.conceptName,
    directHead: !!httpResponse,
  });

  // RETURN NODE (Tail): Extract DataField from strategy.data, format and send
  // C382 TAIL-NODE RULING: this node fires as the quality node's successNode/failureNode
  // continuation (not off the initial saturated beat) — but it is likewise un-agreemented
  // and closes the socket. Under the SAME beat pre-load class the continuation dispatch can
  // sit behind queue delay past the default 5000ms window → the socket-closing method skips
  // silently (the doctrine tell, one node later). Ruling from the strategy's shape: treat
  // identically. Mirrors gitmScpUpdate.strategy.ts:42 (the C285 terminal-relay agreement).
  const returnNode = createActionNode(
    scpDeck.e.scpExtractAndSendResponse({ requestId, connectionId }),
    {
      agreement: 30_000,
      successNotes: {
        preposition: 'Finally',
        denoter: 'SCP response extracted and sent.',
      },
    },
  );

  // QUALITY NODE (Initial): Dispatch quality via deck
  // Dynamic quality access based on qualityName
  const qualityEmitter = conceptDeck.e as Record<
    string,
    (p?: Record<string, unknown>) => AnyAction
  >;
  const qualityAction = qualityEmitter[meta.qualityName](params);

  // C382 THE MANIFOLD AGREEMENT (Action-Validity Doctrine · gitmScpUpdate.strategy.ts:42,64,86):
  // Every SCP tool rides this quality node. Un-agreemented, it inherited the default 5000ms
  // controller window. Under BEAT PRE-LOAD (the beat queue saturated BEFORE the emitter-call
  // stamp), the beat fires the node LATE → the stale controller SILENTLY skips the method (the
  // doctrine's reducer-never-runs tell). C381 live kill: the 14:34:45 send_message — the method
  // was never entered, zero bails logged. 30s: the window must EXCEED worst-case beat-queue
  // delay, NEVER the method's own runtime (the async work carries its own lifetime downstream).
  const qualityNode = createActionNode(qualityAction, {
    agreement: 30_000,
    successNode: returnNode,
    failureNode: returnNode,
    successNotes: {
      preposition: 'First',
      denoter: `${meta.toolName} quality executed;`,
    },
  });

  const qualityManifold = createStrategy({
    topic: `SCP Quality Manifold - ${meta.toolName}`,
    initialNode: qualityNode,
    data: {
      requestId,
      connectionId,
      toolName: meta.toolName,
      qualityName: meta.qualityName,
      conceptName: meta.conceptName,
      params,
      initTimestamp: Date.now(),
    },
  });

  // Legacy caller (scpExecuteTool) stores the res in its own reducer → no HEAD.
  if (!httpResponse) {
    return qualityManifold;
  }

  // C287 W1: principle-driven path — prepend the scpStoreHttpResponse HEAD via
  // strategySequence, IDENTICAL to createSCPStrategyManifold's res-storage. This
  // registers the res in pendingHttpResponses before the quality manifold's tail
  // (scpExtractAndSendResponse) reads it back and closes the socket.
  const headStrategy = createStrategy({
    topic: `SCP Quality Head - ${meta.toolName}`,
    initialNode: createActionNode(
      scpDeck.e.scpStoreHttpResponse({
        requestId,
        connectionId,
        toolName: meta.toolName,
        httpResponse,
      }),
      {
        successNotes: {
          preposition: 'First',
          denoter: 'httpResponse stored for quality manifold closure;',
        },
      },
    ),
    data: {
      requestId,
      connectionId,
      toolName: meta.toolName,
      qualityName: meta.qualityName,
      conceptName: meta.conceptName,
      params,
      initTimestamp: Date.now(),
    },
  });

  const sequenced = strategySequence([headStrategy, qualityManifold]);
  if (!sequenced) {
    console.error('[SCP Manifold] strategySequence returned undefined for quality manifold');
    return qualityManifold;
  }
  return sequenced;
}

/**
 * Create SCP Strategy Manifold - 3-Part StrategySequence Pattern
 *
 * Manifold Structure (strategySequence pattern):
 * 1. HEAD: scpStoreHttpResponse → Stores httpResponse before tool executes
 * 2. BODY: Tool Strategy → Created by meta.strategyCreator(concepts_, deck, params)
 * 3. TAIL: scpExtractAndSendResponse → Extracts DataField and sends MCP response
 *
 * Zero-Knowledge Principle:
 * - Tool strategy doesn't know about SCP
 * - Tool strategy receives standard deck + params (Stradian Interface)
 * - SCP wraps with Head (storage) and Tail (response) handling
 *
 * Citation: SUITE-0-5-6-OBSIDIAN-QUALITY-CREATION-INTERCHANGE-SPECIFICATION.md
 * Citation: STRATIMUX-REFERENCE.md "🎬 ActionStrategies - strategySequence"
 *
 * @param concepts_ - Muxium concepts (Stradian Interface - passed to strategyCreator)
 * @param deck - Huirth deck for selectStratiDECK access
 * @param meta - Registered tool metadata with strategyCreator
 * @param params - Tool parameters from SCP request
 * @param requestId - MCP request ID for response correlation
 * @param connectionId - SCP connection ID for routing
 * @param httpResponse - Express Response object for manifold closure
 */
export function createSCPStrategyManifold(
  concepts_: Concepts,
  deck: unknown,
  meta: SCPQualityMetadataRegistered,
  params: Record<string, unknown>,
  requestId: string | number,
  connectionId: string,
  httpResponse: Response,
): ActionStrategy | undefined {
  // Get SCP deck via selectStratiDECK
  const scpDeck = selectStratiDECK<SCPConcept>(deck, 'scp');
  if (!scpDeck) {
    console.error('[SCP Manifold] Failed to access SCP deck for strategy');
    return undefined;
  }

  console.log('[SCP Manifold] Creating Strategy Manifold:', {
    toolName: meta.toolName,
    strategyName: meta.strategyName,
    conceptName: meta.conceptName,
  });

  // Guard: Verify strategyCreator exists on metadata
  if (!meta.strategyCreator) {
    console.error(`[SCP Manifold] No strategyCreator on metadata for: ${meta.toolName}`);
    return createErrorStrategy(
      scpDeck,
      requestId,
      connectionId,
      `Missing strategyCreator for strategy-based tool: ${meta.toolName}`,
    );
  }

  // BODY: Create tool strategy via Stradian Interface
  // Citation: STRATIMUX-REFERENCE.md "🔧 selectStratiDECK Pattern for Strategy Creator Functions"
  const toolStrategy = meta.strategyCreator(concepts_, deck, params);
  if (!toolStrategy) {
    console.error(`[SCP Manifold] strategyCreator returned undefined for: ${meta.toolName}`);
    return createErrorStrategy(
      scpDeck,
      requestId,
      connectionId,
      `Strategy creation failed for: ${meta.toolName}`,
    );
  }

  // HEAD: Single-node strategy to store httpResponse before tool executes
  const headStrategy = createStrategy({
    topic: `SCP Strategy Head - ${meta.toolName}`,
    initialNode: createActionNode(
      scpDeck.e.scpStoreHttpResponse({
        requestId,
        connectionId,
        toolName: meta.toolName,
        httpResponse,
      }),
      {
        successNotes: {
          preposition: 'First',
          denoter: 'httpResponse stored for manifold closure;',
        },
      },
    ),
    data: {
      requestId,
      connectionId,
      toolName: meta.toolName,
      strategyName: meta.strategyName,
      conceptName: meta.conceptName,
      params,
      initTimestamp: Date.now(),
    },
  });

  // TAIL: Single-node strategy to extract DataField and send response
  // C382 TAIL-NODE RULING (strategy manifold): the strategySequence TAIL is the socket-closer
  // for the zero-knowledge strategy path — same un-agreemented scpExtractAndSendResponse leg as
  // the quality-manifold returnNode. Sequenced after the BODY, it inherits the same beat
  // pre-load exposure; agreement it identically (30s > worst-case queue delay). Mirrors
  // gitmScpUpdate.strategy.ts:42.
  const tailStrategy = createStrategy({
    topic: `SCP Strategy Tail - ${meta.toolName}`,
    initialNode: createActionNode(
      scpDeck.e.scpExtractAndSendResponse({ requestId, connectionId }),
      {
        agreement: 30_000,
        successNotes: {
          preposition: 'Finally',
          denoter: 'SCP response extracted and sent.',
        },
      },
    ),
  });

  // Chain: HEAD → BODY → TAIL via strategySequence
  // Citation: STRATIMUX-REFERENCE.md "strategySequence chains via puntedStrategy"
  const manifold = strategySequence([headStrategy, toolStrategy, tailStrategy]);

  if (!manifold) {
    console.error('[SCP Manifold] strategySequence returned undefined');
    return createErrorStrategy(
      scpDeck,
      requestId,
      connectionId,
      `Failed to compose strategy manifold for: ${meta.toolName}`,
    );
  }

  console.log('[SCP Manifold] Strategy Manifold created successfully:', {
    toolName: meta.toolName,
    strategyName: meta.strategyName,
    headTopic: headStrategy.topic,
    bodyTopic: toolStrategy.topic,
    tailTopic: tailStrategy.topic,
  });

  return manifold;
}

/**
 * Helper: Create error response strategy
 *
 * Used when strategy manifold creation fails at any point.
 */
function createErrorStrategy(
  scpDeck: ReturnType<typeof selectStratiDECK<SCPConcept>>,
  requestId: string | number,
  connectionId: string,
  message: string,
): ActionStrategy {
  return createStrategy({
    topic: `SCP Strategy Manifold Error`,
    initialNode: createActionNode(
      scpDeck!.e.scpSendResponse({
        connectionId,
        response: {
          jsonrpc: '2.0',
          id: requestId,
          error: {
            code: -32603,
            message,
          },
        },
      }),
      {
        successNotes: {
          preposition: '',
          denoter: 'Strategy manifold error sent.',
        },
      },
    ),
    data: {
      requestId,
      connectionId,
      error: message,
    },
  });
}
