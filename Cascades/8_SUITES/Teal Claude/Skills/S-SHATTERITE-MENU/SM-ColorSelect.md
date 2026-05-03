# SM-ColorSelect — Suite Color Selection Questionnaire

**Menu ID**: SM-4
**Trigger**: First engagement (`colorSelectionComplete: false` in Cascade.json), or `[M] > [P]` from Main Menu
**Pewter Design**: Full spectrum — colors revealed as assigned through succession
**State Write**: Populates `suiteColors` in `Cascades/Cascade.json`

---

## Overview

This questionnaire walks through each Suite (0-7) in succession. For each cognitive function, the user answers a question about their approach. Based on the character of their answer, the system assigns a color from the available pool. Once assigned, that color exits the pool — every Suite receives a unique color.

**Flow**: Suite 0 -> Suite 1 -> Suite 2 -> ... -> Suite 7 -> Write Cascade.json -> Confirm

---

## Color Character Map

Each color has an intrinsic character. The questionnaire maps answers to colors through this character alignment:

| Color | Character | Resonates With |
|-------|-----------|---------------|
| **Red** | Decisive, direct, action-oriented | Cutting through noise, bold moves, clarity through removal |
| **Orange** | Exploratory, curious, boundary-pushing | Finding frontiers, naming the unnamed, restless discovery |
| **Yellow** | Structural, systematic, blueprint-minded | Planning before acting, respecting prior work, gridlines |
| **Green** | Thorough, patient, multi-angle | Examining everything, bidirectional thinking, organic growth |
| **Blue** | Precise, professional, gate-driven | Executing with checkpoints, sequenced delivery, build discipline |
| **Purple** | Connective, relational, pattern-weaving | Seeing between things, orchestrating sequences, network thinking |
| **Fuchsia** | Diagnostic, clinical, circuit-closing | Finding root causes, refining to foundation, spiral examination |
| **Base** | Grounding, absorptive, foundational | Holding space, neutral frame, contextual awareness |

---

## Questionnaire Sequence

### Gate 0 — Suite 0: Origin (Absorb)

```
<AskUserQuestion>
╔══════════════════════════════════════════════════════════╗
║  SUITE COLOR SELECTION                  Gate 0 of 7      ║
║  ── · ── · ── · ── · ── · ── · ── · ── · ── · ── ──   ║
╠══════════════════════════════════════════════════════════╣
║                                                          ║
║  Suite 0 — Origin                                        ║
║  The foundation. How you ground before any cycle begins. ║
║  ─ · ─                                                   ║
║  When you return to a project after time away,           ║
║  how do you re-establish your bearings?                  ║
║                                                          ║
║  [A] Read everything systematically before touching      ║
║  [B] Scan for what changed and react to signals          ║
║  [C] Find one thread and follow it to reorient           ║
║  [D] Sit with the whole picture until it settles         ║
║                                                          ║
║  Available: {remaining_colors}                           ║
║                                                          ║
╚══════════════════════════════════════════════════════════╝
</AskUserQuestion>
```

**Answer Mapping**:
- A → Blue (systematic, gate-driven)
- B → Red (decisive, signal-oriented)
- C → Orange (exploratory, thread-following)
- D → Base (absorptive, grounding)

---

### Gate 1 — Suite 1: Curator

```
║  Suite 1 — Curator                                       ║
║  Signal from noise. How you decide what stays.           ║
║  ─ · ─                                                   ║
║  When facing information overload,                       ║
║  how do you find what matters?                           ║
║                                                          ║
║  [A] Prune aggressively — remove until clarity appears   ║
║  [B] Categorize into structures — build a map            ║
║  [C] Follow the energy — what pulls attention is signal  ║
║  [D] Compare against purpose — does it serve the goal?   ║
```

**Answer Mapping**:
- A → Red (decisive, cuts through)
- B → Yellow (structural, taxonomy-building)
- C → Orange (curious, energy-following)
- D → Blue (precise, purpose-driven)

---

### Gate 2 — Suite 2: Prospector

```
║  Suite 2 — Prospector                                    ║
║  Naming the unnamed. How you approach the frontier.      ║
║  ─ · ─                                                   ║
║  When you encounter something that has no name yet,      ║
║  how do you identify it?                                 ║
║                                                          ║
║  [A] Describe it exhaustively until the name emerges     ║
║  [B] Find what it's similar to — name by analogy         ║
║  [C] Test its boundaries — name by what it isn't         ║
║  [D] Let it name itself through use — observe first      ║
```

**Answer Mapping**:
- A → Orange (verbose naming, exhaustive)
- B → Purple (connective, relational)
- C → Fuchsia (diagnostic, boundary-finding)
- D → Green (patient, multi-angle observation)

---

### Gate 3 — Suite 3: Architect

```
║  Suite 3 — Architect                                     ║
║  Blueprint before build. How you design solutions.       ║
║  ─ · ─                                                   ║
║  When you need to design something new,                  ║
║  what guides your first moves?                           ║
║                                                          ║
║  [A] Respect what exists — extend, don't replace         ║
║  [B] Start from principles — derive the structure        ║
║  [C] Sketch many options — converge through comparison   ║
║  [D] Build the smallest working piece — let shape emerge ║
```

**Answer Mapping**:
- A → Yellow (respectful, prior-honoring)
- B → Blue (principled, structured)
- C → Green (multi-angle, comparative)
- D → Orange (exploratory, emergence-oriented)

---

### Gate 4 — Suite 4: Sculptor

```
║  Suite 4 — Sculptor                                      ║
║  Every angle examined. How you validate work.            ║
║  ─ · ─                                                   ║
║  When reviewing something before it ships,               ║
║  what is your instinct?                                  ║
║                                                          ║
║  [A] Rotate it — check from builder, user, and critic    ║
║  [B] Stress test it — find where it breaks               ║
║  [C] Compare against the original intent — does it match ║
║  [D] Ask someone else — fresh eyes see what you can't    ║
```

**Answer Mapping**:
- A → Green (all-angles, bidirectional)
- B → Fuchsia (diagnostic, stress-testing)
- C → Yellow (blueprint comparison)
- D → Purple (connective, collaborative)

---

### Gate 5 — Suite 5: Professional

```
║  Suite 5 — Professional                                  ║
║  Execute with gates. How you build things.               ║
║  ─ · ─                                                   ║
║  When implementation begins,                             ║
║  how do you sequence your work?                          ║
║                                                          ║
║  [A] Checkpoint-driven — verify at each gate             ║
║  [B] Flow state — build continuously, review at end      ║
║  [C] Dependency-ordered — foundations first, always       ║
║  [D] Spike first — prove the hard part, then fill in     ║
```

**Answer Mapping**:
- A → Blue (professional, gate-driven)
- B → Orange (flow, momentum)
- C → Yellow (structural, ordered)
- D → Red (decisive, risk-first)

---

### Gate 6 — Suite 6: Orchestrator

```
║  Suite 6 — Orchestrator                                  ║
║  Sequence between all things. How you coordinate.        ║
║  ─ · ─                                                   ║
║  When multiple workstreams need coordination,            ║
║  how do you hold them together?                          ║
║                                                          ║
║  [A] Map the dependencies — sequence reveals itself      ║
║  [B] Find the rhythm — each piece has its natural order  ║
║  [C] Centralize decisions — one point of truth           ║
║  [D] Let teams self-organize — intervene only at joints  ║
```

**Answer Mapping**:
- A → Purple (connective, pattern-weaving)
- B → Green (patient, organic rhythm)
- C → Blue (precise, centralized)
- D → Base (grounding, space-holding)

---

### Gate 7 — Suite 7: Clinician

```
║  Suite 7 — Clinician                                     ║
║  Close the circuit. How you diagnose and refine.         ║
║  ─ · ─                                                   ║
║  When something isn't working and nobody knows why,      ║
║  how do you find the root cause?                         ║
║                                                          ║
║  [A] Trace backwards — follow the chain to where it broke║
║  [B] Isolate variables — binary search for the fault     ║
║  [C] Read the symptoms holistically — the pattern tells  ║
║  [D] Reproduce it — if you can trigger it, you can fix it║
```

**Answer Mapping**:
- A → Fuchsia (diagnostic, circuit-tracing)
- B → Red (decisive, surgical)
- C → Purple (relational, pattern-reading)
- D → Blue (professional, reproducible)

---

## Assignment Protocol

### Color Pool Management

Start with full pool: `[Base, Red, Orange, Yellow, Green, Blue, Purple, Fuchsia]`

At each gate:
1. Present the question with 4 options
2. Map the selected answer to its corresponding color
3. **If the mapped color is still in the pool**: assign it, remove from pool
4. **If the mapped color is already assigned**: select the closest available color by character affinity:

| If Mapped Color Taken | Affinity Order (try first → last) |
|----------------------|-----------------------------------|
| Red | Fuchsia → Orange → Blue |
| Orange | Red → Green → Yellow |
| Yellow | Blue → Green → Purple |
| Green | Yellow → Purple → Orange |
| Blue | Yellow → Purple → Red |
| Purple | Blue → Green → Fuchsia |
| Fuchsia | Red → Purple → Green |
| Base | Green → Blue → Yellow |

### Final Assignment Gate

After all 8 questions:

```
╔══════════════════════════════════════════════════════════╗
║  COLOR SELECTION COMPLETE                                ║
║  ── {c0} · {c1} · {c2} · {c3} · {c4} · {c5} · {c6} · {c7} ── ║
╠══════════════════════════════════════════════════════════╣
║                                                          ║
║  Your Suite Cascade Colors                               ║
║  ─ · ─                                                   ║
║  Suite 0  {c0}  Origin        — {why_0}                  ║
║  Suite 1  {c1}  Curator       — {why_1}                  ║
║  Suite 2  {c2}  Prospector    — {why_2}                  ║
║  Suite 3  {c3}  Architect     — {why_3}                  ║
║  Suite 4  {c4}  Sculptor      — {why_4}                  ║
║  Suite 5  {c5}  Professional  — {why_5}                  ║
║  Suite 6  {c6}  Orchestrator  — {why_6}                  ║
║  Suite 7  {c7}  Clinician     — {why_7}                  ║
║                                                          ║
║  [A] Accept — write to Cascade.json                      ║
║  [R] Retake questionnaire                                ║
║  [D] Use defaults (Red·Orange·Yellow·Green·Blue·Purple·Fuchsia) ║
║  [S] Swap two colors: {suite_a} <-> {suite_b}            ║
║                                                          ║
╚══════════════════════════════════════════════════════════╝
```

### Cascade.json Write

On acceptance, update `Cascades/Cascade.json`:

```json
{
  "suiteColors": {
    "0": "{assigned_color_0}",
    "1": "{assigned_color_1}",
    ...
  },
  "colorSelectionComplete": true
}
```

Read-back required (C4 Concluder).

---

## Cross-References

- **Cascade.json**: `Cascades/Cascade.json` — state file written by this questionnaire
- **Skill.md**: Shatterite Skill reads `suiteColors` to render all menus with personalized colors
- **Pewter Tessera**: HiFi Color Token Architecture (D1) — the 8-suite color variable system
- **SM-Main.md**: Personalize option routes here; trigger on `colorSelectionComplete: false`
