/**
 * diagnostics.ts · Unified Electron-side diagnostic log writer
 *
 * Single source of truth for SDIA (Session-Diagnostic-In-Append) + renderer
 * IPC-forwarded events. Writes JSON-per-line events to
 * `<projectRoot>/Cascades/Bridge/electron-debug.json` alongside the existing
 * `debug.json` (dev orchestrator) and `template-debug.json` (template SCP)
 * so all diagnostic streams live in one project-local directory.
 *
 * Used by:
 *   - src/main/session.ts (main-process PTY + MessageChannel events)
 *   - src/main/index.ts (renderer IPC log forwarding)
 *
 * Source tag distinguishes origin: 'electron-main' vs 'renderer'.
 */
import * as path from 'node:path';
import * as fs from 'node:fs';
import { app } from 'electron';
import { capLogFile } from '../lib/bridge/logCap';

function getDiagnosticLogPath(): string {
  // C934 · THE SINK LEAVES THE PACKAGE — app.getAppPath() under a GLOBAL install is the npm
  // package directory; writing runtime telemetry there made every `npm i -g` upgrade fail
  // ENOTEMPTY (the live bridge recreates Cascades/Bridge faster than npm can rmdir). The
  // sink's honest home is the WORKSPACE (process.cwd() — the same ground the per-workspace
  // singleton and startRenderModeWatch trust), beside the CLI's debug.json. dev:self keeps
  // its DEV-repo sink (cwd = the repo there).
  const projectRoot = process.cwd();
  const dir = path.join(projectRoot, 'Cascades', 'Bridge');
  try {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  } catch {
    /* swallow · diagnostic must not crash */
  }
  return path.join(dir, 'electron-debug.json');
}

export function sdia(
  event: string,
  data: Record<string, unknown> = {},
  source: 'electron-main' | 'renderer' | 'fkis' | 'ping' = 'electron-main',
): void {
  try {
    const entry = {
      ts: new Date().toISOString(),
      source,
      event,
      ...data,
    };
    const line = JSON.stringify(entry) + '\n';
    const p = getDiagnosticLogPath();
    fs.appendFileSync(p, line);
    capLogFile(p); // D-LHT · drop-oldest cap (amortized · watcher-safe atomic rename)
  } catch {
    /* swallow · diagnostic logging must never crash session */
  }
}

export function getElectronDebugLogPath(): string {
  return getDiagnosticLogPath();
}
