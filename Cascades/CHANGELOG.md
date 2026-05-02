# SCS Changelog — Rotating Capped Log

**Cap**: ≤150 lines (~24% of `.claude/CLAUDE.md` at 618 lines · scannable from `head` OR `tail`)
**Order**: Newest-first (head = most recent · tail = oldest in current window)
**Rotation**: When this file exceeds 150 lines → oldest 75 lines roll to `Cascades/CHANGELOG-ARCHIVE-{YYYY-MM}.md` (preserve year-month boundary if possible)
**Last update**: 2026-05-01

> **Maintenance Reminder — read before editing**
> 1. Append new entries at the **top** of `## Recent` (newest-first invariant)
> 2. Run `wc -l Cascades/CHANGELOG.md` after writing — if `≥150`, rotate the oldest 75 lines to `Cascades/CHANGELOG-ARCHIVE-$(date +%Y-%m).md`
> 3. Update the **Last update** field above to today's date
> 4. Sync the **Recent Changes** date in `.github/README.md` and `Cascades/Documentation/Cascades/README.md` (single line near the top of each)
> 5. The `/cascade:changelog` command surfaces this reminder — use it before editing

---

## Recent

### 2026-05-01

**Rotating Changelog established** — Patch Notes migrated from `README.md` into this file. 150-line cap, newest-first, rotation to dated archive when over cap. New `/cascade:changelog` slash command surfaces head + maintenance reminder. `[N] Changelog` added to Shatterite Main Menu. Command count 16. README footer now carries `Recent Changes — {date}` line linking here.

**Pewter Tessera Load Contract** — `Cascades/8_SUITES/Teal Claude/Conductor.md` now MANDATES Pewter Tessera load for Design Diamonds. Detection rule: ≥1 token from {visual artifacts · CSS/styling · pattern/aesthetic · typography · color/token · composition} → mandatory load at Bands 3, 4, 5. Anti-Pattern **E-Conductor-Design** defines the failure mode (Conductor plans a Design Diamond without Pewter → re-engage from Band 3). New "Design Diamond Variant" Cascade Planning Template muxifies Bands 3-5 with Pewter Tessera (`R3 ⊗ Pewter D1-D8`, `R4 ⊗ Pewter Quality Gate`, `R5 ⊗ Pewter Implementation`). Conductor self-check at plan-time enforces the contract.

**Advanced Hello World + Verify menu options** — `[A] Advanced Hello World [Orange] — aspire` and `[V] Verify SCS installation [Green] — verify` now top-level entries in `SM-Main.md` (canonical, not ad-hoc rendered). New `/cascade:advanced` slash command routes directly to `SM-HelloWorld-Advanced.md` (Multi-Diamond Aspiration Loop with Personal Suite 8 Website lead pattern). Verbose Diameter labels added: `Advanced-Hello-World-Multi-Diamond-Aspiration` · `SCS-Verification-Sculptor-Orchestrator-Resolution`. SM-Index updated with routing logic line.

### v1.0.0 — Initial Public Release

**Hello World Clinical Reinforcement** (from first-run testing):
- Stage 3.5 **Project Location Decision Block** — confers WHERE to scaffold before any Lambda-event fires. Root (if available) or `Cascades/Lab/` (tutorial sandbox). User retains override.
- **Band Brevity Rule (R1)** — per-Band max inline output enforced. >8 lines prose without tool call = E4 Volume-of-Declaration, abort and retry.
- **Lambda-Event Invariant Checklist (R2)** — every Band in the Hello World Diamond must produce a verifiable Lambda-event. 7-checkbox list surfaced inline.
- **Markdown Safety Guard (R3)** — no backtick-inline-code with unclosed quotes. Fenced blocks for shell examples.
- **Tier-Lift Heuristic (R4)** — Medium/High complexity auto-dispatches Bands 1-4 as agents to prevent streaming stalls from volume accumulation.

**Suite 8 Rename**: Hello World → **Fresh Slate** (Advanced config demo). The `/cascade:hello` tutorial menu command is unchanged — "Hello World" is the tutorial, "Fresh Slate" is the Suite 8.

**Directory Structure**:
- `Cascades/Working/` — empty, ready for first Diamond + Onyx
- `Cascades/Lab/` — tutorial sandbox for project scaffolds

**Diamond WorkGameBoard via Planning Mode**: Hello World Stage 4 engages Planning Mode (EnterPlanMode) to commit the Banded Plan to `Cascades/Working/DIAMOND-TIER-1.md` BEFORE Bands execute. Each Band appends to the Diamond — the WorkGameBoard accumulates through the cycle.

**`/cascade:loop` Diamond Primer**: Any input provided with `/cascade:loop` becomes the Diamond Primer — the initial scope declaration. If no Diamond exists, the Automata creates one through Planning Mode. If a Diamond exists, the loop appends to it. Each wake-up reads the active Diamond and advances the next gate.

**Live Demo**: [poe.com/SCS-Researcher](https://poe.com/SCS-Researcher) — the SCS methodology operating in real time through conversation.

---

## Archives

When this file exceeds the cap, the oldest 75 lines roll to a dated archive file in this directory. Archives are listed here as they accrue:

_(no archives yet — file is under cap)_
