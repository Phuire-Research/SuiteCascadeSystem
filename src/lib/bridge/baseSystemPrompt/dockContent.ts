// dockContent.ts — THE DOCK layer resolver (C1-D3 · RESUME INDUCTION W1 relocation).
//
// THE DOCK (the user's definition, C1088): "the Most Upper First Prompt that Provides
// the Context for the Rest of the Suite 8s to be Joined To" — it HEADS the Suite 8
// stack; the designation's Instance.md joins BELOW it; the bridge's base contract
// precedes both.
//
// WHY IT MOVED (RESUME INDUCTION W1 · pure move, zero behaviour change): the daemon
// (src/lib/bridge/manager.ts) CANNOT import src/main/*, so a Dock resolver resident in
// cli-handler.ts was unreachable from the TUI / `scs attach` / `scs bridge spawn` doors.
// That unreachability IS the strip composeAppendedSystemPrompt cures. Body + comments
// carried over VERBATIM from cli-handler.ts:72-107.
//
// GUARD 8 (Lane 7 failure matrix): the package root is resolved through the ONE helper
// that carries the C755 dual candidate (baseSystemPrompt.resolvePackageRootCandidates).
// The third independently-maintained package-root resolver is retired here.
//
// Returns '' on read failure so the composer gracefully degrades to a 2-layer
// Base→Instance compose if the Dock is missing.

import { existsSync, readFileSync } from 'node:fs';
import * as nodePath from 'node:path';
import { log } from '../debugLog';
import { resolvePackageRootCandidates } from './baseSystemPrompt';

// The emit seam: `sdia` lives in src/main/diagnostics (main-only) while `log` lives in
// lib/bridge/debugLog (reachable from both processes). The callback lets the Electron
// door keep writing electron-debug.json and the daemon door debug.json — one resolver,
// each sink preserved. Defaults to log().
export type DockEmit = (event: string, payload: Record<string, unknown>) => void;

// RELEASE W1: assets/ (not src/) — src/ never ships in the npm tarball, so a
// src-resident Dock silently degraded to '' (a 2-layer compose, no Suite 8 activation
// layer) for every global-install user.
export const DOCK_REL = nodePath.join(
  'assets',
  'baseSystemPrompt',
  'scs-bridge-dock-suite8.md',
);

// The Dock layer as BOTH bytes and provenance — the Dock View renders the source path
// beside the byte count, so the reader and the view share ONE resolution (never a second
// candidate walk that could disagree with what the compose actually read).
export type DockLayer = { content: string; path: string | undefined };

export function readDockLayer(emit?: DockEmit): DockLayer {
  try {
    // C755 · THE DEV-BRIDGE FALLBACK RUNG rides inside resolvePackageRootCandidates:
    // under the DEV electron launch argv[1] is the app DIRECTORY (not dist/cli.cjs), so
    // the argv-derived pkgRoot lands a level too high and the Dock silently dropped
    // (dockIncluded:false on EVERY dev spawn — the stamped geography never attached).
    // Both candidates are tried in order; the first whose assets/ Dock exists wins.
    const candidates = resolvePackageRootCandidates().map((root) =>
      nodePath.join(root, DOCK_REL),
    );
    if (candidates.length === 0) return { content: '', path: undefined };
    for (const dockPath of candidates) {
      if (existsSync(dockPath)) {
        return { content: readFileSync(dockPath, 'utf8'), path: dockPath };
      }
    }
    (emit ?? log)('prompt.dock-missing', { candidates });
    return { content: '', path: undefined };
  } catch {
    return { content: '', path: undefined };
  }
}

export function resolveDockContent(emit?: DockEmit): string {
  return readDockLayer(emit).content;
}
