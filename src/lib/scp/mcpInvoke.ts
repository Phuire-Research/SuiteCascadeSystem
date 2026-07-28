/**
 * mcpInvoke · Shared CLI Helper · Cycle 140
 *
 * Centralizes bridge.json port discovery + MCP tools/call invocation for the
 * six new `scs scp` subcommands (launch, status, logs, open, dock, unregister).
 * Avoids the RDPS-class drift that would occur if each command inlined the
 * fetch envelope.
 *
 * Per-project discovery first (PPRR · Cascades/Bridge/bridge.json) → global
 * fallback (~/.scs-bridge/bridge.json) — matches install.ts behavior.
 *
 * Citation: SUITE-3-YELLOW-CYCLE-140-MSCM-TQDR-BLUEPRINT.md §6.2
 */

import {
  readBridgeMetadata,
  bridgeMetadataPath,
  bridgeMetadataPathPerProject,
  type BridgeMetadata,
} from '../bridge/bridgeMetadata';

export type McpInvocationResult =
  | { ok: true; result: unknown }
  | { ok: false; error: string; code?: string };

let nextRequestId = 1;

export async function readBridgeJsonPort(userCwd: string): Promise<{ port: number; meta: BridgeMetadata } | null> {
  const perProjectPath = bridgeMetadataPathPerProject(userCwd);
  let meta = await readBridgeMetadata(perProjectPath);
  if (!meta) {
    meta = await readBridgeMetadata(bridgeMetadataPath());
  }
  if (!meta) return null;

  const ageMs = Date.now() - meta.writtenAt;
  if (ageMs > 60 * 60 * 1000) {
    return null;
  }
  if (typeof meta.port !== 'number' || meta.port <= 0) {
    return null;
  }
  return { port: meta.port, meta };
}

export async function invokeMcpTool(
  toolName: string,
  args: Record<string, unknown>,
  options?: { userCwd?: string; timeoutMs?: number },
): Promise<McpInvocationResult> {
  const cwd = options?.userCwd ?? process.cwd();
  const timeoutMs = options?.timeoutMs ?? 5000;

  const discovered = await readBridgeJsonPort(cwd);
  if (!discovered) {
    return {
      ok: false,
      code: 'BRIDGE_NOT_RUNNING',
      error:
        'SCS-Bridge not running or bridge.json stale · run `scs` in another terminal to start the bridge',
    };
  }

  const requestId = nextRequestId++;
  const url = `http://127.0.0.1:${discovered.port}/mcp`;
  const body = JSON.stringify({
    jsonrpc: '2.0',
    id: requestId,
    method: 'tools/call',
    params: { name: toolName, arguments: args },
  });

  let res: Response;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch (err) {
    return {
      ok: false,
      code: 'NETWORK_ERROR',
      error: err instanceof Error ? err.message : String(err),
    };
  }

  if (!res.ok) {
    return {
      ok: false,
      code: 'HTTP_ERROR',
      error: `MCP HTTP ${res.status} ${res.statusText}`,
    };
  }

  let json: { result?: unknown; error?: { message?: string; code?: number | string } };
  try {
    json = (await res.json()) as typeof json;
  } catch (err) {
    return {
      ok: false,
      code: 'PARSE_ERROR',
      error: err instanceof Error ? err.message : String(err),
    };
  }

  if (json.error) {
    return {
      ok: false,
      code: String(json.error.code ?? 'MCP_ERROR'),
      error: json.error.message ?? 'MCP tool returned error',
    };
  }

  return { ok: true, result: json.result };
}
