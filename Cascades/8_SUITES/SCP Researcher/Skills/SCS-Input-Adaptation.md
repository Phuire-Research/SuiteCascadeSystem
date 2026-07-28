# SCP-S17 · SCS Input Adaptation — Using ScsInput/ScsTextarea and Adapting Your Own Text-Entry Element on the OSR Paradigm

**Aspect**: A contributor-actionable guide to USING the SCS-Bridge text-entry components (`ScsInput` / `ScsTextarea`) AND adapting your own text-entry element so it renders correctly under the SCS-Bridge's offscreen-render (OSR) paradigm — the Three Self-Containment Layers + the OSR Post-Processing Caveat
**Version**: 1.0
**Origin**: SCP-Researcher Refinement · the SCS-Input self-containment + OSR-caret arc (Onyx Tier-20 Cycles 222-224 · the Mirror-Tail block cursor · `setFocusEmulationEnabled`)
**Skill ID**: SCP-S17
**Skill Name**: SCS-Input-Adaptation

---

## Why this Skill exists

The SCS-Bridge does not render the SCP page the ordinary way. It renders the page **offscreen** through a shader/presenter (post-processing). A plain `<input>` that works perfectly in an ordinary browser renders WRONG under this paradigm — no visible cursor, no focus border, a focus event that never fires. The SCS-Bridge ships two drop-in text-entry components that already solve this — `ScsInput` and `ScsTextarea`. This Skill is two things: (1) how to USE those components, and (2) the **adapt-your-own** discipline — the exact set of properties any custom text-entry element must satisfy to replicate without adaptation, so that an adopter building their own input on this paradigm gets it right the first time.

This Skill is the hands-on home for the CRITICAL NOTION carried in `Instance.md` (§"SCS Text-Entry Input Components"). The Instance states the doctrine; this Skill is the procedure.

---

## §1 · How to USE the SCS Input Components

The components live at `Cascades/scps/template/SCP/src/concepts/vue/components/ScsInput.vue` and `ScsTextarea.vue`. They are SCS-canonized drop-in replacements for any **text-entry** input — `type` of `text | search | url | email | password | number | tel`. (Non-text-entry inputs — `checkbox`, `radio`, `button`, `range`, `file`, `color`, etc. — stay raw; they have no text caret, so the OSR caret problem does not apply.)

### Import + minimal use

```vue
<script setup lang="ts">
import { ref } from 'vue';
import ScsInput from '<relative-path>/concepts/vue/components/ScsInput.vue';
import ScsTextarea from '<relative-path>/concepts/vue/components/ScsTextarea.vue';

const name = ref('');
const body = ref('');
</script>

<template>
  <ScsInput v-model="name" type="text" placeholder="Designation" />
  <ScsTextarea v-model="body" rows="6" placeholder="Notes" />
</template>
```

### The contract (what the components accept)

| Surface | ScsInput | ScsTextarea | Notes |
|---|---|---|---|
| **`v-model`** | yes (`defineModel<string>`) | yes (`defineModel<string>`) | the binding; two-way |
| **`:model-value` + `@update:model-value`** | yes | yes | the explicit pair; equivalent to `v-model` |
| **`type`** | yes — `text \| search \| url \| email \| password \| number \| tel` (default `text`) | — (textarea has no `type`) | `password` masks the cursor mirror with bullets |
| **`$attrs` fall-through** | yes | yes | `class`, `placeholder`, `disabled`, `id`, `name`, `maxlength`, `@keyup.enter`, etc. all land on the INNER element |
| **`suffix` slot** | yes | — | render an icon/button beside the field, inside the wrap |
| **`defineExpose`** | `focus()`, `select()`, `blur()`, `inputEl` | `focus()`, `select()`, `blur()`, `textareaEl` | call via a template `ref` |

**The `$attrs`-to-inner invariant**: both components set `inheritAttrs: false` and `v-bind="$attrs"` on the inner element (not the wrapper). So anything you pass that is not a declared prop — `class`, `placeholder`, `disabled`, `maxlength`, `@keyup.enter`, `id`, `name` — lands on the real `<input>` / `<textarea>`. A `class` you pass is MERGED with the component's own `scs-input-field` class (Vue `mergeProps` concatenates), so your accent class composes on top of the built-in identity rather than replacing it.

### What to copy / what NOT to touch

- **Copy**: the minimal-use template above. Pass your own `class` for a suite accent; it composes.
- **What NOT to touch**: do not re-add a native caret (`caret-color` is deliberately `transparent` — the component draws its own in-flow block cursor). Do not wrap the component in a screen-fixed overlay that draws a cursor — the component's cursor already rides the offscreen texture (see §3). Do not use these for non-text-entry inputs.

---

## §2 · The Three Self-Containment Layers (the adapt-your-own checklist)

These three layers are WHY `ScsInput`/`ScsTextarea` render correctly **in any location** — any island, any render path, with no caller setup. If you adapt your own text-entry element, satisfy all three and it replicates without adaptation. This is the checklist.

### Layer 1 — SELF-CLASS (the component applies its own identity class)

The component puts its own identity class on the inner element itself: `class="scs-input-field"` is written ON the `<input>` in the template, BEFORE `v-bind="$attrs"`. The caller does not have to pass it for styling to land. Because the self-class is written before `v-bind="$attrs"`, Vue `mergeProps` concatenates it with any `class` the caller passes — the caller's accent composes on top; it does not replace the identity.

> Adapt-your-own: your component must apply its own identity class internally. Never depend on the caller passing the class that styles you.

### Layer 2 — SELF-CSS (ship the rules in the component's UNSCOPED `<style>`)

The styling rules ship inside the component's own **unscoped** `<style>` block, so Vite folds them into the component's per-island CSS chunk — the rules TRAVEL WITH the component into every island / render path. Two traps this avoids:

- **NOT global-only**: if the rules lived only in the global `style.css` / entry `main-*.css`, any render path that does not load the entry CSS (an island rendered in isolation, a detached render path) renders a bare element with none of the rules. Global CSS does not reach every island.
- **NOT `<style src="…">`**: a `<style src>` import is hoisted by Vite to the entry bundle — defeating per-component travel. Use an inline unscoped `<style>` block in the SFC so the rules attribute to THIS component's chunk. (The SCS components keep a parallel standalone `scsInputField.css` as the single source-of-truth that the global `style.css` re-imports for raw-class usages in the showcase — but the component's own copy is an inline unscoped block, not a `<style src>`.)
- **UNSCOPED is required**: the inner element is reached via `v-bind="$attrs"` and carries NO `scopeId`, so a `scoped` block would `[data-v]`-qualify its selectors and never match the inner element. Unscoped selectors match.

> Adapt-your-own: ship your rules in the component's own unscoped `<style>` block (not global-only, not `<style src>`) so they render wherever the component mounts.

### Layer 3 — SELF-VAR-FALLBACK (every `var(--x)` on a child/sibling carries a fallback)

CSS custom properties inherit from ANCESTORS, never from SIBLINGS. If a child or sibling element is styled with `var(--x)` and is NOT guaranteed an ancestor that declares `--x`, that `var()` MUST carry a fallback. In the SCS components the cursor block is styled `background: var(--input-accent, var(--color-cobalt))` — the block is a **sibling** of `.scs-input-field`, so it does not inherit the input's own `--input-accent`. At a migrated site with no ancestor declaring `--input-accent`, the bare `var(--input-accent)` would resolve to nothing → an invisible cursor. The cobalt fallback makes it paint everywhere; an ancestor-set accent still wins where present.

> Adapt-your-own: any `var(--x)` on a child/sibling not guaranteed an ancestor declaration MUST carry a fallback: `var(--input-accent, var(--color-cobalt))`.

**The checklist (three Concluders to self-audit your own element):**

```
[ ] SELF-CLASS    — does the component apply its own identity class internally
                    (before v-bind="$attrs"), so the caller need not pass it?
[ ] SELF-CSS      — do the rules ship in the component's own UNSCOPED <style>
                    (not global-only, not <style src>), so they travel per-island?
[ ] SELF-VAR-FB   — does every var(--x) on a child/sibling not guaranteed an
                    ancestor declaration carry a fallback value?
```

---

## §3 · The OSR Post-Processing Caveat (the critical notion)

The SCS-Bridge renders the SCP page **offscreen** and composites it through a shader/presenter (post-processing — the Muxon signature warp). A custom text-entry element must account for three offscreen-render facts. This is the caveat any paradigm-adopter must know BEFORE writing a custom input.

### (a) The native text caret is NOT painted offscreen

Electron's offscreen render does not paint the native blinking text caret into the offscreen pixel buffer (electron #8498 — a long-standing upstream gap with no built-in fix). So you cannot rely on the OS caret being visible. You need a **custom in-flow cursor**, not the native caret. The SCS components draw the **Mirror-Tail block cursor** (a `.scs-cursor-block` end-pinned by inline layout) and deliberately keep `caret-color: transparent` so the native caret never double-renders. (The earlier literal `|`-in-value marker was a scaffold; it has been retired in favor of the in-flow block.)

### (b) The offscreen document is not OS-"active" — `:focus` and the focus event are suppressed until restored

An offscreen window holds no OS focus. `webContents.focus()` routes keystrokes (so typing works), but it does NOT make the offscreen document "active" — so Chromium suppresses `:focus`/`:focus-visible` rendering, the native caret, AND the JS `focus`/`focusin` event. The signature tell: **typing works and `:hover` works, but `:focus`, the caret, and the focus event all fail** (page-active-independent survives; page-active-dependent dies). The SCS-Bridge restores all three with one CDP command — `Emulation.setFocusEmulationEnabled({ enabled: true })` — issued per offscreen window on `did-finish-load` (`src/main/electronWindow.ts` ~:186). This is a bridge-side restore the adopter inherits for free; the implication for a custom element is: do not assume your `onFocus` JS or your `:focus` CSS will fire unless focus emulation is in place.

### (c) Any cursor/overlay must render IN the offscreen document FLOW — not as a screen-fixed overlay

The shader warps the WHOLE offscreen frame uniformly (`uv = warp(uv)` runs BEFORE the texture sample; there is no post-shader compositing path). So an element rendered IN the offscreen document flow (the Mirror-Tail block on the text) is baked into the offscreen buffer and the shader distorts it UNIFORMLY with the text — alignment survives the warp. A screen-fixed overlay drawn AFTER the shader sits flat over curved text → it mismatches the warp ("screen distortion"). This is exactly why the prior screen-fixed caret failed and the in-flow block succeeds.

> Adapt-your-own: draw your cursor/overlay IN the document flow (an in-flow element on the text), NOT a screen-fixed overlay. The in-flow element rides the offscreen texture; a fixed overlay drawn after the shader mismatches the warp.

---

## §4 · The Adopter Walk-Through

> "I want my own text-entry element to render correctly under the SCS-Bridge."

- **What to read**: §1 (the contract), §2 (the three layers checklist), §3 (the OSR caveat).
- **What to copy**: start from `ScsInput.vue` / `ScsTextarea.vue` as the working reference — the `inheritAttrs:false` + `v-bind="$attrs"` inner-element pattern, the inline unscoped `<style>`, the `var(--input-accent, var(--color-cobalt))` sibling fallback, the in-flow Mirror-Tail cursor (the `.scs-cursor-mirror` + `.scs-cursor-block` co-flow, `caret-color: transparent`).
- **What NOT to touch**: do not re-add a native caret; do not draw a screen-fixed cursor overlay; do not put your styling rules only in the global CSS or in a `<style src>` import; do not leave a child/sibling `var(--x)` without a fallback. Each of these breaks under OSR while passing fine in an ordinary browser.

The fastest correct path is to copy `ScsInput`/`ScsTextarea` and re-skin via the `--input-accent` custom property + your own `class` (which composes via `$attrs`). Authoring a new element from scratch means satisfying all three Self-Containment Layers AND the three OSR caveat facts — the components already encode all six.

---

## §5 · Cross-References

| Reference | What it covers | When to consult |
|---|---|---|
| **Instance.md** §"SCS Text-Entry Input Components" | the CRITICAL NOTION in doctrine voice | the Why — read first |
| `Cascades/scps/template/SCP/src/concepts/vue/components/ScsInput.vue` | the working text-input reference | §1 use · §2/§3 adapt |
| `…/components/ScsTextarea.vue` | the working textarea reference | §1 use · §2/§3 adapt |
| `…/components/scsInputField.css` | the standalone source-of-truth CSS | Layer 2 (self-CSS) |
| `src/main/electronWindow.ts` (~:186) | the `setFocusEmulationEnabled` bridge seam | §3(b) the focus restore |
| **SCP-S16** `Skills/ContributorOnboarding.md` | the no-RI onboarding front door | before this Skill if new |

The Diameter is circular-structural: Instance.md routes to this Skill for the How; this Skill routes back to Instance.md for the Why; neither is parent.
</content>
</invoke>
