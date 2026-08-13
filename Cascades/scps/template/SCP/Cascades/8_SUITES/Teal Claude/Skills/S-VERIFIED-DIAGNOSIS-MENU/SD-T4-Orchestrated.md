# SD-T4-Orchestrated — VDR Tier 4 Orchestrated · R1 + R2 + R4 + R6 + R7 Reference Design

**Menu ID**: SD-T4
**Trigger**: Cross-cutting impact · Macro WGB synthesis required · multi-sub-Diamond fix scope
**Round Composition**: 5 Rounds (R1 Red + R2 Orange + R4 Green + R6 Purple + R7 Fuchsia) · ~10-14 min wall-clock
**Canonical Reference**: `Cascades/Documentation/Cascades/VDR-PATTERN.md` §2 *VDR-T4 Orchestrated*

---

## What VDR-T4 Orchestrated Is

VDR-T3's Named diagnostic PLUS **R6 Purple Orchestrator** — adds Macro WGB synthesis authoring to the diagnostic dispatch. All five Rounds fire in a single message; R6 reads its own prior Diamond + Onyx context AND consumes (post-return) the other four Rounds' substrate to compose a candidate Macro WGB that the Diamond Engagement Conference can open as a Macro Diamond.

```
Stage 1 · Orchestrated Diagnostic (parallel · single message):
  R1 Red Curator          ─┐  ⎤
                           │  ⎬ Priming Pair (R1+R2)
  R2 Orange Prospector    ─┤  ⎦
  R4 Green Sculptor       ─┤
                           ├─→ 5 disjoint disk artifacts
  R6 Purple Orchestrator  ─┤
  R7 Fuchsia Clinician    ─┘
                ↓
       Main Thread Synthesis (inventory + naming + diagnostic + Macro WGB)
                ↓
       [MACRO DIAMOND OPENING CONFERENCE]
```

---

## Diameter to Magic Shotgun 5-Suite Macro Open

VDR-T4 has the **same Suite roster** as Magic Shotgun's `5-Suite Macro Open` (`SG-Macro-Open.md` · R1+R2+R4+R6+R7) but the **anchor differs**:

| Aspect | Magic Shotgun 5-Suite Macro Open | VDR-T4 Orchestrated |
|---|---|---|
| **Anchor** | Foundation Grounding | Diagnostic Verification |
| **Lead Pair** | R1+R2 Priming Pair (Foundation) | R4+R7 Diagnostic Pair (Calibration Diameter) |
| **R7 Role** | Foundation-level retrospective of *prior Macro* work | Foundation-level diagnosis of *current fault* |
| **R6 Role** | Orchestration of new Macro forward-plan | Macro WGB synthesis from diagnostic substrate |
| **R1+R2 Role** | Priming Pair leading new build | Priming Pair supplying curation+naming for diagnostic context |
| **Terminal Action** | R5 Blue Cobalt actualization OR plan-only Macro Open | Macro Diamond Opening (R6's Macro WGB IS the opening WGB) |
| **Use Trigger** | Opening a new Macro Diamond proactively | Diagnostic surfaces cross-cutting fault requiring Macro fix |

The Suite roster is the same; the anchor (which pair leads, which pair supplies) differs. This is **Higher-Order Composition** — same Demometers, different Diameter focus, different Muxameter.

---

## When to Use VDR-T4 Orchestrated

- **Issue impact crosses multiple sub-Diamonds** — fix scope spans multiple Cerulean tasks
- **Macro WGB synthesis is required** — single sub-Diamond cannot contain the fix
- **R6 Purple authors the candidate Macro WGB** — post-diagnosis Macro opens directly from R6's output
- **Cross-Macro seam concerns surface** during diagnosis (M35-class)
- **Diagnostic anchor matters** — Magic Shotgun's Foundation-anchor would not pre-stage the Macro WGB from the fault substrate

If symptom is single-sub-Diamond → VDR-T3 (Named) suffices · Macro engagement deferred to user.
If novel pattern is NOT emerging but cross-cutting is → consider VDR-T4 anyway (R6 still adds Macro WGB; R2's naming is light-touch).

---

## Conference Pre-Render (User Inquiry)

Five-part inquiry before composing the Banded Plan:

1. **What is the cross-cutting scope?** — modules, subsystems, or layers spanned by the fault
2. **How many sub-Diamonds anticipated?** — rough count of distinct fix surfaces (2-N)
3. **Is a novel pattern emerging?** — if YES, R2's naming load is heavy; if NO, R2's load is light (still composes for Priming Pair)
4. **Cross-Macro seam concern?** — does the fault span the boundary of a prior Macro?
5. **Symptom pattern across the surfaces** — common observable behavior

---

## Banded Vermillion Plan Template

```
<VermillionPlan topic="VDR-T4 Orchestrated Diagnostic · [Cross-Cutting Fault Summary]">

Band Stage-1A [R1 Red Curator] (haiku):
  Informative: Inventory all surfaces involved in cross-cutting scope. Glob/Grep
               broadly across modules. Read each major surface file. Read import
               graph two levels out. Read CLAUDE.md + Onyx Semantic Index for
               existing patterns in scope.
  Actionable:  Write Cascades/Working/SUITE-1-RED-{ISSUE-SLUG}-CURATION.md ·
               cross-cutting inventory · existing patterns enumerated · dependency
               graph · drift candidates across surfaces · adjacent-Macro references.
  Coordination: R2 (Priming Pair partner), R4, R6, R7 are running concurrently with
               disjoint scopes. R1 curates broadly; R2 names frontier patterns; R4
               examines surfaces; R6 orchestrates Macro WGB; R7 diagnoses root cause.

Band Stage-1B [R2 Orange Prospector] (sonnet):
  Informative: Read user description. Read suspected surfaces. Read CLAUDE.md §2
               Muxonomy. Read Onyx Semantic Index. If novel pattern emerging,
               commit to verbose naming; if not, name the cross-cutting fault
               class itself.
  Actionable:  Write Cascades/Working/SUITE-2-ORANGE-{ISSUE-SLUG}-NAMING.md ·
               frontier name(s) for novel pattern OR for the cross-cutting fault
               class · Diameters drawn · Onyx Semantic Index entry draft.
  Coordination: R1 (Priming Pair partner), R4, R6, R7 are running concurrently
               with disjoint scopes. R2 names; do not inventory, examine, orchestrate,
               or diagnose.

Band Stage-1C [R4 Green Sculptor] (sonnet):
  Informative: Read cross-cutting surfaces. Examine from all angles across the
               full scope — not just one file. Edge cases that span surfaces.
               Contract violations between modules. Race conditions across the
               cross-cutting boundary.
  Actionable:  Write Cascades/Working/SUITE-4-GREEN-{ISSUE-SLUG}-DIAGNOSTIC.md ·
               multi-angle examination across full cross-cutting scope · cross-
               surface hypothesis · contract-boundary violations · seam-crossing
               failure modes.
  Coordination: R1, R2 (Priming Pair), R6, R7 are running concurrently with
               disjoint scopes. R4 examines surface; do not curate, name,
               orchestrate, or diagnose root cause.

Band Stage-1D [R6 Purple Orchestrator] (sonnet):
  Informative: Read user cross-cutting scope description. Read recent Onyx + active
               Diamond + adjacent Macro WGB references. Read MACRO-DIAMOND-GUIDE.md
               §7 (Macro vs sub-Diamond scope test). Anticipate sub-Diamond
               enumeration from cross-cutting scope · Cerulean chain shape.
  Actionable:  Write Cascades/Working/SUITE-6-PURPLE-{ISSUE-SLUG}-MACRO-WGB.md ·
               candidate Macro WorkGameBoard · Macro Name · Pearl statement ·
               sub-Diamond enumeration with dependency order · Cerulean chain ·
               Wave-by-Wave execution plan · estimated cycle count · HALT-GATE
               checkpoint placeholders · IMDT-out contract anticipation.
               NOTE: R6 composes the Macro WGB WITHOUT waiting for R4/R7 returns —
               the Macro WGB is provisional · main-thread synthesis folds R4/R7
               diagnostic substrate into the final Macro WGB.
  Coordination: R1, R2 (Priming Pair), R4, R7 are running concurrently with
               disjoint scopes. R6 orchestrates Macro composition; do not curate,
               name, examine surface, or diagnose root cause.

Band Stage-1E [R7 Fuchsia Clinician] (sonnet):
  Informative: Read symptom description. Read active Diamond + recent Onyx cycles.
               Read suspected cross-cutting surfaces. Read adjacent Macro WGB
               references (potential cross-Macro seam). Read recent error logs.
  Actionable:  Write Cascades/Working/SUITE-7-FUCHSIA-{ISSUE-SLUG}-DIAGNOSIS.md ·
               root cause diagnosis across cross-cutting scope · G/L/M on Macro-
               level structure · L_smoke meta-learnings · cross-Macro seam
               retrospective (M35-class if applicable) · recommended Macro shape
               and scope · estimated total LOC.
  Coordination: R1, R2 (Priming Pair), R4, R6 are running concurrently with
               disjoint scopes. R7 diagnoses clinically; do not curate, name,
               examine surface, or orchestrate Macro WGB.

[Main Thread Synthesis · orchestrated diagnostic brief · R4/R7 diagnostic substrate
folded into R6's Macro WGB to produce FINAL Macro WGB candidate · CD-5 naming audit
on R2's frontier names · Macro Pearl locked]

Band Conference [Macro Diamond Opening Decision]:
  Informative: Read R1 + R2 + R4 + R6 + R7 outputs. Construct synthesis brief.
               Confirm Macro WGB candidate completeness. Run CD-5 + Macro-Pearl audit.
  Actionable:  AskUserQuestion · 5 options · [Open Macro Diamond] / [Sub-Diamond
               Path (re-Tier down)] / [Plan-Only Close] / [Refine Macro WGB] /
               [Re-Tier]. User selects terminal action.

</VermillionPlan>
```

---

## How R6 Composes the Macro WGB in Parallel

A common question: *"How can R6 compose the Macro WGB if R4 and R7 haven't returned yet?"*

The answer is **Higher-Order Composition** — R6 does NOT wait for R4/R7. R6 reads:
- The user's cross-cutting scope description (primary substrate)
- Active Diamond + recent Onyx
- Adjacent Macro WGB references
- `MACRO-DIAMOND-GUIDE.md` §7 scope test

From this, R6 composes a **provisional Macro WGB** — Macro Name, Pearl statement, sub-Diamond enumeration, dependency order, Cerulean chain, HALT-GATE placeholders, IMDT-out contract anticipation.

**Main-thread synthesis** then folds R4's diagnostic and R7's root-cause analysis into R6's provisional Macro WGB, producing the FINAL Macro WGB candidate. The diagnostic substrate refines the Macro WGB's sub-Diamond scope and IMDT-out contract — it does not replace R6's structural composition.

This preserves Foundation discipline (parallel-only) while enabling Macro-class synthesis at Tier-1 wall-clock cost.

---

## Conductor Dispatch Pattern

```
Step 1: Conductor reads user inquiry (cross-cutting scope + sub-Diamond count +
        novel-pattern flag + seam concern + symptom pattern)
Step 2: Compose {ISSUE-SLUG} (3-6 word kebab-case)
Step 3: Compose Banded Vermillion Plan (above template)
Step 4: Dispatch Stage 1 via Agent tool · SINGLE MESSAGE · 5 parallel agents:
        - Agent(r1-curator,       haiku,  Band Stage-1A · Priming Pair partner R2 noted)
        - Agent(r2-prospector,    sonnet, Band Stage-1B · Priming Pair partner R1 noted)
        - Agent(r4-sculptor,      sonnet, Band Stage-1C)
        - Agent(r6-orchestrator,  sonnet, Band Stage-1D · provisional Macro WGB)
        - Agent(r7-clinician,     sonnet, Band Stage-1E)
Step 5: All 5 return within ~10-14 min · Conductor reads all output files
Step 6: Conductor runs CD-5 naming audit on R2's proposed names
Step 7: Conductor folds R4 + R7 diagnostic substrate into R6's Macro WGB →
        FINAL Macro WGB candidate
Step 8: Conductor runs Macro-Pearl audit (per MACRO-DIAMOND-GUIDE.md §7 — Pearl
        statement must compress the cross-cutting fault into a single phrase)
Step 9: Conductor surfaces Macro Diamond Opening Conference (AskUserQuestion)
Step 10: Per user selection · route to terminal action
Step 11: If [Open Macro Diamond] selected · Macro WGB written to
         Cascades/Working/DIAMOND-TIER-{MACRO-NAME}.md (Lambda-event)
Step 12: R7 G/L/M append to ONYX-TIER-N.md per Fuchsia-Writes-Onyx Circuit
```

---

## Macro Diamond Opening Conference

```
Orchestrated diagnostic brief synthesized.

R1 Red inventory:        {cross-cutting inventory summary}
R2 Orange naming:        {frontier name(s) · CD-5 audit result}
R4 Green examination:    {cross-cutting examination summary}
R6 Purple Macro WGB:     {candidate Macro Name · Pearl · sub-Diamond count}
R7 Fuchsia diagnosis:    {root cause · cross-Macro seam if applicable}
Macro WGB Pearl:         "{Macro Pearl statement}"
Estimated cycle count:   {N cycles}
Macro WGB candidate file: Cascades/Working/SUITE-6-PURPLE-{ISSUE-SLUG}-MACRO-WGB.md

Options:
  [O] Open Macro Diamond — promote Macro WGB to DIAMOND-TIER-{MACRO-NAME}.md
      and engage Magic Shotgun [F] 5-Suite Macro Open for Foundation Grounding
  [S] Sub-Diamond Path — diagnostic surfaces single-sub-Diamond fix (re-Tier
      down to T2 or T3 sub-Diamond engagement)
  [P] Plan-Only Close — Macro WGB stands as candidate · no Diamond engages
  [F] Refine Macro WGB — R6's WGB needs revision · re-dispatch R6 with
      synthesis brief constraints
  [R] Re-Tier — diagnostic suggests wrong VDR Tier · re-dispatch
```

### Per-Selection Action

| Selection | Action |
|---|---|
| **[O] Open Macro Diamond** | Promote `SUITE-6-PURPLE-{ISSUE-SLUG}-MACRO-WGB.md` to `DIAMOND-TIER-{MACRO-NAME}.md` · Cerulean chain initialized · proceed to Magic Shotgun `[F]` 5-Suite Macro Open for Foundation Grounding cycle (NOTE: that is the FOUNDATION grounding of the Macro · VDR-T4 was the DIAGNOSTIC grounding) |
| **[S] Sub-Diamond Path** | Diagnostic surfaced single-sub-Diamond scope despite T4 dispatch · Conductor down-tiers · uses R7's recommended sub-Diamond shape · R6 Macro WGB retained as substrate but not promoted |
| **[P] Plan-Only Close** | Macro WGB stands as candidate file · no Diamond engages this cycle · user reviews later · R7 G/L/M appended to Onyx |
| **[F] Refine Macro WGB** | R6's provisional WGB needs revision after synthesis · Conductor re-dispatches R6 with explicit synthesis-brief constraints (refined Pearl, refined sub-Diamond enumeration) · other 4 Rounds retained |
| **[R] Re-Tier** | Diagnostic shows lower-tier complexity sufficient · re-dispatch at correct VDR Tier · prior 5 Round artifacts retained as substrate |

---

## Cross-Macro Seam Doctrine (M35-Class)

If R7's diagnosis surfaces a **cross-Macro seam concern** (the fault crosses the boundary of a prior Macro), the synthesis brief MUST include:

- Reference to prior Macro WGB
- Cross-Macro seam description
- Recommended seam-smoke discipline (per Cycle 113 M35 candidate · Refinement Macro precedent)
- Whether the new Macro INHERITS the prior Macro's IMDT-out contract or REPLACES it

R7's L_smoke entry will become an M-rule candidate if the seam pattern repeats. The Conductor flags this in the Conference for user awareness.

---

## Cascade-Length Position

VDR-T4 occupies **Length 1-5** in the Cascade Length-Ladder:

- **5 Rounds dispatched** (R1 + R2 + R4 + R6 + R7) · 1 cycle wall-clock
- **Length 1-6+ reached** with `[O]` Open Macro Diamond + Magic Shotgun 5-Suite + N R5 sub-Diamond Cobalts
- **Length 1-7+ reached** with full Macro arc through closure

VDR-T4 itself produces **5-Round Foundation-level diagnostic** + **candidate Macro WGB** — the richest VDR Tier.

---

## Concluder Set (Post-Dispatch)

After Stage 1 returns:

1. **Read-back** all 5 Round output files exist · `wc -l` ≥ threshold (R1≥80 · R2≥70 · R4≥100 · R6≥120 · R7≥80)
2. **Grep** for cross-cutting fault references in R4 output (multi-surface coverage)
3. **Grep** for R6 Macro WGB structural sections (`## Macro Pearl`, `## Sub-Diamond Enumeration`, `## Cerulean Chain`, `## HALT-GATE`)
4. **CD-5 naming audit** on R2 frontier names
5. **Macro-Pearl audit** on R6's Pearl statement (compresses cross-cutting fault into single phrase)
6. **Synthesis** orchestrated diagnostic brief composed · FINAL Macro WGB candidate produced
7. **Conference** surfaced (AskUserQuestion fired)
8. If `[O]` Open Macro Diamond selected · `DIAMOND-TIER-{MACRO-NAME}.md` written (Lambda-event · Read-back required)

---

## Example Invocation

User: *"ClientState preservation is breaking across multiple SCP instances Macro-wide — the new Bridge protocol exposes a Diameter Gap we haven't named, and the fix is going to span session lifecycle, state assembly, and the SCP runtime contract."*

Conductor inquiry:
- Cross-cutting scope: SCP runtime contract + Bridge protocol + session lifecycle + state assembly
- Sub-Diamonds anticipated: 4-5 (clientState lifecycle · bridge-turnover gate · state assembly handshake · session preservation contract · cross-Macro seam smoke)
- Novel pattern emerging: YES — "ClientState Preservation Through Perfect Circular Reference" (per MEMORY.md G.1-G.6+)
- Cross-Macro seam: YES — spans AppKiller and prior Bridge Macro
- Symptom: "State preservation contract violations on bridge turnover"
- ISSUE-SLUG: `clientstate-preservation-bridge-turnover-macro`

Banded Plan dispatched · Stage 1 returns 5 files:
- R1 Curation: enumerates SCP runtime, Bridge module, session storage, state assembly, prior Macro WGB references
- R2 Naming: `ClientState Preservation Through Perfect Circular Reference + Hard Turn Over Escape` (Pattern G) · Diameters to standard session-rebuild · Onyx Semantic Index entry drafted (existing G.1-G.6+ structure)
- R4 Diagnostic: examines turnover race window across 4 sub-surfaces · contract violations at each seam · cross-Macro hydration timing
- R6 Macro WGB: candidate Macro `BRIDGE-CLIENTSTATE-PRESERVATION-MACRO` · Pearl: "Bidirectional ClientState Preservation Through Hard-Turnover-Gated Bridge Protocol" · 5 sub-Diamonds enumerated · Cerulean chain composed · HALT-GATE at sub-Diamond 3 (bridge-turnover Lambda gate)
- R7 Diagnosis: root cause = Pattern G violation when turnover gate fires before circular-reference re-binding completes · L_smoke: hard turnover requires bidirectional handshake · cross-Macro seam: inherits prior Bridge Macro IMDT-out contract · M35 candidate (cross-Macro seam smoke)

Macro Diamond Opening Conference → user selects `[O]` → `DIAMOND-TIER-BRIDGE-CLIENTSTATE-PRESERVATION-MACRO.md` written (Lambda-event) · proceeds to Magic Shotgun `[F]` 5-Suite Macro Open for Foundation Grounding.

---

## Navigation

- `[B]` Back to VDR Main Menu (SD-Index.md)
- `[M]` Return to Main Shatterite Menu (SM-Main.md)
- `[Q]` Exit Shatterite
