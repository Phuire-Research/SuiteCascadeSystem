# S5 — Convert CLAUDE.md to Suite 8

**Strategy**: Convert CLAUDE.md to Suite 8 Instance (Optional Path)
**Phase**: S5 (consent-gated — user opt-in only)
**Conductor**: SCS Bridge Install Conductor
**Input**: `/tmp/<temp-uuid>/user-CLAUDE.md.bak` (pre-install snapshot from B-3); `/tmp/<temp-uuid>/agents.bak/` (pre-install agents snapshot from B-3, if present); `SCS_BRIDGE_INSTALL_TEMP` env → temp dir path
**Output**: `<userCwd>/Cascades/8_SUITES/<UserDomain>/Instance.md` + optional `Skill.md`; `<userCwd>/SuiteCascadeSystem-Revert/CLAUDE.md.bak`; `<userCwd>/SuiteCascadeSystem-Revert/agents.bak/` (if agents present); `<userCwd>/SuiteCascadeSystem-Revert.md`
**Pattern**: Pre-Install-Agents-Backup-With-Consent-Gated-Relocation (PIABCGR)

---

## Engagement Criteria

This strategy triggers when:
- S4 scaffold Concluder passes AND install pipeline proceeds to optional path

If the user declines conversion at Band 2: Bands 3–6 are skipped entirely. Band 7
[Generate-Revert-Doc] fires unconditionally — it documents the current install state
whether or not conversion was performed.

S5 converts the user's prior CLAUDE.md content (read from the B-3 pre-install backup,
not from the live file) into a new Suite 8 Instance.md. The project-root
`<userCwd>/CLAUDE.md` is NEVER modified by S5 — it remains intact so the user's prior
context continues loading alongside the SCS `.claude/CLAUDE.md`. Backup relocation
moves the B-3 `/tmp/` copies to a user-owned persistent path only on the consent path.

---

## Vermillion Plan

```
<VermillionPlan topic="Convert CLAUDE.md to Suite 8 (Optional Path)">

Band 1 [R1 Red — Curate] (Tier 0):
  Informative: Read CLAUDE.md backup from `/tmp/<temp-uuid>/user-CLAUDE.md.bak`
               (path from `SCS_BRIDGE_INSTALL_TEMP` env + 'user-CLAUDE.md.bak' join);
               check whether backup exists (`backupExists = existsSync(backupPath)`);
               probe `/tmp/<temp-uuid>/agents.bak/` presence (`agentsBackupPresent`);
               derive candidate Suite 8 domain name from backup content (first H1 or
               project-name heuristic; fallback = 'MyProject')
  Actionable: Document read result: backupExists (true/false), agentsBackupPresent
              (true/false), candidateName; carry forward into Band 2 context

Band 2 [R6 Purple — Conference] (Tier 0):
  Informative: Read Band 1 result: backupExists, candidateName;
               if backupExists = false: note = "no prior CLAUDE.md found — conversion
               will create a Suite 8 from a blank template"
  Actionable: Dispatch Shatterite Tome AskUserQuestion:
              "Convert your prior CLAUDE.md to a Suite 8 Instance?
               [Y] Yes — migrate content to Cascades/8_SUITES/<name>/Instance.md
               [N] No  — skip conversion; SuiteCascadeSystem-Revert.md will still be written"
              If Y → proceed to Band 3
              If N → skip Bands 3–6; proceed directly to Band 7
  Conference: AskUserQuestion — conversion consent gate (hard pre-condition)

Band 3 [R6 Purple — Conference] (Tier 0):
  Informative: Read confirmed-YES from Band 2; read candidateName from Band 1
  Actionable: Dispatch Shatterite Tome AskUserQuestion:
              "Name your Suite 8 (default: <candidateName>)"
              Capture confirmed name (empty input → use candidateName as default)
  Conference: AskUserQuestion — Suite 8 name confirmation

Band 4 [R5 Blue — Build — Convert] (Tier 0):
  Informative: Read confirmed Suite 8 name from Band 3; read backup content from
               `/tmp/<temp-uuid>/user-CLAUDE.md.bak` (or use blank template if
               backupExists = false); verify `<userCwd>/Cascades/8_SUITES/<name>/`
               does not yet exist
  Actionable: mkdir `<userCwd>/Cascades/8_SUITES/<name>/`;
              Write `<userCwd>/Cascades/8_SUITES/<name>/Instance.md` with backup
              content (no modification to `<userCwd>/CLAUDE.md` — project-root untouched);
              Write minimal `<userCwd>/Cascades/8_SUITES/<name>/Skill.md` scaffold
              (placeholder: "# <name> Skills\n\n_Skills to be defined._")
  Concluder: test -f `<userCwd>/Cascades/8_SUITES/<name>/Instance.md` && echo ok

Band 5 [R5 Blue — Build — Backup Relocate CLAUDE.md] (Tier 0):
  Informative: Verify Band 4 Concluder passed; read `/tmp/<temp-uuid>/user-CLAUDE.md.bak`
               path (backupExists = true required; if false, skip relocation silently)
  Actionable: mkdir -p `<userCwd>/SuiteCascadeSystem-Revert/`;
              cp `/tmp/<temp-uuid>/user-CLAUDE.md.bak`
                 → `<userCwd>/SuiteCascadeSystem-Revert/CLAUDE.md.bak`
              (cp semantics — `/tmp/` copy survives until B-7 S6 cleanup)
  Concluder: test -f `<userCwd>/SuiteCascadeSystem-Revert/CLAUDE.md.bak` && echo ok

Band 6 [R5 Blue — Build — Backup Relocate Agents] (Tier 0):
  Informative: Read agentsBackupPresent from Band 1; if false, skip Band 6 entirely;
               verify `/tmp/<temp-uuid>/agents.bak/` exists (guard against race)
  Actionable: cp -R `/tmp/<temp-uuid>/agents.bak/`
                    → `<userCwd>/SuiteCascadeSystem-Revert/agents.bak/`
              (cp semantics — `/tmp/` copy survives until B-7 cleanup)
              Pattern: Pre-Install-Agents-Backup-With-Consent-Gated-Relocation (PIABCGR)
  Concluder: test -d `<userCwd>/SuiteCascadeSystem-Revert/agents.bak` && echo ok

Band 7 [R7 Fuchsia — Verify + Generate Revert Doc] (Tier 0):
  Informative: Read template from
               `Cascades/8_SUITES/SCS Bridge/Strategy/templates/SuiteCascadeSystem-Revert.md.template`
               (verify template exists; if missing → use hardcoded fallback inline);
               Assemble 7 variable values from install context:
               TIMESTAMP, USER_PROJECT_PATH, BACKUP_CLAUDE_MD_PATH, BACKUP_AGENTS_PATH,
               CONVERSION_DESTINATION, CASCADES_DIR, INSTALL_VERSION
               For NO-consent path: BACKUP_CLAUDE_MD_PATH renders as
               "(backup exists at /tmp/<temp-uuid>/user-CLAUDE.md.bak — ephemeral,
                will be removed at SCS install cleanup)"
  Actionable: Render template via Node.js String.replaceAll chain (no library dependency);
              CRITICAL: verify rendered string contains no unresolved slots —
              `if (rendered.includes('{{')) throw new Error('Revert.md template has unresolved variable slots')`;
              Write rendered string to `<userCwd>/SuiteCascadeSystem-Revert.md`
  Concluder: test -f `<userCwd>/SuiteCascadeSystem-Revert.md` && echo ok;
             grep -c '{{' `<userCwd>/SuiteCascadeSystem-Revert.md` → must return 0

</VermillionPlan>
```

---

## Invariants (7 entries)

1. **Consent gate is hard pre-condition**: No write to `<userCwd>/Cascades/8_SUITES/<UserDomain>/` or
   `SuiteCascadeSystem-Revert/` occurs until Band 2 AskUserQuestion returns YES. The NO-consent path
   skips Bands 3–6 and proceeds directly to Band 7.

2. **Project-root CLAUDE.md untouched throughout S5**: S5 NEVER writes to `<userCwd>/CLAUDE.md`.
   The project-root file is not a target of any Band. The Revert.md explicitly documents:
   "your project-root CLAUDE.md was not modified by SCS."

3. **Backup source is pre-install snapshot**: Band 1 reads from `/tmp/<temp-uuid>/user-CLAUDE.md.bak`
   (B-3 pre-install copy), not from the live `<userCwd>/CLAUDE.md`. This decouples S5 from any
   user edits made after B-4.

4. **Relocation is cp-semantics (not mv)**: `/tmp/` backup survives until B-7 S6 cleanup. The
   user-owned copy at `SuiteCascadeSystem-Revert/CLAUDE.md.bak` is independent. Band 7 documents
   the ephemeral window for the `/tmp/` path on the NO-consent path.

5. **Band 7 fires unconditionally**: Even if user declined conversion at Band 2, Band 7 renders
   and writes `SuiteCascadeSystem-Revert.md`. The NO-consent Revert.md documents: what SCS installed,
   that project-root CLAUDE.md was unchanged, the ephemeral `/tmp/` backup location and window,
   and how to manually remove SCS files if desired.

6. **Template variables must be fully resolved**: Band 7 verifies no `{{` substring remains in
   rendered output before writing. Unresolved slot = throw + diagnostic. This is the Lambda Concluder
   for template rendering integrity.

7. **B-3 fold-back agents backup is unconditional**: `backupUserDotClaudeAgents` in `installSpawn.ts`
   runs before spawn (alongside `backupUserClaudeMd`). Absence of `.claude/agents/` at B-3 time is
   safe — function returns `{ backupPath: '', originalExists: false }`. Band 6 checks `agentsBackupPresent`
   before attempting relocation and skips cleanly if false.

---

## Failure Modes + Rollback

| Failure | Detection | Response |
|---|---|---|
| User aborts at Band 2 (no consent) | AskUserQuestion returns NO | Skip Bands 3–6; Band 7 fires with NO-consent variable values |
| Backup source missing (no B-3 backup) | `existsSync(backupPath)` false at Band 1 | Band 2 notes "no prior CLAUDE.md"; offer blank-template conversion or skip |
| Disk full at Band 4 (Instance.md write) | ENOSPC on writeFileSync | Remove partial `<userCwd>/Cascades/8_SUITES/<name>/`; emit diagnostic; proceed to Band 7 |
| Permission denied at Band 4 or 5 | EACCES on mkdir or copyFileSync | Report path + action; abort conversion Bands 4–6; Band 7 still fires with diagnostic note |
| Template file missing at Band 7 | existsSync returns false | Emit diagnostic; generate inline minimal Revert.md from hardcoded fallback content |
| Unresolved slot at Band 7 | `rendered.includes('{{')` | throw + diagnostic before writeFileSync; never write partial template |

---

*Strategy Version: 2.0 (Diamond B-5) · S5 expanded 74→167 lines · 7-Band Vermillion · Yellow Binding: Issue 1 = Option B Additive (project-root CLAUDE.md untouched) · Issue 2 = Option D (agents backup at B-3, relocation at B-5 Band 6) · Pattern: PIABCGR*
