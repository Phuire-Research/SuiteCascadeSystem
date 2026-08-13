# SM-Suite8 — Suite 8 Registry Menu Reference Design

**Menu ID**: SM-1
**Trigger**: Suite 8 engagement, `suite 8`, create/dispatch/manage
**Pewter Design**: Orange spectrum — prospecting and discovery of Suite 8 landscape

---

## Menu Template

```
<AskUserQuestion>
╔══════════════════════════════════════════════════════════╗
║  SUITE 8 REGISTRY                           [Orange]     ║
║  ── Orange · Orange · Orange · Orange · Orange · Orange ── ║
╠══════════════════════════════════════════════════════════╣
║                                                          ║
║  Registered Suite 8s                                     ║
║  ─ · ─                                                   ║
{suite8_entries}
║                                                          ║
║  · · ·                                                   ║
║                                                          ║
║  "Enter Suite 8" — Actions                               ║
║  ─ · ─                                                   ║
║  [E] Engage Suite 8                  [Blue]   — dispatch ║
║      "Use [Suite 8] with a Focus on [task]"              ║
║  [C] Actualize New Suite 8           [Green]  — create   ║
║      /cascade:create — Full Suite via Teal Claude + RI   ║
║  [N] Create from Existing Prompt     [Yellow] — design   ║
║      Such Becomes a Part of the Registry                 ║
║                                                          ║
║  · · ·                                                   ║
║                                                          ║
║  Maintain Suite 8s                                       ║
║  ─ · ─                                                   ║
║  [U] Update Suite 8 Skills           [Red]    — curate   ║
║      Dispatch maintenance cycle for a Suite 8            ║
║      Read → Execute domain work → Conference Decide →    ║
║      Update Skill(s) / Create new / None → S8AT          ║
║  [R] Curate Registry                 [Red]    — curate   ║
║      Wherein: prune, update, review existing Suite 8s    ║
║  [A] Analyze Prompting Patterns      [Fuchsia] — meta   ║
║      Dispatch Cinnabar Dialectic for utilization audit    ║
║                                                          ║
║  · · ·                                                   ║
║                                                          ║
║  [M] Main Menu    [Q] Exit                               ║
║                                                          ║
╚══════════════════════════════════════════════════════════╝
</AskUserQuestion>
```

---

## Dynamic Fields

### `{suite8_entries}`

Populated from `SUITE8-REGISTRY.md` Active Suite 8 Registry table. One line per entry:

```
║  [1] Teal Claude         Conductor  — Code Conductor     ║
║  [2] Stratimuxian Scholar Direct     — Framework ref      ║
║  [3] Pewter Tessera      Direct     — HiFi Design        ║
```

Each entry is selectable — selecting a numbered entry shows that Suite 8's details (reads Instance.md).

---

## Response Routing

| Selection | Action |
|-----------|--------|
| **1-N** | Read the selected Suite 8's `Instance.md`, display summary, offer to "Engage" (P3 gate passage) or return |
| **E** | Present numbered list of Suite 8s, user selects one → compose Vermillion dispatch with scoped focus. P6 flow: scope → assign → coordinate → integrate |
| **C** | Actualize a new Suite 8 from scratch. Teal Claude conducts a Full Suite (1-7) based on user's initial input — domain description, tools, environment. Routes through RI (Diamond + Onyx) to inform composition. Dispatches Suite8CreationStrategy. Equivalent to `/cascade:create` |
| **N** | Launch `Strategy/Suite8CreationStrategy.md` — Gate 1 (Backup Precaution). For users with an existing system prompt to convert. "Such Becomes a Part of the Registry" |
| **U** | Suite 8 Maintenance Dispatch. Select a Suite 8 → execute the three-band maintenance cycle: Band N (domain work — read current Skills, execute needed updates), Band N+1 (Conference Decide — evaluate Skill currency, update stale / create new / none), Band N+2 (R7 S8AT — diagnose → Onyx S8AT → Summation). This is the Self-Maintenance Aspect Loop — the Suite 8 cannot execute domain work without also touching its own self-knowledge |
| **R** | Curate full `SUITE8-REGISTRY.md` — Red Curator function. Review, prune lossy abstractions, update |
| **A** | Dispatch Cinnabar Dialectic analysis (P9 meta-cognitive). Runs CD-S2 Cascade Utilization Audit, surfaces Hot/Warm/Cold Zones, identifies emergent patterns not yet mapped to Suite 8s |
| **M** | Return to SM-Main.md |
| **Q** | Exit Shatterite |

---

## Suite 8 Detail View (Sub-rendering)

When user selects a numbered Suite 8:

```
╔══════════════════════════════════════════════════════════╗
║  {suite8_name}                          [{config}]       ║
║  ─ · ─                                                   ║
║  Domain: {domain}                                        ║
║  Skills: {skill_count}                                   ║
║  Config: {config_level}                                  ║
║                                                          ║
║  [G] "Engage" — dispatch this Suite 8 [Blue]             ║
║  [I] Read Instance.md                [Red]   — curate    ║
║  [K] Read Skill.md                   [Red]   — curate    ║
║  [B] Back to Registry                                    ║
║                                                          ║
╚══════════════════════════════════════════════════════════╝
```
