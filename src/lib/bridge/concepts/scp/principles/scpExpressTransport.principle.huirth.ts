/**
 * scpExpressTransport - HTTP Transport Principle
 *
 * Stage 2 Cobalt - Express HTTP Transport for SCP
 *
 * Citation: STRATIMUX-REFERENCE.md - Critical Planning Context Patterns (lines 463-608)
 * Pattern: Principle with external event integration via observer.next()
 *
 * Purpose:
 * - Add /mcp endpoint to existing Express server
 * - Handle JSON-RPC 2.0 over HTTP (separates debug logs from protocol)
 * - Session management for stateful connections
 * - Register Huirth HiFi tools on startup
 *
 * Key Benefit:
 * - console.log() goes to Express stdout (debug)
 * - Protocol messages flow over HTTP (clean channel separation)
 */

import type { Request, Response } from 'express';
import type { Response as ExpressResponse } from 'express';
import type { PrincipleFunction, MuxiumDeck, AnyAction, Deck } from 'stratimux';
// RM-D3 · ATID/PRMX single-writers + ulid resolution source.
import { updateSessionToolState, clearSessionToolState, listSessions } from '../../../registry';
// PSTK · THE AUTO GATE + THE RULE STORE. matchesStoredRule gates auto-approval at the
// handler; extractAllowRules + persistPermissionRules back the "Allow & don't ask" path.
import { matchesStoredRule, persistPermissionRules, extractAllowRules } from '../../../permissionRuleStore';
import { getActiveBridgePort } from '../../../activeBridgePort.model';
import { log } from '../../../debugLog';
import { strategyBegin, strategySequence, createStrategy, createActionNode } from 'stratimux';
import type { SCPQualities, SCPDeck } from '../scp.concept';
import type { SCPState, MCPRequest, MCPResponse } from '../scp.types';
import type { ServerDeck, ServerState } from '../../server/server.concept';
import {
  createInitializeResponse,
  createToolsListResponse,
  createErrorResponse,
  MCP_ERRORS,
} from '../model/scp.protocol';
import { randomUUID } from 'crypto';
import { scpMuxonomyRegistry } from '../scpMuxonomyRegistry';
import type { SCPQualityMetadataRegistered, SCPToolDefinition } from '../scp.types';
import { createSCPStrategyManifold, createSCPQualityManifold } from '../strategies/scpToolManifold.strategy';
import e from 'express';
import { ScsBridgeDeck } from '../../scsBridge/scsBridge.concept';

export type ExpressTransportDeck = Deck<MuxiumDeck & SCPDeck & ServerDeck & ScsBridgeDeck>;

let scpState: SCPState;

// Session storage for stateful connections
const sessions: Record<string, { createdAt: number; lastActivity: number }> = {};

// ============================================================================
// RM-D3 · HBLR · Hook-Blocking-Long-Response + selective relay primitives.
// ============================================================================
//
// Holds the Express res for in-flight PermissionRequests until the user's decision
// arrives via Direction C. Keyed by `ulid` — PermissionRequest does NOT carry
// `tool_use_id` (canary-confirmed).
//
// PSTK · THE OVERWRITE-SEAM DIES. The old Map<string, HeldPermission> held ONE res
// per ulid; a second PermissionRequest landing while the first was held OVERWROTE the
// first's res (its Express connection abandoned, CC hung until the 595s drain). That
// single-pending assumption was the seam. The Map now holds a FIFO QUEUE per ulid —
// landings PUSH (never overwrite), the head answers first, items 1..N-1 wait their
// turn in landing order (the CLI's own ordering is authoritative). The Map lives
// OUTSIDE the Stratimux action loop (module scope · NOT state) so holding the res does
// not risk halting-protection (R1 risk #1).
type HeldPermission = {
  res: ExpressResponse;
  ulid: string;
  requestId: string; // PSTK · Bridge-minted perm-<ulid-suffix>-<counter> · queue item identity end-to-end
  toolName: string;
  input: string; // PSTK · <=120-char summary · mirrored to the entry on every queue change
  suggestions: unknown; // PSTK · RAW permission_suggestions · needed for the persistRule store write
  suggestionsCompact: string | undefined; // PSTK · DPOB compact JSON · what the buttons parse
  timer: ReturnType<typeof setTimeout>;
  landedAt: number; // PSTK · Date.now() ms epoch · FIFO order key
};
const heldPermissions = new Map<string, HeldPermission[]>();

// RM-D3 · the held-res Map key is the ulid alone (note 1). Helper kept for
// call-site clarity; identity function by design.
const heldKey = (ulid: string): string => ulid;

// PSTK · the Bridge-minted requestId counter. No tool_use_id exists on PermissionRequest,
// so each landing is minted its own identity: perm-<ulid-suffix>-<counter>. Monotonic per
// process (the process-memory Map is the only consumer; it resets with the Bridge — as
// does the queue). The suffix disambiguates across sessions in the same process log.
let permissionRequestCounter = 0;
function mintPermissionRequestId(ulid: string): string {
  permissionRequestCounter += 1;
  const suffix = ulid.slice(-6);
  return `perm-${suffix}-${permissionRequestCounter}`;
}

// RM-D3 · PRMX exclusion-set (note 2). The Bridge relays EVERY gated tool to the
// decision popup EXCEPT those in this set. AskUserQuestion (and any unrecognized
// tool, handled separately) MUST surface natively → FSSF Focus-card. The canary
// proved a blind allow auto-dismisses AskUserQuestion; this set is the guard.
// Exclusion-set (not allow-list) is future-proof: new gating tools auto-relay.
const NON_RELAYABLE_TOOLS = new Set(['AskUserQuestion']);

// RM-D3 · the tools the Bridge recognizes as relayable gated tools. A tool NOT
// in this set AND not in NON_RELAYABLE_TOOLS is "unknown" → FSSF (safety-first,
// surfaces natively). This is the recognized-tool check (note 2), distinct from
// the exclusion-set above.
const KNOWN_TOOLS = new Set([
  'Bash', 'Edit', 'Write', 'Read', 'WebFetch', 'WebSearch',
  'NotebookEdit', 'MultiEdit', 'Glob', 'Grep', 'Task', 'TodoWrite',
  'BashOutput', 'KillShell', 'AskUserQuestion',
]);

// PSTK · the resolved queue item + the still-held tail, returned to the caller so it can
// mirror the new head + optionally persist the resolved item's allow-rules.
type ResolveResult = { resolved: HeldPermission; remaining: HeldPermission[] } | null;

// PSTK · queue drain — resolve ONE held permission with a decision (or default-deny on
// timeout). Selects the queue item by requestId; an EMPTY requestId resolves the HEAD
// (back-compat for the legacy single-pending Direction C shape). Answers ITS res, clears
// ITS timer, removes it from the queue. Empty queue after removal → deletes the Map key.
// Returns the resolved item + the surviving tail (null when nothing matched — idempotent).
function resolveHeldPermission(
  ulid: string,
  decision: { behavior: 'allow' | 'deny' },
  requestId?: string,
): ResolveResult {
  const queue = heldPermissions.get(heldKey(ulid));
  if (!queue || queue.length === 0) return null;
  // Empty/absent requestId → the head (landing-order first). Else find the exact item.
  const idx = requestId
    ? queue.findIndex((h) => h.requestId === requestId)
    : 0;
  if (idx < 0) return null;
  const [held] = queue.splice(idx, 1);
  clearTimeout(held.timer);
  if (queue.length === 0) heldPermissions.delete(heldKey(ulid));
  try {
    held.res.json({
      hookSpecificOutput: {
        hookEventName: 'PermissionRequest',
        decision,
      },
    });
  } catch (err) {
    console.error('[SCP Hooks] resolveHeldPermission · res.json failed', err);
  }
  return { resolved: held, remaining: queue };
}

// PSTK · THE MIRROR. On every queue change (push · resolve · drain) write BOTH the full
// pendingPermissions array AND the HEAD's values into the legacy PRMX scalars so every
// existing consumer keeps working untouched. Empty queue → permissionPending:false + the
// scalars + array cleared. The head IS the legacy scalar view; items 1..N-1 are the strip.
async function mirrorPermissionQueue(ulid: string, queue: HeldPermission[]): Promise<void> {
  if (queue.length === 0) {
    await updateSessionToolState(ulid, {
      permissionPending: false,
      pendingPermissionTool: undefined,
      pendingPermissionInput: undefined,
      pendingPermissionRequestId: undefined,
      permissionSuggestions: undefined,
      pendingPermissions: [],
    });
    return;
  }
  const head = queue[0];
  await updateSessionToolState(ulid, {
    permissionPending: true,
    pendingPermissionTool: head.toolName,
    pendingPermissionInput: head.input,
    pendingPermissionRequestId: head.requestId,
    permissionSuggestions: head.suggestionsCompact,
    pendingPermissions: queue.map((h) => ({
      requestId: h.requestId,
      tool: h.toolName,
      input: h.input,
      suggestions: h.suggestionsCompact,
      landedAt: h.landedAt,
    })),
  });
}

// RM-D3 · resolve the Bridge ULID from a hook payload. The hook carries Claude's
// session_id (= entry.claudeSessionId) and cwd. Prefer claudeSessionId; fall
// back to cwd ONLY when a single launched session matches (note 3: ambiguous
// multi-session-same-cwd → return null, never pick arbitrarily). Returns null if
// no entry matches (graceful: ATID just no-ops).
async function resolveUlidFromHook(payload: { session_id?: string; cwd?: string }): Promise<string | null> {
  const all = await listSessions();
  if (payload.session_id) {
    const byClaude = all.find((s) => s.claudeSessionId === payload.session_id);
    if (byClaude) return byClaude.id;
  }
  if (payload.cwd) {
    const byCwd = all.filter((s) => s.cwd === payload.cwd && s.status === 'launched');
    if (byCwd.length === 1) return byCwd[0].id;
    // ambiguous (0 or >1 launched in this cwd) → graceful no-op (note 3).
  }
  return null;
}

// RM-D3 · transmission-size guard. Produce a <=120-char readable summary of
// tool_input for the ATID chip. Bash → command; Read/Write/Edit → file_path;
// WebFetch → url; else → a truncated JSON. NEVER ship the full input on the entry.
function summarizeToolInput(input: unknown): string {
  if (!input || typeof input !== 'object') return '';
  const o = input as Record<string, unknown>;
  const pick =
    (typeof o.command === 'string' && o.command) ||
    (typeof o.file_path === 'string' && o.file_path) ||
    (typeof o.url === 'string' && o.url) ||
    (typeof o.path === 'string' && o.path) ||
    (typeof o.pattern === 'string' && o.pattern) ||
    JSON.stringify(o);
  return String(pick).slice(0, 120);
}

// RM-D3 · DPOB source. Compact permission_suggestions to a small JSON string for
// the entry (transmission-size guard). Extract only what the buttons need: a
// label (ruleContent) + behavior per rule. The Vue side parses this back.
// Shape (canary-proven): [{type:"addRules", destination, rules:[{toolName,
// ruleContent}], behavior}].
function compactSuggestions(suggestions: unknown): string | undefined {
  if (!Array.isArray(suggestions) || suggestions.length === 0) return undefined;
  const compact = suggestions.flatMap((s: any) =>
    (Array.isArray(s?.rules) ? s.rules : []).map((r: any) => ({
      label: (typeof r?.ruleContent === 'string' && r.ruleContent) ||
             (typeof r?.toolName === 'string' && r.toolName) || 'allow',
      behavior: s?.behavior === 'deny' ? 'deny' : 'allow',
    })),
  ).slice(0, 4); // cap at 4 buttons
  return compact.length ? JSON.stringify(compact) : undefined;
}

/**
 * Create tool call response
 */
const createToolCallResponse = (requestId: string | number, result: unknown): MCPResponse => ({
  jsonrpc: '2.0',
  id: requestId,
  result: {
    content: [{ type: 'text', text: typeof result === 'string' ? result : JSON.stringify(result) }],
  },
});

export const scpExpressTransportPrinciple: PrincipleFunction<
  SCPQualities,
  ExpressTransportDeck,
  SCPState
> = ({ plan, d_, k_, observer, concepts_ }) => {
  // Get Express server from huirth/server state
  // Access via concepts_ since server is muxified into huirth
  const getExpressServer = () => {
    console.log('Testing', 'This Hits', d_.muxium.d.server.k.server);
    const server: e.Application = d_.muxium.d.server.k.server.select();
    // The server is at the root level due to muxification
    return server;
  };

  const expressApp = getExpressServer();

  if (!expressApp) {
    console.error('[SCP Express] No Express server found in state');
    return;
  }

  // Add JSON body parser for /mcp endpoint
  expressApp.use('/mcp', (req: Request, _res: Response, next) => {
    if (req.method === 'POST') {
      let body = '';
      req.on('data', (chunk) => {
        body += chunk;
      });
      req.on('end', () => {
        try {
          (req as any).body = JSON.parse(body);
        } catch {
          (req as any).body = null;
        }
        next();
      });
    } else {
      next();
    }
  });

  // MCP HTTP endpoint
  expressApp.post('/mcp', async (req: Request, res: Response) => {
    const sessionId = req.headers['mcp-session-id'] as string | undefined;
    const body = (req as any).body as MCPRequest | null;

    console.log('[SCP Express] Received request:', body?.method || 'unknown');

    if (!body) {
      res.status(400).json(createErrorResponse(0, MCP_ERRORS.PARSE_ERROR, 'Invalid JSON'));
      return;
    }

    // Session management
    let currentSessionId = sessionId;
    if (!currentSessionId) {
      currentSessionId = randomUUID();
      sessions[currentSessionId] = { createdAt: Date.now(), lastActivity: Date.now() };
    } else if (sessions[currentSessionId]) {
      sessions[currentSessionId].lastActivity = Date.now();
    }

    // Set session header in response
    res.setHeader('mcp-session-id', currentSessionId);

    // C287 W2 · INLINE THE STATE READ: read SCP state FRESH at request entry via
    // k_.getState(concepts_) instead of the module-level beat-30 snapshot (`scpState`),
    // which captured a stale registry/Map. The whole request path below reads
    // liveScpState — the live registry + live pendingHttpResponses Map. The module
    // `scpState` (beat-30 Stage-3 sync) is no longer read on the request path.
    // C287-b (the 083 empty-registry regression): k_.getState(concepts_) reads the BOOT
      // snapshot — concepts_ is frozen at principle start, BEFORE tool registration; every
      // lookup (list + call) missed. The Stage-3 beat-30 module scpState receives FRESH
      // concepts per fire and IS the live source — prefer it; boot-read only pre-Stage-3.
      const liveScpState = scpState ?? (k_.getState(concepts_) as unknown as SCPState);

    // Guard: Ensure SCP state is initialized (same 503 shape as before)
    if (!liveScpState) {
      res
        .status(503)
        .json(
          createErrorResponse(
            body.id,
            MCP_ERRORS.INTERNAL_ERROR,
            'Server initializing, please retry',
          ),
        );
      return;
    }

    // Handle different methods
    switch (body.method) {
      case 'initialize': {
        console.log('[SCP Express] Initialize request from:', body.params?.clientInfo);

        const initResponse = createInitializeResponse(
          body.id,
          liveScpState.serverInfo,
          liveScpState.capabilities,
        );

        // Dispatch connection opened via observer (includes initResponse for state tracking)
        const action = d_.scp.e.scpConnectionOpened({
          connectionId: currentSessionId,
          clientName: (body.params?.clientInfo as any)?.name || 'unknown',
          clientVersion: (body.params?.clientInfo as any)?.version || '0.0.0',
          protocolVersion: (body.params?.protocolVersion as string) || '2024-11-05',
          initResponse,
        });
        observer.next(action as AnyAction);

        // Send response directly via HTTP (not via responseQueue)
        res.json(initResponse);
        return;
      }

      case 'notifications/initialized': {
        console.log('[SCP Express] Client initialized');
        res.status(204).send();
        return;
      }

      case 'tools/list': {
        console.log('[SCP Express] Tools list request');
        const response = createToolsListResponse(body.id, liveScpState.tools);
        res.json(response);
        return;
      }

      case 'tools/call': {
        const toolName = (body.params?.name as string) || '';
        const toolArgs = (body.params?.arguments as Record<string, unknown>) || {};

        console.log('[SCP Express] Tool call:', toolName, toolArgs);
        console.log('[SCS-Bridge MCP-IN] POST /mcp · method=', body.method, '· tool=', toolName, '· args=', JSON.stringify(toolArgs));
        // DIAGNOSTIC (045 · prune after the turn-over Lambda) — MCP RECEIPT signal. File-captured to
        // debug.json so a single install bisects the turn-over: this present + gitm.turnover.invoked
        // present ⇒ works; this present + invoked ABSENT ⇒ the manifold didn't dispatch the quality;
        // this present + 'mcp.toolcall.notfound' ⇒ the gitm tool is unregistered on the bridge; this
        // ABSENT for the turn-over ⇒ the CLIENT never fetched (endpoint/button/fetch-fail). The client
        // console is NOT file-captured (electron-debug.json is empty), so this is the only client→bridge
        // arrival witness we get.
        log('mcp.toolcall.received', { tool: toolName });

        const tool = liveScpState.tools[toolName];
        if (!tool) {
          log('mcp.toolcall.notfound', { tool: toolName });
          res.json(
            createErrorResponse(
              body.id,
              MCP_ERRORS.METHOD_NOT_FOUND,
              `Tool not found: ${toolName}`,
            ),
          );
          return;
        }

        // C853 · THE scpName->designation ALIAS NORMALIZATION — the scp tool family's
        // naming coherence (only fills an ABSENT designation; never overwrites).
        if (toolArgs.designation === undefined && typeof toolArgs.scpName === 'string') {
          toolArgs.designation = toolArgs.scpName;
        }

        // C853 · THE REQUIRED-ARGS GATE — a missing required argument returns the honest
        // -32602 NAMING the field(s), NEVER a clean {} ACK (the RunThrough T3 wound:
        // install_scp with the wrong arg name ACKed {} while the quality silently
        // skipped — the ACK contract is now true by construction: {} = dispatched).
        const requiredArgs = ((tool as { inputSchema?: { required?: string[] } }).inputSchema?.required) ?? [];
        const missingArgs = requiredArgs.filter(
          (k) => toolArgs[k] === undefined || toolArgs[k] === null || toolArgs[k] === '',
        );
        if (missingArgs.length > 0) {
          log('mcp.toolcall.invalid-params', { tool: toolName, missing: missingArgs });
          res.json(
            createErrorResponse(
              body.id,
              MCP_ERRORS.INVALID_PARAMS,
              `Missing required argument(s) for ${toolName}: ${missingArgs.join(', ')}`,
            ),
          );
          return;
        }

        // Check for metadata-registered tool (manifold execution path)
        const toolMeta = liveScpState.toolMetadataRegistry[toolName];

        if (toolMeta) {
          // MANIFOLD PATH: Route based on strategyCreator presence
          // Citation: POC-2-3B-SCP-FORWARD-PASS-SUITE-6.md - Tier 1.8

          if (toolMeta.strategyCreator) {
            // STRATEGY-BASED: Create manifold directly and engage via strategyBegin
            // Citation: SUITE-0-5-6-OBSIDIAN-SCP-BRIDGE-MANIFOLD-SPECIFICATION.md
            console.log('[SCP Express] Strategy manifold execution for:', toolName);

            const manifold = createSCPStrategyManifold(
              concepts_,
              d_,
              toolMeta,
              toolArgs,
              body.id,
              currentSessionId,
              res,
            );

            if (manifold) {
              // Engage strategy via strategyBegin dispatched through observer
              const strategyAction = strategyBegin(manifold);
              observer.next(strategyAction as AnyAction);
              return; // Response sent by scpExtractAndSendResponse in tail
            } else {
              console.error('[SCP Express] Failed to create strategy manifold for:', toolName);
              res.json(
                createErrorResponse(
                  body.id,
                  MCP_ERRORS.INTERNAL_ERROR,
                  `Failed to create strategy manifold: ${toolName}`,
                ),
              );
              return;
            }
          }

          // QUALITY-BASED: Create quality manifold directly and engage via strategyBegin.
          // C287 W1 · UNIFY THE QUALITY PATH: mirror the strategy branch exactly —
          // construct the manifold IN THE PRINCIPLE (createSCPQualityManifold, the same
          // constructor the quality uses) and dispatch strategyBegin directly. The res is
          // registered by the manifold's prepended scpStoreHttpResponse HEAD (httpResponse
          // arg), IDENTICAL to the strategy path's res-storage. The scpExecuteTool dispatch
          // (whose method-returned strategyBegin did not carry the response tail →
          // scpExtractAndSendResponse never fired → HTTP 000) is retired from this branch.
          // The scpExecuteTool quality stays registered for any other callers.
          // Citation: SUITE-0-5-6-OBSIDIAN-SCP-BRIDGE-MANIFOLD-SPECIFICATION.md
          console.log('[SCP Express] Quality manifold execution for:', toolName);

          const qualityManifold = createSCPQualityManifold(
            d_,
            toolMeta,
            toolArgs,
            body.id,
            currentSessionId,
            res,
          );

          if (qualityManifold) {
            // Engage quality manifold via strategyBegin dispatched through observer —
            // mirrors the strategy branch. Response sent by scpExtractAndSendResponse tail.
            const qualityAction = strategyBegin(qualityManifold);
            observer.next(qualityAction as AnyAction);
          } else {
            console.error('[SCP Express] Failed to create quality manifold for:', toolName);
            res.json(
              createErrorResponse(
                body.id,
                MCP_ERRORS.INTERNAL_ERROR,
                `Failed to create quality manifold: ${toolName}`,
              ),
            );
            return;
          }
          // C285 (the 080 hanging-curl finding) · C287 W3: the deferred-response pattern
          // holds the socket until scpExtractAndSendResponse fires from the strategy TAIL — a
          // stalled strategy anor a leaked requestId held a timeout-less client FOREVER. Bounded
          // guard now guards the UNIFIED quality path: if no response has been sent within 30s,
          // close with an error JSON so every caller unblocks.
          setTimeout(() => {
            if (!res.headersSent) {
              res.json(
                createErrorResponse(body.id, MCP_ERRORS.INTERNAL_ERROR, 'Tool response timeout (30s)'),
              );
            }
          }, 30_000);
          return; // Response sent by scpExtractAndSendResponse (anor the 30s guard above)
        }

        // LEGACY PATH: Direct handler execution (no metadata)
        try {
          const result = tool.handler(toolArgs);
          res.json(createToolCallResponse(body.id, result));
        } catch (err) {
          console.error('[SCP Express] Tool execution error:', err);
          res.json(createErrorResponse(body.id, MCP_ERRORS.INTERNAL_ERROR, String(err)));
        }
        return;
      }

      case 'ping': {
        res.json({ jsonrpc: '2.0', id: body.id, result: {} });
        return;
      }

      default: {
        console.log('[SCP Express] Unknown method:', body.method);
        res.json(
          createErrorResponse(
            body.id,
            MCP_ERRORS.METHOD_NOT_FOUND,
            `Unknown method: ${body.method}`,
          ),
        );
        return;
      }
    }
  });

  // GET endpoint for SSE streaming (future use)
  expressApp.get('/mcp', (_req: Request, res: Response) => {
    res.status(405).json({ error: 'Method not allowed. Use POST for requests.' });
  });

  // ==========================================================================
  // RM-D3 · ATID/PRMX hook routes + Direction-C decision route.
  // ==========================================================================

  // B.0 · body parser scoped to /hooks (mirror of the /mcp parser at L79).
  expressApp.use('/hooks', (req: Request, _res: Response, next) => {
    if (req.method === 'POST') {
      let body = '';
      req.on('data', (chunk) => {
        body += chunk;
      });
      req.on('end', () => {
        try {
          (req as any).body = JSON.parse(body);
        } catch {
          (req as any).body = null;
        }
        next();
      });
    } else {
      next();
    }
  });

  // C.1 · body parser scoped to /session (Direction C decision POST).
  expressApp.use('/session', (req: Request, _res: Response, next) => {
    if (req.method === 'POST') {
      let body = '';
      req.on('data', (chunk) => {
        body += chunk;
      });
      req.on('end', () => {
        try {
          (req as any).body = JSON.parse(body);
        } catch {
          (req as any).body = null;
        }
        next();
      });
    } else {
      next();
    }
  });

  // B.4 · POST /hooks/pre-tool-use — ATID prime (INSTANT, non-blocking).
  expressApp.post('/hooks/pre-tool-use', async (req: Request, res: Response) => {
    const p = (req as any).body ?? {};
    // ATID: respond INSTANTLY first — never block a tool on the informative path.
    // Empty {} = "no opinion, let the permission system proceed" (canary-proven).
    res.json({});
    try {
      const ulid = await resolveUlidFromHook(p);
      if (!ulid) return;
      const toolName: string = typeof p.tool_name === 'string' ? p.tool_name : '';
      // AskUserQuestion / unrecognized tool → set the Focus-card flag (one flag
      // covers BOTH · note 5) instead of a tool chip.
      const isAsk = NON_RELAYABLE_TOOLS.has(toolName);
      const isUnknown = !isAsk && !KNOWN_TOOLS.has(toolName);
      await updateSessionToolState(ulid, {
        activeTool: toolName,
        activeToolInput: summarizeToolInput(p.tool_input),
        askUserQuestionPending: isAsk || isUnknown ? true : undefined,
        lastTool: toolName,
        lastToolAt: Date.now(),
      });
      console.log('[SCP Hooks] pre-tool-use · ulid=', ulid, '· tool=', toolName, '· ask/unknown=', isAsk || isUnknown);
    } catch (err) {
      console.error('[SCP Hooks] pre-tool-use error', err);
    }
  });

  // B.5 · POST /hooks/post-tool-use — ATID clear (INSTANT).
  expressApp.post('/hooks/post-tool-use', async (req: Request, res: Response) => {
    const p = (req as any).body ?? {};
    res.json({}); // instant, non-blocking
    try {
      const ulid = await resolveUlidFromHook(p);
      if (!ulid) return;
      // Clear the ATID chip + the Focus-card flag. Permission fields are cleared
      // by Direction C (B.7); PostTool also clears them defensively in case a
      // permission resolved out-of-band (timeout/native).
      await clearSessionToolState(ulid);
      console.log('[SCP Hooks] post-tool-use · ulid=', ulid, '· cleared');
    } catch (err) {
      console.error('[SCP Hooks] post-tool-use error', err);
    }
  });

  // B.7 · POST /hooks/permission-request — SELECTIVE (the crux).
  expressApp.post('/hooks/permission-request', async (req: Request, res: Response) => {
    const p = (req as any).body ?? {};
    let ulid: string | null = null;
    try {
      ulid = await resolveUlidFromHook(p);
    } catch (err) {
      console.error('[SCP Hooks] permission-request resolveUlid error', err);
    }
    const toolName: string = typeof p.tool_name === 'string' ? p.tool_name : '';

    // SELECTIVE GUARD (note 2 · canary Revision 2): AskUserQuestion + unrecognized
    // tools MUST surface natively. Return {} (no decision) → the native dialog
    // fires → FSSF Focus-card guides the user. A blind allow here auto-dismisses
    // the question (canary v1 refutation).
    const isExcluded = NON_RELAYABLE_TOOLS.has(toolName);
    const isUnknown = !KNOWN_TOOLS.has(toolName);
    if (isExcluded || isUnknown) {
      res.json({}); // no decision → native surface
      if (ulid) await updateSessionToolState(ulid, { askUserQuestionPending: true });
      console.log('[SCP Hooks] permission-request · DEFER native · ulid=', ulid, '· tool=', toolName, '· excluded=', isExcluded, '· unknown=', isUnknown);
      return;
    }

    // PSTK · THE AUTO GATE. AFTER the relayable-tool guard: a landing whose allow-suggestion
    // rules match a stored rule (the user's prior "Allow & don't ask") is auto-approved HERE —
    // NO hold, NO pane, NO entry write. matchesStoredRule uses CC's own rule grammar (string
    // equality on toolName+ruleContent); we do NOT glob-evaluate ruleContent ourselves.
    try {
      if (await matchesStoredRule(toolName, p.permission_suggestions)) {
        res.json({
          hookSpecificOutput: {
            hookEventName: 'PermissionRequest',
            decision: { behavior: 'allow' },
          },
        });
        const rule = extractAllowRules(p.permission_suggestions)[0];
        console.log('[SCP Hooks] permission.auto-approved · ulid=', ulid, '· tool=', toolName, '· rule=', rule ? `${rule.toolName}(${rule.ruleContent})` : '(none)');
        return;
      }
    } catch (err) {
      console.error('[SCP Hooks] permission-request · auto-gate error (falling through to queue)', err);
    }

    if (!ulid) {
      res.json({}); // can't map → defer, don't hang
      console.log('[SCP Hooks] permission-request · no ulid · defer · tool=', toolName);
      return;
    }

    // RELAYABLE gated tool → HBLR hold + PUSH onto the FIFO queue (never overwrite — the
    // OVERWRITE-SEAM is dead). A per-ITEM drain timer (595s from THIS landing) default-denies
    // + removes JUST this item on fire, then re-mirrors the surviving head.
    const requestId = mintPermissionRequestId(ulid);
    const landedAt = Date.now();
    const timer = setTimeout(() => {
      // 595s drain (just inside the 600s hook timeout): default-deny THIS item so Claude
      // Code does not hang forever · resolve by its own requestId (not the head) · re-mirror.
      const drained = resolveHeldPermission(ulid as string, { behavior: 'deny' }, requestId);
      if (drained) {
        mirrorPermissionQueue(ulid as string, drained.remaining).catch(() => {});
        console.log('[SCP Hooks] permission-request · 595s drain default-deny · ulid=', ulid, '· requestId=', requestId, '· remaining=', drained.remaining.length);
      }
    }, 595_000);

    const item: HeldPermission = {
      res,
      ulid,
      requestId,
      toolName,
      input: summarizeToolInput(p.tool_input),
      suggestions: p.permission_suggestions, // RAW · for the persistRule store write
      suggestionsCompact: compactSuggestions(p.permission_suggestions),
      timer,
      landedAt,
    };
    const queue = heldPermissions.get(heldKey(ulid)) ?? [];
    queue.push(item);
    heldPermissions.set(heldKey(ulid), queue);

    // Mirror the whole queue + the head scalars (the head IS this item when the queue was empty).
    await mirrorPermissionQueue(ulid, queue);
    console.log('[SCP Hooks] permission-request · HELD · ulid=', ulid, '· tool=', toolName, '· requestId=', requestId, '· depth=', queue.length);
    // NOTE: res is NOT sent here — it is held in the queue until Direction C (or drain).
  });

  // C.1 · Direction C · the user's decision arrives here and resolves the MATCHING held res.
  expressApp.post('/session/:id/permission-decision', async (req: Request, res: Response) => {
    const ulid = String(req.params.id ?? '');
    const { behavior, requestId, persistRule } = ((req as any).body ?? {}) as {
      behavior?: 'allow' | 'deny';
      requestId?: string;  // PSTK · selects the queue item · empty → head (back-compat)
      persistRule?: boolean; // PSTK · true + allow → store the resolved item's allow-rules
    };
    if (behavior !== 'allow' && behavior !== 'deny') {
      res.status(400).json({ ok: false, error: 'behavior must be allow|deny' });
      return;
    }
    // PSTK · resolve the queue item by requestId (head when empty). The result carries the
    // resolved item (for persistRule) + the surviving tail (for the mirror advance).
    const result = resolveHeldPermission(ulid, { behavior }, requestId);
    if (result && persistRule === true && behavior === 'allow') {
      // THE "Allow & don't ask" PATH · persist the resolved item's FIRST allow-suggestion
      // rules so every subsequent matching landing auto-approves at the AUTO GATE above.
      const rules = extractAllowRules(result.resolved.suggestions);
      if (rules.length > 0) {
        await persistPermissionRules(rules);
        console.log('[SCP Hooks] permission.rule-persisted · ulid=', ulid, '· requestId=', result.resolved.requestId, '· rules=', rules.map((r) => `${r.toolName}(${r.ruleContent})`).join(','));
      }
    }
    // Advance the mirror to the new head (or clear when the queue drained empty).
    await mirrorPermissionQueue(ulid, result ? result.remaining : []);
    console.log('[SCP Hooks] permission-decision · ulid=', ulid, '· behavior=', behavior, '· requestId=', requestId ?? '(head)', '· persistRule=', persistRule === true, '· resolved=', !!result, '· remaining=', result ? result.remaining.length : 0);
    res.json({ ok: !!result });
  });

  console.log('[SCP Hooks] RM-D3 routes registered: /hooks/pre-tool-use, /hooks/post-tool-use, /hooks/permission-request, /session/:id/permission-decision');

  console.log('[SCP Express] MCP endpoint registered at /mcp');

  // Plan for initialization and tool registration
  // Citation: STRATIMUX-REFERENCE.md - Critical Planning Context Patterns
  // Pattern: Initial stages use beat ONLY (no selectors) to avoid initialization deadlock
  return plan('SCP Express Transport', ({ stageO, stage, conclude }) => [
    stageO(),

    // Stage 1: Initialize SCP
    stage(({ dispatch, d, k }) => {
      const initialized = k.initialized.select();

      if (!initialized) {
        console.log('[SCP Express] Initializing...');

        dispatch(
          d.scp.e.scpInitialize({
            transportConfiguration: {
              mode: 'http',
              // C422 · the scanned per-workspace port (the C421 fossil cure).
              port: getActiveBridgePort(),
              // C665 · S0 THE LOOPBACK BIND: 127.0.0.1, NOT the 0.0.0.0 wildcard — the MCP
              // tool surface (send_message · spawn · gitm_* · scp_stop) must not be reachable
              // from other LAN hosts via unauthenticated tools/call. Every consumer resolves
              // 127.0.0.1 from bridge.json (pre-flight census C665); no off-machine caller.
              // Parity: activeBridgePort.model.ts:findFreeBridgePort probes 127.0.0.1 too.
              host: '127.0.0.1',
            },
          }),
          { iterateStage: true },
        );
        return;
      }

      dispatch(d_.muxium.e.muxiumKick(), { iterateStage: true });
    }),

    // Stage 2: Register Muxonomy-based tools with metadata (SCP Manifold pattern)
    // Citation: POC-2-3B-SCP-FORWARD-PASS-SUITE-6.md - Bridge Muxonomic File Pattern
    stage(({ dispatch, d, k }) => {
      console.log('[SCP Express] Stage 2.5 FUNCTION ENTERED');
      console.log('[SCP Express] scpMuxonomyRegistry exists:', !!scpMuxonomyRegistry);
      console.log('[SCP Express] scpMuxonomyRegistry length:', scpMuxonomyRegistry?.length || 0);
      try {
        console.log('[SCP Express] Stage 2.5 ENTERED - Iterating scpMuxonomyRegistry');

        const metadataRegistry = k.toolMetadataRegistry.select();

        // Collect all tools from all registered muxonomies
        const allRegisteredMeta: SCPQualityMetadataRegistered[] = [];
        const allToolDefs: SCPToolDefinition[] = [];

        for (const entry of scpMuxonomyRegistry) {
          const muxonomyTools = entry.muxonomic.scpToolMetadata || [];

          if (muxonomyTools.length === 0) {
            continue;
          }

          // Check if this concept's tools are already registered
          const alreadyRegistered = muxonomyTools.every((meta) => metadataRegistry[meta.toolName]);
          if (alreadyRegistered) {
            console.log(`[SCP Express] ${entry.conceptName} tools already registered`);
            continue;
          }

          console.log(
            `[SCP Express] Registering ${muxonomyTools.length} tools from ${entry.conceptName}`,
          );

          // Build registered metadata with conceptName
          for (const meta of muxonomyTools) {
            allRegisteredMeta.push({
              ...meta,
              conceptName: entry.conceptName,
            });

            // Build tool definition (placeholder handler - execution via manifold)
            allToolDefs.push({
              name: meta.toolName,
              description: meta.description,
              inputSchema: meta.inputSchema,
              registeredAt: Date.now(),
              handler: () => ({ error: 'Use manifold execution' }),
            });
          }
        }

        // Register all collected tools
        if (allToolDefs.length > 0) {
          console.log(
            `[SCP Express] Registering ${allToolDefs.length} total tools from Muxonomy Registry`,
          );

          // Build metadata registry map
          const metadataRegistryMap: Record<string, SCPQualityMetadataRegistered> =
            Object.fromEntries(allRegisteredMeta.map((m) => [m.toolName, m]));

          dispatch(
            d.scp.e.scpRegisterToolsWithMetadata({
              tools: allToolDefs,
              metadataRegistry: metadataRegistryMap,
            }),
            { iterateStage: true },
          );
          return;
        }

        dispatch(d_.muxium.e.muxiumKick(), { iterateStage: true });
      } catch (e) {
        console.error('[SCP Express] Stage 2.5 ERROR:', e);
        dispatch(d_.muxium.e.muxiumKick(), { iterateStage: true });
      }
    }),

    // Stage 3: Ready - sync SCP state for HTTP handler access
    // Note: clientState cache is updated via syncClientState.quality.ts
    stage(
      ({ concepts, k }) => {
        const state = k.getState(concepts);
        if (state) {
          scpState = state;
        }
      },
      {
        beat: 30,
      },
    ),

    conclude(),
  ]);
};
