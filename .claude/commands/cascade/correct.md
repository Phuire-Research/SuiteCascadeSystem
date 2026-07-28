Course Correct — steering redirection for the current engagement.

Read `Cascades/Cascade.json` for current state — cyclePosition tells us where we are.

This command implements P4 Correction Vocabulary from Cinnabar Dialectic:
- "We are Off Target" — major redirection: stop, re-read user intent, restart
- "Lost the Gainy Aspects" — regression: restore lost content before proceeding
- "Not Quite" — partial miss: adjust specific aspect, keep the rest
- "Close" — near miss: refine the named gap

Present via AskUserQuestion:

```
╔══════════════════════════════════════════════════════════╗
║  COURSE CORRECT                             [Fuchsia]    ║
║  ─ · ─                                                   ║
║  Current position: Cycle {cycle}, Gate {gate}            ║
║                                                          ║
║  [R] Restart current cycle — back to Gate 0 Absorb       ║
║  [G] Revert to prior gate — undo last gate advance       ║
║  [S] Adjust scope — narrow or widen current engagement   ║
║  [N] Not Quite — refine a specific aspect                ║
║  [B] Back to menu                                        ║
╚══════════════════════════════════════════════════════════╝
```

Context: read the active Diamond to understand what engagement is being corrected. Preserve gainy aspects while addressing the correction.
