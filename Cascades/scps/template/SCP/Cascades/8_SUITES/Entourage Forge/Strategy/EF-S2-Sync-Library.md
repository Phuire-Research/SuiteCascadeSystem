# EF-S2 · Sync Library — the Doctrine Strategy

The doctrine for the SyncLibrary means — the per-designation locality record, its accounted
surfaces, the per-SCP pattern library, and the motions an anchor performs against them.
The ANCHOR carries only the run — this Strategy carries every ground and law (the GR-S1
pattern · the shipped discipline · the EF-S1 register). A doctrine change is a STRATEGY
edit, never an anchor edit.

## The Sync Library (what it is)

The SyncLibrary is the per-designation locality record:
`Cascades/Extended/<designation>/SyncLibrary.json` (the one seat ·
`src/model/scpSyncLibrary.model.ts` resolveSyncLibraryPath). It names:

- `localScp` — the owning citizen (scp.config.json scpName).
- `specified` — the LOCALITY REGISTER: `null` = LOCAL (the own SCP is the subject);
  a name = SPECIFIED (a cross-SCP TARGET is the subject). Every locality-aware surface
  (the pattern picker, the color swatches, the Pewter preview) forks on this one key.
- `registered` — the DELIVERED surfaces: the paths the Zero-Knowledge usher replaces,
  vaults, and restores (menu.json · Cascade.json · Working/).
- `accounted` — the OBSERVED surfaces (the law below).

The usher (`src/concepts/suite8/principles/suite8SyncUsher.principle.huirth.ts`) composes
a locality snapshot from this record and RELAYS it to every client — the snapshot rides
the face (`S8LocalityFace` · `src/concepts/scsBridge/scsBridgeController.ts`), and the
widgets read the face, never the disk.

## The Accounted Surfaces (observed-not-delivered)

THE STRUCTURAL EXCLUSION LAW (`scpSyncLibrary.model.ts` · the SyncLibraryShape doc):
the usher's replace/restore/snapshot motions iterate ONLY `registered`; an accounted
surface is NEVER replaced, never vaulted, never restored — delivery over an accounted
surface would overwrite the observer's own file. Consumers WATCH an accounted surface at
whichever root the locality names and re-compose state from it.

The two accounted citizens (defaultAccountedSurfaces):

1. `hifiConfig` → `Cascades/hifiConfig.json` — the SCP's shipped HiFi design.
2. `patternLibrary` → `Cascades/patternLibrary.json` — the SCP's extensible pattern truth.

THE STAMP LANE: the usher's ONE accounted watcher basename-gates both citizens; a change
debounces through a 400ms settle (the C909/C910 config-change-generic coalescer — only the
burst's LAST arrival recomposes), then the snapshot carries a fresh mtimeMs stamp per
citizen — `targetHifiStamp` anor `targetPatternLibraryStamp` — to every client's face.
A widget watching a stamp refetches through its own read lane (the stamps carry TIME,
never content).

## The Pattern Library (the second citizen's shape)

`Cascades/patternLibrary.json` (`src/model/patternLibrary.model.ts` · the fs half;
`src/model/patternLibraryClientAccess.model.ts` · the fetch half) is the SCP's EXTENSIBLE
pattern availability:

```json
{
  "schemaVersion": "1",
  "patterns": [
    { "id": "kebab-case-id", "label": "Motif label", "css": "url(\"data:image/svg+xml,…\")" }
  ]
}
```

THE CSS SHAPE LAW (isValidPatternCss · `src/model/suitePatternOverride.model.ts`): a css
value is EXACTLY a `url("data:image/svg+xml,…")` tile anor the literal `none`. Nothing
else ever reaches the runtime — the anchored regex forbids trailing declarations and
quote-escapes, so an external-URL exfiltration vector cannot ride a library entry. The
gate fires at BOTH intake boundaries: the runtime registration (registerRuntimePatterns)
and the seed.

THE COLLISION LAW: the in-code PATTERN_LIBRARY is the FACTORY FLOOR and WINS on id
collision — resolution consults the factory first, the runtime registry second
(resolvePatternEntryById); a JSON entry can never override a factory entry.

THE SEED LAW (seedPatternLibraryIfAbsent · fired at server boot, vue.principle.ts P4
zone): an absent file is written FROM the factory floor; an existing file — well-formed
anor not — stands untouched (a citizen's hand-authored patterns are its truth; a
malformed file is the citizen's to mend). Read lanes: own = `GET /pattern-library`
(vue.principle.ts); foreign = `GET /scp-pattern-library/:scpName`
(cascadeMemoryQuery.model.ts).

## The Introduction Motion (a NEW pattern for a locality)

The motion an anchor performs to introduce a pattern — NO code edit, NO Turn Over:

1. COMPOSE the entry: a fresh kebab-case `id` (collision against the factory floor means
   the JSON entry never resolves — check `PATTERN_LIBRARY` ids first), a motif `label`,
   and a `css` value passing the shape law (achromatic white stroke/fill · low opacity ·
   100x100 viewBox is the house register).
2. DROP it into the TARGET's `Cascades/patternLibrary.json` `patterns` array (a plain
   JSON edit at the target's package root — the accounted citizen is agent-writable by
   design; never touch `registered` surfaces this way).
3. THE PICKUP IS STRUCTURAL: the target's accounted watcher fires → the 400ms settle →
   the snapshot recomposes with a fresh `targetPatternLibraryStamp` → every observer's
   face advances → a picker open under Specified=<target> refetches the target's library
   and SURFACES the new entry (its data-URI renders the thumbnail honestly even where the
   observer's own bundle lacks the id).
4. HONEST-ABSENCE: an id a locality's library cannot resolve renders a NAMED absent state
   in the picker — never a silent blank tile. If the new entry does not surface, the skip
   reason is named in telemetry (invalid-css-shape · invalid-id) — mend the entry, never
   force it.

## The Cross-Locality Set (the Specified push)

Choosing a pattern FOR a target rides the color circuit's pattern leg — the same
origin-blind injection, ids only, never css:

1. The picker under Specified builds the deck-matched Induction via the controller
   (buildApplyHifiPatternsAction · `scsBridgeController.ts`) and hands it to
   sendPatternsToTarget (`src/model/crossScpColorInjection.model.ts`) — the ephemeral
   WS to the target's port, the receipt await, the close.
2. The TARGET's Huirth Real (`applyHifiConfig.quality.huirth.diameter.ts`) validates each
   id against ITS OWN availability (in-code factory ∪ its JSON library, read fresh) —
   an unresolvable id SKIPS with a named reason — then merge-writes `patterns` into its
   `Cascades/hifiConfig.json` (merge-not-clobber) and broadcasts the return; the target's
   windows re-tile on ITS OWN return.
3. THE α-FIREWALL: the observer's push writes NOTHING to its own layers — no
   localStorage, no own paint, zero documentElement writes in the foreign path.
4. So the full circle for a new pattern: DROP the JSON entry at the target (the
   Introduction Motion) → the stamp surfaces it in the observer's picker → the observer
   SETS it for the target (the push) → the target's hifiConfig carries the id → the
   target re-tiles. Availability and selection are two motions, one accounted citizen
   apart.

## The Forge Menu Manifest (the page's Build Buttons)

`Cascades/8_SUITES/<designation>/ForgeMenu.json` — the per-PAGE Build Button manifest,
the Onboard.md sibling (it rides the S8 transferable package). The S8ForgeMenu widget
enumerates its entries as Build Buttons; each fire builds a Forge Menu Vermillion
(`buildForgeMenuVermillion` · `src/model/scpS8InstallCircuit.model.ts`) that ROUTES to the
live page-Forge (the `scs_deliver_vermillion` first-line contract) anor SPAWNS one (the
Vermillion riding the initialDirective + the page's target stamp).

```json
{
  "schemaVersion": 1,
  "entries": [
    { "id": "kebab-case-id", "label": "Button label", "prime": "The commission text the Vermillion carries." }
  ]
}
```

THE AUTHORSHIP LAW: the Forge authors anor refines this manifest FOR the page when
conferring on it — the buttons are the page's own capabilities, primed in the page's own
words; the page's Onboard.md remains the primary bound doctrine every button's Vermillion
cites. THE FACTORY LAW (the PATTERN_LIBRARY precedent): absent anor malformed, the
widget's hard-coded RD rows stand — manifest over factory, never a forced seed (the mint
does NOT create ForgeMenu.json). Read lane: `GET /s8-forge-menu/:designation`
(vue.principle.ts · Honest-Absence `{}`).

## The Concluding Discipline (the motion verified)

The introduction is verified by READ, never by claim: (1) the target's
`Cascades/patternLibrary.json` carries the entry (read-back); (2) the observer's picker
surfaces it under Specified=<target> (the stamp advanced); (3) a push lands it in the
target's `Cascades/hifiConfig.json` `patterns` (read the merged JSON). A failed leg is
reported HONESTLY with the named skip reason — never forced, never worked around by a
code edit (a code-edit intro would later surface as a Conference divergence against the
template). The bridge owns the SCP lifecycle; none of these motions needs a Turn Over.
