/**
 * The navigation rail section of a {@link CngxLanguagePack}: the copy of
 * `CngxNavRail`. It feeds `CNGX_NAV_RAIL_I18N`; a bound `[ariaLabel]` still
 * wins.
 *
 * @since 0.3.0
 * @relatedTo CNGX_NAV_RAIL_I18N, CngxNavRail
 */
export interface CngxNavRailLanguageSection {
  /** Accessible name of the rail's `navigation` landmark while `[ariaLabel]` is unbound. */
  readonly ariaLabel: string;
}

/**
 * The English navigation rail section: the single source of the rail's
 * English copy.
 *
 * @since 0.3.0
 * @relatedTo CNGX_NAV_RAIL_I18N
 */
export const CNGX_NAV_RAIL_LANGUAGE_EN: CngxNavRailLanguageSection = {
  ariaLabel: 'Navigation',
};

declare module '@cngx/core/i18n' {
  interface CngxLanguagePack {
    readonly navRail: CngxNavRailLanguageSection;
  }
}
