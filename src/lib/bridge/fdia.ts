/**
 * fdia.ts · FKIS-Diagnostic-In-Append unified writer
 *
 * Cycle 166 R2 D3 FKIS Recurse-1 W1 instrumentation.
 *
 * Appends JSON-per-line events to the SAME `Cascades/Bridge/electron-debug.json`
 * file used by `src/main/diagnostics.ts` (sdia · source 'electron-main' or
 * 'renderer') and `src/lib/bridge/tdia.ts` (source 'transcript'). The
 * discriminator field `source: 'fkis'` distinguishes FKIS-pipeline events
 * (Quality + CSSP relay sites that run in the bridge/orchestrator process).
 *
 * Why a separate writer (vs. importing diagnostics.ts):
 *   - The Quality + electronMessageDispatch live in src/lib/bridge — importing
 *     from src/main/ would create a layer violation (bridge libs MUST not
 *     depend on main).
 *   - The bridge muxium runs in the dev orchestrator (TUI parent) process,
 *     not in the Electron app process — it cannot import the Electron `app`
 *     module (which diagnostics.ts requires for getAppPath()).
 *
 * Unified-file discipline (per S2 + S6 verdict): one-shot Concluder via
 * `jq 'select(.source=="fkis")'` across the full FKIS pipeline.
 *
 * Mirror of tdia.ts (same pattern; different source discriminator).
 */
import { appendFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { bridgeLogDir } from './paths';
import { capLogFile } from './logCap';

function fdiaLogPath(): string {
  return join(bridgeLogDir(), 'electron-debug.json');
}

export function fdia(event: string, data: Record<string, unknown> = {}): void {
  try {
    const path = fdiaLogPath();
    const dir = dirname(path);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
    const entry = {
      ts: new Date().toISOString(),
      source: 'fkis',
      event,
      ...data,
    };
    appendFileSync(path, JSON.stringify(entry) + '\n');
    capLogFile(path); // D-LHT · drop-oldest cap (amortized · watcher-safe)
  } catch {
    /* swallow · diagnostic must never crash bridge or relay subprocess */
  }
}
