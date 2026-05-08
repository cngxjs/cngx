/**
 * Internal default glyphs for `<cngx-stepper>` skin slots. Shared
 * fallback markers used when neither a per-instance slot directive
 * nor a `CNGX_STEPPER_CONFIG.templates.<key>` template overrides the
 * built-in span. Mirrors the family-standard internal glyph const
 * pattern (`CNGX_SELECT_GLYPHS`, `CNGX_TABS_GLYPHS`).
 *
 * Intentionally NOT exported from `public-api.ts` — consumers
 * customise via slot directives or config templates, not by reaching
 * into the const. Keeps the consumer override surface single-pathed.
 *
 * @internal
 */
export const CNGX_STEPPER_GLYPHS = {
  /** Default visual for `*cngxStepBadge` when no override is bound. */
  errorBadge: '!',
  /** Default visual for `*cngxStepRejection` when no override is bound. */
  rejectionIcon: '!',
} as const;
