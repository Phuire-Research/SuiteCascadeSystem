Direct entry to the SCP Install sequence — skip the SM-SCP.md top-level menu and proceed straight to Stage I (AISIS).

Read `Cascades/8_SUITES/Teal Claude/Skills/S-SHATTERITE-MENU/SM-SCP.md` Stage I section for the canonical AISIS sequence specification.

This command invokes the EXACT SAME pipeline as `scs scp install` from the CLI — programmatic mirror (IAPMCT/SMMIP invariant). Single source of truth · three surfaces (CLI direct · TUI wizard · Shatterite agent) all share the M2-Refinement install substrate.

Use AskUserQuestion to gather the designation (PascalCase · 2-32 chars · not in reserved name set). Validate via `src/lib/scp/installScpPrompts.ts validateDesignationForWizard` rules.

After designation validated, invoke:

```bash
scs scp install "<Designation>"
```

The pipeline executes 8 ordered steps (see SM-SCP.md Stage I3 for full spec):
1. Validate designation
2. Generate 4-file concept bundle (type/state/concept + Vue Landing)
3. Materialize template to staging dir
4. npm install in staging
5. SPVI validation (4 Concluders)
6. Atomic commit-move to final
7. SCPs.json entry write
8. Spawn descriptor returned

The user's named concept is set as the Home Page via the auto-generated Vue Island. SCPs.json registers the new SCP with allocated port (7700-7799). The Cascade Menu (`/cascade`) post-install will surface "Open SCP Menu" in the [I] slot (CSPMSR swap on `anyScpsInstalled === true`).
