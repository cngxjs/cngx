/**
 * The stat-card section of a {@link CngxLanguagePack}: the state copy of
 * `CngxStatCard`. It feeds the `ariaLabels` of `CNGX_STAT_CARD_CONFIG`; a key
 * set through `withStatCardAriaLabels` or a bound copy input still wins.
 *
 * @category ui/stat-card/i18n
 * @since 0.1.0
 * @relatedTo CNGX_STAT_CARD_CONFIG, withStatCardAriaLabels
 */
export interface CngxStatCardLanguageSection {
  /** Accessible name announced while the tile is loading. */
  readonly busy: string;
  /** Headline of the error state shown when the first load failed. */
  readonly errorFallback: string;
  /** Note shown below stale numbers when a refresh failed. */
  readonly staleFallback: string;
  /** Headline of the empty state shown when a load settled with no data. */
  readonly emptyFallback: string;
}

/**
 * The English stat-card section: the single source of the stat card's English
 * copy. The `CNGX_STAT_CARD_CONFIG` labels default to it.
 *
 * @category ui/stat-card/i18n
 * @since 0.1.0
 * @relatedTo CNGX_STAT_CARD_CONFIG
 */
export const CNGX_STAT_CARD_LANGUAGE_EN: CngxStatCardLanguageSection = {
  busy: 'Loading',
  errorFallback: 'Could not load',
  staleFallback: 'Showing last known value',
  emptyFallback: 'No data',
};

declare module '@cngx/core/i18n' {
  interface CngxLanguagePack {
    readonly statCard: CngxStatCardLanguageSection;
  }
}
