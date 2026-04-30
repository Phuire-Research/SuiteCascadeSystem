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

---

## Routing Logic

```
Context → Menu Selection:

Session start / "menu" / "shatterite"     → SM-Main.md
Suite 8 reference / "suite 8" / "s8"      → SM-Suite8.md
Cascade / "suites" / "gates" / "length"   → SM-Cascade.md
Conductor / "bands" / "dispatch" / "teal" → SM-TealClaude.md
"personalize" / "colors" / first engage   → SM-ColorSelect.md
"hello world" / "tutorial" / "get started" → SM-HelloWorld.md
D-Queue (TESTING diamonds detected)       → D-Queue rendering (Skill.md §D-Queue)
```

---

## Slash Command Registry

All menus accessible via `/cascade` namespace. Base command opens Main Menu; colon variants open specific menus directly.

| Command | Menu | File |
|---------|------|------|
| `/cascade` | Main Menu | `cascade.md` → SM-Main.md |
| `/cascade:hello` | Hello World | `cascade/hello.md` → SM-HelloWorld.md |
| `/cascade:suites` | Suite 8 Registry | `cascade/suites.md` → SM-Suite8.md |
| `/cascade:reference` | Cascade Reference | `cascade/reference.md` → SM-Cascade.md |
| `/cascade:conductor` | Teal Claude | `cascade/conductor.md` → SM-TealClaude.md |
| `/cascade:diamond` | Diamond WGB | `cascade/diamond.md` → contextual |
| `/cascade:onyx` | Onyx Trajectory | `cascade/onyx.md` → contextual |
| `/cascade:colors` | Color Selection | `cascade/colors.md` → SM-ColorSelect.md |
| `/cascade:correct` | Course Correct | `cascade/correct.md` → contextual |
| `/cascade:maintain` | Method Maintenance | `cascade/maintain.md` → contextual |
| `/cascade:create` | Actualize Suite 8 | `cascade/create.md` → Suite8CreationStrategy |
| `/cascade:loop` | Stratimuxian Automata | `cascade/loop.md` → Automata engagement menu |

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
