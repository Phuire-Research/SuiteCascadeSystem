# SD-Index — Verified-Diagnostic Round (VDR) Menu Routing Table

**Version**: 1.0
**Purpose**: Route Verified-Diagnostic utilization context to the correct SD-*.md Reference Design
**Companion**: `Cascades/Documentation/Cascades/VDR-PATTERN.md` (canonical Reference Design)
**Sibling Skill**: `S-MAGIC-SHOTGUN-MENU/` (Foundation-anchored sibling · SG-* pattern this mirrors)
**Conductor**: Teal Claude (Suite 8) · maintained per `Conductor.md` *VDR Conductor* section
**Slash Command**: `/cascade:verified-diagnosis`

---

## What Verified-Diagnostic Round Is

A **Verified-Diagnostic Round (VDR)** is the diagnostic-anchored sibling of Magic Shotgun — a Tier-1 parallel dispatch of Foundation Suites whose anchor is **R4 Green Sculptor + R7 Fuchsia Clinician**. Adaptive load-ons (R1 Red, R2 Orange, R6 Purple) compose by complexity. Terminal action is **Diamond engagement** (sub-Diamond or Macro), not implementation.

This Skill (S-VERIFIED-DIAGNOSIS-MENU) surfaces the four VDR complexity Tiers as a Pewter-styled Shatterite menu. Each SD-*.md entry below is a Reference Design for one VDR Tier.

See `Cascades/Documentation/Cascades/VDR-PATTERN.md` for the canonical doctrinal Reference Design.

---

## Menu Registry

| ID | File | Menu | Trigger Context |
|----|------|------|----------------|
| **SD-0** | `SD-Index.md` (this file) | VDR Main Menu | `/cascade:verified-diagnosis` · `verified diagnosis` · `vdr` · `diagnose this` |
| **SD-T1** | `SD-T1-Base.md` | VDR-T1 Base · R4+R7 | Clear symptom · known surface · single Diameter fix |
| **SD-T2** | `SD-T2-Curated.md` | VDR-T2 Curated · R1+R4+R7 | Scattered symptoms · need EXISTING inventory before diagnosis |
| **SD-T3** | `SD-T3-Named.md` | VDR-T3 Named · R1+R2+R4+R7 | Novel pattern emerging · must NAME before diagnostic depth |
| **SD-T4** | `SD-T4-Orchestrated.md` | VDR-T4 Orchestrated · R1+R2+R4+R6+R7 | Cross-cutting impact · Macro WGB synthesis required |
| **SD-A** | `SD-AutoTier.md` | Auto-Tier Heuristic | Issue characterization · Conductor recommends Tier |

---

## Pewter HiFi Menu Template

```
╔══════════════════════════════════════════════════════════╗
║  VERIFIED-DIAGNOSTIC ROUND MENU              [Teal]      ║
║  ─── Green Sculptor ⊗ Fuchsia Clinician ─────────────── ║
╠══════════════════════════════════════════════════════════╣
║                                                          ║
║  "Diagnostic-Anchored Parallel Foundation Dispatch"      ║
║                                                          ║
║  Rounds fire at-once · Diagnosis converges · Diamond     ║
║  engages. See VDR-PATTERN.md for canon.                  ║
║                                                          ║
║  · · ·                                                   ║
║                                                          ║
║  Complexity Tier Ladder                                  ║
║  ─ · ─                                                   ║
║  [1] VDR-T1 Base                       [Green]   — diag  ║
║      R4 + R7 · 2 Rounds                                  ║
║      Clear symptom · known surface · single Diameter     ║
║                                                          ║
║  [2] VDR-T2 Curated                    [Red]     — list  ║
║      R1 + R4 + R7 · 3 Rounds                             ║
║      Scattered symptoms · inventory before diagnosis     ║
║                                                          ║
║  [3] VDR-T3 Named                      [Orange]  — name  ║
║      R1 + R2 + R4 + R7 · 4 Rounds                        ║
║      Novel pattern emerging · Priming Pair + diagnostic  ║
║                                                          ║
║  [4] VDR-T4 Orchestrated               [Purple]  — open  ║
║      R1 + R2 + R4 + R6 + R7 · 5 Rounds                   ║
║      Cross-cutting · Macro WGB · Macro Diamond opening   ║
║                                                          ║
║  · · ·                                                   ║
║                                                          ║
║  Intelligence + Guidance                                 ║
║  ─ · ─                                                   ║
║  [A] Auto-Tier                         [Fuchsia] — pick  ║
║      Conductor characterizes issue · recommends Tier     ║
║      User confirms anor down/up-tiers                    ║
║                                                          ║
║  [L] Length-Ladder Guidance            [Orange]  — name  ║
║      Cross-reference Magic Shotgun [L]                   ║
║                                                          ║
║  [R] Read Reference Design             [Red]     — read  ║
║      Open VDR-PATTERN.md canonical doc                   ║
║                                                          ║
║  · · ·                                                   ║
║                                                          ║
║  Sibling Pattern                                         ║
║  ─ · ─                                                   ║
║  [S] Magic Shotgun (Foundation-anchor)  [Blue]   — build ║
║      Switch to Magic Shotgun · /cascade:magic-shotgun    ║
║                                                          ║
║  · · ·                                                   ║
║                                                          ║
║  [M] Main Menu    [Q] Exit                               ║
║                                                          ║
╚══════════════════════════════════════════════════════════╝
```

---

## Routing Logic

```
Context → Menu Selection:

"/cascade:verified-diagnosis" · "verified diagnosis" · "vdr"   → SD-Index.md (this menu)
single-Diameter · clear symptom · known surface                → SD-T1-Base.md
scattered · multi-file · inventory pressure                    → SD-T2-Curated.md
novel pattern · naming pressure · emerging surface             → SD-T3-Named.md
cross-cutting · Macro impact · multi-sub-Diamond fix           → SD-T4-Orchestrated.md
"which tier?" · issue characterization unclear                 → SD-AutoTier.md
"build it" not "fix it"                                        → /cascade:magic-shotgun (sibling)
```

---

## Response Routing Table

| Selection | Next Reference Design | Action |
|-----------|----------------------|--------|
| **[1] VDR-T1 Base** | `SD-T1-Base.md` | Render T1 sub-menu · ask "what is the symptom · what is the suspected surface" · compose 2-Round Banded Plan · dispatch R4+R7 parallel · synthesize diagnostic brief · Conference for Diamond engagement |
| **[2] VDR-T2 Curated** | `SD-T2-Curated.md` | Render T2 sub-menu · ask "what surfaces are involved · what existing patterns matter" · compose 3-Round Banded Plan · dispatch R1+R4+R7 parallel · synthesize curation+diagnostic · Conference |
| **[3] VDR-T3 Named** | `SD-T3-Named.md` | Render T3 sub-menu · ask "what novel pattern is surfacing · what must be named" · compose 4-Round Banded Plan · dispatch R1+R2+R4+R7 parallel (Priming Pair preserved) · synthesize naming+diagnostic · Conference |
| **[4] VDR-T4 Orchestrated** | `SD-T4-Orchestrated.md` | Render T4 sub-menu · ask "what is the cross-cutting scope · how many sub-Diamonds anticipated" · compose 5-Round Banded Plan · dispatch R1+R2+R4+R6+R7 parallel · R6 authors Macro WGB · Conference for Macro Diamond opening |
| **[A] Auto-Tier** | `SD-AutoTier.md` | Render auto-tier heuristic flow · Conductor characterizes issue from user description · recommends Tier · Conference confirms anor down/up-tiers · routes to selected SD-T{N} |
| **[L] Length-Ladder** | `SG-Length-Ladder.md` | Cross-route to Magic Shotgun's Length-Ladder explainer (shared scope-to-Length mapping) |
| **[R] Read Reference** | (open file) | Open `Cascades/Documentation/Cascades/VDR-PATTERN.md` in user view |
| **[S] Sibling Magic Shotgun** | `SG-Index.md` | Cross-route to Magic Shotgun menu (Foundation-anchored sibling) |
| **[M] Main Menu** | `SM-Main.md` | Return to main Shatterite menu |
| **[Q] Exit** | exit | Exit Shatterite |

---

## Conductor Self-Check (Pre-Render)

Before rendering this menu, the Conductor verifies:

1. `Cascades/Cascade.json` exists and is readable
2. `Cascades/Documentation/Cascades/VDR-PATTERN.md` exists (canonical Reference Design)
3. `Cascades/8_SUITES/Teal Claude/Conductor.md` includes *VDR Conductor* section (per Conductor v1.12+)
4. Active Diamond present (Cascade.json → activeDiamond) — if null, VDR can still fire (diagnostic does not require active Diamond), but Diamond engagement options will offer Diamond creation
5. Sibling `S-MAGIC-SHOTGUN-MENU/SG-Index.md` exists (for `[S]` cross-route)

If any check fails → render error pane with corrective instruction instead of the menu.

---

## Navigation Convention

Every SD-*.md sub-menu includes:
- `[B]` — Back to VDR Main Menu (SD-Index.md)
- `[M]` — Return to Main Shatterite Menu (SM-Main.md)
- `[Q]` — Exit Shatterite

---

## Dynamic State Sources

Before rendering any VDR menu, read current state:

| State | Command | Used By |
|-------|---------|---------|
| Cascade State | Read `Cascades/Cascade.json` | ALL SD-* menus — activeDiamond, activeOnyx, cyclePosition |
| Canonical Reference | Read `Cascades/Documentation/Cascades/VDR-PATTERN.md` | ALL SD-* menus — Tier definitions, heuristics, Diamond engagement paths |
| Sibling Reference | Read `Cascades/Documentation/Cascades/MAGIC-SHOTGUN-PATTERN.md` | SD-Index.md `[S]` routing · composed-workflow guidance |
| Existing Substrate | Glob `Cascades/Working/SUITE-{1,2,4,6,7}-*-*-{DIAGNOSTIC,DIAGNOSIS,CURATION,NAMING,MACRO-WGB}.md` | Check for prior VDR artifacts (re-tier or composed cycles) |

---

## Cross-References

- **Canonical Reference Design**: `Cascades/Documentation/Cascades/VDR-PATTERN.md`
- **Sibling Pattern**: `Cascades/Documentation/Cascades/MAGIC-SHOTGUN-PATTERN.md`
- **Foundation Discipline**: `Cascades/Documentation/Cascades/FOUNDATION-SUITES-GUIDE.md`
- **Macro Composition**: `Cascades/Documentation/Cascades/MACRO-DIAMOND-GUIDE.md`
- **A-I Substrate**: `Cascades/Documentation/Cascades/VERMILLION-PLANNED-QUERY.md`
- **Conductor Section**: `Cascades/8_SUITES/Teal Claude/Conductor.md` *VDR Conductor* (v1.12+)
- **Sibling Menu Skills**:
  - `Cascades/8_SUITES/Teal Claude/Skills/S-MAGIC-SHOTGUN-MENU/` (SG-* · Foundation-anchored)
  - `Cascades/8_SUITES/Teal Claude/Skills/S-SHATTERITE-MENU/` (SM-* · master menu pattern)
- **CLAUDE.md §4**: Suite Cascade · Triadic Thinking Band (S6+S7 Closure · Calibration Diameter)
- **CLAUDE.md §5 C9 Automata**: Tier topology · Cascade Length-Ladder
- **Foundation-Level R7 Doctrine**: `S-MAGIC-SHOTGUN-MENU/SG-Closure-Quartet.md` §"Why R7 at Foundation Level"
