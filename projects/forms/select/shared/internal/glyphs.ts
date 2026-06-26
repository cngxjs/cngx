/**
 * Default single-character glyphs for the shared select templates. Plain
 * `as const` (not TemplateRef) so strings stay inline at `<span
 * aria-hidden>` call sites and tree-shake when unused. Consumers override
 * via the per-instance `[clearGlyph]` / `[caretGlyph]` / `[chipDragHandle]`
 * inputs and the `*cngxSelect*` slots.
 *
 * @internal
 */
export const CNGX_SELECT_GLYPHS = {
  /** Clear-button glyph. */
  clear: '✕',
  /** Trigger caret. */
  caret: '▾',
  /** Tree twisty (collapsed); rotated via CSS when expanded. */
  treeTwisty: '▸',
  /** Reorder drag-handle grip. */
  dragHandle: '⋮⋮',
  /** Inline commit-error badge on a selected option row. */
  commitError: '!',
} as const;

/** Union of glyph keys. @internal */
export type CngxSelectGlyphKey = keyof typeof CNGX_SELECT_GLYPHS;
