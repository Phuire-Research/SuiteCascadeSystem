# ONYX METHOD CARDS (SP-1 Band B · the RI's method-class lessons generalized)

Method-class lessons swept from the full Onyx record (thirty tiers of Rose diagnoses, Standing Laws banks, and tier-opening Method-Level Learnings), generalized for fresh installs. Every project name, path, version, and product stripped — only the transferable method survives.

---

## OC-1 · No Claim Without an Artifact

**The Law**: **A claim of completion, correctness, or measurement is worth nothing until an artifact or a re-runnable check backs it — reported is not confirmed, in either direction.**

**The Failure Mode it cures**: Five false "gates passed" claims by dispatched agents in a single epoch; status documents asserting history the ledger could not cite; stored numbers quoted long after they decayed. Also the inverse waste: re-doing work that WAS confirmed because nobody trusted the record.

**How to Apply**: Re-run the gate yourself (typecheck, build, grep-count) before trusting any agent's green claim. Treat every status write to a planning board as a Lambda-event: never author a status the ledger cannot cite. Before any numeric claim, run the count. Spot-check dispatched-agent artifacts on disk.

Theme: lambda-discipline
Recurrence: across tiers — the single most-paid law in the record

## OC-2 · Conclude on Artifacts and Bodies, Not Exit Codes

**The Law**: **A build gate concludes on the artifacts it was supposed to produce and on a real body-typecheck — a green exit code alone proves neither.**

**The Failure Mode it cures**: A partial output state between builds is invisible to exit 0. Bundler builds skip function-body type checking entirely, so generic and staged errors ship silently. A markup-template compiler blind spot let component files escape the plain typecheck for cycles.

**How to Apply**: After a build, list the expected output artifacts by name. Run the compiler's no-emit typecheck as the real Concluder, at the root that includes the touched libraries. Bank the pre-existing error count as a named baseline and gate on zero NET-new errors. Add a template-aware typecheck for cycles touching template files.

Theme: lambda-discipline
Recurrence: across tiers — baselines banked and held in every late-tier Standing Laws section

## OC-3 · Completion Is Testing; Done Belongs to the User

**The Law**: **Agent task-completion means the Concluders passed — the state is TESTING, not Done; only the user's witnessed runtime confirmation promotes it.**

**The Failure Mode it cures**: Marking work complete on the strength of the builder's own gates; checked boxes that meant "claimed" rather than "tested"; user-facing breakage discovered cycles later behind a Done marker.

**How to Apply**: Two distinct states: TESTING (gates green, clinical note written, runbook attached for the user) and Done (user ran it and said so). A checked box means user-confirmed. Keep a testing ledger with a one-line runbook per item so the user's confirmation pass is cheap.

Theme: lambda-discipline
Recurrence: standing law across many tiers, restated verbatim in successive law banks

## OC-4 · Prove the Running Process Is Fresh

**The Law**: **A long-lived process does not reload rebuilt code — every deploy needs a freshness signal proving the running instance carries the new bytes, ideally self-announcing.**

**The Failure Mode it cures**: Singleton daemon processes that relay new launches to the stale running instance, so rebuilt code never reaches the field; days lost to "the fix didn't work" when the fix never loaded; old debug events firing while new ones stay silent (the classic stale tell).

**How to Apply**: Fully quit the long-lived process before relaunch — a relaunch that relays to the running instance is not a restart. Designate one log event or timestamp as the freshness Concluder and check it first. Best: build a visible stale badge into the tool itself (compare the running artifact's modification time against the recorded write time) so staleness names itself.

Theme: lambda-discipline
Recurrence: at least four tiers — repeatedly diagnosed, finally cured structurally with a self-announcing badge

## OC-5 · Never Overwrite a Standing Record

**The Law**: **Before creating or forking any ledger-class file, check the target for existing content — refuse to Write over a standing history document; a new sequence number is cheap, the history is not.**

**The Failure Mode it cures**: A commanded fork found two thousand lines of a divergent prior chain already on disk, one blind Write away from destruction. Ignored-by-version-control working files persist across branch switches and ambush later sessions.

**How to Apply**: Existence-check before Write on any accumulating document. If content exists, preserve it untouched and take the next sequence number instead. Prior records are never deleted — they fall out of scope, retrievable by menu.

Theme: lambda-discipline
Recurrence: invariant since the earliest tiers; proved its worth dramatically in a late-tier fork

## OC-6 · Surgical Edits Prove Their Anchor

**The Law**: **Before any scripted or targeted edit, read the exact zone and prove the anchor unique — count occurrences, require exactly one, Read-back after; files carrying grafts get surgery, never wholesale replacement.**

**The Failure Mode it cures**: A wholesale copy clobbered a hand-grafted integration despite a warning firing (warn-and-proceed is not a guard — warn-then-HALT is). Blind edit retries after a mismatch compound the damage. Character-level diff reconstruction of a failed patch corrupts; semantic-anchored hunks survive.

**How to Apply**: Read the target zone with the read tool immediately before editing. For scripted replaces, grep-count the anchor and require exactly one match. On edit error, re-read before retry — never blind-retry. Maintain a named list of grafted files that must only ever be patched surgically. Read back every write.

Theme: lambda-discipline
Recurrence: multiple tiers — the graft-clobber incident plus a standing "surgical class" list maintained thereafter

## OC-7 · Replace Blind Waits with State Checks

**The Law**: **A fixed sleep standing in for a condition is a blind settle — replace it with a Concluder on the observable state it was waiting for.**

**The Failure Mode it cures**: Timing-dependent flakiness that passes locally and fails in the field; waits tuned ever-longer to mask races; the true readiness condition never named, so never testable.

**How to Apply**: Ask what state the sleep is waiting for, then poll or subscribe to that state directly with a bounded deadline. Where a wait must remain (write-settle windows), pair it with a content check and a single retry rather than trusting one read.

Theme: lambda-discipline
Recurrence: named as a fossil-law and applied repeatedly in later tiers

## OC-8 · The Final Proof Is the User Looking at It

**The Law**: **The concluding gate of an install or feature is the user witnessing it work — intermediate smoke checks are scaffolding, not the finish line.**

**The Failure Mode it cures**: Pipelines that end on an internal probe passing while the user still faces a broken first-run; effort spent hardening intermediate gates while the actual arrival experience goes untested.

**How to Apply**: Design flows to terminate in the user's own success moment (the page opens, the session answers). Retire redundant internal smoke steps once the launch itself concludes. The user's eyes are the Lambda; the builder authors blind.

Theme: lambda-discipline
Recurrence: two tiers, promoted to doctrine ("launch-as-Concluder")

## OC-9 · Probe Before Salvo; Source Over Inference

**The Law**: **Name the root cause with cheap Concluders and existing evidence before dispatching any multi-agent salvo — the disk tells the truth the UI withholds, and a fresh source-read overrides every prior inference.**

**The Failure Mode it cures**: Expensive parallel diagnostics fired at a problem five greps would have named; architecture built on remembered (wrong) beliefs about existing code; theories stacked above the signal plane while the boot fingerprint below it held the answer.

**How to Apply**: Check logs, telemetry sinks, and on-disk state first. Fingerprint the system's actual boot/state before theorizing about the signal. Grep the existing source before architecting anything new (read-before-reinvent). A confirmed probe that collapses the salvo is the highest-value move; fire the salvo only when the probe genuinely cannot decide.

Theme: field-laws
Recurrence: paid five times in one tier alone; collapsed salvos in at least three tiers

## OC-10 · Sweep the Guard Class Both Ways

**The Law**: **The moment one guard of a class is condemned, sweep ALL its siblings; and when a new kind enters a path, sweep every pre-existing guard already on that path — comments claiming "kept in sync" are fossil registries to grep on every change.**

**The Failure Mode it cures**: A fix scoped to one instance of a guard class cost three extra field rounds before its siblings were swept. A new message kind was silently swallowed by an old guard written before the kind existed. Superseded path helpers left unswept call sites (relocation stragglers).

**How to Apply**: One grep at condemnation time enumerates the class; fix all members in the same cycle. When introducing a new kind/variant, walk its full path and audit every existing conditional against it. Grep for "kept in sync" comments and old helper names on any keyed or relocated change.

Theme: field-laws
Recurrence: named in one tier, priced in the next, restated as a fossil-law quartet

## OC-11 · A Fallback Hides a Broken Primary

**The Law**: **Every fallback path must announce itself — a silent fallback lets the broken primary go undetected for cycles.**

**The Failure Mode it cures**: A broken communication channel survived six cycles because a secondary relay quietly carried the traffic; guards that silently skip must emit skip-telemetry or their skips are indistinguishable from health.

**How to Apply**: Instrument every fallback and guard-skip with a named telemetry event (a `*.skip{reason}` sink). Periodically grep the sink: a busy fallback IS the diagnosis. When designing redundancy, decide which path is primary and alarm on inversion.

Theme: field-laws
Recurrence: two tiers — the accidental-second-door incident plus the standing skip-telemetry discipline

## OC-12 · Cure One Layer at a Time; Keep Faults Loud

**The Law**: **Cure a gate and expect the drop to name the NEXT gate — one layer per cycle with guard telemetry compounding; keep genuine faults loud, and let niceties fail soft, because a nicety's absence must never cost the payload.**

**The Failure Mode it cures**: Attempting to theorize the whole failure stack at once; conversely, a decorative attribution check silently discarding real payloads; seven sequential per-layer failures each correct in isolation (the integration-untested seam class) mistaken for one bug.

**How to Apply**: Fix the named layer, re-run, read which guard fires next — the walk down IS the diagnosis. Triage every guard: does its failure protect the user (keep loud, fail the operation) or merely decorate (log and deliver anyway)? Severity-proportionality is a design decision, not an accident.

Theme: field-laws
Recurrence: a four-layer reference arc in one tier; the seam class named across two others

## OC-13 · Test the Non-Pointer Citizen

**The Law**: **In any multi-instance system with a single active pointer, run the closing test against a NON-pointer instance — the pointer's own tests pass always.**

**The Failure Mode it cures**: Chimera systems that work only for the currently-selected instance; multi-tenant features validated exclusively on the tenant the developer happened to have active; the second citizen exposing what the first never could (single-stride resource allocation blind to the reflected neighbor).

**How to Apply**: Stand up at least two live instances before declaring a multi-party feature proven. Route the verification through the one the pointer does NOT reference. Treat "works for the active one" as untested.

Theme: field-laws
Recurrence: named as the two-live Lambda in one tier; resource-allocation corollary in the same span

## OC-14 · Absence Is a State

**The Law**: **Missing is not empty and empty is not null — model each as a first-class state, render honest absence rather than silently falling through to a default, and normalize sparse-map reads at every compare.**

**The Failure Mode it cures**: A record missing a key read as "no value" when it meant "not yet arrived"; a stale cache shadowing an honestly-empty ground because empty fell through to null; the eternal-discard bug where `undefined !== 0` deafened every never-initialized entry from birth — and telemetry that printed the normalized value while the compare consumed the raw.

**How to Apply**: Distinguish not-yet-known / known-empty / known-value in every schema. Render "(nothing here)" honestly instead of letting old data shadow. At every read of a sparse map used in a comparison, normalize (`value ?? 0`) — and make the telemetry print exactly what the compare consumes. A standing subscription must never silently fall back to a default source (the honest-absence rule).

Theme: field-laws
Recurrence: three tiers — both faces named, then the one-token normalize cure paid the whole class

## OC-15 · The Ask Identifies the Answer

**The Law**: **Every async answer must carry the identity of its ask — stamp an epoch/target at request start and discard any landing whose ask no longer matches; and never cache a promise without a settle path.**

**The Failure Mode it cures**: A target flipped mid-flight and the stale response landed as truth; discards keyed on side-signals produced false positives until generation-only matching made them exact; a cached unsettled promise wedged every later caller when the first attempt hung.

**How to Apply**: Bump a generation counter as step one of every re-point; in-flight responses compare their captured generation and self-discard on mismatch. Cache the VALUE after settle (or clear on rejection), never the promise. Every await between a user gesture and a dispatch gets a race-bound ceiling.

Theme: field-laws
Recurrence: three separate races across two tiers converged on the generation pattern

## OC-16 · Push Needs a Pull Partner

**The Law**: **A push relay alone is not a hydration strategy — every relay-fed surface needs an on-mount fetch partner, and the fetch must carry the same truth the relay composes.**

**The Failure Mode it cures**: Surfaces born blank because the broadcast channel does not replay on connect; a page that misses one relay computing effective state wrongly forever; grep revealed endpoints that no caller ever fetched (the uncalled-Lambda).

**How to Apply**: For every live-update surface, implement mount-time GET + subscription, not either alone. Keep hydration parity: derive the GET response from the same reads the relay uses, so a relay-less mount still computes correctly. Grep each new endpoint for at least one caller before declaring it wired.

Theme: field-laws
Recurrence: diagnosed as a class in one tier ("every relay-fed page needs its partner"), parity law re-proved later

## OC-17 · One Surface Operates; Every Item Has an Owner

**The Law**: **When two surfaces could operate the same state, demote one to a read-only mirror — divergence dies when only one operates; and no filter may make an item invisible on EVERY surface — each item keeps at least one owning surface.**

**The Failure Mode it cures**: Two selectors drifting apart on the same setting; strict attribution filters that made mislabeled work vanish everywhere (correct against intent, brittle against known mislabeling).

**How to Apply**: Choose the single operational surface; every other rendering of that state is explicitly a mirror. Admission to a ledger stays broad; locality/attribution filtering happens only at render, and a first-seen-here flag guarantees the originating surface always shows its own work.

Theme: field-laws
Recurrence: coupling law and visibility law named in the same tier, both preserved thereafter

## OC-18 · When Workarounds Stack, Take the Native Path

**The Law**: **When workarounds against a platform limitation keep failing, the simplest thing the platform does natively wins — prune the apparatus.**

**The Failure Mode it cures**: Four successive workaround generations (directive, component, overlay, relay) built against a rendering limitation, all replaced by one character of plain text that rendered natively; sunk-cost accumulation of compensating machinery.

**How to Apply**: After the second failed workaround, stop and ask what the platform renders/does natively that could carry the requirement, even in reduced form. Prefer the native reduced form over the faithful simulated one. Prune the whole apparatus when the native path lands — do not keep it "just in case".

Theme: field-laws
Recurrence: one decisive arc, promoted to named law and cited in later UI decisions

## OC-19 · Safety Nets Are Not Fast Paths

**The Law**: **Differentiate the safety net from the confirmed path at design time — a confirmed event bypasses the grace window; and an automated failsafe must never claim a failure a clock cannot prove — give the benefit of the doubt to the user, prefer informational pacing over auto-revert.**

**The Failure Mode it cures**: A universal grace window made confirmed exits incur phantom latency; a deadline-based auto-revert declared failure on work that was merely slow, seizing agency the user never delegated; beat-gated deadline checks that were polls in disguise.

**How to Apply**: Reserve timers for the unconfirmable crash case only; any positively-signaled completion takes the immediate path. Before shipping an automatic revert, ask what the timer actually proves — if only "time passed", surface a status instead and let the user decide. Model grace as observable state, not a hidden timeout.

Theme: field-laws
Recurrence: the over-tight grace lesson (early tier) and the user-agency correction (late tier) — same law, both ends

## OC-20 · Serialize Multi-Writer State at Birth

**The Law**: **Any state with a load-modify-write cycle and more than one possible caller gets serialization (a mutex or write-chain) designed in from the first version — retrofitting after the race costs more.**

**The Failure Mode it cures**: Rapid concurrent writers corrupting a registry because the mutex-free pattern was introduced when the path was cold and nobody revisited it when the path got hot; races that only manifest in the field's real concurrency.

**How to Apply**: A module-level promise chain (each write appends to the chain) is enough for in-process cases. For cross-process writes to a shared file, route all writers through a single owning process. Ask at design time: "who else could ever call this write?" — if the answer is anyone, serialize now.

Theme: field-laws
Recurrence: early-tier registry race plus the cross-process single-writer doctrine later — same law at two scales

## OC-21 · Calibrate Thresholds Against Observed Reality

**The Law**: **Boundary checks and thresholds are calibrated against actually-observed payloads, never theoretical minimums — research the empirical reality before setting the number.**

**The Failure Mode it cures**: A zero-byte "file has content" filter passed files that a tool writes kilobytes of boilerplate into before any real content exists; thresholds guessed from first principles that the field immediately falsified.

**How to Apply**: Before picking a threshold, measure what the real system actually produces in the empty case and the minimal-real case; set the boundary between them. When intent is complex and options exist, a targeted web search for the empirical behavior beats reasoning from the spec.

Theme: field-laws
Recurrence: two tiers — the threshold recalibration plus the evidence-before-decision pattern it seeded

## OC-22 · Drain What You Spawn; Backstop What Blocks

**The Law**: **Never spawn a child process with piped output you will not consume — an undrained pipe buffer deadlocks the child; and any single blocking external call in a long-lived process needs a prompt-disable plus a hard kill backstop.**

**The Failure Mode it cures**: A package install froze the whole application because its unconsumed output filled the OS pipe buffer and blocked on write; a hung remote-transport subprocess held the event loop for minutes — the process accepted connections and answered none, while a giant frozen log hid the window.

**How to Apply**: Spawn with output ignored or drained to a log file when it will not be read. For any synchronous/blocking external exec inside a serving process, disable interactive prompts via environment and wrap with a timeout that kills the child. Fail fast beats freeze.

Theme: field-laws
Recurrence: two independent freezes, tiers apart, same underlying physics

## OC-23 · Watcher Lifecycle Laws

**The Law**: **Never single-file-watch an atomically-renamed file — watch the parent directory with a basename filter; re-point subscriptions in strict order (bump generation → clear timers → close old handles → publish seat → arm fresh); and the RELEASE direction is the safety-critical one — re-point home synchronously at the edge.**

**The Failure Mode it cures**: Watchers that go permanently deaf after the first atomic save; re-arm races where the old handle's late event corrupts the new target; a foreign watch left standing on an unproven trigger, orphaning the surface; a momentary 0-byte read during a writer's replace cycle relayed as truth.

**How to Apply**: Parent-dir watch at depth zero plus basename match, always. Encode the five-step re-point order as one function; never inline it twice. Make release/teardown synchronous and armor-wrapped at the closing edge, while the arming direction may ride the async sweep. Guard the mass-zero read: an empty read over a non-empty prior retries once after a settle window before relaying.

Theme: field-laws
Recurrence: the atomic-rename law (grounded in external research), the re-point order, and the release asymmetry each proved in separate cycles

## OC-24 · Self-Modifying Systems Keep a Clean Room

**The Law**: **A system that builds itself out needs a ready return to the clean room — a fully-committed revert anchor with all work on a fork; and everything reachable from a copy/fork surface must be token-free or routed through a held canonical stratum.**

**The Failure Mode it cures**: Self-extension with no proven way back when the extension breaks the extender; forked/templated code where rename tokens (identifiers, endpoints, registry field names — all three dimensions proved) silently break every copy; N copies each needing the same fix.

**How to Apply**: Anchor-and-fork: the anchor stays committed and pristine; all drift happens on the fork; the failsafe path back to the anchor is tested, not assumed. For template/copy surfaces: shared files carry no rename-hazard tokens; every shared key a copy reads routes through one held model; canonical held components mean one edit serves every copy (the lending dividend). Mirror into copies only through a byte-proven transform, never by hand.

Theme: field-laws
Recurrence: the clean-room insight named at one epoch's culmination; the token-isolation law proved three independent ways in another

## OC-25 · Parallel Grounding Needs Disjoint Write Scopes

**The Law**: **Dispatch exploration agents concurrently only when their write targets are disjoint — parallel reads compose freely; parallel writes to shared ground collide.**

**The Failure Mode it cures**: Sequential grounding at triple the wall-clock when the reads were independent; conversely, concurrent agents trampling one shared document.

**How to Apply**: Before a parallel dispatch, assign each agent its own output file or section. Reads may overlap arbitrarily. Synthesize the returns in the main thread afterward. A stable trio-or-quartet of grounding roles (shape-finder, namer, architect, orchestrator) reused every cycle beats bespoke dispatch design each time.

Theme: salvo-practice
Recurrence: proven reliable across a dozen-plus cycles in multiple tiers

## OC-26 · Synthesis Is Structural, Not Erasive

**The Law**: **When two grounding returns disagree, neither is wrong — adopt each where its bias fits (durable-state where semantic clarity warrants; ephemeral-composition where state debt is real) and document the synthesis decision at the synthesis turn.**

**The Failure Mode it cures**: Picking a winner and discarding the loser's valid half; undocumented reconciliations that get re-litigated cycles later; grounding returns treated as votes instead of lenses.

**How to Apply**: Name each return's characteristic bias. Resolve per-decision, not per-agent. Write the reconciliation and its reason into the working board the same turn it happens. Returns that arrive in non-canonical order get a designated mid-flight calibrator rather than being forced into sequence.

Theme: salvo-practice
Recurrence: four reconciliations in one macro span; the discipline carried forward by name

## OC-27 · Pivot to the Smallest Atomic Shippable

**The Law**: **When scope exceeds the iteration's budget, pivot to the smallest atomic surface that still advances the contract — every cycle produces a shippable unit, and the grounding returns for the deferred scope are kept as authoritative substrate, never discarded.**

**The Failure Mode it cures**: Cycles that end with nothing landed because the original ambition didn't fit; deferred work whose research has to be redone because the returns were thrown away with the scope.

**How to Apply**: At the moment the budget-overrun is recognized, choose the minimal slice that is complete and true on its own. Bank the unused grounding as named substrate for the successor cycle. A long unbroken streak of atomic-shippable cycles is the health metric of the practice.

Theme: salvo-practice
Recurrence: fourteen consecutive cycles in one macro; the most durable pattern of its tier

## OC-28 · Defer the Heavy Behind an Identical Contract

**The Law**: **Simulate the heavy integration behind a contract identical to the real one — same type signature, same payload shape — so a later cycle swaps one file with zero contract delta; declare all placeholder slots at the foundation and fire a closure marker when the last is filled.**

**The Failure Mode it cures**: Real OS/network integration blocking every dependent cycle; retroactive type expansion rippling mid-cascade because slots weren't reserved; simulation stubs that drifted from the real shape and made the swap a rewrite.

**How to Apply**: Name each simulation gate and its designated swap cycle. The simulated and real implementations share the exact identifier and payload contract. Declare forward types at the concept-foundation moment; actualize slots in later cycles; track fill-completion explicitly so nothing stays simulated by accident.

Theme: salvo-practice
Recurrence: a five-member gate family plus the slot-reserve pattern, both carried by name across macros

## OC-29 · Gate Every Wave; Grep the Runtime Registry

**The Law**: **In a multi-wave build, run a cheap compile Concluder per wave; and after creating any new unit, grep the runtime registration point — typecheck-passes-runtime-fails is a silent gap.**

**The Failure Mode it cures**: Errors compounding across waves until the final gate drowns in them; a fully type-correct concept that never loads because it was never added to the creators/registry list — invisible until runtime.

**How to Apply**: One no-emit typecheck at each wave boundary keeps the error surface one wave wide. Maintain awareness of every "list of things the runtime actually loads" (registries, creator arrays, route tables, export barrels) and grep the new unit's name into them before declaring the wave done.

Theme: salvo-practice
Recurrence: a hundred-plus wave gates passed in one macro; the registration check caught the gap both retroactively and proactively

## OC-30 · Keep the Plan and the Record Apart

**The Law**: **Maintain two documents: the plan (changes freely, prunable, aspirational) and the record (append-only history of what verifiably happened) — the record survives compaction and session death; prior records are never deleted, only menu'd.**

**The Failure Mode it cures**: Sessions that reset instead of resume; plans rewritten over the evidence of what actually occurred; context compression destroying the only copy of hard-won diagnoses.

**How to Apply**: Every cycle's diagnosis appends to the record document. Session start reads the record before anything else. When either document exceeds its size/complexity threshold, open a fresh tier that carries forward only pending items and a compressed summation — with the prior tier preserved intact and enumerated in a menu without loading it.

Theme: ri-practice
Recurrence: the structural spine of the entire thirty-tier record

## OC-31 · Blueprint Before Build

**The Law**: **The board carries the approved design before a single line lands — commit the plan document first, then build against it.**

**The Failure Mode it cures**: Sweeping changes discovered mid-flight to have no agreed shape; review happening after the code exists, when pushback is expensive; the builder's improvisation mistaken for the design.

**How to Apply**: For any multi-file or architectural change, author the design document, get it approved (by the user or the review gate), commit it, then implement. The reference proofs: a many-hundred-line design authored and approved before its system's first line; every major dispatch in late tiers committed its plan first.

Theme: ri-practice
Recurrence: MAINTAIN-preserved across at least three consecutive tiers by name

## OC-32 · Close Every Cycle in Three Steps

**The Law**: **When the cycle-end diagnosis fires: (1) append Gainy/Lossy/Maintain to the record, (2) checkpoint-commit the work, (3) update the board's tasks — no state may exist where the diagnosis fired and the record is unchanged.**

**The Failure Mode it cures**: Diagnoses spoken but never written (lost at the next compaction); commits missing so the record cites unreachable states; boards drifting from reality because closure was partial.

**How to Apply**: Treat the three steps as one atomic close. Gainy = promote to method; Lossy = prune and say why; Maintain = preserve deliberately. A one-line clinical note per firing keeps the record scannable. Read the append back after writing it.

Theme: ri-practice
Recurrence: the invariant of every tier close in the record

## OC-33 · Discoveries Become Cards, Not Scope

**The Law**: **Build within the committed scope; every discovery made mid-build becomes a named pending card, not an expansion of the current cycle.**

**The Failure Mode it cures**: Scope leak dissolving the atomic-shippable guarantee; discovered work done immediately and badly because it had no plan; discoveries lost entirely because they were neither done nor recorded.

**How to Apply**: The moment something out-of-scope surfaces, write it as a named card with enough context to resume cold, and return to scope. Carried-pending lists transfer across tiers explicitly. Deferral with a name is preservation; deferral without a name is loss.

Theme: ri-practice
Recurrence: standing discipline across the record; pending ledgers carried through every tier transition

## OC-34 · Sweep Stale Doctrine

**The Law**: **A standing suppression or doctrine can outlive the machinery that obsoleted it — periodically sweep every banked law against the current reality it presumes.**

**The Failure Mode it cures**: A capability held disabled by a doctrine written when the enabling machinery didn't exist yet — the machinery landed, the doctrine stood, and the feature stayed dead for epochs.

**How to Apply**: Every banked law carries its premise. When a structural change lands, grep the law bank for doctrines whose premise it touches. Keep "stale-doctrine sweep" as a standing maintenance card, not a one-time audit.

Theme: ri-practice
Recurrence: named as a law-class in a late tier after one suppression outlived three generations of its obsoleting machinery

## OC-35 · Never Guess; Ask as the Last Rung

**The Law**: **When a required datum is absent, never fabricate it — but ASK is the LAST rung of a resolution ladder: the system first exhausts its own self-resolution paths, so the user never needs to know internals.**

**The Failure Mode it cures**: Guessed paths and identities writing state into the wrong home; and the opposite failure — blocking the user with questions the system's own records could have answered. The never-guess law proved itself twice in one cycle: once by correctly omitting, once by correctly holding.

**How to Apply**: Build the ladder explicitly: own declared state → discovery/registry records → derivation from environment → ASK. Refusing to guess is correct even when it stalls; the cure for the stall is a longer ladder, not a guess. Where the user must decide, gather the empirical evidence first so the question is well-formed.

Theme: conference-practice
Recurrence: the ask-law held across a newborn-instance arc; the ladder became structure the following cycle

## OC-36 · User Semantics Override the General Law

**The Law**: **When the user's stated semantics conflict with a general design law, the user's semantics win locally — the general law stands, the local exception is honored and recorded.**

**The Failure Mode it cures**: Doctrinaire application of banked laws steamrolling the user's actual intent; and the mirror failure — silently dropping the general law instead of recording a scoped exception.

**How to Apply**: State the conflict aloud, apply the user's ruling in the local scope, and write both (the law and the exception with its reason) into the record. The exception is data: repeated exceptions on the same law mean the law is wrong.

Theme: conference-practice
Recurrence: applied by name at least twice in the record ("the user's semantics over the general law")

## OC-37 · Teach in the Tool Description

**The Law**: **A tool's description is an agent-facing propagation surface — teach new required behavior in the description BEFORE enforcement lands, and remember the positional seed prompt outranks any appended envelope.**

**The Failure Mode it cures**: Agents violating a new convention they were never told about, then hard-failing when enforcement arrived; flow changes landed in downstream strategy layers while the primary directive still taught the old flow.

**How to Apply**: Sequence rollouts: description teaches → grace period → enforcement rejects. Every behavioral change must land in the primary directive (the seed/system prompt), not only in later-stage machinery — the agent obeys its positional directive over appended instructions.

Theme: conference-practice
Recurrence: two tiers — the description-first rollout and the seed-is-primary law

## OC-38 · Every Flow Carries Its Failure Branches

**The Law**: **An automated sequence is only production-real when every step has an explicit failure branch that CONTAINS: a dead entry skips its own downstream, names its guard, and the next entry proceeds — and the final acknowledgment reports honest counts (attempted, succeeded, missed).**

**The Failure Mode it cures**: One failing entry concluding an entire sweep; silent partial completion reported as total success; failure handling improvised at the crash site instead of designed into the plan.

**How to Apply**: Armor per-entry (try/catch around each unit of a sweep) so no single failure propagates. Design each step's failure branch when the plan is written, not when it fires. Acknowledgments carry counts, not adjectives.

Theme: vermillion-practice
Recurrence: the contained-failure pattern and the sweep-armor law, named in separate tiers, same shape

## OC-39 · Refresh Long-Lived Intent at Fire Time

**The Law**: **Any queued or long-deferred action must be re-validated and refreshed at the moment it fires — validity windows default short, and a stale intent dispatched raw is silently dropped or wrongly applied.**

**The Failure Mode it cures**: Deferred continuations silently discarded because their validity expired while waiting (the tell: the final handler simply never runs); long deadlines "legalized" only by refreshing the head at dispatch; state captured at queue time acted on at fire time after the world changed.

**How to Apply**: Construct or refresh the action inside the timer/queue callback, not before it. Snapshot fire-relevant state at press/fire time (a `targetAtPress` pattern) when the target can change between gesture and execution. Give every deferred mechanism an explicit validity window and a refresh step.

Theme: vermillion-practice
Recurrence: the expiration class diagnosed in the framework substrate, then re-paid in the application tiers

## OC-40 · Match the Ceremony to the Scope

**The Law**: **Single-file, small-line-count, or explicitly-instructed changes go direct — below the ceremony threshold, cascade overhead is waste; above it, skipping the full arc collapses the wave.**

**The Failure Mode it cures**: Full multi-band dispatch for a typo; and the mirror: sweeping multi-file changes attempted as quick edits, discovering mid-flight they needed grounding, planning, and verification that was never done.

**How to Apply**: Name the threshold (roughly: one file, tens of lines, unambiguous instruction → direct). Announce the chosen engagement depth before acting and self-correct if the work grows past it. Depth of actualization selects the length of the arc; complexity selects the dispatch mode.

Theme: vermillion-practice
Recurrence: codified early ("below the ceremony threshold") and held as the routing table's directness rule throughout

---

**Card count**: 40 · lambda-discipline 8 · field-laws 16 · salvo-practice 5 · ri-practice 5 · conference-practice 3 · vermillion-practice 3
