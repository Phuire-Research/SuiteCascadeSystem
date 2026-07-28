# S1 — Framework Foundation

**Domain**: Essential principles, introduction, and version 0.3.2 breaking changes for StratiDECK development
**Trigger**: When establishing a new concept, onboarding to Stratimux, or needing foundational framework knowledge including the Four Pillars, anti-patterns, and the Higher-Order Programming paradigm
**STRATIMUX-REFERENCE.md**: Lines 153-275

---

## Essential Principles for Successful StratiDECK Development

### The Four Pillars of Quality StratiDECK Concepts

#### 1. **Type-First Architecture**
- Always begin with `qualities/types.ts` containing all state interfaces and payload types
- Use explicit Quality type mapping (NEVER `typeof` patterns)
- Maintain strict TypeScript compliance with verbatimModuleSyntax

#### 2. **Higher-Order Reactive Paradigm**
- All operations occur within planning scope using `muxium.plan<DECK>()`
- State access through DECK K Constant pattern: `k.property.select()` or `d.concept.k.property.select()`
- No base-level operations (no `getState()`, direct mutations, or imperative dispatches)
- **Recursive Function Composition**: Stratimux is fundamentally a Higher Order Composition of Functions that executes recursively based on the Muxium mode, using RxJS for syntactic sugar

#### 3. **Compositional Quality Design**
- Each quality represents a single, atomic state transformation
- Qualities are pure functions with predictable inputs/outputs
- Use `createQualityCard` for simple actions, `createQualityCardWithPayload` for parameterized actions

#### 4. **Strategic State Management**
- Design state structures that reflect your domain model clearly
- Use principles for initialization and long-running reactive behaviors
- Leverage selectors for efficient, targeted reactivity

### Core Success Indicators

A successful StratiDECK concept demonstrates:
- **Zero TypeScript compilation errors** in strict mode
- **Complete type safety** from state definition through quality implementation
- **Reactive responsiveness** to state changes through proper selector usage
- **Compositional flexibility** allowing integration with other concepts via `muxifyConcepts`
- **Clear separation of concerns** between state management (qualities) and reactive logic (principles)

### Critical Anti-Patterns to Avoid

1. **Legacy typeof Pattern**: `export type Qualities = typeof qualities` (causes compilation failures)
2. **Imperative State Access**: Attempting `muxium.getState()` or direct state mutations
3. **Missing Type Exports**: Quality files without explicit Quality type exports
4. **Flat Programming Mindset**: Trying to operate outside planning scope
5. **Overly Complex State**: Designing state structures that mix concerns or domains

---

## Introduction

Stratimux is an asynchronous graph programming framework that implements a Muxified Turing Machine. This reference guide is **specifically designed for AI agents** and provides a comprehensive overview of the core concepts, patterns, and functionality based on analyzing the codebase and test files.

**Version Coverage**: This guide covers Stratimux v0.3.2 (Stratideck) with complete type system overhaul and StratiDECK interface system.

**For Agents**: This reference provides drop-in code patterns, type definitions, and implementation examples for effective Stratimux development without requiring deep framework knowledge.

## Version 0.3.2 Key Changes (StratiDECK)

### Critical Breaking Changes

**Quality Type System Overhaul**: All qualities now require explicit type definitions due to TypeScript limitations at scale.

```typescript
// OLD Pattern (No longer works with complex concepts - LEGACY ANTI-PATTERN)
const qualities = { counterAdd, counterSubtract };
export type CounterQualities = typeof qualities;

// NEW Pattern (Required for v0.3.2+ - CORRECT APPROACH)
export type CounterAdd = Quality<CounterState>;
export type CounterSubtract = Quality<CounterState>;
export type CounterQualities = {
  counterAdd: CounterAdd,
  counterSubtract: CounterSubtract,
};
```

**CRITICAL FOR AI AGENTS**: Never use `typeof` pattern for quality definitions. This is a legacy anti-pattern that causes compilation failures in v0.3.2+.

### Higher-Order Programming Paradigm

**Stratimux is fundamentally different from traditional "flat" programming**. It operates as a higher-order environment where you don't work at the base level, but within planning scope:

#### Flat Programming (Traditional - What NOT to do)
```typescript
// FLAT/IMPERATIVE APPROACH (Wrong for Stratimux)
const muxium = muxification('My App', { myConcept: createMyConcept() });

// Direct state access (BAD)
const state = muxium.getState(); // This doesn't exist!
state.myConcept.someProperty = 'new value'; // Direct mutation (BAD)

// Imperative action dispatch (BAD)  
muxium.dispatch(myAction()); // Base-level dispatch (BAD)
```

#### Logically Conceptual Higher-Order Programming 
```typescript
// HIGHER-ORDER APPROACH
const muxium = muxification('My App', { myConcept: createMyConcept() });

// All logic happens within planning scope
muxium.plan<MyConceptDeck>('my application logic', ({ stage, conclude, d__, k__ }) => [
  stage(({ d, k, dispatch, stagePlanner }) => {
    // State access through DECK K pattern
    const someProperty = d.myConcept.k.someProperty.select();
    
    // Conditional logic and reactive patterns
    if (someProperty === 'trigger') {
      dispatch(d.myConcept.e.myAction({ data: 'response' }), { 
        iterateStage: true 
      });
    } else {
      stagePlanner.conclude();
    }
  }),
  conclude()
]);
```

**Key Differences:**
- **No base-level operations**: Everything happens in planning scope
- **Reactive by design**: Plans respond to state changes
- **Type-safe**: DECK system provides full TypeScript support
- **Declarative**: You describe what should happen, not how to do it
- **Compositional**: Plans can be combined and reused

---

## Pre-Implementation Recognition Check (M58 / M61 / M63)

**Before authoring ANY new Stratimux Concept or Quality from scratch, run the recognition check. This is the M58 Field-of-Poppies prevention discipline — the single most consequential pre-implementation step.**

### The Field-of-Poppies Anti-Pattern (M58)

The Field-of-Poppies names the failure mode where an agent (human or AI) encounters a complex implementation requirement, does not locate the authoritative realized pattern, and re-invents the pattern from first principles. The resulting reinvention is often coherent — it compiles, the logic is consistent — but it deviates from the realized pattern in ways that are invisible until runtime or user-Lambda testing.

The B.7 Triple-Regression Arc of the SuiteCascadeSystem project (Cycles 125-135) proved that M58 applies equally to implementation AND verification reasoning. Field-of-Poppies thinking produces:
- Coherent code that diverges from canonical shape
- "Confident-but-wrong" verifications that pass tsc and miss runtime gaps
- Sequential regressions, each surfacing one architecturally-independent divergence

### M61 — Project-Totality Authoritative Scope

**Search the entire current project AND adjacent authoritative reference projects before authoring.** The authoritative source supersedes from-scratch reasoning.

```bash
# Step 1 — Search current project
grep -rln "createConcept\|muxifyConcepts" src/ | head -30
grep -rln "{domain-keyword}" src/

# Step 2 — Search authoritative reference projects in the surrounding workspace
# For SCP-Origin ecosystem: ADMIN_ICP is the canonical Huirth-pattern reference
ls /Users/{user}/Work/Stratithon/reference/beginning/ADMIN_ICP/src/lib/
grep -rln "{pattern-name}" /Users/{user}/Work/Stratithon/reference/beginning/ADMIN_ICP/src/

# Step 3 — Search the Stratimux framework reference for the primitive pattern
grep -rln "{primitive-pattern}" /Users/{user}/Work/Stratithon/reference/Stratimux/src/
```

### M63 — Copy-Paste-Plus Canonical Path

When the recognition check finds an authoritative pattern, the canonical path is Copy-Paste-Plus:

1. **Copy** the file structure verbatim — directory layout, file names, type definitions, factory signatures
2. **Paste** into the new Concept's location, keeping the structural skeleton intact
3. **Plus** the necessary domain adaptations — rename identifiers, substitute state fields, adjust Quality names

Every new file's top-line comment MUST name the authoritative source:

```typescript
// File: src/lib/newConcept/newConcept.concept.ts
// Authoritative source: ADMIN_ICP/src/lib/huirth/huirth.concept.ts (Copy-Paste-Plus per M63)
// Domain adaptation: huirth → newConcept
```

### Recognition Check Decision Table

| Recognition Result | Next Action |
|--------------------|-------------|
| Pattern exists in current project | Copy-Paste-Plus from current project (M63) |
| Pattern exists in authoritative reference (ADMIN_ICP / Stratimux) | Copy-Paste-Plus from reference + document source (M63) |
| No pattern exists anywhere | Proceed to S14 From-Scratch Manifold with maximum rigor |

**The recognition check is the substitute for the missing realized pattern.** Skipping it puts the builder in Field-of-Poppies territory the moment authoring begins.

### Why This Goes in S1 (Foundation)

Recognition is foundational because it determines which Skill the builder uses next. If recognition finds a pattern, S2-S13 govern its adaptation. If recognition finds no pattern, S14 (From-Scratch Manifold) governs authoring from first principles with the M58/M61/M63/M64-M72 discipline scaffold.

The B.7 doctrinal lesson: M58 is necessary but not sufficient. M58 prevents from-scratch IMPLEMENTATION reasoning; M72 (4-Layer Cinnabar Dialectic — S14 §7.7) prevents from-scratch VERIFICATION reasoning. Both are required for a Muxistration Proof that survives user-Lambda testing without sequential regression.

**Cross-references**: S14 §7.1 Pre-Implementation Recognition Check · S14 §7.7 Cinnabar Dialectic Pre-Commit Gate · S8 §Self-Named Container Template (the canonical Copy-Paste-Plus target for container Concepts).
