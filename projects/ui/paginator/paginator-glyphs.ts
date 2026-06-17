/**
 * Default text glyphs for the paginator segments. Internal and non-exported -
 * mirrors `CNGX_SELECT_GLYPHS`. The library ships no icon font; these unicode
 * marks are the out-of-the-box chevrons and the overflow ellipsis. Consumers
 * restyle visually via CSS rather than by swapping these characters.
 *
 * Centralised so the chevron / ellipsis literals live in one place instead of
 * being duplicated across the segment classes.
 */
export const CNGX_PAGINATOR_GLYPHS = {
  /** First-page nav (double left-pointing angle quotation mark). */
  first: '«',
  /** Previous-page nav (single left-pointing angle quotation mark). */
  previous: '‹',
  /** Next-page nav (single right-pointing angle quotation mark). */
  next: '›',
  /** Last-page nav (double right-pointing angle quotation mark). */
  last: '»',
  /** Ellipsis trigger that opens the hidden-pages overflow menu. */
  more: '…',
} as const;
