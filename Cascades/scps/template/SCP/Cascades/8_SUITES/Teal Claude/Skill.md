# Teal Claude Skill Reference

**Version**: 1.0
**Skills**: S1-S6 (Implementation) + S-SHATTERITE-MENU (Conference) + S-CLAUDEMD (Management)
**Muxification**: Diamond Conductor (`Conductor.md`)
**Strategies**: Suite8CreationStrategy, ReinforcedOnyxCompaction

---

## Skill Inventory

| Skill | Name | Informative Aspect | Actionable Aspect |
|-------|------|-------------------|-------------------|
| S1 | Codebase Analysis | Read files, trace imports, map dependencies, identify patterns | Produce architecture maps, pattern inventories, gap analyses |
| S2 | Type Architecture | Read type definitions, trace type flow across boundaries | Design type structures, extend interfaces, create contracts |
| S3 | Implementation | Read specifications, understand target patterns | Write code, edit files, create modules following existing conventions |
| S4 | Build Validation | Run build commands, read error output | Fix errors, resolve import issues, verify build output |
| S5 | Integration Testing | Read test patterns, identify coverage gaps | Execute tests, verify runtime behavior, validate flows |
| S6 | Migration | Read schema, understand data relationships | Create migrations, update mappings, extend routes |
| S-MENU | Shatterite Menu | Conference-Render interface, Pewter HiFi text | Render SM-*.md menus via AskUserQuestion |
| S-CMD | CLAUDE.md Management | 18 structural invariants, 5 RI patterns | Refine CLAUDE.md via Conceptual-Elegance or Operational-Semantics axis |

---

## S1: Codebase Analysis

**Informative**: Read file contents and directory structures. Trace import chains across modules. Map component dependencies. Identify naming conventions, file organization, coding style. Search for patterns using glob and grep.

**Actionable**: Produce pattern inventories (named patterns with file:line citations). Generate architecture maps showing data flow. Identify gaps between specification and implementation. Document existing conventions.

**Quality Criteria**: All cited patterns trace to actual file:line. No pattern assertions without evidence. Gap analysis distinguishes "missing" from "deferred".

**Diameter**: S1 → S3 (analysis guides implementation), S1 ↔ Suite 8 domains (codebase patterns inform domain integration)

---

## S2: Type Architecture

**Informative**: Read type definitions across module boundaries. Trace type flow through the system. Identify unions, optional properties, discriminated patterns. Map transformations between layers.

**Actionable**: Design type extensions preserving backwards compatibility. Create new type patterns with discriminated unions. Extend existing interfaces. Ensure type-safe contracts across boundaries.

**Quality Criteria**: New types compose with existing type system. Optional properties for backwards compatibility. Types match their source of truth.

**Diameter**: S2 → S3 (types constrain implementation), S2 → S4 (type errors reveal architecture issues), S2 ↔ S6 (schema must match types)

---

## S3: Implementation

**Informative**: Read specifications (Skill.md, Strategy.md, plan files). Understand target patterns from existing codebase. Identify integration points.

**Actionable**: Write new files following existing conventions. Edit existing files with minimal diff. Create modules that compose with existing architecture.

**Quality Criteria**: Code follows existing conventions. Minimal diff — only change what's necessary. New code compiles cleanly.

**Diameter**: S3 ← S1 (analysis guides), S3 ← S2 (types constrain), S3 → S4 (must pass build)

---

## S4: Build Validation

**Informative**: Run type checker and build commands. Read error output, trace to source locations. Identify build-specific issues.

**Actionable**: Fix errors at source. Resolve import resolution failures. Verify build output.

**Quality Criteria**: Zero type errors. Build succeeds. No regression.

**Diameter**: S4 ← S3 (build validates implementation), S4 → S3 (failures guide fixes), S4 → S2 (persistent errors indicate architecture issues)

---

## S5: Integration Testing

**Informative**: Read existing test patterns. Identify coverage for changed code paths. Trace data flow through integration boundaries.

**Actionable**: Execute existing test suites. Verify runtime behavior matches contracts. Test graceful degradation paths.

**Quality Criteria**: Changed code paths have verification. No existing tests broken.

**Diameter**: S5 ← S3 (tests verify implementation), S5 → S3 (failures guide fixes)

---

## S6: Migration

**Informative**: Read existing schema and migration files. Understand data relationships and naming transformations.

**Actionable**: Create migration files. Add columns with appropriate types and constraints. Create indexes for query patterns. Update mappings.

**Quality Criteria**: Migration is additive. Types match schema. Indexes serve known queries.

**Diameter**: S6 ↔ S2 (schema must match types), S6 → S3 (schema changes enable code changes)

---

## S-MENU: Shatterite Menu (Conference-Render)

See `Skills/S-SHATTERITE-MENU/Skill.md` for full specification.

**Informative**: Read SM-Index.md routing table. Read Cascade.json for state. Match context to correct SM-*.md Reference Design.

**Actionable**: Populate dynamic fields from Cascade.json. Render Pewter HiFi text menu via AskUserQuestion. Route user selection per Response Routing table.

---

## S-CMD: CLAUDE.md Management

**Informative**: The CLAUDE.md manifold has 18 structural invariants that must survive any refinement and 5 Renewable Intelligence patterns (RI-1 through RI-5) that must remain structurally present.

### 18 Structural Invariants
1. HUIRTH Embodiment (§0)
2. Higher-Order Contract (§1)
3. Muxonomy Measurement Framework table (§2)
4. Vermillion core definition + format (§3)
5. Suite Cascade Intention paragraph (§4)
6. Seven Suites A-I Demometer Table
7. Suite Essences Pearl-Compressed list
8. Cascade Motion sequence
9. Diamond = WorkGameBoard fusion (C3)
10. Onyx Forward Pass (C8)
11. Opal Invocation Protocol (C7)
12. Cascades Directory table
13. Onyx Compaction Rule
14. Three Configuration Levels for Suite 8
15. Suite 8 as Individualized Conceptual Space
16. Suite 8 Maintenance Dispatch Vermillion
17. Manifold Complete footer
18. Suite Spatial Muxification (Conference vs Issue)

### 5 Renewable Intelligence Patterns
- **RI-1**: Named Load Sequence with explicit file paths in Session Start Protocol
- **RI-2**: Diamond Menu during compaction — ACTIVE/PRIOR labels
- **RI-3**: Tier Progression Threshold — numeric thresholds (400 lines, >3 reads, >4 cycles, >6 diagnoses)
- **RI-4**: Compaction = Diamond ⊗ Onyx Muxification (both documents, not single distillation)
- **RI-5**: Rose-writes-Onyx / RI-reads-Onyx bidirectional citation

### Two Drafting Axes

**Conceptual-Elegance Axis**: Diameter-first section openings. Reciprocal bidirectional citations. Pearl compression via recursive Set reference. Muxonomy cartography. The document reads as a graph of its own concepts.

**Operational-Semantics Axis**: Every rule has a concrete trigger. Tables preferred over prose. Thresholds are numeric. File paths are explicit. Pearl compression via precision — fewer words because each is load-bearing.

**Actionable**: Produce CLAUDE.md Reference Design drafts. Verify all 18 invariants survive. Verify all 5 RI patterns are structurally present. Apply the selected axis consistently.

---

## Strategy Composition

**Standard Implementation Sequence**:
```
S1 (Analyze) → S2 (Type) → S6 (Migrate) → S3 (Implement) → S4 (Build) → S5 (Test)
```

**Fix Cycle**:
```
S4 (Build Fails) → S1 (Analyze Error) → S3 (Fix) → S4 (Re-validate)
```

**CLAUDE.md Refinement**:
```
S-CMD (Read invariants) → S1 (Analyze current CLAUDE.md) → S3 (Draft refinement) → S4 (Verify invariants)
```

---

## Strategies

| Strategy | Description | Output |
|----------|-------------|--------|
| **Suite8CreationStrategy** | 6-gate conversion of system prompt to Suite 8 | Registered Suite 8 instance |
| **ReinforcedOnyxCompaction** | Onyx Tier compaction across Diamond transitions | `ONYX-TIER-N.md` compacted |
