Render the Verified-Diagnostic Round (VDR) Menu — the diagnostic-anchored sibling of Magic Shotgun. R4 Green Sculptor + R7 Fuchsia Clinician are the irreducible diagnostic pair; R1 Red, R2 Orange, R6 Purple are adaptive load-ons by complexity.

Read `Cascades/Cascade.json` for current state (activeDiamond, activeOnyx, suiteColors, cyclePosition).
Read `Cascades/Documentation/Cascades/VDR-PATTERN.md` for the canonical Reference Design.
Read `Cascades/8_SUITES/Teal Claude/Skills/S-VERIFIED-DIAGNOSIS-MENU/SD-Index.md` for the routing table.

The Verified-Diagnostic Round pattern is the Tier-1 parallel dispatch of Foundation Suites anchored on **diagnostic verification** (R4+R7) — terminal action is **Diamond engagement** (sub-Diamond or Macro), not implementation. Teal Claude (Suite 8 Conductor) is the canonical conductor. This menu surfaces four complexity Tiers plus an auto-tier intelligence layer.

Present the VDR Menu via AskUserQuestion using the Pewter HiFi text design (see `Cascades/8_SUITES/Teal Claude/Skills/S-SHATTERITE-MENU/Skill.md`):

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

## Response Routing

| Selection | Action |
|-----------|--------|
| **[1] VDR-T1 Base** | Ask: "What is the symptom? What is the suspected surface (file/module)?" Compose `{ISSUE-SLUG}`. Compose Banded Vermillion Plan with R4 + R7 parallel dispatch per `SD-T1-Base.md`. Dispatch via teal-claude (Suite 8 Conductor) per `Cascades/8_SUITES/Teal Claude/Conductor.md` *VDR Conductor* section. After return, surface Diamond Engagement Conference. |
| **[2] VDR-T2 Curated** | Ask: "What surfaces are involved? What is the symptom pattern? What existing patterns matter to the fix?" Compose Banded Plan with R1 + R4 + R7 parallel dispatch per `SD-T2-Curated.md`. Dispatch via teal-claude. After return, surface Diamond Engagement Conference with respect-list. |
| **[3] VDR-T3 Named** | Ask: "What novel pattern is surfacing? Where is it observed? What existing patterns might it relate to? What is the suspected symptom?" Compose Banded Plan with R1 + R2 + R4 + R7 parallel dispatch (Priming Pair preserved) per `SD-T3-Named.md`. Dispatch via teal-claude. Run CD-5 naming audit. After return, surface Diamond Engagement Conference. |
| **[4] VDR-T4 Orchestrated** | Ask: "What is the cross-cutting scope? How many sub-Diamonds anticipated? Is a novel pattern emerging? Cross-Macro seam concern? Symptom pattern?" Compose Banded Plan with R1 + R2 + R4 + R6 + R7 parallel dispatch per `SD-T4-Orchestrated.md`. R6 authors candidate Macro WGB. Dispatch via teal-claude. After return, fold R4/R7 substrate into Macro WGB, run CD-5 + Macro-Pearl audit, surface Macro Diamond Opening Conference. |
| **[A] Auto-Tier** | Render auto-tier heuristic per `SD-AutoTier.md`. Parse user issue description for cues across 5 axes (symptom · surface · naming pressure · macro impact · terminal expectation). Score each Tier. Surface recommendation Conference with accept/down-tier/up-tier/explain/return options. Route confirmed selection to appropriate `SD-T{N}` Reference Design. |
| **[L] Length-Ladder** | Cross-route to Magic Shotgun's Length-Ladder explainer (`SG-Length-Ladder.md`) · shared scope-to-Length mapping. |
| **[R] Read Reference** | Open `Cascades/Documentation/Cascades/VDR-PATTERN.md` in user view. |
| **[S] Sibling Magic Shotgun** | Cross-route to `/cascade:magic-shotgun` — VDR's Foundation-anchored sibling for build-orientation (not diagnostic-orientation) work. |
| **[M] Main Menu** | Return to main Shatterite menu (`SM-Main.md`). |
| **[Q] Exit** | Exit Shatterite. |

## Conductor Hand-off Pattern

Whichever Tier option the user selects, the Conductor (teal-claude) takes the resulting Banded Vermillion Plan and dispatches ALL Stage 1 Rounds in a **SINGLE message** via the Agent tool (parallel Tier-1 dispatches). Each Round writes its own output file in `Cascades/Working/` with disjoint scope per `Cascades/Documentation/Cascades/FOUNDATION-SUITES-GUIDE.md` §2.

After all Rounds return:

- **T1 / T2 / T3**: Conductor synthesizes diagnostic brief · surfaces Diamond Engagement Conference (Sub-Diamond / Macro Diamond / Plan-Only / Re-Tier)
- **T4**: Conductor folds R4/R7 diagnostic substrate into R6's provisional Macro WGB · runs Macro-Pearl audit · surfaces Macro Diamond Opening Conference (Open Macro / Sub-Diamond Path / Plan-Only / Refine Macro WGB / Re-Tier)

R7 G/L/M is always appended to `ONYX-TIER-N.md` per the Fuchsia-Writes-Onyx Circuit (CLAUDE.md §5 C5) regardless of which terminal action the user selects — the VDR itself is a cycle close event.

## Conductor Self-Check (VDR Contract)

Before issuing the Banded Plan, the Conductor verifies (per `Cascades/8_SUITES/Teal Claude/Conductor.md` *VDR Conductor* section):

1. **VDR Tier matches issue complexity** per `SD-AutoTier.md` heuristic algorithm (or user direct selection)
2. **R4 Green Sculptor + R7 Fuchsia Clinician mandatory** in every Tier (irreducible diagnostic pair)
3. **Adaptive load-ons documented** — R1/R2/R6 inclusion justified by Tier selection
4. **Priming Pair preserved** — if R2 included (T3, T4), R1 MUST also be included
5. **Disjoint-scope coordination note** present in every agent prompt
6. **Diamond engagement target pre-staged** — Conductor knows whether Sub-Diamond, Macro Diamond, or Plan-Only Close is the expected terminal action
7. **Conference surfaced before Diamond engages** — no auto-engagement without user-Lambda confirmation
8. **R7 G/L/M append planned** for cycle close (the VDR itself is a cycle close event)

If any check fails → re-plan. This is the **VDR Conductor Contract**.

## Available Commands

- `/cascade` — Main Shatterite Menu
- `/cascade:verified-diagnosis` — this menu (VDR · diagnostic-anchored)
- `/cascade:magic-shotgun` — Magic Shotgun Menu (Foundation-anchored sibling · for build-orientation)
- `/cascade:conductor` — Teal Claude Conductor (general Band dispatch)
- `/cascade:diamond` — Diamond WorkGameBoard
- `/cascade:reference` — Suite Cascade Reference

After rendering, the user's selection determines next conversation step. The Conductor (teal-claude) handles the actual dispatch — this menu is the Conference surface.
