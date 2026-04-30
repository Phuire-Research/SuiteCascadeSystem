# Suite 2 — Color Rename Discovery Map

**Prospector Output**: Verbose naming of every instance of the current Suite color scheme with its corresponding new color. This document serves as the authoritative mapping for the rename operation.

---

## Rename Mapping

| Suite | Current Color | New Color | Agent ID (current) | Agent ID (new) |
|-------|--------------|-----------|--------------------|-----------------| 
| 0 | Obsidian | Base | `r0-obsidian` | `r0-base` |
| 1 | Maroon | Red | `r1-maroon` | `r1-red` |
| 2 | Rust | Orange | `r2-rust` | `r2-orange` |
| 3 | Ochre | Yellow | `r3-ochre` | `r3-yellow` |
| 4 | Viridian | Green | `r4-viridian` | `r4-green` |
| 5 | Cobalt | Blue | `r5-cobalt` | `r5-blue` |
| 6 | Amethyst | Purple | `r6-amethyst` | `r6-purple` |
| 7 | Rose | Fuchsia | `r7-rose` | `r7-fuchsia` |

**Not renamed**: Teal Claude (Suite 8 designation, not a Suite 0–7 color).

---

## Files Requiring Rename

### CLAUDE.md (Primary — 3 compound replacement categories)

**Category 1 — Agent identifiers** (lowercase, backtick-wrapped):
- `` `r0-obsidian` `` → `` `r0-base` ``
- `` `r1-maroon` `` → `` `r1-red` ``
- `` `r2-rust` `` → `` `r2-orange` ``
- `` `r3-ochre` `` → `` `r3-yellow` ``
- `` `r4-viridian` `` → `` `r4-green` ``
- `` `r5-cobalt` `` → `` `r5-blue` ``
- `` `r6-amethyst` `` → `` `r6-purple` ``
- `` `r7-rose` `` → `` `r7-fuchsia` ``

**Category 2 — Suite table rows** (pipe-delimited):
- `| 0 | Obsidian |` → `| 0 | Base |`
- `| 1 | Maroon |` → `| 1 | Red |`
- `| 2 | Rust |` → `| 2 | Orange |`
- `| 3 | Ochre |` → `| 3 | Yellow |`
- `| 4 | Viridian |` → `| 4 | Green |`
- `| 5 | Cobalt |` → `| 5 | Blue |`
- `| 6 | Amethyst |` → `| 6 | Purple |`
- `| 7 | Rose |` → `| 7 | Fuchsia |`

**Category 3 — Compound terms** (Rose is heaviest with 30+ instances):
- Obsidian: `Obsidian Absorb`, `Obsidian Anchor`, `Obsidian Summation`, `Obsidian (0)`
- Maroon: `S1 Maroon`, `R1 Maroon`, cascade motion reference
- Rust: `S2 Rust`, `R2 Rust`, Triadic Thinking Band frame
- Ochre: `S3 Ochre`, `R3 Ochre`
- Viridian: `S4 Viridian`, `R4 Viridian`, Triadic Thinking Band frame
- Cobalt: `S5 Cobalt`, `R5 Cobalt`, Triadic Thinking Band output, Onyx Technical State source
- Amethyst: `S6 Amethyst`, `R6 Amethyst`, Vermillion consumer, Triadic Thinking Band frame
- Rose: `Rose Diagnosis`, `Rose Clinical Note`, `Rose-Writes-Onyx Circuit`, `Rose History`, `Rose S8AT`, `Rose ALWAYS fires`, `Rose count`, `S7 Rose`, `R7 Rose`, `Rose fired`, `Rose → Maroon feedback`

### Conductor.md (Teal Claude — 7 table rows + 7 role entries + 7 band headers)

- Table: `| N | {Color} ({Role}) | R{N}: ... | r{N}-{color} |`
- Roles: `R{N} {Color} {Role}` (e.g., `R1 Maroon Curator` → `R1 Red Curator`)
- Bands: `Band N [R{N} {Color} {Role}]:`

### SUITE8-REGISTRY.md (2 instances)

- `Rose S8AT` → `Fuchsia S8AT` (appears twice)

---

## Disambiguation Notes

- **"Base" collision**: "Base Lambda" (C5 Crystraline), "Base Concept" (§8), "Lambda Base Aspect" already exist in CLAUDE.md. Suite 0 "Base" operates in distinct context (Suite designation) — no semantic collision.
- **"Rose" scope**: Every "Rose" in these files is Suite 7. No non-Suite English "rose" usage found.
- **"Rust" scope**: Every "Rust" in these files is Suite 2. No Rust programming language references.
- **"Orange" scope**: No existing "Orange" in any file — clean target.
- **Case sensitivity**: Agent IDs are lowercase (`r7-rose`); Suite names are capitalized (`Rose`). Separate replacements required.
