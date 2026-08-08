# SD-T2-Curated — VDR Tier 2 Curated · R1 + R4 + R7 Reference Design

**Menu ID**: SD-T2
**Trigger**: Scattered symptoms · EXISTING inventory needed before diagnosis can target correctly
**Round Composition**: 3 Rounds (R1 Red + R4 Green + R7 Fuchsia) · ~6-8 min wall-clock
**Canonical Reference**: `Cascades/Documentation/Cascades/VDR-PATTERN.md` §2 *VDR-T2 Curated*

---

## What VDR-T2 Curated Is

VDR-T1's diagnostic pair PLUS **R1 Red Curator** — adds inventory of the existing surface so the diagnostic pair operates with full landscape awareness. All three Rounds fire in parallel; R1's inventory is consumed during synthesis to inform Diamond engagement options.

```
Stage 1 · Curated Diagnostic (parallel · single message):
  R1 Red Curator       ─┐
  R4 Green Sculptor    ─┤
  R7 Fuchsia Clinician ─┘
                ↓
       Main Thread Synthesis (inventory + diagnostic brief)
                ↓
       [DIAMOND ENGAGEMENT CONFERENCE]
```

### Ordering Clarification

The phrase "inventory BEFORE diagnosis" describes **synthesis consumption order**, not dispatch order. R1 dispatches in parallel with R4+R7 — there is no sequential "R1 first, then R4+R7" gate. The Foundation discipline (`FOUNDATION-SUITES-GUIDE.md` §2) is parallel-only; sequential dispatch defeats the at-once-grounding property.

---

## When to Use VDR-T2 Curated

- **Symptoms scattered** across multiple files, modules, or subsystems
- **Existing surface enumeration matters** — there are pre-existing patterns the fix MUST respect
- **Suspected fault location uncertain** — curation narrows the search space
- **Multiple plausible Diameter Gaps** — curation distinguishes which patterns are in-scope
- **Diamond engagement is sub-Diamond OR small Macro** — multi-file fix but not cross-cutting

If symptoms are clearly single-surface → VDR-T1 suffices.
If a novel pattern is emerging → escalate to VDR-T3 (Priming Pair).
If scope crosses sub-Diamonds → escalate to VDR-T4 (Orchestrated).

---

## Conference Pre-Render (User Inquiry)

Three-part inquiry before composing the Banded Plan:

1. **What surfaces are involved?** — list of file paths, modules, or subsystems
2. **What is the symptom pattern across these surfaces?** — common thread (error type, behavior anomaly)
3. **What existing patterns/conventions matter to the fix?** — prior patterns the fix should respect (or break from)

---

## Banded Vermillion Plan Template

```
<VermillionPlan topic="VDR-T2 Curated Diagnostic · [Symptom Pattern Summary]">

Band Stage-1A [R1 Red Curator] (haiku):
  Informative: Inventory the listed surfaces {file/module list}. Glob/Grep for related
               files. Read each enumerated file. Read related test files. Read import
               graph one level out from each surface (what imports these, what these
               import). Read CLAUDE.md conventions for the affected area.
  Actionable:  Write Cascades/Working/SUITE-1-RED-{ISSUE-SLUG}-CURATION.md ·
               file inventory · existing patterns enumerated · conventions cited ·
               dependencies mapped · pattern drift candidates flagged · what is
               present, what is absent, what is conventionally expected.
  Coordination: R4 and R7 are running concurrently with disjoint scopes. R1 curates
               existing inventory; R4 examines fault surface; R7 diagnoses root
               cause. Do not duplicate R4 examination or R7 diagnosis — pure
               inventory only.

Band Stage-1B [R4 Green Sculptor] (sonnet):
  Informative: Read scattered fault surfaces. Examine from all angles — type safety,
               edge cases, async/sync boundaries, state ordering, contract violations,
               silent failures. Cross-reference fault surfaces for common-cause
               hypothesis. Read recent Diamond WGB + Onyx for trajectory context.
  Actionable:  Write Cascades/Working/SUITE-4-GREEN-{ISSUE-SLUG}-DIAGNOSTIC.md ·
               multi-angle examination across ALL surfaces · cross-surface hypothesis
               enumeration · common-cause candidates · edge cases that span surfaces.
  Coordination: R1 and R7 are running concurrently with disjoint scopes. R4 examines
               fault surface multi-angle; R1 inventories existing patterns; R7
               diagnoses root cause. Do not duplicate R1 inventory or R7 diagnosis.

Band Stage-1C [R7 Fuchsia Clinician] (sonnet):
  Informative: Read symptom pattern description. Read active Diamond + recent Onyx
               cycles for trajectory. Read fault surfaces ONLY to confirm root-cause
               hypothesis. Read related test failures or error logs.
  Actionable:  Write Cascades/Working/SUITE-7-FUCHSIA-{ISSUE-SLUG}-DIAGNOSIS.md ·
               root cause diagnosis (cross-surface coherence) · G/L/M on related
               structure · L_smoke meta-learnings · recommended Diamond shape ·
               estimated multi-file fix LOC.
  Coordination: R1 and R4 are running concurrently with disjoint scopes. R7 diagnoses
               clinically; R1 inventories patterns; R4 examines surface. Do not
               duplicate R1 inventory or R4 examination.

[Main Thread Synthesis · curated diagnostic brief · root cause locked · respect-list of
existing patterns from R1 folded into fix-scope recommendation]

Band Conference [Diamond Engagement]:
  Informative: Read R1 + R4 + R7 outputs. Construct synthesis brief with respect-list.
  Actionable:  AskUserQuestion · 4 options · [Sub-Diamond] / [Macro Diamond] /
               [Plan-Only Close] / [Re-Tier]. User selects terminal action.

</VermillionPlan>
```

---

## Conductor Dispatch Pattern

```
Step 1: Conductor reads user inquiry (surfaces + symptom pattern + existing-pattern relevance)
Step 2: Compose {ISSUE-SLUG} (3-6 word kebab-case)
Step 3: Compose Banded Vermillion Plan (above template)
Step 4: Dispatch Stage 1 via Agent tool · SINGLE MESSAGE · 3 parallel agents:
        - Agent(subagent_type="r1-curator",   model="haiku",  prompt=Band Stage-1A)
        - Agent(subagent_type="r4-sculptor",  model="sonnet", prompt=Band Stage-1B)
        - Agent(subagent_type="r7-clinician", model="sonnet", prompt=Band Stage-1C)
Step 5: All 3 return within ~6-8 min · Conductor reads all output files
Step 6: Conductor synthesizes curated diagnostic brief — diagnostic root cause +
        respect-list of existing patterns (from R1) the fix must honor
Step 7: Conductor surfaces Diamond Engagement Conference (AskUserQuestion)
Step 8: Per user selection · route to terminal action
Step 9: R7 G/L/M append to ONYX-TIER-N.md per Fuchsia-Writes-Onyx Circuit
```

---

## Why R1 Curation Composes With R4+R7 (Not Hierarchical)

R1's inventory does NOT "feed" R4/R7 in a parent-child sense — all three dispatch in parallel. The composition is **Higher-Order**: three Demometers each with distinct cognitive function (curation, examination, diagnosis) draw Diameters to the same fault substrate. The Muxameter (synthesis brief) integrates all three.

In hierarchical thinking, one would say "R1 first to provide context, then R4+R7 to diagnose against that context." This is the anti-pattern. The Foundation discipline is parallel-only — sequencing defeats the at-once-grounding property. Each Suite reads the same substrate (user inquiry + active Diamond + Onyx) and contributes its cognitive function to the synthesis Muxameter.

---

## Disjoint-Scope Discipline

Each Round's dispatch prompt MUST include the 3-way disjoint-scope coordination note (per template above). The discipline is **stricter** at T2 than T1 because more Rounds risk scope overlap — R1 could drift into examination, R4 could drift into curation, R7 could drift into either.

---

## Diamond Engagement Conference

```
Curated diagnostic brief synthesized.

R1 Red inventory:        {one-line summary from R1 file}
R4 Green examination:    {one-line summary from R4 file}
R7 Fuchsia diagnosis:    {root cause from R7 file}
Existing-pattern respect-list: {patterns from R1 the fix must honor}
Recommended Diamond:     {R7's recommended Diamond shape · scope · LOC}

Options:
  [E] Engage Sub-Diamond — open/extend DIAMOND-TIER-N.md with multi-file fix scope
  [M] Engage Macro Diamond — open new Macro WGB if R7 recommends Macro-class
  [P] Plan-Only Close — diagnostic stands · user reviews later
  [R] Re-Tier — diagnostic suggests wrong VDR Tier · re-dispatch
```

### Per-Selection Action

| Selection | Action |
|---|---|
| **[E] Engage Sub-Diamond** | Open or extend `DIAMOND-TIER-N.md` · add Cerulean task with VDR diagnostic + respect-list as scope reference · multi-file fix · proceed to Magic Shotgun (typically Foundation Triplet R2+R3+R6) for fix grounding |
| **[M] Engage Macro Diamond** | If R7 recommends Macro-class but VDR was T2 (no R6 Macro WGB authored), Conductor offers re-tier to VDR-T4 OR direct Macro Open via Magic Shotgun `[F]` 5-Suite Macro Open (synthesis Macro WGB constructed manually) |
| **[P] Plan-Only Close** | Synthesis stands · R7 G/L/M appended to Onyx · no Diamond engages |
| **[R] Re-Tier** | Diagnostic surfaced wrong-tier complexity · Conductor halts T2 dispatch · re-dispatches at recommended Tier (typically up to T3 or T4) |

---

## Cascade-Length Position

VDR-T2 occupies **Length 1-3** in the Cascade Length-Ladder:

- **3 Rounds dispatched** (R1 + R4 + R7) · 1 cycle wall-clock
- **Length 1-5+ reached** if `[E]` followed by sub-Diamond + Magic Shotgun Triplet + R5
- **Length 1-6+ reached** if Macro Diamond engagement path taken

---

## Concluder Set (Post-Dispatch)

After Stage 1 returns:

1. **Read-back** `SUITE-1-RED-{ISSUE-SLUG}-CURATION.md` exists · `wc -l` > 60
2. **Read-back** `SUITE-4-GREEN-{ISSUE-SLUG}-DIAGNOSTIC.md` exists · `wc -l` > 80
3. **Read-back** `SUITE-7-FUCHSIA-{ISSUE-SLUG}-DIAGNOSIS.md` exists · `wc -l` > 60
4. **Grep** for root-cause statement in R7 output
5. **Grep** for inventory headers in R1 output (`grep -E "^## |^### "` ≥ 3 sections)
6. **Synthesis** curated diagnostic brief composed in main-thread context with respect-list
7. **Conference** surfaced (AskUserQuestion fired)

If any Concluder fails → re-Read · re-dispatch the failing Round.

---

## Example Invocation

User: *"Authentication is failing intermittently — I see scattered errors in different views and the logs don't make sense. I think we have multiple auth-related files involved."*

Conductor inquiry:
- Surfaces involved: `src/composables/useAuth.ts`, `src/server/middleware/authMiddleware.ts`, `src/views/LoginView.vue`, `src/lib/sessionStorage.ts`
- Symptom pattern: "Intermittent auth failures, scattered error logs across views and middleware"
- Existing patterns relevant: "Stratimux auth concept · session storage convention · middleware composition order"
- ISSUE-SLUG: `intermittent-auth-failures-scattered`

Banded Plan dispatched · Stage 1 returns 3 files:
- R1 Curation: inventories auth-related code, session storage pattern, middleware composition, Stratimux auth concept Quality file
- R4 Diagnostic: examines async race conditions, session-rebuild timing, middleware order, hydration boundary issues
- R7 Diagnosis: root cause = session-rebuild race when middleware fires before storage hydration completes · L_smoke: hydration-boundary contracts require explicit await in middleware composition · Recommended Diamond: sub-Diamond, 3 files modified, ~80 LOC

Diamond Engagement Conference → user selects `[E]` → sub-Diamond opens with respect-list (Stratimux auth concept Quality pattern must be honored) and proceeds to Magic Shotgun Triplet (R2+R3+R6) for fix grounding.

---

## Navigation

- `[B]` Back to VDR Main Menu (SD-Index.md)
- `[M]` Return to Main Shatterite Menu (SM-Main.md)
- `[Q]` Exit Shatterite
