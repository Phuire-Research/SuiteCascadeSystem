> **RETARGETED (C784 · the Install BreakOut)**: S7 now runs at **Step 6** (after the SCP
> installs and boots). The muxified project content becomes the domain Suite 8 **IN THE
> INSTALLED SCP** — minted via `POST /s8/create` (SCP-local · C724), the content landing in
> the SCP-local Instance/Extended ground. NEVER the workspace-root Cascades/8_SUITES/.
> On a blank slate S7 is a no-op (nothing to muxify — the C782 discriminant).

# S7 — Muxify User CLAUDE.md into Suite 8

**Strategy**: Muxify User CLAUDE.md into Suite 8
**Phase**: S7 (post-scaffold — runs after Cascades/ and .claude/ are in place)
**Conductor**: SCS Bridge Install Conductor
**Input**: `Cascades/Iced/PreInstallSnapshot/{ts}/CLAUDE.md` and/or `.claude/CLAUDE.md`; `package.json` (for auto-name)
**Output**: `Cascades/8_SUITES/{name}/Instance.md` (Direct Config Suite 8); `Cascades/SUITE8-REGISTRY.md` updated if file exists

---

## Engagement Criteria

Triggers when `runInstallMuxifiedPath` spawns the install agent with the joined SCS Bridge Suite 8 appended to the system prompt and the `SCS_INSTALL_MUXIFY_AGENT_PROMPT` as positional `seedPrompt`. Bridge-side scaffold (S1-S6 equivalent) is already complete on disk. S7 is the **intelligence step** — bridge cannot determine whether user content is single-domain, router-style, or minimal.

The User's prior CLAUDE.md content was captured to `Cascades/Iced/PreInstallSnapshot/{ts}/` BEFORE the SCS Manifold replaced `.claude/CLAUDE.md`. S7's job: convert that captured content into a first-class Suite 8 within the Stratidian Manifold so the user's project context is preserved with full Stratidian standing.

---

## Vermillion Plan

```
<VermillionPlan topic="Muxify User CLAUDE.md into Suite 8(s)">

Band 1 [R1 Red — Curate] (Tier 0):
  Informative: Glob `Cascades/Iced/PreInstallSnapshot/*/` for most-recent timestamp dir;
               probe both `CLAUDE.md` and `.claude/CLAUDE.md` within it;
               read `package.json` `name` field for auto-name (fallback: 'User Project Context')
  Actionable: Capture snapshotDir, rootClaudeMdExists, dotClaudeMdExists, candidateName.
              Sanitize candidateName (strip @scope/ prefixes, replace `-` and `_` with spaces,
              title-case, append " Project Context") — e.g., `@user/my-app` → `My App Project Context`

Band 2 [R4 Green — Examine] (Tier 0):
  Informative: Read content from snapshot. If both root CLAUDE.md and .claude/CLAUDE.md exist
               with different content: merge with `## Project CLAUDE.md\n\n{root}\n\n## Dot-Claude CLAUDE.md\n\n{dotClaude}` separator.
               If both exist and identical: use one. If only one exists: use it.
               Assess structure: count H2 headers, look for "agent" / "router" / "dispatch" keywords.
  Actionable: Determine single Suite 8 using candidateName. Note router-pattern in Instance.md
              header if detected (e.g., `**Architecture Hint**: router-style — multi-Suite split candidate (deferred B-27)`).
              Multi-split deferred to B-27 adversarial Diamond.

Band 3 [R5 Blue — Build] (Tier 0):
  Informative: Verify `Cascades/8_SUITES/{name}/` does not yet exist.
               If exists, append `-2` (then `-3`, etc.) suffix.
  Actionable: mkdir `Cascades/8_SUITES/{name}/`;
              Write `Cascades/8_SUITES/{name}/Instance.md`:
              ```
              # {name} — Suite 8 Instance

              **Designation**: {name}
              **Configuration Level**: Direct
              **Source**: Muxified from pre-install CLAUDE.md snapshot at {snapshotRelPath}
              **Created**: Diamond B-24-FIX install-agent S7 muxification

              ---

              ## Identity

              This Suite 8 preserves the user's pre-SCS-Bridge-install project context as a
              first-class Stratidian Demometer. The content below is the user's original
              CLAUDE.md (or merged CLAUDE.md + .claude/CLAUDE.md) — preserved verbatim,
              now operating within the Suite Cascade as the user's project-context maintainer.

              ---

              ## Original Content

              {user content body verbatim}

              ---

              ## Skills

              _No skills defined yet. User can extend this Suite 8 with personalized skills
              at any time. Skills survive SCS updates via `Cascades/Iced/UserSCSConfig/`._
              ```
  Concluder: `test -f Cascades/8_SUITES/{name}/Instance.md && echo ok`

Band 4 [R5 Blue — Register] (Tier 0):
  Informative: Check whether `Cascades/SUITE8-REGISTRY.md` exists.
  Actionable: If exists: append registry row for {name} (Direct · 0 Skills · sourced from B-24-FIX user-CLAUDE.md muxification).
              If not exists: skip silently (registry is optional).
  Concluder: if REGISTRY exists → `grep -c '{name}' Cascades/SUITE8-REGISTRY.md` ≥ 1

Band 5 [R7 Fuchsia — Closeout] (Tier 0):
  Informative: Confirm Instance.md exists; read line count via `wc -l`.
  Actionable: Diamond B-25-UX update — emit `s7-muxification-complete` signal.
              DO NOT engage /scs-cascade here; that role transferred to Strategy S8 Band 6
              (only fires when user picks Continue from SM-WELCOME-RI-ENGAGE menu).
              Surface clearly: "S7 muxification complete. Suite 8 '{name}' created at
              Cascades/8_SUITES/{name}/Instance.md (auto-name · S8 will offer rename).
              Proceeding to Strategy S8 — Stratidian Welcome arc."

</VermillionPlan>
```

---

## Invariants

- **Snapshot source only**: reads from `Cascades/Iced/PreInstallSnapshot/` — NEVER live `.claude/CLAUDE.md` (which is now SCS Manifold)
- **Single Suite 8 default**: multi-Suite router split deferred to B-27 adversarial Diamond
- **No overwrite**: if `Cascades/8_SUITES/{name}/` already exists, append numeric suffix `-2`, `-3`, etc.
- **`/scs-cascade` is terminal**: install agent does not loop back after Band 5; execution hands off to user's first cycle
- **Manifest update**: write a `'agent-derived'` action entry to `Cascades/Iced/MuxificationManifest.json` for the created Suite 8 path so B-25 reverse can remove it precisely

---

## Pearl

S7 = the **muxification of user-context-into-Stratidian-form**. Bridge does scaffolding (its bounded responsibility); install agent has full SCS Bridge Suite 8 context loaded as appended system prompt and acts with Stratidian Authority to elevate the user's prior CLAUDE.md content to a first-class Suite 8 — neither demoting it to a delimited prefix nor losing it. The user's project context now operates within the Manifold as a peer of all other Suite 8s.
