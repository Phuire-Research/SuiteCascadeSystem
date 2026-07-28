# SD-T1-Base — VDR Tier 1 Base · R4 + R7 Reference Design

**Menu ID**: SD-T1
**Trigger**: Clear symptom · known surface · single-Diameter fix
**Round Composition**: 2 Rounds (R4 Green + R7 Fuchsia) · ~4-6 min wall-clock
**Canonical Reference**: `Cascades/Documentation/Cascades/VDR-PATTERN.md` §2 *VDR-T1 Base*

---

## What VDR-T1 Base Is

The irreducible diagnostic shape. Two Rounds fire in parallel as Tier-1 dispatches — **R4 Green Sculptor** examines the fault surface from all angles; **R7 Fuchsia Clinician** diagnoses root cause and produces L_smoke meta-learnings. Together they constitute the **Calibration Diameter** operationalized at Foundation level (CLAUDE.md §4 *Triadic Thinking Band · S6+S7 Closure*).

```
Stage 1 · Diagnostic Pair (parallel · single message):
  R4 Green Sculptor    ─┐
                        ├─→ 2 disjoint disk artifacts
  R7 Fuchsia Clinician ─┘
                ↓
       Main Thread Synthesis (diagnostic brief)
                ↓
       [DIAMOND ENGAGEMENT CONFERENCE]
```

---

## When to Use VDR-T1 Base

- **Symptom is clear** — single error message, single failing test, single broken view, single user-reported defect
- **Surface is known** — single file, tightly-coupled module, identifiable subsystem
- **One Diameter Gap suspected** — no novel pattern surface, no multi-module fault chain
- **No inventory needed** — you know where to look; existing-code curation would be wasted Tier
- **Diamond engagement is sub-Diamond** — fix scope is single Cerulean task, not Macro-class

If ANY of these are false → consider VDR-T2 (scattered/multi-file), VDR-T3 (novel pattern), or VDR-T4 (cross-cutting).

---

## Conference Pre-Render (User Inquiry)

When the user selects `[1]` from SD-Index, the Conductor surfaces a two-part inquiry before composing the Banded Plan:

1. **What is the symptom?** — single sentence describing the observable fault
2. **What is the suspected surface?** — file path, module, component, or subsystem name

The Conductor uses the answers to compose `{ISSUE-SLUG}` (3-6 word kebab-case) and the Band Informative sections.

---

## Banded Vermillion Plan Template

```
<VermillionPlan topic="VDR-T1 Diagnostic · [Symptom Summary]">

Band Stage-1A [R4 Green Sculptor] (sonnet):
  Informative: Read suspected surface {file/module path}. Examine from all angles —
               type safety, edge cases, SSR boundaries, state ordering, bidirectional
               contracts, async vs sync paths, error swallowing, silent failures.
               Read related test files. Read Diamond WGB for context.
  Actionable:  Write Cascades/Working/SUITE-4-GREEN-{ISSUE-SLUG}-DIAGNOSTIC.md ·
               multi-angle examination · enumerated hypotheses · suspect Diameter Gaps ·
               edge-case surface · ANY pattern that could produce the reported symptom.
  Coordination: R7 is running concurrently with disjoint scope. R4 examines the
               surface; R7 diagnoses root cause. Do not duplicate R7's clinical
               diagnosis — surface examination only.

Band Stage-1B [R7 Fuchsia Clinician] (sonnet):
  Informative: Read symptom description. Read active Diamond + recent Onyx cycles.
               Read related test failures or error logs if present. Read suspected
               surface ONLY to confirm root-cause hypothesis (not for examination).
  Actionable:  Write Cascades/Working/SUITE-7-FUCHSIA-{ISSUE-SLUG}-DIAGNOSIS.md ·
               root cause diagnosis · Gainy/Lossy/Maintain (G/L/M) on related code
               structure · L_smoke meta-learnings · recommended Diamond shape
               (sub-Diamond scope · Magic Shotgun composition pattern · estimated LOC).
  Coordination: R4 is running concurrently with disjoint scope. R7 diagnoses root
               cause; R4 examines surface. Do not duplicate R4's multi-angle
               examination — clinical diagnosis only.

[Main Thread Synthesis · diagnostic brief · root cause locked]

Band Conference [Diamond Engagement]:
  Informative: Read R4 + R7 outputs. Construct synthesis brief.
  Actionable:  AskUserQuestion · 4 options · [Sub-Diamond] / [Macro Diamond] /
               [Plan-Only Close] / [Re-Tier]. User selects terminal action.

</VermillionPlan>
```

---

## Conductor Dispatch Pattern

```
Step 1: Conductor reads user inquiry (symptom + suspected surface)
Step 2: Compose {ISSUE-SLUG} (3-6 word kebab-case)
Step 3: Compose Banded Vermillion Plan (above template)
Step 4: Dispatch Stage 1 via Agent tool · SINGLE MESSAGE · 2 parallel agents:
        - Agent(subagent_type="r4-sculptor",  model="sonnet", prompt=Band Stage-1A)
        - Agent(subagent_type="r7-clinician", model="sonnet", prompt=Band Stage-1B)
Step 5: Both return within ~4-6 min · Conductor reads both output files
Step 6: Conductor synthesizes diagnostic brief into main-thread context
Step 7: Conductor surfaces Diamond Engagement Conference (AskUserQuestion)
Step 8: Per user selection · route to terminal action (see Diamond Engagement Paths below)
Step 9: R7 G/L/M append to ONYX-TIER-N.md per Fuchsia-Writes-Onyx Circuit (CLAUDE.md §5 C5)
```

---

## Disjoint-Scope Discipline

Each Round's dispatch prompt MUST include the disjoint-scope coordination note:

> *"R{other} is running concurrently with disjoint scope. R4 examines surface (multi-angle, edge cases, hypotheses); R7 diagnoses root cause (clinical, L_smoke, Diamond recommendation). Do not duplicate the other Suite's scope."*

Source: `FOUNDATION-SUITES-GUIDE.md` §2 · enforced across all VDR Tiers.

---

## Diamond Engagement Conference

After synthesis, the Conductor presents:

```
Diagnostic brief synthesized.

R4 Green examination:    {one-line summary from R4 file}
R7 Fuchsia diagnosis:    {root cause from R7 file}
Recommended Diamond:     {R7's recommended sub-Diamond shape}

Options:
  [E] Engage Sub-Diamond — open/extend DIAMOND-TIER-N.md with fix scope
  [M] Engage Macro Diamond — open new Macro WGB (rare for T1; consider re-tier to T4)
  [P] Plan-Only Close — diagnostic stands · user reviews later
  [R] Re-Tier — diagnostic suggests wrong VDR Tier · re-dispatch
```

### Per-Selection Action

| Selection | Action |
|---|---|
| **[E] Engage Sub-Diamond** | Open or extend `Cascades/Working/DIAMOND-TIER-N.md` · add Cerulean task with VDR diagnostic as scope reference · proceed to Magic Shotgun for fix grounding OR direct sub-Diamond Bands 1-7 plan |
| **[M] Engage Macro Diamond** | Halt and re-tier up to VDR-T4 — Macro Diamond opening requires R6 Macro WGB authoring · single-Round R6 retro-fit is anti-pattern |
| **[P] Plan-Only Close** | Synthesis stands · R7 G/L/M appended to Onyx · no Diamond engages this cycle · Three-Step Close (Onyx append + checkpoint commit + Diamond task update) |
| **[R] Re-Tier** | Diagnostic surfaced wrong-tier complexity · Conductor halts T1 dispatch · re-dispatches at recommended Tier · prior R4/R7 artifacts retained as substrate |

---

## Cascade-Length Position

VDR-T1 occupies **Length 1-2** in the Cascade Length-Ladder (CLAUDE.md §5 C9 Automata):

- **2 Rounds dispatched** (R4 + R7) · 1 cycle wall-clock
- **Length 1-3 reached** only if Diamond Engagement Conference selects `[E]` and proceeds to Magic Shotgun Triplet
- **Length 1-5 reached** if `[E]` followed by full sub-Diamond Bands 1-7 with R5 actualization

VDR-T1 itself is **Foundation-level diagnosis** — Length 1-2 by Round count, but **Tier-1** by dispatch mechanism.

---

## Concluder Set (Post-Dispatch)

After Stage 1 returns:

1. **Read-back** `SUITE-4-GREEN-{ISSUE-SLUG}-DIAGNOSTIC.md` exists · `wc -l` > 80
2. **Read-back** `SUITE-7-FUCHSIA-{ISSUE-SLUG}-DIAGNOSIS.md` exists · `wc -l` > 60
3. **Grep** for root-cause statement in R7 output (`grep -E "root cause|Root Cause|RC:"`)
4. **Synthesis** diagnostic brief composed in main-thread context (Lambda-substrate for Conference)
5. **Conference** surfaced (AskUserQuestion fired)

If any Concluder fails → re-Read · re-dispatch the failing Round.

---

## Example Invocation

User: *"The login button doesn't fire on Safari but works on Chrome."*

Conductor inquiry:
- Symptom: "Login button click handler does not fire on Safari (works on Chrome)"
- Suspected surface: `src/views/LoginView.vue` + `src/composables/useAuth.ts`
- ISSUE-SLUG: `safari-login-button-no-fire`

Banded Plan composed · dispatched · Stage 1 returns:
- `SUITE-4-GREEN-safari-login-button-no-fire-DIAGNOSTIC.md` (R4 examines event binding, SSR hydration, Safari-specific event quirks, Vue 3 reactivity edge cases)
- `SUITE-7-FUCHSIA-safari-login-button-no-fire-DIAGNOSIS.md` (R7 diagnoses: SSR hydration mismatch + Safari passive-event-listener default · L_smoke: hydration boundaries require explicit `{ passive: false }` on click handlers · Recommended Diamond: sub-Diamond, 1 file modified, ~15 LOC)

Diamond Engagement Conference → user selects `[E]` → sub-Diamond opens with Magic Shotgun Traditional 2-Stage (R2+R3+R6 → R5) for fix grounding.

---

## Navigation

- `[B]` Back to VDR Main Menu (SD-Index.md)
- `[M]` Return to Main Shatterite Menu (SM-Main.md)
- `[Q]` Exit Shatterite
