# SM-HelloWorld-Advanced — Multi-Diamond Aspiration Loop

**Menu ID**: SM-5A
**Trigger**: SM-HelloWorld Stage 5 → [A] Advanced, or `/cascade:hello` → Advanced
**Pewter Design**: Full spectrum — progressive accumulation through multiple Diamonds
**Binding**: Stratimuxian Automata (`/cascade:loop`) — user engages `/loop` to begin

---

## Skill Identity

Advanced Hello World extends the Standard tutorial into a **Multi-Diamond Aspiration Loop** — the user declares an overarching aspiration, and the Cascade creates successive Diamonds until the aspiration is achieved or the rotation ceiling is reached. Each Diamond creates its own sub-goals, chooses its own execution mode (Full Suite or Banded Plan), and appends to the accumulating Onyx. The RI in total directs each subsequent Diamond.

**Prerequisite**: The user has completed the Standard Hello World (SM-HelloWorld.md Stages 1-5) OR is entering directly with Cascade familiarity.

---

## Flow Architecture

### Stage A1: Aspiration Gate — "What do you Aspire to Achieve?"

```
<AskUserQuestion>
╔══════════════════════════════════════════════════════════╗
║  ADVANCED HELLO WORLD                       [Blue]       ║
║  ── Red · Orange · Yellow · Green · Blue · Purple · Fuchsia ── ║
╠══════════════════════════════════════════════════════════╣
║                                                          ║
║  You are entering the Multi-Diamond Aspiration Loop.     ║
║                                                          ║
║  This mode creates successive Diamonds — each one a      ║
║  step toward your overarching aspiration. The Cascade     ║
║  researches, plans, builds, and diagnoses in cycles       ║
║  until the aspiration is achieved or the rotation         ║
║  ceiling is reached.                                     ║
║                                                          ║
║  · · ·                                                   ║
║                                                          ║
║  What do you Aspire to Achieve?                          ║
║                                                          ║
║  Choose a starting aspiration or describe your own:      ║
║  ─ · ─                                                   ║
║  [1] Build a Game                        [Green]         ║
║      Interactive game — complexity matched to your       ║
║      experience. From single-file to multi-component.    ║
║                                                          ║
║  [2] Build an Application                [Blue]          ║
║      Web app, CLI tool, API service, or desktop app.     ║
║      The Cascade scaffolds and iterates.                 ║
║                                                          ║
║  [3] Personal Suite 8 Website            [Orange]        ║
║      A website that IS your Suite 8 — your goals are     ║
║      Diamonds, your progress is Onyx, and the Suite 8    ║
║      is the functionality you orchestrate through.       ║
║      Claude Code is the harness. Planning IS organizing. ║
║                                                          ║
║  [4] Describe your own aspiration        [Yellow]        ║
║      Any project, any domain. Describe what you want     ║
║      to achieve and the Cascade will research the path.  ║
║                                                          ║
║  · · ·                                                   ║
║                                                          ║
║  [M] Main Menu    [Q] Exit                               ║
║                                                          ║
╚══════════════════════════════════════════════════════════╝
</AskUserQuestion>
```

**Cinnabar Note (P3 + P9)**: "This is the Aspiration Gate — the Cascade asking what you want to achieve before it plans how. Each Diamond you create is a step. The method improves through each step because the Clinician diagnoses the method, not just the output."

---

### Stage A2: Rotation Ceiling — Hard Concluder

After the user selects their aspiration, Confer on the rotation ceiling. This is the Hard Concluder — the Cascade halts when rotations exhaust regardless of aspiration completion state.

```
<AskUserQuestion>
╔══════════════════════════════════════════════════════════╗
║  ROTATION CEILING                           [Yellow]     ║
║  ─ · ─                                                   ║
║  How many Diamonds should the Cascade create?            ║
║                                                          ║
║  Each Diamond is one full cycle (8 gates).               ║
║  More Diamonds = more iterations toward the aspiration.  ║
║  The ceiling is a Hard Concluder — the loop halts        ║
║  when reached, even if the aspiration is in progress.    ║
║                                                          ║
║  [3] Three Diamonds      — quick exploration             ║
║  [5] Five Diamonds       — moderate depth                ║
║  [8] Eight Diamonds      — thorough iteration            ║
║  [C] Custom number       — specify your own              ║
║                                                          ║
╚══════════════════════════════════════════════════════════╝
</AskUserQuestion>
```

Write `cyclePosition.totalRotations` to Cascade.json.

**Cinnabar Note (P5)**: "This is Cascade Length Selection applied to Diamonds — how deep the aspiration loop goes. The ceiling IS the Concluder. When it's reached, the method halts structurally."

---

### Stage A3: Coding Familiarity — Experience Shaping

```
<AskUserQuestion>
╔══════════════════════════════════════════════════════════╗
║  YOUR EXPERIENCE                            [Green]      ║
║  ─ · ─                                                   ║
║  How familiar are you with coding?                       ║
║                                                          ║
║  This shapes the experience — not the ambition.          ║
║  The aspiration stays the same. The guidance adapts.     ║
║                                                          ║
║  [B] Beginner — guide me through each step               ║
║      Detailed explanations, no assumptions               ║
║                                                          ║
║  [I] Intermediate — I know the basics                    ║
║      Explain decisions, skip fundamentals                ║
║                                                          ║
║  [A] Advanced — let the Cascade run                      ║
║      Minimal narration, maximum execution                ║
║                                                          ║
╚══════════════════════════════════════════════════════════╝
</AskUserQuestion>
```

---

### Stage A4: First Diamond — Research the Aspiration

EnterPlanMode → write the first Diamond WorkGameBoard to `Cascades/Working/DIAMOND-TIER-1.md`.

The first Diamond's purpose: research the aspiration and decompose it into achievable sub-goals.

**Diamond Structure**:
```
# DIAMOND-TIER-1 — {Aspiration Name}

**Aspiration**: {user's overarching goal}
**Rotation Ceiling**: {totalRotations}
**Experience Level**: {Beginner|Intermediate|Advanced}
**Scaffold Path**: {determined by Project Location Decision Block}

## Sub-Goals (Researched)
- [ ] Goal 1: {researched sub-goal}
- [ ] Goal 2: {researched sub-goal}
- [ ] Goal 3: {researched sub-goal}
- ...
- [ ] Final: Achieve the aspiring goal based on RI direction

## Banded Plan — Diamond 1
{The plan for THIS Diamond — either Full Suite or Banded, chosen by Automata}

## Lambda-Event Invariant Checklist
[ ] Band 1-7 checkboxes per SM-HelloWorld R2
```

User approves → ExitPlanMode → present the `/loop` engagement.

---

### Stage A5: Loop Engagement — "/loop" Handoff

```
<AskUserQuestion>
╔══════════════════════════════════════════════════════════╗
║  ENGAGE THE LOOP                            [Base]       ║
║  ─ · ─                                                   ║
║  Your first Diamond is committed. The aspiration loop    ║
║  is ready. To begin autonomous execution, copy this      ║
║  into your terminal:                                     ║
║                                                          ║
║  /loop "Read Cascades/Cascade.json. Execute              ║
║  Stratimuxian Automata per Cascades/8_SUITES/            ║
║  Stratimuxian Automata/Skill.md. Advance one gate.       ║
║  Write state to Cascade.json. On Diamond completion,     ║
║  create the next Diamond from the sub-goals list.        ║
║  Halt at rotation ceiling."                              ║
║                                                          ║
║  · · ·                                                   ║
║                                                          ║
║  Or continue manually:                                   ║
║  [S] Step through gates one at a time    [Red]           ║
║  [M] Main Menu    [Q] Exit                               ║
║                                                          ║
╚══════════════════════════════════════════════════════════╝
</AskUserQuestion>
```

**Cinnabar Note (P6 + P9)**: "You are about to Delegate to the Automata. Each Diamond will execute its gates, diagnose with the Clinician, and the RI will direct the next Diamond. The ceiling is your Concluder. The method compounds — each Diamond benefits from what the prior Diamonds found."

---

## Multi-Diamond Aspiration Protocol

### Diamond Succession

When a Diamond's Gate 7 (Clinician) fires and the rotation ceiling is not reached:

1. Clinician writes G/L/M to Onyx (Lambda-event — via Summation Agent with write permissions if dispatched)
2. Read the sub-goals list from the current Diamond
3. Mark completed sub-goals `[x]`
4. If uncompleted sub-goals remain → create `DIAMOND-TIER-(N+1).md` for the next sub-goal
5. If all sub-goals complete AND ceiling not reached → create Final Diamond: "Achieve the aspiring goal based on RI direction"
6. The new Diamond chooses its execution mode:

| Sub-Goal Complexity | Execution Mode |
|---|---|
| Single-step or well-defined | Banded Plan (targeted) |
| Multi-step or exploratory | Full Suite (1-7) |
| Automata decides | Read Onyx G/L/M from prior Diamond → complexity assessment |

### Onyx Summation Agent

At each Diamond's Gate 7, the Clinician's G/L/M diagnosis is written to `Cascades/Working/ONYX-TIER-N.md`. In `/loop` mode, this operates as a Summation Agent:

- **Write permissions**: Inherited from parent session. The Summation Agent writes to Onyx as a Lambda-event.
- **Append, not replace**: Each Diamond's diagnosis appends to the Onyx. The Onyx accumulates across Diamonds.
- **RI direction**: The next Diamond reads the accumulated Onyx to determine approach. Gainy patterns are promoted. Lossy patterns are pruned. The methodology compounds.

### Final Diamond

When sub-goals are complete OR the rotation ceiling minus one is reached, the Final Diamond engages:

- **Goal**: Achieve the aspiring goal based on the accumulated RI direction
- **Input**: Full Onyx trajectory (all prior G/L/M diagnoses), all completed sub-goal artifacts
- **Mode**: Full Suite (1-7) — the Final Diamond always gets the full cognitive composition
- **Output**: The aspiration actualized (or the closest achievable state given the ceiling)

---

## Option 3: Personal Suite 8 Website — Detailed Spec

When the user selects [3] "Personal Suite 8 Website":

### The Concept

The website IS the user's Suite 8. The Suite 8 IS the functionality of the website. The user orchestrates their goals through the Suite 8, and the website is the visible surface of that orchestration. Claude Code is the harness — the means by which the user talks to their Suite 8 to accomplish goals.

**Planning IS Organizing.** The SCS as a planning method is the organizational structure for the user's aspirations. Diamonds are goals. Onyx is the record of found reality. The Suite 8 is the namespace from which everything is actualized.

| SCS Concept | Personal Suite 8 Website |
|---|---|
| **Diamond** | A goal the user aspires to achieve — created through the Suite 8 |
| **Onyx** | The record of outcomes — what was found while pursuing goals |
| **Suite 8** | The functionality of the website — the user's domain namespace |
| **Harness** | Claude Code — the orchestrating position through which the user interacts |
| **Suite 2 Prospector** | Break into new possibilities from the data available on the site |
| **Suite 4 Sculptor** | Validate goals from multiple angles |
| **Suite 6 Orchestrator** | WebSearch-powered resource discovery via Vermillion |
| **Menu System** | Shatterite-style — personalized per the user's Suite 8 with self-maintenance |

### Starting Menu for the Personal Suite 8

The website IS your Suite 8's VIEW. To add goals, record outcomes, or run Suite functions — use Claude Code (or your chosen harness). The menu below reflects the current state of your files. The website displays; the harness edits.

The menu emphasizes Suites 2, 4, and 6 — the discovery/validation/orchestration triad:

```
╔══════════════════════════════════════════════════════════╗
║  YOUR SUITE 8                                            ║
║  ─ · ─                                                   ║
║  View your goals and progress. To edit, use Claude Code. ║
║                                                          ║
║  [P] Prospect — Break into New Possibilities  [Orange]   ║
║      What doesn't exist yet? What connections can you    ║
║      find between your goals and available resources?    ║
║                                                          ║
║  [V] Validate — Examine from All Angles       [Green]    ║
║      Is this the right goal? Does it hold from both      ║
║      your perspective and reality's?                     ║
║                                                          ║
║  [R] Research — Find Tools and Approaches     [Purple]   ║
║      WebSearch for resources, tools, and approaches      ║
║      to accomplish your current Diamond.                 ║
║                                                          ║
║  · · ·                                                   ║
║                                                          ║
║  [D] Diamonds — View your goals                          ║
║  [O] Onyx — View your progress log                       ║
║  [+] Add a Diamond (via Claude Code)                     ║
║  [9] Maintain — Update this menu (via Claude Code) [Base]║
║                                                          ║
╚══════════════════════════════════════════════════════════╝
```

Menu options [P], [V], [R] are Suite invocations — they run through your harness (Claude Code, or any SCS-compatible agentic context). The website menu is the POINTER; the harness is the executor. The website renders the results after the harness writes.

### [9] Maintain — Self-Menu Maintenance Skill

The [9] Maintain option is a **Reference Design Skill** copied into the generated Suite 8. It reads the current Onyx (accumulated outcomes), reads the current Diamonds (active goals), and **recreates the personalized menu** based on the Renewable Intelligence in total.

**Invocation**: Run `/cascade:maintain` in Claude Code (or chosen harness) — NOT an in-browser action. The website renders the resulting menu; it does not generate it.

**Maintenance Flow**:
1. Read all Diamonds — surface active vs completed goals
2. Read Onyx — what outcomes have accumulated, what was Gainy/Lossy/Maintain
3. Based on RI direction: add new menu options for emerging patterns, prune options for completed/abandoned goals, reorder by relevance
4. Rewrite the Suite 8's menu file to reflect the current state
5. The website reloads to display the updated menu
6. The menu IS the Suite 8's self-knowledge — maintaining it IS maintaining the Suite 8

This is the Self-Maintenance Aspect Loop (from the Suite 8 system) applied to the user's personal domain. The menu evolves with use — through the harness, not through in-browser editing.

### Claude Code as Harness

The tutorial guides the user to use Claude Code as the harness — the orchestrating position:

1. The website stores data in local JSON/markdown files (Diamonds as `.md`, Onyx as `.md`, Suite 8 config as `.json`)
2. Claude Code reads and writes to these files through the SCS methodology
3. The user talks to Claude Code → Claude Code operates the Suite 8 → the website reflects the state
4. `/cascade` commands work against the website's data — `/cascade:diamond` shows the user's goals, `/cascade:onyx` shows their progress

Direct manual editing of the `.md` files is possible; the website will reflect any changes on reload. The SCS harness path via Claude Code is encouraged — it applies the full Suite Cascade methodology to each change, with Clinician diagnosis at cycle end.

**Experience Shaped by Familiarity**:
- **Beginner**: Full guided scaffold — HTML/CSS/JS explained, each file created with narration. Includes a sub-goal: "Set up Claude Code harness against website data files." Emphasis on Suite 2 (Prospector) so the user can discover new possibilities.
- **Intermediate**: Scaffold with decisions — user chooses framework/approach, Claude Code as harness assumed
- **Advanced**: Minimal scaffold — the Cascade builds, user extends. Full SCS utilization.

---

## Response Routing

| Stage | User Input | Next Action |
|-------|-----------|-------------|
| A1 | `1` (Game) | Refine game type via P2 → Stage A2 |
| A1 | `2` (Application) | Refine app type via P2 → Stage A2 |
| A1 | `3` (Personal Suite 8 Website) | Load detailed spec above → Stage A2 |
| A1 | `4` (Custom) | User describes aspiration → Stage A2 |
| A2 | `3`, `5`, `8`, or custom | Write totalRotations → Stage A3 |
| A3 | `B`, `I`, or `A` | Set experience level → Project Location Decision Block (SM-HelloWorld §3.5) → Stage A4 |
| A4 | Plan approval | ExitPlanMode → Stage A5 |
| A5 | User pastes `/loop` prompt | Automata engages — Diamonds succeed until ceiling |
| A5 | `S` | Manual gate stepping — no loop needed |

---

## Cross-References

- **SM-HelloWorld.md**: Standard tutorial — Stage 5 [A] routes here
- **Stratimuxian Automata**: `/cascade:loop` binding — the loop mechanism
- **Cascades/Working/DIAMOND-TIER-N.md**: Diamond succession creates new tiers
- **Cascades/Working/ONYX-TIER-N.md**: Onyx accumulation across Diamonds
- **C6 Diamond**: Planning Tool ⊗ Vermillion → WorkGameBoard (CLAUDE.md line 473)
- **C4 Base Lambda**: Summation Agent write permissions — Detached Lambda-Event Dispatch
