# SD-T3-Named — VDR Tier 3 Named · R1 + R2 + R4 + R7 Reference Design

**Menu ID**: SD-T3
**Trigger**: Novel pattern emerging at fault surface · must NAME before diagnostic depth
**Round Composition**: 4 Rounds (R1 Red + R2 Orange + R4 Green + R7 Fuchsia) · ~8-10 min wall-clock
**Canonical Reference**: `Cascades/Documentation/Cascades/VDR-PATTERN.md` §2 *VDR-T3 Named*

---

## What VDR-T3 Named Is

VDR-T2's curated diagnostic PLUS **R2 Orange Prospector** — invokes the **Priming Pair** (R1+R2) before the diagnostic pair fires. All four Rounds dispatch in a single message; R2's verbose frontier naming feeds the synthesis Muxameter so the diagnostic brief carries newly-named pattern vocabulary.

```
Stage 1 · Named Diagnostic (parallel · single message):
  R1 Red Curator       ─┐  ⎤
                        │  ⎬ Priming Pair (R1+R2) — Foundation discipline preserved
  R2 Orange Prospector ─┤  ⎦
  R4 Green Sculptor    ─┤
                        ├─→ 4 disjoint disk artifacts
  R7 Fuchsia Clinician ─┘
                ↓
       Main Thread Synthesis (inventory + naming + diagnostic brief)
                ↓
       [DIAMOND ENGAGEMENT CONFERENCE · CD-5 naming audit invoked]
```

---

## Why the Priming Pair MUST Compose (R1+R2 Structural)

Per CLAUDE.md §4 *Suite Cascade · Tier + Cascade Length*, the **Priming Pair** is the foundational Diameter — S1 finds shape · S2 names fit · every Length ≥2 inherits.

When a novel pattern is emerging at the fault surface — something that cannot be described by existing codebase vocabulary — R2 MUST compose with R1:

- **R2 without R1** = naming without curated grounding · names drift from existing convention · risk of inventing a name for something already named elsewhere
- **R1 without R2** = inventory without naming the frontier · the novel pattern remains unnamed · diagnostic brief cannot reference it precisely
- **R1 + R2 (Priming Pair)** = curation grounds the inventory · naming extends to the frontier · diagnostic brief can describe the novel pattern in stable vocabulary

This is **structural to VDR-T3** — not optional, not configurable. Selecting `[3]` from the VDR Menu commits to the Priming Pair. If R1 is dropped (R2+R4+R7 only), the cascade is malformed.

---

## When to Use VDR-T3 Named

- **A novel pattern is surfacing** in the fault — not a known anti-pattern, not a recognized failure mode
- **The fault cannot be described accurately** without first naming the pattern
- **Verbose frontier naming** (R2's specialty per CLAUDE.md §4 Suite Table) is prerequisite to root-cause diagnosis
- **Suspected fault involves a Diameter Gap** that has no existing name in the codebase
- **Pattern needs codification** in Onyx Semantic Index after diagnosis (R7 cites the named pattern)

If the pattern is already named in the codebase → VDR-T2 (curation enumerates the existing name).
If cross-cutting Macro-class impact → escalate to VDR-T4 (R6 added for Macro WGB).

---

## Conference Pre-Render (User Inquiry)

Four-part inquiry before composing the Banded Plan:

1. **What novel pattern is surfacing?** — describe the behavior, structure, or contract that has no existing name
2. **Where is it observed?** — file paths, modules, subsystems where the pattern manifests
3. **What existing patterns might it relate to?** — Diameters that R2 should draw (between this pattern and unlike codebase patterns)
4. **What is the suspected symptom?** — observable fault behavior caused by the novel pattern

---

## Banded Vermillion Plan Template

```
<VermillionPlan topic="VDR-T3 Named Diagnostic · [Novel Pattern Summary]">

Band Stage-1A [R1 Red Curator] (haiku):
  Informative: Inventory surfaces where novel pattern manifests {file/module list}.
               Glob/Grep for related files. Read each enumerated file. Read import
               graph. Read CLAUDE.md conventions. Identify what existing patterns are
               adjacent to (but not the same as) the novel pattern.
  Actionable:  Write Cascades/Working/SUITE-1-RED-{ISSUE-SLUG}-CURATION.md ·
               file inventory · existing patterns enumerated · adjacent-pattern map ·
               what is conventionally expected · drift candidates.
  Coordination: R2 (Priming Pair partner), R4, R7 are running concurrently with
               disjoint scopes. R1 curates existing inventory; R2 names the novel
               pattern; R4 examines surface; R7 diagnoses root cause. Do not name
               patterns — leave that to R2.

Band Stage-1B [R2 Orange Prospector] (sonnet):
  Informative: Read user description of the novel pattern. Read suspected surfaces.
               Read CLAUDE.md §2 Stratidia Muxonomy (Demometer · Diameter · Muxameter ·
               Muxonomy) and §4 Suite Cascade. Read Onyx Semantic Index for existing
               named patterns. Cross-reference WebFetch / WebSearch if external
               precedent might apply.
  Actionable:  Write Cascades/Working/SUITE-2-ORANGE-{ISSUE-SLUG}-NAMING.md ·
               verbose frontier name(s) for the novel pattern · Diameters drawn to
               unlike codebase patterns · etymology · Pearl Set boundary candidates ·
               Onyx Semantic Index entry draft.
  Coordination: R1 (Priming Pair partner), R4, R7 are running concurrently with
               disjoint scopes. R2 names the frontier; R1 inventories existing; R4
               examines; R7 diagnoses. Do not inventory — leave that to R1.

Band Stage-1C [R4 Green Sculptor] (sonnet):
  Informative: Read suspected surfaces. Examine from all angles using the user's
               provisional description of the novel pattern (R2's formal naming
               will reach synthesis in parallel · use working terminology for
               examination, R2's names will replace in synthesis).
  Actionable:  Write Cascades/Working/SUITE-4-GREEN-{ISSUE-SLUG}-DIAGNOSTIC.md ·
               multi-angle examination of the novel-pattern surface · edge cases ·
               hypothesis enumeration · contract violations · failure modes.
  Coordination: R1, R2 (Priming Pair), R7 are running concurrently with disjoint
               scopes. R4 examines; R1 inventories; R2 names; R7 diagnoses. Do not
               diagnose root cause — leave that to R7.

Band Stage-1D [R7 Fuchsia Clinician] (sonnet):
  Informative: Read symptom description. Read active Diamond + Onyx for trajectory.
               Read suspected surfaces ONLY to confirm root-cause hypothesis around
               the novel pattern. Read recent error logs.
  Actionable:  Write Cascades/Working/SUITE-7-FUCHSIA-{ISSUE-SLUG}-DIAGNOSIS.md ·
               root cause diagnosis referencing the novel pattern · G/L/M on
               structure · L_smoke meta-learnings · recommended Diamond shape ·
               estimated fix LOC · note: R2's formal naming will be folded into
               the final diagnostic brief during synthesis.
  Coordination: R1, R2 (Priming Pair), R4 are running concurrently with disjoint
               scopes. R7 diagnoses clinically; R1 inventories; R2 names; R4
               examines. Do not name patterns or examine surface — clinical
               diagnosis only.

[Main Thread Synthesis · named diagnostic brief · R2's frontier name replaces
provisional terminology · CD-5 naming audit verifies name distinctiveness · respect-list
of existing patterns folded into fix-scope recommendation]

Band Conference [Diamond Engagement]:
  Informative: Read R1 + R2 + R4 + R7 outputs. Construct synthesis brief with named
               pattern vocabulary. Run CD-5 naming audit (no name collision with
               existing Onyx Semantic Index entries).
  Actionable:  AskUserQuestion · 4 options · [Sub-Diamond] / [Macro Diamond] /
               [Plan-Only Close] / [Re-Tier]. User selects terminal action.

</VermillionPlan>
```

---

## CD-5 Naming Audit (Synthesis-Time)

After Stage 1 returns, before surfacing the Conference, the Conductor runs the **CD-5 naming audit**:

1. Read R2's proposed frontier name(s) from `SUITE-2-ORANGE-{ISSUE-SLUG}-NAMING.md`
2. Grep `Cascades/Working/ONYX-TIER-*.md` for the proposed name(s) — verify no collision with existing Semantic Index entries
3. Grep `Cascades/Documentation/Cascades/*.md` for the proposed name(s) — verify no collision with canonical pattern names
4. If collision detected → flag in synthesis brief · Conference includes `[N] Rename` option to re-dispatch R2 with collision constraint
5. If no collision → name is approved · synthesis proceeds · Conference fires

CD-5 ensures the Pearl-compressed name boundary is **distinctive** — names that collide cannot expand to distinct Sets and the manifold loses precision.

---

## Conductor Dispatch Pattern

```
Step 1: Conductor reads user inquiry (novel pattern + surfaces + adjacencies + symptom)
Step 2: Compose {ISSUE-SLUG} (3-6 word kebab-case)
Step 3: Compose Banded Vermillion Plan (above template)
Step 4: Dispatch Stage 1 via Agent tool · SINGLE MESSAGE · 4 parallel agents:
        - Agent(r1-curator,    haiku,  Band Stage-1A · Priming Pair partner R2 noted)
        - Agent(r2-prospector, sonnet, Band Stage-1B · Priming Pair partner R1 noted)
        - Agent(r4-sculptor,   sonnet, Band Stage-1C)
        - Agent(r7-clinician,  sonnet, Band Stage-1D)
Step 5: All 4 return within ~8-10 min · Conductor reads all output files
Step 6: Conductor runs CD-5 naming audit on R2's proposed name(s)
Step 7: Conductor synthesizes named diagnostic brief with approved vocabulary
Step 8: Conductor surfaces Diamond Engagement Conference (AskUserQuestion)
Step 9: Per user selection · route to terminal action · update Onyx Semantic Index
        with newly-named pattern (Lambda-event · Read-back required)
Step 10: R7 G/L/M append to ONYX-TIER-N.md per Fuchsia-Writes-Onyx Circuit
```

---

## Disjoint-Scope Discipline (4-Way · Strictest)

Each Round's dispatch prompt MUST include the 4-way disjoint-scope coordination note (per template above). The discipline is **strictest** at T3 because the Priming Pair (R1+R2) risks bidirectional overlap — R1 could name things, R2 could inventory things. The coordination note explicitly assigns naming to R2 and inventory to R1, and forbids the inverse.

---

## Diamond Engagement Conference

```
Named diagnostic brief synthesized.

R1 Red inventory:        {one-line summary from R1 file}
R2 Orange naming:        Frontier name "{NEW-PATTERN-NAME}" · CD-5 audit: PASS
R4 Green examination:    {one-line summary from R4 file}
R7 Fuchsia diagnosis:    {root cause referencing NEW-PATTERN-NAME}
Existing-pattern respect-list: {patterns from R1 the fix must honor}
Onyx Semantic Index entry draft: {R2's entry · pending append}
Recommended Diamond:     {R7's recommended Diamond shape · scope · LOC}

Options:
  [E] Engage Sub-Diamond — open/extend DIAMOND-TIER-N.md with named-pattern fix scope
  [M] Engage Macro Diamond — if R7 surfaces multi-Gap landscape (escalate to T4)
  [P] Plan-Only Close — diagnostic stands · Onyx Semantic Index entry appended
  [R] Re-Tier — diagnostic suggests wrong VDR Tier · re-dispatch
  [N] Rename — CD-5 collision detected · re-dispatch R2 with constraint
```

---

## Cascade-Length Position

VDR-T3 occupies **Length 1-4** in the Cascade Length-Ladder:

- **4 Rounds dispatched** (R1 + R2 + R4 + R7) · 1 cycle wall-clock
- **Length 1-5+ reached** with sub-Diamond + Magic Shotgun + R5
- **Length 1-6+ reached** with Macro Diamond path

---

## Concluder Set (Post-Dispatch)

After Stage 1 returns:

1. **Read-back** all 4 Round output files exist · `wc -l` ≥ threshold (R1≥60 · R2≥70 · R4≥80 · R7≥60)
2. **Grep** for R2 frontier name in R7 diagnosis (`grep -F "{NEW-PATTERN-NAME}"` ≥ 1 match)
3. **CD-5 naming audit** executed (Pass/Collision result documented in synthesis)
4. **Synthesis** named diagnostic brief composed with approved vocabulary
5. **Conference** surfaced (AskUserQuestion fired)
6. **Onyx Semantic Index** entry draft prepared for append (Lambda-event pending user-Lambda on `[E]` or `[P]`)

---

## Example Invocation

User: *"There's something weird happening in the new bridge protocol — the server is reassembling client state in a way I don't have a name for, and it's causing intermittent stale-read bugs."*

Conductor inquiry:
- Novel pattern: "Server-side client-state reassembly with stale-read intermittency"
- Surfaces: `src/lib/bridge/clientStateRebuild.ts`, `src/server/sessionStateAssembler.ts`, `src/lib/scp/stateReassembly.ts`
- Adjacencies: "Stratimux Muxified Concept access pattern · Vue reactivity · standard event-replay sourcing"
- Symptom: "Intermittent stale reads on client after server reassembly completes"
- ISSUE-SLUG: `server-clientstate-reassembly-stale-read`

Banded Plan dispatched · Stage 1 returns 4 files. CD-5 audit:
- R2 names: "Server-Side Clientstate Reassembly with Race-Window Stale-Read (SCRR-SR)"
- Grep `Cascades/Working/ONYX-TIER-*.md`: no collision
- Grep `Cascades/Documentation/Cascades/*.md`: no collision
- Audit PASS · name approved

Synthesis brief:
- R1 Curation: enumerates bridge protocol, session assembler, state reassembly composables
- R2 Naming: SCRR-SR · Diameter to event-replay sourcing (similar replay-semantics but server-side reassembly inverts the direction) · Onyx Semantic Index entry drafted
- R4 Diagnostic: examines race window between reassembly completion and client subscription · multi-angle: SSR boundary, async timing, hydration mismatch
- R7 Diagnosis: root cause = SCRR-SR fires before client subscriber is bound · L_smoke: server reassembly contracts require subscription-readiness handshake · Recommended Diamond: sub-Diamond, 2 files modified, ~40 LOC + new handshake protocol

Diamond Engagement Conference → user selects `[E]` → sub-Diamond opens with SCRR-SR named pattern in Cerulean task scope · Onyx Semantic Index entry appended (Lambda-event).

---

## Navigation

- `[B]` Back to VDR Main Menu (SD-Index.md)
- `[M]` Return to Main Shatterite Menu (SM-Main.md)
- `[Q]` Exit Shatterite
