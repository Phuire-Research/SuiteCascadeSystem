// scpDirResolver.model.ts — MD-1 · D-SB-3 · THE SCP-DIR RESOLVER (spawn re-root).
//
// RESUME INDUCTION W1 relocation (pure move, zero behaviour change): the body below is
// carried VERBATIM from src/main/cli-handler.ts, comments intact (F2 THE ROOT PIN, F4
// THE DOUBLED-PATH CURE, TOH-12 BREAK 2, the F2 GUARD-TELEMETRY LAW). It moved because
// the daemon (manager.ts) cannot import src/main/* and composeAppendedSystemPrompt —
// which BOTH doors call — needs the SCP root to reach the SCP-local Instance.md.
//
// The emit seam: sdia (main-only) anor log (both processes). Defaults to log().

import { readFileSync } from 'node:fs';
import * as nodePath from 'node:path';
import { log } from './debugLog';
import { bridgeRoot, scpsJsonPath } from './paths';

export type ScpDirEmit = (event: string, payload: Record<string, unknown>) => void;

// MD-1 · D-SB-3 · THE SCP-DIR RESOLVER (spawn re-root). Reads boundScps[scpName].dir
// from the per-project bridge.json (the D-SB-1 field). Secondary source: SCPs.json
// `path` resolved against process.cwd() (covers the pre-bind window where the SCP is
// installed but not yet a live boundScp). FailureNode: unknown scpName / absent both
// registries → undefined ⇒ the compose + roster fall back to the bridge root (unchanged
// behavior · the SCP simply has no sovereign boundary yet). NEVER throws.
export function resolveScpDir(
  scpName: string | undefined,
  emit?: ScpDirEmit,
): string | undefined {
  if (!scpName || scpName.length === 0) return undefined;
  // F2 · THE ROOT PIN · both registry reads resolve against bridgeRoot() (the C375
  // setBridgeRootOverride-aware / SCS_BRIDGE_ROOT_OVERRIDE-aware junction root), NOT
  // raw process.cwd(). The electron process's cwd can DIVERGE from the daemon's, so a
  // cwd-relative read reaches a stray dev-repo Cascades/ instead of the live install —
  // the same drift the paths.ts F3 pin cures for the registry write. bridgeRoot()
  // returns <root>/Cascades/Bridge: bridge.json sits directly there; SCPs.json is its
  // sibling one level up (<root>/Cascades/SCPs.json).
  const bridgeJsonPath = nodePath.join(bridgeRoot(), 'bridge.json');
  // F4 · THE DOUBLED-PATH CURE (FrontierTest1 field wound): SCPs.json `path` entries
  // are WORKSPACE-ROOT-relative ("Cascades/scps/<name>/SCP" — the SAME base
  // anchorConfig.model.ts resolveScpRootByName resolves against), NOT
  // Cascades-relative. The prior base (<root>/Cascades) doubled the segment —
  // 04:39 instance.resolve scpRoot=<root>/Cascades/Cascades/scps/… → the SCP-local
  // Instance.md probe failed → ground=workspace. Base = bridgeRoot()/../.. (the
  // workspace root · SCPs.json's own grandparent).
  const workspaceRoot = nodePath.resolve(bridgeRoot(), '..', '..');
  // TOH-12 · BREAK 2 (the L4 near-miss): the F2 comment above always CLAIMED both
  // registry reads resolve against bridgeRoot() — but this read was a bare
  // scpsJsonPath() (raw cwd) while the anchored workspaceRoot sat below, unused.
  // The registry read now actually rides the anchor the comment promised.
  const scpsJsonFile = scpsJsonPath(workspaceRoot);
  // 1. bridge.json boundScps[scpName].dir — the live, bridge-resolved absolute root.
  try {
    const raw = readFileSync(bridgeJsonPath, 'utf8');
    const bj = JSON.parse(raw) as { boundScps?: Record<string, { dir?: unknown }> };
    const dir = bj.boundScps?.[scpName]?.dir;
    if (typeof dir === 'string' && dir.length > 0) return dir;
  } catch {
    /* absent/malformed bridge.json → fall through to SCPs.json */
  }
  // 2. SCPs.json `path` resolved against the pinned Cascades dir (installed-but-not-
  //    yet-bound fallback).
  try {
    const raw = readFileSync(scpsJsonFile, 'utf8');
    const parsed = JSON.parse(raw) as { scps?: Array<{ name?: string; path?: string }> };
    const entry = Array.isArray(parsed.scps)
      ? parsed.scps.find((s) => s?.name === scpName && typeof s?.path === 'string')
      : undefined;
    if (entry && typeof entry.path === 'string' && entry.path.length > 0) {
      // F4 normalization Concluder: an absolute stored path is used AS-IS; a
      // relative one resolves exactly ONCE against the workspace root — never a
      // blind join against a base that itself ends in Cascades (the doubled-path
      // field wound).
      return nodePath.isAbsolute(entry.path)
        ? entry.path
        : nodePath.resolve(workspaceRoot, entry.path);
    }
  } catch {
    /* absent/malformed SCPs.json → undefined (bridge-root fallback downstream) */
  }
  // F2 · THE GUARD-TELEMETRY LAW · both pinned reads missed (unknown scpName / neither
  // registry carried it). Name the two paths tried so the next spawn's bare-base cause
  // is diagnosable from the sdia stream (was it a wrong-root read, or a genuine miss).
  (emit ?? log)('resolveScpDir.miss', {
    scpName,
    bridgeJsonPathTried: bridgeJsonPath,
    scpsJsonPathTried: scpsJsonFile,
  });
  return undefined;
}
