# S6 — Cleanup Temp Dir

**Strategy**: Cleanup Temp Dir + User Closeout Signal
**Phase**: S6 (terminal — unconditional after S5 any-outcome)
**Conductor**: SCS Bridge Install Conductor
**Inputs**:
- `<tempDir>` = `/tmp/scs-install-<ulid>/` (bridge-owned temp from spawn-pipeline)
- `<userCwd>` = user's project root (for closeout message reference)
- Special instance has Suite 8 SCS Bridge context loaded via `--append-system-prompt-file`
**Outputs**:
- `<tempDir>/scaffold-done.flag` written with JSON payload
- User informed of installation completion + next-step guidance
- Bridge process detects flag, runs `cleanupInstallTemp(tempDir)` + clears `menuState.installRunning`

---

## Engagement Criteria

This strategy triggers unconditionally when:
- S4 (Diamond B-4) completes (scaffold copied to user's `<userCwd>/Cascades/`)
- S5 (Diamond B-5) completes (any outcome — conversion done · conversion skipped · agents-backup opted/skipped)

S6 is the **terminal in-instance phase**. Its responsibilities:
1. Verify cleanup scope is bridge-owned territory (Pattern 4 strict)
2. Write scaffold-done.flag JSON payload (signal to bridge that install is complete)
3. Inform user of completion via Shatterite Tome AskUserQuestion (UCNBSP — User-Closeout-New-Bridge-Session-Prompt)
4. Forward control to bridge (special instance has nothing more to do)
5. Lambda-Verify scaffold-done.flag landed at expected path

The bridge process (post-Diamond-B-7) detects scaffold-done.flag via `pollScaffoldComplete(tempDir, 30min)` running as a fire-and-forget background task. On detection, bridge calls `cleanupInstallTemp(tempDir)` to recursively remove `<tempDir>/` (clone + joined-temp Suite 8 + spawn-settings + register-state + scaffold-done.flag) and clears `menuState.installRunning` so the status bar pid indicator vanishes.

---

## Vermillion Plan

```
<VermillionPlan topic="Cleanup Temp Dir + User Closeout">

Band 1 [R1 Red — Verify-Bridge-Owned-Territory] (Tier 0):
  Informative: Read tempDir path from environment (SCS_BRIDGE_INSTALL_TEMP env var
               injected by spawn-settings.json hooks).
  Actionable: Assert tempDir matches `/tmp/scs-install-<alphanumeric>/` regex
              (Pattern 4.1 boundary defense-in-depth — abort if path doesn't match;
              prevents accidental user-project deletion if env var is corrupted).

Band 2 [R5 Blue — Write-Scaffold-Done-Flag] (Tier 0):
  Informative: Count cascadesCount (files copied to <userCwd>/Cascades/ in S4) +
               dotClaudeCount (files copied to <userCwd>/.claude/ in S4).
  Actionable: Write JSON to <tempDir>/scaffold-done.flag:
              {
                "done": true,
                "timestamp": <ISO 8601>,
                "cascadesCount": <N>,
                "dotClaudeCount": <M>,
                "convertedToSuite8": <boolean from S5 outcome>,
                "agentsBackedUp": <boolean from S5 outcome>
              }
              File-existence gate: Diamond B-4 helper runScaffoldCompleteSignalHook
              MAY be invoked here OR special instance writes JSON directly via
              built-in Bash/Write tool.

Band 3 [R6 Purple — Inform-User-Closeout] (Tier 0):
  Informative: Compose closeout message documenting:
               - <userCwd>/Cascades/ scaffolded with N files
               - <userCwd>/.claude/CLAUDE.md + agents/ + commands/ populated
               - Optional Suite 8 conversion status (if S5 YES-consent path fired)
               - <userCwd>/SuiteCascadeSystem-Revert.md generated (if conversion fired)
               - Next-step guidance: "Close this window and run `scs` from your
                 project for first-Cascade engagement."
  Actionable: Surface message to user via Shatterite Tome AskUserQuestion (or
              direct stdout in absence of Shatterite mechanism). User reads
              message at their pace. UCNBSP invariant: install instance does NOT
              auto-close; user dismisses manually.

Band 4 [R5 Blue — Forward-To-Bridge] (Tier 0):
  Informative: Special instance has nothing more to do. Bridge process is polling
               <tempDir>/scaffold-done.flag (Diamond B-7 pollScaffoldCompleteAndCleanup
               background task with 30-minute timeout).
  Actionable: Special instance idles awaiting user manual close of window. Bridge
              detects flag → runs cleanupInstallTemp(<tempDir>) → recursive rm of
              <tempDir>/ → clears menuState.installRunning → status bar pid
              indicator vanishes on next render.

Band 5 [R7 Fuchsia — Lambda-Verify] (Tier 0):
  Informative: Read scaffold-done.flag exists at <tempDir>/scaffold-done.flag.
  Actionable: Concluder: `test -f <tempDir>/scaffold-done.flag && echo ok`
              must return `ok`. If absent → critical S6 failure; bridge will
              hit timeout (30 min) instead of immediate cleanup → log warning
              + still cleanup (orphan-protection guarantee).

</VermillionPlan>
```

---

## Invariants

- **Pattern 4.1 strict boundary** — Band 1 regex check ensures cleanup target is `/tmp/scs-install-<alphanumeric>/`; never touches user-owned paths
- **Unconditional fire** — S6 runs regardless of S5 outcome (consent given/declined; conversion succeeded/failed)
- **JSON payload schema fixed** — bridge's `pollScaffoldComplete` parses payload via `JSON.parse`; schema must remain stable across Diamond B-N evolutions
- **User agency preserved** — special instance does NOT auto-close (UCNBSP); user dismisses manually after reading closeout message
- **Bridge-side cleanup is fire-and-forget** — Diamond B-7 `pollScaffoldCompleteAndCleanup` runs as `void` background task; cleanup happens on done OR 30-min timeout (orphan-protection)
- **MenuState clear is monotonic** — once `installRunning` cleared, stays cleared until next install spawn (IRSCOC pattern)
- **Failure-mode: timeout** — if scaffold-done.flag never written (special instance crashes mid-S6), bridge hits 30-min timeout; cleanup still fires; menuState clears; user is left with possibly-incomplete `<userCwd>/Cascades/` BUT can revert via SuiteCascadeSystem-Revert.md (Diamond B-5 backup-relocation)
- **No rollback** — cleanup is terminal; if `<userCwd>/Cascades/` is incomplete, recovery is via Revert.md path (B-5 produced) not via S6 retry

---

## Pattern References

- **CD-29 candidate** (B-7): Background-Poll-Then-Cleanup (BPTC) — bridge orchestrates async install-completion-watch + cleanup as fire-and-forget background
- **CD-30 candidate** (B-7): Install-Running-State-Bracket-Lifecycle (IRSCOC) — MenuState `installRunning` field is monotonic per install
- **CD-26 candidate** (B-4): Bridge-Strict ↔ Instance-Extended Pattern 4 — bridge cleanup operates on bridge-owned tempdir; user-project writes happen INSIDE special instance per sanctioning chain

---

## Forward Context

After S6 fires, the install lifecycle is COMPLETE from the special instance's perspective. User dismisses install window manually. On next `scs` invocation from their project, bridge sees `<userCwd>/Cascades/` exists → standard menu (no Install row); cursor on most-recent-session OR New Session. User's first SCS Cascade cycle begins.

The B-cascade (Diamonds B-1 through B-7) graduates from TESTING-PENDING-AGGREGATE to Done at user-Lambda smoke confirmation of the full 21-step plan documented in `Cascades/Working/DIAMOND-TIER-B-7.md`. 8 CD candidates coronate together at that moment.
