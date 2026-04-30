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
