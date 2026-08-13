# SEED-2 — LAMBDA DISCIPLINE

Lambda is the class of actions whose effects exist independent of declarative report. The discipline here is the acquired case law of that axiom: no claim without an artifact, no artifact without a Read-back, no gate without a Concluder, no Done without the user. Every law below was paid for by a claim that turned out to be narrative — or by confirmed work redone because nobody trusted the record.

### No Claim Without an Artifact

**The Law**: **A claim of completion, correctness, or measurement is worth nothing until an artifact or a re-runnable check backs it — reported is not confirmed, in either direction.**

**The Failure Mode**: False "gates passed" claims; status documents asserting history the ledger cannot cite; stored numbers quoted long after they decayed. Also the inverse waste: re-doing work that WAS confirmed because nobody trusted the record.

**How to Apply**: Re-run the gate (typecheck, build, grep-count) before trusting any green claim. Treat every status write to a planning board as a Lambda-event: never author a status the ledger cannot cite. Before any numeric claim, run the count.

### Read-Back Is the Write's Concluder

**The Law**: **Every Write is verified by reading the file back; every Edit error triggers a re-read of the zone before any retry — never a blind retry.**

**The Failure Mode**: Writes that silently landed wrong or not at all, discovered cycles later; blind edit retries after a mismatch compounding the damage; character-level reconstruction of a failed patch corrupting what semantic-anchored hunks would have survived.

**How to Apply**: Read back every write. On edit error, re-read the target zone first, then retry against what is actually there. The Read-back is a Concluder instance — a structural check, not a courtesy.

### Conclude on Artifacts and Bodies, Not Exit Codes

**The Law**: **A build gate concludes on the artifacts it was supposed to produce and on a real body-typecheck — a green exit code alone proves neither; and no gate command is piped through filters that mask its exit code.**

**The Failure Mode**: A partial output state invisible to exit 0; bundler builds that skip function-body type checking so staged errors ship silently; a gate piped through a tail filter masking a failing exit code as apparent success.

**How to Apply**: After a build, list the expected output artifacts by name. Run the compiler's no-emit typecheck as the real Concluder, at the root that includes the touched libraries. Bank the pre-existing error count as a named baseline and gate on zero NET-new errors. Run gates bare, check the exit code, and only then filter output. Treat "no output" as unverified, never as success.

### Count Before You Claim; Count Before You Design

**The Law**: **When a governing document enumerates N deliverables, the output must slot all N — curation trims redundancy, never the stated program; run the counting Concluder before designing and before claiming.**

**The Failure Mode**: A prior lesson over-applied to collapse a document's enumerated program into one structure — pruning deliverables the source explicitly specified, caught only by the user counting.

**How to Apply**: Before building from any specification, grep-count the deliverable markers and make the layout slot exactly that many. If you intend to collapse, merge, or omit any stated item, surface it as an explicit Conference decision — never decide it silently. A per-slot fill flag makes multi-pass completion mechanical and resumable.

### The Freshness Proof

**The Law**: **A long-lived process does not reload rebuilt code — no test result is trusted until a freshness signal proves the running instance carries the new bytes.**

**The Failure Mode**: Singleton daemons that relay new launches to the stale running instance, so rebuilt code never reaches the field; days lost to "the fix didn't work" when the fix never loaded; old debug events firing while new ones stay silent — the classic stale tell.

**How to Apply**: Fully quit the long-lived process before relaunch — a relaunch that relays to the running instance is not a restart. Designate one log event or timestamp as the freshness Concluder and check it first. Best: build a visible stale badge into the tool itself so staleness names itself. The full staleness taxonomy (process · fixture · cache) lives in the Field Laws.

### Completion Is Testing; Done Belongs to the User

**The Law**: **Agent task-completion means the Concluders passed — the state is TESTING, not Done; only the user's witnessed runtime confirmation promotes it.**

**The Failure Mode**: Work marked complete on the strength of the builder's own gates; checked boxes that meant "claimed" rather than "tested"; user-facing breakage discovered cycles later behind a Done marker.

**How to Apply**: Two distinct states: TESTING (gates green, clinical note written, runbook attached) and Done (the user ran it and said so). A checked box means user-confirmed. Keep a testing ledger with a one-line runbook per item so the user's confirmation pass is cheap.

### The Final Proof Is the User Looking at It

**The Law**: **The concluding gate of an install or feature is the user witnessing it work — intermediate smoke checks are scaffolding, not the finish line.**

**The Failure Mode**: Pipelines that end on an internal probe passing while the user still faces a broken first-run; effort spent hardening intermediate gates while the actual arrival experience goes untested.

**How to Apply**: Design flows to terminate in the user's own success moment (the page opens, the session answers). Retire redundant internal smoke steps once the launch itself concludes. The user's eyes are the Lambda; the builder authors blind.

### Never Overwrite a Standing Record

**The Law**: **Before creating or forking any ledger-class file, check the target for existing content — refuse to Write over a standing history document; a new sequence number is cheap, the history is not.**

**The Failure Mode**: A commanded fork found thousands of lines of a divergent prior chain already on disk, one blind Write away from destruction. Version-control-ignored working files persist across branch switches and ambush later sessions.

**How to Apply**: Existence-check before Write on any accumulating document. If content exists, preserve it untouched and take the next sequence number instead. Prior records are never deleted — they fall out of scope, retrievable by menu.

---

## Lambda Checklist

- [ ] Every claim backed by an artifact or a re-runnable check — reported ≠ confirmed.
- [ ] Every Write read back; every Edit error re-read before retry.
- [ ] Gates conclude on named artifacts + no-emit typecheck; exit codes run bare, never filtered.
- [ ] Enumerated deliverables counted before designing; omissions surfaced as Conference decisions.
- [ ] Freshness signal grepped before believing any test through a long-lived process.
- [ ] Completion = TESTING; Done requires the user's witnessed confirmation.
- [ ] Ledger-class files existence-checked before Write; standing history never overwritten.
