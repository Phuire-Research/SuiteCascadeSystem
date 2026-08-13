# SB-DS1 · Bridge SCP Dock Server Startup

**Skill Code**: SB-DS1
**Suite 8**: SCS Bridge
**Iced Skill**: scpDockHostStart
**Stage**: D (Inducted as Quality · Stage E Diameter maintained with Quality file)
**Pattern**: S10 Pattern 5 Method Creator (side-effect deferred to principle closure)

---

## Pearl

The Bridge binds an HTTP Dock Listener on an ephemeral port at Muxium start · the bound port populates DECK K state · external clients discover the dock endpoint via observable state. The Lambda half of this Skill is the `scpDockHostStart` Quality reducer.

---

## Quality Diameter

| Field | Value |
|---|---|
| **Quality** | `scpDockHostStart` |
| **Action Type String** | `'SCP Dock Host Start'` (Verbose Split Naming · S10 NON-NEGOTIABLE) |
| **Payload** | `{ port: number; startedAt: number }` |
| **File** | `src/lib/bridge/concepts/scpDockHost/qualities/scpDockHostStart.quality.ts:42-52` |
| **Reducer Return** | `{ dockServerListening: true, dockServerPort: port, lastUpdateAt: startedAt }` (S12 ShortestPath) |
| **Side-Effect Owner** | Principle Surface 1 (`scpDockHost.principle.ts:99-149`) binds `http.Server` in closure |

---

## Actualization Sequence

1. **Muxium Start dispatch fires** (scsBridgeMuxiumStart) — muxiumActive transitions to `true`
2. **Principle Surface 1 observes** — `startupDispatched` guard + `httpServer === null` invariant
3. **buildDockHttpServer helper invoked** — pure constructor returns unbound http.Server with route handlers
4. **Server.listen(0, '127.0.0.1', callback) fires** — kernel assigns ephemeral port (TCP)
5. **getBoundPort helper resolves bound port** — returns `addr.port` from server.address()
6. **scpDockHostStart dispatched** — `{ port: boundPort, startedAt: Date.now() }`
7. **Reducer applies state** — dockServerListening=true · dockServerPort=N · lastUpdateAt updated

---

## DECK K Observability (S8 + S9)

After actualization, external observers can read:

```typescript
d.scsBridgeCore.d.scpDockHost.k.dockServerListening.select()  // true
d.scsBridgeCore.d.scpDockHost.k.dockServerPort.select()       // N (ephemeral port)
d.scsBridgeCore.d.scpDockHost.k.lastUpdateAt.select()         // epoch ms
```

The M17 closure in `animatedTui.ts` consumes these for bridge.json live-update (Macro 2 wires the writer).

---

## Concluder (Stratimuxian Scholar S11 Testing Patterns)

- Test file: `src/lib/bridge/concepts/scpDockHost/scpDockHost.test.ts:106-118`
- Pattern: Jest done callback · NEVER async/await
- Assertion: post-dispatch state mutation matches S12 ShortestPath return

---

## Iced Skill Stage E Bidirectional Diameter

| Half | Artifact |
|---|---|
| Ego (Informative) | THIS Skill.md · documents the Quality's actualization in natural language |
| Lambda (Doer) | `scpDockHostStart.quality.ts` reducer · executes deterministically at runtime |

Bidirectional citation: each cites the other. No one-way derivation. Iced Skill discipline preserved.

---

## Stratimuxian Scholar Citations

- **S10 Quality Creation Patterns** — Pattern 5 Method Creator selection rationale
- **S12 Reducer Performance** — ShortestPath return (only 3 changed fields)
- **S8 Muxified Concept Access** — Tier-2 path observability
- **S9 DECK K State Access** — within-principle k_ selectors

---

**Cycle**: 117 · ICSM1-D1 atomic actualization · Iced Skill Trilogy Macro 1
