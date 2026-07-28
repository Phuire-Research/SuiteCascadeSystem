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
- `/cascade:full-suite` — The Full Suite (sequential curried cascade · sibling to Magic Shotgun)
- `/cascade:loop` — Stratimuxian Automata (autonomous /loop ∘ full-suite)
- `/cascade:update` — Update SCS from upstream
- `/cascade:verify` — Verify SCS installation integrity

## Neon PlayTester Priming (SCP testing)

**If the SCP is being tested anor verified in this engagement** (PlayTest · SCP UI verification · session spawn/chat checks · the Bridge Turn-Over), **LOAD `Cascades/8_SUITES/Neon PlayTester/`** (`Instance.md` + `Skill.md`) before the testing step. The PlayTest Means are bridge `/mcp` tools — `scs_render_capture` (SEE · the streamed pre-shader frame → Read the PNG) + `scs_orchestrate_window` (ACT · atomic steps: click/key/js/wait/capture/probe/scroll · window-general incl. terminals). **Verdict only with the Muxistration Proof bundle** (`Cascades/Bridge/playtests/<runId>/` + file witnesses) — narrative-only is E4.
