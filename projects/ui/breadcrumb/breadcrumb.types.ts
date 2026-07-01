/**
 * One crumb in a {@link CngxBreadcrumbBar} trail. `href` renders a plain-link
 * crumb; `routerLink` carries an in-app route (consumed by the router-driven
 * mode). The terminal crumb needs neither - it is derived from position and
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
   * In-app route for a router-driven crumb. Reserved for the router-driven
   * mode; the base `[items]` trail renders `href` only and does not navigate
   * on `routerLink` (the bar stays free of `@angular/router`). Omit on the
   * terminal crumb.
   */
  routerLink?: unknown;
}
