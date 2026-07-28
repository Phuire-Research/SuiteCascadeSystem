Render the SCP Menu — branches between Install SCP and Open SCP Menu via CSPMSR (Conditional-SCP-Menu-Slot-Replacement · Diamond η).

Read `Cascades/Cascade.json` for current state. Read `Cascades/SCPs.json` to determine `anyScpsInstalled`:
- If `scps` array is empty → render SM-SCP.md Stage I directly (Install SCP · AISIS sequence)
- If `scps` array has 1+ entries → render SM-SCP.md top-level menu (List · Install Another · Migrate · Deploy · Retire · Adapt · Turnover)

The SM-SCP.md Reference Design lives at `Cascades/8_SUITES/Teal Claude/Skills/S-SHATTERITE-MENU/SM-SCP.md`. Cross-reference type: `Cascades/8_SUITES/SCP Researcher/` (meta-Suite-8 Instance + Skill + Conductor + Templates).

Stage I (AISIS — Agent-Invoked-Same-as-CLI Sequence · Diamond η) mirrors the `scs scp install` CLI pipeline EXACTLY · IAPMCT/SMMIP invariant: CLI · TUI · agent surfaces ALL produce identical end state.

8-step pipeline (per `src/lib/scp/scpInstall.ts` `runInstallScpPipeline`):
1. Validate designation (PascalCase · 2-32 chars · not reserved · `validateDesignationForWizard`)
2. Generate bare-minimum concept bundle (4-file: type · state · concept · `vue/{Designation}Landing.vue`)
3. Materialize template tree to `Cascades/scps/.staging/{Designation}-{ulid}/SCP/`
   · Template source resolves via `resolveBundledTemplatePath()` (env override SCS_TEMPLATE_PATH for local dev · bundled in npm package otherwise)
4. npm install in staging
5. SPVI validation (4 Concluders: package.json parses · src/index.ts exists · concept tree present · src/main.ts exists)
6. Atomic `renameSync` staging → `Cascades/scps/{Designation}/SCP/` final
7. Update `Cascades/SCPs.json` (port allocated 7700-7799 · status='installed')
8. Build spawn descriptor (SABO pattern · caller materializes spawn)

After install: the user's named concept renders as the **Home Page** via the auto-generated Vue Island (HPCFPIR pattern · muxonomy registration). The Cascade Menu post-install shows "Open SCP Menu" in the [I] slot (CSPMSR swap).

Primary invocation path · agent calls the CLI directly:
```bash
scs scp install "<Designation>"
```

User owns the naming · do not auto-decide. Use AskUserQuestion for each gate.

When the user wants to manage existing SCPs (anyScpsInstalled === true · top-level menu rendered):
- `scs scp list` surfaces existing SCPs
- Migration / Deploy / Retire / Adapt operations spec'd in SM-SCP.md (some deferred to future Diamonds)

Pattern A from `Cascades/8_SUITES/SCP Researcher/Conductor.md` is the doctrine fallback when bridge subcommand is unreachable (creates Suite 8 metadata only · not runtime tree).
