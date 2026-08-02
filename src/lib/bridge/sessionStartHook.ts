import { readFile, writeFile, rename } from 'node:fs/promises';
import { metaPath } from './paths';
import { updateSessionLiveIdentity, setSessionScpAffinity } from './registry';
import { resolveScpNameFromCwd } from './scpResolver';
import { setDebugEnabled, log } from './debugLog';
import { tdia } from './tdia';
import { readBridgeMetadata, bridgeMetadataPathPerProject } from './bridgeMetadata';

export async function readStdin(): Promise<string> {
  const chunks: Buffer[] = [];
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => resolve(''), 2000);
    process.stdin.on('data', (chunk: Buffer) => chunks.push(chunk));
    process.stdin.on('end', () => {
      clearTimeout(timeout);
      resolve(Buffer.concat(chunks).toString('utf8'));
    });
    process.stdin.on('error', (err) => {
      clearTimeout(timeout);
      reject(err);
    });
  });
}

export async function runSessionStartHook(): Promise<void> {
  // W1.5 · D2 Recurse-5 BNPC diagnostic · session-start hook fire-site entry log
  // Pre-fix expected: ZERO of these events in electron-debug.json (hook never
  // fires because spawn-settings.json points at Electron binary which lacks
  // __hook subcommand). Post-fix expected: this fires under Node context —
  // execPath = node, not Electron — proving ECNR routed correctly.
  // Unconditional log (NOT gated by debugEnabled) — fires on every hook invocation.
  tdia('hook.fire.session-start', {
    pid: process.pid,
    ppid: process.ppid,
    execPath: process.execPath,
    argv: process.argv,
    ulid: process.env.SCS_BRIDGE_ULID ?? null,
    scpName: process.env.SCS_BRIDGE_SCP_NAME ?? null,
    cwd: process.cwd(),
    isElectronCtx: !!process.versions.electron,
  });
  const ulid = process.env.SCS_BRIDGE_ULID;
  if (!ulid) {
    process.exit(0);
  }

  if (process.env.SCS_BRIDGE_DEBUG === '1') setDebugEnabled(true);

  let stdinPayload: string;
  try {
    stdinPayload = await readStdin();
  } catch {
    process.exit(0);
  }

  let parsed: { session_id?: string; cwd?: string; source?: string };
  try {
    parsed = JSON.parse(stdinPayload);
  } catch {
    process.exit(0);
  }

  const claudeSessionId = parsed.session_id;
  if (!claudeSessionId) {
    process.exit(0);
  }

  const claudePid = process.ppid;

  try {
    await updateSessionLiveIdentity(ulid, claudeSessionId, claudePid);
    log('hook.fire', { ulid, claudeSessionId, claudePid, source: parsed.source });
  } catch (err) {
    process.stderr.write(`[scs-hook] registry update failed: ${(err as Error).message}\n`);
    process.exit(0);
  }

  // SS-P1 + SS-Final · SAID Diameter · three-step fallback chain.
  // Precedence: env var > preferredScpName (SPMEM meta.json read) > CWD-match.
  // SCS_BRIDGE_SCP_NAME from spawnSettings command-prefix wins (M22 CHCS); SPMEM
  // memory from prior session second; CWD-match defensive last fallback.
  // Empty string treated as absent (matches setSessionDisplayName empty-string convention).
  const envScpName = process.env.SCS_BRIDGE_SCP_NAME?.trim() || undefined;
  let matchedScpName: string | undefined = envScpName;
  let scpNameSource: 'env' | 'bridgeJson' | 'preferred' | 'cwd' | undefined = envScpName ? 'env' : undefined;

  // D3C · CIBJ · Route A · TUI-active SCP focus fallback (BJAS field read).
  // Citation: D3C-CURRYING-FOUNDATION-R4-VIRIDIAN-AUDIT.md §HAZARD-H · chain insertion point.
  // Citation: D3C-CURRYING-FOUNDATION-R2-RUST-PROSPECTING.md §CFCR step 2.
  // Reads <cwd>/Cascades/Bridge/bridge.json (PPRR per-project) when env var absent.
  // Non-fatal on missing/malformed file — falls through to SPMEM next step.
  if (!matchedScpName && parsed.cwd) {
    try {
      const bridgePath = bridgeMetadataPathPerProject(parsed.cwd);
      const bridgeData = await readBridgeMetadata(bridgePath);
      const activeFromBridge = bridgeData?.activeScp?.trim() || undefined;
      if (activeFromBridge) {
        matchedScpName = activeFromBridge;
        scpNameSource = 'bridgeJson';
        console.log('[SCS-Bridge D3C] CIBJ resolved scpName from bridge.json.activeScp:', activeFromBridge);
      }
    } catch {
      // non-fatal · bridge.json may not exist · skip to SPMEM next step
    }
  }

  // SS-Final · SPMEM read: extract preferredScpName from meta.json as second fallback.
  // Non-fatal on missing file or malformed JSON — falls through to CWD-match.
  if (!matchedScpName) {
    try {
      const metaRaw = await readFile(metaPath(ulid), 'utf8');
      const metaObj = JSON.parse(metaRaw) as { preferredScpName?: string };
      const preferred = metaObj.preferredScpName?.trim() || undefined;
      if (preferred) {
        matchedScpName = preferred;
        scpNameSource = 'preferred';
      }
    } catch {
      // non-fatal · meta.json may not have preferredScpName yet · skip to CWD-match
    }
  }

  if (!matchedScpName && parsed.cwd) {
    try {
      matchedScpName = await resolveScpNameFromCwd(parsed.cwd);
      if (matchedScpName) scpNameSource = 'cwd';
    } catch (err) {
      process.stderr.write(`[scs-hook] scpName CWD resolve failed: ${(err as Error).message}\n`);
    }
  }
  if (matchedScpName) {
    try {
      await setSessionScpAffinity(ulid, matchedScpName);
      log('hook.scpAffinity', {
        ulid,
        scpName: matchedScpName,
        source: scpNameSource,
      });
    } catch (err) {
      process.stderr.write(`[scs-hook] scpName affinity bind failed: ${(err as Error).message}\n`);
    }
  }

  try {
    const path = metaPath(ulid);
    const raw = await readFile(path, 'utf8');
    const meta = JSON.parse(raw);
    meta.claudeSessionId = claudeSessionId;
    meta.status = 'launched';
    if (!meta.launchedAt) {
      meta.launchedAt = Date.now();
    }
    if (matchedScpName) {
      meta.scpName = matchedScpName;
    }
    // D3RM-H · A-3 SAPR follow-through: persist suite8Name into meta.json exactly
    // as claudeSessionId persists above — the dual-source rail's meta leg. The
    // spawnSettings command-prefix carries SCS_BRIDGE_SUITE8_NAME (A-3 SAPR);
    // absent env NEVER clobbers an existing meta.suite8Name (empty = absent,
    // matching the envScpName convention above).
    const envSuite8Name = process.env.SCS_BRIDGE_SUITE8_NAME?.trim() || undefined;
    if (envSuite8Name) {
      meta.suite8Name = envSuite8Name;
    }
    const tmp = path + '.tmp';
    await writeFile(tmp, JSON.stringify(meta, null, 2), 'utf8');
    await rename(tmp, path);
  } catch (err) {
    process.stderr.write(`[scs-hook] meta.json update failed: ${(err as Error).message}\n`);
  }

  process.exit(0);
}
