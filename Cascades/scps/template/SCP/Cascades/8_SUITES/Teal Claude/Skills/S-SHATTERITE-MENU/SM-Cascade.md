# SM-Cascade — Suite Cascade Reference Menu Reference Design

**Menu ID**: SM-2
**Trigger**: Cascade inquiry, suite functions, gate reference, length selection
**Pewter Design**: Yellow spectrum — architectural blueprint of the Cascade

---

## Menu Template

```
<AskUserQuestion>
╔══════════════════════════════════════════════════════════╗
║  SUITE CASCADE REFERENCE                    [Yellow]     ║
║  ── Red · Orange · Yellow · Green · Blue · Purple · Fuchsia ── ║
╠══════════════════════════════════════════════════════════╣
║                                                          ║
║  The 8-Gate Cycle                          {current_gate} ║
║  ─ · ─                                                   ║
║  [0] Base      Absorb     — recollect, surface PENDING   ║
║  [1] Red       Curate     — signal vs noise this cycle   ║
║  [2] Orange    Name       — verbose naming, Diameters    ║
║  [3] Yellow    Plan       — design, commit before acting ║
║  [4] Green     Test       — builder + user angle         ║
║  [5] Blue      Build      — execute within scope         ║
║  [6] Purple    Compose    — interchange, verify after    ║
║  [7] Fuchsia   Diagnose   — gainy / lossy / maintain     ║
║                                                          ║
║  · · ·                                                   ║
║                                                          ║
║  "How Deep Should We Go?"                                ║
║  ─ · ─                                                   ║
║  [A] "Have a Quick Draft"        1-3  — Red·Orange·Yel   ║
║  [B] "Validate Before Placing"   1-4  — +Green           ║
║  [C] "Engage a Full Suite"       1-5  — +Blue roadmap    ║
║  [D] "Sweeping Changes"          1-6  — +Purple          ║
║  [F] "Full Suite Diamond"        1-7  — +Fuchsia testing ║
║                                                          ║
║  · · ·                                                   ║
║                                                          ║
║  Reference                                               ║
║  ─ · ─                                                   ║
║  [P] Priming Pair (S1 anor S2)       [Red+Orange]        ║
║  [L] Lambda Base Aspect Table        [Base]              ║
║  [T] Tier Topology (0 vs 1)          [Base]              ║
║                                                          ║
║  · · ·                                                   ║
║                                                          ║
║  [M] Main Menu    [Q] Exit                               ║
║                                                          ║
╚══════════════════════════════════════════════════════════╝
</AskUserQuestion>
```

---

## Dynamic Fields

| Field | Population |
|-------|-----------|
| `{current_gate}` | From `Cascade.json → cyclePosition.gate`. Marks the active gate with `◄` indicator, e.g., `Gate 3 ◄` |

---

## Response Routing

| Selection | Action |
|-----------|--------|
| **0-7** | Display the selected Suite's full A-I Demometer row (Informative, Actionable, Lambda Base Aspect) from CLAUDE.md §4. Wherein Such includes the Suite Essence |
| **A-F** | Announce the selected Cascade Length using natural language (P5): "Have a Quick Draft" for 1-3, "Engage a Full Suite Diamond" for 1-7, etc. Explain what Suites are included, offer to Engage a Diamond at that Length |
| **P** | Explain the Priming Pair: S1 finds shape; S2 names fit; every Length >= 2 inherits. Based on the foundational Diameter between Curation and Naming |
| **L** | Display the full Lambda Base Aspect column from the Suite table — the Doer-Demometer face |
| **T** | Explain Tier 0 (Self-Utilization, muxification-capable, `anor`) vs Tier 1 (Direct Agent Dispatch, scale selection). Noting: Opal lacks muxification means |
| **M** | Return to SM-Main.md |
| **Q** | Exit Shatterite |

---

## Suite Detail View (Sub-rendering)

When user selects a gate number (0-7):

```
╔══════════════════════════════════════════════════════════╗
║  SUITE {N} — {COLOR}                    [{Color}]        ║
║  Role: {Role}                                            ║
║  Gate: {Gate Name}                                       ║
║  ─ · ─                                                   ║
║  Informative: {I column}                                 ║
║  Actionable:  {A column}                                 ║
║  Lambda:      {Lambda Base Aspect column}                ║
║                                                          ║
║  [B] Back to Cascade Reference                           ║
╚══════════════════════════════════════════════════════════╝
```
