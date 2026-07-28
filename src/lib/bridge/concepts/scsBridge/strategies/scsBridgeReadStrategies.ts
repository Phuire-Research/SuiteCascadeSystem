/**
 * scsBridge Read Strategies · Cycle 140 · TQDR + MSCM Implementation
 *
 * Strategy creators for informative SCP tools that read scsBridge state and
 * format read-only responses. Used by createSCPStrategyManifold (HEAD/BODY/TAIL)
 * via strategyCreator references in scsBridgeScpToolRegistration metadata.
 *
 * Two strategy creators:
 *   - createGetScpStatusStrategy : reads state.connectedScps snapshot
 *   - createGetScpLogsStrategy   : reads state.logBuffers[scpName]
 *
 * Pattern · BODY node uses a benign action (scsBridgePublishLogs with sentinel
 * scpName) whose reducer returns {} via the dual no-op guard (!scpName OR
 * !state.connectedScps[scpName]). The structural requirement is that the BODY
 * has at least one action node so strategySequence can chain HEAD → BODY → TAIL.
 * Response payload is embedded in strategy.data via strategyData_muxifyData for
 * extraction by scpExtractAndSendResponse in the TAIL.
 *
 * Citation: STRATIMUX-REFERENCE.md "🎬 ActionStrategies - Orchestrated Action Sequences"
 * Citation: STRATIMUX-REFERENCE.md "🔧 selectStratiDECK Pattern for Strategy Creator Functions"
 * Citation: STRATIMUX-REFERENCE.md "🎯 ActionStrategy Data - Universal Transformer Pattern"
 * Citation: STRATIMUX-REFERENCE.md "🎯 DECK K Constant Pattern - Reactive State Access"
 * Citation: SUITE-3-YELLOW-CYCLE-140-MSCM-TQDR-BLUEPRINT.md §3
 */

import {
  type ActionStrategy,
  type Concepts,
  createActionNode,
  createStrategy,
  selectStratiDECK,
} from 'stratimux';
import type { ScsBridgeConcept } from '../scsBridge.types';

const STRATEGY_NO_OP_SCP_NAME = '__scs_strategy_no_op__';

export function createGetScpStatusStrategy(
  _concepts_: Concepts,
  deck: unknown,
  _params: Record<string, unknown>,
): ActionStrategy | undefined {
  const scsBridgeDeck = selectStratiDECK<ScsBridgeConcept>(deck, 'scsBridge');
  if (!scsBridgeDeck) {
    console.error('[Scs Bridge Strategy] Failed to access scsBridge deck for getScpStatus');
    return undefined;
  }

  const connectedScps = scsBridgeDeck.k.connectedScps.select() ?? {};

  const responseData = {
    scps: Object.entries(connectedScps).map(([name, entry]) => ({
      scpName: name,
      scpPort: entry.scpPort,
      logEndpoint: entry.logEndpoint,
      status: entry.status,
      dockedAt: entry.dockedAt,
      lastDockedAt: entry.lastDockedAt,
    })),
    count: Object.keys(connectedScps).length,
    timestamp: Date.now(),
  };

  return createStrategy({
    topic: 'SCS Bridge Get SCP Status',
    initialNode: createActionNode(
      scsBridgeDeck.e.scsBridgePublishLogs({
        scpName: STRATEGY_NO_OP_SCP_NAME,
        logEntry: '',
        timestamp: Date.now(),
      }),
      {
        successNotes: {
          preposition: 'Then',
          denoter: 'status snapshot composed;',
        },
      },
    ),
    data: { responseData },
  });
}

export function createGetScpLogsStrategy(
  _concepts_: Concepts,
  deck: unknown,
  params: Record<string, unknown>,
): ActionStrategy | undefined {
  const scsBridgeDeck = selectStratiDECK<ScsBridgeConcept>(deck, 'scsBridge');
  if (!scsBridgeDeck) {
    console.error('[Scs Bridge Strategy] Failed to access scsBridge deck for getScpLogs');
    return undefined;
  }

  const scpName = typeof params.scpName === 'string' ? params.scpName : undefined;
  const logBuffers = scsBridgeDeck.k.logBuffers.select() ?? {};

  let responseData: Record<string, unknown>;
  if (scpName) {
    const entries = logBuffers[scpName] ?? [];
    responseData = {
      scpName,
      logs: entries.map((e) => ({ timestamp: e.timestamp, logEntry: e.logEntry })),
      count: entries.length,
      timestamp: Date.now(),
    };
  } else {
    responseData = {
      error: 'scpName parameter required',
      code: 'MISSING_PARAM',
      timestamp: Date.now(),
    };
  }

  return createStrategy({
    topic: 'SCS Bridge Get SCP Logs',
    initialNode: createActionNode(
      scsBridgeDeck.e.scsBridgePublishLogs({
        scpName: STRATEGY_NO_OP_SCP_NAME,
        logEntry: '',
        timestamp: Date.now(),
      }),
      {
        successNotes: {
          preposition: 'Then',
          denoter: 'log snapshot composed;',
        },
      },
    ),
    data: { responseData },
  });
}
