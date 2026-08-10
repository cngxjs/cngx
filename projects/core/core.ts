/**
 * `@cngx/core`
 *
 * Version-only umbrella entry. The bare `@cngx/core` specifier intentionally
 * exposes no public symbols; the consumer-facing surface lives in the two
 * secondary entry points below. The bare entry deliberately does not
 * re-export them - re-exporting would couple the primary bundle to both
 * secondaries for zero callers, and deep-importing the secondary you need is
 * the established convention. Do not "fix" the empty entry with a re-export
 * barrel.
 *
 *   `@cngx/core/tokens`  shared InjectionTokens
 *   `@cngx/core/utils`   coercion helpers, memoization, async-state kernels
 *
 * `VERSION` is `@internal` (replaced at publish time) and is not consumer API.
 *
 * @since 0.1.0
 */

import { makeVersion } from '@cngx/utils';

/** @internal — replaced at publish time, not part of consumer API. */
export const VERSION = makeVersion('0.0.0-PLACEHOLDER');
