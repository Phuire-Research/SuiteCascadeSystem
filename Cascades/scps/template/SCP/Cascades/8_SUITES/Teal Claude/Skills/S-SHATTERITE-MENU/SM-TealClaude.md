# SM-TealClaude — Teal Claude Conductor Menu Reference Design

**Menu ID**: SM-3
**Trigger**: Band assignment, strategy execution, agent dispatch, conductor operations
**Pewter Design**: Blue spectrum — implementation and professional execution

---

## Menu Template

```
<AskUserQuestion>
╔══════════════════════════════════════════════════════════╗
║  TEAL CLAUDE CONDUCTOR                      [Blue]       ║
║  ── Blue · Blue · Blue · Blue · Blue · Blue · Blue ──   ║
╠══════════════════════════════════════════════════════════╣
║                                                          ║
║  "Issue Bands" — Delegation Assignment                   ║
║  ─ · ─                                                   ║
║  [1] Band 1  [Red Curator]           r1-red    — haiku   ║
║  [2] Band 2  [Orange Prospector]     r2-orange — sonnet  ║
║  [3] Band 3  [Yellow Architect]      r3-yellow — sonnet  ║
║  [4] Band 4  [Green Sculptor]        r4-green  — sonnet  ║
║  [5] Band 5  [Blue Professional]     r5-blue   — opus    ║
║  [6] Band 6  [Purple Orchestrator]   r6-purple — sonnet  ║
║  [7] Band 7  [Fuchsia Clinician]     r7-fuchsia — sonnet ║
║                                                          ║
║  · · ·                                                   ║
║                                                          ║
║  Strategies                                              ║
║  ─ · ─                                                   ║
║  [N] Suite 8 Creation Strategy       [Yellow] — design   ║
║      Convert system prompt to Suite 8 instance           ║
║                                                          ║
║  · · ·                                                   ║
║                                                          ║
║  "Let's" — Conductor Operations                          ║
║  ─ · ─                                                   ║
║  [V] Compose Vermillion Plan         [Purple] — plan     ║
║      "We are Going to..." — scope, then Banded plan      ║
║  [O] Opal Dispatch (Tier 1)          [Blue]   — dispatch ║
║      "Issue N Instances" — select Suite(s), dispatch      ║
║  [D] Engage your Diamond             [Green]  — cascade  ║
║      "Engage your Diamond" — enter Planning Mode          ║
║                                                          ║
║  · · ·                                                   ║
║                                                          ║
║  [M] Main Menu    [Q] Exit                               ║
║                                                          ║
╚══════════════════════════════════════════════════════════╝
</AskUserQuestion>
```

---

## Response Routing

Delegation follows the P6 Architecture: (1) Scope declaration, (2) Suite assignment, (3) Coordination, (4) Integration.

| Selection | Action |
|-----------|--------|
| **1-7** | Display Band detail: Suite function, agent ID, default scale, specialization. Offer to dispatch — "Use [Suite] with a Focus on [task]" (P3 scoped dispatch) |
| **N** | Launch `Strategy/Suite8CreationStrategy.md` — Gate 1 (Backup Precaution) |
| **V** | Enter Vermillion composition — P6 flow: "We are Going to..." (scope) → "Noting we can Dispatch..." (assign Bands) → "Then from there..." (sequence) → "For Muxification..." (integrate) |
| **O** | Present Opal dispatch flow: "Issue N Instances of [Suite]" → select Scale → compose Curry → dispatch Agent. Noting: Opal = Tier 1 only, cannot muxify |
| **D** | "Engage your Diamond" — Enter Diamond Planning Mode → Vermillion plan with Bands → user says "Approved" (P3 gate passage) → execute |
| **M** | Return to SM-Main.md |
| **Q** | Exit Shatterite |

---

## Band Detail View (Sub-rendering)

When user selects a band number (1-7):

```
╔══════════════════════════════════════════════════════════╗
║  BAND {N} — {COLOR} {ROLE}              [{Color}]        ║
║  ─ · ─                                                   ║
║  Agent: r{n}-{color}                                     ║
║  Scale: {Precise|Analytical|Comprehensive}               ║
║  Specialization: {specialization}                        ║
║                                                          ║
║  Informative: {I column from Suite table}                ║
║  Actionable:  {A column from Suite table}                ║
║  Lambda:      {Lambda Base Aspect}                       ║
║                                                          ║
║  [G] Dispatch this Band with task    [Blue]              ║
║  [B] Back to Conductor                                   ║
╚══════════════════════════════════════════════════════════╝
```

---

## Opal Dispatch Flow (Sub-rendering)

P6 Delegation Architecture applied: Scope → Assign → Coordinate → Integrate.

```
╔══════════════════════════════════════════════════════════╗
║  OPAL DISPATCH — TIER 1                     [Blue]       ║
║  ─ · ─                                                   ║
║  "Issue Instances" — select Suite(s) (1-3):              ║
║  Enter suite numbers separated by commas                 ║
║  (e.g., "1,4" for Red Curator + Green Sculptor)          ║
║                                                          ║
║  Scale Selection:                                        ║
║  [P] Precise (haiku)     — inventory, file structure     ║
║  [A] Analytical (sonnet) — pattern discovery, review     ║
║  [C] Comprehensive (opus) — implementation, build gates  ║
║                                                          ║
║  Noting: 3+ Suites spanning exploration → review         ║
║  should prefer Diamond over Opal dispatch                ║
║                                                          ║
║  [B] Back to Conductor                                   ║
╚══════════════════════════════════════════════════════════╝
```
