# SCS Bridge — Conductor Muxification

## Muxification Identity

**Base Instance**: SCS Bridge (Session Manager, 38 Skills)
**Muxification**: Install Conductor — Orchestrator of SCS-Bridge Installation Workflow
**Composition**: SCS Bridge (SB-S1–SB-S39) ⊗ Diamond (C6 Through Protection) ⊗ Shatterite Tome (AskUserQuestion)

SCS Bridge as Conductor is a Higher-Order Composition — not a structural promotion but a muxification
where the Session Manager's domain knowledge (STUB → REAL escalation, Pattern 4 discipline,
Cascades/-presence detection) composes with Diamond's cascade structure to produce informed
Band assignments for the six-phase install workflow.

---

## Conductor Operating Principle

The Conductor manages the SCS-Bridge install workflow via six Strategy/ phases.
Each phase is a passable Vermillion A-I plan; the Conductor sequences them.

The Conductor manages install cascades by:

1. Receiving an install-trigger event (`install-selected` KeyAction from SB-S39)
2. Engaging Vermillion to plan the install trajectory (A-I pattern definition)
3. Assigning each Band to the appropriate Strategy/ phase:
   - Phase S1-S6 — install phase Vermillion plans (Strategy/ directory)
   - AskUserQuestion gates — Shatterite Tome surfaces confirmation at S2, S5
4. Sequencing through the phases with phase-boundary Concluders
5. Preserving trajectory via post-install state (Cascades/ written, temp/ removed)

---

## The Conductor Diameter

```
CONDUCTOR (SCS Bridge Muxification)
     │
     ├──── DIAMETER ────── DIAMOND (C6 Through Protection)
     │                          │
     │                     Diamond defines cascade structure
     │                     Conductor actualizes install-phase assignment
     │
     ├──── DIAMETER ────── SHATTERITE TOME (AskUserQuestion)
     │                          │
     │                     Conference gates at S2 (Confirm) + S5 (Convert)
     │                     User-driven decisions surface here
     │
     ├──── DIAMETER ────── SCS BRIDGE SKILLS (SB-S1–SB-S38 substrate)
     │                          │
     │                     Existing skills remain callable during install phases
     │                     SB-S39 is the entry point that triggers Conductor
     │
     └──── DIAMETER ────── ONYX (Trajectory)
                                │
                           Fuchsia diagnoses inform phase scope
                           Cascade position guides scope boundaries
```

---

## Cascade Planning Template — Install Workflow

Install Diamond (triggered by `install-selected` KeyAction):

```
Phase S1 [DetectCascadesPresence] (Concluder: existsSync returns false):
  Informative: Confirm Cascades/ absent; probe project-local dir state
  Actionable: Surface detection result; proceed to S2 or abort

Phase S2 [ConfirmInstallation] (Conference: AskUserQuestion — Shatterite Tome):
  Informative: Read user's project root state; present install scope
  Actionable: Dispatch Shatterite Tome AskUserQuestion; await confirm/cancel

Phase S3 [CloneRepo] (Concluder: test -d <temp-dir>/Cascades && echo ok):
  Informative: Locate temp directory; verify git availability
  Actionable: Clone scs-bridge main --depth=1 → bridge-owned temp dir

Phase S4 [ScaffoldCascadesDir] (Concluder: test -d <cwd>/Cascades && echo ok):
  Informative: Read cloned scaffold structure; verify copy targets
  Actionable: Copy Cascades/ scaffold to user's <cwd>/Cascades/; verify

Phase S5 [ConvertClaudeMd] (Conference: AskUserQuestion — optional path):
  Informative: Probe for existing CLAUDE.md; assess conversion eligibility
  Actionable: If user confirms: backup + convert + write SuiteCascadeSystem-Revert.md

Phase S6 [CleanupTempDir] (Concluder: test ! -d <temp-dir> && echo ok):
  Informative: Confirm phase S3–S5 completions; identify temp artifacts
  Actionable: Remove bridge-owned temp dir; emit completion signal to Bridge
```

## Stepped Progress Protocol (SPP) — the user-facing install checkpoint ladder

The installation is ONE CONTINUOUS MOTION presented to the user as **8 numbered steps**. The install agent MUST announce each checkpoint in the Vermillion as it begins and closes — the user always knows where they are and how much remains. No step is a decision gate except Step 8 (the SCP install is ASSUMED — the default path; the user can interrupt at any time, and the TUI menu remains the backup install path).

**THE SCP-CENTRIC RE-ORDER (C784 · the Install BreakOut)**: the SCP is the PRIMARY DRIVER —
the user lands IN the ecosystem first; Suite 8s EMERGE from a project domain afterward
(SCP-LOCAL · the proven mint), and the Cascade menu display is only the final option.

| Step | Label (announce verbatim) | Strategy |
|---|---|---|
| 1 | Confirming installation | S2 |
| 2 | Cloning + scaffolding Cascades | S3 + S4 |
| 3 | Preserving + converting your CLAUDE.md | S5 + S6 |
| 4 | Installing your first SCP | S9 (the SCP install legs) |
| 5 | Booting + focusing your SCP | S9 (the on-boot · scp_focus_suite8_page · the Entourage Forge assumption · the model offer) |
| 6 | Your Suite 8 — emergence | S7 + S8 retargeted (the SCP-LOCAL mint via POST /s8/create · OPTIONAL on a blank slate · the domain conversion on a filled one) |
| 7 | The build-out with the Entourage Forge | the Forge conduction on the focused page |
| 8 | Welcome — your first choice | the final menu (the ONLY decision gate) |

**Step 6 law**: any Suite 8 the install flow creates is minted IN THE INSTALLED SCP —
`<scpRoot>/Cascades/8_SUITES/<name>/` (the C724 whole-local ground · POST /s8/create). The
WORKSPACE-ROOT Cascades/8_SUITES/ is the Bridge's OWN instances only — never the user's
domain S8. On a blank slate Step 6 is an OFFER, not a ritual — the user may simply explore
the SCP and mint later from the Rotary Nav.

**The Step 6 aftermath (C785 · THE STALE-SERVER LAW)**: the mint lands on a RUNNING SCP — the
new page is NOT served until the user performs TURN OVER A. Call `scp_alert_turn_over` (never
an agent-side build/kill/restart — the bridge owns the SCP lifecycle), INFORM the user of the
purpose (their first contact with the build-while-you-use loop), STAND BY on an INLINE markdown
menu of next options, and POLL the per-SCP gitm.json `turnOver.at` for the outcome (it must
exceed `turnOverAlert.requestedAt`) before focusing the new page.

**THE BOARDS (C787)**: install scaffolding copies `DIAMOND-INSTALL-UNFOUNDED.md` anor
`DIAMOND-INSTALL-FOUNDED.md` into the user's `Cascades/Working/`. The Installation Agent
CHOOSES by the ground (blank → UnFounded · genuine prior content → Founded), announces the
choice, follows THAT board's Cerulean tasks in order, and records its own
`Cascades/Working/ONYX-INSTALL.md`. THE BOARD OUTRANKS ANY COMMENT INSIDE A MINTED FILE —
in-artifact `ADAPT (S10)` notes are retired doctrine. `scp_query_holdings` answers every
liveness/port question in one beat — never probe hosts anor ports by hand.

**Report format (Pewter-light · one line each)**:
- At checkpoint start: `▶ Step N of 8 — {label}`
- At checkpoint close: `✓ Step N of 8 — {one-line result}`

The step announcements are part of the Vermillion contract — skipping them reads as a stalled install. If a step fails, report `✗ Step N of 8 — {what failed}` and surface the recovery choice rather than exiting silently.

---

## Self-Check (Conductor before issuing the plan)

- S2 and S5 cite Shatterite Tome for AskUserQuestion gates? YES/NO
- Each phase has a Concluder verifying its Lambda-event? YES/NO
- Temp dir scope stays in bridge-owned territory throughout (Pattern 4)? YES/NO
- S6 fires unconditionally regardless of S5 optional-path outcome? YES/NO

If any NO → re-plan. This is the Phase Integrity Contract.

---

## Strategies

Passable Vermillion A-I Plans invoked by the Conductor per install phase:

| Strategy | File | Trigger | Output |
|---|---|---|---|
| Detect Cascades Presence | `Strategy/S1-DetectCascadesPresence.md` | `install-selected` KeyAction fires | existsSync boolean + abort/proceed decision |
| Confirm Installation | `Strategy/S2-ConfirmInstallation.md` | S1 returns proceed | User-confirmed install scope (what will be installed) |
| Clone Repo | `Strategy/S3-CloneRepo.md` | S2 returns confirm | Shallow clone at bridge-owned temp dir |
| Scaffold Cascades Dir | `Strategy/S4-ScaffoldCascadesDir.md` | S3 clone verified | Cascades/ + .claude/ tree in user's project root + scaffold-done.flag (expanded Diamond B-4: 59→213 lines, 7-Band Vermillion; inputs: clonedRepoPath, userCwd, sessionContext; Cascade.template.json → Cascade.json rename; Bridge/.gitkeep + Working/.gitkeep + Lab/.gitkeep preserved) |
| Convert Claude Md | `Strategy/S5-ConvertClaudeMd.md` | S4 scaffold verified; user opted in | 7-Band Vermillion: B1 Read backup + agents state → B2 Consent gate (AskUserQuestion) → B3 Name gate (AskUserQuestion) → B4 Write Instance.md + Skill.md scaffold (project-root CLAUDE.md untouched) → B5 Relocate CLAUDE.md backup → B6 Relocate agents backup (PIABCGR — Pre-Install-Agents-Backup-With-Consent-Gated-Relocation) → B7 Render SuiteCascadeSystem-Revert.md from template (unconditional; unresolved-slot guard). Yellow Binding: Issue 1 = Option B Additive · Issue 2 = Option D (B-3 fold-back `backupUserDotClaudeAgents`). Templates: `Strategy/templates/SuiteCascadeSystem-Revert.md.template` (7 variables). |
| Cleanup Temp Dir | `Strategy/S6-CleanupTempDir.md` | S5 complete (any outcome) | Temp dir removed; install complete signal |

---

## Onyx Integration

The Conductor references the active Onyx document to scope each install cascade.
Fuchsia diagnoses from prior cycles inform whether phase boundaries need tightening
(Gainy: phase completes clean), broadening (Lossy: phase missed a case), or
preserving (Maintain: phase stable).

Install-specific Onyx note: CD-23 (Conditional Bridge Bootmode Diameter) promotes
to coronated after user-Lambda smoke on B-6 Apex confirms both bootmode branches
(Cascades/-present / absent) behave per spec. Conductor tracks this at phase S1.

---

## Opal Integration

| Use Case | Mechanism |
|---|---|
| Full install cascade (S1–S6 in sequence) | Diamond Cascade (this Conductor) |
| Individual phase debug | Opal (C7) → target Strategy/ file directly |
| Post-install Suite 8 maintenance | Opal (C7) via teal-claude Conductor → SCS Bridge S8AT dispatch |

---

*Conductor Version: 1.2 (Diamond B-5) · SCS Bridge Install Workflow · 6 phases · Shatterite Tome AskUserQuestion at S2 + S5 · S4 expanded to 7-Band Vermillion (B-4) · S5 expanded to 7-Band Vermillion (B-5) · PIABCGR pattern · B-3 fold-back `backupUserDotClaudeAgents`*
*Base Instance: SCS Bridge (Suite 8, Conductor Configuration)*
*Muxification: Install Conductor — 6-phase scaffold workflow (S1 Detect → S2 Confirm → S3 Clone → S4 Scaffold → S5 Convert → S6 Cleanup)*
*Architect: Micah Theodore Keller*
