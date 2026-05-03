# Shatterite Menu Skill — Conference-Render Interface

**Version**: 1.0
**Suite**: Teal Claude (Suite 8 Conductor)
**Type**: Conference Skill — AskUserQuestion-based interactive menus
**Pewter Design**: HiFi Functional Design System applied to text-based menu rendering

---

## Skill Identity

Shatterite is the Conference-Render interface between C9 Automata and the user. C9 supplies routing content; Shatterite supplies visual form. The menu IS the Conference — decisions are captured through structured AskUserQuestion prompts styled with the Pewter Tessera HiFi Design System.

**Conference-Render Diameter**: C9 Automata (content) <-> Shatterite Menu (form). Reciprocal naming — neither subordinate.

---

## Menu System Architecture

All menus live as `SM-*.md` Reference Designs in this directory. `SM-Index.md` is the routing table.

```
SM-Index.md          Routing index — which menu for which context
SM-Main.md           Main menu — spectrum menu of menus
SM-Suite8.md         Suite 8 Registry — engage/create/dispatch Suite 8s
SM-Cascade.md        Suite Cascade Reference — gates, lengths, suite functions
SM-TealClaude.md     Teal Claude Conductor — bands, strategies, agent dispatch
SM-ColorSelect.md    Color Selection — personalize suite colors via questionnaire
SM-Conclude.md       Per-turn Concluder menu — Suite 0 binding · Summation-derived · fires AUTOMATICALLY at every non-Direct turn-end (the only auto-firing menu in the family)
```

**State File**: `Cascades/Cascade.json` — primary state source for all dynamic population. Read before rendering any menu.

---

## Pewter HiFi Text Design System

### The Rendering Constraint

Menus render inside `AskUserQuestion` — plain text only. The HiFi Functional Design System adapts to this constraint through text-based equivalents of its CSS patterns:

| HiFi CSS Concept | Text Menu Equivalent |
|-------------------|---------------------|
| Suite color tokens | Suite name labels as option markers: `[Red]`, `[Blue]` |
| Pane gradient (embossed borders) | Box-drawing frame: `╔═══╗ ║ ╚═══╝` with double-line borders |
| Spectrum divider (`.suite-hr`) | Color sequence: `── Red · Orange · Yellow · Green · Blue · Purple · Fuchsia ──` |
| Pattern tile (subtle texture) | Section separator: `· · ·` or `─ · ─` |
| Complementary text shadow | Suite function annotation after option: `[Blue] Build — implementation with gates` |
| Embossed depth | Indentation levels: outer frame → section → option |
| Typography stack | UPPERCASE for headers, lowercase for descriptions |

### Menu Pane Template

```
╔══════════════════════════════════════════════════════╗
║  MENU TITLE                                          ║
║  ── Red · Orange · Yellow · Green · Blue · Purple ── ║
╠══════════════════════════════════════════════════════╣
║                                                      ║
║  Section Header                                      ║
║  ─ · ─                                               ║
║  [A] Option label              [Suite] — annotation  ║
║  [B] Option label              [Suite] — annotation  ║
║                                                      ║
║  · · ·                                               ║
║                                                      ║
║  [M] Main Menu    [Q] Exit                           ║
║                                                      ║
╚══════════════════════════════════════════════════════╝
```

### Color Assignment Logic

Each menu option carries a suite color based on its cognitive function:

| Color | Function | When to Assign |
|-------|----------|----------------|
| Base | System/foundation | Configuration, settings, meta-operations |
| Red | Curation/inventory | List, browse, audit, review existing items |
| Orange | Discovery/naming | Explore, discover, identify, name new things |
| Yellow | Architecture/planning | Design, draft, blueprint, plan |
| Green | Examination/validation | Test, examine, validate, verify from multiple angles |
| Blue | Implementation/build | Execute, implement, build, deploy |
| Purple | Orchestration/sequence | Sequence, compose, coordinate, interchange |
| Fuchsia | Diagnosis/clinical | Diagnose, triage, fix, close circuit |

---

## Rendering Protocol

1. **Context arrives** (from Automata, Diamond, Opal, or user request)
2. **Consult SM-Index.md** — determine which menu matches context
3. **Load SM-*.md** — read the menu Reference Design
4. **Populate dynamic fields** — insert current state (active Diamond, registered Suite 8s, etc.)
5. **Render via AskUserQuestion** — present the populated menu
6. **Route response** — map user selection to next action (dispatch, sub-menu, or exit)

### Dynamic Population

Menus contain `{placeholder}` fields populated at render time:

| Placeholder | Source |
|-------------|--------|
| `{diamond_active}` | `Cascade.json → activeDiamond` (path to active Diamond file) |
| `{onyx_active}` | `Cascade.json → activeOnyx` (path to active Onyx file) |
| `{suite_colors}` | `Cascade.json → suiteColors` (personalized color assignments) |
| `{cascade_position}` | `Cascade.json → cyclePosition` (cycle, rotation, gate) |
| `{color_initialized}` | `Cascade.json → colorSelectionComplete` (triggers SM-ColorSelect if false) |
| `{suite8_registry}` | Read `SUITE8-REGISTRY.md` Active table |
| `{pending_count}` | Count of PENDING tasks from active Diamond |

---

## D-Queue Rendering

When multiple Diamonds are in TESTING state, Shatterite surfaces them as a queue:

```
╔══════════════════════════════════════════════════════╗
║  TESTING QUEUE                          [Fuchsia]    ║
║  ── · ── · ── · ── · ── · ── · ── · ── · ── · ──   ║
╠══════════════════════════════════════════════════════╣
║                                                      ║
║  [1] Diamond XYZ — {summary}           TESTING       ║
║  [2] Diamond ABC — {summary}           TESTING       ║
║                                                      ║
║  [T] Test next    [C] Continue building               ║
║                                                      ║
╚══════════════════════════════════════════════════════╝
```

---

## Cross-References

- **C9 Automata**: Conference-Render Diameter — C9 supplies content, Shatterite supplies form
- **Pewter Tessera**: HiFi Design System adapted to text rendering
- **Cascade.json**: `Cascades/Cascade.json` — RI state file; primary dynamic state source
- **SM-Index.md**: Menu routing table (this directory)
- **SM-ColorSelect.md**: Suite color personalization questionnaire
- **CLAUDE.md §5**: Crystraline reference pointer
