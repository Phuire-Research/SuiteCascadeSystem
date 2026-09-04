/**
 * scpClientLogs.ts · N-1 / N-1b · the 8R6 Neon PlayTester — SCP renderer console capture
 *
 * The SCP page is an Electron BrowserWindow (offscreen when shader-wrapped, a flat visible
 * window otherwise). Its renderer console has been INVISIBLE to the main process all along —
 * which is exactly why the GitM turn-over diagnosis kept guessing (the client `[SORD-TRACE]`
 * lines, the fetch errors, the CORS blocks never reached any file). This hooks
 * `webContents.on('console-message')` on the SCP content window and appends every renderer log
 * to `<projectRoot>/Cascades/Bridge/<scpName>-client-logs.json` — JSON-per-line, alongside the
 * existing `electron-debug.json` / `debug.json`. Now `grep` sees the client.
 *
 * N-1b (this pass) fixes why the client logs were "not passing through":
 *  1. SIGNATURE-TOLERANT handler. Electron 35+ changed `console-message` from the old
 *     `(event, level:number, message, line, sourceId)` to a SINGLE event object
 *     `({ level:string, message, lineNumber, sourceId, frame })`. The old 5-arg destructure
 *     silently yielded `level=message=undefined` on a modern Electron → empty/garbage capture.
 *     We now accept BOTH forms and normalize `level` (number 0-3 name OR string passthrough).
 *  2. PER-SCP FILENAME. `<scpName>-client-logs.json` (threaded from cli-handler `open-url`), so
 *     each SCP's PlayTest is self-scoped instead of every renderer collapsing into one file.
 *  3. SELF-DIAGNOSING. On attach AND on the FIRST captured message we emit an `sdia` breadcrumb
 *     into `electron-debug.json` (a file the user CAN already see) recording the exact resolved
 *     path — so the next turn-over test proves in seconds whether the hook fired and where it wrote.
 *
 * PATH (N-1b correction): the CALL LOCATION, not the package dir. `app.getAppPath()` resolves to
 * the scs-bridge PACKAGE root ("the Base Repository") — the wrong place for a user's debug logs.
 * Every user-facing bridge artifact routes through bridgeRoot() = join(process.cwd(), 'Cascades',
 * 'Bridge') — the directory `scs` was CALLED from (debug.json, bridge.json, sessions.json all do).
 * Client-logs join them so the CLI is callable for the user to debug THEIR application in-place.
 *
 * This is the first Means of the Neon PlayTester (Suite 6 Actionable = PlayTest). N-2
 * (render-capture via the `paint` hook) and N-3 (orchestrate via executeJavaScript/sendInputEvent)
 * compose onto the same offscreen webContents.
 */
import * as path from 'node:path';
import * as fs from 'node:fs';
import { type BrowserWindow } from 'electron';
import { sdia } from './diagnostics';
import { readScpConfigName } from '../lib/bridge/scpConfig.model';
import { workspaceBridgeDir } from '../lib/bridge/paths';

// Rotate (truncate) past this size so a chatty renderer can never grow the file unbounded.
const CLIENT_LOG_MAX_BYTES = 5_000_000;

// Old-signature numeric levels (Electron <35). New signature (35+) is already a string.
const LEVEL_NAMES = ['verbose', 'info', 'warning', 'error'] as const;

/**
 * The RUNNING SCP's name — bridge.json-first (064 Lambda correction). The prior dir-scan required
 * EXACTLY ONE scp.config.json under Cascades/scps/, but every install ships the dormant template
 * skeleton BESIDE the real SCP (063: Testing/ + template/) → 2 names → null → the 'template'
 * fallback → the logs were mis-named AGAIN. The authoritative answer already sits at the call
 * location: `<cwd>/Cascades/Bridge/bridge.json` — the bridge maintains `activeScp` (TUI focus),
 * `boundScps` (the LIVE SCPs), and `installedScps` (the real inventory · template excluded).
 * Resolution chain: activeScp → sole boundScp → sole installedScp → dir scan excluding the
 * template skeleton → null (caller keeps the threaded name). Resolved once per window.
 */
export function resolveActiveScpName(): string | null {
  // 1. bridge.json — the bridge KNOWS which SCP is running (Per-SCP-Identity composed).
  try {
    const raw = fs.readFileSync(
      path.join(workspaceBridgeDir(process.cwd()), 'bridge.json'),
      'utf8',
    );
    const bj = JSON.parse(raw) as {
      activeScp?: unknown;
      boundScps?: Record<string, unknown>;
      installedScps?: unknown;
    };
    if (typeof bj.activeScp === 'string' && bj.activeScp.length > 0) return bj.activeScp;
    const bound =
      bj.boundScps && typeof bj.boundScps === 'object' ? Object.keys(bj.boundScps) : [];
    if (bound.length === 1) return bound[0];
    const installed = Array.isArray(bj.installedScps)
      ? bj.installedScps.filter((s): s is string => typeof s === 'string' && s.length > 0)
      : [];
    if (installed.length === 1) return installed[0];
  } catch {
    /* absent/malformed bridge.json → fall through to the dir scan */
  }
  // 2. scp.config.json dir scan — EXCLUDING the shipped template skeleton (present in every install).
  try {
    const scpsRoot = path.join(process.cwd(), 'Cascades', 'scps');
    const dirs = fs.readdirSync(scpsRoot, { withFileTypes: true }).filter((d) => d.isDirectory());
    const names: string[] = [];
    for (const d of dirs) {
      // Install layout is `<name>/SCP/scp.config.json`; tolerate a flat `<name>/scp.config.json`.
      const n =
        readScpConfigName(path.join(scpsRoot, d.name, 'SCP')) ??
        readScpConfigName(path.join(scpsRoot, d.name));
      if (n) names.push(n);
    }
    const real = names.filter((n) => n !== 'template');
    if (real.length === 1) return real[0];
    if (names.length === 1) return names[0];
  } catch {
    /* no scps dir (dev:self) */
  }
  return null;
}

function getClientLogsPath(scpName?: string): string {
  // CALL LOCATION, not the package dir. `app.getAppPath()` resolves to the scs-bridge PACKAGE
  // ("the Base Repository") — where the user does NOT want their debug logs. Every user-facing
  // bridge artifact (debug.json, bridge.json, sessions.json) routes through
  // bridgeRoot() = workspaceBridgeDir(process.cwd()) — the directory `scs` was CALLED from.
  // Client-logs must join them so the CLI is callable for the user to debug THEIR application.
  const dir = workspaceBridgeDir(process.cwd());
  try {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  } catch {
    /* swallow · a diagnostic must never crash the window */
  }
  const fname =
    scpName && scpName.length > 0 ? `${scpName}-client-logs.json` : 'client-logs.json';
  return path.join(dir, fname);
}

// number (old signature) → level name · string (new signature) → passthrough.
function normalizeLevel(level: unknown): string {
  if (typeof level === 'number') return LEVEL_NAMES[level] ?? String(level);
  if (typeof level === 'string') return level;
  return String(level);
}

/**
 * Attach the renderer-console → Bridge/<scpName>-client-logs.json capture to an SCP content window.
 * Idempotent-safe to call once per window at creation. Never throws.
 */
export function attachScpClientLogCapture(
  win: BrowserWindow,
  label = 'scp',
  scpName?: string,
): void {
  // Resolve the RUNNING SCP's name once per window (the arg-threaded scpName is 'template' when
  // the open-url arg/env fell back). bridge.json (activeScp/boundScps/installedScps) is authoritative.
  const effectiveScpName = resolveActiveScpName() ?? scpName;
  let firstWriteLogged = false;
  try {
    win.webContents.on('console-message', (...args: unknown[]) => {
      try {
        // Signature-tolerant · <35: (event, level:number, message, line, sourceId)
        //                    · 35+: ({ level:string, message, lineNumber, sourceId, frame })
        let level: unknown;
        let message: unknown;
        let line: unknown;
        let sourceId: unknown;
        const a0 = args[0] as Record<string, unknown> | undefined;
        if (args.length === 1 && a0 && typeof a0 === 'object' && 'message' in a0) {
          level = a0.level;
          message = a0.message;
          line = a0.lineNumber;
          sourceId = a0.sourceId;
        } else {
          level = args[1];
          message = args[2];
          line = args[3];
          sourceId = args[4];
        }

        const p = getClientLogsPath(effectiveScpName);
        // Rotate on overflow (truncate to empty · the tail is what a PlayTest/diagnosis reads).
        try {
          if (fs.existsSync(p) && fs.statSync(p).size > CLIENT_LOG_MAX_BYTES) {
            fs.writeFileSync(p, '');
          }
        } catch {
          /* swallow */
        }
        const rec = {
          ts: new Date().toISOString(),
          source: 'scp-renderer',
          label,
          scpName: effectiveScpName ?? '(none)',
          level: normalizeLevel(level),
          message: typeof message === 'string' ? message : String(message ?? ''),
          line: typeof line === 'number' ? line : null,
          // keep only the tail of the sourceId (full URLs are noisy)
          src: typeof sourceId === 'string' ? sourceId.slice(-72) : String(sourceId ?? ''),
        };
        fs.appendFileSync(p, JSON.stringify(rec) + '\n');
        // Self-diagnosing: the FIRST real capture proves the hook fired + records the path into
        // electron-debug.json (a file the user can already see). Fires once per window.
        if (!firstWriteLogged) {
          firstWriteLogged = true;
          sdia('scp.client-logs.first-write', {
            label,
            scpName: effectiveScpName ?? '(none)',
            argScpName: scpName ?? '(none)',
            path: p,
            argCount: args.length,
          });
        }
      } catch {
        /* swallow · client-log capture must never crash the SCP window */
      }
    });
    sdia('scp.client-logs.attached', {
      label,
      scpName: effectiveScpName ?? '(none)',
      argScpName: scpName ?? '(none)',
      id: win.id,
      path: getClientLogsPath(effectiveScpName),
    });
  } catch (err) {
    sdia('scp.client-logs.attach-FAIL', { error: String(err) });
  }
}
