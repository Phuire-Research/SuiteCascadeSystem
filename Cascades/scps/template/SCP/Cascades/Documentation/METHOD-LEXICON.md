# THE METHOD LEXICON (operational definitions — what an agent DOES on receiving the term)

**This document is the citable vocabulary for dispatched briefs. A brief that uses these terms cites this file by path; an agent that receives a term it does not know resolves it HERE before acting.** The law behind the Lexicon: a dispatched agent does not share its dispatching session's memory — the Seed corpus feeds sessions; the Lexicon feeds briefs. Every entry answers one question only: what does an agent DO on receiving this term. Never etymology alone; never history.

---

## Salvo

**On receiving this term, an agent:**
1. Recognizes the parallel dispatch shape: several specialized agents fired at once, each with a deliberately distinct lens and a disjoint write target.
2. If dispatched INTO a Salvo: works its own lane only — its own lens, its own output file — and never touches a sibling lane's write target; parallel reads compose freely, parallel writes collide.
3. Formats its return for the parent's synthesis: the parent reconciles divergence per-decision, re-runs every gate, and owns staging and deploy — never the lane.
4. Treats convergence with sibling lanes as the validation signal and divergence as the genuine open decision to surface — not as a vote to win.

**Never:** self-synthesize across lanes, conclude the Salvo's overall work, or write into shared ground while siblings run.

*See:* `Cascades/Documentation/Seed/SEED-1-SALVO-PRACTICE.md`

## Salvo Pass

**On receiving this term, an agent:**
1. Locates the inscribed per-Diamond dispatch plan: the enumerated bands, each band's brief, and each band's Concluders — written down BEFORE any dispatch fires.
2. Reads its own band's row completely: lens, scope, write target, self-Concluder, return destination.
3. Executes exactly that row's scope; anything discovered outside it becomes a named pending card in the return, never an expansion of the band.
4. Runs the row's Concluder on completion and returns to the destination the Pass names — the Pass is the contract the dispatch is measured against.

**Never:** improvise a dispatch shape at fire time or drift outside the inscribed row.

*See:* `Cascades/Documentation/Seed/SEED-1-SALVO-PRACTICE.md` · `Cascades/Documentation/Seed/SEED-3-VERMILLION-PRACTICE.md`

## Band

**On receiving this term, an agent:**
1. Reads it as one unit of dispatched work: one agent, one cognitive function, one brief, one return contract.
2. Holds the cognitive function it was cast as — the specialized voice IS the value; it does not flatten into generic analysis.
3. Executes the brief's Informative aspect first (gather, read, ground), then its Actionable aspect (decide, transform, produce), inside the band's scope.
4. Returns in the contracted shape to the contracted destination — its caller's working context, not the user, unless the band is outermost.

**Never:** exceed the band's single function or surface raw internal working notes upward.

*See:* `Cascades/Documentation/Seed/SEED-3-VERMILLION-PRACTICE.md` · `Cascades/Documentation/Seed/SEED-1-SALVO-PRACTICE.md`

## Brief

**On receiving this term — that is, on being dispatched with one — an agent:**
1. Verifies the brief pins absolute paths: the repo root and the exact files; if any path is relative or absent, resolves it against the pinned ground before acting — never by guess.
2. Extracts the binding contract parts: scope, output target, self-Concluder, return shape.
3. Works only within the pinned ground; any conclusion that something "does not exist" is existence-verified (grep in the pinned root) before it is trusted or returned.
4. Runs the brief's self-Concluder before returning, and shapes the return exactly as the brief states.

**Never:** act from an unpinned path, or return without the self-Concluder having run.

*See:* `Cascades/Documentation/Seed/SEED-1-SALVO-PRACTICE.md`

## Vermillion

**On receiving this term, an agent:**
1. Reads the plan as the prompt: an A-I plan whose every step splits into an Informative aspect (gather, read, understand) anor an Actionable aspect (decide, transform, create) — portable to any agent, any tier.
2. Leads every step with its Informative half before its Actionable half; informational invocations (status, question, empty) stay READ-ONLY.
3. Checks each step for its failure branch — a step without one is an aspiration, not a flow; failure branches are designed at plan time, never improvised at the crash site.
4. Closes with honest counts (attempted / succeeded / missed), never adjectives.

**Never:** fire a step's Actionable half before its Informative half has grounded it.

*See:* `Cascades/Documentation/Seed/SEED-3-VERMILLION-PRACTICE.md`

## Concluder

**On receiving this term, an agent:**
1. Runs a structural test that returns a number without argument: `wc -l`, `grep -c`, an exit code, a file-exists check.
2. Runs it — never narrates it; a described Concluder is not a Concluder, and a stored number is re-run before it is cited.
3. Runs gates bare — no filters masking the exit code — and concludes on named artifacts plus a real check, never on a green exit alone.
4. Runs the count BEFORE any numeric claim, and before any design against an enumerated spec.

**Never:** substitute confidence, coherence, or narrative for the number.

*See:* `Cascades/Documentation/Seed/SEED-2-LAMBDA-DISCIPLINE.md`

## Lambda anor Ego

**On receiving this term, an agent:**
1. Sorts every statement it is about to make: Lambda (backed by an artifact on disk or a re-runnable check) anor Ego (declaration, plan, narrative).
2. Makes no claim of completion, correctness, or measurement without the artifact — reported is not confirmed, in either direction.
3. Reads back every Write; on any Edit error, re-reads the zone before retry — never a blind retry.
4. Treats plans as legitimate Ego — prunable aspiration — and never presents Ego as if it were Lambda.

**Never:** let a claim stand where the artifact should be.

*See:* `Cascades/Documentation/Seed/SEED-2-LAMBDA-DISCIPLINE.md`

## Muxistration Proof

**On receiving this term, an agent:**
1. Produces the pair every build band owes: (a) the artifact on disk, and (b) its verification — Read-back plus a Concluder run against it.
2. Cites both in the return: the path written and the number or check that verified it.
3. Treats a narrative-only return as failing the term — the Proof is the artifact AND the verification together; neither alone suffices.

**Never:** return from a build band with an artifact unverified, or a verification with no artifact behind it.

*See:* `Cascades/Documentation/Seed/SEED-2-LAMBDA-DISCIPLINE.md`

## Conference

**On receiving this term, an agent:**
1. Recognizes a decision point the system and the user must decide together, and halts automation at it — the user's word is the gate no automation crosses.
2. Exhausts self-resolution first (own declared state → records → derivation from environment); ASK is the LAST rung of the ladder, never a substitute for looking.
3. Renders the decision as a menu in the user's medium: numbered questions, lettered option codes, a recommended marker, a one-line reply key — plain markdown, options mutually exclusive.
4. Records the user's ruling in the user's own words, scoped to its epoch — no prior epoch's exception carries forward.

**Never:** guess the answer, or cross the gate on its own authority.

*See:* `Cascades/Documentation/Seed/SEED-5-CONFERENCE-PRACTICE.md`

## Diamond anor Onyx

**On receiving this term, an agent:**
1. Holds the pair apart: the Diamond is the Ego board — the plan, freely changed, prunable; the Onyx is the Lambda record — append-only history of what verifiably happened.
2. Reads the Onyx before planning anything; writes plans to the Diamond; appends outcomes and diagnoses to the Onyx.
3. Never overwrites the record with the plan, and never deletes a prior tier — records fall out of scope, retrievable by menu, and every append is read back.
4. Understands the pair IS the project context: what is aspired anor what is known — the record survives compaction; the plan does not need to.

**Never:** rewrite the history to match the plan.

*See:* `Cascades/Documentation/Seed/SEED-4-RI-PRACTICE.md`

## Curry / Opal

**On receiving this term, an agent:**
1. Reads Curry as the loading act: a Suite identity (cognitive function + voice) plus a scale (model weight by complexity) plus a brief, composed into one dispatched agent — and Opal as the dispatch channel that curries.
2. If it IS the curried agent: absorbs the Suite identity fully — its function, its output register — before touching the brief's work.
3. Preserves that identity through to the return; a curried agent answering generically has dropped its curry.
4. If it is the dispatcher: completes the triple (identity + scale + brief) before firing — a dispatch missing any leg is not a curry.

**Never:** dispatch or accept a curried role with the identity, scale, or brief absent.

*See:* `Cascades/Documentation/Seed/SEED-1-SALVO-PRACTICE.md`

## Induction

**On receiving this term, an agent:**
1. Reads the named doctrine source in full, then converts it into its own operating state — memory files, an instance document, or live practice — never mere quotation.
2. Phrases every inducted law as something it will DO differently at the law's trigger (a dispatch, a Write, a sleep, a guard, a menu); a law that cannot be phrased as a decision rule is not yet inducted.
3. Verifies every inducted write by Read-back, and closes with a count Concluder: files written versus laws inducted.
4. Leaves the project's own locally-minted record untouched — the seed seeds; the local record grows beside it.

**Never:** call a doctrine inducted while it exists only as prose that was read.

*See:* `Cascades/Documentation/Seed/SEED-0-INDEX.md`

## TESTING anor Done

**On receiving this term, an agent:**
1. Marks its own completed work TESTING — meaning: gates green, Concluders passed, a one-line runbook attached so the confirmation pass is cheap.
2. Reserves Done for the user: only the user's witnessed runtime confirmation promotes TESTING to Done — the user's eyes are the Lambda; the builder authors blind.
3. Treats a checked box as user-confirmed, never as claimed; work behind a claimed Done is the failure mode, not the finish.

**Never:** mark Done on the strength of its own gates.

*See:* `Cascades/Documentation/Seed/SEED-2-LAMBDA-DISCIPLINE.md`

---

# THE CITATION LAW

**A brief cites this file by absolute path, resolved by the dispatching parent at dispatch time.** The document self-locates template-relatively as `Cascades/Documentation/METHOD-LEXICON.md`; the parent knows where the template landed and pins the full resolved path into every brief that uses a Lexicon term. The dispatched agent resolves any unknown term against that pinned path before acting — the Lexicon is the shared ground where two non-sharing memories meet.

**The Growth Law:** new terms join through the same fixed shape — `## <Term>` · **On receiving this term, an agent:** (numbered operational steps) · **Never:** (the anti-pattern one-liner) · *See:* (the Seed doc that deepens it). No entry carries etymology alone; no entry carries history; every entry answers what an agent DOES. **The Lexicon rides the SCP update circuit**: it ships inside the template's Documentation, so every install carries the Lexicon current at install time, and every template update carries it forward.
