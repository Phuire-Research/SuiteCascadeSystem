Engage Stratimuxian Automata — autonomous cascade configuration.

Read `Cascades/Cascade.json` for current state.
Read `Cascades/8_SUITES/Stratimuxian Automata/Instance.md` for identity.
Read `Cascades/8_SUITES/Stratimuxian Automata/Skill.md` for the skill cycle.

Present the Automata engagement menu via AskUserQuestion:

```
╔══════════════════════════════════════════════════════════╗
║  STRATIMUXIAN AUTOMATA                      [Base]       ║
║  ─ · ─                                                   ║
║  Autonomous Cascade Engagement via /loop                 ║
║                                                          ║
║  Current State                                           ║
║  ─ · ─                                                   ║
║  Diamond: {activeDiamond or "None — create one first"}   ║
║  Onyx:    {activeOnyx or "None"}                         ║
║  Gate:    {cyclePosition.gate} of 7                      ║
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
║      How many full cycles? (default: 3)                  ║
║  [G] Set Starting Gate               [Green]  — position ║
║      Which gate to begin from? (default: 0 Absorb)       ║
║                                                          ║
║  · · ·                                                   ║
║                                                          ║
║  Engage                                                  ║
║  ─ · ─                                                   ║
║  [F] Full Cascade Loop               [Blue]   — build    ║
║      All 8 gates per rotation, advancing one gate        ║
║      per wake-up. Paste this into /loop:                 ║
║                                                          ║
║  [P] Planning Arc Only               [Orange] — draft    ║
║      Gates 0-4 only (Absorb through Test).               ║
║      Paste this into /loop:                              ║
║                                                          ║
║  [S] Single Gate Step                [Red]    — curate   ║
║      Execute one gate, no loop.                          ║
║      Runs directly — no /loop needed.                    ║
║                                                          ║
║  · · ·                                                   ║
║                                                          ║
║  [M] Main Menu    [Q] Exit                               ║
║                                                          ║
╚══════════════════════════════════════════════════════════╝
```

Response Routing:

[R] — Ask user for rotation count. Write to Cascade.json `cyclePosition.totalRotations`. Re-present menu.

[G] — Ask user which gate (0-7). Write to Cascade.json `cyclePosition.gate`. Re-present menu.

[F] — Write `automata.state: "engaged"` to Cascade.json. Present the /loop prompt for the user to copy:

```
Copy this into your terminal:

/loop "Read Cascades/Cascade.json. Execute Stratimuxian Automata per Cascades/8_SUITES/Stratimuxian Automata/Skill.md — SA-S1 Obsidian Wake, SA-S2 Gate Advance, SA-S3 Delay Select, SA-S4 Lifecycle Close. Advance one gate. Write state to Cascade.json."
```

[P] — Same as [F] but the prompt includes "Gates 0-4 only. Halt after Gate 4 (Test)."

```
Copy this into your terminal:

/loop "Read Cascades/Cascade.json. Execute Stratimuxian Automata per Cascades/8_SUITES/Stratimuxian Automata/Skill.md — SA-S1 Obsidian Wake, SA-S2 Gate Advance (gates 0-4 only), SA-S3 Delay Select, SA-S4 Lifecycle Close. Halt after Gate 4."
```

[S] — Execute one gate directly in this conversation. Read Cascade.json, advance the current gate per SA-S2, write state back. No /loop needed.

[M] — Return to SM-Main.md
[Q] — Exit Shatterite
