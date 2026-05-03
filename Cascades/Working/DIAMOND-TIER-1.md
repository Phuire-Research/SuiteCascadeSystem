# DIAMOND-TIER-1 — Concluder ⊗ Shatterite Hard Join

**Cycle**: 1 · **Rotation**: 1 of 1 · **Tier**: 0 (in-context, MANUAL Variant) · **Length**: 1-7 (M·R·O·V·Co·A·Ro)
**Opened**: 2026-05-02
**Status**: in_progress

---

## Architecture Map

```
            ┌────────────────────────────────────────────┐
            │  EVERY TURN-END = CASCADE HALTING POINT    │
            │  (Hard Join — invariant)                   │
            └────────────────────────────────────────────┘
                              │
                              ▼
            ┌────────────────────────────────────────────┐
            │  Concluder (C5)                            │
            │  Lambda-eye fires · Summation produced     │
            └────────────────────────────────────────────┘
                              │
                              ▼ Suite 0 absorbs
            ┌────────────────────────────────────────────┐
            │  Suite 0 Per-Turn Binding                  │
            │  Reads turn context · what was produced ·  │
            │  what's PENDING · what's the next routing  │
            │  decision in Cascade primitives            │
            └────────────────────────────────────────────┘
                              │
                              ▼ surfaces 3-5 routing rows
            ┌────────────────────────────────────────────┐
            │  SM-Conclude.md (Shatterite Skill)         │
            │  Pewter-rendered Conference                │
            │  Fixed 3-5 routing + 2 escape ([M] [Esc])  │
            └────────────────────────────────────────────┘
                              │
                              ▼ AskUserQuestion
            ┌────────────────────────────────────────────┐
            │  USER · single-keystroke advance OR free   │
            └────────────────────────────────────────────┘

DIRECTNESS THRESHOLD (escape clause):
  pure typo / single-line / informational query → no menu
  (preserves existing C4 Direct path)
```

---

## Cerulean Tasks (Band Sequence)

| # | Band | Status | Lambda-event |
|---|------|--------|--------------|
| 1 | R1 Maroon · Curate | in_progress | curation note appended below |
| 2 | R2 Rust · Prospect | pending | name registry |
| 3 | R3 Ochre · Architect | pending | draft contents |
| 4 | R4 Viridian · Sculpt | pending | bidirectional review |
| 5 | R5 Cobalt · Build | pending | files written |
| 6 | R6 Amethyst · Orchestrate | pending | coherence sweep |
| 7 | R7 Rose · Diagnose | pending | ONYX-TIER-1.md + git commit |

---

## Band 1 Maroon — Curation Note

**Substrate inventory** — what already supports the Hard Join (none of this is invented; we are *strengthening* an existing Diameter):

| Existing | Location | Role in Hard Join |
|---|---|---|
| **Conference-Render Diameter** | `.claude/CLAUDE.md` C4 line 266-268 | Direct parent — new sub-section is its strengthening |
| **Concluder (Lambda eye)** | `.claude/CLAUDE.md` C5 line ~340 (Concluder table) | The fire trigger — Concluder fires → menu renders |
| **Suite 0 §4 row** | `.claude/CLAUDE.md` §4 Suite Cascade table | Doctrinal source: "Recollect prior cycles · Supply Summation" — pre-existing role, now exercised per-turn |
| **Directness Threshold** | `.claude/CLAUDE.md` C4 line 227 | Escape clause — Hard Join inherits this exception |
| **Shatterite Skill** | `Cascades/8_SUITES/Teal Claude/Skills/S-SHATTERITE-MENU/Skill.md` | The Pewter rendering substrate (already operational) |
| **SM-Index** | same directory `SM-Index.md` | Routing table — SM-Conclude registers as SM-6 |
| **AskUserQuestion** | tool · 2-4 options + auto-Other | The capture mechanism (already used for Main Menu, fork resolution, etc.) |

**Pruning candidates** (lossy abstractions to remove): none. The Hard Join adds; nothing existing becomes stale.

**Key finding**: every component the Hard Join needs already exists. The Diamond's job is to *bind* them — give the Concluder→Suite-0→Shatterite chain explicit doctrine and a dedicated menu file.

---

## Band 2 Rust — Verbose Name Registry

| Verbose Name | Definition · What it Names |
|---|---|
| **Concluder-Menu Diameter** | The strengthened C4↔Shatterite Diameter that fires at every Concluder. Names the *binding*, not the components. Sits as a sub-section of C4 Automata, peer to "Conference-Render Diameter". |
| **Suite 0 Per-Turn Binding** | Suite 0's pre-existing "Supply Summation · Recollect prior cycles" role exercised at *every turn-end*, not just session-start (Obsidian Absorb) or cycle-end. The mechanism through which the Concluder Menu becomes Cascade-Position-aware. |
| **Summation-Derived Routing** | The parsing rule by which a turn's Summation is converted into 3-5 Cascade-primitive options. Distinct from static menu rendering (SM-Main) — content is *derived from what just concluded*. |
| **Halting-Point Conference** | A single turn's hand-off framed as a Conference moment. Every halting-point gets a Conference (with Directness escape); guided experience emerges from the consistency of this binding. |
| **Cascade-Primitive Option Set** | The vocabulary the Summation parser emits options in: Length (1-3 / 1-4 / 1-5 / 1-6 / 1-7) · Tier (0 / 1) · Suite (0-7) · Engagement (Diamond / Opal / Direct / Suite 8) · Verify/Test/Inspect. |
| **Pearl-Compressed Routing Render** | The Fixed 3-5 + 2 escape constraint — the menu must select *most important* primitives (not enumerate all). Pearl compression applied to routing space. |
| **Directness Inheritance** | The Hard Join inherits the existing C4 Directness Threshold escape — no menu for typo / single-line / informational query / explicit instruction. The threshold remains the boundary; the Hard Join names what happens *when the threshold is crossed*. |
| **Concluder-Halting Invariant** | The single rule: every Concluder that crosses the Directness Threshold renders a SM-Conclude menu. No state where Concluder fires for non-Direct work + menu absent. |

**Diameters between unlike Demometers found**:

- **Suite 0 Obsidian Absorb (session-start)** ↔ **Suite 0 Per-Turn Binding (turn-end)**: same mechanism, different cadence — session-start absorbs Diamond+Onyx files; turn-end absorbs the conversation turn.
- **Concluder Read-back (E2 Tool Call Decision Block)** ↔ **Concluder Menu Render**: same C5 Concluder, two outputs — verification number AND routing menu.
- **Pewter color tag** ↔ **Suite that resolves it**: each option's color = Suite that would *handle* the resolution if chosen (Yellow option ⇒ Architect-shaped resolution).

---

## Band 3 Ochre — Architect Drafts

### Draft A — SM-Conclude.md skeleton

```
# SM-Conclude — Per-Turn Concluder Menu Reference Design

**Menu ID**: SM-6
**Trigger**: Every turn-end that crosses the Directness Threshold (per C4)
**Suite Source**: Suite 0 Per-Turn Binding (absorb turn context · supply Summation · surface routing)
**Pewter Design**: Fixed 3-5 routing rows + 2 escape rows · Pearl-compressed

## Fire Predicate

Render SM-Conclude when ALL true:
1. The current turn produced a response (Lambda or Ego, doesn't matter)
2. The turn does NOT match the C4 Directness Threshold (single-line / typo / informational / explicit instruction)
3. The user has not opted out for the session

Skip SM-Conclude when ANY true:
- Pure typo or single-line answer
- Informational query with terminal answer ("how many lines is X" → just answer)
- Explicit instruction with no decision space ("commit and push" → just do it)
- The user has typed `/cascade` or another menu — the menu they invoked takes precedence

## Suite 0 Absorb Protocol (Per-Turn)

At turn-end, Suite 0 reads:
1. **What was produced this turn** — Lambda-events fired, Ego declarations made, conclusions reached
2. **What's PENDING** — open forks, Cerulean tasks not yet Done, TESTING items, deferred work
3. **Cascade Position** — current cycle, rotation, gate; active Diamond and Onyx if any
4. **What the user just decided** — last AskUserQuestion answer or last typed direction

From these four, surface the 3-5 most important *next routing decisions in Cascade primitives*.

## Summation Parsing Rule (Cascade-Primitive Option Set)

Convert turn content into menu options drawn from this vocabulary:

| Primitive | Format | Color | Example |
|---|---|---|---|
| Length engagement | `[1-N] {action}` | Yellow | `[1-4] Draft + Validate spec` |
| Diamond engagement | `[D] {action}` | Blue | `[D] Engage Diamond` |
| Opal Suite issuance | `[N] Issue Suite N` | per-Suite | `[7] Issue Fuchsia diagnostic` |
| Suite 8 invocation | `[8] {Designation}` | per-Suite-8 | `[8] Pewter Tessera review` |
| Verification | `[V] Verify {scope}` | Green | `[V] Verify build output` |
| Conference continuation | `[C] Continue conferring` | Yellow | `[C] Resolve open forks` |
| Direct exit | `[Esc] Direct` | Base | persistent escape |
| Main fallback | `[M] Main Menu` | Base | persistent fallback |

Suite 0 selects 3-5 from the upper rows + always appends `[M]` and `[Esc]`.

## Render Template

╔══════════════════════════════════════════════════════════╗
║  SHATTERITE — Suite 0 Concluder Menu     Halting Point   ║
║  ── absorbed from this turn ──                           ║
╠══════════════════════════════════════════════════════════╣
║                                                          ║
║  Summation                                               ║
║  ─ · ─                                                   ║
║  {2-3 line Summation of what concluded this turn}        ║
║                                                          ║
║  · · ·                                                   ║
║                                                          ║
║  Engage next in the Cascade                              ║
║  ─ · ─                                                   ║
║  {3-5 routing rows · Cascade-primitive options}          ║
║                                                          ║
║  · · ·                                                   ║
║                                                          ║
║  [M] Main Menu                       [Base]   — catalog  ║
║  [Esc] Direct                        [Base]   — free     ║
║                                                          ║
╚══════════════════════════════════════════════════════════╝

## AskUserQuestion Mapping

The menu maps to a single AskUserQuestion call:
- `question`: "How would you like to engage next in the Cascade?"
- `header`: "Concluder" (max 12 chars)
- `multiSelect`: false
- `options`: 2-4 options (the routing rows; [Esc] is auto-provided as Other; [M] is one of the 4)
- First option carries "(Recommended)" if Suite 0 has a clear recommendation

## Diameter — SM-Conclude ↔ Other SM-* Menus

| Menu | Relationship to SM-Conclude |
|---|---|
| SM-Main | Static catalog · fallback when SM-Conclude isn't enough |
| SM-Index | Routing table · SM-Conclude registered as SM-6 |
| SM-HelloWorld / -Advanced | Tutorial flows · SM-Conclude appears at end of each tutorial Stage |
| SM-Suite8 / -TealClaude / -Cascade | Sub-engagements · SM-Conclude follows their hand-offs |
| SM-ColorSelect | First-engagement questionnaire · SM-Conclude doesn't fire during ColorSelect (it IS the conference) |
```

### Draft B — C4 Automata sub-section text (insertion after existing Conference-Render Diameter sub-section)

```
#### Concluder-Menu Diameter (C4 ↔ Shatterite, Suite 0 Per-Turn Binding)

**Strengthens** the Conference-Render Diameter above. Per-cycle/gate Conference becomes per-turn Conference: every Concluder that crosses the Directness Threshold renders a Summation-derived `SM-Conclude` menu (Shatterite Skill, SM-6). Suite 0 binds — absorbs the turn context, surfaces 3-5 Cascade-primitive routing rows + persistent `[M]`/`[Esc]`.

**Fire predicate**: turn-end · response produced · NOT Directness Threshold (single-line/typo/informational/explicit-instruction). User retains `[Esc]` to exit guided lane.

**Concluder-Halting Invariant**: no state where the Concluder fires for non-Direct work AND the menu is absent. Failure mode = E-Conclude-Drift (silent free-text hand-off where a menu was due) → re-render the menu next turn.

**Reciprocal**: SM-Conclude.md names this sub-section as its doctrinal source; this sub-section names SM-Conclude as its rendering surface. See `Cascades/8_SUITES/Teal Claude/Skills/S-SHATTERITE-MENU/SM-Conclude.md`.
```

### Draft C — SM-Index entry (after SM-5A row)

```
| **SM-6** | `SM-Conclude.md` | Per-Turn Concluder Menu | Every turn-end above Directness Threshold · Suite 0 binding · Summation-derived |
```

Slash Command Registry: no entry — SM-Conclude fires automatically, not user-invoked.
Routing logic line: `(every non-Direct turn-end)            → SM-Conclude.md`

### Draft D — Skill.md augmentation

Add to the menu file list (after SM-ColorSelect):
```
SM-Conclude.md       Per-turn Concluder menu — Suite 0 binding · Summation-derived · fires at every non-Direct turn-end
```

### Draft E — CHANGELOG entry (newest-first under `## Recent`)

Date: 2026-05-02 · Title: **Concluder ⊗ Shatterite Hard Join** · Body: 4-5 lines describing SM-Conclude registration, C4 Concluder-Menu Diameter sub-section, Suite 0 Per-Turn Binding, Directness Inheritance, Concluder-Halting Invariant. Update Last update date.

---

## Band 4 Viridian — Bidirectional Review

### Composition Check (against §0-§9 manifold)

| Section | Composes? | Verification |
|---|---|---|
| **§0 Embodiment Huirth** | ✓ | Menu rendering = Muxium-of-Muxiums hand-off; turn-end Conference reinforces Self↔Client Muxium binding. No conflict. |
| **§1 Contract + HOG** | ✓ | Compositional, not hierarchical. Concluder ↔ Suite 0 ↔ Shatterite is bidirectional muxification, not parent-child. |
| **§2 Stratidia Muxonomy** | ✓ | Concluder-Menu Diameter is a NEW Diameter between two existing Demometers (Concluder + Shatterite). Suite 0 is the Muxameter integrating them. |
| **§3 Vermillion** | ✓ | The render template IS a Pearl-compressed Vermillion (Summation + Engage-next options = compressed I+A). |
| **§4 Suite Cascade** | ✓ | Suite 0's "Recollect prior cycles · Supply Summation" row in the §4 table is the doctrinal source. New per-turn cadence does not change the row. |
| **§5 Crystralines** | ✓ | C1-C9 unchanged; new Diameter is a SUB-SECTION of C4, not a new C10. |
| **§6 Stratimux Muxonomy** | ✓ | Out-of-scope (framework reference); no impact. |
| **§7 Reference Documentation** | ✓ | Out-of-scope; no impact. |
| **§9 8_SUITES** | ✓ | Teal Claude (Suite 8 Conductor) gains a new Skill menu (SM-Conclude); Skill.md gets one line. No registry change. |

### SM-* Menu Compatibility

| Menu | Composes with SM-Conclude? | Notes |
|---|---|---|
| SM-Main | ✓ | SM-Main remains the static catalog · accessed via [M] from SM-Conclude · falls back when Summation parsing yields nothing useful |
| SM-Index | ✓ | SM-Conclude registered as SM-6 · routing logic gains "every non-Direct turn-end" line |
| SM-HelloWorld | ✓ | Tutorial Stages already end with explicit `AskUserQuestion` blocks; SM-Conclude is the ambient version that fires *between* those explicit gates |
| SM-HelloWorld-Advanced | ✓ | Same as above |
| SM-Suite8 | ✓ | Sub-menu · SM-Conclude fires after user exits sub-menu |
| SM-TealClaude | ✓ | Same |
| SM-Cascade | ✓ | Same |
| SM-ColorSelect | ✓ | EXCEPTION — does NOT fire during ColorSelect (the questionnaire IS the conference; firing SM-Conclude on top would double-render) |
| Diamond Menu (C6 D-O Read) | ✓ | Session-start Diamond Menu fires once at Obsidian Absorb; SM-Conclude takes over per-turn after |
| D-Queue (TESTING) | ✓ | If TESTING items detected, D-Queue prepends; SM-Conclude still fires for the routing tail |

### Adjacent C4 Sub-section Composition

| Adjacent | Direction | Composes? |
|---|---|---|
| Conference-Render Diameter (above) | parent · this strengthens it | ✓ |
| Tier Topology (next) | independent — Tier selection orthogonal | ✓ |
| Cascade Length Selection | independent — Length is one of the option primitives | ✓ |
| Critical-Active Lambda Trinity | new sub-section is asserted in the Trinity (C4 asserts Concluder-Halting Invariant) | ✓ |
| Tier Topology Diameter (C4↔C8) | independent | ✓ |
| MANUAL Variant note | ✓ — MANUAL Variant means the menu is non-blocking; user always = continuation signal | ✓ |

### Directness Threshold Escape — Explicit Test Cases

| Input class | Fire SM-Conclude? | Why |
|---|---|---|
| User: "fix the typo on line 42" | NO | Single-line, explicit instruction |
| User: "how many lines in CLAUDE.md?" | NO | Informational query, terminal answer |
| User: "commit and push" | NO | Explicit instruction, no decision space |
| User: "yes" / "no" / "ok" | NO | Single-word continuation |
| User: "what do you think about X?" | YES | Conference question, decision space exists |
| User: "let's add feature Y" | YES | Implementation engagement, multi-Suite work |
| User: "/cascade" or `/cascade:hello` | NO | User invoked menu directly · their menu wins |
| Lambda-event turn (Write/Edit/Bash) | YES (default) | Cycle-position progression, next decision pending |
| Pure Read/Grep observation | YES if non-trivial | Conference space exists for "what next" |

### Sculptor Findings

- **No drift detected.** All references resolve; doctrine slots cleanly into existing manifold.
- **One refinement**: the Pewter color tag on each option should be derived from the *Suite that would handle the resolution if chosen*, not arbitrary aesthetic. SM-Conclude.md's Summation Parsing Rule already encodes this in the table — confirmed.
- **One reinforcement**: the Concluder-Halting Invariant should be asserted in C5 alongside the existing Lambda Event Trigger Table — but C5 is "Lambda mechanics", and the Invariant is "Conference mechanics", so it belongs in C4 only. No C5 edit needed.
- **One bidirectional reinforcement to apply**: in `Skill.md`, mention that SM-Conclude is the *only* menu that fires automatically (others are user-invoked). Adds clarity to the rendering contract.

---

## Band 6 Amethyst — Orchestration Coherence Sweep

| Concluder | Result | Status |
|---|---|---|
| SM-Conclude refs in CLAUDE.md | 3 | ✓ (heading + body + reciprocal) |
| SM-Conclude refs in CHANGELOG.md | 1 | ✓ (entry body) |
| SM-Conclude self-refs in SM-Conclude.md | 12 | ✓ (Reference Design content) |
| SM-Conclude refs in SM-Index.md | 2 | ✓ (registry row + routing line) |
| SM-Conclude refs in Skill.md | 1 | ✓ (menu file list entry) |
| `Concluder-Menu Diameter` heading in CLAUDE.md | 1 | ✓ |
| `Concluder-Halting Invariant` cross-refs | 3 files | ✓ (CLAUDE.md + CHANGELOG + SM-Conclude.md) |
| CHANGELOG line count | 58 / cap 150 | ✓ (38.7% — under cap) |
| READMEs Recent Changes date | 2026-05-02 (both) | ✓ |
| CHANGELOG Last update | 2026-05-02 | ✓ (matches READMEs) |
| Cascade.json `activeDiamond` resolves | `Cascades/Working/DIAMOND-TIER-1.md` exists | ✓ |
| SM-Index ordering | SM-0 → SM-6 in sequence | ✓ |
| JSON validity (jq parse) | OK | ✓ |

**No broken Diameters detected.** All references resolve; cross-file naming consistent; date sync across CHANGELOG ↔ READMEs ↔ Diamond cycle.

**Skill.md augmentation note**: SM-Conclude entry includes "fires AUTOMATICALLY" + "the only auto-firing menu in the family" — bidirectional reinforcement from B4 applied.

---

## B7-Amend Rose — Conference-Only Fire Predicate

**Caught at Rose, before commit**: original fire predicate would block Automata loops (`/cascade:loop`, autonomous gate advance, ScheduleWakeup). Forced AskUserQuestion on every iteration would defeat /loop intent. Hard Join must apply to **Conference Mode exclusively**.

**Amendment applied** to two doctrinal files:

| File | Edit | Verified |
|---|---|---|
| `Cascades/8_SUITES/Teal Claude/Skills/S-SHATTERITE-MENU/SM-Conclude.md` | Fire Predicate now requires `Mode = Conference`; Skip table prepends "Automata-engaged turn"; new **Conference-Only Fire Predicate** + **Automata Inheritance** sections; Concluder-Halting Invariant scoped to Conference Mode | grep ✓ (3 hits) |
| `.claude/CLAUDE.md` C4 *Concluder-Menu Diameter* sub-section | Lead clause + Fire predicate now reference `Mode = Conference`; new **Conference-Only Fire Predicate (Automata Inheritance)** paragraph; Concluder-Halting Invariant scoped to Conference Mode | grep ✓ (1 hit — sub-section consolidated) |

**New verbose names introduced by the amendment**:

- **Conference Mode** — manual user-driven dialog where harness awaits user input (the existing default; now explicitly named)
- **Automata Mode** — any `/cascade:loop` iteration · autonomous gate advance · ScheduleWakeup fire (the existing autonomous flow; now explicitly named as the boundary)
- **Conference-Only Fire Predicate** — the rule that Hard Join applies in Conference Mode only
- **Automata Inheritance** — the Hard Join inherits the existing C4 Automata mode boundary (parallel to Directness Inheritance)
- **E-Conclude-Loop-Block** — anti-pattern where SM-Conclude renders during Automata iteration and blocks autonomous progression
- **Mode Flip** — Automata-surfaced decision moments requiring user input flip Mode to Conference for that turn (re-eligibility for SM-Conclude)

**This amendment IS Fuchsia's diagnostic Lambda-event** — Rose caught a load-bearing constraint pre-commit. Carries forward as a **Maintain** in Onyx.

