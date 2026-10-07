/**
 * The breadcrumb section of a {@link CngxLanguagePack}: the accessible names of
 * the breadcrumb family plus the translated route labels. The names feed the
 * `ariaLabels` of `CNGX_BREADCRUMB_CONFIG` (a key set through
 * `withBreadcrumbAriaLabels` still wins); `routes` translates a route whose
 * breadcrumb data is keyed (`{ key: 'orders', label: 'Orders' }`).
 *
 * @category ui/breadcrumb/i18n
 * @since 0.1.0
 * @relatedTo CNGX_BREADCRUMB_CONFIG, withBreadcrumbAriaLabels, CngxBreadcrumbRouteLabel
 */
export interface CngxBreadcrumbLanguageSection {
  /** Accessible name of the `nav` landmark on `CngxBreadcrumbBar`. */
  readonly bar: string;
  /** Accessible name of the overflow ellipsis trigger. */
  readonly overflowTrigger: string;
  /** Accessible name of the collapsed-crumb menu. */
  readonly overflowMenu: string;
  /** Accessible name of the siblings chevron trigger. */
  readonly siblingsTrigger: string;
  /** Accessible name of the sibling list. */
  readonly siblingsMenu: string;
  /**
   * Route labels by key: the app's own crumb names, looked up for route data
   * shaped `{ key, label }`. A key the record leaves out shows the route's
   * `label`. Empty in English.
   */
  readonly routes: Readonly<Record<string, string>>;
}

/**
 * The English breadcrumb section: the single source of the breadcrumb family's
 * English copy. The `CNGX_BREADCRUMB_CONFIG` names default to it.
 *
 * @category ui/breadcrumb/i18n
 * @since 0.1.0
 * @relatedTo CNGX_BREADCRUMB_CONFIG
 */
export const CNGX_BREADCRUMB_LANGUAGE_EN: CngxBreadcrumbLanguageSection = {
  bar: 'Breadcrumb',
  overflowTrigger: 'Show collapsed breadcrumbs',
  overflowMenu: 'Collapsed breadcrumbs',
  siblingsTrigger: 'Show sibling pages',
  siblingsMenu: 'Sibling pages',
  routes: {},
};

declare module '@cngx/core/i18n' {
  interface CngxLanguagePack {
    readonly breadcrumb: CngxBreadcrumbLanguageSection;
  }
}
