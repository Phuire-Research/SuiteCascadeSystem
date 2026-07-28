import { existsSync, writeFileSync } from 'node:fs';
import { readFile, unlink, writeFile } from 'node:fs/promises';
import * as path from 'node:path';
import { readStdin } from './sessionStartHook';
import { updateSessionLiveIdentity } from './registry';
import { SCS_INSTALL_PRIMING_PROMPT as PRIMING_PROMPT } from './installConstants';
import { pendingChatPath } from './paths';
import { log } from './debugLog';

// Diamond B-25-UX-fix-2 (CD-108 IARSR · Install-Agent-Registry-Self-Registration):
// runRegisterInstallHook now performs DUAL registration:
//   (a) bridge registry registration via updateSessionLiveIdentity (NEW · matches
//       runSessionStartHook semantics) — install agent becomes visible in bridge
//       menu, trackable for liveness, indistinguishable from regular sessions
//       at registry level
//   (b) install tempDir register-state.json (legacy · install-pipeline polling
//       compatibility preserved)
//
// Pre-fix: install agent fired this hook but ONLY wrote tempDir flag → bridge
// menu never showed install agent · no liveness tracking · install hook fired
// silently from bridge's perspective. User-surfaced bug (B-25-UX-fix follow-up).
export async function runRegisterInstallHook(): Promise<void> {
  const ulid = process.env.SCS_BRIDGE_ULID;
  const tempDir = process.env.SCS_BRIDGE_INSTALL_TEMP;
  if (!ulid || !tempDir) {
    process.exit(0);
  }

  let stdinPayload: string;
  try {
    stdinPayload = await readStdin();
  } catch {
    process.exit(0);
  }

  let parsed: { session_id?: string };
  try {
    parsed = JSON.parse(stdinPayload);
  } catch {
    parsed = {};
  }

  // (a) Register with bridge session registry (NEW · CD-108 IARSR fix)
  if (parsed.session_id) {
    try {
      const claudePid = process.ppid;
      await updateSessionLiveIdentity(ulid, parsed.session_id, claudePid);
      log('hook.fire.install', {
        ulid,
        claudeSessionId: parsed.session_id,
        claudePid,
        source: 'register-install',
      });
    } catch (err) {
      process.stderr.write(
        `[scs-hook] install registry update failed: ${(err as Error).message}\n`,
      );
      // non-fatal · continue with legacy path
    }
  }

  // (b) Legacy install tempDir flag (preserved for install-pipeline polling)
  try {
    const registerStatePath = path.join(tempDir, 'register-state.json');
    await writeFile(
      registerStatePath,
      JSON.stringify(
        { status: 'ready', sessionId: parsed.session_id, timestamp: Date.now() },
        null,
        2,
      ),
      'utf8',
    );
  } catch {
    // non-fatal; bridge will detect via polling
  }

  process.exit(0);
}

export async function runScaffoldCompleteSignalHook(opts?: {
  cascadesCount?: number;
  dotClaudeCount?: number;
}): Promise<void> {
  const ulid = process.env.SCS_BRIDGE_ULID;
  const tempDir = process.env.SCS_BRIDGE_INSTALL_TEMP;
  if (!ulid || !tempDir) {
    process.exit(0);
  }
  const flagPath = path.join(tempDir, 'scaffold-done.flag');
  const payload = JSON.stringify({
    done: true,
    timestamp: Date.now(),
    cascadesCount: opts?.cascadesCount ?? 0,
    dotClaudeCount: opts?.dotClaudeCount ?? 0,
  });
  writeFileSync(flagPath, payload);
  process.exit(0);
}

export async function runUserPromptSubmitInstallHook(): Promise<void> {
  const ulid = process.env.SCS_BRIDGE_ULID;
  const tempDir = process.env.SCS_BRIDGE_INSTALL_TEMP;
  if (!ulid || !tempDir) {
    process.exit(0);
  }

  const flagPath = path.join(tempDir, 'installPrimed.flag');
  if (existsSync(flagPath)) {
    process.exit(0);
  }

  writeFileSync(flagPath, '');
  process.stdout.write(PRIMING_PROMPT);
  process.exit(0);
}

/**
 * D3RM-G · CHMH · Chat-Message-Hook · runChatMessageHook
 *
 * Stop hook subprocess registered with asyncRewake: true in spawnSettings.
 * Fires at the END of every assistant turn in a session-mode spawn (matcher '*').
 * Reads the per-session UIMJ queue file (~/.claude/pending-chat/{ulid}.txt) — if
 * non-empty, writes the body to stdout and exits with code 2, which triggers
 * Claude Code's asyncRewake: the model wakes with the stdout content as next
 * user context. The queue file is cleared (unlink) BEFORE the stdout write so
 * a crash mid-stdout cannot cause re-delivery of the same message.
 *
 * If the queue file does not exist OR is empty, exits 0 (no rewake fires).
 * If the env var SCS_BRIDGE_ULID is absent (not a session-mode spawn), exits 0.
 *
 * Citation: D3RM-G-FOUNDATION-R7-FUCHSIA-CLINICAL.md §5 Wave 3 · §4 Hook Structure
 * Citation: D3RM-G-FOUNDATION-R6-PURPLE-ORCHESTRATION.md §4 asyncRewake mechanism
 */
export async function runChatMessageHook(): Promise<void> {
  const ulid = process.env.SCS_BRIDGE_ULID;
  if (!ulid) {
    process.exit(0);
    return;
  }

  const queuePath = pendingChatPath(ulid);
  if (!existsSync(queuePath)) {
    // No pending chat for this session · normal turn-end · no rewake fires.
    process.exit(0);
    return;
  }

  let message: string;
  try {
    const raw = await readFile(queuePath, 'utf8');
    message = raw.trim();
  } catch (err) {
    process.stderr.write(
      `[scs-hook chat-message] read failed: ${(err as Error).message}\n`,
    );
    process.exit(0);
    return;
  }

  if (message.length === 0) {
    // Empty file · no message to inject. Best-effort cleanup; exit clean.
    try {
      await unlink(queuePath);
    } catch {
      // non-fatal
    }
    process.exit(0);
    return;
  }

  // Clear queue BEFORE stdout write · prevents re-delivery on crash mid-write.
  try {
    await unlink(queuePath);
  } catch (err) {
    process.stderr.write(
      `[scs-hook chat-message] unlink failed (non-fatal): ${(err as Error).message}\n`,
    );
  }

  log('hook.fire.chat-message', {
    ulid,
    messageLength: message.length,
  });

  // Inject message + trigger asyncRewake via exit code 2.
  process.stdout.write(message);
  process.exit(2);
}
