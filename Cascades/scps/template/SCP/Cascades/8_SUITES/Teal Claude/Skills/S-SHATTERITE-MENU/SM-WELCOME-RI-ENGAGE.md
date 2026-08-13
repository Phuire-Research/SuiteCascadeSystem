# SM-WELCOME-RI-ENGAGE — Shatterite Menu Reference Design (Diamond B-25-UX · Install-State Branching Extension)

**Origin Strategy**: SCS Bridge Strategy S8-StratidianWelcome (Band 6 closeout)
**Pewter HiFi Tokens**: D5 closed-box border · D7 active-button inversion · D1 color tokens (Cobalt continue · Viridian project-context · Orange dialectic · Rose-tint exit · Pewter neutral)
**Frontier Patterns**: CD-100 MSEPD (memory-surfaced) · CD-102 CDWE (Cinnabar dialectic) · CD-103 RIIA (RI activated) · CD-104 FDSI (First Diamond ready) · **CD-109 MSMRD** (Mandatory-Shatterite-Menu-Rendering-Discipline) — variants MSMRD-FS / MSMRD-EP / MSMRD-RE keyed by `Cascade.json.installState` (CASS — Cascade-JSON-Authoritative-State-Source · IFSB — Install-Flow-State-Branching · IDDS — Install-Determination-Driven-Subsequent-Behavior)

---

## Engagement Criteria

Renders AFTER S8 Band 5 RI activation completes (Onyx-Tier-1.md + Diamond-Tier-1.md + Cascade.json cycle 0→1 all written atomically). This menu replaces the prior generic fresh-slate menu (Hello World / Suite Color / Registry / Exit).

### Branch Signal — PRIMARY (CASS · CD-109 MSMRD)

**Read `Cascades/Cascade.json` `installState` field** as the PRIMARY branch discriminant. This is the install-time-determined state (written once at scaffold by `installSpawn.ts` per CASS · IDDS), authoritative across all consumers (M69 Canonical-Registry-Source). The MSMRD doctrine forbids re-prompting the user for state that `installState` already answers.

| `installState` value | Variant | Path | First Diamond | Title color | Primary key |
|---|---|---|---|---|---|
| `'fresh-slate-scaffolded'` | **MSMRD-FS** | Fresh-slate induction | Tutorial | **Cobalt** | `[F]` First Diamond |
| `'existing-project-augmented'` | **MSMRD-EP** | Existing-project augmentation | Recovery | **Viridian** | `[C]` Continue |
| `'reinstall-existing'` | **MSMRD-RE** | Reinstall (welcome back) | Recovery | **Viridian** | `[C]` Continue |
| absent / `undefined` / `'unknown'` | **Fallback** | Conservative existing-project | Recovery | **Viridian** | `[C]` Continue · warn-on-render |

**Fallback Rule**: legacy Cascade.json (pre-Install-State Branching Diamond) lacks the field. Per R4 Green H4 schema-migration discipline, treat absent/`undefined`/`'unknown'` as **MSMRD-EP** (existing-project) — the conservative default that NEVER overwrites user context and NEVER presents Tutorial-first to a returning user. Emit a single log line `shatterite.welcome.install-state-fallback` and proceed. **NEVER** assume fresh-slate from an absent field — that would present Tutorial to a returning user, the exact UX failure CD-109 MSMRD exists to prevent.

### Branch Signal — SECONDARY (Memory probe — contextual only)

`memoryProbeResult.classification` (CD-100 MSEPD) and `memoryProbeResult.sessionCount` / `memoryProbeResult.latestMtime` remain AVAILABLE as **secondary context** for:
- RI activation depth (how much prior-session detail to surface in the intro line)
- Detection-summary content (e.g., "Last session: 3 days ago (4 sessions on file)")
- Composing the MSMRD-EP detection-summary block

**NOT for variant selection.** A user with `installState === 'fresh-slate-scaffolded'` who happens to have memory-probe matches from other directories must STILL render MSMRD-FS. Memory probe and installState answer different questions (CD-109 doctrine, R4 H2 resolution):

| Signal | Source | Answers |
|---|---|---|
| `installState` (PRIMARY) | `Cascades/Cascade.json` — written at install scaffold (CASS) | "Did this user have a CLAUDE.md when they installed SCS in THIS directory?" |
| `memoryProbeResult.classification` (SECONDARY) | `~/.claude/projects/` session JSONLs | "Has this user used Claude Code before, machine-wide?" |

### Variant Path Names

- **PATH A: MSMRD-EP** (`installState === 'existing-project-augmented'`)
- **PATH A': MSMRD-RE** (`installState === 'reinstall-existing'` · welcome-back framing)
- **PATH B: MSMRD-FS** (`installState === 'fresh-slate-scaffolded'`)
- **Fallback → PATH A** (conservative MSMRD-EP)

---

## PATH A · MSMRD-EP — Existing-Project Augmented Rendering (paste-ready ANSI)

**Triggered by**: `installState === 'existing-project-augmented'` · OR fallback (absent / `undefined` / `'unknown'`).

**Project-name honoring (MSMRD-EP discipline)**: read project name from `package.json` `name` field (if present) OR directory basename (`path.basename(userCwd)`). Use the detected name VERBATIM as the Suite 8 designation default — do NOT re-prompt the user to invent or auto-derive a name when a natural name already exists. The MSMRD-EP variant honors user context that pre-existed the install; re-prompting for state already present is the exact anti-pattern CD-109 MSMRD forbids (the doctrine: "no re-prompting for state already determined"). SM-NAME-SUITE-8 (when reached in this path) MUST collapse its options to: (1) Use detected name [Recommended] · (2) Customize · (3) Cancel.

```
┌─────────────────────────────────────────────────────────────┐
│  Welcome back to your project                               │
│                                                             │
│  Augmenting your existing project context                   │
│  · Detected name: My App Project Context                    │
│  · Last session: 3 days ago (4 sessions on file)            │
│  · Suite 8 created: My App Project Context                  │
│  · First Diamond opened: DIAMOND-TIER-1 (Recovery)          │
│                                                             │
│  ▶ [C] Continue prior work                ← /scs-cascade    │
│      Engages your First Diamond                             │
│                                                             │
│    [D] Cinnabar Dialectic                 ← refine direction│
│      Discover what to focus on next                         │
│                                                             │
│    [B] Suite 8 Browser                    ← explore         │
│      Meet the Manifold's registered Suite 8s                │
│                                                             │
│    ✓ Your Suite 8 page is live as the Home Page (done)     │
│      Your domain as your SCP's landing page (S9 → S10)      │
│                                                             │
│    [T] Tutorial                           ← learn the basics│
│    [Q] Exit                                                 │
│                                                             │
│  ↑/↓ select · Enter activate · Esc to [Q]                   │
└─────────────────────────────────────────────────────────────┘
```

---

## PATH A' · MSMRD-RE — Reinstall-Existing Rendering (paste-ready ANSI)

**Triggered by**: `installState === 'reinstall-existing'` (per R3 Yellow `deriveInstallState`, MuxState `'remuxify'` maps here).

Identical render to MSMRD-EP except for the title and intro framing — "Welcome back" foregrounds that the user has installed SCS in this directory before and is returning. Suite 8 designation honoring rule (package.json / directory basename default) applies identically.

```
┌─────────────────────────────────────────────────────────────┐
│  Welcome back · Reinstall detected                          │
│                                                             │
│  SCS was previously installed in this directory             │
│  · Detected name: My App Project Context                    │
│  · Last session: 3 days ago (4 sessions on file)            │
│  · Suite 8 created: My App Project Context                  │
│  · First Diamond opened: DIAMOND-TIER-1 (Recovery)          │
│                                                             │
│  ▶ [C] Continue prior work                ← /scs-cascade    │
│      Engages your First Diamond                             │
│                                                             │
│    [D] Cinnabar Dialectic                 ← refine direction│
│      Discover what to focus on next                         │
│                                                             │
│    [B] Suite 8 Browser                    ← explore         │
│      Meet the Manifold's registered Suite 8s                │
│                                                             │
│    ✓ Your Suite 8 page is live as the Home Page (done)     │
│      Your domain as your SCP's landing page (S9 → S10)      │
│                                                             │
│    [T] Tutorial                           ← learn the basics│
│    [Q] Exit                                                 │
│                                                             │
│  ↑/↓ select · Enter activate · Esc to [Q]                   │
└─────────────────────────────────────────────────────────────┘
```

---

## PATH B · MSMRD-FS — Fresh-Slate Scaffolded Rendering (paste-ready ANSI)

**Triggered by**: `installState === 'fresh-slate-scaffolded'`.

**Naming heuristic (MSMRD-FS discipline)**: there is no prior project context to honor. SM-NAME-SUITE-8 (when reached in this path) presents the full naming menu — auto-derived candidates from directory basename, canonical fallback ("My App Project Context"), and custom-name entry — because the user is inducting a new Suite 8 designation without any pre-existing user-chosen identifier. This is the structural Diameter to MSMRD-EP: EP honors what is there; FS inducts because nothing is.

```
┌─────────────────────────────────────────────────────────────┐
│  Welcome to SCS Bridge                                      │
│                                                             │
│  Your project is now a first-class Suite 8 within           │
│  the Stratidian Manifold. Nothing was overwritten.          │
│                                                             │
│  · Suite 8 created: My App Project Context                  │
│  · First Diamond opened: DIAMOND-TIER-1 (Tutorial)          │
│                                                             │
│  ▶ [F] Begin First Diamond (Tutorial)     ← /scs-cascade    │
│      Walk through your first Cascade cycle                  │
│                                                             │
│    [D] Cinnabar Dialectic                 ← discover        │
│      Have a 2-question dialogue about your project          │
│                                                             │
│    [B] Suite 8 Browser                    ← explore         │
│      Meet the Manifold's registered Suite 8s                │
│                                                             │
│    ✓ Your Suite 8 page is live as the Home Page (done)     │
│      Your domain as your SCP's landing page (S9 → S10)      │
│                                                             │
│    [Q] Exit                                                 │
│                                                             │
│  ↑/↓ select · Enter activate · Esc to [Q]                   │
└─────────────────────────────────────────────────────────────┘
```

---

## D1-D8 Token Application Table

| Element | Token | Color/Style |
|---|---|---|
| Border | D5 closed-box | Pewter neutral · DARK top-right + LIGHT bottom-left |
| Title (PATH A · MSMRD-EP) "Welcome back to your project" | D6 typography H1 | Viridian + BOLD (yours-already, project context augmented) |
| Title (PATH A' · MSMRD-RE) "Welcome back · Reinstall detected" | D6 typography H1 | Viridian + BOLD (yours-already, returning installer) |
| Title (PATH B · MSMRD-FS) "Welcome to SCS Bridge" | D6 typography H1 | Cobalt + BOLD (induction, Manifold welcome) |
| Detection summary line `· Last session` | D4 text shadow complement | Pewter DIM |
| Suite 8 name + Diamond name | D6 typography body | Viridian (yours-already) |
| Active option prefix `▶ ` | D7 button variant active | REVERSE + BOLD + suite-tinted |
| Option [C/F] Continue text | D1 color | Cobalt (primary action) |
| Option [D] Cinnabar text | D1 color | Orange (discovery / dialectic) |
| Option [B] Browser text | D1 color | Pewter normal |
| Option [T] Tutorial text | D1 color | Pewter normal |
| Option [Q] Exit text | D1 color | Rose-tint |
| Annotation `← /scs-cascade` etc. | D4 text shadow complement | Pewter DIM |
| Sub-description (under primary action) | D6 typography small | Pewter DIM |
| Footer hint | D6 typography small | Pewter DIM |

---

## Conference Pattern (AskUserQuestion integration · installState-driven per CD-109 MSMRD)

**Read order (PRIMARY → SECONDARY)**:
1. **PRIMARY**: read `Cascades/Cascade.json` once. Extract `installState` field.
2. Select variant: MSMRD-FS / MSMRD-EP / MSMRD-RE / Fallback (per branch-signal table above).
3. **SECONDARY** (contextual only): if memory probe available, format `sessionCount` + `latestMtime` for the EP/RE intro detection-summary block. Memory probe MUST NOT override variant selection — IDDS doctrine forbids re-deriving install-state from secondary signals.
4. **Detected project name** (EP/RE only): read `package.json` `name` field OR fall back to `path.basename(userCwd)`. Use VERBATIM as Suite 8 designation default for downstream SM-NAME-SUITE-8 (do not re-prompt invent/auto-derive when natural name exists).

```typescript
// PRIMARY signal: install-time state from Cascade.json (CASS · CD-109 MSMRD)
type InstallStateValue =
  | 'fresh-slate-scaffolded'
  | 'existing-project-augmented'
  | 'reinstall-existing'
  | undefined;

type Variant = 'MSMRD-FS' | 'MSMRD-EP' | 'MSMRD-RE';

function selectVariant(installState: InstallStateValue): Variant {
  if (installState === 'fresh-slate-scaffolded') return 'MSMRD-FS';
  if (installState === 'reinstall-existing')      return 'MSMRD-RE';
  // 'existing-project-augmented' OR undefined OR legacy/unknown → conservative EP fallback
  return 'MSMRD-EP';
}

const variant = selectVariant(cascadeJson.installState);

// SECONDARY (optional context only — never drives variant):
const ageStr = memoryProbeResult
  ? formatLatestSessionAge(memoryProbeResult.latestMtime)
  : null;
const sessionCountLine = memoryProbeResult
  ? `· Last session: ${ageStr} (${memoryProbeResult.sessionCount} sessions on file)\n`
  : '';

const detectedName = readProjectName(userCwd); // package.json.name ?? basename(userCwd)

const header =
  variant === 'MSMRD-FS' ? 'Welcome to SCS Bridge'
  : variant === 'MSMRD-RE' ? 'Welcome back · Reinstall detected'
  : 'Welcome back to your project';

const intro =
  variant === 'MSMRD-FS'
    ? `Your project is now a first-class Suite 8 within\nthe Stratidian Manifold. Nothing was overwritten.\n\n· Suite 8 created: ${suite8Name}\n· First Diamond opened: DIAMOND-TIER-1 (Tutorial)`
  : variant === 'MSMRD-RE'
    ? `SCS was previously installed in this directory\n· Detected name: ${detectedName}\n${sessionCountLine}· Suite 8 created: ${suite8Name}\n· First Diamond opened: DIAMOND-TIER-1 (Recovery)`
  : `Augmenting your existing project context\n· Detected name: ${detectedName}\n${sessionCountLine}· Suite 8 created: ${suite8Name}\n· First Diamond opened: DIAMOND-TIER-1 (Recovery)`;

const isFresh = variant === 'MSMRD-FS';

const menuData = {
  menuId: 'SM-WELCOME-RI-ENGAGE',
  variant,                              // emitted for diagnostics + downstream MSMRD audits
  installStateResolved: cascadeJson.installState ?? 'unknown',
  header,
  intro,
  rows: [
    {
      key: isFresh ? 'F' : 'C',
      label: isFresh ? 'Begin First Diamond (Tutorial)' : 'Continue prior work',
      annotation: '/scs-cascade',
      detail: isFresh
        ? 'Walk through your first Cascade cycle'
        : 'Engages your First Diamond',
      returns: { kind: 'continue' },
    },
    {
      key: 'D',
      label: 'Cinnabar Dialectic',
      annotation: isFresh ? 'discover' : 'refine direction',
      detail: isFresh
        ? 'Have a 2-question dialogue about your project'
        : 'Discover what to focus on next',
      returns: { kind: 'cinnabar' },
    },
    {
      key: 'B',
      label: 'Suite 8 Browser',
      annotation: 'explore',
      detail: 'Meet the Manifold\'s registered Suite 8s',
      returns: { kind: 'browser' },
    },
    // SPP (continuous motion): the home-page row is RETIRED — S9/S10 run automatically as
    // Steps 6-7 before this menu (Step 8) renders. The page is already live.
    ...(!isFresh
      ? [{
          key: 'T',
          label: 'Tutorial',
          annotation: 'learn the basics',
          returns: { kind: 'tutorial' },
        }]
      : []),
    {
      key: 'Q',
      label: 'Exit',
      returns: { kind: 'exit' },
    },
  ],
  footer: '↑/↓ select · Enter activate · Esc to [Q]',
};
```

**Fallback diagnostic**: when `installState` is absent / `undefined` / not one of the three enumerated values, emit `log('shatterite.welcome.install-state-fallback', { resolved: cascadeJson.installState ?? 'absent' })` AND render MSMRD-EP. Never silently default to MSMRD-FS — that path WOULD overwrite UX agency for any returning user whose Cascade.json predates the Install-State Branching Diamond.

Returns one of:
- `{ kind: 'continue' }` — agent engages `/scs-cascade` (terminal)
- `{ kind: 'cinnabar' }` — agent invokes Cinnabar Dialectic Suite 8 inline · re-renders this menu after
- `{ kind: 'browser' }` — agent engages `/scs-cascade:registry` (Suite 8 Browser variant)
- RETIRED (SPP continuous motion): S9-DomainPageCreate → S10-HomePageAdapt now run AUTOMATICALLY before this menu renders (Conductor.md Stepped Progress Protocol · Steps 6-7). The menu is Step 8 — no home-page row needed; the page is already live.
- `{ kind: 'tutorial' }` — agent overrides First Diamond to Tutorial type · then engages `/scs-cascade`
- `{ kind: 'exit' }` — agent terminates with graceful close (logs session)

---

## Cross-Surface Coherence

Final menu in S8 sequence (after SM-NAME-SUITE-8 and conditionally SM-MULTI-SUITE-BRANCH). Pewter D5 border + D7 inversion shared. PATH A (MSMRD-EP) and PATH A' (MSMRD-RE) use Viridian title to signal "yours-already, picking up where you left off" / "yours-already, returning installer"; PATH B (MSMRD-FS) uses Cobalt title to signal "induction, new beginning". The `[C]` vs `[F]` primary-action key alternates accordingly.

**SM-NAME-SUITE-8 reciprocal**: MSMRD-EP and MSMRD-RE pass the detected project name forward (from `package.json` `name` or `path.basename(userCwd)`) as the recommended default for SM-NAME-SUITE-8. SM-NAME-SUITE-8 in these paths MUST present the three-row honoring form: (1) Use detected name [Recommended], (2) Customize, (3) Cancel. MSMRD-FS passes no detected default; SM-NAME-SUITE-8 presents the full auto-derive + canonical-fallback + custom-name menu because no pre-existing user identifier exists to honor.

**Install-State Branching Diameter (R3 Yellow blueprint, R5 Blue implementation)**: this Skill is the consumer side of the Cascade.json `installState` Diameter. The CLI side (r5-Blue parallel dispatch) writes `installState` to `Cascades/Cascade.json` atomically at install scaffold (`installSpawn.ts` BECIS write site, derived via `deriveInstallState(muxState.state)` per R3 §2). The Skill side (this document) consumes that field at agent entry to select the correct MSMRD variant. Neither file knows about the other's implementation — the Diameter is the `installState` field itself, written once by the CLI and read once by the Skill.

---

## Pearl

The final menu IS the answer to "what's the user supposed to do now?" — and that answer is different for existing-project vs fresh-slate paths. The current generic menu (Hello World / Suite Color / Registry / Exit) treated every install identically, which is exactly wrong: a fresh-slate user benefits from Tutorial-first; an existing-project user is INSULTED by Tutorial-first because their prior work is being ignored. **Cascade.json `installState` (CASS · CD-109 MSMRD) is the PRIMARY signal** that selects MSMRD-FS / MSMRD-EP / MSMRD-RE; memory probe is secondary context only — it answers a different question (machine-wide Claude Code history vs this-directory install moment). Continue is the default for EP/RE because Continue is what the returning user actually wants; First Diamond Tutorial is the default for FS because the user has nothing yet to continue. **No re-prompting for state already in Cascade.json** — that is the CD-109 MSMRD invariant the Install-State Branching Diamond exists to enforce.
