/**
 * `@cngx/core`
 *
 * The bare `@cngx/core` specifier ships the theming and bidi surface: the
 * preference axes (density, text scale, touch target, motion, contrast) with
 * their tokens, `provide*`/`inject*` pairs and host directives, the
 * `provideA11yPreferences` feature set, and the direction primitives
 * (`CNGX_DIRECTION`, `CngxDir`, the `resolveInline*`/`resolveStep*` helpers).
 *
 * The seven secondary entry points stay deep-import only. The primary entry
 * deliberately does not re-export them - re-exporting would couple the
 * primary bundle to every secondary for zero callers, and deep-importing
 * the secondary you need is the established convention. Do not "fix" that
 * with a re-export barrel.
 *
 *   `@cngx/core/tokens`           shared InjectionTokens (environment, window, form-field contracts)
 *   `@cngx/core/utils`            coercion, memoization, locale, async-state kernels, override merges
 *   `@cngx/core/i18n`             language packs: `provideCngxI18n`, `formatMessage`, section helpers
 *   `@cngx/core/i18n/en`          the English pack (`CNGX_LANGUAGE_EN`)
 *   `@cngx/core/i18n/de`          the German pack (`CNGX_LANGUAGE_DE`)
 *   `@cngx/core/testing`          test kits: `provideCngxTesting`, async-state mock, announcement capture
 *   `@cngx/core/testing/vitest`   Vitest matchers for the announcement capture
 *
 * The package also ships the `ng add` schematic for every `@cngx/*` package
 * and the `ng update` migration collection.
 *
 * `VERSION` is `@internal` (replaced at publish time) and is not consumer API.
 *
 * @since 0.1.0
 */

import { makeVersion } from '@cngx/utils';

/** @internal - replaced at publish time, not part of consumer API. */
export const VERSION = makeVersion('0.0.0-PLACEHOLDER');
