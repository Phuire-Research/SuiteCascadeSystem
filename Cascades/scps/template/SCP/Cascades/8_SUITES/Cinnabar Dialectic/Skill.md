# Cinnabar Dialectic — Skill Reference Design

**Suite 8**: Cinnabar Dialectic
**Version**: 2.0
**Skills**: 8 (CD-S1 through CD-S8)

---

## Skill Table

| ID | Skill | Suite Color | Cognitive Function |
|----|-------|-------------|-------------------|
| CD-S1 | Prompting Pattern Analysis | Red | Curate prompting patterns from session data |
| CD-S2 | Cascade Utilization Audit | Orange | Discover which Cascade features are actually used |
| CD-S3 | Pearl Compression Density | Green | Examine capitalization grammar from all angles |
| CD-S4 | Recursive Refinement Detection | Yellow | Architect detection rules for iterative prompts |
| CD-S5 | Directive-to-Cascade Mapping | Blue | Implement natural language → Cascade operation mapping |
| CD-S6 | Correction Pattern Registry | Fuchsia | Diagnose what corrections reveal about system gaps |
| CD-S7 | The Seed Induction | Blue | Induct the Seed corpus into project memory per the INDUCTION CONTRACT |
| CD-S8 | The Method Q&A | Base | Ground method answers in the Seed docs anor the registry |

---

## CD-S1: Prompting Pattern Analysis

**Cognitive Function**: Red Curator — signal from noise in session data

### Informative
Read session transcripts (JSONL format). Extract user messages only (`type: "user"` with text content). Filter system messages, login commands, and tool results. Retain substantive prompts — those with directional content.

### Actionable
Classify each substantive prompt against the Pattern Registry (P1-P18 from Instance.md). Produce a Pattern Card per session:

```
Session: {session_id}
Messages: {total} substantive / {raw_total} raw
Patterns:
  P1 Pearl Dialectic: {count} messages, avg density {N} caps/msg
  P2 Recursive Refinement: {count} sequences of {avg_length} iterations
  P3 Directives: {list of commands used}
  P4 Corrections: {list of steering events}
  P5 Length Selection: {lengths selected, distribution}
  P6 Delegation: {count} multi-agent dispatches
  P7 Pronouns: {frequency of Such/Means/Wherein/Noting}
  P8 Session Flow: {phase distribution}
  P9 Meta-Cognitive: {count} method-referencing prompts
```

### Lambda Base Aspect
- Read session JSONL → `python3` extraction script
- `grep -c "type.*user"` for message count
- Pattern classification produces artifact (Pattern Card file)
- `wc -l` on output for verification

---

## CD-S2: Cascade Utilization Audit

**Cognitive Function**: Orange Prospector — discover what's actually used vs. designed

### Informative
From Pattern Cards (CD-S1 output) and Onyx compactions, identify which Suite Cascade features appear in user prompts:

- **Suite References**: Which Suites (0-7) are named? Which are never mentioned?
- **Length Selection**: What Cascade Lengths are selected? Is there a dominant Length?
- **Tier Preference**: How often Tier 0 vs Tier 1? What triggers tier-lifting?
- **Crystraline Engagement**: Which Crystralines are explicitly referenced?
- **Suite 8 Engagement**: Which Suite 8s are dispatched? How often?

### Actionable
Produce a **Utilization Map** — a frontier discovery document naming:

1. **Hot Zones**: Cascade features used in >50% of sessions (high utilization)
2. **Warm Zones**: Features used in 20-50% of sessions (moderate)
3. **Cold Zones**: Features designed but rarely/never referenced by user (potential design gap)
4. **Emergent Patterns**: User behaviors that don't map to any designed feature (frontier)

Name each emergent pattern verbosely per Suite 2 convention.

### Lambda Base Aspect
- `grep -c` for each Suite term across session data
- Frequency table as artifact
- Named discoveries written to Utilization Map file
- `wc -l` verification

---

## CD-S3: Pearl Compression Density

**Cognitive Function**: Green Sculptor — examine capitalization grammar from all angles

### Informative
Take a corpus of user messages (from CD-S1 extraction). For each message, calculate:

- **Raw Density**: capitalized non-sentence-start words / total words
- **Pearl Terms**: words matching known Pearl Compressed Sets (Suite Cascade vocabulary)
- **Novel Capitals**: capitalized words NOT in known Pearl vocabulary (potential new Sets)
- **Density Trend**: does Pearl density increase/decrease across a session?

### Actionable
Examine Pearl Compression from three angles:

1. **Builder Angle**: Which Pearl terms enable faster prompting? (efficiency)
2. **User Angle**: Which capitalization patterns confuse the system? (misparse risk)
3. **Critic Angle**: Does Pearl Compression help or hinder mutual understanding? (fidelity)

Produce a **Pearl Grammar Card**:
```
Known Pearl Terms: {sorted list with frequency}
Novel Pearl Candidates: {capitalized words not in vocabulary, with context}
Average Density: {ratio} across {N} messages
Density Trend: {increasing/stable/decreasing per session}
Misparse Risk Terms: {words where capitalization could mislead}
```

### Lambda Base Aspect
- `python3` word-level analysis script
- Frequency counts verified via `wc` and `grep -c`
- Pearl Grammar Card as artifact

---

## CD-S4: Recursive Refinement Detection

**Cognitive Function**: Yellow Architect — design detection rules

### Informative
Study Recursive Refinement sequences (P2 from Instance.md). A sequence = consecutive user messages sharing >60% content. Examine:

- What triggers refinement? (interrupts, corrections, additions)
- How many iterations until final form?
- What changes between iterations? (additions, deletions, rewordings)
- Does the final form always carry all prior refinements?

### Actionable
Design a **Refinement Detection Algorithm**:

```
Input: ordered list of user messages
Output: list of Refinement Sequences, each containing:
  - messages[]: the sequence members
  - delta[]: what changed between each pair
  - final: the terminal (most complete) message
  - trigger: what initiated refinement (interrupt, correction, addition)
  - iterations: count
```

Produce a **Refinement Blueprint** documenting:
1. Detection heuristics (similarity threshold, sequence min-length)
2. Delta classification (addition, deletion, reword, restructure)
3. Terminal detection (how to know refinement has settled)
4. Recommendations for system behavior during active refinement

### Lambda Base Aspect
- Blueprint written as artifact
- Heuristics tested against known refinement sequences from sessions
- Match count verified via `grep -c`

---

## CD-S5: Directive-to-Cascade Mapping

**Cognitive Function**: Blue Professional — implement the mapping

### Informative
From the Directive Vocabulary table (P3) and Cascade Length Selection table (P5), build a comprehensive mapping from natural language directives to Cascade operations.

### Actionable
Produce a **Directive Mapping Table** covering:

| Layer | Maps From | Maps To |
|-------|-----------|---------|
| Engagement | "Engage your Diamond" | C6 Diamond planning, specific Length |
| Delegation | "Issue N Instances" | Opal Tier 1 × N, specific Suite 8 |
| Steering | "We are Off Target" | Stop, re-read, restart |
| Continuation | "Please Continue" | Resume from current gate |
| Gate Passage | "Approved" / "On Point" | Execute proposed plan |
| Conference | "Confer" | AskUserQuestion or analysis |
| Scoped | "with a Focus on" | Constrain Suite 8 engagement |

Each mapping includes:
- Exact natural language patterns (with variants)
- Cascade operation triggered
- Required context (what must be true for this mapping)
- Common misparses (when the directive is ambiguous)

### Lambda Base Aspect
- Mapping table as artifact
- Verified against actual session data (do directives actually map as specified?)
- `grep -c` for directive pattern frequency

---

## CD-S6: Correction Pattern Registry

**Cognitive Function**: Fuchsia Clinician — diagnose what corrections reveal

### Informative
Catalog all correction/steering events from session data. For each correction:
- What was the user's original intent?
- What did the system do instead?
- What language did the user use to redirect?
- Was the correction successful on first attempt?

### Actionable
Produce a **Correction Diagnosis** with:

1. **Frequency-Ranked Corrections**: most common correction types
2. **Root Cause Analysis**: for each correction type, WHY the system diverged
3. **Gap Identification**: which Cascade design elements fail to prevent the divergence
4. **Recommendation**: system changes that would reduce correction frequency

**Gainy/Lossy/Maintain Assessment**:
- **Gainy**: Correction patterns that revealed and improved the system (promote)
- **Lossy**: Repeated corrections for the same issue (system hasn't learned — prune cause)
- **Maintain**: One-time corrections for edge cases (preserve as documented edge)

### Lambda Base Aspect
- Correction Registry as artifact
- Each correction traced to specific session and message
- Root causes cross-referenced against Cascade design (CLAUDE.md sections)
- G/L/M assessment as Fuchsia output

---

## CD-S7: The Seed Induction

**Cognitive Function**: Blue Professional — induct the Seed corpus into project memory

**Trigger**: Spawned with the induction directive anor asked to induct/refresh the Seed.

### Informative
Read the Seed corpus at its install-relative path (`Cascades/Documentation/Seed/`): the index first (`SEED-0-INDEX.md` — the Theme Map, the INDUCTION CONTRACT, the Versioning Law), then the theme docs it maps. On a refresh: also read the project's MEMORY.md and existing Seed-derived memory files to distinguish new / changed / unchanged methods.

### Actionable
Execute the INDUCTION CONTRACT operationally:

1. **One memory file per method** (anor per tightly-bound cluster). Frontmatter: `name:` (kebab-case slug of the law's title) · `description:` (the one-line essence) · `type: feedback`. Body: the law's full three-part shape (The Law · The Failure Mode · How to Apply).
2. **One index line per file** appended to MEMORY.md: `[Law Title](filename.md) — the one-line essence.` — under ~200 characters.
3. **Read-back per write**: every memory file written is read back before the next is written.
4. **Induct what can be APPLIED, not quoted**: each entry must operate as a decision rule at the moment its trigger appears; a law not phrased as something the agent will DO differently is not fully inducted.
5. **Selective depth is legitimate**: theme docs may induct first as cluster files (name, description, the doc's checklist as body), splitting laws out as they start firing.
6. **Refresh semantics**: new methods → new files; changed methods → UPDATE the existing file (Read-back verified), never duplicate; reconcile the MEMORY.md index; NEVER overwrite project-local memory minted by the project's own cycles.
7. **Report the induction** with Concluders.

### Quality Gate
- File-count Concluder: files written = methods inducted (`ls | wc -l`)
- Index-line Concluder: `grep -c` of Seed index lines in MEMORY.md
- Read-back count: one per write, reported
- ZERO project-specific content invented into memory — the Seed's generalized shapes land as shipped; nothing project-local is fabricated into a memory file

### Lambda Base Aspect
- Write memory files; Read-back each before the next
- Append MEMORY.md index lines; `grep -c` verify
- Count Concluders close the run (files · index lines · Read-backs)

---

## CD-S8: The Method Q&A

**Cognitive Function**: Base Unification — ground method answers in the Seed docs anor the registry

**Trigger**: A question about a method, a Seed law, anor a registry pattern.

### Informative
Locate the answer's seat: the Seed doc (via `SEED-0-INDEX.md`'s Theme Map) anor the Observed Pattern Registry (Instance.md, P1-P18). The Seed's laws and the registry's shapes are two halves of one acquired method — a question may seat in either anor both.

### Actionable
Answer FROM the docs — cite the doc (and the specific law anor P-entry) the answer seats in. Unknown → say so and read the doc live before answering. Never invent a law, a pattern, anor a provenance.

### Quality Gate
- Every answer carries its citation (doc + entry)
- Uncertain → the cited doc is read in-session before the answer — no answer from decayed memory alone
- An answer with no seat in the Seed anor the registry is declared as such, not fabricated

### Lambda Base Aspect
- Read the cited Seed doc anor Instance registry entry in-session
- Citation named in the answer (doc + law anor P-entry)

---

## Muxonomy of Skill Landscape

### Demometer Inventory (Skills as Demometers)

| Skill | Measurable Property |
|-------|-------------------|
| CD-S1 | Pattern count, classification accuracy, coverage |
| CD-S2 | Feature utilization percentages, hot/warm/cold ratios |
| CD-S3 | Pearl density measurements, grammar regularity |
| CD-S4 | Refinement detection accuracy, false positive rate |
| CD-S5 | Mapping completeness, misparse frequency |
| CD-S6 | Correction frequency, root cause coverage |
| CD-S7 | Files inducted vs methods shipped, index reconciliation, Read-back count |
| CD-S8 | Citation coverage per answer, live-read rate on uncertainty |

### Diameter Map

| Diameter | Skills | Through |
|----------|--------|---------|
| Δ1 | CD-S1 ↔ CD-S2 | Pattern analysis feeds utilization audit |
| Δ2 | CD-S3 ↔ CD-S4 | Pearl grammar intersects refinement (capitalization changes during iteration) |
| Δ3 | CD-S5 ↔ CD-S6 | Directive mapping reveals correction gaps (failed mappings = corrections) |
| Δ4 | CD-S1 ↔ CD-S6 | Pattern registry feeds correction diagnosis (patterns → gaps → fixes) |
| Δ5 | CD-S2 ↔ CD-S5 | Utilization audit validates directive mapping (do mappings match usage?) |

### Muxameter Identification

- **CD-S1** (Pattern Analysis) serves as Muxameter — it connects to ALL other skills as input source. Every skill depends on extracted patterns; every skill produces patterns that could feed back into CD-S1's registry.

---

## Compound Workflows

### Full Dialectic Analysis (All 6 Skills)

```
CD-S1 (Extract patterns)
  → CD-S2 (Audit utilization from patterns)
  → CD-S3 (Measure Pearl density)
  → CD-S4 (Detect refinement sequences)
CD-S5 (Map directives from S1+S4 output)
CD-S6 (Diagnose corrections from S1+S2 output)
  → Unified Report (all findings)
```

### Quick Pattern Check (Skills S1 + S3)

For single-session analysis: extract patterns, measure Pearl density, report.

### Gap Analysis (Skills S2 + S6)

For system improvement: audit utilization, diagnose corrections, produce recommendations.

---

## Cross-References

- **Instance.md**: Pattern Registry (P1-P18) — canonical pattern definitions + the Induction Role
- **Automata (C9)**: Directive-to-Cascade mapping validates Automata routing table
- **Pearl (C1)**: Pearl Compression Density (CD-S3) studies Pearl in natural language
- **Shatterite Menu**: Utilization audit (CD-S2) reveals which menus users actually need
- **Teal Claude Conductor**: Dispatch source for Cinnabar analysis runs
- **Onyx (C8)**: Primary research material — Onyx compactions contain session Lambda
