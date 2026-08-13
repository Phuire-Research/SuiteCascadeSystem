# SEED-1 — SALVO PRACTICE

A Salvo is the parallel dispatch shape of the Cascade: several specialized agents fired at once, each with a distinct lens and a disjoint write target, their returns synthesized by the parent — never by themselves. The parent owns the gates, the staging, and the deploy; the dispatched agents own their lanes and nothing else. The laws below govern when to fire a Salvo, how to brief it, how to reconcile it, and how to keep its claims honest.

### Depth vs Breadth Selection

**The Law**: **Two dispatch shapes exist as siblings — the sequential-curried traversal (each function informs the next, one plan carried forward: depth) and the parallel Salvo (all lanes at once, then synthesis: breadth) — choose deliberately per task and name the shape before dispatching.**

**The Failure Mode**: Running the whole method as one undifferentiated procedure; parallel breadth where cumulative context was the point, or a slow sequential chain where independent perspectives were the point.

**How to Apply**: Sequential-curried when each stage's output should feed the next — one carried document, curried context updated after each agent and injected into the next. Parallel Salvo when independent blind perspectives should be reconciled — dispatch all, synthesize, then implement.

### Probe Before Salvo; Source Over Inference

**The Law**: **Name the root cause with cheap Concluders and existing evidence before dispatching any multi-agent Salvo — the disk tells the truth the UI withholds, and a fresh source-read overrides every prior inference.**

**The Failure Mode**: Expensive parallel diagnostics fired at a problem five greps would have named; architecture built on remembered (wrong) beliefs about existing code; theories stacked above the signal plane while the boot fingerprint below held the answer.

**How to Apply**: Check logs, telemetry sinks, and on-disk state first. Fingerprint the system's actual state before theorizing. Grep the existing source before architecting anything new. A confirmed probe that collapses the Salvo is the highest-value move; fire the Salvo only when the probe genuinely cannot decide.

### Distinct Lenses; Convergence Is the Signal

**The Law**: **Parallel lanes are spread with deliberately distinct lenses so synthesis reconciles genuine variation — and when independent lanes converge on the same finding, that convergence IS the validation.**

**The Failure Mode**: N parallel agents with identical briefs return N restatements of one perspective — no variation to reconcile, no signal in agreement.

**How to Apply**: Give each lane a named, different lens on the same target (e.g. Fidelity / Fit / Budget). At synthesis, weigh convergence heavily: independent agents arriving at the same gaps is stronger evidence than any single agent's confidence. Divergence marks the genuine open decisions to surface to the user.

### Disjoint Write Scopes

**The Law**: **Dispatch agents concurrently only when their write targets are disjoint — parallel reads compose freely; parallel writes to shared ground collide.**

**The Failure Mode**: Sequential grounding at triple the wall-clock when the reads were independent; conversely, concurrent agents trampling one shared document.

**How to Apply**: Before a parallel dispatch, assign each agent its own output file or section. Reads may overlap arbitrarily. Synthesize the returns in the main thread afterward. A stable trio-or-quartet of grounding roles (shape-finder, namer, architect, orchestrator) reused every cycle beats bespoke dispatch design each time.

### Pin the Ground in Every Brief

**The Law**: **In multi-directory workspaces, every dispatched brief pins the absolute repo root and exact file paths — and any agent claim that something does not exist is existence-verified before it is trusted.**

**The Failure Mode**: Sibling repos sharing conventions and near-identical names pull an agent into the wrong repo, where it invents components that belong to the sibling — from briefs that named only relative paths.

**How to Apply**: State the absolute repo root plus the specific file path in every brief. When an agent returns "it doesn't exist / build from zero," grep the symbol in the intended repo BEFORE acting on the claim. Prefer re-grounding in-repo yourself over re-dispatching a drifted agent.

### The Dispatch Return Contract

**The Law**: **Every dispatched agent is told at dispatch time where its final return lands and that it must format for that destination while keeping its specialized voice — contracts layer recursively: each agent returns to its caller, only the outermost returns to the user.**

**The Failure Mode**: Agents surface raw internal working notes to the user, or flatten into a generic voice trying to sound presentable — losing both readability and the cognitive function's distinct value.

**How to Apply**: In every brief, state: (1) the working context is private and iterative; (2) the final return goes to a named destination and must be formatted for it; (3) the agent's specialized perspective is retained in that return. For nested dispatch, each inner return targets its dispatcher's working context, not the top.

### The Parent Runs the Gates

**The Law**: **Dispatched agents never conclude their own work — the parent re-runs every gate (typecheck, build, grep-count) before trusting any green claim, and spot-checks the artifacts on disk.**

**The Failure Mode**: Multiple false "gates passed" claims by dispatched agents in a single epoch; implementation waves that self-report success and ride the claimed-complete state into the user's hands.

**How to Apply**: Agents build and write; the parent gates. Re-run the Concluder yourself before propagating any completion claim upward. Reported is not confirmed — in either direction.

### Staging Before Live; File-on-Disk Handoff

**The Law**: **Multi-agent synthesis writes to a STAGING artifact deployed to the live governing document only on the user's confirmation — and inter-wave handoff rides files on disk, one stage per turn, keeping the user in the loop.**

**The Failure Mode**: Background orchestration that mutates governing documents directly, removing the user's test-gate; in-memory handoffs that evaporate between turns.

**How to Apply**: Each agent writes its deliverable to a working directory; the next wave reads those files. The final merge targets a staging file. Deployment to the live document is a separate, user-gated step — a claimed-complete state is TESTING, not Done. The orchestrator synthesizes between stages in the interactive session rather than delegating the whole arc to a detached engine.

### The Adversarial Verifier Earns Its Slot

**The Law**: **Include a dedicated adversarial verification lane in the standard cascade — a verifier that catches real defects in consecutive runs has earned a default slot.**

**The Failure Mode**: Without an adversarial pass, real bugs ride self-reported success into the user's hands.

**How to Apply**: After implementation, dispatch a verification lane whose brief is to break the work (build it, read it hostile, probe the edges) rather than to summarize it. Track its catch rate; a lane that finds genuine defects repeatedly becomes non-optional. Single-file artifacts get a single writer — verification reads, it does not co-write.

### Synthesis Is Structural, Not Erasive

**The Law**: **When two grounding returns disagree, neither is wrong — adopt each where its bias fits, and document the synthesis decision at the synthesis turn.**

**The Failure Mode**: Picking a winner and discarding the loser's valid half; undocumented reconciliations re-litigated cycles later; grounding returns treated as votes instead of lenses.

**How to Apply**: Name each return's characteristic bias. Resolve per-decision, not per-agent. Write the reconciliation and its reason into the working board the same turn it happens. Returns arriving in non-canonical order get a designated mid-flight calibrator rather than being forced into sequence.

### Gate Every Wave; Grep the Runtime Registry

**The Law**: **In a multi-wave build, run a cheap compile Concluder per wave; and after creating any new unit, grep the runtime registration point — typecheck-passes-runtime-fails is a silent gap.**

**The Failure Mode**: Errors compounding across waves until the final gate drowns in them; a fully type-correct unit that never loads because it was never added to the registry list — invisible until runtime.

**How to Apply**: One no-emit typecheck at each wave boundary keeps the error surface one wave wide. Maintain awareness of every "list of things the runtime actually loads" (registries, creator arrays, route tables, export barrels) and grep the new unit's name into them before declaring the wave done.

---

## Salvo Checklist

- [ ] Probe first: did cheap Concluders already name the answer? If yes, no Salvo.
- [ ] Shape named: depth (sequential-curried) or breadth (parallel Salvo)?
- [ ] Every brief pins absolute root + exact paths + the return contract.
- [ ] Every lane has a distinct lens AND a disjoint write target.
- [ ] The parent re-runs every gate; no agent claim trusted unverified.
- [ ] One compile Concluder per wave; new units grepped into the runtime registry.
- [ ] Synthesis reconciles per-decision, documented the same turn.
- [ ] Merge lands in staging; the user's word deploys it. State = TESTING until then.
