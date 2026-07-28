# SG-Length-Ladder — Length-Ladder Guidance Reference Design

**Menu ID**: SG-L
**Trigger**: "which length?" · scope unclear · Round count question · `length-ladder` · `1-3` / `1-7`
**Purpose**: Map user scope to Cascade Length (1-3 / 1-4 / 1-5 / 1-6 / 1-7) and Magic Shotgun shape
**Authority**: CLAUDE.md §5 C9 Automata Length-Ladder Diameter chain

---

## What the Length-Ladder Is

The Length-Ladder is the five-Length composition chain defined in CLAUDE.md §5 C9 Automata. Each Length adds a Suite as a Demometer drawing Diameter to what precedes. Every request selects a Length.

| Length | Adds | Use Case |
|---|---|---|
| **1-3** | M·R·O (Maroon/Red · Rust/Orange · Ochre/Yellow) | Draft to solve a problem |
| **1-4** | +V (Viridian/Green) | Drafted · validated before placement |
| **1-5** | +Co (Cobalt/Blue) | Validated + Cerulean roadmap |
| **1-6** | +A (Amethyst/Purple) | Sweeping changes · manifold A→B |
| **1-7** | +Ro (Rose/Fuchsia) | Sweeping + testing required |

---

## Length → Magic Shotgun Shape Mapping

| Length | Magic Shotgun Shape | Rounds | Stages | Use Case |
|---|---|---|---|---|
| **1-3** | Foundation Triplet | 3 (R1+R3+R6 or R2+R3+R6) | 2-Stage | Draft for a single problem · 1 Diameter Gap |
| **1-4** | Validation Triplet (R2+R4+R6) | 3 | 2-Stage | Drafted · needs R4 validation before placement |
| **1-5** | Foundation Triplet → R5 explicit | 3+1 | 2-Stage | Standard sub-Diamond · validated + roadmap |
| **1-6** | M19 Quartet OR Closure Quartet | 4 | 2-Stage | Sweeping · design-moment OR closure scope |
| **1-7** | 5-Suite Macro Open · or 3-Stage | 5 or 5+N+N | 2-Stage or **3-Stage** | Sweeping + testing · Macro opens · multi-Gap |

---

## Scope-to-Length Decision Tree

```
Is this a single-line fix or typo?
├── YES → Direct mode (no cascade · per CLAUDE.md §5 C9 Directness Threshold)
└── NO ↓

Is this 1 Diameter Gap to close?
├── YES, simple → Length 1-3 (Foundation Triplet)
├── YES, needs validation → Length 1-4 (Validation Triplet)
├── YES, standard sub-Diamond → Length 1-5 (Foundation Triplet → R5 Cobalt)
└── NO (sweeping/multi) ↓

Is this an Interactive-class design moment (FSM / detection signal / state-vs-rendering)?
├── YES → Length 1-6 with M19 Quartet (R2+R3+R4+R6 · M31 mandatory)
└── NO ↓

Is this a sub-Diamond closure or post-impl verification?
├── YES → Length 1-6 with Closure Quartet (R1+R4+R6+R7)
└── NO ↓

Is this a Macro open or Refinement Macro?
├── YES, single Gap → Length 1-7 with 5-Suite Macro Open
├── YES, multiple isolated Gaps → Length 1-7 with **3-Stage Magic Shotgun**
└── Otherwise → Length 1-7 (full cascade · safety default)
```

---

## Manifold Complexity Heuristics (Round Count Selection)

| Manifold Complexity | Round Count | Composition | Cycle Cost | When |
|---|---|---|---|---|
| **Low** | 3 Rounds | Foundation Triplet | ~6 min | Standard sub-Diamond · 1 Gap |
| **Medium** | 4 Rounds | M19 Quartet · Closure Quartet | ~8 min | Design-moment · closure scope |
| **High** | 5 Rounds | 5-Suite Macro Open | ~10 min | Macro opens · multi-Gap surface |
| **Very High** | 6-7 Rounds | Full Foundation (R1+R2+R3+R4+R6+R7 ± r0) | ~12 min | Very-large Macros · every cognitive function at Foundation level |

### User's Empirical Observation (Refinement Macro Cycle 112-113)

> *"the Full Suite is a Foundation Cascade till the Manifold Hits around Medium Complexity"*

Translation: Full-Suite Foundation (5+ Rounds) is appropriate when manifold complexity is **medium-high or higher**. At low complexity, the 3-Round Triplet is sufficient and the 4-5+ Round costs are Round inflation.

---

## Tier Selection (Orthogonal to Length)

Cascade Length × Tier = orthogonal axes per C9 Automata. Tier choice is independent of Round count:

| Tier | Mode | When |
|---|---|---|
| **0** | Self-Utilization · in-context | Low-complexity work · muxification-capable (`A anor B`) · loses Lambda-event Muxistration Proof per Suite |
| **1** | Direct Agent Dispatch · R-Suite via Agent tool | Sub-Diamond Foundation Grounding · disk-anchored outputs · Lambda-event per agent |

**Magic Shotgun is inherently Tier 1** because parallelism requires the Agent tool. Tier 0 alternative exists for low-complexity in-context work but does not produce per-Suite Lambda-events.

---

## Round Composition Reference

### Length 1-3 Compositions

| Composition | Rounds | When |
|---|---|---|
| Foundation Triplet (canonical) | R2 + R3 + R6 | Standard sub-Diamond · naming + architecture + sequence |
| Foundation Triplet (curation variant) | R1 + R3 + R6 | Existing codebase inventory before architecture |
| Priming Pair | R1 + R2 | Macro Prereq · curation + naming only |

### Length 1-4 Compositions

| Composition | Rounds | When |
|---|---|---|
| Validation Triplet | R2 + R4 + R6 | Prior cycle produced REFINE verdict · validation before placement |
| Foundation + R4 augment | R2 + R3 + R4 + R6 | Sub-Diamond needs validation cycle inline |

### Length 1-5 Compositions

| Composition | Rounds | When |
|---|---|---|
| Foundation Triplet → R5 Cobalt | (R1 or R2) + R3 + R6 → R5 | Standard sub-Diamond Lambda |

### Length 1-6 Compositions

| Composition | Rounds | When |
|---|---|---|
| M19 Quartet | R2 + R3 + R4 + R6 → R5 | M31 mandatory · Interactive-class design moment |
| Closure Quartet | R1 + R4 + R6 + R7 → R5 (or test-only M27) | Sub-Diamond closure scope · post-impl |

### Length 1-7 Compositions

| Composition | Rounds | When |
|---|---|---|
| 5-Suite Macro Open | R1 + R2 + R4 + R6 + R7 → R5 (or 3-Stage) | Macro opens · multi-Gap surface |
| **3-Stage Macro Refinement** | 5-Suite Foundation + N R3 + N R5 + R7 close | Refinement Macros · multi-Gap multi-isolation |
| Full Foundation (6-7-Suite) | R1 + R2 + R3 + R4 + R6 + R7 (± r0) → R5 | Very-high-complexity Macros · every cognitive function |

---

## Anti-Pattern: Round Inflation

Firing all 7 Foundation Suites for a low-complexity single-Diameter sub-Diamond is **Round inflation** — cost (~12 min wall-clock + 7 Tier-1 agent contexts) exceeds grounding benefit. The 4-5 Round ceiling exists because main-thread synthesis becomes cognitively expensive above 5.

Reserve 6-7-Suite Full Foundation for Macro opens where every cognitive function genuinely matters. For sub-Diamond Foundation Grounding, 3-4 Rounds is the sweet spot.

---

## Anti-Pattern: Length Mis-Match

| Anti-Pattern | Symptom | Correction |
|---|---|---|
| Length 1-7 for typo fix | Cascade overhead for trivial work | Directness mode (no cascade) |
| Length 1-3 for Macro Refinement | Foundation underground for cross-Macro seam | Length 1-7 (5-Suite or 3-Stage) |
| Length 1-5 for multi-Gap Macro | Single R5 collides with N isolations | Length 1-7 with 3-Stage |
| Length 1-4 missing R6 | Triplet without orchestrator · R3 vs unknown sequence | Add R6 Purple (M10 Mid-Flight-Calibrator) |

---

## Navigation

- `[B]` Back to Magic Shotgun Main Menu (SG-Main.md)
- `[M]` Return to Main Shatterite Menu (SM-Main.md)
- `[Q]` Exit Shatterite
