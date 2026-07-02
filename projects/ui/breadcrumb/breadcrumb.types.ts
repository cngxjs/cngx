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
