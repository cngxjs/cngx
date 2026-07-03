/**
 * App-wide cascade for the breadcrumb family's ARIA labels and the router
 * `dataKey`.
 *
 * Resolution priority (high -> low):
 *   1. Per-instance Input binding (e.g. `[label]="'Trail'"`).
 *   2. `provideBreadcrumbConfigAt(...)` in a parent component's
 *      `viewProviders` (component-scoped override).
 *   3. `provideBreadcrumbConfig(...)` at the application root.
 *   4. Library defaults (English; merged in via `CNGX_BREADCRUMB_DEFAULTS`).
 *
 * Every key is optional - partial overrides deep-merge with the library
 * defaults, so consumers declare only the keys they want to override.
 *
 * @category ui/breadcrumb
 * @since 0.1.0
 */
export interface CngxBreadcrumbConfig {
  /**
   * ARIA-string fallbacks for the bar landmark and the overflow/siblings
   * dropdown triggers and lists. Per-instance `[label]`/`[triggerLabel]`/
   * `[menuLabel]` bindings still win over these.
   */
  readonly ariaLabels?: {
    /** Accessible name of the `nav` landmark on `CngxBreadcrumbBar`. */
    readonly bar?: string;
    /** Accessible name of the overflow ellipsis trigger. */
    readonly overflowTrigger?: string;
    /** Accessible name of the collapsed-crumb menu. */
    readonly overflowMenu?: string;
    /** Accessible name of the siblings chevron trigger. */
    readonly siblingsTrigger?: string;
    /** Accessible name of the sibling list. */
    readonly siblingsMenu?: string;
  };

  /**
   * Router-sync defaults shared by the trail (`CngxBreadcrumbRouterSync`)
   * and siblings (`CngxBreadcrumbSiblingsRouterSync`) route directives.
   */
  readonly router?: {
    /** Route-data key the router-sync directives read crumbs/siblings from. */
    readonly dataKey?: string;
  };
}
