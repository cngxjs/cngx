/**
 * Dependency-free check metadata for the `@cngx/doctor` project-wiring CLI.
 *
 * Mirrors the shape of the `@cngx/eslint-plugin` `RuleMetadata` interface
 * (`packages/eslint-plugin/src/metadata/index.ts`) - id / category / messages /
 * fixHint / recommendedSeverity - so a doctor finding is explainable identically
 * to a lint finding, and the future `cngx-doctor` interpreter skill reads one
 * record shape across both surfaces.
 *
 * This module imports nothing. Keep it that way: a published plugin is extracted
 * standalone, with no sibling `packages/eslint-plugin` on disk, so the records
 * are shipped here rather than imported cross-package.
 */

/**
 * @typedef {'wiring' | 'opt-in'} DoctorCheckCategory
 * @typedef {'error' | 'warn' | 'off'} DoctorCheckSeverity
 *
 * @typedef {object} DoctorCheckMetadata
 * @property {string} id
 * @property {DoctorCheckCategory} category
 * @property {Readonly<Record<string, string>>} messages
 * @property {string} fixHint
 * @property {DoctorCheckSeverity} recommendedSeverity
 */

/** @type {Readonly<Record<string, DoctorCheckMetadata>>} */
export const DOCTOR_CHECK_METADATA = {
  'toaster-without-withtoasts': {
    id: 'toaster-without-withtoasts',
    category: 'opt-in',
    messages: {
      toastsUsedWithoutOptIn:
        'CngxToaster/CngxToastOn is used but provideFeedback(withToasts()) is missing at the app root, so the toaster has no host to render into.',
      alertsUsedWithoutOptIn:
        'CngxAlerter/CngxAlertOn is used but provideFeedback(withAlerts()) is missing at the app root, so the alerter has no host to render into.',
      bannersUsedWithoutOptIn:
        'CngxBanner/CngxBannerOn is used but provideFeedback(withBanners()) is missing at the app root, so the banner has no host to render into.',
    },
    fixHint:
      'Add provideFeedback(withToasts()/withAlerts()/withBanners()) to the bootstrapApplication providers for the feedback surface you use.',
    recommendedSeverity: 'error',
  },
  'track-b-css-not-imported': {
    id: 'track-b-css-not-imported',
    category: 'wiring',
    messages: {
      trackBStylesheetMissing:
        "A cngx directive whose visual theming lives in the Track-B stylesheet is imported, but no app style entry imports '@cngx/themes/cngx.css', so it renders unstyled.",
    },
    fixHint: "Add @import '@cngx/themes/cngx.css'; to the app's global stylesheet.",
    recommendedSeverity: 'warn',
  },
  'floating-fallback-missing': {
    id: 'floating-fallback-missing',
    category: 'opt-in',
    messages: {
      floatingFallbackMissing:
        '@floating-ui/dom is installed but provideFloatingFallback() is never called, so browsers without CSS Anchor Positioning get no positioning fallback.',
    },
    fixHint:
      'Call provideFloatingFallback(computePosition, [offset(), flip(), shift()]) in the app providers, or remove @floating-ui/dom if unused.',
    recommendedSeverity: 'warn',
  },
};
