/**
 * D3D · UPSH · UserPromptSubmit-Hook-General
 *
 * Fires on every user prompt submission in session-mode spawns. Mirrors the
 * stopHook.ts structure for ULID gate, stdin parse, and registry update — but
 * deliberately OMITS the HAZARD-E SubagentStop filter. UserPromptSubmit does
 * NOT fire on subagent events; the filter at stopHook.ts:L89-92 is Stop-specific
 * only. Do NOT add `hook_event_name !== 'Stop'` discrimination here.
 *
 * CDH discipline (HAZARD-Y): the subcommand string `user-prompt-submit`
 * (vs `user-prompt-submit-install`) is the context discriminator baked at
 * spawn time. This file handles only session-mode UPSH. No runtime branching
 * needed — architectural separation enforced at spawn command construction in
 * spawnSettings.buildSpawnSettings().
 *
 * Closes TPHP (Turn-Phase-Hook-Pair): UPSH (open boundary, isProcessing=true)
 * + JTCH (close boundary, isProcessing=false) = full turn observation.
 *
 * Citation: D3D-FOUNDATION-R2-ORANGE-PROSPECTING.md §UPSH · §CDH
 * Citation: D3D-ARCHITECTURE-R3B-YELLOW-SERVER-SUBSTRATE.md §S3
 */

import { readStdin } from './sessionStartHook';
import { setDebugEnabled, log } from './debugLog';
import { updateSessionProcessingState } from './registry';

interface UserPromptSubmitPayload {
  session_id?: string;
  transcript_path?: string;
  cwd?: string;
  hook_event_name?: string;
}

export async function runUserPromptSubmitHook(): Promise<void> {
  const ulid = process.env.SCS_BRIDGE_ULID;
  if (!ulid) {
    log('upsh.no-ulid', {});
    process.exit(0);
  }

  if (process.env.SCS_BRIDGE_DEBUG === '1') setDebugEnabled(true);

  console.log('[SCS-Bridge UPSH] hook fired · ulid=', ulid);

  let stdinPayload: string;
  try {
    stdinPayload = await readStdin();
  } catch {
    process.exit(0);
  }

  let parsed: UserPromptSubmitPayload = {};
  try {
    parsed = JSON.parse(stdinPayload);
  } catch (err) {
    log('upsh.parse-failed', { err: String(err) });
    process.exit(0);
  }

  // NO HAZARD-E SubagentStop filter — UserPromptSubmit does not fire on subagent events.
  // The hook_event_name check from stopHook.ts:L89-92 is Stop-specific.
  // Citation: D3D-FOUNDATION-R2-ORANGE-PROSPECTING.md §UPSH (clause 3)

  const lastUserSubmitAt = Date.now();

  try {
    await updateSessionProcessingState(ulid, {
      isProcessing: true,
      lastUserSubmitAt,
    });
    console.log(
      '[SCS-Bridge UPSH] Processing state set · ulid=',
      ulid,
      '· lastUserSubmitAt=',
      lastUserSubmitAt,
    );
    log('upsh.processing-set', { ulid, lastUserSubmitAt });
  } catch (err) {
    log('upsh.update-failed', { err: String(err) });
  }

  process.exit(0);
}
