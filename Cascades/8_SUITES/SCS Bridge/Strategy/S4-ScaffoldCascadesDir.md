# S4 — Scaffold Cascades Dir

**Strategy**: Scaffold Cascades Dir
**Phase**: S4 (first write into user-owned project root)
**Conductor**: SCS Bridge Install Conductor
**Refined**: Diamond B-4 (59-line skeleton → 7-Band Vermillion plan)
**Input**: clonedRepoPath (bridgeRoot/install-temp/), userCwd, sessionContext from B-3
**Output**:
  - `<userCwd>/Cascades/` populated per Pattern 3 filter
  - `<userCwd>/.claude/CLAUDE.md`, `.claude/agents/`, `.claude/commands/` populated
  - `scaffold-done.flag` written to `<bridgeTempDir>/` (bridge-side polling gate)

---

## Engagement Criteria

S4 is invoked by the Conductor when:
- S3 Concluder passes (`test -d <bridgeRoot>/install-temp/Cascades && echo ok` returned `ok`)
- `SCS_BRIDGE_ULID` and `SCS_BRIDGE_INSTALL_TEMP` env vars are present (special instance context)
- Band 2 Shatterite Tome AskUserQuestion confirms target `<userCwd>` (deferred mechanism; see B-6)

S4 does NOT fire if S3 Concluder failed or user declined at Band 2 conference.

---

## Inputs

| Input | Source | Notes |
|---|---|---|
| `clonedRepoPath` | `process.env.SCS_BRIDGE_INSTALL_TEMP` (parent dir) | Path to bridge-owned clone temp dir |
| `userCwd` | `process.cwd()` inside special instance | User's project root — Pattern 4 Extended |
| `bridgeTempDir` | `process.env.SCS_BRIDGE_INSTALL_TEMP` | Where `scaffold-done.flag` is written |
| `sessionContext` | Passed from B-3 spawn arguments | sessionId, ulid for correlation |

---

## Outputs

| Output | Path | Notes |
|---|---|---|
| Cascades scaffold | `<userCwd>/Cascades/` | Full tree per Pattern 3 filter; Working/Lab/Bridge = .gitkeep only |
| CLAUDE.md | `<userCwd>/.claude/CLAUDE.md` | SCS manifest template |
| Agents | `<userCwd>/.claude/agents/` | 9 r-agents + teal-claude |
| Commands | `<userCwd>/.claude/commands/` | 16+ /cascade:* command definitions |
| Completion signal | `<bridgeTempDir>/scaffold-done.flag` | Bridge polls this; existence = S4 done |

---

## Vermillion Plan

```
<VermillionPlan topic="Scaffold Cascades Dir">

Band 1 [R1 Red — Curate] (Tier 0):
  Informative: Recursively list <clonedRepoPath>/Cascades/ and <clonedRepoPath>/.claude/
               to produce in-memory file manifest; enumerate dirs + files with relative paths;
               note .gitkeep file presence in Working/, Lab/, Bridge/
  Actionable: Build COPY_MANIFEST (array of {src, dest} pairs) applying Pattern 3 filter
              (see Band 3 Filter Table); log total file count for Band 6 Concluder baseline

Band 2 [R6 Purple — Conference] (Tier 0):
  Informative: Read userCwd from sessionContext; check existsSync(<userCwd>/Cascades)
  Actionable: If <userCwd>/Cascades already exists:
                Dispatch Shatterite Tome AskUserQuestion (mechanism deferred to B-6):
                "Cascades/ already exists at <userCwd>. Proceed: [Abort] [Merge — additive only] [Overwrite]"
                Default = Abort (safe); user must explicitly choose Merge or Overwrite
              If <userCwd>/Cascades does NOT exist: proceed to Band 3
  Conference: AskUserQuestion — pre-existing Cascades/ conflict resolution
              Band 2 checks sessionContext for Shatterite-confirmed target path
              (mechanism actualized at B-6); if absent, Band 2 defaults to Abort —
              no materialization proceeds without this gate

Band 3 [R1 Red — Filter] (Tier 0):
  Informative: Read COPY_MANIFEST from Band 1; apply COPY/NOT-COPY filter table below
  Actionable: Produce FILTERED_MANIFEST (final set of files to copy); log excluded count

  COPY/NOT-COPY Filter Table (Scaffold-Source-Territory-vs-Target-Territory-Diameter):

  COPY:
  - Cascades/8_SUITES/**          — full Suite 8 tree (all configs, strategies, skills)
  - Cascades/Documentation/**     — all spec + reference files
  - Cascades/CHANGELOG.md         — project history scaffold
  - Cascades/SUITE8-REGISTRY.md   — SCS artifact registry
  - Cascades/Cascade.template.json → COPY AS Cascades/Cascade.json
                                    (renamed during copy; template has cycle:0 / activeDiamond:null
                                     / colorSelectionComplete:false for fresh install)
  - Cascades/Working/.gitkeep     — placeholder only (Pattern 3: Working-Lab-Bridge-GitKeep-Placeholder-Preservation)
  - Cascades/Lab/.gitkeep         — placeholder only (Pattern 3)
  - Cascades/Bridge/.gitkeep      — placeholder only (Pattern 3)
  - .claude/CLAUDE.md             — SCS manifest template
  - .claude/agents/**             — all R-agents + teal-claude
  - .claude/commands/**           — all /cascade:* command definitions

  DO NOT COPY:
  - Cascades/Cascade.json                 — live SCS dev state; NEVER copy (use Cascade.template.json instead)
  - Cascades/Working/* (except .gitkeep)  — 179 dev WGB files; private to SCS dev cycle
  - Cascades/Bridge/sessions.json         — bridge-owned transient session state
  - Cascades/Bridge/debug.log             — bridge-owned transient log
  - Cascades/assets/**                    — SCS reference repo media; not part of user scaffold
  - Cascades/.DS_Store                    — OS metadata; never copy
  - src/**                                — bridge-internal source; user's project owns root
  - package.json                          — bridge-internal; user project owns root package
  - .github/**                            — bridge-internal CI config
  - dist/**                               — bridge build artifacts; never copy
  - node_modules/**                       — never copy
  - Cascades/Lab/* (except .gitkeep)      — gitignored per .gitignore:33-35; user creates own lab
  - Joined-temp Suite 8 .md file          — lives in /tmp/<temp-uuid>/ NOT in clone Cascades/8_SUITES/;
                                            never present in clonedRepoPath by design
  - Symlinks                              — PROHIBITED; all copies are independent files
                                            (clone is removed at B-7; target must be self-contained)

Band 4 [R5 Blue — Copy Cascades] (Tier 0):
  Informative: Read FILTERED_MANIFEST; verify <userCwd> parent is writable (existsSync + test write)
  Actionable: fs.mkdirSync(<userCwd>/Cascades, { recursive: true });
              For each {src, dest} in FILTERED_MANIFEST where dest starts with Cascades/:
                fs.mkdirSync(dirname(dest), { recursive: true });
                if src ends with Cascade.template.json:
                  dest = <userCwd>/Cascades/Cascade.json  (rename during copy)
                else:
                  dest = <userCwd>/dest
                fs.copyFileSync(src, dest);
              Verify file count post-copy matches FILTERED_MANIFEST Cascades/ subset length

Band 5 [R7 Fuchsia — Lambda Verify] (Tier 0):
  // Diamond B-10: Band 5 [Copy DotClaudeFragments] DROPPED. .claude/ scaffold + timestamped
  // CLAUDE.md backup is now bridge-side (installSpawn.ts scaffoldUserDotClaude) per CD-36
  // candidate (Bridge-Post-Confer-Pre-Spawn-Scaffold-Authority). Bridge runs scaffoldUserDotClaude
  // AFTER trust-confer-confirm but BEFORE spawnInstallInstance, so by the time S4 runs in the
  // special instance, <userCwd>/.claude/ is already populated. S4 in-instance only handles
  // <userCwd>/Cascades/ scaffold copy. This was a Band 6 in the old layout; renumbered to Band 5.

(Old Band 6 was Lambda Verify; Old Band 7 was Signal Complete — see new Band 5 + Band 6 below)

Band 5 [R7 Fuchsia — Lambda Verify] (Tier 0) [renumbered from old Band 6]:
  Informative: Read post-copy filesystem state; probe three key Concluder paths
  Actionable: Concluder 1: test -d <userCwd>/Cascades/8_SUITES && echo ok
              Concluder 2: test -f <userCwd>/.claude/CLAUDE.md && echo ok
              Concluder 3: wc -l <userCwd>/Cascades/Cascade.json (must return >0)
              If ANY Concluder fails:
                Remove <userCwd>/Cascades/ partial (fs.rmSync recursive:true)
                Emit scaffold-failed diagnostic with Concluder index + path
                Abort S4; do NOT write scaffold-done.flag
                Bubble error to Conductor for B-7 cleanup gate

Band 6 [R1 Red — Signal Complete] (Tier 0) [renumbered from old Band 7]:
  Informative: Read Band 6 Concluders all-pass state
  Actionable: Write scaffold-done.flag to <bridgeTempDir>/scaffold-done.flag
              Payload (JSON diagnostic):
                { done: true, timestamp: Date.now(), cascadesCount: N, dotClaudeCount: M }
              fs.writeFileSync(<bridgeTempDir>/scaffold-done.flag, JSON.stringify(payload));
              Log: "S4 complete — scaffold-done.flag written; bridge polling gate open"

</VermillionPlan>
```

---

## Invariants

1. **Symlinks PROHIBITED**: every copy operation uses `fs.copyFileSync` (hard copy). Clone is ephemeral
   (removed at B-7); target territory must be fully self-contained and independent of source.

2. **Pattern 1 User-Sanctioning Chain**: S4 executes only after all four sanctioning links have fired —
   (a) user selected Install, (b) special instance spawned + priming prompt observed,
   (c) Band 2 checks sessionContext for Shatterite-confirmed target path (mechanism actualized at
   B-6); if absent, Band 2 defaults to **Abort** — no materialization proceeds without this gate;
   confirmation does NOT silently fire; absence of explicit user consent → S4 stops without partial
   scaffold, (d) S4 materialization executes on user's behalf. Bridge process never writes to
   `<userCwd>/`. Only the user-engaged special instance does.

3. **GitKeep-Only for Working/Lab/Bridge**: these three directories each receive exactly one file
   (`Cascades/Working/.gitkeep`, `Cascades/Lab/.gitkeep`, `Cascades/Bridge/.gitkeep`). Their content
   files (WGB docs, bridge sessions, lab experiments) NEVER transfer. Authority: `.gitignore` lines
   30-35 (Working + Lab policy) + Bridge transient rule.

4. **Cascade.template.json → Cascade.json rename**: Band 4 copies `Cascade.template.json` from source
   as `Cascade.json` in the user's `<userCwd>/Cascades/`. The live SCS dev `Cascade.json`
   (cycle: 26, activeDiamond pointing to B-4 WGB) is NEVER copied. The template has
   `cycle: 0 / activeDiamond: null / colorSelectionComplete: false` — correct initial state
   for a fresh install. SM-ColorSelect fires on first session.

5. **scaffold-done.flag is ONE-WAY signal**: the special instance writes it once after Band 6 Concluders
   all-pass. Idempotent re-write on retry is safe (bridge reads latest; timestamp advances).
   If S4 aborts before Band 6, flag is never written; bridge keeps polling until timeout
   (bridge surfaces diagnostic + aborts B-7 cleanup).

6. **Band 6 Lambda-Verify failure aborts S4 entirely**: no partial scaffold is left.
   `<userCwd>/Cascades/` is removed if any Concluder fails. `.claude/` fragments from Band 5
   are left in place (Claude Code creates `.claude/` itself; removing it risks harming user's
   existing session config). Only the Cascades/ tree is atomically removed on failure.

---

## Failure Modes + Rollback

| Failure | Detection | Response |
|---|---|---|
| Pre-existing `<userCwd>/Cascades/` | Band 2 existsSync check | Defer to Band 2 AskUserQuestion (Abort/Merge/Overwrite); default Abort |
| Disk full during copy | fs.copyFileSync throws ENOSPC | Catch error; remove partial `<userCwd>/Cascades/`; emit disk-full diagnostic; abort without writing flag |
| Permission denied (`<userCwd>` not writable) | fs.mkdirSync or fs.copyFileSync throws EACCES | Remove partial if any; emit permission-denied diagnostic with `<userCwd>` path; abort |
| Band 6 Concluder failure | test/wc return non-ok | Remove `<userCwd>/Cascades/` partial; emit Concluder index + expected path; abort; do NOT write flag |

All rollbacks are scoped to `<userCwd>/Cascades/` only. `.claude/` fragments remain (preserves any
pre-existing user `.claude/` state not covered by S4 files).

---

## Forward to S5

S5 precondition: `test -f <bridgeTempDir>/scaffold-done.flag`. S5 reads flag presence at startup.
If S4 aborted (flag absent), Conductor skips S5 and routes to S6 cleanup with failure diagnostic.
S5 Convert phase may overwrite `<userCwd>/.claude/CLAUDE.md` that S4 placed — this is intended
(S4 installs the SCS template; S5 optionally customizes it with user's prior CLAUDE.md content).
