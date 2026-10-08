/**
 * The breadcrumb section of a {@link CngxLanguagePack}: the accessible names of
 * the breadcrumb family. They feed the `ariaLabels` of `CNGX_BREADCRUMB_CONFIG`;
 * a key set through `withBreadcrumbAriaLabels` still wins. Route labels are app
 * copy and stay out of the pack: route data takes a `Signal` of the label.
 *
 * @category ui/breadcrumb/i18n
 * @since 0.1.0
 * @relatedTo CNGX_BREADCRUMB_CONFIG, withBreadcrumbAriaLabels
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
};

declare module '@cngx/core/i18n' {
  interface CngxLanguagePack {
    readonly breadcrumb: CngxBreadcrumbLanguageSection;
  }
}
