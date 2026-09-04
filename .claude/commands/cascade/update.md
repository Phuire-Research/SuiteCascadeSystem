Update the Suite Cascade System — pull latest from upstream and merge selectively.

**SCOPE LAW (C1066/C1067 · THE COMPUTER/PROGRAM MODEL).** This Vermillion updates THE COMPUTER — the base system the
SCS ships — in three tiers:
- **THE RECOMMENDED SET (applied together under [A])**: `.claude/CLAUDE.md` (the constitution), `.claude/agents/` (the
  Suite professions, PREFIX-MAPPED), `.claude/commands/cascade/` (the Cascade Commands), `Cascades/Documentation/`
  (the shipped reference), plus the ONE stamp `Cascades/Cascade.json → instructionSet`.
- **THE BASE SUITE 8s — A POINT OF CONFERENCE, NEVER AUTOMATIC**: a Suite 8 is BASE when its directory exists in
  `{source_root}/Cascades/8_SUITES/` AND it is registered in `{source_root}/Cascades/SUITE8-REGISTRY.md`. The base set
  is a MANAGED LIST the user elects from one Suite at a time; it is never inside [A], never applied by default, and an
  elected Suite brings its own registry entry with it. Unregistered directories in the source are HELD BACK (not
  listed). Installed Suite 8s absent from the source are the USER's — never touched, never mentioned as "extra".
- **OUT OF SCOPE (GitM's circuit anor the user's)**: `docs/`, the template SCP, every other Cascade.json key, the
  user's own Suite 8s, `Cascades/Working/`, `Cascades/Extended/`. Never inventoried, never offered, never copied.

Read `Cascades/Cascade.json` for current state.

This command clones the latest SuiteCascadeSystem release to a temporary folder, compares it against the user's current installation, presents a selective merge menu, applies approved changes, creates a backup Forward Pass, cleans up, and asks the user to restart Claude Code.

Execute the following Banded Plan:

---

Band 1 [Red Curator] — Clone and Inventory

1. **Resolve the SOURCE.** The constitution's source is the public GitHub clone of `main` — the release
   procedure publishes GitHub first, then npm, as one act, so the clone and the published package are the
   same revision by construction (RL-2 · the user's ruling). No environment variable selects a different
   source; this step never varies by machine:
   ```
   SRC_ROOT="/tmp/scs-update-$(date +%s)"
   git clone --depth=1 https://github.com/Phuire-Research/SuiteCascadeSystem.git "$SRC_ROOT"
   CLONED=1
   [ -f "$SRC_ROOT/.claude/CLAUDE.md" ] || echo "SOURCE LACKS .claude/CLAUDE.md — the constitution is not in this root"
   ```
   **Two honesty rules.** (a) If the diff shows the constitution SHRINKING anor losing sections, NEVER apply
      such a CLAUDE.md without the user's explicit word — say so in the Band 3 menu. (b) If the clone lacks
      `.claude/CLAUDE.md`, the run says so and does not apply a constitution change this pass.
      `{source_root}` = `$SRC_ROOT` · `{source_kind}` = `clone <short hash>` · `{temp_path}` = `$SRC_ROOT`
      (Band 6 always deletes it now — `CLONED=1` unconditionally).

   1b. **Resolve the INSTRUCTION SET TARGET revision AND verify the clone matches the publish** — the number
      this run will stamp into the user's `Cascades/Cascade.json` (`instructionSet`) once the new
      `.claude/CLAUDE.md` lands. ONE rung, plus the consistency check that guards it:
      ```
      STAMP_TARGET=$(npm view scs-bridge scsMuxameter.instructionSet 2>/dev/null)
      CLONE_COUNTER=$(node -e "console.log(require('{source_root}/package.json').scsMuxameter?.instructionSet ?? '')")
      PUBLISHED_VERSION=$(npm view scs-bridge version 2>/dev/null)
      ```
      **THE CONSISTENCY CHECK**: `{stamp_target}` = `$STAMP_TARGET` — EMPTY → HALT with guidance ("the
      published package carries no instruction-set counter — update the CLI first; nothing to stamp"), never
      a hardcode. Non-empty → it MUST equal `$CLONE_COUNTER`, or HALT ("the source is not the published
      revision — the clone and the npm publish disagree; re-clone or wait for the publish to land"). Only on
      equality does the run proceed. `{stamp_source}` = `npm` (the only value this ladder yields) ·
      `{published_version}` = `$PUBLISHED_VERSION` (shown in the Band 3 menu). Read the user's CURRENT stamp:
      `{stamp_current}` = `Cascades/Cascade.json` → `instructionSet` (a number, or `—` when absent — an
      install that predates the stamp is UNSTAMPED, not behind).

2. Inventory both installations — the user's current files and `{source_root}`:
   - `.claude/CLAUDE.md` — the constitution: `cksum` both sides; line counts; the diff
   - `.claude/agents/` — THE PREFIX MAPPING: the source ships bare names (`r1-curator.md`, `teal-claude.md`); the
     install carries them as `scs-<name>.md`. Compare `{source_root}/.claude/agents/<name>.md` against
     `.claude/agents/scs-<name>.md` PAIRWISE — never treat the prefix as a missing file, never copy a bare name in
     (that duplicates the roster). A source agent with no `scs-` twin is NEW; an installed `scs-` agent with no source
     twin is the user's own — leave it.
   - `.claude/commands/cascade/` — diff command files pairwise (this Vermillion included)
   - `Cascades/Cascade.json` — read the current `instructionSet` stamp ONLY; no other key is compared or merged here
   - `Cascades/Documentation/` — diff pairwise (new · revised · pruned-upstream); part of the recommended set
   - `Cascades/8_SUITES/` — THE BASE SET ONLY: for each directory in `{source_root}/Cascades/8_SUITES/` that is ALSO named in
     `{source_root}/Cascades/SUITE8-REGISTRY.md`, diff against the install (new Suite · new/changed Skills · Instance
     changes); flag LOCAL MODIFICATIONS. Source directories NOT in the registry are held back — do not list them.
     Installed Suite 8s with no source twin are the user's — do not list them.
   - `Cascades/SUITE8-REGISTRY.md` — read only for the base-set gate and for the entry lines an ELECTED Suite carries
   - OUT OF SCOPE: `docs/`, the template SCP, every other Cascade.json key, `Cascades/Working/`, `Cascades/Extended/`

3. Produce a change manifest — categorized:

   | Category | Changed Files | Type |
   |----------|--------------|------|
   | Constitution | `.claude/CLAUDE.md` | The computer's instruction set (the stamp follows it) |
   | Agents | `.claude/agents/scs-*.md` (mapped from the source's bare names) | The Suite professions + the Conductor |
   | Commands | `.claude/commands/cascade/*.md` | The Cascade Commands, this one included |
   | Documentation | `Cascades/Documentation/**` | The shipped reference — recommended set |
   | Base Suite 8s | `Cascades/8_SUITES/<name>/` (registered in the source) | CONFERENCE — a managed list, elected one Suite at a time, never in [A] |

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
║  Source:   {source_kind} · {source_root}                 ║
║  Current:  {current_state}                               ║
║  Instruction set: #{stamp_current} → #{stamp_target}     ║
║             (npm · v{published_version})                 ║
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
║  [A] Apply the recommended set (no S8s)  [Blue]          ║
║  [S] Select individually                 [Green]         ║
║  [V] View diff for a specific file       [Orange]        ║
║  [N] Apply none — cancel update          [Red]           ║
║  [M] Mark instruction set current —      [Purple]        ║
║      stamp #{stamp_target}, copy no files                ║
║                                                          ║
╚══════════════════════════════════════════════════════════╝
</AskUserQuestion>
```

If [S] — present each change one at a time with [Y]es / [N]o / [D]iff options.
If [V] — show the diff for the requested file, then re-present the menu.
If [M] — the user asserts their `.claude/CLAUDE.md` already carries the target revision (a hand-updated
install, a dev lane): skip Band 4 steps 1-2, perform ONLY Band 4 step 3 (the stamp), then Bands 5-6.

**THE SUITE 8 CONFERENCE (after the menu, whenever the base set has any change).** The base Suite 8s are a MANAGED
LIST — the user's, not ours. Present each changed base Suite 8 as its OWN row and take a word per row; default is
NOT elected. No bundle, no "recommended", no silence-as-consent.

```
<AskUserQuestion>
╔══════════════════════════════════════════════════════════╗
║  BASE SUITE 8s — ELECT ONE AT A TIME          [Purple]   ║
║  ─ · ─                                                   ║
{one row per changed base Suite 8: name · NEW anor what changed · [Y]es / [N]o / [D]iff}
║                                                          ║
║  Held back (unregistered in the source): {names or none} ║
║  Yours (not in the source · untouched): {names or none}  ║
╚══════════════════════════════════════════════════════════╝
</AskUserQuestion>
```
Record `{elected_suites}`. An installed base Suite 8 with LOCAL MODIFICATIONS is shown with the flag and its diff
before its word is taken.

---

Band 4 [Blue Professional] — Apply Changes

1. **Checkpoint**: If the project is a git repository with uncommitted changes:
   ```
   git add -A && git commit -m "SCS pre-update checkpoint — $(date +%Y-%m-%d)"
   ```
   If not a git repo, skip. If no uncommitted changes, skip.

2. **Apply**: For each approved change, copy the file from `{source_root}` to the user's installation:
   - For `Cascades/Cascade.json` — NOTHING here. The only write this Vermillion ever makes to it is the stamp in step 3; every other key is GitM's anor the user's.
   - For `.claude/CLAUDE.md` — copy upstream version. If user had local modifications flagged in Band 3, the checkpoint preserves their prior version in git.
   - For `.claude/agents/<name>.md` — copy to `.claude/agents/scs-<name>.md` (THE PREFIX MAPPING); never a bare name.
   - For `.claude/commands/cascade/*.md` — copy pairwise.
   - For `Cascades/Documentation/**` — copy pairwise (part of the recommended set).
   - For `Cascades/8_SUITES/<name>/` — ONLY when `<name>` ∈ `{elected_suites}`: copy the directory; then, if the install's
     `Cascades/SUITE8-REGISTRY.md` lacks that Suite's entry, append the source registry's lines naming it (never copy the
     whole registry — that would register Suites the user declined). A Suite the user did not elect is not touched.
   - Anything else — `docs/`, the template SCP, other Cascade.json keys, the user's own Suite 8s — is never copied by this
     Vermillion; if it appears in a manifest, the inventory overran its scope.

3. **Stamp** — THE SELF-CLEARING LAW'S SECOND HALF. The SCS-Bridge badge measures the project's
   `Cascades/Cascade.json` → `instructionSet` against the published counter; a CLAUDE.md that lands without
   moving the stamp leaves the badge saying "update available" forever. **When `.claude/CLAUDE.md` was applied
   in step 2 — anor the user chose [M]** — set the stamp to `{stamp_target}` (MERGE: every other key preserved):
   ```
   node -e "const fs=require('fs'),p='Cascades/Cascade.json',j=JSON.parse(fs.readFileSync(p,'utf8'));j.instructionSet={stamp_target};fs.writeFileSync(p,JSON.stringify(j,null,2)+'\n')"
   ```
   If CLAUDE.md was NOT applied and [M] was not chosen, do NOT stamp — the stamp describes the file on disk,
   never an intention.

4. **Verify**: Read-back each applied file. Confirm it matches the upstream version (or the merged version for
   Cascade.json). Read back the stamp: `node -e "console.log(require('./Cascades/Cascade.json').instructionSet)"`
   must print `{stamp_target}`.

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
- Documentation: {count} files ({new · revised · pruned})
- Base Suite 8s elected: {elected_suites, or "none"} — a managed list; Conference-elected only, never automatic

## Cascade Position (preserved)
- activeDiamond: {from Cascade.json}
- activeOnyx: {from Cascade.json}
- cyclePosition: {from Cascade.json}
- instructionSet: #{stamp_target} (stamped this run · source: {stamp_source}; was #{stamp_current})

## To Resume
Read this file to restore context after the update.
Your Diamond and Onyx are unchanged — the update applied
system files only. Your project state is preserved.
```

---

Band 6 [Fuchsia Clinician] — Cleanup and Restart

1. **Delete** the temporary clone — ONLY when `CLONED=1` (a `file://` source root is the installed package
   anor the dev repo and is NEVER deleted):
   ```
   [ "$CLONED" = 1 ] && rm -rf "{temp_path}"
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
   ║  Instruction set stamped #{stamp_target} — the SCS-Bridge║
   ║  badge clears on the next page load.                     ║
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
