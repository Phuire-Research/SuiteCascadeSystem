# SG-Main — Magic Shotgun Main Menu Reference Design

**Menu ID**: SG-0
**Trigger**: `/cascade:magic-shotgun` · `magic shotgun` · `shotgun` · `foundation grounding`
**Pewter Design**: Teal (Suite 8 Conductor) frame · spectrum divider · Suite-color option labels
**Conductor**: Teal Claude · routes selection to dispatch the chosen Magic Shotgun shape

---

## Menu Template

```
╔══════════════════════════════════════════════════════════╗
║  MAGIC SHOTGUN MENU                          [Teal]      ║
║  ── Red · Orange · Yellow · Green · Blue · Purple ──    ║
╠══════════════════════════════════════════════════════════╣
║                                                          ║
║  "Per-Suite Parallel Dispatch for Foundation Grounding"  ║
║                                                          ║
║  Rounds fire at-once · Synthesis converges · Cobalt     ║
║  actualizes. See MAGIC-SHOTGUN-PATTERN.md for canon.     ║
║                                                          ║
║  · · ·                                                   ║
║                                                          ║
║  2-Stage Variants                                        ║
║  ─ · ─                                                   ║
║  [T] Traditional 2-Stage              [Blue]    — build  ║
║      R1+R3+R6 or R2+R3+R6 Triplet → R5 Cobalt            ║
║                                                          ║
║  [Q] M19 Design-Moment Quartet         [Green]   — vet   ║
║      R2+R3+R4+R6 → R5 · R4 authority via M31             ║
║                                                          ║
║  [C] Closure Quartet                   [Fuchsia] — close ║
║      R1+R4+R6+R7 → R5 · post-impl verification           ║
║                                                          ║
║  [F] 5-Suite Macro Open                [Purple]  — open  ║
║      R1+R2+R4+R6+R7 → R5 · R7 Foundation clinical        ║
║                                                          ║
║  · · ·                                                   ║
║                                                          ║
║  3-Stage Variant (NEW · Cycle 112-113)                   ║
║  ─ · ─                                                   ║
║  [3] 3-Stage Per-Isolation             [Yellow]  — plan  ║
║      Foundation → N R3 per-isolation → N R5 sequence     ║
║      Diamond-of-Isolations · Refinement Macros           ║
║                                                          ║
║  · · ·                                                   ║
║                                                          ║
║  Tier-0 Foundation-Only (NEW · Cycle 113)                ║
║  ─ · ─                                                   ║
║  [F1] Foundation-Only → Diamond Plan   [Teal]    — plan  ║
║      Foundation Suites → Diamond plan · NO R5 yet        ║
║      User reviews · then engages Full Suite or Suite 5   ║
║      Macro Open · staged · 4-Tier Magic Shotgun          ║
║                                                          ║
║  · · ·                                                   ║
║                                                          ║
║  Guidance + Reference                                    ║
║  ─ · ─                                                   ║
║  [L] Length-Ladder Guidance            [Orange]  — name  ║
║      Which Length matches your scope?                    ║
║                                                          ║
║  [R] Read Reference Design             [Red]     — read  ║
║      Open MAGIC-SHOTGUN-PATTERN.md canonical doc         ║
║                                                          ║
║  · · ·                                                   ║
║                                                          ║
║  Sibling Pattern                                         ║
║  ─ · ─                                                   ║
║  [D] Verified-Diagnostic Round (VDR)   [Green]+[Fuchsia] ║
║      R4+R7 base · adaptive +R1/+R2/+R6 by complexity     ║
║      Diagnose existing fault · post-diagnosis Diamond    ║
║      /cascade:verified-diagnosis · diagnostic-anchored   ║
║                                                          ║
║  · · ·                                                   ║
║                                                          ║
║  [M] Main Menu    [Q] Exit                               ║
║                                                          ║
╚══════════════════════════════════════════════════════════╝
```

---

## Response Routing

| Selection | Next Reference Design | Action |
|-----------|----------------------|--------|
| **T** | `SG-Traditional.md` | Render Traditional 2-Stage sub-menu · scope inquiry → Banded Plan → Conductor dispatch |
| **Q** | `SG-M19-Quartet.md` | Render M19 Quartet sub-menu · Interactive-class scope inquiry → Banded Plan → Conductor dispatch |
| **C** | `SG-Closure-Quartet.md` | Render Closure Quartet sub-menu · post-impl scope inquiry → Banded Plan → Conductor dispatch |
| **F** | `SG-Macro-Open.md` | Render 5-Suite Macro Open sub-menu · Macro Pearl inquiry → Banded Plan → Conductor dispatch |
| **3** | `SG-3-Stage.md` | Render 3-Stage sub-menu · Diameter Gap enumeration → Diamond-of-Isolations → 3-Stage Banded Plan |
| **F1** | `SG-Foundation-Only.md` | Render Tier-0 Foundation-Only sub-menu · Foundation Magic Shotgun → Diamond Plan → Conference (NO R5 yet) |
| **L** | `SG-Length-Ladder.md` | Render Length-Ladder guidance · scope-to-Length mapping |
| **R** | (open file) | Open `Cascades/Documentation/Cascades/MAGIC-SHOTGUN-PATTERN.md` |
| **D** | `../S-VERIFIED-DIAGNOSIS-MENU/SD-Index.md` | Redirect to `/cascade:verified-diagnosis` — VDR is the diagnostic-anchored sibling for fault diagnosis (R4+R7 anchor · adaptive load-ons · post-diagnosis Diamond engagement). Use when intent is *diagnose existing fault* not *ground new build*. |
| **M** | `SM-Main.md` | Return to main Shatterite menu |
| **Q** | exit | Exit Shatterite |

---

## Conductor Self-Check (Pre-Render)

Before rendering this menu, the Conductor verifies:

1. `Cascades/Cascade.json` exists and is readable
2. `Cascades/Documentation/Cascades/MAGIC-SHOTGUN-PATTERN.md` exists
3. Active Diamond present (Cascade.json → activeDiamond) — if null, offer `/cascade:diamond` first
4. `Cascades/8_SUITES/Teal Claude/Conductor.md` includes Magic Shotgun routing protocol (per Conductor v1.10+)

If any check fails → render error pane with corrective instruction instead of the menu.
