/**
 * One crumb in a {@link CngxBreadcrumbBar} trail. `href` renders a plain-link
 * crumb. The terminal crumb needs no target - it is derived from position and
 * rendered as the current page.
 *
 * @category ui/breadcrumb
 * @github https://github.com/cngxjs/cngx/blob/main/projects/ui/breadcrumb/breadcrumb.types.ts
 * @since 0.1.0
 * @relatedTo CngxBreadcrumbBar
 */
export interface CngxBreadcrumbCrumb {
  /** Visible, and accessible, crumb text. */
  readonly label: string;
  /**
   * Target for a plain-link crumb. Omit on the terminal crumb. Keep it unique
   * across the trail: the bar tracks crumbs by `href ?? label`, so two crumbs
   * that share an `href` collide on the track key and throw NG0955. The router
   * source dedups a repeated URL automatically; a hand-built `[items]` array
   * must not repeat one.
   */
  readonly href?: string;
  /**
   * Opaque per-crumb icon token. cngx never interprets this string - it is
   * handed verbatim to the projected `*cngxBreadcrumbIcon` slot as the
   * `{ crumb }` context, and the consumer's slot renders it with whatever icon
   * system they use (`<mat-icon>{{ crumb.icon }}</mat-icon>`, an icon font,
   * inline SVG, `<app-icon>`). cngx ships no icon set and resolves no names.
   * Omit it and the leading icon slot simply renders nothing for that crumb.
   */
  readonly icon?: string;
  /**
   * Static lateral-navigation alternatives for this crumb. When present and
   * non-empty, {@link CngxBreadcrumbBar} auto-renders a
   * {@link CngxBreadcrumbSiblings} dropdown for the crumb - no consumer wiring.
   * Static data only; router-driven siblings compose through the
   * `*cngxBreadcrumbItemAccessory` slot instead (the bar stays free of
   * `@angular/router`). An empty array renders nothing (the dropdown self-hides).
   */
  readonly siblings?: readonly CngxBreadcrumbSibling[];
}

/**
 * One sibling in a {@link CngxBreadcrumbSiblings} dropdown - an alternative
 * page at the same trail level. `href` renders a navigable row; the active
 * level is marked `current`, which renders as `aria-current="page"` and drops
 * the link.
 *
 * @category ui/breadcrumb
 * @github https://github.com/cngxjs/cngx/blob/main/projects/ui/breadcrumb/breadcrumb.types.ts
 * @since 0.1.0
 * @relatedTo CngxBreadcrumbSiblings
 */
export interface CngxBreadcrumbSibling {
  /** Visible, and accessible, sibling text. */
  readonly label: string;
  /** Target for a navigable sibling. Omit (or set `current`) on the active level. */
  readonly href?: string;
  /** Marks the sibling representing the current level - rendered as `aria-current="page"`, no link. */
  readonly current?: boolean;
}
