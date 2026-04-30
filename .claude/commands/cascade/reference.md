Open the Suite Cascade Reference menu.

Read `Cascades/Cascade.json` for current state — especially `cyclePosition.gate` to mark the active gate with `◄`.

Read `Cascades/8_SUITES/Teal Claude/Skills/S-SHATTERITE-MENU/SM-Cascade.md` for the Reference Design. Populate `{current_gate}` from Cascade.json.

Present the populated menu via AskUserQuestion. Route per Response Routing:
- [0-7] → display Suite's full A-I Demometer row (Informative, Actionable, Lambda Base Aspect) from CLAUDE.md §4
- [A-F] → announce Cascade Length in natural language: "Have a Quick Draft" (1-3), "Validate Before Placing" (1-4), "Engage a Full Suite" (1-5), "Sweeping Changes" (1-6), "Full Suite Diamond" (1-7)
- [P] → explain Priming Pair
- [L] → display Lambda Base Aspect column
- [T] → explain Tier 0 vs Tier 1

Context: highlight the current gate position and suggest next gate if mid-cycle.
