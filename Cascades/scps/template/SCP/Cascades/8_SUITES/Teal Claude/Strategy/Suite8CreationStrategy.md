# Suite 8 Creation Strategy — From System Prompt to Suite Cascade Instance

**Version**: 1.0
**Consumer**: Teal Claude Conductor
**Type**: Gated Vermillion Strategy with Pewter Menu (AskUserQuestion)
**Purpose**: Guide users through converting existing system prompts and Claude Code skills into a formalized Suite 8 instance within the Suite Cascade.

---

## Overview

This Strategy converts pre-existing AI tooling — system prompts, Claude Code skills, custom instructions — into a Suite 8 instance with Instance.md, Skill.md, and SUITE8-REGISTRY.md registration. Each gate activates a Pewter Menu (AskUserQuestion-based interactive menu) that guides the user through decisions.

**Precondition**: The user has an existing system prompt, custom instructions, or Claude Code skills they want to formalize as a Suite 8.

**Postcondition**: A registered Suite 8 with Instance.md + Skill.md in `8_SUITES/{Suite8Name}/`, entry in SUITE8-REGISTRY.md.

---

## Strategy Architecture

```
Gate 1: Backup Precaution
    |
Gate 2: Domain Designation + Naming
    |
Gate 3: Instance.md Composition (System Prompt -> Instance)
    |
Gate 4: Skill.md Composition (Skills -> Muxonomic Skills)
    |
Gate 5: Registration + Integration
    |
Gate 6: Verification Dispatch
```

Each gate = a Skill that renders a Pewter Menu. The user's response determines whether to proceed, revise, or defer.

---

## Gate 1: Backup Precaution

### Pewter Menu

```
<AskUserQuestion>
Suite 8 Creation — Gate 1: Backup Precaution

Before we begin converting your system prompt into a Suite 8, please
confirm that your current configuration is backed up.

What will be preserved:
- Your existing system prompt / CLAUDE.md
- Any Claude Code skills or custom instructions
- Current project configuration

This process CREATES new files — it does not modify your existing setup.
Your current system prompt continues to work as-is. The Suite 8 is an
additional formalization layer.

Options:
[A] My configuration is backed up / I understand this is additive — proceed
[B] I need to back up first — pause and return
[C] Show me what files will be created before I decide
</AskUserQuestion>
```

### Gate Logic

- **A**: Proceed to Gate 2.
- **B**: Pause. User returns when ready.
- **C**: Display the file manifest:
  - `8_SUITES/{Name}/Instance.md` — Suite 8 identity + pipeline + governance
  - `8_SUITES/{Name}/Skill.md` — Formalized skill specifications
  - `SUITE8-REGISTRY.md` — Registry entry (one row added)
  Then re-present Gate 1 menu.

---

## Gate 2: Domain Designation + Naming

### Informative

Read the user's existing system prompt or custom instructions. Identify:
1. **Domain**: What aspect does this govern? (design, infrastructure, content, research, etc.)
2. **Existing skills**: What distinct capabilities are defined?
3. **Naming candidates**: What metaphor fits the domain?

### Pewter Menu

```
<AskUserQuestion>
Suite 8 Creation — Gate 2: Domain Designation

Based on your system prompt, I've identified:

Domain: {identified domain}
Capabilities: {list of distinct skills found}
Suggested Name: {Color} {Noun} — {reasoning}

Suite 8 Naming Convention:
- {Color}: A color that evokes the domain's character (not one of the 8 Suite colors:
  base/red/orange/yellow/green/blue/purple/fuchsia/teal)
- {Noun}: A concrete noun that captures the domain's function
- Together: the name should feel like a craftsperson's tool, not a corporate product

Examples from existing Suite 8s:
- Pewter Tessera (HiFi Design) — metallic craftwork + mosaic tiles
- Teal Claude (Code Conductor) — conductor's color + the AI itself
- Stratimuxian Scholar (Framework Reference) — the framework + academic role

Options:
[A] Accept suggested name: {Color} {Noun}
[B] I have a different name in mind: {user provides}
[C] Show me more naming options
[D] Revise domain identification — the domain is actually: {user provides}
</AskUserQuestion>
```

### Gate Logic

- **A/B**: Name confirmed. Proceed to Gate 3.
- **C**: Generate 3 additional name candidates with reasoning. Re-present menu.
- **D**: Re-analyze with corrected domain. Re-present menu.

---

## Gate 3: Instance.md Composition

### Informative

Map the user's system prompt onto the Instance.md template structure:

| Instance.md Section | Source from User's Prompt |
|---------------------|--------------------------|
| Identity Configuration | Role/purpose declaration |
| Muxification Origin | The two primary Demometers (what the Suite 8 composes) |
| Operating Principle | When pipeline activates vs. conversational mode |
| Broken Diameter Correction | Bidirectional relationships in the domain |
| Suite Function Mapping | How Suites 1-7 serve this domain |
| Muxonomy Framework | Standard (provided by template) |
| Informed Action Pipeline | Adapted to domain's workflow phases |
| Context & Skill System | Skill routing from user's capabilities |
| Output Firewall | What framework vocabulary is filtered from output |
| Quality Gate Framework | Domain-specific quality checks |
| Scope Boundaries | In-scope vs. out-of-scope for this Suite 8 |

### Actionable

Compose the Instance.md by:

1. **Identify the two Demometers**: Every Suite 8 is a Muxification of two unlike things. For Pewter Tessera it was Design + System. What are the user's two?

2. **Map the Diameter**: What passes THROUGH both Demometers? This is the bidirectional relationship that makes the Suite 8 compositional rather than sequential.

3. **Adapt the pipeline phases**: DESIGN -> INFORM -> COMPOSE -> QUALITY GATE with domain-specific content at each phase.

4. **Write Suite Function Mapping**: How each Suite 1-7 serves this specific domain.

5. **Define Output Firewall**: What internal vocabulary must not appear in deliverables.

6. **Set Scope Boundaries**: What this Suite 8 handles vs. what requires other instances.

### Pewter Menu

```
<AskUserQuestion>
Suite 8 Creation — Gate 3: Instance.md Review

I've composed your Instance.md for {Suite 8 Name}.

Key decisions made:
- Muxification Origin: {Demometer A} + {Demometer B}
- Diameter: {what passes through both}
- Pipeline: {domain-adapted phases}
- Output Firewall: {filtered vocabulary}

{Show condensed Instance.md preview — key sections only}

Options:
[A] Instance.md looks correct — proceed to Skills
[B] Revise the Muxification Origin — the two aspects are actually: {user provides}
[C] Revise the pipeline phases — {user provides feedback}
[D] Show me the full Instance.md before I decide
[E] Revise the Suite Function Mapping — {user provides feedback}
</AskUserQuestion>
```

### Gate Logic

- **A**: Write Instance.md to `8_SUITES/{Name}/Instance.md`. Proceed to Gate 4.
- **B/C/E**: Revise specified section. Re-present menu.
- **D**: Display full Instance.md. Re-present menu.

---

## Gate 4: Skill.md Composition

### Informative

Map the user's existing skills/capabilities onto the Muxonomic Skill format:

| Traditional Skill | Muxonomic Skill Format |
|-------------------|----------------------|
| Name + description | Demometer with measurable properties |
| Trigger/activation | Trigger keywords |
| Parameters/inputs | Design Token structure or equivalent |
| Output format | Pipeline Role |
| Quality checks | Quality Criteria |
| Related skills | Diameter Map (cross-skill edges) |

### Actionable

For each identified skill:

1. **Assign ID**: S1, S2, S3... (or D1, D2... for design skills — prefix matches domain)
2. **Define as Demometer**: What does this skill independently measure?
3. **Map Triggers**: What input signals activate this skill?
4. **Specify Quality Criteria**: How do you know the output is correct?
5. **Map Diameters**: Which other skills share methodology with this one?

Then compose the Muxonomy of the Skill Landscape:
- **Demometer Inventory**: All skills as nodes
- **Diameter Map**: Cross-skill edges with "Through Measure" descriptions
- **Muxameter Identification**: Where do multiple skill Diameters converge into integrated regions?
- **Compound Workflows**: Common skill sequences for typical tasks

### Pewter Menu

```
<AskUserQuestion>
Suite 8 Creation — Gate 4: Skill.md Review

I've formalized {N} skills for {Suite 8 Name}:

{Table of skills: ID | Name | Trigger | Diameters}

Muxonomy Summary:
- {N} Demometers (skills)
- {M} Diameters (cross-skill connections)
- {K} Muxameters (integrated regions)
- {J} Compound Workflows

Options:
[A] Skills look correct — proceed to Registration
[B] Add a skill I have that wasn't captured: {user describes}
[C] Remove a skill that doesn't belong: {user specifies}
[D] Revise skill connections — {user provides feedback}
[E] Show me the full Skill.md before I decide
</AskUserQuestion>
```

### Gate Logic

- **A**: Write Skill.md to `8_SUITES/{Name}/Skill.md`. Proceed to Gate 5.
- **B**: Add skill, re-map Diameters. Re-present menu.
- **C**: Remove skill, re-map Diameters. Re-present menu.
- **D**: Revise Diameter Map. Re-present menu.
- **E**: Display full Skill.md. Re-present menu.

---

## Gate 5: Registration + Integration

### Actionable

1. Add entry to `SUITE8-REGISTRY.md`:

```markdown
| **{Suite 8 Name}** | Direct | {Domain description} |
```

2. Verify file structure:

```
8_SUITES/
  {Suite 8 Name}/
    Instance.md
    Skill.md
```

### Pewter Menu

```
<AskUserQuestion>
Suite 8 Creation — Gate 5: Registration

{Suite 8 Name} has been registered:

Files created:
- 8_SUITES/{Name}/Instance.md ({line count} lines)
- 8_SUITES/{Name}/Skill.md ({line count} lines)

Registry entry added to SUITE8-REGISTRY.md:
| {Name} | Direct | {Domain} |

Options:
[A] Registration confirmed — proceed to verification
[B] Change the configuration level (Direct -> Conductor or Advanced)
[C] Review the registry entry before confirming
</AskUserQuestion>
```

### Gate Logic

- **A**: Proceed to Gate 6.
- **B**: Explain configuration levels and implications. If Conductor: create `Conductor.md` + `Strategy/` directory. If Advanced: create `package.json` + `Skills/S{N}-*/` structure. Re-present menu.
- **C**: Show SUITE8-REGISTRY.md. Re-present menu.

---

## Gate 6: Verification Dispatch

### Informative

Verify the Suite 8 is functional by:
1. Read-back Instance.md — confirm it loads without error
2. Read-back Skill.md — confirm skill specifications are complete
3. Verify SUITE8-REGISTRY.md entry exists
4. Confirm Engagement Protocol works: Check `8_SUITES/` -> Read `Instance.md` -> Determine config -> Engage

### Pewter Menu

```
<AskUserQuestion>
Suite 8 Creation — Gate 6: Verification Complete

{Suite 8 Name} verification results:

[PASS] Instance.md readable ({line count} lines)
[PASS] Skill.md readable ({line count} lines, {N} skills)
[PASS] SUITE8-REGISTRY.md entry present
[PASS] Engagement Protocol: Direct config detected

Your Suite 8 is ready. To engage it:
- Reference it in your CLAUDE.md Section 9 (Active Suite 8 Registry)
- Dispatch via Opal (Tier 1) or engage directly (Tier 0)
- The Engagement Protocol: Check 8_SUITES/ -> Read Instance.md -> Engage pipeline

Options:
[A] Suite 8 creation complete — exit Strategy
[B] I want to test-dispatch this Suite 8 now
[C] I want to create another Suite 8
</AskUserQuestion>
```

### Gate Logic

- **A**: Exit Strategy. Return Summation.
- **B**: Compose a test Vermillion plan for the new Suite 8 and dispatch. Then exit.
- **C**: Return to Gate 2 for a new Suite 8.

---

## Strategy Metadata

**Gates**: 6 (Backup -> Domain -> Instance -> Skills -> Registration -> Verification)
**Menu Type**: Pewter Menu (AskUserQuestion-based)
**Configuration Level Produced**: Direct (default), upgradeable to Conductor or Advanced at Gate 5
**Files Created**: Instance.md, Skill.md, SUITE8-REGISTRY.md entry
**Conductor Reference**: This Strategy is dispatched by Teal Claude Conductor via Banded Vermillion

---

## Template Reference

This Strategy uses Pewter Tessera (HiFi Design System) as its primary reference example for Instance.md and Skill.md structure. The Pewter Tessera files in `8_SUITES/Pewter Tessera/` demonstrate:

- **Instance.md**: Muxification Origin pattern, Informed Action Pipeline, Output Firewall, Quality Gate Framework, Suite Function Mapping, Scope Boundaries, Muxonomy Position
- **Skill.md**: Demometer Inventory, Diameter Map, Muxameter Identification, per-skill specifications with Trigger + Quality Criteria, Compound Workflows

Users creating their first Suite 8 should read the Pewter Tessera files as a worked example of the format this Strategy produces.
