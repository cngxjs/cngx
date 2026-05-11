/**
 * Default glyph fallbacks for `<cngx-tab-group>` skin slots. Read by
 * the organism when neither a per-instance slot directive nor
 * `CNGX_TABS_CONFIG.templates.<key>` is bound. Sibling to
 * `CNGX_SELECT_GLYPHS` and `CNGX_STEPPER_GLYPHS`. Exported because
 * Sheriff forbids deep-relative imports across library boundaries;
 * `@internal` enforces consumer intent. Consumers customise via slot
 * directives or `withTab*Template` config features.
 *
 * @internal
 */
export const CNGX_TABS_GLYPHS = {
  /** Default visual for `*cngxTabErrorBadge` when no override is bound. */
  errorBadge: '!',
  /** Default visual for `*cngxTabRejectionIcon` when no override is bound. */
  rejectionIcon: '!',
} as const;
