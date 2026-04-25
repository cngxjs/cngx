/**
 * Internal glyph constants for the select family.
 *
 * Pin-point reuse surface for the handful of single-character glyphs
 * that the default templates render across variants (clear ✕, caret ▾,
 * tree twisty ▸, reorder drag-handle ⋮⋮, commit-error badge !).
 *
 * **Shape choice — plain `as const` object, NOT TemplateRef/Directive.**
 * The call-sites that consume these glyphs are raw `<span aria-hidden>`
 * tags inside the shared panel / trigger templates. They need a literal
 * string, not a projected template, because:
 *
 *   1. **Tree-shakeable.** A plain const evaporates when callers don't
 *      reference it. Ref/directive alternatives would drag Angular
 *      imports into every variant that reads even one glyph.
 *   2. **`aria-hidden` stays visible at the call-site.** A11y hygiene
 *      for decorative glyphs belongs on the render tag itself — a
 *      TemplateRef would bury it one level deeper.
 *   3. **Exhaustive keys.** `as const` + `keyof typeof` gives the
 *      consumer a compile-time-checked union of allowed glyph keys.
 *
 * **Consumer override surface is unchanged.** Components still expose
 * the per-instance `[clearGlyph]` / `[caretGlyph]` / `[chipDragHandle]`
 * template inputs and the `*cngxSelectClearButton` / `*cngxSelectCaret`
 * slots. This module only absorbs the *default* strings so they stop
 * being inline-duplicated across five component templates.
 *
 * **NOT exported from `public-api.ts`.** The const is purely internal
 * plumbing — consumers who want to replace a glyph go through the
 * public override points above.
 *
 * @internal
 */
export const CNGX_SELECT_GLYPHS = {
  /** Default clear-button glyph. Used by single-select, multi-select, combobox, typeahead, tree-select. */
  clear: '✕',
  /** Default trigger caret. Used by every variant with a closed trigger. */
  caret: '▾',
  /** Default tree-select twisty (collapsed). Rotated via CSS when the node is expanded. */
  treeTwisty: '▸',
  /** Default reorderable-multi-select drag-handle grip. */
  dragHandle: '⋮⋮',
  /** Default inline commit-error badge rendered on a selected option row. */
  commitError: '!',
} as const;

/**
 * Union of all glyph keys. Use this when you accept a glyph name from
 * a caller so the compiler can reject typos at the call-site.
 *
 * @internal
 */
export type CngxSelectGlyphKey = keyof typeof CNGX_SELECT_GLYPHS;
