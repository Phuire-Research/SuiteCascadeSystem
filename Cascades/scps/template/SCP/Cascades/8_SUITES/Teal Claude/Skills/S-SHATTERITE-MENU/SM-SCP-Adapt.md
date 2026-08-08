# SM-SCP-Adapt — SCP Adapt Cascade Menu Reference Design

**Reference Design ID**: SM-SCP-Adapt
**Suite 8**: Teal Claude (Shatterite Menu Skill)
**Surface**: Reached from `SM-SCP.md` `[A]` Adapt option · also direct via in-conversation invocation
**Pewter HiFi**: D5 closed-box · D7 active-button inversion · D1 Yellow palette (architect-stage emphasis)
**Origin**: Diamond SCP-6 · 2026-05-10 · Cross-Suite-8 Muxification (Cadmium Researcher + Stratimuxian Scholar + SCP Researcher)

---

## Purpose

Render the menu surface for invoking the SCP Adapt cascade — the Full-Suite (1-7) Diamond pattern that transforms a research target into a Stratimux-compliant SCP S8 deliverable. The Reference Design captures user-facing parameters (target, target instance designation, addition scope) and routes to the canonical Vermillion Banded Plan at `Cascades/8_SUITES/SCP Researcher/Strategy/SCP-Adapt.md`.

---

## Top-Level Adapt Menu

When the user routes here from `SM-SCP.md` `[A]` (or directly):

```
<AskUserQuestion>
╔══════════════════════════════════════════════════════════╗
║  SCP ADAPT — Research → Stratimux → SCP S8 Deliverable   ║
║  ─ · ─                                                   ║
║  Adapt a research target into a Stratimux-compliant      ║
║  addition to an existing SCP Suite 8 instance.           ║
║                                                          ║
║  This is a Full-Suite (1-7) Diamond cascade composing:   ║
║    Cadmium Researcher    — research prospecting          ║
║    Stratimuxian Scholar  — Stratimux pattern adaptation  ║
║    SCP Researcher        — SCP S8 deliverable shape      ║
║                                                          ║
║  [N] New Adaptation — Stage A1: Target Intake            ║
║      Start a fresh adaptation from a research target.    ║
║                                                          ║
║  [R] Resume Adaptation — pick up an in-progress cycle    ║
║      If a prior SCP-Adapt cycle paused mid-Band, resume  ║
║      from its Onyx checkpoint.                           ║
║                                                          ║
║  [?] About — read the Adapt cascade specification        ║
║      Open Cascades/8_SUITES/SCP Researcher/Strategy/     ║
║      SCP-Adapt.md (the canonical Vermillion plan).       ║
║                                                          ║
║  · · ·                                                   ║
║                                                          ║
║  [M] Main Menu · [B] Back to SCP Menu · [Q] Exit         ║
║                                                          ║
╚══════════════════════════════════════════════════════════╝
</AskUserQuestion>
```

---

## Operation Routing

| Selection | Action |
|---|---|
| `[N]` New | → Stage A1: Target Intake → Stage A2: Target Instance Selection → Stage A3: Addition Scope → Stage A4: Cascade Dispatch (run Vermillion plan Bands 0-7) → Stage A5: Adaptation Confirmation |
| `[R]` Resume | Read Onyx for the most recent paused SCP-Adapt cycle; resume from the recorded Band |
| `[?]` About | Read `Cascades/8_SUITES/SCP Researcher/Strategy/SCP-Adapt.md` and render |
| `[B]` Back | Return to `SM-SCP.md` top menu |
| `[M]` Main Menu | Return to `SM-Main.md` |
| `[Q]` Exit | End engagement |

---

## Stage Specifications

### Stage A1: Target Intake

```
<AskUserQuestion>
╔══════════════════════════════════════════════════════════╗
║  TARGET INTAKE                              [Orange]     ║
║  ─ · ─                                                   ║
║  What is the research target?                            ║
║                                                          ║
║  Provide one of:                                         ║
║   · A URL (whitepaper, API doc, framework docs)          ║
║   · A file path (prior research output, scratch notes)   ║
║   · A free-text description of the concept               ║
║   · A Diamond reference (a prior cycle's deliverable)    ║
║                                                          ║
║  Cadmium Researcher will prospect this target verbosely  ║
║  at Band 2 of the cascade.                               ║
║                                                          ║
║  [Free text] · [B] Back · [Esc] Cancel                   ║
║                                                          ║
╚══════════════════════════════════════════════════════════╝
</AskUserQuestion>
```

Capture as `{{target_name}}` slot for the Strategy file.

### Stage A2: Target Instance Selection

```
<AskUserQuestion>
╔══════════════════════════════════════════════════════════╗
║  TARGET INSTANCE                            [Blue]       ║
║  ─ · ─                                                   ║
║  Which SCP Suite 8 instance receives this adaptation?    ║
║                                                          ║
║  Running `scs scp list` to enumerate registered          ║
║  instances...                                            ║
║                                                          ║
║  {{enumerated_instances}}                                ║
║                                                          ║
║  [<designation>] Select instance                         ║
║  [+] Create new instance first                           ║
║       Routes to SM-SCP [I] Initialize                    ║
║  [B] Back · [Esc] Cancel                                 ║
║                                                          ║
╚══════════════════════════════════════════════════════════╝
</AskUserQuestion>
```

If no instances exist, the menu surfaces `[+] Create new instance first` as the primary call-to-action; routes to SM-SCP `[I]` Initialize, then returns here once the instance is created.

Capture the chosen designation as `{{designation}}` for the Strategy file. Read the chosen instance's `Instance.md` to extract `{{runtime_path}}` (the runtime reference or copy location).

### Stage A3: Addition Scope

```
<AskUserQuestion>
╔══════════════════════════════════════════════════════════╗
║  ADDITION SCOPE                             [Yellow]     ║
║  ─ · ─                                                   ║
║  What shape does this adaptation take in the SCP S8?     ║
║                                                          ║
║  [1] New Concept — entire new namespace under            ║
║       src/concepts/{{conceptName}}/                      ║
║                                                          ║
║  [2] New Qualities on existing Concept — additive        ║
║       qualities under an existing concept's qualities/   ║
║                                                          ║
║  [3] New Principle on existing Concept — orchestration   ║
║       added to an existing concept's principles/         ║
║                                                          ║
║  [4] New Strategy — reusable ActionStrategy graph        ║
║       added under an existing concept's strategies/      ║
║                                                          ║
║  [5] Composite — multiple of the above as one Diamond    ║
║                                                          ║
║  [B] Back · [Esc] Cancel                                 ║
║                                                          ║
╚══════════════════════════════════════════════════════════╝
</AskUserQuestion>
```

Capture the chosen scope. Stratimuxian Scholar's Band 3 work shapes accordingly (full Concept design vs. adding to existing).

### Stage A4: Cascade Dispatch

Render confirmation:

```
╔══════════════════════════════════════════════════════════╗
║  CASCADE READY                              [Green]      ║
║  ─ · ─                                                   ║
║  Target:    {{target_name}}                              ║
║  Instance:  {{designation}} ({{mode}} mode)              ║
║  Scope:     {{addition_scope}}                           ║
║  Runtime:   {{runtime_path}}                             ║
║                                                          ║
║  The cascade will now dispatch:                          ║
║   Band 0  Base Absorb                                    ║
║   Band 1  SCP Researcher curate                          ║
║   Band 2  Cadmium Researcher prospect                    ║
║   Band 3  Stratimuxian Scholar architect                 ║
║   Band 4  Validation                                     ║
║   Band 5  SCP Researcher implement                       ║
║   Band 6  Orchestrate + verify (typecheck gate)          ║
║   Band 7  Diagnose + commit                              ║
║                                                          ║
║  Estimated cycles: 1 rotation (may extend if Band 4      ║
║  validation requires returning to Band 3 for refinement) ║
║                                                          ║
║  [Y] Engage Cascade · [B] Back · [Esc] Cancel            ║
║                                                          ║
╚══════════════════════════════════════════════════════════╝
```

On `[Y]`, the cascade executes the Vermillion plan from `Cascades/8_SUITES/SCP Researcher/Strategy/SCP-Adapt.md` with slots filled. The execution is a Diamond cycle (the cascade IS the Diamond); the executor (in-context Tier 0 anor Tier 1 agent dispatch per execution-time decision) carries the Bands.

### Stage A5: Adaptation Confirmation

After Band 7 closes:

```
╔══════════════════════════════════════════════════════════╗
║  ✓ Adaptation Complete                      [Green]      ║
║  ─ · ─                                                   ║
║  Target adapted: {{target_name}}                         ║
║  Into instance: {{designation}}                          ║
║                                                          ║
║  Files written:                                          ║
║   {{filesWritten_list}}                                  ║
║                                                          ║
║  muxonomyRegistry updated · new tool surface:            ║
║   {{tool_list}}                                          ║
║                                                          ║
║  Concluders:                                             ║
║   · typecheck ✓                                          ║
║   · muxonomyRegistry compiles ✓                          ║
║   · Onyx G/L/M appended ✓                                ║
║   · Commit landed: {{commit_sha}}                        ║
║                                                          ║
║  [B] Back to SCP Menu · [M] Main Menu · [Q] Exit         ║
║                                                          ║
╚══════════════════════════════════════════════════════════╝
```

---

## Anomaly Handling

Per the canonical Strategy's "If any Concluder fails" note:

- **Band 3 Stratimux discipline failure**: cascade pauses; Onyx records failure; menu surfaces "Refinement Required" + routes back to Stage A3 with notes from Stratimuxian Scholar
- **Band 4 SCP composition failure**: cascade pauses; cite the conflict (e.g., quality name collision with existing scp/ qualities); offer rename or merge resolution
- **Band 6 runtime build failure**: cascade pauses; surface the typecheck output; route to Stratimuxian Scholar for hot-fix or back to Band 5 implementation review
- **User-initiated halt**: pause at current Band; record state in Onyx; surface `[R] Resume Adaptation` on next entry

---

## Cross-References

- Strategy (Vermillion plan): `Cascades/8_SUITES/SCP Researcher/Strategy/SCP-Adapt.md`
- Skill anchor: `Cascades/8_SUITES/SCP Researcher/Skill.md` SCP-S9
- Conductor pattern: `Cascades/8_SUITES/SCP Researcher/Conductor.md` Pattern E
- Cadmium Researcher: `Cascades/8_SUITES/Cadmium Researcher/Instance.md`
- Stratimuxian Scholar: `Cascades/8_SUITES/Stratimuxian Scholar/Instance.md`
- Diamond of origin: `Cascades/Working/DIAMOND-TIER-SCP-6.md` (gitignored)
- Parent menu: `SM-SCP.md`

---

## Trajectory

| Date | Diamond | Change |
|---|---|---|
| 2026-05-10 | SCP-6 | Reference Design created · Stages A1-A5 + Adapt menu top-level + anomaly handling · cross-Suite-8 muxification documented |
