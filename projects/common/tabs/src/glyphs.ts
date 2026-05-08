/**
 * Internal default glyphs for `<cngx-tab-group>` skin slots. Shared
 * fallback markers used when neither a per-instance slot directive
 * nor a `CNGX_TABS_CONFIG.templates.<key>` template overrides the
 * built-in span. Mirrors the family-standard internal glyph const
 * pattern (`CNGX_SELECT_GLYPHS`, `CNGX_STEPPER_GLYPHS`).
 *
 * Exported from `@cngx/common/tabs/public-api.ts` with an
 * `@internal` JSDoc tag so the cngx-tab-group organism (and the
 * mat-tabs twin, if it later needs the same glyphs) can read the
 * single source of truth without re-declaring the literals in
 * component templates. Consumers customise the visual surface via
 * slot directives (`*cngxTabErrorBadge`, `*cngxTabRejectionIcon`,
 * `*cngxTabBusySpinner`) or via the `withTab*Template` config-cascade
 * features — they SHOULD NOT reach into this const directly.
 * Public-API intent is enforced by the JSDoc tag, not by hiding the
 * export (which would force the organism into a deep-relative
 * import that Sheriff forbids across library boundaries — same
 * architectural force that drove the Phase-3 `CNGX_STEPPER_GLYPHS`
 * export shape).
 *
 * @internal
 */
export const CNGX_TABS_GLYPHS = {
  /** Default visual for `*cngxTabErrorBadge` when no override is bound. */
  errorBadge: '!',
  /** Default visual for `*cngxTabRejectionIcon` when no override is bound. */
  rejectionIcon: '!',
} as const;
