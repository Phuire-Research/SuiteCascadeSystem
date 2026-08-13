# SB-DS8 · GitM Worktree + A↔B Turn-Over Tools (the git machinery, from the bridge side)

*Skill added: DF4 · Cycle 677 (2026-07-19) — the 47 `gitm_*` callable tools the bridge owns. The **operator surface** of the same machinery lives in the SCP Researcher's SCP-S19 (CommandHelmAndWorktrees) — this Skill is the callable-tools angle; SCP-S19 is the developer-does angle.*

**What this Skill carries**: the `gitm_*` tool family (worktree Multiplication + the A↔B Tactical Bridge turn-over + git plumbing) as CALLABLE tools reached through the SB-DS7 channel. The bridge owns the git *mechanism* (these qualities); the SCP Researcher's SCP-S19 owns the *operator surface* (the overlay glyphs, the `turnClass`, the birth bar, the Flushed Ring) — the two Suite 8s hold the worktree/turn-over knowledge from two angles.

> **The origin spine**: every `gitm_*` tool carries the optional `originScpName` prop (`GITM_ORIGIN_SCHEMA_PROP`) — the calling SCP name (or absolute package dir) that routes the git op to that SCP's own repo. Omit it and the bridge resolves env-first (SB-DS7). Multi-SCP-safe by construction.

---

## The worktree tool trio (Multiplication, from the bridge side)

Three qualities exposed as `gitm_worktree_{add,list,remove}` (`scsBridgeScpToolRegistration.principle.huirth.ts:1613/1640/1655`):

- **`gitm_worktree_add`** (req `branch`) → `gitmWorktreeAdd`. THE MULTIPLICATION: `git worktree add` from the citizen toplevel into a NEW tree sharing the object store — **A's HEAD is untouched** (the B-hop composition seam; it NEVER writes `.bridge-restart.json` into the A tree). Mints the instance name `${originName}--wt-${slug}`, places a SIBLING citizen dir with its own port (`pickPortFromRegistry`), and re-stamps `scp.config.json {scpName}` so the FKIS origin guard resolves the instance's own dir. **The branch fork** (C652): branch exists → `worktree add <dir> <branch>`; branch absent → `worktree add -b <branch> <dir> HEAD` (mints B-class lineage + tree in one motion). **The async install stage** (C653): a worktree carries only TRACKED files (no `node_modules` → `vite: command not found`), so a NON-BLOCKING `npm install` runs — status `installing` → `pending` (never stuck; a failure still flips to `pending` and surfaces the boot error). The **birth FSM**: register → tree → config → install-start → install-done/failed → pending.
- **`gitm_worktree_list`** → `gitmWorktreeList`. A PURE READ (`git worktree list --porcelain` → `worktrees[]`; no guard, no token, Shortest-Path partial return).
- **`gitm_worktree_remove`** (req `instanceName`) → `gitmWorktreeRemove`. THE DESTRUCTIVE LEG — a WATCHKEY two-call token PARAMSEAL-sealed to the INSTANCE NAME (a token for X can never fire a remove of Y; 2-min expiry). A dirty tree → soft guard `worktree-dirty-use-force` → re-call with `force:true`. On confirmed remove: `removeScpEntry` + `deleteSlice` + `disarmWatchersForScp` retire the citizen. **KEEP BRANCH is the default** — `git worktree remove` retires the TREE; the branch SURVIVES (`git worktree prune`).

### The two flows (the git law)
- **Flow-1 · merge-without-hop**: an instance's branch is checked out in its own tree (git law: a branch lives in one worktree), so the Base merges it directly — `git merge` needs only the TARGET checked out (shared object store, no checkout hop).
- **Flow-2 · delete-frees-the-hop**: after `gitm_worktree_remove` keeps the branch, freed of its worktree the branch becomes normally hoppable/mergeable in the Base.

**→ SCP-S19 Diameter**: SCP-S19 (`CommandHelmAndWorktrees.md §2`) holds the OPERATOR surface — the MULTIPLY control (`fa-copy` HiFi Yellow), the Pewter birth bar (create → register → install → ready), the typed-name DELETE panel, the "a directory is not an SCP" registry gate. A developer reads SCP-S19 to OPERATE; a caller/agent reads THIS Skill to INVOKE.

---

## The A↔B Tactical Bridge turn-over (mechanism, from the bridge side)

The three-class turn-over (Shield · Sword · Sparks) is an operator surface, but its MECHANISM is a small family of gitm qualities the bridge owns, reachable as `tools/call`:

- **`gitm_turn_over_with_source`** → `gitmTurnOverWithSource`. The core motion: resolve `targetBranch` from `source` (`'B'` → `workingBranch`, `'A'` → `stableBranch`), then **`git switch` FIRST, THEN write `.bridge-restart.json`** — the order is load-bearing (a restart before the checkout rebuilds the WRONG branch's code). The write targets `opCwd` (the SCP's own nodemon-watched package dir, origin-aware) so a non-active SCP restarts ITS OWN tree. **Shield (A)** = the return-to-ground path; **Sword (B)** = the experiment seat (the drift vessel — the C414 B-Seal commits carried drift onto B). The **A-guard WATCHKEY** holds an A turn-over that would abandon meaningful drift behind a double-confirm token (PARAMSEAL-sealed to `{source}`), carrying the drift into a fresh `b/` rather than committing onto A.
- **`gitm_revert_to_stable`** → `gitmRevertToStable`. The FAILSAFE — called via `/mcp` during the SCP-down window when B failed to boot (the outer SCS-Bridge process serves `/mcp` independently of the SCP server). Commits B (preserving the user's work) → `git switch` A → writes `.bridge-restart.json { source:'A' }`. This is the clean-slate recovery leg **Sparks (the Hard Turn Over)** rides.
- **The Continuity Law is persisted-first**: a restart RESUMES the last-selected Shield-A because the persisted decision set IS the boot state (auto-induction fires ONLY for the genuinely un-inducted; derived A-registrations are existence-gated by `git rev-parse --verify` — a phantom root leaves A EMPTY, never a phantom write). The bridge writes the turn-over signal through the reducer's ADVANCE partial → the GITEP snapshot → `gitm.json` (the C446 relocation); the SCP field-watcher observes `turnOver.at` advance; `.bridge-restart.json` remains the blunt transition fallback.

**The A↔B + SCP-UPD family** (also callable): `gitm_register_stable` · `gitm_create_working` · `gitm_confirm_success` · `gitm_assign_role` · `gitm_rename_branch` · `gitm_merge_working` · `gitm_reset_ab` (two-call confirm · zeros the A/B machine) · `gitm_run_update` (READ-ONLY 3-way template diff) · `gitm_run_apply` (**HALTs if pending≠0** — the held gate) · `gitm_update_progress` (pure UI stamp).

> **The Diameter split (do not confuse)**: the bridge owns the git motion + the persisted-first boot state + the `.bridge-restart.json`/`gitm.json` writes. The **overlay expression** — the glyphs (`fa-shield-halved`/`fa-khanda`/`fa-bolt`), the register colors (Yellow⊗Blue Sword, Red Sparks), the sticky `turnClass` precedence, the Flushed Ring — is **client-side, in SCP-S19**, NOT in these bridge qualities. Same triad, two sides.

---

## The git plumbing (the remaining `gitm_*`, callable)

Stage/commit/branch/stash/log/diff/merge primitives, each `tools/call`-reachable with the `originScpName` routing: `gitm_stage_file` · `gitm_unstage_file` · `gitm_stage_all` · `gitm_unstage_all` · `gitm_stage_hunk` · `gitm_stage_all_and_commit` · `gitm_commit` · `gitm_commit_amend` · `gitm_branch_create` · `gitm_branch_switch` · `gitm_branch_delete` · `gitm_select_branch` · `gitm_stash_push/pop/list` · `gitm_load_log` · `gitm_load_log_graph` · `gitm_load_diff` · `gitm_load_reflog` · `gitm_load_conflict` · `gitm_resolve_conflict` · `gitm_discard` · `gitm_discard_all` · `gitm_reset` · `gitm_undo` · `gitm_pull` · `gitm_fetch` · `gitm_push` · `gitm_force_push` · `gitm_merge` · `gitm_merge_ff_only` · `gitm_merge_abort`.

**Two guard classes to respect when calling**: **double-confirm-token** (`gitm_worktree_remove`, `gitm_reset_ab` — call twice, the second with the minted token) and **HALT-on-pending** (`gitm_run_apply` refuses while unresolved template-diff entries remain).
