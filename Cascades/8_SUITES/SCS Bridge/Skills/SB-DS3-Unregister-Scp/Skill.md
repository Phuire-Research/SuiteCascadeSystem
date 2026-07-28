# SB-DS3 · SCP Undock Cleanup

**Skill Code**: SB-DS3
**Suite 8**: SCS Bridge
**Iced Skill**: scpDockHostUnregisterScp
**Stage**: D (Inducted as Quality · Stage E Diameter maintained with Quality file)
**Pattern**: S10 Pattern 4 + Pattern 6 defensive (immutable delete + no-op guard)

---

## Pearl

An undocking SCP is removed from `connectedScps` Record. If the SCP is not present, the reducer returns `{}` (Pattern 6 no-op) · S12 ShortestPath honored. Pattern 4 immutable delete uses iteration construction (not destructure-rest) for stable TypeScript inference.

---

## Quality Diameter

| Field | Value |
|---|---|
| **Quality** | `scpDockHostUnregisterScp` |
| **Action Type String** | `'SCP Dock Host Unregister Scp'` (Verbose Split Naming · S10 NON-NEGOTIABLE) |
| **Payload** | `{ scpName: string }` |
| **File** | `src/lib/bridge/concepts/scpDockHost/qualities/scpDockHostUnregisterScp.quality.ts:36-57` |
| **Reducer Return (entry present)** | `{ connectedScps: newRecord, lastUpdateAt: now }` (entry omitted) |
| **Reducer Return (entry missing)** | `{}` (Pattern 6 no-op · S12 ShortestPath) |

---

## Actualization Sequence

1. **Undock condition triggered** — SCP process exit, FSM transition, or explicit undock dispatch
2. **scpDockHostUnregisterScp dispatched** — `{ scpName }`
3. **Reducer defensive check** — if `state.connectedScps[scpName] === undefined` → return `{}` no-op
4. **Else reducer constructs new Record** — iteration over keys, skip the matching scpName
5. **Returns new Record + lastUpdateAt** — S12 ShortestPath honored
6. **DECK K observers fire** — animatedTui M17 closure detects size delta · bridge.json synced (Macro 2)

---

## Defensive Discipline

The Pattern 6 No-State-Change defensive variant is critical for idempotent teardown paths. If a teardown loop iterates connectedScps and emits unregister actions, no error fires when the SCP is already absent.

---

## Concluder

- Test file: `src/lib/bridge/concepts/scpDockHost/scpDockHost.test.ts:178-220`
- Two tests: existing entry removal + nonexistent entry defensive `{}` return
- S12 verification: defensive `{}` return passes `expect(result).toEqual({})`

---

## Iced Skill Stage E Bidirectional Diameter

| Half | Artifact |
|---|---|
| Ego (Informative) | THIS Skill.md · documents undock cleanup semantics |
| Lambda (Doer) | `scpDockHostUnregisterScp.quality.ts` reducer · executes deterministically |

---

## Stratimuxian Scholar Citations

- **S10 Quality Creation Patterns** — Pattern 4 immutable delete + Pattern 6 No-State-Change defensive
- **S12 Reducer Performance** — ShortestPath · defensive `{}` for no-op path

---

**Cycle**: 117 · ICSM1-D1 atomic actualization · Iced Skill Trilogy Macro 1
