# SB-DS6 · Offscreen UI Doctrine (Developing New UI Elements)

**Skill Code**: SB-DS6
**Suite 8**: SCS Bridge
**Iced Skill**: offscreenUiDoctrine (developer doctrine · no runtime Quality)
**Stage**: Doctrine (Ego half of the in-DOM component family — the Lambda half is the components themselves)
**Pattern**: Caveat + RULED-OUT set + in-DOM solutions family + test heuristic

---

## Pearl

The SCP page renders OFFSCREEN → texture → presenter · OS-anchored chrome (native `<select>` popups, `input type=color|date|file` dialogs) has no window to anchor to and can NEVER open there · so every selection/picker control must render WHOLLY in-DOM · the in-DOM solutions family (ScsInput · ScsDropdown · the constrained canvas color picker · the drawer/expander idiom) IS the doctrine · the isTrusted probe distinguishes an offscreen-anchor failure from an input failure.

---

## 1 · The Mechanism (why OS chrome never opens)

| Stage | What happens |
|---|---|
| **Render** | The SCP page renders OFFSCREEN (`electronWindow.ts` · `offscreen: true`) — there is no on-screen window backing the page. |
| **Texture** | The offscreen frame is captured as a texture. |
| **Presenter** | The texture is composited/presented by the host surface. |
| **Input** | User input is RELAYED in via synthesized events (`sendInputEvent`-class → xterm/DOM), not a native OS event stream. |

**Consequence**: any UI element that opens an **OS-window-anchored** popup (drawn by the OS compositor, anchored to a real window handle) has NO window to anchor to on the offscreen surface — the popup silently never appears. The in-DOM page paints fine; only OS-drawn chrome is impossible.

---

## 2 · The RULED-OUT Set (never use on the offscreen surface)

- **Native `<select>` popups** — the option list is OS-drawn chrome.
- **`<input type="color">`** — opens the OS color dialog.
- **`<input type="date">` / `type="datetime-local">` / `type="month">` / `type="week">` / `type="time">`** — open the OS date/time picker.
- **`<input type="file">`** — opens the OS file dialog.
- **Any OS-window-anchored UI** (context menus drawn by the OS, native tooltips-as-popups, etc.).

The bare `<select>` **element** is fine as a value holder; it is the **popup** that cannot open. In practice this means the user cannot change the value → replace with an in-DOM control.

---

## 3 · The In-DOM Solutions Family

| Solution | Replaces | Path |
|---|---|---|
| **ScsInput** (custom caret) | text-entry `<input>` (text/search/url/email/password/number/tel) | `src/concepts/vue/components/ScsInput.vue` |
| **ScsTextarea** (custom caret) | `<textarea>` | `src/concepts/vue/components/ScsTextarea.vue` |
| **ScsDropdown** (in-DOM drawer) | `<select>` | `src/concepts/vue/components/ScsDropdown.vue` |
| **Constrained canvas color picker** | `input type="color"` | in-DOM canvas swatch/gradient (SuiteColorPickerPanel idiom) |
| **The drawer/expander idiom** | any OS popup | trigger button + `v-if` drawer painted into the page's own DOM (s8-picker · model picker) |

Each renders its trigger + choices wholly in-DOM, so it composes with the offscreen post-processing pipe. Showcased on `src/concepts/scsBridge/vue/components/ScsBridgeComponentsSubPage.vue` (input-showcase + dropdown-showcase sections).

---

## 4 · The Test Heuristic (isTrusted probe)

To confirm a control is failing because of the **offscreen anchor** (not a broken handler), probe `event.isTrusted`:

- `isTrusted === false` ⇒ the event was **synthesized** (the relayed input path). Expected on this surface.
- A **trusted** click (`isTrusted === true`) on the trigger that fires the handler but shows **NO OS popup** ⇒ the control is anchoring OS chrome offscreen, not an input failure. Replace with an in-DOM control.

The MD-9 diagnostic probe (`logModelTriggerProbe` in `ScsBridgeSessionManagement.vue`) is the reference instrument: it logs `isTrusted`, `defaultPrevented`, and option count on the model-picker wrapper.

---

## 5 · the Native `<select>` Sweep — EXECUTED (the SCSDropdown Select Sweep)

The registered debt was **executed** (SCP Actualization Epoch). `grep -rn '<select' src --include='*.vue'` was the authority; every value-holder native `<select>` migrated to `ScsDropdown` (v-model string · options `{value,label}` · disabled placeholder → the `placeholder` prop · behavior identical incl. any `@change`/`@update` side effects). Sites swept (9 files, 8 selects):

- `scsBridge/.../GitmStableAButton.vue` — branch picker → `branchOptions`; retired `.field-select` from grouped chrome (kept `.field-input`).
- `scsBridge/.../GitmFreehopButton.vue` — branch picker → `branchOptions`; retired standalone `.field-select`.
- `scsBridge/.../GitmSwordBButton.vue` — branch picker → `branchOptions`; retired `.field-select` from grouped chrome.
- `notification/.../NotificationLanding.vue` — priority picker → `priorityDropdownOptions` (`:model-value`+cast, `NotificationPriority` union).
- `suite8/.../Suite8ComponentSubPage.vue` — CPLD Suite-8 key picker → `suite8KeyOptions` + placeholder.
- `suiteCascade/.../SuiteCascadeComponentSubPage.vue` — CPLD cascade key picker → `cascadeKeyOptions` + placeholder.
- `suite8/.../Suite8OnDemand.vue` — Suite-8 spawn picker → `suite8SelectOptions`; retired `.odss-select` from grouped chrome (kept `.odss-textarea`).
- `suite8/.../SetupFormRenderer.vue` — dynamic form `select` field → `selectOptions(field.options)` (`:model-value`+`@update:model-value`→`setField`).
- `suite8/.../ShatteriteMenu.vue` — category picker (Submit-button row) → `selectRowOptions`; `:deep(.scs-dropdown-wrap){flex:1}` preserves the flex-row layout.

**Reference integration**: `ScsBridgeSessionManagement.vue` spawn-model-row (the model picker — already on ScsDropdown; the pattern the sweep followed).

### Honest Leave-Behinds (structurally special — NOT forced)

- `strativerse/vue/Landing.vue` lines ~695 + ~741 — the **two `DeploymentTarget` badge `<select>`s** (per-Quality / per-Principle, inside a `v-for` aspect-badge row). Left because: (1) each carries a per-row `:class="getDeploymentClass(...)"` reactive to its own current value — the trigger cannot express row-state-reactive class through `$attrs`; (2) the `@change` reads `$event.target.value` via `parseInt(...,10)` — a distinct DOM-event side-effect signature the sweep must not alter; (3) they are inline dense badge selects with `@click.stop`, three fixed options. Migration would change behavior, not just chrome. **NOTE**: `Landing.vue`'s `selectedProject` control selector WAS swept (line ~534). *(The old debt list's `SuiteColorPickerPanel.vue` had 0 native `<select>` — it uses swatch cells, not a select; no action needed.)*

**Gates**: template `npx tsc --noEmit` 0 · `build:client` 0 · mirror (IsomorphicExpanse) `build:client` 0 (10 files incl. ScsDropdown dependency cmp-identical).

---

## Iced Skill Stage E Bidirectional Diameter

| Half | Artifact |
|---|---|
| Ego (Informative) | THIS Skill.md · states the offscreen caveat + RULED-OUT set + solutions family + heuristic |
| Lambda (Doer) | The in-DOM components (`ScsInput.vue` · `ScsDropdown.vue` · …) that render offscreen-safely at runtime |

Bidirectional citation: this Skill names the components; the components' header doctrine names this Skill. No one-way derivation.

---

**Cycle**: SCP Actualization Epoch · the Dropdown Component + the Offscreen Caveat Doctrine
