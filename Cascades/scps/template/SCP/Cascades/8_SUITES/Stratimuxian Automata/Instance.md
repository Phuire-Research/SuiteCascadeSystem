# Stratimuxian Automata — Suite 8 Instance

**Designation**: Stratimuxian Automata
**Configuration**: Direct
**Domain**: Autonomous Cascade Engagement via /loop
**Crystraline Diameter**: C9 Automata (MANUAL routing) ↔ Stratimuxian Automata (autonomous routing)

---

## Identity

Stratimuxian Automata is the autonomous engagement layer of the Suite Cascade. Where C9 Automata in the CLAUDE.md manifold routes engagement MANUALLY (user = continuation signal), this Suite 8 manages the same routing AUTONOMOUSLY via Claude Code's `/loop` mechanism.

The Diameter between C9 and this Suite 8: C9 supplies the routing table (intent → engagement), the cascade length selection, and the tier topology. Stratimuxian Automata supplies the continuation predicate, delay selection, and lifecycle management that makes the routing table self-executing.

---

## Muxification Origin

**Manual Routing** (C9 Automata — what exists) ↔ **Autonomous Execution** (Stratimuxian Automata — what this Suite 8 adds). The Diameter: the routing decisions are identical — only the continuation mechanism differs. Manual waits for user. Autonomous schedules wake-up.

---

## The Router (the doors this Suite opens)

The Instance names the door; the Skill or Strategy expands the specifics as the sequence reaches it. **This Suite holds no `Skills/` subdirectory and no `Strategy/` file yet** — it is a Direct configuration, so there is no door-table to draw. In their place the routing lives in two flat files: this Instance carries the mechanism (the `/loop` binding · the Cascade.json automata fields · the continuation predicate · the cache-aware delay selection), and the sibling `Skill.md` carries the four inline skills the wake-up executes — SA-S1 Obsidian Wake · SA-S2 Gate Advance · SA-S3 Delay Select · SA-S4 Lifecycle Close. The `/loop` prompt below points at that `Skill.md` directly; it IS the dispatch.

What would land here first, were this Suite to grow doors: SA-S1..SA-S4 extracted from the flat `Skill.md` into `Skills/`, one per wake-up phase, each with its own Concluder over `Cascades/Cascade.json` — and a `Strategy/` Vermillion for the loop lifecycle end to end (engage → advance → halt). Until then, read this Instance and `Skill.md`; nothing else is served.

---

## /loop Binding

The entire Suite 8 activates via a single `/loop` prompt:

```
/loop "Read Cascades/Cascade.json. Execute Stratimuxian Automata per Cascades/8_SUITES/Stratimuxian Automata/Skill.md"
```

Or via the slash command: `/cascade:loop`

This single line binds the /loop mechanism to the full Suite Cascade. On each wake-up, the Automata reads Cascade.json, performs Obsidian Absorb, and advances the cascade.

---

## Cascade.json Schema (Automata Fields)

```json
{
  "activeDiamond": "Cascades/Working/DIAMOND-TIER-1.md",
  "activeOnyx": "Cascades/Working/ONYX-TIER-1.md",
  "suiteColors": { "0": "Base", ... },
  "cyclePosition": {
    "cycle": 1,
    "rotation": 1,
    "totalRotations": 3,
    "gate": 0
  },
  "colorSelectionComplete": true,
  "automata": {
    "state": "engaged",
    "lastWakeUp": "2026-04-29T10:00:00Z",
    "delaySeconds": 270,
    "pendingCount": 5,
    "gatesCompleted": 0
  }
}
```

| Field | Type | Function |
|-------|------|----------|
| `cyclePosition.totalRotations` | number | User-set bound. Loop stops when `rotation > totalRotations` |
| `automata.state` | `"engaged"` \| `"halted"` \| `"paused"` | Current lifecycle state |
| `automata.lastWakeUp` | ISO timestamp | When the last ScheduleWakeup fired |
| `automata.delaySeconds` | number | Current delay selection |
| `automata.pendingCount` | number | Diamond PENDING count at last read |
| `automata.gatesCompleted` | number | Gates completed in current cycle |

---

## Continuation Predicate

The Diamond Document's PENDING task count IS the autonomous loop's continuation predicate:

| Condition | Action |
|-----------|--------|
| PENDING > 0 AND rotation <= totalRotations | ScheduleWakeup → continue |
| PENDING == 0 | Write `automata.state: "halted"` → stop loop |
| rotation > totalRotations | Write `automata.state: "halted"` → stop loop |
| User interrupts | Automata pauses — user = override signal |

---

## Delay Selection (Cache-Aware)

| Context | Delay | Reasoning |
|---------|-------|-----------|
| Active build (Gate 5 in progress) | 270s | Stay in prompt cache (5-min TTL) |
| Post-Rose, next cycle intake | 270s | Quick re-engage for Obsidian Absorb |
| Waiting for user test (TESTING state) | 1200s | No point checking sooner — user Lambda required |
| Idle (no PENDING, watching) | 1800s | Amortize cache miss over long wait |

**Never 300s** — worst of both: pays cache miss without amortizing it.

---

## Scope

**In Scope**: /loop lifecycle management, Cascade.json automata state, gate advancement, delay selection, continuation predicate, Obsidian Absorb on wake-up.

**Out of Scope**: The cognitive functions themselves (those are Suites 0-7). Automata manages WHEN and WHETHER to engage them, not HOW they execute.
