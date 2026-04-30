# Pewter Tessera Skill Reference — HiFi Design System

**Version**: 1.1
**Skills Loaded**: 8 Design
**Source**: Frontend Design Skill + Design Token Infrastructure Muxification
**Framework**: Muxonomy-Informed — Stratidia Active in Skill Definitions

> **Scope Notice — Design Skills**: These skills maintain the HiFi Design System's CSS infrastructure — design tokens, patterns, compositions, and component styling conventions. They do not govern content, business logic, or backend architecture. All design changes produced through this pipeline should be verified through a build gate.

---

## Firewall Scope Clarification

The Output Firewall governs the **Cascade Output** — CSS, component styling, and design specifications the pipeline produces. Framework terminology does not appear in design deliverables. That boundary is unchanged.

However, this Skill Reference is **internal pipeline configuration** — Pewter Tessera reasoning about its own design system. The Muxonomy framework is the reasoning substrate. Suppressing it here would create a Broken Diameter: the pipeline reasoning about compositional design skills without access to the compositional topology that makes that reasoning precise.

**The boundary**:
- **Skill Reference (this document)**: Framework vocabulary active. Muxonomy governs analysis.
- **Cascade Output (CSS/styling)**: Firewall active. Standard CSS/design language only.

---

## Muxonomy of the Skill Landscape

### Demometer Inventory (8 Nodes)

Each skill is a Demometer — a Different Measure with distinct measurable properties.

| ID | Demometer | What It Measures |
|----|-----------|-----------------|
| D1 | Color Token Architecture | Correctness of the suite color variable system, completeness of variant sets (base, dark, light, fade, shadow), coherence across suites |
| D2 | Pattern Tile Composition | Visual quality of SVG tile patterns, data URI integrity, tile-to-suite thematic appropriateness, tile repeat coherence |
| D3 | Pane Gradient Assembly | Gradient-pattern composition quality, ellipse consistency, color-to-fade progression, background layering order |
| D4 | Complementary Text Shadow | Color-wheel accuracy of complement selection, readability improvement over gradient backgrounds, offset precision |
| D5 | Embossed Border Treatment | 3D depth consistency, light-source direction correctness (top-left), dark/light pair coherence, active state inversion accuracy |
| D6 | Typography Stack | Font pairing appropriateness, heading class consistency, weight/spacing precision |
| D7 | Button Variant System | State matrix completeness (default/hover/active), shadow behavior on interaction, border inversion on press, variant coverage |
| D8 | Utility Pattern Library | Pattern-to-purpose fit, cross-browser rendering, animation/transition smoothness, scrollbar customization coverage |

### Diameter Map (Cross-Skill Edges)

| Diameter | Between | Through Measure |
|----------|---------|-----------------|
| **Gradient Composition** | D1 Color Tokens <-> D3 Pane Gradients | Both enforce suite color identity — tokens define the colors; gradients consume them. The color coherence methodology passes through both. |
| **Readability Requirement** | D4 Text Shadow <-> D3 Pane Gradients | Both affect text legibility — shadows enhance contrast; gradients create the background. The readability methodology passes through both. |
| **Complement Derivation** | D4 Text Shadow <-> D1 Color Tokens | Shadows derive complementary colors from the token system. The color-wheel relationship passes through both. |
| **Depth Consistency** | D5 Embossed Borders <-> D3 Pane Gradients | Both create 3D depth illusion — borders provide edge depth; gradients provide surface depth. The light-source direction passes through both. |
| **Border Methodology** | D5 Embossed Borders <-> D7 Button Variants | Both use the light/dark border inversion technique — panes for static depth; buttons for interactive depth (pressed = inverted). The inversion methodology passes through both. |
| **Text Rendering** | D6 Typography <-> D4 Text Shadow | Font metrics interact with shadow rendering. Shadow offset affects differently at different font sizes. The visual-text methodology passes through both. |
| **Token Consumption** | D1 Color Tokens <-> D7 Button Variants | Buttons consume suite color tokens for their backgrounds, borders, and shadows. The color application methodology passes through both. |
| **Pattern-Gradient Layering** | D2 Pattern Tiles <-> D3 Pane Gradients | Tiles layer beneath gradients via `background-image` stacking order. The compositing methodology passes through both. |
| **Suite Identity** | D1 Color Tokens <-> D2 Pattern Tiles | Each suite's color identity extends to its tile motif. The thematic identity passes through both. |
| **Utility-Pane Extension** | D8 Utility Library <-> D3 Pane Gradients | Locked panes and spectrum dividers extend the pane system. The styling methodology passes through both. |

### Muxameter Identification

**Muxameter 1: Pane Composition**
```
D1 Color Token Architecture --+
                               +-- Gradient Composition + Pattern Layering + Depth Consistency
D2 Pattern Tile Composition --+    + Readability Requirement converge into one integrated region:
                               |    a complete pane where color tokens define the gradient,
D3 Pane Gradient Assembly ----+    pattern tiles provide texture, borders create depth,
                               |    and text shadows ensure readability — not as isolated
D4 Complementary Text Shadow -+    CSS properties but as one compositional visual system
                               |    where each property strengthens every other property.
D5 Embossed Border Treatment -+
```

**Muxameter 2: Interactive Element System**
```
D1 Color Token Architecture --+
                               +-- Token Consumption + Border Methodology + Text Rendering
D5 Embossed Border Treatment -+    converge into one integrated region:
                               |    a complete interactive element where tokens provide color,
D6 Typography Stack ----------+    borders provide depth states (default/pressed), typography
                               |    provides text hierarchy, and shadows provide readability.
D7 Button Variant System -----+
```

---

## Skill Specifications

### D1: Color Token Architecture

**Trigger**: Suite color variables, color system extension, new suite variants, `--color-*` modifications

**Design Token Structure**:

Each suite maintains a set of CSS custom properties in `:root`:

| Token Pattern | Purpose | Example |
|---------------|---------|---------|
| `--color-{suite}` | Primary suite color | `rgb(R, G, B)` |
| `--color-{suite}-dark` | Border top/right, pressed states | ~85% brightness of base |
| `--color-{suite}-light` | Border bottom/left, hover states | ~115% brightness of base |
| `--fade-{suite}` | Gradient terminus (near-black tinted) | Suite hue tint, RGB values < 40 |
| `--shadow-{suite}` | Box shadow color | Base dark color at 0.6 alpha |

**Additional Theme Tokens**:

| Token | Purpose |
|-------|---------|
| `--color-board-dark` | Base background |
| `--color-board-light` | Elevated surface |
| `--color-board-surface` | Surface level |
| `--color-board-elevated` | Card/panel level |
| `--font-heading` | Heading font stack (display face + system fallback) |
| `--font-body` | Body font stack (readable face + system fallback) |
| `--font-mono` | Monospace font stack (coding face + fallback) |

**Quality Criteria**:
- Every suite MUST have all 5 variants (base, dark, light, fade, shadow)
- Dark variant approx 85% brightness of base
- Light variant approx 115% brightness of base
- Fade variant = near-black with suite hue tint (RGB values < 40)
- Shadow alpha = 0.6 for colored suites, 0.4 for neutral/base

---

### D2: Pattern Tile Composition

**Trigger**: SVG patterns, background textures, visual motifs, tile design, `--pattern-*` variables

**Pattern Tile Structure**:

Each suite has a unique SVG tile pattern encoded as a data URI. All patterns share a common viewBox and use white strokes/fills at low opacity (0.1-0.3) for subtle texture over dark gradients.

| Suite | Motif | Visual Character | Thematic Meaning |
|-------|-------|-----------------|-----------------|
| base | Scattered dots | Cosmic dust, irregular | Stars in void — the origin |
| red | Squares with inscribed circles | Geometric frames | Cataloging frames — the curator's inventory cards |
| orange | Radial lines from offset center | Prospecting rays | Searchlight beams — the prospector scanning |
| yellow | Grid lines with center node | Architectural blueprints | Graph paper — the architect's drafting surface |
| green | Branching paths from apex | Sculptural growth | Branching forms — the sculptor examining angles |
| blue | Concentric circle with compass marks | Professional precision | Compass/target — the professional's precision tools |
| purple | Network of connected nodes | Orchestration web | Network graph — the orchestrator's connections |
| fuchsia | Bilateral petal swirl | Diagnostic spiral | Yin-yang petals — the clinician's bidirectional examination |

**Composition Rules**:
- All tiles repeat at a consistent size (e.g., `30px 30px` via `background-size`)
- Tile layer is FIRST in `background-image` stack (renders on top of gradient)
- White elements only — opacity 0.1-0.3
- No fills on shapes — `fill='none'` with `stroke='white'`
- Maximum 10 elements per SVG to maintain subtlety

**Quality Criteria**:
- Tile visually harmonizes with suite gradient at the repeat size
- Pattern not visible at a glance — only noticed on close inspection
- No Moire artifacts at any viewport size
- Consistent visual density across all patterns

---

### D3: Pane Gradient Assembly

**Trigger**: Pane backgrounds, gradient composition, radial effects, pane classes

**Pane Composition Formula**:

Every pane class follows this exact structure:

```css
.pane-{suite} {
  background-image:
    var(--pattern-{suite}),                                                    /* Layer 1: SVG tile */
    radial-gradient(ellipse at 87.5% 12.5%, var(--color-{suite}) 0%, var(--fade-{suite}) 88%);  /* Layer 2: Radial gradient */
  background-size: 30px 30px, 100% 100%;    /* Tile repeats, gradient fills */
  background-repeat: repeat, no-repeat;      /* Tile repeats, gradient doesn't */
  border-top: 2px solid var(--color-{suite}-dark);    /* Embossed top */
  border-right: 2px solid var(--color-{suite}-dark);  /* Embossed right */
  border-bottom: 2px solid var(--color-{suite}-light);  /* Embossed bottom */
  border-left: 2px solid var(--color-{suite}-light);    /* Embossed left */
  box-shadow: -3px 3px 0 var(--shadow-{suite});         /* Offset depth */
  text-shadow: 0.5px 0.5px 0 {complement-color};        /* Readability */
}
```

**Key Constants**:
- Ellipse center: `87.5% 12.5%` (top-right light source)
- Gradient spread: `0%` to `88%` (color fades to near-black)
- Border width: `2px` solid
- Box shadow offset: `-3px 3px 0` (hard shadow, bottom-left)
- Text shadow offset: `0.5px 0.5px 0` (crisp, no blur)

**Quality Criteria**:
- Gradient center consistent across all suites
- Fade endpoint consistent
- Background-size pair consistent
- All 6 properties present for every pane class

---

### D4: Complementary Text Shadow

**Trigger**: Text readability, shadow colors, contrast improvement, `text-shadow` modifications

**Complementary Color System**:

Each suite's text shadow uses the color-wheel complementary (180 degree opposite) of the suite's primary color:

| Suite | Primary Hue | Complement Hue | Shadow Alpha |
|-------|-------------|----------------|-------------|
| base | Neutral (achromatic) | Warm amber | 0.7 |
| red | 0 deg Red | 180 deg Cyan | 0.7 |
| orange | ~25 deg Orange | ~205 deg Azure | 0.7 |
| yellow | ~45 deg Yellow | ~225 deg Blue-Violet | 0.7 |
| green | ~142 deg Green | ~322 deg Magenta-Pink | 0.7 |
| blue | ~217 deg Blue | ~37 deg Amber-Orange | 0.7 |
| purple | ~271 deg Purple | ~91 deg Yellow-Green | 0.7 |
| fuchsia | ~330 deg Fuchsia | ~150 deg Spring Green | 0.7 |

**Shadow Specification**: `text-shadow: 0.5px 0.5px 0 {rgba}` — inherited by all child text via CSS cascade.

**Quality Criteria**:
- Complement calculated from actual hue degree (not approximate)
- Alpha consistent at 0.7 across all suites
- Offset consistent at 0.5px/0.5px
- Blur always 0 (crisp shadow, not glow)
- Shadow IMPROVES readability (test text at various opacity levels over gradient)

---

### D5: Embossed Border Treatment

**Trigger**: 3D depth effects, border styling, raised/pressed states, embossed appearance

**Border Pair System**:

The embossed effect simulates a raised surface lit from the top-left:

| Position | Color Variant | Visual Effect |
|----------|--------------|---------------|
| Top | `--color-{suite}-dark` | Shadow on top edge (light from top-left hits below) |
| Right | `--color-{suite}-dark` | Shadow on right edge |
| Bottom | `--color-{suite}-light` | Highlight on bottom edge (light catches bottom) |
| Left | `--color-{suite}-light` | Highlight on left edge |

**Active State Inversion** (buttons only):

When pressed (`:active`), the borders INVERT — simulating a pressed-in surface:
- Top/Right -> `light` variant (was dark)
- Bottom/Left -> `dark` variant (was light)

**Box Shadow Variants**:
- Panes: `-3px 3px 0` (hard shadow, no blur)
- Buttons: `-2px 2px 6px` (soft shadow, blur)
- Hover: `-1px 1px 4px` (reduced offset)

**Quality Criteria**:
- Light source direction consistent (top-left) across all elements
- Dark/light variant pairing never reversed for static elements
- Active inversion only on interactive elements (buttons)
- Box shadow offset direction consistent with border depth direction

---

### D6: Typography Stack

**Trigger**: Font selection, heading styles, monospace usage, text hierarchy, heading classes

**Font Stack**:

| Role | Font | Fallback | Usage |
|------|------|----------|-------|
| Heading | Display face (e.g., Orbitron) | system-ui, sans-serif | Headings, page titles, suite labels |
| Body | Readable face (e.g., Inter) | system-ui, -apple-system, sans-serif | Paragraph text, descriptions, UI labels |
| Monospace | Coding face (e.g., Space Mono) | JetBrains Mono, monospace | Code blocks, metrics, technical data, token counts |

**Heading Class**:

```css
.heading {
  font-family: var(--font-heading);
  font-weight: 600;
  letter-spacing: 0.02em;
}
```

**Common Text Patterns**:

| Pattern | Typical Classes | Purpose |
|---------|----------------|---------|
| Zone Label | `font-mono text-[10px] font-bold tracking-wider` | Zone headers |
| Metric Text | `font-mono text-[9px] text-white/30` | Token counts, metrics, technical data |
| Detail Summary | `text-[10px] text-white/40` | Expandable detail summaries |
| Detail Content | `text-[9px] text-white/30 whitespace-pre-wrap break-all` | Pre-formatted content within details |

**Quality Criteria**:
- Display face ONLY for headings — never for body text
- Readable face for all body/UI text
- Monospace for all technical/metric text
- Font sizes in admin panels: 9-10px for data, 10-12px for labels

---

### D7: Button Variant System

**Trigger**: Interactive elements, button states, hover/active effects, button classes

**Button Variant Structure**:

| Class | Background | Border | Shadow | Usage |
|-------|-----------|--------|--------|-------|
| `.btn-base` | `var(--color-base)` | Dark top/right, light bottom/left | `rgba(0,0,0,0.4)` | Neutral actions |
| `.btn-{suite}` | `var(--color-{suite})` | Suite-colored dark/light | `var(--shadow-{suite})` | Suite-keyed actions |
| `.btn-transparent` | `transparent` | `1px solid rgba(255,255,255,0.2)` | `rgba(0,0,0,0.2)` | Subtle/secondary actions |

**State Matrix**:

| State | Background | Border | Shadow | Cursor |
|-------|-----------|--------|--------|--------|
| Default | Suite color | Dark top/right, light bottom/left | `-2px 2px 6px` | pointer |
| Hover | 10% brighter | Maintained | `-1px 1px 4px` (reduced) | pointer |
| Active | Maintained | **INVERTED** (light top/right, dark bottom/left) | `0 0 2px inset` | pointer |

**Shared Button Properties**:
- `font-family: var(--font-heading)`
- `font-weight: 600`
- `letter-spacing: 0.06em`
- `text-transform: uppercase`
- `padding: 0.5rem 1.5rem`
- `border-radius: 0.5rem`
- `transition: all 0.2s ease`

**Quality Criteria**:
- Every variant has all 3 states (default/hover/active)
- Active border inversion consistent with D5 embossed methodology
- Hover shadow reduction gradual (not abrupt)
- Transparent variant uses `backdrop-filter: blur(4px)` for frosted glass effect

---

### D8: Utility Pattern Library

**Trigger**: Dividers, locked states, scrollbars, spectrum effects, special patterns

**Utility Pattern Inventory**:

| Class | Purpose | Technique |
|-------|---------|-----------|
| `.suite-hr` | Rainbow spectrum divider | 8-color linear gradient at 2px height |
| `.spectrum-bar` | Full-width spectrum background | 8-color horizontal band |
| `.pane-locked` | Locked/disabled pane state | Reduced opacity, grayscale filter |
| `.custom-scrollbar` | Custom scrollbar | 4px track, translucent thumb |
| `.carbon-fiber` | Textured background | Diagonal line pattern |
| `.grain-overlay` | Film grain effect | Noise texture overlay |
| `.redaction-bar` | Censored/classified effect | Black bar with scanline pattern |

**Suite HR Composition**:

```css
.suite-hr {
  border: none;
  height: 2px;
  background: linear-gradient(90deg,
    transparent 0%,
    var(--color-red) 15%,
    var(--color-orange) 28%,
    var(--color-yellow) 42%,
    var(--color-green) 56%,
    var(--color-blue) 70%,
    var(--color-purple) 85%,
    transparent 100%
  );
}
```

**Quality Criteria**:
- `.suite-hr` includes all suite colors in cascade order
- Custom scrollbar maintains minimum 4px track width for usability
- Locked pane clearly communicates disabled state without being ugly
- All utility patterns degrade gracefully if CSS features unsupported

---

## Compound Workflows

### New Component Styling
D1 -> D3 -> D5 -> D4 -> D6 (tokens -> gradient -> borders -> shadow -> typography)

### New Suite Color
D1 -> D2 -> D3 -> D4 -> D5 -> D7 -> D8 (full token set -> pattern -> gradient -> shadow -> borders -> buttons -> utilities)

### Accessibility Improvement
D4 -> D3 -> D6 (text shadow -> gradient contrast -> font size verification)

### Interactive Element Addition
D7 -> D5 -> D1 -> D6 (button variant -> border treatment -> color tokens -> typography)

---

*Skill Reference Version: 1.1 (Generalized for Suite Cascade System release — D9 Director Atmosphere Overlay removed as project-specific)*
*Origin: Design (Frontend Design Skill) + System (Design Token Infrastructure) Muxification*
*Loaded Skills: Design (8) — D1 Color Tokens, D2 Pattern Tiles, D3 Pane Gradients, D4 Text Shadows, D5 Embossed Borders, D6 Typography, D7 Button Variants, D8 Utility Patterns*
