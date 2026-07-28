Actualize a new Suite 8 — Full Suite Cascade from initial input to registered instance.

Read `Cascades/Cascade.json` for current state.
Read `Cascades/8_SUITES/Teal Claude/Strategy/Suite8CreationStrategy.md` for the 6-gate actualization strategy.
Read `Cascades/SUITE8-REGISTRY.md` for current registry.

This command engages Teal Claude Conductor to orchestrate a Full Suite (1-7) based on the user's initial input. The Conductor routes the actualization through Renewable Intelligence — sourcing from Diamond and Onyx to inform the Suite 8's composition — then dispatches the Suite8CreationStrategy.

The flow:
1. User provides initial input: what domain, what tools, what environment
2. Suite 1 (Curate): Inventory the user's existing configuration for the domain
3. Suite 2 (Prospect): Name the Suite 8 — color + noun designation
4. Suite 3 (Architect): Design Instance.md + Skill.md structure
5. Suite 4 (Validate): Confirm from builder + user perspective
6. Suite 5 (Build): Write Instance.md, Skill.md, optionally Conductor.md/Strategy/script.ts
7. Suite 6 (Compose): Register in Cascades/SUITE8-REGISTRY.md, verify engagement protocol
8. Suite 7 (Diagnose): Confirm actualization, append to Onyx S8AT

Configuration level determined by user intent:
- Direct: Domain with fixed skill set
- Conductor: Domain requiring Band assignment and strategy tracking
- Advanced: Domain with executable CLI scripts (Inform-to-Action bridge)

Present via AskUserQuestion to confirm the user's initial domain description before dispatching the strategy.
