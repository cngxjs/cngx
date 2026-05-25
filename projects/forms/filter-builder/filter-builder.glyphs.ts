/**
 * @internal Default glyph set used by the filter-builder component (Phase 5).
 * Lives in a module-local const, never exported from `public-api.ts` — per
 * `feedback_internal_glyph_const`, consumers override via slot directives
 * or per-input glyph bindings, not by re-importing the default symbols.
 */
export const CNGX_FILTER_BUILDER_GLYPHS = {
  remove: '✕',
  addFilter: '+',
  addGroup: '+',
  expand: '▾',
  negate: '!',
} as const;

/** Valid keys of the default glyph map. */
export type CngxFilterBuilderGlyphKey = keyof typeof CNGX_FILTER_BUILDER_GLYPHS;
