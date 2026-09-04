# MEMORY METHOD CARDS (SP-1 Band A · generalized at the source)

Case law distilled from acquired operational memory. Every card is method-only: the project that minted it has been stripped at the source. Each card = The Law · The Failure Mode it cures · How to Apply · Theme.

---

## MC-1 · Absolute Path Anchoring

**The Law**: **Shell working directory persists between tool calls and drifts unpredictably across a session — anchor every state-changing command absolutely.**

**The Failure Mode it cures**: A compound command cd's into a subdirectory for a build gate; a later repo-relative git operation resolves from inside it, doubling the path and failing with a fatal pathspec error — repeatedly, in the same session.

**How to Apply**: Use `git -C <absolute-root>` for every git operation inside compounds; start compounds with an explicit `cd <absolute-root> &&`; never place a repo-relative path after any segment that changed cwd. After any gate-run that cd'd elsewhere, treat the shell as dirty and re-anchor absolutely before the next file or git operation.

Theme: lambda-discipline

---

## MC-2 · Pin the Ground in Every Agent Brief

**The Law**: **In multi-directory workspaces, every dispatched agent brief pins the absolute repo root and exact file paths — and any agent claim that something does not exist is existence-verified before it is trusted.**

**The Failure Mode it cures**: Sibling repos sharing directory conventions and near-identical concept names pull a dispatched agent into the wrong repo, where it invents components and tables that belong to the sibling — twice, from briefs that named only relative paths.

**How to Apply**: (1) State the absolute repo root plus the specific file/component path in every sub-agent brief. (2) When an agent returns "it doesn't exist / build from zero," grep the symbol in the intended repo BEFORE acting on the claim. (3) Prefer re-grounding in-repo yourself over re-dispatching a drifted agent.

Theme: lambda-discipline

---

## MC-3 · Push-Hold Scope Is Per-Epoch

**The Law**: **A push-hold ruling covers ALL pushes for that epoch — a prior epoch's exception never carries forward; local commits only until the user's explicit closing word.**

**The Failure Mode it cures**: Carrying a previous epoch's "mirrors are still pushed" habit into a new hold epoch and pushing unproven work while everything needed was already local.

**How to Apply**: At each epoch open, record the hold scope from the user's own words. Default = TOTAL hold (no push to any remote the work touches). Local commits remain fine — clean trees serve the proof discipline. Push only on the user's explicit release. Generalize: scope rulings are epoch-level, never standing defaults.

Theme: lambda-discipline

---

## MC-4 · Enumerated Counts Are Contracts

**The Law**: **When a governing document enumerates N deliverables, the output must slot all N — curation trims redundancy, never the stated program; count before designing.**

**The Failure Mode it cures**: Over-applying a prior lesson ("data belongs in tables") to collapse a document's enumerated visual program into one table — pruning deliverables the source explicitly specified, caught only by the user counting.

**How to Apply**: Before building from any specification, run a counting Concluder (`grep -c` the deliverable markers, or read the production notes) and make the layout slot exactly that many. If you intend to collapse, merge, or omit any stated item, surface it as an explicit Conference decision — never decide it silently. A per-slot fill flag (slug + boolean) makes multi-pass completion mechanical and resumable.

Theme: lambda-discipline

---

## MC-5 · Per-Effect Telemetry Verification

**The Law**: **When a mechanism claims two effects (e.g. "updates locally AND broadcasts"), verify each effect with its own telemetry — a log or artifact that fires only if that specific effect ran.**

**The Failure Mode it cures**: A relay mechanism documented as "dual-deployment" actually only broadcast; the local state never updated, downstream watchers never fired, and the header comment masked the gap for a full diagnosis cycle.

**How to Apply**: Place a named log inside each effect path (the reducer, the handler, the writer). The test is binary: does THIS log appear when the trigger fires? Zero appearances = that effect does not run, regardless of what the documentation says. Never accept a comment or a description as evidence of an effect.

Theme: lambda-discipline

---

## MC-6 · Never Silence the Failure Signal

**The Law**: **Every silent early-return in a signal handler emits a named skip event, and no build or gate command is piped through filters that mask its exit code.**

**The Failure Mode it cures**: Guards that self-reject silently hid a cross-process bug twice — the handler ran, declined, and left no trace. Separately, piping a build through `| tail` masked a failing exit code as apparent success.

**How to Apply**: (1) Every guard's decline path emits `*.skip{reason}` telemetry to a known sink. (2) Run gates bare, check `$?`, and only then filter output. (3) Treat "no output" as unverified, never as success — silence is the most expensive failure signature there is.

Theme: lambda-discipline

---

## MC-7 · The Staleness Family (Process · Fixture · Cache)

**The Law**: **Rebuilding files never updates a running process, an existing install, or a cached asset — identify which staleness layer you are testing through, and refresh it before trusting any result.**

**The Failure Mode it cures**: (a) A singleton background process kept serving launch-time code across nine consecutive install tests while the rebuilt bundle sat unused on disk. (b) A fix that changes install-time artifacts was "re-tested" against a pre-fix install that could never carry it. (c) An overwritten public asset kept serving stale bytes from browser cache, making a correct fix look broken.

**How to Apply**: (1) Fully quit/kill long-running singletons before relaunch; plant a freshness signal (a log event only new code emits) and grep for it before believing any test. (2) When a fix changes what an installer stamps, re-test with a FRESH install. (3) When an asset fix "won't show," write to a NEW filename and repoint the reference. (4) A stale dev server holds pre-edit modules — force its restart (verify the pid changed) before trusting a probe.

Theme: lambda-discipline

---

## MC-8 · Dead Ends Are Recorded, Not Re-Attempted

**The Law**: **An approach that failed twice and was pruned is recorded with its root cause — and never re-synthesized; prefer configuring behavior at spawn over simulating user input into a running program.**

**The Failure Mode it cures**: Re-attempting a synthesized keyboard toggle into a spawned program after it had already been walked to ground twice; re-attempting an env-var injection into the wrong process after it had failed twice.

**How to Apply**: When pruning a failed approach, write down: what was tried, why it structurally cannot work, and what the working alternative is. Before proposing any mechanism, check the dead-end record. The general shape of the cure: set the mode/identity/config at spawn time (flags, config files, payload-carried identity) rather than injecting signals into a live process after the fact.

Theme: lambda-discipline

---

## MC-9 · Verify Process Topology Before Trusting Handles

**The Law**: **Confirm with live telemetry how many processes the system actually runs before assuming an in-process handle works — cross-process signals ride watched files, not direct dispatch.**

**The Failure Mode it cures**: A dispatch from one process's event handler silently no-op'd because the runtime it addressed lived in a different process; the topology assumption was "corrected" the wrong way once and cost three diagnostic rounds.

**How to Apply**: Emit a telemetry event where the handle is obtained (`null` handle = different process — the proof). For cross-process signaling, write to a watched file the other process observes; dedupe with timestamps/watermarks; keep each file single-writer (MC-11). Keep a direct-dispatch fast path only where a same-process mode genuinely exists — never as the sole path.

Theme: field-laws

---

## MC-10 · The Atomic-Rename Watch Law

**The Law**: **Never file-watch a single file that writers replace via tmp-write + rename — the inode swap silently kills the watch; watch the parent directory and filter by basename.**

**The Failure Mode it cures**: A watcher's initial read worked, then change events never fired again — because atomic-rename replacement swapped the inode out from under the single-file watch.

**How to Apply**: Watch the parent directory (depth 0) and filter events by basename in the handler. Assume any robust writer uses atomic tmp+rename (it should — see MC-11), so single-file watches are structurally unsafe in that ecosystem.

Theme: field-laws

---

## MC-11 · The Single-Writer Law

**The Law**: **Every shared state file has exactly ONE writing process; all other processes route writes through the owner via a tool/endpoint, with the shared extraction logic isolated in a pure model module.**

**The Failure Mode it cures**: A second concurrent writer to a shared registry file raced the first, producing the exact stale-data corruption the design was trying to eliminate.

**How to Apply**: Identify the owning process; expose a write operation on its service surface (tool call, endpoint); other processes trigger, never write. Writes are atomic (tmp+rename). Pure transformation logic lives in a dependency-free model file importable from either side, so the logic is shared while the write authority stays singular.

Theme: field-laws

---

## MC-12 · No Parallel Paths — Extend the Existing Structure

**The Law**: **Multiple entry points to the same behavior call the SAME underlying function, and a new variant inherits the existing baseline wholesale rather than forking a parallel implementation.**

**The Failure Mode it cures**: Parallel UI/tool code paths that diverge over time; a near-duplicate "variant envelope" about to be created when the existing baseline plus one small overlay was the whole requirement; a parallel table-of-contents inserted beside the document's existing routing section.

**How to Apply**: Before exposing a new entry point, verify all callers share one manager-layer function — refactor first if they don't. When designing a variant, start from "what does the baseline already do?" and add only the genuine delta behind a flag. When adding navigation or structure to a document, register into the existing structure rather than creating a sibling.

Theme: field-laws

---

## MC-13 · Source-of-Truth vs Derived View

**The Law**: **The authoritative state and its broadcast to derived views are two distinct effects — a relay mechanism that broadcasts does not maintain the local truth; always dispatch both.**

**The Failure Mode it cures**: Relying on a broadcast-only exchange to also update the authoritative side; local selectors never re-fired because the local state never changed, breaking the entire downstream reactive chain.

**How to Apply**: Designate one side Base (source of truth, maintained by the event watcher) and the other Informative (derived, synchronized by explicit broadcast). Every state-changing event dispatches BOTH a local Base-maintenance action AND a propagation action, side by side. Verify with per-effect telemetry (MC-5).

Theme: field-laws

---

## MC-14 · Structural Serialization Over Timers; Timers Only for Invisible Gaps

**The Law**: **Correctness serialization is structural (block flag set synchronously → async work → explicit unblock → a draining observer), never timer-based; fixed short timers are reserved for sub-perceptible bounded UX gaps where precision would be debt.**

**The Failure Mode it cures**: A timer proposed as an async completion signal races the real operation and can collide (two exclusive operations overlapping). Inversely: a multi-phase hook-driven watcher was engineered for a ~100ms render gap the user could never perceive.

**How to Apply**: For exclusive-resource async queues: the operation's own resolution triggers the unblock; the queue stores actual ready-to-fire actions; the drain observer fires the next head only when unblocked; empty queue = quiescent (MC-17). For fire-X-after-Y UX problems, first ask: is the gap small and bounded (paint cycle, OS event registration)? If yes, a fixed 50-200ms delay is the correct engineering — invisible to the user is a valid decision criterion.

Theme: field-laws

---

## MC-15 · Async Validity Windows

**The Law**: **Any async operation that outlives a framework's default action/message validity is silently dropped at completion — extend the validity at creation AND refresh the token at resolve time.**

**The Failure Mode it cures**: A long-running clone completed, fired its success signal on an expired action, and the runtime dropped it silently — no error anywhere; the strategy stalled six diagnostic layers deep. The tell: a completion handler that verifiably never runs.

**How to Apply**: For any node whose work awaits real duration (clone, spawn, network, build): set the validity/agreement window generously at creation, and inside the resolve callback re-derive a live token (refresh) before firing completion. Learn your framework's default expiration number — a silent drop with no error is the signature of crossing it.

Theme: field-laws

---

## MC-16 · The Absent-Boolean Coercion Trap

**The Law**: **In frameworks that coerce an absent optional boolean prop to `false` (not `undefined`), any `?? autoDefault` fallback on it is dead code — phrase such props as opt-OUT negatives so absence works in your favor.**

**The Failure Mode it cures**: A default-padding branch and a default-styling branch that never fired — twice, in two components — because `absent → false` and `??` only falls through on null/undefined; each cost a diagnosis cycle disguised as a styling bug.

**How to Apply**: Never write `props.someBool ?? computed Default` on an optional boolean. Either require the value explicitly at every call site, or invert to `noFeature?: boolean` so `feature = !noFeature && condition` behaves correctly when absent. Audit this pattern any time a "default" visual behavior mysteriously never applies.

Theme: field-laws

---

## MC-17 · Loops Are Designed to Halt

**The Law**: **Every persistent loop, watcher, or autonomous iteration carries a structural halt condition — empty queue, budget reached, work list exhausted — never unbounded continuation.**

**The Failure Mode it cures**: Framing capacity as unbounded produces spin-loops, runaway iteration, and designs that fight halting-protection features instead of using them; "unbounded" is the anti-pattern, not the aspiration.

**How to Apply**: When authoring any loop: name its halt predicate first (queue-empty OR N iterations OR user word). When a framework kills a persistent plan by design, opt out explicitly and narrowly (its sanctioned bypass), don't route around the whole protection mechanism. Halting on error is a designed property — preserve it.

Theme: field-laws

---

## MC-18 · Sweep Protection Enumeration

**The Law**: **Before any global term-rename sweep, enumerate the protected compounds that share the token but carry a different meaning — the enumeration precedes the swap.**

**The Failure Mode it cures**: A vocabulary sweep renaming a common token silently rewrites foundational compound terms that merely contain the same word, corrupting meaning across the corpus.

**How to Apply**: Grep the token, classify every compound hit as swap vs protect, write the protect-list into the sweep instructions, then execute. Future sweeps inherit the protect-list. Never run a bare find-replace on a load-bearing word.

Theme: field-laws

---

## MC-19 · Names Can Be Aspects, Not Collisions

**The Law**: **Multiple names for the same underlying record are not automatically a defect — they may encode genuinely different semantic aspects; do not unify naming that reflects real contextual difference.**

**The Failure Mode it cures**: "Fixing" a perceived naming collision erases the semantic information each context-specific name carried (the storage name, the composition-facing name, the archive-facing name).

**How to Apply**: When you find N names for one row/record, first ask whether each name reflects a distinct usage context. If yes, document the mapping and use each name in its own context. Unify only when the names are true accidental duplicates with identical semantics.

Theme: field-laws

---

## MC-20 · Doctrine Lives in Its Maintenance Layer

**The Law**: **Prompt text, protocol doctrine, and instruction content live in the system built to maintain them — never inlined as string constants in application code.**

**The Failure Mode it cures**: Hardcoded instruction strings fragment the single source of truth, forcing dual maintenance (code + the real instruction store) and corroding the boundary that keeps composition data-driven.

**How to Apply**: When new doctrine is needed, create it as a row/document in the instruction layer; the code's job is fetch + assemble, never carry. If assembly needs new orchestration (composing two instruction sets), extend the assembly logic — not the inline strings. Ask "what maintained domain owns this doctrine?"; if none, create the domain, don't inline the text.

Theme: field-laws

---

## MC-21 · Deterministic Precision, Generative Aesthetics

**The Law**: **In hybrid asset pipelines, deterministic tooling does the precision (geometry, alignment, placement, typography) and the generative model does the aesthetics (blend, bloom, style) — never ask a generative model to preserve exact scale or placement.**

**The Failure Mode it cures**: A generative refine pass asked to "tie together" a hand-assembled scene re-interpreted and normalized everything — shrinking intentionally-scaled elements no matter how hard the prompt locked them; generated text degraded across refine passes.

**How to Apply**: Margins/crops/scale/aspect = deterministic image ops, never a regen. Alignment-locked assemblies = composite vector replacements deterministically, then (optionally) run a light generative "polish ONLY what is already here, change nothing else" pass on the clean base — and verify with a contact-sheet crop before accepting, falling back to the pre-pass image on drift. Premium in-image type = bake a vector wordmark deterministically after erasing generated text.

Theme: field-laws

---

## MC-22 · Enumerate the Generative Spec, Assemble in Stages

**The Law**: **Multi-element generation drifts under vague slot specs — pin every position to an exact object AND state with one concrete subject throughout; build complex scenes in chained stages with the most fragile element placed LAST.**

**The Failure Mode it cures**: "Several items as stations" let the model fill arbitrarily (dropped items, varied subjects); fresh full-scene re-rolls kept losing the character's face; negative instructions alone ("not a turnaround") failed to prevent duplicate figures.

**How to Apply**: Write a shot-list enumerating each position strictly in order with a specific object + state; carry one concrete subject across all stages. Build in verified stages (base figure → key element → connecting effect → fragile detail last), each stage verified before the next. Ban unwanted content with explicit enumerated language and literal counts ("exactly one figure, no second person"), not abstractions. Prefer edit-don't-reroll: refine from the last good state rather than regenerating from zero.

Theme: field-laws

---

## MC-23 · Render Menus in the User's Medium

**The Law**: **Present decision menus in the form the user's actual input habits can operate — and in terminal-rendered markdown, plain markdown only: HTML entities render literally and deform the menu.**

**The Failure Mode it cures**: A structured question-tool picker collided with the user's editor muscle memory and got rejected twice in a row; `&nbsp;` indentation rendered as literal text in the user's terminal.

**How to Apply**: Default to inline markdown menus: numbered questions, lettered options, a recommended marker, and a one-line reply key ("reply 1A · 2B"). Keep options mutually exclusive and recommendation-first. Indent with markdown lists, never HTML entities. Use the structured tool only when the user asks for it.

Theme: conference-practice

---

## MC-24 · Audit Before Credential-Adjacent Code

**The Law**: **Before writing any client-side code that touches auth tokens, credentials, signed URLs, or session state, run a grounded security audit — multi-angle web research, written comparison of alternatives — and surface the recommendation before any code lands.**

**The Failure Mode it cures**: Starting to write token-handling client code on the strength of existing project precedent alone; even matching precedent deserves the audit, which either grounds the concern or documents why the pattern stands.

**How to Apply**: Trigger on: Authorization headers, stored tokens, object-URL creation from authenticated fetches, signed URLs, cookie/session logic, CSRF surface. Audit = at least 3 research angles + a written audit doc + each candidate pattern examined for what it reveals and what it risks. Implementation starts only after the recommendation is surfaced. Corollary discovered later the hard way: enforce allow-lists on EVERY write path that can mint a privilege, not just the happy path.

Theme: conference-practice

---

## MC-25 · Self-Owned App Testing Is Ordinary Work

**The Law**: **Branch management, window orchestration, and UI test automation of the user's OWN application on their own machine is ordinary development and testing — not security activity; do not hesitate, soften, or reframe it.**

**The Failure Mode it cures**: The same self-owned localhost test automation was security-flagged twice, stalling ordinary dev work with irrelevant dual-use analysis.

**How to Apply**: When the target is the user's own product, on their own machine, against throwaway test installs they created — treat "turn over / orchestrate / drive the window / stash / revert / hop" as the git and test-automation verbs they are. No security framing is relevant.

Theme: conference-practice

---

## MC-26 · Right-Size the Orchestration

**The Law**: **Small surgical changes take 2-3 direct file reads, not an exploration agent — if the read count fits in one or two parallel read calls, just do the reads.**

**The Failure Mode it cures**: Dispatching a discovery agent to map a surface the conversation already knew, adding orchestration overhead to a plan amendment that should have felt surgical at every step.

**How to Apply**: Direct reads when: ≤3 known files, small files, an internally-surgical change, amending (not initiating) a plan. An exploration agent when: genuinely uncertain scope, multiple unrelated areas, >5 reads to map, or cross-codebase pattern discovery. This is not about agent capability — it is about matching orchestration weight to task surface area.

Theme: conference-practice

---

## MC-27 · Honor User-Minted Vocabulary

**The Law**: **When the user mints a substitute term specifically to avoid a tool-triggering keyword, read the substitute as their intended concept — and never invoke the tool from the keyword alone.**

**The Failure Mode it cures**: A harness tool auto-reached-for because the user's sentence contained its trigger word, when the user had deliberately coined an alternative name to mean their own pipeline instead.

**How to Apply**: Maintain the user's substitute vocabulary as first-class. Tools are invoked on explicit opt-in in the user's own words, not on keyword resonance. When a user corrects a term choice, treat the correction as load-bearing naming, not preference.

Theme: conference-practice

---

## MC-28 · Amend the Active Log; Normalize Only the Active

**The Law**: **The active method-history document is amended in place — never split into a new file without explicit direction — and naming-convention normalization applies only to ACTIVE artifacts, never as a sweep across archives.**

**The Failure Mode it cures**: Splitting the living history at a size threshold fragments the router the renewal discipline depends on; renaming historical archives is churn without gain.

**How to Apply**: At each new engagement, open the current history document, add the new section, and update its signature table in place. New tier file ONLY when the user explicitly directs a rollover. When a naming convention changes, rename the currently-active documents (with history-preserving moves) and update cross-references in the same commit; archives keep their legacy names.

Theme: ri-practice

---

## MC-29 · Resume Is Not Renew

**The Law**: **Replay engines restore where you were (frozen outputs played back); renewal restores what the method learned — renewability is the diagnosis-writes-history circuit wrapped AROUND a run, never a feature of the engine.**

**The Failure Mode it cures**: Positioning an ephemeral orchestration engine as if it persisted method-learning across sessions; a bare pipeline is iteration, amnesiac across firings — it produces events but no learning document.

**How to Apply**: Never call a replayable pipeline "renewable." To make any orchestration renewable: read the prior learning document at open, pass it in as input, and make the final stage a diagnosis that writes Gainy/Lossy/Maintain back to the learning document — so the next run starts better-calibrated, not merely resumed.

Theme: ri-practice

---

## MC-30 · Distinct Lenses; Convergence Is the Signal

**The Law**: **Parallel salvo lanes are spread with deliberately distinct lenses (e.g. Fidelity / Fit / Budget) so synthesis reconciles genuine variation — and when independent lanes converge on the same finding, that convergence IS the validation.**

**The Failure Mode it cures**: N parallel agents with identical briefs return N restatements of one perspective — no variation to reconcile, no signal in agreement.

**How to Apply**: Give each parallel lane a named, different lens on the same target. At synthesis, weigh convergence heavily: independent agents arriving at the same two gaps is stronger evidence than any single agent's confidence. Divergence marks the genuine open decisions to surface to the user.

Theme: salvo-practice

---

## MC-31 · Staging Before Live, File-on-Disk Handoff

**The Law**: **Multi-agent synthesis writes to a STAGING artifact deployed to the live governing document only on the user's confirmation — and inter-stage handoff between salvo waves rides files on disk, one stage per turn, keeping the user in the loop.**

**The Failure Mode it cures**: Background orchestration engines that mutate governing documents directly, removing the user's test-gate; in-memory handoffs that evaporate between turns.

**How to Apply**: Each dispatched agent writes its deliverable to a working directory; the next wave reads those files. The final merge targets a staging file. Deployment to the live document is a separate, user-gated step (a claimed-complete state is TESTING, not Done). The orchestrator synthesizes between stages in the interactive session rather than delegating the whole arc to a detached engine.

Theme: salvo-practice

---

## MC-32 · Depth vs Breadth Selection

**The Law**: **Two dispatch shapes exist as siblings — the sequential-curried traversal (each function informs the next, one plan carried forward: depth) and the parallel salvo (all lanes at once, then synthesis: breadth) — choose deliberately per task.**

**The Failure Mode it cures**: Running the whole method as one undifferentiated procedure; using parallel breadth where cumulative context was the point, or a slow sequential chain where independent perspectives were the point.

**How to Apply**: Sequential-curried when each stage's output should feed the next (one carried document, curried context updated after each agent and injected into the next). Parallel salvo when independent blind perspectives should be reconciled (dispatch all, synthesize, then implement). Name which shape you are running before dispatching.

Theme: salvo-practice

---

## MC-33 · The Adversarial Verifier Earns Its Slot

**The Law**: **Include a dedicated adversarial verification lane in the standard cascade — a verifier that catches real defects in consecutive runs has earned a default slot.**

**The Failure Mode it cures**: Implementation waves that self-report success; without an adversarial pass, real bugs ride the claimed-complete state into the user's hands.

**How to Apply**: After implementation, dispatch a verification lane whose brief is to break the work (build it, read it hostile, probe the edges) rather than to summarize it. Track its catch rate; a lane that finds genuine defects repeatedly becomes non-optional. Single-file artifacts get a single writer — verification reads, it does not co-write.

Theme: salvo-practice

---

## MC-34 · The Dispatch Return Contract

**The Law**: **Every dispatched agent is told at dispatch time where its final return lands and that it must format for that destination while keeping its specialized voice — contracts layer recursively: each agent returns to its caller, only the outermost returns to the user.**

**The Failure Mode it cures**: Dispatched agents either surface raw internal working notes to the user, or flatten into a generic voice trying to sound presentable — losing both readability and the cognitive function's distinct value.

**How to Apply**: In every dispatch brief, state: (1) the working context is private and iterative; (2) the final return goes to [destination] and must be formatted for it; (3) the agent's specialized perspective is retained in that return. For nested dispatch, each inner return targets its dispatcher's working context, not the top.

Theme: vermillion-practice

---

## MC-35 · A-I Lead on Commands

**The Law**: **Every command or entry point parses its arguments through the Informative/Actionable split first — informational invocations (empty, "?", "status") read and explain, READ-ONLY; directional invocations act.**

**The Failure Mode it cures**: Commands that always execute, turning a status question into an unwanted run; or that always explain, forcing ceremony before action.

**How to Apply**: The first branch of any command skill: is the argument a question about state (→ read the state files and explain, touching nothing) or a direction (→ run)? Ambiguous cases surface a Conference choice rather than guessing. This mirrors the universal pattern: every cognitive step has an Informative aspect (gather/understand) and an Actionable aspect (decide/transform) — lead with the split.

Theme: vermillion-practice

---

*35 cards · generalized at the source · no project may be reconstructed from any card.*
