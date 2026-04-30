Render the Shatterite Main Menu.

Read `Cascades/Cascade.json` for current state (activeDiamond, activeOnyx, suiteColors, cyclePosition, colorSelectionComplete).

Read `Cascades/8_SUITES/Teal Claude/Skills/S-SHATTERITE-MENU/SM-Main.md` for the Reference Design. Populate all dynamic fields from Cascade.json. Infer session phase from cyclePosition and recent interaction.

If `colorSelectionComplete` is false, note that `/cascade:colors` is available for personalization.

Present the populated menu via AskUserQuestion. Route the user's selection per the Response Routing table.

Remind the user: all menu options are also available as `/cascade:variant` — type `/cascade:` and tab to see options.

Available commands:
- `/cascade` — this menu
- `/cascade:hello` — Hello World tutorial
- `/cascade:suites` — Suite 8 Registry
- `/cascade:reference` — Suite Cascade Reference
- `/cascade:conductor` — Teal Claude Conductor
- `/cascade:diamond` — Diamond WorkGameBoard
- `/cascade:onyx` — Onyx Trajectory
- `/cascade:colors` — Suite Color Selection
- `/cascade:correct` — Course Correct
- `/cascade:maintain` — Maintain the Method
- `/cascade:create` — Actualize a New Suite 8
- `/cascade:loop` — Stratimuxian Automata (autonomous /loop)
