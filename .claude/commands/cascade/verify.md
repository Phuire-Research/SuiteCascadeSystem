Verify the Suite Cascade System installation — full structural integrity check.

Run the following verification routine and present results:

1. **Root Structure** — list root contents (excluding DevCascades). Confirm only `.claude/`, `.github/`, `.gitignore`, `Cascades/`, `LICENSE`, `docs/` are present.

2. **System Files** — list all files in `.claude/` (CLAUDE.md, agents, commands). Count each category.

3. **Cascades Directory** — list top-level Cascades/ contents. Confirm: `8_SUITES/`, `Cascade.json`, `Documentation/`, `Lab/`, `SUITE8-REGISTRY.md`, `Working/`, `assets/`.

4. **Suite 8 Inventory** — list all Suite 8 directories. Cross-reference against SUITE8-REGISTRY.md entries. Flag any Suite 8 directory not in the registry or registry entry without a directory.

5. **Documentation Inventory** — list all files in `Cascades/Documentation/Cascades/`.

6. **Asset Count** — count files in `Cascades/assets/`.

7. **GitHub Pages** — list files in `docs/`.

8. **Counts Summary**:
   - Commands (files in `.claude/commands/cascade/`)
   - Agents (files in `.claude/agents/`)
   - Suite 8s (directories in `Cascades/8_SUITES/`)
   - Total files (excluding `.git/`, `DevCascades/`, `.DS_Store`)

9. **README Sync** — compare line counts of `.github/README.md` and `Cascades/Documentation/Cascades/README.md`. Flag if they differ.

10. **Cascade.json State** — display current contents. Verify schema has: `activeDiamond`, `activeOnyx`, `suiteColors`, `cyclePosition` (with `totalRotations`), `colorSelectionComplete`, `automata`.

11. **SM-Index Command Count** — count `/cascade:` entries in SM-Index.md. Should match command file count.

12. **Git Status** — show uncommitted changes if any.

Present results in a structured table. Flag any mismatches as warnings.
