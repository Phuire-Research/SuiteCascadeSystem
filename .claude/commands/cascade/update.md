Update the Suite Cascade System — pull latest from upstream and merge selectively.

Read `Cascades/Cascade.json` for current state.

This command clones the latest SuiteCascadeSystem release to a temporary folder, compares it against the user's current installation, presents a selective merge menu, applies approved changes, creates a backup Forward Pass, cleans up, and asks the user to restart Claude Code.

Execute the following Banded Plan:

---

Band 1 [Red Curator] — Clone and Inventory

1. Clone the latest SuiteCascadeSystem to a temporary directory:
   ```
   git clone https://github.com/Phuire-Research/SuiteCascadeSystem.git /tmp/scs-update-$(date +%s)
   ```
   Store the temp path for later cleanup.

2. Inventory both installations — the user's current files and the upstream clone:
   - `.claude/CLAUDE.md` — compare line counts and last-modified sections
   - `.claude/agents/` — diff agent names and contents
   - `.claude/commands/cascade/` — diff command files
   - `Cascades/8_SUITES/` — diff Suite 8 directories (Instance.md, Skill.md per suite)
   - `Cascades/SUITE8-REGISTRY.md` — compare entries
   - `Cascades/Cascade.json` — compare schema (preserve user's state, note new fields)
   - `Cascades/Documentation/` — diff documentation files
   - `docs/` — diff GitHub Pages files

3. Produce a change manifest — categorized:

   | Category | Changed Files | Type |
   |----------|--------------|------|
   | System | `.claude/CLAUDE.md`, agents, commands | Core methodology |
   | Suite 8s | New or modified Suite 8 instances | Domain extensions |
   | Documentation | ARIOS-POSITION, specs, README | Reference material |
   | Assets | Images, GitHub Pages | Visual/demo |

---

Band 2 [Orange Prospector] — Name the Changes

For each changed file, produce a one-line description of WHAT changed and WHY it matters. Name any new Suite 8s, new commands, new agents, or structural changes to the CLAUDE.md manifold.

Flag files where the user has LOCAL MODIFICATIONS that would be overwritten — these require Conference.

---

Band 3 [Green Sculptor] — Selection Menu

Present the change manifest via AskUserQuestion. The user selects which changes to apply:

```
<AskUserQuestion>
╔══════════════════════════════════════════════════════════╗
║  SCS UPDATE                                 [Yellow]     ║
║  ─ · ─                                                   ║
║  Upstream: {upstream_commit_hash} ({upstream_date})      ║
║  Current:  {current_state}                               ║
║                                                          ║
║  Changes Available                                       ║
║  ─ · ─                                                   ║
{change_list — each with checkbox-style selection}
║                                                          ║
║  Conflict Warnings                                       ║
║  ─ · ─                                                   ║
{files_with_local_modifications}
║                                                          ║
║  Options                                                 ║
║  ─ · ─                                                   ║
║  [A] Apply all changes                   [Blue]          ║
║  [S] Select individually                 [Green]         ║
║  [V] View diff for a specific file       [Orange]        ║
║  [N] Apply none — cancel update          [Red]           ║
║                                                          ║
╚══════════════════════════════════════════════════════════╝
</AskUserQuestion>
```

If [S] — present each change one at a time with [Y]es / [N]o / [D]iff options.
If [V] — show the diff for the requested file, then re-present the menu.

---

Band 4 [Blue Professional] — Apply Changes

1. **Checkpoint**: If the project is a git repository with uncommitted changes:
   ```
   git add -A && git commit -m "SCS pre-update checkpoint — $(date +%Y-%m-%d)"
   ```
   If not a git repo, skip. If no uncommitted changes, skip.

2. **Apply**: For each approved change, copy the file from the temp clone to the user's installation:
   - For `Cascades/Cascade.json` — MERGE, do not overwrite. Preserve user's `activeDiamond`, `activeOnyx`, `suiteColors`, `cyclePosition`, `automata` state. Only add NEW fields from upstream that the user's version lacks.
   - For `.claude/CLAUDE.md` — copy upstream version. If user had local modifications flagged in Band 3, the checkpoint preserves their prior version in git.
   - For all other files — copy from temp to user's installation.

3. **Verify**: Read-back each applied file. Confirm it matches the upstream version (or the merged version for Cascade.json).

---

Band 5 [Purple Orchestrator] — Backup Forward Pass

Create a backup Forward Pass compaction prompt — a self-contained summary the user can paste into a new Claude Code session if needed to restore context:

Write to `Cascades/Working/SCS-UPDATE-FORWARD-PASS.md`:

```
# SCS Update Forward Pass — {date}

## What Changed
{list of files updated with one-line descriptions}

## Prior State (preserved in git)
Checkpoint commit: {commit_hash or "no git repo"}

## Current State
- CLAUDE.md: {upstream version identifier}
- Agents: {count} ({list any new agents})
- Commands: {count} ({list any new commands})
- Suite 8s: {count} ({list any new Suite 8s})

## Cascade Position (preserved)
- activeDiamond: {from Cascade.json}
- activeOnyx: {from Cascade.json}
- cyclePosition: {from Cascade.json}

## To Resume
Read this file to restore context after the update.
Your Diamond and Onyx are unchanged — the update applied
system files only. Your project state is preserved.
```

---

Band 6 [Fuchsia Clinician] — Cleanup and Restart

1. **Delete** the temporary clone:
   ```
   rm -rf {temp_path}
   ```

2. **Present restart prompt**:
   ```
   <AskUserQuestion>
   ╔══════════════════════════════════════════════════════════╗
   ║  SCS UPDATE COMPLETE                      [Fuchsia]     ║
   ║  ─ · ─                                                   ║
   ║  {N} files updated. Checkpoint: {commit_hash or "none"} ║
   ║  Forward Pass: Cascades/Working/SCS-UPDATE-FORWARD-PASS.md║
   ║  Temporary clone deleted.                                ║
   ║                                                          ║
   ║  Please restart Claude Code for changes to take effect.  ║
   ║  The CLAUDE.md manifold and agent definitions reload     ║
   ║  on session start.                                       ║
   ║                                                          ║
   ║  After restart, your Diamond and Onyx are unchanged.     ║
   ║  Type /cascade to verify the update.                     ║
   ║                                                          ║
   ╚══════════════════════════════════════════════════════════╝
   </AskUserQuestion>
   ```
