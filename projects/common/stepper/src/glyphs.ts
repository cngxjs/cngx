/**
 * Internal default glyphs for `<cngx-stepper>` skin slots. Shared
 * fallback markers used when neither a per-instance slot directive
 * nor a `CNGX_STEPPER_CONFIG.templates.<key>` template overrides the
 * built-in span. Mirrors the family-standard internal glyph const
 * pattern (`CNGX_SELECT_GLYPHS`, `CNGX_TABS_GLYPHS`).
 *
 * Exported from `@cngx/common/stepper/public-api.ts` with an
 * `@internal` JSDoc tag so the cngx-stepper organism (and the
 * mat-stepper twin, if it later needs the same glyphs) can read the
 * single source of truth without re-declaring the literals in
 * component templates. Consumers customise the visual surface via
 * slot directives (`*cngxStepBadge`, `*cngxStepRejection`) or via
 * the `withStep*Template` config-cascade features — they SHOULD NOT
 * reach into this const directly. Public-API intent is enforced by
 * the JSDoc tag, not by hiding the export (which would force the
 * organism into a deep-relative import that Sheriff forbids across
 * library boundaries).
 *
 * @internal
 */
export const CNGX_STEPPER_GLYPHS = {
  /** Default visual for `*cngxStepBadge` when no override is bound. */
  errorBadge: '!',
  /** Default visual for `*cngxStepRejection` when no override is bound. */
  rejectionIcon: '!',
} as const;
