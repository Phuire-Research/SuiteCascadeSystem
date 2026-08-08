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
║  [I] {scp_menu_label}                {scp_menu_color} — {scp_menu_verb} ║
║      /cascade:scp      {scp_menu_status}                 ║
║  [H] Hello World                     [Base]   — tutorial ║
║      /cascade:hello                                      ║
║  [A] Advanced Hello World            [Orange] — aspire   ║
║      /cascade:advanced                                   ║
║  {nav_suite8_slot}                                       ║
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
║  {system_slot_p_or_s}                                    ║
║  [X] Course Correct                  [Fuchsia] — steer   ║
║      /cascade:correct                                    ║
║  [9] Maintain the Method             [Base]   — meta     ║
║      /cascade:maintain                                   ║
║  [U] Update SCS                      [Yellow] — update   ║
║      /cascade:update                                     ║
║  [V] Verify SCS installation         [Green]  — verify   ║
║      /cascade:verify                                     ║
║  [N] Changelog                       [Yellow] — recent   ║
║      /cascade:changelog                                  ║
║                                                          ║
║  · · ·                                                   ║
║                                                          ║
║  [Q] Exit Menu                       [Base]   — direct   ║
║                                                          ║
╚══════════════════════════════════════════════════════════╝
</AskUserQuestion>
```

**Diamond η · Recommended First Option**: `[I] Install SCP` is the **recommended first option** in the AskUserQuestion narrowed surface when `anyScpsInstalled === false`. Hello World becomes secondary recommendation. When `anyScpsInstalled === true`, `[I] Open SCP Menu` remains visible but the recommended-first slot may rotate to whatever the user's current workspace context suggests (active Diamond · Onyx review · etc.).

---

## Dynamic Fields

| Field | Population |
|-------|-----------|
| `{session_phase}` | Current session flow phase per P8: `Opening` · `Refinement` · `Execution` · `Correction` · `Continuation` · `Close`. Inferred from Cascade.json cyclePosition + recent interaction pattern |
| `{diamond_status}` | From `Cascade.json → activeDiamond` path, or `No active Diamond` |
| `{onyx_status}` | From `Cascade.json → activeOnyx` path, or `No active Onyx` |
| `{color_status}` | `Personalized` if `colorSelectionComplete: true`, else `Not yet configured` |

### Diamond η · CSPMSR (SCP Menu Slot · Install ↔ Open swap)

Source-of-truth: `Cascades/SCPs.json` read at render time. `anyScpsInstalled = (scps array length > 0)`.

| State | `{scp_menu_label}` | `{scp_menu_color}` | `{scp_menu_verb}` | `{scp_menu_status}` |
|-------|--------------------|--------------------|--------------------|---------------------|
| `anyScpsInstalled === false` | `Install SCP` | `[Orange]` | `install` | `No SCPs installed yet` |
| `anyScpsInstalled === true` | `Open SCP Menu` | `[Blue]` | `manage` | `{N} SCPs registered` (where N is the count) |

Both states route to `/cascade:scp` (single slash command · SM-SCP.md branches internally).

### Diamond η · CSSER (Color Selection ↔ Suite 8 Registry slot economy)

Source-of-truth: `Cascade.json → colorSelectionComplete`. Two affected slots: Navigate's `{nav_suite8_slot}` and System's `{system_slot_p_or_s}`.

| `colorSelectionComplete` | `{nav_suite8_slot}` (Navigate) | `{system_slot_p_or_s}` (System) |
|--------------------------|--------------------------------|---------------------------------|
| `false` (default · fresh install) | *hidden — Suite 8 Registry deferred until colors chosen* | `[P] Suite Color Selection           [Purple] — compose` <br> `    /cascade:colors   Not yet configured` |
| `true` (post-personalization) | `[S] Enter Suite 8 Registry          [Orange] — discover` <br> `    /cascade:suites` | `[S] Enter Suite 8 Registry          [Orange] — discover` <br> `    /cascade:suites   Suite 8s ready` |

Slot economy rationale (GCSEP pattern): pre-personalization, the user is funneled toward Color Selection as the personalization gate. Post-personalization, Suite 8 Registry replaces it AND becomes available in Navigate. No state has BOTH Color Selection and Suite 8 Registry duplicated.

---

## Response Routing

| Selection | Action |
|-----------|--------|
| **I** | Diamond η CSPMSR · Render SM-SCP.md — branches internally on `anyScpsInstalled`: false → Stage I (Install SCP / AISIS sequence mirrors `scs scp install`) · true → Top-level SCP Menu (List · Install Another · Migrate · Deploy · Retire · Adapt · Turnover) |
| **H** | Render SM-HelloWorld.md — guided tutorial, first Cascade engagement |
| **A** | Render SM-HelloWorld-Advanced.md — Multi-Diamond Aspiration Loop (Game / Application / Personal SCP Suite 8 / Custom) |
| **S** | Render SM-Suite8.md — "Enter Suite 8" (P3 directive) · only available when `colorSelectionComplete: true` |
| **C** | Render SM-Cascade.md |
| **T** | Render SM-TealClaude.md — "Engage Teal Claude" (P3 directive) |
| **D** | Read active Diamond WorkGameBoard, present Diamond Menu (C5 format) — "Engage your Diamond" (P3 directive) |
| **O** | Read active Onyx, present Onyx summary |
| **P** | Render SM-ColorSelect.md (Suite Color Selection Questionnaire) · only available when `colorSelectionComplete: false` (CSSER swap) |
| **X** | Course Correct — "We are Off Target" (P4). Pause current engagement, re-read user intent, present correction options: restart current cycle, adjust scope, or revert to prior gate |
| **9** | Meta-Cognitive System Maintenance (P9). Dispatch Cinnabar Dialectic analysis, update Suite 8 Skills, review Cascade utilization, or create new Crystraline |
| **U** | Update SCS — clone upstream, diff, selective merge, checkpoint, restart |
| **V** | Verify SCS — Suite 4 Sculptor examines Ego (Diamond) vs Lambda (output); Suite 6 routes resolution |
| **N** | Changelog — view rotating capped log of recent SCS changes; surface Maintenance Reminder; flag rotation if over cap |
| **R** | (Diamond η URWVE absorbed) · alias of `[I]` route · maintained for `/cascade:scp` slash-command stability |
| **Q** | Exit Shatterite, return to direct conversation |

---

## Command Diameter — Menu-0 → N+1

Each menu option draws a Diameter from the Main Menu (0) to its specific engagement. Verbose labels follow Suite 2 naming convention. All accessible via `/cascade:variant`.

| N | Key | Verbose Label | Command |
|---|-----|---------------|---------|
| 0 | Menu | Shatterite-Main-Conference-Render | `/cascade` |
| 1 | [I] | SCP-Install-or-Open-Menu (CSPMSR) | `/cascade:scp` |
| 2 | [H] | Hello-World-Tutorial-Onboarding | `/cascade:hello` |
| 3 | [A] | Advanced-Hello-World-Multi-Diamond-Aspiration | `/cascade:advanced` |
| 4 | [S] | Suite-Eight-Registry-Discovery (CSSER · post-colors) | `/cascade:suites` |
| 5 | [C] | Suite-Cascade-Reference-Architecture | `/cascade:reference` |
| 6 | [T] | Teal-Claude-Conductor-Delegation | `/cascade:conductor` |
| 7 | [D] | Diamond-WorkGameBoard-Engagement | `/cascade:diamond` |
| 8 | [O] | Onyx-Trajectory-Lambda-Review | `/cascade:onyx` |
| 9 | [P] | Suite-Color-Selection-Personalization (CSSER · pre-colors) | `/cascade:colors` |
| 10 | [X] | Course-Correct-Steering-Redirection | `/cascade:correct` |
| 11 | [9] | Method-Maintenance-Meta-Cognitive | `/cascade:maintain` |
| 12 | [U] | SCS-Repository-Update-Selective-Merge | `/cascade:update` |
| 13 | [V] | SCS-Verification-Sculptor-Orchestrator-Resolution | `/cascade:verify` |
| 14 | [N] | Changelog-Rotating-Capped-Recent-Changes | `/cascade:changelog` |

**Muxameter**: `/cascade` (0) connects to ALL variants — it is the Conference-Render Muxameter through which every engagement can be reached.

---

## D-Queue Override

If TESTING diamonds are detected during state population, prepend a queue notice:

```
║  ⚠ TESTING QUEUE ({N} diamonds awaiting user test)      ║
║  [!] Review testing queue               [Fuchsia]        ║
```

Selection `!` renders the D-Queue (see Skill.md §D-Queue Rendering).
