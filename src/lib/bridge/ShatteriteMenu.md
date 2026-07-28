# The Shatterite Menu — How an Anchor Authors It

> **This document is prepended to every page-bound Anchor's onboarding prompt.** It is the
> generic *How* of the Shatterite Menu — the schema, the option kinds, and the submission flow —
> shared by every Suite 8 Anchor. The *Why* (the routine: which menu to author, when to advance
> it, what your aspects do) lives in the Onboard.md that follows the separator below this document.
>
> Read this once. It teaches you the one Lambda that makes a menu appear: writing a valid
> `menu.json` into your RI directory.

---

## 1. What the Shatterite Menu Is

The Shatterite Menu is the page's primary interactive surface — a titled stage of clickable rows
the user reads and acts on. **You, the Anchor, author it.** The page does not invent menu content;
it renders exactly the stage you write.

The mechanism is a single file write:

1. You write a `menu.json` file into your RI directory:
   **`Cascades/Extended/<your-Suite-8-name>/menu.json`**.
2. The bridge's menu watcher (the IAJW dir-watch arm) detects the write, parses it, and broadcasts
   the parsed stage to the page muxium.
3. The page's `ShatteriteMenu` component re-renders with your new stage.

**This file-write is the load-bearing Lambda.** No `menu.json` → no menu. A malformed `menu.json`
→ the parser silently drops it (no error surfaces to you) and the page keeps the prior stage. You
advance the menu over time by re-writing the WHOLE file with an incremented `stageIndex`.

---

## 2. The `menu.json` Schema (Byte-Accurate to the Parser)

`menu.json` holds a **SINGLE `MenuStage` object** (NOT an array). The parser requires three fields
and accepts two optional ones:

```json
{
  "stageIndex": 0,
  "title": "string — REQUIRED — shown as the menu heading",
  "prompt": "string — OPTIONAL — one-line instruction shown under the title",
  "options": [
    { "label": "string", "kind": "scs", "scsCommand": "SCS:..." }
  ]
}
```

| Field | Type | Required? | Parser behavior |
|---|---|---|---|
| `stageIndex` | number | **YES** | Missing / non-number → the WHOLE stage is dropped. Drives re-render. |
| `title` | string | **YES** | Missing / non-string → the WHOLE stage is dropped. |
| `options` | array | **YES** | Missing / non-array → the WHOLE stage is dropped. |
| `prompt` | string | no | Non-string → coerced to `""`. |

Each entry in `options` is a `MenuOption`:

| Field | Type | Required? | Parser behavior |
|---|---|---|---|
| `label` | string | yes | Non-string → coerced to `""`. The clickable row text. |
| `kind` | `"scs"` \| `"focus"` \| `"askMore"` | yes | Anything else → coerced to `"scs"`. The dispatch lane. |
| `scsCommand` | string | yes | Non-string → coerced to `""`. The command / assist text. |
| `inputConfig` | object | no | Present + valid → renders an input surface. Absent / malformed → plain button (backward-compat). |

**Note on resilience:** the parser normalizes each option defensively. A bad `kind` becomes
`"scs"`; a missing string becomes `""`. But the three top-level required fields
(`stageIndex`, `title`, `options`) are hard gates — get any of them wrong and the entire stage is
discarded with a console warning you will not see.

---

## 3. Option Kinds — What a Click Does

Every `MenuOption` has a `kind` that selects its behavior on click. The three base kinds:

### `"scs"` — relay a command to you (the Anchor)

The page sends the option's `scsCommand` text to YOUR terminal as a directive (via the bridge's
`triggerSendMessage`). Use this to offer next actions the user triggers from the menu.

```json
{ "label": "Run the next research pass", "kind": "scs", "scsCommand": "SCS:Research" }
```

When you receive `SCS:Research`, you actuate it per your Instance.md aspect map and respond with
your `:OK:` line. To advance the menu afterward, re-write `menu.json` with an incremented
`stageIndex`.

### `"focus"` — focus your terminal window

Focuses YOUR session window so the user can type to you directly. `scsCommand` is `""` (empty —
nothing is relayed).

```json
{ "label": "Talk to me directly", "kind": "focus", "scsCommand": "" }
```

### `"askMore"` — focus + inject an assist prompt

Focuses you AND relays the `scsCommand` text as an assist prompt (the AMAF pattern). Use for
"tell me more" rows — the user clicks, your window comes forward, and the assist text arrives as a
message so you can elaborate.

```json
{ "label": "What can this page do?", "kind": "askMore", "scsCommand": "SCS:Onboard Explain this page and what I can do here." }
```

---

## 4. Input Surfaces — the Optional `inputConfig`

An option may carry an **optional `inputConfig`** that turns the row into a WRITE surface: the user
types or picks a value below the label, then Submits, and the page relays a directive back to you.
The input kind rides on `inputConfig`, **NOT** on `kind` — so `kind` stays `scs`/`focus`/`askMore`
and the existing dispatch lanes are untouched. An option with no `inputConfig` renders exactly as a
plain button (backward-compat).

> **Rule — topic-editing options MUST use `kind:"tags"` with `inputConfig`.** Any menu option
> whose purpose is to enter, add, or edit research topics MUST carry an `inputConfig` of
> `{ "kind": "tags", ... }`. A plain `scs`/`askMore` row with no `inputConfig` is NOT acceptable
> for topic entry — it redirects the user to a separate zone instead of collecting input in-menu.
> The `tags` kind IS the topic-editing primitive: on Submit the component assembles
> `SCS:TopicUpdate <comma-space-delimited labels>` and relays it to you — the `scsCommand` field
> on the row is present for parser compatibility but is NOT used by Submit; the directive prefix
> is hardcoded. Use `kind:"tags"` whenever the menu lets the user manage research topics.

### The exact `inputConfig` shape

```ts
inputConfig: {
  kind: "tags" | "text" | "select",   // REQUIRED — the input modality
  placeholder?: string,                // OPTIONAL — field hint shown in the input
  options?: string[]                   // OPTIONAL — picker choices; ONLY meaningful for kind "select"
}
```

| `inputConfig` field | Type | Required? | Parser behavior |
|---|---|---|---|
| `kind` | `"tags"` \| `"text"` \| `"select"` | **YES** | Anything else → the entire `inputConfig` is dropped → the row becomes a plain button. |
| `placeholder` | string | no | Non-string → omitted. |
| `options` | string[] | no | Non-array → omitted. Each non-string entry is filtered out. Only used for `kind: "select"`. |
| `pairDirective` | string | no | Non-string → omitted. Present → the row's Submit FOCUSES + sends `<pairDirective> <input>` (pairing path · §4b) instead of the topic-update (CEWT) path. |

**Validation gate:** the parser only keeps an `inputConfig` whose `kind` is exactly one of the three
input kinds. A missing or malformed `inputConfig.kind` drops the whole `inputConfig` (the row stays a
plain dispatch button).

### Example — `kind: "tags"`

A free-form chip input. The user types categories; whitespace adds each as a removable chip.

```json
{
  "stageIndex": 1,
  "title": "Define your research frontier",
  "prompt": "Add the topics you want me to track.",
  "options": [
    {
      "label": "Add topics",
      "kind": "scs",
      "scsCommand": "SCS:TopicUpdate",
      "inputConfig": {
        "kind": "tags",
        "placeholder": "Type a category, space to add…"
      }
    }
  ]
}
```

### Example — `kind: "text"`

A single free-text field.

```json
{
  "stageIndex": 1,
  "title": "Name your focus area",
  "options": [
    {
      "label": "Set focus",
      "kind": "scs",
      "scsCommand": "SCS:TopicUpdate",
      "inputConfig": {
        "kind": "text",
        "placeholder": "e.g. renewable-energy"
      }
    }
  ]
}
```

### Example — `kind: "select"`

A picker constrained to the `options` list.

```json
{
  "stageIndex": 1,
  "title": "Pick a domain",
  "options": [
    {
      "label": "Choose domain",
      "kind": "scs",
      "scsCommand": "SCS:TopicUpdate",
      "inputConfig": {
        "kind": "select",
        "placeholder": "Select a domain…",
        "options": ["physics", "biology", "economics"]
      }
    }
  ]
}
```

---

## 4b. Pairing Submit — the Optional `inputConfig.pairDirective`

Beyond `kind`/`placeholder`/`options`, an `inputConfig` may carry an **optional `pairDirective`**
string. Its PRESENCE flips the row's **Submit** from the topic-update path (CEWT · §5) to the
**pairing path**: on Submit the page FOCUSES your Anchor terminal AND sends a single combined
message —

```
<pairDirective> <the user's typed input>
```

— where `<pairDirective>` is the bound directive you authored and `<user input>` is whatever the
user typed in the row's field (it may be empty). **An empty input sends the bound `pairDirective`
ALONE** — the bound directive is the point; the user input is optional refinement. The Submit
button is therefore clickable even with an empty field whenever a `pairDirective` is present (it is
gated only by a live Anchor + not-already-submitting). The combine is whitespace-joined and trims a
leading space when either side is empty.

Use pairing when a menu option binds a FIXED directive prefix that must travel WITH a user-typed
query to you — e.g. a "Diamond · Enhancement" row that always sends an enhancement directive, with
the user's optional text appended. The option `kind` stays `scs`/`focus`/`askMore` (the pairing
path overrides Submit regardless of kind); only the `pairDirective` field selects the behavior. An
`inputConfig` with NO `pairDirective` keeps the topic-update (CEWT) Submit path unchanged.

### The exact pairing shape

```json
{
  "label": "Diamond · Enhancement",
  "kind": "scs",
  "scsCommand": "SCS:Diamond Scale: initial Aspect: Enhancement",
  "inputConfig": {
    "kind": "text",
    "placeholder": "What to enhance… (optional)",
    "pairDirective": "SCS:Diamond Scale: initial Aspect: Enhancement"
  }
}
```

On Submit with the user typing `the dispatch beats`, you receive:
`SCS:Diamond Scale: initial Aspect: Enhancement the dispatch beats`. On Submit with an empty field
you receive the bound directive alone: `SCS:Diamond Scale: initial Aspect: Enhancement`.

> **Rule.** `pairDirective` rides on `inputConfig`, never on `kind`. Its presence is the
> discriminator; its value is the bound directive. A `pairDirective` row's Submit is enabled with
> empty input (sends the directive alone); a non-`pairDirective` input row keeps the require-
> non-empty Submit guard.

---

## 5. The Input-Submission Flow

When the user fills an input surface and clicks **Submit**, the page does the following — and then
the directive arrives at YOUR terminal, where the rest is your job:

1. **The component tokenizes the input** (the WCTTR rule, for `tags`):
   - Whitespace splits topics — each whitespace-separated run becomes ONE category.
   - `-` `_` `.` `/` are **intra-token connectors**: any connected form is a SINGLE category.
     `machine-learning ai_ethics data.science` → three categories: `machine-learning`,
     `ai_ethics`, `data.science`.
   - Empty tokens are dropped.
   - For `text` / `select`, the single trimmed value is the one category.

2. **On Submit the component relays a directive to you** via the page's existing send-message
   channel (`triggerSendMessage` — no new tool, no new endpoint):

   ```
   SCS:TopicUpdate <comma-space-delimited category labels>
   ```

   For the `tags` example above the body is exactly: `machine-learning, ai_ethics, data.science`.

3. **You (the Anchor) receive `SCS:TopicUpdate <labels>`** and:
   - Extract and normalize the categories from the comma-space-delimited body.
   - Upsert your topics list (e.g. `topics.json` in your RI dir — add / toggle / remove).
   - The second STCP relay (the topics dir-watch) then re-renders the Research Frontier live, so
     the user sees their categories reflected immediately.

> **Hard rule — category labels MUST NOT contain commas.** The body is comma-space delimited; a
> comma inside a label would split it into two categories. Connectors (`-` `_` `.` `/`) are safe;
> commas are not.

The Submit row is gated: it only relays when a live Anchor exists and the composed category string
is non-empty (an empty input yields nothing to submit).

---

## 6. The Hard Rules (Memorize These)

1. **`menu.json` is a SINGLE `MenuStage` object**, never an array.
2. **`stageIndex` MUST INCREMENT every rewrite.** The watcher suppresses a re-broadcast when
   `stageIndex` is unchanged — so re-using an index means your new stage never appears. First write
   `0`, then `1`, `2`, `3`, … Never re-use a `stageIndex`.
3. **Write the WHOLE object each rewrite.** The watcher REPLACES the stage; it does not merge. Any
   field you omit is gone from the rendered stage.
4. **A malformed write is silently dropped.** No error, no retry surfaces to you. If your menu does
   not appear, re-check the three required fields (`stageIndex` number, `title` string, `options`
   array) and that the file is valid JSON.
5. **`kind` is one of `scs` / `focus` / `askMore`.** Input kinds (`tags` / `text` / `select`) ride
   on `inputConfig`, never on `kind`.
6. **Category labels carry no commas** (see §5).
7. **`inputConfig.pairDirective` selects the pairing path** (§4b): present → Submit focuses + sends
   `<pairDirective> <input>` (empty input → the directive alone, Submit enabled); absent → the CEWT
   topic-update path with the require-non-empty Submit guard.

---

## 7. Where This Document Ends and Your Routine Begins

Everything above is the generic *How* — true for every Suite 8 Anchor. Immediately below this
document (after the separator) is YOUR Onboard.md: the *Why* — your specific routine for which menu
to author on this page, when to advance it, and what your aspects do when a relayed directive
arrives. Read the How here; then execute the routine that follows.

---

## 8. Your Diamond + Onyx — How the Page's Cascade Pane Appears

Beyond `menu.json`, your RI directory carries your **Diamond** (your plan) and your **Onyx** (your
trajectory). When you write them and point your manifest at them, the page renders them in a
collapsible Diamond / Onyx pane — exactly the way `menu.json` renders the Shatterite Menu. This is
the same one-Lambda discipline: a file-write plus a manifest update makes the surface appear.

### The two file kinds (the filename prefix is load-bearing)

The page classifies your RI files BY THEIR NAME. Use these exact prefixes:

- **Diamond** (your plan) → `DIAMOND-TIER-N.md` (or `MASTER-DIAMOND-*.md`).
- **Onyx** (your trajectory) → `ONYX-TIER-N.md`.

Any other name is classified as neither — the pane shows nothing for it. Start at tier `0`
(`DIAMOND-TIER-0.md`, `ONYX-TIER-0.md`); increment the tier number when a document grows large
enough to roll over.

### The manifest keys (`Cascade.json`)

Your `Cascade.json` carries the keys the bridge watcher reads to locate your active documents.
Each value is a **repository-relative** path (from the repo root, NOT from your RI dir):

| Key | Points at |
|---|---|
| `activeDiamond` | your latest Diamond `.md` |
| `activeOnyx` | your latest Onyx `.md` |
| `priorDiamond` | the previous Diamond, after you tier (optional) |
| `priorOnyx` | the previous Onyx, after you tier (optional) |
| `masterDiamond` | a long-lived master Diamond, if you keep one (optional) |

Example (cycle 0):

```json
{
  "schemaVersion": "1",
  "cycles": [],
  "activeDiamond": "Cascades/Extended/<your-Suite-8-name>/DIAMOND-TIER-0.md",
  "activeOnyx": "Cascades/Extended/<your-Suite-8-name>/ONYX-TIER-0.md"
}
```

Keep `schemaVersion` and `cycles` as-is. When you tier, move the old paths into
`priorDiamond` / `priorOnyx` and point `activeDiamond` / `activeOnyx` at the new tier files.

### The load-bearing Lambda

The pane appears when BOTH happen: (1) the `DIAMOND-TIER-N.md` / `ONYX-TIER-N.md` file exists, AND
(2) `Cascade.json` `activeDiamond` / `activeOnyx` point at it. The bridge watcher detects the
`Cascade.json` change, resolves the manifest paths, and streams your content to the page. Writing
the `.md` alone — without updating the manifest key — does NOT surface it.
