# SM-Main — Main Menu Reference Design

**Menu ID**: SM-0
**Trigger**: Session start, `menu`, return from sub-menu
**Pewter Design**: Full spectrum — all 8 suite colors represented

---

## Menu Template

```
<AskUserQuestion>
╔══════════════════════════════════════════════════════════╗
║  SHATTERITE MENU                         {session_phase} ║
║  ── Red · Orange · Yellow · Green · Blue · Purple · Fuchsia ── ║
╠══════════════════════════════════════════════════════════╣
║                                                          ║
║  Navigate                                                ║
║  ─ · ─                                                   ║
║  [H] Hello World                     [Base]   — tutorial ║
║      /cascade:hello                                      ║
║  [S] Enter Suite 8 Registry          [Orange] — discover ║
║      /cascade:suites                                     ║
║  [C] Suite Cascade Reference         [Yellow] — design   ║
║      /cascade:reference                                  ║
║  [T] Engage Teal Claude Conductor    [Blue]   — build    ║
║      /cascade:conductor                                  ║
║                                                          ║
║  · · ·                                                   ║
║                                                          ║
║  Workspace                                               ║
║  ─ · ─                                                   ║
║  [D] Engage your Diamond             [Green]  — examine  ║
║      /cascade:diamond  {diamond_status}                  ║
║  [O] Onyx Trajectory                 [Fuchsia] — review  ║
║      /cascade:onyx     {onyx_status}                     ║
║                                                          ║
║  · · ·                                                   ║
║                                                          ║
║  System                                                  ║
║  ─ · ─                                                   ║
║  [P] Suite Color Selection           [Purple] — compose  ║
║      /cascade:colors   {color_status}                    ║
║  [X] Course Correct                  [Fuchsia] — steer   ║
║      /cascade:correct                                    ║
║  [9] Maintain the Method             [Base]   — meta     ║
║      /cascade:maintain                                   ║
║                                                          ║
║  · · ·                                                   ║
║                                                          ║
║  [Q] Exit Menu                       [Base]   — direct   ║
║                                                          ║
╚══════════════════════════════════════════════════════════╝
</AskUserQuestion>
```

---

## Dynamic Fields

| Field | Population |
|-------|-----------|
| `{session_phase}` | Current session flow phase per P8: `Opening` · `Refinement` · `Execution` · `Correction` · `Continuation` · `Close`. Inferred from Cascade.json cyclePosition + recent interaction pattern |
| `{diamond_status}` | From `Cascade.json → activeDiamond` path, or `No active Diamond` |
| `{onyx_status}` | From `Cascade.json → activeOnyx` path, or `No active Onyx` |
| `{color_status}` | `Personalized` if `colorSelectionComplete: true`, else `Not yet configured` |

---

## Response Routing

| Selection | Action |
|-----------|--------|
| **H** | Render SM-HelloWorld.md — guided tutorial, first Cascade engagement |
| **S** | Render SM-Suite8.md — "Enter Suite 8" (P3 directive) |
| **C** | Render SM-Cascade.md |
| **T** | Render SM-TealClaude.md — "Engage Teal Claude" (P3 directive) |
| **D** | Read active Diamond WorkGameBoard, present Diamond Menu (C6 format) — "Engage your Diamond" (P3 directive) |
| **O** | Read active Onyx, present Onyx summary |
| **P** | Render SM-ColorSelect.md (Suite Color Selection Questionnaire) |
| **X** | Course Correct — "We are Off Target" (P4). Pause current engagement, re-read user intent, present correction options: restart current cycle, adjust scope, or revert to prior gate |
| **9** | Meta-Cognitive System Maintenance (P9). Dispatch Cinnabar Dialectic analysis, update Suite 8 Skills, review Cascade utilization, or create new Crystraline |
| **Q** | Exit Shatterite, return to direct conversation |

---

## Command Diameter — Menu-0 → N+1

Each menu option draws a Diameter from the Main Menu (0) to its specific engagement. Verbose labels follow Suite 2 naming convention. All accessible via `/cascade:variant`.

| N | Key | Verbose Label | Command |
|---|-----|---------------|---------|
| 0 | Menu | Shatterite-Main-Conference-Render | `/cascade` |
| 1 | [H] | Hello-World-Tutorial-Onboarding | `/cascade:hello` |
| 2 | [S] | Suite-Eight-Registry-Discovery | `/cascade:suites` |
| 3 | [C] | Suite-Cascade-Reference-Architecture | `/cascade:reference` |
| 4 | [T] | Teal-Claude-Conductor-Delegation | `/cascade:conductor` |
| 5 | [D] | Diamond-WorkGameBoard-Engagement | `/cascade:diamond` |
| 6 | [O] | Onyx-Trajectory-Lambda-Review | `/cascade:onyx` |
| 7 | [P] | Suite-Color-Selection-Personalization | `/cascade:colors` |
| 8 | [X] | Course-Correct-Steering-Redirection | `/cascade:correct` |
| 9 | [9] | Method-Maintenance-Meta-Cognitive | `/cascade:maintain` |

**Muxameter**: `/cascade` (0) connects to ALL variants — it is the Conference-Render Muxameter through which every engagement can be reached.

---

## D-Queue Override

If TESTING diamonds are detected during state population, prepend a queue notice:

```
║  ⚠ TESTING QUEUE ({N} diamonds awaiting user test)      ║
║  [!] Review testing queue               [Fuchsia]        ║
```

Selection `!` renders the D-Queue (see Skill.md §D-Queue Rendering).
