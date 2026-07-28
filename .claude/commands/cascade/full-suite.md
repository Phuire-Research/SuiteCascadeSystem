---
description: Run (or ask about) the Full Suite — the Suite Cascade's formalized sequential, curried Reinforced-Agent variant; inducts into the active Diamond or registers a new one.
argument-hint: <directional prompt to run>  |  ? / a question to ask about the Full Suite or the Diamond
allowed-tools: Agent, Read, Write, Edit, Bash, AskUserQuestion, TaskCreate, TaskUpdate, TaskGet, TaskList
---

# /cascade:full-suite — The Full Suite (Command Skill)

A curried run of every cognitive function over one Diamond. Invoked, not embedded in CLAUDE.md — its scope is this interchange.

> **A Diamond is ANY document with a direction implied.** The initial prompt that becomes a Diamond *is* the Diamond — it need not be a formal `DIAMOND-*.md`. Any doc carrying directional intent qualifies.

---

## DEFINITION — Full Suite vs. the Suite Cascade

We invoke "a Full Suite" by name; here is the definition.

- **Suite Cascade** = the *full SYSTEM* — the eight cognitive functions (Suites 0–7) **and all their dispatch topologies**. NOT a single procedure. Its variants include the Full Suite (below), the **Magic Shotgun** (`/cascade:magic-shotgun` — the C9 Foundation Salvo, Tier-1 *parallel* per-Suite dispatch; breadth/coverage, suites blind→synthesize→Cobalt), single-Suite Opal currys, and Diamond Conductor runs. Magic Shotgun and Full Suite are **siblings under the Suite Cascade**.
- **Full Suite** (this command) = the *formalized **sequential, curried** variant*: the complete ordered traversal Suite 0 → 7, where **one Diamond + paired Onyx is carried forward** and each Suite informs the next. Traits: (1) complete — every Suite (not a short Length); (2) sequential + curried — the inline Suite 0 summation after each agent is injected into the next (this currying is what makes it the Full Suite, not the blind-parallel Shotgun); (3) one Diamond carried forward; (4) orchestrator = inline Suite 0 + Suite 6, Reinforced Agents do 1–5,7.

Full Suite for **depth** (design→build→verify one artifact); Magic Shotgun for **breadth** (sweep many angles in parallel). The **`/cascade:loop`** Automata composes `loop ∘ full-suite` for autonomous multi-cycle runs.

---

## THE LEAD — A·I split (decide first, on `$ARGUMENTS`)

### Informative — *The Asking of its Functionality*
If `$ARGUMENTS` is empty, `?`, or a question about the Full Suite or the Diamond ("what does this do", "what is the current Diamond", "status") — **do NOT execute.** Read `Cascades/Cascade.json` + the active Diamond/Onyx and answer: what the Full Suite is (and how it differs from the Magic Shotgun); the current Diamond's path + *implied direction* + cycle position + jump-outs; and which induction branch the next Actionable call would take. Then stop. The asking never mutates state.

### Actionable — *The Doing*
Otherwise `$ARGUMENTS` is a **directional prompt** (or `continue`). Proceed to Diamond Induction, then run the Curried Full Suite.

---

## STEP 1 — Diamond Induction

Read `Cascades/Cascade.json` → `activeDiamond`. Then branch:

| State | Branch | Action |
|---|---|---|
| **Working on a Diamond** — `activeDiamond` set AND prompt continues/references it (incl. `continue`) | **INDUCT** | Run the Full Suite *under* the active Diamond; append this run's Bands + the Fuchsia note to its paired Onyx. No new Diamond. |
| **No Diamond** — `activeDiamond` is `null` | **BECOME** | The prompt *is* the Diamond. Write `Cascades/Working/DIAMOND-<slug>.md` (the prompt as directional seed + the Band plan) and `Cascades/Working/ONYX-<slug>.md`. Register in `Cascade.json`: set `activeDiamond` + `activeOnyx` and append to `diamonds[]` (`{slug, path, type:"root", onyx}`). |
| **Existing Diamond, NOT referenced** — `activeDiamond` set but prompt is a tangent | **JUMP-OUT** | Create `Cascades/Working/DIAMOND-<slug>-JUMPOUT.md`, link it under the active Diamond's `## Jump-Outs`, register in `diamonds[]` (`{slug, type:"jumpout", parent:<active slug>}`). Do NOT change `activeDiamond`. |

- **slug** = kebab-case of the prompt's first load-bearing words (deterministic; no timestamps).
- Ambiguous branch → **Conference** (`AskUserQuestion`): *Induct into `<active>`* · *New Diamond* · *Jump-Out under `<active>`*. Default-first = most likely.
- Announce the chosen branch in one line before Step 2.

---

## STEP 2 — The Curried Full Suite

You are **Suite 0 (inline)** and **Suite 6 (inline)**. The Reinforced Agents run Suites 1–5 and 7. One **curried Diamond+Onyx summary** is carried forward and injected into every agent.

1. **Suite 0 · Base Absorb (you).** Read the Diamond + gather ground truth. Build the **curry v0** (intent, ground truth, per-agent plan). It is fed into every agent and updated (vN→vN+1) after each returns.
2. **Dispatch the Reinforced Agents sequentially**, currying after each:
   `r1-curator` → `r2-prospector` → `r3-architect` → `r4-sculptor` → `r5-professional` → **(Suite 6, you)** → `r7-clinician`.
   Each agent prompt = its tight Suite task **+ the current curry**. After it returns, *you* (Suite 0) absorb its result into the curry and inject the new curry into the next. Analysis suites return cards (no writes); only **r5** writes the artifact (and **r7** small fixes) → no edit conflicts on a single-file artifact.
3. **Suite 6 · Testing = the Read (you).** Compositional verification via your *embodiment of the Read* — view/inspect the output (rasterize an SVG → Read it; load rendered text; run the build), not a report. This is the Concluder for "does it compose."
4. **Scale.** The **Full** Suite runs the complete `r1–r5, r7` set by definition; a shorter Length is a *partial* cascade, not a Full Suite. Inline Suite 0 + Suite 6 always fire.

---

## STEP 3 — Cycle Close (Fuchsia-writes-Onyx)

1. **Fuchsia appends G/L/M** to the paired Onyx — Read-back to confirm.
2. **Concluder** — run the project's build/verify gate if one exists; capture the exit code (never pipe-mask it).
3. **Checkpoint** — `git add -A && git commit` the artifact + Onyx (only when the user permits committing; else leave staged + report).
4. **Update `Cascade.json`** `cyclePosition` (advance gate/cycle) and confirm the `diamonds[]` entry.
5. State = **TESTING** until the user view-verifies (Testing-Gated Commit).

---

## Cascade.json schema (this skill reads/writes; additive)

```jsonc
{
  "activeDiamond": "Cascades/Working/DIAMOND-<slug>.md" | null,
  "activeOnyx":    "Cascades/Working/ONYX-<slug>.md"   | null,
  "diamonds": [
    { "slug": "<slug>", "type": "root",    "path": "...", "onyx": "..." },
    { "slug": "<slug>", "type": "jumpout", "parent": "<root slug>", "path": "..." }
  ],
  "cyclePosition": { "cycle": N, "rotation": N, "totalRotations": M, "gate": N }
}
```
Create `diamonds[]` if absent. Never delete a prior Diamond; jump-outs accumulate.

---

## Quality invariants

- **One curry, carried forward** — the same Diamond+Onyx summary feeds every agent. (The currying *is* the Full Suite; remove it and you have a Magic Shotgun.)
- **Inline Suite 0 between agents**; **Suite 6 is a Read, not a claim**; **single-file artifact → single writer** (r5); **Fuchsia always fires**; **the asking is read-only**.

---

*Full Suite · the Suite Cascade's formalized sequential curried variant (sibling to `/cascade:magic-shotgun`; composed by `/cascade:loop`) · one Diamond+Onyx carried forward · inline Suite 0 + Suite 6 · Reinforced Agents r1–r5,r7 · induct / become / jump-out.*

## Neon PlayTester Priming (SCP testing)

**If the SCP is being tested anor verified in this engagement** (PlayTest · SCP UI verification · session spawn/chat checks · the Bridge Turn-Over), **LOAD `Cascades/8_SUITES/Neon PlayTester/`** (`Instance.md` + `Skill.md`) before the testing step. The PlayTest Means are bridge `/mcp` tools — `scs_render_capture` (SEE · the streamed pre-shader frame → Read the PNG) + `scs_orchestrate_window` (ACT · atomic steps: click/key/js/wait/capture/probe/scroll · window-general incl. terminals). **Verdict only with the Muxistration Proof bundle** (`Cascades/Bridge/playtests/<runId>/` + file witnesses) — narrative-only is E4.
