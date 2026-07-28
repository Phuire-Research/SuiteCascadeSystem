# SD-AutoTier — VDR Auto-Tier Heuristic Reference Design

**Menu ID**: SD-A
**Trigger**: User uncertain which VDR Tier matches the issue · Conductor characterizes and recommends
**Canonical Reference**: `Cascades/Documentation/Cascades/VDR-PATTERN.md` §3 *Intelligence Heuristics*

---

## What SD-AutoTier Is

The auto-tier heuristic is the Conductor's intelligence layer for VDR Tier selection. When the user invokes `/cascade:verified-diagnosis {issue description}` without specifying a Tier (or selects `[A]` from the SD-Index menu), the Conductor:

1. Parses the issue description for keyword cues across five heuristic axes
2. Scores each VDR Tier (T1-T4) by cue-match count
3. Recommends the highest-scoring Tier
4. Surfaces a Conference (`AskUserQuestion`) presenting the recommendation + down/up-tier options
5. Routes user-confirmed selection to the appropriate SD-T{N} Reference Design

The auto-tier heuristic is **advisory**, not authoritative — the user retains final tier-selection authority via the Conference.

---

## Five Heuristic Axes

Each axis maps issue characterization to Tier-pressure scoring.

### Axis 1 · Symptom Characterization

| Characterization | Tier Pressure | Cue Examples |
|---|---|---|
| Clear · single observable fault | T1 | "this error", "this specific test", "one button", "this view broken" |
| Scattered · multi-observation | T2 | "scattered errors", "various logs", "multiple failures", "different views show" |
| Novel · undescribed behavior | T3 | "weird behavior", "I don't know what to call this", "unprecedented", "first time" |
| Cross-cutting · system-wide | T4 | "everywhere", "spans the codebase", "all the X", "system-wide", "all instances" |

### Axis 2 · Surface Inventory

| Characterization | Tier Pressure | Cue Examples |
|---|---|---|
| Known surface · single file/module | T1 | "in this file", "the X module", "specifically the Y component" |
| Unknown surface · search needed | T2 | "I don't know where", "find all", "search for", "track down the source" |
| Unknown novel surface | T3 | "in the new X" + naming pressure |
| Cross-cutting surfaces | T4 | "across all", "spans modules", "multiple subsystems" |

### Axis 3 · Naming Pressure

| Characterization | Tier Pressure | Cue Examples |
|---|---|---|
| No naming pressure · existing vocabulary suffices | T1, T2 | (absence of novel-pattern cues) |
| Novel pattern emerging · must be named | T3 | "new pattern", "no name for", "must be a", "weird kind of" |
| Novel pattern AND cross-cutting | T4 | T3 cues + T4 cues co-occur |

### Axis 4 · Macro Impact

| Characterization | Tier Pressure | Cue Examples |
|---|---|---|
| Single sub-Diamond fix scope | T1, T2, T3 | (absence of Macro cues) |
| Multi-sub-Diamond · Macro-class | T4 | "Macro", "multi-sub-Diamond", "Macro WGB", "across cycles" |

### Axis 5 · Terminal Diamond Expectation

| Characterization | Tier Pressure | Cue Examples |
|---|---|---|
| Sub-Diamond actualization expected | T1, T2 | "fix it", "patch it", "just need to" |
| Sub-Diamond + naming codification | T3 | T3 naming cues + sub-Diamond expectation |
| Macro Diamond opening expected | T4 | "open a Macro", "this is going to be big", "needs full Macro" |

---

## Auto-Tier Scoring Algorithm

```
function autoTierScore(issueDescription: string) → Tier {
  // Parse keyword cues per axis
  axis1 = characterizeSymptom(issueDescription)
  axis2 = characterizeSurface(issueDescription)
  axis3 = characterizeNamingPressure(issueDescription)
  axis4 = characterizeMacroImpact(issueDescription)
  axis5 = characterizeTerminalExpectation(issueDescription)

  // Score each Tier by cue-match count
  scores = { T1: 0, T2: 0, T3: 0, T4: 0 }
  for axis in [axis1, axis2, axis3, axis4, axis5]:
    for tier in axis.tierPressure:
      scores[tier] += 1

  // Apply Tier escalation rules
  if axis3 == "novel" AND axis4 == "macro":
    scores[T4] += 2  // T3+T4 cues escalate to T4
  if axis4 == "macro":
    scores[T4] += 1  // Macro impact alone escalates to T4 even without novelty

  // Recommend highest-scoring Tier
  recommendedTier = argmax(scores)

  // Tie-breaking: prefer lower Tier when scores tied (Pearl conservatism)
  if multiple Tiers tied for max:
    recommendedTier = lowest-numbered tied Tier

  return recommendedTier
}
```

### Default Behavior

- **No cues match** → default to **VDR-T1 Base** (Pearl conservatism · minimum-Round dispatch)
- **All Tiers tied** → default to **VDR-T1 Base**
- **T4 cues present alone** → escalate to T4 regardless of other axes
- **T3 + T4 cues co-occur** → escalate to T4 (orchestrated absorbs named)

---

## Conference Decide Block (Auto-Tier Prompt)

When auto-tier completes, the Conductor surfaces:

```
╔══════════════════════════════════════════════════════════╗
║  VDR AUTO-TIER RECOMMENDATION              [Fuchsia]     ║
╠══════════════════════════════════════════════════════════╣
║                                                          ║
║  Issue characterization:                                 ║
║  Symptom:   {clear | scattered | novel | cross-cutting}  ║
║  Surface:   {known | unknown | novel | cross-cutting}    ║
║  Naming:    {no pressure | novel pattern emerging}       ║
║  Macro:     {single sub-Diamond | Macro-class}           ║
║  Terminal:  {sub-Diamond | Macro Diamond}                ║
║                                                          ║
║  Recommended Tier: VDR-T{N} ({Name})                     ║
║  Rounds: {Round composition}                             ║
║  Estimated wall-clock: {minutes}                         ║
║                                                          ║
║  · · ·                                                   ║
║                                                          ║
║  [{N}] Accept · dispatch {Round count} Rounds [{Suite}]  ║
║  [{N-1}] Down-tier to T{N-1} · fewer Rounds              ║
║  [{N+1}] Up-tier to T{N+1} · more Rounds                 ║
║                                                          ║
║  · · ·                                                   ║
║                                                          ║
║  [E] Explain scoring · show axis-by-axis breakdown       ║
║  [M] Return to VDR Menu (SD-Index.md)                    ║
║  [Q] Exit                                                ║
║                                                          ║
╚══════════════════════════════════════════════════════════╝
```

### Per-Selection Action

| Selection | Action |
|---|---|
| **[N] Accept** | Route to `SD-T{N}-{Name}.md` · Conductor inquires Tier-specific questions · composes Banded Plan · dispatches Rounds |
| **[N-1] Down-Tier** | Route to `SD-T{N-1}-{Name}.md` · same flow at lower Tier · Conductor confirms user understands reduced Round count |
| **[N+1] Up-Tier** | Route to `SD-T{N+1}-{Name}.md` · same flow at higher Tier · Conductor confirms user understands increased Round count and wall-clock |
| **[E] Explain** | Render Pewter pane showing axis-by-axis cue match breakdown · which cues triggered which Tier pressure · user can re-decide |
| **[M] Return** | Back to SD-Index.md main VDR menu |
| **[Q] Exit** | Exit Shatterite |

---

## Worked Examples

### Example 1 · Clear Single-Surface Fault

**User input**: *"The login button doesn't fire on Safari but works on Chrome."*

Axis parse:
- Axis 1 Symptom: "login button doesn't fire" = clear · single observable → **T1**
- Axis 2 Surface: "Safari but works on Chrome" implies known surface (login button component) → **T1**
- Axis 3 Naming: no novel-pattern cues → **T1, T2**
- Axis 4 Macro: no Macro cues → **T1, T2, T3**
- Axis 5 Terminal: no Macro cues, fix-it implied → **T1, T2**

Scores: T1=5, T2=3, T3=1, T4=0 → **Recommend VDR-T1 Base**

### Example 2 · Scattered Multi-File Fault

**User input**: *"Authentication is failing intermittently — I see scattered errors in different views and the logs don't make sense. Multiple auth-related files."*

Axis parse:
- Axis 1 Symptom: "scattered errors", "different views" → **T2**
- Axis 2 Surface: "Multiple auth-related files" → **T2**
- Axis 3 Naming: no novel-pattern cues → **T1, T2**
- Axis 4 Macro: no Macro cues → **T1, T2, T3**
- Axis 5 Terminal: implicit fix → **T1, T2**

Scores: T1=3, T2=5, T3=1, T4=0 → **Recommend VDR-T2 Curated**

### Example 3 · Novel Pattern Emerging

**User input**: *"There's something weird happening in the new bridge protocol — the server is reassembling client state in a way I don't have a name for, causing intermittent stale-read bugs."*

Axis parse:
- Axis 1 Symptom: "something weird happening", "intermittent" → **T2, T3**
- Axis 2 Surface: "new bridge protocol", "server is reassembling client state" → **T3**
- Axis 3 Naming: "I don't have a name for" → **T3**
- Axis 4 Macro: no Macro cues → **T1, T2, T3**
- Axis 5 Terminal: implicit fix + naming codification → **T3**

Scores: T1=1, T2=2, T3=5, T4=0 → **Recommend VDR-T3 Named**

### Example 4 · Cross-Cutting Macro-Class

**User input**: *"ClientState preservation is breaking across multiple SCP instances Macro-wide — the new Bridge protocol exposes a Diameter Gap we haven't named, fix spans session lifecycle, state assembly, and SCP runtime contract."*

Axis parse:
- Axis 1 Symptom: "across multiple SCP instances" → **T4**
- Axis 2 Surface: "session lifecycle, state assembly, SCP runtime" cross-cutting → **T4**
- Axis 3 Naming: "haven't named" → **T3**
- Axis 4 Macro: "Macro-wide" → **T4** + escalation bonus
- Axis 5 Terminal: "fix spans" implies Macro Diamond → **T4**

Scores: T1=0, T2=0, T3=1, T4=4 (+ escalation bonus +2 for T3+T4 co-occur) = 6 → **Recommend VDR-T4 Orchestrated**

---

## Edge Cases

### Insufficient Detail

If user input is too short to score meaningfully (e.g., "fix the bug"):

- Conductor surfaces an inquiry Conference before scoring:
  ```
  Issue description too brief for auto-tier scoring.

  Please describe:
  - Symptom (what is the observable fault?)
  - Surface (where in the codebase?)
  - Scope (single file, multiple files, system-wide?)
  - Familiarity (known pattern or novel behavior?)
  ```
- User provides detail · Conductor re-scores

### Contradictory Cues

If T1 cues AND T4 cues co-occur (e.g., "clear symptom in this specific file but spans the whole system"):

- Conductor flags the contradiction in the Conference
- Recommends higher Tier (T4) by default — over-tier is safer than under-tier
- User confirms anor down-tiers if confident scope is smaller

### User Override

User can directly invoke a specific Tier via slash command argument:

```
/cascade:verified-diagnosis --tier=T2 {issue}
/cascade:verified-diagnosis --tier=T4 {issue}
```

When `--tier=` is specified, auto-tier is skipped · Conductor routes directly to the specified `SD-T{N}` Reference Design.

---

## Cross-Reference

- **Canonical algorithm spec**: `Cascades/Documentation/Cascades/VDR-PATTERN.md` §3 *Intelligence Heuristics*
- **Tier definitions**: `SD-T1-Base.md`, `SD-T2-Curated.md`, `SD-T3-Named.md`, `SD-T4-Orchestrated.md`
- **Main VDR menu**: `SD-Index.md`
- **Conductor section**: `Cascades/8_SUITES/Teal Claude/Conductor.md` *VDR Conductor*

---

## Navigation

- `[B]` Back to VDR Main Menu (SD-Index.md)
- `[M]` Return to Main Shatterite Menu (SM-Main.md)
- `[Q]` Exit Shatterite
