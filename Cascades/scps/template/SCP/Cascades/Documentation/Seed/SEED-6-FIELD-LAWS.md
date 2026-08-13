# SEED-6 — FIELD LAWS

The field laws are the largest deck of the Seed: engineering case law minted where systems actually broke — stale processes, silent guards, racing writers, deaf watchers, coerced booleans. Each law names the physics of a failure class and its structural cure. They are grouped by terrain; every one was paid for at least once, most more than once.

## I. Ground Discipline

### Anchor the Working Directory Absolutely

**The Law**: **Shell working directory persists between tool calls and drifts unpredictably across a session — anchor every state-changing command absolutely.**

**The Failure Mode**: A compound command cd's into a subdirectory for a gate; a later repo-relative git operation resolves from inside it, doubling the path and failing fatally — repeatedly, in the same session.

**How to Apply**: Use `git -C <absolute-root>` for every git operation inside compounds; start compounds with an explicit cd to the absolute root; never place a repo-relative path after any segment that changed cwd. After any gate-run that cd'd elsewhere, treat the shell as dirty and re-anchor absolutely.

### Surgical Edits Prove Their Anchor

**The Law**: **Before any scripted or targeted edit, read the exact zone and prove the anchor unique — count occurrences, require exactly one; files carrying grafts get surgery, never wholesale replacement.**

**The Failure Mode**: A wholesale copy clobbered a hand-grafted integration despite a warning firing — warn-and-proceed is not a guard; warn-then-HALT is.

**How to Apply**: Read the target zone immediately before editing. For scripted replaces, grep-count the anchor and require exactly one match. Maintain a named list of grafted files that must only ever be patched surgically. Read back every write.

### The Staleness Family (Process · Fixture · Cache)

**The Law**: **Rebuilding files never updates a running process, an existing install, or a cached asset — identify which staleness layer you are testing through, and refresh it before trusting any result.**

**The Failure Mode**: A singleton background process served launch-time code across nine consecutive install tests while the rebuilt bundle sat unused on disk; a fix changing install-time artifacts "re-tested" against a pre-fix install that could never carry it; an overwritten public asset serving stale bytes from browser cache, making a correct fix look broken.

**How to Apply**: (1) Fully quit/kill long-running singletons before relaunch; plant a freshness signal (a log event only new code emits) and grep for it before believing any test. (2) When a fix changes what an installer stamps, re-test with a FRESH install. (3) When an asset fix "won't show," write to a NEW filename and repoint the reference. (4) A stale dev server holds pre-edit modules — force its restart (verify the pid changed) before trusting a probe.

### Dead Ends Are Recorded, Not Re-Attempted

**The Law**: **An approach that failed twice and was pruned is recorded with its root cause — and never re-synthesized; prefer configuring behavior at spawn over simulating input into a running program.**

**The Failure Mode**: Re-attempting a synthesized input injection into a spawned program after it had already been walked to ground twice; re-attempting an env-var injection into the wrong process after it had failed twice.

**How to Apply**: When pruning a failed approach, write down: what was tried, why it structurally cannot work, and the working alternative. Before proposing any mechanism, check the dead-end record. The general cure: set the mode/identity/config at spawn time (flags, config files, payload-carried identity), not by injecting signals into a live process after the fact.

## II. Telemetry & Guards

### Never Silence the Failure Signal

**The Law**: **Every silent early-return in a guard or fallback emits a named skip event — a fallback that does not announce itself lets the broken primary go undetected for cycles.**

**The Failure Mode**: Guards that self-rejected silently hid a cross-process bug twice — the handler ran, declined, and left no trace. A broken channel survived six cycles because a secondary relay quietly carried the traffic; its skips were indistinguishable from health.

**How to Apply**: Every guard's decline path emits skip-telemetry with a reason to a known sink. Periodically grep the sink: a busy fallback IS the diagnosis. When designing redundancy, decide which path is primary and alarm on inversion. Silence is the most expensive failure signature there is.

### Per-Effect Telemetry Verification

**The Law**: **When a mechanism claims two effects ("updates locally AND broadcasts"), verify each effect with its own telemetry — a log or artifact that fires only if that specific effect ran.**

**The Failure Mode**: A relay documented as dual-deployment actually only broadcast; the local state never updated, downstream watchers never fired, and the header comment masked the gap for a full diagnosis cycle.

**How to Apply**: Place a named log inside each effect path. The test is binary: does THIS log appear when the trigger fires? Zero appearances = that effect does not run, regardless of what the documentation says. Never accept a comment as evidence of an effect.

### Cure One Layer at a Time; Keep Faults Loud

**The Law**: **Cure a gate and expect the drop to name the NEXT gate — one layer per cycle with guard telemetry compounding; keep genuine faults loud, and let niceties fail soft, because a nicety's absence must never cost the payload.**

**The Failure Mode**: Theorizing the whole failure stack at once; conversely, a decorative attribution check silently discarding real payloads; a chain of per-layer failures each correct in isolation mistaken for one bug.

**How to Apply**: Fix the named layer, re-run, read which guard fires next — the walk down IS the diagnosis. Triage every guard: does its failure protect the user (keep loud, fail the operation) or merely decorate (log and deliver anyway)? Severity-proportionality is a design decision, not an accident.

### Sweep the Guard Class Both Ways

**The Law**: **The moment one guard of a class is condemned, sweep ALL its siblings; and when a new kind enters a path, sweep every pre-existing guard already on that path.**

**The Failure Mode**: A fix scoped to one instance of a guard class cost extra field rounds before its siblings were swept; a new message kind silently swallowed by an old guard written before the kind existed; superseded helpers leaving unswept call sites.

**How to Apply**: One grep at condemnation time enumerates the class; fix all members in the same cycle. When introducing a new kind/variant, walk its full path and audit every existing conditional against it. Grep for "kept in sync" comments and old helper names on any keyed or relocated change — they are fossil registries.

## III. State & Truth

### Source-of-Truth vs Derived View

**The Law**: **The authoritative state and its broadcast to derived views are two distinct effects — a relay that broadcasts does not maintain the local truth; always dispatch both.**

**The Failure Mode**: A broadcast-only exchange relied on to also update the authoritative side; local selectors never re-fired because the local state never changed, breaking the entire downstream reactive chain.

**How to Apply**: Designate one side Base (source of truth, maintained by the event watcher) and the other Informative (derived, synchronized by explicit broadcast). Every state-changing event dispatches BOTH a local maintenance action AND a propagation action, side by side. Verify with per-effect telemetry.

### Absence Is a State

**The Law**: **Missing is not empty and empty is not null — model each as a first-class state, render honest absence rather than silently falling through to a default, and normalize sparse-map reads at every compare.**

**The Failure Mode**: A record missing a key read as "no value" when it meant "not yet arrived"; a stale cache shadowing an honestly-empty ground; the eternal-discard bug where an undefined-vs-zero compare deafened every never-initialized entry from birth — while the telemetry printed the normalized value and the compare consumed the raw.

**How to Apply**: Distinguish not-yet-known / known-empty / known-value in every schema. Render "(nothing here)" honestly instead of letting old data shadow. At every read of a sparse map used in a comparison, normalize — and make the telemetry print exactly what the compare consumes. A standing subscription must never silently fall back to a default source.

### One Surface Operates; Every Item Has an Owner

**The Law**: **When two surfaces could operate the same state, demote one to a read-only mirror — divergence dies when only one operates; and no filter may make an item invisible on EVERY surface.**

**The Failure Mode**: Two selectors drifting apart on the same setting; strict attribution filters that made mislabeled work vanish everywhere.

**How to Apply**: Choose the single operational surface; every other rendering of that state is explicitly a mirror. Admission to a ledger stays broad; locality filtering happens only at render, and a first-seen-here flag guarantees the originating surface always shows its own work.

### Push Needs a Pull Partner

**The Law**: **A push relay alone is not a hydration strategy — every relay-fed surface needs an on-mount fetch partner, and the fetch must carry the same truth the relay composes.**

**The Failure Mode**: Surfaces born blank because the broadcast channel does not replay on connect; a page that misses one relay computing effective state wrongly forever; endpoints that no caller ever fetched.

**How to Apply**: For every live-update surface, implement mount-time GET + subscription, not either alone. Derive the GET response from the same reads the relay uses, so a relay-less mount still computes correctly. Grep each new endpoint for at least one caller before declaring it wired.

### Test the Non-Pointer Citizen

**The Law**: **In any multi-instance system with a single active pointer, run the closing test against a NON-pointer instance — the pointer's own tests pass always.**

**The Failure Mode**: Systems that work only for the currently-selected instance; multi-tenant features validated exclusively on the tenant the developer happened to have active.

**How to Apply**: Stand up at least two live instances before declaring a multi-party feature proven. Route the verification through the one the pointer does NOT reference. Treat "works for the active one" as untested.

## IV. Async & Timing

### Structural Serialization Over Timers

**The Law**: **Correctness serialization is structural (block flag set synchronously → async work → explicit unblock → a draining observer), never timer-based; a fixed sleep standing in for a condition is a blind settle — replace it with a Concluder on the observable state; fixed short timers are reserved for sub-perceptible bounded UX gaps.**

**The Failure Mode**: A timer proposed as an async completion signal racing the real operation; waits tuned ever-longer to mask races, the true readiness condition never named; inversely, multi-phase detection machinery engineered for a ~100ms render gap the user could never perceive.

**How to Apply**: For exclusive-resource async queues: the operation's own resolution triggers the unblock; the queue stores actual ready-to-fire actions; empty queue = quiescent. For any sleep, ask what state it waits for, then poll or subscribe to that state with a bounded deadline; where a settle window must remain, pair it with a content check and a single retry. For fire-X-after-Y UX gaps that are small and bounded, a fixed 50-200ms delay is the correct engineering — invisible to the user is a valid criterion.

### The Ask Identifies the Answer

**The Law**: **Every async answer must carry the identity of its ask — stamp a generation/target at request start and discard any landing whose ask no longer matches; and never cache a promise without a settle path.**

**The Failure Mode**: A target flipped mid-flight and the stale response landed as truth; discards keyed on side-signals producing false positives; a cached unsettled promise wedging every later caller when the first attempt hung.

**How to Apply**: Bump a generation counter as step one of every re-point; in-flight responses compare their captured generation and self-discard on mismatch. Cache the VALUE after settle (or clear on rejection), never the promise. Every await between a user gesture and a dispatch gets a race-bound ceiling.

### Safety Nets Are Not Fast Paths

**The Law**: **Differentiate the safety net from the confirmed path at design time — a confirmed event bypasses the grace window; and an automated failsafe must never claim a failure a clock cannot prove.**

**The Failure Mode**: A universal grace window making confirmed exits incur phantom latency; a deadline-based auto-revert declaring failure on work that was merely slow, seizing agency the user never delegated.

**How to Apply**: Reserve timers for the unconfirmable crash case only; any positively-signaled completion takes the immediate path. Before shipping an automatic revert, ask what the timer actually proves — if only "time passed," surface a status instead and let the user decide. Model grace as observable state, not a hidden timeout.

### Loops Are Designed to Halt

**The Law**: **Every persistent loop, watcher, or autonomous iteration carries a structural halt condition — empty queue, budget reached, work list exhausted — never unbounded continuation.**

**The Failure Mode**: Framing capacity as unbounded produces spin-loops, runaway iteration, and designs that fight halting-protection features instead of using them.

**How to Apply**: When authoring any loop: name its halt predicate first (queue-empty OR N iterations OR the user's word). When a framework kills a persistent plan by design, opt out explicitly and narrowly through its sanctioned bypass — never route around the whole protection mechanism. Halting on error is a designed property; preserve it.

## V. Watchers, Writers, Processes

### Watcher Lifecycle Laws

**The Law**: **Never single-file-watch an atomically-renamed file — watch the parent directory with a basename filter; re-point subscriptions in strict order (bump generation → clear timers → close old handles → publish seat → arm fresh); and the RELEASE direction is the safety-critical one — re-point home synchronously at the edge.**

**The Failure Mode**: Watchers permanently deaf after the first atomic save (the tmp-write + rename swaps the inode out from under the watch); re-arm races where the old handle's late event corrupts the new target; a momentary zero-byte read during a writer's replace cycle relayed as truth.

**How to Apply**: Parent-dir watch at depth zero plus basename match, always — assume any robust writer uses atomic tmp+rename. Encode the five-step re-point order as one function; never inline it twice. Make release/teardown synchronous and armor-wrapped at the closing edge. Guard the mass-zero read: an empty read over a non-empty prior retries once after a settle window before relaying.

### The Single-Writer Law

**The Law**: **Every shared state file has exactly ONE writing process — all others route writes through the owner via a tool/endpoint; and any state with a load-modify-write cycle and more than one possible caller gets serialization designed in from the first version.**

**The Failure Mode**: A second concurrent writer to a shared registry racing the first, producing the exact corruption the design was meant to eliminate; a mutex-free pattern introduced when the path was cold, never revisited when the path got hot.

**How to Apply**: Identify the owning process; expose a write operation on its service surface; other processes trigger, never write. Writes are atomic (tmp+rename). In-process, a module-level promise chain suffices. Pure transformation logic lives in a dependency-free model module importable from either side, so logic is shared while write authority stays singular. Ask at design time: "who else could ever call this write?" — if anyone, serialize now.

### Verify Process Topology Before Trusting Handles

**The Law**: **Confirm with live telemetry how many processes the system actually runs before assuming an in-process handle works — cross-process signals ride watched files, not direct dispatch.**

**The Failure Mode**: A dispatch from one process's handler silently no-op'd because the runtime it addressed lived in a different process; the topology assumption "corrected" the wrong way cost extra diagnostic rounds.

**How to Apply**: Emit a telemetry event where the handle is obtained (a null handle = different process — the proof). For cross-process signaling, write to a watched file the other process observes; dedupe with timestamps; keep each file single-writer. Keep a direct-dispatch fast path only where a same-process mode genuinely exists — never as the sole path.

### Drain What You Spawn; Backstop What Blocks

**The Law**: **Never spawn a child process with piped output you will not consume — an undrained pipe buffer deadlocks the child; and any blocking external call in a long-lived process needs a prompt-disable plus a hard kill backstop.**

**The Failure Mode**: An install froze the whole application because its unconsumed output filled the OS pipe buffer and blocked on write; a hung subprocess held the event loop for minutes — the process accepted connections and answered none.

**How to Apply**: Spawn with output ignored or drained to a log file when it will not be read. For any synchronous external exec inside a serving process, disable interactive prompts via environment and wrap with a timeout that kills the child. Fail fast beats freeze.

## VI. Structure & Design Boundaries

### No Parallel Paths — Extend the Existing Structure

**The Law**: **Multiple entry points to the same behavior call the SAME underlying function, and a new variant inherits the existing baseline wholesale rather than forking a parallel implementation.**

**The Failure Mode**: Parallel UI/tool code paths diverging over time; a near-duplicate variant envelope about to be created when the baseline plus one small overlay was the whole requirement; a parallel navigation section inserted beside the document's existing one.

**How to Apply**: Before exposing a new entry point, verify all callers share one manager-layer function — refactor first if they don't. When designing a variant, start from "what does the baseline already do?" and add only the genuine delta behind a flag. When adding structure to a document, register into the existing structure rather than creating a sibling.

### When Workarounds Stack, Take the Native Path

**The Law**: **When workarounds against a platform limitation keep failing, the simplest thing the platform does natively wins — prune the apparatus.**

**The Failure Mode**: Four successive workaround generations built against a rendering limitation, all replaced by one character of plain text that rendered natively; sunk-cost accumulation of compensating machinery.

**How to Apply**: After the second failed workaround, stop and ask what the platform does natively that could carry the requirement, even in reduced form. Prefer the native reduced form over the faithful simulated one. Prune the whole apparatus when the native path lands — do not keep it "just in case."

### Defer the Heavy Behind an Identical Contract

**The Law**: **Simulate the heavy integration behind a contract identical to the real one — same signature, same payload shape — so a later cycle swaps one file with zero contract delta; declare all placeholder slots at the foundation and fire a closure marker when the last is filled.**

**The Failure Mode**: Real OS/network integration blocking every dependent cycle; retroactive type expansion rippling mid-build because slots weren't reserved; simulation stubs drifting from the real shape until the swap became a rewrite.

**How to Apply**: Name each simulation gate and its designated swap cycle. The simulated and real implementations share the exact identifier and payload contract. Declare forward types at the foundation moment; actualize slots in later cycles; track fill-completion explicitly so nothing stays simulated by accident.

### Self-Modifying Systems Keep a Clean Room

**The Law**: **A system that builds itself out needs a ready return to the clean room — a fully-committed revert anchor with all work on a fork; and everything reachable from a copy/template surface must be token-free or routed through a held canonical stratum.**

**The Failure Mode**: Self-extension with no proven way back when the extension breaks the extender; templated code where rename tokens (identifiers, endpoints, registry field names) silently break every copy; N copies each needing the same fix.

**How to Apply**: Anchor-and-fork: the anchor stays committed and pristine; all drift happens on the fork; the failsafe path back is tested, not assumed. For template surfaces: shared files carry no rename-hazard tokens; every shared key a copy reads routes through one held model; canonical held components mean one edit serves every copy. Mirror into copies only through a byte-proven transform, never by hand.

### Doctrine Lives in Its Maintenance Layer

**The Law**: **Prompt text, protocol doctrine, and instruction content live in the system built to maintain them — never inlined as string constants in application code.**

**The Failure Mode**: Hardcoded instruction strings fragmenting the single source of truth, forcing dual maintenance and corroding the boundary that keeps composition data-driven.

**How to Apply**: When new doctrine is needed, create it as a row/document in the instruction layer; the code's job is fetch + assemble, never carry. If assembly needs new orchestration, extend the assembly logic — not the inline strings. Ask "what maintained domain owns this doctrine?"; if none, create the domain, don't inline the text.

### Calibrate Thresholds Against Observed Reality

**The Law**: **Boundary checks and thresholds are calibrated against actually-observed payloads, never theoretical minimums — research the empirical reality before setting the number.**

**The Failure Mode**: A zero-byte "file has content" filter passing files a tool writes kilobytes of boilerplate into before any real content exists; thresholds guessed from first principles that the field immediately falsified.

**How to Apply**: Before picking a threshold, measure what the real system produces in the empty case and the minimal-real case; set the boundary between them. When intent is complex, a targeted search for the empirical behavior beats reasoning from the spec.

### The Absent-Boolean Coercion Trap

**The Law**: **In frameworks that coerce an absent optional boolean prop to false (not undefined), any nullish-fallback on it is dead code — phrase such props as opt-OUT negatives so absence works in your favor.**

**The Failure Mode**: Default-styling branches that never fired — repeatedly, in multiple components — because absent coerced to false and the nullish operator only falls through on null/undefined; each cost a diagnosis cycle disguised as a styling bug.

**How to Apply**: Never write a nullish-fallback on an optional boolean prop. Either require the value explicitly at every call site, or invert to a negative prop so the feature computes correctly when absent. Audit this pattern any time a "default" behavior mysteriously never applies.

## VII. Naming & Sweeps

### Sweep Protection Enumeration

**The Law**: **Before any global term-rename sweep, enumerate the protected compounds that share the token but carry a different meaning — the enumeration precedes the swap.**

**The Failure Mode**: A vocabulary sweep renaming a common token silently rewriting foundational compound terms that merely contain the same word, corrupting meaning across the corpus.

**How to Apply**: Grep the token, classify every compound hit as swap vs protect, write the protect-list into the sweep instructions, then execute. Future sweeps inherit the protect-list. Never run a bare find-replace on a load-bearing word.

### Names Can Be Aspects, Not Collisions

**The Law**: **Multiple names for the same underlying record are not automatically a defect — they may encode genuinely different semantic aspects; do not unify naming that reflects real contextual difference.**

**The Failure Mode**: "Fixing" a perceived naming collision erasing the semantic information each context-specific name carried.

**How to Apply**: When you find N names for one record, first ask whether each reflects a distinct usage context. If yes, document the mapping and use each name in its own context. Unify only when the names are true accidental duplicates with identical semantics.

## VIII. Generative Pipelines

### Deterministic Precision, Generative Aesthetics

**The Law**: **In hybrid asset pipelines, deterministic tooling does the precision (geometry, alignment, placement, typography) and the generative model does the aesthetics (blend, bloom, style) — never ask a generative model to preserve exact scale or placement.**

**The Failure Mode**: A generative refine pass asked to tie together a hand-assembled scene re-interpreted and normalized everything — shrinking intentionally-scaled elements no matter how hard the prompt locked them; generated text degrading across refine passes.

**How to Apply**: Margins/crops/scale/aspect = deterministic image ops, never a regen. Alignment-locked assemblies = composite vector replacements deterministically, then optionally run a light generative "polish ONLY what is already here" pass on the clean base — and verify with a contact-sheet crop before accepting, falling back to the pre-pass image on drift. Premium in-image type = bake a vector wordmark deterministically after erasing generated text.

### Enumerate the Generative Spec, Assemble in Stages

**The Law**: **Multi-element generation drifts under vague slot specs — pin every position to an exact object AND state with one concrete subject throughout; build complex scenes in chained stages with the most fragile element placed LAST.**

**The Failure Mode**: Vague slot language letting the model fill arbitrarily; fresh full-scene re-rolls repeatedly losing the subject's key features; negative instructions alone failing to prevent duplicates.

**How to Apply**: Write a shot-list enumerating each position strictly in order with a specific object + state; carry one concrete subject across all stages. Build in verified stages (base → key element → connecting effect → fragile detail last), each verified before the next. Ban unwanted content with explicit enumerated language and literal counts, not abstractions. Prefer edit-don't-reroll: refine from the last good state rather than regenerating from zero.

---

## Field Checklist

- [ ] Every state-changing command absolutely anchored; shell treated as dirty after any cd.
- [ ] Every targeted edit: zone read, anchor grep-counted to exactly one, write read back.
- [ ] Staleness layer named and refreshed (process / install / cache / dev server) before trusting any test.
- [ ] Every guard decline and fallback emits named skip-telemetry; sinks grepped during diagnosis.
- [ ] Claimed multi-effect mechanisms verified per effect; one layer cured per cycle.
- [ ] Condemned guard classes swept whole; new kinds walked down their full path.
- [ ] Truth vs derived view: both dispatches present; absence modeled as a first-class state.
- [ ] Async answers carry their ask's generation; timers never stand in for conditions; loops name their halt.
- [ ] Watchers on parent dirs; shared files single-writer; spawned pipes drained; blocking calls backstopped.
- [ ] New behavior extends the existing structure; workarounds capped at two; thresholds empirically calibrated.
- [ ] Term sweeps carry a protect-list; contextual names preserved as aspects.
- [ ] Generative pipelines: deterministic precision, enumerated specs, staged assembly, edit-don't-reroll.
