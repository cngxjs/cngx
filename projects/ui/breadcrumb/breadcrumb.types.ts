/**
 * One crumb in a {@link CngxBreadcrumbBar} trail. `href` renders a plain-link
 * crumb. The terminal crumb needs no target - it is derived from position and
 * rendered as the current page.
 *
 * @category ui/breadcrumb
 * @since 0.1.0
 * @relatedTo CngxBreadcrumbBar
 */
export interface CngxBreadcrumbCrumb {
  /** Visible, and accessible, crumb text. */
  label: string;
  /** Target for a plain-link crumb. Omit on the terminal crumb. */
  href?: string;
  /**
   * Reserved for in-app (SPA) navigation. Not yet wired this cycle: neither the
   * router-sync source nor the bundled bar template emits or binds it (the bar
   * stays free of `@angular/router`, so it renders `href` only). Present so a
   * consumer supplying their own source + template can carry a route; built-in
   * SPA-link support is a later release. Omit on the terminal crumb.
   */
  routerLink?: unknown;
}

/**
 * One sibling in a {@link CngxBreadcrumbSiblings} dropdown - an alternative
 * page at the same trail level. `href` renders a navigable row; the active
 * level is marked `current`, which renders as `aria-current="page"` and drops
 * the link.
 *
 * @category ui/breadcrumb
 * @since 0.1.0
 * @relatedTo CngxBreadcrumbSiblings
 */
export interface CngxBreadcrumbSibling {
  /** Visible, and accessible, sibling text. */
  label: string;
  /** Target for a navigable sibling. Omit (or set `current`) on the active level. */
  href?: string;
  /** Marks the sibling representing the current level - rendered as `aria-current="page"`, no link. */
  current?: boolean;
  /**
   * Reserved for in-app (SPA) navigation. Not yet wired this cycle: siblings
   * render `href` only (the same `@angular/router`-freedom decision as the bar).
   * Present so a consumer supplying their own template can carry a route;
   * built-in SPA-link support is a later release.
   */
  routerLink?: unknown;
}
