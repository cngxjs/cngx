/**
 * The navigation rail section of a {@link CngxLanguagePack}: the copy of
 * `CngxNavRail`. It feeds `CNGX_NAV_RAIL_I18N`; a bound `[ariaLabel]` still
 * wins.
 *
 * @since 0.3.0
 * @relatedTo CNGX_NAV_RAIL_I18N, CngxNavRail
 */
export interface CngxNavRailLanguageSection {
  /**
   * Accessible name of the `navigation` landmark of a `side="start"` rail
   * while `[ariaLabel]` is unbound.
   */
  readonly ariaLabel: string;

  /**
   * Accessible name of the `navigation` landmark of a `side="end"` rail while
   * `[ariaLabel]` is unbound, so a start rail and an end rail on one page never
   * share a name.
   */
  readonly endAriaLabel: string;
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
  endAriaLabel: 'Secondary navigation',
};

declare module '@cngx/core/i18n' {
  interface CngxLanguagePack {
    readonly navRail: CngxNavRailLanguageSection;
  }
}
