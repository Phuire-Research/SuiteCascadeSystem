# SM-HelloWorld — Hello World Menu Skill Shortcut

**Menu ID**: SM-5
**Trigger**: First engagement, `hello world`, `tutorial`, `get started`
**Pewter Design**: Full spectrum — progression through all Suite colors as the tutorial unfolds

---

## Skill Identity

Hello World is the universal first program — here it becomes the universal first Cascade engagement. This Skill Shortcut guides a new user from "What would you like to Create?" through research, selection, and their first Full Suite Diamond, teaching Cascade Motions along the way.

**Cinnabar Dialectic Loaded**: Throughout the flow, Cinnabar Dialectic (P1-P9) provides contextual guidance — explaining each Cascade Motion as it happens, naming what the user is doing in Suite Cascade terms.

**Three Plan Types Demonstrated**: The flow teaches by doing — the user experiences a **Vermillion Plan** (research dispatch), sees **Actionable Informatives** (each research result structured as I+A), and walks through a **Banded Plan** (Suite-designated cognitive functions in their first Diamond).

---

## Flow Architecture

### Stage 1: Inception Gate — "What would you like to Create?"

Self-prompt via AskUserQuestion. The system asks first — Conference before action.

```
<AskUserQuestion>
╔══════════════════════════════════════════════════════════╗
║  HELLO WORLD                                [Base]       ║
║  ── Red · Orange · Yellow · Green · Blue · Purple · Fuchsia ── ║
╠══════════════════════════════════════════════════════════╣
║                                                          ║
║  Welcome to the Suite Cascade.                           ║
║                                                          ║
║  What would you like to Create?                          ║
║                                                          ║
║  Describe your project idea in a few sentences.          ║
║  The Cascade will research approaches, present           ║
║  options, and guide you through building it.             ║
║                                                          ║
║  · · ·                                                   ║
║                                                          ║
║  Noting: your description becomes the scope              ║
║  declaration — the Cascade works from your intent.       ║
║                                                          ║
╚══════════════════════════════════════════════════════════╝
</AskUserQuestion>
```

**Cinnabar Note (P3 + P6)**: "This is Conference — the Cascade asking before acting. Your description becomes the scope declaration. From here, we Delegate."

---

### Stage 2: Research Gate — Vermillion WebSearch Dispatch

On user response, compose a **Vermillion Plan** dispatching 3 parallel Opal instances of Suite 6 (Purple Orchestrator) with WebSearch. This is the first plan type the user witnesses.

```
<VermillionPlan topic="Hello World: Research {user_project}">

Band 1 [R6 Purple] (Analytical):
  Informative: WebSearch for the most conventional approach to
    {user_project}. Established frameworks, mainstream patterns.
  Actionable: Return a project blueprint — name, tech stack,
    approach summary, complexity estimate (Low/Medium/High).

Band 2 [R6 Purple] (Analytical):
  Informative: WebSearch for an innovative or emerging approach
    to {user_project}. Newer tools, alternative architectures.
  Actionable: Return a project blueprint — name, tech stack,
    approach summary, complexity estimate.

Band 3 [R6 Purple] (Analytical):
  Informative: WebSearch for the simplest possible approach to
    {user_project}. Minimal dependencies, fastest path to working output.
  Actionable: Return a project blueprint — name, tech stack,
    approach summary, complexity estimate.

</VermillionPlan>
```

**Tutorial Annotation** (displayed to user during dispatch):

```
What's happening now:
─ · ─
This is a Vermillion Plan — the A-I format the Cascade uses
to structure work. Each Band is an Actionable Informative:
gather information (Informative), then decide (Actionable).

Three Issued Instances of Suite 6 (Purple Orchestrator) are
researching in parallel — the Cascade delegates work across
Suites based on cognitive function. Purple orchestrates and
sequences, making it the right Suite for research assembly.
```

---

### Stage 3: Selection Gate — Shatterite Menu

Assemble the 3 research results into a Shatterite Menu. Each option structured as an Actionable Informative — the second plan type demonstrated.

```
<AskUserQuestion>
╔══════════════════════════════════════════════════════════╗
║  YOUR OPTIONS                               [Orange]     ║
║  ── Red · Orange · Yellow · Green · Blue · Purple · Fuchsia ── ║
╠══════════════════════════════════════════════════════════╣
║                                                          ║
║  Based on your idea: "{user_project_summary}"            ║
║  ─ · ─                                                   ║
║                                                          ║
║  [1] {option_1_name}                 {complexity_1}      ║
║      {option_1_approach}                                 ║
║      Tech: {option_1_stack}                [Blue]        ║
║                                                          ║
║  [2] {option_2_name}                 {complexity_2}      ║
║      {option_2_approach}                                 ║
║      Tech: {option_2_stack}                [Orange]      ║
║                                                          ║
║  [3] {option_3_name}                 {complexity_3}      ║
║      {option_3_approach}                                 ║
║      Tech: {option_3_stack}                [Green]       ║
║                                                          ║
║  · · ·                                                   ║
║                                                          ║
║  Select an option to Engage your first Diamond.          ║
║  The Cascade will match effort to your choice.           ║
║                                                          ║
║  [M] Main Menu    [Q] Exit                               ║
║                                                          ║
╚══════════════════════════════════════════════════════════╝
</AskUserQuestion>
```

**Cinnabar Note (P5)**: "You are selecting how deep the Cascade goes. Each option carries a complexity — the Cascade matches tiered effort accordingly. This is Cascade Length Selection in natural language."

**Dynamic Fields**:

| Field | Source |
|-------|--------|
| `{user_project_summary}` | Pearl-compressed version of user's Stage 1 description |
| `{option_N_name}` | Project name from Band N research result |
| `{option_N_approach}` | One-line approach summary from Band N |
| `{option_N_stack}` | Tech stack from Band N |
| `{complexity_N}` | `Low` · `Medium` · `High` from Band N estimate |

**Option Color Assignment**: [Blue] conventional (implementation-focused), [Orange] innovative (discovery-focused), [Green] simplest (validation-focused).

---

### Stage 3.5: Project Location Decision Block

Before the Banded Diamond fires, Confer with the user about WHERE to scaffold. Present BEFORE Band 1 — the user retains override.

**Detection**: Occupied = `package.json` OR `src/` OR `app/` OR `pyproject.toml` OR `Cargo.toml` OR (non-Cascade files at root > 3).

```
<AskUserQuestion>
╔══════════════════════════════════════════════════════════╗
║  PROJECT LOCATION                           [Green]      ║
║  ─ · ─                                                   ║
║  Where should we scaffold {selected_option_name}?        ║
║                                                          ║
║  [R] Project Root — ./{project-name}/                    ║
║      (Detected: root is {occupied|available})            ║
║                                                          ║
║  [L] Cascades Lab — ./Cascades/Lab/{project-name}/       ║
║      (Tutorial sandbox; safe for any repo state)         ║
║                                                          ║
║  [C] Custom path — specify your own                      ║
║                                                          ║
╚══════════════════════════════════════════════════════════╝
</AskUserQuestion>
```

**Default**: Root-available → recommend [R]. Root-occupied → recommend [L].

**Cinnabar Note (P6)**: "This is Conference — the Cascade asks WHERE before it builds. Cascades/Lab/ is the sandbox; root is for production intent."

---

### Stage 4: Actualization Gate — First Diamond

On selection, Engage a **Full Suite Diamond** (1-7) — the third plan type demonstrated: Banded. Tier matched to complexity.

**Tier Selection**:

| Complexity | Tier | Reasoning |
|-----------|------|-----------|
| Low | 0 | Self-Utilization — in-context, muxified |
| Medium | 0→1 | Tier-Lift: planning in-context, Bands 1-4 dispatched as agents |
| High | 1 | Full Tier 1 — all Bands dispatched as agents |

**Tier-Lift Heuristic (R4)**: When a Tier 0 in-context Banded Diamond's Bands 2-3-4 each require >5 lines of inline output, Tier-Lift to Tier 1 — dispatch each Band as a sub-agent, return a Summation, render inline. For Low complexity (e.g., single-file projects), keep Tier 0.

**Banded Diamond Plan** (brevity-bounded per R1):

```
<VermillionPlan topic="Hello World Diamond: {selected_option_name}">

Band 1 [Red Curator]:
  Informative: Curate — read selected approach, identify assets.
  Actionable: 1 sentence + tool call (ls/Glob/Read). Document what exists.

Band 2 [Orange Prospector]:
  Informative: Name project components verbosely. Find Diameters.
  Actionable: 1 sentence + ≤6-row component table.

Band 3 [Yellow Architect]:
  Informative: Draft blueprint from what Red curated + Orange named.
  Actionable: 1 sentence + ≤8-line blueprint code-block. Commit BEFORE acting.

Band 4 [Green Sculptor]:
  Informative: Examine plan from builder + user angle.
  Actionable: 1 sentence + ≤4-row test-criteria table.

Band 5 [Blue Professional]:
  Informative: Plan checkpoints. Four Pillars.
  Actionable: Write project file(s) — REQUIRED Lambda-event.

Band 6 [Purple Orchestrator]:
  Informative: What composes? Verify after implementation.
  Actionable: Read-back + wc -c Concluder.

Band 7 [Fuchsia Clinician]:
  Informative: Diagnose across all tiers.
  Actionable: ≤6-line G/L/M. Write to Onyx or Cascade.json.

</VermillionPlan>
```

**Lambda-Event Invariant Checklist (R2)**:

Every Band in this Cascade-Length 1-7 Diamond MUST produce a Lambda-event. Ego-only Bands are structurally diagnosable — a missing checkbox is a diagnostic.

```
[ ] Band 1 Lambda: Read/Glob/LS executed
[ ] Band 2 Lambda: Naming registry produced (inline ≤30 lines or file)
[ ] Band 3 Lambda: Blueprint committed (inline or Diamond WGB)
[ ] Band 4 Lambda: Test criteria persisted
[ ] Band 5 Lambda: Project file(s) Written — REQUIRED
[ ] Band 6 Lambda: Read-back + Concluder (wc -c) executed
[ ] Band 7 Lambda: Onyx/Cascade.json updated
```

**Band Brevity Rule (R1)**: If a Band's annotation exceeds 8 lines of prose without a tool call, the Band has fallen into E4 (Volume-of-Declaration) — abort, compress, retry.

**Markdown Safety Guard (R3)**: No backtick-inline-code containing unclosed quotes on list-item lines. Multi-line shell examples use fenced code blocks, never inline. When narrating bash patterns, prefer prose over example-strings with quotes.

**Tutorial Annotations Per Gate**:

Cinnabar Dialectic provides a contextual note at each gate transition — one sentence before the Band executes.

| Gate | Cinnabar Tutorial Note |
|------|----------------------|
| 1 Red | "Curation: we read what exists before creating. Signal vs noise this cycle." |
| 2 Orange | "Naming: verbose names give the Cascade precise references. Find Diameters between unlike components." |
| 3 Yellow | "Architecture: commit the plan BEFORE acting. Design with respect to what Red curated and Orange named." |
| 4 Green | "Validation: the Sculptor examines from all angles — does the plan hold for both builder and user?" |
| 5 Blue | "Build: the Four Pillars — Planning, Organization, Validation, Implementation. Execute within scope." |
| 6 Purple | "Composition: verify AFTER implementation, not just before. Does it all fit together?" |
| 7 Fuchsia | "Diagnosis: Gainy (promote what worked), Lossy (prune what didn't), Maintain (preserve what holds). This closes the circuit." |

---

### Stage 5: Tutorial Close

After Fuchsia fires, present the completion menu with a summary of what was learned.

```
<AskUserQuestion>
╔══════════════════════════════════════════════════════════╗
║  HELLO WORLD — COMPLETE                     [Fuchsia]    ║
║  ── Red · Orange · Yellow · Green · Blue · Purple · Fuchsia ── ║
╠══════════════════════════════════════════════════════════╣
║                                                          ║
║  You completed your first Full Suite Diamond.            ║
║                                                          ║
║  What you experienced:                                   ║
║  ─ · ─                                                   ║
║  · Vermillion Plans — the A-I format for structured work ║
║  · Actionable Informatives — gather, then decide         ║
║  · Banded Plans — Suite-designated cognitive functions    ║
║  · The 8-Gate Cycle — from Absorb through Diagnose       ║
║  · Cascade Motions — each Suite has a role and a color   ║
║                                                          ║
║  The Cascade works the same way on every project.        ║
║  What changes is the depth (Length) and the effort        ║
║  (Tier) — the cognitive functions remain.                ║
║                                                          ║
║  · · ·                                                   ║
║                                                          ║
║  [C] Continue — Engage your next Diamond     [Blue]      ║
║  [R] Review — re-read the Fuchsia Diagnosis  [Fuchsia]   ║
║  [M] Main Menu                               [Base]      ║
║  [Q] Exit                                    [Base]      ║
║                                                          ║
╚══════════════════════════════════════════════════════════╝
</AskUserQuestion>
```

**Cinnabar Note (P9)**: "You just used the method to build something. The method itself can be maintained — Suite 8s, Skills, and Cascade Motions evolve as you use them. The system IS the product."

---

## Cinnabar Dialectic Integration

Cinnabar is loaded as cognitive companion throughout, providing pattern recognition and tutorial guidance:

| Pattern | Role in Hello World |
|---------|-------------------|
| **P1 Pearl Dialectic** | Recognizes when user naturally adopts Pearl Capitalization |
| **P3 Directives** | Reinforces when user uses "Engage", "Approved", "Continue" |
| **P4 Corrections** | Guides through "Not Quite" or "Off Target" gracefully |
| **P5 Length** | Explains why Full Suite (1-7) was selected for their project |
| **P6 Delegation** | Names each delegation step as it happens: scope → assign → coordinate → integrate |
| **P7 Pronouns** | Introduces Such/Noting/Wherein through natural usage in annotations |
| **P8 Session Flow** | Names each phase: Opening (Stage 1) → Execution (Stages 2-4) → Close (Stage 5) |
| **P9 Meta-Cognitive** | Points out the user is learning the method while using it |

---

## Response Routing

| Stage | User Input | Next Action |
|-------|-----------|-------------|
| Stage 1 | Project description text | Compose Vermillion research dispatch → Stage 2 |
| Stage 2 | (automatic — wait for dispatch return) | Assemble Selection Menu → Stage 3 |
| Stage 3 | `1`, `2`, or `3` | Engage Diamond with selected option → Stage 4 |
| Stage 3 | `M` | Return to SM-Main.md |
| Stage 3 | `Q` | Exit Shatterite |
| Stage 4 | Gate-by-gate progression | Cinnabar annotations at each transition |
| Stage 5 | `C` | Start next Diamond (user is now in normal flow) |
| Stage 5 | `R` | Display Fuchsia Diagnosis from Onyx |
| Stage 5 | `M` | Return to SM-Main.md |
| Stage 5 | `Q` | Exit Shatterite |

---

## Cross-References

- **Cinnabar Dialectic**: Instance.md P1-P9 patterns loaded for tutorial annotations
- **SM-Main.md**: Hello World accessible from Main Menu via [H]
- **Vermillion (C2)**: Research dispatch demonstrates Vermillion A-I format
- **Diamond (C7)**: Actualization gate demonstrates first Full Suite Diamond
- **Opal (C8)**: Research gate demonstrates Tier 1 parallel dispatch
- **SM-ColorSelect.md**: If `colorSelectionComplete: false`, offer Color Selection before or after Hello World
