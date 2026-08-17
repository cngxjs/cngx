/**
 * Default single-character glyphs for the context-menu item skin. Plain
 * `as const` (not `TemplateRef`, not a `Directive`) so the strings stay inline
 * at their `aria-hidden` call sites and tree-shake when unused. Consolidates
 * the trailing submenu caret and the checkbox / radio checked indicators into
 * one source, mirroring `CNGX_SELECT_GLYPHS`.
 *
 * Internal to this organism: not exported from `public-api.ts`, not a consumer
 * override surface (that tier stays deferred, menu-accepted-debt §2). Lives
 * here rather than in `@cngx/common/interactive` because the base menu
 * directives hardcode none of these glyphs, so the organism is the only
 * consumer today; hoisting to the brain lib waits for a second menu consumer.
 *
 * @internal
 */
export const CNGX_MENU_GLYPHS = {
  /** Trailing caret on an item that opens a submenu. */
  submenuCaret: '▸',
  /** Leading indicator on a checked `menuitemcheckbox`. */
  checkboxChecked: '✓',
  /** Leading indicator on a checked `menuitemradio`. */
  radioChecked: '●',
} as const;

/** Union of glyph keys. @internal */
export type CngxMenuGlyphKey = keyof typeof CNGX_MENU_GLYPHS;
