/**
 * Default glyphs for `<cngx-stepper>` skin slots. Used when neither a
 * per-instance slot directive nor `CNGX_STEPPER_CONFIG.templates.<key>`
 * overrides the built-in span. Sibling of `CNGX_SELECT_GLYPHS` /
 * `CNGX_TABS_GLYPHS`.
 *
 * Exported with `@internal` so the organism (and mat-twin) can share
 * the literals across the secondary-entry boundary that Sheriff
 * forbids deep-relative imports across. Consumers customise via
 * `*cngxStep*` slots or `withStep*Template` features.
 *
 * @internal
 */
export const CNGX_STEPPER_GLYPHS = {
  /** Default visual for `*cngxStepBadge` when no override is bound. */
  errorBadge: '!',
  /** Default visual for `*cngxStepRejection` when no override is bound. */
  rejectionIcon: '!',
} as const;
