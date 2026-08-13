# SEED-3 — VERMILLION PRACTICE

Vermillion is the A-I plan format: every cognitive step split into its Informative aspect (gather, read, understand) and its Actionable aspect (decide, transform, create), composed into a plan that IS the prompt — portable to any agent, any tier. The practice laws here govern how plans lead action, how flows carry their own failure branches, and how deferred intent stays valid until it fires.

### The A-I Split Leads Every Step

**The Law**: **Every command or entry point parses its intent through the Informative/Actionable split first — informational invocations (empty, "?", "status") read and explain, READ-ONLY; directional invocations act.**

**The Failure Mode**: Commands that always execute, turning a status question into an unwanted run; or that always explain, forcing ceremony before action.

**How to Apply**: The first branch of any command skill: is the argument a question about state (→ read the state files and explain, touching nothing) or a direction (→ run)? Ambiguous cases surface a Conference choice rather than guessing. This mirrors the universal pattern: lead every cognitive step with the split.

### Blueprint Before Build

**The Law**: **The board carries the approved design before a single line lands — commit the plan document first, then build against it.**

**The Failure Mode**: Sweeping changes discovered mid-flight to have no agreed shape; review happening after the code exists, when pushback is expensive; the builder's improvisation mistaken for the design.

**How to Apply**: For any multi-file or architectural change, author the design document, get it approved (by the user or the review gate), commit it, then implement. Every major dispatch commits its plan first — the Vermillion plan is the contract the build is measured against.

### Every Flow Carries Its Failure Branches

**The Law**: **An automated sequence is only production-real when every step has an explicit failure branch that CONTAINS: a dead entry skips its own downstream, names its guard, and the next entry proceeds — and the final acknowledgment reports honest counts (attempted, succeeded, missed).**

**The Failure Mode**: One failing entry concluding an entire sweep; silent partial completion reported as total success; failure handling improvised at the crash site instead of designed into the plan.

**How to Apply**: Armor per-entry (try/catch around each unit of a sweep) so no single failure propagates. Design each step's failure branch when the plan is written, not when it fires. Acknowledgments carry counts, not adjectives. Success/failure branching is what makes a Vermillion plan reliable in live operation — a plan without failure branches is an aspiration, not a flow.

### Refresh Long-Lived Intent at Fire Time

**The Law**: **Any queued, deferred, or long-async action must be re-validated and refreshed at the moment it fires — validity windows default short, and a stale intent dispatched raw is silently dropped or wrongly applied.**

**The Failure Mode**: Deferred continuations silently discarded because their validity expired while waiting — the tell: a completion handler that verifiably never runs, with no error anywhere; state captured at queue time acted on at fire time after the world changed; a long-running operation completing on an expired token, its success signal dropped by the runtime.

**How to Apply**: For any node whose work awaits real duration (clone, spawn, network, build): set the validity window generously at creation, AND construct or refresh the action inside the resolve/timer callback — not before it. Snapshot fire-relevant state at gesture time when the target can change between gesture and execution. Learn your framework's default expiration number — a silent drop with no error is the signature of crossing it.

### Match the Ceremony to the Scope

**The Law**: **Single-file, small-line-count, or explicitly-instructed changes go direct — below the ceremony threshold, cascade overhead is waste; above it, skipping the full arc collapses the wave.**

**The Failure Mode**: Full multi-band dispatch for a typo; and the mirror: sweeping multi-file changes attempted as quick edits, discovering mid-flight they needed grounding, planning, and verification that was never done.

**How to Apply**: Name the threshold (roughly: one file, tens of lines, unambiguous instruction → direct). Announce the chosen engagement depth before acting and self-correct if the work grows past it. Depth of actualization selects the length of the arc; complexity selects the dispatch mode.

---

## Vermillion Checklist

- [ ] Every entry point branches Informative vs Actionable before doing anything.
- [ ] The design document exists and is approved BEFORE implementation begins.
- [ ] Every plan step has its failure branch designed at plan time; sweeps are armored per-entry.
- [ ] Final acknowledgments report honest counts: attempted / succeeded / missed.
- [ ] Every deferred action is refreshed inside its fire callback; validity windows set at creation.
- [ ] Engagement depth announced up front and matched to the actual scope.
