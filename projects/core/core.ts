/**
 * `@cngx/core`
 *
 * The bare `@cngx/core` specifier ships the theming and bidi surface: the
 * preference axes (density, text scale, touch target, motion, contrast) with
 * their tokens, `provide*`/`inject*` pairs and host directives, the
 * `provideA11yPreferences` feature set, and the direction primitives
 * (`CNGX_DIRECTION`, `CngxDir`, the `resolveInline*`/`resolveStep*` helpers).
 *
 * The two secondary entry points stay deep-import only. The primary entry
 * deliberately does not re-export them - re-exporting would couple the
 * primary bundle to both secondaries for zero callers, and deep-importing
 * the secondary you need is the established convention. Do not "fix" that
 * with a re-export barrel.
 *
 *   `@cngx/core/tokens`  shared InjectionTokens
 *   `@cngx/core/utils`   coercion helpers, memoization, async-state kernels
 *
 * `VERSION` is `@internal` (replaced at publish time) and is not consumer API.
 *
 * @since 0.1.0
 */

import { makeVersion } from '@cngx/utils';

/** @internal - replaced at publish time, not part of consumer API. */
export const VERSION = makeVersion('0.0.0-PLACEHOLDER');
