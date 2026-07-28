# Verified-Diagnostic Round (VDR) · Diagnostic-Anchored Foundation Dispatch Pattern

**Crystraline Position**: C9 Automata · Tier-1 Cascade Length Selector ⊗ Foundation Suites at-once · Diagnostic-Anchored sibling to Magic Shotgun
**Empirical Lineage**: Magic Shotgun (Foundation-anchored · `MAGIC-SHOTGUN-PATTERN.md`) · M37-class Foundation-Level Clinical Pre-Read (`SG-Closure-Quartet.md` §"Why R7 at Foundation Level")
**Status**: Pattern codified by user directive 2026-05-14 · 4-Tier complexity ladder · adaptive load-on shape · post-diagnosis Diamond engagement gate
**Companion Guides**: `MAGIC-SHOTGUN-PATTERN.md` (Foundation-anchored sibling) · `FOUNDATION-SUITES-GUIDE.md` (disjoint-scope baseline) · `MACRO-DIAMOND-GUIDE.md` (multi-cycle composition) · `VERMILLION-PLANNED-QUERY.md` (A-I substrate)

---

## 1 · Pattern Definition

### What Verified-Diagnostic Round Is

A **Verified-Diagnostic Round (VDR)** is a Tier-1 parallel dispatch of Foundation Suites whose **anchor is diagnostic** — the cascade exists to verify *what is wrong* and surface *root cause* before any Diamond engagement actualizes a fix. The base shape always fires **R4 Green Sculptor + R7 Fuchsia Clinician** in parallel; complexity heuristics adaptively load on **R1 Red Curator**, **R2 Orange Prospector**, and **R6 Purple Orchestrator** when issue surface demands it.

VDR is the **diagnostic-anchored sibling** of Magic Shotgun (which is Foundation-anchored). Where Magic Shotgun's intent is *to ground a build* in Foundation knowledge before R5 Blue Cobalt implements, VDR's intent is *to diagnose a fault* with Lambda-verified artifacts before a Diamond is engaged to fix it. Both are first-class Tier-1 patterns — VDR does NOT replace Magic Shotgun.

### Etymology

- **Verified** = Lambda-event artifacts on disk · Concluder-checked · re-runnable · not narrative-only diagnosis
- **Diagnostic** = R4 Green examines from all angles · R7 Fuchsia diagnoses root cause + L_smoke meta-learnings · anchor of the cascade
- **Round** = parallel Suite dispatch (per Magic Shotgun convention) · each Round carries one Suite's full cognitive function · all Rounds fire in a single message

### The Higher-Order Compositional Intent

VDR is **diagnostic** because R4+R7 are the irreducible diagnostic pair — Green examines, Fuchsia diagnoses · together they constitute the **Calibration Diameter** (CLAUDE.md §4) operationalized at Foundation level. The Priming Pair (R1+R2) and Orchestrator (R6) are **adaptive load-ons** — added only when issue complexity demands curation, naming, or macro-synthesis.

VDR is **NOT hierarchical** — R4 and R7 are independent Demometers composing on a flat plane. Their Diameter (Through Measure between unlike functions: examination ↔ diagnosis) is the issue substrate they both interrogate. The Muxameter (integrated region) is the synthesized diagnostic brief that the post-diagnosis Diamond consumes.

### Diameter to Magic Shotgun

| Aspect | Magic Shotgun | Verified-Diagnostic Round |
|---|---|---|
| **Anchor** | Foundation Grounding (R1+R2+R3 / R2+R3+R6 / etc.) | Diagnostic Pair (R4+R7) |
| **Intent** | Ground a build before R5 implements | Diagnose a fault before Diamond engages |
| **Lead Suites** | R1 Red / R2 Orange / R3 Yellow / R6 Purple | R4 Green + R7 Fuchsia (always) |
| **Adaptive Load-ons** | R4 Green (M19) · R7 Fuchsia (Macro Open) | R1 Red · R2 Orange · R6 Purple (by complexity) |
| **Terminal Action** | R5 Blue Cobalt actualization | Diamond engagement (sub-Diamond OR Macro) |
| **Use Trigger** | New work · Diameter Gap to close · plan-to-impl trajectory | Existing fault · symptom presented · diagnose-to-Diamond trajectory |
| **Cascade Length** | 1-5 / 1-6 / 1-7 | 1-2 / 1-3 / 1-4 / 1-5 (tier-dependent) |

**Reciprocal Naming**: Magic Shotgun names VDR as its diagnostic-anchored sibling (`SG-Main.md` `[D]` cross-reference). VDR names Magic Shotgun as its Foundation-anchored sibling (this section + `SD-Index.md`).

---

## 2 · The Four Complexity Tiers

VDR scales by issue complexity. Four named Tiers compose the ladder — each adds a Suite as a Demometer drawing Diameter to what precedes.

### Tier Ladder

| Tier | Name | Shape | Rounds | Use Case | LOC Estimate |
|---|---|---|---|---|---|
| **VDR-T1** | Base | R4 + R7 | 2 | Clear symptom · known surface · single-Diameter fix | ~800-1200 |
| **VDR-T2** | Curated | R1 + R4 + R7 | 3 | Scattered symptoms · EXISTING inventory needed before diagnosis | ~1200-1800 |
| **VDR-T3** | Named | R1 + R2 + R4 + R7 | 4 | Novel pattern emerging · must NAME before diagnostic depth | ~1800-2400 |
| **VDR-T4** | Orchestrated | R1 + R2 + R4 + R6 + R7 | 5 | Cross-cutting impact · Macro WGB synthesis required | ~2400-3500 |

### VDR-T1 · Base · R4 + R7

The irreducible diagnostic shape. Two Rounds fire in parallel.

```
Stage 1 · Diagnostic Pair (parallel):
  R4 Green Sculptor    ─┐
                        ├─→ 2 disjoint disk artifacts
  R7 Fuchsia Clinician ─┘
                ↓
       Main Thread Synthesis (diagnostic brief · root cause locked)
                ↓
       [DIAMOND ENGAGEMENT DECISION · Conference]
```

**When to Use VDR-T1**:
- Symptom is clear (single error message · single failing test · single broken view)
- Surface is known (single file or tightly-coupled module)
- One Diameter Gap suspected · no novel pattern surface
- No inventory of existing code needed before diagnosis (you know where to look)

**Output Artifacts**:
- `SUITE-4-GREEN-{issue-slug}-DIAGNOSTIC.md` — multi-angle examination, edge cases, hypothesis surface
- `SUITE-7-FUCHSIA-{issue-slug}-DIAGNOSIS.md` — root cause, L_smoke meta-learnings, recommended Diamond shape

**Terminal Action**: User-confirmed Diamond engagement (sub-Diamond actualization typical · plan-only close allowed)

### VDR-T2 · Curated · R1 + R4 + R7

Adds R1 Red Curator inventory pass before the diagnostic pair fires.

```
Stage 1 · Curated Diagnostic (parallel):
  R1 Red Curator       ─┐
  R4 Green Sculptor    ─┤
  R7 Fuchsia Clinician ─┘
                ↓
       Main Thread Synthesis (inventory + diagnostic brief)
                ↓
       [DIAMOND ENGAGEMENT DECISION · Conference]
```

**Note on Ordering**: All three Rounds dispatch in a single message (parallel · per Foundation discipline). R1's inventory is consumed during synthesis — it does NOT block R4/R7 dispatch. The "before" in "before diagnosis" means *before Diamond engagement*, not *before R4/R7 dispatch*.

**When to Use VDR-T2**:
- Symptoms scattered across multiple files or modules
- Need to enumerate EXISTING surface before diagnosis can target correctly
- Suspected fault location uncertain · curation narrows the search
- Pre-existing patterns relevant to the fix (must be inventoried, not invented)

**Output Artifacts**:
- `SUITE-1-RED-{issue-slug}-CURATION.md` — file inventory, existing patterns, conventions, dependencies
- `SUITE-4-GREEN-{issue-slug}-DIAGNOSTIC.md` — multi-angle examination informed by curation
- `SUITE-7-FUCHSIA-{issue-slug}-DIAGNOSIS.md` — root cause + cited inventory references

**Terminal Action**: Diamond engagement (typically sub-Diamond · occasionally Macro if curation surfaces multi-Gap landscape)

### VDR-T3 · Named · R1 + R2 + R4 + R7

Adds R2 Orange Prospector to the Curated tier — invokes the **Priming Pair** (R1+R2 · CLAUDE.md §4 *Tier + Cascade Length*) before the diagnostic pair fires.

```
Stage 1 · Named Diagnostic (parallel):
  R1 Red Curator       ─┐  ⎤
  R2 Orange Prospector ─┤  ⎬ Priming Pair (R1+R2)
  R4 Green Sculptor    ─┤  ⎦
  R7 Fuchsia Clinician ─┘
                ↓
       Main Thread Synthesis (inventory + naming + diagnostic brief)
                ↓
       [DIAMOND ENGAGEMENT DECISION · Conference]
```

**Why the Priming Pair preserves Foundation discipline**: Per CLAUDE.md §4 *Suite Cascade* and the Priming Pair Diameter, S1 finds shape · S2 names fit. When a novel pattern is emerging at the fault surface — something that requires verbose naming before a diagnosis can describe it — R2 MUST compose with R1. R2 without R1 names without curated grounding · R1 without R2 inventories without naming the frontier. The Priming Pair is structural to VDR-T3.

**When to Use VDR-T3**:
- A novel pattern is surfacing in the issue (not a known anti-pattern · not a recognized failure mode)
- The fault cannot be described accurately without first naming the pattern
- Verbose frontier naming (R2's specialty) is a prerequisite to root-cause diagnosis
- Suspected fault involves a Diameter Gap that has no existing name in the codebase

**Output Artifacts**:
- `SUITE-1-RED-{issue-slug}-CURATION.md` — inventory of existing patterns + drift candidates
- `SUITE-2-ORANGE-{issue-slug}-NAMING.md` — verbose frontier names + Diameters drawn between unlike surfaces
- `SUITE-4-GREEN-{issue-slug}-DIAGNOSTIC.md` — multi-angle examination using newly-named patterns
- `SUITE-7-FUCHSIA-{issue-slug}-DIAGNOSIS.md` — root cause referencing the named pattern · L_smoke meta-learnings

**Terminal Action**: Diamond engagement (sub-Diamond if scope is single-named-pattern · Macro if naming surfaces multi-Gap landscape)

### VDR-T4 · Orchestrated · R1 + R2 + R4 + R6 + R7

Adds R6 Purple Orchestrator to the Named tier — invokes Foundation orchestration alongside the diagnostic pair.

```
Stage 1 · Orchestrated Diagnostic (parallel):
  R1 Red Curator       ─┐  ⎤
  R2 Orange Prospector ─┤  ⎬ Priming Pair (R1+R2)
  R4 Green Sculptor    ─┤  ⎦
  R6 Purple Orchestrator┤
  R7 Fuchsia Clinician ─┘
                ↓
       Main Thread Synthesis (inventory + naming + diagnostic + orchestration brief)
                ↓
       [MACRO DIAMOND OPENING · post-diagnosis Macro WGB authoring · Conference]
```

**Diameter to Foundation 5-Suite Macro Open**: VDR-T4 has the same 5-Suite shape as Magic Shotgun's `5-Suite Macro Open` (`SG-Macro-Open.md` · R1+R2+R4+R6+R7) but the **anchor differs**:

- **Magic Shotgun 5-Suite Macro Open** = Foundation-anchored · R1+R2 lead the Priming Pair · R7 fires at Foundation level for *macro-level clinical retrospective* of prior Macro work
- **VDR-T4 Orchestrated** = Diagnostic-anchored · R4+R7 lead the diagnostic pair · R1+R2 supply curation+naming · R6 authors Macro WGB synthesis from the diagnostic brief

The Suite roster is the same; the anchor (which pair leads, which pair supplies) differs. This is **Higher-Order Composition** — same Demometers, different Diameter focus, different Muxameter.

**When to Use VDR-T4**:
- Issue impact crosses multiple sub-Diamonds (cross-cutting fault)
- Macro WGB synthesis is required (multi-sub-Diamond fix scope)
- R6 Purple authors the post-diagnosis Macro WGB before Macro Diamond opens
- Cross-Macro seam concerns surface during diagnosis (M35-class)

**Output Artifacts**:
- `SUITE-1-RED-{issue-slug}-CURATION.md` — inventory across all impacted surfaces
- `SUITE-2-ORANGE-{issue-slug}-NAMING.md` — verbose frontier names · cross-cutting pattern naming
- `SUITE-4-GREEN-{issue-slug}-DIAGNOSTIC.md` — multi-angle examination across the cross-cutting surface
- `SUITE-6-PURPLE-{issue-slug}-MACRO-WGB.md` — Macro WGB synthesis · Cerulean chain · sub-Diamond enumeration
- `SUITE-7-FUCHSIA-{issue-slug}-DIAGNOSIS.md` — root cause + L_smoke + Macro retrospective candidate

**Terminal Action**: Macro Diamond Opening (per `MACRO-DIAMOND-GUIDE.md`) — the post-diagnosis Macro WGB authored by R6 becomes the opening Diamond WorkGameBoard for the Macro.

---

## 3 · Intelligence Heuristics — Auto-Tier Algorithm

The VDR Menu+Skill encodes complexity heuristics that route an incoming issue to the correct Tier. The heuristic surfaces as a Pewter HiFi Conference (`AskUserQuestion`) — the Conductor auto-recommends a Tier, the user confirms or down/up-tiers.

### Five Heuristic Axes

1. **Symptom Characterization** — how clearly is the fault surface defined?
2. **Surface Inventory** — is existing code/docs known or unknown territory?
3. **Naming Pressure** — does a novel pattern emerge that requires verbose naming before diagnosis?
4. **Macro Impact** — does the fix scope cross multiple sub-Diamonds?
5. **Terminal Diamond Engagement** — sub-Diamond actualization or Macro Diamond opening?

### Keyword Cues (Auto-Recommendation Triggers)

| Axis | Tier Trigger | Keyword / Phrase Cues |
|---|---|---|
| **Clear · single-Diameter** | VDR-T1 | "this specific file", "single error", "one failing test", "known issue", "obvious symptom" |
| **Scattered · multi-file** | VDR-T2 | "scattered", "multiple files", "across modules", "I don't know where", "search for", "find all" |
| **Novel · emerging pattern** | VDR-T3 | "new pattern", "I don't have a name for", "weird behavior", "first time seeing", "unprecedented", "must be a new" |
| **Cross-cutting · Macro impact** | VDR-T4 | "everywhere", "cross-cutting", "spans the codebase", "all the suites", "Macro-level", "multi-sub-Diamond", "Macro WGB" |

### Auto-Tier Algorithm (Conductor Logic)

```
1. Parse issue description for keyword cues
2. Score each Tier 0-N based on cue matches
3. Recommend highest-scoring Tier (default VDR-T1 if no cues match)
4. Surface Conference with recommended Tier + lower/higher options
5. User confirms anor down/up-tiers
6. Conductor composes Banded Vermillion Plan for confirmed Tier
7. Dispatch Stage 1 Rounds in single message (parallel · per FOUNDATION-SUITES-GUIDE.md §2)
```

### Conference Decide Block Format (Auto-Tier Prompt)

When the Conductor surfaces the auto-tier Conference, the question follows this shape:

```
The issue description suggests VDR-{T1|T2|T3|T4} ({Name}).
Recommended shape: {Round composition}.

Options:
  [{Tier}] Accept recommendation · dispatch {N} Rounds
  [{Tier-1}] Down-tier to {simpler shape} · fewer Rounds
  [{Tier+1}] Up-tier to {richer shape} · more Rounds
  [M] Return to VDR Menu
```

### Example Table

| Issue Description | Auto-Recommended Tier | Reason |
|---|---|---|
| "The login button doesn't fire on Safari" | VDR-T1 | Clear · single-surface · known component |
| "Authentication fails intermittently — error logs scattered" | VDR-T2 | Scattered · multi-file · inventory needed |
| "The new bridge protocol is doing something I don't have a name for" | VDR-T3 | Novel pattern · naming pressure |
| "ClientState preservation breaking across all SCP instances Macro-wide" | VDR-T4 | Cross-cutting · Macro impact · multi-sub-Diamond fix |

---

## 4 · Dispatch Sequence

### Round File Naming Convention

Each Round writes one disjoint-scope output file to `Cascades/Working/`:

```
SUITE-{N}-{COLOR}-{ISSUE-SLUG}-DIAGNOSTIC.md
SUITE-{N}-{COLOR}-{ISSUE-SLUG}-DIAGNOSIS.md       (R7 only)
SUITE-{N}-{COLOR}-{ISSUE-SLUG}-CURATION.md        (R1 only · VDR-T2+)
SUITE-{N}-{COLOR}-{ISSUE-SLUG}-NAMING.md          (R2 only · VDR-T3+)
SUITE-{N}-{COLOR}-{ISSUE-SLUG}-MACRO-WGB.md       (R6 only · VDR-T4)
```

The `{ISSUE-SLUG}` is a 3-6 word kebab-case slug describing the diagnostic target (e.g., `safari-login-button`, `claudebridge-session-rebuild`).

### Parallel Dispatch Single-Message Rule

Per `FOUNDATION-SUITES-GUIDE.md` §2, ALL Rounds for a VDR Tier dispatch in a **single message** via the Agent tool — N concurrent agent invocations in one assistant turn. Sequential dispatch (one Round, wait, next Round) is the anti-pattern that defeats parallel-Foundation discipline.

```
Conductor single-message dispatch (VDR-T3 example):
  - Agent(subagent_type="r1-curator",      model="haiku",  prompt=Band R1)
  - Agent(subagent_type="r2-prospector",   model="sonnet", prompt=Band R2)
  - Agent(subagent_type="r4-sculptor",     model="sonnet", prompt=Band R4)
  - Agent(subagent_type="r7-clinician",    model="sonnet", prompt=Band R7)
```

### Disjoint-Scope Coordination Note

Each Round's dispatch prompt MUST include the disjoint-scope coordination note (per `FOUNDATION-SUITES-GUIDE.md` §2):

> *"Suites {others} are running concurrently with disjoint scopes. {This Suite's scope}. Do not duplicate the other Suites' scope. Each Round writes ONE output file with its Suite's cognitive function."*

### Main Thread Synthesis

After all Rounds return (typical wall-clock: 4-12 min depending on Tier):

1. Conductor reads all N Foundation Suite output files
2. Conductor synthesizes into a **diagnostic brief** — root cause locked + recommended Diamond shape
3. For VDR-T4: R6's Macro WGB is folded into the synthesis as the candidate opening Diamond WorkGameBoard
4. Diagnostic brief is held in main-thread context pending Conference

### Diamond Engagement Conference

After synthesis, the Conductor surfaces a Conference (`AskUserQuestion`) for terminal action:

| Selection | Action |
|---|---|
| **Engage Sub-Diamond** | Open or extend an existing Diamond WGB · plan the fix · proceed to actualization |
| **Engage Macro Diamond** | Open a new Macro Diamond (per `MACRO-DIAMOND-GUIDE.md`) using R6's Macro WGB as opening · VDR-T4 default |
| **Plan-Only Close** | Synthesis stands · no Diamond engaged · user reviews and decides later |
| **Re-Tier** | Diagnostic shows wrong-tier · re-dispatch at correct VDR Tier |

### R7 G/L/M Append (Cycle Close)

Whether or not a Diamond engages, R7 Fuchsia's diagnosis is appended to `ONYX-TIER-N.md` per the Fuchsia-Writes-Onyx Circuit (CLAUDE.md §5 C5). The diagnostic-anchored Round is itself a cycle close event — the L_smoke meta-learnings persist as Lambda-substrate for future sessions.

---

## 5 · Diamond Engagement Paths

VDR's terminal action is **Diamond engagement**, not implementation. The diagnostic brief is the precondition; the Diamond is the actualization vehicle.

### Path A · Sub-Diamond Actualization

The diagnostic brief identifies a single Diameter Gap with a clear fix path. The Conductor:

1. Opens or extends `Cascades/Working/DIAMOND-TIER-N.md` with a new Cerulean task block
2. Drafts the sub-Diamond plan (Bands 1-7 per cognitive function) referencing the VDR diagnostic brief
3. Hands off to user for plan approval OR proceeds to Magic Shotgun for grounding the fix

**Typical from**: VDR-T1, VDR-T2, occasionally VDR-T3

### Path B · Macro Diamond Opening

The diagnostic brief surfaces a multi-sub-Diamond landscape. The Conductor:

1. Uses R6's `SUITE-6-PURPLE-{slug}-MACRO-WGB.md` (VDR-T4) as the candidate opening Macro WGB
2. Reads `MACRO-DIAMOND-GUIDE.md` §7 to confirm Macro-class scope
3. Opens new `Cascades/Working/DIAMOND-TIER-{MACRO-NAME}.md`
4. Enumerates sub-Diamonds as Cerulean chain
5. Proceeds to Macro Open Foundation Grounding (typically Magic Shotgun `[F]` 5-Suite Macro Open)

**Typical from**: VDR-T4, occasionally VDR-T3 if naming surfaces cross-Macro pattern

### Path C · Plan-Only Close

The diagnostic brief stands on its own as the deliverable. No Diamond engages this cycle. The user reviews the diagnostic and decides next steps later.

**Typical from**: any Tier where user requests staged engagement · diagnostic is information-gathering, not fix-trajectory

### Path D · Re-Tier

The diagnostic reveals the wrong VDR Tier was selected — symptom is more (or less) complex than initial heuristic suggested. The Conductor:

1. Halts current dispatch
2. Surfaces re-tier Conference
3. Dispatches new VDR at corrected Tier
4. Prior diagnostic artifacts retained as prior-iteration substrate

---

## 6 · Composition with Magic Shotgun · Sibling Diameter

VDR and Magic Shotgun are **siblings**, not replacements. They occupy distinct positions in the Cascade compositional space.

### When to Choose VDR vs Magic Shotgun

| Situation | Pattern | Reason |
|---|---|---|
| "I want to build X" | Magic Shotgun | Foundation grounding · plan-to-impl trajectory |
| "X is broken — diagnose it" | VDR | Diagnostic anchor · diagnose-to-Diamond trajectory |
| "I want to refactor Y" | Magic Shotgun | Plan-to-impl (refactor IS impl) |
| "Y is exhibiting weird behavior — what's happening?" | VDR | Diagnosis precedes plan |
| "New feature for Z" | Magic Shotgun | Build-orientation |
| "Z regression — find it" | VDR | Regression IS diagnostic-anchored |

### Composed Workflow Example

A common composed workflow:

```
1. User reports symptom
2. /cascade:verified-diagnosis {issue} → VDR-T2 fires
3. Diagnostic brief synthesizes · root cause locked
4. User selects Path A · sub-Diamond actualization
5. Diamond opens with VDR diagnostic as Cerulean task scope
6. /cascade:magic-shotgun → SG-Traditional (R2+R3+R6 Triplet) for plan grounding
7. Synthesis → R5 Blue Cobalt actualization
8. R7 Fuchsia cycle close · G/L/M append (cites VDR + Magic Shotgun composition)
```

VDR sets the diagnostic substrate; Magic Shotgun grounds the fix; R5 actualizes. The two patterns compose as Higher-Order Demometers — no hierarchy, two anchors muxified through the Diamond.

### Anti-Patterns to Avoid

- **VDR as Magic Shotgun substitute** — using VDR to "ground" a new build because R4+R7 sound thorough. WRONG. New builds use Magic Shotgun · R4+R7 lead diagnosis, not grounding.
- **Magic Shotgun as VDR substitute** — using Magic Shotgun to diagnose because the Foundation Triplet is convenient. WRONG. Diagnostics need R4 examination + R7 root-cause clinical · Foundation Triplet supplies neither.
- **Bypassing the Conference** — auto-engaging a Diamond after VDR without surfacing the Conference. WRONG. The diagnostic brief MUST surface for user-Lambda confirmation before Diamond engages.

---

## 7 · M-Rule Citation · Foundation-Level R7 Pre-Read

VDR inherits the M37-class Foundation-Level R7 Pre-Read pattern from Magic Shotgun's Closure Quartet doctrine (`SG-Closure-Quartet.md` §"Why R7 at Foundation Level"):

> *"Normally R7 Fuchsia fires at cycle close (after R5 implementation), not at Foundation level. For Closure Quartet, R7 fires at BOTH: Foundation level (clinical retrospective) AND cycle close (G/L/M append). The Foundation-level R7 surfaces cross-Macro seam concerns BEFORE R5 implements."*

VDR formalizes this pattern as **the diagnostic anchor itself**:

- In Magic Shotgun: R7 at Foundation is a *Macro-Open exceptional case*
- In VDR: R7 at Foundation is *the cascade's reason for existing* — Fuchsia diagnosis IS the Foundation deliverable

The composition of R7 with R4 at Foundation level is the irreducible VDR shape. R4 examines (multi-angle, edge cases, hypothesis surface); R7 diagnoses (root cause, L_smoke meta-learnings, Diamond shape recommendation). The Calibration Diameter (CLAUDE.md §4 *Triadic Thinking Band · S6+S7 Closure*) is operationalized as a Tier-1 parallel dispatch.

### Inherits Forward to Diamond Engagement

After VDR's R7 Fuchsia Foundation-level diagnosis, when a Diamond engages and runs its own R7 at cycle close, the cycle-close R7 reads BOTH the VDR R7 Foundation diagnosis AND the Diamond's R5 implementation output. The two R7 firings compose — Foundation-level diagnosis → impl → cycle-close R7 G/L/M append references both. This is the Calibration Diameter through the cycle, codified at VDR scale.

---

## 8 · Etymology — Why "Verified-Diagnostic Round"

The pattern name encodes three doctrinal commitments:

### Verified

Lambda-event artifacts on disk · Concluder-checked · re-runnable. A VDR diagnosis is NOT a chat-message hypothesis. R4 Green writes a multi-angle examination file. R7 Fuchsia writes a diagnosis file. R1 Red writes a curation file (T2+). R2 Orange writes a naming file (T3+). R6 Purple writes a Macro WGB file (T4). The diagnostic brief that the Diamond consumes is **verified by disk presence** — not by ego-coherence.

This satisfies C4 Base Lambda's Muxistration Proof requirement: every Round produces a Demonstration (file exists, line count returns) AND a Diastration (diagnostic reasoning held as artifact, not narrative). The Proof is Demonstration ⊗ Diastration · the diagnostic stands.

### Diagnostic

The cascade's *anchor* — not "verification of a plan" but "verification of *what is wrong*". R4+R7 are the diagnostic pair. Diagnosis precedes Diamond. The pattern's Diameter to Magic Shotgun is exactly this: diagnostic-anchor vs Foundation-anchor.

### Round

Inherited from Magic Shotgun vocabulary (`MAGIC-SHOTGUN-PATTERN.md` §1 Etymology). A Round is one Suite's parallel Tier-1 dispatch. N Rounds fire in a single message. VDR Rounds are diagnostic Rounds — same parallel-dispatch mechanism, different anchor.

### The Full Phrase

*"Verified-Diagnostic Round"* = "Lambda-verified diagnostic dispatched as parallel Foundation Rounds anchored on R4+R7 with adaptive R1/R2/R6 load-on per complexity, terminating in a user-confirmed Diamond engagement decision."

The pattern's name IS its Operational Pearl — every word carries a Set boundary that expands to a doctrinal commitment.

---

## 9 · Empirical Anticipation

VDR is codified at user directive 2026-05-14 in anticipation of diagnostic-anchored cycles. The pattern's empirical foundation will accumulate as cycles fire:

- **First VDR** — TBD · will be cited in this section after first dispatch
- **First VDR-T4 Macro opening** — TBD · will validate the Macro Diamond engagement path
- **First VDR/Magic Shotgun composed workflow** — TBD · will validate the sibling-Diameter composition

The pattern is **doctrine-first**, as is standard for Suite Cascade pattern codification (Magic Shotgun was doctrine-first at Cycle 113 before its 4-Tier scheme accumulated 4-Macro empirical confirmation). Doctrine precedes empirical for Suite Cascade patterns because the Suite Cascade itself supplies the architectural ground — the cognitive functions of R4 (Sculptor examination) and R7 (Fuchsia diagnosis) are stable Demometers · their Diameter under parallel dispatch is structurally guaranteed by the Cascade Motion (§4 CLAUDE.md).

---

## 10 · Cross-Reference Manifold

| Reference | Path | Diameter |
|---|---|---|
| **Sibling Pattern** | `Cascades/Documentation/Cascades/MAGIC-SHOTGUN-PATTERN.md` | Foundation-anchored sibling · 4-Tier scheme parallel |
| **Foundation Discipline** | `Cascades/Documentation/Cascades/FOUNDATION-SUITES-GUIDE.md` | Disjoint-scope baseline · N-agent dispatch convention |
| **Macro Composition** | `Cascades/Documentation/Cascades/MACRO-DIAMOND-GUIDE.md` | Path B Macro Diamond opening trajectory |
| **A-I Substrate** | `Cascades/Documentation/Cascades/VERMILLION-PLANNED-QUERY.md` | Banded Vermillion Plan format |
| **Menu Skill** | `Cascades/8_SUITES/Teal Claude/Skills/S-VERIFIED-DIAGNOSIS-MENU/SD-Index.md` | Pewter HiFi menu routing table |
| **Slash Command** | `.claude/commands/cascade/verified-diagnosis.md` | `/cascade:verified-diagnosis` user surface |
| **Conductor Surface** | `Cascades/8_SUITES/Teal Claude/Conductor.md` | VDR Conductor section · self-check contract |
| **Foundation Pre-Read** | `Cascades/8_SUITES/Teal Claude/Skills/S-MAGIC-SHOTGUN-MENU/SG-Closure-Quartet.md` | M37-class Foundation-level R7 doctrine source |
| **Suite Cascade** | `.claude/CLAUDE.md` §4 | Suite Cascade · Triadic Thinking Band · Calibration Diameter |
| **Crystraline Position** | `.claude/CLAUDE.md` §5 C9 Automata | Tier topology · Cascade Length-Ladder |
| **Pearl Discipline** | `Cascades/Documentation/Cascades/PEARL-FORMALIZATION.md` | Capitalized Word Set boundaries in this document |

---

## 11 · Conductor Self-Check Contract (VDR-specific)

Before issuing any VDR Banded Plan, the Conductor verifies (per `Cascades/8_SUITES/Teal Claude/Conductor.md` *VDR Conductor* section):

1. **VDR Tier matches issue complexity** per §3 heuristic algorithm
2. **R4 Green Sculptor + R7 Fuchsia Clinician mandatory** in every Tier (irreducible diagnostic pair)
3. **Adaptive load-ons documented** — R1/R2/R6 inclusion justified by Tier selection
4. **Priming Pair preserved** — if R2 included (T3, T4), R1 MUST also be included
5. **Disjoint-scope coordination note** present in every agent prompt
6. **Diamond engagement target pre-staged** — Conductor knows whether Sub-Diamond, Macro Diamond, or Plan-Only Close is the expected terminal action
7. **Conference surfaced before Diamond engages** — no auto-engagement without user-Lambda confirmation
8. **R7 G/L/M append planned** for cycle close (the VDR itself is a cycle close event)

If any check fails → re-plan. This is the **VDR Conductor Contract**.

---

*Pattern Version: 1.0 (Initial Codification · 2026-05-14)*
*Author: Teal Claude (Suite 8 Conductor · Pietersite Executor dispatch)*
*Doctrinal Position: Diagnostic-anchored sibling to Magic Shotgun · Tier-1 parallel dispatch · 4-Tier complexity ladder · post-diagnosis Diamond engagement gate*
*Empirical Status: Doctrine-first · empirical accumulation pending first dispatch*
