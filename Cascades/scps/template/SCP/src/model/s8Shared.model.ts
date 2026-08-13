/**
 * s8Shared.model.ts — V-1 · THE LENT COMPONENT TYPES (held · client-safe · token-free)
 *
 * THE NAME LAW: this module + its exports carry NO rename tokens — the lent components
 * (S8Card · S8SubPageNav) and every copy-surface consumer reach these shapes through
 * specifiers that survive every twin's token-rename. The copy-surface suite8.type.ts +
 * suite8.subPageRegistry.ts re-export ALIASED names (Suite8Entry = S8Entry …) so twin-renamed
 * type imports (FrontierDiametricEntry …) still resolve against their own concept files.
 */

export type S8Entry = {
  name: string;            // NDEP — directory-entry Name; uniquely resolves Instance.md
  directoryPath: string;   // Cascades/8_SUITES/<Name>/
  description: string;     // never optional (KeyedSelector)
  color: string;           // never optional (KeyedSelector)
};

export type S8SubPage = 'home' | 'component' | 'documentation';

export type S8SuiteColor =
  | 'base'
  | 'red'
  | 'orange'
  | 'yellow'
  | 'green'
  | 'blue'
  | 'purple'
  | 'fuchsia'
  | 'maroon'
  | 'viridian'
  | 'cobalt'
  | 'amethyst';

export interface S8SubPageOption {
  value: S8SubPage;
  label: string;
  deferred: boolean;
  suite?: S8SuiteColor;
}
