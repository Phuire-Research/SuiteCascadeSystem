/**
 * sordEnvelope.model.ts — SORD Envelope Model File (SMFT · RM-D2 R3 Yellow)
 *
 * PURE module · zero Stratimux/Huirth deps · CLI-importable. Produces the locked
 * 《send_message》-class SORD envelope string per RM-D2-FOUNDATION-R2-ORANGE §3.
 *
 * TNST: the opening tag === the tool name. ENDPOINT is DERIVED as
 * `${bridgeConfig.endpoint}/mcp` — bridge.json has NO /mcp field; four template
 * call sites confirm the +"/mcp" derivation (R1 Red §2).
 *
 * DBSE: `body` is OPTIONAL. Omitted ⇒ a tool-call envelope with no body section.
 * Present ⇒ the matching sentinel ('MESSAGE:' for kind 'message', 'DIRECTIVE:' for
 * kind 'directive'). Body text emitted verbatim (no escaping — the body is opaque
 * data per BDAP §5 Rule 3).
 *
 * Naming rationale: `.model.ts` suffix per Stratidian convention for pure,
 * dispatch-free, Stratimux-agnostic helpers (cf. lastTurnExtraction.model.ts,
 * muxonomy.model.ts, diametric.model.ts). NO `.huirth.ts` suffix.
 *
 * Citation: RM-D2-R3-YELLOW-ARCHITECTURE.md §B · R2 Orange §3 (locked envelope).
 */

export interface SordBridgeConfig { endpoint: string; }
export interface SordBody { kind: 'message' | 'directive'; text: string; }
export interface BuildSordEnvelopeInput {
  tool: string;
  bridgeConfig: SordBridgeConfig;
  params: Record<string, string>;
  body?: SordBody;
}

const OPEN = (tool: string) => `《${tool}》`;
const CLOSE = (tool: string) => `《/${tool}》`;

export function deriveMcpEndpoint(endpoint: string): string {
  // R1 Red §2: bridge.json carries `endpoint` (base URL), NO /mcp field.
  // Strip a trailing slash defensively, then append the canonical path.
  return `${endpoint.replace(/\/+$/, '')}/mcp`;
}

export function buildSordEnvelope(input: BuildSordEnvelopeInput): string {
  const { tool, bridgeConfig, params, body } = input;
  const lines: string[] = [
    OPEN(tool),
    `TOOL: ${tool}`,
    `ENDPOINT: ${deriveMcpEndpoint(bridgeConfig.endpoint)}`,
    'PARAMS:',
    ...Object.entries(params).map(([k, v]) => `  ${k}: ${v}`),
  ];
  if (body) {
    lines.push(body.kind === 'directive' ? 'DIRECTIVE:' : 'MESSAGE:');
    lines.push(body.text); // verbatim — opaque body
  }
  lines.push(CLOSE(tool));
  return lines.join('\n');
}
