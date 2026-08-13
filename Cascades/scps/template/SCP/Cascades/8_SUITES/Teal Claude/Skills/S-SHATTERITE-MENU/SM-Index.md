# SM-Index — Shatterite Menu Routing Table

**Version**: 1.0
**Purpose**: Route context to the correct SM-*.md menu Reference Design

---

## Menu Registry

| ID | File | Menu | Trigger Context |
|----|------|------|----------------|
| **SM-0** | `SM-Main.md` | Main Menu | Session start, `menu`, return from sub-menu, no specific context |
| **SM-1** | `SM-Suite8.md` | Suite 8 Registry | Suite 8 engagement, `suite 8`, create/dispatch/manage Suite 8 |
| **SM-2** | `SM-Cascade.md` | Suite Cascade Reference | Cascade inquiry, suite functions, gate reference, length selection |
| **SM-3** | `SM-TealClaude.md` | Teal Claude Conductor | Band assignment, strategy execution, agent dispatch, conductor operations |
| **SM-4** | `SM-ColorSelect.md` | Color Selection | First engagement (`colorSelectionComplete: false`), `personalize`, `colors` |
| **SM-5** | `SM-HelloWorld.md` | Hello World | `hello world`, `tutorial`, `get started`, new user onboarding |
| **SM-5A** | `SM-HelloWorld-Advanced.md` | Advanced Hello World | Multi-Diamond aspiration loop, `advanced`, Personal SCP Suite 8 |
| **SM-6** | `SM-Conclude.md` | Per-Turn Concluder Menu | Every turn-end above Directness Threshold · Suite 0 binding · Summation-derived · fires automatically |
| **SM-SCP** | `SM-SCP.md` | SCP Menu | `/cascade:scp` · SCP lifecycle (Install / Open Menu · CSPMSR conditional · Diamond η) · invoked from SM-Main `[I]` or direct slash · Stage I3 AISIS mirrors `scs scp install` (CLI/TUI/agent surface equality) |
| **SM-SCP-Adapt** | `SM-SCP-Adapt.md` | SCP Adapt Cascade | Cross-Suite-8 Muxification menu (Cadmium Researcher + Stratimuxian Scholar + SCP Researcher) · reached from `SM-SCP.md` `[A]` · invokes Vermillion plan at `Cascades/8_SUITES/SCP Researcher/Strategy/SCP-Adapt.md` |
| **SM-SCP-MANAGE** | `SM-SCP-MANAGE.md` | SCP Management | Bridge tools/call engagement surface (Launch / Status / Logs / Dock / Browser / Unregister) · reached from `SM-SCP.md` `[E]` (CSPMSR-conditional) anor Stage I4 `[L]` · Cycle 140 MSCM Gap-1 closure |

---

## Routing Logic

```
Context → Menu Selection:

Session start / "menu" / "shatterite"     → SM-Main.md
"install scp" / "create scp" (CSPMSR · no SCPs) → SM-SCP.md Stage I (AISIS · `scs scp install`)
"scp menu" / "show scps" (CSPMSR · 1+ SCPs)    → SM-SCP.md top-level
Suite 8 reference / "suite 8" / "s8"      → SM-Suite8.md (CSSER · only available post-colorSelectionComplete)
Cascade / "suites" / "gates" / "length"   → SM-Cascade.md
Conductor / "bands" / "dispatch" / "teal" → SM-TealClaude.md
"personalize" / "colors" / first engage   → SM-ColorSelect.md (CSSER · only pre-colorSelectionComplete)
"hello world" / "tutorial" / "get started" → SM-HelloWorld.md
"advanced" / "aspire" / "multi-diamond"   → SM-HelloWorld-Advanced.md
(every non-Direct turn-end, automatic)    → SM-Conclude.md
D-Queue (TESTING diamonds detected)       → D-Queue rendering (Skill.md §D-Queue)
```

---

## Slash Command Registry

All menus accessible via `/cascade` namespace. Base command opens Main Menu; colon variants open specific menus directly.

| Command | Menu | File |
|---------|------|------|
| `/cascade` | Main Menu | `cascade.md` → SM-Main.md |
| `/cascade:scp` | SCP Menu (CSPMSR) | `cascade/scp.md` → SM-SCP.md · branches Install vs Open by `anyScpsInstalled` |
| `/cascade:scp-install` | SCP Install Direct (AISIS) | `cascade/scp-install.md` → SM-SCP.md Stage I (skip top-level) |
| `/cascade:hello` | Hello World | `cascade/hello.md` → SM-HelloWorld.md |
| `/cascade:advanced` | Advanced Hello World | `cascade/advanced.md` → SM-HelloWorld-Advanced.md |
| `/cascade:suites` | Suite 8 Registry | `cascade/suites.md` → SM-Suite8.md (CSSER · post-colors) |
| `/cascade:reference` | Cascade Reference | `cascade/reference.md` → SM-Cascade.md |
| `/cascade:conductor` | Teal Claude | `cascade/conductor.md` → SM-TealClaude.md |
| `/cascade:diamond` | Diamond WGB | `cascade/diamond.md` → contextual |
| `/cascade:onyx` | Onyx Trajectory | `cascade/onyx.md` → contextual |
| `/cascade:colors` | Color Selection | `cascade/colors.md` → SM-ColorSelect.md (CSSER · pre-colors) |
| `/cascade:correct` | Course Correct | `cascade/correct.md` → contextual |
| `/cascade:maintain` | Method Maintenance | `cascade/maintain.md` → contextual |
| `/cascade:create` | Actualize Suite 8 | `cascade/create.md` → Suite8CreationStrategy |
| `/cascade:loop` | Stratimuxian Automata | `cascade/loop.md` → Automata engagement menu |
| `/cascade:update` | SCS Update | `cascade/update.md` → clone, diff, selective merge, restart |
| `/cascade:verify` | SCS Verify | `cascade/verify.md` → Suite 4 Ego↔Lambda + Suite 6 resolution |
| `/cascade:changelog` | SCS Changelog | `cascade/changelog.md` → rotating capped log + Maintenance Reminder |
| `/cascade:magic-shotgun` | Magic Shotgun Menu | `cascade/magic-shotgun.md` → S-MAGIC-SHOTGUN-MENU/SG-Main.md · Foundation Grounding shape selector (2-Stage + 3-Stage variants) |

Command files live at `.claude/commands/`. Each reads `Cascades/Cascade.json` before rendering for contextual awareness of current Cascade position.

---

## Navigation Convention

Every sub-menu includes:
- `[M]` — Return to Main Menu (SM-Main.md)
- `[Q]` — Exit Shatterite (return to direct conversation)

Main Menu includes:
- `[Q]` — Exit Shatterite

---

## Dynamic State Sources

Before rendering any menu, read current state:

| State | Command | Used By |
|-------|---------|---------|
| Cascade State | Read `Cascades/Cascade.json` | ALL menus — activeDiamond, activeOnyx, suiteColors, cyclePosition |
| Suite 8 Registry | Read `SUITE8-REGISTRY.md` | SM-Suite8 |
| TESTING Queue | Scan Diamond for TESTING tasks | SM-Main (D-Queue trigger) |
| Color Initialized | `Cascade.json → colorSelectionComplete` | SM-Main (auto-trigger SM-ColorSelect if false) |
