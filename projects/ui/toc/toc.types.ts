/**
 * One entry in a table-of-contents outline. Tree-shaped: an item may nest
 * `children`, rendered as a nested `<ul>` under its link. `id` targets the
 * section element the link scrolls to (matched via `getElementById`), `label`
 * is the visible link text. Explicit data input - the organism never scans
 * the document for headings in this release (see the deferred auto-discovery
 * phase).
 *
 * @category ui/toc
 * @since 0.1.0
 */
export interface CngxTocItem {
  /** Section element id this entry links to and scrolls into view. */
  readonly id: string;
  /** Visible link text. */
  readonly label: string;
  /** Nested sub-sections, rendered as an indented child list. */
  readonly children?: readonly CngxTocItem[];
}

/**
 * Template context handed to the `*cngxTocItem` slot and to a
 * `CNGX_TOC_CONFIG.templates.item` default. `$implicit` is the item so
 * `let-item` binds it positionally; `active` mirrors the item's
 * `aria-current` state; `depth` is the zero-based nesting level for
 * indentation-aware custom markup.
 *
 * @category ui/toc
 * @since 0.1.0
 */
export interface CngxTocItemContext {
  /** The item being rendered (`let-item`). */
  readonly $implicit: CngxTocItem;
  /** `true` when this item is the active section. */
  readonly active: boolean;
  /** Zero-based nesting depth. */
  readonly depth: number;
}
