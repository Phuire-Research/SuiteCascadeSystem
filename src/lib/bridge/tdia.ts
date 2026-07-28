/**
 * tdia.ts · Transcript-Diagnostic-In-Append unified writer
 *
 * Cycle 166 R1+++ D2 Recurse-5 Wave 1 instrumentation.
 *
 * Appends JSON-per-line events to the SAME `Cascades/Bridge/electron-debug.json`
 * file used by `src/main/diagnostics.ts` (sdia). The discriminator field
 * `source: 'transcript'` distinguishes BNPC-diagnostic and hook-fire events from
 * Electron-main + renderer events that already populate this surface.
 *
 * Why a separate writer (vs. importing diagnostics.ts):
 *   - spawnSettings.ts lives in src/lib/bridge — importing from src/main/
 *     would create a layer violation (bridge libs MUST not depend on main).
 *   - sessionStartHook.ts + stopHook.ts run as fresh Node subprocesses spawned
 *     by claude — they cannot import the Electron `app` module (which
 *     diagnostics.ts requires for getAppPath()).
 *   - Unified-file discipline (S2 §B.1 TDIA verdict) preserves one-shot
 *     Concluder queries via `jq 'select(.source=="transcript")'`.
 *
 * Path resolution mirrors paths.ts bridgeRoot() — process.cwd() based — which
 * for hook subprocesses is the project root claude was invoked in. Defensive
 * fallback uses os.homedir() if cwd is unwritable.
 */
import { appendFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { bridgeRoot } from './paths';
import { capLogFile } from './logCap';

function tdiaLogPath(): string {
  return join(bridgeRoot(), 'electron-debug.json');
}

export function tdia(event: string, data: Record<string, unknown> = {}): void {
  try {
    const path = tdiaLogPath();
    const dir = dirname(path);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
    const entry = {
      ts: new Date().toISOString(),
      source: 'transcript',
      event,
      ...data,
    };
    appendFileSync(path, JSON.stringify(entry) + '\n');
    capLogFile(path); // D-LHT · drop-oldest cap (amortized · watcher-safe)
  } catch {
    /* swallow · diagnostic must never crash bridge or hook subprocess */
  }
}
