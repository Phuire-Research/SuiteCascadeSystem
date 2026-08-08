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
║  [3] Personal SCP Suite 8                [Orange]        ║
║      Your own SCP Suite 8 — cloned from the SCP runtime  ║
║      template + SCP Researcher templates, renamed to     ║
║      your chosen designation. Identity IS perimeter:     ║
║      the Suite 8 designation IS the access boundary.     ║
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

## Option 3: Personal SCP Suite 8 — Detailed Spec

When the user selects [3] "Personal SCP Suite 8":

### The Concept

The user materializes their own **Personal SCP Suite 8** — an instance of the SCP (Suite Cascade Protocol) Suite 8 type, in Personal mode. The deliverable is a clone-and-rename of two artifacts:

1. **The SCP runtime template** at `SCP/` (the Vue + Stratimux + WebSocket runtime · MCP-parallel protocol surface)
2. **The SCP Researcher Suite 8 templates** at `Cascades/8_SUITES/SCP Researcher/Templates/` (the identity scaffolding)

Both clone into a user-named instance. The SCP Suite 8 is the user's Personal protocol surface — Suite-8-fronted locally; the designation IS the access perimeter; there is no orthogonal endpoint to expose.

**Identity IS Perimeter.** Where a conventional website-as-Suite-8 deploys an endpoint and defends it, a Personal SCP Suite 8 doesn't expose the surface to begin with. MCP-using clients (Claude Code, Claude Desktop, anything speaking MCP) reach tools *through* the Suite 8 designation — not through a public URL. Attack surface collapses to the Suite 8's identity boundary.

| SCS Concept | Personal SCP Suite 8 |
|---|---|
| **Diamond** | A goal the user aspires to achieve — Diamonds operate against the Personal SCP S8's runtime |
| **Onyx** | The record of outcomes — found reality across cycles touching this SCP S8 |
| **Suite 8 Designation** | The user-chosen name (e.g., `MicahsPersonal`, `KellersTools`) · IS the access perimeter |
| **Suite 8 Type** | SCP Suite 8 (Personal mode) — defined by SCP Researcher at `Cascades/8_SUITES/SCP Researcher/` |
| **Runtime Surface** | The Stratimux `scp` concept · qualities exposed as MCP tools through `muxonomyRegistry.generated.ts` |
| **Harness** | Claude Code (any MCP-speaking client) — interacts through the Suite 8 designation |
| **Transport** | Personal default: WebSocket + Express HTTP on `localhost:7111` (configurable) |

### Materialization Pattern

The instantiation follows **Pattern A · Instance Creation** from `Cascades/8_SUITES/SCP Researcher/Conductor.md`:

```
<VermillionPlan topic="Personal SCP Suite 8 · Create · {user_designation}">

Band 1 [R1 Red]: Validate inputs — designation availability · Personal mode confirmed · localhost:7111 unbound (or pick alternate)
Band 2 [R2 Orange]: Pearl-name the designation — verify it conveys the personal scope (e.g., "MicahsPersonal", not just "SCP")
Band 3 [R3 Yellow]: Plan the clone — copy vs reference for runtime; reference mode is the Personal default (saves disk; the runtime is generic)
Band 5 [R5 Blue + SCP-S1 + SCP-S2 + SCP-S3 + SCP-S4]:
  - SCP-S1 Designation Bind: clone Templates/{Instance,Skill}.md.template from Cascades/8_SUITES/SCP Researcher/Templates/ with slots filled
    - {{DESIGNATION}} = user's choice
    - {{MODE}} = Personal
    - {{ROLE}} = "Personal SCP bridge for MCP-using clients"
    - other slots from the Personal-mode defaults table in SCP Researcher Instance.md
  - SCP-S2 Runtime Bind: declare Runtime: ../../scps/template/SCP/ (reference mode) in the new instance's Instance.md (alternatively, copy SCP/ into Cascades/8_SUITES/{{DESIGNATION}}/SCP/ if copy mode chosen)
  - SCP-S3 Transport Deploy: WebSocket + Express HTTP on localhost:7111 (Personal mode default)
  - SCP-S4 Skill Surface: declare the initial muxonomyRegistry tool set — the runtime's scp/ qualities are surfaced by default
Band 6 [SCP-S5 Conference Decide]: Any Personal-mode skill overrides for this instance?
Band 7 [R7 Fuchsia + SCP-S8]: Register {{DESIGNATION}} in Cascades/SUITE8-REGISTRY.md · update Onyx · checkpoint commit

</VermillionPlan>
```

**Concluders for the materialization**:
- `Cascades/8_SUITES/{{DESIGNATION}}/Instance.md` exists with `Mode: Personal` and slots filled
- `Cascades/8_SUITES/{{DESIGNATION}}/Skill.md` exists with Personal-mode skill register
- Either `Cascades/8_SUITES/{{DESIGNATION}}/SCP/` exists (copy mode) or `Runtime: ../../scps/template/SCP/` declared (reference mode)
- Registry row in `Cascades/SUITE8-REGISTRY.md`
- Transport binds on `localhost:7111` (deploy gate — verified by user launching the runtime)

### Claude Code as Harness

After materialization, the user's daily interaction follows the same pattern as the website-era Personal Suite 8:

1. The Personal SCP S8 runs as a local Stratimux muxium with WebSocket + Express HTTP transport
2. Claude Code (or any MCP-using client) connects through the SCP S8 designation as the perimeter
3. The user dispatches tools through their harness; the SCP S8 routes them through the runtime
4. Each Diamond cycle operates against the SCP S8 — new qualities can be added to expand the tool surface; the runtime is the user's evolving capability

`/cascade` commands continue to work against the user's project files — `/cascade:diamond` shows active goals, `/cascade:onyx` shows progress. The SCP S8 layer adds *tool exposure* to MCP clients on top of the existing project workflow.

### Experience Shaped by Familiarity

- **Beginner**: Full guided scaffold — the Diamond walks through SCP runtime composition (Vue + Stratimux + WebSocket explained), Personal-mode defaults narrated, transport binding demonstrated. Includes a sub-goal: "Connect Claude Code to your Personal SCP S8 via MCP." Emphasis on Suite 2 (Prospector) so the user can discover new qualities to add to the runtime.
- **Intermediate**: Scaffold with decisions — user chooses transport (WebSocket-only / HTTP-only / both), tool surface (full SCP qualities / subset), runtime composition (reference / copy mode).
- **Advanced**: Minimal scaffold — the Cascade clones and renames; user extends the runtime with project-specific qualities. Full SCS utilization including Diamond cycles that add SCP qualities or compose new concepts.

### Why "Personal SCP Suite 8" Replaces "Personal Suite 8 Website"

The website pathway treated the Suite 8 as a *visible surface* (the website renders state; the harness edits files). That pattern relied on a web frontend as the user-facing layer.

The Personal SCP Suite 8 pathway treats the Suite 8 as a *protocol surface* (MCP clients reach tools through the Suite 8's designation; there is no separate website to maintain). The user-facing layer is whatever MCP client the user runs — Claude Code, Claude Desktop, third-party MCP-speaking tools. The Suite 8 IS the perimeter; the website-as-surface concern is absorbed into the MCP client layer.

This is the **Identity-as-Perimeter doctrine** in action. The Personal Suite 8 Website pathway is documented historically in the Onyx record for users who want the website variant; the canonical Advanced pathway, as of Diamond SCP-4, lands a Personal SCP Suite 8.

---

## Response Routing

| Stage | User Input | Next Action |
|-------|-----------|-------------|
| A1 | `1` (Game) | Refine game type via P2 → Stage A2 |
| A1 | `2` (Application) | Refine app type via P2 → Stage A2 |
| A1 | `3` (Personal SCP Suite 8) | Load detailed spec above → Stage A2 |
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
