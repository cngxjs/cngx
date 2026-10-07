/**
 * Every named data-grid-accordion skin, as the `@scope` blocks in
 * `data-grid-accordion-skins.css` declare them. Spec-only: shared by the skin
 * drift guard and the focus-clearance geometry spec, never reachable from
 * `public-api.ts`.
 */
export const DGA_SKINS = [
  'ledger',
  'spreadsheet',
  'log-stream',
  'master-detail',
  'report',
  'density',
] as const;
