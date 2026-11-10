import type { CngxMessage } from '@cngx/core/i18n';

/**
 * The sidenav section of a {@link CngxLanguagePack}: the copy of `CngxSidenav`.
 * It feeds the `labels` of `CNGX_SIDENAV_CONFIG`; a key set through
 * `withSidenavLabels` still wins. Messages use `{name}` placeholders, numbers
 * are formatted for the locale.
 *
 * @since 0.1.0
 * @relatedTo CNGX_SIDENAV_CONFIG, withSidenavLabels
 */
export interface CngxSidenavLanguageSection {
  /** Accessible name of a `position="start"` rail while `[ariaLabel]` is unbound. */
  readonly startRegion: string;
  /** Accessible name of a `position="end"` rail while `[ariaLabel]` is unbound. */
  readonly endRegion: string;
  /** Accessible name of the resize separator while `[resizeLabel]` is unbound. */
  readonly resizeHandle: string;
  /**
   * `{value}` (the separator position as a percent of its min-max range,
   * formatted in the locale, `40%`), `{percent}` (the rounded number): the
   * separator's `aria-valuetext`.
   */
  readonly resizeValueText: CngxMessage;
  /** Spoken when the toggle hotkey hides the full nav. */
  readonly collapsedAnnouncement: string;
  /** Spoken when the toggle hotkey shows the full nav. */
  readonly expandedAnnouncement: string;
}

/**
 * The English sidenav section: the single source of the sidenav's English
 * copy. The `CNGX_SIDENAV_CONFIG` labels default to it.
 *
 * @since 0.1.0
 * @relatedTo CNGX_SIDENAV_CONFIG
 */
export const CNGX_SIDENAV_LANGUAGE_EN: CngxSidenavLanguageSection = {
  startRegion: 'Navigation',
  endRegion: 'Side panel',
  resizeHandle: 'Resize navigation',
  resizeValueText: '{value}',
  collapsedAnnouncement: 'Navigation collapsed',
  expandedAnnouncement: 'Navigation expanded',
};

declare module '@cngx/core/i18n' {
  interface CngxLanguagePack {
    readonly sidenav: CngxSidenavLanguageSection;
  }
}
