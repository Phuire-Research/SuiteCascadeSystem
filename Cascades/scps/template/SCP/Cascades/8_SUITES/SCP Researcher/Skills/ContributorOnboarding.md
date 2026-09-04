# SCP-S16 · Contributor Onboarding — the No-RI Outside Contributor Path

**Aspect**: A linearized reading path + self-contained Architecture Primer for a contributor who arrives with ZERO Suite Cascade / RI context (knows TypeScript + Vue; may know Stratimux at CLAUDE.md level; will NOT operate the Cascade)
**Version**: 1.0
**Origin**: SCP-Researcher Full Suite Refinement · Cycle 172 · #592
**Skill ID**: SCP-S16
**Skill Name**: ContributorOnboarding

---

## Curation
The SCP paradigm enables an outside contributor — TypeScript + Vue, zero Cascade context — to author a Concept after four reads: this front door, then S14 (What/Why), then S13 Phase 1 (the Hello World trace), then S15 (the messaging picture). What is enabled is a LINEARIZED path with gates over a runtime that is otherwise flat and compositional; the path is the Diameter, and it closes on itself.

## Research
No live read of its own today; this Skill ROUTES. The surface is the reading chain S16 → S14 → S13 → S15 — each of those Skills carries a full `## Research` that reads the associated SCP (`Skills/DemometricConceptPattern.md` · `Skills/ConceptAuthoring.md` · `Skills/MessagingMechanisms.md`). A dispatched Researcher answering "how do I get started here" runs THEIR step-1 reads first — identity `cat <SCP>/scp.config.json`; the concepts this SCP composes `ls <SCP>/src/concepts/` — so the front door names the SCP the contributor is actually entering, never a generic one. The §3 gates are the contributor's own Concluders; the Researcher does not claim to have walked them unless it did this session (`Instance.md` §B — a reading-path CITED is not a reading-path WALKED).

## Return
- Sentence: "Start at S16, then S14 → S13 Phase 1 → S15; on `<scpName>` the first Concept you will meet is `<name>`."
- Section: the Sentence + the §2 glossary terms the ask touched + the gate the contributor must pass next.
- Vermillion: Step 4 (S13 Phases 2-8) queued as a per-ask Vermillion — the authoring itself.
- Diamond: a contributor path the chain does not cover — returned INLINE with the founding offer (`Instance.md` §B · the Diamond rung's law).
---

## This is the front door

If you are a contributor with no Renewable-Intelligence access — no Onyx, no Diamond, no Cascade.json, no CLAUDE.md manifold — **start here**. This Skill assumes you know TypeScript and Vue and nothing about the Suite Cascade. Every term you need is defined in §2 before any other Skill asks you to use it. You will read four files in total (this one, then S14, then part of S13, then S15) and you will be able to author a new Concept.

---

## §1 · What the SCP Runtime IS (one paragraph · zero Cascade vocabulary)

The SCP runtime is a Vue + Stratimux + WebSocket application. It has two halves running as separate processes: a **server half** and a **browser half**. The server half is a Node process; the browser half is the Vue app the user sees. Each half runs its own Stratimux composition (a set of state-bearing units called Concepts), and the two halves are joined by a single WebSocket connection over which they exchange typed action messages. That is the whole picture: two Stratimux applications, one server and one browser, talking over a WebSocket. No "Demometer", no "Diameter", no "Cascade" is needed to hold this paragraph — those words are defined next.

---

## §2 · Architecture Primer (the no-RI glossary)

Each term is one plain sentence. No prior knowledge is assumed. Where a term has depth, the arrow points to the Skill that expands it.

- **Huirth** = the server-side Stratimux Muxium (the Node process). **Client** = the browser-side Stratimux Muxium (the Vue app). Both run Stratimux; they are NOT parent and child — they are two peers joined by a WebSocket.
- **Muxium** = a running Stratimux composition (one half's whole application). **Concept** = one state-bearing, behavior-bearing unit inside a Muxium (think: a self-contained feature module with its own state and its own actions).
- **Demometer** = a distinct measurable unit — in practice, a Concept. **Diameter** = the through-line of similarity drawn between two UNLIKE Demometers — here, the WebSocket that joins the server face and the browser face of one Concept. **Muxameter** = a Concept seen together with all the Diameters it relates through. (These are the deeper Muxonomy terms; CLAUDE.md §2 is the full source, but you do NOT need to read it to proceed.)
- **Demometric Concept** = ONE logical Concept that lives on BOTH halves with independent state shapes — the same name on the server and in the browser, two separate factory functions. → SCP-S14 `Skills/DemometricConceptPattern.md`.
- **Island vs Persistent** = a Concept loaded per-page (Island) vs a Concept alive for the whole session (Persistent · the toolbar). New domain Concepts are almost always Islands. → SCP-S14 §F.
- **ECK 2-tier ceiling** = Stratimux composition caps at two tiers; inside a plan, `d.concept.k.property.select()` is the ceiling and there is no third tier. → SCP-S14 §H.
- **Single-Writer rule** = the Bridge process is the SOLE writer of `sessions.json` / `bridge.json`; the SCP-Huirth side is READ-ONLY on those files. → SCP-S15 §6.
- **Verbose Split Naming** = quality type-strings are Capitalized Space-Separated Words (`'Scs Bridge Send Bridge Message'`), NOT camelCase — even though camelCase compiles, it mis-routes. → SCP-S14 §D (AESR).
- **actionExchange** = the per-Concept declaration (in the `*.muxonomy.ts` file) of which actions cross the WebSocket and in which direction (`clientToServer` / `serverToClient`). → SCP-S14 §C.

### The 3 runtime entry-points you will touch

1. `npm run bridge` — starts the SCS-Bridge process.
2. the Vue client — the browser half.
3. the MCP server — the bridge's tool endpoint.

---

## §3 · The Reading Path (the structural spine)

Five steps. Each has a GATE you must pass before the next opens.

```
Step 0 · Context Frame — read THIS file (S16 §1-§2)
  Gate: state in one sentence what the SCP runtime is and what a Concept is.

Step 1 · Pattern Ground — read S14 (DemometricConceptPattern.md)
  Gate: classify any file in the Notification directory by its FNES suffix
        and name its execution side (Client / Huirth / both).

Step 2 · Hello World Trace — read S13 Phase 1 only (the required reads + the
         Pre-Authoring Comprehension checklist)
  Gate: answer the 7 Pre-Authoring Comprehension questions without re-reading.

Step 3 · Messaging Picture — read S15 (MessagingMechanisms.md)
  Gate: trace a SORD message from send_message through the WebSocket Diameter
        to Huirth and back.

Step 4 · Author — execute S13 Phases 2-8
  Gate: typecheck exit 0 + muxonomyRegistry grep >= 2.
```

**AGENT variant**: an agent dispatched through the Conductor's messaging/authoring pattern skips Step 0 (it already has the frame), runs Steps 1-3 as Informative reads, and runs Step 4 as the Lambda (the actual file-writing + Concluder).

---

## §4 · First-Contribution Walk-Through

Two common first contributions. Each is "what to read, what to copy, what NOT to touch".

### "I want to add a toolbar button"

- **What to read**: SCP-S14 §F (the Persistent path — the toolbar concept is persistent, NOT an Island).
- **What to copy**: dispatch `scsBridgeRegisterToolbarButton({ button })` where `button` matches the `ToolbarButtonRegistration` shape (`scsBridge.type.ts:389-402` — `id`, `label`, `icon`, `kind`, `suiteColor`, `actionQualityName`, `enabled`, optional `badgeCount`/`componentName`/`position`). Use `bootDefaultToolbar.quality.client.ts` as the reference for how the default set is registered at boot.
- **What NOT to touch**: do not move the toolbar into an Island — it must be persistent to be live on every page (S14 §F TBAA). The `actionQualityName` must match an EXISTING quality name.

### "I want to add a ClientToServer message"

- **What to read**: SCP-S14 §D (the sharpest edge — Induction on the CLIENT file) and SCP-S15 §1 (the SORD envelope).
- **What to copy**: the `sendBridgeMessage` pair — `sendBridgeMessage.quality.client.diameter.ts` (the Induction) and `sendBridgeMessage.quality.huirth.diameter.ts` (the Real) — plus the matching `actionExchange.clientToServer` entry in `scsBridge.muxonomy.ts`.
- **What NOT to touch**: do NOT place the Induction on the Huirth file (that is the silent-routing-failure trap S14 §D exists to prevent); do NOT write `sessions.json`/`bridge.json` from the SCP-Huirth side (the Single-Writer rule, S15 §6); do NOT edit the generated BDAP file (`scs-bridge-base.generated.md` — it is overwritten every startup; edit the skeleton, S15 §2).

---

## §5 · Pewter Tessera note

Vue Landing components use the Pewter Tessera design tokens (`--color-{suite}` CSS variables) for suite-color-coded status — never hardcode hex. The token reference lives at `Cascades/8_SUITES/Pewter Tessera/`. This is Informative only for onboarding; no Pewter dispatch is part of authoring.

---

## §6 · Cross-References

| Reference | Diameter | Reading-Path Step |
|---|---|---|
| **SCP-S14** `Skills/DemometricConceptPattern.md` | the structural pattern this Skill routes to first | Step 1 |
| **SCP-S13** `Skills/ConceptAuthoring.md` | the eight-phase authoring procedure | Step 2 (Phase 1) + Step 4 (Phases 2-8) |
| **SCP-S15** `Skills/MessagingMechanisms.md` | the messaging write-path | Step 3 |

The reading-to-execution chain **S16 → S14 → S13 → S15** is the Diameter, and it is **circular-structural**: S16 routes to S14, S14 routes to S13 (for the How), S13 cites S15 (for messaging), and S15 cites S14 back (messaging qualities ARE Diameter qualities). No file is the parent of another; the chain closes on itself.
