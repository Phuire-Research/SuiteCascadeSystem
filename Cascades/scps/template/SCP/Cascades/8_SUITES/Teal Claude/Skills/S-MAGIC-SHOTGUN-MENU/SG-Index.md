# SG-Index — Magic Shotgun Menu Routing Table

**Version**: 1.0
**Purpose**: Route Magic Shotgun utilization context to the correct SG-*.md Reference Design
**Companion**: `Cascades/Documentation/Cascades/MAGIC-SHOTGUN-PATTERN.md` (canonical Reference Design)
**Sibling Skill**: `S-SHATTERITE-MENU/` (SM-* pattern this mirrors)
**Conductor**: Teal Claude (Suite 8) · maintained per Conductor.md

---

## What Magic Shotgun Is

Magic Shotgun is the Tier-1 parallel dispatch of N Foundation Suites in a single message (the "Rounds") followed by main-thread synthesis and R5 Blue Cobalt actualization (the "convergent recoil"). See `MAGIC-SHOTGUN-PATTERN.md` for the canonical Reference Design.

This Skill (S-MAGIC-SHOTGUN-MENU) surfaces the **variety of utilizations** as a Pewter-styled Shatterite menu. Each SG-*.md entry below is a Reference Design for one Magic Shotgun shape.

---

## Menu Registry

| ID | File | Menu | Trigger Context |
|----|------|------|----------------|
| **SG-0** | `SG-Main.md` | Magic Shotgun Main Menu | `/cascade:magic-shotgun` · `magic shotgun` · `shotgun` |
| **SG-T** | `SG-Traditional.md` | Traditional 2-Stage (Foundation Triplet → Cobalt) | Standard sub-Diamond · 1 Diameter Gap · Length 1-5 |
| **SG-Q** | `SG-M19-Quartet.md` | M19 Design-Moment Quartet (R2+R3+R4+R6) | Interactive-class design moment · M31 mandatory |
| **SG-C** | `SG-Closure-Quartet.md` | Closure Quartet (R1+R4+R6+R7) | Sub-Diamond closure · post-impl verification |
| **SG-F** | `SG-Macro-Open.md` | 5-Suite Macro Open (R1+R2+R4+R6+R7) | Macro opens · multi-Gap surface · seam-crossing |
| **SG-3** | `SG-3-Stage.md` | 3-Stage Per-Isolation (Foundation → N R3 → N R5) | Refinement Macros · multiple Diameter Gaps · Length 1-7 |
| **SG-F1** | `SG-Foundation-Only.md` | Tier-0 Foundation-Only → Diamond Plan (NEW · Cycle 113) | Staged engagement · Macro Open · plan-only close · 4-Tier scheme |
| **SG-L** | `SG-Length-Ladder.md` | Length-Ladder Guidance | Scope-to-Length mapping · Round-count selection |
| **SG-D** | `../S-VERIFIED-DIAGNOSIS-MENU/SD-Index.md` | Verified-Diagnostic Round (VDR · diagnostic-anchored sibling) | Diagnose existing fault before Diamond engages · R4+R7 anchor |

---

## Routing Logic

```
Context → Menu Selection:

"/cascade:magic-shotgun" / "magic shotgun" / "shotgun"   → SG-Main.md (this menu)
single Diameter Gap · standard sub-Diamond              → SG-Traditional.md
Interactive-class · FSM extension · detection signal    → SG-M19-Quartet.md
sub-Diamond closure · post-impl verification scope      → SG-Closure-Quartet.md
Macro open · multi-Gap surface · cross-Macro seam       → SG-Macro-Open.md
multiple isolated Gaps in single Macro                  → SG-3-Stage.md
staged engagement · plan-only close · Macro Open        → SG-Foundation-Only.md (Tier-0 NEW)
"which length?" / scope unclear / Round count question → SG-Length-Ladder.md
"diagnose a fault" / "what is wrong with X" / existing-fault       → S-VERIFIED-DIAGNOSIS-MENU/SD-Index.md (sibling)
```

### 4-Tier Magic Shotgun Routing (Cycle 113 codification)

The 4-Tier scheme adds Tier-0 as a first-class menu entry:

| Tier | Menu | Pattern |
|---|---|---|
| **Tier-0** | `SG-Foundation-Only.md` (`[F1]`) | Foundation → Diamond Plan → Conference (NO R5) |
| **Tier-1** | `SG-Traditional.md` (`[T]`) · `SG-M19-Quartet.md` (`[Q]`) · `SG-Closure-Quartet.md` (`[C]`) · `SG-Macro-Open.md` (`[F]`) | Foundation → R5 Cobalt immediately |
| **Tier-2** | `SG-3-Stage.md` (`[3]`) | Foundation → N R3 → N R5 (Per-Isolation) |
| **Tier-3** | (future · speculative) | Foundation → Diamond → N R3 → N R5 |

User selects tier via menu key · Conductor routes per matrix above.

---

## Slash Command Registry

| Command | Menu | File |
|---------|------|------|
| `/cascade:magic-shotgun` | Magic Shotgun Main Menu | `.claude/commands/cascade/magic-shotgun.md` → SG-Main.md |

---

## Navigation Convention

Every SG-* sub-menu includes:
- `[M]` — Return to Main Shatterite Menu (SM-Main.md)
- `[B]` — Back to Magic Shotgun Main Menu (SG-Main.md)
- `[Q]` — Exit Shatterite

---

## Dynamic State Sources

Before rendering any Magic Shotgun menu, read current state:

| State | Command | Used By |
|-------|---------|---------|
| Cascade State | Read `Cascades/Cascade.json` | ALL SG-* menus — activeDiamond, activeOnyx, suiteColors, cyclePosition |
| Canonical Reference | Read `Cascades/Documentation/Cascades/MAGIC-SHOTGUN-PATTERN.md` | ALL SG-* menus — Foundation Heuristics, Round ceilings, examples |
| Foundation Substrate | Glob `Cascades/Working/SUITE-{1,2,3,4,6,7}-*-*.md` | SG-3-Stage · check for Foundation reports from prior Stage 1 |
| Diamond WGB | Read active Diamond (Cascade.json → activeDiamond) | SG-3-Stage · check for Diamond-of-Isolations table |

---

## Cross-References

- **Canonical Reference Design**: `Cascades/Documentation/Cascades/MAGIC-SHOTGUN-PATTERN.md`
- **Companion Pattern Guides**: `FOUNDATION-SUITES-GUIDE.md` · `MACRO-DIAMOND-GUIDE.md` · `VERMILLION-PLANNED-QUERY.md`
- **Conductor**: `Cascades/8_SUITES/Teal Claude/Conductor.md` (Magic Shotgun Conductor section · v1.11+)
- **Sibling Menu Skills**:
  - `Cascades/8_SUITES/Teal Claude/Skills/S-SHATTERITE-MENU/` (SM-* pattern)
  - `Cascades/8_SUITES/Teal Claude/Skills/S-MACRO-DIAMOND/` (multi-cycle composition · SM-Macro-Diamond.md)
  - `Cascades/8_SUITES/Teal Claude/Skills/S-FOUNDATION-SUITES/` (composition selection · SF-Foundation-Suites.md)
- **CLAUDE.md §4**: Suite Cascade · 8-Gate Cycle · Triadic Thinking Band (private pre-image of Magic Shotgun)
- **CLAUDE.md §5 C9 Automata**: Cascade Length-Ladder · Tier topology
