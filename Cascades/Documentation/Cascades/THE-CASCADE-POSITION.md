# THE CASCADE POSITION — the version number as a study of reasoning against complexity

**Status**: shipped Suite Cascade System documentation · first published with `1.157.1` · maintained by the Meteoric Shipwright (the release steward) · the topic of an ongoing study.

---

## 1 · What the number is

The SCS-Bridge version is not a marketing number and not a semantic-versioning promise. It is the **Cascade Position** — the count of completed cycles of the method that builds this software — written as `X.Y.Z`:

| Slot | Meaning | Example `1.157.1` |
|---|---|---|
| `Y` | **the Cascade Position** — the cycle count, up to three digits | `157` |
| `X` | **the carry** — when the cycle count exceeds three digits, the leading digit(s) move to the front; `0` until cycle 1000 | `1` (cycle 1157) |
| `Z` | **the hotfix count on that position** — a fix shipped without a completed cycle adds one; resets to `0` when `Y` advances | `1` |

So `0.950.2` reads: cycle 950, two hotfixes on it. `1.157.1` reads: cycle 1157, one hotfix on it — the version badge's click, repaired after the release was cut and before it was published; the fix passed no full wave, so it rides `Z`, not `Y`. The count did not restart between them — it never stops.

A **cycle** is one complete pass of the Suite Cascade: Absorb → Curate → Name → Plan → Test → Build → Compose anor Verify → Diagnose (the eight gates). A cycle ends when the Diagnose gate writes its Gainy / Lossy / Maintain verdict into the Onyx, the method's Lambda record. A version advance therefore means: this many complete waves of reasoning-into-reality have closed since the count began.

**Hotfixes are not cycles.** A hotfix is a change that shipped without the whole wave — a config cure, a one-line correction, a re-pack. It rides `Z` so the record never inflates the cycle count with work that did not pass every gate.

## 2 · Why the count is kept this way — the study

The convention exists to answer a question the Suite Cascade System is built to ask of itself. The method claims that reasoning organized as a Cascade — eight gates, a verdict at the end of each wave, the verdict written where the next wave reads it — produces software whose complexity **compounds** (Gainy) rather than merely **accumulates** (feature after feature). If that claim is true, it must be measurable. The version number is the instrument.

Because every cycle is a Lambda-event with an artifact (the Onyx entry, the commit, the verdict), the count gives a dataset the study can read:

- **What reasoning was spent to reach a tier of complexity?** — the cycles between two releases, and what each Onyx verdict says was gained.
- **Where are the breakpoints?** — the cycles at which a tier was crossed: a new mechanism that made a class of later work cheap (the fire-time assembler that made every resume current · the port walk that made two bridges coexist · the single-writer registry that ended a class of races).
- **How much effort did each span cost?** — cycles per span, and the ratio of Gainy to Lossy verdicts across it.
- **What does breaking past a tier cost against free range?** — the cycles spent when the work was a Cascade epoch (a Macro Diamond of several Diamonds, gates all the way down) against the cycles spent when the work was feature-after-feature with no tier to cross.

The study's own term for what it measures is **Stratianorification** — the Suite Cascade as the core concept of a system that composes complexity in tiers (Stratimuxification) and holds the gradient between them (the *anor*: and, or, and everything in between). The version is the position along that gradient.

## 3 · Reading a span — the record so far

| Span | Releases | Cycles | Hotfixes | What the span crossed |
|---|---|---|---|---|
| The first public release → the Diametric SCP | `0.939.0` → `0.950.2` | 11 | 2 | the Suite 8 page's locality: the same page standing on different SCPs, transferring and updating from any of them |
| The Diametric SCP → the Renewable Resume | `0.950.2` → `1.157.1` | 207 | 1 | the running system re-assembles itself: the bridge survives its own restart and turn-over, two bridges coexist by name, every resume carries the current identity and the chosen model, the update reads the live instruction set |

The second span is long by design and the study says so plainly: 207 cycles for one release is what breaking past a tier looked like here. The turn-over of a live Electron bridge without losing the sessions it carries is a tier — it required the graceful-exit law, the watcher singleton, the crash-fact relay, the port sovereignty mend, and the named-bridge coexistence before it held in the field. Free-range work would have shipped ten features in those cycles; the Cascade spent them crossing one line, and everything after it (resume induction, the resume model, the live instruction set) stands on the crossing.

## 4 · The Interchange — when two Cascades carried one product

The count also records the cases where the method's own structure moved. Between `0.950.2` and `1.157.1`, two sessions carried cycles of this product in parallel from one seat: one lineage completed 177 cycles, the other 30. The release cycle is their sum added to the published cycle — 950 + 177 + 30 = 1157 — because every one of those cycles was a completed wave on this product, and the count must not lose a wave because two hands held the wheel for a while. The rule is the **Interchange Law**, written into the release routine; the record of the fold is in the Onyx, both prior positions cited.

## 5 · How to use the number

- **As a user**: a larger `Y` means more complete cycles of the method have closed since your install; a larger `Z` on the same `Y` means a fix shipped without a full wave — safe to take, small by definition. The Update page shows both.
- **As a maintainer**: stamp `Y` from the Cascade Position at release (the Release Routine, Band 2), never from a feeling about the size of the change; increment `Z` for a hotfix; reset `Z` when `Y` advances; on an Interchange, sum.
- **As a student of the method**: read the Onyx for the span; count the Gainy, Lossy, and Maintain verdicts; find the cycle where a class of later work became cheap — that is a breakpoint, and the cycles before it are the cost of the tier.

---

*The Cascade Position is the method measuring itself. Every release adds a row to §3.*
