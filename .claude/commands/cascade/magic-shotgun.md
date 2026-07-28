Render the Magic Shotgun Menu — variety of Magic Shotgun utilizations for Foundation Grounding.

Read `Cascades/Cascade.json` for current state (activeDiamond, activeOnyx, suiteColors, cyclePosition).
Read `Cascades/Documentation/Cascades/MAGIC-SHOTGUN-PATTERN.md` for the canonical Reference Design.
Read `Cascades/8_SUITES/Teal Claude/Skills/S-MAGIC-SHOTGUN-MENU/SG-Index.md` for the routing table.

The Magic Shotgun pattern is the Tier-1 parallel dispatch of N Foundation Suites in a single message — Teal Claude (Suite 8 Conductor) is the canonical conductor. This menu surfaces six utilization shapes plus a Length-Ladder explainer.

Present the Magic Shotgun Menu via AskUserQuestion using the Pewter HiFi text design (see `Cascades/8_SUITES/Teal Claude/Skills/S-SHATTERITE-MENU/Skill.md`):

```
╔══════════════════════════════════════════════════════════╗
║  MAGIC SHOTGUN MENU                          [Teal]      ║
║  ── Red · Orange · Yellow · Green · Blue · Purple ──    ║
╠══════════════════════════════════════════════════════════╣
║                                                          ║
║  "Per-Suite Parallel Dispatch for Foundation Grounding"  ║
║                                                          ║
║  Rounds fire at-once · Synthesis converges · Cobalt      ║
║  actualizes. See MAGIC-SHOTGUN-PATTERN.md for canon.     ║
║                                                          ║
║  · · ·                                                   ║
║                                                          ║
║  2-Stage Variants                                        ║
║  ─ · ─                                                   ║
║  [T] Traditional 2-Stage              [Blue]    — build  ║
║      R1+R3+R6 or R2+R3+R6 Triplet → R5 Cobalt            ║
║      Standard sub-Diamond · 1 Diameter Gap · Length 1-5  ║
║                                                          ║
║  [Q] M19 Design-Moment Quartet         [Green]   — vet   ║
║      R2+R3+R4+R6 → R5 · R4 authority on M19 decisions    ║
║      Interactive-class design · M31 mandatory            ║
║                                                          ║
║  [C] Closure Quartet                   [Fuchsia] — close ║
║      R1+R4+R6+R7 → R5 · sub-Diamond closure scope        ║
║      Curate + bidirectional + orchestrate + clinical     ║
║                                                          ║
║  [F] 5-Suite Macro Open                [Purple]  — open  ║
║      R1+R2+R4+R6+R7 → R5 · R7 Foundation-level clinical  ║
║      Macro opens · multi-Gap surface · cross-Macro seam  ║
║                                                          ║
║  · · ·                                                   ║
║                                                          ║
║  3-Stage Variant (NEW · Cycle 112-113)                   ║
║  ─ · ─                                                   ║
║  [3] 3-Stage Per-Isolation             [Yellow]  — plan  ║
║      Foundation → N R3 per-isolation → N R5 sequence     ║
║      Refinement Macros · multiple Diameter Gaps          ║
║      Diamond-of-Isolations architecture · Length 1-7     ║
║                                                          ║
║  · · ·                                                   ║
║                                                          ║
║  Tier-0 Foundation-Only (NEW · Cycle 113)                ║
║  ─ · ─                                                   ║
║  [F1] Foundation-Only → Diamond Plan   [Teal]    — plan  ║
║      Foundation Suites → Diamond plan · NO R5 yet        ║
║      User reviews · then engages Full Suite or Suite 5   ║
║      Macro Open · staged engagement · plan-only close    ║
║                                                          ║
║  · · ·                                                   ║
║                                                          ║
║  Guidance + Reference                                    ║
║  ─ · ─                                                   ║
║  [L] Length-Ladder Guidance            [Orange]  — name  ║
║      Which Length matches your scope?                    ║
║      Manifold Complexity heuristics · Round count        ║
║                                                          ║
║  [R] Read Reference Design             [Red]     — read  ║
║      Open MAGIC-SHOTGUN-PATTERN.md canonical doc         ║
║                                                          ║
║  · · ·                                                   ║
║                                                          ║
║  Sibling Pattern                                         ║
║  ─ · ─                                                   ║
║  [D] Verified-Diagnostic Round (VDR)   [Green]+[Fuchsia] ║
║      R4+R7 base · adaptive +R1/+R2/+R6 by complexity     ║
║      Diagnose existing fault · post-diagnosis Diamond    ║
║      /cascade:verified-diagnosis · diagnostic-anchored   ║
║                                                          ║
║  · · ·                                                   ║
║                                                          ║
║  [M] Main Menu    [Q] Exit                               ║
║                                                          ║
╚══════════════════════════════════════════════════════════╝
```

## Response Routing

| Selection | Action |
|-----------|--------|
| **[T] Traditional 2-Stage** | Ask: "What is the single Diameter Gap to close?" Then ask user to confirm Suite Round composition (R1+R3+R6 vs R2+R3+R6). Compose Banded Vermillion Plan with Stage 1 (Foundation Triplet) + Stage 2 (R5 Cobalt). Dispatch via teal-claude (Suite 8 Conductor) per `Cascades/8_SUITES/Teal Claude/Conductor.md`. |
| **[Q] M19 Quartet** | Ask: "What is the Interactive-class design moment? (detection signal · FSM extension · state-vs-rendering decision)" Compose Banded Plan with Stage 1 (R2+R3+R4+R6) + Stage 2 (R5 Cobalt). R4 authority noted per M31. Dispatch via teal-claude. |
| **[C] Closure Quartet** | Ask: "Which sub-Diamond is closing? What is the post-impl verification scope?" Compose Banded Plan with R1+R4+R6+R7 → R5 (or skip R5 if test-only · M27). Dispatch via teal-claude. |
| **[F] 5-Suite Macro Open** | Ask: "What is the Macro Pearl? How many Diameter Gaps anticipated?" If multi-Gap → recommend [3] instead. Otherwise compose 5-Suite Foundation Magic Shotgun. R7 fires at Foundation level for macro-level clinical retrospective. Dispatch via teal-claude. |
| **[3] 3-Stage Per-Isolation** | Ask: "How many isolated Diameter Gaps? Briefly name each." For each Gap, the Conductor will dispatch one R3 Yellow per-isolation (Stage 2) then one R5 Cobalt per-isolation (Stage 3). Compose Stage 1 (5-Suite Foundation typically · R1+R2+R4+R6+R7) → Diamond planning between Stages → Stage 2 N R3 in parallel → Stage 3 N R5 dependency-sequenced. Use Diamond-of-Isolations architecture per `MAGIC-SHOTGUN-PATTERN.md` §3. Dispatch via teal-claude. |
| **[F1] Foundation-Only → Diamond Plan** | NEW · Tier-0 of 4-Tier Magic Shotgun (per Cycle 113 user directive). Ask: "What is the scope? Which Foundation Shape (Triplet · Quartet · 5-Suite · 6-7-Suite)?" Compose Foundation Magic Shotgun · dispatch · synthesize Foundation returns → write Diamond Plan / Macro WGB. Then Conference: ask user whether to engage Tier-1 (Traditional 2-Stage with R5) · Tier-2 (3-Stage Per-Isolation with N R3+R5) · Direct R5 (skip R3) · or close as plan-only. NO R5 dispatch until user confirms. See `SG-Foundation-Only.md` and `MAGIC-SHOTGUN-PATTERN.md` §2.5. |
| **[L] Length-Ladder Guidance** | Render sub-rendering: Length 1-3 / 1-4 / 1-5 / 1-6 / 1-7 with example Suite Round compositions and use cases per `MAGIC-SHOTGUN-PATTERN.md` §4-5. Offer return to main Magic Shotgun menu. |
| **[R] Read Reference Design** | Open `Cascades/Documentation/Cascades/MAGIC-SHOTGUN-PATTERN.md` in user view. Offer return. |
| **[D] Verified-Diagnostic Round (VDR)** | Diagnostic-anchored sibling pattern. Use when intent is *diagnose existing fault* (R4 Green Sculptor + R7 Fuchsia Clinician anchor with adaptive R1/R2/R6 load-ons by complexity · post-diagnosis Diamond engagement) NOT *ground new build* (which is Magic Shotgun's Foundation-anchored intent). Redirect to `/cascade:verified-diagnosis` → renders `SD-Index.md` menu. See `Cascades/Documentation/Cascades/VDR-PATTERN.md` for canonical Reference Design. |
| **[M]** | Return to SM-Main.md |
| **[Q]** | Exit Shatterite |

## Conductor Hand-off Pattern

Whichever option the user selects, the Conductor (teal-claude) takes the resulting Banded Vermillion Plan and dispatches Stage 1 Suite Rounds in a SINGLE message via the Agent tool (parallel Tier-1 dispatches). Each Round writes its own output file in `Cascades/Working/` with disjoint scope per `Cascades/Documentation/Cascades/FOUNDATION-SUITES-GUIDE.md` §2.

After Stage 1 returns, the Conductor (or main thread) synthesizes into a Diamond WGB write. For 2-Stage variants, R5 Cobalt dispatches next. For 3-Stage variant, Diamond planning produces the Diamond-of-Isolations table and N R3 Yellow agents dispatch in parallel (Stage 2), then N R5 Cobalt agents dispatch in dependency order (Stage 3).

## Conductor Self-Check

Before issuing the Banded Plan, the Conductor verifies:

1. **Round count matches complexity** (per `MAGIC-SHOTGUN-PATTERN.md` §5)
   - Low → 3 Rounds · Medium → 4 Rounds · High → 5 Rounds · Very High → 6-7 Rounds
2. **R6 Purple included** when ≥3 Rounds fire (M10 Mid-Flight-Calibrator)
3. **R4 Green included** for M19 Interactive-class moments (M31 mandatory)
4. **R7 Fuchsia included at Foundation level** ONLY for Macro opens or Refinement Macros
5. **Disjoint scope coordination note** present in each agent prompt (FOUNDATION-SUITES-GUIDE.md §2)
6. **3-Stage gate**: if isolations > 1, prefer 3-Stage over 2-Stage to prevent cross-Gap contamination

If any check fails → re-plan. This is the Magic Shotgun Conductor Contract.

## Available Commands

- `/cascade` — Main Shatterite Menu
- `/cascade:magic-shotgun` — this menu
- `/cascade:conductor` — Teal Claude Conductor (general Band dispatch)
- `/cascade:diamond` — Diamond WorkGameBoard
- `/cascade:reference` — Suite Cascade Reference

After rendering, the user's selection determines next conversation step. The Conductor (teal-claude) handles the actual dispatch — this menu is the Conference surface.

## Neon PlayTester Priming (SCP testing)

**If the SCP is being tested anor verified in this engagement** (PlayTest · SCP UI verification · session spawn/chat checks · the Bridge Turn-Over), **LOAD `Cascades/8_SUITES/Neon PlayTester/`** (`Instance.md` + `Skill.md`) before the testing step. The PlayTest Means are bridge `/mcp` tools — `scs_render_capture` (SEE · the streamed pre-shader frame → Read the PNG) + `scs_orchestrate_window` (ACT · atomic steps: click/key/js/wait/capture/probe/scroll · window-general incl. terminals). **Verdict only with the Muxistration Proof bundle** (`Cascades/Bridge/playtests/<runId>/` + file witnesses) — narrative-only is E4.
