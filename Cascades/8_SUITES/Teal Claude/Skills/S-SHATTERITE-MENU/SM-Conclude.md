# SM-Conclude — Per-Turn Concluder Menu Reference Design

**Menu ID**: SM-6
**Trigger**: Every turn-end that crosses the Directness Threshold (per C9 Automata)
**Suite Source**: Suite 0 Per-Turn Binding — absorb turn context · supply Summation · surface routing
**Pewter Design**: Fixed 3-5 routing rows + 2 escape rows · Pearl-compressed
**Doctrinal Source**: `.claude/CLAUDE.md` C9 Automata · *Concluder-Menu Diameter (C9 ↔ Shatterite, Suite 0 Per-Turn Binding)*

---

## Function

The Concluder of every turn before user hand-off is a Cascade halting point. SM-Conclude renders that halting point as a Conference: the menu IS the summary, expressed as Cascade-routing primitives. Single-keystroke advance to the obvious next step. Escape always available.

This is the *only* menu in the SM-* family that fires automatically — every other menu is user-invoked via slash command or selection.

---

## Fire Predicate

**SM-Conclude fires ONLY in Conference Mode** — manual user-driven dialog where the harness is awaiting user input. Automata Mode (any `/cascade:loop` iteration · autonomous gate advance · scheduled wake-up) does NOT fire SM-Conclude — the loop's own logic is the routing.

**Render SM-Conclude when ALL true**:

1. **Mode = Conference** — harness awaiting user input; no active Automata loop iteration in flight
2. The current turn produced a response (Lambda or Ego — both qualify)
3. The turn does NOT match the C9 Directness Threshold
4. The user has not opted out for the session (`[Esc]` is per-turn)

**Skip SM-Conclude when ANY true** (Directness Inheritance + Automata Inheritance):

| Class | Example | Why skip |
|---|---|---|
| **Automata-engaged turn** | `/cascade:loop` iteration, autonomous gate advance, ScheduleWakeup fire | **Mode boundary — loop's own routing is authoritative** |
| Single-line / typo | "fix the typo on line 42" | No decision space |
| Informational query | "how many lines is X?" | Terminal answer |
| Explicit instruction | "commit and push" | No decision space |
| Single-word continuation | "yes" / "no" / "ok" | No decision space |
| User invoked another menu | `/cascade`, `/cascade:hello`, etc. | Their menu wins |
| Within SM-ColorSelect | first-engagement questionnaire | Don't double-render |

**Conference-Only Fire Predicate**: the Hard Join applies to Conference Mode exclusively. If Automata surfaces a decision moment that *requires* user input (e.g., loop hits an unresolvable fork), that surfacing IS a Conference moment — Mode flips to Conference for that turn, and SM-Conclude becomes eligible again. The boundary is the *active mode*, not the *command that started the session*.

**Automata Inheritance**: parallel to Directness Inheritance — the Hard Join inherits the existing C9 Automata mode boundary. When Automata is dispatching, autonomous flow is the priority; menu rendering would block iteration with a forced AskUserQuestion. Anti-pattern: **E-Conclude-Loop-Block** (SM-Conclude renders during Automata iteration → blocks autonomous progression → /loop intent defeated).

**Concluder-Halting Invariant**: no state where Concluder fires *in Conference Mode* for non-Direct work AND SM-Conclude is absent. Failure mode = E-Conclude-Drift (silent free-text hand-off where a menu was due) → re-render the menu next turn. Invariant scoped to Conference Mode.

---

## Suite 0 Per-Turn Binding — Absorb Protocol

At turn-end, Suite 0 reads four sources:

1. **What was produced this turn** — Lambda-events fired (Write/Edit/Bash side-effects), Ego declarations made, conclusions reached, decisions adopted
2. **What's PENDING** — open forks raised in the response, Cerulean tasks not yet Done, TESTING items, deferred work
3. **Cascade Position** — current cycle, rotation, gate; active Diamond and Onyx if any
4. **What the user just decided** — last AskUserQuestion answer or last typed direction

From these four, surface the 3-5 most important *next routing decisions in Cascade primitives*.

This is the same Suite 0 mechanism as session-start Obsidian Absorb (which reads Diamond+Onyx files), exercised at a different cadence (per-turn, not per-session).

---

## Summation Parsing Rule — Cascade-Primitive Option Set

Convert turn content into menu options drawn from this vocabulary:

| Primitive | Format | Color (Suite that resolves) | Example |
|---|---|---|---|
| **Length engagement** | `[1-N] {action}` | Yellow (Architect leads) | `[1-4] Draft + Validate spec` |
| **Diamond engagement** | `[D] {action}` | Blue (Professional executes) | `[D] Engage Diamond` |
| **Opal Suite issuance** | `[N] {Suite action}` | per-Suite color | `[7] Issue Fuchsia diagnostic` |
| **Suite 8 invocation** | `[8] {Designation}` | per-Suite-8 | `[8] Pewter Tessera review` |
| **Verification** | `[V] Verify {scope}` | Green (Sculptor verifies) | `[V] Verify build output` |
| **Conference continuation** | `[C] Continue conferring` | Yellow | `[C] Resolve open forks` |
| **Direct exit** | `[Esc] Direct` | Base | persistent escape |
| **Main fallback** | `[M] Main Menu` | Base | persistent fallback |

Suite 0 selects 3-5 from the upper rows + always appends `[M]` and `[Esc]`. The first option carries `(Recommended)` if Suite 0 has a clear recommendation.

---

## Render Template

```
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
```

---

## AskUserQuestion Mapping

The menu maps to a single `AskUserQuestion` call:

| Field | Value |
|---|---|
| `question` | "How would you like to engage next in the Cascade?" |
| `header` | `Concluder` (max 12 chars) |
| `multiSelect` | `false` |
| `options` | 2-4 options drawn from Cascade-primitive vocabulary; `[M]` is one of the 4; `[Esc]` is auto-provided as Other |
| First option | Carries "(Recommended)" if Suite 0 has a clear recommendation |

The visual frame above is the conceptual rendering; the live capture mechanism is the AskUserQuestion tool. Future Claude Code versions or alternate harnesses MAY render the frame literally if their UI supports it.

---

## Diameter — SM-Conclude ↔ Other SM-* Menus

| Menu | Relationship to SM-Conclude |
|---|---|
| **SM-Main** | Static catalog · accessible via `[M]` · falls back when Summation parsing yields nothing useful |
| **SM-Index** | Routing table · SM-Conclude registered as SM-6 |
| **SM-HelloWorld** / **SM-HelloWorld-Advanced** | Tutorial flows · SM-Conclude is the ambient menu that fires *between* explicit tutorial Stages |
| **SM-Suite8** / **SM-TealClaude** / **SM-Cascade** | Sub-engagements · SM-Conclude follows their hand-offs |
| **SM-ColorSelect** | EXCEPTION — does NOT fire during ColorSelect (the questionnaire IS the conference) |
| **Diamond Menu (C5 D-O Read)** | Session-start Diamond Menu fires once at Obsidian Absorb; SM-Conclude takes over per-turn after |
| **D-Queue (TESTING)** | If TESTING items detected, D-Queue prepends; SM-Conclude still fires for the routing tail |

---

## Reciprocal Naming

This Reference Design names `.claude/CLAUDE.md` C9 Automata · *Concluder-Menu Diameter (C9 ↔ Shatterite, Suite 0 Per-Turn Binding)* as its doctrinal source. That sub-section names this file as its rendering surface. Neither subordinate; both compose.

---

*Version: 1.0 · First Diamond: I (Concluder ⊗ Shatterite Hard Join) · 2026-05-02*
