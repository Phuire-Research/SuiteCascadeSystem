# SCP-Adapt — Research-Target → SCP S8 Adaptation Strategy

**Strategy ID**: SCP-Adapt
**Suite 8**: SCP Researcher
**Configuration**: Conductor
**Pattern**: E (Research-Target Adaptation) — see `Conductor.md`
**Skill anchor**: SCP-S9 Adapt Research Target — see `Skill.md`
**Reference Design**: `Cascades/8_SUITES/Teal Claude/Skills/S-SHATTERITE-MENU/SM-SCP-Adapt.md`
**Origin**: Diamond SCP-6 · 2026-05-10

---

## Purpose

Transform a **Target** into a *Stratimux-compliant SCP Suite 8 deliverable* — Concept files, Qualities, Principles, State definitions, and Strategy graphs that compose cleanly into the target instance's runtime tree (`SCP/src/concepts/` of a user-named SCP S8).

The adaptation is **RD-first** (Reference Design First): the cascade always produces a Markdown Reference Design citing the Target *before* Stratimux generation begins. The RD is the cite-able, archivable, durable intermediate; subsequent Bands generate from the RD while still able to reference the Target directly. Legacy apps, repositories, exploratory whitepapers — all of these enter the SCP paradigm not as objects to be destroyed but as Reference Designs that future generation cycles cite.

The strategy is the canonical Vermillion Banded Plan for this transformation. It is invoked when:

- A user wants to extend their existing SCP S8 with a new capability (e.g., "add a notification surface from this Slack-API exploration into my Personal SCP S8")
- A team brings pre-SCP research artifacts (whitepapers, prototypes, scratch concepts) into the production SCP runtime as cite-able Reference Designs
- An existing hosted application is being entered into the SCP paradigm — its surface becomes an RD that the user's hyper-personalized SCP S8 cites and generates from (the **AppKiller doctrine** · see SCP Researcher `Instance.md` and `Conductor.md` Pattern F)

## Target — Formal Definition

A **Target** is the input to an adaptation cascade. Targets are multi-modal and may be supplied as `anor-to` (anorto · combination) of:

| Modality | Examples |
|---|---|
| **URL** | API docs · OpenAPI spec · whitepaper PDF link · live endpoint · GitHub repo URL |
| **Screenshot** | UI surface to adapt · diagram of a pattern · architecture sketch |
| **Repo** | Local repo path · git remote · monorepo subpath |
| **File** | Prior research output · scratch note · spec document |
| **Text** | Free-form description of a concept · prompt-style adaptation request |
| **Diamond Reference** | Pointer to a prior Diamond cycle's deliverable (cite by ID + path) |
| **anor-to** | ANY combination of the above (e.g., URL + Screenshot describing the same surface from different angles) |

The Target is **cited** — the adaptation does not consume the Target destructively. The Target continues to exist; the RD captures the cite-able understanding of the Target at adaptation time. If the Target later changes (URL content updates · repo evolves), a follow-up adaptation can produce a new RD citing the new state — the prior RD remains as historical record.

## Cross-Suite-8 Muxification

This strategy is a Cross-Suite-8 Muxification — three Suite 8s compose across the Bands:

| Suite 8 | Role | Band(s) |
|---|---|---|
| **Cadmium Researcher** | Research target prospecting — verbose target description, citations, domain inventory | Band 2 |
| **Stratimuxian Scholar** | Stratimux pattern architecture — Concept/Quality/Principle/State design with framework discipline | Band 3 |
| **SCP Researcher** | SCP S8 deliverable shape — target instance selection, skill surface integration, muxonomyRegistry update | Bands 0, 1, 4, 5, 6, 7 |

Each Suite 8 individuates at its Band, returns Summation, and the cascade recomposes into the next Band. The three Suite 8s do not negotiate — they each receive their slot.

---

## Vermillion Banded Plan

```
<VermillionPlan topic="SCP Adapt · {{target_name}} → {{designation}}">

Band 0 [S0 Base Absorb] (Tier 0 in-context):
  Informative: Read target SCP S8 instance state — Cascades/8_SUITES/{{designation}}/Instance.md
               + Skill.md; read its declared mode; read its runtime composition (reference vs copy);
               identify gaps the research fills
  Actionable:  Confirm target instance exists; confirm research target is in-scope (not duplicating
               an existing skill / quality); declare the adaptation's intended addition surface
               (new concept · new qualities on existing concept · new principle · new strategy)

Band 1 [R1 Red — SCP Researcher curate · RD-FIRST] (Tier 0 in-context · SCP-S10 invocation):
  Informative: Read the Target — URL fetch · Screenshot examination · Repo inspection · File
               read · Text parse · Diamond Reference lookup · OR any anor-to combination.
               Inventory what shape it has — is it a protocol? An API surface? An algorithm?
               A data model? A UI pattern? A composition?
  Actionable:  **Produce a Markdown Reference Design** at
                 `Cascades/8_SUITES/{{designation}}/References/{{rd_name}}.md`
               OR for project-wide RDs not tied to a specific instance:
                 `Cascades/Documentation/References/{{rd_name}}.md`
               The RD MUST:
                 (a) Cite the Target with full provenance — URL + retrieved-at timestamp for URLs;
                     file path + content hash for files; commit SHA for repo references;
                     screenshot embedded or linked; multi-modal targets list all sources.
                 (b) Capture target shape — structural components, data flow, external deps.
                 (c) Propose the SCP runtime addition — concept name, quality names, expected
                     DECK K access patterns, mode-mapping where applicable.
                 (d) Prune lossy elements that don't translate (UI specifics that aren't relevant;
                     framework-specific patterns that conflict with Stratimux conventions).
               This RD becomes the durable artifact. The Target may change later; this RD
               documents the cite-able understanding at adaptation time.

Band 2 [R2 Orange — Cadmium Researcher prospect] (Tier 0 in-context anor Tier 1 agent):
  Suite 8:     Cadmium Researcher (Direct config · 5 operational signatures)
  Informative: Dispatch Cadmium Researcher with the **Band 1 RD + the Target** as joint context.
               The RD provides the cite-able understanding; the Target provides the source-of-truth
               for any detail the RD didn't capture. Cadmium prospects verbosely — what are the
               structural elements? What are the edge cases? What are the cross-references?
               What's the citation chain?
  Actionable:  Cadmium augments the RD with: (a) primary structural components, (b) data flow
               shape, (c) external dependencies, (d) extended citation map. The augmented RD
               (still at its original location) is the raw material Band 3 consumes.

Band 3 [R3 Yellow — Stratimuxian Scholar architect · GENERATE FROM RD] (Tier 0 in-context anor Tier 1 agent):
  Suite 8:     Stratimuxian Scholar (Direct + Skills · 13 skills S1-S13)
  Informative: Dispatch Stratimuxian Scholar with **the Band 1+2 augmented RD as primary input**
               AND with the original Target reachable for follow-up consultation. Stratimuxian
               Scholar generates Stratimux structures FROM the RD; the Target remains accessible
               when the RD has a gap. Composes the relevant skills:
                 · S1 Framework Foundation — does this map to a Concept? Multiple Concepts?
                 · S2 StratiDECK Composition — what's the DECK position? Mux relationships?
                 · S4 ActionStrategy — does the target require strategies for orchestration?
                 · S10 Quality Creation — what qualities are needed? Verbose Split Names?
                 · S13 State Design Composition — what's the State shape (no optionals, flat)?
  Actionable:  Stratimuxian Scholar returns a Stratimux-shaped blueprint:
                 · Concept definition (state + qualities + principles + mode)
                 · Quality specifications (one per intended action surface)
                 · Principle definition(s) (plan-scope orchestration)
                 · Strategy graphs (if multi-step coordination needed)
                 · muxonomyRegistry metadata (scpToolMetadata per quality)
               All identifiers Verbose-Split-Named per Stratimux v0.3.293 conventions.

Band 4 [R4 Green — Validation] (Tier 0 in-context):
  Informative: Read the blueprint from both perspectives:
                 · Stratimux discipline — does it follow Higher-Order Compositional paradigm?
                   DECK K access? Single Dispatch Rule? Reducer returns only changed properties?
                 · SCP S8 perspective — does it compose with existing scp/ concept qualities?
                   Does the muxonomyRegistry metadata route correctly? Does the proposed tool
                   surface fit the target instance's mode (Personal/Organizational/Project)?
  Actionable:  Resolve any conflicts. If validation fails, return to Band 3 with Stratimuxian
               Scholar for refinement. If validation passes, advance to Band 5.

Band 5 [R5 Blue — SCP Researcher implement] (Tier 0 in-context):
  Skill:       SCP-S4 Skill Surface · SCP-S9 Adapt Research Target
  Informative: Re-read the validated blueprint; resolve target instance's runtime path
               (reference: ../../scps/template/SCP/ · copy: ./SCP/ — affects file write location).
  Actionable:  Write the Stratimux files into the target instance's runtime tree:
                 · {{runtime_path}}/src/concepts/{{conceptName}}/{{conceptName}}.concept.ts
                 · {{runtime_path}}/src/concepts/{{conceptName}}/{{conceptName}}.muxonomy.ts
                 · {{runtime_path}}/src/concepts/{{conceptName}}/{{conceptName}}.types.ts
                 · {{runtime_path}}/src/concepts/{{conceptName}}/qualities/*.quality.huirth.ts
                 · {{runtime_path}}/src/concepts/{{conceptName}}/principles/*.principle.huirth.ts
                 · {{runtime_path}}/src/concepts/{{conceptName}}/strategies/*.strategy.ts (if any)
               Update {{runtime_path}}/src/concepts/muxonomyRegistry.generated.ts with the new
               concept's registration entries (scpToolMetadata per surfaced quality).

Band 6 [R6 Purple — Orchestrate + verify] (Tier 0 in-context):
  Informative: Read the composed runtime — does the new concept import-resolve cleanly against
               existing concepts? Does the muxonomyRegistry compile? Does the SCP S8's MCP tool
               surface still surface the existing skills?
  Actionable:  Run typecheck on the runtime tree (cd into runtime path; npm install if needed;
               npm run typecheck). Resolve any composition conflicts. Verify the new tool(s) are
               reachable through the SCP S8's transport (Personal: localhost:7111).

  Soft-Turnover Follow-up (Pattern G · SCP-S11): If the SCP S8 instance is actively running
  (Soft Turnover scenario), touching `.bridge-restart.json` after the typecheck passes loads
  the newly-adapted qualities into the running session without disturbing ClientState. The
  Perfect Circular Reference (server cache reconstructs from client persistence) preserves
  the user's in-flight state across the respawn. This is the default · cascading update path.
  If the adaptation introduces schema drift (Suite 2 **SLSD**) that wedges ClientState, fall
  back to Hard Turn Over (Pattern G.2 · `.bridge-restart.json` with `{"hard": true}`).

Band 7 [R7 Fuchsia — Diagnose + commit] (Tier 0 in-context):
  Informative: Read the cycle output (Bands 1-6); compare against Band 0's declared addition
               surface; check for scope drift.
  Actionable:  Gainy / Lossy / Maintain diagnosis. Append to the target instance's Onyx (if it
               has one) AND to ONYX-TIER-N.md (project Onyx) under the parent Diamond's cycle.
               Commit: "Diamond {{parent_diamond}} · Cycle X: Adapt {{target}} → {{designation}}
               SCP S8 (new concept: {{conceptName}})"

</VermillionPlan>
```

---

## Slot Variables

The strategy is parameterized for reuse across different Targets and SCP S8 instances:

| Slot | Description | Example |
|---|---|---|
| `{{target_name}}` | The Target's identifier | `Slack-Notifications-API` |
| `{{rd_name}}` | The Reference Design's file name (kebab-case · descriptive · cites target) | `slack-notifications-api-rd` |
| `{{rd_path}}` | The full RD location (under instance References/ OR project Documentation/References/) | `Cascades/8_SUITES/MicahsPersonal/References/slack-notifications-api-rd.md` |
| `{{designation}}` | The target SCP S8 instance's user-chosen name | `MicahsPersonal` |
| `{{conceptName}}` | The new Stratimux concept name (camelCase · derived from RD design proposal) | `slackNotifications` |
| `{{runtime_path}}` | The instance's runtime path | `../../scps/template/SCP/` (reference mode) or `./SCP/` (copy mode) |
| `{{parent_diamond}}` | The Diamond cycle invoking this strategy | `SCP-Adapt-001` (auto-numbered per execution) |
| `{{target_modalities}}` | The anor-to set of Target modalities present | `URL + Screenshot` · `Repo + Text` · `URL` |

A Diamond invoking SCP-Adapt fills these slots at execution time and runs the Vermillion plan.

---

## Concluders

The strategy is complete when:

1. **Band 1 Concluder**: Markdown Reference Design exists at `{{rd_path}}` · cites Target with full provenance (URL+timestamp · file+hash · screenshot link · etc.) · captures target shape · proposes SCP runtime addition
2. **Band 5 Concluder**: All generated files exist in the instance's runtime tree (verify via `find` or `ls`)
3. **Band 6 Concluder**: `npm run typecheck` (in the runtime path) returns exit 0
4. **Band 6 Concluder**: MCP tool surface includes the new quality (verify via `scs scp list --tools` if available · OR by reading `muxonomyRegistry.generated.ts`)
5. **Band 7 Concluder**: Onyx G/L/M entry exists; git commit lands; CD-5 audit passes on any newly-named patterns; RD remains archived (never deleted at cycle close)

If any Concluder fails, the strategy returns the cascade to the relevant Band (Stratimux discipline fail → Band 3 with Stratimuxian Scholar refinement; SCP composition fail → Band 4 validation rework; runtime build fail → Band 6 Orchestrate diagnostics).

---

## Cross-References

- Skill: `Cascades/8_SUITES/SCP Researcher/Skill.md` SCP-S9 Adapt Research Target
- Conductor pattern: `Cascades/8_SUITES/SCP Researcher/Conductor.md` Pattern E
- Reference Design: `Cascades/8_SUITES/Teal Claude/Skills/S-SHATTERITE-MENU/SM-SCP-Adapt.md`
- Cadmium Researcher: `Cascades/8_SUITES/Cadmium Researcher/Instance.md` (5 operational signatures)
- Stratimuxian Scholar: `Cascades/8_SUITES/Stratimuxian Scholar/Instance.md` (13 skills S1-S13)
- SCP runtime template: `SCP/` (the canonical concept-tree shape that Band 5 writes into)
- Diamond of origin: `Cascades/Working/DIAMOND-TIER-SCP-6.md` (gitignored)

---

## Trajectory

| Date | Diamond | Change |
|---|---|---|
| 2026-05-10 | SCP-6 | Strategy created · cross-Suite-8 muxification documented (Cadmium + Stratimuxian Scholar + SCP Researcher) · Bands 0-7 with slot parameterization |
| 2026-05-10 | AppKiller (Refining) | RD-first discipline made explicit at Band 1 · Target formal definition added (URL · Screenshot · Repo · File · Text · Diamond Reference · anor-to combinations) · Bands 2/3 reframed to consume RD + Target jointly · `{{rd_name}}` + `{{rd_path}}` + `{{target_modalities}}` slots added · Band 1 + Band 7 Concluders extended to capture RD-archival invariant · SCP-S10 (Reference Design Generation) skill replaces prior wrong-Diameter SCP-S10/S11 |
| 2026-05-10 | Refine-Macro | Band 6 Soft-Turnover follow-up note added (newly-adapted qualities need to be loaded into the running instance · Soft turnover preserves ClientState while picking up the new code · default behavior · Pattern G governs) · cross-references to Pattern G + SCP-S11 added in References section |
