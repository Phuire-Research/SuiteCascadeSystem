/**
 * seedInductionVermillion.model.ts — D-MSE-4 · the Seed Induction Vermillion builders
 * (the buildUpdateVermillion law: Vermillion builders live in src/model/, never inline in
 * a component). PURE composition — no fetch, no controller, no path resolution beyond the
 * install-relative Seed seat (the C465/C872 cwd rule: the agent's cwd IS the install; NEVER
 * an absolute path in shipped code). THE MEMORY LAW (the blueprint's §5 R2): the directive
 * states the CONTRACT and lets the agent resolve its OWN memory location per its runtime's
 * memory law — no memory path is minted client-side.
 */

// The Seed's install-relative seat — rides the SCP update circuit (the Versioning Law).
export const SEED_DOC_RELATIVE_PATH = 'Cascades/Documentation/Seed/';
export const SEED_INDEX_RELATIVE_PATH = `${SEED_DOC_RELATIVE_PATH}SEED-0-INDEX.md`;

// A parsed Observed Pattern Registry row (the Dialectics face's client-parse shape —
// `### Pn: Label` heading + the body beneath, out of the Cinnabar Instance.md).
export type DialecticRow = {
  key: string;
  label: string;
  line: number;
  body: string;
};

/**
 * The Induction Directive — the ONE MOTION spawn's initialDirective. Composed from SEED-0's
 * INDUCTION CONTRACT as the spine: the five clauses carried whole, the install-relative Seed
 * path as ground, the agent-writes-its-own-memory law, the report-with-Concluders close, and
 * the remain-available close (the Dialectics rows route follow-ups to this same live session).
 */
export const buildSeedInductionVermillion = (): string =>
  `SCS:Vermillion Induct the Method Seed into this project's memory, then remain available for questions.

<VermillionPlan topic="Method Seed Induction">

Step 1 (Simple Prompt) — Ground on the Seed:
  Informative: The Seed is the acquired case law of the Suite Cascade System, shipped beside
    the constitution at ${SEED_INDEX_RELATIVE_PATH} (relative to this install's root — your
    working directory IS the install). SEED-0 maps the six theme documents beside it in
    ${SEED_DOC_RELATIVE_PATH} and carries THE INDUCTION CONTRACT you execute here.
  Actionable: Read SEED-0-INDEX.md in full, then the six theme docs it maps.

Step 2 (Simple Prompt) — Execute THE INDUCTION CONTRACT (the five clauses, whole):
  Informative: The contract converts the Seed into project memory:
    1. One memory file per law (or per tightly-bound law cluster). Each file carries
       frontmatter — name: (the law's title as a kebab-case slug), description: (the law's
       one-line essence), type: feedback — and a body holding the law's full three-part
       shape (The Law · The Failure Mode · How to Apply).
    2. One index line per file appended to the project's MEMORY.md:
       [Law Title](filename.md) — the one-line essence. The index line stays under ~200
       characters; the detail lives in the topic file.
    3. Read-back verification per write. Every memory file written is read back before the
       next is written; the induction ends with a count Concluder (files written vs laws
       inducted) — the induction obeys the very Lambda discipline it is seeding.
    4. Induct method you can APPLY, not prose you can quote. Each memory entry must be
       operable as a decision rule at the moment its trigger appears (a dispatch, a Write,
       a sleep, a guard, a menu). If a law cannot be phrased as something you will DO
       differently, the induction of that law is not complete.
    5. Selective depth is legitimate. Inducting the six theme docs as six cluster files
       first (name, description, and the doc's checklist as the body) and splitting
       individual laws out as they start firing is a complete v1 induction.
  Actionable: Write the memory files to YOUR OWN memory directory, resolved per your
    runtime's memory law — the contract above names the shape, not a path; you own your
    memory seat. THE RE-INDUCTION LAW: new laws become new files; changed laws overwrite
    their file (Read-back verified); memory minted by this project's own cycles is NEVER
    overwritten — the Seed seeds, the project's own record grows beside it.

Step 3 (Simple Prompt) — Close and remain:
  Informative: The close is a Muxistration, not a narrative — the count Concluder plus the
    index delta are the proof the induction happened.
  Actionable: Report the count Concluder (files written vs laws inducted) and the MEMORY.md
    index delta. Then REMAIN AVAILABLE in this session for questions about the Seed and the
    Cascade — follow-up conferrals route to this same live session.

</VermillionPlan>

After acting, respond with the contract line first:
SCS:Vermillion:OK:<files written> memory files · <laws inducted> laws inducted · index reconciled`;

/**
 * The per-pattern Dialectic directive — the Dialectics row's engageable fire (the
 * fireForgeMenuEntry row shape, re-aimed). Honest seeded-state (v1): the directive TELLS the
 * agent to check its own memory for the Seed index and report seeded-anor-not — no
 * client-side seeded-state probe is minted.
 */
export const buildDialecticDirective = (row: DialecticRow): string => {
  const bodyHead = row.body.length > 280 ? `${row.body.slice(0, 280)}…` : row.body;
  return [
    `Open the dialectic on ${row.key} · ${row.label}: ${bodyHead}`,
    'Confer with the user on how this pattern applies to THEIR prompting.',
    `Ground first: check your own memory for the Method Seed index (the induction contract of ${SEED_INDEX_RELATIVE_PATH}) and report plainly whether this project is seeded anor not — an unseeded project is a state, not a failure; offer the induction if it is absent.`,
    `The full Observed Pattern Registry lives in this Suite 8's own Instance.md (Cascades/8_SUITES/Cinnabar Dialectic/Instance.md) — read the ${row.key} section whole before conferring.`,
  ].join('\n');
};
