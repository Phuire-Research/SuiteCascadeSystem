# SB-DS5 · Bridge SCP Dock Server Shutdown

**Skill Code**: SB-DS5
**Suite 8**: SCS Bridge
**Iced Skill**: scpDockHostTeardown
**Stage**: D (Inducted as Quality · Stage E Diameter maintained with Quality file)
**Pattern**: S10 Pattern 1 Simple Quality · SBOTD Step 1 prepend (M8 rule)

---

## Pearl

At Muxium teardown, the HTTP Dock Listener closes BEFORE child SCP processes are signaled · the dock state is fully reset. SBOTD M8 prepend rule: scpDockHostTeardown is the NEW Step 1 (most recently inducted Concept closes first · LIFO discipline · prior 6 SBOTD positions shift +1). HTTP listener close call lives in the principle closure; reducer handles the state reset.

---

## Quality Diameter

| Field | Value |
|---|---|
| **Quality** | `scpDockHostTeardown` |
| **Action Type String** | `'SCP Dock Host Teardown'` (Verbose Split Naming · S10 NON-NEGOTIABLE) |
| **Payload** | `Record<string, never>` (empty · Pattern 1 Simple) |
| **File** | `src/lib/bridge/concepts/scpDockHost/qualities/scpDockHostTeardown.quality.ts:36-49` |
| **Reducer Return** | `{ dockServerListening: false, dockServerPort: 0, connectedScps: {}, suite8Registrations: {}, lastUpdateAt: now }` (S12 ShortestPath) |
| **Side-Effect Owner** | Principle Surface 4 (`scpDockHost.principle.ts:202-216`) closes `http.Server` in closure |

---

## SBOTD 7-Step Discipline (M8 prepend-only rule)

```
Step 1.  scpDockHostTeardown          ← NEW (this Quality · ICSM1-D1 prepend)
Step 2.  scpSpawnManagerTeardown      ← was Step 1
Step 3.  scpMessageRouterTeardown     ← was Step 2
Step 4.  scpLifecycleTeardown         ← was Step 3
Step 5.  scpRegistryWatcherTeardown   ← was Step 4
Step 6.  scsBridgeMuxiumStop          ← was Step 5
Step 7.  muxium.close(false)          ← was Step 6
```

LIFO discipline preserved: most recently added concept closes first. HTTP listener closes BEFORE child SCP processes are SIGTERMed — no new dock POSTs accepted during teardown.

---

## Actualization Sequence

1. **stop() invoked** on ScsBridgeMuxiumHandle (CSBMOTE slot in cleanExit)
2. **scpDockHostTeardown dispatched** (FIRST · SBOTD Step 1)
3. **Reducer resets state** — listening=false, port=0, Records empty, lastUpdateAt updated
4. **Principle Surface 4 observes** action type · closes http.Server reference in closure
5. **httpServer = null** · startupDispatched = false (repeat-safe teardown)
6. **Steps 2-7 fire in sequence** — spawn manager, message router, lifecycle, registry watcher, muxium stop, muxium.close(false)

---

## Concluder

- Test file: `src/lib/bridge/concepts/scpDockHost/scpDockHost.test.ts:268-296`
- Single test: full state reset from active to default values
- SBOTD ordering verification: live in scsBridgeMuxium.ts Comment Block + Read-back

---

## Iced Skill Stage E Bidirectional Diameter

| Half | Artifact |
|---|---|
| Ego (Informative) | THIS Skill.md · documents teardown semantics + SBOTD M8 rule |
| Lambda (Doer) | `scpDockHostTeardown.quality.ts` reducer · executes deterministically · principle Surface 4 closes server |

---

## Stratimuxian Scholar Citations

- **S10 Quality Creation Patterns** — Pattern 1 Simple Quality (empty payload)
- **S12 Reducer Performance** — ShortestPath · all 5 changed fields in single return
- **M8 SBOTD Prepend-Only Rule** — Onyx Tier-N · Iced Skill Trilogy Macro 1 graduation 4→5

---

**Cycle**: 117 · ICSM1-D1 atomic actualization · Iced Skill Trilogy Macro 1
