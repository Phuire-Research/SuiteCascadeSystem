# Gitm Resolver — Skill Reference

**Version**: 1.0
**Signatures**: 5 (S1-S5)
**Configuration**: Direct
**Domain**: SCP Update Merge Resolution · consumes the D-U2 diff JSON · emits the resolved decision set

The five skills run in order: ingest → auto-path → zone-union → conference-surface → emit. S2-S4
each contribute decisions; S5 composes them into ONE artifact and enforces the totality invariant
(every diff entry → exactly one decision). The doctrine is **auto-safe + zone-union +
surface-ONLY-true-overlaps** (conferred D-U3): the user is interrupted ONLY for genuine
ours-vs-theirs collisions, never for the lossless cases.

---

## S0 · Ground Topology (the Three Grounds — the orientation every Skill assumes)

**Ground 1 · THE RED REPO** — provenance.scpRepoRoot (<install>/Cascades/scps/<name>/). Holds the
ONLY .git in this operation: ours=HEAD, base=the SCS-init root, the synthetic theirs commit, and
the merged resultTree ALL live in its object database. **Every git object command runs as
`git -C <scpRepoRoot> …` — no bare git commands, ever** (your cwd is a DIFFERENT git repo — the
install root — and bare commands silently read the wrong database).

**Ground 2 · THE RETAINED CLONE** — provenance.theirsTemplateRoot (~/.scs-bridge/update-clone/clone/
Cascades/scps/template/). NO .git (a file copy). THEIRS content = plain files at
`<theirsTemplateRoot>/<path>` (diff paths are SCP/-prefixed and align). Never run git against it.

**Ground 3 · THE INSTALL ROOT** — your cwd. A separate git repo (THE TRAP). Its only roles: read
the diff JSON from Cascades/Bridge/ and write the resolved JSON to Cascades/Bridge/.

**Path algebra**: ours on disk = <scpRepoRoot>/<path> · theirs on disk = <theirsTemplateRoot>/<path>
· merged blob = `git -C <scpRepoRoot> cat-file -p <provenance.resultTree>:<path>` · the resolved
JSON = Cascades/Bridge/scp-update-resolved.<name>.json (cwd-relative).

---
## S1 · Diff-Ingest

**Aspect**: Input establishment and orientation.
**Function**: Read the diff JSON at the supplied path; validate the shape; index the three buckets;
extract the provenance (the `resultTree` SHA is needed by S4 to read conflict markers). SHAPE-TOLERANT:
accept the canonical D-U2 shape (`buckets:{apply[], preserve[], conference[]}` + `summary{}` +
`provenance{}`, per the diff script) AND the alt shape (top-level `apply[]`/`preserve[]`/`conference[]`);
normalize both to one internal tri-bucket. For each `conference[]` entry, read `collisionZone` and
(when present) `collisionZoneName` to route S3 vs S4 downstream.
**Inputs**: `diffJsonPath` (e.g. `Cascades/Bridge/scp-update-diff.<name>.json`).
**Outputs**: an in-memory tri-bucket (apply[], preserve[], conference[]) + a provenance echo
(`scpName` · `baseSha` · `oursSha` · `theirsSha` · `resultTree` · `theirsTemplatePath`) + an Intake
Summary (total files · per-bucket counts · collision-zone count · collision-zone names).
**Concluder**: `test -f <diffJsonPath>` ok · the JSON parses · the three bucket keys resolve to arrays
(counts ≥ 0). **Halt-Complete**: if the file is absent or unparseable, HALT with a clear error — do NOT
fabricate a resolution. Nothing is acted upon here; ingest is orientation, not decision.

---

## S2 · Auto-Path

**Aspect**: The no-ceremony bucket handling (the largest file volume).
**Function**: For every `apply` entry → verify the pre-check `oursHash == baseHash` (the user never
modified this file, so the template's patch carries no risk); on pass, record decision
`{path, bucket:"apply", disposition:"patch", patch:<hunk>}`. **If the pre-check FAILS**
(`oursHash != baseHash` for an apply entry), do NOT silently patch — ESCALATE the entry to the
conference path (hand it to S4) so it surfaces rather than mangles. For every `preserve` entry →
record decision `{path, bucket:"preserve", disposition:"preserve", note}` and take no file action (the
template has no contribution; the user's file is authoritative). No user prompt for either bucket —
surfaced only as a confirmation summary, not a per-file gate.
**Inputs**: the `apply[]` + `preserve[]` buckets from S1.
**Outputs**: the auto-decision list (apply-template + keep-user entries) + any escalations handed to S4.
**Concluder**: `|auto-decisions| + |escalations| == |apply| + |preserve|` (every apply/preserve entry
produced exactly one outcome — a decision or an escalation; none lost).

---

## S3 · Zone-Union

**Aspect**: The registration-merge resolution for the two collision zones (the resolver's signature move).
**Function**: For each `conference` entry where `collisionZone === true`:
 (a) read `collisionZoneName` → route to the zone rule:
     - the **muxonomy / Navbar-Muxonomy-Registration** zone → UNION `REGISTERED_MUXONOMICS`
       (the template's new entries + imports appended; the user's entries preserved).
     - the **Client-Muxium-Composition** zone → UNION `BASE_CONCEPTS_CREATORS`
       (the template's new creators added; the user's preserved).
 (b) compute the union at REGISTRATION granularity (array elements / object keys, NOT raw text) —
     additive merge; BOTH sets of registrations survive; ordering = the user's first, the template's
     appended. Where the user and the template added the SAME key, dedupe to one (idempotent union).
 (c) record decision `{path, bucket:"conference", disposition:"write", resolvedContent}` with the full
     merged content ready to write, annotated (in `note`) which entries came from ours vs theirs.
**Inputs**: the `conference[]` entries with `collisionZone === true`.
**Outputs**: per-zone union decisions (the `resolvedContent` both the apply stage and a human can verify).
**Concluder**: every zone entry yields a `union` decision · the `resolvedContent` contains BOTH the
user's lines AND the template's new lines (grep both side markers present) · no registration dropped.

---

## S4 · Conference-Surface

**Aspect**: The human-decision gate for genuine logic collisions.
**Function**: For each `conference` entry where `collisionZone === false` (PLUS any apply entry S2
escalated): READ the conflict content from the merge resultTree —
`git cat-file -p <provenance.resultTree>:<path>` — to extract ourHunk + theirHunk + the conflict
markers verbatim (the diff JSON carries NO embedded hunks; the resultTree is the source). SURFACE to
the user via the Staging Tool / AskUserQuestion with the two hunks side-by-side + the markers. Present
the user-side default = **KEEP OURS** (user expansions win); options = {keep ours · take theirs · manual
merge}. Capture the choice. When a user keeps OURS (the user-wins default), record the template's
intent in `note` so the user can optionally adopt the template functionality later.
**Inputs**: the `conference[]` entries with `collisionZone === false` + S2's escalations + the
`resultTree` SHA from S1's provenance echo.
**Outputs**: per-file user decisions. Map the user's choice to a disposition:
 - keep ours (the default) → `{path, bucket:"conference", disposition:"preserve", note}` (the user's
   file is authoritative · the apply quality lands NOTHING for it).
 - take theirs OR manual merge → `{path, bucket:"conference", disposition:"write", resolvedContent, note}`
   with the full resolved file content the apply quality writes verbatim.
**Shatterite Update Variant** (the surfacing shape): for each true-overlap entry, surface via
AskUserQuestion in this shape — an OVERVIEW block (path · one-line
ours-summary · one-line theirs-summary · stakes) then OPTIONS where each option row states its tool
placement (the disposition + resolved fields set on selection): [A] Keep ours (default · preserve ·
note records template intent) [B] Take theirs (write · theirs verbatim) [C] Manual merge (write ·
user provides). Footer: remaining conflict count · Esc = HALT (pending stays elevated · apply blocked
· do NOT emit).
**Concluder**: every surfaced entry has a captured user decision (no entry left UNRESOLVED).
**Halt-Complete**: if a surfaced entry receives no decision, the resolution is INCOMPLETE — increment
the `pending` count and do NOT emit a partial tree as if complete (S5 gates on `pending === 0`).

---

## S5 · Resolution-Emit

**Aspect**: The output handoff for the apply stage (D-U4/D-U5).
**Function**: Compose all decisions (S2 auto + S3 union + S4 user) into ONE resolved decision artifact.
Write the flat manifest — every file from the original three buckets appears exactly ONCE with its final
disposition. The artifact is NOT a new diff; it is a resolved manifest the staging tool iterates once.
Emit an Onyx Summation line alongside.
**Inputs**: the full decision list (auto + union + user).
**Outputs**: `Cascades/Bridge/scp-update-resolved.<name>.json` — the CANONICAL shape the bridge
apply quality (`gitmScpUpdateApply.quality.ts`) reads and the SCP client `parseResolved`
(`gitmUpdateRelay.config.ts`) coerces. This shape is RECONCILED across the apply quality, the client
type (`gitmUpdate.type.ts` `UpdateResolvedShape`/`ResolvedDecision`), and the directive generator
(`gitmResolverVermillion.model.ts`) — emit it EXACTLY so the load-bearing bytes (`disposition`,
`resolvedContent`, `patch`) survive the parse (a drifted shape silently coerces to empty → apply
writes NOTHING). Shape:
```json
{
  "schemaVersion": "1.0",
  "scpName": "<name>",
  "decisions": [
    {
      "path": "<repo-relative-path>",
      "bucket": "apply" | "preserve" | "conference",
      "disposition": "write" | "patch" | "preserve",
      "resolvedContent": "<full file content · disposition write · else empty string>",
      "patch": "<unified-diff hunk · disposition patch · else empty string>",
      "note": "<the per-path note · the attending-clinician annotation>"
    }
  ],
  "pending": 0,
  "summary": { "write": 0, "patch": 0, "preserve": 0, "pending": 0 }
}
```
**Disposition mapping** (the apply LANDING contract):
- "write" → the apply quality writes `resolvedContent` verbatim to `<scpDir>/<path>`. Use for
  zone-union merges (S3) and any user-resolved conference entry whose result is a merged file (S4).
- "patch" → the apply quality applies `patch` (a unified-diff hunk) to `<scpDir>/<path>`. Use for
  `apply`-bucket files (S2 auto-apply: the template moved · `oursHash == baseHash`).
- "preserve" → the apply quality does NOTHING (the user's file is authoritative). Use for every
  `preserve`-bucket file (S2 keep-user) AND any true-overlap the user keeps (S4 user-wins).

`decisions[]` is flat (one entry per file, no nesting). EVERY file from all three buckets appears
exactly once. `resolvedContent` is populated ONLY for `write`; `patch` ONLY for `patch`; both empty
for `preserve` (use the empty string, NOT null · the client parse coerces to '' but emit '' to be
explicit). The `pending` gate = the count of UNRESOLVED true-overlap conference entries (a `preserve`
is RESOLVED, not pending). The apply quality HALTS while `pending > 0` — it lands NOTHING until the
last overlap is resolved.
**Concluder**: `test -f <resolvedPath>` ok · the JSON parses ·
`|decisions| == |apply| + |preserve| + |conference|` (the **totality invariant**: every input entry
produced exactly one decision — no diff entry lost) · every `write` decision has non-empty
`resolvedContent` · every `patch` decision has non-empty `patch` · `summary.pending` matches the count
of unresolved true-overlap entries.

---

## Maintenance (per CLAUDE.md §9 Suite 8 dispatch)

```
Band [Skills S1-S5]: ingest → auto-path → zone-union → conference-surface → emit
Band (Conference Decide): skill currency — diff-shape drift? new collision zone? resultTree read change? → update skills
Band [R7 S8AT]: Diagnose · update Onyx S8AT · update SUITE8-REGISTRY trajectory
```

The Muxistration Proof for this resolver is Demonstration (the resolved JSON exists + parses + the
totality invariant holds) AND Diastration (the union content carries both sides; the surfaced entries
match the genuine collisions). Narrative-only resolution = E4 (Volume-of-Declaration). Skills documented
but never executed = E6 (Credentialed-Lambda) — the resolver must RUN, not merely describe.
