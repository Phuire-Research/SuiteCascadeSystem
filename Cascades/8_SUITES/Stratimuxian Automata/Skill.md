# Stratimuxian Automata — Skill Reference

**Version**: 1.0
**Skills**: 4 (SA-S1 through SA-S4)
**Binding**: `/cascade:loop` → `/loop` prompt

---

## Skill Inventory

| Skill | Name | Function |
|-------|------|----------|
| SA-S1 | Obsidian Wake | Read Cascade.json + Diamond + Onyx on wake-up |
| SA-S2 | Gate Advance | Execute the current gate's cognitive function |
| SA-S3 | Delay Select | Choose ScheduleWakeup delay based on context |
| SA-S4 | Lifecycle Close | Write Cascade.json state, decide continue/halt |

---

## SA-S1: Obsidian Wake

**Trigger**: Every ScheduleWakeup firing (each /loop iteration)

**Informative**:
1. Read `Cascades/Cascade.json` → `cyclePosition`, `automata`, `activeDiamond`, `activeOnyx`
2. Read `activeDiamond` → PENDING task list, current cycle/rotation/gate
3. Read `activeOnyx` → latest Rose diagnosis, accumulated G/L/M

**Actionable**:
1. Update `automata.lastWakeUp` to current ISO timestamp
2. Count PENDING tasks → `automata.pendingCount`
3. Evaluate continuation predicate:
   - PENDING > 0 AND rotation <= totalRotations → CONTINUE
   - PENDING == 0 → HALT
   - rotation > totalRotations → HALT
4. If CONTINUE: proceed to SA-S2 (Gate Advance)
5. If HALT: proceed to SA-S4 (Lifecycle Close with state "halted")

**Concluder**: `automata.pendingCount` is a number. It either continues or halts. No ambiguity.

---

## SA-S2: Gate Advance

**Trigger**: SA-S1 returns CONTINUE

**Informative**: Read current `cyclePosition.gate` to determine which cognitive function to execute.

**Actionable**: Execute the gate per the 8-Gate Cycle:

| Gate | Suite | Execution |
|------|-------|-----------|
| 0 | Origin | Obsidian Absorb — already performed by SA-S1. Advance gate. |
| 1 | Curator | Read Diamond scope. Curate signal vs noise this cycle. Write curation note. |
| 2 | Prospector | Name verbosely. Find Diameters between unlike. Write name registry. |
| 3 | Architect | Design plan. Write plan to Diamond WorkGameBoard. |
| 4 | Sculptor | Define success from builder + user perspective. Write test criteria. |
| 5 | Professional | Execute plan within scope. Build gates. Defer discoveries. |
| 6 | Orchestrator | Verify composition. What composes? Check after implementation. |
| 7 | Clinician | Diagnose method: Gainy/Lossy/Maintain. Write to Onyx. Increment cycle. |

**Gate Advancement Rule**: After executing a gate, increment `cyclePosition.gate`. When gate reaches 7 (Rose), Rose fires, gate resets to 0, cycle increments. If cycle > totalRotations at reset, halt.

**Dispatch**: Gates 1-4 execute in-context (planning arc). Gates 5-7 dispatch via Opal Tier 1 when complexity warrants (implementation arc).

---

## SA-S3: Delay Select

**Trigger**: After SA-S2 completes a gate

**Informative**: Read current gate, automata state, and what just happened.

**Actionable**: Select ScheduleWakeup delay:

| Just Completed | Next Gate | Delay | Reason |
|---------------|-----------|-------|--------|
| Gate 0-3 (planning) | Next planning gate | 60s | Fast iteration through planning arc |
| Gate 4 (test criteria) | Gate 5 (build) | 120s | Brief pause before implementation |
| Gate 5 (build) | Gate 6 (compose) | 270s | Build may need time; stay in cache |
| Gate 6 (compose) | Gate 7 (Rose) | 60s | Quick close to diagnosis |
| Gate 7 (Rose) | Gate 0 next cycle | 270s | New cycle intake; stay in cache |
| TESTING state | Same gate | 1200s | Waiting for user Lambda — no rush |

**ScheduleWakeup reason field**: State what gate just completed and what's next. E.g., "Gate 3 Architect complete, advancing to Gate 4 Sculptor".

---

## SA-S4: Lifecycle Close

**Trigger**: SA-S1 returns HALT, or rotation exceeds totalRotations, or user interrupts

**Informative**: Read final Cascade.json state.

**Actionable**:
1. Write `automata.state: "halted"` to Cascade.json
2. If Rose fired this cycle, verify Onyx was updated (Rose-Writes-Onyx invariant)
3. Do NOT call ScheduleWakeup — this ends the /loop

**Output**: Final state summary to the user: cycles completed, rotations completed, PENDING remaining (if any).

---

## /loop Prompt Template

The `/cascade:loop` slash command emits this exact prompt for `/loop`:

```
Read Cascades/Cascade.json for current state. Read the active Diamond and Onyx per Cascade.json paths. Execute the Stratimuxian Automata skill cycle per Cascades/8_SUITES/Stratimuxian Automata/Skill.md: SA-S1 (Obsidian Wake) → SA-S2 (Gate Advance) → SA-S3 (Delay Select) → SA-S4 (Lifecycle Close if halting). Advance one gate per wake-up. Write updated state to Cascade.json after each gate.
```

---

## Diameter Map

| Demometer | Diameter To | Through |
|-----------|------------|---------|
| SA-S1 Obsidian Wake | C5 RI Session Start Protocol | Same Obsidian Absorb pattern |
| SA-S2 Gate Advance | C9 Automata routing table | Same intent → engagement mapping |
| SA-S3 Delay Select | ScheduleWakeup tool | Cache-aware delay selection |
| SA-S4 Lifecycle Close | Cascade.json | State persistence across wake-ups |
| SA-S2 Gate 7 | C8 Onyx | Rose-Writes-Onyx circuit |
| totalRotations | Diamond header | User-set bound for cycle count |
