# S3 — Clone Repo

**Strategy**: Clone Repo
**Phase**: S3 (first write — bridge-owned temp space only)
**Conductor**: SCS Bridge Install Conductor
**Input**: Confirmed install decision; `bridgeRoot()` path for temp dir placement
**Output**: `<bridgeRoot>/install-temp/` with shallow-cloned Cascades/ scaffold

---

## Engagement Criteria

This strategy triggers when:
- S2 returns `confirm` decision (user explicitly approved install)

S3 performs a shallow clone of `scs-bridge` main into a bridge-owned temporary directory.
All clone artifacts land in `bridge-owned temp` space — Pattern 4 discipline: never in
Claude territory, never in user's project territory during clone phase. The Concluder
verifies the `Cascades/` directory is present in the cloned temp before S4 proceeds.

---

## Vermillion Plan

```
<VermillionPlan topic="Clone Repo">

Band 1 [R1 Red — Curate] (Tier 0):
  Informative: Verify git available; compute bridgeRoot() temp path;
              check temp dir absent (no leftover from prior attempt)
  Actionable: Document clone command + target path; clean any prior partial temp dir

Band 2 [R5 Blue — Build] (Tier 0):
  Informative: Read computed clone command from Band 1
  Actionable: Execute: git clone --depth=1 <repo-url> <bridgeRoot>/install-temp/
              Emit progress signal to Bridge UI during clone

Band 3 [R7 Fuchsia — Verify] (Tier 0):
  Informative: Read clone result; probe existsSync(join(bridgeRoot,'install-temp','Cascades'))
  Actionable: Concluder: test -d path && echo ok;
              If fail → emit clone-failed with diagnostics;
              Remove partial install-temp/ before abort (rimraf or rm -rf)

</VermillionPlan>
```

---

## Invariants

- Clone target is `<bridgeRoot>/install-temp/` — bridge-owned territory; never user project root
- `git clone` exit 0 required before Concluder runs
- Concluder: `test -d <bridgeRoot>/install-temp/Cascades && echo ok` must return `ok`
- `git` not available → abort with diagnostic; no temp dir left behind
- Clone fails mid-stream → remove partial `install-temp/` before abort
- Network timeout → same as clone fail; temp dir cleaned
- Pattern 4 preserved: bridge-owned territory only in this phase; no writes to user project root
