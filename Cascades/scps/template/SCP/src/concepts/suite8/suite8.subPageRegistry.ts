/**
 * Suite8 Sub-Page Registry (Band A-6 HCD)
 *
 * Single source of truth for the Suite8 Landing SubPage triad Navbar
 * (Home · Component · Documentation). Consumed by Suite8SubPageNav.vue via
 * v-for; Suite8Landing.vue imports the constant to populate the Navbar's
 * `options` prop and drives a v-if/v-else-if chain off `activeSubPage`.
 *
 * Suite-colored (Amethyst = Suite 6 · the suite8 concept's nav home color):
 *   home          -> amethyst (the Suite 8 roster + docked-cascade context · primary default)
 *   component     -> viridian (Suite 4 · validation · CPLD live ODSS + PFGD showcase)
 *   documentation -> cobalt   (Suite 5 · the Suite8 registration/assignment reference)
 *
 * Home is FIRST so it renders as the default active tab when activeSubPage
 * defaults to 'home' (DEFAULT_SUITE8_SUB_PAGE).
 *
 * The `deferred: boolean` field is preserved for forward-compatibility (mirrors
 * suiteCascade.subPageRegistry.ts) — no deferred entries exist in this revision.
 *
 * Citation: suiteCascade.subPageRegistry.ts (SUITECASCADE_SUB_PAGE_OPTIONS DIRECT bearing).
 * Citation: suite8.type.ts Suite8SubPage union.
 * Citation: MASTER-DIAMOND-SUITE8-CONCEPT-ASPIRANT.md §3 (HCD SubPage triad).
 */
import type { Suite8SubPage } from './suite8.type';

// V-1 · THE LENT SHAPES — held in s8Shared.model (token-free); aliased for concept-local
// (and twin-renamed) imports.
import type { S8SuiteColor, S8SubPageOption } from '../../model/s8Shared.model';
export type SuiteColor = S8SuiteColor;
export type Suite8SubPageOption = S8SubPageOption;

export const SUITE8_SUB_PAGE_OPTIONS: Suite8SubPageOption[] = [
  { value: 'home',          label: 'Home',          deferred: false, suite: 'amethyst' },
  { value: 'component',     label: 'Component',     deferred: false, suite: 'viridian' },
  { value: 'documentation', label: 'Documentation', deferred: false, suite: 'cobalt'   },
];
