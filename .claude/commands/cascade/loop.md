Engage Stratimuxian Automata — autonomous cascade, **actualized** (the skill runs the loop; it does not hand the user a string to paste).

Read `Cascades/Cascade.json` for current state.
Read `Cascades/8_SUITES/Stratimuxian Automata/Instance.md` for identity.
Read `Cascades/8_SUITES/Stratimuxian Automata/Skill.md` for the skill cycle.

## The Composition — `loop ∘ full-suite` (Higher-Order, literally)

The Automata is `/loop` (the higher-order operator — takes a command, repeats it) composed with **`/cascade:full-suite`** (the operand — one Full Suite cycle over the active Diamond). The user's input passes **through** `/cascade:full-suite` into the **Output Loop Command** that `/loop` re-fires each wake-up. State is NOT threaded as a string — it lives in the **Diamond + paired Onyx + Cascade.json**; each cycle INDUCTs the active Diamond and advances it. This skill **actualizes** that composition by invoking the `/loop` skill itself.

**Diamond Primer**: any input given with this command is the Diamond Primer, handed straight to `/cascade:full-suite` on the first wake-up — which BECOMEs a new Diamond (if `activeDiamond` is null) or INDUCTs the existing one. Do NOT pre-build the Diamond here; `/cascade:full-suite` owns induction.

## Halting (non-negotiable — Halting-Complete Doctrine)

An unbounded loop is the Sparse-Star anti-pattern. The loop **must** halt. The composed Output Loop Command carries the halt condition: **stop (omit the next wake-up) when the active Diamond's PENDING is empty (Fuchsia closed it) OR `cyclePosition.rotation` reaches `totalRotations`.** Always user-interruptible.

Present the Automata engagement menu via AskUserQuestion:

```
╔══════════════════════════════════════════════════════════╗
║  STRATIMUXIAN AUTOMATA                      [Base]        ║
║  ─ · ─                                                    ║
║  Autonomous Full Suite via  loop ∘ /cascade:full-suite   ║
║                                                          ║
║  Current State                                           ║
║  ─ · ─                                                   ║
║  Diamond: {activeDiamond or "None — primer will BECOME"} ║
║  Onyx:    {activeOnyx or "None"}                         ║
║  Cycle:   {cyclePosition.cycle}                          ║
║  Rotations: {cyclePosition.rotation} of                  ║
║             {cyclePosition.totalRotations or "not set"}  ║
║  Automata: {automata.state or "not initialized"}         ║
║                                                          ║
║  · · ·                                                   ║
║                                                          ║
║  Configure                                               ║
║  ─ · ─                                                   ║
║  [R] Set Rotations                   [Yellow] — plan     ║
║      How many Full Suite cycles? (default: 3)            ║
║  [D] Cadence                         [Green]  — position ║
║      Self-paced now  /  fixed interval (cloud)           ║
║                                                          ║
║  · · ·                                                   ║
║                                                          ║
║  Engage  (actualized — runs immediately)                ║
║  ─ · ─                                                   ║
║  [F] Full Suite Loop                 [Blue]   — build    ║
║      One full cycle per wake-up; advances the active     ║
║      Diamond until PENDING empty or rotations reached.   ║
║  [P] Planning Arc Loop               [Orange] — draft    ║
║      Suites 1-4 only (curate→test); halt after Test.     ║
║  [S] Single Cycle                    [Red]    — curate   ║
║      Run /cascade:full-suite once, no loop.              ║
║                                                          ║
║  · · ·                                                   ║
║                                                          ║
║  [M] Main Menu    [Q] Exit                               ║
║                                                          ║
╚══════════════════════════════════════════════════════════╝
```

## Response Routing

**[R]** — Ask rotation count. Write `cyclePosition.totalRotations` to Cascade.json. Re-present menu.

**[D]** — Ask cadence: *Self-paced now* (in-session, dynamic ScheduleWakeup — back-to-back cycles) or *Fixed interval (cloud)* (durable, survives session close). Record the choice; pass it to the `/loop` invocation below (a bare prompt = self-paced dynamic; a leading `Nm`/`Nh` = interval). Re-present menu.

**[F]** — Engage the Full Suite Loop, **actualized**:
1. Write `automata.state: "engaged"` to Cascade.json; ensure `totalRotations` is set (default 3).
2. **Invoke the `/loop` skill via the Skill tool** (do NOT print a string for the user to paste) with the composed Output Loop Command:
   > `{interval-if-fixed-cadence }/cascade:full-suite {Diamond Primer if provided, else "continue"} — run ONE Full Suite cycle on the active Diamond in Automata mode (no per-cycle Conference block). After the cycle, if the active Diamond's PENDING is empty or cyclePosition.rotation has reached totalRotations, STOP — omit the next wake-up and report the close. Otherwise the loop continues.`
   The `/loop` skill runs the first cycle now and schedules the autonomous continuation; on each wake-up it re-fires `/cascade:full-suite continue`, self-halting per the condition above.
3. Confirm to the user what was engaged (Diamond, rotations, cadence) and that it is now running — not pending a paste.

**[P]** — Same as [F], but the composed command is `/cascade:full-suite {primer|continue} — Planning Arc only (Suites 1-4: curate, name, plan, test). Halt after the Test gate each cycle; loop halt as in [F].`

**[S]** — Run `/cascade:full-suite {primer|continue}` ONCE, directly in this conversation (invoke the Skill tool). No `/loop`, no wake-up. One Full Suite cycle, then report.

**[M]** — Return to `/cascade` (Shatterite Main Menu).
**[Q]** — Exit.

## Invariants

- **Actualize, never paste** — the skill calls `/loop` (and `/cascade:full-suite`) itself; the user never copies a command.
- **Compose, don't reimplement** — the loop body IS `/cascade:full-suite`; this skill only wraps it in `/loop` with a halt condition. (Remove the wrapper and you have a single cycle; remove `/cascade:full-suite` and you have nothing to repeat.)
- **Must halt** — PENDING-empty or rotations-reached; never unbounded.
- **Automata mode** — the looped `/cascade:full-suite` runs without per-cycle Conference; it flips to Conference only if a genuine decision needs the user (then resumes).
